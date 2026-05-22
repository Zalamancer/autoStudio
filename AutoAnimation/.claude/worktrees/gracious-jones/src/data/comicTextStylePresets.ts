/**
 * Comic / Fun / Playful Text Style Presets
 *
 * 20 bold, colorful, and energetic text styles designed for short-form video.
 * Think: comic book POW!, manga impact, kawaii/cute, graffiti tags, bubble
 * letters, pop art, children's book, sticker look, candy/sweet, superhero, etc.
 *
 * Each preset defines a complete visual look: font, weight, color, layered
 * text-shadow, optional stroke, and letter spacing.  Apply these as style
 * overrides on any TextOverlay to instantly transform it.
 */

import type { FontFamily, FontWeight } from '@/stores/useTextOverlayStore'

export interface ComicTextStylePreset {
  id: string
  name: string
  /** Short description of the visual effect */
  description: string
  fontFamily: FontFamily
  fontWeight: FontWeight
  /** Primary text color (hex) */
  color: string
  /** Multi-layer CSS text-shadow for the effect */
  textShadow: string
  /** Optional CSS -webkit-text-stroke value (e.g. '3px #000000') */
  WebkitTextStroke?: string
  /** Letter spacing in px */
  letterSpacing: number
  /** Preview swatch colors for the preset picker UI [primary, accent] */
  previewColors: [string, string]
}

