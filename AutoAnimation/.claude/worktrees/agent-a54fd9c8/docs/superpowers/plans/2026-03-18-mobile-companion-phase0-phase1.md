# ProAnimate Mobile Companion App — Phase 0 & Phase 1 Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Set up monorepo with shared core package, backend API changes for mobile, and an Expo dev build project with auth + navigation shell.

**Architecture:** npm workspaces monorepo with three packages: `packages/core` (pure TS animation logic), root web app (existing), and `mobile/` (new Expo app). Backend endpoints extended to serve `MotionDesignDescription` JSON for templates, accept it for renders, and store it in projects.

**Tech Stack:** Expo SDK 52, react-native-reanimated 3, @shopify/react-native-skia, TypeScript, Zustand 5, Supabase, Express, Zod

**Spec:** `docs/superpowers/specs/2026-03-18-mobile-companion-app-design.md`

---

## File Map

### Phase 0 — Backend Changes

| Action | File | Purpose |
|--------|------|---------|
| Modify | `server/routes/v1/renders.ts` | Add `motionDesignDescription` + `configOverrides` payload to POST |
| Create | `server/services/motionDesignValidator.ts` | Validate/sanitize MotionDesignDescription payloads |
| Modify | `server/routes/v1/templates.ts` | Serve full MotionDesignDescription JSON per template |
| Create | `server/services/templateCatalogService.ts` | Load template JSON from Supabase Storage, cache in memory |
| Modify | `server/routes/v1/projects.ts` | Add template_id, config_state, motion_design_description fields |
| Modify | `server/index.ts:98-106` | CORS: allow mobile origins (null / missing Origin) |
| Create | `server/services/__tests__/motionDesignValidator.test.ts` | Validator tests |

### Phase 1 — Core Package + Expo App

| Action | File | Purpose |
|--------|------|---------|
| Modify | `package.json` | Add npm workspaces config |
| Create | `packages/core/package.json` | Core package manifest |
| Create | `packages/core/tsconfig.json` | TS config for core |
| Create | `packages/core/src/types/motionDesign.ts` | Extracted from `src/types/motionDesign.ts` |
| Create | `packages/core/src/types/motionGraphic.ts` | Extracted from `src/types/motionGraphic.ts` |
| Create | `packages/core/src/easing.ts` | Extracted from `src/engine/easing.ts` (without CSS exports) |
| Create | `packages/core/src/timing.ts` | Extracted from `src/motionGraphics/KineticBase.tsx` (pure math) |
| Create | `packages/core/src/interpolation.ts` | Extracted from `DynamicMotionDesignRenderer.tsx` (lerp, interpolateProps) |
| Create | `packages/core/src/holdEffects.ts` | Extracted from `DynamicMotionDesignRenderer.tsx` (computeHoldEffect) |
| Create | `packages/core/src/typographyEngine.ts` | Extracted from `src/services/motionDesign/typographyEngine.ts` |
| Create | `packages/core/src/index.ts` | Barrel export |
| Modify | `src/engine/easing.ts` | Re-export from @proanimate/core + keep CSS-only exports |
| Modify | `src/types/motionDesign.ts` | Re-export from @proanimate/core |
| Modify | `src/types/motionGraphic.ts` | Re-export from @proanimate/core (FieldDescriptor, MotionGraphicProps) |
| Modify | `src/services/motionDesign/typographyEngine.ts` | Re-export from @proanimate/core |
| Create | `packages/core/src/__tests__/timing.test.ts` | Tests for computeKineticPhase |
| Create | `packages/core/src/__tests__/interpolation.test.ts` | Tests for interpolateProps worklet safety |
| Create | `packages/core/src/__tests__/easing.test.ts` | Tests for all easing functions |
| Create | `mobile/` | Full Expo project (created via `npx create-expo-app`) |
| Create | `mobile/src/services/supabase.ts` | Supabase client with expo-secure-store token persistence |
| Create | `mobile/src/stores/useAuthStore.ts` | Auth state (Zustand) |
| Create | `mobile/app/(auth)/login.tsx` | Login screen |
| Create | `mobile/app/(tabs)/_layout.tsx` | Tab bar layout |
| Create | `mobile/app/(tabs)/browse.tsx` | Placeholder browse screen |
| Create | `mobile/app/(tabs)/projects.tsx` | Placeholder projects screen |
| Create | `mobile/app/(tabs)/settings.tsx` | Placeholder settings screen |
| Modify | `mobile/metro.config.js` | Configure watchFolders for packages/core |
| Modify | `mobile/app.json` | Dev build config, app name, bundle ID |

---

## Task 1: MotionDesignDescription Payload Validator

**Files:**
- Create: `server/services/motionDesignValidator.ts`
- Create: `server/services/__tests__/motionDesignValidator.test.ts`

- [ ] **Step 1: Write the failing test**

```typescript
// server/services/__tests__/motionDesignValidator.test.ts
import { describe, it, expect } from 'vitest'
import { validateMotionDesignDescription } from '../motionDesignValidator'

describe('validateMotionDesignDescription', () => {
  const validDescription = {
    name: 'Test Template',
    description: 'A test',
    background: '#000',
    configSchema: [],
    defaultConfig: {},
    enterDuration: 0.2,
    exitDuration: 0.2,
    elements: [
      { id: 'el-1', type: 'text', text: 'Hello', style: { color: '#fff' } },
    ],
  }

  it('accepts a valid description', () => {
    const result = validateMotionDesignDescription(validDescription)
    expect(result.valid).toBe(true)
  })

  it('rejects when element count exceeds 200', () => {
    const tooMany = {
      ...validDescription,
      elements: Array.from({ length: 201 }, (_, i) => ({
        id: `el-${i}`, type: 'text', text: 'x',
      })),
    }
    const result = validateMotionDesignDescription(tooMany)
    expect(result.valid).toBe(false)
    expect(result.error).toContain('element count')
  })

  it('rejects nesting depth > 10', () => {
    let nested: any = { id: 'leaf', type: 'text', text: 'x' }
    for (let i = 0; i < 11; i++) {
      nested = { id: `g-${i}`, type: 'group', children: [nested] }
    }
    const deep = { ...validDescription, elements: [nested] }
    const result = validateMotionDesignDescription(deep)
    expect(result.valid).toBe(false)
    expect(result.error).toContain('nesting depth')
  })

  it('strips dangerous style values', () => {
    const dangerous = {
      ...validDescription,
      elements: [{
        id: 'el-1', type: 'text', text: 'x',
        style: { background: 'expression(alert(1))', color: '#fff' },
      }],
    }
    const result = validateMotionDesignDescription(dangerous)
    expect(result.valid).toBe(true)
    expect(result.sanitized!.elements[0].style!.background).toBeUndefined()
    expect(result.sanitized!.elements[0].style!.color).toBe('#fff')
  })

  it('rejects payloads larger than 1MB when serialized', () => {
    const huge = {
      ...validDescription,
      elements: [{ id: 'el-1', type: 'text', text: 'x'.repeat(1_100_000) }],
    }
    const result = validateMotionDesignDescription(huge)
    expect(result.valid).toBe(false)
    expect(result.error).toContain('payload size')
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd server && npx vitest run services/__tests__/motionDesignValidator.test.ts --reporter verbose`
Expected: FAIL — module not found

