# Phase 5: Character & Content Intelligence

**Features:** #5 AI Virality Scoring, #9 AI B-Roll Auto-Insertion, #55 Persistent Character Identity, #29 Multi-Face Simultaneous Lip Sync
**Timeline:** 3-4 weeks
**Theme:** Make existing systems smarter. Every feature here upgrades something already built.

---

## #5 AI Virality Scoring (Real-Time Editor Integration)

### What

The virality scoring engine (`viralityScorer.ts`) already exists with Gemini-based clip analysis producing hook/pacing/trend/emotion/visual/rewatch dimension scores. What is missing is real-time scoring during editing, score history with trend tracking, actionable improvement suggestions UI, and A/B comparison between project snapshots. This feature transforms virality scoring from a one-shot post-creation check into a live editing companion that continuously guides the creator toward more viral content.

### Tech Stack

- **Gemini 3.1 Flash Lite** (existing) -- scoring endpoint with Google Search grounding for trend matching
- **Web Workers** (`new Worker()`) -- offload score computation to avoid blocking the UI thread during editing
- **xxhash-wasm** (new, ~4KB) -- fast state hashing for cache invalidation; determines when project state has meaningfully changed
- **zustand** (existing) -- new `useViralityStore` for score state, history, and comparison snapshots
- **Recharts** or inline SVG (existing radar chart pattern in `PrePublishScore.tsx`) -- dimension breakdown visualization

### Existing Code to Modify

| File | Change |
|------|--------|
| `src/services/viralityScorer.ts` | Add `extractAudioMetrics()` to analyze hook strength in first 3 seconds (checks if dialogue or text overlay fires before frame `3*fps`). Add `calculatePacingScore()` counting cuts-per-minute from dialogue line count and stock media transitions. Expand `ClipMetadata` with `hookStrengthFirstThreeSeconds`, `cutsPerMinute`, `averageLineDuration`, `hasOpeningVisual`, `trendKeywords[]`. Debounce scoring calls with 2-second cooldown. |
| `src/components/panels/PrePublishScore.tsx` | Rename/refactor to consume from `useViralityStore` instead of calling `analyzeClipVirality` directly. Add score history sparkline. Add suggestion cards with one-click "Apply Fix" buttons (e.g., "Add a text hook" button calls copilot action `add-text`). |
| `src/types/orchestrator.ts` | Extend `ViralScore` with `timestamp: number`, `projectStateHash: string`, `audioMetrics?: AudioViralMetrics` fields. |
| `src/services/orchestrator/steps/qualityGate.ts` | After running quality checks, also populate `useViralityStore` with the final score so completion phase shows live data. |

### New Code to Create

| File | Purpose |
|------|---------|
| `src/stores/useViralityStore.ts` | Zustand store managing: `currentScore`, `scoreHistory[]` (last 20 scores with timestamps), `isScoring`, `lastScoredHash`, `comparisonSnapshots[]` (up to 3 named snapshots for A/B), `scoringConfig` (auto-score on/off, debounce interval). Actions: `triggerScore()`, `saveSnapshot(name)`, `clearHistory()`. |
| `src/services/viralityScoreWorker.ts` | Web Worker that receives serialized `ClipMetadata` + prompt, calls `_scoreViralityImpl`, returns `ViralScore`. Handles its own Gemini API call to keep main thread clean. Falls back to main-thread execution if Worker API unavailable. |
| `src/services/viralityStateHash.ts` | Computes a lightweight hash of project state (dialogue count, overlay count, character count, duration, template IDs, media IDs). Only triggers re-scoring when hash changes. Uses `xxhash-wasm` for sub-millisecond hashing. |
| `src/components/panels/ViralityPanel.tsx` | Full scoring panel: radar chart (reuse existing SVG pattern from PrePublishScore), dimension breakdown bars, suggestion cards, score history sparkline, comparison mode (side-by-side two snapshots), and "Score Now" manual trigger button. |
| `src/hooks/useAutoViralityScore.ts` | Hook that subscribes to relevant store changes (dialogue lines, text overlays, media items, templates, timeline duration) with a 2-second debounce. Computes state hash; if changed, dispatches scoring to the worker. |

### Data Flow

