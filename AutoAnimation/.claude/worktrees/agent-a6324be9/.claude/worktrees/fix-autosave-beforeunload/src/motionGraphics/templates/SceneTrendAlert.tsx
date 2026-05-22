import React from 'react'
import { registerMotionGraphic } from '../registry'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface TrendAlertConfig {
  trendName: string
  description: string
  season: string
  bgColor: string
  textColor: string
  accentColor: string
  badgeColor: string
}

function easeOutCubic(t: number): number { return 1 - Math.pow(1 - t, 3) }
function easeInCubic(t: number): number { return t * t * t }
function elasticOut(t: number): number {
  if (t === 0 || t === 1) return t
  return Math.pow(2, -10 * t) * Math.sin((t - 0.075) * (2 * Math.PI) / 0.3) + 1
}

function SceneTrendAlertComponent({ config, progress, frame, fps }: MotionGraphicProps<TrendAlertConfig>) {
  const { trendName, description, season, bgColor, textColor, accentColor, badgeColor } = config

  const enterProgress = progress < 0.25 ? progress / 0.25 : 1
  const holdProgress = progress >= 0.25 && progress < 0.8 ? (progress - 0.25) / 0.55 : 0
  const exitProgress = progress >= 0.8 ? (progress - 0.8) / 0.2 : 0

  const exitEased = easeInCubic(exitProgress)
  const exitOpacity = exitProgress > 0 ? 1 - exitEased : 1

  // Alert badge pops in
  const badgePop = elasticOut(Math.min(1, enterProgress / 0.3))

  // Trend name slides from right
  const nameEnter = easeOutCubic(Math.max(0, Math.min(1, (enterProgress - 0.15) / 0.35)))

  // Description fades
  const descEnter = easeOutCubic(Math.max(0, Math.min(1, (enterProgress - 0.4) / 0.3)))

  // Season tag slides
  const seasonEnter = easeOutCubic(Math.max(0, Math.min(1, (enterProgress - 0.6) / 0.25)))

  // Hold: badge pulse
  const pulseBadge = 1 + Math.sin(holdProgress * Math.PI * 8) * 0.04

  // Decorative diagonal line
  const lineProgress = easeOutCubic(Math.max(0, Math.min(1, (enterProgress - 0.1) / 0.3)))

  return (
    <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', background: bgColor, fontFamily: "'Inter', 'Helvetica Neue', sans-serif" }}>
      {/* Bold diagonal accent stripe */}
      <div
        style={{
          position: 'absolute',
          top: -20,
          right: -20,
          width: '60%',
          height: '110%',
          background: `linear-gradient(135deg, transparent 48%, ${accentColor}08 48%, ${accentColor}08 52%, transparent 52%)`,
          opacity: lineProgress,
        }}
      />

      {/* Small accent dots */}
      <div
        style={{
          position: 'absolute',
          top: '15%',
          left: '12%',
          width: 'clamp(4px, 0.8vw, 6px)',
          height: 'clamp(4px, 0.8vw, 6px)',
          borderRadius: '50%',
          background: accentColor,
          opacity: badgePop * 0.5,
        }}
      />
      <div
        style={{
          position: 'absolute',
          bottom: '20%',
          right: '15%',
          width: 'clamp(3px, 0.6vw, 5px)',
          height: 'clamp(3px, 0.6vw, 5px)',
          borderRadius: '50%',
          background: accentColor,
          opacity: badgePop * 0.4,
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
          padding: '8%',
          gap: 'clamp(12px, 2.5vh, 24px)',
          opacity: exitOpacity,
          transform: `translateX(${exitEased * 60}px)`,
        }}
      >
        {/* Alert badge */}
        <div
          style={{
            background: badgeColor,
            color: '#ffffff',
            fontSize: 'clamp(11px, 2vw, 16px)',
            fontWeight: 800,
            letterSpacing: '0.15em',
            textTransform: 'uppercase',
            padding: 'clamp(6px, 1.2vh, 12px) clamp(16px, 3vw, 28px)',
            borderRadius: 'clamp(4px, 0.8vw, 8px)',
            transform: `scale(${badgePop * pulseBadge})`,
            boxShadow: `0 4px 20px ${badgeColor}50`,
            display: 'flex',
            alignItems: 'center',
            gap: 'clamp(4px, 1vw, 10px)',
          }}
        >
          <span style={{ fontSize: 'clamp(14px, 2.5vw, 20px)' }}>🔥</span>
          TREND ALERT
        </div>

        {/* Trend name */}
        <div
          style={{
            fontSize: 'clamp(28px, 8vw, 60px)',
            fontWeight: 900,
            color: textColor,
            textTransform: 'uppercase',
            letterSpacing: '0.04em',
            lineHeight: 1.1,
            textAlign: 'center',
            opacity: nameEnter,
            transform: `translateX(${(1 - nameEnter) * 50}px)`,
          }}
        >
          {trendName}
        </div>

        {/* Accent line */}
        <div
          style={{
            width: 'clamp(50px, 12vw, 90px)',
            height: 3,
            background: accentColor,
            transform: `scaleX(${nameEnter})`,
          }}
        />

        {/* Description */}
        <div
          style={{
            fontSize: 'clamp(13px, 2.5vw, 20px)',
            fontWeight: 400,
            color: `${textColor}bb`,
            lineHeight: 1.6,
            textAlign: 'center',
            maxWidth: 380,
            opacity: descEnter,
            transform: `translateY(${(1 - descEnter) * 12}px)`,
          }}
        >
          {description}
        </div>

        {/* Season tag */}
        <div
          style={{
            fontSize: 'clamp(10px, 1.6vw, 13px)',
            fontWeight: 600,
            color: accentColor,
            letterSpacing: '0.2em',
            textTransform: 'uppercase',
            padding: 'clamp(4px, 0.8vh, 8px) clamp(12px, 2vw, 20px)',
            border: `1px solid ${accentColor}60`,
            borderRadius: 'clamp(2px, 0.4vw, 4px)',
            opacity: seasonEnter,
            transform: `translateY(${(1 - seasonEnter) * 10}px)`,
          }}
        >
          {season}
        </div>
      </div>
    </div>
  )
}

