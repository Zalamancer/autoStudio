import React from 'react'
import { registerMotionGraphic } from '../registry'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface SceneHackerNewsPostConfig {
  title: string
  url: string
  points: number
  author: string
  timeAgo: string
  commentCount: number
  rank: number
  bgColor: string
  linkColor: string
  textColor: string
  accentColor: string
}

function easeOutCubic(t: number): number { return 1 - Math.pow(1 - t, 3) }
function easeInCubic(t: number): number { return t * t * t }
function easeOutBack(t: number): number {
  const c1 = 1.70158
  const c3 = c1 + 1
  return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2)
}

function SceneHackerNewsPostComponent({ config, progress }: MotionGraphicProps<SceneHackerNewsPostConfig>) {
  const { title, url, points, author, timeAgo, commentCount, rank, bgColor, linkColor, textColor, accentColor } = config

  const enterEnd = 0.3
  const holdEnd = 0.8
  const enterProgress = Math.min(1, progress / enterEnd)
  const holdProgress = progress >= enterEnd && progress < holdEnd ? (progress - enterEnd) / (holdEnd - enterEnd) : progress >= holdEnd ? 1 : 0
  const exitProgress = progress >= holdEnd ? (progress - holdEnd) / (1 - holdEnd) : 0

  // HN header bar slides down
  const headerOpacity = easeOutCubic(Math.min(1, enterProgress / 0.15))
  const headerY = (1 - headerOpacity) * -12

  // Rank number appears
  const rankScale = easeOutBack(Math.max(0, Math.min(1, (enterProgress - 0.08) / 0.15)))

  // Upvote arrow
  const arrowOpacity = easeOutCubic(Math.max(0, Math.min(1, (enterProgress - 0.12) / 0.1)))

  // Title text reveal (word by word)
  const words = title.split(' ')
  const titleReveal = easeOutCubic(Math.max(0, Math.min(1, (enterProgress - 0.15) / 0.4)))
  const visibleWords = Math.floor(titleReveal * words.length)

  // URL fades in
  const urlOpacity = easeOutCubic(Math.max(0, Math.min(1, (enterProgress - 0.5) / 0.12)))

  // Points counter animates
  const pointsProgress = easeOutCubic(Math.max(0, Math.min(1, (enterProgress - 0.55) / 0.2)))
  const displayPoints = Math.floor(pointsProgress * points)

  // Meta row slides in
  const metaOpacity = easeOutCubic(Math.max(0, Math.min(1, (enterProgress - 0.65) / 0.15)))
  const metaY = (1 - metaOpacity) * 8

  // Comments count
  const commentsProgress = easeOutCubic(Math.max(0, Math.min(1, (enterProgress - 0.75) / 0.15)))

  // Hold: points counter subtle fluctuation
  const pointsFlicker = Math.floor(Math.sin(holdProgress * Math.PI * 8) * 2)

  // Exit
  const exitEased = easeInCubic(exitProgress)
  const exitOpacity = 1 - exitEased
  const exitY = exitEased * -20

  // Extract domain from URL
  const domain = url.replace(/^https?:\/\//, '').replace(/\/.*$/, '')

  return (
    <div style={{
      position: 'absolute', inset: 0, overflow: 'hidden',
      background: bgColor,
      fontFamily: "'Verdana', 'Geneva', sans-serif",
      display: 'flex', flexDirection: 'column',
    }}>
      {/* HN orange header bar */}
      <div style={{
        background: accentColor,
        padding: 'clamp(6px, 1.2vw, 10px) clamp(10px, 2vw, 18px)',
        display: 'flex', alignItems: 'center', gap: 'clamp(6px, 1vw, 10px)',
        opacity: headerOpacity,
        transform: `translateY(${headerY}px)`,
      }}>
        <div style={{
          width: 'clamp(16px, 2.5vw, 20px)', height: 'clamp(16px, 2.5vw, 20px)',
          border: '2px solid #fff', display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 'clamp(9px, 1.4vw, 11px)', fontWeight: 900, color: '#fff',
        }}>Y</div>
        <span style={{
          fontSize: 'clamp(12px, 2vw, 16px)', fontWeight: 700, color: '#000',
        }}>Hacker News</span>
        <div style={{ flex: 1 }} />
        <div style={{ display: 'flex', gap: 'clamp(8px, 1.5vw, 14px)' }}>
          {['new', 'comments', 'ask', 'show', 'jobs'].map((link) => (
            <span key={link} style={{
              fontSize: 'clamp(9px, 1.3vw, 11px)', color: '#000', fontWeight: 400,
            }}>{link}</span>
          ))}
        </div>
      </div>

      {/* Post content area */}
      <div style={{
        flex: 1, display: 'flex', flexDirection: 'column',
        justifyContent: 'center',
        padding: 'clamp(18px, 4vw, 36px) clamp(14px, 3vw, 28px)',
        opacity: exitOpacity, transform: `translateY(${exitY}px)`,
      }}>
        {/* Rank + upvote + title row */}
        <div style={{
          display: 'flex', alignItems: 'flex-start',
          gap: 'clamp(6px, 1vw, 10px)',
          marginBottom: 'clamp(4px, 0.8vw, 8px)',
        }}>
          {/* Rank number */}
          <span style={{
            fontSize: 'clamp(13px, 2vw, 17px)', color: `${textColor}60`,
            fontWeight: 400, minWidth: 'clamp(18px, 3vw, 26px)', textAlign: 'right',
            transform: `scale(${rankScale})`, display: 'inline-block',
          }}>{rank}.</span>

          {/* Upvote triangle */}
          <div style={{
            width: 0, height: 0,
            borderLeft: 'clamp(5px, 0.8vw, 7px) solid transparent',
            borderRight: 'clamp(5px, 0.8vw, 7px) solid transparent',
            borderBottom: `clamp(8px, 1.3vw, 11px) solid ${textColor}80`,
            marginTop: 'clamp(3px, 0.5vw, 5px)',
            opacity: arrowOpacity,
          }} />

          {/* Title + URL */}
          <div style={{ flex: 1 }}>
            <div style={{
              fontSize: 'clamp(14px, 2.4vw, 20px)', fontWeight: 400,
              color: linkColor, lineHeight: 1.4,
              marginBottom: 'clamp(2px, 0.4vw, 4px)',
            }}>
              {words.map((word, i) => (
                <span key={i} style={{
                  opacity: i < visibleWords ? 1 : 0,
                  transition: 'none',
                }}>{word}{i < words.length - 1 ? ' ' : ''}</span>
              ))}
            </div>
            <span style={{
              fontSize: 'clamp(10px, 1.5vw, 13px)', color: `${textColor}45`,
              opacity: urlOpacity,
            }}>({domain})</span>
          </div>
        </div>

        {/* Meta row: points, author, time, comments */}
        <div style={{
          display: 'flex', alignItems: 'center', flexWrap: 'wrap',
          gap: 'clamp(3px, 0.5vw, 5px)',
          paddingLeft: 'clamp(36px, 5.8vw, 50px)',
          opacity: metaOpacity,
          transform: `translateY(${metaY}px)`,
        }}>
          <span style={{
            fontSize: 'clamp(10px, 1.5vw, 13px)', color: `${textColor}70`,
          }}>{(displayPoints + pointsFlicker).toLocaleString()} points</span>
          <span style={{
            fontSize: 'clamp(10px, 1.5vw, 13px)', color: `${textColor}40`,
          }}>by</span>
          <span style={{
            fontSize: 'clamp(10px, 1.5vw, 13px)', color: `${textColor}70`,
          }}>{author}</span>
          <span style={{
            fontSize: 'clamp(10px, 1.5vw, 13px)', color: `${textColor}40`,
          }}>{timeAgo}</span>
          <span style={{
            fontSize: 'clamp(10px, 1.5vw, 13px)', color: `${textColor}40`,
          }}>|</span>
          <span style={{
            fontSize: 'clamp(10px, 1.5vw, 13px)', color: `${textColor}70`,
            opacity: commentsProgress,
          }}>{commentCount} comments</span>
        </div>

        {/* Decorative separator */}
        <div style={{
          width: 'clamp(50px, 10vw, 80px)', height: 1,
          background: `${accentColor}30`,
          marginTop: 'clamp(16px, 3vw, 28px)',
          marginLeft: 'clamp(36px, 5.8vw, 50px)',
          opacity: commentsProgress,
        }} />
      </div>

      {/* Footer with subtle HN aesthetic */}
      <div style={{
        borderTop: `1px solid ${accentColor}15`,
        padding: 'clamp(6px, 1vw, 10px) clamp(14px, 3vw, 28px)',
        opacity: headerOpacity * 0.3,
      }}>
        <span style={{
          fontSize: 'clamp(9px, 1.2vw, 11px)', color: `${textColor}30`,
        }}>Guidelines | FAQ | Lists | API | Security</span>
      </div>
    </div>
  )
}

registerMotionGraphic({
  id: 'tpl-scene-hackernews-post',
  title: 'Hacker News Post',
  description: 'Hacker News post with orange header, rank number, upvote arrow, points counter, author byline, and minimal Verdana aesthetic',
  tags: ['scene', 'hackernews', 'tech', 'social', 'minimal', 'news', 'startup'],
  category: 'scene-layout',
  component: SceneHackerNewsPostComponent as unknown as React.ComponentType<MotionGraphicProps>,
  defaultConfig: {
    title: 'Show HN: I built a real-time animation studio that runs in the browser',
    url: 'https://github.com/example/project',
    points: 847,
    author: 'techfounder',
    timeAgo: '4 hours ago',
    commentCount: 234,
    rank: 1,
    bgColor: '#F6F6EF',
    linkColor: '#000000',
    textColor: '#828282',
    accentColor: '#FF6600',
  },
  configSchema: [
    { key: 'title', label: 'Post Title', type: 'text', defaultValue: 'Show HN: I built a real-time animation studio that runs in the browser', group: 'Content' },
    { key: 'url', label: 'URL', type: 'text', defaultValue: 'https://github.com/example/project', group: 'Content' },
    { key: 'points', label: 'Points', type: 'number', defaultValue: 847, min: 0, max: 99999, group: 'Content' },
    { key: 'author', label: 'Author', type: 'text', defaultValue: 'techfounder', group: 'Content' },
    { key: 'timeAgo', label: 'Time Ago', type: 'text', defaultValue: '4 hours ago', group: 'Content' },
    { key: 'commentCount', label: 'Comment Count', type: 'number', defaultValue: 234, min: 0, max: 99999, group: 'Content' },
    { key: 'rank', label: 'Rank', type: 'number', defaultValue: 1, min: 1, max: 30, group: 'Content' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#F6F6EF', group: 'Style' },
    { key: 'linkColor', label: 'Link Color', type: 'color', defaultValue: '#000000', group: 'Style' },
    { key: 'textColor', label: 'Text Color', type: 'color', defaultValue: '#828282', group: 'Style' },
    { key: 'accentColor', label: 'Accent (Orange)', type: 'color', defaultValue: '#FF6600', group: 'Style' },
  ],
})