1. User edits the project (adds dialogue, changes text, adjusts timing).
2. `useAutoViralityScore` hook detects store changes via Zustand selectors on `useMultiCharacterStore`, `useTextOverlayStore`, `useMediaStore`, `useHTMLTemplateLayerStore`, `useSVGObjectStore`, `useTimelineStore`.
3. After 2 seconds of inactivity, hook computes state hash via `viralityStateHash.ts`.
4. If hash differs from `useViralityStore.lastScoredHash`, it calls `triggerScore()`.
5. `triggerScore()` sets `isScoring: true`, serializes `ClipMetadata` (via enhanced `extractClipMetadata()`), and posts to the Web Worker.
6. Worker calls Gemini API with Google Search grounding, receives `ViralScore` JSON.
7. Worker posts result back. Store updates `currentScore`, appends to `scoreHistory`, updates `lastScoredHash`.
8. `ViralityPanel.tsx` re-renders with updated radar chart, dimension bars, and suggestions.
9. User can click "Save Snapshot" to capture current score for later A/B comparison.

### Architecture Notes

- **Debounce, not throttle**: Use trailing-edge debounce (2s default, configurable up to 10s) so that rapid edits batch into a single API call. At Gemini Flash Lite pricing this keeps cost under $0.001 per score.
- **Hash-based deduplication**: The state hash prevents re-scoring when the user undoes/redoes without net change. xxhash-wasm is chosen over crypto.subtle.digest because it runs synchronously in <0.1ms for our data sizes.
- **Web Worker isolation**: Gemini API calls block on network I/O. Running in a Worker prevents any chance of janking the UI. The worker is spawned lazily on first score request and persists for the session.
- **Score cache**: Store the last 20 scores indexed by state hash in `useViralityStore`. If the user reverts to a previous state, the cached score is returned instantly without an API call.
- **Suggestion actions**: Each suggestion from Gemini maps to a copilot action ID (e.g., `"Add a text hook in the first 2 seconds"` maps to `add-text { content: "...", preset: "title", position: "top" }`). The panel renders an "Apply" button that dispatches the action through `copilotService.ts`.
- **Trade-off -- precision vs. cost**: Scoring every keystroke is wasteful. The 2-second debounce + hash dedup typically results in 1-3 API calls per minute of active editing, which is acceptable for Flash Lite pricing.

### Acceptance Criteria

- [ ] Virality score updates automatically within 5 seconds of a meaningful project edit (dialogue added/removed, text overlay changed, duration adjusted).
- [ ] Score does not re-trigger when project state has not meaningfully changed (undo then redo returns cached score).
- [ ] Radar chart displays all 6 dimensions (hook, pacing, trend, emotion, visual, rewatch) with values 0-100.
- [ ] Score history sparkline shows last 20 scores with timestamp hover.
- [ ] User can save up to 3 named snapshots and compare any two side-by-side.
- [ ] Suggestion cards display 3-5 actionable tips from Gemini. At least one suggestion has a functional "Apply" button.
- [ ] Scoring works in a Web Worker and does not block UI thread (no frame drops during scoring).
- [ ] Enhanced `ClipMetadata` includes hook-strength analysis (first 3 seconds), cuts-per-minute, and trend keywords.
- [ ] Quality gate step in orchestrator populates `useViralityStore` after clip generation.

---

## #9 AI B-Roll Auto-Insertion

### What

The Pixabay integration and orchestrator stock media step already exist, and `setupSmartBroll.ts` already implements gap-based B-roll insertion during orchestration. What is missing is an interactive, transcript-aware B-roll suggestion system that works during manual editing -- not just during orchestration. This feature analyzes what the speaker is talking about, extracts visual keywords, searches Pixabay, and presents ranked suggestions that the user can accept, reject, or swap with one click. It is the editorial assistant that says "while they talk about coffee, show this latte art clip."

### Tech Stack

- **Gemini 3.1 Flash Lite** (existing) -- transcript analysis and visual concept extraction (pattern from `setupSmartBroll.ts` `extractVisualConcepts()`)
- **Pixabay API** (existing via `pixabay.ts`) -- image and video search with scoring from `stockMediaIntelligence.ts`
- **useMediaStore** (existing) -- media asset management and canvas placement
- **useMultiCharacterStore** (existing) -- dialogue line access for transcript analysis
- **zustand** (existing) -- new `useBrollStore` for suggestion state

### Existing Code to Modify

