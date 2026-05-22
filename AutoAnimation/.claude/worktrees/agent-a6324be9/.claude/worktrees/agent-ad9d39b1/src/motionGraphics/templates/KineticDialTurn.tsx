import { registerMotionGraphic } from '../registry'
import {
  KineticBase,
  type KineticBaseConfig,
  type KineticAnimation,
  type WordRenderProps,
  type BackgroundRenderProps,
} from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface DialTurnConfig extends KineticBaseConfig {}

function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3)
}

function easeInCubic(t: number): number {
  return t * t * t
}

/**
 * KineticDialTurn
 * Like a combination safe or rotary phone dial: a circular dial with tick marks
 * rotates CW then CCW to "dial in" each letter. Characters appear one at a time
 * as if the dial clicks past each number to reveal the corresponding letter.
 * The text assembles left-to-right as the dial cycles through each char.
 */
const animation: KineticAnimation = {
  renderBackground: ({ bgColor, width, height, frame, fps }: BackgroundRenderProps) => {
    const time = frame / fps
    const cx = width / 2
    const cy = height / 2
    const dialR = Math.min(width, height) * 0.34

    // Dial tick marks (24 positions like a combination lock)
    const ticks = Array.from({ length: 24 }, (_, i) => {
      const angle = (i / 24) * 360 - 90
      const rad = (angle * Math.PI) / 180
      const isMajor = i % 4 === 0
      const innerR = dialR * (isMajor ? 0.78 : 0.84)
      const outerR = dialR * 0.94
      const x1 = cx + Math.cos(rad) * innerR
      const y1 = cy + Math.sin(rad) * innerR
      const x2 = cx + Math.cos(rad) * outerR
      const y2 = cy + Math.sin(rad) * outerR
      return { x1, y1, x2, y2, isMajor }
    })

    // Slow ambient rotation of the dial housing
    const housingRotation = time * 4

    return (
      <div style={{ position: 'absolute', inset: 0, background: bgColor }}>
        {/* Dial housing ring */}
        <div
          style={{
            position: 'absolute',
            left: cx - dialR,
            top: cy - dialR,
            width: dialR * 2,
            height: dialR * 2,
            borderRadius: '50%',
            border: '3px solid rgba(255,255,255,0.12)',
            background: 'rgba(255,255,255,0.03)',
            transform: `rotate(${housingRotation}deg)`,
          }}
        />
        {/* Tick marks */}
        <svg
          style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}
          width={width}
          height={height}
        >
          {ticks.map((t, i) => (
            <line
              key={i}
              x1={t.x1}
              y1={t.y1}
              x2={t.x2}
              y2={t.y2}
              stroke={`rgba(255,255,255,${t.isMajor ? 0.18 : 0.07})`}
              strokeWidth={t.isMajor ? 2 : 1}
            />
          ))}
        </svg>
        {/* Pointer notch at top */}
        <div
          style={{
            position: 'absolute',
            left: cx - 1,
            top: cy - dialR - 10,
            width: 2,
            height: 10,
            background: 'rgba(255,255,255,0.5)',
            borderRadius: 1,
          }}
        />
        {/* Center hub */}
        <div
          style={{
            position: 'absolute',
            left: cx - 5,
            top: cy - 5,
            width: 10,
            height: 10,
            borderRadius: '50%',
            background: 'rgba(255,255,255,0.2)',
            border: '1px solid rgba(255,255,255,0.4)',
          }}
        />
      </div>
    )
  },

  renderWord: ({ word, color, enterProgress, exitProgress, phase }: WordRenderProps) => {
    const chars = word.split('')
    const totalChars = chars.length

    // How many characters have "clicked into place"
    let charsRevealed = 0
    let dialAngle = 0
    let overallOpacity = 1

    if (phase === 'enter') {
      // Dial sweeps CW; each full sweep reveals one more character
      const totalSweeps = totalChars
      const sweepProgress = enterProgress * totalSweeps
      charsRevealed = Math.floor(sweepProgress)
      const subProgress = sweepProgress - charsRevealed
      const eased = easeOutCubic(subProgress)
      // Alternating CW/CCW like a real combination lock
      const direction = charsRevealed % 2 === 0 ? 1 : -1
      dialAngle = direction * 720 * enterProgress // multiple full rotations
      overallOpacity = 1
    } else if (phase === 'hold') {
      charsRevealed = totalChars
      dialAngle = 0
    } else {
      charsRevealed = totalChars
      const eased = easeInCubic(exitProgress)
      dialAngle = eased * 360
      overallOpacity = 1 - exitProgress
    }

    return (
      <>
        {/* Dial rotation indicator — subtle ring that shows angle */}
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            width: '62%',
            height: '62%',
            transform: `translate(-50%, -50%) rotate(${dialAngle}deg)`,
            borderRadius: '50%',
            border: `2px solid ${color}22`,
          }}
        />
        {/* Assembled text */}
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            display: 'flex',
            opacity: overallOpacity,
          }}
        >
          {chars.map((ch, ci) => {
            const revealed = ci < charsRevealed
            const isNext = ci === charsRevealed

            let charOpacity = 0
            let charScale = 0.4
            let blur = 0

            if (revealed) {
              charOpacity = 1
              charScale = 1
            } else if (isNext && phase === 'enter') {
              // Currently being dialled in
              const partialP = (enterProgress * totalChars) - charsRevealed
              const eased = easeOutCubic(partialP)
              charOpacity = eased
              charScale = 0.4 + 0.6 * eased
              blur = (1 - eased) * 4
            }

            return (
              <span
                key={ci}
                style={{
                  fontFamily: "'Courier New', 'Lucida Console', monospace",
                  fontSize: 'clamp(40px, 10vw, 140px)',
                  fontWeight: 800,
                  color,
                  display: 'inline-block',
                  opacity: charOpacity,
                  transform: `scale(${charScale})`,
                  filter: blur > 0 ? `blur(${blur}px)` : undefined,
                  transformOrigin: 'center bottom',
                  letterSpacing: '0.06em',
                  textShadow: `0 0 16px ${color}44`,
                }}
              >
                {ch}
              </span>
            )
          })}
        </div>
      </>
    )
  },
}

function DialTurnComponent(props: MotionGraphicProps<DialTurnConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-dial-turn',
  title: 'Kinetic Dial Turn',
  description:
    'Combination-lock dial rotates CW/CCW to click each letter into place — the dial mechanism assembles the word one character at a time.',
  tags: ['kinetic', 'typography', 'dial', 'safe', 'combination', 'lock', 'rotary', 'mechanical'],
  category: 'captions',
  component: DialTurnComponent as any,
  defaultConfig: {
    words: ['LOCK', 'SAFE', 'SPIN', 'OPEN'],
    colors: ['#C0C0C0', '#FFD700', '#E8E8E8', '#88BBFF'],
    bgColor: '#0d0d12',
    cycleDuration: 2.0,
  },
  configSchema: [
    { key: 'words', label: 'Words', type: 'text-array', defaultValue: ['LOCK', 'SAFE', 'SPIN', 'OPEN'], group: 'Content' },
    { key: 'colors', label: 'Colors', type: 'text-array', defaultValue: ['#C0C0C0', '#FFD700', '#E8E8E8', '#88BBFF'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#0d0d12', group: 'Style' },
    { key: 'cycleDuration', label: 'Cycle Duration (s)', type: 'number', defaultValue: 2.0, min: 0.5, max: 5, group: 'Timing' },
  ],
})
