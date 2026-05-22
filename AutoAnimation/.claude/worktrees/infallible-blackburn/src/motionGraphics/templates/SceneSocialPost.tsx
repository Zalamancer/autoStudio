import React from 'react'
import { registerMotionGraphic } from '../registry'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface SocialPostConfig {
  username: string
  postText: string
  likes: number
  comments: number
  shares: number
  avatarEmoji: string
  cardColor: string
  bgColor: string
}

function easeOutBack(t: number): number {
  const c1 = 1.70158
  const c3 = c1 + 1
  return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2)
}
function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3)
}
function easeInCubic(t: number): number {
  return t * t * t
}

function formatCount(n: number): string {
  if (n >= 1000000) return (n / 1000000).toFixed(1).replace(/\.0$/, '') + 'M'
  if (n >= 1000) return (n / 1000).toFixed(1).replace(/\.0$/, '') + 'K'
  return String(n)
}

function SceneSocialPostComponent({
  config,
  frame,
  durationInFrames,
}: MotionGraphicProps<SocialPostConfig>) {
  const { username, postText, likes, comments, shares, avatarEmoji, cardColor, bgColor } = config
  const progress = frame / durationInFrames

  const enterEnd = 0.25
  const exitStart = 0.8

  // Enter: card scales in
  let cardScale = 1
  let cardOpacity = 1
  if (progress < enterEnd) {
    const t = easeOutBack(progress / enterEnd)
    cardScale = 0.7 + t * 0.3
    cardOpacity = easeOutCubic(progress / enterEnd)
  }

  // Exit: card slides down
  let cardTranslateY = 0
  if (progress >= exitStart) {
    const t = easeInCubic((progress - exitStart) / (1 - exitStart))
    cardTranslateY = t * 100
    cardOpacity = 1 - t
  }

  // Engagement counters count up staggered (after card enter)
  const getCountProgress = (index: number): number => {
    const countStart = 0.2 + index * 0.08
    const countDur = 0.2
    return easeOutCubic(Math.max(0, Math.min(1, (progress - countStart) / countDur)))
  }

  // Like counter increment during hold
  const holdLikeBonus =
    progress >= 0.4 && progress < exitStart
      ? Math.floor(((progress - 0.4) / (exitStart - 0.4)) * 3)
      : 0

  const engagements = [
    { icon: '\u2764\uFE0F', count: likes + holdLikeBonus, label: 'likes' },
    { icon: '\uD83D\uDCAC', count: comments, label: 'comments' },
    { icon: '\uD83D\uDD01', count: shares, label: 'shares' },
  ]

  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        background: bgColor,
        overflow: 'hidden',
        fontFamily: "'Helvetica Neue', Arial, sans-serif",
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '5%',
      }}
    >
      <div
        style={{
          width: 'clamp(300px, 70%, 480px)',
          background: cardColor,
          borderRadius: 16,
          padding: 'clamp(18px, 3.5vw, 28px)',
          transform: `scale(${cardScale}) translateY(${cardTranslateY}%)`,
          opacity: cardOpacity,
          boxShadow: '0 4px 24px rgba(0,0,0,0.08)',
        }}
      >
        {/* Header: avatar + username */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 'clamp(10px, 2vw, 14px)',
            marginBottom: 'clamp(12px, 2vw, 18px)',
          }}
        >
          <div
            style={{
              width: 'clamp(40px, 7vw, 52px)',
              height: 'clamp(40px, 7vw, 52px)',
              borderRadius: '50%',
              background: '#F0F0F5',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 'clamp(20px, 3.5vw, 28px)',
            }}
          >
            {avatarEmoji}
          </div>
          <div>
            <div
              style={{
                fontSize: 'clamp(14px, 2.2vw, 17px)',
                fontWeight: 700,
                color: '#1A1A2E',
              }}
            >
              {username}
            </div>
            <div
              style={{
                fontSize: 'clamp(10px, 1.5vw, 13px)',
                color: '#8E8E93',
              }}
            >
              2h ago
            </div>
          </div>
        </div>

        {/* Post text */}
        <div
          style={{
            fontSize: 'clamp(14px, 2.2vw, 17px)',
            color: '#1A1A2E',
            lineHeight: 1.5,
            marginBottom: 'clamp(14px, 2.5vw, 22px)',
          }}
        >
          {postText}
        </div>

        {/* Divider */}
        <div
          style={{
            height: 1,
            background: '#E5E5EA',
            marginBottom: 'clamp(10px, 2vw, 16px)',
          }}
        />

        {/* Engagement metrics */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-around',
          }}
        >
          {engagements.map((eng, i) => {
            const cp = getCountProgress(i)
            const currentCount = Math.round(eng.count * cp)

            return (
              <div
                key={i}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  opacity: cp > 0 ? 1 : 0,
                  transform: `translateY(${(1 - cp) * 10}px)`,
                }}
              >
                <span style={{ fontSize: 'clamp(14px, 2vw, 18px)' }}>
                  {eng.icon}
                </span>
                <span
                  style={{
                    fontSize: 'clamp(13px, 2vw, 16px)',
                    fontWeight: 600,
                    color: '#1A1A2E',
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
  id: 'tpl-scene-social-post',
  title: 'Scene Social Post',
  description:
    'Social media post card with avatar, engagement metrics that count up, and scale-in animation',
  tags: ['scene', 'conversation', 'messaging', 'social', 'post', 'likes', 'engagement'],
  category: 'scene-layout',
  component: SceneSocialPostComponent as unknown as React.ComponentType<MotionGraphicProps>,
  configSchema: [
    { key: 'username', label: 'Username', type: 'text', defaultValue: 'creativestudio', group: 'Content' },
    { key: 'postText', label: 'Post Text', type: 'text', defaultValue: 'Just launched our biggest update yet! After months of hard work, the new editor is live. Can\'t wait to see what you all create \u2728', group: 'Content' },
    { key: 'likes', label: 'Likes', type: 'number', defaultValue: 12500, min: 0, max: 10000000, group: 'Content' },
    { key: 'comments', label: 'Comments', type: 'number', defaultValue: 842, min: 0, max: 10000000, group: 'Content' },
    { key: 'shares', label: 'Shares', type: 'number', defaultValue: 2100, min: 0, max: 10000000, group: 'Content' },
    { key: 'avatarEmoji', label: 'Avatar Emoji', type: 'text', defaultValue: '\uD83C\uDFA8', group: 'Content' },
    { key: 'cardColor', label: 'Card Color', type: 'color', defaultValue: '#FFFFFF', group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#F0F0F5', group: 'Style' },
  ],
  defaultConfig: {
    username: 'creativestudio',
    postText: 'Just launched our biggest update yet! After months of hard work, the new editor is live. Can\'t wait to see what you all create \u2728',
    likes: 12500,
    comments: 842,
    shares: 2100,
    avatarEmoji: '\uD83C\uDFA8',
    cardColor: '#FFFFFF',
    bgColor: '#F0F0F5',
  },
})
