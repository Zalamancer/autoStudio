import React from 'react'
import { registerMotionGraphic } from '../registry'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface DIYStepConfig {
  stepNumber: number
  instruction: string
  proTip: string
  difficulty: 'Easy' | 'Medium' | 'Hard'
  bgColor: string
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

function SceneDIYStepComponent({ config, progress }: MotionGraphicProps<DIYStepConfig>) {
  const { stepNumber, instruction, proTip, difficulty, bgColor, accentColor, textColor } = config

  // Enter: 0-0.2
  const enterP = progress < 0.2 ? progress / 0.2 : 1
  // Exit: 0.8-1.0
  const exitP = progress > 0.8 ? (progress - 0.8) / 0.2 : 0
  const overallOpacity = exitP > 0 ? 1 - easeInCubic(exitP) : 1

  // Step number drops in: 0-0.15
  const numberP = easeOutBack(Math.min(1, enterP / 0.75))

  // Instruction slides from right: 0.08-0.18
  const instrStart = 0.08
  const instrP = easeOutCubic(Math.max(0, Math.min(1, (progress - instrStart) / 0.12)))

  // Pro tip reveals: 0.3-0.45
  const tipP = easeOutCubic(Math.max(0, Math.min(1, (progress - 0.3) / 0.15)))

  // Difficulty indicator: 0.15-0.25
  const diffP = easeOutCubic(Math.max(0, Math.min(1, (progress - 0.15) / 0.1)))

  const difficultyColor =
    difficulty === 'Easy' ? '#4CAF50' : difficulty === 'Medium' ? '#FF9800' : '#F44336'
  const difficultyDots = difficulty === 'Easy' ? 1 : difficulty === 'Medium' ? 2 : 3

  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        background: bgColor,
        overflow: 'hidden',
        fontFamily: "'Helvetica Neue', Arial, sans-serif",
        opacity: overallOpacity,
      }}
    >
      {/* Workshop grid pattern */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          backgroundImage: `
            linear-gradient(${accentColor}08 1px, transparent 1px),
            linear-gradient(90deg, ${accentColor}08 1px, transparent 1px)
          `,
          backgroundSize: '40px 40px',
          pointerEvents: 'none',
        }}
      />

      <div style={{ position: 'relative', padding: '6% 8%', height: '100%', display: 'flex', flexDirection: 'column' }}>
        {/* Step number - large */}
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 'clamp(12px, 3vw, 24px)', marginBottom: '4%' }}>
          <div
            style={{
              fontSize: 'clamp(48px, 12vw, 100px)',
              fontWeight: 900,
              color: accentColor,
              lineHeight: 0.85,
              opacity: numberP,
              transform: `translateY(${(1 - numberP) * -60}px) scale(${numberP})`,
              textShadow: `2px 2px 0 ${accentColor}30`,
              flexShrink: 0,
            }}
          >
            {stepNumber}
          </div>

          {/* "STEP" label */}
          <div
            style={{
              fontSize: 'clamp(10px, 1.8vw, 14px)',
              fontWeight: 700,
              color: accentColor,
              opacity: numberP * 0.6,
              textTransform: 'uppercase',
              letterSpacing: 4,
              marginTop: 'clamp(8px, 2vw, 16px)',
              writingMode: 'vertical-lr',
            }}
          >
            STEP
          </div>
        </div>

        {/* Instruction text */}
        <div
          style={{
            fontSize: 'clamp(16px, 3.2vw, 28px)',
            fontWeight: 600,
            color: textColor,
            lineHeight: 1.5,
            opacity: instrP,
            transform: `translateX(${(1 - instrP) * 50}px)`,
            marginBottom: '5%',
            maxWidth: '90%',
          }}
        >
          {instruction}
        </div>

        {/* Spacer */}
        <div style={{ flex: 1 }} />

        {/* Pro Tip callout */}
        {proTip && (
          <div
            style={{
              padding: 'clamp(10px, 2.5%, 20px) clamp(14px, 3%, 24px)',
              background: `${accentColor}12`,
              borderRadius: 10,
              borderLeft: `4px solid ${accentColor}`,
              opacity: tipP,
              transform: `translateY(${(1 - tipP) * 25}px)`,
              marginBottom: '4%',
            }}
          >
            <div
              style={{
                fontSize: 'clamp(10px, 1.6vw, 13px)',
                fontWeight: 800,
                color: accentColor,
                textTransform: 'uppercase',
                letterSpacing: 3,
                marginBottom: 6,
              }}
            >
              PRO TIP
            </div>
            <div
              style={{
                fontSize: 'clamp(13px, 2.2vw, 20px)',
                color: textColor,
                lineHeight: 1.4,
                opacity: 0.85,
              }}
            >
              {proTip}
            </div>
          </div>
        )}

        {/* Difficulty indicator */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 'clamp(6px, 1.5vw, 12px)',
            opacity: diffP,
            transform: `translateY(${(1 - diffP) * 15}px)`,
          }}
        >
          <span
            style={{
              fontSize: 'clamp(10px, 1.6vw, 13px)',
              fontWeight: 600,
              color: textColor,
              opacity: 0.5,
              textTransform: 'uppercase',
              letterSpacing: 2,
            }}
          >
            Difficulty
          </span>
          <div style={{ display: 'flex', gap: 4 }}>
            {[1, 2, 3].map((dot) => (
              <div
                key={dot}
                style={{
                  width: 'clamp(10px, 2vw, 16px)',
                  height: 'clamp(10px, 2vw, 16px)',
                  borderRadius: '50%',
                  background: dot <= difficultyDots ? difficultyColor : `${textColor}20`,
                  border: `1px solid ${dot <= difficultyDots ? difficultyColor : `${textColor}30`}`,
                }}
              />
            ))}
          </div>
          <span
            style={{
              fontSize: 'clamp(11px, 1.8vw, 14px)',
              fontWeight: 700,
              color: difficultyColor,
            }}
          >
            {difficulty}
          </span>
        </div>
      </div>
    </div>
  )
}

