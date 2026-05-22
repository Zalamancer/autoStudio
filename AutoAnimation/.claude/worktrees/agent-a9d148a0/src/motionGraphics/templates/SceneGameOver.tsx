import React from 'react'
import { registerMotionGraphic } from '../registry'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface SceneGameOverConfig {
  score: number
  scoreLabel: string
  continueText: string
  bgColor: string
  textColor: string
  accentColor: string
  glitchColor: string
}

function easeOutCubic(t: number): number { return 1 - Math.pow(1 - t, 3) }
function easeInCubic(t: number): number { return t * t * t }
function easeOutElastic(t: number): number {
  if (t === 0 || t === 1) return t
  return Math.pow(2, -10 * t) * Math.sin((t - 0.075) * (2 * Math.PI) / 0.3) + 1
}

// Deterministic pseudo-random from seed
function seededRandom(seed: number): number {
  const x = Math.sin(seed * 12.9898 + 78.233) * 43758.5453
  return x - Math.floor(x)
}

function SceneGameOverComponent({ config, progress, frame, fps }: MotionGraphicProps<SceneGameOverConfig>) {
  const { score, scoreLabel, continueText, bgColor, textColor, accentColor, glitchColor } = config

  const enterProgress = progress < 0.3 ? progress / 0.3 : 1
  const holdProgress = progress >= 0.3 && progress < 0.8 ? (progress - 0.3) / 0.5 : progress >= 0.8 ? 1 : 0
  const exitProgress = progress >= 0.8 ? (progress - 0.8) / 0.2 : 0

  // "GAME OVER" slam with elastic
  const slamProgress = Math.min(1, enterProgress / 0.4)
  const slamScale = easeOutElastic(slamProgress)
  const slamOpacity = easeOutCubic(Math.min(1, slamProgress * 2))

  // Glitch effect: periodic displacement during enter and hold
  const glitchSeed = Math.floor(frame / 3) // change every 3 frames
  const isGlitching = (enterProgress > 0.3 && enterProgress < 0.6) ||
    (progress >= 0.3 && progress < 0.8 && seededRandom(glitchSeed) > 0.85)
  const glitchOffsetX = isGlitching ? (seededRandom(glitchSeed + 1) - 0.5) * 12 : 0
  const glitchOffsetY = isGlitching ? (seededRandom(glitchSeed + 2) - 0.5) * 4 : 0
  const glitchClipTop = isGlitching ? seededRandom(glitchSeed + 3) * 30 : 0
  const glitchClipHeight = isGlitching ? 10 + seededRandom(glitchSeed + 4) * 20 : 0

  // Screen flash on slam
  const flashAlpha = slamProgress > 0.15 && slamProgress < 0.35
    ? Math.sin(((slamProgress - 0.15) / 0.2) * Math.PI) * 0.5
    : 0

  // Score counter
  const scoreReveal = easeOutCubic(Math.max(0, Math.min(1, (enterProgress - 0.5) / 0.4)))
  const displayScore = Math.round(score * scoreReveal)

  // "CONTINUE?" blink during hold
  const continueReveal = easeOutCubic(Math.max(0, Math.min(1, (enterProgress - 0.7) / 0.3)))
  const isHolding = progress >= 0.3 && progress < 0.8
  const continueBlink = isHolding ? Math.sin(holdProgress * Math.PI * 6) > 0 ? 1 : 0.15 : 1

  // Scanlines
  const scanlineOffset = (frame * 0.5) % 4

  // Exit: glitch out
  const exitEased = easeInCubic(exitProgress)
  const exitOpacity = 1 - exitEased
  const exitGlitchX = exitProgress > 0 ? (seededRandom(glitchSeed + 10) - 0.5) * 40 * exitEased : 0

  // Vignette darkening
  const vignetteOpacity = easeOutCubic(Math.min(1, enterProgress / 0.2)) * 0.4

  return (
    <div style={{ position: 'absolute', inset: 0, overflow: 'hidden' }}>
      <div style={{ position: 'absolute', inset: 0, background: bgColor }} />

      {/* Scanlines overlay */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          backgroundImage: `repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.08) 2px, rgba(0,0,0,0.08) 4px)`,
          backgroundPosition: `0 ${scanlineOffset}px`,
          pointerEvents: 'none',
          opacity: 0.6 * slamOpacity,
        }}
      />

      {/* Vignette */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: 'radial-gradient(ellipse at center, transparent 40%, rgba(0,0,0,0.7) 100%)',
          opacity: vignetteOpacity,
          pointerEvents: 'none',
        }}
      />

      {/* Flash overlay */}
      {flashAlpha > 0 && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: textColor,
            opacity: flashAlpha,
            pointerEvents: 'none',
          }}
        />
      )}

      <div
        style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          opacity: exitOpacity,
          transform: `translateX(${exitGlitchX}px)`,
        }}
      >
        {/* GAME OVER text */}
        <div style={{ position: 'relative' }}>
          {/* Main text */}
          <div
            style={{
              fontFamily: "'Inter', 'Helvetica Neue', sans-serif",
              fontSize: 'clamp(36px, 11vw, 90px)',
              fontWeight: 900,
              color: textColor,
              textTransform: 'uppercase',
              letterSpacing: '0.12em',
              lineHeight: 1,
              transform: `scale(${slamScale}) translate(${glitchOffsetX}px, ${glitchOffsetY}px)`,
              opacity: slamOpacity,
            }}
          >
            GAME OVER
          </div>

          {/* Glitch red copy */}
          {isGlitching && (
            <div
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                fontFamily: "'Inter', 'Helvetica Neue', sans-serif",
                fontSize: 'clamp(36px, 11vw, 90px)',
                fontWeight: 900,
                color: glitchColor,
                textTransform: 'uppercase',
                letterSpacing: '0.12em',
                lineHeight: 1,
                transform: `scale(${slamScale}) translate(${glitchOffsetX + 3}px, ${glitchOffsetY}px)`,
                opacity: 0.6,
                clipPath: `inset(${glitchClipTop}% 0 ${100 - glitchClipTop - glitchClipHeight}% 0)`,
                pointerEvents: 'none',
              }}
            >
              GAME OVER
            </div>
          )}

          {/* Glitch cyan copy */}
          {isGlitching && (
            <div
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                fontFamily: "'Inter', 'Helvetica Neue', sans-serif",
                fontSize: 'clamp(36px, 11vw, 90px)',
                fontWeight: 900,
                color: accentColor,
                textTransform: 'uppercase',
                letterSpacing: '0.12em',
                lineHeight: 1,
                transform: `scale(${slamScale}) translate(${glitchOffsetX - 3}px, ${glitchOffsetY + 2}px)`,
                opacity: 0.4,
                clipPath: `inset(${glitchClipTop + 10}% 0 ${100 - glitchClipTop - glitchClipHeight - 10}% 0)`,
                pointerEvents: 'none',
              }}
            >
              GAME OVER
            </div>
          )}
        </div>

        {/* Score display */}
        <div
          style={{
            marginTop: 'clamp(16px, 4vw, 36px)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 'clamp(2px, 0.5vw, 6px)',
            opacity: scoreReveal,
            transform: `translateY(${(1 - scoreReveal) * 10}px)`,
          }}
        >
          <div
            style={{
              fontFamily: "'Inter', sans-serif",
              fontSize: 'clamp(9px, 1.4vw, 12px)',
              fontWeight: 700,
              color: `${textColor}60`,
              textTransform: 'uppercase',
              letterSpacing: '0.2em',
            }}
          >
            {scoreLabel}
          </div>
          <div
            style={{
              fontFamily: "'Inter', 'Helvetica Neue', sans-serif",
              fontSize: 'clamp(28px, 7vw, 56px)',
              fontWeight: 900,
              color: textColor,
              lineHeight: 1,
            }}
          >
            {displayScore.toLocaleString('en-US')}
          </div>
        </div>

        {/* CONTINUE? blinking text */}
        <div
          style={{
            marginTop: 'clamp(24px, 6vw, 48px)',
            fontFamily: "'Inter', 'Helvetica Neue', sans-serif",
            fontSize: 'clamp(14px, 3vw, 24px)',
            fontWeight: 700,
            color: accentColor,
            textTransform: 'uppercase',
            letterSpacing: '0.15em',
            opacity: continueReveal * continueBlink,
          }}
        >
          {continueText}
        </div>
      </div>
    </div>
  )
}

