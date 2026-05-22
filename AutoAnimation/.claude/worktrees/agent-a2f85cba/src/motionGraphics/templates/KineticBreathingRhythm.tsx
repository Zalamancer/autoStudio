import { registerMotionGraphic } from '../registry'
import {
  KineticBase,
  type KineticBaseConfig,
  type KineticAnimation,
  type WordRenderProps,
  type BackgroundRenderProps,
} from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface BreathingRhythmConfig extends KineticBaseConfig {
  breathColor: string
}

function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3)
}

const animation: KineticAnimation = {
  renderBackground: ({ bgColor, width, height, frame, fps }: BackgroundRenderProps) => {
    const time = frame / fps
    // Breathing: 4s inhale, 4s exhale = 0.125 Hz
    const breathFreq = 0.15
    const breathPhase = (time * breathFreq) % 1
    // Smooth sine: 0=exhale, 1=inhale
    const breathAmt = (Math.sin(breathPhase * Math.PI * 2 - Math.PI / 2) + 1) / 2

    const innerRadius = 15 + breathAmt * 25
    const outerGlow = breathAmt * 0.2

    return (
      <div style={{ position: 'absolute', inset: 0, background: bgColor }}>
        {/* Breathing gradient — expands and contracts */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: `radial-gradient(ellipse at 50% 50%,
              rgba(120,200,160,${outerGlow}) 0%,
              rgba(60,160,120,${outerGlow * 0.5}) ${innerRadius}%,
              transparent ${innerRadius + 30}%)`,
          }}
        />
        {/* Concentric breathing circles */}
        {[0, 1, 2, 3].map((i) => {
          const dim = Math.min(width, height)
          const ringSize = dim * (0.15 + i * 0.18 + breathAmt * 0.12)
          const opacity = (0.12 - i * 0.025) * (0.4 + breathAmt * 0.6)
          return (
            <div
              key={i}
              style={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                width: ringSize,
                height: ringSize,
                borderRadius: '50%',
                border: `${1.5 - i * 0.2}px solid rgba(100,200,150,${opacity})`,
                transform: 'translate(-50%, -50%)',
              }}
            />
          )
        })}
        {/* Subtle particle mist on exhale */}
        {Array.from({ length: 8 }).map((_, i) => {
          const angle = (i / 8) * Math.PI * 2
          const dist = (0.15 + (1 - breathAmt) * 0.25) * Math.min(width, height)
          const px = width * 0.5 + Math.cos(angle) * dist
          const py = height * 0.5 + Math.sin(angle) * dist
          const pOp = (1 - breathAmt) * 0.12
          return (
            <div
              key={i}
              style={{
                position: 'absolute',
                left: px,
                top: py,
                width: 4,
                height: 4,
                borderRadius: '50%',
                background: `rgba(120,220,160,${pOp})`,
                transform: 'translate(-50%, -50%)',
              }}
            />
          )
        })}
      </div>
    )
  },

  renderWord: ({ word, color, enterProgress, exitProgress, phase, frame = 0 }: WordRenderProps) => {
    const time = frame / 30
    const breathFreq = 0.15
    const breathPhase = (time * breathFreq) % 1
    const breathAmt = (Math.sin(breathPhase * Math.PI * 2 - Math.PI / 2) + 1) / 2

    let opacity = 1
    let scale = 1
    let letterSpacing = 0.08

    if (phase === 'enter') {
      const eased = easeOutCubic(enterProgress)
      opacity = eased
      scale = 0.9 + 0.1 * eased
    } else if (phase === 'hold') {
      // Scale and letter spacing breathe with inhale/exhale
      scale = 1 + breathAmt * 0.08
      letterSpacing = 0.05 + breathAmt * 0.12
      opacity = 0.7 + breathAmt * 0.3
    } else {
      opacity = 1 - exitProgress
      scale = 1 - exitProgress * 0.1
    }

    return (
      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: `translate(-50%, -50%) scale(${scale})`,
          opacity,
          fontSize: 'clamp(40px, 10vw, 134px)',
          fontWeight: 300,
          color,
          whiteSpace: 'nowrap',
          fontFamily: "'Helvetica Neue', 'Arial', sans-serif",
          textTransform: 'uppercase',
          letterSpacing: `${letterSpacing}em`,
          textShadow: `0 0 40px ${color}60, 0 2px 16px rgba(0,0,0,0.5)`,
          zIndex: 10,
        }}
      >
        {word}
      </div>
    )
  },
}

function BreathingRhythmComponent(props: MotionGraphicProps<BreathingRhythmConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-breathing-rhythm',
  title: 'Kinetic Breathing Rhythm',
  description:
    'Text inhales and exhales with gentle letter-spacing swell. Concentric rings expand on inhale, mist particles drift on exhale. Perfect for lo-fi and ambient.',
  tags: ['kinetic', 'music', 'breathing', 'rhythm', 'ambient', 'lofi', 'pulse', 'calm', 'swell'],
  category: 'captions',
  component: BreathingRhythmComponent as any,
  defaultConfig: {
    words: ['INHALE', 'EXHALE', 'FLOW', 'CALM'],
    colors: ['#78C8A0', '#60B888', '#90D8B8', '#50A878'],
    bgColor: '#030A06',
    cycleDuration: 2.0,
    breathColor: '#78C8A0',
  },
  configSchema: [
    {
      key: 'words',
      label: 'Words',
      type: 'text-array',
      defaultValue: ['INHALE', 'EXHALE', 'FLOW', 'CALM'],
      group: 'Content',
    },
    {
      key: 'colors',
      label: 'Colors',
      type: 'text-array',
      defaultValue: ['#78C8A0', '#60B888', '#90D8B8', '#50A878'],
      group: 'Style',
    },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#030A06', group: 'Style' },
    {
      key: 'cycleDuration',
      label: 'Cycle Duration (s)',
      type: 'number',
      defaultValue: 2.0,
      min: 0.5,
      max: 6,
      group: 'Timing',
    },
    { key: 'breathColor', label: 'Breath Color', type: 'color', defaultValue: '#78C8A0', group: 'Animation' },
  ],
})
