import React from 'react'
import { registerMotionGraphic } from '../registry'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface ZeroWasteGoalConfig {
  title: string
  currentKg: number
  previousKg: number
  goalKg: number
  cat1: string
  cat1Kg: number
  cat2: string
  cat2Kg: number
  cat3: string
  cat3Kg: number
  streakDays: number
  bgColor: string
  textColor: string
  accentColor: string
}

function easeOutCubic(t: number): number { return 1 - Math.pow(1 - t, 3) }
function easeInCubic(t: number): number { return t * t * t }
function easeOutBack(t: number): number {
  const c1 = 1.70158
  const c3 = c1 + 1
  return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2)
}

function SceneZeroWasteGoalComponent({ config, progress }: MotionGraphicProps<ZeroWasteGoalConfig>) {
  const { title, currentKg, previousKg, goalKg, cat1, cat1Kg, cat2, cat2Kg, cat3, cat3Kg, streakDays, bgColor, textColor, accentColor } = config

  const enterProgress = progress < 0.2 ? progress / 0.2 : 1
  const holdProgress = progress >= 0.2 && progress < 0.8 ? (progress - 0.2) / 0.6 : progress >= 0.8 ? 1 : 0
  const exitProgress = progress >= 0.8 ? (progress - 0.8) / 0.2 : 0

  const exitEased = easeInCubic(exitProgress)
  const exitOpacity = exitProgress > 0 ? 1 - exitEased : 1

  const titleEnter = easeOutCubic(Math.min(1, enterProgress / 0.3))

  // Main counter
  const counterProg = easeOutCubic(Math.max(0, Math.min(1, (enterProgress - 0.1) / 0.5)))
  const displayKg = (counterProg * currentKg).toFixed(1)

  // Comparison
  const reduction = previousKg - currentKg
  const reductionPercent = Math.round((reduction / previousKg) * 100)
  const compProg = easeOutCubic(Math.max(0, Math.min(1, (enterProgress - 0.3) / 0.3)))

  // Goal gauge
  const gaugeProg = easeOutCubic(Math.max(0, Math.min(1, (enterProgress - 0.2) / 0.5)))
  const goalProgress = Math.min(1, 1 - (currentKg / previousKg))
  const goalBarWidth = gaugeProg * goalProgress * 100

  // Categories
  const categories = [
    { name: cat1, value: cat1Kg, icon: '\u{1F6D2}' },
    { name: cat2, value: cat2Kg, icon: '\u{1F37D}\uFE0F' },
    { name: cat3, value: cat3Kg, icon: '\u{1F4E6}' },
  ]
  const getCatProg = (idx: number) =>
    easeOutCubic(Math.max(0, Math.min(1, (enterProgress - 0.45 - idx * 0.08) / 0.3)))

  // Streak badge
  const streakProg = easeOutBack(Math.max(0, Math.min(1, (enterProgress - 0.65) / 0.25)))

  // Pulse effect on main number
  const counterPulse = progress >= 0.2 && progress < 0.8
    ? 1 + Math.sin(holdProgress * Math.PI * 5) * 0.02
    : 1

  // Target arrow indicator
  const targetReached = currentKg <= goalKg

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
          padding: '5%',
          opacity: exitOpacity,
          transform: `translateY(${exitEased * 25}px)`,
        }}
      >
        {/* Title */}
        <div
          style={{
            textAlign: 'center',
            marginBottom: 'clamp(12px, 2vh, 20px)',
            opacity: titleEnter,
            transform: `translateY(${(1 - titleEnter) * 12}px)`,
          }}
        >
          <div style={{ fontSize: 'clamp(10px, 1.6vw, 13px)', fontWeight: 700, color: accentColor, textTransform: 'uppercase', letterSpacing: 3, marginBottom: '4px' }}>
            \u267B\uFE0F Zero Waste Tracker
          </div>
          <div style={{ fontSize: 'clamp(20px, 5vw, 34px)', fontWeight: 900, color: textColor }}>
            {title}
          </div>
        </div>

        {/* Main waste number */}
        <div
          style={{
            textAlign: 'center',
            marginBottom: 'clamp(6px, 1vh, 12px)',
            transform: `scale(${counterPulse})`,
          }}
        >
          <div style={{ fontSize: 'clamp(40px, 10vw, 68px)', fontWeight: 900, color: textColor, lineHeight: 1 }}>
            {displayKg}
            <span style={{ fontSize: '0.35em', fontWeight: 600, color: `${textColor}88`, marginLeft: '4px' }}>
              kg
            </span>
          </div>
          <div style={{ fontSize: 'clamp(10px, 1.5vw, 12px)', color: `${textColor}66`, fontWeight: 500 }}>
            waste this week
          </div>
        </div>

        {/* Comparison badge */}
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            background: reduction > 0 ? 'rgba(76,175,80,0.15)' : 'rgba(244,67,54,0.15)',
            borderRadius: '100px',
            padding: 'clamp(4px, 0.8vw, 6px) clamp(12px, 2.5vw, 18px)',
            marginBottom: 'clamp(14px, 2.5vh, 22px)',
            opacity: compProg,
            transform: `scale(${compProg})`,
          }}
        >
          <span style={{ fontSize: 'clamp(12px, 2vw, 15px)', fontWeight: 700, color: reduction > 0 ? '#4CAF50' : '#EF5350' }}>
            {reduction > 0 ? '\u2193' : '\u2191'} {Math.abs(reductionPercent)}%
          </span>
          <span style={{ fontSize: 'clamp(10px, 1.5vw, 12px)', color: `${textColor}88`, fontWeight: 500 }}>
            vs last week
          </span>
        </div>

        {/* Goal progress bar */}
        <div
          style={{
            width: '100%',
            maxWidth: '340px',
            marginBottom: 'clamp(14px, 2.5vh, 22px)',
            opacity: gaugeProg,
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
            <span style={{ fontSize: 'clamp(10px, 1.5vw, 12px)', color: `${textColor}88`, fontWeight: 600 }}>
              Reduction Goal
            </span>
            <span style={{ fontSize: 'clamp(10px, 1.5vw, 12px)', color: targetReached ? '#4CAF50' : accentColor, fontWeight: 700 }}>
              {targetReached ? 'Goal reached!' : `Target: ${goalKg}kg`}
            </span>
          </div>
          <div style={{ width: '100%', height: 'clamp(8px, 1.5vw, 12px)', background: `${textColor}12`, borderRadius: '6px', overflow: 'hidden' }}>
            <div
              style={{
                width: `${Math.min(goalBarWidth, 100)}%`,
                height: '100%',
                background: targetReached
                  ? 'linear-gradient(90deg, #4CAF50, #66BB6A)'
                  : `linear-gradient(90deg, ${accentColor}cc, ${accentColor})`,
                borderRadius: '6px',
                boxShadow: `0 0 8px ${targetReached ? '#4CAF5040' : `${accentColor}30`}`,
              }}
            />
          </div>
        </div>

        {/* Category breakdown */}
        <div style={{ display: 'flex', gap: 'clamp(6px, 1.2vw, 12px)', width: '100%', maxWidth: '380px', marginBottom: 'clamp(12px, 2vh, 18px)' }}>
          {categories.map((cat, i) => {
            const catProg = getCatProg(i)
            const catBarWidth = (cat.value / currentKg) * 100
            return (
              <div
                key={i}
                style={{
                  flex: 1,
                  background: `${textColor}08`,
                  borderRadius: 'clamp(6px, 1vw, 10px)',
                  padding: 'clamp(8px, 1.5vw, 14px)',
                  textAlign: 'center',
                  opacity: catProg,
                  transform: `translateY(${(1 - catProg) * 12}px)`,
                }}
              >
                <div style={{ fontSize: 'clamp(16px, 3.5vw, 22px)', marginBottom: '4px' }}>{cat.icon}</div>
                <div style={{ fontSize: 'clamp(9px, 1.3vw, 11px)', color: `${textColor}77`, fontWeight: 500, marginBottom: '2px' }}>
                  {cat.name}
                </div>
                <div style={{ fontSize: 'clamp(14px, 3vw, 20px)', fontWeight: 800, color: textColor }}>
                  {(catProg * cat.value).toFixed(1)}kg
                </div>
                <div style={{ width: '100%', height: '3px', background: `${textColor}15`, borderRadius: '2px', marginTop: '6px', overflow: 'hidden' }}>
                  <div style={{ width: `${catProg * catBarWidth}%`, height: '100%', background: accentColor, borderRadius: '2px' }} />
                </div>
              </div>
            )
          })}
        </div>

        {/* Streak badge */}
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            background: `${accentColor}15`,
            border: `1.5px solid ${accentColor}30`,
            borderRadius: '100px',
            padding: 'clamp(6px, 1vw, 10px) clamp(14px, 3vw, 22px)',
            transform: `scale(${streakProg})`,
            opacity: streakProg,
          }}
        >
          <span style={{ fontSize: 'clamp(14px, 3vw, 18px)' }}>\u{1F525}</span>
          <span style={{ fontSize: 'clamp(12px, 2vw, 15px)', fontWeight: 700, color: accentColor }}>
            {Math.round(streakProg * streakDays)} day streak
          </span>
        </div>
      </div>
    </div>
  )
}

