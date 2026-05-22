import React from 'react'
import { registerMotionGraphic } from '../registry'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface SceneSEOScoreConfig {
  overallScore: number
  metrics: string[]
  domain: string
  bgColor: string
  textColor: string
}

function easeOutCubic(t: number): number { return 1 - Math.pow(1 - t, 3) }
function easeInCubic(t: number): number { return t * t * t }

function getScoreColor(score: number): string {
  if (score >= 80) return '#10B981'
  if (score >= 60) return '#F59E0B'
  if (score >= 40) return '#F97316'
  return '#EF4444'
}

function parseMetric(s: string): { label: string; score: number } {
  const parts = s.split(':')
  return { label: (parts[0] || '').trim(), score: parseInt(parts[1] || '0', 10) }
}

function SceneSEOScoreComponent({ config, progress }: MotionGraphicProps<SceneSEOScoreConfig>) {
  const { overallScore, metrics, domain, bgColor, textColor } = config
  const parsed = metrics.map(parseMetric)

  const enterProgress = progress < 0.25 ? progress / 0.25 : 1
  const holdProgress = progress >= 0.25 && progress < 0.8 ? (progress - 0.25) / 0.55 : progress >= 0.8 ? 1 : 0
  const exitProgress = progress >= 0.8 ? (progress - 0.8) / 0.2 : 0
  const exitOpacity = exitProgress > 0 ? 1 - easeInCubic(exitProgress) : 1

  const countEnter = easeOutCubic(enterProgress)
  const animScore = Math.round(overallScore * countEnter)
  const scoreColor = getScoreColor(overallScore)

  // Score ring
  const radius = 50
  const circumference = 2 * Math.PI * radius
  const dashLen = (overallScore / 100) * circumference * countEnter

  // Hold: gentle score pulse
  const holdPulse = progress >= 0.25 && progress < 0.8
    ? 1 + Math.sin(holdProgress * Math.PI * 3) * 0.01
    : 1

  return (
    <div style={{ position: 'absolute', inset: 0, overflow: 'hidden' }}>
      <div style={{ position: 'absolute', inset: 0, background: bgColor }} />
      {/* Grid pattern */}
      <div style={{
        position: 'absolute', inset: 0, opacity: 0.02,
        backgroundImage: `linear-gradient(${textColor} 1px, transparent 1px), linear-gradient(90deg, ${textColor} 1px, transparent 1px)`,
        backgroundSize: '32px 32px',
      }} />

      <div style={{
        position: 'absolute', inset: 0,
        display: 'flex', flexDirection: 'column',
        justifyContent: 'center', alignItems: 'center',
        padding: '5% 8%',
        opacity: exitOpacity,
        transform: `scale(${holdPulse})`,
      }}>
        {/* Domain label */}
        <div style={{
          fontFamily: "'SF Mono', monospace",
          fontSize: 'clamp(9px, 1.6vw, 13px)',
          fontWeight: 500,
          color: `${textColor}40`,
          marginBottom: 'clamp(4px, 1vw, 8px)',
          opacity: easeOutCubic(enterProgress),
          letterSpacing: '0.04em',
        }}>
          {domain}
        </div>

        {/* Title */}
        <div style={{
          fontFamily: "'Inter', sans-serif",
          fontSize: 'clamp(14px, 3vw, 22px)',
          fontWeight: 700,
          color: textColor,
          marginBottom: 'clamp(12px, 3vw, 24px)',
          opacity: easeOutCubic(enterProgress),
        }}>
          SEO Health Score
        </div>

        {/* Score ring */}
        <div style={{ position: 'relative', marginBottom: 'clamp(16px, 4vw, 32px)' }}>
          <svg viewBox="0 0 120 120" style={{ width: 'clamp(120px, 26vw, 180px)', height: 'clamp(120px, 26vw, 180px)' }}>
            {/* Background */}
            <circle cx="60" cy="60" r={radius} fill="none" stroke={`${textColor}08`} strokeWidth={10} />
            {/* Score arc */}
            <circle
              cx="60" cy="60" r={radius}
              fill="none"
              stroke={scoreColor}
              strokeWidth={10}
              strokeLinecap="round"
              strokeDasharray={`${dashLen} ${circumference}`}
              transform="rotate(-90 60 60)"
              style={{ filter: `drop-shadow(0 0 10px ${scoreColor}40)` }}
            />
            {/* Tick marks */}
            {Array.from({ length: 10 }, (_, i) => {
              const angle = (i / 10) * 360 - 90
              const rad = (angle * Math.PI) / 180
              const x1 = 60 + Math.cos(rad) * 42
              const y1 = 60 + Math.sin(rad) * 42
              const x2 = 60 + Math.cos(rad) * 45
              const y2 = 60 + Math.sin(rad) * 45
              return (
                <line key={i} x1={x1} y1={y1} x2={x2} y2={y2}
                  stroke={`${textColor}15`} strokeWidth={1}
                />
              )
            })}
          </svg>
          <div style={{
            position: 'absolute',
            top: '50%', left: '50%',
            transform: 'translate(-50%, -50%)',
            textAlign: 'center',
          }}>
            <div style={{
              fontFamily: "'Inter', sans-serif",
              fontSize: 'clamp(28px, 7vw, 50px)',
              fontWeight: 900,
              color: scoreColor,
              lineHeight: 1,
            }}>
              {animScore}
            </div>
            <div style={{
              fontFamily: "'Inter', sans-serif",
              fontSize: 'clamp(8px, 1.4vw, 11px)',
              fontWeight: 500,
              color: `${textColor}40`,
              textTransform: 'uppercase',
              letterSpacing: '0.1em',
              marginTop: 2,
            }}>
              / 100
            </div>
          </div>
        </div>

        {/* Sub-metrics */}
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: 'clamp(6px, 1.5vw, 12px)',
          width: '100%',
          maxWidth: 380,
        }}>
          {parsed.map((m, i) => {
            const stagger = i * 0.08 + 0.15
            const barEnter = easeOutCubic(Math.max(0, Math.min(1, (enterProgress - stagger) / (0.8 - stagger))))
            const mColor = getScoreColor(m.score)
            const countedScore = Math.round(m.score * barEnter)

            return (
              <div key={i} style={{
                display: 'flex',
                alignItems: 'center',
                gap: 'clamp(8px, 2vw, 14px)',
                opacity: barEnter,
                transform: `translateX(${(1 - barEnter) * 12}px)`,
              }}>
                {/* Label */}
                <div style={{
                  fontFamily: "'Inter', sans-serif",
                  fontSize: 'clamp(9px, 1.6vw, 12px)',
                  fontWeight: 600,
                  color: `${textColor}70`,
                  width: 'clamp(80px, 20vw, 120px)',
                  flexShrink: 0,
                }}>
                  {m.label}
                </div>
                {/* Bar */}
                <div style={{
                  flex: 1,
                  height: 'clamp(6px, 1.5vw, 10px)',
                  borderRadius: 'clamp(3px, 0.8vw, 5px)',
                  background: `${textColor}08`,
                  overflow: 'hidden',
                }}>
                  <div style={{
                    height: '100%',
                    width: `${m.score * barEnter}%`,
                    background: `linear-gradient(90deg, ${mColor}CC, ${mColor})`,
                    borderRadius: 'inherit',
                  }} />
                </div>
                {/* Score */}
                <div style={{
                  fontFamily: "'SF Mono', monospace",
                  fontSize: 'clamp(10px, 1.8vw, 14px)',
                  fontWeight: 700,
                  color: mColor,
                  width: 'clamp(24px, 6vw, 36px)',
                  textAlign: 'right',
                }}>
                  {countedScore}
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
  id: 'tpl-scene-seo-score',
  title: 'SEO Score',
  description: 'SEO health score card with animated circular gauge, color-coded score, and individual metric bars for performance, accessibility, best practices, and SEO.',
  tags: ['scene', 'seo', 'score', 'analytics', 'website', 'performance', 'marketing', 'audit'],
  category: 'scene-layout',
  component: SceneSEOScoreComponent as any,
  defaultConfig: {
    overallScore: 87,
    metrics: ['Performance:92', 'Accessibility:78', 'Best Practices:95', 'SEO:83', 'Core Web Vitals:71'],
    domain: 'example.com',
    bgColor: '#0f172a',
    textColor: '#e2e8f0',
  },
  configSchema: [
    { key: 'overallScore', label: 'Overall Score (0-100)', type: 'number', defaultValue: 87, min: 0, max: 100, group: 'Content' },
    { key: 'metrics', label: 'Sub-Metrics (Label:Score)', type: 'text-array', defaultValue: ['Performance:92', 'Accessibility:78', 'Best Practices:95', 'SEO:83', 'Core Web Vitals:71'], group: 'Content' },
    { key: 'domain', label: 'Domain', type: 'text', defaultValue: 'example.com', group: 'Content' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#0f172a', group: 'Style' },
    { key: 'textColor', label: 'Text Color', type: 'color', defaultValue: '#e2e8f0', group: 'Style' },
  ],
})
