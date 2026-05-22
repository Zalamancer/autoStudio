# Template Generation Controls — Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a "Generate" tab to MotionGalleryPanel with 5 categorical controls + few-shot exemplar prompting that generates kinetic typography templates via Claude API.

**Architecture:** Zustand store holds generation config (persisted to localStorage). Generate tab renders 5 segmented button controls + concept input. Server endpoint fetches top-rated template code from disk, builds a few-shot prompt, calls Claude API, writes TSX files, scores them with the reward model, and returns results.

**Tech Stack:** React + Zustand (frontend), Express + @anthropic-ai/sdk (backend), PanelCategoryTabs + PanelButtonGroup (existing UI components)

---

## File Map

| File | Action | Responsibility |
|------|--------|----------------|
| `src/stores/useGenerationStore.ts` | Create | Generation config state, generation status, persist to localStorage |
| `src/components/panels/GenerateTab.tsx` | Create | 5 controls UI + concept input + generate button |
| `src/components/panels/MotionGalleryPanel.tsx` | Modify | Add PanelCategoryTabs (Browse/Generate), conditionally render GenerateTab |
| `server/services/templateGenerator.ts` | Create | Fetch top-rated TSX, build prompt, call Claude, write files, score |
| `server/routes/templateGeneration.ts` | Create | POST /api/generate-templates endpoint |
| `server/index.ts` | Modify | Mount templateGeneration route |

---

### Task 1: Create Generation Store

**Files:**
- Create: `src/stores/useGenerationStore.ts`

- [ ] **Step 1: Create the store**

```typescript
// src/stores/useGenerationStore.ts
import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface GenerationConfig {
  promptMode: 'reference' | 'direction' | 'freeform'
  concept: string
  visualDensity: 'sparse' | 'balanced' | 'dense'
  animationSpeed: 'snappy' | 'standard' | 'cinematic'
  textRole: 'text-is-effect' | 'text-in-scene'
  textCount: 'single' | 'multi-block'
}

interface GenerationResult {
  id: string
  filename: string
  predictedScore: number | null
}

interface GenerationState {
  config: GenerationConfig
  generating: boolean
  lastResults: GenerationResult[]
  lastRoundLabel: string | null
  error: string | null

  setConfig: <K extends keyof GenerationConfig>(key: K, value: GenerationConfig[K]) => void
  generate: () => Promise<void>
}

export const useGenerationStore = create<GenerationState>()(
  persist(
    (set, get) => ({
      config: {
        promptMode: 'direction',
        concept: '',
        visualDensity: 'balanced',
        animationSpeed: 'standard',
        textRole: 'text-is-effect',
        textCount: 'single',
      },
      generating: false,
      lastResults: [],
      lastRoundLabel: null,
      error: null,

      setConfig: (key, value) => {
        set((s) => ({ config: { ...s.config, [key]: value } }))
      },

      generate: async () => {
        const { config } = get()
        if (!config.concept.trim()) {
          set({ error: 'Enter a concept first' })
          return
        }
        set({ generating: true, error: null, lastResults: [] })
        try {
          const res = await fetch('/api/generate-templates', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(config),
          })
          if (!res.ok) {
            const err = await res.json().catch(() => ({ error: 'Generation failed' }))
            set({ generating: false, error: err.error || 'Generation failed' })
            return
          }
          const data = await res.json()
          set({
            generating: false,
            lastResults: data.results || [],
            lastRoundLabel: data.roundLabel || null,
          })
        } catch (err: any) {
          set({ generating: false, error: err.message || 'Network error' })
        }
      },
    }),
    {
      name: 'generation-config-store',
      partialize: (state) => ({ config: state.config }),
    },
  ),
)
```

- [ ] **Step 2: Commit**

```bash
git add src/stores/useGenerationStore.ts
git commit -m "feat(generation): add generation config store with localStorage persist"
```

---

### Task 2: Create GenerateTab Component

