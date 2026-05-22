import { registerMotionGraphic } from '../registry'
import {
  KineticBase,
  type KineticBaseConfig,
  type KineticAnimation,
  type WordRenderProps,
  type BackgroundRenderProps,
} from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

// Scale snap: text pops in from 88% scale to 100% with a fast ease-out,
// holds dead still, then fades out cleanly. The scale enter takes only
// the first 20% of the cycle so it's over in ~0.2s — the viewer perceives
// a confident "snap" and immediately reads the word.

interface SnapInConfig extends KineticBaseConfig {}

// Fast deceleration — feels like a physical snap, not a float
function easeOutExpo(t: number): number {
  return t === 1 ? 1 : 1 - Math.pow(2, -10 * t)
}

function easeInQuad(t: number): number {
  return t * t
}

const animation: KineticAnimation = {
  renderBackground: ({ bgColor }: BackgroundRenderProps) => (
    <div style={{ position: 'absolute', inset: 0, background: bgColor }} />
  ),

  renderWord: ({ word, color, enterProgress, exitProgress, phase }: WordRenderProps) => {
    let scale: number
    let opacity: number

    if (phase === 'enter') {
      const ep = easeOutExpo(enterProgress)
      scale = 0.88 + ep * 0.12   // 0.88 → 1.00
      opacity = ep
    } else if (phase === 'hold') {
      scale = 1
      opacity = 1
    } else {
      // No scale change on exit — just a clean fade. Less motion = less tiring.
      const ep = easeInQuad(exitProgress)
      scale = 1
      opacity = 1 - ep
    }

    return (
      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: `translate(-50%, -50%) scale(${scale.toFixed(4)})`,
          opacity,
          willChange: 'transform, opacity',
        }}
      >
        <div
          style={{
            fontFamily: "'Inter', 'Helvetica Neue', Helvetica, sans-serif",
            fontSize: 'clamp(36px, 8vw, 120px)',
            fontWeight: 500,
            letterSpacing: '0.02em',
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

function SnapInComponent(props: MotionGraphicProps<SnapInConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-snap-in',
  title: 'Snap In',
  description: 'Text snaps in from 88% scale to full size via exponential ease-out, holds still, then cross-fades out. The snap is over in ~0.2s — the eye reads the word, not the animation.',
  tags: ['kinetic', 'typography', 'subtitle', 'caption', 'scale', 'snap', 'minimal', 'clean', 'fast', 'pop'],
  category: 'captions',
  component: SnapInComponent as any,
  defaultConfig: {
    words: ['SNAP', 'FAST', 'CRISP', 'READ'],
    colors: ['#111111', '#222222', '#111111', '#222222'],
    bgColor: '#ffffff',
    cycleDuration: 1.0,
  },
  configSchema: [
    {
      key: 'words',
      label: 'Words',
      type: 'text-array',
      defaultValue: ['SNAP', 'FAST', 'CRISP', 'READ'],
      group: 'Content',
    },
    {
      key: 'colors',
      label: 'Colors',
      type: 'text-array',
      defaultValue: ['#111111', '#222222', '#111111', '#222222'],
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
