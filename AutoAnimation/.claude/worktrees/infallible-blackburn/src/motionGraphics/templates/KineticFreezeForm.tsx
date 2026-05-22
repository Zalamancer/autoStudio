import { registerMotionGraphic } from '../registry'
import { KineticBase, type KineticBaseConfig, type KineticAnimation, type WordRenderProps, type BackgroundRenderProps } from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface FreezeFormConfig extends KineticBaseConfig {
  freezeSpeed: number
}

function easeOutExpo(t: number): number {
  return t === 1 ? 1 : 1 - Math.pow(2, -10 * t)
}

function easeInQuart(t: number): number {
  return t * t * t * t
}

const animation: KineticAnimation = {
  renderBackground: ({ bgColor, width, height, frame, fps }: BackgroundRenderProps) => {
    const t = frame / fps
    return (
      <div style={{ position: 'absolute', inset: 0, background: bgColor }}>
        {/* Ice crystal formation in background */}
        {Array.from({ length: 12 }, (_, i) => {
          const cx = ((i * 0.09 + 0.04) * width)
          const cy = ((i * 0.08 + 0.02) * height) + Math.sin(t * 0.3 + i) * 5
          const len = 15 + (i % 4) * 8
          return (
            <svg
              key={i}
              style={{ position: 'absolute', left: cx - len, top: cy - len, opacity: 0.06 + (i % 3) * 0.02 }}
              width={len * 2}
              height={len * 2}
              viewBox={`${-len} ${-len} ${len * 2} ${len * 2}`}
            >
              {/* 6-fold ice crystal */}
              {Array.from({ length: 6 }, (_, a) => {
                const angle = (a / 6) * Math.PI * 2
                return (
                  <line
                    key={a}
                    x1={0}
                    y1={0}
                    x2={(Math.cos(angle) * len).toFixed(1)}
                    y2={(Math.sin(angle) * len).toFixed(1)}
                    stroke="#A8D8FF"
                    strokeWidth="0.8"
                  />
                )
              })}
            </svg>
          )
        })}
        {/* Cold blue ambient glow */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: `radial-gradient(ellipse at 50% 30%, rgba(100,160,220,0.05), transparent 60%)`,
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
      let freezeProgress = 0
      let brightness = 1

      if (phase === 'enter') {
        // Liquid state: letters are fluid/wavy, then FREEZE into solid crystal
        const p = Math.max(0, Math.min(1, (enterProgress - charDelay * 0.4) / 0.7))
        const ep = easeOutExpo(p)

        // Early phase: liquid wobble
        if (p < 0.5) {
          const liquid = 1 - p / 0.5
          yOff = Math.sin(t * 8 + ci * 1.2) * 8 * liquid
          xOff = Math.cos(t * 6 + ci * 0.8) * 4 * liquid
          scaleX = 1 + Math.sin(t * 5 + ci) * 0.08 * liquid
          scaleY = 1 - Math.sin(t * 5 + ci) * 0.06 * liquid
          blur = liquid * 2
          brightness = 1.3 - p * 0.4
          freezeProgress = 0
        } else {
          // Freezing: snap into rigid crystal shape
          const freezeP = (p - 0.5) / 0.5
          freezeProgress = easeOutExpo(freezeP)
          brightness = 1.3 - freezeP * 0.3 + freezeProgress * 0.1
          // Slight expansion as water freezes (density decreases)
          scaleX = 1 + Math.sin(freezeP * Math.PI) * 0.08
          scaleY = 1 + Math.sin(freezeP * Math.PI) * 0.05
        }
        opacity = p < 0.05 ? p / 0.05 : 1

      } else if (phase === 'hold') {
        // Frozen solid: crystal lattice vibration (thermal phonons)
        freezeProgress = 1
        const phonon = Math.sin(t * 12 + ci * 0.9) * 0.5 + 0.5
        xOff = Math.sin(t * 8 + ci * 1.1) * 0.4 * (1 - holdProgress * 0.5)
        yOff = Math.cos(t * 9 + ci * 0.7) * 0.4 * (1 - holdProgress * 0.5)
        // Cold shimmer
        brightness = 1 + phonon * 0.08
        scaleX = 1 + Math.sin(t * 3 + ci * 0.4) * 0.006
        scaleY = 1 + Math.sin(t * 3 + ci * 0.6) * 0.004

      } else {
        // Thaw: crystal melts back to liquid then evaporates
        const p = Math.max(0, Math.min(1, (exitProgress - charDelay * 0.2) / 0.9))
        const ep = easeInQuart(p)

        if (ep < 0.5) {
          // Melt: wobble returns
          const melt = ep / 0.5
          yOff = Math.sin(t * 8 + ci * 1.2) * 6 * melt
          blur = melt * 2
        } else {
          // Evaporate
          const evap = (ep - 0.5) / 0.5
          yOff = -evap * 30
          blur = evap * 8
        }
        opacity = 1 - ep
        scaleX = 1 + ep * 0.2
        scaleY = 1 - ep * 0.5
        brightness = 1 + ep * 0.5
      }

      // Frozen blue tint
      const frozenFilter = freezeProgress > 0
        ? `hue-rotate(${freezeProgress * -15}deg) saturate(${1 + freezeProgress * 0.3})`
        : ''

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
              frozenFilter,
            ].filter(Boolean).join(' ') || undefined,
            textShadow: freezeProgress > 0.5
              ? `0 0 20px rgba(140,200,255,0.5), 0 2px 8px rgba(0,0,80,0.4), 1px 1px 0 rgba(180,220,255,0.3)`
              : `0 2px 8px rgba(0,0,0,0.5)`,
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

function FreezeFormComponent(props: MotionGraphicProps<FreezeFormConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-freeze-form',
  title: 'Kinetic Freeze Form',
  description: 'Liquid text freezes into solid crystal: letters start fluid and wobbling, then snap rigid as ice crystals nucleate. Hold shows thermal phonon micro-vibration. Exit thaws and evaporates. Ice crystal background.',
  tags: ['kinetic', 'typography', 'freeze', 'ice', 'liquid', 'crystal', 'phase-change', 'state', 'material-physics'],
  category: 'captions',
  component: FreezeFormComponent as any,
  defaultConfig: {
    words: ['FREEZE', 'SOLID', 'CRYSTAL', 'COLD'],
    colors: ['#A8D0F0', '#90B8E0', '#C0E0FF', '#80A8D0'],
    bgColor: '#040810',
    cycleDuration: 1.8,
    freezeSpeed: 1,
  },
  configSchema: [
    { key: 'words', label: 'Words', type: 'text-array', defaultValue: ['FREEZE', 'SOLID', 'CRYSTAL', 'COLD'], group: 'Content' },
    { key: 'colors', label: 'Colors', type: 'text-array', defaultValue: ['#A8D0F0', '#90B8E0', '#C0E0FF', '#80A8D0'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#040810', group: 'Style' },
    { key: 'cycleDuration', label: 'Cycle Duration (s)', type: 'number', defaultValue: 1.8, min: 0.5, max: 5, group: 'Timing' },
    { key: 'freezeSpeed', label: 'Freeze Speed', type: 'number', defaultValue: 1, min: 0.3, max: 3, group: 'Animation' },
  ],
})
