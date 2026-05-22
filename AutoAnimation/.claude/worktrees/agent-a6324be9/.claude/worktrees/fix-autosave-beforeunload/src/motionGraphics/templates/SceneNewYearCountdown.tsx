import React from 'react'
import { registerMotionGraphic } from '../registry'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface NewYearConfig {
  startFrom: number
  celebrationText: string
  numberColor: string
  bgColor: string
  confettiColors: string
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

// Deterministic pseudo-random from seed
function seededRandom(seed: number): number {
  const x = Math.sin(seed * 9301 + 49297) * 49297
  return x - Math.floor(x)
}

function SceneNewYearCountdownComponent({
  config,
  progress,
  width,
  height,
}: MotionGraphicProps<NewYearConfig>) {
  const { startFrom, celebrationText, numberColor, bgColor, confettiColors } = config
  const colors = confettiColors.split(',').map((c) => c.trim())

  const enterProgress = progress < 0.08 ? progress / 0.08 : 1
  const exitProgress = progress >= 0.92 ? (progress - 0.92) / 0.08 : 0
  const holdProgress = progress >= 0.08 && progress < 0.92 ? (progress - 0.08) / 0.84 : progress >= 0.92 ? 1 : 0

  const count = Math.max(1, Math.round(startFrom))
  // Reserve last 25% of hold for celebration
  const countdownPortion = 0.75
  const celebrationStart = countdownPortion

  const isCelebrating = holdProgress >= celebrationStart
  const countdownProgress = Math.min(1, holdProgress / countdownPortion)
  const currentNumber = isCelebrating ? 0 : Math.max(0, count - Math.floor(countdownProgress * count))
  const localProgress = isCelebrating ? 0 : (countdownProgress * count) % 1

  // Number animation: slam in with overshoot
  const numberEnter = localProgress < 0.3 ? localProgress / 0.3 : 1
  const numberExit = localProgress > 0.7 ? (localProgress - 0.7) / 0.3 : 0
  const slamScale = easeOutBack(numberEnter)
  const fadeScale = 1 + numberExit * 0.5
  const fadeOpacity = 1 - easeOutCubic(numberExit)

  // Impact ring
  const impactOpacity = numberEnter < 0.5 ? (0.5 - numberEnter) * 2 : 0
  const impactScale = 1 + numberEnter * 2

  // Overall enter/exit
  const enterScale = elasticOut(enterProgress)
  const exitOpacity = 1 - easeOutCubic(exitProgress)

  // Celebration
  const celebProgress = isCelebrating
    ? (holdProgress - celebrationStart) / (1 - celebrationStart)
    : 0
  const celebScale = isCelebrating ? elasticOut(Math.min(1, celebProgress * 2)) : 0
  const celebOpacity = isCelebrating ? easeOutCubic(Math.min(1, celebProgress * 3)) : 0

  // Confetti particles
  const confettiCount = 60
  const confettiPieces = []
  if (isCelebrating) {
    for (let i = 0; i < confettiCount; i++) {
      const seed = i + 1
      const x = seededRandom(seed) * 100
      const startY = -10 - seededRandom(seed * 2) * 30
      const endY = 110 + seededRandom(seed * 3) * 20
      const y = startY + (endY - startY) * celebProgress
      const rot = seededRandom(seed * 4) * 360 + celebProgress * 720
      const color = colors[i % colors.length] || '#FFD700'
      const size = 6 + seededRandom(seed * 5) * 10
      const delay = seededRandom(seed * 6) * 0.3
      const op = Math.max(0, Math.min(1, (celebProgress - delay) * 3)) * (1 - Math.max(0, celebProgress - 0.7) / 0.3)
      const wobbleX = Math.sin(celebProgress * Math.PI * 4 + seed) * 15

      confettiPieces.push(
        <div
          key={i}
          style={{
            position: 'absolute',
            left: `${x}%`,
            top: `${y}%`,
            width: size,
            height: size * 0.6,
            background: color,
            borderRadius: size * 0.15,
            transform: `rotate(${rot}deg) translateX(${wobbleX}px)`,
            opacity: op,
          }}
        />,
      )
    }
  }

  // Screen shake on number slam
  const shakeX = numberEnter < 0.2 ? (1 - numberEnter / 0.2) * (Math.sin(numberEnter * 80) * 4) : 0
  const shakeY = numberEnter < 0.2 ? (1 - numberEnter / 0.2) * (Math.cos(numberEnter * 80) * 3) : 0

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
        transform: `translate(${shakeX}px, ${shakeY}px)`,
      }}
    >
      {/* Confetti layer */}
      {confettiPieces}

      {/* Impact ring */}
      {!isCelebrating && (
        <div
          style={{
            position: 'absolute',
            width: Math.min(width, height) * 0.5,
            height: Math.min(width, height) * 0.5,
            borderRadius: '50%',
            border: `3px solid ${numberColor}`,
            transform: `scale(${impactScale * enterScale})`,
            opacity: impactOpacity * exitOpacity,
          }}
        />
      )}

      {/* Countdown number */}
      {!isCelebrating && currentNumber > 0 && (
        <div
          style={{
            fontSize: `clamp(100px, 30vw, ${Math.min(width, height) * 0.6}px)`,
            fontWeight: 900,
            fontFamily: "'Arial Black', Impact, sans-serif",
            color: numberColor,
            transform: `scale(${slamScale * fadeScale * enterScale})`,
            opacity: fadeOpacity * exitOpacity,
            textShadow: `0 0 60px ${numberColor}50, 0 0 120px ${numberColor}20`,
            lineHeight: 1,
          }}
        >
          {currentNumber}
        </div>
      )}

      {/* Celebration text */}
      {isCelebrating && (
        <div
          style={{
            fontSize: `clamp(24px, 7vw, ${Math.min(width, height) * 0.12}px)`,
            fontWeight: 900,
            fontFamily: "'Arial Black', Impact, sans-serif",
            color: numberColor,
            textAlign: 'center',
            transform: `scale(${celebScale})`,
            opacity: celebOpacity * exitOpacity,
            textShadow: `0 0 40px ${numberColor}60`,
            lineHeight: 1.3,
            padding: '0 5%',
          }}
        >
          {celebrationText}
        </div>
      )}

      {/* Flash overlay at celebration start */}
      {isCelebrating && celebProgress < 0.15 && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: numberColor,
            opacity: (0.15 - celebProgress) / 0.15 * 0.6,
          }}
        />
      )}
    </div>
  )
}

