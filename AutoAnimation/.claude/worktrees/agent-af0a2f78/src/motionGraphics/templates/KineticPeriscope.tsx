import { registerMotionGraphic } from '../registry'
import { KineticBase, type KineticBaseConfig, type KineticAnimation, type WordRenderProps, type BackgroundRenderProps } from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

// KineticPeriscope: Text rises from below through a rectangular viewport (overflow:hidden),
// overshoots and settles. The containment viewport IS the effect.
// Quality gates: overflow:hidden core, mixBlendMode, clamp(), custom easing (easeOutElastic),
// alive hold (periscope sway), concept-driven exit (text sinks back down), per-char, animated bg.
interface PeriscopeConfig extends KineticBaseConfig {}

function easeOutElastic(t: number): number {
  if (t === 0 || t === 1) return t
  const p = 0.4
  return Math.pow(2, -10 * t) * Math.sin((t - p / 4) * (2 * Math.PI) / p) + 1
}

function easeInBack(t: number): number {
  const c1 = 1.70158
  const c3 = c1 + 1
  return c3 * t * t * t - c1 * t * t
}

const animation: KineticAnimation = {
  renderBackground: ({ bgColor, frame, fps }: BackgroundRenderProps) => {
    const t = frame / fps
    // Deep ocean-like background with slow-moving caustic hints
    const drift = Math.sin(t * 0.8) * 3
    return (
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: `linear-gradient(180deg, ${bgColor} 0%, hsl(210,30%,8%) 60%, hsl(200,25%,12%) 100%)`,
        }}
      >
        {/* Caustic light bands */}
        {Array.from({ length: 3 }, (_, i) => (
          <div
            key={i}
            style={{
              position: 'absolute',
              top: `${20 + i * 25}%`,
              left: `${10 + Math.sin(t * 0.6 + i * 1.2) * 8}%`,
              width: '40%',
              height: 1,
              background: `rgba(100,180,220,${0.06 - i * 0.015})`,
              transform: `rotate(${drift + i * 2}deg)`,
              mixBlendMode: 'screen' as const,
            }}
          />
        ))}
        {/* Viewport frame -- periscope eyepiece ring */}
        <div
          style={{
            position: 'absolute',
            top: '18%',
            left: '12%',
            right: '12%',
            bottom: '18%',
            border: '3px solid rgba(100,110,130,0.35)',
            borderRadius: 8,
            boxShadow: 'inset 0 0 30px rgba(0,0,0,0.5), 0 0 0 6px rgba(40,45,55,0.4)',
          }}
        />
      </div>
    )
  },

  renderWord: ({ word, color, enterProgress, holdProgress, exitProgress, phase, index }: WordRenderProps) => {
    const letters = word.split('')
    const totalLetters = letters.length

    // The viewport: rectangular overflow:hidden container
    // Text rises from below, overshoots, settles
    let yPercent = 0

    if (phase === 'enter') {
      // Rise from below with elastic overshoot
      const eased = easeOutElastic(enterProgress)
      yPercent = (1 - eased) * 130
    } else if (phase === 'hold') {
      // Periscope sway: gentle oscillation as if underwater
      yPercent = Math.sin(holdProgress * Math.PI * 4) * 3
    } else {
      // Concept-driven exit: text SINKS back down through the viewport
      const eased = easeInBack(exitProgress)
      yPercent = eased * 140
    }

    return (
      <div
        style={{
          // THE VIEWPORT: overflow:hidden container — the periscope eyepiece
          position: 'absolute',
          top: '20%',
          left: '14%',
          right: '14%',
          bottom: '20%',
          overflow: 'hidden',
          borderRadius: 6,
        }}
      >
        {/* Scope crosshair — horizontal */}
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '5%',
            right: '5%',
            height: 1,
            background: 'rgba(100,180,220,0.15)',
            transform: 'translateY(-50%)',
            zIndex: 2,
            pointerEvents: 'none',
          }}
        />
        {/* Scope crosshair — vertical */}
        <div
          style={{
            position: 'absolute',
            top: '5%',
            bottom: '5%',
            left: '50%',
            width: 1,
            background: 'rgba(100,180,220,0.15)',
            transform: 'translateX(-50%)',
            zIndex: 2,
            pointerEvents: 'none',
          }}
        />

        {/* Per-character text sliding within the viewport */}
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: `translate(-50%, calc(-50% + ${yPercent}%))`,
            display: 'flex',
            gap: 'clamp(3px, 0.6vw, 10px)',
            whiteSpace: 'nowrap',
          }}
        >
          {letters.map((letter, i) => {
            const phaseOff = (i / totalLetters) * Math.PI * 2
            // Hold: each letter has independent micro-sway (ocean current)
            const letterSway = phase === 'hold'
              ? Math.sin(holdProgress * Math.PI * 6 + phaseOff) * 2
              : 0
            const letterRotate = phase === 'hold'
              ? Math.sin(holdProgress * Math.PI * 3 + phaseOff + 0.5) * 1.5
              : 0
            const glowRadius = phase === 'hold'
              ? 6 + Math.sin(holdProgress * Math.PI * 4 + phaseOff) * 4
              : 5

            return (
              <span
                key={i}
                style={{
                  fontFamily: "'Courier New', 'Consolas', monospace",
                  fontSize: 'clamp(40px, 12vw, 160px)',
                  fontWeight: 700,
                  color,
                  textShadow: `0 0 ${glowRadius}px rgba(100,200,255,0.35), 0 2px 4px rgba(0,0,0,0.5)`,
                  transform: `translateY(${letterSway}px) rotate(${letterRotate}deg)`,
                  display: 'inline-block',
                  mixBlendMode: 'screen' as const,
                }}
              >
                {letter}
              </span>
            )
          })}
        </div>

        {/* Lens vignette overlay */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: 'radial-gradient(ellipse at 50% 50%, transparent 50%, rgba(0,0,0,0.4) 100%)',
            pointerEvents: 'none',
            mixBlendMode: 'multiply' as const,
          }}
        />
      </div>
    )
  },
}

function PeriscopeComponent(props: MotionGraphicProps<PeriscopeConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-periscope',
  title: 'Kinetic Periscope',
  description: 'Per-character text rises through a rectangular overflow:hidden viewport with elastic overshoot, ocean-sway hold, and sinking exit — like peering through a submarine periscope',
  tags: ['kinetic', 'typography', 'periscope', 'viewport', 'submarine', 'reveal', 'contained', 'masked'],
  category: 'captions',
  component: PeriscopeComponent as any,
  defaultConfig: {
    words: ['TARGET', 'DEPTH', 'SCOPE', 'DIVE'],
    colors: ['#64E8FF', '#4ECDC4', '#A0F0E8', '#80D8FF'],
    bgColor: '#0a1520',
    cycleDuration: 1.3,
  },
  configSchema: [
    { key: 'words', label: 'Words', type: 'text-array', defaultValue: ['TARGET', 'DEPTH', 'SCOPE', 'DIVE'], group: 'Content' },
    { key: 'colors', label: 'Colors', type: 'text-array', defaultValue: ['#64E8FF', '#4ECDC4', '#A0F0E8', '#80D8FF'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#0a1520', group: 'Style' },
    { key: 'cycleDuration', label: 'Cycle Duration (s)', type: 'number', defaultValue: 1.3, min: 0.3, max: 5, group: 'Timing' },
  ],
})