| File | Change |
|------|--------|
| `src/services/orchestrator/steps/setupSmartBroll.ts` | Extract `extractVisualConcepts()` and `findDialogueGaps()` into a shared utility file (`src/services/brollIntelligence.ts`) so both the orchestrator step and the interactive panel can reuse them. The step itself becomes a thin wrapper that calls the shared functions. |
| `src/stores/useMediaStore.ts` | Add `addToCanvasWithTiming(assetId, startFrame, endFrame, role, transition)` convenience action that combines `addToCanvas` + `updateCanvasItem` in one call. This simplifies B-roll insertion from the suggestion panel. |
| `src/components/timeline/Timeline.tsx` | Add a B-roll suggestion indicator: small camera icon above gaps in the dialogue tracks where suggestions are available. Clicking the icon opens the B-roll suggestion popover for that gap. |

### New Code to Create

| File | Purpose |
|------|---------|
| `src/services/brollIntelligence.ts` | Shared B-roll intelligence: `extractVisualConcepts(dialogueTexts[])` (moved from setupSmartBroll), `findDialogueGaps(fps, totalFrames)` (moved), `analyzeSpeakerTopics(dialogueLines[])` (new -- groups consecutive lines by topic for longer B-roll segments), `rankBrollSuggestions(hits[], query, role)` (scoring wrapper). |
| `src/stores/useBrollStore.ts` | Zustand store: `suggestions: BrollSuggestion[]` (each has gap frame range, query, search results with thumbnails, accepted/rejected status), `isAnalyzing`, `selectedSuggestionId`. Actions: `analyzeTranscript()`, `acceptSuggestion(id)` (inserts media into canvas), `rejectSuggestion(id)`, `swapSuggestion(id, newHitIndex)`, `refreshSuggestions(id)` (re-search with different query). |
| `src/components/panels/BrollSuggestionPanel.tsx` | Panel component: shows list of dialogue gaps with suggested B-roll thumbnails. Each suggestion card shows: gap time range, visual concept query, 3-5 thumbnail options (horizontally scrollable), accept/reject/swap buttons, transition selector (fade/ken-burns/slide). Accepted suggestions show green checkmark; rejected show X. |
| `src/components/timeline/BrollGapIndicator.tsx` | Small icon component rendered above timeline gaps. Shows a camera icon with a count badge (e.g., "3 suggestions"). Click opens a mini popover with the top suggestion and quick accept/reject. |

### Data Flow

1. User clicks "Analyze for B-Roll" in the BrollSuggestionPanel (or it auto-triggers when dialogue lines change).
2. `useBrollStore.analyzeTranscript()` reads all dialogue lines from `useMultiCharacterStore`.
3. Calls `brollIntelligence.analyzeSpeakerTopics()` to group lines by topic.
4. Calls `brollIntelligence.findDialogueGaps()` to identify insertable time ranges.
5. For each gap, the nearest dialogue lines (before and after) provide context. `extractVisualConcepts()` generates Pixabay search queries via Gemini.
6. For each query, searches Pixabay (images first, videos if image results are poor) using `searchImagesWithFallback()` / `searchVideosWithFallback()` patterns from `setupStockMedia.ts`.
7. Results are scored with `scoreImageHit()` / `scoreVideoHit()` from `stockMediaIntelligence.ts` and ranked.
8. Store populates `suggestions[]` with gap ranges, queries, and top 5 results per gap.
9. `BrollSuggestionPanel` renders suggestion cards. `BrollGapIndicator` icons appear on the timeline.
10. User clicks "Accept" on a suggestion: `acceptSuggestion(id)` downloads the selected Pixabay asset as blob, adds to `useMediaStore`, places on canvas at the gap's frame range with ken-burns transition (images) or fade transition (videos).
11. User can "Swap" to pick a different result from the 5 options, or "Refresh" to re-search with a modified query.

### Architecture Notes

