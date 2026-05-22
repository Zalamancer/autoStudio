/**
 * Cinematic / Film Text Style Presets
 *
 * 20 dramatic text style presets inspired by film title cards, movie trailers,
 * and cinematic typography. Each preset defines a unique visual identity through
 * font selection, color, shadow depth, stroke, tracking, and case treatment.
 *
 * These presets map to TextOverlay store properties where possible and provide
 * additional CSS style overrides (textShadow, WebkitTextStroke) for rendering.
 */

import type { FontFamily, FontWeight, TextCase } from '@/stores/useTextOverlayStore'

export interface CinematicTextPreset {
  /** Unique identifier */
  id: string
  /** Creative display name */
  name: string
  /** Genre/mood category for grouping in UI */
  category: CinematicCategory
  /** Short description of the film vibe */
  description: string

  // ── Store-compatible properties ──────────────────────────────
  fontFamily: FontFamily
  fontWeight: FontWeight
  color: string
  letterSpacing: number
  textCase: TextCase

  // ── Extended CSS properties (applied at render time) ─────────
  /** Custom text-shadow for depth, glow, or atmosphere */
  textShadow: string
  /** Webkit text stroke for outline effects (e.g., "2px #000000") */
  webkitTextStroke?: string

  // ── Preview hints ────────────────────────────────────────────
  /** Recommended font size (the user can override) */
  suggestedFontSize: number
  /** Dark or light background recommendation for best contrast */
  backgroundHint: 'dark' | 'light'
}

export type CinematicCategory =
  | 'horror'
  | 'sci-fi'
  | 'thriller'
  | 'romance'
  | 'war'
  | 'noir'
  | 'documentary'
  | 'action'
  | 'fantasy'
  | 'anime'
  | 'streaming'
  | 'classic'

// ── Preset Definitions ─────────────────────────────────────────

