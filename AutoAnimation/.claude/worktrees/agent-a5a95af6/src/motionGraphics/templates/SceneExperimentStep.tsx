import React from 'react'
import { registerMotionGraphic } from '../registry'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface ExperimentStepConfig {
  stepNumber: number
  stepTitle: string
  instruction: string
  equipment: string
  safetyNote: string
  duration: string
  bgColor: string
  textColor: string
  accentColor: string
}

function easeOutCubic(t: number): number { return 1 - Math.pow(1 - t, 3) }
function easeOutBack(t: number): number {
  const c1 = 1.70158
  const c3 = c1 + 1
  return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2)
}
function easeInCubic(t: number): number { return t * t * t }

function SceneExperimentStepComponent({ config, frame, durationInFrames }: MotionGraphicProps<ExperimentStepConfig>) {
  const { stepNumber, stepTitle, instruction, equipment, safetyNote, duration, bgColor, textColor, accentColor } = config
  const progress = frame / durationInFrames

  // Step number badge pops (0.05-0.18)
  const badgePop = easeOutBack(Math.max(0, Math.min(1, (progress - 0.05) / 0.13)))

  // Progress bar fills (0.08-0.25)
  const barFill = easeOutCubic(Math.max(0, Math.min(1, (progress - 0.08) / 0.17)))

  // Step title slides in (0.12-0.25)
  const titleFade = easeOutCubic(Math.max(0, Math.min(1, (progress - 0.12) / 0.13)))

  // Instruction (0.22-0.38)
  const instrFade = easeOutCubic(Math.max(0, Math.min(1, (progress - 0.22) / 0.16)))

  // Equipment list (0.35-0.48)
  const equipFade = easeOutCubic(Math.max(0, Math.min(1, (progress - 0.35) / 0.13)))

  // Safety note (0.45-0.56)
  const safetyFade = easeOutCubic(Math.max(0, Math.min(1, (progress - 0.45) / 0.11)))

  // Duration badge (0.5-0.6)
  const durFade = easeOutCubic(Math.max(0, Math.min(1, (progress - 0.5) / 0.1)))

  // Hold: step number pulses (0.6-0.8)
  const holdPulse = progress >= 0.6 && progress < 0.8 ? Math.sin(((progress - 0.6) / 0.2) * Math.PI * 5) * 0.15 : 0

  // Exit
  const exitProg = progress >= 0.85 ? easeInCubic((progress - 0.85) / 0.15) : 0

  // Background beaker bubbles
  const bubbles = Array.from({ length: 8 }, (_, i) => {
    const x = ((i * 57 + 19) % 80) + 10
    const speed = 0.5 + ((i * 31) % 10) / 15
    const y = 100 - ((progress * speed * 80 + i * 25) % 110)
    return { x, y, size: 4 + ((i * 13) % 6) }
  })

  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        background: bgColor,
        overflow: 'hidden',
        fontFamily: "'Helvetica Neue', Arial, sans-serif",
        opacity: 1 - exitProg,
        transform: `scale(${1 - exitProg * 0.15})`,
      }}
    >
      {/* Background bubbles */}
      {bubbles.map((b, i) => (
        <div
          key={i}
          style={{
            position: 'absolute',
            left: `${b.x}%`,
            top: `${b.y}%`,
            width: b.size,
            height: b.size,
            borderRadius: '50%',
            border: `1px solid ${accentColor}0C`,
          }}
        />
      ))}

      {/* Main content */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '8%',
        }}
      >
        <div style={{ width: '100%', maxWidth: 500 }}>
          {/* Step number + progress bar row */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 'clamp(10px, 2.5vw, 20px)',
              marginBottom: 'clamp(14px, 3.5vw, 28px)',
            }}
          >
            {/* Step badge */}
            <div
              style={{
                width: 'clamp(44px, 11vw, 72px)',
                height: 'clamp(44px, 11vw, 72px)',
                borderRadius: '50%',
                background: accentColor,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 'clamp(20px, 5vw, 36px)',
                fontWeight: 900,
                color: bgColor,
                transform: `scale(${badgePop + holdPulse})`,
                boxShadow: `0 0 20px ${accentColor}40`,
                flexShrink: 0,
              }}
            >
              {stepNumber}
            </div>

            {/* Progress bar */}
            <div style={{ flex: 1 }}>
              <div
                style={{
                  width: '100%',
                  height: 'clamp(4px, 0.8vw, 7px)',
                  background: `${textColor}10`,
                  borderRadius: 10,
                  overflow: 'hidden',
                }}
              >
                <div
                  style={{
                    width: `${barFill * (stepNumber / 6) * 100}%`,
                    height: '100%',
                    background: `linear-gradient(90deg, ${accentColor}80, ${accentColor})`,
                    borderRadius: 10,
                  }}
                />
              </div>
              <div
                style={{
                  fontSize: 'clamp(9px, 1.6vw, 12px)',
                  color: `${textColor}40`,
                  marginTop: 4,
                  opacity: barFill,
                }}
              >
                Step {stepNumber} of 6
              </div>
            </div>
          </div>

          {/* Step title */}
          <div
            style={{
              fontSize: 'clamp(22px, 5.5vw, 42px)',
              fontWeight: 800,
              color: textColor,
              marginBottom: 'clamp(10px, 2.5vw, 20px)',
              opacity: titleFade,
              transform: `translateY(${(1 - titleFade) * 15}px)`,
            }}
          >
            {stepTitle}
          </div>

          {/* Instruction */}
          <div
            style={{
              fontSize: 'clamp(13px, 2.8vw, 22px)',
              color: `${textColor}BB`,
              lineHeight: 1.6,
              marginBottom: 'clamp(14px, 3.5vw, 28px)',
              opacity: instrFade,
              transform: `translateY(${(1 - instrFade) * 12}px)`,
            }}
          >
            {instruction}
          </div>

          {/* Equipment */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 'clamp(6px, 1vw, 10px)',
              marginBottom: 'clamp(8px, 2vw, 16px)',
              opacity: equipFade,
              transform: `translateX(${(1 - equipFade) * 20}px)`,
            }}
          >
            <div
              style={{
                width: 'clamp(3px, 0.5vw, 4px)',
                height: 'clamp(18px, 3vw, 24px)',
                background: accentColor,
                borderRadius: 2,
              }}
            />
            <div style={{ fontSize: 'clamp(12px, 2.4vw, 19px)', color: `${textColor}90` }}>
              <span style={{ color: accentColor, fontWeight: 700, marginRight: 6 }}>EQUIPMENT</span>
              {equipment}
            </div>
          </div>

          {/* Safety + Duration row */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              gap: 'clamp(8px, 2vw, 16px)',
            }}
          >
            {/* Safety note */}
            <div
              style={{
                fontSize: 'clamp(10px, 2vw, 16px)',
                color: '#FFD700',
                fontWeight: 600,
                opacity: safetyFade,
              }}
            >
              {safetyNote}
            </div>

            {/* Duration badge */}
            <div
              style={{
                fontSize: 'clamp(10px, 1.8vw, 15px)',
                color: bgColor,
                background: `${accentColor}CC`,
                padding: '3px 10px',
                borderRadius: 8,
                fontWeight: 700,
                opacity: durFade,
                transform: `scale(${durFade})`,
                whiteSpace: 'nowrap',
              }}
            >
              {duration}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

