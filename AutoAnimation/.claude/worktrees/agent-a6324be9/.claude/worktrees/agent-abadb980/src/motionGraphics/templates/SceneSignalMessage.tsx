import React from 'react'
import { registerMotionGraphic } from '../registry'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface SceneSignalMessageConfig {
  senderName: string
  messageText: string
  timestamp: string
  contactInitial: string
  bgColor: string
  bubbleColor: string
  senderBubbleColor: string
  textColor: string
  accentColor: string
}

function easeOutCubic(t: number): number { return 1 - Math.pow(1 - t, 3) }
function easeInCubic(t: number): number { return t * t * t }
function easeOutBack(t: number): number {
  const c1 = 1.70158
  const c3 = c1 + 1
  return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2)
}

function SceneSignalMessageComponent({ config, progress }: MotionGraphicProps<SceneSignalMessageConfig>) {
  const { senderName, messageText, timestamp, contactInitial, bgColor, bubbleColor, senderBubbleColor, textColor, accentColor } = config

  const enterEnd = 0.3
  const holdEnd = 0.8
  const enterProgress = Math.min(1, progress / enterEnd)
  const holdProgress = progress >= enterEnd && progress < holdEnd ? (progress - enterEnd) / (holdEnd - enterEnd) : progress >= holdEnd ? 1 : 0
  const exitProgress = progress >= holdEnd ? (progress - holdEnd) / (1 - holdEnd) : 0

  // Header bar slides down
  const headerOpacity = easeOutCubic(Math.min(1, enterProgress / 0.15))
  const headerY = (1 - headerOpacity) * -20

  // Encryption badge fades in
  const encryptOpacity = easeOutCubic(Math.max(0, Math.min(1, (enterProgress - 0.08) / 0.12)))

  // Message bubble scales up from bottom-left
  const bubbleScale = easeOutBack(Math.max(0, Math.min(1, (enterProgress - 0.18) / 0.25)))
  const bubbleOpacity = easeOutCubic(Math.max(0, Math.min(1, (enterProgress - 0.18) / 0.15)))

  // Text typewriter inside bubble
  const typeProgress = easeOutCubic(Math.max(0, Math.min(1, (enterProgress - 0.35) / 0.45)))
  const visibleChars = Math.floor(typeProgress * messageText.length)
  const displayText = messageText.slice(0, visibleChars)

  // Read receipts appear
  const readProgress = easeOutCubic(Math.max(0, Math.min(1, (enterProgress - 0.85) / 0.12)))

  // Hold: read receipt checkmarks animate
  const checkPulse = 0.8 + Math.sin(holdProgress * Math.PI * 3) * 0.2

  // Timestamp fades in
  const timeOpacity = easeOutCubic(Math.max(0, Math.min(1, (enterProgress - 0.75) / 0.15)))

  // Exit
  const exitEased = easeInCubic(exitProgress)
  const exitOpacity = 1 - exitEased
  const exitY = exitEased * 30

  return (
    <div style={{
      position: 'absolute', inset: 0, overflow: 'hidden',
      background: bgColor,
      fontFamily: "'-apple-system', 'SF Pro Text', 'Helvetica Neue', sans-serif",
      display: 'flex', flexDirection: 'column',
    }}>
      {/* Signal header bar */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: 'clamp(12px, 2.5vw, 22px) clamp(14px, 3vw, 24px)',
        opacity: headerOpacity,
        transform: `translateY(${headerY}px)`,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 'clamp(8px, 1.5vw, 14px)' }}>
          {/* Back arrow */}
          <div style={{
            fontSize: 'clamp(16px, 2.8vw, 22px)', color: accentColor, fontWeight: 300,
          }}>{'\u2039'}</div>
          {/* Contact avatar */}
          <div style={{
            width: 'clamp(32px, 5.5vw, 42px)', height: 'clamp(32px, 5.5vw, 42px)',
            borderRadius: '50%', background: `${accentColor}25`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 'clamp(14px, 2.2vw, 18px)', fontWeight: 600, color: accentColor,
          }}>{contactInitial}</div>
          <div>
            <div style={{
              fontSize: 'clamp(14px, 2.2vw, 18px)', fontWeight: 600, color: textColor,
            }}>{senderName}</div>
          </div>
        </div>
        {/* Signal call icons (decorative) */}
        <div style={{ display: 'flex', gap: 'clamp(12px, 2vw, 20px)' }}>
          <div style={{
            width: 'clamp(16px, 2.5vw, 22px)', height: 'clamp(16px, 2.5vw, 22px)',
            borderRadius: '50%', border: `2px solid ${textColor}30`,
          }} />
          <div style={{
            width: 'clamp(16px, 2.5vw, 22px)', height: 'clamp(16px, 2.5vw, 22px)',
            borderRadius: 'clamp(3px, 0.5vw, 5px)', border: `2px solid ${textColor}30`,
          }} />
        </div>
      </div>

      {/* Encryption notice */}
      <div style={{
        textAlign: 'center',
        padding: 'clamp(6px, 1vw, 10px) clamp(14px, 3vw, 24px)',
        opacity: encryptOpacity,
      }}>
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: 'clamp(4px, 0.7vw, 7px)',
          background: `${textColor}08`, borderRadius: 'clamp(10px, 2vw, 16px)',
          padding: 'clamp(4px, 0.7vw, 7px) clamp(10px, 1.5vw, 16px)',
        }}>
          <span style={{
            fontSize: 'clamp(9px, 1.3vw, 11px)', color: `${textColor}50`,
          }}>{'\uD83D\uDD12'}</span>
          <span style={{
            fontSize: 'clamp(9px, 1.3vw, 11px)', color: `${textColor}45`, fontWeight: 500,
          }}>Messages are end-to-end encrypted</span>
        </div>
      </div>

      {/* Chat area */}
      <div style={{
        flex: 1, display: 'flex', flexDirection: 'column',
        justifyContent: 'center',
        padding: 'clamp(14px, 3vw, 28px)',
        opacity: exitOpacity,
        transform: `translateY(${exitY}px)`,
      }}>
        {/* Message bubble - aligned right (outgoing) */}
        <div style={{
          display: 'flex', justifyContent: 'flex-end',
          marginBottom: 'clamp(4px, 0.8vw, 8px)',
        }}>
          <div style={{
            background: senderBubbleColor,
            borderRadius: 'clamp(16px, 2.8vw, 22px) clamp(16px, 2.8vw, 22px) clamp(4px, 0.7vw, 6px) clamp(16px, 2.8vw, 22px)',
            padding: 'clamp(10px, 2vw, 18px) clamp(14px, 2.5vw, 22px)',
            maxWidth: '80%',
            transform: `scale(${bubbleScale})`,
            opacity: bubbleOpacity,
            transformOrigin: 'bottom right',
          }}>
            <div style={{
              fontSize: 'clamp(14px, 2.3vw, 19px)', fontWeight: 400,
              color: '#FFFFFF', lineHeight: 1.55,
              minHeight: 'clamp(20px, 4vh, 36px)',
            }}>
              {displayText}
              {visibleChars < messageText.length && (
                <span style={{
                  display: 'inline-block', width: 2, height: '1em',
                  background: '#FFFFFF80', marginLeft: 1,
                  opacity: Math.sin(progress * Math.PI * 20) > 0 ? 1 : 0,
                }} />
              )}
            </div>

            {/* Timestamp + read receipt row */}
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'flex-end',
              gap: 'clamp(4px, 0.6vw, 6px)',
              marginTop: 'clamp(4px, 0.6vw, 7px)',
            }}>
              <span style={{
                fontSize: 'clamp(9px, 1.2vw, 11px)', color: '#FFFFFF70',
                opacity: timeOpacity,
              }}>{timestamp}</span>
              {/* Double check (read receipt) */}
              <div style={{
                display: 'flex', opacity: readProgress,
                transform: `scale(${checkPulse})`,
              }}>
                <span style={{
                  fontSize: 'clamp(10px, 1.5vw, 13px)', color: '#FFFFFF90',
                  marginRight: -3, fontWeight: 700,
                }}>{'\u2713'}</span>
                <span style={{
                  fontSize: 'clamp(10px, 1.5vw, 13px)', color: '#FFFFFF90',
                  fontWeight: 700,
                }}>{'\u2713'}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Input bar */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 'clamp(8px, 1.5vw, 12px)',
        padding: 'clamp(8px, 1.5vw, 14px) clamp(14px, 3vw, 24px)',
        opacity: headerOpacity * 0.4,
      }}>
        <div style={{
          width: 'clamp(28px, 4.5vw, 36px)', height: 'clamp(28px, 4.5vw, 36px)',
          borderRadius: '50%', background: accentColor,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 'clamp(14px, 2.2vw, 18px)', color: '#fff',
        }}>+</div>
        <div style={{
          flex: 1, background: `${textColor}08`,
          borderRadius: 'clamp(18px, 3vw, 24px)',
          padding: 'clamp(8px, 1.5vw, 12px) clamp(14px, 2.5vw, 20px)',
        }}>
          <span style={{
            fontSize: 'clamp(12px, 1.8vw, 15px)', color: `${textColor}30`,
          }}>Signal message</span>
        </div>
      </div>
    </div>
  )
}

