import React from 'react'
import { registerMotionGraphic } from '../registry'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface SceneReadingChallengeConfig {
  challengeTitle: string
  year: string
  booksRead: number
  goalBooks: number
  favoriteGenre: string
  currentBook: string
  bgColor: string
  textColor: string
  accentColor: string
  progressColor: string
}

function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3)
}
function easeInCubic(t: number): number {
  return t * t * t
}
function easeOutBack(t: number): number {
  const c1 = 1.70158
  const c3 = c1 + 1
  return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2)
}

function SceneReadingChallengeComponent({ config, progress }: MotionGraphicProps<SceneReadingChallengeConfig>) {
  const { challengeTitle, year, booksRead, goalBooks, favoriteGenre, currentBook, bgColor, textColor, accentColor, progressColor } = config

  const enterProgress = progress < 0.25 ? progress / 0.25 : 1
  const holdProgress = progress >= 0.25 && progress < 0.8 ? (progress - 0.25) / 0.55 : progress >= 0.8 ? 1 : 0
  const exitProgress = progress >= 0.8 ? (progress - 0.8) / 0.2 : 0

  const headerReveal = easeOutCubic(Math.min(1, enterProgress / 0.35))
  const ringReveal = easeOutCubic(Math.max(0, Math.min(1, (enterProgress - 0.15) / 0.5)))
  const statsReveal = easeOutCubic(Math.max(0, Math.min(1, (enterProgress - 0.45) / 0.4)))
  const currentReveal = easeOutCubic(Math.max(0, Math.min(1, (enterProgress - 0.65) / 0.3)))

  const pct = goalBooks > 0 ? Math.min(1, booksRead / goalBooks) : 0
  const circumference = 2 * Math.PI * 52
  const strokeDashoffset = circumference * (1 - pct * ringReveal)

  // Hold: number counting pulse
  const countPulse = holdProgress > 0 ? 1 + Math.sin(holdProgress * Math.PI * 4) * 0.04 : 1

  const exitEased = easeInCubic(exitProgress)
  const exitOpacity = 1 - exitEased

  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        overflow: 'hidden',
        background: bgColor,
        fontFamily: "'Georgia', 'Palatino Linotype', serif",
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '6%',
      }}
    >
      {/* Decorative texture */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background:
            'repeating-linear-gradient(0deg, transparent, transparent 40px, rgba(139,109,76,0.03) 40px, rgba(139,109,76,0.03) 41px)',
        }}
      />

      <div
        style={{
          width: '100%',
          maxWidth: 460,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 'clamp(12px, 2.5vw, 22px)',
          opacity: exitOpacity,
          transform: `scale(${1 - exitEased * 0.12})`,
        }}
      >
        {/* Header */}
        <div
          style={{
            textAlign: 'center',
            opacity: headerReveal,
            transform: `translateY(${(1 - headerReveal) * 20}px)`,
          }}
        >
          <div
            style={{
              fontSize: 'clamp(9px, 1.5vw, 12px)',
              fontFamily: "'Inter', sans-serif",
              textTransform: 'uppercase',
              letterSpacing: '0.15em',
              color: accentColor,
              marginBottom: 4,
            }}
          >
            {year}
          </div>
          <div
            style={{
              fontSize: 'clamp(20px, 5vw, 36px)',
              fontWeight: 700,
              color: textColor,
              lineHeight: 1.1,
            }}
          >
            {challengeTitle}
          </div>
        </div>

        {/* Progress ring */}
        <div style={{ position: 'relative', opacity: ringReveal }}>
          <svg
            width="clamp(100px, 28vw, 160px)"
            height="clamp(100px, 28vw, 160px)"
            viewBox="0 0 120 120"
            style={{ display: 'block' }}
          >
            {/* Background ring */}
            <circle
              cx="60"
              cy="60"
              r="52"
              fill="none"
              stroke={`${textColor}12`}
              strokeWidth="8"
            />
            {/* Progress ring */}
            <circle
              cx="60"
              cy="60"
              r="52"
              fill="none"
              stroke={progressColor}
              strokeWidth="8"
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              transform="rotate(-90 60 60)"
              style={{ filter: `drop-shadow(0 0 4px ${progressColor}40)` }}
            />
          </svg>
          {/* Center number */}
          <div
            style={{
              position: 'absolute',
              inset: 0,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              transform: `scale(${countPulse})`,
            }}
          >
            <div
              style={{
                fontSize: 'clamp(28px, 7vw, 48px)',
                fontWeight: 900,
                color: accentColor,
                fontFamily: "'Inter', sans-serif",
                lineHeight: 1,
              }}
            >
              {Math.round(booksRead * ringReveal)}
            </div>
            <div
              style={{
                fontSize: 'clamp(9px, 1.4vw, 12px)',
                color: `${textColor}60`,
                fontFamily: "'Inter', sans-serif",
              }}
            >
              of {goalBooks}
            </div>
          </div>
        </div>

        {/* Stats row */}
        <div
          style={{
            display: 'flex',
            gap: 'clamp(10px, 2vw, 20px)',
            justifyContent: 'center',
            opacity: statsReveal,
            transform: `translateY(${(1 - statsReveal) * 12}px)`,
          }}
        >
          {[
            { label: 'Completion', value: `${Math.round(pct * 100)}%` },
            { label: 'Remaining', value: `${Math.max(0, goalBooks - booksRead)}` },
            { label: 'Fav Genre', value: favoriteGenre },
          ].map((stat, i) => (
            <div
              key={i}
              style={{
                background: `${textColor}06`,
                border: `1px solid ${textColor}10`,
                borderRadius: 'clamp(6px, 1vw, 10px)',
                padding: 'clamp(6px, 1vw, 10px) clamp(10px, 1.5vw, 16px)',
                textAlign: 'center',
              }}
            >
              <div
                style={{
                  fontSize: 'clamp(7px, 1.2vw, 9px)',
                  fontFamily: "'Inter', sans-serif",
                  textTransform: 'uppercase',
                  letterSpacing: '0.1em',
                  color: `${textColor}50`,
                  marginBottom: 2,
                }}
              >
                {stat.label}
              </div>
              <div
                style={{
                  fontSize: 'clamp(13px, 2.2vw, 18px)',
                  fontWeight: 700,
                  color: textColor,
                  fontFamily: "'Inter', sans-serif",
                }}
              >
                {stat.value}
              </div>
            </div>
          ))}
        </div>

        {/* Currently reading */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 'clamp(8px, 1.5vw, 12px)',
            background: `${accentColor}10`,
            borderRadius: 'clamp(6px, 1vw, 10px)',
            padding: 'clamp(8px, 1.5vw, 14px) clamp(12px, 2vw, 20px)',
            border: `1px solid ${accentColor}20`,
            opacity: currentReveal,
            transform: `translateY(${(1 - currentReveal) * 8}px)`,
            width: '100%',
          }}
        >
          <div style={{ fontSize: 'clamp(16px, 3vw, 24px)' }}>{'\uD83D\uDCD6'}</div>
          <div>
            <div
              style={{
                fontSize: 'clamp(8px, 1.3vw, 10px)',
                fontFamily: "'Inter', sans-serif",
                textTransform: 'uppercase',
                letterSpacing: '0.1em',
                color: `${textColor}50`,
              }}
            >
              Currently Reading
            </div>
            <div
              style={{
                fontSize: 'clamp(12px, 2vw, 16px)',
                fontStyle: 'italic',
                fontWeight: 600,
                color: textColor,
              }}
            >
              {currentBook}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

