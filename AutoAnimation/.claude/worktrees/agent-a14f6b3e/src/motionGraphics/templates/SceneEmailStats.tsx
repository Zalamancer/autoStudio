import React from 'react'
import { registerMotionGraphic } from '../registry'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface SceneEmailStatsConfig {
  campaignName: string
  sent: number
  openRate: number
  clickRate: number
  bounceRate: number
  unsubRate: number
  bgColor: string
  textColor: string
  accentColor: string
}

function easeOutCubic(t: number): number { return 1 - Math.pow(1 - t, 3) }
function easeInCubic(t: number): number { return t * t * t }

function SceneEmailStatsComponent({ config, progress }: MotionGraphicProps<SceneEmailStatsConfig>) {
  const { campaignName, sent, openRate, clickRate, bounceRate, unsubRate, bgColor, textColor, accentColor } = config

  const enterProgress = progress < 0.25 ? progress / 0.25 : 1
  const holdProgress = progress >= 0.25 && progress < 0.8 ? (progress - 0.25) / 0.55 : progress >= 0.8 ? 1 : 0
  const exitProgress = progress >= 0.8 ? (progress - 0.8) / 0.2 : 0
  const exitOpacity = exitProgress > 0 ? 1 - easeInCubic(exitProgress) : 1

  const countEnter = easeOutCubic(enterProgress)

  const stats = [
    { label: 'Sent', value: sent, suffix: '', color: accentColor, isPercent: false },
    { label: 'Open Rate', value: openRate, suffix: '%', color: '#10B981', isPercent: true },
    { label: 'Click Rate', value: clickRate, suffix: '%', color: '#6366F1', isPercent: true },
    { label: 'Bounce Rate', value: bounceRate, suffix: '%', color: '#F59E0B', isPercent: true },
    { label: 'Unsub Rate', value: unsubRate, suffix: '%', color: '#EF4444', isPercent: true },
  ]

  return (
    <div style={{ position: 'absolute', inset: 0, overflow: 'hidden' }}>
      <div style={{ position: 'absolute', inset: 0, background: bgColor }} />
      {/* Mail icon watermark */}
      <div style={{
        position: 'absolute',
        top: '50%', left: '50%',
        transform: 'translate(-50%, -50%)',
        fontSize: 'clamp(120px, 30vw, 300px)',
        opacity: 0.02,
        color: textColor,
        pointerEvents: 'none',
        userSelect: 'none',
      }}>
        {'\u2709'}
      </div>

      <div style={{
        position: 'absolute', inset: 0,
        display: 'flex', flexDirection: 'column',
        justifyContent: 'center', alignItems: 'center',
        padding: '6% 8%',
        opacity: exitOpacity,
      }}>
        {/* Header */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 'clamp(6px, 1.5vw, 12px)',
          marginBottom: 'clamp(4px, 1vw, 8px)',
          opacity: easeOutCubic(enterProgress),
        }}>
          <span style={{ fontSize: 'clamp(16px, 3vw, 24px)' }}>{'\u2709'}</span>
          <div style={{
            fontFamily: "'Inter', sans-serif",
            fontSize: 'clamp(14px, 3vw, 22px)',
            fontWeight: 700,
            color: textColor,
          }}>
            Email Campaign Report
          </div>
        </div>
        {/* Campaign name */}
        <div style={{
          fontFamily: "'Inter', sans-serif",
          fontSize: 'clamp(9px, 1.6vw, 13px)',
          fontWeight: 500,
          color: `${textColor}50`,
          marginBottom: 'clamp(16px, 4vw, 32px)',
          opacity: easeOutCubic(enterProgress),
        }}>
          {campaignName}
        </div>

        {/* Open rate ring - hero metric */}
        <div style={{ position: 'relative', marginBottom: 'clamp(16px, 4vw, 32px)' }}>
          <svg viewBox="0 0 120 120" style={{ width: 'clamp(100px, 22vw, 160px)', height: 'clamp(100px, 22vw, 160px)' }}>
            <circle cx="60" cy="60" r="50" fill="none" stroke={`${textColor}08`} strokeWidth={8} />
            <circle
              cx="60" cy="60" r="50"
              fill="none"
              stroke="#10B981"
              strokeWidth={8}
              strokeLinecap="round"
              strokeDasharray={`${2 * Math.PI * 50 * (openRate / 100) * countEnter} ${2 * Math.PI * 50}`}
              transform="rotate(-90 60 60)"
              style={{ filter: 'drop-shadow(0 0 6px rgba(16,185,129,0.3))' }}
            />
          </svg>
          <div style={{
            position: 'absolute',
            top: '50%', left: '50%',
            transform: 'translate(-50%, -50%)',
            textAlign: 'center',
          }}>
            <div style={{
              fontFamily: "'SF Mono', monospace",
              fontSize: 'clamp(20px, 5vw, 36px)',
              fontWeight: 900,
              color: '#10B981',
              lineHeight: 1,
            }}>
              {(openRate * countEnter).toFixed(1)}%
            </div>
            <div style={{
              fontFamily: "'Inter', sans-serif",
              fontSize: 'clamp(7px, 1.2vw, 9px)',
              fontWeight: 500,
              color: `${textColor}50`,
              textTransform: 'uppercase',
              letterSpacing: '0.1em',
              marginTop: 2,
            }}>
              Open Rate
            </div>
          </div>
        </div>

        {/* Stats row */}
        <div style={{
          display: 'flex',
          gap: 'clamp(6px, 1.5vw, 14px)',
          flexWrap: 'wrap',
          justifyContent: 'center',
        }}>
          {stats.map((stat, i) => {
            if (stat.label === 'Open Rate') return null
            const stagger = i * 0.1
            const cardEnter = easeOutCubic(Math.max(0, Math.min(1, (enterProgress - stagger - 0.1) / 0.7)))
            const counted = stat.value * cardEnter
            const displayVal = stat.isPercent
              ? `${counted.toFixed(stat.value < 1 ? 2 : 1)}${stat.suffix}`
              : `${Math.round(counted).toLocaleString()}${stat.suffix}`

            const holdPulse = progress >= 0.25 && progress < 0.8
              ? 1 + Math.sin(holdProgress * Math.PI * 4 + i) * 0.008
              : 1

            return (
              <div key={i} style={{
                background: `${textColor}05`,
                borderRadius: 'clamp(6px, 1vw, 10px)',
                padding: 'clamp(8px, 2vw, 14px) clamp(10px, 2.5vw, 18px)',
                textAlign: 'center',
                border: `1px solid ${textColor}08`,
                opacity: cardEnter,
                transform: `translateY(${(1 - cardEnter) * 12}px) scale(${holdPulse})`,
                minWidth: 'clamp(60px, 15vw, 90px)',
              }}>
                <div style={{
                  fontFamily: "'Inter', sans-serif",
                  fontSize: 'clamp(7px, 1.2vw, 9px)',
                  fontWeight: 500,
                  color: `${textColor}50`,
                  textTransform: 'uppercase',
                  letterSpacing: '0.06em',
                  marginBottom: 4,
                }}>
                  {stat.label}
                </div>
                <div style={{
                  fontFamily: "'SF Mono', monospace",
                  fontSize: 'clamp(14px, 3vw, 22px)',
                  fontWeight: 800,
                  color: stat.color,
                }}>
                  {displayVal}
                </div>
                {/* Mini bar */}
                <div style={{
                  marginTop: 6,
                  height: 2,
                  borderRadius: 1,
                  background: `${textColor}08`,
                  overflow: 'hidden',
                }}>
                  <div style={{
                    height: '100%',
                    width: `${stat.isPercent ? stat.value * cardEnter : Math.min(100, (stat.value / sent) * 100 * cardEnter)}%`,
                    background: stat.color,
                    borderRadius: 1,
                  }} />
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
  id: 'tpl-scene-email-stats',
  title: 'Email Stats',
  description: 'Email campaign statistics with animated open rate ring chart, counting metrics for sent/click/bounce/unsubscribe, and mini progress bars.',
  tags: ['scene', 'email', 'campaign', 'statistics', 'marketing', 'newsletter', 'analytics', 'open-rate'],
  category: 'scene-layout',
  component: SceneEmailStatsComponent as any,
  defaultConfig: {
    campaignName: 'Summer Newsletter - July 2024',
    sent: 12500,
    openRate: 42.3,
    clickRate: 8.7,
    bounceRate: 1.2,
    unsubRate: 0.3,
    accentColor: '#3B82F6',
    bgColor: '#0f172a',
    textColor: '#e2e8f0',
  },
  configSchema: [
    { key: 'campaignName', label: 'Campaign Name', type: 'text', defaultValue: 'Summer Newsletter - July 2024', group: 'Content' },
    { key: 'sent', label: 'Emails Sent', type: 'number', defaultValue: 12500, min: 0, max: 10000000, group: 'Content' },
    { key: 'openRate', label: 'Open Rate (%)', type: 'number', defaultValue: 42.3, min: 0, max: 100, group: 'Content' },
    { key: 'clickRate', label: 'Click Rate (%)', type: 'number', defaultValue: 8.7, min: 0, max: 100, group: 'Content' },
    { key: 'bounceRate', label: 'Bounce Rate (%)', type: 'number', defaultValue: 1.2, min: 0, max: 100, group: 'Content' },
    { key: 'unsubRate', label: 'Unsub Rate (%)', type: 'number', defaultValue: 0.3, min: 0, max: 100, group: 'Content' },
    { key: 'accentColor', label: 'Accent Color', type: 'color', defaultValue: '#3B82F6', group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#0f172a', group: 'Style' },
    { key: 'textColor', label: 'Text Color', type: 'color', defaultValue: '#e2e8f0', group: 'Style' },
  ],
})
