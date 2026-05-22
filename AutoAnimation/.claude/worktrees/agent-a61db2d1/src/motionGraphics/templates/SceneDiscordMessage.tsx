import React from 'react'
import { registerMotionGraphic } from '../registry'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface SceneDiscordMessageConfig {
  username: string
  roleColor: string
  messageText: string
  timestamp: string
  serverName: string
  channelName: string
  reactionEmoji: string
  reactionCount: number
  bgColor: string
  cardColor: string
  textColor: string
}

function easeOutCubic(t: number): number { return 1 - Math.pow(1 - t, 3) }
function easeInCubic(t: number): number { return t * t * t }
function easeOutBack(t: number): number {
  const c1 = 1.70158
  const c3 = c1 + 1
  return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2)
}

function SceneDiscordMessageComponent({ config, progress }: MotionGraphicProps<SceneDiscordMessageConfig>) {
  const { username, roleColor, messageText, timestamp, serverName, channelName, reactionEmoji, reactionCount, bgColor, cardColor, textColor } = config

  const enterEnd = 0.3
  const holdEnd = 0.8
  const enterProgress = Math.min(1, progress / enterEnd)
  const holdProgress = progress >= enterEnd && progress < holdEnd ? (progress - enterEnd) / (holdEnd - enterEnd) : progress >= holdEnd ? 1 : 0
  const exitProgress = progress >= holdEnd ? (progress - holdEnd) / (1 - holdEnd) : 0

  // Channel header slides down
  const headerOpacity = easeOutCubic(Math.min(1, enterProgress / 0.15))
  const headerY = (1 - headerOpacity) * -15

  // Avatar pops in
  const avatarScale = easeOutBack(Math.max(0, Math.min(1, (enterProgress - 0.08) / 0.18)))

  // Username slides in
  const nameOpacity = easeOutCubic(Math.max(0, Math.min(1, (enterProgress - 0.15) / 0.15)))

  // Message typewriter
  const typeProgress = easeOutCubic(Math.max(0, Math.min(1, (enterProgress - 0.25) / 0.5)))
  const visibleChars = Math.floor(typeProgress * messageText.length)
  const displayText = messageText.slice(0, visibleChars)

  // Reaction pops in
  const reactionScale = easeOutBack(Math.max(0, Math.min(1, (enterProgress - 0.8) / 0.18)))

  // Online status indicator pulse during hold
  const statusPulse = 1 + Math.sin(holdProgress * Math.PI * 6) * 0.15

  // Exit
  const exitEased = easeInCubic(exitProgress)
  const exitOpacity = 1 - exitEased
  const exitScale = 1 - exitEased * 0.08

  return (
    <div style={{
      position: 'absolute', inset: 0, overflow: 'hidden',
      background: bgColor,
      fontFamily: "'gg sans', 'Noto Sans', 'Helvetica Neue', sans-serif",
      display: 'flex', flexDirection: 'column',
      padding: '5%',
    }}>
      {/* Server / channel header */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 'clamp(6px, 1vw, 10px)',
        padding: 'clamp(8px, 1.5vw, 14px) clamp(12px, 2vw, 20px)',
        borderBottom: `1px solid ${textColor}12`,
        marginBottom: 'clamp(12px, 2.5vw, 24px)',
        opacity: headerOpacity,
        transform: `translateY(${headerY}px)`,
      }}>
        <div style={{
          width: 'clamp(18px, 3vw, 26px)', height: 'clamp(18px, 3vw, 26px)',
          borderRadius: 'clamp(4px, 0.7vw, 7px)', background: '#5865F2',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 'clamp(9px, 1.4vw, 12px)', fontWeight: 800, color: '#fff',
        }}>{serverName.charAt(0).toUpperCase()}</div>
        <span style={{
          fontSize: 'clamp(11px, 1.7vw, 14px)', fontWeight: 600, color: `${textColor}90`,
        }}>{serverName}</span>
        <span style={{ fontSize: 'clamp(10px, 1.5vw, 13px)', color: `${textColor}40` }}>/</span>
        <span style={{
          fontSize: 'clamp(11px, 1.7vw, 14px)', fontWeight: 600, color: `${textColor}70`,
        }}># {channelName}</span>
      </div>

      {/* Message area */}
      <div style={{
        flex: 1, display: 'flex', flexDirection: 'column',
        justifyContent: 'center',
        opacity: exitOpacity, transform: `scale(${exitScale})`,
      }}>
        <div style={{
          display: 'flex', gap: 'clamp(10px, 2vw, 18px)',
          padding: 'clamp(4px, 0.8vw, 8px) clamp(12px, 2vw, 20px)',
          borderRadius: 'clamp(4px, 0.7vw, 6px)',
          background: `${cardColor}`,
        }}>
          {/* Avatar */}
          <div style={{ position: 'relative', flexShrink: 0 }}>
            <div style={{
              width: 'clamp(36px, 6vw, 48px)', height: 'clamp(36px, 6vw, 48px)',
              borderRadius: '50%', background: roleColor,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 'clamp(16px, 2.8vw, 22px)', fontWeight: 700, color: '#fff',
              transform: `scale(${avatarScale})`,
            }}>{username.charAt(0).toUpperCase()}</div>
            {/* Online status dot */}
            <div style={{
              position: 'absolute', bottom: -1, right: -1,
              width: 'clamp(10px, 1.8vw, 14px)', height: 'clamp(10px, 1.8vw, 14px)',
              borderRadius: '50%', background: '#23A55A',
              border: `clamp(2px, 0.4vw, 3px) solid ${bgColor}`,
              transform: `scale(${avatarScale * statusPulse})`,
            }} />
          </div>

          {/* Message content */}
          <div style={{ flex: 1, minWidth: 0 }}>
            {/* Username + timestamp */}
            <div style={{
              display: 'flex', alignItems: 'baseline', gap: 'clamp(6px, 1vw, 10px)',
              marginBottom: 'clamp(3px, 0.5vw, 6px)',
              opacity: nameOpacity,
            }}>
              <span style={{
                fontSize: 'clamp(13px, 2.2vw, 17px)', fontWeight: 600, color: roleColor,
              }}>{username}</span>
              <span style={{
                fontSize: 'clamp(9px, 1.2vw, 11px)', color: `${textColor}40`, fontWeight: 500,
              }}>{timestamp}</span>
            </div>

            {/* Message text */}
            <div style={{
              fontSize: 'clamp(13px, 2.2vw, 18px)', fontWeight: 400,
              color: `${textColor}DD`, lineHeight: 1.65,
              minHeight: 'clamp(40px, 8vh, 60px)',
            }}>
              {displayText}
              {visibleChars < messageText.length && (
                <span style={{
                  display: 'inline-block', width: 2, height: '1em',
                  background: '#5865F2', marginLeft: 1,
                  opacity: Math.sin(progress * Math.PI * 20) > 0 ? 1 : 0,
                }} />
              )}
            </div>

            {/* Reaction */}
            <div style={{
              display: 'inline-flex', alignItems: 'center',
              gap: 'clamp(4px, 0.7vw, 7px)',
              background: `${textColor}08`,
              border: `1px solid ${textColor}15`,
              borderRadius: 'clamp(6px, 1vw, 10px)',
              padding: 'clamp(3px, 0.5vw, 6px) clamp(8px, 1.2vw, 12px)',
              marginTop: 'clamp(8px, 1.5vw, 14px)',
              transform: `scale(${reactionScale})`,
            }}>
              <span style={{ fontSize: 'clamp(14px, 2.2vw, 18px)' }}>{reactionEmoji}</span>
              <span style={{
                fontSize: 'clamp(11px, 1.6vw, 14px)', fontWeight: 600, color: '#5865F2',
              }}>{reactionCount}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Message input bar at bottom */}
      <div style={{
        display: 'flex', alignItems: 'center',
        background: `${textColor}08`,
        borderRadius: 'clamp(6px, 1vw, 8px)',
        padding: 'clamp(8px, 1.5vw, 14px) clamp(12px, 2vw, 18px)',
        marginTop: 'clamp(12px, 2vw, 20px)',
        opacity: headerOpacity * 0.5,
      }}>
        <span style={{
          fontSize: 'clamp(12px, 1.8vw, 15px)', color: `${textColor}30`, fontWeight: 400,
        }}>Message #{channelName}</span>
      </div>
    </div>
  )
}