**Files:**
- Create: `src/components/panels/GenerateTab.tsx`

- [ ] **Step 1: Create the component**

```typescript
// src/components/panels/GenerateTab.tsx
import { Loader2, Sparkles } from 'lucide-react'
import { PanelButtonGroup } from '@/components/ui/panel-controls/PanelButtonGroup'
import { useGenerationStore } from '@/stores/useGenerationStore'
import { cn } from '@/lib/utils'

const PROMPT_MODE_OPTIONS = [
  { value: 'reference', label: 'Reference' },
  { value: 'direction', label: 'Direction' },
  { value: 'freeform', label: 'Freeform' },
]

const DENSITY_OPTIONS = [
  { value: 'sparse', label: 'Sparse' },
  { value: 'balanced', label: 'Balanced' },
  { value: 'dense', label: 'Dense' },
]

const SPEED_OPTIONS = [
  { value: 'snappy', label: 'Snappy' },
  { value: 'standard', label: 'Standard' },
  { value: 'cinematic', label: 'Cinematic' },
]

const TEXT_ROLE_OPTIONS = [
  { value: 'text-is-effect', label: 'Text IS effect' },
  { value: 'text-in-scene', label: 'Text IN scene' },
]

const TEXT_COUNT_OPTIONS = [
  { value: 'single', label: 'Single' },
  { value: 'multi-block', label: 'Multi-block', disabled: true, title: 'Coming soon — requires multi-text layout engine' },
]

const CONCEPT_LABELS: Record<string, string> = {
  reference: 'Reference (be specific)',
  direction: 'Direction (aesthetic)',
  freeform: 'Vibe (loose)',
}

export function GenerateTab() {
  const config = useGenerationStore((s) => s.config)
  const generating = useGenerationStore((s) => s.generating)
  const lastResults = useGenerationStore((s) => s.lastResults)
  const error = useGenerationStore((s) => s.error)
  const setConfig = useGenerationStore((s) => s.setConfig)
  const generate = useGenerationStore((s) => s.generate)

  return (
    <div className="flex-1 overflow-y-auto px-3 py-2 space-y-4">
      {/* Prompt Mode */}
      <PanelButtonGroup
        label="Prompt Mode"
        options={PROMPT_MODE_OPTIONS}
        value={config.promptMode}
        onChange={(v) => setConfig('promptMode', v as any)}
      />

      {/* Concept Input */}
      <div>
        <label className="block text-[11px] font-medium text-zinc-400 mb-1.5">
          {CONCEPT_LABELS[config.promptMode]}
        </label>
        <input
          type="text"
          value={config.concept}
          onChange={(e) => setConfig('concept', e.target.value)}
          placeholder={
            config.promptMode === 'reference'
              ? 'airport departure board'
              : config.promptMode === 'direction'
                ? 'minimal industrial'
                : 'assembly'
          }
          className="w-full px-3 py-2 bg-[#1a1a1a] rounded-lg text-sm text-zinc-200 placeholder-zinc-600 border border-white/5 focus:border-[#4a7eff]/30 focus:outline-none"
        />
      </div>

      {/* Visual Density */}
      <PanelButtonGroup
        label="Visual Density"
        options={DENSITY_OPTIONS}
        value={config.visualDensity}
        onChange={(v) => setConfig('visualDensity', v as any)}
      />

      {/* Animation Speed */}
      <PanelButtonGroup
        label="Animation Speed"
        options={SPEED_OPTIONS}
        value={config.animationSpeed}
        onChange={(v) => setConfig('animationSpeed', v as any)}
      />

      {/* Text Role */}
      <PanelButtonGroup
        label="Text Role"
        options={TEXT_ROLE_OPTIONS}
        value={config.textRole}
        onChange={(v) => setConfig('textRole', v as any)}
      />

      {/* Text Count */}
      <PanelButtonGroup
        label="Text Count"
        options={TEXT_COUNT_OPTIONS}
        value={config.textCount}
        onChange={(v) => setConfig('textCount', v as any)}
      />

      {/* Generate Button */}
      <button
        onClick={generate}
        disabled={generating || !config.concept.trim()}
        className={cn(
          'w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-semibold transition-all',
          generating
            ? 'bg-[#4a7eff]/20 text-[#4a7eff] cursor-wait'
            : !config.concept.trim()
              ? 'bg-zinc-800 text-zinc-600 cursor-not-allowed'
              : 'bg-[#4a7eff] text-white hover:bg-[#5a8eff]',
        )}
      >
        {generating ? (
          <>
            <Loader2 size={16} className="animate-spin" />
            Generating... ~2-3 min
          </>
        ) : (
          <>
            <Sparkles size={16} />
            Generate 5 templates
          </>
        )}
      </button>

      {/* Error */}
      {error && (
        <div className="px-3 py-2 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-xs">
          {error}
        </div>
      )}

      {/* Results */}
      {lastResults.length > 0 && (
        <div className="space-y-1">
          <div className="text-[11px] font-medium text-zinc-400">Generated</div>
          {lastResults.map((r) => (
            <div key={r.id} className="flex items-center justify-between px-3 py-2 rounded-lg bg-[#2a2a2a] border border-white/5">
              <span className="text-xs text-zinc-300 truncate">{r.id.replace('tpl-kinetic-', '')}</span>
              {r.predictedScore != null && (
                <span className={cn('text-[10px] font-mono', r.predictedScore >= 2.5 ? 'text-emerald-400' : 'text-zinc-500')}>
                  {r.predictedScore.toFixed(1)}
                </span>
              )}
            </div>
          ))}
          <div className="text-[10px] text-zinc-600 text-center mt-1">
            Switch to Browse tab and rate them
          </div>
        </div>
      )}

      {/* Footer hint */}
      <div className="text-[10px] text-zinc-600 text-center pt-2">
        Uses your top-rated templates as quality reference
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/panels/GenerateTab.tsx
git commit -m "feat(generation): add GenerateTab with 5 categorical controls"
```

