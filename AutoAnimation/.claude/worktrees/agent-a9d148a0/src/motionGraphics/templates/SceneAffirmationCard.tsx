import React from 'react'
import { registerMotionGraphic } from '../registry'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface SceneAffirmationCardConfig {
  affirmation: string
  category: string
  dayNumber: number
  bgColorStart: string
  bgColorEnd: string
  textColor: string
  accentColor: string
}

function easeOutCubic(t: number): number { return 1 - Math.pow(1 - t, 3) }
function easeInCubic(t: number): number { return t * t * t }
function easeOutQuint(t: number): number { return 1 - Math.pow(1 - t, 5) }
function easeInOutSine(t: number): number { return -(Math.cos(Math.PI * t) - 1) / 2 }

function SceneAffirmationCardComponent({ config, progress }: MotionGraphicProps<SceneAffirmationCardConfig>) {
  const { affirmation, category, dayNumber, bgColorStart, bgColorEnd, textColor, accentColor } = config

  const enterProgress = progress < 0.2 ? progress / 0.2 : 1
  const holdProgress = progress >= 0.2 && progress < 0.8 ? (progress - 0.2) / 0.6 : progress >= 0.8 ? 1 : 0
  const exitProgress = progress >= 0.8 ? (progress - 0.8) / 0.2 : 0

  const exitEased = easeInCubic(exitProgress)
  const exitOpacity = exitProgress > 0 ? 1 - exitEased : 1

  const isHolding = progress >= 0.2 && progress < 0.8
  const breathe = isHolding ? easeInOutSine((Math.sin(holdProgress * Math.PI * 4) + 1) / 2) : 0

  // Text reveal: word by word
  const words = affirmation.split(' ')
  const dayEnter = easeOutCubic(Math.min(1, enterProgress / 0.3))
  const categoryEnter = easeOutCubic(Math.max(0, Math.min(1, (enterProgress - 0.1) / 0.4)))
  const lineEnter = easeOutCubic(Math.max(0, Math.min(1, (enterProgress - 0.15) / 0.4)))

  // Floating orbs
  const orbCount = 4

  return (
    <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', fontFamily: "'Georgia', 'Palatino Linotype', serif" }}>
      {/* Gradient background */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: `linear-gradient(160deg, ${bgColorStart} 0%, ${bgColorEnd} 100%)`,
        }}
      />

      {/* Floating orbs */}
      {Array.from({ length: orbCount }, (_, i) => {
        const angle = (i / orbCount) * Math.PI * 2 + (isHolding ? holdProgress * Math.PI * 2 : 0) * 0.3
        const orbX = 50 + Math.cos(angle + i) * 25
        const orbY = 50 + Math.sin(angle * 0.7 + i * 2) * 25
        const orbSize = 80 + i * 40
        const orbOpacity = 0.03 + breathe * 0.02

        return (
          <div
            key={i}
            style={{
              position: 'absolute',
              left: `${orbX}%`,
              top: `${orbY}%`,
              width: orbSize,
              height: orbSize,
              transform: 'translate(-50%, -50%)',
              borderRadius: '50%',
              background: `radial-gradient(circle, ${accentColor} 0%, transparent 70%)`,
              opacity: orbOpacity * lineEnter,
            }}
          />
        )
      })}

      <div
        style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 'clamp(28px, 8vw, 64px)',
          opacity: exitOpacity,
        }}
      >
        {/* Day number */}
        <div
          style={{
            fontSize: 'clamp(10px, 1.5vw, 13px)',
            fontWeight: 400,
            fontFamily: "'Inter', sans-serif",
            color: `${textColor}44`,
            textTransform: 'uppercase',
            letterSpacing: '0.2em',
            marginBottom: 'clamp(4px, 0.8vw, 8px)',
            opacity: dayEnter,
          }}
        >
          Day {dayNumber}
        </div>

        {/* Category */}
        <div
          style={{
            display: 'inline-block',
            background: `${accentColor}12`,
            border: `1px solid ${accentColor}20`,
            borderRadius: 100,
            padding: 'clamp(3px, 0.5vw, 5px) clamp(12px, 2vw, 20px)',
            fontSize: 'clamp(9px, 1.4vw, 12px)',
            fontWeight: 500,
            fontFamily: "'Inter', sans-serif",
            color: `${accentColor}cc`,
            textTransform: 'uppercase',
            letterSpacing: '0.12em',
            marginBottom: 'clamp(24px, 5vw, 48px)',
            opacity: categoryEnter,
            transform: `scale(${categoryEnter})`,
          }}
        >
          {category}
        </div>

        {/* Decorative line */}
        <div
          style={{
            width: 'clamp(24px, 6vw, 44px)',
            height: 1,
            background: `${accentColor}40`,
            marginBottom: 'clamp(24px, 5vw, 44px)',
            transform: `scaleX(${lineEnter})`,
          }}
        />

        {/* Affirmation text — word by word reveal */}
        <div
          style={{
            fontSize: 'clamp(22px, 5.5vw, 44px)',
            fontWeight: 400,
            color: textColor,
            textAlign: 'center',
            lineHeight: 1.5,
            maxWidth: '90%',
            letterSpacing: '0.01em',
          }}
        >
          {words.map((word, i) => {
            const wordDelay = 0.25 + (i / words.length) * 0.45
            const wordProgress = Math.max(0, Math.min(1, (enterProgress - wordDelay) / 0.2))
            const wordEased = easeOutQuint(wordProgress)
            const wordGlow = isHolding && wordEased >= 1
              ? Math.sin(holdProgress * Math.PI * 6 + i * 0.4) * 0.15
              : 0

            return (
              <span
                key={i}
                style={{
                  display: 'inline-block',
                  opacity: wordEased,
                  transform: `translateY(${(1 - wordEased) * 15}px)`,
                  textShadow: wordGlow > 0 ? `0 0 ${20 + wordGlow * 20}px ${accentColor}30` : 'none',
                  marginRight: '0.28em',
                }}
              >
                {word}
              </span>
            )
          })}
        </div>

        {/* Bottom decorative line */}
        <div
          style={{
            width: 'clamp(24px, 6vw, 44px)',
            height: 1,
            background: `${accentColor}40`,
            marginTop: 'clamp(24px, 5vw, 44px)',
            transform: `scaleX(${lineEnter})`,
          }}
        />

        {/* Lotus icon bottom */}
        <div
          style={{
            marginTop: 'clamp(16px, 3vw, 28px)',
            opacity: categoryEnter * 0.4,
            transform: `scale(${0.8 + breathe * 0.2})`,
          }}
        >
          <svg viewBox="0 0 40 24" width="clamp(28px, 5vw, 44px)" fill={accentColor}>
            <ellipse cx="20" cy="12" rx="5" ry="11" opacity="0.4" />
            <ellipse cx="20" cy="12" rx="5" ry="11" opacity="0.3" transform="rotate(-25 20 12)" />
            <ellipse cx="20" cy="12" rx="5" ry="11" opacity="0.3" transform="rotate(25 20 12)" />
            <ellipse cx="20" cy="12" rx="5" ry="11" opacity="0.2" transform="rotate(-50 20 12)" />
            <ellipse cx="20" cy="12" rx="5" ry="11" opacity="0.2" transform="rotate(50 20 12)" />
          </svg>
        </div>
      </div>
    </div>
  )
}

