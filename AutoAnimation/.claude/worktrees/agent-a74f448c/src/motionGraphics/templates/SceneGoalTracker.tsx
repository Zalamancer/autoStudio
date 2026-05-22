import React from 'react'
import { registerMotionGraphic } from '../registry'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface GoalTrackerConfig {
  goalName: string
  percentage: number
  daysRemaining: number
  milestones: string[]
  bgColor: string
  ringColor: string
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

function SceneGoalTrackerComponent({ config, progress }: MotionGraphicProps<GoalTrackerConfig>) {
  const { goalName, percentage, daysRemaining, milestones, bgColor, ringColor, textColor, accentColor } = config

  const enterProgress = progress < 0.3 ? progress / 0.3 : 1
  const holdProgress = progress >= 0.3 && progress < 0.8 ? (progress - 0.3) / 0.5 : 0
  const exitProgress = progress >= 0.8 ? (progress - 0.8) / 0.2 : 0

  const exitEased = easeInCubic(exitProgress)
  const exitOpacity = exitProgress > 0 ? 1 - exitEased : 1
  const exitScale = exitProgress > 0 ? 1 - exitEased * 0.15 : 1

  // Goal name enters
  const nameEnter = easeOutCubic(Math.min(1, enterProgress / 0.3))

  // Ring animates
  const ringEnter = easeOutCubic(Math.max(0, Math.min(1, (enterProgress - 0.1) / 0.6)))
  const currentPercent = percentage * ringEnter
  const displayPercent = Math.round(currentPercent)

  const radius = 80
  const strokeWidth = 12
  const circumference = 2 * Math.PI * radius
  const dashOffset = circumference * (1 - currentPercent / 100)

  // Glow pulse during hold
  const isHolding = progress >= 0.3 && progress < 0.8
  const glowSize = isHolding ? 8 + Math.sin(holdProgress * Math.PI * 6) * 5 : 8

  // Days remaining counter
  const daysEnter = easeOutCubic(Math.max(0, Math.min(1, (enterProgress - 0.4) / 0.25)))
  const displayDays = Math.round(daysRemaining * daysEnter)

  // Milestones stagger in
  const getMilestoneProgress = (index: number): number => {
    const start = 0.5 + (index / milestones.length) * 0.4
    return easeOutCubic(Math.max(0, Math.min(1, (enterProgress - start) / 0.2)))
  }

  // Check which milestones are "completed" based on percentage
  const completedCount = Math.floor((percentage / 100) * milestones.length)

  return (
    <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', background: bgColor, fontFamily: "'Inter', 'Helvetica Neue', sans-serif" }}>
      <div
        style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '6% 8%',
          opacity: exitOpacity,
          transform: `scale(${exitScale})`,
        }}
      >
        {/* Goal name */}
        <div
          style={{
            fontSize: 'clamp(14px, 2.5vw, 22px)',
            fontWeight: 600,
            color: `${textColor}88`,
            textTransform: 'uppercase',
            letterSpacing: '0.12em',
            opacity: nameEnter,
            transform: `translateY(${(1 - nameEnter) * -15}px)`,
            marginBottom: 'clamp(4px, 0.8vh, 8px)',
          }}
        >
          GOAL
        </div>
        <div
          style={{
            fontSize: 'clamp(20px, 5vw, 40px)',
            fontWeight: 900,
            color: textColor,
            opacity: nameEnter,
            transform: `translateY(${(1 - nameEnter) * -10}px)`,
            marginBottom: 'clamp(16px, 3vh, 32px)',
            textAlign: 'center',
            lineHeight: 1.2,
          }}
        >
          {goalName}
        </div>

        {/* Progress ring */}
        <div style={{ position: 'relative', width: 'clamp(130px, 30vw, 220px)', height: 'clamp(130px, 30vw, 220px)', marginBottom: 'clamp(12px, 2vh, 24px)' }}>
          <svg viewBox={`0 0 ${(radius + strokeWidth) * 2} ${(radius + strokeWidth) * 2}`} style={{ width: '100%', height: '100%' }}>
            {/* Track */}
            <circle
              cx={radius + strokeWidth}
              cy={radius + strokeWidth}
              r={radius}
              fill="none"
              stroke={`${ringColor}20`}
              strokeWidth={strokeWidth}
            />
            {/* Progress */}
            <circle
              cx={radius + strokeWidth}
              cy={radius + strokeWidth}
              r={radius}
              fill="none"
              stroke={ringColor}
              strokeWidth={strokeWidth}
              strokeDasharray={circumference}
              strokeDashoffset={dashOffset}
              strokeLinecap="round"
              transform={`rotate(-90 ${radius + strokeWidth} ${radius + strokeWidth})`}
              style={{ filter: `drop-shadow(0 0 ${glowSize}px ${ringColor}80)` }}
            />
          </svg>

          {/* Percentage in center */}
          <div
            style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              textAlign: 'center',
            }}
          >
            <div style={{ fontSize: 'clamp(28px, 7vw, 56px)', fontWeight: 900, color: textColor, fontVariantNumeric: 'tabular-nums' }}>
              {displayPercent}<span style={{ fontSize: '0.45em', opacity: 0.6 }}>%</span>
            </div>
          </div>
        </div>

        {/* Days remaining badge */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 'clamp(6px, 1vw, 12px)',
            background: `${accentColor}15`,
            padding: 'clamp(6px, 1vh, 12px) clamp(14px, 2.5vw, 24px)',
            borderRadius: 100,
            opacity: daysEnter,
            transform: `scale(${easeOutBack(daysEnter)})`,
            marginBottom: 'clamp(16px, 3vh, 28px)',
          }}
        >
          <svg viewBox="0 0 16 16" style={{ width: 16, height: 16 }}>
            <circle cx="8" cy="8" r="7" fill="none" stroke={accentColor} strokeWidth="1.2" />
            <line x1="8" y1="4" x2="8" y2="8" stroke={accentColor} strokeWidth="1.2" strokeLinecap="round" />
            <line x1="8" y1="8" x2="11" y2="10" stroke={accentColor} strokeWidth="1.2" strokeLinecap="round" />
          </svg>
          <span style={{ fontSize: 'clamp(12px, 2vw, 16px)', fontWeight: 700, color: accentColor, fontVariantNumeric: 'tabular-nums' }}>
            {displayDays} days left
          </span>
        </div>

        {/* Milestone markers */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'clamp(6px, 1vh, 12px)', width: '100%', maxWidth: 360 }}>
          {milestones.map((milestone, i) => {
            const milestoneProg = getMilestoneProgress(i)
            const isCompleted = i < completedCount
            return (
              <div
                key={i}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 'clamp(8px, 1.5vw, 14px)',
                  opacity: milestoneProg,
                  transform: `translateX(${(1 - milestoneProg) * 25}px)`,
                }}
              >
                {/* Check circle */}
                <div
                  style={{
                    width: 'clamp(18px, 3vw, 26px)',
                    height: 'clamp(18px, 3vw, 26px)',
                    borderRadius: '50%',
                    border: `2px solid ${isCompleted ? ringColor : `${textColor}30`}`,
                    background: isCompleted ? ringColor : 'transparent',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}
                >
                  {isCompleted && (
                    <svg viewBox="0 0 12 12" style={{ width: '60%', height: '60%' }}>
                      <path d="M2 6l3 3 5-5" fill="none" stroke="#FFFFFF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  )}
                </div>
                <span
                  style={{
                    fontSize: 'clamp(11px, 2vw, 16px)',
                    fontWeight: 500,
                    color: isCompleted ? textColor : `${textColor}66`,
                    textDecoration: isCompleted ? 'line-through' : 'none',
                  }}
                >
                  {milestone}
                </span>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

registerMotionGraphic({
  id: 'tpl-scene-goal-tracker',
  title: 'Goal Tracker',
  description: 'Goal progress ring with percentage counter, days remaining badge, and milestone checklist',
  tags: ['scene', 'goal', 'progress', 'tracker', 'lifestyle', 'personal', 'productivity'],
  category: 'scene-layout',
  component: SceneGoalTrackerComponent as any,
  defaultConfig: {
    goalName: 'Run a Marathon',
    percentage: 65,
    daysRemaining: 42,
    milestones: ['Complete 5K run', 'Join running club', 'Finish half marathon', 'Race day prep'],
    bgColor: '#0f172a',
    ringColor: '#22c55e',
    textColor: '#f8fafc',
    accentColor: '#f59e0b',
  },
  configSchema: [
    { key: 'goalName', label: 'Goal Name', type: 'text', defaultValue: 'Run a Marathon', group: 'Content' },
    { key: 'percentage', label: 'Progress (%)', type: 'number', defaultValue: 65, min: 0, max: 100, group: 'Content' },
    { key: 'daysRemaining', label: 'Days Remaining', type: 'number', defaultValue: 42, min: 0, max: 999, group: 'Content' },
    { key: 'milestones', label: 'Milestones', type: 'text-array', defaultValue: ['Complete 5K run', 'Join running club', 'Finish half marathon', 'Race day prep'], group: 'Content' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#0f172a', group: 'Style' },
    { key: 'ringColor', label: 'Ring Color', type: 'color', defaultValue: '#22c55e', group: 'Style' },
    { key: 'textColor', label: 'Text Color', type: 'color', defaultValue: '#f8fafc', group: 'Style' },
    { key: 'accentColor', label: 'Accent Color', type: 'color', defaultValue: '#f59e0b', group: 'Style' },
  ],
})
