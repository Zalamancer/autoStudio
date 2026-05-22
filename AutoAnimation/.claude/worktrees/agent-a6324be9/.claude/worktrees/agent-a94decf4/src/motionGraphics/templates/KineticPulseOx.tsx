import { registerMotionGraphic } from '../registry'
import { KineticBase, type KineticBaseConfig, type KineticAnimation, type WordRenderProps, type BackgroundRenderProps } from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface PulseOxConfig extends KineticBaseConfig {}

/** Plethysmograph waveform - smooth arterial pulse shape */
function plethWave(t: number): number {
  const cycle = ((t % 1) + 1) % 1
  // Systolic rise
  if (cycle < 0.15) {
    return Math.sin((cycle / 0.15) * Math.PI * 0.5) * 1.0
  }
  // Dicrotic notch area
  if (cycle < 0.3) {
    const d = (cycle - 0.15) / 0.15
    return (1.0 - d * 0.6) + Math.sin(d * Math.PI) * 0.1
  }
  // Diastolic decay
  if (cycle < 0.8) {
    const d = (cycle - 0.3) / 0.5
    return 0.4 * (1 - d * d)
  }
  return 0
}

const animation: KineticAnimation = {
  renderBackground: ({ bgColor, width, height, frame }: BackgroundRenderProps) => {
    // Plethysmograph waveform
    const waveY = height * 0.7
    const waveAmplitude = height * 0.2
    const scrollSpeed = frame * 1.8
    const points: string[] = []
    for (let px = 0; px < width; px += 2) {
      const t = (px + scrollSpeed) / 160
      const yVal = plethWave(t) * waveAmplitude
      points.push(`${px},${waveY - yVal}`)
    }

    // SpO2 display
    const spo2 = 97 + Math.floor(Math.sin(frame * 0.02) * 2)
    // Heart rate display
    const hr = 72 + Math.floor(Math.sin(frame * 0.015 + 1) * 4)
    // Pulse indicator blink
    const pulsePhase = (frame * 0.08) % (Math.PI * 2)
    const pulseBright = Math.max(0, Math.sin(pulsePhase))

    return (
      <div style={{ position: 'absolute', inset: 0, background: bgColor }}>
        <svg width={width} height={height} style={{ position: 'absolute', inset: 0 }}>
          {/* Waveform glow */}
          <polyline
            points={points.join(' ')}
            fill="none"
            stroke="rgba(255, 40, 40, 0.12)"
            strokeWidth={8}
            strokeLinejoin="round"
          />
          {/* Main waveform */}
          <polyline
            points={points.join(' ')}
            fill="none"
            stroke="#ff3030"
            strokeWidth={2.5}
            strokeLinejoin="round"
          />
          {/* Leading pulse dot */}
          <circle
            cx={width - 2}
            cy={waveY - plethWave((width - 2 + scrollSpeed) / 160) * waveAmplitude}
            r={4}
            fill="#ff4040"
          />
        </svg>

        {/* SpO2 readout - top left */}
        <div
          style={{
            position: 'absolute',
            top: 20,
            left: 20,
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          <div style={{ fontFamily: 'monospace', fontSize: 11, color: 'rgba(255,100,100,0.5)', letterSpacing: 1 }}>
            SpO2 %
          </div>
          <div
            style={{
              fontFamily: "'Courier New', monospace",
              fontSize: 'clamp(36px, 8vw, 80px)',
              fontWeight: 700,
              color: '#ff4040',
              textShadow: `0 0 ${6 + pulseBright * 10}px rgba(255,40,40,0.4)`,
              lineHeight: 1,
            }}
          >
            {spo2}
          </div>
        </div>

        {/* Heart rate readout - top right */}
        <div
          style={{
            position: 'absolute',
            top: 20,
            right: 20,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'flex-end',
          }}
        >
          <div style={{ fontFamily: 'monospace', fontSize: 11, color: 'rgba(100,255,100,0.5)', letterSpacing: 1 }}>
            HR bpm
          </div>
          <div
            style={{
              fontFamily: "'Courier New', monospace",
              fontSize: 'clamp(28px, 6vw, 60px)',
              fontWeight: 700,
              color: '#40ff40',
              textShadow: '0 0 6px rgba(40,255,40,0.3)',
              lineHeight: 1,
            }}
          >
            {hr}
          </div>
        </div>

        {/* Pulse heart icon */}
        <div
          style={{
            position: 'absolute',
            top: 22,
            right: 90,
            fontSize: 18,
            color: `rgba(255, 60, 60, ${0.3 + pulseBright * 0.5})`,
            transform: `scale(${1 + pulseBright * 0.15})`,
          }}
        >
          &#9829;
        </div>

        {/* Clinical red glow overlay */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: `radial-gradient(ellipse at 50% 70%, rgba(255, 20, 20, ${0.02 + pulseBright * 0.02}) 0%, transparent 60%)`,
            pointerEvents: 'none',
          }}
        />

        {/* Monitor bezel */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            boxShadow: 'inset 0 0 60px rgba(0,0,0,0.5)',
            borderRadius: 4,
            pointerEvents: 'none',
          }}
        />
      </div>
    )
  },

  renderWord: ({ word, color, enterProgress, holdProgress, exitProgress, phase, frame }: WordRenderProps) => {
    const f = frame ?? 0
    // Text pulsates with the plethysmograph rhythm
    const pulsePhase = (f * 0.08) % (Math.PI * 2)
    const pulseBeat = Math.max(0, Math.sin(pulsePhase))
    const beatScale = 1 + pulseBeat * 0.04

    if (phase === 'enter') {
      // Fade in synced with a pulse beat
      const opacity = enterProgress
      const scale = 0.9 + enterProgress * 0.1
      return (
        <div
          style={{
            position: 'absolute',
            top: '38%',
            left: '50%',
            transform: `translate(-50%, -50%) scale(${scale})`,
            fontFamily: "'Courier New', monospace",
            fontSize: 'clamp(36px, 10vw, 130px)',
            fontWeight: 700,
            color,
            textShadow: `0 0 10px ${color}, 0 0 25px rgba(255,40,40,0.2)`,
            whiteSpace: 'nowrap',
            letterSpacing: 6,
            opacity,
          }}
        >
          {word}
        </div>
      )
    } else if (phase === 'hold') {
      return (
        <div
          style={{
            position: 'absolute',
            top: '38%',
            left: '50%',
            transform: `translate(-50%, -50%) scale(${beatScale})`,
            fontFamily: "'Courier New', monospace",
            fontSize: 'clamp(36px, 10vw, 130px)',
            fontWeight: 700,
            color,
            textShadow: `0 0 ${8 + pulseBeat * 12}px ${color}, 0 0 ${20 + pulseBeat * 15}px rgba(255,40,40,0.25)`,
            whiteSpace: 'nowrap',
            letterSpacing: 6,
          }}
        >
          {word}
        </div>
      )
    } else {
      const opacity = 1 - exitProgress
      return (
        <div
          style={{
            position: 'absolute',
            top: '38%',
            left: '50%',
            transform: `translate(-50%, -50%) scale(${1 - exitProgress * 0.1})`,
            fontFamily: "'Courier New', monospace",
            fontSize: 'clamp(36px, 10vw, 130px)',
            fontWeight: 700,
            color,
            textShadow: `0 0 8px ${color}`,
            whiteSpace: 'nowrap',
            letterSpacing: 6,
            opacity,
          }}
        >
          {word}
        </div>
      )
    }
  },
}