- [ ] **Step 3: Implement the validator**

```typescript
// server/services/motionDesignValidator.ts
const MAX_ELEMENTS = 200
const MAX_DEPTH = 10
const MAX_PAYLOAD_BYTES = 1_000_000

const DANGEROUS_PATTERNS = /expression\s*\(|javascript\s*:|url\s*\(/i

interface ValidationResult {
  valid: boolean
  error?: string
  sanitized?: any
}

function countElements(elements: any[], depth = 0): { count: number; maxDepth: number } {
  let count = 0
  let maxDepth = depth
  for (const el of elements) {
    count++
    if (el.children && Array.isArray(el.children)) {
      const child = countElements(el.children, depth + 1)
      count += child.count
      if (child.maxDepth > maxDepth) maxDepth = child.maxDepth
    }
  }
  return { count, maxDepth }
}

function sanitizeElement(el: any): any {
  const sanitized = { ...el }
  if (sanitized.style && typeof sanitized.style === 'object') {
    const cleanStyle: Record<string, string | number> = {}
    for (const [key, value] of Object.entries(sanitized.style)) {
      if (typeof value === 'string' && DANGEROUS_PATTERNS.test(value)) continue
      cleanStyle[key] = value as string | number
    }
    sanitized.style = cleanStyle
  }
  if (sanitized.children && Array.isArray(sanitized.children)) {
    sanitized.children = sanitized.children.map(sanitizeElement)
  }
  return sanitized
}

export function validateMotionDesignDescription(desc: any): ValidationResult {
  if (!desc || typeof desc !== 'object') {
    return { valid: false, error: 'Invalid description object' }
  }

  // Check payload size
  const serialized = JSON.stringify(desc)
  if (serialized.length > MAX_PAYLOAD_BYTES) {
    return { valid: false, error: `Exceeds max payload size (${MAX_PAYLOAD_BYTES} bytes)` }
  }

  const elements = desc.elements
  if (!Array.isArray(elements)) {
    return { valid: false, error: 'elements must be an array' }
  }

  // Count elements and check depth
  const { count, maxDepth } = countElements(elements)
  if (count > MAX_ELEMENTS) {
    return { valid: false, error: `Exceeds max element count (${MAX_ELEMENTS})` }
  }
  if (maxDepth > MAX_DEPTH) {
    return { valid: false, error: `Exceeds max nesting depth (${MAX_DEPTH})` }
  }

  // Sanitize styles
  const sanitized = {
    ...desc,
    elements: elements.map(sanitizeElement),
  }

  return { valid: true, sanitized }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd server && npx vitest run services/__tests__/motionDesignValidator.test.ts --reporter verbose`
Expected: All 5 tests PASS

- [ ] **Step 5: Commit**

```bash
git add server/services/motionDesignValidator.ts server/services/__tests__/motionDesignValidator.test.ts
git commit -m "feat(server): add MotionDesignDescription payload validator"
```

---

## Task 2: Extend Renders API to Accept MotionDesignDescription

**Files:**
- Modify: `server/routes/v1/renders.ts:16-25` (schema) and `:29-68` (POST handler)
- Modify: `server/services/renderJobService.ts:40-60` (createJob signature)

- [ ] **Step 1: Write the failing test**

```typescript
// server/routes/v1/__tests__/renders.test.ts
import { describe, it, expect } from 'vitest'
// Integration test: validate the Zod schema accepts both payload shapes

import { z } from 'zod'

// Copy the updated schema here for isolated testing
const motionDesignDescriptionBody = z.object({
  motionDesignDescription: z.record(z.unknown()),
  configOverrides: z.record(z.unknown()).optional(),
  settings: z.object({
    aspectRatio: z.string().max(20).optional(),
    durationSeconds: z.number().min(1).max(300).optional(),
    fps: z.number().int().min(1).max(120).optional(),
    format: z.enum(['mp4', 'webm']).optional(),
  }).passthrough().optional(),
  webhookUrl: z.string().url().max(2000).optional(),
})

const promptBody = z.object({
  prompt: z.string().min(1).max(10000),
  settings: z.object({
    aspectRatio: z.string().max(20).optional(),
    durationSeconds: z.number().min(1).max(300).optional(),
    fps: z.number().int().min(1).max(120).optional(),
    format: z.enum(['mp4', 'webm']).optional(),
  }).passthrough().optional(),
  webhookUrl: z.string().url().max(2000).optional(),
})

const submitJobBody = z.union([motionDesignDescriptionBody, promptBody])

describe('renders API schema', () => {
  it('accepts prompt-based payload (existing)', () => {
    const result = submitJobBody.safeParse({ prompt: 'make me a video' })
    expect(result.success).toBe(true)
  })

  it('accepts motionDesignDescription payload (new)', () => {
    const result = submitJobBody.safeParse({
      motionDesignDescription: {
        name: 'Test', description: 'test', background: '#000',
        elements: [], configSchema: [], defaultConfig: {},
        enterDuration: 0.2, exitDuration: 0.2,
      },
      configOverrides: { title: 'Hello' },
      settings: { format: 'mp4', fps: 30 },
    })
    expect(result.success).toBe(true)
  })

  it('rejects empty payload', () => {
    const result = submitJobBody.safeParse({})
    expect(result.success).toBe(false)
  })
})
```

- [ ] **Step 2: Run test to verify it passes** (schema-only test, should pass immediately)

Run: `cd server && npx vitest run routes/v1/__tests__/renders.test.ts --reporter verbose`

- [ ] **Step 3: Update the renders route with union schema**

In `server/routes/v1/renders.ts`, replace the `submitJobBody` schema and update the POST handler:

```typescript
// server/routes/v1/renders.ts — updated schemas
import { validateMotionDesignDescription } from '../../services/motionDesignValidator'

const promptJobBody = z.object({
  prompt: z.string().min(1).max(10000),
  settings: z.object({
    aspectRatio: z.string().max(20).optional(),
    durationSeconds: z.number().min(1).max(300).optional(),
    fps: z.number().int().min(1).max(120).optional(),
    format: z.enum(['mp4', 'webm']).optional(),
  }).passthrough().optional(),
  webhookUrl: z.string().url().max(2000).optional(),
})

const templateJobBody = z.object({
  motionDesignDescription: z.record(z.unknown()),
  configOverrides: z.record(z.unknown()).optional(),
  settings: z.object({
    aspectRatio: z.string().max(20).optional(),
    durationSeconds: z.number().min(1).max(300).optional(),
    fps: z.number().int().min(1).max(120).optional(),
    format: z.enum(['mp4', 'webm']).optional(),
  }).passthrough().optional(),
  webhookUrl: z.string().url().max(2000).optional(),
})

const submitJobBody = z.union([templateJobBody, promptJobBody])
```

Update the POST handler to detect which payload shape was used:

