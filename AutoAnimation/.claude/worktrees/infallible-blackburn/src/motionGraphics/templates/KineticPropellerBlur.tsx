import { registerMotionGraphic } from '../registry'
import { KineticBase, type KineticBaseConfig, type KineticAnimation, type WordRenderProps, type BackgroundRenderProps } from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

// ── Rotation Distort 4: Propeller Blur ───────────────────────────────────────
// Each character spins as a propeller — starts at extreme angular velocity
// (motion blur via stacked ghost copies), decelerates and locks into position.

interface PropellerBlurConfig extends KineticBaseConfig {
  bladeCount: number
  spinDecay: number
}

function easeOutExpo(t: number): number {
  return t === 1 ? 1 : 1 - Math.pow(2, -10 * t)
}

function easeInExpo(t: number): number {
  return t === 0 ? 0 : Math.pow(2, 10 * t - 10)
}

const GHOST_COUNT = 5

const animation: KineticAnimation = {
  renderBackground: ({ bgColor, width, height }: BackgroundRenderProps) => (
    <div style={{ position: 'absolute', inset: 0, background: bgColor }}>
      <div style={{
        position: 'absolute', inset: 0,
        background: `radial-gradient(circle at 50% 50%, rgba(255,255,255,0.03) 0%, transparent 70%)`,
      }} />
    </div>
  ),

  renderWord: ({ word, color, enterProgress, holdProgress, exitProgress, phase, width, height }: WordRenderProps) => {
    const chars = word.split('')
    const totalChars = chars.length

    return (
      <div style={{ position: 'absolute', inset: 0 }}>
        <div style={{
          position: 'absolute', top: '50%', left: '50%',
          transform: 'translate(-50%, -50%)',
          display: 'flex', whiteSpace: 'nowrap',
        }}>
          {chars.map((ch, ci) => {
            // Stagger: chars spin in one after another
            const stagger = (ci / Math.max(1, totalChars - 1)) * 0.3
            const direction = ci % 2 === 0 ? 1 : -1

            let totalRotation = 0, opacity = 0, sc = 1, blur = 0

            if (phase === 'enter') {
              const p = Math.max(0, Math.min(1, (enterProgress - stagger) / (1 - stagger * 0.5)))
              const e = easeOutExpo(p)
              // Starts at many full rotations, decelerates to 0
              totalRotation = direction * (1 - e) * 1080
              opacity = Math.min(1, p * 2)
              sc = 0.3 + e * 0.7
              blur = (1 - e) * 3 * (1 - e) * 6  // motion blur at start
            } else if (phase === 'hold') {
              // Slight continuous spin + wobble
              totalRotation = direction * holdProgress * 30
              opacity = 1
              sc = 1 + Math.sin(holdProgress * Math.PI * 4 + ci) * 0.02
            } else {
              // Spin back up to full speed and fly away
              const p = easeInExpo(exitProgress)
              totalRotation = direction * p * 720
              opacity = 1 - p * 0.8
              sc = 1 - p * 0.5
              blur = p * 10
            }

            // Propeller motion blur: ghost copies at partial rotations
            const ghosts = Array.from({ length: GHOST_COUNT }, (_, gi) => {
              const ghostAngle = totalRotation - direction * (gi + 1) * (Math.abs(totalRotation) / 360) * 15
              const ghostOp = (1 - (gi + 1) / (GHOST_COUNT + 1)) * 0.15 * (Math.abs(totalRotation) / 500)
              return (
                <div
                  key={gi}
                  style={{
                    position: 'absolute',
                    inset: 0,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontFamily: "'Impact', 'Arial Black', sans-serif",
                    fontSize: 'clamp(44px, 10vw, 140px)',
                    fontWeight: 900,
                    color,
                    opacity: Math.max(0, ghostOp),
                    transform: `rotate(${ghostAngle}deg) scale(${sc})`,
                  }}
                >
                  {ch}
                </div>
              )
            })

            return (
              <div
                key={ci}
                style={{
                  display: 'inline-block',
                  position: 'relative',
                  width: 'auto',
                  minWidth: '0.6em',
                }}
              >
                {ghosts}
                <div
                  style={{
                    display: 'inline-block',
                    fontFamily: "'Impact', 'Arial Black', sans-serif",
                    fontSize: 'clamp(44px, 10vw, 140px)',
                    fontWeight: 900,
                    color,
                    opacity: Math.max(0, opacity),
                    filter: `blur(${blur}px)`,
                    transform: `rotate(${totalRotation}deg) scale(${sc})`,
                    transformOrigin: 'center center',
                    textShadow: `0 0 15px ${color}50`,
                    lineHeight: 1,
                  }}
                >
                  {ch}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    )
  },
}

function PropellerBlurComponent(props: MotionGraphicProps<PropellerBlurConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-propeller-blur',
  title: 'Kinetic Propeller Blur',
  description: 'Each character spins as a propeller from extreme angular velocity — ghost copies simulate motion blur, decelerates with expo easing and locks, slow spin on hold.',
  tags: ['kinetic', 'typography', 'propeller', 'spin', 'rotation', 'blur', 'motion', 'distortion'],
  category: 'captions',
  component: PropellerBlurComponent as any,
  defaultConfig: {
    words: ['SPIN', 'FLY', 'FAST', 'GO'],
    colors: ['#FFFFFF', '#00AAFF', '#FFFFFF', '#FF4400'],
    bgColor: '#060c14',
    cycleDuration: 1.4,
    bladeCount: 3,
    spinDecay: 1,
  },
  configSchema: [
    { key: 'words', label: 'Words', type: 'text-array', defaultValue: ['SPIN', 'FLY', 'FAST', 'GO'], group: 'Content' },
    { key: 'colors', label: 'Colors', type: 'text-array', defaultValue: ['#FFFFFF', '#00AAFF', '#FFFFFF', '#FF4400'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#060c14', group: 'Style' },
    { key: 'cycleDuration', label: 'Cycle Duration (s)', type: 'number', defaultValue: 1.4, min: 0.5, max: 5, group: 'Timing' },
    { key: 'bladeCount', label: 'Ghost Trails', type: 'number', defaultValue: 3, min: 1, max: 8, group: 'Animation' },
    { key: 'spinDecay', label: 'Spin Decay', type: 'number', defaultValue: 1, min: 0.3, max: 3, group: 'Animation' },
  ],
})