registerMotionGraphic({
  id: 'tpl-scene-reading-challenge',
  title: 'Reading Challenge',
  description:
    'Annual reading challenge tracker with animated progress ring, book count, stats, and currently reading section',
  tags: ['scene', 'book', 'reading', 'challenge', 'tracker', 'progress', 'literary', 'literature'],
  category: 'scene-layout',
  component: SceneReadingChallengeComponent as any,
  defaultConfig: {
    challengeTitle: 'Reading Challenge',
    year: '2024',
    booksRead: 18,
    goalBooks: 24,
    favoriteGenre: 'Sci-Fi',
    currentBook: 'Project Hail Mary',
    bgColor: '#1a150e',
    textColor: '#f5edd6',
    accentColor: '#C9A96E',
    progressColor: '#8B6D4C',
  },
  configSchema: [
    { key: 'challengeTitle', label: 'Title', type: 'text', defaultValue: 'Reading Challenge', group: 'Content' },
    { key: 'year', label: 'Year', type: 'text', defaultValue: '2024', group: 'Content' },
    { key: 'booksRead', label: 'Books Read', type: 'number', defaultValue: 18, min: 0, max: 500, group: 'Content' },
    { key: 'goalBooks', label: 'Goal', type: 'number', defaultValue: 24, min: 1, max: 500, group: 'Content' },
    { key: 'favoriteGenre', label: 'Fav Genre', type: 'text', defaultValue: 'Sci-Fi', group: 'Content' },
    { key: 'currentBook', label: 'Current Book', type: 'text', defaultValue: 'Project Hail Mary', group: 'Content' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#1a150e', group: 'Style' },
    { key: 'textColor', label: 'Text Color', type: 'color', defaultValue: '#f5edd6', group: 'Style' },
    { key: 'accentColor', label: 'Accent Color', type: 'color', defaultValue: '#C9A96E', group: 'Style' },
    { key: 'progressColor', label: 'Progress Color', type: 'color', defaultValue: '#8B6D4C', group: 'Style' },
  ],
})
