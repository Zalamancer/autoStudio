import React from 'react'
import { registerMotionGraphic } from '../registry'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface NewsAlertConfig {
  appName: string
  headline: string
  previewText: string
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

function SceneNewsAlertComponent({
  config,
  progress,
}: MotionGraphicProps<NewsAlertConfig>) {
  const { appName, headline, previewText, bgColor, cardColor, accentColor, textColor } = config

  const enterEnd = 0.18
  const holdEnd = 0.82
  const enterProgress = Math.min(1, progress / enterEnd)
  const holdProgress = progress >= enterEnd && progress < holdEnd
    ? (progress - enterEnd) / (holdEnd - enterEnd) : progress >= holdEnd ? 1 : 0
  const exitProgress = progress >= holdEnd ? (progress - holdEnd) / (1 - holdEnd) : 0

  // Notification slides down from top (like a phone notification)
  const slideIn = easeOutBack(Math.min(1, enterProgress / 0.7))
  const cardY = (1 - slideIn) * -180
  const cardOpacity = easeOutCubic(Math.min(1, enterProgress / 0.4))

  // Headline fades in with delay
  const headDelay = 0.4
  const headEnter = Math.max(0, Math.min(1, (enterProgress - headDelay) / (1 - headDelay)))
  const headOpacity = easeOutCubic(headEnter)

  // Preview text fades in after headline
  const previewDelay = 0.6
  const previewEnter = Math.max(0, Math.min(1, (enterProgress - previewDelay) / (1 - previewDelay)))
  const previewOpacity = easeOutCubic(previewEnter)
  const previewY = (1 - easeOutCubic(previewEnter)) * 8

  // Time label appears
  const timeDelay = 0.7
  const timeEnter = Math.max(0, Math.min(1, (enterProgress - timeDelay) / (1 - timeDelay)))
  const timeOpacity = easeOutCubic(timeEnter)

  // Hold: subtle idle animation — nothing jarring, just visible
  const _ = holdProgress

  // Exit: slides back up
  const exitEased = easeInCubic(exitProgress)
  const exitY = exitEased * -200
  const exitOpacity = 1 - exitEased

  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        overflow: 'hidden',
        background: bgColor,
        fontFamily: "'Inter', 'SF Pro Display', 'Helvetica Neue', sans-serif",
      }}
    >
      {/* Notification card */}
      <div
        style={{
          position: 'absolute',
          top: '6%',
          left: '50%',
          transform: `translateX(-50%) translateY(${cardY + exitY}px)`,
          opacity: cardOpacity * exitOpacity,
          width: '88%',
          maxWidth: 420,
        }}
      >
        <div
          style={{
            background: cardColor,
            borderRadius: 'clamp(12px, 2.2vw, 20px)',
            padding: 'clamp(12px, 2vw, 20px)',
            boxShadow: '0 8px 40px rgba(0,0,0,0.4), 0 2px 8px rgba(0,0,0,0.2)',
            backdropFilter: 'blur(20px)',
          }}
        >
          {/* Top row: app icon + app name + time */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 'clamp(6px, 1.2vw, 12px)',
              marginBottom: 'clamp(8px, 1.4vw, 14px)',
            }}
          >
            {/* App icon */}
            <div
              style={{
                width: 'clamp(20px, 3.5vw, 32px)',
                height: 'clamp(20px, 3.5vw, 32px)',
                borderRadius: 'clamp(4px, 0.8vw, 7px)',
                background: accentColor,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <span
                style={{
                  fontSize: 'clamp(10px, 1.6vw, 16px)',
                  fontWeight: 900,
                  color: '#FFFFFF',
                }}
              >
                {appName.charAt(0).toUpperCase()}
              </span>
            </div>

            {/* App name */}
            <div
              style={{
                fontSize: 'clamp(10px, 1.5vw, 14px)',
                fontWeight: 600,
                color: `${textColor}99`,
                textTransform: 'uppercase',
                letterSpacing: '0.04em',
                flex: 1,
              }}
            >
              {appName}
            </div>

            {/* Time */}
            <div
              style={{
                fontSize: 'clamp(9px, 1.2vw, 12px)',
                fontWeight: 500,
                color: `${textColor}66`,
                opacity: timeOpacity,
              }}
            >
              now
            </div>
          </div>

          {/* Headline */}
          <div
            style={{
              fontSize: 'clamp(13px, 2.4vw, 20px)',
              fontWeight: 700,
              color: textColor,
              lineHeight: 1.3,
              opacity: headOpacity,
              marginBottom: 'clamp(4px, 0.7vw, 8px)',
            }}
          >
            {headline}
          </div>

          {/* Preview text */}
          <div
            style={{
              fontSize: 'clamp(11px, 1.7vw, 15px)',
              fontWeight: 400,
              color: `${textColor}aa`,
              lineHeight: 1.4,
              opacity: previewOpacity,
              transform: `translateY(${previewY}px)`,
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
            }}
          >
            {previewText}
          </div>
        </div>

        {/* Grab indicator (iOS-style pill) */}
        <div
          style={{
            width: 'clamp(28px, 5vw, 40px)',
            height: 4,
            background: `${textColor}33`,
            borderRadius: 2,
            margin: '8px auto 0',
          }}
        />
      </div>
    </div>
  )
}

registerMotionGraphic({
  id: 'tpl-scene-news-alert',
  title: 'News Alert Notification',
  description: 'Push notification style alert that slides down from top like a phone notification with app icon, headline, and preview text',
  tags: ['scene', 'news', 'alert', 'notification', 'push', 'mobile', 'media'],
  category: 'scene-layout',
  component: SceneNewsAlertComponent as any,
  defaultConfig: {
    appName: 'News Alert',
    headline: 'Global summit reaches historic climate agreement',
    previewText: 'World leaders have agreed to unprecedented emissions targets in what is being called the most significant climate deal in a decade...',
    bgColor: '#0f0f17',
    cardColor: '#1e1e30',
    accentColor: '#FF3B30',
    textColor: '#FFFFFF',
  },
  configSchema: [
    { key: 'appName', label: 'App Name', type: 'text', defaultValue: 'News Alert', group: 'Content' },
    { key: 'headline', label: 'Headline', type: 'text', defaultValue: 'Global summit reaches historic climate agreement', group: 'Content' },
    { key: 'previewText', label: 'Preview Text', type: 'text', defaultValue: 'World leaders have agreed to unprecedented emissions targets in what is being called the most significant climate deal in a decade...', group: 'Content' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#0f0f17', group: 'Style' },
    { key: 'cardColor', label: 'Card Color', type: 'color', defaultValue: '#1e1e30', group: 'Style' },
    { key: 'accentColor', label: 'Accent Color', type: 'color', defaultValue: '#FF3B30', group: 'Style' },
    { key: 'textColor', label: 'Text Color', type: 'color', defaultValue: '#FFFFFF', group: 'Style' },
  ],
})
