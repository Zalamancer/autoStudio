# Image Story Generation — Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a new `imageStory` orchestrator mode that transforms narrative text into visual storytelling using Freepik image search, noun/verb classification, TTS-synced animations, and kinetic typography.

**Architecture:** Extends the existing 24-step orchestrator pipeline with 4 new step executors and a Freepik server proxy. A Gemini Flash call classifies words as nouns (images), verbs (animations), or filler (kinetic text). ElevenLabs TTS provides word-level timestamps that drive all canvas timing. PixiJS and Remotion layers handle preview and export respectively.

**Tech Stack:** React 19, TypeScript, Zustand + Immer, Gemini Flash API, Freepik Resources API, ElevenLabs TTS, PixiJS, Remotion, Express.js, sharp (image analysis)

**Spec:** `docs/superpowers/specs/2026-04-02-image-story-generation-design.md`

---

## File Map

### New Files (11)

| File | Responsibility |
|------|---------------|
| `src/types/imageStory.ts` | All ImageStory types: WordRole, ImageStoryWord, ImageStoryScene, ImageStoryPlan, ImageStoryStyle, ImageStoryWordTiming, FreepikAsset, FreepikSearchRequest, CanvasRegion, computeRegion utility |
| `src/stores/useImageStoryStore.ts` | Zustand store for image story state (plan, assets, selectedAssets, style, generation status) |
| `src/services/freepik/freepikService.ts` | Freepik API client: search, transparency check via sharp, fallback chain, rate limit retry |
| `server/routes/freepik.ts` | Express route: `POST /api/proxy/freepik/search` with auth + rate limit handling |
| `src/services/orchestrator/steps/classifyImageStoryWords.ts` | Step executor: Gemini Flash word classification + plan.dialogue population |
| `src/services/orchestrator/steps/searchFreepikAssets.ts` | Step executor: TTS timestamp mapping + parallel Freepik search |
| `src/services/orchestrator/steps/composeImageStoryScenes.ts` | Step executor: zone-based layout + keyframe timing for images |
| `src/services/orchestrator/steps/setupFillerTypography.ts` | Step executor: kinetic text overlays for filler words |
| `src/pixi/PixiImageStoryLayer.ts` | PixiJS layer: sprite pool, word-timing-driven image display |
| `src/remotion/RemotionImageStoryLayer.tsx` | Remotion layer: frame-based image composition for export |
| `src/components/panels/ImageStoryPanel.tsx` | UI panel: text input, style pills, voice picker, generate button |

### Modified Files (8)

| File | Lines | Change |
|------|-------|--------|
| `src/types/orchestrator.ts` | 47-139, 377, 404-431 | Add `imageStory?: ImageStoryPlan` to ClipPlan. Add `'freepik'` to CostEntry `source` union. Add 4 kebab-case values to StepType union. |
| `src/services/orchestrator/constants.ts` | 161-200, 205-216 | Add `imageStoryWordTimings?: ImageStoryWordTiming[]` to ExecutionContext. Initialize in `createExecutionContext()`. |
| `src/services/orchestrator/stepExecutors.ts` | 7-32, 35-63 | Import 4 new executors. Register in STEP_EXECUTORS record. |
| `src/services/orchestrator/stepBuilder.ts` | 11-266 | Add `imageStory` mode branch: conditional step sequence skipping character steps. |
| `src/pixi/PixiCanvas.tsx` | 24-88 | Conditionally create PixiImageStoryLayer, set z-index, register with render loop. |
| `src/remotion/VideoComposition.tsx` | 73-109 | Add imageStory props, conditionally render RemotionImageStoryLayer. |
| `server/index.ts` | ~45, ~167 | Import and mount freepik routes at `/api/proxy/freepik` with `requireAuth` + `aiRateLimiter`. |
| `server/.env` (or `.env`) | — | Add `FREEPIK_API_KEY` environment variable. |

### Doc Updates (4)

| File | What |
|------|------|
| `docs/codebase/03-services-subdirs.md` | Document freepikService + 4 new step executors |
| `docs/codebase/04-stores.md` | Document useImageStoryStore |
| `docs/codebase/12-remotion.md` | Document RemotionImageStoryLayer + PixiImageStoryLayer |
| `docs/codebase/15-server-utils.md` | Document Freepik proxy route |

---

## Task 1: Types & Data Model

**Files:**
- Create: `src/types/imageStory.ts`
- Modify: `src/types/orchestrator.ts:47-139` (ClipPlan), `src/types/orchestrator.ts:404-431` (StepType)
- Modify: `src/services/orchestrator/constants.ts:161-200` (ExecutionContext), `src/services/orchestrator/constants.ts:205-216` (createExecutionContext)

- [ ] **Step 1: Create `src/types/imageStory.ts`**

```typescript
export type ImageStoryStyle =
  | 'Cartoon'
  | 'Realistic'
  | 'Minimalist'
  | 'Watercolor'
  | 'Flat'
  | '3D Render'

export type WordRole = 'image_noun' | 'action_verb' | 'filler'

export interface ImageStoryWord {
  text: string
  role: WordRole
  searchTerm?: string
  assetType?: 'photo' | 'png' | 'illustration' | 'vector'
  linkedNoun?: string
  animation?: string
}

export interface ImageStoryScene {
  id: string
  background: {
    searchTerm: string
    assetType: 'photo' | 'illustration'
  }
  words: ImageStoryWord[]
  elements: string[]
  transition: 'crossfade' | 'slide' | 'cut' | 'zoom'
}

export interface ImageStoryPlan {
  mode: 'imageStory'
  style: ImageStoryStyle
  scenes: ImageStoryScene[]
  ttsText: string
}

export interface ImageStoryWordTiming {
  word: ImageStoryWord
  startMs: number
  endMs: number
  startFrame: number
  endFrame: number
}

export interface FreepikSearchRequest {
  query: string
  assetType: 'photo' | 'png' | 'illustration' | 'vector'
  style?: ImageStoryStyle
  limit?: number
  transparency?: boolean
}

export interface FreepikAsset {
  id: string
  url: string
  thumbnailUrl: string
  width: number
  height: number
  format: 'jpg' | 'png' | 'svg' | 'psd'
  relevanceScore: number
}

export interface CanvasRegion {
  zone: 'background' | 'center' | 'left' | 'right' | 'top' | 'bottom'
  x: number
  y: number
  width: number
  height: number
  zIndex: number
}

/**
 * Shared layout utility — used by composeImageStoryScenes, RemotionImageStoryLayer, and PixiImageStoryLayer.
 * Single source of truth for noun image positioning.
 */
export function computeRegion(
  index: number,
  total: number,
  canvasWidth: number,
  canvasHeight: number,
): CanvasRegion {
  if (index === 0 && total === 1) {
    const w = canvasWidth * 0.5
    const h = canvasHeight * 0.5
    return { zone: 'center', x: (canvasWidth - w) / 2, y: (canvasHeight - h) / 2, width: w, height: h, zIndex: 1 }
  }
  if (index === 0) {
    const w = canvasWidth * 0.4
    const h = canvasHeight * 0.45
    return { zone: 'left', x: canvasWidth * 0.05, y: (canvasHeight - h) / 2, width: w, height: h, zIndex: 1 }
  }
  if (index === 1) {
    const w = canvasWidth * 0.4
    const h = canvasHeight * 0.45
    return { zone: 'right', x: canvasWidth * 0.55, y: (canvasHeight - h) / 2, width: w, height: h, zIndex: 2 }
  }
  const w = canvasWidth * 0.3
  const h = canvasHeight * 0.35
  return { zone: 'center', x: (canvasWidth - w) / 2, y: canvasHeight * 0.1, width: w, height: h, zIndex: 3 }
}
```

- [ ] **Step 2: Add `imageStory` to ClipPlan in `src/types/orchestrator.ts`**

Find the `ClipPlan` interface (line ~47-139). Add after the last optional field:

```typescript
imageStory?: ImageStoryPlan
```

Add import at top of file:

```typescript
import type { ImageStoryPlan, ImageStoryWordTiming } from './imageStory'
```

- [ ] **Step 3: Add 4 new values to StepType union in `src/types/orchestrator.ts`**

Find the `StepType` union (line ~404-431). Add after `'finalize-timeline'`:

```typescript
| 'classify-image-story-words'
| 'search-freepik-assets'
| 'compose-image-story-scenes'
| 'setup-filler-typography'
```

Note: uses kebab-case to match all existing StepType values.

