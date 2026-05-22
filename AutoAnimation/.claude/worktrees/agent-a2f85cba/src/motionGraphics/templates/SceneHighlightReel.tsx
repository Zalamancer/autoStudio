import React from 'react'
import { registerMotionGraphic } from '../registry'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface SceneHighlightReelConfig {
  title: string
  subtitle: string
  playNumber: number
  bgColor: string
  accentColor: string
  textColor: string
  secondaryColor: string
}

function easeOutCubic(t: number): number { return 1 - Math.pow(1 - t, 3) }
function easeInCubic(t: number): number { return t * t * t }
function easeOutBack(t: number): number {
  const c1 = 1.70158
  const c3 = c1 + 1
  return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2)
}

function SceneHighlightReelComponent({ config, progress }: MotionGraphicProps<SceneHighlightReelConfig>) {
  const { title, subtitle, playNumber, bgColor, accentColor, textColor, secondaryColor } = config

  const enterProgress = progress < 0.2 ? progress / 0.2 : 1
  const holdProgress = progress >= 0.2 && progress < 0.8 ? (progress - 0.2) / 0.6 : progress >= 0.8 ? 1 : 0
  const exitProgress = progress >= 0.8 ? (progress - 0.8) / 0.2 : 0

  // Speed lines converge
  const linesConverge = easeOutCubic(Math.min(1, enterProgress / 0.6))

  // Text slams in
  const textSlam = easeOutBack(Math.max(0, Math.min(1, (enterProgress - 0.2) / 0.5)))

  // Play number pops
  const numberPop = easeOutBack(Math.max(0, Math.min(1, (enterProgress - 0.35) / 0.4)))

  // Subtitle fades
  const subtitleFade = easeOutCubic(Math.max(0, Math.min(1, (enterProgress - 0.55) / 0.3)))

  // Hold: speed lines continue moving
  const isHolding = progress >= 0.2 && progress < 0.8
  const lineShift = isHolding ? holdProgress * 100 : 0
  const pulse = isHolding ? 0.8 + Math.sin(holdProgress * Math.PI * 4) * 0.2 : 1

  // Exit
  const exitEased = easeInCubic(exitProgress)
  const exitOpacity = 1 - exitEased
  const exitZoom = 1 + exitEased * 0.5

  // Generate speed lines
  const speedLines = Array.from({ length: 16 }, (_, i) => {
    const angle = (i / 16) * 360
    const delay = (i % 4) * 0.1
    const lineProgress = easeOutCubic(Math.max(0, Math.min(1, (linesConverge - delay) / (1 - delay))))
    return { angle, lineProgress, index: i }
  })

  return (
    <div style={{ position: 'absolute', inset: 0, overflow: 'hidden' }}>
      <div style={{ position: 'absolute', inset: 0, background: bgColor }} />

      {/* Radial gradient background */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: `radial-gradient(circle at center, ${accentColor}15 0%, transparent 70%)`,
          opacity: linesConverge,
        }}
      />

      {/* Speed lines */}
      {speedLines.map(({ angle, lineProgress, index }) => {
        const rad = (angle * Math.PI) / 180
        const startDist = 140 - lineProgress * 80
        const length = lineProgress * 60 + (isHolding ? Math.sin(lineShift * 0.1 + index) * 10 : 0)
        const x1 = 50 + Math.cos(rad) * startDist
        const y1 = 50 + Math.sin(rad) * startDist
        const x2 = 50 + Math.cos(rad) * (startDist - length)
        const y2 = 50 + Math.sin(rad) * (startDist - length)
        return (
          <div
            key={index}
            style={{
              position: 'absolute',
              left: `${Math.min(x1, x2)}%`,
              top: `${Math.min(y1, y2)}%`,
              width: `${Math.abs(x2 - x1) + 0.5}%`,
              height: `${Math.abs(y2 - y1) + 0.5}%`,
              background: index % 2 === 0 ? accentColor : secondaryColor,
              opacity: lineProgress * 0.6 * pulse * exitOpacity,
              borderRadius: 2,
              transform: `rotate(${angle}deg)`,
              transformOrigin: 'center',
            }}
          />
        )
      })}

      {/* Main content */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          opacity: exitOpacity,
          transform: `scale(${exitZoom})`,
        }}
      >
        {/* Play number badge */}
        <div
          style={{
            transform: `scale(${numberPop})`,
            marginBottom: 'clamp(8px, 1.5vw, 16px)',
          }}
        >
          <div
            style={{
              fontFamily: "'Inter', 'Helvetica Neue', sans-serif",
              fontSize: 'clamp(10px, 1.6vw, 14px)',
              fontWeight: 800,
              color: bgColor,
              background: accentColor,
              padding: 'clamp(4px, 0.8vw, 8px) clamp(14px, 3vw, 28px)',
              borderRadius: 'clamp(3px, 0.5vw, 5px)',
              textTransform: 'uppercase',
              letterSpacing: '0.2em',
              boxShadow: `0 4px 20px ${accentColor}50`,
            }}
          >
            #{playNumber}
          </div>
        </div>

        {/* Title text */}
        <div
          style={{
            fontFamily: "'Inter', 'Helvetica Neue', sans-serif",
            fontSize: 'clamp(32px, 9vw, 80px)',
            fontWeight: 900,
            color: textColor,
            textTransform: 'uppercase',
            letterSpacing: '-0.02em',
            lineHeight: 1,
            transform: `scale(${textSlam})`,
            textShadow: `0 0 40px ${accentColor}30, 0 4px 0 ${accentColor}20`,
            textAlign: 'center',
            padding: '0 5%',
          }}
        >
          {title}
        </div>

        {/* Accent line */}
        <div
          style={{
            width: `${textSlam * 60}%`,
            maxWidth: 300,
            height: 'clamp(3px, 0.5vw, 5px)',
            background: `linear-gradient(90deg, transparent, ${accentColor}, transparent)`,
            margin: 'clamp(10px, 2vw, 20px) 0',
            borderRadius: 4,
            boxShadow: `0 0 10px ${accentColor}60`,
          }}
        />

        {/* Subtitle */}
        <div
          style={{
            fontFamily: "'Inter', 'Helvetica Neue', sans-serif",
            fontSize: 'clamp(12px, 2.2vw, 20px)',
            fontWeight: 600,
            color: `${textColor}90`,
            textTransform: 'uppercase',
            letterSpacing: '0.15em',
            opacity: subtitleFade,
            transform: `translateY(${(1 - subtitleFade) * 15}px)`,
          }}
        >
          {subtitle}
        </div>
      </div>
    </div>
  )
}

