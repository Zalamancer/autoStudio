import React from 'react'
import { registerMotionGraphic } from '../registry'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface LaunchCountdownConfig {
  launchLabel: string
  countdownFrom: number
  accentColor: string
  bgColor: string
  textColor: string
}

function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3)
}

function easeOutQuart(t: number): number {
  return 1 - Math.pow(1 - t, 4)
}

function elasticOut(t: number): number {
  if (t === 0 || t === 1) return t
  return Math.pow(2, -10 * t) * Math.sin((t - 0.075) * (2 * Math.PI) / 0.3) + 1
}

function seededRandom(seed: number): number {
  const x = Math.sin(seed * 9301 + 49297) * 49297
  return x - Math.floor(x)
}

function SceneLaunchCountdownComponent({
  config,
  progress,
  width,
  height,
  frame,
}: MotionGraphicProps<LaunchCountdownConfig>) {
  const { launchLabel, countdownFrom, accentColor, bgColor, textColor } = config

  const enterProgress = progress < 0.12 ? progress / 0.12 : 1
  const exitProgress = progress >= 0.88 ? (progress - 0.88) / 0.12 : 0
  const holdProgress = progress >= 0.12 && progress < 0.88 ? (progress - 0.12) / 0.76 : progress >= 0.88 ? 1 : 0

  // Reserve last 20% of hold for "LAUNCHED!" state
  const launchPhase = 0.8
  const isLaunched = holdProgress >= launchPhase
  const countdownProg = Math.min(1, holdProgress / launchPhase)
  const remaining = isLaunched ? 0 : Math.max(0, Math.ceil(countdownFrom * (1 - countdownProg)))

  // Side progress bars fill up to launch
  const sideProgress = countdownProg

  // Scan line sweep
  const scanY = (frame * 1.5) % (height + 40) - 20

  // Enter
  const enterEased = easeOutCubic(enterProgress)
  const gridFadeIn = enterEased
  const textSlideIn = easeOutQuart(Math.max(0, (enterProgress - 0.2) / 0.8))

  // Exit
  const exitEased = easeOutCubic(exitProgress)
  const fadeOut = 1 - exitEased

  // Launch flash
  const launchProgress = isLaunched ? (holdProgress - launchPhase) / (1 - launchPhase) : 0
  const flashOpacity = isLaunched && launchProgress < 0.2 ? (0.2 - launchProgress) / 0.2 * 0.8 : 0
  const launchedScale = isLaunched ? elasticOut(Math.min(1, launchProgress * 2)) : 0
  const launchedOpacity = isLaunched ? easeOutCubic(Math.min(1, launchProgress * 3)) : 0

  // Digital number formatting
  const numStr = String(remaining).padStart(2, '0')

  // Grid lines
  const gridLines = []
  const gridSpacing = 60
  for (let i = 0; i < Math.ceil(width / gridSpacing) + 1; i++) {
    gridLines.push(
      <line
        key={`v-${i}`}
        x1={i * gridSpacing}
        y1={0}
        x2={i * gridSpacing}
        y2={height}
        stroke={accentColor}
        strokeWidth={0.5}
        opacity={0.1}
      />,
    )
  }
  for (let i = 0; i < Math.ceil(height / gridSpacing) + 1; i++) {
    gridLines.push(
      <line
        key={`h-${i}`}
        x1={0}
        y1={i * gridSpacing}
        x2={width}
        y2={i * gridSpacing}
        stroke={accentColor}
        strokeWidth={0.5}
        opacity={0.1}
      />,
    )
  }

  // Particle dots for tech feel
  const particles = []
  for (let i = 0; i < 20; i++) {
    const seed = i + 1
    const px = seededRandom(seed) * width
    const py = seededRandom(seed * 2) * height
    const size = 2 + seededRandom(seed * 3) * 3
    const blink = Math.sin(progress * Math.PI * 6 + seed * 2) * 0.5 + 0.5
    particles.push(
      <circle
        key={`p-${i}`}
        cx={px}
        cy={py}
        r={size}
        fill={accentColor}
        opacity={blink * 0.3 * gridFadeIn}
      />,
    )
  }

  const barWidth = Math.max(6, width * 0.012)
  const barMargin = Math.max(20, width * 0.05)

  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        background: bgColor,
        overflow: 'hidden',
        fontFamily: "'Courier New', 'Lucida Console', monospace",
      }}
    >
      {/* Grid background */}
      <svg
        width={width}
        height={height}
        style={{ position: 'absolute', inset: 0, opacity: gridFadeIn * fadeOut }}
      >
        {gridLines}
        {particles}
      </svg>

      {/* Scan line */}
      <div
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          top: scanY,
          height: 2,
          background: `linear-gradient(90deg, transparent, ${accentColor}40, transparent)`,
          opacity: gridFadeIn * fadeOut * 0.6,
        }}
      />

      {/* Left progress bar */}
      <div
        style={{
          position: 'absolute',
          left: barMargin,
          top: '15%',
          bottom: '15%',
          width: barWidth,
          borderRadius: barWidth,
          background: `${accentColor}15`,
          overflow: 'hidden',
          opacity: textSlideIn * fadeOut,
        }}
      >
        <div
          style={{
            position: 'absolute',
            bottom: 0,
            width: '100%',
            height: `${sideProgress * 100}%`,
            background: `linear-gradient(0deg, ${accentColor}, ${accentColor}80)`,
            borderRadius: barWidth,
            boxShadow: `0 0 10px ${accentColor}60`,
          }}
        />
      </div>

      {/* Right progress bar */}
      <div
        style={{
          position: 'absolute',
          right: barMargin,
          top: '15%',
          bottom: '15%',
          width: barWidth,
          borderRadius: barWidth,
          background: `${accentColor}15`,
          overflow: 'hidden',
          opacity: textSlideIn * fadeOut,
        }}
      >
        <div
          style={{
            position: 'absolute',
            bottom: 0,
            width: '100%',
            height: `${sideProgress * 100}%`,
            background: `linear-gradient(0deg, ${accentColor}, ${accentColor}80)`,
            borderRadius: barWidth,
            boxShadow: `0 0 10px ${accentColor}60`,
          }}
        />
      </div>

      {/* Center content */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          opacity: fadeOut,
        }}
      >
        {/* Header label */}
        {!isLaunched && (
          <div
            style={{
              fontSize: 'clamp(12px, 2vw, 22px)',
              fontWeight: 700,
              color: accentColor,
              letterSpacing: 6,
              textTransform: 'uppercase',
              opacity: textSlideIn,
              transform: `translateY(${(1 - textSlideIn) * -30}px)`,
              marginBottom: 'clamp(8px, 2vw, 20px)',
            }}
          >
            {launchLabel}
          </div>
        )}

        {/* Countdown number */}
        {!isLaunched && (
          <div
            style={{
              fontSize: `clamp(60px, 20vw, ${Math.min(width, height) * 0.4}px)`,
              fontWeight: 900,
              color: textColor,
              opacity: textSlideIn,
              textShadow: `0 0 30px ${accentColor}40, 0 0 60px ${accentColor}20`,
              lineHeight: 1,
              fontVariantNumeric: 'tabular-nums',
            }}
          >
            {numStr}
          </div>
        )}

        {/* T-minus label */}
        {!isLaunched && (
          <div
            style={{
              fontSize: 'clamp(10px, 1.5vw, 16px)',
              fontWeight: 600,
              color: `${accentColor}AA`,
              letterSpacing: 4,
              marginTop: 'clamp(8px, 1.5vw, 16px)',
              opacity: textSlideIn,
            }}
          >
            T-MINUS {numStr} SECONDS
          </div>
        )}

        {/* LAUNCHED text */}
        {isLaunched && (
          <div
            style={{
              fontSize: `clamp(36px, 10vw, ${Math.min(width, height) * 0.15}px)`,
              fontWeight: 900,
              color: accentColor,
              transform: `scale(${launchedScale})`,
              opacity: launchedOpacity,
              textShadow: `0 0 40px ${accentColor}80, 0 0 80px ${accentColor}40`,
              letterSpacing: 8,
            }}
          >
            LAUNCHED!
          </div>
        )}
      </div>

      {/* Flash overlay */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: accentColor,
          opacity: flashOpacity,
          pointerEvents: 'none',
        }}
      />
    </div>
  )
}

registerMotionGraphic({
  id: 'tpl-scene-launch-countdown',
  title: 'Launch Countdown',
  description:
    'Futuristic product launch countdown with tech grid, side progress bars, scan lines, and dramatic launch moment',
  tags: ['scene', 'countdown', 'timer', 'launch', 'tech', 'futuristic', 'product'],
  category: 'scene-layout',
  component: SceneLaunchCountdownComponent as unknown as React.ComponentType<MotionGraphicProps>,
  configSchema: [
    { key: 'launchLabel', label: 'Launch Label', type: 'text', defaultValue: 'LAUNCHING IN...', group: 'Content' },
    { key: 'countdownFrom', label: 'Count From', type: 'number', defaultValue: 10, min: 3, max: 60, group: 'Content' },
    { key: 'accentColor', label: 'Accent Color', type: 'color', defaultValue: '#00FF88', group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#0A0F1A', group: 'Style' },
    { key: 'textColor', label: 'Text Color', type: 'color', defaultValue: '#FFFFFF', group: 'Style' },
  ],
  defaultConfig: {
    launchLabel: 'LAUNCHING IN...',
    countdownFrom: 10,
    accentColor: '#00FF88',
    bgColor: '#0A0F1A',
    textColor: '#FFFFFF',
  },
})
