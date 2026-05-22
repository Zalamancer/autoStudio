import React from 'react'
import { registerMotionGraphic } from '../registry'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface DailyCountdownConfig {
  daysRemaining: number
  eventName: string
  eventDate: string
  accentColor: string
  bgColor: string
  textColor: string
}

function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3)
}

function easeOutBack(t: number): number {
  const c1 = 1.70158
  const c3 = c1 + 1
  return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2)
}

function elasticOut(t: number): number {
  if (t === 0 || t === 1) return t
  return Math.pow(2, -10 * t) * Math.sin(((t - 0.075) * (2 * Math.PI)) / 0.3) + 1
}

function SceneDailyCountdownComponent({ config, progress, width, height }: MotionGraphicProps<DailyCountdownConfig>) {
  const { daysRemaining, eventName, eventDate, accentColor, bgColor, textColor } = config

  const enterProgress = progress < 0.15 ? progress / 0.15 : 1
  const exitProgress = progress >= 0.85 ? (progress - 0.85) / 0.15 : 0
  const holdProgress = progress >= 0.15 && progress < 0.85 ? (progress - 0.15) / 0.7 : progress >= 0.85 ? 1 : 0

  // Enter: number drops in, calendar slides up
  const numberDrop = elasticOut(enterProgress)
  const calendarSlide = easeOutCubic(Math.max(0, (enterProgress - 0.3) / 0.7))
  const labelFade = easeOutCubic(Math.max(0, (enterProgress - 0.2) / 0.8))

  // Exit: scale down
  const exitEased = easeOutCubic(exitProgress)
  const exitScale = 1 - exitEased * 0.4
  const exitOpacity = 1 - exitEased

  // Event date pulse during hold
  const pulse = Math.sin(holdProgress * Math.PI * 4) * 0.15 + 1

  // Generate calendar strip dates
  const calendarDays = []
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
  const dayNames = ['S', 'M', 'T', 'W', 'T', 'F', 'S']

  // Parse event date or fallback
  const eventDateStr = eventDate || '2026-06-15'
  const parts = eventDateStr.split('-')
  const eventYear = parseInt(parts[0]) || 2026
  const eventMonth = parseInt(parts[1]) || 6
  const eventDay = parseInt(parts[2]) || 15

  // Show 7 calendar days around event
  const visibleDays = 7
  const startOffset = Math.floor(visibleDays / 2)

  for (let i = 0; i < visibleDays; i++) {
    const dayOffset = i - startOffset
    const d = new Date(eventYear, eventMonth - 1, eventDay + dayOffset)
    const isEventDay = dayOffset === 0
    const dayNum = d.getDate()
    const dayOfWeek = d.getDay()
    const month = d.getMonth()

    calendarDays.push({
      dayNum,
      dayName: dayNames[dayOfWeek],
      month: monthNames[month],
      isEventDay,
      index: i,
    })
  }

  const cardW = Math.min(width * 0.1, 60)
  const cardH = cardW * 1.3
  const cardGap = Math.max(4, cardW * 0.12)
  const stripWidth = visibleDays * (cardW + cardGap)

  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        background: bgColor,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
        fontFamily: "'Helvetica Neue', Arial, sans-serif",
        transform: `scale(${exitScale})`,
        opacity: exitOpacity,
      }}
    >
      {/* Days number */}
      <div
        style={{
          fontSize: `clamp(60px, 18vw, ${Math.min(width, height) * 0.35}px)`,
          fontWeight: 900,
          color: accentColor,
          lineHeight: 1,
          transform: `translateY(${(1 - numberDrop) * -80}px)`,
          opacity: numberDrop,
          textShadow: `0 0 40px ${accentColor}30`,
        }}
      >
        {daysRemaining}
      </div>

      {/* "Days Until" label */}
      <div
        style={{
          fontSize: 'clamp(12px, 2vw, 20px)',
          fontWeight: 600,
          color: `${textColor}AA`,
          letterSpacing: 4,
          textTransform: 'uppercase',
          marginTop: 'clamp(4px, 1vw, 12px)',
          opacity: labelFade,
          transform: `translateY(${(1 - labelFade) * 15}px)`,
        }}
      >
        DAYS UNTIL
      </div>

      {/* Event name */}
      <div
        style={{
          fontSize: 'clamp(18px, 4vw, 36px)',
          fontWeight: 800,
          color: textColor,
          marginTop: 'clamp(4px, 1vw, 10px)',
          opacity: labelFade,
          textAlign: 'center',
          padding: '0 5%',
          lineHeight: 1.2,
        }}
      >
        {eventName}
      </div>

      {/* Calendar strip */}
      <div
        style={{
          display: 'flex',
          gap: cardGap,
          marginTop: 'clamp(20px, 4vw, 40px)',
          transform: `translateY(${(1 - calendarSlide) * 60}px)`,
          opacity: calendarSlide,
        }}
      >
        {calendarDays.map((day) => {
          const staggerDelay = day.index * 0.08
          const staggerProgress = easeOutCubic(
            Math.max(0, Math.min(1, (calendarSlide - staggerDelay) / (1 - staggerDelay * visibleDays))),
          )

          return (
            <div
              key={day.index}
              style={{
                width: cardW,
                height: cardH,
                borderRadius: cardW * 0.12,
                background: day.isEventDay ? accentColor : `${textColor}0A`,
                border: day.isEventDay ? 'none' : `1px solid ${textColor}15`,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 2,
                transform: `scale(${staggerProgress * (day.isEventDay ? pulse : 1)})`,
                opacity: staggerProgress,
                boxShadow: day.isEventDay ? `0 0 20px ${accentColor}40` : 'none',
              }}
            >
              <div
                style={{
                  fontSize: Math.max(8, cardW * 0.18),
                  fontWeight: 600,
                  color: day.isEventDay ? bgColor : `${textColor}60`,
                  letterSpacing: 1,
                }}
              >
                {day.dayName}
              </div>
              <div
                style={{
                  fontSize: Math.max(14, cardW * 0.36),
                  fontWeight: 800,
                  color: day.isEventDay ? bgColor : textColor,
                  lineHeight: 1,
                }}
              >
                {day.dayNum}
              </div>
              <div
                style={{
                  fontSize: Math.max(7, cardW * 0.15),
                  fontWeight: 500,
                  color: day.isEventDay ? `${bgColor}CC` : `${textColor}50`,
                }}
              >
                {day.month}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

registerMotionGraphic({
  id: 'tpl-scene-daily-countdown',
  title: 'Daily Countdown',
  description:
    'Days-until event countdown with large number, event name, and animated calendar strip with highlighted event date',
  tags: ['scene', 'countdown', 'days', 'calendar', 'event', 'schedule'],
  category: 'scene-layout',
  component: SceneDailyCountdownComponent as unknown as React.ComponentType<MotionGraphicProps>,
  configSchema: [
    {
      key: 'daysRemaining',
      label: 'Days Remaining',
      type: 'number',
      defaultValue: 42,
      min: 1,
      max: 365,
      group: 'Content',
    },
    { key: 'eventName', label: 'Event Name', type: 'text', defaultValue: 'Summer Vacation', group: 'Content' },
    { key: 'eventDate', label: 'Event Date (YYYY-MM-DD)', type: 'text', defaultValue: '2026-06-15', group: 'Content' },
    { key: 'accentColor', label: 'Accent Color', type: 'color', defaultValue: '#F59E0B', group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#0F172A', group: 'Style' },
    { key: 'textColor', label: 'Text Color', type: 'color', defaultValue: '#FFFFFF', group: 'Style' },
  ],
  defaultConfig: {
    daysRemaining: 42,
    eventName: 'Summer Vacation',
    eventDate: '2026-06-15',
    accentColor: '#F59E0B',
    bgColor: '#0F172A',
    textColor: '#FFFFFF',
  },
})