export const CINEMATIC_TEXT_PRESETS: CinematicTextPreset[] = [

  // ═══════════════════════════════════════════════════════════════
  // 1. HORROR — Blood Drip
  // ═══════════════════════════════════════════════════════════════
  {
    id: 'cinema-blood-drip',
    name: 'Blood Drip',
    category: 'horror',
    description: 'Slasher horror title with deep red glow and blood-drip shadow',
    fontFamily: 'Abril Fatface',
    fontWeight: 'normal',
    color: '#C62828',
    letterSpacing: 4,
    textCase: 'uppercase',
    textShadow: [
      '0 0 10px rgba(198,40,40,0.8)',
      '0 0 40px rgba(198,40,40,0.4)',
      '0 4px 6px rgba(0,0,0,0.9)',
      '0 8px 20px rgba(80,0,0,0.6)',
    ].join(', '),
    suggestedFontSize: 72,
    backgroundHint: 'dark',
  },

  // ═══════════════════════════════════════════════════════════════
  // 2. HORROR — Paranormal Whisper
  // ═══════════════════════════════════════════════════════════════
  {
    id: 'cinema-paranormal-whisper',
    name: 'Paranormal Whisper',
    category: 'horror',
    description: 'Supernatural horror with ghostly pale text and ethereal haze',
    fontFamily: 'Raleway',
    fontWeight: 'normal',
    color: '#B0BEC5',
    letterSpacing: 12,
    textCase: 'uppercase',
    textShadow: [
      '0 0 20px rgba(176,190,197,0.5)',
      '0 0 60px rgba(176,190,197,0.2)',
      '0 0 100px rgba(100,130,160,0.15)',
      '0 2px 4px rgba(0,0,0,0.8)',
    ].join(', '),
    suggestedFontSize: 56,
    backgroundHint: 'dark',
  },

  // ═══════════════════════════════════════════════════════════════
  // 3. SCI-FI — Neon Circuit
  // ═══════════════════════════════════════════════════════════════
  {
    id: 'cinema-neon-circuit',
    name: 'Neon Circuit',
    category: 'sci-fi',
    description: 'Cyberpunk sci-fi with electric cyan neon glow and digital edge',
    fontFamily: 'Space Mono',
    fontWeight: 'bold',
    color: '#00E5FF',
    letterSpacing: 6,
    textCase: 'uppercase',
    textShadow: [
      '0 0 7px rgba(0,229,255,0.9)',
      '0 0 20px rgba(0,229,255,0.6)',
      '0 0 42px rgba(0,229,255,0.3)',
      '0 0 80px rgba(0,229,255,0.15)',
    ].join(', '),
    webkitTextStroke: '1px rgba(0,229,255,0.4)',
    suggestedFontSize: 60,
    backgroundHint: 'dark',
  },

  // ═══════════════════════════════════════════════════════════════
  // 4. SCI-FI — Deep Space
  // ═══════════════════════════════════════════════════════════════
  {
    id: 'cinema-deep-space',
    name: 'Deep Space',
    category: 'sci-fi',
    description: 'Interstellar epic with cool white text and cosmic blue halo',
    fontFamily: 'Raleway',
    fontWeight: 'semibold',
    color: '#E3F2FD',
    letterSpacing: 14,
    textCase: 'uppercase',
    textShadow: [
      '0 0 15px rgba(100,181,246,0.5)',
      '0 0 45px rgba(66,165,245,0.25)',
      '0 0 90px rgba(33,150,243,0.1)',
      '0 2px 6px rgba(0,0,0,0.7)',
    ].join(', '),
    suggestedFontSize: 64,
    backgroundHint: 'dark',
  },

  // ═══════════════════════════════════════════════════════════════
  // 5. THRILLER — Cold Case
  // ═══════════════════════════════════════════════════════════════
  {
    id: 'cinema-cold-case',
    name: 'Cold Case',
    category: 'thriller',
    description: 'Psychological thriller with stark white, tight tracking, and hard shadow',
    fontFamily: 'Oswald',
    fontWeight: 'bold',
    color: '#FAFAFA',
    letterSpacing: 8,
    textCase: 'uppercase',
    textShadow: [
      '2px 2px 0 rgba(0,0,0,0.95)',
      '4px 4px 0 rgba(0,0,0,0.5)',
      '0 0 30px rgba(0,0,0,0.4)',
    ].join(', '),
    suggestedFontSize: 68,
    backgroundHint: 'dark',
  },

  // ═══════════════════════════════════════════════════════════════
  // 6. THRILLER — Amber Alert
  // ═══════════════════════════════════════════════════════════════
  {
    id: 'cinema-amber-alert',
    name: 'Amber Alert',
    category: 'thriller',
    description: 'Crime thriller with harsh amber warning tone and urgent weight',
    fontFamily: 'Bebas Neue',
    fontWeight: 'normal',
    color: '#FF8F00',
    letterSpacing: 5,
    textCase: 'uppercase',
    textShadow: [
      '0 0 8px rgba(255,143,0,0.7)',
      '0 0 25px rgba(255,143,0,0.3)',
      '0 3px 6px rgba(0,0,0,0.9)',
      '0 6px 15px rgba(0,0,0,0.5)',
    ].join(', '),
    suggestedFontSize: 76,
    backgroundHint: 'dark',
  },

  // ═══════════════════════════════════════════════════════════════
  // 7. ROMANCE — Velvet Script
  // ═══════════════════════════════════════════════════════════════
  {
    id: 'cinema-velvet-script',
    name: 'Velvet Script',
    category: 'romance',
    description: 'Romantic drama with warm rose gold and soft luminous glow',
    fontFamily: 'Playfair Display',
    fontWeight: 'normal',
    color: '#F8BBD0',
    letterSpacing: 3,
    textCase: 'none',
    textShadow: [
      '0 0 15px rgba(248,187,208,0.4)',
      '0 0 40px rgba(236,64,122,0.15)',
      '0 2px 8px rgba(0,0,0,0.5)',
    ].join(', '),
    suggestedFontSize: 58,
    backgroundHint: 'dark',
  },

  // ═══════════════════════════════════════════════════════════════
  // 8. ROMANCE — Golden Hour
  // ═══════════════════════════════════════════════════════════════
  {
    id: 'cinema-golden-hour',
    name: 'Golden Hour',
    category: 'romance',
    description: 'Sun-drenched romance with warm gold and gentle lens-flare shadow',
    fontFamily: 'Playfair Display',
    fontWeight: 'bold',
    color: '#FFD54F',
    letterSpacing: 2,
    textCase: 'none',
    textShadow: [
      '0 0 12px rgba(255,213,79,0.5)',
      '0 0 35px rgba(255,183,77,0.2)',
      '0 2px 10px rgba(0,0,0,0.6)',
      '0 4px 20px rgba(0,0,0,0.3)',
    ].join(', '),
    suggestedFontSize: 62,
    backgroundHint: 'dark',
  },

  // ═══════════════════════════════════════════════════════════════
  // 9. WAR — Iron Resolve
  // ═══════════════════════════════════════════════════════════════
  {
    id: 'cinema-iron-resolve',
    name: 'Iron Resolve',
    category: 'war',
    description: 'Military epic with cold steel grey, heavy weight, and gritty depth',
    fontFamily: 'Archivo Black',
    fontWeight: 'normal',
    color: '#CFD8DC',
    letterSpacing: 10,
    textCase: 'uppercase',
    textShadow: [
      '0 2px 0 rgba(55,71,79,0.9)',
      '0 4px 0 rgba(38,50,56,0.7)',
      '0 6px 8px rgba(0,0,0,0.8)',
      '0 10px 25px rgba(0,0,0,0.5)',
    ].join(', '),
    webkitTextStroke: '1px rgba(69,90,100,0.5)',
    suggestedFontSize: 70,
    backgroundHint: 'dark',
  },

  // ═══════════════════════════════════════════════════════════════
  // 10. NOIR — Smoke & Shadows
  // ═══════════════════════════════════════════════════════════════
  {
    id: 'cinema-smoke-shadows',
    name: 'Smoke & Shadows',
    category: 'noir',
    description: 'Film noir with muted cream, high contrast, and venetian blind shadow',
    fontFamily: 'Playfair Display',
    fontWeight: 'bold',
    color: '#EFEBE9',
    letterSpacing: 6,
    textCase: 'uppercase',
    textShadow: [
      '3px 3px 0 rgba(0,0,0,0.95)',
      '6px 6px 0 rgba(0,0,0,0.4)',
      '0 0 20px rgba(0,0,0,0.6)',
      '0 0 60px rgba(0,0,0,0.3)',
    ].join(', '),
    suggestedFontSize: 64,
    backgroundHint: 'dark',
  },

  // ═══════════════════════════════════════════════════════════════
  // 11. NOIR — Midnight Deco
  // ═══════════════════════════════════════════════════════════════
  {
    id: 'cinema-midnight-deco',
    name: 'Midnight Deco',
    category: 'noir',
    description: 'Art Deco noir with champagne gold, elegant serif, and hard drop',
    fontFamily: 'Abril Fatface',
    fontWeight: 'normal',
    color: '#D4AF37',
    letterSpacing: 8,
    textCase: 'uppercase',
    textShadow: [
      '0 2px 0 rgba(0,0,0,0.9)',
      '0 4px 8px rgba(0,0,0,0.7)',
      '0 0 15px rgba(212,175,55,0.2)',
    ].join(', '),
    webkitTextStroke: '1px rgba(212,175,55,0.3)',
    suggestedFontSize: 66,
    backgroundHint: 'dark',
  },

  // ═══════════════════════════════════════════════════════════════
  // 12. DOCUMENTARY — Factual Weight
  // ═══════════════════════════════════════════════════════════════
  {
    id: 'cinema-factual-weight',
    name: 'Factual Weight',
    category: 'documentary',
    description: 'Serious documentary with clean white, wide tracking, and minimal shadow',
    fontFamily: 'Montserrat',
    fontWeight: 'semibold',
    color: '#FFFFFF',
    letterSpacing: 16,
    textCase: 'uppercase',
    textShadow: [
      '0 1px 3px rgba(0,0,0,0.6)',
      '0 3px 10px rgba(0,0,0,0.3)',
    ].join(', '),
    suggestedFontSize: 52,
    backgroundHint: 'dark',
  },

  // ═══════════════════════════════════════════════════════════════
  // 13. DOCUMENTARY — True Crime
  // ═══════════════════════════════════════════════════════════════
  {
    id: 'cinema-true-crime',
    name: 'True Crime',
    category: 'documentary',
    description: 'True crime documentary with faded red, typewriter grit, and evidence-file feel',
    fontFamily: 'Space Mono',
    fontWeight: 'normal',
    color: '#EF9A9A',
    letterSpacing: 4,
    textCase: 'uppercase',
    textShadow: [
      '1px 1px 0 rgba(0,0,0,0.8)',
      '0 0 10px rgba(239,154,154,0.2)',
      '0 3px 8px rgba(0,0,0,0.5)',
    ].join(', '),
    suggestedFontSize: 48,
    backgroundHint: 'dark',
  },

  // ═══════════════════════════════════════════════════════════════
  // 14. ACTION — Explosive Impact
  // ═══════════════════════════════════════════════════════════════
  {
    id: 'cinema-explosive-impact',
    name: 'Explosive Impact',
    category: 'action',
    description: 'Blockbuster action with chrome white, massive stroke, and fiery underglow',
    fontFamily: 'Bebas Neue',
    fontWeight: 'normal',
    color: '#FFFFFF',
    letterSpacing: 6,
    textCase: 'uppercase',
    textShadow: [
      '0 0 10px rgba(255,152,0,0.6)',
      '0 0 30px rgba(255,87,34,0.3)',
      '0 0 60px rgba(255,61,0,0.15)',
      '0 4px 8px rgba(0,0,0,0.9)',
      '0 8px 20px rgba(0,0,0,0.5)',
    ].join(', '),
    webkitTextStroke: '2px rgba(0,0,0,0.6)',
    suggestedFontSize: 80,
    backgroundHint: 'dark',
  },

  // ═══════════════════════════════════════════════════════════════
  // 15. ACTION — Chrome Velocity
  // ═══════════════════════════════════════════════════════════════
  {
    id: 'cinema-chrome-velocity',
    name: 'Chrome Velocity',
    category: 'action',
    description: 'High-speed action with metallic silver, sharp tracking, and motion blur depth',
    fontFamily: 'Alfa Slab One',
    fontWeight: 'normal',
    color: '#E0E0E0',
    letterSpacing: 5,
    textCase: 'uppercase',
    textShadow: [
      '0 1px 0 rgba(255,255,255,0.3)',
      '0 -1px 0 rgba(0,0,0,0.5)',
      '0 4px 6px rgba(0,0,0,0.8)',
      '0 8px 16px rgba(0,0,0,0.4)',
      '4px 0 12px rgba(0,0,0,0.2)',
    ].join(', '),
    webkitTextStroke: '1px rgba(158,158,158,0.4)',
    suggestedFontSize: 72,
    backgroundHint: 'dark',
  },

  // ═══════════════════════════════════════════════════════════════
  // 16. FANTASY — Enchanted Realm
  // ═══════════════════════════════════════════════════════════════
  {
    id: 'cinema-enchanted-realm',
    name: 'Enchanted Realm',
    category: 'fantasy',
    description: 'High fantasy epic with luminous gold, mystical glow, and ancient gravitas',
    fontFamily: 'Abril Fatface',
    fontWeight: 'normal',
    color: '#FFD700',
    letterSpacing: 6,
    textCase: 'none',
    textShadow: [
      '0 0 10px rgba(255,215,0,0.6)',
      '0 0 30px rgba(255,215,0,0.3)',
      '0 0 60px rgba(255,170,0,0.15)',
      '0 3px 6px rgba(0,0,0,0.85)',
      '0 6px 15px rgba(0,0,0,0.45)',
    ].join(', '),
    webkitTextStroke: '1px rgba(139,100,0,0.4)',
    suggestedFontSize: 68,
    backgroundHint: 'dark',
  },

  // ═══════════════════════════════════════════════════════════════
  // 17. FANTASY — Arcane Grimoire
  // ═══════════════════════════════════════════════════════════════
  {
    id: 'cinema-arcane-grimoire',
    name: 'Arcane Grimoire',
    category: 'fantasy',
    description: 'Dark fantasy with violet arcane energy, mystic aura, and ancient serif',
    fontFamily: 'Playfair Display',
    fontWeight: 'bold',
    color: '#CE93D8',
    letterSpacing: 5,
    textCase: 'none',
    textShadow: [
      '0 0 8px rgba(206,147,216,0.7)',
      '0 0 25px rgba(156,39,176,0.4)',
      '0 0 50px rgba(123,31,162,0.2)',
      '0 3px 8px rgba(0,0,0,0.8)',
    ].join(', '),
    suggestedFontSize: 60,
    backgroundHint: 'dark',
  },

  // ═══════════════════════════════════════════════════════════════
  // 18. ANIME — Shonen Title
  // ═══════════════════════════════════════════════════════════════
  {
    id: 'cinema-shonen-title',
    name: 'Shonen Title',
    category: 'anime',
    description: 'Anime opening with electric orange-red, bold impact, and speed-line energy',
    fontFamily: 'Archivo Black',
    fontWeight: 'normal',
    color: '#FF3D00',
    letterSpacing: 3,
    textCase: 'uppercase',
    textShadow: [
      '0 0 6px rgba(255,61,0,0.8)',
      '0 0 18px rgba(255,61,0,0.4)',
      '3px 3px 0 rgba(0,0,0,0.9)',
      '6px 6px 0 rgba(0,0,0,0.3)',
    ].join(', '),
    webkitTextStroke: '2px rgba(0,0,0,0.7)',
    suggestedFontSize: 74,
    backgroundHint: 'dark',
  },

  // ═══════════════════════════════════════════════════════════════
  // 19. STREAMING — Netflix Crimson
  // ═══════════════════════════════════════════════════════════════
  {
    id: 'cinema-netflix-crimson',
    name: 'Netflix Crimson',
    category: 'streaming',
    description: 'Streaming platform style with deep crimson, clean sans-serif, and cinematic depth',
    fontFamily: 'Montserrat',
    fontWeight: 'black',
    color: '#E50914',
    letterSpacing: 4,
    textCase: 'uppercase',
    textShadow: [
      '0 2px 4px rgba(0,0,0,0.8)',
      '0 4px 12px rgba(0,0,0,0.5)',
      '0 8px 25px rgba(0,0,0,0.3)',
    ].join(', '),
    suggestedFontSize: 70,
    backgroundHint: 'dark',
  },

  // ═══════════════════════════════════════════════════════════════
  // 20. STREAMING — HBO Prestige
  // ═══════════════════════════════════════════════════════════════
  {
    id: 'cinema-hbo-prestige',
    name: 'HBO Prestige',
    category: 'streaming',
    description: 'Premium drama with elegant off-white, refined tracking, and understated authority',
    fontFamily: 'Raleway',
    fontWeight: 'bold',
    color: '#F5F5F5',
    letterSpacing: 20,
    textCase: 'uppercase',
    textShadow: [
      '0 1px 2px rgba(0,0,0,0.5)',
      '0 2px 8px rgba(0,0,0,0.3)',
      '0 4px 16px rgba(0,0,0,0.15)',
    ].join(', '),
    suggestedFontSize: 54,
    backgroundHint: 'dark',
  },
]

