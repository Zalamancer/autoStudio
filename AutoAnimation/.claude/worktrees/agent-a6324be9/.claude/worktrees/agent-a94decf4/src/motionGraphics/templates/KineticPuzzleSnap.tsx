import { registerMotionGraphic } from '../registry'
import {
  KineticBase,
  type KineticBaseConfig,
  type KineticAnimation,
  type WordRenderProps,
  type BackgroundRenderProps,
} from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface PuzzleSnapConfig extends KineticBaseConfig {
  snapForce: number
}

function easeOutBack(t: number): number {
  const c1 = 1.70158
  const c3 = c1 + 1
  return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2)
}

function easeOutExpo(t: number): number {
  return t === 1 ? 1 : 1 - Math.pow(2, -10 * t)
}

function easeInCubic(t: number): number {
  return t * t * t
}

// Sliding directions: each "piece" comes from a perpendicular direction
// mimicking puzzle pieces sliding into place
function getPieceDirection(ci: number) {
  const dirs = [
    { x: 0, y: -1 },   // from top
    { x: 0, y: 1 },    // from bottom
    { x: -1, y: 0 },   // from left
    { x: 1, y: 0 },    // from right
    { x: -1, y: -1 },  // diagonal
    { x: 1, y: -1 },
    { x: -1, y: 1 },
    { x: 1, y: 1 },
  ]
  return dirs[ci % dirs.length]
}

const animation: KineticAnimation = {
  renderBackground: ({ bgColor, width, height }: BackgroundRenderProps) => (
    <div style={{ position: 'absolute', inset: 0, background: bgColor }}>
      {/* Empty puzzle board hints */}
      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: '84%',
          height: 'clamp(70px, 17vw, 200px)',
          border: '2px dashed rgba(255,255,255,0.08)',
          borderRadius: 4,
        }}
      />
    </div>
  ),

  renderWord: ({ word, color, enterProgress, holdProgress, exitProgress, phase, width, height }: WordRenderProps) => {
    const chars = word.split('')
    const totalChars = chars.length

    return (
      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          display: 'flex',
          whiteSpace: 'nowrap',
          alignItems: 'center',
        }}
      >
        {chars.map((ch, ci) => {
          const dir = getPieceDirection(ci)
          // Stagger: each piece arrives slightly later
          const charDelay = (ci / totalChars) * 0.45
          let translateX = 0
          let translateY = 0
          let opacity = 0
          let scale = 1
          let snapFlash = 0
          let borderOpacity = 0

          if (phase === 'enter') {
            const p = Math.max(0, Math.min(1, (enterProgress - charDelay) / (1 - charDelay)))
            const eased = easeOutBack(p)

            // Slide in from direction
            translateX = dir.x * width * 0.5 * (1 - eased)
            translateY = dir.y * height * 0.4 * (1 - eased)
            opacity = Math.min(1, p * 2.5)
            scale = 0.6 + eased * 0.4
            // Flash on final snap
            snapFlash = Math.max(0, (p - 0.85) / 0.15)
            // Puzzle piece border visible during flight
            borderOpacity = Math.max(0, 1 - p * 1.5)
          } else if (phase === 'hold') {
            opacity = 1
            scale = 1
            translateX = 0
            translateY = 0
            // Subtle locked-in pulse
            const pulse = Math.sin(holdProgress * Math.PI * 2) * 0.015
            scale = 1 + pulse
            borderOpacity = 0
          } else {
            const p = easeInCubic(exitProgress)
            translateX = dir.x * width * 0.3 * p
            translateY = dir.y * height * 0.3 * p
            opacity = 1 - p
            scale = 1 - p * 0.2
          }

          return (
            <div
              key={ci}
              style={{
                display: 'inline-block',
                transform: `translateX(${translateX}px) translateY(${translateY}px) scale(${scale})`,
                transformOrigin: 'center center',
                opacity,
                position: 'relative',
              }}
            >
              {/* Puzzle piece edge highlight */}
              <div
                style={{
                  position: 'absolute',
                  inset: -2,
                  border: `2px solid ${color}`,
                  opacity: borderOpacity * 0.5,
                  borderRadius: 3,
                  pointerEvents: 'none',
                }}
              />
              {/* Snap flash */}
              <div
                style={{
                  position: 'absolute',
                  inset: 0,
                  background: 'white',
                  opacity: snapFlash * 0.4,
                  borderRadius: 2,
                  mixBlendMode: 'overlay',
                  pointerEvents: 'none',
                }}
              />
              <span
                style={{
                  fontFamily: "'Arial Black', 'Impact', sans-serif",
                  fontSize: 'clamp(52px, 13vw, 168px)',
                  fontWeight: 900,
                  color,
                  display: 'block',
                  lineHeight: 1,
                  textShadow: `2px 2px 0 rgba(0,0,0,0.4), 0 0 20px ${color}30`,
                  filter: `brightness(${1 + snapFlash * 0.4})`,
                }}
              >
                {ch}
              </span>
            </div>
          )
        })}
      </div>
    )
  },
}

function PuzzleSnapComponent(props: MotionGraphicProps<PuzzleSnapConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-puzzle-snap',
  title: 'Kinetic Puzzle Snap',
  description: 'Letters slide in from different perpendicular directions like puzzle pieces being slotted into place — each one snaps with a flash of light on impact.',
  tags: ['kinetic', 'typography', 'puzzle', 'snap', 'slide', 'assemble', 'piece', 'fragment', 'lock'],
  category: 'captions',
  component: PuzzleSnapComponent as any,
  defaultConfig: {
    words: ['PIECE', 'FIT', 'LOCK', 'DONE'],
    colors: ['#FD7272', '#9AECDB', '#58B19F', '#EAB543'],
    bgColor: '#192A56',
    cycleDuration: 1.6,
    snapForce: 80,
  },
  configSchema: [
    { key: 'words', label: 'Words', type: 'text-array', defaultValue: ['PIECE', 'FIT', 'LOCK', 'DONE'], group: 'Content' },
    { key: 'colors', label: 'Colors', type: 'text-array', defaultValue: ['#FD7272', '#9AECDB', '#58B19F', '#EAB543'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#192A56', group: 'Style' },
    { key: 'cycleDuration', label: 'Cycle Duration (s)', type: 'number', defaultValue: 1.6, min: 0.5, max: 5, group: 'Timing' },
    { key: 'snapForce', label: 'Snap Force', type: 'number', defaultValue: 80, min: 20, max: 200, group: 'Animation' },
  ],
})
