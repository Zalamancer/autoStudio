import React from 'react'
import { registerMotionGraphic } from '../registry'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface SceneStandingsTableConfig {
  title: string
  teams: string[]
  bgColor: string
  accentColor: string
  textColor: string
  goldColor: string
}

function easeOutCubic(t: number): number { return 1 - Math.pow(1 - t, 3) }
function easeInCubic(t: number): number { return t * t * t }

function parseTeam(s: string): { name: string; w: number; l: number; d: number; pts: number } {
  const parts = s.split(':')
  const name = (parts[0] || '').trim()
  const record = (parts[1] || '0-0-0-0').trim().split('-')
  return {
    name,
    w: parseInt(record[0] || '0', 10),
    l: parseInt(record[1] || '0', 10),
    d: parseInt(record[2] || '0', 10),
    pts: parseInt(record[3] || '0', 10),
  }
}

function SceneStandingsTableComponent({ config, progress }: MotionGraphicProps<SceneStandingsTableConfig>) {
  const { title, teams, bgColor, accentColor, textColor, goldColor } = config

  const enterProgress = progress < 0.25 ? progress / 0.25 : 1
  const exitProgress = progress >= 0.8 ? (progress - 0.8) / 0.2 : 0

  const parsed = teams.map(parseTeam)

  // Title slide down
  const titleReveal = easeOutCubic(Math.min(1, enterProgress / 0.4))

  // Exit
  const exitEased = easeInCubic(exitProgress)
  const exitOpacity = 1 - exitEased

  return (
    <div style={{ position: 'absolute', inset: 0, overflow: 'hidden' }}>
      <div style={{ position: 'absolute', inset: 0, background: bgColor }} />

      {/* Main content */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          flexDirection: 'column',
          padding: '6% 6%',
          opacity: exitOpacity,
        }}
      >
        {/* Title */}
        <div
          style={{
            fontFamily: "'Inter', 'Helvetica Neue', sans-serif",
            fontSize: 'clamp(16px, 3.5vw, 28px)',
            fontWeight: 900,
            color: textColor,
            textTransform: 'uppercase',
            letterSpacing: '0.06em',
            marginBottom: 'clamp(8px, 2vw, 20px)',
            opacity: titleReveal,
            transform: `translateY(${(1 - titleReveal) * -20}px)`,
            borderBottom: `2px solid ${accentColor}40`,
            paddingBottom: 'clamp(6px, 1.2vw, 12px)',
          }}
        >
          {title}
        </div>

        {/* Header row */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            padding: 'clamp(4px, 0.8vw, 8px) clamp(8px, 1.5vw, 14px)',
            opacity: titleReveal * 0.7,
            fontFamily: "'Inter', sans-serif",
            fontSize: 'clamp(8px, 1.2vw, 10px)',
            fontWeight: 700,
            color: `${textColor}50`,
            textTransform: 'uppercase',
            letterSpacing: '0.1em',
          }}
        >
          <div style={{ width: 'clamp(20px, 4vw, 32px)', textAlign: 'center', flexShrink: 0 }}>#</div>
          <div style={{ flex: 1, marginLeft: 'clamp(6px, 1.2vw, 12px)' }}>TEAM</div>
          <div style={{ width: 'clamp(26px, 5vw, 40px)', textAlign: 'center' }}>W</div>
          <div style={{ width: 'clamp(26px, 5vw, 40px)', textAlign: 'center' }}>L</div>
          <div style={{ width: 'clamp(26px, 5vw, 40px)', textAlign: 'center' }}>D</div>
          <div style={{ width: 'clamp(32px, 6vw, 50px)', textAlign: 'center' }}>PTS</div>
        </div>

        {/* Team rows */}
        {parsed.map((team, i) => {
          const stagger = i * 0.1
          const rowEnter = easeOutCubic(Math.max(0, Math.min(1, (enterProgress - 0.2 - stagger) / 0.5)))
          const rowSlide = (1 - rowEnter) * 60
          const isFirst = i === 0
          const rowExit = exitProgress > 0
            ? easeInCubic(Math.max(0, Math.min(1, (exitProgress - i * 0.04) / (1 - i * 0.04))))
            : 0

          return (
            <div
              key={i}
              style={{
                display: 'flex',
                alignItems: 'center',
                padding: 'clamp(8px, 1.5vw, 14px) clamp(8px, 1.5vw, 14px)',
                borderRadius: 8,
                background: isFirst ? `${goldColor}12` : i % 2 === 0 ? `${textColor}05` : 'transparent',
                border: isFirst ? `1px solid ${goldColor}30` : '1px solid transparent',
                opacity: rowEnter * (1 - rowExit),
                transform: `translateX(${rowSlide}px)`,
                marginBottom: 'clamp(2px, 0.4vw, 4px)',
              }}
            >
              {/* Rank */}
              <div
                style={{
                  width: 'clamp(20px, 4vw, 32px)',
                  textAlign: 'center',
                  fontFamily: "'Inter', sans-serif",
                  fontSize: 'clamp(12px, 2vw, 18px)',
                  fontWeight: 900,
                  color: isFirst ? goldColor : `${textColor}60`,
                  flexShrink: 0,
                }}
              >
                {i + 1}
              </div>

              {/* Team name */}
              <div
                style={{
                  flex: 1,
                  marginLeft: 'clamp(6px, 1.2vw, 12px)',
                  fontFamily: "'Inter', 'Helvetica Neue', sans-serif",
                  fontSize: 'clamp(11px, 2vw, 18px)',
                  fontWeight: isFirst ? 800 : 600,
                  color: isFirst ? textColor : `${textColor}e0`,
                  textTransform: 'uppercase',
                }}
              >
                {team.name}
              </div>

              {/* W-L-D */}
              <div
                style={{
                  width: 'clamp(26px, 5vw, 40px)',
                  textAlign: 'center',
                  fontFamily: "'Inter', sans-serif",
                  fontSize: 'clamp(10px, 1.6vw, 15px)',
                  fontWeight: 600,
                  color: `${textColor}c0`,
                }}
              >
                {team.w}
              </div>
              <div
                style={{
                  width: 'clamp(26px, 5vw, 40px)',
                  textAlign: 'center',
                  fontFamily: "'Inter', sans-serif",
                  fontSize: 'clamp(10px, 1.6vw, 15px)',
                  fontWeight: 600,
                  color: `${textColor}c0`,
                }}
              >
                {team.l}
              </div>
              <div
                style={{
                  width: 'clamp(26px, 5vw, 40px)',
                  textAlign: 'center',
                  fontFamily: "'Inter', sans-serif",
                  fontSize: 'clamp(10px, 1.6vw, 15px)',
                  fontWeight: 600,
                  color: `${textColor}c0`,
                }}
              >
                {team.d}
              </div>

              {/* Points */}
              <div
                style={{
                  width: 'clamp(32px, 6vw, 50px)',
                  textAlign: 'center',
                  fontFamily: "'Inter', sans-serif",
                  fontSize: 'clamp(12px, 2vw, 18px)',
                  fontWeight: 900,
                  color: isFirst ? goldColor : accentColor,
                }}
              >
                {Math.round(team.pts * rowEnter)}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

registerMotionGraphic({
  id: 'tpl-scene-standings-table',
  title: 'League Standings',
  description: 'League standings table with rank, team, W-L-D, points. Staggered row slide-in with #1 highlighted gold. Clean sports table aesthetic.',
  tags: ['scene', 'sports', 'standings', 'table', 'league', 'rankings', 'athletics'],
  category: 'scene-layout',
  component: SceneStandingsTableComponent as any,
  defaultConfig: {
    title: 'PREMIER LEAGUE STANDINGS',
    teams: [
      'Manchester City:20-3-5-65',
      'Arsenal:19-4-5-62',
      'Liverpool:17-5-6-57',
      'Aston Villa:16-7-5-53',
      'Tottenham:14-8-6-48',
    ],
    bgColor: '#0c1222',
    accentColor: '#818cf8',
    textColor: '#e2e8f0',
    goldColor: '#fbbf24',
  },
  configSchema: [
    { key: 'title', label: 'Table Title', type: 'text', defaultValue: 'PREMIER LEAGUE STANDINGS', group: 'Content' },
    { key: 'teams', label: 'Teams (Name:W-L-D-PTS)', type: 'text-array', defaultValue: ['Manchester City:20-3-5-65', 'Arsenal:19-4-5-62', 'Liverpool:17-5-6-57', 'Aston Villa:16-7-5-53', 'Tottenham:14-8-6-48'], group: 'Content' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#0c1222', group: 'Style' },
    { key: 'accentColor', label: 'Accent', type: 'color', defaultValue: '#818cf8', group: 'Style' },
    { key: 'textColor', label: 'Text Color', type: 'color', defaultValue: '#e2e8f0', group: 'Style' },
    { key: 'goldColor', label: '#1 Highlight', type: 'color', defaultValue: '#fbbf24', group: 'Style' },
  ],
})
