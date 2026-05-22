import { registerMotionGraphic } from '../registry'
import {
  KineticBase,
  type KineticBaseConfig,
  type KineticAnimation,
  type WordRenderProps,
  type BackgroundRenderProps,
} from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface SandPourConfig extends KineticBaseConfig {
  grainCount: number
  pourAngle: number
}

function easeOutSine(t: number): number {
  return Math.sin((t * Math.PI) / 2)
}

function easeInQuad(t: number): number {
  return t * t
}

function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3)
}

function pseudo(seed: number): number {
  const x = Math.sin(seed * 127.1 + 311.7) * 43758.5453
  return x - Math.floor(x)
}

const SAND_COLORS = ['#E8C584', '#D4A853', '#C49040', '#B87D2E', '#F0D898', '#A86820']

const animation: KineticAnimation = {
  renderBackground: ({ bgColor }: BackgroundRenderProps) => (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        background: bgColor,
      }}
    >
      {/* Hourglass silhouette hint in corner */}
      <div
        style={{
          position: 'absolute',
          top: 12,
          right: 16,
          opacity: 0.15,
          fontSize: 28,
          lineHeight: 1,
          color: '#E8C584',
          fontFamily: 'serif',
        }}
      >
        ⌛
      </div>
    </div>
  ),

  renderWord: ({ word, color, enterProgress, exitProgress, phase, width, height, index }: WordRenderProps) => {
    const grainCount = 100
    const seed = index * 83

    let pourP = 0
    let disperseP = 0

    if (phase === 'enter') {
      pourP = enterProgress
    } else if (phase === 'hold') {
      pourP = 1
    } else {
      pourP = 1
      disperseP = exitProgress
    }

    const grains = []
    for (let i = 0; i < grainCount; i++) {
      const p0 = pseudo(seed + i * 23)
      const p1 = pseudo(seed + i * 13 + 1)
      const p2 = pseudo(seed + i * 7 + 2)
      const p3 = pseudo(seed + i * 5 + 3)
      const p4 = pseudo(seed + i * 3 + 4)

      // Pour from upper-left corner, raining diagonally
      const stagger = p3 * 0.6
      const localP = Math.max(0, Math.min(1, (pourP - stagger) / (1 - stagger)))
      const easedLocal = easeOutSine(localP)

      // Start: along a pour stream from top-right
      const streamX = width * 0.35 + (p0 - 0.5) * 60
      const streamY = -height * 0.5 - p1 * 30
      // Land: in a pile near word center
      const landX = (p2 - 0.5) * width * 0.65
      const landY = height * 0.2 + p1 * height * 0.25

      const curX = streamX + (landX - streamX) * easedLocal
      const curY = streamY + (landY - streamY) * easedLocal

      // Disperse outward on exit
      const exitX = curX + (p0 - 0.5) * width * 0.8
      const exitY = curY + height * 0.5 + p1 * height * 0.3

      const finalX = phase === 'exit' ? curX + (exitX - curX) * easeInQuad(disperseP) : curX
      const finalY = phase === 'exit' ? curY + (exitY - curY) * easeInQuad(disperseP) : curY

      const size = 2 + p2 * 4
      const gColor = SAND_COLORS[Math.floor(p4 * SAND_COLORS.length)]
      const opacity = Math.min(1, localP * 4) * (1 - disperseP * disperseP) * (0.7 + p0 * 0.3)

      grains.push(
        <div
          key={i}
          style={{
            position: 'absolute',
            left: '50%',
            top: '50%',
            width: size,
            height: size,
            borderRadius: 1,
            background: gColor,
            transform: `translate(calc(-50% + ${finalX}px), calc(-50% + ${finalY}px)) rotate(${p2 * 45}deg)`,
            opacity,
          }}
        />,
      )
    }

    // Pour stream — thin line from source
    const streamVisible = phase === 'enter' && enterProgress < 0.9
    const streamOpacity = streamVisible ? Math.min(1, enterProgress * 5) * Math.max(0, 1 - (enterProgress - 0.5) / 0.4) : 0

    // Word text revealed from bottom as sand piles up
    const textReveal = phase === 'enter' ? easeOutCubic(Math.max(0, (enterProgress - 0.4) / 0.6)) : phase === 'hold' ? 1 : 1 - disperseP

    return (
      <>
        {grains}
        {/* Pour stream line */}
        <svg
          style={{
            position: 'absolute',
            inset: 0,
            width: '100%',
            height: '100%',
            pointerEvents: 'none',
            opacity: streamOpacity,
          }}
        >
          <line
            x1={width * 0.85}
            y1={0}
            x2={width * 0.5}
            y2={height * 0.55}
            stroke="#D4A853"
            strokeWidth={3}
            strokeLinecap="round"
            strokeDasharray="4 4"
            opacity={0.5}
          />
        </svg>

        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            opacity: Math.max(0, textReveal),
            whiteSpace: 'nowrap',
            clipPath: `inset(${(1 - textReveal) * 100}% 0 0 0)`,
          }}
        >
          <span
            style={{
              fontFamily: "'Georgia', 'Times New Roman', serif",
              fontSize: 'clamp(52px, 13vw, 160px)',
              fontWeight: 700,
              color,
              letterSpacing: '0.05em',
              textTransform: 'uppercase',
              textShadow: `2px 2px 8px rgba(0,0,0,0.4)`,
            }}
          >
            {word}
          </span>
        </div>
      </>
    )
  },
}

function SandPourComponent(props: MotionGraphicProps<SandPourConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-sand-pour',
  title: 'Kinetic Sand Pour',
  description: 'Sand grains stream diagonally like an hourglass, piling up to form the word — then scatter away on exit.',
  tags: ['kinetic', 'typography', 'sand', 'pour', 'scatter', 'hourglass', 'accumulate', 'particles', 'assembly'],
  category: 'captions',
  component: SandPourComponent as any,
  defaultConfig: {
    words: ['TIME', 'FLOW', 'POUR', 'DRIFT'],
    colors: ['#E8C584', '#D4A853', '#F5DFA0', '#C49040'],
    bgColor: '#1C1008',
    cycleDuration: 2.0,
    grainCount: 100,
    pourAngle: 45,
  },
  configSchema: [
    { key: 'words', label: 'Words', type: 'text-array', defaultValue: ['TIME', 'FLOW', 'POUR', 'DRIFT'], group: 'Content' },
    { key: 'colors', label: 'Colors', type: 'text-array', defaultValue: ['#E8C584', '#D4A853', '#F5DFA0', '#C49040'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#1C1008', group: 'Style' },
    { key: 'cycleDuration', label: 'Cycle Duration (s)', type: 'number', defaultValue: 2.0, min: 0.5, max: 5, group: 'Timing' },
    { key: 'grainCount', label: 'Grain Count', type: 'number', defaultValue: 100, min: 30, max: 200, group: 'Animation' },
    { key: 'pourAngle', label: 'Pour Angle (deg)', type: 'number', defaultValue: 45, min: 0, max: 90, group: 'Animation' },
  ],
})
