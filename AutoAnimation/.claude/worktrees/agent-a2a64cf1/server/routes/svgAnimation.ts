import { Router, type Request, type Response } from 'express'
import { isClaudeConfigured } from '../services/claude.js'
import Anthropic from '@anthropic-ai/sdk'

const router = Router()

let client: Anthropic | null = null
function getClient(): Anthropic {
  if (!client) {
    const apiKey = process.env.ANTHROPIC_API_KEY
    if (!apiKey) throw new Error('ANTHROPIC_API_KEY environment variable is required')
    client = new Anthropic({ apiKey })
  }
  return client
}

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
- Use at least 5-12 animated elements for visual richness.
- Ensure smooth looping: end state should match start state in keyframes.
- NEVER include <script> tags — animation must be purely CSS.

AFTER the closing </html> tag, add a JSON metadata comment:
<!-- META: {"name": "short_name", "category": "background|overlay|transition", "tags": ["tag1", "tag2"]} -->`

/**
 * POST /api/svg-animation/generate
 *
 * Ultra tier: Claude Opus 4.6 with extended thinking for highest quality SVG animations.
 */
router.post('/generate', async (req: Request, res: Response) => {
  if (!isClaudeConfigured()) {
    res.status(503).json({ error: 'Claude API not configured (ANTHROPIC_API_KEY missing on server)' })
    return
  }

  const { prompt, category, width = 512, height = 512, duration = 3 } = req.body as {
    prompt?: string
    category?: string
    width?: number
    height?: number
    duration?: number
  }

  if (!prompt) {
    res.status(400).json({ error: 'Missing required field: prompt' })
    return
  }

  console.log('[svgAnimation/ultra] Generating:', prompt)

  const categoryHint = category === 'overlay'
    ? ' IMPORTANT: Use a fully transparent background — no background color, no background fill, no full-canvas rectangle. Only render the animated elements themselves.'
    : category === 'background'
      ? ' This should be a background-style animation that fills the entire canvas.'
      : ''

  const userPrompt = `Create a looping SVG + CSS animation: "${prompt}"
Canvas: ${width}x${height}px, ${duration}s duration.${categoryHint}`

  try {
    const anthropic = getClient()

    const stream = anthropic.messages.stream({
      model: 'claude-opus-4-6',
      max_tokens: 65536,
      thinking: { type: 'enabled', budget_tokens: 32768 },
      messages: [{ role: 'user', content: userPrompt }],
      system: SYSTEM_PROMPT,
    })

    const response = await stream.finalMessage()

    const textBlock = response.content.find(block => block.type === 'text')
    if (!textBlock || textBlock.type !== 'text') {
      res.status(500).json({ error: 'No text response from Claude' })
      return
    }

    const rawText = textBlock.text

    // Extract clean HTML
    let html = extractHtml(rawText)
    if (!html) {
      console.error('[svgAnimation/ultra] Could not extract HTML from response (first 1000 chars):', rawText.slice(0, 1000))
      res.status(500).json({ error: 'Could not extract valid SVG+CSS HTML from AI response' })
      return
    }

    if (!html.includes('<svg')) {
      res.status(500).json({ error: 'Generated content does not contain an SVG element' })
      return
    }

    // Extract metadata
    let name = prompt.slice(0, 30)
    let resultCategory: string = category || 'overlay'
    let tags: string[] = []

    const metaMatch = html.match(/<!--\s*META:\s*(\{[\s\S]*?\})\s*-->/)
    if (metaMatch) {
      try {
        const meta = JSON.parse(metaMatch[1])
        if (meta.name) name = meta.name
        if (meta.category) resultCategory = meta.category
        if (Array.isArray(meta.tags)) tags = meta.tags
      } catch {
        // ignore malformed metadata
      }
      html = html.replace(metaMatch[0], '').trim()
    }

    console.log('[svgAnimation/ultra] Generated:', name)

    res.json({ svgHtml: html, name, category: resultCategory, tags })
  } catch (err) {
    console.error('[svgAnimation/ultra] Error:', err)
    const message = err instanceof Error ? err.message : 'Unknown error'
    res.status(500).json({ error: `Generation failed: ${message}` })
  }
})

/** Extract clean HTML from raw text (strip markdown fences, find doctype/html tags). */
function extractHtml(raw: string): string | null {
  let text = raw
    .replace(/```html\n?/g, '')
    .replace(/```\n?/g, '')
    .trim()

  const doctypeMatch = text.match(/(<!DOCTYPE html>[\s\S]*<\/html>)/i)
  if (doctypeMatch) {
    text = doctypeMatch[1]
  } else {
    const htmlMatch = text.match(/(<html[\s\S]*<\/html>)/i)
    if (htmlMatch) {
      text = htmlMatch[1]
    }
  }

  // Preserve META comment after </html>
  const afterHtml = raw.slice(raw.lastIndexOf('</html>') + 7)
  const metaComment = afterHtml.match(/(<!--\s*META:[\s\S]*?-->)/)
  if (metaComment && !text.includes('META:')) {
    text = text + '\n' + metaComment[1]
  }

  if (text.includes('<svg') && text.includes('<style')) {
    return text.trim()
  }

  // Fallback: if text has <svg, use it directly
  if (text.includes('<svg')) {
    return text.trim()
  }

  return null
}

export default router