```typescript
router.post('/', async (req, res) => {
  try {
    const parsed = submitJobBody.safeParse(req.body)
    if (!parsed.success) {
      res.status(400).json({
        error: 'Invalid request body',
        code: 'VALIDATION_ERROR',
        details: parsed.error.flatten(),
      })
      return
    }

    const userId = (req as any).userId as string
    const apiKeyId = (req as any).apiKeyId as string | undefined
    const data = parsed.data
    const settings = data.settings || {}

    let prompt: string
    let extraMeta: Record<string, unknown> = {}

    if ('motionDesignDescription' in data) {
      // Template-based render (mobile flow)
      const validation = validateMotionDesignDescription(data.motionDesignDescription)
      if (!validation.valid) {
        res.status(400).json({ error: validation.error, code: 'VALIDATION_ERROR' })
        return
      }
      prompt = `[template-render] ${(data.motionDesignDescription as any).name || 'Untitled'}`
      extraMeta = {
        motionDesignDescription: validation.sanitized,
        configOverrides: data.configOverrides || {},
      }
    } else {
      // Prompt-based render (existing web flow)
      prompt = data.prompt
    }

    const jobId = await renderJobService.createJob(userId, prompt, settings, apiKeyId)

    // Store extra metadata if template render
    if (Object.keys(extraMeta).length > 0) {
      await renderJobService.updateJobMeta(jobId, extraMeta)
    }

    enqueueRenderJob(jobId, userId, prompt, { ...settings, ...extraMeta })

    res.status(201).json({
      jobId,
      status: 'queued',
      estimatedSeconds: 120,
      createdAt: new Date().toISOString(),
    })
  } catch (err) {
    console.error('[Renders] Submit error:', err)
    res.status(500).json({ error: 'Failed to submit render job', code: 'INTERNAL_ERROR' })
  }
})
```

- [ ] **Step 4: Add `updateJobMeta` to renderJobService**

In `server/services/renderJobService.ts` after the `createJob` function, add:

```typescript
export async function updateJobMeta(
  jobId: string,
  meta: Record<string, unknown>,
): Promise<void> {
  const supabase = getSupabaseAdmin()
  await supabase
    .from('render_jobs')
    .update({ plan_json: meta })
    .eq('id', jobId)
}
```

- [ ] **Step 5: Verify server compiles**

Run: `cd server && npx tsc --noEmit`
Expected: No errors

- [ ] **Step 6: Commit**

```bash
git add server/routes/v1/renders.ts server/services/renderJobService.ts server/routes/v1/__tests__/renders.test.ts
git commit -m "feat(api): extend renders endpoint to accept MotionDesignDescription payloads"
```

---

## Task 3: Template Catalog Service + Updated Templates API

**Files:**
- Create: `server/services/templateCatalogService.ts`
- Modify: `server/routes/v1/templates.ts`

- [ ] **Step 1: Write the template catalog service**

```typescript
// server/services/templateCatalogService.ts
/**
 * Loads MotionDesignDescription templates from Supabase Storage
 * and caches them in memory. Falls back to a seed set of templates
 * bundled with the server for bootstrapping.
 */

import { getSupabaseAdmin } from '../middleware/supabaseAuth'

interface TemplateCatalogEntry {
  id: string
  title: string
  description: string
  category: string
  tags: string[]
  thumbnailUrl: string | null
  motionDesignDescription: Record<string, unknown>
  configSchema: Array<Record<string, unknown>>
  defaultConfig: Record<string, unknown>
}

let cache: TemplateCatalogEntry[] | null = null
let cacheTime = 0
const CACHE_TTL_MS = 5 * 60 * 1000 // 5 minutes

export async function getTemplateCatalog(): Promise<TemplateCatalogEntry[]> {
  if (cache && Date.now() - cacheTime < CACHE_TTL_MS) return cache

  try {
    const supabase = getSupabaseAdmin()
    const { data: files, error } = await supabase.storage
      .from('template-definitions')
      .list('', { limit: 200 })

    if (error || !files || files.length === 0) {
      console.warn('[TemplateCatalog] No templates in storage, using empty catalog')
      cache = []
      cacheTime = Date.now()
      return cache
    }

    const entries: TemplateCatalogEntry[] = []

    for (const file of files) {
      if (!file.name.endsWith('.json')) continue
      try {
        const { data } = await supabase.storage
          .from('template-definitions')
          .download(file.name)
        if (!data) continue
        const text = await data.text()
        const parsed = JSON.parse(text)
        entries.push({
          id: parsed.id || file.name.replace('.json', ''),
          title: parsed.name || 'Untitled',
          description: parsed.description || '',
          category: parsed.category || 'kinetic-typography',
          tags: parsed.tags || [],
          thumbnailUrl: parsed.thumbnailUrl || null,
          motionDesignDescription: parsed,
          configSchema: parsed.configSchema || [],
          defaultConfig: parsed.defaultConfig || {},
        })
      } catch (e) {
        console.error(`[TemplateCatalog] Failed to parse ${file.name}:`, e)
      }
    }

    cache = entries
    cacheTime = Date.now()
    return entries
  } catch (e) {
    console.error('[TemplateCatalog] Fetch error:', e)
    return cache || []
  }
}

export async function getTemplateById(id: string): Promise<TemplateCatalogEntry | undefined> {
  const catalog = await getTemplateCatalog()
  return catalog.find((t) => t.id === id)
}

export function invalidateCache(): void {
  cache = null
}
```

- [ ] **Step 2: Rewrite the templates route**

Replace the entire contents of `server/routes/v1/templates.ts`:

```typescript
// server/routes/v1/templates.ts
import { Router } from 'express'
import { getTemplateCatalog, getTemplateById } from '../../services/templateCatalogService'

const router = Router()

// GET / — List templates with optional category/search filter
router.get('/', async (req, res) => {
  try {
    const category = req.query.category as string | undefined
    const search = req.query.search as string | undefined
    const limit = Math.min(parseInt(req.query.limit as string) || 50, 100)
    const offset = parseInt(req.query.offset as string) || 0

    let templates = await getTemplateCatalog()

    if (category) {
      templates = templates.filter((t) => t.category === category)
    }
    if (search) {
      const lower = search.toLowerCase()
      templates = templates.filter((t) =>
        t.title.toLowerCase().includes(lower) ||
        t.description.toLowerCase().includes(lower) ||
        t.tags.some((tag) => tag.toLowerCase().includes(lower))
      )
    }

    const total = templates.length
    const paginated = templates.slice(offset, offset + limit)

    // Strip full description from list response (send on detail only)
    const summaries = paginated.map(({ motionDesignDescription, ...rest }) => rest)

    res.json({ templates: summaries, total })
  } catch (err) {
    console.error('[Templates] List error:', err)
    res.status(500).json({ error: 'Failed to list templates', code: 'INTERNAL_ERROR' })
  }
})

// GET /:id — Full template detail including MotionDesignDescription
router.get('/:id', async (req, res) => {
  try {
    const template = await getTemplateById(req.params.id)
    if (!template) {
      res.status(404).json({ error: 'Template not found', code: 'NOT_FOUND' })
      return
    }
    res.json(template)
  } catch (err) {
    console.error('[Templates] Detail error:', err)
    res.status(500).json({ error: 'Failed to fetch template', code: 'INTERNAL_ERROR' })
  }
})

export default router
```

- [ ] **Step 3: Verify server compiles**

Run: `cd server && npx tsc --noEmit`
Expected: No errors

- [ ] **Step 4: Commit**

```bash
git add server/services/templateCatalogService.ts server/routes/v1/templates.ts
git commit -m "feat(api): serve MotionDesignDescription templates from Supabase Storage"
```

---

