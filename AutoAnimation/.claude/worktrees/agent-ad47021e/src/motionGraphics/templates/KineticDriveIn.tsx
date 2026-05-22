import { registerMotionGraphic } from '../registry'
import { KineticBase, type KineticBaseConfig, type KineticAnimation, type WordRenderProps, type BackgroundRenderProps } from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface DriveInConfig extends KineticBaseConfig {
  starburstCount: number
}

const animation: KineticAnimation = {
  renderBackground: ({ bgColor, frame, fps, width, height }: BackgroundRenderProps) => {
    const time = frame / fps
    // Rotating starburst rays
    const rotation = time * 8

    return (
      <div style={{ position: 'absolute', inset: 0, background: bgColor }}>
        {/* Rotating starburst rays */}
        <div
          style={{
            position: 'absolute',
            left: '50%',
            top: '50%',
            width: Math.max(width, height) * 2,
            height: Math.max(width, height) * 2,
            transform: `translate(-50%, -50%) rotate(${rotation}deg)`,
            background: `conic-gradient(
              from 0deg,
              rgba(255,200,50,0.08) 0deg,
              transparent 10deg,
              transparent 20deg,
              rgba(255,200,50,0.08) 20deg,
              transparent 30deg,
              transparent 40deg,
              rgba(255,200,50,0.08) 40deg,
              transparent 50deg,
              transparent 60deg,
              rgba(255,200,50,0.08) 60deg,
              transparent 70deg,
              transparent 80deg,
              rgba(255,200,50,0.08) 80deg,
              transparent 90deg
            )`,
            pointerEvents: 'none',
          }}
        />
        {/* Concession stand warm glow */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: 'radial-gradient(ellipse 60% 50% at 50% 55%, rgba(255,180,60,0.06) 0%, transparent 70%)',
            pointerEvents: 'none',
          }}
        />
        {/* Dotted border like a ticket stub */}
        <div
          style={{
            position: 'absolute',
            top: '8%',
            left: '8%',
            right: '8%',
            bottom: '8%',
            border: '3px dashed rgba(255,200,80,0.3)',
            borderRadius: 12,
            pointerEvents: 'none',
          }}
        />
        {/* Corner star decorations */}
        {[0, 1, 2, 3].map(i => {
          const isTop = i < 2
          const isLeft = i % 2 === 0
          const starPulse = 0.8 + Math.sin(time * 3 + i * 1.5) * 0.2
          return (
            <div
              key={i}
              style={{
                position: 'absolute',
                [isTop ? 'top' : 'bottom']: '4%',
                [isLeft ? 'left' : 'right']: '4%',
                width: 20,
                height: 20,
                transform: `scale(${starPulse}) rotate(${time * 30 + i * 90}deg)`,
                opacity: 0.6,
              }}
            >
              <div
                style={{
                  position: 'absolute',
                  inset: 0,
                  background: '#FFD700',
                  clipPath: 'polygon(50% 0%, 61% 35%, 98% 35%, 68% 57%, 79% 91%, 50% 70%, 21% 91%, 32% 57%, 2% 35%, 39% 35%)',
                }}
              />
            </div>
          )
        })}
        {/* Subtle horizontal stripe pattern */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 6px, rgba(255,200,80,0.02) 6px, rgba(255,200,80,0.02) 7px)',
            pointerEvents: 'none',
          }}
        />
      </div>
    )
  },

  renderWord: ({ word, color, enterProgress, exitProgress, phase, holdProgress, index, frame }: WordRenderProps) => {
    const f = frame ?? 0
    let opacity = 0
    let scale = 1
    let rotate = 0

    if (phase === 'enter') {
      // Pop in with overshoot — like a drive-in marquee bulb lighting up
      const t = enterProgress
      const overshoot = t < 0.7 ? t / 0.7 : 1 + Math.sin((t - 0.7) / 0.3 * Math.PI) * 0.08
      opacity = Math.min(1, t * 3)
      scale = 0.3 + overshoot * 0.7
      rotate = (1 - enterProgress) * -5
    } else if (phase === 'hold') {
      opacity = 1
      // Gentle pulsing like neon signage
      scale = 1 + Math.sin(f * 0.1) * 0.015
      rotate = Math.sin(f * 0.05) * 0.5
    } else {
      // Shrink away with slight spin
      opacity = 1 - Math.pow(exitProgress, 1.5)
      scale = 1 - exitProgress * 0.4
      rotate = exitProgress * 8
    }

    return (
      <>
        {/* Outer glow halo */}
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: `translate(-50%, -50%) scale(${scale}) rotate(${rotate}deg)`,
            opacity: opacity * 0.3,
            fontFamily: "'Impact', 'Arial Black', sans-serif",
            fontSize: 'clamp(44px, 12vw, 160px)',
            fontWeight: 900,
            textTransform: 'uppercase',
            letterSpacing: 4,
            color: 'transparent',
            WebkitTextStroke: `3px ${color}`,
            filter: 'blur(8px)',
            whiteSpace: 'nowrap',
          }}
        >
          {word}
        </div>
        {/* Main text with retro shadow */}
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: `translate(-50%, -50%) scale(${scale}) rotate(${rotate}deg)`,
            opacity,
            fontFamily: "'Impact', 'Arial Black', sans-serif",
            fontSize: 'clamp(44px, 12vw, 160px)',
            fontWeight: 900,
            textTransform: 'uppercase',
            letterSpacing: 4,
            color,
            textShadow: `3px 3px 0 rgba(0,0,0,0.5), -1px -1px 0 rgba(255,255,200,0.2)`,
            whiteSpace: 'nowrap',
          }}
        >
          {word}
        </div>
      </>
    )
  },
}

function DriveInComponent(props: MotionGraphicProps<DriveInConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-drive-in',
  title: 'Kinetic Drive-In',
  description: '1950s drive-in movie intermission style with rotating starbursts, retro marquee entrance, ticket-stub border, and warm glow',
  tags: ['kinetic', 'typography', 'drive-in', '1950s', 'retro', 'cinema', 'marquee', 'intermission'],
  category: 'captions',
  component: DriveInComponent as any,
  defaultConfig: {
    words: ['SNACKS', 'POPCORN', 'ENJOY', 'SHOWTIME'],
    colors: ['#FFD700', '#FF6347', '#FFD700', '#FF6347'],
    bgColor: '#1a0a2e',
    cycleDuration: 1.2,
    starburstCount: 8,
  },
  configSchema: [
    { key: 'words', label: 'Words', type: 'text-array', defaultValue: ['SNACKS', 'POPCORN', 'ENJOY', 'SHOWTIME'], group: 'Content' },
    { key: 'colors', label: 'Colors', type: 'text-array', defaultValue: ['#FFD700', '#FF6347', '#FFD700', '#FF6347'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#1a0a2e', group: 'Style' },
    { key: 'cycleDuration', label: 'Cycle Duration (s)', type: 'number', defaultValue: 1.2, min: 0.3, max: 5, group: 'Timing' },
    { key: 'starburstCount', label: 'Starburst Count', type: 'number', defaultValue: 8, min: 4, max: 16, group: 'Animation' },
  ],
})
