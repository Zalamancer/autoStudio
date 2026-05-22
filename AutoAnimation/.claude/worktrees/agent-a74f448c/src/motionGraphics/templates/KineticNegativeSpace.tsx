import { registerMotionGraphic } from '../registry'
import { KineticBase, type KineticBaseConfig, type KineticAnimation, type WordRenderProps, type BackgroundRenderProps } from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface NegativeSpaceConfig extends KineticBaseConfig {
  invertSpeed: number
}

function easeOutExpo(t: number): number { return t === 1 ? 1 : 1 - Math.pow(2, -10 * t) }
function easeOutBack(t: number): number {
  const c = 1.70158
  return 1 + (c + 1) * Math.pow(t - 1, 3) + c * Math.pow(t - 1, 2)
}
function easeInCubic(t: number): number { return t * t * t }

const animation: KineticAnimation = {
  renderBackground: ({ bgColor, frame, fps }: BackgroundRenderProps) => (
    <div style={{ position: 'absolute', inset: 0, background: bgColor }} />
  ),

  renderWord: ({ word, color, enterProgress, holdProgress, exitProgress, phase, index, width }: WordRenderProps) => {
    const chars = word.split('')

    return (
      <div style={{
        position: 'absolute',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        display: 'flex',
        alignItems: 'center',
        whiteSpace: 'nowrap',
        gap: '2px',
      }}>
        {chars.map((ch, ci) => {
          const charFraction = chars.length > 1 ? ci / (chars.length - 1) : 0.5
          // Alternating: even chars are positive (color on dark bg), odd are negative (dark on color bg)
          const isNegative = ci % 2 === 1

          let scale = 1
          let opacity = 1
          let invertProgress = isNegative ? 1 : 0  // 1 = fully inverted, 0 = normal
          let translateY = 0
          let bgBoxOpacity = isNegative ? 1 : 0

          if (phase === 'enter') {
            // Even chars: slam down from above (positive)
            // Odd chars: punch up from below (negative)
            const direction = isNegative ? 1 : -1
            const stagger = charFraction * 0.12
            const p = Math.max(0, Math.min(1, (enterProgress - stagger) / (1 - stagger)))
            const snapped = easeOutBack(p)

            translateY = direction * 60 * (1 - snapped)
            scale = snapped < 0.01 ? 0.1 : snapped
            opacity = Math.min(1, p * 5)

            // Inversion flickers in during entry for negative chars
            if (isNegative) {
              invertProgress = Math.min(1, snapped)
              bgBoxOpacity = snapped
            }
          } else if (phase === 'hold') {
            // Hold: each character flip-inverts — alternating polarity
            const flipRate = 2.5
            const flipT = (Math.sin(holdProgress * Math.PI * flipRate + ci * Math.PI) + 1) * 0.5
            // Near the flip point, scale squishes down (like a card flip)
            const flipScale = Math.abs(Math.cos(holdProgress * Math.PI * flipRate + ci * Math.PI))
            scale = Math.max(0.05, flipScale)

            // Determine which face is showing based on flip angle
            const angle = Math.cos(holdProgress * Math.PI * flipRate + ci * Math.PI)
            invertProgress = angle < 0 ? 1 : 0
            bgBoxOpacity = invertProgress
          } else {
            // Exit: all chars snap to the same polarity (positive) then shrink
            const ep = easeInCubic(exitProgress)
            scale = 1 - ep
            opacity = 1 - ep
            invertProgress = isNegative ? Math.max(0, 1 - exitProgress * 3) : 0
            bgBoxOpacity = invertProgress
          }

          // Colors for inverted vs normal
          const textColor = invertProgress > 0.5 ? '#000000' : color
          const bgColor = invertProgress > 0.5 ? color : 'transparent'
          const borderColor = color

          return (
            <div key={ci} style={{
              display: 'inline-block',
              position: 'relative',
              transform: `translateY(${translateY}px) scale(${scale})`,
              transformOrigin: 'center center',
              opacity,
            }}>
              {/* Background box for negative space chars */}
              <div style={{
                position: 'absolute',
                inset: '-4px -2px',
                background: bgColor,
                opacity: bgBoxOpacity,
                border: `2px solid ${borderColor}`,
                borderRadius: 4,
              }} />
              <span style={{
                display: 'inline-block',
                fontFamily: "'Arial Black', 'Impact', sans-serif",
                fontSize: 'clamp(44px, 11vw, 150px)',
                fontWeight: 900,
                color: textColor,
                whiteSpace: 'pre',
                lineHeight: 1,
                position: 'relative',
                zIndex: 1,
                padding: '0 2px',
                textShadow: invertProgress > 0.5 ? 'none' : `0 2px 8px rgba(0,0,0,0.3)`,
              }}>
                {ch}
              </span>
            </div>
          )
        })}
      </div>
    )
  },
}

function NegativeSpaceComponent(props: MotionGraphicProps<NegativeSpaceConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-negative-space',
  title: 'Kinetic Negative Space',
  description: 'Alternating characters flip between positive (color on dark) and negative (dark on color box) states — entry staggers each polarity, hold triggers continuous polarity flipping per letter',
  tags: ['kinetic', 'typography', 'negative', 'positive', 'invert', 'morph', 'transform', 'contrast', 'flip', 'polarity'],
  category: 'captions',
  component: NegativeSpaceComponent as any,
  defaultConfig: {
    words: ['INVERT', 'FLIP', 'SWAP', 'NEON'],
    colors: ['#FFFFFF', '#FF2D55', '#00FF88', '#FFD700'],
    bgColor: '#000000',
    cycleDuration: 1.4,
    invertSpeed: 1,
  },
  configSchema: [
    { key: 'words', label: 'Words', type: 'text-array', defaultValue: ['INVERT', 'FLIP', 'SWAP', 'NEON'], group: 'Content' },
    { key: 'colors', label: 'Colors', type: 'text-array', defaultValue: ['#FFFFFF', '#FF2D55', '#00FF88', '#FFD700'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#000000', group: 'Style' },
    { key: 'cycleDuration', label: 'Cycle Duration (s)', type: 'number', defaultValue: 1.4, min: 0.3, max: 5, group: 'Timing' },
    { key: 'invertSpeed', label: 'Invert Speed', type: 'number', defaultValue: 1, min: 0.5, max: 3, group: 'Animation' },
  ],
})
