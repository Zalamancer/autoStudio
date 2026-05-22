import React from 'react'
import { registerMotionGraphic } from '../registry'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface NotificationConfig {
  title: string
  message: string
  icon: string
  bgColor: string
  accentColor: string
  position: 'top-right' | 'top-left' | 'bottom-right' | 'center'
}

function SceneNotificationComponent({
  config,
  frame,
  durationInFrames,
}: MotionGraphicProps<NotificationConfig>) {
  const { title, message, icon, bgColor, accentColor, position } = config
  const progress = frame / durationInFrames

  const easeOutBack = (t: number): number => {
    const c1 = 1.70158
    const c3 = c1 + 1
    return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2)
  }
  const easeOutCubic = (t: number): number => 1 - Math.pow(1 - t, 3)
  const easeInCubic = (t: number): number => Math.pow(t, 3)

  // Enter: 0-0.2, Hold: 0.2-0.8, Exit: 0.8-1
  const enterEnd = 0.2
  const exitStart = 0.8

  // Slide direction based on position
  const getSlideOffset = (): { x: number; y: number } => {
    if (progress < enterEnd) {
      const t = easeOutBack(progress / enterEnd)
      switch (position) {
        case 'top-right':
          return { x: (1 - t) * 120, y: 0 }
        case 'top-left':
          return { x: (1 - t) * -120, y: 0 }
        case 'bottom-right':
          return { x: (1 - t) * 120, y: 0 }
        case 'center':
          return { x: 0, y: (1 - t) * -80 }
      }
    }
    if (progress > exitStart) {
      const t = easeInCubic((progress - exitStart) / (1 - exitStart))
      switch (position) {
        case 'top-right':
          return { x: t * 120, y: 0 }
        case 'top-left':
          return { x: t * -120, y: 0 }
        case 'bottom-right':
          return { x: t * 120, y: 0 }
        case 'center':
          return { x: 0, y: t * 80 }
      }
    }
    return { x: 0, y: 0 }
  }

  const offset = getSlideOffset()

  // Opacity
  let cardOpacity = 1
  if (progress < enterEnd) {
    cardOpacity = easeOutCubic(progress / enterEnd)
  } else if (progress > exitStart) {
    cardOpacity = 1 - easeOutCubic((progress - exitStart) / (1 - exitStart))
  }

  // Shadow grow
  const shadowScale = progress < enterEnd
    ? easeOutCubic(progress / enterEnd) * 20
    : progress > exitStart
      ? (1 - easeOutCubic((progress - exitStart) / (1 - exitStart))) * 20
      : 20

  // Icon pulse: single pulse at 0.25-0.4
  const pulseStart = 0.25
  const pulseEnd = 0.4
  let iconScale = 1
  if (progress >= pulseStart && progress <= pulseEnd) {
    const pulseT = (progress - pulseStart) / (pulseEnd - pulseStart)
    iconScale = 1 + Math.sin(pulseT * Math.PI) * 0.2
  }

  // Position styles
  const positionStyles: React.CSSProperties = (() => {
    switch (position) {
      case 'top-right':
        return { top: '8%', right: '5%' }
      case 'top-left':
        return { top: '8%', left: '5%' }
      case 'bottom-right':
        return { bottom: '8%', right: '5%' }
      case 'center':
        return { top: '50%', left: '50%', marginTop: -60, marginLeft: -180 }
    }
  })()

  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        background: bgColor,
        overflow: 'hidden',
        fontFamily: "'Helvetica Neue', Arial, sans-serif",
      }}
    >
      {/* Notification card */}
      <div
        style={{
          position: 'absolute',
          ...positionStyles,
          width: 'clamp(280px, 50%, 400px)',
          background: '#FFFFFF',
          borderRadius: 16,
          padding: 'clamp(16px, 3%, 24px)',
          display: 'flex',
          gap: 16,
          alignItems: 'flex-start',
          transform: `translate(${offset.x}%, ${offset.y}%)`,
          opacity: cardOpacity,
          boxShadow: `0 ${shadowScale / 2}px ${shadowScale}px rgba(0,0,0,0.15), 0 0 0 1px ${accentColor}20`,
          borderLeft: `4px solid ${accentColor}`,
        }}
      >
        {/* Icon */}
        <div
          style={{
            fontSize: 'clamp(24px, 4vw, 36px)',
            transform: `scale(${iconScale})`,
            lineHeight: 1,
            flexShrink: 0,
          }}
        >
          {icon}
        </div>

        {/* Text content */}
        <div style={{ flex: 1, overflow: 'hidden' }}>
          <div
            style={{
              fontSize: 'clamp(14px, 2.5vw, 18px)',
              fontWeight: 700,
              color: '#1A1A2E',
              marginBottom: 4,
            }}
          >
            {title}
          </div>
          <div
            style={{
              fontSize: 'clamp(12px, 2vw, 15px)',
              fontWeight: 400,
              color: '#666',
              lineHeight: 1.4,
            }}
          >
            {message}
          </div>
        </div>
      </div>
    </div>
  )
}

registerMotionGraphic({
  id: 'tpl-scene-notification',
  title: 'Scene Notification',
  description:
    'A notification card that slides in from the edge with bounce animation, icon pulse, and growing shadow',
  tags: ['scene', 'notification', 'toast', 'alert', 'card'],
  category: 'scene-layout',
  component: SceneNotificationComponent as unknown as React.ComponentType<MotionGraphicProps>,
  configSchema: [
    { key: 'title', label: 'Title', type: 'text', defaultValue: 'New Message', group: 'Content' },
    { key: 'message', label: 'Message', type: 'text', defaultValue: 'You have a new notification waiting for you!', group: 'Content' },
    { key: 'icon', label: 'Icon (Emoji)', type: 'text', defaultValue: '\uD83D\uDD14', group: 'Content' },
    { key: 'position', label: 'Position', type: 'select', defaultValue: 'top-right', options: ['top-right', 'top-left', 'bottom-right', 'center'], group: 'Layout' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#F0F0F5', group: 'Style' },
    { key: 'accentColor', label: 'Accent Color', type: 'color', defaultValue: '#6366F1', group: 'Style' },
  ],
  defaultConfig: {
    title: 'New Message',
    message: 'You have a new notification waiting for you!',
    icon: '\uD83D\uDD14',
    bgColor: '#F0F0F5',
    accentColor: '#6366F1',
    position: 'top-right' as const,
  },
})
