import { registerMotionGraphic } from '../registry'
import {
  KineticBase,
  type KineticBaseConfig,
  type KineticAnimation,
  type WordRenderProps,
  type BackgroundRenderProps,
} from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface WaterRefractionConfig extends KineticBaseConfig {}

function easeOutExpo(t: number): number {
  return t === 1 ? 1 : 1 - Math.pow(2, -10 * t)
}

function easeOutBack(t: number): number {
  const c1 = 1.70158
  const c3 = c1 + 1
  return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2)
}

const animation: KineticAnimation = {
  renderBackground: ({ bgColor, frame, fps }: BackgroundRenderProps) => {
    const time = frame / fps
    // Ripple caustic lines across background
    const lines: React.ReactNode[] = []
    for (let i = 0; i < 8; i++) {
      const phase = i * 0.4 + time * 0.7
      const y = 10 + i * 12 + Math.sin(phase) * 4
      lines.push(
        <div
          key={i}
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            top: `${y}%`,
            height: 1.5,
            background: `linear-gradient(90deg, transparent, rgba(120,200,255,${0.04 + Math.sin(phase * 1.3) * 0.02}), transparent)`,
            transform: `scaleX(${0.6 + Math.sin(phase * 0.7) * 0.4})`,
          }}
        />,
      )
    }
    return (
      <div style={{ position: 'absolute', inset: 0, background: bgColor }}>
        {lines}
        {/* Caustic shimmer at bottom */}
        <div
          style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            height: '30%',
            background: `linear-gradient(to top, rgba(60,140,200,${0.06 + Math.sin(time * 1.1) * 0.03}), transparent)`,
          }}
        />
      </div>
    )
  },

  renderWord: ({ word, color, enterProgress, exitProgress, phase, width, frame }: WordRenderProps) => {
    const time = (frame ?? 0) / 30

    // Split text into above-water (clear) and below-water (refracted) halves
    const eased = easeOutExpo(Math.min(enterProgress, 1))

    // Water line rises from bottom — reveal threshold
    const waterLine =
      phase === 'enter'
        ? 1 - eased // 1 = fully submerged, 0 = surface at top
        : phase === 'hold'
          ? 0
          : exitProgress // re-submerges on exit

    // Horizontal wave distortion amount
    const waveAmp =
      phase === 'hold' ? 6 + Math.sin(time * 2.3) * 2 : phase === 'enter' ? (1 - eased) * 18 : exitProgress * 20

    // Vertical compression from refraction (water bends light upward)
    const refractionSquish =
      phase === 'hold'
        ? 0.92 + Math.sin(time * 1.7) * 0.04
        : phase === 'enter'
          ? 0.7 + eased * 0.25
          : 1 - exitProgress * 0.25

    // Blue tint intensity for submerged portion
    const blueTint =
      phase === 'hold'
        ? `rgba(80,160,255,${0.08 + Math.sin(time * 2) * 0.04})`
        : phase === 'enter'
          ? `rgba(80,160,255,${(1 - eased) * 0.3})`
          : `rgba(80,160,255,${exitProgress * 0.35})`

    const overallOpacity = phase === 'enter' ? Math.min(1, enterProgress * 3) : 1

    return (
      <div style={{ position: 'absolute', inset: 0 }}>
        {/* Above-water text — sharp and clear */}
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            overflow: 'hidden',
            height: `${(1 - waterLine) * 100}%`,
            display: 'flex',
            alignItems: 'flex-end',
            opacity: overallOpacity,
          }}
        >
          <div
            style={{
              fontFamily: "'Inter', 'Helvetica Neue', sans-serif",
              fontSize: 'clamp(44px, 13vw, 170px)',
              fontWeight: 800,
              color,
              whiteSpace: 'nowrap',
              letterSpacing: '0.02em',
              textTransform: 'uppercase',
              lineHeight: 1,
              transform: 'translateY(50%)',
            }}
          >
            {word}
          </div>
        </div>

        {/* Below-water text — distorted/refracted */}
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            overflow: 'hidden',
            height: `${waterLine * 100}%`,
            display: 'flex',
            alignItems: 'flex-start',
            opacity: overallOpacity,
          }}
        >
          <div
            style={{
              fontFamily: "'Inter', 'Helvetica Neue', sans-serif",
              fontSize: 'clamp(44px, 13vw, 170px)',
              fontWeight: 800,
              color,
              whiteSpace: 'nowrap',
              letterSpacing: '0.02em',
              textTransform: 'uppercase',
              lineHeight: 1,
              transform: `translateY(-50%) skewX(${Math.sin(time * 2.8) * waveAmp * 0.3}deg) scaleY(${refractionSquish})`,
              filter: `blur(${waveAmp * 0.15}px)`,
              textShadow: `${Math.sin(time * 3) * waveAmp * 0.4}px 0 ${blueTint}, ${-Math.sin(time * 3 + 1) * waveAmp * 0.3}px 0 rgba(0,200,255,0.2)`,
            }}
          >
            {word}
          </div>
        </div>

        {/* Water surface line */}
        <div
          style={{
            position: 'absolute',
            left: '10%',
            right: '10%',
            top: `calc(50% + ${(waterLine - 0.5) * 100}%)`,
            height: 2,
            background: `linear-gradient(90deg, transparent, rgba(120,220,255,${0.3 + Math.sin(time * 3) * 0.15}), transparent)`,
            transform: `scaleX(${0.4 + Math.abs(Math.sin(time * 1.5)) * 0.6})`,
            opacity: overallOpacity,
          }}
        />
      </div>
    )
  },
}

function WaterRefractionComponent(props: MotionGraphicProps<WaterRefractionConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-water-refraction',
  title: 'Kinetic Water Refraction',
  description:
    'Text emerges from water — the submerged half is wave-distorted and refracted while the above-surface half is sharp and clear',
  tags: ['kinetic', 'typography', 'water', 'refraction', 'optical', 'lens', 'wave', 'distort'],
  category: 'captions',
  component: WaterRefractionComponent as any,
  defaultConfig: {
    words: ['DEPTH', 'FLOW', 'CLEAR', 'PURE'],
    colors: ['#60DDFF', '#40BBEE', '#80EEFF', '#20AADD'],
    bgColor: '#051520',
    cycleDuration: 1.6,
  },
  configSchema: [
    {
      key: 'words',
      label: 'Words',
      type: 'text-array',
      defaultValue: ['DEPTH', 'FLOW', 'CLEAR', 'PURE'],
      group: 'Content',
    },
    { key: 'colors', label: 'Colors', type: 'text-array', defaultValue: ['#60DDFF', '#40BBEE'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#051520', group: 'Style' },
    {
      key: 'cycleDuration',
      label: 'Cycle Duration (s)',
      type: 'number',
      defaultValue: 1.6,
      min: 0.5,
      max: 5,
      group: 'Timing',
    },
  ],
})