// ── Category metadata for UI ──────────────────────────────────

export const CINEMATIC_CATEGORY_INFO: Record<CinematicCategory, { label: string; description: string; order: number }> = {
  horror:      { label: 'Horror',        description: 'Slasher, supernatural, and psychological horror',  order: 0 },
  'sci-fi':    { label: 'Sci-Fi',        description: 'Cyberpunk, space opera, and futuristic',           order: 1 },
  thriller:    { label: 'Thriller',       description: 'Psychological thriller and crime suspense',        order: 2 },
  romance:     { label: 'Romance',        description: 'Romantic drama and love stories',                  order: 3 },
  war:         { label: 'War',            description: 'Military epics and battlefield dramas',            order: 4 },
  noir:        { label: 'Noir',           description: 'Film noir, detective, and shadow dramas',          order: 5 },
  documentary: { label: 'Documentary',    description: 'True stories, docuseries, and journalism',         order: 6 },
  action:      { label: 'Action',         description: 'Blockbuster explosions and high-speed thrills',    order: 7 },
  fantasy:     { label: 'Fantasy / Epic', description: 'High fantasy, mythic, and magical worlds',         order: 8 },
  anime:       { label: 'Anime',          description: 'Anime openings, shonen, and manga-inspired',      order: 9 },
  streaming:   { label: 'Streaming',      description: 'Netflix, HBO, and premium platform aesthetics',    order: 10 },
  classic:     { label: 'Classic Cinema', description: 'Golden age Hollywood and timeless film',           order: 11 },
}

