import { registerMotionGraphic } from '../registry'
import { KineticBase, type KineticBaseConfig, type KineticAnimation, type WordRenderProps, type BackgroundRenderProps } from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface ArcadeInsertCoinConfig extends KineticBaseConfig {
  blinkSpeed: number
}

const animation: KineticAnimation = {
  renderBackground: ({ bgColor, width, height, frame, fps }: BackgroundRenderProps) => {
    const time = frame / fps

    return (
      <div style={{ position: 'absolute', inset: 0, background: bgColor }}>
        {/* CRT scan lines */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 1px, rgba(0,255,0,0.03) 1px, rgba(0,255,0,0.03) 2px)',
            pointerEvents: 'none',
          }}
        />
        {/* Phosphor glow grid */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            backgroundImage: [
              'linear-gradient(90deg, rgba(0,255,0,0.04) 1px, transparent 1px)',
              'linear-gradient(0deg, rgba(0,255,0,0.04) 1px, transparent 1px)',
            ].join(', '),
            backgroundSize: '4px 4px',
            pointerEvents: 'none',
          }}
        />
        {/* Scrolling starfield */}
        {Array.from({ length: 20 }, (_, i) => {
          const starX = ((i * 37 + 13) % 100)
          const starY = ((i * 53 + time * (10 + (i % 5) * 8)) % 110) - 5
          const starSize = (i % 3) + 1
          return (
            <div
              key={`star-${i}`}
              style={{
                position: 'absolute',
                left: `${starX}%`,
                top: `${starY}%`,
                width: starSize,
                height: starSize,
                background: i % 4 === 0 ? '#FFD700' : '#FFFFFF',
                imageRendering: 'pixelated' as any,
                opacity: 0.4 + (i % 3) * 0.2,
              }}
            />
          )
        })}
        {/* Arcade cabinet border */}
        <div
          style={{
            position: 'absolute',
            inset: 12,
            border: '3px solid rgba(0,255,0,0.15)',
            borderRadius: 2,
            pointerEvents: 'none',
          }}
        />
        {/* Corner decorations */}
        {[0, 1, 2, 3].map((corner) => {
          const isLeft = corner % 2 === 0
          const isTop = corner < 2
          return (
            <div
              key={`corner-${corner}`}
              style={{
                position: 'absolute',
                [isTop ? 'top' : 'bottom']: 16,
                [isLeft ? 'left' : 'right']: 16,
                width: 12,
                height: 12,
                borderTop: isTop ? '3px solid rgba(255,215,0,0.4)' : 'none',
                borderBottom: !isTop ? '3px solid rgba(255,215,0,0.4)' : 'none',
                borderLeft: isLeft ? '3px solid rgba(255,215,0,0.4)' : 'none',
                borderRight: !isLeft ? '3px solid rgba(255,215,0,0.4)' : 'none',
              }}
            />
          )
        })}
        {/* Coin slot indicator */}
        <div
          style={{
            position: 'absolute',
            bottom: '8%',
            left: '50%',
            transform: 'translateX(-50%)',
            width: 40,
            height: 6,
            background: Math.floor(time * 3) % 2 === 0 ? '#FFD700' : 'rgba(255,215,0,0.2)',
            borderRadius: 1,
            imageRendering: 'pixelated' as any,
          }}
        />
        {/* Screen curvature vignette */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: 'radial-gradient(ellipse at center, transparent 50%, rgba(0,0,0,0.6) 100%)',
            pointerEvents: 'none',
          }}
        />
      </div>
    )
  },

  renderWord: ({ word, color, enterProgress, holdProgress, exitProgress, phase, frame }: WordRenderProps) => {
    const f = frame ?? 0
    let opacity = 0
    let scale = 1
    let translateY = 0

    if (phase === 'enter') {
      // Flicker in like a CRT turning on
      const flickerCount = 6
      const flickerPhase = Math.floor(enterProgress * flickerCount)
      opacity = flickerPhase % 2 === 0 ? enterProgress : enterProgress * 0.6
      scale = 0.8 + enterProgress * 0.2
    } else if (phase === 'hold') {
      // Classic arcade blink
      const blinkCycle = Math.floor(f * 0.06) % 4
      opacity = blinkCycle < 3 ? 1 : 0.15
      // Subtle float
      translateY = Math.sin(f * 0.04) * 3
    } else {
      // Dissolve out in pixel steps
      const steps = 8
      const stepped = Math.floor(exitProgress * steps) / steps
      opacity = 1 - stepped
      scale = 1 + stepped * 0.1
    }

    return (
      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: `translate(-50%, -50%) translateY(${translateY}px) scale(${scale})`,
          opacity,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 12,
        }}
      >
        {/* Main text */}
        <div
          style={{
            fontFamily: "'Courier New', 'Lucida Console', monospace",
            fontSize: 'clamp(32px, 10vw, 140px)',
            fontWeight: 700,
            textTransform: 'uppercase',
            letterSpacing: 8,
            color,
            textShadow: `0 0 20px ${color}, 0 0 40px ${color}80, 0 4px 0 rgba(0,0,0,0.5)`,
            whiteSpace: 'nowrap',
            WebkitFontSmoothing: 'none' as any,
            imageRendering: 'pixelated' as any,
          }}
        >
          {word}
        </div>
        {/* Blinking arrow indicator */}
        <div
          style={{
            fontSize: 'clamp(14px, 3vw, 28px)',
            fontFamily: "'Courier New', monospace",
            color: '#FFD700',
            opacity: Math.floor(f * 0.05) % 2 === 0 ? 0.8 : 0.2,
            letterSpacing: 6,
          }}
        >
          {'▼ ▼ ▼'}
        </div>
      </div>
    )
  },
}

function KineticArcadeInsertCoinComponent(props: MotionGraphicProps<ArcadeInsertCoinConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-arcade-insert-coin',
  title: 'Kinetic Arcade Insert Coin',
  description: 'Classic "INSERT COIN" blinking arcade text with CRT scan lines, phosphor glow, and retro coin slot indicator',
  tags: ['kinetic', 'typography', 'arcade', 'retro', 'insert-coin', 'gaming', 'pixel', 'CRT'],
  category: 'captions',
  component: KineticArcadeInsertCoinComponent as any,
  defaultConfig: {
    words: ['INSERT COIN', 'PRESS START', 'PLAYER 1', 'READY?'],
    colors: ['#00FF00', '#FFD700', '#00FFFF', '#FF4444'],
    bgColor: '#0a0a0a',
    cycleDuration: 1.4,
    blinkSpeed: 3,
  },
  configSchema: [
    { key: 'words', label: 'Words', type: 'text-array', defaultValue: ['INSERT COIN', 'PRESS START', 'PLAYER 1', 'READY?'], group: 'Content' },
    { key: 'colors', label: 'Colors', type: 'text-array', defaultValue: ['#00FF00', '#FFD700', '#00FFFF', '#FF4444'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#0a0a0a', group: 'Style' },
    { key: 'cycleDuration', label: 'Cycle Duration (s)', type: 'number', defaultValue: 1.4, min: 0.3, max: 5, group: 'Timing' },
    { key: 'blinkSpeed', label: 'Blink Speed', type: 'number', defaultValue: 3, min: 1, max: 10, group: 'Timing' },
  ],
})