Also add `'freepik'` to the `CostEntry.source` union (line ~377):

```typescript
source: 'gemini' | 'elevenlabs' | 'vertex-ai' | 'freepik'
```

- [ ] **Step 4: Add `imageStoryWordTimings` to ExecutionContext in `src/services/orchestrator/constants.ts`**

Find `ExecutionContext` interface (line ~161-200). Add after `qaResult`:

```typescript
imageStoryWordTimings?: ImageStoryWordTiming[]
```

Add import at top:

```typescript
import type { ImageStoryWordTiming } from '@/types/imageStory'
```

- [ ] **Step 5: Verify build compiles**

Run: `cd /Users/ihsanduru/autoStudio/AutoAnimation && npx tsc --noEmit 2>&1 | head -20`
Expected: No new errors from the type additions (unused import warnings are OK at this stage).

- [ ] **Step 6: Commit**

```bash
git add src/types/imageStory.ts src/types/orchestrator.ts src/services/orchestrator/constants.ts
git commit -m "feat(image-story): add types and extend ClipPlan, StepType, ExecutionContext"
```

---

## Task 2: Zustand Store

**Files:**
- Create: `src/stores/useImageStoryStore.ts`

- [ ] **Step 1: Create `src/stores/useImageStoryStore.ts`**

```typescript
import { create } from 'zustand'
import { immer } from 'zustand/middleware/immer'
import type {
  ImageStoryPlan,
  ImageStoryStyle,
  FreepikAsset,
} from '@/types/imageStory'

interface ImageStoryState {
  plan: ImageStoryPlan | null
  assets: Record<string, FreepikAsset[]>
  selectedAssets: Record<string, string>
  style: ImageStoryStyle
  isGenerating: boolean
  currentStep: string

  setPlan: (plan: ImageStoryPlan) => void
  setAssets: (searchTerm: string, results: FreepikAsset[]) => void
  selectAsset: (nounId: string, assetUrl: string) => void
  swapAsset: (nounId: string, newAssetUrl: string) => void
  setStyle: (style: ImageStoryStyle) => void
  setGenerating: (isGenerating: boolean, step?: string) => void
  reset: () => void
}

const initialState = {
  plan: null as ImageStoryPlan | null,
  assets: {} as Record<string, FreepikAsset[]>,
  selectedAssets: {} as Record<string, string>,
  style: 'Cartoon' as ImageStoryStyle,
  isGenerating: false,
  currentStep: '',
}

export const useImageStoryStore = create<ImageStoryState>()(
  immer((set) => ({
    ...initialState,

    setPlan: (plan) =>
      set((state) => {
        state.plan = plan
      }),

    setAssets: (searchTerm, results) =>
      set((state) => {
        state.assets[searchTerm] = results
      }),

    selectAsset: (nounId, assetUrl) =>
      set((state) => {
        state.selectedAssets[nounId] = assetUrl
      }),

    swapAsset: (nounId, newAssetUrl) =>
      set((state) => {
        state.selectedAssets[nounId] = newAssetUrl
      }),

    setStyle: (style) =>
      set((state) => {
        state.style = style
      }),

    setGenerating: (isGenerating, step = '') =>
      set((state) => {
        state.isGenerating = isGenerating
        state.currentStep = step
      }),

    reset: () => set(initialState),
  })),
)
```

- [ ] **Step 2: Verify build compiles**

Run: `cd /Users/ihsanduru/autoStudio/AutoAnimation && npx tsc --noEmit 2>&1 | head -20`

- [ ] **Step 3: Commit**

```bash
git add src/stores/useImageStoryStore.ts
git commit -m "feat(image-story): add useImageStoryStore with Zustand + Immer"
```

---

## Task 3: Freepik Server Route & Service

**Files:**
- Create: `server/routes/freepik.ts`
- Create: `src/services/freepik/freepikService.ts`
- Modify: `server/index.ts:~45,~167` (import + mount)

- [ ] **Step 1: Create `server/routes/freepik.ts`**

```typescript
import { Router, type Request, type Response } from 'express'

const router = Router()

// Auth handled at mount level in server/index.ts (requireAuth + aiRateLimiter)

router.get('/status', (_req: Request, res: Response) => {
  const hasKey = !!process.env.FREEPIK_API_KEY
  res.json({ configured: hasKey })
})

router.post('/search', async (req: Request, res: Response) => {
  const apiKey = process.env.FREEPIK_API_KEY
  if (!apiKey) {
    return res.status(503).json({ error: 'Freepik API key not configured' })
  }

  const { query, assetType, style, limit = 5, transparency } = req.body

  if (!query || !assetType) {
    return res.status(400).json({ error: 'query and assetType are required' })
  }

  let searchQuery = query
  if (style) searchQuery += ` ${style}`
  if (transparency) searchQuery += ' isolated'

  const filters: Record<string, string> = {}
  if (assetType === 'photo') filters['content_type[photo]'] = '1'
  else if (assetType === 'png' || assetType === 'illustration')
    filters['content_type[psd]'] = '1'
  else if (assetType === 'vector') filters['content_type[vector]'] = '1'

  const params = new URLSearchParams({
    term: searchQuery,
    per_page: String(limit),
    ...filters,
  })

  const url = `https://api.freepik.com/v1/resources?${params}`

  let retries = 0
  const delays = [1000, 2000, 4000]

  while (retries <= 3) {
    try {
      const upstream = await fetch(url, {
        headers: {
          'x-freepik-api-key': apiKey,
          Accept: 'application/json',
        },
      })

      if (upstream.status === 429 && retries < 3) {
        await new Promise((r) => setTimeout(r, delays[retries]))
        retries++
        continue
      }

      if (!upstream.ok) {
        return res
          .status(upstream.status)
          .json({ error: `Freepik API error: ${upstream.status}` })
      }

      const data = await upstream.json()
      const results = (data.data || []).map(
        (item: Record<string, unknown>) => ({
          id: String(item.id),
          url: (item.image as Record<string, unknown>)?.source_url || '',
          thumbnailUrl:
            (item.thumbnails as Record<string, unknown>[])?.[0]?.url || '',
          width: (item.image as Record<string, unknown>)?.width || 0,
          height: (item.image as Record<string, unknown>)?.height || 0,
          format: String(
            (item.image as Record<string, unknown>)?.format || 'jpg',
          ),
          relevanceScore: 1 - (data.data || []).indexOf(item) / limit,
        }),
      )

      return res.json({ results })
    } catch (err) {
      if (retries >= 3) {
        return res.status(502).json({ error: 'Freepik API request failed' })
      }
      retries++
    }
  }
})

export default router
```

- [ ] **Step 2: Mount route in `server/index.ts`**

Find the route imports section (~line 45). Add:

```typescript
import freepikRoutes from './routes/freepik'
```

Find the route mounting section (~line 167, near `app.use('/api/proxy'...)`). Add:

```typescript
app.use('/api/proxy/freepik', requireAuth, aiRateLimiter, freepikRoutes)
```

- [ ] **Step 3: Create `src/services/freepik/freepikService.ts`**

```typescript
import type {
  FreepikSearchRequest,
  FreepikAsset,
  ImageStoryStyle,
} from '@/types/imageStory'

const STYLE_MODIFIERS: Record<ImageStoryStyle, string[]> = {
  Cartoon: ['cartoon', 'illustration'],
  Realistic: ['photo', 'stock'],
  Minimalist: ['flat', 'minimal', 'icon'],
  Watercolor: ['watercolor', 'painted'],
  Flat: ['flat design', '2d'],
  '3D Render': ['3d render', 'isometric'],
}

export async function searchFreepik(
  request: FreepikSearchRequest,
): Promise<FreepikAsset[]> {
  const res = await fetch('/api/proxy/freepik/search', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(request),
  })

  if (!res.ok) {
    console.warn(`[freepik] Search failed for "${request.query}": ${res.status}`)
    return []
  }

  const data = await res.json()
  return data.results || []
}

export async function searchWithFallback(
  searchTerm: string,
  assetType: FreepikSearchRequest['assetType'],
  style: ImageStoryStyle,
  transparency = false,
): Promise<FreepikAsset[]> {
  // Attempt 1: with style modifier
  const styleModifier = STYLE_MODIFIERS[style]?.[0] || ''
  let results = await searchFreepik({
    query: `${searchTerm} ${styleModifier}`.trim(),
    assetType,
    style,
    transparency,
    limit: 5,
  })

  if (results.length >= 2) return results

  // Attempt 2: without style modifier
  results = await searchFreepik({
    query: searchTerm,
    assetType,
    transparency,
    limit: 5,
  })

  if (results.length >= 2) return results

  // Attempt 3: simplified term (first word only)
  const simplified = searchTerm.split(' ')[0]
  if (simplified !== searchTerm) {
    results = await searchFreepik({
      query: simplified,
      assetType,
      transparency,
      limit: 5,
    })
  }

  return results
}

