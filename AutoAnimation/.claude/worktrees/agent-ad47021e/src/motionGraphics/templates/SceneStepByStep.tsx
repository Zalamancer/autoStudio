import React from 'react'
import { registerMotionGraphic } from '../registry'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface StepByStepConfig {
  stepNumber: number
  totalSteps: number
  stepTitle: string
  stepDescription: string
  accentColor: string
  bgColor: string
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

function SceneStepByStepComponent({
  config,
  frame,
  durationInFrames,
}: MotionGraphicProps<StepByStepConfig>) {
  const { stepNumber, totalSteps, stepTitle, stepDescription, accentColor, bgColor, textColor } =
    config
  const progress = frame / durationInFrames

  // Enter: 0-0.2
  const enterProgress = Math.min(1, progress / 0.2)
  // Hold: 0.2-0.8
  const holdProgress = progress >= 0.2 && progress < 0.8 ? (progress - 0.2) / 0.6 : progress >= 0.8 ? 1 : 0
  // Exit: 0.8-1.0
  const exitProgress = progress >= 0.8 ? (progress - 0.8) / 0.2 : 0

  // Step number bounces in
  const numberScale = enterProgress < 1 ? easeOutBack(enterProgress) : 1
  const numberOpacity = easeOutCubic(enterProgress)

  // Title slides in from right
  const titleStart = 0.05
  const titleEnd = 0.22
  const titleProgress = easeOutCubic(Math.max(0, Math.min(1, (progress - titleStart) / (titleEnd - titleStart))))
  const titleSlideX = (1 - titleProgress) * 60

  // Description fades in
  const descStart = 0.12
  const descEnd = 0.28
  const descProgress = easeOutCubic(Math.max(0, Math.min(1, (progress - descStart) / (descEnd - descStart))))

  // Dot progress indicator
  const dotsStart = 0.08
  const dotsEnd = 0.2
  const dotsProgress = easeOutCubic(Math.max(0, Math.min(1, (progress - dotsStart) / (dotsEnd - dotsStart))))

  // Hold: current dot pulses
  const dotPulse = holdProgress > 0 ? 1 + 0.15 * Math.sin(holdProgress * Math.PI * 6) : 1

  // Exit: slide left
  const exitSlideX = easeOutCubic(exitProgress) * -120
  const exitOpacity = 1 - easeOutCubic(exitProgress)

  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        background: bgColor,
        overflow: 'hidden',
        fontFamily: "'Helvetica Neue', Arial, sans-serif",
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        transform: `translateX(${exitSlideX}%)`,
        opacity: exitOpacity,
      }}
    >
      {/* Progress dots at top */}
      <div
        style={{
          position: 'absolute',
          top: '6%',
          display: 'flex',
          gap: 'clamp(8px, 2vw, 16px)',
          opacity: dotsProgress,
        }}
      >
        {Array.from({ length: totalSteps }).map((_, i) => {
          const isActive = i + 1 === stepNumber
          const isPast = i + 1 < stepNumber
          return (
            <div
              key={i}
              style={{
                width: 'clamp(10px, 2vw, 18px)',
                height: 'clamp(10px, 2vw, 18px)',
                borderRadius: '50%',
                background: isActive
                  ? accentColor
                  : isPast
                    ? `${accentColor}80`
                    : `${textColor}30`,
                transform: isActive ? `scale(${dotPulse})` : 'scale(1)',
                transition: 'transform 0.1s',
                boxShadow: isActive ? `0 0 12px ${accentColor}80` : 'none',
              }}
            />
          )
        })}
      </div>

      {/* Step number */}
      <div
        style={{
          fontSize: 'clamp(60px, 15vw, 140px)',
          fontWeight: 900,
          color: accentColor,
          opacity: numberOpacity,
          transform: `scale(${numberScale})`,
          lineHeight: 1,
          marginBottom: '2%',
        }}
      >
        {stepNumber}
      </div>

      {/* Step label */}
      <div
        style={{
          fontSize: 'clamp(12px, 2vw, 18px)',
          fontWeight: 600,
          color: `${textColor}80`,
          textTransform: 'uppercase',
          letterSpacing: 3,
          opacity: titleProgress,
          marginBottom: '3%',
        }}
      >
        Step {stepNumber} of {totalSteps}
      </div>

      {/* Step title */}
      <div
        style={{
          fontSize: 'clamp(22px, 5vw, 48px)',
          fontWeight: 700,
          color: textColor,
          textAlign: 'center',
          maxWidth: '80%',
          opacity: titleProgress,
          transform: `translateX(${titleSlideX}px)`,
          marginBottom: '3%',
        }}
      >
        {stepTitle}
      </div>

      {/* Step description */}
      <div
        style={{
          fontSize: 'clamp(14px, 2.5vw, 22px)',
          fontWeight: 400,
          color: `${textColor}B0`,
          textAlign: 'center',
          maxWidth: '70%',
          lineHeight: 1.5,
          opacity: descProgress,
        }}
      >
        {stepDescription}
      </div>

      {/* Accent line under title */}
      <div
        style={{
          position: 'absolute',
          bottom: '15%',
          width: `${titleProgress * 30}%`,
          height: 3,
          background: `linear-gradient(90deg, transparent, ${accentColor}, transparent)`,
          borderRadius: 2,
        }}
      />
    </div>
  )
}

registerMotionGraphic({
  id: 'tpl-scene-step-by-step',
  title: 'Step By Step',
  description:
    'Numbered step progression with bounce-in number, sliding title, progress dots, and slide-out exit',
  tags: ['scene', 'educational', 'steps', 'tutorial', 'progression'],
  category: 'scene-layout',
  component: SceneStepByStepComponent as unknown as React.ComponentType<MotionGraphicProps>,
  configSchema: [
    { key: 'stepNumber', label: 'Step Number', type: 'number', defaultValue: 1, group: 'Content', min: 1, max: 20 },
    { key: 'totalSteps', label: 'Total Steps', type: 'number', defaultValue: 3, group: 'Content', min: 1, max: 20 },
    { key: 'stepTitle', label: 'Step Title', type: 'text', defaultValue: 'Set up your account', group: 'Content' },
    { key: 'stepDescription', label: 'Step Description', type: 'text', defaultValue: 'Create your profile and configure your preferences to get started.', group: 'Content' },
    { key: 'accentColor', label: 'Accent Color', type: 'color', defaultValue: '#4A90D9', group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#FFFFFF', group: 'Style' },
    { key: 'textColor', label: 'Text Color', type: 'color', defaultValue: '#1A1A2E', group: 'Style' },
  ],
  defaultConfig: {
    stepNumber: 1,
    totalSteps: 3,
    stepTitle: 'Set up your account',
    stepDescription: 'Create your profile and configure your preferences to get started.',
    accentColor: '#4A90D9',
    bgColor: '#FFFFFF',
    textColor: '#1A1A2E',
  },
})
