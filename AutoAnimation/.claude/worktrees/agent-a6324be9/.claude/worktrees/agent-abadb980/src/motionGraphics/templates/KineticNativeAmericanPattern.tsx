import { registerMotionGraphic } from '../registry'
import { KineticBase, type KineticBaseConfig, type KineticAnimation, type WordRenderProps, type BackgroundRenderProps } from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface NativeAmericanPatternConfig extends KineticBaseConfig {}

// Native American geometric pattern style:
// Navajo/Pueblo/Plains geometric diamond/zigzag/arrow patterns,
// earth tones (terracotta/sand/turquoise/ivory), stepped pyramid border,
// directional reveal (four directions — cardinal symbolism)
const animation: KineticAnimation = {
  renderBackground: ({ bgColor, frame, fps }: BackgroundRenderProps) => {
    void frame; void fps

    return (
      <div style={{ position: 'absolute', inset: 0, background: bgColor, overflow: 'hidden' }}>
        {/* Navajo-style diamond/zigzag repeating pattern */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            backgroundImage: `
              repeating-linear-gradient(
                135deg,
                transparent 0px,
                transparent 10px,
                rgba(165,80,20,0.12) 10px,
                rgba(165,80,20,0.12) 12px
              ),
              repeating-linear-gradient(
                45deg,
                transparent 0px,
                transparent 10px,
                rgba(100,60,20,0.08) 10px,
                rgba(100,60,20,0.08) 12px
              )
            `,
          }}
        />
        {/* Stepped pyramid border (thunderbird/stepped motif) — top */}
        <svg
          style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '20px', opacity: 0.55 }}
          viewBox="0 0 100 8"
          preserveAspectRatio="none"
        >
          <path
            d="M0,8 L0,4 L2,4 L2,2 L4,2 L4,0 L6,0 L6,2 L8,2 L8,4 L10,4 L10,8 L12,8 L12,4 L14,4 L14,2 L16,2 L16,0 L18,0 L18,2 L20,2 L20,4 L22,4 L22,8 L24,8 L24,4 L26,4 L26,2 L28,2 L28,0 L30,0 L30,2 L32,2 L32,4 L34,4 L34,8 L36,8 L36,4 L38,4 L38,2 L40,2 L40,0 L42,0 L42,2 L44,2 L44,4 L46,4 L46,8 L48,8 L48,4 L50,4"
            fill="none"
            stroke="rgba(165,80,20,0.9)"
            strokeWidth="0.8"
          />
        </svg>
        {/* Stepped pyramid border — bottom */}
        <svg
          style={{ position: 'absolute', bottom: 0, left: 0, width: '100%', height: '20px', opacity: 0.55 }}
          viewBox="0 0 100 8"
          preserveAspectRatio="none"
        >
          <path
            d="M0,0 L0,4 L2,4 L2,6 L4,6 L4,8 L6,8 L6,6 L8,6 L8,4 L10,4 L10,0 L12,0 L12,4 L14,4 L14,6 L16,6 L16,8 L18,8 L18,6 L20,6 L20,4 L22,4 L22,0 L24,0 L24,4 L26,4 L26,6 L28,6 L28,8 L30,8 L30,6 L32,6 L32,4 L34,4 L34,0 L36,0 L36,4 L38,4 L38,6 L40,6 L40,8 L42,8 L42,6 L44,6 L44,4 L46,4 L46,0 L48,0 L48,4 L50,4"
            fill="none"
            stroke="rgba(165,80,20,0.9)"
            strokeWidth="0.8"
          />
        </svg>
        {/* Turquoise accent corner diamonds */}
        {[
          { top: '4px', left: '4px' },
          { top: '4px', right: '4px' },
          { bottom: '4px', left: '4px' },
          { bottom: '4px', right: '4px' },
        ].map((pos, i) => (
          <div
            key={i}
            style={{
              position: 'absolute',
              width: '12px',
              height: '12px',
              background: 'rgba(64,176,166,0.6)',
              transform: 'rotate(45deg)',
              ...pos,
            }}
          />
        ))}
        {/* Arrow/feather side decorations */}
        <div style={{ position: 'absolute', top: '8%', left: '2%', bottom: '8%', width: '6px', background: 'rgba(165,80,20,0.15)', borderRadius: '3px' }} />
        <div style={{ position: 'absolute', top: '8%', right: '2%', bottom: '8%', width: '6px', background: 'rgba(165,80,20,0.15)', borderRadius: '3px' }} />
      </div>
    )
  },

  renderWord: ({ word, color, enterProgress, exitProgress, phase, index }: WordRenderProps) => {
    let opacity = 0
    let translateX = 0
    let translateY = 0

    // Four directional entrances cycling through cardinal directions
    const direction = index % 4
    if (phase === 'enter') {
      opacity = Math.min(1, enterProgress * 2.5)
      const ease = 1 - Math.pow(1 - enterProgress, 3)
      const dist = (1 - ease) * 35
      if (direction === 0) translateX = -dist
      else if (direction === 1) translateX = dist
      else if (direction === 2) translateY = -dist
      else translateY = dist
    } else if (phase === 'hold') {
      opacity = 1
    } else {
      opacity = 1 - exitProgress * 1.5
    }

    const earthGlow = `
      2px 2px 0 rgba(0,0,0,0.5),
      -1px -1px 0 rgba(0,0,0,0.3),
      0 0 12px rgba(165,80,20,0.3)
    `

    return (
      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: `translate(calc(-50% + ${translateX}px), calc(-50% + ${translateY}px))`,
          opacity: Math.max(0, opacity),
        }}
      >
        <div
          style={{
            fontFamily: "'Georgia', 'Times New Roman', serif",
            fontSize: 'clamp(42px, 12vw, 165px)',
            fontWeight: 900,
            textTransform: 'uppercase',
            color,
            textShadow: earthGlow,
            WebkitTextStroke: '2px rgba(0,0,0,0.4)',
            whiteSpace: 'nowrap',
            letterSpacing: 5,
          }}
        >
          {word}
        </div>
      </div>
    )
  },
}

function NativeAmericanPatternComponent(props: MotionGraphicProps<NativeAmericanPatternConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-native-american-pattern',
  title: 'Kinetic Native American Pattern',
  description: 'Native American Navajo/Pueblo geometric pattern with stepped pyramid borders, diamond/zigzag patterns, turquoise accents, earth tones, and four-directions entrance',
  tags: ['kinetic', 'typography', 'native-american', 'navajo', 'pueblo', 'geometric', 'turquoise', 'earth', 'indigenous', 'southwest'],
  category: 'captions',
  component: NativeAmericanPatternComponent as any,
  defaultConfig: {
    words: ['EARTH', 'SKY', 'SPIRIT', 'WATER'],
    colors: ['#CC5500', '#40B0A6', '#F5DEB3', '#8B4513'],
    bgColor: '#2a1806',
    cycleDuration: 1.1,
  },
  configSchema: [
    { key: 'words', label: 'Words', type: 'text-array', defaultValue: ['EARTH', 'SKY', 'SPIRIT', 'WATER'], group: 'Content' },
    { key: 'colors', label: 'Colors', type: 'text-array', defaultValue: ['#CC5500', '#40B0A6', '#F5DEB3', '#8B4513'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#2a1806', group: 'Style' },
    { key: 'cycleDuration', label: 'Cycle Duration (s)', type: 'number', defaultValue: 1.1, min: 0.3, max: 5, group: 'Timing' },
  ],
})
