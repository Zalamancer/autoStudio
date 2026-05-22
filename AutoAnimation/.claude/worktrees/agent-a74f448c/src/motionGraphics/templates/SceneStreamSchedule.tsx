import React from 'react'
import { registerMotionGraphic } from '../registry'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface StreamScheduleConfig {
  streamerName: string
  days: string[]
  times: string[]
  games: string[]
  bgColor: string
  accentColor: string
  cardColor: string
  textColor: string
}

function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3)
}

function easeInCubic(t: number): number {
  return t * t * t
}

function easeOutBack(t: number): number {
  const c1 = 1.70158
  const c3 = c1 + 1
  return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2)
}

const GAME_ICONS: Record<string, string> = {
  Gaming: '🎮',
  'Just Chatting': '💬',
  'Art Stream': '🎨',
  Music: '🎵',
  IRL: '📸',
  Cooking: '🍳',
  Coding: '💻',
  Collab: '🤝',
}

function SceneStreamScheduleComponent({
  config,
  frame,
  durationInFrames,
}: MotionGraphicProps<StreamScheduleConfig>) {
  const { streamerName, days, times, games, bgColor, accentColor, cardColor, textColor } = config
  const progress = frame / durationInFrames

  const enterEnd = 0.3
  const holdEnd = 0.8
  const enterProgress = Math.min(1, progress / enterEnd)
  const holdProgress = progress >= enterEnd && progress < holdEnd ? (progress - enterEnd) / (holdEnd - enterEnd) : progress >= holdEnd ? 1 : 0
  const exitProgress = progress >= holdEnd ? (progress - holdEnd) / (1 - holdEnd) : 0

  // Header slides in
  const headerSlide = easeOutCubic(Math.min(1, enterProgress / 0.25))

  // Live indicator blinks
  const liveBlink = Math.sin(frame * 0.15) > 0 ? 1 : 0.3

  // Schedule rows stagger in
  const getRowProgress = (idx: number): number => {
    const delay = 0.2 + idx * 0.08
    return easeOutBack(Math.max(0, Math.min(1, (enterProgress - delay) / 0.3)))
  }

  // Hold: highlight sweep
  const highlightIdx = Math.floor(holdProgress * days.length * 1.5) % days.length

  // Exit
  const exitEased = easeInCubic(exitProgress)
  const exitOpacity = 1 - exitEased
  const exitScale = 1 - exitEased * 0.1

  const scheduleCount = Math.min(days.length, times.length, games.length)

  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        overflow: 'hidden',
        background: bgColor,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: "'Helvetica Neue', Arial, sans-serif",
        padding: '5%',
      }}
    >
      {/* Subtle gradient top */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: '30%',
          background: `linear-gradient(180deg, ${accentColor}08 0%, transparent 100%)`,
          opacity: exitOpacity,
        }}
      />

      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: 'clamp(14px, 2.5vh, 22px)',
          width: '100%',
          maxWidth: 440,
          transform: `scale(${exitScale})`,
          opacity: exitOpacity,
        }}
      >
        {/* Header */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            opacity: headerSlide,
            transform: `translateY(${(1 - headerSlide) * -20}px)`,
          }}
        >
          <div>
            <div
              style={{
                fontSize: 'clamp(18px, 3.5vw, 26px)',
                fontWeight: 900,
                color: textColor,
              }}
            >
              Stream Schedule
            </div>
            <div
              style={{
                fontSize: 'clamp(10px, 1.6vw, 13px)',
                fontWeight: 500,
                color: `${textColor}60`,
                marginTop: 2,
              }}
            >
              @{streamerName}
            </div>
          </div>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
            }}
          >
            <div
              style={{
                width: 8,
                height: 8,
                borderRadius: '50%',
                background: '#EF4444',
                opacity: liveBlink,
                boxShadow: '0 0 8px #EF444480',
              }}
            />
            <span
              style={{
                fontSize: 'clamp(9px, 1.3vw, 11px)',
                fontWeight: 800,
                color: '#EF4444',
                letterSpacing: 2,
              }}
            >
              LIVE
            </span>
          </div>
        </div>

        {/* Schedule rows */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'clamp(6px, 1vh, 10px)' }}>
          {Array.from({ length: scheduleCount }).map((_, i) => {
            const rp = getRowProgress(i)
            const day = days[i]
            const time = times[i]
            const game = games[i]
            const icon = GAME_ICONS[game] || '🎮'
            const isHighlighted = holdProgress > 0 && i === highlightIdx

            return (
              <div
                key={i}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 'clamp(8px, 1.5vw, 14px)',
                  background: isHighlighted ? `${accentColor}12` : cardColor,
                  borderRadius: 'clamp(10px, 1.5vw, 14px)',
                  padding: 'clamp(10px, 1.8vh, 16px) clamp(12px, 2vw, 18px)',
                  border: isHighlighted ? `2px solid ${accentColor}30` : `1px solid ${textColor}08`,
                  transform: `scale(${rp}) translateX(${(1 - rp) * 25}px)`,
                  opacity: rp,
                }}
              >
                {/* Day */}
                <div
                  style={{
                    fontSize: 'clamp(11px, 1.8vw, 14px)',
                    fontWeight: 800,
                    color: isHighlighted ? accentColor : `${textColor}70`,
                    width: 'clamp(36px, 6vw, 48px)',
                    textTransform: 'uppercase',
                  }}
                >
                  {day.slice(0, 3)}
                </div>

                {/* Time */}
                <div
                  style={{
                    fontSize: 'clamp(10px, 1.5vw, 13px)',
                    fontWeight: 600,
                    color: `${textColor}80`,
                    fontFamily: "'Courier New', monospace",
                    width: 'clamp(50px, 9vw, 70px)',
                  }}
                >
                  {time}
                </div>

                {/* Game/Category */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    flex: 1,
                  }}
                >
                  <span style={{ fontSize: 'clamp(14px, 2.2vw, 18px)' }}>{icon}</span>
                  <span
                    style={{
                      fontSize: 'clamp(11px, 1.8vw, 14px)',
                      fontWeight: 600,
                      color: textColor,
                    }}
                  >
                    {game}
                  </span>
                </div>
              </div>
            )
          })}
        </div>

        {/* Bottom CTA */}
        <div
          style={{
            textAlign: 'center',
            fontSize: 'clamp(10px, 1.6vw, 13px)',
            fontWeight: 600,
            color: accentColor,
            opacity: easeOutCubic(Math.max(0, enterProgress - 0.8) / 0.2) * exitOpacity,
          }}
        >
          Turn on notifications to never miss a stream!
        </div>
      </div>
    </div>
  )
}