- **Reuse, not rebuild**: The core logic already exists in `setupSmartBroll.ts` and `setupStockMedia.ts`. This feature extracts it into shared modules and wraps it in an interactive UI. No new AI endpoints needed.
- **Lazy search**: Do not search Pixabay for all gaps simultaneously. Search one gap at a time as the user scrolls through suggestions, caching results. This avoids Pixabay rate limits (100 requests/minute).
- **Gap detection heuristics**: Minimum gap length is 1 second (matches existing `setupSmartBroll.ts` threshold). Gaps shorter than 0.5 seconds are ignored. Gaps longer than 5 seconds may get multiple B-roll items in sequence.
- **Transition defaults**: Images default to ken-burns (matches existing `ROLE_DEFAULT_ENTER` for cutaway). Videos default to fade. User can override per-suggestion.
- **Context window**: For visual concept extraction, send the dialogue line immediately before the gap AND the line immediately after. This gives Gemini bidirectional context for the query.
- **Trade-off -- interactive vs. auto**: The orchestrator's `setupSmartBroll` step runs automatically during generation. This feature is explicitly interactive during manual editing. Both share the same intelligence layer but have different UX: one is fire-and-forget, the other is suggestion-and-confirm.

### Acceptance Criteria

- [ ] "Analyze for B-Roll" scans all dialogue gaps and produces at least one suggestion per qualifying gap (>1 second).
- [ ] Each suggestion shows 3-5 thumbnail options from Pixabay search results.
- [ ] Accepting a suggestion inserts the media asset onto the canvas at the correct frame range with appropriate transition.
- [ ] Rejecting a suggestion removes it from the list and does not insert anything.
- [ ] "Swap" lets the user pick a different thumbnail from the pre-fetched results without a new API call.
- [ ] "Refresh" re-runs the Pixabay search with a new query (user-editable) for that gap.
- [ ] Timeline shows B-roll gap indicators (camera icons) at qualifying gaps when suggestions exist.
- [ ] Pixabay rate limit is respected: no more than 2 concurrent searches, with 500ms minimum between requests.
- [ ] Visual concept queries are contextually relevant (tested: a dialogue about "coffee roasting" produces queries like "coffee beans closeup" not "abstract background").

---

## #55 Persistent Character Identity Across Scenes

### What

`useSavedCharactersStore` and `useSaved3DCharactersStore` already save character templates with sprites, visemes, and part transforms. The orchestrator's `setupCharacters.ts` already fuzzy-matches saved characters by name. What is missing is a formal "character identity" layer that binds a named character (e.g., "Professor Max") to a specific saved character, voice, emotion mapping, and visual config so that when the orchestrator generates multi-scene series content, the same character identity guarantees visual and auditory consistency. Currently, each orchestration run independently fuzzy-matches characters, which can produce inconsistent results across episodes.

### Tech Stack

- **Supabase** (existing) -- persist character identities as a new table `character_identities`
- **zustand** (existing) -- new `useCharacterIdentityStore`
- **useSavedCharactersStore** / `useSaved3DCharactersStore` (existing) -- linked references
- **useVoiceStore** (existing) -- voice ID binding

### Existing Code to Modify

| File | Change |
|------|--------|
| `src/services/orchestrator/steps/setupCharacters.ts` | Before fuzzy-matching saved characters, first check `useCharacterIdentityStore` for an identity matching `planChar.name` or `planChar.savedCharacterName`. If found, use the identity's `savedCharacterId`, `voiceId`, and `defaultEmotion` directly, skipping fuzzy match. This ensures deterministic character resolution. |
| `src/stores/useOrchestratorStore.ts` | Add `selectedCharacterIdentityIds: string[]` to `OrchestratorSettings`. The orchestrator prompt builder includes identity names so Gemini uses consistent character names in the plan. |
| `src/services/orchestrator/planBuilder.ts` | When building the plan prompt, inject a "AVAILABLE CHARACTER IDENTITIES" section listing all identities with their names and descriptions. This guides Gemini to reference known characters by their identity names. |
| `src/types/orchestrator.ts` | Add `identityId?: string` to `ClipPlanCharacter` so the plan can explicitly reference a character identity. |
| `src/components/panels/orchestrator/SettingsSection.tsx` | Add a "Character Identities" selector that shows available identities with thumbnails. Selected identities are passed into orchestrator settings. |

### New Code to Create

