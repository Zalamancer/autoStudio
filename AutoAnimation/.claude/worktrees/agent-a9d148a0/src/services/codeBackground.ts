/**
 * Code Background utilities
 *
 * Prompt for AI code generation, control parser, and iframe template.
 */

import type { BackgroundCodeControl } from './whiteboardAnimation'

// ---------------------------------------------------------------------------
// AI Prompt — users copy this to Claude / ChatGPT to generate code backgrounds
// ---------------------------------------------------------------------------

export const CODE_BACKGROUND_PROMPT = `You are a Canvas2D procedural artist. Write ONLY raw JavaScript for an animated background.

YOUR CODE IS INJECTED INTO AN EXISTING <script> BLOCK. The host app already provides:
- \`canvas\` — the HTMLCanvasElement (full viewport)
- \`ctx\` — the CanvasRenderingContext2D
- \`W\`, \`H\` — canvas width/height in pixels
- \`addControl()\` — function to register UI controls (sliders, color pickers, toggles, etc.)
- An animation loop that calls YOUR \`draw()\` function 60 times/sec
- A resize handler that updates W, H automatically

═══════════════════════════════════════════════════════
 CRITICAL — DO NOT INCLUDE ANY OF THE FOLLOWING:
═══════════════════════════════════════════════════════
- NO HTML tags (<!DOCTYPE>, <html>, <head>, <body>, <style>, <canvas>, <script>, <div>, etc.)
- NO document.createElement, document.getElementById, document.querySelector
- NO canvas creation — canvas and ctx ALREADY EXIST
- NO animation loop — NO requestAnimationFrame, NO setInterval, NO setTimeout
- NO resize handler — NO addEventListener('resize', ...)
- NO UI elements — NO control panels, NO sliders, NO buttons (addControl handles all UI)
- NO CSS or inline styles
- NO module imports or exports
- NO fetch, XMLHttpRequest, WebSocket, eval, Function constructor
- NO window, parent, top, localStorage, navigator references
- NO markdown backticks, no explanations, no comments about what the code does
═══════════════════════════════════════════════════════

YOUR OUTPUT MUST BE EXACTLY:
1. Top-level addControl() calls to register interactive controls
2. Optional helper functions, constants, or pre-computed data
3. A single \`function draw(ctx, w, h, t, controls) { ... }\` that draws one frame

NOTHING ELSE. No wrapping. No boilerplate. Just the JS code body.

─── addControl() API ───

Slider:    addControl(id, label, min, max, initialValue, step?)
           addControl("speed", "Speed", 0.1, 5, 1.0, 0.1)

Color:     addControl(id, label, "color", "#hex")
           addControl("bgColor", "Background", "color", "#0a0a2e")

Toggle:    addControl(id, label, "toggle", defaultBool)
           addControl("glow", "Glow Effect", "toggle", true)

Text:      addControl(id, label, "text", "defaultString")
           addControl("title", "Title", "text", "Hello World")

Dropdown:  addControl(id, label, "dropdown", "selected", ["opt1","opt2",...])
           addControl("mode", "Pattern", "dropdown", "wave", ["wave","spiral","grid"])

Read values inside draw() via controls[id].

─── draw() signature ───

function draw(ctx, w, h, t, controls) {
  // ctx: CanvasRenderingContext2D (already available)
  // w, h: canvas dimensions in pixels
  // t: elapsed time in seconds (float, starts at 0)
  // controls: { [id]: currentValue } — live values from all addControl() calls
}

─── Performance tips ───
- draw() runs at 60fps — avoid allocations, cache objects outside draw()
- Pre-compute lookup tables, sin/cos tables, particle arrays at the top level
- All visuals must be procedural (no images, no network)

─── Design tips ───
- Use addControl() generously (5-10 controls) for speed, density, colors, modes, toggles
- Use HSL for dynamic color: \`hsl(\${hue}, 80%, 60%)\`
- Use sin/cos/atan2/noise for organic motion
- Layer effects: background fill → particles/shapes → glow/overlay

─── Request ───
[DESCRIBE YOUR BACKGROUND HERE]

═══════════════════════════════════════════════════
 EXAMPLE OF A COMPLETE, CORRECT RESPONSE:
═══════════════════════════════════════════════════

addControl("speed", "Wave Speed", 0.1, 5, 1.0, 0.1)
addControl("density", "Line Density", 5, 50, 20, 1)
addControl("baseColor", "Base Color", "color", "#0a0a2e")
addControl("glow", "Glow", "toggle", true)
addControl("mode", "Pattern", "dropdown", "wave", ["wave", "spiral", "grid"])

function draw(ctx, w, h, t, controls) {
  ctx.fillStyle = controls.baseColor
  ctx.fillRect(0, 0, w, h)
  const lines = Math.floor(controls.density)
  for (let i = 0; i < lines; i++) {
    const y = (i / lines) * h
    ctx.beginPath()
    for (let x = 0; x < w; x += 4) {
      const offset = Math.sin(x * 0.01 + t * controls.speed + i * 0.5) * 30
      ctx.lineTo(x, y + offset)
    }
    const hue = (i / lines * 360 + t * 20) % 360
    ctx.strokeStyle = \`hsla(\${hue}, 80%, 60%, 0.6)\`
    ctx.lineWidth = controls.glow ? 3 : 1
    ctx.stroke()
  }
}

═══════════════════════════════════════════════════
 THE ABOVE IS THE ENTIRE RESPONSE. Nothing before
 the first addControl(), nothing after draw() closes.
 NO HTML. NO boilerplate. JUST the JavaScript body.
═══════════════════════════════════════════════════`