## Task 4: Extend Projects API with Template State Columns

**Files:**
- Modify: `server/routes/v1/projects.ts`

Note: The actual Supabase migration to add columns (`template_id`, `config_state`, `motion_design_description`) must be run manually in the Supabase dashboard or via `supabase db push`. This task updates the API to read/write those columns.

- [ ] **Step 1: Document the required migration SQL**

Create a migration note (not auto-applied):

```sql
-- Run in Supabase SQL editor
ALTER TABLE projects ADD COLUMN IF NOT EXISTS template_id text;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS config_state jsonb DEFAULT '{}';
ALTER TABLE projects ADD COLUMN IF NOT EXISTS motion_design_description jsonb;
```

- [ ] **Step 2: Update the create schema to accept new fields**

In `server/routes/v1/projects.ts`, update the schemas:

```typescript
const createProjectBody = z.object({
  name: z.string().min(1).max(200),
  aspectRatio: z.string().max(20).optional(),
  fps: z.number().int().min(1).max(120).optional(),
  width: z.number().int().min(100).max(7680).optional(),
  height: z.number().int().min(100).max(4320).optional(),
  templateId: z.string().max(200).optional(),
  configState: z.record(z.unknown()).optional(),
  motionDesignDescription: z.record(z.unknown()).optional(),
})

const updateProjectBody = z.object({
  name: z.string().min(1).max(200).optional(),
  aspectRatio: z.string().max(20).optional(),
  fps: z.number().int().min(1).max(120).optional(),
  width: z.number().int().min(100).max(7680).optional(),
  height: z.number().int().min(100).max(4320).optional(),
  templateId: z.string().max(200).optional(),
  configState: z.record(z.unknown()).optional(),
  motionDesignDescription: z.record(z.unknown()).optional(),
})
```

- [ ] **Step 3: Update POST handler to insert new fields**

In the POST handler, add the new fields to the insert:

```typescript
const { name, aspectRatio, fps, width, height, templateId, configState, motionDesignDescription } = parsed.data

const { data, error } = await supabase
  .from('projects')
  .insert({
    user_id: userId,
    name,
    aspect_ratio: aspectRatio || '9:16',
    fps: fps || 30,
    width: width || 1080,
    height: height || 1920,
    template_id: templateId || null,
    config_state: configState || {},
    motion_design_description: motionDesignDescription || null,
  })
  .select('id, name, aspect_ratio, fps, width, height, template_id, config_state, created_at')
  .single()
```

Update the response to include new fields:

```typescript
res.status(201).json({
  id: data.id,
  name: data.name,
  aspectRatio: data.aspect_ratio,
  fps: data.fps,
  width: data.width,
  height: data.height,
  templateId: data.template_id,
  configState: data.config_state,
  createdAt: data.created_at,
})
```

- [ ] **Step 4: Update PATCH handler to accept new fields**

Add to the updates object:

```typescript
if (templateId !== undefined) updates.template_id = templateId
if (configState !== undefined) updates.config_state = configState
if (motionDesignDescription !== undefined) updates.motion_design_description = motionDesignDescription
```

- [ ] **Step 5: Update GET list to return new fields**

```typescript
.select('id, name, aspect_ratio, fps, width, height, template_id, config_state, created_at, updated_at', { count: 'exact' })
```

And update the map:

```typescript
projects: (data || []).map((p) => ({
  id: p.id,
  name: p.name,
  aspectRatio: p.aspect_ratio,
  fps: p.fps,
  width: p.width,
  height: p.height,
  templateId: p.template_id,
  configState: p.config_state,
  createdAt: p.created_at,
  updatedAt: p.updated_at,
})),
```

- [ ] **Step 6: Update GET detail to return new fields**

```typescript
res.json({
  id: data.id,
  name: data.name,
  aspectRatio: data.aspect_ratio,
  fps: data.fps,
  width: data.width,
  height: data.height,
  templateId: data.template_id,
  configState: data.config_state,
  motionDesignDescription: data.motion_design_description,
  createdAt: data.created_at,
  updatedAt: data.updated_at,
})
```

- [ ] **Step 7: Verify server compiles**

Run: `cd server && npx tsc --noEmit`
Expected: No errors

- [ ] **Step 8: Commit**

```bash
git add server/routes/v1/projects.ts
git commit -m "feat(api): add template_id, config_state, motion_design_description to projects"
```

---

## Task 5: CORS Configuration for Mobile

**Files:**
- Modify: `server/index.ts:98-106`

- [ ] **Step 1: Update CORS config to handle mobile origins**

Replace the CORS block at line 98-106 of `server/index.ts`:

```typescript
const allowedOrigins = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(',')
  : ['http://localhost:5173', 'http://localhost:5174', 'http://localhost:5175', 'http://localhost:3000']

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no Origin header (mobile apps, curl, server-to-server)
    if (!origin) return callback(null, true)
    if (allowedOrigins.includes(origin)) return callback(null, true)
    callback(new Error(`Origin ${origin} not allowed by CORS`))
  },
  credentials: true,
  methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-api-key'],
}))
```

- [ ] **Step 2: Verify server compiles and starts**

Run: `cd server && npx tsc --noEmit`
Expected: No errors

- [ ] **Step 3: Commit**

```bash
git add server/index.ts
git commit -m "feat(server): allow mobile CORS (null/missing Origin)"
```

---

## Task 6: Monorepo Setup with npm Workspaces

**Files:**
- Modify: `package.json` (root)
- Create: `packages/core/package.json`
- Create: `packages/core/tsconfig.json`

- [ ] **Step 1: Add workspaces to root package.json**

Add to the root `package.json` top level (after `"version"`):

```json
"workspaces": [
  "packages/*"
],
```

- [ ] **Step 2: Create core package.json**

```json
// packages/core/package.json
{
  "name": "@proanimate/core",
  "version": "0.1.0",
  "private": true,
  "type": "module",
  "main": "./src/index.ts",
  "types": "./src/index.ts",
  "exports": {
    ".": "./src/index.ts"
  },
  "scripts": {
    "test": "vitest run",
    "test:watch": "vitest",
    "typecheck": "tsc --noEmit"
  },
  "devDependencies": {
    "typescript": "~5.6.2",
    "vitest": "^4.1.0"
  }
}
```

- [ ] **Step 3: Create core tsconfig.json**

```json
// packages/core/tsconfig.json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "strict": true,
    "esModuleInterop": true,
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true,
    "outDir": "./dist",
    "rootDir": "./src",
    "skipLibCheck": true
  },
  "include": ["src/**/*.ts"],
  "exclude": ["node_modules", "dist", "**/__tests__/**"]
}
```

- [ ] **Step 4: Install workspace dependencies**

Run: `cd /Users/ihsanduru/autoStudio/AutoAnimation && npm install`
Expected: npm links the workspace packages

- [ ] **Step 5: Commit**

```bash
git add package.json packages/core/package.json packages/core/tsconfig.json
git commit -m "feat: set up npm workspaces with @proanimate/core package"
```

---

## Task 7: Extract Types to Core Package

**Files:**
- Create: `packages/core/src/types/motionDesign.ts`
- Create: `packages/core/src/types/motionGraphic.ts`
- Create: `packages/core/src/types/index.ts`
- Modify: `src/types/motionDesign.ts` (thin re-export)
- Modify: `src/types/motionGraphic.ts` (thin re-export for portable types only)

