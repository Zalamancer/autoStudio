import React from 'react'
import { registerMotionGraphic } from '../registry'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface RenovationBudgetConfig {
  projectName: string
  totalBudget: number
  items: string[]
  costs: number[]
  bgColor: string
  cardColor: string
  accentColor: string
  textColor: string
}

function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3)
}

function easeInCubic(t: number): number {
  return t * t * t
}

function SceneRenovationBudgetComponent({
  config,
  frame,
  durationInFrames,
}: MotionGraphicProps<RenovationBudgetConfig>) {
  const { projectName, totalBudget, items, costs, bgColor, cardColor, accentColor, textColor } = config
  const progress = frame / durationInFrames

  const enterEnd = 0.28
  const holdEnd = 0.8
  const enterProgress = Math.min(1, progress / enterEnd)
  const holdProgress = progress >= enterEnd && progress < holdEnd ? (progress - enterEnd) / (holdEnd - enterEnd) : progress >= holdEnd ? 1 : 0
  const exitProgress = progress >= holdEnd ? (progress - holdEnd) / (1 - holdEnd) : 0

  // Title
  const titleProgress = easeOutCubic(Math.min(1, enterProgress / 0.3))
  // Items cascade
  const getItemProgress = (idx: number) => {
    const delay = 0.25 + idx * 0.1
    return easeOutCubic(Math.max(0, Math.min(1, (enterProgress - delay) / 0.3)))
  }
  // Total bar
  const totalProgress = easeOutCubic(Math.max(0, Math.min(1, (enterProgress - 0.7) / 0.25)))

  // Hold: bar fill animations
  const barFill = easeOutCubic(Math.min(1, holdProgress / 0.4))

  // Exit
  const exitEased = easeInCubic(exitProgress)
  const exitOpacity = 1 - exitEased

  // Category colors for bars
  const barColors = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899']

  // Calculate totals
  const actualTotal = costs.reduce((sum, c) => sum + c, 0)
  const budgetDiff = totalBudget - actualTotal
  const isUnderBudget = budgetDiff >= 0

  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        overflow: 'hidden',
        background: bgColor,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: "'Helvetica Neue', Arial, sans-serif",
        padding: '5%',
      }}
    >
      <div
        style={{
          background: cardColor,
          borderRadius: 'clamp(16px, 2.5vw, 24px)',
          padding: 'clamp(18px, 4%, 32px)',
          maxWidth: 400,
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          gap: 'clamp(10px, 2vh, 18px)',
          opacity: exitOpacity,
          boxShadow: '0 10px 36px rgba(0,0,0,0.08)',
        }}
      >
        {/* Header */}
        <div style={{ opacity: titleProgress, transform: `translateY(${(1 - titleProgress) * 10}px)` }}>
          <div style={{ fontSize: 'clamp(9px, 1.3vw, 11px)', fontWeight: 700, color: accentColor, letterSpacing: 3, textTransform: 'uppercase' }}>
            RENOVATION BUDGET
          </div>
          <div style={{ fontSize: 'clamp(18px, 3.5vw, 28px)', fontWeight: 800, color: textColor, marginTop: 4 }}>
            {projectName}
          </div>
        </div>

        {/* Budget total */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'baseline',
            padding: 'clamp(8px, 1.5vh, 14px)',
            borderRadius: 'clamp(8px, 1.2vw, 12px)',
            background: `${accentColor}08`,
            opacity: titleProgress,
          }}
        >
          <span style={{ fontSize: 'clamp(10px, 1.5vw, 13px)', fontWeight: 600, color: `${textColor}60` }}>
            Total Budget
          </span>
          <span style={{ fontSize: 'clamp(20px, 4vw, 32px)', fontWeight: 900, color: accentColor }}>
            ${totalBudget.toLocaleString()}
          </span>
        </div>

        {/* Cost items */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'clamp(6px, 1.2vh, 10px)' }}>
          {items.map((item, i) => {
            const p = getItemProgress(i)
            const cost = costs[i] || 0
            const percent = totalBudget > 0 ? (cost / totalBudget) * 100 : 0
            const barColor = barColors[i % barColors.length]

            return (
              <div
                key={i}
                style={{
                  opacity: p,
                  transform: `translateX(${(1 - p) * 20}px)`,
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
                  <span style={{ fontSize: 'clamp(10px, 1.5vw, 13px)', fontWeight: 600, color: textColor }}>
                    {item}
                  </span>
                  <span style={{ fontSize: 'clamp(10px, 1.5vw, 13px)', fontWeight: 700, color: textColor }}>
                    ${Math.round(cost * p * barFill).toLocaleString()}
                  </span>
                </div>
                {/* Progress bar */}
                <div style={{ height: 'clamp(6px, 1vh, 10px)', borderRadius: 20, background: `${textColor}08`, overflow: 'hidden' }}>
                  <div
                    style={{
                      height: '100%',
                      width: `${percent * p * barFill}%`,
                      borderRadius: 20,
                      background: barColor,
                      boxShadow: `0 1px 4px ${barColor}40`,
                    }}
                  />
                </div>
              </div>
            )
          })}
        </div>

        {/* Divider */}
        <div style={{ height: 1, background: `${textColor}10`, opacity: totalProgress }} />

        {/* Total summary */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            opacity: totalProgress,
            transform: `translateY(${(1 - totalProgress) * 10}px)`,
          }}
        >
          <div>
            <div style={{ fontSize: 'clamp(10px, 1.5vw, 13px)', fontWeight: 600, color: `${textColor}60` }}>
              Spent / Budget
            </div>
            <div style={{ fontSize: 'clamp(16px, 3vw, 24px)', fontWeight: 800, color: textColor, marginTop: 2 }}>
              ${Math.round(actualTotal * barFill).toLocaleString()} / ${totalBudget.toLocaleString()}
            </div>
          </div>
          <div
            style={{
              padding: 'clamp(4px, 0.8vh, 8px) clamp(10px, 2vw, 16px)',
              borderRadius: 20,
              background: isUnderBudget ? '#10B98120' : '#EF444420',
              fontSize: 'clamp(10px, 1.5vw, 13px)',
              fontWeight: 700,
              color: isUnderBudget ? '#10B981' : '#EF4444',
            }}
          >
            {isUnderBudget ? 'UNDER' : 'OVER'} ${Math.abs(budgetDiff).toLocaleString()}
          </div>
        </div>
      </div>
    </div>
  )
}

