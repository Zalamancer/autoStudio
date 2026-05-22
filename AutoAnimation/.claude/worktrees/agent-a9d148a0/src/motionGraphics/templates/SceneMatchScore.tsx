import React from 'react'
import { registerMotionGraphic } from '../registry'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface SceneMatchScoreConfig {
  team1Name: string
  team2Name: string
  team1Score: number
  team2Score: number
  matchTime: string
  sportLabel: string
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

function SceneMatchScoreComponent({ config, progress }: MotionGraphicProps<SceneMatchScoreConfig>) {
  const { team1Name, team2Name, team1Score, team2Score, matchTime, sportLabel, bgColor, accentColor, team1Color, team2Color, textColor } = config

  const enterProgress = progress < 0.2 ? progress / 0.2 : 1
  const holdProgress = progress >= 0.2 && progress < 0.8 ? (progress - 0.2) / 0.6 : progress >= 0.8 ? 1 : 0
  const exitProgress = progress >= 0.8 ? (progress - 0.8) / 0.2 : 0

  // Teams slide from sides
  const team1Slide = easeOutCubic(Math.min(1, enterProgress / 0.6))
  const team2Slide = easeOutCubic(Math.max(0, Math.min(1, (enterProgress - 0.1) / 0.6)))

  // Score counts up
  const scoreReveal = easeOutCubic(Math.max(0, Math.min(1, (enterProgress - 0.3) / 0.5)))
  const displayScore1 = Math.round(team1Score * scoreReveal)
  const displayScore2 = Math.round(team2Score * scoreReveal)

  // Score pop on entry
  const scorePop = easeOutBack(Math.max(0, Math.min(1, (enterProgress - 0.4) / 0.4)))

  // Time ticks during hold
  const isHolding = progress >= 0.2 && progress < 0.8
  const timePulse = isHolding ? 0.7 + Math.sin(holdProgress * Math.PI * 8) * 0.3 : 1

  // Exit
  const exitEased = easeInCubic(exitProgress)
  const exitOpacity = 1 - exitEased
  const exitSlide = exitEased * 60

  // Sport label fade
  const labelReveal = easeOutCubic(Math.max(0, Math.min(1, (enterProgress - 0.5) / 0.3)))

  return (
    <div style={{ position: 'absolute', inset: 0, overflow: 'hidden' }}>
      <div style={{ position: 'absolute', inset: 0, background: bgColor }} />

      {/* Diagonal split background */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '55%',
          height: '100%',
          background: `${team1Color}12`,
          clipPath: 'polygon(0 0, 100% 0, 85% 100%, 0 100%)',
          opacity: team1Slide,
        }}
      />
      <div
        style={{
          position: 'absolute',
          top: 0,
          right: 0,
          width: '55%',
          height: '100%',
          background: `${team2Color}12`,
          clipPath: 'polygon(15% 0, 100% 0, 100% 100%, 0 100%)',
          opacity: team2Slide,
        }}
      />

      {/* Top accent bar */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: 4,
          background: `linear-gradient(90deg, ${team1Color}, ${accentColor}, ${team2Color})`,
          opacity: enterProgress,
        }}
      />

      {/* Sport label */}
      <div
        style={{
          position: 'absolute',
          top: '8%',
          left: '50%',
          transform: 'translateX(-50%)',
          fontFamily: "'Inter', 'Helvetica Neue', sans-serif",
          fontSize: 'clamp(8px, 1.3vw, 12px)',
          fontWeight: 800,
          color: accentColor,
          textTransform: 'uppercase',
          letterSpacing: '0.25em',
          opacity: labelReveal,
          background: `${accentColor}15`,
          padding: 'clamp(3px, 0.5vw, 6px) clamp(10px, 2vw, 20px)',
          borderRadius: 20,
          border: `1px solid ${accentColor}30`,
        }}
      >
        {sportLabel}
      </div>

      {/* Main content */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          opacity: exitOpacity,
          transform: `translateY(${exitSlide}px)`,
        }}
      >
        {/* Team 1 */}
        <div
          style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            opacity: team1Slide,
            transform: `translateX(${(1 - team1Slide) * -80}px)`,
          }}
        >
          <div
            style={{
              width: 'clamp(40px, 8vw, 70px)',
              height: 'clamp(40px, 8vw, 70px)',
              borderRadius: '50%',
              background: `linear-gradient(135deg, ${team1Color}, ${team1Color}80)`,
              marginBottom: 'clamp(6px, 1.2vw, 12px)',
              boxShadow: `0 4px 20px ${team1Color}40`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontFamily: "'Inter', sans-serif",
              fontSize: 'clamp(14px, 2.5vw, 24px)',
              fontWeight: 900,
              color: '#fff',
            }}
          >
            {team1Name.charAt(0)}
          </div>
          <div
            style={{
              fontFamily: "'Inter', 'Helvetica Neue', sans-serif",
              fontSize: 'clamp(12px, 2.2vw, 20px)',
              fontWeight: 800,
              color: textColor,
              textTransform: 'uppercase',
              letterSpacing: '0.06em',
            }}
          >
            {team1Name}
          </div>
        </div>

        {/* Scores */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 'clamp(8px, 2vw, 20px)',
            transform: `scale(${scorePop})`,
          }}
        >
          <div
            style={{
              fontFamily: "'Inter', 'Helvetica Neue', sans-serif",
              fontSize: 'clamp(50px, 14vw, 120px)',
              fontWeight: 900,
              color: textColor,
              lineHeight: 1,
              textShadow: `0 0 30px ${team1Color}40`,
            }}
          >
            {displayScore1}
          </div>
          <div
            style={{
              fontFamily: "'Inter', sans-serif",
              fontSize: 'clamp(24px, 5vw, 44px)',
              fontWeight: 300,
              color: `${textColor}40`,
              lineHeight: 1,
            }}
          >
            -
          </div>
          <div
            style={{
              fontFamily: "'Inter', 'Helvetica Neue', sans-serif",
              fontSize: 'clamp(50px, 14vw, 120px)',
              fontWeight: 900,
              color: textColor,
              lineHeight: 1,
              textShadow: `0 0 30px ${team2Color}40`,
            }}
          >
            {displayScore2}
          </div>
        </div>

        {/* Team 2 */}
        <div
          style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            opacity: team2Slide,
            transform: `translateX(${(1 - team2Slide) * 80}px)`,
          }}
        >
          <div
            style={{
              width: 'clamp(40px, 8vw, 70px)',
              height: 'clamp(40px, 8vw, 70px)',
              borderRadius: '50%',
              background: `linear-gradient(135deg, ${team2Color}, ${team2Color}80)`,
              marginBottom: 'clamp(6px, 1.2vw, 12px)',
              boxShadow: `0 4px 20px ${team2Color}40`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontFamily: "'Inter', sans-serif",
              fontSize: 'clamp(14px, 2.5vw, 24px)',
              fontWeight: 900,
              color: '#fff',
            }}
          >
            {team2Name.charAt(0)}
          </div>
          <div
            style={{
              fontFamily: "'Inter', 'Helvetica Neue', sans-serif",
              fontSize: 'clamp(12px, 2.2vw, 20px)',
              fontWeight: 800,
              color: textColor,
              textTransform: 'uppercase',
              letterSpacing: '0.06em',
            }}
          >
            {team2Name}
          </div>
        </div>
      </div>

      {/* Match time / period */}
      <div
        style={{
          position: 'absolute',
          bottom: '10%',
          left: '50%',
          transform: 'translateX(-50%)',
          fontFamily: "'Inter', 'Helvetica Neue', sans-serif",
          fontSize: 'clamp(11px, 1.8vw, 16px)',
          fontWeight: 700,
          color: accentColor,
          letterSpacing: '0.1em',
          opacity: labelReveal * exitOpacity * timePulse,
          display: 'flex',
          alignItems: 'center',
          gap: 'clamp(4px, 1vw, 10px)',
        }}
      >
        <div
          style={{
            width: 6,
            height: 6,
            borderRadius: '50%',
            background: '#ff3b3b',
            boxShadow: '0 0 8px #ff3b3b80',
          }}
        />
        {matchTime}
      </div>
    </div>
  )
}

