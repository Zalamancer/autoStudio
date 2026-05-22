import { registerMotionGraphic } from '../registry'
import {
  KineticBase,
  type KineticBaseConfig,
  type KineticAnimation,
  type WordRenderProps,
  type BackgroundRenderProps,
} from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface ContextOverflowConfig extends KineticBaseConfig {}

function rand(s: number): number {
  const x = Math.sin(s * 127.1 + 311.7) * 43758.5453
  return x - Math.floor(x)
}

// Context window overflow: when prompt exceeds max tokens
// Oldest tokens get truncated — text "falls off" the left side of the context window
// The visible window scrolls right, losing early context

const CONTEXT_LABELS = [
  '43,891 / 128k tokens',
  '89,234 / 128k tokens',
  '112,847 / 128k tokens',
  '127,999 / 128k tokens',
  'CONTEXT LIMIT REACHED',
]

const animation: KineticAnimation = {
  renderBackground: ({ bgColor, frame, fps, width }: BackgroundRenderProps) => {
    const time = frame / fps
    const w = width ?? 400

    // Context window bar — filling up from left
    const fillProgress = Math.min(1, (time % 8) / 6)
    const overflowed = fillProgress > 0.95

    const labelIdx = Math.min(4, Math.floor(fillProgress * 5))

    return (
      <div style={{ position: 'absolute', inset: 0, background: bgColor }}>
        {/* Context fill bar */}
        <div
          style={{
            position: 'absolute',
            top: 8,
            left: 10,
            right: 10,
            height: 4,
            background: 'rgba(255,255,255,0.06)',
            borderRadius: 2,
          }}
        >
          <div
            style={{
              height: '100%',
              width: `${fillProgress * 100}%`,
              background: overflowed ? '#FF4444' : fillProgress > 0.8 ? '#FFAA00' : '#44AAFF',
              borderRadius: 2,
              transition: 'background 0.3s',
            }}
          />
          {/* Truncation marker */}
          {overflowed && (
            <div
              style={{
                position: 'absolute',
                left: `${(fillProgress - 0.1) * 100}%`,
                top: -2,
                bottom: -2,
                width: 1,
                background: 'rgba(255,60,60,0.8)',
              }}
            />
          )}
        </div>
        {/* Token count */}
        <div
          style={{
            position: 'absolute',
            top: 16,
            left: 10,
            fontFamily: "'Courier New', monospace",
            fontSize: 8,
            color: overflowed ? 'rgba(255,60,60,0.5)' : 'rgba(100,180,255,0.3)',
            letterSpacing: 0.5,
          }}
        >
          {CONTEXT_LABELS[labelIdx]}
        </div>
        {/* Truncation notice */}
        {overflowed && (
          <div
            style={{
              position: 'absolute',
              top: 26,
              left: 10,
              fontFamily: "'Courier New', monospace",
              fontSize: 7,
              color: 'rgba(255,60,60,0.3)',
            }}
          >
            ← truncating oldest tokens
          </div>
        )}
        {/* Rolling context tokens in background */}
        {Array.from({ length: 10 }, (_, i) => {
          const x = ((time * 20 + i * 47) % (w + 100)) - 50
          const tokenId = Math.floor(rand(i * 13 + Math.floor(time * 0.5)) * 99999)
          return (
            <div
              key={i}
              style={{
                position: 'absolute',
                left: x,
                bottom: 8 + (i % 3) * 10,
                fontFamily: "'Courier New', monospace",
                fontSize: 7,
                color: 'rgba(100,180,255,0.08)',
                whiteSpace: 'nowrap',
              }}
            >
              tok_{tokenId}
            </div>
          )
        })}
      </div>
    )
  },

  renderWord: ({ word, color, enterProgress, holdProgress, exitProgress, phase, width }: WordRenderProps) => {
    const chars = word.split('')
    const w = width ?? 400

    // Context overflow: text enters from right (new tokens)
    // On overflow: leftmost chars get "truncated" (fall off left edge)

    if (phase === 'enter') {
      // New tokens entering from right side of context window
      return (
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: `translate(calc(-50% + ${(1 - enterProgress) * w * 0.3}px), -50%)`,
            fontFamily: "'Courier New', monospace",
            fontSize: 'clamp(36px, 10vw, 150px)',
            fontWeight: 700,
            whiteSpace: 'nowrap',
            letterSpacing: 3,
            color,
            opacity: enterProgress,
            // Clip from left: tokens emerge from right edge of window
            WebkitMaskImage: `linear-gradient(to right, transparent 0%, ${color} ${Math.max(0, (enterProgress - 0.3) * 100)}%, ${color} 100%)`,
          }}
        >
          {word}
        </div>
      )
    }

    if (phase === 'hold') {
      // Context overflow event: chars start getting truncated from left
      const overflowMoment = holdProgress > 0.5 && holdProgress < 0.65
      const truncatedChars = overflowMoment ? Math.floor(((holdProgress - 0.5) / 0.15) * chars.length * 0.4) : 0

      return (
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            fontFamily: "'Courier New', monospace",
            fontSize: 'clamp(36px, 10vw, 150px)',
            fontWeight: 700,
            whiteSpace: 'nowrap',
            letterSpacing: 3,
            display: 'flex',
          }}
        >
          {chars.map((ch, ci) => {
            const truncated = ci < truncatedChars
            return (
              <span
                key={ci}
                style={{
                  display: 'inline-block',
                  color: truncated ? 'transparent' : color,
                  textShadow: truncated ? 'none' : `0 0 6px ${color}40`,
                  opacity: truncated ? 0 : 1,
                  transform: truncated ? 'translateX(-10px)' : 'none',
                  transition: 'none',
                }}
              >
                {ch}
              </span>
            )
          })}
        </div>
      )
    }

    // Exit: full truncation — tokens fall off left edge
    return (
      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: `translate(calc(-50% - ${exitProgress * w * 0.2}px), -50%)`,
          fontFamily: "'Courier New', monospace",
          fontSize: 'clamp(36px, 10vw, 150px)',
          fontWeight: 700,
          whiteSpace: 'nowrap',
          letterSpacing: 3,
          color,
          opacity: 1 - exitProgress,
          WebkitMaskImage: `linear-gradient(to right, transparent ${exitProgress * 40}%, ${color} ${exitProgress * 40 + 20}%)`,
        }}
      >
        {word}
      </div>
    )
  },
}

