import { registerMotionGraphic } from '../registry'
import {
  KineticBase,
  type KineticBaseConfig,
  type KineticAnimation,
  type WordRenderProps,
  type BackgroundRenderProps,
} from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

// Subtle upward rise: text floats up a small distance while fading in,
// holds perfectly still, then fades out with a tiny upward drift.
// The motion is barely perceptible after the first word — the eye reads
// the text, not the animation.

interface RiseConfig extends KineticBaseConfig {}

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
    const RISE_PX = 10 // tiny travel distance — perceptible but never distracting

    let translateY: number
    let opacity: number

    if (phase === 'enter') {
      const ep = easeOutCubic(enterProgress)
      translateY = RISE_PX * (1 - ep)  // starts below center, rises to 0
      opacity = ep
    } else if (phase === 'hold') {
      translateY = 0
      opacity = 1
    } else {
      const ep = easeInCubic(exitProgress)
      translateY = -RISE_PX * ep  // continues upward on exit
      opacity = 1 - ep
    }

    return (
      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: `translate(-50%, calc(-50% + ${translateY.toFixed(2)}px))`,
          opacity,
          willChange: 'transform, opacity',
        }}
      >
        <div
          style={{
            fontFamily: "'Inter', 'Helvetica Neue', Helvetica, sans-serif",
            fontSize: 'clamp(36px, 8vw, 120px)',
            fontWeight: 300,
            letterSpacing: '0.04em',
            color,
            whiteSpace: 'nowrap',
          }}
        >
          {word}
        </div>
      </div>
    )
  },
}

function RiseComponent(props: MotionGraphicProps<RiseConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-rise',
  title: 'Rise',
  description: 'Text floats up 10px while fading in, holds perfectly still, then continues rising while fading out. Minimal motion — the eye reads content, not animation.',
  tags: ['kinetic', 'typography', 'subtitle', 'caption', 'rise', 'float', 'fade', 'minimal', 'clean', 'fast'],
  category: 'captions',
  component: RiseComponent as any,
  defaultConfig: {
    words: ['HELLO', 'WORLD', 'NICE', 'DAY'],
    colors: ['#111111', '#333333', '#111111', '#333333'],
    bgColor: '#ffffff',
    cycleDuration: 1.0,
  },
  configSchema: [
    {
      key: 'words',
      label: 'Words',
      type: 'text-array',
      defaultValue: ['HELLO', 'WORLD', 'NICE', 'DAY'],
      group: 'Content',
    },
    {
      key: 'colors',
      label: 'Colors',
      type: 'text-array',
      defaultValue: ['#111111', '#333333', '#111111', '#333333'],
      group: 'Style',
    },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#ffffff', group: 'Style' },
    {
      key: 'cycleDuration',
      label: 'Cycle Duration (s)',
      type: 'number',
      defaultValue: 1.0,
      min: 0.5,
      max: 5,
      group: 'Timing',
    },
  ],
})
