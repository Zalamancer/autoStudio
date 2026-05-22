/**
 * Gaming / Esports Text Style Presets
 *
 * 20 aggressive, high-energy text styles designed for gaming content creators.
 * Covers FPS/shooter, RPG, racing, cyberpunk, battle royale, esports tournament,
 * retro gaming, pixel art, MMO fantasy, fighting game, horror game, sci-fi,
 * mobile game, speedrun, game over, victory screen, boss fight, combo counter,
 * damage numbers, and health bar text.
 *
 * Each preset uses bold display fonts combined with layered text shadows,
 * strokes, and aggressive letter spacing to produce the high-impact look
 * expected in gaming overlays, stream graphics, and gaming video edits.
 */

import type { FontFamily, FontWeight } from '@/stores/useTextOverlayStore'

export interface GamingTextPreset {
  id: string
  name: string
  /** Short description of the visual style / gaming context */
  description: string
  fontFamily: FontFamily
  fontWeight: FontWeight
  /** Base text color (hex) */
  color: string
  /** Multi-layer CSS text-shadow */
  textShadow: string
  /** Optional CSS -webkit-text-stroke value (e.g. "2px #000") */
  WebkitTextStroke?: string
  /** Letter spacing in px */
  letterSpacing: number
  /** Preview swatch colors for the preset picker UI [primary, accent] */
  previewColors: [string, string]
}