export function getSearchTerm(
  baseTerm: string,
  type: 'background' | 'element' | 'character',
): string {
  switch (type) {
    case 'background':
      return `${baseTerm} background scene`
    case 'character':
      return `${baseTerm} character`
    case 'element':
    default:
      return baseTerm
  }
}
```

- [ ] **Step 4: Add `FREEPIK_API_KEY` to server env**

Add to `server/.env` (or project root `.env`):

```
FREEPIK_API_KEY=your_freepik_api_key_here
```

- [ ] **Step 5: Verify server compiles**

Run: `cd /Users/ihsanduru/autoStudio/AutoAnimation/server && npx tsc --noEmit 2>&1 | head -20`

- [ ] **Step 6: Commit**

```bash
git add server/routes/freepik.ts src/services/freepik/freepikService.ts server/index.ts
git commit -m "feat(image-story): add Freepik API proxy route and client service"
```

---

## Task 4: Step Executor — classifyImageStoryWords

**Files:**
- Create: `src/services/orchestrator/steps/classifyImageStoryWords.ts`
- Modify: `src/services/orchestrator/stepExecutors.ts:7-32,35-63`

- [ ] **Step 1: Create `src/services/orchestrator/steps/classifyImageStoryWords.ts`**

```typescript
import type { ClipPlan } from '@/types/orchestrator'
import type { ExecutionContext } from '../constants'
import type { ImageStoryScene } from '@/types/imageStory'
import { getGeminiService, hasGeminiService } from '@/services/gemini'
import { hasElevenLabsService } from '@/services/elevenlabs'

const CLASSIFICATION_PROMPT = `You are a visual storytelling AI. Given a narrative text and a visual style, classify each word or phrase into one of three roles:

1. **image_noun** — A concrete noun that should be shown as an image (person, object, place, animal). Include a searchTerm for image search and an assetType (photo, png, illustration, or vector).
2. **action_verb** — A strong verb that should animate the nearest noun image. Include linkedNoun (the noun it acts on) and animation name (reach, grab, walk, drop, slide, pop, shake, grow, shrink, bounce, fade).
3. **filler** — Everything else (articles, prepositions, pronouns, abstract words). These will be shown as text.

Group words into scenes. Start a new scene when the narrative shifts location or introduces a major new visual context.

Multi-word noun phrases (e.g., "ice cream", "roller coaster") should be ONE image_noun entry, not split.

Return ONLY valid JSON matching this schema:
{
  "scenes": [
    {
      "id": "scene_1",
      "background": { "searchTerm": "description for background image", "assetType": "photo" | "illustration" },
      "words": [
        { "text": "word or phrase", "role": "image_noun" | "action_verb" | "filler", "searchTerm?": "...", "assetType?": "...", "linkedNoun?": "...", "animation?": "..." }
      ],
      "elements": ["noun_ids_in_this_scene"],
      "transition": "crossfade" | "slide" | "cut" | "zoom"
    }
  ]
}

Example 1 (simple):
Input: "A cat sits on a table"
Output: {"scenes":[{"id":"scene_1","background":{"searchTerm":"room with table","assetType":"photo"},"words":[{"text":"A","role":"filler"},{"text":"cat","role":"image_noun","searchTerm":"cat sitting","assetType":"png"},{"text":"sits","role":"action_verb","linkedNoun":"cat","animation":"bounce"},{"text":"on a","role":"filler"},{"text":"table","role":"image_noun","searchTerm":"wooden table","assetType":"png"}],"elements":["cat","table"],"transition":"crossfade"}]}

Example 2 (compound nouns):
Input: "The ice cream truck drove away"
Output: {"scenes":[{"id":"scene_1","background":{"searchTerm":"suburban street","assetType":"photo"},"words":[{"text":"The","role":"filler"},{"text":"ice cream truck","role":"image_noun","searchTerm":"ice cream truck","assetType":"png"},{"text":"drove","role":"action_verb","linkedNoun":"ice cream truck","animation":"slide"},{"text":"away","role":"filler"}],"elements":["ice cream truck"],"transition":"crossfade"}]}

Example 3 (no image-worthy words):
Input: "Meanwhile, back at the same time"
Output: {"scenes":[{"id":"scene_1","background":{"searchTerm":"abstract transition","assetType":"illustration"},"words":[{"text":"Meanwhile, back at the same time","role":"filler"}],"elements":[],"transition":"crossfade"}]}`

export async function executeClassifyImageStoryWords(
  plan: ClipPlan,
  ctx: ExecutionContext,
): Promise<void> {
  if (!plan.imageStory) {
    throw new Error('imageStory field missing from plan')
  }

  // Pre-flight: TTS is mandatory for image story mode
  if (!hasElevenLabsService()) {
    throw new Error('Voice generation is required for Image Story mode. ElevenLabs is not configured.')
  }

  if (!hasGeminiService()) {
    throw new Error('Gemini is required for Image Story classification.')
  }

  const { ttsText, style } = plan.imageStory
  const gemini = getGeminiService()

  const prompt = `${CLASSIFICATION_PROMPT}

Visual style: ${style}
Text to classify: "${ttsText}"

Return ONLY the JSON object, no markdown fences.`

  let parsed: { scenes: ImageStoryScene[] } | null = null

  // Attempt 1
  const response = await gemini.generateContent(prompt)
  try {
    const cleaned = response.replace(/```json?\n?/g, '').replace(/```/g, '').trim()
    parsed = JSON.parse(cleaned)
  } catch {
    // Attempt 2: stricter retry
    const retryPrompt = `${prompt}\n\nYour previous response was invalid JSON. Return ONLY a raw JSON object. No markdown. No explanation.`
    const retryResponse = await gemini.generateContent(retryPrompt)
    try {
      const cleaned = retryResponse.replace(/```json?\n?/g, '').replace(/```/g, '').trim()
      parsed = JSON.parse(cleaned)
    } catch {
      throw new Error('Image Story classification failed: Gemini returned invalid JSON after 2 attempts')
    }
  }

  if (!parsed?.scenes?.length) {
    throw new Error('Image Story classification returned empty scenes')
  }

  // Update plan with classified scenes
  plan.imageStory.scenes = parsed.scenes

  // Create dialogue entry for TTS (so generateVoices can run)
  // ClipPlanDialogueLine uses `script` not `text`, and has no `voiceId` field
  plan.dialogue = [
    {
      characterName: 'narrator',
      script: ttsText,
      emotion: 'neutral',
    },
  ]

  ctx.addCostEntry?.({
    source: 'gemini',
    label: 'Image Story classification',
    cost: 0,
    credits: 1,
  })
}
```

- [ ] **Step 2: Register in `src/services/orchestrator/stepExecutors.ts`**

Add import (after existing imports, ~line 32):

```typescript
import { executeClassifyImageStoryWords } from './steps/classifyImageStoryWords'
```

Add to STEP_EXECUTORS record (~line 35-63):

```typescript
'classify-image-story-words': executeClassifyImageStoryWords,
```

- [ ] **Step 3: Verify build compiles**

Run: `cd /Users/ihsanduru/autoStudio/AutoAnimation && npx tsc --noEmit 2>&1 | head -20`

- [ ] **Step 4: Commit**

```bash
git add src/services/orchestrator/steps/classifyImageStoryWords.ts src/services/orchestrator/stepExecutors.ts
git commit -m "feat(image-story): add classifyImageStoryWords step executor with Gemini Flash"
```

---

## Task 5: Step Executor — searchFreepikAssets

**Files:**
- Create: `src/services/orchestrator/steps/searchFreepikAssets.ts`
- Modify: `src/services/orchestrator/stepExecutors.ts` (add import + register)

- [ ] **Step 1: Create `src/services/orchestrator/steps/searchFreepikAssets.ts`**

```typescript
import type { ClipPlan } from '@/types/orchestrator'
import type { ExecutionContext } from '../constants'
import type { ImageStoryWordTiming, FreepikAsset } from '@/types/imageStory'
import { searchWithFallback, getSearchTerm } from '@/services/freepik/freepikService'
import { useImageStoryStore } from '@/stores/useImageStoryStore'

