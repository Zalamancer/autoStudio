import { registerMotionGraphic } from '../registry'
import { KineticBase, type KineticBaseConfig, type KineticAnimation, type WordRenderProps, type BackgroundRenderProps } from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

// 2025 TikTok Trend: Old Money Prep
// Navy/cream/hunter green palette; words arrive with stately serif drop-in
// from top — like a boarding school crest being stamped. Thin rule lines
// appear above and below during hold (like an engraved letterhead).
// Exit: words lift off and fade with patrician dignity.

interface OldMoneyPrepConfig extends KineticBaseConfig {}

const animation: KineticAnimation = {
  renderBackground: ({ bgColor }: BackgroundRenderProps) => (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        background: bgColor === '#f4f0e8'
          ? 'linear-gradient(180deg, #f4f0e8 0%, #ece7da 100%)'
          : bgColor,
      }}
    >
      {/* Subtle herringbone tweed pattern */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          backgroundImage: [
            'repeating-linear-gradient(45deg, rgba(30,50,30,0.025) 0px, rgba(30,50,30,0.025) 1px, transparent 1px, transparent 8px)',
            'repeating-linear-gradient(-45deg, rgba(30,50,30,0.025) 0px, rgba(30,50,30,0.025) 1px, transparent 1px, transparent 8px)',
          ].join(', '),
          pointerEvents: 'none',
        }}
      />
      {/* Vignette */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: 'radial-gradient(ellipse at center, transparent 55%, rgba(20,30,20,0.12) 100%)',
          pointerEvents: 'none',
        }}
      />
    </div>
  ),

  renderWord: ({ word, color, enterProgress, holdProgress, exitProgress, phase }: WordRenderProps) => {
    let opacity = 0
    let translateY = 0

    if (phase === 'enter') {
      const eased = 1 - Math.pow(1 - enterProgress, 2)
      opacity = Math.min(enterProgress / 0.3, 1)
      translateY = (1 - eased) * -30
    } else if (phase === 'hold') {
      opacity = 1
      translateY = 0
    } else {
      const eased = Math.pow(exitProgress, 2)
      opacity = 1 - eased
      translateY = -eased * 20
    }

    // Rule lines: animate in during hold
    const ruleProgress = phase === 'hold'
      ? Math.min(holdProgress * 3, 1)
      : phase === 'exit'
        ? 1 - exitProgress
        : 0

    return (
      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: `translate(-50%, -50%) translateY(${translateY}px)`,
          opacity,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 10,
        }}
      >
        {/* Top rule */}
        <div
          style={{
            width: `${ruleProgress * 120}%`,
            height: 1,
            background: color,
            opacity: 0.5,
          }}
        />
        <div
          style={{
            fontFamily: "'Garamond', 'Georgia', 'Times New Roman', serif",
            fontSize: 'clamp(32px, 8vw, 110px)',
            fontWeight: 400,
            letterSpacing: 10,
            textTransform: 'uppercase',
            whiteSpace: 'nowrap',
            color,
          }}
        >
          {word}
        </div>
        {/* Bottom rule */}
        <div
          style={{
            width: `${ruleProgress * 120}%`,
            height: 1,
            background: color,
            opacity: 0.5,
          }}
        />
      </div>
    )
  },
}

function OldMoneyPrepComponent(props: MotionGraphicProps<OldMoneyPrepConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-old-money-prep',
  title: 'Kinetic Old Money Prep',
  description: '2025 TikTok old money aesthetic — stately Garamond, herringbone bg, engraved rule lines on hold, patrician drop-in',
  tags: ['kinetic', 'typography', 'old-money', 'prep', 'tiktok', 'luxury', 'navy', 'trending', '2025'],
  category: 'captions',
  component: OldMoneyPrepComponent as any,
  defaultConfig: {
    words: ['LEGACY', 'ESTATE', 'REFINED', 'CREST'],
    colors: ['#1a2e1a', '#1a2e1a', '#1a2e1a', '#1a2e1a'],
    bgColor: '#f4f0e8',
    cycleDuration: 1.5,
  },
  configSchema: [
    { key: 'words', label: 'Words', type: 'text-array', defaultValue: ['LEGACY', 'ESTATE', 'REFINED', 'CREST'], group: 'Content' },
    { key: 'colors', label: 'Colors', type: 'text-array', defaultValue: ['#1a2e1a', '#1a2e1a', '#1a2e1a', '#1a2e1a'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#f4f0e8', group: 'Style' },
    { key: 'cycleDuration', label: 'Cycle Duration (s)', type: 'number', defaultValue: 1.5, min: 0.5, max: 5, group: 'Timing' },
  ],
})
