import React from 'react'
import { registerMotionGraphic } from '../registry'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface RedditPostConfig {
  subreddit: string
  title: string
  voteCount: number
  commentCount: number
  cardColor: string
  bgColor: string
  accentColor: string
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

function SceneRedditPostComponent({ config, frame, durationInFrames }: MotionGraphicProps<RedditPostConfig>) {
  const { subreddit, title, voteCount, commentCount, cardColor, bgColor, accentColor } = config
  const progress = frame / durationInFrames

  const enterEnd = 0.25
  const exitStart = 0.8

  // Enter: slide from bottom
  let cardY = 0
  let cardOpacity = 1
  if (progress < enterEnd) {
    const t = easeOutCubic(progress / enterEnd)
    cardY = (1 - t) * 80
    cardOpacity = t
  }

  // Exit: slide right (scrolling)
  let cardX = 0
  if (progress >= exitStart) {
    const t = easeInCubic((progress - exitStart) / (1 - exitStart))
    cardX = t * 100
    cardOpacity = 1 - t
  }

  // Upvote arrow fill animation
  const upvoteFillStart = 0.15
  const upvoteFillDur = 0.1
  const upvoteFill = easeOutCubic(Math.max(0, Math.min(1, (progress - upvoteFillStart) / upvoteFillDur)))

  // Vote count increment
  const voteCountStart = 0.18
  const voteCountDur = 0.2
  const voteProgress = easeOutCubic(Math.max(0, Math.min(1, (progress - voteCountStart) / voteCountDur)))

  // Hold: vote count occasional changes
  const holdVoteBonus = progress >= 0.4 && progress < exitStart ? Math.floor(Math.sin(progress * 20) * 3 + 3) : 0

  // Comment icon pulse during hold
  const commentPulse = progress >= 0.3 && progress < exitStart ? 1 + Math.sin(progress * 25) * 0.08 : 1

  const displayVotes = Math.round(voteProgress * voteCount) + holdVoteBonus

  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        background: bgColor,
        overflow: 'hidden',
        fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', 'Noto Sans', 'Helvetica Neue', sans-serif",
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '5%',
      }}
    >
      <div
        style={{
          width: 'clamp(300px, 75%, 520px)',
          background: cardColor,
          borderRadius: 12,
          padding: 0,
          transform: `translateY(${cardY}px) translateX(${cardX}%)`,
          opacity: cardOpacity,
          border: '1px solid #343536',
          display: 'flex',
          overflow: 'hidden',
        }}
      >
        {/* Vote sidebar */}
        <div
          style={{
            width: 'clamp(36px, 6vw, 48px)',
            background: '#1A1A1B',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'flex-start',
            padding: 'clamp(12px, 2vw, 18px) 0',
            gap: 4,
            flexShrink: 0,
          }}
        >
          {/* Upvote arrow */}
          <div
            style={{
              fontSize: 'clamp(16px, 2.5vw, 22px)',
              color: upvoteFill >= 1 ? accentColor : `rgba(215, 218, 220, ${0.3 + upvoteFill * 0.7})`,
              transform: `scale(${upvoteFill >= 1 ? 1 : 0.8 + upvoteFill * 0.2})`,
              cursor: 'default',
              lineHeight: 1,
            }}
          >
            {'▲'}
          </div>

          {/* Vote count */}
          <div
            style={{
              fontSize: 'clamp(11px, 1.8vw, 14px)',
              fontWeight: 700,
              color: upvoteFill >= 1 ? accentColor : '#D7DADC',
            }}
          >
            {formatCount(displayVotes)}
          </div>

          {/* Downvote arrow */}
          <div
            style={{
              fontSize: 'clamp(16px, 2.5vw, 22px)',
              color: '#818384',
              lineHeight: 1,
            }}
          >
            {'▼'}
          </div>
        </div>

        {/* Content */}
        <div
          style={{
            flex: 1,
            padding: 'clamp(12px, 2vw, 18px)',
            display: 'flex',
            flexDirection: 'column',
            gap: 'clamp(6px, 1.2vw, 10px)',
          }}
        >
          {/* Subreddit + posted by */}
          <div
            style={{
              fontSize: 'clamp(10px, 1.5vw, 13px)',
              color: '#818384',
            }}
          >
            <span style={{ fontWeight: 700, color: '#D7DADC' }}>r/{subreddit}</span> {'·'} Posted by u/user123 {'·'}
            5h
          </div>

          {/* Title */}
          <div
            style={{
              fontSize: 'clamp(16px, 2.5vw, 20px)',
              fontWeight: 600,
              color: '#D7DADC',
              lineHeight: 1.3,
            }}
          >
            {title}
          </div>

          {/* Flair tag */}
          <div
            style={{
              display: 'inline-flex',
              alignSelf: 'flex-start',
              background: `${accentColor}20`,
              color: accentColor,
              fontSize: 'clamp(10px, 1.5vw, 12px)',
              fontWeight: 600,
              padding: '2px 8px',
              borderRadius: 12,
            }}
          >
            Discussion
          </div>

          {/* Bottom bar: comments */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 'clamp(12px, 2vw, 20px)',
              marginTop: 'clamp(4px, 1vw, 8px)',
              paddingTop: 'clamp(8px, 1.5vw, 12px)',
              borderTop: '1px solid #343536',
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 4,
                fontSize: 'clamp(11px, 1.8vw, 13px)',
                color: '#818384',
                fontWeight: 700,
                transform: `scale(${commentPulse})`,
              }}
            >
              <span style={{ fontSize: 'clamp(14px, 2vw, 18px)' }}>{'💬'}</span>
              {formatCount(commentCount)} Comments
            </div>

            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 4,
                fontSize: 'clamp(11px, 1.8vw, 13px)',
                color: '#818384',
                fontWeight: 700,
              }}
            >
              <span style={{ fontSize: 'clamp(14px, 2vw, 18px)' }}>{'🔗'}</span>
              Share
            </div>

            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 4,
                fontSize: 'clamp(11px, 1.8vw, 13px)',
                color: '#818384',
                fontWeight: 700,
              }}
            >
              <span style={{ fontSize: 'clamp(14px, 2vw, 18px)' }}>{'⭐'}</span>
              Award
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