registerMotionGraphic({
  id: 'tpl-scene-new-year-countdown',
  title: 'New Year Countdown',
  description:
    'Full-screen numbers slam in one at a time with impact effects, culminating in celebration text and confetti',
  tags: ['scene', 'countdown', 'celebration', 'new-year', 'party', 'confetti'],
  category: 'scene-layout',
  component: SceneNewYearCountdownComponent as unknown as React.ComponentType<MotionGraphicProps>,
  configSchema: [
    { key: 'startFrom', label: 'Count From', type: 'number', defaultValue: 10, min: 3, max: 30, group: 'Content' },
    { key: 'celebrationText', label: 'Celebration Text', type: 'text', defaultValue: 'HAPPY NEW YEAR!', group: 'Content' },
    { key: 'numberColor', label: 'Number Color', type: 'color', defaultValue: '#FFD700', group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#0A0A1A', group: 'Style' },
    { key: 'confettiColors', label: 'Confetti Colors (comma-separated)', type: 'text', defaultValue: '#FFD700,#FF3366,#00D4FF,#22C55E,#A855F7', group: 'Style' },
  ],
  defaultConfig: {
    startFrom: 10,
    celebrationText: 'HAPPY NEW YEAR!',
    numberColor: '#FFD700',
    bgColor: '#0A0A1A',
    confettiColors: '#FFD700,#FF3366,#00D4FF,#22C55E,#A855F7',
  },
})
