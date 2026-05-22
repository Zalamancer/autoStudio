import { registerMotionGraphic } from '../registry'
import {
  KineticBase,
  type KineticBaseConfig,
  type KineticAnimation,
  type WordRenderProps,
  type BackgroundRenderProps,
} from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface SampleHoldConfig extends KineticBaseConfig {
  holdRate: number
}

/** Deterministic pseudo-random 0..1 */
function rand(s: number): number {
  const x = Math.sin(s * 127.1 + 311.7) * 43758.5453
  return x - Math.floor(x)
}

const animation: KineticAnimation = {
  renderBackground: ({ bgColor, width, height, frame, fps }: BackgroundRenderProps) => {
    const time = frame / fps
    // S&H stepped random voltage visualization
    const stepCount = 24
    const holdInterval = 0.15 // seconds per step
    const currentStep = Math.floor(time / holdInterval)

    return (
      <div style={{ position: 'absolute', inset: 0, background: bgColor }}>
        {/* Stepped waveform display */}
        <svg
          style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}
          viewBox={`0 0 ${width} ${height}`}
          preserveAspectRatio="none"
        >
          {/* Stepped random voltage line */}
          {(() => {
            const points: string[] = []
            for (let i = 0; i < stepCount; i++) {
              const stepSeed = currentStep - stepCount + i + 1
              const voltage = rand(stepSeed * 73 + 41) * 0.7 + 0.15
              const x1 = (i / stepCount) * width
              const x2 = ((i + 1) / stepCount) * width
              const y = height * 0.82 - voltage * height * 0.2
              points.push(`${x1},${y}`)
              points.push(`${x2},${y}`)
            }
            const pathD = `M ${points[0]} ` + points.slice(1).map((p) => `L ${p}`).join(' ')
            return (
              <>
                {/* Glow */}
                <path d={pathD} fill="none" stroke="#FFAA00" strokeWidth={4} opacity={0.1} />
                {/* Main line */}
                <path d={pathD} fill="none" stroke="#FFAA00" strokeWidth={1.5} opacity={0.5} />
                {/* Sample dots at step transitions */}
                {Array.from({ length: stepCount }).map((_, i) => {
                  const stepSeed = currentStep - stepCount + i + 1
                  const voltage = rand(stepSeed * 73 + 41) * 0.7 + 0.15
                  const x = (i / stepCount) * width
                  const y = height * 0.82 - voltage * height * 0.2
                  return (
                    <circle
                      key={i}
                      cx={x}
                      cy={y}
                      r={2}
                      fill={i === stepCount - 1 ? '#FFFFFF' : '#FFAA00'}
                      opacity={i === stepCount - 1 ? 1 : 0.3}
                    />
                  )
                })}
              </>
            )
          })()}
        </svg>

        {/* Clock pulse indicator */}
        <div
          style={{
            position: 'absolute',
            top: height * 0.08,
            left: width * 0.06,
            fontFamily: "'Courier New', monospace",
            fontSize: 10,
            color: '#FFAA0066',
            letterSpacing: 2,
          }}
        >
          {`CLK: ${(1 / holdInterval).toFixed(1)} Hz | STEP: ${currentStep % 100}`}
        </div>

        {/* Voltage readout */}
        <div
          style={{
            position: 'absolute',
            top: height * 0.08,
            right: width * 0.06,
            fontFamily: "'Courier New', monospace",
            fontSize: 10,
            color: '#FFAA0066',
            letterSpacing: 2,
          }}
        >
          {`V: ${(rand(currentStep * 73 + 41) * 5).toFixed(2)}V`}
        </div>
      </div>
    )
  },

  renderWord: ({ word, color, enterProgress, exitProgress, phase, holdProgress, frame, index, width, height }: WordRenderProps) => {
    const f = frame ?? 0
    const time = f / 30

    const totalChars = word.length
    const holdInterval = 4 // frames between holds
    const quantizedFrame = Math.floor(f / holdInterval) * holdInterval

    let masterOpacity = 1

    if (phase === 'enter') {
      masterOpacity = Math.min(1, enterProgress * 2)
    } else if (phase === 'exit') {
      masterOpacity = 1 - exitProgress
    }

    // Each character freezes at random intervals - sample & hold behavior
    const chars = word.split('').map((ch, ci) => {
      const charSeed = ci * 97 + index * 31
      // Each char has its own sample clock
      const charHoldInterval = 3 + Math.floor(rand(charSeed) * 6)
      const charQuantFrame = Math.floor(f / charHoldInterval) * charHoldInterval

      // Sampled random values (frozen per step)
      const sampledY = (rand(charSeed + charQuantFrame * 7) - 0.5) * 20
      const sampledRotation = (rand(charSeed + charQuantFrame * 13) - 0.5) * 8
      const sampledScale = 0.9 + rand(charSeed + charQuantFrame * 19) * 0.2

      let yOffset = sampledY
      let rotation = sampledRotation
      let scale = sampledScale
      let charOpacity = 1

      if (phase === 'enter') {
        // Characters snap in at quantized intervals
        const charDelay = ci / totalChars
        const appeared = enterProgress > charDelay + 0.1
        charOpacity = appeared ? 1 : 0
        if (!appeared) {
          yOffset = 0
          rotation = 0
          scale = 1
        }
      } else if (phase === 'hold') {
        // Full S&H behavior - values jump at clock edges
        charOpacity = 1
      } else {
        // Characters snap off at quantized intervals
        const charDelay = ci / totalChars
        const disappeared = exitProgress > charDelay + 0.2
        charOpacity = disappeared ? 0 : 1
      }

      // Flash on sample moment
      const isSampling = f % charHoldInterval === 0
      const flashColor = isSampling ? '#FFFFFF' : color

      return (
        <span
          key={ci}
          style={{
            display: 'inline-block',
            transform: `translateY(${yOffset}px) rotate(${rotation}deg) scale(${scale})`,
            opacity: charOpacity,
            color: flashColor,
            textShadow: isSampling
              ? `0 0 20px #FFFFFF80, 0 0 40px ${color}60`
              : `0 0 10px ${color}40`,
            transition: 'none', // No smooth transitions - everything is stepped
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
          transform: 'translate(-50%, -50%)',
          opacity: masterOpacity,
          fontFamily: "'Courier New', 'Fira Code', monospace",
          fontSize: 'clamp(40px, 11vw, 150px)',
          fontWeight: 700,
          whiteSpace: 'nowrap',
          textTransform: 'uppercase',
          letterSpacing: '0.06em',
          zIndex: 10,
        }}
      >
        {chars}
      </div>
    )
  },
}

function SampleHoldComponent(props: MotionGraphicProps<SampleHoldConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-sample-hold',
  title: 'Kinetic Sample & Hold',
  description:
    'Sample & hold: text freezes frame-by-frame at random intervals with stepped/quantized animation. Vintage synth random voltage aesthetic with stepped waveform display.',
  tags: ['kinetic', 'typography', 'sample', 'hold', 'synth', 'quantize', 'stepped', 'voltage'],
  category: 'captions',
  component: SampleHoldComponent as any,
  defaultConfig: {
    words: ['HOLD', 'STEP', 'SYNC', 'SNAP'],
    colors: ['#FFAA00', '#FFCC33', '#FF8800', '#FFE066'],
    bgColor: '#0A0806',
    cycleDuration: 1.3,
    holdRate: 6,
  },
  configSchema: [
    { key: 'words', label: 'Words', type: 'text-array', defaultValue: ['HOLD', 'STEP', 'SYNC', 'SNAP'], group: 'Content' },
    { key: 'colors', label: 'Colors', type: 'text-array', defaultValue: ['#FFAA00', '#FFCC33', '#FF8800', '#FFE066'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#0A0806', group: 'Style' },
    { key: 'cycleDuration', label: 'Cycle Duration (s)', type: 'number', defaultValue: 1.3, min: 0.3, max: 5, group: 'Timing' },
  ],
})
