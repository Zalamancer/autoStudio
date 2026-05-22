import { registerMotionGraphic } from '../registry'
import {
  KineticBase,
  type KineticBaseConfig,
  type KineticAnimation,
  type WordRenderProps,
  type BackgroundRenderProps,
} from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface VoiceWaveformConfig extends KineticBaseConfig {}

function easeOutExpo(t: number): number {
  return t === 1 ? 1 : 1 - Math.pow(2, -10 * t)
}

function easeOutBack(t: number): number {
  const c1 = 1.70158
  const c3 = c1 + 1
  return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2)
}

function pRand(seed: number): number {
  const x = Math.sin(seed * 127.1 + 311.7) * 43758.5453
  return x - Math.floor(x)
}

const TRANSCRIPT_WORDS = ['Hey', 'Siri,', 'define', '...']

const animation: KineticAnimation = {
  renderBackground: ({ bgColor, frame, fps }: BackgroundRenderProps) => {
    const time = frame / fps
    const barCount = 40

    return (
      <div style={{ position: 'absolute', inset: 0, background: bgColor }}>
        {/* Siri/voice assistant ambient gradient */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: `radial-gradient(ellipse at 50% ${40 + Math.sin(time * 1.5) * 8}%, rgba(0,122,255,0.12) 0%, rgba(88,101,242,0.06) 40%, transparent 70%)`,
            pointerEvents: 'none',
          }}
        />

        {/* Waveform bars */}
        <div
          style={{
            position: 'absolute',
            top: '20%',
            left: '10%',
            right: '10%',
            height: '30%',
            display: 'flex',
            alignItems: 'center',
            gap: 2,
          }}
        >
          {Array.from({ length: barCount }, (_, i) => {
            const baseH = 0.15 + pRand(i * 17) * 0.2
            const wave1 = Math.abs(Math.sin(time * 8 + i * 0.3)) * 0.5
            const wave2 = Math.abs(Math.sin(time * 5 + i * 0.5 + 1.2)) * 0.3
            const h = baseH + wave1 + wave2
            const hue = 210 + i * 3
            return (
              <div
                key={i}
                style={{
                  flex: 1,
                  height: `${Math.min(100, h * 100)}%`,
                  background: `hsla(${hue}, 80%, 65%, 0.8)`,
                  borderRadius: 100,
                  transition: 'none',
                }}
              />
            )
          })}
        </div>

        {/* Transcript words appearing */}
        <div
          style={{
            position: 'absolute',
            top: '55%',
            left: '50%',
            transform: 'translateX(-50%)',
            display: 'flex',
            gap: 'clamp(4px, 1vw, 8px)',
          }}
        >
          {TRANSCRIPT_WORDS.map((w, i) => (
            <span
              key={i}
              style={{
                fontFamily: 'system-ui, -apple-system, sans-serif',
                fontSize: 'clamp(7px, 1.3vw, 10px)',
                color: i === TRANSCRIPT_WORDS.length - 1 ? 'rgba(255,255,255,0.4)' : 'rgba(255,255,255,0.7)',
                fontWeight: i === 2 ? 700 : 400,
                opacity: Math.min(1, Math.max(0, time * 3 - i * 0.5)),
              }}
            >
              {w}
            </span>
          ))}
        </div>

        {/* Pulsing mic button */}
        <div
          style={{
            position: 'absolute',
            bottom: 'clamp(10px, 2.5vw, 20px)',
            left: '50%',
            transform: 'translateX(-50%)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 4,
          }}
        >
          <div
            style={{
              width: 'clamp(24px, 5vw, 40px)',
              height: 'clamp(24px, 5vw, 40px)',
              borderRadius: '50%',
              background: 'rgba(0,122,255,0.9)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 'clamp(10px, 2vw, 16px)',
              boxShadow: `0 0 ${12 + Math.sin(time * 6) * 6}px rgba(0,122,255,0.6)`,
            }}
          >
            🎤
          </div>
        </div>
      </div>
    )
  },

  renderWord: ({ word, color, enterProgress, exitProgress, phase, frame }: WordRenderProps) => {
    const f = frame ?? 0

    // Orb pulsing while listening
    const orbScale = phase === 'enter'
      ? easeOutExpo(Math.min(1, enterProgress * 2)) * (1 + Math.sin(f * 0.25) * 0.08 * Math.min(1, enterProgress * 3))
      : phase === 'hold'
      ? 1 + Math.sin(f * 0.12) * 0.05
      : Math.max(0, 1 - exitProgress * 2)
    const orbOpacity = phase === 'enter'
      ? Math.min(1, enterProgress * 3) * Math.max(0, 1 - (enterProgress - 0.5) * 4)
      : phase === 'exit'
      ? Math.max(0, 1 - exitProgress * 3)
      : 0

    // Word appears like voice recognition result
    const wordP = easeOutBack(Math.min(1, Math.max(0, (enterProgress - 0.55) / 0.45)))
    const wordOpacity = phase === 'exit' ? Math.max(0, 1 - exitProgress * 1.5) : Math.min(1, Math.max(0, (enterProgress - 0.5) * 5))
    const pulse = phase === 'hold' ? 1 + Math.sin(f * 0.09) * 0.015 : 1

    return (
      <div style={{ position: 'absolute', inset: 0 }}>
        {/* Siri orb */}
        {orbOpacity > 0 && (
          <div
            style={{
              position: 'absolute',
              top: '35%',
              left: '50%',
              transform: `translate(-50%, -50%) scale(${orbScale})`,
              opacity: orbOpacity,
              width: 'clamp(40px, 9vw, 72px)',
              height: 'clamp(40px, 9vw, 72px)',
              borderRadius: '50%',
              background: `conic-gradient(#007AFF, #AF52DE, #FF2D55, #FF9500, #34C759, #007AFF)`,
              filter: `blur(${Math.max(0, 6 - orbScale * 2)}px)`,
              boxShadow: `0 0 ${30 + orbScale * 10}px rgba(0,122,255,0.4)`,
            }}
          />
        )}

        {/* Word — recognized result */}
        <div
          style={{
            position: 'absolute',
            bottom: '18%',
            left: '50%',
            transform: `translateX(-50%) scale(${wordP * pulse})`,
            opacity: wordOpacity,
            textAlign: 'center',
            whiteSpace: 'nowrap',
          }}
        >
          <div
            style={{
              fontFamily: 'system-ui, -apple-system, sans-serif',
              fontSize: 'clamp(34px, 8.5vw, 118px)',
              fontWeight: 800,
              color,
              textShadow: `0 0 24px ${color}55`,
              letterSpacing: -2,
            }}
          >
            {word}
          </div>
          <div
            style={{
              fontFamily: 'system-ui, sans-serif',
              fontSize: 'clamp(6px, 1.1vw, 9px)',
              color: 'rgba(255,255,255,0.3)',
              marginTop: 4,
              letterSpacing: 2,
              textTransform: 'uppercase',
            }}
          >
            Voice recognized
          </div>
        </div>
      </div>
    )
  },
}

