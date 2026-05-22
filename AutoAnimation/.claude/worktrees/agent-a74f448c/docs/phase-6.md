# Phase 6: Advanced Editing & Content

**Features:** #22 Text-Based Video Editing, #7 Long-to-Short Clip Extraction, #33 Singing Character Videos, #38 A/B Testing, #23 Natural Language Timeline Editing
**Timeline:** 4-6 weeks
**Dependencies:** Phase 4 (transcription) must be complete for #22, #7, #23.
**Theme:** New editing paradigms -- edit by text, edit by voice, edit by AI.

---

## #22 Text-Based Video Editing

### What

Text-based editing lets users modify video content by editing the transcript text: delete a word and the corresponding frames are cut from the timeline, rearrange paragraphs and video segments reorder accordingly, correct a typo and the voice regenerates for that segment. This is the editing paradigm pioneered by Descript and ScreenFlow. The transcription infrastructure from Phase 4 provides word-level timestamps; `transcriptSync.ts` already implements `buildTranscript()`, `updateLineText()`, and `deleteLineAndClose()`. What is missing is a rich-text transcript editor with bidirectional sync to the timeline, visual word-frame mapping, and batch operations (cut selection, rearrange blocks).

### Tech Stack

- **Slate.js** (new dependency, ~50KB gzipped) -- rich text editor framework with custom elements, inline decorations, and programmatic selection control. Chosen over ProseMirror (steeper learning curve) and ContentEditable (insufficient structure). Slate's document model maps naturally to our dialogue-line-per-paragraph structure.
- **useMultiCharacterStore** (existing) -- dialogue lines with `startFrame`/`endFrame` as the source of truth
- **transcriptSync.ts** (existing) -- bidirectional sync utilities
- **useVoiceStore** (existing) -- word-level alignment data from ElevenLabs for precise word-to-frame mapping
- **useTimelineStore** (existing) -- timeline frame manipulation

### Existing Code to Modify

