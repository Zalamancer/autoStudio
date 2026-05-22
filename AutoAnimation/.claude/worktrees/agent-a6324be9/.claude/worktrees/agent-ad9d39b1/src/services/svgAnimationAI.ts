/**
 * SVG + CSS Animation Generation — Multi-tier
 *
 * Three quality tiers:
 * - Fast   → Gemini 2.0 Flash (frontend direct, fastest)
 * - Quality → Gemini 3.1 Pro Preview (frontend direct, highest Gemini quality)
 * - Ultra  → Claude Opus 4.6 with extended thinking (server proxy)
 *
 * Fast/Quality use a two-step pipeline:
 * 1. Creative generation with the selected model
 * 2. Gemini 2.0 Flash — cheap/fast extraction of clean HTML (fallback)
 */

import { withCreditGate } from './creditGate'
import { injectAnimationBridge } from './svgAnimationBridge'
import { callGeminiProxy } from '@/services/aiProxy'

// ── Types ──

export type ModelTier = 'fast' | 'quality' | 'ultra'

export interface SVGAnimationOptions {
  prompt: string
  category?: 'background' | 'overlay' | 'transition'
  width?: number
  height?: number
  /** Duration in seconds (default 3) */
  duration?: number
  /** Model quality tier (default 'fast') */
  tier?: ModelTier
}

export interface SVGAnimationResult {
  svgHtml: string
  name: string
  category: 'background' | 'overlay' | 'transition'
  tags: string[]
}

// ── Gemini Model Names (used with callGeminiProxy) ──

const GEMINI_MODELS: Record<string, string> = {
  fast: 'gemini-3.1-flash-lite-preview',
  quality: 'gemini-3.1-pro-preview',
}

const GEMINI_FLASH_MODEL = GEMINI_MODELS.fast

// ── Prompts ──

const SYSTEM_PROMPT = `You are an expert motion graphics designer. Given a text description, produce a complete, self-contained HTML document with an SVG animation using CSS @keyframes.

OUTPUT: Return ONLY the raw HTML document (no markdown, no code fences). The document must be a complete HTML page.

STRUCTURE:
<!DOCTYPE html>
<html>
<head>
<style>
  * { margin: 0; padding: 0; }
  body { overflow: hidden; background: transparent; }
  svg { width: 100%; height: 100%; display: block; }
  /* CSS @keyframes and animation rules here */
</style>
</head>
<body>
<svg viewBox="0 0 WIDTH HEIGHT" xmlns="http://www.w3.org/2000/svg">
  <!-- SVG elements with class names for CSS animation -->
</svg>
</body>
</html>

RULES:
- Use CSS @keyframes for ALL animation — no JavaScript, no SMIL <animate> tags.
- Apply animations via CSS classes on SVG elements (circles, rects, paths, groups, etc.).
- Use animation-iteration-count: infinite for looping.
- Use transform-origin and transform-box: fill-box for proper SVG transforms.
- Create visually rich, polished animations with multiple moving elements.
- Use vibrant colors, gradients (linearGradient/radialGradient defined in SVG <defs>), and varied timing.
- Stagger animations with animation-delay for organic, layered motion.
- Use diverse easing functions (ease-in-out, cubic-bezier, etc.).
- Keep the SVG viewBox matching the requested dimensions.
- Background animations should fill the entire canvas with visual interest.
- Overlay animations should have a transparent background (no body background color).
- Use at least 3-8 animated elements for visual richness.
- Ensure smooth looping: end state should match start state in keyframes.
- NEVER include <script> tags — animation must be purely CSS.

AFTER the closing </html> tag, add a JSON metadata comment:
<!-- META: {"name": "short_name", "category": "background|overlay|transition", "tags": ["tag1", "tag2"]} -->`

const EXTRACT_PROMPT = `Extract the complete HTML document from the text below. Return ONLY the HTML — starting from <!DOCTYPE html> or <html> through the closing </html> tag. Include any <!-- META: ... --> comment that appears after </html>. Do not add any explanation, markdown fences, or extra text.

If the text contains multiple HTML documents, return only the first complete one.

TEXT TO EXTRACT FROM:
`

// ── Main entry point ──

export async function generateSVGAnimation(options: SVGAnimationOptions): Promise<SVGAnimationResult> {
  return withCreditGate('lottie-generate', () => _generateImpl(options))
}

async function _generateImpl(options: SVGAnimationOptions): Promise<SVGAnimationResult> {
  const tier = options.tier ?? 'fast'

  // Ultra tier → server proxy (Claude Opus 4.6)
  if (tier === 'ultra') {
    return _generateUltra(options)
  }

  // Fast / Quality tiers → Gemini (frontend direct)
  return _generateGemini(options, tier)
}

