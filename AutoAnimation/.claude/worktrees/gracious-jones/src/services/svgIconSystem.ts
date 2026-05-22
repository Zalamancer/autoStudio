/**
 * SVG Icon System Generator
 *
 * Generates consistent icon sets that match a visual style. Uses Gemini to
 * produce cohesive icon families where all icons share the same:
 * - Stroke weight
 * - Corner radius
 * - Fill style (outline, filled, duotone)
 * - Proportions
 * - Color palette
 *
 * Also includes a built-in procedural icon library for common icons.
 */

import type { SVGObjectDefinition } from '@/types/svgObjects'
import { withCreditGate } from './creditGate'

// ── Types ──

export type IconStyle = 'outline' | 'filled' | 'duotone' | 'flat'

export interface IconSetRequest {
  /** List of icon descriptions (e.g. ["arrow right", "home", "settings"]) */
  icons: string[]
  /** Visual style */
  style?: IconStyle
  /** Icon size in pixels */
  size?: number
  /** Stroke width for outline/duotone styles */
  strokeWidth?: number
  /** Primary color */
  primaryColor?: string
  /** Secondary color (for duotone) */
  secondaryColor?: string
  /** Corner radius (0 = sharp, higher = rounded) */
  cornerRadius?: number
}

export interface IconSetResult {
  icons: SVGObjectDefinition[]
  style: IconStyle
  size: number
}

// ── AI-Generated icon sets ──

const GEMINI_URL =
  'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-pro:generateContent'

const GEMINI_FLASH_URL =
  'https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-flash-lite-preview:generateContent'

const ICON_SYSTEM_PROMPT = `You are an expert icon designer. Generate a set of SVG icons that are visually consistent — same stroke weight, corner rounding, and style.

OUTPUT FORMAT: Return ONLY valid JSON (no markdown, no code fences):
{
  "icons": [
    {
      "name": "icon_name",
      "svgMarkup": "<g>...SVG content...</g>"
    }
  ]
}

RULES:
- Each icon must be a SINGLE <g> element
- ALL icons must use the SAME visual style (stroke weight, corner radius, fill approach)
- Use {{primary}} for main color and {{secondary}} for accent color
- Icons should be centered in the viewbox provided
- Use clean, recognizable shapes — these are UI icons, not illustrations
- NO <animate>, CSS, or JavaScript
- Keep markup minimal — icons should be simple and clear
- Use standard SVG elements only (path, circle, rect, line, polyline, polygon)`

export async function generateIconSet(request: IconSetRequest): Promise<IconSetResult> {
  return withCreditGate('svg-object', async () => _generateIconSetImpl(request))
}

async function _generateIconSetImpl(request: IconSetRequest): Promise<IconSetResult> {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY
  if (!apiKey) throw new Error('Gemini API key not configured')

  const size = request.size || 48
  const style = request.style || 'outline'
  const strokeWidth = request.strokeWidth || 2
  const cornerRadius = request.cornerRadius || 2

  const styleDesc: Record<IconStyle, string> = {
    outline: `Outline style: stroke-only, no fills. stroke-width="${strokeWidth}". All strokes use {{primary}}.`,
    filled: `Filled style: solid filled shapes, no strokes. All fills use {{primary}}.`,
    duotone: `Duotone style: main shape filled with {{primary}}, accent details filled with {{secondary}} at 50% opacity.`,
    flat: `Flat style: solid fills with no gradients or strokes. Main fill {{primary}}, background shapes {{secondary}}.`,
  }

  const userPrompt = `Generate ${request.icons.length} SVG icons in a consistent set.
Viewbox: 0 0 ${size} ${size}. ${styleDesc[style]} Corner radius: ${cornerRadius}px.
Icons needed: ${request.icons.map((name, i) => `${i + 1}. ${name}`).join(', ')}.
Use {{primary}} and {{secondary}} color placeholders.`

  console.log('[SVGIcons] Generating icon set:', request.icons.join(', '))

  let textContent: string
  try {
    textContent = await _callGemini(apiKey, userPrompt, GEMINI_URL, true)
  } catch {
    textContent = await _callGemini(apiKey, userPrompt, GEMINI_FLASH_URL, false)
  }

  const cleaned = textContent
    .replace(/```json\n?/g, '')
    .replace(/```\n?/g, '')
    .trim()

  let parsed: { icons?: { name: string; svgMarkup: string }[] }
  try {
    parsed = JSON.parse(cleaned)
  } catch {
    throw new Error('Failed to parse icon set response')
  }

  if (!parsed.icons?.length) throw new Error('No icons returned')

  const icons: SVGObjectDefinition[] = parsed.icons.map((icon, i) => ({
    name: icon.name || request.icons[i] || `icon_${i}`,
    zIndex: 10 + i,
    defaultColors: {
      primary: request.primaryColor || '#ffffff',
      secondary: request.secondaryColor || '#6366f1',
    },
    svgMarkup: icon.svgMarkup || '<g/>',
    keyframes: [{ time: 0 }],
  }))

  return { icons, style, size }
}