export const COMIC_TEXT_STYLE_PRESETS: ComicTextStylePreset[] = [

  // ═══════════════════════════════════════════════════════════════════
  // 1. Comic Book POW!
  // Bold yellow-on-black starburst look from classic comic panels
  // ═══════════════════════════════════════════════════════════════════
  {
    id: 'comic-pow',
    name: 'Comic Book POW!',
    description: 'Classic yellow comic book letters with heavy black outline and red burst shadow',
    fontFamily: 'Bangers',
    fontWeight: 'bold',
    color: '#FFD700',
    textShadow: [
      '4px 4px 0 #000000',
      '-2px -2px 0 #000000',
      '2px -2px 0 #000000',
      '-2px 2px 0 #000000',
      '0 0 0 #000000',
      '6px 6px 0 #CC0000',
      '8px 8px 0 rgba(0,0,0,0.3)',
    ].join(', '),
    WebkitTextStroke: '3px #000000',
    letterSpacing: 2,
    previewColors: ['#FFD700', '#CC0000'],
  },

  // ═══════════════════════════════════════════════════════════════════
  // 2. Manga Impact
  // Japanese manga bold white with thick black outline, speed-line feel
  // ═══════════════════════════════════════════════════════════════════
  {
    id: 'comic-manga-impact',
    name: 'Manga Impact',
    description: 'White manga text with extra-thick black outline and dramatic offset shadow',
    fontFamily: 'Archivo Black',
    fontWeight: 'black',
    color: '#FFFFFF',
    textShadow: [
      '3px 3px 0 #000000',
      '-3px -3px 0 #000000',
      '3px -3px 0 #000000',
      '-3px 3px 0 #000000',
      '0 3px 0 #000000',
      '3px 0 0 #000000',
      '0 -3px 0 #000000',
      '-3px 0 0 #000000',
      '5px 5px 0 rgba(0,0,0,0.4)',
    ].join(', '),
    WebkitTextStroke: '4px #000000',
    letterSpacing: 1,
    previewColors: ['#FFFFFF', '#000000'],
  },

  // ═══════════════════════════════════════════════════════════════════
  // 3. Kawaii Pink
  // Cute, rounded pink letters with soft pastel shadow and white outline
  // ═══════════════════════════════════════════════════════════════════
  {
    id: 'comic-kawaii-pink',
    name: 'Kawaii Pink',
    description: 'Cute pastel pink text with soft white outline and dreamy lavender shadow',
    fontFamily: 'Fredoka',
    fontWeight: 'bold',
    color: '#FF69B4',
    textShadow: [
      '0 0 4px #FFFFFF',
      '2px 2px 0 #FFB6C1',
      '3px 3px 0 #DDA0DD',
      '4px 4px 0 #BA55D3',
      '0 0 15px rgba(255,105,180,0.4)',
    ].join(', '),
    WebkitTextStroke: '2px #FFFFFF',
    letterSpacing: 1.5,
    previewColors: ['#FF69B4', '#DDA0DD'],
  },

  // ═══════════════════════════════════════════════════════════════════
  // 4. Graffiti Tag
  // Urban spray-paint style with neon green and drip shadow
  // ═══════════════════════════════════════════════════════════════════
  {
    id: 'comic-graffiti-tag',
    name: 'Graffiti Tag',
    description: 'Neon green spray-paint text with gritty black outline and urban glow',
    fontFamily: 'Permanent Marker',
    fontWeight: 'bold',
    color: '#39FF14',
    textShadow: [
      '2px 2px 0 #000000',
      '-1px -1px 0 #000000',
      '1px -1px 0 #000000',
      '-1px 1px 0 #000000',
      '0 0 10px #39FF14',
      '0 0 20px rgba(57,255,20,0.5)',
      '4px 4px 2px rgba(0,0,0,0.6)',
    ].join(', '),
    WebkitTextStroke: '2px #000000',
    letterSpacing: 1,
    previewColors: ['#39FF14', '#000000'],
  },

  // ═══════════════════════════════════════════════════════════════════
  // 5. Bubble Letters
  // Puffy, rounded bubblegum look with glossy highlights
  // ═══════════════════════════════════════════════════════════════════
  {
    id: 'comic-bubble-letters',
    name: 'Bubble Letters',
    description: 'Bubblegum blue bubble text with white highlight and round purple depth',
    fontFamily: 'Fredoka',
    fontWeight: 'bold',
    color: '#4FC3F7',
    textShadow: [
      '0 -1px 0 rgba(255,255,255,0.6)',
      '2px 2px 0 #0288D1',
      '3px 3px 0 #01579B',
      '4px 4px 0 #003F6B',
      '5px 5px 6px rgba(0,0,0,0.3)',
      '0 0 10px rgba(79,195,247,0.3)',
    ].join(', '),
    WebkitTextStroke: '2px #0277BD',
    letterSpacing: 2,
    previewColors: ['#4FC3F7', '#01579B'],
  },

  // ═══════════════════════════════════════════════════════════════════
  // 6. Pop Art Red
  // Warhol-inspired bold red with Ben-Day dot halftone shadow effect
  // ═══════════════════════════════════════════════════════════════════
  {
    id: 'comic-pop-art-red',
    name: 'Pop Art Red',
    description: 'Bold red pop art letters with thick black outline and layered color offset',
    fontFamily: 'Bangers',
    fontWeight: 'bold',
    color: '#FF1744',
    textShadow: [
      '3px 3px 0 #000000',
      '-2px -2px 0 #000000',
      '2px -2px 0 #000000',
      '-2px 2px 0 #000000',
      '5px 5px 0 #FFEB3B',
      '7px 7px 0 rgba(0,0,0,0.25)',
    ].join(', '),
    WebkitTextStroke: '3px #000000',
    letterSpacing: 3,
    previewColors: ['#FF1744', '#FFEB3B'],
  },

  // ═══════════════════════════════════════════════════════════════════
  // 7. Storybook Magic
  // Whimsical children's book style with warm gold and cozy shadow
  // ═══════════════════════════════════════════════════════════════════
  {
    id: 'comic-storybook-magic',
    name: 'Storybook Magic',
    description: 'Warm purple storybook text with golden glow and soft dreamy shadow',
    fontFamily: 'Pacifico',
    fontWeight: 'bold',
    color: '#7B1FA2',
    textShadow: [
      '0 0 8px rgba(255,215,0,0.6)',
      '0 0 16px rgba(255,215,0,0.3)',
      '2px 2px 0 #4A148C',
      '3px 3px 0 #311B92',
      '4px 4px 6px rgba(0,0,0,0.3)',
    ].join(', '),
    WebkitTextStroke: '1px #4A148C',
    letterSpacing: 1,
    previewColors: ['#7B1FA2', '#FFD700'],
  },

  // ═══════════════════════════════════════════════════════════════════
  // 8. Sticker Peel
  // Die-cut sticker look with thick white border and drop shadow
  // ═══════════════════════════════════════════════════════════════════
  {
    id: 'comic-sticker-peel',
    name: 'Sticker Peel',
    description: 'Bright orange sticker text with chunky white border and lifted shadow',
    fontFamily: 'Fredoka',
    fontWeight: 'bold',
    color: '#FF6D00',
    textShadow: [
      '0 0 0 #FFFFFF',
      '1px 1px 0 #FFFFFF',
      '-1px -1px 0 #FFFFFF',
      '1px -1px 0 #FFFFFF',
      '-1px 1px 0 #FFFFFF',
      '2px 2px 0 #FFFFFF',
      '-2px -2px 0 #FFFFFF',
      '2px -2px 0 #FFFFFF',
      '-2px 2px 0 #FFFFFF',
      '5px 5px 8px rgba(0,0,0,0.35)',
    ].join(', '),
    WebkitTextStroke: '3px #FFFFFF',
    letterSpacing: 1,
    previewColors: ['#FF6D00', '#FFFFFF'],
  },

  // ═══════════════════════════════════════════════════════════════════
  // 9. Candy Crush
  // Sweet candy-stripe style with rainbow shadow layers
  // ═══════════════════════════════════════════════════════════════════
  {
    id: 'comic-candy-crush',
    name: 'Candy Crush',
    description: 'Sweet magenta candy text with rainbow-layered depth shadow',
    fontFamily: 'Fredoka',
    fontWeight: 'bold',
    color: '#FF4081',
    textShadow: [
      '1px 1px 0 #E91E63',
      '2px 2px 0 #FF5722',
      '3px 3px 0 #FF9800',
      '4px 4px 0 #FFC107',
      '5px 5px 0 #4CAF50',
      '6px 6px 0 #2196F3',
      '7px 7px 0 #9C27B0',
      '8px 8px 8px rgba(0,0,0,0.25)',
    ].join(', '),
    WebkitTextStroke: '2px #AD1457',
    letterSpacing: 2,
    previewColors: ['#FF4081', '#FFC107'],
  },

  // ═══════════════════════════════════════════════════════════════════
  // 10. Superhero Bold
  // Classic comic superhero title with steel blue and heroic red shadow
  // ═══════════════════════════════════════════════════════════════════
  {
    id: 'comic-superhero-bold',
    name: 'Superhero Bold',
    description: 'Heroic steel blue text with red accent shadow and black power outline',
    fontFamily: 'Alfa Slab One',
    fontWeight: 'bold',
    color: '#1565C0',
    textShadow: [
      '2px 2px 0 #000000',
      '-1px -1px 0 #000000',
      '1px -1px 0 #000000',
      '-1px 1px 0 #000000',
      '4px 4px 0 #D32F2F',
      '6px 6px 0 #B71C1C',
      '8px 8px 10px rgba(0,0,0,0.4)',
    ].join(', '),
    WebkitTextStroke: '2px #000000',
    letterSpacing: 3,
    previewColors: ['#1565C0', '#D32F2F'],
  },

  // ═══════════════════════════════════════════════════════════════════
  // 11. Retro Arcade
  // Pixelated arcade game title feel with electric yellow and magenta
  // ═══════════════════════════════════════════════════════════════════
  {
    id: 'comic-retro-arcade',
    name: 'Retro Arcade',
    description: 'Electric yellow arcade text with hot pink glow and pixel-grid shadow',
    fontFamily: 'Bangers',
    fontWeight: 'bold',
    color: '#FFFF00',
    textShadow: [
      '2px 2px 0 #FF00FF',
      '4px 4px 0 #CC00CC',
      '0 0 10px #FFFF00',
      '0 0 20px #FF00FF',
      '0 0 40px rgba(255,0,255,0.3)',
      '6px 6px 2px rgba(0,0,0,0.5)',
    ].join(', '),
    WebkitTextStroke: '2px #FF00FF',
    letterSpacing: 4,
    previewColors: ['#FFFF00', '#FF00FF'],
  },

  // ═══════════════════════════════════════════════════════════════════
  // 12. Toy Box
  // Playful children's toy style with primary colors and round shapes
  // ═══════════════════════════════════════════════════════════════════
  {
    id: 'comic-toy-box',
    name: 'Toy Box',
    description: 'Bright red toy-block text with yellow highlight and chunky blue shadow',
    fontFamily: 'Fredoka',
    fontWeight: 'black',
    color: '#F44336',
    textShadow: [
      '0 -2px 0 rgba(255,255,255,0.4)',
      '2px 2px 0 #E53935',
      '3px 3px 0 #1976D2',
      '4px 4px 0 #1565C0',
      '5px 5px 0 #0D47A1',
      '6px 6px 8px rgba(0,0,0,0.3)',
    ].join(', '),
    WebkitTextStroke: '2px #B71C1C',
    letterSpacing: 2,
    previewColors: ['#F44336', '#1976D2'],
  },

  // ═══════════════════════════════════════════════════════════════════
  // 13. Psychedelic Swirl
  // 60s/70s psychedelic poster style with trippy color layers
  // ═══════════════════════════════════════════════════════════════════
  {
    id: 'comic-psychedelic',
    name: 'Psychedelic Swirl',
    description: 'Trippy lime green text with orange and purple layered depth, retro poster vibes',
    fontFamily: 'Righteous',
    fontWeight: 'bold',
    color: '#76FF03',
    textShadow: [
      '2px 2px 0 #FF6D00',
      '4px 4px 0 #E91E63',
      '6px 6px 0 #9C27B0',
      '8px 8px 0 #673AB7',
      '0 0 15px rgba(118,255,3,0.4)',
      '10px 10px 10px rgba(0,0,0,0.3)',
    ].join(', '),
    WebkitTextStroke: '2px #33691E',
    letterSpacing: 3,
    previewColors: ['#76FF03', '#9C27B0'],
  },

  // ═══════════════════════════════════════════════════════════════════
  // 14. Sketch Doodle
  // Hand-drawn doodle style with messy offset outlines
  // ═══════════════════════════════════════════════════════════════════
  {
    id: 'comic-sketch-doodle',
    name: 'Sketch Doodle',
    description: 'Hand-drawn feel with dark charcoal text and imperfect multi-offset outlines',
    fontFamily: 'Caveat',
    fontWeight: 'bold',
    color: '#37474F',
    textShadow: [
      '1px 0 0 #263238',
      '0 1px 0 #263238',
      '-1px 0 0 #546E7A',
      '0 -1px 0 #546E7A',
      '2px 2px 0 #78909C',
      '3px 3px 0 #B0BEC5',
      '4px 4px 4px rgba(0,0,0,0.15)',
    ].join(', '),
    WebkitTextStroke: '1px #263238',
    letterSpacing: 1,
    previewColors: ['#37474F', '#78909C'],
  },

  // ═══════════════════════════════════════════════════════════════════
  // 15. Neon Party
  // Hot neon pink party text with electric cyan glow
  // ═══════════════════════════════════════════════════════════════════
  {
    id: 'comic-neon-party',
    name: 'Neon Party',
    description: 'Hot pink neon party text with cyan underglow and electric bloom',
    fontFamily: 'Bangers',
    fontWeight: 'bold',
    color: '#FF1493',
    textShadow: [
      '0 0 7px #FF1493',
      '0 0 10px #FF1493',
      '0 0 21px #FF1493',
      '0 0 42px #00E5FF',
      '0 0 82px #00E5FF',
      '0 0 92px rgba(0,229,255,0.3)',
      '3px 3px 0 rgba(0,0,0,0.4)',
    ].join(', '),
    WebkitTextStroke: '1px #FF1493',
    letterSpacing: 3,
    previewColors: ['#FF1493', '#00E5FF'],
  },

  // ═══════════════════════════════════════════════════════════════════
  // 16. Ice Cream Scoop
  // Soft mint ice cream tones with waffle cone brown shadow
  // ═══════════════════════════════════════════════════════════════════
  {
    id: 'comic-ice-cream',
    name: 'Ice Cream Scoop',
    description: 'Soft mint green ice cream text with creamy pink layers and waffle shadow',
    fontFamily: 'Comfortaa',
    fontWeight: 'bold',
    color: '#80CBC4',
    textShadow: [
      '0 -1px 0 rgba(255,255,255,0.5)',
      '1px 1px 0 #4DB6AC',
      '2px 2px 0 #F48FB1',
      '3px 3px 0 #CE93D8',
      '4px 4px 0 #8D6E63',
      '5px 5px 0 #6D4C41',
      '6px 6px 8px rgba(0,0,0,0.2)',
    ].join(', '),
    WebkitTextStroke: '2px #00897B',
    letterSpacing: 1.5,
    previewColors: ['#80CBC4', '#F48FB1'],
  },

  // ═══════════════════════════════════════════════════════════════════
  // 17. Explosion Blast
  // Fiery orange explosion text with radial glow and debris shadow
  // ═══════════════════════════════════════════════════════════════════
  {
    id: 'comic-explosion',
    name: 'Explosion Blast',
    description: 'Fiery orange-red explosion text with radiant yellow glow and smoke shadow',
    fontFamily: 'Bangers',
    fontWeight: 'black',
    color: '#FF6F00',
    textShadow: [
      '0 0 10px #FFAB00',
      '0 0 20px #FF6F00',
      '0 0 40px #FF3D00',
      '0 0 60px rgba(255,61,0,0.4)',
      '3px 3px 0 #BF360C',
      '-2px -2px 0 #BF360C',
      '2px -2px 0 #BF360C',
      '-2px 2px 0 #BF360C',
      '6px 6px 4px rgba(0,0,0,0.5)',
    ].join(', '),
    WebkitTextStroke: '3px #BF360C',
    letterSpacing: 2,
    previewColors: ['#FF6F00', '#FF3D00'],
  },

  // ═══════════════════════════════════════════════════════════════════
  // 18. Groovy Disco
  // 70s disco funk with warm orange, pink offset, and sparkle
  // ═══════════════════════════════════════════════════════════════════
  {
    id: 'comic-groovy-disco',
    name: 'Groovy Disco',
    description: 'Funky warm orange disco text with hot pink offset and golden sparkle glow',
    fontFamily: 'Righteous',
    fontWeight: 'bold',
    color: '#FF8F00',
    textShadow: [
      '2px 2px 0 #F50057',
      '4px 4px 0 #D500F9',
      '6px 6px 0 #651FFF',
      '0 0 15px rgba(255,143,0,0.5)',
      '0 0 30px rgba(213,0,249,0.3)',
      '8px 8px 10px rgba(0,0,0,0.3)',
    ].join(', '),
    WebkitTextStroke: '1px #E65100',
    letterSpacing: 2,
    previewColors: ['#FF8F00', '#D500F9'],
  },

  // ═══════════════════════════════════════════════════════════════════
  // 19. Chalk Scribble
  // Chalkboard classroom feel with dusty white and colored chalk layers
  // ═══════════════════════════════════════════════════════════════════
  {
    id: 'comic-chalk-scribble',
    name: 'Chalk Scribble',
    description: 'Dusty white chalk text with soft colored chalk layers and board texture feel',
    fontFamily: 'Caveat',
    fontWeight: 'bold',
    color: '#ECEFF1',
    textShadow: [
      '1px 1px 0 rgba(255,255,255,0.3)',
      '2px 2px 0 #FFAB91',
      '3px 3px 0 #81D4FA',
      '4px 4px 0 #A5D6A7',
      '0 0 8px rgba(255,255,255,0.2)',
      '5px 5px 4px rgba(0,0,0,0.2)',
    ].join(', '),
    WebkitTextStroke: '1px rgba(255,255,255,0.4)',
    letterSpacing: 1.5,
    previewColors: ['#ECEFF1', '#FFAB91'],
  },

  // ═══════════════════════════════════════════════════════════════════
  // 20. Pixel Power
  // Retro pixel/8-bit game style with electric blue and scan-line glow
  // ═══════════════════════════════════════════════════════════════════
  {
    id: 'comic-pixel-power',
    name: 'Pixel Power',
    description: 'Electric cyan pixel-game text with blue depth layers and CRT scan-line glow',
    fontFamily: 'Bebas Neue',
    fontWeight: 'bold',
    color: '#00E5FF',
    textShadow: [
      '2px 2px 0 #0091EA',
      '4px 4px 0 #01579B',
      '6px 6px 0 #002F6C',
      '0 0 8px #00E5FF',
      '0 0 16px rgba(0,229,255,0.4)',
      '0 2px 0 rgba(0,0,0,0.5)',
      '8px 8px 6px rgba(0,0,0,0.4)',
    ].join(', '),
    WebkitTextStroke: '2px #006064',
    letterSpacing: 4,
    previewColors: ['#00E5FF', '#0091EA'],
  },
]
