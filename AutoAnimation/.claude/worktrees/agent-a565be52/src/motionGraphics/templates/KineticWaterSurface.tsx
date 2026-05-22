import { registerMotionGraphic } from '../registry'
import { KineticBase, type KineticBaseConfig, type KineticAnimation, type WordRenderProps, type BackgroundRenderProps } from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface WaterSurfaceConfig extends KineticBaseConfig {
  rippleSpeed: number
}

function easeOutExpo(t: number): number { return t === 1 ? 1 : 1 - Math.pow(2, -10 * t) }
function easeOutCubic(t: number): number { return 1 - Math.pow(1 - t, 3) }

// Ripple displacement: concentric rings from center propagating outward
function rippleDisplace(position: number, time: number, speed: number): number {
  const r = Math.abs(position)       // distance from center
  const waveFront = time * speed     // wave front position
  const waveAmp = Math.exp(-r * 2) * Math.exp(-time * 3)  // amplitude decays with distance & time
  return Math.sin((waveFront - r) * 8) * waveAmp * 20
}

const animation: KineticAnimation = {
  renderBackground: ({ bgColor, frame, fps }: BackgroundRenderProps) => {
    const time = frame / fps
    return (
      <div style={{ position: 'absolute', inset: 0, background: bgColor }}>
        {/* Expanding ripple rings */}
        {[0, 0.15, 0.3, 0.45].map((delay, i) => {
          const t = Math.max(0, (time * 0.5) % 1 - delay)
          const radius = t * 80
          const opacity = (1 - t) * 0.08
          return (
            <div key={i} style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              width: `${radius}%`,
              height: `${radius * 0.3}%`,
              borderRadius: '50%',
              border: `1px solid rgba(100,180,255,${opacity})`,
              transform: 'translate(-50%, -50%)',
              pointerEvents: 'none',
            }} />
          )
        })}
      </div>
    )
  },

  renderWord: ({ word, color, enterProgress, holdProgress, exitProgress, phase, index, width }: WordRenderProps) => {
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
          // Character position relative to center of word (-1 to 1)
          const normalizedPos = totalChars > 1 ? (ci - (totalChars - 1) / 2) / ((totalChars - 1) / 2) : 0
          let translateY = 0
          let scaleX = 1
          let scaleY = 1
          let opacity = 1

          if (phase === 'enter') {
            // Stone drop: impact at center, ripple propagates outward
            // Characters closer to center get hit first, outer chars lag
            const distanceDelay = Math.abs(normalizedPos) * 0.25
            const p = Math.max(0, Math.min(1, (enterProgress - distanceDelay) / (1 - distanceDelay)))

            // Impact: sharp downward push at initial wave front
            const impactT = Math.max(0, Math.min(1, enterProgress * 3))
            const impactPush = Math.sin(impactT * Math.PI) * 15 * Math.exp(-Math.abs(normalizedPos) * 3)

            // Ripple displacement propagating outward
            const ripple = rippleDisplace(normalizedPos, enterProgress, 2)

            translateY = impactPush + ripple * (1 - enterProgress)
            scaleX = 1 + Math.abs(ripple) * 0.003
            scaleY = 1 - Math.abs(ripple) * 0.005

            opacity = Math.min(1, p * 3)
          } else if (phase === 'hold') {
            // Gentle surface tension sway — residual ripple dampening
            const freq = 3 + Math.abs(normalizedPos) * 2
            const sway = Math.sin(holdProgress * Math.PI * freq + normalizedPos * 2) * (1 - holdProgress * 0.7) * 4
            translateY = sway
            scaleX = 1 + Math.abs(sway) * 0.002
          } else {
            // Surface drains away — characters sink below surface
            const ep = easeOutCubic(exitProgress)
            translateY = ep * 40
            scaleY = 1 - ep * 0.3
            opacity = 1 - ep
          }

          return (
            <span key={ci} style={{
              display: 'inline-block',
              fontFamily: "'Helvetica Neue', 'Arial', sans-serif",
              fontSize: 'clamp(44px, 11vw, 150px)',
              fontWeight: 800,
              color,
              transform: `translateY(${translateY}px) scaleX(${scaleX}) scaleY(${scaleY})`,
              transformOrigin: 'center center',
              opacity,
              whiteSpace: 'pre',
              textShadow: `0 ${Math.abs(translateY * 0.3)}px ${Math.abs(translateY) + 8}px ${color}44`,
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

function WaterSurfaceComponent(props: MotionGraphicProps<WaterSurfaceConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-water-surface',
  title: 'Kinetic Water Surface',
  description: 'Text appears with a stone-drop impact at center — ripple waves propagate outward through each letter, displacing characters vertically in a realistic circular wave pattern',
  tags: ['kinetic', 'typography', 'water', 'ripple', 'surface', 'wave', 'fluid', 'physics', 'impact'],
  category: 'captions',
  component: WaterSurfaceComponent as any,
  defaultConfig: {
    words: ['RIPPLE', 'WAVE', 'DROP', 'FLOW'],
    colors: ['#90E0EF', '#00B4D8', '#0077B6', '#CAF0F8'],
    bgColor: '#03045E',
    cycleDuration: 1.5,
    rippleSpeed: 2,
  },
  configSchema: [
    { key: 'words', label: 'Words', type: 'text-array', defaultValue: ['RIPPLE', 'WAVE', 'DROP', 'FLOW'], group: 'Content' },
    { key: 'colors', label: 'Colors', type: 'text-array', defaultValue: ['#90E0EF', '#00B4D8', '#0077B6', '#CAF0F8'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#03045E', group: 'Style' },
    { key: 'cycleDuration', label: 'Cycle Duration (s)', type: 'number', defaultValue: 1.5, min: 0.5, max: 5, group: 'Timing' },
    { key: 'rippleSpeed', label: 'Ripple Speed', type: 'number', defaultValue: 2, min: 0.5, max: 5, group: 'Animation' },
  ],
})
