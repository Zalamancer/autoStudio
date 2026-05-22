import { registerMotionGraphic } from '../registry'
import { KineticBase, type KineticBaseConfig, type KineticAnimation, type WordRenderProps, type BackgroundRenderProps } from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

const animation: KineticAnimation = {
  renderBackground: ({ bgColor }: BackgroundRenderProps) => (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        background: `linear-gradient(180deg, ${bgColor} 0%, #2a0a00 60%, #1a0500 100%)`,
      }}
    >
      {/* Warm ambient glow */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: 'radial-gradient(ellipse at 50% 60%, rgba(255,100,0,0.08) 0%, transparent 70%)',
        }}
      />
    </div>
  ),

  renderWord: ({ word, color, enterProgress, exitProgress, phase, index }: WordRenderProps) => {
    let opacity = 0
    let scale = 1
    let translateY = 0
    let glowIntensity = 1

    const seed = index * 73 + 19

    if (phase === 'enter') {
      // Ignite: scale from 0.5 with bright flash
      opacity = Math.min(1, enterProgress * 2)
      scale = 0.5 + enterProgress * 0.5
      glowIntensity = enterProgress < 0.4 ? 2.5 - enterProgress * 3 : 1
    } else if (phase === 'hold') {
      opacity = 1
      scale = 1
      // Flickering glow with Math.sin
      glowIntensity = 0.7 + Math.sin(Date.now() * 0.01 + seed) * 0.3
    } else {
      // Burn out: fade with slight upward drift like ash
      opacity = 1 - exitProgress
      translateY = -exitProgress * 30
      scale = 1 - exitProgress * 0.1
      glowIntensity = 1 - exitProgress * 0.8
    }

    const glowSize1 = Math.round(10 * glowIntensity)
    const glowSize2 = Math.round(30 * glowIntensity)
    const glowSize3 = Math.round(60 * glowIntensity)

    return (
      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: `translate(-50%, -50%) translateY(${translateY}px) scale(${scale})`,
          opacity,
          fontFamily: "'Georgia', 'Palatino', serif",
          fontSize: 'clamp(40px, 12vw, 160px)',
          fontWeight: 700,
          color,
          textShadow: [
            `0 0 ${glowSize1}px #FF6600`,
            `0 0 ${glowSize2}px #FF3300`,
            `0 0 ${glowSize3}px #FF4500`,
            `0 0 ${Math.round(glowSize3 * 1.5)}px rgba(255,200,0,${0.3 * glowIntensity})`,
          ].join(', '),
          whiteSpace: 'nowrap',
        }}
      >
        {word}
      </div>
    )
  },
}

function FireEmberComponent(props: MotionGraphicProps<KineticBaseConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-fire-ember',
  title: 'Kinetic Fire Ember',
  description: 'Fire and ember burning text with igniting entrance, flickering warm glow, and ash fade-out',
  tags: ['kinetic', 'typography', 'fire', 'ember', 'flame', 'hot'],
  category: 'captions',
  component: FireEmberComponent as any,
  defaultConfig: {
    words: ['BURN', 'BLAZE', 'IGNITE', 'FIRE'],
    colors: ['#FF6600', '#FF3300', '#FFD700', '#FF4500'],
    bgColor: '#1a0a00',
    cycleDuration: 1,
  },
  configSchema: [
    { key: 'words', label: 'Words', type: 'text-array', defaultValue: ['BURN', 'BLAZE', 'IGNITE', 'FIRE'], group: 'Content' },
    { key: 'colors', label: 'Colors', type: 'text-array', defaultValue: ['#FF6600', '#FF3300', '#FFD700', '#FF4500'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#1a0a00', group: 'Style' },
    { key: 'cycleDuration', label: 'Cycle Duration (s)', type: 'number', defaultValue: 1, min: 0.3, max: 5, group: 'Timing' },
  ],
})