---

### Task 3: Add Pill Tabs to MotionGalleryPanel

**Files:**
- Modify: `src/components/panels/MotionGalleryPanel.tsx`

- [ ] **Step 1: Add PanelCategoryTabs and GenerateTab import + state**

At the top of `MotionGalleryPanel.tsx`, add imports:
```typescript
import { PanelCategoryTabs } from '@/components/ui/panel-controls/PanelCategoryTabs'
import { GenerateTab } from './GenerateTab'
import { Wand2, Grid3x3 } from 'lucide-react'
```

Inside the component function, add tab state:
```typescript
const [galleryTab, setGalleryTab] = useState<'browse' | 'generate'>('browse')

const GALLERY_TABS = [
  { id: 'browse', label: 'Browse', icon: Grid3x3 },
  { id: 'generate', label: 'Generate', icon: Wand2 },
]
```

- [ ] **Step 2: Render PanelCategoryTabs at the top of the panel, wrap existing content in browse conditional**

Add `PanelCategoryTabs` at the top of the panel's content area (before the search bar), and wrap the existing browse content with `{galleryTab === 'browse' && (...)}`, adding `{galleryTab === 'generate' && <GenerateTab />}`.

- [ ] **Step 3: Commit**

```bash
git add src/components/panels/MotionGalleryPanel.tsx
git commit -m "feat(generation): add Browse/Generate pill tabs to MotionGalleryPanel"
```

---

### Task 4: Create Template Generator Service (Server)

**Files:**
- Create: `server/services/templateGenerator.ts`

- [ ] **Step 1: Create the service**

The service does 4 things:
1. Fetches top-rated template TSX code from disk (using Supabase ratings to rank)
2. Builds the few-shot prompt with control values
3. Calls Claude API to generate 5 template TSX files
4. Writes files, updates index.ts and templateRounds.json, scores with reward model

