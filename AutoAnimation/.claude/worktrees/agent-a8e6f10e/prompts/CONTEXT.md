# prompts/ Workspace

System prompts for ProAnimate's AI orchestrator. These files define how the AI director thinks about video creation and how the orchestrator executes plans.

## Files

| File | Purpose | Size |
|------|---------|------|
| [[orchestrator-creative]] | Creative prompt for the AI Director. Describes platform capabilities, content strategy, and how to produce a `ClipPlan` JSON from a content brief. | ~15KB |
| [[orchestrator-technical]] | Technical execution reference. Maps every `ClipPlan` field to specific store mutations and orchestrator steps. The definitive spec for how plans become videos. | ~14KB |

## How they're used

1. User provides a content brief (text prompt describing the video they want)
2. The orchestrator sends `orchestrator-creative.md` as the system prompt to Gemini 2.5 Flash
3. Gemini produces a structured `ClipPlan` JSON following the creative prompt's schema
4. The orchestrator service (`src/services/orchestrator/`) executes the plan step-by-step
5. `orchestrator-technical.md` is the reference for how each plan field maps to store actions

The creative prompt is sent to the AI at runtime. The technical prompt is a development reference (not sent to AI).

## Creative prompt covers

- All platform capabilities: 2D/3D/rigged characters, voice generation, motion graphics, SVG assets, HTML templates, stock media, effects, camera, captions
- Content strategy guidance: hook patterns, pacing, emotional arcs, retention techniques
- ClipPlan JSON schema: canvas settings, background, characters, dialogue lines, text overlays, motion graphics, shapes, camera keyframes, B-roll, sound effects, music
- Character matching rules: how to match saved characters by name, when to generate new ones
- Aspect ratio and duration constraints per platform (TikTok, Shorts, Reels)

## Technical prompt covers

- All 27 orchestrator steps in execution order
- Per-step: which stores are written, what plan fields are consumed, exact logic
- Dimension mapping tables (aspect ratio to pixel dimensions)
- Voice generation flow (ElevenLabs API -> phoneme alignment -> viseme mapping)
- SVG generation flow (Gemini prompt -> SVG code -> canvas placement)
- HTML template matching and data binding

## Editing these files

Changes to these prompts directly affect generated video quality. The creative prompt shapes what the AI plans; the technical prompt must match what the orchestrator code actually does. If orchestrator steps change in code, update `orchestrator-technical.md` to match.
