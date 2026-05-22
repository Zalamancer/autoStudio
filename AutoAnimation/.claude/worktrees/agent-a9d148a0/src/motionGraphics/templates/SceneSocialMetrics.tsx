import React from 'react'
import { registerMotionGraphic } from '../registry'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface SceneSocialMetricsConfig {
  metrics: string[]
  platform: string
  bgColor: string
  textColor: string
  accentColor: string
}

function easeOutCubic(t: number): number { return 1 - Math.pow(1 - t, 3) }
function easeInCubic(t: number): number { return t * t * t }

function parseMetric(s: string): { label: string; value: string; change: string } {
  const parts = s.split(':')
  return { label: (parts[0] || '').trim(), value: (parts[1] || '0').trim(), change: (parts[2] || '+0%').trim() }
}

function formatNumber(s: string, progress: number): string {
  const numMatch = s.match(/[\d,.]+/)
  if (!numMatch) return s
  const targetNum = parseFloat(numMatch[0].replace(/,/g, ''))
  const countedNum = targetNum * progress
  const prefix = s.substring(0, s.indexOf(numMatch[0]))
  const suffix = s.substring(s.indexOf(numMatch[0]) + numMatch[0].length)
  if (targetNum >= 1000000) return `${prefix}${(countedNum / 1000000).toFixed(1)}M${suffix}`
  if (targetNum >= 1000) return `${prefix}${(countedNum / 1000).toFixed(1)}K${suffix}`
  return `${prefix}${Math.round(countedNum)}${suffix}`
}

function SceneSocialMetricsComponent({ config, progress }: MotionGraphicProps<SceneSocialMetricsConfig>) {
  const { metrics, platform, bgColor, textColor, accentColor } = config
  const parsed = metrics.map(parseMetric)

  const enterProgress = progress < 0.2 ? progress / 0.2 : 1
  const holdProgress = progress >= 0.2 && progress < 0.8 ? (progress - 0.2) / 0.6 : progress >= 0.8 ? 1 : 0
  const exitProgress = progress >= 0.8 ? (progress - 0.8) / 0.2 : 0
  const exitOpacity = exitProgress > 0 ? 1 - easeInCubic(exitProgress) : 1

  // Platform icon (simple text-based)
  const platformIcons: Record<string, string> = {
    instagram: '\u{1F4F7}', twitter: '\u{1F426}', youtube: '\u{25B6}',
    tiktok: '\u{266A}', facebook: '\u{1F310}', linkedin: '\u{1F4BC}',
  }
  const icon = platformIcons[platform.toLowerCase()] || '\u{1F4CA}'

  return (
    <div style={{ position: 'absolute', inset: 0, overflow: 'hidden' }}>
      <div style={{ position: 'absolute', inset: 0, background: bgColor }} />
      {/* Subtle radial glow */}
      <div style={{
        position: 'absolute',
        top: '20%', left: '50%',
        transform: 'translate(-50%, -50%)',
        width: '60%', height: '40%',
        borderRadius: '50%',
        background: `radial-gradient(ellipse, ${accentColor}08, transparent)`,
        pointerEvents: 'none',
      }} />

      <div style={{
        position: 'absolute', inset: 0,
        display: 'flex', flexDirection: 'column',
        justifyContent: 'center', alignItems: 'center',
        padding: '6% 8%',
        opacity: exitOpacity,
      }}>
        {/* Platform header */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 'clamp(6px, 1.5vw, 12px)',
          marginBottom: 'clamp(4px, 1vw, 8px)',
          opacity: easeOutCubic(enterProgress),
        }}>
          <span style={{ fontSize: 'clamp(16px, 3.5vw, 28px)' }}>{icon}</span>
          <div style={{
            fontFamily: "'Inter', sans-serif",
            fontSize: 'clamp(14px, 3vw, 24px)',
            fontWeight: 700,
            color: textColor,
            textTransform: 'capitalize',
          }}>
            {platform} Analytics
          </div>
        </div>
        {/* Period label */}
        <div style={{
          fontFamily: "'Inter', sans-serif",
          fontSize: 'clamp(8px, 1.4vw, 11px)',
          fontWeight: 500,
          color: `${textColor}40`,
          textTransform: 'uppercase',
          letterSpacing: '0.12em',
          marginBottom: 'clamp(16px, 4vw, 36px)',
          opacity: easeOutCubic(enterProgress),
        }}>
          Last 30 Days
        </div>

        {/* Metrics grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: parsed.length <= 3 ? `repeat(${parsed.length}, 1fr)` : 'repeat(3, 1fr)',
          gap: 'clamp(8px, 2vw, 16px)',
          width: '100%',
          maxWidth: 480,
        }}>
          {parsed.map((m, i) => {
            const stagger = i * 0.1
            const cardEnter = easeOutCubic(Math.max(0, Math.min(1, (enterProgress - stagger) / (1 - stagger))))
            const isUp = m.change.startsWith('+')
            const trendColor = isUp ? '#10B981' : '#EF4444'

            // Hold: number ticking
            const holdTick = progress >= 0.2 && progress < 0.8
              ? 1 + Math.sin(holdProgress * Math.PI * 6 + i * 2) * 0.005
              : 1

            return (
              <div key={i} style={{
                background: `${textColor}05`,
                borderRadius: 'clamp(8px, 1.5vw, 14px)',
                padding: 'clamp(12px, 2.5vw, 22px)',
                border: `1px solid ${textColor}08`,
                textAlign: 'center',
                opacity: cardEnter,
                transform: `translateY(${(1 - cardEnter) * 16}px) scale(${holdTick})`,
              }}>
                {/* Metric label */}
                <div style={{
                  fontFamily: "'Inter', sans-serif",
                  fontSize: 'clamp(8px, 1.4vw, 11px)',
                  fontWeight: 500,
                  color: `${textColor}50`,
                  textTransform: 'uppercase',
                  letterSpacing: '0.08em',
                  marginBottom: 'clamp(4px, 1vw, 8px)',
                }}>
                  {m.label}
                </div>
                {/* Value */}
                <div style={{
                  fontFamily: "'Inter', sans-serif",
                  fontSize: 'clamp(18px, 4.5vw, 34px)',
                  fontWeight: 800,
                  color: textColor,
                  lineHeight: 1.1,
                  marginBottom: 'clamp(4px, 1vw, 8px)',
                }}>
                  {formatNumber(m.value, cardEnter)}
                </div>
                {/* Trend */}
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 3,
                }}>
                  <span style={{
                    fontSize: 'clamp(8px, 1.4vw, 11px)',
                    color: trendColor,
                  }}>
                    {isUp ? '\u2191' : '\u2193'}
                  </span>
                  <span style={{
                    fontFamily: "'SF Mono', monospace",
                    fontSize: 'clamp(9px, 1.6vw, 12px)',
                    fontWeight: 600,
                    color: trendColor,
                  }}>
                    {m.change}
                  </span>
                </div>
                {/* Mini bar */}
                <div style={{
                  marginTop: 'clamp(6px, 1.5vw, 12px)',
                  height: 3,
                  borderRadius: 2,
                  background: `${textColor}08`,
                  overflow: 'hidden',
                }}>
                  <div style={{
                    height: '100%',
                    width: `${cardEnter * (50 + (i * 23) % 45)}%`,
                    background: `linear-gradient(90deg, ${accentColor}80, ${accentColor})`,
                    borderRadius: 2,
                  }} />
                </div>
              </div>
            )
          })}
        </div>

        {/* Engagement rate footer */}
        <div style={{
          marginTop: 'clamp(14px, 3.5vw, 28px)',
          display: 'flex',
          alignItems: 'center',
          gap: 'clamp(8px, 2vw, 14px)',
          opacity: easeOutCubic(Math.max(0, (enterProgress - 0.5) / 0.5)),
        }}>
          <div style={{
            width: 'clamp(24px, 5vw, 36px)',
            height: 'clamp(24px, 5vw, 36px)',
            borderRadius: '50%',
            border: `2px solid ${accentColor}40`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontFamily: "'SF Mono', monospace",
            fontSize: 'clamp(7px, 1.2vw, 10px)',
            fontWeight: 700,
            color: accentColor,
          }}>
            {'\u2191'}
          </div>
          <div>
            <div style={{
              fontFamily: "'Inter', sans-serif",
              fontSize: 'clamp(8px, 1.4vw, 11px)',
              color: `${textColor}50`,
              fontWeight: 500,
            }}>
              Overall Growth
            </div>
            <div style={{
              fontFamily: "'SF Mono', monospace",
              fontSize: 'clamp(12px, 2.5vw, 18px)',
              fontWeight: 800,
              color: '#10B981',
            }}>
              +{(14.3 * easeOutCubic(enterProgress)).toFixed(1)}%
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

