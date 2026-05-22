import React from 'react'
import { registerMotionGraphic } from '../registry'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface SceneDailyHabitConfig {
  title: string
  habits: { name: string; icon: string; streak: number }[]
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

const DAYS = ['M', 'T', 'W', 'T', 'F', 'S', 'S']

function SceneDailyHabitComponent({ config, frame, durationInFrames }: MotionGraphicProps<SceneDailyHabitConfig>) {
  const { title, habits, bgColor, cardColor, accentColor, textColor, doneColor } = config
  const progress = frame / durationInFrames

  const enterProgress = Math.min(1, progress / 0.25)
  const holdProgress = progress >= 0.25 && progress < 0.8 ? (progress - 0.25) / 0.55 : progress >= 0.8 ? 1 : 0
  const exitProgress = progress >= 0.8 ? (progress - 0.8) / 0.2 : 0

  const exitEased = easeInCubic(exitProgress)
  const exitOpacity = 1 - exitEased

  // Card entrance
  const cardEnter = easeOutCubic(Math.min(1, enterProgress / 0.35))
  const cardScale = 0.85 + cardEnter * 0.15

  // Title
  const titleReveal = easeOutCubic(Math.max(0, Math.min(1, (enterProgress - 0.1) / 0.3)))

  // Day headers
  const dayHeaderReveal = easeOutCubic(Math.max(0, Math.min(1, (enterProgress - 0.2) / 0.25)))

  // Each habit row staggers
  const getHabitRowProgress = (idx: number) =>
    easeOutCubic(Math.max(0, Math.min(1, (enterProgress - 0.25 - idx * 0.08) / 0.3)))

  // During hold, cells fill in sequentially
  const totalCells = habits.length * 7
  const filledCells = holdProgress > 0 ? Math.floor(holdProgress * totalCells * 1.3) : 0

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
      <div
        style={{
          width: '90%',
          maxWidth: 440,
          background: cardColor,
          borderRadius: 'clamp(14px, 2.5vw, 22px)',
          padding: 'clamp(16px, 3.5vw, 32px)',
          boxShadow: '0 10px 36px rgba(0,0,0,0.1)',
          border: `1px solid ${accentColor}15`,
          transform: `scale(${cardScale * (1 - exitEased * 0.1)})`,
          opacity: cardEnter * exitOpacity,
        }}
      >
        {/* Header */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: 'clamp(14px, 3vw, 24px)',
            opacity: titleReveal,
          }}
        >
          <div>
            <div style={{ fontSize: 'clamp(18px, 4vw, 28px)', fontWeight: 900, color: textColor }}>{title}</div>
            <div style={{ fontSize: 'clamp(9px, 1.4vw, 12px)', color: `${textColor}66`, fontWeight: 500 }}>This Week</div>
          </div>
          <div style={{ fontSize: 'clamp(20px, 4vw, 32px)' }}>{'📊'}</div>
        </div>

        {/* Day header row */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr repeat(7, 1fr)',
            gap: 'clamp(2px, 0.5vw, 4px)',
            marginBottom: 'clamp(4px, 0.8vw, 8px)',
            opacity: dayHeaderReveal,
          }}
        >
          <div />
          {DAYS.map((day, i) => (
            <div
              key={i}
              style={{
                fontSize: 'clamp(8px, 1.2vw, 10px)',
                fontWeight: 700,
                color: `${textColor}55`,
                textAlign: 'center',
                textTransform: 'uppercase',
              }}
            >
              {day}
            </div>
          ))}
        </div>

        {/* Habit grid rows */}
        {habits.map((habit, hi) => {
          const rowProgress = getHabitRowProgress(hi)
          return (
            <div
              key={hi}
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr repeat(7, 1fr)',
                gap: 'clamp(2px, 0.5vw, 4px)',
                alignItems: 'center',
                marginBottom: 'clamp(6px, 1.2vw, 10px)',
                opacity: rowProgress,
                transform: `translateX(${(1 - rowProgress) * 20}px)`,
              }}
            >
              {/* Habit label */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 'clamp(2px, 0.4vw, 4px)',
                  minWidth: 0,
                }}
              >
                <span style={{ fontSize: 'clamp(10px, 1.8vw, 14px)', flexShrink: 0 }}>{habit.icon}</span>
                <span
                  style={{
                    fontSize: 'clamp(8px, 1.3vw, 11px)',
                    fontWeight: 600,
                    color: textColor,
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                  }}
                >
                  {habit.name}
                </span>
              </div>

              {/* Day cells */}
              {DAYS.map((_, di) => {
                const cellIdx = hi * 7 + di
                const isFilled = di < habit.streak
                const isAnimating = cellIdx < filledCells && isFilled

                return (
                  <div
                    key={di}
                    style={{
                      width: '100%',
                      aspectRatio: '1',
                      borderRadius: 'clamp(3px, 0.5vw, 5px)',
                      background: isAnimating
                        ? doneColor
                        : isFilled
                          ? `${doneColor}30`
                          : `${textColor}08`,
                      border: `1px solid ${isAnimating ? doneColor : isFilled ? `${doneColor}40` : `${textColor}10`}`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      transition: 'none',
                    }}
                  >
                    {isAnimating && (
                      <span style={{ fontSize: 'clamp(6px, 1vw, 9px)', color: '#fff', fontWeight: 900 }}>{'✓'}</span>
                    )}
                  </div>
                )
              })}
            </div>
          )
        })}

        {/* Streak summary */}
        <div
          style={{
            marginTop: 'clamp(8px, 1.5vw, 14px)',
            paddingTop: 'clamp(8px, 1.5vw, 14px)',
            borderTop: `1px solid ${accentColor}15`,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            opacity: easeOutCubic(Math.max(0, Math.min(1, (enterProgress - 0.7) / 0.25))),
          }}
        >
          <div style={{ fontSize: 'clamp(9px, 1.4vw, 12px)', fontWeight: 600, color: `${textColor}77` }}>
            Total Completions
          </div>
          <div
            style={{
              fontSize: 'clamp(14px, 2.5vw, 20px)',
              fontWeight: 900,
              color: accentColor,
              fontVariantNumeric: 'tabular-nums',
            }}
          >
            {habits.reduce((sum, h) => sum + h.streak, 0)}/{habits.length * 7}
          </div>
        </div>
      </div>
    </div>
  )
}

