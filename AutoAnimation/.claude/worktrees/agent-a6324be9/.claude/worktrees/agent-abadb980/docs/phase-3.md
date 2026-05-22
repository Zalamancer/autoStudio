# Phase 3: Audio & Voice Intelligence

**Features:** #18 Beat Detection & Audio Sync, #20 AI Voice Cloning, #30 Audio-Reactive Visuals
**Timeline:** 2-3 weeks
**Theme:** Make audio a first-class citizen. Every visual can respond to sound.
**Dependencies:** None -- these are foundational.

---

## Feature #18: Beat Detection & Audio Sync

### What

Complete the beat detection system with a full UI panel, audio waveform visualization, and a beat grid overlay on the timeline. The engine (`beatDetection.ts`, `beatSync.ts`, `engine/beatSync.ts`) and store (`useBeatSyncStore.ts`) already detect beats, estimate BPM, and generate keyframes -- but the UX is minimal. This feature adds waveform rendering, interactive sensitivity controls, beat quantize tools, and a timeline overlay so users can see and snap to beats visually.

### Tech Stack

- **Web Audio API** -- `AnalyserNode` for real-time waveform data, `OfflineAudioContext` for pre-analysis (already used in `audioMixer.ts`)
- **Canvas 2D** -- render waveform and spectrogram inside the panel and on the timeline ruler
- **Existing libs** -- `beatDetection.ts` (spectral flux onset detection, BPM estimation, beat grid building), `beatSync.ts` (per-object keyframe generation), `engine/beatSync.ts` (musical time utilities)
- **Optional upgrade** -- Essentia.js WASM for ML-based beat tracking (more accurate than energy-based, especially for complex polyrhythmic music)

### Existing Code to Modify

| File | Changes |
|------|---------|
| `src/stores/useBeatSyncStore.ts` | Add `waveformData: Float32Array \| null`, `spectrumData: Float32Array \| null`, `sensitivity: number`, `manualBpm: number \| null`, `beatGridOffset: number` fields. Add `setSensitivity()`, `setManualBpm()`, `regenerateBeatGrid()`, `setBeatGridOffset()` actions. The store already has `analysis`, `analyzeAudio`, `objectConfigs`, `applyObjectBeatSync`, `clearObjectBeatSync`. |
| `src/components/panels/BeatSyncPanel.tsx` | Add waveform canvas, sensitivity slider, manual BPM override input, tap-tempo button, beat grid offset control. Currently has Audio Source section, Analysis Results, Camera Sync, and Object Sync. Extend the Audio Source section with a waveform viewer. Add a Quantize section for snap-to-beat on text/shape start/end frames. |
| `src/components/timeline/TimeRuler.tsx` | Render vertical beat marker lines. Read `useBeatSyncStore.analysis.beats` and `showBeatMarkers`. Draw semi-transparent colored lines at each beat frame position. Downbeats (every 4th) get stronger opacity. Must respect zoom level (`pixelsPerFrame`). |
| `src/components/timeline/Timeline.tsx` | Already imports `useBeatSyncStore`. Pass beat data to `TimeRuler` for overlay rendering. |
| `src/services/beatDetection.ts` | Add `redetectWithSensitivity(audioBuffer, sensitivity)` variant that adjusts the `ONSET_THRESHOLD` constant based on user sensitivity slider. Add optional `manualBpm` parameter to `buildBeatGrid()` to override auto-detected BPM while keeping phase alignment. |
| `src/services/beatSync.ts` | Add `snapAllToBeats(beatFrames, maxDistance)` function that snaps all text overlay and shape start/end frames to nearest beats in a single pass. Already has `snapToNearestBeat()` and `applyBeatSync()` but the latter does too many things at once. |

### New Code to Create

