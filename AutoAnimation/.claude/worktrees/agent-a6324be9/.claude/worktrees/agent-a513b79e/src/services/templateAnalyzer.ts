/**
 * templateAnalyzer.ts
 *
 * AI-powered template analysis service. Sends template HTML to Gemini 2.0 Flash
 * to discover ALL configurable fields. Results are cached in localStorage so each
 * template is analyzed only once (unless its content changes).
 *
 * Provides compact field summaries for the orchestrator prompt so the AI generates
 * accurate config values matching actual template CONFIG objects.
 */

import type { AITemplateField, AITemplateAnalysis, AIFieldType } from '@/types/templateAnalysis'
import { parseTemplateConfig, type TemplateConfigProperty } from '@/services/templateConfigParser'
import { callGeminiProxy } from '@/services/aiProxy'

// ── Constants ──

const GEMINI_API_URL = 'gemini-3.1-flash-lite-preview' // model name for callGeminiProxy

const CACHE_KEY = 'proanimate-template-analysis-v1'

// ── Cache types ──

interface AnalysisCache {
  version: 1
  entries: Record<string, AITemplateAnalysis>
}

// ── Content hashing ──

/** Simple djb2 hash for cache invalidation */
export function hashContent(html: string): string {
  let hash = 5381
  for (let i = 0; i < html.length; i++) {
    hash = ((hash << 5) + hash + html.charCodeAt(i)) | 0
  }
  return (hash >>> 0).toString(36)
}

// ── Cache helpers ──

function loadCache(): AnalysisCache {
  try {
    const raw = localStorage.getItem(CACHE_KEY)
    if (raw) {
      const parsed = JSON.parse(raw) as AnalysisCache
      if (parsed.version === 1 && parsed.entries) return parsed
    }
  } catch {
    // corrupt cache, reset
  }
  return { version: 1, entries: {} }
}

function saveCache(cache: AnalysisCache): void {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(cache))
  } catch {
    // localStorage full — clear old entries
    console.warn('[TemplateAnalyzer] localStorage full, clearing analysis cache')
    localStorage.removeItem(CACHE_KEY)
  }
}

// ── AI analysis prompt ──

function buildAnalysisPrompt(html: string): string {
  return `Analyze this HTML template and list every configurable field.

Focus on (in priority order):
1. const CONFIG = {...} keys
2. CSS custom properties (--var-name)
3. Data arrays and object arrays
4. Color values, animation speeds, counts

For each field, return a compact JSON object with ONLY these keys:
- key (string): CONFIG key name
- label (string): short human name (2-4 words)
- fieldType (string): one of color|text|number|boolean|text-array|object-array|select|font
- defaultValue: current value (for arrays, include 1-2 sample items max)
- group (string): Content|Colors|Typography|Animation|Layout|Data|Media
- objectSchema (object, only for object-array): {fieldName: "type"} — types are text|number|color|boolean

IMPORTANT: Keep defaultValue SHORT. For arrays with many items, include only the FIRST item as a sample.

Also return "compactSummary": a single string like "title:text, data:object-array[{category:text,value:number}], bgColor:color"

<TEMPLATE_HTML>
${html}
</TEMPLATE_HTML>

Return ONLY valid JSON (no markdown): {"fields":[...],"compactSummary":"..."}`
}

function buildSummaryOnlyPrompt(html: string): string {
  return `Look at this HTML template's const CONFIG = {...} object and any CSS variables. Return a single compact summary string listing each configurable key and its type.

Format: "key1:type, key2:type, key3:object-array[{field1:type,field2:type}]"
Types: text, number, color, boolean, text-array, object-array, select, font

Example output: {"compactSummary":"title:text, data:object-array[{category:text,value:number}], theme:select, bgColor:color"}

<TEMPLATE_HTML>
${html}
</TEMPLATE_HTML>

Return ONLY valid JSON (no markdown): {"compactSummary":"..."}`
}

// ── AI analysis ──

async function callGemini(prompt: string, maxTokens: number): Promise<string> {
  const response = await callGeminiProxy(GEMINI_API_URL, {
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: 0.1,
        maxOutputTokens: maxTokens,
      },
    })

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`Gemini API error: ${response.statusText} - ${errorText}`)
  }

  const data = await response.json()
  const textContent = data.candidates?.[0]?.content?.parts?.[0]?.text || ''

  return textContent
    .replace(/```json\n?/g, '')
    .replace(/```\n?/g, '')
    .trim()
}

function parseAnalysisJSON(cleaned: string): { fields: AITemplateField[]; compactSummary: string } {
  const parsed = JSON.parse(cleaned)
  return {
    fields: parsed.fields || [],
    compactSummary: parsed.compactSummary || '',
  }
}

export async function analyzeTemplateWithAI(
  templateId: string,
  html: string,
): Promise<AITemplateAnalysis> {
  // Attempt 1: full analysis with fields + summary
  try {
    const cleaned = await callGemini(buildAnalysisPrompt(html), 8192)
    const parsed = parseAnalysisJSON(cleaned)

    return {
      templateId,
      contentHash: hashContent(html),
      analyzedAt: Date.now(),
      fields: parsed.fields,
      compactSummary: parsed.compactSummary,
      source: 'ai',
    }
  } catch (fullErr) {
    console.warn(`[TemplateAnalyzer] Full analysis failed for ${templateId}, trying summary-only:`, fullErr)
  }

  // Attempt 2: summary-only (much smaller response, unlikely to truncate)
  const cleaned = await callGemini(buildSummaryOnlyPrompt(html), 2048)
  const parsed = JSON.parse(cleaned) as { compactSummary: string }

  return {
    templateId,
    contentHash: hashContent(html),
    analyzedAt: Date.now(),
    fields: [],
    compactSummary: parsed.compactSummary || '',
    source: 'ai',
  }
}

