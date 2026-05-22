import { registerMotionGraphic } from '../registry'
import { KineticBase, type KineticBaseConfig, type KineticAnimation, type WordRenderProps, type BackgroundRenderProps } from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface FlickerConfig extends KineticBaseConfig {}

/** Deterministic pseudo-random 0..1 from integer seed */
function rand(s: number): number {
  const x = Math.sin(s * 127.1 + 311.7) * 43758.5453
  return x - Math.floor(x)
}

const animation: KineticAnimation = {
  renderBackground: ({ bgColor, frame }: BackgroundRenderProps) => {
    // Subtle ambient flicker on the background
    const ambientFlicker = rand(frame * 3) < 0.05 ? 0.08 : 0
    return (
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: bgColor,
        }}
      >
        {ambientFlicker > 0 && (
          <div
            style={{
              position: 'absolute',
              inset: 0,
              background: `rgba(60, 0, 0, ${ambientFlicker})`,
            }}
          />
        )}
      </div>
    )
  },

  renderWord: ({ word, color, enterProgress, exitProgress, phase, holdProgress, index, frame }: WordRenderProps) => {
    const currentFrame = frame ?? 0
    let opacity = 0
    let textColor = color

    if (phase === 'enter') {
      // Intense flickering that gradually stabilizes
      const flickerRate = 1 - enterProgress // High at start, low at end
      const flickerSeed = index * 53 + currentFrame
      const flickerValue = rand(flickerSeed)
      const flickerThreshold = 0.3 + enterProgress * 0.7 // Gets easier to pass
      opacity = flickerValue < flickerThreshold ? 0 : Math.min(1, enterProgress * 2 + 0.3)
      // Occasional color shift during enter
      if (flickerValue < flickerThreshold * 0.5) {
        textColor = '#ffffff'
      }
    } else if (phase === 'hold') {
      // Mostly stable with occasional flicker bursts
      const holdSeed = index * 137 + currentFrame
      const glitchChance = rand(holdSeed)
      if (glitchChance < 0.04) {
        // Brief blackout
        opacity = 0.1
      } else if (glitchChance < 0.08) {
        // Dim flicker
        opacity = 0.4 + rand(holdSeed + 1) * 0.3
      } else {
        opacity = 0.85 + rand(holdSeed + 2) * 0.15
      }
    } else {
      // Final flicker to black
      const flickerSeed = index * 71 + currentFrame
      const flickerValue = rand(flickerSeed)
      const survivalChance = 1 - exitProgress
      opacity = flickerValue < survivalChance ? (0.3 + rand(flickerSeed + 1) * 0.7) * (1 - exitProgress * 0.5) : 0
    }

    return (
      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          opacity,
          fontFamily: "'Courier New', monospace",
          fontSize: 'clamp(40px, 12vw, 160px)',
          fontWeight: 700,
          textTransform: 'uppercase',
          color: textColor,
          textShadow: opacity > 0.5
            ? `0 0 ${10 + opacity * 15}px ${color}, 0 0 ${30 + opacity * 20}px rgba(255, 50, 50, 0.3)`
            : 'none',
          whiteSpace: 'nowrap',
        }}
      >
        {word}
      </div>
    )
  },
}

function FlickerComponent(props: MotionGraphicProps<FlickerConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-flicker',
  title: 'Kinetic Flicker',
  description: 'Horror flicker effect with strobe-like rapid opacity changes, like a dying light in darkness',
  tags: ['kinetic', 'typography', 'horror', 'flicker', 'strobe', 'dark', 'creepy'],
  category: 'captions',
  component: FlickerComponent as any,
  defaultConfig: {
    words: ['HELP', 'DARK', 'ALONE', 'RUN'],
    colors: ['#FF4444', '#CC2222', '#FF6666', '#AA0000'],
    bgColor: '#000000',
    cycleDuration: 1.2,
  },
  configSchema: [
    { key: 'words', label: 'Words', type: 'text-array', defaultValue: ['HELP', 'DARK', 'ALONE', 'RUN'], group: 'Content' },
    { key: 'colors', label: 'Colors', type: 'text-array', defaultValue: ['#FF4444', '#CC2222', '#FF6666', '#AA0000'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#000000', group: 'Style' },
    { key: 'cycleDuration', label: 'Cycle Duration (s)', type: 'number', defaultValue: 1.2, min: 0.3, max: 5, group: 'Timing' },
  ],
})
