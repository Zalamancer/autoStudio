import { registerMotionGraphic } from '../registry'
import {
  KineticBase,
  type KineticBaseConfig,
  type KineticAnimation,
  type WordRenderProps,
  type BackgroundRenderProps,
} from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface CircleFrameConfig extends KineticBaseConfig {
  circleColor: string
}

function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3)
}

function easeInCubic(t: number): number {
  return t * t * t
}

const animation: KineticAnimation = {
  renderBackground: ({ bgColor }: BackgroundRenderProps) => (
    <div style={{ position: 'absolute', inset: 0, background: bgColor }} />
  ),

  renderWord: ({ word, color, enterProgress, holdProgress, exitProgress, phase, width, height }: WordRenderProps) => {
    const circleRadius = Math.min(width, height) * 0.3
    const circumference = 2 * Math.PI * circleRadius
    const strokeWidth = 3

    // Phase calculations
    let circleScale = 1
    let strokeDashoffset = 0
    let textOpacity = 0
    let rotation = 0

    if (phase === 'enter') {
      // Circle draws in first 60%, text fades in last 40%
      const drawProgress = Math.min(enterProgress / 0.6, 1)
      const textFadeProgress = Math.max((enterProgress - 0.6) / 0.4, 0)

      circleScale = 0.3 + easeOutCubic(drawProgress) * 0.7
      strokeDashoffset = circumference * (1 - easeOutCubic(drawProgress))
      textOpacity = easeOutCubic(textFadeProgress)
    } else if (phase === 'hold') {
      circleScale = 1
      strokeDashoffset = 0
      textOpacity = 1
      rotation = holdProgress * 30
    } else {
      circleScale = 1 - easeInCubic(exitProgress) * 0.8
      strokeDashoffset = 0
      textOpacity = 1 - easeInCubic(exitProgress)
      rotation = 30 + exitProgress * 15
    }

    const cx = width / 2
    const cy = height / 2

    return (
      <div style={{ position: 'absolute', inset: 0 }}>
        {/* SVG circle frame */}
        <svg
          style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}
          viewBox={`0 0 ${width} ${height}`}
        >
          <circle
            cx={cx}
            cy={cy}
            r={circleRadius}
            fill="none"
            stroke="#ffffff"
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            style={{
              transform: `scale(${circleScale}) rotate(${rotation}deg)`,
              transformOrigin: `${cx}px ${cy}px`,
            }}
          />
        </svg>

        {/* Text inside circle */}
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: `translate(-50%, -50%) scale(${circleScale})`,
            opacity: textOpacity,
            fontFamily: "'Inter', 'Helvetica Neue', sans-serif",
            fontSize: 'clamp(32px, 8vw, 120px)',
            fontWeight: 800,
            color,
            whiteSpace: 'nowrap',
            textAlign: 'center',
            textShadow: '0 2px 8px rgba(0,0,0,0.3)',
          }}
        >
          {word}
        </div>
      </div>
    )
  },
}

function CircleFrameComponent(props: MotionGraphicProps<CircleFrameConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-circle-frame',
  title: 'Kinetic Circle Frame',
  description: 'Text inside an SVG circle that draws in with stroke-dasharray animation. Circle rotates during hold and shrinks on exit.',
  tags: ['kinetic', 'typography', 'circle', 'frame', 'geometric', 'svg', 'draw-in'],
  category: 'captions',
  component: CircleFrameComponent as any,
  defaultConfig: {
    words: ['CIRCLE', 'FRAME', 'DRAW', 'CLEAN'],
    colors: ['#FFFFFF', '#FFFFFF', '#FFFFFF', '#FFFFFF'],
    bgColor: '#0f0f1a',
    cycleDuration: 1.6,
    circleColor: '#ffffff',
  },
  configSchema: [
    { key: 'words', label: 'Words', type: 'text-array', defaultValue: ['CIRCLE', 'FRAME', 'DRAW', 'CLEAN'], group: 'Content' },
    { key: 'colors', label: 'Colors', type: 'text-array', defaultValue: ['#FFFFFF', '#FFFFFF', '#FFFFFF', '#FFFFFF'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#0f0f1a', group: 'Style' },
    { key: 'cycleDuration', label: 'Cycle Duration (s)', type: 'number', defaultValue: 1.6, min: 0.3, max: 5, group: 'Timing' },
    { key: 'circleColor', label: 'Circle Color', type: 'color', defaultValue: '#ffffff', group: 'Animation' },
  ],
})
