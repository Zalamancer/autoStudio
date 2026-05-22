import { registerMotionGraphic } from '../registry'
import { KineticBase, type KineticBaseConfig, type KineticAnimation, type WordRenderProps, type BackgroundRenderProps } from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface AutoTuneGlitchConfig extends KineticBaseConfig {
  pitchSteps: number
}

// Deterministic pitch wobble — mimics auto-tune pitch ladder
function pitchOffset(t: number, step: number): number {
  // Quantized pitch steps: auto-tune snaps pitch to nearest semitone
  const raw = Math.sin(t * 6.28 + step * 1.17) * 14
  // Snap to nearest 4px step (simulates semitone quantization)
  return Math.round(raw / 4) * 4
}

function dsin(seed: number): number {
  return Math.sin(seed * 127.1 + 311.7)
}

const PITCH_COLORS = ['#FF6EC7', '#FF6EC7', '#C77DFF', '#7B2FBE']

const animation: KineticAnimation = {
  renderBackground: ({ bgColor, width, height, frame, fps }: BackgroundRenderProps) => {
    const time = frame / fps
    // Equalizer-style pitch ladder bars in background
    const barCount = 12
    const barWidth = width / barCount

    return (
      <div style={{ position: 'absolute', inset: 0, background: bgColor }}>
        {/* Pitch ladder grid lines — horizontal semitone markers */}
        {Array.from({ length: 8 }, (_, i) => {
          const y = (height / 9) * (i + 1)
          const isMiddle = i === 3
          return (
            <div
              key={i}
              style={{
                position: 'absolute',
                left: 0,
                right: 0,
                top: y,
                height: isMiddle ? 2 : 1,
                background: isMiddle
                  ? 'rgba(199,125,255,0.25)'
                  : 'rgba(255,255,255,0.06)',
              }}
            />
          )
        })}
        {/* Animated EQ bars at bottom */}
        {Array.from({ length: barCount }, (_, i) => {
          const speed = 1.8 + (i % 5) * 0.4
          const barH = (Math.abs(Math.sin(time * speed + i * 0.7)) * 0.4 + 0.05) * height * 0.25
          const hue = 270 + i * 8
          return (
            <div
              key={i}
              style={{
                position: 'absolute',
                bottom: 0,
                left: i * barWidth,
                width: barWidth - 2,
                height: barH,
                background: `hsla(${hue}, 80%, 65%, 0.35)`,
                borderRadius: '2px 2px 0 0',
              }}
            />
          )
        })}
        {/* Auto-tune brand label */}
        <div
          style={{
            position: 'absolute',
            top: 12,
            right: 16,
            fontFamily: "'Courier New', monospace",
            fontSize: 10,
            color: 'rgba(199,125,255,0.5)',
            letterSpacing: 2,
            textTransform: 'uppercase',
          }}
        >
          AUTO-TUNE ON
        </div>
      </div>
    )
  },

  renderWord: ({ word, color, enterProgress, holdProgress, exitProgress, phase, index }: WordRenderProps) => {
    const seed = index * 53 + 19

    // Build per-character pitch-quantized wobble
    const chars = word.split('').map((ch, ci) => {
      let yOffset = 0
      let xOffset = 0
      let opacity = 1
      let charColor = color

      if (phase === 'enter') {
        // Pitch correction arrival: chars slide up from below in staggered steps
        const delay = (ci / word.length) * 0.6
        const cp = Math.max(0, Math.min(1, (enterProgress - delay) / 0.4))
        // Quantized snap: position jumps through pitch steps
        const rawY = (1 - cp) * 40
        yOffset = Math.round(rawY / 6) * 6
        opacity = cp
        charColor = PITCH_COLORS[ci % PITCH_COLORS.length]
      } else if (phase === 'hold') {
        // Sustained pitch wobble — auto-tune artifact
        const t = holdProgress * 2 + ci * 0.3
        yOffset = pitchOffset(t, ci + seed)
        // Color shift on extreme pitch
        charColor = Math.abs(yOffset) > 8 ? PITCH_COLORS[(ci + 1) % PITCH_COLORS.length] : color
        // Occasional formant ghost (doubled char offset)
        xOffset = Math.abs(dsin(holdProgress * 11 + ci * 7)) > 0.88 ? dsin(ci * 41) * 3 : 0
      } else {
        // Exit: pitch correction collapses — all chars snap to center then fade
        yOffset = exitProgress > 0.5
          ? (exitProgress - 0.5) * 2 * dsin(ci * 23 + 5) * 20
          : 0
        opacity = 1 - exitProgress
      }

      return (
        <span
          key={ci}
          style={{
            display: 'inline-block',
            transform: `translate(${xOffset}px, ${yOffset}px)`,
            opacity,
            color: charColor,
            transition: 'none',
          }}
        >
          {ch}
        </span>
      )
    })

    // Ghost echo layer — the "pre-corrected" pitch artifact
    const ghostOpacity = phase === 'hold' ? Math.abs(dsin(holdProgress * 7 + seed)) * 0.3 : 0
    const ghostY = phase === 'hold' ? pitchOffset(holdProgress * 1.5 + 0.5, seed) : 0

    return (
      <>
        {/* Ghost pitch artifact */}
        {ghostOpacity > 0.05 && (
          <div
            style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: `translate(-50%, calc(-50% + ${ghostY}px))`,
              fontFamily: "'Arial Black', Arial, sans-serif",
              fontSize: 'clamp(38px, 11vw, 145px)',
              fontWeight: 900,
              color: '#C77DFF',
              whiteSpace: 'nowrap',
              letterSpacing: 3,
              opacity: ghostOpacity,
              filter: 'blur(1px)',
            }}
          >
            {word}
          </div>
        )}
        {/* Main text */}
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            fontFamily: "'Arial Black', Arial, sans-serif",
            fontSize: 'clamp(38px, 11vw, 145px)',
            fontWeight: 900,
            whiteSpace: 'nowrap',
            letterSpacing: 3,
            textShadow: `0 0 20px ${color}50`,
          }}
        >
          {chars}
        </div>
      </>
    )
  },
}

function AutoTuneGlitchComponent(props: MotionGraphicProps<AutoTuneGlitchConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-auto-tune-glitch',
  title: 'Kinetic Auto-Tune Glitch',
  description: 'Auto-Tune pitch correction artifact: characters wobble through quantized pitch steps with color shifts and ghost echo layers',
  tags: ['kinetic', 'typography', 'glitch', 'auto-tune', 'music', 'pitch', 'vocal', 'cultural'],
  category: 'captions',
  component: AutoTuneGlitchComponent as any,
  defaultConfig: {
    words: ['PITCH', 'PERFECT', 'T-PAIN', 'WAVE'],
    colors: ['#FF6EC7', '#C77DFF', '#FF6EC7', '#ffffff'],
    bgColor: '#0d0015',
    cycleDuration: 1.6,
    pitchSteps: 6,
  },
  configSchema: [
    { key: 'words', label: 'Words', type: 'text-array', defaultValue: ['PITCH', 'PERFECT', 'T-PAIN', 'WAVE'], group: 'Content' },
    { key: 'colors', label: 'Colors', type: 'text-array', defaultValue: ['#FF6EC7', '#C77DFF', '#FF6EC7', '#ffffff'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#0d0015', group: 'Style' },
    { key: 'cycleDuration', label: 'Cycle Duration (s)', type: 'number', defaultValue: 1.6, min: 0.5, max: 5, group: 'Timing' },
    { key: 'pitchSteps', label: 'Pitch Steps', type: 'number', defaultValue: 6, min: 2, max: 16, group: 'Animation' },
  ],
})
