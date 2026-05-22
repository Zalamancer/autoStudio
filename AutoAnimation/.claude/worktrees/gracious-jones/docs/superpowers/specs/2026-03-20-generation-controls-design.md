# Template Generation Controls — Design Spec

## Problem

R7-R10 template generation produced mostly 1-rated templates. Root cause: over-prescriptive prompts with 47+ rules caused agents to follow checklists mechanically instead of making visually compelling animations. The CFG scale analogy (prescriptive <-> creative) is the right instinct but 11 continuous dimensions is false precision — the agent can meaningfully distinguish ~3 levels per axis at best.

## Solution

5 categorical controls + few-shot exemplar prompting.

### Controls

| Control | Options | Effect on generation prompt |
|---------|---------|----------------------------|
| **Prompt Mode** | Reference / Direction / Freeform | Reference = exact visual reference ("airport departure board"). Direction = aesthetic direction ("minimal industrial"). Freeform = just a technique family ("assembly"). |
| **Visual Density** | Sparse / Balanced / Dense | Sparse = text only, clean background. Balanced = subtle bg + 1-2 supporting elements. Dense = layered effects, particles, textures, multiple visual entities. |
| **Animation Speed** | Snappy / Standard / Cinematic | Snappy = 0.5-0.8s cycleDuration. Standard = 0.9-1.4s. Cinematic = 1.5-2.5s with deliberate pacing. |
| **Text Role** | Text IS the effect / Text IN a scene | IS = text transforms ARE the animation (letters split, morph, glitch). IN = text lives inside a designed environment (neon sign on a wall, marquee in a theater). |
| **Text Count** | Single / Multi-block | Single = one word at a time (KineticBase pattern). Multi-block = deferred to v2 — requires a new KineticMultiBase component since KineticBase renders one word at a time. For v1, this option is shown but disabled with tooltip "Coming soon — requires multi-text layout engine." |

### Few-Shot Exemplar Prompting

Instead of a 47-rule checklist, the generation prompt includes:

1. **3-5 top-rated template TSX files** — fetched by querying Supabase `template_ratings` for highest average scores, then reading the corresponding TSX files from disk at `src/motionGraphics/templates/`. Uses the same disk-read pattern as `server/services/rewardModel.ts` (lines 106-114).
2. A single instruction: "Study these examples. They represent the quality bar. Generate something at this level that uses a different animation mechanic."
3. The 5 control values as brief constraints (not rules)

This replaces the quality gate checklist entirely. The agent learns craft from code examples, not from reading rules about "must use mixBlendMode" or "hold phase must have motion."

### Metric Naming Note

The client-side store uses `depth` as the metric name. The Supabase column is `flow` (legacy). The server routes map `depth` <-> `flow` transparently. When computing top-rated templates, use the Supabase column names (`impact`, `finish`, `flow`, `versatility`, `appeal`) and average them. The `deriveVerdict` function in `useTemplateRatingStore.ts` has a known bug referencing `scores.flow` — this does not affect server-side ranking since that uses raw Supabase column values.

### Prompt Template

```
You are creating a kinetic typography template for ProAnimate.

## Quality Reference
Here are templates the user rated highest. Study their code — the animation quality, visual polish, and creative choices are the bar:

{top_rated_template_1_code}
{top_rated_template_2_code}
{top_rated_template_3_code}

## Your Brief
- Prompt mode: {reference|direction|freeform}
- Input: "{user_text_input}"
- Visual density: {sparse|balanced|dense}
- Animation speed: {snappy|standard|cinematic}
- Text role: {text-is-effect|text-in-scene}

## Technical Pattern
Follow this base component pattern exactly:

{full contents of src/motionGraphics/KineticBase.tsx}

## Rules
- Do NOT repeat any animation mechanic from the reference templates
- Make it look incredible. That is the primary objective.
```

### UI Location

MotionGalleryPanel gets a pill tab bar at the top:
- **Browse** tab (existing) — search, filter, rate templates
- **Generate** tab (new) — the 5 controls + concept input + generate button

#### Generate Tab Layout

```
[Browse] [Generate]

+-----------------------------------+
| Prompt Mode                       |
| [Reference] [Direction] [Free]    |
|                                   |
| Reference (be specific) _________ |
| |airport departure board        | |
|                                   |
| Visual Density                    |
| [Sparse] [Balanced] [Dense]       |
|                                   |
| Animation Speed                   |
| [Snappy] [Standard] [Cinematic]   |
|                                   |
| Text Role                         |
| [Text IS effect] [Text IN scene]  |
|                                   |
| Text Count                        |
| [Single] [Multi-block (v2)]       |
|                                   |
| +-------------------------------+ |
| |      Generate 5 templates     | |
| +-------------------------------+ |
|                                   |
| Uses your top-rated templates     |
| as quality reference.             |
+-----------------------------------+
```

Controls use `PanelButtonGroup` component from `src/components/ui/panel-controls/`. The concept text input label changes based on Prompt Mode:
- Reference -> "Reference (be specific)"
- Direction -> "Direction (aesthetic)"
- Freeform -> "Vibe (loose)"

### Generation Flow

1. User sets controls + types concept
2. Hits "Generate 5 templates"
3. Button shows loading spinner + "Generating... ~2-3 min" estimate
4. Server fetches top 3-5 rated templates: query Supabase `template_ratings` for highest `(impact + finish + flow + versatility + appeal) / 5`, then read corresponding TSX files from disk using the `templateRounds.json` ID-to-file mapping
5. Server builds prompt from template above with control values
6. Server calls Claude API to generate 5 template TSX files
7. Server writes files to `src/motionGraphics/templates/`, registers in `index.ts`
8. Each template scored by reward model (if trained; if untrained, skip scoring and show "Rate 10+ templates to enable quality predictions")
9. Server adds templates to `templateRounds.json` with round label `gen-{timestamp}`
10. All 5 saved — user rates them in Browse tab
11. Browse tab auto-filters to the new generation label
12. If user clicks "Generate" while one is in flight, the button is disabled with "Generation in progress..."

### Data Model

```typescript
interface GenerationConfig {
  promptMode: 'reference' | 'direction' | 'freeform'
  concept: string
  visualDensity: 'sparse' | 'balanced' | 'dense'
  animationSpeed: 'snappy' | 'standard' | 'cinematic'
  textRole: 'text-is-effect' | 'text-in-scene'
  textCount: 'single' | 'multi-block'
}
```

Stored in a Zustand store. Persisted to localStorage so settings survive reload.

### Files to Create/Modify

| File | Action |
|------|--------|
| `src/stores/useGenerationStore.ts` | New — GenerationConfig state + actions + generation status |
| `src/components/panels/MotionGalleryPanel.tsx` | Add pill tab bar, render GenerateTab |
| `src/components/panels/GenerateTab.tsx` | New — 5 controls using PanelButtonGroup + concept input + generate button |
| `server/routes/templateGeneration.ts` | New — POST /api/generate-templates endpoint |
| `server/services/templateGenerator.ts` | New — fetches top-rated TSX from disk, builds prompt, calls Claude, writes files |
| `src/motionGraphics/index.ts` | Auto-append imports for generated templates |
| `src/motionGraphics/templateRounds.json` | Auto-append generated template round labels |

### Not In Scope (v1)

- Multi-block text layout (requires KineticMultiBase — deferred to v2)
- Auto-deletion based on reward model scores (user rates everything)
- Batch size control (fixed at 5 per generation)
- History of past generation configs
- A/B testing between configs