registerMotionGraphic({
  id: 'tpl-scene-daily-habit',
  title: 'Daily Habit Tracker',
  description: 'Weekly habit tracker grid with animated checkmarks, streak dots, habit icons, and completion summary',
  tags: ['scene', 'habit', 'tracker', 'daily', 'routine', 'grid', 'productivity', 'health'],
  category: 'scene-layout',
  component: SceneDailyHabitComponent as unknown as React.ComponentType<MotionGraphicProps>,
  defaultConfig: {
    title: 'Habit Tracker',
    habits: [
      { name: 'Meditate', icon: '🧘', streak: 5 },
      { name: 'Exercise', icon: '💪', streak: 4 },
      { name: 'Read', icon: '📖', streak: 6 },
      { name: 'Hydrate', icon: '💧', streak: 7 },
      { name: 'Journal', icon: '📝', streak: 3 },
    ],
    bgColor: '#F8FAFC',
    cardColor: '#FFFFFF',
    accentColor: '#6366F1',
    textColor: '#1E293B',
    doneColor: '#22C55E',
  },
  configSchema: [
    { key: 'title', label: 'Title', type: 'text', defaultValue: 'Habit Tracker', group: 'Content' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#F8FAFC', group: 'Style' },
    { key: 'cardColor', label: 'Card Color', type: 'color', defaultValue: '#FFFFFF', group: 'Style' },
    { key: 'accentColor', label: 'Accent Color', type: 'color', defaultValue: '#6366F1', group: 'Style' },
    { key: 'textColor', label: 'Text Color', type: 'color', defaultValue: '#1E293B', group: 'Style' },
    { key: 'doneColor', label: 'Done Color', type: 'color', defaultValue: '#22C55E', group: 'Style' },
  ],
})
