import React from 'react'
import { registerMotionGraphic } from '../registry'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface DiscordChatConfig {
  channelName: string
  userName: string
  userColor: string
  message: string
  isBot: boolean
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

function SceneDiscordChatComponent({
  config,
  frame,
  durationInFrames,
}: MotionGraphicProps<DiscordChatConfig>) {
  const { channelName, userName, userColor, message, isBot, bgColor } = config
  const progress = frame / durationInFrames

  const exitStart = 0.8

  // Channel header slides down
  const headerSlideStart = 0.02
  const headerSlideDur = 0.12
  const headerProgress = easeOutCubic(
    Math.max(0, Math.min(1, (progress - headerSlideStart) / headerSlideDur)),
  )
  const headerY = (1 - headerProgress) * -50

  // Avatar pop
  const avatarStart = 0.1
  const avatarDur = 0.1
  const avatarScale = easeOutBack(
    Math.max(0, Math.min(1, (progress - avatarStart) / avatarDur)),
  )

  // Message fade in
  const msgStart = 0.15
  const msgDur = 0.15
  const msgOpacity = easeOutCubic(
    Math.max(0, Math.min(1, (progress - msgStart) / msgDur)),
  )

  // Online indicator pulse
  const onlineDotScale =
    progress >= 0.2 && progress < exitStart
      ? 1 + Math.sin(progress * 30) * 0.2
      : progress >= 0.1
        ? easeOutCubic(Math.min(1, (progress - 0.1) / 0.1))
        : 0

  // Exit: slide up
  let containerY = 0
  let containerOpacity = 1
  if (progress >= exitStart) {
    const t = easeInCubic((progress - exitStart) / (1 - exitStart))
    containerY = -t * 80
    containerOpacity = 1 - t
  }

  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        background: bgColor,
        overflow: 'hidden',
        fontFamily:
          "'gg sans', 'Noto Sans', 'Helvetica Neue', Helvetica, Arial, sans-serif",
        display: 'flex',
        flexDirection: 'column',
        transform: `translateY(${containerY}px)`,
        opacity: containerOpacity,
      }}
    >
      {/* Server sidebar hint */}
      <div
        style={{
          position: 'absolute',
          left: 0,
          top: 0,
          bottom: 0,
          width: 'clamp(48px, 8vw, 72px)',
          background: '#1E1F22',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          paddingTop: 'clamp(8px, 1.5vw, 14px)',
          gap: 8,
        }}
      >
        {/* Server icon */}
        <div
          style={{
            width: 'clamp(32px, 5vw, 48px)',
            height: 'clamp(32px, 5vw, 48px)',
            borderRadius: 16,
            background: '#5865F2',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#FFFFFF',
            fontWeight: 700,
            fontSize: 'clamp(14px, 2vw, 20px)',
          }}
        >
          S
        </div>
        <div style={{ width: '60%', height: 2, background: '#35363C', borderRadius: 1 }} />
      </div>

      {/* Channel area */}
      <div
        style={{
          marginLeft: 'clamp(48px, 8vw, 72px)',
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {/* Channel header */}
        <div
          style={{
            padding: 'clamp(10px, 2vw, 16px) clamp(14px, 2.5vw, 20px)',
            borderBottom: '1px solid #1E1F22',
            background: '#313338',
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            transform: `translateY(${headerY}px)`,
            opacity: headerProgress,
          }}
        >
          <span style={{ color: '#80848E', fontSize: 'clamp(16px, 2.5vw, 22px)' }}>#</span>
          <span
            style={{
              fontSize: 'clamp(14px, 2.2vw, 17px)',
              fontWeight: 600,
              color: '#F2F3F5',
            }}
          >
            {channelName}
          </span>
        </div>

        {/* Message area */}
        <div
          style={{
            flex: 1,
            background: '#313338',
            padding: 'clamp(14px, 2.5vw, 24px)',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
          }}
        >
          {/* Message row */}
          <div
            style={{
              display: 'flex',
              gap: 'clamp(10px, 2vw, 16px)',
              opacity: msgOpacity,
              padding: 'clamp(4px, 1vw, 8px)',
              borderRadius: 6,
            }}
          >
            {/* Avatar */}
            <div
              style={{
                position: 'relative',
                flexShrink: 0,
              }}
            >
              <div
                style={{
                  width: 'clamp(36px, 6vw, 44px)',
                  height: 'clamp(36px, 6vw, 44px)',
                  borderRadius: '50%',
                  background: userColor,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#FFFFFF',
                  fontWeight: 700,
                  fontSize: 'clamp(16px, 2.5vw, 20px)',
                  transform: `scale(${avatarScale})`,
                }}
              >
                {userName.charAt(0).toUpperCase()}
              </div>

              {/* Online indicator */}
              <div
                style={{
                  position: 'absolute',
                  bottom: -2,
                  right: -2,
                  width: 'clamp(12px, 2vw, 16px)',
                  height: 'clamp(12px, 2vw, 16px)',
                  borderRadius: '50%',
                  background: '#23A559',
                  border: '3px solid #313338',
                  transform: `scale(${onlineDotScale})`,
                }}
              />
            </div>

            {/* Content */}
            <div style={{ flex: 1 }}>
              {/* Username + badge + timestamp */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  marginBottom: 4,
                }}
              >
                <span
                  style={{
                    fontSize: 'clamp(13px, 2vw, 16px)',
                    fontWeight: 600,
                    color: userColor,
                  }}
                >
                  {userName}
                </span>
                {isBot && (
                  <span
                    style={{
                      background: '#5865F2',
                      color: '#FFFFFF',
                      fontSize: 'clamp(8px, 1.2vw, 10px)',
                      fontWeight: 600,
                      padding: '1px 5px',
                      borderRadius: 3,
                      textTransform: 'uppercase',
                      letterSpacing: 0.3,
                    }}
                  >
                    BOT
                  </span>
                )}
                <span
                  style={{
                    fontSize: 'clamp(10px, 1.3vw, 12px)',
                    color: '#80848E',
                  }}
                >
                  Today at 3:42 PM
                </span>
              </div>

              {/* Message text */}
              <div
                style={{
                  fontSize: 'clamp(14px, 2.2vw, 16px)',
                  color: '#DBDEE1',
                  lineHeight: 1.5,
                }}
              >
                {message}
              </div>
            </div>
          </div>
        </div>

        {/* Input bar */}
        <div
          style={{
            padding: 'clamp(10px, 2vw, 16px) clamp(14px, 2.5vw, 20px)',
            background: '#313338',
          }}
        >
          <div
            style={{
              background: '#383A40',
              borderRadius: 8,
              padding: 'clamp(8px, 1.5vw, 12px) clamp(12px, 2vw, 16px)',
              color: '#6D6F78',
              fontSize: 'clamp(12px, 1.8vw, 15px)',
            }}
          >
            Message #{channelName}
          </div>
        </div>
      </div>
    </div>
  )
}

