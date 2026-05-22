import React from 'react'
import { registerMotionGraphic } from '../registry'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface SceneRewardChartConfig {
  childName: string
  tasks: string[]
  completedCount: number
  totalStars: number
  bgColor: string
  cardColor: string
  accentColor: string
  textColor: string
}

function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3)
}

function easeOutBack(t: number): number {
  const c1 = 1.70158
  const c3 = c1 + 1
  return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2)
}

function easeInCubic(t: number): number {
  return t * t * t
}

function SceneRewardChartComponent({ config, progress }: MotionGraphicProps<SceneRewardChartConfig>) {
  const { childName, tasks, completedCount, totalStars, bgColor, cardColor, accentColor, textColor } = config

  const enterProgress = progress < 0.2 ? progress / 0.2 : 1
  const holdProgress = progress >= 0.2 && progress < 0.8 ? (progress - 0.2) / 0.6 : progress >= 0.8 ? 1 : 0
  const exitProgress = progress >= 0.8 ? (progress - 0.8) / 0.2 : 0

  const cardScale = enterProgress < 1
    ? easeOutBack(enterProgress)
    : exitProgress > 0
      ? 1 - easeInCubic(exitProgress) * 0.2
      : 1
  const cardOpacity = exitProgress > 0 ? 1 - easeInCubic(exitProgress) : easeOutCubic(enterProgress)

  // Stars fill up during hold phase
  const filledStars = Math.min(completedCount, Math.floor(holdProgress * (completedCount + 1)))

  // Task checkmarks appear staggered
  const tasksShown = Math.min(tasks.length, Math.floor(enterProgress * (tasks.length + 2)))

  // Trophy bounce when all done
  const allDone = filledStars === totalStars
  const trophyBounce = allDone && holdProgress > 0.7 ? Math.sin((holdProgress - 0.7) * 30) * 5 : 0

  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        background: bgColor,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
        fontFamily: "'Fredoka One', 'Comic Sans MS', cursive, sans-serif",
      }}
    >
      {/* Confetti dots */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          backgroundImage: `radial-gradient(circle, ${accentColor}08 3px, transparent 3px)`,
          backgroundSize: '24px 24px',
        }}
      />

      <div
        style={{
          transform: `scale(${cardScale})`,
          opacity: cardOpacity,
          width: '88%',
          maxWidth: '500px',
        }}
      >
        <div
          style={{
            background: cardColor,
            borderRadius: 'clamp(16px, 3vw, 28px)',
            padding: 'clamp(18px, 4vw, 36px)',
            boxShadow: '0 8px 32px rgba(0,0,0,0.08)',
            border: `3px solid ${accentColor}30`,
          }}
        >
          {/* Header */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: 'clamp(12px, 3vw, 24px)',
            }}
          >
            <div>
              <div
                style={{
                  fontSize: 'clamp(10px, 2vw, 14px)',
                  fontWeight: 700,
                  color: accentColor,
                  textTransform: 'uppercase',
                  letterSpacing: '0.1em',
                  marginBottom: '4px',
                }}
              >
                {'\u2B50'} Reward Chart
              </div>
              <div
                style={{
                  fontSize: 'clamp(20px, 5vw, 36px)',
                  fontWeight: 700,
                  color: textColor,
                  lineHeight: 1.1,
                }}
              >
                {childName}
              </div>
            </div>
            {/* Trophy */}
            <div
              style={{
                fontSize: 'clamp(28px, 6vw, 48px)',
                transform: `translateY(${trophyBounce}px)`,
                opacity: allDone ? 1 : 0.3,
              }}
            >
              {'\u{1F3C6}'}
            </div>
          </div>

          {/* Star progress bar */}
          <div
            style={{
              display: 'flex',
              gap: 'clamp(3px, 0.6vw, 6px)',
              marginBottom: 'clamp(14px, 3vw, 24px)',
              flexWrap: 'wrap',
              justifyContent: 'center',
            }}
          >
            {Array.from({ length: totalStars }).map((_, i) => {
              const isFilled = i < filledStars
              const justFilled = i === filledStars - 1
              const starScale = justFilled ? 1.3 : isFilled ? 1 : 0.8

              return (
                <div
                  key={i}
                  style={{
                    fontSize: 'clamp(18px, 4vw, 32px)',
                    transform: `scale(${starScale})`,
                    opacity: isFilled ? 1 : 0.2,
                    filter: isFilled ? `drop-shadow(0 0 4px ${accentColor}60)` : 'none',
                  }}
                >
                  {'\u2B50'}
                </div>
              )
            })}
          </div>

          {/* Progress text */}
          <div
            style={{
              textAlign: 'center',
              fontSize: 'clamp(11px, 2vw, 16px)',
              fontWeight: 600,
              color: `${textColor}88`,
              marginBottom: 'clamp(12px, 3vw, 20px)',
            }}
          >
            {filledStars} / {totalStars} stars earned
          </div>

          {/* Task list */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'clamp(6px, 1.5vw, 12px)' }}>
            {tasks.map((task, i) => {
              const isShown = i < tasksShown
              const isCompleted = i < completedCount
              const taskProgress = holdProgress > i * 0.15
                ? easeOutCubic(Math.min(1, (holdProgress - i * 0.15) / 0.3))
                : 0

              return (
                <div
                  key={i}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 'clamp(8px, 1.5vw, 14px)',
                    padding: 'clamp(6px, 1.2vw, 10px) clamp(10px, 2vw, 16px)',
                    borderRadius: 'clamp(8px, 1.5vw, 14px)',
                    background: isCompleted && taskProgress > 0.5 ? `${accentColor}10` : `${textColor}04`,
                    border: `2px solid ${isCompleted && taskProgress > 0.5 ? accentColor + '30' : textColor + '08'}`,
                    opacity: isShown ? 1 : 0,
                    transform: `translateX(${isShown ? 0 : 20}px)`,
                  }}
                >
                  {/* Checkbox */}
                  <div
                    style={{
                      width: 'clamp(20px, 4vw, 30px)',
                      height: 'clamp(20px, 4vw, 30px)',
                      borderRadius: 'clamp(5px, 1vw, 8px)',
                      background: isCompleted && taskProgress > 0.5 ? accentColor : 'transparent',
                      border: `2px solid ${isCompleted && taskProgress > 0.5 ? accentColor : textColor + '30'}`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: 'clamp(10px, 2vw, 16px)',
                      color: '#FFFFFF',
                      flexShrink: 0,
                      transform: `scale(${isCompleted && taskProgress > 0.5 ? 1 : 0.9})`,
                    }}
                  >
                    {isCompleted && taskProgress > 0.5 ? '\u2713' : ''}
                  </div>
                  {/* Task text */}
                  <div
                    style={{
                      fontSize: 'clamp(12px, 2.5vw, 18px)',
                      fontWeight: 500,
                      color: textColor,
                      fontFamily: "'Inter', 'Helvetica Neue', sans-serif",
                      textDecoration: isCompleted && taskProgress > 0.5 ? 'line-through' : 'none',
                      opacity: isCompleted && taskProgress > 0.5 ? 0.6 : 1,
                    }}
                  >
                    {task}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}

registerMotionGraphic({
  id: 'tpl-scene-reward-chart',
  title: 'Reward Chart',
  description: 'Star reward chart for kids with task checklist, star progress bar, and trophy celebration. Tasks check off and stars fill up with animation.',
  tags: ['scene', 'kids', 'education', 'reward', 'stars', 'chart', 'cartoon', 'motivation'],
  category: 'scene-layout',
  component: SceneRewardChartComponent as unknown as React.ComponentType<MotionGraphicProps>,
  defaultConfig: {
    childName: 'Emma',
    tasks: ['Brush teeth', 'Make bed', 'Read a book', 'Clean up toys'],
    completedCount: 3,
    totalStars: 5,
    bgColor: '#FFF5E6',
    cardColor: '#FFFFFF',
    accentColor: '#FF9500',
    textColor: '#2D3436',
  },
  configSchema: [
    { key: 'childName', label: 'Child Name', type: 'text', defaultValue: 'Emma', group: 'Content' },
    { key: 'tasks', label: 'Tasks', type: 'text-array', defaultValue: ['Brush teeth', 'Make bed', 'Read a book', 'Clean up toys'], group: 'Content' },
    { key: 'completedCount', label: 'Completed Tasks', type: 'number', defaultValue: 3, min: 0, max: 10, group: 'Content' },
    { key: 'totalStars', label: 'Total Stars', type: 'number', defaultValue: 5, min: 1, max: 10, group: 'Content' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#FFF5E6', group: 'Style' },
    { key: 'cardColor', label: 'Card Color', type: 'color', defaultValue: '#FFFFFF', group: 'Style' },
    { key: 'accentColor', label: 'Accent Color', type: 'color', defaultValue: '#FF9500', group: 'Style' },
    { key: 'textColor', label: 'Text Color', type: 'color', defaultValue: '#2D3436', group: 'Style' },
  ],
})
