import { registerMotionGraphic } from '../registry'
import {
  KineticBase,
  type KineticBaseConfig,
  type KineticAnimation,
  type WordRenderProps,
  type BackgroundRenderProps,
} from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface SineWaveConfig extends KineticBaseConfig {
  waveAmplitude: number
  waveFrequency: number
}

/** Deterministic pseudo-random 0..1 */
function rand(s: number): number {
  const x = Math.sin(s * 127.1 + 311.7) * 43758.5453
  return x - Math.floor(x)
}

const animation: KineticAnimation = {
  renderBackground: ({ bgColor, width, height, frame, fps }: BackgroundRenderProps) => {
    const time = frame / fps
    const waveCount = 5
    const pointCount = 100

    const waves = Array.from({ length: waveCount }).map((_, waveIdx) => {
      const amplitude = height * (0.06 + waveIdx * 0.025)
      const freq = 1.5 + waveIdx * 0.6
      const speed = 0.8 + waveIdx * 0.3
      const yCenter = height * (0.3 + waveIdx * 0.1)
      const opacity = 0.12 - waveIdx * 0.015

      const points: string[] = []
      for (let i = 0; i <= pointCount; i++) {
        const normalX = i / pointCount
        const x = normalX * width
        const y =
          yCenter +
          amplitude * Math.sin(normalX * freq * Math.PI * 2 + time * speed * Math.PI * 2)
        points.push(`${x},${y}`)
      }

      const pathD = `M ${points[0]} ` + points.slice(1).map((p) => `L ${p}`).join(' ')

      return (
        <svg
          key={waveIdx}
          style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}
          viewBox={`0 0 ${width} ${height}`}
          preserveAspectRatio="none"
        >
          <path
            d={pathD}
            fill="none"
            stroke="#00CCFF"
            strokeWidth={2}
            opacity={opacity}
          />
        </svg>
      )
    })

    // Grid overlay for oscilloscope feel
    return (
      <div style={{ position: 'absolute', inset: 0, background: bgColor }}>
        <div
          style={{
            position: 'absolute',
            inset: 0,
            backgroundImage: `
              linear-gradient(rgba(0,200,255,0.04) 1px, transparent 1px),
              linear-gradient(90deg, rgba(0,200,255,0.04) 1px, transparent 1px)
            `,
            backgroundSize: `${width / 16}px ${height / 10}px`,
          }}
        />
        {waves}
        {/* Center axis line */}
        <div
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            top: '50%',
            height: 1,
            background: 'rgba(0,200,255,0.08)',
          }}
        />
      </div>
    )
  },

  renderWord: ({ word, color, enterProgress, exitProgress, phase, holdProgress, width, height, frame }: WordRenderProps) => {
    const f = frame ?? 0
    const time = f / 30 // approximate fps
    const totalChars = word.length

    let masterOpacity = 1
    if (phase === 'enter') {
      masterOpacity = enterProgress
    } else if (phase === 'exit') {
      masterOpacity = 1 - exitProgress
    }

    // Each letter rides a sine wave with per-character phase offset
    const chars = word.split('').map((ch, ci) => {
      const charPhase = (ci / Math.max(1, totalChars - 1)) * Math.PI * 2
      const amplitude = height * 0.08
      let yOffset = 0
      let charOpacity = 1

      if (phase === 'enter') {
        // Wave builds up from flat to full amplitude
        yOffset = amplitude * enterProgress * Math.sin(charPhase + time * 3)
        charOpacity = Math.min(1, enterProgress * 2 - (ci / totalChars) * 0.5)
        charOpacity = Math.max(0, charOpacity)
      } else if (phase === 'hold') {
        // Continuous smooth oscillation
        yOffset = amplitude * Math.sin(charPhase + time * 3)
      } else {
        // Wave dampens out
        const damping = 1 - exitProgress
        yOffset = amplitude * damping * Math.sin(charPhase + time * 3)
        charOpacity = Math.max(0, 1 - exitProgress * 1.5 + (ci / totalChars) * 0.3)
      }

      // Subtle scale variation along the wave
      const scaleVar = 1 + 0.05 * Math.sin(charPhase + time * 3 + Math.PI / 2)

      return (
        <span
          key={ci}
          style={{
            display: 'inline-block',
            transform: `translateY(${yOffset}px) scale(${scaleVar})`,
            opacity: charOpacity,
            color,
            textShadow: `0 0 12px ${color}60, 0 ${Math.abs(yOffset) > amplitude * 0.5 ? 4 : 0}px 8px rgba(0,0,0,0.5)`,
          }}
        >
          {ch}
        </span>
      )
    })

    return (
      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          opacity: masterOpacity,
          fontFamily: "'Courier New', 'Fira Code', monospace",
          fontSize: 'clamp(40px, 11vw, 150px)',
          fontWeight: 700,
          whiteSpace: 'nowrap',
          textTransform: 'uppercase',
          letterSpacing: '0.06em',
          zIndex: 10,
        }}
      >
        {chars}
      </div>
    )
  },
}

function SineWaveComponent(props: MotionGraphicProps<SineWaveConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-sine-wave',
  title: 'Kinetic Sine Wave',
  description:
    'Text letters ride on a sine wave oscillation, each character displaced vertically by wave function with smooth oscilloscope-style background.',
  tags: ['kinetic', 'typography', 'sine', 'wave', 'oscillation', 'audio', 'signal', 'math'],
  category: 'captions',
  component: SineWaveComponent as any,
  defaultConfig: {
    words: ['SINE', 'WAVE', 'CYCLE', 'FLOW'],
    colors: ['#00CCFF', '#00FFEE', '#3399FF', '#66EEFF'],
    bgColor: '#060810',
    cycleDuration: 1.4,
    waveAmplitude: 40,
    waveFrequency: 2,
  },
  configSchema: [
    { key: 'words', label: 'Words', type: 'text-array', defaultValue: ['SINE', 'WAVE', 'CYCLE', 'FLOW'], group: 'Content' },
    { key: 'colors', label: 'Colors', type: 'text-array', defaultValue: ['#00CCFF', '#00FFEE', '#3399FF', '#66EEFF'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#060810', group: 'Style' },
    { key: 'cycleDuration', label: 'Cycle Duration (s)', type: 'number', defaultValue: 1.4, min: 0.3, max: 5, group: 'Timing' },
  ],
})
