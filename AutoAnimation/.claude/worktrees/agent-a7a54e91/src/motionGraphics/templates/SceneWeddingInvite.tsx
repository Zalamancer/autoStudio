import React from 'react'
import { registerMotionGraphic } from '../registry'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface WeddingInviteConfig {
  name1: string
  name2: string
  date: string
  venue: string
  rsvpText: string
  goldColor: string
  bgColor: string
  textColor: string
}

function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3)
}

function easeInCubic(t: number): number {
  return t * t * t
}

function easeOutQuart(t: number): number {
  return 1 - Math.pow(1 - t, 4)
}

function SceneWeddingInviteComponent({
  config,
  frame,
  durationInFrames,
}: MotionGraphicProps<WeddingInviteConfig>) {
  const { name1, name2, date, venue, rsvpText, goldColor, bgColor, textColor } = config
  const progress = frame / durationInFrames

  // Phase breakdown
  const enterEnd = 0.3
  const holdEnd = 0.8
  const enterProgress = Math.min(1, progress / enterEnd)
  const exitProgress = progress >= holdEnd ? (progress - holdEnd) / (1 - holdEnd) : 0
  const holdProgress =
    progress >= enterEnd && progress < holdEnd
      ? (progress - enterEnd) / (holdEnd - enterEnd)
      : progress >= holdEnd
        ? 1
        : 0

  // Name 1 slides in from left
  const name1X = enterProgress < 1
    ? -80 * (1 - easeOutCubic(Math.min(1, enterProgress / 0.4)))
    : exitProgress > 0
      ? -80 * easeInCubic(exitProgress)
      : 0
  const name1Opacity = enterProgress < 1
    ? easeOutCubic(Math.min(1, enterProgress / 0.4))
    : exitProgress > 0
      ? 1 - easeInCubic(exitProgress)
      : 1

  // Name 2 slides in from right
  const name2X = enterProgress < 1
    ? 80 * (1 - easeOutCubic(Math.min(1, enterProgress / 0.4)))
    : exitProgress > 0
      ? 80 * easeInCubic(exitProgress)
      : 0
  const name2Opacity = name1Opacity

  // Gold line draws between names
  const lineDrawProgress = easeOutQuart(Math.max(0, Math.min(1, (enterProgress - 0.25) / 0.4)))
  const lineWidth = exitProgress > 0 ? lineDrawProgress * (1 - easeInCubic(exitProgress)) : lineDrawProgress

  // Ampersand fades in at center
  const ampOpacity = enterProgress < 1
    ? easeOutCubic(Math.max(0, Math.min(1, (enterProgress - 0.3) / 0.3)))
    : exitProgress > 0
      ? 1 - easeInCubic(exitProgress)
      : 1
  const ampScale = enterProgress < 1
    ? 0.5 + 0.5 * easeOutCubic(Math.max(0, Math.min(1, (enterProgress - 0.3) / 0.3)))
    : exitProgress > 0
      ? 1 - 0.3 * easeInCubic(exitProgress)
      : 1

  // Date fades in
  const dateOpacity = enterProgress < 1
    ? easeOutCubic(Math.max(0, Math.min(1, (enterProgress - 0.5) / 0.3)))
    : exitProgress > 0
      ? 1 - easeInCubic(exitProgress)
      : 1
  const dateY = enterProgress < 1
    ? 15 * (1 - easeOutCubic(Math.max(0, Math.min(1, (enterProgress - 0.5) / 0.3))))
    : exitProgress > 0
      ? 15 * easeInCubic(exitProgress)
      : 0

  // Venue fades in
  const venueOpacity = enterProgress < 1
    ? easeOutCubic(Math.max(0, Math.min(1, (enterProgress - 0.6) / 0.3)))
    : exitProgress > 0
      ? 1 - easeInCubic(exitProgress)
      : 1
  const venueY = enterProgress < 1
    ? 15 * (1 - easeOutCubic(Math.max(0, Math.min(1, (enterProgress - 0.6) / 0.3))))
    : exitProgress > 0
      ? 15 * easeInCubic(exitProgress)
      : 0

  // RSVP fades in
  const rsvpOpacity = enterProgress < 1
    ? easeOutCubic(Math.max(0, Math.min(1, (enterProgress - 0.75) / 0.25)))
    : exitProgress > 0
      ? 1 - easeInCubic(exitProgress)
      : 1

  // Subtle gold shimmer during hold
  const shimmerX = holdProgress * 200 - 50

  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        overflow: 'hidden',
        background: bgColor,
        fontFamily: "'Georgia', 'Times New Roman', serif",
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '8%',
      }}
    >
      {/* Corner ornaments */}
      {[0, 1, 2, 3].map((corner) => {
        const isTop = corner < 2
        const isLeft = corner % 2 === 0
        return (
          <div
            key={corner}
            style={{
              position: 'absolute',
              [isTop ? 'top' : 'bottom']: '5%',
              [isLeft ? 'left' : 'right']: '5%',
              width: 'clamp(30px, 6vw, 60px)',
              height: 'clamp(30px, 6vw, 60px)',
              borderTop: isTop ? `2px solid ${goldColor}` : 'none',
              borderBottom: isTop ? 'none' : `2px solid ${goldColor}`,
              borderLeft: isLeft ? `2px solid ${goldColor}` : 'none',
              borderRight: isLeft ? 'none' : `2px solid ${goldColor}`,
              opacity: name1Opacity * 0.6,
            }}
          />
        )
      })}

      {/* Name 1 */}
      <div
        style={{
          fontSize: 'clamp(24px, 6vw, 56px)',
          fontWeight: 400,
          fontStyle: 'italic',
          color: textColor,
          opacity: name1Opacity,
          transform: `translateX(${name1X}px)`,
          letterSpacing: '0.05em',
          lineHeight: 1.2,
        }}
      >
        {name1}
      </div>

      {/* Ampersand with gold */}
      <div
        style={{
          fontSize: 'clamp(32px, 7vw, 64px)',
          fontWeight: 300,
          color: goldColor,
          opacity: ampOpacity,
          transform: `scale(${ampScale})`,
          margin: 'clamp(4px, 1vh, 12px) 0',
          lineHeight: 1,
        }}
      >
        &amp;
      </div>

      {/* Name 2 */}
      <div
        style={{
          fontSize: 'clamp(24px, 6vw, 56px)',
          fontWeight: 400,
          fontStyle: 'italic',
          color: textColor,
          opacity: name2Opacity,
          transform: `translateX(${name2X}px)`,
          letterSpacing: '0.05em',
          lineHeight: 1.2,
        }}
      >
        {name2}
      </div>

      {/* Gold line */}
      <div
        style={{
          width: `${lineWidth * 100}%`,
          maxWidth: '180px',
          height: 1,
          background: `linear-gradient(90deg, transparent, ${goldColor}, transparent)`,
          margin: 'clamp(12px, 2.5vh, 28px) 0',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Shimmer effect */}
        <div
          style={{
            position: 'absolute',
            top: -1,
            left: `${shimmerX}%`,
            width: 40,
            height: 3,
            background: `linear-gradient(90deg, transparent, ${goldColor}FF, transparent)`,
            filter: 'blur(2px)',
          }}
        />
      </div>

      {/* Date */}
      <div
        style={{
          fontSize: 'clamp(14px, 3vw, 24px)',
          fontWeight: 400,
          color: textColor,
          opacity: dateOpacity,
          transform: `translateY(${dateY}px)`,
          letterSpacing: '0.15em',
          textTransform: 'uppercase',
          marginBottom: 'clamp(6px, 1vh, 12px)',
        }}
      >
        {date}
      </div>

      {/* Venue */}
      <div
        style={{
          fontSize: 'clamp(12px, 2.5vw, 18px)',
          fontWeight: 400,
          color: `${textColor}BB`,
          opacity: venueOpacity,
          transform: `translateY(${venueY}px)`,
          letterSpacing: '0.08em',
          marginBottom: 'clamp(12px, 2.5vh, 24px)',
        }}
      >
        {venue}
      </div>

      {/* RSVP */}
      <div
        style={{
          fontSize: 'clamp(10px, 2vw, 14px)',
          fontWeight: 400,
          color: goldColor,
          opacity: rsvpOpacity,
          letterSpacing: '0.2em',
          textTransform: 'uppercase',
          borderTop: `1px solid ${goldColor}40`,
          borderBottom: `1px solid ${goldColor}40`,
          padding: 'clamp(6px, 1vh, 12px) clamp(16px, 3vw, 32px)',
        }}
      >
        {rsvpText}
      </div>
    </div>
  )
}

