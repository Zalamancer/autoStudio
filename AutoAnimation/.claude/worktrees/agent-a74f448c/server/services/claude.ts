import Anthropic from '@anthropic-ai/sdk'

let client: Anthropic | null = null

function getClient(): Anthropic {
  if (!client) {
    const apiKey = process.env.ANTHROPIC_API_KEY
    if (!apiKey) {
      throw new Error('ANTHROPIC_API_KEY environment variable is required')
    }
    client = new Anthropic({ apiKey })
  }
  return client
}

const SYSTEM_PROMPT = `You are an expert SVG animation engineer. Your task is to write a JavaScript function that generates SVG frames for an animation.

REQUIREMENTS:
- Write a single function: function generateFrame(frameNumber, totalFrames) that returns a complete SVG string
- The SVG must have the exact width and height specified (passed as WIDTH and HEIGHT constants available in scope)
- Use frameNumber (0-based) and totalFrames to calculate animation progress (t = frameNumber / totalFrames gives 0 to 1)
- Return a complete SVG string starting with <svg and ending with </svg>
- Use standard SVG elements: rect, circle, ellipse, path, text, g, defs, linearGradient, radialGradient, clipPath, mask, filter, polygon, polyline, line
- Use transform attributes for motion (translate, rotate, scale)
- Use viewBox for camera movements if needed
- Make animations smooth using easing functions (sine, cubic, etc.)
- Use vibrant colors and clean designs
- Do NOT use any external resources, images, or URLs
- Do NOT use JavaScript APIs like document, window, or DOM methods inside the SVG
- The function must be pure - same inputs always produce same output
- Do NOT use requestAnimationFrame or any async code

OUTPUT FORMAT:
Return ONLY the function body wrapped in a code block. No explanation, no imports.

\`\`\`javascript
function generateFrame(frameNumber, totalFrames) {
  // your code here
  return \`<svg ...>...</svg>\`;
}
\`\`\`
`

export interface GenerateFrameFunctionResult {
  functionCode: string
}

export async function generateFrameFunction(
  prompt: string,
  width: number,
  height: number,
  fps: number,
  durationSeconds: number
): Promise<GenerateFrameFunctionResult> {
  const anthropic = getClient()
  const totalFrames = fps * durationSeconds

  const userPrompt = `Create an animation: "${prompt}"

Specifications:
- Resolution: ${width}x${height} pixels
- Total frames: ${totalFrames} (${fps} fps, ${durationSeconds} seconds)
- WIDTH=${width} and HEIGHT=${height} are available as constants in scope
- FPS=${fps} is available as a constant

Write the generateFrame(frameNumber, totalFrames) function.`

  // Use streaming to support long-running extended thinking requests.
  // Budget must be large enough for both thinking + text output.
  const stream = anthropic.messages.stream({
    model: 'claude-opus-4-6',
    max_tokens: 65536,
    thinking: { type: 'enabled', budget_tokens: 32768 },
    messages: [{ role: 'user', content: userPrompt }],
    system: SYSTEM_PROMPT,
  })

  const response = await stream.finalMessage()

  // With adaptive thinking, response.content may contain thinking blocks
  // before text blocks. .find() correctly skips thinking blocks.
  const textBlock = response.content.find(block => block.type === 'text')
  if (!textBlock || textBlock.type !== 'text') {
    throw new Error('No text response from Claude')
  }

  const functionCode = extractFunctionCode(textBlock.text)
  if (!functionCode) {
    throw new Error('Could not extract generateFrame function from Claude response')
  }

  return { functionCode }
}

function extractFunctionCode(text: string): string | null {
  // Try to find code block with the function
  const codeBlockMatch = text.match(/```(?:javascript|js)?\s*\n([\s\S]*?)```/)
  if (codeBlockMatch) {
    const code = codeBlockMatch[1].trim()
    // Verify it contains the function
    if (code.includes('generateFrame')) {
      return code
    }
  }

  // Fallback: try to find the function directly in text
  const funcMatch = text.match(/function\s+generateFrame\s*\([^)]*\)\s*\{[\s\S]*\}/)
  if (funcMatch) {
    return funcMatch[0]
  }

  return null
}

