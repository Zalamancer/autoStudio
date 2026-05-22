import { registerMotionGraphic } from '../registry'
import {
  KineticBase,
  type KineticBaseConfig,
  type KineticAnimation,
  type WordRenderProps,
  type BackgroundRenderProps,
} from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface WoodblockPressConfig extends KineticBaseConfig {}

function rand(s: number): number {
  const x = Math.sin(s * 127.1 + 311.7) * 43758.5453
  return x - Math.floor(x)
}

function easeOutExpo(t: number): number {
  return t === 1 ? 1 : 1 - Math.pow(2, -10 * t)
}

const animation: KineticAnimation = {
  renderBackground: ({ bgColor, frame, fps, width, height }: BackgroundRenderProps) => {
    const time = frame / fps

    // Wood grain lines — horizontal fiber patterns
    const grainLines = Array.from({ length: 18 }, (_, i) => {
      const y = (i / 18) * height
      const curve = Math.sin(i * 0.7) * 15
      const thickness = 1 + rand(i * 31) * 2
      const shade = rand(i * 47) * 0.04
      return (
        <div
          key={`g${i}`}
          style={{
            position: 'absolute',
            left: 0,
            top: y + curve,
            width: '100%',
            height: thickness,
            background: `rgba(80, 50, 20, ${0.06 + shade})`,
            borderRadius: 2,
            transform: `scaleX(${1 + Math.sin(i * 1.3) * 0.02})`,
            pointerEvents: 'none',
          }}
        />
      )
    })

    // Ink stain marks from previous pressings
    const inkStains = Array.from({ length: 5 }, (_, i) => {
      const x = rand(i * 67) * width
      const y = rand(i * 89) * height
      const size = 30 + rand(i * 43) * 60
      return (
        <div
          key={`ink${i}`}
          style={{
            position: 'absolute',
            left: x - size / 2,
            top: y - size / 2,
            width: size,
            height: size * (0.6 + rand(i * 29) * 0.8),
            borderRadius: `${30 + rand(i * 11) * 40}% ${40 + rand(i * 23) * 30}%`,
            background: `rgba(20, 10, 5, ${0.03 + rand(i * 53) * 0.02})`,
            mixBlendMode: 'multiply',
            pointerEvents: 'none',
          }}
        />
      )
    })

    return (
      <div style={{ position: 'absolute', inset: 0, background: bgColor, overflow: 'hidden' }}>
        {/* Paper fiber texture */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='p'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='5' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23p)'/%3E%3C/svg%3E")`,
            opacity: 0.04,
            mixBlendMode: 'multiply',
            pointerEvents: 'none',
          }}
        />
        {grainLines}
        {inkStains}
        {/* Aged paper edge darkening */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            boxShadow: 'inset 0 0 80px rgba(60, 30, 10, 0.15)',
            pointerEvents: 'none',
          }}
        />
      </div>
    )
  },

  renderWord: ({ word, color, enterProgress, holdProgress, exitProgress, phase, index, frame }: WordRenderProps) => {
    const f = frame ?? 0
    const time = f / 30

    // Per-character woodblock press animation
    const chars = word.split('').map((ch, ci) => {
      let charOpacity = 0
      let scaleY = 1
      let yOff = 0
      let inkSpread = 0 // Simulates ink bleeding from pressure

      if (phase === 'enter') {
        // Block presses down onto paper — each character stamps sequentially
        const delay = (ci / (word.length + 1)) * 0.5
        const p = Math.max(0, Math.min(1, (enterProgress - delay) / 0.5))

        if (p < 0.4) {
          // Pressing down — block approaches paper
          const pressP = p / 0.4
          charOpacity = pressP * 0.3
          scaleY = 1.6 - pressP * 0.6 // Block compresses as it hits
          yOff = (1 - pressP) * -20
        } else if (p < 0.6) {
          // Impact — ink transfers with slight squeeze
          const impactP = (p - 0.4) / 0.2
          charOpacity = 0.3 + impactP * 0.7
          scaleY = 1 + (1 - impactP) * 0.05
          inkSpread = impactP * 1
        } else {
          // Ink settles and bleeds slightly into paper fibers
          const settleP = easeOutExpo((p - 0.6) / 0.4)
          charOpacity = 1
          scaleY = 1
          inkSpread = 1 + settleP * 0.5
        }
      } else if (phase === 'hold') {
        charOpacity = 1
        inkSpread = 1.5
        // Ink subtly shifts as paper absorbs it — very slow bleed
        const bleed = Math.sin(time * 0.8 + ci * 1.1) * 0.3
        inkSpread += bleed
        // Paper fiber warp — letters shift microscopically
        yOff = Math.sin(time * 1.5 + ci * 0.9) * 0.4
      } else {
        // Block lifts — ink gets pulled up slightly, then letter fades with paper curl
        const delay = ((word.length - 1 - ci) / (word.length + 1)) * 0.4
        const p = Math.max(0, Math.min(1, (exitProgress - delay) / 0.6))

        if (p < 0.3) {
          // Block lifts, ink string between block and paper
          charOpacity = 1
          scaleY = 1 + p * 0.3
          inkSpread = 1.5 - p * 2
        } else {
          // Ink impression remains but fades as if paper curls away
          const fadeP = (p - 0.3) / 0.7
          charOpacity = 1 - fadeP * fadeP
          scaleY = 1 + 0.09 - fadeP * 0.09
          yOff = fadeP * 15
          inkSpread = Math.max(0, 1 - fadeP)
        }
      }

      // Ink texture effect — uneven edges from carved block
      const edgeRoughness = rand(ci * 37 + index * 13)
      const clipInset = edgeRoughness * 1.5

      return (
        <span
          key={ci}
          style={{
            display: 'inline-block',
            position: 'relative',
            color,
            opacity: charOpacity,
            transform: `translateY(${yOff}px) scaleY(${scaleY})`,
            transformOrigin: 'center bottom',
            textShadow: inkSpread > 0
              ? [
                  `${inkSpread * 0.5}px 0 ${inkSpread}px ${color}40`,
                  `${-inkSpread * 0.3}px ${inkSpread * 0.5}px ${inkSpread * 0.8}px ${color}30`,
                  `0 ${inkSpread}px ${inkSpread * 1.5}px ${color}20`,
                ].join(', ')
              : 'none',
            clipPath: `inset(${clipInset}% ${clipInset * 0.5}% 0 ${clipInset * 0.7}%)`,
            mixBlendMode: 'multiply',
          }}
        >
          {ch === ' ' ? '\u00A0' : ch}
        </span>
      )
    })

    return (
      <div style={{ position: 'absolute', inset: 0, overflow: 'hidden' }}>
        {/* Press registration marks — faint corner crosses */}
        {[0, 1, 2, 3].map(corner => {
          const isTop = corner < 2
          const isLeft = corner % 2 === 0
          return (
            <div
              key={corner}
              style={{
                position: 'absolute',
                [isTop ? 'top' : 'bottom']: '8%',
                [isLeft ? 'left' : 'right']: '8%',
                width: 16,
                height: 16,
                opacity: 0.1,
              }}
            >
              <div style={{ position: 'absolute', left: 7, top: 0, width: 2, height: 16, background: color }} />
              <div style={{ position: 'absolute', left: 0, top: 7, width: 16, height: 2, background: color }} />
            </div>
          )
        })}
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            fontFamily: "'Georgia', 'Garamond', 'Times New Roman', serif",
            fontSize: 'clamp(40px, 12vw, 160px)',
            fontWeight: 900,
            textTransform: 'uppercase',
            letterSpacing: 10,
            whiteSpace: 'nowrap',
          }}
        >
          {chars}
        </div>
      </div>
    )
  },
}

