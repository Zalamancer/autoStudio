import React from 'react'
import { registerMotionGraphic } from '../registry'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface RetroPostcardConfig {
  destination: string
  greeting: string
  message: string
  sender: string
  bgColor: string
  cardColor: string
  textColor: string
  accentColor: string
  tintColor: string
}

function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3)
}

function easeOutBack(t: number): number {
  const c = 1.70158
  return 1 + (c + 1) * Math.pow(t - 1, 3) + c * Math.pow(t - 1, 2)
}

function easeInCubic(t: number): number {
  return t * t * t
}

function SceneRetroPostcardComponent({
  config,
  frame,
  fps,
  durationInFrames,
}: MotionGraphicProps<RetroPostcardConfig>) {
  const { destination, greeting, message, sender, bgColor, cardColor, textColor, accentColor, tintColor } = config
  const progress = frame / durationInFrames
  const time = frame / fps

  const enterEnd = 0.3
  const holdEnd = 0.78
  const enterProgress = Math.min(1, progress / enterEnd)
  const holdProgress = progress >= enterEnd && progress < holdEnd ? (progress - enterEnd) / (holdEnd - enterEnd) : progress >= holdEnd ? 1 : 0
  const exitProgress = progress >= holdEnd ? (progress - holdEnd) / (1 - holdEnd) : 0

  // Card flies in with rotation like being tossed
  const cardFly = easeOutBack(Math.min(1, enterProgress / 0.5))
  const cardRotate = (1 - cardFly) * 15
  const cardScale = 0.6 + cardFly * 0.4
  const cardOpacity = easeOutCubic(Math.min(1, enterProgress / 0.3))

  // Destination title
  const destProgress = easeOutCubic(Math.max(0, Math.min(1, (enterProgress - 0.25) / 0.25)))

  // Greeting
  const greetProgress = easeOutCubic(Math.max(0, Math.min(1, (enterProgress - 0.4) / 0.2)))

  // Message writes in
  const msgWriteProgress = Math.max(0, Math.min(1, (enterProgress - 0.5) / 0.3))
  const msgChars = Math.floor(easeOutCubic(msgWriteProgress) * message.length)

  // Sender
  const senderProgress = easeOutCubic(Math.max(0, Math.min(1, (enterProgress - 0.8) / 0.15)))

  // Stamp stamp-down
  const stampProgress = easeOutBack(Math.max(0, Math.min(1, (enterProgress - 0.6) / 0.2)))

  // Exit
  const exitEased = easeInCubic(exitProgress)
  const exitOpacity = 1 - exitEased
  const exitRotate = exitEased * -12
  const exitScale = 1 - exitEased * 0.2

  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        overflow: 'hidden',
        background: bgColor,
        fontFamily: "'Georgia', 'Times New Roman', serif",
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      {/* Postcard */}
      <div
        style={{
          position: 'relative',
          width: 'clamp(300px, 75vw, 500px)',
          aspectRatio: '3/2',
          background: cardColor,
          borderRadius: 4,
          transform: `rotate(${cardRotate + exitRotate}deg) scale(${cardScale * exitScale})`,
          opacity: cardOpacity * exitOpacity,
          boxShadow: '0 8px 30px rgba(0,0,0,0.3), inset 0 0 15px rgba(140,110,50,0.06)',
          overflow: 'hidden',
        }}
      >
        {/* Left half — illustration area with tint */}
        <div
          style={{
            position: 'absolute',
            left: 0,
            top: 0,
            bottom: 0,
            width: '50%',
            background: `linear-gradient(135deg, ${tintColor}30 0%, ${tintColor}15 50%, ${tintColor}08 100%)`,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 'clamp(16px, 3vw, 28px)',
          }}
        >
          {/* Faded scenic illustration placeholder */}
          <div
            style={{
              width: '70%',
              aspectRatio: '1',
              borderRadius: '50%',
              border: `2px solid ${accentColor}30`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: 'clamp(8px, 1.5vw, 14px)',
              opacity: destProgress,
              background: `${tintColor}10`,
            }}
          >
            <div style={{ fontSize: 'clamp(28px, 6vw, 44px)', opacity: 0.4 }}>&#9728;</div>
          </div>

          {/* Destination name — large vintage */}
          <div
            style={{
              fontSize: 'clamp(18px, 4.5vw, 32px)',
              fontWeight: 900,
              color: textColor,
              textTransform: 'uppercase',
              letterSpacing: 3,
              textAlign: 'center',
              lineHeight: 1.1,
              opacity: destProgress,
              textShadow: '1px 1px 0 rgba(255,255,255,0.3)',
            }}
          >
            {destination}
          </div>

          {/* "GREETINGS FROM" banner */}
          <div
            style={{
              fontSize: 'clamp(8px, 1.3vw, 11px)',
              fontWeight: 600,
              color: accentColor,
              letterSpacing: '0.3em',
              textTransform: 'uppercase',
              marginTop: 'clamp(4px, 0.8vw, 8px)',
              opacity: destProgress * 0.8,
            }}
          >
            GREETINGS FROM
          </div>
        </div>

        {/* Center divider line */}
        <div
          style={{
            position: 'absolute',
            left: '50%',
            top: '8%',
            bottom: '8%',
            width: 1,
            background: `${textColor}25`,
          }}
        />

        {/* Right half — message area */}
        <div
          style={{
            position: 'absolute',
            right: 0,
            top: 0,
            bottom: 0,
            width: '50%',
            padding: 'clamp(14px, 3vw, 24px) clamp(12px, 2.5vw, 22px)',
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          {/* Stamp — top right */}
          <div
            style={{
              position: 'absolute',
              top: 'clamp(8px, 2%, 14px)',
              right: 'clamp(8px, 2%, 14px)',
              width: 'clamp(36px, 8vw, 55px)',
              height: 'clamp(44px, 10vw, 65px)',
              border: `2px dashed ${accentColor}40`,
              borderRadius: 2,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transform: `scale(${stampProgress})`,
              background: `${accentColor}08`,
            }}
          >
            <div style={{ fontSize: 'clamp(8px, 1.5vw, 11px)', fontWeight: 700, color: accentColor, textAlign: 'center' }}>
              5c
            </div>
          </div>

          {/* Postmark over stamp */}
          <div
            style={{
              position: 'absolute',
              top: 'clamp(2px, 0.5%, 8px)',
              right: 'clamp(2px, 0.5%, 8px)',
              width: 'clamp(50px, 12vw, 80px)',
              height: 'clamp(50px, 12vw, 80px)',
              borderRadius: '50%',
              border: `1.5px solid ${accentColor}20`,
              transform: `rotate(-20deg) scale(${stampProgress})`,
              pointerEvents: 'none',
            }}
          />

          {/* Address lines placeholder */}
          <div style={{ marginTop: 'clamp(50px, 12vw, 75px)' }}>
            {/* Greeting */}
            <div
              style={{
                fontSize: 'clamp(11px, 2vw, 15px)',
                fontStyle: 'italic',
                color: textColor,
                marginBottom: 'clamp(6px, 1.2vw, 10px)',
                opacity: greetProgress,
              }}
            >
              {greeting}
            </div>

            {/* Message */}
            <div
              style={{
                fontSize: 'clamp(9px, 1.6vw, 12px)',
                color: `${textColor}CC`,
                lineHeight: 1.5,
                marginBottom: 'clamp(10px, 2vw, 16px)',
              }}
            >
              {message.substring(0, msgChars)}
            </div>

            {/* Sender */}
            <div
              style={{
                fontSize: 'clamp(12px, 2.2vw, 17px)',
                fontStyle: 'italic',
                fontWeight: 700,
                color: textColor,
                opacity: senderProgress,
                transform: 'rotate(-2deg)',
              }}
            >
              {sender}
            </div>
          </div>
        </div>

        {/* Worn edges */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            boxShadow: 'inset 0 0 10px rgba(120,80,30,0.1)',
            borderRadius: 4,
            pointerEvents: 'none',
          }}
        />
      </div>
    </div>
  )
}

