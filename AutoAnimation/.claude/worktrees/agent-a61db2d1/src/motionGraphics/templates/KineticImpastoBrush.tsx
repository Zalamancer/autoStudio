import { registerMotionGraphic } from '../registry'
import {
  KineticBase,
  type KineticBaseConfig,
  type KineticAnimation,
  type WordRenderProps,
  type BackgroundRenderProps,
} from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface ImpastoBrushConfig extends KineticBaseConfig {}

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

const PIGMENT_COLORS = [
  'rgba(180, 50, 30, 0.25)',
  'rgba(40, 80, 120, 0.2)',
  'rgba(200, 170, 50, 0.22)',
  'rgba(60, 100, 50, 0.18)',
  'rgba(140, 60, 100, 0.2)',
]

const animation: KineticAnimation = {
  renderBackground: ({ bgColor, width, height, frame, fps }: BackgroundRenderProps) => {
    const t = frame / fps

    // Thick impasto brushstroke ridges across canvas
    const strokes = Array.from({ length: 8 }, (_, i) => {
      const yBase = height * (0.08 + i * 0.12)
      const angle = (rand(i * 23) - 0.5) * 12
      const strokeW = width * (0.5 + rand(i * 41) * 0.6)
      const strokeH = 18 + rand(i * 13) * 30
      const xOff = width * (rand(i * 59) * 0.6 - 0.1)
      const colorIdx = i % PIGMENT_COLORS.length
      const shimmer = Math.sin(t * 0.3 + i * 1.1) * 0.03

      return (
        <div
          key={i}
          style={{
            position: 'absolute',
            left: xOff,
            top: yBase,
            width: strokeW,
            height: strokeH,
            background: PIGMENT_COLORS[colorIdx],
            borderRadius: `${4 + rand(i * 7) * 8}px`,
            transform: `rotate(${angle}deg)`,
            opacity: 0.6 + shimmer,
            boxShadow: `0 1px 3px rgba(0,0,0,0.15), inset 0 -1px 2px rgba(255,255,255,${0.08 + shimmer})`,
          }}
        />
      )
    })

    // Palette knife scrape texture lines
    const scrapes = Array.from({ length: 12 }, (_, i) => {
      const yBase = height * rand(i * 67 + 3)
      const xBase = width * rand(i * 31 + 7)
      const w = 40 + rand(i * 19) * 120
      return (
        <div
          key={`s${i}`}
          style={{
            position: 'absolute',
            left: xBase,
            top: yBase,
            width: w,
            height: 2,
            background: `rgba(255,255,255,${0.03 + rand(i * 47) * 0.04})`,
            transform: `rotate(${(rand(i * 53) - 0.5) * 20}deg)`,
            borderRadius: 1,
          }}
        />
      )
    })

    return (
      <div style={{ position: 'absolute', inset: 0, background: bgColor }}>
        {/* Linen canvas texture */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background:
              'repeating-linear-gradient(0deg, transparent, transparent 3px, rgba(255,255,255,0.012) 3px, rgba(255,255,255,0.012) 4px), repeating-linear-gradient(90deg, transparent, transparent 3px, rgba(255,255,255,0.01) 3px, rgba(255,255,255,0.01) 4px)',
          }}
        />
        {strokes}
        {scrapes}
        {/* Gallery warm spotlight */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: 'radial-gradient(ellipse at 50% 30%, rgba(255, 240, 200, 0.06), transparent 65%)',
          }}
        />
      </div>
    )
  },

  renderWord: ({ word, color, enterProgress, exitProgress, phase, frame }: WordRenderProps) => {
    const f = frame ?? 0
    const t = f / 30

    const chars = word.split('').map((ch, ci) => {
      let charOpacity = 1
      let yOff = 0
      let xOff = 0
      let scaleX = 1
      let scaleY = 1
      let rotate = 0

      if (phase === 'enter') {
        // Thick brushstroke builds each letter: sweeping from left
        const delay = (ci / (word.length + 1)) * 0.4
        const p = Math.max(0, Math.min(1, (enterProgress - delay) / 0.6))
        const ep = easeOutQuart(p)

        charOpacity = Math.min(1, ep * 1.5)
        // Brush sweeps in from left with rotation
        xOff = -(1 - ep) * 60
        rotate = (1 - ep) * 15
        // Impasto buildup: scale from thin to thick
        scaleX = 0.3 + ep * 0.7
        scaleY = 0.8 + ep * 0.2
      } else if (phase === 'hold') {
        // Subtle gallery lighting shift on ridged paint
        const wt = t * 0.8 + ci * 0.3
        yOff = Math.sin(wt) * 1.5
        // Palette knife ridge shimmer
        rotate = Math.sin(t * 1.2 + ci * 0.7) * 0.8
      } else {
        // Scrape away with palette knife
        const delay = (ci / (word.length + 1)) * 0.3
        const p = Math.max(0, Math.min(1, (exitProgress - delay) / 0.7))
        const ep = easeInCubic(p)

        charOpacity = 1 - ep
        xOff = ep * 70
        rotate = ep * -12
        scaleX = 1 + ep * 0.3
        scaleY = 1 - ep * 0.4
      }

      // Paint ridge highlights
      const ridgeHighlight = `0 -2px 0 rgba(255,255,255,0.15), 0 2px 0 rgba(0,0,0,0.2)`
      const paintGlow = `0 0 8px ${color}40`

      return (
        <span
          key={ci}
          style={{
            display: 'inline-block',
            color,
            opacity: charOpacity,
            transform: `translate(${xOff}px, ${yOff}px) scaleX(${scaleX}) scaleY(${scaleY}) rotate(${rotate}deg)`,
            transformOrigin: 'center bottom',
            textShadow: `${ridgeHighlight}, ${paintGlow}`,
            WebkitTextStroke: '0.5px rgba(0,0,0,0.15)',
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
            fontFamily: "'Georgia', 'Palatino', serif",
            fontSize: 'clamp(44px, 12vw, 155px)',
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

function ImpastoBrushComponent(props: MotionGraphicProps<ImpastoBrushConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-impasto-brush',
  title: 'Kinetic Impasto Brush',
  description:
    'Thick impasto oil paint brushstrokes build letter forms with visible palette knife ridges and heavy paint texture under gallery lighting.',
  tags: ['kinetic', 'typography', 'paint', 'impasto', 'oil', 'brush', 'gallery', 'texture'],
  category: 'captions',
  component: ImpastoBrushComponent as any,
  defaultConfig: {
    words: ['PAINT', 'LAYER', 'RIDGE', 'THICK'],
    colors: ['#C84B31', '#2B6777', '#D4A843', '#5C8A4D'],
    bgColor: '#1C1A17',
    cycleDuration: 1.4,
  },
  configSchema: [
    {
      key: 'words',
      label: 'Words',
      type: 'text-array',
      defaultValue: ['PAINT', 'LAYER', 'RIDGE', 'THICK'],
      group: 'Content',
    },
    {
      key: 'colors',
      label: 'Colors',
      type: 'text-array',
      defaultValue: ['#C84B31', '#2B6777', '#D4A843', '#5C8A4D'],
      group: 'Style',
    },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#1C1A17', group: 'Style' },
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