registerMotionGraphic({
  id: 'tpl-scene-wedding-invite',
  title: 'Wedding Invitation',
  description:
    'Elegant wedding invitation with couple names sliding from sides, gold accents, decorative line draw, and RSVP reveal on cream background',
  tags: ['scene', 'wedding', 'invitation', 'romantic', 'elegant', 'event'],
  category: 'scene-layout',
  component: SceneWeddingInviteComponent as unknown as React.ComponentType<MotionGraphicProps>,
  configSchema: [
    { key: 'name1', label: 'First Name', type: 'text', defaultValue: 'Isabella', group: 'Content' },
    { key: 'name2', label: 'Second Name', type: 'text', defaultValue: 'Alexander', group: 'Content' },
    { key: 'date', label: 'Date', type: 'text', defaultValue: 'June 15, 2024', group: 'Content' },
    { key: 'venue', label: 'Venue', type: 'text', defaultValue: 'The Grand Ballroom, Napa Valley', group: 'Content' },
    { key: 'rsvpText', label: 'RSVP Text', type: 'text', defaultValue: 'RSVP by May 1st', group: 'Content' },
    { key: 'goldColor', label: 'Gold Accent', type: 'color', defaultValue: '#C9A96E', group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#FDF8F0', group: 'Style' },
    { key: 'textColor', label: 'Text Color', type: 'color', defaultValue: '#2C2420', group: 'Style' },
  ],
  defaultConfig: {
    name1: 'Isabella',
    name2: 'Alexander',
    date: 'June 15, 2024',
    venue: 'The Grand Ballroom, Napa Valley',
    rsvpText: 'RSVP by May 1st',
    goldColor: '#C9A96E',
    bgColor: '#FDF8F0',
    textColor: '#2C2420',
  },
})
