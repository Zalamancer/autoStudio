import React from 'react'
import { registerMotionGraphic } from '../registry'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface LinkInBioConfig {
  username: string
  bio: string
  links: string[]
  bgColor: string
  accentColor: string
  cardColor: string
  textColor: string
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

const LINK_ICONS: Record<string, string> = {
  YouTube: '🎥',
  Website: '🌐',
  Shop: '🛍️',
  Discord: '💬',
  Newsletter: '📧',
  Podcast: '🎙️',
  Portfolio: '💼',
  Merch: '👕',
}

function SceneLinkInBioComponent({
  config,
  frame,
  durationInFrames,
}: MotionGraphicProps<LinkInBioConfig>) {
  const { username, bio, links, bgColor, accentColor, cardColor, textColor } = config
  const progress = frame / durationInFrames

  const enterEnd = 0.3
  const holdEnd = 0.8
  const enterProgress = Math.min(1, progress / enterEnd)
  const holdProgress = progress >= enterEnd && progress < holdEnd ? (progress - enterEnd) / (holdEnd - enterEnd) : progress >= holdEnd ? 1 : 0
  const exitProgress = progress >= holdEnd ? (progress - holdEnd) / (1 - holdEnd) : 0

  // Avatar pop
  const avatarPop = easeOutBack(Math.min(1, enterProgress / 0.3))

  // Username + bio
  const nameReveal = easeOutCubic(Math.max(0, Math.min(1, (enterProgress - 0.15) / 0.25)))

  // Links stagger in
  const getLinkProgress = (idx: number): number => {
    const delay = 0.35 + idx * 0.08
    return easeOutBack(Math.max(0, Math.min(1, (enterProgress - delay) / 0.25)))
  }

  // Hold: link highlight sweep
  const highlightIdx = Math.floor(holdProgress * links.length * 2) % links.length

  // Exit
  const exitEased = easeInCubic(exitProgress)
  const exitOpacity = 1 - exitEased
  const exitScale = 1 - exitEased * 0.12

  // Avatar gradient ring rotation
  const ringRotation = frame * 0.5

  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        overflow: 'hidden',
        background: bgColor,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: "'Helvetica Neue', Arial, sans-serif",
        padding: '5%',
      }}
    >
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 'clamp(10px, 2vh, 18px)',
          width: '100%',
          maxWidth: 380,
          transform: `scale(${exitScale})`,
          opacity: exitOpacity,
        }}
      >
        {/* Avatar with gradient ring */}
        <div
          style={{
            position: 'relative',
            transform: `scale(${avatarPop})`,
          }}
        >
          {/* Spinning gradient border */}
          <div
            style={{
              position: 'absolute',
              inset: -4,
              borderRadius: '50%',
              background: `conic-gradient(from ${ringRotation}deg, ${accentColor}, #EC4899, #F59E0B, ${accentColor})`,
              padding: 3,
            }}
          >
            <div
              style={{
                width: '100%',
                height: '100%',
                borderRadius: '50%',
                background: bgColor,
              }}
            />
          </div>
          <div
            style={{
              width: 'clamp(64px, 13vw, 90px)',
              height: 'clamp(64px, 13vw, 90px)',
              borderRadius: '50%',
              background: `linear-gradient(135deg, ${accentColor}, ${accentColor}80)`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 'clamp(24px, 5vw, 36px)',
              fontWeight: 900,
              color: '#FFFFFF',
              position: 'relative',
              zIndex: 1,
            }}
          >
            {username.charAt(0).toUpperCase()}
          </div>
        </div>

        {/* Username + bio */}
        <div
          style={{
            textAlign: 'center',
            opacity: nameReveal,
            transform: `translateY(${(1 - nameReveal) * 10}px)`,
          }}
        >
          <div
            style={{
              fontSize: 'clamp(16px, 3vw, 22px)',
              fontWeight: 800,
              color: textColor,
            }}
          >
            @{username}
          </div>
          <div
            style={{
              fontSize: 'clamp(10px, 1.6vw, 13px)',
              fontWeight: 500,
              color: `${textColor}70`,
              marginTop: 4,
              maxWidth: 280,
            }}
          >
            {bio}
          </div>
        </div>

        {/* Link buttons */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 'clamp(6px, 1vh, 10px)',
            width: '100%',
          }}
        >
          {links.map((link, i) => {
            const lp = getLinkProgress(i)
            const isHighlighted = holdProgress > 0 && i === highlightIdx
            const hoverScale = isHighlighted ? 1.03 : 1
            const icon = LINK_ICONS[link] || '🔗'

            return (
              <div
                key={i}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 'clamp(10px, 1.5vw, 14px)',
                  background: isHighlighted ? `${accentColor}18` : cardColor,
                  borderRadius: 'clamp(10px, 1.5vw, 14px)',
                  padding: 'clamp(12px, 2vh, 18px) clamp(14px, 2.5vw, 20px)',
                  border: isHighlighted ? `2px solid ${accentColor}50` : `1px solid ${textColor}10`,
                  transform: `scale(${lp * hoverScale}) translateY(${(1 - lp) * 15}px)`,
                  opacity: lp,
                  cursor: 'pointer',
                }}
              >
                <span style={{ fontSize: 'clamp(16px, 2.5vw, 22px)' }}>{icon}</span>
                <span
                  style={{
                    flex: 1,
                    fontSize: 'clamp(12px, 2vw, 15px)',
                    fontWeight: 700,
                    color: textColor,
                  }}
                >
                  {link}
                </span>
                <span
                  style={{
                    fontSize: 'clamp(12px, 2vw, 16px)',
                    color: `${textColor}40`,
                    transform: `translateX(${isHighlighted ? 3 : 0}px)`,
                  }}
                >
                  {'›'}
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
  id: 'tpl-scene-link-in-bio',
  title: 'Scene Link In Bio',
  description:
    'Link-in-bio card display with spinning gradient avatar ring, staggered link buttons, and highlight sweep animation.',
  tags: ['scene', 'social-media', 'link-in-bio', 'linktree', 'creator', 'profile', 'links'],
  category: 'scene-layout',
  component: SceneLinkInBioComponent as unknown as React.ComponentType<MotionGraphicProps>,
  configSchema: [
    { key: 'username', label: 'Username', type: 'text', defaultValue: 'creator', group: 'Content' },
    { key: 'bio', label: 'Bio', type: 'text', defaultValue: 'Content Creator & Digital Artist', group: 'Content' },
    { key: 'links', label: 'Links', type: 'text-array', defaultValue: ['YouTube', 'Website', 'Shop', 'Discord', 'Newsletter'], group: 'Content' },
    { key: 'accentColor', label: 'Accent Color', type: 'color', defaultValue: '#8B5CF6', group: 'Style' },
    { key: 'cardColor', label: 'Card Color', type: 'color', defaultValue: '#1A1A2E', group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#0A0A14', group: 'Style' },
    { key: 'textColor', label: 'Text Color', type: 'color', defaultValue: '#FFFFFF', group: 'Style' },
  ],
  defaultConfig: {
    username: 'creator',
    bio: 'Content Creator & Digital Artist',
    links: ['YouTube', 'Website', 'Shop', 'Discord', 'Newsletter'],
    accentColor: '#8B5CF6',
    cardColor: '#1A1A2E',
    bgColor: '#0A0A14',
    textColor: '#FFFFFF',
  },
})