function VoiceWaveformComponent(props: MotionGraphicProps<VoiceWaveformConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-voice-waveform',
  title: 'Kinetic Voice Waveform',
  description:
    'Voice assistant waveform — 40 animated frequency bars ripple, transcript words appear one by one, a Siri-like color orb pulses, then the recognized word pops with confidence',
  tags: ['kinetic', 'typography', 'voice', 'ai', 'siri', 'waveform', 'assistant', 'digital-native', 'tech-culture'],
  category: 'captions',
  component: VoiceWaveformComponent as any,
  defaultConfig: {
    words: ['LISTEN', 'SPEAK', 'RESPOND', 'UNDERSTAND'],
    colors: ['#007AFF', '#AF52DE', '#FF2D55', '#34C759'],
    bgColor: '#000000',
    cycleDuration: 2.4,
  },
  configSchema: [
    { key: 'words', label: 'Words', type: 'text-array', defaultValue: ['LISTEN', 'SPEAK', 'RESPOND', 'UNDERSTAND'], group: 'Content' },
    { key: 'colors', label: 'Colors', type: 'text-array', defaultValue: ['#007AFF', '#AF52DE', '#FF2D55', '#34C759'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#000000', group: 'Style' },
    { key: 'cycleDuration', label: 'Cycle Duration (s)', type: 'number', defaultValue: 2.4, min: 0.5, max: 5, group: 'Timing' },
  ],
})
