import { registerMotionGraphic } from '../registry'
import {
  KineticBase,
  type KineticBaseConfig,
  type KineticAnimation,
  type WordRenderProps,
  type BackgroundRenderProps,
} from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface GraffitiSprayConfig extends KineticBaseConfig {}

function rand(s: number): number {
  const x = Math.sin(s * 127.1 + 311.7) * 43758.5453
  return x - Math.floor(x)
}

function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3)
}

const animation: KineticAnimation = {
  renderBackground: ({ bgColor, frame, fps, width, height }: BackgroundRenderProps) => {
    const time = frame / fps

    // Concrete wall texture — layered blocks and cracks
    const concreteBlocks = Array.from({ length: 6 }, (_, i) => {
      const y = (i / 6) * height
      const shade = 25 + rand(i * 31) * 10
      return (
        <div
          key={`cb${i}`}
          style={{
            position: 'absolute',
            left: 0,
            top: y,
            width: '100%',
            height: height / 6 + 2,
            background: `rgb(${shade + 5}, ${shade + 3}, ${shade})`,
            borderBottom: '1px solid rgba(0,0,0,0.1)',
          }}
        />
      )
    })

    // Cracks in the wall
    const cracks = Array.from({ length: 4 }, (_, i) => {
      const startX = rand(i * 67) * width
      const startY = rand(i * 43) * height
      const angle = rand(i * 89) * 60 - 30
      const length = 40 + rand(i * 53) * 80
      return (
        <div
          key={`cr${i}`}
          style={{
            position: 'absolute',
            left: startX,
            top: startY,
            width: length,
            height: 1,
            background: 'rgba(0,0,0,0.12)',
            transform: `rotate(${angle}deg)`,
            transformOrigin: 'left center',
            pointerEvents: 'none',
          }}
        />
      )
    })

    // Old paint drips/stains on wall from previous tags
    const oldStains = Array.from({ length: 3 }, (_, i) => {
      const x = rand(i * 71) * width
      const y = rand(i * 37) * height * 0.4 + height * 0.3
      const stainHeight = 30 + rand(i * 59) * 60
      const hue = rand(i * 47) * 360
      return (
        <div
          key={`os${i}`}
          style={{
            position: 'absolute',
            left: x,
            top: y,
            width: 4 + rand(i * 29) * 8,
            height: stainHeight,
            background: `linear-gradient(180deg, hsla(${hue},40%,40%,0.08), hsla(${hue},40%,40%,0.02))`,
            borderRadius: '2px 2px 50% 50%',
            pointerEvents: 'none',
          }}
        />
      )
    })

    return (
      <div style={{ position: 'absolute', inset: 0, background: bgColor, overflow: 'hidden' }}>
        {concreteBlocks}
        {cracks}
        {oldStains}
        {/* Concrete roughness texture overlay */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='w'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='1.2' numOctaves='6' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23w)'/%3E%3C/svg%3E")`,
            opacity: 0.08,
            mixBlendMode: 'multiply',
            pointerEvents: 'none',
          }}
        />
        {/* Dirty light from above — streetlight feel */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: 'linear-gradient(180deg, rgba(255,230,180,0.04) 0%, transparent 40%, rgba(0,0,0,0.15) 100%)',
            pointerEvents: 'none',
          }}
        />
      </div>
    )
  },

  renderWord: ({ word, color, enterProgress, holdProgress, exitProgress, phase, index, frame, height }: WordRenderProps) => {
    const f = frame ?? 0
    const time = f / 30

    // Parse hex color
    const cR = parseInt(color.slice(1, 3), 16) || 255
    const cG = parseInt(color.slice(3, 5), 16) || 50
    const cB = parseInt(color.slice(5, 7), 16) || 50

    // Per-character spray can animation with drips
    const chars = word.split('').map((ch, ci) => {
      let charOpacity = 0
      let sprayRadius = 0 // Blur around edges simulating overspray
      let clipBottom = 100 // Reveal from top as spray sweeps down
      let xOff = 0
      let scaleX = 1

      if (phase === 'enter') {
        // Spray can sweeps across — each letter sprayed left to right
        const delay = (ci / (word.length + 1)) * 0.55
        const p = Math.max(0, Math.min(1, (enterProgress - delay) / 0.45))
        const ep = easeOutCubic(p)

        // Spray reveals top-to-bottom as nozzle sweeps over letter
        clipBottom = ep * 100
        charOpacity = Math.min(1, ep * 1.5)
        // Spray mist from can — wider at start, tighter as it lands
        sprayRadius = Math.max(0, (1 - ep) * 4)
        // Spray nozzle approach from left
        xOff = (1 - ep) * 15
        // Stencil edges slightly compressed at reveal
        scaleX = 0.85 + ep * 0.15
      } else if (phase === 'hold') {
        charOpacity = 1
        clipBottom = 100
        // Paint is wet — subtle drip formation shimmer
        sprayRadius = 0.5 + Math.sin(time * 2 + ci * 0.9) * 0.3
        // Slight vibration as if the wall is near a road
        xOff = Math.sin(time * 3 + ci * 1.6) * 0.3
      } else {
        // Paint gets buffed/washed — dissolves with overspray expanding
        const delay = (ci / (word.length + 1)) * 0.4
        const p = Math.max(0, Math.min(1, (exitProgress - delay) / 0.6))

        charOpacity = 1 - p * p
        sprayRadius = p * 8
        // Spray disperses outward
        scaleX = 1 + p * 0.3
        xOff = p * (ci % 2 === 0 ? 5 : -5)
      }

      return (
        <span
          key={ci}
          style={{
            display: 'inline-block',
            position: 'relative',
            color,
            opacity: charOpacity,
            transform: `translateX(${xOff}px) scaleX(${scaleX})`,
            clipPath: `inset(0 0 ${100 - clipBottom}% 0)`,
            filter: sprayRadius > 0 ? `blur(${sprayRadius}px)` : undefined,
            textShadow: `0 0 3px ${color}80, 0 0 8px rgba(${cR},${cG},${cB},0.3)`,
            mixBlendMode: 'hard-light',
          }}
        >
          {ch === ' ' ? '\u00A0' : ch}
        </span>
      )
    })

    // Paint drips below letters — appear during hold/exit
    const drips = (phase === 'hold' || phase === 'exit') ? word.split('').map((ch, ci) => {
      // Not every letter drips
      if (rand(ci * 41 + index * 17) > 0.4) return null

      const dripLength = 10 + rand(ci * 53 + index * 23) * 40
      const dripProgress = phase === 'hold'
        ? Math.min(1, holdProgress * 2)
        : 1
      const dripOpacity = phase === 'exit' ? Math.max(0, 1 - exitProgress * 1.5) : 0.7
      const charWidth = 40 // Approximate
      const dripX = ci * charWidth + rand(ci * 37) * 10 - 5

      return (
        <div
          key={`drip${ci}`}
          style={{
            position: 'absolute',
            left: `calc(50% - ${(word.length * charWidth) / 2}px + ${dripX}px + ${charWidth * 0.4}px)`,
            top: '60%',
            width: 2 + rand(ci * 19) * 3,
            height: dripLength * dripProgress,
            background: `linear-gradient(180deg, ${color}90, ${color}40, ${color}10)`,
            borderRadius: '1px 1px 50% 50%',
            opacity: dripOpacity,
            mixBlendMode: 'hard-light',
            pointerEvents: 'none',
          }}
        />
      )
    }) : null

    // Overspray mist particles around letters
    const mistParticles = phase === 'enter' ? Array.from({ length: 8 }, (_, i) => {
      const pDelay = rand(i * 61) * 0.6
      const p = Math.max(0, Math.min(1, (enterProgress - pDelay) / 0.4))
      if (p <= 0) return null

      const px = (rand(i * 73) - 0.5) * 200
      const py = (rand(i * 37) - 0.5) * 100
      const size = 3 + rand(i * 29) * 6

      return (
        <div
          key={`m${i}`}
          style={{
            position: 'absolute',
            left: `calc(50% + ${px}px)`,
            top: `calc(50% + ${py}px)`,
            width: size,
            height: size,
            borderRadius: '50%',
            background: `rgba(${cR},${cG},${cB},${0.15 * (1 - p)})`,
            filter: 'blur(2px)',
            pointerEvents: 'none',
          }}
        />
      )
    }) : null

    return (
      <div style={{ position: 'absolute', inset: 0, overflow: 'hidden' }}>
        {mistParticles}
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            fontFamily: "'Impact', 'Arial Black', sans-serif",
            fontSize: 'clamp(40px, 12vw, 160px)',
            fontWeight: 900,
            fontStyle: 'italic',
            textTransform: 'uppercase',
            letterSpacing: 4,
            whiteSpace: 'nowrap',
          }}
        >
          {chars}
        </div>
        {drips}
      </div>
    )
  },
}

