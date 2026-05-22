import { registerMotionGraphic } from '../registry'
import {
  KineticBase,
  type KineticBaseConfig,
  type KineticAnimation,
  type WordRenderProps,
  type BackgroundRenderProps,
} from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface HeartbeatPulseConfig extends KineticBaseConfig {
  heartColor: string
  bpm: number
}

function easeOutElastic(t: number): number {
  const c4 = (2 * Math.PI) / 3
  return t === 0 ? 0 : t === 1 ? 1 : Math.pow(2, -10 * t) * Math.sin((t * 10 - 0.75) * c4) + 1
}

// Heartbeat waveform: lub-dub
function heartbeatValue(phase: number): number {
  // Lub (first peak, ~phase 0.05-0.15)
  if (phase < 0.05) return 0
  if (phase < 0.1) return (phase - 0.05) / 0.05
  if (phase < 0.15) return 1 - ((phase - 0.1) / 0.05) * 0.4
  // brief dip
  if (phase < 0.2) return 0.6 - ((phase - 0.15) / 0.05) * 0.5
  // Dub (second peak, ~phase 0.20-0.30)
  if (phase < 0.25) return 0.1 + ((phase - 0.2) / 0.05) * 0.7
  if (phase < 0.3) return 0.8 - ((phase - 0.25) / 0.05) * 0.8
  // Flat line
  return 0
}

const animation: KineticAnimation = {
  renderBackground: ({ bgColor, width, height, frame, fps }: BackgroundRenderProps) => {
    const time = frame / fps
    const bpm = 90
    const beatFreq = bpm / 60
    const beatPhase = (time * beatFreq) % 1
    const pulse = heartbeatValue(beatPhase)

    // Draw EKG-style trace across the background
    const traceY = height * 0.5
    const traceH = height * 0.15
    const points: string[] = []
    const steps = 100
    for (let s = 0; s <= steps; s++) {
      const t = s / steps
      // Show current + recent history of waveform
      const tp = (beatPhase - (1 - t) * 0.6 + 1) % 1
      const v = heartbeatValue(tp)
      const x = t * width
      const y = traceY - v * traceH
      points.push(`${x.toFixed(1)},${y.toFixed(1)}`)
    }

    return (
      <div style={{ position: 'absolute', inset: 0, background: bgColor }}>
        {/* Glow behind trace */}
        <div
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            top: '45%',
            height: '10%',
            background: `linear-gradient(to right, transparent, rgba(255,50,80,${pulse * 0.15}), transparent)`,
          }}
        />
        {/* EKG trace */}
        <svg
          style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}
          viewBox={`0 0 ${width} ${height}`}
          preserveAspectRatio="none"
        >
          <polyline points={points.join(' ')} fill="none" stroke={`rgba(255,60,80,0.5)`} strokeWidth={2} />
          {/* Glow layer */}
          <polyline points={points.join(' ')} fill="none" stroke={`rgba(255,100,120,0.2)`} strokeWidth={6} />
        </svg>
        {/* Expanding pulse rings on lub-dub peaks */}
        {pulse > 0.3 &&
          [0, 1].map((i) => (
            <div
              key={i}
              style={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                width: Math.min(width, height) * (0.3 + i * 0.2 + pulse * 0.3),
                height: Math.min(width, height) * (0.3 + i * 0.2 + pulse * 0.3),
                borderRadius: '50%',
                border: `1px solid rgba(255,60,80,${Math.max(0, pulse * 0.4 - i * 0.15)})`,
                transform: 'translate(-50%, -50%)',
              }}
            />
          ))}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: `radial-gradient(ellipse at 50% 50%, transparent 30%, ${bgColor}BB 100%)`,
          }}
        />
      </div>
    )
  },

  renderWord: ({ word, color, enterProgress, exitProgress, phase, frame = 0 }: WordRenderProps) => {
    const time = frame / 30
    const bpm = 90
    const beatFreq = bpm / 60
    const beatPhase = (time * beatFreq) % 1
    const pulse = heartbeatValue(beatPhase)

    let opacity = 1
    let scale = 1

    if (phase === 'enter') {
      const eased = easeOutElastic(enterProgress)
      opacity = Math.min(1, enterProgress * 3)
      scale = 0.6 + 0.4 * eased
    } else if (phase === 'hold') {
      // Scale on heartbeat pulse
      scale = 1 + pulse * 0.12
    } else {
      opacity = 1 - exitProgress
      scale = 1 - exitProgress * 0.25
    }

    return (
      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: `translate(-50%, -50%) scale(${scale})`,
          opacity,
          fontSize: 'clamp(48px, 12vw, 160px)',
          fontWeight: 900,
          color,
          whiteSpace: 'nowrap',
          fontFamily: "'Impact', 'Arial Black', sans-serif",
          textTransform: 'uppercase',
          letterSpacing: '0.06em',
          textShadow: `
            0 0 ${20 + pulse * 40}px ${color}${Math.round(40 + pulse * 80)
              .toString(16)
              .padStart(2, '0')},
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

function HeartbeatPulseComponent(props: MotionGraphicProps<HeartbeatPulseConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-heartbeat-pulse',
  title: 'Kinetic Heartbeat Pulse',
  description:
    'Text scales with a realistic lub-dub heartbeat rhythm. Live EKG trace scrolls across the background with expanding pulse rings on every beat.',
  tags: ['kinetic', 'music', 'heartbeat', 'pulse', 'ekg', 'rhythm', 'bass', 'beat', 'health'],
  category: 'captions',
  component: HeartbeatPulseComponent as any,
  defaultConfig: {
    words: ['PULSE', 'ALIVE', 'HEART', 'BEAT'],
    colors: ['#FF3050', '#FF1A3A', '#FF5070', '#FF2040'],
    bgColor: '#080005',
    cycleDuration: 1.2,
    heartColor: '#FF3050',
    bpm: 90,
  },
  configSchema: [
    {
      key: 'words',
      label: 'Words',
      type: 'text-array',
      defaultValue: ['PULSE', 'ALIVE', 'HEART', 'BEAT'],
      group: 'Content',
    },
    {
      key: 'colors',
      label: 'Colors',
      type: 'text-array',
      defaultValue: ['#FF3050', '#FF1A3A', '#FF5070', '#FF2040'],
      group: 'Style',
    },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#080005', group: 'Style' },
    {
      key: 'cycleDuration',
      label: 'Cycle Duration (s)',
      type: 'number',
      defaultValue: 1.2,
      min: 0.3,
      max: 5,
      group: 'Timing',
    },
    { key: 'bpm', label: 'BPM', type: 'number', defaultValue: 90, min: 60, max: 180, group: 'Animation' },
  ],
})