| File | Purpose |
|------|---------|
| `src/components/panels/WaveformCanvas.tsx` | React component wrapping a `<canvas>` element. Accepts an `AudioBuffer` or blob URL. Decodes audio, renders waveform as vertical amplitude bars. Supports zoom, scroll, and click-to-seek. Highlights beat positions with colored markers overlaid on the waveform. Reusable across BeatSyncPanel and potentially a future audio editor. |
| `src/components/timeline/BeatGridOverlay.tsx` | Extracted component for rendering beat lines on the timeline. Reads from `useBeatSyncStore`. Renders lines at beat frame positions with opacity varying by beat strength. Uses `getBeatFramesInRange()` from `engine/beatSync.ts` to only render visible beats (performance). |
| `src/hooks/useTapTempo.ts` | Hook for tap-tempo BPM entry. Records timestamps of taps, computes average interval, converts to BPM. Resets after 2 seconds of inactivity. Returns `{ bpm: number | null, tapCount: number, tap: () => void, reset: () => void }`. |

### Data Flow

```
User uploads/selects audio (MediaPanel audio asset)
  -> BeatSyncPanel "Analyze" button
  -> useBeatSyncStore.analyzeAudio(url)
  -> beatDetection.detectBeatsFromUrl(url)
     -> fetch + decode AudioBuffer
     -> computeSpectralFlux() -> detectOnsets() -> estimateBPM() -> buildBeatGrid()
  -> BeatAnalysis { bpm, beats[], onsets[], segments[], duration }
  -> Store updates: analysis, waveformData (raw channel data for rendering)
  -> WaveformCanvas renders amplitude + beat markers
  -> TimeRuler / BeatGridOverlay renders beat lines on timeline
  -> User adjusts sensitivity -> redetectWithSensitivity() -> new analysis
  -> User applies to objects:
     -> applyObjectBeatSync(configs, fps, clipRanges)
     -> generateObjectBeatKeyframes() -> per-property keyframes
     -> useKeyframeStore.setTaggedKeyframe() with 'beat-sync' tag
```

### Architecture Notes

1. **Keep energy-based detection as default.** The existing spectral flux approach in `beatDetection.ts` works well for electronic/pop music. Essentia.js WASM adds ~2MB to bundle and 500ms startup -- only worthwhile if users report accuracy issues with acoustic/jazz content. Add it as an optional "Advanced Detection" toggle behind a dynamic import.

2. **Waveform rendering performance.** A 3-minute audio at 48kHz has ~8.6M samples. The `WaveformCanvas` must downsample to pixel resolution: for a 400px-wide canvas, compute min/max amplitude per ~21,500 sample bucket. Pre-compute this on analysis and cache in the store. Do NOT iterate raw samples on every render.

3. **Beat grid offset is critical.** The current `buildBeatGrid()` in `beatDetection.ts` already does phase alignment via a 16-step search, but users need manual control. The offset slider should shift the entire grid by fractions of a beat interval. Store as seconds, apply additively to all beat timestamps.

4. **Timeline overlay must be zoom-aware.** `TimeRuler.tsx` already receives `pixelsPerFrame` and `totalWidth`. Beat markers should use the same coordinate system. Use `getBeatFramesInRange(startFrame, endFrame, bpm, fps)` from `engine/beatSync.ts` to only compute visible beats, avoiding O(n) iteration over all beats when zoomed in.

5. **Tag system for cleanup.** The store already uses `removeTaggedKeyframes(ref, 'beat-sync')` to cleanly remove all beat-generated keyframes without touching user-created ones. This is correct -- do not change it.

6. **Snap-to-beat should be non-destructive.** When snapping text/shape start/end frames, record the original values so the user can undo. `useTimelineStore` already has `temporal()` (zundo) for undo/redo. Ensure snap operations go through the stores that have undo middleware.

### Acceptance Criteria

