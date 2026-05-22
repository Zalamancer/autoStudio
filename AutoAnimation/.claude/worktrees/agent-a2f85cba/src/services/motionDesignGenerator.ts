/**
 * Gemini-powered motion design generator.
 * Integrates color harmony, typography presets, and visual flow intelligence.
 */

import type { MotionDesignDescription } from '@/types/motionDesign'
import {
  generatePalette,
  paletteFromMood,
  type ColorPalette,
  type HarmonyStrategy,
  type PaletteMood,
} from './motionDesign/colorHarmony'
import { TYPOGRAPHY_PRESETS, suggestPreset } from './motionDesign/typographyEngine'
import type { FlowRole } from './motionDesign/visualFlow'

const GEMINI_API_URL =
  'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent'

export interface GenerateMotionDesignOptions {
  prompt: string
  style?: string
  aspectRatio?: '16:9' | '9:16' | '1:1'
  /** Auto-generate cohesive color palette */
  baseColor?: string
  colorStrategy?: HarmonyStrategy
  colorMood?: PaletteMood
  /** Flow role for visual sequencing context */
  flowRole?: FlowRole
  /** Emotion context for typography selection */
  emotion?: string
}

// ── System prompt ──

const SYSTEM_PROMPT = `You are an expert motion designer creating broadcast-quality animated graphics. Generate structured JSON for a canvas-based renderer.

OUTPUT FORMAT: Return ONLY valid JSON matching the schema. No markdown, no explanation.

SCHEMA:
{
  "name": string,
  "description": string,
  "background": string,     // CSS background value, supports {{configKey}} placeholders
  "palette": {               // Color palette for cohesive theming
    "primary": string,
    "secondary": string,
    "accent": string,
    "background": string,
    "text": string
  },
  "configSchema": [
    { "key": string, "label": string, "type": "text"|"color"|"number"|"boolean"|"text-array"|"select", "defaultValue": any, "group": string, "options"?: string[], "min"?: number, "max"?: number }
  ],
  "defaultConfig": { ... },
  "enterDuration": number,  // 0.0-0.4
  "exitDuration": number,   // 0.0-0.4
  "defaultTypographyPreset": string,  // Optional: preset name for text animations
  "flowRole": string,       // Optional: "title"|"subtitle"|"stat"|"cta"|"lower-third"|"quote"|"list"|"end-screen"
  "elements": [
    {
      "id": string,
      "type": "text"|"rect"|"circle"|"group"|"line"|"counter"|"bar"|"arc"|"icon",
      "text"?: string,
      "typographyPreset"?: string,  // Per-element typography animation preset
      "counterTarget"?: number,
      "counterSuffix"?: string,
      "barPercent"?: number,
      "arcAngle"?: number,
      "style"?: { ... },
      "layout"?: "flex-row"|"flex-column"|"grid"|"absolute",
      "gap"?: string|number,
      "gridColumns"?: string,
      "children"?: [ ... ],
      "animation"?: {
        "enterDelay"?: number,
        "enter"?: { "from": { "opacity"?: number, "x"?: number, "y"?: number, "scale"?: number, "scaleX"?: number, "scaleY"?: number, "rotation"?: number, "blur"?: number }, "easing"?: EasingName },
        "hold"?: { "effect"?: "pulse"|"glow"|"float"|"breathe", "amplitude"?: number, "speed"?: number },
        "exit"?: { "to": { ... same as from }, "easing"?: EasingName }
      }
    }
  ]
}

AVAILABLE TYPOGRAPHY PRESETS (use for "typographyPreset" on text elements):
- "elegant-fade": Word-by-word fade in (great for subtitles)
- "dynamic-slide": Words slide up with back-ease (great for titles)
- "character-pop": Characters pop with elastic ease (fun/energetic)
- "typewriter-classic": Character-by-character reveal with cursor
- "kinetic-cascade": Words cascade in with rotation
- "weight-morph": Font weight animates from thin to bold
- "glitch-hack": Glitchy character reveal (tech/edgy themes)
- "tracking-reveal": Letter-spacing contracts on reveal
- "blur-focus": Words go from blurry to sharp
- "wave-playful": Characters wave up and down

EasingName: "linear"|"easeIn"|"easeOut"|"cubicIn"|"cubicOut"|"cubicInOut"|"elasticIn"|"elasticOut"|"bounceIn"|"bounceOut"|"backIn"|"backOut"|"backInOut"

DESIGN PRINCIPLES:
1. VISUAL HIERARCHY: Use size, weight, and color contrast to guide the eye. Titles large and bold, labels small and subdued.
2. COLOR HARMONY: Use the provided palette. Primary for key elements, accent for emphasis, secondary for supporting elements.
3. SPACING: Use consistent padding (6-10% from edges). Use gap in groups. Avoid cramped layouts.
4. ANIMATION RHYTHM: Stagger elements with enterDelay (0.05-0.15 between items). Vary easing — backOut for titles, cubicOut for content, elasticOut for emphasis.
5. TYPOGRAPHY: Assign typographyPreset to important text elements for professional per-character/word animation.
6. HOLD EFFECTS: Use sparingly. "float" for stats, "breathe" for ambient elements, "glow" for call-to-action.
7. RESPONSIVE: Use clamp() for font sizes, percentages for layout positions.

RULES:
- Every element MUST have a unique "id"
- Use {{configKey}} in text and style values to make content editable
- Counter/bar/arc auto-animate with enter progress
- Use absolute positioning for root elements, or a root group with layout
- All style values must be valid CSS (camelCase)
- Keep designs clean and professional — less is more`

