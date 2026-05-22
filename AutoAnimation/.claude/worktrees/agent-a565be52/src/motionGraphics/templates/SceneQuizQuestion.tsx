import React from 'react'
import { registerMotionGraphic } from '../registry'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface QuizQuestionConfig {
  question: string
  options: string[]
  correctIndex: number
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

const LETTERS = ['A', 'B', 'C', 'D', 'E', 'F']

function SceneQuizQuestionComponent({
  config,
  frame,
  durationInFrames,
}: MotionGraphicProps<QuizQuestionConfig>) {
  const { question, options, correctIndex, bgColor, textColor } = config
  const progress = frame / durationInFrames

  // Question slides in (0-0.15)
  const questionProgress = easeOutCubic(Math.min(1, progress / 0.15))
  const questionSlideY = (1 - questionProgress) * -40

  // Options stagger in (0.1-0.35)
  const getOptionEnter = (index: number): number => {
    const start = 0.1 + index * 0.06
    const end = start + 0.12
    return easeOutBack(Math.max(0, Math.min(1, (progress - start) / (end - start))))
  }

  // Hold: correct answer reveals (0.5-0.65)
  const revealStart = 0.5
  const revealEnd = 0.65
  const revealProgress = easeOutCubic(Math.max(0, Math.min(1, (progress - revealStart) / (revealEnd - revealStart))))

  // Exit: slides out (0.85-1.0)
  const exitProgress = progress >= 0.85 ? easeOutCubic((progress - 0.85) / 0.15) : 0
  const exitSlideY = exitProgress * -60
  const exitOpacity = 1 - exitProgress

  const getOptionBg = (index: number): string => {
    if (revealProgress <= 0) return `${textColor}10`
    const isCorrect = index === correctIndex
    if (isCorrect) {
      const g = Math.round(revealProgress * 255)
      return `rgba(39, 174, 96, ${0.15 + revealProgress * 0.35})`
    }
    return `${textColor}${Math.round((1 - revealProgress * 0.7) * 16).toString(16).padStart(2, '0')}`
  }

  const getOptionBorder = (index: number): string => {
    if (revealProgress <= 0) return `2px solid ${textColor}20`
    const isCorrect = index === correctIndex
    if (isCorrect) return `2px solid rgba(39, 174, 96, ${revealProgress})`
    return `2px solid ${textColor}${Math.round((1 - revealProgress * 0.6) * 32).toString(16).padStart(2, '0')}`
  }

  const getOptionTextOpacity = (index: number): number => {
    if (revealProgress <= 0) return 1
    const isCorrect = index === correctIndex
    return isCorrect ? 1 : 1 - revealProgress * 0.5
  }

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
        padding: '6% 8%',
        opacity: exitOpacity,
        transform: `translateY(${exitSlideY}px)`,
      }}
    >
      {/* Quiz badge */}
      <div
        style={{
          fontSize: 'clamp(11px, 1.8vw, 16px)',
          fontWeight: 700,
          color: '#F39C12',
          textTransform: 'uppercase',
          letterSpacing: 3,
          marginBottom: '3%',
          opacity: questionProgress,
        }}
      >
        Quiz Time
      </div>

      {/* Question */}
      <div
        style={{
          fontSize: 'clamp(20px, 4.5vw, 40px)',
          fontWeight: 700,
          color: textColor,
          lineHeight: 1.3,
          marginBottom: '6%',
          opacity: questionProgress,
          transform: `translateY(${questionSlideY}px)`,
        }}
      >
        {question}
      </div>

      {/* Options */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: 'clamp(8px, 2vw, 16px)',
          flex: 1,
          justifyContent: 'center',
        }}
      >
        {options.map((option, i) => {
          const enterProg = getOptionEnter(i)
          const isCorrect = i === correctIndex
          const scale = enterProg

          return (
            <div
              key={i}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 'clamp(10px, 2.5vw, 20px)',
                padding: 'clamp(10px, 2.5vw, 20px) clamp(14px, 3vw, 24px)',
                background: getOptionBg(i),
                border: getOptionBorder(i),
                borderRadius: 'clamp(8px, 1.5vw, 14px)',
                opacity: scale,
                transform: `scale(${0.9 + scale * 0.1})`,
              }}
            >
              {/* Letter badge */}
              <div
                style={{
                  width: 'clamp(28px, 5vw, 44px)',
                  height: 'clamp(28px, 5vw, 44px)',
                  borderRadius: '50%',
                  background: isCorrect && revealProgress > 0
                    ? `rgba(39, 174, 96, ${revealProgress})`
                    : `${textColor}15`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 'clamp(13px, 2.2vw, 20px)',
                  fontWeight: 700,
                  color: isCorrect && revealProgress > 0.5 ? '#FFFFFF' : textColor,
                  flexShrink: 0,
                }}
              >
                {isCorrect && revealProgress > 0.7 ? '\u2713' : LETTERS[i] || '?'}
              </div>

              {/* Option text */}
              <div
                style={{
                  fontSize: 'clamp(14px, 2.8vw, 24px)',
                  fontWeight: 500,
                  color: textColor,
                  opacity: getOptionTextOpacity(i),
                }}
              >
                {option}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

registerMotionGraphic({
  id: 'tpl-scene-quiz-question',
  title: 'Quiz Question',
  description:
    'Interactive quiz format with staggered options, correct answer reveal with checkmark, and slide-out exit',
  tags: ['scene', 'educational', 'quiz', 'question', 'interactive'],
  category: 'scene-layout',
  component: SceneQuizQuestionComponent as unknown as React.ComponentType<MotionGraphicProps>,
  configSchema: [
    { key: 'question', label: 'Question', type: 'text', defaultValue: 'What is the capital of France?', group: 'Content' },
    { key: 'options', label: 'Options', type: 'text-array', defaultValue: ['London', 'Paris', 'Berlin', 'Madrid'], group: 'Content' },
    { key: 'correctIndex', label: 'Correct Answer (0-based)', type: 'number', defaultValue: 1, group: 'Content', min: 0, max: 5 },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#0F0F1A', group: 'Style' },
    { key: 'textColor', label: 'Text Color', type: 'color', defaultValue: '#F0F0F0', group: 'Style' },
  ],
  defaultConfig: {
    question: 'What is the capital of France?',
    options: ['London', 'Paris', 'Berlin', 'Madrid'],
    correctIndex: 1,
    bgColor: '#0F0F1A',
    textColor: '#F0F0F0',
  },
})
