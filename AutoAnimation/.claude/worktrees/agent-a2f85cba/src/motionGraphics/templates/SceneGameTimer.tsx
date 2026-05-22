import React from 'react'
import { registerMotionGraphic } from '../registry'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface GameTimerConfig {
  duration: number
  dangerThreshold: number
  timerColor: string
  dangerColor: string
  bgColor: string
  gameOverText: string
}

function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3)
}

function easeOutBack(t: number): number {
  const c1 = 1.70158
  const c3 = c1 + 1
  return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2)
}

function elasticOut(t: number): number {
  if (t === 0 || t === 1) return t
  return Math.pow(2, -10 * t) * Math.sin((t - 0.075) * (2 * Math.PI) / 0.3) + 1
}

function SceneGameTimerComponent({
  config,
  progress,
  frame,
  width,
  height,
}: MotionGraphicProps<GameTimerConfig>) {
  const { duration, dangerThreshold, timerColor, dangerColor, bgColor, gameOverText } = config

  const enterProgress = progress < 0.1 ? progress / 0.1 : 1
  const exitProgress = progress >= 0.88 ? (progress - 0.88) / 0.12 : 0
  const holdProgress = progress >= 0.1 && progress < 0.88 ? (progress - 0.1) / 0.78 : progress >= 0.88 ? 1 : 0

  // Reserve last 20% for game over
  const gameOverPhase = 0.82
  const isGameOver = holdProgress >= gameOverPhase
  const countdownProg = Math.min(1, holdProgress / gameOverPhase)
  const remaining = isGameOver ? 0 : Math.max(0, Math.ceil(duration * (1 - countdownProg)))
  const isDanger = remaining <= dangerThreshold && !isGameOver

  // Power-up entrance: digital activation
  const enterEased = easeOutCubic(enterProgress)
  const powerUpFlicker = enterProgress < 0.5
    ? Math.floor(enterProgress * 10) % 2 === 0 ? 0.3 : 1
    : 1
  const activationScale = easeOutBack(Math.min(1, enterProgress * 1.5))

  // Exit
  const exitEased = easeOutCubic(exitProgress)
  const fadeOut = 1 - exitEased

  // Game over
  const gameOverProg = isGameOver ? (holdProgress - gameOverPhase) / (1 - gameOverPhase) : 0
  const gameOverScale = isGameOver ? elasticOut(Math.min(1, gameOverProg * 2)) : 0
  const gameOverOpacity = isGameOver ? easeOutCubic(Math.min(1, gameOverProg * 3)) : 0

  // Danger shake
  const shakeIntensity = isDanger ? (1 - remaining / dangerThreshold) * 6 : 0
  const shakeX = isDanger ? Math.sin(frame * 0.8) * shakeIntensity : 0
  const shakeY = isDanger ? Math.cos(frame * 1.2) * shakeIntensity * 0.5 : 0

  // Danger flash
  const dangerFlash = isDanger ? Math.sin(frame * 0.4) * 0.5 + 0.5 : 0

  // Danger scale pulse
  const dangerScale = isDanger ? 1 + Math.sin(frame * 0.3) * 0.06 : 1

  const currentColor = isDanger ? dangerColor : timerColor
  const timeStr = String(remaining).padStart(2, '0')

  // Pixel-style border
  const borderSize = Math.max(3, Math.min(width * 0.008, 6))
  const blockSize = Math.max(4, Math.min(width * 0.01, 8))

  // Health bar
  const healthFraction = isGameOver ? 0 : remaining / duration
  const healthBarW = Math.min(width * 0.6, 400)
  const healthBarH = Math.max(12, width * 0.025)

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
        transform: `translate(${shakeX}px, ${shakeY}px)`,
      }}
    >
      {/* Scanline overlay */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: `repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.05) 2px, rgba(0,0,0,0.05) 4px)`,
          pointerEvents: 'none',
          opacity: 0.4,
        }}
      />

      {/* Danger background flash */}
      {isDanger && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: dangerColor,
            opacity: dangerFlash * 0.08,
          }}
        />
      )}

      {!isGameOver && (
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            opacity: enterEased * powerUpFlicker * fadeOut,
            transform: `scale(${activationScale})`,
          }}
        >
          {/* TIME label */}
          <div
            style={{
              fontSize: 'clamp(12px, 2vw, 20px)',
              fontWeight: 700,
              color: `${currentColor}AA`,
              letterSpacing: 8,
              textTransform: 'uppercase',
              marginBottom: 'clamp(4px, 1vw, 12px)',
            }}
          >
            TIME
          </div>

          {/* Timer box */}
          <div
            style={{
              position: 'relative',
              padding: `clamp(16px, 4vw, 40px) clamp(24px, 6vw, 60px)`,
              border: `${borderSize}px solid ${currentColor}`,
              boxShadow: `0 0 20px ${currentColor}40, inset 0 0 20px ${currentColor}10`,
            }}
          >
            {/* Corner blocks */}
            {[
              { top: -blockSize, left: -blockSize },
              { top: -blockSize, right: -blockSize },
              { bottom: -blockSize, left: -blockSize },
              { bottom: -blockSize, right: -blockSize },
            ].map((pos, i) => (
              <div
                key={i}
                style={{
                  position: 'absolute',
                  width: blockSize * 2,
                  height: blockSize * 2,
                  background: currentColor,
                  ...pos,
                } as React.CSSProperties}
              />
            ))}

            <div
              style={{
                fontSize: `clamp(48px, 16vw, ${Math.min(width, height) * 0.35}px)`,
                fontWeight: 900,
                color: currentColor,
                lineHeight: 1,
                textShadow: `0 0 20px ${currentColor}60`,
                transform: `scale(${dangerScale})`,
                fontVariantNumeric: 'tabular-nums',
              }}
            >
              {timeStr}
            </div>
          </div>

          {/* Health bar */}
          <div
            style={{
              width: healthBarW,
              height: healthBarH,
              marginTop: 'clamp(12px, 3vw, 28px)',
              border: `${Math.max(2, borderSize * 0.5)}px solid ${currentColor}60`,
              position: 'relative',
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                height: '100%',
                width: `${healthFraction * 100}%`,
                background: isDanger
                  ? `repeating-linear-gradient(45deg, ${dangerColor}, ${dangerColor} 4px, ${dangerColor}AA 4px, ${dangerColor}AA 8px)`
                  : currentColor,
                boxShadow: `0 0 8px ${currentColor}80`,
              }}
            />
            {/* Segmented lines */}
            {Array.from({ length: 10 }).map((_, i) => (
              <div
                key={i}
                style={{
                  position: 'absolute',
                  left: `${(i + 1) * 10}%`,
                  top: 0,
                  bottom: 0,
                  width: 1,
                  background: `${bgColor}80`,
                }}
              />
            ))}
          </div>
        </div>
      )}

      {/* GAME OVER */}
      {isGameOver && (
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            transform: `scale(${gameOverScale})`,
            opacity: gameOverOpacity * fadeOut,
          }}
        >
          <div
            style={{
              fontSize: `clamp(32px, 10vw, ${Math.min(width, height) * 0.15}px)`,
              fontWeight: 900,
              color: dangerColor,
              textShadow: `0 0 30px ${dangerColor}80, 0 0 60px ${dangerColor}40`,
              letterSpacing: 6,
            }}
          >
            {gameOverText}
          </div>
          <div
            style={{
              fontSize: 'clamp(10px, 1.5vw, 16px)',
              color: `${dangerColor}80`,
              marginTop: 'clamp(8px, 2vw, 16px)',
              letterSpacing: 4,
            }}
          >
            PRESS START TO CONTINUE
          </div>
        </div>
      )}

      {/* Game over flash */}
      {isGameOver && gameOverProg < 0.15 && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: dangerColor,
            opacity: (0.15 - gameOverProg) / 0.15 * 0.5,
          }}
        />
      )}
    </div>
  )
}