registerMotionGraphic({
  id: 'tpl-scene-stream-schedule',
  title: 'Scene Stream Schedule',
  description:
    'Streaming schedule display with staggered row reveals, live indicator, game category icons, and highlight sweep animation.',
  tags: ['scene', 'social-media', 'stream', 'schedule', 'twitch', 'live', 'creator', 'gaming'],
  category: 'scene-layout',
  component: SceneStreamScheduleComponent as unknown as React.ComponentType<MotionGraphicProps>,
  configSchema: [
    { key: 'streamerName', label: 'Streamer Name', type: 'text', defaultValue: 'creator', group: 'Content' },
    { key: 'days', label: 'Days', type: 'text-array', defaultValue: ['Monday', 'Wednesday', 'Friday', 'Saturday', 'Sunday'], group: 'Content' },
    { key: 'times', label: 'Times', type: 'text-array', defaultValue: ['7:00 PM', '8:00 PM', '6:00 PM', '2:00 PM', '4:00 PM'], group: 'Content' },
    { key: 'games', label: 'Categories', type: 'text-array', defaultValue: ['Gaming', 'Just Chatting', 'Art Stream', 'Collab', 'Music'], group: 'Content' },
    { key: 'accentColor', label: 'Accent Color', type: 'color', defaultValue: '#9146FF', group: 'Style' },
    { key: 'cardColor', label: 'Card Color', type: 'color', defaultValue: '#18181B', group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#0E0E10', group: 'Style' },
    { key: 'textColor', label: 'Text Color', type: 'color', defaultValue: '#EFEFF1', group: 'Style' },
  ],
  defaultConfig: {
    streamerName: 'creator',
    days: ['Monday', 'Wednesday', 'Friday', 'Saturday', 'Sunday'],
    times: ['7:00 PM', '8:00 PM', '6:00 PM', '2:00 PM', '4:00 PM'],
    games: ['Gaming', 'Just Chatting', 'Art Stream', 'Collab', 'Music'],
    accentColor: '#9146FF',
    cardColor: '#18181B',
    bgColor: '#0E0E10',
    textColor: '#EFEFF1',
  },
})
