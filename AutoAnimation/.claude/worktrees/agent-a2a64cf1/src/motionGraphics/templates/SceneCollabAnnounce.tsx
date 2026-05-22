import React from 'react'
import { registerMotionGraphic } from '../registry'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface CollabAnnounceConfig {
  creator1: string
  creator2: string
  collabTitle: string
  date: string
  bgColor: string
  accentColor: string
  accent2Color: string
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

function SceneCollabAnnounceComponent({
  config,
  frame,
  durationInFrames,
}: MotionGraphicProps<CollabAnnounceConfig>) {
  const { creator1, creator2, collabTitle, date, bgColor, accentColor, accent2Color, textColor } = config
  const progress = frame / durationInFrames

  const enterEnd = 0.3
  const holdEnd = 0.8
  const enterProgress = Math.min(1, progress / enterEnd)
  const holdProgress = progress >= enterEnd && progress < holdEnd ? (progress - enterEnd) / (holdEnd - enterEnd) : progress >= holdEnd ? 1 : 0
  const exitProgress = progress >= holdEnd ? (progress - holdEnd) / (1 - holdEnd) : 0

  // Avatars slide in from opposite sides
  const avatar1X = easeOutCubic(Math.min(1, enterProgress / 0.4))
  const avatar2X = easeOutCubic(Math.min(1, enterProgress / 0.4))

  // "X" connector pops in
  const xPop = easeOutBack(Math.max(0, Math.min(1, (enterProgress - 0.3) / 0.25)))

  // Title reveals
  const titleReveal = easeOutCubic(Math.max(0, Math.min(1, (enterProgress - 0.5) / 0.3)))

  // Date fades in
  const dateProgress = easeOutCubic(Math.max(0, Math.min(1, (enterProgress - 0.7) / 0.25)))

  // Hold: connection pulse
  const connectionPulse = Math.sin(holdProgress * Math.PI * 5)
  const glowSize = 40 + connectionPulse * 15

  // Exit
  const exitEased = easeInCubic(exitProgress)
  const exitOpacity = 1 - exitEased
  const exitScale = 1 - exitEased * 0.15

  // Sparkle particles between avatars
  const sparkles = Array.from({ length: 6 }).map((_, i) => {
    const angle = (i / 6) * Math.PI * 2 + holdProgress * Math.PI * 2
    const radius = 30 + Math.sin(holdProgress * Math.PI * 4 + i) * 10
    const x = Math.cos(angle) * radius
    const y = Math.sin(angle) * radius
    const sparkleOpacity = holdProgress > 0 ? 0.5 + connectionPulse * 0.3 : 0
    return { x, y, opacity: sparkleOpacity }
  })

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
      }}
    >
      {/* Gradient blend between two creator colors */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: `linear-gradient(135deg, ${accentColor}15 0%, transparent 50%, ${accent2Color}15 100%)`,
          opacity: exitOpacity,
        }}
      />

      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 'clamp(16px, 3vh, 28px)',
          transform: `scale(${exitScale})`,
          opacity: exitOpacity,
        }}
      >
        {/* COLLAB label */}
        <div
          style={{
            fontSize: 'clamp(10px, 1.6vw, 13px)',
            fontWeight: 800,
            letterSpacing: 6,
            color: accentColor,
            opacity: easeOutCubic(Math.min(1, enterProgress / 0.2)),
            textTransform: 'uppercase',
          }}
        >
          COLLABORATION
        </div>

        {/* Avatars + X connector row */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 'clamp(12px, 2.5vw, 24px)',
            position: 'relative',
          }}
        >
          {/* Creator 1 avatar */}
          <div
            style={{
              transform: `translateX(${(1 - avatar1X) * -80}px)`,
              opacity: avatar1X,
            }}
          >
            <div
              style={{
                width: 'clamp(60px, 12vw, 100px)',
                height: 'clamp(60px, 12vw, 100px)',
                borderRadius: '50%',
                background: `linear-gradient(135deg, ${accentColor}, ${accentColor}80)`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 'clamp(24px, 5vw, 40px)',
                fontWeight: 900,
                color: '#FFFFFF',
                boxShadow: `0 0 ${glowSize}px ${accentColor}30`,
                border: `3px solid ${accentColor}60`,
              }}
            >
              {creator1.charAt(0).toUpperCase()}
            </div>
            <div
              style={{
                textAlign: 'center',
                marginTop: 8,
                fontSize: 'clamp(11px, 1.8vw, 14px)',
                fontWeight: 700,
                color: textColor,
              }}
            >
              @{creator1}
            </div>
          </div>

          {/* X connector with sparkles */}
          <div style={{ position: 'relative' }}>
            {sparkles.map((sp, i) => (
              <div
                key={i}
                style={{
                  position: 'absolute',
                  left: `calc(50% + ${sp.x}px)`,
                  top: `calc(50% + ${sp.y}px)`,
                  width: 4,
                  height: 4,
                  borderRadius: '50%',
                  background: '#FFFFFF',
                  opacity: sp.opacity,
                  transform: 'translate(-50%, -50%)',
                  boxShadow: '0 0 6px #FFFFFF80',
                }}
              />
            ))}
            <div
              style={{
                fontSize: 'clamp(24px, 5vw, 40px)',
                fontWeight: 900,
                color: '#FFFFFF',
                transform: `scale(${xPop}) rotate(${xPop * 360}deg)`,
                textShadow: `0 0 20px ${accentColor}60, 0 0 20px ${accent2Color}60`,
              }}
            >
              {'×'}
            </div>
          </div>

          {/* Creator 2 avatar */}
          <div
            style={{
              transform: `translateX(${(1 - avatar2X) * 80}px)`,
              opacity: avatar2X,
            }}
          >
            <div
              style={{
                width: 'clamp(60px, 12vw, 100px)',
                height: 'clamp(60px, 12vw, 100px)',
                borderRadius: '50%',
                background: `linear-gradient(135deg, ${accent2Color}, ${accent2Color}80)`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 'clamp(24px, 5vw, 40px)',
                fontWeight: 900,
                color: '#FFFFFF',
                boxShadow: `0 0 ${glowSize}px ${accent2Color}30`,
                border: `3px solid ${accent2Color}60`,
              }}
            >
              {creator2.charAt(0).toUpperCase()}
            </div>
            <div
              style={{
                textAlign: 'center',
                marginTop: 8,
                fontSize: 'clamp(11px, 1.8vw, 14px)',
                fontWeight: 700,
                color: textColor,
              }}
            >
              @{creator2}
            </div>
          </div>
        </div>

        {/* Collab title */}
        <div
          style={{
            fontSize: 'clamp(18px, 4vw, 32px)',
            fontWeight: 900,
            color: textColor,
            textAlign: 'center',
            opacity: titleReveal,
            transform: `translateY(${(1 - titleReveal) * 20}px)`,
            maxWidth: '80%',
            background: `linear-gradient(90deg, ${accentColor}, ${accent2Color})`,
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
          }}
        >
          {collabTitle}
        </div>

        {/* Date */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            opacity: dateProgress,
            transform: `translateY(${(1 - dateProgress) * 15}px)`,
          }}
        >
          <div
            style={{
              width: 6,
              height: 6,
              borderRadius: '50%',
              background: accentColor,
            }}
          />
          <span
            style={{
              fontSize: 'clamp(11px, 1.8vw, 14px)',
              fontWeight: 600,
              color: `${textColor}70`,
            }}
          >
            {date}
          </span>
        </div>
      </div>
    </div>
  )
}

