import { registerMotionGraphic } from '../registry'
import {
  KineticBase,
  type KineticBaseConfig,
  type KineticAnimation,
  type WordRenderProps,
  type BackgroundRenderProps,
} from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface ConcentricRingsConfig extends KineticBaseConfig {
  ringColor: string
}

function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3)
}

function easeInCubic(t: number): number {
  return t * t * t
}

const RING_COUNT = 6

const animation: KineticAnimation = {
  renderBackground: ({ bgColor }: BackgroundRenderProps) => (
    <div style={{ position: 'absolute', inset: 0, background: bgColor }} />
  ),

  renderWord: ({ word, color, enterProgress, holdProgress, exitProgress, phase, width, height }: WordRenderProps) => {
    const cx = width / 2
    const cy = height / 2
    const maxRadius = Math.min(width, height) * 0.45

    const rings = Array.from({ length: RING_COUNT }, (_, i) => {
      const ringFraction = (i + 1) / RING_COUNT
      const targetRadius = maxRadius * ringFraction
      const staggerDelay = i * 0.12

      let radius = 0
      let ringOpacity = 0
      let rotation = 0

      if (phase === 'enter') {
        const delayed = Math.max(0, (enterProgress - staggerDelay) / (1 - staggerDelay))
        radius = easeOutCubic(delayed) * targetRadius
        ringOpacity = easeOutCubic(delayed) * 0.6
      } else if (phase === 'hold') {
        radius = targetRadius
        ringOpacity = 0.4 + Math.sin(holdProgress * Math.PI * 2 + i) * 0.15
        // Each ring rotates at different speed
        rotation = holdProgress * (60 + i * 25) * (i % 2 === 0 ? 1 : -1)
      } else {
        const delayed = Math.max(0, (exitProgress - (RING_COUNT - 1 - i) * 0.1) / (1 - (RING_COUNT - 1 - i) * 0.1))
        radius = targetRadius * (1 - easeInCubic(delayed))
        ringOpacity = 0.6 * (1 - easeInCubic(delayed))
        rotation = 60 * (i % 2 === 0 ? 1 : -1)
      }

      const circumference = 2 * Math.PI * radius
      // Each ring has a gap (partial stroke)
      const dashLength = circumference * (0.6 + i * 0.05)
      const gapLength = circumference - dashLength

      return (
        <circle
          key={i}
          cx={cx}
          cy={cy}
          r={Math.max(0.1, radius)}
          fill="none"
          stroke="rgba(180,140,255,0.8)"
          strokeWidth={1.5 + (RING_COUNT - i) * 0.3}
          strokeDasharray={`${dashLength} ${gapLength}`}
          opacity={ringOpacity}
          style={{
            transform: `rotate(${rotation}deg)`,
            transformOrigin: `${cx}px ${cy}px`,
          }}
        />
      )
    })

    let textOpacity = 0
    let textScale = 0.9

    if (phase === 'enter') {
      textOpacity = easeOutCubic(Math.max(0, (enterProgress - 0.4) / 0.6))
      textScale = 0.9 + easeOutCubic(Math.max(0, (enterProgress - 0.4) / 0.6)) * 0.1
    } else if (phase === 'hold') {
      textOpacity = 1
      textScale = 1
    } else {
      textOpacity = 1 - easeInCubic(exitProgress)
      textScale = 1 - easeInCubic(exitProgress) * 0.1
    }

    return (
      <div style={{ position: 'absolute', inset: 0 }}>
        <svg
          style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}
          viewBox={`0 0 ${width} ${height}`}
        >
          {rings}
        </svg>
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: `translate(-50%, -50%) scale(${textScale})`,
            opacity: textOpacity,
            fontFamily: "'Inter', 'Helvetica Neue', sans-serif",
            fontSize: 'clamp(36px, 9vw, 130px)',
            fontWeight: 800,
            color,
            whiteSpace: 'nowrap',
            textShadow: '0 0 20px rgba(180,140,255,0.4), 0 2px 8px rgba(0,0,0,0.5)',
          }}
        >
          {word}
        </div>
      </div>
    )
  },
}

function ConcentricRingsComponent(props: MotionGraphicProps<ConcentricRingsConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-concentric-rings',
  title: 'Kinetic Concentric Rings',
  description: 'Multiple concentric rings expand staggered from center. Rings rotate at different speeds during hold, then contract on exit.',
  tags: ['kinetic', 'typography', 'rings', 'concentric', 'geometric', 'circles', 'rotate'],
  category: 'captions',
  component: ConcentricRingsComponent as any,
  defaultConfig: {
    words: ['RINGS', 'ORBIT', 'SPIRAL', 'PULSE'],
    colors: ['#E8D0FF', '#FFFFFF', '#B48CFF', '#FFFFFF'],
    bgColor: '#0a0a18',
    cycleDuration: 1.6,
    ringColor: '#B48CFF',
  },
  configSchema: [
    { key: 'words', label: 'Words', type: 'text-array', defaultValue: ['RINGS', 'ORBIT', 'SPIRAL', 'PULSE'], group: 'Content' },
    { key: 'colors', label: 'Colors', type: 'text-array', defaultValue: ['#E8D0FF', '#FFFFFF', '#B48CFF', '#FFFFFF'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#0a0a18', group: 'Style' },
    { key: 'cycleDuration', label: 'Cycle Duration (s)', type: 'number', defaultValue: 1.6, min: 0.3, max: 5, group: 'Timing' },
    { key: 'ringColor', label: 'Ring Color', type: 'color', defaultValue: '#B48CFF', group: 'Animation' },
  ],
})