registerMotionGraphic({
  id: 'tpl-scene-social-metrics',
  title: 'Social Metrics',
  description: 'Social media analytics dashboard with platform icon, animated metric cards showing followers/engagement/reach with trend indicators.',
  tags: ['scene', 'social', 'metrics', 'analytics', 'instagram', 'tiktok', 'marketing', 'engagement'],
  category: 'scene-layout',
  component: SceneSocialMetricsComponent as any,
  defaultConfig: {
    metrics: ['Followers:48.2K:+12.4%', 'Engagement:5.7%:+2.1%', 'Reach:312K:+18.6%', 'Impressions:1.2M:+24.3%', 'Shares:8,450:+9.7%', 'Saves:15.3K:+31.2%'],
    platform: 'Instagram',
    accentColor: '#E1306C',
    bgColor: '#0f172a',
    textColor: '#e2e8f0',
  },
  configSchema: [
    { key: 'metrics', label: 'Metrics (Label:Value:Change)', type: 'text-array', defaultValue: ['Followers:48.2K:+12.4%', 'Engagement:5.7%:+2.1%', 'Reach:312K:+18.6%', 'Impressions:1.2M:+24.3%', 'Shares:8,450:+9.7%', 'Saves:15.3K:+31.2%'], group: 'Content' },
    { key: 'platform', label: 'Platform', type: 'text', defaultValue: 'Instagram', group: 'Content' },
    { key: 'accentColor', label: 'Accent Color', type: 'color', defaultValue: '#E1306C', group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#0f172a', group: 'Style' },
    { key: 'textColor', label: 'Text Color', type: 'color', defaultValue: '#e2e8f0', group: 'Style' },
  ],
})