registerMotionGraphic({
  id: 'tpl-scene-reddit-post',
  title: 'Scene Reddit Post',
  description:
    'Reddit-style post with upvote/downvote sidebar, vote counting animation, and authentic dark theme styling',
  tags: ['scene', 'conversation', 'messaging', 'reddit', 'social', 'upvote', 'post'],
  category: 'scene-layout',
  component: SceneRedditPostComponent as unknown as React.ComponentType<MotionGraphicProps>,
  configSchema: [
    { key: 'subreddit', label: 'Subreddit', type: 'text', defaultValue: 'technology', group: 'Content' },
    {
      key: 'title',
      label: 'Post Title',
      type: 'text',
      defaultValue:
        "AI-generated motion graphics are now indistinguishable from hand-crafted ones. Here's what that means for creators.",
      group: 'Content',
    },
    {
      key: 'voteCount',
      label: 'Vote Count',
      type: 'number',
      defaultValue: 15800,
      min: 0,
      max: 10000000,
      group: 'Content',
    },
    {
      key: 'commentCount',
      label: 'Comment Count',
      type: 'number',
      defaultValue: 2340,
      min: 0,
      max: 10000000,
      group: 'Content',
    },
    { key: 'cardColor', label: 'Card Color', type: 'color', defaultValue: '#1A1A1B', group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#030303', group: 'Style' },
    { key: 'accentColor', label: 'Accent Color', type: 'color', defaultValue: '#FF4500', group: 'Style' },
  ],
  defaultConfig: {
    subreddit: 'technology',
    title:
      "AI-generated motion graphics are now indistinguishable from hand-crafted ones. Here's what that means for creators.",
    voteCount: 15800,
    commentCount: 2340,
    cardColor: '#1A1A1B',
    bgColor: '#030303',
    accentColor: '#FF4500',
  },
})
