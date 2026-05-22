import { registerMotionGraphic } from '../registry'
import {
  KineticBase,
  type KineticBaseConfig,
  type KineticAnimation,
  type WordRenderProps,
  type BackgroundRenderProps,
} from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface SlowMotionConfig extends KineticBaseConfig {
  trailLength: number
}

function easeOutExpo(t: number): number {
  return t === 1 ? 1 : 1 - Math.pow(2, -10 * t)
}

function easeInExpo(t: number): number {
  return t === 0 ? 0 : Math.pow(2, 10 * t - 10)
}

const animation: KineticAnimation = {
  renderBackground: ({ bgColor, frame, fps }: BackgroundRenderProps) => {
    const time = frame / fps
    // Slow-motion: subtle lens distortion ring at center, very gradual
    const ringScale = 0.3 + (time * 0.05) % 0.7
    return (
      <div style={{ position: 'absolute', inset: 0, background: bgColor }}>
        {/* Dreamy vignette */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: 'radial-gradient(ellipse at center, transparent 40%, rgba(0,0,0,0.55) 100%)',
            pointerEvents: 'none',
          }}
        />
        {/* Slow pulse ring */}
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            width: `${ringScale * 200}%`,
            height: `${ringScale * 200}%`,
            transform: 'translate(-50%, -50%)',
            border: '1px solid rgba(255,255,255,0.04)',
            borderRadius: '50%',
            pointerEvents: 'none',
          }}
        />
      </div>
    )
  },

  renderWord: ({ word, color, enterProgress, exitProgress, phase, index }: WordRenderProps) => {
    // Slow motion: exaggerated ease-out — starts very fast, decelerates to a glacial stop
    // The feel is a high-speed camera capture played back slowly

    const trailCount = 5

    let translateY = 0
    let opacity = 1
    let scale = 1
    let letterSpacing = 2

    if (phase === 'enter') {
      // Drops from above with extreme exponential deceleration
      const eased = easeOutExpo(enterProgress)
      translateY = (1 - eased) * -80
      // Scale expands as it decelerates — like a zoom-in during slow-mo
      scale = 0.7 + eased * 0.3
      opacity = Math.min(1, enterProgress * 1.5)
      // Letter spacing blooms open slowly
      letterSpacing = 2 + (1 - eased) * 20
    } else if (phase === 'hold') {
      translateY = 0
      scale = 1
      opacity = 1
      letterSpacing = 2
    } else {
      // Exit: floats upward very slowly with easeInExpo acceleration (reverse slow-mo)
      const eased = easeInExpo(exitProgress)
      translateY = -eased * 60
      opacity = 1 - eased * 0.9
      scale = 1 + eased * 0.1
      letterSpacing = 2 + eased * 10
    }

    // Motion trail: ghost layers behind the entering text
    const showTrail = phase === 'enter' && enterProgress < 0.7
    const trailOpacityBase = showTrail ? (1 - enterProgress / 0.7) * 0.35 : 0

    return (
      <div style={{ position: 'absolute', inset: 0 }}>
        {/* Motion trail layers — each slightly behind in time */}
        {showTrail && Array.from({ length: trailCount }, (_, ti) => {
          const trailDelay = (ti + 1) * 0.08
          const trailProgress = Math.max(0, enterProgress - trailDelay)
          const trailEased = easeOutExpo(trailProgress)
          const trailY = (1 - trailEased) * -80
          const trailOpacity = trailOpacityBase * (1 - ti / trailCount)
          return (
            <div
              key={ti}
              style={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: `translate(-50%, calc(-50% + ${trailY}px)) scale(${0.7 + trailEased * 0.3})`,
                opacity: trailOpacity,
                fontFamily: "'Georgia', 'Times New Roman', serif",
                fontSize: 'clamp(38px, 11vw, 144px)',
                fontWeight: 700,
                fontStyle: 'italic',
                color,
                whiteSpace: 'nowrap',
                letterSpacing: 2 + (1 - trailEased) * 20,
                filter: `blur(${(ti + 1) * 1.5}px)`,
                pointerEvents: 'none',
              }}
            >
              {word}
            </div>
          )
        })}
        {/* Primary text */}
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: `translate(-50%, calc(-50% + ${translateY}px)) scale(${scale})`,
            opacity,
            fontFamily: "'Georgia', 'Times New Roman', serif",
            fontSize: 'clamp(38px, 11vw, 144px)',
            fontWeight: 700,
            fontStyle: 'italic',
            color,
            whiteSpace: 'nowrap',
            letterSpacing,
            textShadow: `0 0 40px ${color}30, 0 2px 8px rgba(0,0,0,0.6)`,
          }}
        >
          {word}
        </div>
      </div>
    )
  },
}

function SlowMotionComponent(props: MotionGraphicProps<SlowMotionConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-slow-motion',
  title: 'Kinetic Slow Motion',
  description: 'Text enters with exaggerated slow-motion easing — fast arrival that decelerates to a glacial stop, with motion trails and letter-spacing bloom',
  tags: ['kinetic', 'typography', 'slow-motion', 'film', 'dramatic', 'cinematic', 'elegant'],
  category: 'captions',
  component: SlowMotionComponent as any,
  defaultConfig: {
    words: ['SLOW', 'DRIFT', 'GLIDE', 'EASE'],
    colors: ['#F0E8D0', '#D4C5A9', '#F0E8D0', '#E8D5B0'],
    bgColor: '#0a0a12',
    cycleDuration: 2.0,
    trailLength: 5,
  },
  configSchema: [
    { key: 'words', label: 'Words', type: 'text-array', defaultValue: ['SLOW', 'DRIFT', 'GLIDE', 'EASE'], group: 'Content' },
    { key: 'colors', label: 'Colors', type: 'text-array', defaultValue: ['#F0E8D0', '#D4C5A9', '#F0E8D0', '#E8D5B0'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#0a0a12', group: 'Style' },
    { key: 'cycleDuration', label: 'Cycle Duration (s)', type: 'number', defaultValue: 2.0, min: 0.8, max: 6, group: 'Timing' },
    { key: 'trailLength', label: 'Trail Length', type: 'number', defaultValue: 5, min: 0, max: 10, group: 'Animation' },
  ],
})