- [ ] User can select any audio asset from MediaPanel and analyze it for beats
- [ ] Waveform visualization renders in the BeatSyncPanel showing amplitude over time
- [ ] Beat markers appear as vertical lines overlaid on the waveform
- [ ] BPM, beat count, and onset count display after analysis (already works -- verify)
- [ ] Sensitivity slider (0-1) re-runs detection with adjusted threshold
- [ ] Manual BPM override input overrides auto-detected BPM while keeping phase alignment
- [ ] Tap-tempo button computes BPM from user taps and applies as manual BPM
- [ ] Beat grid offset slider shifts all beat positions by fractions of a beat
- [ ] Beat lines appear on the timeline ruler at beat frame positions
- [ ] Downbeats (every 4th beat) render with stronger visual weight
- [ ] Beat markers toggle on/off (already works via `showBeatMarkers`)
- [ ] Camera sync generates zoom-pulse keyframes at beat positions (already works -- verify)
- [ ] Per-object beat sync generates keyframes for selected object (already works -- verify)
- [ ] "Snap All to Beats" button snaps text/shape start/end frames to nearest beats
- [ ] All beat-sync keyframes are tagged and removable without affecting user keyframes

---

## Feature #20: AI Voice Cloning

### What

Build a complete UI for the voice cloning flow that already exists in the backend. Users can upload voice samples (audio files), name their cloned voice, monitor cloning progress, preview the result, and then use the cloned voice alongside ElevenLabs library voices for all TTS generation. The API integration (`elevenlabs.ts`) and store actions (`useVoiceStore.cloneVoice()`) are fully implemented -- this feature is purely UI and UX polish.

### Tech Stack

- **ElevenLabs API** -- `POST /v1/voices/add` for Instant Voice Cloning (1-5 samples, any length), `POST /v1/voices/add` with `use_professional_voice_clone=true` for Professional Voice Cloning (30min+ samples, human verification)
- **Server proxy** -- `POST /api/proxy/elevenlabs/voices/add` (already routes through `server/routes/proxy.ts`)
- **Web Audio API** -- `AudioContext.decodeAudioData()` for sample duration/quality validation
- **Existing code** -- `ElevenLabsService.cloneVoice()` in `elevenlabs.ts`, `useVoiceStore.cloneVoice()`, `clonedVoices[]`, `isCloning`, `cloneError`, `deleteClonedVoice()`, `fetchClonedVoices()`

### Existing Code to Modify

| File | Changes |
|------|---------|
| `src/stores/useVoiceStore.ts` | Add `cloneProgress: number` (0-1 for upload progress), `selectedCloneSamples: File[]`, `cloneSampleDurations: number[]` fields. Add `addCloneSample(file)`, `removeCloneSample(index)`, `clearCloneSamples()` actions. Add `validateSamples(): { valid: boolean, warnings: string[] }` that checks total duration >= 60s, file format (wav/mp3/m4a), individual file size. Modify `cloneVoice()` to update `cloneProgress` during upload via XMLHttpRequest with progress events. |
| `src/components/panels/VoicesPanel.tsx` | Add "Clone Voice" button in the voice list header. When cloned voices exist, show them in a "My Cloned Voices" section above the library voices with a distinct badge. Add delete button per cloned voice (calls `deleteClonedVoice()`). |
| `src/services/elevenlabs.ts` | Modify `cloneVoice()` to accept an optional `onProgress?: (progress: number) => void` callback. Switch from `fetch()` to `XMLHttpRequest` for upload progress tracking. Add `previewVoice(voiceId, text)` method that generates a short speech sample for preview without saving it. |
| `src/components/layout/LeftPanel/LeftPanel.tsx` | The Voices tab already exists. No changes needed unless we add a dedicated "Clone" sub-tab. |

### New Code to Create

| File | Purpose |
|------|---------|
| `src/components/panels/VoiceClonePanel.tsx` | Full voice cloning UI. Sections: (1) Sample Upload -- drag-and-drop zone for audio files, shows each sample with name, duration, waveform mini-preview, remove button. (2) Quality Indicator -- total duration bar showing "min 1 min for Instant, 30+ min for Professional" with color coding. (3) Voice Details -- name input, description textarea, language selector. (4) Clone Button -- disabled until samples meet minimum requirements. Shows progress bar during cloning. (5) Result -- on success, shows the new voice with a "Preview" button that generates a short test phrase. |
| `src/hooks/useAudioDuration.ts` | Hook that accepts a `File` and returns `{ duration: number, isLoading: boolean, error: string | null }`. Uses `AudioContext.decodeAudioData()` to get accurate duration. Caches results by file reference. |
| `src/components/ui/AudioSampleCard.tsx` | Reusable card for displaying an uploaded audio sample. Shows filename, duration, format badge, mini waveform (simplified -- just peak values), and remove button. Used in VoiceClonePanel. |

