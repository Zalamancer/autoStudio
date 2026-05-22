import React from 'react'
import { registerMotionGraphic } from '../registry'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface SceneTagFriendConfig {
  tagText: string
  symbolColor: string
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

// Pre-computed @ symbol positions (angles and distances from center)
const AT_SYMBOLS = [
  { angle: 0, dist: 140, size: 32, delay: 0 },
  { angle: 45, dist: 170, size: 28, delay: 0.04 },
  { angle: 90, dist: 130, size: 36, delay: 0.08 },
  { angle: 135, dist: 160, size: 26, delay: 0.12 },
  { angle: 180, dist: 145, size: 34, delay: 0.02 },
  { angle: 225, dist: 175, size: 30, delay: 0.06 },
  { angle: 270, dist: 135, size: 38, delay: 0.1 },
  { angle: 315, dist: 155, size: 24, delay: 0.14 },
  { angle: 22, dist: 190, size: 22, delay: 0.05 },
  { angle: 200, dist: 185, size: 20, delay: 0.09 },
  { angle: 110, dist: 195, size: 26, delay: 0.11 },
  { angle: 290, dist: 180, size: 22, delay: 0.07 },
]

function SceneTagFriendComponent({ config, progress }: MotionGraphicProps<SceneTagFriendConfig>) {
  const { tagText, symbolColor, bgColor, textColor } = config

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

  // Central text scales in from center
  const textEnter = Math.min(1, enterProgress / 0.5)
  const textScale = textEnter < 1
    ? easeOutBack(textEnter)
    : exitProgress > 0
      ? 1 - easeInCubic(exitProgress) * 0.3
      : 1
  const textOpacity = textEnter < 1
    ? easeOutCubic(textEnter)
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

      {/* @ symbols scattered around */}
      {AT_SYMBOLS.map((sym, i) => {
        const sDelay = 0.1 + sym.delay
        const sEnter = enterProgress < 1
          ? Math.max(0, (enterProgress - sDelay) / (1 - sDelay))
          : 1

        const rad = (sym.angle * Math.PI) / 180

        // Enter: fly in from edges toward position
        const enterDist = sEnter < 1
          ? 400 + (sym.dist - 400) * easeOutCubic(sEnter)
          : sym.dist

        // Exit: converge to center
        const exitDist = exitProgress > 0
          ? sym.dist * (1 - easeInCubic(exitProgress))
          : enterDist

        const currentDist = exitProgress > 0 ? exitDist : enterDist

        // Gentle drift during hold
        const driftX = isHolding
          ? Math.sin(holdProgress * Math.PI * 3 + i * 1.5) * 12
          : 0
        const driftY = isHolding
          ? Math.cos(holdProgress * Math.PI * 2.5 + i * 0.9) * 12
          : 0

        const sx = Math.cos(rad) * currentDist + driftX
        const sy = Math.sin(rad) * currentDist + driftY

        const sOpacity = sEnter < 1
          ? easeOutCubic(sEnter)
          : exitProgress > 0
            ? 1 - easeInCubic(exitProgress)
            : 1

        const sScale = sEnter < 1
          ? easeOutBack(sEnter)
          : exitProgress > 0
            ? 1 - easeInCubic(exitProgress) * 0.5
            : 1

        // Gentle rotation during hold
        const sRotation = isHolding
          ? Math.sin(holdProgress * Math.PI * 2 + i * 0.7) * 15
          : 0

        return (
          <div key={i} style={{
            position: 'absolute',
            left: '50%', top: '50%',
            transform: `translate(calc(-50% + ${sx}px), calc(-50% + ${sy}px)) scale(${sScale}) rotate(${sRotation}deg)`,
            opacity: sOpacity * 0.7,
            fontFamily: "'Inter', 'Helvetica Neue', sans-serif",
            fontSize: `${sym.size}px`,
            fontWeight: 900,
            color: symbolColor,
            lineHeight: 1,
            textShadow: `0 0 8px ${symbolColor}40`,
            userSelect: 'none',
          }}>
            @
          </div>
        )
      })}

      {/* Central text */}
      <div style={{
        position: 'absolute', inset: 0,
        display: 'flex', flexDirection: 'column',
        justifyContent: 'center', alignItems: 'center',
        padding: '12%',
        pointerEvents: 'none',
      }}>
        <div style={{
          fontFamily: "'Inter', 'Helvetica Neue', sans-serif",
          fontSize: 'clamp(22px, 5.5vw, 48px)',
          fontWeight: 800,
          color: textColor,
          textAlign: 'center',
          lineHeight: 1.35,
          maxWidth: '80%',
          transform: `scale(${textScale})`,
          opacity: textOpacity,
          textShadow: '0 2px 20px rgba(0,0,0,0.6)',
        }}>
          {tagText}
        </div>

        {/* Subtle tag icon below */}
        <div style={{
          marginTop: 'clamp(12px, 3vw, 24px)',
          fontFamily: "'Inter', sans-serif",
          fontSize: 'clamp(12px, 2.5vw, 18px)',
          fontWeight: 600,
          color: symbolColor,
          opacity: textOpacity * 0.6,
          textTransform: 'uppercase',
          letterSpacing: '0.12em',
          transform: `scale(${textScale})`,
        }}>
          {'\uD83D\uDC47'} Tag them below
        </div>
      </div>
    </div>
  )
}

registerMotionGraphic({
  id: 'tpl-scene-tag-friend',
  title: 'Tag a Friend',
  description: 'Tag-a-friend prompt with scattered floating @ symbols, central text scale-in, and converging exit',
  tags: ['scene', 'social', 'cta', 'tag', 'friend', 'mention', 'engagement'],
  category: 'scene-layout',
  component: SceneTagFriendComponent as any,
  defaultConfig: {
    tagText: 'Tag a friend who does this \uD83D\uDE02',
    symbolColor: '#3B82F6',
    bgColor: '#0a0a1a',
    textColor: '#ffffff',
  },
  configSchema: [
    { key: 'tagText', label: 'Tag Text', type: 'text', defaultValue: 'Tag a friend who does this \uD83D\uDE02', group: 'Content' },
    { key: 'symbolColor', label: 'Symbol Color', type: 'color', defaultValue: '#3B82F6', group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#0a0a1a', group: 'Style' },
    { key: 'textColor', label: 'Text Color', type: 'color', defaultValue: '#ffffff', group: 'Style' },
  ],
})
