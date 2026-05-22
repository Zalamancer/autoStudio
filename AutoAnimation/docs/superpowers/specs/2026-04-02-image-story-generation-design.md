# Image Story Generation — Design Spec

**Date:** 2026-04-02
**Status:** Approved (Rev 2 — post-review fixes)
**Mode:** New orchestrator mode (`imageStory`)

## Overview

A new orchestrator mode that transforms narrative text into visual storytelling using Freepik image search. The AI classifies words as nouns (trigger image search), action verbs (drive animations on linked nouns), or filler (rendered as kinetic typography). TTS voiceover from ElevenLabs drives all timing via phoneme alignment.

**Example:** "I want you to imagine you are getting an icecream, but your dad catches you"
- "icecream" → PNG search, appears on canvas
- "getting" → reach animation on icecream image
- "dad" → PNG search, walks into scene
- "catches" → grab animation on dad image
- "I want you to imagine you are" / "but your" / "you" → kinetic text overlays

## Canvas Layer Model

Three layers compose simultaneously during playback:

1. **Scene Layer (D)** — AI groups the narrative into scenes, each with a background image (photo or illustration). Scene transitions crossfade, slide, cut, or zoom based on connector words.
2. **Element Layer (C)** — Noun PNG images accumulate within a scene. Max 3 simultaneous elements; oldest exits when a 4th arrives. New elements enter with spring easing; existing elements reposition instantly (no runtime spring solver — uses keyframe-based spring interpolation via `spring.ts`).
3. **Filler Text Layer (B)** — Non-image words render as kinetic typography over/between the visual elements. Positioned in top/bottom safe zones to avoid image overlap.

TTS phoneme alignment from ElevenLabs drives all three layers — images enter 200ms before their noun's timestamp, verb animations trigger at the verb's timestamp, and filler text fades within its word group's TTS window.

**TTS failure guard:** If `generateVoices` fails or returns no phoneme data, the pipeline aborts with user-facing error: "Voice generation is required for Image Story mode." No silent fallback — timing data is mandatory.

## Data Model

### Style Type

```typescript
type ImageStoryStyle = 'Cartoon' | 'Realistic' | 'Minimalist' | 'Watercolor' | 'Flat' | '3D Render';
```

### Word Classification

```typescript
type WordRole = 'image_noun' | 'action_verb' | 'filler';

interface ImageStoryWord {
  text: string;              // May be multi-word phrase (e.g., "ice cream")
  role: WordRole;
  searchTerm?: string;       // Freepik query for nouns
  assetType?: 'photo' | 'png' | 'illustration' | 'vector';
  linkedNoun?: string;       // For verbs: which noun this verb animates
  animation?: string;        // For verbs: semantic animation name
}
```

### Scene & Plan Structure

```typescript
interface ImageStoryScene {
  id: string;
  background: {
    searchTerm: string;
    assetType: 'photo' | 'illustration';
  };
  words: ImageStoryWord[];
  elements: string[];        // IDs of nouns that accumulate in this scene
  transition: 'crossfade' | 'slide' | 'cut' | 'zoom';
}

interface ImageStoryPlan {
  mode: 'imageStory';
  style: ImageStoryStyle;
  scenes: ImageStoryScene[];
  ttsText: string;
}
```

### Integration with ClipPlan

`ImageStoryPlan` is stored as an optional field on the existing `ClipPlan` type:

```typescript
// In src/types/orchestrator.ts — extend ClipPlan:
interface ClipPlan {
  // ... existing fields ...
  imageStory?: ImageStoryPlan;  // Present when mode === 'imageStory'
}
```

The `classifyImageStoryWords` step populates `plan.imageStory` and also creates a single `ClipPlanDialogueLine` entry in `plan.dialogue` so that the reused `generateVoices` step can produce TTS:

