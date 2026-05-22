# AI Director Quality Audit

**Date:** 2026-03-27
**Status:** P1-P10 FIXED, P11 enrichment added, P12-P14 identified (layer architecture + selection logic)
**Scope:** Clip generation pipeline quality issues — from plan generation through QA gate

---

## Summary

The AI Director has a sophisticated QA system (visual overlap, audio balance, content completeness, platform compliance) but the orchestrator pipeline **never actually runs it**. The quality-gate step only scores virality. Meanwhile, the QA input extractor feeds fake audio data and confuses TTS voices with background music. The entire quality feedback loop is broken.

---

## Problems

### P1 — CRITICAL: Quality Gate Step Doesn't Run QA
**File:** `src/services/orchestrator/steps/qualityGate.ts`

The step only calls `scoreClipVirality()`. The full QA system (`evaluateQualityGate()` in `qualityAssurance/qualityGate.ts`) with visual overlap detection, audio balance checks, content completeness, and platform compliance — **never executes**. It's dead code in the orchestrator context.

**Root cause:** The quality-gate step was implemented as a virality scorer, not a quality enforcer. The QA system was built separately and never wired into the orchestrator pipeline.

**Fix:** Run `evaluateQualityGate()` inside the quality-gate step. Surface the QA report to the orchestrator store so the completion phase can display it.

### P2 — CRITICAL: Fake Audio Metrics
**File:** `src/services/qualityAssurance/qualityGate.ts:348-349`

```typescript
avgAmplitude: 0.5, // hardcoded constant
peakAmplitude: 0.8, // hardcoded constant
```

Even if QA ran, audio checks (silence detection, clipping, audibility) operate on made-up numbers.

**Root cause:** Comment says "We can't accurately measure without analyzing the audio buffer." The audio buffer is available via the media store blobs, but nobody wrote the extraction code.

**Fix:** Analyze actual audio buffers from generated voices using Web Audio API's `decodeAudioData`. Extract real amplitude metrics per dialogue segment.

### P3 — CRITICAL: Music Detection Checks TTS Voices
**File:** `src/services/qualityAssurance/qualityGate.ts:373, 395-397`

```typescript
hasMusic: (voice.generatedVoices || []).length > 0,  // voices != music
music: voice.generatedVoices?.length > 0 ? {...} : null,
```

Music is stored in `useMediaStore` as an audio canvas item (category: 'audio', id starts with 'media-music-'), but QA checks `useVoiceStore.generatedVoices`.

**Root cause:** Copy-paste error or confusion between voice store and media store during initial QA implementation.

**Fix:** Check `useMediaStore.canvasItems` for audio-category items with music-prefixed IDs. Also check `useAudioDesignStore` for beat analysis presence.

### P4 — HIGH: HTML Templates Not Counted as Background
**File:** `src/services/qualityAssurance/qualityGate.ts:376`

```typescript
hasBackground: (animations.animations || []).length > 0 || !!canvas.backgroundColor,
```

HTML templates are the PRIMARY visual layer (the prompt says "ALWAYS include at least 1"), but content completeness doesn't recognize them as a background.

**Root cause:** QA was written before HTML templates became the primary visual layer. The background check only knows about Lottie animations and canvas colors.

**Fix:** Include `useHTMLTemplateLayerStore.templates.length > 0` in the hasBackground check.

### P5 — HIGH: Plan-Specified Font Size Ignored
**File:** `src/services/orchestrator/steps/setupTextOverlays.ts:51`

```typescript
fontSize: defaults.fontSize || 36,
```

Always uses preset defaults. Gemini's font size suggestions are silently dropped.

**Root cause:** The overlay spec from the plan includes fontSize but the executor never reads it — it only reads `overlay.content`, `overlay.color`, `overlay.fontFamily`, and preset positioning. fontSize is overridden by preset defaults.

**Fix:** Use `overlay.fontSize || defaults.fontSize || 36` to prefer plan-specified values.

### P6 — HIGH: Caption/Lip-Sync Timeline Conditionally Lost
**File:** `src/services/orchestrator/steps/setupDialogue.ts:163`

```typescript
if (existingActiveVoiceId) { // only pushes if voice was already selected
```

