import { registerMotionGraphic } from '../registry'
import {
  KineticBase,
  type KineticBaseConfig,
  type KineticAnimation,
  type WordRenderProps,
  type BackgroundRenderProps,
} from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface HeartlineFlatConfig extends KineticBaseConfig {
  lineColor: string
}

/* ---------- Easing for medical-monitor tension ---------- */

// Sudden spike — impulse arrival
function easeOutElastic(t: number): number {
  if (t === 0 || t === 1) return t
  const p = 0.4
  return Math.pow(2, -10 * t) * Math.sin(((t - p / 4) * (2 * Math.PI)) / p) + 1
}

// Text slams in with authority after the flatline breaks
function easeOutQuint(t: number): number {
  return 1 - Math.pow(1 - t, 5)
}

// Fade out with creeping dread
function easeInCubic(t: number): number {
  return t * t * t
}

/* ---------- Deterministic pseudo-random ---------- */
function seededRand(seed: number): number {
  return (Math.sin(seed * 127.1 + 311.7) * 43758.5453) % 1
}

/* ---------- ECG waveform path generator ---------- */
function buildECGPath(
  startX: number,
  y: number,
  width: number,
  amplitude: number,
  t: number, // 0-1: how much of the trace has drawn
): string {
  // One PQRST complex, rest is flatline
  const totalW = width
  const drawn = t * totalW
  const peakX = totalW * 0.45
  const pStart = peakX - totalW * 0.18
  const pEnd = peakX + totalW * 0.22

  const pts: [number, number][] = []

  // Flatline lead-in
  const flatEnd = Math.min(pStart, drawn)
  pts.push([startX, y], [startX + flatEnd, y])

  if (drawn > pStart) {
    // P wave — small rounded bump
    const pProgress = Math.min(1, (drawn - pStart) / (totalW * 0.06))
    pts.push([startX + pStart + totalW * 0.02, y - amplitude * 0.15 * Math.sin(pProgress * Math.PI)])
    const pMidEnd = pStart + totalW * 0.06
    if (drawn > pMidEnd) {
      pts.push([startX + pMidEnd, y])
      // PR segment
      const prEnd = pStart + totalW * 0.1
      pts.push([startX + Math.min(prEnd, drawn), y])
      if (drawn > prEnd) {
        // QRS complex — dramatic spike
        const qrsSpan = totalW * 0.12
        const qStart = prEnd
        const rPeak = qStart + qrsSpan * 0.45
        const sEnd = qStart + qrsSpan

        const qDraw = Math.min(drawn, rPeak)
        pts.push([startX + qDraw, y - amplitude * ((qDraw - qStart) / (rPeak - qStart)) * (-0.25) + y * 0])
        // Down to Q
        pts.push([startX + qStart + qrsSpan * 0.25, y + amplitude * 0.2])
        if (drawn > qStart + qrsSpan * 0.25) {
          // Up to R — the big spike
          const rProgress = Math.min(1, (drawn - (qStart + qrsSpan * 0.25)) / (qrsSpan * 0.2))
          pts.push([startX + rPeak, y - amplitude * rProgress])
          if (drawn > rPeak) {
            // Down to S
            const sProgress = Math.min(1, (drawn - rPeak) / (qrsSpan * 0.35))
            pts.push([startX + rPeak + qrsSpan * 0.35 * sProgress, y + amplitude * 0.3 * sProgress])
            if (drawn > sEnd) {
              // ST segment
              const stEnd = sEnd + totalW * 0.06
              pts.push([startX + Math.min(stEnd, drawn), y])
              if (drawn > stEnd) {
                // T wave
                const tSpan = totalW * 0.1
                const tMid = stEnd + tSpan * 0.5
                const tEnd = stEnd + tSpan
                pts.push([startX + tMid, y - amplitude * 0.3])
                if (drawn > tMid) {
                  pts.push([startX + Math.min(tEnd, drawn), y])
                  if (drawn > tEnd) {
                    // Final flatline
                    pts.push([startX + drawn, y])
                  }
                }
              }
            }
          }
        }
      }
    }
  }

  if (pts.length < 2) return ''
  return 'M ' + pts.map(([px, py]) => `${px.toFixed(1)},${py.toFixed(1)}`).join(' L ')
}

