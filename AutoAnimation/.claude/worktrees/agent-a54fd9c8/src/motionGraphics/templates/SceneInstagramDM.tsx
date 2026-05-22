import React from 'react'
import { registerMotionGraphic } from '../registry'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface InstagramDMConfig {
  username: string
  messages: string[]
  senderColor: string
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

function SceneInstagramDMComponent({ config, frame, durationInFrames }: MotionGraphicProps<InstagramDMConfig>) {
  const { username, messages, senderColor, bgColor } = config
  const progress = frame / durationInFrames

  const exitStart = 0.8

  // Parse messages: "s:text" = sender (you), "r:text" = receiver (them)
  const parsed = messages.map((m) => {
    const isSender = m.startsWith('s:')
    return { isSender, text: m.slice(2) }
  })

  // Header slides down
  const headerStart = 0.02
  const headerDur = 0.1
  const headerProgress = easeOutCubic(Math.max(0, Math.min(1, (progress - headerStart) / headerDur)))
  const headerY = (1 - headerProgress) * -40

  // Messages appear staggered
  const getMsgProgress = (index: number): number => {
    const totalPhase = 0.55
    const perMsg = totalPhase / parsed.length
    const msgStart = 0.12 + index * perMsg
    const msgDur = perMsg * 0.75
    return Math.max(0, Math.min(1, (progress - msgStart) / msgDur))
  }

  // Heart reaction on last message
  const lastIdx = parsed.length - 1
  const lastMsgEnd = (() => {
    const totalPhase = 0.55
    const perMsg = totalPhase / parsed.length
    return 0.12 + lastIdx * perMsg + perMsg * 0.75
  })()
  const heartStart = lastMsgEnd + 0.04
  const heartDur = 0.08
  const heartScale = easeOutBack(Math.max(0, Math.min(1, (progress - heartStart) / heartDur)))

  // Heart pulse during hold
  const heartPulse = progress >= heartStart + heartDur && progress < exitStart ? 1 + Math.sin(progress * 25) * 0.12 : 1

  // "Seen" text appears
  const seenStart = heartStart + 0.1
  const seenOpacity = easeOutCubic(Math.max(0, Math.min(1, (progress - seenStart) / 0.05)))

  // Exit: slides down
  let containerY = 0
  let containerOpacity = 1
  if (progress >= exitStart) {
    const t = easeInCubic((progress - exitStart) / (1 - exitStart))
    containerY = t * 100
    containerOpacity = 1 - t
  }

  // Instagram gradient for sender bubbles
  const senderGradient = `linear-gradient(135deg, ${senderColor}, #C13584, #E1306C)`

  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        background: bgColor,
        overflow: 'hidden',
        fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', 'Helvetica Neue', sans-serif",
        display: 'flex',
        flexDirection: 'column',
        transform: `translateY(${containerY}%)`,
        opacity: containerOpacity,
      }}
    >
      {/* Header */}
      <div
        style={{
          padding: 'clamp(10px, 2vw, 16px) clamp(14px, 2.5vw, 20px)',
          borderBottom: '1px solid #262626',
          display: 'flex',
          alignItems: 'center',
          gap: 'clamp(10px, 2vw, 14px)',
          background: '#000000',
          transform: `translateY(${headerY}px)`,
          opacity: headerProgress,
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
          {'←'}
        </div>

        {/* Profile pic */}
        <div
          style={{
            width: 'clamp(30px, 5vw, 40px)',
            height: 'clamp(30px, 5vw, 40px)',
            borderRadius: '50%',
            background: 'linear-gradient(135deg, #FEDA75, #FA7E1E, #D62976, #962FBF, #4F5BD5)',
            padding: 2,
          }}
        >
          <div
            style={{
              width: '100%',
              height: '100%',
              borderRadius: '50%',
              background: '#262626',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#FFFFFF',
              fontWeight: 700,
              fontSize: 'clamp(12px, 2vw, 16px)',
            }}
          >
            {username.charAt(0).toUpperCase()}
          </div>
        </div>

        {/* Username */}
        <div style={{ flex: 1 }}>
          <div
            style={{
              fontSize: 'clamp(13px, 2vw, 16px)',
              fontWeight: 600,
              color: '#FFFFFF',
            }}
          >
            {username}
          </div>
          <div
            style={{
              fontSize: 'clamp(10px, 1.5vw, 12px)',
              color: '#8E8E8E',
            }}
          >
            Active now
          </div>
        </div>

        {/* Icons */}
        <div style={{ display: 'flex', gap: 'clamp(12px, 2vw, 18px)' }}>
          <span
            style={{
              fontSize: 'clamp(16px, 2.5vw, 22px)',
              color: '#FFFFFF',
            }}
          >
            {'📞'}
          </span>
          <span
            style={{
              fontSize: 'clamp(16px, 2.5vw, 22px)',
              color: '#FFFFFF',
            }}
          >
            {'📹'}
          </span>
        </div>
      </div>

      {/* Chat area */}
      <div
        style={{
          flex: 1,
          padding: 'clamp(10px, 2vw, 16px)',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'flex-end',
          gap: 'clamp(4px, 0.8vw, 6px)',
        }}
      >
        {parsed.map((msg, i) => {
          const mp = getMsgProgress(i)
          if (mp <= 0) return null

          const slideY = (1 - easeOutCubic(mp)) * 25
          const opacity = easeOutCubic(mp)
          const isLast = i === lastIdx

          return (
            <div
              key={i}
              style={{
                alignSelf: msg.isSender ? 'flex-end' : 'flex-start',
                position: 'relative',
              }}
            >
              <div
                style={{
                  maxWidth: 'clamp(180px, 65%, 320px)',
                  background: msg.isSender ? senderGradient : '#262626',
                  color: '#FFFFFF',
                  borderRadius: 22,
                  padding: 'clamp(8px, 1.5vw, 12px) clamp(14px, 2.5vw, 18px)',
                  fontSize: 'clamp(13px, 2vw, 15px)',
                  lineHeight: 1.4,
                  transform: `translateY(${slideY}px)`,
                  opacity,
                }}
              >
                {msg.text}
              </div>

              {/* Heart reaction on last message */}
              {isLast && heartScale > 0 && (
                <div
                  style={{
                    position: 'absolute',
                    bottom: -12,
                    [msg.isSender ? 'left' : 'right']: 12,
                    fontSize: 'clamp(14px, 2.2vw, 18px)',
                    transform: `scale(${heartScale * heartPulse})`,
                    background: '#262626',
                    borderRadius: '50%',
                    width: 'clamp(24px, 4vw, 30px)',
                    height: 'clamp(24px, 4vw, 30px)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    border: `2px solid ${bgColor}`,
                  }}
                >
                  {'❤️'}
                </div>
              )}
            </div>
          )
        })}

        {/* Seen text */}
        {seenOpacity > 0 && (
          <div
            style={{
              alignSelf: 'flex-end',
              fontSize: 'clamp(10px, 1.3vw, 12px)',
              color: '#8E8E8E',
              opacity: seenOpacity,
              marginTop: 4,
              paddingRight: 4,
            }}
          >
            Seen
          </div>
        )}
      </div>

      {/* Input bar */}
      <div
        style={{
          padding: 'clamp(8px, 1.5vw, 12px) clamp(10px, 2vw, 16px)',
          borderTop: '1px solid #262626',
          display: 'flex',
          alignItems: 'center',
          gap: 'clamp(8px, 1.5vw, 12px)',
          background: '#000000',
          flexShrink: 0,
        }}
      >
        <div
          style={{
            width: 'clamp(32px, 5vw, 40px)',
            height: 'clamp(32px, 5vw, 40px)',
            borderRadius: '50%',
            background: 'linear-gradient(135deg, #405DE6, #5B51D8, #833AB4)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#FFFFFF',
            fontSize: 'clamp(16px, 2.5vw, 20px)',
          }}
        >
          {'📷'}
        </div>
        <div
          style={{
            flex: 1,
            border: '1px solid #363636',
            borderRadius: 22,
            padding: 'clamp(8px, 1.5vw, 10px) clamp(14px, 2.5vw, 18px)',
            color: '#8E8E8E',
            fontSize: 'clamp(12px, 1.8vw, 14px)',
          }}
        >
          Message...
        </div>
        <span
          style={{
            fontSize: 'clamp(18px, 3vw, 24px)',
            color: '#FFFFFF',
          }}
        >
          {'❤️'}
        </span>
      </div>
    </div>
  )
}

