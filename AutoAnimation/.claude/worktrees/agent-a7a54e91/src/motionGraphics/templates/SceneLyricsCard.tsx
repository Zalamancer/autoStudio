import React from 'react'
import { registerMotionGraphic } from '../registry'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface LyricsCardConfig {
  previousLine: string
  currentLine: string
  nextLine: string
  bgColor: string
  textColor: string
  accentColor: string
  highlightColor: string
}

function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3)
}

function easeInCubic(t: number): number {
  return t * t * t
}

function SceneLyricsCardComponent({
  config,
  frame,
  durationInFrames,
}: MotionGraphicProps<LyricsCardConfig>) {
  const { previousLine, currentLine, nextLine, bgColor, textColor, accentColor, highlightColor } =
    config
  const progress = frame / durationInFrames

  const enterEnd = 0.2
  const holdEnd = 0.8
  const enterProgress = Math.min(1, progress / enterEnd)
  const holdProgress =
    progress >= enterEnd && progress < holdEnd
      ? (progress - enterEnd) / (holdEnd - enterEnd)
      : progress >= holdEnd
        ? 1
        : 0
  const exitProgress = progress >= holdEnd ? (progress - holdEnd) / (1 - holdEnd) : 0

  // Lines slide up on enter
  const slideUp = easeOutCubic(enterProgress)
  const prevY = (1 - slideUp) * 40
  const currY = (1 - slideUp) * 50
  const nextY = (1 - slideUp) * 60

  // Previous line fades
  const prevOpacity = 0.35 * slideUp
  // Current line
  const currOpacity = slideUp
  // Next line fades
  const nextOpacity = 0.3 * slideUp

  // Hold: highlight sweeps across current line
  const highlightWidth = holdProgress * 100

  // Exit: all lines slide up and fade
  const exitEased = easeInCubic(exitProgress)
  const exitSlide = exitEased * -60
  const exitOpacity = 1 - exitEased

  // Subtle glow pulse on current line during hold
  const glowIntensity = 0.3 + 0.15 * Math.sin(holdProgress * Math.PI * 4)

  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        overflow: 'hidden',
        background: bgColor,
        fontFamily: "'Helvetica Neue', -apple-system, sans-serif",
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 'clamp(16px, 4vw, 36px)',
        padding: '5%',
      }}
    >
      {/* Ambient background gradient */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: `radial-gradient(ellipse at 50% 50%, ${accentColor}0A 0%, transparent 70%)`,
        }}
      />

      {/* Previous line */}
      <div
        style={{
          fontSize: 'clamp(14px, 3vw, 24px)',
          fontWeight: 400,
          color: `${textColor}`,
          opacity: prevOpacity * exitOpacity,
          transform: `translateY(${prevY + exitSlide}px)`,
          textAlign: 'center',
          maxWidth: '85%',
          lineHeight: 1.4,
          letterSpacing: '0.01em',
        }}
      >
        {previousLine}
      </div>

      {/* Current line (highlighted) */}
      <div
        style={{
          position: 'relative',
          fontSize: 'clamp(24px, 6vw, 52px)',
          fontWeight: 700,
          color: textColor,
          opacity: currOpacity * exitOpacity,
          transform: `translateY(${currY + exitSlide}px)`,
          textAlign: 'center',
          maxWidth: '90%',
          lineHeight: 1.3,
          letterSpacing: '-0.01em',
          textShadow: `0 0 ${glowIntensity * 40}px ${accentColor}${Math.round(glowIntensity * 60).toString(16).padStart(2, '0')}`,
        }}
      >
        {/* Highlight overlay using clip */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: highlightColor,
            clipPath: `inset(0 ${100 - highlightWidth}% 0 0)`,
            fontWeight: 700,
            fontSize: 'inherit',
            letterSpacing: 'inherit',
            lineHeight: 'inherit',
          }}
        >
          {currentLine}
        </div>
        {currentLine}
      </div>

      {/* Next line */}
      <div
        style={{
          fontSize: 'clamp(14px, 3vw, 24px)',
          fontWeight: 400,
          color: `${textColor}`,
          opacity: nextOpacity * exitOpacity,
          transform: `translateY(${nextY + exitSlide}px)`,
          textAlign: 'center',
          maxWidth: '85%',
          lineHeight: 1.4,
          letterSpacing: '0.01em',
        }}
      >
        {nextLine}
      </div>

      {/* Decorative line separator */}
      <div
        style={{
          position: 'absolute',
          bottom: '12%',
          left: '50%',
          transform: `translateX(-50%) scaleX(${slideUp * exitOpacity})`,
          width: 'clamp(40px, 8vw, 60px)',
          height: 2,
          background: `${accentColor}40`,
          borderRadius: 1,
        }}
      />
    </div>
  )
}

registerMotionGraphic({
  id: 'tpl-scene-lyrics-card',
  title: 'Scene Lyrics Card',
  description:
    'Song lyrics display with current line large and highlighted, previous/next lines faded. Highlight sweeps across during hold. Clean lyric video aesthetic.',
  tags: ['scene', 'music', 'lyrics', 'karaoke', 'song', 'text', 'lyric-video'],
  category: 'scene-layout',
  component: SceneLyricsCardComponent as unknown as React.ComponentType<MotionGraphicProps>,
  defaultConfig: {
    previousLine: 'Walking through the city lights',
    currentLine: 'We found love in the neon glow',
    nextLine: 'Dancing till the morning comes',
    bgColor: '#0A0A14',
    textColor: '#FFFFFF',
    accentColor: '#8B5CF6',
    highlightColor: '#C084FC',
  },
  configSchema: [
    { key: 'previousLine', label: 'Previous Line', type: 'text', defaultValue: 'Walking through the city lights', group: 'Content' },
    { key: 'currentLine', label: 'Current Line', type: 'text', defaultValue: 'We found love in the neon glow', group: 'Content' },
    { key: 'nextLine', label: 'Next Line', type: 'text', defaultValue: 'Dancing till the morning comes', group: 'Content' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#0A0A14', group: 'Style' },
    { key: 'textColor', label: 'Text Color', type: 'color', defaultValue: '#FFFFFF', group: 'Style' },
    { key: 'accentColor', label: 'Accent Color', type: 'color', defaultValue: '#8B5CF6', group: 'Style' },
    { key: 'highlightColor', label: 'Highlight Color', type: 'color', defaultValue: '#C084FC', group: 'Style' },
  ],
})