```typescript
// classifyImageStoryWords creates this dialogue entry:
plan.dialogue = [{
  characterName: 'narrator',
  text: plan.imageStory.ttsText,
  voiceId: selectedVoiceId,     // From user's voice picker selection
  emotion: 'neutral'
}];
```

This ensures `generateVoices` finds `plan.dialogue[0]` and generates TTS + phoneme alignment as usual.

### Word Timing Bridge (ExecutionContext)

Downstream steps need word-level timestamps from TTS. A new field on `ExecutionContext`:

```typescript
// In src/types/orchestrator.ts — extend ExecutionContext:
interface ExecutionContext {
  // ... existing fields ...
  imageStoryWordTimings?: ImageStoryWordTiming[];
}

interface ImageStoryWordTiming {
  word: ImageStoryWord;
  startMs: number;          // From ElevenLabs phoneme alignment
  endMs: number;
  startFrame: number;       // Computed from startMs + fps
  endFrame: number;
}
```

Populated by `searchFreepikAssets` (which runs after `generateVoices`) by mapping ElevenLabs word timestamps onto the classified `ImageStoryWord` list.

### Gemini Prompt Contract for Classification

The `classifyImageStoryWords` step sends the full text to Gemini Flash with a structured JSON schema constraint:

- Input: the full narrative text as a single string (not pre-tokenized)
- Gemini handles tokenization and identifies multi-word noun phrases (e.g., "ice cream" → one `image_noun` with `text: "ice cream"`)
- Output: JSON array conforming to `ImageStoryWord[]` schema, wrapped in `ImageStoryScene[]`
- The prompt includes 3 few-shot examples covering: simple sentences, compound nouns, and sentences with no image-worthy words
- **Validation:** If Gemini returns non-conforming JSON, retry once with a stricter prompt. If still invalid, abort with user-facing error.

### Classification Example

| Word | Role | Details |
|------|------|---------|
| I want you to imagine you are | `filler` | Kinetic text overlay |
| getting | `action_verb` | linkedNoun: "icecream", animation: "reach" |
| ice cream | `image_noun` | searchTerm: "ice cream cone", assetType: "png" |
| but your | `filler` | Kinetic text |
| dad | `image_noun` | searchTerm: "father cartoon", assetType: "png" |
| catches | `action_verb` | linkedNoun: "dad", animation: "grab" |
| you | `filler` | Kinetic text |

## Pipeline Steps

### StepType Extension

Four new values added to the `StepType` union in `src/types/orchestrator.ts`:

```typescript
type StepType =
  | /* ...existing values... */
  | 'classifyImageStoryWords'
  | 'searchFreepikAssets'
  | 'composeImageStoryScenes'
  | 'setupFillerTypography';
```

And registered in `src/services/orchestrator/stepExecutors.ts`:

```typescript
const stepExecutors: Record<StepType, StepRunner> = {
  // ...existing executors...
  classifyImageStoryWords: executeClassifyImageStoryWords,
  searchFreepikAssets: executeSearchFreepikAssets,
  composeImageStoryScenes: executeComposeImageStoryScenes,
  setupFillerTypography: executeSetupFillerTypography,
};
```

### Execution Order

```
setupCanvas
  -> classifyImageStoryWords      [NEW] — also populates plan.dialogue
  -> generateVoices                      — reads plan.dialogue, produces phoneme data
  -> searchFreepikAssets           [NEW] — maps TTS timestamps to words, searches Freepik
  -> composeImageStoryScenes       [NEW] — layout + keyframes synced to word timing
  -> setupFillerTypography         [NEW] — kinetic text for filler words + animation
  -> setupCaptions
  -> generateThumbnail
  -> qualityGate
  -> finalizeTimeline
```

### Reused Steps (no changes needed)

- `setupCanvas` — Canvas dimensions, background color
- `generateVoices` — ElevenLabs TTS + phoneme alignment (reads `plan.dialogue` populated by `classifyImageStoryWords`)
- `setupCaptions` — Optional subtitles
- `generateThumbnail` — Thumbnail for export
- `qualityGate` — QA scoring
- `finalizeTimeline` — Timeline assembly

