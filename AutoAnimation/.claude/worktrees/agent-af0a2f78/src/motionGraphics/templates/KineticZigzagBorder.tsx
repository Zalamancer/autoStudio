import { registerMotionGraphic } from '../registry'
import {
  KineticBase,
  type KineticBaseConfig,
  type KineticAnimation,
  type WordRenderProps,
  type BackgroundRenderProps,
} from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface ZigzagBorderConfig extends KineticBaseConfig {
  zigzagColor: string
}

function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3)
}

function easeInCubic(t: number): number {
  return t * t * t
}

// Generate zigzag SVG path
function zigzagPath(y: number, width: number, amplitude: number, teeth: number, flip: boolean): string {
  const step = width / teeth
  let d = `M0,${y}`
  for (let i = 0; i <= teeth; i++) {
    const x = i * step
    const dy = i % 2 === 0 ? (flip ? amplitude : -amplitude) : (flip ? -amplitude : amplitude)
    d += ` L${x},${y + dy}`
  }
  return d
}

const animation: KineticAnimation = {
  renderBackground: ({ bgColor }: BackgroundRenderProps) => (
    <div style={{ position: 'absolute', inset: 0, background: bgColor }} />
  ),

  renderWord: ({ word, color, enterProgress, holdProgress, exitProgress, phase, width, height }: WordRenderProps) => {
    const zigzagHeight = height * 0.18
    const teeth = 16
    const amplitude = zigzagHeight * 0.5

    // Top zigzag slides in from left, bottom from right
    let topSlide = -width
    let bottomSlide = width
    let textOpacity = 0
    let colorShiftHue = 0

    if (phase === 'enter') {
      const ease = easeOutCubic(enterProgress)
      topSlide = -width * (1 - ease)
      bottomSlide = width * (1 - ease)
      textOpacity = easeOutCubic(Math.max(0, (enterProgress - 0.5) / 0.5))
    } else if (phase === 'hold') {
      topSlide = 0
      bottomSlide = 0
      textOpacity = 1
      // Color shift during hold
      colorShiftHue = holdProgress * 60
    } else {
      const ease = easeInCubic(exitProgress)
      topSlide = width * ease
      bottomSlide = -width * ease
      textOpacity = 1 - ease
      colorShiftHue = 60
    }

    const topY = zigzagHeight
    const bottomY = height - zigzagHeight

    return (
      <div style={{ position: 'absolute', inset: 0 }}>
        {/* Top zigzag border */}
        <svg
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: `${zigzagHeight * 2}px`,
            transform: `translateX(${topSlide}px)`,
            overflow: 'visible',
          }}
          viewBox={`0 0 ${width} ${zigzagHeight * 2}`}
          preserveAspectRatio="none"
        >
          <path
            d={zigzagPath(zigzagHeight, width, amplitude, teeth, false)}
            fill="none"
            stroke={`hsl(${340 + colorShiftHue}, 80%, 60%)`}
            strokeWidth={3}
            strokeLinejoin="round"
          />
          <path
            d={zigzagPath(zigzagHeight * 0.6, width, amplitude * 0.6, teeth, false)}
            fill="none"
            stroke={`hsl(${340 + colorShiftHue}, 80%, 60%)`}
            strokeWidth={1.5}
            strokeLinejoin="round"
            opacity={0.4}
          />
          {/* Fill above zigzag */}
          <rect x="0" y="0" width={width} height={zigzagHeight * 0.3} fill={`hsl(${340 + colorShiftHue}, 80%, 60%)`} opacity={0.15} />
        </svg>

        {/* Bottom zigzag border */}
        <svg
          style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            width: '100%',
            height: `${zigzagHeight * 2}px`,
            transform: `translateX(${bottomSlide}px)`,
            overflow: 'visible',
          }}
          viewBox={`0 0 ${width} ${zigzagHeight * 2}`}
          preserveAspectRatio="none"
        >
          <path
            d={zigzagPath(zigzagHeight, width, amplitude, teeth, true)}
            fill="none"
            stroke={`hsl(${340 + colorShiftHue}, 80%, 60%)`}
            strokeWidth={3}
            strokeLinejoin="round"
          />
          <path
            d={zigzagPath(zigzagHeight * 1.4, width, amplitude * 0.6, teeth, true)}
            fill="none"
            stroke={`hsl(${340 + colorShiftHue}, 80%, 60%)`}
            strokeWidth={1.5}
            strokeLinejoin="round"
            opacity={0.4}
          />
          {/* Fill below zigzag */}
          <rect x="0" y={zigzagHeight * 1.7} width={width} height={zigzagHeight * 0.3} fill={`hsl(${340 + colorShiftHue}, 80%, 60%)`} opacity={0.15} />
        </svg>

        {/* Text between zigzags */}
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            opacity: textOpacity,
            fontFamily: "'Inter', 'Helvetica Neue', sans-serif",
            fontSize: 'clamp(40px, 10vw, 140px)',
            fontWeight: 900,
            color,
            whiteSpace: 'nowrap',
            textShadow: '0 2px 8px rgba(0,0,0,0.4)',
            textTransform: 'uppercase',
          }}
        >
          {word}
        </div>
      </div>
    )
  },
}

function ZigzagBorderComponent(props: MotionGraphicProps<ZigzagBorderConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-zigzag-border',
  title: 'Kinetic Zigzag Border',
  description: 'Zigzag/sawtooth borders slide in from opposite sides framing the text. Color shifts during hold. Zigzags slide out on exit.',
  tags: ['kinetic', 'typography', 'zigzag', 'sawtooth', 'border', 'geometric', 'abstract'],
  category: 'captions',
  component: ZigzagBorderComponent as any,
  defaultConfig: {
    words: ['ZIGZAG', 'EDGE', 'SHARP', 'BOLD'],
    colors: ['#FFFFFF', '#FFD0E0', '#FFFFFF', '#FFD0E0'],
    bgColor: '#12060c',
    cycleDuration: 1.5,
    zigzagColor: '#FF4080',
  },
  configSchema: [
    { key: 'words', label: 'Words', type: 'text-array', defaultValue: ['ZIGZAG', 'EDGE', 'SHARP', 'BOLD'], group: 'Content' },
    { key: 'colors', label: 'Colors', type: 'text-array', defaultValue: ['#FFFFFF', '#FFD0E0', '#FFFFFF', '#FFD0E0'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#12060c', group: 'Style' },
    { key: 'cycleDuration', label: 'Cycle Duration (s)', type: 'number', defaultValue: 1.5, min: 0.3, max: 5, group: 'Timing' },
    { key: 'zigzagColor', label: 'Zigzag Color', type: 'color', defaultValue: '#FF4080', group: 'Animation' },
  ],
})
