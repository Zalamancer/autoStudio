import { registerMotionGraphic } from '../registry'
import { KineticBase, type KineticBaseConfig, type KineticAnimation, type WordRenderProps, type BackgroundRenderProps } from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface DotMatrixRevealConfig extends KineticBaseConfig {
  dotCols: number
  dotRows: number
}

function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3)
}

const animation: KineticAnimation = {
  renderBackground: ({ bgColor }: BackgroundRenderProps) => (
    <div style={{ position: 'absolute', inset: 0, background: bgColor }} />
  ),

  renderWord: ({ word, color, enterProgress, exitProgress, phase, width, height }: WordRenderProps) => {
    const config = (globalThis as any).__dotMatrixConfig ?? { dotCols: 20, dotRows: 14 }
    const dotCols = config.dotCols ?? 20
    const dotRows = config.dotRows ?? 14
    const cellW = width / dotCols
    const cellH = height / dotRows
    const dotMaxRadius = Math.min(cellW, cellH) * 0.46

    // Reveal progress (0 = all dots tiny/gone, 1 = all dots full)
    const revealP = phase === 'hold' ? 1 : phase === 'enter' ? enterProgress : 1 - exitProgress

    const dots: React.ReactNode[] = []
    for (let r = 0; r < dotRows; r++) {
      for (let c = 0; c < dotCols; c++) {
        // Distance from center — dots nearer center appear first
        const cx = (c + 0.5) / dotCols - 0.5
        const cy = (r + 0.5) / dotRows - 0.5
        const dist = Math.sqrt(cx * cx + cy * cy) / 0.707 // normalised 0..1

        // Stagger: center expands out
        const threshold = dist * 0.6
        const raw = Math.max(0, Math.min(1, (revealP - threshold) / 0.45))
        const dotScale = easeOutCubic(raw)

        const radius = dotMaxRadius * dotScale
        if (radius < 0.5) continue

        const cx2 = (c + 0.5) * cellW
        const cy2 = (r + 0.5) * cellH

        dots.push(
          <div
            key={`${r}-${c}`}
            style={{
              position: 'absolute',
              left: cx2 - radius,
              top: cy2 - radius,
              width: radius * 2,
              height: radius * 2,
              borderRadius: '50%',
              background: color,
              opacity: dotScale,
            }}
          />,
        )
      }
    }

    // Text fades in on top once dots are mostly revealed
    const textOpacity = phase === 'hold' ? 1 : phase === 'enter' ? Math.max(0, (enterProgress - 0.6) / 0.4) : Math.max(0, 1 - exitProgress * 2)

    return (
      <div style={{ position: 'absolute', inset: 0 }}>
        {/* Dot matrix layer */}
        {dots}
        {/* Text overlay */}
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            fontFamily: "'Inter', 'Helvetica Neue', sans-serif",
            fontSize: 'clamp(40px, 10vw, 140px)',
            fontWeight: 900,
            color,
            whiteSpace: 'nowrap',
            letterSpacing: '0.04em',
            textTransform: 'uppercase',
            opacity: textOpacity,
            mixBlendMode: 'screen',
          }}
        >
          {word}
        </div>
      </div>
    )
  },
}

function DotMatrixRevealComponent(props: MotionGraphicProps<DotMatrixRevealConfig>) {
  ;(globalThis as any).__dotMatrixConfig = props.config
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-dot-matrix-reveal',
  title: 'Kinetic Dot Matrix Reveal',
  description: 'Dots expand from the center outward in a radial wave to build up into a full dot-matrix field, then text emerges on top',
  tags: ['kinetic', 'typography', 'dots', 'matrix', 'reveal', 'geometric', 'pattern', 'radial', 'expand'],
  category: 'captions',
  component: DotMatrixRevealComponent as any,
  defaultConfig: {
    words: ['DOTS', 'BUILD', 'FORM', 'RISE'],
    colors: ['#FF6B6B', '#FFD700', '#4ECDC4', '#A78BFA'],
    bgColor: '#0D0D0D',
    cycleDuration: 1.5,
    dotCols: 20,
    dotRows: 14,
  },
  configSchema: [
    { key: 'words', label: 'Words', type: 'text-array', defaultValue: ['DOTS', 'BUILD', 'FORM', 'RISE'], group: 'Content' },
    { key: 'colors', label: 'Colors', type: 'text-array', defaultValue: ['#FF6B6B', '#FFD700', '#4ECDC4', '#A78BFA'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#0D0D0D', group: 'Style' },
    { key: 'cycleDuration', label: 'Cycle Duration (s)', type: 'number', defaultValue: 1.5, min: 0.3, max: 5, group: 'Timing' },
    { key: 'dotCols', label: 'Dot Columns', type: 'number', defaultValue: 20, min: 8, max: 40, group: 'Animation' },
    { key: 'dotRows', label: 'Dot Rows', type: 'number', defaultValue: 14, min: 6, max: 28, group: 'Animation' },
  ],
})
