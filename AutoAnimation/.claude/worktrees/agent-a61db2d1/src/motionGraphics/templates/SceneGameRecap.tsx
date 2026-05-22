import React from 'react'
import { registerMotionGraphic } from '../registry'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface SceneGameRecapConfig {
  team1Name: string
  team2Name: string
  team1Score: number
  team2Score: number
  keyPlay: string
  mvpName: string
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

function SceneGameRecapComponent({ config, progress }: MotionGraphicProps<SceneGameRecapConfig>) {
  const { team1Name, team2Name, team1Score, team2Score, keyPlay, mvpName, bgColor, accentColor, team1Color, team2Color, textColor } = config

  const enterProgress = progress < 0.25 ? progress / 0.25 : 1
  const holdProgress = progress >= 0.25 && progress < 0.8 ? (progress - 0.25) / 0.55 : progress >= 0.8 ? 1 : 0
  const exitProgress = progress >= 0.8 ? (progress - 0.8) / 0.2 : 0

  // "FINAL" stamp in
  const finalStamp = easeOutBack(Math.min(1, enterProgress / 0.4))

  // Scores reveal
  const scoreReveal = easeOutCubic(Math.max(0, Math.min(1, (enterProgress - 0.2) / 0.4)))
  const displayScore1 = Math.round(team1Score * scoreReveal)
  const displayScore2 = Math.round(team2Score * scoreReveal)

  // Key play text
  const playReveal = easeOutCubic(Math.max(0, Math.min(1, (enterProgress - 0.5) / 0.3)))

  // MVP reveal
  const mvpReveal = easeOutCubic(Math.max(0, Math.min(1, (enterProgress - 0.7) / 0.3)))

  // Winner indicator
  const winnerSide = team1Score > team2Score ? 1 : team2Score > team1Score ? 2 : 0
  const winnerColor = winnerSide === 1 ? team1Color : winnerSide === 2 ? team2Color : accentColor

  // Hold: winner glow
  const isHolding = progress >= 0.25 && progress < 0.8
  const glowPulse = isHolding ? 0.6 + Math.sin(holdProgress * Math.PI * 4) * 0.4 : 1

  // Exit
  const exitEased = easeInCubic(exitProgress)
  const exitOpacity = 1 - exitEased
  const exitSlide = exitEased * 50

  return (
    <div style={{ position: 'absolute', inset: 0, overflow: 'hidden' }}>
      <div style={{ position: 'absolute', inset: 0, background: bgColor }} />

      {/* Subtle radial glow for winner */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: `radial-gradient(ellipse at center, ${winnerColor}10, transparent 70%)`,
          opacity: scoreReveal * glowPulse,
        }}
      />

      {/* Main content */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '6%',
          opacity: exitOpacity,
          transform: `translateY(${exitSlide}px)`,
        }}
      >
        {/* FINAL stamp */}
        <div
          style={{
            fontFamily: "'Inter', 'Helvetica Neue', sans-serif",
            fontSize: 'clamp(10px, 1.6vw, 14px)',
            fontWeight: 900,
            color: bgColor,
            background: accentColor,
            padding: 'clamp(4px, 0.8vw, 8px) clamp(16px, 3vw, 32px)',
            borderRadius: 'clamp(3px, 0.5vw, 5px)',
            letterSpacing: '0.3em',
            textTransform: 'uppercase',
            transform: `scale(${finalStamp})`,
            boxShadow: `0 4px 20px ${accentColor}40`,
            marginBottom: 'clamp(16px, 3vw, 30px)',
          }}
        >
          FINAL SCORE
        </div>

        {/* Score section */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 'clamp(16px, 4vw, 40px)',
            marginBottom: 'clamp(16px, 3vw, 30px)',
          }}
        >
          {/* Team 1 */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 'clamp(4px, 0.8vw, 8px)',
              opacity: scoreReveal,
            }}
          >
            <div
              style={{
                fontFamily: "'Inter', 'Helvetica Neue', sans-serif",
                fontSize: 'clamp(11px, 1.8vw, 16px)',
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
                fontSize: 'clamp(44px, 12vw, 96px)',
                fontWeight: 900,
                color: textColor,
                lineHeight: 1,
                textShadow: winnerSide === 1 ? `0 0 30px ${team1Color}50` : 'none',
              }}
            >
              {displayScore1}
            </div>
            {winnerSide === 1 && (
              <div
                style={{
                  fontFamily: "'Inter', sans-serif",
                  fontSize: 'clamp(8px, 1.1vw, 10px)',
                  fontWeight: 800,
                  color: bgColor,
                  background: team1Color,
                  padding: '2px 10px',
                  borderRadius: 10,
                  opacity: scoreReveal,
                  letterSpacing: '0.1em',
                }}
              >
                WIN
              </div>
            )}
          </div>

          {/* Divider */}
          <div
            style={{
              fontFamily: "'Inter', sans-serif",
              fontSize: 'clamp(20px, 4vw, 36px)',
              fontWeight: 300,
              color: `${textColor}30`,
              opacity: scoreReveal,
            }}
          >
            -
          </div>

          {/* Team 2 */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 'clamp(4px, 0.8vw, 8px)',
              opacity: scoreReveal,
            }}
          >
            <div
              style={{
                fontFamily: "'Inter', 'Helvetica Neue', sans-serif",
                fontSize: 'clamp(11px, 1.8vw, 16px)',
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
                fontSize: 'clamp(44px, 12vw, 96px)',
                fontWeight: 900,
                color: textColor,
                lineHeight: 1,
                textShadow: winnerSide === 2 ? `0 0 30px ${team2Color}50` : 'none',
              }}
            >
              {displayScore2}
            </div>
            {winnerSide === 2 && (
              <div
                style={{
                  fontFamily: "'Inter', sans-serif",
                  fontSize: 'clamp(8px, 1.1vw, 10px)',
                  fontWeight: 800,
                  color: bgColor,
                  background: team2Color,
                  padding: '2px 10px',
                  borderRadius: 10,
                  opacity: scoreReveal,
                  letterSpacing: '0.1em',
                }}
              >
                WIN
              </div>
            )}
          </div>
        </div>

        {/* Divider line */}
        <div
          style={{
            width: `${playReveal * 70}%`,
            maxWidth: 320,
            height: 1,
            background: `${textColor}20`,
            marginBottom: 'clamp(10px, 2vw, 20px)',
          }}
        />

        {/* Key play summary */}
        <div
          style={{
            fontFamily: "'Inter', 'Helvetica Neue', sans-serif",
            fontSize: 'clamp(10px, 1.6vw, 14px)',
            fontWeight: 500,
            color: `${textColor}90`,
            textAlign: 'center',
            lineHeight: 1.5,
            maxWidth: '80%',
            opacity: playReveal,
            transform: `translateY(${(1 - playReveal) * 10}px)`,
            marginBottom: 'clamp(10px, 2vw, 18px)',
          }}
        >
          {keyPlay}
        </div>

        {/* MVP */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 'clamp(6px, 1.2vw, 12px)',
            opacity: mvpReveal,
            transform: `translateY(${(1 - mvpReveal) * 10}px)`,
          }}
        >
          <div
            style={{
              fontFamily: "'Inter', sans-serif",
              fontSize: 'clamp(8px, 1.2vw, 10px)',
              fontWeight: 700,
              color: accentColor,
              textTransform: 'uppercase',
              letterSpacing: '0.2em',
            }}
          >
            MVP
          </div>
          <div
            style={{
              width: 'clamp(16px, 3vw, 24px)',
              height: 1,
              background: accentColor,
            }}
          />
          <div
            style={{
              fontFamily: "'Inter', 'Helvetica Neue', sans-serif",
              fontSize: 'clamp(12px, 2vw, 18px)',
              fontWeight: 800,
              color: textColor,
              textTransform: 'uppercase',
            }}
          >
            {mvpName}
          </div>
        </div>
      </div>
    </div>
  )
}

