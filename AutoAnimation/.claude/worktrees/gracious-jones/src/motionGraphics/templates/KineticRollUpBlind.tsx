import { registerMotionGraphic } from '../registry'
import {
  KineticBase,
  type KineticBaseConfig,
  type KineticAnimation,
  type WordRenderProps,
  type BackgroundRenderProps,
} from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface RollUpBlindConfig extends KineticBaseConfig {
  rollSpeed: number
}

// Spring snap easing: overshoots slightly then settles
function easeOutSpring(t: number): number {
  if (t === 0) return 0
  if (t === 1) return 1
  const c4 = (2 * Math.PI) / 3
  return Math.pow(2, -8 * t) * Math.sin((t * 10 - 0.75) * c4) + 1
}

function easeInQuart(t: number): number {
  return t * t * t * t
}

const animation: KineticAnimation = {
  renderBackground: ({ bgColor }: BackgroundRenderProps) => (
    <div style={{ position: 'absolute', inset: 0, background: bgColor }} />
  ),

  renderWord: ({ word, color, enterProgress, exitProgress, phase, width, height }: WordRenderProps) => {
    const config = (globalThis as any).__rollUpBlindConfig ?? { rollSpeed: 1 }

    // The blind rolls up from bottom to top, revealing text
    // blindBottom is the y-position of the bottom edge of the rolled-up blind
    // 0 = fully covering, height = fully rolled up (gone)
    let rollHeight = 0 // how many px of blind remain covering text (from top)

    if (phase === 'enter') {
      const eased = easeOutSpring(enterProgress)
      // Blind rolls up: starts covering full height, springs to 0
      rollHeight = height * (1 - eased)
    } else if (phase === 'hold') {
      rollHeight = 0
    } else {
      const eased = easeInQuart(exitProgress)
      rollHeight = height * eased
    }

    const rollProgress = phase === 'enter' ? easeOutSpring(enterProgress) : phase === 'hold' ? 1 : 1 - easeInQuart(exitProgress)
    const textOpacity = Math.min(1, rollProgress * 1.5)

    // The rolled-up portion at the top — cylinder silhouette
    const rollRadius = 14
    const rolledAmount = height - rollHeight
    const cylinderY = rolledAmount > 0 ? rolledAmount - rollRadius : -rollRadius * 2

    return (
      <>
        {/* Text revealed beneath */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            opacity: textOpacity,
          }}
        >
          <div
            style={{
              fontFamily: "'Inter', 'Helvetica Neue', sans-serif",
              fontSize: 'clamp(40px, 12vw, 160px)',
              fontWeight: 900,
              color,
              whiteSpace: 'nowrap',
              letterSpacing: '0.04em',
              textTransform: 'uppercase',
              textShadow: `0 2px 20px ${color}44`,
            }}
          >
            {word}
          </div>
        </div>

        {/* The blind panel that covers the text — clips from top, rolls up */}
        {rollHeight > 0 && (
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width,
              height: rollHeight,
              background: 'linear-gradient(180deg, #c8c8d4 0%, #b0b0be 60%, #d8d8e0 100%)',
              boxShadow: '0 4px 12px rgba(0,0,0,0.35)',
            }}
          >
            {/* Horizontal slat lines for texture */}
            {Array.from({ length: Math.floor(rollHeight / 24) }).map((_, i) => (
              <div
                key={i}
                style={{
                  position: 'absolute',
                  top: i * 24 + 12,
                  left: 0,
                  width: '100%',
                  height: 1,
                  background: 'rgba(0,0,0,0.08)',
                }}
              />
            ))}
          </div>
        )}

        {/* Cylinder roll at top edge */}
        {rolledAmount > 0 && (
          <div
            style={{
              position: 'absolute',
              top: cylinderY,
              left: 0,
              width,
              height: rollRadius * 2,
              background: 'linear-gradient(180deg, #e8e8f0 0%, #a0a0b0 40%, #787888 60%, #b0b0c0 100%)',
              borderRadius: `0 0 ${rollRadius}px ${rollRadius}px`,
              boxShadow: '0 6px 14px rgba(0,0,0,0.4)',
            }}
          />
        )}
      </>
    )
  },
}

function RollUpBlindComponent(props: MotionGraphicProps<RollUpBlindConfig>) {
  ;(globalThis as any).__rollUpBlindConfig = props.config
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-roll-up-blind',
  title: 'Kinetic Roll-Up Blind',
  description: 'Text revealed as a roller blind springs upward with elastic snap, exposing the word beneath',
  tags: ['kinetic', 'typography', 'blind', 'roller', 'reveal', 'spring', 'mechanical', 'everyday'],
  category: 'captions',
  component: RollUpBlindComponent as any,
  defaultConfig: {
    words: ['REVEAL', 'OPEN', 'BRIGHT', 'CLEAR'],
    colors: ['#F0E68C', '#87CEEB', '#F08080', '#90EE90'],
    bgColor: '#1a1a2e',
    cycleDuration: 1.5,
    rollSpeed: 1,
  },
  configSchema: [
    {
      key: 'words',
      label: 'Words',
      type: 'text-array',
      defaultValue: ['REVEAL', 'OPEN', 'BRIGHT', 'CLEAR'],
      group: 'Content',
    },
    { key: 'colors', label: 'Colors', type: 'text-array', defaultValue: ['#F0E68C', '#87CEEB', '#F08080', '#90EE90'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#1a1a2e', group: 'Style' },
    {
      key: 'cycleDuration',
      label: 'Cycle Duration (s)',
      type: 'number',
      defaultValue: 1.5,
      min: 0.5,
      max: 5,
      group: 'Timing',
    },
    { key: 'rollSpeed', label: 'Roll Speed', type: 'number', defaultValue: 1, min: 0.5, max: 3, group: 'Animation' },
  ],
})
