import React from 'react'
import { registerMotionGraphic } from '../registry'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface SceneLinkedInPostConfig {
  authorName: string
  headline: string
  connectionDegree: string
  postText: string
  likeCount: number
  commentCount: number
  repostCount: number
  timeAgo: string
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

function SceneLinkedInPostComponent({ config, progress }: MotionGraphicProps<SceneLinkedInPostConfig>) {
  const { authorName, headline, connectionDegree, postText, likeCount, commentCount, repostCount, timeAgo, bgColor, cardColor, accentColor, textColor } = config

  const enterEnd = 0.3
  const holdEnd = 0.8
  const enterProgress = Math.min(1, progress / enterEnd)
  const holdProgress = progress >= enterEnd && progress < holdEnd ? (progress - enterEnd) / (holdEnd - enterEnd) : progress >= holdEnd ? 1 : 0
  const exitProgress = progress >= holdEnd ? (progress - holdEnd) / (1 - holdEnd) : 0

  // Avatar and author info slide in
  const avatarScale = easeOutBack(Math.min(1, enterProgress / 0.2))
  const nameOpacity = easeOutCubic(Math.max(0, Math.min(1, (enterProgress - 0.05) / 0.15)))
  const headlineOpacity = easeOutCubic(Math.max(0, Math.min(1, (enterProgress - 0.1) / 0.15)))

  // Post text typewriter
  const typeProgress = easeOutCubic(Math.max(0, Math.min(1, (enterProgress - 0.2) / 0.5)))
  const visibleChars = Math.floor(typeProgress * postText.length)
  const displayText = postText.slice(0, visibleChars)

  // Engagement bar slides up
  const engageProgress = easeOutCubic(Math.max(0, Math.min(1, (enterProgress - 0.75) / 0.2)))
  const engageY = (1 - engageProgress) * 15

  // Like count animated
  const displayLikes = Math.floor(easeOutCubic(Math.max(0, Math.min(1, (enterProgress - 0.8) / 0.18))) * likeCount)

  // Hold: subtle like reaction pulse
  const likePulse = 1 + Math.sin(holdProgress * Math.PI * 3) * 0.06

  // Exit
  const exitEased = easeInCubic(exitProgress)
  const exitOpacity = 1 - exitEased
  const exitY = exitEased * -25

  return (
    <div style={{
      position: 'absolute', inset: 0, overflow: 'hidden',
      background: bgColor,
      fontFamily: "'-apple-system', 'system-ui', 'Segoe UI', sans-serif",
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '5%',
    }}>
      <div style={{
        background: cardColor,
        borderRadius: 'clamp(8px, 1.5vw, 12px)',
        maxWidth: 440, width: '100%',
        opacity: exitOpacity,
        transform: `translateY(${exitY}px)`,
        border: `1px solid ${textColor}10`,
        overflow: 'hidden',
      }}>
        {/* Author header */}
        <div style={{
          display: 'flex', gap: 'clamp(10px, 1.8vw, 16px)',
          padding: 'clamp(14px, 2.8vw, 24px) clamp(14px, 2.8vw, 24px) 0',
        }}>
          {/* Professional avatar */}
          <div style={{
            width: 'clamp(40px, 6.5vw, 52px)', height: 'clamp(40px, 6.5vw, 52px)',
            borderRadius: '50%', background: `${accentColor}20`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 'clamp(17px, 2.8vw, 22px)', fontWeight: 700, color: accentColor,
            transform: `scale(${avatarScale})`, flexShrink: 0,
            border: `2px solid ${accentColor}30`,
          }}>{authorName.charAt(0).toUpperCase()}</div>
          <div style={{ flex: 1 }}>
            <div style={{
              display: 'flex', alignItems: 'center', gap: 'clamp(4px, 0.7vw, 7px)',
              opacity: nameOpacity,
            }}>
              <span style={{
                fontSize: 'clamp(13px, 2.2vw, 17px)', fontWeight: 700, color: textColor,
              }}>{authorName}</span>
              <span style={{
                fontSize: 'clamp(10px, 1.5vw, 13px)', color: `${textColor}50`, fontWeight: 500,
              }}>{'\u2022'} {connectionDegree}</span>
            </div>
            <div style={{
              fontSize: 'clamp(10px, 1.5vw, 13px)', color: `${textColor}60`,
              lineHeight: 1.4, marginTop: 1, opacity: headlineOpacity,
            }}>{headline}</div>
            <div style={{
              fontSize: 'clamp(9px, 1.3vw, 11px)', color: `${textColor}40`,
              marginTop: 2, opacity: headlineOpacity,
            }}>{timeAgo} {'\u2022'} {'\uD83C\uDF10'}</div>
          </div>
        </div>

        {/* Post text */}
        <div style={{
          padding: 'clamp(10px, 2vw, 18px) clamp(14px, 2.8vw, 24px)',
          fontSize: 'clamp(13px, 2.2vw, 17px)', fontWeight: 400,
          color: `${textColor}DD`, lineHeight: 1.6,
          minHeight: 'clamp(50px, 10vh, 80px)',
        }}>
          {displayText}
          {visibleChars < postText.length && (
            <span style={{
              display: 'inline-block', width: 2, height: '1em',
              background: accentColor, marginLeft: 1,
              opacity: Math.sin(progress * Math.PI * 20) > 0 ? 1 : 0,
            }} />
          )}
        </div>

        {/* Engagement count row */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: 'clamp(6px, 1vw, 10px) clamp(14px, 2.8vw, 24px)',
          borderBottom: `1px solid ${textColor}10`,
          opacity: engageProgress,
          transform: `translateY(${engageY}px)`,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'clamp(4px, 0.6vw, 6px)' }}>
            {/* Reaction icons */}
            <div style={{
              display: 'flex', marginRight: 'clamp(2px, 0.4vw, 4px)',
            }}>
              <div style={{
                width: 'clamp(16px, 2.5vw, 20px)', height: 'clamp(16px, 2.5vw, 20px)',
                borderRadius: '50%', background: '#0A66C2',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 'clamp(9px, 1.3vw, 11px)', color: '#fff',
                border: `1.5px solid ${cardColor}`, transform: `scale(${likePulse})`,
              }}>{'\uD83D\uDC4D'}</div>
              <div style={{
                width: 'clamp(16px, 2.5vw, 20px)', height: 'clamp(16px, 2.5vw, 20px)',
                borderRadius: '50%', background: '#DF704D',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 'clamp(9px, 1.3vw, 11px)', color: '#fff',
                marginLeft: -4, border: `1.5px solid ${cardColor}`,
              }}>{'\u2764\uFE0F'}</div>
              <div style={{
                width: 'clamp(16px, 2.5vw, 20px)', height: 'clamp(16px, 2.5vw, 20px)',
                borderRadius: '50%', background: '#44712E',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 'clamp(9px, 1.3vw, 11px)', color: '#fff',
                marginLeft: -4, border: `1.5px solid ${cardColor}`,
              }}>{'\uD83D\uDCA1'}</div>
            </div>
            <span style={{
              fontSize: 'clamp(10px, 1.5vw, 13px)', color: `${textColor}60`,
            }}>{displayLikes.toLocaleString()}</span>
          </div>
          <div style={{ display: 'flex', gap: 'clamp(8px, 1.5vw, 14px)' }}>
            <span style={{
              fontSize: 'clamp(10px, 1.5vw, 13px)', color: `${textColor}50`,
            }}>{commentCount} comments</span>
            <span style={{
              fontSize: 'clamp(10px, 1.5vw, 13px)', color: `${textColor}50`,
            }}>{repostCount} reposts</span>
          </div>
        </div>

        {/* Action bar */}
        <div style={{
          display: 'flex', justifyContent: 'space-around',
          padding: 'clamp(8px, 1.5vw, 14px) clamp(14px, 2.8vw, 24px)',
          opacity: engageProgress,
        }}>
          {['Like', 'Comment', 'Repost', 'Send'].map((action) => (
            <div key={action} style={{
              display: 'flex', alignItems: 'center', gap: 'clamp(3px, 0.5vw, 6px)',
            }}>
              <span style={{
                fontSize: 'clamp(10px, 1.6vw, 14px)', fontWeight: 600,
                color: `${textColor}60`,
              }}>{action}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

registerMotionGraphic({
  id: 'tpl-scene-linkedin-post',
  title: 'LinkedIn Post',
  description: 'LinkedIn post with professional avatar, connection degree, headline, engagement reactions bar, and action buttons',
  tags: ['scene', 'linkedin', 'social', 'professional', 'networking', 'post', 'engagement'],
  category: 'scene-layout',
  component: SceneLinkedInPostComponent as unknown as React.ComponentType<MotionGraphicProps>,
  defaultConfig: {
    authorName: 'Jordan Mitchell',
    headline: 'Senior Product Designer at Figma',
    connectionDegree: '2nd',
    postText: 'After 10 years in design, here\'s what I wish someone told me on day one:\n\nYour portfolio is not your best work. It\'s your best story about your work.\n\nContext beats pixels every single time.',
    likeCount: 2847,
    commentCount: 142,
    repostCount: 89,
    timeAgo: '6h',
    bgColor: '#F3F2EF',
    cardColor: '#FFFFFF',
    accentColor: '#0A66C2',
    textColor: '#191919',
  },
  configSchema: [
    { key: 'authorName', label: 'Author Name', type: 'text', defaultValue: 'Jordan Mitchell', group: 'Content' },
    { key: 'headline', label: 'Headline', type: 'text', defaultValue: 'Senior Product Designer at Figma', group: 'Content' },
    { key: 'connectionDegree', label: 'Connection Degree', type: 'text', defaultValue: '2nd', group: 'Content' },
    { key: 'postText', label: 'Post Text', type: 'text', defaultValue: 'After 10 years in design, here\'s what I wish someone told me on day one:\n\nYour portfolio is not your best work. It\'s your best story about your work.\n\nContext beats pixels every single time.', group: 'Content' },
    { key: 'likeCount', label: 'Like Count', type: 'number', defaultValue: 2847, min: 0, max: 999999, group: 'Content' },
    { key: 'commentCount', label: 'Comment Count', type: 'number', defaultValue: 142, min: 0, max: 99999, group: 'Content' },
    { key: 'repostCount', label: 'Repost Count', type: 'number', defaultValue: 89, min: 0, max: 99999, group: 'Content' },
    { key: 'timeAgo', label: 'Time Ago', type: 'text', defaultValue: '6h', group: 'Content' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#F3F2EF', group: 'Style' },
    { key: 'cardColor', label: 'Card Color', type: 'color', defaultValue: '#FFFFFF', group: 'Style' },
    { key: 'accentColor', label: 'Accent Color', type: 'color', defaultValue: '#0A66C2', group: 'Style' },
    { key: 'textColor', label: 'Text Color', type: 'color', defaultValue: '#191919', group: 'Style' },
  ],
})
