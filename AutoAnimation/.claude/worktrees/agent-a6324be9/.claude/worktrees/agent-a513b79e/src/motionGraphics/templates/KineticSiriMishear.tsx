import { registerMotionGraphic } from '../registry'
import { KineticBase, type KineticBaseConfig, type KineticAnimation, type WordRenderProps, type BackgroundRenderProps } from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface SiriMishearConfig extends KineticBaseConfig {
  mishearings: string[]
}

function dsin(seed: number): number {
  return Math.sin(seed * 127.1 + 311.7)
}

// Phonetically funny mishearings per word
const MISHEAR_BANKS: string[][] = [
  ['Set a timer for', 'Siri: "Set a llama for"', 'Siri: "Set a timer four"'],
  ['Call Mom', 'Siri: "Call bomb"', 'Siri: "Call mom"'],
  ['Navigate home', 'Siri: "Navigate foam"', 'Siri: "Navigate home"'],
  ['Play some music', 'Siri: "Slay some music"', 'Siri: "Play some music"'],
  ['Remind me later', 'Siri: "Remind me laser"', 'Siri: "Remind me later"'],
]

const animation: KineticAnimation = {
  renderBackground: ({ bgColor, width, height, frame, fps }: BackgroundRenderProps) => {
    const time = frame / fps
    // Siri waveform animation — deterministic ripple rings
    const ringCount = 5
    const centerX = width / 2
    const centerY = height / 2

    return (
      <div style={{ position: 'absolute', inset: 0, background: bgColor }}>
        {/* Siri-style animated waveform rings */}
        <svg
          width={width}
          height={height}
          style={{ position: 'absolute', inset: 0, opacity: 0.4 }}
        >
          {Array.from({ length: ringCount }, (_, i) => {
            const phase = (time * 1.2 + i * 0.4) % 2
            const radius = 40 + i * 28 + phase * 20
            const opacity = Math.max(0, 1 - phase * 0.5) * (0.3 + i * 0.05)
            const hue = 190 + i * 20
            return (
              <circle
                key={i}
                cx={centerX}
                cy={centerY}
                r={radius}
                fill="none"
                stroke={`hsla(${hue}, 80%, 65%, ${opacity})`}
                strokeWidth={2 - i * 0.3}
              />
            )
          })}
        </svg>
        {/* Siri wordmark area */}
        <div
          style={{
            position: 'absolute',
            top: 20,
            left: '50%',
            transform: 'translateX(-50%)',
            fontFamily: "'SF Pro Display', -apple-system, Arial, sans-serif",
            fontSize: 13,
            color: 'rgba(255,255,255,0.3)',
            letterSpacing: 1,
          }}
        >
          Hey Siri
        </div>
      </div>
    )
  },

  renderWord: ({ word, color, enterProgress, holdProgress, exitProgress, phase, index, width }: WordRenderProps) => {
    const seed = index * 67 + 29
    const mishearBank = MISHEAR_BANKS[index % MISHEAR_BANKS.length]

    // Phase breakdown:
    // enter: Siri listening animation + wrong transcription appears
    // hold 0..0.5: wrong text shown with strikethrough building
    // hold 0.5..1: correction appears, wrong fades, correct snaps in
    // exit: correct text fades

    let opacity = 1
    if (phase === 'exit') opacity = 1 - exitProgress

    const wrongText = mishearBank[1] ?? `Siri: "${word}??"`
    const correctText = word

    // Strikethrough progress builds during hold 0.2..0.55
    const strikeProgress = phase === 'hold'
      ? Math.max(0, Math.min(1, (holdProgress - 0.2) / 0.35))
      : 0

    // Correction arrival: holdProgress 0.55..0.75
    const correctionProgress = phase === 'hold'
      ? Math.max(0, Math.min(1, (holdProgress - 0.55) / 0.2))
      : 0

    // Wrong text opacity: full until 0.6, then fades
    const wrongOpacity = phase === 'hold'
      ? holdProgress < 0.6 ? 1 : Math.max(0, 1 - (holdProgress - 0.6) / 0.2)
      : phase === 'enter' ? enterProgress : 0

    // Correct text opacity: builds at 0.55
    const correctOpacity = phase === 'hold'
      ? correctionProgress
      : phase === 'exit' ? 1 : 0

    // Wrong text x-shake when being corrected
    const wrongShakeX = phase === 'hold' && holdProgress > 0.5 && holdProgress < 0.65
      ? dsin(holdProgress * 47 + seed) * 5
      : 0

    const approxWordWidth = Math.min(word.length * 48 * 0.7, width * 0.85)

    return (
      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          opacity,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 12,
          width: '90%',
        }}
      >
        {/* Wrong transcription */}
        {wrongOpacity > 0.01 && (
          <div
            style={{
              position: 'relative',
              transform: `translateX(${wrongShakeX}px)`,
              opacity: wrongOpacity,
            }}
          >
            <div
              style={{
                fontFamily: "'SF Pro Display', -apple-system, Arial, sans-serif",
                fontSize: 'clamp(18px, 4.5vw, 58px)',
                fontWeight: 400,
                color: 'rgba(255,100,100,0.9)',
                textAlign: 'center',
                whiteSpace: 'nowrap',
                letterSpacing: 0.5,
              }}
            >
              {wrongText}
            </div>
            {/* Strikethrough line */}
            {strikeProgress > 0 && (
              <div
                style={{
                  position: 'absolute',
                  top: '50%',
                  left: 0,
                  width: `${strikeProgress * 100}%`,
                  height: 2,
                  background: '#FF3B30',
                  transform: 'translateY(-50%)',
                  borderRadius: 1,
                }}
              />
            )}
          </div>
        )}

        {/* Correct word — slides up from below */}
        {correctOpacity > 0.01 && (
          <div
            style={{
              fontFamily: "'SF Pro Display', -apple-system, Arial, sans-serif",
              fontSize: 'clamp(36px, 10vw, 130px)',
              fontWeight: 700,
              color: correctOpacity > 0.8 ? color : `rgba(100,220,100,${correctOpacity})`,
              textAlign: 'center',
              whiteSpace: 'nowrap',
              letterSpacing: 2,
              opacity: correctOpacity,
              transform: `translateY(${(1 - correctionProgress) * 20}px)`,
              textShadow: correctOpacity > 0.8 ? `0 0 20px ${color}40` : `0 0 15px rgba(100,220,100,0.4)`,
            }}
          >
            {correctText}
          </div>
        )}

        {/* Listening indicator during enter */}
        {phase === 'enter' && (
          <div
            style={{
              display: 'flex',
              gap: 4,
              opacity: enterProgress,
            }}
          >
            {Array.from({ length: 5 }, (_, i) => {
              const barH = 6 + Math.abs(dsin(i * 17 + enterProgress * 8)) * 16
              return (
                <div
                  key={i}
                  style={{
                    width: 3,
                    height: barH,
                    background: 'rgba(100,160,255,0.7)',
                    borderRadius: 2,
                    alignSelf: 'center',
                  }}
                />
              )
            })}
          </div>
        )}
      </div>
    )
  },
}