registerMotionGraphic({
  id: 'tpl-scene-affirmation-card',
  title: 'Affirmation Card',
  description: 'Daily affirmation with word-by-word text reveal, floating orbs, gradient background, and lotus accent',
  tags: ['scene', 'affirmation', 'meditation', 'mindfulness', 'wellness', 'self-care', 'daily', 'inspiration'],
  category: 'scene-layout',
  component: SceneAffirmationCardComponent as any,
  defaultConfig: {
    affirmation: 'I am at peace with what was, content with what is, and excited for what is to come.',
    category: 'Inner Peace',
    dayNumber: 42,
    bgColorStart: '#0f1520',
    bgColorEnd: '#18101e',
    textColor: '#e8e0f0',
    accentColor: '#b48ead',
  },
  configSchema: [
    { key: 'affirmation', label: 'Affirmation', type: 'text', defaultValue: 'I am at peace with what was, content with what is, and excited for what is to come.', group: 'Content' },
    { key: 'category', label: 'Category', type: 'text', defaultValue: 'Inner Peace', group: 'Content' },
    { key: 'dayNumber', label: 'Day Number', type: 'number', defaultValue: 42, min: 1, max: 365, group: 'Content' },
    { key: 'bgColorStart', label: 'BG Gradient Start', type: 'color', defaultValue: '#0f1520', group: 'Style' },
    { key: 'bgColorEnd', label: 'BG Gradient End', type: 'color', defaultValue: '#18101e', group: 'Style' },
    { key: 'textColor', label: 'Text Color', type: 'color', defaultValue: '#e8e0f0', group: 'Style' },
    { key: 'accentColor', label: 'Accent Color', type: 'color', defaultValue: '#b48ead', group: 'Style' },
  ],
})