registerMotionGraphic({
  id: 'tpl-scene-discord-chat',
  title: 'Scene Discord Chat',
  description:
    'Discord-style chat with dark theme, server sidebar, channel header, avatar with online indicator, and optional Bot badge',
  tags: ['scene', 'conversation', 'messaging', 'discord', 'chat', 'gaming', 'server'],
  category: 'scene-layout',
  component: SceneDiscordChatComponent as unknown as React.ComponentType<MotionGraphicProps>,
  configSchema: [
    { key: 'channelName', label: 'Channel Name', type: 'text', defaultValue: 'announcements', group: 'Content' },
    { key: 'userName', label: 'User Name', type: 'text', defaultValue: 'ProAnimate', group: 'Content' },
    { key: 'userColor', label: 'Username Color', type: 'color', defaultValue: '#9B59B6', group: 'Style' },
    { key: 'message', label: 'Message', type: 'text', defaultValue: 'Hey everyone! \uD83D\uDC4B We just shipped v2.0 with motion graphics support. Check it out and let us know what you think!', group: 'Content' },
    { key: 'isBot', label: 'Bot Badge', type: 'boolean', defaultValue: false, group: 'Content' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#2B2D31', group: 'Style' },
  ],
  defaultConfig: {
    channelName: 'announcements',
    userName: 'ProAnimate',
    userColor: '#9B59B6',
    message: 'Hey everyone! \uD83D\uDC4B We just shipped v2.0 with motion graphics support. Check it out and let us know what you think!',
    isBot: false,
    bgColor: '#2B2D31',
  },
})
