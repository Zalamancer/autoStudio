import { registerMotionGraphic } from '../registry'
import {
  KineticBase,
  type KineticBaseConfig,
  type KineticAnimation,
  type WordRenderProps,
  type BackgroundRenderProps,
} from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface SnowAccumulateConfig extends KineticBaseConfig {
  flakeCount: number
  driftAmount: number
}

function easeOutQuart(t: number): number {
  return 1 - Math.pow(1 - t, 4)
}

function pseudo(seed: number): number {
  const x = Math.sin(seed * 127.1 + 311.7) * 43758.5453
  return x - Math.floor(x)
}

const animation: KineticAnimation = {
  renderBackground: ({ bgColor }: BackgroundRenderProps) => (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        background: bgColor,
      }}
    >
      {/* Subtle frost vignette */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: 'radial-gradient(ellipse at center, transparent 40%, rgba(180,220,255,0.08) 100%)',
        }}
      />
    </div>
  ),

  renderWord: ({ word, color, enterProgress, exitProgress, phase, width, height, index }: WordRenderProps) => {
    const flakeCount = 80
    const seed = index * 61

    let fallP = 0
    let meltP = 0

    if (phase === 'enter') {
      fallP = enterProgress
    } else if (phase === 'hold') {
      fallP = 1
    } else {
      fallP = 1
      meltP = exitProgress
    }

    const flakes = []
    for (let i = 0; i < flakeCount; i++) {
      const p0 = pseudo(seed + i * 17)
      const p1 = pseudo(seed + i * 11 + 1)
      const p2 = pseudo(seed + i * 7 + 2)
      const p3 = pseudo(seed + i * 5 + 3)

      // Stagger — earlier flakes settle first, creating accumulation effect
      const stagger = p3 * 0.55
      const localFall = Math.max(0, Math.min(1, (fallP - stagger) / (1 - stagger)))
      const easedFall = easeOutQuart(localFall)

      // Each flake falls from top to a "settled" position near center
      const startX = (p0 - 0.5) * width * 1.2
      const startY = -height * 0.6 - p1 * height * 0.3
      const driftX = (p2 - 0.5) * 40 // slight horizontal drift
      const settleDY = (p1 - 0.3) * height * 0.6 // settle near word

      const curX = startX + driftX * easedFall
      const curY = startY + (settleDY - startY) * easedFall

      const size = 3 + p2 * 8
      const opacity = Math.min(1, localFall * 5) * (0.6 + p0 * 0.4) * (1 - meltP * meltP)

      // Flake shape: simple circle with a faint glow
      flakes.push(
        <div
          key={i}
          style={{
            position: 'absolute',
            left: '50%',
            top: '50%',
            width: size,
            height: size,
            borderRadius: '50%',
            background: `rgba(220, 240, 255, ${0.7 + p0 * 0.3})`,
            boxShadow: `0 0 ${size * 1.5}px rgba(200,230,255,0.5)`,
            transform: `translate(calc(-50% + ${curX}px), calc(-50% + ${curY}px))`,
            opacity,
          }}
        />,
      )
    }

    // Text emerges as snow layers build up — clip-path from bottom to top
    const textReveal =
      phase === 'enter' ? easeOutQuart(Math.min(1, (enterProgress - 0.3) / 0.7)) : phase === 'hold' ? 1 : 1 - meltP
    const textY = (1 - textReveal) * 30

    return (
      <>
        {flakes}
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: `translate(-50%, calc(-50% + ${textY}px))`,
            opacity: Math.max(0, textReveal),
            whiteSpace: 'nowrap',
            clipPath: `inset(${100 - textReveal * 100}% 0 0 0)`,
          }}
        >
          <span
            style={{
              fontFamily: "'Georgia', 'Times New Roman', serif",
              fontSize: 'clamp(52px, 13vw, 160px)',
              fontWeight: 700,
              color,
              letterSpacing: '0.06em',
              textTransform: 'uppercase',
              textShadow: `0 2px 20px rgba(200,230,255,0.4)`,
            }}
          >
            {word}
          </span>
        </div>
      </>
    )
  },
}

function SnowAccumulateComponent(props: MotionGraphicProps<SnowAccumulateConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-snow-accumulate',
  title: 'Kinetic Snow Accumulate',
  description:
    'Snowflakes drift down and pile up, the accumulation revealing the word from beneath a growing blanket of snow.',
  tags: ['kinetic', 'typography', 'snow', 'accumulate', 'winter', 'scatter', 'settle', 'particles', 'reveal'],
  category: 'captions',
  component: SnowAccumulateComponent as any,
  defaultConfig: {
    words: ['COLD', 'WINTER', 'DRIFT', 'STILL'],
    colors: ['#E8F4FF', '#FFFFFF', '#C9E8FF', '#B0D4FF'],
    bgColor: '#0A1628',
    cycleDuration: 2.2,
    flakeCount: 80,
    driftAmount: 40,
  },
  configSchema: [
    {
      key: 'words',
      label: 'Words',
      type: 'text-array',
      defaultValue: ['COLD', 'WINTER', 'DRIFT', 'STILL'],
      group: 'Content',
    },
    {
      key: 'colors',
      label: 'Colors',
      type: 'text-array',
      defaultValue: ['#E8F4FF', '#FFFFFF', '#C9E8FF', '#B0D4FF'],
      group: 'Style',
    },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#0A1628', group: 'Style' },
    {
      key: 'cycleDuration',
      label: 'Cycle Duration (s)',
      type: 'number',
      defaultValue: 2.2,
      min: 0.5,
      max: 5,
      group: 'Timing',
    },
    {
      key: 'flakeCount',
      label: 'Flake Count',
      type: 'number',
      defaultValue: 80,
      min: 20,
      max: 160,
      group: 'Animation',
    },
    {
      key: 'driftAmount',
      label: 'Drift Amount (px)',
      type: 'number',
      defaultValue: 40,
      min: 0,
      max: 100,
      group: 'Animation',
    },
  ],
})
