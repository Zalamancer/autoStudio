import { registerMotionGraphic } from '../registry'
import { KineticBase, type KineticBaseConfig, type KineticAnimation, type WordRenderProps, type BackgroundRenderProps } from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

// ── Shatter/Fragment 2: Pixel Scatter ────────────────────────────────────────
// Text disintegrates into a grid of pixel squares that scatter and reassemble.

interface PixelScatterConfig extends KineticBaseConfig {
  pixelSize: number
  scatterSpeed: number
}

function seeded(s: number): number {
  const x = Math.sin(s * 92.7 + 15.3) * 43758.5453
  return x - Math.floor(x)
}

function easeOutQuart(t: number): number {
  return 1 - Math.pow(1 - t, 4)
}

function easeInQuart(t: number): number {
  return t * t * t * t
}

const animation: KineticAnimation = {
  renderBackground: ({ bgColor, width, height }: BackgroundRenderProps) => (
    <div style={{
      position: 'absolute', inset: 0, background: bgColor,
      backgroundImage: `radial-gradient(circle at 50% 50%, rgba(255,255,255,0.03) 0%, transparent 70%)`,
    }} />
  ),

  renderWord: ({ word, color, enterProgress, holdProgress, exitProgress, phase, width, height }: WordRenderProps) => {
    const COLS = 14
    const ROWS = 8
    const pixW = width / COLS
    const pixH = height / ROWS

    const pixels = Array.from({ length: COLS * ROWS }, (_, i) => {
      const col = i % COLS
      const row = Math.floor(i / COLS)
      const cx = col * pixW
      const cy = row * pixH

      // Each pixel scatters to a random position
      const scatterAngle = seeded(i * 7) * Math.PI * 2
      const scatterDist = 100 + seeded(i * 11) * 400
      const scatterX = Math.cos(scatterAngle) * scatterDist
      const scatterY = Math.sin(scatterAngle) * scatterDist

      // Stagger based on distance from center
      const distFromCenter = Math.sqrt(Math.pow(col - COLS / 2, 2) + Math.pow(row - ROWS / 2, 2))
      const maxDist = Math.sqrt(Math.pow(COLS / 2, 2) + Math.pow(ROWS / 2, 2))
      const normalDist = distFromCenter / maxDist

      let tx = 0, ty = 0, op = 0, sc = 1, rot = 0

      if (phase === 'enter') {
        // Pixels assemble from scattered positions — outer pixels arrive last
        const delay = normalDist * 0.4
        const p = Math.max(0, Math.min(1, (enterProgress - delay) / (1 - delay * 0.5)))
        const e = easeOutQuart(p)
        tx = scatterX * (1 - e)
        ty = scatterY * (1 - e)
        op = Math.min(1, p * 2)
        sc = 0.2 + e * 0.8
        rot = (seeded(i * 3) - 0.5) * 360 * (1 - e)
      } else if (phase === 'hold') {
        // Pixels in place with subtle shimmer
        const shimmer = Math.sin(holdProgress * Math.PI * 6 + i * 0.4) * 0.08
        op = 0.7 + shimmer
        sc = 1 + Math.sin(holdProgress * Math.PI * 3 + i * 0.6) * 0.03
      } else {
        // Scatter outward — inner pixels first
        const delay = (1 - normalDist) * 0.35
        const p = Math.max(0, Math.min(1, (exitProgress - delay) / (1 - delay)))
        const e = easeInQuart(p)
        tx = scatterX * e
        ty = scatterY * e
        op = 1 - e
        sc = 1 + e * 1.5
        rot = (seeded(i * 3) - 0.5) * 360 * e
      }

      // Color varies slightly per pixel for pixelated look
      const colorShift = (seeded(i * 19) - 0.5) * 30
      const brightness = 0.7 + seeded(i * 5) * 0.6

      return (
        <div
          key={i}
          style={{
            position: 'absolute',
            left: cx,
            top: cy,
            width: pixW - 1,
            height: pixH - 1,
            background: color,
            opacity: op * brightness,
            transform: `translate(${tx}px, ${ty}px) scale(${sc}) rotate(${rot}deg)`,
            filter: `hue-rotate(${colorShift}deg)`,
          }}
        />
      )
    })

    // Text slam — visible as pixels assemble, then covered as they scatter
    let textOp = 0
    if (phase === 'enter') textOp = Math.min(1, Math.max(0, (enterProgress - 0.7) / 0.3))
    else if (phase === 'hold') textOp = 1
    else textOp = Math.max(0, 1 - exitProgress / 0.3)

    return (
      <div style={{ position: 'absolute', inset: 0 }}>
        <div
          style={{
            position: 'absolute',
            top: '50%', left: '50%',
            transform: 'translate(-50%, -50%)',
            opacity: textOp,
            fontFamily: "'Courier New', 'Consolas', monospace",
            fontSize: 'clamp(44px, 10vw, 136px)',
            fontWeight: 900,
            color,
            whiteSpace: 'nowrap',
            letterSpacing: '0.05em',
          }}
        >
          {word}
        </div>
        {pixels}
      </div>
    )
  },
}

function PixelScatterComponent(props: MotionGraphicProps<PixelScatterConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-pixel-scatter',
  title: 'Kinetic Pixel Scatter',
  description: 'Text dissolves into a pixel grid that scatters to random positions and reassembles — inner pixels move first on exit, outer arrive last on enter.',
  tags: ['kinetic', 'typography', 'pixel', 'scatter', 'fragment', 'shatter', 'retro', 'distortion'],
  category: 'captions',
  component: PixelScatterComponent as any,
  defaultConfig: {
    words: ['PIXEL', 'BLAST', 'DATA', 'BYTE'],
    colors: ['#00FF88', '#FFFFFF', '#FF4466', '#FFDD00'],
    bgColor: '#050510',
    cycleDuration: 1.4,
    pixelSize: 20,
    scatterSpeed: 1,
  },
  configSchema: [
    { key: 'words', label: 'Words', type: 'text-array', defaultValue: ['PIXEL', 'BLAST', 'DATA', 'BYTE'], group: 'Content' },
    { key: 'colors', label: 'Colors', type: 'text-array', defaultValue: ['#00FF88', '#FFFFFF', '#FF4466', '#FFDD00'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#050510', group: 'Style' },
    { key: 'cycleDuration', label: 'Cycle Duration (s)', type: 'number', defaultValue: 1.4, min: 0.5, max: 5, group: 'Timing' },
    { key: 'pixelSize', label: 'Pixel Size', type: 'number', defaultValue: 20, min: 8, max: 40, group: 'Animation' },
    { key: 'scatterSpeed', label: 'Scatter Speed', type: 'number', defaultValue: 1, min: 0.5, max: 3, group: 'Animation' },
  ],
})