| File | Change |
|------|--------|
| `src/services/transcriptSync.ts` | Add `buildWordMap(lineId): WordFrameMapping[]` that uses ElevenLabs alignment data (`WordEvent[]` from the dialogue line's `wordTimeline`) to create a per-word mapping of `{ word, startFrame, endFrame, charOffsetStart, charOffsetEnd }`. Add `deleteWordRange(lineId, charStart, charEnd)` that removes words and adjusts timeline frames. Add `splitLineAtOffset(lineId, charOffset)` that splits a dialogue line into two at a word boundary. Add `mergeLines(lineIdA, lineIdB)` that concatenates two adjacent lines. |
| `src/stores/useMultiCharacterStore.ts` | Add `insertDialogueLine(afterLineId, line)` that inserts a new line immediately after a specified line (for paragraph-level rearranging). Add `splitDialogueLine(lineId, splitFrame)` that creates two lines from one at a frame boundary. |
| `src/hooks/useDialoguePlayback.ts` | Add `seekToWord(lineId, wordIndex)` that seeks the playhead to the start frame of a specific word. Used when the user clicks a word in the transcript editor. |
| `src/components/panels/DialoguePanel.tsx` | Add a "Text Edit Mode" toggle. When enabled, the panel switches from the card-based dialogue editor to the full transcript editor (`TranscriptEditorPanel`). |

### New Code to Create

| File | Purpose |
|------|---------|
| `src/components/panels/TranscriptEditorPanel.tsx` | Main transcript editor component. Renders a Slate.js editor with custom `ParagraphElement` (one per dialogue line, with character name/color header), `WordLeaf` (individual words with click-to-seek behavior), and `GapElement` (visual divider between non-adjacent lines showing gap duration). Toolbar: cut selection, undo, redo, regenerate voice for modified lines, speaker assignment dropdown. The editor decorates the currently-playing word with a highlight (synced to playback frame). |
| `src/services/transcriptEditor.ts` | Bidirectional sync engine: `slateDocFromDialogue(lines[], wordMaps[])` converts dialogue state to Slate document. `dialogueFromSlateDoc(doc)` converts back. `diffSlateChanges(oldDoc, newDoc)` computes minimal set of timeline operations (delete frames, move frames, update text). `applyTimelineOps(ops[])` executes the operations on `useMultiCharacterStore` and `useTimelineStore`. |
| `src/hooks/useTranscriptSync.ts` | Hook that maintains bidirectional binding: subscribes to `useMultiCharacterStore` changes and updates the Slate editor state (timeline-to-text direction), and handles Slate `onChange` events to compute and apply timeline operations (text-to-timeline direction). Includes a lock mechanism to prevent infinite update loops (when timeline changes trigger text changes which trigger timeline changes). |
| `src/services/transcriptEditorOps.ts` | High-level editing operations: `deleteSelectedText(editor, selection)` -- removes selected words and corresponding frames, closes gaps by shifting subsequent lines. `rearrangeParagraphs(editor, fromIndex, toIndex)` -- moves a dialogue line and its frames to a new position. `changeCharacterForParagraph(editor, paragraphIndex, newCharacterId)` -- reassigns a dialogue line to a different character. `regenerateVoiceForLine(lineId)` -- flags a modified line for voice regeneration via ElevenLabs. |
| `src/types/transcriptEditor.ts` | Slate custom types: `TranscriptElement = ParagraphElement | GapElement`, `ParagraphElement { type: 'paragraph', lineId, characterId, characterName, color, children: WordNode[] }`, `WordNode { text, wordIndex, startFrame, endFrame }`, `GapElement { type: 'gap', durationFrames }`. |

### Data Flow

1. User opens "Text Edit Mode" in the DialoguePanel.
2. `useTranscriptSync` hook initializes: reads all dialogue lines from `useMultiCharacterStore`, builds word maps from ElevenLabs alignment data via `transcriptSync.buildWordMap()`.
3. `slateDocFromDialogue()` converts dialogue lines + word maps into a Slate document with paragraphs per line, words as text nodes with frame metadata.
4. `TranscriptEditorPanel` renders the Slate document. Each paragraph shows character name in color, each word is clickable (seeks playhead to that word's start frame).
5. **Text-to-Timeline sync**: User deletes a word in the editor -> Slate `onChange` fires -> `useTranscriptSync` computes diff via `diffSlateChanges()` -> identifies "delete frames X-Y" operation -> `applyTimelineOps()` calls `useMultiCharacterStore.updateDialogueLine()` to shrink the frame range and updates the word timeline, then shifts subsequent lines by the deleted duration.
6. **Timeline-to-Text sync**: User drags a dialogue clip in the timeline -> `useMultiCharacterStore` updates -> `useTranscriptSync` detects change -> updates Slate document to reflect new ordering.
7. **Paragraph rearrange**: User drags a paragraph in the editor (Slate drag-and-drop) -> `rearrangeParagraphs()` reorders dialogue lines in `useMultiCharacterStore` and adjusts all frame positions.
8. **Voice regeneration**: When text is modified beyond simple deletion (word changed, sentence rewritten), the line is flagged with a "regeneration needed" badge. User clicks "Regenerate" to re-run ElevenLabs TTS for that line, which updates the word timeline and viseme timeline.

### Architecture Notes

- **Word-level precision requires alignment data**: This feature is only useful when ElevenLabs alignment data is available (provides word-level timestamps). Without alignment, only line-level operations work (delete/rearrange whole lines). The editor degrades gracefully: without word maps, words are non-interactive text and only paragraph-level operations are available.
- **Sync lock mechanism**: Bidirectional sync creates a feedback loop risk. The `useTranscriptSync` hook uses a simple boolean lock: when applying changes in one direction, suppress change handlers in the other direction. The lock releases after a microtask (`queueMicrotask`).
- **Undo integration**: Both Slate (built-in undo) and Zustand (zundo temporal middleware) have undo stacks. These must be coordinated. Strategy: treat the Slate editor as the primary undo source during text editing mode. Each Slate undo triggers the corresponding timeline undo via `applyTimelineOps` in reverse.
- **Voice regeneration cost**: Each regeneration costs ElevenLabs credits. The editor shows a "Modified" badge on changed lines but does NOT auto-regenerate. The user explicitly triggers regeneration for cost control.
- **Trade-off -- Slate vs. simpler approach**: A simpler approach would be a custom textarea with manual character-offset tracking. Slate adds ~50KB but provides: proper cursor management across paragraph boundaries, drag-and-drop paragraph reordering, inline decorations for word highlighting, and undo/redo. The complexity is justified for a professional-grade editing experience.

### Acceptance Criteria

- [ ] Transcript editor displays all dialogue lines as paragraphs with character name/color headers.
- [ ] Clicking a word in the transcript seeks the playhead to that word's start frame.
- [ ] Deleting a word from the transcript removes the corresponding frames from the timeline and closes the gap.
- [ ] Deleting a selection of words spanning multiple lines correctly adjusts all affected lines and shifts subsequent content.
- [ ] Dragging a paragraph to a new position rearranges the dialogue line order and frame positions.
- [ ] Playback highlights the currently-speaking word in the transcript editor.
- [ ] Modified lines show a "Regenerate Voice" button. Clicking it re-generates TTS and updates alignment.
- [ ] Timeline changes (dragging clips) are reflected in the transcript editor ordering.
- [ ] Undo/redo works correctly for both text edits and the corresponding timeline operations.
- [ ] Without ElevenLabs alignment data, the editor still works at paragraph (line) level.

---

## #7 Long-to-Short Clip Extraction

### What

Upload a long-form video (podcast, lecture, webinar) and the system automatically identifies the most viral-worthy moments, extracts them as short clips, scores each for virality, and lets the user generate polished short-form videos from the best segments. The transcription infrastructure from Phase 4 provides word-level timestamps. `clipExtractor.ts` already implements Gemini-based clip identification from transcript segments. `sceneDetector.ts` adds visual scene boundary detection via Gemini Vision. What is missing is: a complete end-to-end pipeline from video upload to generated short clips, visual preview of extracted segments, server-side video slicing, and integration with the orchestrator to polish extracted clips into finished products.

### Tech Stack

- **FFmpeg WASM** (`@ffmpeg/ffmpeg` ~30MB, loaded on demand) -- client-side video slicing for preview. Avoids server round-trip for quick previews. Falls back to server-side FFmpeg for final export.
- **Gemini 3.1 Flash Lite** (existing) -- transcript analysis for clip identification (via `clipExtractor.ts`)
- **Gemini Vision** (existing) -- scene detection and visual analysis (via `sceneDetector.ts`)
- **Whisper** (existing from Phase 4) -- audio transcription with word-level timestamps
- **Virality Scorer** (existing + Phase 5 enhancements) -- score each extracted clip
- **Web Workers** -- FFmpeg runs in a Worker to avoid blocking main thread

### Existing Code to Modify

| File | Change |
|------|--------|
| `src/services/clipExtractor.ts` | Enhance `ExtractedClip` with `thumbnailDataUrl`, `videoPreviewUrl` (blob URL of sliced segment), `sceneTransitions[]` (visual cut points within the clip), `emotionalArc` (rising/falling/flat). Add `rewriteClipHook(clip)` that uses Gemini to generate an attention-grabbing opening line. |
| `src/services/sceneDetector.ts` | Add `detectScenesInRange(videoFile, startSec, endSec, onProgress)` variant that only analyzes a sub-range of the video. Add `scoreMomentVisually(frame, context)` that scores a single frame for visual interest (composition, facial expression, motion). |
| `src/stores/useRepurposeStore.ts` | Expand store with: `sourceVideoFile: File | null`, `sourceVideoUrl: string | null`, `sourceVideoDuration: number`, `isSlicing: boolean`, `slicedPreviews: Map<clipId, blobUrl>`. Add `uploadSourceVideo(file)`, `slicePreview(clipId)`, `generateShortFromClip(clipId)` actions. |
| `src/components/panels/RepurposePanel.tsx` | Expand from transcript-only to full video import flow: video upload zone, transcription progress, clip extraction results with video previews, ranking by virality score, and "Generate Short" button per clip. |

### New Code to Create

| File | Purpose |
|------|---------|
| `src/services/videoSlicer.ts` | FFmpeg WASM wrapper: `initFFmpeg()` (lazy load the ~30MB WASM binary on first use, cache in IndexedDB), `sliceVideo(videoFile, startSec, endSec, outputFormat?)` returns a `Blob` of the sliced segment. `extractAudioTrack(videoFile)` extracts audio as WAV for Whisper transcription. Runs in a Web Worker via `videoSlicerWorker.ts`. |
| `src/services/videoSlicerWorker.ts` | Web Worker that loads FFmpeg WASM and processes slice requests. Communicates with main thread via `postMessage`. Handles: slice, extract audio, generate thumbnail at timestamp. |
| `src/services/clipRanker.ts` | Ranking engine that combines multiple signals: `viralityScore` (from `clipExtractor.ts`), `visualInterestScore` (from `sceneDetector.ts` visual analysis), `audioEnergyScore` (loud/dynamic segments rank higher), `hookPotentialScore` (first 3 seconds analyzed for attention-grab). Produces a composite `ClipRank { clipId, compositeScore, breakdown }`. |
| `src/components/panels/ClipExtractionPanel.tsx` | Sub-panel of RepurposePanel: shows extracted clips as a ranked list. Each card shows: thumbnail, title, duration, virality radar mini-chart, "Preview" button (plays sliced segment), "Generate Short" button (sends clip to orchestrator), "Edit Hook" inline editor for the rewritten hook text. Sorting: by composite score, duration, or chronological order. |
| `src/components/panels/ClipPreviewModal.tsx` | Modal that plays a sliced video preview. Shows the rewritten hook text overlaid, extracted transcript segment, and buttons: "Generate Short" (full orchestrator pipeline), "Quick Export" (raw slice with captions only), "Adjust Boundaries" (trim start/end with frame-precise slider). |
| `src/services/clipToOrchestrator.ts` | Bridge service: `convertClipToOrchestratorInput(clip, options)` creates an orchestrator prompt and settings pre-configured for the extracted clip. Injects the transcript as dialogue, sets duration from clip boundaries, pre-selects aspect ratio (9:16 for shorts), enables captions and stock media. User reviews the orchestrator plan before execution. |

### Data Flow

1. User uploads a long-form video file via `RepurposePanel` drag-and-drop.
2. `useRepurposeStore.uploadSourceVideo(file)` stores the file, creates an object URL, reads duration.
3. `videoSlicer.extractAudioTrack(file)` extracts the audio track as WAV in the Web Worker.
4. Audio is sent to Whisper (Phase 4 transcription) -> returns `WhisperResult` with word-level segments.
5. `useRepurposeStore.setSourceTranscript(result)` stores the transcript.
6. `clipExtractor.extractBestClips(segments, duration)` sends transcript to Gemini -> returns 3-5 `ExtractedClip` candidates with time boundaries, titles, hook rewrites, and virality scores.
7. Simultaneously, `sceneDetector.detectScenes(file)` extracts frames at 2-second intervals and sends to Gemini Vision -> returns scene boundaries with visual descriptions and scores.
8. `clipRanker.rankClips(extractedClips, detectedScenes)` combines transcript analysis and visual analysis into composite rankings.
9. For each clip, `videoSlicer.sliceVideo(file, startSec, endSec)` generates a preview blob in the Worker.
10. `ClipExtractionPanel` renders ranked cards with thumbnails and preview playback.
11. User clicks "Generate Short" on a clip -> `clipToOrchestrator.convertClipToOrchestratorInput()` creates orchestrator input -> opens orchestrator panel in review phase with pre-filled plan.
12. User reviews and executes the orchestrator plan -> produces a polished short-form video from the extracted segment.

### Architecture Notes

- **FFmpeg WASM size**: ~30MB initial download, cached in IndexedDB after first load. Show a one-time download progress bar. For users who only use this feature once, the cost is high. Consider: offer server-side slicing as an alternative for users with slow connections. The server route would use native FFmpeg and return sliced segments via a temporary URL.
- **Parallel processing**: Transcription and scene detection can run in parallel since one only needs audio and the other only needs video frames. This halves the total processing time.
- **Preview vs. final quality**: FFmpeg WASM preview slices are re-encoded at medium quality (CRF 28) for speed. Final export uses the orchestrator's full rendering pipeline for production quality.
- **Frame-precise boundaries**: Whisper timestamps are word-level (start/end in seconds). Video keyframes may not align. For preview, we accept the nearest keyframe. For export, we specify `-ss` before `-i` in FFmpeg for keyframe-precise seeking.
- **Trade-off -- client-side vs. server-side FFmpeg**: Client-side avoids upload latency for large files (a 1-hour video could be 2GB+). Server-side avoids the 30MB WASM download and is faster for processing. We use client-side for preview (fast feedback) and server-side for final slicing (quality). Both paths produce the same output.
- **Orchestrator integration**: The extracted clip becomes input to the orchestrator, not a standalone product. This means the user gets all the power of the orchestrator (characters, B-roll, motion graphics, captions) applied to the extracted segment. The "Quick Export" option bypasses the orchestrator for users who just want a captioned raw clip.

### Acceptance Criteria

- [ ] User can upload a video file (MP4, WebM, MOV) up to 2GB.
- [ ] Audio is extracted and transcribed with word-level timestamps within 2 minutes for a 30-minute video.
- [ ] System identifies 3-5 clip candidates with time boundaries, titles, and virality scores.
- [ ] Each clip shows a video preview (sliced segment) that plays in-browser.
- [ ] Clips are ranked by composite score combining transcript analysis and visual interest.
- [ ] "Generate Short" button pre-fills the orchestrator with the clip's transcript, duration, and settings.
- [ ] "Adjust Boundaries" allows trim of start/end with frame-level precision.
- [ ] FFmpeg WASM downloads once and is cached for subsequent uses.
- [ ] Processing (transcription + scene detection) runs in parallel and shows progress indicators.
- [ ] "Quick Export" produces a captioned short clip without full orchestrator processing.

---

## #33 Singing Character Videos

### What

Characters can currently lip-sync to spoken dialogue via the phoneme-to-viseme pipeline. Singing lip sync is fundamentally different: vowels are sustained (held open for beats), consonant transitions are faster, mouth width correlates with pitch, and the viseme rhythm follows musical beats rather than speech patterns. This feature adds a music-to-viseme mapping mode that drives the same 9-viseme system (`Rest`, `Aa`, `Ee`, `Oh`, `Oo`, `FV`, `MBP`, `DTL`, `ChR`) but with singing-specific rules. Users upload a song audio file, the system generates singing lip sync, and the character's mouth animates to the music.

### Tech Stack

- **Web Audio API** (`AnalyserNode`, `AudioContext`) -- real-time audio analysis for pitch detection, beat detection, and amplitude envelope
- **pitchfinder** (new dependency, ~8KB) -- pitch detection algorithms (YIN, AMDF) for mapping sung notes to mouth openness
- **Essentia.js** (new, optional, ~200KB WASM) -- professional music analysis: beat tracking, onset detection, spectral analysis. Falls back to simpler Web Audio analysis if not loaded.
- **lipSync.ts** (existing) -- extend with music mode functions
- **CharacterComposite.tsx** (existing) -- no changes needed; viseme rendering is already generic

### Existing Code to Modify

| File | Change |
|------|--------|
| `src/services/lipSync.ts` | Add `generateSingingVisemes(audioBuffer, bpm?, lyrics?)` that returns `VisemeEvent[]` using music-mode rules. Add `SINGING_AMPLITUDE_TO_VISEME` map that maps amplitude ranges to viseme types (high amplitude -> wide open Aa/Oh, low amplitude -> Ee/Oo). Add `applyBeatEmphasis(visemes[], beats[])` that widens mouth openness on beat emphasis frames. |
| `src/types/voice.ts` | Add `SingingVisemeConfig { mode: 'singing', bpm?: number, pitchSensitivity: number, beatEmphasis: number, vibratoSpeed: number }`. Add `lyrics?: LyricLine[]` to support optional time-aligned lyrics for more precise viseme mapping. |
| `src/stores/useVoiceStore.ts` | Add `singingConfig: SingingVisemeConfig | null`, `singingAudioFile: File | null`, `singingAudioUrl: string | null`. Actions: `setSingingAudio(file)`, `generateSingingVisemes()`, `clearSinging()`. |
| `src/stores/useMultiCharacterStore.ts` | Add `singingLineId?: string` to `DialogueCharacter` -- references a special "singing" dialogue line with viseme data but no spoken audio generation (audio comes from the uploaded song). |
| `src/hooks/useDialoguePlayback.ts` | When a dialogue line's source is "singing" (detected by missing `generatedVoiceId` but having `audioUrl` set to the uploaded song), play the song audio directly instead of generated TTS. |

### New Code to Create

| File | Purpose |
|------|---------|
| `src/services/singingLipSync.ts` | Core singing lip sync engine. `analyzeSongAudio(audioBuffer)` returns `SongAnalysis { bpm, beats[], onsets[], amplitudeEnvelope[], pitchTrack[] }`. `generateSingingVisemeTimeline(analysis, config)` maps analysis to `VisemeEvent[]` using rules: (1) amplitude determines mouth openness (high=Aa, medium=Oh/Ee, low=Oo/MBP, silence=Rest), (2) pitch determines mouth width (high pitch=wider shapes like Ee, low pitch=rounded shapes like Oh/Oo), (3) beat onsets trigger transient wide-open (Aa) for 50ms then settle, (4) vibrato oscillates between adjacent visemes at vibrato frequency. |
| `src/services/singingAnalyzer.ts` | Audio analysis utilities: `detectBPM(audioBuffer)` using autocorrelation, `detectBeats(audioBuffer, bpm)` returns beat timestamps, `detectOnsets(audioBuffer)` returns onset timestamps (consonant/attack points), `extractAmplitudeEnvelope(audioBuffer, windowSize)` returns per-frame amplitude, `extractPitchTrack(audioBuffer, windowSize)` returns per-frame pitch in Hz using pitchfinder. |
| `src/services/lyricsParser.ts` | Parse time-aligned lyrics formats: `parseLRC(text)` for LRC format (common karaoke format), `parseSRT(text)` for SRT lyrics. Returns `LyricLine { startTime, endTime, text, words?: LyricWord[] }`. When lyrics are provided, singing lip sync uses phoneme-level mapping (similar to speech but with sustained vowels). `enhanceVisemesWithLyrics(visemes[], lyrics[])` overlays phoneme-derived visemes on top of amplitude-derived visemes for higher quality. |
| `src/components/panels/SingingPanel.tsx` | UI panel: upload song audio file, optional BPM override, optional lyrics file upload (LRC/SRT), character selector (which character sings), preview controls, singing config sliders (pitch sensitivity 0-1, beat emphasis 0-1, vibrato speed). Shows waveform with detected beats and a viseme preview strip. |
| `src/components/canvas/SingingVisemePreview.tsx` | Canvas overlay that shows a real-time viseme strip during singing preview: a horizontal bar showing upcoming visemes color-coded by type, synced to audio playback. Useful for verifying lip sync quality before committing. |

### Data Flow

1. User opens SingingPanel, uploads a song audio file (MP3, WAV, OGG).
2. `useVoiceStore.setSingingAudio(file)` stores the file, creates object URL, decodes to `AudioBuffer`.
3. `singingAnalyzer.ts` runs analysis: BPM detection, beat tracking, onset detection, amplitude envelope, pitch track. This takes 2-5 seconds for a typical song.
4. Optionally, user uploads LRC/SRT lyrics file -> `lyricsParser.ts` parses into `LyricLine[]`.
5. User selects which character will sing and adjusts config sliders.
6. `singingLipSync.generateSingingVisemeTimeline(analysis, config)` generates `VisemeEvent[]`:
   - Each frame maps to a viseme based on amplitude (primary driver) and pitch (secondary driver).
   - Beat emphasis frames get a 50ms Aa burst.
   - If lyrics are provided, `enhanceVisemesWithLyrics()` overrides amplitude-derived visemes with phoneme-derived visemes where word boundaries are known.
7. A special `DialogueLine` is created for the singing character with the generated `visemeTimeline`, `audioUrl` pointing to the uploaded song, and no `generatedVoiceId` (indicating singing mode).
8. During playback, `useDialoguePlayback` detects the singing line (has audioUrl, no generatedVoiceId) and plays the song audio directly.
9. `CharacterLayer` reads the singing line's `visemeTimeline` normally -- the character's mouth animates to the music.
10. For export, the song audio is mixed by `audioMixer.ts` as a dialogue track, and the singing visemes drive the Remotion character renderer.

### Architecture Notes

- **Amplitude is king**: For singing, mouth amplitude correlates most strongly with the singing signal. Pitch is secondary (affects shape more than openness). This is the inverse of speech lip sync where phoneme identity is primary.
- **Beat emphasis**: On strong beats (1 and 3 in 4/4 time), the singer typically opens their mouth wider. We apply a 50ms Aa pulse on detected beats, then lerp back to the amplitude-derived viseme. The beat emphasis strength is configurable (0 = no emphasis, 1 = full Aa on every beat).
- **Vibrato handling**: Sustained notes with vibrato should oscillate the viseme between adjacent shapes (e.g., Oh <-> Aa) at the vibrato frequency (typically 4-7 Hz). `extractPitchTrack` detects vibrato as periodic pitch fluctuation; the viseme generator converts this to alternating viseme events.
- **Lyrics as quality boost**: Without lyrics, singing lip sync is ~70% quality (amplitude-driven, no consonant accuracy). With time-aligned lyrics, quality jumps to ~90% (phoneme-driven for consonants, amplitude-driven for sustain). The lyrics path reuses the existing `PHONEME_TO_VISEME` map from `lipSync.ts` for consonant mapping.
- **No new rendering changes**: The character composite already renders whatever viseme index it receives per frame. Singing visemes go through the exact same pipeline as speech visemes. The only difference is the generation algorithm.
- **Trade-off -- Essentia.js vs. Web Audio API**: Essentia.js provides professional-grade beat tracking (superior to autocorrelation) but adds ~200KB WASM. We make it optional: if loaded, use it for beat/onset detection. If not, fall back to simpler autocorrelation BPM and spectral flux onset detection. The fallback is 80% as accurate for most pop/rock music.

### Acceptance Criteria

- [ ] User can upload MP3/WAV/OGG song files and generate singing lip sync for a character.
- [ ] Character's mouth animates in sync with the music during playback.
- [ ] Mouth opens wider on loud parts and closes during quiet/silent sections.
- [ ] Beat emphasis is visible: mouth snaps wider on strong beats.
- [ ] BPM detection is accurate to within +/-2 BPM for songs with clear beat (verified on 5 test songs).
- [ ] Optional LRC/SRT lyrics improve lip sync quality with consonant accuracy.
- [ ] Config sliders (pitch sensitivity, beat emphasis, vibrato speed) produce visible changes in lip sync behavior.
- [ ] Singing mode works with all character types (2D sprite, 2D rigged, 3D).
- [ ] Export includes the song audio mixed with any other audio tracks.
- [ ] Performance: singing viseme generation completes in under 5 seconds for a 3-minute song.

---

## #38 A/B Testing of Video Variations

### What

The orchestrator already supports variant generation (`variantCount` in settings, `ExecutedVariant[]` in store, `generateVariations()` action). The current implementation generates plan variations via Gemini but lacks: controlled variable isolation (change one thing at a time), side-by-side comparison UI with synced playback, statistical scoring across dimensions, and a "pick winner" workflow. This feature completes the A/B testing loop from variation generation through comparison to selection.

### Tech Stack

- **Orchestrator** (existing) -- plan generation and execution pipeline
- **Virality Scorer** (existing + Phase 5) -- per-variant scoring
- **Remotion Player** (existing) -- side-by-side video preview
- **useOrchestratorStore** (existing) -- `variations[]`, `executedVariants[]`, `selectedVariantIndex`
- **zustand** (existing) -- new `useABTestStore` for test configuration

### Existing Code to Modify

| File | Change |
|------|--------|
| `src/stores/useOrchestratorStore.ts` | Extend `generateVariations()` to accept a `VariationConfig` parameter specifying which variables to change. Currently it re-prompts Gemini for each variant. Instead, use structured variation: mutate specific fields of the base plan (voice, text style, character position, music mood, template) while keeping everything else identical. Add `compareVariants(indexA, indexB)` action that computes a diff between two variants. |
| `src/types/orchestrator.ts` | Add `VariationConfig { variables: VariationVariable[], strategy: 'isolated' | 'random' | 'guided' }`. Add `VariationVariable { field: 'voice' | 'musicMood' | 'textStyle' | 'characterPosition' | 'template' | 'aspectRatio' | 'captionStyle' | 'pacing', values?: string[] }`. Add `VariantComparison { variantA: number, variantB: number, dimensionDiffs: Record<string, number>, winner: number | null }` to `ExecutedVariant`. |
| `src/services/orchestrator/planBuilder.ts` | Add `mutateClipPlan(basePlan, variable, newValue)` that produces a modified clone of the base plan with one variable changed. For example: `mutateClipPlan(plan, 'voice', 'British Female')` changes all character voices. `mutateClipPlan(plan, 'pacing', 'fast')` adjusts dialogue timing and transition durations. |
| `src/components/panels/orchestrator/CompletionPhase.tsx` | When `executedVariants.length > 1`, show the comparison UI instead of the single-result view. Add a "Compare" tab that displays the `ABComparisonPanel`. |

### New Code to Create

| File | Purpose |
|------|---------|
| `src/stores/useABTestStore.ts` | Zustand store: `testConfig: ABTestConfig` (variable list, strategy, variant count), `testResults: ABTestResult[]` (per-test scoring history), `activeComparison: { variantA: number, variantB: number } | null`. Actions: `configureTest(config)`, `startTest()` (triggers `generateVariations` in orchestrator store), `setComparison(a, b)`, `pickWinner(variantIndex)` (applies the winning variant's state to the main editor), `saveTestResult(result)`. |
| `src/types/abTest.ts` | Types: `ABTestConfig { basePrompt, variables: VariationVariable[], strategy, variantCount: 2 | 3 }`, `ABTestResult { id, timestamp, config, variants: ScoredVariant[], winnerId }`, `ScoredVariant { variantIndex, label, viralScore, dimensionScores, thumbnailDataUrl }`. |
| `src/services/abVariationEngine.ts` | Variation generation engine: `generateIsolatedVariants(basePlan, variables[])` produces N plans where each changes exactly one variable (e.g., variant 1 changes voice, variant 2 changes template, variant 3 changes pacing). `generateRandomVariants(basePlan, variables[], count)` produces N plans with random combinations. `generateGuidedVariants(basePlan, viralScore, suggestions[])` uses virality suggestions to generate improvement-focused variants (e.g., if suggestion says "add hook text", variant includes it). |
| `src/components/panels/ABTestConfigPanel.tsx` | Test configuration UI: checklist of variables to test (voice, music, text style, character position, template, aspect ratio, caption style, pacing), strategy selector (isolated/random/guided), variant count (2 or 3), and "Run A/B Test" button. Shows cost estimate based on variant count. |
| `src/components/panels/ABComparisonPanel.tsx` | Side-by-side comparison: two Remotion Player instances playing variants synced to the same frame. Radar chart overlay comparing virality dimensions. Dimension-by-dimension comparison bars (green for winner, red for loser). "Pick Winner" button that applies the winning variant to the main project. Variant label and variable-change summary below each player. |
| `src/components/panels/ABTestHistoryPanel.tsx` | Test history: list of past A/B tests with configs, winning variant, and score improvements. Trend chart showing how virality scores improve across tests (learning effect). |

### Data Flow

1. User opens `ABTestConfigPanel`, selects variables to test (e.g., "voice" and "caption style"), chooses "isolated" strategy, sets variant count to 3.
2. `useABTestStore.configureTest(config)` saves the test configuration.
3. User clicks "Run A/B Test" -> `startTest()` is called.
4. `abVariationEngine.generateIsolatedVariants(basePlan, variables)` generates 3 plans:
   - Variant 0: base plan (original)
   - Variant 1: base plan with voice changed
   - Variant 2: base plan with caption style changed
5. Each variant plan is executed through the orchestrator pipeline (sequentially to avoid resource conflicts). During execution, each variant's state is captured as a snapshot.
6. After all variants execute, virality scorer runs on each -> produces `ViralScore` per variant.
7. `ABComparisonPanel` renders. User selects two variants for side-by-side comparison.
8. Synced Remotion Players show both variants playing simultaneously. Radar charts overlay the dimension comparison.
9. User clicks "Pick Winner" on the best variant -> `pickWinner(variantIndex)` restores the editor to that variant's state (characters, dialogue, text, media, etc.).
10. Test result is saved to `useABTestStore.testResults` for historical tracking.

### Architecture Notes

- **Isolated vs. Random vs. Guided**: Isolated testing changes one variable at a time -- this is the scientific approach, letting you attribute score changes to specific variables. Random generates diverse variations but makes attribution impossible. Guided uses virality suggestions to generate improvement-focused variants. Default to "isolated" for most users.
- **State snapshotting**: Each variant execution modifies global stores (useMultiCharacterStore, useTextOverlayStore, etc.). Before executing a variant, snapshot all relevant stores. After execution, capture the result (viral score, thumbnail). Before executing the next variant, restore the snapshot. After all variants, the user's original state is preserved until they "Pick Winner."
- **Snapshot mechanism**: Use Zustand's `getState()` to capture and `setState()` to restore. For stores using immer middleware, deep clone the state before snapshot. Store snapshots in `useABTestStore.stateSnapshots: Map<variantIndex, SerializedState>`.
- **Cost implications**: Each variant is a full orchestrator run. With ElevenLabs voices, this means N * dialogue_lines * voice_cost. Show a cost estimate before running: `"This A/B test will generate 3 variants, estimated cost: 45 credits"`.
- **Synced playback**: Two Remotion Players must be frame-synced. Use a shared `usePlaybackStore.currentFrame` and drive both players from it. When one player seeks, the other follows.
- **Trade-off -- full execution vs. plan-only comparison**: Running full execution (with voice generation, stock media search, etc.) is expensive but gives accurate comparison. An alternative is plan-only comparison (score the plan JSON without executing). We support both: "Quick Compare" scores plans without execution (cheap, fast, less accurate), "Full Compare" executes all variants (expensive, slow, accurate).

### Acceptance Criteria

- [ ] User can configure an A/B test with 2-3 variants and select which variables to test.
- [ ] "Isolated" strategy changes exactly one variable per variant.
- [ ] Each variant executes through the full orchestrator pipeline and receives a virality score.
- [ ] Side-by-side comparison shows two variants playing in sync with frame-locked playback.
- [ ] Radar chart visually compares virality dimensions between two variants.
- [ ] "Pick Winner" applies the winning variant's state to the main editor.
- [ ] Cost estimate is shown before test execution.
- [ ] Original editor state is preserved until winner is picked (all variants are reversible).
- [ ] Test history shows past A/B tests with configs and winners.
- [ ] "Quick Compare" mode scores plans without full execution (under 10 seconds).

---

## #23 Natural Language Timeline Editing

### What

Users type plain English commands like "make the intro faster", "add a zoom on the word amazing", or "move the title to the bottom" and the AI interprets the command, maps it to specific timeline/store operations, and executes them. This is the conversational editing interface. The copilot service (`copilotService.ts`) already defines an extensive action system with 30+ operations (add-text, update-shape, seek, set-duration, etc.) and Gemini-based intent parsing. `transcriptSync.ts` provides word-level context from Phase 4. What is missing is: a natural language input integrated into the timeline, Gemini function-calling mode for structured action extraction, multi-step command decomposition, and preview-before-apply safety.

### Tech Stack

- **Gemini 3.1 Flash Lite with function calling** (existing Gemini API, new usage pattern) -- define available timeline operations as tool/function declarations, Gemini returns structured function calls
- **copilotService.ts** (existing) -- action execution infrastructure (30+ actions)
- **transcriptSync.ts** (existing from Phase 4) -- word-level context for "the word X" references
- **useKeyframeStore** (existing) -- keyframe manipulation
- **useCameraStore** (existing) -- camera zoom/pan/rotation
- **useTimelineStore** (existing) -- timeline duration, FPS, tracks

### Existing Code to Modify

| File | Change |
|------|--------|
| `src/services/copilot/copilotService.ts` | Add a `parseNLCommand(command, context)` method that uses Gemini with function calling (tools mode) instead of the current freeform text parsing. Define function declarations for all 30+ actions with parameter schemas. Add a `planActions(command)` method that returns a list of actions WITHOUT executing them (for preview). |
| `src/components/timeline/Timeline.tsx` | Add an NL command input bar at the top of the timeline. Pressing Enter sends the command to `parseNLCommand()`. Show a brief preview of planned changes before applying (with "Apply" / "Cancel" buttons). |
| `src/components/timeline/TimelineControls.tsx` | Add a microphone/command icon button that toggles the NL command bar visibility. |

### New Code to Create

| File | Purpose |
|------|---------|
| `src/services/nlEditService.ts` | NL editing service core: `parseCommand(text, context)` calls Gemini with function-calling mode, returns `ParsedCommand { actions: CopilotAction[], confidence: number, explanation: string }`. `buildContext()` assembles current editor state for the prompt: timeline duration, character names, text overlay contents, current frame, word-level transcript (if available). `executeCommand(parsed)` applies the actions via copilotService. `undoLastCommand()` triggers undo for all actions in the last command batch. |
| `src/services/nlEditFunctions.ts` | Gemini function declarations (tools): each maps to a copilot action. For example: `{ name: "adjust_speed", description: "Change playback speed of a segment", parameters: { segment: "intro|outro|all|custom", speedMultiplier: number } }`, `{ name: "add_camera_zoom", description: "Add a camera zoom at a specific time or on a word", parameters: { target: string, zoomLevel: number, durationFrames: number } }`, etc. ~30 function declarations covering all timeline operations. Includes composite functions: `{ name: "make_segment_faster", parameters: { segment, factor } }` that decomposes into multiple actions (trim silence, increase speed, tighten transitions). |
| `src/services/nlEditContext.ts` | Context builder for NL editing: `buildEditingContext()` returns a structured summary of current project state: `{ duration, fps, characters: [{name, lineCount}], textOverlays: [{content, position}], mediaItems: [{name, timeRange}], currentFrame, transcript?: [{word, frame}] }`. This context is injected into the Gemini prompt so the model can reference specific elements by name. |
| `src/stores/useNLEditStore.ts` | Zustand store: `commandHistory: NLCommand[]` (last 20 commands with results), `pendingCommand: ParsedCommand | null` (preview before apply), `isProcessing: boolean`, `lastError: string | null`. Actions: `submitCommand(text)`, `applyPending()`, `cancelPending()`, `undoLastCommand()`. |
| `src/components/timeline/NLCommandBar.tsx` | Command input component: text field with autocomplete suggestions (based on common commands), submit button, processing spinner. Below the input: preview panel showing planned changes as a diff ("Will add camera zoom from frame 30-60, Will move title to bottom"). "Apply" and "Cancel" buttons for the preview. |
| `src/components/timeline/NLCommandHistory.tsx` | Command history dropdown: shows last 20 commands with their results (success/failed). Click to re-run a command. "Undo" button per command. |

### Data Flow

1. User types "zoom in on the word amazing" in the NL command bar and presses Enter.
2. `useNLEditStore.submitCommand(text)` sets `isProcessing: true`.
3. `nlEditService.parseCommand(text, buildEditingContext())` calls Gemini with function declarations.
4. Gemini prompt includes:
   - System message: "You are a video editing assistant. Use the provided functions to fulfill the user's editing request."
   - Function declarations (from `nlEditFunctions.ts`)
   - Current editor context (from `nlEditContext.ts`): `{ duration: 15s, fps: 30, characters: [{name: "Alex", lineCount: 3}], transcript: [...{word: "amazing", startFrame: 87, endFrame: 95}...] }`
   - User message: "zoom in on the word amazing"
5. Gemini returns a function call: `add_camera_zoom({ target: "word:amazing", zoomLevel: 1.5, durationFrames: 30, easing: "ease-in-out" })`.
6. `nlEditService` converts the function call to copilot actions: `[{ action: "add-camera-keyframe", params: { frame: 87, zoom: 1.5 } }, { action: "add-camera-keyframe", params: { frame: 95, zoom: 1.0 } }]`.
7. `useNLEditStore` stores this as `pendingCommand` and sets `isProcessing: false`.
8. `NLCommandBar` renders the preview: "Will add camera zoom 1.5x from frame 87-95 (on word 'amazing'), easing: ease-in-out."
9. User clicks "Apply" -> `applyPending()` calls `copilotService.executeActions(actions)` -> camera keyframes are added to `useCameraStore`.
10. Command is added to `commandHistory`. User can undo with "Undo" button (triggers `useCameraStore`'s undo via zundo).

### Architecture Notes

- **Function calling over freeform**: Gemini's function calling mode (tools) returns structured JSON with parameter validation. This is far more reliable than parsing freeform text responses. Each function declaration includes a description and parameter schema, so Gemini knows exactly what operations are available.
- **Composite commands**: Commands like "make the intro faster" decompose into multiple atomic operations: (1) identify "intro" as frames 0-90, (2) trim silence gaps in that range, (3) increase playback speed by 1.3x, (4) tighten transition durations. The `nlEditFunctions.ts` defines both atomic functions and composite functions that expand to multiple actions.
- **Word references require Phase 4**: Commands like "zoom on the word X" require word-level timestamps from transcription. Without Phase 4 transcription data, the system falls back to searching text overlay content for the word. The `buildEditingContext()` function includes transcript words only when available.
- **Preview-before-apply**: Every NL command shows a preview diff before execution. This prevents destructive mistakes from ambiguous commands. The preview uses human-readable descriptions generated by the `explanation` field from Gemini's response.
- **Confidence threshold**: If Gemini's function call has low confidence (expressed as a `confidence` field in the response schema), the preview adds a warning: "I'm not fully sure about this interpretation. Please review carefully."
- **Undo atomicity**: All actions from a single NL command are grouped as one undo unit. Pressing undo reverts the entire command, not individual actions. This is implemented by wrapping the action batch in a zundo transaction.
- **Trade-off -- Gemini vs. local parsing**: Simple commands ("play", "pause", "seek to frame 100") could be parsed locally with regex. But NL commands span a wide range of complexity ("move the red text up and make it bigger, then add a fade transition"). Using Gemini for all commands keeps the architecture simple. The latency cost (~500ms for Gemini Flash Lite) is acceptable since the user is in a review flow (preview before apply).
- **Extensibility**: Adding new NL commands only requires adding a function declaration to `nlEditFunctions.ts` and a mapping in the copilot action router. No model retraining needed.

### Acceptance Criteria

- [ ] NL command bar is accessible from the timeline toolbar.
- [ ] Commands like "make the intro faster", "add a zoom on [word]", "move the title to the bottom" are correctly parsed and executed.
- [ ] Every command shows a preview of planned changes before execution. User must click "Apply" to confirm.
- [ ] "Undo" reverts the entire last NL command (all actions atomically).
- [ ] Command history shows last 20 commands with success/failure status.
- [ ] Word-level references ("zoom on the word 'amazing'") work when transcript data is available from Phase 4.
- [ ] Without transcript data, the system falls back to text overlay content matching and reports when a word reference cannot be resolved.
- [ ] Gemini function calling returns structured actions (not freeform text) for at least 90% of common editing commands.
- [ ] Processing time for command parsing is under 2 seconds (Gemini Flash Lite latency).
- [ ] Multi-step commands (e.g., "add a title, make it red, and animate it sliding in from the left") correctly decompose into multiple sequential actions.

---

## Related

- [[feature-list]] — Features #25 Transcript Editor, #90 Clip Extraction, #18 Singing, #81 NL Editing
- [[feature-priorities]] — Text-Based Editing (#16), Clip Extraction (#21), NL Editing (#34), with AI Video Intelligence and AI Editing Intelligence scoring
- [[PROGRESS]] — Track completion status
- [[phase-5|Phase 5: Character & Content Intelligence]] — Previous phase
- [[phase-7|Phase 7: Professional Output]] — Next phase
- [[phase-4]] — Transcription foundation required for text-based editing
