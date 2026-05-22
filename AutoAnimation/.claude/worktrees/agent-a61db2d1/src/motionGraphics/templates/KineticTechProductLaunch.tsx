import { registerMotionGraphic } from '../registry'
import { KineticBase, type KineticBaseConfig, type KineticAnimation, type WordRenderProps, type BackgroundRenderProps } from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

// Brand Aesthetic: Tech Product Launch (Apple / Linear / Arc)
// Space-grey backdrop with subtle spec-sheet grid. Words materialize
// from blurred ghost → sharp focus (like a camera autofocusing on a
// product reveal). During hold a thin precision measurement line
// sweeps under the word. Exit: de-focus back to blur and opacity 0.

interface TechProductLaunchConfig extends KineticBaseConfig {}

const animation: KineticAnimation = {
  renderBackground: ({ bgColor, frame, fps }: BackgroundRenderProps) => {
    const time = frame / fps
    // Animated radial gradient shimmer — like anodized aluminum
    const shimmerAngle = (time * 15) % 360

    return (
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: bgColor === '#1c1c1e'
            ? `radial-gradient(ellipse at 50% 40%, #2c2c2e 0%, #1c1c1e 60%)`
            : bgColor,
        }}
      >
        {/* Spec grid — light hairlines */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            backgroundImage: [
              'repeating-linear-gradient(0deg, rgba(255,255,255,0.03) 0px, rgba(255,255,255,0.03) 1px, transparent 1px, transparent 60px)',
              'repeating-linear-gradient(90deg, rgba(255,255,255,0.03) 0px, rgba(255,255,255,0.03) 1px, transparent 1px, transparent 60px)',
            ].join(', '),
            pointerEvents: 'none',
          }}
        />
        {/* Shimmer diagonal sweep */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: `linear-gradient(${shimmerAngle}deg, transparent 40%, rgba(255,255,255,0.02) 50%, transparent 60%)`,
            pointerEvents: 'none',
          }}
        />
      </div>
    )
  },

  renderWord: ({ word, color, enterProgress, holdProgress, exitProgress, phase }: WordRenderProps) => {
    let opacity = 0
    let blur = 0

    if (phase === 'enter') {
      const eased = 1 - Math.pow(1 - enterProgress, 2)
      opacity = eased
      blur = (1 - eased) * 12
    } else if (phase === 'hold') {
      opacity = 1
      blur = 0
    } else {
      const eased = Math.pow(exitProgress, 2)
      opacity = 1 - eased
      blur = eased * 12
    }

    // Precision sweep line
    const lineProgress = phase === 'hold'
      ? Math.min(holdProgress * 2.5, 1)
      : phase === 'exit'
        ? 1 - exitProgress
        : 0

    return (
      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          opacity,
          filter: blur > 0.5 ? `blur(${blur}px)` : 'none',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 8,
        }}
      >
        <div
          style={{
            fontFamily: "'-apple-system', 'SF Pro Display', 'Helvetica Neue', sans-serif",
            fontSize: 'clamp(30px, 7.5vw, 105px)',
            fontWeight: 200,
            letterSpacing: 12,
            textTransform: 'uppercase',
            whiteSpace: 'nowrap',
            color,
          }}
        >
          {word}
        </div>
        {/* Precision underline sweep */}
        <div
          style={{
            position: 'relative',
            width: '100%',
            height: 1,
            background: `rgba(255,255,255,0.08)`,
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              position: 'absolute',
              left: 0,
              top: 0,
              width: `${lineProgress * 100}%`,
              height: '100%',
              background: `linear-gradient(90deg, transparent, ${color}, transparent)`,
            }}
          />
        </div>
      </div>
    )
  },
}

function TechProductLaunchComponent(props: MotionGraphicProps<TechProductLaunchConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-tech-product-launch',
  title: 'Kinetic Tech Product Launch',
  description: 'Apple/Linear brand energy — camera autofocus blur-to-sharp reveal, space-grey spec grid, precision sweep underline',
  tags: ['kinetic', 'typography', 'tech', 'apple', 'product', 'brand', 'minimal', 'launch'],
  category: 'captions',
  component: TechProductLaunchComponent as any,
  defaultConfig: {
    words: ['PRECISION', 'POWER', 'DESIGNED', 'LAUNCH'],
    colors: ['#e8e8e8', '#e8e8e8', '#e8e8e8', '#e8e8e8'],
    bgColor: '#1c1c1e',
    cycleDuration: 1.6,
  },
  configSchema: [
    { key: 'words', label: 'Words', type: 'text-array', defaultValue: ['PRECISION', 'POWER', 'DESIGNED', 'LAUNCH'], group: 'Content' },
    { key: 'colors', label: 'Colors', type: 'text-array', defaultValue: ['#e8e8e8', '#e8e8e8', '#e8e8e8', '#e8e8e8'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#1c1c1e', group: 'Style' },
    { key: 'cycleDuration', label: 'Cycle Duration (s)', type: 'number', defaultValue: 1.6, min: 0.5, max: 5, group: 'Timing' },
  ],
})
