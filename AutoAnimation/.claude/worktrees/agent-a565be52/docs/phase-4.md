# Phase 4: Transcription Foundation

**Features:** #1 AI Auto-Caption/Transcription, #2 AI Silence/Filler Removal, #8 AI Smart Zoom
**Timeline:** 3-4 weeks
**Theme:** This is the gateway. Transcription data enables silence removal, smart zoom, text-based editing, clip extraction, and translation.
**Dependencies:** None -- this is foundational.
**Unlocks:** #22 Text-Based Editing, #23 NL Timeline Editing, #7 Clip Extraction, #48 Video Translator

---

## Feature #1: AI Auto-Caption/Transcription

### What

Full-featured transcription pipeline that accepts any audio or video input, produces word-level timestamped transcripts with confidence scores and speaker diarization, and integrates directly into the existing caption and dialogue systems. The server-side Whisper endpoint (`server/routes/whisper.ts`) and client service (`whisperTranscript.ts`) already exist with basic word+segment output. This feature extends them with speaker identification, confidence scoring, a rich transcript editor component, and deep integration with the caption overlay and dialogue timeline.

### Tech Stack

- **OpenAI Whisper API** -- `POST /v1/audio/transcriptions` with `response_format=verbose_json` and `timestamp_granularities[]=word,segment` (already implemented in `server/routes/whisper.ts`)
- **Deepgram API** -- fallback/alternative provider. Nova-2 model offers speaker diarization out of the box, streaming support, and 36+ languages. `POST https://api.deepgram.com/v1/listen?model=nova-2&diarize=true&punctuate=true&utterances=true`
- **AssemblyAI** -- second alternative. Best speaker diarization accuracy. `POST https://api.assemblyai.com/v2/transcript` with `speaker_labels=true`
- **Web Workers** -- optional future path for on-device Whisper via whisper.cpp WASM (adds ~40MB model download, 2-5x realtime speed on M1)
- **Existing code** -- `whisperTranscript.ts` (transcribeAudio, WhisperResult, WhisperWord, WhisperSegment), `useTranscriptImportStore.ts` (upload, transcribe, edit segments, import to project), `TranscriptImportPanel.tsx` (basic UI), `captions.ts` (CaptionProcessor), `useVoiceStore.ts` (word/sentence/viseme timelines)

### Existing Code to Modify

| File | Changes |
|------|---------|
| `server/routes/whisper.ts` | Add optional `provider` query parameter (`whisper` \| `deepgram` \| `assemblyai`). Add Deepgram and AssemblyAI provider implementations behind the same endpoint. Add `diarize=true` parameter support -- when enabled, include speaker labels in the response. Normalize all provider responses to the existing `WhisperResult` shape plus new `speaker` field on each word/segment. Add language detection override parameter. |
| `src/services/whisperTranscript.ts` | Extend `WhisperWord` with `confidence: number` (0-1) and `speaker?: string` fields. Extend `WhisperSegment` with `speaker?: string` field. Add `TranscriptionOptions` interface: `{ provider?, language?, diarize?, model? }`. Modify `transcribeAudio()` to accept options and pass them as query parameters. Add `transcribeFromUrl(audioUrl, options)` variant that sends a URL instead of uploading a file (useful for already-uploaded audio blobs). |
| `src/stores/useTranscriptImportStore.ts` | Rename to `useTranscriptStore.ts` (broader scope). Add `speakers: string[]` (detected speaker labels), `activeSegmentId: number \| null` (for click-to-seek), `searchQuery: string`, `filteredSegments` computed getter. Add `mergeSegments(ids)`, `splitSegment(id, wordIndex)`, `assignSpeaker(segmentId, speaker)`, `exportAsSRT()`, `exportAsVTT()` actions. Add `generateCaptions(fps): { wordTimeline, sentenceTimeline }` that converts transcript data into the format consumed by `useVoiceStore` and `CaptionOverlay.tsx`. |
| `src/components/panels/TranscriptImportPanel.tsx` | Rename to `TranscriptPanel.tsx`. Major UI overhaul: add a scrollable, editable transcript view where each word is individually clickable (seeks to that timestamp), speaker labels appear inline, confidence scores are shown as text opacity (low confidence = dimmer text). Add search bar, speaker filter, export buttons (SRT, VTT). Add "Generate Captions" button that feeds transcript data into the caption system. |
| `src/services/captions.ts` | Add `fromTranscript(words: WhisperWord[], fps: number): { wordTimeline: WordEvent[], sentenceTimeline: SentenceEvent[] }` static method on `CaptionProcessor` that converts `WhisperWord[]` directly to the timeline format used by `CaptionOverlay.tsx`. This bypasses the ElevenLabs alignment path and provides an alternative caption source. |
| `src/stores/useVoiceStore.ts` | Add `setTimelinesFromTranscript(wordTimeline, sentenceTimeline)` action that populates `activeWordTimeline` and `activeSentenceTimeline` without requiring a generated voice. This enables captions from transcription even when no TTS voice was used. |
| `server/index.ts` | Already mounts whisper routes. Add env vars for `DEEPGRAM_API_KEY` and `ASSEMBLYAI_API_KEY`. |

