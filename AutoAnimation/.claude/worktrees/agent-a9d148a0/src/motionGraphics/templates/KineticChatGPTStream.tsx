import { registerMotionGraphic } from '../registry'
import {
  KineticBase,
  type KineticBaseConfig,
  type KineticAnimation,
  type WordRenderProps,
  type BackgroundRenderProps,
} from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface ChatGPTStreamConfig extends KineticBaseConfig {}

function easeOutExpo(t: number): number {
  return t === 1 ? 1 : 1 - Math.pow(2, -10 * t)
}

function easeOutBack(t: number): number {
  const c1 = 1.70158
  const c3 = c1 + 1
  return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2)
}

const STREAM_TEXT = 'Here is the answer you were looking for. This response streams token by token in real time...'

const animation: KineticAnimation = {
  renderBackground: ({ bgColor }: BackgroundRenderProps) => (
    <div style={{ position: 'absolute', inset: 0, background: bgColor }}>
      {/* ChatGPT header */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: 'clamp(28px, 5.5vw, 44px)',
          background: 'rgba(52,53,65,0.95)',
          borderBottom: '1px solid rgba(255,255,255,0.08)',
          display: 'flex',
          alignItems: 'center',
          paddingLeft: 'clamp(10px, 2.5vw, 20px)',
          gap: 'clamp(6px, 1.5vw, 12px)',
        }}
      >
        {/* GPT-4o logo dot */}
        <div
          style={{
            width: 'clamp(12px, 2.3vw, 18px)',
            height: 'clamp(12px, 2.3vw, 18px)',
            borderRadius: '50%',
            background: 'linear-gradient(135deg, #19c37d, #0e8a55)',
          }}
        />
        <span
          style={{
            fontFamily: 'system-ui, sans-serif',
            fontSize: 'clamp(8px, 1.5vw, 12px)',
            fontWeight: 600,
            color: 'rgba(255,255,255,0.85)',
          }}
        >
          ChatGPT
        </span>
        <span
          style={{
            fontFamily: 'system-ui, sans-serif',
            fontSize: 'clamp(6px, 1vw, 8px)',
            color: 'rgba(255,255,255,0.35)',
            background: 'rgba(255,255,255,0.08)',
            padding: '1px 6px',
            borderRadius: 4,
          }}
        >
          GPT-4o
        </span>
        <div style={{ flex: 1 }} />
        <span style={{ fontSize: 'clamp(8px, 1.5vw, 12px)', color: 'rgba(255,255,255,0.3)', marginRight: 'clamp(6px, 1.5vw, 12px)' }}>✎</span>
      </div>

      {/* User message bubble */}
      <div
        style={{
          position: 'absolute',
          top: 'clamp(36px, 7.5vw, 60px)',
          right: 'clamp(10px, 2.5vw, 20px)',
          maxWidth: '60%',
          background: 'rgba(52,53,65,0.9)',
          borderRadius: '16px 4px 16px 16px',
          padding: 'clamp(5px, 1.2vw, 10px) clamp(8px, 2vw, 14px)',
          fontFamily: 'system-ui, sans-serif',
          fontSize: 'clamp(6px, 1.1vw, 9px)',
          color: 'rgba(255,255,255,0.8)',
          lineHeight: 1.4,
        }}
      >
        What is the meaning of this word?
      </div>

      {/* GPT response area */}
      <div
        style={{
          position: 'absolute',
          top: 'clamp(70px, 15vw, 115px)',
          left: 'clamp(10px, 2.5vw, 20px)',
          display: 'flex',
          alignItems: 'flex-start',
          gap: 'clamp(6px, 1.2vw, 10px)',
        }}
      >
        {/* GPT avatar */}
        <div
          style={{
            width: 'clamp(16px, 3vw, 24px)',
            height: 'clamp(16px, 3vw, 24px)',
            borderRadius: '50%',
            background: 'linear-gradient(135deg, #19c37d, #0e8a55)',
            flexShrink: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 'clamp(6px, 1.1vw, 9px)',
            color: '#fff',
            fontWeight: 900,
          }}
        >
          G
        </div>
      </div>

      {/* Bottom input bar */}
      <div
        style={{
          position: 'absolute',
          bottom: 'clamp(8px, 1.8vw, 14px)',
          left: '50%',
          transform: 'translateX(-50%)',
          width: 'clamp(140px, 48vw, 320px)',
          height: 'clamp(24px, 4.8vw, 38px)',
          background: 'rgba(64,65,79,0.9)',
          borderRadius: 12,
          border: '1px solid rgba(255,255,255,0.12)',
          display: 'flex',
          alignItems: 'center',
          paddingLeft: 'clamp(8px, 2vw, 14px)',
          paddingRight: 'clamp(8px, 2vw, 14px)',
        }}
      >
        <span
          style={{
            fontFamily: 'system-ui, sans-serif',
            fontSize: 'clamp(6px, 1.1vw, 9px)',
            color: 'rgba(255,255,255,0.25)',
            flex: 1,
          }}
        >
          Message ChatGPT
        </span>
        <span style={{ fontSize: 'clamp(8px, 1.5vw, 12px)', color: 'rgba(255,255,255,0.25)' }}>⬆</span>
      </div>
    </div>
  ),

  renderWord: ({ word, color, enterProgress, exitProgress, phase, frame }: WordRenderProps) => {
    const f = frame ?? 0

    // Stream tokens character by character
    const streamChars = Math.floor(enterProgress / 0.6 * STREAM_TEXT.length)
    const streamedText = STREAM_TEXT.substring(0, Math.min(streamChars, STREAM_TEXT.length))
    const streamOpacity = Math.min(1, enterProgress * 5) * (phase === 'exit' ? Math.max(0, 1 - exitProgress * 3) : 1)

    // Word bursts from the streaming response
    const wordP = easeOutBack(Math.min(1, Math.max(0, (enterProgress - 0.55) / 0.45)))
    const wordOpacity = phase === 'exit' ? Math.max(0, 1 - exitProgress * 1.5) : Math.min(1, Math.max(0, (enterProgress - 0.5) * 5))
    const pulse = phase === 'hold' ? 1 + Math.sin(f * 0.07) * 0.012 : 1

    // Blinking cursor
    const showCursor = phase === 'enter' && enterProgress < 0.65 && Math.sin(f * 0.28) > 0

    return (
      <div style={{ position: 'absolute', inset: 0 }}>
        {/* Streaming response text */}
        <div
          style={{
            position: 'absolute',
            top: 'clamp(80px, 17vw, 130px)',
            left: 'clamp(36px, 8vw, 62px)',
            right: 'clamp(10px, 2.5vw, 20px)',
            fontFamily: 'system-ui, sans-serif',
            fontSize: 'clamp(6px, 1.1vw, 9px)',
            color: 'rgba(255,255,255,0.75)',
            lineHeight: 1.6,
            opacity: streamOpacity * (phase === 'enter' && enterProgress > 0.5 ? Math.max(0.1, 1 - (enterProgress - 0.5) * 4) : 1),
          }}
        >
          {streamedText}
          {showCursor && (
            <span
              style={{
                display: 'inline-block',
                width: 'clamp(1.5px, 0.3vw, 2px)',
                height: 'clamp(8px, 1.5vw, 12px)',
                background: color,
                marginLeft: 1,
                verticalAlign: 'middle',
              }}
            />
          )}
        </div>

        {/* Main word — the "answer" highlighted */}
        <div
          style={{
            position: 'absolute',
            bottom: '15%',
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
              textShadow: `0 0 20px ${color}44`,
              letterSpacing: -1,
            }}
          >
            {word}
          </div>
          <div
            style={{
              fontFamily: 'system-ui, sans-serif',
              fontSize: 'clamp(7px, 1.3vw, 10px)',
              color: 'rgba(255,255,255,0.35)',
              marginTop: 4,
              letterSpacing: 1,
            }}
          >
            Generated by AI
          </div>
        </div>
      </div>
    )
  },
}