async function _callGemini(
  apiKey: string,
  userPrompt: string,
  url: string,
  jsonMode: boolean,
): Promise<string> {
  const response = await fetch(`${url}?key=${apiKey}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      system_instruction: { parts: [{ text: ICON_SYSTEM_PROMPT }] },
      contents: [{ parts: [{ text: userPrompt }] }],
      generationConfig: {
        temperature: 0.5,
        maxOutputTokens: 8192,
        ...(jsonMode ? { responseMimeType: 'application/json' } : {}),
      },
    }),
  })

  if (!response.ok) throw new Error(`Gemini API failed: ${response.statusText}`)

  const data = await response.json()
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text || ''
  if (!text) throw new Error('Empty response from Gemini')
  return text
}

// ── Built-in procedural icons ──

/**
 * Common icons available without AI generation.
 * All use {{primary}} color placeholder at 48x48 viewbox.
 */
export const BUILTIN_ICONS: Record<string, SVGObjectDefinition> = {
  'arrow-right': _icon('arrow_right', '<path d="M10 24 L34 24 M26 16 L34 24 L26 32" fill="none" stroke="{{primary}}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>'),
  'arrow-left': _icon('arrow_left', '<path d="M38 24 L14 24 M22 16 L14 24 L22 32" fill="none" stroke="{{primary}}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>'),
  'arrow-up': _icon('arrow_up', '<path d="M24 38 L24 14 M16 22 L24 14 L32 22" fill="none" stroke="{{primary}}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>'),
  'arrow-down': _icon('arrow_down', '<path d="M24 10 L24 34 M16 26 L24 34 L32 26" fill="none" stroke="{{primary}}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>'),
  'check': _icon('check', '<path d="M12 24 L20 32 L36 16" fill="none" stroke="{{primary}}" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>'),
  'cross': _icon('cross', '<path d="M14 14 L34 34 M34 14 L14 34" fill="none" stroke="{{primary}}" stroke-width="2" stroke-linecap="round"/>'),
  'plus': _icon('plus', '<path d="M24 12 L24 36 M12 24 L36 24" fill="none" stroke="{{primary}}" stroke-width="2" stroke-linecap="round"/>'),
  'minus': _icon('minus', '<line x1="12" y1="24" x2="36" y2="24" stroke="{{primary}}" stroke-width="2" stroke-linecap="round"/>'),
  'star': _icon('star', '<polygon points="24,8 28,18 39,18 30,25 33,36 24,29 15,36 18,25 9,18 20,18" fill="{{primary}}"/>'),
  'heart': _icon('heart', '<path d="M24 38 L12 26 Q4 18 12 10 Q20 2 24 14 Q28 2 36 10 Q44 18 36 26 Z" fill="{{primary}}"/>'),
  'home': _icon('home', '<path d="M8 24 L24 10 L40 24 M14 22 L14 38 L34 38 L34 22" fill="none" stroke="{{primary}}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><rect x="20" y="28" width="8" height="10" fill="none" stroke="{{primary}}" stroke-width="2"/>'),
  'settings': _icon('settings', '<circle cx="24" cy="24" r="6" fill="none" stroke="{{primary}}" stroke-width="2"/><path d="M24 6 L24 10 M24 38 L24 42 M6 24 L10 24 M38 24 L42 24 M11 11 L14 14 M34 34 L37 37 M37 11 L34 14 M14 34 L11 37" stroke="{{primary}}" stroke-width="2" stroke-linecap="round"/>'),
  'search': _icon('search', '<circle cx="20" cy="20" r="10" fill="none" stroke="{{primary}}" stroke-width="2"/><line x1="28" y1="28" x2="38" y2="38" stroke="{{primary}}" stroke-width="2" stroke-linecap="round"/>'),
  'play': _icon('play', '<polygon points="16,10 16,38 38,24" fill="{{primary}}"/>'),
  'pause': _icon('pause', '<rect x="14" y="10" width="6" height="28" rx="1" fill="{{primary}}"/><rect x="28" y="10" width="6" height="28" rx="1" fill="{{primary}}"/>'),
  'eye': _icon('eye', '<path d="M4 24 Q24 8 44 24 Q24 40 4 24 Z" fill="none" stroke="{{primary}}" stroke-width="2"/><circle cx="24" cy="24" r="6" fill="none" stroke="{{primary}}" stroke-width="2"/>'),
  'lock': _icon('lock', '<rect x="14" y="22" width="20" height="16" rx="3" fill="none" stroke="{{primary}}" stroke-width="2"/><path d="M18 22 L18 16 Q18 10 24 10 Q30 10 30 16 L30 22" fill="none" stroke="{{primary}}" stroke-width="2"/>'),
  'bell': _icon('bell', '<path d="M24 8 L24 10 Q16 12 14 20 L12 30 L36 30 L34 20 Q32 12 24 10 Z" fill="none" stroke="{{primary}}" stroke-width="2" stroke-linejoin="round"/><line x1="10" y1="30" x2="38" y2="30" stroke="{{primary}}" stroke-width="2" stroke-linecap="round"/><path d="M20 30 Q20 36 24 36 Q28 36 28 30" fill="none" stroke="{{primary}}" stroke-width="2"/>'),
  'mail': _icon('mail', '<rect x="8" y="12" width="32" height="24" rx="3" fill="none" stroke="{{primary}}" stroke-width="2"/><path d="M8 14 L24 26 L40 14" fill="none" stroke="{{primary}}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>'),
  'user': _icon('user', '<circle cx="24" cy="16" r="8" fill="none" stroke="{{primary}}" stroke-width="2"/><path d="M8 42 Q8 30 24 30 Q40 30 40 42" fill="none" stroke="{{primary}}" stroke-width="2"/>'),
}

function _icon(name: string, markup: string): SVGObjectDefinition {
  return {
    name,
    zIndex: 0,
    defaultColors: { primary: '#ffffff' },
    svgMarkup: `<g>${markup}</g>`,
    keyframes: [{ time: 0 }],
  }
}

/**
 * Get a built-in icon by name. Returns undefined if not found.
 */
export function getBuiltinIcon(name: string): SVGObjectDefinition | undefined {
  return BUILTIN_ICONS[name]
}

/**
 * List all built-in icon names.
 */
export function listBuiltinIcons(): string[] {
  return Object.keys(BUILTIN_ICONS)
}
