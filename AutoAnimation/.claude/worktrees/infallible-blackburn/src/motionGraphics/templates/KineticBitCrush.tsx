import { registerMotionGraphic } from '../registry'
import {
  KineticBase,
  type KineticBaseConfig,
  type KineticAnimation,
  type WordRenderProps,
  type BackgroundRenderProps,
} from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface BitCrushConfig extends KineticBaseConfig {
  crushDepth: number
}

/** Deterministic pseudo-random 0..1 */
function rand(s: number): number {
  const x = Math.sin(s * 127.1 + 311.7) * 43758.5453
  return x - Math.floor(x)
}

const animation: KineticAnimation = {
  renderBackground: ({ bgColor, width, height, frame, fps }: BackgroundRenderProps) => {
    const time = frame / fps
    // Bit depth indicator: shows current resolution degradation
    const crushCycle = (time * 0.4) % 1 // slow cycle through bit depths
    const bitDepth = Math.max(1, Math.floor(16 * (1 - crushCycle * 0.9)))

    // Quantization grid that gets coarser
    const gridSize = Math.max(2, Math.floor(4 + crushCycle * 40))

    return (
      <div style={{ position: 'absolute', inset: 0, background: bgColor }}>
        {/* Quantization pixel grid */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            backgroundImage: `
              linear-gradient(rgba(0,255,100,${0.02 + crushCycle * 0.04}) 1px, transparent 1px),
              linear-gradient(90deg, rgba(0,255,100,${0.02 + crushCycle * 0.04}) 1px, transparent 1px)
            `,
            backgroundSize: `${gridSize}px ${gridSize}px`,
          }}
        />

        {/* Bit depth readout */}
        <div
          style={{
            position: 'absolute',
            top: height * 0.08,
            left: width * 0.06,
            fontFamily: "'Courier New', monospace",
            fontSize: 10,
            color: '#00FF6666',
            letterSpacing: 2,
          }}
        >
          {`BIT DEPTH: ${bitDepth}`}
        </div>

        {/* Sample rate readout */}
        <div
          style={{
            position: 'absolute',
            top: height * 0.08,
            right: width * 0.06,
            fontFamily: "'Courier New', monospace",
            fontSize: 10,
            color: '#00FF6666',
            letterSpacing: 2,
          }}
        >
          {`SR: ${Math.floor(44100 / (1 + crushCycle * 10))} Hz`}
        </div>

        {/* Staircase waveform showing quantization */}
        <svg
          style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}
          viewBox={`0 0 ${width} ${height}`}
          preserveAspectRatio="none"
        >
          {(() => {
            const steps = Math.max(4, Math.floor(40 * (1 - crushCycle * 0.85)))
            const points: string[] = []
            for (let i = 0; i <= steps; i++) {
              const x = (i / steps) * width
              const rawY = Math.sin((i / steps) * Math.PI * 4 + time * 2) * height * 0.12
              // Quantize Y to simulate bit reduction
              const quantStep = height * 0.02 * (1 + crushCycle * 4)
              const quantY = Math.round(rawY / quantStep) * quantStep
              const y = height * 0.88 + quantY
              // Staircase: add horizontal segment
              if (i > 0) points.push(`${x},${points[points.length - 1].split(',')[1]}`)
              points.push(`${x},${y}`)
            }
            const pathD = `M ${points[0]} ` + points.slice(1).map((p) => `L ${p}`).join(' ')
            return (
              <path
                d={pathD}
                fill="none"
                stroke="#00FF66"
                strokeWidth={1.5}
                opacity={0.2}
              />
            )
          })()}
        </svg>
      </div>
    )
  },

  renderWord: ({ word, color, enterProgress, exitProgress, phase, holdProgress, width, height, frame, index }: WordRenderProps) => {
    const f = frame ?? 0
    const time = f / 30

    // Crush cycle: text degrades through bit depths
    let crushLevel = 0 // 0 = clean, 1 = fully crushed

    if (phase === 'enter') {
      // Start crushed, resolve to clean
      crushLevel = 1 - enterProgress
    } else if (phase === 'hold') {
      // Pulse between slightly crushed and clean
      crushLevel = 0.1 + 0.15 * Math.sin(holdProgress * Math.PI * 4)
      crushLevel = Math.max(0, crushLevel)
    } else {
      // Degrade back to fully crushed
      crushLevel = exitProgress
    }

    let masterOpacity = 1
    if (phase === 'enter') {
      masterOpacity = Math.min(1, enterProgress * 2)
    } else if (phase === 'exit') {
      masterOpacity = 1 - exitProgress * 0.8
    }

    // Pixelation effect via CSS (text-shadow stacking for blocky feel)
    const pixelSize = Math.max(0, Math.floor(crushLevel * 6))
    // Color quantization: reduce color depth
    const quantize = (hex: string, level: number): string => {
      if (level < 0.1) return hex
      // Parse hex color
      const r = parseInt(hex.slice(1, 3), 16)
      const g = parseInt(hex.slice(3, 5), 16)
      const b = parseInt(hex.slice(5, 7), 16)
      const step = Math.max(1, Math.floor(level * 128))
      const qr = Math.round(r / step) * step
      const qg = Math.round(g / step) * step
      const qb = Math.round(b / step) * step
      return `rgb(${Math.min(255, qr)}, ${Math.min(255, qg)}, ${Math.min(255, qb)})`
    }

    const quantizedColor = quantize(color, crushLevel * 0.5)

    // Letter spacing gets quantized too (stepped, not smooth)
    const rawSpacing = 0.04 + crushLevel * 0.08
    const steppedSpacing = Math.round(rawSpacing * 20) / 20

    // Build stacked text-shadow for pixel doubling effect
    const shadows: string[] = [`0 0 ${8 + crushLevel * 20}px ${color}50`]
    if (pixelSize > 1) {
      shadows.push(`${pixelSize}px 0 0 ${quantizedColor}40`)
      shadows.push(`0 ${pixelSize}px 0 ${quantizedColor}30`)
    }
    if (pixelSize > 3) {
      shadows.push(`-${pixelSize}px 0 0 ${quantizedColor}20`)
      shadows.push(`0 -${pixelSize}px 0 ${quantizedColor}15`)
    }

    return (
      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: `translate(-50%, -50%)`,
          opacity: masterOpacity,
          fontFamily: crushLevel > 0.6 ? "'Courier New', monospace" : "'Impact', 'Arial Black', sans-serif",
          fontSize: 'clamp(44px, 12vw, 160px)',
          fontWeight: 900,
          color: quantizedColor,
          whiteSpace: 'nowrap',
          textTransform: 'uppercase',
          letterSpacing: `${steppedSpacing}em`,
          textShadow: shadows.join(', '),
          // imageRendering for pixelated feel when crushed
          imageRendering: crushLevel > 0.5 ? 'pixelated' : 'auto',
          zIndex: 10,
        }}
      >
        {word}
      </div>
    )
  },
}