registerMotionGraphic({
  id: 'tpl-scene-game-timer',
  title: 'Game Timer',
  description:
    'Arcade-style game timer with pixel aesthetics, danger mode at low time with shake and flash, ending in GAME OVER',
  tags: ['scene', 'countdown', 'timer', 'game', 'arcade', 'pixel', 'retro'],
  category: 'scene-layout',
  component: SceneGameTimerComponent as unknown as React.ComponentType<MotionGraphicProps>,
  configSchema: [
    { key: 'duration', label: 'Duration (seconds)', type: 'number', defaultValue: 30, min: 5, max: 300, group: 'Content' },
    { key: 'dangerThreshold', label: 'Danger Threshold', type: 'number', defaultValue: 5, min: 1, max: 30, group: 'Content' },
    { key: 'gameOverText', label: 'Game Over Text', type: 'text', defaultValue: 'GAME OVER', group: 'Content' },
    { key: 'timerColor', label: 'Timer Color', type: 'color', defaultValue: '#00FF88', group: 'Style' },
    { key: 'dangerColor', label: 'Danger Color', type: 'color', defaultValue: '#FF2222', group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#0A0A0A', group: 'Style' },
  ],
  defaultConfig: {
    duration: 30,
    dangerThreshold: 5,
    gameOverText: 'GAME OVER',
    timerColor: '#00FF88',
    dangerColor: '#FF2222',
    bgColor: '#0A0A0A',
  },
})
