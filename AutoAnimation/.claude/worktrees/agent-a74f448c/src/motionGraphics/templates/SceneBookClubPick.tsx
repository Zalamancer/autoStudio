import React from 'react'
import { registerMotionGraphic } from '../registry'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface SceneBookClubPickConfig {
  bookTitle: string
  authorName: string
  clubName: string
  meetingDate: string
  discussion: string
  bgColor: string
  textColor: string
  accentColor: string
  badgeColor: string
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

function SceneBookClubPickComponent({ config, progress }: MotionGraphicProps<SceneBookClubPickConfig>) {
  const { bookTitle, authorName, clubName, meetingDate, discussion, bgColor, textColor, accentColor, badgeColor } = config

  const enterProgress = progress < 0.25 ? progress / 0.25 : 1
  const holdProgress = progress >= 0.25 && progress < 0.8 ? (progress - 0.25) / 0.55 : progress >= 0.8 ? 1 : 0
  const exitProgress = progress >= 0.8 ? (progress - 0.8) / 0.2 : 0

  const badgeReveal = easeOutBack(Math.min(1, enterProgress / 0.4))
  const titleReveal = easeOutCubic(Math.max(0, Math.min(1, (enterProgress - 0.15) / 0.5)))
  const authorReveal = easeOutCubic(Math.max(0, Math.min(1, (enterProgress - 0.35) / 0.4)))
  const detailsReveal = easeOutCubic(Math.max(0, Math.min(1, (enterProgress - 0.5) / 0.4)))
  const discussionReveal = easeOutCubic(Math.max(0, Math.min(1, (enterProgress - 0.65) / 0.3)))

  // Hold: badge glow pulse
  const glowPulse = holdProgress > 0 ? 8 + Math.sin(holdProgress * Math.PI * 5) * 4 : 0

  const exitEased = easeInCubic(exitProgress)
  const exitOpacity = 1 - exitEased

  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        overflow: 'hidden',
        background: bgColor,
        fontFamily: "'Georgia', 'Palatino Linotype', serif",
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '6%',
      }}
    >
      {/* Decorative corner elements */}
      {[
        { top: '4%', left: '4%' },
        { top: '4%', right: '4%' },
        { bottom: '4%', left: '4%' },
        { bottom: '4%', right: '4%' },
      ].map((pos, i) => (
        <div
          key={i}
          style={{
            position: 'absolute',
            ...pos,
            width: 'clamp(20px, 4vw, 40px)',
            height: 'clamp(20px, 4vw, 40px)',
            borderTop: i < 2 ? `2px solid ${accentColor}20` : 'none',
            borderBottom: i >= 2 ? `2px solid ${accentColor}20` : 'none',
            borderLeft: i % 2 === 0 ? `2px solid ${accentColor}20` : 'none',
            borderRight: i % 2 === 1 ? `2px solid ${accentColor}20` : 'none',
          }}
        />
      ))}

      <div
        style={{
          width: '100%',
          maxWidth: 460,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 'clamp(10px, 2vw, 20px)',
          opacity: exitOpacity,
          transform: `scale(${1 - exitEased * 0.12})`,
        }}
      >
        {/* Club Pick badge */}
        <div
          style={{
            background: badgeColor,
            color: '#fff',
            fontSize: 'clamp(9px, 1.6vw, 13px)',
            fontWeight: 800,
            fontFamily: "'Inter', 'Helvetica Neue', sans-serif",
            textTransform: 'uppercase',
            letterSpacing: '0.15em',
            padding: 'clamp(6px, 1vw, 10px) clamp(16px, 3vw, 28px)',
            borderRadius: 100,
            opacity: badgeReveal,
            transform: `scale(${badgeReveal})`,
            boxShadow: `0 0 ${glowPulse}px ${badgeColor}60`,
          }}
        >
          {'\u2605'} {clubName} Pick
        </div>

        {/* Ornamental divider */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 'clamp(6px, 1vw, 12px)',
            opacity: titleReveal,
          }}
        >
          <div style={{ width: 'clamp(20px, 4vw, 40px)', height: 1, background: `${accentColor}40` }} />
          <div style={{ fontSize: 'clamp(8px, 1.2vw, 12px)', color: `${accentColor}60` }}>{'\u2726'}</div>
          <div style={{ width: 'clamp(20px, 4vw, 40px)', height: 1, background: `${accentColor}40` }} />
        </div>

        {/* Book title */}
        <div
          style={{
            fontSize: 'clamp(22px, 5.5vw, 42px)',
            fontWeight: 700,
            fontStyle: 'italic',
            color: textColor,
            textAlign: 'center',
            lineHeight: 1.2,
            opacity: titleReveal,
            transform: `translateY(${(1 - titleReveal) * 20}px)`,
          }}
        >
          {bookTitle}
        </div>

        {/* Author */}
        <div
          style={{
            fontSize: 'clamp(12px, 2.2vw, 18px)',
            color: `${textColor}80`,
            opacity: authorReveal,
            transform: `translateY(${(1 - authorReveal) * 10}px)`,
          }}
        >
          by {authorName}
        </div>

        {/* Meeting details */}
        <div
          style={{
            display: 'flex',
            gap: 'clamp(12px, 2.5vw, 24px)',
            opacity: detailsReveal,
            transform: `translateY(${(1 - detailsReveal) * 10}px)`,
          }}
        >
          <div
            style={{
              background: `${textColor}08`,
              border: `1px solid ${textColor}12`,
              borderRadius: 'clamp(6px, 1vw, 10px)',
              padding: 'clamp(8px, 1.5vw, 14px) clamp(12px, 2vw, 20px)',
              textAlign: 'center',
            }}
          >
            <div
              style={{
                fontSize: 'clamp(8px, 1.2vw, 10px)',
                fontFamily: "'Inter', sans-serif",
                textTransform: 'uppercase',
                letterSpacing: '0.1em',
                color: `${textColor}50`,
                marginBottom: 2,
              }}
            >
              Meeting
            </div>
            <div style={{ fontSize: 'clamp(11px, 2vw, 16px)', fontWeight: 600, color: accentColor }}>
              {meetingDate}
            </div>
          </div>
        </div>

        {/* Discussion prompt */}
        <div
          style={{
            fontSize: 'clamp(10px, 1.8vw, 14px)',
            fontStyle: 'italic',
            color: `${textColor}60`,
            textAlign: 'center',
            maxWidth: '85%',
            lineHeight: 1.5,
            opacity: discussionReveal,
            transform: `translateY(${(1 - discussionReveal) * 8}px)`,
            borderTop: `1px solid ${textColor}10`,
            paddingTop: 'clamp(8px, 1.5vw, 14px)',
          }}
        >
          Discussion: {discussion}
        </div>
      </div>
    </div>
  )
}