// ---------------------------------------------------------------------------
// Control parser — extracts addControl() calls from user code
// ---------------------------------------------------------------------------

export function parseCodeControls(code: string): BackgroundCodeControl[] {
  const controls: BackgroundCodeControl[] = []

  // Match all addControl(...) calls with flexible whitespace
  const callRegex = /addControl\s*\(([\s\S]*?)\)(?:\s*;|\s*$|\s*\n)/gm
  let callMatch

  while ((callMatch = callRegex.exec(code)) !== null) {
    const argsStr = callMatch[1]
    try {
      // Parse arguments by evaluating them as a JSON-like array
      // We handle: strings (single/double quoted), numbers, booleans, arrays
      const args = parseArgs(argsStr)
      if (args.length < 4) continue

      const id = String(args[0])
      const label = String(args[1])
      const third = args[2]

      if (third === 'color') {
        // addControl(id, label, "color", "#hex")
        controls.push({ id, type: 'color', label, value: String(args[3]) })
      } else if (third === 'toggle') {
        // addControl(id, label, "toggle", bool)
        controls.push({ id, type: 'toggle', label, value: Boolean(args[3]) })
      } else if (third === 'text') {
        // addControl(id, label, "text", "default")
        controls.push({ id, type: 'text', label, value: String(args[3]) })
      } else if (third === 'dropdown') {
        // addControl(id, label, "dropdown", "selected", [...options])
        const options = Array.isArray(args[4]) ? args[4].map(String) : []
        controls.push({ id, type: 'dropdown', label, value: String(args[3]), options })
      } else if (typeof third === 'number') {
        // addControl(id, label, min, max, initial, step?)
        controls.push({
          id,
          type: 'slider',
          label,
          min: third,
          max: Number(args[3]),
          value: Number(args[4] ?? third),
          step: args[5] != null ? Number(args[5]) : undefined,
        })
      }
    } catch {
      // Skip malformed calls
    }
  }

  return controls
}

/** Simple argument parser for addControl() — handles strings, numbers, bools, arrays */
function parseArgs(argsStr: string): unknown[] {
  const args: unknown[] = []
  let i = 0
  const s = argsStr.trim()

  while (i < s.length) {
    // Skip whitespace and commas
    while (i < s.length && (s[i] === ' ' || s[i] === ',' || s[i] === '\t' || s[i] === '\n' || s[i] === '\r')) i++
    if (i >= s.length) break

    if (s[i] === '"' || s[i] === "'") {
      // String
      const quote = s[i]
      let str = ''
      i++
      while (i < s.length && s[i] !== quote) {
        if (s[i] === '\\' && i + 1 < s.length) { str += s[i + 1]; i += 2 }
        else { str += s[i]; i++ }
      }
      i++ // skip closing quote
      args.push(str)
    } else if (s[i] === '[') {
      // Array
      let depth = 1
      let arrStr = ''
      i++ // skip [
      while (i < s.length && depth > 0) {
        if (s[i] === '[') depth++
        else if (s[i] === ']') depth--
        if (depth > 0) arrStr += s[i]
        i++
      }
      args.push(parseArgs(arrStr))
    } else if (s.slice(i, i + 4) === 'true') {
      args.push(true); i += 4
    } else if (s.slice(i, i + 5) === 'false') {
      args.push(false); i += 5
    } else {
      // Number or identifier
      let token = ''
      while (i < s.length && s[i] !== ',' && s[i] !== ')' && s[i] !== ']' && s[i] !== ' ' && s[i] !== '\n') {
        token += s[i]; i++
      }
      const num = Number(token)
      args.push(isNaN(num) ? token : num)
    }
  }

  return args
}
