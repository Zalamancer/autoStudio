/**
 * Elemental / Nature Text Style Presets
 *
 * 20 text styles using properly researched CSS text-shadow techniques.
 * Each preset uses a distinct visual approach — no two presets share
 * the same "expanding glow blob" pattern.
 *
 * Techniques sourced from: Design Shack, CSS-Tricks, CodePen,
 * Frontend Masters, MDN, and professional CSS text effect guides.
 */

import type { FontFamily, FontWeight } from '@/stores/useTextOverlayStore'

export interface ElementalTextPreset {
  id: string
  /** Creative display name */
  name: string
  /** Short description of the visual effect */
  description: string
  fontFamily: FontFamily
  fontWeight: FontWeight
  /** Base text color (hex) */
  color: string
  /** Multi-layer CSS text-shadow creating the elemental effect */
  textShadow: string
  /** Optional CSS -webkit-text-stroke value */
  webkitTextStroke?: string
  /** Letter spacing in px */
  letterSpacing: number
  /** Text case override */
  textCase?: 'none' | 'uppercase' | 'lowercase'
  /** Preview swatch colors for the preset picker UI [primary, accent] */
  previewColors: [string, string]
}

export const ELEMENTAL_TEXT_PRESETS: ElementalTextPreset[] = [

  // ── 1. Rising Flame ────────────────────────────────────────────
  // Fire effect with negative Y-offsets creating upward flames
  // Source: CSS-Tricks fire text technique
  {
    id: 'elem-rising-flame',
    name: 'Rising Flame',
    description: 'Upward flames — warm palette with negative Y-offsets for realistic fire',
    fontFamily: 'Archivo Black',
    fontWeight: 'bold',
    color: '#FFFFFF',
    textShadow: [
      '0 0 20px #fefcc9',
      '10px -10px 30px #feec85',
      '-20px -20px 40px #ffae34',
      '20px -40px 50px #ec760c',
      '-20px -60px 60px #cd4606',
      '0 -80px 70px #973716',
      '10px -90px 80px #451b0e',
    ].join(', '),
    letterSpacing: 2,
    textCase: 'uppercase',
    previewColors: ['#fefcc9', '#cd4606'],
  },

  // ── 2. Frosted Glass ───────────────────────────────────────────
  // Subtle ice with white core and soft cyan outer glow
  {
    id: 'elem-frosted-ice',
    name: 'Frosted Ice',
    description: 'Crisp ice — white core with delicate cyan crystalline edges',
    fontFamily: 'Comfortaa',
    fontWeight: 'bold',
    color: '#E8F4FD',
    textShadow: [
      '0 0 5px #FFFFFF',
      '0 0 10px #FFFFFF',
      '0 0 20px #B3E5FC',
      '0 0 35px #4FC3F7',
      '0 2px 3px rgba(0, 0, 0, 0.2)',
    ].join(', '),
    webkitTextStroke: '0.5px rgba(255, 255, 255, 0.4)',
    letterSpacing: 3,
    previewColors: ['#E8F4FD', '#4FC3F7'],
  },

  // ── 3. Stone Carved ────────────────────────────────────────────
  // Engraved into stone — light shadow above, dark below
  // Source: 30 Seconds of Code engraved text technique
  {
    id: 'elem-stone-carved',
    name: 'Stone Carved',
    description: 'Engraved into stone — dual shadow creates carved illusion',
    fontFamily: 'Alfa Slab One',
    fontWeight: 'bold',
    color: '#7a7a7a',
    textShadow: [
      '0 -1px 0 rgba(0, 0, 0, 0.6)',
      '0 1px 0 rgba(255, 255, 255, 0.12)',
      '-1px -1px 1px rgba(0, 0, 0, 0.3)',
      '1px 1px 1px rgba(255, 255, 255, 0.15)',
    ].join(', '),
    letterSpacing: 3,
    textCase: 'uppercase',
    previewColors: ['#7a7a7a', '#444444'],
  },

  // ── 4. Gold Foil ───────────────────────────────────────────────
  // Metallic gold with embossed depth shadows
  // Source: TinyMCE gold text effect guide
  {
    id: 'elem-gold-foil',
    name: 'Gold Foil',
    description: 'Gleaming gold — metallic lustre with embossed depth and warm shadow',
    fontFamily: 'Playfair Display',
    fontWeight: 'bold',
    color: '#FFD700',
    textShadow: [
      '-1px 0 1px #c6bb9f',
      '0 1px 1px #c6bb9f',
      '1px 1px 0px #B8860B',
      '2px 2px 0px #8B6914',
      '5px 5px 10px rgba(0, 0, 0, 0.4)',
      '-5px -5px 10px rgba(0, 0, 0, 0.4)',
    ].join(', '),
    webkitTextStroke: '0.5px #B8860B',
    letterSpacing: 2,
    previewColors: ['#FFD700', '#B8860B'],
  },

  // ── 5. 3D Depth ────────────────────────────────────────────────
  // Classic 3D extrusion with progressive stacked shadows
  // Source: Mark Dotto / Design Shack 3D technique
  {
    id: 'elem-3d-depth',
    name: '3D Depth',
    description: 'Seriously 3D — stacked gray shadows with progressive depth and soft blur',
    fontFamily: 'Montserrat',
    fontWeight: 'black',
    color: '#333333',
    textShadow: [
      '0 1px 0 #ccc',
      '0 2px 0 #c9c9c9',
      '0 3px 0 #bbb',
      '0 4px 0 #b9b9b9',
      '0 5px 0 #aaa',
      '0 6px 1px rgba(0,0,0,.1)',
      '0 0 5px rgba(0,0,0,.1)',
      '0 1px 3px rgba(0,0,0,.3)',
      '0 3px 5px rgba(0,0,0,.2)',
      '0 5px 10px rgba(0,0,0,.25)',
      '0 10px 10px rgba(0,0,0,.2)',
      '0 20px 20px rgba(0,0,0,.15)',
    ].join(', '),
    letterSpacing: 2,
    textCase: 'uppercase',
    previewColors: ['#333333', '#aaaaaa'],
  },

  // ── 6. Thunderbolt ─────────────────────────────────────────────
  // Electric discharge — white core with blue-violet glow
  {
    id: 'elem-thunderbolt',
    name: 'Thunderbolt',
    description: 'Electric strike — bright white with crackling blue-violet discharge',
    fontFamily: 'Bebas Neue',
    fontWeight: 'bold',
    color: '#FFFFFF',
    textShadow: [
      '0 0 7px #FFFFFF',
      '0 0 10px #FFFFFF',
      '0 0 21px #FFFFFF',
      '0 0 42px #0fa',
      '0 0 82px #0fa',
      '0 0 92px #0fa',
      '0 0 102px #0fa',
      '0 0 151px #0fa',
    ].join(', '),
    letterSpacing: 6,
    textCase: 'uppercase',
    previewColors: ['#FFFFFF', '#00ffaa'],
  },

  // ── 7. Ocean Gradient ──────────────────────────────────────────
  // Sophisticated ocean depth with layered blue tones
  // Source: Nature text research — ocean wave palette
  {
    id: 'elem-ocean-depth',
    name: 'Ocean Depth',
    description: 'Deep water — navy text with teal and aqua depth shadows',
    fontFamily: 'Merriweather',
    fontWeight: 'bold',
    color: '#2e5a6f',
    textShadow: [
      '1px 1px 0px #3d7a94',
      '2px 2px 0px #4a8fb5',
      '3px 3px 0px #5fa8c7',
      '4px 4px 6px rgba(46, 90, 111, 0.5)',
      '0 0 15px rgba(74, 143, 181, 0.2)',
    ].join(', '),
    letterSpacing: 2,
    previewColors: ['#2e5a6f', '#5fa8c7'],
  },

  // ── 8. Wood Grain ──────────────────────────────────────────────
  // Earthy brown with embossed depth
  // Source: Nature/organic text research
  {
    id: 'elem-wood-grain',
    name: 'Wood Grain',
    description: 'Rustic wood — warm brown with earthy embossed depth',
    fontFamily: 'Lato',
    fontWeight: 'bold',
    color: '#6b4423',
    textShadow: [
      '0px 3px 0px #8b6f47',
      '0px 14px 10px rgba(0,0,0,0.15)',
      '0px 24px 2px rgba(0,0,0,0.1)',
      '0px 34px 30px rgba(0,0,0,0.08)',
    ].join(', '),
    letterSpacing: 2,
    previewColors: ['#6b4423', '#8b6f47'],
  },

  // ── 9. Rose Gold ───────────────────────────────────────────────
  // Elegant rose gold with warm metallic shadow
  // Source: Luxury text research
  {
    id: 'elem-rose-gold',
    name: 'Rose Gold',
    description: 'Elegant rose gold — warm pink-champagne with soft metallic sheen',
    fontFamily: 'Abril Fatface',
    fontWeight: 'bold',
    color: '#e8b4a8',
    textShadow: [
      '-1px 0 1px #d89b9b',
      '0 1px 1px #d89b9b',
      '1px 1px 0px #b87d7d',
      '2px 2px 4px rgba(0, 0, 0, 0.3)',
      '0 0 10px rgba(240, 216, 168, 0.2)',
    ].join(', '),
    letterSpacing: 2,
    previewColors: ['#e8b4a8', '#d89b9b'],
  },

  // ── 10. Silver Chrome ──────────────────────────────────────────
  // Metallic silver with bright highlights
  // Source: Luxury research — silver metallic
  {
    id: 'elem-silver-chrome',
    name: 'Silver Chrome',
    description: 'Polished chrome — bright silver with metallic highlights and depth',
    fontFamily: 'Raleway',
    fontWeight: 'bold',
    color: '#e8e8e8',
    textShadow: [
      '-1px 0 1px #d0d0d0',
      '0 1px 1px #d0d0d0',
      '1px 1px 0px #b0b0b0',
      '2px 2px 0px #999999',
      '3px 3px 8px rgba(0, 0, 0, 0.3)',
      '0 0 6px rgba(255, 255, 255, 0.15)',
    ].join(', '),
    letterSpacing: 3,
    textCase: 'uppercase',
    previewColors: ['#e8e8e8', '#999999'],
  },

  // ── 11. Bronze Heritage ────────────────────────────────────────
  // Antique bronze with warm embossed look
  // Source: Nature/organic text research
  {
    id: 'elem-bronze-heritage',
    name: 'Bronze Heritage',
    description: 'Antique bronze — warm copper tones with aged embossed texture',
    fontFamily: 'Playfair Display',
    fontWeight: 'bold',
    color: '#8b5a3c',
    textShadow: [
      '-2px 2px 1px rgba(0, 0, 0, 0.2)',
      '2px -2px 1px rgba(200, 180, 140, 0.3)',
      '0 3px 6px rgba(0, 0, 0, 0.3)',
    ].join(', '),
    letterSpacing: 2,
    previewColors: ['#8b5a3c', '#a0826d'],
  },

  // ── 12. Letterpress ────────────────────────────────────────────
  // Subtle embossed/debossed look
  // Source: SitePoint letterpress technique
  {
    id: 'elem-letterpress',
    name: 'Letterpress',
    description: 'Embossed letterpress — subtle pressed-in effect with dual shadow technique',
    fontFamily: 'Poppins',
    fontWeight: 'semibold',
    color: 'rgba(0, 0, 0, 0.6)',
    textShadow: [
      '2px 8px 6px rgba(0,0,0,0.2)',
      '0px -5px 35px rgba(255,255,255,0.3)',
    ].join(', '),
    letterSpacing: 1,
    previewColors: ['#666666', '#cccccc'],
  },

  // ── 13. Blood Drip ─────────────────────────────────────────────
  // Horror red with downward dripping shadow layers
  // Source: CSS-Tricks blood drip technique
  {
    id: 'elem-blood-drip',
    name: 'Blood Drip',
    description: 'Dark horror — deep crimson with downward-dripping shadow layers',
    fontFamily: 'Permanent Marker',
    fontWeight: 'bold',
    color: '#300000',
    textShadow: [
      '0 2px 0 #FF0000',
      '0 4px 0 #CC0000',
      '0 6px 0 #990000',
      '0 8px 0 #660000',
      '0 10px 0 #330000',
      '0 12px 0 #1a0000',
    ].join(', '),
    webkitTextStroke: '1px #8B0000',
    letterSpacing: 2,
    textCase: 'uppercase',
    previewColors: ['#300000', '#FF0000'],
  },

  // ── 14. Ghostly Whisper ────────────────────────────────────────
  // Transparent text with shadow-only visibility
  // Source: Horror text research
  {
    id: 'elem-ghostly-whisper',
    name: 'Ghostly Whisper',
    description: 'Ethereal phantom — transparent text visible only through eerie glow',
    fontFamily: 'Raleway',
    fontWeight: 'bold',
    color: 'transparent',
    textShadow: [
      '0 0 10px rgba(200, 200, 255, 0.8)',
      '0 0 20px rgba(100, 100, 255, 0.6)',
      '0 0 30px rgba(50, 50, 255, 0.4)',
      '0 0 40px rgba(150, 150, 255, 0.3)',
    ].join(', '),
    letterSpacing: 4,
    previewColors: ['#c8c8ff', '#6464ff'],
  },

  // ── 15. Dark Fog ───────────────────────────────────────────────
  // Smoke/fog with expanding gray shadows
  // Source: Horror text research
  {
    id: 'elem-dark-fog',
    name: 'Dark Fog',
    description: 'Mysterious fog — dark text dissolving into expanding smoke layers',
    fontFamily: 'Oswald',
    fontWeight: 'bold',
    color: '#2a2a2a',
    textShadow: [
      '0 0 8px rgba(100, 100, 100, 0.5)',
      '0 0 16px rgba(80, 80, 80, 0.4)',
      '0 0 24px rgba(60, 60, 60, 0.3)',
      '0 0 32px rgba(40, 40, 40, 0.2)',
      '0 0 40px rgba(20, 20, 20, 0.1)',
      '2px 2px 4px rgba(0, 0, 0, 0.9)',
    ].join(', '),
    letterSpacing: 2,
    textCase: 'uppercase',
    previewColors: ['#2a2a2a', '#646464'],
  },

  // ── 16. Superhero ──────────────────────────────────────────────
  // Bold comic book diagonal multi-color extrusion
  // Source: Design Shack superhero technique
  {
    id: 'elem-superhero',
    name: 'Superhero',
    description: 'Comic book bold — diagonal cyan shadow extrusion like a superhero title',
    fontFamily: 'Bangers',
    fontWeight: 'bold',
    color: '#000000',
    textShadow: [
      '-10px 10px 0px #00e6e6',
      '-20px 20px 0px #01cccc',
      '-30px 30px 0px #00bdbd',
    ].join(', '),
    letterSpacing: 3,
    textCase: 'uppercase',
    previewColors: ['#000000', '#00e6e6'],
  },

  // ── 17. Retro Board ────────────────────────────────────────────
  // Vibrant retro with alternating colored shadow offsets
  // Source: CodePen retro board game technique
  {
    id: 'elem-retro-board',
    name: 'Retro Board',
    description: 'Playful retro — alternating yellow and cyan stacked shadow layers',
    fontFamily: 'Fredoka',
    fontWeight: 'bold',
    color: '#000000',
    textShadow: [
      '10px 10px 0 #ffd217',
      '20px 20px 0 #5ac7ff',
      '30px 30px 0 #ffd217',
      '40px 40px 0 #5ac7ff',
    ].join(', '),
    letterSpacing: 2,
    previewColors: ['#000000', '#ffd217'],
  },

  // ── 18. Echo Layers ────────────────────────────────────────────
  // Repeating offset shadows like a visual echo
  // Source: Canva echo text effect
  {
    id: 'elem-echo-layers',
    name: 'Echo Layers',
    description: 'Echoing depth — repeating blue offset shadows fading into distance',
    fontFamily: 'Righteous',
    fontWeight: 'bold',
    color: '#FFFFFF',
    textShadow: [
      '3px 3px 0 rgba(100, 100, 255, 0.7)',
      '6px 6px 0 rgba(100, 100, 255, 0.5)',
      '9px 9px 0 rgba(100, 100, 255, 0.3)',
      '12px 12px 0 rgba(100, 100, 255, 0.15)',
    ].join(', '),
    letterSpacing: 2,
    previewColors: ['#FFFFFF', '#6464ff'],
  },

  // ── 19. Moss Sage ──────────────────────────────────────────────
  // Soft sage green with subtle wellness-zen shadow
  // Source: Nature/organic research
  {
    id: 'elem-moss-sage',
    name: 'Moss Sage',
    description: 'Zen wellness — muted sage green with soft earthy shadow depth',
    fontFamily: 'Nunito',
    fontWeight: 'semibold',
    color: '#7a9478',
    textShadow: '2px 2px 4px rgba(0, 0, 0, 0.15)',
    letterSpacing: 1,
    previewColors: ['#7a9478', '#6b8e71'],
  },

  // ── 20. Vintage Retro ──────────────────────────────────────────
  // Classic retro dual offset shadows in gray tones
  // Source: CodePen vintage/retro technique
  {
    id: 'elem-vintage-retro',
    name: 'Vintage Retro',
    description: 'Classic retro — dual offset shadows in light and medium gray tones',
    fontFamily: 'Space Mono',
    fontWeight: 'bold',
    color: '#333333',
    textShadow: [
      '5px 5px 0px #eeeeee',
      '7px 7px 0px #707070',
    ].join(', '),
    letterSpacing: 2,
    previewColors: ['#333333', '#707070'],
  },
]

// ── Helper: Get preset by ID ───────────────────────────────────

export function getElementalPreset(presetId: string): ElementalTextPreset | undefined {
  return ELEMENTAL_TEXT_PRESETS.find(p => p.id === presetId)
}

// ── Helper: Build CSS style object from a preset ───────────────

export function applyElementalStyle(presetId: string): React.CSSProperties | undefined {
  const preset = ELEMENTAL_TEXT_PRESETS.find(p => p.id === presetId)
  if (!preset) return undefined

  const styles: React.CSSProperties = {
    fontFamily: `"${preset.fontFamily}", sans-serif`,
    fontWeight: preset.fontWeight,
    color: preset.color,
    textShadow: preset.textShadow,
    letterSpacing: `${preset.letterSpacing}px`,
  }

  if (preset.webkitTextStroke) {
    ;(styles as Record<string, string>).WebkitTextStroke = preset.webkitTextStroke
  }

  if (preset.textCase && preset.textCase !== 'none') {
    styles.textTransform = preset.textCase
  }

  return styles
}