| File | Purpose |
|------|---------|
| `src/types/characterIdentity.ts` | Types: `CharacterIdentity { id, name, description, savedCharacterId, saved3DCharacterId, voiceId, defaultEmotion, visualStyle, thumbnailUrl, createdAt, updatedAt }`. A character identity is a named binding that points to either a 2D saved character or a 3D saved character (not both). |
| `src/stores/useCharacterIdentityStore.ts` | Zustand + persist store: `identities: CharacterIdentity[]`, `selectedIdentityId`. Actions: `createIdentity(name, savedCharId, voiceId)`, `updateIdentity(id, updates)`, `deleteIdentity(id)`, `getIdentityByName(name)`, `getIdentityForSavedChar(savedCharId)`. Cloud sync to Supabase `character_identities` table. |
| `src/services/characterIdentityService.ts` | Service functions: `resolveCharacterFromIdentity(identityId)` returns the full saved character with hydrated sprites/visemes. `createIdentityFromDialogueCharacter(dialogueChar)` auto-creates an identity from a character currently on canvas. `matchPlanCharacterToIdentity(planChar, identities[])` implements exact-then-fuzzy matching with confidence scoring. |
| `src/components/panels/CharacterIdentityPanel.tsx` | UI panel: list of character identities with thumbnail, name, linked voice name, edit/delete actions. "Create Identity" button that pulls from current saved characters. Identity detail view shows the linked character preview, voice selector, and emotion default. |
| `sql/migrations/007_character_identities.sql` | Supabase migration: `character_identities` table with columns: `id uuid primary key`, `user_id uuid references auth.users`, `name text`, `description text`, `saved_character_id text`, `saved_3d_character_id text`, `voice_id text`, `default_emotion text`, `visual_style text`, `thumbnail_url text`, `created_at timestamptz`, `updated_at timestamptz`. RLS policy: users can only read/write their own identities. |

### Data Flow

1. User creates a character identity: picks a saved character from the library, assigns a name ("Professor Max"), selects a voice, optionally sets a default emotion.
2. `useCharacterIdentityStore.createIdentity()` persists to local store and syncs to Supabase.
3. When using the orchestrator, user selects character identities in the settings panel.
4. `planBuilder.ts` injects identity names and descriptions into the Gemini prompt.
5. Gemini generates a `ClipPlan` that references characters by identity name (e.g., `{ name: "Professor Max", identityId: "ident_123" }`).
6. `setupCharacters.ts` receives the plan. For each `planChar`, it first calls `matchPlanCharacterToIdentity(planChar, identities)`.
7. If a match is found, it resolves `savedCharacterId` and `voiceId` from the identity, skipping fuzzy match.
8. The character is added to `useMultiCharacterStore` with the identity's linked saved character and voice.
9. For series generation, the same identities are used across all episodes, ensuring "Professor Max" always looks and sounds the same.

### Architecture Notes

- **Identity vs. Saved Character**: A saved character is the raw asset (sprites, visemes, transforms). An identity is a named binding that adds context: which voice, which emotion default, which scenes this character appears in. One saved character can have multiple identities (e.g., "Young Max" and "Old Max" both using the same sprite set but different voices).
- **Migration path**: Existing projects with characters already on canvas get a one-time "Create Identities" prompt that auto-generates identities from current dialogue characters. This is optional and non-destructive.
- **Fuzzy match fallback**: If no identity matches, the existing fuzzy-match logic in `setupCharacters.ts` remains as fallback. Identity matching is additive, not replacing.
- **Series context**: The `OrchestratorSettings.seriesContext` already has `sharedCharacters?: string[]`. This feature connects those names to formal identities with visual + voice bindings.
- **Trade-off -- simplicity vs. expressiveness**: We store identity as a flat record rather than a nested graph (no "relationships between characters" or "character arcs"). This keeps the feature focused on visual/auditory consistency. Narrative intelligence is out of scope.

### Acceptance Criteria

- [ ] User can create a character identity from any saved 2D or 3D character.
- [ ] Identity includes: name, linked saved character, linked voice ID, default emotion, description.
- [ ] Orchestrator settings panel shows character identity selector with thumbnails.
- [ ] When selected identities are provided, the orchestrator plan references characters by identity name.
- [ ] `setupCharacters.ts` resolves characters via identity before falling back to fuzzy match.
- [ ] Same character identity produces visually and auditorily identical characters across two independent orchestrator runs.
- [ ] Character identities persist across browser sessions (Supabase sync).
- [ ] Deleting a character identity does not delete the underlying saved character.
- [ ] Series generation with `seriesContext.sharedCharacters` uses identity resolution.

---

## #29 Multi-Face Simultaneous Lip Sync

### What