export async function executeSearchFreepikAssets(
  plan: ClipPlan,
  ctx: ExecutionContext,
): Promise<void> {
  if (!plan.imageStory) {
    throw new Error('imageStory field missing from plan')
  }

  const { scenes, style } = plan.imageStory

  // --- Phase 1: Map TTS word timestamps onto classified words ---
  // GeneratedVoice uses `wordTimeline` (not `wordTimings`), with WordEvent entries
  // WordEvent has `startTime`/`endTime` in SECONDS, plus pre-computed `startFrame`/`endFrame`
  const generatedVoice = ctx.generatedVoices?.[0]
  if (!generatedVoice?.wordTimeline?.length) {
    throw new Error('Voice generation is required for Image Story mode. No word timing data found.')
  }

  const wordTimings: ImageStoryWordTiming[] = []
  let ttsWordIndex = 0
  const ttsWords = generatedVoice.wordTimeline

  for (const scene of scenes) {
    for (const word of scene.words) {
      const wordTokens = word.text.trim().split(/\s+/)
      const firstToken = ttsWords[ttsWordIndex]
      const lastToken = ttsWords[ttsWordIndex + wordTokens.length - 1] || firstToken

      if (firstToken && lastToken) {
        wordTimings.push({
          word,
          startMs: firstToken.startTime * 1000,   // seconds → ms
          endMs: lastToken.endTime * 1000,         // seconds → ms
          startFrame: firstToken.startFrame,        // WordEvent has pre-computed frames
          endFrame: lastToken.endFrame,
        })
      }

      ttsWordIndex += wordTokens.length
    }
  }

  ctx.imageStoryWordTimings = wordTimings

  // --- Phase 2: Parallel Freepik search for all nouns + backgrounds ---
  const searchPromises: Promise<{ key: string; results: FreepikAsset[] }>[] = []

  // Scene backgrounds
  for (const scene of scenes) {
    const term = getSearchTerm(scene.background.searchTerm, 'background')
    searchPromises.push(
      searchWithFallback(term, scene.background.assetType, style).then(
        (results) => ({ key: `bg_${scene.id}`, results }),
      ),
    )
  }

  // Noun elements
  for (const scene of scenes) {
    for (const word of scene.words) {
      if (word.role === 'image_noun' && word.searchTerm) {
        const isCharacter = word.searchTerm.toLowerCase().includes('person') ||
          word.searchTerm.toLowerCase().includes('man') ||
          word.searchTerm.toLowerCase().includes('woman') ||
          word.searchTerm.toLowerCase().includes('father') ||
          word.searchTerm.toLowerCase().includes('mother') ||
          word.searchTerm.toLowerCase().includes('child')

        const type = isCharacter ? 'character' : 'element'
        const term = getSearchTerm(word.searchTerm, type)
        const assetType = word.assetType || 'png'

        searchPromises.push(
          searchWithFallback(term, assetType, style, true).then(
            (results) => ({ key: word.text, results }),
          ),
        )
      }
    }
  }

  const searchResults = await Promise.all(searchPromises)

  // Batch update store
  const store = useImageStoryStore.getState()
  for (const { key, results } of searchResults) {
    store.setAssets(key, results)
    // Auto-select first result
    if (results.length > 0) {
      store.selectAsset(key, results[0].url)
    }
  }

  // Cost tracking: 1 credit per search
  ctx.addCostEntry?.({
    source: 'freepik',
    label: `Image search (${searchResults.length} queries)`,
    cost: 0,
    credits: searchResults.length,
  })
}
```

- [ ] **Step 2: Register in `src/services/orchestrator/stepExecutors.ts`**

Add import:

```typescript
import { executeSearchFreepikAssets } from './steps/searchFreepikAssets'
```

Add to STEP_EXECUTORS:

```typescript
'search-freepik-assets': executeSearchFreepikAssets,
```

- [ ] **Step 3: Verify build compiles**

Run: `cd /Users/ihsanduru/autoStudio/AutoAnimation && npx tsc --noEmit 2>&1 | head -20`

- [ ] **Step 4: Commit**

```bash
git add src/services/orchestrator/steps/searchFreepikAssets.ts src/services/orchestrator/stepExecutors.ts
git commit -m "feat(image-story): add searchFreepikAssets step with TTS timestamp mapping"
```

---

## Task 6: Step Executor — composeImageStoryScenes

**Files:**
- Create: `src/services/orchestrator/steps/composeImageStoryScenes.ts`
- Modify: `src/services/orchestrator/stepExecutors.ts` (add import + register)

- [ ] **Step 1: Create `src/services/orchestrator/steps/composeImageStoryScenes.ts`**

```typescript
import type { ClipPlan } from '@/types/orchestrator'
import type { ExecutionContext } from '../constants'
import { computeRegion } from '@/types/imageStory'
import { useImageStoryStore } from '@/stores/useImageStoryStore'
import { useMediaStore } from '@/stores/useMediaStore'
import { useKeyframeStore } from '@/stores/useKeyframeStore'
import { ASPECT_RATIO_DIMENSIONS } from '@/constants/canvas'

// Semantic verb → animation preset mapping
const VERB_ANIMATION_MAP: Record<string, { type: string; params: Record<string, number> }> = {
  walk: { type: 'path-horizontal', params: { distance: 200, bounce: 0.3 } },
  run: { type: 'path-horizontal', params: { distance: 300, bounce: 0.2 } },
  fly: { type: 'path-arc', params: { height: 100, distance: 200 } },
  drive: { type: 'path-horizontal', params: { distance: 250, bounce: 0.1 } },
  catch: { type: 'scale-pulse', params: { scale: 1.2, duration: 300 } },
  grab: { type: 'scale-pulse', params: { scale: 1.15, duration: 250 } },
  hold: { type: 'attention-pulse', params: { intensity: 0.5 } },
  touch: { type: 'scale-pulse', params: { scale: 1.05, duration: 200 } },
  arrive: { type: 'entrance-slide', params: { from: 'right' } },
  come: { type: 'entrance-slide', params: { from: 'left' } },
  enter: { type: 'entrance-slide', params: { from: 'bottom' } },
  show: { type: 'entrance-pop', params: { scale: 0.5 } },
  leave: { type: 'exit-slide', params: { to: 'left' } },
  vanish: { type: 'exit-fade', params: { duration: 300 } },
  hide: { type: 'exit-shrink', params: { scale: 0 } },
  go: { type: 'exit-slide', params: { to: 'right' } },
  hit: { type: 'attention-shake', params: { intensity: 1.0 } },
  crash: { type: 'attention-shake', params: { intensity: 1.5 } },
  slam: { type: 'attention-shake', params: { intensity: 1.2 } },
  love: { type: 'attention-heartbeat', params: { intensity: 0.8 } },
  hate: { type: 'attention-shake', params: { intensity: 0.6 } },
  fear: { type: 'attention-shake', params: { intensity: 0.4 } },
  grow: { type: 'scale-up', params: { targetScale: 1.5, easing: 'elastic' } },
  expand: { type: 'scale-up', params: { targetScale: 1.3, easing: 'elastic' } },
  rise: { type: 'path-vertical', params: { distance: -100 } },
  drop: { type: 'path-vertical', params: { distance: 150, bounce: 0.5 } },
  fall: { type: 'path-vertical', params: { distance: 200, bounce: 0.4 } },
  sink: { type: 'path-vertical', params: { distance: 100, bounce: 0.2 } },
}

