import React from 'react'
import { registerMotionGraphic } from '../registry'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface GardenPlannerConfig {
  title: string
  month1: string
  month1Plants: string
  month2: string
  month2Plants: string
  month3: string
  month3Plants: string
  month4: string
  month4Plants: string
  bgColor: string
  textColor: string
  accentColor: string
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

const seasonIcons = ['\u{1F331}', '\u{1F33B}', '\u{1F342}', '\u2744\uFE0F']
const seasonColors = ['#66BB6A', '#FFB74D', '#FF8A65', '#4FC3F7']

function SceneGardenPlannerComponent({ config, progress }: MotionGraphicProps<GardenPlannerConfig>) {
  const {
    title,
    month1,
    month1Plants,
    month2,
    month2Plants,
    month3,
    month3Plants,
    month4,
    month4Plants,
    bgColor,
    textColor,
    accentColor,
  } = config

  const enterProgress = progress < 0.25 ? progress / 0.25 : 1
  const holdProgress = progress >= 0.25 && progress < 0.8 ? (progress - 0.25) / 0.55 : progress >= 0.8 ? 1 : 0
  const exitProgress = progress >= 0.8 ? (progress - 0.8) / 0.2 : 0

  const exitEased = easeInCubic(exitProgress)
  const exitOpacity = exitProgress > 0 ? 1 - exitEased : 1

  const titleEnter = easeOutCubic(Math.min(1, enterProgress / 0.3))

  const months = [
    { name: month1, plants: month1Plants, icon: seasonIcons[0], color: seasonColors[0] },
    { name: month2, plants: month2Plants, icon: seasonIcons[1], color: seasonColors[1] },
    { name: month3, plants: month3Plants, icon: seasonIcons[2], color: seasonColors[2] },
    { name: month4, plants: month4Plants, icon: seasonIcons[3], color: seasonColors[3] },
  ]

  const getMonthProg = (idx: number) => easeOutBack(Math.max(0, Math.min(1, (enterProgress - 0.2 - idx * 0.1) / 0.35)))

  // Timeline connector
  const timelineProg = easeOutCubic(Math.max(0, Math.min(1, (enterProgress - 0.15) / 0.6)))

  // Gentle bob during hold
  const getHoldBob = (idx: number) => {
    if (progress < 0.25 || progress >= 0.8) return 0
    return Math.sin(holdProgress * Math.PI * 4 + idx * 1.5) * 3
  }

  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        overflow: 'hidden',
        fontFamily: "'Inter', 'Helvetica Neue', sans-serif",
      }}
    >
      <div style={{ position: 'absolute', inset: 0, background: bgColor }} />
      {/* Soil/garden floor gradient */}
      <div
        style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          height: '10%',
          background: 'linear-gradient(180deg, transparent, #3E272322)',
        }}
      />

      <div
        style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '5%',
          opacity: exitOpacity,
          transform: `scale(${exitProgress > 0 ? 1 - exitEased * 0.08 : 1})`,
        }}
      >
        {/* Title */}
        <div
          style={{
            textAlign: 'center',
            marginBottom: 'clamp(16px, 3vh, 28px)',
            opacity: titleEnter,
            transform: `translateY(${(1 - titleEnter) * 12}px)`,
          }}
        >
          <div
            style={{
              fontSize: 'clamp(10px, 1.6vw, 13px)',
              fontWeight: 700,
              color: accentColor,
              textTransform: 'uppercase',
              letterSpacing: 3,
              marginBottom: '4px',
            }}
          >
            {'🌿'} Garden Calendar
          </div>
          <div style={{ fontSize: 'clamp(20px, 5vw, 34px)', fontWeight: 900, color: textColor }}>{title}</div>
        </div>

        {/* Timeline with month cards */}
        <div style={{ width: '100%', maxWidth: '400px', position: 'relative' }}>
          {/* Vertical timeline line */}
          <div
            style={{
              position: 'absolute',
              left: 'clamp(18px, 4vw, 28px)',
              top: '10px',
              bottom: '10px',
              width: '2px',
              background: `${accentColor}30`,
              transform: `scaleY(${timelineProg})`,
              transformOrigin: 'top',
            }}
          />

          {/* Month entries */}
          {months.map((m, i) => {
            const mProg = getMonthProg(i)
            const plants = m.plants
              .split(',')
              .map((s) => s.trim())
              .filter(Boolean)
            const bob = getHoldBob(i)

            return (
              <div
                key={i}
                style={{
                  display: 'flex',
                  gap: 'clamp(12px, 2.5vw, 20px)',
                  marginBottom: 'clamp(12px, 2vh, 20px)',
                  opacity: mProg,
                  transform: `translateX(${(1 - mProg) * 30}px) translateY(${bob}px)`,
                }}
              >
                {/* Timeline dot */}
                <div
                  style={{
                    width: 'clamp(36px, 8vw, 52px)',
                    height: 'clamp(36px, 8vw, 52px)',
                    borderRadius: '50%',
                    background: `${m.color}20`,
                    border: `2px solid ${m.color}60`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 'clamp(16px, 3.5vw, 24px)',
                    flexShrink: 0,
                    transform: `scale(${mProg})`,
                  }}
                >
                  {m.icon}
                </div>

                {/* Month content */}
                <div style={{ flex: 1 }}>
                  <div
                    style={{
                      fontSize: 'clamp(13px, 2.5vw, 18px)',
                      fontWeight: 800,
                      color: m.color,
                      marginBottom: '4px',
                    }}
                  >
                    {m.name}
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                    {plants.map((plant, j) => (
                      <span
                        key={j}
                        style={{
                          background: `${m.color}15`,
                          border: `1px solid ${m.color}30`,
                          borderRadius: '100px',
                          padding: 'clamp(2px, 0.4vw, 4px) clamp(8px, 1.5vw, 12px)',
                          fontSize: 'clamp(9px, 1.3vw, 11px)',
                          color: `${textColor}cc`,
                          fontWeight: 500,
                        }}
                      >
                        {plant}
                      </span>
                    ))}
                  </div>
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
  id: 'tpl-scene-garden-planner',
  title: 'Garden Planner',
  description:
    'Garden planting calendar with vertical timeline, seasonal icons, and plant tags per month. Cards slide in with stagger.',
  tags: ['scene', 'garden', 'planting', 'calendar', 'eco', 'sustainability', 'green', 'organic'],
  category: 'scene-layout',
  component: SceneGardenPlannerComponent as any,
  defaultConfig: {
    title: 'What to Plant',
    month1: 'March - Spring',
    month1Plants: 'Tomatoes, Peppers, Basil, Peas',
    month2: 'June - Summer',
    month2Plants: 'Corn, Beans, Squash, Cucumber',
    month3: 'Sept - Autumn',
    month3Plants: 'Kale, Carrots, Beets, Garlic',
    month4: 'Dec - Winter',
    month4Plants: 'Spinach, Lettuce, Radish',
    bgColor: '#0D1F0D',
    textColor: '#E8F5E9',
    accentColor: '#4CAF50',
  },
  configSchema: [
    { key: 'title', label: 'Title', type: 'text', defaultValue: 'What to Plant', group: 'Content' },
    { key: 'month1', label: 'Month 1', type: 'text', defaultValue: 'March - Spring', group: 'Content' },
    {
      key: 'month1Plants',
      label: 'Month 1 Plants',
      type: 'text',
      defaultValue: 'Tomatoes, Peppers, Basil, Peas',
      group: 'Content',
    },
    { key: 'month2', label: 'Month 2', type: 'text', defaultValue: 'June - Summer', group: 'Content' },
    {
      key: 'month2Plants',
      label: 'Month 2 Plants',
      type: 'text',
      defaultValue: 'Corn, Beans, Squash, Cucumber',
      group: 'Content',
    },
    { key: 'month3', label: 'Month 3', type: 'text', defaultValue: 'Sept - Autumn', group: 'Content' },
    {
      key: 'month3Plants',
      label: 'Month 3 Plants',
      type: 'text',
      defaultValue: 'Kale, Carrots, Beets, Garlic',
      group: 'Content',
    },
    { key: 'month4', label: 'Month 4', type: 'text', defaultValue: 'Dec - Winter', group: 'Content' },
    {
      key: 'month4Plants',
      label: 'Month 4 Plants',
      type: 'text',
      defaultValue: 'Spinach, Lettuce, Radish',
      group: 'Content',
    },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#0D1F0D', group: 'Style' },
    { key: 'textColor', label: 'Text Color', type: 'color', defaultValue: '#E8F5E9', group: 'Style' },
    { key: 'accentColor', label: 'Accent Color', type: 'color', defaultValue: '#4CAF50', group: 'Style' },
  ],
})
