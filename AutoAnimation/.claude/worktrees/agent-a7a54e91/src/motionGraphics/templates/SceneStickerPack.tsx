import React from 'react'
import { registerMotionGraphic } from '../registry'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface SceneStickerPackConfig {
  stickers: string[]
  stickerBgColor: string
  bgColor: string
}

function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3)
}

function easeInCubic(t: number): number {
  return t * t * t
}

// Deterministic pseudo-random
function seededRandom(seed: number): number {
  const x = Math.sin(seed * 12.9898 + seed * 78.233) * 43758.5453
  return x - Math.floor(x)
}

// Spring physics approximation
function springOut(t: number): number {
  const damping = 0.6
  const freq = 4
  return 1 - Math.exp(-damping * t * 10) * Math.cos(freq * t * Math.PI * 2)
}

interface StickerData {
  text: string
  x: number      // % position
  y: number      // % position
  rotation: number
  startAngle: number  // direction sticker enters from (radians)
  scale: number
  floatPhase: number  // random phase offset for float animation
  floatSpeed: number
}

function SceneStickerPackComponent({ config, progress, frame, fps, width, height }: MotionGraphicProps<SceneStickerPackConfig>) {
  const { stickers, stickerBgColor, bgColor } = config

  const enterProgress = progress < 0.25 ? progress / 0.25 : 1
  const holdProgress = progress >= 0.25 && progress < 0.75 ? (progress - 0.25) / 0.5 : progress >= 0.75 ? 1 : 0
  const exitProgress = progress >= 0.75 ? (progress - 0.75) / 0.25 : 0

  const timeSeconds = frame / fps

  // Generate sticker layout data deterministically
  const stickerData: StickerData[] = stickers.map((text, i) => {
    const seed = i * 7 + 3
    return {
      text,
      x: 15 + seededRandom(seed) * 70,      // 15-85% x range
      y: 15 + seededRandom(seed + 1) * 70,   // 15-85% y range
      rotation: (seededRandom(seed + 2) - 0.5) * 30, // -15 to 15 degrees
      startAngle: seededRandom(seed + 3) * Math.PI * 2,
      scale: 0.8 + seededRandom(seed + 4) * 0.4,  // 0.8-1.2
      floatPhase: seededRandom(seed + 5) * Math.PI * 2,
      floatSpeed: 1.5 + seededRandom(seed + 6) * 2,
    }
  })

  return (
    <div style={{ position: 'absolute', inset: 0, overflow: 'hidden' }}>
      {bgColor !== 'transparent' && (
        <div style={{ position: 'absolute', inset: 0, background: bgColor }} />
      )}

      {stickerData.map((sticker, i) => {
        // Staggered entry: each sticker pops in one by one
        const enterDelay = i / stickers.length
        const stickerEnterProgress = enterProgress < 1
          ? Math.max(0, Math.min(1, (enterProgress - enterDelay * 0.7) / (1 - enterDelay * 0.7)))
          : 1

        // Staggered exit: fly out one by one
        const exitDelay = i / stickers.length
        const stickerExitProgress = exitProgress > 0
          ? Math.max(0, Math.min(1, (exitProgress - exitDelay * 0.5) / (1 - exitDelay * 0.5)))
          : 0

        const spring = springOut(stickerEnterProgress)

        // Enter: fly in from random direction
        const flyDistance = 500
        const enterX = stickerEnterProgress < 1
          ? Math.cos(sticker.startAngle) * flyDistance * (1 - spring)
          : 0
        const enterY = stickerEnterProgress < 1
          ? Math.sin(sticker.startAngle) * flyDistance * (1 - spring)
          : 0

        // Exit: fly out to a different random direction
        const exitAngle = sticker.startAngle + Math.PI
        const exitEased = easeInCubic(stickerExitProgress)
        const exitX = stickerExitProgress > 0
          ? Math.cos(exitAngle) * flyDistance * exitEased
          : 0
        const exitY = stickerExitProgress > 0
          ? Math.sin(exitAngle) * flyDistance * exitEased
          : 0

        // Hold: gentle independent float
        const floatX = holdProgress > 0
          ? Math.sin(timeSeconds * sticker.floatSpeed + sticker.floatPhase) * 5
          : 0
        const floatY = holdProgress > 0
          ? Math.cos(timeSeconds * sticker.floatSpeed * 0.7 + sticker.floatPhase + 1) * 5
          : 0

        const x = enterX + exitX + floatX
        const y = enterY + exitY + floatY

        const scale = stickerEnterProgress < 1
          ? spring * sticker.scale
          : stickerExitProgress > 0
            ? sticker.scale * (1 - exitEased)
            : sticker.scale

        const rotation = sticker.rotation + (holdProgress > 0 ? Math.sin(timeSeconds * 1.2 + sticker.floatPhase) * 2 : 0)

        const opacity = stickerEnterProgress < 1
          ? Math.min(1, stickerEnterProgress * 3)
          : stickerExitProgress > 0
            ? 1 - exitEased
            : 1

        // Detect if text is emoji (starts with non-ASCII) or plain text
        const isEmoji = /^[\u{1F000}-\u{1FFFF}]|^[\u{2600}-\u{27BF}]|^[\u{FE00}-\u{FEFF}]/u.test(sticker.text)

        return (
          <div
            key={i}
            style={{
              position: 'absolute',
              left: `${sticker.x}%`,
              top: `${sticker.y}%`,
              transform: `translate(-50%, -50%) translate(${x}px, ${y}px) rotate(${rotation}deg) scale(${scale})`,
              opacity,
            }}
          >
            {isEmoji ? (
              <span style={{ fontSize: 48, display: 'block', lineHeight: 1 }}>
                {sticker.text}
              </span>
            ) : (
              <div
                style={{
                  background: stickerBgColor,
                  padding: '8px 16px',
                  borderRadius: 12,
                  fontFamily: "'Arial Black', 'Helvetica Neue', sans-serif",
                  fontSize: 18,
                  fontWeight: 900,
                  color: '#ffffff',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  boxShadow: '0 3px 12px rgba(0,0,0,0.2)',
                  whiteSpace: 'nowrap',
                }}
              >
                {sticker.text}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}

registerMotionGraphic({
  id: 'tpl-scene-sticker-pack',
  title: 'Scene Sticker Pack',
  description: 'Scattered emoji/text stickers with spring pop-in, independent float, and staggered exit',
  tags: ['scene', 'sticker', 'emoji', 'overlay', 'decoration', 'social'],
  category: 'scene-layout',
  component: SceneStickerPackComponent as any,
  defaultConfig: {
    stickers: ['\uD83D\uDD25', 'WOW', '\u2728', '100%', '\uD83D\uDE0D'],
    stickerBgColor: '#FF3366',
    bgColor: 'transparent',
  },
  configSchema: [
    { key: 'stickers', label: 'Stickers', type: 'text-array', defaultValue: ['\uD83D\uDD25', 'WOW', '\u2728', '100%', '\uD83D\uDE0D'], group: 'Content' },
    { key: 'stickerBgColor', label: 'Sticker Background', type: 'color', defaultValue: '#FF3366', group: 'Style' },
    { key: 'bgColor', label: 'Background Color', type: 'color', defaultValue: 'transparent', group: 'Style' },
  ],
})