registerMotionGraphic({
  id: 'tpl-scene-game-recap',
  title: 'Game Recap',
  description: 'Post-game recap card with FINAL SCORE stamp, team scores, key play summary, and MVP name. Sports broadcast summary style.',
  tags: ['scene', 'sports', 'recap', 'final-score', 'post-game', 'summary', 'athletics'],
  category: 'scene-layout',
  component: SceneGameRecapComponent as any,
  defaultConfig: {
    team1Name: 'CELTICS',
    team2Name: 'LAKERS',
    team1Score: 112,
    team2Score: 104,
    keyPlay: 'Marcus Smart hit a clutch 3-pointer with 12 seconds left to seal the victory',
    mvpName: 'JAYSON TATUM',
    bgColor: '#0a0e18',
    accentColor: '#fbbf24',
    team1Color: '#00a651',
    team2Color: '#552583',
    textColor: '#ffffff',
  },
  configSchema: [
    { key: 'team1Name', label: 'Team 1', type: 'text', defaultValue: 'CELTICS', group: 'Content' },
    { key: 'team2Name', label: 'Team 2', type: 'text', defaultValue: 'LAKERS', group: 'Content' },
    { key: 'team1Score', label: 'Team 1 Score', type: 'number', defaultValue: 112, min: 0, max: 999, group: 'Content' },
    { key: 'team2Score', label: 'Team 2 Score', type: 'number', defaultValue: 104, min: 0, max: 999, group: 'Content' },
    { key: 'keyPlay', label: 'Key Play', type: 'text', defaultValue: 'Marcus Smart hit a clutch 3-pointer with 12 seconds left to seal the victory', group: 'Content' },
    { key: 'mvpName', label: 'MVP Name', type: 'text', defaultValue: 'JAYSON TATUM', group: 'Content' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#0a0e18', group: 'Style' },
    { key: 'accentColor', label: 'Accent', type: 'color', defaultValue: '#fbbf24', group: 'Style' },
    { key: 'team1Color', label: 'Team 1 Color', type: 'color', defaultValue: '#00a651', group: 'Style' },
    { key: 'team2Color', label: 'Team 2 Color', type: 'color', defaultValue: '#552583', group: 'Style' },
    { key: 'textColor', label: 'Text Color', type: 'color', defaultValue: '#ffffff', group: 'Style' },
  ],
})
