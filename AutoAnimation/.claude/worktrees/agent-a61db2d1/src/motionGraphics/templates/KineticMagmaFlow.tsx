import { registerMotionGraphic } from '../registry'
import { KineticBase, type KineticBaseConfig, type KineticAnimation, type WordRenderProps, type BackgroundRenderProps } from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface MagmaFlowConfig extends KineticBaseConfig {}

const animation: KineticAnimation = {
  renderBackground: ({ bgColor, frame }: BackgroundRenderProps) => {
    // Slow lava flow color shifts
    const pulse = Math.sin((frame ?? 0) * 0.04) * 0.5 + 0.5
    return (
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: `radial-gradient(ellipse at 50% ${60 + pulse * 20}%, #3a0800 0%, ${bgColor} 60%, #0d0000 100%)`,
        }}
      >
        {/* Lava glow at bottom */}
        <div
          style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            height: '30%',
            background: `linear-gradient(to top, rgba(255,60,0,${0.12 + pulse * 0.06}) 0%, transparent 100%)`,
            pointerEvents: 'none',
          }}
        />
      </div>
    )
  },

  renderWord: ({ word, color, enterProgress, holdProgress, exitProgress, phase, index }: WordRenderProps) => {
    const seed = index * 61 + 37

    let opacity = 0
    let scaleX = 1
    let scaleY = 1
    let translateY = 0
    let glowR = 10

    if (phase === 'enter') {
      // Magma wells up from below: heavy heat distortion then solidifies
      opacity = Math.min(1, enterProgress * 2)
      translateY = (1 - enterProgress) * 50  // rises from below
      // Heat shimmer: text slightly squirms as it cools
      scaleX = 1 + Math.sin(enterProgress * Math.PI * 6 + seed) * (1 - enterProgress) * 0.04
      scaleY = 1 - Math.sin(enterProgress * Math.PI * 5 + seed) * (1 - enterProgress) * 0.03
      glowR = 30 + (1 - enterProgress) * 40
    } else if (phase === 'hold') {
      opacity = 1
      // Cooling crust — very slight expansion/contraction
      const cool = Math.sin(holdProgress * Math.PI * 4 + seed) * 0.008
      scaleX = 1 + cool
      scaleY = 1 - cool * 0.5
      glowR = 20 + Math.sin(holdProgress * Math.PI * 6) * 8
    } else {
      // Re-melts: text sinks back into lava and glows out
      opacity = 1 - exitProgress * exitProgress
      translateY = exitProgress * 40
      scaleX = 1 + exitProgress * 0.15
      scaleY = 1 - exitProgress * 0.2
      glowR = 20 + exitProgress * 60
    }

    return (
      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: `translate(-50%, -50%) translateY(${translateY}px) scaleX(${scaleX}) scaleY(${scaleY})`,
          opacity,
          fontFamily: "'Impact', 'Arial Black', sans-serif",
          fontSize: 'clamp(44px, 13vw, 170px)',
          fontWeight: 900,
          textTransform: 'uppercase',
          letterSpacing: 6,
          color,
          textShadow: [
            `0 0 ${glowR * 0.4}px #FF4500`,
            `0 0 ${glowR}px #FF2200`,
            `0 0 ${glowR * 2}px rgba(255,100,0,0.5)`,
            `0 ${glowR * 0.2}px ${glowR * 1.5}px rgba(200,50,0,0.4)`,
          ].join(', '),
          whiteSpace: 'nowrap',
        }}
      >
        {word}
      </div>
    )
  },
}

function MagmaFlowComponent(props: MotionGraphicProps<MagmaFlowConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-magma-flow',
  title: 'Kinetic Magma Flow',
  description: 'Text wells up from a lava pool with heat distortion, cooling crust shimmer, then sinks back glowing',
  tags: ['kinetic', 'typography', 'magma', 'lava', 'fire', 'volcanic', 'hot', 'organic'],
  category: 'captions',
  component: MagmaFlowComponent as any,
  defaultConfig: {
    words: ['IGNITE', 'FORGE', 'MOLTEN', 'ERUPT'],
    colors: ['#FF4500', '#FF6B00', '#FF8C00', '#FFA500'],
    bgColor: '#200800',
    cycleDuration: 1.3,
  },
  configSchema: [
    { key: 'words', label: 'Words', type: 'text-array', defaultValue: ['IGNITE', 'FORGE', 'MOLTEN', 'ERUPT'], group: 'Content' },
    { key: 'colors', label: 'Colors', type: 'text-array', defaultValue: ['#FF4500', '#FF6B00', '#FF8C00', '#FFA500'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#200800', group: 'Style' },
    { key: 'cycleDuration', label: 'Cycle Duration (s)', type: 'number', defaultValue: 1.3, min: 0.3, max: 5, group: 'Timing' },
  ],
})
