import React from 'react'
import { registerMotionGraphic } from '../registry'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface ClimateActionConfig {
  title: string
  item1: string
  item1Done: boolean
  item2: string
  item2Done: boolean
  item3: string
  item3Done: boolean
  item4: string
  item4Done: boolean
  item5: string
  item5Done: boolean
  completedCount: number
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

function SceneClimateActionComponent({ config, progress }: MotionGraphicProps<ClimateActionConfig>) {
  const {
    title,
    item1,
    item1Done,
    item2,
    item2Done,
    item3,
    item3Done,
    item4,
    item4Done,
    item5,
    item5Done,
    completedCount,
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

  const items = [
    { text: item1, done: item1Done },
    { text: item2, done: item2Done },
    { text: item3, done: item3Done },
    { text: item4, done: item4Done },
    { text: item5, done: item5Done },
  ]

  const getItemProg = (idx: number) => easeOutCubic(Math.max(0, Math.min(1, (enterProgress - 0.2 - idx * 0.08) / 0.3)))

  // Check animation: each done item gets a delayed check pop
  const getCheckProg = (idx: number) =>
    easeOutBack(Math.max(0, Math.min(1, (enterProgress - 0.35 - idx * 0.08) / 0.25)))

  // Progress bar
  const barProg = easeOutCubic(Math.max(0, Math.min(1, (enterProgress - 0.6) / 0.3)))
  const completedPercent = (completedCount / 5) * 100

  // Pulse on checkmarks during hold
  const checkPulse = progress >= 0.25 && progress < 0.8 ? 1 + Math.sin(holdProgress * Math.PI * 6) * 0.04 : 1

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
      <div
        style={{
          position: 'absolute',
          top: 0,
          right: 0,
          width: '50%',
          height: '50%',
          background: `radial-gradient(circle at top right, ${accentColor}08, transparent 60%)`,
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
          transform: `translateY(${exitEased * 25}px)`,
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
            {'🌍'} Climate Action
          </div>
          <div style={{ fontSize: 'clamp(20px, 5vw, 34px)', fontWeight: 900, color: textColor }}>{title}</div>
        </div>

        {/* Checklist */}
        <div style={{ width: '100%', maxWidth: '380px', marginBottom: 'clamp(16px, 3vh, 24px)' }}>
          {items.map((item, i) => {
            const itemProg = getItemProg(i)
            const checkScale = item.done ? getCheckProg(i) * checkPulse : 0

            return (
              <div
                key={i}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 'clamp(10px, 2vw, 16px)',
                  marginBottom: 'clamp(8px, 1.5vh, 14px)',
                  opacity: itemProg,
                  transform: `translateX(${(1 - itemProg) * 20}px)`,
                }}
              >
                {/* Checkbox */}
                <div
                  style={{
                    width: 'clamp(24px, 5vw, 32px)',
                    height: 'clamp(24px, 5vw, 32px)',
                    borderRadius: 'clamp(6px, 1vw, 8px)',
                    border: `2px solid ${item.done ? accentColor : `${textColor}30`}`,
                    background: item.done ? `${accentColor}20` : 'transparent',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                    transform: `scale(${item.done ? checkScale : 1})`,
                  }}
                >
                  {item.done && (
                    <svg
                      viewBox="0 0 24 24"
                      style={{
                        width: '60%',
                        height: '60%',
                        opacity: checkScale,
                      }}
                    >
                      <path
                        d="M5 12l5 5L19 7"
                        fill="none"
                        stroke={accentColor}
                        strokeWidth="3"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  )}
                </div>

                {/* Item text */}
                <span
                  style={{
                    fontSize: 'clamp(12px, 2vw, 16px)',
                    fontWeight: 600,
                    color: item.done ? textColor : `${textColor}88`,
                    textDecoration: item.done ? 'line-through' : 'none',
                    textDecorationColor: `${accentColor}60`,
                  }}
                >
                  {item.text}
                </span>
              </div>
            )
          })}
        </div>

        {/* Progress bar */}
        <div
          style={{
            width: '100%',
            maxWidth: '380px',
            opacity: barProg,
            transform: `translateY(${(1 - barProg) * 10}px)`,
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
            <span style={{ fontSize: 'clamp(10px, 1.5vw, 12px)', color: `${textColor}88`, fontWeight: 600 }}>
              Progress
            </span>
            <span style={{ fontSize: 'clamp(10px, 1.5vw, 12px)', color: accentColor, fontWeight: 700 }}>
              {completedCount}/5 complete
            </span>
          </div>
          <div
            style={{
              width: '100%',
              height: 'clamp(8px, 1.5vw, 12px)',
              background: `${textColor}12`,
              borderRadius: '6px',
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                width: `${barProg * completedPercent}%`,
                height: '100%',
                background: `linear-gradient(90deg, ${accentColor}cc, ${accentColor})`,
                borderRadius: '6px',
                boxShadow: `0 0 10px ${accentColor}30`,
              }}
            />
          </div>
        </div>
      </div>
    </div>
  )
}

registerMotionGraphic({
  id: 'tpl-scene-climate-action',
  title: 'Climate Action',
  description:
    'Climate action checklist with animated checkboxes, strikethrough on completed items, and progress bar with counter.',
  tags: ['scene', 'climate', 'action', 'checklist', 'eco', 'sustainability', 'goals', 'green'],
  category: 'scene-layout',
  component: SceneClimateActionComponent as any,
  defaultConfig: {
    title: 'My Climate Goals',
    item1: 'Switch to green energy',
    item1Done: true,
    item2: 'Reduce meat to 2x/week',
    item2Done: true,
    item3: 'Bike to work 3x/week',
    item3Done: true,
    item4: 'Zero single-use plastics',
    item4Done: false,
    item5: 'Plant 10 trees this year',
    item5Done: false,
    completedCount: 3,
    bgColor: '#0D1F0D',
    textColor: '#E8F5E9',
    accentColor: '#4CAF50',
  },
  configSchema: [
    { key: 'title', label: 'Title', type: 'text', defaultValue: 'My Climate Goals', group: 'Content' },
    { key: 'item1', label: 'Item 1', type: 'text', defaultValue: 'Switch to green energy', group: 'Content' },
    { key: 'item1Done', label: 'Item 1 Done', type: 'boolean', defaultValue: true, group: 'Content' },
    { key: 'item2', label: 'Item 2', type: 'text', defaultValue: 'Reduce meat to 2x/week', group: 'Content' },
    { key: 'item2Done', label: 'Item 2 Done', type: 'boolean', defaultValue: true, group: 'Content' },
    { key: 'item3', label: 'Item 3', type: 'text', defaultValue: 'Bike to work 3x/week', group: 'Content' },
    { key: 'item3Done', label: 'Item 3 Done', type: 'boolean', defaultValue: true, group: 'Content' },
    { key: 'item4', label: 'Item 4', type: 'text', defaultValue: 'Zero single-use plastics', group: 'Content' },
    { key: 'item4Done', label: 'Item 4 Done', type: 'boolean', defaultValue: false, group: 'Content' },
    { key: 'item5', label: 'Item 5', type: 'text', defaultValue: 'Plant 10 trees this year', group: 'Content' },
    { key: 'item5Done', label: 'Item 5 Done', type: 'boolean', defaultValue: false, group: 'Content' },
    {
      key: 'completedCount',
      label: 'Completed Count',
      type: 'number',
      defaultValue: 3,
      min: 0,
      max: 5,
      group: 'Content',
    },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#0D1F0D', group: 'Style' },
    { key: 'textColor', label: 'Text Color', type: 'color', defaultValue: '#E8F5E9', group: 'Style' },
    { key: 'accentColor', label: 'Accent Color', type: 'color', defaultValue: '#4CAF50', group: 'Style' },
  ],
})
