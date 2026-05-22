import { registerMotionGraphic } from '../registry'
import {
  KineticBase,
  type KineticBaseConfig,
  type KineticAnimation,
  type WordRenderProps,
  type BackgroundRenderProps,
} from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface MarqueeBulbConfig extends KineticBaseConfig {}

function rand(s: number): number {
  const x = Math.sin(s * 127.1 + 311.7) * 43758.5453
  return x - Math.floor(x)
}

function easeOutQuart(t: number): number {
  return 1 - Math.pow(1 - t, 4)
}

const animation: KineticAnimation = {
  renderBackground: ({ bgColor, frame, fps, width, height }: BackgroundRenderProps) => {
    const time = frame / fps

    // Chaser bulbs around the border — warm tungsten dots that cycle
    const perimeterBulbs: { x: number; y: number }[] = []
    const spacing = 28
    const margin = 20

    // Top edge
    for (let x = margin; x < width - margin; x += spacing) {
      perimeterBulbs.push({ x, y: margin })
    }
    // Right edge
    for (let y = margin + spacing; y < height - margin; y += spacing) {
      perimeterBulbs.push({ x: width - margin, y })
    }
    // Bottom edge (reversed)
    for (let x = width - margin - spacing; x >= margin; x -= spacing) {
      perimeterBulbs.push({ x, y: height - margin })
    }
    // Left edge (reversed)
    for (let y = height - margin - spacing; y >= margin + spacing; y -= spacing) {
      perimeterBulbs.push({ x: margin, y })
    }

    const totalBulbs = perimeterBulbs.length
    const chaserSpeed = time * 8
    const chaserWidth = 6 // Number of bulbs lit in the chase sequence

    const bulbElements = perimeterBulbs.map((bulb, i) => {
      // Chase pattern — group of lit bulbs travels around the perimeter
      const chaserPos = (chaserSpeed + i) % totalBulbs
      const distFromChaser = Math.min(
        Math.abs(chaserPos - 0),
        Math.abs(chaserPos - totalBulbs)
      )
      const isInChase = (i + Math.floor(chaserSpeed)) % Math.max(1, Math.floor(totalBulbs / chaserWidth)) < 2
      const bulbBrightness = isInChase ? 1 : 0.2 + rand(i * 17) * 0.15

      return (
        <div
          key={`b${i}`}
          style={{
            position: 'absolute',
            left: bulb.x - 4,
            top: bulb.y - 4,
            width: 8,
            height: 8,
            borderRadius: '50%',
            background: `radial-gradient(circle at 40% 35%, rgba(255,240,200,${bulbBrightness}), rgba(255,180,50,${bulbBrightness * 0.7}) 60%, rgba(200,120,20,${bulbBrightness * 0.3}))`,
            boxShadow: bulbBrightness > 0.5
              ? `0 0 ${bulbBrightness * 8}px rgba(255,200,80,${bulbBrightness * 0.5}), 0 0 ${bulbBrightness * 16}px rgba(255,180,50,${bulbBrightness * 0.2})`
              : 'none',
          }}
        />
      )
    })

    return (
      <div style={{ position: 'absolute', inset: 0, background: bgColor, overflow: 'hidden' }}>
        {/* Theater facade — dark vertical paneling */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            backgroundImage:
              'repeating-linear-gradient(90deg, rgba(30,15,5,0.3) 0px, rgba(30,15,5,0.3) 2px, transparent 2px, transparent 60px)',
            pointerEvents: 'none',
          }}
        />
        {/* Warm ambient glow from bulbs onto ceiling/ground */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background:
              'linear-gradient(180deg, rgba(255,180,60,0.06) 0%, transparent 30%, transparent 70%, rgba(255,180,60,0.04) 100%)',
            mixBlendMode: 'screen',
            pointerEvents: 'none',
          }}
        />
        {/* Marquee sign panel — darker rectangle where text goes */}
        <div
          style={{
            position: 'absolute',
            top: '25%',
            left: '12%',
            right: '12%',
            bottom: '25%',
            background: 'rgba(0,0,0,0.3)',
            borderRadius: 4,
          }}
        />
        {bulbElements}
      </div>
    )
  },

  renderWord: ({ word, color, enterProgress, holdProgress, exitProgress, phase, index, frame }: WordRenderProps) => {
    const f = frame ?? 0
    const time = f / 30

    // Parse color for warm tungsten glow
    const r = parseInt(color.slice(1, 3), 16) || 255
    const g = parseInt(color.slice(3, 5), 16) || 200
    const b = parseInt(color.slice(5, 7), 16) || 80

    // Per-character letter-by-letter bulb lighting
    const chars = word.split('').map((ch, ci) => {
      let charOpacity = 0
      let glowRadius = 0
      let yOff = 0
      let warmth = 0 // 0 = cold filament, 1 = full tungsten glow

      if (phase === 'enter') {
        // Each letter's bulb warms up sequentially — filament heats to full glow
        const delay = (ci / word.length) * 0.65
        const p = Math.max(0, Math.min(1, (enterProgress - delay) / 0.35))

        if (p < 0.2) {
          // Filament barely visible — dim orange
          warmth = p * 2
          charOpacity = warmth * 0.3
          glowRadius = 0
        } else if (p < 0.5) {
          // Warming up — getting brighter
          warmth = 0.4 + ((p - 0.2) / 0.3) * 0.4
          charOpacity = warmth
          glowRadius = warmth * 4
        } else {
          // Full brightness with slight overshoot
          const fullP = easeOutQuart((p - 0.5) / 0.5)
          warmth = 0.8 + fullP * 0.2
          charOpacity = 1
          glowRadius = 8 + fullP * 4
          yOff = (1 - fullP) * -2
        }
      } else if (phase === 'hold') {
        charOpacity = 1
        warmth = 1
        // Tungsten filament subtle warm flicker — not digital, organic
        const flicker = 0.94 + Math.sin(time * 7 + ci * 2.3) * 0.03 + Math.sin(time * 11 + ci * 4.1) * 0.03
        charOpacity = flicker
        glowRadius = 10 + Math.sin(time * 3 + ci * 1.5) * 2
        // Heat shimmer
        yOff = Math.sin(time * 1.8 + ci * 0.7) * 0.6
      } else {
        // Bulbs cool down from last to first — filament fades from white to orange to dark
        const delay = ((word.length - 1 - ci) / word.length) * 0.5
        const p = Math.max(0, Math.min(1, (exitProgress - delay) / 0.5))

        if (p < 0.3) {
          // Still warm but dimming
          warmth = 1 - p * 1.5
          charOpacity = 1 - p * 0.5
          glowRadius = 10 * (1 - p)
        } else if (p < 0.7) {
          // Filament cooling — orange glow
          warmth = 0.55 - ((p - 0.3) / 0.4) * 0.45
          charOpacity = 0.85 - ((p - 0.3) / 0.4) * 0.5
          glowRadius = 5 * (1 - p)
        } else {
          // Nearly dark — faint ember
          const dimP = (p - 0.7) / 0.3
          warmth = 0.1 * (1 - dimP)
          charOpacity = 0.35 * (1 - dimP)
          glowRadius = 0
        }
      }

      // Color temperature shift: cold=orange, warm=bright white-yellow
      const tempR = Math.round(r * (0.6 + warmth * 0.4))
      const tempG = Math.round(g * (0.3 + warmth * 0.7))
      const tempB = Math.round(b * (0.1 + warmth * 0.9))

      return (
        <span
          key={ci}
          style={{
            display: 'inline-block',
            color: `rgb(${tempR},${tempG},${tempB})`,
            opacity: charOpacity,
            transform: `translateY(${yOff}px)`,
            textShadow: glowRadius > 0
              ? [
                  `0 0 ${glowRadius}px rgba(${tempR},${tempG},${tempB},0.8)`,
                  `0 0 ${glowRadius * 2}px rgba(255,180,60,0.4)`,
                  `0 ${glowRadius * 0.5}px ${glowRadius * 3}px rgba(255,150,30,0.15)`,
                ].join(', ')
              : `0 0 2px rgba(200,100,20,${warmth * 0.3})`,
            mixBlendMode: 'screen',
          }}
        >
          {ch === ' ' ? '\u00A0' : ch}
        </span>
      )
    })

    return (
      <div style={{ position: 'absolute', inset: 0, overflow: 'hidden' }}>
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            fontFamily: "'Impact', 'Arial Black', sans-serif",
            fontSize: 'clamp(40px, 12vw, 160px)',
            fontWeight: 900,
            textTransform: 'uppercase',
            letterSpacing: 12,
            whiteSpace: 'nowrap',
          }}
        >
          {chars}
        </div>
      </div>
    )
  },
}