export async function executeComposeImageStoryScenes(
  plan: ClipPlan,
  ctx: ExecutionContext,
): Promise<void> {
  if (!plan.imageStory || !ctx.imageStoryWordTimings) {
    throw new Error('Image story plan and word timings are required')
  }

  const { scenes, style } = plan.imageStory
  const timings = ctx.imageStoryWordTimings

  // Canvas dimensions from aspect ratio (ClipPlan.canvas has aspectRatio, not width/height)
  const dims = ASPECT_RATIO_DIMENSIONS[plan.canvas?.aspectRatio || '9:16']
    || ASPECT_RATIO_DIMENSIONS['9:16']
  const canvasWidth = dims.w
  const canvasHeight = dims.h

  const selectedAssets = useImageStoryStore.getState().selectedAssets
  const mediaStore = useMediaStore.getState()
  const keyframeStore = useKeyframeStore.getState()

  const PRE_ENTRY_MS = 200 // Image appears 200ms before noun is spoken
  const PRE_ENTRY_FRAMES = Math.round((PRE_ENTRY_MS / 1000) * ctx.fps)

  for (const scene of scenes) {
    // --- Place background ---
    // NOTE: mediaStore.addToCanvas takes an assetId, not a URL object.
    // First register the Freepik URL as a MediaAsset, then add to canvas by ID.
    const bgAssetUrl = selectedAssets[`bg_${scene.id}`]
    if (bgAssetUrl) {
      const bgTiming = timings.find((t) => t.word === scene.words[0])
      const startFrame = bgTiming ? bgTiming.startFrame : 0
      const lastWordTiming = timings.filter((t) =>
        scene.words.includes(t.word),
      ).pop()
      const endFrame = lastWordTiming ? lastWordTiming.endFrame : ctx.totalFrames

      // Register external URL as asset, then add to canvas
      const bgAssetId = mediaStore.registerExternalAsset({
        url: bgAssetUrl,
        type: 'image',
        name: `bg_${scene.id}`,
      })
      mediaStore.addToCanvas(bgAssetId, {
        x: 0,
        y: 0,
        width: canvasWidth,
        height: canvasHeight,
        startFrame,
        endFrame,
        zIndex: 0,
        metadata: { source: 'imageStory', sceneId: scene.id, role: 'background' },
      })
    }

    // --- Place noun images ---
    const nounWords = scene.words.filter((w) => w.role === 'image_noun')
    let activeNouns: string[] = []

    for (let i = 0; i < nounWords.length; i++) {
      const nounWord = nounWords[i]
      const assetUrl = selectedAssets[nounWord.text]
      if (!assetUrl) continue

      const timing = timings.find((t) => t.word === nounWord)
      if (!timing) continue

      // Evict oldest if max 3
      if (activeNouns.length >= 3) {
        activeNouns.shift()
      }
      activeNouns.push(nounWord.text)

      const region = computeRegion(
        activeNouns.indexOf(nounWord.text),
        activeNouns.length,
        canvasWidth,
        canvasHeight,
      )

      const entryFrame = Math.max(0, timing.startFrame - PRE_ENTRY_FRAMES)

      // Find scene end for this noun (until next scene or end)
      const lastSceneTiming = timings
        .filter((t) => scene.words.includes(t.word))
        .pop()
      const exitFrame = lastSceneTiming ? lastSceneTiming.endFrame : ctx.totalFrames

      // Register external URL as asset, then add to canvas
      const nounAssetId = mediaStore.registerExternalAsset({
        url: assetUrl,
        type: 'image',
        name: `noun_${nounWord.text}`,
      })
      const itemId = mediaStore.addToCanvas(nounAssetId, {
        x: region.x,
        y: region.y,
        width: region.width,
        height: region.height,
        startFrame: entryFrame,
        endFrame: exitFrame,
        zIndex: region.zIndex,
        metadata: { source: 'imageStory', sceneId: scene.id, role: 'noun', nounText: nounWord.text },
      })

      // Apply entry animation keyframes
      if (itemId) {
        keyframeStore.addKeyframe(itemId, 'opacity', entryFrame, 0)
        keyframeStore.addKeyframe(itemId, 'opacity', entryFrame + 8, 1)
        keyframeStore.addKeyframe(itemId, 'scale', entryFrame, 0.7)
        keyframeStore.addKeyframe(itemId, 'scale', entryFrame + 10, 1, 'outElastic')
      }

      // --- Apply verb animations to this noun ---
      const linkedVerbs = scene.words.filter(
        (w) => w.role === 'action_verb' && w.linkedNoun === nounWord.text,
      )
      for (const verb of linkedVerbs) {
        const verbTiming = timings.find((t) => t.word === verb)
        if (!verbTiming || !itemId) continue

        const anim = verb.animation
          ? VERB_ANIMATION_MAP[verb.animation]
          : undefined

        if (anim) {
          // Apply verb-specific keyframes
          if (anim.type.startsWith('scale')) {
            const targetScale = anim.params.scale || anim.params.targetScale || 1.2
            keyframeStore.addKeyframe(itemId, 'scale', verbTiming.startFrame, 1)
            keyframeStore.addKeyframe(itemId, 'scale', verbTiming.startFrame + 6, targetScale, 'outBack')
            keyframeStore.addKeyframe(itemId, 'scale', verbTiming.endFrame, 1, 'outElastic')
          } else if (anim.type.startsWith('path-horizontal')) {
            const dist = anim.params.distance || 100
            keyframeStore.addKeyframe(itemId, 'x', verbTiming.startFrame, region.x)
            keyframeStore.addKeyframe(itemId, 'x', verbTiming.endFrame, region.x + dist, 'outBounce')
          } else if (anim.type.startsWith('path-vertical')) {
            const dist = anim.params.distance || 100
            keyframeStore.addKeyframe(itemId, 'y', verbTiming.startFrame, region.y)
            keyframeStore.addKeyframe(itemId, 'y', verbTiming.endFrame, region.y + dist, 'outBounce')
          } else if (anim.type.startsWith('attention')) {
            const intensity = anim.params.intensity || 0.5
            const shakeAmount = intensity * 10
            keyframeStore.addKeyframe(itemId, 'x', verbTiming.startFrame, region.x)
            keyframeStore.addKeyframe(itemId, 'x', verbTiming.startFrame + 2, region.x + shakeAmount)
            keyframeStore.addKeyframe(itemId, 'x', verbTiming.startFrame + 4, region.x - shakeAmount)
            keyframeStore.addKeyframe(itemId, 'x', verbTiming.startFrame + 6, region.x)
          }
        }
      }
    }
  }
}
```

- [ ] **Step 2: Register in `src/services/orchestrator/stepExecutors.ts`**

Add import:

```typescript
import { executeComposeImageStoryScenes } from './steps/composeImageStoryScenes'
```

Add to STEP_EXECUTORS:

```typescript
'compose-image-story-scenes': executeComposeImageStoryScenes,
```

- [ ] **Step 3: Verify build compiles**

Run: `cd /Users/ihsanduru/autoStudio/AutoAnimation && npx tsc --noEmit 2>&1 | head -20`

- [ ] **Step 4: Commit**

```bash
git add src/services/orchestrator/steps/composeImageStoryScenes.ts src/services/orchestrator/stepExecutors.ts
git commit -m "feat(image-story): add composeImageStoryScenes step with layout and verb animations"
```

---

## Task 7: Step Executor — setupFillerTypography

**Files:**
- Create: `src/services/orchestrator/steps/setupFillerTypography.ts`
- Modify: `src/services/orchestrator/stepExecutors.ts` (add import + register)

- [ ] **Step 1: Create `src/services/orchestrator/steps/setupFillerTypography.ts`**

```typescript
import type { ClipPlan } from '@/types/orchestrator'
import type { ExecutionContext } from '../constants'
import type { ImageStoryStyle } from '@/types/imageStory'
import { useTextOverlayStore } from '@/stores/useTextOverlayStore'
import { ASPECT_RATIO_DIMENSIONS } from '@/constants/canvas'

// Style → kinetic template family mapping
const STYLE_TEMPLATE_MAP: Record<ImageStoryStyle, string> = {
  Cartoon: 'bounce',
  Realistic: 'fade-slide',
  Minimalist: 'clean-reveal',
  Watercolor: 'soft-bloom',
  Flat: 'snap-pop',
  '3D Render': 'smooth-scale',
}

