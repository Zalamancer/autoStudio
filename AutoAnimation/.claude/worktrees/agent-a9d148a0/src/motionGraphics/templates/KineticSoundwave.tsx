import { registerMotionGraphic } from '../registry'
import {
  KineticBase,
  type KineticBaseConfig,
  type KineticAnimation,
  type WordRenderProps,
  type BackgroundRenderProps,
} from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface SoundwaveConfig extends KineticBaseConfig {
  waveColor: string
}

const animation: KineticAnimation = {
  renderBackground: ({ bgColor, width, height, frame, fps }: BackgroundRenderProps) => {
    const time = frame / fps
    const waveCount = 3
    const pointCount = 80

    const waves = Array.from({ length: waveCount }).map((_, waveIdx) => {
      const amplitude = height * (0.08 + waveIdx * 0.04)
      const frequency = 2 + waveIdx * 0.8
      const speed = 1.5 + waveIdx * 0.5
      const yOffset = height * 0.5
      const waveOpacity = 0.6 - waveIdx * 0.15

      const points: string[] = []
      for (let i = 0; i <= pointCount; i++) {
        const x = (i / pointCount) * width
        const normalizedX = i / pointCount
        const y =
          yOffset +
          amplitude * Math.sin(normalizedX * frequency * Math.PI * 2 + time * speed * Math.PI) *
            (0.3 + 0.7 * Math.sin(normalizedX * Math.PI)) +
          amplitude * 0.3 *
            Math.sin(normalizedX * frequency * 1.7 * Math.PI * 2 + time * speed * 1.3 * Math.PI)
        points.push(`${x},${y}`)
      }

      const pathD = `M ${points[0]} ` + points.slice(1).map((p) => `L ${p}`).join(' ')

      const green = waveIdx === 0 ? '#00FF66' : waveIdx === 1 ? '#00CC55' : '#009944'
      const glow = waveIdx === 0 ? '#00FF66' : '#00CC55'

      return (
        <svg
          key={waveIdx}
          style={{
            position: 'absolute',
            inset: 0,
            width: '100%',
            height: '100%',
            opacity: waveOpacity,
          }}
          viewBox={`0 0 ${width} ${height}`}
          preserveAspectRatio="none"
        >
          <defs>
            <filter id={`glow-${waveIdx}`}>
              <feGaussianBlur stdDeviation={4 + waveIdx * 2} result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>
          {/* Glow layer */}
          <path
            d={pathD}
            fill="none"
            stroke={glow}
            strokeWidth={6 - waveIdx}
            opacity={0.3}
            filter={`url(#glow-${waveIdx})`}
          />
          {/* Main wave */}
          <path
            d={pathD}
            fill="none"
            stroke={green}
            strokeWidth={3 - waveIdx * 0.5}
            strokeLinecap="round"
          />
        </svg>
      )
    })

    return (
      <div style={{ position: 'absolute', inset: 0, background: bgColor }}>
        {/* Grid lines for visualizer feel */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            backgroundImage: `
              linear-gradient(rgba(0,255,102,0.03) 1px, transparent 1px),
              linear-gradient(90deg, rgba(0,255,102,0.03) 1px, transparent 1px)
            `,
            backgroundSize: `${width / 20}px ${height / 12}px`,
          }}
        />
        {waves}
      </div>
    )
  },

  renderWord: ({
    word,
    color,
    enterProgress,
    exitProgress,
    phase,
  }: WordRenderProps) => {
    let opacity = 1
    let scale = 1
    let letterSpacing = '0.05em'

    if (phase === 'enter') {
      opacity = enterProgress
      scale = 0.9 + 0.1 * enterProgress
      letterSpacing = `${0.15 - 0.1 * enterProgress}em`
    } else if (phase === 'exit') {
      opacity = 1 - exitProgress
      scale = 1 + 0.1 * exitProgress
    }

    return (
      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: `translate(-50%, -50%) scale(${scale})`,
          opacity,
          fontSize: 'clamp(40px, 10vw, 140px)',
          fontWeight: 800,
          color,
          whiteSpace: 'nowrap',
          fontFamily: "'Courier New', 'Fira Code', monospace",
          textTransform: 'uppercase',
          letterSpacing,
          textShadow: `0 0 20px ${color}60, 0 0 40px ${color}30, 0 2px 10px rgba(0,0,0,0.8)`,
          zIndex: 10,
        }}
      >
        {word}
      </div>
    )
  },
}

function SoundwaveComponent(props: MotionGraphicProps<SoundwaveConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-soundwave',
  title: 'Kinetic Soundwave',
  description:
    'Animated oscillating soundwave waveforms behind text. Green-on-dark audio visualizer aesthetic with grid overlay.',
  tags: ['kinetic', 'music', 'soundwave', 'waveform', 'audio', 'visualizer', 'green'],
  category: 'captions',
  component: SoundwaveComponent as any,
  defaultConfig: {
    words: ['SOUND', 'WAVE', 'CHECK'],
    colors: ['#00FF66', '#00FFAA', '#66FF99'],
    bgColor: '#080C08',
    cycleDuration: 1.3,
    waveColor: '#00FF66',
  },
  configSchema: [
    {
      key: 'words',
      label: 'Words',
      type: 'text-array',
      defaultValue: ['SOUND', 'WAVE', 'CHECK'],
      group: 'Content',
    },
    {
      key: 'colors',
      label: 'Colors',
      type: 'text-array',
      defaultValue: ['#00FF66', '#00FFAA', '#66FF99'],
      group: 'Style',
    },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#080C08', group: 'Style' },
    {
      key: 'cycleDuration',
      label: 'Cycle Duration (s)',
      type: 'number',
      defaultValue: 1.3,
      min: 0.3,
      max: 5,
      group: 'Timing',
    },
  ],
})