### Skipped Steps (character-specific or handled by new steps)

- `generateCharacters`, `setupCharacters`, `setupDialogue`, `setupGestures`, `setupCharacterMotion`, `setupSmartBroll` — character-specific, not applicable
- `setupTextOverlays`, `setupMotionGraphics` — filler text rendering is handled entirely by the new `setupFillerTypography` step, which combines text overlay creation and kinetic template selection in one step
- `autoAnimateElements` — removed to prevent double-animation. `composeImageStoryScenes` sets all entry/exit/verb keyframes directly on image elements. `setupFillerTypography` handles filler text animations. Running `autoAnimateElements` on top would apply a second set of keyframes to items that already have them.
- `refinePlan` — skipped for imageStory. The classification step uses a constrained JSON schema with few-shot examples, making the output predictable enough to execute directly. The chatRefiner is designed for the more open-ended talking-character plan structure. If classification quality proves insufficient in practice, a `refineImageStoryPlan` step can be added later.

### New Steps

**1. `classifyImageStoryWords`**
- Input: user text + style from `plan.imageStory`
- Gemini Flash call classifies every word/phrase as `image_noun`, `action_verb`, or `filler`
- Groups words into scenes based on narrative context shifts
- Populates `plan.imageStory.scenes` with classified words
- Creates a single `ClipPlanDialogueLine` in `plan.dialogue` for TTS
- Outputs updated `ClipPlan` with `imageStory` field fully populated

**2. `searchFreepikAssets`**
- Input: all `image_noun` entries + scene backgrounds from `plan.imageStory`
- Maps ElevenLabs word timestamps from `ctx.generatedVoices` onto classified words → writes `ctx.imageStoryWordTimings`
- Parallel Freepik API calls for each search term
- Filters by `assetType` and style
- Fallback chain: drop style modifier → simplify search term → skip and use filler text
- Stores fetched assets in `useImageStoryStore`

**3. `composeImageStoryScenes`**
- Input: fetched assets + `ctx.imageStoryWordTimings`
- Places background images per scene via `useMediaStore.addToCanvasWithTiming`
- Positions noun PNGs on canvas with zone-based layout
- Maps `action_verb` animations to their linked noun images
- Sets entry/exit keyframes synced to word timestamps directly (no reliance on `autoAnimateElements`)
- Marks all placed items with `source: 'imageStory'` metadata

**4. `setupFillerTypography`**
- Input: filler words + `ctx.imageStoryWordTimings`
- Selects kinetic typography template matching the chosen style
- Creates text overlay clips for each filler segment with entry/exit animations
- Positions text in safe zones (top/bottom 20%)

## Freepik API Integration

### API Product & Authentication

- **API:** Freepik Resources API (REST, `api.freepik.com/v1/resources`)
- **Authentication:** API key via `x-freepik-api-key` header
- **Key storage:** `FREEPIK_API_KEY` environment variable, accessed server-side only
- **Rate limits:** Depends on subscription tier:
  - Free: 100 requests/day
  - Premium: 1,000 requests/day
  - Enterprise: custom limits
- **Rate limit handling:** On 429 response, exponential backoff with 3 retries (1s, 2s, 4s). If exhausted, fall back to filler text for remaining nouns.
- **Licensing:** Freepik assets require attribution on free tier. Premium/Enterprise tiers allow commercial use without attribution. The generated clip metadata should include Freepik asset IDs for attribution tracking. **Implementation prerequisite:** Confirm Freepik subscription tier and licensing terms before shipping to users.

### Server Route

New route: `POST /api/proxy/freepik/search`