### New Code to Create

| File | Purpose |
|------|---------|
| `src/components/panels/TranscriptEditor.tsx` | Rich transcript editor component (extracted from TranscriptPanel for reuse). Renders words as inline `<span>` elements with: click-to-seek, double-click-to-edit, color-coded speaker labels, confidence-based opacity, highlight on current playback word. Supports keyboard navigation (arrow keys between words, Enter to edit). Paragraph breaks at segment boundaries. |
| `src/components/panels/TranscriptSearchBar.tsx` | Search bar with find/replace. Highlights matching words in the transcript. Supports regex search. "Replace All" modifies transcript text (useful for fixing repeated misrecognitions). Navigate between matches with up/down arrows. |
| `src/components/panels/SpeakerManager.tsx` | Speaker management UI. Shows detected speakers with auto-generated colors. Allows renaming speakers ("Speaker 1" -> "Host"), merging two speakers into one, reassigning segments to different speakers. Integrates with dialogue system: "Map to Character" button creates a dialogue character per speaker. |
| `src/services/transcriptionProviders.ts` | Provider abstraction layer. `TranscriptionProvider` interface with `transcribe(audio: Blob, options): Promise<NormalizedTranscript>`. Implementations: `WhisperProvider`, `DeepgramProvider`, `AssemblyAIProvider`. Each normalizes their native response format to the shared `WhisperResult` shape. Used by the server route. |
| `server/services/deepgramProvider.ts` | Server-side Deepgram integration. `POST https://api.deepgram.com/v1/listen` with audio buffer. Supports diarization, punctuation, utterance detection. Normalizes response to `WhisperResult` shape. |
| `server/services/assemblyAIProvider.ts` | Server-side AssemblyAI integration. Two-step: upload audio -> create transcript -> poll until complete. Supports speaker labels, auto-chapters, sentiment analysis. Normalizes response to `WhisperResult` shape. |

### Data Flow

```
User uploads audio/video file (or selects existing audio track)
  -> TranscriptPanel "Transcribe" button
  -> useTranscriptStore.transcribe(options)
  -> whisperTranscript.transcribeAudio(file, { provider, diarize, language })
     -> POST /api/whisper/transcribe?provider=whisper&diarize=true
     -> Server selects provider:
        Whisper: POST OpenAI API -> word-level timestamps
        Deepgram: POST Deepgram API -> word-level + speaker labels
        AssemblyAI: POST + poll AssemblyAI API -> word-level + speaker labels
     -> Normalize all responses to WhisperResult shape
  -> Client receives WhisperResult { text, language, duration, segments[], words[] }
  -> Store updates: result, editedSegments, speakers
  -> TranscriptEditor renders interactive word-by-word transcript
  -> User edits transcript (fix words, merge segments, assign speakers)
  -> "Generate Captions" button:
     -> CaptionProcessor.fromTranscript(words, fps)
     -> WordEvent[] and SentenceEvent[] generated
     -> useVoiceStore.setTimelinesFromTranscript(wordTimeline, sentenceTimeline)
     -> CaptionOverlay.tsx renders captions during playback
  -> "Map Speakers to Characters":
     -> For each speaker, create a MultiCharacterStore dialogue character
     -> Assign segments to characters as dialogue lines
     -> Dialogue timeline populates automatically
```

### Architecture Notes

1. **Provider strategy.** Whisper is the default (best accuracy, most languages, simplest API). Deepgram is preferred when diarization is needed (built-in, no extra step). AssemblyAI is the premium option for complex multi-speaker content. The server route abstracts the provider -- the client just sends `provider=deepgram` as a query param. All providers normalize to the same `WhisperResult` shape.