export const GAMING_TEXT_PRESETS: GamingTextPreset[] = [

  // ═══════════════════════════════════════════════════════════════
  // 1. Headshot Red -- FPS / Shooter
  // ═══════════════════════════════════════════════════════════════
  {
    id: 'gaming-headshot-red',
    name: 'Headshot Red',
    description: 'Blood-red on black -- aggressive FPS kill-feed style with heavy drop shadow',
    fontFamily: 'Archivo Black',
    fontWeight: 'bold',
    color: '#FF1A1A',
    textShadow: [
      '0 0 4px #FF0000',
      '0 0 11px #FF000080',
      '3px 3px 0 #000000',
      '4px 4px 0 #1A0000',
      '0 0 30px #FF000040',
    ].join(', '),
    WebkitTextStroke: '2px #000000',
    letterSpacing: 3,
    previewColors: ['#FF1A1A', '#000000'],
  },

  // ═══════════════════════════════════════════════════════════════
  // 2. Legendary Gold -- RPG / Fantasy Loot
  // ═══════════════════════════════════════════════════════════════
  {
    id: 'gaming-legendary-gold',
    name: 'Legendary Gold',
    description: 'Shimmering gold with warm bloom -- epic RPG legendary item reveal',
    fontFamily: 'Alfa Slab One',
    fontWeight: 'bold',
    color: '#FFD700',
    textShadow: [
      '0 0 5px #FFD700',
      '0 0 15px #FFA500',
      '0 0 30px #FF8C00',
      '0 0 60px #B8860B80',
      '2px 2px 0 #3D2B00',
      '3px 3px 0 #1A1200',
    ].join(', '),
    WebkitTextStroke: '1px #B8860B',
    letterSpacing: 4,
    previewColors: ['#FFD700', '#B8860B'],
  },

  // ═══════════════════════════════════════════════════════════════
  // 3. Turbo Blur -- Racing / Speed
  // ═══════════════════════════════════════════════════════════════
  {
    id: 'gaming-turbo-blur',
    name: 'Turbo Blur',
    description: 'White with horizontal motion streaks -- racing speed-line energy',
    fontFamily: 'Bebas Neue',
    fontWeight: 'bold',
    color: '#FFFFFF',
    textShadow: [
      '-6px 0 3px #00BFFF80',
      '-12px 0 6px #00BFFF40',
      '-20px 0 10px #00BFFF20',
      '2px 0 2px #FF4500',
      '6px 0 4px #FF450060',
      '0 0 8px #FFFFFF80',
    ].join(', '),
    WebkitTextStroke: '1px #0088CC',
    letterSpacing: 8,
    previewColors: ['#FFFFFF', '#00BFFF'],
  },

  // ═══════════════════════════════════════════════════════════════
  // 4. Neon Hacker -- Cyberpunk
  // ═══════════════════════════════════════════════════════════════
  {
    id: 'gaming-neon-hacker',
    name: 'Neon Hacker',
    description: 'Hot magenta on dark with chromatic aberration -- cyberpunk glitch aesthetic',
    fontFamily: 'Space Mono',
    fontWeight: 'bold',
    color: '#FF00FF',
    textShadow: [
      '0 0 7px #FF00FF',
      '0 0 20px #FF00FF80',
      '0 0 40px #FF00FF40',
      '-3px 0 0 #00FFFF80',
      '3px 0 0 #FFFF0060',
      '0 0 60px #FF00FF30',
    ].join(', '),
    letterSpacing: 6,
    previewColors: ['#FF00FF', '#00FFFF'],
  },

  // ═══════════════════════════════════════════════════════════════
  // 5. Drop Zone -- Battle Royale
  // ═══════════════════════════════════════════════════════════════
  {
    id: 'gaming-drop-zone',
    name: 'Drop Zone',
    description: 'Military stencil white with camo-green glow -- battle royale zone alert',
    fontFamily: 'Oswald',
    fontWeight: 'bold',
    color: '#F5F5F5',
    textShadow: [
      '0 0 5px #4CAF50',
      '0 0 15px #4CAF5080',
      '0 0 30px #2E7D3240',
      '3px 3px 0 #1B5E20',
      '4px 4px 0 #0A2E0F',
      '0 4px 8px #00000080',
    ].join(', '),
    WebkitTextStroke: '2px #1B5E20',
    letterSpacing: 6,
    previewColors: ['#F5F5F5', '#4CAF50'],
  },

  // ═══════════════════════════════════════════════════════════════
  // 6. Tournament Chrome -- Esports
  // ═══════════════════════════════════════════════════════════════
  {
    id: 'gaming-tournament-chrome',
    name: 'Tournament Chrome',
    description: 'Silver-white with blue steel glow -- pro esports tournament title card',
    fontFamily: 'Montserrat',
    fontWeight: 'black',
    color: '#E8E8E8',
    textShadow: [
      '0 0 3px #FFFFFF',
      '0 0 10px #4A90D9',
      '0 0 20px #4A90D980',
      '0 0 40px #1565C040',
      '0 3px 6px #000000A0',
      '0 6px 12px #00000060',
    ].join(', '),
    WebkitTextStroke: '1px #4A90D9',
    letterSpacing: 5,
    previewColors: ['#E8E8E8', '#4A90D9'],
  },

  // ═══════════════════════════════════════════════════════════════
  // 7. Pixel Blast -- Retro Gaming
  // ═══════════════════════════════════════════════════════════════
  {
    id: 'gaming-pixel-blast',
    name: 'Pixel Blast',
    description: 'Electric green with CRT scanline glow -- retro arcade 8-bit energy',
    fontFamily: 'Space Mono',
    fontWeight: 'bold',
    color: '#39FF14',
    textShadow: [
      '0 0 5px #39FF14',
      '0 0 10px #39FF14',
      '0 0 20px #00E60080',
      '0 0 40px #00990040',
      '2px 2px 0 #003300',
      '0 1px 0 #00FF00',
    ].join(', '),
    letterSpacing: 5,
    previewColors: ['#39FF14', '#003300'],
  },

  // ═══════════════════════════════════════════════════════════════
  // 8. 8-Bit Hero -- Pixel Art
  // ═══════════════════════════════════════════════════════════════
  {
    id: 'gaming-8bit-hero',
    name: '8-Bit Hero',
    description: 'Chunky white with thick black outline -- NES/SNES pixel art title screen',
    fontFamily: 'Bangers',
    fontWeight: 'bold',
    color: '#FFFFFF',
    textShadow: [
      '3px 3px 0 #000000',
      '-1px -1px 0 #000000',
      '1px -1px 0 #000000',
      '-1px 1px 0 #000000',
      '4px 4px 0 #222222',
      '0 0 8px #FFAA00',
    ].join(', '),
    WebkitTextStroke: '3px #000000',
    letterSpacing: 2,
    previewColors: ['#FFFFFF', '#000000'],
  },

  // ═══════════════════════════════════════════════════════════════
  // 9. Mythic Flame -- MMO Fantasy
  // ═══════════════════════════════════════════════════════════════
  {
    id: 'gaming-mythic-flame',
    name: 'Mythic Flame',
    description: 'Burning orange-yellow with ember glow -- MMO raid boss encounter text',
    fontFamily: 'Alfa Slab One',
    fontWeight: 'bold',
    color: '#FFCC00',
    textShadow: [
      '0 0 5px #FF6600',
      '0 0 15px #FF4400',
      '0 0 30px #FF220080',
      '0 0 50px #CC000040',
      '0 -3px 10px #FF880080',
      '2px 4px 0 #330000',
    ].join(', '),
    WebkitTextStroke: '1px #CC3300',
    letterSpacing: 3,
    previewColors: ['#FFCC00', '#FF4400'],
  },

  // ═══════════════════════════════════════════════════════════════
  // 10. K.O. Impact -- Fighting Game
  // ═══════════════════════════════════════════════════════════════
  {
    id: 'gaming-ko-impact',
    name: 'K.O. Impact',
    description: 'Slamming yellow with explosive red burst -- Street Fighter KO screen',
    fontFamily: 'Bangers',
    fontWeight: 'bold',
    color: '#FFE500',
    textShadow: [
      '0 0 10px #FF0000',
      '0 0 20px #FF000080',
      '0 0 40px #FF000040',
      '4px 4px 0 #CC0000',
      '-2px -2px 0 #CC0000',
      '2px -2px 0 #CC0000',
      '-2px 2px 0 #CC0000',
      '5px 5px 0 #000000',
    ].join(', '),
    WebkitTextStroke: '3px #CC0000',
    letterSpacing: 4,
    previewColors: ['#FFE500', '#CC0000'],
  },

  // ═══════════════════════════════════════════════════════════════
  // 11. Dread Fog -- Horror Game
  // ═══════════════════════════════════════════════════════════════
  {
    id: 'gaming-dread-fog',
    name: 'Dread Fog',
    description: 'Blood red fading into dark fog -- survival horror title card',
    fontFamily: 'Oswald',
    fontWeight: 'bold',
    color: '#8B0000',
    textShadow: [
      '0 0 10px #FF000060',
      '0 0 20px #8B000040',
      '0 0 40px #33000030',
      '0 0 80px #1A000020',
      '0 5px 15px #000000C0',
      '1px 1px 0 #330000',
    ].join(', '),
    WebkitTextStroke: '1px #550000',
    letterSpacing: 8,
    previewColors: ['#8B0000', '#330000'],
  },

  // ═══════════════════════════════════════════════════════════════
  // 12. Plasma Core -- Sci-Fi Game
  // ═══════════════════════════════════════════════════════════════
  {
    id: 'gaming-plasma-core',
    name: 'Plasma Core',
    description: 'Bright cyan with electric blue radiation -- sci-fi energy weapon UI',
    fontFamily: 'Bebas Neue',
    fontWeight: 'bold',
    color: '#00FFFF',
    textShadow: [
      '0 0 5px #00FFFF',
      '0 0 10px #00FFFF',
      '0 0 20px #0088FF',
      '0 0 40px #0044FF80',
      '0 0 80px #0022CC40',
      '0 2px 4px #000000A0',
    ].join(', '),
    WebkitTextStroke: '1px #0066FF',
    letterSpacing: 6,
    previewColors: ['#00FFFF', '#0044FF'],
  },

  // ═══════════════════════════════════════════════════════════════
  // 13. Candy Rush -- Mobile Game
  // ═══════════════════════════════════════════════════════════════
  {
    id: 'gaming-candy-rush',
    name: 'Candy Rush',
    description: 'Bubbly pink-purple with playful glow -- mobile puzzle game UI text',
    fontFamily: 'Righteous',
    fontWeight: 'bold',
    color: '#FF69B4',
    textShadow: [
      '0 0 5px #FF69B4',
      '0 0 15px #FF1493',
      '0 0 30px #FF149380',
      '2px 2px 0 #8B008B',
      '3px 3px 0 #4A004A',
      '0 0 40px #FF69B440',
    ].join(', '),
    WebkitTextStroke: '2px #8B008B',
    letterSpacing: 2,
    previewColors: ['#FF69B4', '#8B008B'],
  },

  // ═══════════════════════════════════════════════════════════════
  // 14. Any% Glitch -- Speedrun
  // ═══════════════════════════════════════════════════════════════
  {
    id: 'gaming-speedrun-glitch',
    name: 'Any% Glitch',
    description: 'Glitched green with RGB shift artifacts -- speedrun timer aesthetic',
    fontFamily: 'Space Mono',
    fontWeight: 'bold',
    color: '#00FF88',
    textShadow: [
      '-2px 0 0 #FF0000',
      '2px 0 0 #0000FF',
      '0 0 5px #00FF88',
      '0 0 10px #00FF8880',
      '-4px 1px 0 #FF000040',
      '4px -1px 0 #0000FF40',
    ].join(', '),
    letterSpacing: 4,
    previewColors: ['#00FF88', '#FF0000'],
  },

  // ═══════════════════════════════════════════════════════════════
  // 15. Wasted -- Game Over
  // ═══════════════════════════════════════════════════════════════
  {
    id: 'gaming-wasted',
    name: 'Wasted',
    description: 'Desaturated gray-red with heavy vignette shadow -- game over death screen',
    fontFamily: 'Archivo Black',
    fontWeight: 'bold',
    color: '#CC2222',
    textShadow: [
      '0 0 10px #00000080',
      '0 0 30px #00000060',
      '0 0 60px #00000040',
      '4px 4px 0 #000000',
      '0 0 5px #FF000030',
      '0 8px 20px #000000C0',
    ].join(', '),
    WebkitTextStroke: '2px #000000',
    letterSpacing: 12,
    previewColors: ['#CC2222', '#000000'],
  },

  // ═══════════════════════════════════════════════════════════════
  // 16. Champion Gold -- Victory / Win Screen
  // ═══════════════════════════════════════════════════════════════
  {
    id: 'gaming-champion-gold',
    name: 'Champion Gold',
    description: 'Radiant gold with white sparkle bloom -- victory royale celebration',
    fontFamily: 'Montserrat',
    fontWeight: 'black',
    color: '#FFD700',
    textShadow: [
      '0 0 5px #FFFFFF',
      '0 0 10px #FFD700',
      '0 0 20px #FFD700',
      '0 0 40px #FFA500',
      '0 0 60px #FFA50080',
      '0 0 80px #FF880040',
      '2px 2px 0 #8B6914',
      '3px 3px 0 #4A3500',
    ].join(', '),
    WebkitTextStroke: '1px #B8860B',
    letterSpacing: 6,
    previewColors: ['#FFD700', '#FFA500'],
  },

  // ═══════════════════════════════════════════════════════════════
  // 17. Rage Mode -- Boss Fight
  // ═══════════════════════════════════════════════════════════════
  {
    id: 'gaming-rage-mode',
    name: 'Rage Mode',
    description: 'Pulsating red-orange with volcanic intensity -- boss enrage phase warning',
    fontFamily: 'Bebas Neue',
    fontWeight: 'bold',
    color: '#FF4400',
    textShadow: [
      '0 0 8px #FF0000',
      '0 0 16px #FF0000',
      '0 0 32px #FF440080',
      '0 0 64px #FF000060',
      '0 -4px 12px #FFAA0080',
      '3px 3px 0 #330000',
      '0 0 100px #FF000030',
    ].join(', '),
    WebkitTextStroke: '2px #8B0000',
    letterSpacing: 5,
    previewColors: ['#FF4400', '#8B0000'],
  },

  // ═══════════════════════════════════════════════════════════════
  // 18. Ultra Combo -- Combo Counter
  // ═══════════════════════════════════════════════════════════════
  {
    id: 'gaming-ultra-combo',
    name: 'Ultra Combo',
    description: 'Electric yellow with impact rings -- fighting game hit counter',
    fontFamily: 'Bangers',
    fontWeight: 'bold',
    color: '#FFFF00',
    textShadow: [
      '0 0 5px #FFFF00',
      '0 0 15px #FF880080',
      '0 0 30px #FF440060',
      '3px 3px 0 #FF6600',
      '-2px -2px 0 #FF6600',
      '2px -2px 0 #FF6600',
      '-2px 2px 0 #FF6600',
      '4px 4px 0 #000000',
    ].join(', '),
    WebkitTextStroke: '2px #FF6600',
    letterSpacing: 2,
    previewColors: ['#FFFF00', '#FF6600'],
  },

  // ═══════════════════════════════════════════════════════════════
  // 19. Critical Hit -- Damage Numbers
  // ═══════════════════════════════════════════════════════════════
  {
    id: 'gaming-critical-hit',
    name: 'Critical Hit',
    description: 'Bold red-orange with explosion glow -- RPG floating damage numbers',
    fontFamily: 'Archivo Black',
    fontWeight: 'bold',
    color: '#FF3300',
    textShadow: [
      '0 0 6px #FFCC00',
      '0 0 12px #FF6600',
      '0 0 24px #FF330080',
      '0 0 48px #FF000040',
      '2px 2px 0 #000000',
      '3px 3px 0 #1A0000',
      '-1px -1px 0 #FFAA00',
    ].join(', '),
    WebkitTextStroke: '2px #000000',
    letterSpacing: 1,
    previewColors: ['#FF3300', '#FFCC00'],
  },

  // ═══════════════════════════════════════════════════════════════
  // 20. Shield Bar -- Health Bar Text
  // ═══════════════════════════════════════════════════════════════
  {
    id: 'gaming-shield-bar',
    name: 'Shield Bar',
    description: 'Bright green with protective glow -- HUD health/shield indicator text',
    fontFamily: 'Oswald',
    fontWeight: 'bold',
    color: '#00FF44',
    textShadow: [
      '0 0 3px #00FF44',
      '0 0 8px #00FF4480',
      '0 0 16px #00CC3660',
      '0 0 32px #00992840',
      '1px 1px 0 #003311',
      '0 2px 6px #000000A0',
    ].join(', '),
    WebkitTextStroke: '1px #006622',
    letterSpacing: 4,
    previewColors: ['#00FF44', '#006622'],
  },
]

// ── Helper: Apply a gaming preset to CSS style object ────────────

export function applyGamingTextStyle(presetId: string): React.CSSProperties | undefined {
  const preset = GAMING_TEXT_PRESETS.find(p => p.id === presetId)
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

export function getGamingTextPreset(presetId: string): GamingTextPreset | undefined {
  return GAMING_TEXT_PRESETS.find(p => p.id === presetId)
}
