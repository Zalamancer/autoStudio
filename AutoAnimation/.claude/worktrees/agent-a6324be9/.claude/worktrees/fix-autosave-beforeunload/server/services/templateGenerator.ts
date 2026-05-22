/**
 * Template Generator — Few-Shot Claude Prompting
 *
 * Generates kinetic typography templates by:
 *   1. Fetching top-rated template TSX code from disk (ranked by Supabase ratings)
 *   2. Building a few-shot prompt with generation controls
 *   3. Calling Claude API to generate 5 templates
 *   4. Writing files to disk, updating index.ts and templateRounds.json
 *   5. Scoring each with the reward model
 */

import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import Anthropic from '@anthropic-ai/sdk'
import { getSupabaseAdmin, isSocialConfigured } from '../middleware/supabaseAuth'
import { predictTemplateScore, type PredictionResult } from './rewardModel'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const TEMPLATE_DIR = path.resolve(__dirname, '..', '..', 'src', 'motionGraphics', 'templates')
const KINETIC_BASE_PATH = path.resolve(__dirname, '..', '..', 'src', 'motionGraphics', 'KineticBase.tsx')
const ROUNDS_PATH = path.resolve(__dirname, '..', '..', 'src', 'motionGraphics', 'templateRounds.json')
const INDEX_PATH = path.resolve(__dirname, '..', '..', 'src', 'motionGraphics', 'index.ts')

// ── Types ────────────────────────────────────────────────────────────

export interface GenerationConfig {
  promptMode: 'reference' | 'direction' | 'freeform'
  concept: string
  visualDensity: 'sparse' | 'balanced' | 'dense'
  animationSpeed: 'snappy' | 'standard' | 'cinematic'
  textRole: 'text-is-effect' | 'text-in-scene'
  textCount: 'single' | 'multi-block'
}

export interface GeneratedTemplate {
  fileName: string
  id: string
  code: string
  prediction: PredictionResult | null
}

export interface GenerationResult {
  round: string
  templates: GeneratedTemplate[]
  promptTokens: number
  outputTokens: number
}

// ── Claude client ────────────────────────────────────────────────────

let anthropic: Anthropic | null = null

function getClient(): Anthropic {
  if (!anthropic) {
    const apiKey = process.env.ANTHROPIC_API_KEY
    if (!apiKey) throw new Error('ANTHROPIC_API_KEY is required for template generation')
    anthropic = new Anthropic({ apiKey })
  }
  return anthropic
}

// ── Fetch top-rated template code ────────────────────────────────────

interface RatedTemplate {
  id: string
  avgScore: number
  code: string
}

/**
 * Query Supabase for top-rated templates, then read their TSX from disk.
 * Returns template code strings sorted by average rating descending.
 */
