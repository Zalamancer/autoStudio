import React from 'react'
import { registerMotionGraphic } from '../registry'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface SceneVersusScreenConfig {
  player1: string
  player2: string
  bgColor: string
  player1Color: string
  player2Color: string
  vsColor: string
  textColor: string
}

function easeOutCubic(t: number): number { return 1 - Math.pow(1 - t, 3) }
function easeInCubic(t: number): number { return t * t * t }
function easeOutElastic(t: number): number {
  if (t === 0 || t === 1) return t
  return Math.pow(2, -10 * t) * Math.sin((t - 0.075) * (2 * Math.PI) / 0.3) + 1
}
function easeOutBack(t: number): number {
  const c1 = 1.70158
  const c3 = c1 + 1
  return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2)
}

function SceneVersusScreenComponent({ config, progress }: MotionGraphicProps<SceneVersusScreenConfig>) {
  const { player1, player2, bgColor, player1Color, player2Color, vsColor, textColor } = config

  const enterProgress = progress < 0.3 ? progress / 0.3 : 1
  const holdProgress = progress >= 0.3 && progress < 0.8 ? (progress - 0.3) / 0.5 : progress >= 0.8 ? 1 : 0
  const exitProgress = progress >= 0.8 ? (progress - 0.8) / 0.2 : 0

  // Player 1 slides from left
  const p1Slide = easeOutCubic(Math.min(1, enterProgress / 0.4))
  const p1X = (1 - p1Slide) * -120

  // Player 2 slides from right
  const p2Slide = easeOutCubic(Math.max(0, Math.min(1, (enterProgress - 0.05) / 0.4)))
  const p2X = (1 - p2Slide) * 120

  // VS slam in center
  const vsDelay = 0.35
  const vsProgress = Math.max(0, Math.min(1, (enterProgress - vsDelay) / 0.4))
  const vsScale = easeOutElastic(vsProgress)
  const vsOpacity = easeOutCubic(Math.min(1, vsProgress * 3))

  // VS flash on slam
  const vsFlash = vsProgress > 0.2 && vsProgress < 0.5
    ? Math.sin(((vsProgress - 0.2) / 0.3) * Math.PI) * 0.3
    : 0

  // Energy lines radiating from center during hold
  const isHolding = progress >= 0.3 && progress < 0.8
  const energyCount = 8
  const energyLines = Array.from({ length: energyCount }, (_, i) => {
    const angle = (i / energyCount) * Math.PI * 2
    const time = holdProgress * 4 + i * 0.5
    const length = isHolding ? 40 + Math.sin(time * 2) * 20 : 0
    const alpha = isHolding ? 0.2 + Math.sin(time * 3) * 0.15 : 0
    return { angle, length, alpha }
  })

  // VS glow pulse
  const vsPulse = isHolding ? 0.6 + Math.sin(holdProgress * Math.PI * 6) * 0.4 : 1

  // Diagonal split line
  const splitReveal = easeOutCubic(Math.max(0, Math.min(1, (enterProgress - 0.1) / 0.3)))

  // Exit
  const exitEased = easeInCubic(exitProgress)
  const exitOpacity = 1 - exitEased
  const exitP1X = exitEased * -100
  const exitP2X = exitEased * 100
  const exitVsScale = 1 - exitEased * 0.5

  return (
    <div style={{ position: 'absolute', inset: 0, overflow: 'hidden' }}>
      <div style={{ position: 'absolute', inset: 0, background: bgColor }} />

      {/* Diagonal split */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: '50%',
          width: 3,
          height: '100%',
          background: `${vsColor}40`,
          transform: `rotate(15deg) scaleY(${splitReveal})`,
          transformOrigin: 'center',
          boxShadow: `0 0 12px ${vsColor}30`,
          opacity: exitOpacity,
        }}
      />

      {/* Player 1 side - left half colored background */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '50%',
          height: '100%',
          background: `linear-gradient(135deg, ${player1Color}15, transparent)`,
          opacity: p1Slide * exitOpacity,
        }}
      />

      {/* Player 2 side - right half colored background */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          right: 0,
          width: '50%',
          height: '100%',
          background: `linear-gradient(225deg, ${player2Color}15, transparent)`,
          opacity: p2Slide * exitOpacity,
        }}
      />

      {/* Energy lines from center */}
      {energyLines.map((line, i) => (
        <div
          key={i}
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            width: line.length,
            height: 2,
            background: `linear-gradient(90deg, ${vsColor}, transparent)`,
            transformOrigin: '0 50%',
            transform: `rotate(${line.angle}rad)`,
            opacity: line.alpha,
            boxShadow: `0 0 4px ${vsColor}60`,
            pointerEvents: 'none',
          }}
        />
      ))}

      {/* Flash overlay */}
      {vsFlash > 0 && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: vsColor,
            opacity: vsFlash,
            pointerEvents: 'none',
          }}
        />
      )}

      {/* Player 1 */}
      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: '22%',
          transform: `translate(-50%, -50%) translateX(${p1X + exitP1X}px)`,
          opacity: p1Slide * exitOpacity,
          textAlign: 'center',
        }}
      >
        {/* Player icon */}
        <div
          style={{
            width: 'clamp(50px, 12vw, 80px)',
            height: 'clamp(50px, 12vw, 80px)',
            borderRadius: 'clamp(10px, 2vw, 16px)',
            background: `linear-gradient(135deg, ${player1Color}40, ${player1Color}20)`,
            border: `2px solid ${player1Color}60`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto',
            fontSize: 'clamp(24px, 6vw, 40px)',
            boxShadow: `0 0 20px ${player1Color}30`,
          }}
        >
          {'\u{1F3AE}'}
        </div>
        <div
          style={{
            fontFamily: "'Inter', 'Helvetica Neue', sans-serif",
            fontSize: 'clamp(14px, 3vw, 24px)',
            fontWeight: 900,
            color: textColor,
            textTransform: 'uppercase',
            letterSpacing: '0.06em',
            marginTop: 'clamp(8px, 1.5vw, 14px)',
            textShadow: `0 0 10px ${player1Color}40`,
          }}
        >
          {player1}
        </div>
      </div>

      {/* VS text */}
      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: `translate(-50%, -50%) scale(${vsScale * exitVsScale})`,
          opacity: vsOpacity * exitOpacity,
        }}
      >
        <div
          style={{
            fontFamily: "'Inter', 'Helvetica Neue', sans-serif",
            fontSize: 'clamp(40px, 12vw, 90px)',
            fontWeight: 900,
            color: vsColor,
            lineHeight: 1,
            textShadow: `0 0 ${20 * vsPulse}px ${vsColor}80, 0 0 ${40 * vsPulse}px ${vsColor}30`,
            letterSpacing: '0.1em',
          }}
        >
          VS
        </div>
      </div>

      {/* Player 2 */}
      <div
        style={{
          position: 'absolute',
          top: '50%',
          right: '22%',
          transform: `translate(50%, -50%) translateX(${p2X + exitP2X}px)`,
          opacity: p2Slide * exitOpacity,
          textAlign: 'center',
        }}
      >
        {/* Player icon */}
        <div
          style={{
            width: 'clamp(50px, 12vw, 80px)',
            height: 'clamp(50px, 12vw, 80px)',
            borderRadius: 'clamp(10px, 2vw, 16px)',
            background: `linear-gradient(135deg, ${player2Color}40, ${player2Color}20)`,
            border: `2px solid ${player2Color}60`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto',
            fontSize: 'clamp(24px, 6vw, 40px)',
            boxShadow: `0 0 20px ${player2Color}30`,
          }}
        >
          {'\u{1F3AE}'}
        </div>
        <div
          style={{
            fontFamily: "'Inter', 'Helvetica Neue', sans-serif",
            fontSize: 'clamp(14px, 3vw, 24px)',
            fontWeight: 900,
            color: textColor,
            textTransform: 'uppercase',
            letterSpacing: '0.06em',
            marginTop: 'clamp(8px, 1.5vw, 14px)',
            textShadow: `0 0 10px ${player2Color}40`,
          }}
        >
          {player2}
        </div>
      </div>
    </div>
  )
}

