import { registerMotionGraphic } from '../registry'
import {
  KineticBase,
  type KineticBaseConfig,
  type KineticAnimation,
  type WordRenderProps,
  type BackgroundRenderProps,
} from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface SunriseConfig extends KineticBaseConfig {}

function lerpColor(a: [number, number, number], b: [number, number, number], t: number): string {
  const r = Math.round(a[0] + (b[0] - a[0]) * t)
  const g = Math.round(a[1] + (b[1] - a[1]) * t)
  const bl = Math.round(a[2] + (b[2] - a[2]) * t)
  return `rgb(${r},${g},${bl})`
}

const PALETTE: [number, number, number][] = [
  [15, 15, 45], // deep night
  [40, 20, 60], // pre-dawn purple
  [120, 50, 30], // dawn orange-brown
  [220, 120, 40], // sunrise orange
  [255, 190, 60], // gold
  [135, 200, 235], // light blue sky
]

const animation: KineticAnimation = {
  renderBackground: ({ bgColor, frame, fps, width, height }: BackgroundRenderProps) => {
    const time = frame / fps
    // Cycle through sunrise over 8 seconds, then loop
    const cycleDuration = 8
    const progress = (time % cycleDuration) / cycleDuration

    // Map progress to palette: 0→night, 0.5→golden hour, 1→day
    const paletteProgress = progress * (PALETTE.length - 1)
    const idx = Math.min(Math.floor(paletteProgress), PALETTE.length - 2)
    const frac = paletteProgress - idx

    const safeIdx = (i: number) => PALETTE[Math.max(0, Math.min(i, PALETTE.length - 1))]
    const topColor = lerpColor(safeIdx(idx - 1), safeIdx(idx), frac)
    const midColor = lerpColor(safeIdx(idx), safeIdx(idx + 1), frac)
    const botColor = lerpColor(safeIdx(idx + 1), safeIdx(idx + 2), frac)

    // Sun position: rises from bottom
    const sunY = 90 - progress * 60
    const sunOpacity = Math.max(0, Math.min(1, (progress - 0.2) * 3))
    const sunSize = 30 + progress * 20

    return (
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: `linear-gradient(180deg, ${topColor} 0%, ${midColor} 50%, ${botColor} 100%)`,
        }}
      >
        {/* Sun disc */}
        <div
          style={{
            position: 'absolute',
            left: '50%',
            top: `${sunY}%`,
            transform: 'translate(-50%, -50%)',
            width: sunSize,
            height: sunSize,
            borderRadius: '50%',
            background: 'radial-gradient(circle, #FFF8DC, #FFD700, #FF8C00)',
            opacity: sunOpacity,
            boxShadow: `0 0 ${sunSize}px ${sunSize / 2}px rgba(255,200,50,${sunOpacity * 0.4}), 0 0 ${sunSize * 3}px ${sunSize}px rgba(255,150,0,${sunOpacity * 0.15})`,
          }}
        />
        {/* Horizon glow */}
        <div
          style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            height: '30%',
            background: `linear-gradient(180deg, transparent, rgba(255,160,50,${sunOpacity * 0.15}))`,
          }}
        />
        {/* Light rays */}
        {sunOpacity > 0.3 &&
          [0, 1, 2].map((i) => {
            const angle = -15 + i * 15
            const rayOpacity = sunOpacity * (0.04 + Math.sin(time * 0.5 + i * 2) * 0.02)
            return (
              <div
                key={i}
                style={{
                  position: 'absolute',
                  left: '50%',
                  top: `${sunY}%`,
                  width: 3,
                  height: height * 0.6,
                  background: `linear-gradient(180deg, rgba(255,220,100,${rayOpacity}), transparent)`,
                  transformOrigin: 'top center',
                  transform: `translateX(-50%) rotate(${angle}deg)`,
                }}
              />
            )
          })}
      </div>
    )
  },

  renderWord: ({ word, color, enterProgress, exitProgress, phase, holdProgress }: WordRenderProps) => {
    let opacity = 0
    let translateY = 0

    if (phase === 'enter') {
      opacity = enterProgress
      translateY = (1 - enterProgress) * 20
    } else if (phase === 'hold') {
      opacity = 1
      translateY = Math.sin(holdProgress * Math.PI * 2) * 3
    } else {
      opacity = 1 - exitProgress
      translateY = -exitProgress * 15
    }

    return (
      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: `translate(-50%, calc(-50% + ${translateY}px))`,
          opacity,
          fontSize: 'clamp(44px, 12vw, 160px)',
          fontWeight: 700,
          color,
          textShadow: `0 0 15px ${color}66, 0 2px 10px rgba(0,0,0,0.4)`,
          whiteSpace: 'nowrap',
          letterSpacing: 3,
        }}
      >
        {word}
      </div>
    )
  },
}

function SunriseComponent(props: MotionGraphicProps<SunriseConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-sunrise',
  title: 'Kinetic Sunrise',
  description: 'Animated sunrise gradient transitioning from night through dawn to golden hour with rising sun',
  tags: ['kinetic', 'typography', 'sunrise', 'dawn', 'golden-hour', 'nature', 'weather', 'warm'],
  category: 'captions',
  component: SunriseComponent as any,
  defaultConfig: {
    words: ['RISE', 'SHINE', 'GLOW', 'DAWN'],
    colors: ['#FFD700', '#FF8C00', '#FFF8DC', '#FFDAB9'],
    bgColor: '#1a1030',
    cycleDuration: 1.5,
  },
  configSchema: [
    {
      key: 'words',
      label: 'Words',
      type: 'text-array',
      defaultValue: ['RISE', 'SHINE', 'GLOW', 'DAWN'],
      group: 'Content',
    },
    {
      key: 'colors',
      label: 'Colors',
      type: 'text-array',
      defaultValue: ['#FFD700', '#FF8C00', '#FFF8DC', '#FFDAB9'],
      group: 'Style',
    },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#1a1030', group: 'Style' },
    {
      key: 'cycleDuration',
      label: 'Cycle Duration (s)',
      type: 'number',
      defaultValue: 1.5,
      min: 0.3,
      max: 5,
      group: 'Timing',
    },
  ],
})