function PulseOxComponent(props: MotionGraphicProps<PulseOxConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-pulse-ox',
  title: 'Kinetic Pulse Ox',
  description: 'Pulse oximeter with plethysmograph waveform, SpO2 percentage, heart rate display, pulsating text synced to heartbeat rhythm',
  tags: ['kinetic', 'typography', 'pulse', 'oximeter', 'medical', 'heartbeat', 'monitor', 'clinical'],
  category: 'captions',
  component: PulseOxComponent as any,
  defaultConfig: {
    words: ['VITAL', 'PULSE', 'BLOOD', 'LIFE'],
    colors: ['#ff4444', '#ff6644', '#ff3333', '#ff5555'],
    bgColor: '#0a0808',
    cycleDuration: 1.3,
  },
  configSchema: [
    { key: 'words', label: 'Words', type: 'text-array', defaultValue: ['VITAL', 'PULSE', 'BLOOD', 'LIFE'], group: 'Content' },
    { key: 'colors', label: 'Colors', type: 'text-array', defaultValue: ['#ff4444', '#ff6644', '#ff3333'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#0a0808', group: 'Style' },
    { key: 'cycleDuration', label: 'Cycle Duration (s)', type: 'number', defaultValue: 1.3, min: 0.3, max: 5, group: 'Timing' },
  ],
})
