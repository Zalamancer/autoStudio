import React from 'react'
import { registerMotionGraphic } from '../registry'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface SceneScoreboardConfig {
  team1Name: string
  team2Name: string
  team1Score: number
  team2Score: number
  gameLabel: string
  bgColor: string
  accentColor: string
  team1Color: string
  team2Color: string
  textColor: string
}

function easeOutCubic(t: number): number { return 1 - Math.pow(1 - t, 3) }
function easeInCubic(t: number): number { return t * t * t }
function easeOutBack(t: number): number {
  const c1 = 1.70158
  const c3 = c1 + 1
  return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2)
}

function SceneScoreboardComponent({ config, progress }: MotionGraphicProps<SceneScoreboardConfig>) {
  const { team1Name, team2Name, team1Score, team2Score, gameLabel, bgColor, accentColor, team1Color, team2Color, textColor } = config

  const enterProgress = progress < 0.25 ? progress / 0.25 : 1
  const holdProgress = progress >= 0.25 && progress < 0.8 ? (progress - 0.25) / 0.55 : progress >= 0.8 ? 1 : 0
  const exitProgress = progress >= 0.8 ? (progress - 0.8) / 0.2 : 0

  // Board scale in
  const boardScale = easeOutBack(Math.min(1, enterProgress / 0.5))

  // Score counters
  const scoreReveal = easeOutCubic(Math.max(0, Math.min(1, (enterProgress - 0.3) / 0.5)))
  const displayScore1 = Math.round(team1Score * scoreReveal)
  const displayScore2 = Math.round(team2Score * scoreReveal)

  // Neon glow pulse during hold
  const isHolding = progress >= 0.25 && progress < 0.8
  const glowPulse = isHolding ? 0.6 + Math.sin(holdProgress * Math.PI * 6) * 0.4 : 1

  // Exit
  const exitEased = easeInCubic(exitProgress)
  const exitScale = 1 - exitEased * 0.3
  const exitOpacity = 1 - exitEased

  // Game label fade in
  const labelReveal = easeOutCubic(Math.max(0, Math.min(1, (enterProgress - 0.5) / 0.3)))

  // Team names slide in from sides
  const team1Slide = easeOutCubic(Math.max(0, Math.min(1, enterProgress / 0.4)))
  const team2Slide = easeOutCubic(Math.max(0, Math.min(1, (enterProgress - 0.1) / 0.4)))

  return (
    <div style={{ position: 'absolute', inset: 0, overflow: 'hidden' }}>
      <div style={{ position: 'absolute', inset: 0, background: bgColor }} />

      {/* Neon border lines */}
      <div
        style={{
          position: 'absolute',
          top: '8%',
          left: '5%',
          right: '5%',
          height: 2,
          background: `linear-gradient(90deg, transparent, ${accentColor}, transparent)`,
          opacity: glowPulse * boardScale,
          boxShadow: `0 0 12px ${accentColor}80`,
        }}
      />
      <div
        style={{
          position: 'absolute',
          bottom: '8%',
          left: '5%',
          right: '5%',
          height: 2,
          background: `linear-gradient(90deg, transparent, ${accentColor}, transparent)`,
          opacity: glowPulse * boardScale,
          boxShadow: `0 0 12px ${accentColor}80`,
        }}
      />

      {/* Main scoreboard */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          transform: `scale(${boardScale * exitScale})`,
          opacity: exitOpacity,
        }}
      >
        {/* Game label */}
        <div
          style={{
            fontFamily: "'Inter', 'Helvetica Neue', sans-serif",
            fontSize: 'clamp(9px, 1.5vw, 13px)',
            fontWeight: 700,
            color: accentColor,
            textTransform: 'uppercase',
            letterSpacing: '0.2em',
            marginBottom: 'clamp(8px, 2vw, 20px)',
            opacity: labelReveal,
          }}
        >
          {gameLabel}
        </div>

        {/* Scores row */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 'clamp(16px, 4vw, 40px)',
          }}
        >
          {/* Team 1 */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 'clamp(4px, 1vw, 10px)',
              opacity: team1Slide,
              transform: `translateX(${(1 - team1Slide) * -40}px)`,
            }}
          >
            <div
              style={{
                fontFamily: "'Inter', 'Helvetica Neue', sans-serif",
                fontSize: 'clamp(12px, 2.2vw, 18px)',
                fontWeight: 700,
                color: team1Color,
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
              }}
            >
              {team1Name}
            </div>
            <div
              style={{
                fontFamily: "'Inter', 'Helvetica Neue', sans-serif",
                fontSize: 'clamp(48px, 12vw, 100px)',
                fontWeight: 900,
                color: textColor,
                lineHeight: 1,
                textShadow: `0 0 20px ${team1Color}60`,
              }}
            >
              {displayScore1}
            </div>
          </div>

          {/* Divider */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 4,
            }}
          >
            <div
              style={{
                width: 4,
                height: 4,
                borderRadius: '50%',
                background: accentColor,
                boxShadow: `0 0 8px ${accentColor}`,
              }}
            />
            <div
              style={{
                fontFamily: "'Inter', sans-serif",
                fontSize: 'clamp(20px, 5vw, 40px)',
                fontWeight: 300,
                color: `${textColor}50`,
              }}
            >
              :
            </div>
            <div
              style={{
                width: 4,
                height: 4,
                borderRadius: '50%',
                background: accentColor,
                boxShadow: `0 0 8px ${accentColor}`,
              }}
            />
          </div>

          {/* Team 2 */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 'clamp(4px, 1vw, 10px)',
              opacity: team2Slide,
              transform: `translateX(${(1 - team2Slide) * 40}px)`,
            }}
          >
            <div
              style={{
                fontFamily: "'Inter', 'Helvetica Neue', sans-serif",
                fontSize: 'clamp(12px, 2.2vw, 18px)',
                fontWeight: 700,
                color: team2Color,
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
              }}
            >
              {team2Name}
            </div>
            <div
              style={{
                fontFamily: "'Inter', 'Helvetica Neue', sans-serif",
                fontSize: 'clamp(48px, 12vw, 100px)',
                fontWeight: 900,
                color: textColor,
                lineHeight: 1,
                textShadow: `0 0 20px ${team2Color}60`,
              }}
            >
              {displayScore2}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

