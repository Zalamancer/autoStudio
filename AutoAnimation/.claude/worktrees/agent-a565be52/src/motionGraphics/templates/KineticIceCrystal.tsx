import { registerMotionGraphic } from '../registry'
import {
  KineticBase,
  type KineticBaseConfig,
  type KineticAnimation,
  type WordRenderProps,
  type BackgroundRenderProps,
} from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface IceCrystalConfig extends KineticBaseConfig {
  branchDepth: number
}

function easeOutExpo(t: number): number {
  return t === 1 ? 1 : 1 - Math.pow(2, -10 * t)
}

function easeInCubic(t: number): number {
  return t * t * t
}

// Generate a snowflake-style dendrite arm
function getDendrite(armIndex: number, totalArms: number, radius: number) {
  const angle = ((armIndex / totalArms) * 360 * Math.PI) / 180
  const x2 = Math.cos(angle) * radius
  const y2 = Math.sin(angle) * radius
  // Branch angles
  const branchAngle1 = angle + 0.5
  const branchAngle2 = angle - 0.5
  const branchR = radius * 0.4
  const midX = Math.cos(angle) * radius * 0.55
  const midY = Math.sin(angle) * radius * 0.55
  return {
    x2, y2,
    branch1X: midX + Math.cos(branchAngle1) * branchR,
    branch1Y: midY + Math.sin(branchAngle1) * branchR,
    branch2X: midX + Math.cos(branchAngle2) * branchR,
    branch2Y: midY + Math.sin(branchAngle2) * branchR,
    midX, midY,
    angle,
  }
}

