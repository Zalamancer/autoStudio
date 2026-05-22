import React from 'react'
import { registerMotionGraphic } from '../registry'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface SceneGhostStoryConfig {
  storyTitle: string
  storyText: string
  location: string
  dateReported: string
  bgColor: string
  textColor: string
  accentColor: string
  fogColor: string
}

function easeOutCubic(t: number): number { return 1 - Math.pow(1 - t, 3) }
function easeInCubic(t: number): number { return t * t * t }

function SceneGhostStoryComponent({ config, progress, frame }: MotionGraphicProps<SceneGhostStoryConfig>) {
  const { storyTitle, storyText, location, dateReported, bgColor, textColor, accentColor, fogColor } = config
  const f = frame ?? 0

  const enterProgress = progress < 0.2 ? progress / 0.2 : 1
  const holdProgress = progress >= 0.2 && progress < 0.8 ? (progress - 0.2) / 0.6 : progress >= 0.8 ? 1 : 0
  const exitProgress = progress >= 0.8 ? (progress - 0.8) / 0.2 : 0

  const exitOpacity = exitProgress > 0 ? 1 - easeInCubic(exitProgress) : 1

  // Drifting fog layers
  const fogX1 = (f * 0.2) % 200 - 50
  const fogX2 = 100 - (f * 0.15) % 200
  const fogPulse = 0.15 + Math.sin(f * 0.03) * 0.05

  // Text reveal: characters fade in progressively during hold
  const textRevealProgress = easeOutCubic(Math.min(1, holdProgress * 2))
  const charsToShow = Math.floor(storyText.length * textRevealProgress)

  // Eerie glow pulse
  const glowPulse = 0.3 + Math.sin(f * 0.05) * 0.1

  const titleEnter = easeOutCubic(Math.min(1, enterProgress * 1.5))
  const cardEnter = easeOutCubic(Math.max(0, enterProgress - 0.2) / 0.8)
  const locationEnter = easeOutCubic(Math.max(0, enterProgress - 0.5) / 0.5)

  return (
    <div style={{ position: 'absolute', inset: 0, overflow: 'hidden' }}>
      {/* Background */}
      <div style={{ position: 'absolute', inset: 0, background: `radial-gradient(ellipse at 50% 30%, #0f0f1a, ${bgColor})` }} />

      {/* Fog layers */}
      <div
        style={{
          position: 'absolute',
          left: `${fogX1}%`,
          top: '50%',
          width: '150%',
          height: '40%',
          background: `radial-gradient(ellipse, ${fogColor}, transparent 60%)`,
          opacity: fogPulse,
          transform: 'translateY(-50%)',
        }}
      />
      <div
        style={{
          position: 'absolute',
          left: `${fogX2}%`,
          top: '60%',
          width: '120%',
          height: '30%',
          background: `radial-gradient(ellipse, ${fogColor}, transparent 50%)`,
          opacity: fogPulse * 0.7,
          transform: 'translateY(-50%)',
        }}
      />

      <div
        style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '8%',
          opacity: exitOpacity,
        }}
      >
        {/* Ghost icon */}
        <div
          style={{
            fontSize: 'clamp(24px, 6vw, 44px)',
            marginBottom: 'clamp(8px, 2vw, 16px)',
            opacity: titleEnter * (0.6 + Math.sin(f * 0.06) * 0.15),
            filter: `drop-shadow(0 0 ${glowPulse * 30}px ${accentColor}44)`,
          }}
        >
          {'\ud83d\udc7b'}
        </div>

        {/* Title */}
        <div
          style={{
            fontFamily: "'Georgia', serif",
            fontSize: 'clamp(18px, 4.5vw, 32px)',
            fontWeight: 700,
            color: accentColor,
            textAlign: 'center',
            textTransform: 'uppercase',
            letterSpacing: '0.12em',
            marginBottom: 'clamp(6px, 1.5vw, 12px)',
            opacity: titleEnter,
            transform: `translateY(${(1 - titleEnter) * 20}px)`,
            textShadow: `0 0 20px ${accentColor}33`,
          }}
        >
          {storyTitle}
        </div>

        {/* Location & date */}
        <div
          style={{
            display: 'flex',
            gap: 'clamp(8px, 2vw, 16px)',
            marginBottom: 'clamp(14px, 3.5vw, 24px)',
            opacity: locationEnter * 0.6,
            transform: `translateY(${(1 - locationEnter) * 10}px)`,
          }}
        >
          <span style={{ fontFamily: "'Inter', sans-serif", fontSize: 'clamp(9px, 1.8vw, 13px)', color: `${textColor}66`, letterSpacing: '0.05em' }}>
            {location}
          </span>
          <span style={{ color: `${textColor}33` }}>|</span>
          <span style={{ fontFamily: "'Inter', sans-serif", fontSize: 'clamp(9px, 1.8vw, 13px)', color: `${textColor}66`, letterSpacing: '0.05em' }}>
            {dateReported}
          </span>
        </div>

        {/* Story card */}
        <div
          style={{
            background: 'rgba(10, 10, 20, 0.7)',
            borderRadius: 'clamp(8px, 2vw, 14px)',
            border: `1px solid ${accentColor}22`,
            padding: 'clamp(16px, 4vw, 32px)',
            maxWidth: 'clamp(280px, 75vw, 440px)',
            opacity: cardEnter,
            transform: `translateY(${(1 - cardEnter) * 15}px)`,
            boxShadow: `inset 0 0 30px rgba(0,0,0,0.3), 0 0 20px ${accentColor}08`,
          }}
        >
          {/* Story text with progressive reveal */}
          <div
            style={{
              fontFamily: "'Georgia', serif",
              fontSize: 'clamp(12px, 2.5vw, 18px)',
              color: textColor,
              lineHeight: 1.7,
              opacity: 0.85,
            }}
          >
            {storyText.slice(0, charsToShow)}
            {charsToShow < storyText.length && (
              <span style={{ opacity: f % 20 < 12 ? 0.5 : 0, color: accentColor }}>|</span>
            )}
          </div>
        </div>

        {/* Ornamental bottom */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            marginTop: 'clamp(12px, 3vw, 20px)',
            opacity: locationEnter * 0.4,
          }}
        >
          <div style={{ width: 20, height: 1, background: `${accentColor}44` }} />
          <div style={{ fontSize: 8, color: `${accentColor}66` }}>&#x2666;</div>
          <div style={{ width: 20, height: 1, background: `${accentColor}44` }} />
        </div>
      </div>
    </div>
  )
}