### Data Flow

```
User opens VoiceClonePanel
  -> Drag/drop or file picker -> addCloneSample(file)
  -> useAudioDuration hook decodes each file -> cloneSampleDurations updated
  -> validateSamples() checks total duration, formats
  -> Quality indicator shows green/yellow/red based on total duration
  -> User fills in name + description
  -> Clicks "Clone Voice"
  -> useVoiceStore.cloneVoice(name, description, selectedCloneSamples)
     -> ElevenLabsService.cloneVoice(name, description, files)
        -> XHR upload with progress callback -> cloneProgress updates
        -> POST /api/proxy/elevenlabs/voices/add
        -> ElevenLabs returns { voice_id }
     -> Store saves to clonedVoices[], persists to DB via apiClient
     -> fetchVoices() refreshes the full voice list
  -> New voice appears in VoicesPanel under "My Cloned Voices"
  -> User can preview, select for TTS, or delete
```

### Architecture Notes

1. **Instant vs Professional cloning.** ElevenLabs Instant Voice Cloning needs only a few seconds of audio and returns immediately. Professional Voice Cloning needs 30+ minutes and involves human verification (takes hours). For MVP, implement Instant only. Add a toggle for Professional later. The API parameter is `use_professional_voice_clone=true` in the form data.

2. **Sample validation is crucial for UX.** Bad samples produce bad clones. Validate: (a) total duration >= 60 seconds (ElevenLabs minimum for decent quality), (b) file format is supported (wav, mp3, m4a, webm, ogg), (c) no single file exceeds 10MB (ElevenLabs limit per sample), (d) audio has actual speech content (check RMS energy > threshold to reject silence). Show warnings, not errors -- let users proceed with suboptimal samples but explain quality implications.

3. **Upload progress.** The current `fetch()` API in `elevenlabs.ts` does not support upload progress. Switch to `XMLHttpRequest` with `xhr.upload.onprogress` for the clone endpoint only. Keep `fetch()` for all other endpoints. The progress callback flows: XHR -> ElevenLabsService -> useVoiceStore.cloneVoice -> cloneProgress state -> UI progress bar.

4. **Cloned voices in the picker.** The `fetchVoices()` call in `useVoiceStore.ts` already returns all voices including cloned ones (ElevenLabs API includes them). The separate `clonedVoices[]` array tracks which ones the user created for the delete button. After cloning, `fetchVoices()` is called to refresh, so the new voice automatically appears.

5. **Persistence.** Cloned voices live on ElevenLabs servers permanently (until deleted). The `clonedVoices[]` array in the store is persisted to the backend via `apiClient.post('/api/proxy/elevenlabs/user-voices')` for cross-device sync. If the user is not authenticated, cloned voices still work (they are on ElevenLabs) but the "My Cloned Voices" section will not show them until `fetchVoices()` runs.

6. **Voice preview.** Add a "Preview" button that calls `generateSpeech()` with a short predefined phrase ("Hello, this is my cloned voice. How does it sound?") and the cloned voice ID. Play the result in an `<audio>` element. This lets users verify quality before using the voice in a project.

### Acceptance Criteria

