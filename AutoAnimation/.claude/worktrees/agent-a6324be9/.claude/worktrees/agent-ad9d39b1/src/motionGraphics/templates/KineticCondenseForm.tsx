import { registerMotionGraphic } from '../registry'
import { KineticBase, type KineticBaseConfig, type KineticAnimation, type WordRenderProps, type BackgroundRenderProps } from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface CondenseFormConfig extends KineticBaseConfig {
  condensationRate: number
}

function easeOutBack(t: number): number {
  const c1 = 1.70158
  const c3 = c1 + 1
  return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2)
}

function easeInCubic(t: number): number {
  return t * t * t
}

const animation: KineticAnimation = {
  renderBackground: ({ bgColor, width, height, frame, fps }: BackgroundRenderProps) => {
    const t = frame / fps
    return (
      <div style={{ position: 'absolute', inset: 0, background: bgColor }}>
        {/* Floating gas/vapor particles converging */}
        {Array.from({ length: 20 }, (_, i) => {
          const seed = i * 7.3
          const baseX = ((Math.sin(seed) * 0.5 + 0.5) * width)
          const baseY = ((Math.cos(seed * 1.3) * 0.5 + 0.5) * height)
          const drift = Math.sin(t * 0.4 + seed) * 20
          const driftY = Math.cos(t * 0.35 + seed * 0.7) * 15
          const size = 3 + (i % 4) * 2
          return (
            <div
              key={i}
              style={{
                position: 'absolute',
                left: baseX + drift - size / 2,
                top: baseY + driftY - size / 2,
                width: size,
                height: size,
                borderRadius: '50%',
                background: 'rgba(180,220,255,1)',
                opacity: 0.03 + (i % 3) * 0.02,
                filter: 'blur(2px)',
              }}
            />
          )
        })}
        {/* Cold surface gradient at bottom */}
        <div
          style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            height: '20%',
            background: 'linear-gradient(to top, rgba(100,140,200,0.06), transparent)',
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
      let condensed = 0

      if (phase === 'enter') {
        // Gas-to-liquid condensation: particles swarm in and condense into letterform
        const p = Math.max(0, Math.min(1, (enterProgress - charDelay * 0.4) / 0.7))
        const ep = easeOutBack(Math.min(1, p))

        // Characters arrive from all directions as condensing gas
        const scatterSeed = ci * 5.7 + index * 3.1
        const angle = scatterSeed % (Math.PI * 2)
        const dist = (1 - easeInCubic(Math.max(0, Math.min(1, p * 1.5)))) * 80
        xOff = Math.cos(angle) * dist
        yOff = Math.sin(angle) * dist

        // Scale up from droplet
        const rawScale = ep
        scaleX = Math.max(0, rawScale + Math.sin(p * Math.PI * 2 + ci) * (1 - p) * 0.1)
        scaleY = Math.max(0, rawScale + Math.cos(p * Math.PI * 2 + ci) * (1 - p) * 0.08)

        blur = (1 - Math.min(1, p * 2)) * 6
        opacity = p < 0.08 ? p / 0.08 : Math.min(1, ep * 1.1)
        condensed = ep
        brightness = 1.3 - ep * 0.3

      } else if (phase === 'hold') {
        // Liquid condensate: droplet sliding and merging motion
        condensed = 1
        const drip = Math.sin(t * 2 + ci * 0.5) * 0.5 + 0.5
        yOff = drip * 2
        xOff = Math.cos(t * 1.7 + ci * 0.4) * 1
        // Surface tension pulse
        scaleX = 1 + Math.sin(t * 3 + ci * 0.6) * 0.015
        scaleY = 1 - Math.sin(t * 3 + ci * 0.6) * 0.01
        // Wetness shimmer
        brightness = 1 + Math.abs(Math.sin(t * 4 + ci * 0.8)) * 0.08

      } else {
        // Re-evaporation: condensate re-enters gas phase
        const p = Math.max(0, Math.min(1, (exitProgress - charDelay * 0.2) / 0.9))
        const ep = easeInCubic(p)

        // Scatter outward as if re-vaporizing
        const scatterSeed2 = (ci * 5.7 + index * 3.1 + Math.PI)
        const angle2 = scatterSeed2 % (Math.PI * 2)
        xOff = Math.cos(angle2) * ep * 60
        yOff = Math.sin(angle2) * ep * 50

        scaleX = 1 + ep * 0.6
        scaleY = 1 + ep * 0.4
        opacity = 1 - ep
        blur = ep * 8
        brightness = 1 + ep * 0.5
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
            textShadow: condensed > 0.5
              ? `0 0 16px rgba(120,180,255,0.4), 0 2px 4px rgba(0,0,40,0.5), 0 0 40px rgba(100,160,240,0.15)`
              : `0 2px 8px rgba(0,0,0,0.4)`,
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

function CondenseFormComponent(props: MotionGraphicProps<CondenseFormConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-condense-form',
  title: 'Kinetic Condense Form',
  description: 'Gas-to-liquid condensation: scattered vapor particles swarm in and condense into letterforms. Hold shows liquid surface tension and drip motion. Exit re-vaporizes the condensate back into the air.',
  tags: ['kinetic', 'typography', 'condense', 'vapor', 'gas', 'liquid', 'phase-change', 'state', 'material-physics'],
  category: 'captions',
  component: CondenseFormComponent as any,
  defaultConfig: {
    words: ['FORM', 'DROP', 'COLLECT', 'GATHER'],
    colors: ['#80B8E8', '#6898D0', '#98C8F8', '#5888C0'],
    bgColor: '#060810',
    cycleDuration: 2.0,
    condensationRate: 1,
  },
  configSchema: [
    { key: 'words', label: 'Words', type: 'text-array', defaultValue: ['FORM', 'DROP', 'COLLECT', 'GATHER'], group: 'Content' },
    { key: 'colors', label: 'Colors', type: 'text-array', defaultValue: ['#80B8E8', '#6898D0', '#98C8F8', '#5888C0'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#060810', group: 'Style' },
    { key: 'cycleDuration', label: 'Cycle Duration (s)', type: 'number', defaultValue: 2.0, min: 0.5, max: 5, group: 'Timing' },
    { key: 'condensationRate', label: 'Condensation Rate', type: 'number', defaultValue: 1, min: 0.3, max: 3, group: 'Animation' },
  ],
})
