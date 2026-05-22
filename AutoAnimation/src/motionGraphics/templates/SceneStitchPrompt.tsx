import React from 'react'
import { registerMotionGraphic } from '../registry'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface SceneStitchPromptConfig {
  promptText: string
  cutColor: string
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

function SceneStitchPromptComponent({ config, progress }: MotionGraphicProps<SceneStitchPromptConfig>) {
  const { promptText, cutColor, bgColor, textColor } = config

  const enterProgress = progress < 0.2 ? progress / 0.2 : 1
  const holdProgress = progress >= 0.2 && progress < 0.8 ? (progress - 0.2) / 0.6 : progress >= 0.8 ? 1 : 0
  const exitProgress = progress >= 0.8 ? (progress - 0.8) / 0.2 : 0
  const isHolding = progress >= 0.2 && progress < 0.8

  // Background
  const bgOpacity = enterProgress < 1
    ? easeOutCubic(enterProgress)
    : exitProgress > 0
      ? 1 - easeInCubic(exitProgress)
      : 1

  // Scissors animate left to right during enter
  const scissorsEnter = Math.min(1, enterProgress / 0.7)
  const scissorsX = scissorsEnter < 1
    ? -10 + 110 * easeOutCubic(scissorsEnter)
    : 100
  const scissorsOpacity = scissorsEnter < 1
    ? scissorsEnter < 0.1 ? scissorsEnter / 0.1 : scissorsEnter > 0.9 ? (1 - scissorsEnter) / 0.1 : 1
    : 0

  // Cut line follows scissors
  const cutLineWidth = scissorsEnter < 1
    ? easeOutCubic(scissorsEnter) * 100
    : 100

  // Cut line glow during hold
  const cutGlow = isHolding
    ? 4 + Math.sin(holdProgress * Math.PI * 8) * 6
    : 4

  // Text appears after cut
  const textDelay = 0.5
  const textEnter = enterProgress < 1
    ? Math.max(0, (enterProgress - textDelay) / (1 - textDelay))
    : 1
  const textScale = textEnter < 1
    ? easeOutBack(textEnter)
    : exitProgress > 0
      ? 1 - easeInCubic(exitProgress) * 0.2
      : 1
  const textOpacity = textEnter < 1
    ? easeOutCubic(textEnter)
    : exitProgress > 0
      ? 1 - easeInCubic(exitProgress)
      : 1

  // Float during hold
  const textFloat = isHolding
    ? Math.sin(holdProgress * Math.PI * 4) * 6
    : 0

  // Top portion peels on exit
  const peelAngle = exitProgress > 0
    ? easeInCubic(exitProgress) * 8
    : 0
  const peelY = exitProgress > 0
    ? -100 * easeInCubic(exitProgress)
    : 0
  const peelOpacity = exitProgress > 0
    ? 1 - easeInCubic(exitProgress)
    : 1

  // Stitch label
  const labelDelay = 0.65
  const labelEnter = enterProgress < 1
    ? Math.max(0, (enterProgress - labelDelay) / (1 - labelDelay))
    : 1
  const labelOpacity = labelEnter < 1
    ? easeOutCubic(labelEnter)
    : exitProgress > 0
      ? 1 - easeInCubic(exitProgress)
      : 1

  return (
    <div style={{ position: 'absolute', inset: 0, overflow: 'hidden' }}>
      <div style={{
        position: 'absolute', inset: 0,
        background: bgColor,
        opacity: bgOpacity,
      }} />

      {/* Top portion that peels away on exit */}
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0,
        height: '25%',
        background: `${bgColor}`,
        borderBottom: `3px solid ${cutColor}`,
        transformOrigin: 'top left',
        transform: `translateY(${peelY}px) rotate(${peelAngle}deg)`,
        opacity: peelOpacity,
        zIndex: 2,
      }}>
        {/* Stitch indicator */}
        <div style={{
          position: 'absolute',
          bottom: '12px', left: '50%',
          transform: 'translateX(-50%)',
          fontFamily: "'Inter', sans-serif",
          fontSize: 'clamp(10px, 2vw, 16px)',
          fontWeight: 700,
          color: cutColor,
          textTransform: 'uppercase',
          letterSpacing: '0.15em',
          opacity: labelOpacity,
          display: 'flex', alignItems: 'center',
          gap: '8px',
        }}>
          <span>{'\u2702\uFE0F'}</span>
          <span>Stitch</span>
        </div>
      </div>

      {/* Cut line at top area */}
      <div style={{
        position: 'absolute',
        top: '25%', left: 0,
        width: `${cutLineWidth}%`,
        height: '3px',
        background: cutColor,
        boxShadow: `0 0 ${cutGlow}px ${cutColor}`,
        zIndex: 5,
      }} />

      {/* Scissors emoji traveling across */}
      <div style={{
        position: 'absolute',
        top: '25%',
        left: `${scissorsX}%`,
        transform: 'translate(-50%, -50%) scaleX(-1)',
        fontSize: 'clamp(28px, 7vw, 52px)',
        lineHeight: 1,
        opacity: scissorsOpacity,
        zIndex: 6,
        filter: `drop-shadow(0 2px 8px ${cutColor}80)`,
      }}>
        {'\u2702\uFE0F'}
      </div>

      {/* Dashed stitch line pattern along the cut */}
      <div style={{
        position: 'absolute',
        top: 'calc(25% + 8px)', left: 0, right: 0,
        height: '2px',
        opacity: labelOpacity * 0.4,
        background: `repeating-linear-gradient(to right, ${cutColor} 0px, ${cutColor} 8px, transparent 8px, transparent 16px)`,
        zIndex: 4,
      }} />

      {/* Main content area */}
      <div style={{
        position: 'absolute',
        top: '25%', left: 0, right: 0, bottom: 0,
        display: 'flex', flexDirection: 'column',
        justifyContent: 'center', alignItems: 'center',
        padding: '8%',
        gap: 'clamp(16px, 4vw, 32px)',
      }}>
        {/* Prompt text */}
        <div style={{
          fontFamily: "'Inter', 'Helvetica Neue', sans-serif",
          fontSize: 'clamp(22px, 5.5vw, 48px)',
          fontWeight: 800,
          color: textColor,
          textAlign: 'center',
          lineHeight: 1.3,
          maxWidth: '85%',
          transform: `scale(${textScale}) translateY(${textFloat}px)`,
          opacity: textOpacity,
        }}>
          {promptText}
        </div>

        {/* Visual divider */}
        <div style={{
          width: 'clamp(40px, 10vw, 80px)',
          height: '3px',
          background: cutColor,
          borderRadius: '2px',
          opacity: textOpacity * 0.5,
          transform: `translateY(${textFloat}px)`,
        }} />

        {/* Subtitle */}
        <div style={{
          fontFamily: "'Inter', sans-serif",
          fontSize: 'clamp(12px, 2.5vw, 18px)',
          color: `${textColor}60`,
          fontWeight: 500,
          textTransform: 'uppercase',
          letterSpacing: '0.1em',
          opacity: textOpacity * 0.7,
          transform: `translateY(${textFloat}px)`,
        }}>
          Add your reaction
        </div>
      </div>
    </div>
  )
}

registerMotionGraphic({
  id: 'tpl-scene-stitch-prompt',
  title: 'Stitch Prompt',
  description: 'TikTok-style stitch prompt with animated scissors cutting across, glowing cut line, and peel-away exit',
  tags: ['scene', 'social', 'cta', 'stitch', 'tiktok', 'reaction', 'engagement'],
  category: 'scene-layout',
  component: SceneStitchPromptComponent as any,
  defaultConfig: {
    promptText: 'Stitch this with your hot take',
    cutColor: '#EF4444',
    bgColor: '#0a0a1a',
    textColor: '#ffffff',
  },
  configSchema: [
    { key: 'promptText', label: 'Prompt Text', type: 'text', defaultValue: 'Stitch this with your hot take', group: 'Content' },
    { key: 'cutColor', label: 'Cut Line Color', type: 'color', defaultValue: '#EF4444', group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#0a0a1a', group: 'Style' },
    { key: 'textColor', label: 'Text Color', type: 'color', defaultValue: '#ffffff', group: 'Style' },
  ],
})