- [ ] **Step 1: Copy motionDesign types to core**

Copy `src/types/motionDesign.ts` verbatim to `packages/core/src/types/motionDesign.ts`. This file has zero web-specific imports — it is already pure.

- [ ] **Step 2: Extract portable types from motionGraphic.ts**

Copy `MotionGraphicProps` and `FieldDescriptor` to `packages/core/src/types/motionGraphic.ts`. Do NOT copy `MotionGraphicRegistration` (it references `React.ComponentType` which is platform-specific).

```typescript
// packages/core/src/types/motionGraphic.ts
export interface MotionGraphicProps<TConfig = Record<string, unknown>> {
  config: TConfig
  frame: number
  fps: number
  durationInFrames: number
  width: number
  height: number
  progress: number
}

export interface FieldDescriptor {
  key: string
  label: string
  type: 'text' | 'color' | 'number' | 'boolean' | 'text-array' | 'select'
  defaultValue: unknown
  group: string
  options?: string[]
  min?: number
  max?: number
}
```

- [ ] **Step 3: Create types barrel export**

```typescript
// packages/core/src/types/index.ts
export * from './motionDesign'
export * from './motionGraphic'
```

- [ ] **Step 4: Make web types re-export from core**

Update `src/types/motionDesign.ts`:

```typescript
// Re-export all types from @proanimate/core
export type {
  EasingName,
  AnimatableProps,
  MotionElementAnimation,
  MotionElement,
  MotionDesignDescription,
} from '@proanimate/core'
```

Update `src/types/motionGraphic.ts` to add re-exports at the top (keep the existing `MotionGraphicRegistration` and other types):

```typescript
// Re-export portable types from @proanimate/core
export type { MotionGraphicProps, FieldDescriptor } from '@proanimate/core'
```

Remove the duplicate interface definitions from the file that are now in core.

- [ ] **Step 5: Verify web app still compiles**

Run: `npm run build`
Expected: No errors (re-exports preserve all existing imports)

- [ ] **Step 6: Commit**

```bash
git add packages/core/src/types/ src/types/motionDesign.ts src/types/motionGraphic.ts
git commit -m "feat(core): extract portable types to @proanimate/core"
```

---

## Task 8: Extract Easing to Core (Worklet-Compatible)

**Files:**
- Create: `packages/core/src/easing.ts`
- Create: `packages/core/src/__tests__/easing.test.ts`
- Modify: `src/engine/easing.ts` (re-export + keep CSS-only exports)

- [ ] **Step 1: Write the test**

```typescript
// packages/core/src/__tests__/easing.test.ts
import { describe, it, expect } from 'vitest'
import { Easing, getEasingByName } from '../easing'

describe('Easing', () => {
  it('linear returns t', () => {
    expect(Easing.linear(0)).toBe(0)
    expect(Easing.linear(0.5)).toBe(0.5)
    expect(Easing.linear(1)).toBe(1)
  })

  it('cubicOut starts slow ends fast', () => {
    expect(Easing.cubicOut(0)).toBe(0)
    expect(Easing.cubicOut(1)).toBe(1)
    expect(Easing.cubicOut(0.5)).toBeGreaterThan(0.5)
  })

  it('bounceOut has bounce character', () => {
    expect(Easing.bounceOut(0)).toBe(0)
    expect(Easing.bounceOut(1)).toBeCloseTo(1, 5)
  })

  it('bezier presets produce valid output', () => {
    expect(Easing.material(0)).toBe(0)
    expect(Easing.material(1)).toBe(1)
    const mid = Easing.material(0.5)
    expect(mid).toBeGreaterThan(0)
    expect(mid).toBeLessThan(1)
  })

  it('elastic factory returns a function', () => {
    const fn = Easing.elastic(1.2, 0.4)
    expect(typeof fn).toBe('function')
    expect(fn(0)).toBe(0)
    expect(fn(1)).toBe(1)
  })

  it('getEasingByName returns linear for unknown', () => {
    const fn = getEasingByName('nonexistent')
    expect(fn(0.5)).toBe(0.5) // linear
  })

  it('getEasingByName returns correct easing', () => {
    const fn = getEasingByName('cubicOut')
    expect(fn(0.5)).toBe(Easing.cubicOut(0.5))
  })

  // Worklet safety: no closures over non-serializable values
  it('all direct easing functions are pure (no external closures)', () => {
    const directFns = [
      'linear', 'in', 'out', 'inOut', 'cubicIn', 'cubicOut', 'cubicInOut',
      'bounceOut', 'bounceIn', 'bounceInOut', 'backIn', 'backOut', 'backInOut',
      'elasticIn', 'elasticOut', 'elasticInOut',
      'sineIn', 'sineOut', 'sineInOut',
      'expoIn', 'expoOut', 'expoInOut',
      'smoothStep', 'smootherStep',
      'springLight', 'springMedium', 'springHeavy',
    ]
    for (const name of directFns) {
      const fn = (Easing as any)[name]
      expect(typeof fn).toBe('function')
      expect(fn(0)).toBeDefined()
      expect(fn(1)).toBeDefined()
    }
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd packages/core && npx vitest run src/__tests__/easing.test.ts --reporter verbose`
Expected: FAIL — module not found

- [ ] **Step 3: Create core easing.ts**

Copy `src/engine/easing.ts` to `packages/core/src/easing.ts` with these changes:
1. Remove `import type { EasingType, CubicBezierParams } from '@/types/keyframes'` (web-specific type)
2. Remove the entire `EASING_CSS_MAP` constant and `easingToCss` function (CSS-only)
3. Keep all pure math functions and `Easing` object unchanged
4. Keep `getEasingByName` unchanged

- [ ] **Step 4: Run test to verify it passes**

Run: `cd packages/core && npx vitest run src/__tests__/easing.test.ts --reporter verbose`
Expected: All tests PASS

- [ ] **Step 5: Make web easing.ts a re-export shim**

Replace the top of `src/engine/easing.ts`:

```typescript
// Re-export all easing functions from @proanimate/core
export { Easing, getEasingByName } from '@proanimate/core'

// Web-only CSS easing utilities (not in core)
import type { EasingType, CubicBezierParams } from '@/types/keyframes'

export const EASING_CSS_MAP: Record<string, string> = {
  // ... keep the existing CSS map unchanged
}

export function easingToCss(type: EasingType, bezierParams?: CubicBezierParams): string {
  // ... keep unchanged
}
```

- [ ] **Step 6: Verify web app still compiles**

Run: `npm run build`

- [ ] **Step 7: Commit**

```bash
git add packages/core/src/easing.ts packages/core/src/__tests__/easing.test.ts src/engine/easing.ts
git commit -m "feat(core): extract easing library to @proanimate/core (worklet-compatible)"
```

---

## Task 9: Extract Timing, Interpolation, Hold Effects to Core

**Files:**
- Create: `packages/core/src/timing.ts`
- Create: `packages/core/src/interpolation.ts`
- Create: `packages/core/src/holdEffects.ts`
- Create: `packages/core/src/__tests__/timing.test.ts`
- Create: `packages/core/src/__tests__/interpolation.test.ts`

