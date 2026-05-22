import React from 'react'
import { registerMotionGraphic } from '../registry'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface EcoScoreConfig {
  score: number
  maxScore: number
  label: string
  category1: string
  category1Score: number
  category2: string
  category2Score: number
  category3: string
  category3Score: number
  bgColor: string
  textColor: string
  accentColor: string
}

function easeOutCubic(t: number): number { return 1 - Math.pow(1 - t, 3) }
function easeInCubic(t: number): number { return t * t * t }
function easeOutBack(t: number): number {
  const c1 = 1.70158
  const c3 = c1 + 1
  return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2)
}

function SceneEcoScoreComponent({ config, progress }: MotionGraphicProps<EcoScoreConfig>) {
  const { score, maxScore, label, category1, category1Score, category2, category2Score, category3, category3Score, bgColor, textColor, accentColor } = config

  const enterProgress = progress < 0.2 ? progress / 0.2 : 1
  const holdProgress = progress >= 0.2 && progress < 0.8 ? (progress - 0.2) / 0.6 : progress >= 0.8 ? 1 : 0
  const exitProgress = progress >= 0.8 ? (progress - 0.8) / 0.2 : 0

  const exitEased = easeInCubic(exitProgress)
  const exitOpacity = exitProgress > 0 ? 1 - exitEased : 1

  // Score ring animation
  const scorePercent = score / maxScore
  const ringProgress = easeOutCubic(Math.min(1, enterProgress / 0.7))
  const displayScore = Math.round(ringProgress * score)
  const ringDash = ringProgress * scorePercent * 283

  // Grade letter
  const grade = scorePercent >= 0.9 ? 'A+' : scorePercent >= 0.8 ? 'A' : scorePercent >= 0.7 ? 'B' : scorePercent >= 0.6 ? 'C' : 'D'
  const gradeColor = scorePercent >= 0.7 ? '#4CAF50' : scorePercent >= 0.5 ? '#FFC107' : '#F44336'
  const gradeEnter = easeOutBack(Math.max(0, Math.min(1, (enterProgress - 0.3) / 0.4)))

  // Category bars
  const categories = [
    { name: category1, value: category1Score },
    { name: category2, value: category2Score },
    { name: category3, value: category3Score },
  ]
  const getBarProgress = (idx: number) =>
    easeOutCubic(Math.max(0, Math.min(1, (enterProgress - 0.4 - idx * 0.1) / 0.4)))

  // Pulse on hold
  const ringPulse = progress >= 0.2 && progress < 0.8
    ? 1 + Math.sin(holdProgress * Math.PI * 6) * 0.02
    : 1

  return (
    <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', fontFamily: "'Inter', 'Helvetica Neue', sans-serif" }}>
      <div style={{ position: 'absolute', inset: 0, background: bgColor }} />
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          background: `radial-gradient(circle at 30% 30%, ${accentColor}10, transparent 60%)`,
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
          padding: '6%',
          opacity: exitOpacity,
          transform: `scale(${exitProgress > 0 ? 1 - exitEased * 0.1 : 1})`,
        }}
      >
        {/* Label */}
        <div
          style={{
            fontSize: 'clamp(10px, 1.8vw, 14px)',
            fontWeight: 700,
            color: accentColor,
            textTransform: 'uppercase',
            letterSpacing: 3,
            marginBottom: 'clamp(12px, 2vh, 24px)',
            opacity: easeOutCubic(Math.min(1, enterProgress / 0.3)),
          }}
        >
          {label}
        </div>

        {/* Score ring */}
        <div
          style={{
            position: 'relative',
            width: 'clamp(120px, 28vw, 200px)',
            height: 'clamp(120px, 28vw, 200px)',
            marginBottom: 'clamp(16px, 3vh, 32px)',
            transform: `scale(${ringPulse})`,
          }}
        >
          <svg viewBox="0 0 100 100" style={{ width: '100%', height: '100%', transform: 'rotate(-90deg)' }}>
            <circle cx="50" cy="50" r="45" fill="none" stroke={`${textColor}15`} strokeWidth="6" />
            <circle
              cx="50"
              cy="50"
              r="45"
              fill="none"
              stroke={accentColor}
              strokeWidth="6"
              strokeLinecap="round"
              strokeDasharray={`${ringDash} 283`}
              style={{ filter: `drop-shadow(0 0 6px ${accentColor}60)` }}
            />
          </svg>
          <div
            style={{
              position: 'absolute',
              inset: 0,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <div style={{ fontSize: 'clamp(28px, 7vw, 48px)', fontWeight: 900, color: textColor, lineHeight: 1 }}>
              {displayScore}
            </div>
            <div style={{ fontSize: 'clamp(10px, 1.5vw, 13px)', color: `${textColor}77`, fontWeight: 500 }}>
              / {maxScore}
            </div>
          </div>
          {/* Grade badge */}
          <div
            style={{
              position: 'absolute',
              top: '-4px',
              right: '-4px',
              width: 'clamp(32px, 7vw, 48px)',
              height: 'clamp(32px, 7vw, 48px)',
              borderRadius: '50%',
              background: gradeColor,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 'clamp(12px, 2.5vw, 18px)',
              fontWeight: 900,
              color: '#fff',
              transform: `scale(${gradeEnter})`,
              boxShadow: `0 2px 10px ${gradeColor}60`,
            }}
          >
            {grade}
          </div>
        </div>

        {/* Category breakdown bars */}
        <div style={{ width: '100%', maxWidth: '380px' }}>
          {categories.map((cat, i) => {
            const barProg = getBarProgress(i)
            const barWidth = barProg * cat.value
            return (
              <div
                key={i}
                style={{
                  marginBottom: 'clamp(8px, 1.5vh, 14px)',
                  opacity: barProg,
                  transform: `translateX(${(1 - barProg) * 20}px)`,
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    marginBottom: 'clamp(2px, 0.4vh, 4px)',
                  }}
                >
                  <span style={{ fontSize: 'clamp(11px, 1.8vw, 14px)', color: textColor, fontWeight: 600 }}>
                    {cat.name}
                  </span>
                  <span style={{ fontSize: 'clamp(11px, 1.8vw, 14px)', color: accentColor, fontWeight: 700 }}>
                    {Math.round(barWidth)}%
                  </span>
                </div>
                <div
                  style={{
                    width: '100%',
                    height: 'clamp(6px, 1vw, 8px)',
                    background: `${textColor}15`,
                    borderRadius: '4px',
                    overflow: 'hidden',
                  }}
                >
                  <div
                    style={{
                      width: `${barWidth}%`,
                      height: '100%',
                      background: `linear-gradient(90deg, ${accentColor}, ${accentColor}cc)`,
                      borderRadius: '4px',
                      boxShadow: `0 0 8px ${accentColor}30`,
                    }}
                  />
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

registerMotionGraphic({
  id: 'tpl-scene-eco-score',
  title: 'Eco Score',
  description: 'Eco/sustainability score card with animated ring gauge, grade badge, and category breakdown bars with staggered reveal.',
  tags: ['scene', 'eco', 'score', 'sustainability', 'environment', 'rating', 'green'],
  category: 'scene-layout',
  component: SceneEcoScoreComponent as any,
  defaultConfig: {
    score: 78,
    maxScore: 100,
    label: 'Eco Score',
    category1: 'Energy',
    category1Score: 85,
    category2: 'Waste',
    category2Score: 72,
    category3: 'Transport',
    category3Score: 65,
    bgColor: '#0D1F0D',
    textColor: '#E8F5E9',
    accentColor: '#4CAF50',
  },
  configSchema: [
    { key: 'score', label: 'Score', type: 'number', defaultValue: 78, min: 0, max: 100, group: 'Content' },
    { key: 'maxScore', label: 'Max Score', type: 'number', defaultValue: 100, min: 1, max: 1000, group: 'Content' },
    { key: 'label', label: 'Label', type: 'text', defaultValue: 'Eco Score', group: 'Content' },
    { key: 'category1', label: 'Category 1', type: 'text', defaultValue: 'Energy', group: 'Content' },
    { key: 'category1Score', label: 'Category 1 Score', type: 'number', defaultValue: 85, min: 0, max: 100, group: 'Content' },
    { key: 'category2', label: 'Category 2', type: 'text', defaultValue: 'Waste', group: 'Content' },
    { key: 'category2Score', label: 'Category 2 Score', type: 'number', defaultValue: 72, min: 0, max: 100, group: 'Content' },
    { key: 'category3', label: 'Category 3', type: 'text', defaultValue: 'Transport', group: 'Content' },
    { key: 'category3Score', label: 'Category 3 Score', type: 'number', defaultValue: 65, min: 0, max: 100, group: 'Content' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#0D1F0D', group: 'Style' },
    { key: 'textColor', label: 'Text Color', type: 'color', defaultValue: '#E8F5E9', group: 'Style' },
    { key: 'accentColor', label: 'Accent Color', type: 'color', defaultValue: '#4CAF50', group: 'Style' },
  ],
})