registerMotionGraphic({
  id: 'tpl-scene-zero-waste-goal',
  title: 'Zero Waste Goal',
  description: 'Zero waste goal tracker with animated waste counter, week-over-week comparison, reduction goal bar, category breakdown, and streak badge.',
  tags: ['scene', 'zero waste', 'goal', 'tracker', 'eco', 'sustainability', 'waste', 'reduce'],
  category: 'scene-layout',
  component: SceneZeroWasteGoalComponent as any,
  defaultConfig: {
    title: 'Weekly Waste Report',
    currentKg: 2.3,
    previousKg: 3.8,
    goalKg: 2.0,
    cat1: 'Shopping',
    cat1Kg: 0.9,
    cat2: 'Food',
    cat2Kg: 0.8,
    cat3: 'Packaging',
    cat3Kg: 0.6,
    streakDays: 14,
    bgColor: '#0D1F0D',
    textColor: '#E8F5E9',
    accentColor: '#4CAF50',
  },
  configSchema: [
    { key: 'title', label: 'Title', type: 'text', defaultValue: 'Weekly Waste Report', group: 'Content' },
    { key: 'currentKg', label: 'Current (kg)', type: 'number', defaultValue: 2.3, min: 0, max: 999, group: 'Content' },
    { key: 'previousKg', label: 'Previous (kg)', type: 'number', defaultValue: 3.8, min: 0, max: 999, group: 'Content' },
    { key: 'goalKg', label: 'Goal (kg)', type: 'number', defaultValue: 2.0, min: 0, max: 999, group: 'Content' },
    { key: 'cat1', label: 'Category 1', type: 'text', defaultValue: 'Shopping', group: 'Content' },
    { key: 'cat1Kg', label: 'Category 1 (kg)', type: 'number', defaultValue: 0.9, min: 0, max: 999, group: 'Content' },
    { key: 'cat2', label: 'Category 2', type: 'text', defaultValue: 'Food', group: 'Content' },
    { key: 'cat2Kg', label: 'Category 2 (kg)', type: 'number', defaultValue: 0.8, min: 0, max: 999, group: 'Content' },
    { key: 'cat3', label: 'Category 3', type: 'text', defaultValue: 'Packaging', group: 'Content' },
    { key: 'cat3Kg', label: 'Category 3 (kg)', type: 'number', defaultValue: 0.6, min: 0, max: 999, group: 'Content' },
    { key: 'streakDays', label: 'Streak Days', type: 'number', defaultValue: 14, min: 0, max: 999, group: 'Content' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#0D1F0D', group: 'Style' },
    { key: 'textColor', label: 'Text Color', type: 'color', defaultValue: '#E8F5E9', group: 'Style' },
    { key: 'accentColor', label: 'Accent Color', type: 'color', defaultValue: '#4CAF50', group: 'Style' },
  ],
})
