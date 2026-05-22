/**
 * Gradient Text Style Presets
 *
 * Each preset uses CSS `background-clip: text` with `linear-gradient` backgrounds
 * to create gradient-colored text effects for the video editor.
 *
 * Usage: Apply the `style` object directly to a text element's inline styles.
 * The fontFamily, fontWeight, and optional textShadow / WebkitTextStroke
 * properties complement the gradient to produce a cohesive visual identity.
 */

export interface GradientTextPreset {
  id: string
  name: string
  fontFamily: string
  fontWeight: 'bold' | 'black'
  style: {
    background: string
    WebkitBackgroundClip: 'text'
    WebkitTextFillColor: 'transparent'
    backgroundClip: 'text'
    textShadow?: string
    WebkitTextStroke?: string
  }
}

export const GRADIENT_TEXT_PRESETS: GradientTextPreset[] = [
  // ── 1. Sunset Blaze ──────────────────────────────────────────────────
  {
    id: 'sunset-blaze',
    name: 'Sunset Blaze',
    fontFamily: 'Bebas Neue',
    fontWeight: 'bold',
    style: {
      background: 'linear-gradient(135deg, #FF512F 0%, #F09819 40%, #FF61D2 100%)',
      WebkitBackgroundClip: 'text',
      WebkitTextFillColor: 'transparent',
      backgroundClip: 'text',
      textShadow: '0 2px 20px rgba(255, 81, 47, 0.35)',
    },
  },

  // ── 2. Ocean Depth ────────────────────────────────────────────────────
  {
    id: 'ocean-depth',
    name: 'Ocean Depth',
    fontFamily: 'Montserrat',
    fontWeight: 'black',
    style: {
      background: 'linear-gradient(180deg, #0077B6 0%, #00B4D8 50%, #90E0EF 100%)',
      WebkitBackgroundClip: 'text',
      WebkitTextFillColor: 'transparent',
      backgroundClip: 'text',
      textShadow: '0 4px 24px rgba(0, 119, 182, 0.3)',
    },
  },

  // ── 3. Inferno ────────────────────────────────────────────────────────
  {
    id: 'inferno',
    name: 'Inferno',
    fontFamily: 'Archivo Black',
    fontWeight: 'bold',
    style: {
      background: 'linear-gradient(180deg, #FF0000 0%, #FF4500 35%, #FF8C00 65%, #FFD700 100%)',
      WebkitBackgroundClip: 'text',
      WebkitTextFillColor: 'transparent',
      backgroundClip: 'text',
      textShadow: '0 0 30px rgba(255, 69, 0, 0.5), 0 0 60px rgba(255, 69, 0, 0.2)',
    },
  },

  // ── 4. Galaxy Nebula ──────────────────────────────────────────────────
  {
    id: 'galaxy-nebula',
    name: 'Galaxy Nebula',
    fontFamily: 'Poppins',
    fontWeight: 'black',
    style: {
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 40%, #f093fb 75%, #5B86E5 100%)',
      WebkitBackgroundClip: 'text',
      WebkitTextFillColor: 'transparent',
      backgroundClip: 'text',
      textShadow: '0 0 40px rgba(118, 75, 162, 0.4)',
    },
  },

  // ── 5. Liquid Gold ────────────────────────────────────────────────────
  {
    id: 'liquid-gold',
    name: 'Liquid Gold',
    fontFamily: 'Playfair Display',
    fontWeight: 'bold',
    style: {
      background: 'linear-gradient(90deg, #BF953F 0%, #FCF6BA 25%, #B38728 50%, #FBF5B7 75%, #BF953F 100%)',
      WebkitBackgroundClip: 'text',
      WebkitTextFillColor: 'transparent',
      backgroundClip: 'text',
      textShadow: '0 2px 12px rgba(191, 149, 63, 0.4)',
    },
  },

  // ── 6. Neon Pulse ─────────────────────────────────────────────────────
  {
    id: 'neon-pulse',
    name: 'Neon Pulse',
    fontFamily: 'Bangers',
    fontWeight: 'bold',
    style: {
      background: 'linear-gradient(90deg, #00F260 0%, #0575E6 50%, #00F260 100%)',
      WebkitBackgroundClip: 'text',
      WebkitTextFillColor: 'transparent',
      backgroundClip: 'text',
      textShadow: '0 0 20px rgba(0, 242, 96, 0.6), 0 0 40px rgba(5, 117, 230, 0.3)',
      WebkitTextStroke: '0.5px rgba(0, 242, 96, 0.15)',
    },
  },

  // ── 7. Cotton Candy ───────────────────────────────────────────────────
  {
    id: 'cotton-candy',
    name: 'Cotton Candy',
    fontFamily: 'Fredoka',
    fontWeight: 'bold',
    style: {
      background: 'linear-gradient(135deg, #FCCB90 0%, #D57EEB 50%, #88D3CE 100%)',
      WebkitBackgroundClip: 'text',
      WebkitTextFillColor: 'transparent',
      backgroundClip: 'text',
    },
  },

  // ── 8. Rainbow Prism ──────────────────────────────────────────────────
  {
    id: 'rainbow-prism',
    name: 'Rainbow Prism',
    fontFamily: 'Righteous',
    fontWeight: 'bold',
    style: {
      background: 'linear-gradient(90deg, #FF0000 0%, #FF8C00 17%, #FFD700 33%, #00C853 50%, #2979FF 67%, #7C4DFF 83%, #E040FB 100%)',
      WebkitBackgroundClip: 'text',
      WebkitTextFillColor: 'transparent',
      backgroundClip: 'text',
      textShadow: '0 2px 16px rgba(0, 0, 0, 0.15)',
    },
  },

  // ── 9. Arctic Frost ───────────────────────────────────────────────────
  {
    id: 'arctic-frost',
    name: 'Arctic Frost',
    fontFamily: 'Comfortaa',
    fontWeight: 'bold',
    style: {
      background: 'linear-gradient(180deg, #E0EAFC 0%, #CFDEF3 40%, #89CFF0 100%)',
      WebkitBackgroundClip: 'text',
      WebkitTextFillColor: 'transparent',
      backgroundClip: 'text',
      textShadow: '0 0 30px rgba(137, 207, 240, 0.5)',
      WebkitTextStroke: '0.5px rgba(255, 255, 255, 0.2)',
    },
  },

  // ── 10. Cyber Violet ──────────────────────────────────────────────────
  {
    id: 'cyber-violet',
    name: 'Cyber Violet',
    fontFamily: 'Bebas Neue',
    fontWeight: 'bold',
    style: {
      background: 'linear-gradient(135deg, #a855f7 0%, #ec4899 50%, #eab308 100%)',
      WebkitBackgroundClip: 'text',
      WebkitTextFillColor: 'transparent',
      backgroundClip: 'text',
      textShadow: '0 0 24px rgba(168, 85, 247, 0.5), 0 0 48px rgba(236, 72, 153, 0.25)',
    },
  },

  // ── 11. Emerald Luxe ──────────────────────────────────────────────────
  {
    id: 'emerald-luxe',
    name: 'Emerald Luxe',
    fontFamily: 'Abril Fatface',
    fontWeight: 'bold',
    style: {
      background: 'linear-gradient(135deg, #0D976C 0%, #93F9B9 40%, #1D976C 70%, #56ab2f 100%)',
      WebkitBackgroundClip: 'text',
      WebkitTextFillColor: 'transparent',
      backgroundClip: 'text',
      textShadow: '0 2px 16px rgba(13, 151, 108, 0.35)',
    },
  },

  // ── 12. Rose Quartz ───────────────────────────────────────────────────
  {
    id: 'rose-quartz',
    name: 'Rose Quartz',
    fontFamily: 'Playfair Display',
    fontWeight: 'bold',
    style: {
      background: 'linear-gradient(135deg, #fbc2eb 0%, #F5576C 50%, #FF6B95 100%)',
      WebkitBackgroundClip: 'text',
      WebkitTextFillColor: 'transparent',
      backgroundClip: 'text',
      textShadow: '0 3px 16px rgba(245, 87, 108, 0.3)',
    },
  },

  // ── 13. Midnight Chrome ───────────────────────────────────────────────
  {
    id: 'midnight-chrome',
    name: 'Midnight Chrome',
    fontFamily: 'Archivo Black',
    fontWeight: 'bold',
    style: {
      background: 'linear-gradient(180deg, #E8E8E8 0%, #AAAAAA 30%, #666666 60%, #E8E8E8 100%)',
      WebkitBackgroundClip: 'text',
      WebkitTextFillColor: 'transparent',
      backgroundClip: 'text',
      textShadow: '0 2px 8px rgba(0, 0, 0, 0.5)',
      WebkitTextStroke: '0.5px rgba(255, 255, 255, 0.1)',
    },
  },

  // ── 14. Tropical Paradise ─────────────────────────────────────────────
  {
    id: 'tropical-paradise',
    name: 'Tropical Paradise',
    fontFamily: 'Bangers',
    fontWeight: 'bold',
    style: {
      background: 'linear-gradient(135deg, #FDFC47 0%, #24FE41 35%, #00C9FF 70%, #92FFC0 100%)',
      WebkitBackgroundClip: 'text',
      WebkitTextFillColor: 'transparent',
      backgroundClip: 'text',
      textShadow: '0 2px 12px rgba(36, 254, 65, 0.3)',
    },
  },

  // ── 15. Vaporwave Dream ───────────────────────────────────────────────
  {
    id: 'vaporwave-dream',
    name: 'Vaporwave Dream',
    fontFamily: 'Alfa Slab One',
    fontWeight: 'bold',
    style: {
      background: 'linear-gradient(135deg, #FF6AD5 0%, #C774E8 25%, #AD8CFF 50%, #8795E8 75%, #94D0FF 100%)',
      WebkitBackgroundClip: 'text',
      WebkitTextFillColor: 'transparent',
      backgroundClip: 'text',
      textShadow: '0 0 30px rgba(199, 116, 232, 0.4), 2px 2px 0 rgba(148, 208, 255, 0.15)',
    },
  },

  // ── 16. Electric Lava ─────────────────────────────────────────────────
  {
    id: 'electric-lava',
    name: 'Electric Lava',
    fontFamily: 'Montserrat',
    fontWeight: 'black',
    style: {
      background: 'linear-gradient(90deg, #f12711 0%, #f5af19 50%, #f12711 100%)',
      WebkitBackgroundClip: 'text',
      WebkitTextFillColor: 'transparent',
      backgroundClip: 'text',
      textShadow: '0 0 20px rgba(241, 39, 17, 0.4)',
      WebkitTextStroke: '1px rgba(245, 175, 25, 0.1)',
    },
  },

  // ── 17. Stellar Blue ──────────────────────────────────────────────────
  {
    id: 'stellar-blue',
    name: 'Stellar Blue',
    fontFamily: 'Inter',
    fontWeight: 'black',
    style: {
      background: 'linear-gradient(135deg, #1a2a6c 0%, #b21f1f 50%, #fdbb2d 100%)',
      WebkitBackgroundClip: 'text',
      WebkitTextFillColor: 'transparent',
      backgroundClip: 'text',
      textShadow: '0 2px 20px rgba(26, 42, 108, 0.4)',
    },
  },

  // ── 18. Holographic Foil ──────────────────────────────────────────────
  {
    id: 'holographic-foil',
    name: 'Holographic Foil',
    fontFamily: 'Poppins',
    fontWeight: 'bold',
    style: {
      background: 'linear-gradient(135deg, #a8edea 0%, #fed6e3 20%, #d299c2 40%, #a8edea 60%, #fed6e3 80%, #d299c2 100%)',
      WebkitBackgroundClip: 'text',
      WebkitTextFillColor: 'transparent',
      backgroundClip: 'text',
      textShadow: '0 1px 8px rgba(162, 237, 234, 0.3)',
    },
  },

  // ── 19. Dark Amethyst ─────────────────────────────────────────────────
  {
    id: 'dark-amethyst',
    name: 'Dark Amethyst',
    fontFamily: 'Alfa Slab One',
    fontWeight: 'bold',
    style: {
      background: 'linear-gradient(180deg, #200122 0%, #6F0000 35%, #C33764 65%, #200122 100%)',
      WebkitBackgroundClip: 'text',
      WebkitTextFillColor: 'transparent',
      backgroundClip: 'text',
      textShadow: '0 0 24px rgba(195, 55, 100, 0.5)',
      WebkitTextStroke: '1px rgba(195, 55, 100, 0.15)',
    },
  },

  // ── 20. Peach Aurora ──────────────────────────────────────────────────
  {
    id: 'peach-aurora',
    name: 'Peach Aurora',
    fontFamily: 'Comfortaa',
    fontWeight: 'bold',
    style: {
      background: 'linear-gradient(135deg, #FFE29F 0%, #FFA99F 30%, #FF719A 60%, #FE5196 100%)',
      WebkitBackgroundClip: 'text',
      WebkitTextFillColor: 'transparent',
      backgroundClip: 'text',
      textShadow: '0 3px 18px rgba(255, 113, 154, 0.3)',
    },
  },
]