export async function fetchTopRatedTemplateCode(topN: number = 3): Promise<RatedTemplate[]> {
  if (!isSocialConfigured()) return []

  const supabase = getSupabaseAdmin()
  const { data: rows, error } = await supabase
    .from('template_ratings')
    .select('template_id, impact')
    .not('impact', 'is', null)

  if (error || !rows || rows.length === 0) return []

  // Score = quality (stored in impact column)
  const scoreMap = new Map<string, { total: number; count: number }>()
  for (const row of rows) {
    const avg = row.impact ?? 0
    const existing = scoreMap.get(row.template_id)
    if (existing) {
      existing.total += avg
      existing.count += 1
    } else {
      scoreMap.set(row.template_id, { total: avg, count: 1 })
    }
  }

  // Sort by average score descending
  const ranked = [...scoreMap.entries()]
    .map(([id, { total, count }]) => ({ id, avgScore: total / count }))
    .sort((a, b) => b.avgScore - a.avgScore)
    .slice(0, topN * 3) // Read extra in case some files are missing

  // Build ID -> file content mapping by scanning template directory
  const idToCode = new Map<string, string>()
  const files = fs.readdirSync(TEMPLATE_DIR).filter(f => f.endsWith('.tsx'))
  for (const file of files) {
    const filePath = path.join(TEMPLATE_DIR, file)
    const content = fs.readFileSync(filePath, 'utf-8')
    const idMatch = content.match(/id:\s*['"]([^'"]+)['"]/)
    if (idMatch) {
      idToCode.set(idMatch[1], content)
    }
  }

  // Match rated templates to their code, ensuring STYLE DIVERSITY
  // Pick best from each style first, then fill remaining slots
  const stylePattern = /tags:\s*\[([^\]]+)\]/
  const styleKeywords: Record<string, RegExp> = {
    clean: /clean|minimal|simple|subtle|elegant/i,
    bold: /bold|impact|slam|aggressive|heavy/i,
    glitchy: /glitch|corrupt|static|noise|digital|cyber/i,
    retro: /retro|vintage|vhs|crt|classic|nostalgi/i,
    artsy: /art|creative|paint|water.?color|ink|brush|craft/i,
    trippy: /trippy|psychedel|acid|warp|morph|neon|glow/i,
    cinematic: /cinema|film|movie|theater|dramatic/i,
    playful: /playful|fun|bounce|cartoon|bubble|candy/i,
  }

  function detectStyle(code: string): string {
    const tagsMatch = code.match(stylePattern)
    const txt = (tagsMatch?.[1] || '').toLowerCase()
    for (const [style, re] of Object.entries(styleKeywords)) {
      if (re.test(txt)) return style
    }
    return 'other'
  }

  // Group by style, pick best from each
  const byStyle = new Map<string, RatedTemplate[]>()
  for (const { id, avgScore } of ranked) {
    const code = idToCode.get(id)
    if (!code) continue
    const style = detectStyle(code)
    if (!byStyle.has(style)) byStyle.set(style, [])
    byStyle.get(style)!.push({ id, avgScore, code })
  }

  // Round-robin: take top 1 from each style until we have enough
  const results: RatedTemplate[] = []
  const usedStyles = new Set<string>()
  const styleEntries = [...byStyle.entries()].sort((a, b) => b[1][0].avgScore - a[1][0].avgScore)

  for (const [style, templates] of styleEntries) {
    if (results.length >= topN) break
    if (templates.length > 0 && !usedStyles.has(style)) {
      results.push(templates[0])
      usedStyles.add(style)
    }
  }
  // If still need more, fill from remaining top-scored regardless of style
  if (results.length < topN) {
    const usedIds = new Set(results.map(r => r.id))
    for (const { id, avgScore } of ranked) {
      if (results.length >= topN) break
      if (usedIds.has(id)) continue
      const code = idToCode.get(id)
      if (code) results.push({ id, avgScore, code })
    }
  }

  return results
}

// ── Prompt builder ───────────────────────────────────────────────────

function buildPrompt(
  examples: RatedTemplate[],
  kineticBaseCode: string,
  config: GenerationConfig,
): string {
  const exampleBlocks = examples
    .map((ex, i) => `### Example ${i + 1} (avg score: ${ex.avgScore.toFixed(2)})\n\`\`\`tsx\n${ex.code}\n\`\`\``)
    .join('\n\n')

  const controlBlock = [
    `Visual density: ${config.visualDensity}`,
    `Animation speed: ${config.animationSpeed}`,
    `Text role: ${config.textRole}`,
    `Text count: ${config.textCount}`,
    config.concept ? `Concept direction: ${config.concept}` : null,
  ].filter(Boolean).join('\n')

  return `You are the world's best motion graphics engineer. Generate exactly 5 new kinetic typography templates for Remotion/React.

## KineticBase.tsx (shared base — import and use this)
\`\`\`tsx
${kineticBaseCode}
\`\`\`

## Top-rated examples from our library
These scored highest with users. Study their patterns, then create something even more incredible.

${exampleBlocks}

## Generation controls
${controlBlock}

## Requirements
- Each template must be a single self-contained TSX file
- Import from '../registry' and '../KineticBase' exactly like the examples
- Call registerMotionGraphic() at the bottom with a unique id (format: tpl-kinetic-kebab-case)
- Every template must look visually incredible — stunning animations, polished timing, creative effects
- Each template must be meaningfully different from the examples and from each other
- Use only React, CSS transforms, and SVG — no external dependencies
- Use deterministic math (no Math.random()) — derive randomness from frame/index seeds

## Output format
For each template, output:
// FILE: KineticName.tsx
\`\`\`tsx
// full template code
\`\`\`

Generate all 5 templates now.`
}

// ── Parse Claude response ────────────────────────────────────────────

interface ParsedTemplate {
  fileName: string
  code: string
}

/**
 * Extract template files from Claude's response.
 * Looks for: // FILE: Name.tsx followed by a tsx code block.
 */
function parseGeneratedTemplates(response: string): ParsedTemplate[] {
  const templates: ParsedTemplate[] = []
  const pattern = /\/\/\s*FILE:\s*(Kinetic\w+\.tsx)\s*\n```tsx\n([\s\S]*?)```/g
  let match: RegExpExecArray | null

  while ((match = pattern.exec(response)) !== null) {
    const fileName = match[1]
    const code = match[2].trim()
    if (fileName && code && code.length > 100) {
      templates.push({ fileName, code })
    }
  }

  return templates
}

// ── File writing & index updates ─────────────────────────────────────

