/**
 * componentGenerator.ts
 *
 * Uses Gemini 3 Flash to generate self-contained HTML5 components
 * (pricing cards, dashboards, animated widgets, etc.) that plug into
 * the existing HTML template pipeline.
 */

import { callGeminiProxy } from '@/services/aiProxy'

const GEMINI_API_URL = 'gemini-3.1-flash-lite-preview' // model name for callGeminiProxy

export interface ComponentGenerateOptions {
  prompt: string
  style?: string
  aspectRatio?: '16:9' | '9:16' | '1:1'
  animated?: boolean
}

export interface GeneratedComponent {
  html: string
  name: string
  description: string
}

const SYSTEM_PROMPT = `You are an expert frontend developer who creates beautiful, self-contained HTML5 components for a video animation canvas.

REQUIREMENTS:
1. Output a SINGLE complete HTML5 document (<!DOCTYPE html> through </html>)
2. ALL styles must be inlined in a <style> tag — no external CSS
3. ALL logic must be in a <script> tag — no external JS
4. Include a top-level \`const CONFIG = { ... };\` object with every editable property (colors, text, sizes, toggles). Use descriptive camelCase keys.
5. Use CONFIG values throughout the code (e.g. document.getElementById('title').textContent = CONFIG.title)
6. The component must look polished and professional
7. Use modern CSS (grid, flexbox, gradients, backdrop-filter, etc.)
8. The background of <body> should use a CONFIG color — never hardcode it
9. Ensure the design fills the viewport and is centered

ANIMATION (if requested):
- Use CSS @keyframes or requestAnimationFrame
- Keep animations smooth (prefer transform/opacity)
- Animations should loop or be tasteful one-shot entrances

DO NOT:
- Use external fonts, images, or CDN links
- Include any markdown or explanation — ONLY the HTML document
- Use canvas or WebGL unless explicitly asked`

function buildPrompt(options: ComponentGenerateOptions): string {
  const { prompt, style = 'modern', aspectRatio = '16:9', animated = true } = options

  const dimensions = {
    '16:9': '1920x1080',
    '9:16': '1080x1920',
    '1:1': '1080x1080',
  }[aspectRatio]

  return `Create an HTML5 component with these specifications:

DESCRIPTION: ${prompt}
STYLE: ${style}
DIMENSIONS: ${dimensions} (design for this viewport)
ANIMATED: ${animated ? 'Yes — add smooth CSS/JS animations' : 'No — static design only'}

Remember: include a const CONFIG = { ... } object at the top of the <script> with all editable properties.`
}

function stripMarkdownFences(text: string): string {
  let cleaned = text.trim()
  // Remove ```html ... ``` wrapping
  cleaned = cleaned.replace(/^```(?:html)?\s*\n?/i, '')
  cleaned = cleaned.replace(/\n?```\s*$/i, '')
  return cleaned.trim()
}

function extractNameFromHtml(html: string, prompt: string): string {
  // Try to get <title>
  const titleMatch = html.match(/<title>([^<]+)<\/title>/i)
  if (titleMatch) return titleMatch[1].trim()
  // Fall back to first few words of prompt
  return prompt.split(/\s+/).slice(0, 4).join(' ')
}

export async function generateComponent(options: ComponentGenerateOptions): Promise<GeneratedComponent> {
  const userPrompt = buildPrompt(options)

  const response = await callGeminiProxy(GEMINI_API_URL, {
    system_instruction: { parts: [{ text: SYSTEM_PROMPT }] },
    contents: [{ parts: [{ text: userPrompt }] }],
    generationConfig: {
      temperature: 0.9,
      maxOutputTokens: 16384,
    },
  })

  if (!response.ok) {
    const err = await response.text()
    throw new Error(`Gemini API error ${response.status}: ${err}`)
  }

  const data = await response.json()
  const rawText: string = data.candidates?.[0]?.content?.parts?.[0]?.text ?? ''
  const html = stripMarkdownFences(rawText)

  // Basic validation
  if (!html.includes('<html') && !html.includes('<!DOCTYPE')) {
    throw new Error('Generated output does not appear to be a valid HTML document')
  }

  return {
    html,
    name: extractNameFromHtml(html, options.prompt),
    description: options.prompt,
  }
}
