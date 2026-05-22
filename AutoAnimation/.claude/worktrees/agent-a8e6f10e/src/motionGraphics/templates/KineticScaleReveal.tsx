import { registerMotionGraphic } from '../registry'
import {
  KineticBase,
  type KineticBaseConfig,
  type KineticAnimation,
  type WordRenderProps,
  type BackgroundRenderProps,
} from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface ScaleRevealConfig extends KineticBaseConfig {
  scaleSize: number
}

function easeOutBack(t: number): number {
  const c1 = 1.70158
  const c3 = c1 + 1
  return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2)
}

function easeInCubic(t: number): number {
  return t * t * t
}

function pseudoRandom(seed: number): number {
  const x = Math.sin(seed * 127.1 + 311.7) * 43758.5453
  return x - Math.floor(x)
}

/**
 * Build a scallop/fish-scale clip-path for one cell.
 * The scale is a circle clipped to the bottom two-thirds, giving the
 * classic overlapping scallop feel.
 */
function scaleClipPath(peel: number): string {
  // peel: 0 = closed/flat covering, 1 = peeled up and away
  // Simulate by scaling up and translating upward
  return `scale(${1 + peel * 0.5}) translateY(${-peel * 80}%)`
}

const animation: KineticAnimation = {
  renderBackground: ({ bgColor }: BackgroundRenderProps) => (
    <div style={{ position: 'absolute', inset: 0, background: bgColor }} />
  ),

  renderWord: ({ word, color, enterProgress, exitProgress, phase, index, width, height }: WordRenderProps) => {
    const cfg = (globalThis as any).__scaleRevealConfig ?? { scaleSize: 52 }
    const sz = cfg.scaleSize ?? 52
    const cols = Math.ceil(width / sz) + 2
    const rows = Math.ceil(height / (sz * 0.75)) + 2
    const seed = index * 103

    const scales: React.ReactNode[] = []

    for (let row = -1; row < rows; row++) {
      for (let col = -1; col < cols; col++) {
        const tileIndex = (row + 1) * (cols + 1) + (col + 1)
        const tileSeed = seed + tileIndex * 59

        const offsetX = row % 2 === 1 ? sz * 0.5 : 0
        const cx = col * sz + offsetX
        const cy = row * sz * 0.75

        // Stagger: top rows peel first (waterfall from top)
        const stagger = ((row + 1) / rows) * 0.6 + pseudoRandom(tileSeed) * 0.1

        let peel = 0
        let opacity = 1

        if (phase === 'enter') {
          const delayed = Math.max(0, Math.min(1, (enterProgress - stagger * 0.7) / 0.3))
          peel = easeOutBack(Math.min(1, delayed))
          opacity = 1 - Math.min(1, delayed * 1.5)
        } else if (phase === 'hold') {
          peel = 1
          opacity = 0
        } else {
          const reverseStagger = 1 - stagger
          const delayed = Math.max(0, Math.min(1, (exitProgress - reverseStagger * 0.5) / 0.5))
          peel = 1 - easeInCubic(1 - delayed)
          opacity = easeInCubic(delayed)
        }

        if (opacity <= 0.01) { continue }

        // Scale shape: circle with bottom anchor
        const r = sz * 0.55
        const hue = 200 + pseudoRandom(tileSeed + 3) * 40
        const lightness = 14 + pseudoRandom(tileSeed + 4) * 10

        scales.push(
          <div
            key={tileIndex}
            style={{
              position: 'absolute',
              left: cx - r,
              top: cy - r * 0.3,
              width: r * 2,
              height: r * 2,
              borderRadius: '50%',
              background: `hsl(${hue},18%,${lightness}%)`,
              border: '1px solid rgba(255,255,255,0.08)',
              transformOrigin: 'center bottom',
              transform: scaleClipPath(peel),
              opacity,
              boxShadow: `0 -2px 6px rgba(0,0,0,${0.4 * opacity})`,
            }}
          />,
        )
      }
    }

    let textOpacity = 0
    if (phase === 'enter') textOpacity = Math.min(1, enterProgress * 2)
    else if (phase === 'hold') textOpacity = 1
    else textOpacity = Math.max(0, 1 - exitProgress * 2)

    return (
      <>
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            fontFamily: "'Inter', 'Helvetica Neue', sans-serif",
            fontSize: 'clamp(40px, 10vw, 140px)',
            fontWeight: 800,
            color,
            whiteSpace: 'nowrap',
            letterSpacing: '0.04em',
            textTransform: 'uppercase',
            opacity: textOpacity,
          }}
        >
          {word}
        </div>
        {/* Scales layer on top, peeling upward */}
        {scales}
      </>
    )
  },
}

function ScaleRevealComponent(props: MotionGraphicProps<ScaleRevealConfig>) {
  ;(globalThis as any).__scaleRevealConfig = props.config
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-scale-reveal',
  title: 'Kinetic Scale Reveal',
  description: 'Fish-scale / scallop pattern peels upward in overlapping rows to reveal text beneath',
  tags: ['kinetic', 'typography', 'scale', 'scallop', 'fish', 'tile', 'reveal', 'pattern', 'organic'],
  category: 'captions',
  component: ScaleRevealComponent as any,
  defaultConfig: {
    words: ['DEPTH', 'LAYERS', 'PEEL', 'REVEAL'],
    colors: ['#7EC8E3', '#0EA5E9', '#38BDF8', '#7EC8E3'],
    bgColor: '#040d18',
    cycleDuration: 1.6,
    scaleSize: 52,
  },
  configSchema: [
    { key: 'words', label: 'Words', type: 'text-array', defaultValue: ['DEPTH', 'LAYERS', 'PEEL', 'REVEAL'], group: 'Content' },
    { key: 'colors', label: 'Colors', type: 'text-array', defaultValue: ['#7EC8E3', '#0EA5E9', '#38BDF8'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#040d18', group: 'Style' },
    { key: 'cycleDuration', label: 'Cycle Duration (s)', type: 'number', defaultValue: 1.6, min: 0.5, max: 5, group: 'Timing' },
    { key: 'scaleSize', label: 'Scale Size (px)', type: 'number', defaultValue: 52, min: 24, max: 100, group: 'Animation' },
  ],
})
