import { registerMotionGraphic } from '../registry'
import {
  KineticBase,
  type KineticBaseConfig,
  type KineticAnimation,
  type WordRenderProps,
  type BackgroundRenderProps,
} from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface CoralBuildConfig extends KineticBaseConfig {
  branchiness: number
}

function easeOutExpo(t: number): number {
  return t === 1 ? 1 : 1 - Math.pow(2, -10 * t)
}

function easeOutBack(t: number): number {
  const c1 = 1.70158
  const c3 = c1 + 1
  return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2)
}

function easeInCubic(t: number): number {
  return t * t * t
}

// Organic branching tree structure (simplified coral)
function getCoralBranch(index: number, total: number) {
  const spread = 0.9
  const startAngle = -Math.PI / 2  // pointing up
  const branchAngle = startAngle + ((index / (total - 1)) - 0.5) * spread * Math.PI

  const length = 30 + (index % 3) * 10
  const x2 = Math.cos(branchAngle) * length
  const y2 = Math.sin(branchAngle) * length

  // Sub-branches
  const subAngle1 = branchAngle + 0.4
  const subAngle2 = branchAngle - 0.4
  const subLen = length * 0.5

  return {
    x2, y2,
    sub1X: x2 + Math.cos(subAngle1) * subLen * 0.6,
    sub1Y: y2 + Math.sin(subAngle1) * subLen * 0.6,
    sub2X: x2 + Math.cos(subAngle2) * subLen * 0.6,
    sub2Y: y2 + Math.sin(subAngle2) * subLen * 0.6,
    startX: Math.cos(branchAngle) * length * 0.45,
    startY: Math.sin(branchAngle) * length * 0.45,
    tipR: 3 + (index % 3) * 1.5,
  }
}

