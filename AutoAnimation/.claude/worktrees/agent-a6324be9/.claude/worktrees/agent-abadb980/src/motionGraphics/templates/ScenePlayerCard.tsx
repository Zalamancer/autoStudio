import React from 'react'
import { registerMotionGraphic } from '../registry'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface ScenePlayerCardConfig {
  playerName: string
  position: string
  jerseyNumber: number
  stat1Label: string
  stat1Value: number
  stat2Label: string
  stat2Value: number
  stat3Label: string
  stat3Value: number
  teamName: string
  bgColor: string
  accentColor: string
  textColor: string
}

function easeOutCubic(t: number): number { return 1 - Math.pow(1 - t, 3) }
function easeInCubic(t: number): number { return t * t * t }
function easeOutBack(t: number): number {
  const c1 = 1.70158
  const c3 = c1 + 1
  return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2)
}

function ScenePlayerCardComponent({ config, progress }: MotionGraphicProps<ScenePlayerCardConfig>) {
  const { playerName, position, jerseyNumber, stat1Label, stat1Value, stat2Label, stat2Value, stat3Label, stat3Value, teamName, bgColor, accentColor, textColor } = config

  const enterProgress = progress < 0.2 ? progress / 0.2 : 1
  const holdProgress = progress >= 0.2 && progress < 0.8 ? (progress - 0.2) / 0.6 : progress >= 0.8 ? 1 : 0
  const exitProgress = progress >= 0.8 ? (progress - 0.8) / 0.2 : 0

  // Card flip in (simulate with scale X)
  const cardFlip = easeOutBack(Math.min(1, enterProgress / 0.6))
  const cardOpacity = easeOutCubic(Math.min(1, enterProgress / 0.3))

  // Jersey number scale
  const numberScale = easeOutBack(Math.max(0, Math.min(1, (enterProgress - 0.15) / 0.5)))

  // Stats count up
  const statsReveal = easeOutCubic(Math.max(0, Math.min(1, (enterProgress - 0.4) / 0.5)))
  const displayStat1 = Math.round(stat1Value * statsReveal)
  const displayStat2 = Math.round(stat2Value * statsReveal)
  const displayStat3 = Math.round(stat3Value * statsReveal)

  // Stat bars animate
  const stat1Width = statsReveal * Math.min(stat1Value, 100)
  const stat2Width = statsReveal * Math.min(stat2Value, 100)
  const stat3Width = statsReveal * Math.min(stat3Value, 100)

  // Hold shimmer
  const isHolding = progress >= 0.2 && progress < 0.8
  const shimmerX = isHolding ? (holdProgress * 200 - 50) : -50

  // Exit
  const exitEased = easeInCubic(exitProgress)
  const exitOpacity = 1 - exitEased
  const exitScale = 1 - exitEased * 0.2

  const stats = [
    { label: stat1Label, value: displayStat1, width: stat1Width },
    { label: stat2Label, value: displayStat2, width: stat2Width },
    { label: stat3Label, value: displayStat3, width: stat3Width },
  ]

  return (
    <div style={{ position: 'absolute', inset: 0, overflow: 'hidden' }}>
      <div style={{ position: 'absolute', inset: 0, background: bgColor }} />

      {/* Card container */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          transform: `scale(${cardFlip * exitScale})`,
          opacity: cardOpacity * exitOpacity,
        }}
      >
        <div
          style={{
            width: '82%',
            maxWidth: 420,
            background: `linear-gradient(145deg, ${bgColor}, ${accentColor}15)`,
            border: `2px solid ${accentColor}40`,
            borderRadius: 16,
            padding: 'clamp(16px, 3vw, 28px)',
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          {/* Shimmer overlay */}
          <div
            style={{
              position: 'absolute',
              inset: 0,
              background: `linear-gradient(105deg, transparent 40%, ${accentColor}10 50%, transparent 60%)`,
              transform: `translateX(${shimmerX}%)`,
              pointerEvents: 'none',
            }}
          />

          {/* Top section: jersey number + name */}
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 'clamp(12px, 2.5vw, 24px)', marginBottom: 'clamp(12px, 2.5vw, 24px)' }}>
            {/* Large jersey number */}
            <div
              style={{
                fontFamily: "'Inter', 'Helvetica Neue', sans-serif",
                fontSize: 'clamp(48px, 12vw, 90px)',
                fontWeight: 900,
                color: accentColor,
                lineHeight: 0.9,
                transform: `scale(${numberScale})`,
                opacity: 0.9,
                textShadow: `0 0 40px ${accentColor}30`,
                flexShrink: 0,
              }}
            >
              {jerseyNumber}
            </div>

            {/* Name + position */}
            <div style={{ flex: 1, paddingTop: 'clamp(4px, 1vw, 8px)' }}>
              <div
                style={{
                  fontFamily: "'Inter', 'Helvetica Neue', sans-serif",
                  fontSize: 'clamp(18px, 4vw, 32px)',
                  fontWeight: 900,
                  color: textColor,
                  textTransform: 'uppercase',
                  lineHeight: 1.1,
                  letterSpacing: '-0.02em',
                }}
              >
                {playerName}
              </div>
              <div
                style={{
                  fontFamily: "'Inter', sans-serif",
                  fontSize: 'clamp(10px, 1.6vw, 13px)',
                  fontWeight: 600,
                  color: accentColor,
                  textTransform: 'uppercase',
                  letterSpacing: '0.15em',
                  marginTop: 'clamp(2px, 0.5vw, 6px)',
                }}
              >
                {position}
              </div>
              <div
                style={{
                  fontFamily: "'Inter', sans-serif",
                  fontSize: 'clamp(9px, 1.3vw, 11px)',
                  fontWeight: 500,
                  color: `${textColor}60`,
                  textTransform: 'uppercase',
                  letterSpacing: '0.1em',
                  marginTop: 'clamp(1px, 0.3vw, 4px)',
                }}
              >
                {teamName}
              </div>
            </div>
          </div>

          {/* Divider */}
          <div
            style={{
              height: 1,
              background: `linear-gradient(90deg, ${accentColor}60, transparent)`,
              marginBottom: 'clamp(12px, 2.5vw, 20px)',
            }}
          />

          {/* Stats */}
          {stats.map((stat, i) => {
            const stagger = easeOutCubic(Math.max(0, Math.min(1, (enterProgress - 0.5 - i * 0.08) / 0.4)))
            return (
              <div
                key={i}
                style={{
                  marginBottom: 'clamp(8px, 1.5vw, 14px)',
                  opacity: stagger,
                  transform: `translateX(${(1 - stagger) * 30}px)`,
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 'clamp(2px, 0.4vw, 4px)' }}>
                  <div
                    style={{
                      fontFamily: "'Inter', sans-serif",
                      fontSize: 'clamp(9px, 1.4vw, 12px)',
                      fontWeight: 600,
                      color: `${textColor}80`,
                      textTransform: 'uppercase',
                      letterSpacing: '0.08em',
                    }}
                  >
                    {stat.label}
                  </div>
                  <div
                    style={{
                      fontFamily: "'Inter', sans-serif",
                      fontSize: 'clamp(11px, 1.8vw, 16px)',
                      fontWeight: 800,
                      color: textColor,
                    }}
                  >
                    {stat.value}
                  </div>
                </div>
                <div
                  style={{
                    height: 'clamp(3px, 0.6vw, 5px)',
                    background: `${textColor}10`,
                    borderRadius: 4,
                    overflow: 'hidden',
                  }}
                >
                  <div
                    style={{
                      height: '100%',
                      width: `${stat.width}%`,
                      background: `linear-gradient(90deg, ${accentColor}, ${accentColor}80)`,
                      borderRadius: 4,
                      boxShadow: `0 0 8px ${accentColor}40`,
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
  id: 'tpl-scene-player-card',
  title: 'Player Stat Card',
  description: 'Sports player trading card with jersey number, stats with animated bars, team color accents. Card flips in with counting stats.',
  tags: ['scene', 'sports', 'player', 'stats', 'card', 'athletics', 'trading-card'],
  category: 'scene-layout',
  component: ScenePlayerCardComponent as any,
  defaultConfig: {
    playerName: 'MARCUS SMITH',
    position: 'STRIKER',
    jerseyNumber: 10,
    stat1Label: 'Goals',
    stat1Value: 24,
    stat2Label: 'Assists',
    stat2Value: 12,
    stat3Label: 'Matches',
    stat3Value: 38,
    teamName: 'FC UNITED',
    bgColor: '#0c1020',
    accentColor: '#ff4444',
    textColor: '#ffffff',
  },
  configSchema: [
    { key: 'playerName', label: 'Player Name', type: 'text', defaultValue: 'MARCUS SMITH', group: 'Content' },
    { key: 'position', label: 'Position', type: 'text', defaultValue: 'STRIKER', group: 'Content' },
    { key: 'jerseyNumber', label: 'Jersey Number', type: 'number', defaultValue: 10, min: 0, max: 99, group: 'Content' },
    { key: 'stat1Label', label: 'Stat 1 Label', type: 'text', defaultValue: 'Goals', group: 'Stats' },
    { key: 'stat1Value', label: 'Stat 1 Value', type: 'number', defaultValue: 24, min: 0, max: 999, group: 'Stats' },
    { key: 'stat2Label', label: 'Stat 2 Label', type: 'text', defaultValue: 'Assists', group: 'Stats' },
    { key: 'stat2Value', label: 'Stat 2 Value', type: 'number', defaultValue: 12, min: 0, max: 999, group: 'Stats' },
    { key: 'stat3Label', label: 'Stat 3 Label', type: 'text', defaultValue: 'Matches', group: 'Stats' },
    { key: 'stat3Value', label: 'Stat 3 Value', type: 'number', defaultValue: 38, min: 0, max: 999, group: 'Stats' },
    { key: 'teamName', label: 'Team Name', type: 'text', defaultValue: 'FC UNITED', group: 'Content' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#0c1020', group: 'Style' },
    { key: 'accentColor', label: 'Accent', type: 'color', defaultValue: '#ff4444', group: 'Style' },
    { key: 'textColor', label: 'Text Color', type: 'color', defaultValue: '#ffffff', group: 'Style' },
  ],
})
