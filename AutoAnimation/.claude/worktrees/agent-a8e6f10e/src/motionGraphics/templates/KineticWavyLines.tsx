import { registerMotionGraphic } from '../registry'
import {
  KineticBase,
  type KineticBaseConfig,
  type KineticAnimation,
  type WordRenderProps,
  type BackgroundRenderProps,
} from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface WavyLinesConfig extends KineticBaseConfig {
  waveColor: string
}

function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3)
}

function easeInCubic(t: number): number {
  return t * t * t
}

const WAVE_COUNT = 8

function wavePath(y: number, width: number, amplitude: number, frequency: number, phaseOffset: number, time: number, flatten: number): string {
  const points: string[] = []
  const steps = 60
  for (let i = 0; i <= steps; i++) {
    const x = (i / steps) * width
    const waveY = y + Math.sin(((x / width) * Math.PI * 2 * frequency) + phaseOffset + time * 2) * amplitude * flatten
    points.push(`${i === 0 ? 'M' : 'L'}${x.toFixed(1)},${waveY.toFixed(1)}`)
  }
  return points.join(' ')
}

const animation: KineticAnimation = {
  renderBackground: ({ bgColor, frame, fps, width, height }: BackgroundRenderProps) => {
    const time = frame / fps
    const waves: React.ReactNode[] = []

    for (let i = 0; i < WAVE_COUNT; i++) {
      const y = (height / (WAVE_COUNT + 1)) * (i + 1)
      const amplitude = 15 + i * 3
      const frequency = 1.5 + i * 0.3
      const phaseOffset = i * 1.2

      // Waves near center have lower opacity so text area stays clean
      const distFromCenter = Math.abs(y - height / 2) / (height / 2)
      const baseOpacity = 0.1 + distFromCenter * 0.25

      waves.push(
        <path
          key={i}
          d={wavePath(y, width, amplitude, frequency, phaseOffset, time, 1)}
          fill="none"
          stroke="rgba(120,220,180,0.7)"
          strokeWidth={1.5}
          opacity={baseOpacity}
        />
      )
    }

    return (
      <div style={{ position: 'absolute', inset: 0, background: bgColor, overflow: 'hidden' }}>
        <svg
          style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}
          viewBox={`0 0 ${width} ${height}`}
          preserveAspectRatio="none"
        >
          {waves}
        </svg>
      </div>
    )
  },

  renderWord: ({ word, color, enterProgress, holdProgress, exitProgress, phase }: WordRenderProps) => {
    let textOpacity = 0
    let translateX = -40

    if (phase === 'enter') {
      textOpacity = easeOutCubic(enterProgress)
      translateX = -40 * (1 - easeOutCubic(enterProgress))
    } else if (phase === 'hold') {
      textOpacity = 1
      translateX = 0
    } else {
      textOpacity = 1 - easeInCubic(exitProgress)
      translateX = 0
    }

    return (
      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: `translate(calc(-50% + ${translateX}px), -50%)`,
          opacity: textOpacity,
        }}
      >
        {/* Clean area behind text */}
        <div
          style={{
            position: 'absolute',
            inset: '-30px -60px',
            background: 'radial-gradient(ellipse, rgba(8,16,12,0.9) 0%, transparent 70%)',
            borderRadius: '50%',
          }}
        />
        <div
          style={{
            position: 'relative',
            fontFamily: "'Inter', 'Helvetica Neue', sans-serif",
            fontSize: 'clamp(40px, 10vw, 140px)',
            fontWeight: 800,
            color,
            whiteSpace: 'nowrap',
            textShadow: '0 0 25px rgba(120,220,180,0.3), 0 2px 8px rgba(0,0,0,0.5)',
            letterSpacing: '3px',
          }}
        >
          {word}
        </div>
      </div>
    )
  },
}

function WavyLinesComponent(props: MotionGraphicProps<WavyLinesConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-wavy-lines',
  title: 'Kinetic Wavy Lines',
  description: 'Multiple sine-wave lines flow across the background. Text slides in over a clean center area. Waves animate continuously.',
  tags: ['kinetic', 'typography', 'waves', 'sine', 'lines', 'organic', 'flow', 'abstract'],
  category: 'captions',
  component: WavyLinesComponent as any,
  defaultConfig: {
    words: ['WAVE', 'FLOW', 'DRIFT', 'CALM'],
    colors: ['#FFFFFF', '#78DCB4', '#FFFFFF', '#78DCB4'],
    bgColor: '#08100c',
    cycleDuration: 1.5,
    waveColor: '#78DCB4',
  },
  configSchema: [
    { key: 'words', label: 'Words', type: 'text-array', defaultValue: ['WAVE', 'FLOW', 'DRIFT', 'CALM'], group: 'Content' },
    { key: 'colors', label: 'Colors', type: 'text-array', defaultValue: ['#FFFFFF', '#78DCB4', '#FFFFFF', '#78DCB4'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#08100c', group: 'Style' },
    { key: 'cycleDuration', label: 'Cycle Duration (s)', type: 'number', defaultValue: 1.5, min: 0.3, max: 5, group: 'Timing' },
    { key: 'waveColor', label: 'Wave Color', type: 'color', defaultValue: '#78DCB4', group: 'Animation' },
  ],
})
