import { registerMotionGraphic } from '../registry'
import { KineticBase, type KineticBaseConfig, type KineticAnimation, type WordRenderProps, type BackgroundRenderProps } from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface BungeeJumpConfig extends KineticBaseConfig {
  dropHeight: number
}

function easeOutExpo(t: number): number { return t === 1 ? 1 : 1 - Math.pow(2, -10 * t) }

// Damped spring oscillation — simulates bungee cord tension
function bungeeSpring(t: number, bounces: number): number {
  if (t <= 0) return 0
  if (t >= 1) return 0
  const decay = Math.exp(-5 * t)
  return decay * Math.cos(t * Math.PI * bounces * 2)
}

function easeInQuad(t: number): number { return t * t }

const animation: KineticAnimation = {
  renderBackground: ({ bgColor, width, height, frame, fps }: BackgroundRenderProps) => {
    const time = frame / fps
    return (
      <div style={{ position: 'absolute', inset: 0, background: bgColor }}>
        {/* Subtle vertical guide lines like a bungee tower */}
        {[-1, 0, 1].map(offset => (
          <div key={offset} style={{
            position: 'absolute',
            left: `calc(50% + ${offset * 60}px)`,
            top: 0,
            bottom: 0,
            width: 1,
            background: `rgba(255,255,255,${0.03 + Math.abs(offset) * 0.01})`,
          }} />
        ))}
        {/* Cord anchor point at top */}
        <div style={{
          position: 'absolute',
          top: 0,
          left: '50%',
          transform: 'translateX(-50%)',
          width: 8,
          height: 8,
          borderRadius: '50%',
          background: 'rgba(255,255,255,0.15)',
        }} />
      </div>
    )
  },

  renderWord: ({ word, color, enterProgress, holdProgress, exitProgress, phase, index, width, height }: WordRenderProps) => {
    const chars = word.split('')

    // Stagger: characters drop one after another from top
    return (
      <div style={{
        position: 'absolute',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        display: 'flex',
        alignItems: 'center',
        whiteSpace: 'nowrap',
      }}>
        {chars.map((ch, ci) => {
          const stagger = ci * 0.04
          let translateY = 0
          let scaleX = 1
          let scaleY = 1
          let opacity = 1
          let rotation = 0

          if (phase === 'enter') {
            const p = Math.max(0, Math.min(1, (enterProgress - stagger) / (1 - stagger)))
            // Drop phase: fall from above
            const dropPhase = Math.min(1, p * 2) // first half = drop
            const bouncePhase = Math.max(0, p * 2 - 1) // second half = bounce

            if (p < 0.5) {
              // Accelerating drop — easeInQuad
              const drop = easeInQuad(dropPhase)
              translateY = -height * 0.6 * (1 - drop)
              scaleY = 1 - drop * 0.3  // compress slightly during freefall
              scaleX = 1 + drop * 0.1
              opacity = Math.min(1, p * 5)
            } else {
              // Bungee bounce — springs back up then oscillates
              const bounce = bungeeSpring(bouncePhase, 2.5)
              translateY = bounce * height * 0.25
              scaleY = 1 + Math.abs(bounce) * 0.3
              scaleX = 1 - Math.abs(bounce) * 0.15
              opacity = 1
            }
          } else if (phase === 'hold') {
            // Still hanging — very gentle sway residue
            const sway = Math.sin(holdProgress * Math.PI * 2 + ci * 0.4) * (1 - holdProgress * 0.7) * 4
            translateY = sway
            scaleY = 1 + Math.abs(sway) * 0.005
            rotation = sway * 0.3
          } else {
            // Exit: cord snaps, text yanked upward and fades
            const ep = easeOutExpo(exitProgress)
            translateY = -height * 0.5 * ep
            scaleY = 1 - ep * 0.5
            scaleX = 1 + ep * 0.3
            opacity = 1 - ep
          }

          return (
            <span key={ci} style={{
              display: 'inline-block',
              fontFamily: "'Arial Black', 'Impact', sans-serif",
              fontSize: 'clamp(44px, 11vw, 150px)',
              fontWeight: 900,
              color,
              transform: `translateY(${translateY}px) scaleX(${scaleX}) scaleY(${scaleY}) rotate(${rotation}deg)`,
              transformOrigin: 'center bottom',
              opacity,
              whiteSpace: 'pre',
              textShadow: `0 6px 20px rgba(0,0,0,0.5), 0 2px 4px rgba(0,0,0,0.3)`,
              lineHeight: 1,
            }}>
              {ch}
            </span>
          )
        })}
      </div>
    )
  },
}

function BungeeJumpComponent(props: MotionGraphicProps<BungeeJumpConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-bungee-jump',
  title: 'Kinetic Bungee Jump',
  description: 'Characters freefall from above on elastic cords, overshooting their resting position and oscillating with damped spring bounces before going still',
  tags: ['kinetic', 'typography', 'elastic', 'bungee', 'spring', 'drop', 'physics', 'bounce'],
  category: 'captions',
  component: BungeeJumpComponent as any,
  defaultConfig: {
    words: ['DROP', 'FALL', 'BOUNCE', 'SNAP'],
    colors: ['#FF6B35', '#F7C59F', '#EFEFD0', '#00B4D8'],
    bgColor: '#0D1B2A',
    cycleDuration: 1.4,
    dropHeight: 60,
  },
  configSchema: [
    { key: 'words', label: 'Words', type: 'text-array', defaultValue: ['DROP', 'FALL', 'BOUNCE', 'SNAP'], group: 'Content' },
    { key: 'colors', label: 'Colors', type: 'text-array', defaultValue: ['#FF6B35', '#F7C59F', '#EFEFD0', '#00B4D8'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#0D1B2A', group: 'Style' },
    { key: 'cycleDuration', label: 'Cycle Duration (s)', type: 'number', defaultValue: 1.4, min: 0.5, max: 5, group: 'Timing' },
    { key: 'dropHeight', label: 'Drop Height (%)', type: 'number', defaultValue: 60, min: 20, max: 100, group: 'Animation' },
  ],
})
