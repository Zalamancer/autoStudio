import { registerMotionGraphic } from '../registry'
import { KineticBase, type KineticBaseConfig, type KineticAnimation, type WordRenderProps, type BackgroundRenderProps } from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface PatinaFormConfig extends KineticBaseConfig {
  patinaStyle: string
}

function easeOutExpo(t: number): number {
  return t === 1 ? 1 : 1 - Math.pow(2, -10 * t)
}

function easeInOutCubic(t: number): number {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2
}

/** Patina spreads across a character, oxidizing from base metal to green/rust */
function patinaOverlay(progress: number, t: number, ci: number): { color: string; opacity: number } {
  // progress 0 = fresh metal, 1 = full patina
  const noise = Math.sin(ci * 7.3 + t * 0.5) * 0.15
  const p = Math.min(1, Math.max(0, progress + noise))
  if (p < 0.2) return { color: '#B87333', opacity: p * 5 }       // copper
  if (p < 0.5) return { color: '#7FA88A', opacity: (p - 0.2) / 0.3 } // early verdigris
  if (p < 0.8) return { color: '#4A8C70', opacity: (p - 0.5) / 0.3 } // verdigris
  return { color: '#2E6E55', opacity: (p - 0.8) / 0.2 }             // deep patina
}

const animation: KineticAnimation = {
  renderBackground: ({ bgColor, width, height, frame, fps }: BackgroundRenderProps) => {
    const t = frame / fps
    return (
      <div style={{ position: 'absolute', inset: 0, background: bgColor }}>
        {/* Oxidization dust particles */}
        {Array.from({ length: 12 }, (_, i) => {
          const x = ((i * 0.13 + t * 0.03 * (i % 2 === 0 ? 1 : -1)) % 1) * width
          const y = ((i * 0.19 + t * 0.02) % 1) * height
          return (
            <div
              key={i}
              style={{
                position: 'absolute',
                left: x,
                top: y,
                width: 2 + (i % 3),
                height: 2 + (i % 3),
                borderRadius: '50%',
                background: i % 3 === 0 ? 'rgba(74,140,112,0.25)' : i % 3 === 1 ? 'rgba(127,168,138,0.2)' : 'rgba(184,115,51,0.15)',
                filter: 'blur(1px)',
              }}
            />
          )
        })}
      </div>
    )
  },

  renderWord: ({ word, color, enterProgress, holdProgress, exitProgress, phase, index, frame, width, height }: WordRenderProps) => {
    const f = frame ?? 0
    const t = f / 30

    const chars = word.split('').map((ch, ci) => {
      const charDelay = (ci / (word.length + 1)) * 0.5
      let opacity = 1
      let scaleX = 1
      let scaleY = 1
      let blur = 0
      let patinaProgress = 0
      let brightness = 1

      if (phase === 'enter') {
        // Letter emerges from tarnished darkness — patina dissolves to reveal base metal
        const p = Math.max(0, Math.min(1, (enterProgress - charDelay) / 0.7))
        const ep = easeOutExpo(p)
        opacity = ep
        scaleX = 0.85 + ep * 0.15
        scaleY = 0.85 + ep * 0.15
        blur = (1 - ep) * 4
        // Start fully patina'd, then clear to show metal beneath
        patinaProgress = Math.max(0, 1 - ep * 1.5)
        brightness = 0.7 + ep * 0.3

      } else if (phase === 'hold') {
        // Patina slowly spreads again over the hold phase — oxidation in real time
        const baseProgress = holdProgress * 0.5 + Math.sin(t * 0.8 + ci * 1.1) * 0.05
        patinaProgress = Math.max(0, Math.min(1, baseProgress))
        // Surface shimmer of aging metal
        brightness = 1 + Math.sin(t * 2.5 + ci * 0.8) * 0.06
        scaleX = 1 + Math.sin(t * 1.8 + ci * 0.5) * 0.006
        scaleY = 1 - Math.sin(t * 1.8 + ci * 0.5) * 0.004

      } else {
        // Patina crumbles — flakes off and fades
        const p = Math.max(0, Math.min(1, (exitProgress - charDelay * 0.3) / 0.8))
        const ep = easeInOutCubic(p)
        opacity = 1 - ep
        scaleX = 1 + ep * 0.3
        scaleY = 1 - ep * 0.4
        blur = ep * 5
        patinaProgress = 1
      }

      const overlay = patinaOverlay(patinaProgress, t, ci)

      return (
        <span
          key={ci}
          style={{
            display: 'inline-block',
            position: 'relative',
            opacity,
            transform: `scaleX(${scaleX}) scaleY(${scaleY})`,
            filter: [
              blur > 0 ? `blur(${blur}px)` : '',
              brightness !== 1 ? `brightness(${brightness})` : '',
            ].filter(Boolean).join(' ') || undefined,
          }}
        >
          {/* Base metal character */}
          <span
            style={{
              color,
              textShadow: `0 2px 6px rgba(0,0,0,0.5), 0 0 20px rgba(184,115,51,0.2)`,
            }}
          >
            {ch}
          </span>
          {/* Patina overlay mixed on top */}
          {overlay.opacity > 0.02 && (
            <span
              style={{
                position: 'absolute',
                inset: 0,
                color: overlay.color,
                opacity: overlay.opacity,
                mixBlendMode: 'multiply',
                textShadow: `0 0 8px rgba(74,140,112,0.4)`,
              }}
            >
              {ch}
            </span>
          )}
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
            fontFamily: "'Georgia', 'Times New Roman', serif",
            fontSize: 'clamp(44px, 12vw, 152px)',
            fontWeight: 700,
            whiteSpace: 'nowrap',
            letterSpacing: 6,
          }}
        >
          {chars}
        </div>
      </div>
    )
  },
}

function PatinaFormComponent(props: MotionGraphicProps<PatinaFormConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-patina-form',
  title: 'Kinetic Patina Form',
  description: 'Metal letters oxidize in real time: base copper slowly acquires verdigris patina spreading across letter surfaces. Each hold phase advances the oxidation further.',
  tags: ['kinetic', 'typography', 'metal', 'patina', 'oxidize', 'copper', 'verdigris', 'rust', 'aging', 'material-physics'],
  category: 'captions',
  component: PatinaFormComponent as any,
  defaultConfig: {
    words: ['AGED', 'COPPER', 'PATINA', 'TIME'],
    colors: ['#B87333', '#A06828', '#C07840', '#906030'],
    bgColor: '#0E1008',
    cycleDuration: 2.0,
    patinaStyle: 'verdigris',
  },
  configSchema: [
    { key: 'words', label: 'Words', type: 'text-array', defaultValue: ['AGED', 'COPPER', 'PATINA', 'TIME'], group: 'Content' },
    { key: 'colors', label: 'Colors', type: 'text-array', defaultValue: ['#B87333', '#A06828', '#C07840', '#906030'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#0E1008', group: 'Style' },
    { key: 'cycleDuration', label: 'Cycle Duration (s)', type: 'number', defaultValue: 2.0, min: 0.5, max: 5, group: 'Timing' },
    { key: 'patinaStyle', label: 'Patina Style', type: 'text', defaultValue: 'verdigris', group: 'Animation' },
  ],
})
