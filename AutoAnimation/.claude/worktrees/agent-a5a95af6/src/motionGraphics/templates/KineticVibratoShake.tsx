import { registerMotionGraphic } from '../registry'
import { KineticBase, type KineticBaseConfig, type KineticAnimation, type WordRenderProps, type BackgroundRenderProps } from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface VibratoShakeConfig extends KineticBaseConfig {
  frequency: number
}

function easeOutExpo(t: number): number { return t === 1 ? 1 : 1 - Math.pow(2, -10 * t) }
function easeOutBack(t: number): number {
  const c = 1.70158
  return 1 + (c + 1) * Math.pow(t - 1, 3) + c * Math.pow(t - 1, 2)
}

// Guitar string vibration model — amplitude decays with frequency
function vibrateAmplitude(t: number, freq: number, decayRate: number): number {
  return Math.sin(t * Math.PI * 2 * freq) * Math.exp(-decayRate * t)
}

const animation: KineticAnimation = {
  renderBackground: ({ bgColor, frame, fps }: BackgroundRenderProps) => {
    const time = frame / fps
    return (
      <div style={{ position: 'absolute', inset: 0, background: bgColor }}>
        {/* Resonance rings — concentric ellipses that pulse */}
        {[1, 2, 3].map(i => (
          <div key={i} style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            width: `${20 + i * 25}%`,
            height: `${6 + i * 3}%`,
            borderRadius: '50%',
            border: `1px solid rgba(255,255,255,${0.04 - i * 0.01})`,
            transform: `translate(-50%, -50%) scaleY(${1 + Math.sin(time * 8 + i) * 0.05})`,
            pointerEvents: 'none',
          }} />
        ))}
      </div>
    )
  },

  renderWord: ({ word, color, enterProgress, holdProgress, exitProgress, phase, index }: WordRenderProps) => {
    const chars = word.split('')
    const baseFreq = 12 // vibrations per second simulation

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
          // Phase offset per character — wave propagates along word
          const charPhase = ci / Math.max(chars.length - 1, 1)
          let translateY = 0
          let translateX = 0
          let scaleX = 1
          let scaleY = 1
          let opacity = 1
          let blur = 0

          if (phase === 'enter') {
            // SNAP: appear with maximum vibration amplitude, decay to rest
            const pluckAmplitude = vibrateAmplitude(enterProgress, baseFreq, 8)
            // Stagger the pluck along the word
            const staggeredT = Math.max(0, enterProgress - charPhase * 0.1)
            const localPluck = vibrateAmplitude(staggeredT, baseFreq * (1 + charPhase * 0.3), 9)

            translateY = localPluck * 30
            translateX = localPluck * 4 * Math.sin(ci * 1.2)
            scaleX = 1 + Math.abs(localPluck) * 0.15
            scaleY = 1 - Math.abs(localPluck) * 0.2
            opacity = Math.min(1, enterProgress * 8) // instant appear
            blur = Math.abs(localPluck) * 3 // motion blur at peak vibration
          } else if (phase === 'hold') {
            // Resonant hum — low amplitude, different frequency per char
            const hum = vibrateAmplitude(holdProgress * 2, 6 + charPhase * 3, 2)
            translateY = hum * 4
            scaleX = 1 + Math.abs(hum) * 0.04
            scaleY = 1 - Math.abs(hum) * 0.05
          } else {
            // Dying vibration as text fades
            const decayVib = vibrateAmplitude(exitProgress, baseFreq * 0.5, 3)
            translateY = decayVib * 20 * (1 - exitProgress)
            opacity = 1 - exitProgress * exitProgress
          }

          return (
            <span key={ci} style={{
              display: 'inline-block',
              fontFamily: "'Arial Black', 'Impact', sans-serif",
              fontSize: 'clamp(44px, 11vw, 150px)',
              fontWeight: 900,
              color,
              transform: `translateX(${translateX}px) translateY(${translateY}px) scaleX(${scaleX}) scaleY(${scaleY})`,
              transformOrigin: 'center center',
              opacity,
              filter: blur > 0.5 ? `blur(${blur}px)` : 'none',
              whiteSpace: 'pre',
              textShadow: `0 0 ${Math.abs(translateY) * 0.5 + 4}px ${color}66`,
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

function VibratoShakeComponent(props: MotionGraphicProps<VibratoShakeConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-vibrato-shake',
  title: 'Kinetic Vibrato Shake',
  description: 'Text is plucked like a guitar string — characters vibrate at high frequency with exponentially decaying amplitude, creating a realistic string resonance across the word',
  tags: ['kinetic', 'typography', 'vibrato', 'shake', 'guitar', 'string', 'elastic', 'resonance', 'physics'],
  category: 'captions',
  component: VibratoShakeComponent as any,
  defaultConfig: {
    words: ['PLUCK', 'STRUM', 'RING', 'TONE'],
    colors: ['#F72585', '#7209B7', '#3A0CA3', '#4CC9F0'],
    bgColor: '#0B090A',
    cycleDuration: 1.2,
    frequency: 12,
  },
  configSchema: [
    { key: 'words', label: 'Words', type: 'text-array', defaultValue: ['PLUCK', 'STRUM', 'RING', 'TONE'], group: 'Content' },
    { key: 'colors', label: 'Colors', type: 'text-array', defaultValue: ['#F72585', '#7209B7', '#3A0CA3', '#4CC9F0'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#0B090A', group: 'Style' },
    { key: 'cycleDuration', label: 'Cycle Duration (s)', type: 'number', defaultValue: 1.2, min: 0.3, max: 5, group: 'Timing' },
    { key: 'frequency', label: 'Vibration Frequency', type: 'number', defaultValue: 12, min: 4, max: 24, group: 'Animation' },
  ],
})
