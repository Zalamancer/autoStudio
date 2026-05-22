import React from 'react'
import { registerMotionGraphic } from '../registry'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface SceneMathProblemConfig {
  numberA: number
  numberB: number
  operator: string
  answer: number
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

function SceneMathProblemComponent({ config, progress }: MotionGraphicProps<SceneMathProblemConfig>) {
  const { numberA, numberB, operator, answer, bgColor, cardColor, accentColor, textColor } = config

  const enterProgress = progress < 0.2 ? progress / 0.2 : 1
  const holdProgress = progress >= 0.2 && progress < 0.8 ? (progress - 0.2) / 0.6 : progress >= 0.8 ? 1 : 0
  const exitProgress = progress >= 0.8 ? (progress - 0.8) / 0.2 : 0

  const globalScale = enterProgress < 1
    ? easeOutBack(enterProgress)
    : exitProgress > 0
      ? 1 - easeInCubic(exitProgress) * 0.2
      : 1
  const globalOpacity = exitProgress > 0 ? 1 - easeInCubic(exitProgress) : easeOutCubic(enterProgress)

  // Staggered problem reveal
  const numAReveal = easeOutCubic(Math.max(0, Math.min(1, enterProgress / 0.5)))
  const opReveal = easeOutCubic(Math.max(0, Math.min(1, (enterProgress - 0.2) / 0.5)))
  const numBReveal = easeOutCubic(Math.max(0, Math.min(1, (enterProgress - 0.4) / 0.5)))

  // Answer reveal with thinking animation
  const thinkingPhase = holdProgress < 0.5
  const answerReveal = holdProgress >= 0.5 ? easeOutBack(Math.min(1, (holdProgress - 0.5) / 0.3)) : 0

  // Thinking dots animation
  const thinkingDots = thinkingPhase ? Math.floor((holdProgress / 0.5) * 4) % 4 : 0

  // Number pulse
  const answerPulse = answerReveal > 0.9 ? 1 + Math.sin(holdProgress * Math.PI * 8) * 0.04 : answerReveal

  // Celebration sparkles
  const showCelebration = holdProgress >= 0.7

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
        opacity: globalOpacity,
        transform: `scale(${globalScale})`,
      }}
    >
      {/* Grid paper background */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          backgroundImage: `
            linear-gradient(${accentColor}08 1px, transparent 1px),
            linear-gradient(90deg, ${accentColor}08 1px, transparent 1px)
          `,
          backgroundSize: '20px 20px',
        }}
      />

      <div style={{ width: '85%', maxWidth: '480px', textAlign: 'center' }}>
        {/* Math badge */}
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            background: `${accentColor}15`,
            color: accentColor,
            fontSize: 'clamp(10px, 2vw, 16px)',
            fontWeight: 700,
            padding: 'clamp(4px, 0.8vw, 8px) clamp(12px, 2.5vw, 22px)',
            borderRadius: '100px',
            marginBottom: 'clamp(20px, 5vw, 40px)',
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
          }}
        >
          {'\u{1F9EE}'} Math Time!
        </div>

        {/* Problem card */}
        <div
          style={{
            background: cardColor,
            borderRadius: 'clamp(16px, 3vw, 28px)',
            padding: 'clamp(24px, 6vw, 48px)',
            boxShadow: '0 8px 32px rgba(0,0,0,0.06)',
            border: `3px solid ${accentColor}25`,
          }}
        >
          {/* The equation */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 'clamp(12px, 3vw, 28px)',
              marginBottom: 'clamp(16px, 4vw, 32px)',
            }}
          >
            {/* Number A */}
            <div
              style={{
                fontSize: 'clamp(40px, 12vw, 90px)',
                fontWeight: 900,
                color: accentColor,
                opacity: numAReveal,
                transform: `scale(${numAReveal}) translateY(${(1 - numAReveal) * 20}px)`,
              }}
            >
              {numberA}
            </div>

            {/* Operator */}
            <div
              style={{
                fontSize: 'clamp(28px, 8vw, 60px)',
                fontWeight: 700,
                color: `${textColor}88`,
                opacity: opReveal,
                transform: `scale(${opReveal})`,
              }}
            >
              {operator}
            </div>

            {/* Number B */}
            <div
              style={{
                fontSize: 'clamp(40px, 12vw, 90px)',
                fontWeight: 900,
                color: accentColor,
                opacity: numBReveal,
                transform: `scale(${numBReveal}) translateY(${(1 - numBReveal) * 20}px)`,
              }}
            >
              {numberB}
            </div>
          </div>

          {/* Equals line */}
          <div
            style={{
              height: '4px',
              background: `linear-gradient(90deg, transparent, ${accentColor}40, transparent)`,
              borderRadius: '2px',
              marginBottom: 'clamp(16px, 4vw, 32px)',
              opacity: numBReveal,
            }}
          />

          {/* Answer area */}
          <div style={{ minHeight: 'clamp(50px, 12vw, 80px)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {thinkingPhase ? (
              <div
                style={{
                  display: 'flex',
                  gap: 'clamp(6px, 1.5vw, 12px)',
                  alignItems: 'center',
                }}
              >
                <span style={{ fontSize: 'clamp(14px, 3vw, 22px)', color: `${textColor}66`, fontFamily: "'Inter', sans-serif" }}>
                  Thinking
                </span>
                {[0, 1, 2].map((i) => (
                  <div
                    key={i}
                    style={{
                      width: 'clamp(8px, 1.5vw, 12px)',
                      height: 'clamp(8px, 1.5vw, 12px)',
                      borderRadius: '50%',
                      background: accentColor,
                      opacity: i < thinkingDots ? 0.8 : 0.2,
                      transform: `scale(${i < thinkingDots ? 1.2 : 0.8})`,
                    }}
                  />
                ))}
              </div>
            ) : (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 'clamp(8px, 2vw, 16px)',
                }}
              >
                <span
                  style={{
                    fontSize: 'clamp(28px, 8vw, 60px)',
                    fontWeight: 700,
                    color: `${textColor}60`,
                  }}
                >
                  =
                </span>
                <span
                  style={{
                    fontSize: 'clamp(48px, 14vw, 100px)',
                    fontWeight: 900,
                    color: '#22C55E',
                    transform: `scale(${answerPulse})`,
                    textShadow: '3px 3px 0 rgba(34,197,94,0.2)',
                  }}
                >
                  {answer}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Celebration */}
        {showCelebration && (
          <div
            style={{
              marginTop: 'clamp(12px, 3vw, 24px)',
              fontSize: 'clamp(14px, 3vw, 22px)',
              fontWeight: 700,
              color: '#22C55E',
              opacity: easeOutCubic(Math.min(1, (holdProgress - 0.7) / 0.15)),
              transform: `scale(${easeOutBack(Math.min(1, (holdProgress - 0.7) / 0.15))})`,
            }}
          >
            {'\u{1F389}'} Correct! Great job! {'\u2B50'}
          </div>
        )}
      </div>
    </div>
  )
}

