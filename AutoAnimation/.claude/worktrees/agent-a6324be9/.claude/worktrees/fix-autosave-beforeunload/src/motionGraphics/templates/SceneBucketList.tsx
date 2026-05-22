import React from 'react'
import { registerMotionGraphic } from '../registry'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface SceneBucketListConfig {
  title: string
  items: { text: string; done: boolean }[]
  bgColor: string
  cardColor: string
  accentColor: string
  textColor: string
  doneColor: string
}

function easeOutCubic(t: number): number { return 1 - Math.pow(1 - t, 3) }
function easeInCubic(t: number): number { return t * t * t }
function easeOutBack(t: number): number {
  const c1 = 1.70158; const c3 = c1 + 1
  return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2)
}

function SceneBucketListComponent({ config, frame, durationInFrames }: MotionGraphicProps<SceneBucketListConfig>) {
  const { title, items, bgColor, cardColor, accentColor, textColor, doneColor } = config
  const progress = frame / durationInFrames

  const enterProgress = Math.min(1, progress / 0.25)
  const holdProgress = progress >= 0.25 && progress < 0.8 ? (progress - 0.25) / 0.55 : progress >= 0.8 ? 1 : 0
  const exitProgress = progress >= 0.8 ? (progress - 0.8) / 0.2 : 0

  const exitEased = easeInCubic(exitProgress)
  const exitOpacity = 1 - exitEased

  // Card fades in with scale
  const cardEnter = easeOutBack(Math.min(1, enterProgress / 0.4))

  // Title reveal
  const titleReveal = easeOutCubic(Math.max(0, Math.min(1, (enterProgress - 0.1) / 0.3)))

  // Progress bar
  const doneCount = items.filter(i => i.done).length
  const completionPct = items.length > 0 ? doneCount / items.length : 0
  const barReveal = easeOutCubic(Math.max(0, Math.min(1, (enterProgress - 0.2) / 0.3)))
  const barFill = easeOutCubic(Math.max(0, Math.min(1, (enterProgress - 0.35) / 0.4)))

  // Item stagger
  const getItemProgress = (idx: number) =>
    easeOutCubic(Math.max(0, Math.min(1, (enterProgress - 0.3 - idx * 0.06) / 0.3)))

  // During hold, unchecked items get a sparkle hint
  const sparkleIdx = holdProgress > 0 ? Math.floor(holdProgress * items.length * 2) % items.length : -1

  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        overflow: 'hidden',
        background: bgColor,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: "'Inter', 'Helvetica Neue', sans-serif",
      }}
    >
      {/* Background pattern — subtle diamond grid */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          backgroundImage: `radial-gradient(${accentColor}08 1px, transparent 1px)`,
          backgroundSize: '20px 20px',
        }}
      />

      <div
        style={{
          width: '85%',
          maxWidth: 420,
          background: cardColor,
          borderRadius: 'clamp(16px, 3vw, 28px)',
          padding: 'clamp(18px, 4vw, 36px)',
          boxShadow: '0 12px 40px rgba(0,0,0,0.12)',
          border: `1px solid ${accentColor}20`,
          transform: `scale(${cardEnter * (1 - exitEased * 0.12)})`,
          opacity: cardEnter * exitOpacity,
        }}
      >
        {/* Icon + Title */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 'clamp(6px, 1.2vw, 10px)',
            marginBottom: 'clamp(4px, 0.8vw, 8px)',
            opacity: titleReveal,
          }}
        >
          <div style={{ fontSize: 'clamp(22px, 5vw, 36px)' }}>{'🎯'}</div>
          <div style={{ fontSize: 'clamp(20px, 4.5vw, 32px)', fontWeight: 900, color: textColor }}>{title}</div>
        </div>

        {/* Progress bar */}
        <div
          style={{
            marginBottom: 'clamp(14px, 3vw, 24px)',
            opacity: barReveal,
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 'clamp(3px, 0.5vw, 6px)' }}>
            <span style={{ fontSize: 'clamp(9px, 1.3vw, 11px)', fontWeight: 600, color: `${textColor}77` }}>
              {doneCount}/{items.length} completed
            </span>
            <span style={{ fontSize: 'clamp(9px, 1.3vw, 11px)', fontWeight: 700, color: accentColor }}>
              {Math.round(completionPct * 100 * barFill)}%
            </span>
          </div>
          <div
            style={{
              width: '100%',
              height: 'clamp(4px, 0.8vw, 8px)',
              background: `${textColor}12`,
              borderRadius: 100,
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                width: `${completionPct * barFill * 100}%`,
                height: '100%',
                background: `linear-gradient(90deg, ${accentColor}, ${doneColor})`,
                borderRadius: 100,
              }}
            />
          </div>
        </div>

        {/* Items */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'clamp(6px, 1.2vw, 10px)' }}>
          {items.map((item, i) => {
            const ip = getItemProgress(i)
            const isSparkle = i === sparkleIdx && !item.done
            return (
              <div
                key={i}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 'clamp(8px, 1.5vw, 12px)',
                  padding: 'clamp(6px, 1vw, 10px) clamp(8px, 1.5vw, 14px)',
                  background: item.done ? `${doneColor}10` : isSparkle ? `${accentColor}08` : 'transparent',
                  borderRadius: 'clamp(6px, 1.2vw, 10px)',
                  border: `1px solid ${item.done ? `${doneColor}20` : isSparkle ? `${accentColor}20` : 'transparent'}`,
                  opacity: ip,
                  transform: `translateX(${(1 - ip) * 25}px)`,
                }}
              >
                {/* Check circle */}
                <div
                  style={{
                    width: 'clamp(16px, 2.5vw, 22px)',
                    height: 'clamp(16px, 2.5vw, 22px)',
                    borderRadius: '50%',
                    border: `2px solid ${item.done ? doneColor : `${textColor}30`}`,
                    background: item.done ? doneColor : 'transparent',
                    flexShrink: 0,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  {item.done && (
                    <span style={{ color: '#fff', fontSize: 'clamp(8px, 1.3vw, 12px)', fontWeight: 900 }}>{'✓'}</span>
                  )}
                </div>
                <span
                  style={{
                    fontSize: 'clamp(11px, 1.8vw, 15px)',
                    fontWeight: item.done ? 500 : 600,
                    color: item.done ? `${textColor}55` : textColor,
                    textDecoration: item.done ? 'line-through' : 'none',
                  }}
                >
                  {item.text}
                </span>
                {isSparkle && (
                  <span style={{ marginLeft: 'auto', fontSize: 'clamp(10px, 1.5vw, 14px)', opacity: 0.6 }}>{'✨'}</span>
                )}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

registerMotionGraphic({
  id: 'tpl-scene-bucket-list',
  title: 'Bucket List Tracker',
  description: 'Bucket list tracker with progress bar, checkable items, completion percentage, and sparkle hints on unchecked goals',
  tags: ['scene', 'bucket-list', 'goals', 'tracker', 'checklist', 'adventure', 'life'],
  category: 'scene-layout',
  component: SceneBucketListComponent as unknown as React.ComponentType<MotionGraphicProps>,
  defaultConfig: {
    title: 'Bucket List',
    items: [
      { text: 'See the Northern Lights', done: true },
      { text: 'Visit Tokyo', done: true },
      { text: 'Learn to surf', done: false },
      { text: 'Run a marathon', done: false },
      { text: 'Write a book', done: false },
    ],
    bgColor: '#0F1729',
    cardColor: '#1A2332',
    accentColor: '#F59E0B',
    textColor: '#F0F6FC',
    doneColor: '#22C55E',
  },
  configSchema: [
    { key: 'title', label: 'Title', type: 'text', defaultValue: 'Bucket List', group: 'Content' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#0F1729', group: 'Style' },
    { key: 'cardColor', label: 'Card Color', type: 'color', defaultValue: '#1A2332', group: 'Style' },
    { key: 'accentColor', label: 'Accent Color', type: 'color', defaultValue: '#F59E0B', group: 'Style' },
    { key: 'textColor', label: 'Text Color', type: 'color', defaultValue: '#F0F6FC', group: 'Style' },
    { key: 'doneColor', label: 'Done Color', type: 'color', defaultValue: '#22C55E', group: 'Style' },
  ],
})
