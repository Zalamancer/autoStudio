import { registerMotionGraphic } from '../registry'
import { KineticBase, type KineticBaseConfig, type KineticAnimation, type WordRenderProps, type BackgroundRenderProps } from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface SpaceInvaderConfig extends KineticBaseConfig {
  dropSpeed: number
}

function seededRandom(seed: number): number {
  const x = Math.sin(seed * 12.9898 + 78.233) * 43758.5453
  return x - Math.floor(x)
}

const animation: KineticAnimation = {
  renderBackground: ({ bgColor, frame, fps }: BackgroundRenderProps) => {
    const time = frame / fps

    // Simple pixel art invader shape (5x5 grid)
    const invaderPattern = [
      [0, 1, 0, 1, 0],
      [0, 0, 1, 0, 0],
      [0, 1, 1, 1, 0],
      [1, 0, 1, 0, 1],
      [1, 0, 0, 0, 1],
    ]

    return (
      <div style={{ position: 'absolute', inset: 0, background: bgColor }}>
        {/* Starfield */}
        {Array.from({ length: 30 }, (_, i) => {
          const sx = (i * 37 + 13) % 100
          const sy = ((i * 53 + time * (2 + i % 3)) % 110) - 5
          const size = i % 3 === 0 ? 2 : 1
          return (
            <div
              key={`star-${i}`}
              style={{
                position: 'absolute',
                left: `${sx}%`,
                top: `${sy}%`,
                width: size,
                height: size,
                background: '#FFFFFF',
                opacity: 0.3 + seededRandom(i) * 0.4,
                imageRendering: 'pixelated' as any,
              }}
            />
          )
        })}
        {/* Pixel invaders marching across top */}
        {Array.from({ length: 5 }, (_, invIdx) => {
          const invX = ((invIdx * 20 + 5 + Math.sin(time * 0.5) * 3) % 100)
          const invY = 8 + invIdx * 2
          const invColor = ['#00FF00', '#00FFFF', '#FFFF00', '#FF00FF', '#FF6600'][invIdx]
          const animFrame = Math.floor(time * 2) % 2
          return (
            <div
              key={`inv-${invIdx}`}
              style={{
                position: 'absolute',
                left: `${invX}%`,
                top: `${invY}%`,
                display: 'grid',
                gridTemplateColumns: 'repeat(5, 4px)',
                gridTemplateRows: 'repeat(5, 4px)',
                opacity: 0.25,
              }}
            >
              {invaderPattern.flat().map((cell, ci) => (
                <div
                  key={ci}
                  style={{
                    width: 4,
                    height: 4,
                    background: cell ? invColor : 'transparent',
                    opacity: animFrame === 0 || ci % 2 === 0 ? 1 : 0.5,
                    imageRendering: 'pixelated' as any,
                  }}
                />
              ))}
            </div>
          )
        })}
        {/* Shield blocks at bottom */}
        {[15, 40, 65, 85].map((shieldX, si) => (
          <div
            key={`shield-${si}`}
            style={{
              position: 'absolute',
              left: `${shieldX}%`,
              bottom: '10%',
              display: 'flex',
              gap: 0,
            }}
          >
            {[0, 1, 2, 1, 0].map((h, bi) => (
              <div
                key={bi}
                style={{
                  width: 6,
                  height: 8 + h * 4,
                  background: '#00FF00',
                  opacity: 0.15,
                  alignSelf: 'flex-end',
                  imageRendering: 'pixelated' as any,
                }}
              />
            ))}
          </div>
        ))}
        {/* Player ship at bottom */}
        <div
          style={{
            position: 'absolute',
            bottom: '5%',
            left: `${50 + Math.sin(time * 1.5) * 15}%`,
            transform: 'translateX(-50%)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            opacity: 0.3,
          }}
        >
          <div style={{ width: 4, height: 4, background: '#00FF00', imageRendering: 'pixelated' as any }} />
          <div style={{ width: 12, height: 4, background: '#00FF00', imageRendering: 'pixelated' as any }} />
          <div style={{ width: 20, height: 4, background: '#00FF00', imageRendering: 'pixelated' as any }} />
        </div>
      </div>
    )
  },

  renderWord: ({ word, color, enterProgress, holdProgress, exitProgress, phase, index, frame }: WordRenderProps) => {
    const f = frame ?? 0
    const chars = word.split('')

    if (phase === 'enter') {
      // Characters drop down in formation like space invaders
      return (
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            display: 'flex',
            gap: 'clamp(2px, 0.4vw, 5px)',
          }}
        >
          {chars.map((ch, ci) => {
            const row = Math.floor(ci / 5)
            const delay = row * 0.15 + (ci % 5) * 0.05
            const charProgress = Math.max(0, Math.min(1, (enterProgress - delay) / Math.max(0.01, 1 - delay)))
            const dropY = (1 - charProgress) * -150 - row * 30
            // Side-to-side march
            const marchX = Math.sin(enterProgress * Math.PI * 2) * 5 * (1 - charProgress)
            return (
              <div
                key={ci}
                style={{
                  fontFamily: "'Courier New', 'Lucida Console', monospace",
                  fontSize: 'clamp(32px, 10vw, 140px)',
                  fontWeight: 700,
                  color,
                  textTransform: 'uppercase',
                  transform: `translateY(${dropY}px) translateX(${marchX}px)`,
                  opacity: charProgress,
                  textShadow: `0 0 6px ${color}`,
                  WebkitFontSmoothing: 'none' as any,
                  imageRendering: 'pixelated' as any,
                }}
              >
                {ch}
              </div>
            )
          })}
        </div>
      )
    }

    if (phase === 'hold') {
      // Formation march left-right
      const marchX = Math.sin(f * 0.06) * 15
      const marchStep = Math.floor(f * 0.06 / (Math.PI * 2))
      const dropStep = marchStep * 2
      return (
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: `translate(-50%, -50%) translateX(${marchX}px) translateY(${dropStep % 10}px)`,
            fontFamily: "'Courier New', 'Lucida Console', monospace",
            fontSize: 'clamp(32px, 10vw, 140px)',
            fontWeight: 700,
            textTransform: 'uppercase',
            letterSpacing: 'clamp(2px, 0.4vw, 5px)',
            color,
            textShadow: `0 0 10px ${color}, 0 0 20px ${color}40`,
            whiteSpace: 'nowrap',
            WebkitFontSmoothing: 'none' as any,
          }}
        >
          {word}
        </div>
      )
    }

    // Exit: shot down - each letter falls with explosion
    return (
      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          display: 'flex',
          gap: 'clamp(2px, 0.4vw, 5px)',
        }}
      >
        {chars.map((ch, ci) => {
          const hitDelay = ci * 0.1
          const charExit = Math.max(0, Math.min(1, (exitProgress - hitDelay) / Math.max(0.01, 1 - hitDelay)))
          const fallY = charExit * charExit * 200
          const rot = charExit * (seededRandom(ci + index) - 0.5) * 180
          const drift = (seededRandom(ci + 50) - 0.5) * charExit * 60
          return (
            <div
              key={ci}
              style={{
                fontFamily: "'Courier New', 'Lucida Console', monospace",
                fontSize: 'clamp(32px, 10vw, 140px)',
                fontWeight: 700,
                color: charExit > 0.3 ? '#FF4400' : color,
                textTransform: 'uppercase',
                transform: `translateY(${fallY}px) translateX(${drift}px) rotate(${rot}deg)`,
                opacity: Math.max(0, 1 - charExit * 1.2),
                textShadow: charExit > 0 ? '0 0 15px #FF4400' : `0 0 6px ${color}`,
                WebkitFontSmoothing: 'none' as any,
              }}
            >
              {ch}
            </div>
          )
        })}
      </div>
    )
  },
}

