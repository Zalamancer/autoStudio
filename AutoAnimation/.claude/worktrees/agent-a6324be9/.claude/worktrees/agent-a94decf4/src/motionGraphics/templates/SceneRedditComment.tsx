import React from 'react'
import { registerMotionGraphic } from '../registry'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface SceneRedditCommentConfig {
  username: string
  subreddit: string
  commentText: string
  upvotes: number
  timeAgo: string
  replyUsername: string
  replyText: string
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

function SceneRedditCommentComponent({ config, progress }: MotionGraphicProps<SceneRedditCommentConfig>) {
  const { username, subreddit, commentText, upvotes, timeAgo, replyUsername, replyText, bgColor, cardColor, accentColor, textColor } = config

  const enterEnd = 0.3
  const holdEnd = 0.8
  const enterProgress = Math.min(1, progress / enterEnd)
  const holdProgress = progress >= enterEnd && progress < holdEnd ? (progress - enterEnd) / (holdEnd - enterEnd) : progress >= holdEnd ? 1 : 0
  const exitProgress = progress >= holdEnd ? (progress - holdEnd) / (1 - holdEnd) : 0

  // Subreddit header slides in
  const headerOpacity = easeOutCubic(Math.min(1, enterProgress / 0.2))
  const headerX = (1 - headerOpacity) * -30

  // Username fades in
  const userOpacity = easeOutCubic(Math.max(0, Math.min(1, (enterProgress - 0.1) / 0.2)))

  // Comment text typewriter
  const typeProgress = easeOutCubic(Math.max(0, Math.min(1, (enterProgress - 0.2) / 0.5)))
  const visibleChars = Math.floor(typeProgress * commentText.length)
  const displayText = commentText.slice(0, visibleChars)

  // Upvote counter animates
  const upvoteProgress = easeOutBack(Math.max(0, Math.min(1, (enterProgress - 0.7) / 0.25)))
  const displayUpvotes = Math.floor(upvoteProgress * upvotes)

  // Reply chain slides in from left
  const replyProgress = easeOutCubic(Math.max(0, Math.min(1, (enterProgress - 0.85) / 0.15)))
  const replyY = (1 - replyProgress) * 20

  // Hold: upvote count pulses slightly
  const upvotePulse = 1 + Math.sin(holdProgress * Math.PI * 4) * 0.05

  // Exit
  const exitEased = easeInCubic(exitProgress)
  const exitOpacity = 1 - exitEased
  const exitY = exitEased * -30

  return (
    <div style={{
      position: 'absolute', inset: 0, overflow: 'hidden',
      background: bgColor,
      fontFamily: "'IBM Plex Sans', -apple-system, sans-serif",
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '5%',
    }}>
      <div style={{
        background: cardColor,
        borderRadius: 'clamp(8px, 1.5vw, 12px)',
        padding: 'clamp(16px, 3.5%, 32px)',
        maxWidth: 440, width: '100%',
        opacity: exitOpacity,
        transform: `translateY(${exitY}px)`,
        border: `1px solid ${textColor}10`,
      }}>
        {/* Subreddit header */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 'clamp(6px, 1vw, 10px)',
          marginBottom: 'clamp(10px, 2vw, 18px)',
          opacity: headerOpacity,
          transform: `translateX(${headerX}px)`,
        }}>
          <div style={{
            width: 'clamp(20px, 3.5vw, 28px)', height: 'clamp(20px, 3.5vw, 28px)',
            borderRadius: '50%', background: accentColor,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 'clamp(10px, 1.8vw, 14px)', fontWeight: 800, color: '#fff',
          }}>r/</div>
          <span style={{
            fontSize: 'clamp(12px, 2vw, 16px)', fontWeight: 700, color: textColor,
          }}>r/{subreddit}</span>
        </div>

        {/* Username and time */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 'clamp(6px, 1vw, 10px)',
          marginBottom: 'clamp(6px, 1.2vw, 12px)',
          opacity: userOpacity,
        }}>
          <span style={{
            fontSize: 'clamp(11px, 1.7vw, 14px)', fontWeight: 600, color: accentColor,
          }}>u/{username}</span>
          <span style={{
            fontSize: 'clamp(9px, 1.3vw, 11px)', color: `${textColor}50`,
          }}>{'\u2022'}</span>
          <span style={{
            fontSize: 'clamp(9px, 1.3vw, 11px)', color: `${textColor}50`,
          }}>{timeAgo}</span>
        </div>

        {/* Comment text */}
        <div style={{
          fontSize: 'clamp(13px, 2.2vw, 18px)', fontWeight: 400,
          color: `${textColor}DD`, lineHeight: 1.6,
          marginBottom: 'clamp(12px, 2vw, 20px)',
          minHeight: 'clamp(40px, 8vh, 60px)',
        }}>
          {displayText}
          {visibleChars < commentText.length && (
            <span style={{
              display: 'inline-block', width: 2, height: '1em',
              background: accentColor, marginLeft: 1,
              opacity: Math.sin(progress * Math.PI * 20) > 0 ? 1 : 0,
            }} />
          )}
        </div>

        {/* Upvote bar */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 'clamp(8px, 1.5vw, 14px)',
          marginBottom: 'clamp(12px, 2vw, 20px)',
          opacity: upvoteProgress,
        }}>
          {/* Upvote arrow */}
          <div style={{
            display: 'flex', flexDirection: 'column', alignItems: 'center',
            gap: 1,
          }}>
            <div style={{
              width: 0, height: 0,
              borderLeft: 'clamp(6px, 1vw, 9px) solid transparent',
              borderRight: 'clamp(6px, 1vw, 9px) solid transparent',
              borderBottom: `clamp(8px, 1.4vw, 12px) solid ${accentColor}`,
              transform: `scale(${upvotePulse})`,
            }} />
            <span style={{
              fontSize: 'clamp(12px, 2vw, 16px)', fontWeight: 700, color: accentColor,
              transform: `scale(${upvotePulse})`, display: 'inline-block',
            }}>{displayUpvotes.toLocaleString()}</span>
            <div style={{
              width: 0, height: 0,
              borderLeft: 'clamp(6px, 1vw, 9px) solid transparent',
              borderRight: 'clamp(6px, 1vw, 9px) solid transparent',
              borderTop: `clamp(8px, 1.4vw, 12px) solid ${textColor}30`,
            }} />
          </div>
          <span style={{
            fontSize: 'clamp(10px, 1.5vw, 13px)', color: `${textColor}60`, fontWeight: 500,
          }}>Reply</span>
          <span style={{
            fontSize: 'clamp(10px, 1.5vw, 13px)', color: `${textColor}60`, fontWeight: 500,
          }}>Share</span>
          <span style={{
            fontSize: 'clamp(10px, 1.5vw, 13px)', color: `${textColor}60`, fontWeight: 500,
          }}>Award</span>
        </div>

        {/* Reply chain indent */}
        <div style={{
          display: 'flex', opacity: replyProgress,
          transform: `translateY(${replyY}px)`,
        }}>
          {/* Thread line */}
          <div style={{
            width: 2, background: `${textColor}20`,
            borderRadius: 1, marginRight: 'clamp(10px, 2vw, 18px)',
            marginLeft: 'clamp(6px, 1vw, 10px)', minHeight: 'clamp(30px, 6vh, 50px)',
          }} />
          <div>
            <div style={{
              display: 'flex', alignItems: 'center', gap: 'clamp(4px, 0.8vw, 8px)',
              marginBottom: 'clamp(3px, 0.6vw, 6px)',
            }}>
              <span style={{
                fontSize: 'clamp(10px, 1.5vw, 13px)', fontWeight: 600, color: '#4A9EF5',
              }}>u/{replyUsername}</span>
            </div>
            <div style={{
              fontSize: 'clamp(11px, 1.8vw, 15px)', color: `${textColor}BB`, lineHeight: 1.5,
            }}>{replyText}</div>
          </div>
        </div>
      </div>
    </div>
  )
}

