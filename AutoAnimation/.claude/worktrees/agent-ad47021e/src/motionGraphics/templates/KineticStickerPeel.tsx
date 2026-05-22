import { registerMotionGraphic } from '../registry'
import { KineticBase, type KineticBaseConfig, type KineticAnimation, type WordRenderProps, type BackgroundRenderProps } from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface StickerPeelConfig extends KineticBaseConfig {
  stickerColor: string
}

function easeOutElastic(t: number): number {
  if (t === 0 || t === 1) return t
  const p = 0.4
  return Math.pow(2, -10 * t) * Math.sin((t - p / 4) * (2 * Math.PI) / p) + 1
}

function easeInBack(t: number): number {
  const c1 = 1.70158
  const c3 = c1 + 1
  return c3 * t * t * t - c1 * t * t
}

const animation: KineticAnimation = {
  renderBackground: ({ bgColor, width, height }: BackgroundRenderProps) => {
    return (
      <div style={{ position: 'absolute', inset: 0, background: bgColor }}>
        {/* Subtle surface texture — brushed metal / desk surface */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            backgroundImage: `repeating-linear-gradient(
              90deg,
              transparent,
              transparent 3px,
              rgba(255,255,255,0.008) 3px,
              rgba(255,255,255,0.008) 4px
            )`,
            pointerEvents: 'none',
          }}
        />
        {/* Desk vignette */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: 'radial-gradient(ellipse at center, transparent 40%, rgba(0,0,0,0.3) 100%)',
            pointerEvents: 'none',
          }}
        />
      </div>
    )
  },

  renderWord: ({ word, color, enterProgress, holdProgress, exitProgress, phase, index, width, height }: WordRenderProps) => {
    let peelProgress = 0
    let stickerRotation = 0
    let stickerScale = 1
    let opacity = 0
    let adhesiveStretch = 0
    let shadowBlur = 4
    let shadowY = 2
    let peelCornerY = 0

    if (phase === 'enter') {
      // Phase 1 (0-0.4): Sticker peels from backing — corner lifts
      // Phase 2 (0.4-0.7): Adhesive stretches, sticker hangs
      // Phase 3 (0.7-1.0): Slap down into place
      if (enterProgress < 0.4) {
        const p = enterProgress / 0.4
        peelProgress = p
        opacity = Math.min(1, p * 2.5)
        stickerRotation = -15 + p * 10
        peelCornerY = -(1 - p) * 60
        stickerScale = 0.85 + p * 0.1
        shadowBlur = 2 + p * 8
        shadowY = 1 + p * 6
        adhesiveStretch = p * 0.8
      } else if (enterProgress < 0.7) {
        const p = (enterProgress - 0.4) / 0.3
        peelProgress = 1
        opacity = 1
        stickerRotation = -5 + p * 8
        stickerScale = 0.95 + p * 0.05
        shadowBlur = 10 + p * 5
        shadowY = 7 + p * 8
        adhesiveStretch = 0.8 - p * 0.8
      } else {
        // Slap down with elastic overshoot
        const p = (enterProgress - 0.7) / 0.3
        const elastic = easeOutElastic(p)
        peelProgress = 1
        opacity = 1
        stickerRotation = 3 * (1 - elastic) + (Math.sin(p * Math.PI * 2) * 2 * (1 - p))
        stickerScale = 1 + (1 - elastic) * 0.08
        shadowBlur = 15 - elastic * 11
        shadowY = 15 - elastic * 13
      }
    } else if (phase === 'hold') {
      opacity = 1
      peelProgress = 1
      stickerRotation = Math.sin(holdProgress * Math.PI * 2) * 1.2
      shadowBlur = 4
      shadowY = 2
      // Subtle sticker breathing
      stickerScale = 1 + Math.sin(holdProgress * Math.PI * 3) * 0.008
    } else {
      // Peel off exit — lifts from corner and peels away
      const p = easeInBack(Math.min(1, exitProgress * 1.2))
      opacity = 1 - exitProgress * 0.5
      peelProgress = 1 - p * 0.5
      stickerRotation = p * 25
      stickerScale = 1 - p * 0.15
      shadowBlur = 4 + p * 20
      shadowY = 2 + p * 30
      peelCornerY = p * -40
      if (exitProgress > 0.8) opacity = (1 - exitProgress) * 5
    }

    // Sticker backing pad color
    const stickerBg = '#F5F5F0'

    return (
      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: `translate(-50%, -50%) rotate(${stickerRotation}deg) scale(${stickerScale})`,
          opacity,
        }}
      >
        {/* Sticker body */}
        <div
          style={{
            position: 'relative',
            padding: '16px 32px',
            background: stickerBg,
            borderRadius: 6,
            boxShadow: `0 ${shadowY}px ${shadowBlur}px rgba(0,0,0,0.25), 0 1px 2px rgba(0,0,0,0.1)`,
          }}
        >
          {/* Sticker text */}
          <div
            style={{
              fontFamily: "'Impact', 'Arial Black', sans-serif",
              fontSize: 'clamp(36px, 10vw, 140px)',
              fontWeight: 900,
              color,
              letterSpacing: 3,
              textTransform: 'uppercase',
              whiteSpace: 'nowrap',
              lineHeight: 1.1,
            }}
          >
            {word}
          </div>
          {/* Sticker edge — slight curl on peeled corner */}
          {(phase === 'enter' && enterProgress < 0.7) && (
            <div
              style={{
                position: 'absolute',
                top: peelCornerY,
                right: -4,
                width: 30,
                height: 30,
                background: `linear-gradient(135deg, ${stickerBg} 50%, rgba(0,0,0,0.05) 50%)`,
                transform: `rotate(${adhesiveStretch * 15}deg)`,
                borderRadius: '0 4px 0 0',
                pointerEvents: 'none',
              }}
            />
          )}
          {/* Adhesive stretch strings */}
          {adhesiveStretch > 0.1 && (
            <div style={{ position: 'absolute', bottom: -8, left: '20%', right: '20%', height: 8, pointerEvents: 'none' }}>
              {Array.from({ length: 5 }, (_, i) => {
                const x = (i / 4) * 100
                const stretch = adhesiveStretch * (6 + Math.sin(i * 1.7) * 3)
                return (
                  <div
                    key={i}
                    style={{
                      position: 'absolute',
                      left: `${x}%`,
                      bottom: 0,
                      width: 1,
                      height: stretch,
                      background: `rgba(255,255,240,${0.3 + adhesiveStretch * 0.4})`,
                      borderRadius: '0 0 1px 1px',
                    }}
                  />
                )
              })}
            </div>
          )}
          {/* Glossy sheen */}
          <div
            style={{
              position: 'absolute',
              inset: 0,
              background: 'linear-gradient(135deg, rgba(255,255,255,0.15) 0%, transparent 50%, rgba(255,255,255,0.05) 100%)',
              borderRadius: 6,
              pointerEvents: 'none',
            }}
          />
        </div>
      </div>
    )
  },
}

