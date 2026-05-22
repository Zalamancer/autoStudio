/**
 * Highlighted / Boxed Text Style Presets
 *
 * 20 distinct text styles featuring colored backgrounds behind the text.
 * These presets create highlighted, boxed, labeled, badged, and tagged text
 * looks commonly seen in social media content, news graphics, price tags,
 * speech bubbles, sticky notes, and modern video overlays.
 *
 * Each preset defines a complete visual look: font, text color, background
 * color + opacity, border radius, padding, optional border, optional text
 * shadow, and optional stroke.  Apply these as style overrides on any
 * TextOverlay to instantly transform it.
 *
 * The new TextOverlay properties used:
 *   - background: true (enables the background box)
 *   - backgroundColor: hex color for the box
 *   - backgroundOpacity: 0-1 alpha
 *   - backgroundBorderRadius: px value for rounded corners
 *   - backgroundPaddingX: multiplier relative to fontSize for horizontal padding
 *   - backgroundPaddingY: multiplier relative to fontSize for vertical padding
 *   - backgroundBorder: CSS border string (e.g. '2px solid #ffffff')
 *   - textShadow: custom CSS text-shadow
 *   - webkitTextStroke: custom CSS -webkit-text-stroke
 */

import type { FontFamily, FontWeight } from '@/stores/useTextOverlayStore'

export interface HighlightedTextPreset {
  id: string
  /** Creative display name */
  name: string
  /** Short description of the visual effect */
  description: string
  fontFamily: FontFamily
  fontWeight: FontWeight
  /** Text color (hex) */
  color: string
  /** Background color (hex) */
  backgroundColor: string
  /** Background opacity 0-1 */
  backgroundOpacity: number
  /** Horizontal padding as fraction of fontSize */
  backgroundPaddingX: number
  /** Vertical padding as fraction of fontSize */
  backgroundPaddingY: number
  /** Border radius in px */
  backgroundBorderRadius: number
  /** Optional CSS border string */
  backgroundBorder?: string
  /** Optional CSS text-shadow */
  textShadow?: string
  /** Optional CSS -webkit-text-stroke */
  webkitTextStroke?: string
  /** Letter spacing in px */
  letterSpacing: number
  /** Text case override */
  textCase?: 'none' | 'uppercase' | 'lowercase'
  /** Preview swatch colors for the preset picker UI [text, background] */
  previewColors: [string, string]
}

