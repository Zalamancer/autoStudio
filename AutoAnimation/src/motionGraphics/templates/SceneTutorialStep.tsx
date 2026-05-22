import React from 'react'
import { registerMotionGraphic } from '../registry'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface TutorialStepConfig {
  tipText: string
  instruction: string
  spotlightPosition: string
  badgeColor: string
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

function SceneTutorialStepComponent({
  config,
  frame,
  durationInFrames,
}: MotionGraphicProps<TutorialStepConfig>) {
  const { tipText, instruction, spotlightPosition, badgeColor, bgColor, textColor } = config
  const progress = frame / durationInFrames

  // Parse spotlight position (e.g., "60,50" for x=60%, y=50%)
  const posParts = spotlightPosition.split(',').map((p) => parseFloat(p.trim()) || 50)
  const spotX = posParts[0] ?? 60
  const spotY = posParts[1] ?? 55

  // Enter: badge slides in (0-0.12)
  const badgeProgress = easeOutCubic(Math.min(1, progress / 0.12))
  const badgeSlideX = (1 - badgeProgress) * -40

  // Text fades in (0.1-0.22)
  const textProgress = easeOutCubic(Math.max(0, Math.min(1, (progress - 0.1) / 0.12)))

  // Spotlight scales in with glow (0.18-0.32)
  const spotStart = 0.18
  const spotEnd = 0.32
  const spotProgress = easeOutBack(Math.max(0, Math.min(1, (progress - spotStart) / (spotEnd - spotStart))))

  // Hold: spotlight gently pulses (0.35-0.8)
  const holdProgress = progress >= 0.35 && progress < 0.8 ? (progress - 0.35) / 0.45 : 0
  const spotPulse = holdProgress > 0 ? 1 + 0.08 * Math.sin(holdProgress * Math.PI * 6) : 1

  // Pointing hand bobs
  const handBob = holdProgress > 0 ? Math.sin(holdProgress * Math.PI * 8) * 6 : 0

  // Exit: spotlight shrinks, text slides out (0.83-1.0)
  const exitProgress = progress >= 0.83 ? easeOutCubic((progress - 0.83) / 0.17) : 0
  const spotExitScale = 1 - exitProgress
  const textExitSlide = exitProgress * 60
  const exitOpacity = 1 - exitProgress

  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        background: bgColor,
        overflow: 'hidden',
        fontFamily: "'Helvetica Neue', Arial, sans-serif",
      }}
    >
      {/* Simulated UI background pattern */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          opacity: 0.04,
          backgroundImage: `
            linear-gradient(${textColor}15 1px, transparent 1px),
            linear-gradient(90deg, ${textColor}15 1px, transparent 1px)
          `,
          backgroundSize: '40px 40px',
        }}
      />

      {/* Spotlight circle */}
      <div
        style={{
          position: 'absolute',
          left: `${spotX}%`,
          top: `${spotY}%`,
          transform: `translate(-50%, -50%) scale(${spotProgress * spotPulse * spotExitScale})`,
          width: 'clamp(80px, 18vw, 160px)',
          height: 'clamp(80px, 18vw, 160px)',
          borderRadius: '50%',
          border: `3px solid ${badgeColor}`,
          background: `${badgeColor}12`,
          boxShadow: `
            0 0 ${20 + (spotPulse - 1) * 100}px ${badgeColor}40,
            0 0 ${40 + (spotPulse - 1) * 200}px ${badgeColor}20,
            inset 0 0 20px ${badgeColor}10
          `,
          zIndex: 5,
        }}
      />

      {/* Pointing hand */}
      <div
        style={{
          position: 'absolute',
          left: `${spotX + 8}%`,
          top: `${spotY - 12}%`,
          transform: `translate(-50%, ${handBob}px)`,
          fontSize: 'clamp(24px, 5vw, 42px)',
          opacity: spotProgress * (1 - exitProgress),
          zIndex: 6,
          filter: `drop-shadow(0 2px 4px rgba(0,0,0,0.3))`,
        }}
      >
        {'\uD83D\uDC46'}
      </div>

      {/* Tip badge */}
      <div
        style={{
          position: 'absolute',
          top: '8%',
          left: '6%',
          display: 'flex',
          alignItems: 'center',
          gap: 'clamp(6px, 1.5vw, 12px)',
          padding: 'clamp(8px, 1.5vw, 14px) clamp(14px, 3vw, 24px)',
          background: `${badgeColor}20`,
          borderRadius: 'clamp(20px, 4vw, 32px)',
          border: `1px solid ${badgeColor}40`,
          opacity: badgeProgress,
          transform: `translateX(${badgeSlideX}px)`,
          zIndex: 10,
        }}
      >
        <span style={{ fontSize: 'clamp(14px, 2.5vw, 22px)' }}>{'\uD83D\uDCA1'}</span>
        <span
          style={{
            fontSize: 'clamp(12px, 2vw, 18px)',
            fontWeight: 700,
            color: badgeColor,
            textTransform: 'uppercase',
            letterSpacing: 2,
          }}
        >
          {tipText}
        </span>
      </div>

      {/* Instruction text panel */}
      <div
        style={{
          position: 'absolute',
          bottom: '10%',
          left: '6%',
          right: '6%',
          padding: 'clamp(16px, 3vw, 28px) clamp(20px, 4vw, 36px)',
          background: `${bgColor}E0`,
          borderRadius: 'clamp(10px, 2vw, 16px)',
          border: `1px solid ${textColor}15`,
          backdropFilter: 'blur(10px)',
          opacity: textProgress * exitOpacity,
          transform: `translateY(${textExitSlide}px)`,
          zIndex: 10,
        }}
      >
        <div
          style={{
            fontSize: 'clamp(16px, 3.5vw, 28px)',
            fontWeight: 600,
            color: textColor,
            lineHeight: 1.5,
          }}
        >
          {instruction}
        </div>

        {/* Subtle step indicator dots */}
        <div
          style={{
            display: 'flex',
            gap: 'clamp(4px, 0.8vw, 8px)',
            marginTop: 'clamp(10px, 2vw, 18px)',
          }}
        >
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              style={{
                width: 'clamp(6px, 1.2vw, 10px)',
                height: 'clamp(6px, 1.2vw, 10px)',
                borderRadius: '50%',
                background: i === 0 ? badgeColor : `${textColor}25`,
              }}
            />
          ))}
        </div>
      </div>

      {/* Connecting line from spotlight to instruction */}
      <svg
        style={{
          position: 'absolute',
          inset: 0,
          width: '100%',
          height: '100%',
          pointerEvents: 'none',
          zIndex: 4,
          opacity: spotProgress * (1 - exitProgress) * 0.3,
        }}
      >
        <line
          x1={`${spotX}%`}
          y1={`${spotY + 10}%`}
          x2={`${spotX}%`}
          y2="85%"
          stroke={badgeColor}
          strokeWidth="1.5"
          strokeDasharray="6 4"
          opacity={0.5}
        />
      </svg>
    </div>
  )
}

