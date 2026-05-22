/**
 * 3D / Depth Text Style Presets
 *
 * 20 dramatic text style presets using layered CSS text-shadow to simulate
 * 3D block letters, long shadows, isometric depth, embossed/debossed looks,
 * chrome/metallic depth, retro arcade, comic book, and more.
 *
 * Each preset is designed to be applied to a TextOverlay's inline styles.
 * The `textShadow` property stacks multiple offset layers to build depth.
 * `WebkitTextStroke` is used where an outline enhances the 3D effect.
 */

export interface Text3DStylePreset {
  id: string
  name: string
  /** Short description of the visual effect */
  description: string
  fontFamily: string
  fontWeight: 'bold' | 'black'
  /** Primary text color (hex) */
  color: string
  /** Layered text-shadow creating the 3D / depth illusion */
  textShadow: string
  /** Optional stroke outline (e.g. "2px #000000") */
  WebkitTextStroke?: string
  /** Preview category for UI grouping */
  category: '3d-block' | 'long-shadow' | 'retro' | 'metallic' | 'comic' | 'emboss' | 'isometric' | 'neon-depth'
}

export const TEXT_3D_STYLE_PRESETS: Text3DStylePreset[] = [
  // ═══════════════════════════════════════════════════════════════════
  // 1. Classic Red Block — Chunky 3D block letters like vintage signage
  // ═══════════════════════════════════════════════════════════════════
  {
    id: '3d-classic-red-block',
    name: 'Classic Red Block',
    description: 'Chunky 3D block letters with deep red-to-maroon depth, vintage sign style',
    fontFamily: 'Bebas Neue',
    fontWeight: 'bold',
    color: '#FF3333',
    textShadow: [
      '1px 1px 0 #CC0000',
      '2px 2px 0 #BB0000',
      '3px 3px 0 #AA0000',
      '4px 4px 0 #990000',
      '5px 5px 0 #880000',
      '6px 6px 0 #770000',
      '7px 7px 0 #660000',
      '8px 8px 0 #550000',
      '9px 9px 15px rgba(0,0,0,0.4)',
    ].join(', '),
    WebkitTextStroke: '1px #990000',
    category: '3d-block',
  },

  // ═══════════════════════════════════════════════════════════════════
  // 2. Sunset Long Shadow — Diagonal shadow stretching far bottom-right
  // ═══════════════════════════════════════════════════════════════════
  {
    id: '3d-sunset-long-shadow',
    name: 'Sunset Long Shadow',
    description: 'Orange text with a long diagonal shadow fading into warm darkness',
    fontFamily: 'Montserrat',
    fontWeight: 'black',
    color: '#FF8C00',
    textShadow: [
      '1px 1px 0 #E07000',
      '2px 2px 0 #D06500',
      '3px 3px 0 #C05A00',
      '4px 4px 0 #B05000',
      '5px 5px 0 #A04500',
      '6px 6px 0 #903B00',
      '7px 7px 0 #803000',
      '8px 8px 0 #702600',
      '9px 9px 0 #601C00',
      '10px 10px 0 #501200',
      '11px 11px 0 #400800',
      '12px 12px 0 #300000',
      '13px 13px 20px rgba(0,0,0,0.35)',
    ].join(', '),
    category: 'long-shadow',
  },

  // ═══════════════════════════════════════════════════════════════════
  // 3. Neon Depth — Electric cyan with glowing 3D extrusion
  // ═══════════════════════════════════════════════════════════════════
  {
    id: '3d-neon-depth',
    name: 'Neon Depth',
    description: 'Electric cyan text with glowing neon extrusion layers and halo bloom',
    fontFamily: 'Righteous',
    fontWeight: 'bold',
    color: '#00FFFF',
    textShadow: [
      '0 0 5px #00FFFF',
      '0 0 10px #00FFFF',
      '1px 1px 0 #00CCCC',
      '2px 2px 0 #00AAAA',
      '3px 3px 0 #008888',
      '4px 4px 0 #006666',
      '5px 5px 0 #004444',
      '6px 6px 0 #003333',
      '0 0 30px rgba(0,255,255,0.4)',
      '0 0 60px rgba(0,255,255,0.2)',
    ].join(', '),
    WebkitTextStroke: '1px #00DDDD',
    category: 'neon-depth',
  },

  // ═══════════════════════════════════════════════════════════════════
  // 4. Chrome Titan — Metallic silver with multi-tone depth layers
  // ═══════════════════════════════════════════════════════════════════
  {
    id: '3d-chrome-titan',
    name: 'Chrome Titan',
    description: 'Polished chrome text with silver-to-gunmetal depth and metallic shine',
    fontFamily: 'Archivo Black',
    fontWeight: 'bold',
    color: '#E8E8E8',
    textShadow: [
      '0 1px 0 #CCCCCC',
      '0 2px 0 #BBBBBB',
      '0 3px 0 #AAAAAA',
      '0 4px 0 #999999',
      '0 5px 0 #888888',
      '0 6px 0 #777777',
      '1px 7px 0 #666666',
      '1px 8px 0 #555555',
      '1px 9px 10px rgba(0,0,0,0.5)',
      '1px 10px 20px rgba(0,0,0,0.3)',
    ].join(', '),
    WebkitTextStroke: '1px #AAAAAA',
    category: 'metallic',
  },

  // ═══════════════════════════════════════════════════════════════════
  // 5. Comic Book Pow — Bold yellow with black 3D extrusion, comic style
  // ═══════════════════════════════════════════════════════════════════
  {
    id: '3d-comic-book-pow',
    name: 'Comic Book Pow',
    description: 'Bright yellow comic book text with thick black extrusion and outline',
    fontFamily: 'Bangers',
    fontWeight: 'bold',
    color: '#FFE600',
    textShadow: [
      '-1px -1px 0 #000000',
      '1px -1px 0 #000000',
      '-1px 1px 0 #000000',
      '2px 2px 0 #000000',
      '3px 3px 0 #000000',
      '4px 4px 0 #000000',
      '5px 5px 0 #000000',
      '6px 6px 0 #000000',
      '7px 7px 0 #1A1A1A',
      '8px 8px 0 #333333',
    ].join(', '),
    WebkitTextStroke: '3px #000000',
    category: 'comic',
  },

  // ═══════════════════════════════════════════════════════════════════
  // 6. Retro Arcade — Pixel-perfect purple with magenta depth layers
  // ═══════════════════════════════════════════════════════════════════
  {
    id: '3d-retro-arcade',
    name: 'Retro Arcade',
    description: 'Bright purple with hot pink/magenta depth layers, 80s arcade cabinet vibe',
    fontFamily: 'Fredoka',
    fontWeight: 'bold',
    color: '#BF40FF',
    textShadow: [
      '1px 1px 0 #A020D0',
      '2px 2px 0 #9010C0',
      '3px 3px 0 #8000B0',
      '4px 4px 0 #7000A0',
      '5px 5px 0 #600090',
      '6px 6px 0 #500080',
      '7px 7px 0 #400070',
      '0 0 15px rgba(191,64,255,0.5)',
      '0 0 40px rgba(191,64,255,0.25)',
    ].join(', '),
    category: 'retro',
  },

  // ═══════════════════════════════════════════════════════════════════
  // 7. Embossed Stone — Chiseled text that appears carved into stone
  // ═══════════════════════════════════════════════════════════════════
  {
    id: '3d-embossed-stone',
    name: 'Embossed Stone',
    description: 'Stone-grey text with highlight above and shadow below, chiseled into rock',
    fontFamily: 'Alfa Slab One',
    fontWeight: 'bold',
    color: '#8B8B8B',
    textShadow: [
      '0 -1px 0 #AAAAAA',
      '0 -2px 0 #B5B5B5',
      '0 1px 0 #666666',
      '0 2px 0 #555555',
      '0 3px 0 #444444',
      '0 4px 0 #333333',
      '0 5px 8px rgba(0,0,0,0.4)',
      '0 5px 15px rgba(0,0,0,0.2)',
    ].join(', '),
    WebkitTextStroke: '1px #777777',
    category: 'emboss',
  },

  // ═══════════════════════════════════════════════════════════════════
  // 8. Isometric Blueprint — Crisp white text with blue isometric depth
  // ═══════════════════════════════════════════════════════════════════
  {
    id: '3d-isometric-blueprint',
    name: 'Isometric Blueprint',
    description: 'Clean white text with blue isometric-angle extrusion on dark background',
    fontFamily: 'Oswald',
    fontWeight: 'bold',
    color: '#FFFFFF',
    textShadow: [
      '1px 1px 0 #4A90D9',
      '2px 2px 0 #4285CC',
      '3px 3px 0 #3A7ABF',
      '4px 4px 0 #326FB2',
      '5px 5px 0 #2A64A5',
      '6px 6px 0 #225998',
      '7px 7px 0 #1A4E8B',
      '8px 8px 0 #12437E',
      '9px 9px 0 #0A3871',
      '10px 10px 20px rgba(0,0,0,0.4)',
    ].join(', '),
    category: 'isometric',
  },

  // ═══════════════════════════════════════════════════════════════════
  // 9. Gold Ingot — Luxurious gold with deepening bronze 3D layers
  // ═══════════════════════════════════════════════════════════════════
  {
    id: '3d-gold-ingot',
    name: 'Gold Ingot',
    description: 'Rich gold text with bronze-to-dark-amber 3D depth, luxury premium look',
    fontFamily: 'Abril Fatface',
    fontWeight: 'bold',
    color: '#FFD700',
    textShadow: [
      '1px 1px 0 #E6C200',
      '2px 2px 0 #CCAD00',
      '3px 3px 0 #B39800',
      '4px 4px 0 #998300',
      '5px 5px 0 #806E00',
      '6px 6px 0 #665900',
      '7px 7px 0 #4D4400',
      '0 0 10px rgba(255,215,0,0.3)',
      '8px 8px 15px rgba(0,0,0,0.5)',
    ].join(', '),
    WebkitTextStroke: '1px #B8960F',
    category: 'metallic',
  },

  // ═══════════════════════════════════════════════════════════════════
  // 10. Vaporwave Stack — Pink-to-teal gradient depth with retro feel
  // ═══════════════════════════════════════════════════════════════════
  {
    id: '3d-vaporwave-stack',
    name: 'Vaporwave Stack',
    description: 'Hot pink face with teal-shifting 3D depth layers, aesthetic vaporwave',
    fontFamily: 'Righteous',
    fontWeight: 'bold',
    color: '#FF6EC7',
    textShadow: [
      '1px 1px 0 #E060B0',
      '2px 2px 0 #C050A0',
      '3px 3px 0 #A04090',
      '4px 4px 0 #805080',
      '5px 5px 0 #606070',
      '6px 6px 0 #407060',
      '7px 7px 0 #208050',
      '8px 8px 0 #009070',
      '0 0 20px rgba(255,110,199,0.35)',
      '9px 9px 15px rgba(0,0,0,0.4)',
    ].join(', '),
    category: 'retro',
  },

  // ═══════════════════════════════════════════════════════════════════
  // 11. Fire Forge — Burning orange face with ember-to-charcoal depth
  // ═══════════════════════════════════════════════════════════════════
  {
    id: '3d-fire-forge',
    name: 'Fire Forge',
    description: 'Blazing orange text with ember layers cooling to charcoal at depth',
    fontFamily: 'Archivo Black',
    fontWeight: 'bold',
    color: '#FF6600',
    textShadow: [
      '0 1px 0 #EE5500',
      '0 2px 0 #DD4400',
      '1px 3px 0 #CC3300',
      '1px 4px 0 #BB2200',
      '1px 5px 0 #AA1100',
      '1px 6px 0 #880000',
      '2px 7px 0 #660000',
      '2px 8px 0 #440000',
      '0 0 15px rgba(255,102,0,0.5)',
      '0 0 40px rgba(255,60,0,0.2)',
      '2px 9px 15px rgba(0,0,0,0.5)',
    ].join(', '),
    category: '3d-block',
  },

  // ═══════════════════════════════════════════════════════════════════
  // 12. Midnight Long Shadow — White text with ultra-long dark shadow
  // ═══════════════════════════════════════════════════════════════════
  {
    id: '3d-midnight-long-shadow',
    name: 'Midnight Long Shadow',
    description: 'Crisp white text casting an extremely long shadow into deep navy darkness',
    fontFamily: 'Bebas Neue',
    fontWeight: 'bold',
    color: '#FFFFFF',
    textShadow: [
      '1px 1px 0 #D0D0E0',
      '2px 2px 0 #B0B0C8',
      '3px 3px 0 #9090B0',
      '4px 4px 0 #707098',
      '5px 5px 0 #505080',
      '6px 6px 0 #404070',
      '7px 7px 0 #303060',
      '8px 8px 0 #252555',
      '9px 9px 0 #1A1A4A',
      '10px 10px 0 #101040',
      '11px 11px 0 #0A0A35',
      '12px 12px 0 #05052A',
      '13px 13px 0 #020220',
      '14px 14px 25px rgba(0,0,20,0.5)',
    ].join(', '),
    category: 'long-shadow',
  },

  // ═══════════════════════════════════════════════════════════════════
  // 13. Toxic Slime — Acid green with dark green oozing 3D depth
  // ═══════════════════════════════════════════════════════════════════
  {
    id: '3d-toxic-slime',
    name: 'Toxic Slime',
    description: 'Acid green text with oozing dark green depth and toxic glow aura',
    fontFamily: 'Bangers',
    fontWeight: 'bold',
    color: '#39FF14',
    textShadow: [
      '1px 1px 0 #30E010',
      '2px 2px 0 #28C00E',
      '3px 3px 0 #20A00C',
      '4px 4px 0 #18800A',
      '5px 5px 0 #106008',
      '6px 6px 0 #084006',
      '7px 7px 0 #002804',
      '0 0 10px rgba(57,255,20,0.6)',
      '0 0 30px rgba(57,255,20,0.25)',
      '8px 8px 12px rgba(0,0,0,0.5)',
    ].join(', '),
    WebkitTextStroke: '2px #005500',
    category: 'comic',
  },

  // ═══════════════════════════════════════════════════════════════════
  // 14. Debossed Leather — Text pressed into a dark surface
  // ═══════════════════════════════════════════════════════════════════
  {
    id: '3d-debossed-leather',
    name: 'Debossed Leather',
    description: 'Dark text that appears stamped/pressed into a surface with inner shadow',
    fontFamily: 'Montserrat',
    fontWeight: 'black',
    color: '#2A2218',
    textShadow: [
      '0 -1px 1px rgba(255,255,255,0.08)',
      '0 1px 0 #1A1510',
      '0 2px 0 #15110D',
      '0 3px 0 #100D0A',
      '0 4px 3px rgba(0,0,0,0.5)',
      '0 0px 8px rgba(0,0,0,0.3)',
      'inset 0 1px 2px rgba(255,255,255,0.05)',
    ].join(', '),
    category: 'emboss',
  },

  // ═══════════════════════════════════════════════════════════════════
  // 15. Cotton Candy Isometric — Pastel pink with lilac isometric extrusion
  // ═══════════════════════════════════════════════════════════════════
  {
    id: '3d-cotton-candy-iso',
    name: 'Cotton Candy Isometric',
    description: 'Soft pastel pink with lilac-to-lavender isometric depth, playful and sweet',
    fontFamily: 'Fredoka',
    fontWeight: 'bold',
    color: '#FFB6D9',
    textShadow: [
      '1px 1px 0 #EEA0C8',
      '2px 2px 0 #DD8AB7',
      '3px 3px 0 #CC74A6',
      '4px 4px 0 #BB5E95',
      '5px 5px 0 #AA4884',
      '6px 6px 0 #993273',
      '7px 7px 0 #882062',
      '8px 8px 12px rgba(100,0,60,0.3)',
    ].join(', '),
    category: 'isometric',
  },

  // ═══════════════════════════════════════════════════════════════════
  // 16. Brutalist Concrete — Raw industrial grey with harsh shadow
  // ═══════════════════════════════════════════════════════════════════
  {
    id: '3d-brutalist-concrete',
    name: 'Brutalist Concrete',
    description: 'Industrial concrete grey with harsh blocky depth and rough surface feel',
    fontFamily: 'Oswald',
    fontWeight: 'black',
    color: '#C0C0C0',
    textShadow: [
      '1px 0 0 #A0A0A0',
      '2px 1px 0 #909090',
      '3px 1px 0 #808080',
      '4px 2px 0 #707070',
      '5px 2px 0 #606060',
      '6px 3px 0 #505050',
      '7px 3px 0 #404040',
      '8px 4px 0 #303030',
      '9px 4px 0 #202020',
      '10px 5px 20px rgba(0,0,0,0.6)',
    ].join(', '),
    WebkitTextStroke: '1px #707070',
    category: '3d-block',
  },

  // ═══════════════════════════════════════════════════════════════════
  // 17. Electric Magenta Pop — Vibrant magenta with black comic extrusion
  // ═══════════════════════════════════════════════════════════════════
  {
    id: '3d-electric-magenta-pop',
    name: 'Electric Magenta Pop',
    description: 'Explosive magenta with thick black outlines and bold 3D comic pop effect',
    fontFamily: 'Bangers',
    fontWeight: 'bold',
    color: '#FF00FF',
    textShadow: [
      '-2px -2px 0 #000000',
      '2px -2px 0 #000000',
      '-2px 2px 0 #000000',
      '2px 2px 0 #000000',
      '3px 3px 0 #222222',
      '4px 4px 0 #222222',
      '5px 5px 0 #333333',
      '6px 6px 0 #333333',
      '7px 7px 0 #444444',
      '8px 8px 15px rgba(0,0,0,0.5)',
      '0 0 20px rgba(255,0,255,0.4)',
    ].join(', '),
    WebkitTextStroke: '2px #000000',
    category: 'comic',
  },

  // ═══════════════════════════════════════════════════════════════════
  // 18. Ice Crystal — Frozen blue with lighter-to-darker crystalline depth
  // ═══════════════════════════════════════════════════════════════════
  {
    id: '3d-ice-crystal',
    name: 'Ice Crystal',
    description: 'Icy pale blue text with deepening crystalline blue 3D layers and frost glow',
    fontFamily: 'Inter',
    fontWeight: 'black',
    color: '#D6F0FF',
    textShadow: [
      '0 1px 0 #B0DFFF',
      '0 2px 0 #8ACEFF',
      '1px 3px 0 #64BDFF',
      '1px 4px 0 #3EACFF',
      '1px 5px 0 #1899EE',
      '1px 6px 0 #0080CC',
      '2px 7px 0 #0066AA',
      '2px 8px 0 #004D88',
      '0 0 12px rgba(100,190,255,0.5)',
      '0 0 30px rgba(50,150,255,0.2)',
      '2px 9px 15px rgba(0,0,40,0.4)',
    ].join(', '),
    category: 'metallic',
  },

  // ═══════════════════════════════════════════════════════════════════
  // 19. Terracotta Stack — Earthy warm red-brown with clay depth
  // ═══════════════════════════════════════════════════════════════════
  {
    id: '3d-terracotta-stack',
    name: 'Terracotta Stack',
    description: 'Warm terracotta with earthy clay-to-umber depth layers, artisan ceramic feel',
    fontFamily: 'Alfa Slab One',
    fontWeight: 'bold',
    color: '#E07050',
    textShadow: [
      '1px 1px 0 #CC6045',
      '2px 2px 0 #B8503A',
      '3px 3px 0 #A44030',
      '4px 4px 0 #903025',
      '5px 5px 0 #7C201A',
      '6px 6px 0 #681510',
      '7px 7px 0 #540A05',
      '8px 8px 12px rgba(50,10,0,0.5)',
    ].join(', '),
    category: '3d-block',
  },

  // ═══════════════════════════════════════════════════════════════════
  // 20. Neon Rose Depth — Glowing pink with warm red 3D extrusion & bloom
  // ═══════════════════════════════════════════════════════════════════
  {
    id: '3d-neon-rose-depth',
    name: 'Neon Rose Depth',
    description: 'Glowing neon pink face with warm red 3D extrusion and radiant bloom halo',
    fontFamily: 'Abril Fatface',
    fontWeight: 'bold',
    color: '#FF3388',
    textShadow: [
      '0 0 5px #FF3388',
      '0 0 15px #FF3388',
      '1px 1px 0 #DD2277',
      '2px 2px 0 #CC1166',
      '3px 3px 0 #AA0055',
      '4px 4px 0 #880044',
      '5px 5px 0 #660033',
      '6px 6px 0 #440022',
      '7px 7px 0 #330018',
      '0 0 40px rgba(255,51,136,0.4)',
      '0 0 80px rgba(255,51,136,0.15)',
      '8px 8px 15px rgba(0,0,0,0.5)',
    ].join(', '),
    WebkitTextStroke: '1px #CC0066',
    category: 'neon-depth',
  },
]

/**
 * Lookup a 3D text style preset by its ID.
 */
export function get3DTextStylePreset(id: string): Text3DStylePreset | undefined {
  return TEXT_3D_STYLE_PRESETS.find((p) => p.id === id)
}

/**
 * Get all presets matching a given category.
 */
export function get3DTextStylePresetsByCategory(category: Text3DStylePreset['category']): Text3DStylePreset[] {
  return TEXT_3D_STYLE_PRESETS.filter((p) => p.category === category)
}
