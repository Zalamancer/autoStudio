import React from 'react'
import { registerMotionGraphic } from '../registry'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface WhatsAppConfig {
  messages: string[]
  headerName: string
  headerColor: string
  bgColor: string
}

function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3)
}
function easeInCubic(t: number): number {
  return t * t * t
}

function SceneWhatsAppComponent({
  config,
  frame,
  durationInFrames,
}: MotionGraphicProps<WhatsAppConfig>) {
  const { messages, headerName, headerColor, bgColor } = config
  const progress = frame / durationInFrames

  const exitStart = 0.8

  // Parse messages: "s:text" = sent, "r:text" = received
  const parsed = messages.map((m) => {
    const isSent = m.startsWith('s:')
    return { isSent, text: m.slice(2) }
  })

  // Each message appears staggered
  const getMsgProgress = (index: number): number => {
    const totalMsgPhase = 0.6
    const perMsg = totalMsgPhase / parsed.length
    const msgStart = 0.08 + index * perMsg
    const msgDur = perMsg * 0.7
    return Math.max(0, Math.min(1, (progress - msgStart) / msgDur))
  }

  // Checkmark animation for sent messages: gray -> blue
  const getCheckColor = (index: number): string => {
    const mp = getMsgProgress(index)
    if (mp < 1) return 'transparent'
    const checkDelay = 0.08
    const totalMsgPhase = 0.6
    const perMsg = totalMsgPhase / parsed.length
    const msgEnd = 0.08 + index * perMsg + perMsg * 0.7
    const checkProgress = Math.max(
      0,
      Math.min(1, (progress - msgEnd - checkDelay) / 0.05),
    )
    if (checkProgress <= 0) return '#92A58C'
    if (checkProgress < 1) return '#92A58C'
    return '#53BDEB'
  }

  // Typing indicator
  const lastMsgEnd = (() => {
    const totalMsgPhase = 0.6
    const perMsg = totalMsgPhase / parsed.length
    return 0.08 + (parsed.length - 1) * perMsg + perMsg * 0.7
  })()
  const showTyping =
    progress >= lastMsgEnd + 0.05 && progress < exitStart

  // Exit
  let containerY = 0
  let containerOpacity = 1
  if (progress >= exitStart) {
    const t = easeInCubic((progress - exitStart) / (1 - exitStart))
    containerY = t * 100
    containerOpacity = 1 - t
  }

  // WhatsApp wallpaper pattern (subtle)
  const wallpaperColor = '#0B141A'

  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        background: wallpaperColor,
        overflow: 'hidden',
        fontFamily: "'Helvetica Neue', Arial, sans-serif",
        display: 'flex',
        flexDirection: 'column',
        transform: `translateY(${containerY}%)`,
        opacity: containerOpacity,
      }}
    >
      {/* Header bar */}
      <div
        style={{
          background: headerColor,
          padding: 'clamp(10px, 2vw, 16px) clamp(14px, 2.5vw, 20px)',
          display: 'flex',
          alignItems: 'center',
          gap: 'clamp(10px, 2vw, 14px)',
          flexShrink: 0,
        }}
      >
        {/* Back arrow */}
        <div
          style={{
            color: '#FFFFFF',
            fontSize: 'clamp(18px, 3vw, 24px)',
            fontWeight: 300,
          }}
        >
          \u2190
        </div>

        {/* Avatar */}
        <div
          style={{
            width: 'clamp(32px, 5.5vw, 42px)',
            height: 'clamp(32px, 5.5vw, 42px)',
            borderRadius: '50%',
            background: 'rgba(255,255,255,0.2)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#FFFFFF',
            fontWeight: 700,
            fontSize: 'clamp(14px, 2.2vw, 18px)',
          }}
        >
          {headerName.charAt(0).toUpperCase()}
        </div>

        {/* Name + status */}
        <div>
          <div
            style={{
              fontSize: 'clamp(14px, 2.2vw, 17px)',
              fontWeight: 600,
              color: '#FFFFFF',
            }}
          >
            {headerName}
          </div>
          <div
            style={{
              fontSize: 'clamp(10px, 1.5vw, 13px)',
              color: 'rgba(255,255,255,0.7)',
            }}
          >
            online
          </div>
        </div>
      </div>

      {/* Chat area */}
      <div
        style={{
          flex: 1,
          background: bgColor,
          padding: 'clamp(10px, 2vw, 16px) clamp(10px, 2vw, 16px)',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'flex-end',
          gap: 'clamp(3px, 0.6vw, 5px)',
          // WhatsApp-style subtle pattern
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.015'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }}
      >
        {parsed.map((msg, i) => {
          const mp = getMsgProgress(i)
          if (mp <= 0) return null

          const slideY = (1 - easeOutCubic(mp)) * 30
          const opacity = easeOutCubic(mp)
          const checkColor = getCheckColor(i)

          return (
            <div
              key={i}
              style={{
                alignSelf: msg.isSent ? 'flex-end' : 'flex-start',
                maxWidth: '78%',
                background: msg.isSent ? '#005C4B' : '#202C33',
                borderRadius: msg.isSent
                  ? '10px 10px 3px 10px'
                  : '10px 10px 10px 3px',
                padding:
                  'clamp(6px, 1.2vw, 10px) clamp(10px, 2vw, 14px)',
                transform: `translateY(${slideY}px)`,
                opacity,
                position: 'relative',
              }}
            >
              <div
                style={{
                  fontSize: 'clamp(13px, 2vw, 15px)',
                  color: '#E9EDEF',
                  lineHeight: 1.4,
                  paddingRight: msg.isSent ? 'clamp(50px, 10vw, 65px)' : 'clamp(30px, 6vw, 45px)',
                }}
              >
                {msg.text}
              </div>

              {/* Timestamp + checkmarks */}
              <div
                style={{
                  position: 'absolute',
                  bottom: 'clamp(4px, 0.8vw, 7px)',
                  right: 'clamp(8px, 1.5vw, 12px)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 3,
                }}
              >
                <span
                  style={{
                    fontSize: 'clamp(9px, 1.3vw, 11px)',
                    color: 'rgba(233,237,239,0.5)',
                  }}
                >
                  {msg.isSent ? '9:4' + (i + 1) + ' PM' : '9:4' + i + ' PM'}
                </span>
                {msg.isSent && (
                  <span
                    style={{
                      fontSize: 'clamp(11px, 1.6vw, 14px)',
                      color: checkColor,
                      fontWeight: 700,
                      letterSpacing: -3,
                    }}
                  >
                    \u2713\u2713
                  </span>
                )}
              </div>
            </div>
          )
        })}

        {/* Typing indicator */}
        {showTyping && (
          <div
            style={{
              alignSelf: 'flex-start',
              background: '#202C33',
              borderRadius: '10px 10px 10px 3px',
              padding: 'clamp(10px, 2vw, 14px) clamp(14px, 2.5vw, 20px)',
              display: 'flex',
              gap: 4,
              alignItems: 'center',
            }}
          >
            {[0, 1, 2].map((d) => (
              <div
                key={d}
                style={{
                  width: 'clamp(6px, 1vw, 8px)',
                  height: 'clamp(6px, 1vw, 8px)',
                  borderRadius: '50%',
                  background: '#8696A0',
                  opacity:
                    Math.sin(progress * 50 + d * 1.2) > 0 ? 0.9 : 0.35,
                }}
              />
            ))}
          </div>
        )}
      </div>

      {/* Input bar */}
      <div
        style={{
          background: '#202C33',
          padding: 'clamp(6px, 1.2vw, 10px) clamp(10px, 2vw, 16px)',
          display: 'flex',
          alignItems: 'center',
          gap: 'clamp(6px, 1.2vw, 10px)',
          flexShrink: 0,
        }}
      >
        <span style={{ fontSize: 'clamp(18px, 3vw, 24px)' }}>\uD83D\uDE00</span>
        <div
          style={{
            flex: 1,
            background: '#2A3942',
            borderRadius: 20,
            padding: 'clamp(8px, 1.5vw, 12px) clamp(14px, 2.5vw, 18px)',
            color: '#8696A0',
            fontSize: 'clamp(12px, 1.8vw, 14px)',
          }}
        >
          Message
        </div>
        <span style={{ fontSize: 'clamp(18px, 3vw, 24px)' }}>\uD83C\uDF99\uFE0F</span>
      </div>
    </div>
  )
}