function BitCrushComponent(props: MotionGraphicProps<BitCrushConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-bit-crush',
  title: 'Kinetic Bit Crush',
  description:
    'Bit crusher effect: text degrades in resolution steps from smooth to pixelated with quantization artifacts. Lo-fi staircase waveform background and bit-depth readout.',
  tags: ['kinetic', 'typography', 'bitcrush', 'lofi', 'pixel', 'quantize', 'retro', 'signal'],
  category: 'captions',
  component: BitCrushComponent as any,
  defaultConfig: {
    words: ['CRUSH', 'BITS', 'LOFI', 'GRIT'],
    colors: ['#00FF66', '#33FF99', '#00CC44', '#66FFAA'],
    bgColor: '#060A06',
    cycleDuration: 1.4,
    crushDepth: 4,
  },
  configSchema: [
    { key: 'words', label: 'Words', type: 'text-array', defaultValue: ['CRUSH', 'BITS', 'LOFI', 'GRIT'], group: 'Content' },
    { key: 'colors', label: 'Colors', type: 'text-array', defaultValue: ['#00FF66', '#33FF99', '#00CC44', '#66FFAA'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#060A06', group: 'Style' },
    { key: 'cycleDuration', label: 'Cycle Duration (s)', type: 'number', defaultValue: 1.4, min: 0.3, max: 5, group: 'Timing' },
  ],
})
