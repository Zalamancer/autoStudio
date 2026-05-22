import { registerMotionGraphic } from '../registry'
import {
  KineticBase,
  type KineticBaseConfig,
  type KineticAnimation,
  type WordRenderProps,
  type BackgroundRenderProps,
} from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface StrongmanSlamConfig extends KineticBaseConfig {
  meterColor: string
  impactColor: string
}

// Spring-overshoot easing: hammer slams, bounces once, settles
function easeSpringOvershoot(t: number): number {
  if (t <= 0) return 0
  if (t >= 1) return 1
  // Exponentially decaying oscillation
  return 1 - Math.exp(-8 * t) * Math.cos(12 * t)
}

function easeInQuint(t: number): number {
  return t * t * t * t * t
}

// Meter fill: how far the "strongman power meter" has risen (0–1)
function meterFill(enterProgress: number): number {
  // Fast ramp up then caps at 1.0 with slight overshoot
  const raw = Math.min(1.1, enterProgress * 1.3)
  return Math.min(1, raw)
}

const animation: KineticAnimation = {
  renderBackground: ({ bgColor }: BackgroundRenderProps) => (
    <div style={{ position: 'absolute', inset: 0, background: bgColor }} />
  ),

  renderWord: ({ word, color, enterProgress, exitProgress, phase, config }: WordRenderProps) => {
    const cfg = config as unknown as StrongmanSlamConfig
    const meterColor = cfg?.meterColor ?? '#ff4800'
    const impactColor = cfg?.impactColor ?? '#ffe100'

    // --- Spring slam: comes from above, overshoots downward, bounces to center ---
    let translateY = 0
    let scaleY = 1
    let scaleX = 1
    let opacity = 1
    let shakeX = 0

    if (phase === 'enter') {
      const p = Math.min(1, enterProgress)
      const spring = easeSpringOvershoot(p)

      // Start 300px above, slam down
      translateY = (1 - spring) * -300
      // Squash on impact: at p~0.4 text briefly squashes then springs back
      const impactPhase = Math.max(0, Math.sin(p * Math.PI * 1.5))
      scaleY = 1 - impactPhase * 0.3
      scaleX = 1 + impactPhase * 0.15
      // Shake at moment of impact
      shakeX = p > 0.3 && p < 0.55 ? Math.sin(p * 80) * 4 * (1 - (p - 0.3) / 0.25) : 0
      opacity = Math.min(1, p * 3)
    } else if (phase === 'exit') {
      const p = easeInQuint(exitProgress)
      // Blast upward fast, like a recoil
      translateY = -p * 200
      scaleY = 1 + p * 0.5
      scaleX = 1 - p * 0.3
      opacity = 1 - exitProgress * exitProgress
    }

    // Meter bar: fills from bottom during enter, drains on exit
    const fill = phase === 'enter'
      ? meterFill(enterProgress)
      : phase === 'exit'
        ? 1 - exitProgress
        : 1

    const meterHeight = 60 // px
    const meterWidth = 12  // px

    return (
      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: `translate(-50%, -50%)`,
          display: 'flex',
          alignItems: 'center',
          gap: 16,
          opacity,
        }}
      >
        {/* Left power meter */}
        <div
          style={{
            width: meterWidth,
            height: meterHeight,
            border: `2px solid ${meterColor}`,
            borderRadius: 3,
            overflow: 'hidden',
            position: 'relative',
            flexShrink: 0,
          }}
        >
          <div
            style={{
              position: 'absolute',
              bottom: 0,
              left: 0,
              right: 0,
              height: `${(fill * 100).toFixed(1)}%`,
              background: `linear-gradient(to top, ${meterColor}, ${impactColor})`,
              transition: 'none',
            }}
          />
        </div>

        {/* Main text */}
        <div
          style={{
            transform: `translate(${shakeX.toFixed(2)}px, ${translateY.toFixed(2)}px) scaleX(${scaleX.toFixed(3)}) scaleY(${scaleY.toFixed(3)})`,
            transformOrigin: 'center bottom',
          }}
        >
          {/* Impact flash halo */}
          {phase === 'enter' && enterProgress > 0.25 && enterProgress < 0.55 && (
            <div
              style={{
                position: 'absolute',
                inset: '-8px -16px',
                background: impactColor,
                opacity: Math.max(0, 0.6 - (enterProgress - 0.25) * 2),
                borderRadius: 4,
                mixBlendMode: 'screen',
                pointerEvents: 'none',
              }}
            />
          )}
          <div
            style={{
              fontFamily: "'Impact', 'Arial Black', sans-serif",
              fontSize: 'clamp(40px, 9vw, 130px)',
              fontWeight: 900,
              letterSpacing: '0.05em',
              color,
              whiteSpace: 'nowrap',
              textTransform: 'uppercase',
              textShadow: fill >= 0.98 ? `0 0 20px ${impactColor}, 0 4px 0 rgba(0,0,0,0.6)` : '0 4px 0 rgba(0,0,0,0.6)',
            }}
          >
            {word}
          </div>
        </div>

        {/* Right power meter */}
        <div
          style={{
            width: meterWidth,
            height: meterHeight,
            border: `2px solid ${meterColor}`,
            borderRadius: 3,
            overflow: 'hidden',
            position: 'relative',
            flexShrink: 0,
          }}
        >
          <div
            style={{
              position: 'absolute',
              bottom: 0,
              left: 0,
              right: 0,
              height: `${(fill * 100).toFixed(1)}%`,
              background: `linear-gradient(to top, ${meterColor}, ${impactColor})`,
            }}
          />
        </div>
      </div>
    )
  },
}

function StrongmanSlamComponent(props: MotionGraphicProps<StrongmanSlamConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-strongman-slam',
  title: 'Strongman Slam',
  description: 'Text slams down from above with a spring overshoot and squash, flanked by power meters that fill to max on impact — like a circus strongman ringing the bell.',
  tags: ['kinetic', 'typography', 'carnival', 'circus', 'strongman', 'slam', 'impact', 'spring', 'bounce', 'meter'],
  category: 'captions',
  component: StrongmanSlamComponent as any,
  defaultConfig: {
    words: ['POWER', 'STRONG', 'MASSIVE', 'DING'],
    colors: ['#ffffff', '#ffe100', '#ffffff', '#ffe100'],
    bgColor: '#0d0d0d',
    cycleDuration: 1.5,
    meterColor: '#ff4800',
    impactColor: '#ffe100',
  },
  configSchema: [
    { key: 'words', label: 'Words', type: 'text-array', defaultValue: ['POWER', 'STRONG', 'MASSIVE', 'DING'], group: 'Content' },
    { key: 'colors', label: 'Colors', type: 'text-array', defaultValue: ['#ffffff', '#ffe100', '#ffffff', '#ffe100'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#0d0d0d', group: 'Style' },
    { key: 'meterColor', label: 'Meter Color', type: 'color', defaultValue: '#ff4800', group: 'Style' },
    { key: 'impactColor', label: 'Impact Flash Color', type: 'color', defaultValue: '#ffe100', group: 'Style' },
    { key: 'cycleDuration', label: 'Cycle Duration (s)', type: 'number', defaultValue: 1.5, min: 0.6, max: 5, group: 'Timing' },
  ],
})
