import { registerMotionGraphic } from '../registry'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface EmojiPollConfig {
  bgColor: string
  barColor: string
  textColor: string
  title: string
  emojis: string[]
  labels: string[]
  percentages: string[]
}

function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3)
}

function easeOutBack(t: number): number {
  const c1 = 1.70158
  const c3 = c1 + 1
  return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2)
}

function bounceEase(t: number): number {
  if (t < 1 / 2.75) return 7.5625 * t * t
  if (t < 2 / 2.75) {
    t -= 1.5 / 2.75
    return 7.5625 * t * t + 0.75
  }
  if (t < 2.5 / 2.75) {
    t -= 2.25 / 2.75
    return 7.5625 * t * t + 0.9375
  }
  t -= 2.625 / 2.75
  return 7.5625 * t * t + 0.984375
}

function EmojiPollComponent({
  config,
  progress,
}: MotionGraphicProps<EmojiPollConfig>) {
  const { bgColor, barColor, textColor, title, emojis, labels, percentages } = config

  // Phase calculations
  const enterProgress = progress < 0.2 ? progress / 0.2 : 1
  const holdProgress = progress >= 0.2 && progress < 0.8 ? (progress - 0.2) / 0.6 : progress >= 0.8 ? 1 : 0
  const exitProgress = progress >= 0.8 ? (progress - 0.8) / 0.2 : 0

  const itemCount = Math.min(emojis.length, labels.length, percentages.length, 4)
  const numericPercentages = percentages.map((p) => parseInt(p.replace(/[^0-9]/g, ''), 10) || 0)

  // Title animation
  const titleOpacity = enterProgress < 1
    ? easeOutCubic(Math.min(1, enterProgress * 2))
    : exitProgress > 0
      ? 1 - easeOutCubic(exitProgress)
      : 1
  const titleY = enterProgress < 1
    ? -30 * (1 - easeOutCubic(enterProgress))
    : exitProgress > 0
      ? -30 * easeOutCubic(exitProgress)
      : 0

  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        overflow: 'hidden',
        background: bgColor,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '5%',
      }}
    >
      {/* Title */}
      <div
        style={{
          fontFamily: "'Fredoka One', 'Comic Sans MS', cursive, sans-serif",
          fontSize: 'clamp(18px, 5vw, 40px)',
          fontWeight: 700,
          color: textColor,
          marginBottom: 'clamp(16px, 4vw, 40px)',
          opacity: titleOpacity,
          transform: `translateY(${titleY}px)`,
          textAlign: 'center',
        }}
      >
        {title}
      </div>

      {/* Poll options */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: 'clamp(8px, 2vw, 20px)',
          width: '85%',
          maxWidth: '600px',
        }}
      >
        {Array.from({ length: itemCount }).map((_, i) => {
          const stagger = i * 0.12
          const itemEnter = enterProgress < 1
            ? Math.max(0, Math.min(1, (enterProgress - stagger) / (1 - stagger)))
            : 1
          const itemScale = bounceEase(Math.min(1, itemEnter))

          // Bar fill animation (delayed after emoji appears)
          const barDelay = 0.4
          const barFill = itemEnter < 1
            ? Math.max(0, (itemEnter - barDelay) / (1 - barDelay))
            : 1
          const fillWidth = numericPercentages[i] * easeOutCubic(barFill)

          // Hold: bars pulse subtly
          const holdPulse = holdProgress > 0
            ? 1 + Math.sin(holdProgress * Math.PI * 3 + i * 1.5) * 0.02
            : 1

          // Exit
          const exitScale = exitProgress > 0
            ? 1 - easeOutCubic(Math.max(0, (exitProgress - i * 0.08) / (1 - i * 0.08)))
            : 1

          // Displayed percentage (counts up)
          const displayPct = Math.floor(numericPercentages[i] * Math.min(1, barFill * 1.2))

          return (
            <div
              key={i}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 'clamp(8px, 2vw, 16px)',
                transform: `scale(${itemScale * exitScale})`,
                opacity: itemEnter * exitScale,
              }}
            >
              {/* Emoji */}
              <div
                style={{
                  fontSize: 'clamp(28px, 7vw, 56px)',
                  lineHeight: 1,
                  flexShrink: 0,
                  transform: `scale(${holdPulse})`,
                }}
              >
                {emojis[i]}
              </div>

              {/* Label and bar */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div
                  style={{
                    fontFamily: "'Inter', 'Helvetica Neue', sans-serif",
                    fontSize: 'clamp(12px, 3vw, 20px)',
                    fontWeight: 600,
                    color: textColor,
                    marginBottom: '4px',
                    display: 'flex',
                    justifyContent: 'space-between',
                  }}
                >
                  <span>{labels[i]}</span>
                  <span>{displayPct}%</span>
                </div>
                {/* Bar background */}
                <div
                  style={{
                    width: '100%',
                    height: 'clamp(8px, 2vw, 16px)',
                    borderRadius: '9999px',
                    background: 'rgba(255,255,255,0.15)',
                    overflow: 'hidden',
                  }}
                >
                  {/* Bar fill */}
                  <div
                    style={{
                      height: '100%',
                      width: `${fillWidth}%`,
                      borderRadius: '9999px',
                      background: barColor,
                      transform: `scaleX(${holdPulse})`,
                      transformOrigin: 'left center',
                      transition: 'none',
                    }}
                  />
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

registerMotionGraphic({
  id: 'tpl-scene-emoji-poll',
  title: 'Emoji Poll',
  description:
    'Emoji-based poll with large emojis, labels, and animated percentage bars. "Which one are you?" style.',
  tags: ['scene', 'emoji', 'poll', 'vote', 'interactive', 'fun', 'social'],
  category: 'scene-layout',
  component: EmojiPollComponent as any,
  defaultConfig: {
    bgColor: '#1a1a2e',
    barColor: '#FF6B9D',
    textColor: '#ffffff',
    title: 'Which one are you?',
    emojis: ['\u{1F525}', '\u{1F60E}', '\u{1F92F}', '\u{1F60D}'],
    labels: ['On Fire', 'Cool', 'Mind Blown', 'In Love'],
    percentages: ['42', '28', '18', '12'],
  },
  configSchema: [
    { key: 'title', label: 'Title', type: 'text', defaultValue: 'Which one are you?', group: 'Content' },
    {
      key: 'emojis',
      label: 'Emojis',
      type: 'text-array',
      defaultValue: ['\u{1F525}', '\u{1F60E}', '\u{1F92F}', '\u{1F60D}'],
      group: 'Content',
    },
    {
      key: 'labels',
      label: 'Labels',
      type: 'text-array',
      defaultValue: ['On Fire', 'Cool', 'Mind Blown', 'In Love'],
      group: 'Content',
    },
    {
      key: 'percentages',
      label: 'Percentages',
      type: 'text-array',
      defaultValue: ['42', '28', '18', '12'],
      group: 'Content',
    },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#1a1a2e', group: 'Style' },
    { key: 'barColor', label: 'Bar Color', type: 'color', defaultValue: '#FF6B9D', group: 'Style' },
    { key: 'textColor', label: 'Text Color', type: 'color', defaultValue: '#ffffff', group: 'Style' },
  ],
})