registerMotionGraphic({
  id: 'tpl-scene-retro-postcard',
  title: 'Scene Retro Postcard',
  description: 'Vintage travel postcard with destination illustration, stamp, postmark, handwritten message, and tossed-in entrance animation',
  tags: ['scene', 'retro', 'postcard', 'vintage', 'travel', 'stamp', 'mail', 'destination'],
  category: 'scene-layout',
  component: SceneRetroPostcardComponent as unknown as React.ComponentType<MotionGraphicProps>,
  defaultConfig: {
    destination: 'PARIS',
    greeting: 'Wish you were here!',
    message: 'The city is beautiful at this time of year. Every corner holds a new surprise.',
    sender: 'With love, Margaret',
    bgColor: '#2C1A0E',
    cardColor: '#F5E6CC',
    textColor: '#3E2723',
    accentColor: '#8B6914',
    tintColor: '#C49A6C',
  },
  configSchema: [
    { key: 'destination', label: 'Destination', type: 'text', defaultValue: 'PARIS', group: 'Content' },
    { key: 'greeting', label: 'Greeting', type: 'text', defaultValue: 'Wish you were here!', group: 'Content' },
    { key: 'message', label: 'Message', type: 'text', defaultValue: 'The city is beautiful at this time of year. Every corner holds a new surprise.', group: 'Content' },
    { key: 'sender', label: 'Sender', type: 'text', defaultValue: 'With love, Margaret', group: 'Content' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#2C1A0E', group: 'Style' },
    { key: 'cardColor', label: 'Card Color', type: 'color', defaultValue: '#F5E6CC', group: 'Style' },
    { key: 'textColor', label: 'Text Color', type: 'color', defaultValue: '#3E2723', group: 'Style' },
    { key: 'accentColor', label: 'Accent Color', type: 'color', defaultValue: '#8B6914', group: 'Style' },
    { key: 'tintColor', label: 'Tint Color', type: 'color', defaultValue: '#C49A6C', group: 'Style' },
  ],
})