function StickerPeelComponent(props: MotionGraphicProps<StickerPeelConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-sticker-peel',
  title: 'Kinetic Sticker Peel',
  description: 'Vinyl sticker peeling off backing with adhesive stretch and elastic slap-down placement, tactile sticker application feel',
  tags: ['kinetic', 'typography', 'sticker', 'peel', 'vinyl', 'craft', 'adhesive', 'tactile'],
  category: 'captions',
  component: StickerPeelComponent as any,
  defaultConfig: {
    words: ['SLAP', 'STICK', 'PEEL', 'VINYL'],
    colors: ['#FF3366', '#00CC88', '#FFB800', '#6C5CE7'],
    bgColor: '#1A1A2E',
    cycleDuration: 1.3,
    stickerColor: '#F5F5F0',
  },
  configSchema: [
    { key: 'words', label: 'Words', type: 'text-array', defaultValue: ['SLAP', 'STICK', 'PEEL', 'VINYL'], group: 'Content' },
    { key: 'colors', label: 'Colors', type: 'text-array', defaultValue: ['#FF3366', '#00CC88', '#FFB800', '#6C5CE7'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#1A1A2E', group: 'Style' },
    { key: 'cycleDuration', label: 'Cycle Duration (s)', type: 'number', defaultValue: 1.3, min: 0.3, max: 5, group: 'Timing' },
    { key: 'stickerColor', label: 'Sticker Color', type: 'color', defaultValue: '#F5F5F0', group: 'Style' },
  ],
})
