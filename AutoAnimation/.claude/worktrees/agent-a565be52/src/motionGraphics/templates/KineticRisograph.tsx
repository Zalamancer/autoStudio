import { registerMotionGraphic } from '../registry'
import { KineticBase, type KineticBaseConfig, type KineticAnimation, type WordRenderProps, type BackgroundRenderProps } from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface RisographConfig extends KineticBaseConfig {}

function hash(n: number): number {
  return ((Math.sin(n * 127.1 + 311.7) * 43758.5453) % 1 + 1) % 1
}

const animation: KineticAnimation = {
  renderBackground: ({ bgColor, width, height }: BackgroundRenderProps) => {
    // Riso paper texture: recycled newsprint feel with halftone grain
    const dots: React.ReactNode[] = []
    const spacing = 8
    const cols = Math.ceil(width / spacing)
    const rows = Math.ceil(height / spacing)
    // Sparse dots for paper texture feel
    for (let i = 0; i < Math.min(cols * rows, 600); i++) {
      const x = (i % cols) * spacing + hash(i * 37) * 4
      const y = Math.floor(i / cols) * spacing + hash(i * 53) * 4
      if (hash(i * 97 + 13) > 0.7) {
        dots.push(
          <div
            key={i}
            style={{
              position: 'absolute',
              left: x,
              top: y,
              width: 1.5,
              height: 1.5,
              borderRadius: '50%',
              background: 'rgba(0,0,0,0.04)',
            }}
          />
        )
      }
    }
    return (
      <div style={{ position: 'absolute', inset: 0, background: bgColor }}>
        {dots}
      </div>
    )
  },

  renderWord: ({ word, color, enterProgress, holdProgress, exitProgress, phase, index, width, height, frame }: WordRenderProps) => {
    const f = frame ?? 0
    const seed = index * 131 + 23

    // Two color layers: primary + offset color (misregistration)
    const secondColor = index % 2 === 0 ? '#E8334A' : '#2D5BE3'
    const primaryColor = color

    // Misregistration offset (the key riso aesthetic)
    const maxOffset = 6
    let offsetX = 0
    let offsetY = 0
    let halftoneSize = 0
    let primaryOpacity = 0
    let secondaryOpacity = 0
    let scale = 1

    if (phase === 'enter') {
      // Color layers slide in from opposite directions, misaligning then settling
      const t = enterProgress
      const eased = 1 - Math.pow(1 - t, 3)

      // Primary layer comes from left, secondary from right
      offsetX = maxOffset + (1 - eased) * 20
      offsetY = maxOffset * 0.5 + (1 - eased) * 8
      halftoneSize = eased * 3
      primaryOpacity = Math.min(t / 0.3, 1) * 0.85
      secondaryOpacity = Math.min(Math.max(0, (t - 0.1) / 0.3), 1) * 0.7
      scale = 0.95 + eased * 0.05
    } else if (phase === 'hold') {
      // Settled but with subtle vibration — riso machines aren't perfect
      const vibrate = Math.sin(f * 0.3 + seed) * 0.5
      offsetX = maxOffset + vibrate
      offsetY = maxOffset * 0.5 + Math.cos(f * 0.25 + seed) * 0.3
      halftoneSize = 3
      primaryOpacity = 0.85
      secondaryOpacity = 0.7
      scale = 1
    } else {
      // Exit: layers drift apart and fade, like ink not catching
      const t = exitProgress
      offsetX = maxOffset + t * 15
      offsetY = maxOffset * 0.5 + t * 10
      halftoneSize = 3 * (1 - t * 0.5)
      primaryOpacity = 0.85 * (1 - t)
      secondaryOpacity = 0.7 * (1 - t * 0.8) // second layer lingers
      scale = 1 + t * 0.03
    }

    // Halftone dot pattern via radial-gradient
    const halftonePattern = halftoneSize > 0.5
      ? `radial-gradient(circle ${halftoneSize}px, currentColor ${halftoneSize * 0.6}px, transparent ${halftoneSize}px)`
      : 'none'
    const halftoneBackground = halftoneSize > 0.5
      ? { backgroundImage: halftonePattern, backgroundSize: `${halftoneSize * 3}px ${halftoneSize * 3}px` }
      : {}

    const fontSize = 'clamp(50px, 14vw, 190px)'
    const fontStyle: React.CSSProperties = {
      fontFamily: "'Futura', 'Gill Sans', 'Helvetica Neue', sans-serif",
      fontSize,
      fontWeight: 800,
      letterSpacing: 3,
      lineHeight: 1,
      whiteSpace: 'nowrap' as const,
      textTransform: 'uppercase' as const,
    }

    return (
      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: `translate(-50%, -50%) scale(${scale})`,
        }}
      >
        {/* Secondary / offset color layer (behind) — misregistered */}
        <div
          style={{
            ...fontStyle,
            position: 'absolute',
            left: offsetX,
            top: offsetY,
            color: secondColor,
            opacity: secondaryOpacity,
            mixBlendMode: 'multiply',
            ...halftoneBackground,
            WebkitBackgroundClip: halftoneSize > 0.5 ? 'text' : undefined,
            WebkitTextFillColor: halftoneSize > 0.5 ? 'transparent' : undefined,
          }}
        >
          {word}
        </div>
        {/* Primary color layer */}
        <div
          style={{
            ...fontStyle,
            position: 'relative',
            color: primaryColor,
            opacity: primaryOpacity,
            mixBlendMode: 'multiply',
          }}
        >
          {word}
        </div>
        {/* Overprint zone: where colors overlap creates a third blend */}
        <div
          style={{
            ...fontStyle,
            position: 'absolute',
            left: offsetX * 0.5,
            top: offsetY * 0.5,
            color: '#1a0a2e',
            opacity: Math.min(primaryOpacity, secondaryOpacity) * 0.3,
            mixBlendMode: 'multiply',
          }}
        >
          {word}
        </div>
      </div>
    )
  },
}

function RisographComponent(props: MotionGraphicProps<RisographConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-risograph',
  title: 'Kinetic Risograph',
  description: 'Misregistered two-color risograph print with halftone dots, slight offset between color layers, and multiply blending',
  tags: ['kinetic', 'typography', 'risograph', 'print', 'halftone', 'misregister', 'retro', 'zine'],
  category: 'captions',
  component: RisographComponent as any,
  defaultConfig: {
    words: ['RISO', 'ZINE', 'PRINT', 'PUNK'],
    colors: ['#0078BF', '#E8334A', '#0078BF', '#F5A623'],
    bgColor: '#FFF8F0',
    cycleDuration: 1.4,
  },
  configSchema: [
    { key: 'words', label: 'Words', type: 'text-array', defaultValue: ['RISO', 'ZINE', 'PRINT', 'PUNK'], group: 'Content' },
    { key: 'colors', label: 'Colors', type: 'text-array', defaultValue: ['#0078BF', '#E8334A', '#0078BF', '#F5A623'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#FFF8F0', group: 'Style' },
    { key: 'cycleDuration', label: 'Cycle Duration (s)', type: 'number', defaultValue: 1.4, min: 0.3, max: 5, group: 'Timing' },
  ],
})
