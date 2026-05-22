import { registerMotionGraphic } from '../registry'
import {
  KineticBase,
  type KineticBaseConfig,
  type KineticAnimation,
  type WordRenderProps,
  type BackgroundRenderProps,
} from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface DotMatrixConfig extends KineticBaseConfig {
  dotColor: string
}

function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3)
}

function easeInCubic(t: number): number {
  return t * t * t
}

const DOT_COLS = 20
const DOT_ROWS = 14
const DOT_RADIUS = 1.2

const animation: KineticAnimation = {
  renderBackground: ({ bgColor, frame, fps, width, height }: BackgroundRenderProps) => {
    const time = frame / fps
    const dots: React.ReactNode[] = []

    const svgW = DOT_COLS * 6
    const svgH = DOT_ROWS * 6
    const centerX = svgW / 2
    const centerY = svgH / 2

    for (let row = 0; row < DOT_ROWS; row++) {
      for (let col = 0; col < DOT_COLS; col++) {
        const cx = col * 6 + 3
        const cy = row * 6 + 3
        const dist = Math.sqrt(Math.pow(cx - centerX, 2) + Math.pow(cy - centerY, 2))
        const maxDist = Math.sqrt(centerX * centerX + centerY * centerY)
        const normDist = dist / maxDist

        // Dots near center glow brighter, with breathing animation
        const breathe = Math.sin(time * 2.5 + dist * 0.05) * 0.3
        const proximity = 1 - normDist
        const brightness = 0.1 + proximity * 0.5 + breathe * proximity

        dots.push(
          <circle
            key={`dtm-${row}-${col}`}
            cx={cx}
            cy={cy}
            r={DOT_RADIUS + proximity * 0.5}
            fill="rgba(80,200,255,1)"
            opacity={Math.max(0.05, Math.min(1, brightness))}
          />,
        )
      }
    }

    return (
      <div style={{ position: 'absolute', inset: 0, background: bgColor, overflow: 'hidden' }}>
        <svg
          style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}
          viewBox={`0 0 ${svgW} ${svgH}`}
          preserveAspectRatio="xMidYMid slice"
        >
          {dots}
        </svg>
      </div>
    )
  },

  renderWord: ({ word, color, enterProgress, holdProgress, exitProgress, phase, width, height }: WordRenderProps) => {
    let textOpacity = 0
    let textScale = 0.9

    if (phase === 'enter') {
      // Wave lights up from center, text appears after dots
      textOpacity = easeOutCubic(Math.max(0, (enterProgress - 0.4) / 0.6))
      textScale = 0.9 + easeOutCubic(Math.max(0, (enterProgress - 0.4) / 0.6)) * 0.1
    } else if (phase === 'hold') {
      textOpacity = 1
      textScale = 1
    } else {
      // Dots dim from edges to center, text fades
      textOpacity = 1 - easeInCubic(exitProgress)
      textScale = 1 - easeInCubic(exitProgress) * 0.05
    }

    return (
      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: `translate(-50%, -50%) scale(${textScale})`,
          opacity: textOpacity,
        }}
      >
        {/* Dark backdrop behind text for readability */}
        <div
          style={{
            position: 'absolute',
            inset: '-20px -40px',
            background: 'radial-gradient(ellipse, rgba(0,10,20,0.8) 0%, transparent 70%)',
            borderRadius: '50%',
          }}
        />
        <div
          style={{
            position: 'relative',
            fontFamily: "'Inter', 'SF Pro Display', sans-serif",
            fontSize: 'clamp(40px, 10vw, 140px)',
            fontWeight: 800,
            color,
            whiteSpace: 'nowrap',
            textShadow: '0 0 30px rgba(80,200,255,0.5), 0 2px 8px rgba(0,0,0,0.6)',
            letterSpacing: '2px',
          }}
        >
          {word}
        </div>
      </div>
    )
  },
}

function DotMatrixComponent(props: MotionGraphicProps<DotMatrixConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-dot-matrix',
  title: 'Kinetic Dot Matrix',
  description:
    'Grid of dots that glow brighter near the center text. Dots light up in a wave and breathe during hold. Dims from edges on exit.',
  tags: ['kinetic', 'typography', 'dots', 'matrix', 'grid', 'geometric', 'glow', 'wave'],
  category: 'captions',
  component: DotMatrixComponent as any,
  defaultConfig: {
    words: ['MATRIX', 'DOTS', 'GLOW', 'PULSE'],
    colors: ['#FFFFFF', '#50C8FF', '#FFFFFF', '#50C8FF'],
    bgColor: '#020810',
    cycleDuration: 1.5,
    dotColor: '#50C8FF',
  },
  configSchema: [
    {
      key: 'words',
      label: 'Words',
      type: 'text-array',
      defaultValue: ['MATRIX', 'DOTS', 'GLOW', 'PULSE'],
      group: 'Content',
    },
    {
      key: 'colors',
      label: 'Colors',
      type: 'text-array',
      defaultValue: ['#FFFFFF', '#50C8FF', '#FFFFFF', '#50C8FF'],
      group: 'Style',
    },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#020810', group: 'Style' },
    {
      key: 'cycleDuration',
      label: 'Cycle Duration (s)',
      type: 'number',
      defaultValue: 1.5,
      min: 0.3,
      max: 5,
      group: 'Timing',
    },
    { key: 'dotColor', label: 'Dot Color', type: 'color', defaultValue: '#50C8FF', group: 'Animation' },
  ],
})