export async function executeSetupFillerTypography(
  plan: ClipPlan,
  ctx: ExecutionContext,
): Promise<void> {
  if (!plan.imageStory || !ctx.imageStoryWordTimings) {
    throw new Error('Image story plan and word timings are required')
  }

  const { style } = plan.imageStory
  const timings = ctx.imageStoryWordTimings
  const templateFamily = STYLE_TEMPLATE_MAP[style] || 'fade-slide'
  const dims = ASPECT_RATIO_DIMENSIONS[plan.canvas?.aspectRatio || '9:16']
    || ASPECT_RATIO_DIMENSIONS['9:16']
  const canvasWidth = dims.w
  const canvasHeight = dims.h

  const textOverlayStore = useTextOverlayStore.getState()

  // Collect consecutive filler words into groups
  const fillerGroups: { text: string; startFrame: number; endFrame: number }[] = []
  let currentGroup: { words: string[]; startFrame: number; endFrame: number } | null = null

  for (const timing of timings) {
    if (timing.word.role === 'filler') {
      if (currentGroup) {
        currentGroup.words.push(timing.word.text)
        currentGroup.endFrame = timing.endFrame
      } else {
        currentGroup = {
          words: [timing.word.text],
          startFrame: timing.startFrame,
          endFrame: timing.endFrame,
        }
      }
    } else {
      if (currentGroup) {
        fillerGroups.push({
          text: currentGroup.words.join(' '),
          startFrame: currentGroup.startFrame,
          endFrame: currentGroup.endFrame,
        })
        currentGroup = null
      }
    }
  }
  // Flush last group
  if (currentGroup) {
    fillerGroups.push({
      text: currentGroup.words.join(' '),
      startFrame: currentGroup.startFrame,
      endFrame: currentGroup.endFrame,
    })
  }

  // Create text overlays for each filler group
  for (const group of fillerGroups) {
    // Position in safe zones (top or bottom 20%)
    const useTop = fillerGroups.indexOf(group) % 2 === 0
    const y = useTop ? canvasHeight * 0.08 : canvasHeight * 0.82

    textOverlayStore.addOverlay({
      text: group.text,
      x: canvasWidth / 2,
      y,
      startFrame: group.startFrame,
      endFrame: group.endFrame,
      fontSize: 48,
      fontWeight: 'bold',
      color: '#ffffff',
      textAlign: 'center',
      animation: templateFamily,
      metadata: { source: 'imageStory', role: 'filler' },
    })
  }
}
```

- [ ] **Step 2: Register in `src/services/orchestrator/stepExecutors.ts`**

Add import:

```typescript
import { executeSetupFillerTypography } from './steps/setupFillerTypography'
```

Add to STEP_EXECUTORS:

```typescript
'setup-filler-typography': executeSetupFillerTypography,
```

- [ ] **Step 3: Verify build compiles**

Run: `cd /Users/ihsanduru/autoStudio/AutoAnimation && npx tsc --noEmit 2>&1 | head -20`

- [ ] **Step 4: Commit**

```bash
git add src/services/orchestrator/steps/setupFillerTypography.ts src/services/orchestrator/stepExecutors.ts
git commit -m "feat(image-story): add setupFillerTypography step with style-matched kinetic text"
```

---

## Task 8: Step Builder — imageStory Mode Branch

**Files:**
- Modify: `src/services/orchestrator/stepBuilder.ts:11-266`

- [ ] **Step 1: Add imageStory mode detection and step sequence**

In `stepBuilder.ts`, find `buildStepsFromPlan()` (line ~11). Add an early return for imageStory mode, before the existing logic that builds character-based steps:

```typescript
// At the top of buildStepsFromPlan, after initial setup:
if (plan.imageStory) {
  return buildImageStorySteps(plan, settings)
}
```

Add the helper function above or below `buildStepsFromPlan`:

```typescript
function buildImageStorySteps(plan: ClipPlan, settings?: OrchestratorSettings): OrchestratorStep[] {
  const steps: OrchestratorStep[] = []

  steps.push({
    type: 'setup-canvas',
    status: 'pending',
    detail: `${plan.canvas?.width || 1080}×${plan.canvas?.height || 1920}`,
  })

  steps.push({
    type: 'classify-image-story-words',
    status: 'pending',
    detail: 'Analyzing story text...',
  })

  steps.push({
    type: 'generate-voices',
    status: 'pending',
    detail: 'Narrator voiceover',
  })

  steps.push({
    type: 'search-freepik-assets',
    status: 'pending',
    detail: 'Finding images...',
  })

  steps.push({
    type: 'compose-image-story-scenes',
    status: 'pending',
    detail: 'Composing visual scenes...',
  })

  steps.push({
    type: 'setup-filler-typography',
    status: 'pending',
    detail: 'Adding kinetic text...',
  })

  if (plan.captions) {
    steps.push({
      type: 'setup-captions',
      status: 'pending',
      detail: 'Captions',
    })
  }

  steps.push({
    type: 'generate-thumbnail',
    status: 'pending',
    detail: 'Thumbnail',
  })

  steps.push({
    type: 'quality-gate',
    status: 'pending',
    detail: 'Quality check',
  })

  steps.push({
    type: 'finalize-timeline',
    status: 'pending',
    detail: 'Final assembly',
  })

  return steps
}
```

- [ ] **Step 2: Verify build compiles**

Run: `cd /Users/ihsanduru/autoStudio/AutoAnimation && npx tsc --noEmit 2>&1 | head -20`

- [ ] **Step 3: Commit**

```bash
git add src/services/orchestrator/stepBuilder.ts
git commit -m "feat(image-story): add imageStory mode branch in stepBuilder"
```

---

## Task 9: Remotion Export Layer

**Files:**
- Create: `src/remotion/RemotionImageStoryLayer.tsx`
- Modify: `src/remotion/VideoComposition.tsx:73-109`

- [ ] **Step 1: Create `src/remotion/RemotionImageStoryLayer.tsx`**

```typescript
import React from 'react'
import { useCurrentFrame, Img, interpolate } from 'remotion'
import type { ImageStoryScene, ImageStoryWordTiming } from '@/types/imageStory'
import { computeRegion } from '@/types/imageStory'

interface RemotionImageStoryLayerProps {
  scenes: ImageStoryScene[]
  selectedAssets: Record<string, string>
  wordTimings: ImageStoryWordTiming[]
  canvasWidth: number
  canvasHeight: number
  fps: number
}

export const RemotionImageStoryLayer: React.FC<RemotionImageStoryLayerProps> = ({
  scenes,
  selectedAssets,
  wordTimings,
  canvasWidth,
  canvasHeight,
  fps,
}) => {
  const frame = useCurrentFrame()
  const preEntryFrames = Math.round((200 / 1000) * fps)

  // Find active scene for current frame
  const activeScene = scenes.find((scene) => {
    const sceneTimings = wordTimings.filter((t) =>
      scene.words.some((w) => w.text === t.word.text),
    )
    if (sceneTimings.length === 0) return false
    const start = sceneTimings[0].startFrame
    const end = sceneTimings[sceneTimings.length - 1].endFrame
    return frame >= start && frame <= end
  })

  if (!activeScene) return null

  // Render background
  const bgUrl = selectedAssets[`bg_${activeScene.id}`]

  // Collect active nouns at this frame
  const activeNounWords = activeScene.words.filter((w) => {
    if (w.role !== 'image_noun') return false
    const timing = wordTimings.find((t) => t.word.text === w.text)
    if (!timing) return false
    const entryFrame = Math.max(0, timing.startFrame - preEntryFrames)
    const sceneTimings = wordTimings.filter((t) =>
      activeScene.words.some((sw) => sw.text === t.word.text),
    )
    const exitFrame = sceneTimings.length > 0
      ? sceneTimings[sceneTimings.length - 1].endFrame
      : timing.endFrame + fps * 2
    return frame >= entryFrame && frame <= exitFrame
  })

  return (
    <>
      {/* Background */}
      {bgUrl && (
        <Img
          src={bgUrl}
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: canvasWidth,
            height: canvasHeight,
            objectFit: 'cover',
            zIndex: 0,
          }}
        />
      )}

      {/* Noun images */}
      {activeNounWords.map((nounWord, i) => {
        const assetUrl = selectedAssets[nounWord.text]
        if (!assetUrl) return null

        const timing = wordTimings.find((t) => t.word.text === nounWord.text)
        if (!timing) return null

        const entryFrame = Math.max(0, timing.startFrame - preEntryFrames)
        const region = computeRegion(i, activeNounWords.length, canvasWidth, canvasHeight)

        // Entry animation: fade + scale
        const opacity = interpolate(frame, [entryFrame, entryFrame + 8], [0, 1], {
          extrapolateLeft: 'clamp',
          extrapolateRight: 'clamp',
        })
        const scale = interpolate(frame, [entryFrame, entryFrame + 12], [0.7, 1], {
          extrapolateLeft: 'clamp',
          extrapolateRight: 'clamp',
        })

        return (
          <Img
            key={nounWord.text}
            src={assetUrl}
            style={{
              position: 'absolute',
              left: region.x,
              top: region.y,
              width: region.width,
              height: region.height,
              objectFit: 'contain',
              opacity,
              transform: `scale(${scale})`,
              zIndex: region.zIndex,
            }}
          />
        )
      })}
    </>
  )
}
```

- [ ] **Step 2: Register in `src/remotion/VideoComposition.tsx`**

Add import at the top:

```typescript
import { RemotionImageStoryLayer } from './RemotionImageStoryLayer'
```

Add to the props interface (find `VideoCompositionProps`):

```typescript
imageStoryScenes?: ImageStoryScene[]
imageStoryAssets?: Record<string, string>
imageStoryWordTimings?: ImageStoryWordTiming[]
```

Add conditional rendering in the JSX return, after background layers but before caption layers:

```typescript
{imageStoryScenes && imageStoryAssets && imageStoryWordTimings && (
  <RemotionImageStoryLayer
    scenes={imageStoryScenes}
    selectedAssets={imageStoryAssets}
    wordTimings={imageStoryWordTimings}
    canvasWidth={width}
    canvasHeight={height}
    fps={fps}
  />
)}
```

- [ ] **Step 3: Verify build compiles**

Run: `cd /Users/ihsanduru/autoStudio/AutoAnimation && npx tsc --noEmit 2>&1 | head -20`

- [ ] **Step 4: Commit**

```bash
git add src/remotion/RemotionImageStoryLayer.tsx src/remotion/VideoComposition.tsx
git commit -m "feat(image-story): add RemotionImageStoryLayer for video export"
```

---

## Task 10: PixiJS Preview Layer

**Files:**
- Create: `src/pixi/PixiImageStoryLayer.ts`
- Modify: `src/pixi/PixiCanvas.tsx:24-88`

- [ ] **Step 1: Create `src/pixi/PixiImageStoryLayer.ts`**

```typescript
import * as PIXI from 'pixi.js'
import { PixiTextureCache } from './PixiTextureCache'
import type { ImageStoryWordTiming } from '@/types/imageStory'
import { computeRegion } from '@/types/imageStory'
import { useImageStoryStore } from '@/stores/useImageStoryStore'