```typescript
// server/services/templateGenerator.ts
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import Anthropic from '@anthropic-ai/sdk'
import { getSupabaseAdmin, isSocialConfigured } from '../middleware/supabaseAuth'
import { predictTemplateScore, type PredictionResult } from './rewardModel'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const TEMPLATE_DIR = path.resolve(__dirname, '..', '..', 'src', 'motionGraphics', 'templates')
const INDEX_FILE = path.resolve(__dirname, '..', '..', 'src', 'motionGraphics', 'index.ts')
const ROUNDS_FILE = path.resolve(__dirname, '..', '..', 'src', 'motionGraphics', 'templateRounds.json')
const KINETIC_BASE_FILE = path.resolve(__dirname, '..', '..', 'src', 'motionGraphics', 'KineticBase.tsx')

export interface GenerationConfig {
  promptMode: 'reference' | 'direction' | 'freeform'
  concept: string
  visualDensity: 'sparse' | 'balanced' | 'dense'
  animationSpeed: 'snappy' | 'standard' | 'cinematic'
  textRole: 'text-is-effect' | 'text-in-scene'
  textCount: 'single' | 'multi-block'
}

export interface GenerationResult {
  id: string
  filename: string
  predictedScore: number | null
}

// ── Top-rated template fetching ──────────────────────────────────────

async function fetchTopRatedTemplateCode(count: number): Promise<string[]> {
  if (!isSocialConfigured()) return []

  const supabase = getSupabaseAdmin()
  const { data, error } = await supabase
    .from('template_ratings')
    .select('template_id, impact, finish, flow, versatility, appeal')
    .not('impact', 'is', null)

  if (error || !data || data.length === 0) return []

  // Rank by average score
  const ranked = data
    .map((r) => ({
      id: r.template_id,
      avg: (r.impact + r.finish + r.flow + r.versatility + r.appeal) / 5,
    }))
    .sort((a, b) => b.avg - a.avg)
    .slice(0, count)

  // Read TSX files from disk
  const idToFile = new Map<string, string>()
  const files = fs.readdirSync(TEMPLATE_DIR).filter((f) => f.endsWith('.tsx'))
  for (const file of files) {
    const content = fs.readFileSync(path.join(TEMPLATE_DIR, file), 'utf-8')
    const match = content.match(/id:\s*['"]([^'"]+)['"]/)
    if (match) idToFile.set(match[1], content)
  }

  return ranked.map((r) => idToFile.get(r.id)).filter((c): c is string => !!c)
}

// ── Prompt building ──────────────────────────────────────────────────

function buildPrompt(config: GenerationConfig, exampleCode: string[], kineticBaseCode: string): string {
  const examples = exampleCode.map((code, i) => `### Example ${i + 1}\n\`\`\`tsx\n${code}\n\`\`\``).join('\n\n')

  return `You are creating 5 kinetic typography templates for ProAnimate.

## Quality Reference
Here are templates the user rated highest. Study their code — the animation quality, visual polish, and creative choices are the bar:

${examples}

## Your Brief
- Prompt mode: ${config.promptMode}
- Input: "${config.concept}"
- Visual density: ${config.visualDensity}
- Animation speed: ${config.animationSpeed}
- Text role: ${config.textRole}

## Technical Pattern
Follow this base component pattern exactly:

\`\`\`tsx
${kineticBaseCode}
\`\`\`

## Rules
- Generate exactly 5 template files
- Each must be a complete, self-contained TSX file
- Each must use a DIFFERENT animation mechanic from the others and from the examples
- Make them look incredible. That is the primary objective.
- Use registerMotionGraphic() with id format: 'tpl-kinetic-kebab-name'
- category: 'captions'
- tags must include 'kinetic' and 'typography'

## Output Format
Return exactly 5 code blocks, each preceded by a filename comment:
// FILE: KineticTemplateName.tsx
\`\`\`tsx
// full file contents
\`\`\`
`
}