function ChatGPTStreamComponent(props: MotionGraphicProps<ChatGPTStreamConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-chatgpt-stream',
  title: 'Kinetic ChatGPT Stream',
  description:
    'ChatGPT streaming response — tokens appear character by character with a blinking cursor, the response fades as the answer word bursts out highlighted',
  tags: ['kinetic', 'typography', 'chatgpt', 'ai', 'streaming', 'llm', 'openai', 'digital-native', 'tech-culture'],
  category: 'captions',
  component: ChatGPTStreamComponent as any,
  defaultConfig: {
    words: ['GENIUS', 'ANSWER', 'AI', 'SMART'],
    colors: ['#19c37d', '#1877F2', '#A259FF', '#FF9600'],
    bgColor: '#343541',
    cycleDuration: 2.5,
  },
  configSchema: [
    { key: 'words', label: 'Words', type: 'text-array', defaultValue: ['GENIUS', 'ANSWER', 'AI', 'SMART'], group: 'Content' },
    { key: 'colors', label: 'Colors', type: 'text-array', defaultValue: ['#19c37d', '#1877F2', '#A259FF', '#FF9600'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#343541', group: 'Style' },
    { key: 'cycleDuration', label: 'Cycle Duration (s)', type: 'number', defaultValue: 2.5, min: 0.5, max: 5, group: 'Timing' },
  ],
})
