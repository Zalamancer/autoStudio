import React from 'react'
import { registerMotionGraphic } from '../registry'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface RetroScoreboardConfig {
  player1Name: string
  player2Name: string
  player1Score: number
  player2Score: number
  round: string
  bgColor: string
  p1Color: string
  p2Color: string
  textColor: string
  borderColor: string
}

function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3)
}

function SceneRetroScoreboardComponent({ config, frame, fps, progress }: MotionGraphicProps<RetroScoreboardConfig>) {
  const { player1Name, player2Name, player1Score, player2Score, round, bgColor, p1Color, p2Color, textColor, borderColor } = config
  const time = frame / fps

  const enterProgress = progress < 0.12 ? progress / 0.12 : 1
  const exitProgress = progress > 0.88 ? (progress - 0.88) / 0.12 : 0
  const mainOpacity = easeOutCubic(enterProgress) * (1 - easeOutCubic(exitProgress))

  // Score count-up
  const scoreReveal = progress < 0.35 ? Math.max(0, (progress - 0.12) / 0.23) : 1
  const displayP1 = Math.floor(player1Score * easeOutCubic(scoreReveal))
  const displayP2 = Math.floor(player2Score * easeOutCubic(scoreReveal))

  // Winner highlight
  const winner = player1Score > player2Score ? 1 : player2Score > player1Score ? 2 : 0
  const winnerBlink = Math.floor(time * 3) % 2 === 0

  // VS pulse
  const vsPulse = 1 + Math.sin(time * 5) * 0.08

  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        background: bgColor,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
        fontFamily: "'Courier New', 'Lucida Console', monospace",
        opacity: mainOpacity,
      }}
    >
      {/* CRT scan lines */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.1) 2px, rgba(0,0,0,0.1) 4px)',
          pointerEvents: 'none',
          zIndex: 10,
        }}
      />

      {/* Round indicator */}
      <div
        style={{
          fontSize: 'clamp(11px, 2vw, 18px)',
          fontWeight: 700,
          color: `${textColor}88`,
          textTransform: 'uppercase',
          letterSpacing: 4,
          marginBottom: 'clamp(4px, 1vw, 10px)',
          transform: `translateY(${(1 - easeOutCubic(enterProgress)) * -15}px)`,
        }}
      >
        {`ROUND ${round}`}
      </div>

      {/* Main scoreboard frame */}
      <div
        style={{
          width: 'clamp(280px, 70vw, 520px)',
          border: `3px solid ${borderColor}`,
          background: `${borderColor}08`,
          padding: 'clamp(10px, 2vw, 20px)',
          imageRendering: 'pixelated' as any,
          position: 'relative',
        }}
      >
        {/* Pixel corner accents */}
        {[0, 1, 2, 3].map((c) => (
          <div
            key={c}
            style={{
              position: 'absolute',
              [c < 2 ? 'top' : 'bottom']: -3,
              [c % 2 === 0 ? 'left' : 'right']: -3,
              width: 8,
              height: 8,
              background: borderColor,
              imageRendering: 'pixelated' as any,
            }}
          />
        ))}

        {/* Players row */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          {/* Player 1 */}
          <div
            style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 'clamp(4px, 0.8vw, 8px)',
            }}
          >
            {/* Player indicator */}
            <div
              style={{
                fontSize: 'clamp(9px, 1.5vw, 12px)',
                color: p1Color,
                letterSpacing: 2,
                opacity: winner === 1 && winnerBlink ? 1 : 0.7,
              }}
            >
              {'P1'}
            </div>
            {/* Name */}
            <div
              style={{
                fontSize: 'clamp(14px, 3vw, 26px)',
                fontWeight: 700,
                color: p1Color,
                textTransform: 'uppercase',
                letterSpacing: 2,
                textShadow: winner === 1 ? `0 0 8px ${p1Color}60` : 'none',
              }}
            >
              {player1Name}
            </div>
            {/* Score */}
            <div
              style={{
                fontSize: 'clamp(32px, 8vw, 72px)',
                fontWeight: 700,
                color: winner === 1 && winnerBlink ? p1Color : textColor,
                textShadow: winner === 1 ? `0 0 12px ${p1Color}80` : 'none',
                lineHeight: 1,
              }}
            >
              {String(displayP1).padStart(2, '0')}
            </div>
            {/* Win indicator */}
            {winner === 1 && scoreReveal >= 1 && (
              <div
                style={{
                  fontSize: 'clamp(9px, 1.5vw, 13px)',
                  color: p1Color,
                  fontWeight: 700,
                  letterSpacing: 3,
                  opacity: winnerBlink ? 1 : 0.3,
                }}
              >
                {'WIN'}
              </div>
            )}
          </div>

          {/* VS divider */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              padding: '0 clamp(8px, 1.5vw, 16px)',
            }}
          >
            <div
              style={{
                width: 2,
                height: 'clamp(20px, 4vw, 40px)',
                background: `${borderColor}40`,
                marginBottom: 6,
              }}
            />
            <div
              style={{
                fontSize: 'clamp(16px, 3.5vw, 30px)',
                fontWeight: 700,
                color: borderColor,
                transform: `scale(${vsPulse})`,
                letterSpacing: 2,
              }}
            >
              {'VS'}
            </div>
            <div
              style={{
                width: 2,
                height: 'clamp(20px, 4vw, 40px)',
                background: `${borderColor}40`,
                marginTop: 6,
              }}
            />
          </div>

          {/* Player 2 */}
          <div
            style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 'clamp(4px, 0.8vw, 8px)',
            }}
          >
            <div
              style={{
                fontSize: 'clamp(9px, 1.5vw, 12px)',
                color: p2Color,
                letterSpacing: 2,
                opacity: winner === 2 && winnerBlink ? 1 : 0.7,
              }}
            >
              {'P2'}
            </div>
            <div
              style={{
                fontSize: 'clamp(14px, 3vw, 26px)',
                fontWeight: 700,
                color: p2Color,
                textTransform: 'uppercase',
                letterSpacing: 2,
                textShadow: winner === 2 ? `0 0 8px ${p2Color}60` : 'none',
              }}
            >
              {player2Name}
            </div>
            <div
              style={{
                fontSize: 'clamp(32px, 8vw, 72px)',
                fontWeight: 700,
                color: winner === 2 && winnerBlink ? p2Color : textColor,
                textShadow: winner === 2 ? `0 0 12px ${p2Color}80` : 'none',
                lineHeight: 1,
              }}
            >
              {String(displayP2).padStart(2, '0')}
            </div>
            {winner === 2 && scoreReveal >= 1 && (
              <div
                style={{
                  fontSize: 'clamp(9px, 1.5vw, 13px)',
                  color: p2Color,
                  fontWeight: 700,
                  letterSpacing: 3,
                  opacity: winnerBlink ? 1 : 0.3,
                }}
              >
                {'WIN'}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Bottom ticker dots */}
      <div
        style={{
          display: 'flex',
          gap: 6,
          marginTop: 'clamp(12px, 2vw, 20px)',
        }}
      >
        {Array.from({ length: 8 }, (_, i) => (
          <div
            key={i}
            style={{
              width: 4,
              height: 4,
              background: borderColor,
              opacity: Math.floor(time * 4 + i * 0.3) % 3 === 0 ? 0.6 : 0.15,
              imageRendering: 'pixelated' as any,
            }}
          />
        ))}
      </div>

      {/* Vignette */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: 'radial-gradient(ellipse at center, transparent 55%, rgba(0,0,0,0.4) 100%)',
          pointerEvents: 'none',
        }}
      />
    </div>
  )
}