registerMotionGraphic({
  id: 'tpl-scene-diy-step',
  title: 'Scene DIY Step',
  description: 'Step-by-step DIY instruction card with large step number, pro tip callout, and difficulty indicator',
  tags: ['scene', 'diy', 'step', 'instruction', 'tutorial', 'craft'],
  category: 'scene-layout',
  component: SceneDIYStepComponent as unknown as React.ComponentType<MotionGraphicProps>,
  configSchema: [
    { key: 'stepNumber', label: 'Step Number', type: 'number', defaultValue: 1, min: 1, max: 99, group: 'Content' },
    { key: 'instruction', label: 'Instruction', type: 'text', defaultValue: 'Sand the wood surface in the direction of the grain using 120-grit sandpaper until smooth.', group: 'Content' },
    { key: 'proTip', label: 'Pro Tip', type: 'text', defaultValue: 'Wipe with a tack cloth between grits for a smoother finish!', group: 'Content' },
    { key: 'difficulty', label: 'Difficulty', type: 'select', defaultValue: 'Easy', options: ['Easy', 'Medium', 'Hard'], group: 'Content' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#1C1C1E', group: 'Style' },
    { key: 'accentColor', label: 'Accent Color', type: 'color', defaultValue: '#FF9500', group: 'Style' },
    { key: 'textColor', label: 'Text Color', type: 'color', defaultValue: '#F5F5F5', group: 'Style' },
  ],
  defaultConfig: {
    stepNumber: 1,
    instruction: 'Sand the wood surface in the direction of the grain using 120-grit sandpaper until smooth.',
    proTip: 'Wipe with a tack cloth between grits for a smoother finish!',
    difficulty: 'Easy' as const,
    bgColor: '#1C1C1E',
    accentColor: '#FF9500',
    textColor: '#F5F5F5',
  },
})
