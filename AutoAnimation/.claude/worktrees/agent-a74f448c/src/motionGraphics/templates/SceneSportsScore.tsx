import React from 'react'
import { registerMotionGraphic } from '../registry'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface SportsScoreConfig {
  team1Name: string
  team2Name: string
  team1Score: number
  team2Score: number
  team1Color: string
  team2Color: string
  gameTime: string
  period: string
  bgColor: string
  textColor: string
}

function easeOutCubic(t: number): number { return 1 - Math.pow(1 - t, 3) }
function easeInCubic(t: number): number { return t * t * t }
function easeOutBack(t: number): number {
  const c1 = 1.70158
  const c3 = c1 + 1
  return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2)
}

function SceneSportsScoreComponent({
  config,
  progress,
}: MotionGraphicProps<SportsScoreConfig>) {
  const { team1Name, team2Name, team1Score, team2Score, team1Color, team2Color, gameTime, period, bgColor, textColor } = config

  const enterEnd = 0.2
  const holdEnd = 0.82
  const enterProgress = Math.min(1, progress / enterEnd)
  const holdProgress = progress >= enterEnd && progress < holdEnd
    ? (progress - enterEnd) / (holdEnd - enterEnd) : progress >= holdEnd ? 1 : 0
  const exitProgress = progress >= holdEnd ? (progress - holdEnd) / (1 - holdEnd) : 0

  // Scoreboard slides in from bottom
  const boardEnter = easeOutBack(Math.min(1, enterProgress / 0.6))
  const boardY = (1 - boardEnter) * 120
  const boardOpacity = easeOutCubic(Math.min(1, enterProgress / 0.3))

  // Team names slide in from sides
  const team1Delay = 0.25
  const team1Enter = Math.max(0, Math.min(1, (enterProgress - team1Delay) / (1 - team1Delay)))
  const team1X = (1 - easeOutCubic(team1Enter)) * -40
  const team1Opacity = easeOutCubic(team1Enter)

  const team2Delay = 0.3
  const team2Enter = Math.max(0, Math.min(1, (enterProgress - team2Delay) / (1 - team2Delay)))
  const team2X = (1 - easeOutCubic(team2Enter)) * 40
  const team2Opacity = easeOutCubic(team2Enter)

  // Scores count up
  const scoreDelay = 0.4
  const scoreEnter = Math.max(0, Math.min(1, (enterProgress - scoreDelay) / (1 - scoreDelay)))
  const scoreEased = easeOutCubic(scoreEnter)
  const displayScore1 = Math.round(team1Score * scoreEased)
  const displayScore2 = Math.round(team2Score * scoreEased)

  // Game time/period fades in
  const timeDelay = 0.6
  const timeEnter = Math.max(0, Math.min(1, (enterProgress - timeDelay) / (1 - timeDelay)))
  const timeOpacity = easeOutCubic(timeEnter)

  // VS divider
  const vsDelay = 0.35
  const vsEnter = Math.max(0, Math.min(1, (enterProgress - vsDelay) / (1 - vsDelay)))
  const vsScale = easeOutBack(vsEnter)

  // Hold: score numbers can have subtle glow
  const scoreGlow = holdProgress > 0 ? 2 + Math.sin(holdProgress * Math.PI * 6) * 2 : 0

  // Exit: slides down
  const exitEased = easeInCubic(exitProgress)
  const exitY = exitEased * 150
  const exitOpacity = 1 - exitEased

  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        overflow: 'hidden',
        fontFamily: "'Inter', 'Helvetica Neue', sans-serif",
      }}
    >
      {/* Scoreboard overlay at bottom */}
      <div
        style={{
          position: 'absolute',
          bottom: '6%',
          left: '50%',
          transform: `translateX(-50%) translateY(${boardY + exitY}px)`,
          opacity: boardOpacity * exitOpacity,
          width: '90%',
          maxWidth: 520,
        }}
      >
        {/* Main scoreboard */}
        <div
          style={{
            background: bgColor,
            borderRadius: 'clamp(8px, 1.5vw, 14px)',
            overflow: 'hidden',
            boxShadow: '0 8px 40px rgba(0,0,0,0.5), 0 2px 8px rgba(0,0,0,0.3)',
          }}
        >
          {/* Score row */}
          <div
            style={{
              display: 'flex',
              alignItems: 'stretch',
            }}
          >
            {/* Team 1 */}
            <div
              style={{
                flex: 1,
                display: 'flex',
                alignItems: 'center',
                padding: 'clamp(10px, 2vw, 20px) clamp(12px, 2.5vw, 24px)',
                gap: 'clamp(8px, 1.5vw, 16px)',
                borderLeft: `4px solid ${team1Color}`,
                opacity: team1Opacity,
                transform: `translateX(${team1X}px)`,
              }}
            >
              {/* Team color dot */}
              <div
                style={{
                  width: 'clamp(10px, 1.8vw, 16px)',
                  height: 'clamp(10px, 1.8vw, 16px)',
                  borderRadius: '50%',
                  background: team1Color,
                  flexShrink: 0,
                }}
              />
              <div
                style={{
                  fontSize: 'clamp(12px, 2vw, 18px)',
                  fontWeight: 700,
                  color: textColor,
                  letterSpacing: '0.04em',
                  textTransform: 'uppercase',
                  flex: 1,
                }}
              >
                {team1Name}
              </div>
              <div
                style={{
                  fontSize: 'clamp(22px, 5vw, 42px)',
                  fontWeight: 900,
                  color: textColor,
                  textShadow: `0 0 ${scoreGlow}px ${team1Color}88`,
                  fontVariantNumeric: 'tabular-nums',
                  minWidth: 'clamp(28px, 5vw, 48px)',
                  textAlign: 'right',
                }}
              >
                {displayScore1}
              </div>
            </div>

            {/* VS divider */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '0 clamp(4px, 0.8vw, 8px)',
                transform: `scale(${vsScale})`,
              }}
            >
              <div
                style={{
                  width: 2,
                  height: '60%',
                  background: `${textColor}22`,
                }}
              />
            </div>

            {/* Team 2 */}
            <div
              style={{
                flex: 1,
                display: 'flex',
                alignItems: 'center',
                padding: 'clamp(10px, 2vw, 20px) clamp(12px, 2.5vw, 24px)',
                gap: 'clamp(8px, 1.5vw, 16px)',
                borderRight: `4px solid ${team2Color}`,
                flexDirection: 'row-reverse',
                opacity: team2Opacity,
                transform: `translateX(${team2X}px)`,
              }}
            >
              {/* Team color dot */}
              <div
                style={{
                  width: 'clamp(10px, 1.8vw, 16px)',
                  height: 'clamp(10px, 1.8vw, 16px)',
                  borderRadius: '50%',
                  background: team2Color,
                  flexShrink: 0,
                }}
              />
              <div
                style={{
                  fontSize: 'clamp(12px, 2vw, 18px)',
                  fontWeight: 700,
                  color: textColor,
                  letterSpacing: '0.04em',
                  textTransform: 'uppercase',
                  flex: 1,
                  textAlign: 'right',
                }}
              >
                {team2Name}
              </div>
              <div
                style={{
                  fontSize: 'clamp(22px, 5vw, 42px)',
                  fontWeight: 900,
                  color: textColor,
                  textShadow: `0 0 ${scoreGlow}px ${team2Color}88`,
                  fontVariantNumeric: 'tabular-nums',
                  minWidth: 'clamp(28px, 5vw, 48px)',
                  textAlign: 'left',
                }}
              >
                {displayScore2}
              </div>
            </div>
          </div>

          {/* Game time / period bar */}
          <div
            style={{
              background: `${textColor}08`,
              padding: 'clamp(4px, 0.8vw, 8px) clamp(12px, 2.5vw, 24px)',
              display: 'flex',
              justifyContent: 'center',
              gap: 'clamp(12px, 2.5vw, 24px)',
              alignItems: 'center',
              opacity: timeOpacity,
              borderTop: `1px solid ${textColor}12`,
            }}
          >
            <span
              style={{
                fontSize: 'clamp(9px, 1.3vw, 13px)',
                fontWeight: 600,
                color: `${textColor}88`,
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
              }}
            >
              {period}
            </span>
            <div
              style={{
                width: 4,
                height: 4,
                borderRadius: '50%',
                background: `${textColor}44`,
              }}
            />
            <span
              style={{
                fontSize: 'clamp(9px, 1.3vw, 13px)',
                fontWeight: 700,
                color: `${textColor}aa`,
                fontVariantNumeric: 'tabular-nums',
              }}
            >
              {gameTime}
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}