2. **Speaker diarization.** Whisper API does NOT have native diarization. If the user selects Whisper + diarize, the server must run a separate diarization step. Options: (a) use `pyannote/speaker-diarization-3.1` via a Python microservice, (b) switch to Deepgram which has built-in diarization, (c) use a simple energy-based heuristic (not recommended for production). For MVP, recommend Deepgram when diarization is needed and document the tradeoff.

3. **Transcript -> Caption bridge.** The existing caption system in `useVoiceStore.ts` stores `activeWordTimeline: WordEvent[]` and `activeSentenceTimeline: SentenceEvent[]`. These are normally populated from ElevenLabs alignment data during TTS generation. The new `setTimelinesFromTranscript()` action provides an alternative path: populate the same timelines from transcription data. `CaptionOverlay.tsx` does not need to change -- it reads from the same store fields regardless of source.

4. **Word-level editing.** The `TranscriptEditor` must support editing individual words without losing their timestamps. When a word's text is changed, keep the original `start` and `end` times. When words are split or merged, recompute timestamps proportionally. When a segment is split at a word boundary, create two segments with appropriate time ranges.

5. **SRT/VTT export.** SRT format: sequential numbered blocks with `HH:MM:SS,mmm --> HH:MM:SS,mmm` timestamps and text. VTT format: similar but with `HH:MM:SS.mmm --> HH:MM:SS.mmm` and optional styling. Generate from `editedSegments`. This is pure string formatting -- no dependencies needed.

6. **Confidence visualization.** Each word from Whisper has an implicit confidence (word probability in the model output). The verbose JSON response does not always include per-word confidence. Deepgram and AssemblyAI do provide per-word confidence. When available, render low-confidence words (< 0.7) with reduced opacity and a yellow underline to draw attention for manual review.

7. **File size limits.** The server `multer` config already allows 100MB uploads. Whisper API has a 25MB limit -- for larger files, the server must split the audio into chunks and transcribe sequentially, then stitch segments together with adjusted timestamps. Deepgram and AssemblyAI support larger files natively.

8. **Language auto-detection.** Whisper detects language automatically and returns it in the response. Pass this to the UI so users see what language was detected. Allow override via a language selector for multilingual content where the wrong language may be detected.

### Acceptance Criteria

- [ ] User can upload audio/video files (wav, mp3, m4a, mp4, webm) for transcription
- [ ] Transcription runs via OpenAI Whisper API with word-level timestamps
- [ ] Deepgram provider is available as an alternative (requires DEEPGRAM_API_KEY)
- [ ] AssemblyAI provider is available as an alternative (requires ASSEMBLYAI_API_KEY)
- [ ] Word-level transcript renders in an interactive editor
- [ ] Each word is clickable (seeks playback to that timestamp)
- [ ] Words can be edited inline (double-click to edit)
- [ ] Segments can be merged or split
- [ ] Speaker diarization works when using Deepgram provider
- [ ] Speaker labels appear inline in the transcript with color coding
- [ ] Speakers can be renamed and merged in the SpeakerManager
- [ ] "Map Speakers to Characters" creates dialogue characters per speaker
- [ ] "Generate Captions" populates the caption system from transcript data
- [ ] Captions render correctly during playback via CaptionOverlay
- [ ] Export to SRT format produces valid subtitle files
- [ ] Export to VTT format produces valid WebVTT files
- [ ] Search bar finds and highlights words in the transcript
- [ ] Language auto-detection works and is displayed in the UI
- [ ] Files > 25MB are handled (chunked transcription or Deepgram/AssemblyAI)
- [ ] Error states are handled gracefully (API key missing, upload failed, timeout)

---

## Feature #2: AI Silence/Filler Removal

### What

Automatically detect and remove silences and filler words ("um", "uh", "like", "you know", "basically", "so", "actually") from audio/video content using transcription data. Offers three modes inspired by the Submagic model: Natural (remove only long pauses > 1.5s), Fast (remove pauses > 0.8s), and Extra Fast (remove pauses > 0.3s plus filler words). The removal generates timeline cuts that split clips and remove the silent/filler segments, producing tighter, more engaging content.

### Tech Stack