// ---------------------------------------------------------------------------
// Per-object declarative SVG generation — returns objects with static markup
// and animation keyframes (no per-frame JavaScript execution)
// ---------------------------------------------------------------------------

const OBJECTS_SYSTEM_PROMPT = `You are an expert SVG animation designer. Your task is to decompose an animation scene into SEPARATE OBJECTS, each with static SVG markup and animation keyframes.

IMPORTANT: You are NOT writing JavaScript code. You are defining declarative visual objects with transform keyframes. The browser will interpolate between keyframes automatically.

REQUIREMENTS:
- Identify 3-8 semantically meaningful visual objects in the scene (e.g., "sky", "mountains", "sun", "clouds", "water", "stars")
- For each object, provide:
  1. "svgMarkup": A STATIC SVG <g> element containing the visual content. Use {{colorName}} placeholders for all color values (e.g., fill="{{primary}}" or stop-color="{{gradient_top}}")
  2. "keyframes": An array of transform keyframes describing how the object moves/transforms over time
  3. "defaultColors": Named color values that {{placeholders}} resolve to
  4. "zIndex": Layer order (0 = back, higher = front)

KEYFRAME FORMAT:
Each keyframe has:
- "time": 0 to 1 (fraction of animation duration, 0 = start, 1 = end)
- "x": translation X in pixels (optional, default 0)
- "y": translation Y in pixels (optional, default 0)
- "rotation": degrees (optional, default 0)
- "scaleX": scale factor (optional, default 1)
- "scaleY": scale factor (optional, default 1)
- "opacity": 0-1 (optional, default 1)
- "easing": "linear" | "ease-in" | "ease-out" | "ease-in-out" (optional, default "linear")

SVG MARKUP RULES:
- Canvas size is WIDTH x HEIGHT pixels (provided in the prompt)
- Use standard SVG elements: rect, circle, ellipse, path, text, g, defs, linearGradient, radialGradient, clipPath, mask, filter, polygon, polyline, line
- Do NOT use external resources, images, or URLs
- Do NOT use <animate>, <animateTransform>, or CSS animations — the browser handles animation via keyframes
- All color values MUST use {{colorName}} placeholders, never hardcode colors
- The <g> element is the root — transforms are applied to it by the browser
- Design the object at its "rest" position; keyframes handle movement

OUTPUT FORMAT:
Return ONLY a JSON object wrapped in a code block. No explanation.

\`\`\`json
{
  "background": "#0a0a2e",
  "objects": [
    {
      "name": "sky",
      "zIndex": 0,
      "defaultColors": { "top": "#0a0a2e", "bottom": "#1a1a4e" },
      "svgMarkup": "<g><defs><linearGradient id=\\"skyG\\" x1=\\"0\\" y1=\\"0\\" x2=\\"0\\" y2=\\"1\\"><stop offset=\\"0%\\" stop-color=\\"{{top}}\\"/><stop offset=\\"100%\\" stop-color=\\"{{bottom}}\\"/></linearGradient></defs><rect width=\\"WIDTH\\" height=\\"HEIGHT\\" fill=\\"url(#skyG)\\"/></g>",
      "keyframes": [
        { "time": 0, "opacity": 1 },
        { "time": 1, "opacity": 1 }
      ]
    },
    {
      "name": "sun",
      "zIndex": 3,
      "defaultColors": { "core": "#fffff0", "glow": "#ffdd44" },
      "svgMarkup": "<g><circle cx=\\"960\\" cy=\\"0\\" r=\\"60\\" fill=\\"{{core}}\\"/><circle cx=\\"960\\" cy=\\"0\\" r=\\"120\\" fill=\\"{{glow}}\\" opacity=\\"0.3\\"/></g>",
      "keyframes": [
        { "time": 0, "y": 800, "opacity": 0.3 },
        { "time": 0.5, "y": 300, "opacity": 1.0, "easing": "ease-out" },
        { "time": 1, "y": 200, "opacity": 1.0 }
      ]
    }
  ]
}
\`\`\`

TIPS:
- Use WIDTH and HEIGHT literally in svgMarkup — they will be replaced with actual pixel values
- Position objects using absolute coordinates in the SVG, then use keyframe x/y for animation movement
- For static objects (no motion), provide at least one keyframe: [{ "time": 0 }]
- For color transitions, create separate overlapping objects with opacity keyframes
- Keep svgMarkup concise — complex shapes should use <path> with d attribute
`

