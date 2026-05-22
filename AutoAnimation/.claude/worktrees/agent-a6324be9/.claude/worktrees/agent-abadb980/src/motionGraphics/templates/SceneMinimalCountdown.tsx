import React from 'react'
import { registerMotionGraphic } from '../registry'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface MinimalCountdownConfig {
  countFrom: number
  textColor: string
  bgColor: string
  fontSize: number
}

function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3)
}

function SceneMinimalCountdownComponent({
  config,
  progress,
  durationInFrames,
  frame,
  width,
  height,
}: MotionGraphicProps<MinimalCountdownConfig>) {
  const { countFrom, textColor, bgColor, fontSize } = config

  const enterProgress = progress < 0.1 ? progress / 0.1 : 1
  const exitProgress = progress >= 0.9 ? (progress - 0.9) / 0.1 : 0
  const holdProgress = progress >= 0.1 && progress < 0.9 ? (progress - 0.1) / 0.8 : progress >= 0.9 ? 1 : 0

  const count = Math.max(1, Math.round(countFrom))
  const framesPerNumber = (durationInFrames * 0.8) / count
  const holdFrame = Math.max(0, frame - durationInFrames * 0.1)
  const currentIndex = Math.min(Math.floor(holdFrame / framesPerNumber), count - 1)
  const localProgress = (holdFrame - currentIndex * framesPerNumber) / framesPerNumber
  const currentNumber = count - currentIndex
  const nextNumber = currentNumber - 1

  // Enter: fade in from below
  const enterFade = easeOutCubic(enterProgress)
  const enterSlide = (1 - enterFade) * 40

  // Exit: slide up and fade
  const exitFade = 1 - easeOutCubic(exitProgress)
  const exitSlide = easeOutCubic(exitProgress) * -60

  // Digit transition: slide up and fade
  const transitionPhase = 0.15 // transition takes 15% of each number's time
  const transitionStart = 1 - transitionPhase

  let currentOpacity = 1
  let currentY = 0
  let nextOpacity = 0
  let nextY = 50

  if (localProgress > transitionStart && currentIndex < count - 1) {
    const t = (localProgress - transitionStart) / transitionPhase
    const tEased = easeOutCubic(t)
    currentOpacity = 1 - tEased
    currentY = -tEased * 50
    nextOpacity = tEased
    nextY = 50 * (1 - tEased)
  }

  // Enter phase: first number fades in
  if (enterProgress < 1) {
    currentOpacity = enterFade
    currentY = enterSlide
  }

  const computedFontSize = `clamp(48px, ${fontSize}vw, ${Math.min(width, height) * 0.6}px)`

  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        background: bgColor,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
      }}
    >
      {/* Current number */}
      <div
        style={{
          position: 'absolute',
          fontSize: computedFontSize,
          fontWeight: 200,
          fontFamily: "'Helvetica Neue', 'Segoe UI', Arial, sans-serif",
          color: textColor,
          lineHeight: 1,
          transform: `translateY(${currentY + exitSlide}px)`,
          opacity: currentOpacity * exitFade,
          fontVariantNumeric: 'tabular-nums',
        }}
      >
        {holdProgress >= 1 ? 1 : currentNumber}
      </div>

      {/* Next number (sliding in from below) */}
      {localProgress > transitionStart && currentIndex < count - 1 && nextNumber >= 1 && (
        <div
          style={{
            position: 'absolute',
            fontSize: computedFontSize,
            fontWeight: 200,
            fontFamily: "'Helvetica Neue', 'Segoe UI', Arial, sans-serif",
            color: textColor,
            lineHeight: 1,
            transform: `translateY(${nextY}px)`,
            opacity: nextOpacity * exitFade,
            fontVariantNumeric: 'tabular-nums',
          }}
        >
          {nextNumber}
        </div>
      )}
    </div>
  )
}

registerMotionGraphic({
  id: 'tpl-scene-minimal-countdown',
  title: 'Minimal Countdown',
  description:
    'Ultra-clean countdown with large thin numbers that slide-up-and-fade between values on a solid background',
  tags: ['scene', 'countdown', 'timer', 'minimal', 'clean', 'simple', 'elegant'],
  category: 'scene-layout',
  component: SceneMinimalCountdownComponent as unknown as React.ComponentType<MotionGraphicProps>,
  configSchema: [
    { key: 'countFrom', label: 'Count From', type: 'number', defaultValue: 5, min: 1, max: 30, group: 'Content' },
    { key: 'fontSize', label: 'Font Size (vw)', type: 'number', defaultValue: 25, min: 10, max: 50, group: 'Layout' },
    { key: 'textColor', label: 'Text Color', type: 'color', defaultValue: '#FFFFFF', group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#000000', group: 'Style' },
  ],
  defaultConfig: {
    countFrom: 5,
    textColor: '#FFFFFF',
    bgColor: '#000000',
    fontSize: 25,
  },
})