`useMultiCharacterStore` already handles multi-character dialogue with sequential turn-taking (each `DialogueLine` has non-overlapping `startFrame`/`endFrame` ranges). `useDialoguePlayback` plays one audio at a time based on `getLineAtFrame()`, which returns a single line. What is missing is overlapping speech: two characters talking at the same time, each with independent lip sync, with proper audio mixing and visual rendering. This is essential for argument scenes, choral moments, and realistic group conversations where characters interrupt or respond simultaneously.

### Tech Stack

- **Web Audio API** (existing via `audioMixer.ts`) -- multi-track simultaneous playback with auto-ducking
- **ElevenLabs TTS** (existing via `elevenlabs.ts`) -- voice generation for each character independently
- **lipSync.ts** (existing) -- phoneme-to-viseme conversion, operates per-dialogue-line
- **CharacterComposite.tsx** (existing) -- renders visemes per character, already supports independent viseme indices

### Existing Code to Modify

| File | Change |
|------|--------|
| `src/stores/useMultiCharacterStore.ts` | `getLineAtFrame(frame)` currently returns a single `DialogueLine`. Add `getLinesAtFrame(frame): DialogueLine[]` that returns ALL lines whose `[startFrame, endFrame)` range contains the frame. The existing `getLineAtFrame` remains for backward compatibility but delegates to `getLinesAtFrame()[0]`. Remove any validation that prevents overlapping frame ranges when adding/updating dialogue lines. |
| `src/hooks/useDialoguePlayback.ts` | Replace single-audio tracking (`activeAudioRef`) with multi-audio tracking (`activeAudiosRef: Map<string, HTMLAudioElement>`). On each frame tick, compute which dialogue lines are active using `getLinesAtFrame()`. Start audio for newly-active lines, stop audio for no-longer-active lines. Multiple Audio elements play simultaneously. Apply volume ducking: when 2+ lines overlap, reduce secondary speaker volume by -6dB (configurable). |
| `src/components/canvas/CharacterComposite.tsx` | Currently receives a single `currentViseme` prop. Ensure it can receive viseme data independently per-character-instance. This is already the case since each `CharacterComposite` instance gets its own props from `CharacterLayer`, but verify the frame-synced viseme lookup in `CharacterLayer.tsx` uses `getLinesAtFrame` to find the line for THIS specific character during overlaps. |
| `src/components/canvas/CharacterLayer.tsx` | In the frame update logic, change from `getLineAtFrame(frame)` to `getLinesAtFrame(frame).find(l => l.characterId === character.id)` to get the viseme timeline for this specific character even when multiple characters are speaking. |
| `src/remotion/RemotionCharacter.tsx` | Same change as CharacterLayer: use `getLinesAtFrame` filtered by character ID for export rendering. |
| `src/services/audioMixer.ts` | Already supports multi-track mixing. Verify that overlapping dialogue tracks produce correct stereo positioning. Add optional `panPosition` (-1 to 1) to `AudioTrackSource` so overlapping speakers can be slightly panned left/right for clarity. |
| `src/components/panels/DialoguePanel.tsx` | Allow dragging dialogue lines to overlap in the timeline. Currently the panel may auto-reflow lines to be sequential. Add an "Allow Overlap" toggle. When enabled, users can position lines with overlapping frame ranges. |
| `src/components/timeline/DialogueTrack.tsx` | Render overlapping dialogue clips with slight vertical offset or transparency to visually distinguish them. Currently clips are rendered in a single row; overlapping clips should stack or use alpha blending. |

### New Code to Create

| File | Purpose |
|------|---------|
| `src/services/overlapMixer.ts` | Overlap-specific audio logic: `computeOverlapDucking(lines: DialogueLine[], frame, fps)` returns a `Map<lineId, volumeMultiplier>` based on overlap priority rules. Priority rules: (1) the line that started first is "primary" at full volume, (2) subsequent overlapping lines are "secondary" at -6dB, (3) if both started at the same frame, the character with higher z-index is primary. |
| `src/hooks/useOverlappingVisemes.ts` | Hook consumed by `CharacterLayer`: given a character ID and current frame, returns the active `VisemeEvent` for that character from potentially overlapping dialogue lines. Handles the case where a character has TWO active lines at the same frame (e.g., a character finishing one sentence while starting another -- rare but possible). In this case, the later-starting line takes priority. |

### Data Flow

