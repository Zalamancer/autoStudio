import { registerMotionGraphic } from '../registry'
import {
  KineticBase,
  type KineticBaseConfig,
  type KineticAnimation,
  type WordRenderProps,
  type BackgroundRenderProps,
} from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface TornRejoinConfig extends KineticBaseConfig {
  tearCount: number
}

function easeOutExpo(t: number): number {
  return t === 1 ? 1 : 1 - Math.pow(2, -10 * t)
}

function easeInQuart(t: number): number {
  return t * t * t * t
}

const animation: KineticAnimation = {
  renderBackground: ({ bgColor, width, height }: BackgroundRenderProps) => (
    <div style={{ position: 'absolute', inset: 0, background: bgColor }}>
      {/* Subtle horizontal tear lines across the canvas */}
      <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', opacity: 0.05 }}>
        {[0.3, 0.5, 0.7].map((pct, i) => (
          <path
            key={i}
            d={`M 0 ${height * pct} Q ${width * 0.25} ${height * (pct - 0.02)} ${width * 0.5} ${height * pct} Q ${width * 0.75} ${height * (pct + 0.02)} ${width} ${height * pct}`}
            fill="none"
            stroke="white"
            strokeWidth={0.5}
            strokeDasharray="8 12"
          />
        ))}
      </svg>
    </div>
  ),

  renderWord: ({ word, color, enterProgress, holdProgress, exitProgress, phase, width, height }: WordRenderProps) => {
    const chars = word.split('')
    const totalChars = chars.length

    // Split each letter into 2 torn halves (top and bottom)
    // They slide in from opposite directions then reunite

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
          const charDelay = (ci / totalChars) * 0.4
          let topOffset = 0
          let bottomOffset = 0
          let opacity = 1
          let scale = 1
          let tearGap = 0

          if (phase === 'enter') {
            const p = Math.max(0, Math.min(1, (enterProgress - charDelay) / (1 - charDelay)))
            const eased = easeOutExpo(p)

            // Top half falls from above, bottom rises from below
            topOffset = -(1 - eased) * height * 0.45
            bottomOffset = (1 - eased) * height * 0.45
            opacity = Math.min(1, p * 2)
            scale = 0.7 + eased * 0.3
            // Tear gap closes as they meet
            tearGap = (1 - eased) * 4
          } else if (phase === 'hold') {
            topOffset = 0
            bottomOffset = 0
            opacity = 1
            scale = 1
            // Subtle breathing — pieces breathe apart slightly
            tearGap = Math.sin(holdProgress * Math.PI * 3 + ci) * 1
          } else {
            const p = easeInQuart(exitProgress)
            // Exit: tear apart again
            topOffset = -p * height * 0.45
            bottomOffset = p * height * 0.45
            opacity = 1 - exitProgress
            tearGap = p * 6
          }

          const fontSize = 'clamp(52px, 13vw, 168px)'
          const halfHeight = 'clamp(26px, 6.5vw, 84px)'

          return (
            <div
              key={ci}
              style={{
                display: 'inline-block',
                position: 'relative',
                opacity,
                transform: `scale(${scale})`,
                transformOrigin: 'center center',
              }}
            >
              {/* Top half — clips to show only top 50% of character */}
              <div
                style={{
                  position: 'relative',
                  transform: `translateY(${topOffset}px)`,
                  overflow: 'hidden',
                  height: halfHeight,
                  display: 'flex',
                  alignItems: 'flex-start',
                }}
              >
                <span
                  style={{
                    fontFamily: "'Arial Black', 'Impact', sans-serif",
                    fontSize,
                    fontWeight: 900,
                    color,
                    display: 'block',
                    lineHeight: 1,
                    userSelect: 'none',
                    // Torn edge shadow on the cut
                    filter: 'drop-shadow(0 2px 3px rgba(0,0,0,0.6))',
                  }}
                >
                  {ch}
                </span>
              </div>

              {/* Tear gap */}
              <div style={{ height: tearGap, overflow: 'hidden' }} />

              {/* Bottom half — clips to show only bottom 50% */}
              <div
                style={{
                  position: 'relative',
                  transform: `translateY(${bottomOffset}px)`,
                  overflow: 'hidden',
                  height: halfHeight,
                  display: 'flex',
                  alignItems: 'flex-end',
                }}
              >
                <span
                  style={{
                    fontFamily: "'Arial Black', 'Impact', sans-serif",
                    fontSize,
                    fontWeight: 900,
                    color,
                    display: 'block',
                    lineHeight: 1,
                    marginTop: `calc(-${halfHeight})`,
                    userSelect: 'none',
                    filter: 'drop-shadow(0 -2px 3px rgba(0,0,0,0.6))',
                  }}
                >
                  {ch}
                </span>
              </div>
            </div>
          )
        })}
      </div>
    )
  },
}

function TornRejoinComponent(props: MotionGraphicProps<TornRejoinConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-torn-rejoin',
  title: 'Kinetic Torn Rejoin',
  description: 'Each letter is torn horizontally into two halves — the top half falls from above, the bottom rises from below, and they snap together with a satisfying join.',
  tags: ['kinetic', 'typography', 'torn', 'tear', 'rejoin', 'split', 'assembly', 'fragment', 'reunite'],
  category: 'captions',
  component: TornRejoinComponent as any,
  defaultConfig: {
    words: ['TORN', 'JOIN', 'MEND', 'WHOLE'],
    colors: ['#FF5F5F', '#FFB347', '#FFE66D', '#A8FF78'],
    bgColor: '#111111',
    cycleDuration: 1.5,
    tearCount: 2,
  },
  configSchema: [
    { key: 'words', label: 'Words', type: 'text-array', defaultValue: ['TORN', 'JOIN', 'MEND', 'WHOLE'], group: 'Content' },
    { key: 'colors', label: 'Colors', type: 'text-array', defaultValue: ['#FF5F5F', '#FFB347', '#FFE66D', '#A8FF78'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#111111', group: 'Style' },
    { key: 'cycleDuration', label: 'Cycle Duration (s)', type: 'number', defaultValue: 1.5, min: 0.5, max: 5, group: 'Timing' },
    { key: 'tearCount', label: 'Tear Count', type: 'number', defaultValue: 2, min: 1, max: 4, group: 'Animation' },
  ],
})
