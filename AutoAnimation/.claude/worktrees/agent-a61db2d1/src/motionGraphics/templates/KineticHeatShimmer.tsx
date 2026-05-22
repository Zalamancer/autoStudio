import { registerMotionGraphic } from '../registry'
import {
  KineticBase,
  type KineticBaseConfig,
  type KineticAnimation,
  type WordRenderProps,
  type BackgroundRenderProps,
} from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface HeatShimmerConfig extends KineticBaseConfig {}

function easeOutExpo(t: number): number {
  return t === 1 ? 1 : 1 - Math.pow(2, -10 * t)
}

function rand(s: number): number {
  const x = Math.sin(s * 127.1 + 311.7) * 43758.5453
  return x - Math.floor(x)
}

const animation: KineticAnimation = {
  renderBackground: ({ bgColor, frame, fps }: BackgroundRenderProps) => {
    const time = frame / fps
    // Heat haze rising lines — very subtle vertical distortion bands
    const bands: React.ReactNode[] = []
    for (let i = 0; i < 6; i++) {
      const xPos = 10 + i * 16 + Math.sin(time * 0.8 + i * 1.4) * 5
      const speed = 0.9 + rand(i * 31) * 0.6
      const rise = (time * speed * 15) % 100
      bands.push(
        <div
          key={i}
          style={{
            position: 'absolute',
            left: `${xPos}%`,
            top: `${100 - rise}%`,
            width: 2 + rand(i * 17) * 12,
            height: '60%',
            background: `linear-gradient(to top, transparent, rgba(255,200,80,${0.025 + rand(i) * 0.015}), transparent)`,
            filter: 'blur(4px)',
            transform: `skewX(${Math.sin(time * 1.3 + i) * 3}deg)`,
          }}
        />,
      )
    }
    return (
      <div style={{ position: 'absolute', inset: 0, background: bgColor }}>
        {bands}
        {/* Ground heat glow */}
        <div
          style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            height: '25%',
            background: `linear-gradient(to top, rgba(255,160,30,${0.08 + Math.sin(time * 1.5) * 0.04}), transparent)`,
          }}
        />
      </div>
    )
  },

  renderWord: ({ word, color, enterProgress, exitProgress, phase, frame }: WordRenderProps) => {
    const time = (frame ?? 0) / 30
    const eased = easeOutExpo(Math.min(enterProgress, 1))

    // Heat shimmer: rapid lateral micro-oscillations that decrease at stabilization
    const shimmerIntensity =
      phase === 'enter' ? (1 - eased) * 22 : phase === 'hold' ? 2 + Math.sin(time * 4.5) * 1.5 : exitProgress * 30

    // Fast-frequency oscillation layers
    const skewX = Math.sin(time * 9.1) * shimmerIntensity * 0.4
    const translateX = Math.sin(time * 7.3 + 1) * shimmerIntensity * 0.25
    const scaleY = 1 + Math.sin(time * 6.7) * shimmerIntensity * 0.008

    // Haze blur — strongest during shimmer
    const hazeBlur =
      phase === 'enter'
        ? (1 - eased) * 4
        : phase === 'hold'
          ? 0.3 + Math.abs(Math.sin(time * 5)) * 0.3
          : exitProgress * 6

    // Orange heat tint on edges
    const heatGlow =
      phase === 'hold'
        ? `0 0 ${20 + Math.sin(time * 3) * 8}px rgba(255,160,30,0.12), 0 0 ${40 + Math.sin(time * 2) * 15}px rgba(255,100,0,0.06)`
        : 'none'

    const opacity = phase === 'enter' ? Math.min(1, enterProgress * 2.5) : 1

    // Exit: dissolves upward as heat
    const exitTranslate = phase === 'exit' ? -exitProgress * 40 : 0

    return (
      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: `translate(calc(-50% + ${translateX}px), calc(-50% + ${exitTranslate}px)) skewX(${skewX}deg) scaleY(${scaleY})`,
          fontFamily: "'Impact', 'Arial Black', sans-serif",
          fontSize: 'clamp(44px, 13vw, 170px)',
          fontWeight: 900,
          color,
          whiteSpace: 'nowrap',
          letterSpacing: '0.06em',
          textTransform: 'uppercase',
          filter: `blur(${hazeBlur}px)`,
          textShadow: heatGlow,
          opacity,
        }}
      >
        {word}
      </div>
    )
  },
}

function HeatShimmerComponent(props: MotionGraphicProps<HeatShimmerConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-heat-shimmer',
  title: 'Kinetic Heat Shimmer',
  description:
    'Text materializes through desert heat haze — rapid lateral micro-distortions calm as the word stabilizes, then dissolves upward as rising hot air',
  tags: ['kinetic', 'typography', 'heat', 'shimmer', 'distort', 'optical', 'refraction', 'desert'],
  category: 'captions',
  component: HeatShimmerComponent as any,
  defaultConfig: {
    words: ['HOT', 'BLAZE', 'HEAT', 'BURN'],
    colors: ['#FF9040', '#FFCC60', '#FF6020', '#FFB040'],
    bgColor: '#1A0D00',
    cycleDuration: 1.4,
  },
  configSchema: [
    {
      key: 'words',
      label: 'Words',
      type: 'text-array',
      defaultValue: ['HOT', 'BLAZE', 'HEAT', 'BURN'],
      group: 'Content',
    },
    { key: 'colors', label: 'Colors', type: 'text-array', defaultValue: ['#FF9040', '#FFCC60'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#1A0D00', group: 'Style' },
    {
      key: 'cycleDuration',
      label: 'Cycle Duration (s)',
      type: 'number',
      defaultValue: 1.4,
      min: 0.5,
      max: 5,
      group: 'Timing',
    },
  ],
})
