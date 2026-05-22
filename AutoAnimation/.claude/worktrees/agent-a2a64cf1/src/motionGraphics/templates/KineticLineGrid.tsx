import { registerMotionGraphic } from '../registry'
import {
  KineticBase,
  type KineticBaseConfig,
  type KineticAnimation,
  type WordRenderProps,
  type BackgroundRenderProps,
} from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface LineGridConfig extends KineticBaseConfig {
  lineColor: string
}

function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3)
}

function easeInCubic(t: number): number {
  return t * t * t
}

const H_LINES = 8
const V_LINES = 10

const animation: KineticAnimation = {
  renderBackground: ({ bgColor, frame, fps }: BackgroundRenderProps) => {
    const time = frame / fps

    return (
      <div style={{ position: 'absolute', inset: 0, background: bgColor, overflow: 'hidden' }}>
        <svg
          style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}
          viewBox="0 0 100 100"
          preserveAspectRatio="none"
        >
          {/* Horizontal lines */}
          {Array.from({ length: H_LINES }, (_, i) => {
            const y = ((i + 1) / (H_LINES + 1)) * 100
            // Pulse: opacity oscillates subtly
            const pulse = 0.15 + Math.sin(time * 2 + i * 0.5) * 0.05
            return (
              <line
                key={`h-${i}`}
                x1="0"
                y1={y}
                x2="100"
                y2={y}
                stroke="rgba(0,255,200,0.6)"
                strokeWidth="0.15"
                opacity={pulse}
              />
            )
          })}
          {/* Vertical lines */}
          {Array.from({ length: V_LINES }, (_, i) => {
            const x = ((i + 1) / (V_LINES + 1)) * 100
            const pulse = 0.15 + Math.sin(time * 2 + i * 0.7 + 1) * 0.05
            return (
              <line
                key={`v-${i}`}
                x1={x}
                y1="0"
                x2={x}
                y2="100"
                stroke="rgba(0,255,200,0.6)"
                strokeWidth="0.15"
                opacity={pulse}
              />
            )
          })}
        </svg>
      </div>
    )
  },

  renderWord: ({ word, color, enterProgress, exitProgress, phase, width, height }: WordRenderProps) => {
    // Horizontal lines draw first 50%, vertical lines draw next 30%, text appears last 20%
    const hLines: React.ReactNode[] = []
    const vLines: React.ReactNode[] = []

    for (let i = 0; i < H_LINES; i++) {
      const y = ((i + 1) / (H_LINES + 1)) * height
      let lineLength = 0

      if (phase === 'enter') {
        const lineProgress = Math.max(0, Math.min(1, (enterProgress * 2 - i * 0.08)))
        lineLength = easeOutCubic(lineProgress) * width
      } else if (phase === 'hold') {
        lineLength = width
      } else {
        const retractProgress = Math.max(0, Math.min(1, (exitProgress * 2 - (H_LINES - 1 - i) * 0.08)))
        lineLength = width * (1 - easeInCubic(retractProgress))
      }

      hLines.push(
        <line
          key={`h-${i}`}
          x1={0}
          y1={y}
          x2={lineLength}
          y2={y}
          stroke="rgba(0,255,200,0.5)"
          strokeWidth={1}
        />
      )
    }

    for (let i = 0; i < V_LINES; i++) {
      const x = ((i + 1) / (V_LINES + 1)) * width
      let lineLength = 0

      if (phase === 'enter') {
        const lineProgress = Math.max(0, Math.min(1, (enterProgress * 2 - 0.5 - i * 0.04)))
        lineLength = easeOutCubic(Math.max(0, lineProgress)) * height
      } else if (phase === 'hold') {
        lineLength = height
      } else {
        const retractProgress = Math.max(0, Math.min(1, (exitProgress * 2 - 0.3 - (V_LINES - 1 - i) * 0.04)))
        lineLength = height * (1 - easeInCubic(retractProgress))
      }

      vLines.push(
        <line
          key={`v-${i}`}
          x1={x}
          y1={0}
          x2={x}
          y2={lineLength}
          stroke="rgba(0,255,200,0.5)"
          strokeWidth={1}
        />
      )
    }

    let textOpacity = 0
    if (phase === 'enter') {
      textOpacity = easeOutCubic(Math.max(0, (enterProgress - 0.7) / 0.3))
    } else if (phase === 'hold') {
      textOpacity = 1
    } else {
      textOpacity = 1 - easeInCubic(Math.min(1, exitProgress / 0.5))
    }

    return (
      <div style={{ position: 'absolute', inset: 0 }}>
        <svg
          style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}
          viewBox={`0 0 ${width} ${height}`}
        >
          {hLines}
          {vLines}
        </svg>
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            opacity: textOpacity,
            fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
            fontSize: 'clamp(36px, 9vw, 130px)',
            fontWeight: 700,
            color,
            whiteSpace: 'nowrap',
            textShadow: '0 0 20px rgba(0,255,200,0.3), 0 2px 6px rgba(0,0,0,0.5)',
            letterSpacing: '3px',
          }}
        >
          {word}
        </div>
      </div>
    )
  },
}

function LineGridComponent(props: MotionGraphicProps<LineGridConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-line-grid',
  title: 'Kinetic Line Grid',
  description: 'Grid of lines that draw in sequentially — horizontals left to right, then verticals top to bottom. Text appears at grid center. Lines retract on exit.',
  tags: ['kinetic', 'typography', 'grid', 'lines', 'geometric', 'draw', 'tech', 'minimal'],
  category: 'captions',
  component: LineGridComponent as any,
  defaultConfig: {
    words: ['GRID', 'MATRIX', 'LINES', 'CODE'],
    colors: ['#00FFC8', '#FFFFFF', '#00FFC8', '#FFFFFF'],
    bgColor: '#0a0f14',
    cycleDuration: 1.5,
    lineColor: '#00FFC8',
  },
  configSchema: [
    { key: 'words', label: 'Words', type: 'text-array', defaultValue: ['GRID', 'MATRIX', 'LINES', 'CODE'], group: 'Content' },
    { key: 'colors', label: 'Colors', type: 'text-array', defaultValue: ['#00FFC8', '#FFFFFF', '#00FFC8', '#FFFFFF'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#0a0f14', group: 'Style' },
    { key: 'cycleDuration', label: 'Cycle Duration (s)', type: 'number', defaultValue: 1.5, min: 0.3, max: 5, group: 'Timing' },
    { key: 'lineColor', label: 'Line Color', type: 'color', defaultValue: '#00FFC8', group: 'Animation' },
  ],
})
