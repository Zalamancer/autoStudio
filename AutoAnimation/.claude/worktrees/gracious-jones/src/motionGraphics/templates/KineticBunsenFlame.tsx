import { registerMotionGraphic } from '../registry'
import {
  KineticBase,
  type KineticBaseConfig,
  type KineticAnimation,
  type WordRenderProps,
  type BackgroundRenderProps,
} from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

// Bunsen burner flame: text rises from below with a wavering heat-shimmer.
// Background pulses with a deep blue/orange gradient like an open-air flame.
// On exit, text burns away upward with opacity fade + vertical drift.

interface BunsenFlameConfig extends KineticBaseConfig {
  flameColorLow: string
  flameColorHigh: string
}

const animation: KineticAnimation = {
  renderBackground: ({ bgColor, frame, fps }: BackgroundRenderProps) => {
    const t = frame / fps
    // Flame flicker: rapid small oscillation
    const flicker = 0.5 + 0.5 * Math.sin(t * Math.PI * 7.3) * Math.sin(t * Math.PI * 4.1)
    const intensity = 0.6 + flicker * 0.4

    return (
      <div style={{ position: 'absolute', inset: 0, background: bgColor }}>
        {/* Flame cone glow at bottom */}
        <div
          style={{
            position: 'absolute',
            bottom: 0,
            left: '50%',
            transform: 'translateX(-50%)',
            width: '60%',
            height: '55%',
            background: `radial-gradient(ellipse 60% 90% at 50% 100%, rgba(255,140,0,${0.25 * intensity}), rgba(255,60,0,${0.12 * intensity}), transparent)`,
            filter: 'blur(18px)',
          }}
        />
        {/* Inner blue cone */}
        <div
          style={{
            position: 'absolute',
            bottom: 0,
            left: '50%',
            transform: 'translateX(-50%)',
            width: '24%',
            height: '35%',
            background: `radial-gradient(ellipse 50% 100% at 50% 100%, rgba(80,160,255,${0.35 * intensity}), transparent)`,
            filter: 'blur(10px)',
          }}
        />
      </div>
    )
  },

  renderWord: ({
    word,
    color,
    enterProgress,
    exitProgress,
    holdProgress,
    phase,
    frame = 0,
  }: WordRenderProps) => {
    const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3)

    // Flame shimmer: letters appear to waver with heat
    const t = frame / 60
    const shimmerX = Math.sin(t * Math.PI * 6.7) * 2.5 * (1 - (phase === 'hold' ? holdProgress * 0.3 : 0))
    const shimmerY = Math.cos(t * Math.PI * 5.1) * 1.5

    // Enter: rise from below
    const easedEnter = easeOutCubic(enterProgress)
    const riseY = phase === 'enter' ? (1 - easedEnter) * 50 : 0
    const opacity =
      phase === 'enter'
        ? easedEnter
        : phase === 'exit'
          ? 1 - exitProgress
          : 1

    // Exit: burn upward
    const burnY = phase === 'exit' ? -exitProgress * 40 : 0

    // Heat blur during enter
    const heatBlur = phase === 'enter' ? (1 - easedEnter) * 8 : 0

    // Glow intensifies on hold
    const glowSize = phase === 'hold' ? 8 + Math.sin(t * Math.PI * 3) * 4 : 4

    return (
      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: `translate(calc(-50% + ${shimmerX}px), calc(-50% + ${riseY + burnY + shimmerY}px))`,
          opacity,
          filter: heatBlur > 0 ? `blur(${heatBlur.toFixed(2)}px)` : 'none',
          whiteSpace: 'nowrap',
        }}
      >
        <div
          style={{
            fontFamily: "'Inter', 'Helvetica Neue', Helvetica, sans-serif",
            fontSize: 'clamp(36px, 8vw, 110px)',
            fontWeight: 900,
            letterSpacing: '0.06em',
            color,
            textShadow: [
              `0 0 ${glowSize}px rgba(255,160,40,0.9)`,
              `0 0 ${glowSize * 2}px rgba(255,80,0,0.5)`,
              `0 0 ${glowSize * 4}px rgba(255,40,0,0.25)`,
            ].join(', '),
          }}
        >
          {word}
        </div>
      </div>
    )
  },
}

function BunsenFlameComponent(props: MotionGraphicProps<BunsenFlameConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-bunsen-flame',
  title: 'Bunsen Flame',
  description:
    'Text rises from a Bunsen burner flame with heat shimmer and a fiery glow, then burns away upward on exit.',
  tags: ['kinetic', 'typography', 'chemistry', 'lab', 'flame', 'fire', 'bunsen', 'science'],
  category: 'captions',
  component: BunsenFlameComponent as any,
  defaultConfig: {
    words: ['HEAT', 'BURN', 'REACT', 'IGNITE'],
    colors: ['#ffcc44', '#ff9922', '#ffdd55', '#ff8800'],
    bgColor: '#070708',
    cycleDuration: 1.5,
    flameColorLow: '#ff6600',
    flameColorHigh: '#5599ff',
  },
  configSchema: [
    { key: 'words', label: 'Words', type: 'text-array', defaultValue: ['HEAT', 'BURN', 'REACT', 'IGNITE'], group: 'Content' },
    { key: 'colors', label: 'Colors', type: 'text-array', defaultValue: ['#ffcc44', '#ff9922', '#ffdd55', '#ff8800'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#070708', group: 'Style' },
    { key: 'flameColorLow', label: 'Flame Low Color', type: 'color', defaultValue: '#ff6600', group: 'Style' },
    { key: 'flameColorHigh', label: 'Flame High Color', type: 'color', defaultValue: '#5599ff', group: 'Style' },
    { key: 'cycleDuration', label: 'Cycle Duration (s)', type: 'number', defaultValue: 1.5, min: 0.8, max: 5, group: 'Timing' },
  ],
})