registerMotionGraphic({
  id: 'tpl-scene-game-over',
  title: 'Game Over',
  description: 'Dramatic "GAME OVER" with glitch effect, score display, "CONTINUE?" prompt with blinking text',
  tags: ['scene', 'gaming', 'game-over', 'retro', 'glitch', 'arcade', 'score'],
  category: 'scene-layout',
  component: SceneGameOverComponent as any,
  defaultConfig: {
    score: 125800,
    scoreLabel: 'FINAL SCORE',
    continueText: 'CONTINUE?',
    bgColor: '#0a0a0a',
    textColor: '#ffffff',
    accentColor: '#00ffff',
    glitchColor: '#ff0040',
  },
  configSchema: [
    { key: 'score', label: 'Score', type: 'number', defaultValue: 125800, min: 0, max: 99999999, group: 'Content' },
    { key: 'scoreLabel', label: 'Score Label', type: 'text', defaultValue: 'FINAL SCORE', group: 'Content' },
    { key: 'continueText', label: 'Continue Text', type: 'text', defaultValue: 'CONTINUE?', group: 'Content' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#0a0a0a', group: 'Style' },
    { key: 'textColor', label: 'Text Color', type: 'color', defaultValue: '#ffffff', group: 'Style' },
    { key: 'accentColor', label: 'Accent Color', type: 'color', defaultValue: '#00ffff', group: 'Style' },
    { key: 'glitchColor', label: 'Glitch Color', type: 'color', defaultValue: '#ff0040', group: 'Style' },
  ],
})