function MarqueeBulbComponent(props: MotionGraphicProps<MarqueeBulbConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-marquee-bulb',
  title: 'Kinetic Marquee Bulb',
  description:
    'Drive-in movie marquee with warm tungsten bulbs lighting up letter by letter. Chaser bulb border, filament color temperature shifts from orange ember to bright white, and theater facade paneling.',
  tags: ['kinetic', 'typography', 'marquee', 'bulb', 'tungsten', 'drive-in', 'theater', 'cinema', 'retro'],
  category: 'captions',
  component: MarqueeBulbComponent as any,
  defaultConfig: {
    words: ['NOW', 'SHOWING', 'TONIGHT', 'FEATURE'],
    colors: ['#FFFAE0', '#FFE8A0', '#FFF5D0', '#FFEAB0'],
    bgColor: '#120808',
    cycleDuration: 1.3,
  },
  configSchema: [
    {
      key: 'words',
      label: 'Words',
      type: 'text-array',
      defaultValue: ['NOW', 'SHOWING', 'TONIGHT', 'FEATURE'],
      group: 'Content',
    },
    {
      key: 'colors',
      label: 'Colors',
      type: 'text-array',
      defaultValue: ['#FFFAE0', '#FFE8A0', '#FFF5D0', '#FFEAB0'],
      group: 'Style',
    },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#120808', group: 'Style' },
    {
      key: 'cycleDuration',
      label: 'Cycle Duration (s)',
      type: 'number',
      defaultValue: 1.3,
      min: 0.3,
      max: 5,
      group: 'Timing',
    },
  ],
})
