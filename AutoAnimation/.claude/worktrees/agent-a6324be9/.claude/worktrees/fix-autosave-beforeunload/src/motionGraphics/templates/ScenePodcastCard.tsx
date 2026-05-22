import React from 'react'
import { registerMotionGraphic } from '../registry'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface PodcastCardConfig {
  showTitle: string
  episodeName: string
  duration: string
  bgColor: string
  cardColor: string
  accentColor: string
  textColor: string
}

function easeOutCubic(t: number): number { return 1 - Math.pow(1 - t, 3) }
function easeInCubic(t: number): number { return t * t * t }
function easeOutBack(t: number): number {
  const c1 = 1.70158
  const c3 = c1 + 1
  return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2)
}

function ScenePodcastCardComponent({
  config,
  frame,
  fps,
  progress,
}: MotionGraphicProps<PodcastCardConfig>) {
  const { showTitle, episodeName, duration, bgColor, cardColor, accentColor, textColor } = config

  const enterEnd = 0.22
  const holdEnd = 0.8
  const enterProgress = Math.min(1, progress / enterEnd)
  const holdProgress = progress >= enterEnd && progress < holdEnd
    ? (progress - enterEnd) / (holdEnd - enterEnd) : 0
  const exitProgress = progress >= holdEnd ? (progress - holdEnd) / (1 - holdEnd) : 0

  // Card slides in from right
  const cardEnter = easeOutBack(Math.min(1, enterProgress / 0.6))
  const cardX = (1 - cardEnter) * 120
  const cardOpacity = easeOutCubic(Math.min(1, enterProgress / 0.4))

  // Show title fades in
  const titleDelay = 0.35
  const titleEnter = Math.max(0, Math.min(1, (enterProgress - titleDelay) / (1 - titleDelay)))
  const titleOpacity = easeOutCubic(titleEnter)

  // Episode name slides up
  const epDelay = 0.5
  const epEnter = Math.max(0, Math.min(1, (enterProgress - epDelay) / (1 - epDelay)))
  const epOpacity = easeOutCubic(epEnter)
  const epY = (1 - easeOutCubic(epEnter)) * 20

  // Waveform bars animate during hold
  const barCount = 24
  const time = frame / fps
  const bars = Array.from({ length: barCount }).map((_, i) => {
    const phase = i * 0.4 + time * 3.5
    const baseHeight = 0.3 + Math.sin(phase) * 0.25 + Math.sin(phase * 1.7 + i * 0.3) * 0.15
    const height = Math.max(0.1, Math.min(1, baseHeight))
    const barEnterDelay = 0.6 + i * 0.015
    const barEnter = Math.max(0, Math.min(1, (enterProgress - barEnterDelay) / (1 - barEnterDelay)))
    return {
      height: height * easeOutCubic(barEnter),
      opacity: easeOutCubic(barEnter),
    }
  })

  // Duration badge fades in
  const durDelay = 0.7
  const durEnter = Math.max(0, Math.min(1, (enterProgress - durDelay) / (1 - durDelay)))
  const durOpacity = easeOutCubic(durEnter)

  // Play icon pulse during hold
  const playScale = 1 + Math.sin(holdProgress * Math.PI * 4) * 0.05

  // Exit: card slides out right
  const exitEased = easeInCubic(exitProgress)
  const exitX = exitEased * 150
  const exitOpacity = 1 - exitEased

  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        overflow: 'hidden',
        background: bgColor,
        fontFamily: "'Inter', 'Helvetica Neue', sans-serif",
      }}
    >
      <div
        style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '8%',
        }}
      >
        {/* Podcast card */}
        <div
          style={{
            background: cardColor,
            borderRadius: 'clamp(14px, 2.5vw, 24px)',
            padding: 'clamp(20px, 4vw, 40px)',
            width: '100%',
            maxWidth: 480,
            transform: `translateX(${cardX + exitX}px)`,
            opacity: cardOpacity * exitOpacity,
            boxShadow: '0 8px 40px rgba(0,0,0,0.4), 0 2px 8px rgba(0,0,0,0.2)',
          }}
        >
          {/* Top row: play button + show title */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 'clamp(10px, 2vw, 18px)', marginBottom: 'clamp(6px, 1.2vw, 14px)' }}>
            {/* Play button */}
            <div
              style={{
                width: 'clamp(36px, 6vw, 52px)',
                height: 'clamp(36px, 6vw, 52px)',
                borderRadius: '50%',
                background: accentColor,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
                transform: `scale(${playScale})`,
                boxShadow: `0 4px 16px ${accentColor}44`,
              }}
            >
              <div
                style={{
                  width: 0,
                  height: 0,
                  borderStyle: 'solid',
                  borderWidth: 'clamp(6px, 1vw, 10px) 0 clamp(6px, 1vw, 10px) clamp(10px, 1.8vw, 18px)',
                  borderColor: `transparent transparent transparent ${textColor}`,
                  marginLeft: 'clamp(2px, 0.4vw, 4px)',
                }}
              />
            </div>

            {/* Show title */}
            <div style={{ opacity: titleOpacity }}>
              <div
                style={{
                  fontSize: 'clamp(9px, 1.3vw, 12px)',
                  fontWeight: 600,
                  color: accentColor,
                  letterSpacing: '0.1em',
                  textTransform: 'uppercase',
                  marginBottom: 2,
                }}
              >
                PODCAST
              </div>
              <div
                style={{
                  fontSize: 'clamp(12px, 2vw, 18px)',
                  fontWeight: 700,
                  color: textColor,
                }}
              >
                {showTitle}
              </div>
            </div>
          </div>

          {/* Episode name */}
          <div
            style={{
              fontSize: 'clamp(16px, 3.5vw, 30px)',
              fontWeight: 800,
              color: textColor,
              lineHeight: 1.2,
              opacity: epOpacity,
              transform: `translateY(${epY}px)`,
              marginBottom: 'clamp(14px, 2.5vw, 24px)',
            }}
          >
            {episodeName}
          </div>

          {/* Waveform visualization */}
          <div
            style={{
              display: 'flex',
              alignItems: 'flex-end',
              gap: 'clamp(2px, 0.3vw, 3px)',
              height: 'clamp(30px, 5vw, 48px)',
              marginBottom: 'clamp(10px, 1.8vw, 18px)',
            }}
          >
            {bars.map((bar, i) => (
              <div
                key={i}
                style={{
                  flex: 1,
                  height: `${bar.height * 100}%`,
                  minHeight: 3,
                  background: accentColor,
                  borderRadius: 2,
                  opacity: bar.opacity * 0.8,
                }}
              />
            ))}
          </div>

          {/* Duration badge */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 'clamp(6px, 1vw, 10px)',
              opacity: durOpacity,
            }}
          >
            <div
              style={{
                fontSize: 'clamp(10px, 1.5vw, 14px)',
                fontWeight: 600,
                color: `${textColor}88`,
              }}
            >
              {duration}
            </div>
            <div
              style={{
                width: 4,
                height: 4,
                borderRadius: '50%',
                background: `${textColor}44`,
              }}
            />
            <div
              style={{
                fontSize: 'clamp(10px, 1.5vw, 14px)',
                fontWeight: 500,
                color: `${textColor}66`,
              }}
            >
              New Episode
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

