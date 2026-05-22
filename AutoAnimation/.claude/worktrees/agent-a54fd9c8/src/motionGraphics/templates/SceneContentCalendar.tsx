import React from 'react'
import { registerMotionGraphic } from '../registry'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface ContentCalendarConfig {
  weekDays: string[]
  postTypes: string[]
  bgColor: string
  accentColor: string
  cardColor: string
  textColor: string
}

function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3)
}

function easeInCubic(t: number): number {
  return t * t * t
}

function easeOutBack(t: number): number {
  const c1 = 1.70158
  const c3 = c1 + 1
  return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2)
}

const DAY_ICONS: Record<string, string> = {
  Reel: '🎬',
  Story: '📸',
  Post: '📝',
  Live: '🔴',
  Thread: '🧵',
  Carousel: '🎠',
  Short: '⚡',
}

function SceneContentCalendarComponent({
  config,
  frame,
  durationInFrames,
}: MotionGraphicProps<ContentCalendarConfig>) {
  const { weekDays, postTypes, bgColor, accentColor, cardColor, textColor } = config
  const progress = frame / durationInFrames

  const enterEnd = 0.3
  const holdEnd = 0.8
  const enterProgress = Math.min(1, progress / enterEnd)
  const holdProgress = progress >= enterEnd && progress < holdEnd ? (progress - enterEnd) / (holdEnd - enterEnd) : progress >= holdEnd ? 1 : 0
  const exitProgress = progress >= holdEnd ? (progress - holdEnd) / (1 - holdEnd) : 0

  // Header slides down
  const headerSlide = easeOutCubic(Math.min(1, enterProgress / 0.3))

  // Cards appear one by one
  const getCardProgress = (idx: number): number => {
    const delay = 0.15 + idx * 0.1
    return easeOutBack(Math.max(0, Math.min(1, (enterProgress - delay) / 0.35)))
  }

  // Hold: current day highlight moves
  const highlightIdx = Math.floor(holdProgress * weekDays.length) % weekDays.length

  // Exit
  const exitEased = easeInCubic(exitProgress)
  const exitOpacity = 1 - exitEased
  const exitScale = 1 - exitEased * 0.1

  const days = weekDays.slice(0, 7)
  const types = postTypes.length > 0 ? postTypes : ['Reel', 'Story', 'Post', 'Live', 'Thread', 'Carousel', 'Short']

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
        fontFamily: "'Helvetica Neue', Arial, sans-serif",
        padding: '5%',
      }}
    >
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: 'clamp(12px, 2.5vh, 22px)',
          width: '100%',
          maxWidth: 460,
          transform: `scale(${exitScale})`,
          opacity: exitOpacity,
        }}
      >
        {/* Header */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            opacity: headerSlide,
            transform: `translateY(${(1 - headerSlide) * -20}px)`,
          }}
        >
          <div>
            <div
              style={{
                fontSize: 'clamp(18px, 3.5vw, 28px)',
                fontWeight: 900,
                color: textColor,
              }}
            >
              Content Calendar
            </div>
            <div
              style={{
                fontSize: 'clamp(10px, 1.6vw, 13px)',
                fontWeight: 500,
                color: `${textColor}60`,
                marginTop: 2,
              }}
            >
              This Week's Schedule
            </div>
          </div>
          <div
            style={{
              background: `${accentColor}20`,
              borderRadius: 12,
              padding: 'clamp(6px, 1vh, 10px) clamp(10px, 1.5vw, 16px)',
              fontSize: 'clamp(10px, 1.5vw, 13px)',
              fontWeight: 700,
              color: accentColor,
            }}
          >
            {days.length} POSTS
          </div>
        </div>

        {/* Calendar grid */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'clamp(6px, 1vh, 10px)' }}>
          {days.map((day, i) => {
            const cp = getCardProgress(i)
            const type = types[i % types.length]
            const icon = DAY_ICONS[type] || '📝'
            const isHighlighted = holdProgress > 0 && i === highlightIdx
            const pulseScale = isHighlighted ? 1 + Math.sin(holdProgress * Math.PI * 8) * 0.02 : 1

            return (
              <div
                key={i}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 'clamp(8px, 1.5vw, 14px)',
                  background: isHighlighted ? `${accentColor}15` : cardColor,
                  borderRadius: 'clamp(10px, 1.5vw, 14px)',
                  padding: 'clamp(10px, 1.8vh, 16px) clamp(12px, 2vw, 18px)',
                  border: isHighlighted ? `2px solid ${accentColor}40` : `1px solid ${textColor}10`,
                  transform: `scale(${cp * pulseScale}) translateX(${(1 - cp) * 30}px)`,
                  opacity: cp,
                }}
              >
                {/* Day abbreviation */}
                <div
                  style={{
                    fontSize: 'clamp(11px, 1.8vw, 14px)',
                    fontWeight: 800,
                    color: isHighlighted ? accentColor : `${textColor}70`,
                    width: 'clamp(32px, 5vw, 42px)',
                    textTransform: 'uppercase',
                  }}
                >
                  {day.slice(0, 3)}
                </div>

                {/* Icon */}
                <div style={{ fontSize: 'clamp(16px, 2.5vw, 22px)' }}>{icon}</div>

                {/* Type label */}
                <div
                  style={{
                    flex: 1,
                    fontSize: 'clamp(12px, 2vw, 15px)',
                    fontWeight: 600,
                    color: textColor,
                  }}
                >
                  {type}
                </div>

                {/* Time slot */}
                <div
                  style={{
                    fontSize: 'clamp(9px, 1.3vw, 11px)',
                    fontWeight: 500,
                    color: `${textColor}50`,
                    fontFamily: "'Courier New', monospace",
                  }}
                >
                  {`${9 + (i * 2) % 12}:00`}
                </div>

                {/* Status dot */}
                <div
                  style={{
                    width: 8,
                    height: 8,
                    borderRadius: '50%',
                    background: isHighlighted ? accentColor : `${accentColor}40`,
                    boxShadow: isHighlighted ? `0 0 8px ${accentColor}` : 'none',
                  }}
                />
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

registerMotionGraphic({
  id: 'tpl-scene-content-calendar',
  title: 'Scene Content Calendar',
  description:
    'Social media content calendar showing weekly posting schedule with animated card reveals, highlight sweep, and post type icons.',
  tags: ['scene', 'social-media', 'calendar', 'content', 'schedule', 'creator', 'planning'],
  category: 'scene-layout',
  component: SceneContentCalendarComponent as unknown as React.ComponentType<MotionGraphicProps>,
  configSchema: [
    { key: 'weekDays', label: 'Days', type: 'text-array', defaultValue: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'], group: 'Content' },
    { key: 'postTypes', label: 'Post Types', type: 'text-array', defaultValue: ['Reel', 'Story', 'Post', 'Live', 'Thread', 'Carousel', 'Short'], group: 'Content' },
    { key: 'accentColor', label: 'Accent Color', type: 'color', defaultValue: '#8B5CF6', group: 'Style' },
    { key: 'cardColor', label: 'Card Color', type: 'color', defaultValue: '#1A1A2E', group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#0A0A14', group: 'Style' },
    { key: 'textColor', label: 'Text Color', type: 'color', defaultValue: '#FFFFFF', group: 'Style' },
  ],
  defaultConfig: {
    weekDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
    postTypes: ['Reel', 'Story', 'Post', 'Live', 'Thread', 'Carousel', 'Short'],
    accentColor: '#8B5CF6',
    cardColor: '#1A1A2E',
    bgColor: '#0A0A14',
    textColor: '#FFFFFF',
  },
})