function GraffitiSprayComponent(props: MotionGraphicProps<GraffitiSprayConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-graffiti-spray',
  title: 'Kinetic Graffiti Spray',
  description:
    'Street graffiti with spray can texture revealing per-character left to right, overspray mist, paint drip effects, stencil edges, on a cracked concrete wall with old tag stains.',
  tags: ['kinetic', 'typography', 'graffiti', 'spray', 'street', 'urban', 'drip', 'stencil', 'concrete'],
  category: 'captions',
  component: GraffitiSprayComponent as any,
  defaultConfig: {
    words: ['REBEL', 'FRESH', 'URBAN', 'WILD'],
    colors: ['#FF2244', '#00CC88', '#FFAA00', '#6633FF'],
    bgColor: '#2A2A28',
    cycleDuration: 1.2,
  },
  configSchema: [
    {
      key: 'words',
      label: 'Words',
      type: 'text-array',
      defaultValue: ['REBEL', 'FRESH', 'URBAN', 'WILD'],
      group: 'Content',
    },
    {
      key: 'colors',
      label: 'Colors',
      type: 'text-array',
      defaultValue: ['#FF2244', '#00CC88', '#FFAA00', '#6633FF'],
      group: 'Style',
    },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#2A2A28', group: 'Style' },
    {
      key: 'cycleDuration',
      label: 'Cycle Duration (s)',
      type: 'number',
      defaultValue: 1.2,
      min: 0.3,
      max: 5,
      group: 'Timing',
    },
  ],
})