registerMotionGraphic({
  id: 'tpl-scene-instagram-dm',
  title: 'Scene Instagram DM',
  description:
    'Instagram DM conversation with gradient sender bubbles, profile ring, heart reaction, and "Seen" indicator',
  tags: ['scene', 'conversation', 'messaging', 'instagram', 'dm', 'chat', 'gradient'],
  category: 'scene-layout',
  component: SceneInstagramDMComponent as unknown as React.ComponentType<MotionGraphicProps>,
  configSchema: [
    { key: 'username', label: 'Username', type: 'text', defaultValue: 'creative.studio', group: 'Content' },
    {
      key: 'messages',
      label: 'Messages (s: or r: prefix)',
      type: 'text-array',
      defaultValue: [
        'r:Loved your latest post!',
        's:Thank you so much! \uD83D\uDE4F',
        'r:How did you make those animations?',
        "s:ProAnimate! It's super easy to use",
      ],
      group: 'Content',
    },
    { key: 'senderColor', label: 'Sender Gradient Start', type: 'color', defaultValue: '#833AB4', group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#000000', group: 'Style' },
  ],
  defaultConfig: {
    username: 'creative.studio',
    messages: [
      'r:Loved your latest post!',
      's:Thank you so much! \uD83D\uDE4F',
      'r:How did you make those animations?',
      "s:ProAnimate! It's super easy to use",
    ],
    senderColor: '#833AB4',
    bgColor: '#000000',
  },
})
