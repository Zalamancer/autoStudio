import React from 'react'
import { registerMotionGraphic } from '../registry'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface ScenePollQuestionConfig {
  question: string
  options: string[]
  optionColors: string[]
  bgColor: string
  textColor: string
}

function easeOutCubic(t: number): number { return 1 - Math.pow(1 - t, 3) }
function easeInCubic(t: number): number { return t * t * t }
function easeOutBack(t: number): number {
  const c1 = 1.70158
  const c3 = c1 + 1
  return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2)
}

const LETTERS = ['A', 'B', 'C', 'D']

function ScenePollQuestionComponent({ config, progress }: MotionGraphicProps<ScenePollQuestionConfig>) {
  const { question, options, optionColors, bgColor, textColor } = config

  const enterProgress = progress < 0.2 ? progress / 0.2 : 1
  const holdProgress = progress >= 0.2 && progress < 0.8 ? (progress - 0.2) / 0.6 : progress >= 0.8 ? 1 : 0
  const exitProgress = progress >= 0.8 ? (progress - 0.8) / 0.2 : 0
  const isHolding = progress >= 0.2 && progress < 0.8

  // Question fades in
  const qEnter = Math.min(1, enterProgress / 0.4)
  const qOpacity = qEnter < 1
    ? easeOutCubic(qEnter)
    : exitProgress > 0
      ? 1 - easeInCubic(exitProgress)
      : 1
  const qY = qEnter < 1
    ? -30 * (1 - easeOutCubic(qEnter))
    : exitProgress > 0
      ? -30 * easeInCubic(exitProgress)
      : 0

  // Background
  const bgOpacity = enterProgress < 1
    ? easeOutCubic(enterProgress)
    : exitProgress > 0
      ? 1 - easeInCubic(exitProgress)
      : 1

  // Determine winner on exit (index 0 = first option wins)
  const winnerIdx = 0

  // Cycle highlight during hold
  const cycleIndex = isHolding
    ? Math.floor(holdProgress * options.length * 3) % options.length
    : -1

  return (
    <div style={{ position: 'absolute', inset: 0, overflow: 'hidden' }}>
      <div style={{
        position: 'absolute', inset: 0,
        background: bgColor,
        opacity: bgOpacity,
      }} />

      <div style={{
        position: 'absolute', inset: 0,
        display: 'flex', flexDirection: 'column',
        justifyContent: 'center', alignItems: 'center',
        padding: '8%',
        gap: 'clamp(20px, 5vw, 40px)',
      }}>
        {/* Question */}
        <div style={{
          fontFamily: "'Inter', 'Helvetica Neue', sans-serif",
          fontSize: 'clamp(20px, 5vw, 44px)',
          fontWeight: 800,
          color: textColor,
          textAlign: 'center',
          lineHeight: 1.3,
          maxWidth: '90%',
          transform: `translateY(${qY}px)`,
          opacity: qOpacity,
        }}>
          {question}
        </div>

        {/* Options */}
        <div style={{
          display: 'flex', flexDirection: 'column',
          gap: 'clamp(10px, 2.5vw, 20px)',
          width: '85%', maxWidth: '600px',
        }}>
          {options.map((opt, i) => {
            const delay = 0.3 + i * 0.12
            const optEnter = enterProgress < 1
              ? Math.max(0, (enterProgress - delay) / (1 - delay))
              : 1

            const optX = optEnter < 1
              ? 300 * (1 - easeOutCubic(optEnter))
              : 0
            const optOpacity = optEnter < 1
              ? easeOutCubic(optEnter)
              : 1

            // Exit: winner scales up, others fade
            const isWinner = i === winnerIdx
            const exitScale = exitProgress > 0
              ? isWinner
                ? 1 + easeOutCubic(exitProgress) * 0.1
                : 1 - easeInCubic(exitProgress) * 0.15
              : 1
            const exitOpacity = exitProgress > 0
              ? isWinner
                ? 1
                : 1 - easeInCubic(exitProgress) * 0.7
              : optOpacity

            // Hover-like pulse when cycling
            const isCycled = cycleIndex === i
            const pulseScale = isCycled ? 1.03 : 1
            const pulseGlow = isCycled ? 8 : 0

            const color = optionColors[i % optionColors.length]

            return (
              <div key={i} style={{
                display: 'flex', alignItems: 'center',
                gap: 'clamp(10px, 2.5vw, 18px)',
                background: `${color}18`,
                border: `2px solid ${color}${isCycled ? 'cc' : '40'}`,
                borderRadius: '14px',
                padding: 'clamp(10px, 2.5vw, 18px) clamp(14px, 3vw, 24px)',
                transform: `translateX(${optX}px) scale(${exitScale * pulseScale})`,
                opacity: exitOpacity,
                boxShadow: pulseGlow > 0 ? `0 0 ${pulseGlow}px ${color}60` : 'none',
              }}>
                {/* Letter badge */}
                <div style={{
                  width: 'clamp(28px, 6vw, 44px)',
                  height: 'clamp(28px, 6vw, 44px)',
                  borderRadius: '10px',
                  background: color,
                  display: 'flex', justifyContent: 'center', alignItems: 'center',
                  fontFamily: "'Inter', sans-serif",
                  fontSize: 'clamp(14px, 3vw, 22px)',
                  fontWeight: 800,
                  color: '#ffffff',
                  flexShrink: 0,
                }}>
                  {LETTERS[i]}
                </div>

                {/* Option text */}
                <span style={{
                  fontFamily: "'Inter', 'Helvetica Neue', sans-serif",
                  fontSize: 'clamp(14px, 3.5vw, 26px)',
                  fontWeight: 600,
                  color: textColor,
                  flex: 1,
                }}>
                  {opt}
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
  id: 'tpl-scene-poll-question',
  title: 'Poll Question',
  description: 'Interactive-looking poll with staggered option bars, cycling highlight animation, and winner reveal on exit',
  tags: ['scene', 'social', 'cta', 'poll', 'question', 'interactive', 'engagement'],
  category: 'scene-layout',
  component: ScenePollQuestionComponent as any,
  defaultConfig: {
    question: 'Which one would you choose?',
    options: ['Morning workout', 'Evening workout', 'Lunch break workout', 'Rest day'],
    optionColors: ['#FF6B6B', '#4ECDC4', '#FFE66D', '#A78BFA'],
    bgColor: '#0a0a1a',
    textColor: '#ffffff',
  },
  configSchema: [
    { key: 'question', label: 'Question', type: 'text', defaultValue: 'Which one would you choose?', group: 'Content' },
    { key: 'options', label: 'Options', type: 'text-array', defaultValue: ['Morning workout', 'Evening workout', 'Lunch break workout', 'Rest day'], group: 'Content' },
    { key: 'optionColors', label: 'Option Colors', type: 'text-array', defaultValue: ['#FF6B6B', '#4ECDC4', '#FFE66D', '#A78BFA'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#0a0a1a', group: 'Style' },
    { key: 'textColor', label: 'Text Color', type: 'color', defaultValue: '#ffffff', group: 'Style' },
  ],
})