registerMotionGraphic({
  id: 'tpl-scene-renovation-budget',
  title: 'Scene Renovation Budget',
  description: 'Renovation cost breakdown with animated progress bars, cascading line items, budget comparison, and under/over indicator',
  tags: ['scene', 'renovation', 'budget', 'cost', 'architecture', 'construction', 'interior', 'finance'],
  category: 'scene-layout',
  component: SceneRenovationBudgetComponent as unknown as React.ComponentType<MotionGraphicProps>,
  configSchema: [
    { key: 'projectName', label: 'Project Name', type: 'text', defaultValue: 'Kitchen Renovation', group: 'Content' },
    { key: 'totalBudget', label: 'Total Budget', type: 'number', defaultValue: 45000, min: 100, max: 9999999, group: 'Content' },
    { key: 'items', label: 'Budget Items', type: 'text-array', defaultValue: ['Cabinets', 'Countertops', 'Appliances', 'Flooring', 'Labor'], group: 'Content' },
    { key: 'costs', label: 'Costs', type: 'text-array', defaultValue: [12000, 8500, 9000, 4500, 8000] as any, group: 'Content' },
    { key: 'accentColor', label: 'Accent Color', type: 'color', defaultValue: '#1E3A5F', group: 'Style' },
    { key: 'cardColor', label: 'Card Color', type: 'color', defaultValue: '#FFFFFF', group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#F0F4F8', group: 'Style' },
    { key: 'textColor', label: 'Text Color', type: 'color', defaultValue: '#1E293B', group: 'Style' },
  ],
  defaultConfig: {
    projectName: 'Kitchen Renovation',
    totalBudget: 45000,
    items: ['Cabinets', 'Countertops', 'Appliances', 'Flooring', 'Labor'],
    costs: [12000, 8500, 9000, 4500, 8000],
    accentColor: '#1E3A5F',
    cardColor: '#FFFFFF',
    bgColor: '#F0F4F8',
    textColor: '#1E293B',
  },
})