export class PixiImageStoryLayer {
  private container: PIXI.Container
  private sprites: Map<string, PIXI.Sprite> = new Map()
  private bgSprite: PIXI.Sprite | null = null
  private textureCache: PixiTextureCache
  private wordTimings: ImageStoryWordTiming[] = []
  private canvasWidth: number
  private canvasHeight: number
  private fps: number

  constructor(
    stage: PIXI.Container,
    textureCache: PixiTextureCache,
    canvasWidth: number,
    canvasHeight: number,
    fps: number,
  ) {
    this.container = new PIXI.Container()
    this.container.sortableChildren = true
    stage.addChild(this.container)
    this.textureCache = textureCache
    this.canvasWidth = canvasWidth
    this.canvasHeight = canvasHeight
    this.fps = fps
  }

  setZIndex(z: number) {
    this.container.zIndex = z
  }

  setWordTimings(timings: ImageStoryWordTiming[]) {
    this.wordTimings = timings
  }

  update(currentFrame: number) {
    const store = useImageStoryStore.getState()
    const selectedAssets = store.selectedAssets
    const plan = store.plan
    if (!plan || this.wordTimings.length === 0) return

    const preEntryFrames = Math.round((200 / 1000) * this.fps)

    // Find active scene
    const activeScene = plan.scenes.find((scene) => {
      const sceneTimings = this.wordTimings.filter((t) =>
        scene.words.some((w) => w.text === t.word.text),
      )
      if (sceneTimings.length === 0) return false
      return (
        currentFrame >= sceneTimings[0].startFrame &&
        currentFrame <= sceneTimings[sceneTimings.length - 1].endFrame
      )
    })

    // Hide all if no active scene
    if (!activeScene) {
      this.container.visible = false
      return
    }
    this.container.visible = true

    // Update background
    const bgUrl = selectedAssets[`bg_${activeScene.id}`]
    if (bgUrl && (!this.bgSprite || (this.bgSprite as PIXI.Sprite & { _srcUrl?: string })._srcUrl !== bgUrl)) {
      if (this.bgSprite) {
        this.container.removeChild(this.bgSprite)
        this.bgSprite.destroy()
      }
      const texture = this.textureCache.get(bgUrl)
      if (texture) {
        this.bgSprite = new PIXI.Sprite(texture)
        this.bgSprite.width = this.canvasWidth
        this.bgSprite.height = this.canvasHeight
        this.bgSprite.zIndex = 0
        ;(this.bgSprite as PIXI.Sprite & { _srcUrl?: string })._srcUrl = bgUrl
        this.container.addChild(this.bgSprite)
      }
    }

    // Update noun sprites
    const activeNouns = activeScene.words.filter((w) => {
      if (w.role !== 'image_noun') return false
      const timing = this.wordTimings.find((t) => t.word.text === w.text)
      if (!timing) return false
      const entryFrame = Math.max(0, timing.startFrame - preEntryFrames)
      return currentFrame >= entryFrame
    })

    // Show/hide sprites based on active nouns
    for (const [key, sprite] of this.sprites) {
      const isActive = activeNouns.some((n) => n.text === key)
      sprite.visible = isActive
    }

    // Create new sprites as needed
    for (const noun of activeNouns) {
      if (!this.sprites.has(noun.text)) {
        const url = selectedAssets[noun.text]
        if (!url) continue
        const texture = this.textureCache.get(url)
        if (!texture) continue

        const sprite = new PIXI.Sprite(texture)
        sprite.zIndex = 1 + activeNouns.indexOf(noun)
        this.sprites.set(noun.text, sprite)
        this.container.addChild(sprite)
      }

      // Position sprite using shared layout utility
      const sprite = this.sprites.get(noun.text)
      if (sprite) {
        const idx = activeNouns.indexOf(noun)
        const total = activeNouns.length
        const region = computeRegion(idx, total, this.canvasWidth, this.canvasHeight)
        sprite.x = region.x
        sprite.y = region.y
        sprite.width = region.width
        sprite.height = region.height
      }
    }
  }

  destroy() {
    for (const [, sprite] of this.sprites) {
      sprite.destroy()
    }
    this.sprites.clear()
    if (this.bgSprite) {
      this.bgSprite.destroy()
      this.bgSprite = null
    }
    this.container.destroy({ children: true })
  }
}
```

- [ ] **Step 2: Register in `src/pixi/PixiCanvas.tsx`**

Add import at top:

```typescript
import { PixiImageStoryLayer } from './PixiImageStoryLayer'
```

Inside the `useEffect` that creates layers (~line 39-50), add after existing layer creation:

```typescript
// Image Story layer (conditional)
// Word timings are injected after orchestrator completes searchFreepikAssets step.
// The layer subscribes to the store to pick up timings when they become available.
let imageStoryLayer: PixiImageStoryLayer | null = null
const imageStoryStore = useImageStoryStore.getState()
if (imageStoryStore.plan) {
  imageStoryLayer = new PixiImageStoryLayer(
    app.stage,
    textureCache,
    canvasWidth,
    canvasHeight,
    fps,
  )
  imageStoryLayer.setZIndex(4) // Between media (5) and shapes (6)
  renderLoop.addCustomLayer('imageStory', (frame: number) => {
    imageStoryLayer?.update(frame)
  })

  // Subscribe to orchestrator context for word timings
  // (populated by searchFreepikAssets step after TTS completes)
  const unsubTimings = useOrchestratorStore.subscribe(
    (state) => state.executionContext?.imageStoryWordTimings,
    (timings) => {
      if (timings && imageStoryLayer) {
        imageStoryLayer.setWordTimings(timings)
      }
    },
  )
  // Add to cleanup
}
```

In the cleanup return function (~line 76-86), add:

```typescript
imageStoryLayer?.destroy()
```

- [ ] **Step 3: Verify build compiles**

Run: `cd /Users/ihsanduru/autoStudio/AutoAnimation && npx tsc --noEmit 2>&1 | head -20`

- [ ] **Step 4: Commit**

```bash
git add src/pixi/PixiImageStoryLayer.ts src/pixi/PixiCanvas.tsx
git commit -m "feat(image-story): add PixiImageStoryLayer for editor preview"
```

---

## Task 11: UI Panel

**Files:**
- Create: `src/components/panels/ImageStoryPanel.tsx`

- [ ] **Step 1: Create `src/components/panels/ImageStoryPanel.tsx`**

Follow Cinema panel standard. Read `@skills/standardize-panel` and an existing panel like `CinemaStudioPanel.tsx` for exact patterns before writing. The panel contains:

- Text area for story input
- Style pills (6 options from `ImageStoryStyle`)
- Voice picker (reuse existing `VoiceSelector` component)
- "Generate Story" button
- Progress indicator during generation (reads `useImageStoryStore.currentStep`)

```typescript
import { useState } from 'react'
import { useImageStoryStore } from '@/stores/useImageStoryStore'
import { useOrchestratorStore } from '@/stores/useOrchestratorStore'
import type { ImageStoryStyle } from '@/types/imageStory'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { BookImage, Loader2 } from 'lucide-react'