If no voice ID was active before orchestration, combined viseme/word/sentence/emotion timelines are never pushed to the voice store — captions and lip sync break for the entire clip.

**Root cause:** The code assumes `generateVoices` step already set an activeVoiceId. But if the voice generation used a different code path or the store wasn't initialized, this guard silently swallows all timeline data.

**Fix:** Remove the conditional or ensure activeVoiceId is always set during generateVoices. The combined timelines should be pushed unconditionally since they represent the orchestrator's authoritative timeline.

### P7 — MEDIUM: Sound Effects Invisible to QA
**File:** `src/services/qualityAssurance/qualityGate.ts:399`

```typescript
soundEffects: [],  // always empty array
```

Sound effects generated by `setup-sound-effects` step are stored in `useMediaStore` but never extracted for QA input.

**Fix:** Extract sound effect audio segments from media store items with SFX-prefixed IDs.

### P8 — MEDIUM: Error Frames Never Tracked
**File:** `src/services/qualityAssurance/qualityGate.ts:378`

```typescript
errorFrames: [],  // always empty
```

No mechanism exists to report rendering errors per-frame back to the QA system.

**Fix (implemented):** Three-layer error isolation:
1. `renderFrame()` wraps each layer draw in `safeDrawSync`/`safeDrawAsync` — a bad layer doesn't prevent other layers from rendering
2. Export loop catches per-frame render errors, records the frame index, and continues (previously: one bad frame aborted entire export)
3. `ExportProgress.errorFrames` reports which frames had errors; >20% error rate aborts as fatal

### P9 — MEDIUM: QA Thresholds Too Lenient
**File:** `src/services/qualityAssurance/qualityGate.ts:228-238`

```typescript
minimumScore: 60,
categoryMinScores: { content: 50, audio: 40, visual: 40 },
```

A clip with D/F grade visual quality passes the gate.

**Fix:** Raise to `minimumScore: 70`, `content: 65`, `audio: 55`, `visual: 55`.

### P10 — LOW: Quality Gate is Non-Blocking by Design
Even if all above were fixed, the gate "never blocks clip completion — it always succeeds." Quality issues are logged but never prevent output.

**Fix:** Store the QA report in the orchestrator store. Surface warnings/failures in the completion phase UI. Optionally add a "block on critical failures" mode.

---

## Lessons Learned

1. **QA systems rot fast when disconnected from the pipeline.** The QA code was well-designed but never wired in. Without integration tests that assert "QA runs during orchestration," the disconnect went unnoticed.

2. **Hardcoded test data in production is a silent killer.** The `avgAmplitude: 0.5` hack was a TODO that became permanent. If a metric can't be measured yet, the check should be `skipped`, not faked.

3. **Store boundary confusion causes data bugs.** Music in `useMediaStore`, voices in `useVoiceStore`, audio design in `useAudioDesignStore` — the QA extractor checked the wrong store. A single `getAudioState()` facade would prevent this class of bugs.

4. **Conditional guards on "should always exist" data are dangerous.** The `if (existingActiveVoiceId)` guard silently swallowed timeline data instead of failing loudly.

5. **Preset defaults should be fallbacks, not overrides.** Text overlay fontSize used `defaults.fontSize || 36` when it should have been `plan.fontSize || defaults.fontSize || 36`. The AI's creative decisions were silently discarded.

---

## Implementation Order

1. P6 — Fix timeline push (immediate lip sync / caption fix)
2. P1 — Wire real QA into quality-gate step
3. P3 — Fix music detection
4. P4 — Fix background detection for HTML templates
5. P5 — Respect plan-specified font size
6. P9 — Raise QA thresholds
7. P10 — Surface QA report in completion UI
8. P7 — Wire sound effects into QA
9. P2 — Real audio amplitude analysis
10. P8 — Error frame tracking

---

## Phase 2: Layer Architecture & Selection Logic

Discovered during live testing of clip plan generation (2026-03-27).

### Visual Layer Hierarchy (Correct Mental Model)

