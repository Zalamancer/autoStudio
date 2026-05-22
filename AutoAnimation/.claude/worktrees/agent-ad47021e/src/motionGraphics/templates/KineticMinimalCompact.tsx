import { registerMotionGraphic } from '../registry'
import { KineticBase, type KineticBaseConfig, type KineticAnimation, type WordRenderProps, type BackgroundRenderProps } from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface MinimalCompactConfig extends KineticBaseConfig {}

/** Elastic ease-out — slight overshoot then settle, like a spring snapping to height */
function easeOutBack(t: number): number {
  const c1 = 1.70158
  const c3 = c1 + 1
  return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2)
}

function easeInOutCubic(t: number): number {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2
}

function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3)
}

const animation: KineticAnimation = {
  renderBackground: ({ bgColor }: BackgroundRenderProps) => (
    <div style={{ position: 'absolute', inset: 0, background: bgColor }} />
  ),

  renderWord: ({ word, color, enterProgress, exitProgress, phase }: WordRenderProps) => {
    // Compact mechanic: text enters vertically compressed (scaleY very small, like a flat slab)
    // and stretches to full height with a slight elastic overshoot.
    // The compression gives weight — it feels like the text is being pushed down
    // then released upward to snap to its natural size.

    const minScaleY = 0.08  // ultra-compressed start

    let scaleY = 1
    let opacity = 1
    let scaleX = 1

    if (phase === 'enter') {
      // First 30%: text pops in at full width but compressed height
      // Then 70%: height springs to full with overshoot
      if (enterProgress < 0.2) {
        const t = enterProgress / 0.2
        scaleY = minScaleY
        opacity = easeOutCubic(t)
        scaleX = 1
      } else {
        const t = (enterProgress - 0.2) / 0.8
        scaleY = minScaleY + easeOutBack(t) * (1 - minScaleY)
        opacity = 1
        scaleX = 1
      }
    } else if (phase === 'hold') {
      scaleY = 1
      scaleX = 1
      opacity = 1
    } else {
      // Exit: compress back down and fade
      const e = easeInOutCubic(exitProgress)
      scaleY = 1 - e * (1 - minScaleY)
      opacity = 1 - e
      scaleX = 1
    }

    return (
      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: `translate(-50%, -50%) scaleY(${scaleY}) scaleX(${scaleX})`,
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

function MinimalCompactComponent(props: MotionGraphicProps<MinimalCompactConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-minimal-compact',
  title: 'Kinetic Minimal Compact',
  description: 'Text enters vertically compressed like a flat slab then springs to full height with elastic snap — clean white background',
  tags: ['kinetic', 'typography', 'minimal', 'compact', 'stretch', 'elastic', 'entrance', 'spring', 'clean'],
  category: 'captions',
  component: MinimalCompactComponent as any,
  defaultConfig: {
    words: ['SNAP', 'SPRING', 'STRETCH', 'RISE'],
    colors: ['#1a1a1a', '#222222', '#111111', '#333333'],
    bgColor: '#ffffff',
    cycleDuration: 1.1,
  },
  configSchema: [
    { key: 'words', label: 'Words', type: 'text-array', defaultValue: ['SNAP', 'SPRING', 'STRETCH', 'RISE'], group: 'Content' },
    { key: 'colors', label: 'Colors', type: 'text-array', defaultValue: ['#1a1a1a', '#222222', '#111111', '#333333'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#ffffff', group: 'Style' },
    { key: 'cycleDuration', label: 'Cycle Duration (s)', type: 'number', defaultValue: 1.1, min: 0.3, max: 5, group: 'Timing' },
  ],
})
