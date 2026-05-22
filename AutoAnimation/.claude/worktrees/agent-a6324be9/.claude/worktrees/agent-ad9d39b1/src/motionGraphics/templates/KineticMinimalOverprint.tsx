import { registerMotionGraphic } from '../registry'
import {
  KineticBase,
  type KineticBaseConfig,
  type KineticAnimation,
  type WordRenderProps,
  type BackgroundRenderProps,
} from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface MinimalOverprintConfig extends KineticBaseConfig {}

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
    // Overprint: text starts at a slight horizontal offset (as if misregistered),
    // then snaps to aligned position while gaining full opacity.
    // The effect mimics offset lithographic printing layers finding registration.
    let offsetX = 0
    let opacity = 1

    if (phase === 'enter') {
      const eased = easeOutCubic(enterProgress)
      // Start offset 18px to the right, slide to 0 (registered)
      offsetX = 18 * (1 - eased)
      opacity = enterProgress
    } else if (phase === 'exit') {
      const eased = easeInCubic(exitProgress)
      // Drift back out to the left while fading
      offsetX = -18 * eased
      opacity = 1 - eased
    }

    // Ghost layer: remains at the offset position with very low opacity to simulate misprint
    const ghostOpacity = phase === 'enter'
      ? (1 - enterProgress) * 0.18
      : phase === 'exit'
      ? exitProgress * 0.10
      : 0

    const textStyle = {
      fontFamily: "'Inter', 'Helvetica Neue', Helvetica, sans-serif",
      fontSize: 'clamp(36px, 8vw, 120px)',
      fontWeight: 300,
      letterSpacing: '0.05em',
      whiteSpace: 'nowrap' as const,
    }

    return (
      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
        }}
      >
        {/* Ghost mis-registration layer */}
        {ghostOpacity > 0 && (
          <div
            style={{
              ...textStyle,
              color,
              opacity: ghostOpacity,
              position: 'absolute',
              top: 0,
              left: 0,
              pointerEvents: 'none',
            }}
          >
            {word}
          </div>
        )}
        {/* Primary aligned layer */}
        <div
          style={{
            ...textStyle,
            color,
            opacity,
            transform: `translateX(${offsetX.toFixed(2)}px)`,
          }}
        >
          {word}
        </div>
      </div>
    )
  },
}

function MinimalOverprintComponent(props: MotionGraphicProps<MinimalOverprintConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-minimal-overprint',
  title: 'Minimal Overprint',
  description:
    'Text appears as an overprint — shifts from a misregistered offset position into precise alignment, mimicking a letterpress registration snap.',
  tags: ['kinetic', 'typography', 'minimal', 'overprint', 'offset', 'register', 'print', 'align', 'letterpress'],
  category: 'captions',
  component: MinimalOverprintComponent as any,
  defaultConfig: {
    words: ['PRINT', 'ALIGN', 'PRESS', 'REGISTER'],
    colors: ['#1A1A1A', '#222222', '#1A1A1A', '#333333'],
    bgColor: '#FFFFFF',
    cycleDuration: 1.4,
  },
  configSchema: [
    {
      key: 'words',
      label: 'Words',
      type: 'text-array',
      defaultValue: ['PRINT', 'ALIGN', 'PRESS', 'REGISTER'],
      group: 'Content',
    },
    {
      key: 'colors',
      label: 'Colors',
      type: 'text-array',
      defaultValue: ['#1A1A1A', '#222222', '#1A1A1A', '#333333'],
      group: 'Style',
    },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#FFFFFF', group: 'Style' },
    {
      key: 'cycleDuration',
      label: 'Cycle Duration (s)',
      type: 'number',
      defaultValue: 1.4,
      min: 0.5,
      max: 5,
      group: 'Timing',
    },
  ],
})
