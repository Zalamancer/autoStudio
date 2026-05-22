import React from 'react'
import { registerMotionGraphic } from '../registry'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface SceneYouTubeCommentConfig {
  username: string
  commentText: string
  likeCount: number
  timeAgo: string
  isVerified: boolean
  isPinned: boolean
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

function SceneYouTubeCommentComponent({ config, progress }: MotionGraphicProps<SceneYouTubeCommentConfig>) {
  const { username, commentText, likeCount, timeAgo, isVerified, isPinned, replyUsername, replyText, bgColor, cardColor, accentColor, textColor } = config

  const enterEnd = 0.3
  const holdEnd = 0.8
  const enterProgress = Math.min(1, progress / enterEnd)
  const holdProgress = progress >= enterEnd && progress < holdEnd ? (progress - enterEnd) / (holdEnd - enterEnd) : progress >= holdEnd ? 1 : 0
  const exitProgress = progress >= holdEnd ? (progress - holdEnd) / (1 - holdEnd) : 0

  // Pinned badge slides in from top
  const pinnedOpacity = isPinned ? easeOutCubic(Math.min(1, enterProgress / 0.15)) : 0
  const pinnedY = (1 - pinnedOpacity) * -10

  // Avatar pops in
  const avatarScale = easeOutBack(Math.max(0, Math.min(1, (enterProgress - 0.05) / 0.18)))

  // Username slides in
  const nameOpacity = easeOutCubic(Math.max(0, Math.min(1, (enterProgress - 0.1) / 0.12)))

  // Verified badge pops
  const verifiedScale = isVerified ? easeOutBack(Math.max(0, Math.min(1, (enterProgress - 0.18) / 0.15))) : 0

  // Comment text typewriter
  const typeProgress = easeOutCubic(Math.max(0, Math.min(1, (enterProgress - 0.2) / 0.45)))
  const visibleChars = Math.floor(typeProgress * commentText.length)
  const displayText = commentText.slice(0, visibleChars)

  // Like button and count
  const likeProgress = easeOutCubic(Math.max(0, Math.min(1, (enterProgress - 0.7) / 0.15)))
  const displayLikes = Math.floor(likeProgress * likeCount)

  // Reply appears
  const replyProgress = easeOutCubic(Math.max(0, Math.min(1, (enterProgress - 0.85) / 0.15)))
  const replyY = (1 - replyProgress) * 12

  // Hold: like thumb subtle bounce
  const thumbBounce = Math.sin(holdProgress * Math.PI * 4) * 2

  // Exit
  const exitEased = easeInCubic(exitProgress)
  const exitOpacity = 1 - exitEased
  const exitScale = 1 - exitEased * 0.1

  return (
    <div style={{
      position: 'absolute', inset: 0, overflow: 'hidden',
      background: bgColor,
      fontFamily: "'Roboto', 'Arial', sans-serif",
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '5%',
    }}>
      <div style={{
        background: cardColor,
        borderRadius: 'clamp(10px, 1.8vw, 14px)',
        padding: 'clamp(16px, 3vw, 28px)',
        maxWidth: 440, width: '100%',
        opacity: exitOpacity, transform: `scale(${exitScale})`,
        border: `1px solid ${textColor}08`,
      }}>
        {/* Pinned comment badge */}
        {isPinned && (
          <div style={{
            display: 'flex', alignItems: 'center', gap: 'clamp(4px, 0.7vw, 7px)',
            marginBottom: 'clamp(8px, 1.5vw, 14px)',
            opacity: pinnedOpacity,
            transform: `translateY(${pinnedY}px)`,
          }}>
            <span style={{
              fontSize: 'clamp(10px, 1.5vw, 13px)', color: `${textColor}60`,
            }}>{'\uD83D\uDCCC'}</span>
            <span style={{
              fontSize: 'clamp(10px, 1.5vw, 13px)', fontWeight: 500,
              color: `${textColor}60`,
            }}>Pinned by channel</span>
          </div>
        )}

        {/* Comment header */}
        <div style={{
          display: 'flex', gap: 'clamp(10px, 1.8vw, 16px)',
        }}>
          {/* Avatar */}
          <div style={{
            width: 'clamp(32px, 5.5vw, 42px)', height: 'clamp(32px, 5.5vw, 42px)',
            borderRadius: '50%', background: `${accentColor}20`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 'clamp(14px, 2.2vw, 18px)', fontWeight: 700, color: accentColor,
            transform: `scale(${avatarScale})`, flexShrink: 0,
          }}>{username.charAt(0).toUpperCase()}</div>

          <div style={{ flex: 1 }}>
            {/* Username row */}
            <div style={{
              display: 'flex', alignItems: 'center',
              gap: 'clamp(4px, 0.7vw, 8px)',
              marginBottom: 'clamp(3px, 0.5vw, 6px)',
            }}>
              <span style={{
                fontSize: 'clamp(11px, 1.8vw, 14px)', fontWeight: 600,
                color: textColor, opacity: nameOpacity,
              }}>@{username}</span>
              {/* Verified badge */}
              {isVerified && (
                <div style={{
                  width: 'clamp(12px, 2vw, 16px)', height: 'clamp(12px, 2vw, 16px)',
                  borderRadius: '50%', background: `${textColor}90`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  transform: `scale(${verifiedScale})`,
                }}>
                  <span style={{
                    fontSize: 'clamp(7px, 1.1vw, 9px)', color: cardColor, fontWeight: 900,
                  }}>{'\u2713'}</span>
                </div>
              )}
              <span style={{
                fontSize: 'clamp(10px, 1.4vw, 12px)', color: `${textColor}45`,
                opacity: nameOpacity,
              }}>{timeAgo}</span>
            </div>

            {/* Comment text */}
            <div style={{
              fontSize: 'clamp(13px, 2.1vw, 17px)', fontWeight: 400,
              color: `${textColor}DD`, lineHeight: 1.6,
              minHeight: 'clamp(36px, 7vh, 56px)',
              marginBottom: 'clamp(8px, 1.5vw, 14px)',
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

            {/* Like / Dislike / Reply bar */}
            <div style={{
              display: 'flex', alignItems: 'center',
              gap: 'clamp(12px, 2vw, 20px)',
              opacity: likeProgress,
            }}>
              {/* Thumbs up */}
              <div style={{
                display: 'flex', alignItems: 'center',
                gap: 'clamp(4px, 0.6vw, 7px)',
              }}>
                <span style={{
                  fontSize: 'clamp(14px, 2.2vw, 18px)',
                  transform: `translateY(${thumbBounce}px)`, display: 'inline-block',
                }}>{'\uD83D\uDC4D'}</span>
                <span style={{
                  fontSize: 'clamp(11px, 1.6vw, 14px)', fontWeight: 500,
                  color: `${textColor}80`,
                }}>{displayLikes.toLocaleString()}</span>
              </div>
              {/* Thumbs down */}
              <span style={{
                fontSize: 'clamp(14px, 2.2vw, 18px)', opacity: 0.5,
                transform: 'scaleY(-1)', display: 'inline-block',
              }}>{'\uD83D\uDC4D'}</span>
              {/* Reply button */}
              <span style={{
                fontSize: 'clamp(11px, 1.6vw, 14px)', fontWeight: 600,
                color: `${textColor}70`,
              }}>Reply</span>
            </div>

            {/* Reply thread */}
            {replyText && (
              <div style={{
                display: 'flex', gap: 'clamp(8px, 1.4vw, 12px)',
                marginTop: 'clamp(10px, 2vw, 18px)',
                opacity: replyProgress,
                transform: `translateY(${replyY}px)`,
              }}>
                <div style={{
                  width: 'clamp(22px, 3.5vw, 28px)', height: 'clamp(22px, 3.5vw, 28px)',
                  borderRadius: '50%', background: '#4A9EF520',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 'clamp(10px, 1.5vw, 12px)', fontWeight: 700, color: '#4A9EF5',
                  flexShrink: 0,
                }}>{replyUsername.charAt(0).toUpperCase()}</div>
                <div>
                  <div style={{
                    display: 'flex', alignItems: 'center', gap: 'clamp(4px, 0.6vw, 6px)',
                    marginBottom: 2,
                  }}>
                    <span style={{
                      fontSize: 'clamp(10px, 1.5vw, 12px)', fontWeight: 600, color: textColor,
                    }}>@{replyUsername}</span>
                  </div>
                  <div style={{
                    fontSize: 'clamp(11px, 1.7vw, 14px)', color: `${textColor}BB`, lineHeight: 1.5,
                  }}>{replyText}</div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

registerMotionGraphic({
  id: 'tpl-scene-youtube-comment',
  title: 'YouTube Comment',
  description: 'YouTube comment with avatar, like count, timestamp, verified badge, pinned label, reply thread, and typewriter text',
  tags: ['scene', 'youtube', 'social', 'comment', 'video', 'verified', 'pinned'],
  category: 'scene-layout',
  component: SceneYouTubeCommentComponent as unknown as React.ComponentType<MotionGraphicProps>,
  defaultConfig: {
    username: 'TechReviewer',
    commentText: 'This is genuinely one of the best explanations I\'ve seen. The way you broke down the concept at 3:42 made everything click. Subscribed!',
    likeCount: 1523,
    timeAgo: '2 days ago',
    isVerified: true,
    isPinned: true,
    replyUsername: 'CreatorName',
    replyText: 'Thank you so much! That means a lot.',
    bgColor: '#0F0F0F',
    cardColor: '#1A1A1A',
    accentColor: '#FF0000',
    textColor: '#F1F1F1',
  },
  configSchema: [
    { key: 'username', label: 'Username', type: 'text', defaultValue: 'TechReviewer', group: 'Content' },
    { key: 'commentText', label: 'Comment Text', type: 'text', defaultValue: 'This is genuinely one of the best explanations I\'ve seen. The way you broke down the concept at 3:42 made everything click. Subscribed!', group: 'Content' },
    { key: 'likeCount', label: 'Like Count', type: 'number', defaultValue: 1523, min: 0, max: 999999, group: 'Content' },
    { key: 'timeAgo', label: 'Time Ago', type: 'text', defaultValue: '2 days ago', group: 'Content' },
    { key: 'isVerified', label: 'Verified Badge', type: 'boolean', defaultValue: true, group: 'Content' },
    { key: 'isPinned', label: 'Pinned Comment', type: 'boolean', defaultValue: true, group: 'Content' },
    { key: 'replyUsername', label: 'Reply Username', type: 'text', defaultValue: 'CreatorName', group: 'Content' },
    { key: 'replyText', label: 'Reply Text', type: 'text', defaultValue: 'Thank you so much! That means a lot.', group: 'Content' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#0F0F0F', group: 'Style' },
    { key: 'cardColor', label: 'Card Color', type: 'color', defaultValue: '#1A1A1A', group: 'Style' },
    { key: 'accentColor', label: 'Accent Color', type: 'color', defaultValue: '#FF0000', group: 'Style' },
    { key: 'textColor', label: 'Text Color', type: 'color', defaultValue: '#F1F1F1', group: 'Style' },
  ],
})
