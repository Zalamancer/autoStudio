import { registerMotionGraphic } from '../registry'
import { KineticBase, type KineticBaseConfig, type KineticAnimation, type WordRenderProps, type BackgroundRenderProps } from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

const RAINBOW = ['#FF0000', '#FF8800', '#FFDD00', '#33CC33', '#0099FF', '#6633FF', '#CC33FF']

function bounceEase(t: number): number {
  if (t < 1 / 2.75) return 7.5625 * t * t
  if (t < 2 / 2.75) { const u = t - 1.5 / 2.75; return 7.5625 * u * u + 0.75 }
  if (t < 2.5 / 2.75) { const u = t - 2.25 / 2.75; return 7.5625 * u * u + 0.9375 }
  const u = t - 2.625 / 2.75
  return 7.5625 * u * u + 0.984375
}

const animation: KineticAnimation = {
  renderBackground: ({ bgColor, width, height, frame, fps }: BackgroundRenderProps) => {
    const time = frame / fps
    // Slowly shifting rainbow gradient background
    const hueShift = (time * 20) % 360
    return (
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: `linear-gradient(${135 + Math.sin(time * 0.5) * 30}deg, ${bgColor}, hsl(${hueShift}, 70%, 85%), hsl(${(hueShift + 120) % 360}, 70%, 85%))`,
        }}
      >
        {/* Soft circle blobs */}
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            style={{
              position: 'absolute',
              width: width * 0.4,
              height: width * 0.4,
              borderRadius: '50%',
              background: `hsla(${(hueShift + i * 120) % 360}, 80%, 75%, 0.25)`,
              left: `${30 + Math.sin(time * 0.3 + i * 2) * 20}%`,
              top: `${20 + Math.cos(time * 0.4 + i * 3) * 20}%`,
              filter: 'blur(40px)',
            }}
          />
        ))}
      </div>
    )
  },

  renderWord: ({ word, enterProgress, holdProgress, exitProgress, phase, width, height, index }: WordRenderProps) => {
    const letters = word.split('')

    return (
      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          display: 'flex',
          gap: 'clamp(2px, 0.5vw, 8px)',
          whiteSpace: 'nowrap',
        }}
      >
        {letters.map((letter, i) => {
          const letterDelay = i * 0.12
          const color = RAINBOW[(i + index * 3) % RAINBOW.length]

          let opacity = 0
          let translateY = 0
          let scale = 1
          let rotation = 0

          if (phase === 'enter') {
            const adjustedProgress = Math.max(0, Math.min(1, (enterProgress - letterDelay) / (1 - letterDelay * letters.length * 0.3)))
            opacity = Math.min(1, adjustedProgress * 2)
            translateY = (1 - bounceEase(Math.min(1, adjustedProgress))) * -(height * 0.3)
            scale = adjustedProgress > 0.8 ? 1 + Math.sin((adjustedProgress - 0.8) / 0.2 * Math.PI) * 0.2 : Math.min(1, adjustedProgress * 1.5)
          } else if (phase === 'hold') {
            opacity = 1
            // Each letter bounces independently with offset
            const bounceSpeed = 3 + (i % 3) * 0.7
            const bouncePhase = i * 0.6
            translateY = Math.sin(holdProgress * Math.PI * bounceSpeed + bouncePhase) * 15
            scale = 1 + Math.sin(holdProgress * Math.PI * bounceSpeed + bouncePhase + 0.5) * 0.08
            rotation = Math.sin(holdProgress * Math.PI * 2 + i * 1.2) * 5
          } else {
            const adjustedExit = Math.min(1, (exitProgress + letterDelay * 0.3))
            opacity = 1 - adjustedExit
            translateY = adjustedExit * (height * 0.2)
            scale = 1 - adjustedExit * 0.5
          }

          return (
            <span
              key={i}
              style={{
                display: 'inline-block',
                transform: `translateY(${translateY}px) scale(${scale}) rotate(${rotation}deg)`,
                opacity,
                fontFamily: "'Fredoka One', 'Comic Sans MS', cursive, sans-serif",
                fontSize: 'clamp(36px, 10vw, 140px)',
                fontWeight: 700,
                color,
                textShadow: `2px 2px 0 rgba(0,0,0,0.15), 0 4px 8px rgba(0,0,0,0.1)`,
                WebkitTextStroke: '1px rgba(0,0,0,0.1)',
              }}
            >
              {letter}
            </span>
          )
        })}
      </div>
    )
  },
}

function RainbowBounceComponent(props: MotionGraphicProps<KineticBaseConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-rainbow-bounce',
  title: 'Kinetic Rainbow Bounce',
  description: 'Rainbow colored bouncy text for kids — each letter a different rainbow color, all bouncing independently with playful rounded font',
  tags: ['kinetic', 'typography', 'rainbow', 'bounce', 'kids', 'colorful', 'playful'],
  category: 'captions',
  component: RainbowBounceComponent as any,
  defaultConfig: {
    words: ['HELLO', 'FUN', 'PLAY', 'YAY'],
    colors: ['#FF0000', '#FF8800', '#FFDD00', '#33CC33', '#0099FF', '#6633FF', '#CC33FF'],
    bgColor: '#FFF5E6',
    cycleDuration: 1.2,
  },
  configSchema: [
    { key: 'words', label: 'Words', type: 'text-array', defaultValue: ['HELLO', 'FUN', 'PLAY', 'YAY'], group: 'Content' },
    { key: 'colors', label: 'Rainbow Colors', type: 'text-array', defaultValue: ['#FF0000', '#FF8800', '#FFDD00', '#33CC33', '#0099FF', '#6633FF', '#CC33FF'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#FFF5E6', group: 'Style' },
    { key: 'cycleDuration', label: 'Cycle Duration (s)', type: 'number', defaultValue: 1.2, min: 0.3, max: 5, group: 'Timing' },
  ],
})
