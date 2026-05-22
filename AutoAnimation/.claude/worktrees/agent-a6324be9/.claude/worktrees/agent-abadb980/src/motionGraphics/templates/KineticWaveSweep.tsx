import { registerMotionGraphic } from '../registry'
import { KineticBase, type KineticBaseConfig, type KineticAnimation, type WordRenderProps, type BackgroundRenderProps } from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface WaveSweepConfig extends KineticBaseConfig {
  waveAmplitude: number
  waveFrequency: number
}

function easeInOutCubic(t: number): number {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2
}

/**
 * Generates an SVG polygon path approximating a sinusoidal wave clip boundary.
 * The polygon reveals the LEFT side of the wave boundary.
 */
function buildWaveClipPath(
  sweepX: number,
  amplitude: number,
  frequency: number,
  width: number,
  height: number,
  pointCount: number = 60,
): string {
  // Build a polygon that covers the region LEFT of the sine wave
  const pts: string[] = []

  // Top-left corner to top of wave region
  pts.push(`0 0`)
  pts.push(`${sweepX} 0`)

  // Wave path: points along the leading edge, top to bottom
  for (let i = 0; i <= pointCount; i++) {
    const y = (i / pointCount) * height
    const phase = (y / height) * Math.PI * 2 * frequency
    const waveX = sweepX + Math.sin(phase) * amplitude
    pts.push(`${waveX.toFixed(2)} ${y.toFixed(2)}`)
  }

  // Close via bottom corners
  pts.push(`0 ${height}`)

  return `polygon(${pts.join(', ')})`
}

const animation: KineticAnimation = {
  renderBackground: ({ bgColor }: BackgroundRenderProps) => (
    <div style={{ position: 'absolute', inset: 0, background: bgColor }} />
  ),

  renderWord: ({ word, color, enterProgress, exitProgress, phase, width, height }: WordRenderProps) => {
    const config = (globalThis as any).__waveSweepConfig ?? { waveAmplitude: 40, waveFrequency: 2.5 }
    const amplitude = config.waveAmplitude ?? 40
    const frequency = config.waveFrequency ?? 2.5

    // Sweep progress: 0 = wave at far left (text hidden), 1 = wave past right edge (text fully revealed)
    const revealP = phase === 'hold' ? 1 : phase === 'enter' ? easeInOutCubic(enterProgress) : 1 - easeInOutCubic(exitProgress)

    // sweepX: x-position of the wave center line (moves from -amplitude to width+amplitude)
    const sweepX = revealP * (width + amplitude * 2) - amplitude

    // Build clip path for revealed region
    const clipPath = buildWaveClipPath(sweepX, amplitude, frequency, width, height, 80)

    // Wave "body" bar — a thin strip following the wave contour as the leading edge
    const waveBarPts: string[] = []
    const barThickness = 8
    const ptCount = 80

    // Right edge of bar (wave + barThickness)
    for (let i = 0; i <= ptCount; i++) {
      const y = (i / ptCount) * height
      const ph = (y / height) * Math.PI * 2 * frequency
      const wx = sweepX + Math.sin(ph) * amplitude + barThickness
      waveBarPts.push(`${wx.toFixed(2)} ${y.toFixed(2)}`)
    }
    // Left edge (in reverse)
    for (let i = ptCount; i >= 0; i--) {
      const y = (i / ptCount) * height
      const ph = (y / height) * Math.PI * 2 * frequency
      const wx = sweepX + Math.sin(ph) * amplitude
      waveBarPts.push(`${wx.toFixed(2)} ${y.toFixed(2)}`)
    }
    const waveBarPath = `polygon(${waveBarPts.join(', ')})`

    const barVisible = phase !== 'hold'
    const textOpacity = phase === 'hold' ? 1 : phase === 'enter' ? Math.min(1, enterProgress * 2.5) : Math.max(0, 1 - exitProgress * 2.5)

    return (
      <div style={{ position: 'absolute', inset: 0 }}>
        {/* Wave leading-edge glow bar */}
        {barVisible && (
          <div
            style={{
              position: 'absolute',
              inset: 0,
              clipPath: waveBarPath,
              WebkitClipPath: waveBarPath,
              background: `linear-gradient(90deg, ${color}80, ${color}FF, ${color}80)`,
              filter: `blur(3px)`,
              opacity: 0.85,
            }}
          />
        )}

        {/* Text clipped to revealed region */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            clipPath,
            WebkitClipPath: clipPath,
          }}
        >
          <div
            style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              fontFamily: "'Inter', 'Helvetica Neue', sans-serif",
              fontSize: 'clamp(40px, 10vw, 140px)',
              fontWeight: 800,
              color,
              whiteSpace: 'nowrap',
              letterSpacing: '0.04em',
              textTransform: 'uppercase',
              opacity: textOpacity,
            }}
          >
            {word}
          </div>
        </div>
      </div>
    )
  },
}

function WaveSweepComponent(props: MotionGraphicProps<WaveSweepConfig>) {
  ;(globalThis as any).__waveSweepConfig = props.config
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-wave-sweep',
  title: 'Kinetic Wave Sweep',
  description: 'A sinusoidal wave edge sweeps left-to-right, revealing text through an undulating clip boundary with a glowing wave crest',
  tags: ['kinetic', 'typography', 'wave', 'sweep', 'reveal', 'geometric', 'pattern', 'sinusoidal', 'clip-path'],
  category: 'captions',
  component: WaveSweepComponent as any,
  defaultConfig: {
    words: ['WAVE', 'SWEEP', 'FLOW', 'UNDULATE'],
    colors: ['#00D4FF', '#4ECDC4', '#A78BFA', '#39FF14'],
    bgColor: '#060612',
    cycleDuration: 1.4,
    waveAmplitude: 40,
    waveFrequency: 2.5,
  },
  configSchema: [
    { key: 'words', label: 'Words', type: 'text-array', defaultValue: ['WAVE', 'SWEEP', 'FLOW', 'UNDULATE'], group: 'Content' },
    { key: 'colors', label: 'Colors', type: 'text-array', defaultValue: ['#00D4FF', '#4ECDC4', '#A78BFA', '#39FF14'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#060612', group: 'Style' },
    { key: 'cycleDuration', label: 'Cycle Duration (s)', type: 'number', defaultValue: 1.4, min: 0.3, max: 5, group: 'Timing' },
    { key: 'waveAmplitude', label: 'Wave Amplitude (px)', type: 'number', defaultValue: 40, min: 5, max: 120, group: 'Animation' },
    { key: 'waveFrequency', label: 'Wave Frequency', type: 'number', defaultValue: 2.5, min: 0.5, max: 8, group: 'Animation' },
  ],
})
