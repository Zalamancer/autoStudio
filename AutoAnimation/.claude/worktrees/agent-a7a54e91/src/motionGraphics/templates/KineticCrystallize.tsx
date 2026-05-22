import { registerMotionGraphic } from '../registry'
import { KineticBase, type KineticBaseConfig, type KineticAnimation, type WordRenderProps, type BackgroundRenderProps } from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface CrystallizeConfig extends KineticBaseConfig {
  crystallinity: number
}

function easeOutExpo(t: number): number {
  return t === 1 ? 1 : 1 - Math.pow(2, -10 * t)
}

function easeInQuart(t: number): number {
  return t * t * t * t
}

/** Crystal facet highlight: simulates light refracting off flat crystal faces */
function crystalFacet(ci: number, t: number, phase: string, progress: number): string {
  if (phase !== 'hold' && progress < 0.5) return `0 2px 8px rgba(0,0,0,0.4)`
  const facet1 = Math.sin(t * 2 + ci * 1.1) * 0.5 + 0.5
  const facet2 = Math.cos(t * 2.7 - ci * 0.8) * 0.5 + 0.5
  const highlight = Math.max(facet1, facet2)
  const hColor = highlight > 0.7
    ? `rgba(255,255,255,0.7)`
    : highlight > 0.4
    ? `rgba(200,230,255,0.4)`
    : `rgba(150,200,240,0.2)`
  return [
    `0 0 ${12 + highlight * 20}px ${hColor}`,
    `0 2px 6px rgba(0,0,60,0.4)`,
    `1px 1px 0 rgba(220,240,255,${highlight * 0.4})`,
    `-1px -1px 0 rgba(80,120,200,${(1 - highlight) * 0.3})`,
  ].join(', ')
}

