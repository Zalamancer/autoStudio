import { registerMotionGraphic } from '../registry'
import {
  KineticBase,
  type KineticBaseConfig,
  type KineticAnimation,
  type WordRenderProps,
  type BackgroundRenderProps,
} from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface MagneticSnapConfig extends KineticBaseConfig {
  polarityStrength: number
}

function easeOutExpo(t: number): number {
  return t === 1 ? 1 : 1 - Math.pow(2, -10 * t)
}

function easeOutElastic(t: number): number {
  if (t <= 0) return 0
  if (t >= 1) return 1
  const p = 0.3
  return Math.pow(2, -10 * t) * Math.sin(((t - p / 4) * 2 * Math.PI) / p) + 1
}

function easeInQuad(t: number): number {
  return t * t
}

const animation: KineticAnimation = {
  renderBackground: ({ bgColor, width, height }: BackgroundRenderProps) => (
    <div style={{ position: 'absolute', inset: 0, background: bgColor }}>
      {/* Magnetic field lines radiating outward */}
      <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', opacity: 0.06 }}>
        {[0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330].map((angle, i) => {
          const rad = (angle * Math.PI) / 180
          const cx = width * 0.5
          const cy = height * 0.5
          const r = Math.min(width, height) * 0.4
          return (
            <line
              key={i}
              x1={cx}
              y1={cy}
              x2={cx + Math.cos(rad) * r}
              y2={cy + Math.sin(rad) * r}
              stroke="white"
              strokeWidth={0.5}
              strokeDasharray="3 6"
            />
          )
        })}
        <circle cx={width * 0.5} cy={height * 0.5} r={8} fill="white" opacity={0.3} />
      </svg>
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
          // Each char comes from a different edge of the canvas
          const edgePositions = [
            { x: -width * 0.5, y: 0 },          // left
            { x: width * 0.5, y: 0 },           // right
            { x: 0, y: -height * 0.5 },         // top
            { x: 0, y: height * 0.5 },          // bottom
            { x: -width * 0.4, y: -height * 0.4 }, // top-left
            { x: width * 0.4, y: -height * 0.4 },  // top-right
            { x: -width * 0.4, y: height * 0.4 },  // bottom-left
            { x: width * 0.4, y: height * 0.4 },   // bottom-right
          ]
          const startPos = edgePositions[ci % edgePositions.length]

          const charDelay = (ci / totalChars) * 0.25
          let translateX = 0
          let translateY = 0
          let opacity = 0
          let scale = 1
          let magnetGlow = 0

          if (phase === 'enter') {
            const p = Math.max(0, Math.min(1, (enterProgress - charDelay) / (1 - charDelay)))
            const eased = easeOutElastic(p)

            translateX = startPos.x * (1 - eased)
            translateY = startPos.y * (1 - eased)
            opacity = Math.min(1, p * 3)
            scale = 0.4 + eased * 0.6
            // Glow intensifies as approaching snap point
            magnetGlow = Math.max(0, eased - 0.5) * 2
          } else if (phase === 'hold') {
            opacity = 1
            scale = 1
            // Magnetic vibration — chars buzz in place
            const buzzAmt = Math.max(0, 0.5 - holdProgress) * 4
            translateX = Math.sin(holdProgress * Math.PI * 16 + ci * 2.3) * buzzAmt
            translateY = Math.cos(holdProgress * Math.PI * 14 + ci * 1.8) * buzzAmt
            magnetGlow = Math.max(0, 0.3 - holdProgress * 0.3) * 0.5
          } else {
            // Repel — letters fly outward in opposite directions
            const p = easeInQuad(exitProgress)
            translateX = -startPos.x * p * 0.7
            translateY = -startPos.y * p * 0.7
            opacity = 1 - exitProgress
            scale = 1 - p * 0.3
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
              <span
                style={{
                  fontFamily: "'Arial Black', 'Impact', sans-serif",
                  fontSize: 'clamp(52px, 13vw, 168px)',
                  fontWeight: 900,
                  color,
                  display: 'block',
                  lineHeight: 1,
                  textShadow: `
                    0 0 ${10 + magnetGlow * 30}px ${color},
                    0 0 ${20 + magnetGlow * 60}px ${color}60,
                    2px 2px 0 rgba(0,0,0,0.4)
                  `,
                  filter: `brightness(${1 + magnetGlow * 0.5})`,
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

function MagneticSnapComponent(props: MotionGraphicProps<MagneticSnapConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-magnetic-snap',
  title: 'Kinetic Magnetic Snap',
  description: 'Letters launch from all edges of the canvas pulled by a central magnetic force, each arriving from a different direction and snapping into place with elastic overshoot and glow.',
  tags: ['kinetic', 'typography', 'magnetic', 'snap', 'assemble', 'attract', 'edges', 'elastic', 'fragment'],
  category: 'captions',
  component: MagneticSnapComponent as any,
  defaultConfig: {
    words: ['PULL', 'LOCK', 'SNAP', 'HOLD'],
    colors: ['#FF6EC7', '#FF9F43', '#48DBFB', '#1DD1A1'],
    bgColor: '#0F0C29',
    cycleDuration: 1.5,
    polarityStrength: 100,
  },
  configSchema: [
    { key: 'words', label: 'Words', type: 'text-array', defaultValue: ['PULL', 'LOCK', 'SNAP', 'HOLD'], group: 'Content' },
    { key: 'colors', label: 'Colors', type: 'text-array', defaultValue: ['#FF6EC7', '#FF9F43', '#48DBFB', '#1DD1A1'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#0F0C29', group: 'Style' },
    { key: 'cycleDuration', label: 'Cycle Duration (s)', type: 'number', defaultValue: 1.5, min: 0.5, max: 5, group: 'Timing' },
    { key: 'polarityStrength', label: 'Polarity Strength', type: 'number', defaultValue: 100, min: 20, max: 200, group: 'Animation' },
  ],
})
