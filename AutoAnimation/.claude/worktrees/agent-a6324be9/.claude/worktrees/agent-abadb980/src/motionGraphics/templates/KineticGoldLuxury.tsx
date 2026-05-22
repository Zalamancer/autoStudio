import { registerMotionGraphic } from '../registry'
import { KineticBase, type KineticBaseConfig, type KineticAnimation, type WordRenderProps, type BackgroundRenderProps } from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface GoldLuxuryConfig extends KineticBaseConfig {}

const animation: KineticAnimation = {
  renderBackground: ({ bgColor }: BackgroundRenderProps) => (
    <div style={{ position: 'absolute', inset: 0, background: bgColor }} />
  ),

  renderWord: ({ word, color, enterProgress, exitProgress, phase }: WordRenderProps) => {
    let opacity = 0
    let translateY = 0
    let scale = 1

    if (phase === 'enter') {
      opacity = enterProgress
      translateY = (1 - enterProgress) * 30
      scale = 0.95 + enterProgress * 0.05
    } else if (phase === 'hold') {
      opacity = 1
      scale = 1
    } else {
      opacity = 1 - exitProgress
      translateY = -exitProgress * 20
    }

    const shimmerIntensity = phase === 'hold'
      ? 20 + Math.sin(Date.now() * 0.004) * 15
      : 10

    return (
      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: `translate(-50%, -50%) translateY(${translateY}px) scale(${scale})`,
          opacity,
          fontFamily: "'Georgia', 'Times New Roman', serif",
          fontSize: 'clamp(40px, 12vw, 160px)',
          fontWeight: 300,
          textTransform: 'uppercase',
          letterSpacing: 10,
          color,
          textShadow: `0 0 ${shimmerIntensity}px rgba(212, 175, 55, 0.6), 0 0 ${shimmerIntensity * 2}px rgba(255, 215, 0, 0.3)`,
          whiteSpace: 'nowrap',
        }}
      >
        {word}
      </div>
    )
  },
}

function GoldLuxuryComponent(props: MotionGraphicProps<GoldLuxuryConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-gold-luxury',
  title: 'Kinetic Gold Luxury',
  description: 'Elegant luxury gold typography with shimmer glow and refined serif presentation',
  tags: ['kinetic', 'typography', 'gold', 'luxury', 'premium'],
  category: 'captions',
  component: GoldLuxuryComponent as any,
  defaultConfig: {
    words: ['LUXURY', 'PREMIUM', 'ELEGANT', 'CLASS'],
    colors: ['#D4AF37', '#FFD700', '#C0A062', '#BFA046'],
    bgColor: '#000000',
    cycleDuration: 1,
  },
  configSchema: [
    { key: 'words', label: 'Words', type: 'text-array', defaultValue: ['LUXURY', 'PREMIUM', 'ELEGANT', 'CLASS'], group: 'Content' },
    { key: 'colors', label: 'Colors', type: 'text-array', defaultValue: ['#D4AF37', '#FFD700', '#C0A062', '#BFA046'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#000000', group: 'Style' },
    { key: 'cycleDuration', label: 'Cycle Duration (s)', type: 'number', defaultValue: 1, min: 0.3, max: 5, group: 'Timing' },
  ],
})