registerMotionGraphic({
  id: 'tpl-scene-tutorial-step',
  title: 'Tutorial Step',
  description:
    'Tutorial instruction with spotlight highlight, pointing hand, tip badge, and pulsing glow effect',
  tags: ['scene', 'educational', 'tutorial', 'instruction', 'tip', 'guide'],
  category: 'scene-layout',
  component: SceneTutorialStepComponent as unknown as React.ComponentType<MotionGraphicProps>,
  configSchema: [
    { key: 'tipText', label: 'Tip Text', type: 'text', defaultValue: 'PRO TIP', group: 'Content' },
    { key: 'instruction', label: 'Instruction', type: 'text', defaultValue: 'Click the blue button to save your progress and continue to the next step.', group: 'Content' },
    { key: 'spotlightPosition', label: 'Spotlight Position (x,y %)', type: 'text', defaultValue: '60,45', group: 'Content' },
    { key: 'badgeColor', label: 'Badge Color', type: 'color', defaultValue: '#F1C40F', group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#0F0F1A', group: 'Style' },
    { key: 'textColor', label: 'Text Color', type: 'color', defaultValue: '#E8E8E8', group: 'Style' },
  ],
  defaultConfig: {
    tipText: 'PRO TIP',
    instruction: 'Click the blue button to save your progress and continue to the next step.',
    spotlightPosition: '60,45',
    badgeColor: '#F1C40F',
    bgColor: '#0F0F1A',
    textColor: '#E8E8E8',
  },
})