function ContextOverflowComponent(props: MotionGraphicProps<ContextOverflowConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-context-overflow',
  title: 'Kinetic Context Overflow',
  description:
    'LLM context window overflow — text enters as new tokens from the right while oldest tokens get truncated and fall off the left, with 128k token fill bar',
  tags: ['kinetic', 'typography', 'ai', 'context', 'llm', 'overflow', 'token', 'truncate', 'digital', 'ml'],
  category: 'captions',
  component: ContextOverflowComponent as any,
  defaultConfig: {
    words: ['CONTEXT', 'OVERFLOW', 'TRUNCATE', 'FORGET'],
    colors: ['#44AAFF', '#2288EE', '#55BBFF', '#3399FF'],
    bgColor: '#000a18',
    cycleDuration: 1.5,
  },
  configSchema: [
    {
      key: 'words',
      label: 'Words',
      type: 'text-array',
      defaultValue: ['CONTEXT', 'OVERFLOW', 'TRUNCATE', 'FORGET'],
      group: 'Content',
    },
    {
      key: 'colors',
      label: 'Colors',
      type: 'text-array',
      defaultValue: ['#44AAFF', '#2288EE', '#55BBFF', '#3399FF'],
      group: 'Style',
    },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#000a18', group: 'Style' },
    {
      key: 'cycleDuration',
      label: 'Cycle Duration (s)',
      type: 'number',
      defaultValue: 1.5,
      min: 0.3,
      max: 5,
      group: 'Timing',
    },
  ],
})