const animation: KineticAnimation = {
  renderBackground: ({ bgColor, width, height, frame, fps }: BackgroundRenderProps) => {
    const time = frame / fps

    // Monitor phosphor scanline — slow drift
    const scanY = ((time * 25) % (height + 40)) - 20

    // Ambient monitor glow pulse
    const glowPulse = 0.5 + Math.sin(time * 1.2) * 0.5

    return (
      <div style={{ position: 'absolute', inset: 0, background: bgColor }}>
        {/* CRT phosphor grid */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            backgroundImage: `
              repeating-linear-gradient(
                0deg,
                transparent,
                transparent 3px,
                rgba(0, 255, 100, 0.008) 3px,
                rgba(0, 255, 100, 0.008) 4px
              )
            `,
          }}
        />

        {/* Monitor frame vignette */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: 'radial-gradient(ellipse at 50% 50%, transparent 50%, rgba(0,0,0,0.5) 100%)',
          }}
        />

        <svg
          width={width}
          height={height}
          style={{ position: 'absolute', inset: 0, overflow: 'visible' }}
        >
          {/* Grid lines — medical monitor display */}
          {Array.from({ length: 8 }, (_, i) => (
            <line
              key={`hg-${i}`}
              x1={0}
              y1={(height * (i + 1)) / 9}
              x2={width}
              y2={(height * (i + 1)) / 9}
              stroke="rgba(0, 200, 80, 0.04)"
              strokeWidth={0.5}
            />
          ))}
          {Array.from({ length: 10 }, (_, i) => (
            <line
              key={`vg-${i}`}
              x1={(width * (i + 1)) / 11}
              y1={0}
              x2={(width * (i + 1)) / 11}
              y2={height}
              stroke="rgba(0, 200, 80, 0.04)"
              strokeWidth={0.5}
            />
          ))}

          {/* BPM readout — top right */}
          <text
            x={width - 16}
            y={28}
            textAnchor="end"
            fill="rgba(0, 220, 90, 0.45)"
            fontSize={22}
            fontFamily="'Courier New', monospace"
            fontWeight={700}
          >
            {Math.round(72 + Math.sin(time * 0.3) * 8)}
          </text>
          <text
            x={width - 16}
            y={42}
            textAnchor="end"
            fill="rgba(0, 220, 90, 0.2)"
            fontSize={8}
            fontFamily="'Courier New', monospace"
            letterSpacing={2}
          >
            BPM
          </text>

          {/* Vital labels */}
          <text
            x={16}
            y={28}
            fill="rgba(0, 220, 90, 0.2)"
            fontSize={8}
            fontFamily="'Courier New', monospace"
            letterSpacing={3}
          >
            ECG II
          </text>

          {/* Monitor scanline */}
          <line
            x1={0}
            y1={scanY}
            x2={width}
            y2={scanY}
            stroke={`rgba(0, 255, 100, ${0.025 * glowPulse})`}
            strokeWidth={1.5}
          />

          {/* Flatline baseline — the ominous steady line */}
          <line
            x1={width * 0.05}
            y1={height * 0.62}
            x2={width * 0.95}
            y2={height * 0.62}
            stroke="rgba(0, 200, 80, 0.15)"
            strokeWidth={1}
            strokeDasharray="3,4"
          />

          {/* SpO2 label */}
          <text
            x={16}
            y={height - 14}
            fill="rgba(0, 220, 90, 0.15)"
            fontSize={8}
            fontFamily="'Courier New', monospace"
            letterSpacing={2}
          >
            SpO2 98%
          </text>
          <text
            x={width / 2}
            y={height - 14}
            textAnchor="middle"
            fill="rgba(0, 220, 90, 0.15)"
            fontSize={8}
            fontFamily="'Courier New', monospace"
            letterSpacing={3}
          >
            PATIENT MONITOR
          </text>
        </svg>
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
    index,
    width,
    height,
  }: WordRenderProps) => {
    const chars = word.split('')
    const totalChars = chars.length
    const fontSize = Math.min(width / (totalChars * 0.66), 150)

    const lineY = height * 0.62
    const traceStartX = width * 0.05
    const traceWidth = width * 0.9
    const amplitude = height * 0.14

    // ECG trace draws during enter, glows during hold
    let traceProgress = 0
    let traceOpacity = 0
    let textOpacity = 0
    let textScale = 1
    let textGlow = 0
    let flatlineOpacity = 0

    if (phase === 'enter') {
      // ECG trace draws from left to right over 60% of enter time
      traceProgress = Math.min(1, enterProgress / 0.65)
      traceOpacity = Math.min(1, enterProgress * 4)
      // Text appears after trace passes the peak (>55%)
      const textT = Math.max(0, (enterProgress - 0.55) / 0.45)
      textOpacity = easeOutQuint(Math.min(1, textT * 1.5))
      textScale = 0.6 + textOpacity * 0.4
      textGlow = textOpacity * 30
      flatlineOpacity = Math.max(0, 1 - enterProgress * 3)
    } else if (phase === 'hold') {
      traceProgress = 1
      traceOpacity = 0.7 + Math.sin(holdProgress * Math.PI * 3) * 0.08
      textOpacity = 1
      // Pulse: text breathes with a slow heartbeat rhythm
      textScale = 1 + Math.sin(holdProgress * Math.PI * 4) * 0.015
      textGlow = 20 + Math.sin(holdProgress * Math.PI * 4) * 10
    } else {
      traceProgress = 1
      const t = exitProgress
      traceOpacity = 1 - easeInCubic(t)
      textOpacity = 1 - easeInCubic(Math.min(1, t * 1.4))
      textScale = 1 + easeInCubic(t) * 0.08
      // Monitor powers off — trace collapses to flatline
      flatlineOpacity = easeInCubic(Math.min(1, t * 2))
    }

    const ecgPath = buildECGPath(traceStartX, lineY, traceWidth, amplitude, traceProgress)

    return (
      <div style={{ position: 'absolute', inset: 0 }}>
        <svg
          width={width}
          height={height}
          style={{ position: 'absolute', inset: 0, overflow: 'visible' }}
        >
          {/* Glow behind trace */}
          {ecgPath && traceOpacity > 0.05 && (
            <path
              d={ecgPath}
              fill="none"
              stroke={color}
              strokeWidth={6}
              opacity={traceOpacity * 0.15}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          )}
          {/* Main ECG trace */}
          {ecgPath && traceOpacity > 0.05 && (
            <path
              d={ecgPath}
              fill="none"
              stroke={color}
              strokeWidth={1.8}
              opacity={traceOpacity}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          )}

          {/* Flatline that appears on exit */}
          {flatlineOpacity > 0.02 && (
            <line
              x1={traceStartX}
              y1={lineY}
              x2={traceStartX + traceWidth}
              y2={lineY}
              stroke={color}
              strokeWidth={1.5}
              opacity={flatlineOpacity * 0.6}
            />
          )}

          {/* FLATLINE label that appears on exit */}
          {phase === 'exit' && flatlineOpacity > 0.3 && (
            <text
              x={width / 2}
              y={lineY - 18}
              textAnchor="middle"
              fill={color}
              fontSize={9}
              fontFamily="'Courier New', monospace"
              fontWeight={700}
              letterSpacing={6}
              opacity={Math.min(1, (flatlineOpacity - 0.3) / 0.7) * 0.6}
            >
              FLAT LINE
            </text>
          )}
        </svg>

        {/* Word text — appears from center as the ECG spike fires */}
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: `translate(-50%, -50%) scale(${textScale})`,
            opacity: textOpacity,
            fontFamily: "'Helvetica Neue', 'Arial', sans-serif",
            fontSize: `clamp(28px, 9vw, ${fontSize}px)`,
            fontWeight: 900,
            color,
            letterSpacing: '0.06em',
            whiteSpace: 'nowrap',
            textShadow: textGlow > 1
              ? `0 0 ${textGlow}px ${color}80, 0 0 ${textGlow * 2}px ${color}30`
              : 'none',
          }}
        >
          {word}
        </div>

        {/* Enter: "SIGNAL DETECTED" label */}
        {phase === 'enter' && textOpacity > 0.3 && (
          <div
            style={{
              position: 'absolute',
              bottom: height * 0.14,
              left: '50%',
              transform: 'translateX(-50%)',
              fontFamily: "'Courier New', monospace",
              fontSize: 8,
              color,
              letterSpacing: 7,
              opacity: Math.min(1, (textOpacity - 0.3) / 0.7) * 0.5,
              whiteSpace: 'nowrap',
            }}
          >
            SIGNAL DETECTED
          </div>
        )}
      </div>
    )
  },
}

