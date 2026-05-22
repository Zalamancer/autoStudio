import { registerMotionGraphic } from '../registry'
import {
  KineticBase,
  type KineticBaseConfig,
  type KineticAnimation,
  type WordRenderProps,
  type BackgroundRenderProps,
} from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface EKGTraceConfig extends KineticBaseConfig {}

function pseudo(seed: number): number {
  const x = Math.sin(seed * 127.1 + 311.7) * 43758.5453
  return x - Math.floor(x)
}

function easeOutElastic(t: number): number {
  if (t === 0 || t === 1) return t
  const p = 0.4
  return Math.pow(2, -10 * t) * Math.sin(((t - p / 4) * (2 * Math.PI)) / p) + 1
}

function easeInQuad(t: number): number {
  return t * t
}

/** Generate a PQRST waveform segment at normalized x position (0-1) */
function ekgWaveY(x: number, amplitude: number, baseY: number): number {
  // Realistic PQRST morphology
  if (x < 0.0) return baseY
  if (x < 0.15) {
    // P wave — gentle gaussian bump
    const t = (x - 0.075) / 0.04
    return baseY - amplitude * 0.12 * Math.exp(-t * t)
  }
  if (x < 0.18) return baseY // PR segment
  if (x < 0.22) {
    // Q dip
    const t = (x - 0.20) / 0.015
    return baseY + amplitude * 0.08 * Math.exp(-t * t)
  }
  if (x < 0.32) {
    // R spike — sharp tall peak
    const t = (x - 0.27) / 0.025
    return baseY - amplitude * 0.85 * Math.exp(-t * t)
  }
  if (x < 0.38) {
    // S dip
    const t = (x - 0.35) / 0.018
    return baseY + amplitude * 0.15 * Math.exp(-t * t)
  }
  if (x < 0.42) return baseY // ST segment
  if (x < 0.65) {
    // T wave — broad gentle bump
    const t = (x - 0.535) / 0.06
    return baseY - amplitude * 0.2 * Math.exp(-t * t)
  }
  return baseY // TP segment (isoelectric)
}

