import React from 'react'
import { registerMotionGraphic } from '../registry'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface DailyRoutineConfig {
  title: string
  timeSlots: string[]
  activities: string[]
  bgColor: string
  accentColor: string
  textColor: string
  cardColor: string
}

function easeOutCubic(t: number): number { return 1 - Math.pow(1 - t, 3) }
function easeInCubic(t: number): number { return t * t * t }
function easeOutBack(t: number): number {
  const c1 = 1.70158
  const c3 = c1 + 1
  return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2)
}

function SceneDailyRoutineComponent({ config, progress }: MotionGraphicProps<DailyRoutineConfig>) {
  const { title, timeSlots, activities, bgColor, accentColor, textColor, cardColor } = config
  const count = Math.min(timeSlots.length, activities.length)

  // Title: 0-0.15
  const titleEnter = easeOutCubic(Math.min(1, progress / 0.15))
  const exitProgress = progress >= 0.85 ? (progress - 0.85) / 0.15 : 0
  const exitEased = easeInCubic(exitProgress)
  const exitOpacity = exitProgress > 0 ? 1 - exitEased : 1

  // Clock icon scale
  const clockScale = easeOutBack(Math.min(1, progress / 0.2))

  // Each slot staggers in
  const getSlotProgress = (index: number): number => {
    const slotStart = 0.1 + (index / count) * 0.5
    const slotDur = 0.15
    return easeOutCubic(Math.max(0, Math.min(1, (progress - slotStart) / slotDur)))
  }

  // Timeline line draws
  const lineProgress = easeOutCubic(Math.max(0, Math.min(1, (progress - 0.08) / 0.55)))

  return (
    <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', background: bgColor, fontFamily: "'Inter', 'Helvetica Neue', sans-serif" }}>
      <div
        style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          padding: '6% 8%',
          opacity: exitOpacity,
          transform: `translateY(${exitEased * 40}px)`,
        }}
      >
        {/* Clock icon + Title */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 'clamp(8px, 1.5vw, 16px)', marginBottom: 'clamp(16px, 3vh, 32px)' }}>
          {/* Clock icon (SVG) */}
          <svg
            viewBox="0 0 24 24"
            style={{
              width: 'clamp(24px, 4vw, 44px)',
              height: 'clamp(24px, 4vw, 44px)',
              transform: `scale(${clockScale})`,
            }}
          >
            <circle cx="12" cy="12" r="10" fill="none" stroke={accentColor} strokeWidth="2" />
            <line x1="12" y1="12" x2="12" y2="7" stroke={accentColor} strokeWidth="2" strokeLinecap="round" />
            <line x1="12" y1="12" x2="16" y2="12" stroke={accentColor} strokeWidth="2" strokeLinecap="round" />
          </svg>
          <div
            style={{
              fontSize: 'clamp(18px, 4vw, 36px)',
              fontWeight: 800,
              color: textColor,
              textTransform: 'uppercase',
              letterSpacing: '0.06em',
              opacity: titleEnter,
              transform: `translateX(${(1 - titleEnter) * 20}px)`,
            }}
          >
            {title}
          </div>
        </div>

        {/* Timeline */}
        <div style={{ position: 'relative', width: '100%', maxWidth: 460, flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          {/* Vertical line */}
          <div
            style={{
              position: 'absolute',
              left: 'clamp(32px, 6vw, 56px)',
              top: 0,
              bottom: 0,
              width: 2,
              background: `${accentColor}20`,
            }}
          />
          <div
            style={{
              position: 'absolute',
              left: 'clamp(32px, 6vw, 56px)',
              top: 0,
              width: 2,
              height: `${lineProgress * 100}%`,
              background: accentColor,
            }}
          />

          {/* Time slots */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'clamp(12px, 2.5vh, 28px)' }}>
            {Array.from({ length: count }).map((_, i) => {
              const slotProg = getSlotProgress(i)
              return (
                <div
                  key={i}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 'clamp(12px, 2vw, 20px)',
                    opacity: slotProg,
                    transform: `translateX(${(1 - slotProg) * 30}px)`,
                  }}
                >
                  {/* Time label */}
                  <div
                    style={{
                      minWidth: 'clamp(48px, 10vw, 80px)',
                      fontSize: 'clamp(11px, 2vw, 16px)',
                      fontWeight: 700,
                      color: accentColor,
                      textAlign: 'right',
                      fontVariantNumeric: 'tabular-nums',
                    }}
                  >
                    {timeSlots[i]}
                  </div>

                  {/* Dot on line */}
                  <div
                    style={{
                      width: 'clamp(10px, 1.8vw, 16px)',
                      height: 'clamp(10px, 1.8vw, 16px)',
                      borderRadius: '50%',
                      background: accentColor,
                      boxShadow: `0 0 8px ${accentColor}60`,
                      transform: `scale(${easeOutBack(slotProg)})`,
                      flexShrink: 0,
                    }}
                  />

                  {/* Activity card */}
                  <div
                    style={{
                      background: cardColor,
                      borderRadius: 'clamp(6px, 1vw, 12px)',
                      padding: 'clamp(8px, 1.5vh, 14px) clamp(12px, 2vw, 20px)',
                      fontSize: 'clamp(12px, 2.2vw, 18px)',
                      fontWeight: 500,
                      color: textColor,
                      boxShadow: `0 2px 12px rgba(0,0,0,0.1)`,
                      flex: 1,
                    }}
                  >
                    {activities[i]}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}

registerMotionGraphic({
  id: 'tpl-scene-daily-routine',
  title: 'Daily Routine',
  description: 'Morning/evening routine timeline with clock icon, time slots, and staggered card reveal',
  tags: ['scene', 'lifestyle', 'routine', 'timeline', 'schedule', 'personal'],
  category: 'scene-layout',
  component: SceneDailyRoutineComponent as any,
  defaultConfig: {
    title: 'My Morning Routine',
    timeSlots: ['6:00 AM', '6:30 AM', '7:00 AM', '7:30 AM', '8:00 AM'],
    activities: ['Wake up & meditate', 'Workout session', 'Healthy breakfast', 'Journaling', 'Start the day'],
    bgColor: '#0f172a',
    accentColor: '#f59e0b',
    textColor: '#f1f5f9',
    cardColor: '#1e293b',
  },
  configSchema: [
    { key: 'title', label: 'Title', type: 'text', defaultValue: 'My Morning Routine', group: 'Content' },
    { key: 'timeSlots', label: 'Time Slots', type: 'text-array', defaultValue: ['6:00 AM', '6:30 AM', '7:00 AM', '7:30 AM', '8:00 AM'], group: 'Content' },
    { key: 'activities', label: 'Activities', type: 'text-array', defaultValue: ['Wake up & meditate', 'Workout session', 'Healthy breakfast', 'Journaling', 'Start the day'], group: 'Content' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#0f172a', group: 'Style' },
    { key: 'accentColor', label: 'Accent Color', type: 'color', defaultValue: '#f59e0b', group: 'Style' },
    { key: 'textColor', label: 'Text Color', type: 'color', defaultValue: '#f1f5f9', group: 'Style' },
    { key: 'cardColor', label: 'Card Color', type: 'color', defaultValue: '#1e293b', group: 'Style' },
  ],
})