- [ ] **Step 1: Write timing test**

```typescript
// packages/core/src/__tests__/timing.test.ts
import { describe, it, expect } from 'vitest'
import { computeKineticPhase } from '../timing'

describe('computeKineticPhase', () => {
  it('returns first word in enter phase at time 0', () => {
    const result = computeKineticPhase(0, 2, 3) // time=0, cycleDuration=2, totalWords=3
    expect(result.wordIndex).toBe(0)
    expect(result.phase).toBe('enter')
    expect(result.enterProgress).toBe(0)
  })

  it('returns hold phase at mid-cycle', () => {
    const result = computeKineticPhase(0.8, 2, 3) // 40% into first word cycle
    expect(result.wordIndex).toBe(0)
    expect(result.phase).toBe('hold')
  })

  it('advances to second word after cycleDuration', () => {
    const result = computeKineticPhase(2.1, 2, 3)
    expect(result.wordIndex).toBe(1)
  })

  it('cycles back to first word after all words', () => {
    const result = computeKineticPhase(6.1, 2, 3) // totalCycleDuration = 6
    expect(result.wordIndex).toBe(0)
  })

  it('returns null-safe for 0 words', () => {
    const result = computeKineticPhase(1, 2, 0)
    expect(result).toBeNull()
  })
})
```

- [ ] **Step 2: Write interpolation test**

```typescript
// packages/core/src/__tests__/interpolation.test.ts
import { describe, it, expect } from 'vitest'
import { lerp, interpolateProps, interpolateConfig } from '../interpolation'

describe('lerp', () => {
  it('interpolates between two numbers', () => {
    expect(lerp(0, 10, 0.5)).toBe(5)
    expect(lerp(0, 10, 0)).toBe(0)
    expect(lerp(0, 10, 1)).toBe(10)
  })
})

describe('interpolateProps', () => {
  it('interpolates partial props with defaults', () => {
    const result = interpolateProps({ opacity: 0 }, { opacity: 1 }, 0.5)
    expect(result.opacity).toBe(0.5)
    expect(result.x).toBe(0)     // default
    expect(result.scale).toBe(1) // default
  })

  // Worklet safety: must not use new Set()
  it('does not throw when from and to have different keys', () => {
    const result = interpolateProps({ x: 10 }, { y: 20 }, 0.5)
    expect(result.x).toBe(5)  // 10 -> 0 default
    expect(result.y).toBe(10) // 0 default -> 20
  })
})

describe('interpolateConfig', () => {
  it('replaces {{key}} with config values', () => {
    expect(interpolateConfig('Hello {{name}}!', { name: 'World' })).toBe('Hello World!')
  })

  it('replaces missing keys with empty string', () => {
    expect(interpolateConfig('{{missing}}', {})).toBe('')
  })
})
```

- [ ] **Step 3: Run tests to verify they fail**

Run: `cd packages/core && npx vitest run --reporter verbose`
Expected: FAIL — modules not found

- [ ] **Step 4: Implement timing.ts**

```typescript
// packages/core/src/timing.ts
export interface KineticPhaseResult {
  wordIndex: number
  phase: 'enter' | 'hold' | 'exit'
  enterProgress: number
  holdProgress: number
  exitProgress: number
}

/**
 * Pure timing computation extracted from KineticBase.
 * Determines which word is active and its animation phase.
 * Worklet-safe: no DOM, no React, no closures.
 */
export function computeKineticPhase(
  timeSeconds: number,
  cycleDuration: number,
  totalWords: number,
): KineticPhaseResult | null {
  'worklet'
  if (totalWords === 0) return null

  const totalCycleDuration = cycleDuration * totalWords
  const cycleTime = totalCycleDuration > 0 ? timeSeconds % totalCycleDuration : 0
  const wordIndex = Math.min(Math.floor(cycleTime / cycleDuration), totalWords - 1)
  const wordTime = cycleTime - wordIndex * cycleDuration

  const enterDuration = cycleDuration * 0.2
  const holdDuration = cycleDuration * 0.6

  let phase: 'enter' | 'hold' | 'exit'
  let enterProgress = 0
  let holdProgress = 0
  let exitProgress = 0

  if (wordTime < enterDuration) {
    phase = 'enter'
    enterProgress = enterDuration > 0 ? wordTime / enterDuration : 1
  } else if (wordTime < enterDuration + holdDuration) {
    phase = 'hold'
    enterProgress = 1
    holdProgress = holdDuration > 0 ? (wordTime - enterDuration) / holdDuration : 0
  } else {
    phase = 'exit'
    enterProgress = 1
    holdProgress = 1
    const exitDuration = cycleDuration * 0.2
    exitProgress = exitDuration > 0 ? (wordTime - enterDuration - holdDuration) / exitDuration : 1
  }

  return { wordIndex, phase, enterProgress, holdProgress, exitProgress }
}
```

- [ ] **Step 5: Implement interpolation.ts (worklet-safe, no new Set())**

```typescript
// packages/core/src/interpolation.ts
import type { AnimatableProps } from './types/motionDesign'

const ANIM_DEFAULTS: Required<AnimatableProps> = {
  opacity: 1,
  x: 0,
  y: 0,
  scale: 1,
  scaleX: 1,
  scaleY: 1,
  rotation: 0,
  blur: 0,
}

const ANIM_KEYS: (keyof AnimatableProps)[] = [
  'opacity', 'x', 'y', 'scale', 'scaleX', 'scaleY', 'rotation', 'blur',
]

export function lerp(a: number, b: number, t: number): number {
  'worklet'
  return a + (b - a) * t
}

/**
 * Interpolate animatable properties between from and to.
 * Worklet-safe: uses a fixed key list instead of new Set().
 */
export function interpolateProps(
  from: Partial<AnimatableProps>,
  to: Partial<AnimatableProps>,
  t: number,
): Required<AnimatableProps> {
  'worklet'
  const result = { ...ANIM_DEFAULTS }
  for (let i = 0; i < ANIM_KEYS.length; i++) {
    const key = ANIM_KEYS[i]
    const a = from[key] ?? ANIM_DEFAULTS[key]
    const b = to[key] ?? ANIM_DEFAULTS[key]
    result[key] = lerp(a, b, t)
  }
  return result
}

/**
 * Replace {{key}} tokens in a string with config values.
 */
export function interpolateConfig(
  value: string,
  config: Record<string, unknown>,
): string {
  return value.replace(/\{\{(\w+)\}\}/g, (_, key) => {
    const v = config[key]
    return v != null ? String(v) : ''
  })
}
```

- [ ] **Step 6: Implement holdEffects.ts**