const animation: KineticAnimation = {
  renderBackground: ({ bgColor, width, height, frame, fps }: BackgroundRenderProps) => {
    const t = frame / fps

    // EKG monitor grid — dark green on black
    const gridSpacing = 20
    const subGridSpacing = 4

    // Continuous EKG trace scrolling across the screen
    const traceSpeed = 80
    const offset = (t * traceSpeed) % (width * 0.8)
    const baseY = height * 0.25
    const amplitude = height * 0.15

    // Build continuous waveform path
    const points: string[] = []
    const beatWidth = width * 0.35
    for (let px = 0; px < width; px += 2) {
      const worldX = px + offset
      const beatPhase = ((worldX % beatWidth) / beatWidth)
      const y = ekgWaveY(beatPhase, amplitude, baseY)
      points.push(`${px},${y}`)
    }

    // Heart rate number — oscillates slightly
    const hr = 72 + Math.floor(Math.sin(t * 0.5) * 3)

    return (
      <div style={{ position: 'absolute', inset: 0, background: bgColor }}>
        {/* Sub-grid (1mm equivalent) */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            backgroundImage: `
              linear-gradient(rgba(0,80,40,0.06) 1px, transparent 1px),
              linear-gradient(90deg, rgba(0,80,40,0.06) 1px, transparent 1px)
            `,
            backgroundSize: `${subGridSpacing}px ${subGridSpacing}px`,
          }}
        />

        {/* Major grid (5mm equivalent) */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            backgroundImage: `
              linear-gradient(rgba(0,120,60,0.12) 1px, transparent 1px),
              linear-gradient(90deg, rgba(0,120,60,0.12) 1px, transparent 1px)
            `,
            backgroundSize: `${gridSpacing}px ${gridSpacing}px`,
          }}
        />

        {/* Background EKG trace */}
        <svg width={width} height={height} style={{ position: 'absolute', inset: 0 }}>
          <polyline
            points={points.join(' ')}
            fill="none"
            stroke="rgba(0,200,80,0.15)"
            strokeWidth={1.5}
            strokeLinejoin="round"
          />
        </svg>

        {/* Monitor overlays */}
        <div
          style={{
            position: 'absolute',
            top: 6,
            right: 10,
            fontFamily: 'monospace',
            fontSize: 7,
            color: 'rgba(0,200,80,0.3)',
            letterSpacing: 1,
            lineHeight: '12px',
            textAlign: 'right',
          }}
        >
          <div>LEAD II</div>
          <div>25mm/s</div>
          <div>10mm/mV</div>
        </div>

        {/* Heart rate display */}
        <div
          style={{
            position: 'absolute',
            top: 6,
            left: 10,
            fontFamily: 'monospace',
            color: 'rgba(0,200,80,0.35)',
            lineHeight: '14px',
          }}
        >
          <div style={{ fontSize: 7, letterSpacing: 1 }}>HR bpm</div>
          <div style={{ fontSize: 18, fontWeight: 700 }}>{hr}</div>
        </div>

        {/* SpO2 secondary readout */}
        <div
          style={{
            position: 'absolute',
            bottom: 8,
            left: 10,
            fontFamily: 'monospace',
            color: 'rgba(0,160,220,0.25)',
            lineHeight: '12px',
          }}
        >
          <div style={{ fontSize: 7, letterSpacing: 1 }}>SpO2 %</div>
          <div style={{ fontSize: 14, fontWeight: 700 }}>98</div>
        </div>

        {/* CRT scanline overlay */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            backgroundImage:
              'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.04) 2px, rgba(0,0,0,0.04) 3px)',
            pointerEvents: 'none',
          }}
        />
      </div>
    )
  },

  renderWord: ({
    word,
    color,
    enterProgress,
    holdProgress,
    exitProgress,
    phase,
    width,
    height,
    index,
    frame,
  }: WordRenderProps) => {
    const letters = word.split('')
    const fontSize = Math.min(width / (letters.length * 0.65), 120)
    const totalWidth = letters.length * fontSize * 0.65
    const startX = (width - totalWidth) / 2
    const f = frame ?? 0

    if (phase === 'enter') {
      // EKG trace draws each letter with a heartbeat spike
      const traceX = enterProgress * width

      return (
        <div style={{ position: 'absolute', inset: 0 }}>
          {/* Horizontal trace line */}
          <svg width={width} height={height} style={{ position: 'absolute', inset: 0 }}>
            {/* Flat baseline left of trace */}
            <line
              x1={0}
              y1={height * 0.5}
              x2={Math.min(traceX, width)}
              y2={height * 0.5}
              stroke={`${color}30`}
              strokeWidth={1.5}
            />
            {/* QRS spikes at each letter position */}
            {letters.map((_, i) => {
              const letterCenterX = startX + i * fontSize * 0.65 + fontSize * 0.3
              if (traceX < letterCenterX - fontSize * 0.3) return null

              const spikeAmp = height * 0.12
              const spikeWidth = fontSize * 0.6
              const spikePoints: string[] = []

              for (let px = 0; px < spikeWidth; px += 2) {
                const normX = px / spikeWidth
                const spikeY = ekgWaveY(normX * 0.7 + 0.15, spikeAmp, height * 0.5)
                const drawX = letterCenterX - spikeWidth / 2 + px
                spikePoints.push(`${drawX},${spikeY}`)
              }

              const localT = Math.max(0, Math.min(1, (traceX - letterCenterX + fontSize * 0.5) / (fontSize * 0.8)))

              return (
                <polyline
                  key={`spike-${i}`}
                  points={spikePoints.join(' ')}
                  fill="none"
                  stroke={color}
                  strokeWidth={2}
                  strokeLinejoin="round"
                  opacity={Math.min(1, localT * 3)}
                />
              )
            })}

            {/* Bright dot at trace tip */}
            <circle cx={traceX} cy={height * 0.5} r={3} fill={color} opacity={0.8} />
            <circle cx={traceX} cy={height * 0.5} r={7} fill={`${color}20`} />
          </svg>

          {/* Letters appear with heartbeat pulse */}
          {letters.map((letter, i) => {
            const letterCenterX = startX + i * fontSize * 0.65 + fontSize * 0.3
            const delay = (letterCenterX / width) * 0.7
            const charT = Math.max(0, Math.min(1, (enterProgress - delay) / 0.3))

            if (charT <= 0) return null

            // Elastic "heartbeat" entrance
            const scale = easeOutElastic(charT)
            const opacity = Math.min(1, charT * 2)

            // Brief green flash on arrival
            const flashT = charT < 0.3 ? charT / 0.3 : 0
            const glowIntensity = flashT * 0.6

            return (
              <div
                key={i}
                style={{
                  position: 'absolute',
                  left: startX + i * fontSize * 0.65,
                  top: '50%',
                  transform: `translateY(-50%) scale(${scale})`,
                  fontFamily: "'Courier New', 'Lucida Console', monospace",
                  fontSize: `clamp(28px, 9vw, ${fontSize}px)`,
                  fontWeight: 700,
                  color,
                  opacity,
                  textShadow: glowIntensity > 0
                    ? `0 0 ${8 + glowIntensity * 12}px ${color}, 0 0 ${20 + glowIntensity * 20}px rgba(0,200,80,${glowIntensity})`
                    : `0 0 6px ${color}40`,
                  whiteSpace: 'nowrap',
                  textTransform: 'uppercase',
                }}
              >
                {letter}
              </div>
            )
          })}
        </div>
      )
    } else if (phase === 'hold') {
      // Active hold: rhythmic heartbeat pulse on all letters simultaneously
      const beatCycle = (holdProgress * 4) % 1
      const isQRS = beatCycle > 0.2 && beatCycle < 0.35
      const qrsIntensity = isQRS
        ? Math.sin(((beatCycle - 0.2) / 0.15) * Math.PI)
        : 0

      return (
        <div style={{ position: 'absolute', inset: 0 }}>
          {/* Heartbeat pulse line */}
          <svg width={width} height={height} style={{ position: 'absolute', inset: 0 }}>
            {(() => {
              const ptsArr: string[] = []
              const segWidth = width * 0.3
              const segStartX = (width - segWidth) / 2
              for (let px = 0; px < segWidth; px += 2) {
                const normX = px / segWidth
                const y = ekgWaveY(
                  (normX + beatCycle) % 1,
                  height * 0.08,
                  height * 0.5 + fontSize * 0.45,
                )
                ptsArr.push(`${segStartX + px},${y}`)
              }
              return (
                <polyline
                  points={ptsArr.join(' ')}
                  fill="none"
                  stroke={`${color}30`}
                  strokeWidth={1.5}
                  strokeLinejoin="round"
                />
              )
            })()}
          </svg>

          {letters.map((letter, i) => {
            const pulseScale = 1 + qrsIntensity * 0.04
            const pulseGlow = qrsIntensity * 0.3

            return (
              <div
                key={i}
                style={{
                  position: 'absolute',
                  left: startX + i * fontSize * 0.65,
                  top: '50%',
                  transform: `translateY(-50%) scale(${pulseScale})`,
                  fontFamily: "'Courier New', 'Lucida Console', monospace",
                  fontSize: `clamp(28px, 9vw, ${fontSize}px)`,
                  fontWeight: 700,
                  color,
                  textShadow: `0 0 ${6 + pulseGlow * 14}px ${color}${pulseGlow > 0.1 ? '80' : '30'}, 0 0 ${2 + pulseGlow * 8}px rgba(0,200,80,${0.1 + pulseGlow})`,
                  whiteSpace: 'nowrap',
                  textTransform: 'uppercase',
                }}
              >
                {letter}
              </div>
            )
          })}

          {/* BPM readout */}
          <div
            style={{
              position: 'absolute',
              bottom: '16%',
              left: '50%',
              transform: 'translateX(-50%)',
              fontFamily: 'monospace',
              fontSize: 8,
              color: `${color}40`,
              letterSpacing: 2,
            }}
          >
            SINUS RHYTHM // {word}
          </div>
        </div>
      )
    } else {
      // Exit: flatline — the trace goes flat, letters fade with asystole
      const flatlineX = exitProgress * width

      return (
        <div style={{ position: 'absolute', inset: 0 }}>
          {/* Flatline trace */}
          <svg width={width} height={height} style={{ position: 'absolute', inset: 0 }}>
            <line
              x1={0}
              y1={height * 0.5}
              x2={flatlineX}
              y2={height * 0.5}
              stroke={`${color}50`}
              strokeWidth={2}
              strokeLinecap="round"
            />
            <circle cx={flatlineX} cy={height * 0.5} r={3} fill={color} opacity={0.6} />
          </svg>

          {letters.map((letter, i) => {
            const letterCenterX = startX + i * fontSize * 0.65 + fontSize * 0.3
            const letterNorm = letterCenterX / width
            const charT = Math.max(0, Math.min(1, (exitProgress - letterNorm * 0.5) / 0.5))
            const fadeT = easeInQuad(charT)

            const dropY = fadeT * 8
            const opacity = 1 - fadeT
            const scale = 1 - fadeT * 0.05

            return (
              <div
                key={i}
                style={{
                  position: 'absolute',
                  left: startX + i * fontSize * 0.65,
                  top: '50%',
                  transform: `translateY(calc(-50% + ${dropY}px)) scale(${scale})`,
                  fontFamily: "'Courier New', 'Lucida Console', monospace",
                  fontSize: `clamp(28px, 9vw, ${fontSize}px)`,
                  fontWeight: 700,
                  color,
                  opacity,
                  textShadow: `0 0 4px ${color}20`,
                  whiteSpace: 'nowrap',
                  textTransform: 'uppercase',
                }}
              >
                {letter}
              </div>
            )
          })}
        </div>
      )
    }
  },
}

