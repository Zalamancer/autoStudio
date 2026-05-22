import { registerMotionGraphic } from '../registry'
import { KineticBase, type KineticBaseConfig, type KineticAnimation, type WordRenderProps, type BackgroundRenderProps } from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface GraffitiTagConfig extends KineticBaseConfig {}

const animation: KineticAnimation = {
  renderBackground: ({ bgColor }: BackgroundRenderProps) => (
    <div style={{ position: 'absolute', inset: 0, background: bgColor }}>
      {/* Concrete/brick texture */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.7' numOctaves='5' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
          opacity: 0.08,
          mixBlendMode: 'overlay',
          pointerEvents: 'none',
        }}
      />
    </div>
  ),

  renderWord: ({ word, color, enterProgress, exitProgress, phase, index }: WordRenderProps) => {
    let opacity = 0
    let scale = 1
    let rotation = -5 // base tilt

    // Deterministic spray angle from index
    const seed = index * 53 + 17
    const sprayAngle = ((seed % 20) - 10)

    if (phase === 'enter') {
      // Spray in: scale up from small with rotation
      opacity = Math.min(1, enterProgress * 2.5)
      scale = 0.3 + enterProgress * 0.7
      rotation = -5 + sprayAngle * (1 - enterProgress)
    } else if (phase === 'hold') {
      opacity = 1
      scale = 1
      // Slight drip movement on bottom edge
      rotation = -5
    } else {
      opacity = 1 - exitProgress
      scale = 1
      rotation = -5
    }

    // Drip oscillation during hold
    const dripY = phase === 'hold'
      ? Math.sin(Date.now() * 0.004) * 1.5
      : 0

    return (
      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: `translate(-50%, -50%) scale(${scale}) rotate(${rotation}deg) translateY(${dripY}px)`,
          opacity,
          fontFamily: "'Arial Black', 'Helvetica Neue', Impact, sans-serif",
          fontSize: 'clamp(44px, 13vw, 170px)',
          fontWeight: 900,
          fontStyle: 'italic',
          color,
          textShadow: `3px 3px 0 rgba(0,0,0,0.3), -1px -1px 0 rgba(0,0,0,0.15)`,
          whiteSpace: 'nowrap',
        }}
      >
        {word}
      </div>
    )
  },
}

function GraffitiTagComponent(props: MotionGraphicProps<GraffitiTagConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-graffiti-tag',
  title: 'Kinetic Graffiti Tag',
  description: 'Urban graffiti spray tag style with tilted bold text and concrete wall texture',
  tags: ['kinetic', 'typography', 'graffiti', 'urban', 'street', 'spray'],
  category: 'captions',
  component: GraffitiTagComponent as any,
  defaultConfig: {
    words: ['REBEL', 'WILD', 'FREE', 'FRESH'],
    colors: ['#FF3366', '#00FF88', '#FFFF00', '#FF6600'],
    bgColor: '#5a5a50',
    cycleDuration: 1,
  },
  configSchema: [
    { key: 'words', label: 'Words', type: 'text-array', defaultValue: ['REBEL', 'WILD', 'FREE', 'FRESH'], group: 'Content' },
    { key: 'colors', label: 'Colors', type: 'text-array', defaultValue: ['#FF3366', '#00FF88', '#FFFF00', '#FF6600'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#5a5a50', group: 'Style' },
    { key: 'cycleDuration', label: 'Cycle Duration (s)', type: 'number', defaultValue: 1, min: 0.3, max: 5, group: 'Timing' },
  ],
})
