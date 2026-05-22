import React from 'react'
import { registerMotionGraphic } from '../registry'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface CookingStepConfig {
  stepNumber: number
  instruction: string
  tip: string
  timerText: string
  bgColor: string
  cardColor: string
  accentColor: string
  textColor: string
}

function easeOutCubic(t: number): number { return 1 - Math.pow(1 - t, 3) }
function easeInCubic(t: number): number { return t * t * t }
function elasticOut(t: number): number {
  if (t === 0 || t === 1) return t
  return Math.pow(2, -10 * t) * Math.sin((t - 0.075) * (2 * Math.PI) / 0.3) + 1
}

function SceneCookingStepComponent({ config, progress }: MotionGraphicProps<CookingStepConfig>) {
  const { stepNumber, instruction, tip, timerText, bgColor, cardColor, accentColor, textColor } = config

  const enterProgress = progress < 0.2 ? progress / 0.2 : 1
  const holdProgress = progress >= 0.2 && progress < 0.8 ? (progress - 0.2) / 0.6 : progress >= 0.8 ? 1 : 0
  const exitProgress = progress >= 0.8 ? (progress - 0.8) / 0.2 : 0

  const exitEased = easeInCubic(exitProgress)
  const exitOpacity = exitProgress > 0 ? 1 - exitEased : 1

  // Step number drops in with elastic
  const numberEnter = elasticOut(Math.min(1, enterProgress / 0.4))
  const numberY = (1 - numberEnter) * -60

  // Instruction text slides in from right
  const textEnter = easeOutCubic(Math.max(0, Math.min(1, (enterProgress - 0.2) / 0.4)))
  const textX = (1 - textEnter) * 50

  // Timer badge pops in
  const timerEnter = elasticOut(Math.max(0, Math.min(1, (enterProgress - 0.5) / 0.3)))

  // Tip fades in
  const tipEnter = easeOutCubic(Math.max(0, Math.min(1, (enterProgress - 0.6) / 0.3)))

  // Hold: subtle pulse on timer
  const timerPulse = 1 + Math.sin(holdProgress * Math.PI * 6) * 0.03

  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        overflow: 'hidden',
        background: bgColor,
        fontFamily: "'Inter', 'Helvetica Neue', sans-serif",
      }}
    >
      {/* Warm radial glow */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: `radial-gradient(circle at 20% 30%, ${accentColor}12 0%, transparent 50%)`,
        }}
      />

      <div
        style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '6%',
          opacity: exitOpacity,
          transform: `scale(${1 - exitEased * 0.1})`,
        }}
      >
        <div
          style={{
            background: cardColor,
            borderRadius: 'clamp(16px, 2.5vw, 28px)',
            padding: 'clamp(24px, 4.5%, 44px)',
            maxWidth: 480,
            width: '100%',
            boxShadow: '0 10px 36px rgba(0,0,0,0.1)',
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          {/* Left accent stripe */}
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              bottom: 0,
              width: 5,
              background: accentColor,
              transform: `scaleY(${easeOutCubic(Math.min(1, enterProgress / 0.3))})`,
              transformOrigin: 'top',
            }}
          />

          {/* Step number */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 'clamp(12px, 2.5vw, 20px)',
              marginBottom: 'clamp(16px, 2.5vh, 28px)',
            }}
          >
            <div
              style={{
                width: 'clamp(48px, 10vw, 72px)',
                height: 'clamp(48px, 10vw, 72px)',
                borderRadius: '50%',
                background: accentColor,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
                transform: `translateY(${numberY}px) scale(${numberEnter})`,
                boxShadow: `0 4px 16px ${accentColor}40`,
              }}
            >
              <span
                style={{
                  fontSize: 'clamp(22px, 5vw, 36px)',
                  fontWeight: 900,
                  color: '#FFFFFF',
                }}
              >
                {stepNumber}
              </span>
            </div>
            <div
              style={{
                fontSize: 'clamp(11px, 1.6vw, 14px)',
                fontWeight: 700,
                color: accentColor,
                textTransform: 'uppercase',
                letterSpacing: '0.12em',
                opacity: numberEnter,
              }}
            >
              Step {stepNumber}
            </div>
          </div>

          {/* Instruction text */}
          <div
            style={{
              fontSize: 'clamp(18px, 4vw, 32px)',
              fontWeight: 700,
              color: textColor,
              lineHeight: 1.35,
              marginBottom: 'clamp(16px, 2.5vh, 28px)',
              transform: `translateX(${textX}px)`,
              opacity: textEnter,
            }}
          >
            {instruction}
          </div>

          {/* Timer badge */}
          {timerText && (
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 'clamp(6px, 1vw, 10px)',
                background: `${accentColor}12`,
                padding: 'clamp(6px, 1vh, 10px) clamp(12px, 2vw, 20px)',
                borderRadius: 'clamp(8px, 1.5vw, 14px)',
                marginBottom: tip ? 'clamp(12px, 2vh, 20px)' : 0,
                transform: `scale(${timerEnter * timerPulse})`,
                opacity: timerEnter,
              }}
            >
              <svg viewBox="0 0 20 20" style={{ width: 'clamp(16px, 2.5vw, 22px)', height: 'clamp(16px, 2.5vw, 22px)' }}>
                <circle cx="10" cy="11" r="7" fill="none" stroke={accentColor} strokeWidth="1.5" />
                <line x1="10" y1="7" x2="10" y2="11" stroke={accentColor} strokeWidth="1.5" strokeLinecap="round" />
                <line x1="10" y1="11" x2="13" y2="11" stroke={accentColor} strokeWidth="1.5" strokeLinecap="round" />
                <line x1="8" y1="3" x2="12" y2="3" stroke={accentColor} strokeWidth="1.5" strokeLinecap="round" />
              </svg>
              <span
                style={{
                  fontSize: 'clamp(13px, 2vw, 18px)',
                  fontWeight: 700,
                  color: accentColor,
                }}
              >
                {timerText}
              </span>
            </div>
          )}

          {/* Tip */}
          {tip && (
            <div
              style={{
                fontSize: 'clamp(11px, 1.8vw, 15px)',
                fontWeight: 500,
                color: `${textColor}88`,
                fontStyle: 'italic',
                opacity: tipEnter,
                transform: `translateY(${(1 - tipEnter) * 10}px)`,
                paddingLeft: 'clamp(10px, 2vw, 16px)',
                borderLeft: `2px solid ${accentColor}30`,
              }}
            >
              {'\u{1F4A1}'} {tip}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

registerMotionGraphic({
  id: 'tpl-scene-cooking-step',
  title: 'Cooking Step',
  description: 'Cooking instruction with large step number drop-in, instruction text, timer indicator and optional tip',
  tags: ['scene', 'food', 'cooking', 'recipe', 'step', 'tutorial'],
  category: 'scene-layout',
  component: SceneCookingStepComponent as any,
  defaultConfig: {
    stepNumber: 1,
    instruction: 'Preheat oven to 375\u00B0F and line baking sheet with parchment paper',
    tip: 'Use convection mode for crispier results',
    timerText: '25 minutes',
    bgColor: '#FFF5EB',
    cardColor: '#FFFFFF',
    accentColor: '#D4652B',
    textColor: '#2D1810',
  },
  configSchema: [
    { key: 'stepNumber', label: 'Step Number', type: 'number', defaultValue: 1, min: 1, max: 99, group: 'Content' },
    { key: 'instruction', label: 'Instruction', type: 'text', defaultValue: 'Preheat oven to 375\u00B0F and line baking sheet with parchment paper', group: 'Content' },
    { key: 'tip', label: 'Tip (optional)', type: 'text', defaultValue: 'Use convection mode for crispier results', group: 'Content' },
    { key: 'timerText', label: 'Timer Text', type: 'text', defaultValue: '25 minutes', group: 'Content' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#FFF5EB', group: 'Style' },
    { key: 'cardColor', label: 'Card Color', type: 'color', defaultValue: '#FFFFFF', group: 'Style' },
    { key: 'accentColor', label: 'Accent Color', type: 'color', defaultValue: '#D4652B', group: 'Style' },
    { key: 'textColor', label: 'Text Color', type: 'color', defaultValue: '#2D1810', group: 'Style' },
  ],
})