registerMotionGraphic({
  id: 'tpl-scene-scoreboard',
  title: 'Esports Scoreboard',
  description: 'Esports scoreboard with team names, scores, game number, neon-lit with animated score counter',
  tags: ['scene', 'gaming', 'esports', 'scoreboard', 'versus', 'competition'],
  category: 'scene-layout',
  component: SceneScoreboardComponent as any,
  defaultConfig: {
    team1Name: 'SENTINELS',
    team2Name: 'FNATIC',
    team1Score: 13,
    team2Score: 9,
    gameLabel: 'GAME 3 \u2022 VALORANT CHAMPIONS',
    bgColor: '#0a0a14',
    accentColor: '#00d4ff',
    team1Color: '#ff4655',
    team2Color: '#ff8c00',
    textColor: '#ffffff',
  },
  configSchema: [
    { key: 'team1Name', label: 'Team 1 Name', type: 'text', defaultValue: 'SENTINELS', group: 'Content' },
    { key: 'team2Name', label: 'Team 2 Name', type: 'text', defaultValue: 'FNATIC', group: 'Content' },
    { key: 'team1Score', label: 'Team 1 Score', type: 'number', defaultValue: 13, min: 0, max: 999, group: 'Content' },
    { key: 'team2Score', label: 'Team 2 Score', type: 'number', defaultValue: 9, min: 0, max: 999, group: 'Content' },
    { key: 'gameLabel', label: 'Game Label', type: 'text', defaultValue: 'GAME 3 \u2022 VALORANT CHAMPIONS', group: 'Content' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#0a0a14', group: 'Style' },
    { key: 'accentColor', label: 'Accent / Neon', type: 'color', defaultValue: '#00d4ff', group: 'Style' },
    { key: 'team1Color', label: 'Team 1 Color', type: 'color', defaultValue: '#ff4655', group: 'Style' },
    { key: 'team2Color', label: 'Team 2 Color', type: 'color', defaultValue: '#ff8c00', group: 'Style' },
    { key: 'textColor', label: 'Text Color', type: 'color', defaultValue: '#ffffff', group: 'Style' },
  ],
})