/** Ultra tier: Claude Opus 4.6 via server proxy. */
async function _generateUltra(options: SVGAnimationOptions): Promise<SVGAnimationResult> {
  console.log('[SVGAnimAI] Ultra tier — calling server proxy:', options.prompt)

  const response = await fetch('/api/svg-animation/generate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      prompt: options.prompt,
      category: options.category,
      width: options.width ?? 512,
      height: options.height ?? 512,
      duration: options.duration ?? 3,
    }),
  })

  if (!response.ok) {
    const err = await response.json().catch(() => ({ error: response.statusText }))
    throw new Error(err.error || `Server error: ${response.statusText}`)
  }

  const data = (await response.json()) as {
    svgHtml: string
    name: string
    category: string
    tags: string[]
  }

  // Inject the playback bridge on the frontend side
  const html = injectAnimationBridge(data.svgHtml)

  console.log('[SVGAnimAI] Ultra generated:', data.name)

  return {
    svgHtml: html,
    name: data.name,
    category: (data.category as 'background' | 'overlay' | 'transition') || options.category || 'overlay',
    tags: data.tags || [],
  }
}

/** Fast / Quality tier: Gemini direct from frontend. */
async function _generateGemini(options: SVGAnimationOptions, tier: 'fast' | 'quality'): Promise<SVGAnimationResult> {
  const width = options.width ?? 512
  const height = options.height ?? 512
  const duration = options.duration ?? 3
  const model = GEMINI_MODELS[tier]

  const categoryHint =
    options.category === 'overlay'
      ? ' IMPORTANT: Use a fully transparent background — no background color, no background fill, no full-canvas rectangle. Only render the animated elements themselves.'
      : options.category === 'background'
        ? ' This should be a background-style animation that fills the entire canvas.'
        : ''

  const userPrompt = `Create a looping SVG + CSS animation: "${options.prompt}"
Canvas: ${width}x${height}px, ${duration}s duration.${categoryHint}`

  console.log(`[SVGAnimAI] ${tier} tier — generating:`, options.prompt)

  // ── Step 1: Creative generation ──
  // Quality tier (thinking model) needs a larger budget — thinking tokens count against maxOutputTokens.
  // Cap thinking at 10k tokens so the actual HTML output gets the remaining ~55k.
  const genConfig =
    tier === 'quality'
      ? { temperature: 1, maxOutputTokens: 65536, thinkingBudget: 10240 }
      : { temperature: 1, maxOutputTokens: 16384 }
  const rawText = await callGeminiWithThinking(model, SYSTEM_PROMPT, userPrompt, genConfig)

  console.log('[SVGAnimAI] Raw response length:', rawText.length, '| first 300 chars:', rawText.slice(0, 300))

  // Try quick local extraction first (avoids Flash call if model returned clean output)
  let html = tryLocalExtract(rawText)

  // ── Step 2: If local extraction failed, use Flash to parse it ──
  if (!html) {
    console.log('[SVGAnimAI] Local extraction failed, calling Flash to extract HTML...')
    const extracted = await callGeminiWithThinking(GEMINI_FLASH_MODEL, undefined, EXTRACT_PROMPT + rawText, {
      temperature: 0,
      maxOutputTokens: 16384,
    })
    console.log('[SVGAnimAI] Flash response length:', extracted.length, '| first 300 chars:', extracted.slice(0, 300))
    html = tryLocalExtract(extracted) || tryDirectUse(extracted)
  }

  if (!html) {
    console.error('[SVGAnimAI] Full raw response:\n', rawText.slice(0, 2000))
    throw new Error('Could not extract valid SVG+CSS HTML from AI response')
  }

  if (!html.includes('<svg')) {
    throw new Error('Generated content does not contain an SVG element')
  }

  // Extract metadata from trailing comment
  let name = options.prompt.slice(0, 30)
  let category: 'background' | 'overlay' | 'transition' = options.category || 'overlay'
  let tags: string[] = []

  const metaMatch = html.match(/<!--\s*META:\s*(\{[\s\S]*?\})\s*-->/)
  if (metaMatch) {
    try {
      const meta = JSON.parse(metaMatch[1])
      if (meta.name) name = meta.name
      if (meta.category) category = meta.category
      if (Array.isArray(meta.tags)) tags = meta.tags
    } catch {
      // ignore malformed metadata
    }
    html = html.replace(metaMatch[0], '').trim()
  }

  // Inject the playback bridge
  html = injectAnimationBridge(html)

  console.log('[SVGAnimAI] Generated animation:', name)

  return { svgHtml: html, name, category, tags }
}

