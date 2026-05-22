import { registerMotionGraphic } from '../registry'
import { KineticBase, type KineticBaseConfig, type KineticAnimation, type WordRenderProps, type BackgroundRenderProps } from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface TwistCorkscrewConfig extends KineticBaseConfig {
  twistDegrees: number
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
        {/* Corkscrew helix guide lines */}
        {Array.from({ length: 12 }, (_, i) => {
          const angle = (i / 12) * 360 + time * 15
          const x = 50 + Math.cos((angle * Math.PI) / 180) * 8
          const y = 40 + (i / 12) * 20
          return (
            <div key={i} style={{
              position: 'absolute',
              left: `${x}%`,
              top: `${y}%`,
              width: 3,
              height: 3,
              borderRadius: '50%',
              background: `rgba(255,255,255,${0.04 + Math.abs(Math.cos((angle * Math.PI) / 180)) * 0.04})`,
              transform: 'translate(-50%, -50%)',
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
        perspective: 600,
      }}>
        {chars.map((ch, ci) => {
          // Corkscrew twist: each char rotates around horizontal (X) axis
          // Characters at different positions are at different phases of the helix
          const charFraction = totalChars > 1 ? ci / (totalChars - 1) : 0.5
          // Angular position in the helix at rest (all 0 = flat)
          // During animation, they spiral from offset positions
          const helixPhase = charFraction * 180  // spread across 180deg of helix

          let rotateX = 0
          let rotateY = 0
          let scaleX = 1
          let opacity = 1
          let translateY = 0

          if (phase === 'enter') {
            // Characters start at various points around the helix (twisted)
            // They unwind toward the viewer to flat
            const unwind = easeOutBack(enterProgress)

            // Starting helix position: characters are rotated away from viewer
            const startRotX = (1 - unwind) * (90 + helixPhase * 0.5)
            const startRotY = (1 - unwind) * (helixPhase)

            rotateX = startRotX
            rotateY = startRotY

            // Characters at back of helix (high rotX) appear scaled down
            const perspective = Math.cos((startRotX * Math.PI) / 180)
            scaleX = Math.max(0.05, perspective)

            opacity = Math.min(1, enterProgress * 3)
            // Characters appear at different Y heights based on helix position
            translateY = (1 - unwind) * Math.sin((helixPhase * Math.PI) / 180) * 40
          } else if (phase === 'hold') {
            // Subtle cork wobble — very slight twist residue
            const wobble = Math.sin(holdProgress * Math.PI * 3) * (1 - holdProgress * 0.8) * 5
            rotateX = wobble
            rotateY = wobble * 0.3
          } else {
            // Re-twist: characters cork back into the helix and recede
            const ep = easeInCubic(exitProgress)
            rotateX = ep * (90 + helixPhase * 0.5)
            rotateY = ep * helixPhase * 0.5
            const perspective = Math.max(0.05, Math.cos((rotateX * Math.PI) / 180))
            scaleX = perspective
            translateY = ep * Math.sin((helixPhase * Math.PI) / 180) * 40
            opacity = 1 - ep
          }

          return (
            <span key={ci} style={{
              display: 'inline-block',
              fontFamily: "'Arial Black', 'Impact', sans-serif",
              fontSize: 'clamp(44px, 11vw, 150px)',
              fontWeight: 900,
              color,
              transform: `translateY(${translateY}px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scaleX(${scaleX})`,
              transformOrigin: 'center center',
              transformStyle: 'preserve-3d',
              opacity,
              whiteSpace: 'pre',
              textShadow: `0 4px 12px rgba(0,0,0,0.5)`,
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

function TwistCorkscrewComponent(props: MotionGraphicProps<TwistCorkscrewConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-twist-corkscrew',
  title: 'Kinetic Twist Corkscrew',
  description: 'Characters unwind from a 3D corkscrew helix — each letter is at a different angular position rotating toward the viewer, creating a threaded DNA-like unwrapping entry',
  tags: ['kinetic', 'typography', 'corkscrew', 'twist', 'helix', 'warp', 'distort', '3d', 'rotate', 'spiral'],
  category: 'captions',
  component: TwistCorkscrewComponent as any,
  defaultConfig: {
    words: ['TWIST', 'TURN', 'HELIX', 'COIL'],
    colors: ['#E040FB', '#7C4DFF', '#40C4FF', '#69F0AE'],
    bgColor: '#0A0014',
    cycleDuration: 1.5,
    twistDegrees: 180,
  },
  configSchema: [
    { key: 'words', label: 'Words', type: 'text-array', defaultValue: ['TWIST', 'TURN', 'HELIX', 'COIL'], group: 'Content' },
    { key: 'colors', label: 'Colors', type: 'text-array', defaultValue: ['#E040FB', '#7C4DFF', '#40C4FF', '#69F0AE'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#0A0014', group: 'Style' },
    { key: 'cycleDuration', label: 'Cycle Duration (s)', type: 'number', defaultValue: 1.5, min: 0.5, max: 5, group: 'Timing' },
    { key: 'twistDegrees', label: 'Twist Degrees', type: 'number', defaultValue: 180, min: 45, max: 360, group: 'Animation' },
  ],
})
