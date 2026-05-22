import React from 'react'
import { registerMotionGraphic } from '../registry'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface SceneiMessageBubbleConfig {
  contactName: string
  messageText: string
  replyText: string
  timestamp: string
  isBlue: boolean
  bgColor: string
  textColor: string
}

function easeOutCubic(t: number): number { return 1 - Math.pow(1 - t, 3) }
function easeInCubic(t: number): number { return t * t * t }
function easeOutBack(t: number): number {
  const c1 = 1.70158
  const c3 = c1 + 1
  return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2)
}

function SceneiMessageBubbleComponent({ config, progress }: MotionGraphicProps<SceneiMessageBubbleConfig>) {
  const { contactName, messageText, replyText, timestamp, isBlue, bgColor, textColor } = config

  const bubbleColor = isBlue ? '#007AFF' : '#34C759'
  const incomingBubble = '#3A3A3C'

  const enterEnd = 0.35
  const holdEnd = 0.78
  const enterProgress = Math.min(1, progress / enterEnd)
  const holdProgress = progress >= enterEnd && progress < holdEnd ? (progress - enterEnd) / (holdEnd - enterEnd) : progress >= holdEnd ? 1 : 0
  const exitProgress = progress >= holdEnd ? (progress - holdEnd) / (1 - holdEnd) : 0

  // Header slides in
  const headerOpacity = easeOutCubic(Math.min(1, enterProgress / 0.12))

  // Incoming message bubble pops up from bottom-left
  const incomingScale = easeOutBack(Math.max(0, Math.min(1, (enterProgress - 0.1) / 0.22)))
  const incomingOpacity = easeOutCubic(Math.max(0, Math.min(1, (enterProgress - 0.1) / 0.12)))

  // Typing indicator appears
  const typingProgress = Math.max(0, Math.min(1, (enterProgress - 0.4) / 0.15))
  const typingOpacity = easeOutCubic(typingProgress)

  // Outgoing message replaces typing indicator
  const replyAppear = Math.max(0, Math.min(1, (enterProgress - 0.6) / 0.25))
  const replyScale = easeOutBack(replyAppear)
  const replyOpacity = easeOutCubic(Math.max(0, Math.min(1, (enterProgress - 0.6) / 0.12)))

  // Typing dots disappear when reply appears
  const typingFade = replyAppear > 0.1 ? 0 : typingOpacity

  // Delivered/Read status
  const statusProgress = easeOutCubic(Math.max(0, Math.min(1, (enterProgress - 0.88) / 0.12)))

  // Hold: Read status transitions from "Delivered" to "Read"
  const readTransition = holdProgress > 0.3 ? 1 : 0

  // Typing dots animation during hold
  const dotPhase = progress * 12

  // Exit
  const exitEased = easeInCubic(exitProgress)
  const exitOpacity = 1 - exitEased
  const exitScale = 1 - exitEased * 0.08

  return (
    <div style={{
      position: 'absolute', inset: 0, overflow: 'hidden',
      background: bgColor,
      fontFamily: "'-apple-system', 'SF Pro Text', 'Helvetica Neue', sans-serif",
      display: 'flex', flexDirection: 'column',
    }}>
      {/* iOS-style header */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        flexDirection: 'column',
        padding: 'clamp(14px, 3vw, 26px) clamp(14px, 3vw, 24px) clamp(8px, 1.5vw, 14px)',
        opacity: headerOpacity,
        borderBottom: `0.5px solid ${textColor}15`,
      }}>
        {/* Contact avatar */}
        <div style={{
          width: 'clamp(42px, 7vw, 56px)', height: 'clamp(42px, 7vw, 56px)',
          borderRadius: '50%', background: `${bubbleColor}30`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 'clamp(18px, 3vw, 24px)', fontWeight: 600, color: bubbleColor,
          marginBottom: 'clamp(4px, 0.7vw, 7px)',
        }}>{contactName.charAt(0).toUpperCase()}</div>
        <div style={{
          fontSize: 'clamp(14px, 2.2vw, 18px)', fontWeight: 600, color: textColor,
        }}>{contactName}</div>
        <div style={{
          fontSize: 'clamp(10px, 1.4vw, 12px)', color: `${textColor}50`,
          marginTop: 1,
        }}>iMessage</div>
      </div>

      {/* Chat area */}
      <div style={{
        flex: 1, display: 'flex', flexDirection: 'column',
        justifyContent: 'center', gap: 'clamp(6px, 1.2vw, 12px)',
        padding: 'clamp(14px, 3vw, 28px)',
        opacity: exitOpacity, transform: `scale(${exitScale})`,
      }}>
        {/* Timestamp */}
        <div style={{
          textAlign: 'center', opacity: headerOpacity * 0.7,
          marginBottom: 'clamp(4px, 0.8vw, 8px)',
        }}>
          <span style={{
            fontSize: 'clamp(10px, 1.4vw, 12px)', color: `${textColor}45`, fontWeight: 500,
          }}>{timestamp}</span>
        </div>

        {/* Incoming message (left-aligned, gray bubble) */}
        <div style={{
          display: 'flex', justifyContent: 'flex-start',
          opacity: incomingOpacity,
          transform: `scale(${incomingScale})`,
          transformOrigin: 'bottom left',
        }}>
          <div style={{
            background: incomingBubble,
            borderRadius: 'clamp(16px, 2.8vw, 22px) clamp(16px, 2.8vw, 22px) clamp(16px, 2.8vw, 22px) clamp(4px, 0.7vw, 6px)',
            padding: 'clamp(8px, 1.5vw, 14px) clamp(12px, 2vw, 18px)',
            maxWidth: '78%',
          }}>
            <div style={{
              fontSize: 'clamp(14px, 2.3vw, 19px)', fontWeight: 400,
              color: '#FFFFFF', lineHeight: 1.5,
            }}>{messageText}</div>
          </div>
        </div>

        {/* Typing indicator (three dots) */}
        <div style={{
          display: 'flex', justifyContent: 'flex-end',
          opacity: typingFade,
          height: typingFade > 0 ? 'auto' : 0,
          overflow: 'hidden',
        }}>
          <div style={{
            background: bubbleColor,
            borderRadius: 'clamp(16px, 2.8vw, 22px) clamp(16px, 2.8vw, 22px) clamp(4px, 0.7vw, 6px) clamp(16px, 2.8vw, 22px)',
            padding: 'clamp(10px, 1.8vw, 16px) clamp(14px, 2.5vw, 22px)',
            display: 'flex', gap: 'clamp(3px, 0.5vw, 5px)', alignItems: 'center',
          }}>
            {[0, 1, 2].map((i) => (
              <div key={i} style={{
                width: 'clamp(6px, 1vw, 8px)', height: 'clamp(6px, 1vw, 8px)',
                borderRadius: '50%', background: '#FFFFFFAA',
                opacity: 0.4 + 0.6 * Math.max(0, Math.sin(dotPhase - i * 0.8)),
                transform: `translateY(${Math.sin(dotPhase - i * 0.8) * -2}px)`,
              }} />
            ))}
          </div>
        </div>

        {/* Outgoing reply (right-aligned, blue/green bubble) */}
        <div style={{
          display: 'flex', justifyContent: 'flex-end',
          opacity: replyOpacity,
          transform: `scale(${replyScale})`,
          transformOrigin: 'bottom right',
        }}>
          <div style={{
            background: bubbleColor,
            borderRadius: 'clamp(16px, 2.8vw, 22px) clamp(16px, 2.8vw, 22px) clamp(4px, 0.7vw, 6px) clamp(16px, 2.8vw, 22px)',
            padding: 'clamp(8px, 1.5vw, 14px) clamp(12px, 2vw, 18px)',
            maxWidth: '78%',
          }}>
            <div style={{
              fontSize: 'clamp(14px, 2.3vw, 19px)', fontWeight: 400,
              color: '#FFFFFF', lineHeight: 1.5,
            }}>{replyText}</div>
          </div>
        </div>

        {/* Delivered / Read status */}
        <div style={{
          textAlign: 'right',
          opacity: statusProgress,
          paddingRight: 'clamp(4px, 0.7vw, 8px)',
        }}>
          <span style={{
            fontSize: 'clamp(10px, 1.4vw, 12px)', fontWeight: 500,
            color: `${textColor}50`,
          }}>{readTransition > 0 ? 'Read' : 'Delivered'}</span>
        </div>
      </div>

      {/* Input bar */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 'clamp(8px, 1.5vw, 12px)',
        padding: 'clamp(8px, 1.5vw, 14px) clamp(14px, 3vw, 24px)',
        opacity: headerOpacity * 0.4,
      }}>
        <div style={{
          flex: 1, background: `${textColor}08`,
          borderRadius: 'clamp(18px, 3vw, 24px)',
          border: `1px solid ${textColor}15`,
          padding: 'clamp(8px, 1.5vw, 12px) clamp(14px, 2.5vw, 20px)',
        }}>
          <span style={{
            fontSize: 'clamp(13px, 2vw, 16px)', color: `${textColor}30`,
          }}>iMessage</span>
        </div>
      </div>
    </div>
  )
}

