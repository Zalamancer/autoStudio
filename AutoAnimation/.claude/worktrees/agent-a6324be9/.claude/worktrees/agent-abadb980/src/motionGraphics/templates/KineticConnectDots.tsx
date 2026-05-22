import { registerMotionGraphic } from '../registry'
import {
  KineticBase,
  type KineticBaseConfig,
  type KineticAnimation,
  type WordRenderProps,
  type BackgroundRenderProps,
} from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface ConnectDotsConfig extends KineticBaseConfig {
  dotCount: number
}

function easeOutBack(t: number): number {
  const c1 = 1.70158
  const c3 = c1 + 1
  return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2)
}

function easeOutExpo(t: number): number {
  return t === 1 ? 1 : 1 - Math.pow(2, -10 * t)
}

// Pseudo-random dot positions deterministic per word+index
function getDotPosition(charIndex: number, dotIndex: number, totalDots: number, seed: number) {
  const angle = ((charIndex * 7 + dotIndex) / totalDots) * Math.PI * 2 + seed * 0.5
  const radius = 0.25 + ((charIndex * 3 + dotIndex * 11) % 7) * 0.08
  return { x: Math.cos(angle) * radius, y: Math.sin(angle) * radius }
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
      {/* Faint dot grid — connect the dots worksheet feel */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.06) 1.5px, transparent 1.5px)',
          backgroundSize: '40px 40px',
        }}
      />
    </div>
  ),

  renderWord: ({ word, color, enterProgress, holdProgress, exitProgress, phase, width, height }: WordRenderProps) => {
    const chars = word.split('')
    const totalChars = chars.length
    const dotCount = 6

    // Overall letter reveal timing
    const globalEased = easeOutExpo(enterProgress)

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
          let localP = 0
          let opacity = 0
          let scale = 1
          let dotLineProgress = 0

          if (phase === 'enter') {
            const p = Math.max(0, Math.min(1, (enterProgress - charDelay) / (1 - charDelay)))
            localP = easeOutBack(p)
            dotLineProgress = easeOutExpo(Math.min(1, p * 1.5))
            scale = 0.3 + localP * 0.7
            opacity = Math.min(1, p * 4)
          } else if (phase === 'hold') {
            localP = 1
            dotLineProgress = 1
            scale = 1
            opacity = 1
          } else {
            localP = 1
            dotLineProgress = 1 - easeOutExpo(exitProgress)
            const p = exitProgress
            scale = 1 - p * 0.4
            opacity = 1 - p * p
          }

          // Generate dots for this character
          const dots = Array.from({ length: dotCount }, (_, di) => {
            const pos = getDotPosition(ci, di, dotCount, ci)
            return {
              x: pos.x * width * 0.4,
              y: pos.y * height * 0.35,
              delay: di / dotCount,
            }
          })

          return (
            <div
              key={ci}
              style={{
                position: 'relative',
                display: 'inline-block',
              }}
            >
              {/* Connecting lines between dots — SVG overlay per char */}
              <svg
                style={{
                  position: 'absolute',
                  top: '50%',
                  left: '50%',
                  transform: 'translate(-50%, -50%)',
                  width: width * 0.8,
                  height: height * 0.7,
                  overflow: 'visible',
                  pointerEvents: 'none',
                  opacity: Math.max(0, 1 - opacity * 1.2),
                }}
              >
                {dots.map((dot, di) => {
                  const nextDot = dots[(di + 1) % dotCount]
                  const segDelay = dot.delay * 0.6
                  const segP = Math.max(0, Math.min(1, (dotLineProgress - segDelay) / (1 - segDelay)))
                  const x2 = dot.x + (nextDot.x - dot.x) * segP
                  const y2 = dot.y + (nextDot.y - dot.y) * segP
                  return (
                    <g key={di}>
                      <line
                        x1={dot.x}
                        y1={dot.y}
                        x2={x2}
                        y2={y2}
                        stroke={color}
                        strokeWidth={1.5}
                        strokeOpacity={0.5}
                        strokeLinecap="round"
                      />
                      <circle
                        cx={dot.x}
                        cy={dot.y}
                        r={3.5}
                        fill={color}
                        opacity={Math.min(1, segP * 3) * 0.8}
                      />
                      <text
                        x={dot.x + 7}
                        y={dot.y - 6}
                        fill={color}
                        fontSize={10}
                        opacity={Math.min(1, segP * 3) * 0.5}
                        fontFamily="monospace"
                      >
                        {ci * dotCount + di + 1}
                      </text>
                    </g>
                  )
                })}
              </svg>

              {/* The actual letter snaps into place as dots connect */}
              <span
                style={{
                  fontFamily: "'Arial Black', 'Impact', sans-serif",
                  fontSize: 'clamp(52px, 13vw, 168px)',
                  fontWeight: 900,
                  color,
                  display: 'inline-block',
                  opacity,
                  transform: `scale(${scale})`,
                  transformOrigin: 'center center',
                  lineHeight: 1,
                  textShadow: `0 0 30px ${color}50`,
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

function ConnectDotsComponent(props: MotionGraphicProps<ConnectDotsConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-connect-dots',
  title: 'Kinetic Connect Dots',
  description: 'Numbered dots appear and connect with lines, then snap into the letter shape — a connect-the-dots reveal where the path IS the typography.',
  tags: ['kinetic', 'typography', 'connect', 'dots', 'path', 'draw', 'numbered', 'assembly', 'construction'],
  category: 'captions',
  component: ConnectDotsComponent as any,
  defaultConfig: {
    words: ['JOIN', 'LINK', 'CONNECT', 'PATH'],
    colors: ['#FF9F1C', '#2EC4B6', '#E71D36', '#011627'],
    bgColor: '#F5F0E8',
    cycleDuration: 1.8,
    dotCount: 6,
  },
  configSchema: [
    { key: 'words', label: 'Words', type: 'text-array', defaultValue: ['JOIN', 'LINK', 'CONNECT', 'PATH'], group: 'Content' },
    { key: 'colors', label: 'Colors', type: 'text-array', defaultValue: ['#FF9F1C', '#2EC4B6', '#E71D36', '#011627'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#F5F0E8', group: 'Style' },
    { key: 'cycleDuration', label: 'Cycle Duration (s)', type: 'number', defaultValue: 1.8, min: 0.5, max: 5, group: 'Timing' },
    { key: 'dotCount', label: 'Dot Count', type: 'number', defaultValue: 6, min: 3, max: 12, group: 'Animation' },
  ],
})
