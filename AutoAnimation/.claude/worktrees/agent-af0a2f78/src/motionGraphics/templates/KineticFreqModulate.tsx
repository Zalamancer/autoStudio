import { registerMotionGraphic } from '../registry'
import {
  KineticBase,
  type KineticBaseConfig,
  type KineticAnimation,
  type WordRenderProps,
  type BackgroundRenderProps,
} from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface FreqModulateConfig extends KineticBaseConfig {
  modulatorDepth: number
}

const animation: KineticAnimation = {
  renderBackground: ({ bgColor, width, height, frame, fps }: BackgroundRenderProps) => {
    const time = frame / fps
    // FM synthesis visualization: carrier modulated by modulator
    const pointCount = 120
    const carrierFreq = 6
    const modFreq = 1.5
    const modDepth = 3

    const waves = [0, 1, 2].map((waveIdx) => {
      const yCenter = height * (0.35 + waveIdx * 0.15)
      const amplitude = height * (0.06 - waveIdx * 0.012)
      const phaseShift = waveIdx * 0.8
      const hue = 280 + waveIdx * 30

      const points: string[] = []
      for (let i = 0; i <= pointCount; i++) {
        const normalX = i / pointCount
        const x = normalX * width
        // FM formula: sin(carrier_freq * t + depth * sin(mod_freq * t))
        const modSignal = modDepth * Math.sin(normalX * modFreq * Math.PI * 2 + time * 1.2 + phaseShift)
        const y = yCenter + amplitude * Math.sin(normalX * carrierFreq * Math.PI * 2 + modSignal + time * 2)
        points.push(`${x},${y}`)
      }

      const pathD = `M ${points[0]} ` + points.slice(1).map((p) => `L ${p}`).join(' ')
      const color = `hsl(${hue}, 100%, 65%)`
      const glow = `hsl(${hue}, 100%, 50%)`

      return (
        <svg
          key={waveIdx}
          style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}
          viewBox={`0 0 ${width} ${height}`}
          preserveAspectRatio="none"
        >
          <defs>
            <filter id={`fm-glow-${waveIdx}`}>
              <feGaussianBlur stdDeviation={3} result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>
          <path
            d={pathD}
            fill="none"
            stroke={glow}
            strokeWidth={4}
            opacity={0.15}
            filter={`url(#fm-glow-${waveIdx})`}
          />
          <path
            d={pathD}
            fill="none"
            stroke={color}
            strokeWidth={1.5}
            opacity={0.3 - waveIdx * 0.05}
          />
        </svg>
      )
    })

    return (
      <div style={{ position: 'absolute', inset: 0, background: bgColor }}>
        {/* Subtle radial vignette */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: 'radial-gradient(ellipse at center, transparent 40%, rgba(0,0,0,0.4) 100%)',
          }}
        />
        {waves}
      </div>
    )
  },

  renderWord: ({ word, color, enterProgress, exitProgress, phase, holdProgress, width, height, frame }: WordRenderProps) => {
    const f = frame ?? 0
    const time = f / 30
    const totalChars = word.length

    let masterOpacity = 1
    let masterScale = 1

    if (phase === 'enter') {
      masterOpacity = Math.min(1, enterProgress * 1.5)
      masterScale = 0.85 + 0.15 * enterProgress
    } else if (phase === 'exit') {
      masterOpacity = 1 - exitProgress
      masterScale = 1 + 0.15 * exitProgress
    }

    // FM-style warping: each character's horizontal position is modulated
    const carrierFreq = 4
    const modFreq = 0.8
    const modDepth = phase === 'hold' ? 2.5 : phase === 'enter' ? 2.5 * enterProgress : 2.5 * (1 - exitProgress)

    const chars = word.split('').map((ch, ci) => {
      const normalPos = ci / Math.max(1, totalChars - 1)
      // FM displacement on X
      const modSignal = modDepth * Math.sin(normalPos * modFreq * Math.PI * 2 + time * 1.5)
      const xDisplace = 8 * Math.sin(normalPos * carrierFreq * Math.PI * 2 + modSignal + time * 2.5)
      // Vertical micro-wobble from interference
      const yDisplace = 3 * Math.cos(normalPos * carrierFreq * 1.5 * Math.PI * 2 + modSignal * 0.7 + time * 3)
      // Stretch/compress character width as interference pattern
      const scaleX = 1 + 0.12 * Math.sin(normalPos * carrierFreq * Math.PI * 2 + modSignal + time * 2)

      return (
        <span
          key={ci}
          style={{
            display: 'inline-block',
            transform: `translate(${xDisplace}px, ${yDisplace}px) scaleX(${scaleX})`,
            color,
            textShadow: `0 0 15px ${color}70, ${xDisplace * 0.3}px 0 8px ${color}30`,
          }}
        >
          {ch}
        </span>
      )
    })

    return (
      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: `translate(-50%, -50%) scale(${masterScale})`,
          opacity: masterOpacity,
          fontFamily: "'Courier New', 'Fira Code', monospace",
          fontSize: 'clamp(40px, 11vw, 150px)',
          fontWeight: 800,
          whiteSpace: 'nowrap',
          textTransform: 'uppercase',
          letterSpacing: '0.04em',
          zIndex: 10,
        }}
      >
        {chars}
      </div>
    )
  },
}

function FreqModulateComponent(props: MotionGraphicProps<FreqModulateConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-freq-modulate',
  title: 'Kinetic Freq Modulate',
  description:
    'FM synthesis visualization: text warped by frequency modulation with carrier + modulator interference patterns. Synthesizer aesthetic with purple/violet tones.',
  tags: ['kinetic', 'typography', 'fm', 'synthesis', 'frequency', 'modulation', 'synth', 'signal'],
  category: 'captions',
  component: FreqModulateComponent as any,
  defaultConfig: {
    words: ['FREQ', 'WARP', 'SYNTH', 'TONE'],
    colors: ['#CC66FF', '#9966FF', '#FF66CC', '#AA88FF'],
    bgColor: '#0A0612',
    cycleDuration: 1.3,
    modulatorDepth: 3,
  },
  configSchema: [
    { key: 'words', label: 'Words', type: 'text-array', defaultValue: ['FREQ', 'WARP', 'SYNTH', 'TONE'], group: 'Content' },
    { key: 'colors', label: 'Colors', type: 'text-array', defaultValue: ['#CC66FF', '#9966FF', '#FF66CC', '#AA88FF'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#0A0612', group: 'Style' },
    { key: 'cycleDuration', label: 'Cycle Duration (s)', type: 'number', defaultValue: 1.3, min: 0.3, max: 5, group: 'Timing' },
  ],
})