const STYLES: { id: ImageStoryStyle; label: string }[] = [
  { id: 'Cartoon', label: 'Cartoon' },
  { id: 'Realistic', label: 'Realistic' },
  { id: 'Minimalist', label: 'Minimalist' },
  { id: 'Watercolor', label: 'Watercolor' },
  { id: 'Flat', label: 'Flat' },
  { id: '3D Render', label: '3D Render' },
]

export function ImageStoryPanel() {
  const [storyText, setStoryText] = useState('')
  const { style, setStyle, isGenerating, currentStep } = useImageStoryStore()
  const { startGeneration } = useOrchestratorStore()

  const handleGenerate = () => {
    if (!storyText.trim()) return
    // Must pass a full ClipPlan skeleton — startGeneration expects ClipPlan, not a partial object.
    // Read the existing create-clip flow to see how ClipPlan is constructed with canvas defaults.
    // At minimum, populate canvas (aspectRatio, fps, durationSeconds) and imageStory fields.
    startGeneration({
      canvas: {
        aspectRatio: '9:16',   // Default vertical (Shorts/Reels)
        fps: 30,
        durationSeconds: 30,
        mode: 'standard',
      },
      characters: [],
      dialogue: [],           // Will be populated by classifyImageStoryWords step
      textOverlays: [],
      shapes: [],
      captions: { enabled: true },
      imageStory: {
        mode: 'imageStory',
        style,
        scenes: [],
        ttsText: storyText.trim(),
      },
    })
  }

  return (
    <div className="flex flex-col gap-4 p-4">
      <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
        <BookImage className="h-4 w-4" />
        Image Story
      </div>

      <Textarea
        placeholder="Tell your story... e.g. 'I want you to imagine you are getting an ice cream, but your dad catches you'"
        value={storyText}
        onChange={(e) => setStoryText(e.target.value)}
        rows={5}
        disabled={isGenerating}
        className="resize-none"
      />

      <div>
        <div className="mb-2 text-xs font-medium text-muted-foreground">Style</div>
        <div className="flex flex-wrap gap-1.5">
          {STYLES.map((s) => (
            <button
              key={s.id}
              onClick={() => setStyle(s.id)}
              disabled={isGenerating}
              className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                style === s.id
                  ? 'bg-blue-600 text-white'
                  : 'bg-muted text-muted-foreground hover:bg-muted/80'
              }`}
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>

      <Button
        onClick={handleGenerate}
        disabled={!storyText.trim() || isGenerating}
        className="w-full"
      >
        {isGenerating ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            {currentStep || 'Generating...'}
          </>
        ) : (
          'Generate Story'
        )}
      </Button>
    </div>
  )
}
```

- [ ] **Step 2: Register panel tab in the orchestrator/create-clip panel**

Find the orchestrator panel or create-clip mode selector. Add `Image Story` as a mode option alongside `Talking Character` and `Math Animation`. When selected, render `<ImageStoryPanel />`.

The exact integration point depends on how the mode selector is structured — read the existing orchestrator panel component before editing.

- [ ] **Step 3: Verify build compiles**

Run: `cd /Users/ihsanduru/autoStudio/AutoAnimation && npx tsc --noEmit 2>&1 | head -20`

- [ ] **Step 4: Commit**

```bash
git add src/components/panels/ImageStoryPanel.tsx
git commit -m "feat(image-story): add ImageStoryPanel UI with text input and style pills"
```

---

## Task 12: Doc Updates

**Files:**
- Modify: `docs/codebase/03-services-subdirs.md`
- Modify: `docs/codebase/04-stores.md`
- Modify: `docs/codebase/12-remotion.md`
- Modify: `docs/codebase/15-server-utils.md`

- [ ] **Step 1: Update `docs/codebase/03-services-subdirs.md`**

Add under the orchestrator/steps section:

```markdown
### Image Story Steps

| File | Function | Purpose |
|------|----------|---------|
| `steps/classifyImageStoryWords.ts` | `executeClassifyImageStoryWords(plan, ctx)` | Gemini Flash word classification (noun/verb/filler), populates plan.dialogue for TTS |
| `steps/searchFreepikAssets.ts` | `executeSearchFreepikAssets(plan, ctx)` | Maps TTS word timestamps, parallel Freepik search with fallback chain |
| `steps/composeImageStoryScenes.ts` | `executeComposeImageStoryScenes(plan, ctx)` | Zone-based layout, entry/verb keyframes synced to word timing |
| `steps/setupFillerTypography.ts` | `executeSetupFillerTypography(plan, ctx)` | Kinetic text overlays for filler words with style-matched templates |

### Freepik Service

| File | Function | Purpose |
|------|----------|---------|
| `freepik/freepikService.ts` | `searchFreepik(request)` | Freepik API client via server proxy |
| `freepik/freepikService.ts` | `searchWithFallback(term, type, style)` | 3-tier fallback: styled → unstyled → simplified |
| `freepik/freepikService.ts` | `getSearchTerm(base, type)` | Query construction for background/element/character |
```

- [ ] **Step 2: Update `docs/codebase/04-stores.md`**

Add entry:

```markdown
### useImageStoryStore

| Field | Type | Purpose |
|-------|------|---------|
| `plan` | `ImageStoryPlan \| null` | Classified word plan with scenes |
| `assets` | `Record<string, FreepikAsset[]>` | Search results per term |
| `selectedAssets` | `Record<string, string>` | Chosen asset URL per noun |
| `style` | `ImageStoryStyle` | User-selected visual style |
| `isGenerating` | `boolean` | Generation in progress |
| `currentStep` | `string` | Current pipeline step label |

**Actions:** `setPlan`, `setAssets`, `selectAsset`, `swapAsset`, `setStyle`, `setGenerating`, `reset`
```

- [ ] **Step 3: Update `docs/codebase/12-remotion.md`**

Add entries for both rendering layers:

```markdown
### RemotionImageStoryLayer

Frame-based image composition for image story export. Renders scene backgrounds with crossfade, noun PNGs with entry animations, positioned by zone-based layout engine. Conditionally rendered in VideoComposition when `clipPlan.imageStory` is present.

### PixiImageStoryLayer

PixiJS layer for editor preview of image stories. Manages sprite pool, listens to word timing from playback clock, conditionally loads/shows sprites as words are spoken. Created in PixiCanvas.tsx when imageStory plan is active.
```

- [ ] **Step 4: Update `docs/codebase/15-server-utils.md`**

Add route entry:

```markdown
### Freepik Proxy (`server/routes/freepik.ts`)

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/proxy/freepik/status` | GET | Check if Freepik API key is configured |
| `/api/proxy/freepik/search` | POST | Search Freepik Resources API with rate limit retry (3x exponential backoff) |

**Auth:** `requireAuth` middleware. API key via `FREEPIK_API_KEY` env var, sent as `x-freepik-api-key` header.
```

- [ ] **Step 5: Commit**

```bash
git add docs/codebase/03-services-subdirs.md docs/codebase/04-stores.md docs/codebase/12-remotion.md docs/codebase/15-server-utils.md
git commit -m "docs: update codebase docs for image story generation feature"
```

---

## Task 13: Integration Test — End-to-End Smoke Test

- [ ] **Step 1: Manual smoke test**

1. Start dev server: `npm run dev` (frontend) + `cd server && npm run dev` (backend)
2. Open the editor, navigate to Create Clip
3. Select "Image Story" mode
4. Enter: "A dog runs across the park and catches a frisbee"
5. Select "Cartoon" style
6. Click "Generate Story"
7. Verify pipeline progresses through all steps without error
8. Verify canvas shows images appearing synced to voiceover
9. Verify filler text shows as kinetic typography
10. Export a short test clip and verify images render in the output

- [ ] **Step 2: Verify Freepik API key is configured**

Run: `curl -s http://localhost:3001/api/proxy/freepik/status | jq`
Expected: `{ "configured": true }`

- [ ] **Step 3: Commit any fixes from smoke test**

```bash
git add <specific-files-that-were-fixed>
git commit -m "fix(image-story): smoke test fixes"
```
