import { registerMotionGraphic } from '../registry'
import { KineticBase, type KineticBaseConfig, type KineticAnimation, type WordRenderProps, type BackgroundRenderProps } from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface OilPaletteConfig extends KineticBaseConfig {}

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

const PALETTE_DABS = [
  { color: 'rgba(200, 50, 30, 0.35)', x: 0.75, y: 0.2 },
  { color: 'rgba(30, 80, 160, 0.3)', x: 0.8, y: 0.35 },
  { color: 'rgba(220, 190, 40, 0.33)', x: 0.85, y: 0.5 },
  { color: 'rgba(30, 130, 60, 0.28)', x: 0.78, y: 0.65 },
  { color: 'rgba(180, 100, 40, 0.25)', x: 0.82, y: 0.78 },
]

const animation: KineticAnimation = {
  renderBackground: ({ bgColor, width, height, frame, fps }: BackgroundRenderProps) => {
    const t = frame / fps

    // Wooden palette surface in bottom right
    const paletteDabs = PALETTE_DABS.map((dab, i) => {
      const size = 25 + rand(i * 31) * 20
      const squish = Math.sin(t * 0.3 + i * 0.7) * 3
      return (
        <div
          key={`d${i}`}
          style={{
            position: 'absolute',
            right: width * (1 - dab.x) - size / 2,
            top: height * dab.y - size / 2,
            width: size + squish,
            height: size - squish * 0.5,
            borderRadius: '45% 55% 50% 50%',
            background: `radial-gradient(ellipse at 40% 40%, ${dab.color}, transparent 70%)`,
            boxShadow: `inset 0 -1px 3px rgba(0,0,0,0.1), 0 1px 2px rgba(0,0,0,0.08)`,
          }}
        />
      )
    })

    // Palette knife scrape marks on surface
    const scrapes = Array.from({ length: 8 }, (_, i) => {
      const x = width * rand(i * 43 + 1)
      const y = height * rand(i * 59 + 5)
      const w = 40 + rand(i * 23) * 100
      const angle = (rand(i * 37) - 0.5) * 40

      return (
        <div
          key={`s${i}`}
          style={{
            position: 'absolute',
            left: x,
            top: y,
            width: w,
            height: 3 + rand(i * 17) * 4,
            background: `rgba(255,255,255,${0.02 + rand(i * 47) * 0.03})`,
            transform: `rotate(${angle}deg)`,
            borderRadius: 2,
            boxShadow: '0 1px 1px rgba(0,0,0,0.05)',
          }}
        />
      )
    })

    // Mixed paint smears in center from palette knife work
    const smears = Array.from({ length: 4 }, (_, i) => {
      const x = width * (0.2 + rand(i * 51) * 0.4)
      const y = height * (0.3 + rand(i * 67) * 0.4)
      const w = 60 + rand(i * 29) * 80
      const h = 8 + rand(i * 41) * 12
      const hue = rand(i * 73) * 360
      const angle = (rand(i * 19) - 0.5) * 30

      return (
        <div
          key={`sm${i}`}
          style={{
            position: 'absolute',
            left: x,
            top: y,
            width: w,
            height: h,
            background: `linear-gradient(90deg, transparent, hsla(${hue}, 50%, 50%, 0.06), hsla(${(hue + 40) % 360}, 45%, 45%, 0.04), transparent)`,
            transform: `rotate(${angle}deg)`,
            borderRadius: 4,
          }}
        />
      )
    })

    return (
      <div style={{ position: 'absolute', inset: 0, background: bgColor }}>
        {scrapes}
        {smears}
        {paletteDabs}
        {/* Studio warm directional light */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: 'linear-gradient(135deg, rgba(255, 240, 200, 0.04) 0%, transparent 50%, rgba(0,0,0,0.06) 100%)',
          }}
        />
      </div>
    )
  },

  renderWord: ({ word, color, enterProgress, _holdProgress, exitProgress, phase, _index, frame }: WordRenderProps) => {
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
        // Palette knife scrapes letter onto canvas: horizontal sweep
        const delay = ci / (word.length + 1) * 0.35
        const p = Math.max(0, Math.min(1, (enterProgress - delay) / 0.65))
        const ep = easeOutQuart(p)

        charOpacity = Math.min(1, ep * 1.5)
        // Knife sweeps from right, thick paint builds up
        xOff = (1 - ep) * 50
        // Paint ridge builds height
        scaleY = 0.3 + ep * 0.7
        scaleX = 0.8 + ep * 0.2
        rotate = (1 - ep) * -8
      } else if (phase === 'hold') {
        // Studio light catches thick paint ridges
        const wt = t * 0.6 + ci * 0.4
        yOff = Math.sin(wt) * 1
        // Light angle shift on ridged surface
        rotate = Math.sin(t * 0.8 + ci * 0.5) * 0.5
      } else {
        // Knife scrapes paint away
        const delay = (word.length - 1 - ci) / (word.length + 1) * 0.3
        const p = Math.max(0, Math.min(1, (exitProgress - delay) / 0.7))
        const ep = easeInCubic(p)

        charOpacity = 1 - ep
        xOff = -ep * 60
        scaleY = 1 - ep * 0.6
        rotate = ep * 10
      }

      // Thick paint ridge with directional light
      const ridgeLight = `1px -2px 0 rgba(255,255,255,0.2), -1px 2px 0 rgba(0,0,0,0.2)`
      const paintDepth = `0 3px 4px rgba(0,0,0,0.15)`

      return (
        <span
          key={ci}
          style={{
            display: 'inline-block',
            color,
            opacity: charOpacity,
            transform: `translate(${xOff}px, ${yOff}px) scaleX(${scaleX}) scaleY(${scaleY}) rotate(${rotate}deg)`,
            transformOrigin: 'center bottom',
            textShadow: `${ridgeLight}, ${paintDepth}, 0 0 6px ${color}30`,
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
            letterSpacing: 5,
            textTransform: 'uppercase',
          }}
        >
          {chars}
        </div>
      </div>
    )
  },
}

function OilPaletteComponent(props: MotionGraphicProps<OilPaletteConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-oil-palette',
  title: 'Kinetic Oil Palette',
  description: 'Text scraped onto surface with palette knife, thick oil paint ridges catching studio light. Color dabs on a palette, directional knife strokes, and rich paint depth.',
  tags: ['kinetic', 'typography', 'paint', 'oil', 'palette', 'knife', 'studio', 'ridge'],
  category: 'captions',
  component: OilPaletteComponent as any,
  defaultConfig: {
    words: ['KNIFE', 'SCRAPE', 'THICK', 'BLEND'],
    colors: ['#C0392B', '#2980B9', '#D4AC0D', '#27AE60'],
    bgColor: '#1C1A15',
    cycleDuration: 1.3,
  },
  configSchema: [
    { key: 'words', label: 'Words', type: 'text-array', defaultValue: ['KNIFE', 'SCRAPE', 'THICK', 'BLEND'], group: 'Content' },
    { key: 'colors', label: 'Colors', type: 'text-array', defaultValue: ['#C0392B', '#2980B9', '#D4AC0D', '#27AE60'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#1C1A15', group: 'Style' },
    { key: 'cycleDuration', label: 'Cycle Duration (s)', type: 'number', defaultValue: 1.3, min: 0.3, max: 5, group: 'Timing' },
  ],
})