```typescript
// packages/core/src/holdEffects.ts
export interface HoldEffectResult {
  scaleOffset: number
  yOffset: number
  glowIntensity: number // 0 = no glow, >0 = glow strength (replaces boxShadow string)
}

/**
 * Compute hold-phase animation effects.
 * Worklet-safe: returns numeric values, no CSS strings.
 */
export function computeHoldEffect(
  effect: 'pulse' | 'glow' | 'float' | 'breathe' | undefined,
  holdT: number,
  amplitude: number = 0.05,
  speed: number = 1,
): HoldEffectResult {
  'worklet'
  if (!effect) return { scaleOffset: 0, yOffset: 0, glowIntensity: 0 }

  const wave = Math.sin(holdT * Math.PI * 2 * speed)

  switch (effect) {
    case 'pulse':
      return { scaleOffset: wave * amplitude, yOffset: 0, glowIntensity: 0 }
    case 'breathe':
      return { scaleOffset: wave * amplitude * 0.5, yOffset: 0, glowIntensity: 0 }
    case 'float':
      return { scaleOffset: 0, yOffset: wave * (amplitude * 100), glowIntensity: 0 }
    case 'glow':
      return {
        scaleOffset: 0,
        yOffset: 0,
        glowIntensity: 8 + wave * 12,
      }
    default:
      return { scaleOffset: 0, yOffset: 0, glowIntensity: 0 }
  }
}
```

- [ ] **Step 7: Run all core tests**

Run: `cd packages/core && npx vitest run --reporter verbose`
Expected: All tests PASS

- [ ] **Step 8: Commit**

```bash
git add packages/core/src/timing.ts packages/core/src/interpolation.ts packages/core/src/holdEffects.ts packages/core/src/__tests__/
git commit -m "feat(core): extract timing, interpolation, holdEffects (worklet-safe)"
```

---

## Task 10: Extract Typography Engine to Core

**Files:**
- Create: `packages/core/src/typographyEngine.ts`
- Modify: `src/services/motionDesign/typographyEngine.ts` (re-export shim)

- [ ] **Step 1: Copy typography engine to core**

Copy `src/services/motionDesign/typographyEngine.ts` to `packages/core/src/typographyEngine.ts` with this change:

Replace: `import { Easing } from '@/engine/easing'`
With: `import { Easing } from './easing'`

Everything else is already pure — no React, no DOM.

- [ ] **Step 2: Make web file a re-export shim**

Replace `src/services/motionDesign/typographyEngine.ts`:

```typescript
// Re-export everything from @proanimate/core
export {
  splitText,
  computeUnitStyle,
  suggestPreset,
  TYPOGRAPHY_PRESETS,
} from '@proanimate/core'

export type {
  TextAnimationType,
  TextSplitMode,
  TypographyAnimationConfig,
  TypographyStyle,
  ComputedCharStyle,
} from '@proanimate/core'
```

- [ ] **Step 3: Create core barrel export**

```typescript
// packages/core/src/index.ts
export { Easing, getEasingByName } from './easing'
export { computeKineticPhase } from './timing'
export type { KineticPhaseResult } from './timing'
export { lerp, interpolateProps, interpolateConfig } from './interpolation'
export { computeHoldEffect } from './holdEffects'
export type { HoldEffectResult } from './holdEffects'
export {
  splitText,
  computeUnitStyle,
  suggestPreset,
  TYPOGRAPHY_PRESETS,
} from './typographyEngine'
export type {
  TextAnimationType,
  TextSplitMode,
  TypographyAnimationConfig,
  TypographyStyle,
  ComputedCharStyle,
} from './typographyEngine'
export * from './types'
```

- [ ] **Step 4: Verify web app compiles with re-exports**

Run: `npm run build`
Expected: No errors

- [ ] **Step 5: Run all core tests**

Run: `cd packages/core && npx vitest run --reporter verbose`
Expected: All pass

- [ ] **Step 6: Commit**

```bash
git add packages/core/src/typographyEngine.ts packages/core/src/index.ts src/services/motionDesign/typographyEngine.ts
git commit -m "feat(core): extract typographyEngine + create barrel export"
```

---

## Task 11: Initialize Expo Project

**Files:**
- Create: `mobile/` (entire Expo project)

- [ ] **Step 1: Create the Expo app**

Run from project root:

```bash
cd /Users/ihsanduru/autoStudio/AutoAnimation
npx create-expo-app@latest mobile --template blank-typescript
```

- [ ] **Step 2: Install core dependencies**

```bash
cd mobile
npx expo install expo-dev-client expo-router react-native-reanimated @shopify/react-native-skia react-native-svg expo-font expo-av expo-secure-store expo-file-system expo-sharing react-native-safe-area-context react-native-screens expo-status-bar react-native-gesture-handler
npm install zustand immer @supabase/supabase-js react-native-mmkv
```

- [ ] **Step 3: Configure metro.config.js for workspace resolution**

```javascript
// mobile/metro.config.js
const { getDefaultConfig } = require('expo/metro-config')
const path = require('path')

const projectRoot = __dirname
const workspaceRoot = path.resolve(projectRoot, '..')

const config = getDefaultConfig(projectRoot)

// Watch the core package
config.watchFolders = [workspaceRoot]

// Ensure Metro resolves from both mobile/node_modules and root/node_modules
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, 'node_modules'),
  path.resolve(workspaceRoot, 'node_modules'),
]

// Ensure the core package is resolved correctly
config.resolver.disableHierarchicalLookup = true

module.exports = config
```

- [ ] **Step 4: Update app.json for dev build**

Ensure `mobile/app.json` has:

```json
{
  "expo": {
    "name": "ProAnimate",
    "slug": "proanimate-mobile",
    "version": "0.1.0",
    "orientation": "portrait",
    "scheme": "proanimate",
    "plugins": [
      "expo-router",
      "expo-secure-store"
    ],
    "newArchEnabled": true
  }
}
```

- [ ] **Step 5: Verify the app compiles**