registerMotionGraphic({
  id: 'tpl-scene-imessage-bubble',
  title: 'iMessage Bubble',
  description: 'iMessage conversation with blue/green bubbles, typing indicator dots, delivered/read status, and iOS-style contact header',
  tags: ['scene', 'imessage', 'ios', 'apple', 'chat', 'messaging', 'bubble', 'text'],
  category: 'scene-layout',
  component: SceneiMessageBubbleComponent as unknown as React.ComponentType<MotionGraphicProps>,
  defaultConfig: {
    contactName: 'Sarah',
    messageText: 'Are you free for coffee tomorrow?',
    replyText: 'Absolutely! Same place as last time?',
    timestamp: 'Today 3:45 PM',
    isBlue: true,
    bgColor: '#000000',
    textColor: '#FFFFFF',
  },
  configSchema: [
    { key: 'contactName', label: 'Contact Name', type: 'text', defaultValue: 'Sarah', group: 'Content' },
    { key: 'messageText', label: 'Incoming Message', type: 'text', defaultValue: 'Are you free for coffee tomorrow?', group: 'Content' },
    { key: 'replyText', label: 'Reply Message', type: 'text', defaultValue: 'Absolutely! Same place as last time?', group: 'Content' },
    { key: 'timestamp', label: 'Timestamp', type: 'text', defaultValue: 'Today 3:45 PM', group: 'Content' },
    { key: 'isBlue', label: 'iMessage (Blue)', type: 'boolean', defaultValue: true, group: 'Content' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#000000', group: 'Style' },
    { key: 'textColor', label: 'Text Color', type: 'color', defaultValue: '#FFFFFF', group: 'Style' },
  ],
})