// ── Helpers ──

/** Try to extract a clean HTML document from raw text locally (no API call). */
function tryLocalExtract(raw: string): string | null {
  // Strip markdown code fences
  let text = raw
    .replace(/```html\n?/g, '')
    .replace(/```\n?/g, '')
    .trim()

  // Try to find <!DOCTYPE html>...<\/html> or <html>...<\/html>
  const doctypeMatch = text.match(/(<!DOCTYPE html>[\s\S]*<\/html>)/i)
  if (doctypeMatch) {
    text = doctypeMatch[1]
  } else {
    const htmlMatch = text.match(/(<html[\s\S]*<\/html>)/i)
    if (htmlMatch) {
      text = htmlMatch[1]
    }
  }

  // Preserve META comment if it exists after </html>
  const afterHtml = raw.slice(raw.lastIndexOf('</html>') + 7)
  const metaComment = afterHtml.match(/(<!--\s*META:[\s\S]*?-->)/)
  if (metaComment && !text.includes('META:')) {
    text = text + '\n' + metaComment[1]
  }

  // Validate it has the essential elements
  if (text.includes('<svg') && text.includes('<style')) {
    return text.trim()
  }

  return null
}

/**
 * Last-resort: if the text contains <svg, use it directly even without <style
 * (some models inline styles as attributes). Strip any leading/trailing non-HTML.
 */
function tryDirectUse(raw: string): string | null {
  let text = raw
    .replace(/```html\n?/g, '')
    .replace(/```\n?/g, '')
    .trim()

  // Must at minimum have an SVG element
  if (!text.includes('<svg')) return null

  // If it doesn't start with < it has leading prose — trim to first tag
  const firstTag = text.indexOf('<')
  if (firstTag > 0) {
    text = text.slice(firstTag)
  }

  // Trim anything after the last closing tag
  const lastClose = Math.max(text.lastIndexOf('</html>'), text.lastIndexOf('</svg>'))
  if (lastClose !== -1) {
    // Keep the closing tag itself
    const tagEnd = text.indexOf('>', lastClose)
    if (tagEnd !== -1) {
      // Also preserve any META comment right after
      const remainder = text.slice(tagEnd + 1)
      const metaPart = remainder.match(/(<!--\s*META:[\s\S]*?-->)/)
      text = text.slice(0, tagEnd + 1) + (metaPart ? '\n' + metaPart[1] : '')
    }
  }

  return text.trim() || null
}

/** Call Gemini via server proxy and return the text response (handles thinking models). */
async function callGeminiWithThinking(
  model: string,
  systemPrompt: string | undefined,
  userPrompt: string,
  config: { temperature: number; maxOutputTokens: number; thinkingBudget?: number },
): Promise<string> {
  const { thinkingBudget, ...genConfig } = config
  const generationConfig: Record<string, unknown> = { ...genConfig }
  if (thinkingBudget != null) {
    generationConfig.thinkingConfig = { thinkingBudget }
  }

  const requestBody: Record<string, unknown> = {
    contents: [{ parts: [{ text: userPrompt }] }],
    generationConfig,
  }

  if (systemPrompt) {
    requestBody.system_instruction = { parts: [{ text: systemPrompt }] }
  }

  const response = await callGeminiProxy(model, requestBody)

  if (!response.ok) {
    const errorText = await response.text()
    console.error('[SVGAnimAI] API error:', response.status, errorText)
    throw new Error(`Gemini API call failed: ${response.status}`)
  }

  const data = await response.json()
  const candidate = data.candidates?.[0]
  const finishReason = candidate?.finishReason as string | undefined
  const parts: Array<{ text?: string; thought?: boolean }> = candidate?.content?.parts || []

  // Thinking models return thought parts before the actual output. Skip them.
  const outputParts = parts.filter((p) => !p.thought && p.text)
  const textContent =
    outputParts.length > 0 ? outputParts.map((p) => p.text).join('\n') : parts.map((p) => p.text || '').join('\n')

  if (!textContent.trim()) {
    if (finishReason === 'SAFETY') {
      throw new Error('Generation was blocked by safety filters. Try a different prompt.')
    }
    if (data.promptFeedback?.blockReason) {
      throw new Error(`Generation blocked: ${data.promptFeedback.blockReason}. Try a different prompt.`)
    }
    throw new Error(`Gemini returned empty response (finishReason: ${finishReason || 'unknown'})`)
  }

  return textContent
}