registerMotionGraphic({
  id: 'tpl-scene-ghost-story',
  title: 'Ghost Story Card',
  description: 'Ghost story card with fog effects, progressive text reveal, eerie glow, and supernatural atmosphere',
  tags: ['scene', 'horror', 'ghost', 'story', 'creepy', 'fog', 'supernatural', 'narrative'],
  category: 'scene-layout',
  component: SceneGhostStoryComponent as any,
  defaultConfig: {
    storyTitle: 'The Whispering Hall',
    storyText: 'Every night at 3:17 AM, the old grandfather clock chimes thirteen times. Those who count each chime hear a voice calling their name from the darkness below...',
    location: 'Blackwood Manor',
    dateReported: 'Oct 1897',
    bgColor: '#060610',
    textColor: '#d0d0e0',
    accentColor: '#7070aa',
    fogColor: 'rgba(80, 80, 120, 0.12)',
  },
  configSchema: [
    { key: 'storyTitle', label: 'Story Title', type: 'text', defaultValue: 'The Whispering Hall', group: 'Content' },
    { key: 'storyText', label: 'Story Text', type: 'text', defaultValue: 'Every night at 3:17 AM, the old grandfather clock chimes thirteen times...', group: 'Content' },
    { key: 'location', label: 'Location', type: 'text', defaultValue: 'Blackwood Manor', group: 'Content' },
    { key: 'dateReported', label: 'Date Reported', type: 'text', defaultValue: 'Oct 1897', group: 'Content' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#060610', group: 'Style' },
    { key: 'textColor', label: 'Text Color', type: 'color', defaultValue: '#d0d0e0', group: 'Style' },
    { key: 'accentColor', label: 'Accent Color', type: 'color', defaultValue: '#7070aa', group: 'Style' },
    { key: 'fogColor', label: 'Fog Color', type: 'color', defaultValue: 'rgba(80, 80, 120, 0.12)', group: 'Style' },
  ],
})
