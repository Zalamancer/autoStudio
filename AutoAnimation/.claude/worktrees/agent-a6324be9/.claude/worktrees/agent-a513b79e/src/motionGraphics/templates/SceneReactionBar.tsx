import { registerMotionGraphic } from '../registry'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface ReactionBarConfig {
  bgColor: string
  barColor: string
  textColor: string
  reactions: string[]
  counts: string[]
}

function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3)
}

function easeOutBack(t: number): number {
  const c1 = 1.70158
  const c3 = c1 + 1
  return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2)
}

function ReactionBarComponent({ config, progress, frame, fps }: MotionGraphicProps<ReactionBarConfig>) {
  const { bgColor, barColor, textColor, reactions, counts } = config

  // Phase calculations
  const enterProgress = progress < 0.2 ? progress / 0.2 : 1
  const holdProgress = progress >= 0.2 && progress < 0.8 ? (progress - 0.2) / 0.6 : progress >= 0.8 ? 1 : 0
  const exitProgress = progress >= 0.8 ? (progress - 0.8) / 0.2 : 0

  const reactionCount = Math.min(reactions.length, counts.length)

  // Find dominant reaction (highest count)
  const numericCounts = counts.map((c) => parseInt(c.replace(/[^0-9]/g, ''), 10) || 0)
  const maxCount = Math.max(...numericCounts)
  const dominantIndex = numericCounts.indexOf(maxCount)

  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        overflow: 'hidden',
        display: 'flex',
        alignItems: 'flex-end',
        justifyContent: 'center',
        paddingBottom: '8%',
      }}
    >
      {/* Bar container */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 'clamp(8px, 2vw, 24px)',
          padding: 'clamp(8px, 2vw, 20px) clamp(16px, 4vw, 40px)',
          borderRadius: '9999px',
          background: barColor,
          backdropFilter: 'blur(12px)',
          boxShadow: '0 4px 24px rgba(0,0,0,0.3)',
          transform: `translateY(${exitProgress > 0 ? 120 * easeOutCubic(exitProgress) : 0}px)`,
          opacity: exitProgress > 0 ? 1 - exitProgress : 1,
        }}
      >
        {Array.from({ length: reactionCount }).map((_, i) => {
          // Staggered entrance
          const staggerDelay = i * 0.15
          const itemEnter =
            enterProgress < 1 ? Math.max(0, Math.min(1, (enterProgress - staggerDelay) / (1 - staggerDelay))) : 1
          const itemScale = easeOutBack(Math.min(1, itemEnter))

          // Dominant emoji grows during hold
          const isDominant = i === dominantIndex
          const holdScale = isDominant && holdProgress > 0 ? 1 + Math.sin(holdProgress * Math.PI * 2) * 0.15 : 1

          // Counter animation
          const targetCount = numericCounts[i]
          const displayCount = Math.floor(targetCount * Math.min(1, itemEnter * 1.5))

          // Exit: fly upward staggered
          const exitOffset = exitProgress > 0 ? -(60 + i * 15) * easeOutCubic(exitProgress) : 0

          return (
            <div
              key={i}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '4px',
                transform: `scale(${itemScale * holdScale}) translateY(${exitOffset}px)`,
                opacity: itemEnter,
              }}
            >
              <div
                style={{
                  fontSize: 'clamp(24px, 6vw, 48px)',
                  lineHeight: 1,
                  filter: isDominant && holdProgress > 0 ? 'drop-shadow(0 0 8px rgba(255,200,0,0.6))' : 'none',
                }}
              >
                {reactions[i]}
              </div>
              <div
                style={{
                  fontFamily: "'Inter', 'Helvetica Neue', sans-serif",
                  fontSize: 'clamp(10px, 2.5vw, 18px)',
                  fontWeight: 700,
                  color: textColor,
                  opacity: 0.9,
                }}
              >
                {displayCount.toLocaleString()}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

registerMotionGraphic({
  id: 'tpl-scene-reaction-bar',
  title: 'Reaction Bar',
  description: 'Social reaction bar with emoji reactions and animated counters. Facebook/TikTok reactions style.',
  tags: ['scene', 'emoji', 'reaction', 'social', 'counter', 'bar', 'fun'],
  category: 'scene-layout',
  component: ReactionBarComponent as any,
  defaultConfig: {
    bgColor: 'transparent',
    barColor: 'rgba(0,0,0,0.6)',
    textColor: '#ffffff',
    reactions: ['\u{1F44D}', '\u2764\uFE0F', '\u{1F602}', '\u{1F632}', '\u{1F622}'],
    counts: ['1200', '890', '456', '234', '78'],
  },
  configSchema: [
    {
      key: 'reactions',
      label: 'Reaction Emojis',
      type: 'text-array',
      defaultValue: ['\u{1F44D}', '\u2764\uFE0F', '\u{1F602}', '\u{1F632}', '\u{1F622}'],
      group: 'Content',
    },
    {
      key: 'counts',
      label: 'Counts',
      type: 'text-array',
      defaultValue: ['1200', '890', '456', '234', '78'],
      group: 'Content',
    },
    { key: 'barColor', label: 'Bar Color', type: 'color', defaultValue: 'rgba(0,0,0,0.6)', group: 'Style' },
    { key: 'textColor', label: 'Text Color', type: 'color', defaultValue: '#ffffff', group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: 'transparent', group: 'Style' },
  ],
})
