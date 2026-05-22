import { registerMotionGraphic } from '../registry'
import { KineticBase, type KineticBaseConfig, type KineticAnimation, type WordRenderProps, type BackgroundRenderProps } from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface MysticTextConfig extends KineticBaseConfig {}

// Deterministic star positions
const STARS = Array.from({ length: 40 }).map((_, i) => ({
  x: ((i * 37 + 13) % 100),
  y: ((i * 53 + 7) % 100),
  size: 1 + (i % 3),
  phase: i * 1.7,
}))

const animation: KineticAnimation = {
  renderBackground: ({ bgColor, frame, fps }: BackgroundRenderProps) => {
    const time = frame / fps
    return (
      <div style={{ position: 'absolute', inset: 0, background: `radial-gradient(ellipse at 50% 50%, #1a1040 0%, ${bgColor} 100%)` }}>
        {/* Starfield */}
        {STARS.map((star, i) => {
          const twinkle = 0.2 + Math.sin(time * 2 + star.phase) * 0.3 + 0.3
          return (
            <div
              key={i}
              style={{
                position: 'absolute',
                left: `${star.x}%`,
                top: `${star.y}%`,
                width: star.size,
                height: star.size,
                borderRadius: '50%',
                background: '#fff',
                opacity: twinkle,
                boxShadow: twinkle > 0.4 ? `0 0 ${star.size * 2}px rgba(200,180,255,${twinkle * 0.5})` : undefined,
              }}
            />
          )
        })}
      </div>
    )
  },

  renderWord: ({ word, color, enterProgress, exitProgress, phase, holdProgress }: WordRenderProps) => {
    let opacity = 0
    let scale = 1
    let blur = 0
    let glowIntensity = 0

    if (phase === 'enter') {
      // Text materializes with shimmer
      opacity = Math.min(1, enterProgress * 1.8)
      scale = 0.8 + enterProgress * 0.2
      blur = (1 - enterProgress) * 6
      glowIntensity = enterProgress * 15
    } else if (phase === 'hold') {
      opacity = 1
      scale = 1
      // Ethereal glow pulses
      glowIntensity = 15 + Math.sin(holdProgress * Math.PI * 4) * 8
    } else {
      opacity = 1 - exitProgress
      scale = 1 + exitProgress * 0.15
      blur = exitProgress * 4
      glowIntensity = 15 * (1 - exitProgress)
    }

    const goldGlow = `0 0 ${glowIntensity}px rgba(212,168,67,0.6), 0 0 ${glowIntensity * 2}px rgba(212,168,67,0.3)`
    const purpleGlow = `0 0 ${glowIntensity * 0.8}px rgba(139,92,246,0.3)`

    return (
      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: `translate(-50%, -50%) scale(${scale})`,
          opacity,
          filter: blur > 0 ? `blur(${blur}px)` : undefined,
          fontFamily: "'Georgia', 'Times New Roman', serif",
          fontSize: 'clamp(40px, 11vw, 140px)',
          fontWeight: 700,
          fontStyle: 'italic',
          letterSpacing: '0.05em',
          color,
          textShadow: `${goldGlow}, ${purpleGlow}`,
          whiteSpace: 'nowrap',
        }}
      >
        {word}
      </div>
    )
  },
}

function MysticTextComponent(props: MotionGraphicProps<MysticTextConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-mystic-text',
  title: 'Kinetic Mystic Text',
  description: 'Mystical text with twinkling starfield background and ethereal gold/purple glow shimmer effect',
  tags: ['kinetic', 'typography', 'mystic', 'stars', 'ethereal', 'cosmic', 'astrology'],
  category: 'captions',
  component: MysticTextComponent as any,
  defaultConfig: {
    words: ['DESTINY', 'STARS', 'ALIGN', 'MAGIC'],
    colors: ['#d4a843', '#c9a96e', '#e8d5a3', '#d4a843'],
    bgColor: '#0a0818',
    cycleDuration: 1,
  },
  configSchema: [
    { key: 'words', label: 'Words', type: 'text-array', defaultValue: ['DESTINY', 'STARS', 'ALIGN', 'MAGIC'], group: 'Content' },
    { key: 'colors', label: 'Colors', type: 'text-array', defaultValue: ['#d4a843', '#c9a96e', '#e8d5a3', '#d4a843'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#0a0818', group: 'Style' },
    { key: 'cycleDuration', label: 'Cycle Duration (s)', type: 'number', defaultValue: 1, min: 0.3, max: 5, group: 'Timing' },
  ],
})