registerMotionGraphic({
  id: 'tpl-scene-book-club-pick',
  title: 'Book Club Pick',
  description:
    'Book club selection card with glowing pick badge, ornamental dividers, meeting date, and discussion prompt',
  tags: ['scene', 'book', 'club', 'reading', 'discussion', 'literary', 'literature'],
  category: 'scene-layout',
  component: SceneBookClubPickComponent as any,
  defaultConfig: {
    bookTitle: 'The Midnight Library',
    authorName: 'Matt Haig',
    clubName: 'Fireside',
    meetingDate: 'March 25',
    discussion: 'What alternate life would you choose?',
    bgColor: '#1a150e',
    textColor: '#f5edd6',
    accentColor: '#C9A96E',
    badgeColor: '#8B4513',
  },
  configSchema: [
    { key: 'bookTitle', label: 'Book Title', type: 'text', defaultValue: 'The Midnight Library', group: 'Content' },
    { key: 'authorName', label: 'Author', type: 'text', defaultValue: 'Matt Haig', group: 'Content' },
    { key: 'clubName', label: 'Club Name', type: 'text', defaultValue: 'Fireside', group: 'Content' },
    { key: 'meetingDate', label: 'Meeting Date', type: 'text', defaultValue: 'March 25', group: 'Content' },
    { key: 'discussion', label: 'Discussion Prompt', type: 'text', defaultValue: 'What alternate life would you choose?', group: 'Content' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#1a150e', group: 'Style' },
    { key: 'textColor', label: 'Text Color', type: 'color', defaultValue: '#f5edd6', group: 'Style' },
    { key: 'accentColor', label: 'Accent Color', type: 'color', defaultValue: '#C9A96E', group: 'Style' },
    { key: 'badgeColor', label: 'Badge Color', type: 'color', defaultValue: '#8B4513', group: 'Style' },
  ],
})