registerMotionGraphic({
  id: 'tpl-scene-discord-message',
  title: 'Discord Chat Message',
  description: 'Discord chat message with avatar, role-colored username, server header, channel name, reaction emoji, and typing indicator',
  tags: ['scene', 'discord', 'social', 'chat', 'gaming', 'messaging', 'reaction'],
  category: 'scene-layout',
  component: SceneDiscordMessageComponent as unknown as React.ComponentType<MotionGraphicProps>,
  defaultConfig: {
    username: 'CoolUsername',
    roleColor: '#E74C3C',
    messageText: 'Just pushed the biggest update of the year. 200+ bug fixes, new UI, and dark mode is finally here. Let me know what you think!',
    timestamp: 'Today at 2:34 PM',
    serverName: 'Dev Hub',
    channelName: 'general',
    reactionEmoji: '\uD83D\uDD25',
    reactionCount: 23,
    bgColor: '#313338',
    cardColor: '#313338',
    textColor: '#DBDEE1',
  },
  configSchema: [
    { key: 'username', label: 'Username', type: 'text', defaultValue: 'CoolUsername', group: 'Content' },
    { key: 'roleColor', label: 'Role Color', type: 'color', defaultValue: '#E74C3C', group: 'Content' },
    { key: 'messageText', label: 'Message Text', type: 'text', defaultValue: 'Just pushed the biggest update of the year. 200+ bug fixes, new UI, and dark mode is finally here. Let me know what you think!', group: 'Content' },
    { key: 'timestamp', label: 'Timestamp', type: 'text', defaultValue: 'Today at 2:34 PM', group: 'Content' },
    { key: 'serverName', label: 'Server Name', type: 'text', defaultValue: 'Dev Hub', group: 'Content' },
    { key: 'channelName', label: 'Channel Name', type: 'text', defaultValue: 'general', group: 'Content' },
    { key: 'reactionEmoji', label: 'Reaction Emoji', type: 'text', defaultValue: '\uD83D\uDD25', group: 'Content' },
    { key: 'reactionCount', label: 'Reaction Count', type: 'number', defaultValue: 23, min: 1, max: 9999, group: 'Content' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#313338', group: 'Style' },
    { key: 'cardColor', label: 'Card Color', type: 'color', defaultValue: '#313338', group: 'Style' },
    { key: 'textColor', label: 'Text Color', type: 'color', defaultValue: '#DBDEE1', group: 'Style' },
  ],
})
