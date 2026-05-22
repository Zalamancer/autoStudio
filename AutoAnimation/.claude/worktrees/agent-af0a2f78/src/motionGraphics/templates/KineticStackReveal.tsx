import { registerMotionGraphic } from '../registry'
import { KineticBase, type KineticBaseConfig, type KineticAnimation, type WordRenderProps, type BackgroundRenderProps } from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface StackRevealConfig extends KineticBaseConfig {}

function easeOutBack(t: number): number {
  const c1 = 1.70158
  const c3 = c1 + 1
  return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2)
}

const letterColors = ['#FF6B6B', '#4ECDC4', '#FFE66D', '#A8E6CF', '#FF8B94', '#B5EAD7', '#C7CEEA', '#FFDAC1']

const animation: KineticAnimation = {
  renderBackground: ({ bgColor }: BackgroundRenderProps) => (
    <div style={{ position: 'absolute', inset: 0, background: bgColor }} />
  ),

  renderWord: ({ word, color, enterProgress, holdProgress, exitProgress, phase, index }: WordRenderProps) => {
    const letters = word.split('')
    const totalLetters = letters.length
    const staggerDelay = 0.8 / Math.max(totalLetters, 1) // Spread across 80% of enter duration

    return (
      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          display: 'flex',
          gap: 'clamp(2px, 0.5vw, 6px)',
        }}
      >
        {letters.map((letter, i) => {
          let opacity = 0
          let translateY = 0
          let rotation = 0
          let scale = 1

          if (phase === 'enter') {
            // Staggered drop-in from top
            const letterStart = (i / totalLetters) * 0.6
            const letterProgress = Math.max(0, Math.min(1, (enterProgress - letterStart) / (1 - letterStart + 0.01)))
            const eased = easeOutBack(letterProgress)
            translateY = (1 - eased) * -120
            opacity = Math.min(1, letterProgress * 2.5)
            scale = 0.5 + eased * 0.5
          } else if (phase === 'hold') {
            opacity = 1
            // Independent float at different phases
            const floatPhase = (i / totalLetters) * Math.PI * 2
            translateY = Math.sin(holdProgress * Math.PI * 6 + floatPhase) * 4
            rotation = Math.sin(holdProgress * Math.PI * 4 + floatPhase) * 2
          } else {
            // Fly off in varied directions
            const angle = ((i * 137.5 + index * 42) % 360) * (Math.PI / 180)
            const distance = exitProgress * 200
            translateY = Math.sin(angle) * distance
            const translateX = Math.cos(angle) * distance
            opacity = 1 - exitProgress
            rotation = exitProgress * ((i % 2 === 0) ? 45 : -45)
            scale = 1 - exitProgress * 0.5

            return (
              <div
                key={i}
                style={{
                  fontFamily: "'Inter', 'Fredoka One', sans-serif",
                  fontSize: 'clamp(36px, 11vw, 150px)',
                  fontWeight: 800,
                  color: letterColors[i % letterColors.length],
                  transform: `translate(${translateX}px, ${translateY}px) rotate(${rotation}deg) scale(${scale})`,
                  opacity,
                  whiteSpace: 'nowrap',
                  display: 'inline-block',
                }}
              >
                {letter}
              </div>
            )
          }

          return (
            <div
              key={i}
              style={{
                fontFamily: "'Inter', 'Fredoka One', sans-serif",
                fontSize: 'clamp(36px, 11vw, 150px)',
                fontWeight: 800,
                color: letterColors[i % letterColors.length],
                transform: `translateY(${translateY}px) rotate(${rotation}deg) scale(${scale})`,
                opacity,
                whiteSpace: 'nowrap',
                display: 'inline-block',
              }}
            >
              {letter}
            </div>
          )
        })}
      </div>
    )
  },
}

function StackRevealComponent(props: MotionGraphicProps<StackRevealConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-stack-reveal',
  title: 'Kinetic Stack Reveal',
  description: 'Letters drop in one by one from the top, float independently, then scatter on exit',
  tags: ['kinetic', 'typography', 'stagger', 'letters', 'colorful', 'playful'],
  category: 'captions',
  component: StackRevealComponent as any,
  defaultConfig: {
    words: ['HELLO', 'WORLD', 'COOL', 'YEAH'],
    colors: ['#FF6B6B', '#4ECDC4', '#FFE66D', '#A8E6CF'],
    bgColor: '#1A1A2E',
    cycleDuration: 1.3,
  },
  configSchema: [
    { key: 'words', label: 'Words', type: 'text-array', defaultValue: ['HELLO', 'WORLD', 'COOL', 'YEAH'], group: 'Content' },
    { key: 'colors', label: 'Colors', type: 'text-array', defaultValue: ['#FF6B6B', '#4ECDC4', '#FFE66D'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#1A1A2E', group: 'Style' },
    { key: 'cycleDuration', label: 'Cycle Duration (s)', type: 'number', defaultValue: 1.3, min: 0.3, max: 5, group: 'Timing' },
  ],
})
