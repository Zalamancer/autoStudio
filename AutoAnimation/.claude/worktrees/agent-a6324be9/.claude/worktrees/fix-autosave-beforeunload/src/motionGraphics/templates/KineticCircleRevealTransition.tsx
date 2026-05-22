import { registerMotionGraphic } from '../registry'
import {
  KineticBase,
  type KineticBaseConfig,
  type KineticAnimation,
  type WordRenderProps,
  type BackgroundRenderProps,
} from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface CircleRevealConfig extends KineticBaseConfig {
  irisColor: string
}

function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3)
}

function easeInCubic(t: number): number {
  return t * t * t
}

const animation: KineticAnimation = {
  renderBackground: ({ bgColor }: BackgroundRenderProps) => (
    <div style={{ position: 'absolute', inset: 0, background: bgColor }} />
  ),

  renderWord: ({ word, color, enterProgress, exitProgress, phase }: WordRenderProps) => {
    let irisRadius = 0 // percentage for clip-path circle

    if (phase === 'enter') {
      irisRadius = easeOutCubic(enterProgress) * 75
    } else if (phase === 'hold') {
      irisRadius = 75
    } else {
      irisRadius = 75 * (1 - easeInCubic(exitProgress))
    }

    const edgeGlow = irisRadius > 1 && irisRadius < 74

    return (
      <div style={{ position: 'absolute', inset: 0 }}>
        {/* Content clipped by circle iris */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            clipPath: `circle(${irisRadius}% at 50% 50%)`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {/* Dark panel behind text */}
          <div
            style={{
              position: 'absolute',
              inset: 0,
              background: '#111118',
            }}
          />
          {/* Word */}
          <div
            style={{
              position: 'relative',
              fontFamily: "'Impact', 'Arial Black', sans-serif",
              fontSize: 'clamp(40px, 12vw, 160px)',
              fontWeight: 900,
              color,
              whiteSpace: 'nowrap',
              textShadow: '0 0 20px rgba(255,215,0,0.2), 0 2px 4px rgba(0,0,0,0.5)',
            }}
          >
            {word}
          </div>
        </div>
        {/* Golden iris edge ring */}
        {edgeGlow && (
          <div
            style={{
              position: 'absolute',
              inset: 0,
              background: `radial-gradient(circle at 50% 50%, transparent ${Math.max(0, irisRadius - 1.5)}%, rgba(255,215,0,0.5) ${irisRadius}%, rgba(255,215,0,0.15) ${irisRadius + 0.8}%, transparent ${irisRadius + 2}%)`,
              pointerEvents: 'none',
            }}
          />
        )}
      </div>
    )
  },
}

function CircleRevealTransitionComponent(props: MotionGraphicProps<CircleRevealConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-circle-reveal-transition',
  title: 'Kinetic Circle Reveal',
  description: 'Cinematic iris wipe — a circle opens from center to reveal each word, with a golden glowing edge',
  tags: ['kinetic', 'typography', 'transition', 'iris', 'circle', 'cinematic'],
  category: 'captions',
  component: CircleRevealTransitionComponent as any,
  defaultConfig: {
    words: ['REVEAL', 'FOCUS', 'FRAME', 'IRIS'],
    colors: ['#FFFFFF', '#FFFFFF', '#FFFFFF', '#FFFFFF'],
    bgColor: '#1a1a28',
    cycleDuration: 1.5,
    irisColor: '#FFD700',
  },
  configSchema: [
    { key: 'words', label: 'Words', type: 'text-array', defaultValue: ['REVEAL', 'FOCUS', 'FRAME'], group: 'Content' },
    {
      key: 'colors',
      label: 'Colors',
      type: 'text-array',
      defaultValue: ['#FFFFFF', '#FFFFFF', '#FFFFFF'],
      group: 'Style',
    },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#1a1a28', group: 'Style' },
    {
      key: 'cycleDuration',
      label: 'Cycle Duration (s)',
      type: 'number',
      defaultValue: 1.5,
      min: 0.3,
      max: 5,
      group: 'Timing',
    },
    { key: 'irisColor', label: 'Iris Edge Color', type: 'color', defaultValue: '#FFD700', group: 'Animation' },
  ],
})
