import { registerMotionGraphic } from '../registry'
import { KineticBase, type KineticBaseConfig, type KineticAnimation, type WordRenderProps, type BackgroundRenderProps } from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface VortexSuckConfig extends KineticBaseConfig {
  swirlTurns: number
}

function easeOutExpo(t: number): number { return t === 1 ? 1 : 1 - Math.pow(2, -10 * t) }
function easeOutBack(t: number): number {
  const c = 1.70158
  return 1 + (c + 1) * Math.pow(t - 1, 3) + c * Math.pow(t - 1, 2)
}
function easeInCubic(t: number): number { return t * t * t }

const animation: KineticAnimation = {
  renderBackground: ({ bgColor, frame, fps }: BackgroundRenderProps) => {
    const time = frame / fps
    return (
      <div style={{ position: 'absolute', inset: 0, background: bgColor }}>
        {/* Vortex spiral arms */}
        {[0, 60, 120, 180, 240, 300].map((baseAngle, i) => {
          const angle = baseAngle + time * 40
          const len = 35 + i * 3
          return (
            <div key={i} style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              width: `${len}%`,
              height: 1,
              transformOrigin: '0 0',
              transform: `rotate(${angle}deg)`,
              background: `linear-gradient(90deg, rgba(255,255,255,0.05) 0%, transparent 100%)`,
            }} />
          )
        })}
        {/* Center vortex eye */}
        <div style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          width: 12,
          height: 12,
          borderRadius: '50%',
          background: 'rgba(255,255,255,0.12)',
          transform: 'translate(-50%, -50%)',
        }} />
      </div>
    )
  },

  renderWord: ({ word, color, enterProgress, holdProgress, exitProgress, phase, index, width, height }: WordRenderProps) => {
    const chars = word.split('')
    const totalChars = chars.length

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
          // Distance from center of word — further chars have more angular travel
          const charPos = totalChars > 1 ? (ci - (totalChars - 1) / 2) / ((totalChars - 1) / 2) : 0
          const radius = Math.abs(charPos) * (width * 0.35)
          const swirlAngle = charPos * 180  // degrees of rotation relative to center

          let translateX = 0
          let translateY = 0
          let rotation = 0
          let scale = 1
          let opacity = 1

          if (phase === 'enter') {
            // Characters spiral inward from their radius, rotating
            const ep = easeOutBack(enterProgress)
            const inwardProgress = 1 - ep

            // Angular position: starts at swirlAngle offset, spirals to 0
            const currentAngle = (swirlAngle + 360 * (1 - enterProgress)) * inwardProgress
            const currentRadius = radius * (1 - easeOutExpo(enterProgress))

            translateX = Math.cos((currentAngle * Math.PI) / 180) * currentRadius
            translateY = Math.sin((currentAngle * Math.PI) / 180) * currentRadius * 0.4  // compressed vertically = perspective
            rotation = currentAngle
            scale = easeOutBack(enterProgress)
            opacity = Math.min(1, enterProgress * 3)
          } else if (phase === 'hold') {
            // Gentle residual spin — very slow, barely perceptible
            const residualSpin = Math.sin(holdProgress * Math.PI * 2) * (1 - holdProgress * 0.9) * 2
            rotation = residualSpin
            scale = 1 + Math.abs(residualSpin) * 0.003
          } else {
            // Sucked back into vortex center — spirals inward, shrinks
            const ep = easeInCubic(exitProgress)
            const outAngle = swirlAngle * ep
            const outRadius = radius * ep
            translateX = Math.cos((outAngle * Math.PI) / 180) * outRadius * 0.5
            translateY = Math.sin((outAngle * Math.PI) / 180) * outRadius * 0.2
            rotation = -outAngle
            scale = 1 - ep
            opacity = 1 - ep
          }

          return (
            <span key={ci} style={{
              display: 'inline-block',
              fontFamily: "'Arial Black', 'Impact', sans-serif",
              fontSize: 'clamp(44px, 11vw, 150px)',
              fontWeight: 900,
              color,
              transform: `translate(${translateX}px, ${translateY}px) rotate(${rotation}deg) scale(${scale})`,
              transformOrigin: 'center center',
              opacity,
              whiteSpace: 'pre',
              textShadow: `0 0 ${(1 - scale) * 20 + 4}px ${color}88`,
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

function VortexSuckComponent(props: MotionGraphicProps<VortexSuckConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-vortex-suck',
  title: 'Kinetic Vortex Suck',
  description: 'Letters spiral inward from a radial vortex pattern, rotating and converging to their resting positions from angular trajectories — exits by being sucked back into the center drain',
  tags: ['kinetic', 'typography', 'vortex', 'spiral', 'warp', 'distort', 'swirl', 'spin', 'suck'],
  category: 'captions',
  component: VortexSuckComponent as any,
  defaultConfig: {
    words: ['SWIRL', 'VORTEX', 'SPIN', 'PULL'],
    colors: ['#9B5DE5', '#F15BB5', '#FEE440', '#00BBF9'],
    bgColor: '#080010',
    cycleDuration: 1.5,
    swirlTurns: 1,
  },
  configSchema: [
    { key: 'words', label: 'Words', type: 'text-array', defaultValue: ['SWIRL', 'VORTEX', 'SPIN', 'PULL'], group: 'Content' },
    { key: 'colors', label: 'Colors', type: 'text-array', defaultValue: ['#9B5DE5', '#F15BB5', '#FEE440', '#00BBF9'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#080010', group: 'Style' },
    { key: 'cycleDuration', label: 'Cycle Duration (s)', type: 'number', defaultValue: 1.5, min: 0.5, max: 5, group: 'Timing' },
    { key: 'swirlTurns', label: 'Swirl Turns', type: 'number', defaultValue: 1, min: 0.5, max: 3, group: 'Animation' },
  ],
})