| Layer | Purpose | Source | z-index |
|-------|---------|--------|---------|
| **Background** | Real scene image/video (office, park, classroom) | Pixabay search or NanoBanana2 generation | 1 |
| **HTML Templates** | Interactive themed visuals (synapse, world map, charts, social mockups) | `BUILTIN_TEMPLATES` library (~100+) | 1 |
| **React Motion Graphics** | B-roll text effects / kinetic typography | `motionGraphics/` registry (~90 templates). NOT backgrounds. | 2 |
| **Stock Media** | Cutaway B-roll, overlays, accents | Pixabay search | 2-7 |
| **Characters** | 2D sprites, rigged, 3D models | Saved library or NanoBanana2 generation | 7 |
| **Text Overlays** | Title, subtitle, CTA, quote | Plan-driven | 8 |
| **Lottie Overlays** | Ambient particle effects (stars, confetti, sparkles) | `sampleAnimations.ts` overlays | 9 |
| **Captions** | Word-by-word, karaoke, animated | Voice timeline-driven | 10 |

### P12 — CRITICAL: Background System Has No "Image" Type

**Current state:** `plan.background.type` accepts only `"lottie"` or `"svg-generate"`. The entire "background" library is 2 programmatically-generated particle animations (Wave Loop, Ripple Loading) — abstract effects, not real scene backgrounds.

**Root cause:** The background system was built before HTML templates and Pixabay were added. It was the only visual layer originally. Now it's vestigial but Gemini still defaults to it.

**What backgrounds should be:** Real images/videos — office, park, classroom, etc. Sourced from:
1. Pixabay stock search (most common)
2. NanoBanana2 AI generation (custom scenes)
3. Solid color fill when HTML template covers the full clip

**Fix needed:**
1. Add `"image"` and `"none"` as background types in `ClipPlan` schema
2. `"image"` routes to Pixabay search with `plan.background.imageQuery`
3. `"none"` = solid dark fill (when HTML template covers 0-100%)
4. Reclassify wave/ripple Lottie as overlays, not backgrounds
5. Update Gemini prompt to understand background = real image
6. Enrichment layer: auto-set `"none"` when full-coverage HTML template present

### P13 — HIGH: React Motion Graphics Templates Invisible to Gemini

**Current state:** The ~90 kinetic typography templates in `motionGraphics/` are never listed in the Gemini prompt. Gemini can't see or select them. Instead, motion graphics are AI-generated on-the-fly from mood analysis.

**What they are:** B-roll text effects — kinetic typography, animated word styling. NOT backgrounds. They're visual effects that enhance text presentation.

**Fix needed:**
1. Include motion graphics template list (id, name, tags, category) in the Gemini prompt
2. Add a `motionGraphicTemplateId` field to `ClipPlanMotionGraphic` type
3. Prefer pre-built templates over on-the-fly generation (faster, more consistent)
4. Use template ratings to rank selection (see P14)

### P14 — MEDIUM: Template Ratings Not Used in Selection

**Current state:** Templates have a 5-metric rating system (impact, finish, flow, versatility, appeal) stored in `.template-ratings.json`. Ratings are used for batch improvement (analyze-improve skill) but NEVER fed to the Gemini prompt or used in selection scoring.

**Fix needed:**
1. Pass template ratings to Gemini alongside template list: `"tpl-synapse: 3.5★"`
2. In `setupHTMLTemplates.ts` fuzzy matcher: add rating bonus to score (e.g. +2 per star)
3. For motion graphics: prefer higher-rated templates when multiple match

---

## Lessons Learned (Phase 2)

6. **Layer naming shapes architecture.** Calling particle effects "backgrounds" led to them being treated as backgrounds. A Wave Loop is not an office scene. Name things for what they ARE, not where they render.

7. **LLMs can only select from what they can see.** 90 templates invisible to the prompt = 90 templates that never get used. The motion graphics library was built for manual use but never wired into the AI Director.

8. **Ratings are useless if they don't reach the decision point.** A sophisticated 5-metric rating system was built, but the decision maker (Gemini prompt) never receives the data. Rating → storage → batch improvement is one loop; rating → selection → better clips is a different loop that was never closed.

9. **Post-generation enrichment catches LLM gaps deterministically.** Gemini follows prompt rules ~60-70% of the time. Code guarantees 100%. Use prompts for creative decisions, code for structural guarantees.