- [ ] VoiceClonePanel is accessible from VoicesPanel via a "Clone Voice" button
- [ ] Users can drag-and-drop or browse for audio sample files (wav, mp3, m4a, webm, ogg)
- [ ] Each uploaded sample shows filename, duration, and a remove button
- [ ] Quality indicator shows total sample duration with color-coded thresholds
- [ ] Warning messages appear for: total duration < 60s, unsupported format, file > 10MB
- [ ] Name and description fields are required before cloning
- [ ] Clone button is disabled until minimum requirements are met
- [ ] Progress bar shows upload progress during cloning
- [ ] On success, the new voice appears in VoicesPanel under "My Cloned Voices"
- [ ] Cloned voices have a distinct visual badge in the voice picker
- [ ] "Preview" button generates and plays a short test phrase with the cloned voice
- [ ] Delete button removes the cloned voice from ElevenLabs and the local list
- [ ] Cloned voice can be selected and used for all TTS generation (script, dialogue)
- [ ] Error states show clear messages (API key missing, upload failed, etc.)

---

## Feature #30: Audio-Reactive Visuals

### What

Allow any keyframe-animatable property of any canvas object to be driven by audio frequency or amplitude data in real time. Users create "audio reactive mappings" that bind a frequency band (sub-bass, bass, mids, treble) or overall amplitude to a property (scale, opacity, rotation, position, blur), with configurable sensitivity and smoothing. During playback and export, the engine reads audio data and writes animated values frame-by-frame.

### Tech Stack

- **Web Audio API** -- `AnalyserNode.getByteFrequencyData()` for real-time spectrum, `AnalyserNode.getByteTimeDomainData()` for waveform amplitude
- **OfflineAudioContext** -- for pre-computing the entire audio reactive envelope during export (cannot use real-time AnalyserNode in offline context, so must manually compute FFT)
- **Existing keyframe system** -- `useKeyframeStore.setTaggedKeyframe()` with an `'audio-reactive'` tag for pre-baked keyframes
- **Existing beat system** -- `beatDetection.ts` already decodes audio and provides `BeatAnalysis` with segments/energy data

### Existing Code to Modify

| File | Changes |
|------|---------|
| `src/stores/useKeyframeStore.ts` | No structural changes. Use existing `setTaggedKeyframe()` and `removeTaggedKeyframes()` with the tag `'audio-reactive'`. |
| `src/services/beatDetection.ts` | Add `computeFrequencyBands(audioBuffer, fps): FrequencyBandData` function that pre-computes per-frame frequency band energy levels. This is needed for export (offline rendering). Uses manual FFT via `Float32Array` and `Math.sin/cos` (no AnalyserNode available offline). Return shape: `{ [band: string]: number[] }` where each array is per-frame energy 0-1. |
| `src/components/canvas/VideoCanvas.tsx` | During playback, call `audioReactiveEngine.getValuesAtFrame(frame)` and apply reactive property overrides to rendered objects before drawing. This is additive to existing keyframe values. |
| `src/remotion/VideoComposition.tsx` | During export, read pre-baked audio reactive keyframes from the keyframe store (these were baked before export started). No real-time audio processing during Remotion render. |
| `src/services/videoExport.ts` | Before starting export, call `bakeAudioReactiveKeyframes()` to pre-compute all audio reactive values as keyframes in the store. This converts real-time reactive mappings into static keyframe data that Remotion can read. |

### New Code to Create