registerMotionGraphic({
  id: 'tpl-scene-match-score',
  title: 'Live Match Score',
  description: 'Live match score overlay with team names, colors, large score, match time/period. Bold sports broadcast look with animated counters.',
  tags: ['scene', 'sports', 'score', 'match', 'live', 'broadcast', 'athletics'],
  category: 'scene-layout',
  component: SceneMatchScoreComponent as any,
  defaultConfig: {
    team1Name: 'EAGLES',
    team2Name: 'LIONS',
    team1Score: 3,
    team2Score: 1,
    matchTime: '72:34 \u2022 2ND HALF',
    sportLabel: 'PREMIER LEAGUE \u2022 MATCHDAY 12',
    bgColor: '#0a0e1a',
    accentColor: '#00e5ff',
    team1Color: '#1e88e5',
    team2Color: '#ff6d00',
    textColor: '#ffffff',
  },
  configSchema: [
    { key: 'team1Name', label: 'Team 1 Name', type: 'text', defaultValue: 'EAGLES', group: 'Content' },
    { key: 'team2Name', label: 'Team 2 Name', type: 'text', defaultValue: 'LIONS', group: 'Content' },
    { key: 'team1Score', label: 'Team 1 Score', type: 'number', defaultValue: 3, min: 0, max: 999, group: 'Content' },
    { key: 'team2Score', label: 'Team 2 Score', type: 'number', defaultValue: 1, min: 0, max: 999, group: 'Content' },
    { key: 'matchTime', label: 'Match Time', type: 'text', defaultValue: '72:34 \u2022 2ND HALF', group: 'Content' },
    { key: 'sportLabel', label: 'Sport / League', type: 'text', defaultValue: 'PREMIER LEAGUE \u2022 MATCHDAY 12', group: 'Content' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#0a0e1a', group: 'Style' },
    { key: 'accentColor', label: 'Accent', type: 'color', defaultValue: '#00e5ff', group: 'Style' },
    { key: 'team1Color', label: 'Team 1 Color', type: 'color', defaultValue: '#1e88e5', group: 'Style' },
    { key: 'team2Color', label: 'Team 2 Color', type: 'color', defaultValue: '#ff6d00', group: 'Style' },
    { key: 'textColor', label: 'Text Color', type: 'color', defaultValue: '#ffffff', group: 'Style' },
  ],
})
