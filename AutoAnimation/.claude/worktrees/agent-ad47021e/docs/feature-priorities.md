# ProAnimate — Feature Priorities

**Date:** March 12, 2026
**Methodology:** Each feature scored 1-5 across 4 dimensions. Higher = stronger.

> Consolidated from the former `feature-priority-matrix.md` and `feature-rankings.md`.

---

## Scoring Dimensions

| Dimension | What It Measures | 1 (Low) | 5 (High) |
|-----------|-----------------|---------|----------|
| **Need** | How urgently ProAnimate needs this to compete | Nice-to-have, niche | Table stakes, multiple top competitors have it |
| **Ease** | How easy to implement given existing infrastructure | Requires entirely new systems, 6+ weeks | Leverages existing code, <1 week |
| **Completes** | How much this rounds out an existing feature area | Standalone, doesn't finish anything | Fills a critical gap in an already-built system |
| **Unlocks** | How many new features/products this enables | Dead-end feature, no follow-ons | Opens an entire new branch of capabilities |

## Priority Score Formula

**Priority = (Need x 2) + Ease + (Completes x 1.5) + (Unlocks x 1.5)**

Need is weighted 2x because competitive survival matters most.

---

## Ranked Features (All 60)

| Rank | Feature | Category | Need | Ease | Completes | Unlocks | Score | Tier | One-Liner |
|:----:|---------|----------|:----:|:----:|:---------:|:-------:|:-----:|:----:|-----------|
| 1 | AI Auto-Caption/Transcription | AI Video Intelligence | 5 | 3 | 5 | 5 | **28.0** | T1 | Gateway feature — unlocks 5+ downstream features. captions.ts ready to receive |
| 2 | AI Voice Cloning | AI Content Generation | 4 | 4 | 4 | 4 | **24.0** | T1 | ElevenLabs API already supports it. Expose the clone endpoint |
| 3 | GIF Export | Export & Output | 5 | 5 | 4 | 1 | **23.5** | T1 | Add gif.js to existing frame-by-frame export pipeline. 1-2 days |
| 4 | 4K Export | Export & Output | 5 | 4 | 4 | 1 | **23.5** | T1 | Remove resolution cap in videoExport.ts. Hours of work |
| 5 | Beat Detection & Audio Sync | AI Editing Intelligence | 4 | 4 | 4 | 3 | **22.5** | T1 | beatSync.ts already exists with effects. Add Web Audio analysis |
| 6 | Path Animation (Bezier Curves) | Animation Engine | 4 | 4 | 4 | 3 | **22.5** | T1 | engine/path.ts exists with arc-length parameterization. Needs UI |
| 7 | Blend Modes | Animation Engine | 4 | 5 | 4 | 2 | **22.0** | T1 | Canvas globalCompositeOperation per layer. A few lines of code |
| 8 | Persistent Character Identity | Specialized Modes | 4 | 3 | 5 | 3 | **22.0** | T1 | Saved character stores 90% built. Add cross-scene binding |
| 9 | Vector/Alpha Masks | Animation Engine | 4 | 3 | 4 | 3 | **21.5** | T2 | Canvas 2D clip paths + SVG clipPath. Completes compositing stack |
| 10 | AI Silence/Filler Removal | AI Video Intelligence | 4 | 4 | 4 | 2 | **21.0** | T2 | Falls out naturally once transcription (#1) ships |
| 11 | Direct Social Publishing | Distribution & Publishing | 5 | 2 | 4 | 3 | **20.5** | T2 | socialPublish.ts + server/routes/social.ts partially exist |
| 12 | AI Virality Scoring | AI Video Intelligence | 4 | 3 | 3 | 3 | **20.0** | T2 | viralityScorer.ts already partially built. Completes analytics |
| 13 | AI Smart Zoom | AI Video Intelligence | 4 | 3 | 4 | 2 | **20.0** | T2 | useCameraStore has pan/zoom keyframes. Auto-generate from transcript |
| 14 | AI B-Roll Auto-Insertion | AI Content Generation | 4 | 3 | 4 | 2 | **20.0** | T2 | Pixabay + orchestrator already place stock media. Make it smarter |
| 15 | API for Automation | Automation & Dev Tools | 4 | 3 | 3 | 5 | **20.0** | T2 | 38-route Express backend ready. Wrap orchestrator. Massive unlock |
| 16 | Text-Based Video Editing | AI Video Intelligence | 4 | 2 | 3 | 4 | **19.5** | T2 | Paradigm shift — edit transcript to edit video. Needs #1 first |
| 17 | URL-to-Video | AI Content Generation | 4 | 2 | 2 | 4 | **18.0** | T2 | server/routes/urlToVideo.ts partially built. Extends orchestrator |
| 18 | Transparent Video Export | Export & Output | 4 | 2 | 4 | 2 | **18.0** | T2 | WebCodecs alpha channel + FFmpeg WASM for ProRes 4444 |
| 19 | Public REST API | Automation & Dev Tools | 4 | 2 | 3 | 5 | **18.0** | T2 | Extends #15 with docs, API keys, rate limits. Developer ecosystem |
| 20 | Brand Kit System | Distribution & Publishing | 4 | 3 | 3 | 3 | **17.5** | T3 | Extends useSettingsStore with brand presets. Orchestrator auto-applies |
| 21 | Long-to-Short Clip Extraction | AI Video Intelligence | 4 | 2 | 2 | 3 | **17.5** | T3 | New video import + analysis pipeline. Pivots toward editing workflow |
| 22 | NLE XML Export | Export & Output | 3 | 3 | 3 | 2 | **16.5** | T3 | Generate FCPXML from useTimelineStore data. Professional bridge |
| 23 | Animated Gradients | Animation Engine | 3 | 4 | 3 | 2 | **16.5** | T3 | Canvas linear/radial gradients with animated stops. Extends shapes |
| 24 | Blur Effect Presets | Animation Engine | 3 | 4 | 3 | 2 | **16.5** | T3 | CSS/Canvas filter:blur(). effects/ folder ready. Trivial addition |
| 25 | 120fps Export | Export & Output | 3 | 4 | 3 | 1 | **16.5** | T3 | usePlaybackStore supports variable FPS. Just add the option |
| 26 | Reusable Timing Templates | Automation & Dev Tools | 3 | 4 | 3 | 2 | **16.5** | T3 | Save/load keyframe patterns from useKeyframeStore as JSON |
| 27 | Batch Generation from CSV | Automation & Dev Tools | 3 | 3 | 3 | 2 | **16.5** | T3 | Parse CSV, loop orchestrator per row. templateBridge supports CONFIG |
| 28 | AI Image-to-Video | AI Content Generation | 3 | 3 | 2 | 3 | **16.5** | T3 | Already proxy AI video gen. Add image conditioning parameter |
| 29 | Blog/Article-to-Video | AI Content Generation | 3 | 3 | 3 | 2 | **16.5** | T3 | Content extraction variant of URL-to-video (#17). Extends orchestrator |
| 30 | Multi-Face Simultaneous Lip Sync | AI Editing Intelligence | 3 | 3 | 4 | 1 | **16.5** | T3 | useMultiCharacterStore exists. Extend for overlapping speech |
| 31 | Audio-Reactive Visuals | AI Editing Intelligence | 3 | 3 | 3 | 3 | **16.5** | T3 | Depends on beat detection (#5). Drive properties from audio amplitude |
| 32 | A/B Testing of Variations | AI Editing Intelligence | 3 | 3 | 3 | 3 | **16.5** | T3 | Run orchestrator N times with parameter variations. Compare results |
| 33 | Singing Character Videos | AI Content Generation | 3 | 2 | 3 | 2 | **15.5** | T3 | Have lip sync + characters. Need music-to-viseme mapping |
| 34 | Natural Language Timeline Editing | AI Editing Intelligence | 3 | 2 | 2 | 4 | **15.0** | T3 | Map NL commands to timeline operations via Gemini. Big UX unlock |
| 35 | Webcam Puppeteering / Mocap | AI Editing Intelligence | 3 | 1 | 3 | 4 | **14.5** | T3 | Needs MediaPipe/TF.js. Unlocks live streaming + motion transfer |
| 36 | Shape Morphing | Animation Engine | 3 | 2 | 3 | 3 | **14.5** | T3 | SVG path interpolation between shapes. New algorithm needed |
| 37 | Infinite Canvas / Multi-Artboard | Canvas & Design Tools | 3 | 1 | 3 | 4 | **14.5** | T3 | Major arch change to VideoCanvas.tsx. Unlocks multi-format export |
| 38 | Pen Tool for Custom Vectors | Canvas & Design Tools | 3 | 2 | 3 | 3 | **14.5** | T3 | Bezier curve editor UI. useArtCurveStore partially exists |
| 39 | AI Video Translator | Automation & Dev Tools | 3 | 2 | 3 | 3 | **14.5** | T3 | Transcription + TTS in target language + lip re-sync. Multi-step |
| 40 | PowerPoint Import | Specialized Modes | 3 | 2 | 2 | 3 | **13.5** | T4 | Parse PPTX zip (XMLs + images). Map slides to scenes |
| 41 | Lottie JSON Export | Export & Output | 3 | 1 | 3 | 3 | **13.5** | T4 | Hard — convert keyframe system to bodymovin JSON schema |
| 42 | Figma Plugin | Collaboration | 3 | 2 | 2 | 3 | **13.5** | T4 | Figma Plugin API + animation engine. Design-to-animation bridge |
| 43 | Document/PDF-to-Video | Automation & Dev Tools | 3 | 2 | 2 | 3 | **13.5** | T4 | PDF parsing + content extraction + orchestrator. Extends #17 |
| 44 | CSS Easing Export | Export & Output | 2 | 5 | 2 | 1 | **12.5** | T4 | interpolation.ts has cubic bezier params. Export as string. Trivial |
| 45 | Real-Time Collaboration | Collaboration | 3 | 1 | 2 | 4 | **12.0** | T4 | WebSocket/CRDT infrastructure. Massive lift. Unlocks enterprise |
| 46 | Whiteboard Animation Mode | Specialized Modes | 3 | 2 | 2 | 2 | **12.0** | T4 | SVG stroke animation + hand overlay + drawing reveal |
| 47 | Data-Driven Procedural Animation | Animation Engine | 2 | 2 | 2 | 3 | **11.5** | T4 | Feed CSV/JSON into template CONFIG. Niche Cavalry territory |
| 48 | AI Eye Contact Correction | AI Content Generation | 3 | 1 | 2 | 1 | **11.5** | T4 | ML gaze correction model. Not our core use case |
| 49 | AI Person Clone | AI Content Generation | 2 | 1 | 2 | 3 | **11.5** | T4 | Video analysis for gesture learning. Entirely new ML pipeline |
| 50 | Live Avatar Streaming | Specialized Modes | 2 | 1 | 2 | 4 | **11.0** | T4 | Real-time rendering + WebRTC. Entirely new architecture |
| 51 | Interactive Runtime Export (Rive) | Export & Output | 2 | 1 | 2 | 3 | **10.5** | T4 | Rive .riv format is proprietary. Would need full converter |
| 52 | CLI Tool | Automation & Dev Tools | 2 | 2 | 2 | 3 | **10.5** | T4 | Headless Remotion + CLI wrapper. Depends on API (#15) |
| 53 | Formulas in Input Fields | Canvas & Design Tools | 2 | 3 | 2 | 1 | **10.5** | T4 | Expression parser for numeric inputs. Nice QoL, niche |
| 54 | Sketch-to-Animation | AI Content Generation | 2 | 2 | 2 | 2 | **10.0** | T4 | Vectorize sketches -> SVG/rig pipeline. Low competitive pressure |
| 55 | Screenshot-to-Video | Automation & Dev Tools | 2 | 2 | 2 | 2 | **10.0** | T4 | Upload screenshots, AI generates transitions. Software demo niche |
| 56 | Portfolio Platform | Distribution & Publishing | 2 | 2 | 1 | 2 | **9.5** | T4 | Hosted gallery pages. New frontend + hosting. Users have alternatives |
| 57 | SCORM Export (L&D) | Export & Output | 2 | 2 | 1 | 2 | **9.5** | T4 | Video + HTML wrapper as SCORM zip. Niche L&D market |
| 58 | Motion Transfer from Reference | AI Editing Intelligence | 2 | 1 | 2 | 2 | **9.0** | T4 | Pose estimation on video + retargeting to rigs. Complex ML |
| 59 | Offline Support | Collaboration | 2 | 1 | 2 | 1 | **8.5** | T4 | Service workers + IndexedDB sync + conflict resolution |
| 60 | 8K Export | Export & Output | 1 | 3 | 2 | 1 | **7.5** | T4 | No market demand for short-form 8K. Hardware-limited anyway |

### Tier Legend

| Tier | Label | Score Range | Count | Strategy |
|:----:|-------|:----------:|:-----:|----------|
| **T1** | Do First | 22.0+ | 8 | Ship these ASAP — competitive survival + low-hanging fruit |
| **T2** | Build Next | 18.0 - 21.9 | 11 | Round out major systems, close visible gaps |
| **T3** | Strategic | 14.0 - 17.9 | 20 | Market expansion, new user segments |
| **T4** | Long-Term | < 14.0 | 21 | Build when there's a specific customer need |

---

## Implementation Tiers

### Tier 1: Do First (Score 22+) — Competitive Survival + Quick Wins
*These features are either table stakes or leverage existing infrastructure heavily.*

| # | Feature | Score | Why Now |
|---|---------|:-----:|---------|
| 1 | AI Auto-Caption/Transcription | 28.0 | Unlocks 5+ downstream features. Every competitor has this. captions.ts is ready to receive data |
| 20 | AI Voice Cloning | 24.0 | ElevenLabs API already supports it. Flip a switch. Completes voice system |
| 3 | GIF Export | 23.5 | Add gif.js to existing export pipeline. Days, not weeks |
| 4 | 4K Export | 23.5 | Remove resolution cap. Nearly zero effort |
| 18 | Beat Detection & Audio Sync | 22.5 | beatSync.ts already exists. Add Web Audio analysis. Completes audio system |
| 14 | Path Animation | 22.5 | engine/path.ts exists with arc-length parameterization. Needs UI |
| 16 | Blend Modes | 22.0 | globalCompositeOperation per layer. A few lines of code |
| 55 | Persistent Character Identity | 22.0 | Saved character stores exist. Need cross-scene binding |

### Tier 2: Build Next (Score 18-21.9) — Competitive Advantage
*These round out major systems and address gaps that users actively notice.*

| # | Feature | Score | Why Next |
|---|---------|:-----:|---------|
| 15 | Vector/Alpha Masks | 21.5 | Completes compositing. Canvas 2D clip paths |
| 2 | AI Silence/Filler Removal | 21.0 | Falls out naturally from transcription (#1) |
| 10 | Direct Social Publishing | 20.5 | Partial code exists. OAuth flows needed |
| 5 | AI Virality Scoring | 20.0 | Partial code exists. Completes analytics |
| 8 | AI Smart Zoom | 20.0 | Camera store ready. Auto-generate keyframes from transcript |
| 9 | AI B-Roll Auto-Insertion | 20.0 | Pixabay + orchestrator already do this. Make it smarter |
| 27 | API for Automation | 20.0 | Express backend ready. Wrap orchestrator. Massive unlock |
| 22 | Text-Based Video Editing | 19.5 | Paradigm shift enabled by #1 |
| 35 | URL-to-Video | 18.0 | urlToVideo.ts partially built. Extends orchestrator inputs |
| 12 | Transparent Video Export | 18.0 | WebCodecs alpha + FFmpeg WASM for ProRes |
| 41 | Public REST API | 18.0 | Extends #27 with docs, keys, rate limits |

### Tier 3: Strategic Investments (Score 14-17.9) — Market Expansion
*These open new markets or user segments.*

| # | Feature | Score |
|---|---------|:-----:|
| 6 | Brand Kit System | 17.5 |
| 7 | Long-to-Short Clip Extraction | 17.5 |
| 26 | NLE XML Export | 16.5 |
| 17 | Animated Gradients | 16.5 |
| 49 | Blur Effect Presets | 16.5 |
| 47 | 120fps Export | 16.5 |
| 28 | Reusable Timing Templates | 16.5 |
| 42 | Batch Generation from CSV | 16.5 |
| 24 | AI Image-to-Video | 16.5 |
| 36 | Blog/Article-to-Video | 16.5 |
| 29 | Multi-Face Lip Sync | 16.5 |
| 30 | Audio-Reactive Visuals | 16.5 |
| 38 | A/B Testing of Variations | 16.5 |
| 33 | Singing Characters | 15.5 |
| 23 | NL Timeline Editing | 15.0 |
| 31 | Webcam Puppeteering | 14.5 |
| 13 | Shape Morphing | 14.5 |
| 43 | Infinite Canvas | 14.5 |
| 44 | Pen Tool | 14.5 |
| 48 | AI Video Translator | 14.5 |

### Tier 4: Long-Term / Opportunistic (Score <14) — Build When Ready
*Lower urgency. Build when there's a specific customer need or strategic opportunity.*

| # | Feature | Score |
|---|---------|:-----:|
| 56 | PowerPoint Import | 13.5 |
| 11 | Lottie JSON Export | 13.5 |
| 25 | Figma Plugin | 13.5 |
| 53 | Document/PDF-to-Video | 13.5 |
| 45 | CSS Easing Export | 12.5 |
| 21 | Real-Time Collaboration | 12.0 |
| 59 | Whiteboard Mode | 12.0 |
| 57 | Data-Driven Animation | 11.5 |
| 19 | AI Eye Contact Correction | 11.5 |
| 37 | AI Person Clone | 11.5 |
| 34 | Live Avatar Streaming | 11.0 |
| 40 | Interactive Runtime Export | 10.5 |
| 52 | CLI Tool | 10.5 |
| 50 | Formulas in Input Fields | 10.5 |
| 39 | Sketch-to-Animation | 10.0 |
| 51 | Screenshot-to-Video | 10.0 |
| 54 | Portfolio Platform | 9.5 |
| 58 | SCORM Export | 9.5 |
| 32 | Motion Transfer | 9.0 |
| 46 | Offline Support | 8.5 |
| 60 | 8K Export | 7.5 |

---

## "Biggest Bang for Buck" — Features That Score High on BOTH Ease and Impact

| # | Feature | Ease | Need+Completes+Unlocks | Effort | Payoff |
|---|---------|:----:|:---------------------:|--------|--------|
| 16 | Blend Modes | 5 | 10 | Hours | Professional compositing |
| 4 | 4K Export | 4 | 10 | Hours | Table stakes checkbox |
| 3 | GIF Export | 5 | 10 | 1-2 days | New sharing format |
| 20 | Voice Cloning | 4 | 12 | 2-3 days | Complete voice system |
| 18 | Beat Detection | 4 | 11 | 3-5 days | Complete audio system |
| 14 | Path Animation | 4 | 11 | 1 week | Complete animation engine |
| 45 | CSS Easing Export | 5 | 5 | Hours | Developer handoff |
| 47 | 120fps Export | 4 | 7 | Hours | Smooth motion option |
| 49 | Blur Effect Presets | 4 | 8 | 1-2 days | Complete effects library |
| 28 | Reusable Timing Templates | 4 | 8 | 2-3 days | Workflow efficiency |

---

## Feature Dependency Chains

These chains show which features unlock others. Build from left to right:

```
#1 Transcription -> #2 Silence Removal
                 -> #8 Smart Zoom
                 -> #22 Text-Based Editing -> #23 NL Timeline Editing
                 -> #7 Clip Extraction (+ #5 Virality Scoring)
                 -> #48 Video Translator

#18 Beat Detection -> #30 Audio-Reactive Visuals
                   -> #33 Singing Characters

#27 API -> #41 Public REST API -> #42 Batch from CSV
                               -> #52 CLI Tool

#35 URL-to-Video -> #36 Blog-to-Video
                 -> #51 Screenshot-to-Video

#31 Webcam Mocap -> #32 Motion Transfer
                 -> #34 Live Avatar Streaming

#14 Path Animation <-> #44 Pen Tool (mutual: pen draws paths, paths need pen)

#16 Blend Modes + #15 Masks -> complete compositing stack

#20 Voice Cloning -> #37 AI Person Clone (voice + gesture learning)
```

---

## Per-Category Breakdown with Notes

### AI Video Intelligence

| # | Feature | Need | Ease | Completes | Unlocks | Score | Notes |
|---|---------|:----:|:----:|:---------:|:-------:|:-----:|-------|
| 1 | AI Auto-Caption/Transcription | 5 | 3 | 5 | 5 | 28.0 | We already have captions.ts + CaptionOverlay — this completes the caption system by adding auto-generation. Unlocks text-based editing (#22), silence removal (#2), smart zoom (#8), clip extraction (#7), translator (#48) |
| 2 | AI Silence/Filler Removal | 4 | 4 | 4 | 2 | 21.0 | Depends on transcription (#1). Once we have word-level timestamps, trimming silence is straightforward timeline manipulation in useTimelineStore |
| 5 | AI Virality Scoring | 4 | 3 | 3 | 3 | 20.0 | We already have viralityScorer.ts and viralityAnalyzer.ts partially built. Completes the analytics/learning system |
| 7 | Long-to-Short Clip Extraction | 4 | 2 | 2 | 3 | 17.5 | Requires entirely new video import + analysis pipeline. ProAnimate is a creation tool, not an editing tool |
| 8 | AI Smart Zoom | 4 | 3 | 4 | 2 | 20.0 | useCameraStore already supports pan/zoom keyframes. This auto-generates camera keyframes from transcript data |
| 22 | Text-Based Video Editing | 4 | 2 | 3 | 4 | 19.5 | Requires transcription (#1) first. Editing the transcript to edit the timeline is a paradigm shift |

### AI Content Generation

| # | Feature | Need | Ease | Completes | Unlocks | Score | Notes |
|---|---------|:----:|:----:|:---------:|:-------:|:-----:|-------|
| 9 | AI B-Roll Auto-Insertion | 4 | 3 | 4 | 2 | 20.0 | Pixabay integration already exists. Orchestrator already does stock media placement. This makes it transcript-aware |
| 19 | AI Eye Contact Correction | 3 | 1 | 2 | 1 | 11.5 | Requires ML model for gaze correction — entirely new system. Only useful for webcam/recorded content |
| 20 | AI Voice Cloning | 4 | 4 | 4 | 4 | 24.0 | ElevenLabs already supports voice cloning in their API — just need to expose the clone endpoint |
| 24 | AI Image-to-Video | 3 | 3 | 2 | 3 | 16.5 | We already proxy AI video generation. Adding image conditioning is an API parameter |
| 33 | Singing Character Videos | 3 | 2 | 3 | 2 | 15.5 | We have lip sync + character system. Needs audio-to-viseme for music |
| 35 | URL-to-Video | 4 | 2 | 2 | 4 | 18.0 | Requires web scraping + content extraction + orchestrator integration. server/routes/urlToVideo.ts partially built |
| 36 | Blog/Article-to-Video | 3 | 3 | 3 | 2 | 16.5 | Once URL-to-video (#35) exists, blog conversion is a content extraction variant |
| 37 | AI Person Clone | 2 | 1 | 2 | 3 | 11.5 | Requires video analysis for gesture/mannerism learning — entirely new ML pipeline |
| 39 | Sketch-to-Animation | 2 | 2 | 2 | 2 | 10.0 | Niche feature. Low competitive pressure |

### AI Editing Intelligence

| # | Feature | Need | Ease | Completes | Unlocks | Score | Notes |
|---|---------|:----:|:----:|:---------:|:-------:|:-----:|-------|
| 18 | Beat Detection & Audio Sync | 4 | 4 | 4 | 3 | 22.5 | beatSync.ts already exists with effects. Just needs proper audio analysis (Web Audio API spectral flux) |
| 23 | Natural Language Timeline Editing | 3 | 2 | 2 | 4 | 15.0 | We have the orchestrator (Gemini), but mapping NL commands to timeline operations is a new AI pipeline |
| 29 | Multi-Face Simultaneous Lip Sync | 3 | 3 | 4 | 1 | 16.5 | We already do multi-character dialogue. This extends it to handle overlapping speech |
| 30 | Audio-Reactive Visuals | 3 | 3 | 3 | 3 | 16.5 | Depends on beat detection (#18). Driving visual properties from audio amplitude is straightforward |
| 31 | Webcam Puppeteering / Motion Capture | 3 | 1 | 3 | 4 | 14.5 | Requires MediaPipe/TensorFlow.js for face/body tracking. New ML dependency |
| 32 | Motion Transfer from Reference Video | 2 | 1 | 2 | 2 | 9.0 | Requires pose estimation on video frames + retargeting. Complex ML pipeline |
| 38 | A/B Testing of Video Variations | 3 | 3 | 3 | 3 | 16.5 | Orchestrator can already generate clips. Running it N times with variations is straightforward |

### Animation Engine

| # | Feature | Need | Ease | Completes | Unlocks | Score | Notes |
|---|---------|:----:|:----:|:---------:|:-------:|:-----:|-------|
| 13 | Shape Morphing | 3 | 2 | 3 | 3 | 14.5 | Requires SVG path interpolation. useShapeStore exists but only has basic shapes |
| 14 | Path Animation (Bezier Curves) | 4 | 4 | 4 | 3 | 22.5 | engine/path.ts already exists with arc-length parameterization. Just needs UI |
| 15 | Vector/Alpha Masks | 4 | 3 | 4 | 3 | 21.5 | Canvas 2D globalCompositeOperation and SVG clipPath. Completes compositing |
| 16 | Blend Modes | 4 | 5 | 4 | 2 | 22.0 | Canvas 2D globalCompositeOperation — literally a few lines per layer |
| 17 | Animated Gradients | 3 | 4 | 3 | 2 | 16.5 | Canvas 2D linear/radial gradients with animated color stops |
| 49 | Blur Effect Presets | 3 | 4 | 3 | 2 | 16.5 | CSS/Canvas filter: blur(). effects/ folder ready |
| 57 | Data-Driven Procedural Animation | 2 | 2 | 2 | 3 | 11.5 | Niche (Cavalry/Canva territory). Template system supports it partially |

### Canvas & Design Tools

| # | Feature | Need | Ease | Completes | Unlocks | Score | Notes |
|---|---------|:----:|:----:|:---------:|:-------:|:-----:|-------|
| 43 | Infinite Canvas / Multi-Artboard | 3 | 1 | 3 | 4 | 14.5 | Major architectural change. Unlocks multi-format export, storyboarding |
| 44 | Pen Tool for Custom Vectors | 3 | 2 | 3 | 3 | 14.5 | Requires Bezier curve editor UI. useArtCurveStore partially exists |
| 50 | Formulas in Input Fields | 2 | 3 | 2 | 1 | 10.5 | Expression parser for numeric inputs. Nice QoL but niche |

### Export & Output

| # | Feature | Need | Ease | Completes | Unlocks | Score | Notes |
|---|---------|:----:|:----:|:---------:|:-------:|:-----:|-------|
| 3 | GIF Export | 5 | 5 | 4 | 1 | 23.5 | gif.js or similar. videoExport.ts already renders frames to canvas |
| 4 | 4K Export | 5 | 4 | 4 | 1 | 23.5 | videoExport.ts already supports resolution scaling. Just remove the cap |
| 11 | Lottie JSON Export | 3 | 1 | 3 | 3 | 13.5 | Hard — requires converting our keyframe/layer system to bodymovin JSON |
| 12 | Transparent Video Export (ProRes 4444) | 4 | 2 | 4 | 2 | 18.0 | WebCodecs can encode with alpha. ProRes 4444 specifically needs FFmpeg/WASM |
| 26 | NLE XML Export (Premiere/DaVinci/FCP) | 3 | 3 | 3 | 2 | 16.5 | Generate FCPXML or AAF from our timeline data |
| 40 | Interactive Runtime Export (Rive Format) | 2 | 1 | 2 | 3 | 10.5 | Rive's .riv format is proprietary. Massive effort |
| 45 | CSS Easing Export | 2 | 5 | 2 | 1 | 12.5 | interpolation.ts already has cubic bezier params. Trivial |
| 47 | 120fps Export | 3 | 4 | 3 | 1 | 16.5 | usePlaybackStore already supports variable FPS. Just add the option |
| 58 | SCORM Export (L&D) | 2 | 2 | 1 | 2 | 9.5 | Niche L&D market. Low competitive pressure |
| 60 | 8K Export | 1 | 3 | 2 | 1 | 7.5 | Virtually no market demand for short-form 8K |

### Distribution & Publishing

| # | Feature | Need | Ease | Completes | Unlocks | Score | Notes |
|---|---------|:----:|:----:|:---------:|:-------:|:-----:|-------|
| 6 | Brand Kit System | 4 | 3 | 3 | 3 | 17.5 | Extends useSettingsStore with brand presets. Orchestrator auto-applies |
| 10 | Direct Social Publishing | 5 | 2 | 4 | 3 | 20.5 | socialPublish.ts + server/routes/social.ts partially exist |
| 54 | Portfolio Platform | 2 | 2 | 1 | 2 | 9.5 | Low priority — users have other portfolio options |

### Collaboration

| # | Feature | Need | Ease | Completes | Unlocks | Score | Notes |
|---|---------|:----:|:----:|:---------:|:-------:|:-----:|-------|
| 21 | Real-Time Collaboration | 3 | 1 | 2 | 4 | 12.0 | Requires WebSocket/CRDT infrastructure. Massive architectural lift |
| 25 | Figma Plugin | 3 | 2 | 2 | 3 | 13.5 | Figma Plugin API + animation engine. Design-to-animation pipeline |
| 46 | Offline Support | 2 | 1 | 2 | 1 | 8.5 | Service workers + IndexedDB sync. Full offline needs sync conflict resolution |

### Automation & Developer Tools

| # | Feature | Need | Ease | Completes | Unlocks | Score | Notes |
|---|---------|:----:|:----:|:---------:|:-------:|:-----:|-------|
| 27 | API for Automation | 4 | 3 | 3 | 5 | 20.0 | Express.js backend exists with 38 routes. Massive unlock: Zapier/Make/n8n |
| 28 | Reusable Timing Templates | 3 | 4 | 3 | 2 | 16.5 | Save/load keyframe patterns from useKeyframeStore |
| 41 | Public REST API | 4 | 2 | 3 | 5 | 18.0 | Extends #27 with documentation, versioning, rate limits |
| 42 | Batch Generation from CSV/Spreadsheet | 3 | 3 | 3 | 2 | 16.5 | Parse CSV, iterate orchestrator per row |
| 48 | AI Video Translator | 3 | 2 | 3 | 3 | 14.5 | Requires transcription (#1) + TTS in target language + lip sync re-sync |
| 51 | Screenshot-to-Video | 2 | 2 | 2 | 2 | 10.0 | Niche use case (software demos) |
| 52 | CLI Tool | 2 | 2 | 2 | 3 | 10.5 | Headless Remotion rendering + CLI wrapper. Depends on API (#27) |
| 53 | Document/PDF-to-Video | 3 | 2 | 2 | 3 | 13.5 | PDF parsing + content extraction + orchestrator |

### Specialized Modes

| # | Feature | Need | Ease | Completes | Unlocks | Score | Notes |
|---|---------|:----:|:----:|:---------:|:-------:|:-----:|-------|
| 34 | Live Avatar Streaming | 2 | 1 | 2 | 4 | 11.0 | Requires real-time rendering pipeline (<100ms), WebRTC, webcam input |
| 55 | Persistent Character Identity Across Scenes | 4 | 3 | 5 | 3 | 22.0 | Saved character stores are most of this. Need cross-scene binding |
| 56 | PowerPoint Import | 3 | 2 | 2 | 3 | 13.5 | Parse PPTX. Map slides to scenes |
| 59 | Whiteboard Animation Mode | 3 | 2 | 2 | 2 | 12.0 | SVG stroke animation + hand overlay + drawing reveal |

---

## Related

- [[feature-list]] — Complete list of all 167 features (rankings cover top 60)
- [[research]] — Competitive analysis informing need/urgency scores
- [[PROGRESS]] — What's been built and what's pending
- [[phase-1]] — T1 implementation: export & rendering
- [[phase-2]] — T1 implementation: animation engine
- [[phase-3]] — T1 implementation: audio & voice
- [[phase-4]] — T2 implementation: transcription
- [[phase-5]] — T2/T3 implementation: character & content intelligence
- [[phase-6]] — T3 implementation: advanced editing
- [[phase-7]] — T2 implementation: professional output
- [[phase-8]] — T3 implementation: content input pipelines
- [[phase-9]] — T2/T3 implementation: developer platform
- [[phase-10]] — T4 implementation: future horizons