| File | Purpose |
|------|---------|
| `src/services/audioReactiveEngine.ts` | Core engine. `AudioReactiveEngine` class manages mappings and computes property values. Methods: `addMapping(config)`, `removeMapping(id)`, `getValuesAtFrame(frame): Map<string, Map<string, number>>` (objectRef -> property -> value). For real-time playback: uses Web Audio `AnalyserNode` connected to the audio source. For export: uses pre-computed `FrequencyBandData`. Applies sensitivity curve, smoothing (exponential moving average), and value range mapping. |
| `src/stores/useAudioReactiveStore.ts` | Zustand store for reactive mapping configurations. State: `mappings: AudioReactiveMapping[]`, `isActive: boolean`, `previewMode: boolean`. Mapping shape: `{ id, audioSource: 'music' \| 'dialogue' \| 'sfx', frequencyBand: FrequencyBand, targetObjectRef: CanvasObjectRef, targetProperty: string, sensitivity: number (0-1), smoothing: number (0-200ms), minValue: number, maxValue: number, invert: boolean }`. Actions: `addMapping()`, `updateMapping()`, `removeMapping()`, `bakeToKeyframes(fps, totalFrames)`. |
| `src/components/panels/AudioReactivePanel.tsx` | UI panel. Sections: (1) Audio Source selector (music/dialogue/SFX tracks). (2) Mapping list -- each mapping shows frequency band picker, target object selector, target property dropdown, sensitivity slider, smoothing slider, min/max value range, invert toggle. (3) Live preview toggle -- when enabled, values pulse in real time during playback. (4) "Bake to Keyframes" button for export preparation. (5) Preset mappings: "Bass Pulse" (bass -> scale), "Treble Sparkle" (treble -> opacity), "Full Bounce" (amplitude -> position.y). |
| `src/services/frequencyBands.ts` | Frequency band definitions and utilities. `FrequencyBand` enum: `'sub-bass'` (20-60Hz), `'bass'` (60-250Hz), `'low-mid'` (250-500Hz), `'mid'` (500-2kHz), `'high-mid'` (2k-4kHz), `'treble'` (4k-20kHz), `'amplitude'` (overall RMS). `getBandRange(band): [lowHz, highHz]`. `extractBandEnergy(frequencyData, band, sampleRate, fftSize): number` (0-1 normalized). |
| `src/hooks/useAudioReactivePlayback.ts` | Hook that creates and manages a Web Audio `AnalyserNode` during live playback. Connects to the active audio source (music track blob URL). On each animation frame, reads frequency data and updates the `AudioReactiveEngine`. Returns `{ isConnected, spectrum: Uint8Array, connect(audioUrl), disconnect() }`. |

### Data Flow

```
LIVE PLAYBACK:
  Audio element plays music/dialogue
  -> useAudioReactivePlayback hook creates AudioContext + AnalyserNode
  -> MediaElementAudioSourceNode connects audio element -> AnalyserNode -> destination
  -> requestAnimationFrame loop:
     -> AnalyserNode.getByteFrequencyData() -> 1024-bin spectrum
     -> frequencyBands.extractBandEnergy() for each mapped band
     -> audioReactiveEngine applies sensitivity, smoothing, range mapping
     -> Returns { objectRef -> property -> value }
  -> VideoCanvas reads values and applies as additive transform overrides
  -> Visual properties pulse in sync with audio

EXPORT (pre-bake):
  User clicks Export (or "Bake to Keyframes")
  -> useAudioReactiveStore.bakeToKeyframes(fps, totalFrames)
  -> beatDetection.computeFrequencyBands(audioBuffer, fps) -> per-frame band energies
  -> For each mapping, for each frame:
     -> Read band energy at frame
     -> Apply sensitivity, smoothing, range mapping
     -> useKeyframeStore.setTaggedKeyframe(objectRef, property, frame, value, 'ease-out', 'audio-reactive')
  -> Keyframes now exist in the store as regular tagged keyframes
  -> Remotion/canvas2dRenderer reads them via interpolatePropertyKeyframes()
  -> Export proceeds normally
```

### Architecture Notes

