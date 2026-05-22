import { registerMotionGraphic } from '../registry'
import { KineticBase, type KineticBaseConfig, type KineticAnimation, type WordRenderProps, type BackgroundRenderProps } from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface OverheatConfig extends KineticBaseConfig {}

function rand(s: number): number {
  const x = Math.sin(s * 127.1 + 311.7) * 43758.5453
  return x - Math.floor(x)
}

const animation: KineticAnimation = {
  renderBackground: ({ bgColor, width, height, frame, fps }: BackgroundRenderProps) => {
    const time = frame / fps

    // Heat shimmer: multiple color banding gradients that drift slowly
    const bandOffset = (time * 12) % 100
    const shimmerAmp = 0.04 + Math.abs(Math.sin(time * 0.8)) * 0.06

    // Temperature color: background subtly pulses orange-red at peak
    const heatPulse = 0.5 + Math.sin(time * 1.1) * 0.5
    const bgR = Math.floor(10 + heatPulse * 25)
    const bgG = Math.floor(5 + heatPulse * 5)

    return (
      <div style={{ position: 'absolute', inset: 0, background: `rgb(${bgR},${bgG},10)` }}>
        {/* Color banding — repeating hue bands that shift */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: `repeating-linear-gradient(
              0deg,
              rgba(255,80,0,${shimmerAmp}) 0px,
              rgba(255,180,0,${shimmerAmp * 0.6}) 8px,
              transparent 16px,
              rgba(255,0,60,${shimmerAmp * 0.4}) 24px,
              transparent 32px
            )`,
            backgroundPositionY: `${bandOffset}%`,
            pointerEvents: 'none',
          }}
        />
        {/* Heat haze gradient */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: `radial-gradient(ellipse at ${50 + Math.sin(time * 0.7) * 20}% ${50 + Math.cos(time * 0.5) * 15}%, rgba(255,120,0,0.12) 0%, transparent 65%)`,
            pointerEvents: 'none',
          }}
        />
        {/* GPU temperature readout */}
        <div
          style={{
            position: 'absolute',
            top: 10,
            right: 12,
            fontFamily: "'Courier New', monospace",
            fontSize: 9,
            color: `rgba(255,${Math.floor(60 + heatPulse * 80)},0,0.8)`,
            letterSpacing: 1,
          }}
        >
          GPU {Math.floor(92 + heatPulse * 8)}°C
        </div>
        {/* Fan speed */}
        <div
          style={{
            position: 'absolute',
            top: 24,
            right: 12,
            fontFamily: "'Courier New', monospace",
            fontSize: 9,
            color: 'rgba(255,150,0,0.6)',
            letterSpacing: 1,
          }}
        >
          FAN 100%
        </div>
      </div>
    )
  },

  renderWord: ({ word, color, enterProgress, holdProgress, exitProgress, phase, index, frame, width }: WordRenderProps) => {
    const f = frame ?? 0
    const seed = index * 71 + 43
    const time = f / 30

    let opacity = 1
    let heatIntensity = 0

    if (phase === 'enter') {
      opacity = enterProgress
      heatIntensity = (1 - enterProgress) * 0.8
    } else if (phase === 'hold') {
      opacity = 1
      // Constant mild shimmer with peaks
      heatIntensity = 0.15 + Math.abs(Math.sin(time * 1.5 + seed)) * 0.2
    } else {
      opacity = 1 - exitProgress
      heatIntensity = exitProgress * 0.9
    }

    // Color banding: split text into horizontal slices with hue offset
    const numSlices = 10
    const sliceH = 100 / numSlices
    const fontSize = 'clamp(40px, 11vw, 160px)'
    const fontBase: React.CSSProperties = {
      fontFamily: "'Arial Black', 'Impact', sans-serif",
      fontSize,
      fontWeight: 900,
      whiteSpace: 'nowrap',
      textTransform: 'uppercase',
      letterSpacing: 2,
    }

    // Heat shimmer displacement — each slice horizontally offset
    const slices = Array.from({ length: numSlices }, (_, i) => {
      const sliceSeed = i * 19 + seed + Math.floor(time * 8)
      // Shimmer wave
      const wave = Math.sin(time * 4 + i * 0.7 + sliceSeed * 0.1) * heatIntensity * 12
      const waveY = Math.cos(time * 3 + i * 0.5) * heatIntensity * 2

      // Color banding: slight hue shift per slice during high heat
      const hueShift = heatIntensity > 0.3
        ? Math.floor((rand(sliceSeed) - 0.5) * 60)
        : 0

      return { dispX: wave, dispY: waveY, hueShift, sliceY: i * sliceH, sliceH }
    })

    // RGB separation — heat causes channel separation
    const rgbSplit = heatIntensity * 8

    return (
      <>
        {/* Red channel — drifts up with heat */}
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: `translate(calc(-50% + ${rgbSplit * 0.7}px), calc(-50% - ${rgbSplit * 0.4}px))`,
            opacity: opacity * 0.35,
            color: 'rgba(255,40,0,1)',
            mixBlendMode: 'screen',
            ...fontBase,
          }}
        >
          {word}
        </div>
        {/* Blue channel — opposite drift */}
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: `translate(calc(-50% - ${rgbSplit * 0.5}px), calc(-50% + ${rgbSplit * 0.3}px))`,
            opacity: opacity * 0.3,
            color: 'rgba(0,80,255,1)',
            mixBlendMode: 'screen',
            ...fontBase,
          }}
        >
          {word}
        </div>
        {/* Per-slice shimmer text */}
        {slices.map((s, i) => (
          <div
            key={i}
            style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: `translate(calc(-50% + ${s.dispX}px), calc(-50% + ${s.dispY}px))`,
              opacity,
              clipPath: `inset(${s.sliceY}% 0 ${100 - s.sliceY - s.sliceH}% 0)`,
              color: s.hueShift !== 0 ? `hsl(${20 + s.hueShift}, 100%, 75%)` : color,
              ...fontBase,
            }}
          >
            {word}
          </div>
        ))}
        {/* Main text on top */}
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            opacity: opacity * (1 - heatIntensity * 0.5),
            textShadow: `0 0 ${8 + heatIntensity * 20}px rgba(255,120,0,0.6)`,
            color,
            ...fontBase,
          }}
        >
          {word}
        </div>
      </>
    )
  },
}

function OverheatComponent(props: MotionGraphicProps<OverheatConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-overheat',
  title: 'Kinetic Overheat',
  description: 'GPU overheating visual artifacts — color banding, heat shimmer displacement, RGB channel separation, and temperature readout',
  tags: ['kinetic', 'typography', 'overheat', 'gpu', 'hardware', 'thermal', 'glitch', 'color banding'],
  category: 'captions',
  component: OverheatComponent as any,
  defaultConfig: {
    words: ['HOT', 'THERMAL', 'BURN', 'MELT'],
    colors: ['#ff8800', '#ffcc00', '#ff4400', '#ff8800'],
    bgColor: '#0a0a0a',
    cycleDuration: 1.3,
  },
  configSchema: [
    { key: 'words', label: 'Words', type: 'text-array', defaultValue: ['HOT', 'THERMAL', 'BURN', 'MELT'], group: 'Content' },
    { key: 'colors', label: 'Colors', type: 'text-array', defaultValue: ['#ff8800', '#ffcc00', '#ff4400', '#ff8800'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#0a0a0a', group: 'Style' },
    { key: 'cycleDuration', label: 'Cycle Duration (s)', type: 'number', defaultValue: 1.3, min: 0.3, max: 5, group: 'Timing' },
  ],
})