registerMotionGraphic({
  id: 'tpl-scene-experiment-step',
  title: 'Experiment Step',
  description: 'Experiment procedure step card with numbered badge, progress bar, instruction, equipment list, safety note, and duration',
  tags: ['scene', 'science', 'experiment', 'procedure', 'lab', 'step', 'educational'],
  category: 'scene-layout',
  component: SceneExperimentStepComponent as unknown as React.ComponentType<MotionGraphicProps>,
  configSchema: [
    { key: 'stepNumber', label: 'Step Number', type: 'number', defaultValue: 3, min: 1, max: 20, group: 'Content' },
    { key: 'stepTitle', label: 'Step Title', type: 'text', defaultValue: 'Heat the Solution', group: 'Content' },
    { key: 'instruction', label: 'Instruction', type: 'text', defaultValue: 'Place the beaker on the hot plate and heat to 80 degrees Celsius. Stir continuously.', group: 'Content' },
    { key: 'equipment', label: 'Equipment', type: 'text', defaultValue: 'Hot plate, stirring rod, thermometer', group: 'Content' },
    { key: 'safetyNote', label: 'Safety Note', type: 'text', defaultValue: 'Wear heat-resistant gloves', group: 'Content' },
    { key: 'duration', label: 'Duration', type: 'text', defaultValue: '15 min', group: 'Content' },
    { key: 'accentColor', label: 'Accent Color', type: 'color', defaultValue: '#00D4AA', group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#0a0e17', group: 'Style' },
    { key: 'textColor', label: 'Text Color', type: 'color', defaultValue: '#E8E8E8', group: 'Style' },
  ],
  defaultConfig: {
    stepNumber: 3,
    stepTitle: 'Heat the Solution',
    instruction: 'Place the beaker on the hot plate and heat to 80 degrees Celsius. Stir continuously.',
    equipment: 'Hot plate, stirring rod, thermometer',
    safetyNote: 'Wear heat-resistant gloves',
    duration: '15 min',
    accentColor: '#00D4AA',
    bgColor: '#0a0e17',
    textColor: '#E8E8E8',
  },
})
