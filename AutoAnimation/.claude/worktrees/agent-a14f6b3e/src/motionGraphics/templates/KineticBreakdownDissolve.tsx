import { registerMotionGraphic } from '../registry'
import {
  KineticBase,
  type KineticBaseConfig,
  type KineticAnimation,
  type WordRenderProps,
  type BackgroundRenderProps,
} from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface BreakdownDissolveConfig extends KineticBaseConfig {
  dissolveColor: string
}

function easeInOutSine(t: number): number {
  return -(Math.cos(Math.PI * t) - 1) / 2
}

function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3)
}

const animation: KineticAnimation = {
  renderBackground: ({ bgColor, width, height, frame, fps }: BackgroundRenderProps) => {
    const time = frame / fps
    // Breakdown: slow dissolve cycle — 3 second
    const dissolveFreq = 0.33
    const dissolvePhase = (time * dissolveFreq) % 1
    const dissolve = easeInOutSine(dissolvePhase)

    // Floating particle fragments dissolving up
    const numParticles = 20
    return (
      <div style={{ position: 'absolute', inset: 0, background: bgColor }}>
        {/* Dissolve fog layer */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: `linear-gradient(to top,
              ${bgColor} 0%,
              rgba(80,60,180,${dissolve * 0.12}) 40%,
              rgba(120,80,220,${dissolve * 0.06}) 70%,
              transparent 100%)`,
          }}
        />
        {/* Particle fragments floating upward */}
        {Array.from({ length: numParticles }).map((_, i) => {
          const seed = (i * 1.618) % 1
          const seed2 = (i * 2.414) % 1
          const xBase = seed * width
          const yBase = height * (0.9 - seed2 * 0.7)
          const floatOffset = (time * (0.3 + seed * 0.4) + i * 0.5) % 1
          const px = xBase + Math.sin(time * 0.5 + i) * 20
          const py = yBase - floatOffset * height * 0.6
          const pOp = Math.max(0, (1 - floatOffset) * dissolve * 0.4)
          const pSize = 2 + seed * 4
          return (
            <div
              key={i}
              style={{
                position: 'absolute',
                left: px,
                top: py,
                width: pSize,
                height: pSize,
                borderRadius: '50%',
                background: `rgba(${100 + Math.floor(seed * 80)},${60 + Math.floor(seed2 * 60)},220,${pOp})`,
                transform: 'translate(-50%, -50%)',
              }}
            />
          )
        })}
        {/* Ghostly scanlines */}
        {Array.from({ length: 8 }).map((_, i) => {
          const y = (i / 8) * 100
          return (
            <div
              key={i}
              style={{
                position: 'absolute',
                left: 0,
                right: 0,
                top: `${y}%`,
                height: 1,
                background: `rgba(100,80,200,${dissolve * 0.06})`,
              }}
            />
          )
        })}
      </div>
    )
  },

  renderWord: ({ word, color, enterProgress, exitProgress, phase, frame = 0 }: WordRenderProps) => {
    const time = frame / 30
    const dissolveFreq = 0.33
    const dissolvePhase = (time * dissolveFreq) % 1
    const dissolve = easeInOutSine(dissolvePhase)

    let opacity = 1
    let scale = 1
    let blur = 0
    let translateY = 0

    if (phase === 'enter') {
      const eased = easeOutCubic(enterProgress)
      opacity = eased
      scale = 0.95 + 0.05 * eased
    } else if (phase === 'hold') {
      // Breakdown dissolve: text fades in and out with rising fog
      opacity = 0.4 + dissolve * 0.6
      blur = (1 - dissolve) * 4
      translateY = -(1 - dissolve) * 8
      scale = 0.96 + dissolve * 0.04
    } else {
      opacity = 1 - exitProgress
      blur = exitProgress * 8
      translateY = -exitProgress * 20
    }

    return (
      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: `translate(-50%, calc(-50% + ${translateY}px)) scale(${scale})`,
          opacity,
          filter: blur > 0 ? `blur(${blur}px)` : undefined,
          fontSize: 'clamp(40px, 10vw, 135px)',
          fontWeight: 300,
          color,
          whiteSpace: 'nowrap',
          fontFamily: "'Helvetica Neue', 'Arial', sans-serif",
          textTransform: 'uppercase',
          letterSpacing: '0.2em',
          textShadow: `0 0 40px ${color}80, 0 2px 20px rgba(0,0,0,0.6)`,
          zIndex: 10,
        }}
      >
        {word}
      </div>
    )
  },
}

function BreakdownDissolveComponent(props: MotionGraphicProps<BreakdownDissolveConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-breakdown-dissolve',
  title: 'Kinetic Breakdown Dissolve',
  description:
    'The breakdown moment — text dissolves into soft focus as particle fragments float upward through rising purple fog. The calm between the build and the drop.',
  tags: ['kinetic', 'music', 'breakdown', 'dissolve', 'ambient', 'chill', 'float', 'fog', 'edm'],
  category: 'captions',
  component: BreakdownDissolveComponent as any,
  defaultConfig: {
    words: ['BREAK', 'DOWN', 'DRIFT', 'FLOAT'],
    colors: ['#9880FF', '#7860DD', '#B8A0FF', '#8870EE'],
    bgColor: '#04020E',
    cycleDuration: 1.8,
    dissolveColor: '#9880FF',
  },
  configSchema: [
    {
      key: 'words',
      label: 'Words',
      type: 'text-array',
      defaultValue: ['BREAK', 'DOWN', 'DRIFT', 'FLOAT'],
      group: 'Content',
    },
    {
      key: 'colors',
      label: 'Colors',
      type: 'text-array',
      defaultValue: ['#9880FF', '#7860DD', '#B8A0FF', '#8870EE'],
      group: 'Style',
    },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#04020E', group: 'Style' },
    {
      key: 'cycleDuration',
      label: 'Cycle Duration (s)',
      type: 'number',
      defaultValue: 1.8,
      min: 0.5,
      max: 6,
      group: 'Timing',
    },
    { key: 'dissolveColor', label: 'Dissolve Color', type: 'color', defaultValue: '#9880FF', group: 'Animation' },
  ],
})
