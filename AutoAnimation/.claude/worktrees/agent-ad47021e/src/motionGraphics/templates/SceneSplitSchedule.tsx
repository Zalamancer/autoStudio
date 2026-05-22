import React from 'react'
import { registerMotionGraphic } from '../registry'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface SceneSplitScheduleConfig {
  title: string
  days: string[]
  muscles: string[]
  highlights: string[]
  bgColor: string
  textColor: string
  accentColor: string
  restColor: string
}

function easeOutCubic(t: number): number { return 1 - Math.pow(1 - t, 3) }
function easeInCubic(t: number): number { return t * t * t }

function SceneSplitScheduleComponent({ config, progress }: MotionGraphicProps<SceneSplitScheduleConfig>) {
  const { title, days, muscles, highlights, bgColor, textColor, accentColor, restColor } = config

  const enterProgress = progress < 0.2 ? progress / 0.2 : 1
  const holdProgress = progress >= 0.2 && progress < 0.8 ? (progress - 0.2) / 0.6 : progress >= 0.8 ? 1 : 0
  const exitProgress = progress >= 0.8 ? (progress - 0.8) / 0.2 : 0

  const exitEased = easeInCubic(exitProgress)
  const exitOpacity = exitProgress > 0 ? 1 - exitEased : 1
  const exitScale = exitProgress > 0 ? 1 - exitEased * 0.1 : 1

  const headerEnter = easeOutCubic(Math.min(1, enterProgress / 0.4))
  const currentDay = progress >= 0.2 && progress < 0.8 ? Math.floor(holdProgress * days.length) : -1

  return (
    <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', fontFamily: "'Inter', 'Helvetica Neue', sans-serif" }}>
      <div style={{ position: 'absolute', inset: 0, background: bgColor }} />

      {/* Grid pattern hint */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          backgroundImage: `linear-gradient(${textColor}03 1px, transparent 1px), linear-gradient(90deg, ${textColor}03 1px, transparent 1px)`,
          backgroundSize: 'clamp(30px, 6vw, 50px) clamp(30px, 6vw, 50px)',
        }}
      />

      <div
        style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          flexDirection: 'column',
          padding: '5%',
          opacity: exitOpacity,
          transform: `scale(${exitScale})`,
        }}
      >
        {/* Header */}
        <div
          style={{
            textAlign: 'center',
            marginBottom: 'clamp(12px, 2.5vw, 24px)',
            opacity: headerEnter,
            transform: `translateY(${(1 - headerEnter) * -20}px)`,
          }}
        >
          <div
            style={{
              fontSize: 'clamp(20px, 5vw, 40px)',
              fontWeight: 900,
              color: textColor,
              letterSpacing: '-0.01em',
            }}
          >
            {title}
          </div>
          <div
            style={{
              width: 'clamp(40px, 8vw, 60px)',
              height: '3px',
              background: accentColor,
              borderRadius: '2px',
              margin: 'clamp(6px, 1vw, 10px) auto 0',
            }}
          />
        </div>

        {/* Day grid */}
        <div
          style={{
            flex: 1,
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(clamp(100px, 22vw, 180px), 1fr))',
            gap: 'clamp(4px, 0.8vw, 8px)',
            alignContent: 'center',
          }}
        >
          {days.map((day, i) => {
            const itemDelay = 0.15 + i * 0.07
            const itemEnter = easeOutCubic(Math.max(0, Math.min(1, (enterProgress - itemDelay) / 0.35)))
            const isRest = muscles[i]?.toLowerCase() === 'rest'
            const isActive = currentDay === i
            const cardColor = isRest ? restColor : accentColor
            const isHighlight = highlights.includes(day)

            return (
              <div
                key={i}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  padding: 'clamp(8px, 1.5vw, 16px)',
                  background: isActive ? `${cardColor}18` : `${textColor}05`,
                  border: `2px solid ${isActive ? `${cardColor}50` : isHighlight ? `${accentColor}25` : `${textColor}08`}`,
                  borderRadius: 'clamp(8px, 1.5vw, 14px)',
                  opacity: itemEnter,
                  transform: `scale(${itemEnter}) ${isActive ? 'scale(1.03)' : ''}`,
                  boxShadow: isActive ? `0 0 20px ${cardColor}20` : 'none',
                }}
              >
                {/* Day label */}
                <div
                  style={{
                    fontSize: 'clamp(9px, 1.4vw, 12px)',
                    fontWeight: 800,
                    color: isActive ? cardColor : `${textColor}55`,
                    textTransform: 'uppercase',
                    letterSpacing: '0.12em',
                    marginBottom: 'clamp(4px, 0.8vw, 8px)',
                  }}
                >
                  {day}
                </div>

                {/* Muscle group */}
                <div
                  style={{
                    fontSize: 'clamp(13px, 2.4vw, 20px)',
                    fontWeight: 800,
                    color: isRest ? `${textColor}44` : textColor,
                    lineHeight: 1.2,
                  }}
                >
                  {muscles[i] || '--'}
                </div>

                {/* Active indicator */}
                {isActive && (
                  <div
                    style={{
                      width: '100%',
                      height: '3px',
                      background: cardColor,
                      borderRadius: '2px',
                      marginTop: 'clamp(6px, 1vw, 10px)',
                    }}
                  />
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
  id: 'tpl-scene-split-schedule',
  title: 'Split Schedule',
  description: 'Weekly training split display with day cards, muscle groups, and active day highlighting. Grid layout with staggered entry.',
  tags: ['scene', 'split', 'schedule', 'gym', 'fitness', 'workout', 'plan', 'weekly', 'routine'],
  category: 'scene-layout',
  component: SceneSplitScheduleComponent as any,
  defaultConfig: {
    title: 'PPL Split',
    days: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
    muscles: ['Push', 'Pull', 'Legs', 'Push', 'Pull', 'Legs', 'Rest'],
    highlights: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
    bgColor: '#0a0a0a',
    textColor: '#ffffff',
    accentColor: '#FF3333',
    restColor: '#666666',
  },
  configSchema: [
    { key: 'title', label: 'Title', type: 'text', defaultValue: 'PPL Split', group: 'Content' },
    { key: 'days', label: 'Days', type: 'text-array', defaultValue: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'], group: 'Content' },
    { key: 'muscles', label: 'Muscle Groups', type: 'text-array', defaultValue: ['Push', 'Pull', 'Legs', 'Push', 'Pull', 'Legs', 'Rest'], group: 'Content' },
    { key: 'highlights', label: 'Training Days', type: 'text-array', defaultValue: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'], group: 'Content' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#0a0a0a', group: 'Style' },
    { key: 'textColor', label: 'Text Color', type: 'color', defaultValue: '#ffffff', group: 'Style' },
    { key: 'accentColor', label: 'Accent Color', type: 'color', defaultValue: '#FF3333', group: 'Style' },
    { key: 'restColor', label: 'Rest Day Color', type: 'color', defaultValue: '#666666', group: 'Style' },
  ],
})