```typescript
interface FreepikSearchRequest {
  query: string;
  assetType: 'photo' | 'png' | 'illustration' | 'vector';
  style?: ImageStoryStyle;
  limit?: number;          // Default 5
  transparency?: boolean;  // Prefer transparent PNGs
}

interface FreepikAsset {
  id: string;
  url: string;
  thumbnailUrl: string;
  width: number;
  height: number;
  format: 'jpg' | 'png' | 'svg' | 'psd';
  relevanceScore: number;
}
```

**Transparency handling:** Freepik API does not expose a `hasTransparency` flag. Strategy:
1. When `transparency: true`, filter results to `format: 'png'` only (PNG format is a proxy for transparency)
2. After download, server-side alpha channel check via sharp library (`sharp(buffer).stats()` → check if alpha channel has non-255 values)
3. If a PNG has no actual transparency, it is demoted in ranking but not rejected (the compositor can still use it with a background)

### Search Strategy

| Type | Query Construction | Asset Filter |
|------|-------------------|--------------|
| Scene background | `"{searchTerm} background scene"` + style | `photo` or `illustration`, no transparency filter |
| Noun element | `"{searchTerm}"` + style + `"isolated"` | `format: 'png'`, transparency preferred |
| Character noun | `"{searchTerm} character"` + style | `format: 'png'` or `illustration`, transparency preferred |

### Fallback Chain

1. Drop the style modifier, retry
2. Simplify search term (e.g., "father cartoon character" → "dad")
3. If still empty, skip image — filler text covers the word instead

## Animation Mapping

### Tier 1: Semantic Verb Map

| Verb Category | Example Verbs | Animation | Engine Module |
|---------------|--------------|-----------|---------------|
| Movement | walk, run, fly, drive | Horizontal path + bounce | `path.ts` + `spring.ts` |
| Grab/Contact | catch, grab, hold, touch | Scale pulse + position snap | `spring.ts` + `attention.ts` |
| Appear | arrive, come, enter, show | Entrance preset (slide/pop) | `presets.ts` |
| Disappear | leave, vanish, hide, go | Exit preset (fade/shrink) | `presets.ts` |
| Impact | hit, crash, slam, break | Shake + particle burst | `attention.ts` + `particles.ts` |
| Emotion | love, hate, fear, cry | Attention idle (heartbeat, shake) | `attention.ts` |
| Growth | grow, expand, rise, build | Scale up with elastic easing | `spring.ts` + `easing.ts` |
| Fall | drop, fall, sink, collapse | Vertical path + bounce | `path.ts` + `spring.ts` |

### Tier 2: Template Defaults (no verb linked)

| Image Type | Default Entry | Default Attention | Default Exit |
|------------|--------------|-------------------|-------------|
| Scene BG | Crossfade (500ms) | None (static) | Crossfade out |
| Character PNG | Slide in from edge | Gentle bob/float | Slide out |
| Object PNG | Pop + elastic bounce | Subtle pulse | Shrink out |

### Timing Rules

- Image entry: 200ms before noun word's TTS timestamp
- Verb animation: triggers at verb's TTS timestamp
- Image persistence: until scene changes or max 3 elements exceeded
- Filler text: fades in/out within word group's TTS window

## Canvas Composition

### Layout Engine

```typescript
interface CanvasRegion {
  zone: 'background' | 'center' | 'left' | 'right' | 'top' | 'bottom';
  x: number;
  y: number;
  width: number;
  height: number;
  zIndex: number;
}
```

### Placement Rules

| Element | Zone | Sizing | Z-Index |
|---------|------|--------|---------|
| Scene background | Full canvas | Cover, maintain aspect ratio | 0 |
| First noun PNG | Center | 40-60% canvas width, auto height | 1 |
| Second noun PNG | Left or right of first | 30-50% canvas width | 2 |
| Third+ noun PNG | Remaining space, AI picks | 25-40% canvas width | 3 |
| Filler text | Top 20% or bottom 20% | Auto-sized to text length | 5 |

