import { registerMotionGraphic } from '../registry'
import { KineticBase, type KineticBaseConfig, type KineticAnimation, type WordRenderProps, type BackgroundRenderProps } from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface MoltenPourConfig extends KineticBaseConfig {
  glowIntensity: number
}

function easeOutExpo(t: number): number {
  return t === 1 ? 1 : 1 - Math.pow(2, -10 * t)
}

function easeInQuart(t: number): number {
  return t * t * t * t
}

/** Dripping molten metal trail behind a character */
function moltenTrailColor(heat: number, base: string): string {
  // heat 0..1: 0 = cooled solid, 1 = white-hot
  if (heat > 0.85) return '#FFFFFF'
  if (heat > 0.7) return '#FFE680'
  if (heat > 0.5) return '#FF9900'
  if (heat > 0.3) return '#CC4400'
  return base
}

const animation: KineticAnimation = {
  renderBackground: ({ bgColor, width, height, frame, fps }: BackgroundRenderProps) => {
    const t = frame / fps
    // Furnace glow that pulses on the background
    const pulse = 0.5 + Math.sin(t * 1.8) * 0.15
    return (
      <div style={{ position: 'absolute', inset: 0, background: bgColor }}>
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: `radial-gradient(ellipse at 50% 80%, rgba(255, 80, 0, ${0.12 * pulse}), transparent 65%)`,
          }}
        />
        {/* Ambient heat shimmer lines */}
        {Array.from({ length: 5 }, (_, i) => (
          <div
            key={i}
            style={{
              position: 'absolute',
              left: `${15 + i * 17}%`,
              top: 0,
              width: 1,
              height: '100%',
              background: `linear-gradient(to bottom, transparent 40%, rgba(255,120,0,${0.04 + Math.sin(t * 2.3 + i) * 0.02}) 60%, transparent 90%)`,
              transform: `skewX(${Math.sin(t * 1.5 + i * 0.9) * 3}deg)`,
            }}
          />
        ))}
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
      let blur = 0
      let heat = 0
      let dropletY = 0
      let dropletOpacity = 0

      if (phase === 'enter') {
        // Molten metal poured from above: drips in hot, cools to solid color
        const p = Math.max(0, Math.min(1, (enterProgress - charDelay * 0.5) / 0.7))
        const ep = easeOutExpo(p)

        // Pour from top
        yOff = (1 - ep) * (-height * 0.6)
        // Stretch tall during pour (liquid elongation), then compress as it lands/cools
        scaleY = p < 0.5 ? 1.4 - p * 0.4 : 1 + (1 - ep) * 0.4
        scaleX = p < 0.6 ? 0.7 + p * 0.3 : 1
        opacity = p < 0.1 ? p * 10 : 1
        heat = Math.max(0, 1 - ep * 1.2)
        blur = (1 - ep) * 3

        // Drip tail trailing behind
        dropletY = -20 - (1 - ep) * 30
        dropletOpacity = heat * 0.7

      } else if (phase === 'hold') {
        // Cooling metal: slow thermal contraction ripple, surface shimmer
        const wobble = Math.sin(t * 3 + ci * 0.7) * 0.015
        scaleX = 1 + wobble
        scaleY = 1 - wobble * 0.5
        yOff = Math.sin(t * 2.1 + ci * 0.5) * 1.5
        heat = Math.max(0, 0.15 - holdProgress * 0.15) // slowly cool during hold
        opacity = 1

      } else {
        // Solidified metal shatters/crumbles outward
        const p = Math.max(0, Math.min(1, (exitProgress - charDelay * 0.3) / 0.8))
        const ep = easeInQuart(p)
        const dir = (ci % 2 === 0 ? 1 : -1)
        yOff = ep * 40 * dir
        scaleX = 1 + ep * 0.6
        scaleY = 1 - ep * 0.7
        opacity = 1 - ep
        blur = ep * 6
      }

      const charColor = moltenTrailColor(heat, color)
      const glowAmount = heat * 28
      const textShadow = heat > 0.05
        ? `0 0 ${glowAmount}px ${charColor}, 0 0 ${glowAmount * 2}px rgba(255, 80, 0, ${heat * 0.6})`
        : `0 2px 8px rgba(0,0,0,0.5)`

      return (
        <span
          key={ci}
          style={{
            display: 'inline-block',
            color: charColor,
            opacity,
            transform: `translate(${0}px, ${yOff}px) scaleX(${scaleX}) scaleY(${scaleY})`,
            filter: blur > 0 ? `blur(${blur}px)` : undefined,
            textShadow,
            position: 'relative',
          }}
        >
          {ch}
          {/* Drip droplet */}
          {dropletOpacity > 0 && (
            <span
              style={{
                position: 'absolute',
                top: dropletY,
                left: '50%',
                transform: 'translateX(-50%)',
                width: 4,
                height: 8 + heat * 12,
                borderRadius: '0 0 4px 4px',
                background: `radial-gradient(ellipse, #FFE680, #FF6600)`,
                opacity: dropletOpacity,
                filter: `blur(1px)`,
              }}
            />
          )}
        </span>
      )
    })

    return (
      <div style={{ position: 'absolute', inset: 0 }}>
        {/* Cooling glow pool beneath */}
        {phase === 'hold' && (
          <div
            style={{
              position: 'absolute',
              top: '62%',
              left: '50%',
              width: word.length * 44,
              height: 10,
              transform: 'translateX(-50%)',
              borderRadius: '50%',
              background: 'radial-gradient(ellipse, rgba(255,80,0,0.12), transparent 70%)',
              filter: 'blur(8px)',
            }}
          />
        )}
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            fontFamily: "'Impact', 'Arial Black', sans-serif",
            fontSize: 'clamp(48px, 13vw, 160px)',
            fontWeight: 900,
            whiteSpace: 'nowrap',
            letterSpacing: 3,
          }}
        >
          {chars}
        </div>
      </div>
    )
  },
}

function MoltenPourComponent(props: MotionGraphicProps<MoltenPourConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-molten-pour',
  title: 'Kinetic Molten Pour',
  description: 'Text poured as white-hot molten metal from above, cooling from incandescent white through orange to solid color. Letters elongate during pour and compress on landing.',
  tags: ['kinetic', 'typography', 'metal', 'molten', 'pour', 'heat', 'cool', 'industrial', 'material-physics'],
  category: 'captions',
  component: MoltenPourComponent as any,
  defaultConfig: {
    words: ['FORGE', 'CAST', 'POUR', 'COOL'],
    colors: ['#C8A87A', '#B8906A', '#D4A870', '#CC9060'],
    bgColor: '#0D0A06',
    cycleDuration: 1.8,
    glowIntensity: 1,
  },
  configSchema: [
    { key: 'words', label: 'Words', type: 'text-array', defaultValue: ['FORGE', 'CAST', 'POUR', 'COOL'], group: 'Content' },
    { key: 'colors', label: 'Colors', type: 'text-array', defaultValue: ['#C8A87A', '#B8906A', '#D4A870', '#CC9060'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#0D0A06', group: 'Style' },
    { key: 'cycleDuration', label: 'Cycle Duration (s)', type: 'number', defaultValue: 1.8, min: 0.5, max: 5, group: 'Timing' },
    { key: 'glowIntensity', label: 'Glow Intensity', type: 'number', defaultValue: 1, min: 0, max: 3, group: 'Animation' },
  ],
})