function KineticSpaceInvaderComponent(props: MotionGraphicProps<SpaceInvaderConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-space-invader',
  title: 'Kinetic Space Invader',
  description: 'Text drops in space invader formation with marching animation, starfield, shield blocks, and explosion exit',
  tags: ['kinetic', 'typography', 'space-invaders', 'retro', 'arcade', 'alien', 'pixel', 'shooting'],
  category: 'captions',
  component: KineticSpaceInvaderComponent as any,
  defaultConfig: {
    words: ['ATTACK', 'WAVE 1', 'DEFEND', 'FIRE'],
    colors: ['#00FF00', '#00FFFF', '#FFFF00', '#FF00FF'],
    bgColor: '#000010',
    cycleDuration: 1.6,
    dropSpeed: 3,
  },
  configSchema: [
    { key: 'words', label: 'Words', type: 'text-array', defaultValue: ['ATTACK', 'WAVE 1', 'DEFEND', 'FIRE'], group: 'Content' },
    { key: 'colors', label: 'Colors', type: 'text-array', defaultValue: ['#00FF00', '#00FFFF', '#FFFF00', '#FF00FF'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#000010', group: 'Style' },
    { key: 'cycleDuration', label: 'Cycle Duration (s)', type: 'number', defaultValue: 1.6, min: 0.3, max: 5, group: 'Timing' },
    { key: 'dropSpeed', label: 'Drop Speed', type: 'number', defaultValue: 3, min: 1, max: 10, group: 'Timing' },
  ],
})
