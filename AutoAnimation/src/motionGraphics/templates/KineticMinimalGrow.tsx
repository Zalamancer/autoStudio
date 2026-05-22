import { registerMotionGraphic } from '../registry'
import {
  KineticBase,
  type KineticBaseConfig,
  type KineticAnimation,
  type WordRenderProps,
  type BackgroundRenderProps,
} from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface MinimalGrowConfig extends KineticBaseConfig {
  startScale: number
}

/** Expo ease-out — very fast initial growth that decelerates sharply to 1.0 */
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

  renderWord: ({ word, color, enterProgress, exitProgress, phase, width, height }: WordRenderProps) => {
    // Grow mechanic: text starts very small (near zero scale) and grows to full size
    // with strong exponential deceleration — snaps into size quickly then settles precisely.
    const startScale = 0.08

    let scale = 1
    let opacity = 1

    if (phase === 'enter') {
      const eased = easeOutExpo(enterProgress)
      scale = startScale + eased * (1 - startScale)
      opacity = Math.min(1, enterProgress * 4) // quick opacity pop at the very start
    } else if (phase === 'hold') {
      scale = 1
      opacity = 1
    } else {
      const eased = easeInQuad(exitProgress)
      // Exit: grow slightly larger then fade — gives a "breathe out" feeling
      scale = 1 + eased * 0.06
      opacity = 1 - eased
    }

    return (
      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: `translate(-50%, -50%) scale(${scale})`,
          transformOrigin: 'center center',
          opacity,
          fontFamily: "'Inter', 'Helvetica Neue', Arial, sans-serif",
          fontSize: 'clamp(36px, 8vw, 120px)',
          fontWeight: 300,
          letterSpacing: '0.08em',
          textTransform: 'uppercase',
          color,
          whiteSpace: 'nowrap',
        }}
      >
        {word}
      </div>
    )
  },
}

function MinimalGrowComponent(props: MotionGraphicProps<MinimalGrowConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-minimal-grow',
  title: 'Kinetic Minimal Grow',
  description:
    'Text grows from tiny to full size with sharp exponential deceleration — snaps into place with satisfying weight',
  tags: ['kinetic', 'typography', 'minimal', 'grow', 'scale', 'entrance', 'deceleration', 'clean'],
  category: 'captions',
  component: MinimalGrowComponent as any,
  defaultConfig: {
    words: ['GROW', 'RISE', 'BUILD', 'EXPAND'],
    colors: ['#1a1a1a', '#222222', '#111111', '#333333'],
    bgColor: '#ffffff',
    cycleDuration: 1.1,
    startScale: 0.08,
  },
  configSchema: [
    {
      key: 'words',
      label: 'Words',
      type: 'text-array',
      defaultValue: ['GROW', 'RISE', 'BUILD', 'EXPAND'],
      group: 'Content',
    },
    {
      key: 'colors',
      label: 'Colors',
      type: 'text-array',
      defaultValue: ['#1a1a1a', '#222222', '#111111', '#333333'],
      group: 'Style',
    },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#ffffff', group: 'Style' },
    {
      key: 'cycleDuration',
      label: 'Cycle Duration (s)',
      type: 'number',
      defaultValue: 1.1,
      min: 0.3,
      max: 5,
      group: 'Timing',
    },
    {
      key: 'startScale',
      label: 'Start Scale',
      type: 'number',
      defaultValue: 0.08,
      min: 0.01,
      max: 0.5,
      group: 'Animation',
    },
  ],
})
