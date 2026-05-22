import { registerMotionGraphic } from '../registry'
import { KineticBase, type KineticBaseConfig, type KineticAnimation, type WordRenderProps, type BackgroundRenderProps } from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

// ── Wave Distortion 1: Flag Wave ──────────────────────────────────────────────
// Text undulates with a flag-in-wind wave — each character offset vertically
// and rotated by a travelling sine wave, perspective-pinned to the left pole.

interface FlagWaveConfig extends KineticBaseConfig {
  waveAmplitude: number
  waveFrequency: number
}

function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3)
}

function easeInCubic(t: number): number {
  return t * t * t
}

const animation: KineticAnimation = {
  renderBackground: ({ bgColor, width, height }: BackgroundRenderProps) => (
    <div style={{
      position: 'absolute', inset: 0,
      background: `linear-gradient(135deg, ${bgColor} 0%, ${bgColor}cc 100%)`,
    }}>
      {/* Wind direction lines */}
      {Array.from({ length: 6 }, (_, i) => (
        <div key={i} style={{
          position: 'absolute',
          left: 0, right: 0,
          top: `${15 + i * 14}%`,
          height: 1,
          background: `linear-gradient(to right, transparent 0%, rgba(255,255,255,0.04) 30%, rgba(255,255,255,0.08) 60%, transparent 100%)`,
        }} />
      ))}
    </div>
  ),

  renderWord: ({ word, color, enterProgress, holdProgress, exitProgress, phase, width, height }: WordRenderProps) => {
    const chars = word.split('')
    const totalChars = chars.length
    // Wave clock: drives continuous motion during hold
    const waveClock = holdProgress * Math.PI * 4

    return (
      <div style={{
        position: 'absolute',
        top: '50%', left: '50%',
        transform: 'translate(-50%, -50%)',
        display: 'flex',
        whiteSpace: 'nowrap',
        gap: 0,
      }}>
        {chars.map((ch, ci) => {
          // Normalised position 0..1 along the word (left=pole side)
          const norm = totalChars > 1 ? ci / (totalChars - 1) : 0

          // Flag wave: amplitude increases toward the fly end
          const amplitudeScale = 0.3 + norm * 0.7
          const phaseOffset = norm * Math.PI * 2.5

          // Wave value for hold phase
          const waveY = Math.sin(waveClock - phaseOffset) * 28 * amplitudeScale
          const waveRotZ = Math.sin(waveClock - phaseOffset + 0.4) * 12 * amplitudeScale
          const scaleX = 1 - Math.abs(Math.sin(waveClock - phaseOffset)) * 0.12 * norm
          const scaleY = 1 + Math.sin(waveClock - phaseOffset + Math.PI / 2) * 0.08 * amplitudeScale

          let translateX = 0, translateY = 0, rotZ = 0, scX = 1, scY = 1, op = 0, blur = 0

          if (phase === 'enter') {
            // Unfurl left-to-right: left chars arrive first
            const delay = norm * 0.4
            const p = Math.max(0, Math.min(1, (enterProgress - delay) / (1 - delay * 0.7)))
            const e = easeOutCubic(p)
            // Chars come from the right, crumpled
            translateX = (1 - e) * width * 0.4 * norm
            translateY = Math.sin((1 - e) * Math.PI * 3 + phaseOffset) * 40 * amplitudeScale * (1 - e)
            rotZ = (1 - e) * 25 * amplitudeScale
            scX = 0.2 + e * 0.8
            scY = 0.5 + e * 0.5
            op = Math.min(1, p * 2.5)
            blur = (1 - e) * 6
          } else if (phase === 'hold') {
            translateY = waveY
            rotZ = waveRotZ
            scX = scaleX
            scY = scaleY
            op = 1
          } else {
            // Furl back right-to-left
            const delay = (1 - norm) * 0.3
            const p = Math.max(0, Math.min(1, (exitProgress - delay) / (1 - delay * 0.5)))
            const e = easeInCubic(p)
            translateX = e * width * 0.5 * norm
            translateY = waveY * (1 - e) + Math.sin(e * Math.PI) * -60 * norm
            rotZ = waveRotZ * (1 - e) + e * 45 * norm
            scX = 1 - e * 0.8
            scY = 1 - e * 0.5
            op = 1 - e
            blur = e * 4
          }

          return (
            <div
              key={ci}
              style={{
                display: 'inline-block',
                fontFamily: "'Georgia', 'Times New Roman', serif",
                fontSize: 'clamp(44px, 10vw, 140px)',
                fontWeight: 700,
                color,
                opacity: op,
                filter: `blur(${blur}px)`,
                transform: `translateX(${translateX}px) translateY(${translateY}px) scaleX(${scX}) scaleY(${scY}) rotateZ(${rotZ}deg)`,
                transformOrigin: `0% 50%`,
                textShadow: `2px 2px 8px rgba(0,0,0,0.4)`,
                lineHeight: 1.2,
                letterSpacing: '0.01em',
              }}
            >
              {ch}
            </div>
          )
        })}
      </div>
    )
  },
}

function FlagWaveComponent(props: MotionGraphicProps<FlagWaveConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-flag-wave',
  title: 'Kinetic Flag Wave',
  description: 'Text undulates like a flag in wind — amplitude increases toward the fly end, chars unfurl on enter and furl back on exit.',
  tags: ['kinetic', 'typography', 'wave', 'flag', 'distortion', 'flowing', 'deformation', 'wind'],
  category: 'captions',
  component: FlagWaveComponent as any,
  defaultConfig: {
    words: ['WAVE', 'FLOW', 'DRIFT', 'WIND'],
    colors: ['#FFFFFF', '#FFD700', '#FFFFFF', '#87CEEB'],
    bgColor: '#0a2040',
    cycleDuration: 2.0,
    waveAmplitude: 28,
    waveFrequency: 4,
  },
  configSchema: [
    { key: 'words', label: 'Words', type: 'text-array', defaultValue: ['WAVE', 'FLOW', 'DRIFT', 'WIND'], group: 'Content' },
    { key: 'colors', label: 'Colors', type: 'text-array', defaultValue: ['#FFFFFF', '#FFD700', '#FFFFFF', '#87CEEB'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#0a2040', group: 'Style' },
    { key: 'cycleDuration', label: 'Cycle Duration (s)', type: 'number', defaultValue: 2.0, min: 0.8, max: 6, group: 'Timing' },
    { key: 'waveAmplitude', label: 'Wave Amplitude', type: 'number', defaultValue: 28, min: 8, max: 60, group: 'Animation' },
    { key: 'waveFrequency', label: 'Wave Frequency', type: 'number', defaultValue: 4, min: 1, max: 12, group: 'Animation' },
  ],
})