### Accumulation Logic

- New nouns enter with spring easing (keyframe-based via `spring.ts`)
- Existing nouns reposition instantly to make room (new positions computed, set as keyframes at the entry frame)
- Max 3 simultaneous noun elements per scene
- 4th noun triggers exit of oldest element
- Scene transitions clear all elements and crossfade to new background

### Scene Transitions

| Transition | When Used | Implementation |
|------------|-----------|----------------|
| Crossfade | Default scene change | Opacity interpolation over 15 frames |
| Slide | Action-driven scene shift | Horizontal translate + fade |
| Cut | Abrupt narrative shift ("but suddenly...") | Instant swap |
| Zoom | Focusing into detail ("look closely at...") | Scale up from center |

## Rendering Layers

### PixiJS (Editor Preview)

New class: `PixiImageStoryLayer`
- Extends existing `PixiMediaLayer` pattern
- Instantiated in `PixiCanvas.tsx`, conditionally activated when `clipPlan.imageStory` is present
- Registered with `PixiRenderLoop` ticker on mount; unregistered on unmount or mode change
- Manages sprite pool for active noun images
- Listens to word timing from playback clock via `PixiRenderLoop` ticker
- On `image_noun` timestamp: load sprite from `PixiTextureCache`, apply entry animation
- On `action_verb` timestamp: find linked noun sprite, apply verb animation
- Filler text handled by existing `PixiTextOverlayLayer`
- Teardown: destroys all sprites and releases texture cache refs when layer unmounts

### Remotion (Export)

New component: `RemotionImageStoryLayer.tsx`
- Follows existing Remotion layer pattern (like `RemotionMediaLayer`)
- Props: scenes, assets, wordTimings, style, fps
- Per-frame: determine active scene, render background with crossfade, render active noun PNGs with interpolated animations
- Conditionally rendered in `VideoComposition.tsx` when `clipPlan.imageStory` is present
- Z-position: between background layer and caption overlay
- Compatible with existing `RemotionStyleFilter` for global effects

## UI

### Entry Point

New mode pill in the Create Clip orchestrator panel: `[Image Story]` alongside existing `[Talking Character]` and `[Math Animation]`.

### Input Form

- Text area: "Tell your story..."
- Style pills (mode pills, not filters): Cartoon, Realistic, Minimalist, Watercolor, Flat, 3D Render
- Voice picker: optional, reuses existing voice selection dropdown
- Generate button: "Generate Story"

### Style Mapping

| Style | Freepik Modifier | Kinetic Template Family | BG Treatment |
|-------|-----------------|------------------------|--------------|
| Cartoon | `cartoon`, `illustration` | Bouncy/elastic presets | Illustrated scenes |
| Realistic | `photo`, `stock` | Subtle fade/slide presets | Stock photography |
| Minimalist | `flat`, `minimal`, `icon` | Clean reveal presets | Solid color + subtle texture |
| Watercolor | `watercolor`, `painted` | Soft bloom presets | Painted textures |
| Flat | `flat design`, `2d` | Snap/pop presets | Flat color blocks |
| 3D Render | `3d render`, `isometric` | Smooth scale presets | 3D rendered scenes |

### Generation Progress

Reuses existing orchestrator progress UI:
1. "Analyzing your story..." (classifyImageStoryWords)
2. "Generating voiceover..." (generateVoices)
3. "Finding images..." (searchFreepikAssets)
4. "Composing scenes..." (composeImageStoryScenes)
5. "Adding text effects..." (setupFillerTypography)
6. "Finalizing..." (captions → QA)

### Post-Generation Editing

No new editing UI needed. Users edit via existing panels:
- Swap image: click noun image → right panel shows Freepik search
- Change animation: select element → animation dropdown in properties panel
- Adjust timing: drag/trim timeline clips
- Edit text: click filler text → text overlay panel
- Re-record voice: swap TTS voice in voice panel