function EKGTraceComponent(props: MotionGraphicProps<EKGTraceConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-ekg-trace',
  title: 'Kinetic EKG Trace',
  description:
    'EKG cardiac monitor — letters appear with heartbeat QRS spikes along a trace line on green medical grid paper. Hold phase pulses with sinus rhythm. Exit flatlines across the screen with letter fadeout.',
  tags: [
    'kinetic',
    'typography',
    'ekg',
    'ecg',
    'medical',
    'heartbeat',
    'cardiac',
    'monitor',
    'hospital',
    'pulse',
  ],
  category: 'captions',
  component: EKGTraceComponent as any,
  defaultConfig: {
    words: ['PULSE', 'HEART', 'SINUS', 'RHYTHM'],
    colors: ['#00C850', '#00E060', '#00D850', '#00C050'],
    bgColor: '#040A06',
    cycleDuration: 1.4,
  },
  configSchema: [
    {
      key: 'words',
      label: 'Words',
      type: 'text-array',
      defaultValue: ['PULSE', 'HEART', 'SINUS', 'RHYTHM'],
      group: 'Content',
    },
    {
      key: 'colors',
      label: 'Colors',
      type: 'text-array',
      defaultValue: ['#00C850', '#00E060', '#00D850', '#00C050'],
      group: 'Style',
    },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#040A06', group: 'Style' },
    {
      key: 'cycleDuration',
      label: 'Cycle Duration (s)',
      type: 'number',
      defaultValue: 1.4,
      min: 0.3,
      max: 5,
      group: 'Timing',
    },
  ],
})