- **Transcription data** -- depends on Feature #1 for word-level timestamps with gaps
- **Existing timeline system** -- `useTimelineStore.ts` with track/clip CRUD, undo/redo via `temporal()` (zundo)
- **Existing audio mixer** -- `audioMixer.ts` for re-mixing after cuts
- **NLP** -- simple regex-based filler detection (no ML needed -- filler words are a finite, well-known set)

### Existing Code to Modify

| File | Changes |
|------|---------|
| `src/stores/useTranscriptStore.ts` (renamed in #1) | Add `silenceRegions: SilenceRegion[]`, `fillerRegions: FillerRegion[]` computed from transcript data. Add `detectSilencesAndFillers(mode: RemovalMode)` action. Add `silenceThreshold: number` (seconds), `fillerWords: string[]` (customizable list). Add `removalPreview: TimelineEdit[]` (proposed cuts before applying). |
| `src/stores/useTimelineStore.ts` | Add `applyTimelineEdits(edits: TimelineEdit[])` action that performs batch clip splitting and removal. Each `TimelineEdit` specifies `{ type: 'remove', startFrame, endFrame }`. The action splits any clip spanning the removal region, removes the inner portion, and shifts all subsequent clips left to close the gap. Must work within the `temporal()` undo system. |
| `src/services/whisperTranscript.ts` | Add `detectSilences(words: WhisperWord[], thresholdSec: number): SilenceRegion[]` and `detectFillers(words: WhisperWord[], fillerList: string[]): FillerRegion[]` utility functions. |
| `src/components/panels/TranscriptPanel.tsx` (from #1) | Add "Clean Up" section with mode selector (Natural/Fast/Extra Fast), preview toggle, and apply button. When preview is active, silence regions are highlighted in red and filler words in orange within the transcript editor. Show total time savings. |

### New Code to Create

| File | Purpose |
|------|---------|
| `src/services/silenceRemoval.ts` | Core service. `SilenceRemovalService` class with: `analyzeTranscript(words, mode) -> AnalysisResult { silences, fillers, totalRemoved, editOperations }`. Implements the three modes. `RemovalMode` enum: `'natural'` (>1.5s silences only), `'fast'` (>0.8s silences), `'extra-fast'` (>0.3s silences + fillers). Returns `TimelineEdit[]` that the timeline store can apply. Also exposes `generatePreview(words, mode)` for UI highlighting without applying. |
| `src/types/silenceRemoval.ts` | Type definitions. `SilenceRegion { startTime, endTime, duration, type: 'silence' }`. `FillerRegion { startTime, endTime, word, type: 'filler' }`. `RemovalMode`. `TimelineEdit { type: 'remove', startFrame, endFrame, reason: string }`. `AnalysisResult { silences, fillers, totalRemovedSec, edits }`. |
| `src/components/panels/SilenceRemovalPanel.tsx` | Dedicated panel (also embeddable in TranscriptPanel). Mode selector with 3 buttons showing descriptions. Preview section: total silence time, total filler time, estimated final duration, visual timeline showing cut regions. Custom settings: silence threshold slider, filler word list editor (add/remove words). "Apply" button with confirmation dialog showing exactly what will be removed. Undo notice. |
| `src/components/timeline/SilenceOverlay.tsx` | Timeline overlay that highlights silence/filler regions on the ruler. Red semi-transparent blocks for silences, orange blocks for fillers. Only shown when silence removal preview is active. |
| `src/hooks/useSilencePreview.ts` | Hook that computes silence/filler regions from transcript data and the selected mode. Returns `{ silences, fillers, totalSaved, edits, isComputing }`. Re-computes when mode or threshold changes. |

### Data Flow

```
User has transcription data (from Feature #1)
  -> Opens SilenceRemovalPanel (or "Clean Up" section in TranscriptPanel)
  -> Selects mode: Natural / Fast / Extra Fast
  -> useSilencePreview hook runs:
     -> silenceRemoval.analyzeTranscript(words, mode)
     -> Detect silences: iterate words, find gaps > threshold
     -> Detect fillers: iterate words, match against filler word list
     -> Compute TimelineEdit[] (frame ranges to remove)
     -> Return AnalysisResult with totals
  -> UI shows:
     -> Preview stats: "Found 12 silences (8.3s) and 7 fillers (2.1s) -- saves 10.4s"
     -> TranscriptEditor highlights silence regions (red) and fillers (orange)
     -> SilenceOverlay shows cut blocks on the timeline
  -> User adjusts settings (custom threshold, add/remove filler words)
  -> Clicks "Apply Removal"
  -> Confirmation dialog: "Remove 19 segments totaling 10.4s? This can be undone."
  -> useTimelineStore.applyTimelineEdits(edits)
     -> For each edit (sorted by startFrame descending to avoid index shifting):
        -> Find all clips spanning the removal region
        -> Split clip at removal boundaries
        -> Remove the inner clip segment
        -> Shift all subsequent clips left by the removed duration
     -> Timeline duration shrinks accordingly
  -> useTranscriptStore removes the corresponding words/segments
  -> Audio is effectively trimmed (gaps closed)
  -> User can Ctrl+Z to undo all changes (single undo operation via temporal())
```

### Architecture Notes

1. **Silence detection algorithm.** Silences are gaps between consecutive words in the transcript. Given sorted `WhisperWord[]` with `start` and `end` times, a silence exists between `words[i].end` and `words[i+1].start` if the gap exceeds the threshold. This is simple and accurate because Whisper already provides precise word boundaries. No audio analysis needed -- the transcript IS the silence map.

2. **Filler word detection.** Match word text (lowercased, stripped of punctuation) against a predefined list: `["um", "uh", "uhm", "uhh", "hmm", "hm", "er", "ah", "like", "you know", "basically", "actually", "literally", "sort of", "kind of", "i mean", "right", "so"]`. Multi-word fillers (e.g., "you know") require lookahead: check `words[i].word + " " + words[i+1].word`. The list should be user-customizable because different speakers have different verbal tics.

3. **Three removal modes.**
   - **Natural**: Only removes silences > 1.5 seconds. Leaves all speech intact including fillers. Result sounds like a normal conversation with awkward pauses trimmed.
   - **Fast**: Removes silences > 0.8 seconds. Still leaves fillers. Result sounds like a well-edited interview.
   - **Extra Fast**: Removes silences > 0.3 seconds AND filler words. Result sounds like a tight, scripted delivery. Most aggressive -- may feel unnatural for some content.

4. **Timeline edit strategy.** The `applyTimelineEdits()` action must process edits in reverse chronological order (highest startFrame first) to avoid index shifting. Each edit: (a) find all clips overlapping `[startFrame, endFrame]`, (b) for clips that partially overlap, split at the boundary, (c) remove clip segments fully within the range, (d) shift all clips after `endFrame` left by `(endFrame - startFrame)` frames. This is complex -- consider implementing as a helper function with thorough unit tests.

5. **Audio continuity.** Removing silence from the timeline does not modify the actual audio files. Instead, it creates new clip boundaries that skip over the silent regions. During playback, the audio engine plays clip A, skips the gap, then plays clip B at the new timeline position. This is non-destructive -- the original audio is preserved, and undo restores the original clip layout.

6. **Minimum silence keep.** Even in Extra Fast mode, keep a tiny gap (50-100ms) between clips that had silence removed. Completely removing all gaps creates an unnatural "machine gun" effect. This 50ms breath room is critical for listenable output.

7. **Batch vs interactive.** The panel offers both approaches: (a) one-click mode selection applies a full pass, (b) interactive editing lets users click individual silence/filler regions to toggle removal on/off before applying. Store a `Set<number>` of region indices that the user has deselected.

8. **Integration with audio mixer.** After applying timeline edits, the `audioMixer.ts` `mixTracks()` function automatically handles the new clip layout because it reads clip start times and durations from the timeline store. No changes needed to the mixer itself.

### Acceptance Criteria

- [ ] Silence detection identifies all gaps between words exceeding the threshold
- [ ] Filler word detection identifies common fillers ("um", "uh", "like", "you know", etc.)
- [ ] Natural mode removes only silences > 1.5 seconds
- [ ] Fast mode removes silences > 0.8 seconds
- [ ] Extra Fast mode removes silences > 0.3 seconds plus filler words
- [ ] Preview shows highlighted regions in the transcript editor (red for silence, orange for filler)
- [ ] Preview shows total time savings and estimated final duration
- [ ] SilenceOverlay renders cut regions on the timeline ruler
- [ ] "Apply" button shows confirmation dialog with exact count and duration
- [ ] Timeline edits correctly split clips at removal boundaries
- [ ] All subsequent clips shift left to close gaps
- [ ] A 50-100ms minimum gap is preserved between clips (no machine-gun effect)
- [ ] Undo (Ctrl+Z) reverts all changes in a single operation
- [ ] Custom silence threshold slider (0.1s to 3.0s) updates preview in real time
- [ ] Filler word list is customizable (add/remove words)
- [ ] Users can deselect individual regions before applying
- [ ] Works with transcripts from any provider (Whisper, Deepgram, AssemblyAI)
- [ ] Transcript store updates to reflect removed words/segments after applying

---

## Feature #8: AI Smart Zoom

### What

Automatically generate camera zoom and pan keyframes from transcript data to create dynamic, engaging video. Analyzes the transcript for emphasis points (sentence starts, exclamation marks, key phrases, topic transitions, speaker changes) and generates camera keyframes that zoom in during important moments and return to base between them. Offers multiple zoom styles (Smooth, Crash, Expo, Linear) inspired by the Submagic model.

### Tech Stack

- **Transcription data** -- depends on Feature #1 for word-level timestamps and speaker labels
- **Camera system** -- `useCameraStore.ts` with `CameraKeyframe[]`, `addKeyframe()`, interpolation, shake, focus pull
- **Gemini API** -- for intelligent emphasis detection ("which moments deserve zoom?") using the transcript text
- **Existing keyframe system** -- `useKeyframeStore.ts` for per-object keyframes if zoom targets specific objects

### Existing Code to Modify

| File | Changes |
|------|---------|
| `src/stores/useCameraStore.ts` | Add `smartZoomConfig: SmartZoomConfig \| null` state. Add `applySmartZoom(keyframes: CameraKeyframe[], config: SmartZoomConfig)` action that replaces current keyframes with smart zoom keyframes (tagged so they can be cleared). Add `clearSmartZoom()` action. Add zoom style presets as `SMART_ZOOM_STYLES` constant alongside existing `CAMERA_PRESETS`. The store already has `addKeyframe()`, `setKeyframes()`, `syncToBeats()`, and `getCameraAtFrame()` -- all of which work correctly with the new keyframes. |
| `src/services/whisperTranscript.ts` | No changes needed -- the existing `WhisperWord[]` and `WhisperSegment[]` types provide all the data the smart zoom service needs (word text, start/end times, speaker labels). |
| `src/components/panels/TranscriptPanel.tsx` (from #1) | Add "Smart Zoom" button in the transcript toolbar. When clicked, opens SmartZoomPanel as a sub-section or modal. Emphasis points are highlighted in the transcript with zoom icons. |

### New Code to Create

| File | Purpose |
|------|---------|
| `src/services/smartZoom.ts` | Core service. `SmartZoomService` with: `analyzeForZoom(segments, words, config) -> ZoomPoint[]`. Detects emphasis using rule-based heuristics + optional Gemini analysis. `generateCameraKeyframes(zoomPoints, config, fps, totalFrames) -> CameraKeyframe[]`. Generates keyframe sequences per zoom point based on the selected style. `ZoomPoint { frame, intensity (0-1), type: ZoomTriggerType, description }`. |
| `src/types/smartZoom.ts` | Type definitions. `SmartZoomConfig { style, intensity (0-1), frequency ('conservative' \| 'moderate' \| 'aggressive'), maxZoom (1.1-2.0), includeTopicTransitions, includeSpeakerChanges, includeEmphasis, includePunctuation, useAI }`. `ZoomStyle`: `'smooth'` (ease-in-out over 500ms), `'crash'` (instant jump), `'expo'` (fast accelerating zoom), `'linear'` (constant speed). `ZoomTriggerType`: `'sentence-start'`, `'exclamation'`, `'question'`, `'keyword'`, `'topic-transition'`, `'speaker-change'`, `'emphasis'`, `'ai-detected'`. |
| `src/components/panels/SmartZoomPanel.tsx` | UI panel. Sections: (1) Style selector -- 4 zoom style cards with visual previews (small animated GIF or CSS animation showing the style). (2) Intensity controls -- max zoom level slider (1.1x-2.0x), frequency selector (conservative: zoom on 20% of emphasis, moderate: 50%, aggressive: 80%). (3) Trigger toggles -- checkboxes for each ZoomTriggerType (sentence starts, exclamation marks, speaker changes, topic transitions). (4) AI Enhancement toggle -- uses Gemini to detect semantic emphasis points beyond rule-based heuristics. (5) Preview -- live preview of camera path on a mini timeline. (6) "Apply" and "Clear" buttons. |
| `src/services/smartZoomHeuristics.ts` | Rule-based emphasis detection. Functions: `detectSentenceStarts(segments)`, `detectExclamations(words)`, `detectQuestions(words)`, `detectKeywords(words, keywordList)`, `detectTopicTransitions(segments)` (large gap + topic change), `detectSpeakerChanges(segments)`. Each returns `ZoomPoint[]`. The main `detectAllHeuristic(segments, words, config)` function merges results, deduplicates nearby points, and scores them. |
| `src/services/smartZoomAI.ts` | Gemini-based emphasis detection. Sends the full transcript text to Gemini with a prompt asking it to identify the most important/dramatic/engaging moments with timestamps. Returns `ZoomPoint[]` with `type: 'ai-detected'`. Uses the Gemini proxy endpoint. Provides higher-quality results for complex content where rule-based detection misses nuance. |

### Data Flow

```
User has transcription data (from Feature #1)
  -> Opens SmartZoomPanel
  -> Configures: style (Smooth), intensity (0.7), frequency (moderate), triggers
  -> Clicks "Generate Smart Zoom"
  -> SmartZoomService.analyzeForZoom(segments, words, config)
     -> Rule-based detection:
        -> detectSentenceStarts() -> ZoomPoint[] at each sentence boundary
        -> detectExclamations() -> ZoomPoint[] at "!" with high intensity
        -> detectQuestions() -> ZoomPoint[] at "?" with medium intensity
        -> detectSpeakerChanges() -> ZoomPoint[] at speaker transitions
        -> detectTopicTransitions() -> ZoomPoint[] at long pauses + topic shifts
     -> Optional AI detection:
        -> smartZoomAI.detectEmphasis(transcriptText) via Gemini
        -> Merge AI-detected points with heuristic points
     -> Score and rank all points
     -> Filter by frequency setting (keep top 20%/50%/80%)
     -> Deduplicate nearby points (merge within 1 second)
  -> SmartZoomService.generateCameraKeyframes(zoomPoints, config, fps, totalFrames)
     -> For each ZoomPoint:
        Smooth style: ease-in-out zoom from 1.0 -> maxZoom over 15 frames, hold 10, return over 20
        Crash style:  instant jump to maxZoom (1 frame), hold 5, ease-out return over 15
        Expo style:   expo-in zoom over 10 frames, hold 5, ease-out return over 20
        Linear style: linear zoom over 20 frames, hold 10, linear return over 20
     -> Generate CameraKeyframe[] for each point with appropriate easing
     -> Insert base keyframes (zoom: 1.0) between zoom events
  -> useCameraStore.applySmartZoom(keyframes, config)
     -> Store keyframes, enable camera, set smartZoomConfig
  -> Camera keyframes are now in the store
  -> VideoCanvas / VideoComposition reads getCameraAtFrame() and applies transform
  -> User sees dynamic zoom during playback
  -> User can manually adjust individual keyframes in the Camera track on the timeline
  -> "Clear Smart Zoom" removes all generated keyframes
```

### Architecture Notes

1. **Zoom keyframe generation.** Each zoom point generates 3-4 camera keyframes: (a) pre-zoom at base state, (b) zoom peak at target zoom level, (c) optional hold, (d) return to base. The timing and easing vary by style. The `useCameraStore.addKeyframe()` method handles insertion and sorting. All generated keyframes use the same `easing` field from `CameraKeyframe` (`'linear' | 'ease-in' | 'ease-out' | 'ease-in-out'`).

2. **Pan direction.** For multi-character content with speaker diarization, the camera should pan toward the active speaker. If speakers are positioned (left/right), generate `panX` values that shift toward the speaking character. Read character positions from `useMultiCharacterStore` or `useCharacterConfigStore`. Without position data, use subtle random pan offsets (+-3%) for visual interest.

3. **Zoom intensity scaling.** The `intensity` field on `ZoomPoint` (0-1) scales the zoom amount: `actualZoom = 1 + (maxZoom - 1) * intensity`. Exclamation marks get `intensity: 0.9`, sentence starts get `intensity: 0.5`, speaker changes get `intensity: 0.3`. This creates natural variation -- not every zoom is the same depth.

4. **Frequency control.** "Conservative" keeps only the top 20% highest-scored zoom points. "Moderate" keeps 50%. "Aggressive" keeps 80%. This is applied after scoring and before keyframe generation. Too many zooms (aggressive on a fast talker) can be nauseating -- warn users and cap at max 1 zoom per 2 seconds.

5. **Overlap prevention.** If two zoom points are closer than `returnFrames + 5`, merge them into a single longer zoom or skip the weaker one. The deduplication step in `analyzeForZoom()` handles this by keeping the higher-intensity point when two points are within 1 second.

6. **AI emphasis detection.** The Gemini prompt should be specific: "You are a video editor analyzing a transcript for dramatic emphasis. Identify the 5-10 most important moments that deserve a camera zoom. For each, provide the exact timestamp and intensity (0.5 to 1.0). Focus on: emotional peaks, key revelations, punchlines, turning points, and call-to-action moments." Return JSON. This is optional and costs ~1000 tokens per request -- show estimated cost in the UI.

7. **Integration with existing camera.** Smart zoom keyframes should merge with (not replace) existing manual camera keyframes. The `applySmartZoom()` action should tag generated keyframes so `clearSmartZoom()` can remove only the auto-generated ones while preserving user-created keyframes. Use a pattern similar to the beat-sync tag system but at the camera store level. Add an optional `tag?: string` field to `CameraKeyframe`.

8. **Live preview.** Before applying, show a mini-preview: a small canvas or timeline visualization that shows camera zoom level over time as a waveform-like curve. Peaks represent zoom-in moments. This helps users evaluate the density and rhythm of the zoom pattern without affecting the main canvas.

9. **Style combinations.** Users should be able to apply different styles to different types of triggers. For example: Crash zoom on exclamation marks, Smooth zoom on sentence starts. The config supports this via per-trigger style overrides: `triggerStyleOverrides?: Partial<Record<ZoomTriggerType, ZoomStyle>>`. Default: all triggers use the global style.

### Acceptance Criteria

- [ ] SmartZoomPanel is accessible from the TranscriptPanel or as a standalone panel
- [ ] 4 zoom styles are available: Smooth, Crash, Expo, Linear
- [ ] Each style has a visual preview (animated demo)
- [ ] Max zoom slider controls zoom depth (1.1x to 2.0x)
- [ ] Frequency selector (Conservative/Moderate/Aggressive) controls how many zoom points are generated
- [ ] Trigger toggles enable/disable specific emphasis types (sentence starts, exclamation, question, speaker change, topic transition)
- [ ] Rule-based detection correctly identifies: sentence starts, exclamation marks, question marks, speaker changes, topic transitions
- [ ] AI Enhancement (Gemini) detects semantic emphasis points beyond heuristics
- [ ] Generated camera keyframes appear in the camera store and are visible in the Camera track on the timeline
- [ ] Zoom varies in depth based on emphasis intensity (exclamations deeper than sentence starts)
- [ ] Maximum 1 zoom per 2 seconds (prevents nauseating rapid zooms)
- [ ] Overlapping zoom points are merged or deduplicated
- [ ] "Smooth" style uses ease-in-out transitions over ~500ms
- [ ] "Crash" style uses instant jumps with ease-out recovery
- [ ] Camera pan shifts toward active speaker when speaker diarization data is available
- [ ] Preview visualization shows camera zoom curve over time
- [ ] "Apply" button generates and stores all keyframes
- [ ] "Clear Smart Zoom" removes only auto-generated keyframes (preserves manual keyframes)
- [ ] Generated keyframes can be individually edited in the Camera track
- [ ] Camera transforms render correctly in both live preview and export
- [ ] Works with transcripts from any provider (Whisper, Deepgram, AssemblyAI)

---

## Related

- [[feature-list]] — Features #1 Auto-Caption, #76 Silence Removal, #77 Smart Zoom
- [[feature-priorities]] — Auto-Caption is #1 ranked (score 28.0), unlocks 5+ downstream features. AI Video Intelligence category scoring
- [[PROGRESS]] — Track completion status
- [[phase-3|Phase 3: Audio & Voice]] — Previous phase
- [[phase-5|Phase 5: Character & Content Intelligence]] — Next phase
- [[phase-6]] — Text-based editing depends on transcription from this phase
