import { registerMotionGraphic } from '../registry'
import {
  KineticBase,
  type KineticBaseConfig,
  type KineticAnimation,
  type WordRenderProps,
  type BackgroundRenderProps,
} from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface PhaseDistortConfig extends KineticBaseConfig {
  distortAmount: number
}

const animation: KineticAnimation = {
  renderBackground: ({ bgColor, width, height, frame, fps }: BackgroundRenderProps) => {
    const time = frame / fps
    // Phase distortion visualization: original vs distorted waveform
    const pointCount = 100

    const waveData = [
      { label: 'ORIGINAL', yCenter: height * 0.3, color: '#4488AA', distort: false },
      { label: 'DISTORTED', yCenter: height * 0.7, color: '#00DDFF', distort: true },
    ]

    return (
      <div style={{ position: 'absolute', inset: 0, background: bgColor }}>
        {/* CZ-series inspired panel lines */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            backgroundImage: `
              linear-gradient(rgba(0,220,255,0.02) 1px, transparent 1px)
            `,
            backgroundSize: `100% ${height / 8}px`,
          }}
        />

        <svg
          style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}
          viewBox={`0 0 ${width} ${height}`}
          preserveAspectRatio="none"
        >
          {waveData.map((wave, wi) => {
            const points: string[] = []
            for (let i = 0; i <= pointCount; i++) {
              const normalX = i / pointCount
              const x = normalX * width
              let y: number

              if (wave.distort) {
                // Phase distortion: warp the phase of a cosine wave
                // Casio CZ-style: map linear phase through a distortion function
                const phase = normalX * Math.PI * 2 + time * 2
                const distortionAmount = 0.7 + 0.3 * Math.sin(time * 0.5)
                // Phase warping function
                const warpedPhase = phase + distortionAmount * Math.sin(phase * 2) * Math.sin(time * 1.5)
                y = wave.yCenter + height * 0.08 * Math.cos(warpedPhase)
              } else {
                // Clean cosine
                y = wave.yCenter + height * 0.08 * Math.cos(normalX * Math.PI * 2 + time * 2)
              }
              points.push(`${x},${y}`)
            }
            const pathD = `M ${points[0]} ` + points.slice(1).map((p) => `L ${p}`).join(' ')

            return (
              <g key={wi}>
                {/* Glow */}
                <path d={pathD} fill="none" stroke={wave.color} strokeWidth={4} opacity={0.1} />
                {/* Main */}
                <path d={pathD} fill="none" stroke={wave.color} strokeWidth={1.5} opacity={0.35} />
              </g>
            )
          })}
        </svg>

        {/* Wave labels */}
        {waveData.map((wave, wi) => (
          <div
            key={wi}
            style={{
              position: 'absolute',
              top: wave.yCenter - height * 0.14,
              left: width * 0.04,
              fontFamily: "'Courier New', monospace",
              fontSize: 9,
              color: `${wave.color}66`,
              letterSpacing: 2,
            }}
          >
            {wave.label}
          </div>
        ))}
      </div>
    )
  },

  renderWord: ({ word, color, enterProgress, exitProgress, phase, holdProgress, width, height, frame, index }: WordRenderProps) => {
    const f = frame ?? 0
    const time = f / 30
    const totalChars = word.length

    let masterOpacity = 1
    if (phase === 'enter') {
      masterOpacity = Math.min(1, enterProgress * 1.5)
    } else if (phase === 'exit') {
      masterOpacity = 1 - exitProgress
    }

    // Phase distortion intensity varies by animation phase
    let distortStrength = 0
    if (phase === 'enter') {
      distortStrength = enterProgress
    } else if (phase === 'hold') {
      distortStrength = 1
    } else {
      distortStrength = 1 - exitProgress
    }

    // Each character gets phase-distorted wobble (Casio CZ waveshaping)
    const chars = word.split('').map((ch, ci) => {
      const charPhase = (ci / Math.max(1, totalChars - 1)) * Math.PI * 2
      const basePhase = charPhase + time * 3

      // Phase distortion: warp through nonlinear function
      const distortionAmount = distortStrength * 0.8
      const warpedPhase = basePhase + distortionAmount * Math.sin(basePhase * 2 + time * 1.2)

      // Wobble displacement from phase distortion
      const xDisplace = 6 * Math.sin(warpedPhase) * distortStrength
      const yDisplace = 10 * Math.cos(warpedPhase * 1.3) * distortStrength

      // Stretch/compress: characters widen at wave peaks, narrow at troughs
      const scaleX = 1 + 0.2 * Math.sin(warpedPhase) * distortStrength
      const scaleY = 1 + 0.15 * Math.cos(warpedPhase + Math.PI / 3) * distortStrength

      // Phase-dependent color shift
      const phaseHueShift = Math.sin(warpedPhase) * 20 * distortStrength
      const charStyle: React.CSSProperties = {
        display: 'inline-block',
        transform: `translate(${xDisplace}px, ${yDisplace}px) scale(${scaleX}, ${scaleY})`,
        color,
        filter: `hue-rotate(${phaseHueShift}deg)`,
        textShadow: `
          0 0 12px ${color}50,
          ${xDisplace * 0.5}px ${yDisplace * 0.3}px 6px ${color}30
        `,
      }

      return (
        <span key={ci} style={charStyle}>
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
          transform: 'translate(-50%, -50%)',
          opacity: masterOpacity,
          fontFamily: "'Courier New', 'Fira Code', monospace",
          fontSize: 'clamp(40px, 11vw, 150px)',
          fontWeight: 700,
          whiteSpace: 'nowrap',
          textTransform: 'uppercase',
          letterSpacing: '0.05em',
          zIndex: 10,
        }}
      >
        {chars}
      </div>
    )
  },
}

function PhaseDistortComponent(props: MotionGraphicProps<PhaseDistortConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-phase-distort',
  title: 'Kinetic Phase Distort',
  description:
    'Phase distortion synthesis: text wobbles as phase shifts with Casio CZ-style waveshaping. Letters stretch and compress in wave cycles with original vs distorted waveform display.',
  tags: ['kinetic', 'typography', 'phase', 'distortion', 'casio', 'synth', 'wobble', 'waveshape'],
  category: 'captions',
  component: PhaseDistortComponent as any,
  defaultConfig: {
    words: ['WARP', 'BEND', 'FLUX', 'MESH'],
    colors: ['#00DDFF', '#00AADD', '#33EEFF', '#0088BB'],
    bgColor: '#060A10',
    cycleDuration: 1.3,
    distortAmount: 0.8,
  },
  configSchema: [
    { key: 'words', label: 'Words', type: 'text-array', defaultValue: ['WARP', 'BEND', 'FLUX', 'MESH'], group: 'Content' },
    { key: 'colors', label: 'Colors', type: 'text-array', defaultValue: ['#00DDFF', '#00AADD', '#33EEFF', '#0088BB'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#060A10', group: 'Style' },
    { key: 'cycleDuration', label: 'Cycle Duration (s)', type: 'number', defaultValue: 1.3, min: 0.3, max: 5, group: 'Timing' },
  ],
})