registerMotionGraphic({
  id: 'tpl-scene-trend-alert',
  title: 'Trend Alert',
  description: 'Fashion trend alert card with bold badge pop, trend name slide, season tag. Pink/black fashion-forward.',
  tags: ['scene', 'trend', 'fashion', 'beauty', 'alert', 'bold', 'style'],
  category: 'scene-layout',
  component: SceneTrendAlertComponent as any,
  defaultConfig: {
    trendName: 'Quiet Luxury',
    description: 'Understated elegance takes over — neutral tones, premium fabrics, no visible logos.',
    season: 'Spring/Summer 2026',
    bgColor: '#0f0a10',
    textColor: '#faf0f5',
    accentColor: '#e84393',
    badgeColor: '#e84393',
  },
  configSchema: [
    { key: 'trendName', label: 'Trend Name', type: 'text', defaultValue: 'Quiet Luxury', group: 'Content' },
    { key: 'description', label: 'Description', type: 'text', defaultValue: 'Understated elegance takes over — neutral tones, premium fabrics, no visible logos.', group: 'Content' },
    { key: 'season', label: 'Season', type: 'text', defaultValue: 'Spring/Summer 2026', group: 'Content' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#0f0a10', group: 'Style' },
    { key: 'textColor', label: 'Text Color', type: 'color', defaultValue: '#faf0f5', group: 'Style' },
    { key: 'accentColor', label: 'Accent Color', type: 'color', defaultValue: '#e84393', group: 'Style' },
    { key: 'badgeColor', label: 'Badge Color', type: 'color', defaultValue: '#e84393', group: 'Style' },
  ],
})