1. User adds two dialogue lines for different characters with overlapping frame ranges (e.g., Character A speaks frames 30-90, Character B speaks frames 60-120).
2. ElevenLabs generates voice audio for each line independently (existing pipeline, no change).
3. Lip sync pipeline generates independent `visemeTimeline[]` for each line (existing pipeline, no change).
4. During playback, `useDialoguePlayback` on each frame:
   a. Calls `getLinesAtFrame(currentFrame)` -> returns both lines during frames 60-90.
   b. For each active line, starts (or continues) its Audio element.
   c. Calls `computeOverlapDucking()` to get volume multipliers. Sets `audio.volume` accordingly.
5. `CharacterLayer` for Character A calls `useOverlappingVisemes(charA.id, frame)` -> gets Character A's viseme at this frame from Line A's `visemeTimeline`.
6. `CharacterLayer` for Character B calls `useOverlappingVisemes(charB.id, frame)` -> gets Character B's viseme from Line B's `visemeTimeline`.
7. Both `CharacterComposite` instances render their respective viseme sprites simultaneously.
8. During export, `RemotionCharacter` uses the same per-character viseme resolution. `audioMixer.ts` mixes both dialogue audio tracks with ducking applied.

### Architecture Notes

- **No architectural overhaul needed**: The existing system is already multi-character with independent viseme timelines per dialogue line. The key change is allowing temporal overlap and handling multi-audio playback. The character rendering pipeline is already independent per character instance.
- **Priority-based ducking**: When two characters speak simultaneously, one must be "primary" (full volume) and the other "secondary" (reduced). The primary is the one whose line started first. This is a common convention in film audio. The user can override by adjusting per-line volume in a future iteration.
- **Stereo panning**: Optional enhancement -- pan primary speaker slightly left (-0.2) and secondary slightly right (+0.2) for spatial separation. This uses `StereoPannerNode` in Web Audio API, which `audioMixer.ts` can add to its per-track processing chain.
- **Reflow opt-out**: The existing `reflowDialogueFrames()` method in `useMultiCharacterStore` enforces sequential layout. When "Allow Overlap" is enabled in the dialogue panel, reflow should be disabled for the overlapping section. Add an `allowOverlap: boolean` flag to store state.
- **Trade-off -- complexity vs. realism**: True multi-speaker scenes in film use sophisticated audio ducking with sidechain compression. We use a simplified static -6dB reduction. This is good enough for animation; real-time dynamic sidechain would add latency and complexity disproportionate to benefit.
- **Export path**: `audioMixer.ts` already handles multi-track mixing with `OfflineAudioContext`. Overlapping dialogue tracks are simply two `AudioTrackSource` entries with overlapping `startTimeSec` values. The existing ducking logic (which ducks music under dialogue) needs extension to also handle dialogue-under-dialogue priority, but the architecture supports it.

### Acceptance Criteria

- [ ] Two dialogue lines for different characters can have overlapping frame ranges (not auto-reflowed to sequential).
- [ ] During playback, both characters' lip sync animates simultaneously during overlap frames.
- [ ] Audio for both speakers plays simultaneously during overlap with primary speaker at full volume and secondary at -6dB.
- [ ] Primary speaker is determined by which line started first.
- [ ] Timeline visually distinguishes overlapping dialogue clips (vertical offset or transparency).
- [ ] "Allow Overlap" toggle in DialoguePanel controls whether new lines can overlap.
- [ ] Export (WebCodecs/MediaRecorder) correctly renders overlapping lip sync and mixes overlapping audio.
- [ ] Seeking to a frame in the overlap region shows correct visemes for both characters.
- [ ] Existing sequential dialogue (no overlaps) works identically to current behavior (backward compatible).
- [ ] Performance: playback of 2 simultaneous speakers maintains 30fps on mid-range hardware.

---

## Related

- [[feature-list]] — Features #78 Virality Scoring, #75 B-Roll, #6 Character Identity, #19 Multi-Character
- [[feature-priorities]] — Virality (#12), B-Roll (#14), Character Identity (#8) priorities, with AI Content Generation and Specialized Modes scoring
- [[PROGRESS]] — Track completion status
- [[phase-4|Phase 4: Transcription Foundation]] — Previous phase (B-Roll depends on transcription)
- [[phase-6|Phase 6: Advanced Editing]] — Next phase
- [[orchestrator-creative]] — Orchestrator uses virality scoring and B-Roll
