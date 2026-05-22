import { registerMotionGraphic } from '../registry'
import { KineticBase, type KineticBaseConfig, type KineticAnimation, type WordRenderProps, type BackgroundRenderProps } from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface ZenBreathConfig extends KineticBaseConfig {
  breathSpeed: number
}

function easeInOutSine(t: number): number {
  return -(Math.cos(Math.PI * t) - 1) / 2
}

const animation: KineticAnimation = {
  renderBackground: ({ bgColor, width, height, frame, fps }: BackgroundRenderProps) => {
    const time = frame / fps
    const breathCycle = easeInOutSine((Math.sin(time * 0.5) + 1) / 2)
    const ringCount = 5

    return (
      <div style={{ position: 'absolute', inset: 0, background: bgColor }}>
        {/* Concentric breathing rings */}
        {Array.from({ length: ringCount }, (_, i) => {
          const baseSize = Math.min(width, height) * 0.15 * (i + 1)
          const expandAmount = baseSize * 0.15 * breathCycle
          const size = baseSize + expandAmount
          const delay = i * 0.12
          const delayedBreath = easeInOutSine((Math.sin(time * 0.5 - delay) + 1) / 2)
          const opacity = 0.06 - i * 0.008

          return (
            <div
              key={i}
              style={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                width: size,
                height: size,
                transform: `translate(-50%, -50%) scale(${0.95 + delayedBreath * 0.1})`,
                borderRadius: '50%',
                border: `1px solid rgba(255,255,255,${opacity + delayedBreath * 0.04})`,
                background: `radial-gradient(circle, rgba(255,255,255,${opacity * 0.3}) 0%, transparent 70%)`,
              }}
            />
          )
        })}

        {/* Soft ambient particles */}
        {Array.from({ length: 8 }, (_, i) => {
          const angle = (i / 8) * Math.PI * 2 + time * 0.15
          const radius = Math.min(width, height) * (0.25 + Math.sin(time * 0.3 + i) * 0.08)
          const x = Math.cos(angle) * radius + width / 2
          const y = Math.sin(angle) * radius + height / 2
          const particleOpacity = 0.15 + Math.sin(time * 0.8 + i * 1.5) * 0.1

          return (
            <div
              key={`p-${i}`}
              style={{
                position: 'absolute',
                left: x,
                top: y,
                width: 4,
                height: 4,
                borderRadius: '50%',
                background: `rgba(255,255,255,${particleOpacity})`,
                boxShadow: `0 0 8px rgba(255,255,255,${particleOpacity * 0.5})`,
                transform: 'translate(-50%, -50%)',
              }}
            />
          )
        })}
      </div>
    )
  },

  renderWord: ({ word, color, enterProgress, holdProgress, exitProgress, phase, index, width, height, frame = 0 }: WordRenderProps) => {
    const time = frame / 30
    const breathCycle = easeInOutSine((Math.sin(time * 0.5) + 1) / 2)

    let opacity = 0
    let scale = 1
    let letterSpacingPx = 0

    if (phase === 'enter') {
      const eased = easeInOutSine(enterProgress)
      opacity = eased
      scale = 0.85 + eased * 0.15
      letterSpacingPx = (1 - eased) * 20
    } else if (phase === 'hold') {
      opacity = 1
      // Breathing scale animation during hold
      scale = 1 + breathCycle * 0.08
      letterSpacingPx = breathCycle * 6
    } else {
      const eased = easeInOutSine(exitProgress)
      opacity = 1 - eased
      scale = 1 + eased * 0.15
      letterSpacingPx = eased * 15
    }

    return (
      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: `translate(-50%, -50%) scale(${scale})`,
          opacity,
          fontFamily: "'Georgia', 'Times New Roman', serif",
          fontSize: 'clamp(36px, 10vw, 120px)',
          fontWeight: 300,
          letterSpacing: letterSpacingPx,
          whiteSpace: 'nowrap',
          color,
          textShadow: `0 0 30px ${color}40, 0 0 60px ${color}20`,
          transition: 'letter-spacing 0.3s ease',
        }}
      >
        {word}
      </div>
    )
  },
}

function ZenBreathComponent(props: MotionGraphicProps<ZenBreathConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-zen-breath',
  title: 'Kinetic Zen Breath',
  description: 'Calm breathing text animation with expanding/contracting scale, concentric breath rings, and floating particles',
  tags: ['kinetic', 'typography', 'meditation', 'breathing', 'zen', 'calm', 'mindfulness', 'wellness'],
  category: 'captions',
  component: ZenBreathComponent as any,
  defaultConfig: {
    words: ['BREATHE', 'RELEASE', 'CALM', 'PEACE'],
    colors: ['#a8d8ea', '#c4e0f9', '#e0d4f5', '#d4f0e0'],
    bgColor: '#0f1724',
    cycleDuration: 2.0,
    breathSpeed: 0.5,
  },
  configSchema: [
    { key: 'words', label: 'Words', type: 'text-array', defaultValue: ['BREATHE', 'RELEASE', 'CALM', 'PEACE'], group: 'Content' },
    { key: 'colors', label: 'Colors', type: 'text-array', defaultValue: ['#a8d8ea', '#c4e0f9', '#e0d4f5', '#d4f0e0'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#0f1724', group: 'Style' },
    { key: 'cycleDuration', label: 'Cycle Duration (s)', type: 'number', defaultValue: 2.0, min: 0.5, max: 5, group: 'Timing' },
    { key: 'breathSpeed', label: 'Breath Speed', type: 'number', defaultValue: 0.5, min: 0.1, max: 2, group: 'Timing' },
  ],
})