registerMotionGraphic({
  id: 'tpl-scene-versus-screen',
  title: 'Versus Screen',
  description: 'Fighting game "VS" screen with two sides, player names, animated "VS" with energy effect in center',
  tags: ['scene', 'gaming', 'versus', 'vs', 'fighting', 'battle', 'pvp'],
  category: 'scene-layout',
  component: SceneVersusScreenComponent as any,
  defaultConfig: {
    player1: 'PLAYER 1',
    player2: 'PLAYER 2',
    bgColor: '#0a0a14',
    player1Color: '#3b82f6',
    player2Color: '#ef4444',
    vsColor: '#fbbf24',
    textColor: '#ffffff',
  },
  configSchema: [
    { key: 'player1', label: 'Player 1 Name', type: 'text', defaultValue: 'PLAYER 1', group: 'Content' },
    { key: 'player2', label: 'Player 2 Name', type: 'text', defaultValue: 'PLAYER 2', group: 'Content' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#0a0a14', group: 'Style' },
    { key: 'player1Color', label: 'Player 1 Color', type: 'color', defaultValue: '#3b82f6', group: 'Style' },
    { key: 'player2Color', label: 'Player 2 Color', type: 'color', defaultValue: '#ef4444', group: 'Style' },
    { key: 'vsColor', label: 'VS Color', type: 'color', defaultValue: '#fbbf24', group: 'Style' },
    { key: 'textColor', label: 'Text Color', type: 'color', defaultValue: '#ffffff', group: 'Style' },
  ],
})
