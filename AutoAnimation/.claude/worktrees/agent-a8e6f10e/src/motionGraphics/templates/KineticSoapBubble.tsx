import { registerMotionGraphic } from '../registry'
import { KineticBase, type KineticBaseConfig, type KineticAnimation, type WordRenderProps, type BackgroundRenderProps } from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface SoapBubbleConfig extends KineticBaseConfig {}

const animation: KineticAnimation = {
  renderBackground: ({ frame, fps, width, height }: BackgroundRenderProps) => {
    const time = frame / fps

    // Floating mini bubbles in the background
    const bubbles = Array.from({ length: 14 }, (_, i) => {
      const seed = i * 137.5
      const x = (seed * 3.7 + time * (8 + (i % 5) * 3)) % (width + 60) - 30
      const baseY = height - ((seed * 2.3 + time * (20 + (i % 4) * 8)) % (height + 100))
      const wobbleX = Math.sin(time * 1.5 + i * 0.8) * 12
      const size = 8 + (i % 6) * 6
      const alpha = 0.15 + (i % 5) * 0.05
      return { x: x + wobbleX, y: baseY, size, alpha }
    })

    return (
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: 'linear-gradient(180deg, #0A1628 0%, #1A2744 50%, #2D3B55 100%)',
          overflow: 'hidden',
        }}
      >
        {bubbles.map((b, i) => (
          <div
            key={i}
            style={{
              position: 'absolute',
              left: b.x,
              top: b.y,
              width: b.size,
              height: b.size,
              borderRadius: '50%',
              background: `radial-gradient(circle at 35% 35%, rgba(255,255,255,${b.alpha}), rgba(180,220,255,${b.alpha * 0.5}) 50%, transparent 70%)`,
              border: `1px solid rgba(255,255,255,${b.alpha * 0.6})`,
              boxShadow: `inset -2px -2px ${b.size * 0.3}px rgba(200,180,255,${b.alpha * 0.3})`,
            }}
          />
        ))}
      </div>
    )
  },

  renderWord: ({ word, color, enterProgress, exitProgress, phase, index, frame, fps, width, height }: WordRenderProps) => {
    const time = (frame ?? 0) / (fps ?? 30)
    let opacity = 0
    let scale = 1
    let bubbleScale = 0
    let translateY = 0

    if (phase === 'enter') {
      // Bubble inflates then text fades in
      const bubblePhase = Math.min(1, enterProgress / 0.6)
      const textPhase = Math.max(0, (enterProgress - 0.4) / 0.6)
      const bubbleEased = 1 - Math.pow(1 - bubblePhase, 3)
      bubbleScale = bubbleEased
      opacity = textPhase
      scale = 0.8 + textPhase * 0.2
      translateY = (1 - bubbleEased) * 60
    } else if (phase === 'hold') {
      bubbleScale = 1
      opacity = 1
      // Gentle float
      translateY = Math.sin(time * 2 + index) * 6
      scale = 1 + Math.sin(time * 1.5 + index * 0.7) * 0.015
    } else {
      // Bubble pops
      const popPhase = exitProgress
      bubbleScale = popPhase < 0.3 ? 1 + popPhase * 0.4 : Math.max(0, 1 - (popPhase - 0.3) * 2)
      opacity = 1 - exitProgress
      scale = 1 + exitProgress * 0.15
    }

    const minDim = Math.min(width ?? 400, height ?? 400)
    const bubbleSize = minDim * 0.55

    return (
      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: `translate(-50%, calc(-50% + ${translateY}px))`,
        }}
      >
        {/* Main bubble */}
        <div
          style={{
            width: bubbleSize,
            height: bubbleSize,
            borderRadius: '50%',
            transform: `scale(${bubbleScale})`,
            position: 'relative',
            background: `radial-gradient(circle at 35% 30%,
              rgba(255,255,255,0.18) 0%,
              rgba(200,180,255,0.1) 25%,
              rgba(100,200,255,0.08) 50%,
              rgba(255,180,200,0.06) 70%,
              transparent 85%)`,
            border: '1.5px solid rgba(255,255,255,0.2)',
            boxShadow: `
              inset -8px -8px ${bubbleSize * 0.15}px rgba(200,180,255,0.08),
              inset 4px 4px ${bubbleSize * 0.1}px rgba(255,255,255,0.1),
              0 0 30px rgba(150,180,255,0.1)`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {/* Iridescent highlight streak */}
          <div
            style={{
              position: 'absolute',
              top: '15%',
              left: '20%',
              width: '30%',
              height: '8%',
              borderRadius: '50%',
              background: 'rgba(255,255,255,0.25)',
              transform: 'rotate(-20deg)',
              filter: 'blur(2px)',
            }}
          />
          {/* Rainbow shimmer arc */}
          <div
            style={{
              position: 'absolute',
              top: '10%',
              right: '25%',
              width: '20%',
              height: '25%',
              borderRadius: '50%',
              background: `linear-gradient(135deg,
                rgba(255,100,150,0.12),
                rgba(100,255,200,0.12),
                rgba(100,150,255,0.12))`,
              filter: 'blur(6px)',
              transform: `rotate(${time * 20}deg)`,
            }}
          />

          {/* Text inside bubble */}
          <div
            style={{
              opacity,
              transform: `scale(${scale})`,
              fontFamily: "'Inter', 'Helvetica Neue', sans-serif",
              fontSize: 'clamp(28px, 8vw, 100px)',
              fontWeight: 800,
              color,
              textShadow: `0 0 20px ${color}40, 0 0 40px ${color}20`,
              whiteSpace: 'nowrap',
              letterSpacing: 2,
              textAlign: 'center',
            }}
          >
            {word}
          </div>
        </div>
      </div>
    )
  },
}

function SoapBubbleComponent(props: MotionGraphicProps<SoapBubbleConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-soap-bubble',
  title: 'Kinetic Soap Bubble',
  description: 'Text floats inside an iridescent soap bubble with rainbow shimmer, gentle float, and pop exit animation',
  tags: ['kinetic', 'typography', 'bubble', 'iridescent', 'float', 'dreamy', 'whimsical'],
  category: 'captions',
  component: SoapBubbleComponent as any,
  defaultConfig: {
    words: ['DREAM', 'FLOAT', 'SHINE', 'POP'],
    colors: ['#E8D5FF', '#D5F0FF', '#FFE0F0', '#D5FFE8'],
    bgColor: '#0A1628',
    cycleDuration: 1.5,
  },
  configSchema: [
    { key: 'words', label: 'Words', type: 'text-array', defaultValue: ['DREAM', 'FLOAT', 'SHINE', 'POP'], group: 'Content' },
    { key: 'colors', label: 'Colors', type: 'text-array', defaultValue: ['#E8D5FF', '#D5F0FF', '#FFE0F0', '#D5FFE8'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#0A1628', group: 'Style' },
    { key: 'cycleDuration', label: 'Cycle Duration (s)', type: 'number', defaultValue: 1.5, min: 0.3, max: 5, group: 'Timing' },
  ],
})
