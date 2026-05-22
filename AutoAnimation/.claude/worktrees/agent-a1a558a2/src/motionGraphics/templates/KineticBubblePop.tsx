import { registerMotionGraphic } from '../registry'
import {
  KineticBase,
  type KineticBaseConfig,
  type KineticAnimation,
  type WordRenderProps,
  type BackgroundRenderProps,
} from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface BubblePopConfig extends KineticBaseConfig {}

function seededRandom(seed: number): number {
  const x = Math.sin(seed * 127.1 + 311.7) * 43758.5453
  return x - Math.floor(x)
}

function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3)
}

function easeOutElastic(t: number): number {
  if (t === 0 || t === 1) return t
  return Math.pow(2, -10 * t) * Math.sin((t - 0.075) * (2 * Math.PI) / 0.3) + 1
}

const animation: KineticAnimation = {
  renderBackground: ({ bgColor }: BackgroundRenderProps) => (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        background: `linear-gradient(135deg, ${bgColor}, ${bgColor}EE)`,
      }}
    >
      {/* Floating mini bubbles in background */}
      {Array.from({ length: 15 }).map((_, i) => (
        <div
          key={i}
          style={{
            position: 'absolute',
            left: `${seededRandom(i * 5 + 1) * 100}%`,
            top: `${seededRandom(i * 5 + 2) * 100}%`,
            width: `${8 + seededRandom(i * 5 + 3) * 16}px`,
            height: `${8 + seededRandom(i * 5 + 3) * 16}px`,
            borderRadius: '50%',
            background: 'transparent',
            border: `1.5px solid rgba(255,255,255,0.15)`,
            boxShadow: 'inset 2px 2px 4px rgba(255,255,255,0.1)',
          }}
        />
      ))}
    </div>
  ),

  renderWord: ({
    word,
    color,
    enterProgress,
    holdProgress,
    exitProgress,
    phase,
    index,
    frame = 0,
  }: WordRenderProps) => {
    let opacity = 1
    let bubbleScale = 1
    let textScale = 0
    let textOpacity = 0
    let wobbleX = 0
    let wobbleY = 0
    let showPopParticles = false
    let popProgress = 0

    if (phase === 'enter') {
      // Bubble grows first, then pops to reveal text
      if (enterProgress < 0.6) {
        // Bubble growing phase
        const t = enterProgress / 0.6
        bubbleScale = easeOutCubic(t)
        opacity = Math.min(1, t * 2)
        textScale = 0
        textOpacity = 0.4 + t * 0.6
        wobbleX = Math.sin(t * Math.PI * 4) * 3
        wobbleY = Math.cos(t * Math.PI * 3) * 2
      } else {
        // Pop! Text revealed
        const t = (enterProgress - 0.6) / 0.4
        bubbleScale = 1 + t * 0.5
        opacity = 1 - t
        textScale = easeOutElastic(t)
        textOpacity = 1
        showPopParticles = true
        popProgress = t
      }
    } else if (phase === 'hold') {
      bubbleScale = 0
      opacity = 0
      textScale = 1 + Math.sin(holdProgress * Math.PI * 6) * 0.04
      textOpacity = 1
      wobbleY = Math.sin(holdProgress * 10) * 4
    } else {
      // Exit: text shrinks into bubble that floats away
      const t = easeOutCubic(exitProgress)
      textScale = 1 - t * 0.7
      textOpacity = 1 - t
      wobbleY = -exitProgress * 80
    }

    const bubbleGradient = `radial-gradient(circle at 35% 30%, rgba(255,255,255,0.5), ${color}40 40%, ${color}20 70%, transparent)`

    return (
      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: `translate(-50%, -50%) translateX(${wobbleX}px) translateY(${wobbleY}px)`,
        }}
      >
        {/* Bubble */}
        {opacity > 0 && (
          <div
            style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              width: 'clamp(160px, 40vw, 340px)',
              height: 'clamp(160px, 40vw, 340px)',
              borderRadius: '50%',
              background: bubbleGradient,
              border: `2px solid ${color}40`,
              transform: `translate(-50%, -50%) scale(${bubbleScale})`,
              opacity,
              boxShadow: `inset -10px -10px 30px ${color}15, inset 5px 5px 15px rgba(255,255,255,0.2), 0 4px 20px rgba(0,0,0,0.08)`,
            }}
          >
            {/* Bubble highlight */}
            <div
              style={{
                position: 'absolute',
                top: '12%',
                left: '18%',
                width: '30%',
                height: '22%',
                background: 'rgba(255,255,255,0.5)',
                borderRadius: '50%',
                filter: 'blur(4px)',
                transform: 'rotate(-25deg)',
              }}
            />
          </div>
        )}

        {/* Pop particles */}
        {showPopParticles &&
          Array.from({ length: 10 }).map((_, i) => {
            const angle = (i / 10) * Math.PI * 2
            const dist = 60 + popProgress * 100
            const x = Math.cos(angle) * dist
            const y = Math.sin(angle) * dist
            const size = 4 + seededRandom(index * 30 + i) * 8
            return (
              <div
                key={i}
                style={{
                  position: 'absolute',
                  top: '50%',
                  left: '50%',
                  width: `${size}px`,
                  height: `${size}px`,
                  borderRadius: '50%',
                  background: `${color}${i % 2 === 0 ? 'CC' : '88'}`,
                  transform: `translate(calc(-50% + ${x}px), calc(-50% + ${y}px))`,
                  opacity: 1 - popProgress,
                }}
              />
            )
          })}

        {/* Text */}
        <div
          style={{
            position: 'relative',
            fontFamily: "'Fredoka One', 'Comic Sans MS', cursive, sans-serif",
            fontSize: 'clamp(36px, 10vw, 120px)',
            fontWeight: 700,
            color,
            opacity: textOpacity,
            transform: `scale(${textScale})`,
            textShadow: '3px 3px 0 rgba(0,0,0,0.12), 0 0 20px rgba(255,255,255,0.3)',
            whiteSpace: 'nowrap',
            textAlign: 'center',
            zIndex: 2,
          }}
        >
          {word}
        </div>
      </div>
    )
  },
}

function BubblePopComponent(props: MotionGraphicProps<BubblePopConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-bubble-pop',
  title: 'Bubble Pop',
  description:
    'Text appears inside a growing iridescent bubble that pops to reveal the word. Pop particles scatter, gentle float during hold.',
  tags: ['kinetic', 'bubble', 'pop', 'kids', 'cartoon', 'playful', 'fun', 'soap'],
  category: 'captions',
  component: BubblePopComponent as any,
  defaultConfig: {
    words: ['POP', 'BUBBLE', 'SPLASH', 'FIZZ'],
    colors: ['#7B68EE', '#FF69B4', '#00CED1', '#FFD700'],
    bgColor: '#E8F4FF',
    cycleDuration: 2.0,
  },
  configSchema: [
    {
      key: 'words',
      label: 'Words',
      type: 'text-array',
      defaultValue: ['POP', 'BUBBLE', 'SPLASH', 'FIZZ'],
      group: 'Content',
    },
    {
      key: 'colors',
      label: 'Colors',
      type: 'text-array',
      defaultValue: ['#7B68EE', '#FF69B4', '#00CED1', '#FFD700'],
      group: 'Style',
    },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#E8F4FF', group: 'Style' },
    {
      key: 'cycleDuration',
      label: 'Cycle Duration (s)',
      type: 'number',
      defaultValue: 2.0,
      min: 0.5,
      max: 5,
      group: 'Timing',
    },
  ],
})
