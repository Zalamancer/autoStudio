import { registerMotionGraphic } from '../registry'
import {
  KineticBase,
  type KineticBaseConfig,
  type KineticAnimation,
  type WordRenderProps,
  type BackgroundRenderProps,
} from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface FrescoCrackConfig extends KineticBaseConfig {}

function easeOutQuart(t: number): number {
  return 1 - Math.pow(1 - t, 4)
}

function easeInCubic(t: number): number {
  return t * t * t
}

function rand(s: number): number {
  const x = Math.sin(s * 127.1 + 311.7) * 43758.5453
  return x - Math.floor(x)
}

const animation: KineticAnimation = {
  renderBackground: ({ bgColor, width, height, frame, fps }: BackgroundRenderProps) => {
    const t = frame / fps

    // Aging cracks in the plaster surface
    const cracks = Array.from({ length: 14 }, (_, i) => {
      const x1 = width * rand(i * 31 + 3)
      const y1 = height * rand(i * 47 + 7)
      const angle = rand(i * 59 + 11) * 360
      const len = 30 + rand(i * 23) * 120
      const thickness = 1 + rand(i * 37) * 2
      const alpha = 0.06 + rand(i * 41) * 0.08

      return (
        <div
          key={`c${i}`}
          style={{
            position: 'absolute',
            left: x1,
            top: y1,
            width: len,
            height: thickness,
            background: `rgba(60, 40, 25, ${alpha})`,
            transform: `rotate(${angle}deg)`,
            transformOrigin: '0 50%',
            borderRadius: 1,
          }}
        />
      )
    })

    // Plaster patches with varying tone (wet plaster aging)
    const patches = Array.from({ length: 6 }, (_, i) => {
      const x = width * rand(i * 53 + 1)
      const y = height * rand(i * 67 + 5)
      const size = 80 + rand(i * 29) * 160
      const warmth =
        rand(i * 71) > 0.5
          ? `rgba(200, 180, 140, ${0.04 + Math.sin(t * 0.2 + i) * 0.01})`
          : `rgba(160, 150, 130, ${0.03 + Math.sin(t * 0.3 + i * 0.7) * 0.01})`

      return (
        <div
          key={`p${i}`}
          style={{
            position: 'absolute',
            left: x - size / 2,
            top: y - size / 2,
            width: size,
            height: size,
            borderRadius: '40% 60% 55% 45% / 50% 40% 60% 50%',
            background: `radial-gradient(ellipse, ${warmth}, transparent 70%)`,
            filter: 'blur(15px)',
          }}
        />
      )
    })

    return (
      <div style={{ position: 'absolute', inset: 0, background: bgColor }}>
        {/* Plaster base with warm Renaissance tone */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background:
              'linear-gradient(170deg, rgba(220, 200, 170, 0.06) 0%, transparent 40%, rgba(180, 160, 130, 0.04) 100%)',
          }}
        />
        {patches}
        {cracks}
        {/* Church ceiling vignette */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: 'radial-gradient(ellipse at 50% 50%, transparent 40%, rgba(0,0,0,0.15) 100%)',
          }}
        />
        {/* Candlelight flicker from below */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: `radial-gradient(ellipse at 50% 90%, rgba(255, 200, 100, ${0.03 + Math.sin(t * 3) * 0.01 + Math.sin(t * 7.3) * 0.005}), transparent 50%)`,
          }}
        />
      </div>
    )
  },

  renderWord: ({ word, color, enterProgress, holdProgress, exitProgress, phase, frame }: WordRenderProps) => {
    const f = frame ?? 0
    const t = f / 30

    const chars = word.split('').map((ch, ci) => {
      let charOpacity = 1
      let yOff = 0
      let scaleX = 1
      let scaleY = 1
      let crackOffset = 0

      if (phase === 'enter') {
        // Painted onto wet plaster: pigment soaks in and spreads
        const delay = (ci / (word.length + 1)) * 0.35
        const p = Math.max(0, Math.min(1, (enterProgress - delay) / 0.65))
        const ep = easeOutQuart(p)

        charOpacity = ep
        // Paint spreads outward as it soaks into plaster
        scaleX = 0.5 + ep * 0.5
        scaleY = 0.5 + ep * 0.5
      } else if (phase === 'hold') {
        // Subtle drying and aging: micro-cracks form
        crackOffset = Math.sin(t * 0.4 + ci * 0.8) * 0.5
        yOff = Math.sin(t * 0.6 + ci * 0.5) * 1
      } else {
        // Plaster crumbles and flakes away
        const delay = (ci / (word.length + 1)) * 0.3
        const p = Math.max(0, Math.min(1, (exitProgress - delay) / 0.7))
        const ep = easeInCubic(p)

        charOpacity = 1 - ep
        // Fragments fall and rotate
        yOff = ep * 40
        crackOffset = ep * 8
        scaleX = 1 - ep * 0.3
        scaleY = 1 - ep * 0.2
      }

      // Renaissance pigment colors: earthy warm tones with age patina
      const agingAlpha = 0.85 + Math.sin(t * 0.3 + ci * 1.1) * 0.05

      return (
        <span
          key={ci}
          style={{
            display: 'inline-block',
            color,
            opacity: charOpacity * agingAlpha,
            transform: `translate(${crackOffset}px, ${yOff}px) scaleX(${scaleX}) scaleY(${scaleY})`,
            textShadow: `0 1px 2px rgba(80, 50, 20, 0.3), 0 0 6px rgba(200, 180, 140, 0.15)`,
          }}
        >
          {ch}
        </span>
      )
    })

    // Drying crack line across text during hold
    let crackLine: React.ReactNode = null
    if (phase === 'hold' && holdProgress > 0.3) {
      const crackAlpha = Math.min(0.2, (holdProgress - 0.3) * 0.4)
      crackLine = (
        <div
          style={{
            position: 'absolute',
            top: '52%',
            left: '20%',
            width: '60%',
            height: 1.5,
            background: `rgba(60, 40, 20, ${crackAlpha})`,
            transform: `rotate(${-2 + Math.sin(t * 0.2) * 1}deg)`,
            borderRadius: 1,
          }}
        />
      )
    }

    return (
      <div style={{ position: 'absolute', inset: 0 }}>
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            fontFamily: "'Palatino', 'Garamond', 'Book Antiqua', serif",
            fontSize: 'clamp(42px, 11vw, 150px)',
            fontWeight: 700,
            whiteSpace: 'nowrap',
            letterSpacing: 6,
            textTransform: 'uppercase',
            fontVariant: 'small-caps',
          }}
        >
          {chars}
        </div>
        {crackLine}
      </div>
    )
  },
}