## New Store

`useImageStoryStore.ts` — single Zustand store with Immer middleware:

```typescript
interface ImageStoryState {
  plan: ImageStoryPlan | null;
  assets: Record<string, FreepikAsset[]>;     // searchTerm → results
  selectedAssets: Record<string, string>;       // nounId → chosen asset URL
  style: ImageStoryStyle;
  isGenerating: boolean;
  currentStep: string;

  generatePlan: (text: string, style: ImageStoryStyle) => Promise<void>;
  searchAsset: (term: string, assetType: 'photo' | 'png' | 'illustration' | 'vector') => Promise<void>;
  swapAsset: (nounId: string, newAssetUrl: string) => void;
  reset: () => void;
}
```

## Required Changes to Existing Files

| File | Change |
|------|--------|
| `src/types/orchestrator.ts` | Add 4 new values to `StepType` union. Add `imageStory?: ImageStoryPlan` to `ClipPlan`. Add `imageStoryWordTimings?: ImageStoryWordTiming[]` to `ExecutionContext`. |
| `src/services/orchestrator/stepExecutors.ts` | Register 4 new step executors in the `stepExecutors` record. |
| `src/services/orchestrator/stepBuilder.ts` | Add `imageStory` mode branch that produces the correct step sequence (skipping character steps, using new steps). |
| `src/pixi/PixiCanvas.tsx` | Conditionally instantiate `PixiImageStoryLayer` when `clipPlan.imageStory` is present. |
| `src/remotion/VideoComposition.tsx` | Conditionally render `RemotionImageStoryLayer` when `clipPlan.imageStory` is present. |
| `server/routes/proxy.ts` (or `server/index.ts`) | Mount the new `/api/proxy/freepik` route. |
| `docs/codebase/03-services-subdirs.md` | Document new step executors and freepikService. |
| `docs/codebase/04-stores.md` | Document `useImageStoryStore`. |
| `docs/codebase/12-remotion.md` | Document `RemotionImageStoryLayer` and `PixiImageStoryLayer`. |
| `docs/codebase/15-server-utils.md` | Document Freepik proxy route. |

## New Files Summary

| File | Type | Purpose |
|------|------|---------|
| `src/services/orchestrator/steps/classifyImageStoryWords.ts` | Step executor | Gemini word classification + plan.dialogue population |
| `src/services/orchestrator/steps/searchFreepikAssets.ts` | Step executor | TTS timestamp mapping + Freepik parallel search |
| `src/services/orchestrator/steps/composeImageStoryScenes.ts` | Step executor | Scene composition + keyframe timing |
| `src/services/orchestrator/steps/setupFillerTypography.ts` | Step executor | Kinetic text for filler words + animation |
| `src/services/freepik/freepikService.ts` | Service | Freepik API client + transparency check |
| `src/stores/useImageStoryStore.ts` | Store | Image story state management |
| `src/pixi/PixiImageStoryLayer.ts` | PixiJS layer | Editor preview rendering |
| `src/remotion/RemotionImageStoryLayer.tsx` | Remotion layer | Export rendering |
| `src/types/imageStory.ts` | Types | All ImageStory interfaces |
| `server/routes/freepik.ts` | Server route | Freepik API proxy with rate limit handling |
| `src/components/panels/ImageStoryPanel.tsx` | UI panel | Input form with style picker |

## Cost & Credits

Follows existing credit system:
- 1 Gemini Flash call (classification): 1 credit (low cost)
- 1 ElevenLabs TTS call: existing voice credit cost
- N Freepik API calls: 1 credit per asset searched (fixed cost, independent of Freepik tier pricing)
- Estimated total for a typical 20-word story: ~5-8 credits (1 classification + 1 TTS + 3-6 image searches)
- Total credit cost displayed before generation via existing `creditGate.ts` pattern
- Credit estimate computed from noun count in the plan (after classification, before search)