registerMotionGraphic({
  id: 'tpl-scene-reddit-comment',
  title: 'Reddit Comment Thread',
  description: 'Reddit comment with upvote arrows, username, subreddit badge, reply chain indent, and typewriter text reveal',
  tags: ['scene', 'reddit', 'social', 'comment', 'thread', 'upvote', 'messaging'],
  category: 'scene-layout',
  component: SceneRedditCommentComponent as unknown as React.ComponentType<MotionGraphicProps>,
  defaultConfig: {
    username: 'thoughtful_redditor',
    subreddit: 'AskReddit',
    commentText: 'Honestly, the best advice I ever got was to stop comparing your chapter 1 to someone else\'s chapter 20. Changed my whole perspective.',
    upvotes: 4827,
    timeAgo: '3h ago',
    replyUsername: 'wise_commenter',
    replyText: 'This right here. Needed to hear this today.',
    bgColor: '#0E1113',
    cardColor: '#1A1E22',
    accentColor: '#FF4500',
    textColor: '#D7DADC',
  },
  configSchema: [
    { key: 'username', label: 'Username', type: 'text', defaultValue: 'thoughtful_redditor', group: 'Content' },
    { key: 'subreddit', label: 'Subreddit', type: 'text', defaultValue: 'AskReddit', group: 'Content' },
    { key: 'commentText', label: 'Comment Text', type: 'text', defaultValue: 'Honestly, the best advice I ever got was to stop comparing your chapter 1 to someone else\'s chapter 20. Changed my whole perspective.', group: 'Content' },
    { key: 'upvotes', label: 'Upvote Count', type: 'number', defaultValue: 4827, min: 0, max: 999999, group: 'Content' },
    { key: 'timeAgo', label: 'Time Ago', type: 'text', defaultValue: '3h ago', group: 'Content' },
    { key: 'replyUsername', label: 'Reply Username', type: 'text', defaultValue: 'wise_commenter', group: 'Content' },
    { key: 'replyText', label: 'Reply Text', type: 'text', defaultValue: 'This right here. Needed to hear this today.', group: 'Content' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#0E1113', group: 'Style' },
    { key: 'cardColor', label: 'Card Color', type: 'color', defaultValue: '#1A1E22', group: 'Style' },
    { key: 'accentColor', label: 'Accent Color', type: 'color', defaultValue: '#FF4500', group: 'Style' },
    { key: 'textColor', label: 'Text Color', type: 'color', defaultValue: '#D7DADC', group: 'Style' },
  ],
})