registerMotionGraphic({
  id: 'tpl-scene-signal-message',
  title: 'Signal Encrypted Message',
  description: 'Signal encrypted chat message with bubble, read receipts, encryption badge, timestamp, and contact header',
  tags: ['scene', 'signal', 'chat', 'encrypted', 'messaging', 'privacy', 'bubble'],
  category: 'scene-layout',
  component: SceneSignalMessageComponent as unknown as React.ComponentType<MotionGraphicProps>,
  defaultConfig: {
    senderName: 'Alex',
    messageText: 'Hey, just wanted to let you know the project is ready for review. All tests passing and docs are updated.',
    timestamp: '4:22 PM',
    contactInitial: 'A',
    bgColor: '#1B1C1E',
    bubbleColor: '#2C2D30',
    senderBubbleColor: '#3A76F0',
    textColor: '#E8E8E8',
    accentColor: '#3A76F0',
  },
  configSchema: [
    { key: 'senderName', label: 'Contact Name', type: 'text', defaultValue: 'Alex', group: 'Content' },
    { key: 'messageText', label: 'Message Text', type: 'text', defaultValue: 'Hey, just wanted to let you know the project is ready for review. All tests passing and docs are updated.', group: 'Content' },
    { key: 'timestamp', label: 'Timestamp', type: 'text', defaultValue: '4:22 PM', group: 'Content' },
    { key: 'contactInitial', label: 'Contact Initial', type: 'text', defaultValue: 'A', group: 'Content' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#1B1C1E', group: 'Style' },
    { key: 'bubbleColor', label: 'Received Bubble', type: 'color', defaultValue: '#2C2D30', group: 'Style' },
    { key: 'senderBubbleColor', label: 'Sent Bubble', type: 'color', defaultValue: '#3A76F0', group: 'Style' },
    { key: 'textColor', label: 'Text Color', type: 'color', defaultValue: '#E8E8E8', group: 'Style' },
    { key: 'accentColor', label: 'Accent Color', type: 'color', defaultValue: '#3A76F0', group: 'Style' },
  ],
})
