import { registerMotionGraphic } from '../registry'
import {
  KineticBase,
  type KineticBaseConfig,
  type KineticAnimation,
  type WordRenderProps,
  type BackgroundRenderProps,
} from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface PortholeConfig extends KineticBaseConfig {
  boltCount: number
}

function easeOutElastic(t: number): number {
  if (t === 0) return 0
  if (t === 1) return 1
  const c4 = (2 * Math.PI) / 3
  return Math.pow(2, -10 * t) * Math.sin((t * 10 - 0.75) * c4) + 1
}

function easeInOutQuad(t: number): number {
  return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2
}

// Circular porthole: heavy steel door swings open, revealing text through round window
const animation: KineticAnimation = {
  renderBackground: ({ bgColor, width, height }: BackgroundRenderProps) => {
    const config = (globalThis as any).__portholeConfig ?? { boltCount: 8 }
    const boltCount = config.boltCount ?? 8
    const minDim = Math.min(width, height)
    const portholeR = minDim * 0.38
    const boltR = 6

    const bolts = Array.from({ length: boltCount }, (_, i) => {
      const angle = (i / boltCount) * 2 * Math.PI - Math.PI / 2
      const boltDist = portholeR * 1.22
      const bx = width / 2 + Math.cos(angle) * boltDist
      const by = height / 2 + Math.sin(angle) * boltDist
      return { bx, by, angle }
    })

    return (
      <div style={{ position: 'absolute', inset: 0, background: bgColor }}>
        {/* Steel plate texture */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: `repeating-linear-gradient(
              45deg,
              rgba(255,255,255,0.01) 0px,
              rgba(255,255,255,0.01) 1px,
              transparent 1px,
              transparent 8px
            )`,
          }}
        />
        {/* Porthole bolts SVG */}
        <svg
          style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}
          width={width}
          height={height}
        >
          {bolts.map(({ bx, by }, i) => (
            <g key={i}>
              <circle cx={bx} cy={by} r={boltR + 3} fill="rgba(80,70,60,0.7)" />
              <circle cx={bx} cy={by} r={boltR} fill="rgba(140,130,110,0.8)" />
              <circle cx={bx} cy={by} r={boltR - 2} fill="rgba(100,95,80,0.9)" />
              <line
                x1={bx - 2}
                y1={by}
                x2={bx + 2}
                y2={by}
                stroke="rgba(60,50,40,0.8)"
                strokeWidth={1.5}
              />
            </g>
          ))}
        </svg>
      </div>
    )
  },

  renderWord: ({ word, color, enterProgress, exitProgress, phase, width, height }: WordRenderProps) => {
    const config = (globalThis as any).__portholeConfig ?? { boltCount: 8 }
    const boltCount = config.boltCount ?? 8
    const minDim = Math.min(width, height)
    const portholeR = minDim * 0.38

    // Porthole door swings open: circle clip expands from 0 to portholeR (then stays)
    let openProgress = 0
    if (phase === 'enter') {
      openProgress = easeOutElastic(enterProgress)
    } else if (phase === 'hold') {
      openProgress = 1
    } else {
      openProgress = 1 - easeInOutQuad(exitProgress)
    }

    const clipR = Math.max(0, openProgress * portholeR)
    const clipPath = clipR > 0.5
      ? `circle(${clipR.toFixed(1)}px at 50% 50%)`
      : 'circle(0px at 50% 50%)'

    // Porthole door panel: starts covering the circle, swings away (scale Y from 1 to 0)
    // We simulate door swing as a scaleX transition on the heavy door
    const doorScaleX = Math.max(0, 1 - openProgress * 1.1)
    const doorOpacity = Math.max(0, doorScaleX)

    // Bolt ring
    const bolts = Array.from({ length: boltCount }, (_, i) => {
      const angle = (i / boltCount) * 2 * Math.PI - Math.PI / 2
      const boltDist = portholeR * 1.22
      const bx = width / 2 + Math.cos(angle) * boltDist
      const by = height / 2 + Math.sin(angle) * boltDist
      return { bx, by }
    })

    return (
      <>
        {/* Sea/other side visible through porthole — colored bg */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            clipPath,
            background: `radial-gradient(circle at 50% 50%, ${color}18 0%, transparent 70%)`,
          }}
        />
        {/* Text through porthole opening */}
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            fontFamily: "'Inter', 'Helvetica Neue', sans-serif",
            fontSize: 'clamp(36px, 10vw, 140px)',
            fontWeight: 800,
            color,
            whiteSpace: 'nowrap',
            letterSpacing: '0.04em',
            textTransform: 'uppercase',
            clipPath,
          }}
        >
          {word}
        </div>
        {/* Porthole door — swings away */}
        {doorOpacity > 0.01 && (
          <div
            style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: `translate(-50%, -50%) scaleX(${doorScaleX.toFixed(3)})`,
              transformOrigin: 'left center',
              width: portholeR * 2,
              height: portholeR * 2,
              borderRadius: '50%',
              background: 'linear-gradient(135deg, rgba(100,90,70,0.96) 0%, rgba(70,60,45,0.98) 60%, rgba(50,42,30,0.98) 100%)',
              opacity: doorOpacity,
            }}
          />
        )}
        {/* Porthole frame ring */}
        <svg
          style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}
          width={width}
          height={height}
        >
          {/* Inner gasket */}
          <circle
            cx={width / 2}
            cy={height / 2}
            r={portholeR * 1.04}
            fill="none"
            stroke="rgba(80,70,55,0.9)"
            strokeWidth={6}
          />
          {/* Outer flange */}
          <circle
            cx={width / 2}
            cy={height / 2}
            r={portholeR * 1.18}
            fill="none"
            stroke="rgba(110,100,80,0.6)"
            strokeWidth={3}
          />
          {/* Glass rim highlight */}
          <circle
            cx={width / 2}
            cy={height / 2}
            r={portholeR}
            fill="none"
            stroke="rgba(200,195,180,0.2)"
            strokeWidth={2}
          />
          {/* Bolts */}
          {bolts.map(({ bx, by }, i) => (
            <g key={i}>
              <circle cx={bx} cy={by} r={7} fill="rgba(80,70,60,0.7)" />
              <circle cx={bx} cy={by} r={5} fill="rgba(140,130,110,0.8)" />
              <circle cx={bx} cy={by} r={3} fill="rgba(100,95,80,0.9)" />
            </g>
          ))}
        </svg>
      </>
    )
  },
}

