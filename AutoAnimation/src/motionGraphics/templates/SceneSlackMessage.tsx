import React from 'react'
import { registerMotionGraphic } from '../registry'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface SlackMessageConfig {
  channel: string
  userName: string
  message: string
  reactions: string[]
  bgColor: string
  sidebarColor: string
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

function SceneSlackMessageComponent({ config, frame, durationInFrames }: MotionGraphicProps<SlackMessageConfig>) {
  const { channel, userName, message, reactions, bgColor, sidebarColor } = config
  const progress = frame / durationInFrames

  const exitStart = 0.8

  // Enter: workspace area fades in
  let containerOpacity = 1
  if (progress < 0.08) {
    containerOpacity = easeOutCubic(progress / 0.08)
  }

  // Exit: slides up
  let containerY = 0
  if (progress >= exitStart) {
    const t = easeInCubic((progress - exitStart) / (1 - exitStart))
    containerY = -t * 80
    containerOpacity = 1 - t
  }

  // Type-in effect for message
  const typeStart = 0.08
  const typeEnd = 0.35
  const typeProgress = Math.max(0, Math.min(1, (progress - typeStart) / (typeEnd - typeStart)))
  const visibleChars = Math.floor(easeOutCubic(typeProgress) * message.length)
  const displayedMsg = message.slice(0, visibleChars)

  // Reactions pop in one by one after message types
  const getReactionProgress = (index: number): number => {
    const reactionStart = 0.38 + index * 0.08
    const reactionDur = 0.08
    return Math.max(0, Math.min(1, (progress - reactionStart) / reactionDur))
  }

  // Hold: reaction count increments on first reaction
  const holdReactionBonus =
    progress >= 0.55 && progress < exitStart ? Math.floor(((progress - 0.55) / (exitStart - 0.55)) * 2) : 0

  // Sidebar channel list
  const channels = ['general', 'random', 'design', 'engineering']

  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        background: bgColor,
        overflow: 'hidden',
        fontFamily: "'Lato', 'Helvetica Neue', Arial, sans-serif",
        display: 'flex',
        opacity: containerOpacity,
        transform: `translateY(${containerY}px)`,
      }}
    >
      {/* Sidebar */}
      <div
        style={{
          width: 'clamp(60px, 20%, 180px)',
          background: sidebarColor,
          padding: 'clamp(12px, 2vw, 20px) clamp(8px, 1.5vw, 14px)',
          display: 'flex',
          flexDirection: 'column',
          gap: 2,
          flexShrink: 0,
        }}
      >
        {/* Workspace name */}
        <div
          style={{
            fontSize: 'clamp(13px, 2vw, 16px)',
            fontWeight: 900,
            color: '#FFFFFF',
            marginBottom: 'clamp(12px, 2vw, 20px)',
            letterSpacing: -0.3,
          }}
        >
          Workspace
        </div>

        {/* Channels */}
        {channels.map((ch) => (
          <div
            key={ch}
            style={{
              fontSize: 'clamp(11px, 1.6vw, 14px)',
              color: ch === channel.replace('#', '') ? '#FFFFFF' : 'rgba(255,255,255,0.5)',
              fontWeight: ch === channel.replace('#', '') ? 700 : 400,
              padding: '4px 8px',
              borderRadius: 6,
              background: ch === channel.replace('#', '') ? 'rgba(255,255,255,0.12)' : 'transparent',
            }}
          >
            # {ch}
          </div>
        ))}
      </div>

      {/* Main area */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        {/* Channel header */}
        <div
          style={{
            padding: 'clamp(10px, 2vw, 16px) clamp(14px, 2.5vw, 24px)',
            borderBottom: '1px solid #E8E8E8',
            display: 'flex',
            alignItems: 'center',
            gap: 6,
          }}
        >
          <span
            style={{
              fontSize: 'clamp(14px, 2.2vw, 18px)',
              fontWeight: 900,
              color: '#1D1C1D',
            }}
          >
            # {channel.replace('#', '')}
          </span>
        </div>

        {/* Message area */}
        <div
          style={{
            flex: 1,
            padding: 'clamp(14px, 2.5vw, 24px)',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
          }}
        >
          {/* Message row */}
          <div style={{ display: 'flex', gap: 'clamp(8px, 1.5vw, 12px)' }}>
            {/* Avatar */}
            <div
              style={{
                width: 'clamp(32px, 5vw, 40px)',
                height: 'clamp(32px, 5vw, 40px)',
                borderRadius: 6,
                background: '#4A154B',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#FFFFFF',
                fontWeight: 700,
                fontSize: 'clamp(14px, 2vw, 18px)',
                flexShrink: 0,
              }}
            >
              {userName.charAt(0).toUpperCase()}
            </div>

            <div style={{ flex: 1 }}>
              {/* Name + timestamp */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'baseline',
                  gap: 8,
                  marginBottom: 4,
                }}
              >
                <span
                  style={{
                    fontSize: 'clamp(13px, 2vw, 16px)',
                    fontWeight: 900,
                    color: '#1D1C1D',
                  }}
                >
                  {userName}
                </span>
                <span
                  style={{
                    fontSize: 'clamp(10px, 1.3vw, 12px)',
                    color: '#616061',
                  }}
                >
                  11:42 AM
                </span>
              </div>

              {/* Message text */}
              <div
                style={{
                  fontSize: 'clamp(13px, 2vw, 16px)',
                  color: '#1D1C1D',
                  lineHeight: 1.5,
                }}
              >
                {displayedMsg}
                {typeProgress < 1 && (
                  <span
                    style={{
                      display: 'inline-block',
                      width: 2,
                      height: '1em',
                      background: '#1264A3',
                      marginLeft: 1,
                      opacity: Math.sin(progress * 60) > 0 ? 1 : 0,
                      verticalAlign: 'text-bottom',
                    }}
                  />
                )}
              </div>

              {/* Reactions */}
              <div
                style={{
                  display: 'flex',
                  gap: 6,
                  marginTop: 'clamp(6px, 1.2vw, 10px)',
                  flexWrap: 'wrap',
                }}
              >
                {reactions.map((emoji, i) => {
                  const rp = getReactionProgress(i)
                  const scale = easeOutBack(rp)
                  const count = i === 0 ? 3 + holdReactionBonus : i === 1 ? 2 : 1

                  if (rp <= 0) return null

                  return (
                    <div
                      key={i}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 4,
                        background: '#1264A310',
                        border: '1px solid #1264A330',
                        borderRadius: 12,
                        padding: '2px 8px',
                        transform: `scale(${scale})`,
                      }}
                    >
                      <span style={{ fontSize: 'clamp(12px, 1.8vw, 16px)' }}>{emoji}</span>
                      <span
                        style={{
                          fontSize: 'clamp(10px, 1.5vw, 13px)',
                          fontWeight: 600,
                          color: '#1264A3',
                        }}
                      >
                        {count}
                      </span>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

registerMotionGraphic({
  id: 'tpl-scene-slack-message',
  title: 'Scene Slack Message',
  description: 'Slack workspace message with sidebar, channel header, type-in text, and bouncing emoji reaction badges',
  tags: ['scene', 'conversation', 'messaging', 'slack', 'workspace', 'chat', 'reactions'],
  category: 'scene-layout',
  component: SceneSlackMessageComponent as unknown as React.ComponentType<MotionGraphicProps>,
  configSchema: [
    { key: 'channel', label: 'Channel', type: 'text', defaultValue: 'general', group: 'Content' },
    { key: 'userName', label: 'User Name', type: 'text', defaultValue: 'Sarah Chen', group: 'Content' },
    {
      key: 'message',
      label: 'Message',
      type: 'text',
      defaultValue: 'Hey team! Just pushed the new deployment. Everything looks green across the board. :tada:',
      group: 'Content',
    },
    {
      key: 'reactions',
      label: 'Reactions (emojis)',
      type: 'text-array',
      defaultValue: ['\uD83D\uDC4D', '\uD83C\uDF89', '\uD83D\uDE80'],
      group: 'Content',
    },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#FFFFFF', group: 'Style' },
    { key: 'sidebarColor', label: 'Sidebar Color', type: 'color', defaultValue: '#4A154B', group: 'Style' },
  ],
  defaultConfig: {
    channel: 'general',
    userName: 'Sarah Chen',
    message: 'Hey team! Just pushed the new deployment. Everything looks green across the board. :tada:',
    reactions: ['\uD83D\uDC4D', '\uD83C\uDF89', '\uD83D\uDE80'],
    bgColor: '#FFFFFF',
    sidebarColor: '#4A154B',
  },
})
