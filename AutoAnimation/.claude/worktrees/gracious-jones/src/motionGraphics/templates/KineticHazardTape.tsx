import { registerMotionGraphic } from '../registry'
import { KineticBase, type KineticBaseConfig, type KineticAnimation, type WordRenderProps, type BackgroundRenderProps } from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface HazardTapeConfig extends KineticBaseConfig {}

const animation: KineticAnimation = {
  renderBackground: ({ bgColor, width, height, frame, fps }: BackgroundRenderProps) => {
    const time = frame / fps
    // Chevron stripe offset for animation
    const stripeOffset = (time * 30) % 60

    return (
      <div style={{ position: 'absolute', inset: 0, background: bgColor }}>
        {/* Top hazard tape band */}
        <div
          style={{
            position: 'absolute',
            top: '8%',
            left: 0,
            right: 0,
            height: 44,
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              position: 'absolute',
              inset: 0,
              backgroundImage: `repeating-linear-gradient(
                -45deg,
                #FFD000 0px, #FFD000 15px,
                #1a1a1a 15px, #1a1a1a 30px
              )`,
              backgroundPosition: `${stripeOffset}px 0`,
            }}
          />
          {/* Tape surface sheen */}
          <div
            style={{
              position: 'absolute',
              inset: 0,
              background: 'linear-gradient(180deg, rgba(255,255,255,0.15) 0%, transparent 40%, transparent 60%, rgba(0,0,0,0.15) 100%)',
            }}
          />
        </div>
        {/* Bottom hazard tape band */}
        <div
          style={{
            position: 'absolute',
            bottom: '8%',
            left: 0,
            right: 0,
            height: 44,
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              position: 'absolute',
              inset: 0,
              backgroundImage: `repeating-linear-gradient(
                -45deg,
                #FFD000 0px, #FFD000 15px,
                #1a1a1a 15px, #1a1a1a 30px
              )`,
              backgroundPosition: `-${stripeOffset}px 0`,
            }}
          />
          <div
            style={{
              position: 'absolute',
              inset: 0,
              background: 'linear-gradient(180deg, rgba(255,255,255,0.15) 0%, transparent 40%, transparent 60%, rgba(0,0,0,0.15) 100%)',
            }}
          />
        </div>
        {/* Gritty concrete texture overlay */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            backgroundImage: `repeating-linear-gradient(
              0deg,
              transparent, transparent 2px,
              rgba(255,255,255,0.015) 2px, rgba(255,255,255,0.015) 4px
            ), repeating-linear-gradient(
              90deg,
              transparent, transparent 3px,
              rgba(255,255,255,0.01) 3px, rgba(255,255,255,0.01) 6px
            )`,
            pointerEvents: 'none',
          }}
        />
      </div>
    )
  },

  renderWord: ({ word, color, enterProgress, exitProgress, phase, index, frame }: WordRenderProps) => {
    const seed = index * 73 + 19
    const f = frame ?? 0
    let opacity = 0
    let clipPath = 'inset(0 0 0 0)'
    let translateY = 0

    if (phase === 'enter') {
      // Tape peels away from center — clip inset shrinks to reveal text
      const tearProgress = Math.min(1, enterProgress * 1.3)
      const insetPct = (1 - tearProgress) * 50
      clipPath = `inset(${insetPct}% ${insetPct}% ${insetPct}% ${insetPct}%)`
      opacity = enterProgress
      // Slight upward lift as tape tears
      translateY = (1 - enterProgress) * 8
    } else if (phase === 'hold') {
      opacity = 1
      clipPath = 'inset(0 0 0 0)'
      // Subtle industrial vibration
      translateY = Math.sin(f * 0.8 + seed) * 1
    } else {
      opacity = 1 - exitProgress
      // Re-cover with tape from edges
      const coverPct = exitProgress * 50
      clipPath = `inset(${coverPct}% ${coverPct}% ${coverPct}% ${coverPct}%)`
    }

    return (
      <>
        {/* Stencil shadow */}
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: `translate(calc(-50% + 3px), calc(-50% + ${translateY + 3}px))`,
            fontFamily: "'Impact', 'Arial Black', sans-serif",
            fontSize: 'clamp(44px, 11vw, 150px)',
            fontWeight: 900,
            color: 'rgba(0,0,0,0.5)',
            whiteSpace: 'nowrap',
            textTransform: 'uppercase',
            letterSpacing: 8,
            opacity: opacity * 0.6,
            clipPath,
          }}
        >
          {word}
        </div>
        {/* Main stencil text */}
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: `translate(-50%, calc(-50% + ${translateY}px))`,
            fontFamily: "'Impact', 'Arial Black', sans-serif",
            fontSize: 'clamp(44px, 11vw, 150px)',
            fontWeight: 900,
            color,
            whiteSpace: 'nowrap',
            textTransform: 'uppercase',
            letterSpacing: 8,
            opacity,
            clipPath,
            textShadow: '0 0 6px rgba(255,208,0,0.3)',
          }}
        >
          {word}
        </div>
      </>
    )
  },
}

function HazardTapeComponent(props: MotionGraphicProps<HazardTapeConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-hazard-tape',
  title: 'Kinetic Hazard Tape',
  description: 'Yellow-black chevron hazard tape that tears and peels away to reveal industrial stencil text, with animated stripe bands and gritty concrete texture',
  tags: ['kinetic', 'typography', 'hazard', 'warning', 'tape', 'industrial', 'danger', 'safety'],
  category: 'captions',
  component: HazardTapeComponent as any,
  defaultConfig: {
    words: ['DANGER', 'HAZARD', 'KEEP OUT', 'WARNING'],
    colors: ['#FFD000', '#FFD000', '#FFD000', '#FFD000'],
    bgColor: '#1a1a1a',
    cycleDuration: 1.3,
  },
  configSchema: [
    { key: 'words', label: 'Words', type: 'text-array', defaultValue: ['DANGER', 'HAZARD', 'KEEP OUT', 'WARNING'], group: 'Content' },
    { key: 'colors', label: 'Colors', type: 'text-array', defaultValue: ['#FFD000', '#FFD000', '#FFD000', '#FFD000'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#1a1a1a', group: 'Style' },
    { key: 'cycleDuration', label: 'Cycle Duration (s)', type: 'number', defaultValue: 1.3, min: 0.3, max: 5, group: 'Timing' },
  ],
})
