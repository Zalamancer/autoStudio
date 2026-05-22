import { registerMotionGraphic } from '../registry'
import { KineticBase, type KineticBaseConfig, type KineticAnimation, type WordRenderProps, type BackgroundRenderProps } from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

const animation: KineticAnimation = {
  renderBackground: ({ bgColor }: BackgroundRenderProps) => (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        background: bgColor,
        backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 6px, rgba(255,200,100,0.015) 6px, rgba(255,200,100,0.015) 7px)',
      }}
    >
      {/* Warm vignette */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: 'radial-gradient(ellipse at center, transparent 40%, rgba(0,0,0,0.5) 100%)',
        }}
      />
    </div>
  ),

  renderWord: ({ word, color, enterProgress, exitProgress, phase, index }: WordRenderProps) => {
    let opacity = 0
    let scaleY = 1
    const seed = index * 97 + 31

    if (phase === 'enter') {
      opacity = enterProgress
      scaleY = 0.7 + enterProgress * 0.3
    } else if (phase === 'hold') {
      opacity = 1
      scaleY = 1
    } else {
      opacity = 1 - exitProgress
      scaleY = 1 - exitProgress * 0.2
    }

    // Candle flicker glow: use seed-based variation to avoid random
    const flickerBase = phase === 'hold' ? 0.7 + Math.sin(Date.now() * 0.008 + seed) * 0.3 : 1
    const glowRadius = phase === 'hold' ? 15 + Math.sin(Date.now() * 0.006 + seed * 2) * 8 : 10

    return (
      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: `translate(-50%, -50%) scaleY(${scaleY})`,
          opacity: opacity * flickerBase,
          fontFamily: "'Georgia', 'Palatino Linotype', 'Book Antiqua', serif",
          fontSize: 'clamp(40px, 11vw, 160px)',
          fontWeight: 900,
          color,
          textShadow: `0 0 ${glowRadius}px rgba(255,180,50,0.6), 0 0 ${glowRadius * 2}px rgba(255,140,20,0.3), 0 0 ${glowRadius * 3}px rgba(200,100,0,0.15)`,
          whiteSpace: 'nowrap',
          letterSpacing: 3,
        }}
      >
        {word}
      </div>
    )
  },
}

function BlackletterComponent(props: MotionGraphicProps<KineticBaseConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-blackletter',
  title: 'Kinetic Blackletter',
  description: 'Gothic medieval blackletter typography with parchment background and flickering candlelight glow',
  tags: ['kinetic', 'typography', 'gothic', 'medieval', 'blackletter', 'ornate'],
  category: 'captions',
  component: BlackletterComponent as any,
  defaultConfig: {
    words: ['HONOR', 'GLORY', 'FATE', 'LEGEND'],
    colors: ['#D4AF37', '#C0C0C0', '#8B4513', '#D4AF37'],
    bgColor: '#2a1a0a',
    cycleDuration: 1.2,
  },
  configSchema: [
    { key: 'words', label: 'Words', type: 'text-array', defaultValue: ['HONOR', 'GLORY', 'FATE', 'LEGEND'], group: 'Content' },
    { key: 'colors', label: 'Colors', type: 'text-array', defaultValue: ['#D4AF37', '#C0C0C0', '#8B4513'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#2a1a0a', group: 'Style' },
    { key: 'cycleDuration', label: 'Cycle Duration (s)', type: 'number', defaultValue: 1.2, min: 0.3, max: 5, group: 'Timing' },
  ],
})