function SiriMishearComponent(props: MotionGraphicProps<SiriMishearConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-siri-mishear',
  title: 'Kinetic Siri Mishear',
  description: 'Voice assistant mishearing: wrong transcription appears with strikethrough, then the correct word snaps in — classic Siri moment',
  tags: ['kinetic', 'typography', 'glitch', 'siri', 'voice-assistant', 'mishear', 'phone', 'cultural'],
  category: 'captions',
  component: SiriMishearComponent as any,
  defaultConfig: {
    words: ['TIMER', 'MOM', 'HOME', 'MUSIC'],
    colors: ['#ffffff', '#ffffff', '#ffffff', '#ffffff'],
    bgColor: '#000000',
    cycleDuration: 2.6,
    mishearings: ['Set a llama for', 'Call bomb', 'Navigate foam', 'Slay some'],
  },
  configSchema: [
    { key: 'words', label: 'Words (Correct)', type: 'text-array', defaultValue: ['TIMER', 'MOM', 'HOME', 'MUSIC'], group: 'Content' },
    { key: 'colors', label: 'Colors', type: 'text-array', defaultValue: ['#ffffff', '#ffffff', '#ffffff', '#ffffff'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#000000', group: 'Style' },
    { key: 'cycleDuration', label: 'Cycle Duration (s)', type: 'number', defaultValue: 2.6, min: 1, max: 6, group: 'Timing' },
    { key: 'mishearings', label: 'Mishearings', type: 'text-array', defaultValue: ['Set a llama for', 'Call bomb', 'Navigate foam', 'Slay some'], group: 'Animation' },
  ],
})
