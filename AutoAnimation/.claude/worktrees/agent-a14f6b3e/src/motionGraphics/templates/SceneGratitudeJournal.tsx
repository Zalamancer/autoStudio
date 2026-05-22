import React from 'react'
import { registerMotionGraphic } from '../registry'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface SceneGratitudeJournalConfig {
  title: string
  items: string[]
  date: string
  bgColor: string
  textColor: string
  accentColor: string
  checkColor: string
}

function easeOutCubic(t: number): number { return 1 - Math.pow(1 - t, 3) }
function easeInCubic(t: number): number { return t * t * t }
function easeOutBack(t: number): number {
  const c1 = 1.70158
  const c3 = c1 + 1
  return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2)
}

function SceneGratitudeJournalComponent({ config, progress }: MotionGraphicProps<SceneGratitudeJournalConfig>) {
  const { title, items, date, bgColor, textColor, accentColor, checkColor } = config

  const enterProgress = progress < 0.2 ? progress / 0.2 : 1
  const holdProgress = progress >= 0.2 && progress < 0.8 ? (progress - 0.2) / 0.6 : progress >= 0.8 ? 1 : 0
  const exitProgress = progress >= 0.8 ? (progress - 0.8) / 0.2 : 0

  const exitEased = easeInCubic(exitProgress)
  const exitOpacity = exitProgress > 0 ? 1 - exitEased : 1
  const exitScale = exitProgress > 0 ? 1 - exitEased * 0.1 : 1

  const headerEnter = easeOutCubic(Math.min(1, enterProgress / 0.5))
  const dateEnter = easeOutCubic(Math.max(0, Math.min(1, (enterProgress - 0.1) / 0.4)))

  const isHolding = progress >= 0.2 && progress < 0.8

  return (
    <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', fontFamily: "'Inter', 'Helvetica Neue', sans-serif" }}>
      <div style={{ position: 'absolute', inset: 0, background: bgColor }} />

      {/* Warm corner glow */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '50%',
          height: '40%',
          background: `radial-gradient(circle at top left, ${accentColor}08, transparent 60%)`,
        }}
      />

      {/* Paper texture lines */}
      {Array.from({ length: 20 }, (_, i) => (
        <div
          key={`line-${i}`}
          style={{
            position: 'absolute',
            left: '8%',
            right: '8%',
            top: `${18 + i * 4}%`,
            height: 1,
            background: `${textColor}06`,
          }}
        />
      ))}

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
        {/* Date */}
        <div
          style={{
            fontSize: 'clamp(9px, 1.4vw, 12px)',
            fontWeight: 500,
            color: `${textColor}44`,
            textTransform: 'uppercase',
            letterSpacing: '0.12em',
            marginBottom: 'clamp(4px, 0.8vw, 8px)',
            opacity: dateEnter,
          }}
        >
          {date}
        </div>

        {/* Title */}
        <div
          style={{
            fontSize: 'clamp(22px, 5vw, 40px)',
            fontWeight: 700,
            color: textColor,
            marginBottom: 'clamp(6px, 1.2vw, 12px)',
            opacity: headerEnter,
            transform: `translateY(${(1 - headerEnter) * 15}px)`,
          }}
        >
          {title}
        </div>

        {/* Accent line */}
        <div
          style={{
            width: 'clamp(40px, 10vw, 80px)',
            height: 3,
            background: accentColor,
            borderRadius: 2,
            marginBottom: 'clamp(20px, 4vw, 36px)',
            transform: `scaleX(${headerEnter})`,
            transformOrigin: 'left',
          }}
        />

        {/* Gratitude items */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 'clamp(12px, 2.5vw, 24px)' }}>
          {items.map((item, i) => {
            const delay = 0.3 + i * 0.1
            const itemEnter = easeOutCubic(Math.max(0, Math.min(1, (enterProgress - delay) / 0.4)))
            const checkDelay = delay + 0.15
            const checkEnter = easeOutBack(Math.max(0, Math.min(1, (enterProgress - checkDelay) / 0.3)))

            // Gentle pulse on each check during hold
            const checkPulse = isHolding
              ? 1 + Math.sin(holdProgress * Math.PI * 8 + i * 1.2) * 0.08
              : 1

            return (
              <div
                key={i}
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: 'clamp(10px, 2vw, 18px)',
                  opacity: itemEnter,
                  transform: `translateX(${(1 - itemEnter) * 20}px)`,
                }}
              >
                {/* Checkmark circle */}
                <div
                  style={{
                    width: 'clamp(22px, 4vw, 34px)',
                    height: 'clamp(22px, 4vw, 34px)',
                    borderRadius: '50%',
                    background: `${checkColor}15`,
                    border: `2px solid ${checkColor}40`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                    transform: `scale(${checkEnter * checkPulse})`,
                  }}
                >
                  {/* Check SVG */}
                  <svg
                    viewBox="0 0 24 24"
                    width="60%"
                    height="60%"
                    fill="none"
                    stroke={checkColor}
                    strokeWidth={3}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    style={{ opacity: checkEnter }}
                  >
                    <polyline
                      points="4,12 10,18 20,6"
                      strokeDasharray={30}
                      strokeDashoffset={30 * (1 - checkEnter)}
                    />
                  </svg>
                </div>

                {/* Item text */}
                <div
                  style={{
                    fontSize: 'clamp(14px, 2.8vw, 22px)',
                    fontWeight: 400,
                    color: textColor,
                    lineHeight: 1.5,
                    paddingTop: 'clamp(1px, 0.3vw, 4px)',
                  }}
                >
                  {item}
                </div>
              </div>
            )
          })}
        </div>

        {/* Heart icon bottom */}
        <div
          style={{
            textAlign: 'center',
            fontSize: 'clamp(14px, 2.5vw, 22px)',
            color: `${accentColor}40`,
            marginTop: 'clamp(12px, 2vw, 20px)',
            opacity: headerEnter,
          }}
        >
          {'\u2665'}
        </div>
      </div>
    </div>
  )
}

