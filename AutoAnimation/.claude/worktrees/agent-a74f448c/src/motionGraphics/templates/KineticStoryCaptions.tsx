import { registerMotionGraphic } from '../registry'
import {
  KineticBase,
  type KineticBaseConfig,
  type KineticAnimation,
  type WordRenderProps,
  type BackgroundRenderProps,
} from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface StoryCaptionsConfig extends KineticBaseConfig {
  captionStyle: 'rounded' | 'pill' | 'underline'
  showTimestamp: boolean
}

const animation: KineticAnimation = {
  renderBackground: ({ bgColor }: BackgroundRenderProps) => (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        background: `linear-gradient(180deg, ${bgColor} 0%, ${bgColor}F0 50%, ${bgColor}CC 100%)`,
      }}
    />
  ),

  renderWord: ({
    word,
    color,
    enterProgress,
    holdProgress,
    exitProgress,
    phase,
    index,
    config,
    frame,
  }: WordRenderProps) => {
    const cfg = config as StoryCaptionsConfig
    const style = cfg?.captionStyle ?? 'rounded'
    const showTimestamp = cfg?.showTimestamp ?? true

    let opacity = 1
    let translateY = 0
    let scale = 1
    let bgOpacity = 0.85

    if (phase === 'enter') {
      // Instagram-style slide up + fade
      const t = enterProgress
      const eased = 1 - Math.pow(1 - t, 3)
      translateY = (1 - eased) * 40
      opacity = eased
      scale = 0.92 + eased * 0.08
      bgOpacity = eased * 0.85
    } else if (phase === 'hold') {
      // Subtle breathing
      scale = 1 + Math.sin(holdProgress * Math.PI * 3) * 0.01
    } else {
      // Slide up and fade out
      const t = exitProgress
      const eased = t * t
      translateY = -eased * 30
      opacity = 1 - eased
      scale = 1 - eased * 0.05
    }

    // Typing indicator dots during enter
    const showTyping = phase === 'enter' && enterProgress < 0.4
    const typingDots = showTyping ? (
      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          display: 'flex',
          gap: 6,
          opacity: 1 - enterProgress / 0.4,
        }}
      >
        {[0, 1, 2].map(d => {
          const dotPhase = ((frame ?? 0) * 0.1 + d * 0.3) % 1
          return (
            <div
              key={d}
              style={{
                width: 8,
                height: 8,
                borderRadius: '50%',
                background: color,
                opacity: 0.4 + Math.sin(dotPhase * Math.PI) * 0.6,
                transform: `translateY(${Math.sin(dotPhase * Math.PI) * -4}px)`,
              }}
            />
          )
        })}
      </div>
    ) : null

    const borderRadius = style === 'pill' ? 100 : style === 'rounded' ? 16 : 4
    const isUnderline = style === 'underline'

    // Progress bar along bottom (story-style timer)
    const progressWidth = phase === 'hold'
      ? holdProgress * 100
      : phase === 'enter' ? 0 : 100

    return (
      <div
        style={{
          position: 'absolute',
          bottom: '18%',
          left: '50%',
          transform: `translateX(-50%) translateY(${translateY}px) scale(${scale})`,
          opacity,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 8,
          width: '85%',
          maxWidth: 500,
        }}
      >
        {/* Username/timestamp row */}
        {showTimestamp && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              opacity: 0.6,
              fontSize: 'clamp(10px, 1.8vw, 14px)',
              color: '#FFFFFF',
              fontFamily: "'Helvetica Neue', Arial, sans-serif",
              fontWeight: 500,
            }}
          >
            <div
              style={{
                width: 20,
                height: 20,
                borderRadius: '50%',
                background: `linear-gradient(135deg, ${color}, ${color}80)`,
              }}
            />
            <span>creator</span>
            <span style={{ opacity: 0.5 }}>{'just now'}</span>
          </div>
        )}

        {/* Caption container */}
        <div
          style={{
            position: 'relative',
            background: isUnderline ? 'transparent' : `rgba(0,0,0,${bgOpacity})`,
            borderRadius: isUnderline ? 0 : borderRadius,
            padding: isUnderline
              ? 'clamp(8px, 1.5vh, 14px) 0'
              : 'clamp(12px, 2vh, 20px) clamp(16px, 3vw, 28px)',
            backdropFilter: isUnderline ? 'none' : 'blur(20px)',
            width: '100%',
            textAlign: 'center',
            borderBottom: isUnderline ? `3px solid ${color}` : 'none',
          }}
        >
          {typingDots}
          <div
            style={{
              fontFamily: "'Helvetica Neue', Arial, sans-serif",
              fontSize: 'clamp(20px, 5.5vw, 48px)',
              fontWeight: 800,
              color: '#FFFFFF',
              textShadow: isUnderline ? `0 2px 8px rgba(0,0,0,0.5)` : 'none',
              opacity: showTyping ? 0 : 1,
              letterSpacing: 1,
            }}
          >
            {word}
          </div>

          {/* Story progress bar */}
          {!isUnderline && (
            <div
              style={{
                position: 'absolute',
                bottom: 0,
                left: 0,
                right: 0,
                height: 3,
                borderRadius: '0 0 ' + borderRadius + 'px ' + borderRadius + 'px',
                overflow: 'hidden',
              }}
            >
              <div
                style={{
                  height: '100%',
                  width: `${progressWidth}%`,
                  background: `linear-gradient(90deg, ${color}, ${color}CC)`,
                  borderRadius: 2,
                }}
              />
            </div>
          )}
        </div>

        {/* Reaction emojis floating up during hold */}
        {phase === 'hold' && (
          <div style={{ position: 'relative', height: 0 }}>
            {['❤️', '🔥', '😍'].map((emoji, i) => {
              const emojiProgress = (holdProgress * 3 + i * 0.33) % 1
              return (
                <div
                  key={i}
                  style={{
                    position: 'absolute',
                    right: -30 - i * 15,
                    bottom: emojiProgress * 80,
                    fontSize: 16,
                    opacity: Math.sin(emojiProgress * Math.PI) * 0.7,
                    transform: `scale(${0.5 + Math.sin(emojiProgress * Math.PI) * 0.5})`,
                  }}
                >
                  {emoji}
                </div>
              )
            })}
          </div>
        )}
      </div>
    )
  },
}