registerMotionGraphic({
  id: 'tpl-scene-collab-announce',
  title: 'Scene Collab Announce',
  description:
    'Creator collaboration announcement with dual avatars sliding in, rotating X connector, gradient title, and sparkle effects.',
  tags: ['scene', 'social-media', 'collaboration', 'creator', 'announcement', 'collab', 'partnership'],
  category: 'scene-layout',
  component: SceneCollabAnnounceComponent as unknown as React.ComponentType<MotionGraphicProps>,
  configSchema: [
    { key: 'creator1', label: 'Creator 1', type: 'text', defaultValue: 'creator1', group: 'Content' },
    { key: 'creator2', label: 'Creator 2', type: 'text', defaultValue: 'creator2', group: 'Content' },
    { key: 'collabTitle', label: 'Collab Title', type: 'text', defaultValue: 'Something Epic is Coming', group: 'Content' },
    { key: 'date', label: 'Date', type: 'text', defaultValue: 'Coming Soon', group: 'Content' },
    { key: 'accentColor', label: 'Creator 1 Color', type: 'color', defaultValue: '#EC4899', group: 'Style' },
    { key: 'accent2Color', label: 'Creator 2 Color', type: 'color', defaultValue: '#3B82F6', group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#0A0A14', group: 'Style' },
    { key: 'textColor', label: 'Text Color', type: 'color', defaultValue: '#FFFFFF', group: 'Style' },
  ],
  defaultConfig: {
    creator1: 'creator1',
    creator2: 'creator2',
    collabTitle: 'Something Epic is Coming',
    date: 'Coming Soon',
    accentColor: '#EC4899',
    accent2Color: '#3B82F6',
    bgColor: '#0A0A14',
    textColor: '#FFFFFF',
  },
})