// ── Static parser fallback ──

/** Map existing parseTemplateConfig() output to AITemplateAnalysis format */
function mapConfigPropertyType(type: string): AIFieldType {
  switch (type) {
    case 'color':
      return 'color'
    case 'number':
      return 'number'
    case 'boolean':
      return 'boolean'
    case 'text-array':
      return 'text-array'
    case 'object-array':
      return 'object-array'
    case 'nested-colors':
      return 'color'
    default:
      return 'text'
  }
}

function buildCompactSummaryFromProperties(properties: TemplateConfigProperty[]): string {
  return properties
    .map((p) => {
      const fieldType = mapConfigPropertyType(p.type)
      if (fieldType === 'object-array' && Array.isArray(p.value) && p.value.length > 0) {
        const sample = p.value[0] as Record<string, unknown>
        const schemaKeys = Object.keys(sample)
          .map((k) => {
            const v = sample[k]
            if (typeof v === 'number') return `${k}:number`
            if (typeof v === 'boolean') return `${k}:boolean`
            return `${k}:text`
          })
          .join(',')
        return `${p.key}:object-array[{${schemaKeys}}]`
      }
      return `${p.key}:${fieldType}`
    })
    .join(', ')
}

export function staticParserFallback(templateId: string, html: string): AITemplateAnalysis {
  const properties = parseTemplateConfig(html)

  const fields: AITemplateField[] = properties.map((p) => ({
    key: p.key,
    label: p.label,
    fieldType: mapConfigPropertyType(p.type),
    defaultValue: p.value,
    description: `${p.label} (${p.group})`,
    group: p.group === 'Numbers' ? 'Layout' : p.group === 'Text' ? 'Content' : p.group,
  }))

  return {
    templateId,
    contentHash: hashContent(html),
    analyzedAt: Date.now(),
    fields,
    compactSummary: buildCompactSummaryFromProperties(properties),
    source: 'static',
  }
}

// ── Main entry point ──

/**
 * Get template analysis: check cache → AI → fallback.
 * Always caches the result.
 */
export async function getTemplateAnalysis(
  templateId: string,
  html: string,
): Promise<AITemplateAnalysis> {
  const cache = loadCache()
  const contentHash = hashContent(html)

  // Cache hit — same template & same content
  const cached = cache.entries[templateId]
  if (cached && cached.contentHash === contentHash) {
    console.log(`[TemplateAnalyzer] Cache hit for ${templateId}`)
    return cached
  }

  // Try AI analysis
  {
    try {
      console.log(`[TemplateAnalyzer] Analyzing ${templateId} with AI...`)
      const analysis = await analyzeTemplateWithAI(templateId, html)
      cache.entries[templateId] = analysis
      saveCache(cache)
      console.log(`[TemplateAnalyzer] AI analysis cached for ${templateId}: ${analysis.compactSummary}`)
      return analysis
    } catch (err) {
      console.warn(`[TemplateAnalyzer] AI analysis failed for ${templateId}, using static fallback:`, err)
    }
  }

  // Fallback to static parser
  console.log(`[TemplateAnalyzer] Using static fallback for ${templateId}`)
  const fallback = staticParserFallback(templateId, html)
  cache.entries[templateId] = fallback
  saveCache(cache)
  return fallback
}

// ── Synchronous accessors (for prompt building) ──

/** Synchronous — returns cached compact summary or empty string */
export function getTemplateCompactSummary(templateId: string): string {
  const cache = loadCache()
  return cache.entries[templateId]?.compactSummary || ''
}

/** Returns all cached summaries as Record<templateId, compactSummary> */
export function getAllCachedSummaries(): Record<string, string> {
  const cache = loadCache()
  const result: Record<string, string> = {}
  for (const [id, analysis] of Object.entries(cache.entries)) {
    if (analysis.compactSummary) {
      result[id] = analysis.compactSummary
    }
  }
  return result
}

// ── Batch analysis ──

/**
 * Batch analyze multiple templates with rate limiting.
 * Useful for pre-warming the cache on app startup or settings page.
 */
export async function preAnalyzeTemplates(
  templates: { id: string; html: string }[],
  onProgress?: (done: number, total: number) => void,
): Promise<void> {
  const cache = loadCache()

  for (let i = 0; i < templates.length; i++) {
    const { id, html } = templates[i]
    const contentHash = hashContent(html)

    // Skip if already cached with same content
    if (cache.entries[id]?.contentHash === contentHash) {
      onProgress?.(i + 1, templates.length)
      continue
    }

    try {
      const analysis = await getTemplateAnalysis(id, html)
      cache.entries[id] = analysis
      saveCache(cache)
    } catch (err) {
      console.warn(`[TemplateAnalyzer] Pre-analysis failed for ${id}:`, err)
    }

    onProgress?.(i + 1, templates.length)

    // Rate limiting: 500ms between AI calls
    if (i < templates.length - 1) {
      await new Promise((r) => setTimeout(r, 500))
    }
  }
}

// ── Cache management ──

export function clearAnalysisCache(): void {
  localStorage.removeItem(CACHE_KEY)
  console.log('[TemplateAnalyzer] Cache cleared')
}