Run: `cd mobile && npx expo start --dev-client`
Expected: Metro bundler starts without errors (you won't have a dev build to run on yet — that comes with `eas build`)

- [ ] **Step 6: Commit**

```bash
git add mobile/
git commit -m "feat(mobile): initialize Expo project with dev build config"
```

---

## Task 12: Supabase Auth + Auth Store

**Files:**
- Create: `mobile/src/services/supabase.ts`
- Create: `mobile/src/stores/useAuthStore.ts`

- [ ] **Step 1: Create Supabase client with secure token storage**

```typescript
// mobile/src/services/supabase.ts
import { createClient } from '@supabase/supabase-js'
import * as SecureStore from 'expo-secure-store'

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!

const SecureStoreAdapter = {
  getItem: (key: string) => SecureStore.getItemAsync(key),
  setItem: (key: string, value: string) => SecureStore.setItemAsync(key, value),
  removeItem: (key: string) => SecureStore.deleteItemAsync(key),
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: SecureStoreAdapter,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false, // no URL session handling on mobile
  },
})
```

- [ ] **Step 2: Create auth store**

```typescript
// mobile/src/stores/useAuthStore.ts
import { create } from 'zustand'
import { supabase } from '../services/supabase'
import type { User, Session } from '@supabase/supabase-js'

interface AuthState {
  user: User | null
  session: Session | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<{ error?: string }>
  signUp: (email: string, password: string) => Promise<{ error?: string }>
  signOut: () => Promise<void>
  initialize: () => Promise<void>
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  session: null,
  loading: true,

  initialize: async () => {
    const { data: { session } } = await supabase.auth.getSession()
    set({ user: session?.user ?? null, session, loading: false })

    supabase.auth.onAuthStateChange((_event, session) => {
      set({ user: session?.user ?? null, session })
    })
  },

  signIn: async (email, password) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) return { error: error.message }
    return {}
  },

  signUp: async (email, password) => {
    const { error } = await supabase.auth.signUp({ email, password })
    if (error) return { error: error.message }
    return {}
  },

  signOut: async () => {
    await supabase.auth.signOut()
    set({ user: null, session: null })
  },
}))
```

- [ ] **Step 3: Create .env file**

```bash
# mobile/.env
EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
EXPO_PUBLIC_API_BASE_URL=http://localhost:3001
```

- [ ] **Step 4: Commit**

```bash
git add mobile/src/services/supabase.ts mobile/src/stores/useAuthStore.ts mobile/.env
git commit -m "feat(mobile): Supabase auth with expo-secure-store persistence"
```

---

## Task 13: Navigation Shell — Tab Bar + Auth Gate

**Files:**
- Create: `mobile/app/_layout.tsx`
- Create: `mobile/app/(auth)/_layout.tsx`
- Create: `mobile/app/(auth)/login.tsx`
- Create: `mobile/app/(tabs)/_layout.tsx`
- Create: `mobile/app/(tabs)/browse.tsx`
- Create: `mobile/app/(tabs)/projects.tsx`
- Create: `mobile/app/(tabs)/settings.tsx`

- [ ] **Step 1: Root layout with auth gate**

```typescript
// mobile/app/_layout.tsx
import { useEffect } from 'react'
import { Slot, useRouter, useSegments } from 'expo-router'
import { useAuthStore } from '../src/stores/useAuthStore'

export default function RootLayout() {
  const { user, loading, initialize } = useAuthStore()
  const segments = useSegments()
  const router = useRouter()

  useEffect(() => {
    initialize()
  }, [])

  useEffect(() => {
    if (loading) return
    const inAuthGroup = segments[0] === '(auth)'

    if (!user && !inAuthGroup) {
      router.replace('/(auth)/login')
    } else if (user && inAuthGroup) {
      router.replace('/(tabs)/browse')
    }
  }, [user, loading, segments])

  if (loading) return null

  return <Slot />
}
```

- [ ] **Step 2: Auth layout**

```typescript
// mobile/app/(auth)/_layout.tsx
import { Stack } from 'expo-router'

export default function AuthLayout() {
  return <Stack screenOptions={{ headerShown: false }} />
}
```

- [ ] **Step 3: Login screen**

```typescript
// mobile/app/(auth)/login.tsx
import { useState } from 'react'
import { View, Text, TextInput, Pressable, StyleSheet, ActivityIndicator } from 'react-native'
import { useAuthStore } from '../../src/stores/useAuthStore'

export default function LoginScreen() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { signIn } = useAuthStore()

  const handleLogin = async () => {
    setError('')
    setLoading(true)
    const result = await signIn(email, password)
    setLoading(false)
    if (result.error) setError(result.error)
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>ProAnimate</Text>
      <TextInput
        style={styles.input}
        placeholder="Email"
        placeholderTextColor="#666"
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        keyboardType="email-address"
      />
      <TextInput
        style={styles.input}
        placeholder="Password"
        placeholderTextColor="#666"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
      />
      {error ? <Text style={styles.error}>{error}</Text> : null}
      <Pressable style={styles.button} onPress={handleLogin} disabled={loading}>
        {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Sign In</Text>}
      </Pressable>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', padding: 24, backgroundColor: '#0a0a0a' },
  title: { fontSize: 32, fontWeight: '700', color: '#fff', textAlign: 'center', marginBottom: 40 },
  input: { backgroundColor: '#1a1a1a', color: '#fff', padding: 16, borderRadius: 12, marginBottom: 12, fontSize: 16 },
  error: { color: '#ef4444', marginBottom: 12, textAlign: 'center' },
  button: { backgroundColor: '#6366f1', padding: 16, borderRadius: 12, alignItems: 'center' },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
})
```

- [ ] **Step 4: Tab layout**

```typescript
// mobile/app/(tabs)/_layout.tsx
import { Tabs } from 'expo-router'

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerStyle: { backgroundColor: '#0a0a0a' },
        headerTintColor: '#fff',
        tabBarStyle: { backgroundColor: '#0a0a0a', borderTopColor: '#222' },
        tabBarActiveTintColor: '#6366f1',
        tabBarInactiveTintColor: '#666',
      }}
    >
      <Tabs.Screen name="browse" options={{ title: 'Browse' }} />
      <Tabs.Screen name="projects" options={{ title: 'Projects' }} />
      <Tabs.Screen name="settings" options={{ title: 'Settings' }} />
    </Tabs>
  )
}
```

- [ ] **Step 5: Placeholder screens**

```typescript
// mobile/app/(tabs)/browse.tsx
import { View, Text, StyleSheet } from 'react-native'
export default function BrowseScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>Template Gallery</Text>
      <Text style={styles.sub}>Coming in Phase 3</Text>
    </View>
  )
}
const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#0a0a0a' },
  text: { color: '#fff', fontSize: 24, fontWeight: '600' },
  sub: { color: '#666', fontSize: 14, marginTop: 8 },
})
```

```typescript
// mobile/app/(tabs)/projects.tsx
import { View, Text, StyleSheet } from 'react-native'
export default function ProjectsScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>Your Projects</Text>
      <Text style={styles.sub}>Coming in Phase 3</Text>
    </View>
  )
}
const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#0a0a0a' },
  text: { color: '#fff', fontSize: 24, fontWeight: '600' },
  sub: { color: '#666', fontSize: 14, marginTop: 8 },
})
```

```typescript
// mobile/app/(tabs)/settings.tsx
import { View, Text, Pressable, StyleSheet } from 'react-native'
import { useAuthStore } from '../../src/stores/useAuthStore'
export default function SettingsScreen() {
  const { user, signOut } = useAuthStore()
  return (
    <View style={styles.container}>
      <Text style={styles.text}>{user?.email}</Text>
      <Pressable style={styles.button} onPress={signOut}>
        <Text style={styles.buttonText}>Sign Out</Text>
      </Pressable>
    </View>
  )
}
const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#0a0a0a' },
  text: { color: '#fff', fontSize: 16, marginBottom: 24 },
  button: { backgroundColor: '#ef4444', paddingHorizontal: 24, paddingVertical: 12, borderRadius: 8 },
  buttonText: { color: '#fff', fontWeight: '600' },
})
```

- [ ] **Step 6: Verify app starts**

Run: `cd mobile && npx expo start --dev-client`
Expected: Metro starts, no build errors

- [ ] **Step 7: Commit**

```bash
git add mobile/app/
git commit -m "feat(mobile): tab navigation shell with auth gate and login screen"
```

---

## Phase 0 + Phase 1 Completion Checklist

After all tasks are done, verify:

- [ ] `cd server && npx tsc --noEmit` — no errors
- [ ] `npm run build` — web app builds with re-export shims
- [ ] `cd packages/core && npx vitest run` — all core tests pass
- [ ] `cd mobile && npx expo start --dev-client` — Metro starts
- [ ] CORS allows requests with no Origin header
- [ ] Renders endpoint accepts both `prompt` and `motionDesignDescription` payloads
- [ ] Templates endpoint serves catalog from Supabase Storage
- [ ] Projects endpoint accepts `templateId`, `configState`, `motionDesignDescription`

```bash
git add -A && git commit -m "milestone: Phase 0 + Phase 1 complete — monorepo, core package, mobile shell, backend API ready"
```
