import { registerMotionGraphic } from '../registry'
import {
  KineticBase,
  type KineticBaseConfig,
  type KineticAnimation,
  type WordRenderProps,
  type BackgroundRenderProps,
} from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface SpringOscillateConfig extends KineticBaseConfig {
  stiffness: number
  damping: number
}

/** Damped spring simulation: overshoots and oscillates toward rest */
function dampedSpring(t: number, stiffness: number, damping: number): number {
  if (t <= 0) return 0
  if (t >= 1) return 1
  // Underdamped spring: position = 1 - e^(-damping*t) * cos(omega*t)
  const omega = Math.sqrt(Math.max(0, stiffness - damping * damping))
  const envelope = Math.exp(-damping * t * 6)
  return 1 - envelope * Math.cos(omega * t * Math.PI * 1.5)
}

const animation: KineticAnimation = {
  renderBackground: ({ bgColor }: BackgroundRenderProps) => (
    <div style={{ position: 'absolute', inset: 0, background: bgColor }}>
      <div
        style={{
          position: 'absolute',
          inset: 0,
          backgroundImage: `
            linear-gradient(90deg, rgba(255,255,255,0.015) 1px, transparent 1px),
            linear-gradient(0deg, rgba(255,255,255,0.015) 1px, transparent 1px)
          `,
          backgroundSize: '60px 60px',
          pointerEvents: 'none',
        }}
      />
    </div>
  ),

  renderWord: ({ word, color, enterProgress, holdProgress, exitProgress, phase, width }: WordRenderProps) => {
    const chars = word.split('')
    const totalChars = chars.length

    return (
      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          display: 'flex',
          whiteSpace: 'nowrap',
        }}
      >
        {chars.map((ch, ci) => {
          let translateX = 0
          let translateY = 0
          let scaleX = 1
          let scaleY = 1
          let opacity = 0
          let rotation = 0

          // Stagger each character
          const charDelay = (ci / totalChars) * 0.4

          if (phase === 'enter') {
            const p = Math.max(0, Math.min(1, (enterProgress - charDelay) / (1 - charDelay)))
            // Spring from left with overshoot
            const spring = dampedSpring(p, 1.8, 0.35)
            const startX = -width * 0.6
            translateX = startX * (1 - spring)
            // Vertical spring bounce (perpendicular oscillation)
            const vertOscillate = Math.exp(-3 * p) * Math.sin(p * Math.PI * 5) * 40
            translateY = vertOscillate * (1 - charDelay)
            opacity = Math.min(1, p * 4)
            scaleX = 0.6 + spring * 0.4
            scaleY = 1.4 - spring * 0.4
            rotation = (1 - spring) * -15
          } else if (phase === 'hold') {
            opacity = 1
            // Residual oscillation that decays to zero
            const residual = Math.exp(-holdProgress * 5)
            translateY = Math.sin(holdProgress * Math.PI * 6 + ci * 0.7) * residual * 8
            translateX = Math.cos(holdProgress * Math.PI * 4 + ci * 0.5) * residual * 4
            scaleX = 1 + Math.sin(holdProgress * Math.PI * 5) * residual * 0.04
            scaleY = 1 - Math.sin(holdProgress * Math.PI * 5) * residual * 0.04
          } else {
            // Exit: spring pulls back and launches right
            const p = Math.max(0, Math.min(1, exitProgress))
            const pullBack = Math.min(exitProgress * 5, 1) // quick pullback
            const launch = Math.max(0, (exitProgress - 0.2) / 0.8)
            translateX = -20 * pullBack + width * 0.7 * (launch * launch)
            scaleX = 1 - pullBack * 0.2 + launch * 0.5
            scaleY = 1 + pullBack * 0.15 - launch * 0.3
            opacity = 1 - launch
          }

          return (
            <div
              key={ci}
              style={{
                display: 'inline-block',
                fontFamily: "'Arial Black', 'Impact', sans-serif",
                fontSize: 'clamp(48px, 12vw, 160px)',
                fontWeight: 900,
                color,
                opacity,
                transform: `translateX(${translateX}px) translateY(${translateY}px) scaleX(${scaleX}) scaleY(${scaleY}) rotate(${rotation}deg)`,
                transformOrigin: 'center center',
                textShadow: '3px 3px 0 rgba(0,0,0,0.35)',
                lineHeight: 1,
              }}
            >
              {ch}
            </div>
          )
        })}
      </div>
    )
  },
}

function SpringOscillateComponent(props: MotionGraphicProps<SpringOscillateConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-spring-oscillate',
  title: 'Kinetic Spring Oscillate',
  description: 'Each letter arrives on a damped spring — overshooting its target and oscillating with decreasing amplitude until it settles',
  tags: ['kinetic', 'typography', 'spring', 'oscillate', 'physics', 'elastic', 'damped', 'overshoot'],
  category: 'captions',
  component: SpringOscillateComponent as any,
  defaultConfig: {
    words: ['SPRING', 'BOUNCE', 'WOBBLE', 'WAVE'],
    colors: ['#A78BFA', '#34D399', '#F472B6', '#60A5FA'],
    bgColor: '#0F172A',
    cycleDuration: 1.5,
    stiffness: 1.8,
    damping: 0.35,
  },
  configSchema: [
    { key: 'words', label: 'Words', type: 'text-array', defaultValue: ['SPRING', 'BOUNCE', 'WOBBLE', 'WAVE'], group: 'Content' },
    { key: 'colors', label: 'Colors', type: 'text-array', defaultValue: ['#A78BFA', '#34D399', '#F472B6', '#60A5FA'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#0F172A', group: 'Style' },
    { key: 'cycleDuration', label: 'Cycle Duration (s)', type: 'number', defaultValue: 1.5, min: 0.5, max: 5, group: 'Timing' },
    { key: 'stiffness', label: 'Stiffness', type: 'number', defaultValue: 1.8, min: 0.5, max: 4, group: 'Animation' },
    { key: 'damping', label: 'Damping', type: 'number', defaultValue: 0.35, min: 0.1, max: 1, group: 'Animation' },
  ],
})