// ── Helper: Apply cinematic preset to a TextOverlay ───────────

/**
 * Returns a Partial<TextOverlay> with the store-compatible properties
 * from a cinematic preset, plus the suggested font size.
 */
export function cinematicPresetToOverlay(preset: CinematicTextPreset): {
  fontFamily: FontFamily
  fontWeight: FontWeight
  color: string
  letterSpacing: number
  textCase: TextCase
  fontSize: number
  shadow: boolean
} {
  return {
    fontFamily: preset.fontFamily,
    fontWeight: preset.fontWeight,
    color: preset.color,
    letterSpacing: preset.letterSpacing,
    textCase: preset.textCase,
    fontSize: preset.suggestedFontSize,
    shadow: false, // Cinematic presets use custom textShadow, not the generic boolean
  }
}

/**
 * Returns the extended CSS properties that must be applied at render time
 * (beyond what the TextOverlay store tracks).
 */
export function cinematicPresetCSS(preset: CinematicTextPreset): React.CSSProperties {
  const css: React.CSSProperties = {
    textShadow: preset.textShadow,
  }
  if (preset.webkitTextStroke) {
    css.WebkitTextStroke = preset.webkitTextStroke
  }
  return css
}

/**
 * Find a cinematic preset by its ID.
 */
export function getCinematicPreset(id: string): CinematicTextPreset | undefined {
  return CINEMATIC_TEXT_PRESETS.find((p) => p.id === id)
}

/**
 * Get all presets for a specific category.
 */
export function getCinematicPresetsByCategory(category: CinematicCategory): CinematicTextPreset[] {
  return CINEMATIC_TEXT_PRESETS.filter((p) => p.category === category)
}