export interface SVGObjectDefinition {
  name: string
  zIndex: number
  defaultColors: Record<string, string>
  svgMarkup: string
  keyframes: Array<{
    time: number
    x?: number
    y?: number
    rotation?: number
    scaleX?: number
    scaleY?: number
    opacity?: number
    easing?: string
  }>
  error?: string
}

export interface GenerateObjectsResult {
  objects: SVGObjectDefinition[]
  background: string
}

export async function generateObjectFunctions(
  prompt: string,
  width: number,
  height: number
): Promise<GenerateObjectsResult> {
  const anthropic = getClient()

  const userPrompt = `Create an animation scene: "${prompt}"

Canvas size: ${width}x${height} pixels.
Use WIDTH=${width} and HEIGHT=${height} literally in your svgMarkup (they will be replaced with actual values).

Decompose this scene into separate visual objects with static SVG markup and animation keyframes.
Each object's colors must use {{colorName}} placeholders so users can customize them.`

  // Use streaming to support long-running extended thinking requests.
  const stream = anthropic.messages.stream({
    model: 'claude-opus-4-6',
    max_tokens: 65536,
    thinking: { type: 'enabled', budget_tokens: 32768 },
    messages: [{ role: 'user', content: userPrompt }],
    system: OBJECTS_SYSTEM_PROMPT,
  })

  const response = await stream.finalMessage()

  const textBlock = response.content.find(block => block.type === 'text')
  if (!textBlock || textBlock.type !== 'text') {
    throw new Error('No text response from Claude')
  }

  console.log('[generate-objects] Response length:', textBlock.text.length)
  console.log('[generate-objects] Stop reason:', response.stop_reason)

  const result = extractObjectsJSON(textBlock.text, width, height)
  if (!result) {
    console.log('[generate-objects] Failed to parse response (first 2000 chars):', textBlock.text.substring(0, 2000))
    throw new Error('Could not parse Claude response as structured SVG objects')
  }

  return result
}

function extractObjectsJSON(text: string, width: number, height: number): GenerateObjectsResult | null {
  // Try to extract JSON from code block
  const jsonBlockMatch = text.match(/```(?:json)?\s*\n([\s\S]*?)```/)
  const rawJson = jsonBlockMatch
    ? jsonBlockMatch[1].trim()
    : text.match(/\{[\s\S]*"objects"\s*:\s*\[[\s\S]*\][\s\S]*\}/)?.[0]

  if (!rawJson) return null

  try {
    const parsed = JSON.parse(rawJson)
    if (!parsed.objects || !Array.isArray(parsed.objects)) return null

    return {
      background: parsed.background || '#000000',
      objects: parsed.objects.map((obj: Record<string, unknown>) => {
        // Replace WIDTH/HEIGHT literals in svgMarkup
        let markup = ((obj.svgMarkup as string) || '')
          .replace(/WIDTH/g, String(width))
          .replace(/HEIGHT/g, String(height))

        return {
          name: (obj.name as string) || 'unnamed',
          zIndex: typeof obj.zIndex === 'number' ? obj.zIndex : 0,
          defaultColors: (obj.defaultColors as Record<string, string>) || {},
          svgMarkup: markup,
          keyframes: Array.isArray(obj.keyframes) ? obj.keyframes : [{ time: 0 }],
        }
      }),
    }
  } catch {
    return null
  }
}

export function isClaudeConfigured(): boolean {
  return !!process.env.ANTHROPIC_API_KEY
}
