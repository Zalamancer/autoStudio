import React from 'react'
import { registerMotionGraphic } from '../registry'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface TravelItineraryConfig {
  dayNumber: string
  activities: string[]
  bgColor: string
  textColor: string
  accentColor: string
  headerColor: string
}

function easeOutCubic(t: number): number { return 1 - Math.pow(1 - t, 3) }
function easeInCubic(t: number): number { return t * t * t }
function easeOutBack(t: number): number {
  const c1 = 1.70158
  const c3 = c1 + 1
  return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2)
}

function SceneTravelItineraryComponent({ config, progress }: MotionGraphicProps<TravelItineraryConfig>) {
  const { dayNumber, activities, bgColor, textColor, accentColor, headerColor } = config

  const enterProgress = progress < 0.25 ? progress / 0.25 : 1
  const holdProgress = progress >= 0.25 && progress < 0.8 ? (progress - 0.25) / 0.55 : progress >= 0.8 ? 1 : 0
  const exitProgress = progress >= 0.8 ? (progress - 0.8) / 0.2 : 0

  const exitEased = easeInCubic(exitProgress)
  const exitOpacity = exitProgress > 0 ? 1 - exitEased : 1

  // Day header drops down
  const headerEnter = easeOutBack(Math.max(0, Math.min(1, enterProgress / 0.35)))
  const headerY = (1 - headerEnter) * -50

  // Activities slide in staggered from right
  const getActivityProgress = (idx: number): number => {
    const start = 0.25 + idx * 0.12
    return easeOutCubic(Math.max(0, Math.min(1, (enterProgress - start) / 0.35)))
  }

  return (
    <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', background: bgColor, fontFamily: "'Inter', 'Helvetica Neue', sans-serif" }}>
      {/* Passport/boarding pass perforated edge */}
      <div
        style={{
          position: 'absolute',
          left: 'clamp(50px, 12vw, 90px)',
          top: 0,
          bottom: 0,
          width: 2,
          backgroundImage: `repeating-linear-gradient(to bottom, ${textColor}25 0px, ${textColor}25 6px, transparent 6px, transparent 12px)`,
          opacity: enterProgress,
        }}
      />

      {/* Subtle stamp watermark */}
      <div
        style={{
          position: 'absolute',
          right: 'clamp(10px, 3vw, 30px)',
          top: 'clamp(10px, 3vh, 30px)',
          fontSize: 'clamp(40px, 8vw, 70px)',
          opacity: 0.06,
          transform: 'rotate(15deg)',
          color: textColor,
          fontWeight: 900,
        }}
      >
        ✈
      </div>

      <div
        style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          flexDirection: 'column',
          padding: '8% 8% 8% clamp(70px, 16vw, 120px)',
          gap: 'clamp(12px, 2.5vh, 24px)',
          opacity: exitOpacity,
          transform: `translateX(${exitEased * -40}px)`,
        }}
      >
        {/* Day header */}
        <div
          style={{
            display: 'flex',
            alignItems: 'baseline',
            gap: 'clamp(8px, 1.5vw, 14px)',
            transform: `translateY(${headerY}px)`,
            opacity: headerEnter,
          }}
        >
          <div
            style={{
              fontSize: 'clamp(28px, 7vw, 52px)',
              fontWeight: 900,
              color: headerColor,
              lineHeight: 1,
            }}
          >
            {dayNumber}
          </div>
          <div
            style={{
              width: 'clamp(30px, 6vw, 50px)',
              height: 3,
              background: accentColor,
              borderRadius: 2,
              alignSelf: 'center',
            }}
          />
        </div>

        {/* Activities list */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'clamp(8px, 1.5vh, 16px)' }}>
          {activities.map((activity, i) => {
            const actProg = getActivityProgress(i)
            // Hold: subtle highlight pulse on current item
            const isHighlighted = progress >= 0.25 && progress < 0.8
            const pulseIdx = Math.floor(holdProgress * activities.length) % activities.length
            const isPulsing = isHighlighted && pulseIdx === i
            return (
              <div
                key={i}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 'clamp(8px, 1.5vw, 14px)',
                  opacity: actProg,
                  transform: `translateX(${(1 - actProg) * 40}px)`,
                }}
              >
                {/* Timeline dot */}
                <div
                  style={{
                    width: 'clamp(8px, 1.5vw, 12px)',
                    height: 'clamp(8px, 1.5vw, 12px)',
                    borderRadius: '50%',
                    background: isPulsing ? accentColor : `${accentColor}60`,
                    flexShrink: 0,
                    boxShadow: isPulsing ? `0 0 12px ${accentColor}60` : 'none',
                    transition: 'background 0.3s, box-shadow 0.3s',
                  }}
                />
                <div
                  style={{
                    fontSize: 'clamp(13px, 2.5vw, 20px)',
                    fontWeight: 500,
                    color: textColor,
                    lineHeight: 1.4,
                  }}
                >
                  {activity}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

registerMotionGraphic({
  id: 'tpl-scene-travel-itinerary',
  title: 'Travel Itinerary',
  description: 'Day-by-day itinerary with staggered activity reveals and passport/boarding pass aesthetic',
  tags: ['scene', 'travel', 'itinerary', 'planning', 'adventure', 'list'],
  category: 'scene-layout',
  component: SceneTravelItineraryComponent as any,
  defaultConfig: {
    dayNumber: 'Day 1',
    activities: ['Arrive at airport — check in', 'Explore the old town', 'Sunset dinner by the coast', 'Evening walk along the pier'],
    bgColor: '#0c1524',
    textColor: '#e8dfd6',
    accentColor: '#d4a853',
    headerColor: '#d4a853',
  },
  configSchema: [
    { key: 'dayNumber', label: 'Day Header', type: 'text', defaultValue: 'Day 1', group: 'Content' },
    { key: 'activities', label: 'Activities', type: 'text-array', defaultValue: ['Arrive at airport — check in', 'Explore the old town', 'Sunset dinner by the coast', 'Evening walk along the pier'], group: 'Content' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#0c1524', group: 'Style' },
    { key: 'textColor', label: 'Text Color', type: 'color', defaultValue: '#e8dfd6', group: 'Style' },
    { key: 'accentColor', label: 'Accent Color', type: 'color', defaultValue: '#d4a853', group: 'Style' },
    { key: 'headerColor', label: 'Header Color', type: 'color', defaultValue: '#d4a853', group: 'Style' },
  ],
})
