import React from 'react'
import { registerMotionGraphic } from '../registry'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface TextMessageConfig {
  messages: string[]
  senderColor: string
  receiverColor: string
  bgColor: string
}

function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3)
}
function easeInCubic(t: number): number {
  return t * t * t
}

function SceneTextMessageComponent({
  config,
  frame,
  durationInFrames,
}: MotionGraphicProps<TextMessageConfig>) {
  const { messages, senderColor, receiverColor, bgColor } = config
  const progress = frame / durationInFrames

  const enterEnd = 0.2
  const exitStart = 0.8

  // Parse messages: "s:text" = sender, "r:text" = receiver
  const parsed = messages.map((m) => {
    const isSender = m.startsWith('s:')
    return { isSender, text: m.slice(2) }
  })

  // Each message appears staggered during enter phase (0..0.6)
  const getMsgProgress = (index: number): number => {
    const totalMsgPhase = 0.6
    const perMsg = totalMsgPhase / parsed.length
    const msgStart = 0.05 + index * perMsg
    const msgDur = perMsg * 0.8
    return Math.max(0, Math.min(1, (progress - msgStart) / msgDur))
  }

  // Should we show typing indicator before a receiver message?
  const getTypingVisible = (index: number): boolean => {
    if (parsed[index]?.isSender) return false
    const totalMsgPhase = 0.6
    const perMsg = totalMsgPhase / parsed.length
    const msgStart = 0.05 + index * perMsg
    const typingStart = msgStart - perMsg * 0.4
    return progress >= typingStart && progress < msgStart
  }

  // Typing indicator blink during hold phase
  const typingBlink = Math.sin(progress * 80) > 0

  // Exit: entire conversation slides down
  let containerTranslateY = 0
  let containerOpacity = 1
  if (progress >= exitStart) {
    const exitT = easeInCubic((progress - exitStart) / (1 - exitStart))
    containerTranslateY = exitT * 120
    containerOpacity = 1 - exitT
  }

  // Find last visible receiver index for hold-phase typing
  const lastVisibleIndex = parsed.reduce(
    (acc, _, i) => (getMsgProgress(i) >= 1 ? i : acc),
    -1,
  )
  const showHoldTyping =
    progress >= enterEnd &&
    progress < exitStart &&
    lastVisibleIndex === parsed.length - 1

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
        flexDirection: 'column',
        justifyContent: 'flex-end',
        padding: '5%',
      }}
    >
      {/* Status bar */}
      <div
        style={{
          position: 'absolute',
          top: '3%',
          left: 0,
          right: 0,
          textAlign: 'center',
          fontSize: 'clamp(11px, 1.8vw, 14px)',
          color: '#8E8E93',
          fontWeight: 600,
        }}
      >
        iMessage
      </div>

      {/* Messages container */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: 'clamp(6px, 1.2vw, 10px)',
          transform: `translateY(${containerTranslateY}%)`,
          opacity: containerOpacity,
          paddingBottom: '2%',
        }}
      >
        {parsed.map((msg, i) => {
          const mp = getMsgProgress(i)
          if (mp <= 0 && !getTypingVisible(i)) return null

          const slideY = (1 - easeOutCubic(mp)) * 40
          const opacity = easeOutCubic(mp)

          // iMessage bubble radius: rounded on opposite side, less rounded on sender side
          const borderRadius = msg.isSender
            ? '20px 20px 4px 20px'
            : '20px 20px 20px 4px'

          return (
            <React.Fragment key={i}>
              {/* Typing indicator before receiver messages */}
              {getTypingVisible(i) && (
                <div
                  style={{
                    alignSelf: 'flex-start',
                    background: '#E9E9EB',
                    borderRadius: '20px 20px 20px 4px',
                    padding: 'clamp(10px, 2vw, 16px) clamp(14px, 2.5vw, 20px)',
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
                        background: '#999',
                        opacity:
                          Math.sin(progress * 60 + d * 1.2) > 0 ? 0.9 : 0.4,
                      }}
                    />
                  ))}
                </div>
              )}

              {/* Message bubble */}
              {mp > 0 && (
                <div
                  style={{
                    alignSelf: msg.isSender ? 'flex-end' : 'flex-start',
                    background: msg.isSender ? senderColor : receiverColor,
                    color: msg.isSender ? '#FFFFFF' : '#000000',
                    borderRadius,
                    padding:
                      'clamp(10px, 2vw, 14px) clamp(14px, 2.5vw, 18px)',
                    maxWidth: '75%',
                    fontSize: 'clamp(13px, 2.2vw, 17px)',
                    lineHeight: 1.35,
                    fontWeight: 400,
                    transform: `translateY(${slideY}px)`,
                    opacity,
                    letterSpacing: -0.2,
                  }}
                >
                  {msg.text}
                </div>
              )}
            </React.Fragment>
          )
        })}

        {/* Hold-phase typing indicator */}
        {showHoldTyping && (
          <div
            style={{
              alignSelf: 'flex-start',
              background: '#E9E9EB',
              borderRadius: '20px 20px 20px 4px',
              padding: 'clamp(10px, 2vw, 16px) clamp(14px, 2.5vw, 20px)',
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
                  background: '#999',
                  opacity: typingBlink && d % 2 === 0 ? 0.9 : 0.4,
                }}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

registerMotionGraphic({
  id: 'tpl-scene-text-message',
  title: 'Scene Text Message',
  description:
    'iMessage-style text conversation with blue/gray bubbles, typing indicators, and sequential message appearance',
  tags: ['scene', 'conversation', 'messaging', 'imessage', 'text', 'chat', 'bubbles'],
  category: 'scene-layout',
  component: SceneTextMessageComponent as unknown as React.ComponentType<MotionGraphicProps>,
  configSchema: [
    {
      key: 'messages',
      label: 'Messages (s: or r: prefix)',
      type: 'text-array',
      defaultValue: ['s:Hey! Are you free tonight?', 'r:Yeah! What did you have in mind?', 's:Let\'s grab dinner at that new place', 'r:Sounds great! See you at 7 \uD83D\uDE0A'],
      group: 'Content',
    },
    { key: 'senderColor', label: 'Sender Bubble', type: 'color', defaultValue: '#007AFF', group: 'Style' },
    { key: 'receiverColor', label: 'Receiver Bubble', type: 'color', defaultValue: '#E9E9EB', group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#FFFFFF', group: 'Style' },
  ],
  defaultConfig: {
    messages: ['s:Hey! Are you free tonight?', 'r:Yeah! What did you have in mind?', 's:Let\'s grab dinner at that new place', 'r:Sounds great! See you at 7 \uD83D\uDE0A'],
    senderColor: '#007AFF',
    receiverColor: '#E9E9EB',
    bgColor: '#FFFFFF',
  },
})
