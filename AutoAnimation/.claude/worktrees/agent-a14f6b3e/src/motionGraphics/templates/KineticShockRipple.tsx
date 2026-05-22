import { registerMotionGraphic } from '../registry'
import { KineticBase, type KineticBaseConfig, type KineticAnimation, type WordRenderProps, type BackgroundRenderProps } from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface ShockRippleConfig extends KineticBaseConfig {
  waveAmplitude: number
}

function easeOutExpo(t: number): number { return t === 1 ? 1 : 1 - Math.pow(2, -10 * t) }
function easeInOutQuad(t: number): number {
  return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2
}

// Traveling wave that propagates horizontally through text
// Wave height at position x, at time t
function travelingWave(x: number, t: number, amplitude: number, wavelength: number, speed: number): number {
  const phase = x / wavelength - t * speed
  const envelope = Math.exp(-t * 4) * Math.exp(-Math.abs(x - t * speed) * 0.5)
  return Math.sin(phase * Math.PI * 2) * amplitude * envelope
}

const animation: KineticAnimation = {
  renderBackground: ({ bgColor, frame, fps }: BackgroundRenderProps) => {
    const time = frame / fps
    return (
      <div style={{ position: 'absolute', inset: 0, background: bgColor }}>
        {/* Horizontal shockwave rings */}
        {[0, 0.2, 0.4].map((delay, i) => {
          const t = Math.max(0, (time * 0.7) % 1.2 - delay)
          const spread = t * 120
          return (
            <div key={i} style={{
              position: 'absolute',
              top: '50%',
              left: `${50 - spread / 2}%`,
              width: `${spread}%`,
              height: 2,
              background: `linear-gradient(90deg, transparent, rgba(255,200,100,${Math.max(0, 0.1 - t * 0.08)}), transparent)`,
              transform: 'translateY(-50%)',
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
          // Normalized position 0..1 across the word
          const xPos = totalChars > 1 ? ci / (totalChars - 1) : 0.5
          let translateY = 0
          let scaleX = 1
          let scaleY = 1
          let opacity = 1
          let rotation = 0

          if (phase === 'enter') {
            // Shockwave enters from left side, slams through text L→R
            // Each letter gets hit as wave front passes it
            const waveFront = enterProgress * 1.4 - 0.2  // normalized wave front position
            const hitTime = waveFront - xPos           // negative = not yet hit, positive = passed
            const localT = Math.max(0, Math.min(1, hitTime * 3))  // 0..1 local hit progress

            if (hitTime < 0) {
              // Wave hasn't reached this character yet
              opacity = 0.1
              scaleY = 0.3
            } else {
              // Wave impact: slam upward then overshoot down, settle
              const impact = Math.sin(Math.min(1, localT) * Math.PI * 1.5) * -25
              // Subsequent oscillation
              const oscillate = localT > 0.5 ? Math.sin((localT - 0.5) * Math.PI * 4) * 8 * Math.exp(-localT * 3) : 0

              translateY = impact + oscillate
              scaleX = 1 + Math.abs(impact) * 0.004
              scaleY = 1 - Math.abs(impact) * 0.008
              rotation = Math.sin(localT * Math.PI * 2) * 3
              opacity = Math.min(1, localT * 2)
            }
          } else if (phase === 'hold') {
            // Standing wave residue — tiny ripple across all chars
            const holdWave = Math.sin(holdProgress * Math.PI * 3 - xPos * Math.PI * 2) * (1 - holdProgress * 0.8) * 4
            translateY = holdWave
            scaleX = 1 + Math.abs(holdWave) * 0.001
          } else {
            // Exit: second shockwave sweeps right→left, knocks chars out
            const waveFront = exitProgress * 1.4 - 0.2
            const hitTime = waveFront - (1 - xPos)
            const localT = Math.max(0, Math.min(1, hitTime * 3))

            translateY = localT * 60
            scaleY = 1 - localT * 0.6
            opacity = 1 - localT
          }

          return (
            <span key={ci} style={{
              display: 'inline-block',
              fontFamily: "'Arial Black', 'Impact', sans-serif",
              fontSize: 'clamp(44px, 11vw, 150px)',
              fontWeight: 900,
              color,
              transform: `translateY(${translateY}px) scaleX(${scaleX}) scaleY(${scaleY}) rotate(${rotation}deg)`,
              transformOrigin: 'center center',
              opacity,
              whiteSpace: 'pre',
              textShadow: `0 ${-translateY * 0.3}px ${Math.abs(translateY * 0.5) + 6}px ${color}55`,
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

function ShockRippleComponent(props: MotionGraphicProps<ShockRippleConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-shock-ripple',
  title: 'Kinetic Shock Ripple',
  description: 'A horizontal shockwave propagates through text left to right — each character is struck in sequence, slammed by the wave front with vertical displacement and residual oscillation',
  tags: ['kinetic', 'typography', 'shockwave', 'ripple', 'wave', 'warp', 'distort', 'propagate', 'impact'],
  category: 'captions',
  component: ShockRippleComponent as any,
  defaultConfig: {
    words: ['SHOCK', 'WAVE', 'BLAST', 'HIT'],
    colors: ['#FFD60A', '#F77F00', '#D62828', '#FCBF49'],
    bgColor: '#1A1A2E',
    cycleDuration: 1.4,
    waveAmplitude: 30,
  },
  configSchema: [
    { key: 'words', label: 'Words', type: 'text-array', defaultValue: ['SHOCK', 'WAVE', 'BLAST', 'HIT'], group: 'Content' },
    { key: 'colors', label: 'Colors', type: 'text-array', defaultValue: ['#FFD60A', '#F77F00', '#D62828', '#FCBF49'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#1A1A2E', group: 'Style' },
    { key: 'cycleDuration', label: 'Cycle Duration (s)', type: 'number', defaultValue: 1.4, min: 0.5, max: 5, group: 'Timing' },
    { key: 'waveAmplitude', label: 'Wave Amplitude (px)', type: 'number', defaultValue: 30, min: 10, max: 60, group: 'Animation' },
  ],
})
