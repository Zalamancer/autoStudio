import { registerMotionGraphic } from '../registry'
import {
  KineticBase,
  type KineticBaseConfig,
  type KineticAnimation,
  type WordRenderProps,
  type BackgroundRenderProps,
} from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface RecycleFlowConfig extends KineticBaseConfig {}

function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3)
}

function easeInOutCubic(t: number): number {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2
}

const animation: KineticAnimation = {
  renderBackground: ({ bgColor }: BackgroundRenderProps) => (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        background: `linear-gradient(135deg, ${bgColor}, #0a2a1a)`,
      }}
    />
  ),

  renderWord: ({
    word,
    color,
    enterProgress,
    holdProgress,
    exitProgress,
    phase,
    frame = 0,
  }: WordRenderProps) => {
    let opacity = 1
    let textScale = 1

    if (phase === 'enter') {
      opacity = easeOutCubic(enterProgress)
      textScale = 0.4 + easeOutCubic(enterProgress) * 0.6
    } else if (phase === 'hold') {
      textScale = 1
    } else {
      opacity = 1 - exitProgress * exitProgress
      textScale = 1 - exitProgress * 0.3
    }

    const time = frame * 0.025

    // Three recycling arrows forming a triangle, rotating
    const arrowCount = 3
    const rotationBase = phase === 'hold'
      ? holdProgress * 360 * 2
      : phase === 'enter'
        ? easeInOutCubic(enterProgress) * 120
        : 240 + exitProgress * 120

    const cycleRadius = phase === 'enter'
      ? 90 + easeOutCubic(enterProgress) * 50
      : phase === 'exit'
        ? 140 - exitProgress * 40
        : 140 + Math.sin(time * 1.5) * 8

    const arrowOpacity = phase === 'enter'
      ? easeOutCubic(Math.max(0, (enterProgress - 0.2) / 0.6))
      : phase === 'exit'
        ? 1 - exitProgress
        : 0.7 + Math.sin(time * 2) * 0.15

    // Flow particles along the recycle path
    const particleCount = 9
    const particles = Array.from({ length: particleCount }, (_, i) => {
      const baseAngle = (i / particleCount) * Math.PI * 2
      const flowAngle = baseAngle + time * 1.2
      const px = Math.cos(flowAngle) * cycleRadius
      const py = Math.sin(flowAngle) * cycleRadius * 0.7
      const pOpacity = phase === 'hold'
        ? 0.4 + Math.sin(time * 3 + i * 0.7) * 0.3
        : phase === 'enter'
          ? easeOutCubic(Math.max(0, enterProgress - 0.4)) * 0.5
          : 0.5 * (1 - exitProgress)
      return { x: px, y: py, opacity: pOpacity, size: 4 + Math.sin(time * 2 + i) * 2 }
    })

    return (
      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          opacity,
        }}
      >
        {/* Recycle symbol arrows */}
        {Array.from({ length: arrowCount }, (_, i) => {
          const angle = (i / arrowCount) * 360 + rotationBase
          const rad = (angle * Math.PI) / 180
          const ax = Math.cos(rad) * cycleRadius
          const ay = Math.sin(rad) * cycleRadius * 0.7
          const arrowRotate = angle + 90

          return (
            <div
              key={`arrow-${i}`}
              style={{
                position: 'absolute',
                left: `calc(50% + ${ax}px)`,
                top: `calc(50% + ${ay}px)`,
                transform: `translate(-50%, -50%) rotate(${arrowRotate}deg)`,
                opacity: arrowOpacity,
                pointerEvents: 'none',
              }}
            >
              {/* Arrow body */}
              <div
                style={{
                  width: '32px',
                  height: '6px',
                  background: `linear-gradient(90deg, #4CAF50, #66BB6A)`,
                  borderRadius: '3px',
                  boxShadow: '0 0 8px rgba(76,175,80,0.4)',
                }}
              />
              {/* Arrow head */}
              <div
                style={{
                  position: 'absolute',
                  right: '-8px',
                  top: '-6px',
                  width: 0,
                  height: 0,
                  borderLeft: '12px solid #66BB6A',
                  borderTop: '9px solid transparent',
                  borderBottom: '9px solid transparent',
                  filter: 'drop-shadow(0 0 4px rgba(76,175,80,0.5))',
                }}
              />
            </div>
          )
        })}

        {/* Flow particles */}
        {particles.map((p, i) => (
          <div
            key={`p-${i}`}
            style={{
              position: 'absolute',
              left: `calc(50% + ${p.x}px)`,
              top: `calc(50% + ${p.y}px)`,
              width: `${p.size}px`,
              height: `${p.size}px`,
              borderRadius: '50%',
              background: '#81C784',
              opacity: p.opacity,
              boxShadow: '0 0 6px rgba(129,199,132,0.5)',
              transform: 'translate(-50%, -50%)',
              pointerEvents: 'none',
            }}
          />
        ))}

        {/* Main text */}
        <div
          style={{
            fontFamily: "'Trebuchet MS', 'Arial', sans-serif",
            fontSize: 'clamp(36px, 9vw, 110px)',
            fontWeight: 900,
            color,
            transform: `scale(${textScale})`,
            textShadow: '0 2px 10px rgba(76,175,80,0.35), 0 0 20px rgba(76,175,80,0.15)',
            whiteSpace: 'nowrap',
            position: 'relative',
            zIndex: 1,
            letterSpacing: '0.02em',
          }}
        >
          {word}
        </div>
      </div>
    )
  },
}

function RecycleFlowComponent(props: MotionGraphicProps<RecycleFlowConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-recycle-flow',
  title: 'Recycle Flow',
  description:
    'Text cycling through a rotating recycle symbol. Three arrows orbit the word with flowing green particles tracing the recycle path.',
  tags: ['kinetic', 'recycle', 'eco', 'sustainability', 'green', 'loop', 'circular'],
  category: 'captions',
  component: RecycleFlowComponent as any,
  defaultConfig: {
    words: ['RECYCLE', 'REUSE', 'REDUCE', 'RENEW'],
    colors: ['#A5D6A7', '#81C784', '#C8E6C9', '#66BB6A'],
    bgColor: '#0D1F0D',
    cycleDuration: 2,
  },
  configSchema: [
    {
      key: 'words',
      label: 'Words',
      type: 'text-array',
      defaultValue: ['RECYCLE', 'REUSE', 'REDUCE', 'RENEW'],
      group: 'Content',
    },
    {
      key: 'colors',
      label: 'Colors',
      type: 'text-array',
      defaultValue: ['#A5D6A7', '#81C784', '#C8E6C9', '#66BB6A'],
      group: 'Style',
    },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#0D1F0D', group: 'Style' },
    {
      key: 'cycleDuration',
      label: 'Cycle Duration (s)',
      type: 'number',
      defaultValue: 2,
      min: 0.5,
      max: 5,
      group: 'Timing',
    },
  ],
})
