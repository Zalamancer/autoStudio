import { registerMotionGraphic } from '../registry'
import {
  KineticBase,
  type KineticBaseConfig,
  type KineticAnimation,
  type WordRenderProps,
  type BackgroundRenderProps,
} from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface BatikCrackConfig extends KineticBaseConfig {
  crackDensity: number
}

/** Deterministic pseudo-random 0..1 */
function rand(s: number): number {
  const x = Math.sin(s * 127.1 + 311.7) * 43758.5453
  return x - Math.floor(x)
}

function easeOutQuart(t: number): number {
  return 1 - Math.pow(1 - t, 4)
}

const animation: KineticAnimation = {
  renderBackground: ({ bgColor, width, height, frame, fps }: BackgroundRenderProps) => {
    const time = frame / fps

    // Generate crackle lines — characteristic batik wax-crack pattern
    const crackLines: { x1: number; y1: number; x2: number; y2: number; opacity: number }[] = []
    for (let i = 0; i < 40; i++) {
      const x1 = rand(i * 3 + 1) * 100
      const y1 = rand(i * 3 + 2) * 100
      const angle = rand(i * 3 + 3) * Math.PI * 2
      const len = 3 + rand(i * 5 + 4) * 12
      const x2 = x1 + Math.cos(angle) * len
      const y2 = y1 + Math.sin(angle) * len
      crackLines.push({ x1, y1, x2, y2, opacity: 0.06 + rand(i * 7) * 0.08 })
    }

    return (
      <div style={{ position: 'absolute', inset: 0, background: bgColor }}>
        {/* Cotton fabric base texture */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            backgroundImage: `repeating-linear-gradient(0deg, transparent 0px, transparent 3px, rgba(200,195,180,0.08) 3px, rgba(200,195,180,0.08) 4px),
              repeating-linear-gradient(90deg, transparent 0px, transparent 3px, rgba(200,195,180,0.08) 3px, rgba(200,195,180,0.08) 4px)`,
            pointerEvents: 'none',
          }}
        />
        {/* Batik crackle lines — indigo dye seeping through wax cracks */}
        <svg
          style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}
          viewBox={`0 0 100 100`}
          preserveAspectRatio="none"
        >
          {crackLines.map((line, i) => (
            <line
              key={i}
              x1={`${line.x1}%`}
              y1={`${line.y1}%`}
              x2={`${line.x2}%`}
              y2={`${line.y2}%`}
              stroke="#1A237E"
              strokeWidth={0.2 + rand(i * 11) * 0.3}
              opacity={line.opacity}
              strokeLinecap="round"
            />
          ))}
        </svg>
        {/* Wax-resist sheen */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: 'radial-gradient(ellipse at 55% 35%, rgba(255,255,255,0.04) 0%, transparent 50%)',
            pointerEvents: 'none',
          }}
        />
        {/* Subtle indigo dye wash around edges */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            boxShadow: 'inset 0 0 80px rgba(26,35,126,0.12)',
            pointerEvents: 'none',
          }}
        />
      </div>
    )
  },

  renderWord: ({
    word,
    color,
    enterProgress,
    holdProgress,
    exitProgress,
    phase,
    index,
    width,
    height,
    frame,
  }: WordRenderProps) => {
    const chars = word.split('')
    const totalChars = chars.length
    const f = frame ?? 0

    return (
      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          display: 'flex',
          gap: 4,
          whiteSpace: 'nowrap',
        }}
      >
        {chars.map((ch, ci) => {
          const charDelay = (ci / (totalChars + 1)) * 0.6
          let revealProgress = 0
          let opacity = 1
          let crackIntensity = 0

          if (phase === 'enter') {
            const p = Math.max(0, Math.min(1, (enterProgress - charDelay) / (1 - charDelay * 0.5)))
            revealProgress = easeOutQuart(p)
            opacity = p > 0 ? Math.min(1, p * 2) : 0
            // Wax cracking precedes dye reveal
            crackIntensity = p < 0.6 ? p / 0.6 : 1
          } else if (phase === 'hold') {
            revealProgress = 1
            opacity = 1
            crackIntensity = 1
          } else {
            const p = Math.max(0, Math.min(1, (exitProgress - charDelay * 0.3) / (1 - charDelay * 0.2)))
            revealProgress = 1
            // Wax melting away
            opacity = 1 - easeOutQuart(p)
            crackIntensity = 1 - p
          }

          // Generate crackle lines per character
          const charCracks = Array.from({ length: 8 }, (_, k) => {
            const cx = (rand(ci * 29 + k * 13) - 0.5) * 60
            const cy = (rand(ci * 17 + k * 23) - 0.5) * 80
            const angle = rand(ci * 41 + k * 7) * 180
            const len = 8 + rand(ci * 53 + k * 3) * 20
            return { cx, cy, angle, len }
          })

          return (
            <div
              key={ci}
              style={{
                position: 'relative',
                display: 'inline-block',
              }}
            >
              {/* Wax resist area — white/cream showing through before dye */}
              {revealProgress < 0.8 && (
                <span
                  style={{
                    position: 'absolute',
                    inset: 0,
                    fontFamily: "'Georgia', serif",
                    fontSize: 'clamp(40px, 10vw, 130px)',
                    fontWeight: 700,
                    color: '#F5F0E8',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    opacity: (1 - revealProgress) * 0.6,
                    letterSpacing: 3,
                    lineHeight: 1,
                    pointerEvents: 'none',
                  }}
                >
                  {ch}
                </span>
              )}
              {/* Crackle lines on the character — wax breaking */}
              {crackIntensity > 0.1 && (
                <svg
                  style={{
                    position: 'absolute',
                    left: '50%',
                    top: '50%',
                    transform: 'translate(-50%, -50%)',
                    width: '120%',
                    height: '120%',
                    pointerEvents: 'none',
                    overflow: 'visible',
                  }}
                >
                  {charCracks.map((crack, k) => {
                    const crackP = Math.max(0, Math.min(1, (crackIntensity - k / 8) * 2))
                    if (crackP <= 0) return null
                    const x1 = 50 + crack.cx - (Math.cos(crack.angle * Math.PI / 180) * crack.len * crackP) / 2
                    const y1 = 50 + crack.cy - (Math.sin(crack.angle * Math.PI / 180) * crack.len * crackP) / 2
                    const x2 = 50 + crack.cx + (Math.cos(crack.angle * Math.PI / 180) * crack.len * crackP) / 2
                    const y2 = 50 + crack.cy + (Math.sin(crack.angle * Math.PI / 180) * crack.len * crackP) / 2
                    return (
                      <line
                        key={k}
                        x1={`${x1}%`}
                        y1={`${y1}%`}
                        x2={`${x2}%`}
                        y2={`${y2}%`}
                        stroke="#1A237E"
                        strokeWidth={0.8 + rand(k * 19) * 0.8}
                        opacity={crackP * 0.4}
                        strokeLinecap="round"
                      />
                    )
                  })}
                </svg>
              )}
              {/* Main character — indigo dye revealed through cracked wax */}
              <span
                style={{
                  fontFamily: "'Georgia', serif",
                  fontSize: 'clamp(40px, 10vw, 130px)',
                  fontWeight: 700,
                  color,
                  opacity: opacity * revealProgress,
                  display: 'inline-block',
                  letterSpacing: 3,
                  lineHeight: 1,
                  textShadow: revealProgress > 0.5
                    ? `0 0 3px ${color}66, 1px 1px 0 rgba(0,0,0,0.1)`
                    : 'none',
                  // Dye bleed — slight blur during absorption
                  filter: revealProgress < 0.7 ? `blur(${(1 - revealProgress) * 2}px)` : 'none',
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

function BatikCrackComponent(props: MotionGraphicProps<BatikCrackConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-batik-crack',
  title: 'Kinetic Batik Crack',
  description: 'Text revealed where wax cracked during dye bath with characteristic crackle lines, indigo on white cotton batik resist technique',
  tags: ['kinetic', 'typography', 'batik', 'wax-resist', 'indigo', 'crackle', 'textile', 'fabric', 'craft', 'indonesian'],
  category: 'captions',
  component: BatikCrackComponent as any,
  defaultConfig: {
    words: ['BATIK', 'CRACK', 'INDGO', 'RESIST'],
    colors: ['#1A237E', '#283593', '#1565C0', '#0D47A1'],
    bgColor: '#F5F0E8',
    cycleDuration: 1.4,
    crackDensity: 1,
  },
  configSchema: [
    { key: 'words', label: 'Words', type: 'text-array', defaultValue: ['BATIK', 'CRACK', 'INDGO', 'RESIST'], group: 'Content' },
    { key: 'colors', label: 'Dye Colors', type: 'text-array', defaultValue: ['#1A237E', '#283593', '#1565C0', '#0D47A1'], group: 'Style' },
    { key: 'bgColor', label: 'Cotton Color', type: 'color', defaultValue: '#F5F0E8', group: 'Style' },
    { key: 'cycleDuration', label: 'Cycle Duration (s)', type: 'number', defaultValue: 1.4, min: 0.3, max: 5, group: 'Timing' },
    { key: 'crackDensity', label: 'Crack Density', type: 'number', defaultValue: 1, min: 0.3, max: 3, group: 'Style' },
  ],
})
