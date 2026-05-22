import { registerMotionGraphic } from '../registry'
import {
  KineticBase,
  type KineticBaseConfig,
  type KineticAnimation,
  type WordRenderProps,
  type BackgroundRenderProps,
} from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface SineWaveDeformConfig extends KineticBaseConfig {
  waveColor: string
  waveFrequency: number
}

function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3)
}

const animation: KineticAnimation = {
  renderBackground: ({ bgColor, width, height, frame, fps }: BackgroundRenderProps) => {
    const time = frame / fps
    const waveFreq = 1.2 // Hz

    // Draw multiple sine wave bands across the background
    const numWaves = 5
    const bands = Array.from({ length: numWaves })

    return (
      <div style={{ position: 'absolute', inset: 0, background: bgColor }}>
        {bands.map((_, wi) => {
          const yBase = ((wi + 1) / (numWaves + 1)) * height
          const phase = wi * (Math.PI * 0.6)
          const amplitude = height * 0.04 + wi * height * 0.01
          const points: string[] = []
          const steps = 60
          for (let s = 0; s <= steps; s++) {
            const x = (s / steps) * width
            const y = yBase + Math.sin((s / steps) * Math.PI * 6 + time * waveFreq * Math.PI * 2 + phase) * amplitude
            points.push(`${x},${y}`)
          }
          const opacity = 0.08 + wi * 0.04
          return (
            <svg
              key={wi}
              style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}
              viewBox={`0 0 ${width} ${height}`}
              preserveAspectRatio="none"
            >
              <polyline
                points={points.join(' ')}
                fill="none"
                stroke={`rgba(0,200,255,${opacity})`}
                strokeWidth={1 + wi * 0.5}
              />
            </svg>
          )
        })}
        {/* Subtle horizontal scan gradient */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: `linear-gradient(to bottom,
              ${bgColor}40 0%,
              transparent 40%,
              transparent 60%,
              ${bgColor}40 100%)`,
          }}
        />
      </div>
    )
  },

  renderWord: ({ word, color, enterProgress, exitProgress, phase, frame = 0, index = 0 }: WordRenderProps) => {
    const time = frame / 30
    const waveFreq = 1.2
    let opacity = 1
    let scale = 1
    let translateY = 0

    if (phase === 'enter') {
      const eased = easeOutCubic(enterProgress)
      opacity = eased
      scale = 0.8 + 0.2 * eased
      translateY = (1 - eased) * 30
    } else if (phase === 'hold') {
      // Continuous sine wave vertical deform
      translateY = Math.sin(time * waveFreq * Math.PI * 2 + index * 1.2) * 12
      scale = 1 + Math.sin(time * waveFreq * Math.PI * 2 + index * 1.5 + Math.PI / 4) * 0.04
    } else {
      opacity = 1 - exitProgress
      translateY = exitProgress * -25
    }

    return (
      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: `translate(-50%, calc(-50% + ${translateY}px)) scale(${scale})`,
          opacity,
          fontSize: 'clamp(44px, 11vw, 148px)',
          fontWeight: 900,
          color,
          whiteSpace: 'nowrap',
          fontFamily: "'Impact', 'Arial Black', sans-serif",
          textTransform: 'uppercase',
          letterSpacing: '0.08em',
          textShadow: `
            0 0 30px ${color}70,
            0 0 60px ${color}35,
            0 4px 20px rgba(0,0,0,0.7)
          `,
          zIndex: 10,
        }}
      >
        {word}
      </div>
    )
  },
}

function SineWaveDeformComponent(props: MotionGraphicProps<SineWaveDeformConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-sine-wave-deform',
  title: 'Kinetic Sine Wave Deform',
  description:
    'Text continuously deforms vertically along a sine wave in perfect sync with background wave-band lines. Smooth oceanic rhythm for ambient music content.',
  tags: ['kinetic', 'music', 'sine', 'wave', 'deform', 'rhythm', 'oscillate', 'ambient', 'pulse'],
  category: 'captions',
  component: SineWaveDeformComponent as any,
  defaultConfig: {
    words: ['WAVE', 'FLOW', 'DRIFT', 'CREST'],
    colors: ['#00D4FF', '#00A8FF', '#40E0FF', '#0090DD'],
    bgColor: '#040B12',
    cycleDuration: 1.4,
    waveColor: '#00D4FF',
    waveFrequency: 1.2,
  },
  configSchema: [
    {
      key: 'words',
      label: 'Words',
      type: 'text-array',
      defaultValue: ['WAVE', 'FLOW', 'DRIFT', 'CREST'],
      group: 'Content',
    },
    {
      key: 'colors',
      label: 'Colors',
      type: 'text-array',
      defaultValue: ['#00D4FF', '#00A8FF', '#40E0FF', '#0090DD'],
      group: 'Style',
    },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#040B12', group: 'Style' },
    {
      key: 'cycleDuration',
      label: 'Cycle Duration (s)',
      type: 'number',
      defaultValue: 1.4,
      min: 0.3,
      max: 5,
      group: 'Timing',
    },
    {
      key: 'waveFrequency',
      label: 'Wave Frequency (Hz)',
      type: 'number',
      defaultValue: 1.2,
      min: 0.3,
      max: 4,
      group: 'Animation',
    },
  ],
})
