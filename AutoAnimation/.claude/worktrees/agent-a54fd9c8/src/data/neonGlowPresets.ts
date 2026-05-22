/**
 * Neon Glow Text Style Presets
 *
 * 20 distinct neon/glow text styles for the video editor.
 * Each preset defines a complete visual look: font, color, glow layers,
 * optional stroke, and letter spacing. Apply these as style overrides
 * on any TextOverlay to instantly transform it into a neon sign.
 *
 * The `textShadow` property uses multiple layered box shadows to simulate
 * inner glow, outer glow, and distant bloom -- the three components that
 * make real neon tubes look convincing on screen.
 */

import type { FontFamily, FontWeight } from '@/stores/useTextOverlayStore'

export interface NeonGlowPreset {
  id: string
  name: string
  /** Short description of the visual effect */
  description: string
  fontFamily: FontFamily
  fontWeight: FontWeight
  /** Base text color (hex) */
  color: string
  /** Multi-layer CSS text-shadow for glow effect */
  textShadow: string
  /** Optional CSS -webkit-text-stroke value (e.g. "1px #00f") */
  WebkitTextStroke?: string
  /** Letter spacing in px */
  letterSpacing: number
  /** Preview swatch colors for the preset picker UI [primary, glow] */
  previewColors: [string, string]
}