registerMotionGraphic({
  id: 'tpl-scene-whatsapp',
  title: 'Scene WhatsApp',
  description:
    'WhatsApp conversation with green header, sent/received bubbles, animated double-check marks that turn blue, and typing indicator',
  tags: ['scene', 'conversation', 'messaging', 'whatsapp', 'chat', 'checkmark', 'green'],
  category: 'scene-layout',
  component: SceneWhatsAppComponent as unknown as React.ComponentType<MotionGraphicProps>,
  configSchema: [
    {
      key: 'messages',
      label: 'Messages (s: or r: prefix)',
      type: 'text-array',
      defaultValue: [
        'r:Hey, did you see the new update?',
        's:Yes! It looks amazing',
        'r:Right? The animations are so smooth',
        's:Can\'t wait to try it out \uD83D\uDE4C',
      ],
      group: 'Content',
    },
    { key: 'headerName', label: 'Contact Name', type: 'text', defaultValue: 'Alex', group: 'Content' },
    { key: 'headerColor', label: 'Header Color', type: 'color', defaultValue: '#1F2C34', group: 'Style' },
    { key: 'bgColor', label: 'Chat Background', type: 'color', defaultValue: '#0B141A', group: 'Style' },
  ],
  defaultConfig: {
    messages: [
      'r:Hey, did you see the new update?',
      's:Yes! It looks amazing',
      'r:Right? The animations are so smooth',
      's:Can\'t wait to try it out \uD83D\uDE4C',
    ],
    headerName: 'Alex',
    headerColor: '#1F2C34',
    bgColor: '#0B141A',
  },
})
