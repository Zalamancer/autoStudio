import React from 'react'
import { registerMotionGraphic } from '../registry'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface TweetCardConfig {
  displayName: string
  handle: string
  tweetText: string
  likes: number
  reposts: number
  replies: number
  verified: boolean
  cardColor: string
  bgColor: string
}

function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3)
}
function easeOutBack(t: number): number {
  const c1 = 1.70158
  const c3 = c1 + 1
  return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2)
}
function easeInCubic(t: number): number {
  return t * t * t
}

function formatCount(n: number): string {
  if (n >= 1000000) return (n / 1000000).toFixed(1).replace(/\.0$/, '') + 'M'
  if (n >= 1000) return (n / 1000).toFixed(1).replace(/\.0$/, '') + 'K'
  return String(n)
}

function SceneTweetCardComponent({ config, frame, durationInFrames }: MotionGraphicProps<TweetCardConfig>) {
  const { displayName, handle, tweetText, likes, reposts, replies, verified, cardColor, bgColor } = config
  const progress = frame / durationInFrames

  const enterEnd = 0.25
  const exitStart = 0.8

  // Enter: slide in from left
  let slideX = 0
  let cardOpacity = 1
  if (progress < enterEnd) {
    const t = easeOutCubic(progress / enterEnd)
    slideX = (1 - t) * -60
    cardOpacity = t
  }

  // Exit: slide right (like scrolling)
  if (progress >= exitStart) {
    const t = easeInCubic((progress - exitStart) / (1 - exitStart))
    slideX = t * 80
    cardOpacity = 1 - t
  }

  // Type-in effect for tweet text
  const typeStart = 0.1
  const typeEnd = 0.35
  const typeProgress = Math.max(0, Math.min(1, (progress - typeStart) / (typeEnd - typeStart)))
  const visibleChars = Math.floor(easeOutCubic(typeProgress) * tweetText.length)
  const displayedText = tweetText.slice(0, visibleChars)

  // Checkmark pop-in
  const checkStart = 0.15
  const checkDur = 0.1
  const checkScale = verified ? easeOutBack(Math.max(0, Math.min(1, (progress - checkStart) / checkDur))) : 0

  // Engagement count up
  const getEngProgress = (index: number): number => {
    const start = 0.3 + index * 0.06
    const dur = 0.15
    return easeOutCubic(Math.max(0, Math.min(1, (progress - start) / dur)))
  }

  // Like increment during hold
  const holdLikeBonus =
    progress >= 0.45 && progress < exitStart ? Math.floor(((progress - 0.45) / (exitStart - 0.45)) * 5) : 0

  const engagements = [
    { icon: '\uD83D\uDCAC', count: replies, label: 'replies' },
    { icon: '\uD83D\uDD01', count: reposts, label: 'reposts' },
    { icon: '\u2764\uFE0F', count: likes + holdLikeBonus, label: 'likes' },
    { icon: '\uD83D\uDCCA', count: Math.round(likes * 12.5), label: 'views' },
  ]

  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        background: bgColor,
        overflow: 'hidden',
        fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', 'Helvetica Neue', sans-serif",
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '5%',
      }}
    >
      <div
        style={{
          width: 'clamp(300px, 70%, 500px)',
          background: cardColor,
          borderRadius: 16,
          padding: 'clamp(18px, 3.5vw, 28px)',
          transform: `translateX(${slideX}px)`,
          opacity: cardOpacity,
          border: '1px solid #2F3336',
        }}
      >
        {/* Header: avatar + name + handle */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 'clamp(8px, 1.5vw, 12px)',
            marginBottom: 'clamp(10px, 2vw, 16px)',
          }}
        >
          {/* Avatar circle */}
          <div
            style={{
              width: 'clamp(40px, 7vw, 50px)',
              height: 'clamp(40px, 7vw, 50px)',
              borderRadius: '50%',
              background: '#2F3336',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 'clamp(18px, 3vw, 24px)',
              flexShrink: 0,
            }}
          >
            {displayName.charAt(0).toUpperCase()}
          </div>

          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <span
                style={{
                  fontSize: 'clamp(14px, 2.2vw, 17px)',
                  fontWeight: 700,
                  color: '#E7E9EA',
                }}
              >
                {displayName}
              </span>
              {verified && (
                <span
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: 'clamp(16px, 2.5vw, 20px)',
                    height: 'clamp(16px, 2.5vw, 20px)',
                    borderRadius: '50%',
                    background: '#1D9BF0',
                    color: '#FFFFFF',
                    fontSize: 'clamp(10px, 1.5vw, 12px)',
                    fontWeight: 700,
                    transform: `scale(${checkScale})`,
                  }}
                >
                  {'✓'}
                </span>
              )}
            </div>
            <div
              style={{
                fontSize: 'clamp(12px, 1.8vw, 15px)',
                color: '#71767B',
              }}
            >
              @{handle}
            </div>
          </div>

          {/* X logo */}
          <div
            style={{
              fontSize: 'clamp(18px, 3vw, 24px)',
              color: '#E7E9EA',
              fontWeight: 900,
              fontFamily: 'Arial, sans-serif',
            }}
          >
            {String.fromCodePoint(0x1d54f)}
          </div>
        </div>

        {/* Tweet text */}
        <div
          style={{
            fontSize: 'clamp(15px, 2.5vw, 20px)',
            color: '#E7E9EA',
            lineHeight: 1.5,
            marginBottom: 'clamp(14px, 2.5vw, 22px)',
            minHeight: 'clamp(40px, 8vw, 80px)',
          }}
        >
          {displayedText}
          {typeProgress < 1 && (
            <span
              style={{
                display: 'inline-block',
                width: 2,
                height: '1em',
                background: '#1D9BF0',
                marginLeft: 2,
                opacity: Math.sin(progress * 60) > 0 ? 1 : 0,
                verticalAlign: 'text-bottom',
              }}
            />
          )}
        </div>

        {/* Time stamp */}
        <div
          style={{
            fontSize: 'clamp(12px, 1.8vw, 14px)',
            color: '#71767B',
            marginBottom: 'clamp(10px, 2vw, 16px)',
            paddingBottom: 'clamp(10px, 2vw, 16px)',
            borderBottom: '1px solid #2F3336',
          }}
        >
          {'8:42 PM · Mar 19, 2026'}
        </div>

        {/* Engagement bar */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
          }}
        >
          {engagements.map((eng, i) => {
            const cp = getEngProgress(i)
            const currentCount = Math.round(eng.count * cp)

            return (
              <div
                key={i}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 4,
                  opacity: cp > 0 ? 1 : 0,
                }}
              >
                <span style={{ fontSize: 'clamp(12px, 1.8vw, 16px)' }}>{eng.icon}</span>
                <span
                  style={{
                    fontSize: 'clamp(12px, 1.8vw, 14px)',
                    color: '#71767B',
                    fontWeight: 400,
                  }}
                >
                  {formatCount(currentCount)}
                </span>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

registerMotionGraphic({
  id: 'tpl-scene-tweet-card',
  title: 'Scene Tweet Card',
  description:
    'X/Twitter post with type-in text effect, verified badge pop-in, and counting engagement metrics on dark card',
  tags: ['scene', 'conversation', 'messaging', 'twitter', 'x', 'tweet', 'social'],
  category: 'scene-layout',
  component: SceneTweetCardComponent as unknown as React.ComponentType<MotionGraphicProps>,
  configSchema: [
    { key: 'displayName', label: 'Display Name', type: 'text', defaultValue: 'ProAnimate', group: 'Content' },
    { key: 'handle', label: 'Handle', type: 'text', defaultValue: 'proanimate', group: 'Content' },
    {
      key: 'tweetText',
      label: 'Tweet Text',
      type: 'text',
      defaultValue:
        'We just shipped the biggest update in ProAnimate history. AI-powered motion graphics are here. \uD83D\uDE80',
      group: 'Content',
    },
    { key: 'likes', label: 'Likes', type: 'number', defaultValue: 24500, min: 0, max: 10000000, group: 'Content' },
    { key: 'reposts', label: 'Reposts', type: 'number', defaultValue: 5200, min: 0, max: 10000000, group: 'Content' },
    { key: 'replies', label: 'Replies', type: 'number', defaultValue: 1800, min: 0, max: 10000000, group: 'Content' },
    { key: 'verified', label: 'Verified Badge', type: 'boolean', defaultValue: true, group: 'Content' },
    { key: 'cardColor', label: 'Card Color', type: 'color', defaultValue: '#16181C', group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#000000', group: 'Style' },
  ],
  defaultConfig: {
    displayName: 'ProAnimate',
    handle: 'proanimate',
    tweetText:
      'We just shipped the biggest update in ProAnimate history. AI-powered motion graphics are here. \uD83D\uDE80',
    likes: 24500,
    reposts: 5200,
    replies: 1800,
    verified: true,
    cardColor: '#16181C',
    bgColor: '#000000',
  },
})
