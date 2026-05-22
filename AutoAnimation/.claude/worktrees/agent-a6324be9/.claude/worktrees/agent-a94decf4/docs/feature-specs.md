# ProAnimate — Feature Research Document

**Date:** March 12, 2026
**Source:** Competitive analysis of 60+ competitors (see `research.md`)
**Scope:** 60 features across 10 categories
**Purpose:** Pure product specification — no implementation or code details

---

## Table of Contents

1. [Category 1: AI Video Intelligence](#category-1-ai-video-intelligence) — Features 1, 2, 5, 7, 8, 22
2. [Category 2: AI Content Generation](#category-2-ai-content-generation) — Features 9, 19, 20, 24, 33, 35, 36, 37, 39
3. [Category 3: AI Editing Intelligence](#category-3-ai-editing-intelligence) — Features 18, 23, 29, 30, 31, 32, 38
4. [Category 4: Animation Engine](#category-4-animation-engine) — Features 13, 14, 15, 16, 17, 49, 57
5. [Category 5: Canvas & Design Tools](#category-5-canvas--design-tools) — Features 43, 44, 50
6. [Category 6: Export & Output](#category-6-export--output) — Features 3, 4, 11, 12, 26, 40, 45, 47, 58, 60
7. [Category 7: Distribution & Publishing](#category-7-distribution--publishing) — Features 6, 10, 54
8. [Category 8: Collaboration](#category-8-collaboration) — Features 21, 25, 46
9. [Category 9: Automation & Developer Tools](#category-9-automation--developer-tools) — Features 27, 28, 41, 42, 48, 51, 52, 53
10. [Category 10: Specialized Modes](#category-10-specialized-modes) — Features 34, 55, 56, 59

---

## Feature Entry Format

Each feature is documented with:
- **Category** — Which group it belongs to
- **What it is** — One-line definition
- **What it does** — Detailed functionality description
- **User flow** — Step-by-step interaction
- **Properties/Parameters** — Configurable options, settings, defaults
- **Output** — What the user gets
- **Acceptance criteria** — Definition of done
- **Edge cases** — Known edge cases and handling
- **Dependencies** — Features it depends on or enables
- **Integration with ProAnimate** — Connection to existing systems
- **Use cases** — Real-world scenarios
- **Why it matters** — Business context and competitive importance
- **Who has it** — Competitors with this feature
- **Gold standard** — Best-in-class reference implementation

---

## Category 1: AI Video Intelligence

### 1. AI Auto-Caption/Transcription
- **Category:** AI Video Intelligence
- **What it is:** Automatic speech-to-text transcription system that generates time-synchronized captions from audio/video content with word-level accuracy.
- **What it does:** Processes audio tracks (from uploaded video, imported audio files, or ElevenLabs-generated TTS) through a speech-to-text engine to produce word-level timestamped transcripts. The system detects language automatically, supports 50+ languages, identifies individual speakers via diarization, and outputs styled caption overlays that sync precisely to spoken words. It also auto-detects and highlights keywords, applies emoji annotations based on context, and offers multiple caption animation styles (word-by-word pop, karaoke highlight sweep, sentence fade).
- **User flow:**
  1. User imports a video/audio file or has existing generated TTS audio in the project
  2. User clicks "Generate Captions" from the Captions panel or the auto-caption button on the timeline
  3. System displays a language detection result with confidence score; user can override the detected language
  4. Transcription processes with a progress indicator (typically 10-30 seconds for a 60s clip)
  5. Word-level transcript appears in an editable text panel alongside the timeline
  6. User reviews and corrects any misrecognized words by clicking on them
  7. Caption style picker lets user choose from 20+ preset styles (font, color, position, animation)
  8. User toggles optional features: keyword highlighting, emoji auto-insertion, filler word markers
  9. Captions appear on the canvas preview in real-time as the clip plays
- **Properties/Parameters:**
  - `language`: Auto-detected or manually selected (ISO 639-1 code, default: `'auto'`)
  - `model`: Transcription model (`'standard'` | `'enhanced'`, default: `'enhanced'`)
  - `maxSpeakers`: Number of speakers to diarize (1-10, default: `2`)
  - `wordLevelTimestamps`: Boolean, always `true` for caption sync
  - `punctuate`: Auto-punctuation (default: `true`)
  - `profanityFilter`: Censor profanity (default: `false`)
  - `captionStyle`: Reference to CaptionStyle preset
  - `maxWordsPerLine`: Words per caption line (1-8, default: `4`)
  - `maxLinesOnScreen`: Simultaneous visible lines (1-3, default: `2`)
  - `positionY`: Vertical position as percentage (0-100, default: `85` for bottom)
  - `keywordHighlight`: Auto-detect and style important words (default: `true`)
  - `emojiInsert`: Auto-add contextual emojis (default: `false`)
  - `fontSize`: Point size (12-72, default: `32`)
  - `fontFamily`: From the 26 supported families in ProAnimate
  - `backgroundColor`: Caption background color and opacity
  - `animationStyle`: `'pop'` | `'typewriter'` | `'karaoke'` | `'fade'` | `'slide-up'` | `'bounce'` (default: `'pop'`)
- **Output:** A `CaptionTrack` object containing an array of `WordEvent[]` with frame-accurate timestamps, styled caption overlay rendered on the Remotion composition, and an exportable SRT/VTT subtitle file.
- **Acceptance criteria:**
  - Transcription accuracy is 95%+ for clear English audio (measured on a standard test set)
  - Word-level timestamp accuracy is within 50ms of actual speech boundaries
  - All 50+ supported languages produce usable output (85%+ accuracy for Tier 1 languages)
  - Captions render correctly on all 5 supported aspect ratios (16:9, 9:16, 1:1, 4:3, 21:9)
  - Editing a word in the transcript immediately updates the canvas overlay
  - Export includes embedded captions in the MP4/WebM and a downloadable SRT file
  - Processing time is under 30 seconds for clips up to 120 seconds
  - Speaker diarization correctly identifies 2+ distinct speakers with 90%+ accuracy
  - Caption styles are preserved through the Remotion export pipeline
- **Edge cases:**
  - **Overlapping speakers:** When two speakers talk simultaneously, the system should flag the segment as "overlapping" and display both transcripts with speaker labels, accepting lower accuracy
  - **Non-speech audio:** Music, sound effects, or ambient noise should not produce false transcriptions; the system should output silence markers
  - **Heavy accents:** Provide a manual language/accent hint dropdown for cases where auto-detection fails
  - **Very short clips (<3 seconds):** May not have enough audio context for language detection; default to project language setting
  - **Mixed languages (code-switching):** Flag segments where the detected language changes mid-sentence and allow per-segment language override
  - **Background music with vocals:** Provide a "speech isolation" preprocessing toggle that attempts to separate speech from music before transcription
- **Dependencies:**
  - Depends on: Audio track availability (from ElevenLabs TTS, imported audio, or video import)
  - Enables: Text-Based Video Editing (feature 22), AI Silence/Filler Removal (feature 2), Long-to-Short Clip Extraction (feature 7), AI Smart Zoom (feature 8)
- **Integration with ProAnimate:**
  - Extends the existing `CaptionProcessor` class in `src/services/captions.ts` which already handles ElevenLabs alignment data
  - Reuses `WordEvent` and `VisemeEvent` types from `src/types/voice.ts` for consistent timestamp formatting
  - Caption overlays render through the existing `CaptionOverlay.tsx` canvas component and `RemotionCaptions.tsx` export layer
  - Caption style settings integrate with `useVoiceStore.ts` which already manages `CaptionStyle` state
  - Language detection results feed into the orchestrator's `language` field in `ClipPlan`
  - Speaker diarization maps to the existing multi-character system in `useMultiCharacterStore.ts`
- **Use cases:**
  - A creator imports a recorded podcast clip and wants auto-generated, styled captions for a TikTok repost without manually typing any subtitles
  - An education content maker generates TTS dialogue via ElevenLabs and needs precise karaoke-style captions highlighting each word as it is spoken for language learning content
  - A marketing team creates product demos in English and needs automatic caption generation in Spanish, French, and German for international audiences
- **Why it matters:** Auto-captions are the single most requested feature in short-form video tools, with 80%+ of social video now consumed with sound off. Submagic built its $8M ARR primarily on caption quality. Accurate, stylish auto-captions reduce a 30-minute manual task to under 1 minute, directly improving creator velocity and content accessibility. This is table-stakes functionality that every competitor offers.
- **Who has it:** Submagic (98-99% accuracy, 50+ languages, emoji-rich styles), CapCut (23 languages, free, keyword highlighting), Captions App (100+ languages, AI-styled), Descript (transcript-based editing), OpusClip (auto-captions with virality scoring), Cardboard (spatially-aware captions)
- **Gold standard:** Submagic sets the benchmark with 98-99% accuracy across 48+ languages, automatic emoji insertion, keyword highlighting, and 20+ viral caption style presets that mirror top-performing TikTok creators. Their system processes captions, applies styling, and syncs animations in a single automated pass, with the entire pipeline completing in under 15 seconds for a 60-second clip.

---

### 2. AI Silence/Filler Removal
- **Category:** AI Video Intelligence
- **What it is:** Automatic detection and removal of silence gaps, filler words (um, uh, like, you know), and dead air from audio/video content.
- **What it does:** Analyzes the audio waveform and transcript to identify three categories of unwanted content: (a) silence gaps exceeding a configurable threshold, (b) filler words and verbal tics, and (c) false starts and repeated phrases. The system marks each detected segment on the timeline, lets the user review them, and can either remove them entirely, shorten silences to a natural pause duration, or replace filler words with clean silence. All removals maintain smooth audio crossfades to avoid jarring cuts.
- **User flow:**
  1. User has a video/audio track on the timeline (imported or generated)
  2. User clicks "Remove Silences & Fillers" from the Timeline Controls or Audio panel
  3. System scans the audio track (progress bar shows analysis phase)
  4. A detection results panel appears showing: X silence gaps found, Y filler words found, Z false starts found
  5. User selects removal intensity: Gentle (long silences only), Moderate (silences + fillers), Aggressive (all detected segments)
  6. Preview mode lets user scrub through the "cleaned" version with before/after toggle
  7. User can manually exclude specific detected segments by unchecking them
  8. User clicks "Apply" to execute the removals, creating new timeline clips
  9. Undo is available to revert all changes as a single operation
- **Properties/Parameters:**
  - `silenceThresholdDb`: Audio level below which content counts as silence (-30dB to -60dB, default: `-40dB`)
  - `minSilenceDurationMs`: Minimum silence duration to flag (100ms-2000ms, default: `500ms`)
  - `keepPauseDurationMs`: Duration to preserve when shortening silences (50ms-500ms, default: `150ms`)
  - `fillerWords`: List of filler words to detect (default: `['um', 'uh', 'ah', 'er', 'like', 'you know', 'basically', 'literally', 'right', 'so']`)
  - `customFillerWords`: User-added filler words array
  - `removeMode`: `'gentle'` | `'moderate'` | `'aggressive'` (default: `'moderate'`)
  - `detectFalseStarts`: Boolean, detect and mark sentence restarts (default: `true`)
  - `crossfadeDurationMs`: Crossfade applied at cut points (10ms-100ms, default: `30ms`)
  - `preserveBreathing`: Keep natural breath sounds between sentences (default: `true`)
  - `maxRemovalPercent`: Safety cap on total content removed (10-80%, default: `50%`)
- **Output:** Modified timeline with silence/filler segments removed or shortened; a summary report showing total time saved, number of edits, and before/after duration; and an undo snapshot stored in the Zundo undo stack.
- **Acceptance criteria:**
  - Silence detection accuracy is 98%+ (false positive rate under 2%)
  - Filler word detection accuracy is 90%+ for the default English filler word list
  - All audio cuts use smooth crossfades with no audible pops, clicks, or artifacts
  - Removing 30% of a 60-second clip completes processing in under 10 seconds
  - The before/after preview plays back in real-time without buffering
  - Undo restores the exact original timeline state in a single action
  - Visual timeline markers correctly indicate removed segments
  - Works correctly with multi-track audio (background music preserved, only speech track edited)
  - The `maxRemovalPercent` safety cap prevents accidentally destroying content
- **Edge cases:**
  - **Intentional dramatic pauses:** The system should allow users to whitelist specific silence segments that serve a narrative purpose (e.g., comedic timing beats)
  - **Non-English filler words:** For non-English content, the filler word list should adapt based on the detected language (e.g., "euh" in French, "pues" in Spanish)
  - **Music-only segments:** Silence detection should not flag instrumental breaks or musical rests; it should only operate on speech-containing tracks
  - **Stutter/speech impediment:** Provide a "speech-sensitive" mode that is less aggressive with repeated syllables to avoid discriminatory removal
  - **Very short clips (<5 seconds):** Warn the user if silence removal would reduce the clip below a minimum viable duration (3 seconds)
  - **Lip sync misalignment:** When silence is removed from a clip with character animation, the viseme timeline and emotion timeline must be re-synchronized to the new audio timing
- **Dependencies:**
  - Depends on: AI Auto-Caption/Transcription (feature 1) for word-level timing data
  - Enables: Improved output for Long-to-Short Clip Extraction (feature 7), cleaner input for AI Virality Scoring (feature 5)
- **Integration with ProAnimate:**
  - Operates on audio tracks managed by `useTimelineStore.ts` (tracks and clips)
  - Uses transcript data from the `CaptionProcessor` / `WordEvent[]` pipeline in `src/services/captions.ts`
  - Undo/redo integrates with the Zundo middleware already wired into the timeline store
  - Must re-sync `VisemeEvent[]` timelines in `useVoiceStore.ts` and `WordEvent[]` arrays when segments are removed
  - Re-calculates `useMultiCharacterStore.ts` dialogue timing for multi-character clips
  - Timeline clips in `useTimelineStore.ts` get split at removal points, creating new clip segments
  - Audio mixing in `src/services/videoExport.ts` must account for the modified timeline during export
- **Use cases:**
  - A podcaster records a 5-minute clip with natural speech and wants to create a tight 60-second highlight reel by removing all dead air and filler words automatically
  - A creator generates TTS dialogue but the Gemini script included unnecessary pauses; one click removes them and tightens the pacing
  - A marketing team member records a product demo with lots of "ums" and wants professional-sounding output without re-recording
- **Why it matters:** Silence and filler removal is the second most common editing task after captioning, and manual removal typically takes 3-5x the clip duration. Submagic reports that their silence remover is used on 70%+ of processed videos. This feature dramatically improves content pacing and perceived production quality, which directly correlates with viewer retention. For ProAnimate, this is especially valuable when combined with imported audio that feeds into the character lip-sync pipeline.
- **Who has it:** Submagic (3 intensity modes, 99% accuracy, one-click), Descript (text-based filler removal with Underlord AI), CapCut (auto-cut silence feature), Captions App (included in AI Edit pipeline), Cardboard (integrated with text-based editing)
- **Gold standard:** Descript's implementation is the benchmark because it combines silence/filler removal with text-based editing. Users see filler words highlighted in the transcript and can delete them like text, with the corresponding video segments removed instantly. Their "Remove Filler Words" one-click tool detects and removes verbal fillers across the entire project with consistent crossfading, and their AI (Underlord) can tighten cuts while maintaining natural speech rhythm.

---

### 5. AI Virality Scoring
- **Category:** AI Video Intelligence
- **What it is:** AI-powered predictive scoring system that analyzes a finished or in-progress clip and estimates its viral performance potential across social media platforms.
- **What it does:** Examines a clip's content, structure, and metadata across multiple dimensions to produce a composite virality score (0-100) and per-dimension sub-scores. The analysis considers: hook strength (first 3 seconds), emotional arc, pacing/rhythm, trending topic alignment (via Google Search grounding), visual engagement density, caption effectiveness, audio quality, and platform-specific best practices. It also generates actionable improvement suggestions ranked by expected impact. Optionally integrates real-time trend data to assess topic timeliness.
- **User flow:**
  1. User finishes creating a clip (or has a clip in-progress) and clicks "Score Virality" from the Pre-Publish panel or orchestrator completion phase
  2. System collects clip metadata: duration, dialogue count, character count, text overlays, CTA presence, hook presence, caption style, aspect ratio, music, templates, SVG objects, stock media
  3. System sends metadata + clip transcript + visual structure to Gemini with Google Search grounding for trend matching
  4. A scoring animation plays while analysis completes (3-8 seconds)
  5. Results appear in a dashboard: overall score (0-100) prominently displayed with a color-coded gauge
  6. Sub-scores shown in a radar chart: Hook Strength, Emotional Impact, Pacing, Trend Alignment, Visual Engagement, Audio Quality, CTA Effectiveness
  7. Below the chart: ranked list of 3-5 specific improvement suggestions with "Apply Fix" buttons where automated fixes are possible
  8. User can re-score after making changes to see updated results
  9. Score history is saved per project for tracking improvement over iterations
- **Properties/Parameters:**
  - `targetPlatform`: `'tiktok'` | `'youtube-shorts'` | `'instagram-reels'` | `'all'` (default: `'all'`)
  - `targetAudience`: Free-text description of intended audience (optional)
  - `enableTrendMatching`: Use Google Search grounding to check topic freshness (default: `true`)
  - `hookWindowSeconds`: Duration of the "hook" to analyze (1-5 seconds, default: `3`)
  - `weightOverrides`: Allow user to emphasize certain dimensions (object with 0-2 multipliers per dimension)
  - `includeCompetitorBenchmark`: Compare against platform average scores (default: `false`)
  - `scoringModel`: `'fast'` (cheaper, less detailed) | `'thorough'` (default: `'thorough'`)
  - Dimensions scored (each 0-100):
    - `hookStrength`: First 3s attention capture
    - `emotionalImpact`: Emotional arc and resonance
    - `storyQuality`: Narrative coherence and completeness
    - `pacing`: Edit rhythm and timing
    - `trendAlignment`: Match to current trending topics
    - `visualEngagement`: Visual variety and density
    - `audioQuality`: Voice clarity, music appropriateness
    - `ctaEffectiveness`: Call-to-action strength (if present)
    - `shareability`: How likely viewers are to share
- **Output:** A `ViralScore` object containing: `total` score (0-100), individual dimension scores, an array of `ImprovementSuggestion` objects (each with description, dimension, expected impact delta, and optional auto-fix action), trend match results, and a platform-specific breakdown if `targetPlatform` is set.
- **Acceptance criteria:**
  - Scoring completes in under 10 seconds for clips up to 180 seconds
  - The total score shows meaningful differentiation (not clustering around a narrow band)
  - Improvement suggestions are specific and actionable (not generic advice)
  - At least 1 of the 3-5 suggestions has an "Apply Fix" automation available
  - Trend alignment scoring correctly reflects current real-world trends (verified by Google Search grounding)
  - Re-scoring after applying a suggestion shows a measurable score change
  - Score is deterministic within a 5-point range for the same input (low variance between runs)
  - Scores correlate with actual performance metrics when tracked post-publish (validation through analytics feedback loop)
  - The scoring UI renders correctly in both the orchestrator completion phase and the standalone Pre-Publish panel
- **Edge cases:**
  - **No dialogue clips (music-only or visual-only):** Adjust scoring weights to de-emphasize audio/speech dimensions and increase visual engagement weight
  - **Very short clips (<10s):** Some dimensions like "story quality" may not apply; display N/A for inapplicable dimensions
  - **Non-English content:** Trend matching should use language-appropriate search queries; filler word detection in scoring should use the correct language
  - **Gemini API rate limits:** Queue scoring requests and show estimated wait time; cache recent scores to avoid redundant API calls
  - **Stale trend data:** Google Search results may not reflect the last 24 hours; note the trend data freshness timestamp
  - **Adversarial optimization:** Warn users if they are over-optimizing for score (e.g., adding clickbait hooks that hurt authenticity)
- **Dependencies:**
  - Depends on: Clip metadata from the orchestrator pipeline, Google Search grounding via Gemini API
  - Enables: Long-to-Short Clip Extraction (feature 7, uses virality scores to rank extracted clips), orchestrator quality gating
- **Integration with ProAnimate:**
  - Extends the existing `viralityScorer.ts` service which already collects `ClipMetadata` and calls Gemini with Google Search grounding
  - Connects to the existing `ViralScore` type in `src/types/orchestrator.ts`
  - Integrates with `PrePublishScore.tsx` panel for standalone scoring
  - Orchestrator completion phase in `CompletionPhase.tsx` displays the score
  - Learning system in `useLearningStore.ts` tracks score-to-performance correlation over time
  - Credit gating through the existing `withCreditGate` wrapper in `creditGate.ts`
  - Trend data feeds into the orchestrator's Google Search grounding configuration
- **Use cases:**
  - A creator finishes a clip about a trending tech topic and wants to validate that the hook is strong enough before publishing to TikTok
  - A brand marketing team produces 10 clip variants and uses virality scoring to rank them, publishing only the top 3
  - The AI orchestrator uses virality scoring as a quality gate, automatically flagging clips that score below 60 for human review before auto-publishing
- **Why it matters:** Virality scoring gives creators a data-driven pre-publish quality check that replaces intuition with measurement. OpusClip's virality score is their most-cited differentiator despite known accuracy limitations. For ProAnimate, integrating scoring into the orchestrator pipeline creates a closed-loop system where the AI Director can self-evaluate and iterate, which is a significant competitive advantage. The analytics feedback loop (actual performance vs. predicted score) enables continuous model improvement.
- **Who has it:** OpusClip (0-100 score with Hook/Flow/Value/Trend dimensions), Submagic (virality score on Magic Clips), StreamLadder (AI virality score), Clipgoat (virality scoring), GoViral (toolkit with scoring)
- **Gold standard:** OpusClip pioneered the 0-100 virality score with four sub-dimensions (Hook, Flow, Value, Trend) evaluated against what they describe as thousands of data points. Each clip gets a score plus specific improvement suggestions. While the scores are heuristic and users report inconsistent predictive accuracy, the UX pattern of a prominent score with actionable recommendations has become the industry standard for clip evaluation.

---

### 7. Long-to-Short Clip Extraction
- **Category:** AI Video Intelligence
- **What it is:** AI system that analyzes long-form video/audio content and automatically identifies and extracts the best standalone short-form segments.
- **What it does:** Ingests a long-form video (5 minutes to 2 hours), transcribes it, and uses multimodal analysis (transcript semantics, audio energy, visual scene changes, face detection, and sentiment) to identify the 3-20 most compelling self-contained segments. Each extracted clip is scored for viral potential, reframed for vertical format if needed, given a rewritten hook (attention-grabbing opening), and packaged with auto-generated captions. The system ensures each clip has narrative completeness (clean start and end) and avoids mid-sentence cuts.
- **User flow:**
  1. User uploads a long-form video file or pastes a YouTube/video URL
  2. System begins transcription and analysis (shows multi-phase progress: transcribing, analyzing, extracting, scoring)
  3. After processing (30 seconds to 5 minutes depending on length), a clip gallery appears showing extracted clips as cards
  4. Each card shows: thumbnail, title, duration, virality score (0-100), and a brief description of why this segment was selected
  5. Clips are sorted by virality score (highest first) by default; user can re-sort by chronological order or duration
  6. User clicks a clip card to preview it with auto-generated captions
  7. User can adjust clip boundaries by dragging start/end handles on a mini-timeline
  8. "Edit in Studio" button opens the clip in the full ProAnimate editor with captions, character placement, and all template options available
  9. "Batch Export" exports all selected clips at once
- **Properties/Parameters:**
  - `sourceUrl`: YouTube URL, direct video URL, or uploaded file reference
  - `maxSourceDurationMinutes`: Maximum accepted source length (default: `120` minutes)
  - `targetClipCount`: Number of clips to extract (3-20, default: `5`)
  - `targetClipDuration`: Preferred clip duration range (min/max seconds, default: `30-90`)
  - `targetAspectRatio`: `'9:16'` | `'16:9'` | `'1:1'` (default: `'9:16'`)
  - `reframeMode`: `'auto-crop'` | `'smart-zoom'` | `'letterbox'` (default: `'auto-crop'`)
  - `hookRewrite`: Generate an attention-grabbing rewrite of the first sentence (default: `true`)
  - `autoCaption`: Generate captions for extracted clips (default: `true`)
  - `captionStyle`: Caption preset to apply (default: project default)
  - `scoringEnabled`: Score each clip for virality (default: `true`)
  - `minViralityScore`: Only return clips above this threshold (0-100, default: `0`)
  - `contentFocus`: `'all'` | `'highlights'` | `'educational'` | `'emotional'` | `'funny'` (default: `'all'`)
  - `speakerFocus`: Optional speaker name to prioritize (for multi-speaker content)
  - `avoidOverlap`: Ensure extracted clips do not share significant overlapping content (default: `true`)
- **Output:** An array of `ExtractedClip` objects (matching the existing type in `src/services/clipExtractor.ts`) each containing: id, title, hookRewrite, startTime, endTime, duration, viralityScore, transcript segments, and reason for selection. Optionally includes auto-generated captions and reframed video data.
- **Acceptance criteria:**
  - Processes a 60-minute source video in under 3 minutes
  - Extracted clips have clean sentence-level boundaries (no mid-word or mid-sentence cuts)
  - At least 80% of extracted clips are self-contained (make sense without surrounding context)
  - Virality scores for extracted clips show meaningful variance (standard deviation > 15 across clips)
  - Hook rewrites are grammatically correct and more engaging than the original opening
  - Auto-reframing correctly tracks the primary speaker/subject for vertical format
  - Extracted clips maintain audio quality (no artifacts at clip boundaries)
  - YouTube URL extraction works for public videos up to 2 hours
  - The gallery UI renders up to 20 clip cards without performance issues
  - Each clip can be independently opened in the full editor with all ProAnimate features available
- **Edge cases:**
  - **Single continuous monologue with no natural breaks:** Use sentence-level pause points and topic shifts to find clip boundaries; reduce minimum clip duration to 15 seconds if needed
  - **Multi-speaker panel discussions:** Use speaker diarization to identify single-speaker highlight moments and tag clips with speaker names
  - **Screen recordings/presentations:** Visual scene change detection weights higher than audio energy for identifying segment boundaries
  - **Content with no clear highlights:** If all segments score similarly, return clips evenly distributed across the timeline duration and flag that the content may not have strong standalone moments
  - **Copyright-protected YouTube videos:** Gracefully handle extraction failures from DRM-protected or private videos with clear error messages
  - **Non-English long-form content:** Transcription must support the source language; clip extraction logic should work language-agnostically using sentence structure
- **Dependencies:**
  - Depends on: AI Auto-Caption/Transcription (feature 1) for transcript generation, AI Virality Scoring (feature 5) for clip ranking
  - Enables: Clips feed into the full ProAnimate editor for character animation, motion graphics, and other enhancements
- **Integration with ProAnimate:**
  - Extends the existing `clipExtractor.ts` service which already defines `ExtractedClip` with `WhisperSegment` dependencies
  - Extracted clips create new projects in `useProjectStore.ts` with pre-populated timeline data
  - Captions pipe through the existing `CaptionProcessor` and render via `CaptionOverlay.tsx`
  - Virality scoring uses the existing `viralityScorer.ts` service
  - The clip gallery UI can be added as a new tab in the Left Panel via `useEditorStore.ts` tab system
  - Batch export leverages the existing `videoExport.ts` WebCodecs/MediaRecorder pipeline
  - Orchestrator integration: extracted clips can be sent directly to the AI Director for character animation overlay
- **Use cases:**
  - A podcast host uploads a 45-minute episode and gets 8 vertical clips automatically extracted, captioned, and scored, ready for TikTok and Reels posting
  - A marketing team takes a 30-minute webinar recording and extracts the 5 best educational moments as standalone content pieces
  - A creator pastes a YouTube URL of their long interview and gets a batch of short clips with rewritten hooks, ready to add ProAnimate characters and motion graphics on top
- **Why it matters:** Long-to-short repurposing is the fastest-growing workflow in content creation, with the market projected to exceed $2B by 2027. OpusClip and Submagic have built their core businesses around this capability. For ProAnimate, this feature transforms the platform from a "create from scratch" tool into a "repurpose and enhance" tool, dramatically expanding the addressable market to include anyone with existing long-form content (podcasters, educators, webinar hosts, interview creators).
- **Who has it:** OpusClip (gold standard, multimodal analysis, 20+ clips per video), Submagic Magic Clips ($19/mo add-on, up to 2-hour videos), Vizard (end-to-end clipping + reframing), CapCut Smart Highlights (free, highlight detection), Reap (clipping + captions + dubbing pipeline), vidIQ (YouTube-focused clipping)
- **Gold standard:** OpusClip is the definitive leader, using multimodal AI that analyzes visual cues, audio sentiment, and transcript semantics simultaneously to identify viral-worthy moments. Their system extracts 20+ clips from a single long video, auto-adds captions, reframes for vertical, and assigns virality scores (0-100) based on Hook, Flow, Value, and Trend dimensions. The complete pipeline runs in minutes for hour-long content.

---

### 8. AI Smart Zoom
- **Category:** AI Video Intelligence
- **What it is:** Transcript-aware dynamic zoom system that automatically adds zooms and camera movements timed to speech emphasis, emotional peaks, and content cues.
- **What it does:** Analyzes the transcript and audio waveform to identify moments of emphasis (keyword stress, emotional peaks, punchlines, transitions) and automatically applies zoom effects synced to those moments. The zoom system uses multiple styles (fast punch-in, slow progressive zoom, ken-burns drift, reaction zoom) and intelligently targets the active speaker's face or the region of visual interest. It creates a dynamic, edited feel without manual keyframing by simulating the camera work of a professional editor.
- **User flow:**
  1. User has a video/animation on the canvas with associated audio/dialogue
  2. User clicks "Smart Zoom" from the Timeline Controls or Camera panel
  3. System analyzes the transcript and audio to identify zoom points (1-3 seconds)
  4. A preview overlay shows proposed zoom markers on the timeline as colored diamonds
  5. User selects a zoom style preset: "Podcast" (subtle, periodic), "Energetic" (frequent, fast), "Dramatic" (slow, progressive), "Custom"
  6. Intensity slider controls how many zoom events are applied (sparse to dense)
  7. User can preview the zoomed playback in real-time
  8. Individual zoom markers can be deleted, moved, or have their style changed
  9. "Apply" bakes the zoom keyframes into the camera keyframe track
- **Properties/Parameters:**
  - `zoomStyle`: `'podcast'` | `'energetic'` | `'dramatic'` | `'cinematic'` | `'custom'` (default: `'podcast'`)
  - `intensity`: Zoom frequency (1-10 scale, default: `5`)
  - `maxZoomLevel`: Maximum zoom magnification (1.1x-2.5x, default: `1.4x`)
  - `minZoomLevel`: Minimum zoom for subtle emphasis (1.0x-1.2x, default: `1.05x`)
  - `zoomDurationMs`: Duration of zoom-in transition (100ms-1000ms, default: `300ms`)
  - `holdDurationMs`: Duration at peak zoom (200ms-2000ms, default: `500ms`)
  - `zoomOutDurationMs`: Duration of zoom-out transition (200ms-1500ms, default: `500ms`)
  - `targetRegion`: `'face'` | `'center'` | `'auto'` (detect region of interest, default: `'auto'`)
  - `triggerTypes`: Which events trigger zooms: `['keyword', 'emphasis', 'emotion-peak', 'sentence-start', 'beat-sync']` (default: all)
  - `minIntervalMs`: Minimum time between zoom events to avoid visual fatigue (500ms-5000ms, default: `2000ms`)
  - `easing`: Easing function for zoom transitions (from ProAnimate's existing easing types)
  - `beatSync`: Boolean, sync zooms to music beats if music track present (default: `false`)
- **Output:** An array of camera keyframes added to the `cameraDirectives` array in the clip plan, rendered through the existing camera system in `useCameraStore.ts`, producing smooth zoom animations on the canvas.
- **Acceptance criteria:**
  - Zoom points align with speech emphasis within 200ms accuracy
  - No two zoom events overlap or occur within the minimum interval
  - Zoom transitions are smooth with no visual jitter or snapping
  - All 4 zoom style presets produce visually distinct results on the same clip
  - Face/speaker tracking correctly targets the active speaker in multi-character scenes
  - Zoom effects render correctly through the Remotion export pipeline
  - Processing (analysis + keyframe generation) completes in under 5 seconds for a 60-second clip
  - User can manually adjust any auto-generated zoom point without losing other zoom points
  - Beat-sync mode correctly aligns zooms to percussion transients when music is present
- **Edge cases:**
  - **No audio/transcript content:** Fall back to periodic zoom based on visual scene analysis (every 5-10 seconds)
  - **Very fast speech:** Cap zoom density based on `minIntervalMs` to prevent visual overload
  - **Multiple characters on screen:** Alternate zoom targets between speakers based on dialogue timing
  - **Full-screen text templates:** Disable face tracking and use center-weighted zoom for text-heavy content
  - **Very slow/contemplative content:** "Dramatic" style should use very gradual zoom-in over 5-10 second spans rather than quick punch-ins
  - **Pre-existing camera keyframes:** Warn user that Smart Zoom will add to (not replace) existing camera work; offer "replace" or "merge" options
- **Dependencies:**
  - Depends on: AI Auto-Caption/Transcription (feature 1) for word-level timing, audio waveform analysis
  - Integrates with: AI Silence/Filler Removal (feature 2, zoom should not target removed segments)
- **Integration with ProAnimate:**
  - Generates keyframes for the existing camera system in `useCameraStore.ts`
  - Zoom keyframes map to the `cameraDirectives` and `camera.keyframes` structures in `ClipPlan` (defined in `src/types/orchestrator.ts`)
  - Face/speaker detection uses the character position data from `useCharacterConfigStore.ts` and `useMultiCharacterStore.ts`
  - Beat-sync mode integrates with the existing `BeatSyncConfig` in `src/types/orchestrator.ts`
  - Easing functions use the existing interpolation library in `src/services/interpolation.ts`
  - Renders through the existing zoom/transform pipeline in `VideoCanvas.tsx` and `SelectionTransformBox.tsx`
  - Orchestrator integration: can be added as a post-processing step after `finalize-timeline`
- **Use cases:**
  - A talking-head creator wants their content to feel more dynamic without manually keyframing zooms on every sentence
  - A podcast clip with two characters needs automatic zoom emphasis that alternates between speakers based on who is talking
  - A high-energy product demo video needs fast punch-in zooms on keywords like "free," "limited time," and the product name
- **Why it matters:** Dynamic zooms are one of the most impactful yet time-consuming editing techniques. Submagic, Captions App, and CapCut all offer one-click zoom automation, and it significantly improves viewer retention by creating visual motion in otherwise static talking-head content. For ProAnimate, smart zoom adds a professional editing layer on top of the existing character animation system, making outputs look like they were edited by a professional video editor.
- **Who has it:** Submagic (progressive/fast zoom styles, transcript-synced), Captions App (AI Zoom tied to content analysis), CapCut (auto-zoom with keyword detection), Cardboard (beat-sync zoom via percussion detection)
- **Gold standard:** Submagic's implementation matches zoom timing precisely to the transcript, offering both progressive (slow cinematic) and fast (punch-in) zoom styles that can be applied to the original video or B-roll segments. Their AI analyzes the spoken content to determine optimal zoom points, with the system accessible via a single click. Cardboard extends this with beat-sync capability that aligns zooms to music percussion transients.

---

### 22. Text-Based Video Editing
- **Category:** AI Video Intelligence
- **What it is:** A paradigm where video is edited by modifying a synchronized text transcript rather than manipulating a traditional timeline.
- **What it does:** Generates a word-level timestamped transcript of the entire project's audio and presents it as an editable document. Every word in the transcript is bidirectionally linked to its corresponding video segment. Deleting words removes the video. Rearranging sentences reorders video segments. Selecting text highlights the corresponding timeline region. The system supports find-and-replace across the transcript, filler word highlighting with one-click removal, speaker labels with color coding, and direct text editing that regenerates TTS audio for the modified words (using the project's ElevenLabs voice).
- **User flow:**
  1. User clicks "Script View" or "Text Edit" tab to switch from timeline view to transcript view
  2. The full project transcript appears as an editable document with word-level coloring indicating speaker identity
  3. A synchronized playhead highlights the current word during playback
  4. User selects a sentence and presses Delete; the corresponding video segment, character animation, and audio are removed from the timeline
  5. User finds all instances of "um" or "uh" highlighted in orange; clicks "Remove All Fillers" to delete them and their video segments
  6. User types a new sentence where they want to add content; the system generates TTS audio with the project's configured voice and inserts a new video segment
  7. User drags a paragraph to reorder it; the timeline segments rearrange accordingly
  8. User clicks any word to jump the playback head to that exact frame
  9. All changes are tracked in the undo history as grouped operations
- **Properties/Parameters:**
  - `viewMode`: `'transcript'` | `'split'` (transcript + timeline side-by-side) | `'timeline'` (default: `'split'`)
  - `showSpeakerLabels`: Display speaker name and color next to each dialogue segment (default: `true`)
  - `highlightFillers`: Auto-detect and highlight filler words (default: `true`)
  - `highlightColor`: Color for filler word highlighting (default: `'#FF9800'`)
  - `syncPlayhead`: Highlight current word during playback (default: `true`)
  - `regenerateOnEdit`: When text is modified, auto-generate new TTS audio (default: `true`)
  - `ttsVoiceId`: ElevenLabs voice ID for regenerated segments (default: project voice)
  - `ttsModelId`: ElevenLabs model for regeneration (default: `'eleven_v3'`)
  - `showTimestamps`: Display timestamps in the margin (default: `true`)
  - `paragraphBreakThreshold`: Silence duration that creates a paragraph break (default: `1.5s`)
  - `enableReorder`: Allow drag-to-reorder paragraphs (default: `true`)
  - `findAndReplace`: Global find-and-replace in transcript with optional audio regeneration
- **Output:** A bidirectionally synced transcript-timeline representation where edits to the text immediately mutate the timeline store (`useTimelineStore.ts`), regenerate audio via ElevenLabs when text content changes, and update all dependent layers (captions, viseme timeline, emotion timeline, character positions).
- **Acceptance criteria:**
  - Every word in the transcript is clickable and jumps to the correct frame (within 1 frame accuracy)
  - Deleting a sentence removes exactly the corresponding audio segment and all synced layers (character animation, captions, motion graphics timed to that segment)
  - Adding new text successfully generates TTS audio and inserts it at the correct position within 5 seconds
  - Reordering paragraphs correctly resequences all timeline tracks (audio, character, captions, media)
  - Filler word detection correctly identifies 90%+ of standard English fillers
  - The transcript view updates in real-time during playback with word-level highlighting
  - All text-based edits are fully undoable via Ctrl+Z with proper undo grouping
  - Split view shows transcript and timeline simultaneously with synchronized scrolling
  - Find-and-replace works across the full transcript and optionally regenerates modified audio
  - Performance: transcript view loads in under 2 seconds for a 3-minute clip
- **Edge cases:**
  - **Multiple simultaneous speakers:** Show overlapping dialogue as indented blocks with speaker labels; deletion of one speaker's segment should not affect the other's
  - **Non-speech segments (music, SFX):** Display as non-editable blocks labeled "[Music]" or "[Sound Effect]" in the transcript with duration noted
  - **Emoji and special characters in TTS text:** ElevenLabs may not handle certain unicode; sanitize input before TTS generation
  - **Very long projects (>10 minutes):** Paginate the transcript view with virtual scrolling to maintain performance
  - **Regenerated audio duration mismatch:** When new TTS audio is shorter or longer than the original, dynamically adjust downstream timeline segments and flag potential overlap issues
  - **Multi-language projects:** Support transcript display in the original language with optional translation overlay
- **Dependencies:**
  - Depends on: AI Auto-Caption/Transcription (feature 1) for initial transcript, ElevenLabs TTS integration for audio regeneration
  - Enables: AI Silence/Filler Removal (feature 2) can be triggered from the text interface, AI Smart Zoom (feature 8) zoom points visible as markers in transcript
- **Integration with ProAnimate:**
  - The transcript is built from `WordEvent[]` and `GeneratedVoice` data already stored in `useVoiceStore.ts`
  - Multi-character dialogue maps to the existing `useMultiCharacterStore.ts` dialogue system
  - Text edits that modify dialogue content trigger `ElevenLabsService.generateWithAlignment()` from `src/services/elevenlabs.ts`
  - Timeline mutations go through `useTimelineStore.ts` with Zundo undo middleware
  - Viseme re-sync uses `LipSyncProcessor` from `src/services/lipSync.ts`
  - Caption updates flow through `CaptionProcessor` from `src/services/captions.ts`
  - The view can be implemented as a new panel tab in `LeftPanel` or as an alternative to the timeline, managed by `useEditorStore.ts`
  - Remotion `VideoComposition.tsx` rendering is unaffected since it reads from the same stores
- **Use cases:**
  - A creator reviews a generated clip and notices a word sounds wrong in the TTS; they simply retype the word in the transcript and the audio regenerates automatically
  - A podcaster removes all filler words from an imported recording by highlighting them in the transcript and pressing delete, without touching the timeline
  - A marketing manager reorders talking points in a product video by dragging paragraphs in the script view, and all visuals automatically resequence
- **Why it matters:** Text-based editing is widely regarded as the most important UX innovation in video editing since the non-linear timeline. Descript built a billion-dollar company primarily on this paradigm. For ProAnimate, which already has word-level timing data from ElevenLabs alignment and an AI script generation pipeline, text-based editing is a natural extension that makes the platform dramatically more accessible to non-video-editors. It reduces the learning curve from hours to minutes and makes editing feel like working in a word processor.
- **Who has it:** Descript (pioneer and market leader, complete text-based editing with Overdub regeneration), Captions App (text-based trimming), Submagic (edit transcript to trim video), Cardboard (natural language editing with Director agent), VEED (transcript editing)
- **Gold standard:** Descript is the undisputed gold standard. Their implementation provides a complete word-processor experience for video: every word is linked to its video frame, deletion removes video, the Overdub feature lets users type new words and generate matching audio in the speaker's cloned voice, and the Underlord AI agent can suggest and make edits through natural language instructions. The system reduces editing time by an estimated 60-70% for spoken-word content and has become the default workflow for podcasters and interview editors.

---

## Category 2: AI Content Generation

### 9. AI B-Roll Auto-Insertion
- **Category:** AI Content Generation
- **What it is:** Contextual intelligence system that analyzes a clip's dialogue transcript and automatically inserts relevant supplemental footage (B-roll) at appropriate moments.
- **What it does:** Scans the transcript for nouns, topics, actions, and concepts, then searches stock media libraries (Pixabay, and optionally premium libraries) for matching video clips and images. It identifies the optimal insertion points (topic transitions, visual "dead spots" where only a talking head is shown, and moments where visual illustration would enhance comprehension) and places the B-roll as overlay or cutaway layers on the timeline with appropriate transitions (fade, slide, zoom). The system ensures B-roll diversity (no repeated footage), proper timing (2-5 seconds per insert), and contextual relevance.
- **User flow:**
  1. User creates a clip with dialogue (via orchestrator, manual creation, or import)
  2. User clicks "Auto B-Roll" from the Media panel or Timeline Controls
  3. System analyzes the transcript and identifies 3-10 insertion points based on clip length
  4. For each insertion point, the system searches Pixabay (and any configured premium sources) for relevant footage
  5. A preview panel shows proposed B-roll placements with thumbnails, insertion timestamps, and relevance scores
  6. User can: approve all, approve individually, swap a B-roll clip with alternatives (shown as a carousel), remove a placement, or adjust timing
  7. "B-Roll Style" selector offers: "Subtle" (few inserts, fades), "Dynamic" (many inserts, zooms), "Documentary" (full coverage), "Product Demo" (product-focused imagery)
  8. User clicks "Apply" and B-roll clips are placed as media layers on the timeline
  9. Each B-roll layer includes entry/exit transitions and is keyframe-animatable
- **Properties/Parameters:**
  - `insertionDensity`: How many B-roll clips per 30 seconds of content (1-5, default: `2`)
  - `clipDurationRange`: Duration range for each B-roll clip (min/max seconds, default: `2-5`)
  - `transitionType`: `'fade'` | `'slide'` | `'zoom'` | `'ken-burns'` | `'cut'` (default: `'fade'`)
  - `transitionDuration`: Transition duration in frames (5-30, default: `15`)
  - `mediaSource`: `'pixabay'` | `'uploaded'` | `'both'` (default: `'pixabay'`)
  - `mediaType`: `'video'` | `'image'` | `'both'` (default: `'both'`)
  - `overlayOpacity`: B-roll overlay opacity when shown over character (0-1, default: `1.0` for full cutaway)
  - `overlayMode`: `'cutaway'` (replaces main visual) | `'overlay'` (semi-transparent over character) | `'split'` (side-by-side) (default: `'cutaway'`)
  - `brollStyle`: `'subtle'` | `'dynamic'` | `'documentary'` | `'product'` (default: `'dynamic'`)
  - `avoidDuplicates`: Ensure no stock clip is used twice (default: `true`)
  - `preferVideo`: Prefer video clips over static images (default: `true`)
  - `keywordOverrides`: Manual keywords to prioritize for specific transcript segments
  - `brandSafe`: Filter out potentially inappropriate content (default: `true`)
- **Output:** An array of `MediaAsset` objects placed on the timeline through `useMediaStore.ts`, each with position, duration, transition settings, and Pixabay attribution data. B-roll layers render through the existing `MediaLayer.tsx` canvas component and `RemotionMediaLayer.tsx` export layer.
- **Acceptance criteria:**
  - B-roll relevance: at least 80% of auto-selected clips are contextually appropriate for the transcript segment
  - No duplicate footage across a single clip's B-roll placements
  - Transitions between B-roll and primary content are smooth (no flash frames)
  - B-roll timing does not overlap with critical visual moments (character expressions, text overlays)
  - Processing completes in under 15 seconds for a 60-second clip
  - User can swap any B-roll clip and see 5+ alternatives immediately
  - All B-roll includes proper Pixabay attribution in export metadata
  - B-roll renders correctly through the Remotion pipeline at all supported aspect ratios
  - The system respects brand-safe filtering by default
- **Edge cases:**
  - **Abstract/conceptual topics:** When the transcript discusses abstract ideas (love, freedom, success), use metaphorical imagery rather than literal matches
  - **No relevant stock footage found:** Show a "No match found" indicator for that insertion point and suggest user-uploaded alternatives
  - **Very short clips (<15s):** Limit to 1-2 B-roll inserts maximum to avoid overwhelming the viewer
  - **B-roll over character dialogue:** When in "cutaway" mode during active lip-sync, maintain audio but switch visual; ensure character animation pauses cleanly
  - **Multiple characters:** B-roll should not insert during character-to-character visual interactions (both on screen)
  - **Rate limiting:** Pixabay API has rate limits; cache search results and implement request queuing
- **Dependencies:**
  - Depends on: AI Auto-Caption/Transcription (feature 1) for transcript analysis, Pixabay integration (existing)
  - Integrates with: AI Smart Zoom (feature 8, zoom can be applied to B-roll), Timeline system
- **Integration with ProAnimate:**
  - Leverages the existing Pixabay integration in `src/services/pixabay.ts` and `usePixabayStore.ts`
  - Places media through `useMediaStore.ts` with `StockMediaRole` types already defined in `src/types/orchestrator.ts` (background, cutaway, overlay, accent)
  - Renders through existing `MediaLayer.tsx` with transition support (fade, zoom, slide, ken-burns)
  - B-roll assets stored via `mediaDB.ts` (IndexedDB)
  - The orchestrator already has a `setup-stock-media` step that searches and places Pixabay content; this feature makes it interactive and transcript-aware
  - Remotion export uses `RemotionMediaLayer.tsx` which already supports all required transition types
  - Timeline tracks in `useTimelineStore.ts` handle B-roll as standard media track clips
- **Use cases:**
  - A creator generates a talking-head explainer video about "coffee brewing methods" and auto-B-roll inserts footage of pour-overs, espresso machines, and coffee beans at relevant transcript moments
  - A marketer creates a product comparison video and the system automatically inserts product imagery when each product name is mentioned in the script
  - An educator produces a history lesson and B-roll inserts relevant archival imagery and maps at appropriate points in the narration
- **Why it matters:** B-roll is what separates amateur-looking videos from professional content, but sourcing and timing it manually takes 50%+ of total editing time. Submagic reports their Magic B-Rolls feature is used on the majority of processed videos. For ProAnimate, auto-B-roll is especially powerful because it enhances the AI orchestrator output -- currently, orchestrator-generated clips often feel static when only a talking character is on screen. B-roll adds visual variety that significantly improves retention.
- **Who has it:** Submagic (Magic B-Rolls with Storyblocks integration, one-click), Captions App (AI Edit auto-inserts B-roll with SFX), Cardboard (semantic footage search + B-roll placement), Descript (community-requested, in development)
- **Gold standard:** Submagic's Magic B-Rolls feature provides one-click contextual B-roll insertion powered by Storyblocks premium footage. The AI reads the transcript, identifies the best insertion moments, selects contextually relevant footage, and places it with appropriate transitions. Users can customize by searching keywords and choosing from royalty-free images, movie clips, GIFs, or uploaded assets. The entire process takes under 30 seconds.

---

### 19. AI Eye Contact Correction
- **Category:** AI Content Generation
- **What it is:** AI-powered gaze redirection system that adjusts a speaker's eye direction in video to appear as if they are looking directly at the camera.
- **What it does:** Detects the speaker's face and eyes in each video frame, calculates the current gaze vector, and synthesizes new eye region pixels that redirect the gaze toward the camera lens position. The system handles natural micro-movements to avoid an uncanny "staring" effect, supports periodic "look-away" moments for realism, handles partial occlusions (glasses, hair), and maintains consistent eye color and lighting. It operates either in real-time (for preview) or as a batch process (for export).
- **User flow:**
  1. User imports a video with a talking-head speaker (recorded from webcam, phone, etc.)
  2. User clicks "Fix Eye Contact" from the Video Properties panel or a right-click context menu on the video layer
  3. System scans the video and identifies face regions (1-3 second analysis)
  4. A before/after split preview appears showing the original vs. corrected gaze
  5. Intensity slider (0-100%) controls how aggressively the gaze is redirected
  6. "Natural movement" toggle preserves micro-eye-movements and occasional look-aways
  7. User clicks "Apply" to process the full video (shown as a progress bar)
  8. The corrected video replaces the original on the timeline (original preserved as undo state)
- **Properties/Parameters:**
  - `intensity`: Gaze correction strength (0-100%, default: `80%`)
  - `naturalMovement`: Preserve micro-eye-movements (default: `true`)
  - `lookAwayFrequency`: How often to allow natural look-aways (0-10, 0 = never, default: `3`)
  - `lookAwayDurationMs`: Duration of natural look-away moments (100ms-500ms, default: `200ms`)
  - `processMode`: `'realtime'` (preview only) | `'batch'` (full quality, default: `'batch'`)
  - `faceIndex`: Which face to correct in multi-face scenes (default: `0` for primary face)
  - `glassesMode`: Enhanced processing for glasses wearers (default: `'auto-detect'`)
  - `targetPoint`: Where eyes should look (`'camera-center'` | `'custom-xy'`, default: `'camera-center'`)
  - `preserveBlinking`: Maintain natural blink patterns (default: `true`)
  - `outputResolution`: Match input resolution or specify (default: `'match-input'`)
- **Output:** A processed video file/blob with corrected eye contact, maintaining original resolution and frame rate, stored as a new asset in `mediaDB.ts` with a reference to the original for undo.
- **Acceptance criteria:**
  - Eye redirection appears natural to human viewers in 90%+ of test cases (no uncanny valley)
  - Works with glasses, contact lenses, and varying lighting conditions
  - Natural micro-movements are preserved when `naturalMovement` is enabled
  - Processing speed: at least 10 FPS for 1080p content (6 seconds to process 1 second of video)
  - Maintains consistent eye color, iris detail, and reflection highlights
  - No visible artifacts at the boundary between corrected eye region and surrounding face
  - Works with faces at various angles (up to 30 degrees off-center)
  - Before/after preview is clearly distinguishable
  - The corrected video integrates seamlessly with the timeline and exports correctly
- **Edge cases:**
  - **Extreme head angles (>45 degrees):** Display a warning that correction quality may be reduced; apply partial correction or skip those frames
  - **Closed eyes / blinking:** Skip correction during blinks; maintain natural blink timing
  - **Multiple faces in frame:** Allow user to select which face(s) to correct; default to the largest/most prominent face
  - **Sunglasses / opaque glasses:** Cannot correct through opaque lenses; detect and skip these frames with a notification
  - **Animated characters (not real video):** This feature is not applicable to ProAnimate's sprite/3D characters; gate the feature to only appear on imported real video layers
  - **Low resolution video:** Quality degrades below 480p; warn user of reduced accuracy
- **Dependencies:**
  - Depends on: Video import/media layer system, face detection capability (new or cloud-based)
  - Integrates with: Timeline system, video export pipeline
- **Integration with ProAnimate:**
  - Applies to video layers managed by `useMediaStore.ts` and rendered via `MediaLayer.tsx`
  - Processing can use a server-side endpoint in the Express backend (new route, e.g., `server/routes/eyeContact.ts`) that wraps an ML model API or uses NVIDIA Maxine NIM
  - Processed video stored via `mediaDB.ts` (IndexedDB) alongside original for undo
  - The feature should only be available when the selected layer is a real video (not character animations, SVGs, or templates)
  - Export through `RemotionMediaLayer.tsx` uses the corrected video asset
  - Credits consumed via the existing `withCreditGate` system
- **Use cases:**
  - A creator records themselves reading a script off a teleprompter to the side of the camera and uses eye contact correction to make it look like they are speaking directly to the viewer
  - A remote interview video where the guest is looking at their screen (not camera) is corrected so both participants appear to have direct eye contact
  - A marketing team processes batch recordings from sales reps who were reading notes, making the videos look more professional and engaging
- **Why it matters:** Eye contact is one of the strongest drivers of viewer trust and engagement in video content. Research shows that direct eye contact increases perceived credibility by up to 50%. Most creators struggle with this because they read scripts, look at their screen, or use multi-monitor setups. NVIDIA has invested heavily in this technology (Maxine Eye Contact), and it has become a standard feature in Captions App, Descript, VEED, and Submagic. For ProAnimate, this feature is specifically valuable for imported talking-head footage that users want to overlay with ProAnimate characters and graphics.
- **Who has it:** Captions App (AI Eye Contact, one-click), NVIDIA Broadcast/Maxine (real-time, GPU-accelerated, adjustable look-away), Descript (eye contact fix tool), VEED (AI eye contact), Submagic (AI eye contact feature), CapCut (AI eye contact tool), BIGVU (AI eye contact correction)
- **Gold standard:** NVIDIA Maxine Eye Contact is the technical gold standard, operating on a localized eye-patch region with 6DOF head pose tracking, maintaining natural micro-eye-movements, offering an adjustable "look away" feature for realism, and supporting occlusion handling. The Captions App provides the best consumer UX: a single toggle in the editing interface that applies eye contact correction with no configuration needed, seamlessly integrated into their broader AI Edit pipeline.

---

### 20. AI Voice Cloning
- **Category:** AI Content Generation
- **What it is:** System for creating a synthetic voice replica from audio samples that can then be used for text-to-speech generation, maintaining the original speaker's vocal characteristics.
- **What it does:** Accepts audio recordings of a target voice (as few as 1 minute for instant cloning, 30+ minutes for professional quality), processes them through a voice modeling pipeline, and creates a reusable voice profile. The cloned voice can then be used anywhere ProAnimate uses TTS: dialogue generation, narration, voiceovers, and text-based editing audio regeneration. The cloned voice supports multilingual synthesis (speaking the cloned voice in different languages), adjustable emotional expression, and fine-tuning controls for stability, similarity, and style.
- **User flow:**
  1. User navigates to the Voices panel and clicks "Clone a Voice"
  2. User chooses cloning mode: "Instant" (1-5 min audio, ready in seconds) or "Professional" (30+ min audio, ready in 24-48 hours)
  3. For Instant: user uploads 1-5 audio files or records directly in-browser
  4. System validates audio quality (checks for background noise, multiple speakers, sufficient duration)
  5. A consent/authorization step requires user to confirm they have rights to clone this voice
  6. System processes the audio and creates a voice profile (Instant: 5-15 seconds, Professional: 24-48 hours)
  7. The cloned voice appears in the Voices panel alongside ElevenLabs stock voices
  8. User can test the voice with sample text before using it in a project
  9. The voice is available for all dialogue generation, voiceover, and TTS functions throughout ProAnimate
- **Properties/Parameters:**
  - `cloningMode`: `'instant'` | `'professional'` (default: `'instant'`)
  - `audioSamples`: Array of audio file references (min: 1 file for instant, min: 3 files for professional)
  - `minDurationSeconds`: Minimum total audio duration (Instant: `60s`, Professional: `1800s`)
  - `maxDurationSeconds`: Maximum total audio duration (Instant: `300s`, Professional: `10800s`)
  - `voiceName`: User-defined name for the cloned voice
  - `voiceDescription`: Optional description/tags
  - `language`: Primary language of the sample audio (for optimization)
  - `consentConfirmed`: Boolean, must be `true` to proceed
  - `stability`: Voice consistency (0-1, default: `0.5`)
  - `similarityBoost`: How closely output matches the original (0-1, default: `0.75`)
  - `style`: Style exaggeration (0-1, default: `0`)
  - `useSpeakerBoost`: Enhance speaker characteristics (default: `true`)
  - Voice usage settings:
    - `allowedLanguages`: Languages the clone can speak (default: all ElevenLabs supported)
    - `emotionSupport`: Whether emotion cues (anger, joy, etc.) work with this clone (auto-detected)
- **Output:** An `ElevenLabsVoice`-compatible voice profile stored in the user's account, available in the voice picker across all ProAnimate features (dialogue, narration, voiceover), with the voice ID usable in all existing ElevenLabs API calls.
- **Acceptance criteria:**
  - Instant voice clone is created and usable within 30 seconds of upload
  - Cloned voice is recognizably similar to the original (subjective test: 8/10 listeners identify the speaker correctly)
  - Professional clone achieves near-indistinguishable quality from the original
  - Cloned voice works with all existing ElevenLabs emotion cues defined in `elevenlabs.ts`
  - Multilingual synthesis produces the cloned voice in at least 32 languages
  - Audio quality validation catches and rejects poor-quality samples with specific feedback
  - Consent flow is legally compliant and cannot be bypassed
  - Cloned voice appears seamlessly in the existing Voices panel alongside stock voices
  - All existing TTS features (alignment, phoneme data, viseme mapping) work with cloned voices
  - Voice profile persists across sessions and projects
- **Edge cases:**
  - **Background noise in samples:** Display a noise level warning and suggest re-recording; for instant cloning, attempt to denoise before processing
  - **Multiple speakers in sample audio:** Reject the sample with an explanation; suggest isolating the target speaker
  - **Very short samples (<30s):** Allow for instant cloning with a quality warning; reject for professional cloning
  - **Non-consented voice cloning:** Implement a strict consent flow with legal language; consider voice-print verification for high-risk use cases
  - **Celebrity/public figure voices:** Display additional legal warnings about rights and liability
  - **Voice clone used with emotions it was not trained on:** Gracefully degrade to the closest supported emotion rather than producing artifacts
  - **Sample language different from generation language:** Cross-lingual cloning quality varies; display expected quality rating per target language
- **Dependencies:**
  - Depends on: ElevenLabs API (existing integration), audio recording capability
  - Enables: Text-Based Video Editing (feature 22, voice regeneration in cloned voice), AI Person Clone (feature 37, voice component)
- **Integration with ProAnimate:**
  - Integrates directly with the existing `ElevenLabsService` class in `src/services/elevenlabs.ts` which already manages API keys and voice generation
  - Cloned voices are stored as `ElevenLabsVoice` objects and appear in `useVoiceStore.ts` voice list
  - All existing emotion-to-annotation mapping in `EMOTION_V3_MAP` works with cloned voices
  - `VoiceSettings` interface in `src/types/voice.ts` already includes `stability`, `similarityBoost`, and `useSpeakerBoost` fields
  - The orchestrator's voice selection in `setup-characters` step can use cloned voices
  - Lip sync pipeline (`LipSyncProcessor` in `src/services/lipSync.ts`) works unchanged since ElevenLabs alignment data format is the same
  - Credit gating through `withCreditGate` with appropriate cost calculation for cloning operations
- **Use cases:**
  - A YouTube creator clones their own voice so the AI orchestrator can generate complete videos with their authentic voice without requiring them to record each time
  - A brand creates a consistent brand voice from their spokesperson, enabling the marketing team to generate product videos at scale without scheduling recording sessions
  - A multilingual creator clones their English-speaking voice and uses it to generate dialogue in Spanish and French for international content versions
- **Why it matters:** Voice cloning removes the largest remaining bottleneck in fully automated video creation: the voice. With a cloned voice, the entire ProAnimate pipeline (script generation, TTS, lip sync, animation, export) becomes truly autonomous. ElevenLabs has made voice cloning accessible and high-quality, and competitors like HeyGen, Descript (Overdub), and Cardboard have integrated it as a core feature. For ProAnimate, this transforms the platform from "generate videos with stock voices" to "generate videos that sound like you."
- **Who has it:** ElevenLabs (Instant + Professional cloning, industry-leading quality), Descript Overdub (voice cloning for text-based editing), HeyGen (voice cloning for avatars, 175+ languages), Cardboard (voice cloning integrated with editing), Captions App (voice cloning for dubbing), Argil (voice cloning via ElevenLabs for AI person clones)
- **Gold standard:** ElevenLabs sets the definitive standard with two tiers: Instant Voice Cloning (1-minute sample, ready in seconds, good quality) and Professional Voice Cloning (30+ minutes of audio, 3-4 week training, near-indistinguishable quality). Their clones support 32+ languages, adjustable emotion/style parameters, and integrate seamlessly into their TTS API. The system includes consent verification, audio quality validation, and produces clones that capture subtle vocal characteristics including emotional range and speaking patterns.

---

### 24. AI Image-to-Video
- **Category:** AI Content Generation
- **What it is:** AI system that transforms static images (photographs, illustrations, AI-generated art, or ProAnimate character sprites) into short animated video clips.
- **What it does:** Takes a static image as input along with an optional text prompt describing the desired motion, and generates a 2-10 second video clip where the subjects in the image move naturally. This includes: camera movements (pan, zoom, orbit), environmental animation (clouds moving, water flowing, leaves rustling), subject animation (character walking, gesturing, turning), and style-specific motion (parallax for illustrations, ken-burns for photos). The generated video can be used as a background layer, B-roll footage, character animation source, or standalone content.
- **User flow:**
  1. User uploads an image or selects an existing image asset from the project
  2. User clicks "Animate Image" from the right-click context menu or Image Properties panel
  3. An animation configuration modal appears with the source image preview
  4. User optionally writes a motion prompt (e.g., "Camera slowly zooms in while wind blows the character's hair")
  5. User selects duration (2-10 seconds), output aspect ratio, and motion intensity
  6. User chooses generation mode: "Quick" (faster, lower quality) or "Quality" (slower, higher quality)
  7. System generates the video (15-60 seconds depending on mode and duration)
  8. Preview plays the generated video; user can "Regenerate" with tweaked parameters or "Accept"
  9. Accepted video is placed on the timeline as a video layer
- **Properties/Parameters:**
  - `sourceImage`: Image file reference or URL
  - `motionPrompt`: Text description of desired motion (optional, default: `''` for auto-detected motion)
  - `duration`: Output duration in seconds (2-10, default: `4`)
  - `aspectRatio`: `'16:9'` | `'9:16'` | `'1:1'` | `'match-source'` (default: `'match-source'`)
  - `resolution`: Output resolution (`'720p'` | `'1080p'`, default: `'1080p'`)
  - `motionIntensity`: How much motion to apply (1-10, default: `5`)
  - `generationMode`: `'quick'` (5-15 seconds, lower quality) | `'quality'` (30-60 seconds, higher quality, default: `'quality'`)
  - `cameraMotion`: `'none'` | `'zoom-in'` | `'zoom-out'` | `'pan-left'` | `'pan-right'` | `'orbit'` | `'auto'` (default: `'auto'`)
  - `motionModel`: `'general'` | `'character'` | `'landscape'` | `'product'` (default: `'general'`)
  - `preserveStyle`: Maintain the artistic style of the input (illustration stays illustrated) (default: `true`)
  - `loopable`: Generate seamless loop (default: `false`)
  - `seedValue`: Reproducibility seed (optional)
- **Output:** A video file (MP4/WebM) stored via `mediaDB.ts`, placed as a `VideoLayer` on the timeline, rendered through `VideoLayer.tsx` and `RemotionVideoLayer.tsx`.
- **Acceptance criteria:**
  - Generated video maintains the visual identity and style of the source image (no style drift)
  - Motion appears natural and physically plausible (no warping artifacts, limb distortion, or object melting)
  - Camera movements are smooth with no jitter
  - Character animation mode produces believable body motion for illustration/character inputs
  - Generation time is under 15 seconds for "quick" mode and under 60 seconds for "quality" mode
  - Output resolution matches the specified parameter
  - The generated video integrates seamlessly with the ProAnimate timeline and layers system
  - Loopable mode produces a seamless loop with no visible seam frame
  - At least 3 attempts at generation with the same prompt produce acceptably different results
- **Edge cases:**
  - **Text-heavy images:** Text in the image may distort during animation; warn the user or apply lower motion intensity to text regions
  - **Transparent PNG input:** Preserve alpha channel in the output video; fall back to white background if the model does not support transparency
  - **Very small images (<256px):** Upscale before processing and warn about potential quality loss
  - **Complex multi-subject scenes:** Motion may not properly separate foreground/background; offer a "subject mask" option for selective animation
  - **ProAnimate character sprites:** These are designed for the bone/viseme system, not video animation; route these to the existing rigging pipeline instead
  - **NSFW content detection:** Reject images flagged as inappropriate by content moderation
- **Dependencies:**
  - Depends on: Image-to-video AI model API (e.g., Runway Gen-4, Kling, or Stable Video Diffusion via server proxy)
  - Integrates with: Media layer system, video export pipeline, AI B-Roll Auto-Insertion (feature 9, generated clips as B-roll)
- **Integration with ProAnimate:**
  - Generated videos are stored in `mediaDB.ts` and managed via `useMediaStore.ts`
  - Timeline placement through `useTimelineStore.ts` as video layer clips
  - Canvas rendering via `VideoLayer.tsx` (existing component)
  - Remotion export via `RemotionVideoLayer.tsx` (existing component)
  - The existing `aiAnimation.ts` service already handles AI video generation requests to the backend; this feature extends it with image-conditioned generation
  - Backend route `server/routes/aiAnimation.ts` proxies to the image-to-video model API
  - Credit consumption tracked via `withCreditGate` with model-specific cost calculation
  - The orchestrator can use this in the `setup-background` step to animate SVG-generated or stock image backgrounds
- **Use cases:**
  - A creator uploads a product photo and generates a 5-second video of the product rotating with a subtle zoom for use as an opening shot
  - An illustrator creates a character concept drawing and animates it to show the character gesturing and blinking, used as a promotional teaser
  - The AI orchestrator selects a Pixabay stock image for a B-roll moment and animates it with ken-burns motion to make it more engaging than a static image
- **Why it matters:** Image-to-video is one of the most rapidly advancing AI capabilities, with Runway Gen-4.5, Kling, and Google Veo 3 leading the field. It transforms any static visual asset into dynamic content, dramatically expanding the visual palette available to creators. For ProAnimate, this is especially powerful because it turns the existing Pixabay stock image library and AI-generated SVG backgrounds into animated content, multiplying the value of every visual asset in the system.
- **Who has it:** Runway Gen-4.5 (benchmark quality, image-to-video with prompt control), Kling AI (1080p, strong lip-sync, up to 2 minutes), Pika (social-first, creative effects), Google Veo 3 (4K, native audio), Stable Video Diffusion (open-source), Hedra (character-focused, portrait animation)
- **Gold standard:** Runway Gen-4.5 is the current leader for image-to-video generation. It can transform any static image (real, generated, sketched, or illustrated) into a dynamic video with strong prompt adherence, consistent visual identity, and natural physics simulation. The system supports camera motion control, environmental animation, and character movement, with output at 1080p resolution in clips up to 10 seconds. Generation takes approximately 30 seconds for 10 seconds of video.

---

### 33. Singing Character Videos
- **Category:** AI Content Generation
- **What it is:** Character animation mode that lip-syncs animated characters (2D sprites, 3D models, or AI-generated avatars) to music audio, including singing, rapping, and humming.
- **What it does:** Extends the existing lip-sync pipeline to handle musical audio (singing, rapping) rather than just speech. The system analyzes a music track's vocal component, extracts phoneme timing from the singing voice, maps phonemes to visemes with adjustments for sustained notes (held vowels, vibrato), and animates the character's mouth, head, and body to match the musical performance. It supports beat-synced body motion (bouncing, swaying), emotion mapping based on musical key/tempo, and coordination between vocal and instrumental sections (mouth closed during instrumental breaks).
- **User flow:**
  1. User uploads a music track (MP3/WAV) or generates one via ElevenLabs
  2. User selects "Singing Mode" when assigning the audio to a character
  3. System detects vocal/instrumental sections and isolates the vocal track (if mixed)
  4. Phoneme extraction processes the vocal track with singing-specific model
  5. User selects a character (existing 2D/3D character from the project)
  6. A preview shows the character lip-syncing to the music
  7. User adjusts parameters: body motion intensity, emotion expression, head bob sync
  8. Optional: user adds beat-synced effects (zoom, shake, flash) tied to musical beats
  9. User finalizes and the singing character renders on the timeline
- **Properties/Parameters:**
  - `audioSource`: Music file reference (MP3, WAV, OGG)
  - `characterId`: Character to animate
  - `vocalIsolation`: Auto-separate vocals from instrumentals (default: `true`)
  - `singingStyle`: `'pop'` | `'rap'` | `'ballad'` | `'opera'` | `'hum'` (default: `'pop'`)
  - `bodyMotion`: Body sway/bounce intensity (0-10, default: `5`)
  - `bodyMotionStyle`: `'bounce'` | `'sway'` | `'dance'` | `'subtle'` (default: `'bounce'`)
  - `headBob`: Head movement synced to beat (0-10, default: `3`)
  - `emotionMapping`: `'auto'` (detect from music) | `'manual'` (user-specified emotion timeline)
  - `heldVowelHandling`: How to handle sustained notes: `'hold-open'` | `'vibrato-mouth'` | `'blend'` (default: `'hold-open'`)
  - `instrumentalBehavior`: What character does during non-vocal sections: `'idle'` | `'groove'` | `'freeze'` (default: `'groove'`)
  - `beatSync`: Sync visual effects to detected beats (default: `true`)
  - `beatSyncIntensity`: Strength of beat-synced effects (0-10, default: `5`)
  - `mouthOpenScale`: How wide the mouth opens for singing (0.5x-2x, default: `1.2x`)
  - `visemeSmoothing`: Temporal smoothing for singing visemes (higher = smoother, 0-1, default: `0.4`)
- **Output:** An animated character layer with singing-specific viseme timeline, body motion keyframes, and beat-synced effects, rendered through the existing character composite system and exported via Remotion.
- **Acceptance criteria:**
  - Viseme timing matches vocal phonemes within 50ms accuracy
  - Sustained/held notes show the character holding mouth open naturally (no flickering)
  - Instrumental sections correctly show the character not singing (idle, grooving, or frozen per settings)
  - Beat-synced body motion is visibly aligned with the musical beat (within 1-2 frames)
  - Rap mode handles fast syllable delivery without viseme flickering
  - The feature works with all existing character types (2D composite, 3D model, rigged characters)
  - Vocal isolation successfully separates vocals in 80%+ of mixed music tracks
  - Emotion auto-detection produces plausible emotional expressions matching the music mood
  - The output renders correctly through the Remotion export pipeline
  - Performance: real-time playback preview without frame drops for 2D characters
- **Edge cases:**
  - **Instrumental-only tracks with no vocals:** Disable lip-sync; only apply beat-synced body motion and effects
  - **Harmonies / backing vocals:** Use only the primary vocal track; flag when multiple vocal tracks are detected and let user select which to sync
  - **Very fast rap (>8 syllables/second):** Increase viseme smoothing automatically and reduce mouth motion detail to prevent jittering
  - **Falsetto / very high vocal ranges:** Phoneme detection accuracy drops for extreme vocal ranges; fall back to energy-based mouth animation
  - **Screaming / growling (metal/punk):** Map to wide-open mouth with minimal viseme variation; rely on energy intensity for mouth-open scale
  - **Live performances with crowd noise:** Vocal isolation quality may degrade; warn user and suggest using studio-quality audio when available
- **Dependencies:**
  - Depends on: Existing lip-sync pipeline (`lipSync.ts`, `visemeMapper.ts`), vocal isolation capability (new), beat detection (`musicAnalyzer.ts`)
  - Integrates with: AI Voice Cloning (feature 20, sing with cloned voice), beat-sync system (`BeatSyncConfig`)
- **Integration with ProAnimate:**
  - Extends the existing `LipSyncProcessor` in `src/services/lipSync.ts` with a singing-specific mode
  - Viseme mapping uses the existing 9-viseme system in `src/types/voice.ts` with singing-specific temporal smoothing
  - Character rendering through existing `CharacterComposite.tsx` (2D), `Character3DRenderer.tsx` (3D), and `RiggedCharacterRenderer.tsx` (rigged)
  - Beat detection leverages `src/services/musicAnalyzer.ts` which already exists for mood analysis
  - Beat-sync configuration uses the existing `BeatSyncConfig` type in `src/types/orchestrator.ts`
  - Body motion keyframes integrate with `useCharacterConfigStore.ts` (2D transforms) or `use3DRigStore.ts` (3D poses)
  - Emotion mapping connects to the existing 24-emotion-head system (`emotionHeads.ts`) and mouth curvature system
  - Orchestrator integration: a new step or mode within `generate-voices` that handles singing audio
- **Use cases:**
  - A music producer wants to create an animated music video with their character singing the lead vocal
  - A content creator makes a viral TikTok by having their animated character lip-sync to a trending song
  - An educator creates a "singing lesson" video where the character demonstrates correct mouth shapes for each note
- **Why it matters:** Singing character content is one of the most viral content categories on TikTok and Instagram, with singing/lip-sync videos consistently ranking among the highest engagement formats. Hedra has built its user base (350K+ users, 1.6M+ video generations) largely on the ability to make characters sing. For ProAnimate, this leverages the existing 24-viseme system and character animation infrastructure to tap into this high-engagement content category.
- **Who has it:** Hedra AI (singing characters from single image, Character-3 model), Captions App (lip-sync to music), HeyGen (avatar singing/lip-sync), CapCut (AI lip-sync to audio)
- **Gold standard:** Hedra's Character-3 model is the current gold standard for singing character videos. It takes a single portrait image and audio input (speech, singing, rapping) and produces a video with highly realistic lip-sync that includes not just mouth movements but also head motion, eye movement, and upper body motion matching the audio. The system handles singing with sustained notes, rhythmic delivery, and emotional expression, producing results that are widely shared on TikTok as viral content.

---

### 35. URL-to-Video
- **Category:** AI Content Generation
- **What it is:** System that takes any web page URL (product page, landing page, news article) and automatically generates a promotional or explanatory video from its content.
- **What it does:** Scrapes the target URL and extracts key content: product name, description, features, benefits, pricing, images, and reviews. Passes the extracted content to Gemini to generate a video script optimized for the target platform (TikTok, YouTube Shorts, Reels). Then feeds the script into the ProAnimate orchestrator pipeline to generate a complete animated clip with characters, voiceover, captions, B-roll (using extracted product images), text overlays, and motion graphics. Supports bulk generation of multiple script variants from a single URL for A/B testing.
- **User flow:**
  1. User pastes a URL into the "URL to Video" input field (in the orchestrator or a dedicated panel)
  2. System fetches the page content (shows loading indicator)
  3. Extracted content is displayed: product/page title, key points, images found, detected page type (product, article, landing page)
  4. User selects video style: "Product Ad" | "Explainer" | "Review" | "News Clip" | "Tutorial"
  5. User configures: target duration, aspect ratio, voice, character selection, language
  6. System generates 1-3 script variants using Gemini, displayed for review
  7. User picks a script (or edits one) and clicks "Generate Video"
  8. The full orchestrator pipeline runs, producing a complete clip
  9. User reviews, makes edits, and exports
- **Properties/Parameters:**
  - `url`: Target web page URL (required)
  - `pageType`: `'auto-detect'` | `'product'` | `'article'` | `'landing-page'` | `'recipe'` | `'event'` (default: `'auto-detect'`)
  - `videoStyle`: `'product-ad'` | `'explainer'` | `'review'` | `'news'` | `'tutorial'` (default: `'product-ad'`)
  - `targetDuration`: Target video duration in seconds (15-120, default: `30`)
  - `aspectRatio`: `'9:16'` | `'16:9'` | `'1:1'` (default: `'9:16'`)
  - `scriptVariants`: Number of script alternatives to generate (1-5, default: `3`)
  - `voiceId`: ElevenLabs voice ID (default: project voice)
  - `characterId`: Character to use (default: project default or auto-select)
  - `language`: Output language (default: detected from page)
  - `usePageImages`: Include product/page images in the video (default: `true`)
  - `includePrice`: Highlight pricing if detected (default: `true`)
  - `includeCTA`: Add call-to-action overlay (default: `true`)
  - `ctaText`: Custom CTA text (default: auto-generated based on page type)
  - `toneOfVoice`: `'professional'` | `'casual'` | `'energetic'` | `'luxury'` | `'humorous'` (default: `'energetic'`)
  - `batchMode`: Generate multiple videos with different scripts (default: `false`)
- **Output:** A fully orchestrated ProAnimate clip (same output as the standard orchestrator pipeline), with the script derived from web page content instead of a user prompt. Optionally, multiple clip variants from different scripts.
- **Acceptance criteria:**
  - URL content extraction works for 90%+ of public web pages (HTML/JS-rendered)
  - Product page detection correctly identifies product name, description, price, and images for e-commerce sites (Amazon, Shopify, WooCommerce)
  - Generated scripts accurately represent the page content without fabricating features
  - At least 2 of 3 script variants are meaningfully different (not minor rewrites)
  - The full pipeline (fetch + extract + script + generate) completes in under 3 minutes for a 30-second clip
  - Extracted product images are correctly placed as B-roll or overlay media
  - The generated video passes the virality scoring system with a score > 50
  - Privacy-safe: no extraction of personal data, login forms, or private content
  - Rate limiting prevents abuse (existing 10 req/min per IP, configurable)
- **Edge cases:**
  - **JavaScript-rendered SPAs:** Use a headless browser or API-based extraction for pages that require JS execution
  - **Login-walled content:** Gracefully fail with a message explaining that the page requires authentication
  - **Very long pages (>10,000 words):** Truncate to the most relevant sections based on semantic analysis
  - **Non-English pages:** Detect the page language and either generate in that language or translate to the target language
  - **Pages with no images:** Generate without product imagery; use stock media from Pixabay instead
  - **Pages with aggressive anti-scraping:** Respect robots.txt; fall back to user-provided text/screenshots
  - **Malicious URLs:** Validate URLs against SSRF attacks (existing `isPrivateURL` check in `urlToVideo.ts`)
- **Dependencies:**
  - Depends on: Web scraping capability (existing in `server/routes/urlToVideo.ts` with cheerio), Gemini script generation, full orchestrator pipeline
  - Integrates with: AI B-Roll Auto-Insertion (feature 9, page images as B-roll), orchestrator, text overlay system
- **Integration with ProAnimate:**
  - The backend already has `server/routes/urlToVideo.ts` with URL extraction, rate limiting, SSRF protection, and Gemini content analysis via cheerio
  - Extracted content feeds into the existing orchestrator as an enhanced prompt (replacing the user's text prompt)
  - Page images download and store via `mediaDB.ts` for use as media layers
  - Script generation uses the same Gemini model and prompt structure as the orchestrator's `buildPlanPrompt`
  - Character, voice, and template selection use the existing `OrchestratorSettings` interface
  - The orchestrator's full 13-step pipeline executes the generated plan
  - Credit consumption aggregates across extraction (Gemini), TTS (ElevenLabs), and generation steps
- **Use cases:**
  - A dropshipper pastes their Shopify product URL and gets 3 different TikTok-ready video ads in 5 minutes, each with a different script angle (feature-focused, emotional, comparison)
  - A news content creator pastes a breaking news article URL and generates a 30-second animated news clip with a character narrating the key points
  - A marketing agency batch-processes 20 product URLs for a client campaign, generating A/B test video variants for each product
- **Why it matters:** URL-to-video is the highest-leverage feature for e-commerce and marketing users, turning any product page into a video ad without requiring a single creative decision. Creatify has built its business around this workflow, and the broader AI video ad market is projected to reach $9.1B by 2026. For ProAnimate, this transforms the platform from a creative tool into a commercial content generation engine, opening up the massive e-commerce advertising market.
- **Who has it:** Creatify (gold standard, URL-to-ad with AI avatars, batch A/B testing, AdMax competitor insights), Pictory (URL/blog-to-video), Lumen5 (blog URL-to-video pioneer), Zebracat (URL/text/audio-to-video), Invideo (URL-to-video)
- **Gold standard:** Creatify defines the gold standard for URL-to-video. The user pastes a product page URL (Shopify, Amazon, or any e-commerce site), and the AI analyzes the product details, features, benefits, and key selling points. It then generates multiple script variations trained on thousands of top-performing social video ads, pairs them with AI avatars from a library of 70+ options, and outputs finished ads in multiple aspect ratios. The platform supports batch creation of 10+ variants for A/B testing, with the complete pipeline producing ready-to-publish ads in minutes.

---

### 36. Blog/Article-to-Video
- **Category:** AI Content Generation
- **What it is:** System that converts long-form text content (blog posts, articles, newsletters, documentation) into visually engaging video summaries.
- **What it does:** Ingests article text (via URL, paste, or file upload), uses AI to identify the key points and narrative structure, generates a storyboard that matches text segments to visual assets (stock footage, images, motion graphics templates, AI-generated SVG objects), adds narration via TTS, and produces a complete video with captions, transitions, and background music. Unlike URL-to-Video (which targets product/promotional pages), this feature is optimized for editorial and educational long-form text with structured sections, headings, and paragraphs.
- **User flow:**
  1. User provides content via: paste article URL, paste text directly, or upload a document (TXT, DOCX, PDF)
  2. System extracts and structures the text, identifying headings, key points, and logical sections
  3. A storyboard view appears showing the proposed video structure: each "scene" maps to a key point with suggested visual type (stock footage, template, character, SVG)
  4. User reviews and adjusts the storyboard: reorder scenes, edit text summaries, change visual suggestions
  5. User configures: narration voice, video duration target, aspect ratio, caption style, music mood
  6. User clicks "Generate Video" and the orchestrator pipeline produces the clip
  7. Each scene generates sequentially with progress tracking
  8. User reviews the complete video in the editor with full editing capabilities
- **Properties/Parameters:**
  - `source`: `'url'` | `'text'` | `'file'` with the corresponding content
  - `url`: Article URL (if source is URL)
  - `rawText`: Pasted text content (if source is text, max 10,000 words)
  - `fileRef`: Uploaded document reference (if source is file)
  - `maxScenes`: Maximum number of video scenes/sections (3-20, default: `8`)
  - `targetDuration`: Total video duration target in seconds (30-300, default: `60`)
  - `durationPerScene`: Average duration per scene in seconds (5-30, default: `7`)
  - `visualStrategy`: `'stock-footage'` | `'motion-graphics'` | `'characters'` | `'mixed'` (default: `'mixed'`)
  - `narratorVoice`: ElevenLabs voice ID for narration
  - `narratorSpeed`: Narration speed multiplier (0.8-1.3, default: `1.0`)
  - `summarizationLevel`: How much to condense the source (`'highlight'` = key points only, `'summary'` = condensed, `'detailed'` = comprehensive, default: `'summary'`)
  - `captionStyle`: Caption preset
  - `musicMood`: `'professional'` | `'upbeat'` | `'calm'` | `'dramatic'` | `'none'` (default: `'professional'`)
  - `brandKit`: Apply brand colors, fonts, logo (optional)
  - `aspectRatio`: `'16:9'` | `'9:16'` | `'1:1'` (default: `'16:9'`)
  - `includeTransitions`: Scene transition effects (default: `true`)
  - `transitionType`: `'fade'` | `'slide'` | `'zoom'` | `'wipe'` (default: `'fade'`)
- **Output:** A fully produced video with narration, visuals, captions, and music, structured as a standard ProAnimate project with all layers editable. Includes a storyboard document for reference.
- **Acceptance criteria:**
  - Article extraction correctly identifies 90%+ of key points from well-structured articles (with H1-H3 headings)
  - A 2,000-word article processes into a storyboard within 30 seconds
  - Generated narration script accurately represents the article without hallucinating facts
  - Visual matching selects contextually appropriate stock footage/templates for 80%+ of scenes
  - The complete video generation pipeline finishes in under 5 minutes for a 60-second video
  - Scene transitions are smooth and professional
  - The storyboard editor allows full reordering, editing, and visual swapping before generation
  - Output works correctly on all supported aspect ratios
  - The generated video has a coherent narrative arc (introduction, body, conclusion)
  - URL extraction works for major blogging platforms (WordPress, Medium, Substack, Ghost)
- **Edge cases:**
  - **Very short articles (<200 words):** Generate a single-scene video or prompt user to add more content
  - **Very long articles (>10,000 words):** Auto-truncate with summarization and warn user about content reduction
  - **Articles with no clear structure (no headings):** Use NLP sentence importance scoring to identify key points
  - **Technical articles with code blocks:** Display code as styled text overlays or code screenshot templates
  - **Articles with embedded images:** Extract and use the article's own images as visuals alongside stock footage
  - **Non-English articles:** Support extraction and narration in the source language or translate to target language
  - **Paywall-protected articles:** Prompt user to paste the text directly; URL extraction will fail gracefully
- **Dependencies:**
  - Depends on: URL extraction (`server/routes/urlToVideo.ts`), Gemini script generation, orchestrator pipeline, Pixabay stock media, ElevenLabs TTS
  - Integrates with: AI B-Roll Auto-Insertion (feature 9), HTML motion graphics templates, SVG object generation
- **Integration with ProAnimate:**
  - URL extraction extends the existing `server/routes/urlToVideo.ts` endpoint with article-specific parsing logic
  - Storyboard generation uses Gemini (same model as orchestrator) to analyze text and produce a `ClipPlan` structure
  - Each scene maps to orchestrator plan sections: background, text overlays, stock media, character (if narrator style)
  - Visual matching leverages Pixabay (`src/services/pixabay.ts`), the 100+ built-in HTML templates (`builtinTemplates.ts`), and SVG generation
  - Narration uses `ElevenLabsService.generateWithAlignment()` from `src/services/elevenlabs.ts`
  - The storyboard view can be implemented as a new orchestrator phase (between prompt and planning)
  - Music generation uses the existing `generateMusic` from ElevenLabs integration
  - All output stores and renders through the standard ProAnimate store → Remotion pipeline
- **Use cases:**
  - A blogger converts their weekly article into a YouTube Shorts video to cross-promote content, generating 3x more reach from the same writing effort
  - A corporate communications team turns internal newsletters into short video summaries for Slack, increasing readership from 15% to 60%
  - A news aggregator site generates quick video summaries of top stories, allowing viewers to consume the day's news in 5-minute video playlists
- **Why it matters:** Content repurposing from text to video is one of the largest growth vectors in digital marketing, with 89% of businesses using video as a marketing tool. Pictory and Lumen5 have built substantial businesses around this workflow (Pictory processes 1,400+ document formats). For ProAnimate, blog-to-video extends the platform's reach beyond "create from scratch" users into the massive content repurposing market, especially for marketers and educators who already have rich text content libraries.
- **Who has it:** Pictory (market leader, 3M+ clips, 1,400+ document formats, 35% visual matching improvement in 2025), Lumen5 (pioneer, RSS feed integration, auto-storyboarding), Zebracat (blog URL conversion, brand kit integration), Invideo (article-to-video), Steve AI (text-to-video)
- **Gold standard:** Pictory is the gold standard for blog/article-to-video conversion. It processes a pasted blog URL and extracts key points within 30 seconds, auto-matches sentences with relevant footage from their 3M+ clip library, generates accurate captions, and supports 1,400+ document formats. Their 2025 updates improved visual matching accuracy by 35% and introduced enterprise-grade integrations with Zapier and Make.com for automated workflows. A 2,000-word blog post typically results in a video outline within 30 seconds and a finished video in 10-15 minutes including manual adjustments.

---

### 37. AI Person Clone
- **Category:** AI Content Generation
- **What it is:** System that creates a photorealistic digital twin of a real person from a short video recording, capturing their appearance, voice, gestures, and mannerisms for automated video content production.
- **What it does:** Takes a 2-5 minute video recording of a person and builds a comprehensive digital model that includes: facial appearance and expressions, voice characteristics (via voice cloning), body language patterns, head movement tendencies, hand gesture repertoire, and speaking rhythm. The resulting "clone" can then generate new video content by simply providing a text script, with the clone delivering the script naturally as if the real person recorded it. The system supports multiple languages (the clone can speak languages the person did not record in) and different environments/backgrounds.
- **User flow:**
  1. User clicks "Create Clone" from a dedicated Clone panel or Settings
  2. System prompts user to record or upload a 2-5 minute video of themselves speaking naturally
  3. Recording guidelines shown: well-lit, neutral background, facing camera, variety of expressions/gestures encouraged
  4. User records in-browser or uploads a video file
  5. A consent/rights verification step requires explicit confirmation
  6. System processes the video: face modeling, voice cloning, gesture analysis (progress: 2-10 minutes for instant, 24-48 hours for enhanced)
  7. Clone appears in a "My Clones" library with a test preview
  8. User types a test script; the clone generates a preview video (10-30 seconds generation time)
  9. User adjusts clone settings if needed (expression intensity, gesture frequency)
  10. Clone is available for use in any ProAnimate project: as a character layer, narrator, or talking-head replacement
- **Properties/Parameters:**
  - `videoSource`: Uploaded video file or in-browser recording
  - `minDuration`: Minimum recording duration (120 seconds)
  - `maxDuration`: Maximum recording duration (600 seconds)
  - `processingMode`: `'instant'` (ready in minutes, lower fidelity) | `'enhanced'` (ready in 24-48 hours, higher fidelity, default: `'instant'`)
  - `cloneName`: User-defined name for the clone
  - `voiceCloneId`: Associated ElevenLabs voice clone ID (auto-created during processing)
  - `expressionIntensity`: How expressive the clone's face is (0-10, default: `5`)
  - `gestureFrequency`: How often the clone gestures (0-10, default: `5`)
  - `headMovementIntensity`: Head motion during speaking (0-10, default: `5`)
  - `backgroundMode`: `'original'` | `'green-screen'` | `'custom-image'` | `'transparent'` (default: `'transparent'`)
  - `outputResolution`: `'720p'` | `'1080p'` (default: `'1080p'`)
  - `enabledLanguages`: Languages the clone can speak (default: all ElevenLabs supported languages)
  - `lipSyncAccuracy`: `'standard'` | `'enhanced'` (default: `'standard'`)
- **Output:** A digital clone profile containing: face/body model, linked voice clone, gesture library, and generation parameters. The clone produces video outputs that can be layered into ProAnimate projects as standard video layers.
- **Acceptance criteria:**
  - The clone is visually recognizable as the same person (subjective: 9/10 viewers identify correctly)
  - Lip sync accuracy matches the quality of Hedra Character-3 or better
  - Generated gestures appear natural and contextually appropriate (not random)
  - Voice clone quality matches ElevenLabs Instant Voice Cloning standards
  - Instant processing completes in under 10 minutes
  - The clone can generate a 30-second video from a script in under 60 seconds
  - Multi-language support works for at least 20 languages with accurate lip sync
  - The consent flow is legally compliant and requires explicit opt-in
  - Generated videos have no visible artifacts at face boundaries
  - The clone integrates with the ProAnimate timeline as a standard layer
- **Edge cases:**
  - **Poor recording quality:** Reject recordings below quality thresholds (resolution, lighting, noise) with specific improvement suggestions
  - **Face not visible throughout:** Require 80%+ face visibility in the recording; reject segments where face is obscured
  - **Multiple people in recording:** Auto-detect and ask user to select the target person; crop to the selected individual
  - **Extreme expressions in training video:** May cause the clone to over-express; recommend neutral-to-moderate expression range in recording guidelines
  - **Clone misuse (deepfake concerns):** Implement digital watermarking in all clone-generated content; require identity verification for the clone subject
  - **Clone of someone other than the user:** Require additional consent documentation from the subject being cloned
  - **Aging/appearance changes:** Clones reflect the appearance at recording time; users may need to re-record periodically
- **Dependencies:**
  - Depends on: AI Voice Cloning (feature 20) for the voice component, face generation/manipulation ML model (e.g., HeyGen-style avatar API or self-hosted model), video processing backend
  - Integrates with: All character/layer systems in ProAnimate, Text-Based Video Editing (feature 22, edit clone's script to regenerate), multi-language dubbing
- **Integration with ProAnimate:**
  - Clone-generated videos place as media layers via `useMediaStore.ts` and render through `MediaLayer.tsx`
  - Voice component created via the existing ElevenLabs voice cloning integration in `src/services/elevenlabs.ts`
  - The clone profile stores as a special character type in a new `useCloneStore.ts` or extends `useSavedCharactersStore.ts`
  - Script input for the clone feeds through the same Gemini script generation and ElevenLabs TTS pipeline
  - The orchestrator can use a clone as a "character" in the `setup-characters` step
  - Generated clone videos export through the standard `videoExport.ts` pipeline
  - The `photoToAvatar.ts` service already does photo analysis via Gemini Vision; this extends it with full video analysis
  - Credits consume both voice cloning and video generation costs via `withCreditGate`
- **Use cases:**
  - A solo content creator clones themselves and uses the clone to produce daily TikTok videos from scripts, multiplying their output from 1 video/day to 10 videos/day without recording
  - A CEO creates a clone for internal communications, enabling the comms team to generate video messages from the CEO on any topic without scheduling recording time
  - A multilingual educator clones themselves and produces course content in 5 languages, with the clone speaking each language naturally with synchronized lip movements
- **Why it matters:** AI person cloning is the ultimate productivity multiplier for video content creators, enabling fully autonomous video production at scale. Argil (YC-backed) has built its entire product around this capability, and HeyGen generates significant revenue from avatar-based video production. For ProAnimate, person cloning represents the highest-value upgrade to the autonomous video pipeline -- it replaces the last "fake" element (stock AI voices + cartoon characters) with the creator's own likeness and voice, dramatically increasing content authenticity and viewer trust.
- **Who has it:** Argil ($39-149/mo, 2-min recording, learns gestures/mannerisms, ElevenLabs voice), HeyGen ($24-149/mo, 1100+ pre-built avatars + custom avatar creation, 175 languages), Synthesia (enterprise, custom avatars), Captions App (personal AI model), D-ID (talking head generation)
- **Gold standard:** Argil is the gold standard for creator-focused person cloning. Their proprietary "Adam" model creates a clone from just a 2-minute recording, analyzing facial features, bone structure, skin tone, body language, and voice intonation. The clone can perform activities (walking, holding products, drinking coffee), speak multiple languages with accurate lip sync, and reproduce the creator's natural mannerisms. The clone generation is fast (minutes for instant), and the output quality has reached a point where the hands and face are remarkably natural for standard talking-head content.

---

### 39. Sketch-to-Animation
- **Category:** AI Content Generation
- **What it is:** AI system that converts hand-drawn sketches, doodles, wireframes, or rough illustrations into polished animated motion graphics and character animations.
- **What it does:** Accepts a hand-drawn sketch (uploaded photo, tablet drawing, or in-browser canvas drawing) and interprets the visual elements: identifies characters, objects, backgrounds, text, arrows, and spatial relationships. Then generates a clean vector or styled rendering of the sketch and applies contextually appropriate animations (character movement, object transitions, camera motion, text reveals). The system preserves the creator's original composition and intent while elevating the production quality from "rough sketch" to "professional motion graphic." Supports multiple output styles: clean vector, whiteboard animation, colorized illustration, or motion design.
- **User flow:**
  1. User draws a sketch in the in-browser canvas tool, uploads a photo of a hand-drawn sketch, or uploads a digital drawing
  2. User clicks "Animate Sketch" from the toolbar
  3. System analyzes the sketch and identifies elements (2-5 seconds)
  4. A preview shows the detected elements with bounding boxes and labels (e.g., "Character A", "Arrow", "Text: Hello", "Background: Mountain")
  5. User corrects any misidentified elements
  6. User selects output style: "Clean Vector" | "Whiteboard" | "Illustrated" | "Motion Design" | "Pixel Art"
  7. User selects animation style: "Reveal" (draw-on), "Explainer" (step-by-step), "Story" (scene transitions), "Dynamic" (full motion)
  8. System generates the polished animation (10-30 seconds)
  9. Preview plays the animation; user can adjust timing, add/remove animations per element, or regenerate
  10. "Import to Timeline" places the animation as a ProAnimate layer
- **Properties/Parameters:**
  - `sketchSource`: Image file reference or canvas data
  - `outputStyle`: `'clean-vector'` | `'whiteboard'` | `'illustrated'` | `'motion-design'` | `'pixel-art'` (default: `'motion-design'`)
  - `animationStyle`: `'reveal'` | `'explainer'` | `'story'` | `'dynamic'` (default: `'reveal'`)
  - `colorMode`: `'auto-color'` (AI selects colors) | `'original'` (keep sketch colors) | `'monochrome'` | `'custom-palette'` (default: `'auto-color'`)
  - `customPalette`: Array of hex colors (if `colorMode` is `'custom-palette'`)
  - `duration`: Total animation duration (3-30 seconds, default: `8`)
  - `lineStabilization`: Smooth out shaky hand-drawn lines (0-10, default: `5`)
  - `detailLevel`: How much detail to add beyond the sketch (`'faithful'` | `'enhanced'` | `'elaborate'`, default: `'enhanced'`)
  - `preserveLayout`: Keep original spatial arrangement (default: `true`)
  - `characterDetection`: Attempt to identify and separately animate characters (default: `true`)
  - `textDetection`: Detect and render text as editable overlays (default: `true`)
  - `backgroundSeparation`: Separate background from foreground elements (default: `true`)
  - `aspectRatio`: `'16:9'` | `'9:16'` | `'1:1'` | `'match-sketch'` (default: `'match-sketch'`)
  - `fps`: Output frame rate (24/30/60, default: `30`)
- **Output:** An animated video or motion graphic composition imported into ProAnimate as either: (a) a set of SVG objects with keyframe animations on the timeline (editable), or (b) a rendered video layer (non-editable but higher quality). Character elements can optionally be extracted as ProAnimate character sprites for the rigging system.
- **Acceptance criteria:**
  - Sketch element detection correctly identifies 80%+ of distinct elements in a moderately complex sketch (5-15 elements)
  - Clean vector output has smooth, professional lines (no jagged edges from the original sketch)
  - The animation preserves the spatial layout and compositional intent of the original sketch
  - Text detection correctly reads 90%+ of legible handwritten text
  - Character detection identifies humanoid figures and animals with 85%+ accuracy
  - Whiteboard style produces a convincing "hand-drawing" animation effect
  - The complete pipeline (analysis + generation) finishes in under 30 seconds for a standard sketch
  - Output integrates with the ProAnimate timeline and is editable (for SVG output mode)
  - Multiple output styles produce visually distinct results from the same input sketch
  - The feature works with photos of paper sketches (not just clean digital drawings)
- **Edge cases:**
  - **Very rough/abstract sketches:** Lower the confidence threshold for element detection; display as a single animated composition rather than decomposing into elements
  - **Sketches with no clear elements:** Generate a simple reveal/draw-on animation of the entire sketch as-is
  - **Photos with shadows/wrinkles:** Apply image preprocessing (contrast enhancement, shadow removal, perspective correction) before analysis
  - **Mixed text and drawings:** Separate text elements for editable overlay while animating drawings
  - **Very detailed/dense sketches:** May exceed element detection capacity; group nearby elements and animate as clusters
  - **Stick figures vs. detailed characters:** Adapt character animation complexity to match the input detail level
  - **Non-Latin handwritten text:** Text detection should support major scripts (Latin, CJK, Arabic, Cyrillic)
- **Dependencies:**
  - Depends on: Image analysis model (Gemini Vision or specialized sketch detection model), SVG generation (existing `svgObjectAnimation.ts`), animation keyframe system
  - Integrates with: SVG object system, motion graphics templates, character rigging pipeline (for detected characters)
- **Integration with ProAnimate:**
  - Sketch analysis uses Gemini Vision (same API as the existing `autoRigService.ts` and `photoToAvatar.ts`)
  - Clean vector output generates SVG objects through the existing `svgObjectAnimation.ts` and `useSVGObjectStore.ts`
  - SVG keyframe animation uses the existing `svgComposer.ts` with `SVGObjectKeyframe` types
  - Character elements detected in sketches can be routed to the `CharacterGeneratorPanel.tsx` for full character creation
  - Whiteboard/draw-on animation can use SVG path animation (stroke-dashoffset technique) rendered through `SVGObjectLayer.tsx`
  - Motion design output can leverage the 100+ built-in HTML templates from `builtinTemplates.ts`
  - The in-browser drawing canvas can be implemented as a new component using HTML5 Canvas or SVG drawing
  - Pixel art output mode routes through the existing pixel art character system
  - Remotion export through `VideoComposition.tsx` handles all output formats
- **Use cases:**
  - A teacher sketches a math concept on paper, photographs it, and the system generates a polished animated explainer video showing each step being drawn and annotated
  - A startup founder draws a rough product wireframe and converts it into a professional motion graphic for their pitch deck or social media announcement
  - A content creator doodles a storyboard for a TikTok idea and the system generates a fully animated video with clean artwork, motion, and transitions from the rough sketches
- **Why it matters:** Sketch-to-animation bridges the gap between creative ideation and production, making animation accessible to people who cannot draw professionally or use complex animation software. Meta has invested in this space (open-source Animated Drawings project), and Motionvid.ai has built a growing business around their Miltos model that converts sketches and text into motion graphics. For ProAnimate, this feature dramatically lowers the barrier to entry -- users do not need to be artists to create animations, they just need to sketch an idea. Combined with the existing character rigging system, it creates a "napkin sketch to animated video" pipeline.
- **Who has it:** Motionvid.ai (Miltos v3.0, sketch/image/text to motion graphics, up to 8K export), Meta Animated Drawings (open-source, doodle-to-character-animation), Adobe Firefly (AI animation from concepts), Animaj (sketch-to-pose for animation), Opus (doodle-style video generation), Animaker (text-to-doodle-animation)
- **Gold standard:** Motionvid.ai with their Miltos v3.0 model represents the current gold standard for sketch-to-animation. The platform accepts hand-drawn sketches, images, or text prompts and transforms them into polished motion graphics with one click. The system preserves the creator's original vision beyond what text prompts alone can achieve, automatically selecting complementary visuals, animations, and music. Output quality reaches up to 8K resolution, and the platform handles the full pipeline from rough doodle to cinematic motion graphic within minutes.

---

## Category 3: AI Editing Intelligence

### 18. Beat Detection & Audio Sync
- **Category:** AI Editing Intelligence
- **What it is:** An audio analysis system that detects beats, onsets, BPM, and rhythmic structure in audio tracks and uses that data to automatically synchronize animation keyframes, cuts, and visual effects to the music.
- **What it does:** The system decodes any audio source (uploaded music file, generated TTS audio, or background music) through Web Audio API spectral flux analysis. It identifies the BPM, individual beat positions, onset transients, and energy segments. It then generates a beat map that other systems can consume: the keyframe engine creates animation keyframes aligned to beats (scale pulses, opacity flashes, bounces), the timeline system places cuts and transitions at beat boundaries, and HTML template layers can receive beat events for synchronized visual effects. The system supports beat subdivision (quarter, half, whole beats), offset adjustments for look-ahead alignment, downbeat emphasis, and per-stem analysis when paired with audio stem separation.
- **User flow:**
  1. User adds audio to the project (uploaded music, generated voice, or AI-generated background music).
  2. User navigates to the Beat Sync panel (left panel tab: "beat-sync").
  3. The system automatically analyzes the audio and displays a beat grid overlay on the timeline with detected BPM, beat markers, and onset markers.
  4. User selects target objects (text overlays, shapes, media items, characters, camera) to sync.
  5. User chooses an effect type (scale-pulse, opacity-flash, bounce, cut, transition-trigger) and configures intensity, subdivision, and offset.
  6. User clicks "Apply Beat Sync" and keyframes are auto-generated on the selected objects at beat positions.
  7. User previews playback to verify sync quality, then fine-tunes by adjusting sensitivity or manually shifting individual beat markers.
- **Properties/Parameters:**
  - `sensitivity` (number, 0.0--1.0, default 0.5): Controls how many onsets are detected; higher values detect quieter beats.
  - `minInterval` (number, seconds, default 0.2): Minimum gap between detected beats to prevent false positives.
  - `subdivision` (enum: 1 | 2 | 4, default 1): 1 = every beat, 2 = every other beat, 4 = every 4th beat.
  - `offset` (number, seconds, default 0.0): Time shift applied to all beat positions, useful for aligning visuals that need anticipation.
  - `effect` (enum: "scale-pulse" | "opacity-flash" | "bounce" | "cut" | "shake", default "scale-pulse"): The visual effect triggered on each beat.
  - `intensity` (number, 0.0--1.0, default 0.7): Magnitude of the effect (e.g., how much to scale, how bright the flash).
  - `targetObjects` (CanvasObjectRef[]): List of canvas objects to receive beat-synced keyframes.
  - `syncMediaTransitions` (boolean, default false): Auto-place media enter/exit transitions on beats.
  - `syncCameraZoom` (boolean, default false): Pulse camera zoom on beats.
  - `bpmOverride` (number | null, default null): Manually set BPM instead of auto-detecting.
  - `stemFilter` (enum: "all" | "drums" | "bass" | "vocals" | "melody", default "all"): When stem separation is available, react only to a specific instrument stem.
- **Output:** A `BeatAnalysis` object containing `{ bpm, beats[], onsets[], segments[], duration }` plus an array of `BeatKeyframe` objects written to `useKeyframeStore` with a "beat-sync" tag for easy batch removal or adjustment.
- **Acceptance criteria:**
  - BPM detection accuracy within plus or minus 2 BPM for tracks with clear rhythmic patterns (tested against known-BPM reference tracks).
  - Beat position accuracy within plus or minus 15ms of actual beat onset.
  - Beat grid overlay renders on the timeline ruler with distinct markers for downbeats vs. offbeats.
  - Auto-generated keyframes produce smooth, visually pleasing animations that feel "on the beat" during playback.
  - Users can remove all beat-sync keyframes in one action via the "beat-sync" tag.
  - Subdivision and offset controls update the beat grid in real-time without re-analyzing audio.
  - Works with all audio sources in ProAnimate: uploaded files, ElevenLabs TTS, AI-generated music.
  - Performance: analysis completes within 3 seconds for a 60-second audio clip on a mid-range device.
  - The orchestrator can invoke beat sync as part of the automated clip generation pipeline.
- **Edge cases:**
  - Audio with no clear beat (ambient, drone, speech-only): Fall back to onset detection only, display a warning that BPM could not be reliably determined, and let the user set BPM manually.
  - Tempo changes within a track: Segment the track into sections with consistent BPM and run detection per segment; display segment boundaries on the timeline.
  - Very short audio (under 2 seconds): Disable BPM estimation and only surface individual onset times.
  - Multiple audio layers (music + dialogue): Let the user select which audio source to analyze; default to the first non-voice audio track.
  - Audio with pickup beats before the first downbeat: Use the offset parameter to align the grid correctly; auto-detect the first strong downbeat as grid anchor.
- **Dependencies:** Depends on `useKeyframeStore` for writing beat-synced keyframes, `useTimelineStore` for beat marker overlay, Web Audio API (`AudioContext`, `decodeAudioData`). Enables the orchestrator's `sync-to-beat` step. Existing `src/services/beatDetection.ts` and `src/engine/beatSync.ts` provide the foundation.
- **Integration with ProAnimate:**
  - `src/services/beatDetection.ts`: Already implements spectral flux onset detection and BPM estimation via auto-correlation. This specification extends it with stem filtering and segment-level BPM.
  - `src/engine/beatSync.ts`: Already defines `Beat`, `BeatSyncConfig`, `BeatKeyframe` types and has a `detectBeats()` function. Extend with new effect types and stem-aware analysis.
  - `src/stores/useBeatSyncStore.ts`: Existing store for beat sync state.
  - `src/types/keyframes.ts`: Already defines `BeatSyncEffect` and the `tag` field on `PropertyKeyframe` for grouping beat-sync keyframes.
  - `src/types/orchestrator.ts`: Already defines `BeatSyncConfig` with `syncMediaTransitions`, `syncTextOverlays`, `syncShapeEffects`, and `syncCameraZoom` flags.
  - `src/components/panels/BeatSyncPanel.tsx`: Existing panel UI.
  - `src/components/timeline/BeatSyncPopover.tsx`: Existing timeline popover for beat sync controls.
  - Orchestrator pipeline step `sync-to-beat` in `src/services/orchestrator/steps/syncToBeat.ts`.
- **Use cases:**
  1. A music educator creates a lyric video where text overlays appear in sync with the beat, each word bouncing in on a downbeat.
  2. A social media manager creates a product montage where stock media transitions snap to the beat of a trending audio track, maximizing perceived production quality.
  3. A content creator uses the orchestrator to generate a complete clip where the AI auto-detects the uploaded music's beat structure and syncs all visual elements accordingly.
- **Why it matters:** Beat-synced editing is the single most requested feature in short-form video creation. Research shows that viewers retain 23% more information when visuals align with audio rhythm. Every major competitor (LYRC, BeatSync PRO, Kaiber, Neural Frames) offers some form of beat detection. For ProAnimate, this feature directly increases the "wow factor" of AI-orchestrated clips and reduces the #1 complaint about auto-generated videos: that they feel disconnected from the audio. The feature targets music video creators, social media managers running ad campaigns on trending audio, and educators creating rhythmic educational content.
- **Who has it:** LYRC (beat detection + cut-point effects like Impact/Slam), BeatSync PRO (plus or minus 5ms precision beat detection), Neural Frames (8-stem audio extraction with per-instrument visual triggers), Kaiber (audio-reactive visual generation), Canva (auto beat sync), CapCut (audio spectrum visualizer), BeatEdit for After Effects/Premiere Pro (university-developed multi-method beat detector).
- **Gold standard:** Neural Frames implements this best with their 8-stem audio extraction system. They decompose audio into kick, snare, hi-hats, bass, vocals, melody, harmony, and percussion stems, allowing users to connect any visual parameter (color, scale, morphing intensity, transition speed) to any specific instrument stem. Their Autopilot mode analyzes the full song structure, identifies rhythmic triggers, and auto-generates a synchronized music video in under 10 minutes. The key differentiator is the granularity of control: rather than just "sync to the beat," users can make colors pulse with bass, transitions follow drums, and effects respond to vocals independently.

---

### 23. Natural Language Timeline Editing
- **Category:** AI Editing Intelligence
- **What it is:** A conversational AI interface that interprets plain-English editing commands and translates them into precise timeline operations, allowing users to edit their animation projects through natural language instead of manual timeline manipulation.
- **What it does:** The system provides a chat-based interface where users type or speak editing instructions (e.g., "make the intro 2 seconds shorter," "add a bounce effect to all text between 5s and 10s," "swap the order of scene 2 and scene 3," "make the title appear more gradually"). A Gemini-powered language model interprets the intent, maps it to one or more concrete actions from the editor's action registry, previews the changes, and executes them upon confirmation. The system maintains conversation context so users can issue follow-up commands like "actually make it even slower" or "undo that last change." It understands semantic concepts like "intro," "outro," "the part where the character speaks," and "the background music section" by analyzing the project's timeline structure, dialogue content, and layer names.
- **User flow:**
  1. User opens the Copilot drawer (already exists in ProAnimate) or uses a keyboard shortcut (e.g., Cmd+K) to activate the natural language input.
  2. User types a natural language command like "Move the title to appear at 3 seconds and fade in over half a second."
  3. The AI parses the command, identifies the target object (title text overlay), the target time (frame 90 at 30fps), and the desired animation (opacity keyframe from 0 to 1 over 15 frames).
  4. The system shows a preview card with the planned actions: "Set Title 1 startFrame to 90, add opacity keyframe at frame 90 (value: 0) and frame 105 (value: 1)."
  5. User confirms or requests modifications ("make the fade 1 second instead").
  6. Actions execute against the relevant stores, and an undo checkpoint is created.
  7. User can continue the conversation with follow-up edits that reference previous context.
- **Properties/Parameters:**
  - `model` (string, default "gemini-3.1-flash-lite-preview"): The AI model used for intent parsing.
  - `maxActionsPerCommand` (number, default 20): Safety limit on how many actions a single command can generate.
  - `autoExecute` (boolean, default false): When true, low-risk actions (navigation, playback, updates to existing objects) execute immediately without confirmation. High-risk actions (deletions, bulk changes) always require confirmation.
  - `conversationHistory` (CopilotChatMessage[], managed internally): Maintains context across turns.
  - `projectContext` (CopilotContext, auto-generated): Serialized snapshot of the current project state (layers, objects, timeline, settings) sent to the model for grounding.
  - `safetyLevel` (enum: "auto" | "confirm" | "preview-only", default "confirm"): Controls whether actions auto-execute, require confirmation, or only show a preview.
  - `supportedActionTypes` (string[]): Full registry of actions the AI can invoke (text, shape, character, dialogue, voice, media, template, SVG, playback, navigation, keyframe, undo/redo).
- **Output:** A sequence of typed `CopilotAction` objects that are executed against Zustand stores, producing visible changes on the canvas and timeline. Each action batch creates an undo checkpoint. The conversation history is maintained for context continuity.
- **Acceptance criteria:**
  - Correctly interprets at least 90% of common editing commands in user testing (move, resize, retime, add, remove, change color, adjust opacity, reorder, trim, extend).
  - Supports multi-step commands: "add a red circle at the center, scale it up from 0 over 1 second, then fade it out."
  - Understands temporal references: "at the beginning," "after the second dialogue line," "during the last 3 seconds," "when the character says hello."
  - Understands relative adjustments: "make it bigger," "move it to the left," "speed it up."
  - All AI-generated actions are reversible via undo.
  - Response latency under 2 seconds for single-action commands; under 5 seconds for complex multi-action commands.
  - Conversation context is maintained for at least 20 turns.
  - Gracefully handles ambiguous commands by asking clarifying questions: "Which text overlay do you mean? I see 'Title' and 'Subtitle'."
  - Works in the existing Copilot drawer UI without requiring a new panel.
- **Edge cases:**
  - Ambiguous object references ("move the text"): If multiple text overlays exist, ask the user to clarify by listing options with names and positions.
  - Commands referencing non-existent objects ("delete the logo"): Respond with a clear error message and suggest similar objects that do exist.
  - Conflicting commands ("make it bigger and smaller"): Identify the contradiction and ask for clarification.
  - Commands that would exceed project bounds ("move it to frame -10"): Clamp to valid ranges and inform the user.
  - Destructive batch commands ("delete everything"): Always require explicit confirmation regardless of safety level setting.
  - Non-editing requests ("what is the current FPS?"): Support read-only queries by returning project information without modifying state.
  - Commands in non-English languages: Initially English-only; surface a message suggesting English for best results.
- **Dependencies:** Depends on Gemini API access (`VITE_GEMINI_API_KEY`), the existing copilot action registry in `src/services/copilot/actions.ts`, all Zustand stores for state manipulation, and `src/services/copilot/contextBuilder.ts` for project context serialization. Enables hands-free editing workflows and accessibility improvements.
- **Integration with ProAnimate:**
  - `src/services/copilot/copilotService.ts`: Already implements the Gemini-powered copilot with a comprehensive system prompt listing all available actions. This specification extends it with improved temporal reasoning, relative adjustment support, and multi-step command parsing.
  - `src/services/copilot/actions.ts`: Already defines `ACTION_REGISTRY` with safety levels (auto/confirm) for 30+ action types including text, shapes, characters, dialogue, voice, templates, SVG, media, and playback.
  - `src/services/copilot/actionExecutor.ts`: Existing action execution engine.
  - `src/services/copilot/contextBuilder.ts`: Existing project context serializer that feeds the AI model with current project state.
  - `src/stores/useCopilotStore.ts`: Existing store for copilot state and conversation history.
  - `src/components/copilot/CopilotDrawer.tsx`, `CopilotInput.tsx`, `CopilotMessage.tsx`: Existing UI components.
  - Undo/redo via `useTimelineStore` (Zundo temporal middleware).
- **Use cases:**
  1. A non-technical marketing manager creates a product video and says "make the price tag appear right after the product demo ends and add a subtle bounce effect," without needing to understand keyframes or frame numbers.
  2. A content creator iteratively refines a clip by chatting: "make the intro more punchy" -> "add a zoom effect to the first 2 seconds" -> "actually make the zoom faster and add a bass drop sound effect."
  3. A teacher building an educational animation says "highlight the equation when the voiceover mentions 'quadratic formula'" and the system finds the relevant dialogue timestamp and adds a glow effect to the equation text overlay at that moment.
- **Why it matters:** Natural language editing is the defining feature of the next generation of video editors. Cardboard (YC W26) built their entire company around this concept and has shown strong early traction with growth teams. Descript's "Vibe" editing (currently in private beta) allows natural language video editing through a chat interface. Swishy generates motion graphics from plain text in 30 seconds. For ProAnimate, this feature dramatically lowers the barrier to entry, making the full power of the animation engine accessible to users who cannot or do not want to learn traditional timeline editing. It is particularly critical for the orchestrator's target market: small business owners and solo creators who need professional video output without professional video editing skills.
- **Who has it:** Cardboard (Claude Sonnet-powered Director agent; natural language commands like "make the intro more punchy"), Descript (Underlord agentic AI co-editor; "Vibe" editing in private beta), Swishy (natural language to motion graphics in ~30 seconds).
- **Gold standard:** Cardboard implements this best. Founded in 2025 as part of YC W26, Cardboard's entire product is built around natural language video editing. Users upload footage and describe what they want in plain English: "make a 60-second testimonial reel" or "create 3 ad variants from this product demo." The AI handles cutting, transitions, music, and pacing. What makes Cardboard's implementation superior is: (1) it uses Claude Sonnet for deep understanding of creative intent, not just literal command parsing, (2) it handles multi-step creative direction, not just single operations, and (3) it incorporates semantic understanding of footage content for intelligent decision-making. The browser-based collaborative interface makes it practical for teams.

---

### 29. Multi-Face Simultaneous Lip Sync
- **Category:** AI Editing Intelligence
- **What it is:** A system that synchronizes lip animations across multiple character faces in the same scene simultaneously, enabling realistic multi-character dialogue where each character's mouth movements independently match their assigned audio track.
- **What it does:** The system extends ProAnimate's existing lip sync pipeline (which handles one character at a time) to support concurrent lip sync across 2--6 characters in a single scene. Each character is assigned its own dialogue lines with independent ElevenLabs TTS audio, phoneme alignment, and viseme timeline. During playback and export, the system cross-references each character's viseme events against the global frame clock, applying the correct mouth shape to each character independently. It handles overlapping dialogue (two characters speaking at the same time), turn-taking (sequential dialogue), and reaction shots (character B's mouth moves subtly or stays at rest while character A speaks). The system also manages per-character emotion heads that change based on each character's dialogue emotion cues, creating fully independent facial animation for every on-screen character.
- **User flow:**
  1. User adds 2+ characters to the scene via the Dialogue panel or orchestrator.
  2. User assigns dialogue lines to each character with emotion cues (e.g., "[Joy] Great to meet you!" for Character A, "[Surprise] Wait, really?" for Character B).
  3. User generates voices for each dialogue line (each character can have a different ElevenLabs voice).
  4. The system automatically builds independent viseme timelines from each character's phoneme alignment data, resolving frame ranges for each viseme event per character.
  5. During playback, CharacterComposite renders each character's viseme sprite independently based on their individual viseme timeline and the global frame counter.
  6. User previews the multi-character dialogue in real-time with all characters lip-syncing simultaneously.
  7. On export, the Remotion composition renders each character layer with its own viseme and emotion timeline.
- **Properties/Parameters:**
  - `maxSimultaneousCharacters` (number, default 6): Maximum number of characters that can lip sync at the same time.
  - `overlapHandling` (enum: "independent" | "priority" | "ducking", default "independent"): How to handle when multiple characters speak at once. "Independent" renders all simultaneously; "priority" ensures the primary speaker's visemes are more visible; "ducking" reduces non-speaking characters' mouth movement intensity.
  - `reactionMode` (enum: "rest" | "subtle-movement" | "emotion-reactive", default "rest"): What non-speaking characters' mouths do. "Rest" holds the Rest viseme; "subtle-movement" applies very slight random mouth variations; "emotion-reactive" changes the mouth curvature based on the speaking character's emotion.
  - `crossFadeDuration` (number, frames, default 2): Number of frames for cross-fading between viseme sprites on each character (existing CharacterComposite feature).
  - `perCharacterVolume` (Record<string, number>): Volume level for each character's audio track during mixing.
  - `dialogueTimingMode` (enum: "sequential" | "overlapping" | "scripted", default "scripted"): Controls how dialogue lines are scheduled. "Sequential" places lines one after another with gaps; "overlapping" allows natural overlap; "scripted" uses exact start/end frame positions from the dialogue timeline.
- **Output:** A synchronized multi-character scene where each character independently displays the correct viseme, emotion head, and mouth curvature for their assigned dialogue at every frame. Audio is mixed with per-character volume and panning. The result renders correctly in both the canvas preview and Remotion export.
- **Acceptance criteria:**
  - 2--6 characters lip sync simultaneously in real-time preview at 30fps without frame drops on a device with 8GB RAM.
  - Each character's viseme timing is independently accurate to within 1 frame of its phoneme alignment data.
  - Emotion heads change per character based on that character's dialogue emotion cues, not a shared global emotion state.
  - Mouth curvature (upward/neutral/downward) is independently resolved per character based on each character's current emotion.
  - Audio mixing correctly combines multiple character voice tracks with per-character volume.
  - Works with all character types: 4-layer sprite composite, pixel art characters, and avatar characters.
  - Export via both Canvas2D renderer and Remotion produces frame-accurate multi-character lip sync.
  - The orchestrator can generate multi-character dialogue clips with independent lip sync via the existing dialogue setup steps.
  - Turn-taking transitions are smooth: a character's mouth returns to Rest within 2 frames of their dialogue ending.
- **Edge cases:**
  - More than 6 characters: Display a warning and lip sync only the first 6 characters; remaining characters display static poses.
  - Audio generation failure for one character: That character stays at Rest viseme while others continue lip syncing; display an error indicator on the failed character.
  - Dialogue lines with zero duration: Skip viseme generation for that line; log a warning.
  - Characters with incomplete sprite sheets (missing some viseme sprites): Fall back to the nearest available viseme or Rest for missing sprites.
  - Overlapping dialogue where both characters have the same ElevenLabs voice: Allow it but warn the user that it may sound unnatural.
  - Very rapid turn-taking (under 5 frames between speakers): Ensure the outgoing character reaches Rest before the incoming character's first viseme fires, using compressed cross-fade.
- **Dependencies:** Depends on `useMultiCharacterStore` for multi-character state, `lipSync.ts` for phoneme-to-viseme mapping, `elevenlabs.ts` for TTS + alignment, `useDialoguePlayback` hook for synchronized audio playback, `CharacterComposite.tsx` for viseme rendering, `emotionTimeline.ts` for emotion event resolution. Enables richer storytelling in orchestrator-generated clips.
- **Integration with ProAnimate:**
  - `src/stores/useMultiCharacterStore.ts`: Already manages multi-character dialogue state including per-character dialogue lines, timing, and emotion cues. Extend with per-character viseme timeline caching.
  - `src/services/lipSync.ts`: Already implements phoneme-to-viseme conversion (8 visemes: Rest, Aa, Ee, Oh, Oo, FV, MBP, DTL, ChR). Each character gets its own independent viseme event array.
  - `src/components/canvas/CharacterComposite.tsx`: Already supports dual-image cross-fade for smooth viseme transitions on a single character. Extend to manage multiple independent viseme state machines.
  - `src/components/canvas/CharacterLayer.tsx` (MultiCharacterLayer): Already renders multiple characters. Extend to pass per-character viseme events.
  - `src/hooks/useDialoguePlayback.ts`: Already handles multi-character dialogue audio synchronization.
  - `src/services/emotionTimeline.ts`: Already converts script [emotion] cues to frame events. Apply per character independently.
  - `src/remotion/RemotionCharacter.tsx`: Remotion export layer for characters; extend to accept per-character viseme timelines.
  - `src/services/canvas2dRenderer.ts`: Canvas2D export renderer; extend character rendering loop to apply per-character viseme states.
- **Use cases:**
  1. An educator creates a "two experts debate" video where Professor A and Professor B discuss climate change, each with a different voice, expression, and speech cadence, with natural turn-taking and occasional overlapping reactions.
  2. A brand creates a multi-character product skit where a customer asks questions and a brand representative responds, with the customer showing surprise reactions while the representative speaks enthusiastically.
  3. A storyteller creates an animated short with 4 characters in a group conversation, where each character has distinct speaking patterns and emotional responses.
- **Why it matters:** Multi-character dialogue is the primary differentiator between amateur and professional-looking animated content. Most AI animation tools only handle single-character lip sync, forcing creators to composite multiple single-character renders manually. Dzine AI has demonstrated strong market demand by supporting up to 4 simultaneous faces. ProAnimate already has the multi-character infrastructure (stores, dialogue panel, multi-voice TTS); this feature completes the pipeline by ensuring the visual lip sync is truly simultaneous and independent. It directly enables the orchestrator to generate multi-character dialogue clips, which represent the majority of educational, entertainment, and marketing content.
- **Who has it:** Dzine AI (up to 4 simultaneous faces with 95% accuracy, multi-person dialogue generator, supports videos up to 5 minutes).
- **Gold standard:** Dzine AI implements this best with their Multiple Lip Sync AI tool. It detects and synchronizes mouth motion across up to 4 faces in a single image, analyzing audio frequencies and matching lip sync movements with at least 95% accuracy. The system processes phonemes and maps them precisely to mouth movements for each character independently. What makes Dzine's implementation stand out is the support for both turn-taking and overlapping dialogue, the ability to handle characters speaking in different languages (for multilingual content), and the accuracy of timing even in complex multi-speaker scenarios. Their multi-person dialogue generator allows scripting conversations where each character's lines are assigned separately, then rendered with synchronized independent lip sync.

---

### 30. Audio-Reactive Visuals
- **Category:** AI Editing Intelligence
- **What it is:** A real-time system that maps audio frequency, amplitude, and stem data to visual parameters on any canvas element, creating visuals that dynamically respond to the audio track during playback and export.
- **What it does:** The system analyzes audio in real-time using the Web Audio API's AnalyserNode to extract frequency spectrum data, amplitude (RMS energy), and (optionally) per-stem information via audio source separation. These audio features are then mapped to animatable properties on canvas objects: shapes can pulse their scale with the bass, text opacity can flash on snare hits, background colors can shift with melody, character positions can sway with the rhythm, and gradient colors can morph with harmonic changes. Unlike beat detection (which pre-computes beat positions and bakes keyframes), audio-reactive visuals are continuously driven in real-time, producing fluid, organic animations that follow the exact contour of the audio waveform. The system provides a visual node-mapping interface where users connect audio analysis outputs (bass energy, treble energy, mid-range, overall amplitude, onset detection) to visual property inputs on any canvas object.
- **User flow:**
  1. User adds an audio source to the project (music track, sound effects, or generated background music).
  2. User selects a canvas object (shape, text overlay, media item, or background).
  3. User opens the "Audio Reactive" panel from the object's properties.
  4. The system shows available audio channels (full spectrum, bass, mids, treble, amplitude, onsets).
  5. User creates a mapping: e.g., "Bass Energy -> Shape Scale" with a range of 1.0 to 1.5 and a smoothing factor.
  6. User adds additional mappings: "Treble Energy -> Text Opacity" with range 0.5 to 1.0.
  7. During playback, the canvas objects animate in real-time according to the audio signal.
  8. On export, the Remotion composition pre-processes the audio analysis and bakes the reactive values into per-frame properties.
- **Properties/Parameters:**
  - `audioSource` (string): ID of the audio asset driving the reactivity.
  - `fftSize` (number, default 2048): FFT window size for frequency analysis; larger values provide finer frequency resolution.
  - `smoothingTimeConstant` (number, 0.0--1.0, default 0.8): Smoothing applied to the frequency data; higher values create smoother, more gradual reactions.
  - `frequencyBands` (object): Configurable frequency band definitions:
    - `sub` (20--60 Hz): Sub-bass
    - `bass` (60--250 Hz): Bass
    - `lowMid` (250--500 Hz): Low midrange
    - `mid` (500--2000 Hz): Midrange
    - `highMid` (2000--4000 Hz): Upper midrange
    - `treble` (4000--20000 Hz): Treble
  - `mappings` (AudioReactiveMapping[]): Array of source-to-target mappings, each containing:
    - `sourceType` (enum: "amplitude" | "bass" | "mid" | "treble" | "sub" | "frequency-band" | "onset"): Audio feature.
    - `targetObjectRef` (CanvasObjectRef): The canvas object to drive.
    - `targetProperty` (string): The property to modulate (scale, opacity, rotation, x, y, fill, strokeWidth).
    - `minValue` (number): Output value when audio feature is at minimum.
    - `maxValue` (number): Output value when audio feature is at maximum.
    - `smoothing` (number, 0.0--1.0, default 0.5): Per-mapping smoothing override.
    - `threshold` (number, 0.0--1.0, default 0.0): Minimum audio level before the mapping activates.
    - `invert` (boolean, default false): Invert the mapping (high audio = low visual value).
- **Output:** Canvas objects that animate fluidly in response to the audio signal during real-time playback. On export, the audio analysis is pre-computed and applied as per-frame property values baked into the Remotion composition.
- **Acceptance criteria:**
  - Audio analysis runs in real-time at 60fps without audio glitches or visual stutter.
  - At least 10 simultaneous audio-reactive mappings can run without performance degradation.
  - Frequency band separation produces visually distinct responses for bass vs. treble content.
  - Exported videos match the real-time preview appearance (no drift between preview and export).
  - Smoothing controls produce visually smooth transitions without lag or jitter.
  - Works with all canvas object types: shapes, text overlays, media items, SVG objects, characters, and HTML template layers.
  - Supports numeric properties (scale, opacity, rotation, position) and color properties (hue shift).
  - The mapping interface provides a real-time visualization of the audio analysis (spectrum bars, amplitude meter) alongside the property mapping controls.
  - Users can save and load audio-reactive presets (e.g., "Bass Pulse," "Full Spectrum Rainbow," "Beat Bounce").
- **Edge cases:**
  - No audio in project: Disable the audio-reactive panel and show a message prompting the user to add audio.
  - Audio source removed while mappings exist: Pause all reactive mappings and display a "missing audio source" warning; do not crash.
  - Export to formats without audio (GIF): Bake the audio analysis into keyframes at export time so the visual animation still plays.
  - Extremely loud or clipping audio: Normalize the analysis output to 0--1 range regardless of input amplitude.
  - Multiple audio sources: Allow the user to select which audio source drives the reactivity; support different objects reacting to different audio sources.
  - Very low-frequency content (sub-bass below 40Hz): These frequencies produce slow oscillations; ensure smoothing handles them without appearing "stuck."
- **Dependencies:** Depends on Web Audio API (`AudioContext`, `AnalyserNode`, `getFrequencyData`), `useKeyframeStore` for baking reactive data on export, all canvas object stores for property manipulation, the audio mixing system in `videoExport.ts` for export-time audio analysis. Synergizes with Beat Detection & Audio Sync (feature 18) for comprehensive audio-visual integration.
- **Integration with ProAnimate:**
  - `src/services/musicAnalyzer.ts`: Already analyzes dialogue mood for music generation. Extend with real-time frequency band extraction and amplitude tracking.
  - `src/services/beatDetection.ts`: Already implements spectral flux analysis. Share the FFT pipeline with audio-reactive analysis for efficiency.
  - `src/engine/beatSync.ts`: Complementary feature; beat sync pre-bakes keyframes while audio-reactive provides continuous modulation. They can work together.
  - `src/stores/useMediaStore.ts`: Media assets include audio files; extend to track which audio asset is the "reactive source."
  - `src/components/canvas/VideoCanvas.tsx`: The main compositor; add a pre-render pass that reads audio analysis data and applies reactive property overrides before each layer draws.
  - `src/services/videoExport.ts`: Export pipeline; add an audio analysis pre-processing step that bakes reactive values into frame data for offline rendering.
  - `src/services/canvas2dRenderer.ts`: Canvas2D renderer; apply audio-reactive property overrides per frame.
  - `src/remotion/VideoComposition.tsx`: Remotion composition; pass baked audio analysis data as frame-indexed arrays to each layer.
- **Use cases:**
  1. A musician creates a music video where background shapes pulse with the bass, text shimmers with hi-hats, and the character sways gently with the melody.
  2. A podcast creator adds visual flair to audiogram clips where waveform-style shapes react to the speaker's volume, creating engaging visual content for social media.
  3. A DJ creates promotional content where AI-generated visuals morph and shift in response to a mix, with different visual elements responding to different instruments.
- **Why it matters:** Audio-reactive visuals are the core value proposition of AI music video generators like Neural Frames and Kaiber, which together serve hundreds of thousands of musicians. The feature transforms static animations into living, breathing compositions that feel professionally produced. For ProAnimate, it opens the music video creator market and enhances every orchestrator-generated clip that includes background music. It is particularly valuable for social media content where audio-visual synchronization directly correlates with watch time and engagement metrics.
- **Who has it:** Neural Frames (8-stem audio extraction with per-instrument visual triggers, autopilot mode), Kaiber Superstudio (audio-reactive visual generation), CapCut (audio spectrum visualizer), Beatflyer (automatic animation sync to beats, bass, and melody).
- **Gold standard:** Neural Frames sets the standard with their 8-stem audio extraction system. Their proprietary analysis extracts 8 different stems (kick, snare, hi-hats, bass, vocals, melody, harmony, percussion) and allows users to connect any visual parameter to any stem. The system provides three creation modes: Autopilot (automatic song-to-video), Frame-by-Frame Editor (per-frame control), and Text-to-Video Editor (timeline-based with multiple AI models). What makes their implementation exceptional is the combination of deep audio analysis with AI-generated visuals: every time a significant audio event occurs (a snare hit, a bass drop, a vocal entrance), the system signals the visual generator to change imagery at that moment, creating videos where the visuals feel intrinsically connected to the music rather than simply overlaid.

---

### 31. Webcam Puppeteering / Motion Capture
- **Category:** AI Editing Intelligence
- **What it is:** A real-time system that captures the user's body movements, facial expressions, and hand gestures through a webcam and maps them to 2D or 3D character animations, enabling live puppeteering and recorded motion capture without specialized hardware.
- **What it does:** Using MediaPipe Pose (33 body landmarks), MediaPipe Face Mesh (468 facial landmarks), and MediaPipe Hands (21 hand landmarks per hand), the system extracts the user's skeletal pose, facial expressions, and hand positions from a standard webcam feed at 30fps. These landmarks are converted into bone rotations compatible with ProAnimate's `BonePose3D` format and mapped to the character's skeleton via the existing bone mapping system (supporting Mixamo, RPM, SMPL, HunyuanMotion, biped, and custom skeletons). The system operates in two modes: (1) Live mode for real-time streaming/VTubing where character movements mirror the user with minimal latency, and (2) Record mode where the captured motion is saved as a `THREE.AnimationClip` that can be applied to any character, edited on the timeline, and exported. Facial landmarks drive emotion head selection and viseme mapping for facial animation, while body landmarks drive skeletal pose.
- **User flow:**
  1. User navigates to the Motion Capture panel (left panel tab: "motion-capture").
  2. User grants webcam access when prompted by the browser.
  3. A live webcam preview appears with a skeleton overlay showing detected landmarks.
  4. User selects a target character (2D rigged, 3D, or sprite-based) from the character list.
  5. If the character's bone mapping is incomplete, the system auto-maps using the existing bone mapping logic and highlights any unmapped bones.
  6. User chooses a mode: "Live" for real-time puppeteering or "Record" for recording a motion clip.
  7. In Live mode, the character mirrors the user's movements in real-time on the canvas. In Record mode, the user presses Record, performs their motion, and presses Stop.
  8. Recorded motion is saved as an animation clip in the 3D animation library and placed on the timeline. The user can trim, loop, or retarget the clip to other characters.
- **Properties/Parameters:**
  - `captureMode` (enum: "live" | "record", default "record"): Whether to stream in real-time or record for later use.
  - `trackingTargets` (enum[]: ["body", "face", "hands"], default ["body", "face"]): Which landmark systems to enable.
  - `smoothing` (number, 0.0--1.0, default 0.6): Temporal smoothing applied to landmark positions to reduce jitter.
  - `mirrorMode` (boolean, default true): Whether to mirror the webcam input horizontally (natural for user-facing webcams).
  - `confidenceThreshold` (number, 0.0--1.0, default 0.5): Minimum landmark detection confidence; landmarks below this threshold are interpolated from the previous frame.
  - `fps` (number, default 30): Capture frame rate.
  - `facialExpressionMapping` (boolean, default true): Whether facial landmarks drive emotion head and viseme selection.
  - `bodyScaleNormalization` (boolean, default true): Normalize the user's body proportions to match the character's skeleton proportions.
  - `latencyTarget` (number, ms, default 50): Target latency for live mode; trades accuracy for speed.
- **Output:** In Record mode, a `THREE.AnimationClip` containing bone rotation keyframes for all tracked bones at the capture FPS, plus a parallel emotion/viseme timeline derived from facial tracking. In Live mode, continuous real-time updates to the character's pose on the canvas.
- **Acceptance criteria:**
  - Webcam capture and landmark extraction runs at 30fps with under 100ms end-to-end latency on a device with a modern GPU.
  - Body pose tracking accurately captures arm raises, turns, leans, and walking-in-place movements.
  - Facial expression tracking detects at least 6 emotion categories (joy, sadness, anger, surprise, fear, neutral) and maps to the correct emotion head.
  - Mouth tracking detects open/closed and lip shape to drive basic viseme selection during puppeteering.
  - Recorded motion clips can be retargeted to any character using the existing `skeletonRetarget.ts` system.
  - Recorded clips appear in the 3D animation library and can be placed on the timeline like any other animation.
  - Skeleton overlay on the webcam preview correctly shows all 33 MediaPipe landmarks.
  - Works with 2D rigged characters (mapped to bone skeleton) and 3D characters (mapped via BoneMapping).
  - Smoothing eliminates visible jitter without introducing perceptible lag.
  - Camera permission denial is handled gracefully with a clear error message and instructions.
- **Edge cases:**
  - Poor lighting conditions: MediaPipe confidence scores drop; the system interpolates from the last good frame and displays a "low confidence" warning.
  - Partial body visibility (user too close to camera): Track only visible landmarks; hold the last known pose for occluded bones.
  - Multiple people in frame: Use only the most prominent (largest) detected person; warn the user if multiple people are detected.
  - Fast movements causing motion blur: Increase the confidence threshold temporarily and rely more heavily on temporal smoothing.
  - Character with fewer bones than MediaPipe landmarks: Map only the bones that exist in the character's skeleton; ignore extra landmark data.
  - Browser lacks WebRTC/camera support: Display an error message; suggest using a supported browser (Chrome, Edge, Firefox).
  - Recording very long sessions (5+ minutes): Implement streaming-to-disk to prevent memory issues; warn at 3 minutes.
- **Dependencies:** Depends on MediaPipe Pose/Face/Hands (WASM), browser WebRTC API for webcam access, `src/services/motionCapture.ts` (already exists) for landmark-to-bone-rotation conversion, `src/types/rig3d.ts` for `BonePose3D`/`Quat`/`Vec3` types, `skeletonRetarget.ts` for cross-skeleton retargeting, `use3DAnimationStore.ts` for saving recorded clips. Enables feature 32 (Motion Transfer from Reference Video) as a companion input method.
- **Integration with ProAnimate:**
  - `src/services/motionCapture.ts`: Already implements MediaPipe Pose extraction (33 landmarks), landmark-to-`StandardBoneName` mapping, and conversion to bone rotations. Extend with facial expression detection and hand tracking.
  - `src/hooks/useMotionCapture.ts`: Existing hook for managing webcam capture lifecycle.
  - `src/stores/useMotionCaptureStore.ts`: Existing store for motion capture state (recording status, captured frames, target character).
  - `src/components/panels/MotionCapturePanel.tsx`: Existing panel UI for motion capture controls.
  - `src/components/canvas/FaceLandmarkOverlay.tsx`: Existing overlay for face landmark visualization.
  - `src/types/character3d.ts`: `BoneMapping`, `StandardBoneName` types for skeleton mapping.
  - `src/services/skeletonRetarget.ts`: Cross-skeleton animation retargeting for applying captured motion to different character rigs.
  - `src/stores/use3DAnimationStore.ts`: Animation clip library for storing recorded motions.
  - `src/services/poseInterpolation3d.ts`: Quaternion SLERP for smoothing captured bone rotations.
- **Use cases:**
  1. A solo content creator records themselves acting out a scene via webcam, then applies the captured motion to their cartoon character for a TikTok video, achieving professional-looking character animation without any animation skills.
  2. A VTuber uses live mode to puppet their ProAnimate character during a livestream, with the character's expressions and body movements mirroring theirs in real-time.
  3. An educator records hand gesture demonstrations (pointing, counting, waving) and retargets them to an animated teacher character for engaging educational content.
- **Why it matters:** Webcam-based motion capture democratizes character animation, a process that historically required expensive motion capture suits or skilled animators. Viggle AI (2.3M+ animations, backed by a proprietary JST-1 foundation model) has gone viral specifically because of webcam-to-character motion transfer. Runway's Act-Two captures full-body performance, facial expressions, and hand gestures from just a webcam. ProAnimate already has the infrastructure (MediaPipe integration, bone mapping, skeleton retargeting) and just needs to complete the real-time puppeteering loop and facial expression mapping. This feature targets VTubers, solo content creators, and educators who want expressive character animation without animation expertise.
- **Who has it:** Viggle AI (Viggle LIVE for real-time webcam puppeteering, JST-1 foundation model with deep 3D spatial understanding), Runway Act-Two (webcam-to-character mocap for full body, face, and hands), various VTubing software (VTube Studio, Live2D Cubism with webcam tracking).
- **Gold standard:** Viggle AI implements this best with their Viggle LIVE feature. Built on their JST-1 foundation model (which has deep understanding of 3D space and physical movement), Viggle LIVE enables real-time webcam-to-character motion transfer with natural-looking results. Users activate their webcam, select any character image, and the system maps their movements to the character with a 1--2 second delay for processing. The key differentiators are: (1) the JST-1 model understands physical plausibility, so character movements look natural even when the user's proportions differ significantly from the character, (2) it works with any static character image, not just pre-rigged models, and (3) the live mode is optimized for streaming/VTubing with consistent frame timing.

---

### 32. Motion Transfer from Reference Video
- **Category:** AI Editing Intelligence
- **What it is:** A system that extracts human motion (body poses, gestures, locomotion) from a reference video clip and applies that extracted motion to a ProAnimate character, enabling users to copy any movement they find in existing video content.
- **What it does:** The user provides a reference video containing a person performing a desired motion (a dance, a walk cycle, a gesture, a sports move). The system processes the video frame-by-frame using MediaPipe Pose to extract 33 3D skeletal landmarks per frame. These landmarks are converted into bone rotation keyframes using the existing `motionCapture.ts` pipeline, producing a `THREE.AnimationClip`. The clip is then retargeted onto the user's chosen character via `skeletonRetarget.ts`, adjusting for differences in body proportions, skeleton hierarchy, and bone naming conventions. The result is the character performing the same motion as the person in the reference video, which can then be placed on the timeline, trimmed, looped, speed-adjusted, or blended with other animations.
- **User flow:**
  1. User navigates to the Motion Capture panel and selects the "From Video" tab.
  2. User uploads a reference video file (MP4, WebM) or pastes a URL to a video.
  3. The system shows a preview of the reference video with a skeleton overlay to confirm pose detection quality.
  4. User selects the target character from the character list.
  5. User clicks "Extract Motion." A progress bar shows frame-by-frame extraction progress.
  6. Once extraction completes, the system shows a side-by-side preview: reference video on the left, character performing the extracted motion on the right.
  7. User adjusts settings (speed, trim start/end, loop, smoothing) and confirms.
  8. The motion clip is saved to the animation library and placed on the character's timeline track.
- **Properties/Parameters:**
  - `referenceSource` (File | URL): The video to extract motion from.
  - `extractionFPS` (number, default 30): Frame rate for pose extraction; lower values speed up processing.
  - `trimRange` ([number, number] | null): Start/end time in seconds to extract only a portion of the reference video.
  - `speedMultiplier` (number, default 1.0): Speed adjustment applied to the extracted motion (0.25x--4.0x).
  - `smoothing` (number, 0.0--1.0, default 0.5): Temporal smoothing to reduce jitter in extracted poses.
  - `loopMode` (enum: "none" | "loop" | "ping-pong", default "none"): Whether the extracted motion loops.
  - `targetCharacterId` (string): ID of the character to receive the motion.
  - `retargetingMode` (enum: "auto" | "manual", default "auto"): Auto uses heuristic bone mapping; manual allows the user to specify per-bone mappings.
  - `groundContact` (boolean, default true): Keep the character's feet on the ground plane, preventing floating.
  - `hipCentering` (boolean, default true): Normalize hip position to the character's origin to prevent drift.
- **Output:** A `THREE.AnimationClip` containing per-bone rotation and optional position keyframes at the specified FPS, stored in `use3DAnimationStore`. The clip is pre-retargeted to the target character's skeleton and ready for timeline placement.
- **Acceptance criteria:**
  - Extraction processes at least 10 frames per second on a mid-range device (i.e., a 10-second clip at 30fps processes in under 30 seconds).
  - Extracted poses are recognizably the same motion as the reference video when applied to the character.
  - Retargeting handles at least the standard bone mapping sets: Mixamo, RPM, SMPL, HunyuanMotion, biped.
  - Smoothing eliminates jitter without removing intentional fast movements.
  - The side-by-side preview plays at the correct speed and is frame-synchronized.
  - Extracted clips work with both 2D rigged characters and 3D characters.
  - Ground contact correction prevents the character from floating above or sinking below the ground plane.
  - Large reference videos (60+ seconds) are processed in chunks to prevent memory overflow.
  - The system handles reference videos where the subject is partially occluded for some frames by interpolating missing landmarks.
- **Edge cases:**
  - Reference video with no detectable person: Display an error after initial analysis and suggest a different video.
  - Reference video with multiple people: Allow the user to select which person to track (by clicking on one in the first frame); default to the most prominent person.
  - Reference video with very fast motion (dance, martial arts): Use maximum extraction FPS and reduce smoothing to preserve fast movements; warn that some frames may have lower confidence.
  - Reference video shot from behind or at extreme angles: MediaPipe may have reduced accuracy; warn the user and show per-frame confidence scores.
  - Very short reference video (under 1 second): Extract but warn that the clip may be too short for meaningful use; suggest looping.
  - Reference video with cuts/edits: Detect scene changes and split extraction into separate clips per scene.
  - Character skeleton has significantly different proportions than the reference person: Retargeting normalizes proportions, but warn that extreme mismatches (e.g., quadruped character from human reference) will produce poor results.
- **Dependencies:** Depends on `src/services/motionCapture.ts` for MediaPipe pose extraction, `src/services/skeletonRetarget.ts` for cross-skeleton retargeting, `use3DAnimationStore.ts` for clip storage, video decoding via HTML5 Video element or VideoFrame API. Complements feature 31 (Webcam Puppeteering) as an asynchronous input method.
- **Integration with ProAnimate:**
  - `src/services/motionCapture.ts`: Already has the full landmark extraction and bone rotation conversion pipeline. Extend with a `processVideoFile()` method that iterates through video frames.
  - `src/hooks/useMotionCapture.ts`: Extend to support video file input in addition to webcam stream.
  - `src/stores/useMotionCaptureStore.ts`: Add state for video extraction progress, trim controls, and preview.
  - `src/components/panels/MotionCapturePanel.tsx`: Add a "From Video" tab alongside the webcam tab.
  - `src/services/skeletonRetarget.ts`: Already handles cross-skeleton animation retargeting.
  - `src/stores/use3DAnimationStore.ts`: Store for saving extracted motion clips.
  - `src/services/poseInterpolation3d.ts`: Used for smoothing extracted bone rotations.
  - `src/types/character3d.ts`: `BoneMapping`, `StandardBoneName` for skeleton compatibility.
- **Use cases:**
  1. A content creator finds a trending TikTok dance and extracts the motion, then applies it to their brand's cartoon mascot character for a viral social media post.
  2. An animator references a specific acting performance from a movie clip, extracts the body language, and applies it to a 3D character for an animated short.
  3. An educator records themselves performing sign language gestures on their phone, uploads the video, and transfers the gestures to an animated character for an accessible educational video.
- **Why it matters:** Motion transfer from reference video is the feature that made Viggle AI go viral, with over 2.3 million animations generated. The ability to take any existing video and transfer its motion to a custom character eliminates the need for animation skill entirely. It turns the entire internet's video content into a motion library. For ProAnimate, this bridges the gap between the AI orchestrator (which generates static or template-based character positions) and truly dynamic, expressive character animation. Combined with the existing skeleton retargeting system, it enables a workflow where users can find reference motion anywhere and apply it to any character in seconds.
- **Who has it:** Viggle AI (upload image + reference video, "Viggle This!" to generate, built on JST-1 foundation model), Runway (motion reference in Gen-4), various academic tools (MotionBERT, MotionDiffuse).
- **Gold standard:** Viggle AI is the clear leader. Users upload a character image and a reference video, and Viggle's JST-1 model accurately deconstructs the complex movements from the source video and applies them to the character's geometry. The system understands 3D spatial relationships, so transferred motion looks physically plausible even when the character's body type differs significantly from the reference person. Viggle has generated over 2.3 million animations and become a cultural phenomenon for meme creation. The key technical advantages are: (1) the foundation model approach (vs. pure MediaPipe landmark extraction) captures motion nuance and intent, not just joint positions, (2) it handles occlusion, fast motion, and unusual camera angles better than landmark-only approaches, and (3) it works with any static image, automatically inferring a 3D character model from a 2D image.

---

### 38. A/B Testing of Video Variations
- **Category:** AI Editing Intelligence
- **What it is:** A system that automatically generates multiple variations of a video project and provides a structured framework for comparing, scoring, and selecting the best-performing version based on predefined criteria or live performance data.
- **What it does:** The system takes an existing video project and generates N variations by modifying configurable parameters: different hooks (opening text/visuals), different CTAs, different background music, different character expressions, different pacing (faster/slower), different color schemes, different voice styles, or different dialogue scripts. Each variation is generated using the AI orchestrator with controlled parameter changes, then rendered as a preview. The user can compare variations side-by-side in a grid view, rate them manually, or (for published content) connect performance analytics to track which variation performs best. The system also supports automated variant generation where the AI suggests which parameters to vary based on the content type and target platform (e.g., for TikTok ads, vary the hook and CTA; for educational content, vary the pacing and voice).
- **User flow:**
  1. User creates a base video project (either manually or via the orchestrator).
  2. User clicks "Create Variations" from the dashboard or project menu.
  3. A variation builder modal appears showing the base project with toggles for which elements to vary: Hook, CTA, Music, Pacing, Colors, Voice, Script.
  4. User selects which elements to vary and how many variations to generate (2--10, default 3).
  5. For each element, the user can specify variation parameters (e.g., "Hook: dramatic question / bold statement / statistic") or let the AI suggest variations.
  6. The system generates all variations using the orchestrator, showing progress for each.
  7. Once generated, a comparison view shows all variations in a grid with thumbnail previews and playback controls.
  8. User can play each variation, rate them (star rating or thumbs up/down), add notes, and select a winner.
  9. Optionally, the user exports multiple variations and publishes them to different platforms for real-world A/B testing.
- **Properties/Parameters:**
  - `baseProjectId` (string): The source project to create variations from.
  - `variationCount` (number, 2--10, default 3): Number of variations to generate.
  - `variationAxes` (enum[]): Which elements to vary:
    - `hook`: The opening 2--3 seconds (text, visuals, pacing).
    - `cta`: Call-to-action text, position, and timing.
    - `music`: Background music style/mood.
    - `pacing`: Overall speed and timing of cuts/transitions.
    - `colorScheme`: Color palette and visual tone.
    - `voice`: TTS voice selection and speaking style.
    - `script`: Dialogue script variations (rephrasings, different hooks).
    - `character`: Character appearance or expression style.
  - `targetPlatform` (enum: "tiktok" | "youtube-shorts" | "reels" | "linkedin" | "generic", default "generic"): Platform-specific optimization hints.
  - `aiSuggestVariations` (boolean, default true): Let the AI suggest which parameters to vary and how.
  - `comparisonLayout` (enum: "grid" | "side-by-side" | "carousel", default "grid"): How variations are displayed for comparison.
  - `scoringCriteria` (string[]): Custom criteria for rating variations (e.g., "hook strength", "clarity", "engagement potential").
- **Output:** N rendered video variations, each stored as a separate project snapshot with a shared parent reference. A comparison dashboard showing all variations with playback, ratings, notes, and an optional analytics integration for tracking real-world performance.
- **Acceptance criteria:**
  - Generates 3 video variations from a base project in under 5 minutes (for a 30-second clip).
  - Each variation is recognizably different in the selected variation axes while maintaining overall project coherence.
  - Comparison grid displays all variations simultaneously with synchronized playback controls (play all at once or individually).
  - Rating system persists across sessions and associates ratings with variation IDs.
  - Variations maintain the base project's aspect ratio, duration, and character lineup.
  - AI-suggested variations are contextually appropriate (e.g., for a cooking video, it varies the hook text and background music, not the character's expression).
  - Each variation can be independently exported or published.
  - Variation history is saved so users can return to compare later.
  - Works with orchestrator-generated projects and manually created projects.
- **Edge cases:**
  - Base project is incomplete (missing voices, no audio): Generate variations only for elements that are present; warn about incomplete elements.
  - User requests 10 variations but only 3 meaningful axes are selected: Each axis gets 3--4 sub-variations; inform the user that some variations may be similar.
  - AI-generated script variations produce dialogue with different lengths: Adjust timing automatically to accommodate different script lengths; warn if a variation exceeds the target duration.
  - Variation generation fails for one variant (e.g., API error during voice generation): Continue generating other variants; mark the failed one as "error" with a retry option.
  - Very long base project (60+ seconds): Warn that variation generation will take proportionally longer; allow background generation with notification on completion.
  - User wants to merge elements from different variations: Support a "cherry-pick" mode where the user can select the hook from variation A, the CTA from variation B, and the music from variation C.
- **Dependencies:** Depends on the AI orchestrator (`src/services/orchestrator.ts`) for generating variations, `useProjectStore.ts` for project management, the Gemini API for AI-suggested variations, and optionally the social publishing system for real-world A/B testing. Enables data-driven content optimization workflows.
- **Integration with ProAnimate:**
  - `src/services/orchestrator.ts`: The orchestrator generates clips from prompts. Extend to accept a "base project + variation parameters" input that produces variations by modifying specific pipeline steps.
  - `src/stores/useOrchestratorStore.ts`: Add state for batch variation generation, progress tracking per variant, and comparison mode.
  - `src/stores/useProjectStore.ts`: Projects are already managed with Supabase persistence. Extend with variation group references (parent project ID, variation axis metadata).
  - `src/services/projectService.ts`: Extend with `createVariation(baseProjectId, variationParams)` and `getVariationGroup(parentId)` methods.
  - `src/components/dashboard/DashboardPage.tsx`: Add a variation comparison view accessible from the dashboard.
  - `src/services/gemini.ts`: Use Gemini to generate variation suggestions (alternative hooks, CTA rewrites, pacing recommendations).
  - `src/services/elevenlabs.ts`: Generate voice variants with different voices or speaking styles.
  - Existing analytics system (`useAnalyticsStore.ts`, `analyticsService.ts`): Connect to track real-world performance of published variations.
- **Use cases:**
  1. A DTC brand creates 5 variations of a product ad, each with a different opening hook ("Did you know...", "Stop scrolling!", "I tested 100 products and...", a bold visual, a customer quote), exports all 5, and runs them as a Meta ad split test to find the highest-converting creative.
  2. An educational content creator generates 3 pacing variants of an explainer video (fast/medium/slow) to test which retention curve works best for their YouTube Shorts audience.
  3. A social media agency uses AI-suggested variations to rapidly produce 10 variants of a client's campaign video, each optimized for a different platform (TikTok, Reels, LinkedIn), and presents them to the client in a comparison grid for approval.
- **Why it matters:** Creative testing at scale is a major pain point in digital advertising. Brands spend thousands of dollars producing a single video ad, then discover it underperforms because the hook was wrong or the CTA was weak. Creatify has raised $15.5M specifically for AI-powered ad variation generation and testing. Their batch mode allows creating 10+ ad creatives in a single session. Argil AI offers instant variation creation and testing. For ProAnimate, A/B testing transforms the product from a creative tool into a performance marketing platform, opening revenue from the $500B+ digital advertising market. The feature increases per-user engagement (users create 3--10x more content) and directly drives the upgrade path from free to paid tiers.
- **Who has it:** Creatify (Batch Mode for 10+ variations, AdMax for automated A/B testing with Meta performance data), Argil AI (instant video variation creation and testing), Cardboard (multiple variant generation from prompts).
- **Gold standard:** Creatify implements this best with their Batch Mode and AdMax agent. Batch Mode allows creating multiple video ad variations simultaneously by varying scripts, avatars, backgrounds, animations, emotions, b-roll, and every other element. Users can test 10+ ad creatives in a single session. The AdMax agent goes further by managing the entire ad lifecycle: it conceives variations, generates them at scale, runs A/B tests, and analyzes performance data from Meta. The key innovation is the closed-loop feedback: AdMax does not just generate variations -- it learns from real-world performance data which hooks, CTAs, and visual styles work best for a specific product category, then uses those insights to generate better variants in the next iteration. This transforms video creation from a creative exercise into a data-driven optimization process.

---

## Category 4: Animation Engine

### 13. Shape Morphing
- **Category:** Animation Engine
- **What it is:** A system that smoothly interpolates between two arbitrary shapes (paths) over a specified duration, producing intermediate frames where one shape fluidly transforms into another.
- **What it does:** The system takes two shape definitions (SVG paths, geometric primitives, or text outlines) and computes a smooth interpolation between them at every frame during the transition. It handles the core challenge of shape morphing: the two shapes may have different numbers of path points, different winding directions, and different structural complexity. The system normalizes both shapes to a common representation (cubic bezier paths with matched point counts), computes the optimal point correspondence (minimizing visual distortion), and then interpolates each point's position between the source and target. The result is a fluid animation where circles become stars, text becomes icons, rectangles become organic blobs, and any shape transforms into any other shape.
- **User flow:**
  1. User selects a shape on the canvas (e.g., a circle).
  2. User opens the shape properties panel and navigates to the "Morph" tab.
  3. User selects or creates the target shape (e.g., a star) from the shape library or by drawing a custom path.
  4. The system shows a live preview of the morph animation between the two shapes.
  5. User sets the morph duration (in frames), easing type, and start frame on the timeline.
  6. User can adjust the morph quality (path segment density) and optionally pin specific points to control the morph path.
  7. The morph animation renders as a series of intermediate SVG paths during playback and export.
- **Properties/Parameters:**
  - `sourceShape` (SVGPath | ShapeType): The starting shape definition.
  - `targetShape` (SVGPath | ShapeType): The ending shape definition.
  - `startFrame` (number): Frame at which the morph begins.
  - `duration` (number, frames): How many frames the morph takes.
  - `easing` (EasingType, default "ease-in-out"): Easing applied to the morph progress (t parameter).
  - `maxSegmentLength` (number, default 10): Maximum pixel length of path segments after subdivision; smaller values produce smoother morphs but require more computation.
  - `rotateAlignment` (boolean, default true): Rotate the target shape's starting point to minimize total point travel distance.
  - `windingMatch` (boolean, default true): Ensure both shapes have the same winding direction (CW or CCW) to prevent inside-out morphing.
  - `morphQuality` (enum: "low" | "medium" | "high", default "medium"): Controls the density of interpolation points. Low = 50 points, medium = 200, high = 500.
  - `fillInterpolation` (enum: "linear-rgb" | "hsl" | "oklch", default "oklch"): How fill colors are interpolated if the two shapes have different fills.
  - `strokeInterpolation` (boolean, default true): Whether stroke properties (width, color) are also interpolated during the morph.
  - `intermediateShapes` (SVGPath[] | null): Optional waypoint shapes for multi-step morphing (A -> B -> C).
- **Output:** A function `getMorphedPath(t: number): string` that returns the SVG path `d` attribute for any interpolation parameter t (0 to 1), plus interpolated fill, stroke, and opacity values. The system generates one interpolated path per frame for rendering.
- **Acceptance criteria:**
  - Morphs between any two closed SVG paths produce visually smooth animations without path self-intersection.
  - Morphing between ProAnimate's built-in shapes (rectangle, circle, triangle, star) produces clean, aesthetically pleasing transitions.
  - Text characters can be converted to paths and morphed (e.g., the letter "A" morphs into a heart icon).
  - Morphs with different point counts produce even interpolation (no bunching or stretching at specific locations).
  - The easing system integrates with the existing `interpolation.ts` easing functions and custom cubic bezier curves.
  - Performance: real-time preview at 30fps for morphs with up to 500 interpolation points.
  - Export via Canvas2D renderer and Remotion produces frame-accurate morph animations.
  - Multi-step morphing (A -> B -> C) chains smoothly with configurable hold duration at each intermediate shape.
  - Fill and stroke color interpolation produces natural-looking color transitions.
- **Edge cases:**
  - Open paths (lines, arcs) vs. closed paths (shapes): Auto-close open paths by connecting endpoints before morphing; warn the user.
  - Complex paths with holes (compound paths like the letter "O"): Morph each sub-path independently; if the target has a different number of sub-paths, fade inner paths in/out.
  - Extremely different shapes (a simple circle to a complex 50-point star): Increase the interpolation point count to prevent visual artifacts; use the high quality setting.
  - Source and target shapes with vastly different sizes: Normalize sizes to the source shape's bounding box before morphing; apply separate scale animation if size change is desired.
  - Zero-area shapes (a line morphing to a circle): Expand the line to a thin rectangle first, then morph to the target.
  - Self-intersecting target paths: Warn the user that the morph may produce unexpected results; suggest simplifying the path.
- **Dependencies:** Depends on SVG path parsing/manipulation (can use a library like Flubber or implement cubic bezier subdivision), `src/services/interpolation.ts` for easing functions, `useShapeStore.ts` for shape management, `useKeyframeStore.ts` for morph keyframes on the timeline. Enables more expressive motion graphics and text animations.
- **Integration with ProAnimate:**
  - `src/stores/useShapeStore.ts`: Currently supports rectangle, circle, triangle, star. Extend `CanvasShape` with an optional `svgPath` field and a `morphTarget` reference.
  - `src/types/shapes.ts`: Add `svgPath?: string`, `morphTargetId?: string`, `morphDuration?: number`, `morphEasing?: EasingType` to `CanvasShape`.
  - `src/services/interpolation.ts`: Already has `lerp`, `lerpAngle`, `applyEasing`, and cubic bezier evaluation. Morph uses `applyEasing` for the global progress parameter.
  - `src/engine/easing.ts`: Full easing library with spring, elastic, bounce, etc. All available for morph timing.
  - `src/components/canvas/ShapeLayer.tsx`: Extend to render SVG paths (currently only renders geometric primitives) and apply morph interpolation per frame.
  - `src/remotion/RemotionShapeLayer.tsx`: Extend Remotion export to render morphing shapes.
  - `src/services/canvas2dRenderer.ts`: Extend shape rendering to handle SVG paths and per-frame morph computation.
  - `src/services/svgObjectAnimation.ts`: SVG object system already handles SVG paths; reuse path parsing logic.
- **Use cases:**
  1. A brand video morphs the company logo (an abstract shape) into a product icon during the transition between sections, creating a polished, professional visual effect.
  2. An educational video morphs a square into a circle while explaining geometry concepts, with the morph synchronized to the narration timing.
  3. A social media intro animation morphs text ("HELLO") into a wave emoji shape, creating a playful, eye-catching opening.
- **Why it matters:** Shape morphing is a signature motion design technique that instantly elevates production quality. Jitter includes it as a key feature, specifically calling out smooth transitions between any two shapes including text. GSAP's MorphSVG plugin is one of the most popular premium animation plugins on the web, demonstrating massive developer demand. For ProAnimate, shape morphing enables a new class of motion graphics templates and gives the AI orchestrator a powerful tool for generating visually sophisticated transitions. It differentiates ProAnimate from simpler animation tools that only support basic transform animations (move, scale, rotate).
- **Who has it:** Jitter (smooth transitions between any two shapes including text), GSAP MorphSVG Plugin (auto-subdivides cubic beziers for smooth morphing), Flubber (best-guess interpolation for arbitrary 2D shapes), SVGator (visual morph animation builder), After Effects (path morphing via vertex alignment).
- **Gold standard:** GSAP's MorphSVG Plugin implements this best at the technical level. It morphs SVG paths by animating the `d` attribute, automatically converting all path commands to cubic beziers and dynamically subdividing them so that the beginning and ending point quantities match. It handles winding direction alignment, starting point optimization, and complex paths with multiple sub-paths. The automatic point matching produces smooth morphs without any manual point correspondence. Jitter implements the best UX: users simply select two shapes and toggle the morph animation, with the tool handling all complexity behind the scenes. The combination of GSAP's technical robustness with Jitter's UX simplicity is the target.

---

### 14. Path Animation (Bezier Curves)
- **Category:** Animation Engine
- **What it is:** A system that allows any canvas object to animate along a user-defined curved path composed of cubic bezier segments, creating smooth, organic motion trajectories beyond simple linear point-to-point movement.
- **What it does:** The system lets users draw a custom motion path on the canvas using a pen-tool-like interface with control points and bezier handles. Any canvas object (text, shape, media, character, SVG object) can then be assigned to follow this path over a specified frame range. The object's position at each frame is computed by evaluating the bezier path at the interpolated progress parameter (t), creating smooth curved motion. The system supports auto-orient (the object rotates to face the direction of travel), speed control along the path (constant speed vs. eased), and multiple path segments for complex trajectories. Path animations integrate with the keyframe system, allowing the path progress to be keyframed with any easing type.
- **User flow:**
  1. User selects a canvas object and opens its animation properties.
  2. User clicks "Add Path Animation" which activates a pen tool on the canvas.
  3. User clicks to place path points; between points, bezier handles appear that can be dragged to curve the path.
  4. Double-click to finish the path. The path is displayed as a thin line on the canvas with control points visible during editing.
  5. User configures the animation: start frame, end frame, easing, auto-orient on/off.
  6. During playback, the object glides along the curved path according to the specified timing.
  7. User can edit the path at any time by selecting it and dragging points or handles.
- **Properties/Parameters:**
  - `pathPoints` (BezierPoint[]): Array of path points, each with `position: {x, y}`, `handleIn: {x, y}`, `handleOut: {x, y}`.
  - `targetObjectRef` (CanvasObjectRef): The canvas object to animate along the path.
  - `startFrame` (number): Frame at which path animation begins.
  - `endFrame` (number): Frame at which path animation ends.
  - `easing` (EasingType, default "linear"): Easing applied to the progress along the path.
  - `bezierParams` (CubicBezierParams | null): Custom cubic bezier easing for path progress.
  - `autoOrient` (boolean, default false): Whether the object rotates to face the direction of travel.
  - `orientOffset` (number, degrees, default 0): Additional rotation offset when auto-orient is active (e.g., 90 degrees if the object's "forward" is sideways).
  - `loop` (boolean, default false): Whether the path animation loops when it reaches the end.
  - `pingPong` (boolean, default false): Whether the animation reverses direction at the end instead of jumping to the start.
  - `constantSpeed` (boolean, default false): When true, the object moves at constant speed regardless of segment length; when false, speed varies with segment density.
  - `pathVisible` (boolean, default true during editing, false during playback): Whether the path line is visible on the canvas.
  - `closedPath` (boolean, default false): Whether the path forms a closed loop (end connects to start).
- **Output:** A per-frame position (and optionally rotation) value for the target object, computed by evaluating the bezier path at the eased progress value. These values override the object's static position during the animation frame range.
- **Acceptance criteria:**
  - The pen tool allows intuitive creation of bezier curves with drag-to-set handles (similar to Figma/Illustrator pen tool).
  - Paths with 2--50 points render and evaluate in real-time at 30fps.
  - Auto-orient produces smooth rotation transitions without sudden jumps, even at path cusps.
  - Constant-speed mode produces perceptually uniform motion along the path (arc-length parameterization).
  - Path animations integrate with the keyframe timeline (path progress is a keyframeable property).
  - All easing types from `interpolation.ts` work with path progress (spring, elastic, bounce, etc.).
  - Paths can be saved and reused across different objects and projects.
  - Works with all canvas object types: text, shapes, media, characters, SVG objects, templates.
  - Canvas2D renderer and Remotion export both correctly render path animations.
  - Path editing provides visual feedback: the path line shows the object's trajectory, with tick marks indicating frame positions along the path.
- **Edge cases:**
  - Single-point path: Treat as a static position (no animation).
  - Two-point path: Equivalent to a simple linear move with optional bezier curve.
  - Path with collinear handles (straight segments): Handle gracefully; constant-speed mode works correctly on straight segments.
  - Object larger than the path curvature radius: Auto-orient may produce unnatural rotation; allow the user to disable auto-orient per segment.
  - Path extends beyond canvas bounds: Allow it; the object will move off-screen and return.
  - Path animation combined with keyframe animation on the same object's position: Path animation takes priority during its active frame range; keyframe animation applies outside that range. Display a warning if conflicts exist.
  - Very long paths with many segments: Use adaptive subdivision for constant-speed calculation to maintain performance.
- **Dependencies:** Depends on cubic bezier math (already in `src/engine/easing.ts` and `src/services/interpolation.ts`), `useKeyframeStore.ts` for path progress keyframes, canvas interaction system (`SelectionTransformBox.tsx`) for the pen tool, all canvas object stores for position updates. Enables more sophisticated motion design in both manual and orchestrator-generated content.
- **Integration with ProAnimate:**
  - `src/services/interpolation.ts`: Already has cubic bezier evaluation (`cubicBezier` function). Extend with bezier path evaluation (multiple connected bezier segments) and arc-length parameterization for constant speed.
  - `src/engine/easing.ts`: Full easing library. All easings can be applied to path progress.
  - `src/types/keyframes.ts`: `PropertyKeyframe` and `EasingType` already exist. Add a `pathProgress` property type to `KeyframableObjectType`.
  - `src/stores/useKeyframeStore.ts`: Generic keyframe system. Path progress (0 to 1) is stored as keyframes, allowing eased traversal.
  - `src/components/canvas/SelectionTransformBox.tsx`: Canvas interaction layer. Extend with a pen tool mode for path creation and editing.
  - `src/components/canvas/VideoCanvas.tsx`: Main compositor. Add a path visualization layer for editing.
  - `src/services/canvas2dRenderer.ts`: Extend to evaluate path positions per frame during export.
  - `src/remotion/VideoComposition.tsx`: Remotion composition. Pass path data and evaluate per-frame positions.
  - `src/components/canvas/SVGObjectLayer.tsx`: SVG objects already have keyframe-animatable positions. Path animation provides a richer trajectory option.
- **Use cases:**
  1. An e-commerce product video animates a product image along a sweeping S-curve from bottom-left to top-right, creating an elegant reveal with auto-orient rotation.
  2. An educational video animates a pointer icon along a curved path that traces the outline of a diagram, guiding the viewer's attention through the content.
  3. A title animation moves text along a circular path that spirals inward, creating a dynamic intro effect.
- **Why it matters:** Path animation is fundamental to professional motion design and is conspicuously absent from most AI animation tools. Jitter specifically added bezier controls for curved paths in 2025 as a highly requested feature, enabling designers to sculpt exact motion curves. After Effects and Apple Motion have supported motion paths for decades as a core feature. CSS now supports `offset-path` for path animation, showing that even web standards recognize its importance. For ProAnimate, path animation transforms the keyframe system from "point A to point B" linear interpolation into a full-featured motion design engine. It is particularly valuable for the orchestrator, which currently can only place objects at static positions or use simple transitions.
- **Who has it:** Jitter (bezier controls for curved paths, May 2025 update), SVGator (visual motion path builder for SVGs), After Effects (motion paths with bezier handles), Apple Motion (full motion path system), CSS Motion Path spec (`offset-path`, `offset-distance`).
- **Gold standard:** Jitter implements this best for the web-based motion design context. Their 2025 update introduced full bezier control for layer movement: users select a layer, create a "Move" animation, enable bezier controls, and then drag handles on either side of each control point to sculpt the exact curve. The implementation is notable for its simplicity: it takes a complex feature and makes it accessible through a clean, intuitive UI that does not require understanding bezier math. The path editing is direct-manipulation on the canvas with live preview, and it integrates seamlessly with Jitter's existing easing and timing controls. For the programmatic/precision end, After Effects remains the gold standard with its extensive motion path toolset including per-point speed graphs and spatial interpolation controls.

---

### 15. Vector/Alpha Masks
- **Category:** Animation Engine
- **What it is:** A compositing system that uses shapes, paths, or images to define visibility regions on other layers, allowing parts of a layer to be selectively shown or hidden based on the mask shape.
- **What it does:** The system allows any shape (rectangle, circle, custom SVG path, text outline) to act as a mask for another layer. Pixels within the mask boundary are visible; pixels outside are hidden. The mask can be animated (position, scale, rotation, path morph), creating reveal/conceal effects. The system supports two mask types: vector masks (hard edges defined by shape paths) and alpha masks (soft edges defined by a grayscale gradient, where white = fully visible, black = fully hidden, and gray = partially transparent). Multiple masks can be combined on a single layer using mask blend modes (add, subtract, intersect, exclude). This enables sophisticated reveal animations, spotlight effects, text-shaped image reveals, and cinematic wipe transitions.
- **User flow:**
  1. User selects a layer to mask (e.g., a media image or video).
  2. User right-clicks and selects "Add Mask" or uses Cmd+Shift+M.
  3. The user chooses a mask source: (a) a shape from the shape library, (b) a custom drawn path, (c) a text element, or (d) another layer (for alpha masks).
  4. The mask appears as a dashed outline on the canvas, clipping the target layer to the mask shape.
  5. User can move, scale, rotate, and keyframe-animate the mask independently from the masked layer.
  6. For alpha masks, the user can apply a gradient fill to the mask shape to create soft-edge reveals (e.g., a gradient mask that fades from left to right).
  7. Multiple masks can be added to the same layer with configurable blend modes.
- **Properties/Parameters:**
  - `maskType` (enum: "vector" | "alpha", default "vector"): Vector uses the mask shape's outline as a hard clip; alpha uses the mask's luminance as a transparency map.
  - `maskSource` (CanvasObjectRef | SVGPath | "drawn"): Reference to the shape/layer used as the mask.
  - `maskBlendMode` (enum: "add" | "subtract" | "intersect" | "exclude", default "add"): How this mask combines with other masks on the same layer. "Add" shows the union; "subtract" hides the mask area; "intersect" shows only the overlap; "exclude" shows the symmetric difference.
  - `inverted` (boolean, default false): Invert the mask so the area inside the shape is hidden and the area outside is visible.
  - `feather` (number, px, default 0): Soft edge width in pixels. Applies a blur to the mask edge for a softer transition.
  - `expansion` (number, px, default 0): Expand or contract the mask boundary by N pixels.
  - `opacity` (number, 0--1, default 1): Overall mask opacity. At 0, the mask has no effect; at 1, full masking.
  - `position` ({x, y}): Mask position relative to the masked layer.
  - `scale` ({x, y}): Mask scale.
  - `rotation` (number, degrees): Mask rotation.
  - `animated` (boolean): Whether the mask properties are keyframed over time.
- **Output:** A composited layer where the target layer's visibility is controlled by the mask shape at every frame. The mask is applied during the canvas rendering pipeline using Canvas2D `clip()` (for vector masks) or `globalCompositeOperation` with a mask canvas (for alpha masks).
- **Acceptance criteria:**
  - Vector masks produce clean, anti-aliased clip edges on all shape types.
  - Alpha masks correctly interpret grayscale values as transparency (white = visible, black = hidden).
  - Masks can be independently animated (position, scale, rotation, path) with keyframes.
  - Multiple masks on a single layer combine correctly according to their blend modes.
  - Feathering produces smooth, natural-looking soft edges up to 50px blur radius.
  - Text can be used as a mask source, creating text-shaped reveals of images/videos.
  - Masks work on all layer types: media images, video layers, characters, shapes, text overlays, HTML templates.
  - Canvas2D renderer and Remotion export both support mask compositing.
  - Performance: up to 5 simultaneous masks per layer without frame drops at 30fps.
  - Mask inversion works correctly and can be toggled at any time.
  - Mask editing is non-destructive: removing a mask restores the original layer visibility.
- **Edge cases:**
  - Mask larger than the masked layer: The entire layer is visible (mask has no clipping effect).
  - Mask smaller than 1px: No visible content; treat as fully hidden.
  - Mask on a layer that is already masked: Support nested masking; apply masks in order.
  - Animating the mask off-screen: Layer becomes fully visible when mask is entirely off-screen (for "add" mode) or fully hidden (for "intersect" mode).
  - Alpha mask source is a color image (not grayscale): Convert to luminance using standard BT.709 formula.
  - Mask applied to a 3D character layer: Apply mask in 2D screen space after the 3D render, not in 3D space.
  - Very complex mask path (hundreds of points): Use path simplification to maintain real-time performance; warn the user.
  - Mask on an HTML template layer (rendered in an iframe): Apply mask on the composited iframe output, not inside the iframe.
- **Dependencies:** Depends on Canvas2D `clip()` and `globalCompositeOperation` for rendering, `useShapeStore.ts` for mask shapes, `useKeyframeStore.ts` for mask animation, `src/services/canvas2dRenderer.ts` for export rendering. Synergizes with Shape Morphing (feature 13) for animated mask shape transitions and Path Animation (feature 14) for moving mask reveals.
- **Integration with ProAnimate:**
  - `src/components/canvas/VideoCanvas.tsx`: Main compositor. Add a mask application pass in the layer rendering pipeline between drawing the layer and compositing it onto the canvas.
  - `src/services/canvas2dRenderer.ts`: Extend the rendering pipeline with mask support using `ctx.save()`, `ctx.clip()`, drawing the layer, then `ctx.restore()` for vector masks. For alpha masks, render the mask to an offscreen canvas and use `globalCompositeOperation: 'destination-in'`.
  - `src/stores/useShapeStore.ts` and `src/types/shapes.ts`: Shapes can serve as mask sources. Add a `isMask` flag and `maskTargetId` reference.
  - `src/stores/useKeyframeStore.ts`: Mask properties (position, scale, rotation, opacity, feather) are keyframeable. Use the existing generic keyframe system.
  - `src/stores/useMediaStore.ts`: Add `masks: MaskConfig[]` to `CanvasMediaItem` for per-media-item mask configuration.
  - `src/remotion/VideoComposition.tsx`: Remotion supports CSS `clip-path` and SVG `<clipPath>` for vector masks. For alpha masks, use canvas-based compositing in a Remotion `<Sequence>`.
  - `src/components/canvas/SelectionTransformBox.tsx`: Add transform handles for mask shapes when selected.
- **Use cases:**
  1. A product reveal video uses a circle mask that expands from the center, gradually revealing the product image underneath, creating a polished unboxing effect.
  2. A title card uses text ("SALE") as a mask over a colorful video background, so the video plays inside the letter shapes, creating an eye-catching promotional graphic.
  3. A storytelling video uses an animated gradient mask that wipes from left to right to transition between two background images, creating a smooth, cinematic scene change.
- **Why it matters:** Masks are the most fundamental compositing tool in motion graphics and video editing. Every professional tool (After Effects, Apple Motion, DaVinci Resolve) considers masking a core feature. Jitter specifically lists vector and alpha masks as key features, and their mask animations export to Lottie format. For ProAnimate, masks unlock an entire category of visual effects (reveals, wipes, spotlights, text reveals, vignettes) that are currently impossible. They are also essential for the AI orchestrator to generate professional-looking transitions and reveal effects.
- **Who has it:** Jitter (vector and alpha masks, mask animations export to Lottie), After Effects (comprehensive mask system with multiple blend modes, feathering, expansion), Apple Motion (image masks, shape masks, multiple mask blend modes), Figma (vector masks).
- **Gold standard:** After Effects provides the most comprehensive masking system. Each layer can have unlimited masks with independent blend modes (Add, Subtract, Intersect, Difference, Darken, Lighten). Masks support per-vertex feathering (different feather amounts at different points along the mask edge), expansion/contraction, opacity control, and full keyframe animation. The "Track Matte" system uses one layer's luminance or alpha as another layer's mask, enabling complex compositing. For the web-based motion design context, Jitter's implementation is the most relevant model: it offers vector and alpha masks with animation support, exports to Lottie, and provides a simple UI that makes masking accessible to non-experts through a single keyboard shortcut (Cmd+Ctrl+M) to create masks from selected layers.

---

### 16. Blend Modes
- **Category:** Animation Engine
- **What it is:** A layer compositing system that controls how overlapping layers interact visually, providing modes like Multiply, Screen, Overlay, and others that produce different color blending effects.
- **What it does:** When layers overlap on the canvas, the blend mode determines how the top layer's pixels combine with the bottom layer's pixels. The default "Normal" mode simply draws the top layer over the bottom layer according to its opacity. Other blend modes apply mathematical operations to the color channels: Multiply darkens (useful for shadows and textures), Screen brightens (useful for light effects and glows), Overlay enhances contrast, Soft Light adds subtle tinting, Color Dodge creates vivid highlights, and Color Burn creates deep shadows. The system applies blend modes at the canvas compositing level using Canvas2D's `globalCompositeOperation` property, and at the CSS level using `mix-blend-mode` for the preview. Blend modes can be applied to any layer type and can be animated (transitioning from one blend mode to another over time via crossfade).
- **User flow:**
  1. User selects a layer on the canvas or in the layers panel.
  2. In the layer properties, a "Blend Mode" dropdown appears (defaulting to "Normal").
  3. User selects a blend mode from the categorized list (e.g., Darken group: Multiply, Color Burn, Darken; Lighten group: Screen, Color Dodge, Lighten; Contrast group: Overlay, Soft Light, Hard Light; etc.).
  4. The canvas immediately shows the blended result.
  5. User can keyframe the blend mode's opacity to animate between blended and normal appearance.
  6. In the timeline, a blend mode indicator icon appears on layers that have a non-Normal blend mode.
- **Properties/Parameters:**
  - `blendMode` (enum): The compositing mode. Supported modes:
    - **Normal:** "normal" (default)
    - **Darken group:** "multiply", "darken", "color-burn"
    - **Lighten group:** "screen", "lighten", "color-dodge"
    - **Contrast group:** "overlay", "soft-light", "hard-light"
    - **Inversion group:** "difference", "exclusion"
    - **Component group:** "hue", "saturation", "color", "luminosity"
  - `blendOpacity` (number, 0--1, default 1): Controls the strength of the blend effect. At 0, the layer renders as Normal; at 1, the blend mode is fully applied.
  - `isolateBlending` (boolean, default false): When true, the layer's blend mode only affects layers within the same group, not layers below the group.
- **Output:** Visually composited layers where overlapping pixels are combined according to the selected blend mode formula. The result appears in both the canvas preview and all export formats (Canvas2D, Remotion, PixiJS).
- **Acceptance criteria:**
  - All 14 blend modes produce visually correct results matching the CSS `mix-blend-mode` specification.
  - Blend modes work on all layer types: shapes, text overlays, media images, video layers, characters, SVG objects, Lottie animations, HTML templates.
  - Blend mode changes are reflected immediately in the canvas preview (no delay).
  - Blend opacity is keyframeable, allowing smooth transitions between blended and normal states.
  - Canvas2D export renderer correctly applies blend modes using `globalCompositeOperation`.
  - Remotion export applies blend modes using CSS `mix-blend-mode` on layer elements.
  - PixiJS GPU renderer applies blend modes using PIXI blend modes.
  - Blend modes interact correctly with layer opacity (blend mode is applied first, then opacity).
  - The layers panel shows a visual indicator for layers with non-Normal blend modes.
  - Performance: no measurable performance impact for up to 10 layers with blend modes at 30fps.
- **Edge cases:**
  - Blend mode on the bottom-most layer: Has no effect since there is nothing below to blend with; display normally.
  - Blend mode on a fully transparent layer: No visible effect.
  - Blend mode with semi-transparent source: Correctly pre-multiply alpha before applying the blend formula.
  - Blend mode on a group/container: Apply the blend mode to the flattened group output, not to individual children.
  - Export format limitations: WebM/MP4 export bakes blended composites into the video frames. GIF export may show banding artifacts on gradient-heavy blend results.
  - Multiple overlapping blend mode layers: Apply blend modes in layer order (bottom to top), with each layer blending against the composite result of all layers below it.
  - Blend mode "difference" with identical layers: Produces pure black (correct behavior).
- **Dependencies:** Depends on Canvas2D `globalCompositeOperation`, CSS `mix-blend-mode`, PixiJS blend modes. Requires changes to the rendering pipeline in `VideoCanvas.tsx`, `canvas2dRenderer.ts`, and Remotion composition. Synergizes with Vector/Alpha Masks (feature 15) for complex compositing workflows and Animated Gradients (feature 17) for creative lighting effects.
- **Integration with ProAnimate:**
  - `src/components/canvas/VideoCanvas.tsx`: The main compositor already renders layers in z-index order. Add `mix-blend-mode` CSS style to each layer's container div during preview rendering.
  - `src/services/canvas2dRenderer.ts`: Already uses `ctx.globalAlpha` for opacity. Add `ctx.globalCompositeOperation = blendMode` before drawing each layer that has a non-Normal blend mode.
  - `src/stores/useMediaStore.ts`: Already has `CanvasMediaItem` with opacity and zIndex. Add `blendMode` field.
  - `src/stores/useShapeStore.ts`: Add `blendMode` to `CanvasShape`.
  - `src/stores/useTextOverlayStore.ts`: Add `blendMode` to text overlay objects.
  - `src/types/canvas.ts`: Define `BlendMode` type union.
  - `src/types/shapes.ts`: Add `blendMode?: BlendMode` to `CanvasShape`.
  - `src/stores/useKeyframeStore.ts`: Blend opacity is keyframeable via the existing generic keyframe system.
  - `src/remotion/VideoComposition.tsx`: Apply `style={{ mixBlendMode }}` to each layer's wrapper element.
  - `src/remotion/RemotionMediaLayer.tsx`, `RemotionShapeLayer.tsx`, `RemotionTextOverlay.tsx`: Add blend mode style support to each Remotion export layer.
  - `src/services/orchestrator.ts`: Extend the ClipPlan schema to include blend mode specifications on shapes and media items.
  - `src/data/videoStyles.ts`: Already references compositeOperation. Standardize with the new blend mode system.
- **Use cases:**
  1. A product video overlays a noise texture layer with "Soft Light" blend mode to add a subtle film grain effect, making the video feel more premium without affecting the content's colors significantly.
  2. A title card uses "Screen" blend mode on a light leak video overlay, creating bright, colorful light effects that only add brightness without darkening any underlying content.
  3. A comparison video uses "Difference" blend mode to visually highlight changes between two versions of a design, making differences immediately visible.
- **Why it matters:** Blend modes are a universal feature in professional design and motion tools. Jitter added blend modes (Multiply, Screen, Overlay) in November 2025 alongside a template collection built around blend-mode effects (light leaks, textures, color shifts). After Effects, Apple Motion, Figma, and every serious design tool includes blend modes. For ProAnimate, blend modes transform the flat layer stack into a true compositing engine, enabling texture overlays, lighting effects, and visual treatments that are currently impossible. They are particularly valuable for the motion graphics templates and the AI orchestrator, which can use blend modes to create more visually rich and professional output.
- **Who has it:** Jitter (Multiply, Screen, Overlay + blend mode template collection), After Effects (36+ blend modes), Apple Motion (blend modes with alpha channel manipulation), Figma (blend modes on layers and fills), PixiJS (GPU-accelerated blend modes).
- **Gold standard:** Jitter is the best model for ProAnimate's web-based context. Their November 2025 implementation added blend modes with a clean UI: a dropdown on each layer to select the mode (Multiply, Screen, Overlay, etc.) with immediate visual preview. They shipped a companion template collection that demonstrates blend mode usage patterns (bold overlays, subtle textures, light leaks, color shifts), making it easy for users to see practical applications. The templates serve as both inspiration and education. After Effects remains the technical gold standard with 36+ modes and advanced controls (blend-if sliders, per-channel blending), but Jitter demonstrates the right scope for a web-based tool: the 10--14 most commonly used modes, clean UI, and ready-made templates.

---

### 17. Animated Gradients
- **Category:** Animation Engine
- **What it is:** A system for creating gradients (linear, radial, conic) whose properties (colors, color stop positions, angle, center point, radius) can be animated over time using keyframes.
- **What it does:** The system extends ProAnimate's shape and text fill system to support gradient fills that change over time. Users can define a gradient with multiple color stops, then keyframe any gradient property: the colors themselves (creating color-shifting effects), the positions of color stops (creating flowing/pulsing effects), the gradient angle (creating rotating light sweep effects), and the center/radius (creating expanding/contracting radial effects). Animated gradients can be applied to shape fills, shape strokes, text fills, text strokes, and background layers. The system supports linear gradients (straight color transitions at any angle), radial gradients (circular/elliptical color transitions from a center point), and conic gradients (angular color sweep around a center point). Gradient animations integrate with the keyframe system and support all easing types.
- **User flow:**
  1. User selects a shape or text element on the canvas.
  2. In the fill/stroke color picker, user switches from "Solid" to "Gradient" tab.
  3. User selects gradient type (Linear, Radial, or Conic).
  4. A gradient editor appears showing the gradient bar with color stops that can be added, removed, repositioned, and recolored.
  5. User adjusts gradient properties (angle for linear, center/radius for radial).
  6. User clicks "Animate" and keyframes specific gradient properties at different frames.
  7. During playback, the gradient smoothly transitions between keyframed states.
  8. Presets are available for common effects: "Rainbow Sweep," "Breathing Glow," "Color Shift," "Spotlight Move."
- **Properties/Parameters:**
  - `gradientType` (enum: "linear" | "radial" | "conic", default "linear"): The gradient shape.
  - `colorStops` (GradientColorStop[]): Array of `{ color: string, position: number (0--1) }` defining the gradient.
  - `angle` (number, degrees, default 0): Rotation angle for linear gradients.
  - `center` ({x: number, y: number}, default {0.5, 0.5}): Center point for radial/conic gradients (normalized 0--1).
  - `radius` ({x: number, y: number}, default {0.5, 0.5}): Radius for radial gradients (normalized).
  - `repeat` (enum: "none" | "repeat" | "reflect", default "none"): Whether the gradient repeats beyond its defined range.
  - `animatedProperties` (enum[]): Which properties are keyframed: "colors", "positions", "angle", "center", "radius".
  - `colorInterpolation` (enum: "srgb" | "oklch" | "hsl", default "oklch"): Color space for interpolating between gradient color values.
  - `spreadMethod` (enum: "pad" | "repeat" | "reflect", default "pad"): How the gradient extends beyond its defined area.
- **Output:** A per-frame gradient definition that can be rendered as a Canvas2D gradient (`createLinearGradient`, `createRadialGradient`) or a CSS gradient string for Remotion export. Each frame computes the interpolated gradient properties and generates the correct visual.
- **Acceptance criteria:**
  - Linear, radial, and conic gradients render correctly on shapes and text.
  - Color stop colors interpolate smoothly (no banding or harsh transitions) using OKLCH color space.
  - Animated gradient angle creates a smooth rotating sweep effect.
  - Animated gradient center (radial) creates a spotlight-following effect.
  - All gradient properties are keyframeable with full easing support.
  - Gradient presets provide one-click access to common animated gradient effects.
  - Gradients work on both fill and stroke of shapes and text.
  - Canvas2D renderer correctly draws animated gradients per frame on export.
  - Remotion export generates the correct CSS gradient strings per frame.
  - Performance: animated gradients on up to 10 elements simultaneously without frame drops at 30fps.
  - Color stop count can vary between keyframes (interpolation handles adding/removing stops smoothly).
- **Edge cases:**
  - Gradient with a single color stop: Render as a solid color.
  - Keyframing different numbers of color stops at different frames: Interpolate by adding phantom stops (invisible duplicates) at positions that match the target state, then fade them in/out.
  - Conic gradient with sharp color transitions: May produce aliased edges at high angles; apply sub-pixel anti-aliasing.
  - Gradient on a very small element (under 10px): Gradient may not be perceptible; render as solid if element is too small.
  - Gradient on text with complex outlines: Apply gradient to the text's bounding box and mask with the text shape.
  - Export to GIF: Gradient animations may show color banding due to GIF's 256-color limitation; warn the user.
  - OKLCH color interpolation for colors that do not have OKLCH equivalents: Fall back to sRGB interpolation.
- **Dependencies:** Depends on Canvas2D gradient APIs (`createLinearGradient`, `createRadialGradient`), `useKeyframeStore.ts` for property keyframes, `useShapeStore.ts` for shape fill, `useTextOverlayStore.ts` for text fill. Synergizes with Blend Modes (feature 16) for creative lighting and texture effects.
- **Integration with ProAnimate:**
  - `src/stores/useShapeStore.ts`: Currently `CanvasShape.fill` is a simple string (hex color). Extend to support `fill: string | GradientConfig` where `GradientConfig` contains gradient type, color stops, angle, center, and radius.
  - `src/types/shapes.ts`: Add `GradientConfig` type and update `CanvasShape.fill` and `CanvasShape.stroke` types.
  - `src/stores/useTextOverlayStore.ts`: Similarly extend text fill/stroke to support gradients.
  - `src/stores/useKeyframeStore.ts`: Add gradient property keyframe support (color stop colors, positions, angle, center, radius as independently keyframeable properties).
  - `src/services/interpolation.ts`: Already has `lerp` and color interpolation. Add OKLCH color space interpolation and gradient-specific interpolation functions.
  - `src/components/canvas/ShapeLayer.tsx`: Extend shape rendering to use Canvas2D gradient APIs when gradient fill is specified.
  - `src/services/canvas2dRenderer.ts`: Extend shape and text rendering with gradient support using `ctx.createLinearGradient()` and `ctx.createRadialGradient()`.
  - `src/remotion/RemotionShapeLayer.tsx`: Render gradients as CSS `linear-gradient()`, `radial-gradient()`, or `conic-gradient()` on SVG elements or div backgrounds.
  - `src/remotion/RemotionTextOverlay.tsx`: Apply gradient fills to text using CSS `background-clip: text` technique.
- **Use cases:**
  1. A brand intro video features the company colors smoothly transitioning in a radial gradient that expands from the logo position, creating an elegant branded reveal.
  2. A social media video uses a rotating linear gradient on the background that sweeps through warm-to-cool colors, adding subtle visual interest to an otherwise static background.
  3. A CTA button shape uses a pulsing radial gradient that expands and contracts to draw attention, with the center point following the text position.
- **Why it matters:** Animated gradients are a hallmark of modern motion design and UI animation. Jitter specifically supports animating all gradient properties (color, number, position of color stops) and added gradient strokes in 2025, recognizing strong user demand. CSS gradient animation has become a popular web design technique, and mesh gradient backgrounds are trending in modern design. For ProAnimate, animated gradients elevate the visual quality of backgrounds, shapes, and text without requiring image assets, making them particularly valuable for the AI orchestrator to generate visually rich content programmatically.
- **Who has it:** Jitter (animated linear and radial gradients on fills and strokes, all gradient properties animatable), After Effects (gradient ramp effects with animation), Figma (gradient fills, no animation), CSS (animated gradients via `@property` and keyframes).
- **Gold standard:** Jitter sets the standard for web-based motion design tools. They support linear and radial gradients on both fills and strokes, with the ability to animate all gradient properties: color values, number of color stops, and position of each stop. Users access gradient controls from the fill/stroke color picker, switch to the Linear or Radial tab, and animate via the Animate tab. The August 2025 addition of text gradients and September 2025 addition of stroke gradients completed their gradient system. The implementation is clean and integrated: gradients feel like a natural extension of the color system rather than a separate feature, and they export cleanly to Lottie format.

---

### 49. Blur Effect Presets
- **Category:** Animation Engine
- **What it is:** A configurable blur effect system that provides multiple blur algorithms (Gaussian, motion, radial/zoom, directional, tilt-shift) as animatable presets that can be applied to any canvas layer.
- **What it does:** The system applies real-time blur effects to canvas layers using CSS filters (for preview) and Canvas2D filter operations (for export). Each blur type produces a different visual effect: Gaussian blur softens evenly in all directions (depth of field, dreamy effects), motion blur simulates camera or object movement (dynamic energy), radial/zoom blur creates a zooming effect from a center point (impact, focus), directional blur blurs along a specific angle (speed lines, wind), and tilt-shift blur keeps a center band sharp while blurring the top and bottom (miniature effect). Blur effects are animatable, meaning the blur radius can change over time via keyframes, enabling transitions like focus-pull (sharp to blurry or blurry to sharp), dramatic reveals, and text entrance effects.
- **User flow:**
  1. User selects a layer on the canvas.
  2. In the layer properties, user clicks "Add Effect" and selects "Blur."
  3. A blur preset picker appears with thumbnails showing each blur type's visual effect.
  4. User selects a blur type (Gaussian, Motion, Radial, Directional, Tilt-Shift).
  5. Configuration controls appear for the selected type (radius, angle, center point, etc.).
  6. User adjusts the blur parameters and sees the result in real-time on the canvas.
  7. User can keyframe the blur radius to animate it over time (e.g., start blurry, then come into focus).
  8. One-click animation presets are available: "Focus Pull In," "Focus Pull Out," "Dreamy Fade," "Impact Zoom."
- **Properties/Parameters:**
  - `blurType` (enum: "gaussian" | "motion" | "radial" | "directional" | "tilt-shift"): The blur algorithm.
  - `radius` (number, px, 0--100, default 10): Blur radius in pixels. Larger values produce more blur.
  - `angle` (number, degrees, default 0): Direction angle for motion and directional blur.
  - `center` ({x: number, y: number}, default {0.5, 0.5}): Center point for radial blur (normalized 0--1).
  - `tiltShiftBand` ({start: number, end: number}, default {0.35, 0.65}): The sharp band for tilt-shift blur (normalized 0--1, representing the vertical position range that stays in focus).
  - `tiltShiftGradient` (number, px, default 20): Width of the transition zone between sharp and blurry areas in tilt-shift.
  - `quality` (enum: "low" | "medium" | "high", default "medium"): Controls the number of blur samples. Higher quality is smoother but slower.
  - `animated` (boolean, default false): Whether the blur radius is keyframed.
  - `preset` (enum | null): Optional animation preset (e.g., "focus-pull-in", "focus-pull-out", "dreamy-fade", "impact-zoom", "text-reveal").
- **Output:** A per-frame CSS `filter: blur()` string (for preview) or a Canvas2D filter operation (for export) applied to the target layer, producing the specified blur effect at the current keyframed intensity.
- **Acceptance criteria:**
  - Gaussian blur renders correctly in both preview (CSS filter) and export (Canvas2D StackBlur or similar algorithm).
  - Motion blur simulates directional motion at the specified angle with smooth falloff.
  - Radial blur creates a zoom-like effect emanating from the specified center point.
  - Tilt-shift blur keeps the specified band sharp with smooth gradient transitions to blurred areas.
  - Blur radius is keyframeable with full easing support (blur can smoothly increase/decrease over time).
  - Animation presets produce polished, ready-to-use effects with a single click.
  - All blur types work on all layer types: shapes, text, media, characters, SVG objects.
  - Performance: Gaussian blur on a single full-canvas layer runs at 30fps with radius up to 20px.
  - Export via Canvas2D and Remotion matches the preview appearance.
  - Blur effects are non-destructive and can be removed at any time.
  - Multiple blur effects can be stacked on the same layer (e.g., Gaussian + motion blur).
- **Edge cases:**
  - Blur radius of 0: No blur applied; render normally.
  - Very large blur radius (100+ px): Warn about performance impact; cap at 100px for real-time preview but allow higher values for export.
  - Blur on a transparent layer: Blur extends the visible area of the layer (blurred edges become visible); allow the user to toggle between "blur content only" and "blur including edges."
  - Radial blur with center outside the layer bounds: Still applies correctly; the blur direction vectors point toward the off-screen center.
  - Blur on HTML template layers (iframes): Apply CSS filter to the iframe container, not inside the iframe.
  - Blur combined with masks: Apply blur before masking (blur the full layer, then clip with the mask).
  - Export format limitations: GIF does not support real-time blur; pre-render blurred frames during GIF export.
- **Dependencies:** Depends on CSS `filter: blur()` for preview, Canvas2D `ctx.filter` or StackBlur algorithm for export, `useKeyframeStore.ts` for blur radius animation. Synergizes with Vector/Alpha Masks (feature 15) for selective blur (blur only the masked area) and Blend Modes (feature 16) for combined visual effects.
- **Integration with ProAnimate:**
  - `src/components/canvas/VideoCanvas.tsx`: Apply CSS `filter: blur(Npx)` to layer container divs during preview rendering. For motion/radial/tilt-shift, use SVG filter elements embedded in the canvas.
  - `src/services/canvas2dRenderer.ts`: For Gaussian blur, use `ctx.filter = 'blur(Npx)'` or a StackBlur implementation for browsers that do not support ctx.filter. For directional/radial/tilt-shift, implement custom multi-pass rendering.
  - `src/stores/useMediaStore.ts`, `useShapeStore.ts`, `useTextOverlayStore.ts`: Add `blurConfig?: BlurConfig` to each layer's data model.
  - `src/types/shapes.ts`: Add `BlurConfig` type with all blur parameters.
  - `src/stores/useKeyframeStore.ts`: Blur radius and other blur properties are keyframeable via the existing generic keyframe system.
  - `src/remotion/VideoComposition.tsx`: Apply CSS `filter` styles to layer wrapper elements. For advanced blur types, use SVG filter elements.
  - `src/remotion/RemotionMediaLayer.tsx`, `RemotionShapeLayer.tsx`, `RemotionTextOverlay.tsx`: Add blur filter support to each Remotion export layer.
  - `src/services/orchestrator.ts`: Extend ClipPlan schema to include blur effects on layers, enabling the AI to add depth-of-field and focus effects.
- **Use cases:**
  1. A talking-head video uses tilt-shift blur on the background to simulate camera depth of field, keeping the character sharp while the environment has a professional, defocused look.
  2. A text reveal animation starts with the text heavily Gaussian-blurred, then the blur animates to 0 as the text comes into focus, creating an elegant entrance effect.
  3. A dramatic moment in a product video uses a radial zoom blur centered on the product, creating an impact effect that draws the viewer's eye.
- **Why it matters:** Blur effects are essential for professional-looking video content. They create depth, direct attention, and add polish. Jitter specifically added blur presets in January 2025 and published a dedicated blur template collection in June 2025, recognizing the feature as one of their most requested. After Effects and Premiere Pro include extensive blur effect libraries. For ProAnimate, blur presets are a high-impact, relatively low-complexity addition that immediately elevates the visual quality of every project. The animation presets (focus pull, dreamy fade, impact zoom) provide one-click professional effects that are particularly valuable for the AI orchestrator.
- **Who has it:** Jitter (blur presets for one-click blur animations, blur template collection, applies to all layers including text), After Effects (Gaussian, directional, radial, camera lens blur, tilt-shift), Premiere Pro (Gaussian, radial blur with spin/zoom), Apple Motion (Gaussian blur filter), Boris FX Continuum (Composite Blur with area, directional, zoom, motion, and tilt-shift modes).
- **Gold standard:** Jitter leads in the web-based motion design space. Their January 2025 blur presets release added one-click blur animations that apply to all layer types including text, perfect for creating organic transitions and guiding viewer attention. The June 2025 blur template collection provides ready-made compositions demonstrating blur usage patterns: dreamy transitions, smooth text reveals, depth-of-field effects. Their implementation focuses on simplicity: blur is a single property that can be added and animated with minimal configuration, while still providing enough control for advanced users to customize the effect. For technical comprehensiveness, Boris FX's Composite Blur offers the widest range of blur algorithms (Gaussian, area, directional, zoom, motion, tilt-shift) with professional-grade quality controls.

---

### 57. Data-Driven Procedural Animation
- **Category:** Animation Engine
- **What it is:** A system that generates animations automatically from structured data sources (CSV files, JSON, Google Sheets, REST APIs), where data values drive visual properties like bar heights, chart positions, text content, colors, and timing.
- **What it does:** The system connects external data sources to canvas elements, creating a binding where data values automatically populate and animate visual properties. Users import a CSV file or connect a Google Sheet URL, and the system maps data columns to visual properties: a "revenue" column drives bar heights in a chart, a "name" column populates text labels, a "date" column sets the timeline sequencing, and a "color" column drives element fills. When the data changes (new CSV upload, Google Sheet update), the animation automatically regenerates to reflect the new data. The system supports sequential animation (data points appear one at a time), comparative animation (multiple series animate simultaneously), and time-series animation (data evolves over a time dimension). It integrates with ProAnimate's existing HTML template system, allowing data to populate template CONFIG variables that drive the template's internal animations.
- **User flow:**
  1. User opens the "Data" panel (or a new tab in an existing panel).
  2. User imports data: uploads a CSV file, pastes a Google Sheet URL, enters a JSON endpoint URL, or manually enters data in a table editor.
  3. The system parses the data and displays column names with auto-detected types (number, string, date, color).
  4. User selects a visualization template (bar chart, line chart, counter, leaderboard, comparison, timeline, data table) or creates a custom data binding.
  5. The system maps data columns to visual properties with sensible defaults (first numeric column = values, first string column = labels).
  6. User customizes the mapping, styling (colors, fonts, sizes), and animation settings (sequential reveal, transition duration, easing).
  7. The data-driven animation is placed on the canvas and timeline, animating through the data according to the configured sequence.
  8. User can update the data source at any time; the animation regenerates automatically.
- **Properties/Parameters:**
  - `dataSource` (DataSourceConfig): The data connection:
    - `type` (enum: "csv" | "json" | "google-sheets" | "api" | "manual"): Source type.
    - `url` (string | null): URL for remote sources.
    - `fileContent` (string | null): Raw content for uploaded files.
    - `refreshInterval` (number | null, seconds): Auto-refresh interval for live data sources.
  - `columnMappings` (ColumnMapping[]): Array of `{ columnName: string, targetProperty: string, transform?: (value: any) => any }` that bind data columns to visual properties.
  - `visualizationType` (enum: "bar-chart" | "line-chart" | "counter" | "leaderboard" | "comparison" | "timeline" | "data-table" | "custom"): The type of data visualization.
  - `animationMode` (enum: "sequential" | "simultaneous" | "time-series" | "race", default "sequential"): How data points are animated.
  - `revealDuration` (number, frames, default 30): Duration of each data point's entrance animation.
  - `stagger` (number, frames, default 5): Delay between sequential data point reveals.
  - `easing` (EasingType, default "ease-out"): Easing applied to data-driven property animations.
  - `sortOrder` (enum: "data-order" | "ascending" | "descending", default "data-order"): How data points are ordered in the visualization.
  - `maxDataPoints` (number, default 50): Maximum number of data points to visualize (prevents overwhelming the canvas).
  - `numberFormat` (string, default "#,##0"): Number formatting pattern (thousands separator, decimal places).
  - `colorScheme` (string[] | "auto"): Color palette for data categories; "auto" generates a palette from the project's brand colors.
- **Output:** A fully animated data visualization on the canvas that reads from the data source and renders each data point as a visual element with animated transitions. The visualization updates when the data changes and exports correctly through all rendering pipelines.
- **Acceptance criteria:**
  - CSV files up to 1000 rows parse and visualize without errors or significant delay.
  - Google Sheets connections refresh data in real-time and update the visualization within 2 seconds of a change.
  - Bar chart, line chart, and counter visualizations produce clean, readable animations.
  - Sequential reveal animation shows data points one at a time with smooth entrance effects.
  - Time-series mode animates a value changing over time (like a "racing bar chart").
  - Data type auto-detection correctly identifies numbers, strings, dates, and hex color values.
  - Custom column mapping allows any data column to drive any animatable property on any canvas object.
  - Number formatting supports thousands separators, decimal places, currency symbols, and percentages.
  - Data updates regenerate the animation without losing user customizations (colors, fonts, positioning).
  - Leaderboard visualization supports animated ranking changes (items smoothly move to new positions).
  - All data visualizations integrate with the existing HTML template system (data binds to template CONFIG variables).
  - Export via Canvas2D and Remotion renders data visualizations correctly at all frames.
- **Edge cases:**
  - Empty data source: Display a placeholder message and skeleton visualization.
  - Data with missing values (null/empty cells): Skip missing values or display as zero/blank depending on the visualization type; show a warning indicator.
  - Data with extremely large values (billions): Auto-scale and apply appropriate number formatting (K, M, B suffixes).
  - Data with negative values: Handle correctly in bar charts (bars extend downward) and line charts (line goes below zero line).
  - Data source URL returns an error (403, 404, 500): Display an error state with retry option; cache the last successful data for fallback.
  - Google Sheets API rate limiting: Queue requests and implement exponential backoff; show a "refreshing..." indicator.
  - Very large data sets (1000+ rows): Paginate or aggregate the visualization; warn the user that performance may be affected.
  - Mixed data types in a column (numbers and strings): Attempt to parse all values as the detected dominant type; skip unparseable values with a warning.
  - Data with special characters or HTML in strings: Sanitize all string values before rendering; escape HTML entities.
- **Dependencies:** Depends on CSV parsing (can use PapaParse or built-in), Google Sheets API for live data, `useHTMLTemplateLayerStore.ts` for template CONFIG binding, `useShapeStore.ts` and `useTextOverlayStore.ts` for custom bindings, and the keyframe system for animated transitions. Enables data-driven content creation workflows for business, education, and media.
- **Integration with ProAnimate:**
  - `src/data/builtinTemplates.ts`: Already contains 15+ infographic chart templates (bar, line, donut, sankey, etc.) that accept CONFIG data via postMessage. Data-driven animation automates populating these templates from external sources.
  - `src/services/templateBridge.ts`: Already implements the postMessage bridge for sending live CONFIG updates to HTML template layers. Use this to pipe data values into templates.
  - `src/stores/useHTMLTemplateLayerStore.ts`: Template layers already have `configOverrides` for setting template properties. Data bindings produce config override values from the data source.
  - `src/services/templateConfigParser.ts`: Already auto-detects editable template properties. Use this to match data columns to configurable template properties.
  - `src/services/orchestrator.ts`: The orchestrator already sets up HTML templates with config data. Extend the ClipPlan to accept a `dataSource` that auto-populates template configs.
  - `src/stores/useShapeStore.ts`: For custom bindings, data values can drive shape properties (width, height, fill, position).
  - `src/stores/useTextOverlayStore.ts`: Data values can populate text content (labels, counters, percentages).
  - `src/services/interpolation.ts`: Animated transitions between data states use the existing easing system.
  - `src/engine/stagger.ts`: Stagger engine for sequential data point reveals.
- **Use cases:**
  1. A financial content creator uploads a CSV of monthly stock prices and generates an animated line chart that traces the price movement over time, with annotations at key dates, for a YouTube Shorts explainer.
  2. A sports channel connects a Google Sheet with live tournament standings and generates an animated leaderboard that updates automatically as scores change, exporting a new video after each round.
  3. A business uses a JSON API endpoint that returns their sales dashboard data and auto-generates a weekly performance report video with animated bar charts, counters, and comparison visualizations.
- **Why it matters:** Data-driven animation is the core value proposition of Cavalry, which was significant enough for Canva to acquire in 2026. Cavalry's ability to connect CSV, Google Sheets, and API data to animations has made it the tool of choice for Amazon, Meta, Google, and Netflix for creating data-driven motion graphics at scale. The market for automated data visualization is growing rapidly as businesses increasingly need to turn data into engaging video content (earnings reports, social media analytics, sports highlights, weather data). For ProAnimate, this feature opens the enterprise and business intelligence market, enables template-based content automation (update the data, get a new video), and dramatically increases the value proposition of the HTML template system that already contains 15+ infographic chart templates.
- **Who has it:** Cavalry (CSV, Google Sheets, API data connections with procedural animation; acquired by Canva in 2026; used by Amazon, Meta, Google, Netflix), After Effects (data-driven templates via JSON/CSV with the Essential Graphics panel), Rive (data-driven interactive animations with logic and state machines).
- **Gold standard:** Cavalry is the definitive implementation. Their Spreadsheet utility reads data from Google Sheets, CSV, and XLSX files and reflects changes instantly in the composition. Their Interpolate feature blends data across columns by keyframing column values, and their Factorize feature converts text categories into numeric values for visual mapping. The JavaScript API module enables connecting to any web API, feeding external data into the creative workflow. What makes Cavalry exceptional is the procedural approach: rather than manually placing elements for each data point, users define rules and relationships (e.g., "bar height = data value * 10, bar color = category color") and the system generates and animates all elements automatically. This procedural paradigm enables creating one template that works for any number of data points, making it infinitely scalable. Canva's acquisition specifically cited Cavalry's data integration capabilities as the strategic value, confirming that data-driven animation is a key growth area for creative tools.

---

## Category 5: Canvas & Design Tools

### 43. Infinite Canvas / Multi-Artboard

- **Category:** Canvas & Design Tools
- **What it is:** An unbounded workspace that allows users to create, view, and manage multiple scene compositions (artboards) side by side on a single zoomable/pannable surface.
- **What it does:** Replaces the current single-composition canvas with an infinite 2D plane where users can place multiple artboards of different sizes and aspect ratios. Each artboard represents an independent scene or format variant (e.g., a 16:9 YouTube version alongside a 9:16 TikTok version of the same video). Users can zoom out to see all artboards at once, zoom into a single artboard for detailed editing, copy layers between artboards, and independently animate each scene. The infinite canvas makes it natural to iterate on multiple format variants in a single project rather than managing separate project files.
- **User flow:**
  1. User opens the editor and sees a default artboard on an infinite gray canvas with a subtle dot-grid background.
  2. User right-clicks on empty canvas space or uses a toolbar button to select "Add Artboard," choosing dimensions and aspect ratio (or using presets like 9:16, 16:9, 1:1).
  3. New artboard appears next to the existing one with a labeled header showing its name and dimensions.
  4. User double-clicks an artboard to enter "focused edit" mode, where the timeline, layer panel, and property panel scope to that artboard.
  5. User presses Escape or clicks outside to return to the multi-artboard overview.
  6. User drags layers/objects between artboards via drag-and-drop or copy/paste (Cmd+C in one artboard, click into another, Cmd+V).
  7. At export time, user selects which artboards to export (individually or batch).
- **Properties/Parameters:**
  - Artboard name (string, editable, default: "Scene 1", "Scene 2", ...)
  - Artboard dimensions (width x height in pixels, default: derived from selected aspect ratio)
  - Artboard aspect ratio (16:9, 9:16, 1:1, 4:3, 21:9, or custom)
  - Artboard background color (hex, default: #18181b)
  - Artboard position on canvas (x, y in world coordinates, auto-arranged by default)
  - Canvas zoom range: 0.02 (full overview) to 3.0 (detail editing)
  - Canvas pan offset (x, y)
  - Auto-arrange spacing: 100px between artboards
  - Maximum artboards per project: 50 (free), 200 (pro)
  - Each artboard has its own independent timeline (fps, totalFrames, tracks, clips)
- **Output:** A project containing multiple independently-animatable compositions displayed on a shared workspace, each exportable as a separate video file or collectively as a batch.
- **Acceptance criteria:**
  - Users can create, rename, duplicate, delete, and reorder artboards
  - Each artboard has independent timeline state (fps, duration, tracks)
  - Zoom-to-fit (Cmd+0) frames all artboards; zoom-to-selection (Cmd+1) frames the selected artboard
  - Double-click enters focused edit mode, scoping all panels to that artboard
  - Copy/paste of layers (text, shapes, characters, media) works across artboards
  - Artboard headers display name, dimensions, and duration
  - Canvas performance maintains 60fps with up to 20 visible artboards at overview zoom
  - Export modal allows per-artboard or batch export
  - Project save/load preserves all artboard state
  - Undo/redo operates per-artboard in focused mode and globally in overview mode
- **Edge cases:**
  - Extremely large artboards (e.g., 8K) at high zoom should use level-of-detail rendering, showing placeholders until the user zooms in
  - When deleting the last artboard, auto-create a new default artboard to prevent an empty project state
  - Copy/paste of layers between artboards with different aspect ratios should preserve absolute pixel values (not relative percentages), with a warning if the object extends beyond the target artboard bounds
  - If two artboards overlap on the canvas due to manual positioning, the one clicked should come to the front for editing; a context menu option "Arrange > Send to Back" should be available
  - Audio playback in overview mode should only play the currently selected artboard's audio to avoid cacophony
- **Dependencies:**
  - Requires refactoring `useCanvasStore` to support multiple artboard contexts
  - Requires extending `useTimelineStore` to scope timeline state per artboard
  - Requires updating `useProjectStore` and `projectService.ts` to persist multi-artboard data
  - Enables batch export (ExportPanel.tsx) and multi-format campaign workflows
- **Integration with ProAnimate:**
  - `useCanvasStore` must be extended with an `artboards: Artboard[]` array and `activeArtboardId` selector. Current `canvasWidth`, `canvasHeight`, `canvasZoom`, `canvasPanX`, `canvasPanY` become per-artboard properties plus a global viewport state for the infinite canvas
  - `useTimelineStore` must scope `tracks`, `clips`, `totalFrames`, `fps`, `currentFrame`, and `isPlaying` per artboard
  - `VideoCanvas.tsx` needs a wrapper component (`InfiniteCanvasWorkspace`) that renders artboard frames at world positions, using CSS `transform: translate() scale()` for viewport transformation
  - `SelectionTransformBox.tsx` remains unchanged but must respect artboard boundaries
  - `compositionBuilder.ts` must build props per artboard for independent export
  - The orchestrator (`orchestrator.ts`) should gain an option to generate multi-format plans (e.g., "Create this video in both 16:9 and 9:16") that produce multiple artboards
- **Use cases:**
  1. A social media manager creates a product launch animation and needs 16:9 (YouTube), 9:16 (TikTok/Reels), and 1:1 (Instagram post) versions simultaneously, reusing the same character and script across all three while adjusting layout per format.
  2. An educator builds a multi-scene lesson where Scene 1 is an intro, Scene 2 is the main content, and Scene 3 is a quiz recap, viewing them all side by side to ensure consistent visual branding and timing.
  3. A content creator uses the orchestrator to auto-generate a video, then manually duplicates the artboard to create an alternate version with different text overlays for A/B testing.
- **Why it matters:** Multi-artboard workspaces are the industry standard in modern design tools (Figma, Sketch, Jitter). Without it, users who need multi-format output must maintain separate projects or manually duplicate and resize, which is time-consuming and error-prone. For ProAnimate's target market of short-form content creators who publish across TikTok, YouTube Shorts, and Instagram Reels simultaneously, this is a workflow-defining feature. It also unlocks batch export, a premium feature that drives plan upgrades.
- **Who has it:** Jitter (released February 2025, their flagship infinite canvas with multi-artboard support), Figma (infinite canvas is foundational), Rive (artboards for state-based animations), Canva (multi-page/artboard system).
- **Gold standard:** Jitter's implementation is the benchmark for animation tools. Their infinite canvas lets users create multiple artboards in one file, each with independent animations and timelines. Artboards can be different sizes and aspect ratios. The workspace supports standard Figma-like interactions (zoom with scroll wheel, pan with space+drag, fit-all with Cmd+0). Assets can be copied between artboards freely. Export targets individual artboards or batches. The Figma plugin import brings entire multi-frame Figma files onto the canvas as multiple artboards, preserving layout. The canvas uses GPU-accelerated rendering to maintain performance even with dozens of artboards visible simultaneously.

---

### 44. Pen Tool for Custom Vectors

- **Category:** Canvas & Design Tools
- **What it is:** A Bezier curve drawing tool that enables users to create custom vector shapes and paths directly on the canvas using anchor points and control handles.
- **What it does:** Provides a precise point-and-click drawing instrument where users place anchor points to define a path. Each anchor point can have two Bezier control handles that determine the curvature of the path segments entering and leaving that point. Users can create straight lines (click without dragging), smooth curves (click and drag to pull handles), and corner points (Alt+click to break handle symmetry). Completed paths can be filled, stroked, animated with keyframes (position, scale, rotation, opacity, morph), and used as motion paths for other objects. The pen tool transforms ProAnimate from a template-assembly tool into a design-capable animation studio.
- **User flow:**
  1. User selects the Pen Tool from the left toolbar (shortcut: P).
  2. User clicks on the canvas to place the first anchor point.
  3. User clicks again to create a second point connected by a straight line segment, or clicks and drags to create a curved segment with Bezier handles.
  4. User continues adding points. Holding Cmd/Ctrl while clicking converts a smooth point to a corner point. Holding Alt while dragging a handle breaks handle symmetry for asymmetric curves.
  5. User closes the path by clicking on the first point (a circle indicator appears on hover), or presses Enter/Escape to leave the path open.
  6. The completed shape appears in the Layers panel and can be styled (fill color, stroke color/width, opacity) in the right property panel.
  7. User can switch to the Direct Selection tool (A) to edit individual anchor points and handles post-creation.
  8. User can animate the shape by adding keyframes for position, scale, rotation, opacity, or use shape morphing to transition between two different path shapes.
- **Properties/Parameters:**
  - Path data: Array of anchor points, each with: position (x, y), inHandle (dx, dy), outHandle (dx, dy), pointType (smooth | corner | symmetric)
  - Fill: color (hex/rgba), opacity (0-1), fill rule (evenodd | nonzero)
  - Stroke: color (hex/rgba), width (0-100px, default: 2), opacity (0-1), dash pattern (solid, dashed, dotted, custom), line cap (butt | round | square), line join (miter | round | bevel)
  - Path closed: boolean (default: true for shapes, false for lines)
  - Animatable properties: position, scale, rotation, opacity, individual anchor point positions (for morph), stroke dashoffset (for draw-on effect)
  - Snapping: to grid (configurable grid size), to other points, to guides, smart snapping to 0/45/90 degree angles when holding Shift
  - Path operations: union, subtract, intersect, exclude (boolean operations on overlapping paths)
- **Output:** SVG-compatible vector shapes rendered on the canvas, animatable through the keyframe system, and exportable as part of the video composition or as standalone SVG files.
- **Acceptance criteria:**
  - Click-to-place creates straight line segments between anchor points
  - Click-and-drag creates smooth Bezier curves with visible control handles
  - Alt+click on a smooth point converts it to a corner point (and vice versa)
  - Shift+click constrains new segments to 45-degree increments
  - Hovering over the start point while drawing shows a "close path" indicator (small circle)
  - Pressing Escape or Enter completes an open path
  - Direct Selection tool (A) allows editing individual anchor points and handles after creation
  - Paths render at full quality at any zoom level (vector rendering, not rasterized)
  - Paths can be filled, stroked, and styled via the right panel
  - Paths are animatable through the existing keyframe system (position, scale, rotation, opacity)
  - Shape morphing: two paths with the same number of anchor points can interpolate between shapes across keyframes
  - Stroke dashoffset animation enables "draw-on" line animation effects
  - Boolean path operations (union, subtract, intersect, exclude) work on selected overlapping paths
  - Paths export correctly in video compositions via `canvas2dRenderer.ts`
- **Edge cases:**
  - Morphing between paths with different anchor point counts: automatically add intermediate points to the path with fewer points (point matching algorithm) or display a warning suggesting the user match point counts
  - Very small paths (under 5px) should still be selectable, with a minimum hit-test area of 10px
  - Self-intersecting paths should render correctly with the configured fill rule (evenodd vs. nonzero)
  - Zooming while drawing should not affect point placement accuracy (all coordinates stored in artboard space, not screen space)
  - Undo during path creation should remove one point at a time; undo after path completion should remove the entire path
  - Importing SVG paths from external files should populate the pen tool's data structure for further editing
- **Dependencies:**
  - Extends `useShapeStore` or requires a new `useVectorPathStore` to manage path data
  - Integrates with `SelectionTransformBox.tsx` for bounding-box transforms on completed paths
  - Integrates with `useKeyframeStore` for animation
  - Requires extending `canvas2dRenderer.ts` and `RemotionShapeLayer.tsx` to render Bezier paths
  - SVG export capability leverages the existing SVG system (`svgComposer.ts`)
- **Integration with ProAnimate:**
  - Vector paths should be a new `KeyframableObjectType` value (e.g., `'vectorPath'`) in `keyframes.ts`
  - Paths stored as a new layer type alongside existing shapes in `useShapeStore.ts` or a dedicated `useVectorPathStore.ts` (Zustand + Immer)
  - `ShapeLayer.tsx` extended to render Bezier paths using Canvas 2D `bezierCurveTo()` calls, or a new `VectorPathLayer.tsx` component
  - `canvas2dRenderer.ts` updated to render paths during export
  - `VideoComposition.tsx` and Remotion export pipeline updated with a `RemotionVectorPathLayer.tsx`
  - The orchestrator's SVG generation step could use the pen tool's path data structure to enable AI-generated custom shapes that users can then manually refine
  - Paths can serve as motion paths for other objects (text, characters, media), enabling "move along path" animation
- **Use cases:**
  1. A motion designer creates a custom logo animation by drawing the logo shape with the pen tool, then animating the stroke dashoffset to create a "drawing on" reveal effect.
  2. A content creator draws a custom speech bubble shape that cannot be achieved with the built-in rectangle/circle shapes, fills it with a color, and places it behind dialogue text.
  3. An animator creates two different blob shapes and uses shape morphing to smoothly transition between them as a background decorative element in a TikTok video.
- **Why it matters:** The pen tool is a foundational design tool that separates professional animation platforms from template-only tools. Without it, users are limited to predefined shapes (rectangle, circle, triangle, star) and must import custom vectors from external tools. Adding a pen tool means users can complete their entire design-to-animation workflow within ProAnimate. Competitors like Jitter (July 2025 release) and Rive have pen tools with morphing. For the power-user segment (freelance motion designers), this is often a dealbreaker feature.
- **Who has it:** Jitter (pen tool with morphing, released July 2025), Rive (full vector editing suite with pen tool), Linearity Move (pen tool inherited from Linearity Curve), Figma (pen tool for static design, imported to animation tools), Adobe After Effects (pen tool for masks and shape layers).
- **Gold standard:** Jitter's pen tool and morphing system is the gold standard for web-based animation tools. Users click to create anchor points, drag to create curves, and hold Cmd to convert point types. The tool supports smooth transitions between any two custom shapes (morphing) as a first-class animation type. Bezier handles are visible and draggable with precise control. The integration with their animation timeline is seamless: shape morph animations appear as keyframes on the timeline, with easing curves applied to the morph interpolation. All paths render as resolution-independent vectors, and the Lottie exporter fully supports vector shape animations.

---

### 50. Formulas in Input Fields

- **Category:** Canvas & Design Tools
- **What it is:** The ability to type mathematical expressions (arithmetic operations) directly into any numeric input field in the editor, with the expression evaluated and resolved to a numeric value instantly.
- **What it does:** When a user types a mathematical expression like `1920/2`, `100+50`, `1080*0.75`, or `360-45` into any numeric property input field (position, size, rotation, opacity, keyframe values, timeline values), the field evaluates the expression and replaces it with the computed result. This eliminates the need for external calculators or mental math when positioning elements precisely. The feature supports the four basic arithmetic operators (+, -, *, /) along with parentheses for order of operations. It can also reference the current value using a special token, enabling relative adjustments like `+50` (add 50 to current value) or `*2` (double the current value).
- **User flow:**
  1. User clicks on any numeric input field (e.g., X position of a text overlay, currently showing "480").
  2. User types `1920/2` to center the element horizontally on a 1920px canvas.
  3. On pressing Enter or clicking away (blur), the field evaluates the expression and displays "960".
  4. Alternatively, user types `+100` in the X position field, which adds 100 to the current value, changing "480" to "580".
  5. User can type `*1.5` to multiply the current width by 1.5.
  6. Complex expressions with parentheses are supported: `(1080-200)/2` evaluates to "440".
  7. If the expression is invalid (e.g., `abc`, `/0`), the field reverts to the previous value and briefly flashes red.
- **Properties/Parameters:**
  - Supported operators: `+`, `-`, `*`, `/`
  - Parentheses: `(`, `)` for grouping
  - Special tokens: leading `+`, `-`, `*`, `/` without a left operand uses the current field value as the implicit left operand (e.g., `+50` means `currentValue + 50`)
  - Supported input types: all `DraggableNumberInput` instances, all numeric fields in property panels (position x/y, width, height, rotation, opacity, scale, font size, stroke width, border radius, keyframe values, timeline frame numbers)
  - Precision: results rounded to the field's configured decimal places (0 for pixels/frames, 1 for percentages, 2 for opacity/scale)
  - Division by zero: returns previous value with error flash
  - Maximum expression length: 50 characters
  - Evaluation engine: safe parser (no eval), supports only numeric literals and arithmetic operators
- **Output:** The numeric input field displays the computed result of the expression, updating the corresponding property in the store.
- **Acceptance criteria:**
  - Typing `1920/2` in any numeric field and pressing Enter produces `960`
  - Typing `+50` in a field currently showing `100` produces `150`
  - Typing `*2` in a field currently showing `50` produces `100`
  - Typing `(1080-200)/2` produces `440`
  - Invalid expressions (letters, division by zero, unmatched parentheses) revert to the previous value with a brief red flash animation
  - The feature works in all numeric inputs: `DraggableNumberInput`, position/size fields, rotation, opacity, keyframe value inputs, font size, stroke width
  - Expressions are evaluated on Enter keypress and on blur (clicking away)
  - The evaluation uses a safe parser (not JavaScript `eval()`) to prevent code injection
  - Numbers with decimals work: `1080/3` produces `360` (or `360.0` depending on field precision)
  - Negative results are allowed where the field accepts negative values (e.g., position fields)
  - Negative results are clamped for fields that don't accept negatives (e.g., opacity clamped to 0-1, width clamped to minimum 1)
- **Edge cases:**
  - Very large results (e.g., `999999*999999`) should be clamped to the field's maximum allowed value
  - Expressions with only whitespace should be treated as "no change"
  - Pasting an expression from clipboard should work the same as typing it
  - If the user is using the drag-to-scrub feature on `DraggableNumberInput`, formula entry should only activate when the user explicitly clicks to enter text editing mode
  - Locale-specific decimal separators (comma vs. period) should be handled: always accept period as decimal separator, optionally accept comma if locale uses it
  - Chained operations without parentheses follow standard order of operations: `2+3*4` = `14`, not `20`
- **Dependencies:**
  - Requires modification to `DraggableNumberInput.tsx` (the primary numeric input component)
  - No external library dependencies; a lightweight expression parser can be implemented in under 100 lines
- **Integration with ProAnimate:**
  - The primary integration point is `src/components/ui/DraggableNumberInput.tsx`, which is used across the entire application for all numeric property inputs
  - The expression parser should be a standalone utility function (e.g., `src/utils/expressionEvaluator.ts`) that can be unit tested independently
  - All property panels in `RightPanel/` use `DraggableNumberInput`, so this feature automatically propagates to position, size, rotation, opacity, and keyframe value editing
  - Timeline frame number inputs in `TimeRuler.tsx` and `TimelineControls.tsx` should also support formulas
  - The orchestrator and AI systems do not need modification since they set values programmatically
- **Use cases:**
  1. A designer needs to center a 400px-wide element on a 1920px canvas and types `(1920-400)/2` in the X position field to get `760` precisely, rather than guessing or using a calculator.
  2. A motion designer wants to create evenly spaced elements and types `1080/5` in the Y position field for the first element, then `1080/5*2`, `1080/5*3`, etc., for subsequent elements.
  3. An animator needs to rotate an element by one-third of a full rotation and types `360/3` in the rotation field to get exactly `120` degrees.
- **Why it matters:** This is a small but high-impact quality-of-life feature that eliminates friction in precise design work. Professional designers frequently need to calculate positions, sizes, and spacing mathematically. Forcing them to use an external calculator or do mental math slows down their workflow. Jitter added this in January 2026, and Figma has supported math in input fields for years. It signals professional-grade attention to workflow detail and is expected by users coming from Figma/Sketch backgrounds. Implementation cost is very low relative to user satisfaction impact.
- **Who has it:** Jitter (released January 2026), Figma (long-standing feature), Sketch (long-standing feature), Adobe After Effects (expressions in property fields, far more advanced), Framer (supports math in inputs).
- **Gold standard:** Figma's implementation is the gold standard for design tool math inputs. Any numeric field accepts arithmetic expressions with +, -, *, / and parentheses. Leading operators reference the current value (typing `+10` adds 10). Results respect the field's precision (integer for pixels, decimal for percentages). Expressions evaluate on Enter or blur. Invalid expressions revert silently. The implementation is invisible until needed: fields look and behave like normal number inputs until the user types an operator or parenthesis. Jitter's recent implementation follows the same pattern, described as "quick math" in numeric fields.

---

## Category 6: Export & Output

### 3. GIF Export

- **Category:** Export & Output
- **What it is:** The ability to export animations as animated GIF image files, suitable for sharing on platforms that do not support video embeds.
- **What it does:** Renders the animation frame by frame to an offscreen canvas, then encodes each frame into an animated GIF file using a client-side GIF encoder. The encoder applies color quantization (reducing each frame to a maximum of 256 colors), optional dithering to smooth color transitions, and frame-level optimization (detecting unchanged regions between frames and only encoding deltas). Users can configure frame rate, dimensions, color count, dithering mode, and loop behavior. The resulting GIF is downloaded as a file or copied to clipboard. Due to GIF's 256-color limitation, the feature includes a quality preview that shows how the animation will look after color quantization before committing to the full export.
- **User flow:**
  1. User opens the Export panel and selects "GIF" from the format selector (alongside existing WebM and MP4 options).
  2. A GIF-specific settings section appears with resolution, frame rate, color count, dithering, and loop options.
  3. User adjusts settings. A small preview thumbnail updates in near-real-time showing the quantized color appearance.
  4. User clicks "Export GIF."
  5. Progress bar shows frame rendering and encoding progress.
  6. On completion, the GIF file downloads automatically and file size is displayed.
  7. Optionally, user can click "Copy to Clipboard" to paste the GIF directly into messages or documents.
- **Properties/Parameters:**
  - Resolution: match canvas (default), 720p, 480p, 360p, 240p, custom (width x height)
  - Frame rate: 10fps (small file), 15fps (default, good balance), 25fps (smooth), 50fps (maximum quality)
  - Max colors: 64, 128, 256 (default)
  - Dithering: None (default for motion graphics/flat design), Floyd-Steinberg (best for photographic/gradient content), Ordered/Bayer (artistic stipple effect)
  - Loop count: infinite (default), 1, 2, 3, custom number
  - Transparent background: boolean (default: false). When enabled, one palette color is designated as transparent
  - Quality preset: Quick (10fps, 480p, 128 colors, no dithering), Standard (15fps, 720p, 256 colors, no dithering), High Quality (25fps, 1080p, 256 colors, Floyd-Steinberg)
  - Frame range: full animation (default), work area (in/out points), custom range
- **Output:** An animated GIF file (.gif) downloaded to the user's device. File size displayed in the export panel. Optional clipboard copy.
- **Acceptance criteria:**
  - GIF export option appears in the format selector in ExportPanel.tsx
  - Exported GIF plays correctly in all major browsers, messaging apps (Slack, Discord, iMessage), and social platforms (Twitter/X, Reddit)
  - Frame rate matches the selected option (verified by frame count and duration)
  - Color quantization produces acceptable visual quality at 256 colors for typical motion graphics content
  - Dithering options visibly affect output quality (Floyd-Steinberg produces smoother gradients)
  - Transparent background option produces GIFs with correct alpha using a designated transparent color index
  - Export progress reports accurately (percentage, estimated time remaining)
  - File size is displayed after export completion
  - Export can be cancelled mid-process
  - GIF encoding runs in a Web Worker to avoid blocking the main thread
  - Maximum output dimensions are capped at 1920x1920 to prevent memory issues
  - Work area (in/out points) from useTimelineStore are respected when frame range is set to "work area"
- **Edge cases:**
  - Animations with many unique colors per frame (e.g., video footage backgrounds) will produce large GIFs with visible banding. Display a warning when estimated file size exceeds 20MB suggesting the user reduce resolution or frame rate
  - Transparent GIFs only support binary transparency (fully transparent or fully opaque), not semi-transparency. Semi-transparent pixels should be thresholded at 50% alpha. Display a note explaining this limitation
  - Very long animations (over 30 seconds) should display a warning about file size and suggest trimming or using video format instead
  - Browser memory constraints: for 1080p at 25fps, a 10-second GIF requires encoding 250 frames. Each frame at 1080p is ~8MB uncompressed. Use streaming encoding (write frames incrementally) rather than accumulating all frames in memory
  - GIF loop count of 1 means the animation plays once and stops on the last frame. Some platforms ignore loop count and loop infinitely regardless
- **Dependencies:**
  - Requires a client-side GIF encoder library (gif.js, gifenc, or modern-gif) or a custom Web Worker-based encoder
  - Leverages existing `canvas2dRenderer.ts` for frame rendering
  - Extends `ExportPanel.tsx` with GIF-specific UI
  - Extends `videoExport.ts` with a new `exportGif()` function
- **Integration with ProAnimate:**
  - `videoExport.ts` gains a new `exportGif()` function alongside the existing `exportVideo()`. It reuses the same `renderFrame()` pipeline from `canvas2dRenderer.ts` but routes rendered frames to a GIF encoder instead of WebCodecs/MediaRecorder
  - `ExportPanel.tsx` adds 'gif' to `FORMAT_OPTIONS`, with conditional UI for GIF-specific settings (color count, dithering, loop)
  - The `ExportOptions` interface in `videoExport.ts` extends to include `format: 'webm' | 'mp4' | 'gif'` and GIF-specific options
  - `ExportProgress` callbacks work identically for GIF as for video
  - Work area from `useTimelineStore` (inPoint/outPoint) drives frame range selection
  - The GIF encoder runs in a Web Worker, communicating via postMessage with frame ImageData
- **Use cases:**
  1. A social media manager needs a looping product animation for an email newsletter where video embeds are not supported, exporting a 5-second loop as a 480p GIF at 15fps.
  2. A developer wants to embed an animation demo in a GitHub README, which supports GIF images but not video players, exporting at 720p with low frame rate to keep file size under 5MB.
  3. A designer exports a logo animation as a transparent GIF to overlay on different colored backgrounds in a web page.
- **Why it matters:** GIF remains the most universally supported animation format across email clients, documentation platforms (GitHub, Notion, Confluence), messaging apps, and social media. While video is technically superior, GIF's ubiquity makes it essential for many professional workflows. Every major competitor (Jitter, Swishy, AutoAE, Lottielab) offers GIF export. Its absence is a frequent reason users export from ProAnimate and then use a separate converter tool, which is friction that causes churn.
- **Who has it:** Jitter (15/25/50fps, transparent support, optimized file sizes), Lottielab Magic Animator (GIF export), AutoAE (up to 4K on Enterprise), Swishy (up to 4K), SVGator (GIF with extensive settings), Canva (GIF export), Giphy (GIF creation tool).
- **Gold standard:** Jitter's GIF export is the benchmark. It offers three frame rate tiers (15, 25, 50fps), transparent background support, and automatic optimization that produces files 2x smaller on average than naive encoding. Export speed is 2-3x faster than previous versions due to optimized quantization. The simplicity stands out: no complicated settings, just choose quality tier, and the file is ready. Under the hood, they use frame-differencing optimization to only encode changed pixels between frames, dramatically reducing file size for animations with static backgrounds.

---

### 4. 4K Export

- **Category:** Export & Output
- **What it is:** The ability to export video at 3840x2160 resolution (4K UHD), four times the pixel count of 1080p.
- **What it does:** Scales the rendering pipeline to produce 3840x2160 pixel output by rendering each frame to a larger offscreen canvas and encoding at 4K resolution. The existing WebCodecs (H.264) and MediaRecorder (VP8/VP9) pipelines encode frames at the higher resolution with appropriate bitrate adjustments. 4K export requires more memory and processing time, so the feature includes automatic quality estimation (showing expected file size and export duration before starting) and progressive rendering that writes encoded chunks to disk/blob incrementally rather than accumulating the entire video in memory.
- **User flow:**
  1. User opens ExportPanel and sees resolution options: 480p, 720p, 1080p (current max), 1440p (new), 4K/2160p (new).
  2. User selects "4K (3840x2160)" from the resolution dropdown.
  3. The panel displays estimated file size and export time based on duration and quality settings.
  4. A note appears: "4K export may be slower. Ensure your device has sufficient memory (4GB+ available)."
  5. User clicks "Export." Rendering proceeds frame by frame with progress updates.
  6. On completion, the 4K video file downloads.
- **Properties/Parameters:**
  - Resolution: 3840x2160 (for 16:9), proportionally scaled for other aspect ratios (2160x3840 for 9:16, 2160x2160 for 1:1, 2880x2160 for 4:3, 5040x2160 for 21:9)
  - Bitrate: auto-calculated based on resolution and quality. Recommended: 20-40 Mbps for H.264 4K, 15-30 Mbps for VP9 4K
  - Codec: H.264 (WebCodecs path), VP8/VP9 (MediaRecorder fallback)
  - Quality: High (40Mbps), Medium (25Mbps), Low (15Mbps)
  - FPS: same options as standard export (24, 25, 30, 60)
  - Maximum duration at 4K: 10 minutes (to prevent browser memory issues)
  - Hardware acceleration: leveraged when available via WebCodecs
- **Output:** A 3840x2160 video file in MP4 (H.264) or WebM (VP8/VP9) format.
- **Acceptance criteria:**
  - Exported video has actual pixel dimensions of 3840x2160 (verified by mediainfo or ffprobe)
  - All canvas layers render correctly at 4K: text is sharp (not pixelated), SVG objects scale cleanly, character sprites use highest available resolution, HTML templates render at 4K in their iframes
  - Export completes without out-of-memory crashes on devices with 8GB+ RAM
  - Progress reporting is accurate and includes estimated time remaining
  - Bitrate is appropriate for the resolution (not using 1080p bitrates, which would produce artifacts)
  - The 4K option is disabled (grayed out with tooltip) on devices detected to have insufficient memory or no hardware encoder support
  - Character sprite images that are lower resolution than 4K are upscaled using bicubic interpolation, not nearest-neighbor
  - Lottie animations render at 4K natively (vector, no quality loss)
  - HTML template iframes render at 4K dimensions
- **Edge cases:**
  - On devices with less than 4GB available memory, display a warning and suggest 1440p as an alternative
  - If the WebCodecs encoder rejects the 4K configuration (some hardware encoders cap at 1080p or 1440p), fall back to software encoding via MediaRecorder at lower bitrate with a notification to the user
  - 4K at 60fps produces very high data rates (~240Mbps raw). The encoder should use a reasonable target bitrate and display the expected file size before starting
  - Canvas 2D context has a maximum size that varies by browser (typically 16384x16384 on Chrome, 4096x4096 on some mobile Safari versions). Verify canvas creation succeeds before starting export
  - raster images on the canvas (character sprites, stock photos) at lower native resolution will appear blurry when upscaled to 4K. Display a quality indicator showing which layers are below native 4K resolution
- **Dependencies:**
  - Extends `ExportPanel.tsx` RESOLUTION_OPTIONS with new entries
  - Extends `videoExport.ts` to handle larger canvas dimensions and appropriate bitrate calculations
  - `canvas2dRenderer.ts` already supports arbitrary canvas sizes but must be tested for memory usage at 4K
  - `pixiExportRenderer.ts` (GPU path) must handle 4K framebuffer allocation
- **Integration with ProAnimate:**
  - `ExportPanel.tsx` currently defines `RESOLUTION_OPTIONS` as 1080p/720p/480p. Add `{ label: '1440p (2K)', scale: 1.333 }` and `{ label: '4K (2160p)', scale: 2.0 }` to this array
  - `ASPECT_DIMENSIONS` in ExportPanel.tsx maps aspect ratios to base dimensions at 1080p. The scale factor multiplies these base dimensions (e.g., 1920x1080 * 2.0 = 3840x2160)
  - `videoExport.ts` `ExportOptions` already has `width` and `height` fields; no interface changes needed. Bitrate auto-calculation logic should be added based on pixel count
  - `canvas2dRenderer.ts` `renderFrame()` receives canvas dimensions through the canvas element itself and should work at 4K without modification, but preloadImages should request higher resolution variants when available
  - `pixiExportRenderer.ts` needs to check `gl.getParameter(gl.MAX_RENDERBUFFER_SIZE)` to verify 4K framebuffer support
  - HTML templates in `HTMLTemplateLayer.tsx` iframes need their viewports sized to 4K dimensions during export
- **Use cases:**
  1. A brand produces a product launch video that will be displayed on a 4K monitor at a trade show, requiring native 4K resolution to avoid upscaling artifacts.
  2. A YouTube creator exports at 4K because YouTube applies less compression to 4K uploads (serving them via VP9/AV1 instead of H.264), resulting in better visual quality even for viewers watching at 1080p.
  3. An agency delivers master files at 4K to a client for future-proofing, even though current distribution is at 1080p.
- **Why it matters:** 4K is the expected resolution ceiling for professional video delivery in 2026. YouTube, TikTok, and Instagram all support 4K uploads, and YouTube specifically provides higher-quality encoding for 4K content. Every major competitor (Jitter, AutoAE, Swishy, Cardboard, Motionvid.ai, Lottielab) offers 4K export. For ProAnimate's target market of content creators and agencies, the lack of 4K is a tangible gap that signals the product is not ready for professional use. 4K export is also a natural premium/pro tier feature that drives plan upgrades.
- **Who has it:** Jitter (up to 4K on Pro/Studio plans), AutoAE (up to 4K on Enterprise), Swishy (up to 4K), Cardboard (up to 4K 60fps, unlimited exports), Lottielab Magic Animator (MP4 up to 4K), Motionvid.ai (4K on Pro, 8K on Enterprise).
- **Gold standard:** Cardboard's export is the gold standard for browser-based 4K: unlimited exports at up to 4K 60fps using WebGPU and WebCodecs, with no watermarks or per-export limits. Their WebGPU renderer handles 4K frames efficiently with GPU compositing. Jitter's approach is also excellent: 4K is available on Pro plans, with clear file size estimates shown before export begins. Their encoding is fast due to hardware-accelerated WebCodecs, and they handle the memory management transparently so users never encounter out-of-memory errors.

---

### 11. Lottie JSON Export

- **Category:** Export & Output
- **What it is:** The ability to export compatible animation layers from ProAnimate as Lottie JSON files, the industry-standard format for lightweight, scalable, interactive animations on web and mobile platforms.
- **What it does:** Analyzes the current composition and serializes supported layers (shape layers, text overlays, SVG objects, vector paths, Lottie animations, solid fills) into a Bodymovin-compatible JSON structure. Each supported layer's position, scale, rotation, opacity keyframes and easing curves are converted to Lottie's keyframe format. Unsupported layers (raster images, video, 3D characters, HTML templates) are flagged in a compatibility report before export. The exported JSON file can be used in any Lottie player (lottie-web, lottie-ios, lottie-android, rive-lottie) or uploaded to LottieFiles for sharing. The export targets the latest Lottie specification for maximum player compatibility.
- **User flow:**
  1. User opens the Export panel and selects "Lottie JSON" from the format selector.
  2. A compatibility panel appears, listing each layer with a green checkmark (compatible) or yellow warning (unsupported/partially supported).
  3. Unsupported layers show a tooltip explaining why (e.g., "Raster images cannot be embedded in Lottie" or "3D characters are not supported by Lottie format").
  4. User can toggle individual layers on/off for the export.
  5. User clicks "Export Lottie JSON."
  6. The JSON file is generated client-side and downloaded.
  7. A preview player (using lottie-web) displays the exported result inline for verification before downloading.
  8. Optionally, user can click "Upload to LottieFiles" for direct publishing.
- **Properties/Parameters:**
  - Output format: .json (Lottie JSON) or .lottie (dotLottie compressed format)
  - Lottie version target: latest (default), or specific version for compatibility
  - Canvas dimensions: exported as Lottie's `w` and `h` properties (matching artboard dimensions)
  - Frame rate: exported as Lottie's `fr` property (matching project fps)
  - Duration: exported as `ip` (in-point) and `op` (out-point) frame values
  - Layer inclusion: toggle per layer. Only supported layer types: shape layers (rectangle, circle, triangle, star, vector paths), text layers, solid color fills, SVG objects (converted to shape layers), existing Lottie layers (pass-through)
  - Keyframe properties exported: position (x, y), scale (x, y), rotation, opacity, anchor point
  - Easing export: linear, ease-in, ease-out, ease-in-out, and cubic-bezier mapped to Lottie's bezier keyframe format (`i` and `o` handle objects)
  - Text options: export as shapes (maximum compatibility) or as text layers (editable but requires font loading)
  - Asset embedding: inline SVG assets as shape data; optionally embed small raster images as base64 (with size warning)
- **Output:** A .json file conforming to the Bodymovin/Lottie animation format, playable in any Lottie-compatible player across web, iOS, Android, and desktop platforms.
- **Acceptance criteria:**
  - Exported JSON validates against the Lottie specification (parseable by lottie-web without errors)
  - Shape layers (rectangle, circle, star, triangle) export with correct dimensions, fill color, stroke, and border radius
  - Text overlays export with correct font family, font size, color, alignment, and content
  - Position, scale, rotation, and opacity keyframes export with correct timing and values
  - Easing curves export correctly: linear, ease-in/out/in-out map to appropriate bezier handles in Lottie's keyframe format
  - Custom cubic-bezier easings export with the exact control point values
  - The exported animation plays identically in lottie-web compared to ProAnimate's canvas preview (within acceptable tolerance for unsupported features)
  - Compatibility report accurately identifies supported vs. unsupported layers
  - File size is reasonable: typical motion graphics animation under 500KB
  - Inline preview player correctly renders the exported JSON before download
  - dotLottie compressed format option reduces file size by 50-70% compared to raw JSON
- **Edge cases:**
  - Compositions with only unsupported layers (all raster/video/3D) should display a clear message: "No Lottie-compatible layers found" with suggestions to add text or shape layers
  - Very complex compositions with many layers may produce large JSON files (10MB+). Display file size estimate and suggest simplification
  - Text with non-standard fonts: warn that the font must be loaded by the Lottie player, or offer to export text as shapes (which increases file size but removes font dependency)
  - ProAnimate's extended easing types (spring, elastic, bounce) do not have direct Lottie equivalents. These should be approximated as multi-segment cubic bezier curves with a note in the compatibility report
  - Lottie does not support audio. If the composition has audio, note that it will not be included in the export
  - Nested compositions or grouped layers should be flattened or exported as precomps in the Lottie structure
- **Dependencies:**
  - Requires a Lottie serializer module (new `src/services/lottieExporter.ts`)
  - Leverages existing keyframe data from `useKeyframeStore`
  - Leverages shape data from `useShapeStore`
  - Leverages text data from `useTextOverlayStore`
  - Uses lottie-web (already installed) for preview playback
  - Optional: LottieFiles API integration for direct upload
- **Integration with ProAnimate:**
  - New service file `src/services/lottieExporter.ts` that reads from `useShapeStore`, `useTextOverlayStore`, `useSVGObjectStore`, `useKeyframeStore`, and `useAnimationStore` to construct the Lottie JSON
  - Each `EasingType` in `keyframes.ts` needs a mapping function to Lottie bezier handles. Linear = `{x: [0], y: [0]}` in/out, ease-in = `{x: [0.42], y: [0]}` / `{x: [1], y: [1]}`, etc. The existing `CubicBezierParams` (x1, y1, x2, y2) maps directly to Lottie's keyframe interpolation format
  - `ExportPanel.tsx` adds 'lottie' to `FORMAT_OPTIONS` with Lottie-specific UI (compatibility report, text export mode toggle)
  - The `useSVGObjectStore` SVG shapes can be decomposed into Lottie-native shape primitives (paths, fills, strokes)
  - Existing Lottie animations from `useAnimationStore` (imported via sampleAnimations or user upload) can be passed through directly as pre-composed layers
  - The orchestrator's SVG generation step could tag AI-generated SVG objects as "Lottie-exportable" when they use only supported primitives
- **Use cases:**
  1. A web developer creates a loading animation in ProAnimate with shapes and text, exports as Lottie JSON, and embeds it on their website using lottie-web for a lightweight, scalable animation that loads instantly.
  2. A mobile app designer creates onboarding screen animations in ProAnimate, exports as Lottie, and hands them to the development team for native integration in iOS (lottie-ios) and Android (lottie-android) apps.
  3. A UI/UX designer creates micro-interaction animations (button hover states, page transitions) and exports them as Lottie files to share with the engineering team via LottieFiles.
- **Why it matters:** Lottie is the de facto standard for lightweight web and mobile animations, used by Netflix, Google, Airbnb, and thousands of apps. The Lottie ecosystem (LottieFiles marketplace, cross-platform players, Figma/After Effects plugins) represents a massive distribution channel. Lottie export transforms ProAnimate from a video-only tool into a cross-platform animation production tool, opening entirely new use cases (web animations, app animations, email animations). It is a key differentiator that competitors like Jitter and Lottielab already offer and that developer-adjacent users specifically seek out.
- **Who has it:** Jitter (Lottie export with latest spec compliance and automatic quality checks), Lottielab (Lottie is their primary format), LottieFiles Lottie Creator (native Lottie editing and export), SVGator (Lottie export from SVG animations), Rive (has its own .riv format but can export to Lottie for basic animations).
- **Gold standard:** Jitter's Lottie exporter is the gold standard for web animation tools. Their revamped exporter (October 2024) aligns with the latest Lottie specification, automatically checks exported files against editor previews for fidelity, supports all text effects, and has full mask animation compatibility. The export is instant with no complicated settings. Lottielab's approach is also notable: since Lottie is their native format, every animation operation maps 1:1 to Lottie capabilities, ensuring zero compatibility issues. Their Magic Animator generates AI animations that are fully editable as Lottie keyframes.

---

### 12. Transparent Video Export (ProRes 4444)

- **Category:** Export & Output
- **What it is:** The ability to export video with a preserved alpha (transparency) channel, enabling the animation to be layered over other footage in professional video editing software.
- **What it does:** Renders the animation with a transparent background (no background fill) and encodes the result into a format that preserves the alpha channel. The primary target format is Apple ProRes 4444 (.mov), the industry standard for transparent video in professional post-production. A secondary option is WebM with VP9 alpha channel support for web-based compositing. The export pipeline renders each frame with a transparent canvas (clearRect instead of fillRect), encodes RGBA data (4 channels instead of 3), and muxes into a container format that signals alpha presence to downstream players and editors.
- **User flow:**
  1. User opens the Export panel and enables the "Transparent Background" toggle.
  2. The canvas preview updates to show a checkerboard pattern behind the content, indicating transparency.
  3. User selects the export format: "MOV (ProRes 4444)" for professional NLE use, or "WebM (VP9 Alpha)" for web use.
  4. User adjusts resolution and quality settings.
  5. User clicks "Export."
  6. The rendering pipeline clears each frame to transparent instead of the background color, preserving alpha for all content.
  7. On completion, the file downloads. The export panel notes: "This file includes an alpha channel. Import into Premiere Pro, DaVinci Resolve, or Final Cut Pro for compositing."
- **Properties/Parameters:**
  - Format: MOV ProRes 4444 (default for transparent), WebM VP9 Alpha
  - ProRes profile: ProRes 4444 (4:4:4:4 with alpha, up to 16-bit), ProRes 4444 XQ (highest quality, larger files)
  - Alpha mode: straight (unassociated) or premultiplied (pre-multiplied with black or white). Default: straight
  - Resolution: up to 4K (same options as standard export)
  - Background: fully transparent (default when transparent mode is on)
  - Layers excluded from transparency: user can optionally include a solid background color layer that is rendered but marked as a separate alpha region
  - File size note: ProRes 4444 files are significantly larger than compressed H.264 (roughly 10-30x for the same duration)
- **Output:** A video file with alpha channel (.mov ProRes 4444 or .webm VP9 alpha) that can be imported into professional NLEs with full transparency preserved.
- **Acceptance criteria:**
  - Exported MOV file is recognized as ProRes 4444 with alpha by Premiere Pro, DaVinci Resolve, and Final Cut Pro
  - Transparent regions in the animation remain fully transparent when composited over other footage in an NLE
  - Semi-transparent elements (e.g., 50% opacity shapes) export with correct partial alpha values
  - WebM VP9 alpha option produces files playable in Chrome with transparency
  - The checkerboard preview in the canvas accurately represents what will be transparent in the export
  - Character layers, text overlays, shapes, and SVG objects all composite correctly with transparency
  - Anti-aliased edges of elements have correct alpha values (no black fringing from premultiplication errors)
  - File size estimates are shown before export (ProRes 4444 at 1080p 30fps ~1-2GB per minute)
- **Edge cases:**
  - ProRes encoding is not natively supported in browsers. This requires either: (a) server-side encoding via FFmpeg, (b) client-side FFmpeg.wasm, or (c) exporting a raw frame sequence (.png) that the user can convert. The recommended approach is FFmpeg.wasm for client-side encoding or a lightweight server-side encoding endpoint
  - WebM VP9 alpha has limited browser support for playback (Chrome supports it, Safari does not). Clearly label this option as "for web compositing" vs. ProRes for "professional NLE compositing"
  - Lottie background animations that fill the entire canvas will obscure transparency. Warn the user if background layers are detected and suggest disabling them
  - Very long transparent videos at high resolution produce extremely large files (multi-GB). Display estimated file size prominently and suggest shorter durations or lower resolution
  - Alpha channel interpretation differs between NLEs. Offer both straight and premultiplied options with explanatory tooltips
- **Dependencies:**
  - Requires FFmpeg.wasm for ProRes encoding (client-side) or a server-side encoding endpoint at `/api/encode-prores`
  - Extends `videoExport.ts` with transparent rendering mode and ProRes/VP9-alpha encoding paths
  - Extends `canvas2dRenderer.ts` to support transparent background rendering
  - Extends `ExportPanel.tsx` with transparent toggle and format-specific options
- **Integration with ProAnimate:**
  - `canvas2dRenderer.ts` `renderFrame()` currently fills the canvas with `#18181b`. When transparent mode is enabled, it should call `ctx.clearRect(0, 0, width, height)` instead, leaving the alpha channel at 0
  - `videoExport.ts` gains a new encoding path. For WebM VP9 alpha, the WebCodecs `VideoEncoder` can be configured with alpha: 'keep' on the VideoFrame. For ProRes, FFmpeg.wasm encodes the frame sequence using `-vcodec prores_ks -pix_fmt yuva444p10le`
  - `ExportPanel.tsx` adds a "Transparent Background" toggle that sets `transparentBg: true` on the export options. When enabled, format options change to show MOV ProRes 4444 and WebM VP9 Alpha instead of standard MP4/WebM
  - `VideoComposition.tsx` (Remotion path) should also support transparent mode for the Remotion player preview, replacing the `#18181b` background with a checkerboard CSS pattern
  - The `compositionBuilder.ts` should strip background Lottie/media layers when transparent mode is active, or layer them with a transparency note
- **Use cases:**
  1. A motion designer creates an animated lower-third title overlay in ProAnimate and exports as ProRes 4444, then imports it into Premiere Pro to composite over live-action interview footage.
  2. A content agency produces animated brand elements (logos, transitions, stingers) with transparent backgrounds for their clients to drop into any video project.
  3. A YouTuber creates an animated subscribe button overlay as a transparent WebM and adds it to their OBS streaming setup for live compositing.
- **Why it matters:** Transparent video export is essential for professional video production workflows where animations are composited over other footage. Without it, ProAnimate animations are limited to standalone videos. ProRes 4444 is the industry standard format that every professional NLE supports. This feature transforms ProAnimate from a standalone video creator into a professional asset production tool, dramatically expanding its addressable market to include post-production studios, agencies, and broadcast designers. The competitor landscape confirms demand: Jitter offers ProRes 4444, Hera offers transparent MOV export, and Malloy Portal specializes in transparent video.
- **Who has it:** Jitter (MOV ProRes 4444 with transparency), Hera (transparent MOV export), Malloy Portal (transparent video is their core value proposition), DaVinci Resolve (ProRes export natively), After Effects (ProRes and PNG sequence with alpha).
- **Gold standard:** Jitter's ProRes 4444 export is the gold standard for web-based animation tools. It exports MOV files with full alpha channel transparency that import cleanly into Premiere Pro, DaVinci Resolve, and Final Cut Pro. The transparent mode is toggled with a single switch, the canvas shows a checkerboard preview, and the ProRes encoding produces broadcast-quality output. The key differentiator is that it works entirely in the browser without requiring server-side processing, using WebCodecs with alpha frame support combined with a QuickTime-compatible muxer.

---

### 26. NLE XML Export (Premiere/DaVinci/FCP)

- **Category:** Export & Output
- **What it is:** The ability to export the ProAnimate timeline as an XML file compatible with professional non-linear editing software (Adobe Premiere Pro, DaVinci Resolve, Final Cut Pro), enabling users to continue editing in their preferred NLE.
- **What it does:** Serializes the ProAnimate timeline structure (tracks, clips, timing, transitions, media references) into one of three industry-standard XML formats: Final Cut Pro 7 XML (widely compatible across Premiere and Resolve), FCPXML (Final Cut Pro X native), or Adobe Premiere Pro XML. The exported XML preserves clip positions, durations, track ordering, and references to pre-rendered media assets. Each ProAnimate layer that contains renderable content is pre-exported as a video or image file, and the XML references these assets. This enables a round-trip workflow where animations are created in ProAnimate, then placed into a larger editing timeline alongside live-action footage in a professional NLE.
- **User flow:**
  1. User opens Export panel and selects "NLE XML" from the format options.
  2. User selects the target NLE: Premiere Pro (FCP7 XML), DaVinci Resolve (FCP7 XML or FCPXML), or Final Cut Pro (FCPXML).
  3. The panel displays a summary of what will be exported: number of tracks, clips, and media assets.
  4. User clicks "Export."
  5. ProAnimate pre-renders each layer/clip as individual media files (MP4 or PNG sequences) into a local folder.
  6. The XML file is generated with correct timecodes, track layout, and file references pointing to the pre-rendered assets.
  7. A ZIP file containing the XML and all media assets is downloaded.
  8. User opens the XML in their NLE, and all clips appear in the correct timeline positions.
- **Properties/Parameters:**
  - Target NLE format: FCP7 XML (default, compatible with Premiere Pro and DaVinci Resolve), FCPXML 1.10 (Final Cut Pro X), AAF (Avid Media Composer)
  - Timecode format: drop-frame or non-drop-frame, matching the project FPS
  - Frame rate: preserved from ProAnimate project settings
  - Resolution: preserved from project settings
  - Media export format: MP4 (H.264) per clip, or PNG sequence per frame for maximum quality
  - Track mapping: video tracks (V1, V2, ...) map to ProAnimate's layer stack. Audio tracks (A1, A2, ...) map to dialogue and music
  - Clip metadata: name (from ProAnimate layer name), in/out points, duration
  - Transitions: exported as dissolve/cross-fade transitions where ProAnimate has fade transitions between clips
  - Markers: ProAnimate's caption word timestamps can optionally be exported as timeline markers
- **Output:** A ZIP file containing an XML timeline file and a folder of pre-rendered media assets, importable into the target NLE.
- **Acceptance criteria:**
  - FCP7 XML imports successfully into Adobe Premiere Pro 2024+ with all clips in correct timeline positions
  - FCP7 XML imports successfully into DaVinci Resolve 18+ with correct track layout
  - FCPXML imports successfully into Final Cut Pro 10.6+ with correct timing
  - All pre-rendered media assets are correctly referenced and linked in the NLE after import
  - Track ordering matches ProAnimate's layer stack (bottom layer = V1, top layer = highest V track)
  - Clip in/out points and durations are frame-accurate
  - Audio tracks (dialogue, music) import with correct timing relative to video
  - Transitions between clips are preserved as cross-dissolves
  - The XML is well-formed and validates against the target DTD/schema
  - The ZIP file structure uses relative paths so it works when extracted to any location
- **Edge cases:**
  - Layers without explicit clips (e.g., shapes or text visible for the full duration) should be exported as single full-duration clips on their own video track
  - NLEs may not support all ProAnimate transition types. Unsupported transitions should fall back to simple cut or cross-dissolve with a note in the export summary
  - Very complex projects with 20+ layers may produce many video tracks. Some NLEs have track limits. Include a "flatten" option that composites multiple ProAnimate layers into fewer output tracks
  - Media file paths in XML must be relative and use forward slashes for cross-platform compatibility
  - If the user cancels during the pre-rendering phase, clean up any partially-written media files
  - FCP7 XML and FCPXML have different schemas and requirements. Maintain separate serializers for each
- **Dependencies:**
  - Requires `videoExport.ts` for per-layer rendering (rendering individual layers as separate video files)
  - Requires a new XML serializer module (`src/services/nleXmlExporter.ts`)
  - Depends on timeline data from `useTimelineStore`
  - Depends on layer data from all layer stores (media, text, shapes, characters, etc.)
  - File packaging requires JSZip or similar client-side ZIP library
- **Integration with ProAnimate:**
  - New service `src/services/nleXmlExporter.ts` reads from `useTimelineStore` (tracks, clips, fps, totalFrames), `useMediaStore`, `useTextOverlayStore`, `useShapeStore`, `useAnimationStore`, and other layer stores
  - `canvas2dRenderer.ts` needs a "render single layer" mode that isolates one layer at a time for per-layer export. Alternatively, export the full composition as one video and the XML references it as a single clip (simpler but less flexible in the NLE)
  - `ExportPanel.tsx` adds 'nle-xml' format option with NLE target selector
  - `useTimelineStore` track types ('video', 'audio', 'sprite') map to NLE track types
  - Caption timestamps from `useVoiceStore` can be converted to NLE markers for easy subtitle alignment in the NLE
  - The existing `compositionBuilder.ts` buildExportProps function can be extended to build per-layer export configurations
- **Use cases:**
  1. A video producer creates animated titles and graphics in ProAnimate, exports as FCP7 XML, and imports into their Premiere Pro project alongside live-action footage, placing the animated elements exactly where they are needed on the timeline.
  2. A post-production studio uses ProAnimate for motion graphics creation and DaVinci Resolve for color grading and final delivery, using XML export to bridge the two tools seamlessly.
  3. An agency produces animated ad content in ProAnimate and delivers both the rendered video files and the XML timeline to their client's in-house editing team, who can then make adjustments in their own NLE without needing ProAnimate.
- **Why it matters:** Professional video production workflows rarely live in a single tool. Editors use Premiere Pro, DaVinci Resolve, or Final Cut Pro as their primary editing environment and bring in assets from specialized tools. NLE XML export makes ProAnimate a first-class citizen in professional post-production pipelines rather than an isolated animation island. This is especially important for agency and enterprise customers who have established NLE workflows. Cardboard has demonstrated the value of this feature with their XML export to Premiere/DaVinci/FCP. The enterprise segment that values this feature is high-revenue and high-retention.
- **Who has it:** Cardboard (XML export for Premiere Pro, DaVinci Resolve, Final Cut Pro), Detail (one-click timeline export to FCP and Resolve), Eddie AI (one-click export to Resolve, Adobe, FCP), DaVinci Resolve (native XML import/export).
- **Gold standard:** Cardboard's implementation is the gold standard for AI-powered video tools. Their one-click export generates an XML timeline file with all media assets referenced, importable into Premiere Pro, DaVinci Resolve, or Final Cut Pro. The export preserves clip positions, durations, and track layout. Media assets are pre-rendered and bundled alongside the XML. The workflow is seamless: users edit with AI assistance in Cardboard, then export to their professional NLE for final polishing, color grading, and delivery.

---

### 40. Interactive Runtime Export (Rive Format)

- **Category:** Export & Output
- **What it is:** The ability to export animations as interactive, stateful runtime packages (.riv files or equivalent) that respond to user input (clicks, hovers, scroll) when embedded in web pages, mobile apps, or game engines.
- **What it does:** Converts ProAnimate's animation timeline into an interactive state machine model where different animation segments play in response to runtime events (user interactions, application state changes). The exported package contains the animation data, state machine definitions (states, transitions, inputs), and all visual assets in a compact binary format. At runtime, a lightweight player evaluates the state machine and plays the appropriate animation segment based on input triggers. This goes beyond passive video playback: the animation becomes a live, interactive UI element. The initial implementation targets a web-embeddable format (HTML + JS bundle with a canvas renderer) with the long-term goal of native runtime support via Rive-compatible or custom binary format.
- **User flow:**
  1. User opens the "Interactive Export" panel (accessible from Export section or a dedicated panel tab).
  2. User defines interaction states by splitting the timeline into named segments (e.g., "idle" = frames 0-60, "hover" = frames 61-120, "click" = frames 121-180).
  3. User creates a state machine by defining transitions: "idle --(on:mouseenter)--> hover", "hover --(on:mouseleave)--> idle", "hover --(on:click)--> click", "click --(on:animationEnd)--> idle".
  4. User configures trigger inputs: boolean (toggle states), number (scrub through animation based on scroll position), trigger (fire-and-forget events).
  5. User clicks "Export Interactive."
  6. The system generates a self-contained HTML+JS package (or .riv binary) containing all animation data and the state machine logic.
  7. User receives a ZIP with: an embeddable HTML snippet, a standalone JS runtime file, and usage documentation.
  8. Alternatively, user gets an embed code (iframe or script tag) for direct web integration.
- **Properties/Parameters:**
  - State definitions: array of { name: string, startFrame: number, endFrame: number, loop: boolean }
  - Transitions: array of { from: string, to: string, trigger: string, duration: number (blend frames), condition?: string }
  - Input types: boolean (true/false toggle), number (0-1 continuous value for scrub), trigger (one-shot event)
  - Built-in triggers: mouseenter, mouseleave, click, scroll, load, focus, blur
  - Custom triggers: named events callable via JavaScript API (e.g., `animation.fire('addToCart')`)
  - Export format: HTML+JS bundle (default), .riv (Rive-compatible, future), .lottie with interactivity metadata
  - Runtime size: target under 50KB for the player JS
  - Playback renderer: Canvas 2D (default), WebGL (optional for complex animations)
  - Responsive: animation scales to container size while preserving aspect ratio
- **Output:** A self-contained interactive animation package that plays in web browsers and responds to user interactions, embeddable via script tag or iframe.
- **Acceptance criteria:**
  - Exported HTML+JS bundle renders the animation correctly in Chrome, Firefox, Safari, and Edge
  - State machine transitions trigger correctly in response to defined user interactions (hover, click, scroll)
  - Animation blends smoothly between states (crossfade/interpolation over the configured transition duration)
  - Boolean inputs toggle between two states correctly
  - Number inputs scrub through the animation proportionally (e.g., scroll position 0% = frame 0, 100% = last frame)
  - Trigger inputs fire transitions once and complete the target animation before accepting new triggers
  - The runtime JS file is under 50KB gzipped
  - The exported package is self-contained (no external dependencies or CDN requirements)
  - A JavaScript API is exposed for programmatic control: `play(stateName)`, `pause()`, `fire(triggerName)`, `setInput(name, value)`
  - The animation is responsive (scales with container) without quality loss (vector rendering for shape/text layers)
  - Performance: maintains 60fps on mid-range devices for typical animations (under 50 layers)
- **Edge cases:**
  - Animations with video layers or raster-heavy content cannot be made truly interactive without pre-rendering. These layers should be flagged as "pre-rendered" in the export and included as sprite sheets or video elements
  - Complex state machines with circular transitions or conflicting conditions should be validated before export, with warnings for unreachable states or ambiguous transitions
  - Audio tied to specific states needs careful management (preloading, stopping on state exit). Audio support in the runtime should be optional (opt-in) to keep the base runtime small
  - Mobile touch events should be mapped from mouse events (touchstart = mouseenter, touchend = mouseleave, tap = click)
  - If the animation uses fonts, they must be either embedded (increases file size) or loaded from a CDN (requires network access)
  - Scroll-driven animations need to handle cases where the user scrolls very fast (interpolate rather than skip frames)
- **Dependencies:**
  - Requires a new state machine editor UI component
  - Requires a new interactive runtime player (JS library)
  - Requires a serializer that converts ProAnimate animation data to the runtime format
  - Leverages existing keyframe data, shape data, text data from their respective stores
  - Could integrate with Rive's runtime format if licensing permits, or use a custom format
- **Integration with ProAnimate:**
  - A new store `useInteractiveExportStore.ts` manages state definitions, transitions, and inputs
  - The state machine editor could be a new panel in `LeftPanel` or an overlay, reusing the visual node-graph pattern from `AnimStateMachineEditor.tsx` (which already exists for 3D animation state machines in ProAnimate)
  - Timeline segments map to states: the user selects frame ranges on the existing `Timeline.tsx` and names them as states
  - `useKeyframeStore` data is serialized per-state rather than as a continuous timeline
  - The interactive runtime player is a new standalone JS library (bundled separately from ProAnimate's main app) that includes a minimal canvas renderer derived from `canvas2dRenderer.ts`
  - Shape, text, and SVG layers export as vector data in the runtime format. Raster layers (images, video) export as optimized assets
  - The exported HTML embed includes the same CSS easing curves used in ProAnimate's animation system, maintaining visual fidelity
- **Use cases:**
  1. A UI designer creates an interactive button animation with three states (default, hover, pressed) and exports it as an embeddable widget that a developer drops into a React app, connecting button events to the animation state machine.
  2. A marketing team creates a scroll-driven product showcase animation where scrolling through a landing page progressively reveals product features, with the animation position tied to scroll percentage.
  3. An e-learning developer creates an interactive anatomy diagram where clicking different body parts triggers animation sequences explaining each organ, exported as a self-contained HTML widget embedded in their LMS.
- **Why it matters:** Interactive animations represent the next evolution beyond passive video. While video is consumed, interactive animations are experienced. The web UI/UX market increasingly demands micro-interactions, scroll-driven animations, and stateful UI elements. Rive has built a $100M+ business on this exact value proposition. For ProAnimate, interactive export opens an entirely new market segment (web developers, app developers, game developers) beyond the current content creator base. It transforms ProAnimate outputs from disposable social media content into reusable interactive assets with much higher perceived value.
- **Who has it:** Rive (the market leader, with .riv binary format, cross-platform runtimes for Flutter/Unity/React/Swift, and a visual state machine editor), Lottie (basic interactivity via lottie-interactivity library for scroll and cursor-driven playback), Hera (code-based animations with interactive parameters), Spline (3D interactive exports).
- **Gold standard:** Rive is the undisputed gold standard. Their visual state machine editor lets designers define states, transitions, and inputs visually without code. The .riv binary format is compact (typically 10-100KB) and loads instantly. Their runtimes are available for every major platform (web, iOS, Android, Flutter, Unity, React Native, Swift, C++) and maintain 120fps GPU-accelerated rendering. The state machine supports boolean, number, and trigger inputs with complex transition conditions (blend trees, 1D blend spaces). Designers create the interaction model, and developers simply wire up events to inputs via a clean API. The community-driven backpack (asset library) enables sharing and remixing of interactive animations.

---

### 45. CSS Easing Export

- **Category:** Export & Output
- **What it is:** The ability to export animation easing curves from ProAnimate as CSS-compatible timing function code, enabling web developers to replicate the exact motion feel in their CSS animations and transitions.
- **What it does:** For any selected keyframe or animation easing in ProAnimate, generates the equivalent CSS `cubic-bezier()`, `linear()`, or named easing keyword (e.g., `ease-in-out`) that produces identical motion timing. The exported code can be copied to clipboard as a CSS property value, a full CSS `animation-timing-function` declaration, or a JavaScript easing function. For ProAnimate's extended easing types (spring, elastic, bounce) that cannot be expressed as a single `cubic-bezier()`, the system generates a `linear()` CSS function with sampled keyframes that approximate the curve, or a multi-segment cubic-bezier approximation.
- **User flow:**
  1. User selects a keyframe or clicks on an easing curve in the timeline or property panel.
  2. User clicks the "Copy as CSS" button (or right-clicks and selects "Copy Easing as CSS" from context menu).
  3. The easing is converted to CSS and copied to clipboard. A toast notification confirms: "Copied: cubic-bezier(0.42, 0, 0.58, 1)".
  4. Alternatively, user opens an "Easing Export" panel that shows all unique easings used in the project, each with a preview curve visualization and a "Copy" button.
  5. For spring/elastic/bounce easings, a dropdown lets the user choose the export format: `linear()` function (high fidelity, modern browsers), multi-segment `cubic-bezier()` approximation (wider compatibility), or JavaScript easing function.
- **Properties/Parameters:**
  - Export formats:
    - CSS `cubic-bezier(x1, y1, x2, y2)` for standard easing curves
    - CSS `linear(...)` for complex curves (spring, elastic, bounce) as sampled points
    - CSS named keyword (`ease`, `ease-in`, `ease-out`, `ease-in-out`, `linear`) when applicable
    - Full CSS declaration: `animation-timing-function: cubic-bezier(0.42, 0, 0.58, 1);`
    - JavaScript function: `(t) => { ... }` for use in GSAP, Framer Motion, etc.
  - Sampling resolution for `linear()` export: 20 points (default), 10 (compact), 50 (high precision)
  - Browser compatibility target: modern (supports `linear()`), legacy (cubic-bezier only)
  - Copy target: clipboard (default), download as .css file, download as .js module
- **Output:** A CSS timing function string or JavaScript easing function copied to clipboard or downloaded as a code file.
- **Acceptance criteria:**
  - Standard easings map correctly: `ease-in` produces `cubic-bezier(0.42, 0, 1, 1)`, `ease-out` produces `cubic-bezier(0, 0, 0.58, 1)`, `ease-in-out` produces `cubic-bezier(0.42, 0, 0.58, 1)`
  - Custom cubic-bezier easings export with the exact control point values from `CubicBezierParams`
  - Spring, elastic, and bounce easings produce a `linear()` CSS function with sampled points that visually match the original curve (verified by overlay comparison)
  - Copied CSS code is valid and produces the expected animation timing when applied in a browser
  - The "Copy as CSS" button is accessible from the keyframe easing popover and from the timeline
  - Toast notification confirms successful copy with the actual CSS value shown
  - JavaScript export produces a valid function that accepts t (0-1) and returns the eased value
  - The easing export panel lists all unique easings in the project with visual previews
- **Edge cases:**
  - ProAnimate's `snappy` and `material` named presets need to be resolved to their actual cubic-bezier values before export
  - The `linear()` CSS function is only supported in Chrome 113+, Firefox 112+, Safari 17.2+. When targeting legacy browsers, fall back to the closest `cubic-bezier()` approximation with a note about reduced fidelity
  - Multi-segment easings (different easing per segment of an animation) should export as separate CSS values with a comment indicating which segment each applies to
  - Extremely complex spring simulations with many oscillations may produce very long `linear()` functions. Cap at 100 sample points with a warning
  - Step easings (e.g., `steps(5, end)` for frame-by-frame animation) should export using the CSS `steps()` function directly
- **Dependencies:**
  - Extends the easing UI in the timeline/keyframe panels
  - Leverages the existing easing definitions in `src/engine/easing.ts` and `src/types/keyframes.ts`
  - Requires a new utility `src/utils/cssEasingExporter.ts`
  - No external dependencies needed
- **Integration with ProAnimate:**
  - `src/engine/easing.ts` already contains all easing function implementations. The CSS exporter maps each `EasingType` to its CSS equivalent: `'linear'` to `linear`, `'ease-in'` to `cubic-bezier(0.42, 0, 1, 1)`, `'cubic-bezier'` to `cubic-bezier(x1, y1, x2, y2)` using `CubicBezierParams`
  - For extended types (`spring-light`, `spring-medium`, `elastic-out`, `bounce-out`, etc.), the exporter samples the easing function from `easing.ts` at N points and produces `linear(0, 0.05 5%, 0.15 10%, ...)` CSS output
  - The export UI integrates into the existing easing picker/popover that appears when editing keyframe easings in the timeline or property panels
  - `DraggableNumberInput.tsx` and timeline keyframe UI components gain a small "copy" icon button that triggers CSS export for the associated easing
  - A project-wide "Easing Library" view could list all unique easings used in the project, each with preview and export buttons
- **Use cases:**
  1. A motion designer creates a custom easing curve in ProAnimate for a UI animation, then copies the CSS cubic-bezier value and hands it to the frontend developer to apply the exact same motion feel to CSS transitions on the website.
  2. A design system team uses ProAnimate to prototype animation timing, then exports all easing curves as a CSS/JS constants file that becomes part of their design token library.
  3. A web developer wants to recreate ProAnimate's "spring-medium" easing in their React app and copies the JavaScript easing function for use with Framer Motion or GSAP.
- **Why it matters:** Motion design increasingly bridges the gap between design tools and code. Designers create animations in visual tools, and developers need to replicate the exact timing in CSS or JavaScript. Without easing export, developers must eyeball the curve and try to recreate it manually, leading to inconsistencies between design and implementation. Jitter added CSS easing export in March 2025, recognizing this handoff need. For ProAnimate users who create UI animations or branded motion, CSS easing export completes the design-to-development handoff workflow. Implementation cost is very low (a mapping function and clipboard API call).
- **Who has it:** Jitter (Copy as CSS from easing settings, released March 2025), After Effects (expressions can be exported to CSS via third-party tools), Rive (runtime automatically handles easing, no manual export needed), CurveEditor.com (dedicated tool for CSS/AE easing curve generation).
- **Gold standard:** Jitter's implementation is clean and contextual. In the Animation settings, clicking the Settings icon next to Easing reveals the curve editor. A menu option "Copy as CSS" exports the current easing as a `cubic-bezier()` value to clipboard. It is minimal, discoverable, and does exactly what developers need without extra UI complexity. For an enhanced version, CurveEditor.com is the gold standard dedicated tool: it provides a visual bezier editor with real-time preview, outputs CSS `cubic-bezier()`, After Effects expressions, and GSAP easing simultaneously, with a library of named presets.

---

### 47. 120fps Export

- **Category:** Export & Output
- **What it is:** The ability to export animations at 120 frames per second, producing ultra-smooth motion suitable for high-refresh-rate displays and premium content.
- **What it does:** Extends the export pipeline to support frame rates up to 120fps. The animation system renders at the higher frame rate (interpolating between existing keyframes at finer time intervals), and the video encoder produces output at 120fps. This is primarily valuable for animations destined for 120Hz displays (modern smartphones, gaming monitors, ProMotion iPads/MacBooks) where 30fps content appears noticeably choppy. The existing interpolation engine in ProAnimate already works at sub-frame precision, so higher FPS primarily means more frames rendered and encoded per second of animation.
- **User flow:**
  1. User opens ExportPanel and sees FPS options: 24, 25, 30 (current options), 48, 60, 120 (new options).
  2. User selects 120fps.
  3. A note appears: "120fps export renders 4x more frames than 30fps. Export will take approximately 4x longer and produce larger files."
  4. Estimated file size and export time update to reflect the higher frame count.
  5. User clicks "Export." Rendering proceeds, with the progress bar accounting for the higher total frame count.
  6. The exported video plays at 120fps on compatible devices and players.
- **Properties/Parameters:**
  - Frame rate options: 24fps (cinematic), 25fps (PAL), 30fps (default), 48fps (HFR cinematic), 60fps (smooth), 120fps (ultra-smooth)
  - Codec considerations: H.264 supports 120fps at up to 4K. VP9 supports 120fps. AV1 supports 120fps
  - Bitrate auto-scaling: at 120fps, the per-frame bitrate can be lower since there is less change between adjacent frames. Recommended: use the same total bitrate as 60fps (quality is maintained due to temporal redundancy)
  - Maximum resolution at 120fps: 1080p recommended, 4K technically possible but very demanding
  - Interpolation mode: when the project is authored at 30fps but exported at 120fps, each original frame produces 4 output frames. Between-frame interpolation uses the existing keyframe easing curves for sub-frame position calculation
- **Output:** A video file (MP4 or WebM) encoded at 120 frames per second.
- **Acceptance criteria:**
  - Exported video metadata shows exactly 120fps (verified by ffprobe or mediainfo)
  - The video plays smoothly at 120fps on a 120Hz display in Chrome, VLC, and QuickTime Player
  - Animation motion between keyframes is interpolated correctly at 120fps granularity (no stuttering or frame repetition)
  - File size is proportional to frame count (roughly 2x a 60fps export of the same duration, not 4x, due to temporal compression)
  - The WebCodecs encoder successfully handles 120fps configuration (some hardware encoders may reject it)
  - If the hardware encoder does not support 120fps, fall back to software encoding with a notification
  - The timeline internally scales: if the project is authored at 30fps with 150 frames (5 seconds), exporting at 120fps renders 600 frames over the same 5 seconds
  - All layer types (characters, text, shapes, Lottie, media, HTML templates, 3D) render correctly at the higher frame rate
  - Lottie animations configured at lower frame rates are interpolated to match the 120fps output
- **Edge cases:**
  - Projects authored at 30fps exported at 120fps: the system renders 4 intermediate frames per original frame, using the keyframe interpolation engine. This should produce smooth motion, not repeated frames
  - HTML template layers may not update at 120fps (browser layout is typically 60Hz). These should be rendered at their native refresh rate and the last frame held until the next update
  - 3D Three.js layers need to requestAnimationFrame at 120fps during export, or the renderer must manually advance the scene clock
  - Audio remains unchanged (audio sample rate is independent of video frame rate)
  - Some social media platforms re-encode uploaded video to 30fps, eliminating the benefit of 120fps. Display a note: "YouTube and Vimeo support 60fps max. TikTok and Instagram support 30fps max. 120fps is best for direct playback or professional delivery"
  - Combined 4K + 120fps export produces enormous data rates (potentially 100+ Mbps). Display a strong warning about file size and processing time
- **Dependencies:**
  - Extends `ExportPanel.tsx` FPS options
  - Extends `videoExport.ts` to handle higher frame counts
  - The existing interpolation engine (`interpolation.ts`) already supports fractional frame calculation
  - WebCodecs must be tested for 120fps support across browsers
- **Integration with ProAnimate:**
  - `useTimelineStore` stores `fps` as the project authoring frame rate. The export FPS is a separate setting in `ExportOptions`. When export FPS differs from project FPS, the export loop calculates `projectFrame = exportFrame * (projectFps / exportFps)` to get fractional project frame positions
  - `interpolation.ts` `interpolateValue()` already accepts fractional frame numbers and interpolates between keyframes, so 120fps export works by simply querying at finer intervals
  - `canvas2dRenderer.ts` `renderFrame()` accepts a frame number and renders the corresponding state. Passing fractional frames (e.g., frame 0.25, 0.5, 0.75 between integer frames) produces interpolated output
  - `ExportPanel.tsx` extends its FPS selector with new options: 48, 60, 120. The RESOLUTION_OPTIONS may show a recommendation to cap at 1080p when 120fps is selected
  - `videoExport.ts` `exportWithWebCodecs()` configures the VideoEncoder with `framerate: 120` and adjusts the `timestamp` on each VideoFrame accordingly
  - The progress callback must account for the 4x higher frame count to show accurate percentage and time estimates
- **Use cases:**
  1. A premium brand creates a product showcase animation destined for an in-store 120Hz display wall, requiring native 120fps to avoid judder on the high-refresh hardware.
  2. A gaming content creator produces animated overlays at 120fps to match their 120fps game footage, ensuring the overlay animation is as smooth as the gameplay.
  3. A motion designer exports at 120fps for a client presentation on a ProMotion iPad or MacBook Pro, where the difference between 60fps and 120fps is perceptible in smooth sweeping animations.
- **Why it matters:** 120Hz displays are now standard on flagship smartphones (iPhone Pro, Samsung Galaxy S series), gaming monitors, and Apple ProMotion devices. Content that matches the display refresh rate looks noticeably smoother and more premium. While 120fps is a niche need today, it signals product quality and future-readiness. Jitter's Pro plan includes 120fps export, positioning it as a premium feature. For ProAnimate, 120fps export is a straightforward extension of the existing rendering pipeline (the interpolation engine already works at sub-frame precision) with a premium perception that justifies plan upgrades.
- **Who has it:** Jitter (up to 120fps on Pro/Studio plans), Rive (120fps GPU rendering in runtime, though this is playback not export), gaming capture tools (OBS, NVIDIA ShadowPlay support 120fps recording).
- **Gold standard:** Jitter is the gold standard for 120fps export in web-based animation tools. Their Pro plan offers frame rates from 15fps to 120fps, selectable in the export settings. The export uses hardware-accelerated WebCodecs encoding which handles 120fps efficiently on modern hardware. The key insight is that 120fps is gated behind the Pro plan tier, making it a revenue driver for upgrade conversions. Their system handles the complexity transparently: users simply select the FPS and export.

---

### 58. SCORM Export (L&D)

- **Category:** Export & Output
- **What it is:** The ability to export ProAnimate animations as SCORM-compliant packages that can be uploaded to any Learning Management System (LMS) for tracked eLearning content delivery.
- **What it does:** Packages the animation (as an embedded video or interactive HTML player) into a SCORM-compliant ZIP file containing an `imsmanifest.xml` descriptor, an HTML wrapper page, and SCORM API integration JavaScript. When uploaded to an LMS, the package launches the animation within the LMS player, tracks completion (based on percentage watched or quiz interaction), and reports status back to the LMS (complete/incomplete, pass/fail, score). The system supports both SCORM 1.2 and SCORM 2004 standards. For interactive exports, quiz questions or knowledge checks can be embedded alongside the animation.
- **User flow:**
  1. User opens Export panel and selects "SCORM Package" from the format options.
  2. User selects the SCORM version: SCORM 1.2 (widest LMS compatibility) or SCORM 2004 (more features).
  3. User configures completion criteria: percentage of video watched (slider: 0-100%, default: 80%), or explicit "Mark Complete" button.
  4. Optionally, user adds quiz questions: multiple choice, true/false, or free-text, linked to specific points in the animation timeline.
  5. User sets metadata: course title, description, and SCO identifier.
  6. User clicks "Export SCORM."
  7. The system generates a ZIP file containing: `imsmanifest.xml`, `index.html` (the player page), `scorm-api.js` (SCORM communication layer), and either an embedded video file or a reference to a hosted video URL.
  8. User uploads the ZIP to their LMS (Moodle, Canvas, Cornerstone, SAP SuccessFactors, etc.).
  9. Learners access the content through the LMS, watch the animation, and completion is tracked automatically.
- **Properties/Parameters:**
  - SCORM version: 1.2 (default, widest compatibility) or 2004 3rd/4th Edition
  - Completion criteria: percentage watched (0-100%, default: 80%), manual button click, quiz score threshold
  - Quiz configuration (optional): array of questions, each with { timestamp: number (frame), questionType: 'multiple-choice' | 'true-false' | 'free-text', question: string, options?: string[], correctAnswer: string | number, points: number }
  - Pass/fail threshold: score percentage for passing (default: 70%)
  - Video delivery: embedded in ZIP (larger file, works offline) or hosted URL reference (smaller ZIP, requires internet)
  - Metadata: course title, description, identifier, language, duration
  - Player controls: play/pause/seek, playback speed (0.5x, 1x, 1.5x, 2x), fullscreen, captions toggle
  - Bookmark/resume: save last position and resume on re-launch (using SCORM suspend_data)
  - Maximum ZIP size: 500MB (embedded video), under 1MB (hosted URL reference)
  - imsmanifest.xml structure: single SCO (Sharable Content Object) with one launch resource
- **Output:** A SCORM-compliant ZIP package uploadable to any SCORM-compatible LMS, with completion tracking and optional quiz assessment.
- **Acceptance criteria:**
  - Generated ZIP passes SCORM validation (tested with SCORM Cloud test suite)
  - Package imports successfully into Moodle 4.x, Canvas LMS, and SCORM Cloud
  - Learner completion is tracked correctly: status changes from "incomplete" to "complete" when the configured percentage is watched
  - Quiz scores are reported to the LMS via `cmi.score.raw` (SCORM 1.2) or `cmi.score.scaled` (SCORM 2004)
  - Bookmark/resume works: closing and reopening the content resumes from the last position
  - The `imsmanifest.xml` is well-formed and contains all required SCORM elements
  - The video player within the SCORM package works across Chrome, Firefox, Safari, and Edge
  - Captions from ProAnimate's caption system are included in the player
  - The hosted-URL variant produces a ZIP under 1MB with the video loaded from a provided URL
  - SCORM API calls (LMSInitialize, LMSCommit, LMSSetValue, LMSFinish for 1.2; Initialize, Commit, SetValue, Terminate for 2004) are correctly implemented
- **Edge cases:**
  - LMS environments often restrict JavaScript execution. The SCORM wrapper must use only basic DOM APIs and avoid modern JS features that may be blocked by older LMS webviews
  - Some LMS platforms have strict ZIP file size limits (50-100MB). When the embedded video exceeds this limit, automatically switch to the hosted-URL approach or warn the user
  - SCORM 1.2's `cmi.suspend_data` is limited to 4,096 characters. Bookmark data must fit within this limit (store only the resume timestamp, not full state)
  - Some LMS platforms open SCORM content in small popup windows. The player must be responsive and work at small viewport sizes (minimum 320x240)
  - If the user has not generated a video yet, the SCORM export should first render the video, then package it. Show a combined progress bar for both steps
  - SCORM 2004 sequencing and navigation rules (continue, previous, choice) should be kept simple (single-SCO linear) to avoid compatibility issues with LMS platforms that implement sequencing differently
- **Dependencies:**
  - Requires `videoExport.ts` to render the animation as a video file first (if not using hosted URL)
  - Requires a new SCORM packager module (`src/services/scormExporter.ts`)
  - Requires JSZip (or similar) for ZIP generation
  - Requires SCORM API wrapper JavaScript (can be a lightweight custom implementation or an open-source library like pipwerks SCORM wrapper)
  - Caption data from `useVoiceStore` for subtitle tracks
- **Integration with ProAnimate:**
  - New service `src/services/scormExporter.ts` that orchestrates: (1) video rendering via `exportVideo()`, (2) generation of `imsmanifest.xml` from project metadata, (3) generation of `index.html` player page with embedded video and SCORM API calls, (4) ZIP packaging
  - `ExportPanel.tsx` adds 'scorm' to format options with SCORM-specific settings (version, completion criteria, quiz builder)
  - Caption data from `useVoiceStore` (word events, sentence timings) is embedded as WebVTT subtitles in the SCORM player
  - Project metadata from `useProjectStore` (name, description) populates the manifest metadata
  - The quiz builder is a new UI component in the export panel. Quiz timestamps tie to `useTimelineStore` frame positions
  - For hosted-URL mode, the user provides a URL where the video is hosted (e.g., Supabase Storage public URL), and the SCORM package references it via `<video src="...">`
- **Use cases:**
  1. A corporate L&D team uses ProAnimate to create animated training videos explaining new company policies, exports them as SCORM packages, and uploads them to their Cornerstone OnDemand LMS where completion is tracked per employee.
  2. An educational content creator produces animated lesson videos for an online course platform (Moodle), exports as SCORM with embedded quiz questions that test comprehension at key points in the video.
  3. A compliance training provider creates mandatory training content using ProAnimate's AI-generated animated characters, exports as SCORM 2004 with an 80% completion requirement and a passing quiz score of 70%, ensuring learners cannot skip through the content.
- **Why it matters:** The corporate eLearning market is valued at over $100 billion, and SCORM is the dominant standard for content delivery. Video-based training content is the fastest-growing segment of eLearning. Currently, L&D teams use tools like Synthesia, Vyond, or Camtasia to create video content, then use separate authoring tools (Articulate Storyline, iSpring) to wrap it in SCORM. ProAnimate with SCORM export eliminates this two-tool workflow, capturing the entire creation-to-LMS pipeline. Synthesia's SCORM export is a proven revenue driver, particularly with enterprise clients who require LMS integration for compliance training. For ProAnimate, this feature opens the B2B enterprise market with its high contract values and low churn rates.
- **Who has it:** Synthesia (SCORM export with completion tracking, quiz support, multilingual captions, learner identity recording), Vyond (SCORM export), Camtasia (SCORM export via TechSmith Relay), iSpring (SCORM authoring tool), Articulate Storyline (full SCORM authoring).
- **Gold standard:** Synthesia's SCORM export is the gold standard for AI video tools. Their implementation is elegant: the SCORM package is under 100KB because it embeds a hosted video URL rather than the video file itself, eliminating LMS file size limitations. The package includes SCORM API integration, completion tracking (configurable percentage), learner identity recording, multilingual caption support, and quiz interaction reporting. Interactive videos with branching scenarios export as SCORM with full interaction tracking. The setup requires just three clicks: Share > Download SCORM > Choose options > Download. This simplicity, combined with enterprise-grade compliance tracking, makes it a key selling point for their enterprise plans.

---

### 60. 8K Export

- **Category:** Export & Output
- **What it is:** The ability to export animations at 7680x4320 resolution (8K UHD), the highest standard consumer resolution available today.
- **What it does:** Extends the rendering pipeline to produce 7680x4320 pixel output, sixteen times the pixel count of 1080p. Due to the extreme resolution, 8K export requires significant memory (a single uncompressed RGBA frame at 8K is ~132MB), processing power, and careful encoder configuration. The feature uses HEVC (H.265) or AV1 codec encoding (rather than H.264, which has practical limitations at 8K) with high bitrates (50-100 Mbps). 8K export is a premium/enterprise feature intended for digital signage, trade shows, museum installations, and archival-quality master files.
- **User flow:**
  1. User opens ExportPanel and sees resolution options up to "8K (7680x4320)" at the top of the list, marked with a "Premium" or "Enterprise" badge.
  2. User selects 8K. A prominent notice appears: "8K export requires significant system resources. Recommended: 16GB+ RAM, dedicated GPU. Export time may be 10-30x longer than 1080p."
  3. The system runs a capability check: verifies canvas max size, available memory, and encoder support.
  4. If the system passes the check, the user proceeds. If not, a specific limitation is shown (e.g., "Your browser limits canvas to 4096x4096. 8K export requires server-side rendering.") with an option to use server-side rendering.
  5. User selects codec: HEVC (H.265) for broad hardware compatibility, or AV1 for best compression.
  6. User clicks "Export." For client-side export, frames render to a tiled canvas strategy (rendering quadrants and stitching). For server-side export, frame data is streamed to the server for encoding.
  7. On completion, the 8K video file is available for download.
- **Properties/Parameters:**
  - Resolution: 7680x4320 (16:9), proportionally scaled for other aspect ratios
  - Codec: HEVC/H.265 (recommended, wide hardware decoder support at 8K), AV1 (best compression, growing support), VP9 (fallback)
  - Bitrate: 50-100 Mbps (HEVC), 30-60 Mbps (AV1)
  - FPS at 8K: recommended max 30fps (60fps theoretically possible but extremely demanding)
  - Maximum duration: 5 minutes (to prevent impractical file sizes and export times)
  - Rendering strategy: client-side tiled rendering (if canvas supports 8K) or server-side rendering via API endpoint
  - Server-side rendering endpoint: `POST /api/export/8k` receiving frame data and returning encoded video
  - Estimated file size per minute: ~375MB at 50Mbps HEVC, ~750MB at 100Mbps
  - Color depth: 10-bit (HDR-ready) when using HEVC Main 10 profile
- **Output:** An 8K (7680x4320) video file in MP4 (HEVC) or WebM (AV1/VP9) format.
- **Acceptance criteria:**
  - Exported video has actual pixel dimensions of 7680x4320
  - The video plays correctly in VLC, QuickTime Player (macOS), and MPC-HC (Windows) with HEVC decoder installed
  - Vector content (shapes, text, SVG) renders at full 8K quality without rasterization artifacts
  - The capability check accurately detects whether client-side 8K rendering is possible on the current device
  - Server-side rendering option works when client-side is not feasible, with progress updates streamed back to the client
  - Export does not crash or freeze the browser (memory usage stays within browser limits via streaming/tiling approach)
  - File size matches expected bitrate calculations within 20% tolerance
  - Color accuracy is preserved at 8K (no banding in gradients)
  - The feature is gated behind Enterprise plan billing check
- **Edge cases:**
  - Most browsers limit individual canvas dimensions to 16384x16384 (Chrome) or 4096x4096 (mobile Safari). 8K at 7680x4320 fits within Chrome's limit but exceeds mobile Safari's. Detect and show appropriate error
  - GPU memory at 8K: a single WebGL framebuffer at 8K is ~132MB. GPUs with less than 2GB VRAM will fail. Detect via `gl.getParameter(gl.MAX_RENDERBUFFER_SIZE)` before attempting
  - HTML template iframes may not render correctly at 8K if their internal CSS uses fixed pixel values. Scale the iframe viewports proportionally
  - Character sprites and stock images at lower native resolution will be visibly pixelated at 8K. Display a quality warning listing under-resolution assets
  - HEVC encoding via WebCodecs has variable browser support (Chrome supports it on hardware that has HEVC encoders; Safari supports it; Firefox does not). Server-side FFmpeg is the most reliable path
  - 8K video files (multi-GB) may exceed browser download limits or Blob size limits. Use streaming downloads (ReadableStream) or server-side file hosting with a download link
  - Frame-by-frame tiled rendering (rendering four 3840x2160 quadrants and stitching) requires careful handling of layer positions that span quadrant boundaries
- **Dependencies:**
  - Extends `ExportPanel.tsx` with 8K option and capability check
  - Requires HEVC or AV1 encoder support (WebCodecs for client-side, FFmpeg for server-side)
  - May require a server-side rendering endpoint (`/api/export/8k`) using FFmpeg for encoding
  - Extends `videoExport.ts` with 8K-specific rendering strategies (tiled rendering, streaming encoding)
  - Depends on 4K export infrastructure (Feature #4) as a foundation
- **Integration with ProAnimate:**
  - `ExportPanel.tsx` adds `{ label: '8K (4320p)', scale: 4.0 }` to `RESOLUTION_OPTIONS`, gated behind enterprise plan check via `useAuthStore` subscription status
  - `videoExport.ts` implements a tiled rendering strategy for 8K: render the composition in four 3840x2160 quadrants, stitch them on a full 8K canvas, then encode. This avoids creating a single 8K canvas which may exceed memory limits
  - `canvas2dRenderer.ts` gains a `renderRegion(x, y, width, height)` function that renders only a portion of the composition, enabling tiled rendering
  - For server-side rendering: `videoExport.ts` gains a `exportVideoServerSide()` function that streams frame data to `POST /api/export/8k`, which uses FFmpeg to encode. The server route is added to `server/index.ts`
  - `pixiExportRenderer.ts` may provide better 8K performance via GPU rendering if the GPU supports 8K framebuffers
  - `compositionBuilder.ts` provides the same composition props but at 8K dimensions
  - The existing `ExportProgress` callback system works unchanged for 8K; only the total frame count and estimated time are affected
- **Use cases:**
  1. A digital signage company produces animated content for an 8K LED video wall at a corporate headquarters lobby, requiring native 8K resolution to avoid upscaling artifacts on the massive display.
  2. A museum creates an animated educational exhibit displayed on Samsung's The Wall (an 8K MicroLED display), where the extreme resolution is needed for close-range viewing.
  3. A production studio exports master archive files at 8K for future-proofing a brand's animated asset library, even though current distribution is at 4K.
- **Why it matters:** 8K represents the absolute pinnacle of video resolution and signals uncompromising quality. While 8K displays are still niche (digital signage, exhibitions, premium home theater), the market is growing and agencies serving these clients need production tools that support native 8K output. Motionvid.ai offers 8K on their Enterprise plan, demonstrating market demand in the premium segment. For ProAnimate, 8K is an enterprise differentiator and a statement of technical capability. It is unlikely to be used frequently, but its presence signals that the product can handle any resolution requirement, building confidence among enterprise buyers. It is naturally a high-tier paid feature that drives enterprise plan revenue.
- **Who has it:** Motionvid.ai (8K on Enterprise plan), DaVinci Resolve (native 8K editing and export), After Effects (supports 8K compositions), Premiere Pro (8K timeline support).
- **Gold standard:** Motionvid.ai is the gold standard among AI animation tools for 8K export, offering it as a differentiating enterprise feature. Among traditional tools, DaVinci Resolve is the gold standard: it handles 8K natively with GPU-accelerated rendering, supports HEVC and AV1 encoding, and manages memory efficiently through its optimized media engine. Their approach uses GPU-based rendering with intelligent memory management, allowing 8K editing and export on hardware with 16GB+ VRAM. For a browser-based tool like ProAnimate, the practical gold standard is a hybrid approach: client-side rendering where hardware permits, with transparent server-side offloading when the client cannot handle the resolution.

---

## Category 7: Distribution & Publishing

### 6. Brand Kit System
- **Category:** Distribution & Publishing
- **What it is:** A centralized repository where users store, organize, and enforce brand assets -- colors, fonts, logos, watermarks, caption styles, and branded templates -- so every video maintains consistent visual identity across all content.
- **What it does:** The Brand Kit System provides a dedicated workspace where users upload and manage brand elements that can be instantly applied to any project. Users define primary and secondary color palettes (with hex values), select from approved font families, upload logo files (with placement and opacity presets for watermarking), and save caption styling presets. When creating a new project or using the AI Orchestrator, the active brand kit is auto-applied, ensuring colors map to text overlays and shape fills, fonts populate all text layers, and logos are positioned as watermarks. Enterprise and agency users can maintain multiple named brand kits (e.g., per client), share kits across team workspaces, and lock kits so non-admin users cannot deviate from approved assets. The system also supports one-click brand kit import from a company URL (via Brandfetch-style asset detection) and AI-assisted brand kit generation from a single logo upload.
- **User flow:**
  1. User navigates to Settings > Brand Kits (or a dedicated Brand Kit tab in the left panel).
  2. User clicks "Create Brand Kit" and enters a name (e.g., "Acme Corp").
  3. User uploads a logo (PNG/SVG), selects logo placement preset (top-left, top-right, center, bottom-right), and adjusts opacity (0-100%) and size.
  4. User adds up to 12 brand colors by entering hex codes, using a color picker, or importing from an existing project's palette.
  5. User selects up to 3 approved font families from the available 26+ fonts, designating primary (headings), secondary (body), and accent fonts.
  6. User optionally saves a caption style preset (font, size, color, background, animation style, position).
  7. User optionally uploads additional assets: intro/outro templates, branded stickers, sound logos.
  8. User clicks "Save Brand Kit."
  9. When editing any project, user clicks the Brand Kit icon in the toolbar and selects a kit; all text overlays, shape colors, caption styles, and watermark are updated instantly.
  10. In the AI Orchestrator, the active brand kit is listed in OrchestratorSettings; the plan generation prompt includes brand constraints.
- **Properties/Parameters:**
  - `name`: string (brand kit display name, max 64 characters)
  - `colors`: array of `{ hex: string, role: 'primary' | 'secondary' | 'accent' | 'background' | 'text' | 'custom', label?: string }` (max 12)
  - `fonts`: array of `{ family: string, role: 'heading' | 'body' | 'accent', weight?: number }` (max 3)
  - `logos`: array of `{ url: string, placement: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' | 'center', opacity: number (0-1), scale: number (0.05-0.5), file_type: 'png' | 'svg' }` (max 3 per kit)
  - `captionPreset`: `{ font: string, fontSize: number, textColor: string, bgColor: string, bgOpacity: number, position: 'top' | 'center' | 'bottom', animationStyle: string }`
  - `watermark`: `{ enabled: boolean, logoIndex: number, opacity: number, position: string }`
  - `brandedTemplates`: array of project template IDs that are approved for this brand
  - `isLocked`: boolean (enterprise only -- prevents non-admin edits)
  - `isDefault`: boolean (auto-apply to new projects)
  - `createdAt`, `updatedAt`: timestamps
  - `userId`: UUID (owner)
  - `teamId`: UUID | null (shared team brand kit)
- **Output:** A reusable brand kit entity stored in Supabase that can be applied to any project. When applied, all relevant visual properties across text overlays, captions, shapes, watermark layer, and orchestrator-generated content conform to the kit's specifications.
- **Acceptance criteria:**
  - User can create, edit, duplicate, and delete brand kits
  - Brand kit persists across sessions (stored in Supabase)
  - Applying a brand kit to a project updates all text overlay fonts/colors, shape fill colors, caption styles, and watermark in a single action
  - AI Orchestrator respects the active brand kit when generating ClipPlan (colors, fonts, logo placement passed in the prompt)
  - Multiple brand kits supported (free tier: 1, Pro: 5, Enterprise: unlimited)
  - Logo upload supports PNG and SVG, with max file size of 5MB
  - Brand kit can be exported/imported as JSON for backup or cross-workspace sharing
  - One-click brand detection from a URL auto-populates colors and logos (best effort)
  - Locked brand kits cannot be modified by non-admin team members
  - Brand kit changes propagate to open projects in real-time (via Zustand reactivity)
- **Edge cases:**
  - User applies a brand kit that references a font not available in the current font list: fall back to the closest available font and display a warning
  - Logo file is corrupted or deleted from storage: show a placeholder icon and prompt re-upload
  - Brand kit with 12 colors is applied to a project that only uses 2 color slots: map primary and secondary; ignore unused colors gracefully
  - Two team members edit the same brand kit simultaneously: last-write-wins with updated_at conflict detection and a toast notification
  - User deletes a brand kit that is the default for their workspace: clear the default flag and notify the user to select a new default
  - Imported brand kit JSON has an incompatible schema version: validate and reject with a descriptive error message
- **Dependencies:** Supabase Storage (logo uploads), useTextOverlayStore (font/color application), useShapeStore (color fills), useVoiceStore (caption styling), useSettingsStore (default brand kit preference), Orchestrator (brand constraints in ClipPlan generation), Supabase Auth (ownership/RLS)
- **Integration with ProAnimate:**
  - New Zustand store: `useBrandKitStore` with CRUD actions, active kit selection, and application logic
  - New Supabase table: `brand_kits` with RLS policies scoped to user_id/team_id
  - Supabase Storage bucket: `brand-assets/` for logos and brand media
  - `useTextOverlayStore` gains a `applyBrandKit(kit)` method that maps kit fonts and colors to all text overlays
  - `useVoiceStore` caption config gains a `brandCaptionPreset` field
  - `orchestrator.ts` buildPlanPrompt includes brand kit constraints (color hex list, font names, logo URL) in the system prompt
  - `VideoCanvas.tsx` renders watermark layer when brand kit watermark is enabled
  - `useCharacterConfigStore` can optionally apply brand accent colors to character generation prompts
  - Settings panel gains a "Brand Kits" section for management
  - Export pipeline (`videoExport.ts`) ensures watermark is burned into the final render
- **Use cases:**
  1. A social media agency manages 8 client brands. Each client has a locked brand kit. Content creators select the client kit before using the orchestrator, and every generated video has the correct logo, fonts, and color palette without manual adjustment.
  2. A solo creator establishes their personal brand kit with their signature purple palette and custom caption style. Every new project auto-applies this kit, saving 5-10 minutes of manual styling per video.
  3. An enterprise L&D team locks their corporate brand kit so that training video creators cannot deviate from approved fonts and colors, ensuring compliance with brand guidelines.
- **Why it matters:** Brand consistency is the single most-requested feature among business users of video creation tools. Submagic's Business plan gates brand kit access as a key upsell driver. Synthesia attributes brand kit enforcement to reducing enterprise review cycles by 40%. For ProAnimate, brand kits unlock the agency and enterprise segments (teams managing multiple brands), directly enabling higher-tier pricing. Without brand kits, every project requires manual color/font/logo setup, creating friction that drives multi-video producers to competitors.
- **Who has it:** Submagic (Business plan), Synthesia (Enterprise with enforcement), Clipchamp/Microsoft (org-wide distribution), Zebracat (up to 10 kits on paid plans), Hera (brand kits), WeVideo (Business tier), Vimeo (video editor), AI Studios, CapCut
- **Gold standard:** Clipchamp (Microsoft) implements the most comprehensive brand kit system. It supports multiple named brand kits per organization, each containing logos, up to 12 colors, custom fonts, and extended assets (up to 300 each of videos, music, sound effects, images, backgrounds, and stickers). Admins create org-wide brand kits that auto-distribute to all users in the Microsoft 365 tenant. Template generation allows teams to create branded project templates that are added to the kit and shared across the organization. The kit applies to any video project with one click, replacing colors, fonts, and logos throughout. This combination of asset breadth, admin-level enforcement, and organizational distribution sets the standard.

---

### 10. Direct Social Publishing
- **Category:** Distribution & Publishing
- **What it is:** Native integration allowing users to authenticate with social media platforms and publish or schedule exported videos directly to TikTok, YouTube Shorts, Instagram Reels, Facebook, and X (Twitter) from within ProAnimate, without downloading and re-uploading manually.
- **What it does:** Direct Social Publishing eliminates the export-download-upload cycle by connecting users' social media accounts via OAuth and publishing videos through each platform's official content API. After exporting a video, users see a "Publish" panel where they can select one or more connected platforms, fill in platform-specific metadata (title, description, hashtags, privacy settings, cover image), preview how the video will appear, and either publish immediately or schedule for a future date/time. The system supports multi-platform simultaneous publishing, a content calendar view for scheduled posts, recurring auto-publish schedules (where the AI Orchestrator generates and publishes content on a cadence), and post-publish analytics tracking. All OAuth tokens are stored server-side in the existing `social_accounts` table; the frontend never handles platform tokens directly.
- **User flow:**
  1. User navigates to Settings > Social Accounts (or the Share panel).
  2. User clicks "Connect" next to a platform (TikTok, YouTube, Instagram, Facebook, X). An OAuth popup opens.
  3. User authorizes ProAnimate. The popup closes and the account appears as connected with the platform username and avatar.
  4. User creates and exports a video as usual.
  5. After export, user clicks "Publish" in the export completion panel or navigates to the Share panel.
  6. User selects one or more connected platforms via checkboxes.
  7. Per platform, user fills in metadata: title/description (pre-filled from project name and AI-suggested text), hashtags (AI-suggested based on content), privacy (public/unlisted/private), cover image timestamp, and platform-specific toggles (e.g., TikTok allow duets/stitches, YouTube made-for-kids).
  8. User chooses "Publish Now" or "Schedule" with a date/time picker and timezone selector.
  9. User clicks "Confirm." A progress indicator shows upload status per platform.
  10. On completion, user sees post URLs with direct links and a "View Analytics" button.
  11. For scheduled posts, user can view/edit/cancel via a content calendar accessible from the Dashboard.
  12. For auto-publish, user configures a topic prompt, platforms, frequency, and timezone; the system generates and publishes on the defined cadence.
- **Properties/Parameters:**
  - **Platform connections:** `SocialPlatform` = 'facebook' | 'instagram' | 'tiktok' | 'x' | 'youtube' (existing type)
  - **Per-platform publish options** (already defined in `src/types/social.ts`):
    - TikTok: description, hashtags, privacy, allowComments, allowDuets, allowStitches, postMode (direct/draft), brandContentToggle
    - YouTube: title (max 100 chars), description (max 5000 chars), tags, privacy (public/unlisted/private), madeForKids, uploadType (short/long)
    - Instagram: caption (max 2200 chars), hashtags (max 30), coverImageTimestamp, postType (reels/feed)
    - Facebook: description, privacy (public/friends/only_me), scheduledTime, pageId
    - X: tweetText (max 280 chars), mediaAltText
  - **Scheduling:** `scheduledAt: ISO 8601 datetime`, `timezone: IANA timezone string`
  - **Auto-publish:** `topicPrompt: string`, `platforms: SocialPlatform[]`, `frequency: 'daily' | 'every-2-days' | 'every-3-days' | 'weekly'`, `cronExpression: string`, `orchestratorSettings: OrchestratorSettings`
  - **AI metadata generation:** toggle for AI-generated descriptions, hashtags, and titles based on video content
  - **Cross-post settings:** `simultaneousPublish: boolean`, `platformPriority: SocialPlatform[]` (order of publishing)
- **Output:** Published video posts on selected social platforms with confirmation URLs, or scheduled entries in the `scheduled_posts` table that are executed at the specified time by a server-side cron job. Post status is tracked and surfaced in the dashboard.
- **Acceptance criteria:**
  - OAuth connection works for all 5 platforms (TikTok, YouTube, Instagram, Facebook, X) with proper token refresh
  - Immediate publish completes within 60 seconds for a 60-second 1080p video on a stable connection
  - Scheduled posts execute within 2 minutes of the scheduled time
  - Multi-platform publish runs in parallel, with per-platform success/failure reporting
  - Content calendar shows all scheduled and published posts in a monthly/weekly view
  - Auto-publish schedules can be created, paused, resumed, and deleted
  - AI-generated metadata (description, hashtags, title) is available for all platforms and editable before publish
  - Token refresh happens automatically; expired tokens trigger a re-auth prompt rather than silent failure
  - Publishing respects each platform's API rate limits and content policies (video length, aspect ratio, file size)
  - Failed publishes show a clear error message and a "Retry" button
  - Post-publish analytics (view count, likes) are fetched and displayed for TikTok (existing profile/videos endpoint)
  - Video is automatically transcoded to platform-optimal format/resolution if needed before upload
  - User can preview the post as it will appear on each platform (mockup preview)
- **Edge cases:**
  - OAuth token expires between scheduling and publish time: attempt silent refresh; if refresh fails, mark post as "failed - re-auth required" and send an email/in-app notification
  - Platform API is down at scheduled time: retry up to 3 times with exponential backoff (1 min, 5 min, 15 min), then mark as failed
  - Video exceeds platform file size limit (e.g., TikTok 4GB, YouTube 128GB): display a warning at schedule time with a suggestion to reduce resolution/duration
  - Video aspect ratio does not match platform preference (e.g., 16:9 to TikTok which prefers 9:16): show a warning but allow publish; suggest re-export in the correct ratio
  - User disconnects a platform account that has scheduled posts: cancel pending scheduled posts for that platform and notify user
  - Simultaneous publish to 5 platforms with rate limits: queue and stagger requests to avoid hitting per-IP rate limits
  - User's TikTok account is not approved for Content Posting API direct post: fall back to draft/inbox mode and inform user
  - Instagram requires a Professional account for API publishing: detect during OAuth and warn personal account users
- **Dependencies:** Supabase Auth (user identity + JWT), existing `social_accounts` table, existing `scheduled_posts` table, existing `auto_publish_schedules` and `auto_publish_executions` tables, Express.js backend (server/routes/social.ts), videoExport.ts (video blob), Supabase Storage (temporary video hosting for upload URLs), AI Orchestrator (for auto-publish content generation)
- **Integration with ProAnimate:**
  - The frontend service `src/services/socialPublish.ts` already implements OAuth flow and publish functions for all 5 platforms -- this feature extends it with scheduling UI, content calendar, AI metadata, and platform preview
  - The backend `server/routes/social.ts` already has OAuth routes, token storage, and publish endpoints -- extend with a cron endpoint or pg_cron for scheduled post execution
  - `src/types/social.ts` already defines all platform option interfaces -- extend with scheduling and calendar types
  - Existing `sql/migrations/002_scheduled_posts.sql` and `003_auto_publish.sql` provide the database schema -- no new tables needed for core functionality
  - New components: `ContentCalendar.tsx` (dashboard view), `PublishPanel.tsx` (enhanced share panel with multi-platform metadata forms), `PlatformPreview.tsx` (mockup previews)
  - `useOrchestratorStore` integrates with auto-publish for recurring content generation
  - Export panel (`ExportPanel.tsx`) gains a "Publish" button that opens the publish flow post-export
  - Dashboard gains a "Scheduled" tab showing upcoming and past publish events
  - `useAnalyticsStore` tracks publish events and post-publish performance metrics
- **Use cases:**
  1. A content creator exports a 30-second animated explainer and publishes it simultaneously to TikTok, YouTube Shorts, and Instagram Reels with platform-optimized descriptions and hashtags, all from a single publish panel -- saving 15-20 minutes of manual uploading per video.
  2. A marketing team schedules 2 weeks of daily content using the content calendar, reviewing and adjusting AI-generated metadata before confirming the schedule, ensuring consistent posting without daily manual effort.
  3. A faceless content channel sets up auto-publish with a topic prompt ("daily motivational quote animation"), targeting TikTok and YouTube Shorts every day at 8 AM EST, fully automated from generation to publishing.
- **Why it matters:** Direct publishing is the highest-impact distribution feature, converting ProAnimate from a creation tool into an end-to-end content pipeline. Submagic's direct publishing with scheduling is a core value proposition for their 4M+ business users. Creators strongly prefer tools that minimize the export-upload-metadata cycle (industry surveys show 70%+ of short-form creators publish to 3+ platforms). Scheduling and auto-publish directly increase user retention by creating habitual engagement. This feature is essential for competing with Submagic, HeyGen, and social-first video tools, and it justifies higher subscription tiers.
- **Who has it:** Submagic (direct publish + scheduling to TikTok/YouTube/Instagram), HeyGen (mobile + multi-platform publishing), Zebracat (multi-platform export), Kapwing (direct sharing), StreamLadder (content publisher)
- **Gold standard:** Submagic provides the most integrated publishing experience for short-form video. After AI-powered editing with captions and effects, users publish directly to TikTok, YouTube Shorts, and Instagram Reels with auto-filled metadata, trending hashtags, and scheduling. Their API integrations with Zapier, Make, and n8n allow automated publishing workflows where external triggers (RSS feed, new blog post, scheduled event) initiate video generation and publishing. The combination of in-app scheduling, multi-platform simultaneous publish, and external automation via API connectors represents the gold standard for distribution.

---

### 54. Portfolio Platform
- **Category:** Distribution & Publishing
- **What it is:** A hosted, public-facing portfolio page where creators showcase their ProAnimate-created videos, building a professional reel that can be shared with clients, employers, or audiences via a unique URL.
- **What it does:** The Portfolio Platform gives each ProAnimate user a customizable public page (e.g., `proanimate.co/creator/username`) where their published videos are displayed in an organized, visually appealing gallery. Creators select which recordings/exports to feature, organize them into categories or collections (e.g., "Explainers," "Product Demos," "Comedy Shorts"), add titles and descriptions, and customize the page's appearance with their brand kit colors, a bio section, profile photo, and social links. The portfolio supports both short-form video playback (with autoplay on hover) and embedded external links (YouTube, TikTok). Viewers can browse without creating a ProAnimate account, play videos inline, and contact the creator through an integrated contact form or social links. Analytics track page views, video plays, and referral sources per portfolio.
- **User flow:**
  1. User navigates to Dashboard > Portfolio (or Profile > My Portfolio).
  2. First-time setup wizard: user enters a username/slug, uploads a profile photo, writes a bio (max 500 characters), and adds social media links.
  3. User selects which recordings/exports to add from their library, dragging them into the desired order.
  4. User creates optional collections with names and descriptions.
  5. User customizes the portfolio theme: applies their brand kit (colors, fonts) or chooses from 5-10 predefined themes (Minimal, Dark, Vibrant, Corporate, Creative).
  6. User clicks "Publish Portfolio" -- the page goes live at `proanimate.co/creator/[username]`.
  7. User copies the portfolio URL to share on social profiles, resumes, or client pitches.
  8. User can update the portfolio at any time by adding/removing videos, reordering, or changing theme.
  9. User views portfolio analytics: total page views, per-video play counts, referral sources, viewer geography.
- **Properties/Parameters:**
  - `username/slug`: string (unique, URL-safe, 3-30 characters, alphanumeric + hyphens)
  - `displayName`: string (max 64 characters)
  - `bio`: string (max 500 characters, supports basic markdown)
  - `profilePhotoUrl`: string (uploaded to Supabase Storage, max 2MB)
  - `socialLinks`: array of `{ platform: string, url: string }` (max 10)
  - `contactEmail`: string | null (shown on page if provided)
  - `theme`: `{ preset: string, primaryColor?: string, secondaryColor?: string, fontFamily?: string, backgroundColor?: string }` or `brandKitId` reference
  - `collections`: array of `{ id: string, name: string, description?: string, order: number, videoIds: string[] }`
  - `videos`: array of `{ id: string, recordingId: string, title: string, description?: string, thumbnailUrl: string, videoUrl: string, externalUrl?: string, order: number, collectionId?: string, isPublic: boolean }`
  - `isPublished`: boolean
  - `customDomain`: string | null (Pro/Enterprise -- CNAME mapping)
  - `seoTitle`: string (max 60 chars)
  - `seoDescription`: string (max 160 chars)
  - `ogImageUrl`: string (social share preview)
- **Output:** A live, publicly accessible web page displaying the creator's video portfolio with inline playback, organized collections, creator bio, and contact options. The page is server-rendered for SEO and social media preview (Open Graph / Twitter Card meta tags).
- **Acceptance criteria:**
  - Each user can create one portfolio (free) or multiple portfolios (Pro/Enterprise)
  - Portfolio page loads in under 2 seconds on a 4G connection
  - Videos play inline with a custom player (no external redirects)
  - Portfolio is responsive: optimized for desktop, tablet, and mobile viewing
  - SEO meta tags (title, description, Open Graph, Twitter Card) are server-rendered
  - Portfolio URL is shareable and works without requiring viewer authentication
  - Creator can toggle individual videos between public and hidden
  - Analytics dashboard shows page views, video plays, and top referral sources over 7/30/90 day ranges
  - Theme customization applies brand kit colors and fonts when a brand kit is selected
  - Portfolio can be unpublished (taken offline) at any time, returning a 404 for the URL
  - Contact form submissions are delivered via email to the creator
  - Portfolio supports external video embeds (YouTube, Vimeo URLs rendered as embedded players)
  - Custom domain support (Pro/Enterprise) with SSL via Let's Encrypt or Cloudflare
- **Edge cases:**
  - Username conflict: enforce uniqueness at the database level; if desired username is taken, suggest alternatives
  - Creator deletes a recording that is featured in their portfolio: automatically remove it from the portfolio and backfill the layout
  - Video playback on mobile Safari: use HLS-compatible format or MP4 with proper encoding settings
  - High-traffic portfolio (viral creator): serve video assets through CDN (Supabase Storage + Cloudflare) to handle load
  - Creator's subscription lapses: keep portfolio live but add a small ProAnimate watermark/badge; disable custom domain
  - Offensive content reported by a viewer: implement a "Report" button that flags the portfolio for manual review
  - Portfolio with 100+ videos: implement pagination or infinite scroll with lazy-loaded thumbnails
  - Creator changes username: old URLs return a 301 redirect to the new URL for 90 days
- **Dependencies:** Supabase Auth (user identity), Supabase Storage (video files, thumbnails, profile photos), useRecordingsStore (source recordings/exports), Brand Kit System (theme customization), Express.js backend (portfolio API routes + SSR for meta tags), DNS/SSL infrastructure for custom domains
- **Integration with ProAnimate:**
  - New Supabase tables: `portfolios` (one per user, stores config), `portfolio_videos` (junction table linking recordings to portfolio), `portfolio_analytics` (page view and play events)
  - New Zustand store: `usePortfolioStore` for portfolio CRUD, video selection, ordering, and theme management
  - New server routes: `GET /portfolio/:username` (SSR public page), `GET/POST/PUT /api/portfolio` (CRUD), `POST /api/portfolio/analytics` (event tracking)
  - Dashboard gains a "Portfolio" card/tab showing portfolio status, quick link, and view count summary
  - Export flow (`ExportPanel.tsx` / `RecordingsPanel.tsx`) gains an "Add to Portfolio" button on each recording
  - Brand Kit integration: portfolio theme can inherit from user's brand kit (colors, fonts)
  - `useRecordingsStore` provides the source data; portfolio references recording IDs and uses their video URLs
  - Public portfolio page is a separate route (possibly a lightweight SSR page or static-generated page) outside the main SPA for SEO
- **Use cases:**
  1. A freelance animator builds a portfolio featuring their best 12 ProAnimate clips, organized into "Educational" and "Marketing" collections, and includes the URL on their Upwork profile and LinkedIn, generating client inquiries.
  2. A content creator shares their portfolio link in their TikTok and Instagram bios, giving followers a curated view of all their animated content with direct play -- serving as a central hub that is more professional than a link-tree.
  3. An agency creates a portfolio for each team member to showcase specialization (one animator for product demos, another for character-driven stories), embedding the portfolios on the agency's website via custom domains.
- **Why it matters:** A portfolio platform transforms ProAnimate from a creation tool into a career/business platform. Malloy has proven demand for video-specific portfolios (over 100 editing portfolio styles), while Behance and Dribbble dominate for design portfolios but poorly support video. By hosting portfolios natively, ProAnimate increases platform stickiness (creators are less likely to churn if their professional identity lives on the platform), generates organic discovery/SEO traffic (public portfolios link back to ProAnimate), and opens a new revenue stream (custom domains and premium portfolio features as upsell). This is a strong differentiator against competitors that only focus on creation and export.
- **Who has it:** Malloy Portal (video editor portfolios, free + $2/mo Plus tier), Behance (design), Dribbble (design), ArtStation (3D/animation), Carbonmade (creative), Contra (freelancer), Vimeo (video showcase)
- **Gold standard:** Malloy Portal is purpose-built for video editor portfolios. It offers a one-page layout that can be set up in 5 minutes, supports both short-form and long-form content, and provides a free tier (up to 4 video links) and a Plus tier ($2/month) with unlimited links. The portfolio is designed specifically for the video editing audience, with playback optimized for showcasing cuts and edits. Over 100 portfolio styles are available. The key insight from Malloy is simplicity: video portfolios should be fast to set up, video-first (not image-first like Behance), and provide a clean viewing experience that puts the work front and center without distracting design complexity.

---

## Category 8: Collaboration

### 21. Real-Time Collaboration
- **Category:** Collaboration
- **What it is:** Multi-user simultaneous editing where two or more team members can work on the same ProAnimate project at the same time, seeing each other's cursors, selections, and changes in real-time -- like Google Docs for animation.
- **What it does:** Real-Time Collaboration enables multiple authenticated users to open the same project and make concurrent edits that are instantly synchronized across all participants. Each user sees colored cursors and selection indicators showing where others are working. Changes to the timeline (adding/removing clips, adjusting timing), canvas elements (moving/resizing layers), text overlays, character configuration, and all other project state are synchronized via a Conflict-free Replicated Data Type (CRDT) layer built on Yjs. The system supports presence awareness (who is online, what they are viewing/editing), timestamped comments pinned to both canvas coordinates and timeline positions, granular permission roles (Owner, Editor, Commenter, Viewer), and a review mode where external stakeholders can leave feedback without editing access. Link sharing allows inviting collaborators without requiring them to have a ProAnimate account for viewing and commenting.
- **User flow:**
  1. Project owner opens a project and clicks the "Share" or "Collaborate" button in the top menu bar.
  2. Owner enters collaborator email addresses or generates a shareable link.
  3. Owner assigns a role to each collaborator: Editor (full edit access), Commenter (view + comment), or Viewer (view only).
  4. Collaborator receives an email invitation or opens the shared link, signs in (or views as guest for Commenter/Viewer roles).
  5. Both users now see each other's presence indicators (colored avatars in the top bar, colored cursors on the canvas).
  6. User A moves a character on the canvas; User B sees the movement in real-time (sub-200ms latency).
  7. User B adds a text overlay on the timeline; User A sees the new track appear instantly.
  8. A Commenter clicks on the canvas at timestamp 2.5s and types a comment: "Move the title higher." The comment appears as a pin on the canvas and a marker on the timeline.
  9. The Editor resolves the comment after making the change.
  10. All changes are auto-saved; the project's version history allows rolling back to any auto-save snapshot.
- **Properties/Parameters:**
  - **Presence:** `{ userId: string, displayName: string, avatarUrl: string, color: string, cursorPosition: {x, y}, selectedElementId: string | null, viewportBounds: Rect, lastActiveAt: timestamp }`
  - **Roles:** `'owner' | 'editor' | 'commenter' | 'viewer'`
  - **Share link:** `{ projectId: string, token: string, role: 'commenter' | 'viewer', expiresAt?: timestamp, maxUses?: number }`
  - **Comment:** `{ id: string, userId: string, text: string, canvasX?: number, canvasY?: number, timelineFrame?: number, threadId?: string, status: 'open' | 'resolved', createdAt: timestamp }`
  - **CRDT provider config:** `{ roomId: string (= projectId), signalingServers: string[], webSocketUrl: string, maxPeers: number (default 8) }`
  - **Version snapshot:** `{ id: string, projectId: string, userId: string, label?: string, stateBlob: Uint8Array, createdAt: timestamp }`
  - **Conflict resolution:** automatic via CRDT merge semantics (concurrent edits to different properties merge cleanly; concurrent edits to the same property use CRDT ordering)
  - **Latency target:** under 200ms for cursor/selection sync, under 500ms for state changes on typical broadband
- **Output:** A shared editing environment where multiple users see synchronized project state, live cursors, and comments in real-time. All edits are persisted to the same project with full version history.
- **Acceptance criteria:**
  - Two or more users can simultaneously edit the same project and see each other's changes within 500ms
  - Cursor positions and selections update within 200ms
  - Presence indicators show all active collaborators with colored avatars
  - Role-based access control enforced: Viewers cannot edit, Commenters can only comment, Editors can edit everything
  - Comments can be pinned to canvas position and/or timeline frame
  - Comments support threading (replies), resolution, and deletion
  - Share links work without requiring the recipient to have a ProAnimate account (guest access for viewing/commenting)
  - Concurrent edits to different store slices (e.g., one user edits text overlays while another edits timeline clips) merge without conflict
  - Concurrent edits to the same property (e.g., both users drag the same element) resolve deterministically via CRDT ordering
  - Version history maintains auto-save snapshots at configurable intervals (default: every 30 seconds when active changes detected)
  - Users can restore any version snapshot
  - Disconnection and reconnection handled gracefully: offline edits queue locally and sync on reconnect
  - Maximum 8 simultaneous editors per project (configurable)
  - WebSocket connection uses secure WSS with authentication
- **Edge cases:**
  - User goes offline mid-edit: local changes queue in IndexedDB; on reconnect, CRDT merge replays changes without data loss
  - Two users drag the same element to different positions simultaneously: CRDT ordering determines the final position; both users converge to the same state within 1 second
  - User opens the project in two browser tabs: detect duplicate sessions from the same user and warn/block the second tab
  - Share link is used after expiration: display a "link expired" page with a button to request new access from the owner
  - Large project (100+ layers, 50+ timeline tracks): batch CRDT updates to avoid performance degradation; implement selective sync (only sync visible viewport changes at full fidelity)
  - User with Editor role is demoted to Viewer while actively editing: immediately apply the new role, discard any in-flight edits, and show a notification
  - WebSocket server goes down: clients fall back to polling (every 5 seconds) until WebSocket reconnects; show a yellow "Reconnecting..." banner
  - Comment references a canvas element that was subsequently deleted: preserve the comment with a "referenced element no longer exists" note
- **Dependencies:** Supabase Auth (user identity + roles), WebSocket server (new infrastructure -- either a dedicated Node.js WebSocket service or Supabase Realtime channels), Yjs CRDT library, existing Zustand stores (all stores need CRDT-aware sync adapters), Supabase database (collaborator permissions, comments, version history), existing projectService.ts (save/load)
- **Integration with ProAnimate:**
  - New dependency: `yjs` + `y-websocket` (or `y-webrtc` for peer-to-peer fallback)
  - Each Zustand store that contributes to project state (useTimelineStore, useTextOverlayStore, useShapeStore, useCharacterConfigStore, useMediaStore, useKeyframeStore, useSVGObjectStore, useHTMLTemplateLayerStore, useCanvasStore, useVoiceStore, etc.) is wrapped with a Yjs sync adapter that maps Zustand mutations to Y.Map/Y.Array operations
  - New Zustand store: `useCollaborationStore` managing presence, comments, permissions, connection status
  - New server infrastructure: WebSocket server (or Supabase Realtime channel) for CRDT document sync and presence broadcasting
  - New Supabase tables: `project_collaborators` (user_id, project_id, role), `project_comments` (with canvas/timeline anchoring), `project_versions` (CRDT state snapshots)
  - `TopMenuBar.tsx` gains presence avatars and a "Share" button opening a collaborator management modal
  - `VideoCanvas.tsx` renders remote user cursors as colored pointers with name labels
  - `Timeline.tsx` renders comment markers at pinned frames
  - `useProjectStore` save/load integrates with Yjs document persistence (save writes the CRDT doc to Supabase; load initializes from it)
  - Share panel (`SharePanel.tsx`) is extended from social publishing to include collaboration invitations
- **Use cases:**
  1. A two-person creator team works on a 30-second animated ad: one person builds the character animation and lip sync while the other arranges text overlays and background media on the timeline, both working simultaneously and seeing each other's progress in real-time.
  2. A client reviews an animation draft via a share link (Commenter role), leaving timestamped comments ("Logo should appear at 0:05, not 0:03") that the animator resolves one by one without a separate feedback tool.
  3. A content agency has 5 editors working across different projects in a shared workspace, with a team lead reviewing in-progress work using Viewer access and adding comments for revision, streamlining the approval workflow.
- **Why it matters:** Real-time collaboration is the defining feature of modern web-based creative tools and the primary reason teams choose browser-based editors over desktop software. Jitter's real-time co-editing is a core competitive advantage that has fueled their growth. Kapwing built their entire business positioning around collaborative video editing for teams. Rive offers real-time collaboration on their free tier, setting the expectation that collaboration is table-stakes. For ProAnimate, collaboration unlocks the team/enterprise segment where multiple seats per account drive higher revenue per customer. Without it, ProAnimate is limited to single-user workflows, which caps the addressable market at individual creators and excludes agencies, marketing teams, and production studios.
- **Who has it:** Jitter (real-time multi-user co-editing), Kapwing (collaborative video editing with roles/comments), Rive (real-time collaboration + version control, free tier), Cardboard/YC W26 (real-time team review), Figma (gold standard for design collaboration), Google Docs (paradigm for real-time document editing)
- **Gold standard:** Jitter implements the best collaboration experience specifically for motion/animation tools. Multiple editors work simultaneously in the same file with real-time sync that has been progressively improved for reliability. Comments are timestamped and synced across both the canvas position and the timeline moment, so feedback is precisely contextual. Link sharing enables review without requiring the viewer to have a Jitter account. The combination of pixel-accurate co-editing, contextual comments, and frictionless sharing (no account needed for reviewers) sets the standard. For the broader creative tools category, Figma remains the ultimate reference: multiplayer cursors, component-level locking, branching, version history, and guest access create a collaboration experience so seamless that it transformed the entire design industry from desktop to browser-first workflows.

---

### 25. Figma Plugin
- **Category:** Collaboration
- **What it is:** A Figma plugin that allows designers to select frames, components, and layers in Figma and import them into ProAnimate as animatable elements, bridging the gap between static design and animated video production.
- **What it does:** The Figma Plugin connects ProAnimate's animation capabilities to the world's most popular UI/UX design tool. Designers install the plugin from the Figma Community, select any frame or layer group in their Figma file, and click "Send to ProAnimate" in the plugin UI. The plugin exports the selected elements as structured data (SVG paths, image fills, text content, layout hierarchy, colors, fonts) and sends them to ProAnimate via the REST API or a clipboard-based copy/paste flow. In ProAnimate, the imported elements appear as animatable layers on the canvas, preserving their exact Figma layout, colors, and typography. The designer can then add animations (fade, slide, scale, rotate), transitions, lip-synced characters, and timeline orchestration. A sync feature allows updating the Figma source without losing animations already applied in ProAnimate. The plugin also supports importing Figma component variants as animation states.
- **User flow:**
  1. Designer installs the "ProAnimate - Animate Your Figma Designs" plugin from the Figma Community marketplace.
  2. Designer opens their Figma file and selects the frame(s) they want to animate.
  3. Designer runs the plugin (via Plugins menu or Ctrl+/).
  4. The plugin UI shows the selected frame(s) with a preview, element count, and export options (quality, format, layer flattening preferences).
  5. Designer clicks "Copy to ProAnimate." The plugin serializes the selection as a structured payload (JSON with SVG data, images, text, layout).
  6. Designer switches to ProAnimate and uses Ctrl/Cmd+V to paste, or the plugin opens ProAnimate in a new tab with the import payload in the URL hash/clipboard.
  7. ProAnimate's import dialog shows the incoming layers with a preview. Designer confirms the import.
  8. The Figma layers appear on the ProAnimate canvas as individual animatable elements (text overlays, SVG objects, image layers) preserving exact position, size, color, and font.
  9. Designer adds animations to each layer using ProAnimate's keyframe system or AI-assisted animation presets.
  10. Later, designer updates the Figma source (changes a headline or swaps an image) and uses the plugin's "Update in ProAnimate" feature: the layers are re-synced while preserving existing animations.
- **Properties/Parameters:**
  - **Plugin manifest:** `{ name: "ProAnimate", id: string, api: "1.0.0", main: "code.js", ui: "ui.html", editorType: ["figma", "figjam"] }`
  - **Export payload:** `{ version: 1, frames: [{ id: string, name: string, width: number, height: number, layers: Layer[] }] }`
  - **Layer types:** `{ type: 'text' | 'image' | 'vector' | 'group' | 'component', name: string, x: number, y: number, width: number, height: number, rotation: number, opacity: number, fills: Fill[], strokes: Stroke[], text?: { content: string, fontFamily: string, fontSize: number, fontWeight: number, color: string, alignment: string }, svgPath?: string, imageBytes?: Uint8Array, children?: Layer[] }`
  - **Import options:** `flattenGroups: boolean` (merge nested groups into single layers), `importAsType: 'svg' | 'image' | 'auto'` (how to render vector elements), `preserveHierarchy: boolean`, `maxImageResolution: number`
  - **Sync options:** `syncMode: 'overwrite' | 'merge'` (overwrite replaces all layers; merge updates changed layers and preserves animations)
  - **Authentication:** ProAnimate user token passed via plugin settings or OAuth flow within the plugin UI
- **Output:** Figma design elements imported as native ProAnimate canvas layers (text overlays, SVG objects, image layers) that can be animated using ProAnimate's full animation system. Sync allows non-destructive updates from Figma.
- **Acceptance criteria:**
  - Plugin installs from Figma Community and loads within 3 seconds
  - Supports importing frames, groups, text layers, vector shapes, and rasterized images
  - Text imports preserve font family, size, weight, color, and alignment (mapped to ProAnimate's 26+ font families; closest match for unavailable fonts)
  - Vector shapes import as SVG objects in useSVGObjectStore
  - Images export at configurable resolution (1x, 2x, 3x) and import into useMediaStore
  - Layout position and hierarchy are preserved (x, y, width, height, rotation, opacity match the Figma source within 1px accuracy)
  - Color values are preserved exactly (hex match)
  - Sync/update replaces changed layers while retaining existing ProAnimate animations on unchanged layers
  - Figma component variants can be imported as separate animation states
  - Plugin works with both Figma and Figma Draw
  - Copy-paste workflow works across the browser without requiring any server round-trip for the data transfer
  - Plugin has a simple, minimal UI consistent with Figma's design language
  - Import of a frame with 50+ layers completes in under 5 seconds
- **Edge cases:**
  - Figma layer uses a Google Font not available in ProAnimate: map to the closest available font and display a "font substituted" warning with the original font name
  - Complex vector paths with boolean operations (union, subtract, intersect): flatten to a single SVG path before import
  - Image fills that reference external URLs: download and embed the image data in the export payload
  - Nested component instances: flatten to their visual output unless the user opts to preserve hierarchy
  - Very large frames (e.g., 5000x5000px): warn the user and offer to scale down to canvas dimensions
  - User pastes Figma data into a project that already has layers from a previous import: offer to replace or add alongside existing layers
  - Figma plugin API rate limits or payload size limits: chunk large exports into multiple clipboard operations if needed
  - Figma updates their plugin API (breaking changes): version the plugin manifest and maintain backward compatibility
  - User attempts to import a Figma prototype (with interactions/transitions): ignore prototype-specific data and import only visual layers with a warning
- **Dependencies:** Figma Plugin API (JavaScript/HTML), ProAnimate REST API or clipboard API for data transfer, useSVGObjectStore (vector imports), useTextOverlayStore (text imports), useMediaStore (image imports), useCanvasStore (layout positioning), Brand Kit System (optional color mapping from imported Figma styles to brand kit)
- **Integration with ProAnimate:**
  - Plugin code lives in a separate repository or `plugin/figma/` directory, built with TypeScript + Figma Plugin API
  - ProAnimate frontend gains an "Import from Figma" action in the left panel or File menu that listens for clipboard paste events containing the Figma export payload structure
  - New service: `src/services/figmaImport.ts` that parses the export payload and dispatches to appropriate stores (text to useTextOverlayStore, SVG to useSVGObjectStore, images to useMediaStore, positions to useCanvasStore)
  - `useCanvasStore` gains an `importLayers(layers[])` method that batch-creates canvas elements at specified positions
  - The AI Orchestrator could optionally accept Figma imports as a starting point ("Animate this design" prompt)
  - Plugin authentication uses the same Supabase JWT flow, with a token entry field in the plugin settings UI
  - Sync metadata stored in a `figma_imports` Supabase table linking Figma file IDs/node IDs to ProAnimate element IDs for future updates
- **Use cases:**
  1. A design team creates social media post layouts in Figma (titles, graphics, branded backgrounds) and a motion designer imports them into ProAnimate to add entrance animations, text reveals, and character overlays -- reducing the design-to-animation handoff from hours to minutes.
  2. A UI/UX designer creates app onboarding screens in Figma and imports them into ProAnimate to create an animated walkthrough video for the app store listing, preserving exact spacing and typography.
  3. A marketing team uses Figma for campaign visual development. When the static designs are approved, they import them to ProAnimate, add kinetic typography and animated elements, and export as video ads -- keeping a single source of truth in Figma and non-destructively layering animation in ProAnimate.
- **Why it matters:** Figma has over 4 million paying customers and is the dominant design tool. A Figma plugin positions ProAnimate directly in the design-to-animation pipeline, capturing users at the point where static designs need to become animated content. Jitter's 3 Figma plugins have over 300K users, demonstrating massive demand for Figma-to-animation workflows. The plugin serves as a powerful acquisition channel (discovery via Figma Community) and a retention hook (designers who build their animation workflow around the Figma-ProAnimate pipeline are deeply locked in). Without a Figma plugin, ProAnimate requires designers to manually recreate their designs as canvas elements, which is a significant friction point that competitors have already eliminated.
- **Who has it:** Jitter (3 Figma plugins with 300K+ users, pixel-perfect import, layer sync), Rive (Figma-to-Rive plugin), LottieFiles (Figma plugin for Lottie export), Framer (Figma import), Principle (Figma import)
- **Gold standard:** Jitter sets the gold standard for Figma-to-animation plugins. Their all-new Figma plugin (February 2025) supports: pixel-perfect copy-paste of any frame or layer, multi-layer batch import, and -- critically -- non-destructive sync where designers can update their Figma source and re-sync to Jitter using Shift+Ctrl+V while preserving all existing animations. The import preserves size, fill, and stroke characteristics exactly. Their animation model (instruction-based rather than raw keyframes) makes the post-import workflow intuitive for designers who are not animation specialists. The combination of precise import fidelity, sync without animation loss, and an animation model accessible to designers has made Jitter's Figma plugin their primary growth channel.

---

### 46. Offline Support
- **Category:** Collaboration
- **What it is:** Full application functionality without an internet connection, with automatic data synchronization when connectivity is restored, enabling creators to work from anywhere regardless of network availability.
- **What it does:** Offline Support transforms ProAnimate from a cloud-dependent web application into a resilient, offline-first Progressive Web App (PWA). When the user loses internet connectivity, the application continues to function with full editing capabilities: timeline manipulation, canvas editing, character configuration, text overlays, shape placement, and playback all work identically to online mode. Asset loading is handled through aggressive caching: recently used sprites, audio files, Lottie animations, and media are cached in IndexedDB and the Service Worker cache. Project state is persisted locally via IndexedDB and synced to Supabase when connectivity returns. A status indicator shows online/offline state and sync progress. AI features that require server calls (TTS generation, Gemini script generation, character generation, orchestrator) gracefully degrade with clear messaging about which features are unavailable offline, while all local editing remains fully functional. On reconnection, a background sync process reconciles local changes with the server, using timestamp-based conflict resolution with the option for manual merge if conflicts are detected.
- **User flow:**
  1. User installs ProAnimate as a PWA via the browser's "Install App" prompt (or Add to Home Screen on mobile).
  2. On first use while online, the Service Worker caches the application shell (HTML, CSS, JS bundles), default assets, and the user's recently accessed project data.
  3. User opens a project and begins editing. All project data is loaded into local IndexedDB.
  4. Internet connection drops (airplane mode, poor Wi-Fi, traveling). A yellow banner briefly appears: "You're offline -- changes will sync when you reconnect."
  5. User continues editing: adds text overlays, repositions characters, adjusts timeline clips, modifies keyframes. All changes are saved locally.
  6. User attempts to generate a voice (server-required): a dialog explains "Voice generation requires an internet connection. This will be queued and processed when you're back online."
  7. User exports a video using local rendering (WebCodecs/MediaRecorder work offline since they are browser-native).
  8. Internet reconnects. A green banner appears: "Back online -- syncing changes..." A progress indicator shows sync status.
  9. Background sync uploads all local changes to Supabase. If no conflicts exist (the common case for single-user), sync completes silently.
  10. If another device made changes to the same project while offline, a conflict resolution dialog appears showing the differences and letting the user choose which version to keep (or merge).
- **Properties/Parameters:**
  - **Service Worker config:** `{ precacheManifest: string[], runtimeCacheStrategies: { appShell: 'cache-first', api: 'network-first', media: 'stale-while-revalidate' }, maxCacheSize: number (default 500MB) }`
  - **IndexedDB stores:** `{ projects: IDBObjectStore, assets: IDBObjectStore, pendingChanges: IDBObjectStore, syncQueue: IDBObjectStore }`
  - **Sync queue entry:** `{ id: string, storeKey: string, operation: 'create' | 'update' | 'delete', data: any, timestamp: number, synced: boolean }`
  - **Conflict resolution:** `{ strategy: 'last-write-wins' | 'manual-merge', conflictThreshold: number (ms -- changes within this window are considered conflicting) }`
  - **Offline capabilities:** full: canvas editing, timeline, playback, text/shape/keyframe editing, local video export. Degraded: no AI generation (TTS, scripts, characters, orchestrator), no social publishing, no Pixabay search, no cloud save (queued)
  - **Cache limits:** `{ maxProjectCache: 10 (recent projects), maxAssetCacheMB: 500, maxMediaCacheMB: 200 }`
  - **PWA manifest:** `{ name: "ProAnimate", short_name: "ProAnimate", start_url: "/", display: "standalone", theme_color: "#0f172a", background_color: "#0f172a", icons: [...] }`
- **Output:** A fully functional editing experience that persists through connectivity loss, with all changes automatically synchronized when the connection returns. Users experience no data loss and minimal workflow disruption.
- **Acceptance criteria:**
  - Application installs as a PWA on Chrome, Edge, Safari (macOS/iOS), and Firefox
  - Application loads and is fully interactive within 3 seconds when offline (from Service Worker cache)
  - All canvas editing operations (move, resize, rotate, add/delete layers) work identically offline and online
  - Timeline operations (add/remove tracks, adjust clip timing, scrub playback) work offline
  - Text overlay editing, shape editing, and keyframe manipulation work offline
  - Local video export (WebCodecs/MediaRecorder) works offline
  - Audio playback of cached voice files works offline
  - Character sprite rendering works offline for cached character assets
  - Project save to local IndexedDB succeeds offline with no user-visible delay
  - Online/offline status indicator is visible in the top menu bar
  - Sync completes within 30 seconds of reconnection for a typical project (under 50MB)
  - Conflict detection works for same-project changes made on different devices
  - Degraded features (AI, social, search) show clear "requires internet" messaging, not silent failure or cryptic errors
  - Cached data does not exceed configured limits; LRU eviction removes oldest unused assets
  - PWA scores 90+ on Lighthouse PWA audit
- **Edge cases:**
  - User opens a project offline that was never cached: show "This project is not available offline" with a list of cached projects that are available
  - IndexedDB storage quota exceeded: warn user, offer to clear old project caches, and prevent further offline saves from silently failing
  - User makes extensive offline edits and then loads the cloud version on another device: present a side-by-side diff showing local vs. cloud state
  - Service Worker update available: show a "New version available -- reload to update" banner; do not force-reload during active editing
  - Large media files (video, high-res images) not cached due to size limits: show placeholder thumbnails with "Available online" labels
  - User opens the app in multiple offline tabs: use BroadcastChannel to prevent concurrent edits from different tabs, showing a "Project is open in another tab" warning
  - Background sync fails after reconnection (server error): retry with exponential backoff; after 3 failures, prompt user to manually trigger sync
  - User deletes browser data/cache: project data in IndexedDB may survive (separate from Service Worker cache); if both are cleared, notify on next load that local data was lost and offer to restore from cloud
  - iOS Safari PWA limitations (no background sync API): use visibility change events to trigger sync when the app returns to foreground
- **Dependencies:** Vite PWA plugin (vite-plugin-pwa / workbox), Service Worker API, IndexedDB (already used by ProAnimate for character3dDB, mediaDB, recordingsDB, characterDB), BroadcastChannel API, existing Supabase persistence layer (projectService.ts), existing Zustand stores with persist middleware (useSettingsStore pattern)
- **Integration with ProAnimate:**
  - New Vite config: add `vite-plugin-pwa` with workbox configuration for precaching and runtime caching strategies
  - New file: `src/sw.ts` (Service Worker) defining cache strategies: cache-first for app shell and static assets, network-first for API calls, stale-while-revalidate for media
  - `public/manifest.json` (PWA manifest) with app name, icons, theme colors, display mode
  - Existing IndexedDB usage (character3dDB.ts, mediaDB.ts, recordingsDB.ts, characterDB.ts) is already offline-compatible; extend with a `projectOfflineDB.ts` for full project state serialization
  - New Zustand store: `useOfflineStore` tracking connection status, sync queue, sync progress, and cached project inventory
  - `useProjectStore.saveProject()` gains a dual-write path: always write to IndexedDB first (instant), then attempt Supabase write (if online, otherwise queue)
  - `useProjectStore.loadProject()` checks IndexedDB first (instant), then reconciles with Supabase version if online
  - All server-dependent services (gemini.ts, elevenlabs.ts, orchestrator.ts, pixabay.ts, nanoBanana.ts, socialPublish.ts) gain an `isOffline()` guard that returns a descriptive error instead of making a network request
  - `TopMenuBar.tsx` gains a connection status indicator (green dot = online, yellow dot = syncing, red dot = offline)
  - `videoExport.ts` already uses browser-native WebCodecs/MediaRecorder, which work offline; no changes needed for export
  - `useSettingsStore` already uses Zustand persist middleware with localStorage -- extend the pattern to IndexedDB for larger project data
- **Use cases:**
  1. A creator on a 12-hour international flight opens ProAnimate (installed as PWA) and edits their latest animation project: adjusting timing, repositioning characters, refining text overlays. On landing, they connect to Wi-Fi, and all changes sync to the cloud within seconds.
  2. A content creator in a region with unreliable internet works on ProAnimate throughout the day. The app seamlessly transitions between online and offline states, never interrupting their editing workflow. AI features (voice generation, script writing) are batched and processed during online windows.
  3. A field journalist uses ProAnimate on a tablet to assemble an animated explainer at an event with poor connectivity, exports the video locally, and uploads it to social media when they reach stable Wi-Fi later.
- **Why it matters:** Offline support is increasingly expected in professional creative tools, especially as the market expands beyond developed markets with reliable broadband. Jitter has announced plans for a desktop version with offline support, recognizing the demand. For ProAnimate's PWA architecture, offline support is technically achievable (the app already uses IndexedDB extensively and browser-native rendering) and provides a significant competitive advantage over competitors that require constant connectivity. It dramatically improves perceived reliability and user confidence: users never worry about losing work due to a dropped connection. Offline capability also enables mobile-first workflows on tablets and phones in areas with intermittent connectivity, expanding the addressable user base. From a technical perspective, the offline-first architecture (write local first, sync to cloud) also improves perceived performance for online users, as saves feel instant.
- **Who has it:** Jitter (announced, desktop app planned), Figma (offline mode with auto-sync for desktop app), CapCut (desktop app with full offline), DaVinci Resolve (desktop, fully offline), Notion (offline mode + sync), Linear (offline-first with CRDT sync)
- **Gold standard:** Figma's desktop application provides the reference implementation for offline support in a collaborative web-based creative tool. Figma caches files locally, allows full editing while offline, and syncs changes automatically when connectivity returns. The sync is seamless and handles conflicts through a version-based merge strategy. Their approach of local-first with cloud sync means the app feels fast even when online (no network round-trip for saves) while maintaining full cloud persistence. For a more recent reference in a similar domain, Linear (the project management tool) uses CRDTs (via IndexedDB) for an offline-first architecture where every action is instant locally and synced in the background, providing a benchmark for how offline-first feels in practice: the user should never notice whether they are online or offline during normal editing operations.

---

## Category 9: Automation & Developer Tools

### 27. API for Automation
- **Category:** Automation & Developer Tools
- **What it is:** An internal REST API layer that exposes ProAnimate's video generation pipeline for programmatic control via HTTP requests, enabling third-party integrations with Zapier, Make, n8n, and custom code.
- **What it does:** Wraps the existing orchestrator pipeline (orchestrator.ts) behind authenticated Express.js endpoints so external systems can submit a text prompt or ClipPlan JSON and receive a rendered video. It accepts the same parameters the orchestrator already uses -- prompt text, aspect ratio, character selections, voice settings, duration -- and returns a job ID. The caller polls for status or receives a webhook callback when rendering completes. This converts ProAnimate from a manual GUI tool into an automatable video factory, enabling workflows like "every time a new blog post is published, generate a TikTok summary video."
- **User flow:**
  1. Developer navigates to Settings > API Keys and generates a new API key, which is stored hashed in the `api_keys` Supabase table linked to their user ID.
  2. Developer copies the key and reads the interactive API docs at `/docs/api`.
  3. Developer sends a POST request to `/api/v1/renders` with `Authorization: Bearer <key>`, a JSON body containing `prompt`, `settings` (aspect ratio, duration, fps, features), and optionally a `webhook_url`.
  4. Server validates the key, checks rate limits and credit balance, creates a render job in the `render_jobs` table, and returns `{ jobId, status: "queued" }`.
  5. The orchestrator pipeline executes asynchronously (plan generation, voice synthesis, asset placement, export).
  6. Developer either polls `GET /api/v1/renders/:jobId` for status updates, or receives a POST callback to their webhook_url with the final status and download URL.
  7. Developer downloads the rendered MP4/WebM from a signed Supabase Storage URL valid for 24 hours.
- **Properties/Parameters:**
  - `prompt` (string, required): The text prompt describing the desired video
  - `clip_plan` (ClipPlan JSON, optional): Pre-built plan to skip AI planning phase
  - `settings.aspectRatio` (enum: "16:9" | "9:16" | "1:1" | "4:3" | "21:9", default: "9:16")
  - `settings.durationSeconds` (number, 5-300, default: 30)
  - `settings.fps` (number, 24 | 30 | 60, default: 30)
  - `settings.format` (enum: "mp4" | "webm", default: "mp4")
  - `settings.quality` (number, 0.1-1.0, default: 0.8)
  - `settings.features.music` (boolean, default: true)
  - `settings.features.captions` (boolean, default: true)
  - `settings.features.stockMedia` (boolean, default: true)
  - `settings.features.svgObjects` (boolean, default: true)
  - `settings.characterIds` (string[], optional): IDs of saved characters to use
  - `settings.voiceId` (string, optional): ElevenLabs voice ID override
  - `settings.templateIds` (string[], optional): IDs of HTML templates to include
  - `webhook_url` (string, optional): URL to POST on completion/failure
  - `metadata` (object, optional): Arbitrary key-value pairs returned in webhook payloads
  - Rate limit headers: `X-RateLimit-Limit`, `X-RateLimit-Remaining`, `X-RateLimit-Reset`
- **Output:** A render job object containing: `jobId`, `status` (queued | planning | rendering | encoding | succeeded | failed), `progress` (0-100), `downloadUrl` (signed URL, null until succeeded), `cost` (credit breakdown), `metadata`, `createdAt`, `completedAt`.
- **Acceptance criteria:**
  - API key generation, rotation, and revocation works from the Settings panel
  - POST /api/v1/renders accepts a prompt and returns a jobId within 2 seconds
  - Render jobs execute the full orchestrator pipeline (all 13 steps) server-side
  - GET /api/v1/renders/:jobId returns current status, progress percentage, and cost
  - Webhook POST fires within 5 seconds of job completion/failure with the final status payload
  - Download URLs are signed with 24-hour expiry
  - Rate limiting enforced per API key with configurable tiers (e.g., Free: 10/hour, Pro: 100/hour)
  - Credit deduction happens at job creation; refund on failure
  - API returns proper HTTP status codes: 401 (invalid key), 402 (insufficient credits), 429 (rate limited), 422 (validation error)
  - OpenAPI 3.0 spec auto-generated and served at /api/v1/docs
- **Edge cases:**
  - Webhook URL is unreachable: Retry with exponential backoff (3 attempts, 10s/60s/300s), then mark webhook as failed in the job record. Job result remains pollable.
  - Job takes longer than 10 minutes: Auto-timeout, mark as failed, refund credits, notify via webhook.
  - Concurrent render limit exceeded: Queue the job, return status "queued" with estimated wait time.
  - API key used after user account is deactivated: Return 401 with descriptive error.
  - ClipPlan JSON has invalid schema: Return 422 with JSON Schema validation errors pointing to the exact path.
  - User submits prompt in a language the orchestrator cannot handle: Fall back to English plan generation with a warning in the response.
- **Dependencies:** Existing orchestrator.ts pipeline, Express.js server (server/index.ts), Supabase Auth for user identity, videoExport.ts for rendering, Supabase Storage for output files, credit system (creditGate.ts).
- **Integration with ProAnimate:** Reuses the entire `generateClipPlan()` and step execution pipeline from orchestrator.ts. API keys link to Supabase Auth user IDs. Render jobs write to the same `projects` table so users can view API-generated clips in the Dashboard. Credit deduction uses the existing `withCreditGate()` wrapper. The Express server (server/index.ts) gets a new route mount for `/api/v1/` with dedicated auth middleware that validates API keys instead of session cookies.
- **Use cases:**
  - SaaS company generates a weekly product update video from release notes, triggered by a GitHub webhook through Zapier
  - E-commerce store creates personalized product videos for each new listing uploaded to Shopify, using Make.com
  - Content agency batch-generates 50 localized ad creatives per campaign, orchestrated from their internal CMS
- **Why it matters:** API access is the single highest-leverage feature for enterprise adoption and revenue growth. Creatomate built their entire business ($41-249/mo) around API-first video generation. D-ID and Submagic both gate API access to higher-tier plans, creating strong upsell pressure. An API transforms ProAnimate from a single-user creative tool into a scalable infrastructure product that can serve thousands of automated renders per day. This unlocks B2B SaaS revenue, agency partnerships, and platform integrations that would be impossible with a GUI-only product.
- **Who has it:** Creatomate (core product), D-ID (all plans), Submagic (Business plan at $69/mo), Moovly (Enterprise), HeyGen (Streaming API + Video API).
- **Gold standard:** Creatomate sets the standard with a single-endpoint REST API (`POST /v1/renders`), per-project API keys, webhook callbacks on render completion, OpenAPI documentation, SDKs for Node.js/Python/PHP, and both template-based and freeform JSON rendering modes. Authentication is a simple Bearer token, renders return a status object with polling support, and the webhook payload includes the download URL and full render metadata.

---

### 28. Reusable Timing Templates
- **Category:** Automation & Developer Tools
- **What it is:** A system for saving, sharing, and re-applying animation timing patterns -- the rhythm, pacing, and sequencing of a clip -- independently from its content (text, characters, media).
- **What it does:** Captures the temporal structure of a completed clip (when dialogue lines start/end, when text overlays appear, when transitions fire, when music hits occur, camera movements, emotion cue timing) as an abstract "timing template" that can be applied to completely different content. When a user creates a video with good pacing, they can extract its timing skeleton and re-use it with new scripts, characters, and visuals. The template stores relative time markers (percentages of total duration) rather than absolute frame numbers, allowing it to stretch or compress to fit different clip lengths. This is especially powerful for series content where every episode follows the same rhythm.
- **User flow:**
  1. User finishes editing a clip that has great pacing and timing.
  2. User clicks "Save as Timing Template" from the Timeline Controls toolbar.
  3. A dialog appears showing the extracted timing structure: dialogue cadence, text overlay windows, transition points, music sync hits, camera keyframes. User names the template (e.g., "60s Hook-Story-CTA") and optionally adds tags.
  4. Template is saved to the user's library (Supabase `timing_templates` table).
  5. Later, when creating a new clip (manually or via orchestrator), user clicks "Apply Timing Template" and selects from their library.
  6. The system maps the template's timing slots onto the new content: dialogue lines are spaced according to the template's cadence, text overlays appear at the same relative positions, transitions fire at matching percentages.
  7. User fine-tunes any misalignments and can update the template with corrections.
- **Properties/Parameters:**
  - `name` (string, required): Human-readable template name
  - `tags` (string[], optional): Categorization tags (e.g., "hook", "tutorial", "listicle")
  - `baseDurationSeconds` (number): Original clip duration used as reference
  - `dialogueSlots` (array): Each slot has `startPercent`, `endPercent`, `speakerRole` (e.g., "narrator", "character-1"), `emotionCue`
  - `textOverlaySlots` (array): `startPercent`, `endPercent`, `preset` (title/subtitle/CTA/quote), `animationType`
  - `transitionPoints` (array): `atPercent`, `type` (fade/cut/slide/zoom)
  - `musicSyncHits` (array): `atPercent`, `intensity` (0-1)
  - `cameraKeyframes` (array): `atPercent`, `movement` (zoom-in/pan-left/etc.), `intensity`
  - `templateStructure` (array): Ordered list of scene segments with `type` (hook/story/climax/CTA/outro), `startPercent`, `endPercent`
  - `stretchMode` (enum: "proportional" | "preserve-pauses" | "compress-dialogue", default: "proportional")
- **Output:** A saved timing template that can be browsed, previewed (as an abstract timeline visualization), applied to new projects, exported as JSON, and shared with team members. When applied, produces a pre-populated timeline with all timing markers set, ready for content insertion.
- **Acceptance criteria:**
  - "Save as Timing Template" button appears in TimelineControls after a clip has at least 3 timeline elements
  - Extraction captures dialogue timing, text overlay windows, transitions, camera keyframes, and music sync points
  - Templates store timing as percentages (0-100%) of total duration, not absolute frames
  - Applying a template to a new clip correctly maps N dialogue lines to N timing slots (or the closest fit if counts differ)
  - Templates stretch/compress cleanly when applied to clips of different durations (e.g., a 30s template applied to a 60s clip)
  - Template library supports search, tag filtering, preview, rename, delete
  - Templates persist in Supabase with user ownership and optional sharing
  - JSON export/import for template portability
- **Edge cases:**
  - New clip has more dialogue lines than the template has slots: Extra lines are evenly distributed in the remaining time after the last slot, with a warning shown.
  - New clip has fewer dialogue lines than template slots: Empty slots are collapsed, remaining slots re-proportioned, with a notification.
  - Template applied to a drastically different duration (e.g., 15s template to 120s clip): Show a warning that pacing may feel unnatural; suggest the "preserve-pauses" stretch mode.
  - Template references a character role that does not exist in the new clip: Map to the closest available character by dialogue order, flag the mismatch.
  - User deletes a project that a timing template was extracted from: Template remains independent and fully functional.
- **Dependencies:** useTimelineStore.ts for extracting clip structure, useMultiCharacterStore.ts for dialogue timing, useTextOverlayStore.ts for overlay windows, useCameraStore.ts for camera keyframes, orchestrator.ts for applying templates during automated generation.
- **Integration with ProAnimate:** Timing templates are extracted from the existing useTimelineStore track/clip data, useVoiceStore dialogue alignment, and useCameraStore keyframes. The orchestrator can optionally receive a `timingTemplateId` in OrchestratorSettings, causing the `finalize-timeline` step to apply the template after content placement. The Timeline component (Timeline.tsx) shows template timing markers as guide lines when a template is active. Templates are stored in a new Supabase `timing_templates` table linked to user IDs.
- **Use cases:**
  - A YouTuber creates a "Weekly News Recap" series where every episode follows the same 60-second structure: 3s hook, 5s intro, 40s content (4 segments), 7s CTA, 5s outro. They save this as a timing template and apply it every week with new content.
  - An agency creates timing templates for each client's brand rhythm (fast-paced for Gen-Z, measured for corporate) and applies them to all videos for that client.
  - A music artist syncs lyrics to a beat once, then uses the timing template to generate dozens of visual variations with different backgrounds and styles (the LYRC model).
- **Why it matters:** LYRC proved this concept with 27,000+ artists: sync timing once, generate unlimited variations. For short-form content creators producing series or branded content, timing is the hardest part to get right and the most repetitive to redo. Reusable timing templates convert hours of per-clip timing work into a one-time setup. This creates strong lock-in (users build a library of templates they depend on) and enables the batch generation feature.
- **Who has it:** LYRC (core concept for lyric videos), Creatomate (template-based rendering with dynamic data injection), Submagic (style presets with timing), Synthesia (template-based scenes).
- **Gold standard:** LYRC's approach is the gold standard for this specific concept. Users sync their lyrics to music once, creating a reusable timing template. They can then regenerate unlimited visual variations (different backgrounds, styles, effects) while the timing synchronization is preserved perfectly. The timing template is the persistent asset; everything else is interchangeable. Creatomate extends this to general video with their template system, where the visual design and timing are the template, and dynamic data (text, images, colors) flows in via API.

---

### 41. Public REST API
- **Category:** Automation & Developer Tools
- **What it is:** A fully documented, versioned, developer-facing REST API with interactive documentation, client SDKs, rate limiting, usage analytics, and a developer portal.
- **What it does:** Extends the internal API (Feature 27) into a polished public developer product. This includes a developer portal with registration, API key management (multiple keys per account, per-key permissions and rate limits), interactive OpenAPI documentation with "Try It" functionality, webhook management, usage dashboards with charts showing requests/credits/errors over time, and client libraries for JavaScript/Python/cURL. The API covers the full ProAnimate surface: project CRUD, character library access, orchestrator invocation, individual service endpoints (TTS, lip sync, SVG generation), template browsing, and render management.
- **User flow:**
  1. Developer signs up at developers.proanimate.com (separate portal from the main app, but same Supabase Auth).
  2. Developer creates an "application" (named project) and receives API credentials (client ID + secret for OAuth, or a simple API key for testing).
  3. Developer reads the interactive API reference (Swagger UI or Redoc) at /api/v1/docs, which shows every endpoint with request/response schemas, examples, and a "Try It" sandbox.
  4. Developer installs the SDK: `npm install @proanimate/sdk` or `pip install proanimate`.
  5. Developer writes integration code: `const client = new ProAnimate({ apiKey }); const job = await client.renders.create({ prompt: '...' })`.
  6. Developer monitors usage in the portal dashboard: requests by endpoint, credit consumption, error rates, average render time, webhook delivery success rate.
  7. Developer upgrades their plan when they need higher rate limits or additional features.
- **Properties/Parameters:**
  - **Authentication:** API Key (Bearer token) for server-to-server; OAuth 2.0 + PKCE for client apps
  - **Versioning:** URL path versioning (`/api/v1/`, `/api/v2/`); deprecated versions return `Sunset` header
  - **Rate Limits by Tier:**
    - Free: 60 requests/minute, 10 renders/day, 5 concurrent renders
    - Pro ($49/mo): 300 requests/minute, 100 renders/day, 20 concurrent renders
    - Business ($199/mo): 1000 requests/minute, 500 renders/day, 50 concurrent renders
    - Enterprise: Custom limits
  - **Core Endpoints:**
    - `POST /api/v1/renders` - Create a render job
    - `GET /api/v1/renders/:id` - Get render status
    - `GET /api/v1/renders` - List render jobs (paginated, filterable)
    - `DELETE /api/v1/renders/:id` - Cancel a render job
    - `GET /api/v1/characters` - List saved characters
    - `GET /api/v1/templates` - Browse HTML templates
    - `POST /api/v1/tts` - Generate speech with alignment
    - `POST /api/v1/lip-sync` - Process phoneme-to-viseme
    - `POST /api/v1/translate` - Translate video content
    - `GET /api/v1/usage` - Usage statistics
    - `POST /api/v1/webhooks` - Register webhook endpoints
  - **Response Format:** JSON with consistent envelope: `{ data, meta: { requestId, timestamp }, pagination?: { page, perPage, total } }`
  - **Error Format:** `{ error: { code, message, details, requestId } }`
- **Output:** A developer portal with interactive docs, SDKs, usage analytics, and webhook management. Developers can build full integrations that create, monitor, and retrieve rendered videos programmatically.
- **Acceptance criteria:**
  - OpenAPI 3.0 specification is auto-generated from route definitions and served at /api/v1/openapi.json
  - Interactive documentation (Swagger UI or Redoc) is available at /api/v1/docs
  - SDKs for JavaScript (npm) and Python (pip) are published and maintained
  - OAuth 2.0 + PKCE flow works for client-side applications
  - Per-key rate limiting enforced with correct X-RateLimit-* headers on every response
  - Usage dashboard shows requests per endpoint, credits consumed, render times, error rates
  - Webhook management supports create/update/delete/test for multiple webhook endpoints per application
  - API versioning supports at least v1 with a documented deprecation policy
  - All endpoints return consistent JSON envelope with request IDs for debugging
  - 99.9% uptime SLA for Business and Enterprise tiers
- **Edge cases:**
  - SDK version mismatch with API version: SDK includes version negotiation; returns clear error if API version is sunset.
  - Developer accidentally exposes API key in client-side code: Key permissions can be scoped (render-only, read-only) to limit damage; key rotation available without downtime.
  - Burst traffic exceeds rate limit: Sliding window algorithm smooths bursts; 429 response includes `Retry-After` header with exact seconds.
  - Webhook endpoint returns non-2xx: Retry with exponential backoff (5 attempts over 24 hours), then disable webhook with notification email.
  - Large response payloads (listing 1000+ renders): Cursor-based pagination with 100-item default page size; total count returned in meta.
- **Dependencies:** Feature 27 (API for Automation) as the foundation, Supabase Auth, Express.js server, credit system, all orchestrator services.
- **Integration with ProAnimate:** Builds on the same Express.js server (server/index.ts) with a new `/api/v1/` route prefix. Shares the same Supabase database and auth system. Render jobs created via API appear in the user's Dashboard alongside GUI-created projects. Credit deduction flows through the same creditGate.ts. The developer portal is a separate React app (or Next.js) that reads from the same Supabase tables.
- **Use cases:**
  - A SaaS platform embeds ProAnimate video generation as a white-label feature in their product, using the OAuth flow for user authorization and the renders endpoint for generation
  - An automation agency builds custom n8n workflows that generate hundreds of personalized sales outreach videos daily using the Python SDK
  - A media company builds an internal tool that connects their CMS to ProAnimate's API, auto-generating video summaries of every published article
- **Why it matters:** Public APIs with proper documentation and SDKs are what separate tools from platforms. Creatomate's entire pricing model is API-tier-based ($41-249/mo). D-ID's API pricing starts at $5.90/mo and scales to enterprise. The developer ecosystem creates a moat: once developers build integrations, switching costs are enormous. A well-documented API also signals product maturity to enterprise buyers who require programmatic access.
- **Who has it:** Creatomate (gold standard documentation), D-ID (comprehensive API with 4 avatar generations), HeyGen (Streaming API + Video API), Submagic (REST API + Zapier), Moovly (Developer API), Synthesia (Enterprise API).
- **Gold standard:** Creatomate offers the gold standard for video generation APIs: clean REST design with a single render endpoint, Bearer token authentication, webhook callbacks, OpenAPI spec, client libraries for Node.js/Python/PHP/Ruby, a visual template editor that generates API-ready template IDs, and both template-based and freeform JSON rendering. Their documentation includes runnable code examples for every language and integration guides for Zapier, Make, and n8n. The webhook system supports multiple URLs per project with delivery logs and retry tracking.

---

### 42. Batch Generation from CSV/Spreadsheet
- **Category:** Automation & Developer Tools
- **What it is:** A UI-driven workflow for uploading a CSV or spreadsheet file and mass-generating unique videos by mapping spreadsheet columns to template variables (character names, dialogue text, colors, images, voice selections).
- **What it does:** Takes a template clip (either a saved project or orchestrator plan) and a CSV file where each row represents a unique video variant. Column headers map to template variables: dialogue text, character names, background colors, title text, CTA messages, voice IDs, music selections, and image URLs. The system validates the mapping, shows a preview of the first 3 rows, then batch-renders all rows as separate video files. Progress is tracked per-row, and completed videos can be bulk-downloaded as a ZIP or individually. This enables mass personalization (e.g., "Happy Birthday {name}!" with different names) and bulk content production (e.g., 50 product videos from a product catalog CSV).
- **User flow:**
  1. User creates a base clip using the editor or orchestrator that serves as the template.
  2. User goes to Dashboard > Batch Generate (or a new Batch tab in the left panel).
  3. User selects the base project/template.
  4. User uploads a CSV file (or pastes from Google Sheets, or connects a Google Sheets URL).
  5. The system parses the CSV, shows a preview table with the first 5 rows, and auto-detects column-to-variable mapping based on column header names.
  6. User reviews/adjusts the column-to-variable mapping with dropdown selectors (e.g., Column "product_name" maps to Template Variable "Title Text").
  7. User clicks "Preview" to see rendered thumbnails for 3 sample rows.
  8. User clicks "Generate All" which queues all rows as individual render jobs.
  9. A batch progress dashboard shows per-row status (queued/rendering/done/failed), overall progress bar, estimated time remaining, and total credit cost.
  10. On completion, user can download all videos as a ZIP, download individually, or export the CSV with an added "video_url" column.
- **Properties/Parameters:**
  - **Input formats:** CSV (.csv), TSV (.tsv), Excel (.xlsx), Google Sheets URL
  - **Maximum rows:** 500 per batch (Free), 2000 per batch (Pro), 10000 per batch (Business)
  - **Column mapping targets:**
    - `dialogue_text` / `script` - Main dialogue/narration text
    - `character_name` - Which saved character to use
    - `voice_id` - ElevenLabs voice ID
    - `title_text` - Title overlay text
    - `subtitle_text` - Subtitle overlay text
    - `cta_text` - Call-to-action text
    - `background_color` - Background hex color
    - `image_url` - Background or overlay image URL
    - `video_url` - Background video URL
    - `music_style` - Music mood keyword
    - `aspect_ratio` - Override aspect ratio per row
    - `duration` - Override duration per row
    - `template_config.*` - Dynamic keys mapping to HTML template CONFIG values
  - **Concurrency:** Up to 5 renders in parallel (configurable per plan)
  - **Output format:** MP4 or WebM per row
  - **Naming pattern:** `{template_name}_{row_number}_{column_value}.mp4` (customizable)
- **Output:** A set of rendered videos (one per CSV row), downloadable individually or as a ZIP archive. An augmented CSV with download URLs appended as a new column. A batch report showing render times, credit costs, and any failures.
- **Acceptance criteria:**
  - CSV upload parses correctly with UTF-8, UTF-16, and Excel encoding
  - Column auto-detection correctly maps common names (e.g., "name" to character_name, "text" to dialogue_text)
  - Preview renders 3 sample rows as thumbnail images within 15 seconds
  - Batch renders execute in parallel (up to concurrency limit) with per-row progress tracking
  - Failed rows can be retried individually without re-rendering successful rows
  - ZIP download includes all successful renders with consistent naming
  - Augmented CSV export includes video URLs for each row
  - Total credit cost is calculated and displayed before generation starts
  - Batch can be paused, resumed, and cancelled
- **Edge cases:**
  - CSV has empty cells: Use the template's default value for that variable; mark the row with a warning icon.
  - CSV has extra columns not mapped to any variable: Ignore silently but show in a "unmapped columns" section.
  - CSV has special characters in text fields (emojis, RTL text, newlines): Handle via proper CSV parsing with quoted field support.
  - A single row's render fails (e.g., invalid image URL): Mark that row as failed, continue processing remaining rows, offer retry button.
  - User uploads a 10,000-row CSV on the Free plan: Show clear error with upgrade prompt.
  - CSV has duplicate rows: Warn the user, offer to deduplicate before rendering.
  - Google Sheets URL requires authentication: Prompt user to make the sheet public or connect their Google account via OAuth.
- **Dependencies:** Feature 27 (API for Automation) for the render queue, orchestrator.ts for plan execution, videoExport.ts for rendering, project system for template management.
- **Integration with ProAnimate:** Extends the existing BatchCreatePanel.tsx with CSV import capabilities. Each row creates a render job that flows through the same orchestrator pipeline. The batch progress UI reuses the ExecutionPhase.tsx component from the orchestrator panel. Rendered videos are stored in Supabase Storage and linked to the user's project list. Credit deduction uses the existing withCreditGate() per-row. The batch job metadata is stored in a new `batch_jobs` Supabase table with a `batch_rows` child table.
- **Use cases:**
  - E-commerce brand uploads a product catalog CSV (name, description, price, image URL) and generates 200 product demo videos with the same branded template
  - Real estate agency uploads a listings CSV and generates personalized walkthrough videos for each property
  - EdTech company generates 150 lesson summary videos from a course outline spreadsheet, each with a different topic and AI-generated visuals
- **Why it matters:** Batch generation is the highest-volume use case for video APIs. Creatomate's entire "Spreadsheet to Video" feature is one of their primary selling points. This turns a single template into hundreds of unique videos, which is exactly what agencies, e-commerce brands, and content farms need. It also drives credit consumption proportional to batch size, creating predictable recurring revenue.
- **Who has it:** Creatomate (core feature with CSV upload + API), Synthesia (batch via API), Elai.io (batch document-to-video), Moovly (database-driven batch generation).
- **Gold standard:** Creatomate provides the gold standard for batch generation. Users upload a CSV file, preview videos before rendering, and export the spreadsheet with rendered content. The system supports importing CSV files or connecting directly to data sources, with a visual column-to-template mapping interface. Renders process in parallel, and completed videos appear in a grid with individual download links and a bulk export option. The same functionality is available via API for programmatic batch generation.

---

### 48. AI Video Translator
- **Category:** Automation & Developer Tools
- **What it is:** An AI-powered pipeline that translates an existing ProAnimate video's voice, captions, lip sync, and on-screen text into one or more target languages while preserving the original speaker's voice characteristics and timing.
- **What it does:** Takes a completed clip and a target language, then runs a multi-step translation pipeline: (1) extract the original script from stored dialogue data, (2) translate the script via Gemini with context-aware translation that preserves emotion cues, humor, and cultural references, (3) re-synthesize the voice in the target language using ElevenLabs multilingual voice cloning (preserving the original voice's tone and characteristics), (4) re-generate lip sync (viseme timeline) from the new phoneme alignment, (5) translate on-screen text overlays (titles, CTAs, captions), (6) adjust timing to accommodate language-specific speech patterns (e.g., German tends to be 20-30% longer than English), and (7) re-render the video. The result is a natural-sounding localized version that looks like it was originally produced in the target language.
- **User flow:**
  1. User opens a completed clip in the editor or selects it from the Dashboard.
  2. User clicks "Translate" button in the top menu bar or export panel.
  3. A translation dialog shows the source language (auto-detected from dialogue) and a target language selector with 50+ languages organized by region.
  4. User selects one or more target languages and configures options: preserve original voice (clone) vs. select new voice, translate on-screen text (yes/no), adjust timing for speech length differences (yes/no), subtitle style for translated captions.
  5. User clicks "Translate" and sees a step-by-step progress indicator: Script Translation > Voice Synthesis > Lip Sync > Text Translation > Timing Adjustment > Render.
  6. On completion, the translated clip appears as a new project variant linked to the original, viewable side-by-side or independently.
  7. User can edit the translated script, adjust timing, or re-generate voice before final export.
- **Properties/Parameters:**
  - `sourceLanguage` (string, auto-detected or manual): ISO 639-1 code (e.g., "en", "es", "ja")
  - `targetLanguages` (string[], required): One or more target language codes
  - `voiceMode` (enum: "clone" | "match" | "select", default: "clone"):
    - "clone" - Use ElevenLabs voice cloning to preserve original voice in target language
    - "match" - Auto-select the closest matching voice from the ElevenLabs library
    - "select" - Let the user pick a specific voice per language
  - `translateText` (boolean, default: true): Whether to translate on-screen text overlays
  - `translateCaptions` (boolean, default: true): Whether to re-generate captions in target language
  - `adjustTiming` (boolean, default: true): Whether to stretch/compress clip to fit translated speech
  - `maxDurationChange` (number, 0-50, default: 25): Maximum percentage the clip duration can change
  - `preserveEmotionCues` (boolean, default: true): Whether to maintain [emotion] cues in translated script
  - `culturalAdaptation` (enum: "literal" | "localized" | "creative", default: "localized"): How much cultural adaptation to apply
  - `outputFormat` (enum: "mp4" | "webm", default: "mp4")
- **Output:** One or more translated video clips, each saved as a new project variant linked to the original. Each includes: translated dialogue with voice cloning, re-synchronized lip animation (viseme timeline), translated text overlays and captions, adjusted timing. A translation report shows per-language details: script changes, duration delta, voice similarity score, and credit cost.
- **Acceptance criteria:**
  - Supports at least 50 languages including all major world languages (English, Spanish, Mandarin, Hindi, Arabic, French, German, Japanese, Korean, Portuguese, Russian, Italian, Turkish, etc.)
  - Voice cloning preserves at least 80% voice similarity as measured by speaker verification scores
  - Lip sync re-generates correctly for the target language's phoneme set
  - Translated text overlays maintain the same visual styling (font, size, color, animation) as originals
  - Timing adjustment stretches or compresses within the configured maximum without breaking animation synchronization
  - Multi-language batch translation (5+ languages at once) processes in parallel
  - Translated clips are linked to the original project for easy management
  - Emotion cues ([happy], [sad], etc.) are preserved in translated scripts and applied to voice synthesis
  - RTL languages (Arabic, Hebrew) correctly flip text overlay alignment
- **Edge cases:**
  - Target language speech is 40% longer than source (e.g., English to German): If exceeds maxDurationChange, show a warning and offer options: allow longer duration, increase speech rate, or shorten the translated script.
  - Voice cloning produces poor results for a specific language: Fall back to "match" mode with a notification; offer manual voice selection.
  - On-screen text contains untranslatable elements (brand names, URLs): Detect and preserve these automatically using named entity recognition.
  - Source clip has multiple characters/voices: Clone each voice separately and assign to the correct character in the translated version.
  - Source language detection is ambiguous (e.g., code-switching): Let user confirm or override the detected source language.
  - Target language uses a different script (Latin to CJK): Adjust caption font automatically to one that supports the target script.
- **Dependencies:** ElevenLabs TTS with multilingual voice cloning (elevenlabs.ts), Gemini for translation (gemini.ts), LipSyncProcessor (lipSync.ts) for re-generating viseme timelines, CaptionProcessor (captions.ts) for re-generating captions, useTextOverlayStore.ts for translating on-screen text, videoExport.ts for re-rendering.
- **Integration with ProAnimate:** The translation pipeline reads from the existing useVoiceStore (dialogue text and alignment), useTextOverlayStore (on-screen text), useCameraStore (camera timing), and useTimelineStore (clip structure). Translated voice audio is generated through the same ElevenLabs service (elevenlabs.ts) with the multilingual model. Lip sync re-generation reuses LipSyncProcessor with the new alignment data. The result is saved as a new project via projectService.ts with a `parentProjectId` field linking it to the original. The orchestrator can optionally include a `targetLanguages` field in OrchestratorSettings to auto-translate during generation.
- **Use cases:**
  - A creator makes a viral TikTok in English, then one-click translates it into Spanish, Portuguese, French, and Hindi to reach global audiences
  - An EdTech company translates their 200 tutorial videos from English into 10 languages for international markets
  - A brand creates a product launch video and simultaneously localizes it for 15 regional markets, each with culturally adapted messaging
- **Why it matters:** Video translation is the fastest-growing segment in AI video. HeyGen's translator supports 175+ languages and is a major driver of their growth. Submagic's translator covers 100+ languages. The addressable market is massive: every video creator who wants international reach needs localization, and traditional dubbing costs $1000+ per minute. AI translation at $0.50-5.00 per video represents 100-1000x cost reduction. This is also a strong upsell feature: translation credits can be priced per-language, per-minute.
- **Who has it:** HeyGen (175+ languages with voice cloning + lip sync, gold standard), Submagic (100+ languages, caption-focused), Synthesia (160+ languages), Hedra AI (140+ languages), Dreamina/Seedance (8+ languages with emotional lip sync), Elai.io (75+ languages).
- **Gold standard:** HeyGen sets the gold standard for AI video translation. Their system handles the full pipeline: upload any video, auto-detect the source language, select target languages, and receive a translated version with cloned voice, synchronized lip movements, and auto-generated subtitles. The advanced speaker verification system distinguishes between multiple speakers and matches each with an appropriate AI voice. The lip sync technology ensures facial movements match the new language naturally, and the system handles 175+ languages and dialects.

---

### 51. Screenshot-to-Video
- **Category:** Automation & Developer Tools
- **What it is:** A conversion pipeline that transforms a sequence of screenshots or a screen recording into a polished product demo video with AI-generated narration, zoom effects, click annotations, transitions, and branded overlays.
- **What it does:** Accepts one or more screenshots (PNG/JPG) or a raw screen recording (MP4/WebM), uses Gemini vision to analyze the content and generate a narration script describing what is being shown, adds Ken Burns zoom effects to focus on key UI elements, inserts click/hover cursor animations, applies smooth transitions between screenshots, overlays branded elements (logo, colors, CTA), synthesizes a voiceover via ElevenLabs, and renders a professional demo video. For screen recordings, it also detects scene changes, removes dead time (mouse wandering, loading screens), and adds chapter markers. This turns raw product screenshots into publish-ready demo content without video editing skills.
- **User flow:**
  1. User opens the "Screenshot to Video" panel from the left sidebar (or Dashboard quick-action).
  2. User drags and drops screenshots in order, or uploads a screen recording.
  3. Gemini vision analyzes each screenshot: identifies UI elements, text content, and the likely user action being demonstrated.
  4. System generates a draft script narrating the demo flow ("First, click the Create button in the top right...").
  5. User reviews and edits the script in a side panel (each screenshot/scene paired with its narration text).
  6. User selects voice, brand colors, logo placement, and transition style.
  7. User clicks "Generate" and the system renders: zoom effects on key UI areas, cursor animations, narration voiceover, transitions, branded intro/outro.
  8. User previews the result in the Remotion player and makes adjustments (reorder slides, adjust zoom targets, edit narration).
  9. User exports the final video.
- **Properties/Parameters:**
  - **Input formats:** PNG, JPG, GIF (screenshots); MP4, WebM (screen recordings)
  - **Max screenshots:** 50 per demo
  - **Max recording length:** 10 minutes
  - `narrationStyle` (enum: "professional" | "casual" | "tutorial" | "none", default: "professional")
  - `voiceId` (string, optional): ElevenLabs voice ID for narration
  - `zoomBehavior` (enum: "auto" | "manual" | "none", default: "auto"): How zoom effects are applied
  - `zoomIntensity` (number, 1.0-3.0, default: 1.5): Maximum zoom level
  - `cursorStyle` (enum: "default" | "hand" | "circle-highlight" | "none", default: "circle-highlight")
  - `transitionStyle` (enum: "fade" | "slide" | "zoom" | "cut", default: "fade")
  - `transitionDuration` (number, 0.2-2.0 seconds, default: 0.5)
  - `brandColors` (object): `{ primary, secondary, accent }` hex colors
  - `logoUrl` (string, optional): Brand logo to overlay
  - `logoPosition` (enum: "top-left" | "top-right" | "bottom-left" | "bottom-right", default: "bottom-right")
  - `includeIntro` (boolean, default: true): Auto-generate a title card intro
  - `includeCTA` (boolean, default: true): Auto-generate a call-to-action outro
  - `aspectRatio` (enum: "16:9" | "9:16" | "1:1", default: "16:9")
  - `secondsPerScreenshot` (number, 3-15, default: 5): Base duration per screenshot
- **Output:** A polished product demo video with: AI narration synced to each screenshot/scene, zoom effects highlighting key UI elements, animated cursor movements, smooth transitions between scenes, branded intro/outro, and captions. The output is a standard ProAnimate project that can be further edited in the full editor.
- **Acceptance criteria:**
  - Accepts PNG, JPG, GIF uploads and MP4/WebM screen recordings
  - Gemini vision correctly identifies key UI elements (buttons, forms, menus, text fields) in 80%+ of screenshots
  - Auto-generated narration script is coherent and contextually relevant to the UI content shown
  - Zoom effects animate smoothly to identified key areas (no jarring jumps)
  - Cursor animations follow logical paths between interactive elements
  - Transitions between screenshots are smooth and consistent
  - Full video renders in under 3 minutes for a 10-screenshot demo
  - Output is a standard ProAnimate project editable in the main editor
  - Screen recording input correctly detects scene changes and removes dead time (>3 seconds of no mouse/keyboard activity)
- **Edge cases:**
  - Screenshot contains no identifiable UI (e.g., a blank page or an abstract image): Generate generic narration ("Here we see the next screen...") and skip zoom effects.
  - Screen recording has very rapid mouse movements: Smooth the cursor path and slow down the playback speed for clarity.
  - Screenshots are different resolutions: Normalize all to the output aspect ratio, center-cropping or letterboxing as needed.
  - Screenshot text is in a non-Latin script: Use OCR with multilingual support; generate narration in the detected language.
  - Very similar consecutive screenshots (minor change): Detect the diff area and zoom into the change while narrating what changed.
  - User uploads 50 screenshots: Estimate total duration and warn if video will exceed 5 minutes; suggest grouping into chapters.
- **Dependencies:** Gemini vision API for screenshot analysis (via server proxy), ElevenLabs for narration (elevenlabs.ts), useCameraStore.ts for zoom keyframes, useMediaStore.ts for screenshot assets, useTextOverlayStore.ts for titles and captions, videoExport.ts for final render.
- **Integration with ProAnimate:** Screenshots are imported as MediaAssets into useMediaStore. The AI analysis creates a ClipPlan-like structure with media items positioned on the timeline, camera keyframes for zoom effects, text overlays for narration captions, and voice entries for TTS. This flows into the standard Remotion composition (VideoComposition.tsx) using existing RemotionMediaLayer for screenshots, CameraTransformWrapper for zooms, and RemotionTextOverlay for captions. The final project is saved via useProjectStore and can be edited with the full editor toolset.
- **Use cases:**
  - A SaaS startup captures 10 screenshots of their onboarding flow and generates a 60-second product demo video for their landing page
  - A developer records a screen walkthrough of their API and converts it into a polished tutorial with narration and zoom highlights
  - A customer success team creates personalized setup guides by screenshotting each customer's configured dashboard
- **Why it matters:** Product demos are the highest-converting video content for SaaS companies, but most teams lack the skills to create polished ones. Tools like Supademo, Puppydog, and Trupeer have raised significant funding specifically for screenshot-to-demo conversion. This feature positions ProAnimate as the go-to tool for developer marketing and SaaS teams, a segment with high willingness to pay and strong retention. It also serves as an entry point that converts technical users into full ProAnimate users.
- **Who has it:** Supademo (interactive screenshot demos), Puppydog.io (screenshot to demo video with AI avatars), Trupeer (screen recording to polished demo), Synthesia (AI Screen Recorder to avatar video), Pictory (screen capture to edited video).
- **Gold standard:** Puppydog.io represents the emerging gold standard, offering a complete pipeline from screen capture to finished demo video with AI avatars, auto-generated scripts, zoom effects, and branded storyboards. Their system automatically identifies key UI elements, generates contextual narration, and produces a polished video with presenter overlay. Trupeer takes a similar approach, adding automatic zooms, captions, and annotations. The key differentiator is the AI's ability to understand the context of what is being demonstrated and narrate it coherently.

---

### 52. CLI Tool
- **Category:** Automation & Developer Tools
- **What it is:** A command-line interface (`proanimate` or `pa`) that enables headless video generation, project management, and batch operations from the terminal without opening a browser.
- **What it does:** Provides a Node.js CLI binary that wraps the public REST API (Feature 41) and adds local development conveniences. Users can generate videos from prompts, apply templates, batch-render from CSV files, manage characters and projects, and monitor render status -- all from the terminal. The CLI supports JSON and YAML input files for complex configurations, outputs structured JSON for piping into other tools, and integrates with CI/CD pipelines for automated content generation. It also supports a local rendering mode that uses the Remotion CLI (`npx remotion render`) for users who want to render on their own hardware without using cloud credits.
- **User flow:**
  1. Developer installs the CLI: `npm install -g @proanimate/cli`
  2. Developer authenticates: `pa auth login` (opens browser for OAuth, stores token in `~/.proanimate/config.json`)
  3. Developer generates a video from a prompt: `pa render --prompt "Explain quantum computing in 30 seconds" --aspect 9:16 --format mp4 --output ./output.mp4`
  4. The CLI submits the render job to the API, displays a progress bar, and downloads the result on completion.
  5. For batch operations: `pa batch render --template project-abc123 --csv products.csv --output ./videos/ --concurrency 5`
  6. For local rendering: `pa render --local --prompt "Hello world" --output ./local.mp4` (uses local Remotion render without cloud API)
  7. Developer monitors active jobs: `pa jobs list --status rendering`
  8. Developer integrates into CI/CD: `pa render --config render.yaml --json` (outputs structured JSON for pipeline parsing)
- **Properties/Parameters:**
  - **Commands:**
    - `pa auth login` / `pa auth logout` / `pa auth status` - Authentication management
    - `pa render --prompt <text> [options]` - Generate a single video
    - `pa render --config <file.yaml>` - Generate from a config file
    - `pa render --local [options]` - Render locally using Remotion CLI
    - `pa batch render --csv <file> --template <id> [options]` - Batch generation
    - `pa projects list` / `pa projects get <id>` / `pa projects delete <id>` - Project management
    - `pa characters list` / `pa characters get <id>` - Character library
    - `pa templates list` / `pa templates search <query>` - Template browsing
    - `pa jobs list` / `pa jobs get <id>` / `pa jobs cancel <id>` - Render job management
    - `pa translate --project <id> --lang <code> [options]` - Translate a project
    - `pa usage` - Credit usage summary
  - **Global flags:**
    - `--json` - Output structured JSON (for piping)
    - `--quiet` - Suppress progress output
    - `--verbose` - Detailed logging
    - `--api-key <key>` - Override stored API key
    - `--api-url <url>` - Override API endpoint (for self-hosted)
  - **Render options:**
    - `--aspect <ratio>` (default: "9:16")
    - `--duration <seconds>` (default: 30)
    - `--fps <number>` (default: 30)
    - `--format <mp4|webm>` (default: "mp4")
    - `--quality <0.1-1.0>` (default: 0.8)
    - `--output <path>` (default: "./output.mp4")
    - `--character <name|id>` (repeatable)
    - `--voice <id>` (optional)
    - `--template <id>` (optional)
    - `--webhook <url>` (optional)
    - `--wait` / `--no-wait` (default: --wait; whether to wait for completion)
- **Output:** Rendered video files downloaded to the specified output path. When `--json` flag is used, outputs structured JSON with job metadata, download URLs, credit costs, and render statistics. For batch operations, outputs a summary table with per-row status and file paths.
- **Acceptance criteria:**
  - Installs globally via npm with zero configuration required
  - `pa auth login` opens the default browser, completes OAuth, stores token securely
  - `pa render --prompt "..."` submits a job, shows a progress bar, downloads the result
  - `pa batch render --csv file.csv --template id` processes all rows with parallel rendering
  - `pa render --local` renders using Remotion CLI without API calls (requires local Node.js + Chrome)
  - All commands support `--json` output for scripting and CI/CD integration
  - Config file support (YAML/JSON) for repeatable render configurations
  - Exit codes follow conventions: 0 (success), 1 (error), 2 (usage error)
  - Shell completion available for bash, zsh, and fish
  - `--help` on every command shows usage, options, and examples
- **Edge cases:**
  - Network disconnection during render wait: Reconnect and resume polling; print job ID for manual retrieval later.
  - Local render mode fails due to missing Chrome: Show clear error message with installation instructions.
  - API key expired during batch operation: Prompt for re-authentication without losing batch progress.
  - Output path is read-only: Detect before rendering and fail fast with a clear error.
  - CSV file has Windows line endings (CRLF): Handle transparently with universal line ending parsing.
  - Very long prompt exceeds terminal line length: Accept from stdin via pipe: `cat prompt.txt | pa render --prompt -`
- **Dependencies:** Feature 41 (Public REST API) for all cloud operations, Remotion CLI for local rendering, Node.js 18+ runtime.
- **Integration with ProAnimate:** The CLI is a thin wrapper around the public REST API (Feature 41), so all operations mirror the API's capabilities. Local rendering mode uses the existing Remotion composition (VideoComposition.tsx) and videoExport.ts via the Remotion CLI (`npx remotion render`). The CLI reads project IDs from the same Supabase database as the web app. Authentication shares the same Supabase Auth tokens. Config files (YAML) map directly to the API's JSON request format.
- **Use cases:**
  - A DevOps team adds `pa render --config weekly-report.yaml` to their CI/CD pipeline to auto-generate a weekly metrics video from database data
  - A content creator writes a bash script that generates 20 videos overnight: `for topic in topics.txt; do pa render --prompt "$topic" --output "./videos/$topic.mp4"; done`
  - A game studio uses local rendering mode to generate 100+ animated character reveal videos during their build pipeline without incurring cloud costs
- **Why it matters:** CLI tools serve the developer segment that is most likely to become power users and evangelists. Remotion itself is CLI-first, and ProAnimate already uses Remotion under the hood. A CLI also enables CI/CD integration, which is critical for enterprise customers who need automated content pipelines. While the market for CLI video tools is small, it is extremely high-value: developers who integrate CLIs into automated workflows generate 10-100x more renders than GUI users.
- **Who has it:** Remotion (built-in CLI: `npx remotion render`), Bazaar (Remotion-based CLI tool), Creatomate (API that works well with cURL/scripting), FFmpeg (the original CLI video tool).
- **Gold standard:** Remotion's CLI (`npx remotion render`) is the gold standard for programmatic video rendering from the command line. It supports specifying compositions, output formats, codecs, frame ranges, and props via command-line arguments. Combined with `npx remotion lambda render` for serverless cloud rendering, it provides both local and cloud rendering from the same interface. The key lesson is that the CLI should be a thin, well-documented wrapper around a rendering engine that can operate headlessly, with structured JSON output for integration with other tools.

---

### 53. Document/PDF-to-Video
- **Category:** Automation & Developer Tools
- **What it is:** An AI-powered conversion pipeline that transforms documents (PDF, DOCX, PPTX, plain text, Markdown, HTML) into narrated animated video presentations with automatic scene detection, visual extraction, and motion graphics.
- **What it does:** Accepts a document upload, uses Gemini to analyze the document structure (headings, paragraphs, bullet points, images, charts, tables, equations), extracts key content and organizes it into scenes, generates a narration script for each scene, selects appropriate visual treatments (text overlays for key points, motion graphics templates for data, stock media for concepts, character narration for explanations), synthesizes voice narration, and renders a complete video. The system handles different document types intelligently: PDFs with charts become data visualization scenes, PowerPoint slides map directly to video scenes, text documents are segmented by topic, and technical documents with equations get whiteboard-style treatment.
- **User flow:**
  1. User clicks "Document to Video" from the Dashboard or left panel.
  2. User uploads a document (drag-and-drop or file picker) or pastes a URL (blog post, article).
  3. System analyzes the document and shows a structural breakdown: detected sections, images, charts, key points, estimated video duration.
  4. User reviews the auto-generated script (one text block per scene) and adjusts: edit text, reorder scenes, merge/split scenes, remove sections.
  5. User configures video options: style (professional/casual/educational/whiteboard), voice, character (optional presenter), aspect ratio, target duration.
  6. User clicks "Generate" and the orchestrator creates the full video: scene-by-scene with appropriate visuals, narration, transitions, and music.
  7. Result opens in the full editor for fine-tuning.
- **Properties/Parameters:**
  - **Input formats:** PDF, DOCX, PPTX, TXT, MD, HTML, URL (blog/article)
  - **Max document size:** 50 MB
  - **Max pages:** 100 (PDF), 150 slides (PPTX)
  - `videoStyle` (enum: "professional" | "casual" | "educational" | "whiteboard" | "corporate" | "social", default: "professional")
  - `targetDuration` (enum: "auto" | "30s" | "60s" | "90s" | "120s" | "180s" | "300s", default: "auto")
  - `scenesPerPage` (number, 1-3, default: "auto"): How many video scenes per document page
  - `voiceId` (string, optional): ElevenLabs voice for narration
  - `characterId` (string, optional): Saved character as presenter
  - `characterRole` (enum: "presenter" | "explainer" | "none", default: "none")
  - `visualMode` (enum: "text-focused" | "media-rich" | "mixed", default: "mixed"):
    - "text-focused" - Key points as text overlays with minimal graphics
    - "media-rich" - Stock media, templates, and SVG visuals for every scene
    - "mixed" - Blend of text and media based on content type
  - `extractImages` (boolean, default: true): Extract and use embedded document images
  - `extractCharts` (boolean, default: true): Detect charts and convert to animated data visualizations
  - `aspectRatio` (enum: "16:9" | "9:16" | "1:1", default: "16:9")
  - `captionStyle` (enum: "word-by-word" | "sentence" | "karaoke" | "none", default: "sentence")
  - `brandKit` (object, optional): `{ colors, fonts, logo }` for branded output
- **Output:** A complete ProAnimate project with scenes derived from the document, narration voiceover, appropriate visuals (text overlays, stock media, motion graphics, extracted images), transitions, music, and captions. The project is fully editable in the main editor.
- **Acceptance criteria:**
  - Accepts PDF, DOCX, PPTX, TXT, MD, HTML, and URL inputs
  - Document structure correctly detected: headings become scene titles, bullet points become key point overlays, images are extracted and placed
  - Charts and tables are detected and converted to animated motion graphics templates (using the existing 100+ HTML template library)
  - Generated narration script is coherent, concise, and accurately represents the document content
  - PPTX slides map 1:1 to video scenes with slide content extracted (text, images, shapes)
  - Blog/article URLs are fetched, cleaned of navigation/ads, and converted like text documents
  - Target duration is respected within 10% tolerance
  - Processing time under 5 minutes for a 20-page PDF
  - Result is a standard ProAnimate project editable in the full editor
  - Math equations are detected and rendered with whiteboard-style animation
- **Edge cases:**
  - PDF is image-only (scanned document): Run OCR (via Gemini vision) before text extraction; warn user about potential accuracy issues.
  - Document has no clear structure (stream of consciousness text): Use Gemini to impose a logical structure; show the proposed breakdown for user approval.
  - PPTX has complex animations and builds: Ignore PowerPoint animations; extract static content from each slide.
  - Document is in a non-English language: Detect language, generate narration in that language, use matching voice.
  - Document contains sensitive/confidential content: Process on-device where possible; show a privacy notice about cloud processing for AI analysis.
  - Very long document (100+ pages): Show a warning about video length; suggest selecting key sections rather than converting everything.
  - Document has primarily tabular data (spreadsheets): Convert to data visualization scenes using infographic templates.
- **Dependencies:** Gemini for document analysis and script generation (via server proxy), ElevenLabs for narration (elevenlabs.ts), orchestrator.ts for assembling the video, BUILTIN_TEMPLATES for data visualization scenes, useMediaStore.ts for extracted images, pixabay.ts for supplementary stock media.
- **Integration with ProAnimate:** The conversion pipeline generates a ClipPlan (the same format used by orchestrator.ts) from the document content, then feeds it through the standard orchestrator execution pipeline. Extracted images are stored as MediaAssets in useMediaStore. Charts map to HTML template instances (using builtinTemplates.ts infographic templates like tpl-infographic-bar, tpl-infographic-donut). PPTX slides become media layers with text overlays. The resulting project uses all standard ProAnimate layers (RemotionMediaLayer, RemotionTextOverlay, RemotionHTMLTemplateLayer) and is fully editable.
- **Use cases:**
  - An educator converts a 30-page PDF course chapter into a 5-minute animated explainer video for students
  - A marketing team converts their quarterly report PDF into a 90-second highlight video for the all-hands meeting
  - A blogger pastes their article URL and generates a TikTok summary video to drive traffic to the full post
- **Why it matters:** Document-to-video conversion is one of the most-requested features in the video creation market. Golpo (YC-backed) raised funding specifically for PDF-to-whiteboard-video. Synthesia's PowerPoint-to-video is one of their most popular enterprise features. Powtoon's doc-to-video AI converts "boring docs into engaging videos." Pictory built their product around blog-to-video conversion. This feature serves the enormous market of people who have content in document form (every business, school, and organization) and need it in video form. The TAM includes every PowerPoint presentation ever created.
- **Who has it:** Golpo (PDF/doc-to-whiteboard-video, gold standard for educational content), Synthesia (PPTX-to-video with avatars), Powtoon (doc-to-video AI), Pictory (blog URL-to-video), Elai.io (article/slide/document-to-video), Elai.io (PDF-to-video).
- **Gold standard:** Golpo (YC-backed, founded by Stanford CS students) represents the gold standard for document-to-video conversion, specifically for educational and technical content. Their system scans a PDF or PowerPoint, detects images, bullet points, charts, and tables, and automatically transforms them into whiteboard animation scenes with synchronized voice narration, transitions, and captions. The result is a Khan Academy-style explainer video produced in minutes. For general-purpose document-to-video, Synthesia's PowerPoint converter is the enterprise gold standard: import PPTX, convert text boxes and shapes into editable assets, convert speaker notes into the narration script, choose an AI avatar and language, and generate.

---

## Category 10: Specialized Modes

### 34. Live Avatar Streaming
- **Category:** Specialized Modes
- **What it is:** A real-time avatar streaming system that drives a 2D or 3D ProAnimate character with the user's webcam and microphone input, producing a live video stream of the animated character speaking and emoting with sub-100ms latency.
- **What it does:** Captures the user's webcam feed and audio input in real-time, extracts facial landmarks (mouth shape, eye gaze, eyebrow position, head rotation) and speech audio, maps these to ProAnimate's character system (viseme lip sync, emotion heads, body transforms), renders the animated character at 30 fps, and outputs the result as a virtual camera feed (via virtual webcam driver) or WebRTC stream. The character mirrors the user's mouth movements through real-time phoneme-to-viseme mapping, tracks head rotation for natural animation, detects emotions from facial expressions to switch emotion heads, and can optionally apply voice transformation. This enables use cases like VTubing, live meetings with animated avatars, interactive customer service agents, and real-time educational presentations.
- **User flow:**
  1. User clicks "Go Live" from the Dashboard or top menu bar.
  2. A dedicated live mode UI opens showing: webcam preview, character preview, audio input meter, and streaming controls.
  3. User selects a character from their saved library (2D sprite, 2D rigged, or 3D rigged).
  4. User grants webcam and microphone permissions.
  5. System initializes face tracking (MediaPipe Face Mesh or similar) and audio processing.
  6. Character immediately mirrors the user's facial movements in the preview: mouth shapes follow speech, eyes track gaze direction, eyebrows reflect expressions, head tilts match user's head rotation.
  7. User selects output mode: Virtual Camera (for Zoom/Google Meet/OBS), WebRTC Stream (for web embedding), or Record (save to file).
  8. User clicks "Start" and the character stream goes live.
  9. Optional overlays: background scene, name lower third, branding, chat bubble for incoming messages.
  10. User clicks "Stop" to end the stream; recorded sessions are saved as standard ProAnimate projects.
- **Properties/Parameters:**
  - `characterId` (string, required): Which saved character to animate
  - `characterType` (enum: "2d-sprite" | "2d-rigged" | "3d-rigged"): Determined by the selected character
  - `trackingMode` (enum: "face-only" | "face-and-body" | "full-body", default: "face-only")
  - `outputMode` (enum: "virtual-camera" | "webrtc" | "record", default: "virtual-camera")
  - `resolution` (enum: "720p" | "1080p" | "480p", default: "720p")
  - `fps` (number, 24 | 30 | 60, default: 30)
  - `backgroundType` (enum: "transparent" | "scene" | "color" | "image", default: "color")
  - `backgroundColor` (string, hex, default: "#00FF00" for green screen)
  - `lipSyncSensitivity` (number, 0.1-1.0, default: 0.7): How responsive mouth movements are
  - `emotionDetection` (boolean, default: true): Whether to auto-detect emotions from facial expressions
  - `emotionSensitivity` (number, 0.1-1.0, default: 0.5): Threshold for emotion switching
  - `headTrackingIntensity` (number, 0.1-2.0, default: 1.0): How much head rotation is amplified
  - `smoothing` (number, 0.0-1.0, default: 0.3): Temporal smoothing to reduce jitter
  - `voiceEffect` (enum: "none" | "pitch-up" | "pitch-down" | "robotic" | "custom", default: "none")
  - `latencyMode` (enum: "low" | "balanced" | "quality", default: "balanced"):
    - "low" - Sub-50ms, minimal processing, some visual artifacts
    - "balanced" - Sub-100ms, good quality
    - "quality" - Sub-200ms, best visual quality
  - `overlays` (object): `{ lowerThird, brandLogo, chatBubble }` configuration
- **Output:** A real-time animated character video stream available as: (1) a virtual camera device selectable in any video conferencing app, (2) a WebRTC stream embeddable in web pages, or (3) a recorded video file. The character mirrors the user's speech and expressions with the configured latency.
- **Acceptance criteria:**
  - Face tracking initializes within 2 seconds of webcam activation
  - End-to-end latency (webcam input to character output) is under 100ms in "balanced" mode
  - Lip sync accurately maps to 8 viseme positions in real-time using audio analysis
  - Emotion detection correctly identifies and transitions between at least 4 emotions (happy, sad, angry, surprised)
  - Head rotation tracking is smooth with no visible jitter at default smoothing
  - Virtual camera output is recognized by Zoom, Google Meet, Microsoft Teams, and OBS
  - WebRTC stream connects with under 500ms setup time
  - System maintains 30fps rendering on mid-range hardware (Intel i5 / Apple M1 equivalent)
  - Audio passthrough has no perceptible delay or artifacts
  - Recording mode produces a standard ProAnimate project file
- **Edge cases:**
  - User's face leaves the webcam frame: Character freezes in last known pose, returns to neutral after 3 seconds, resumes tracking when face reappears.
  - Poor lighting causes tracking inaccuracy: Show a "Lighting Warning" indicator; increase smoothing automatically.
  - Multiple faces in webcam: Track the largest/closest face; ignore others.
  - User wears glasses that cause eye tracking issues: Offer "glasses mode" that disables eye tracking and uses default eye positions.
  - Audio feedback loop (speaker output picked up by mic): Detect and warn; recommend headphones.
  - System cannot maintain 30fps: Automatically reduce resolution or tracking frequency; show a performance warning.
  - Browser does not support virtual camera API: Fall back to WebRTC stream with instructions for OBS virtual camera.
- **Dependencies:** MediaPipe Face Mesh (or TensorFlow.js face-landmarks-detection) for face tracking, Web Audio API for real-time audio analysis, LipSyncProcessor (lipSync.ts) for phoneme mapping, CharacterComposite.tsx / RiggedCharacterRenderer.tsx / Character3DRenderer.tsx for rendering, WebRTC for streaming, virtual camera API (Chrome Extension or native driver).
- **Integration with ProAnimate:** Real-time lip sync reuses the existing LipSyncProcessor (lipSync.ts) but operates on live audio chunks instead of pre-processed alignment data. The character rendering pipeline uses the same CharacterComposite.tsx (for 2D sprites with 24-viseme system), RiggedCharacterRenderer.tsx (for 2D rigged), or Character3DRenderer.tsx (for 3D models). Emotion detection maps to the existing 24 emotion head variants (6 categories x 4 intensities) in useCharacterConfigStore.ts. Background scenes use the same canvas layers (LottieLayer, MediaLayer). Recorded sessions are saved as standard projects via useProjectStore.
- **Use cases:**
  - A content creator uses their custom anime character as a VTuber avatar on Twitch, streaming via OBS with the virtual camera output
  - A teacher presents lessons using an animated character that mirrors their expressions, making online classes more engaging for young students
  - A company deploys an AI customer service agent (connected to an LLM) that speaks through a branded animated avatar on their website via WebRTC
- **Why it matters:** Live avatars represent the next frontier of video AI, with three major players investing heavily: HeyGen (LiveAvatar platform at liveavatar.com with sub-100ms latency), Hedra ($10M ARR, launched Live Avatars in July 2025 at $0.05/minute), and D-ID (sub-200ms latency, 100fps rendering, Agents 2.0). Viggle AI's webcam puppeteering has attracted 2.3M+ users. The market spans VTubing (multi-billion dollar market in Asia), enterprise video conferencing, customer service automation, and interactive education. ProAnimate's unique advantage is its existing character library with 24-viseme lip sync and 24 emotion heads, which are already designed for expressive real-time animation.
- **Who has it:** HeyGen (LiveAvatar, gold standard, sub-100ms), Hedra AI (Live Avatars, sub-100ms, $0.05/min), D-ID (Agents 2.0, sub-200ms, 100fps), Viggle AI (webcam puppeteering, 1-2s delay).
- **Gold standard:** HeyGen's LiveAvatar sets the gold standard for live avatar streaming. Built on WebRTC infrastructure, it delivers sub-100ms response times with natural lip sync, expressions, and gestures. It supports real-time two-way interaction (voice, video, and text input), integrates with LLMs (OpenAI, Anthropic) and TTS systems (Google, ElevenLabs), and offers full SDK and API support for embedding in applications. The system handles multi-lingual real-time conversations, sentiment-aligned responses, and enterprise-grade scalability. The separate liveavatar.com platform offers higher performance than their previous Interactive Avatar product.

---

### 55. Persistent Character Identity Across Scenes
- **Category:** Specialized Modes
- **What it is:** A character identity management system that ensures a character's visual appearance (face, body, clothing, proportions, art style) remains perfectly consistent across all scenes, shots, and projects, even when generated by AI in different contexts.
- **What it does:** Creates a "Character Identity Profile" that captures the essential visual DNA of a character: facial features, body proportions, color palette, clothing details, art style parameters, and distinguishing features. When the orchestrator or user creates new scenes, the identity profile is injected into every AI generation prompt and visual placement decision, ensuring the character looks identical whether they appear in a close-up, wide shot, different background, or even different project. The system supports variant management (same character in different outfits, expressions, or poses) while maintaining facial and body consistency. For sprite-based characters, this means the saved character's exact sprites are reused. For AI-generated characters, this means the reference image and style parameters are consistently applied. For 3D characters, the GLB model ensures inherent consistency.
- **User flow:**
  1. User creates a new character (via CharacterGeneratorPanel, manual upload, or 3D import).
  2. System automatically creates a Character Identity Profile containing: reference image(s), style descriptor (art style, color palette, line weight), distinguishing features (extracted by Gemini vision), body proportions, and outfit description.
  3. User saves the character to their library (useSavedCharactersStore).
  4. When creating a new scene/project, user adds the character by typing "@CharacterName" in the orchestrator prompt or selecting from the character picker.
  5. The orchestrator includes the identity profile in all AI generation prompts that involve this character.
  6. If new sprites or poses need to be generated, the system uses the reference images and style descriptors to ensure visual consistency.
  7. User can create character variants ("@Alex_casual", "@Alex_formal") that share facial identity but have different outfits.
  8. Across projects, the character maintains the same appearance when referenced.
- **Properties/Parameters:**
  - `characterId` (string): Unique identifier linked to useSavedCharactersStore
  - `identityProfile` (object):
    - `referenceImages` (string[], 1-5): Primary reference images at different angles
    - `faceDescriptor` (string): AI-extracted facial feature description (e.g., "round face, large blue eyes, small nose, freckles")
    - `bodyDescriptor` (string): Body proportions and features
    - `styleDescriptor` (string): Art style parameters (e.g., "flat vector, thick outlines, pastel palette, 2.5 head-to-body ratio")
    - `colorPalette` (string[]): Hex codes for the character's signature colors
    - `distinguishingFeatures` (string[]): Unique identifying traits (e.g., "red scarf", "lightning bolt scar", "golden earrings")
    - `outfitDescription` (string): Default outfit details
  - `variants` (array): Each variant has `name`, `outfitDescription`, `referenceImage`, sharing the base identity
  - `consistencyLevel` (enum: "strict" | "flexible" | "loose", default: "strict"):
    - "strict" - Exact sprite reuse, no AI regeneration
    - "flexible" - AI can generate new poses/angles using reference images
    - "loose" - AI maintains general likeness but allows artistic variation
  - `contextAdaptation` (boolean, default: true): Allow minor adjustments for scene context (lighting, shadows)
- **Output:** A persistent character identity system where characters referenced by name maintain perfect visual consistency across all scenes and projects. The identity profile is stored with the character and automatically applied whenever the character is used.
- **Acceptance criteria:**
  - Character Identity Profile auto-generated when a character is saved for the first time
  - "@CharacterName" syntax works in orchestrator prompts to reference saved characters
  - In "strict" mode, the exact same sprites/model are reused across all scenes (zero visual variation)
  - In "flexible" mode, AI-generated new poses maintain at least 90% visual similarity (as judged by CLIP/DINO similarity score against reference images)
  - Character variants share facial identity but allow different outfits
  - Cross-project character references work (user selects character from library for any project)
  - Identity profiles are extractable and shareable (export/import)
  - The orchestrator automatically selects the correct character variant based on scene context
  - Character identity persists through project save/load cycles
- **Edge cases:**
  - User modifies a character's sprites after creating an identity profile: Prompt to update the profile or create a new variant.
  - Orchestrator needs a character in a pose that does not exist in the sprite library: In "strict" mode, use the closest available pose with a transform; in "flexible" mode, generate the pose using the identity profile.
  - Two characters have similar names ("Alex" and "Alexander"): Use exact string matching with fuzzy fallback; show disambiguation dialog if ambiguous.
  - Character's art style conflicts with the scene's art style: In "strict" mode, keep character style and flag the mismatch; in "flexible" mode, adapt while maintaining identity features.
  - User imports a character from another user's shared library: Identity profile transfers with the character, maintaining consistency.
  - 3D character needs 2D representation (or vice versa): The identity profile describes features abstractly enough to guide both 2D and 3D generation, but warn about cross-format limitations.
- **Dependencies:** useSavedCharactersStore.ts for character storage, useSaved3DCharactersStore.ts for 3D characters, CharacterGeneratorPanel.tsx for character creation, orchestrator.ts for plan generation with character context, Gemini vision for extracting identity features.
- **Integration with ProAnimate:** The identity profile extends the existing SavedCharacter interface in useSavedCharactersStore.ts with new fields (`identityProfile`, `variants`). The orchestrator (orchestrator.ts) already supports `savedCharacterName` matching in ClipPlanCharacter -- this feature enhances that matching with identity-aware generation. When the orchestrator calls Vertex AI for new character sprites (via the nanoBanana2 route), the identity profile's reference images and style descriptors are included in the generation prompt. For 2D sprite characters, "strict" mode simply reuses the exact sprites from characterDB.ts. For 3D characters, the GLB model in useSaved3DCharactersStore provides inherent consistency. The "@CharacterName" syntax is parsed in the orchestrator's prompt processing, replacing the reference with the full identity context.
- **Use cases:**
  - A creator produces a 10-episode animated series where the main character "Luna" appears in every episode with exactly the same appearance, despite each episode being generated months apart
  - A brand creates a mascot character and uses it consistently across hundreds of marketing videos, social posts, and ads generated by different team members
  - An educator creates a teacher character for a 30-lesson video course, ensuring students see the same friendly face in every lesson
- **Why it matters:** Character consistency is the number one pain point in AI-generated video content. Without it, characters look different in every frame, breaking immersion and brand identity. LTX Studio built their entire Elements system around solving this problem and positions it as their key differentiator. For series content, marketing, and education, character consistency is non-negotiable. ProAnimate's existing saved character library (useSavedCharactersStore) provides a strong foundation -- this feature elevates it from "reuse sprites" to "maintain identity."
- **Who has it:** LTX Studio (Elements system, gold standard), Synthesia (consistent avatar appearance), HeyGen (1100+ consistent avatars), Hedra AI (persistent character from a single image).
- **Gold standard:** LTX Studio's Elements system is the gold standard for persistent character identity. Users create a character once, save it as an Element, and reference it with "@CharacterName" syntax throughout their project. The character maintains identical appearance across every tagged shot -- from close-ups to wide shots, across different lighting and backgrounds. The system supports character variants (different outfits via duplicated Elements like "@Protagonist_formal") while preserving core facial and body identity. Updates to a character Element propagate automatically across all scenes where it appears.

---

### 56. PowerPoint Import
- **Category:** Specialized Modes
- **What it is:** A direct PPTX file importer that converts PowerPoint presentations into editable ProAnimate projects, mapping slides to scenes, extracting text/images/shapes, preserving layouts, and adding animation and narration.
- **What it does:** Parses PPTX files to extract the full content hierarchy: slide layouts, text boxes (with formatting), images, shapes, charts, tables, speaker notes, and slide transitions. Each slide becomes a ProAnimate scene with text overlays positioned to match the original layout, extracted images placed as media layers, shapes converted to ProAnimate shape objects, and speaker notes converted to narration scripts. The system then enhances the static slides with ProAnimate's animation capabilities: entrance animations for text and images, transitions between slides, AI-generated narration from speaker notes, optional character presenter, background music, and motion graphics. The result is a video that looks like a presentation come to life.
- **User flow:**
  1. User clicks "Import PowerPoint" from the Dashboard or File menu.
  2. User uploads a .pptx file (drag-and-drop or file picker).
  3. System parses the PPTX and shows a slide-by-slide preview with extracted content: text blocks, images, shapes, notes, and detected charts/tables.
  4. User configures conversion options: narration source (speaker notes / AI-generate / none), voice selection, animation style (subtle/dynamic/dramatic), character presenter (yes/no), transition style, music.
  5. User can edit each slide's content before conversion: modify text, remove elements, add elements.
  6. User clicks "Convert" and the system generates a ProAnimate project with one scene per slide.
  7. Project opens in the full editor where every element is individually editable.
  8. User fine-tunes animations, timing, and narration, then exports.
- **Properties/Parameters:**
  - **Input format:** .pptx only (PowerPoint 2007+); .ppt, .odp, and .key files show a conversion prompt
  - **Max file size:** 500 MB
  - **Max slides:** 150
  - `narrationSource` (enum: "speaker-notes" | "ai-generate" | "none", default: "speaker-notes")
  - `voiceId` (string, optional): ElevenLabs voice for narration
  - `animationStyle` (enum: "subtle" | "dynamic" | "dramatic" | "none", default: "dynamic"):
    - "subtle" - Gentle fade-ins, minimal motion
    - "dynamic" - Bounce entrances, slide transitions, emphasis animations
    - "dramatic" - Zoom effects, particle overlays, cinematic transitions
    - "none" - Static slides with only narration
  - `characterPresenter` (boolean, default: false): Add a character that presents alongside slides
  - `characterId` (string, optional): Saved character ID for the presenter
  - `presenterPosition` (enum: "left" | "right" | "bottom-left" | "bottom-right", default: "bottom-right")
  - `transitionStyle` (enum: "fade" | "slide" | "zoom" | "wipe" | "match-pptx", default: "match-pptx")
  - `secondsPerSlide` (number, 3-30, default: "auto" based on content density)
  - `aspectRatio` (enum: "16:9" | "4:3" | "auto", default: "auto" to match PPTX)
  - `preserveLayout` (boolean, default: true): Attempt to match original slide positioning
  - `enhanceCharts` (boolean, default: true): Convert static charts to animated data visualizations
  - `backgroundMusic` (boolean, default: true): Auto-generate background music
- **Output:** A full ProAnimate project with one scene per slide, containing: extracted text as text overlays with original formatting (font, size, color, bold/italic), extracted images as media layers, shapes as ProAnimate shape objects, entrance/exit animations, transitions, narration voiceover (from speaker notes or AI-generated), optional character presenter, background music, and captions.
- **Acceptance criteria:**
  - Parses PPTX files up to 500 MB and 150 slides
  - Text boxes extracted with correct content, font family (closest match from 26 supported fonts), size, color, bold, italic, and alignment
  - Images extracted at original resolution and positioned correctly
  - Basic shapes (rectangle, circle, triangle, arrow) mapped to ProAnimate shape types
  - Speaker notes converted to per-scene narration scripts
  - Slide transitions detected and mapped to closest ProAnimate transition type
  - Charts detected and converted to animated HTML templates (using builtinTemplates infographic templates)
  - 4:3 and 16:9 slide dimensions handled correctly
  - Full project is editable in the main editor with every element independently selectable
  - Processing time under 30 seconds for a 30-slide presentation
- **Edge cases:**
  - PPTX uses custom fonts not available in ProAnimate: Map to the closest available font from the 26 supported families; show a font substitution report.
  - PPTX has embedded videos: Extract and place as video layers; warn about potential quality loss.
  - PPTX has complex SmartArt diagrams: Flatten to images if structure cannot be parsed; attempt to convert simple SmartArt to shapes.
  - Slides have heavy overlapping elements: Preserve z-order but warn about potential layout issues.
  - PPTX is password-protected: Show error with instructions to remove protection first.
  - PPTX uses slide masters/templates with complex backgrounds: Extract background as an image layer; do not attempt to reconstruct CSS equivalents.
  - Speaker notes are empty for some slides: Use AI to generate narration based on slide content for those slides.
- **Dependencies:** A PPTX parser library (e.g., pptx-parser, officegen, or python-pptx via server), useTextOverlayStore.ts for text placement, useShapeStore.ts for shapes, useMediaStore.ts for extracted images, ElevenLabs for narration, orchestrator.ts for the enhancement pipeline.
- **Integration with ProAnimate:** The PPTX parser runs on the Express.js server (new route: `/api/pptx/parse`) which returns a structured JSON representation of all slides. The client maps this to ProAnimate stores: text boxes become TextOverlay entries in useTextOverlayStore (using the existing TextOverlay interface with fontFamily, fontSize, color, etc.), images become MediaAsset entries in useMediaStore, shapes map to useShapeStore entries, and speaker notes populate the dialogue in useMultiCharacterStore. The enhancement pipeline reuses the orchestrator's step executors for animation, transitions, and music. The project is saved via useProjectStore as a standard project.
- **Use cases:**
  - A sales team converts their pitch deck into a narrated video for prospects who prefer watching over reading, sending it via email instead of scheduling another meeting
  - A professor converts lecture slides into video lessons for an online course, adding an animated presenter character and auto-generated narration from speaker notes
  - A marketing team converts their quarterly results presentation into a polished internal comms video with animated charts and background music
- **Why it matters:** PowerPoint is the world's most-used presentation tool with over 500 million users. Synthesia reports PowerPoint import as one of their highest-converting features for enterprise customers. Powtoon has a dedicated PowerPoint integration (Office 365 Add-in) and Powtoon-for-PowerPoint product. The enterprise market specifically needs "PowerPoint to video" because most corporate knowledge lives in slide decks, and video consistently outperforms slides for engagement, training retention, and communication effectiveness.
- **Who has it:** Synthesia (gold standard for enterprise, max 150 slides, auto-avatar narration), Powtoon (Office 365 Add-in, presentation-to-animation), Elai.io (PPTX upload with avatar narration), Golpo (PPTX to whiteboard video).
- **Gold standard:** Synthesia provides the gold standard for PowerPoint import. Users upload a PPTX file (max 150 slides), and the system converts every text box, shape, image, and video into an editable asset. Speaker notes are converted into the narration script. Users choose from 240+ AI avatars in 160+ languages to present the content. The system handles 4:3 to 16:9 conversion, preserves formatting, and produces a fully editable video that can be updated at any time. The output can be downloaded as MP4, shared via link, embedded, or exported as SCORM for LMS integration.

---

### 59. Whiteboard Animation Mode
- **Category:** Specialized Modes
- **What it is:** A specialized rendering mode that makes all visual elements appear to be drawn by hand in real-time on a white (or customizable) background, with an animated hand/pen visible during the drawing process.
- **What it does:** Transforms any ProAnimate content (text, shapes, images, SVG objects, characters) into a whiteboard-style animation where each element appears to be sketched onto the canvas by an animated drawing hand. Text is "written" character by character, shapes are "drawn" stroke by stroke, images are "sketched" with a progressive reveal effect, and illustrations appear through a wipe mask that follows a hand holding a pen or marker. The rendering mode applies a hand-drawn visual filter (slight wobble, pencil texture, imperfect lines) to all elements, creating the authentic whiteboard animation look popularized by RSA Animate and used extensively in educational and explainer content. The mode works with all existing ProAnimate content types, simply changing how they appear and animate.
- **User flow:**
  1. User creates content in the normal ProAnimate editor (or via orchestrator).
  2. User activates "Whiteboard Mode" from the canvas mode selector or Settings panel.
  3. The canvas background switches to white (customizable), and a preview shows all elements with whiteboard styling applied.
  4. User configures whiteboard options: hand style, pen type, drawing speed, background texture, sketch filter intensity.
  5. In the timeline, each element's entrance animation is automatically replaced with a "draw-on" animation showing the hand sketching it into view.
  6. User can adjust the draw order (which elements appear first), drawing speed per element, and hand path.
  7. User previews the whiteboard animation in the Remotion player.
  8. On export, the whiteboard rendering mode produces the final video with the hand-drawn aesthetic applied to all layers.
- **Properties/Parameters:**
  - `enabled` (boolean): Whether whiteboard mode is active
  - `backgroundStyle` (enum: "white" | "cream" | "chalkboard" | "notebook" | "glass" | "custom", default: "white"):
    - "white" - Clean white background
    - "cream" - Slightly warm off-white
    - "chalkboard" - Dark green/black with chalk texture
    - "notebook" - Lined paper background
    - "glass" - Transparent/dark background with bright "neon" drawing
    - "custom" - User-uploaded background image
  - `handStyle` (enum: "right-hand-pen" | "right-hand-marker" | "left-hand-pen" | "left-hand-marker" | "chalk" | "finger" | "none", default: "right-hand-pen")
  - `handSkinTone` (enum: "light" | "medium" | "dark" | "custom", default: "medium")
  - `penColor` (string, hex, default: "#000000"): Primary drawing color
  - `drawSpeed` (number, 0.5-3.0, default: 1.0): Global drawing speed multiplier
  - `sketchFilter` (object):
    - `enabled` (boolean, default: true): Apply hand-drawn filter to all elements
    - `wobble` (number, 0.0-1.0, default: 0.3): Line irregularity
    - `textureIntensity` (number, 0.0-1.0, default: 0.5): Pencil/chalk texture visibility
    - `colorMode` (enum: "full-color" | "monochrome" | "limited-palette", default: "full-color")
  - `drawOrderMode` (enum: "left-to-right" | "top-to-bottom" | "center-out" | "custom", default: "left-to-right"): Default order in which elements are drawn
  - `eraseEffect` (boolean, default: false): Show eraser removing elements on exit
  - `soundEffects` (boolean, default: true): Pen scratching, marker squeaking, chalk sounds synchronized to drawing
  - `elementDrawStyles` (per-element overrides):
    - Text: "write" (character-by-character) | "appear" (word reveal with hand) | "stamp" (block reveal)
    - Images: "sketch" (progressive line-drawing reveal) | "wipe" (hand wipes to reveal) | "draw-outline-then-fill" (outline first, then color fill)
    - Shapes: "stroke" (draw the outline) | "fill-then-stroke" | "complete" (appear fully formed)
    - Characters: "draw-parts" (draw body parts sequentially) | "wipe-reveal" | "fade-with-hand"
- **Output:** A rendered video where all content appears in a hand-drawn whiteboard animation style, with an animated drawing hand visible during element entrances, sketch-style visual filters applied, and synchronized sound effects. The output is a standard MP4/WebM video.
- **Acceptance criteria:**
  - Whiteboard mode toggle switches the canvas to whiteboard rendering in under 1 second
  - Drawing hand animates smoothly along a natural-looking path to each element's position
  - Text elements are drawn character-by-character with the pen following each letter's path
  - Shape outlines are drawn with visible stroke animation (SVG stroke-dashoffset technique)
  - Images are revealed with a wipe mask that follows the hand's position
  - The sketch filter applies consistently to all elements: slight wobble, pencil texture, imperfect edges
  - At least 6 hand styles available (pen, marker, chalk) for both left and right hands
  - At least 5 background textures available (white, cream, chalkboard, notebook, glass)
  - Sound effects (pen scratching, marker squeaking) synchronize with hand movement
  - Draw order is customizable per-element via the timeline
  - Chalkboard mode uses chalk-colored drawing with chalk dust particles
  - Export quality matches non-whiteboard rendering at equivalent settings
  - Whiteboard mode works with all existing content types: text overlays, shapes, media, SVG objects, Lottie animations, characters
- **Edge cases:**
  - Element has a very complex shape (100+ points): Simplify the drawing path for performance; draw the outline without internal details.
  - Multiple elements overlap spatially: Draw in timeline order; later elements draw on top of earlier ones.
  - User switches whiteboard mode off: Restore original element animations without data loss.
  - Video contains video layers (moving media): Apply a posterize/sketch filter to video frames rather than the drawing reveal effect.
  - Character animations (lip sync, gestures): Draw the character on first appearance, then animate normally for subsequent frames.
  - Text uses a font that does not have path data for stroke animation: Fall back to "appear" mode (word-by-word reveal with hand gesture).
  - Very long videos (>3 minutes): Auto-adjust drawing speed to prevent the hand being on screen for the entire duration; use "stamp" reveals for less important elements.
- **Dependencies:** SVG path animation for stroke drawing effects, Canvas 2D for hand overlay rendering, existing canvas2dRenderer.ts for the sketch filter pipeline, sound effect library for pen/marker/chalk sounds, MediaLayer (for hand sprite animation).
- **Integration with ProAnimate:** Whiteboard mode is implemented as a rendering modifier in canvas2dRenderer.ts and the Remotion composition (VideoComposition.tsx). A new `useWhiteboardStore` manages whiteboard state (enabled, settings, per-element draw order). The sketch filter extends the existing StyleEffectFilters system (src/components/canvas/StyleEffectFilters.tsx) with a "hand-drawn" filter preset using SVG feTurbulence and feDisplacementMap. The drawing hand is rendered as an animated sprite overlay positioned by the whiteboard engine based on element positions from useTextOverlayStore, useShapeStore, useSVGObjectStore, and useMediaStore. Sound effects use the existing audio mixing pipeline (audioMixer.ts). The whiteboard draw order is stored in the timeline as a special track in useTimelineStore. The orchestrator can set `videoStyle: "whiteboard"` in the ClipPlan to activate whiteboard mode during automated generation.
- **Use cases:**
  - An educator creates Khan Academy-style math explainer videos where equations are "written" on a whiteboard with step-by-step reveals
  - A startup creates a whiteboard-style explainer video for their product, showing the problem-solution flow with hand-drawn diagrams and text
  - A training department produces compliance videos in whiteboard style, which research shows improves retention by 15% over traditional presentation format
- **Why it matters:** Whiteboard animation is a proven, high-converting video style that commands premium pricing ($500-5000+ per minute from professional studios). Golpo (YC-backed) built their entire product around AI whiteboard video generation. Animaker revived whiteboard mode as "Whiteboard 3.0" due to overwhelming user demand. The whiteboard style is uniquely suited for educational, explainer, and corporate training content -- the exact market segments where ProAnimate competes. Adding whiteboard mode expands ProAnimate's addressable market to the entire explainer video industry without requiring new content creation tools (it is a rendering mode applied to existing content).
- **Who has it:** Animaker (Whiteboard 3.0 with character builder, gold standard for DIY), Golpo (AI document-to-whiteboard, gold standard for automation), Doodly (dedicated whiteboard tool), VideoScribe (classic whiteboard animation), Powtoon (whiteboard mode), Renderforest (whiteboard templates), FrameNet (free whiteboard animation).
- **Gold standard:** Animaker's Whiteboard 3.0 represents the gold standard for a whiteboard mode within a general-purpose animation platform. It provides 200+ character actions, 20+ expressions, 10,000+ whiteboard-specific assets, multiple hand styles with different skin tones and genders, and the ability to create custom whiteboard characters. The mode applies seamlessly to their existing animation tools -- users create content normally and toggle whiteboard rendering. Golpo represents the gold standard for AI-automated whiteboard generation: upload a document, and receive a complete whiteboard animation with narration, transitions, and hand-drawn reveal effects, all generated automatically.

---

## Related

- [[feature-list]] — Complete 167-feature list (includes these 60 + 107 already built)
- [[feature-priorities]] — Prioritized ranking and scoring methodology for these 60 features
- [[research]] — Competitive analysis that identified these 60 feature gaps
- [[PROGRESS]] — Implementation progress tracking
- [[phase-1]] through [[phase-10]] — Implementation phases for these features
