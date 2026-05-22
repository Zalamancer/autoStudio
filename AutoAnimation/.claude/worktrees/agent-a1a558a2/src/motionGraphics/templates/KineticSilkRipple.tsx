import { registerMotionGraphic } from '../registry'
import { KineticBase, type KineticBaseConfig, type KineticAnimation, type WordRenderProps, type BackgroundRenderProps } from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface SilkRippleConfig extends KineticBaseConfig {
  sheen: number
}

function easeOutExpo(t: number): number {
  return t === 1 ? 1 : 1 - Math.pow(2, -10 * t)
}

function easeInOutQuad(t: number): number {
  return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2
}

/** Silk lustrous sheen: two specular highlights sweeping across */
function silkSheen(ci: number, wordLen: number, t: number): number {
  const norm = ci / Math.max(1, wordLen - 1)
  const sweep1 = Math.sin(t * 1.5 + norm * Math.PI * 2) * 0.5 + 0.5
  const sweep2 = Math.sin(t * 2.2 - norm * Math.PI * 1.5 + 1.2) * 0.5 + 0.5
  return Math.max(sweep1 * 0.4, sweep2 * 0.35)
}

const animation: KineticAnimation = {
  renderBackground: ({ bgColor, width, height, frame, fps }: BackgroundRenderProps) => {
    const t = frame / fps
    return (
      <div style={{ position: 'absolute', inset: 0, background: bgColor }}>
        {/* Silk sheen diagonal sweeps */}
        {Array.from({ length: 3 }, (_, i) => {
          const xOff = ((t * (40 + i * 15) + i * 300) % (width + 400)) - 200
          return (
            <div
              key={i}
              style={{
                position: 'absolute',
                left: xOff,
                top: 0,
                width: 80 + i * 30,
                height: '100%',
                background: `linear-gradient(to right, transparent, rgba(255,255,255,${0.03 + i * 0.015}), transparent)`,
                transform: 'skewX(-20deg)',
              }}
            />
          )
        })}
        {/* Deep lustrous tint */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: `radial-gradient(ellipse at 30% ${40 + Math.sin(t * 0.4) * 15}%, rgba(180,140,200,0.06), transparent 60%)`,
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
      let skewX = 0
      let blur = 0
      let brightness = 1

      if (phase === 'enter') {
        // Silk slides in from side with tension ripple
        const p = Math.max(0, Math.min(1, (enterProgress - charDelay * 0.5) / 0.7))
        const ep = easeOutExpo(p)

        xOff = (1 - ep) * -60
        // Ripple tension: slight delay creates wave along fabric
        const rippleDelay = ci / word.length * 0.3
        const rp = Math.max(0, Math.min(1, (enterProgress - rippleDelay) / 0.8))
        yOff = Math.sin(rp * Math.PI) * -12
        scaleX = 0.75 + ep * 0.25
        scaleY = 1.15 - ep * 0.15
        skewX = (1 - ep) * -10
        opacity = p < 0.1 ? p * 10 : 1
        blur = (1 - ep) * 1.5
        brightness = 0.8 + ep * 0.2

      } else if (phase === 'hold') {
        // Silk micro-ripple: tiny continuous wave from surface tension
        const ripple = Math.sin(t * 3 + ci * 0.5) * 0.5 + Math.sin(t * 5.1 + ci * 0.8) * 0.3
        yOff = ripple * 2
        scaleX = 1 + Math.sin(t * 2 + ci * 0.3) * 0.018
        scaleY = 1 - Math.sin(t * 2 + ci * 0.3) * 0.012
        // Lustrous sheen sweep
        brightness = 1 + silkSheen(ci, word.length, t) * 0.4
        skewX = Math.sin(t * 1.8 + ci * 0.6) * 0.6

      } else {
        // Silk pulls away like a reveal — whisks to the right
        const p = Math.max(0, Math.min(1, (exitProgress - charDelay * 0.15) / 0.8))
        const ep = easeInOutQuad(p)
        xOff = ep * 80 + ep * ci * 8
        yOff = Math.sin(ep * Math.PI) * -8
        scaleX = 1 - ep * 0.3
        scaleY = 1 + ep * 0.2
        skewX = ep * 12
        opacity = 1 - Math.max(0, (p - 0.6) / 0.4)
        blur = ep > 0.6 ? (ep - 0.6) / 0.4 * 4 : 0
      }

      // Silk sheen text color modulation
      const sheenBoost = phase === 'hold' ? silkSheen(ci, word.length, t) : 0
      const lightenedColor = sheenBoost > 0.3 ? `rgba(255,255,255,${sheenBoost * 0.7})` : undefined

      return (
        <span
          key={ci}
          style={{
            display: 'inline-block',
            position: 'relative',
            color,
            opacity,
            transform: `translate(${xOff}px, ${yOff}px) scaleX(${scaleX}) scaleY(${scaleY}) skewX(${skewX}deg)`,
            filter: [
              blur > 0 ? `blur(${blur}px)` : '',
              brightness !== 1 ? `brightness(${brightness})` : '',
            ].filter(Boolean).join(' ') || undefined,
            textShadow: `0 2px 8px rgba(0,0,0,0.3), 0 0 30px rgba(200,160,220,0.15)`,
          }}
        >
          {ch}
          {/* Sheen overlay */}
          {lightenedColor && (
            <span
              style={{
                position: 'absolute',
                inset: 0,
                color: lightenedColor,
                pointerEvents: 'none',
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
            fontFamily: "'Georgia', 'Palatino', serif",
            fontSize: 'clamp(44px, 12vw, 150px)',
            fontWeight: 700,
            whiteSpace: 'nowrap',
            letterSpacing: 7,
            fontStyle: 'italic',
          }}
        >
          {chars}
        </div>
      </div>
    )
  },
}

function SilkRippleComponent(props: MotionGraphicProps<SilkRippleConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-silk-ripple',
  title: 'Kinetic Silk Ripple',
  description: 'Text rendered as lustrous silk fabric: ripple tension waves travel along letters, specular sheen sweeps across surfaces. Slides in like silk being pulled taut, whisks away like a reveal cloth.',
  tags: ['kinetic', 'typography', 'fabric', 'silk', 'ripple', 'sheen', 'luxury', 'textile', 'material-physics'],
  category: 'captions',
  component: SilkRippleComponent as any,
  defaultConfig: {
    words: ['SILK', 'SHEEN', 'LUXE', 'FLOW'],
    colors: ['#D4A8C8', '#C090B8', '#E0B8D4', '#B880A8'],
    bgColor: '#100A12',
    cycleDuration: 1.8,
    sheen: 1,
  },
  configSchema: [
    { key: 'words', label: 'Words', type: 'text-array', defaultValue: ['SILK', 'SHEEN', 'LUXE', 'FLOW'], group: 'Content' },
    { key: 'colors', label: 'Colors', type: 'text-array', defaultValue: ['#D4A8C8', '#C090B8', '#E0B8D4', '#B880A8'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#100A12', group: 'Style' },
    { key: 'cycleDuration', label: 'Cycle Duration (s)', type: 'number', defaultValue: 1.8, min: 0.5, max: 5, group: 'Timing' },
    { key: 'sheen', label: 'Sheen Intensity', type: 'number', defaultValue: 1, min: 0.3, max: 3, group: 'Animation' },
  ],
})