registerMotionGraphic({
  id: 'tpl-scene-gratitude-journal',
  title: 'Gratitude Journal',
  description: 'Gratitude list with animated checkmarks, staggered reveal, paper-texture background, and warm accent glow',
  tags: ['scene', 'gratitude', 'journal', 'meditation', 'mindfulness', 'wellness', 'self-care', 'daily'],
  category: 'scene-layout',
  component: SceneGratitudeJournalComponent as any,
  defaultConfig: {
    title: 'Today I\'m Grateful For',
    items: ['A peaceful morning walk', 'Quality time with loved ones', 'The warmth of sunlight', 'A nourishing home-cooked meal', 'Moments of quiet reflection'],
    date: 'March 19, 2026',
    bgColor: '#12100e',
    textColor: '#e8e4dc',
    accentColor: '#c4956a',
    checkColor: '#7ab88f',
  },
  configSchema: [
    { key: 'title', label: 'Title', type: 'text', defaultValue: "Today I'm Grateful For", group: 'Content' },
    { key: 'items', label: 'Items', type: 'text-array', defaultValue: ['A peaceful morning walk', 'Quality time with loved ones', 'The warmth of sunlight', 'A nourishing home-cooked meal', 'Moments of quiet reflection'], group: 'Content' },
    { key: 'date', label: 'Date', type: 'text', defaultValue: 'March 19, 2026', group: 'Content' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#12100e', group: 'Style' },
    { key: 'textColor', label: 'Text Color', type: 'color', defaultValue: '#e8e4dc', group: 'Style' },
    { key: 'accentColor', label: 'Accent Color', type: 'color', defaultValue: '#c4956a', group: 'Style' },
    { key: 'checkColor', label: 'Check Color', type: 'color', defaultValue: '#7ab88f', group: 'Style' },
  ],
})
