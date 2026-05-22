import { registerMotionGraphic } from '../registry'
import { KineticBase, type KineticBaseConfig, type KineticAnimation, type WordRenderProps, type BackgroundRenderProps } from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface Y2KBubbleConfig extends KineticBaseConfig {}

const animation: KineticAnimation = {
  renderBackground: ({ bgColor, frame, fps, width, height }: BackgroundRenderProps) => {
    const time = frame / fps

    // Generate sparkle stars
    const sparkles = Array.from({ length: 12 }, (_, i) => {
      const seed = i * 137 + 42
      const x = ((seed * 7 + 123) % 90) + 5
      const y = ((seed * 13 + 456) % 85) + 5
      const sparklePhase = (time * 2 + i * 0.8) % 3
      const sparkleOpacity = sparklePhase < 1
        ? Math.sin(sparklePhase * Math.PI)
        : 0
      const size = 4 + (seed % 6)

      return (
        <div
          key={i}
          style={{
            position: 'absolute',
            left: `${x}%`,
            top: `${y}%`,
            width: size,
            height: size,
            opacity: sparkleOpacity,
            pointerEvents: 'none',
          }}
        >
          {/* 4-point star sparkle */}
          <div
            style={{
              position: 'absolute',
              inset: 0,
              background: '#ffffff',
              clipPath: 'polygon(50% 0%, 60% 40%, 100% 50%, 60% 60%, 50% 100%, 40% 60%, 0% 50%, 40% 40%)',
              filter: 'drop-shadow(0 0 2px rgba(255,255,255,0.8))',
            }}
          />
        </div>
      )
    })

    return (
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: bgColor === '#ffe0f0'
            ? `linear-gradient(135deg, #ffe0f0 0%, #e0e0ff 50%, #d0f0ff 100%)`
            : bgColor,
        }}
      >
        {/* Iridescent sheen overlay */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: `linear-gradient(${120 + Math.sin(time * 0.5) * 30}deg, rgba(255,150,255,0.08), rgba(150,200,255,0.08), rgba(150,255,200,0.08))`,
            pointerEvents: 'none',
          }}
        />
        {sparkles}
      </div>
    )
  },

  renderWord: ({ word, color, enterProgress, exitProgress, phase, index }: WordRenderProps) => {
    let opacity = 0
    let scale = 1
    let translateY = 0

    if (phase === 'enter') {
      // Bubbly bounce-in
      const t = enterProgress
      const bounce = t < 0.6
        ? Math.pow(t / 0.6, 2)
        : 1 + Math.sin((t - 0.6) / 0.4 * Math.PI * 2) * 0.08 * (1 - t)
      opacity = Math.min(t / 0.3, 1)
      scale = bounce
    } else if (phase === 'hold') {
      opacity = 1
      // Gentle float
      translateY = Math.sin(Date.now() * 0.003 + index * 2) * 5
      scale = 1 + Math.sin(Date.now() * 0.002 + index) * 0.02
    } else {
      opacity = 1 - exitProgress
      scale = 1 - exitProgress * 0.3
      translateY = exitProgress * 20
    }

    return (
      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: `translate(-50%, -50%) translateY(${translateY}px) scale(${scale})`,
          opacity,
          fontFamily: "'Trebuchet MS', 'Comic Sans MS', 'Arial Rounded MT Bold', sans-serif",
          fontSize: 'clamp(40px, 11vw, 150px)',
          fontWeight: 800,
          whiteSpace: 'nowrap',
          letterSpacing: 2,
          textTransform: 'uppercase',
          // Glossy bubble text with gradient highlight
          color: 'transparent',
          backgroundImage: `linear-gradient(180deg, #ffffff 0%, #ffffff 20%, ${color} 50%, ${color} 80%, rgba(255,255,255,0.6) 100%)`,
          backgroundClip: 'text',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          filter: `drop-shadow(0 2px 4px rgba(0,0,0,0.15)) drop-shadow(0 0 12px ${color}40)`,
          WebkitTextStroke: `1px ${color}30`,
        }}
      >
        {word}
      </div>
    )
  },
}

function Y2KBubbleComponent(props: MotionGraphicProps<Y2KBubbleConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-y2k-bubble',
  title: 'Kinetic Y2K Bubble',
  description: 'Y2K aesthetic with glossy bubble text, iridescent pastel background, and star sparkles',
  tags: ['kinetic', 'typography', 'y2k', 'bubble', 'glossy', 'pastel', 'aesthetic', 'sparkle'],
  category: 'captions',
  component: Y2KBubbleComponent as any,
  defaultConfig: {
    words: ['CUTE', 'GLOW', 'STAR', 'DREAM'],
    colors: ['#FF69B4', '#87CEEB', '#DDA0DD', '#98FB98'],
    bgColor: '#ffe0f0',
    cycleDuration: 1.1,
  },
  configSchema: [
    { key: 'words', label: 'Words', type: 'text-array', defaultValue: ['CUTE', 'GLOW', 'STAR', 'DREAM'], group: 'Content' },
    { key: 'colors', label: 'Colors', type: 'text-array', defaultValue: ['#FF69B4', '#87CEEB', '#DDA0DD', '#98FB98'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#ffe0f0', group: 'Style' },
    { key: 'cycleDuration', label: 'Cycle Duration (s)', type: 'number', defaultValue: 1.1, min: 0.3, max: 5, group: 'Timing' },
  ],
})