const animation: KineticAnimation = {
  renderBackground: ({ bgColor, width, height }: BackgroundRenderProps) => (
    <div style={{ position: 'absolute', inset: 0, background: bgColor }}>
      {/* Ice crystal mist */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: 'radial-gradient(ellipse 70% 50% at 50% 50%, rgba(180,220,255,0.04) 0%, transparent 70%)',
        }}
      />
    </div>
  ),

  renderWord: ({ word, color, enterProgress, holdProgress, exitProgress, phase, width, height }: WordRenderProps) => {
    const chars = word.split('')
    const totalChars = chars.length
    const dendritesPerChar = 6
    const dendriteRadius = 55

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
          const charDelay = (ci / totalChars) * 0.35
          let dendGrowth = 0
          let textOpacity = 0
          let textScale = 1
          let freeze = 0

          if (phase === 'enter') {
            const p = Math.max(0, Math.min(1, (enterProgress - charDelay) / (1 - charDelay)))
            // Dendrites grow first (0-60%), text forms after (40-100%)
            dendGrowth = easeOutExpo(Math.min(1, p / 0.7))
            textOpacity = Math.min(1, Math.max(0, (p - 0.35) / 0.65) * 2)
            textScale = 0.6 + easeOutExpo(Math.max(0, (p - 0.35) / 0.65)) * 0.4
            freeze = dendGrowth
          } else if (phase === 'hold') {
            dendGrowth = 1
            textOpacity = 1
            textScale = 1
            // Ice dendrites slowly pulse/breathe
            freeze = 0.8 + Math.sin(holdProgress * Math.PI * 2 + ci) * 0.2
          } else {
            const p = easeInCubic(exitProgress)
            dendGrowth = 1 - p
            textOpacity = 1 - p * p
            textScale = 1 - p * 0.3
            freeze = dendGrowth
          }

          const dendrites = Array.from({ length: dendritesPerChar }, (_, di) =>
            getDendrite(di, dendritesPerChar, dendriteRadius)
          )

          return (
            <div
              key={ci}
              style={{
                position: 'relative',
                display: 'inline-block',
                transform: `scale(${textScale})`,
                transformOrigin: 'center center',
              }}
            >
              {/* Dendrite snowflake behind each letter */}
              <svg
                style={{
                  position: 'absolute',
                  top: '50%',
                  left: '50%',
                  transform: 'translate(-50%, -50%)',
                  width: dendriteRadius * 3,
                  height: dendriteRadius * 3,
                  overflow: 'visible',
                  pointerEvents: 'none',
                  opacity: freeze * 0.5,
                }}
                viewBox={`${-dendriteRadius * 1.5} ${-dendriteRadius * 1.5} ${dendriteRadius * 3} ${dendriteRadius * 3}`}
              >
                {dendrites.map((d, di) => {
                  const armDelay = di / dendritesPerChar
                  const armP = Math.max(0, Math.min(1, (dendGrowth - armDelay * 0.3) / 0.7))
                  const x2 = d.x2 * armP
                  const y2 = d.y2 * armP
                  const branchP = Math.max(0, Math.min(1, (armP - 0.4) / 0.6))
                  return (
                    <g key={di} stroke={color} strokeLinecap="round" fill="none">
                      {/* Main arm */}
                      <line x1={0} y1={0} x2={x2} y2={y2} strokeWidth={1.5} opacity={0.7} />
                      {/* Branch arms */}
                      {armP > 0.4 && (
                        <>
                          <line
                            x1={d.midX}
                            y1={d.midY}
                            x2={d.midX + (d.branch1X - d.midX) * branchP}
                            y2={d.midY + (d.branch1Y - d.midY) * branchP}
                            strokeWidth={1}
                            opacity={0.5}
                          />
                          <line
                            x1={d.midX}
                            y1={d.midY}
                            x2={d.midX + (d.branch2X - d.midX) * branchP}
                            y2={d.midY + (d.branch2Y - d.midY) * branchP}
                            strokeWidth={1}
                            opacity={0.5}
                          />
                        </>
                      )}
                      {/* Tip dot */}
                      {armP > 0.9 && (
                        <circle cx={x2} cy={y2} r={2} fill={color} opacity={0.6} />
                      )}
                    </g>
                  )
                })}
              </svg>

              {/* Letter crystallizes in */}
              <span
                style={{
                  fontFamily: "'Arial Black', 'Impact', sans-serif",
                  fontSize: 'clamp(52px, 13vw, 168px)',
                  fontWeight: 900,
                  color,
                  display: 'block',
                  lineHeight: 1,
                  opacity: textOpacity,
                  textShadow: `
                    0 0 20px ${color}80,
                    0 0 40px ${color}40,
                    2px 2px 0 rgba(0,0,0,0.3)
                  `,
                  filter: `brightness(${1 + freeze * 0.2})`,
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

function IceCrystalComponent(props: MotionGraphicProps<IceCrystalConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-ice-crystal',
  title: 'Kinetic Ice Crystal',
  description: 'Snowflake dendrites grow outward from each letter first — branching arms crystallize with tips, then the letter forms within the icy structure.',
  tags: ['kinetic', 'typography', 'ice', 'crystal', 'snowflake', 'dendrite', 'branch', 'grow', 'winter', 'organic'],
  category: 'captions',
  component: IceCrystalComponent as any,
  defaultConfig: {
    words: ['FREEZE', 'COLD', 'ICE', 'FROST'],
    colors: ['#B3E5FC', '#E1F5FE', '#81D4FA', '#E3F2FD'],
    bgColor: '#0A1628',
    cycleDuration: 1.8,
    branchDepth: 2,
  },
  configSchema: [
    { key: 'words', label: 'Words', type: 'text-array', defaultValue: ['FREEZE', 'COLD', 'ICE', 'FROST'], group: 'Content' },
    { key: 'colors', label: 'Colors', type: 'text-array', defaultValue: ['#B3E5FC', '#E1F5FE', '#81D4FA', '#E3F2FD'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#0A1628', group: 'Style' },
    { key: 'cycleDuration', label: 'Cycle Duration (s)', type: 'number', defaultValue: 1.8, min: 0.5, max: 5, group: 'Timing' },
    { key: 'branchDepth', label: 'Branch Depth', type: 'number', defaultValue: 2, min: 1, max: 4, group: 'Animation' },
  ],
})
