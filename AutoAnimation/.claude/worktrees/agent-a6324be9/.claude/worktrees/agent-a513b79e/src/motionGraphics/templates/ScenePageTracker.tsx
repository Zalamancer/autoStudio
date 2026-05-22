import React from 'react'
import { registerMotionGraphic } from '../registry'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface ScenePageTrackerConfig {
  bookTitle: string
  currentPage: number
  totalPages: number
  timeSpent: string
  pagesPerDay: number
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

function ScenePageTrackerComponent({ config, progress }: MotionGraphicProps<ScenePageTrackerConfig>) {
  const { bookTitle, currentPage, totalPages, timeSpent, pagesPerDay, bgColor, textColor, accentColor, progressColor } = config

  const enterProgress = progress < 0.25 ? progress / 0.25 : 1
  const holdProgress = progress >= 0.25 && progress < 0.8 ? (progress - 0.25) / 0.55 : progress >= 0.8 ? 1 : 0
  const exitProgress = progress >= 0.8 ? (progress - 0.8) / 0.2 : 0

  const headerReveal = easeOutCubic(Math.min(1, enterProgress / 0.35))
  const barReveal = easeOutCubic(Math.max(0, Math.min(1, (enterProgress - 0.15) / 0.45)))
  const pageCountReveal = easeOutCubic(Math.max(0, Math.min(1, (enterProgress - 0.3) / 0.4)))
  const statsReveal = easeOutCubic(Math.max(0, Math.min(1, (enterProgress - 0.55) / 0.35)))
  const estReveal = easeOutCubic(Math.max(0, Math.min(1, (enterProgress - 0.7) / 0.25)))

  const pct = totalPages > 0 ? currentPage / totalPages : 0
  const animatedPct = pct * barReveal
  const remaining = totalPages - currentPage
  const daysLeft = pagesPerDay > 0 ? Math.ceil(remaining / pagesPerDay) : 0

  // Hold: page counting effect
  const countPulse = holdProgress > 0 ? 1 + Math.sin(holdProgress * Math.PI * 5) * 0.03 : 1

  const exitEased = easeInCubic(exitProgress)
  const exitOpacity = 1 - exitEased

  // Page section markers
  const sections = [0.25, 0.5, 0.75]

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
      {/* Subtle page edge texture on right */}
      <div
        style={{
          position: 'absolute',
          right: 0,
          top: '10%',
          bottom: '10%',
          width: '2%',
          background:
            'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(245,237,214,0.03) 2px, rgba(245,237,214,0.03) 3px)',
        }}
      />

      <div
        style={{
          width: '100%',
          maxWidth: 480,
          display: 'flex',
          flexDirection: 'column',
          gap: 'clamp(12px, 2.5vw, 22px)',
          opacity: exitOpacity,
          transform: `scale(${1 - exitEased * 0.1})`,
        }}
      >
        {/* Header */}
        <div
          style={{
            opacity: headerReveal,
            transform: `translateY(${(1 - headerReveal) * 18}px)`,
          }}
        >
          <div
            style={{
              fontSize: 'clamp(9px, 1.4vw, 11px)',
              fontFamily: "'Inter', sans-serif",
              textTransform: 'uppercase',
              letterSpacing: '0.12em',
              color: accentColor,
              marginBottom: 4,
            }}
          >
            Currently Reading
          </div>
          <div
            style={{
              fontSize: 'clamp(20px, 5vw, 34px)',
              fontWeight: 700,
              fontStyle: 'italic',
              color: textColor,
              lineHeight: 1.15,
            }}
          >
            {bookTitle}
          </div>
        </div>

        {/* Progress bar with sections */}
        <div style={{ opacity: barReveal }}>
          <div
            style={{
              position: 'relative',
              width: '100%',
              height: 'clamp(12px, 2.5vw, 20px)',
              background: `${textColor}08`,
              borderRadius: 'clamp(6px, 1vw, 10px)',
              overflow: 'hidden',
            }}
          >
            {/* Fill */}
            <div
              style={{
                width: `${animatedPct * 100}%`,
                height: '100%',
                background: `linear-gradient(90deg, ${progressColor}, ${accentColor})`,
                borderRadius: 'clamp(6px, 1vw, 10px)',
                boxShadow: `0 0 10px ${progressColor}30`,
              }}
            />
            {/* Section markers */}
            {sections.map((s, i) => (
              <div
                key={i}
                style={{
                  position: 'absolute',
                  left: `${s * 100}%`,
                  top: 0,
                  bottom: 0,
                  width: 1,
                  background: `${textColor}15`,
                }}
              />
            ))}
          </div>
          {/* Section labels */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              marginTop: 4,
              fontSize: 'clamp(7px, 1.1vw, 9px)',
              fontFamily: "'Inter', sans-serif",
              color: `${textColor}30`,
            }}
          >
            <span>Start</span>
            <span>25%</span>
            <span>50%</span>
            <span>75%</span>
            <span>End</span>
          </div>
        </div>

        {/* Page count */}
        <div
          style={{
            display: 'flex',
            alignItems: 'baseline',
            gap: 'clamp(6px, 1vw, 10px)',
            opacity: pageCountReveal,
            transform: `scale(${countPulse})`,
            transformOrigin: 'left center',
          }}
        >
          <span
            style={{
              fontSize: 'clamp(36px, 9vw, 60px)',
              fontWeight: 900,
              color: accentColor,
              fontFamily: "'Inter', sans-serif",
              lineHeight: 1,
            }}
          >
            {Math.round(currentPage * barReveal)}
          </span>
          <span
            style={{
              fontSize: 'clamp(14px, 2.5vw, 20px)',
              fontWeight: 400,
              color: `${textColor}50`,
            }}
          >
            / {totalPages} pages
          </span>
        </div>

        {/* Stats grid */}
        <div
          style={{
            display: 'flex',
            gap: 'clamp(8px, 1.5vw, 14px)',
            opacity: statsReveal,
            transform: `translateY(${(1 - statsReveal) * 10}px)`,
          }}
        >
          {[
            { label: 'Time Spent', value: timeSpent },
            { label: 'Pages / Day', value: String(pagesPerDay) },
            { label: 'Remaining', value: `${remaining} pg` },
          ].map((stat, i) => (
            <div
              key={i}
              style={{
                flex: 1,
                background: `${textColor}05`,
                border: `1px solid ${textColor}08`,
                borderRadius: 'clamp(6px, 1vw, 10px)',
                padding: 'clamp(8px, 1.5vw, 14px)',
                textAlign: 'center',
              }}
            >
              <div
                style={{
                  fontSize: 'clamp(7px, 1.1vw, 9px)',
                  fontFamily: "'Inter', sans-serif",
                  textTransform: 'uppercase',
                  letterSpacing: '0.1em',
                  color: `${textColor}45`,
                  marginBottom: 2,
                }}
              >
                {stat.label}
              </div>
              <div
                style={{
                  fontSize: 'clamp(14px, 2.5vw, 20px)',
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

        {/* Estimated completion */}
        <div
          style={{
            fontSize: 'clamp(10px, 1.6vw, 13px)',
            fontFamily: "'Inter', sans-serif",
            color: `${textColor}50`,
            textAlign: 'center',
            opacity: estReveal,
          }}
        >
          Estimated finish: <span style={{ color: accentColor, fontWeight: 600 }}>{daysLeft} days</span>
        </div>
      </div>
    </div>
  )
}

registerMotionGraphic({
  id: 'tpl-scene-page-tracker',
  title: 'Page Tracker',
  description:
    'Pages read progress tracker with animated fill bar, section markers, page count, reading stats, and estimated completion',
  tags: ['scene', 'book', 'page', 'tracker', 'progress', 'reading', 'literary', 'literature'],
  category: 'scene-layout',
  component: ScenePageTrackerComponent as any,
  defaultConfig: {
    bookTitle: 'War and Peace',
    currentPage: 580,
    totalPages: 1225,
    timeSpent: '18h 30m',
    pagesPerDay: 35,
    bgColor: '#1a150e',
    textColor: '#f5edd6',
    accentColor: '#C9A96E',
    progressColor: '#8B6D4C',
  },
  configSchema: [
    { key: 'bookTitle', label: 'Book Title', type: 'text', defaultValue: 'War and Peace', group: 'Content' },
    { key: 'currentPage', label: 'Current Page', type: 'number', defaultValue: 580, min: 0, max: 10000, group: 'Content' },
    { key: 'totalPages', label: 'Total Pages', type: 'number', defaultValue: 1225, min: 1, max: 10000, group: 'Content' },
    { key: 'timeSpent', label: 'Time Spent', type: 'text', defaultValue: '18h 30m', group: 'Content' },
    { key: 'pagesPerDay', label: 'Pages / Day', type: 'number', defaultValue: 35, min: 1, max: 500, group: 'Content' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#1a150e', group: 'Style' },
    { key: 'textColor', label: 'Text Color', type: 'color', defaultValue: '#f5edd6', group: 'Style' },
    { key: 'accentColor', label: 'Accent Color', type: 'color', defaultValue: '#C9A96E', group: 'Style' },
    { key: 'progressColor', label: 'Progress Color', type: 'color', defaultValue: '#8B6D4C', group: 'Style' },
  ],
})
