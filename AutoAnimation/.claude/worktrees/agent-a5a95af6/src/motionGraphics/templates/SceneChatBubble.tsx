import React from 'react'
import { registerMotionGraphic } from '../registry'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface ChatBubbleConfig {
  messages: string[]
  bubbleColors: string[]
  bgColor: string
}

function easeOutBack(t: number): number {
  const c1 = 1.70158
  const c3 = c1 + 1
  return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2)
}
function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3)
}
function easeInCubic(t: number): number {
  return t * t * t
}

function SceneChatBubbleComponent({ config, frame, durationInFrames }: MotionGraphicProps<ChatBubbleConfig>) {
  const { messages, bubbleColors, bgColor } = config
  const progress = frame / durationInFrames

  const exitStart = 0.8

  // Parse messages: "name:emoji:message"
  const parsed = messages.map((m, i) => {
    const parts = m.split(':')
    const name = parts[0] || 'User'
    const emoji = parts[1] || '\uD83D\uDE00'
    const text = parts.slice(2).join(':') || ''
    const isLeft = i % 2 === 0
    return { name, emoji, text, isLeft, color: bubbleColors[i % bubbleColors.length] || '#6366F1' }
  })

  // Staggered entrance
  const getMsgProgress = (index: number): number => {
    const totalPhase = 0.65
    const perMsg = totalPhase / parsed.length
    const msgStart = 0.05 + index * perMsg
    const msgDur = perMsg * 0.9
    return Math.max(0, Math.min(1, (progress - msgStart) / msgDur))
  }

  // Avatar appears first, bubble stretches out
  const getAvatarProgress = (index: number): number => {
    const mp = getMsgProgress(index)
    return Math.min(1, mp * 2)
  }

  const getBubbleProgress = (index: number): number => {
    const mp = getMsgProgress(index)
    return Math.max(0, Math.min(1, (mp - 0.3) / 0.7))
  }

  // Newest bubble pulse during hold
  const newestIdx = parsed.length - 1
  const newestPulse = progress >= 0.2 && progress < exitStart ? 1 + Math.sin(progress * 30) * 0.015 : 1

  // Exit: fade out top-first
  const getExitOpacity = (index: number): number => {
    if (progress < exitStart) return 1
    const exitT = (progress - exitStart) / (1 - exitStart)
    const stagger = index * 0.15
    return 1 - easeInCubic(Math.max(0, Math.min(1, (exitT - stagger) / 0.5)))
  }

  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        background: bgColor,
        overflow: 'hidden',
        fontFamily: "'Helvetica Neue', Arial, sans-serif",
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        padding: '5% 4%',
        gap: 'clamp(12px, 2.5vw, 20px)',
      }}
    >
      {parsed.map((msg, i) => {
        const ap = getAvatarProgress(i)
        const bp = getBubbleProgress(i)
        const exitOp = getExitOpacity(i)
        if (ap <= 0 && exitOp <= 0) return null

        const avatarScale = easeOutBack(ap)
        const slideX = msg.isLeft ? (1 - easeOutCubic(bp)) * -60 : (1 - easeOutCubic(bp)) * 60

        const isNewest = i === newestIdx
        const scale = isNewest && bp >= 1 ? newestPulse : 1

        return (
          <div
            key={i}
            style={{
              display: 'flex',
              flexDirection: msg.isLeft ? 'row' : 'row-reverse',
              alignItems: 'flex-start',
              gap: 'clamp(8px, 1.5vw, 14px)',
              opacity: exitOp,
            }}
          >
            {/* Avatar */}
            <div
              style={{
                width: 'clamp(36px, 6vw, 50px)',
                height: 'clamp(36px, 6vw, 50px)',
                borderRadius: '50%',
                background: msg.color,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 'clamp(18px, 3vw, 26px)',
                transform: `scale(${avatarScale})`,
                flexShrink: 0,
                boxShadow: `0 2px 8px ${msg.color}40`,
              }}
            >
              {msg.emoji}
            </div>

            {/* Bubble */}
            <div
              style={{
                maxWidth: '70%',
                display: 'flex',
                flexDirection: 'column',
                gap: 4,
                transform: `translateX(${slideX}px) scale(${scale})`,
                opacity: bp > 0 ? easeOutCubic(bp) : 0,
              }}
            >
              {/* Name */}
              <div
                style={{
                  fontSize: 'clamp(10px, 1.5vw, 13px)',
                  fontWeight: 700,
                  color: msg.color,
                  paddingLeft: msg.isLeft ? 12 : 0,
                  paddingRight: msg.isLeft ? 0 : 12,
                  textAlign: msg.isLeft ? 'left' : 'right',
                }}
              >
                {msg.name}
              </div>

              {/* Message bubble */}
              <div
                style={{
                  background: msg.color,
                  color: '#FFFFFF',
                  borderRadius: msg.isLeft ? '4px 18px 18px 18px' : '18px 4px 18px 18px',
                  padding: 'clamp(10px, 2vw, 14px) clamp(14px, 2.5vw, 18px)',
                  fontSize: 'clamp(13px, 2.2vw, 16px)',
                  lineHeight: 1.4,
                  fontWeight: 400,
                  boxShadow: `0 2px 12px ${msg.color}25`,
                }}
              >
                {msg.text}
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}

registerMotionGraphic({
  id: 'tpl-scene-chat-bubble',
  title: 'Scene Chat Bubble',
  description:
    'Generic colorful chat conversation with emoji avatars, bounce-in animation, and staggered message entrance',
  tags: ['scene', 'conversation', 'messaging', 'chat', 'bubble', 'avatar', 'generic'],
  category: 'scene-layout',
  component: SceneChatBubbleComponent as unknown as React.ComponentType<MotionGraphicProps>,
  configSchema: [
    {
      key: 'messages',
      label: 'Messages (name:emoji:text)',
      type: 'text-array',
      defaultValue: [
        'Alex:\uD83D\uDE0E:Just shipped the new feature!',
        'Sam:\uD83D\uDE80:That was fast, nice work!',
        "Jordan:\uD83C\uDF89:Let's celebrate with pizza tonight",
      ],
      group: 'Content',
    },
    {
      key: 'bubbleColors',
      label: 'Bubble Colors',
      type: 'text-array',
      defaultValue: ['#6366F1', '#EC4899', '#10B981'],
      group: 'Style',
    },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#F8F9FA', group: 'Style' },
  ],
  defaultConfig: {
    messages: [
      'Alex:\uD83D\uDE0E:Just shipped the new feature!',
      'Sam:\uD83D\uDE80:That was fast, nice work!',
      "Jordan:\uD83C\uDF89:Let's celebrate with pizza tonight",
    ],
    bubbleColors: ['#6366F1', '#EC4899', '#10B981'],
    bgColor: '#F8F9FA',
  },
})