const animation: KineticAnimation = {
  renderBackground: ({ bgColor, width, height, frame, fps }: BackgroundRenderProps) => {
    const t = frame / fps
    const cx = (width || 1080) / 2
    const cy = (height || 1920) / 2

    // Crystal lattice in background
    const latticeSpacing = 60
    const cols = Math.ceil((width || 1080) / latticeSpacing) + 1
    const rows = Math.ceil((height || 1920) / latticeSpacing) + 1

    return (
      <div style={{ position: 'absolute', inset: 0, background: bgColor }}>
        <svg
          style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', opacity: 0.05 }}
          viewBox={`0 0 ${width || 1080} ${height || 1920}`}
          preserveAspectRatio="none"
        >
          {/* Orthorhombic lattice dots */}
          {Array.from({ length: cols }, (_, ci) =>
            Array.from({ length: rows }, (_, ri) => {
              const x = ci * latticeSpacing
              const y = ri * latticeSpacing
              const dist = Math.hypot(x - cx, y - cy)
              const pulse = Math.sin(t * 1.5 - dist * 0.008) * 0.5 + 0.5
              return (
                <circle
                  key={`${ci}-${ri}`}
                  cx={x}
                  cy={y}
                  r={1 + pulse * 0.8}
                  fill="rgba(180,220,255,1)"
                  opacity={0.3 + pulse * 0.4}
                />
              )
            })
          )}
          {/* Lattice bonds — horizontal */}
          {Array.from({ length: rows }, (_, ri) => (
            <line
              key={`h${ri}`}
              x1={0}
              y1={ri * latticeSpacing}
              x2={width || 1080}
              y2={ri * latticeSpacing}
              stroke="rgba(140,180,240,1)"
              strokeWidth="0.3"
              opacity="0.4"
            />
          ))}
          {/* Lattice bonds — vertical */}
          {Array.from({ length: cols }, (_, ci) => (
            <line
              key={`v${ci}`}
              x1={ci * latticeSpacing}
              y1={0}
              x2={ci * latticeSpacing}
              y2={height || 1920}
              stroke="rgba(140,180,240,1)"
              strokeWidth="0.3"
              opacity="0.4"
            />
          ))}
        </svg>
        {/* Ambient refraction glow */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: `radial-gradient(ellipse at ${50 + Math.sin(t * 0.5) * 15}% ${50 + Math.cos(t * 0.4) * 15}%, rgba(100,160,220,0.06), transparent 55%)`,
          }}
        />
      </div>
    )
  },

  renderWord: ({ word, color, enterProgress, holdProgress, exitProgress, phase, index, frame, width, height }: WordRenderProps) => {
    const f = frame ?? 0
    const t = f / 30

    const chars = word.split('').map((ch, ci) => {
      const charDelay = ci / (word.length + 1)
      let opacity = 1
      let xOff = 0
      let yOff = 0
      let scaleX = 1
      let scaleY = 1
      let blur = 0
      let brightness = 1
      let crystallizeProgress = 0

      if (phase === 'enter') {
        // Crystallization from solution: nucleation then rapid crystal growth
        const p = Math.max(0, Math.min(1, (enterProgress - charDelay * 0.45) / 0.7))
        const ep = easeOutExpo(p)

        // Pre-nucleation: letter is diffuse/blurry (in solution)
        if (p < 0.3) {
          const pre = p / 0.3
          blur = (1 - pre) * 8
          scaleX = 1.4 - pre * 0.4
          scaleY = 0.8 + pre * 0.2
          opacity = pre * 0.4
          crystallizeProgress = 0
        } else {
          // Nucleation + rapid growth: letter sharpens dramatically
          const growP = (p - 0.3) / 0.7
          const growEp = easeOutExpo(growP)
          crystallizeProgress = growEp
          blur = (1 - growEp) * 2
          scaleX = 0.6 + growEp * 0.4 + Math.sin(growEp * Math.PI) * 0.08
          scaleY = 0.6 + growEp * 0.4
          brightness = 1.5 - growEp * 0.5
          opacity = 0.4 + growEp * 0.6
        }

      } else if (phase === 'hold') {
        // Crystal in solution: slow rotation of facet orientations
        crystallizeProgress = 1
        scaleX = 1 + Math.sin(t * 1.5 + ci * 0.5) * 0.008
        scaleY = 1 + Math.cos(t * 1.8 + ci * 0.4) * 0.006
        xOff = Math.sin(t * 0.8 + ci * 0.3) * 1
        yOff = Math.cos(t * 0.7 + ci * 0.5) * 1
        // Crystal clarity: very sharp
        brightness = 1 + Math.abs(Math.sin(t * 3 + ci * 1.2)) * 0.1

      } else {
        // Crystal dissolves back into solution
        const p = Math.max(0, Math.min(1, (exitProgress - charDelay * 0.2) / 0.9))
        const ep = easeInQuart(p)

        blur = ep * 8
        scaleX = 1 + ep * 0.4
        scaleY = 1 - ep * 0.5
        opacity = 1 - ep
        brightness = 1 + ep * 0.4
        crystallizeProgress = 1 - ep
      }

      return (
        <span
          key={ci}
          style={{
            display: 'inline-block',
            color,
            opacity,
            transform: `translate(${xOff}px, ${yOff}px) scaleX(${scaleX}) scaleY(${scaleY})`,
            filter: [
              blur > 0 ? `blur(${blur}px)` : '',
              brightness !== 1 ? `brightness(${brightness})` : '',
            ].filter(Boolean).join(' ') || undefined,
            textShadow: crystalFacet(ci, t, phase, crystallizeProgress),
          }}
        >
          {ch}
        </span>
      )
    })

    return (
      <div style={{ position: 'absolute', inset: 0 }}>
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            fontFamily: "'Arial', sans-serif",
            fontSize: 'clamp(44px, 12vw, 150px)',
            fontWeight: 800,
            whiteSpace: 'nowrap',
            letterSpacing: 4,
          }}
        >
          {chars}
        </div>
      </div>
    )
  },
}

function CrystallizeComponent(props: MotionGraphicProps<CrystallizeConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-crystallize',
  title: 'Kinetic Crystallize',
  description: 'Letters crystallize from solution: diffuse pre-nucleation blur sharpens suddenly as crystal growth radiates outward. Faceted light refraction highlights sweep during hold. Crystal lattice grid fills background.',
  tags: ['kinetic', 'typography', 'crystal', 'crystallize', 'nucleate', 'solution', 'phase-change', 'state', 'material-physics'],
  category: 'captions',
  component: CrystallizeComponent as any,
  defaultConfig: {
    words: ['FORM', 'PURE', 'CRYSTAL', 'CLEAR'],
    colors: ['#B8D8F8', '#A0C4E8', '#D0E8FF', '#88B8E0'],
    bgColor: '#040610',
    cycleDuration: 2.0,
    crystallinity: 1,
  },
  configSchema: [
    { key: 'words', label: 'Words', type: 'text-array', defaultValue: ['FORM', 'PURE', 'CRYSTAL', 'CLEAR'], group: 'Content' },
    { key: 'colors', label: 'Colors', type: 'text-array', defaultValue: ['#B8D8F8', '#A0C4E8', '#D0E8FF', '#88B8E0'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#040610', group: 'Style' },
    { key: 'cycleDuration', label: 'Cycle Duration (s)', type: 'number', defaultValue: 2.0, min: 0.5, max: 5, group: 'Timing' },
    { key: 'crystallinity', label: 'Crystallinity', type: 'number', defaultValue: 1, min: 0.3, max: 3, group: 'Animation' },
  ],
})
