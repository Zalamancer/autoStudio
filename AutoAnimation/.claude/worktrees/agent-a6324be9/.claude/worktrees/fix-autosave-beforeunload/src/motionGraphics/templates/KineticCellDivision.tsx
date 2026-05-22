import { registerMotionGraphic } from '../registry'
import { KineticBase, type KineticBaseConfig, type KineticAnimation, type WordRenderProps, type BackgroundRenderProps } from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface CellDivisionConfig extends KineticBaseConfig {
  divisionRate: number
}

function easeOutExpo(t: number): number {
  return t === 1 ? 1 : 1 - Math.pow(2, -10 * t)
}

function easeInOutCubic(t: number): number {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2
}

const animation: KineticAnimation = {
  renderBackground: ({ bgColor, width, height, frame, fps }: BackgroundRenderProps) => {
    const t = frame / fps
    // Petri dish / microscope slide look
    return (
      <div style={{ position: 'absolute', inset: 0, background: bgColor }}>
        {/* Cell membrane blobs in background */}
        {Array.from({ length: 8 }, (_, i) => {
          const cx = ((i * 0.13 + 0.08) * width) + Math.sin(t * 0.4 + i) * 15
          const cy = ((i * 0.11 + 0.05) * height) + Math.cos(t * 0.3 + i * 0.7) * 12
          const r = 20 + (i % 3) * 15
          const division = (Math.sin(t * 0.8 + i * 1.1) * 0.5 + 0.5)
          const scaleX = 1 + division * 0.4
          const scaleY = 1 - division * 0.2
          return (
            <div
              key={i}
              style={{
                position: 'absolute',
                left: cx - r,
                top: cy - r,
                width: r * 2,
                height: r * 2,
                borderRadius: `${50 + Math.sin(t + i) * 8}% ${50 - Math.sin(t * 1.3 + i) * 8}% ${50 + Math.cos(t * 0.9 + i) * 6}% ${50 - Math.cos(t + i * 1.2) * 6}%`,
                border: '1px solid rgba(100,200,120,0.12)',
                background: 'rgba(80,180,100,0.04)',
                transform: `scaleX(${scaleX}) scaleY(${scaleY})`,
              }}
            />
          )
        })}
      </div>
    )
  },

  renderWord: ({ word, color, enterProgress, holdProgress, exitProgress, phase, index, frame, width, height }: WordRenderProps) => {
    const f = frame ?? 0
    const t = f / 30

    const chars = word.split('').map((ch, ci) => {
      const charDelay = ci / (word.length + 1)
      let opacity = 1
      let xOff = 0
      let yOff = 0
      let scaleX = 1
      let scaleY = 1
      let blur = 0

      if (phase === 'enter') {
        // Cells divide and multiply to form the letter shape
        const p = Math.max(0, Math.min(1, (enterProgress - charDelay * 0.5) / 0.7))
        const ep = easeOutExpo(p)

        // Start as single cell, divide into letter form
        // Early division: all characters clump together, then divide apart
        const clumpProgress = Math.max(0, Math.min(1, enterProgress * 2))
        const divideProgress = Math.max(0, Math.min(1, (enterProgress - 0.4) / 0.6))
        const dp = easeOutExpo(divideProgress)

        const norm = (ci / Math.max(1, word.length - 1)) - 0.5
        xOff = norm * (1 - dp) * -20
        yOff = (1 - ep) * 15

        // Cell-like morphing scale during division
        const cellPulse = Math.sin(enterProgress * Math.PI * 3 + ci * 0.8)
        scaleX = 0.3 + ep * 0.7 + cellPulse * (1 - ep) * 0.2
        scaleY = 0.3 + ep * 0.7 - cellPulse * (1 - ep) * 0.15
        opacity = p < 0.12 ? p / 0.12 : 1
        blur = (1 - ep) * 3

      } else if (phase === 'hold') {
        // Cellular oscillation: mitotic tension
        const mitosis = Math.sin(t * 2.5 + ci * 0.7) * 0.5 + 0.5
        scaleX = 1 + mitosis * 0.06
        scaleY = 1 - mitosis * 0.04
        yOff = Math.sin(t * 1.8 + ci * 0.5) * 2
        xOff = Math.cos(t * 1.4 + ci * 0.3) * 1.5
        // Nucleus glow varies
        opacity = 0.9 + Math.sin(t * 3 + ci * 0.8) * 0.1

      } else {
        // Cells lyse / dissolve
        const p = Math.max(0, Math.min(1, (exitProgress - charDelay * 0.3) / 0.8))
        const ep = easeInOutCubic(p)

        const norm = (ci / Math.max(1, word.length - 1)) - 0.5
        xOff = norm * ep * 40
        yOff = ep * 20 + Math.sin(ci * 2.1) * ep * 15
        scaleX = 1 + ep * 0.5
        scaleY = 1 - ep * 0.6
        opacity = 1 - ep
        blur = ep * 5
      }

      // Cell membrane color (greenish biological glow)
      const cellColor = phase === 'hold'
        ? `${color}`
        : color

      return (
        <span
          key={ci}
          style={{
            display: 'inline-block',
            color: cellColor,
            opacity,
            transform: `translate(${xOff}px, ${yOff}px) scaleX(${scaleX}) scaleY(${scaleY})`,
            filter: blur > 0 ? `blur(${blur}px)` : undefined,
            textShadow: `0 0 12px rgba(80,200,100,0.4), 0 2px 6px rgba(0,0,0,0.5)`,
            borderRadius: '20%',
          }}
        >
          {ch}
        </span>
      )
    })

    return (
      <div style={{ position: 'absolute', inset: 0 }}>
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            fontFamily: "'Arial', sans-serif",
            fontSize: 'clamp(44px, 12vw, 150px)',
            fontWeight: 800,
            whiteSpace: 'nowrap',
            letterSpacing: 3,
          }}
        >
          {chars}
        </div>
      </div>
    )
  },
}

function CellDivisionComponent(props: MotionGraphicProps<CellDivisionConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-cell-division',
  title: 'Kinetic Cell Division',
  description: 'Letters form through biological cell division: characters start as single cells, undergo mitosis to multiply into letter shapes. Hold phase shows ongoing cellular oscillation. Background shows petri-dish membrane blobs.',
  tags: ['kinetic', 'typography', 'biology', 'cell', 'division', 'mitosis', 'organic', 'science', 'material-physics'],
  category: 'captions',
  component: CellDivisionComponent as any,
  defaultConfig: {
    words: ['GROW', 'SPLIT', 'DIVIDE', 'LIFE'],
    colors: ['#50C878', '#3DAA60', '#60D888', '#40B868'],
    bgColor: '#060D08',
    cycleDuration: 1.8,
    divisionRate: 1,
  },
  configSchema: [
    { key: 'words', label: 'Words', type: 'text-array', defaultValue: ['GROW', 'SPLIT', 'DIVIDE', 'LIFE'], group: 'Content' },
    { key: 'colors', label: 'Colors', type: 'text-array', defaultValue: ['#50C878', '#3DAA60', '#60D888', '#40B868'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#060D08', group: 'Style' },
    { key: 'cycleDuration', label: 'Cycle Duration (s)', type: 'number', defaultValue: 1.8, min: 0.5, max: 5, group: 'Timing' },
    { key: 'divisionRate', label: 'Division Rate', type: 'number', defaultValue: 1, min: 0.3, max: 3, group: 'Animation' },
  ],
})