registerMotionGraphic({
  id: 'tpl-scene-sports-score',
  title: 'Sports Score Overlay',
  description: 'Sports score overlay with two team names, colors, animated score counter, game time/period, slide-in from bottom',
  tags: ['scene', 'sports', 'score', 'teams', 'broadcast', 'media', 'overlay', 'game'],
  category: 'scene-layout',
  component: SceneSportsScoreComponent as any,
  defaultConfig: {
    team1Name: 'EAGLES',
    team2Name: 'LIONS',
    team1Score: 24,
    team2Score: 17,
    team1Color: '#004C54',
    team2Color: '#0076B6',
    gameTime: '8:42',
    period: '3RD QUARTER',
    bgColor: '#111827',
    textColor: '#FFFFFF',
  },
  configSchema: [
    { key: 'team1Name', label: 'Team 1 Name', type: 'text', defaultValue: 'EAGLES', group: 'Content' },
    { key: 'team2Name', label: 'Team 2 Name', type: 'text', defaultValue: 'LIONS', group: 'Content' },
    { key: 'team1Score', label: 'Team 1 Score', type: 'number', defaultValue: 24, min: 0, max: 999, group: 'Content' },
    { key: 'team2Score', label: 'Team 2 Score', type: 'number', defaultValue: 17, min: 0, max: 999, group: 'Content' },
    { key: 'team1Color', label: 'Team 1 Color', type: 'color', defaultValue: '#004C54', group: 'Style' },
    { key: 'team2Color', label: 'Team 2 Color', type: 'color', defaultValue: '#0076B6', group: 'Style' },
    { key: 'gameTime', label: 'Game Time', type: 'text', defaultValue: '8:42', group: 'Content' },
    { key: 'period', label: 'Period', type: 'text', defaultValue: '3RD QUARTER', group: 'Content' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#111827', group: 'Style' },
    { key: 'textColor', label: 'Text Color', type: 'color', defaultValue: '#FFFFFF', group: 'Style' },
  ],
})