function PortholeComponent(props: MotionGraphicProps<PortholeConfig>) {
  ;(globalThis as any).__portholeConfig = props.config
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-porthole',
  title: 'Kinetic Porthole',
  description: 'Steel ship porthole door swings open with elastic rebound, revealing text through the round window opening',
  tags: ['kinetic', 'typography', 'porthole', 'ship', 'nautical', 'door', 'reveal', 'mechanical', 'aperture', 'circular'],
  category: 'captions',
  component: PortholeComponent as any,
  defaultConfig: {
    words: ['VOYAGE', 'ANCHOR', 'DEPTH', 'SAIL'],
    colors: ['#A8D8C8', '#78C0A8', '#C0E8D8', '#60A898'],
    bgColor: '#0e1820',
    cycleDuration: 1.8,
    boltCount: 8,
  },
  configSchema: [
    {
      key: 'words',
      label: 'Words',
      type: 'text-array',
      defaultValue: ['VOYAGE', 'ANCHOR', 'DEPTH', 'SAIL'],
      group: 'Content',
    },
    { key: 'colors', label: 'Text Colors', type: 'text-array', defaultValue: ['#A8D8C8', '#78C0A8'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#0e1820', group: 'Style' },
    {
      key: 'boltCount',
      label: 'Bolt Count',
      type: 'number',
      defaultValue: 8,
      min: 4,
      max: 16,
      group: 'Animation',
    },
    {
      key: 'cycleDuration',
      label: 'Cycle Duration (s)',
      type: 'number',
      defaultValue: 1.8,
      min: 0.5,
      max: 5,
      group: 'Timing',
    },
  ],
})
