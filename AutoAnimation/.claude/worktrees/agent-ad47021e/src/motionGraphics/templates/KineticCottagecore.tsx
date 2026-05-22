import { registerMotionGraphic } from '../registry'
import { KineticBase, type KineticBaseConfig, type KineticAnimation, type WordRenderProps, type BackgroundRenderProps } from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface CottagecoreConfig extends KineticBaseConfig {}

const animation: KineticAnimation = {
  renderBackground: ({ bgColor, frame, fps }: BackgroundRenderProps) => {
    const time = frame / fps

    // Floating petal-like dots
    const petals = Array.from({ length: 16 }, (_, i) => {
      const seed = i * 97 + 23
      const startX = ((seed * 13) % 100)
      const startY = ((seed * 7 + 200) % 120) - 10
      const drift = Math.sin(time * 0.8 + i * 0.5) * 15
      const fall = (time * 8 + i * 12) % 130 - 10
      const size = 3 + (seed % 4)
      const hue = [340, 30, 120, 280, 60][(seed) % 5]
      const petalOpacity = 0.15 + (seed % 3) * 0.08

      return (
        <div
          key={i}
          style={{
            position: 'absolute',
            left: `${startX + drift * 0.3}%`,
            top: `${fall}%`,
            width: size,
            height: size,
            borderRadius: '50%',
            background: `hsl(${hue}, 60%, 75%)`,
            opacity: petalOpacity,
            filter: 'blur(0.5px)',
            pointerEvents: 'none',
          }}
        />
      )
    })

    return (
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: bgColor === '#faf5e8'
            ? 'linear-gradient(180deg, #faf5e8 0%, #f5eedc 100%)'
            : bgColor,
        }}
      >
        {/* Warm light overlay */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: 'radial-gradient(ellipse at 70% 30%, rgba(255,220,150,0.1) 0%, transparent 60%)',
            pointerEvents: 'none',
          }}
        />
        {petals}
      </div>
    )
  },

  renderWord: ({ word, color, enterProgress, exitProgress, phase, index }: WordRenderProps) => {
    let opacity = 0
    let translateY = 0
    let scale = 1

    if (phase === 'enter') {
      // Gentle fade in with slight upward rise
      const eased = 1 - Math.pow(1 - enterProgress, 2)
      opacity = eased
      translateY = (1 - eased) * 20
      scale = 0.95 + eased * 0.05
    } else if (phase === 'hold') {
      opacity = 1
      // Soft breathing float
      translateY = Math.sin(Date.now() * 0.0015 + index * 1.5) * 4
      scale = 1 + Math.sin(Date.now() * 0.001 + index) * 0.01
    } else {
      opacity = 1 - exitProgress
      translateY = -exitProgress * 15
      scale = 1 - exitProgress * 0.05
    }

    // Floral color accent dots on either side
    const accentColors = ['#d4956a', '#8faf7e', '#c4849a', '#b8a066']
    const accent = accentColors[index % accentColors.length]

    return (
      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: `translate(-50%, -50%) translateY(${translateY}px) scale(${scale})`,
          opacity,
          display: 'flex',
          alignItems: 'center',
          gap: 16,
        }}
      >
        {/* Left accent dot */}
        <div
          style={{
            width: 6,
            height: 6,
            borderRadius: '50%',
            background: accent,
            opacity: 0.5,
            flexShrink: 0,
          }}
        />
        <div
          style={{
            fontFamily: "'Georgia', 'Palatino', cursive, serif",
            fontSize: 'clamp(36px, 9vw, 120px)',
            fontWeight: 400,
            fontStyle: 'italic',
            letterSpacing: 2,
            color,
            whiteSpace: 'nowrap',
            textShadow: '0 1px 2px rgba(0,0,0,0.06)',
          }}
        >
          {word}
        </div>
        {/* Right accent dot */}
        <div
          style={{
            width: 6,
            height: 6,
            borderRadius: '50%',
            background: accent,
            opacity: 0.5,
            flexShrink: 0,
          }}
        />
      </div>
    )
  },
}

function CottagecoreComponent(props: MotionGraphicProps<CottagecoreConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-cottagecore',
  title: 'Kinetic Cottagecore',
  description: 'Soft cottagecore aesthetic with handwritten-style font, floating petal dots, warm cream background, and gentle fade-in',
  tags: ['kinetic', 'typography', 'cottagecore', 'soft', 'pastoral', 'warm', 'aesthetic'],
  category: 'captions',
  component: CottagecoreComponent as any,
  defaultConfig: {
    words: ['BLOOM', 'WANDER', 'LIGHT', 'HOME'],
    colors: ['#4a6741', '#4a6741', '#4a6741', '#4a6741'],
    bgColor: '#faf5e8',
    cycleDuration: 1.4,
  },
  configSchema: [
    { key: 'words', label: 'Words', type: 'text-array', defaultValue: ['BLOOM', 'WANDER', 'LIGHT', 'HOME'], group: 'Content' },
    { key: 'colors', label: 'Colors', type: 'text-array', defaultValue: ['#4a6741', '#4a6741', '#4a6741', '#4a6741'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#faf5e8', group: 'Style' },
    { key: 'cycleDuration', label: 'Cycle Duration (s)', type: 'number', defaultValue: 1.4, min: 0.3, max: 5, group: 'Timing' },
  ],
})
