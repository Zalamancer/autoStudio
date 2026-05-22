import React from 'react'
import { registerMotionGraphic } from '../registry'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface EmailPreviewConfig {
  sender: string
  subject: string
  preview: string
  timestamp: string
  accentColor: string
  cardColor: string
  bgColor: string
}

function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3)
}
function easeOutBack(t: number): number {
  const c1 = 1.70158
  const c3 = c1 + 1
  return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2)
}
function easeInCubic(t: number): number {
  return t * t * t
}

function SceneEmailPreviewComponent({
  config,
  frame,
  durationInFrames,
}: MotionGraphicProps<EmailPreviewConfig>) {
  const { sender, subject, preview, timestamp, accentColor, cardColor, bgColor } = config
  const progress = frame / durationInFrames

  const enterEnd = 0.2
  const exitStart = 0.8

  // Enter: card slides in from top
  let cardY = 0
  let cardOpacity = 1
  let cardScale = 1
  if (progress < enterEnd) {
    const t = easeOutBack(progress / enterEnd)
    cardY = (1 - t) * -80
    cardOpacity = easeOutCubic(progress / enterEnd)
  }

  // Exit: card scales to fill (opens)
  if (progress >= exitStart) {
    const t = easeInCubic((progress - exitStart) / (1 - exitStart))
    cardScale = 1 + t * 0.5
    cardOpacity = 1 - t
  }

  // Shadow grows in
  const shadowSize =
    progress < enterEnd
      ? easeOutCubic(progress / enterEnd) * 30
      : progress >= exitStart
        ? (1 - easeInCubic((progress - exitStart) / (1 - exitStart))) * 30
        : 30

  // Unread dot pulse
  const dotPulse =
    progress >= enterEnd && progress < exitStart
      ? 1 + Math.sin(progress * 40) * 0.25
      : progress < enterEnd
        ? easeOutCubic(progress / enterEnd)
        : 0

  // Sender initial
  const senderInitial = sender.charAt(0).toUpperCase()

  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        background: bgColor,
        overflow: 'hidden',
        fontFamily:
          "-apple-system, BlinkMacSystemFont, 'SF Pro Text', 'Helvetica Neue', sans-serif",
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '5%',
      }}
    >
      {/* Email card */}
      <div
        style={{
          width: 'clamp(300px, 70%, 500px)',
          background: cardColor,
          borderRadius: 16,
          padding: 'clamp(18px, 3.5vw, 28px)',
          display: 'flex',
          gap: 'clamp(12px, 2vw, 18px)',
          alignItems: 'flex-start',
          transform: `translateY(${cardY}px) scale(${cardScale})`,
          opacity: cardOpacity,
          boxShadow: `0 ${shadowSize / 3}px ${shadowSize}px rgba(0,0,0,0.12)`,
          position: 'relative',
        }}
      >
        {/* Unread dot */}
        <div
          style={{
            position: 'absolute',
            left: 'clamp(6px, 1.2vw, 10px)',
            top: '50%',
            marginTop: -5,
            width: 10,
            height: 10,
            borderRadius: '50%',
            background: accentColor,
            transform: `scale(${dotPulse})`,
            boxShadow: `0 0 8px ${accentColor}60`,
          }}
        />

        {/* Avatar circle */}
        <div
          style={{
            width: 'clamp(40px, 7vw, 52px)',
            height: 'clamp(40px, 7vw, 52px)',
            borderRadius: '50%',
            background: `${accentColor}20`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 'clamp(18px, 3vw, 24px)',
            fontWeight: 700,
            color: accentColor,
            flexShrink: 0,
          }}
        >
          {senderInitial}
        </div>

        {/* Content */}
        <div style={{ flex: 1, overflow: 'hidden', minWidth: 0 }}>
          {/* Top row: sender + timestamp */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: 4,
            }}
          >
            <div
              style={{
                fontSize: 'clamp(14px, 2.2vw, 17px)',
                fontWeight: 700,
                color: '#1A1A2E',
              }}
            >
              {sender}
            </div>
            <div
              style={{
                fontSize: 'clamp(10px, 1.5vw, 13px)',
                color: '#8E8E93',
                fontWeight: 400,
                flexShrink: 0,
                marginLeft: 8,
              }}
            >
              {timestamp}
            </div>
          </div>

          {/* Subject */}
          <div
            style={{
              fontSize: 'clamp(13px, 2vw, 16px)',
              fontWeight: 700,
              color: '#1A1A2E',
              marginBottom: 4,
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
          >
            {subject}
          </div>

          {/* Preview text */}
          <div
            style={{
              fontSize: 'clamp(12px, 1.8vw, 14px)',
              color: '#8E8E93',
              lineHeight: 1.4,
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
            }}
          >
            {preview}
          </div>
        </div>
      </div>
    </div>
  )
}

registerMotionGraphic({
  id: 'tpl-scene-email-preview',
  title: 'Scene Email Preview',
  description:
    'Mail app notification card with sender, subject, preview text, timestamp, and pulsing unread indicator',
  tags: ['scene', 'conversation', 'messaging', 'email', 'inbox', 'notification', 'mail'],
  category: 'scene-layout',
  component: SceneEmailPreviewComponent as unknown as React.ComponentType<MotionGraphicProps>,
  configSchema: [
    { key: 'sender', label: 'Sender Name', type: 'text', defaultValue: 'Sarah Chen', group: 'Content' },
    { key: 'subject', label: 'Subject', type: 'text', defaultValue: 'Q4 Results Are In \u2014 Big News!', group: 'Content' },
    { key: 'preview', label: 'Preview Text', type: 'text', defaultValue: 'Hi team, I\'m excited to share that we exceeded our targets by 34%. Full report attached for review before Monday\'s all-hands...', group: 'Content' },
    { key: 'timestamp', label: 'Timestamp', type: 'text', defaultValue: '2:45 PM', group: 'Content' },
    { key: 'accentColor', label: 'Accent Color', type: 'color', defaultValue: '#007AFF', group: 'Style' },
    { key: 'cardColor', label: 'Card Color', type: 'color', defaultValue: '#FFFFFF', group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#F2F2F7', group: 'Style' },
  ],
  defaultConfig: {
    sender: 'Sarah Chen',
    subject: 'Q4 Results Are In \u2014 Big News!',
    preview: 'Hi team, I\'m excited to share that we exceeded our targets by 34%. Full report attached for review before Monday\'s all-hands...',
    timestamp: '2:45 PM',
    accentColor: '#007AFF',
    cardColor: '#FFFFFF',
    bgColor: '#F2F2F7',
  },
})