function StoryCaptionsComponent(props: MotionGraphicProps<StoryCaptionsConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-story-captions',
  title: 'Kinetic Story Captions',
  description:
    'Instagram Story-style caption text with typing indicator, progress bar, floating reactions, and multiple caption styles (rounded/pill/underline).',
  tags: ['kinetic', 'typography', 'story', 'instagram', 'caption', 'social-media', 'reels'],
  category: 'captions',
  component: StoryCaptionsComponent as any,
  defaultConfig: {
    words: ['SWIPE UP', 'NEW POST', 'LINK BIO', 'FOLLOW'],
    colors: ['#E1306C', '#F77737', '#FCAF45', '#833AB4'],
    bgColor: '#1A1A2E',
    cycleDuration: 1.4,
    captionStyle: 'rounded' as const,
    showTimestamp: true,
  },
  configSchema: [
    { key: 'words', label: 'Words', type: 'text-array', defaultValue: ['SWIPE UP', 'NEW POST', 'LINK BIO', 'FOLLOW'], group: 'Content' },
    { key: 'colors', label: 'Colors', type: 'text-array', defaultValue: ['#E1306C', '#F77737', '#FCAF45', '#833AB4'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#1A1A2E', group: 'Style' },
    { key: 'captionStyle', label: 'Caption Style', type: 'select', defaultValue: 'rounded', options: ['rounded', 'pill', 'underline'], group: 'Style' },
    { key: 'showTimestamp', label: 'Show Timestamp', type: 'boolean', defaultValue: true, group: 'Content' },
    { key: 'cycleDuration', label: 'Cycle Duration (s)', type: 'number', defaultValue: 1.4, min: 0.3, max: 5, group: 'Timing' },
  ],
})
