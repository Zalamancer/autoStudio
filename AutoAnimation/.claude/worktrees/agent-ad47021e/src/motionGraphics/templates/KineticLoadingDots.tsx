import { registerMotionGraphic } from '../registry'
import { KineticBase, type KineticBaseConfig, type KineticAnimation, type WordRenderProps, type BackgroundRenderProps } from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface LoadingDotsConfig extends KineticBaseConfig {}

const animation: KineticAnimation = {
  renderBackground: ({ bgColor }: BackgroundRenderProps) => {
    return (
      <div style={{ position: 'absolute', inset: 0, background: bgColor }}>
        {/* Chat app header bar */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: '8%',
            background: 'rgba(0,0,0,0.06)',
            display: 'flex',
            alignItems: 'center',
            padding: '0 4%',
            gap: '2%',
          }}
        >
          {/* Back arrow */}
          <div
            style={{
              width: 0,
              height: 0,
              borderTop: '5px solid transparent',
              borderBottom: '5px solid transparent',
              borderRight: '8px solid rgba(0,0,0,0.2)',
            }}
          />
          {/* Avatar circle */}
          <div
            style={{
              width: 'clamp(20px, 4vw, 32px)',
              height: 'clamp(20px, 4vw, 32px)',
              borderRadius: '50%',
              background: 'rgba(0,0,0,0.08)',
            }}
          />
          {/* Name placeholder */}
          <div
            style={{
              width: 'clamp(50px, 12vw, 80px)',
              height: 'clamp(8px, 1.5vw, 12px)',
              borderRadius: 4,
              background: 'rgba(0,0,0,0.06)',
            }}
          />
        </div>
        {/* Message input bar at bottom */}
        <div
          style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            height: '7%',
            background: 'rgba(0,0,0,0.04)',
            display: 'flex',
            alignItems: 'center',
            padding: '0 4%',
          }}
        >
          <div
            style={{
              flex: 1,
              height: '60%',
              borderRadius: 20,
              border: '1px solid rgba(0,0,0,0.08)',
              background: 'rgba(255,255,255,0.5)',
            }}
          />
        </div>
      </div>
    )
  },

  renderWord: ({ word, color, enterProgress, holdProgress, exitProgress, phase, frame }: WordRenderProps) => {
    const f = frame ?? 0
    const totalChars = word.length

    let displayText = ''
    let dotCount = 0
    let bubbleOpacity = 1
    let bubbleScale = 1

    if (phase === 'enter') {
      // Text types in character by character
      const charsToShow = Math.floor(enterProgress * (totalChars + 1))
      displayText = word.substring(0, Math.min(charsToShow, totalChars))
      // Animated dots during typing
      dotCount = Math.floor(f * 0.12) % 4
      bubbleScale = 0.85 + enterProgress * 0.15
      bubbleOpacity = 0.3 + enterProgress * 0.7
    } else if (phase === 'hold') {
      displayText = word
      // Gentle bounce dots
      dotCount = Math.floor(f * 0.08) % 4
      bubbleOpacity = 1
      bubbleScale = 1
    } else {
      displayText = word
      dotCount = 0
      bubbleOpacity = 1 - exitProgress
      bubbleScale = 1 - exitProgress * 0.15
    }

    const dots = '.'.repeat(dotCount)
    const showCursor = phase === 'enter' && enterProgress < 1

    // Three bouncing dots indicator (separate from text dots)
    const showTypingIndicator = phase === 'enter' && enterProgress < 0.4
    const typingDots = [0, 1, 2].map((i) => {
      const bounce = Math.sin((f * 0.15) + i * 1.2)
      return (
        <div
          key={i}
          style={{
            width: 'clamp(6px, 1.2vw, 10px)',
            height: 'clamp(6px, 1.2vw, 10px)',
            borderRadius: '50%',
            background: `${color}88`,
            transform: `translateY(${bounce * 4}px)`,
          }}
        />
      )
    })

    return (
      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: `translate(-50%, -50%) scale(${bubbleScale})`,
          opacity: bubbleOpacity,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'flex-start',
          gap: 'clamp(8px, 1.5vw, 16px)',
          maxWidth: '80%',
        }}
      >
        {/* Typing indicator bubble */}
        {showTypingIndicator && (
          <div
            style={{
              display: 'flex',
              gap: 'clamp(3px, 0.6vw, 6px)',
              padding: 'clamp(8px, 2vw, 16px) clamp(14px, 3vw, 24px)',
              background: 'rgba(0,0,0,0.06)',
              borderRadius: 'clamp(14px, 3vw, 22px)',
              borderBottomLeftRadius: 4,
              opacity: 1 - enterProgress / 0.4,
            }}
          >
            {typingDots}
          </div>
        )}

        {/* Main message bubble */}
        <div
          style={{
            padding: 'clamp(12px, 2.5vw, 20px) clamp(16px, 3.5vw, 28px)',
            background: color,
            borderRadius: 'clamp(16px, 3vw, 24px)',
            borderBottomLeftRadius: 4,
            boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
            maxWidth: '100%',
          }}
        >
          <div
            style={{
              fontFamily: "'Inter', '-apple-system', 'Segoe UI', sans-serif",
              fontSize: 'clamp(28px, 7vw, 80px)',
              fontWeight: 600,
              color: '#FFFFFF',
              whiteSpace: 'nowrap',
              lineHeight: 1.3,
            }}
          >
            {displayText}
            <span style={{ opacity: 0.5 }}>{dots}</span>
            {showCursor && (
              <span
                style={{
                  display: 'inline-block',
                  width: 'clamp(2px, 0.5vw, 4px)',
                  height: '0.85em',
                  background: '#FFFFFF',
                  marginLeft: 2,
                  verticalAlign: 'baseline',
                  opacity: Math.sin(f * 0.2) > 0 ? 1 : 0,
                }}
              />
            )}
          </div>
        </div>

        {/* Timestamp */}
        <div
          style={{
            fontFamily: "'Inter', sans-serif",
            fontSize: 'clamp(9px, 1.5vw, 13px)',
            color: 'rgba(0,0,0,0.3)',
            paddingLeft: 'clamp(4px, 1vw, 8px)',
            opacity: phase === 'hold' ? 1 : phase === 'enter' ? enterProgress : 1 - exitProgress,
          }}
        >
          just now
        </div>
      </div>
    )
  },
}

function LoadingDotsComponent(props: MotionGraphicProps<LoadingDotsConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-loading-dots',
  title: 'Kinetic Loading Dots',
  description: 'Chat-bubble style text typing with animated loading dots, bouncing typing indicator, and message bubble appearance',
  tags: ['kinetic', 'typography', 'chat', 'loading', 'typing', 'message', 'internet', 'texting'],
  category: 'captions',
  component: LoadingDotsComponent as any,
  defaultConfig: {
    words: ['hello', 'how are you', 'good vibes', 'lets go'],
    colors: ['#0084FF', '#0084FF', '#0084FF', '#0084FF'],
    bgColor: '#FFFFFF',
    cycleDuration: 1.5,
  },
  configSchema: [
    { key: 'words', label: 'Words', type: 'text-array', defaultValue: ['hello', 'how are you', 'good vibes', 'lets go'], group: 'Content' },
    { key: 'colors', label: 'Bubble Color', type: 'text-array', defaultValue: ['#0084FF'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#FFFFFF', group: 'Style' },
    { key: 'cycleDuration', label: 'Cycle Duration (s)', type: 'number', defaultValue: 1.5, min: 0.5, max: 5, group: 'Timing' },
  ],
})