registerMotionGraphic({
  id: 'tpl-scene-podcast-card',
  title: 'Podcast Card',
  description: 'Podcast episode card with show title, episode name, animated waveform bars, duration badge, and play button',
  tags: ['scene', 'podcast', 'audio', 'episode', 'media', 'waveform', 'card'],
  category: 'scene-layout',
  component: ScenePodcastCardComponent as any,
  defaultConfig: {
    showTitle: 'The Daily Insight',
    episodeName: 'Why creativity is the last unfair advantage',
    duration: '42 min',
    bgColor: '#0f0f17',
    cardColor: '#1c1c2e',
    accentColor: '#8B5CF6',
    textColor: '#FFFFFF',
  },
  configSchema: [
    { key: 'showTitle', label: 'Show Title', type: 'text', defaultValue: 'The Daily Insight', group: 'Content' },
    { key: 'episodeName', label: 'Episode Name', type: 'text', defaultValue: 'Why creativity is the last unfair advantage', group: 'Content' },
    { key: 'duration', label: 'Duration', type: 'text', defaultValue: '42 min', group: 'Content' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#0f0f17', group: 'Style' },
    { key: 'cardColor', label: 'Card Color', type: 'color', defaultValue: '#1c1c2e', group: 'Style' },
    { key: 'accentColor', label: 'Accent Color', type: 'color', defaultValue: '#8B5CF6', group: 'Style' },
    { key: 'textColor', label: 'Text Color', type: 'color', defaultValue: '#FFFFFF', group: 'Style' },
  ],
})