function writeTemplateFile(fileName: string, code: string): void {
  const filePath = path.join(TEMPLATE_DIR, fileName)
  fs.writeFileSync(filePath, code, 'utf-8')
}

function updateTemplateRounds(ids: string[], roundLabel: string): void {
  let rounds: Record<string, string> = {}
  if (fs.existsSync(ROUNDS_PATH)) {
    rounds = JSON.parse(fs.readFileSync(ROUNDS_PATH, 'utf-8'))
  }
  for (const id of ids) {
    rounds[id] = roundLabel
  }
  fs.writeFileSync(ROUNDS_PATH, JSON.stringify(rounds, null, 2) + '\n', 'utf-8')
}

const GEN_LOG_PATH = path.resolve(__dirname, '..', '..', 'src', 'motionGraphics', 'templateGenerationLog.json')

function logGeneration(roundLabel: string, config: GenerationConfig, templateIds: string[]): void {
  let log: Record<string, any> = {}
  if (fs.existsSync(GEN_LOG_PATH)) {
    try { log = JSON.parse(fs.readFileSync(GEN_LOG_PATH, 'utf-8')) } catch {}
  }
  log[roundLabel] = {
    config,
    templateIds,
    generatedAt: new Date().toISOString(),
  }
  fs.writeFileSync(GEN_LOG_PATH, JSON.stringify(log, null, 2) + '\n', 'utf-8')
}

function appendToIndex(fileNames: string[]): void {
  const existing = fs.readFileSync(INDEX_PATH, 'utf-8')
  const newImports = fileNames
    .filter(name => {
      // Skip if import already exists
      const baseName = name.replace('.tsx', '')
      return !existing.includes(`'./templates/${baseName}'`)
    })
    .map(name => {
      const baseName = name.replace('.tsx', '')
      return `import './templates/${baseName}'`
    })

  if (newImports.length === 0) return

  const block = `\n// ── Generated batch ──────────────────────────────────────────────────\n${newImports.join('\n')}\n`
  fs.writeFileSync(INDEX_PATH, existing + block, 'utf-8')
}

/**
 * Extract the template id from generated code.
 */
function extractTemplateId(code: string): string | null {
  const match = code.match(/id:\s*['"]([^'"]+)['"]/)
  return match ? match[1] : null
}

// ── Main generation pipeline ─────────────────────────────────────────

/**
 * Generate a batch of kinetic typography templates.
 *
 * 1. Fetch top-rated examples from Supabase + disk
 * 2. Build few-shot prompt with controls
 * 3. Call Claude to generate 5 templates
 * 4. Write files, update index.ts and templateRounds.json
 * 5. Score each with the reward model
 */
export async function generateTemplates(config: GenerationConfig): Promise<GenerationResult> {
  const roundLabel = `gen-${Date.now()}`

  // 1. Fetch top-rated examples
  const examples = await fetchTopRatedTemplateCode(3)

  // Read KineticBase.tsx
  const kineticBaseCode = fs.readFileSync(KINETIC_BASE_PATH, 'utf-8')

  // 2. Build prompt
  const prompt = buildPrompt(examples, kineticBaseCode, config)

  // 3. Call Claude
  const client = getClient()
  const message = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 16000,
    messages: [{ role: 'user', content: prompt }],
  })

  const textBlock = message.content.find(block => block.type === 'text')
  if (!textBlock || textBlock.type !== 'text') {
    throw new Error('No text response from Claude')
  }

  // 4. Parse generated templates
  const parsed = parseGeneratedTemplates(textBlock.text)
  if (parsed.length === 0) {
    throw new Error('Claude response contained no valid templates')
  }

  // 5. Write files, update index, score with reward model
  const results: GeneratedTemplate[] = []
  const validFileNames: string[] = []
  const validIds: string[] = []

  for (const { fileName, code } of parsed) {
    const id = extractTemplateId(code)
    if (!id) continue

    // Write TSX file
    writeTemplateFile(fileName, code)
    validFileNames.push(fileName)
    validIds.push(id)

    // Score with reward model
    const prediction = predictTemplateScore(code)

    results.push({ fileName, id, code, prediction })
  }

  // Update templateRounds.json
  if (validIds.length > 0) {
    updateTemplateRounds(validIds, roundLabel)
  }

  // Append imports to index.ts
  if (validFileNames.length > 0) {
    appendToIndex(validFileNames)
  }

  // Log generation prompt + config for prompt evaluation
  if (validIds.length > 0) {
    logGeneration(roundLabel, config, validIds)
  }

  return {
    round: roundLabel,
    templates: results,
    promptTokens: message.usage.input_tokens,
    outputTokens: message.usage.output_tokens,
  }
}
