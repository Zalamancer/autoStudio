import { registerMotionGraphic } from '../registry'
import {
  KineticBase,
  type KineticBaseConfig,
  type KineticAnimation,
  type WordRenderProps,
  type BackgroundRenderProps,
} from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface WaveformTextConfig extends KineticBaseConfig {
  waveColor: string
}

function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3)
}

const animation: KineticAnimation = {
  renderBackground: ({ bgColor, width, height, frame, fps }: BackgroundRenderProps) => {
    const time = frame / fps

    // Waveform bars (audio waveform visualization)
    const barCount = 80
    const bars = Array.from({ length: barCount }).map((_, i) => {
      const normalizedI = i / barCount
      const baseAmplitude = Math.sin(normalizedI * Math.PI) * 0.8 // Envelope shape
      const wave1 = Math.sin(normalizedI * 12 + time * 3) * 0.3
      const wave2 = Math.sin(normalizedI * 20 + time * 5) * 0.15
      const wave3 = Math.cos(normalizedI * 8 + time * 2) * 0.2
      const amplitude = Math.max(0.02, (baseAmplitude + wave1 + wave2 + wave3) * 0.5 + 0.15)

      const barH = amplitude * height * 0.6
      const hue = 200 + normalizedI * 60
      const barOpacity = 0.4 + amplitude * 0.6

      return (
        <div
          key={i}
          style={{
            position: 'absolute',
            left: `${(i / barCount) * 100}%`,
            top: '50%',
            width: `${90 / barCount}%`,
            height: barH,
            transform: 'translateY(-50%)',
            background: `linear-gradient(180deg, hsl(${hue}, 80%, 60%) 0%, hsl(${hue}, 90%, 40%) 100%)`,
            borderRadius: 2,
            opacity: barOpacity,
          }}
        />
      )
    })

    // Center timeline cursor
    const cursorX = ((time * 8) % 100)

    return (
      <div style={{ position: 'absolute', inset: 0, background: bgColor }}>
        {/* Subtle grid */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            backgroundImage: `
              linear-gradient(rgba(100,180,255,0.02) 1px, transparent 1px),
              linear-gradient(90deg, rgba(100,180,255,0.02) 1px, transparent 1px)
            `,
            backgroundSize: `${width / 16}px ${height / 8}px`,
          }}
        />

        {/* Center line */}
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: 0,
            right: 0,
            height: 1,
            background: 'rgba(100,180,255,0.1)',
          }}
        />

        {/* Waveform bars */}
        {bars}

        {/* Playhead cursor */}
        <div
          style={{
            position: 'absolute',
            top: '20%',
            left: `${cursorX}%`,
            width: 2,
            height: '60%',
            background: 'rgba(255,255,255,0.4)',
            boxShadow: '0 0 8px rgba(255,255,255,0.2)',
          }}
        />

        {/* Time markers */}
        {Array.from({ length: 5 }).map((_, i) => (
          <div
            key={i}
            style={{
              position: 'absolute',
              bottom: '10%',
              left: `${(i + 0.5) * 20}%`,
              fontSize: 9,
              color: 'rgba(100,180,255,0.25)',
              fontFamily: "'Courier New', monospace",
              transform: 'translateX(-50%)',
            }}
          >
            {i}:{String(i * 12).padStart(2, '0')}
          </div>
        ))}
      </div>
    )
  },

  renderWord: ({
    word,
    color,
    enterProgress,
    exitProgress,
    phase,
    frame,
    fps,
  }: WordRenderProps) => {
    const time = (frame ?? 0) / (fps ?? 30)
    let opacity = 1
    let scale = 1
    let letterSpacing = '0.08em'

    if (phase === 'enter') {
      const eased = easeOutCubic(enterProgress)
      opacity = eased
      scale = 0.85 + 0.15 * eased
      letterSpacing = `${0.2 - 0.12 * eased}em`
    } else if (phase === 'exit') {
      opacity = 1 - exitProgress
      scale = 1 + 0.15 * exitProgress
    }

    // Subtle waveform distortion on text
    const waveOffset = phase === 'hold' ? Math.sin(time * 6) * 1.5 : 0

    return (
      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: `translate(-50%, calc(-50% + ${waveOffset}px)) scale(${scale})`,
          opacity,
          fontSize: 'clamp(38px, 9vw, 130px)',
          fontWeight: 800,
          color,
          whiteSpace: 'nowrap',
          fontFamily: "'Courier New', 'Fira Code', monospace",
          textTransform: 'uppercase',
          letterSpacing,
          textShadow: `0 0 15px ${color}50, 0 0 40px ${color}25, 0 2px 10px rgba(0,0,0,0.8)`,
          zIndex: 10,
        }}
      >
        {word}
      </div>
    )
  },
}

function WaveformTextComponent(props: MotionGraphicProps<WaveformTextConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-waveform-text',
  title: 'Kinetic Waveform Text',
  description:
    'Words shaped as audio waveforms with animated frequency bars, playhead cursor, and DAW-style grid. Digital audio workstation aesthetic.',
  tags: ['kinetic', 'music', 'waveform', 'audio', 'daw', 'frequency', 'studio', 'festival'],
  category: 'captions',
  component: WaveformTextComponent as any,
  defaultConfig: {
    words: ['WAVE', 'FORM', 'DROP'],
    colors: ['#4FC3F7', '#29B6F6', '#81D4FA'],
    bgColor: '#080C12',
    cycleDuration: 1.3,
    waveColor: '#4FC3F7',
  },
  configSchema: [
    {
      key: 'words',
      label: 'Words',
      type: 'text-array',
      defaultValue: ['WAVE', 'FORM', 'DROP'],
      group: 'Content',
    },
    {
      key: 'colors',
      label: 'Colors',
      type: 'text-array',
      defaultValue: ['#4FC3F7', '#29B6F6', '#81D4FA'],
      group: 'Style',
    },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#080C12', group: 'Style' },
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