export const HIGHLIGHTED_TEXT_PRESETS: HighlightedTextPreset[] = [

  // ======================================================================
  // 1. Yellow Highlighter
  // Classic yellow marker highlight over dark text, like a real highlighter
  // ======================================================================
  {
    id: 'hl-yellow-highlighter',
    name: 'Yellow Highlighter',
    description: 'Classic yellow marker highlight over dark text, like a real pen highlighter',
    fontFamily: 'Inter',
    fontWeight: 'semibold',
    color: '#1a1a1a',
    backgroundColor: '#FFEB3B',
    backgroundOpacity: 0.85,
    backgroundPaddingX: 0.35,
    backgroundPaddingY: 0.12,
    backgroundBorderRadius: 3,
    letterSpacing: 0,
    previewColors: ['#1a1a1a', '#FFEB3B'],
  },

  // ======================================================================
  // 2. Red Alert Box
  // Urgent red background with white bold text, emergency/warning look
  // ======================================================================
  {
    id: 'hl-red-alert-box',
    name: 'Red Alert Box',
    description: 'Urgent red background with white bold text, emergency broadcast look',
    fontFamily: 'Oswald',
    fontWeight: 'bold',
    color: '#FFFFFF',
    backgroundColor: '#D32F2F',
    backgroundOpacity: 0.95,
    backgroundPaddingX: 0.5,
    backgroundPaddingY: 0.2,
    backgroundBorderRadius: 4,
    textShadow: '0 1px 2px rgba(0,0,0,0.3)',
    letterSpacing: 1,
    textCase: 'uppercase',
    previewColors: ['#FFFFFF', '#D32F2F'],
  },

  // ======================================================================
  // 3. Black Label
  // Sleek black background with white text, like a luxury brand label
  // ======================================================================
  {
    id: 'hl-black-label',
    name: 'Black Label',
    description: 'Sleek solid black background with crisp white text, luxury label look',
    fontFamily: 'Montserrat',
    fontWeight: 'bold',
    color: '#FFFFFF',
    backgroundColor: '#000000',
    backgroundOpacity: 1,
    backgroundPaddingX: 0.5,
    backgroundPaddingY: 0.18,
    backgroundBorderRadius: 0,
    letterSpacing: 3,
    textCase: 'uppercase',
    previewColors: ['#FFFFFF', '#000000'],
  },

  // ======================================================================
  // 4. Frosted Glass
  // Semi-transparent white background with blur effect, modern glassmorphism
  // ======================================================================
  {
    id: 'hl-frosted-glass',
    name: 'Frosted Glass',
    description: 'Semi-transparent white background, modern glassmorphism aesthetic',
    fontFamily: 'Inter',
    fontWeight: 'medium',
    color: '#1a1a2e',
    backgroundColor: '#FFFFFF',
    backgroundOpacity: 0.25,
    backgroundPaddingX: 0.5,
    backgroundPaddingY: 0.25,
    backgroundBorderRadius: 12,
    backgroundBorder: '1px solid rgba(255,255,255,0.3)',
    textShadow: '0 1px 3px rgba(0,0,0,0.1)',
    letterSpacing: 0.5,
    previewColors: ['#1a1a2e', '#FFFFFF'],
  },

  // ======================================================================
  // 5. Neon Green Badge
  // Bright green badge with dark text, like a status indicator or tag
  // ======================================================================
  {
    id: 'hl-neon-green-badge',
    name: 'Neon Green Badge',
    description: 'Bright green pill badge with dark text, status indicator look',
    fontFamily: 'Poppins',
    fontWeight: 'bold',
    color: '#0a2e0a',
    backgroundColor: '#00E676',
    backgroundOpacity: 0.95,
    backgroundPaddingX: 0.6,
    backgroundPaddingY: 0.15,
    backgroundBorderRadius: 50,
    letterSpacing: 0.5,
    textCase: 'uppercase',
    previewColors: ['#0a2e0a', '#00E676'],
  },

  // ======================================================================
  // 6. News Ticker
  // Bold white on deep blue, like a breaking news chyron
  // ======================================================================
  {
    id: 'hl-news-ticker',
    name: 'News Ticker',
    description: 'Bold white text on deep blue background, breaking news chyron style',
    fontFamily: 'Roboto',
    fontWeight: 'bold',
    color: '#FFFFFF',
    backgroundColor: '#1A237E',
    backgroundOpacity: 0.95,
    backgroundPaddingX: 0.6,
    backgroundPaddingY: 0.15,
    backgroundBorderRadius: 2,
    backgroundBorder: '3px solid #FF1744',
    textShadow: '0 1px 2px rgba(0,0,0,0.4)',
    letterSpacing: 0.5,
    textCase: 'uppercase',
    previewColors: ['#FFFFFF', '#1A237E'],
  },

  // ======================================================================
  // 7. Sticky Note
  // Warm yellow background with slight rotation feel, handwritten font
  // ======================================================================
  {
    id: 'hl-sticky-note',
    name: 'Sticky Note',
    description: 'Warm yellow sticky note with handwritten font, casual memo look',
    fontFamily: 'Caveat',
    fontWeight: 'bold',
    color: '#333333',
    backgroundColor: '#FFF59D',
    backgroundOpacity: 0.95,
    backgroundPaddingX: 0.5,
    backgroundPaddingY: 0.35,
    backgroundBorderRadius: 2,
    textShadow: '0 1px 1px rgba(0,0,0,0.05)',
    letterSpacing: 0,
    previewColors: ['#333333', '#FFF59D'],
  },

  // ======================================================================
  // 8. Price Tag
  // Bold red price on white with border, retail/sale look
  // ======================================================================
  {
    id: 'hl-price-tag',
    name: 'Price Tag',
    description: 'Bold red text on white background with border, retail sale tag',
    fontFamily: 'Archivo Black',
    fontWeight: 'bold',
    color: '#D32F2F',
    backgroundColor: '#FFFFFF',
    backgroundOpacity: 0.98,
    backgroundPaddingX: 0.5,
    backgroundPaddingY: 0.2,
    backgroundBorderRadius: 6,
    backgroundBorder: '3px solid #D32F2F',
    letterSpacing: 0,
    previewColors: ['#D32F2F', '#FFFFFF'],
  },

  // ======================================================================
  // 9. Speech Bubble
  // White rounded box with slight shadow, comic speech bubble feel
  // ======================================================================
  {
    id: 'hl-speech-bubble',
    name: 'Speech Bubble',
    description: 'White rounded box with soft shadow, comic speech bubble aesthetic',
    fontFamily: 'Nunito',
    fontWeight: 'bold',
    color: '#222222',
    backgroundColor: '#FFFFFF',
    backgroundOpacity: 0.97,
    backgroundPaddingX: 0.6,
    backgroundPaddingY: 0.3,
    backgroundBorderRadius: 20,
    textShadow: '0 0 0 transparent',
    letterSpacing: 0,
    previewColors: ['#222222', '#FFFFFF'],
  },

  // ======================================================================
  // 10. Masking Tape
  // Beige/tan semi-transparent strip, like tape stuck on a surface
  // ======================================================================
  {
    id: 'hl-masking-tape',
    name: 'Masking Tape',
    description: 'Beige semi-transparent strip like tape stuck on a surface',
    fontFamily: 'Permanent Marker',
    fontWeight: 'normal',
    color: '#2c2c2c',
    backgroundColor: '#D7CCC8',
    backgroundOpacity: 0.75,
    backgroundPaddingX: 0.6,
    backgroundPaddingY: 0.1,
    backgroundBorderRadius: 1,
    letterSpacing: 1,
    previewColors: ['#2c2c2c', '#D7CCC8'],
  },

  // ======================================================================
  // 11. Cyber Purple
  // Vibrant purple background with white text, tech/cyber aesthetic
  // ======================================================================
  {
    id: 'hl-cyber-purple',
    name: 'Cyber Purple',
    description: 'Vibrant purple background with white text, futuristic tech aesthetic',
    fontFamily: 'Space Mono',
    fontWeight: 'bold',
    color: '#FFFFFF',
    backgroundColor: '#7C4DFF',
    backgroundOpacity: 0.9,
    backgroundPaddingX: 0.45,
    backgroundPaddingY: 0.18,
    backgroundBorderRadius: 4,
    textShadow: '0 0 10px rgba(124,77,255,0.5)',
    letterSpacing: 2,
    textCase: 'uppercase',
    previewColors: ['#FFFFFF', '#7C4DFF'],
  },

  // ======================================================================
  // 12. Gradient Sunset Box
  // Warm orange background fading feel, with white text
  // ======================================================================
  {
    id: 'hl-sunset-box',
    name: 'Sunset Box',
    description: 'Warm orange background with white text, golden hour vibes',
    fontFamily: 'Raleway',
    fontWeight: 'bold',
    color: '#FFFFFF',
    backgroundColor: '#FF6D00',
    backgroundOpacity: 0.92,
    backgroundPaddingX: 0.5,
    backgroundPaddingY: 0.22,
    backgroundBorderRadius: 8,
    textShadow: '0 2px 4px rgba(0,0,0,0.2)',
    letterSpacing: 1,
    previewColors: ['#FFFFFF', '#FF6D00'],
  },

  // ======================================================================
  // 13. Mint Fresh
  // Cool mint green with dark text, clean and fresh look
  // ======================================================================
  {
    id: 'hl-mint-fresh',
    name: 'Mint Fresh',
    description: 'Cool mint green background with dark text, clean and fresh aesthetic',
    fontFamily: 'Comfortaa',
    fontWeight: 'bold',
    color: '#1B5E20',
    backgroundColor: '#A5D6A7',
    backgroundOpacity: 0.9,
    backgroundPaddingX: 0.5,
    backgroundPaddingY: 0.2,
    backgroundBorderRadius: 10,
    letterSpacing: 0.5,
    previewColors: ['#1B5E20', '#A5D6A7'],
  },

  // ======================================================================
  // 14. Dark Mode Chip
  // Dark translucent chip with light text, modern UI component look
  // ======================================================================
  {
    id: 'hl-dark-mode-chip',
    name: 'Dark Mode Chip',
    description: 'Dark translucent chip with light text, modern UI component aesthetic',
    fontFamily: 'Inter',
    fontWeight: 'medium',
    color: '#E0E0E0',
    backgroundColor: '#212121',
    backgroundOpacity: 0.85,
    backgroundPaddingX: 0.45,
    backgroundPaddingY: 0.15,
    backgroundBorderRadius: 50,
    backgroundBorder: '1px solid rgba(255,255,255,0.12)',
    letterSpacing: 0.3,
    previewColors: ['#E0E0E0', '#212121'],
  },

  // ======================================================================
  // 15. Hot Pink Pop
  // Vibrant hot pink background with white text, bold and attention-grabbing
  // ======================================================================
  {
    id: 'hl-hot-pink-pop',
    name: 'Hot Pink Pop',
    description: 'Vibrant hot pink background with white bold text, maximum attention',
    fontFamily: 'Fredoka',
    fontWeight: 'bold',
    color: '#FFFFFF',
    backgroundColor: '#E91E63',
    backgroundOpacity: 0.95,
    backgroundPaddingX: 0.45,
    backgroundPaddingY: 0.18,
    backgroundBorderRadius: 8,
    textShadow: '0 1px 3px rgba(0,0,0,0.2)',
    letterSpacing: 0.5,
    previewColors: ['#FFFFFF', '#E91E63'],
  },

  // ======================================================================
  // 16. Blueprint
  // Deep blue background with white monospace, technical drawing look
  // ======================================================================
  {
    id: 'hl-blueprint',
    name: 'Blueprint',
    description: 'Deep blue background with white monospace text, technical drawing aesthetic',
    fontFamily: 'Space Mono',
    fontWeight: 'normal',
    color: '#FFFFFF',
    backgroundColor: '#0D47A1',
    backgroundOpacity: 0.9,
    backgroundPaddingX: 0.5,
    backgroundPaddingY: 0.2,
    backgroundBorderRadius: 0,
    backgroundBorder: '1px solid rgba(255,255,255,0.3)',
    letterSpacing: 1.5,
    previewColors: ['#FFFFFF', '#0D47A1'],
  },

  // ======================================================================
  // 17. Gold Emblem
  // Rich gold/amber background with dark text, premium/award look
  // ======================================================================
  {
    id: 'hl-gold-emblem',
    name: 'Gold Emblem',
    description: 'Rich gold background with dark text, premium award badge look',
    fontFamily: 'Playfair Display',
    fontWeight: 'bold',
    color: '#3E2723',
    backgroundColor: '#FFD54F',
    backgroundOpacity: 0.95,
    backgroundPaddingX: 0.6,
    backgroundPaddingY: 0.2,
    backgroundBorderRadius: 4,
    backgroundBorder: '2px solid #F9A825',
    textShadow: '0 1px 0 rgba(255,255,255,0.3)',
    letterSpacing: 2,
    textCase: 'uppercase',
    previewColors: ['#3E2723', '#FFD54F'],
  },

  // ======================================================================
  // 18. Chalk on Blackboard
  // Dark green/black background with chalky white text
  // ======================================================================
  {
    id: 'hl-chalkboard',
    name: 'Chalkboard',
    description: 'Dark green blackboard background with chalky white handwritten text',
    fontFamily: 'Caveat',
    fontWeight: 'bold',
    color: '#F5F5F5',
    backgroundColor: '#1B3A2D',
    backgroundOpacity: 0.95,
    backgroundPaddingX: 0.55,
    backgroundPaddingY: 0.3,
    backgroundBorderRadius: 2,
    backgroundBorder: '3px solid #5D4037',
    textShadow: '0 0 3px rgba(255,255,255,0.15)',
    letterSpacing: 0.5,
    previewColors: ['#F5F5F5', '#1B3A2D'],
  },

  // ======================================================================
  // 19. Neon Outline Box
  // Transparent background with neon colored border, minimal neon sign look
  // ======================================================================
  {
    id: 'hl-neon-outline-box',
    name: 'Neon Outline Box',
    description: 'Transparent box with bright neon border, minimal neon sign aesthetic',
    fontFamily: 'Bebas Neue',
    fontWeight: 'bold',
    color: '#00E5FF',
    backgroundColor: '#000000',
    backgroundOpacity: 0.2,
    backgroundPaddingX: 0.5,
    backgroundPaddingY: 0.2,
    backgroundBorderRadius: 4,
    backgroundBorder: '2px solid #00E5FF',
    textShadow: [
      '0 0 7px #00E5FF',
      '0 0 15px #00E5FF',
      '0 0 30px rgba(0,229,255,0.4)',
    ].join(', '),
    letterSpacing: 3,
    textCase: 'uppercase',
    previewColors: ['#00E5FF', '#000000'],
  },

  // ======================================================================
  // 20. Retro TV Caption
  // White text on slightly transparent dark strip, classic TV lower third
  // ======================================================================
  {
    id: 'hl-retro-tv-caption',
    name: 'Retro TV Caption',
    description: 'White text on dark translucent strip, classic television caption bar',
    fontFamily: 'Roboto',
    fontWeight: 'medium',
    color: '#FFFFFF',
    backgroundColor: '#000000',
    backgroundOpacity: 0.7,
    backgroundPaddingX: 0.7,
    backgroundPaddingY: 0.15,
    backgroundBorderRadius: 0,
    letterSpacing: 0.5,
    previewColors: ['#FFFFFF', '#000000'],
  },

  // ======================================================================
  // 21. News Lower Third
  // Broadcast-style with red left accent border
  // ======================================================================
  {
    id: 'hl-news-lower-third',
    name: 'News Lower Third',
    description: 'Broadcast chyron with red left border accent, professional news look',
    fontFamily: 'Roboto',
    fontWeight: 'bold',
    color: '#FFFFFF',
    backgroundColor: '#000000',
    backgroundOpacity: 0.7,
    backgroundPaddingX: 0.5,
    backgroundPaddingY: 0.15,
    backgroundBorderRadius: 2,
    backgroundBorder: '0 0 0 4px #FF4B2B',
    textShadow: '0 2px 4px rgba(0,0,0,0.8)',
    letterSpacing: 0.5,
    textCase: 'uppercase',
    previewColors: ['#FFFFFF', '#FF4B2B'],
  },

  // ======================================================================
  // 22. Neon Pink Glow Box
  // Hot pink with glowing box shadow effect
  // ======================================================================
  {
    id: 'hl-neon-pink-glow',
    name: 'Neon Pink Glow',
    description: 'Hot pink background with neon glow halo, nightclub aesthetic',
    fontFamily: 'Poppins',
    fontWeight: 'bold',
    color: '#FFFFFF',
    backgroundColor: '#FF1493',
    backgroundOpacity: 0.9,
    backgroundPaddingX: 0.45,
    backgroundPaddingY: 0.18,
    backgroundBorderRadius: 8,
    textShadow: '0 0 10px rgba(255, 20, 147, 0.6)',
    letterSpacing: 1,
    previewColors: ['#FFFFFF', '#FF1493'],
  },

  // ======================================================================
  // 23. Gradient Badge
  // Purple-to-pink gradient-style solid background
  // ======================================================================
  {
    id: 'hl-gradient-badge',
    name: 'Gradient Badge',
    description: 'Vibrant purple badge with white text, premium VIP status look',
    fontFamily: 'Inter',
    fontWeight: 'bold',
    color: '#FFFFFF',
    backgroundColor: '#7C3AED',
    backgroundOpacity: 0.95,
    backgroundPaddingX: 0.5,
    backgroundPaddingY: 0.15,
    backgroundBorderRadius: 25,
    letterSpacing: 0.5,
    textCase: 'uppercase',
    previewColors: ['#FFFFFF', '#7C3AED'],
  },

  // ======================================================================
  // 24. Pastel Pink
  // Soft pastel pink with dark rose text
  // ======================================================================
  {
    id: 'hl-pastel-pink',
    name: 'Pastel Pink',
    description: 'Soft pastel pink background with deep rose text, delicate feminine look',
    fontFamily: 'Nunito',
    fontWeight: 'semibold',
    color: '#c2185b',
    backgroundColor: '#f8bbd0',
    backgroundOpacity: 0.9,
    backgroundPaddingX: 0.5,
    backgroundPaddingY: 0.2,
    backgroundBorderRadius: 10,
    letterSpacing: 0.5,
    previewColors: ['#c2185b', '#f8bbd0'],
  },

  // ======================================================================
  // 25. Success Green Pill
  // Bright green pill badge with white text
  // ======================================================================
  {
    id: 'hl-success-pill',
    name: 'Success Pill',
    description: 'Bright green pill with white text, confirmation/success indicator',
    fontFamily: 'Inter',
    fontWeight: 'bold',
    color: '#FFFFFF',
    backgroundColor: '#28a745',
    backgroundOpacity: 0.95,
    backgroundPaddingX: 0.55,
    backgroundPaddingY: 0.15,
    backgroundBorderRadius: 50,
    letterSpacing: 0.5,
    textCase: 'uppercase',
    previewColors: ['#FFFFFF', '#28a745'],
  },

  // ======================================================================
  // 26. Warning Amber
  // Bold amber/yellow with dark text, caution style
  // ======================================================================
  {
    id: 'hl-warning-amber',
    name: 'Warning Amber',
    description: 'Bold amber background with dark text, caution/warning badge',
    fontFamily: 'Oswald',
    fontWeight: 'bold',
    color: '#333333',
    backgroundColor: '#FFC107',
    backgroundOpacity: 0.95,
    backgroundPaddingX: 0.5,
    backgroundPaddingY: 0.18,
    backgroundBorderRadius: 4,
    backgroundBorder: '1px solid #ffb300',
    textShadow: '0 1px 0 rgba(255,255,255,0.5)',
    letterSpacing: 1,
    textCase: 'uppercase',
    previewColors: ['#333333', '#FFC107'],
  },

  // ======================================================================
  // 27. Bordered Gold
  // Transparent bg with gold double border, enterprise premium
  // ======================================================================
  {
    id: 'hl-bordered-gold',
    name: 'Bordered Gold',
    description: 'Gold double border on dark background, enterprise premium label',
    fontFamily: 'Playfair Display',
    fontWeight: 'bold',
    color: '#c5a47e',
    backgroundColor: '#1a1510',
    backgroundOpacity: 0.9,
    backgroundPaddingX: 0.55,
    backgroundPaddingY: 0.2,
    backgroundBorderRadius: 4,
    backgroundBorder: '3px double #c5a47e',
    letterSpacing: 2,
    textCase: 'uppercase',
    previewColors: ['#c5a47e', '#1a1510'],
  },

  // ======================================================================
  // 28. Dark Inset
  // Dark background with inset shadow feel
  // ======================================================================
  {
    id: 'hl-dark-inset',
    name: 'Dark Inset',
    description: 'Dark surface with pressed-in shadow, recessed panel aesthetic',
    fontFamily: 'Montserrat',
    fontWeight: 'bold',
    color: '#FFFFFF',
    backgroundColor: '#2c3e50',
    backgroundOpacity: 0.95,
    backgroundPaddingX: 0.5,
    backgroundPaddingY: 0.2,
    backgroundBorderRadius: 4,
    textShadow: '0 1px 2px rgba(0,0,0,0.5)',
    letterSpacing: 1,
    previewColors: ['#FFFFFF', '#2c3e50'],
  },

  // ======================================================================
  // 29. Info Blue Chip
  // Light blue background with blue text, info indicator
  // ======================================================================
  {
    id: 'hl-info-blue',
    name: 'Info Blue Chip',
    description: 'Light blue background with blue text, information badge style',
    fontFamily: 'Inter',
    fontWeight: 'semibold',
    color: '#0071f3',
    backgroundColor: '#e7f3ff',
    backgroundOpacity: 0.95,
    backgroundPaddingX: 0.45,
    backgroundPaddingY: 0.15,
    backgroundBorderRadius: 20,
    backgroundBorder: '1px solid #0071f3',
    letterSpacing: 0.3,
    previewColors: ['#0071f3', '#e7f3ff'],
  },

  // ======================================================================
  // 30. Coral Rounded
  // Warm coral with rounded corners
  // ======================================================================
  {
    id: 'hl-coral-rounded',
    name: 'Coral Rounded',
    description: 'Warm coral background with white text, friendly rounded label',
    fontFamily: 'Fredoka',
    fontWeight: 'bold',
    color: '#FFFFFF',
    backgroundColor: '#FF5A5F',
    backgroundOpacity: 0.95,
    backgroundPaddingX: 0.5,
    backgroundPaddingY: 0.2,
    backgroundBorderRadius: 14,
    letterSpacing: 0.5,
    previewColors: ['#FFFFFF', '#FF5A5F'],
  },

  // ======================================================================
  // 31. Violet Mist
  // Soft violet with dark purple text
  // ======================================================================
  {
    id: 'hl-violet-mist',
    name: 'Violet Mist',
    description: 'Soft lavender background with deep violet text, dreamy pastel look',
    fontFamily: 'Comfortaa',
    fontWeight: 'bold',
    color: '#4A148C',
    backgroundColor: '#E1BEE7',
    backgroundOpacity: 0.88,
    backgroundPaddingX: 0.5,
    backgroundPaddingY: 0.2,
    backgroundBorderRadius: 12,
    letterSpacing: 0.5,
    previewColors: ['#4A148C', '#E1BEE7'],
  },

  // ======================================================================
  // 32. Ocean Deep Tag
  // Deep teal background with white text
  // ======================================================================
  {
    id: 'hl-ocean-deep',
    name: 'Ocean Deep',
    description: 'Deep teal background with white text, underwater depth look',
    fontFamily: 'Raleway',
    fontWeight: 'bold',
    color: '#FFFFFF',
    backgroundColor: '#00695C',
    backgroundOpacity: 0.92,
    backgroundPaddingX: 0.5,
    backgroundPaddingY: 0.18,
    backgroundBorderRadius: 6,
    textShadow: '0 1px 3px rgba(0,0,0,0.3)',
    letterSpacing: 1.5,
    textCase: 'uppercase',
    previewColors: ['#FFFFFF', '#00695C'],
  },

  // ======================================================================
  // 33. Cream Vintage
  // Warm cream background with brown serif text
  // ======================================================================
  {
    id: 'hl-cream-vintage',
    name: 'Cream Vintage',
    description: 'Warm cream background with brown serif text, classic vintage label',
    fontFamily: 'Merriweather',
    fontWeight: 'bold',
    color: '#5D4037',
    backgroundColor: '#FFF8E1',
    backgroundOpacity: 0.95,
    backgroundPaddingX: 0.55,
    backgroundPaddingY: 0.22,
    backgroundBorderRadius: 4,
    backgroundBorder: '2px solid #D7CCC8',
    letterSpacing: 1,
    previewColors: ['#5D4037', '#FFF8E1'],
  },

  // ======================================================================
  // 34. Electric Blue Bar
  // Solid electric blue strip with white text
  // ======================================================================
  {
    id: 'hl-electric-blue-bar',
    name: 'Electric Blue',
    description: 'Solid electric blue bar with white text, bold modern callout',
    fontFamily: 'Archivo Black',
    fontWeight: 'bold',
    color: '#FFFFFF',
    backgroundColor: '#2196F3',
    backgroundOpacity: 0.95,
    backgroundPaddingX: 0.6,
    backgroundPaddingY: 0.15,
    backgroundBorderRadius: 0,
    textShadow: '0 1px 2px rgba(0,0,0,0.2)',
    letterSpacing: 1,
    textCase: 'uppercase',
    previewColors: ['#FFFFFF', '#2196F3'],
  },

  // ======================================================================
  // 35. Smoke Glass
  // Dark translucent glass with white text
  // ======================================================================
  {
    id: 'hl-smoke-glass',
    name: 'Smoke Glass',
    description: 'Dark translucent glass with white text, cinematic overlay caption',
    fontFamily: 'Inter',
    fontWeight: 'semibold',
    color: '#FFFFFF',
    backgroundColor: '#1a1a2e',
    backgroundOpacity: 0.6,
    backgroundPaddingX: 0.55,
    backgroundPaddingY: 0.22,
    backgroundBorderRadius: 8,
    backgroundBorder: '1px solid rgba(255,255,255,0.1)',
    textShadow: '0 1px 3px rgba(0,0,0,0.5)',
    letterSpacing: 0.5,
    previewColors: ['#FFFFFF', '#1a1a2e'],
  },

  // ======================================================================
  // 36. Ruby Gemstone
  // Deep ruby red with gold border
  // ======================================================================
  {
    id: 'hl-ruby-gemstone',
    name: 'Ruby Gemstone',
    description: 'Deep ruby red with gold border accent, luxurious jewel tone look',
    fontFamily: 'Abril Fatface',
    fontWeight: 'bold',
    color: '#FFD700',
    backgroundColor: '#8B0000',
    backgroundOpacity: 0.95,
    backgroundPaddingX: 0.5,
    backgroundPaddingY: 0.2,
    backgroundBorderRadius: 4,
    backgroundBorder: '2px solid #FFD700',
    textShadow: '0 1px 3px rgba(0,0,0,0.5)',
    letterSpacing: 2,
    textCase: 'uppercase',
    previewColors: ['#FFD700', '#8B0000'],
  },

  // ======================================================================
  // 37. Teal Professional
  // Clean teal with white text, corporate feel
  // ======================================================================
  {
    id: 'hl-teal-pro',
    name: 'Teal Professional',
    description: 'Clean teal background with white text, corporate professional badge',
    fontFamily: 'Poppins',
    fontWeight: 'semibold',
    color: '#FFFFFF',
    backgroundColor: '#009688',
    backgroundOpacity: 0.92,
    backgroundPaddingX: 0.5,
    backgroundPaddingY: 0.18,
    backgroundBorderRadius: 6,
    letterSpacing: 0.5,
    previewColors: ['#FFFFFF', '#009688'],
  },

  // ======================================================================
  // 38. Lemon Drop
  // Bright lemon yellow with dark text, cheerful pop
  // ======================================================================
  {
    id: 'hl-lemon-drop',
    name: 'Lemon Drop',
    description: 'Bright lemon yellow with dark text, cheerful and attention-grabbing',
    fontFamily: 'Nunito',
    fontWeight: 'bold',
    color: '#1a1a1a',
    backgroundColor: '#FFEE58',
    backgroundOpacity: 0.95,
    backgroundPaddingX: 0.45,
    backgroundPaddingY: 0.15,
    backgroundBorderRadius: 50,
    letterSpacing: 0.5,
    previewColors: ['#1a1a1a', '#FFEE58'],
  },

  // ======================================================================
  // 39. Charcoal Stripe
  // Charcoal background with subtle white border
  // ======================================================================
  {
    id: 'hl-charcoal-stripe',
    name: 'Charcoal Stripe',
    description: 'Charcoal background with subtle white border, minimalist dark label',
    fontFamily: 'Montserrat',
    fontWeight: 'medium',
    color: '#F5F5F5',
    backgroundColor: '#37474F',
    backgroundOpacity: 0.95,
    backgroundPaddingX: 0.6,
    backgroundPaddingY: 0.15,
    backgroundBorderRadius: 2,
    backgroundBorder: '1px solid rgba(255,255,255,0.2)',
    letterSpacing: 2,
    textCase: 'uppercase',
    previewColors: ['#F5F5F5', '#37474F'],
  },

  // ======================================================================
  // 40. Bubblegum
  // Bright pink-purple with rounded pill shape
  // ======================================================================
  {
    id: 'hl-bubblegum',
    name: 'Bubblegum',
    description: 'Bright bubblegum pink with white text, fun rounded pill shape',
    fontFamily: 'Fredoka',
    fontWeight: 'bold',
    color: '#FFFFFF',
    backgroundColor: '#EC407A',
    backgroundOpacity: 0.95,
    backgroundPaddingX: 0.55,
    backgroundPaddingY: 0.18,
    backgroundBorderRadius: 50,
    letterSpacing: 0.5,
    previewColors: ['#FFFFFF', '#EC407A'],
  },
]
