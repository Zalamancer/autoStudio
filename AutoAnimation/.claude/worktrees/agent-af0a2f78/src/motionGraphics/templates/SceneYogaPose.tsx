import React from 'react'
import { registerMotionGraphic } from '../registry'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface SceneYogaPoseConfig {
  poseName: string
  sanskritName: string
  difficulty: number
  duration: string
  benefits: string[]
  category: string
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

function SceneYogaPoseComponent({ config, progress }: MotionGraphicProps<SceneYogaPoseConfig>) {
  const { poseName, sanskritName, difficulty, duration, benefits, category: poseCategory, bgColor, textColor, accentColor } = config

  const enterProgress = progress < 0.2 ? progress / 0.2 : 1
  const holdProgress = progress >= 0.2 && progress < 0.8 ? (progress - 0.2) / 0.6 : progress >= 0.8 ? 1 : 0
  const exitProgress = progress >= 0.8 ? (progress - 0.8) / 0.2 : 0

  const exitEased = easeInCubic(exitProgress)
  const exitOpacity = exitProgress > 0 ? 1 - exitEased : 1
  const exitScale = exitProgress > 0 ? 1 - exitEased * 0.1 : 1

  const cardEnter = easeOutBack(Math.min(1, enterProgress / 0.6))
  const nameEnter = easeOutCubic(Math.max(0, Math.min(1, (enterProgress - 0.1) / 0.5)))
  const detailEnter = easeOutCubic(Math.max(0, Math.min(1, (enterProgress - 0.3) / 0.5)))
  const benefitsEnter = easeOutCubic(Math.max(0, Math.min(1, (enterProgress - 0.5) / 0.5)))

  const isHolding = progress >= 0.2 && progress < 0.8

  // Lotus icon built from shapes
  const lotusScale = isHolding ? 1 + Math.sin(holdProgress * Math.PI * 4) * 0.04 : 1

  return (
    <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', fontFamily: "'Inter', 'Helvetica Neue', sans-serif" }}>
      <div style={{ position: 'absolute', inset: 0, background: bgColor }} />

      {/* Subtle gradient corner */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          right: 0,
          width: '50%',
          height: '50%',
          background: `radial-gradient(circle at top right, ${accentColor}06, transparent 70%)`,
        }}
      />

      <div
        style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          flexDirection: 'column',
          padding: 'clamp(20px, 5vw, 48px)',
          opacity: exitOpacity,
          transform: `scale(${exitScale})`,
        }}
      >
        {/* Category tag */}
        <div
          style={{
            display: 'inline-flex',
            alignSelf: 'flex-start',
            background: `${accentColor}15`,
            border: `1px solid ${accentColor}25`,
            borderRadius: 100,
            padding: 'clamp(3px, 0.5vw, 5px) clamp(10px, 1.8vw, 18px)',
            fontSize: 'clamp(9px, 1.4vw, 12px)',
            fontWeight: 600,
            color: accentColor,
            textTransform: 'uppercase',
            letterSpacing: '0.1em',
            marginBottom: 'clamp(16px, 3vw, 28px)',
            opacity: cardEnter,
            transform: `scale(${cardEnter}) translateX(${(1 - cardEnter) * -20}px)`,
          }}
        >
          {poseCategory}
        </div>

        {/* Lotus icon */}
        <div
          style={{
            width: 'clamp(48px, 10vw, 80px)',
            height: 'clamp(48px, 10vw, 80px)',
            marginBottom: 'clamp(12px, 2.5vw, 24px)',
            opacity: nameEnter,
            transform: `scale(${nameEnter * lotusScale})`,
          }}
        >
          <svg viewBox="0 0 80 80" fill="none" style={{ width: '100%', height: '100%' }}>
            {/* Center petal */}
            <ellipse cx="40" cy="35" rx="10" ry="22" fill={`${accentColor}30`} stroke={`${accentColor}50`} strokeWidth="1" />
            {/* Left petals */}
            <ellipse cx="40" cy="35" rx="10" ry="22" fill={`${accentColor}20`} stroke={`${accentColor}40`} strokeWidth="1" transform="rotate(-30 40 35)" />
            <ellipse cx="40" cy="35" rx="10" ry="22" fill={`${accentColor}15`} stroke={`${accentColor}30`} strokeWidth="1" transform="rotate(-60 40 35)" />
            {/* Right petals */}
            <ellipse cx="40" cy="35" rx="10" ry="22" fill={`${accentColor}20`} stroke={`${accentColor}40`} strokeWidth="1" transform="rotate(30 40 35)" />
            <ellipse cx="40" cy="35" rx="10" ry="22" fill={`${accentColor}15`} stroke={`${accentColor}30`} strokeWidth="1" transform="rotate(60 40 35)" />
            {/* Center dot */}
            <circle cx="40" cy="35" r="4" fill={`${accentColor}60`} />
          </svg>
        </div>

        {/* Pose name */}
        <div
          style={{
            fontSize: 'clamp(26px, 6vw, 48px)',
            fontWeight: 800,
            color: textColor,
            lineHeight: 1.1,
            marginBottom: 'clamp(2px, 0.5vw, 6px)',
            opacity: nameEnter,
            transform: `translateY(${(1 - nameEnter) * 15}px)`,
          }}
        >
          {poseName}
        </div>

        {/* Sanskrit name */}
        <div
          style={{
            fontSize: 'clamp(12px, 2.2vw, 18px)',
            fontWeight: 300,
            fontStyle: 'italic',
            color: `${accentColor}aa`,
            marginBottom: 'clamp(16px, 3vw, 28px)',
            opacity: nameEnter,
          }}
        >
          {sanskritName}
        </div>

        {/* Difficulty stars and duration row */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 'clamp(16px, 3vw, 28px)',
            marginBottom: 'clamp(20px, 4vw, 36px)',
            opacity: detailEnter,
            transform: `translateY(${(1 - detailEnter) * 10}px)`,
          }}
        >
          {/* Stars */}
          <div style={{ display: 'flex', gap: 'clamp(2px, 0.4vw, 4px)' }}>
            {Array.from({ length: 5 }, (_, i) => (
              <div
                key={i}
                style={{
                  width: 'clamp(14px, 2.5vw, 22px)',
                  height: 'clamp(14px, 2.5vw, 22px)',
                }}
              >
                <svg viewBox="0 0 24 24" fill={i < difficulty ? accentColor : `${textColor}15`} style={{ width: '100%', height: '100%' }}>
                  <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                </svg>
              </div>
            ))}
          </div>

          {/* Divider */}
          <div style={{ width: 1, height: 'clamp(18px, 3vw, 28px)', background: `${textColor}15` }} />

          {/* Duration */}
          <div
            style={{
              fontSize: 'clamp(12px, 2vw, 17px)',
              fontWeight: 600,
              color: `${textColor}88`,
            }}
          >
            Hold {duration}
          </div>
        </div>

        {/* Benefits */}
        <div
          style={{
            opacity: benefitsEnter,
            transform: `translateY(${(1 - benefitsEnter) * 10}px)`,
          }}
        >
          <div
            style={{
              fontSize: 'clamp(9px, 1.3vw, 11px)',
              fontWeight: 600,
              color: `${textColor}44`,
              textTransform: 'uppercase',
              letterSpacing: '0.1em',
              marginBottom: 'clamp(8px, 1.5vw, 14px)',
            }}
          >
            Benefits
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'clamp(4px, 0.8vw, 8px)' }}>
            {benefits.map((benefit, i) => {
              const benefitDelay = 0.5 + i * 0.06
              const bEnter = easeOutCubic(Math.max(0, Math.min(1, (enterProgress - benefitDelay) / 0.3)))

              return (
                <div
                  key={i}
                  style={{
                    background: `${textColor}08`,
                    border: `1px solid ${textColor}10`,
                    borderRadius: 100,
                    padding: 'clamp(3px, 0.5vw, 5px) clamp(10px, 1.8vw, 16px)',
                    fontSize: 'clamp(10px, 1.6vw, 14px)',
                    fontWeight: 500,
                    color: `${textColor}aa`,
                    opacity: bEnter,
                    transform: `scale(${bEnter})`,
                  }}
                >
                  {benefit}
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
  id: 'tpl-scene-yoga-pose',
  title: 'Yoga Pose',
  description: 'Yoga pose card with SVG lotus icon, difficulty stars, hold duration, benefits tags, and Sanskrit name',
  tags: ['scene', 'yoga', 'pose', 'fitness', 'meditation', 'mindfulness', 'wellness', 'health'],
  category: 'scene-layout',
  component: SceneYogaPoseComponent as any,
  defaultConfig: {
    poseName: 'Tree Pose',
    sanskritName: 'Vrksasana',
    difficulty: 2,
    duration: '30-60s',
    benefits: ['Balance', 'Focus', 'Core Strength', 'Calming'],
    category: 'Standing',
    bgColor: '#0c1210',
    textColor: '#e8f0ec',
    accentColor: '#6db58a',
  },
  configSchema: [
    { key: 'poseName', label: 'Pose Name', type: 'text', defaultValue: 'Tree Pose', group: 'Content' },
    { key: 'sanskritName', label: 'Sanskrit Name', type: 'text', defaultValue: 'Vrksasana', group: 'Content' },
    { key: 'difficulty', label: 'Difficulty (1-5)', type: 'number', defaultValue: 2, min: 1, max: 5, group: 'Content' },
    { key: 'duration', label: 'Hold Duration', type: 'text', defaultValue: '30-60s', group: 'Content' },
    { key: 'benefits', label: 'Benefits', type: 'text-array', defaultValue: ['Balance', 'Focus', 'Core Strength', 'Calming'], group: 'Content' },
    { key: 'category', label: 'Pose Category', type: 'text', defaultValue: 'Standing', group: 'Content' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#0c1210', group: 'Style' },
    { key: 'textColor', label: 'Text Color', type: 'color', defaultValue: '#e8f0ec', group: 'Style' },
    { key: 'accentColor', label: 'Accent Color', type: 'color', defaultValue: '#6db58a', group: 'Style' },
  ],
})
