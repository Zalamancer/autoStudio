import { registerMotionGraphic } from '../registry'
import {
  KineticBase,
  type KineticBaseConfig,
  type KineticAnimation,
  type WordRenderProps,
  type BackgroundRenderProps,
} from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface SizzlePopConfig extends KineticBaseConfig {}

const animation: KineticAnimation = {
  renderBackground: ({ bgColor, frame, fps }: BackgroundRenderProps) => {
    const time = frame / fps

    // Steam wisps rising
    const steamWisps = Array.from({ length: 12 }, (_, i) => {
      const seed = i * 31 + 7
      const x = 20 + ((seed * 11) % 60)
      const baseY = 100 - ((time * 8 + i * 12) % 120)
      const sway = Math.sin(time * 2 + i * 1.5) * 8
      const opacity = Math.max(0, 0.08 - Math.abs(baseY - 50) * 0.002)
      const size = 20 + (seed % 30)
      return (
        <div
          key={i}
          style={{
            position: 'absolute',
            left: `calc(${x}% + ${sway}px)`,
            top: `${baseY}%`,
            width: size,
            height: size * 1.5,
            borderRadius: '50%',
            background: `radial-gradient(ellipse, rgba(255,255,255,${opacity}), transparent)`,
            filter: 'blur(8px)',
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
          background: bgColor === '#1A0A00'
            ? 'linear-gradient(180deg, #1A0A00 0%, #2D1200 40%, #3D1A00 70%, #1A0A00 100%)'
            : bgColor,
        }}
      >
        {steamWisps}
        {/* Hot glow at bottom */}
        <div
          style={{
            position: 'absolute',
            left: '20%',
            right: '20%',
            bottom: 0,
            height: '35%',
            background: 'radial-gradient(ellipse at center bottom, rgba(255,80,0,0.12) 0%, transparent 70%)',
            pointerEvents: 'none',
          }}
        />
        {/* Spark particles */}
        {Array.from({ length: 8 }, (_, i) => {
          const seed = i * 53 + 3
          const x = 30 + ((seed * 7) % 40)
          const phase = (time * 3 + i * 0.8) % 2
          const y = 80 - phase * 40
          const sparkOpacity = phase < 0.5 ? phase * 2 : Math.max(0, 2 - phase * 2)
          return (
            <div
              key={`spark-${i}`}
              style={{
                position: 'absolute',
                left: `${x}%`,
                top: `${y}%`,
                width: 3,
                height: 3,
                borderRadius: '50%',
                background: '#FF8C00',
                boxShadow: '0 0 4px #FF6600, 0 0 8px #FF4400',
                opacity: sparkOpacity * 0.6,
                pointerEvents: 'none',
              }}
            />
          )
        })}
      </div>
    )
  },

  renderWord: ({ word, color, enterProgress, exitProgress, phase, index, frame }: WordRenderProps) => {
    const f = frame ?? 0
    let opacity = 0
    let scale = 1
    let translateY = 0

    if (phase === 'enter') {
      // Sizzle in: rapid scale bursts
      if (enterProgress < 0.2) {
        scale = 0.3
        opacity = enterProgress * 5
      } else if (enterProgress < 0.35) {
        const t = (enterProgress - 0.2) / 0.15
        scale = 0.3 + t * 1.0
        opacity = 1
      } else if (enterProgress < 0.5) {
        const t = (enterProgress - 0.35) / 0.15
        scale = 1.3 - t * 0.5
        opacity = 1
      } else if (enterProgress < 0.65) {
        const t = (enterProgress - 0.5) / 0.15
        scale = 0.8 + t * 0.35
        opacity = 1
      } else {
        const t = (enterProgress - 0.65) / 0.35
        scale = 1.15 - t * 0.15
        opacity = 1
      }
    } else if (phase === 'hold') {
      opacity = 1
      // Sizzle vibration
      const vibrate = Math.sin(f * 0.8 + index * 2) * 1.5
      translateY = vibrate
      scale = 1 + Math.sin(f * 0.3) * 0.02
    } else {
      // Pop off: burst outward
      opacity = 1 - Math.pow(exitProgress, 0.5)
      scale = 1 + exitProgress * 0.8
    }

    const heatGlow = phase === 'hold'
      ? `0 0 20px rgba(255,100,0,${0.3 + Math.sin(f * 0.15) * 0.15})`
      : '0 0 15px rgba(255,100,0,0.3)'

    return (
      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: `translate(-50%, -50%) scale(${scale}) translateY(${translateY}px)`,
          opacity,
          fontFamily: "'Impact', 'Arial Black', sans-serif",
          fontSize: 'clamp(40px, 12vw, 150px)',
          fontWeight: 900,
          textTransform: 'uppercase',
          letterSpacing: 3,
          color: 'transparent',
          backgroundImage: `linear-gradient(180deg, #FFD700 0%, ${color} 40%, #FF4500 80%, #8B0000 100%)`,
          backgroundClip: 'text',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          filter: `drop-shadow(${heatGlow})`,
          whiteSpace: 'nowrap',
        }}
      >
        {word}
        {/* Heat shimmer effect */}
        {phase !== 'exit' && (
          <div
            style={{
              position: 'absolute',
              top: '-20%',
              left: '10%',
              right: '10%',
              height: '40%',
              background: 'linear-gradient(0deg, rgba(255,140,0,0.08), transparent)',
              filter: 'blur(4px)',
              transform: `translateY(${Math.sin(f * 0.1) * 5}px)`,
              pointerEvents: 'none',
            }}
          />
        )}
      </div>
    )
  },
}

function SizzlePopComponent(props: MotionGraphicProps<SizzlePopConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-sizzle-pop',
  title: 'Sizzle Pop',
  description: 'Text sizzles and pops like hot cooking with heat gradients, steam wisps, spark particles, and vibration hold animation',
  tags: ['kinetic', 'food', 'cooking', 'sizzle', 'hot', 'fire', 'restaurant', 'bbq'],
  category: 'captions',
  component: SizzlePopComponent as any,
  defaultConfig: {
    words: ['SIZZLE', 'FRESH', 'HOT', 'CRISPY'],
    colors: ['#FF6B00', '#FF8C00', '#FF4500', '#FF6B00'],
    bgColor: '#1A0A00',
    cycleDuration: 1.3,
  },
  configSchema: [
    { key: 'words', label: 'Words', type: 'text-array', defaultValue: ['SIZZLE', 'FRESH', 'HOT', 'CRISPY'], group: 'Content' },
    { key: 'colors', label: 'Colors', type: 'text-array', defaultValue: ['#FF6B00', '#FF8C00', '#FF4500', '#FF6B00'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#1A0A00', group: 'Style' },
    { key: 'cycleDuration', label: 'Cycle Duration (s)', type: 'number', defaultValue: 1.3, min: 0.3, max: 5, group: 'Timing' },
  ],
})
