import React from 'react'
import { registerMotionGraphic } from '../registry'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface HairTutorialConfig {
  styleName: string
  difficulty: string
  timeNeeded: string
  tools: string[]
  bgColor: string
  textColor: string
  accentColor: string
  cardColor: string
}

function easeOutCubic(t: number): number { return 1 - Math.pow(1 - t, 3) }
function easeInCubic(t: number): number { return t * t * t }
function elasticOut(t: number): number {
  if (t === 0 || t === 1) return t
  return Math.pow(2, -10 * t) * Math.sin((t - 0.075) * (2 * Math.PI) / 0.3) + 1
}

const DIFFICULTY_COLORS: Record<string, string> = {
  Easy: '#22c55e',
  Medium: '#f59e0b',
  Hard: '#ef4444',
}

function SceneHairTutorialComponent({ config, progress }: MotionGraphicProps<HairTutorialConfig>) {
  const { styleName, difficulty, timeNeeded, tools, bgColor, textColor, accentColor, cardColor } = config

  const enterProgress = progress < 0.28 ? progress / 0.28 : 1
  const holdProgress = progress >= 0.28 && progress < 0.8 ? (progress - 0.28) / 0.52 : 0
  const exitProgress = progress >= 0.8 ? (progress - 0.8) / 0.2 : 0

  const exitEased = easeInCubic(exitProgress)
  const exitOpacity = exitProgress > 0 ? 1 - exitEased : 1

  // Header label
  const labelEnter = easeOutCubic(Math.min(1, enterProgress / 0.2))

  // Style name slides in
  const nameEnter = easeOutCubic(Math.max(0, Math.min(1, (enterProgress - 0.1) / 0.3)))

  // Info badges stagger
  const diffEnter = elasticOut(Math.max(0, Math.min(1, (enterProgress - 0.3) / 0.2)))
  const timeEnter = elasticOut(Math.max(0, Math.min(1, (enterProgress - 0.4) / 0.2)))

  // Tools stagger
  const getToolProgress = (idx: number): number => {
    const start = 0.55 + idx * 0.08
    return easeOutCubic(Math.max(0, Math.min(1, (enterProgress - start) / 0.2)))
  }

  // Hold: subtle shimmer on accent
  const shimmerProg = Math.sin(holdProgress * Math.PI * 6) * 0.5 + 0.5

  const diffColor = DIFFICULTY_COLORS[difficulty] || accentColor

  return (
    <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', background: bgColor, fontFamily: "'Inter', 'Helvetica Neue', sans-serif" }}>
      {/* Rose gold gradient accent top */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: '35%',
          background: `linear-gradient(180deg, ${accentColor}10, transparent)`,
        }}
      />

      <div
        style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '6% 8%',
          gap: 'clamp(12px, 2.5vh, 24px)',
          opacity: exitOpacity,
          transform: `translateX(${exitEased * -50}px)`,
        }}
      >
        {/* Tutorial label */}
        <div
          style={{
            fontSize: 'clamp(9px, 1.6vw, 12px)',
            fontWeight: 600,
            color: accentColor,
            letterSpacing: '0.3em',
            textTransform: 'uppercase',
            opacity: labelEnter,
            transform: `translateY(${(1 - labelEnter) * -10}px)`,
          }}
        >
          HAIR TUTORIAL
        </div>

        {/* Style name */}
        <div style={{ overflow: 'hidden' }}>
          <div
            style={{
              fontSize: 'clamp(28px, 7vw, 52px)',
              fontWeight: 800,
              color: textColor,
              textAlign: 'center',
              lineHeight: 1.15,
              transform: `translateY(${(1 - nameEnter) * 100}%)`,
            }}
          >
            {styleName}
          </div>
        </div>

        {/* Accent line */}
        <div
          style={{
            width: 'clamp(30px, 8vw, 60px)',
            height: 2,
            background: `linear-gradient(90deg, transparent, ${accentColor}, transparent)`,
            transform: `scaleX(${nameEnter})`,
          }}
        />

        {/* Info badges row */}
        <div
          style={{
            display: 'flex',
            gap: 'clamp(8px, 2vw, 16px)',
            flexWrap: 'wrap',
            justifyContent: 'center',
          }}
        >
          {/* Difficulty badge */}
          <div
            style={{
              background: `${diffColor}20`,
              border: `1px solid ${diffColor}50`,
              color: diffColor,
              fontSize: 'clamp(10px, 1.8vw, 14px)',
              fontWeight: 600,
              padding: 'clamp(4px, 0.8vh, 8px) clamp(10px, 2vw, 18px)',
              borderRadius: 'clamp(4px, 0.8vw, 8px)',
              transform: `scale(${diffEnter})`,
              letterSpacing: '0.05em',
            }}
          >
            {difficulty}
          </div>

          {/* Time badge */}
          <div
            style={{
              background: `${textColor}10`,
              border: `1px solid ${textColor}20`,
              color: `${textColor}cc`,
              fontSize: 'clamp(10px, 1.8vw, 14px)',
              fontWeight: 500,
              padding: 'clamp(4px, 0.8vh, 8px) clamp(10px, 2vw, 18px)',
              borderRadius: 'clamp(4px, 0.8vw, 8px)',
              transform: `scale(${timeEnter})`,
              display: 'flex',
              alignItems: 'center',
              gap: 'clamp(4px, 0.8vw, 8px)',
            }}
          >
            <span style={{ fontSize: 'clamp(12px, 2vw, 16px)' }}>⏱</span>
            {timeNeeded}
          </div>
        </div>

        {/* Tools section */}
        <div
          style={{
            background: cardColor,
            borderRadius: 'clamp(8px, 1.5vw, 16px)',
            padding: 'clamp(14px, 2.5vh, 24px) clamp(16px, 3vw, 28px)',
            width: '85%',
            maxWidth: 360,
          }}
        >
          <div
            style={{
              fontSize: 'clamp(9px, 1.5vw, 12px)',
              fontWeight: 600,
              color: `${textColor}70`,
              letterSpacing: '0.2em',
              textTransform: 'uppercase',
              marginBottom: 'clamp(8px, 1.5vh, 14px)',
            }}
          >
            TOOLS NEEDED
          </div>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'clamp(6px, 1.2vw, 10px)' }}>
            {tools.slice(0, 6).map((tool, i) => {
              const toolProg = getToolProgress(i)
              return (
                <div
                  key={i}
                  style={{
                    background: `${accentColor}15`,
                    color: accentColor,
                    fontSize: 'clamp(10px, 1.8vw, 14px)',
                    fontWeight: 500,
                    padding: 'clamp(3px, 0.6vh, 6px) clamp(8px, 1.5vw, 14px)',
                    borderRadius: 'clamp(3px, 0.6vw, 6px)',
                    opacity: toolProg,
                    transform: `translateY(${(1 - toolProg) * 10}px)`,
                  }}
                >
                  {tool}
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
  id: 'tpl-scene-hair-tutorial',
  title: 'Hair Tutorial',
  description: 'Hair tutorial step card with style name, difficulty, time, tools list. Soft salon aesthetic with rose gold accents.',
  tags: ['scene', 'hair', 'tutorial', 'beauty', 'salon', 'style', 'fashion'],
  category: 'scene-layout',
  component: SceneHairTutorialComponent as any,
  defaultConfig: {
    styleName: 'Soft Beach Waves',
    difficulty: 'Easy',
    timeNeeded: '15 min',
    tools: ['Curling Iron', 'Heat Spray', 'Sea Salt Spray', 'Wide Comb', 'Clips'],
    bgColor: '#141012',
    textColor: '#f5ede8',
    accentColor: '#c9917a',
    cardColor: '#1e1a18',
  },
  configSchema: [
    { key: 'styleName', label: 'Style Name', type: 'text', defaultValue: 'Soft Beach Waves', group: 'Content' },
    { key: 'difficulty', label: 'Difficulty', type: 'select', defaultValue: 'Easy', options: ['Easy', 'Medium', 'Hard'], group: 'Content' },
    { key: 'timeNeeded', label: 'Time Needed', type: 'text', defaultValue: '15 min', group: 'Content' },
    { key: 'tools', label: 'Tools', type: 'text-array', defaultValue: ['Curling Iron', 'Heat Spray', 'Sea Salt Spray', 'Wide Comb', 'Clips'], group: 'Content' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#141012', group: 'Style' },
    { key: 'textColor', label: 'Text Color', type: 'color', defaultValue: '#f5ede8', group: 'Style' },
    { key: 'accentColor', label: 'Accent (Rose Gold)', type: 'color', defaultValue: '#c9917a', group: 'Style' },
    { key: 'cardColor', label: 'Card Color', type: 'color', defaultValue: '#1e1a18', group: 'Style' },
  ],
})
