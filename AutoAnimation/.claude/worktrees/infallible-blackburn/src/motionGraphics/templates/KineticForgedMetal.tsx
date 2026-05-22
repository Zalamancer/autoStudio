import { registerMotionGraphic } from '../registry'
import { KineticBase, type KineticBaseConfig, type KineticAnimation, type WordRenderProps, type BackgroundRenderProps } from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface ForgedMetalConfig extends KineticBaseConfig {
  hammerForce: number
}

function easeOutBack(t: number): number {
  const c1 = 1.70158
  const c3 = c1 + 1
  return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2)
}

function easeOutExpo(t: number): number {
  return t === 1 ? 1 : 1 - Math.pow(2, -10 * t)
}

const animation: KineticAnimation = {
  renderBackground: ({ bgColor, width, height, frame, fps }: BackgroundRenderProps) => {
    const t = frame / fps
    // Sparks flying on hammer impact
    const sparkCount = 8
    return (
      <div style={{ position: 'absolute', inset: 0, background: bgColor }}>
        {/* Anvil glow on floor */}
        <div
          style={{
            position: 'absolute',
            bottom: 0,
            left: '50%',
            transform: 'translateX(-50%)',
            width: '60%',
            height: 60,
            background: 'radial-gradient(ellipse, rgba(255,160,0,0.08), transparent 70%)',
            filter: 'blur(12px)',
          }}
        />
        {Array.from({ length: sparkCount }, (_, i) => {
          const angle = (i / sparkCount) * Math.PI + Math.PI * 0.3
          const dist = 30 + (i % 3) * 25
          const sparkT = ((t * 2.5 + i * 0.15) % 1)
          const sx = Math.cos(angle) * dist * sparkT
          const sy = Math.sin(angle) * dist * sparkT - sparkT * sparkT * 40
          return (
            <div
              key={i}
              style={{
                position: 'absolute',
                left: `calc(50% + ${sx}px)`,
                top: `calc(55% + ${sy}px)`,
                width: 2 + (i % 2),
                height: 2 + (i % 2),
                borderRadius: '50%',
                background: sparkT < 0.3 ? '#FFFFFF' : sparkT < 0.6 ? '#FFCC00' : '#FF6600',
                opacity: Math.max(0, 1 - sparkT * 1.4),
                boxShadow: `0 0 4px 1px rgba(255,180,0,0.5)`,
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
      const charDelay = ci / (word.length + 1)
      let opacity = 1
      let scaleX = 1
      let scaleY = 1
      let yOff = 0
      let xOff = 0
      let skewX = 0
      let blur = 0
      let brightness = 1

      if (phase === 'enter') {
        // Hammer blow: letter slams down from above, squashes on impact, springs to final form
        const rawP = Math.max(0, Math.min(1, (enterProgress - charDelay * 0.4) / 0.7))
        const p = easeOutExpo(rawP)

        // Phase 1: slam (0..0.6) — slam down from top
        if (rawP < 0.6) {
          const impactP = rawP / 0.6
          yOff = (1 - easeOutExpo(impactP)) * -height * 0.5
          scaleX = 0.8 + impactP * 0.4
          scaleY = 1.5 - impactP * 0.8
          brightness = 1.5 + (1 - impactP) * 1.5 // white-hot on impact
          blur = (1 - impactP) * 2
        } else {
          // Phase 2: spring back with easeOutBack
          const springP = easeOutBack((rawP - 0.6) / 0.4)
          scaleX = 1 + springP * 0.08
          scaleY = 1 - springP * 0.04
          brightness = 1 + (1 - springP) * 0.3
        }
        opacity = rawP < 0.05 ? rawP * 20 : 1

      } else if (phase === 'hold') {
        // Metal resonance: subtle ring/vibration in the metal
        const freq = 6 + ci * 0.4
        const decay = Math.exp(-holdProgress * 4)
        scaleX = 1 + Math.sin(t * freq) * 0.02 * decay
        scaleY = 1 - Math.sin(t * freq) * 0.015 * decay
        skewX = Math.sin(t * (freq * 0.7) + ci) * 0.5 * decay
        // Forge-lit sheen sweep
        brightness = 1 + Math.sin(t * 2.3 + ci * 0.6) * 0.08

      } else {
        // Metal cracks then flies apart
        const p = Math.max(0, Math.min(1, (exitProgress - charDelay * 0.2) / 0.9))
        const ep = easeOutExpo(p)
        const sign = ci % 2 === 0 ? 1 : -1
        xOff = sign * ep * 60
        yOff = ep * 30
        scaleX = 1 + ep * 0.5
        scaleY = 1 - ep * 0.6
        opacity = 1 - ep
        blur = ep * 5
      }

      return (
        <span
          key={ci}
          style={{
            display: 'inline-block',
            color,
            opacity,
            transform: `translate(${xOff}px, ${yOff}px) scaleX(${scaleX}) scaleY(${scaleY}) skewX(${skewX}deg)`,
            filter: [
              blur > 0 ? `blur(${blur}px)` : '',
              brightness !== 1 ? `brightness(${brightness})` : '',
            ].filter(Boolean).join(' ') || undefined,
            textShadow: `0 0 12px rgba(255,140,0,0.3), 0 3px 8px rgba(0,0,0,0.6)`,
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
            fontFamily: "'Impact', 'Arial Black', sans-serif",
            fontSize: 'clamp(48px, 13vw, 158px)',
            fontWeight: 900,
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

function ForgedMetalComponent(props: MotionGraphicProps<ForgedMetalConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-forged-metal',
  title: 'Kinetic Forged Metal',
  description: 'Text hammered into shape on an anvil: letters slam down white-hot, squash flat on impact, then spring back with metal resonance vibration. Sparks fly from the background.',
  tags: ['kinetic', 'typography', 'metal', 'forge', 'hammer', 'anvil', 'impact', 'industrial', 'material-physics'],
  category: 'captions',
  component: ForgedMetalComponent as any,
  defaultConfig: {
    words: ['FORGE', 'STEEL', 'IRON', 'HAMMER'],
    colors: ['#A8B4C0', '#909CB0', '#B4B4B4', '#8090A4'],
    bgColor: '#0A0808',
    cycleDuration: 1.6,
    hammerForce: 1,
  },
  configSchema: [
    { key: 'words', label: 'Words', type: 'text-array', defaultValue: ['FORGE', 'STEEL', 'IRON', 'HAMMER'], group: 'Content' },
    { key: 'colors', label: 'Colors', type: 'text-array', defaultValue: ['#A8B4C0', '#909CB0', '#B4B4B4', '#8090A4'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#0A0808', group: 'Style' },
    { key: 'cycleDuration', label: 'Cycle Duration (s)', type: 'number', defaultValue: 1.6, min: 0.5, max: 5, group: 'Timing' },
    { key: 'hammerForce', label: 'Hammer Force', type: 'number', defaultValue: 1, min: 0.5, max: 3, group: 'Animation' },
  ],
})
