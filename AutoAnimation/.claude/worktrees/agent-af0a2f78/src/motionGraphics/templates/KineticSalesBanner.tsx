import { registerMotionGraphic } from '../registry'
import {
  KineticBase,
  type KineticBaseConfig,
  type KineticAnimation,
  type WordRenderProps,
  type BackgroundRenderProps,
} from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface SalesBannerConfig extends KineticBaseConfig {}

function rand(s: number): number {
  const x = Math.sin(s * 127.1 + 311.7) * 43758.5453
  return x - Math.floor(x)
}

const animation: KineticAnimation = {
  renderBackground: ({ bgColor, frame, fps }: BackgroundRenderProps) => {
    const time = frame / fps
    // Urgency: pulsing red/orange gradient
    const pulse = 0.5 + Math.sin(time * 4) * 0.15
    return (
      <div style={{ position: 'absolute', inset: 0 }}>
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: bgColor,
          }}
        />
        {/* Pulsing radial glow */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: `radial-gradient(ellipse at center, rgba(239,68,68,${pulse * 0.12}) 0%, transparent 70%)`,
            pointerEvents: 'none',
          }}
        />
        {/* Diagonal stripes for urgency feel */}
        {Array.from({ length: 6 }, (_, i) => (
          <div
            key={i}
            style={{
              position: 'absolute',
              top: 0,
              left: `${-10 + i * 22 + Math.sin(time * 2) * 3}%`,
              width: '8%',
              height: '100%',
              background: 'linear-gradient(180deg, rgba(239,68,68,0.03), rgba(249,115,22,0.03))',
              transform: 'skewX(-15deg)',
              pointerEvents: 'none',
            }}
          />
        ))}
        {/* Top urgency bar */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: 4,
            background: 'linear-gradient(90deg, #EF4444, #F97316, #EF4444, #F97316)',
            backgroundSize: '200% 100%',
            backgroundPosition: `${time * 100}% 0`,
          }}
        />
        {/* Bottom urgency bar */}
        <div
          style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            height: 4,
            background: 'linear-gradient(90deg, #F97316, #EF4444, #F97316, #EF4444)',
            backgroundSize: '200% 100%',
            backgroundPosition: `${-time * 100}% 0`,
          }}
        />
      </div>
    )
  },

  renderWord: ({
    word,
    color,
    enterProgress,
    holdProgress,
    exitProgress,
    phase,
    frame,
  }: WordRenderProps) => {
    let opacity = 0
    let scale = 1
    let translateY = 0
    let rotate = 0

    if (phase === 'enter') {
      // Slam-in from above with overshoot
      const eased = enterProgress < 0.6
        ? Math.pow(enterProgress / 0.6, 0.5) * 1.15
        : 1.15 - (enterProgress - 0.6) / 0.4 * 0.15
      opacity = Math.min(1, enterProgress * 3)
      scale = enterProgress < 0.6 ? 1.3 - (1 - eased) * 0.3 : 1 + (1 - enterProgress) * 0.02
      translateY = (1 - Math.min(1, enterProgress * 2)) * -80
      rotate = (1 - enterProgress) * -3
    } else if (phase === 'hold') {
      opacity = 1
      // Urgency shake
      const shake = Math.sin(holdProgress * Math.PI * 16) * 2 * (1 - holdProgress * 0.5)
      translateY = shake
      scale = 1 + Math.abs(Math.sin(holdProgress * Math.PI * 8)) * 0.03
    } else {
      opacity = 1 - Math.pow(exitProgress, 1.5)
      scale = 1 + exitProgress * 0.3
      translateY = exitProgress * 30
    }

    return (
      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: `translate(-50%, -50%) translateY(${translateY}px) scale(${scale}) rotate(${rotate}deg)`,
          opacity,
          textAlign: 'center',
        }}
      >
        {/* Badge / starburst behind text */}
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: 'clamp(200px, 50vw, 400px)',
            height: 'clamp(80px, 20vw, 160px)',
            background: `linear-gradient(135deg, ${color}15, ${color}08)`,
            borderRadius: 'clamp(8px, 2vw, 16px)',
            border: `2px solid ${color}20`,
          }}
        />
        <div
          style={{
            position: 'relative',
            fontFamily: "'Impact', 'Arial Black', sans-serif",
            fontSize: 'clamp(44px, 13vw, 170px)',
            fontWeight: 900,
            color,
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            lineHeight: 1,
            whiteSpace: 'nowrap',
            textShadow: `0 4px 12px rgba(0,0,0,0.4), 0 0 30px ${color}25`,
          }}
        >
          {word}
        </div>
        {/* LIMITED TIME label */}
        <div
          style={{
            marginTop: 'clamp(6px, 1.5vw, 12px)',
            fontFamily: "'Inter', sans-serif",
            fontSize: 'clamp(9px, 2vw, 14px)',
            fontWeight: 700,
            color: '#EF4444',
            textTransform: 'uppercase',
            letterSpacing: '0.25em',
            opacity: phase === 'enter' ? Math.max(0, (enterProgress - 0.5) * 2) : phase === 'exit' ? 1 - exitProgress : 0.7 + Math.sin((holdProgress || 0) * Math.PI * 6) * 0.3,
          }}
        >
          LIMITED TIME OFFER
        </div>
      </div>
    )
  },
}

function KineticSalesBannerComponent(props: MotionGraphicProps<SalesBannerConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-sales-banner',
  title: 'Sales Banner',
  description: 'Bold sales announcement with slam-in entry, urgency shake, pulsing background glow, and animated diagonal stripes.',
  tags: ['kinetic', 'sales', 'banner', 'marketing', 'urgency', 'discount', 'promotion', 'ecommerce'],
  category: 'captions',
  component: KineticSalesBannerComponent as any,
  defaultConfig: {
    words: ['50% OFF', 'SALE', 'BUY NOW', 'DEAL'],
    colors: ['#FFFFFF', '#FEF08A', '#FFFFFF', '#FEF08A'],
    bgColor: '#1a0a0a',
    cycleDuration: 1.4,
  },
  configSchema: [
    { key: 'words', label: 'Sale Text', type: 'text-array', defaultValue: ['50% OFF', 'SALE', 'BUY NOW', 'DEAL'], group: 'Content' },
    { key: 'colors', label: 'Colors', type: 'text-array', defaultValue: ['#FFFFFF', '#FEF08A', '#FFFFFF', '#FEF08A'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#1a0a0a', group: 'Style' },
    { key: 'cycleDuration', label: 'Cycle Duration (s)', type: 'number', defaultValue: 1.4, min: 0.3, max: 5, group: 'Timing' },
  ],
})