export const NEON_GLOW_PRESETS: NeonGlowPreset[] = [

  // ═══════════════════════════════════════════════════════════════
  // 1. Electric Blue Neon
  // ═══════════════════════════════════════════════════════════════
  {
    id: 'neon-electric-blue',
    name: 'Electric Blue',
    description: 'Classic blue neon tube -- bright white core with electric blue bloom',
    fontFamily: 'Bebas Neue',
    fontWeight: 'bold',
    color: '#FFFFFF',
    textShadow: [
      '0 0 7px #FFFFFF',
      '0 0 10px #FFFFFF',
      '0 0 21px #FFFFFF',
      '0 0 42px #0FA0FF',
      '0 0 82px #0FA0FF',
      '0 0 92px #0FA0FF',
      '0 0 102px #0FA0FF',
      '0 0 151px #0FA0FF',
    ].join(', '),
    letterSpacing: 4,
    previewColors: ['#FFFFFF', '#0FA0FF'],
  },

  // ═══════════════════════════════════════════════════════════════
  // 2. Hot Pink Neon
  // ═══════════════════════════════════════════════════════════════
  {
    id: 'neon-hot-pink',
    name: 'Hot Pink',
    description: 'Saturated magenta-pink neon -- nightclub sign energy',
    fontFamily: 'Pacifico',
    fontWeight: 'normal',
    color: '#FFE4F3',
    textShadow: [
      '0 0 7px #FF2D95',
      '0 0 10px #FF2D95',
      '0 0 21px #FF2D95',
      '0 0 42px #FF2D95',
      '0 0 82px #A6005C',
      '0 0 92px #A6005C',
      '0 0 102px #A6005C',
      '0 0 151px #A6005C',
    ].join(', '),
    letterSpacing: 2,
    previewColors: ['#FFE4F3', '#FF2D95'],
  },

  // ═══════════════════════════════════════════════════════════════
  // 3. Matrix Green
  // ═══════════════════════════════════════════════════════════════
  {
    id: 'neon-matrix-green',
    name: 'Matrix Green',
    description: 'Terminal green glow -- digital rain aesthetic',
    fontFamily: 'Space Mono',
    fontWeight: 'bold',
    color: '#00FF41',
    textShadow: [
      '0 0 5px #00FF41',
      '0 0 10px #00FF41',
      '0 0 20px #00FF41',
      '0 0 40px #00FF41',
      '0 0 80px #00A82A',
      '0 0 120px #00A82A',
    ].join(', '),
    WebkitTextStroke: '0.5px #00FF41',
    letterSpacing: 6,
    previewColors: ['#00FF41', '#00A82A'],
  },

  // ═══════════════════════════════════════════════════════════════
  // 4. Purple Haze
  // ═══════════════════════════════════════════════════════════════
  {
    id: 'neon-purple-haze',
    name: 'Purple Haze',
    description: 'Deep violet with lavender bloom -- dreamy and psychedelic',
    fontFamily: 'Righteous',
    fontWeight: 'normal',
    color: '#E4B5FF',
    textShadow: [
      '0 0 7px #E4B5FF',
      '0 0 14px #BF5AF2',
      '0 0 28px #BF5AF2',
      '0 0 42px #8B2FC9',
      '0 0 82px #8B2FC9',
      '0 0 120px #5A0F99',
      '0 0 160px #5A0F99',
    ].join(', '),
    letterSpacing: 3,
    previewColors: ['#E4B5FF', '#8B2FC9'],
  },

  // ═══════════════════════════════════════════════════════════════
  // 5. Golden Glow
  // ═══════════════════════════════════════════════════════════════
  {
    id: 'neon-golden-glow',
    name: 'Golden Glow',
    description: 'Warm gold neon with amber bloom -- luxury signage feel',
    fontFamily: 'Abril Fatface',
    fontWeight: 'normal',
    color: '#FFF8DC',
    textShadow: [
      '0 0 5px #FFD700',
      '0 0 10px #FFD700',
      '0 0 20px #FFD700',
      '0 0 40px #FF9500',
      '0 0 80px #FF9500',
      '0 0 120px #CC7000',
    ].join(', '),
    letterSpacing: 2,
    previewColors: ['#FFF8DC', '#FFD700'],
  },

  // ═══════════════════════════════════════════════════════════════
  // 6. Red Hot Neon
  // ═══════════════════════════════════════════════════════════════
  {
    id: 'neon-red-hot',
    name: 'Red Hot',
    description: 'Blazing red neon -- danger signs and bold statements',
    fontFamily: 'Archivo Black',
    fontWeight: 'normal',
    color: '#FFD5D5',
    textShadow: [
      '0 0 7px #FF1744',
      '0 0 14px #FF1744',
      '0 0 28px #FF1744',
      '0 0 56px #D50000',
      '0 0 82px #D50000',
      '0 0 120px #9B0000',
      '0 0 160px #9B0000',
    ].join(', '),
    WebkitTextStroke: '0.5px #FF1744',
    letterSpacing: 3,
    previewColors: ['#FFD5D5', '#FF1744'],
  },

  // ═══════════════════════════════════════════════════════════════
  // 7. Cyan Ice Glow
  // ═══════════════════════════════════════════════════════════════
  {
    id: 'neon-cyan-ice',
    name: 'Cyan Ice',
    description: 'Cold cyan with icy white bloom -- frozen neon aesthetic',
    fontFamily: 'Comfortaa',
    fontWeight: 'bold',
    color: '#E0FFFF',
    textShadow: [
      '0 0 5px #E0FFFF',
      '0 0 10px #00FFFF',
      '0 0 20px #00FFFF',
      '0 0 40px #00CED1',
      '0 0 80px #00CED1',
      '0 0 120px #008B8B',
    ].join(', '),
    letterSpacing: 5,
    previewColors: ['#E0FFFF', '#00FFFF'],
  },

  // ═══════════════════════════════════════════════════════════════
  // 8. Sunset Neon
  // ═══════════════════════════════════════════════════════════════
  {
    id: 'neon-sunset',
    name: 'Sunset Neon',
    description: 'Warm orange fading to magenta -- vaporwave sunset vibe',
    fontFamily: 'Fredoka',
    fontWeight: 'semibold',
    color: '#FFECD2',
    textShadow: [
      '0 0 7px #FF6B35',
      '0 0 14px #FF6B35',
      '0 0 28px #FF4081',
      '0 0 56px #FF4081',
      '0 0 82px #C2185B',
      '0 0 120px #C2185B',
    ].join(', '),
    letterSpacing: 2,
    previewColors: ['#FF6B35', '#FF4081'],
  },

  // ═══════════════════════════════════════════════════════════════
  // 9. Toxic Green
  // ═══════════════════════════════════════════════════════════════
  {
    id: 'neon-toxic-green',
    name: 'Toxic Green',
    description: 'Radioactive green with yellow-green inner glow -- hazardous energy',
    fontFamily: 'Bangers',
    fontWeight: 'normal',
    color: '#CCFF00',
    textShadow: [
      '0 0 7px #CCFF00',
      '0 0 10px #CCFF00',
      '0 0 21px #76FF03',
      '0 0 42px #76FF03',
      '0 0 82px #64DD17',
      '0 0 92px #64DD17',
      '0 0 130px #33691E',
    ].join(', '),
    WebkitTextStroke: '1px #76FF03',
    letterSpacing: 4,
    previewColors: ['#CCFF00', '#76FF03'],
  },

  // ═══════════════════════════════════════════════════════════════
  // 10. White Hot
  // ═══════════════════════════════════════════════════════════════
  {
    id: 'neon-white-hot',
    name: 'White Hot',
    description: 'Blinding white core with blue-white plasma bloom -- overdriven tube',
    fontFamily: 'Montserrat',
    fontWeight: 'black',
    color: '#FFFFFF',
    textShadow: [
      '0 0 5px #FFFFFF',
      '0 0 10px #FFFFFF',
      '0 0 20px #FFFFFF',
      '0 0 40px #F0F0FF',
      '0 0 60px #D0D0FF',
      '0 0 80px #B0B0FF',
      '0 0 120px #8888FF',
    ].join(', '),
    letterSpacing: 3,
    previewColors: ['#FFFFFF', '#B0B0FF'],
  },

  // ═══════════════════════════════════════════════════════════════
  // 11. Synthwave Magenta
  // ═══════════════════════════════════════════════════════════════
  {
    id: 'neon-synthwave',
    name: 'Synthwave Magenta',
    description: 'Retro-futuristic magenta-to-blue neon -- 80s synthwave aesthetic',
    fontFamily: 'Bebas Neue',
    fontWeight: 'normal',
    color: '#FF6EC7',
    textShadow: [
      '0 0 7px #FF6EC7',
      '0 0 14px #FF6EC7',
      '0 0 28px #D946EF',
      '0 0 42px #D946EF',
      '0 0 60px #7C3AED',
      '0 0 82px #7C3AED',
      '0 0 120px #4C1D95',
    ].join(', '),
    WebkitTextStroke: '1px #FF6EC7',
    letterSpacing: 8,
    previewColors: ['#FF6EC7', '#7C3AED'],
  },

  // ═══════════════════════════════════════════════════════════════
  // 12. Aqua Marine
  // ═══════════════════════════════════════════════════════════════
  {
    id: 'neon-aquamarine',
    name: 'Aqua Marine',
    description: 'Sea-green neon with teal undertones -- underwater light',
    fontFamily: 'Poppins',
    fontWeight: 'semibold',
    color: '#ADFFD8',
    textShadow: [
      '0 0 5px #ADFFD8',
      '0 0 10px #00E5A0',
      '0 0 20px #00E5A0',
      '0 0 40px #00BFA5',
      '0 0 80px #00897B',
      '0 0 120px #004D40',
    ].join(', '),
    letterSpacing: 2,
    previewColors: ['#ADFFD8', '#00E5A0'],
  },

  // ═══════════════════════════════════════════════════════════════
  // 13. Lava Orange
  // ═══════════════════════════════════════════════════════════════
  {
    id: 'neon-lava-orange',
    name: 'Lava Orange',
    description: 'Molten orange with deep red bloom -- volcanic heat signature',
    fontFamily: 'Alfa Slab One',
    fontWeight: 'normal',
    color: '#FFE0B2',
    textShadow: [
      '0 0 7px #FF9100',
      '0 0 14px #FF9100',
      '0 0 28px #FF6D00',
      '0 0 56px #FF3D00',
      '0 0 82px #DD2C00',
      '0 0 120px #BF360C',
    ].join(', '),
    letterSpacing: 2,
    previewColors: ['#FF9100', '#FF3D00'],
  },

  // ═══════════════════════════════════════════════════════════════
  // 14. Royal Indigo
  // ═══════════════════════════════════════════════════════════════
  {
    id: 'neon-royal-indigo',
    name: 'Royal Indigo',
    description: 'Deep indigo neon with violet bloom -- regal and mysterious',
    fontFamily: 'Playfair Display',
    fontWeight: 'bold',
    color: '#D1C4E9',
    textShadow: [
      '0 0 5px #D1C4E9',
      '0 0 10px #7C4DFF',
      '0 0 20px #7C4DFF',
      '0 0 40px #651FFF',
      '0 0 80px #6200EA',
      '0 0 120px #311B92',
    ].join(', '),
    WebkitTextStroke: '0.5px #7C4DFF',
    letterSpacing: 3,
    previewColors: ['#D1C4E9', '#7C4DFF'],
  },

  // ═══════════════════════════════════════════════════════════════
  // 15. Bubblegum Pop
  // ═══════════════════════════════════════════════════════════════
  {
    id: 'neon-bubblegum',
    name: 'Bubblegum Pop',
    description: 'Soft pink with candy glow -- playful and cheerful',
    fontFamily: 'Fredoka',
    fontWeight: 'bold',
    color: '#FFFFFF',
    textShadow: [
      '0 0 7px #FF80AB',
      '0 0 14px #FF80AB',
      '0 0 28px #FF4081',
      '0 0 42px #FF4081',
      '0 0 60px #F50057',
      '0 0 82px #F50057',
      '0 0 120px #C51162',
    ].join(', '),
    WebkitTextStroke: '1px #FF80AB',
    letterSpacing: 1,
    previewColors: ['#FF80AB', '#F50057'],
  },

  // ═══════════════════════════════════════════════════════════════
  // 16. Midnight Blue
  // ═══════════════════════════════════════════════════════════════
  {
    id: 'neon-midnight-blue',
    name: 'Midnight Blue',
    description: 'Deep navy blue neon with cool white edge -- elegant and quiet',
    fontFamily: 'Montserrat',
    fontWeight: 'semibold',
    color: '#B3E5FC',
    textShadow: [
      '0 0 5px #B3E5FC',
      '0 0 10px #42A5F5',
      '0 0 20px #42A5F5',
      '0 0 40px #1565C0',
      '0 0 80px #0D47A1',
      '0 0 120px #082B6E',
    ].join(', '),
    letterSpacing: 4,
    previewColors: ['#B3E5FC', '#1565C0'],
  },

  // ═══════════════════════════════════════════════════════════════
  // 17. Neon Coral
  // ═══════════════════════════════════════════════════════════════
  {
    id: 'neon-coral',
    name: 'Neon Coral',
    description: 'Warm coral with peach bloom -- tropical and vibrant',
    fontFamily: 'Permanent Marker',
    fontWeight: 'normal',
    color: '#FFF0EA',
    textShadow: [
      '0 0 7px #FF6F61',
      '0 0 14px #FF6F61',
      '0 0 28px #FF5252',
      '0 0 42px #FF5252',
      '0 0 82px #E53935',
      '0 0 120px #C62828',
    ].join(', '),
    letterSpacing: 3,
    previewColors: ['#FF6F61', '#FF5252'],
  },

  // ═══════════════════════════════════════════════════════════════
  // 18. Frost Lilac
  // ═══════════════════════════════════════════════════════════════
  {
    id: 'neon-frost-lilac',
    name: 'Frost Lilac',
    description: 'Pastel lilac with frosty white bloom -- delicate and ethereal',
    fontFamily: 'Comfortaa',
    fontWeight: 'medium',
    color: '#F3E5F5',
    textShadow: [
      '0 0 5px #F3E5F5',
      '0 0 10px #CE93D8',
      '0 0 20px #CE93D8',
      '0 0 40px #AB47BC',
      '0 0 60px #AB47BC',
      '0 0 80px #7B1FA2',
      '0 0 120px #4A148C',
    ].join(', '),
    letterSpacing: 5,
    previewColors: ['#F3E5F5', '#CE93D8'],
  },

  // ═══════════════════════════════════════════════════════════════
  // 19. Cyber Yellow
  // ═══════════════════════════════════════════════════════════════
  {
    id: 'neon-cyber-yellow',
    name: 'Cyber Yellow',
    description: 'High-voltage yellow with lime-green edge -- warning-sign intensity',
    fontFamily: 'Bangers',
    fontWeight: 'normal',
    color: '#FFFF00',
    textShadow: [
      '0 0 7px #FFFF00',
      '0 0 10px #FFFF00',
      '0 0 21px #FFD600',
      '0 0 42px #FFD600',
      '0 0 82px #AEEA00',
      '0 0 92px #AEEA00',
      '0 0 130px #827717',
    ].join(', '),
    WebkitTextStroke: '1px #FFD600',
    letterSpacing: 5,
    previewColors: ['#FFFF00', '#AEEA00'],
  },

  // ═══════════════════════════════════════════════════════════════
  // 20. Ultraviolet
  // ═══════════════════════════════════════════════════════════════
  {
    id: 'neon-ultraviolet',
    name: 'Ultraviolet',
    description: 'UV blacklight glow -- invisible ink revealed under purple light',
    fontFamily: 'Righteous',
    fontWeight: 'normal',
    color: '#E8B4F8',
    textShadow: [
      '0 0 7px #E040FB',
      '0 0 14px #E040FB',
      '0 0 28px #AA00FF',
      '0 0 42px #AA00FF',
      '0 0 60px #6200EA',
      '0 0 82px #6200EA',
      '0 0 120px #311B92',
      '0 0 160px #1A0050',
    ].join(', '),
    WebkitTextStroke: '0.5px #E040FB',
    letterSpacing: 4,
    previewColors: ['#E040FB', '#AA00FF'],
  },
]

// ── Helper: Apply a neon preset to CSS style object ────────────

export function applyNeonGlowStyle(presetId: string): React.CSSProperties | undefined {
  const preset = NEON_GLOW_PRESETS.find(p => p.id === presetId)
  if (!preset) return undefined

  const styles: React.CSSProperties = {
    fontFamily: `"${preset.fontFamily}", sans-serif`,
    fontWeight: preset.fontWeight,
    color: preset.color,
    textShadow: preset.textShadow,
    letterSpacing: `${preset.letterSpacing}px`,
  }

  if (preset.WebkitTextStroke) {
    (styles as Record<string, string>).WebkitTextStroke = preset.WebkitTextStroke
  }

  return styles
}

// ── Helper: Get preset by ID ───────────────────────────────────

export function getNeonGlowPreset(presetId: string): NeonGlowPreset | undefined {
  return NEON_GLOW_PRESETS.find(p => p.id === presetId)
}
