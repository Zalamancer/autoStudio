import { registerMotionGraphic } from '../registry'
import { KineticBase, type KineticBaseConfig, type KineticAnimation, type WordRenderProps, type BackgroundRenderProps } from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

// Brand Aesthetic: Luxury Fashion House (Hermès / Bottega / Loewe)
// Cream background, tactile grain texture, words enter as a slow
// horizontal reveal from behind a sliding black mask (like a runway
// curtain parting). Hold is supremely still. Exit: mask slides back.

interface LuxuryFashionHouseConfig extends KineticBaseConfig {}

const animation: KineticAnimation = {
  renderBackground: ({ bgColor }: BackgroundRenderProps) => (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        background: bgColor === '#f7f4ef'
          ? '#f7f4ef'
          : bgColor,
      }}
    >
      {/* Linen grain */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          backgroundImage: [
            'repeating-linear-gradient(0deg, rgba(0,0,0,0.018) 0px, rgba(0,0,0,0.018) 1px, transparent 1px, transparent 3px)',
            'repeating-linear-gradient(90deg, rgba(0,0,0,0.012) 0px, rgba(0,0,0,0.012) 1px, transparent 1px, transparent 4px)',
          ].join(', '),
          pointerEvents: 'none',
        }}
      />
    </div>
  ),

  renderWord: ({ word, color, enterProgress, exitProgress, phase }: WordRenderProps) => {
    // Curtain reveal: clip-path slides from left
    const curtainProgress = phase === 'enter'
      ? enterProgress
      : phase === 'hold'
        ? 1
        : 1 - exitProgress

    const clipLeft = (1 - curtainProgress) * 100
    const opacity = curtainProgress > 0.01 ? 1 : 0

    return (
      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          opacity,
          clipPath: `inset(0 ${clipLeft}% 0 0)`,
        }}
      >
        <div
          style={{
            fontFamily: "'Garamond', 'Didot', 'Georgia', 'Times New Roman', serif",
            fontSize: 'clamp(32px, 8vw, 110px)',
            fontWeight: 400,
            letterSpacing: 18,
            textTransform: 'uppercase',
            whiteSpace: 'nowrap',
            color,
          }}
        >
          {word}
        </div>
      </div>
    )
  },
}

function LuxuryFashionHouseComponent(props: MotionGraphicProps<LuxuryFashionHouseConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-luxury-fashion-house',
  title: 'Kinetic Luxury Fashion House',
  description: 'Hermès/Loewe-style luxury — cream linen bg, wide-tracked Garamond, sliding curtain-reveal clip-path entrance',
  tags: ['kinetic', 'typography', 'luxury', 'fashion', 'brand', 'hermes', 'minimal', 'elegant'],
  category: 'captions',
  component: LuxuryFashionHouseComponent as any,
  defaultConfig: {
    words: ['SAVOIR', 'FAIRE', 'ATELIER', 'CRAFT'],
    colors: ['#1a1a1a', '#1a1a1a', '#1a1a1a', '#1a1a1a'],
    bgColor: '#f7f4ef',
    cycleDuration: 1.8,
  },
  configSchema: [
    { key: 'words', label: 'Words', type: 'text-array', defaultValue: ['SAVOIR', 'FAIRE', 'ATELIER', 'CRAFT'], group: 'Content' },
    { key: 'colors', label: 'Colors', type: 'text-array', defaultValue: ['#1a1a1a', '#1a1a1a', '#1a1a1a', '#1a1a1a'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#f7f4ef', group: 'Style' },
    { key: 'cycleDuration', label: 'Cycle Duration (s)', type: 'number', defaultValue: 1.8, min: 0.5, max: 5, group: 'Timing' },
  ],
})
