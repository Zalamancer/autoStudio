import { registerMotionGraphic } from '../registry'
import { KineticBase, type KineticBaseConfig, type KineticAnimation, type WordRenderProps, type BackgroundRenderProps } from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface StickyTapeConfig extends KineticBaseConfig {}

function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3)
}

function easeInCubic(t: number): number {
  return t * t * t
}

const animation: KineticAnimation = {
  renderBackground: ({ bgColor }: BackgroundRenderProps) => (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        background: bgColor,
      }}
    >
      {/* Subtle linen/paper texture */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          backgroundImage: [
            'repeating-linear-gradient(0deg, transparent, transparent 28px, rgba(0,0,0,0.018) 28px, rgba(0,0,0,0.018) 29px)',
            'repeating-linear-gradient(90deg, transparent, transparent 28px, rgba(0,0,0,0.012) 28px, rgba(0,0,0,0.012) 29px)',
          ].join(', '),
          pointerEvents: 'none',
        }}
      />
    </div>
  ),

  renderWord: ({ word, color, enterProgress, holdProgress, exitProgress, phase, index }: WordRenderProps) => {
    const seed = index * 53 + 11
    // Each word gets slightly different tape angles and positions
    const tape1Angle = -6 + (seed % 7)
    const tape2Angle = 4 + (seed % 5)
    const tape1X = 10 + (seed % 20) // % offset from left
    const tape2X = 65 + (seed % 15)

    let opacity = 1
    let scaleY = 1
    let translateY = 0

    if (phase === 'enter') {
      // Text slaps down from slightly above, tape strips appear first
      const eased = easeOutCubic(enterProgress)
      translateY = (1 - eased) * -40
      scaleY = 0.85 + eased * 0.15
      opacity = Math.min(1, enterProgress * 2.5)
    } else if (phase === 'hold') {
      // Very subtle settle breathing
      translateY = Math.sin(holdProgress * Math.PI * 2 + seed) * 1.2
    } else {
      // Slides up and off
      const eased = easeInCubic(exitProgress)
      translateY = -eased * 80
      opacity = 1 - exitProgress * 0.9
    }

    // Tape strip enter: each tape comes in slightly before/with the text
    const tape1Progress = Math.min(1, enterProgress * 1.4)
    const tape2Progress = Math.min(1, Math.max(0, (enterProgress - 0.1) * 1.4))

    return (
      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: `translate(-50%, calc(-50% + ${translateY}px)) scaleY(${scaleY})`,
          opacity,
        }}
      >
        {/* Text content on plain paper background */}
        <div
          style={{
            position: 'relative',
            padding: 'clamp(12px, 3vw, 32px) clamp(20px, 5vw, 56px)',
            background: 'rgba(255,255,255,0.88)',
            boxShadow: '2px 4px 14px rgba(0,0,0,0.13)',
          }}
        >
          <div
            style={{
              fontFamily: "'Georgia', 'Times New Roman', serif",
              fontSize: 'clamp(36px, 9vw, 120px)',
              fontWeight: 700,
              color,
              whiteSpace: 'nowrap',
              textAlign: 'center',
              letterSpacing: '0.02em',
            }}
          >
            {word}
          </div>

          {/* Tape strip 1 — top left area */}
          <div
            style={{
              position: 'absolute',
              top: -14,
              left: `${tape1X}%`,
              width: 'clamp(50px, 10vw, 80px)',
              height: 'clamp(18px, 3vw, 26px)',
              background: 'rgba(210,230,255,0.55)',
              transform: `translateX(-50%) rotate(${tape1Angle}deg) scaleX(${phase === 'enter' ? tape1Progress : 1})`,
              transformOrigin: 'center center',
              borderRadius: 1,
              boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
              // Tape edge serration via repeating gradient
              backgroundImage: [
                'linear-gradient(90deg, rgba(180,210,250,0.35) 0%, rgba(230,245,255,0.6) 40%, rgba(200,225,255,0.45) 100%)',
              ].join(', '),
            }}
          />

          {/* Tape strip 2 — top right area */}
          <div
            style={{
              position: 'absolute',
              top: -12,
              left: `${tape2X}%`,
              width: 'clamp(44px, 8vw, 68px)',
              height: 'clamp(16px, 2.5vw, 22px)',
              background: 'rgba(210,230,255,0.5)',
              transform: `translateX(-50%) rotate(${tape2Angle}deg) scaleX(${phase === 'enter' ? tape2Progress : 1})`,
              transformOrigin: 'center center',
              borderRadius: 1,
              boxShadow: '0 1px 3px rgba(0,0,0,0.07)',
              backgroundImage: [
                'linear-gradient(90deg, rgba(200,220,255,0.4) 0%, rgba(235,248,255,0.55) 45%, rgba(210,228,255,0.4) 100%)',
              ].join(', '),
            }}
          />

          {/* Tape strip 3 — bottom, only on some words (seed-dependent) */}
          {seed % 3 !== 0 && (
            <div
              style={{
                position: 'absolute',
                bottom: -10,
                left: `${30 + (seed % 25)}%`,
                width: 'clamp(36px, 7vw, 58px)',
                height: 'clamp(14px, 2vw, 20px)',
                background: 'rgba(215,235,255,0.45)',
                transform: `translateX(-50%) rotate(${-3 + (seed % 8)}deg)`,
                borderRadius: 1,
                boxShadow: '0 1px 2px rgba(0,0,0,0.06)',
                backgroundImage: 'linear-gradient(90deg, rgba(205,225,255,0.35) 0%, rgba(232,246,255,0.5) 50%, rgba(208,228,255,0.38) 100%)',
                opacity: phase === 'enter' ? Math.min(1, enterProgress * 3) : 1,
              }}
            />
          )}
        </div>
      </div>
    )
  },
}

function StickyTapeComponent(props: MotionGraphicProps<StickyTapeConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-sticky-tape',
  title: 'Kinetic Sticky Tape',
  description: 'Text appears stuck to the screen with transparent tape strips holding it in place — warm office aesthetic',
  tags: ['kinetic', 'typography', 'tape', 'sticky', 'office', 'paper', 'craft', 'stationery'],
  category: 'captions',
  component: StickyTapeComponent as any,
  defaultConfig: {
    words: ['STUCK', 'TAPED', 'FIXED', 'HOLD'],
    colors: ['#2C3E50', '#1B4F72', '#4A235A', '#1B2631'],
    bgColor: '#F0EBE1',
    cycleDuration: 1.4,
  },
  configSchema: [
    { key: 'words', label: 'Words', type: 'text-array', defaultValue: ['STUCK', 'TAPED', 'FIXED', 'HOLD'], group: 'Content' },
    { key: 'colors', label: 'Colors', type: 'text-array', defaultValue: ['#2C3E50', '#1B4F72', '#4A235A', '#1B2631'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#F0EBE1', group: 'Style' },
    { key: 'cycleDuration', label: 'Cycle Duration (s)', type: 'number', defaultValue: 1.4, min: 0.3, max: 5, group: 'Timing' },
  ],
})
