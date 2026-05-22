import React from 'react'
import { registerMotionGraphic } from '../registry'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface SceneClassScheduleConfig {
  gymName: string
  day: string
  classes: string[]
  times: string[]
  instructors: string[]
  intensities: string[]
  bgColor: string
  textColor: string
  accentColor: string
}

function easeOutCubic(t: number): number { return 1 - Math.pow(1 - t, 3) }
function easeInCubic(t: number): number { return t * t * t }

function SceneClassScheduleComponent({ config, progress }: MotionGraphicProps<SceneClassScheduleConfig>) {
  const { gymName, day, classes, times, instructors, intensities, bgColor, textColor, accentColor } = config

  const enterProgress = progress < 0.2 ? progress / 0.2 : 1
  const holdProgress = progress >= 0.2 && progress < 0.8 ? (progress - 0.2) / 0.6 : progress >= 0.8 ? 1 : 0
  const exitProgress = progress >= 0.8 ? (progress - 0.8) / 0.2 : 0

  const exitEased = easeInCubic(exitProgress)
  const exitOpacity = exitProgress > 0 ? 1 - exitEased : 1
  const exitScale = exitProgress > 0 ? 1 - exitEased * 0.1 : 1

  const headerEnter = easeOutCubic(Math.min(1, enterProgress / 0.4))

  const intensityColors: Record<string, string> = {
    'Low': '#22c55e',
    'Medium': '#eab308',
    'High': '#FF6633',
    'Extreme': '#FF2222',
  }

  return (
    <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', fontFamily: "'Inter', 'Helvetica Neue', sans-serif" }}>
      <div style={{ position: 'absolute', inset: 0, background: bgColor }} />

      {/* Decorative time blocks */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          right: 0,
          width: '25%',
          height: '100%',
          background: `linear-gradient(180deg, ${accentColor}06, transparent 30%)`,
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
            marginBottom: 'clamp(10px, 2vw, 20px)',
            opacity: headerEnter,
            transform: `translateY(${(1 - headerEnter) * -20}px)`,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'clamp(2px, 0.5vw, 6px)' }}>
            <div
              style={{
                fontSize: 'clamp(10px, 1.6vw, 14px)',
                fontWeight: 700,
                color: `${textColor}55`,
                textTransform: 'uppercase',
                letterSpacing: '0.1em',
              }}
            >
              {gymName}
            </div>
            <div
              style={{
                background: accentColor,
                color: bgColor,
                fontSize: 'clamp(9px, 1.4vw, 12px)',
                fontWeight: 800,
                padding: 'clamp(2px, 0.4vw, 4px) clamp(8px, 1.4vw, 14px)',
                borderRadius: '100px',
              }}
            >
              {day}
            </div>
          </div>
          <div
            style={{
              fontSize: 'clamp(22px, 5.5vw, 42px)',
              fontWeight: 900,
              color: textColor,
              letterSpacing: '-0.02em',
            }}
          >
            Class Schedule
          </div>
          <div
            style={{
              width: `${headerEnter * 100}%`,
              height: '2px',
              background: `linear-gradient(90deg, ${accentColor}, transparent)`,
              marginTop: 'clamp(6px, 1vw, 10px)',
            }}
          />
        </div>

        {/* Class list */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 'clamp(4px, 0.9vw, 10px)' }}>
          {classes.map((className, i) => {
            const itemDelay = 0.2 + i * 0.08
            const itemEnter = easeOutCubic(Math.max(0, Math.min(1, (enterProgress - itemDelay) / 0.35)))
            const isActive = progress >= 0.2 && progress < 0.8 && Math.floor(holdProgress * classes.length) === i
            const intensity = intensities[i] || 'Medium'
            const iColor = intensityColors[intensity] || accentColor

            return (
              <div
                key={i}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 'clamp(6px, 1.2vw, 12px)',
                  padding: 'clamp(8px, 1.5vw, 14px) clamp(10px, 1.8vw, 16px)',
                  background: isActive ? `${accentColor}10` : `${textColor}04`,
                  border: `1px solid ${isActive ? `${accentColor}30` : `${textColor}06`}`,
                  borderRadius: 'clamp(6px, 1.2vw, 10px)',
                  opacity: itemEnter,
                  transform: `translateX(${(1 - itemEnter) * 35}px)`,
                  borderLeft: isActive ? `3px solid ${accentColor}` : `3px solid transparent`,
                }}
              >
                {/* Time */}
                <div
                  style={{
                    fontSize: 'clamp(11px, 1.8vw, 15px)',
                    fontWeight: 800,
                    color: accentColor,
                    fontVariantNumeric: 'tabular-nums',
                    flex: '0 0 clamp(45px, 10vw, 80px)',
                  }}
                >
                  {times[i] || '--:--'}
                </div>

                {/* Class details */}
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 'clamp(12px, 2vw, 17px)', fontWeight: 700, color: textColor }}>
                    {className}
                  </div>
                  <div style={{ fontSize: 'clamp(9px, 1.4vw, 12px)', fontWeight: 600, color: `${textColor}55` }}>
                    {instructors[i] || ''}
                  </div>
                </div>

                {/* Intensity indicator */}
                <div style={{ display: 'flex', gap: '2px', alignItems: 'center' }}>
                  {[1, 2, 3, 4].map((level) => {
                    const intensityLevel = intensity === 'Low' ? 1 : intensity === 'Medium' ? 2 : intensity === 'High' ? 3 : 4
                    return (
                      <div
                        key={level}
                        style={{
                          width: 'clamp(3px, 0.5vw, 5px)',
                          height: `clamp(${8 + level * 3}px, ${1.2 + level * 0.5}vw, ${12 + level * 4}px)`,
                          borderRadius: '1px',
                          background: level <= intensityLevel ? iColor : `${textColor}15`,
                        }}
                      />
                    )
                  })}
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
  id: 'tpl-scene-class-schedule',
  title: 'Class Schedule',
  description: 'Gym class schedule display with times, instructors, intensity bars, and active class highlighting. Staggered slide-in entry.',
  tags: ['scene', 'class', 'schedule', 'gym', 'fitness', 'timetable', 'group', 'workout'],
  category: 'scene-layout',
  component: SceneClassScheduleComponent as any,
  defaultConfig: {
    gymName: 'Iron Forge Gym',
    day: 'Monday',
    classes: ['Spin Cycle', 'HIIT Blast', 'Yoga Flow', 'Boxing Cardio', 'CrossFit WOD', 'Pilates Core'],
    times: ['6:00 AM', '7:30 AM', '9:00 AM', '12:00 PM', '5:30 PM', '7:00 PM'],
    instructors: ['Coach Mike', 'Sarah T.', 'Priya K.', 'Jake L.', 'Coach Dave', 'Emma R.'],
    intensities: ['High', 'Extreme', 'Low', 'High', 'Extreme', 'Medium'],
    bgColor: '#0a0a0a',
    textColor: '#ffffff',
    accentColor: '#FF4433',
  },
  configSchema: [
    { key: 'gymName', label: 'Gym Name', type: 'text', defaultValue: 'Iron Forge Gym', group: 'Content' },
    { key: 'day', label: 'Day', type: 'text', defaultValue: 'Monday', group: 'Content' },
    { key: 'classes', label: 'Classes', type: 'text-array', defaultValue: ['Spin Cycle', 'HIIT Blast', 'Yoga Flow', 'Boxing Cardio', 'CrossFit WOD', 'Pilates Core'], group: 'Content' },
    { key: 'times', label: 'Times', type: 'text-array', defaultValue: ['6:00 AM', '7:30 AM', '9:00 AM', '12:00 PM', '5:30 PM', '7:00 PM'], group: 'Content' },
    { key: 'instructors', label: 'Instructors', type: 'text-array', defaultValue: ['Coach Mike', 'Sarah T.', 'Priya K.', 'Jake L.', 'Coach Dave', 'Emma R.'], group: 'Content' },
    { key: 'intensities', label: 'Intensities', type: 'text-array', defaultValue: ['High', 'Extreme', 'Low', 'High', 'Extreme', 'Medium'], group: 'Content' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#0a0a0a', group: 'Style' },
    { key: 'textColor', label: 'Text Color', type: 'color', defaultValue: '#ffffff', group: 'Style' },
    { key: 'accentColor', label: 'Accent Color', type: 'color', defaultValue: '#FF4433', group: 'Style' },
  ],
})