registerMotionGraphic({
  id: 'tpl-scene-retro-scoreboard',
  title: 'Scene Retro Scoreboard',
  description: 'Classic arcade VS scoreboard with score count-up animation, winner highlight blink, pixel corners, and CRT styling',
  tags: ['scene', 'scoreboard', 'retro', 'arcade', 'VS', 'gaming', 'pixel', 'versus'],
  category: 'scene-layout',
  component: SceneRetroScoreboardComponent as unknown as React.ComponentType<MotionGraphicProps>,
  defaultConfig: {
    player1Name: 'HERO',
    player2Name: 'RIVAL',
    player1Score: 15,
    player2Score: 12,
    round: '3',
    bgColor: '#0a0a14',
    p1Color: '#FF4444',
    p2Color: '#4488FF',
    textColor: '#FFFFFF',
    borderColor: '#888888',
  },
  configSchema: [
    { key: 'player1Name', label: 'Player 1', type: 'text', defaultValue: 'HERO', group: 'Content' },
    { key: 'player2Name', label: 'Player 2', type: 'text', defaultValue: 'RIVAL', group: 'Content' },
    { key: 'player1Score', label: 'P1 Score', type: 'number', defaultValue: 15, min: 0, max: 999, group: 'Content' },
    { key: 'player2Score', label: 'P2 Score', type: 'number', defaultValue: 12, min: 0, max: 999, group: 'Content' },
    { key: 'round', label: 'Round', type: 'text', defaultValue: '3', group: 'Content' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#0a0a14', group: 'Style' },
    { key: 'p1Color', label: 'P1 Color', type: 'color', defaultValue: '#FF4444', group: 'Style' },
    { key: 'p2Color', label: 'P2 Color', type: 'color', defaultValue: '#4488FF', group: 'Style' },
    { key: 'textColor', label: 'Text Color', type: 'color', defaultValue: '#FFFFFF', group: 'Style' },
    { key: 'borderColor', label: 'Border Color', type: 'color', defaultValue: '#888888', group: 'Style' },
  ],
})