// ── Generator ──

export async function generateMotionDesign(
  options: GenerateMotionDesignOptions,
): Promise<MotionDesignDescription> {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY
  if (!apiKey) throw new Error('VITE_GEMINI_API_KEY not set')

  // Generate color palette
  let palette: ColorPalette | undefined
  if (options.baseColor) {
    palette = generatePalette(
      options.baseColor,
      options.colorStrategy ?? 'complementary',
      options.colorMood ?? 'vibrant',
    )
  } else if (options.emotion || options.style) {
    palette = paletteFromMood(options.emotion || options.style || 'creative')
  }

  // Suggest typography
  const suggestedTypo = suggestPreset(
    options.prompt,
    { emotion: options.emotion, role: options.flowRole },
  )

  const userPrompt = [
    `Create a motion design for: "${options.prompt}"`,
    options.style ? `Visual style: ${options.style}` : '',
    options.aspectRatio ? `Aspect ratio: ${options.aspectRatio}` : '',
    options.flowRole ? `This element's role in the video: ${options.flowRole}` : '',
    palette
      ? `Use this color palette:\n  Primary: ${palette.primary}\n  Secondary: ${palette.secondary}\n  Accent: ${palette.accent}\n  Background: ${palette.background}\n  Text: ${palette.text}`
      : '',
    `Suggested typography preset for main text: "${suggestedTypo}"`,
  ]
    .filter(Boolean)
    .join('\n')

  const response = await fetch(`${GEMINI_API_URL}?key=${apiKey}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [
        { role: 'user', parts: [{ text: userPrompt }] },
      ],
      systemInstruction: { parts: [{ text: SYSTEM_PROMPT }] },
      generationConfig: {
        responseMimeType: 'application/json',
        temperature: 0.8,
        maxOutputTokens: 8192,
      },
    }),
  })

  if (!response.ok) {
    const errText = await response.text()
    throw new Error(`Gemini API error ${response.status}: ${errText}`)
  }

  const data = await response.json()
  const text = data?.candidates?.[0]?.content?.parts?.[0]?.text
  if (!text) throw new Error('Empty response from Gemini')

  let parsed: MotionDesignDescription
  try {
    parsed = JSON.parse(text)
  } catch {
    throw new Error('Failed to parse JSON response from Gemini')
  }

  // Inject palette if generated locally
  if (palette && !parsed.palette) {
    parsed.palette = {
      primary: palette.primary,
      secondary: palette.secondary,
      accent: palette.accent,
      background: palette.background,
      text: palette.text,
    }
  }

  return validateAndNormalize(parsed)
}

/**
 * Generate a motion design without AI — purely from code.
 * Uses templates to build common patterns programmatically.
 */
export function buildMotionDesign(
  role: FlowRole,
  content: Record<string, string>,
  palette: ColorPalette,
  typographyPreset?: string,
): MotionDesignDescription {
  switch (role) {
    case 'title':
      return buildTitleCard(content, palette, typographyPreset)
    case 'lower-third':
      return buildLowerThird(content, palette, typographyPreset)
    case 'stat':
      return buildStatCard(content, palette)
    case 'cta':
      return buildCTA(content, palette, typographyPreset)
    default:
      return buildTitleCard(content, palette, typographyPreset)
  }
}

function buildTitleCard(
  content: Record<string, string>,
  palette: ColorPalette,
  typographyPreset = 'dynamic-slide',
): MotionDesignDescription {
  return {
    name: content.title || 'Title Card',
    description: 'Animated title card',
    background: `linear-gradient(135deg, ${palette.background}, ${palette.surface})`,
    configSchema: [
      { key: 'title', label: 'Title', type: 'text', defaultValue: content.title || 'Title', group: 'Content' },
      { key: 'subtitle', label: 'Subtitle', type: 'text', defaultValue: content.subtitle || '', group: 'Content' },
    ],
    defaultConfig: { title: content.title || 'Title', subtitle: content.subtitle || '' },
    enterDuration: 0.25,
    exitDuration: 0.15,
    palette: {
      primary: palette.primary,
      secondary: palette.secondary,
      accent: palette.accent,
      background: palette.background,
      text: palette.text,
    },
    flowRole: 'title',
    defaultTypographyPreset: typographyPreset,
    elements: [
      {
        id: 'title-text',
        type: 'text',
        text: '{{title}}',
        typographyPreset,
        style: {
          position: 'absolute',
          top: '35%',
          left: '8%',
          right: '8%',
          fontSize: 'clamp(28px, 7vw, 72px)',
          fontWeight: 800,
          color: palette.text,
          letterSpacing: '-0.02em',
          lineHeight: '1.1',
          textAlign: 'center',
        },
        animation: {
          enter: { from: { opacity: 0, y: -20 }, easing: 'cubicOut' },
          exit: { to: { opacity: 0 } },
        },
      },
      {
        id: 'accent-line',
        type: 'line',
        style: {
          position: 'absolute',
          top: '55%',
          left: '35%',
          width: '30%',
          height: '4px',
          background: palette.accent,
          borderRadius: '2px',
        },
        animation: {
          enterDelay: 0.2,
          enter: { from: { scaleX: 0, opacity: 0 }, easing: 'cubicOut' },
          exit: { to: { opacity: 0 } },
        },
      },
      {
        id: 'subtitle-text',
        type: 'text',
        text: '{{subtitle}}',
        typographyPreset: 'elegant-fade',
        style: {
          position: 'absolute',
          top: '60%',
          left: '10%',
          right: '10%',
          fontSize: 'clamp(14px, 3vw, 28px)',
          fontWeight: 400,
          color: palette.textSecondary,
          textAlign: 'center',
          letterSpacing: '0.02em',
        },
        animation: {
          enterDelay: 0.4,
          enter: { from: { opacity: 0, y: 15 }, easing: 'cubicOut' },
          exit: { to: { opacity: 0, y: -10 } },
        },
      },
    ],
  }
}

function buildLowerThird(
  content: Record<string, string>,
  palette: ColorPalette,
  typographyPreset = 'elegant-fade',
): MotionDesignDescription {
  return {
    name: content.name || 'Lower Third',
    description: 'Professional lower third overlay',
    background: 'transparent',
    configSchema: [
      { key: 'name', label: 'Name', type: 'text', defaultValue: content.name || 'Name', group: 'Content' },
      { key: 'title', label: 'Title', type: 'text', defaultValue: content.title || 'Title', group: 'Content' },
    ],
    defaultConfig: { name: content.name || 'Name', title: content.title || 'Title' },
    enterDuration: 0.15,
    exitDuration: 0.15,
    palette: {
      primary: palette.primary,
      secondary: palette.secondary,
      accent: palette.accent,
      background: palette.background,
      text: palette.text,
    },
    flowRole: 'lower-third',
    elements: [
      {
        id: 'lt-container',
        type: 'group',
        layout: 'flex-column',
        gap: 4,
        style: {
          position: 'absolute',
          bottom: '10%',
          left: '5%',
          background: `${palette.background}ee`,
          padding: '14px 24px',
          borderRadius: '8px',
          borderLeft: `4px solid ${palette.accent}`,
          maxWidth: '60%',
        },
        animation: {
          enter: { from: { x: -100, opacity: 0 }, easing: 'backOut' },
          exit: { to: { x: -100, opacity: 0 }, easing: 'cubicIn' },
        },
        children: [
          {
            id: 'lt-name',
            type: 'text',
            text: '{{name}}',
            typographyPreset,
            style: {
              fontSize: 'clamp(16px, 3.5vw, 28px)',
              fontWeight: 700,
              color: palette.text,
            },
            animation: { enterDelay: 0.2, enter: { from: { opacity: 0 } } },
          },
          {
            id: 'lt-title',
            type: 'text',
            text: '{{title}}',
            style: {
              fontSize: 'clamp(11px, 2vw, 18px)',
              fontWeight: 400,
              color: palette.textSecondary,
            },
            animation: { enterDelay: 0.4, enter: { from: { opacity: 0, y: 5 } } },
          },
        ],
      },
    ],
  }
}

function buildStatCard(
  content: Record<string, string>,
  palette: ColorPalette,
): MotionDesignDescription {
  const value = parseInt(content.value || '0', 10) || 0
  const suffix = content.suffix || ''

  return {
    name: content.label || 'Stat',
    description: 'Animated stat counter',
    background: `linear-gradient(135deg, ${palette.background}, ${palette.surface})`,
    configSchema: [
      { key: 'label', label: 'Label', type: 'text', defaultValue: content.label || 'Metric', group: 'Content' },
    ],
    defaultConfig: { label: content.label || 'Metric' },
    enterDuration: 0.3,
    exitDuration: 0.2,
    palette: {
      primary: palette.primary,
      secondary: palette.secondary,
      accent: palette.accent,
      background: palette.background,
      text: palette.text,
    },
    flowRole: 'stat',
    elements: [
      {
        id: 'stat-group',
        type: 'group',
        layout: 'flex-column',
        gap: 8,
        style: {
          position: 'absolute',
          inset: '0',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        },
        children: [
          {
            id: 'stat-counter',
            type: 'counter',
            counterTarget: value,
            counterSuffix: suffix,
            style: {
              fontSize: 'clamp(32px, 8vw, 72px)',
              fontWeight: 800,
              color: palette.accent,
            },
            animation: {
              enter: { from: { scale: 0.5, opacity: 0 }, easing: 'backOut' },
              hold: { effect: 'float', amplitude: 0.02, speed: 0.5 },
              exit: { to: { opacity: 0, y: -20 } },
            },
          },
          {
            id: 'stat-label',
            type: 'text',
            text: '{{label}}',
            style: {
              fontSize: 'clamp(12px, 2.5vw, 20px)',
              fontWeight: 500,
              color: palette.textSecondary,
              textTransform: 'uppercase',
              letterSpacing: '0.1em',
            },
            animation: {
              enterDelay: 0.3,
              enter: { from: { opacity: 0, y: 10 }, easing: 'cubicOut' },
              exit: { to: { opacity: 0 } },
            },
          },
        ],
        animation: {
          enter: { from: { opacity: 0, y: 30 } },
          exit: { to: { opacity: 0, y: -20 } },
        },
      },
    ],
  }
}

function buildCTA(
  content: Record<string, string>,
  palette: ColorPalette,
  typographyPreset = 'character-pop',
): MotionDesignDescription {
  return {
    name: 'Call to Action',
    description: 'Animated call-to-action',
    background: `linear-gradient(135deg, ${palette.background}, ${palette.surface})`,
    configSchema: [
      { key: 'text', label: 'CTA Text', type: 'text', defaultValue: content.text || 'Subscribe Now', group: 'Content' },
      { key: 'subtext', label: 'Sub Text', type: 'text', defaultValue: content.subtext || '', group: 'Content' },
    ],
    defaultConfig: { text: content.text || 'Subscribe Now', subtext: content.subtext || '' },
    enterDuration: 0.2,
    exitDuration: 0.15,
    palette: {
      primary: palette.primary,
      secondary: palette.secondary,
      accent: palette.accent,
      background: palette.background,
      text: palette.text,
    },
    flowRole: 'cta',
    elements: [
      {
        id: 'cta-group',
        type: 'group',
        layout: 'flex-column',
        gap: 16,
        style: {
          position: 'absolute',
          inset: '0',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        },
        children: [
          {
            id: 'cta-text',
            type: 'text',
            text: '{{text}}',
            typographyPreset,
            style: {
              fontSize: 'clamp(24px, 6vw, 56px)',
              fontWeight: 800,
              color: palette.text,
              textAlign: 'center',
            },
            animation: {
              enter: { from: { scale: 0.8, opacity: 0 }, easing: 'elasticOut' },
              hold: { effect: 'pulse', amplitude: 0.02, speed: 0.8 },
              exit: { to: { opacity: 0, scale: 0.9 } },
            },
          },
          {
            id: 'cta-button',
            type: 'rect',
            style: {
              width: 'clamp(160px, 30vw, 280px)',
              height: 'clamp(40px, 6vh, 56px)',
              background: palette.accent,
              borderRadius: '28px',
            },
            animation: {
              enterDelay: 0.3,
              enter: { from: { scale: 0, opacity: 0 }, easing: 'backOut' },
              hold: { effect: 'glow', amplitude: 0.05 },
              exit: { to: { opacity: 0, y: 20 } },
            },
          },
          {
            id: 'cta-subtext',
            type: 'text',
            text: '{{subtext}}',
            style: {
              fontSize: 'clamp(11px, 2vw, 16px)',
              color: palette.textSecondary,
              textAlign: 'center',
            },
            animation: {
              enterDelay: 0.5,
              enter: { from: { opacity: 0, y: 10 } },
              exit: { to: { opacity: 0 } },
            },
          },
        ],
      },
    ],
  }
}

// ── Validation ──

function validateAndNormalize(raw: any): MotionDesignDescription {
  if (!raw.name || typeof raw.name !== 'string') {
    raw.name = 'Untitled Design'
  }
  if (!raw.description || typeof raw.description !== 'string') {
    raw.description = ''
  }
  if (!raw.background || typeof raw.background !== 'string') {
    raw.background = '#111827'
  }
  if (!Array.isArray(raw.configSchema)) {
    raw.configSchema = []
  }
  if (!raw.defaultConfig || typeof raw.defaultConfig !== 'object') {
    raw.defaultConfig = {}
  }

  // Clamp durations
  raw.enterDuration = clamp(raw.enterDuration ?? 0.2, 0, 0.5)
  raw.exitDuration = clamp(raw.exitDuration ?? 0.2, 0, 0.5)

  // Ensure total doesn't exceed 1
  if (raw.enterDuration + raw.exitDuration > 0.9) {
    raw.enterDuration = 0.3
    raw.exitDuration = 0.2
  }

  if (!Array.isArray(raw.elements)) {
    raw.elements = []
  }

  // Ensure configSchema defaults match defaultConfig
  for (const field of raw.configSchema) {
    if (!(field.key in raw.defaultConfig)) {
      raw.defaultConfig[field.key] = field.defaultValue
    }
  }

  // Validate typography presets
  validateTypographyPresets(raw.elements)

  // Assign IDs to elements that lack them
  let idCounter = 0
  function ensureIds(elements: any[]) {
    for (const el of elements) {
      if (!el.id) el.id = `auto-${++idCounter}`
      if (Array.isArray(el.children)) ensureIds(el.children)
    }
  }
  ensureIds(raw.elements)

  return raw as MotionDesignDescription
}

function validateTypographyPresets(elements: any[]) {
  for (const el of elements) {
    if (el.typographyPreset && !TYPOGRAPHY_PRESETS[el.typographyPreset]) {
      // Unknown preset — remove it so we fall back to default rendering
      delete el.typographyPreset
    }
    if (Array.isArray(el.children)) {
      validateTypographyPresets(el.children)
    }
  }
}

function clamp(v: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, v))
}