registerMotionGraphic({
  id: 'tpl-scene-math-problem',
  title: 'Math Problem',
  description: 'Math problem display with staggered number reveals, thinking dots animation, and answer reveal with celebration.',
  tags: ['scene', 'kids', 'education', 'math', 'numbers', 'learning', 'cartoon', 'quiz'],
  category: 'scene-layout',
  component: SceneMathProblemComponent as unknown as React.ComponentType<MotionGraphicProps>,
  defaultConfig: {
    numberA: 7,
    numberB: 5,
    operator: '+',
    answer: 12,
    bgColor: '#F0F4FF',
    cardColor: '#FFFFFF',
    accentColor: '#4D96FF',
    textColor: '#2D3436',
  },
  configSchema: [
    { key: 'numberA', label: 'Number A', type: 'number', defaultValue: 7, min: 0, max: 999, group: 'Content' },
    { key: 'numberB', label: 'Number B', type: 'number', defaultValue: 5, min: 0, max: 999, group: 'Content' },
    { key: 'operator', label: 'Operator', type: 'text', defaultValue: '+', group: 'Content' },
    { key: 'answer', label: 'Answer', type: 'number', defaultValue: 12, min: 0, max: 9999, group: 'Content' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#F0F4FF', group: 'Style' },
    { key: 'cardColor', label: 'Card Color', type: 'color', defaultValue: '#FFFFFF', group: 'Style' },
    { key: 'accentColor', label: 'Accent Color', type: 'color', defaultValue: '#4D96FF', group: 'Style' },
    { key: 'textColor', label: 'Text Color', type: 'color', defaultValue: '#2D3436', group: 'Style' },
  ],
})