function FrescoCrackComponent(props: MotionGraphicProps<FrescoCrackConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-fresco-crack',
  title: 'Kinetic Fresco Crack',
  description:
    'Text painted on wet plaster in a Renaissance fresco style. Pigment soaks in on enter, drying cracks form during hold, and plaster crumbles away on exit. Church ceiling aesthetic.',
  tags: ['kinetic', 'typography', 'paint', 'fresco', 'renaissance', 'plaster', 'crack', 'classical'],
  category: 'captions',
  component: FrescoCrackComponent as any,
  defaultConfig: {
    words: ['FRESCO', 'SACRED', 'VAULT', 'GLORY'],
    colors: ['#B8860B', '#8B4513', '#CD853F', '#A0522D'],
    bgColor: '#1E1B16',
    cycleDuration: 1.5,
  },
  configSchema: [
    {
      key: 'words',
      label: 'Words',
      type: 'text-array',
      defaultValue: ['FRESCO', 'SACRED', 'VAULT', 'GLORY'],
      group: 'Content',
    },
    {
      key: 'colors',
      label: 'Colors',
      type: 'text-array',
      defaultValue: ['#B8860B', '#8B4513', '#CD853F', '#A0522D'],
      group: 'Style',
    },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#1E1B16', group: 'Style' },
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
