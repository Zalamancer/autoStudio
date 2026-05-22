import { registerMotionGraphic } from '../registry'
import { KineticBase, type KineticBaseConfig, type KineticAnimation, type WordRenderProps, type BackgroundRenderProps } from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface MarbleVeinConfig extends KineticBaseConfig {}

function seededRand(seed: number): number {
  const x = Math.sin(seed * 127.1 + 311.7) * 43758.5453
  return x - Math.floor(x)
}

const animation: KineticAnimation = {
  renderBackground: ({ bgColor, width, height, frame }: BackgroundRenderProps) => {
    // Marble veins flowing across the background
    const veinCount = 6
    const veins = Array.from({ length: veinCount }, (_, i) => {
      const yBase = (height / (veinCount + 1)) * (i + 1)
      const drift = Math.sin(frame * 0.01 + i * 1.7) * 15
      const x1 = -10
      const y1 = yBase + drift + seededRand(i * 31) * 30 - 15
      const cx1 = width * 0.25 + seededRand(i * 47 + 1) * width * 0.15
      const cy1 = yBase + drift + (seededRand(i * 59 + 2) * 60 - 30)
      const cx2 = width * 0.65 + seededRand(i * 71 + 3) * width * 0.15
      const cy2 = yBase + drift + (seededRand(i * 83 + 4) * 60 - 30)
      const x2 = width + 10
      const y2 = yBase + drift + seededRand(i * 97 + 5) * 30 - 15
      const opacity = 0.03 + seededRand(i * 109) * 0.05
      const strokeW = 0.5 + seededRand(i * 113) * 1.5
      return { x1, y1, cx1, cy1, cx2, cy2, x2, y2, opacity, strokeW }
    })

    return (
      <div style={{ position: 'absolute', inset: 0, background: bgColor }}>
        {/* Subtle warm gradient overlay */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: 'radial-gradient(ellipse at 30% 40%, rgba(180,160,140,0.06) 0%, transparent 60%), radial-gradient(ellipse at 70% 70%, rgba(160,140,120,0.04) 0%, transparent 50%)',
            pointerEvents: 'none',
          }}
        />
        {/* Marble veins */}
        <svg width={width} height={height} style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
          {veins.map((v, i) => (
            <path
              key={i}
              d={`M ${v.x1} ${v.y1} C ${v.cx1} ${v.cy1}, ${v.cx2} ${v.cy2}, ${v.x2} ${v.y2}`}
              fill="none"
              stroke={`rgba(120,100,80,${v.opacity})`}
              strokeWidth={v.strokeW}
            />
          ))}
          {/* Secondary thin veins */}
          {veins.slice(0, 3).map((v, i) => (
            <path
              key={`sub-${i}`}
              d={`M ${v.x1 + 5} ${v.y1 + 8} C ${v.cx1 - 20} ${v.cy1 + 12}, ${v.cx2 + 15} ${v.cy2 - 8}, ${v.x2 - 5} ${v.y2 + 6}`}
              fill="none"
              stroke={`rgba(120,100,80,${v.opacity * 0.5})`}
              strokeWidth={v.strokeW * 0.5}
            />
          ))}
        </svg>
        {/* Polished surface sheen */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: `linear-gradient(135deg, rgba(255,255,255,0.02) 0%, transparent 40%, rgba(255,255,255,0.015) 60%, transparent 100%)`,
            pointerEvents: 'none',
          }}
        />
      </div>
    )
  },

  renderWord: ({ word, color, enterProgress, holdProgress, exitProgress, phase, index, frame }: WordRenderProps) => {
    const f = frame ?? 0

    if (phase === 'enter') {
      // Marble slab slides in from below with polish reveal
      const eased = 1 - Math.pow(1 - enterProgress, 3)
      const slideY = (1 - eased) * 60
      const opacity = eased

      // Vein animation across text during enter
      const veinX = enterProgress * 120 - 10

      return (
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: `translate(-50%, calc(-50% + ${slideY}px))`,
            opacity,
          }}
        >
          <div
            style={{
              fontFamily: "'Georgia', 'Times New Roman', serif",
              fontSize: 'clamp(46px, 12vw, 160px)',
              fontWeight: 400,
              color,
              textTransform: 'uppercase',
              letterSpacing: 10,
              whiteSpace: 'nowrap',
              textShadow: '1px 1px 0 rgba(0,0,0,0.08)',
            }}
          >
            {word}
          </div>
          {/* Animated vein line crossing text */}
          <div
            style={{
              position: 'absolute',
              top: '30%',
              left: `${veinX}%`,
              width: 2,
              height: '40%',
              background: `linear-gradient(180deg, transparent, rgba(160,140,110,0.2), transparent)`,
              transform: 'rotate(15deg)',
              pointerEvents: 'none',
            }}
          />
        </div>
      )
    } else if (phase === 'hold') {
      // Elegant hold with subtle surface shimmer
      const shimmerX = 30 + Math.sin(holdProgress * Math.PI * 2) * 25

      return (
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
          }}
        >
          <div
            style={{
              fontFamily: "'Georgia', 'Times New Roman', serif",
              fontSize: 'clamp(46px, 12vw, 160px)',
              fontWeight: 400,
              color,
              textTransform: 'uppercase',
              letterSpacing: 10,
              whiteSpace: 'nowrap',
              textShadow: '1px 1px 0 rgba(0,0,0,0.08)',
              position: 'relative',
            }}
          >
            {word}
          </div>
          {/* Polished shimmer highlight */}
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: `${shimmerX}%`,
              width: '15%',
              height: '100%',
              background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.06), transparent)',
              pointerEvents: 'none',
            }}
          />
          {/* Decorative line below */}
          <div
            style={{
              position: 'absolute',
              bottom: -10,
              left: '25%',
              right: '25%',
              height: 1,
              background: `${color}30`,
            }}
          />
        </div>
      )
    } else {
      // Exit: elegant fade with upward drift
      const eased = exitProgress * exitProgress
      const driftY = -eased * 30
      const opacity = 1 - eased

      return (
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: `translate(-50%, calc(-50% + ${driftY}px))`,
            opacity,
          }}
        >
          <div
            style={{
              fontFamily: "'Georgia', 'Times New Roman', serif",
              fontSize: 'clamp(46px, 12vw, 160px)',
              fontWeight: 400,
              color,
              textTransform: 'uppercase',
              letterSpacing: 10,
              whiteSpace: 'nowrap',
              textShadow: '1px 1px 0 rgba(0,0,0,0.08)',
            }}
          >
            {word}
          </div>
        </div>
      )
    }
  },
}

function MarbleVeinComponent(props: MotionGraphicProps<MarbleVeinConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-marble-vein',
  title: 'Kinetic Marble Vein',
  description: 'Elegant marble-textured text with flowing vein lines, polished surface shimmer, serif typography, and smooth slide entrance',
  tags: ['kinetic', 'typography', 'marble', 'luxury', 'architecture', 'elegant', 'stone', 'interior'],
  category: 'captions',
  component: MarbleVeinComponent as any,
  defaultConfig: {
    words: ['LUXE', 'STONE', 'VEIN', 'PURE'],
    colors: ['#3A3530', '#4A4540', '#3A3530', '#4A4540'],
    bgColor: '#F0EBE3',
    cycleDuration: 1.4,
  },
  configSchema: [
    { key: 'words', label: 'Words', type: 'text-array', defaultValue: ['LUXE', 'STONE', 'VEIN', 'PURE'], group: 'Content' },
    { key: 'colors', label: 'Colors', type: 'text-array', defaultValue: ['#3A3530', '#4A4540'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#F0EBE3', group: 'Style' },
    { key: 'cycleDuration', label: 'Cycle Duration (s)', type: 'number', defaultValue: 1.4, min: 0.3, max: 5, group: 'Timing' },
  ],
})
