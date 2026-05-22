import { registerMotionGraphic } from '../registry'
import {
  KineticBase,
  type KineticBaseConfig,
  type KineticAnimation,
  type WordRenderProps,
  type BackgroundRenderProps,
} from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface AcrylicPourConfig extends KineticBaseConfig {}

function easeOutQuint(t: number): number {
  return 1 - Math.pow(1 - t, 5)
}

function easeInCubic(t: number): number {
  return t * t * t
}

function rand(s: number): number {
  const x = Math.sin(s * 127.1 + 311.7) * 43758.5453
  return x - Math.floor(x)
}

const CELL_HUES = [330, 200, 50, 280, 160, 20]

const animation: KineticAnimation = {
  renderBackground: ({ bgColor, width, height, frame, fps }: BackgroundRenderProps) => {
    const t = frame / fps

    // Acrylic pour cells: organic silicone cell patterns
    const cells = Array.from({ length: 12 }, (_, i) => {
      const baseX = width * rand(i * 41 + 3)
      const baseY = height * rand(i * 53 + 7)
      const size = 50 + rand(i * 23) * 120
      const hue = CELL_HUES[i % CELL_HUES.length]
      const drift = Math.sin(t * 0.2 + i * 0.8) * 10
      const driftY = Math.cos(t * 0.15 + i * 1.1) * 8
      const morphPhase = t * 0.3 + i * 0.7

      // Organic cell border radius (silicone cells are never circular)
      const br1 = 30 + Math.sin(morphPhase) * 20
      const br2 = 40 + Math.cos(morphPhase * 1.3) * 20
      const br3 = 35 + Math.sin(morphPhase * 0.8) * 20
      const br4 = 45 - Math.cos(morphPhase * 1.1) * 20

      return (
        <div
          key={i}
          style={{
            position: 'absolute',
            left: baseX + drift - size / 2,
            top: baseY + driftY - size / 2,
            width: size,
            height: size * (0.7 + rand(i * 17) * 0.5),
            borderRadius: `${br1}% ${br2}% ${br3}% ${br4}%`,
            background: `radial-gradient(ellipse at ${40 + Math.sin(t * 0.4 + i) * 10}% ${40 + Math.cos(t * 0.3 + i) * 10}%, hsla(${hue}, 70%, 55%, 0.3), hsla(${(hue + 30) % 360}, 60%, 45%, 0.15) 60%, transparent)`,
            border: `1px solid hsla(${hue}, 50%, 60%, 0.08)`,
          }}
        />
      )
    })

    // Flowing paint streams connecting cells
    const streams = Array.from({ length: 5 }, (_, i) => {
      const x = width * (0.1 + rand(i * 31) * 0.8)
      const y1 = height * rand(i * 47)
      const flow = Math.sin(t * 0.25 + i * 1.3) * 30
      const hue = CELL_HUES[(i + 2) % CELL_HUES.length]

      return (
        <div
          key={`s${i}`}
          style={{
            position: 'absolute',
            left: x + flow,
            top: y1,
            width: 20 + rand(i * 19) * 40,
            height: height * 0.3 + rand(i * 37) * height * 0.3,
            background: `linear-gradient(180deg, hsla(${hue}, 60%, 50%, 0.08), hsla(${(hue + 40) % 360}, 50%, 45%, 0.05), transparent)`,
            borderRadius: '40% 60% 55% 45%',
            filter: 'blur(10px)',
          }}
        />
      )
    })

    return (
      <div style={{ position: 'absolute', inset: 0, background: bgColor }}>
        {streams}
        {cells}
      </div>
    )
  },

  renderWord: ({ word, color, enterProgress, _holdProgress, exitProgress, phase, index, frame }: WordRenderProps) => {
    const f = frame ?? 0
    const t = f / 30

    const chars = word.split('').map((ch, ci) => {
      let charOpacity = 1
      let yOff = 0
      let xOff = 0
      let scaleX = 1
      let scaleY = 1
      let clipPercent = 100

      if (phase === 'enter') {
        // Poured paint reveals text: flows in from top like tilted canvas
        const delay = (ci / (word.length + 1)) * 0.3
        const p = Math.max(0, Math.min(1, (enterProgress - delay) / 0.7))
        const ep = easeOutQuint(p)

        clipPercent = ep * 100
        charOpacity = Math.min(1, ep * 1.5)
        // Fluid stretch as paint pours in
        scaleY = 1 + (1 - ep) * 0.2
        xOff = (1 - ep) * Math.sin(ci * 1.3 + index) * 15
      } else if (phase === 'hold') {
        // Organic cell-like undulation
        const wt = t * 1.2 + ci * 0.6
        yOff = Math.sin(wt) * 3
        xOff = Math.cos(wt * 0.7) * 2
        // Color cell shimmer
        scaleX = 1 + Math.sin(t * 1.8 + ci * 0.5) * 0.02
        scaleY = 1 - Math.sin(t * 1.8 + ci * 0.5) * 0.015
      } else {
        // Paint flows off canvas edge
        const delay = ((word.length - 1 - ci) / (word.length + 1)) * 0.3
        const p = Math.max(0, Math.min(1, (exitProgress - delay) / 0.7))
        const ep = easeInCubic(p)

        charOpacity = 1 - ep
        yOff = ep * 50
        scaleY = 1 + ep * 0.3
        scaleX = 1 - ep * 0.2
        clipPercent = (1 - ep) * 100
      }

      // Cell pattern overlay on each letter
      const cellGradient = `linear-gradient(${130 + ci * 20}deg, ${color}, ${color}CC 40%, ${color}88 70%, ${color}AA)`

      return (
        <span
          key={ci}
          style={{
            display: 'inline-block',
            color: 'transparent',
            background: cellGradient,
            WebkitBackgroundClip: 'text',
            backgroundClip: 'text',
            opacity: charOpacity,
            transform: `translate(${xOff}px, ${yOff}px) scaleX(${scaleX}) scaleY(${scaleY})`,
            transformOrigin: 'center top',
            clipPath: `inset(${100 - clipPercent}% 0 0 0)`,
            filter: `drop-shadow(0 2px 6px ${color}40)`,
          }}
        >
          {ch}
        </span>
      )
    })

    return (
      <div style={{ position: 'absolute', inset: 0 }}>
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            fontFamily: "'Impact', 'Arial Black', sans-serif",
            fontSize: 'clamp(46px, 13vw, 160px)',
            fontWeight: 900,
            whiteSpace: 'nowrap',
            letterSpacing: 4,
            textTransform: 'uppercase',
          }}
        >
          {chars}
        </div>
      </div>
    )
  },
}

