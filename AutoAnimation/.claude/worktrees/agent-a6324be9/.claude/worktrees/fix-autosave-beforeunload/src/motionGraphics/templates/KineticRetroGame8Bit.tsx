import { registerMotionGraphic } from '../registry'
import { KineticBase, type KineticBaseConfig, type KineticAnimation, type WordRenderProps, type BackgroundRenderProps } from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface RetroGame8BitConfig extends KineticBaseConfig {}

const animation: KineticAnimation = {
  renderBackground: ({ bgColor, frame, fps }: BackgroundRenderProps) => {
    const time = frame / fps

    return (
      <div style={{ position: 'absolute', inset: 0, background: bgColor }}>
        {/* CRT scan lines */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.2) 2px, rgba(0,0,0,0.2) 4px)',
            pointerEvents: 'none',
          }}
        />
        {/* Pixel grid pattern */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            backgroundImage: [
              'linear-gradient(90deg, rgba(0,0,0,0.06) 1px, transparent 1px)',
              'linear-gradient(0deg, rgba(0,0,0,0.06) 1px, transparent 1px)',
            ].join(', '),
            backgroundSize: '8px 8px',
            pointerEvents: 'none',
          }}
        />
        {/* Screen curvature vignette */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: 'radial-gradient(ellipse at center, transparent 60%, rgba(0,0,0,0.4) 100%)',
            pointerEvents: 'none',
          }}
        />
        {/* Decorative pixel border blocks */}
        {Array.from({ length: 6 }, (_, i) => {
          const x = 10 + i * 16
          const visible = ((time * 2 + i) % 4) < 2
          return visible ? (
            <div
              key={`top-${i}`}
              style={{
                position: 'absolute',
                left: `${x}%`,
                top: 8,
                width: 8,
                height: 8,
                background: `hsl(${i * 60}, 80%, 50%)`,
                imageRendering: 'pixelated' as any,
                opacity: 0.3,
              }}
            />
          ) : null
        })}
      </div>
    )
  },

  renderWord: ({ word, color, enterProgress, exitProgress, phase, index, frame }: WordRenderProps) => {
    const f = frame ?? 0
    let opacity = 0
    let scale = 1
    let translateY = 0

    if (phase === 'enter') {
      // Pixel-by-pixel reveal using step function for scale
      const steps = 8
      const stepped = Math.floor(enterProgress * steps) / steps
      opacity = enterProgress > 0.1 ? 1 : enterProgress / 0.1
      scale = 0.25 + stepped * 0.75
    } else if (phase === 'hold') {
      opacity = 1
      // 8-bit bounce (stepped movement)
      const bounceSteps = 4
      const bouncePhase = (f * 0.08) % (Math.PI * 2)
      translateY = Math.round(Math.sin(bouncePhase) * 3 * bounceSteps) / bounceSteps
    } else {
      // Step-down exit
      const steps = 6
      const stepped = Math.floor(exitProgress * steps) / steps
      opacity = 1 - stepped
      scale = 1 - stepped * 0.6
    }

    return (
      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: `translate(-50%, -50%) translateY(${translateY}px) scale(${scale})`,
          opacity,
          imageRendering: 'pixelated' as any,
          fontFamily: "'Courier New', 'Lucida Console', monospace",
          fontSize: 'clamp(40px, 12vw, 160px)',
          fontWeight: 700,
          textTransform: 'uppercase',
          letterSpacing: 6,
          color,
          textShadow: `0 0 6px ${color}, 0 2px 0 rgba(0,0,0,0.5)`,
          whiteSpace: 'nowrap',
          // Slight stepped rendering feel
          WebkitFontSmoothing: 'none' as any,
        }}
      >
        {/* Pixel shadow beneath */}
        <div
          style={{
            position: 'absolute',
            top: 4,
            left: 4,
            color: 'rgba(0,0,0,0.3)',
            zIndex: -1,
          }}
        >
          {word}
        </div>
        {word}
      </div>
    )
  },
}

function RetroGame8BitComponent(props: MotionGraphicProps<RetroGame8BitConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-retro-game-8bit',
  title: 'Kinetic Retro Game 8-Bit',
  description: '8-bit pixel art style with pixelated font, stepped animations, CRT scan lines, and chiptune aesthetic',
  tags: ['kinetic', 'typography', 'retro', '8-bit', 'pixel', 'game', 'chiptune', 'aesthetic'],
  category: 'captions',
  component: RetroGame8BitComponent as any,
  defaultConfig: {
    words: ['START', 'LEVEL', 'BONUS', 'WIN'],
    colors: ['#00FF00', '#FFD700', '#FF4500', '#00FFFF'],
    bgColor: '#1a1a2e',
    cycleDuration: 1.2,
  },
  configSchema: [
    { key: 'words', label: 'Words', type: 'text-array', defaultValue: ['START', 'LEVEL', 'BONUS', 'WIN'], group: 'Content' },
    { key: 'colors', label: 'Colors', type: 'text-array', defaultValue: ['#00FF00', '#FFD700', '#FF4500', '#00FFFF'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#1a1a2e', group: 'Style' },
    { key: 'cycleDuration', label: 'Cycle Duration (s)', type: 'number', defaultValue: 1.2, min: 0.3, max: 5, group: 'Timing' },
  ],
})
