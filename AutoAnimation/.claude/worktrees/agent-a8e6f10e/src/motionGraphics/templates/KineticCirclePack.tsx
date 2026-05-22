import { registerMotionGraphic } from '../registry'
import {
  KineticBase,
  type KineticBaseConfig,
  type KineticAnimation,
  type WordRenderProps,
  type BackgroundRenderProps,
} from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface CirclePackConfig extends KineticBaseConfig {
  circleSize: number
}

function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3)
}

function easeInBack(t: number): number {
  const c1 = 1.70158
  const c3 = c1 + 1
  return c3 * t * t * t - c1 * t * t
}

function pseudoRandom(seed: number): number {
  const x = Math.sin(seed * 127.1 + 311.7) * 43758.5453
  return x - Math.floor(x)
}

const animation: KineticAnimation = {
  renderBackground: ({ bgColor }: BackgroundRenderProps) => (
    <div style={{ position: 'absolute', inset: 0, background: bgColor }} />
  ),

  renderWord: ({ word, color, enterProgress, exitProgress, phase, index, width, height }: WordRenderProps) => {
    const cfg = (globalThis as any).__circlePackConfig ?? { circleSize: 44 }
    const r = (cfg.circleSize ?? 44) * 0.5
    // Hexagonal close-pack
    const colStep = r * 2
    const rowStep = r * Math.sqrt(3)
    const cols = Math.ceil(width / colStep) + 2
    const rows = Math.ceil(height / rowStep) + 2
    const seed = index * 83

    const circles: React.ReactNode[] = []

    for (let row = -1; row < rows; row++) {
      for (let col = -1; col < cols; col++) {
        const tileIndex = (row + 1) * (cols + 1) + (col + 1)
        const tileSeed = seed + tileIndex * 73

        const cx = col * colStep + (row % 2 === 1 ? r : 0)
        const cy = row * rowStep

        // Circles shrink from full radius → 0 to reveal text through gaps
        // Wave radiates from centre
        const dx = (cx - width / 2) / (width * 0.6)
        const dy = (cy - height / 2) / (height * 0.6)
        const distNorm = Math.min(1, Math.sqrt(dx * dx + dy * dy))
        const stagger = distNorm * 0.5 + pseudoRandom(tileSeed) * 0.1

        let scaleVal = 1
        let opacity = 1

        if (phase === 'enter') {
          // Start: full circles covering everything. They shrink to 0 (outward wave).
          const delayed = Math.max(0, Math.min(1, (enterProgress - stagger * 0.7) / 0.3))
          scaleVal = 1 - easeOutCubic(delayed)
          opacity = 1 - easeOutCubic(Math.min(1, delayed * 1.2))
        } else if (phase === 'hold') {
          scaleVal = 0
          opacity = 0
        } else {
          // Exit: circles grow back in from centre outward
          const revStagger = 1 - stagger
          const delayed = Math.max(0, Math.min(1, (exitProgress - revStagger * 0.5) / 0.5))
          scaleVal = easeInBack(Math.min(1, delayed))
          opacity = easeOutCubic(delayed)
        }

        if (opacity <= 0.01 || scaleVal <= 0.01) { continue }

        const hue = 180 + pseudoRandom(tileSeed + 3) * 40
        const sat = 12 + pseudoRandom(tileSeed + 4) * 10
        const lit = 16 + pseudoRandom(tileSeed + 5) * 10

        circles.push(
          <div
            key={tileIndex}
            style={{
              position: 'absolute',
              left: cx - r,
              top: cy - r,
              width: r * 2,
              height: r * 2,
              borderRadius: '50%',
              background: `hsl(${hue},${sat}%,${lit}%)`,
              border: '1px solid rgba(255,255,255,0.06)',
              transform: `scale(${scaleVal})`,
              transformOrigin: 'center center',
              opacity,
            }}
          />,
        )
      }
    }

    let textOpacity = 0
    if (phase === 'enter') textOpacity = Math.min(1, enterProgress * 2.5)
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
        {circles}
      </>
    )
  },
}

function CirclePackComponent(props: MotionGraphicProps<CirclePackConfig>) {
  ;(globalThis as any).__circlePackConfig = props.config
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-circle-pack',
  title: 'Kinetic Circle Pack',
  description: 'Hexagonally close-packed circles shrink away from the centre revealing text through the gaps',
  tags: ['kinetic', 'typography', 'circle', 'pack', 'dots', 'reveal', 'pattern', 'geometric'],
  category: 'captions',
  component: CirclePackComponent as any,
  defaultConfig: {
    words: ['DOTS', 'PACK', 'DENSE', 'OPEN'],
    colors: ['#34D399', '#10B981', '#6EE7B7', '#34D399'],
    bgColor: '#050e0a',
    cycleDuration: 1.4,
    circleSize: 44,
  },
  configSchema: [
    { key: 'words', label: 'Words', type: 'text-array', defaultValue: ['DOTS', 'PACK', 'DENSE', 'OPEN'], group: 'Content' },
    { key: 'colors', label: 'Colors', type: 'text-array', defaultValue: ['#34D399', '#10B981', '#6EE7B7'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#050e0a', group: 'Style' },
    { key: 'cycleDuration', label: 'Cycle Duration (s)', type: 'number', defaultValue: 1.4, min: 0.5, max: 5, group: 'Timing' },
    { key: 'circleSize', label: 'Circle Diameter (px)', type: 'number', defaultValue: 44, min: 16, max: 100, group: 'Animation' },
  ],
})
