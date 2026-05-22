import React from 'react'
import { registerMotionGraphic } from '../registry'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface EventScheduleConfig {
  title: string
  events: string
  bgColor: string
  textColor: string
  accentColor: string
  lineColor: string
}

function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3)
}

function easeInCubic(t: number): number {
  return t * t * t
}

function easeOutQuart(t: number): number {
  return 1 - Math.pow(1 - t, 4)
}

function SceneEventScheduleComponent({
  config,
  frame,
  durationInFrames,
}: MotionGraphicProps<EventScheduleConfig>) {
  const { title, events, bgColor, textColor, accentColor, lineColor } = config
  const progress = frame / durationInFrames

  // Parse events: "9:00 AM | Keynote | Jane Doe\n10:30 AM | Workshop | ..."
  const eventItems = events.split('\n').filter((e) => e.trim()).map((line) => {
    const parts = line.split('|').map((p) => p.trim())
    return { time: parts[0] || '', name: parts[1] || '', speaker: parts[2] || '' }
  })

  const enterEnd = 0.35
  const holdEnd = 0.8
  const enterProgress = Math.min(1, progress / enterEnd)
  const exitProgress = progress >= holdEnd ? (progress - holdEnd) / (1 - holdEnd) : 0
  const holdProgress =
    progress >= enterEnd && progress < holdEnd
      ? (progress - enterEnd) / (holdEnd - enterEnd)
      : progress >= holdEnd
        ? 1
        : 0

  // Title slides in
  const titleOpacity = enterProgress < 1
    ? easeOutCubic(Math.min(1, enterProgress / 0.25))
    : exitProgress > 0
      ? 1 - easeInCubic(exitProgress)
      : 1
  const titleY = enterProgress < 1
    ? -30 * (1 - easeOutCubic(Math.min(1, enterProgress / 0.25)))
    : exitProgress > 0
      ? -30 * easeInCubic(exitProgress)
      : 0

  // Timeline vertical line draws down
  const lineHeight = enterProgress < 1
    ? easeOutQuart(Math.max(0, Math.min(1, (enterProgress - 0.15) / 0.5))) * 100
    : exitProgress > 0
      ? 100 * (1 - easeInCubic(exitProgress))
      : 100

  // Each event staggers in
  const maxItems = eventItems.length
  const getItemProgress = (index: number) => {
    const staggerDelay = 0.2 + (index / maxItems) * 0.5
    const itemEnter = Math.max(0, Math.min(1, (enterProgress - staggerDelay) / 0.3))
    const opacity = enterProgress < 1
      ? easeOutCubic(itemEnter)
      : exitProgress > 0
        ? 1 - easeInCubic(exitProgress)
        : 1
    const x = enterProgress < 1
      ? 40 * (1 - easeOutCubic(itemEnter))
      : exitProgress > 0
        ? 40 * easeInCubic(exitProgress)
        : 0
    return { opacity, x }
  }

  // Hold: subtle highlight moves through items
  const highlightIndex = Math.floor(holdProgress * maxItems) % maxItems

  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        overflow: 'hidden',
        background: bgColor,
        fontFamily: "'Helvetica Neue', Arial, sans-serif",
        display: 'flex',
        flexDirection: 'column',
        padding: '6% 8%',
      }}
    >
      {/* Title */}
      <div
        style={{
          fontSize: 'clamp(20px, 4.5vw, 36px)',
          fontWeight: 800,
          color: textColor,
          opacity: titleOpacity,
          transform: `translateY(${titleY}px)`,
          letterSpacing: '0.02em',
          marginBottom: 'clamp(16px, 3vh, 32px)',
        }}
      >
        {title}
      </div>

      {/* Schedule container */}
      <div style={{ position: 'relative', flex: 1, paddingLeft: 'clamp(20px, 4vw, 40px)' }}>
        {/* Timeline vertical line */}
        <div
          style={{
            position: 'absolute',
            left: 'clamp(8px, 1.5vw, 14px)',
            top: 0,
            width: 2,
            height: `${lineHeight}%`,
            background: `linear-gradient(180deg, ${accentColor}, ${lineColor})`,
          }}
        />

        {/* Event items */}
        {eventItems.map((item, i) => {
          const { opacity, x } = getItemProgress(i)
          const isHighlighted = i === highlightIndex && enterProgress >= 1 && exitProgress === 0
          return (
            <div
              key={i}
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: 'clamp(10px, 2vw, 20px)',
                marginBottom: 'clamp(14px, 2.5vh, 28px)',
                opacity,
                transform: `translateX(${x}px)`,
                position: 'relative',
              }}
            >
              {/* Dot on timeline */}
              <div
                style={{
                  position: 'absolute',
                  left: `clamp(-16px, -2.5vw, -26px)`,
                  top: 'clamp(4px, 0.8vh, 8px)',
                  width: isHighlighted ? 10 : 8,
                  height: isHighlighted ? 10 : 8,
                  borderRadius: '50%',
                  background: isHighlighted ? accentColor : lineColor,
                  border: `2px solid ${bgColor}`,
                  transition: 'all 0.15s',
                  boxShadow: isHighlighted ? `0 0 8px ${accentColor}60` : 'none',
                }}
              />

              {/* Time */}
              <div
                style={{
                  fontSize: 'clamp(10px, 2vw, 14px)',
                  fontWeight: 700,
                  color: accentColor,
                  minWidth: 'clamp(55px, 10vw, 85px)',
                  letterSpacing: '0.02em',
                }}
              >
                {item.time}
              </div>

              {/* Event details */}
              <div style={{ flex: 1 }}>
                <div
                  style={{
                    fontSize: 'clamp(13px, 2.5vw, 20px)',
                    fontWeight: 700,
                    color: textColor,
                    lineHeight: 1.2,
                    marginBottom: 2,
                  }}
                >
                  {item.name}
                </div>
                {item.speaker && (
                  <div
                    style={{
                      fontSize: 'clamp(10px, 1.8vw, 14px)',
                      fontWeight: 400,
                      color: `${textColor}99`,
                    }}
                  >
                    {item.speaker}
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

registerMotionGraphic({
  id: 'tpl-scene-event-schedule',
  title: 'Event Schedule',
  description:
    'Event schedule/agenda with drawing timeline, staggered event entries, time slots, and conference aesthetic',
  tags: ['scene', 'event', 'schedule', 'agenda', 'conference', 'timeline'],
  category: 'scene-layout',
  component: SceneEventScheduleComponent as unknown as React.ComponentType<MotionGraphicProps>,
  configSchema: [
    { key: 'title', label: 'Title', type: 'text', defaultValue: 'Event Schedule', group: 'Content' },
    {
      key: 'events',
      label: 'Events (time | name | speaker per line)',
      type: 'text',
      defaultValue: '9:00 AM | Opening Keynote | Dr. Smith\n10:30 AM | Workshop: AI Tools | Jane Doe\n12:00 PM | Lunch Break\n1:30 PM | Panel Discussion | Various\n3:00 PM | Closing Remarks | Host',
      group: 'Content',
    },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#FAFAFA', group: 'Style' },
    { key: 'textColor', label: 'Text Color', type: 'color', defaultValue: '#1A1A2E', group: 'Style' },
    { key: 'accentColor', label: 'Accent Color', type: 'color', defaultValue: '#6C63FF', group: 'Style' },
    { key: 'lineColor', label: 'Line Color', type: 'color', defaultValue: '#D1D5DB', group: 'Style' },
  ],
  defaultConfig: {
    title: 'Event Schedule',
    events:
      '9:00 AM | Opening Keynote | Dr. Smith\n10:30 AM | Workshop: AI Tools | Jane Doe\n12:00 PM | Lunch Break\n1:30 PM | Panel Discussion | Various\n3:00 PM | Closing Remarks | Host',
    bgColor: '#FAFAFA',
    textColor: '#1A1A2E',
    accentColor: '#6C63FF',
    lineColor: '#D1D5DB',
  },
})