// ── File parsing and writing ─────────────────────────────────────────

function parseGeneratedTemplates(response: string): { filename: string; code: string }[] {
  const templates: { filename: string; code: string }[] = []
  const filePattern = /\/\/\s*FILE:\s*(\S+\.tsx)\s*\n```tsx\n([\s\S]*?)```/g
  let match
  while ((match = filePattern.exec(response)) !== null) {
    templates.push({ filename: match[1], code: match[2].trim() })
  }
  return templates
}

// ── Main generation function ─────────────────────────────────────────

export async function generateTemplates(config: GenerationConfig): Promise<{
  results: GenerationResult[]
  roundLabel: string
}> {
  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) throw new Error('ANTHROPIC_API_KEY not configured')

  // 1. Fetch top-rated template code
  const exampleCode = await fetchTopRatedTemplateCode(3)
  const kineticBaseCode = fs.readFileSync(KINETIC_BASE_FILE, 'utf-8')

  // 2. Build prompt
  const prompt = buildPrompt(config, exampleCode, kineticBaseCode)

  // 3. Call Claude API
  const client = new Anthropic({ apiKey })
  const message = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 16000,
    messages: [{ role: 'user', content: prompt }],
  })

  const responseText = message.content
    .filter((b): b is Anthropic.TextBlock => b.type === 'text')
    .map((b) => b.text)
    .join('\n')

  // 4. Parse template files from response
  const templates = parseGeneratedTemplates(responseText)
  if (templates.length === 0) {
    throw new Error('Claude returned no parseable template files')
  }

  // 5. Write files and collect results
  const roundLabel = `gen-${Date.now()}`
  const results: GenerationResult[] = []
  const rounds = JSON.parse(fs.readFileSync(ROUNDS_FILE, 'utf-8'))
  const indexAppends: string[] = []

  for (const tpl of templates) {
    const filePath = path.join(TEMPLATE_DIR, tpl.filename)
    fs.writeFileSync(filePath, tpl.code)

    // Extract template ID from written code
    const idMatch = tpl.code.match(/id:\s*['"]([^'"]+)['"]/)
    const id = idMatch ? idMatch[1] : tpl.filename.replace('.tsx', '')

    // Score with reward model
    let predictedScore: number | null = null
    try {
      const prediction = predictTemplateScore(tpl.code)
      predictedScore = prediction?.predictedScore ?? null
    } catch {}

    // Update rounds mapping
    rounds[id] = roundLabel

    // Prepare index import
    const importName = tpl.filename.replace('.tsx', '')
    indexAppends.push(`import './templates/${importName}'`)

    results.push({ id, filename: tpl.filename, predictedScore })
  }

  // 6. Write rounds file
  fs.writeFileSync(ROUNDS_FILE, JSON.stringify(rounds, null, 2))

  // 7. Append imports to index.ts
  if (indexAppends.length > 0) {
    const indexContent = fs.readFileSync(INDEX_FILE, 'utf-8')
    const newSection = `\n// ── Generated: ${roundLabel} ──\n${indexAppends.join('\n')}\n`
    fs.writeFileSync(INDEX_FILE, indexContent + newSection)
  }

  return { results, roundLabel }
}
```

- [ ] **Step 2: Commit**

```bash
git add server/services/templateGenerator.ts
git commit -m "feat(generation): add templateGenerator service with few-shot prompting"
```

---

### Task 5: Create API Route

**Files:**
- Create: `server/routes/templateGeneration.ts`
- Modify: `server/index.ts`

- [ ] **Step 1: Create the route**

```typescript
// server/routes/templateGeneration.ts
import { Router } from 'express'
import { generateTemplates, type GenerationConfig } from '../services/templateGenerator'

const router = Router()

