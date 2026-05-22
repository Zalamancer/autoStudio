import { registerMotionGraphic } from '../registry'
import { KineticBase, type KineticBaseConfig, type KineticAnimation, type WordRenderProps, type BackgroundRenderProps } from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface HandwrittenConfig extends KineticBaseConfig {}

const animation: KineticAnimation = {
  renderBackground: ({ bgColor }: BackgroundRenderProps) => (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        background: bgColor,
      }}
    >
      {/* Subtle lined paper texture */}
      {Array.from({ length: 12 }, (_, i) => (
        <div
          key={i}
          style={{
            position: 'absolute',
            top: `${10 + i * 7}%`,
            left: '8%',
            right: '8%',
            height: 1,
            background: 'rgba(100,130,180,0.12)',
          }}
        />
      ))}
      {/* Left margin line */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          bottom: 0,
          left: '12%',
          width: 2,
          background: 'rgba(200,80,80,0.15)',
        }}
      />
    </div>
  ),

  renderWord: ({ word, color, enterProgress, holdProgress, exitProgress, phase, index }: WordRenderProps) => {
    const seed = index * 37 + 13
    const totalChars = word.length

    if (phase === 'enter') {
      // Letter-by-letter reveal with wobble as if being written
      const visibleChars = Math.floor(enterProgress * (totalChars + 1))

      return (
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            display: 'flex',
            alignItems: 'baseline',
            whiteSpace: 'nowrap',
          }}
        >
          {word.split('').map((char, ci) => {
            if (ci >= visibleChars) return null
            const charProgress = ci < visibleChars - 1 ? 1 : Math.min(1, (enterProgress * (totalChars + 1) - ci))
            const wobbleY = Math.sin((seed + ci) * 2.7) * 3 * (1 - charProgress)
            const wobbleRotation = Math.sin((seed + ci) * 1.9) * 8 * (1 - charProgress)
            const baselineShift = Math.sin((seed + ci) * 3.1) * 2

            return (
              <span
                key={ci}
                style={{
                  display: 'inline-block',
                  fontFamily: "'Segoe Script', 'Comic Sans MS', 'Brush Script MT', cursive",
                  fontSize: 'clamp(40px, 10vw, 120px)',
                  fontWeight: 400,
                  color,
                  opacity: charProgress,
                  transform: `translateY(${baselineShift + wobbleY}px) rotate(${wobbleRotation}deg)`,
                }}
              >
                {char}
              </span>
            )
          })}
        </div>
      )
    }

    if (phase === 'hold') {
      // Gentle float with slight wobble
      const floatY = Math.sin(holdProgress * Math.PI * 2 + seed) * 3

      return (
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: `translate(-50%, calc(-50% + ${floatY}px))`,
            display: 'flex',
            alignItems: 'baseline',
            whiteSpace: 'nowrap',
          }}
        >
          {word.split('').map((char, ci) => {
            const baselineShift = Math.sin((seed + ci) * 3.1) * 2
            const letterWobble = Math.sin(holdProgress * Math.PI * 3 + ci * 0.8 + seed) * 1

            return (
              <span
                key={ci}
                style={{
                  display: 'inline-block',
                  fontFamily: "'Segoe Script', 'Comic Sans MS', 'Brush Script MT', cursive",
                  fontSize: 'clamp(40px, 10vw, 120px)',
                  fontWeight: 400,
                  color,
                  transform: `translateY(${baselineShift + letterWobble}px)`,
                }}
              >
                {char}
              </span>
            )
          })}
        </div>
      )
    }

    // Exit: eraser wipe from right to left
    const eraseClip = (1 - exitProgress) * 100

    return (
      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          clipPath: `inset(0 ${100 - eraseClip}% 0 0)`,
          opacity: 1 - exitProgress * 0.3,
          filter: exitProgress > 0.5 ? `blur(${(exitProgress - 0.5) * 6}px)` : undefined,
          display: 'flex',
          alignItems: 'baseline',
          whiteSpace: 'nowrap',
        }}
      >
        {word.split('').map((char, ci) => {
          const baselineShift = Math.sin((seed + ci) * 3.1) * 2

          return (
            <span
              key={ci}
              style={{
                display: 'inline-block',
                fontFamily: "'Segoe Script', 'Comic Sans MS', 'Brush Script MT', cursive",
                fontSize: 'clamp(40px, 10vw, 120px)',
                fontWeight: 400,
                color,
                transform: `translateY(${baselineShift}px)`,
              }}
            >
              {char}
            </span>
          )
        })}
      </div>
    )
  },
}

function HandwrittenComponent(props: MotionGraphicProps<HandwrittenConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-handwritten',
  title: 'Kinetic Handwritten',
  description: 'Handwriting reveal with letters appearing one-by-one with slight wobble as if being written in cursive',
  tags: ['kinetic', 'typography', 'handwritten', 'cursive', 'writing', 'organic', 'script'],
  category: 'captions',
  component: HandwrittenComponent as any,
  defaultConfig: {
    words: ['HELLO', 'WORLD', 'DREAM', 'CREATE'],
    colors: ['#2C3E50', '#1A5276', '#6C3483', '#1E8449'],
    bgColor: '#faf3e0',
    cycleDuration: 1.5,
  },
  configSchema: [
    { key: 'words', label: 'Words', type: 'text-array', defaultValue: ['HELLO', 'WORLD', 'DREAM', 'CREATE'], group: 'Content' },
    { key: 'colors', label: 'Colors', type: 'text-array', defaultValue: ['#2C3E50', '#1A5276', '#6C3483', '#1E8449'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#faf3e0', group: 'Style' },
    { key: 'cycleDuration', label: 'Cycle Duration (s)', type: 'number', defaultValue: 1.5, min: 0.3, max: 5, group: 'Timing' },
  ],
})
