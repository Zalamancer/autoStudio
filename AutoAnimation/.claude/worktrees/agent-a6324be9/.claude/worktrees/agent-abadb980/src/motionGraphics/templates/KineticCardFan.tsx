import { registerMotionGraphic } from '../registry'
import { KineticBase, type KineticBaseConfig, type KineticAnimation, type WordRenderProps, type BackgroundRenderProps } from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

// -- Card Fan -----------------------------------------------------------------
// Characters fan out like a hand of playing cards. Each letter is a "card" that
// rotates in via rotateY from a stacked position, fanning to its final angle.
// Hold: cards breathe in/out slightly. Exit: cards fold back together and flip away.

interface CardFanConfig extends KineticBaseConfig {
  fanAngle: number
}

function easeOutBack(t: number): number {
  const c1 = 1.70158
  const c3 = c1 + 1
  return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2)
}

function easeOutExpo(t: number): number {
  return t === 1 ? 1 : 1 - Math.pow(2, -10 * t)
}

function easeInCubic(t: number): number {
  return t * t * t
}

const animation: KineticAnimation = {
  renderBackground: ({ bgColor, frame, fps }: BackgroundRenderProps) => {
    const time = frame / fps
    // Felt table with subtle light sweep
    return (
      <div style={{ position: 'absolute', inset: 0, background: bgColor, overflow: 'hidden' }}>
        {/* Diagonal light band */}
        <div style={{
          position: 'absolute', inset: 0,
          background: `linear-gradient(${135 + Math.sin(time * 0.5) * 8}deg, transparent 30%, rgba(255,220,140,0.03) 50%, transparent 70%)`,
          mixBlendMode: 'screen',
        }} />
        {/* Card table texture dots */}
        {Array.from({ length: 5 }, (_, i) => (
          <div key={i} style={{
            position: 'absolute',
            width: 4, height: 4, borderRadius: '50%',
            background: `rgba(255,255,255,${0.015 + Math.sin(time * 0.3 + i * 2) * 0.005})`,
            left: `${15 + i * 18}%`,
            top: `${70 + Math.sin(i * 1.5) * 10}%`,
          }} />
        ))}
      </div>
    )
  },

  renderWord: ({ word, color, enterProgress, holdProgress, exitProgress, phase, width, height }: WordRenderProps) => {
    const chars = word.split('')
    const totalChars = chars.length
    const fanAngle = 50 // total fan spread in degrees
    const halfFan = fanAngle / 2

    const charElements = chars.map((ch, ci) => {
      const normalizedIdx = totalChars > 1 ? ci / (totalChars - 1) : 0.5
      const targetAngle = -halfFan + normalizedIdx * fanAngle // fan spread angle
      const stagger = ci * 0.1

      // Per-character staggered enter
      const charEnter = Math.max(0, Math.min(1, (enterProgress - stagger) / Math.max(0.01, 1 - stagger * 0.8)))
      const charExit = Math.max(0, Math.min(1, (exitProgress - (totalChars - 1 - ci) * 0.08) / Math.max(0.01, 1 - (totalChars - 1) * 0.06)))

      let rotateY = -90 // start face-sideways (hidden)
      let rotateZ = 0
      let translateZ = 0
      let opacity = 0
      let scale = 0.6

      if (phase === 'enter') {
        const e = easeOutBack(charEnter)
        rotateY = -90 + e * 90 // flip from side to front
        rotateZ = e * targetAngle // fan out
        translateZ = e * (ci * 3) // slight depth stagger
        opacity = charEnter > 0.05 ? 1 : 0
        scale = 0.6 + e * 0.4
      } else if (phase === 'hold') {
        rotateY = 0
        rotateZ = targetAngle + Math.sin(holdProgress * Math.PI * 3 + ci * 0.7) * 2
        translateZ = ci * 3
        opacity = 1
        scale = 1 + Math.sin(holdProgress * Math.PI * 4 + ci * 1.2) * 0.02
      } else {
        const e = easeInCubic(charExit)
        rotateY = e * 90 // flip away forward
        rotateZ = targetAngle * (1 - e) // fold back to stack
        translateZ = ci * 3 * (1 - e)
        opacity = 1 - e * 0.7
        scale = 1 - e * 0.3
      }

      return (
        <div key={ci} style={{
          position: 'absolute',
          transformOrigin: '50% 100%',
          transform: `rotateZ(${rotateZ}deg) rotateY(${rotateY}deg) translateZ(${translateZ}px) scale(${scale})`,
          backfaceVisibility: 'hidden',
          opacity,
          zIndex: totalChars - ci,
        }}>
          <div style={{
            fontFamily: "'Georgia', 'Palatino', serif",
            fontSize: 'clamp(40px, 12vw, 160px)',
            fontWeight: 900,
            color,
            textShadow: `2px 4px 12px rgba(0,0,0,0.5)`,
            background: 'rgba(255,255,255,0.04)',
            borderRadius: 6,
            padding: '4px 12px',
            border: `1px solid ${color}20`,
            overflow: 'hidden',
          }}>
            {ch}
          </div>
        </div>
      )
    })

    return (
      <div style={{ position: 'absolute', inset: 0, overflow: 'hidden' }}>
        <div style={{
          position: 'absolute', top: '55%', left: '50%',
          transform: 'translate(-50%, -50%)',
          perspective: '700px',
          perspectiveOrigin: '50% 80%',
        }}>
          <div style={{
            transformStyle: 'preserve-3d',
            position: 'relative',
            display: 'flex',
            alignItems: 'flex-end',
            justifyContent: 'center',
          }}>
            {charElements}
          </div>
        </div>
      </div>
    )
  },
}

function CardFanComponent(props: MotionGraphicProps<CardFanConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-card-fan',
  title: 'Kinetic Card Fan',
  description: 'Characters fan out like a hand of playing cards via rotateY and rotateZ, with staggered reveal. Cards breathe on hold and fold back into a stack on exit.',
  tags: ['kinetic', 'typography', '3d', 'card', 'fan', 'rotation', 'perspective', 'stagger', 'playing-cards'],
  category: 'captions',
  component: CardFanComponent as any,
  defaultConfig: {
    words: ['ROYAL', 'FLUSH', 'DEALT', 'ACES'],
    colors: ['#FFD700', '#FFFFFF', '#FF4444', '#44FF88'],
    bgColor: '#0c1a0c',
    cycleDuration: 1.2,
    fanAngle: 50,
  },
  configSchema: [
    { key: 'words', label: 'Words', type: 'text-array', defaultValue: ['ROYAL', 'FLUSH', 'DEALT', 'ACES'], group: 'Content' },
    { key: 'colors', label: 'Colors', type: 'text-array', defaultValue: ['#FFD700', '#FFFFFF', '#FF4444', '#44FF88'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#0c1a0c', group: 'Style' },
    { key: 'cycleDuration', label: 'Cycle Duration (s)', type: 'number', defaultValue: 1.2, min: 0.5, max: 5, group: 'Timing' },
    { key: 'fanAngle', label: 'Fan Angle', type: 'number', defaultValue: 50, min: 20, max: 120, group: 'Animation' },
  ],
})
