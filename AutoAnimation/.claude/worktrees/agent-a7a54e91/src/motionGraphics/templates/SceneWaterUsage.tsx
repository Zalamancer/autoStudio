import React from 'react'
import { registerMotionGraphic } from '../registry'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface WaterUsageConfig {
  totalLiters: number
  showerLiters: number
  laundryLiters: number
  kitchenLiters: number
  gardenLiters: number
  goalLiters: number
  bgColor: string
  textColor: string
  accentColor: string
}

function easeOutCubic(t: number): number { return 1 - Math.pow(1 - t, 3) }
function easeInCubic(t: number): number { return t * t * t }

function SceneWaterUsageComponent({ config, progress }: MotionGraphicProps<WaterUsageConfig>) {
  const { totalLiters, showerLiters, laundryLiters, kitchenLiters, gardenLiters, goalLiters, bgColor, textColor, accentColor } = config

  const enterProgress = progress < 0.2 ? progress / 0.2 : 1
  const holdProgress = progress >= 0.2 && progress < 0.8 ? (progress - 0.2) / 0.6 : progress >= 0.8 ? 1 : 0
  const exitProgress = progress >= 0.8 ? (progress - 0.8) / 0.2 : 0

  const exitEased = easeInCubic(exitProgress)
  const exitOpacity = exitProgress > 0 ? 1 - exitEased : 1

  // Counter
  const counterProg = easeOutCubic(Math.min(1, enterProgress / 0.6))
  const displayTotal = Math.round(counterProg * totalLiters)

  // Water fill level
  const fillPercent = totalLiters / goalLiters
  const fillHeight = easeOutCubic(Math.max(0, Math.min(1, (enterProgress - 0.1) / 0.6))) * Math.min(fillPercent, 1) * 100
  const isOverGoal = totalLiters > goalLiters

  // Breakdown items
  const items = [
    { label: 'Shower', value: showerLiters, icon: '\u{1F6BF}' },
    { label: 'Laundry', value: laundryLiters, icon: '\u{1F455}' },
    { label: 'Kitchen', value: kitchenLiters, icon: '\u{1F373}' },
    { label: 'Garden', value: gardenLiters, icon: '\u{1F33B}' },
  ]
  const getItemProgress = (idx: number) =>
    easeOutCubic(Math.max(0, Math.min(1, (enterProgress - 0.4 - idx * 0.08) / 0.35)))

  // Wave animation during hold
  const waveOffset = holdProgress * 360

  return (
    <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', fontFamily: "'Inter', 'Helvetica Neue', sans-serif" }}>
      <div style={{ position: 'absolute', inset: 0, background: bgColor }} />

      <div
        style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '6%',
          opacity: exitOpacity,
          transform: `translateY(${exitEased * 30}px)`,
        }}
      >
        {/* Header */}
        <div
          style={{
            fontSize: 'clamp(10px, 1.6vw, 13px)',
            fontWeight: 700,
            color: accentColor,
            textTransform: 'uppercase',
            letterSpacing: 3,
            marginBottom: 'clamp(6px, 1vh, 12px)',
            opacity: easeOutCubic(Math.min(1, enterProgress / 0.3)),
          }}
        >
          {'💧'} Daily Water Usage
        </div>

        {/* Water bottle / tank visual */}
        <div
          style={{
            position: 'relative',
            width: 'clamp(80px, 18vw, 120px)',
            height: 'clamp(140px, 30vw, 200px)',
            border: `2px solid ${accentColor}50`,
            borderRadius: 'clamp(8px, 1.5vw, 12px)',
            overflow: 'hidden',
            marginBottom: 'clamp(12px, 2vh, 20px)',
            background: `${textColor}08`,
          }}
        >
          {/* Water fill */}
          <div
            style={{
              position: 'absolute',
              bottom: 0,
              left: 0,
              right: 0,
              height: `${fillHeight}%`,
              background: isOverGoal
                ? 'linear-gradient(180deg, rgba(244,67,54,0.4), rgba(244,67,54,0.6))'
                : `linear-gradient(180deg, ${accentColor}60, ${accentColor}90)`,
              transition: 'none',
            }}
          />
          {/* Wave surface */}
          {fillHeight > 5 && (
            <div
              style={{
                position: 'absolute',
                bottom: `${fillHeight - 3}%`,
                left: '-20%',
                width: '140%',
                height: '12px',
                background: `linear-gradient(90deg, transparent, ${accentColor}40, transparent, ${accentColor}40, transparent)`,
                backgroundSize: '50% 100%',
                backgroundPosition: `${waveOffset}px 0`,
                borderRadius: '50%',
              }}
            />
          )}
          {/* Goal line */}
          <div
            style={{
              position: 'absolute',
              bottom: '100%',
              left: '-4px',
              right: '-4px',
              height: '2px',
              background: `${textColor}40`,
              borderRadius: '1px',
            }}
          >
            <span
              style={{
                position: 'absolute',
                right: '-40px',
                top: '-8px',
                fontSize: '8px',
                color: `${textColor}66`,
                fontWeight: 600,
              }}
            >
              GOAL
            </span>
          </div>
          {/* Center number */}
          <div
            style={{
              position: 'absolute',
              inset: 0,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 1,
            }}
          >
            <div style={{ fontSize: 'clamp(24px, 6vw, 40px)', fontWeight: 900, color: textColor, lineHeight: 1 }}>
              {displayTotal}
            </div>
            <div style={{ fontSize: 'clamp(9px, 1.4vw, 12px)', color: `${textColor}88`, fontWeight: 600 }}>
              liters
            </div>
          </div>
        </div>

        {/* Goal comparison */}
        <div
          style={{
            fontSize: 'clamp(11px, 1.8vw, 15px)',
            fontWeight: 600,
            color: isOverGoal ? '#EF5350' : '#66BB6A',
            marginBottom: 'clamp(12px, 2vh, 20px)',
            opacity: easeOutCubic(Math.max(0, (enterProgress - 0.3) / 0.4)),
          }}
        >
          {isOverGoal ? `${totalLiters - goalLiters}L over goal` : `${goalLiters - totalLiters}L under goal`}
        </div>

        {/* Breakdown grid */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'clamp(6px, 1vw, 12px)', width: '100%', maxWidth: '360px' }}>
          {items.map((item, i) => {
            const itemProg = getItemProgress(i)
            const barWidth = easeOutCubic(itemProg) * (item.value / totalLiters) * 100
            return (
              <div
                key={i}
                style={{
                  background: `${textColor}08`,
                  borderRadius: 'clamp(6px, 1vw, 10px)',
                  padding: 'clamp(8px, 1.5vw, 14px)',
                  opacity: itemProg,
                  transform: `translateY(${(1 - itemProg) * 15}px)`,
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 'clamp(4px, 0.8vw, 8px)', marginBottom: '4px' }}>
                  <span style={{ fontSize: 'clamp(14px, 3vw, 20px)' }}>{item.icon}</span>
                  <span style={{ fontSize: 'clamp(10px, 1.6vw, 13px)', color: `${textColor}aa`, fontWeight: 600 }}>
                    {item.label}
                  </span>
                </div>
                <div style={{ fontSize: 'clamp(16px, 3.5vw, 24px)', fontWeight: 800, color: textColor, marginBottom: '4px' }}>
                  {Math.round(itemProg * item.value)}L
                </div>
                <div
                  style={{
                    width: '100%',
                    height: '3px',
                    background: `${textColor}15`,
                    borderRadius: '2px',
                    overflow: 'hidden',
                  }}
                >
                  <div
                    style={{
                      width: `${barWidth}%`,
                      height: '100%',
                      background: accentColor,
                      borderRadius: '2px',
                    }}
                  />
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
  id: 'tpl-scene-water-usage',
  title: 'Water Usage',
  description: 'Water consumption tracker with animated fill tank, goal comparison, and categorized usage breakdown grid.',
  tags: ['scene', 'water', 'usage', 'eco', 'sustainability', 'conservation', 'tracker'],
  category: 'scene-layout',
  component: SceneWaterUsageComponent as any,
  defaultConfig: {
    totalLiters: 142,
    showerLiters: 55,
    laundryLiters: 38,
    kitchenLiters: 30,
    gardenLiters: 19,
    goalLiters: 150,
    bgColor: '#0a1a2a',
    textColor: '#E3F2FD',
    accentColor: '#29B6F6',
  },
  configSchema: [
    { key: 'totalLiters', label: 'Total Liters', type: 'number', defaultValue: 142, min: 0, max: 9999, group: 'Content' },
    { key: 'showerLiters', label: 'Shower', type: 'number', defaultValue: 55, min: 0, max: 999, group: 'Content' },
    { key: 'laundryLiters', label: 'Laundry', type: 'number', defaultValue: 38, min: 0, max: 999, group: 'Content' },
    { key: 'kitchenLiters', label: 'Kitchen', type: 'number', defaultValue: 30, min: 0, max: 999, group: 'Content' },
    { key: 'gardenLiters', label: 'Garden', type: 'number', defaultValue: 19, min: 0, max: 999, group: 'Content' },
    { key: 'goalLiters', label: 'Goal Liters', type: 'number', defaultValue: 150, min: 1, max: 9999, group: 'Content' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#0a1a2a', group: 'Style' },
    { key: 'textColor', label: 'Text Color', type: 'color', defaultValue: '#E3F2FD', group: 'Style' },
    { key: 'accentColor', label: 'Accent Color', type: 'color', defaultValue: '#29B6F6', group: 'Style' },
  ],
})