registerMotionGraphic({
  id: 'tpl-scene-highlight-reel',
  title: 'Highlight Reel',
  description: 'ESPN-style highlight reel intro with converging speed lines, slamming text, and play number badge. Energetic sports motion graphics.',
  tags: ['scene', 'sports', 'highlights', 'top-plays', 'espn', 'reel', 'athletics'],
  category: 'scene-layout',
  component: SceneHighlightReelComponent as any,
  defaultConfig: {
    title: 'TOP PLAYS',
    subtitle: 'WEEK 12 HIGHLIGHTS',
    playNumber: 1,
    bgColor: '#0a0a0a',
    accentColor: '#ff2d2d',
    textColor: '#ffffff',
    secondaryColor: '#fbbf24',
  },
  configSchema: [
    { key: 'title', label: 'Title', type: 'text', defaultValue: 'TOP PLAYS', group: 'Content' },
    { key: 'subtitle', label: 'Subtitle', type: 'text', defaultValue: 'WEEK 12 HIGHLIGHTS', group: 'Content' },
    { key: 'playNumber', label: 'Play Number', type: 'number', defaultValue: 1, min: 1, max: 100, group: 'Content' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#0a0a0a', group: 'Style' },
    { key: 'accentColor', label: 'Accent', type: 'color', defaultValue: '#ff2d2d', group: 'Style' },
    { key: 'textColor', label: 'Text Color', type: 'color', defaultValue: '#ffffff', group: 'Style' },
    { key: 'secondaryColor', label: 'Secondary', type: 'color', defaultValue: '#fbbf24', group: 'Style' },
  ],
})