function HeartlineFlatComponent(props: MotionGraphicProps<HeartlineFlatConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-heartline-flat',
  title: 'Heartline Flat',
  description:
    'Medical monitor aesthetic: a flatline ECG trace suddenly fires a PQRST complex that draws across the screen — then the word slams into existence as the spike peaks. Pulsing glow, BPM readout, phosphor grid. Exit collapses back to flatline.',
  tags: [
    'kinetic',
    'typography',
    'heartline',
    'ecg',
    'medical',
    'thriller',
    'flatline',
    'reveal',
    'tension',
    'cinematic',
    'pulse',
    'monitor',
  ],
  category: 'captions',
  component: HeartlineFlatComponent as any,
  defaultConfig: {
    words: ['CRITICAL', 'SURVIVE', 'THE END', 'FLATLINE'],
    colors: ['#00E868', '#00D060', '#00F070', '#00CC58'],
    bgColor: '#030A06',
    cycleDuration: 1.8,
    lineColor: '#00E868',
  },
  configSchema: [
    {
      key: 'words',
      label: 'Words',
      type: 'text-array',
      defaultValue: ['CRITICAL', 'SURVIVE', 'THE END', 'FLATLINE'],
      group: 'Content',
    },
    {
      key: 'colors',
      label: 'Colors',
      type: 'text-array',
      defaultValue: ['#00E868', '#00D060', '#00F070', '#00CC58'],
      group: 'Style',
    },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#030A06', group: 'Style' },
    {
      key: 'cycleDuration',
      label: 'Cycle Duration (s)',
      type: 'number',
      defaultValue: 1.8,
      min: 0.5,
      max: 6,
      group: 'Timing',
    },
    {
      key: 'lineColor',
      label: 'Line Color',
      type: 'color',
      defaultValue: '#00E868',
      group: 'Style',
    },
  ],
})