function WoodblockPressComponent(props: MotionGraphicProps<WoodblockPressConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-woodblock-press',
  title: 'Kinetic Woodblock Press',
  description:
    'Gutenberg-era woodblock letterpress with per-character press-down, ink transfer and bleed, paper fiber texture, carved block edge roughness, and registration marks',
  tags: ['kinetic', 'typography', 'woodblock', 'letterpress', 'print', 'ink', 'gutenberg', 'press', 'paper'],
  category: 'captions',
  component: WoodblockPressComponent as any,
  defaultConfig: {
    words: ['PRESS', 'PRINT', 'BLOCK', 'TYPE'],
    colors: ['#1A0A05', '#2B1510', '#0D0D0D', '#3B1A0A'],
    bgColor: '#F0E4D0',
    cycleDuration: 1.2,
  },
  configSchema: [
    {
      key: 'words',
      label: 'Words',
      type: 'text-array',
      defaultValue: ['PRESS', 'PRINT', 'BLOCK', 'TYPE'],
      group: 'Content',
    },
    {
      key: 'colors',
      label: 'Colors',
      type: 'text-array',
      defaultValue: ['#1A0A05', '#2B1510', '#0D0D0D', '#3B1A0A'],
      group: 'Style',
    },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#F0E4D0', group: 'Style' },
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