router.post('/', async (req, res) => {
  const config: GenerationConfig = req.body
  if (!config.concept?.trim()) {
    res.status(400).json({ error: 'concept is required' })
    return
  }

  try {
    console.log('[Generation] Starting with config:', JSON.stringify(config))
    const result = await generateTemplates(config)
    console.log(`[Generation] Complete: ${result.results.length} templates, round=${result.roundLabel}`)
    res.json(result)
  } catch (err: any) {
    console.error('[Generation] Error:', err)
    res.status(500).json({ error: err.message || 'Generation failed' })
  }
})

export default router
```

- [ ] **Step 2: Mount in server/index.ts**

Add import: `import templateGenerationRoutes from './routes/templateGeneration'`
Add mount: `app.use('/api/generate-templates', templateGenerationRoutes)`

Place near the existing `app.use('/api/template-ratings', templateRatingsRoutes)` line.

- [ ] **Step 3: Commit**

```bash
git add server/routes/templateGeneration.ts server/index.ts
git commit -m "feat(generation): add POST /api/generate-templates endpoint"
```

---

### Task 6: Add gen-* Round Labels to Filter Dropdown

**Files:**
- Modify: `src/components/panels/MotionGalleryPanel.tsx`

- [ ] **Step 1: Make round filter dynamic**

Instead of hardcoded round options, derive them from `templateRounds.json`:

```typescript
import templateRounds from '@/motionGraphics/templateRounds.json'

// Inside the component, compute rounds dynamically:
const roundOptions = useMemo(() => {
  const rounds = new Set(Object.values(templateRounds as Record<string, string>))
  const sorted = [...rounds].sort((a, b) => {
    // Sort: initial, r3, r4, ..., r10, gen-*
    if (a === 'initial') return -1
    if (b === 'initial') return 1
    const aNum = a.startsWith('r') ? parseInt(a.slice(1)) : a.startsWith('gen-') ? 999 : 0
    const bNum = b.startsWith('r') ? parseInt(b.slice(1)) : b.startsWith('gen-') ? 999 : 0
    return aNum - bNum
  })
  return [
    { value: 'all', label: 'All Rounds' },
    ...sorted.map((r) => ({
      value: r,
      label: r === 'initial' ? 'Initial' : r.startsWith('r') ? `Round ${r.slice(1)}` : `Gen ${r.replace('gen-', '').slice(0, 8)}`,
    })),
  ]
}, [])
```

Replace the hardcoded options array in the PanelSelect for Round with `roundOptions`.

- [ ] **Step 2: Commit**

```bash
git add src/components/panels/MotionGalleryPanel.tsx
git commit -m "feat(generation): make round filter dynamic, support gen-* labels"
```

---

### Task 7: End-to-End Verification

- [ ] **Step 1: Start the dev server**

```bash
cd server && npm run dev
```

- [ ] **Step 2: Verify API endpoint works**

```bash
curl -X POST http://localhost:3003/api/generate-templates \
  -H 'Content-Type: application/json' \
  -d '{"promptMode":"direction","concept":"minimal industrial","visualDensity":"sparse","animationSpeed":"standard","textRole":"text-is-effect","textCount":"single"}'
```

Expected: JSON with `results` array containing 5 templates with `id`, `filename`, `predictedScore`.

- [ ] **Step 3: Verify frontend**

1. Open the app
2. Switch to Motion Animations panel
3. See Browse/Generate pill tabs at top
4. Click Generate tab
5. Set controls and type a concept
6. Click "Generate 5 templates"
7. Wait ~2-3 min for completion
8. See results list with predicted scores
9. Switch to Browse, filter to new generation round
10. Rate the generated templates

- [ ] **Step 4: Final commit**

```bash
git add -A
git commit -m "feat(generation): complete template generation controls v1

5 categorical controls (Prompt Mode, Visual Density, Animation Speed,
Text Role, Text Count) with few-shot exemplar prompting from top-rated
templates. Browse/Generate pill tabs in MotionGalleryPanel."
```
