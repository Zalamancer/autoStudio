# Services (subdirectories)

## src/services/effects/ (~150 files)
Visual effects library. Each effect exports a cache instance, presets, `process()`, and `cacheKey()`.
- **effectDispatcher.ts** — Routes to correct effect by type
  - `getEffectFromCache(src, effect, seed?): string | null`
  - `preCacheEffect(sources, effect): Promise<void>`
  - `processEffectOverlay(source, output, effect, seed?): boolean`
  - `isEffectEnabled(effect): boolean`
- Individual effects: glitch, smoke, rain, noise grain, woodcut, cel-shade, neon, watercolor, etc.

## src/services/orchestrator/
AI clip generation pipeline (24 steps).
- **planGenerator.ts** — `generateClipPlan(prompt, context): Promise<{plan, tokenUsage}>`
- **planBuilder.ts** — `buildPlanPrompt(...)` — 1800+ line Gemini prompt builder
- **stepBuilder.ts** — `buildStepsFromPlan(plan, settings): OrchestratorStep[]`
- **stepExecutors.ts** — `getStepExecutor(stepType): StepRunner`
- **chatRefiner.ts** — `refineClipPlan(message, plan, history): Promise<ChatRefineResult>`
- **storyboardGenerator.ts** — `generateStoryboardFromPlan(plan): StoryboardScene[]`
- **constants.ts** — Shared types, aspect ratio dimensions, text presets, z-indexes
- **steps/** — 20+ executors: setupCanvas, setupBackground, setupCharacters, generateVoices, setupDialogue, setupCamera, generateMusic, setupHTMLTemplates, setupMotionGraphics, generateSVGObjects, setupStockMedia, setupSoundEffects, syncToBeat, setupRetentionHooks, autoAnimateElements, setupCaptions, generateThumbnail, finalizeTimeline, qualityGate

## src/services/qualityAssurance/
Quality scoring and gating system.
- `generateQAReport(input, threshold?): QAReport` — Visual/audio/content/platform scoring with A+ through F grades
- `evaluateQualityGate(input, config): QualityGateResult` — Pass/fail decision
- `extractQAInputFromStores(): QAInput` — Aggregate metrics from stores
- `autoFixAndRecheck(...): AutoFixResult`

## src/services/nleExport/
NLE timeline interchange.
- `exportFCPXML(): Promise<Blob>` — FCP XML v1.9
- `exportEDL(): Promise<Blob>` — CMX 3600 EDL
- `exportOTIO(): Promise<Blob>` — OpenTimelineIO
- `exportWithAssets(format): Promise<Blob>` — ZIP bundle

## src/services/collaboration/
Real-time collaboration via WebSocket CRDT.
- `class CollabClient` — connect, disconnect, sendOperation, updatePresence, onMessage, onPresenceChange

## src/services/copilot/
AI copilot for natural language editing.
- `callCopilot(message, history): Promise<CopilotGeminiResponse>`
- `buildCopilotContext(): CopilotContext`
- `getCopilotSuggestions(): CopilotSuggestion[]`
- `ACTION_REGISTRY` — 40+ actions with safety classification

## src/services/manim/
Manim math animation pipeline (5 agents).
- `runManimPipeline(settings): Promise<void>` — plan → decompose → code → render → narrate
- **agents/scriptPlanner.ts** — `planScript(settings): Promise<TopicScript>`
- **agents/sceneDecomposer.ts** — `decomposeScenes(script, settings): Promise<SceneSpec[]>`
- **agents/narrator.ts** — `narrateAllScenes(specs, voiceId?): Promise<NarrationResult[]>`

## src/services/motionDesign/
Professional motion design: color harmony, typography animation, visual flow, timing.
- `generatePalette(strategy, baseColor, count?): ColorPalette`
- `paletteFromMood(mood): ColorPalette`
- `splitText(text, mode): string[]`
- `computeFlowTiming(sequence): FlowTransition[]`
- `extractPauses(script): DialoguePause[]`

## src/services/orchestrator/steps/ (Image Story)

| File | Function | Purpose |
|------|----------|---------|
| `steps/classifyImageStoryWords.ts` | `executeClassifyImageStoryWords(plan, ctx)` | Gemini Flash word classification (noun/verb/filler), populates plan.dialogue for TTS |
| `steps/searchFreepikAssets.ts` | `executeSearchFreepikAssets(plan, ctx)` | Maps TTS word timestamps, parallel Freepik search with fallback chain |
| `steps/composeImageStoryScenes.ts` | `executeComposeImageStoryScenes(plan, ctx)` | Zone-based layout, entry/verb keyframes synced to word timing |
| `steps/setupFillerTypography.ts` | `executeSetupFillerTypography(plan, ctx)` | Kinetic text overlays for filler words with style-matched templates |

## src/services/freepik/

| File | Function | Purpose |
|------|----------|---------|
| `freepik/freepikService.ts` | `searchFreepik(request)` | Freepik API client via server proxy |
| `freepik/freepikService.ts` | `searchWithFallback(term, type, style)` | 3-tier fallback: styled → unstyled → simplified |
| `freepik/freepikService.ts` | `getSearchTerm(base, type)` | Query construction for background/element/character |

---