const animation: KineticAnimation = {
  renderBackground: ({ bgColor, width, height }: BackgroundRenderProps) => (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        background: bgColor,
      }}
    >
      {/* Underwater light caustics */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: `
            radial-gradient(ellipse 80% 30% at 30% 20%, rgba(100,200,255,0.05) 0%, transparent 60%),
            radial-gradient(ellipse 60% 20% at 70% 80%, rgba(100,200,255,0.03) 0%, transparent 60%)
          `,
        }}
      />
    </div>
  ),

  renderWord: ({ word, color, enterProgress, holdProgress, exitProgress, phase, width, height }: WordRenderProps) => {
    const chars = word.split('')
    const totalChars = chars.length
    const branchTotal = 7

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
          let branchGrowth = 0
          let textOpacity = 0
          let textScale = 1
          let wave = 0

          if (phase === 'enter') {
            const p = Math.max(0, Math.min(1, (enterProgress - charDelay) / (1 - charDelay)))
            // Branches grow up first (0-65%), then letter emerges (50-100%)
            branchGrowth = easeOutExpo(Math.min(1, p / 0.75))
            textOpacity = Math.min(1, Math.max(0, (p - 0.45) / 0.55) * 2.5)
            textScale = easeOutBack(Math.max(0, (p - 0.5) / 0.5))
            textScale = Math.max(0.1, 0.3 + textScale * 0.7)
          } else if (phase === 'hold') {
            branchGrowth = 1
            textOpacity = 1
            textScale = 1
            // Gentle ocean sway
            wave = Math.sin(holdProgress * Math.PI * 2.5 + ci * 0.8) * 2
          } else {
            const p = easeInCubic(exitProgress)
            branchGrowth = 1 - p
            textOpacity = 1 - p * p
            textScale = 1 - p * 0.4
          }

          const branches = Array.from({ length: branchTotal }, (_, bi) => getCoralBranch(bi, branchTotal))

          return (
            <div
              key={ci}
              style={{
                position: 'relative',
                display: 'inline-block',
                transform: `scale(${textScale}) translateX(${wave}px)`,
                transformOrigin: 'center bottom',
              }}
            >
              {/* Coral branches growing upward from base */}
              <svg
                style={{
                  position: 'absolute',
                  bottom: 0,
                  left: '50%',
                  transform: 'translateX(-50%)',
                  width: 120,
                  height: 80,
                  overflow: 'visible',
                  pointerEvents: 'none',
                }}
                viewBox="-60 -80 120 80"
              >
                {branches.map((b, bi) => {
                  const branchDelay = bi / branchTotal * 0.5
                  const bP = Math.max(0, Math.min(1, (branchGrowth - branchDelay) / (1 - branchDelay)))
                  const subP = Math.max(0, Math.min(1, (bP - 0.5) / 0.5))

                  return (
                    <g key={bi} stroke={color} strokeLinecap="round" fill="none">
                      {/* Main branch */}
                      <line
                        x1={0} y1={0}
                        x2={b.x2 * bP} y2={b.y2 * bP}
                        strokeWidth={2 + (branchTotal - bi) * 0.3}
                        opacity={0.6}
                      />
                      {/* Sub-branches */}
                      {bP > 0.5 && (
                        <>
                          <line
                            x1={b.startX} y1={b.startY}
                            x2={b.startX + (b.sub1X - b.startX) * subP}
                            y2={b.startY + (b.sub1Y - b.startY) * subP}
                            strokeWidth={1.5}
                            opacity={0.5}
                          />
                          <line
                            x1={b.startX} y1={b.startY}
                            x2={b.startX + (b.sub2X - b.startX) * subP}
                            y2={b.startY + (b.sub2Y - b.startY) * subP}
                            strokeWidth={1.5}
                            opacity={0.5}
                          />
                        </>
                      )}
                      {/* Coral polyp tips */}
                      {bP > 0.85 && (
                        <circle
                          cx={b.x2 * bP}
                          cy={b.y2 * bP}
                          r={b.tipR}
                          fill={color}
                          opacity={0.5}
                          stroke="none"
                        />
                      )}
                    </g>
                  )
                })}
              </svg>

              <span
                style={{
                  fontFamily: "'Arial Black', 'Impact', sans-serif",
                  fontSize: 'clamp(52px, 13vw, 168px)',
                  fontWeight: 900,
                  color,
                  display: 'block',
                  lineHeight: 1,
                  opacity: textOpacity,
                  textShadow: `0 0 25px ${color}50, 2px 2px 0 rgba(0,0,0,0.4)`,
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

function CoralBuildComponent(props: MotionGraphicProps<CoralBuildConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-coral-build',
  title: 'Kinetic Coral Build',
  description: 'Organic branching coral structure grows upward from beneath each letter — branches split with sub-branches and polyp tips before the letter materializes from within the structure.',
  tags: ['kinetic', 'typography', 'coral', 'branch', 'grow', 'organic', 'underwater', 'build', 'nature', 'assembly'],
  category: 'captions',
  component: CoralBuildComponent as any,
  defaultConfig: {
    words: ['GROW', 'REEF', 'BLOOM', 'LIFE'],
    colors: ['#FF7675', '#E17055', '#FDCB6E', '#00B894'],
    bgColor: '#001F3F',
    cycleDuration: 2.0,
    branchiness: 7,
  },
  configSchema: [
    { key: 'words', label: 'Words', type: 'text-array', defaultValue: ['GROW', 'REEF', 'BLOOM', 'LIFE'], group: 'Content' },
    { key: 'colors', label: 'Colors', type: 'text-array', defaultValue: ['#FF7675', '#E17055', '#FDCB6E', '#00B894'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#001F3F', group: 'Style' },
    { key: 'cycleDuration', label: 'Cycle Duration (s)', type: 'number', defaultValue: 2.0, min: 0.5, max: 5, group: 'Timing' },
    { key: 'branchiness', label: 'Branchiness', type: 'number', defaultValue: 7, min: 3, max: 12, group: 'Animation' },
  ],
})