function AcrylicPourComponent(props: MotionGraphicProps<AcrylicPourConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-acrylic-pour',
  title: 'Kinetic Acrylic Pour',
  description:
    'Fluid art acrylic pour with text revealed through flowing paint cells. Silicone cell patterns, organic flow, and vibrant color mixing on a tilted canvas.',
  tags: ['kinetic', 'typography', 'paint', 'acrylic', 'pour', 'fluid', 'cells', 'vibrant'],
  category: 'captions',
  component: AcrylicPourComponent as any,
  defaultConfig: {
    words: ['FLUID', 'CELL', 'POUR', 'FLOW'],
    colors: ['#E84393', '#6C5CE7', '#00B894', '#FDCB6E'],
    bgColor: '#131218',
    cycleDuration: 1.4,
  },
  configSchema: [
    {
      key: 'words',
      label: 'Words',
      type: 'text-array',
      defaultValue: ['FLUID', 'CELL', 'POUR', 'FLOW'],
      group: 'Content',
    },
    {
      key: 'colors',
      label: 'Colors',
      type: 'text-array',
      defaultValue: ['#E84393', '#6C5CE7', '#00B894', '#FDCB6E'],
      group: 'Style',
    },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#131218', group: 'Style' },
    {
      key: 'cycleDuration',
      label: 'Cycle Duration (s)',
      type: 'number',
      defaultValue: 1.4,
      min: 0.3,
      max: 5,
      group: 'Timing',
    },
  ],
})
