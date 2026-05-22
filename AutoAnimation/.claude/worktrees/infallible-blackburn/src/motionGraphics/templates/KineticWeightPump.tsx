import { registerMotionGraphic } from '../registry'
import { KineticBase, type KineticBaseConfig, type KineticAnimation, type WordRenderProps, type BackgroundRenderProps } from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface WeightPumpConfig extends KineticBaseConfig {
  pulseRate: number
}

function easeOutExpo(t: number): number { return t === 1 ? 1 : 1 - Math.pow(2, -10 * t) }
function easeOutBack(t: number): number {
  const c = 1.70158
  return 1 + (c + 1) * Math.pow(t - 1, 3) + c * Math.pow(t - 1, 2)
}
function easeInOutCubic(t: number): number {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2
}

const animation: KineticAnimation = {
  renderBackground: ({ bgColor, frame, fps }: BackgroundRenderProps) => {
    const time = frame / fps
    return (
      <div style={{ position: 'absolute', inset: 0, background: bgColor }}>
        {/* Weight scale reference marks */}
        {Array.from({ length: 5 }, (_, i) => (
          <div key={i} style={{
            position: 'absolute',
            left: `${15 + i * 17}%`,
            top: '82%',
            width: 1,
            height: 8,
            background: `rgba(255,255,255,${0.06 + (i === 2 ? 0.06 : 0)})`,
          }} />
        ))}
      </div>
    )
  },

  renderWord: ({ word, color, enterProgress, holdProgress, exitProgress, phase, index, width }: WordRenderProps) => {
    const chars = word.split('')

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
          const charFraction = chars.length > 1 ? ci / (chars.length - 1) : 0.5
          let fontWeight = 400
          let scaleX = 1
          let scaleY = 1
          let opacity = 1
          let letterSpacing = 0

          if (phase === 'enter') {
            // Entry: start from ULTRA thin (100 weight), pump to ULTRA bold (900+), then settle to 900
            // Simulate weight change via scaleX (thin) to scaleX normal (bold)
            const ep = easeOutBack(enterProgress)

            // Thin → fat: scaleX from 0.3 (ultra light) to 1 (bold)
            // Also animate actual conceptual weight for the appearance
            scaleX = 0.25 + ep * 0.75  // starts thin, pops to full
            scaleY = 1 + (1 - ep) * 0.2  // taller when thin, normal when fat

            // Stagger per character: each pumps in sequence
            const stagger = charFraction * 0.15
            const staggeredEp = easeOutBack(Math.max(0, Math.min(1, (enterProgress - stagger) / (1 - stagger))))
            scaleX = Math.max(0.1, 0.25 + staggeredEp * 0.75)
            scaleY = 1 + (1 - staggeredEp) * 0.2

            opacity = Math.min(1, enterProgress * 6)
            letterSpacing = (1 - staggeredEp) * -2
          } else if (phase === 'hold') {
            // Heartbeat-style weight pulse: bold → thin → bold → ...
            const pulseT = easeInOutCubic(Math.abs(Math.sin(holdProgress * Math.PI * 3)))
            scaleX = 1 - pulseT * 0.25  // 1.0 → 0.75 → 1.0
            scaleY = 1 + pulseT * 0.12  // compensates for weight change
            letterSpacing = pulseT * -1
          } else {
            // Exit: pump to thin and fade
            const ep = easeInOutCubic(exitProgress)
            scaleX = 1 - ep * 0.8
            scaleY = 1 + ep * 0.3
            opacity = 1 - ep
          }

          return (
            <span key={ci} style={{
              display: 'inline-block',
              fontFamily: "'Arial Black', 'Helvetica Neue', 'Arial', sans-serif",
              fontSize: 'clamp(44px, 11vw, 150px)',
              fontWeight: 900,
              color,
              transform: `scaleX(${scaleX}) scaleY(${scaleY})`,
              transformOrigin: 'center center',
              opacity,
              whiteSpace: 'pre',
              letterSpacing: `${letterSpacing}px`,
              textShadow: `0 2px 8px rgba(0,0,0,0.3)`,
              lineHeight: 1,
              transition: 'none',
            }}>
              {ch}
            </span>
          )
        })}
      </div>
    )
  },
}

function WeightPumpComponent(props: MotionGraphicProps<WeightPumpConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-weight-pump',
  title: 'Kinetic Weight Pump',
  description: 'Text pumps through font weight extremes — enters as ultra-thin hairlines that pump to heavy bold with each character staggered, then heartbeat-pulses between weights during hold',
  tags: ['kinetic', 'typography', 'weight', 'bold', 'thin', 'morph', 'transform', 'pump', 'pulse', 'font'],
  category: 'captions',
  component: WeightPumpComponent as any,
  defaultConfig: {
    words: ['BOLD', 'PUMP', 'HEAVY', 'THIN'],
    colors: ['#FF4757', '#ECCC68', '#1E90FF', '#2ED573'],
    bgColor: '#2F3542',
    cycleDuration: 1.3,
    pulseRate: 3,
  },
  configSchema: [
    { key: 'words', label: 'Words', type: 'text-array', defaultValue: ['BOLD', 'PUMP', 'HEAVY', 'THIN'], group: 'Content' },
    { key: 'colors', label: 'Colors', type: 'text-array', defaultValue: ['#FF4757', '#ECCC68', '#1E90FF', '#2ED573'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#2F3542', group: 'Style' },
    { key: 'cycleDuration', label: 'Cycle Duration (s)', type: 'number', defaultValue: 1.3, min: 0.3, max: 5, group: 'Timing' },
    { key: 'pulseRate', label: 'Pulse Rate', type: 'number', defaultValue: 3, min: 1, max: 8, group: 'Animation' },
  ],
})