1. **Real-time vs pre-baked.** The Web Audio `AnalyserNode` only works in real-time with a running `AudioContext`. For export (which uses `OfflineAudioContext` or Remotion's frame-by-frame rendering), we cannot use `AnalyserNode`. Solution: pre-bake all audio reactive values as keyframes before export. The "Bake to Keyframes" action computes every frame's value and writes them to `useKeyframeStore` with the `'audio-reactive'` tag.

2. **Manual FFT for export.** `computeFrequencyBands()` in `beatDetection.ts` must implement a basic DFT or use the existing energy computation. For simplicity, compute RMS energy in frequency sub-bands by running a sliding window FFT over the raw audio samples. The window size should match the frame rate: at 30fps, each window is `sampleRate / 30` samples (~1600 samples at 48kHz). Use a Hanning window for spectral smoothing.

3. **Smoothing is essential.** Raw frequency data is noisy and jittery. Apply exponential moving average (EMA) with configurable time constant: `smoothed = prev * alpha + current * (1 - alpha)` where `alpha = Math.exp(-1 / (smoothingMs * fps / 1000))`. Default 50ms smoothing gives responsive but clean animation. Higher smoothing (150-200ms) gives slow, flowing motion.

4. **Additive vs override.** Audio reactive values should be ADDITIVE to existing keyframe values. If a text overlay has `opacity: 0.8` from a keyframe, and audio reactive maps amplitude -> opacity with range `[0, -0.3]`, the final value is `0.8 + (-0.3 * amplitude)`. This lets users combine hand-animated keyframes with audio-driven modulation.

5. **Performance.** During live playback, the `AnalyserNode` runs on the audio thread and `getByteFrequencyData()` is a fast copy. The per-frame computation (band extraction + mapping) for 5-10 mappings is trivial (~0.1ms). During baking, iterating 900 frames (30s at 30fps) with FFT per frame takes ~50ms total -- negligible. No Web Worker needed.

6. **Memory for pre-baked keyframes.** At 30fps for 60 seconds with 5 mappings, that is 9000 keyframes. Each `PropertyKeyframe` object is small (~100 bytes). Total: ~900KB. Acceptable. But warn users if they try to bake a 10-minute clip with 20 mappings (that is 360,000 keyframes).

7. **Tag cleanup.** Use `'audio-reactive'` tag for all baked keyframes. On any mapping change, call `removeTaggedKeyframes(ref, 'audio-reactive')` before re-baking. This prevents stale keyframes from accumulating. The `clearObjectBeatSync` pattern from `useBeatSyncStore.ts` is the reference implementation.

8. **Connecting to audio.** The `MediaElementAudioSourceNode` can only be created once per `<audio>` element. If the audio element is already connected (e.g., for visualization elsewhere), reuse the same source node. Store the connection state in the hook and check before creating a new one. CORS restrictions apply to cross-origin audio -- use blob URLs from the media store (which are always same-origin).

### Acceptance Criteria

- [ ] AudioReactivePanel is accessible from the left panel
- [ ] User can create a new audio reactive mapping
- [ ] Mapping UI shows: frequency band picker (sub-bass/bass/low-mid/mid/high-mid/treble/amplitude), target object selector, target property dropdown, sensitivity slider, smoothing slider, min/max value range, invert toggle
- [ ] During playback, mapped properties animate in sync with audio
- [ ] Frequency spectrum visualization shows in the panel during playback
- [ ] Multiple mappings can target different properties of the same or different objects
- [ ] Preset mappings ("Bass Pulse", "Treble Sparkle", "Full Bounce") apply one-click configurations
- [ ] "Bake to Keyframes" pre-computes all reactive values as keyframes in the store
- [ ] Baked keyframes are tagged `'audio-reactive'` and can be removed independently
- [ ] Export works correctly with baked audio reactive keyframes
- [ ] Smoothing slider visually changes how responsive the animation is
- [ ] Sensitivity slider scales the input signal (0 = no response, 1 = full range)
- [ ] Invert toggle reverses the mapping direction (high energy = low value)
- [ ] Values are additive to existing keyframes (does not override hand-animated values)
- [ ] Works with music, dialogue, and SFX audio tracks
- [ ] No audio glitches or playback interruption when connecting the AnalyserNode

---

## Related

- [[feature-list]] — Features #18 Beat Sync, #21 Voice Clone, #66 Audio-Reactive Visuals
- [[feature-priorities]] — Beat Detection (#5) and Voice Cloning (#2) are top-tier, with AI Editing Intelligence and AI Content Generation scoring
- [[PROGRESS]] — Track completion status
- [[phase-2|Phase 2: Animation Engine]] — Previous phase
- [[phase-4|Phase 4: Transcription Foundation]] — Next phase (depends on audio infrastructure)
- [[phase-5]] — Audio-reactive visuals extend to content intelligence
