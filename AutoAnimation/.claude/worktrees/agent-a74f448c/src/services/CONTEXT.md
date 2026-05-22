# src/services/ Workspace

Client-side business logic for ProAnimate. 289 service files organized as pure logic modules that connect AI providers, stores, and the server API. Services never render UI -- they compute, transform, and coordinate.

## Structure

```
services/
  orchestrator/       # Clip generation pipeline (27 steps, plan builder, step executors)
    steps/            # Individual step executors (27 files: setupCanvas, generateVoices, etc.)
  manim/              # Manim video generation (5-agent system, orchestrator, explain overlay)
    agents/           # Manim generation agents
  effects/            # 120+ visual effects (blur, glitch, halftone, fire, lightning, etc.)
  collaboration/      # Real-time collab (client sync, collab manager)
  copilot/            # AI copilot (context builder, action executor, suggestions)
  qualityAssurance/   # Pre-publish QA checks (visual, audio, compliance, auto-fix)
  __tests__/          # Unit tests (10 test files)
  *.ts                # ~270 individual service modules
```

## Service categories

| Category | Examples | What they do |
|----------|----------|-------------|
| AI generation | `autonomousCharacterGen`, `aiAnimation`, `componentGenerator`, `svgArtGenerator` | Call AI APIs (Gemini, Claude, Meshy) to generate assets |
| Voice & audio | `speechToViseme`, `voiceEffects`, `beatDetection`, `audioDuckingService` | TTS, lip sync mapping, audio processing |
| Video processing | `videoExport`, `videoSlicer`, `transparentExport`, `tiledRenderer` | Encoding, slicing, export pipelines |
| Canvas & rendering | `canvas2dRenderer`, `compositionBuilder`, `compositionLayers` | Build render compositions from store state |
| Content intelligence | `viralityScorer`, `trendSpotter`, `contentScoringService`, `clipRanker` | Analyze and score content |
| Asset management | `characterDB`, `avatarDB`, `character3dDB`, `spriteResolver` | Supabase CRUD for characters, sprites, assets |
| Template & style | `textAnimationPresets`, `cinematicTextPresets`, `templateService` | Preset definitions and template configuration |
| Social & publishing | `socialPublish`, `autoPublishService`, `socialIntegration` | Social media publishing workflows |

## Orchestrator pipeline

The orchestrator (`orchestrator/index.ts`) converts a `ClipPlan` JSON into store mutations across 27 steps:

`setup-canvas` -> `setup-background` -> `setup-characters` -> `generate-voices` -> `setup-dialogue` -> `setup-captions` -> `setup-text-overlays` -> `setup-html-templates` -> `setup-motion-graphics` -> `setup-shapes` -> `setup-smart-broll` -> `setup-stock-media` -> `generate-svg-objects` -> `auto-animate-elements` -> `setup-camera` -> `setup-auto-camera` -> `setup-character-motion` -> `setup-gestures` -> `setup-retention-hooks` -> `setup-sound-effects` -> `generate-music` -> `sync-to-beat` -> `generate-thumbnail` -> `finalize-timeline` -> `refine-plan` -> `quality-gate`

Each step is a file in `orchestrator/steps/`. Each reads from the plan and writes to Zustand stores.

## Patterns

- Services are pure functions or stateless modules. State lives in stores, not services.
- AI services call the server via `fetch('/api/...')` -- never call external APIs directly from the client.
- Services import stores with `useXStore.getState()` (outside React) to read/write state.
- The `effects/` directory has one file per effect, all dispatched via `effectDispatcher.ts`.
- Supabase client is initialized in `supabase.ts` and shared across DB services.

## Manim subsystem

5-agent pipeline for generating educational math/science videos:
- `manimOrchestrator.ts` coordinates the agents
- `manimCodeGenerator.ts` generates Manim Python code via Claude
- `explainService.ts` handles pause-and-explain overlays
- Server-side rendering via `server/services/manimRenderer.ts` + Python

## Testing

Tests in `__tests__/` cover critical logic: credit gating, lip sync, emotion mapping, interpolation, timeline lookup, template parsing.
