import { registerMotionGraphic } from '../registry'
import { KineticBase, type KineticBaseConfig, type KineticAnimation, type WordRenderProps, type BackgroundRenderProps } from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface GameOverFlickerConfig extends KineticBaseConfig {
  flickerIntensity: number
}

const animation: KineticAnimation = {
  renderBackground: ({ bgColor, frame, fps }: BackgroundRenderProps) => {
    const time = frame / fps
    // CRT screen off effect - subtle red tint flicker
    const redFlash = Math.sin(time * 8) > 0.9 ? 0.05 : 0

    return (
      <div style={{ position: 'absolute', inset: 0, background: bgColor }}>
        {/* Horizontal scan lines */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(255,0,0,0.04) 2px, rgba(255,0,0,0.04) 4px)',
            pointerEvents: 'none',
          }}
        />
        {/* Moving scan bar */}
        <div
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            top: `${((time * 60) % 110) - 5}%`,
            height: 4,
            background: 'linear-gradient(180deg, transparent, rgba(255,0,0,0.08), transparent)',
            pointerEvents: 'none',
          }}
        />
        {/* Red flash overlay */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: `rgba(255,0,0,${redFlash})`,
            pointerEvents: 'none',
          }}
        />
        {/* Static noise dots */}
        {Array.from({ length: 15 }, (_, i) => {
          const visible = Math.sin(time * 20 + i * 7) > 0.7
          if (!visible) return null
          const nx = (i * 41 + Math.floor(time * 5) * 17) % 100
          const ny = (i * 59 + Math.floor(time * 7) * 23) % 100
          return (
            <div
              key={`noise-${i}`}
              style={{
                position: 'absolute',
                left: `${nx}%`,
                top: `${ny}%`,
                width: 2,
                height: 2,
                background: 'rgba(255,255,255,0.1)',
                imageRendering: 'pixelated' as any,
              }}
            />
          )
        })}
        {/* Cross hatch overlay for dark feel */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            backgroundImage: [
              'linear-gradient(45deg, rgba(0,0,0,0.02) 25%, transparent 25%)',
              'linear-gradient(-45deg, rgba(0,0,0,0.02) 25%, transparent 25%)',
            ].join(', '),
            backgroundSize: '8px 8px',
            pointerEvents: 'none',
          }}
        />
        {/* Heavy vignette */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: 'radial-gradient(ellipse at center, transparent 40%, rgba(0,0,0,0.7) 100%)',
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
    let glitchX = 0
    let glitchY = 0
    let skewX = 0

    if (phase === 'enter') {
      // Heavy flicker/static entrance
      const flickerSteps = 10
      const step = Math.floor(enterProgress * flickerSteps)
      opacity = step % 2 === 0 ? enterProgress * 0.8 : enterProgress
      scale = 0.9 + Math.floor(enterProgress * 4) / 4 * 0.1
      glitchX = (1 - enterProgress) * (Math.sin(f * 0.5) * 15)
      skewX = (1 - enterProgress) * 5
    } else if (phase === 'hold') {
      opacity = 1
      // Periodic heavy flicker
      const flickerCycle = f % 60
      if (flickerCycle > 45 && flickerCycle < 50) {
        opacity = 0.1
      } else if (flickerCycle > 50 && flickerCycle < 52) {
        opacity = 0.6
        glitchX = 4
      }
      // RGB split jitter
      glitchY = Math.sin(f * 0.08) * 1.5
    } else {
      // Flicker off like CRT shutdown
      const offSteps = 12
      const step = Math.floor(exitProgress * offSteps)
      opacity = step % 3 === 0 ? 0 : (1 - exitProgress)
      scale = 1 - exitProgress * 0.3
      // Horizontal collapse
      const scaleX = 1 + exitProgress * 2
      const scaleY = Math.max(0.02, 1 - exitProgress)
      return (
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: `translate(-50%, -50%) scaleX(${scaleX}) scaleY(${scaleY})`,
            opacity,
            fontFamily: "'Courier New', 'Lucida Console', monospace",
            fontSize: 'clamp(40px, 12vw, 160px)',
            fontWeight: 700,
            textTransform: 'uppercase',
            letterSpacing: 10,
            color,
            textShadow: `0 0 30px ${color}, 0 0 60px ${color}40`,
            whiteSpace: 'nowrap',
            WebkitFontSmoothing: 'none' as any,
          }}
        >
          {word}
        </div>
      )
    }

    return (
      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: `translate(-50%, -50%) translate(${glitchX}px, ${glitchY}px) scale(${scale}) skewX(${skewX}deg)`,
          opacity,
        }}
      >
        {/* Red channel offset */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: -2,
            fontFamily: "'Courier New', 'Lucida Console', monospace",
            fontSize: 'clamp(40px, 12vw, 160px)',
            fontWeight: 700,
            textTransform: 'uppercase',
            letterSpacing: 10,
            color: 'rgba(255,0,0,0.3)',
            whiteSpace: 'nowrap',
            WebkitFontSmoothing: 'none' as any,
          }}
        >
          {word}
        </div>
        {/* Blue channel offset */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 2,
            fontFamily: "'Courier New', 'Lucida Console', monospace",
            fontSize: 'clamp(40px, 12vw, 160px)',
            fontWeight: 700,
            textTransform: 'uppercase',
            letterSpacing: 10,
            color: 'rgba(0,100,255,0.3)',
            whiteSpace: 'nowrap',
            WebkitFontSmoothing: 'none' as any,
          }}
        >
          {word}
        </div>
        {/* Main text */}
        <div
          style={{
            position: 'relative',
            fontFamily: "'Courier New', 'Lucida Console', monospace",
            fontSize: 'clamp(40px, 12vw, 160px)',
            fontWeight: 700,
            textTransform: 'uppercase',
            letterSpacing: 10,
            color,
            textShadow: `0 0 20px ${color}, 0 0 40px ${color}60`,
            whiteSpace: 'nowrap',
            WebkitFontSmoothing: 'none' as any,
          }}
        >
          {word}
        </div>
      </div>
    )
  },
}

function KineticGameOverFlickerComponent(props: MotionGraphicProps<GameOverFlickerConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-game-over-flicker',
  title: 'Kinetic Game Over Flicker',
  description: 'Game over screen with heavy CRT flicker, RGB split glitch, static noise, and dramatic CRT shutdown exit animation',
  tags: ['kinetic', 'typography', 'game-over', 'retro', 'glitch', 'CRT', 'arcade', 'flicker'],
  category: 'captions',
  component: KineticGameOverFlickerComponent as any,
  defaultConfig: {
    words: ['GAME OVER', 'CONTINUE?', 'TRY AGAIN', 'NO LIVES'],
    colors: ['#FF0033', '#FF6600', '#FF0033', '#CC0000'],
    bgColor: '#050505',
    cycleDuration: 1.5,
    flickerIntensity: 5,
  },
  configSchema: [
    { key: 'words', label: 'Words', type: 'text-array', defaultValue: ['GAME OVER', 'CONTINUE?', 'TRY AGAIN', 'NO LIVES'], group: 'Content' },
    { key: 'colors', label: 'Colors', type: 'text-array', defaultValue: ['#FF0033', '#FF6600', '#FF0033', '#CC0000'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#050505', group: 'Style' },
    { key: 'cycleDuration', label: 'Cycle Duration (s)', type: 'number', defaultValue: 1.5, min: 0.3, max: 5, group: 'Timing' },
    { key: 'flickerIntensity', label: 'Flicker Intensity', type: 'number', defaultValue: 5, min: 1, max: 10, group: 'Style' },
  ],
})
