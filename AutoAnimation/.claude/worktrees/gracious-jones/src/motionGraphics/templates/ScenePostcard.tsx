import React from 'react'
import { registerMotionGraphic } from '../registry'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface ScenePostcardConfig {
  greeting: string
  messageBody: string
  signOff: string
  recipientName: string
  recipientAddress: string
  postmarkCity: string
  bgColor: string
  cardColor: string
  textColor: string
  accentColor: string
  stampColor: string
}

function easeOutCubic(t: number): number { return 1 - Math.pow(1 - t, 3) }
function easeInCubic(t: number): number { return t * t * t }
function easeOutBack(t: number): number {
  const c1 = 1.70158
  const c3 = c1 + 1
  return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2)
}

function ScenePostcardComponent({ config, progress }: MotionGraphicProps<ScenePostcardConfig>) {
  const { greeting, messageBody, signOff, recipientName, recipientAddress, postmarkCity, bgColor, cardColor, textColor, accentColor, stampColor } = config

  // Phases: enter 0-0.3, hold 0.3-0.8, exit 0.8-1
  const enterProgress = progress < 0.3 ? progress / 0.3 : 1
  const holdProgress = progress >= 0.3 && progress < 0.8 ? (progress - 0.3) / 0.5 : progress >= 0.8 ? 1 : 0
  const exitProgress = progress >= 0.8 ? (progress - 0.8) / 0.2 : 0

  // Card slides in from below
  const cardY = (1 - easeOutCubic(Math.min(1, enterProgress / 0.3))) * 60
  const cardOpacity = easeOutCubic(Math.min(1, enterProgress / 0.25))

  // Stamp lands with bounce
  const stampScale = enterProgress < 0.35 ? 0 : easeOutBack(Math.min(1, (enterProgress - 0.35) / 0.2))
  const stampRotation = -8 + stampScale * 3

  // Postmark appears
  const postmarkOpacity = easeOutCubic(Math.max(0, Math.min(1, (enterProgress - 0.45) / 0.15)))
  const postmarkRotation = -12

  // Greeting text writes in
  const greetingReveal = easeOutCubic(Math.max(0, Math.min(1, (enterProgress - 0.2) / 0.25)))

  // Message body reveals
  const messageReveal = easeOutCubic(Math.max(0, Math.min(1, (enterProgress - 0.4) / 0.3)))

  // Sign off
  const signOffOpacity = easeOutCubic(Math.max(0, Math.min(1, (enterProgress - 0.7) / 0.2)))

  // Recipient address
  const addrOpacity = easeOutCubic(Math.max(0, Math.min(1, (enterProgress - 0.55) / 0.2)))

  // Hold: gentle wobble
  const wobble = holdProgress > 0 ? Math.sin(holdProgress * Math.PI * 2) * 0.3 : 0

  // Exit
  const exitEased = easeInCubic(exitProgress)
  const exitOpacity = 1 - exitEased
  const exitRotation = exitEased * 5

  const handwrittenFont = "'Georgia', 'Palatino', serif"

  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        overflow: 'hidden',
        background: bgColor,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      {/* Postcard */}
      <div
        style={{
          width: 'clamp(260px, 70vw, 500px)',
          height: 'clamp(170px, 45vw, 320px)',
          background: cardColor,
          borderRadius: 'clamp(3px, 0.6vw, 6px)',
          boxShadow: `0 clamp(4px, 1vw, 8px) clamp(16px, 4vw, 30px) ${bgColor}66`,
          position: 'relative',
          display: 'flex',
          flexDirection: 'row',
          opacity: cardOpacity * exitOpacity,
          transform: `translateY(${cardY}px) rotate(${wobble + exitRotation}deg)`,
        }}
      >
        {/* Left half: message */}
        <div
          style={{
            flex: 1,
            padding: 'clamp(14px, 3vw, 24px)',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            borderRight: `1px solid ${accentColor}22`,
            overflow: 'hidden',
          }}
        >
          {/* Greeting */}
          <div
            style={{
              fontSize: 'clamp(12px, 2.4vw, 19px)',
              fontWeight: 400,
              fontStyle: 'italic',
              fontFamily: handwrittenFont,
              color: textColor,
              opacity: greetingReveal,
              marginBottom: 'clamp(6px, 1.2vw, 10px)',
              lineHeight: 1.3,
            }}
          >
            {greeting}
          </div>

          {/* Faint ruled lines (background) */}
          <div
            style={{
              position: 'absolute',
              left: 0,
              right: '50%',
              top: '20%',
              bottom: '15%',
              backgroundImage: `repeating-linear-gradient(0deg, transparent 0px, transparent clamp(18px, 3.8vw, 28px), ${accentColor}0A clamp(18px, 3.8vw, 28px), ${accentColor}0A calc(clamp(18px, 3.8vw, 28px) + 1px))`,
              pointerEvents: 'none',
            }}
          />

          {/* Message body */}
          <div
            style={{
              fontSize: 'clamp(10px, 2vw, 15px)',
              fontWeight: 400,
              fontStyle: 'italic',
              fontFamily: handwrittenFont,
              color: `${textColor}CC`,
              lineHeight: 1.7,
              opacity: messageReveal,
              clipPath: `inset(0 ${(1 - messageReveal) * 100}% 0 0)`,
            }}
          >
            {messageBody}
          </div>

          {/* Sign off */}
          <div
            style={{
              fontSize: 'clamp(11px, 2.2vw, 17px)',
              fontWeight: 400,
              fontStyle: 'italic',
              fontFamily: handwrittenFont,
              color: textColor,
              opacity: signOffOpacity,
              marginTop: 'clamp(8px, 1.5vw, 14px)',
              textAlign: 'right',
              paddingRight: 'clamp(8px, 1.5vw, 16px)',
            }}
          >
            {signOff}
          </div>
        </div>

        {/* Right half: address + stamp */}
        <div
          style={{
            flex: 1,
            padding: 'clamp(14px, 3vw, 24px)',
            display: 'flex',
            flexDirection: 'column',
            position: 'relative',
          }}
        >
          {/* Stamp area (top right) */}
          <div
            style={{
              position: 'absolute',
              top: 'clamp(8px, 2vw, 16px)',
              right: 'clamp(8px, 2vw, 16px)',
              width: 'clamp(30px, 8vw, 55px)',
              height: 'clamp(36px, 9.5vw, 65px)',
              border: `2px dashed ${accentColor}44`,
              borderRadius: 'clamp(2px, 0.3vw, 3px)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: stampColor,
              transform: `scale(${stampScale}) rotate(${stampRotation}deg)`,
              transformOrigin: 'center center',
            }}
          >
            <div
              style={{
                fontSize: 'clamp(10px, 2vw, 16px)',
                fontWeight: 700,
                fontFamily: "'Inter', sans-serif",
                color: cardColor,
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                textAlign: 'center',
                lineHeight: 1.1,
              }}
            >
              AIR{'\n'}MAIL
            </div>
          </div>

          {/* Postmark circle */}
          <div
            style={{
              position: 'absolute',
              top: 'clamp(4px, 1vw, 10px)',
              right: 'clamp(40px, 10vw, 72px)',
              width: 'clamp(36px, 9vw, 60px)',
              height: 'clamp(36px, 9vw, 60px)',
              border: `2px solid ${textColor}33`,
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transform: `rotate(${postmarkRotation}deg)`,
              opacity: postmarkOpacity,
            }}
          >
            <div
              style={{
                fontSize: 'clamp(6px, 1.2vw, 9px)',
                fontWeight: 600,
                fontFamily: "'Inter', sans-serif",
                color: `${textColor}44`,
                textAlign: 'center',
                textTransform: 'uppercase',
                letterSpacing: '0.06em',
                lineHeight: 1.2,
              }}
            >
              {postmarkCity}
            </div>
          </div>

          {/* Address lines (centered vertically) */}
          <div
            style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              gap: 'clamp(2px, 0.5vw, 4px)',
              paddingTop: 'clamp(30px, 8vw, 50px)',
              opacity: addrOpacity,
            }}
          >
            {/* Address lines with rules */}
            <div
              style={{
                fontSize: 'clamp(11px, 2.2vw, 17px)',
                fontWeight: 400,
                fontStyle: 'italic',
                fontFamily: handwrittenFont,
                color: textColor,
                borderBottom: `1px solid ${accentColor}22`,
                paddingBottom: 'clamp(4px, 0.8vw, 6px)',
              }}
            >
              {recipientName}
            </div>
            <div
              style={{
                fontSize: 'clamp(10px, 1.8vw, 14px)',
                fontWeight: 400,
                fontStyle: 'italic',
                fontFamily: handwrittenFont,
                color: `${textColor}AA`,
                borderBottom: `1px solid ${accentColor}22`,
                paddingBottom: 'clamp(4px, 0.8vw, 6px)',
                paddingTop: 'clamp(4px, 0.8vw, 6px)',
              }}
            >
              {recipientAddress}
            </div>
            {/* Empty ruled line */}
            <div
              style={{
                borderBottom: `1px solid ${accentColor}22`,
                height: 'clamp(14px, 3vw, 22px)',
              }}
            />
          </div>
        </div>
      </div>
    </div>
  )
}

registerMotionGraphic({
  id: 'tpl-scene-postcard',
  title: 'Postcard Back',
  description: 'Postcard back layout with handwritten greeting, message body, sign-off, stamp area with bounce, postmark circle, and ruled address lines',
  tags: ['scene', 'postcard', 'letter', 'handwritten', 'stamp', 'text', 'mail', 'vintage'],
  category: 'scene-layout',
  component: ScenePostcardComponent as any,
  defaultConfig: {
    greeting: 'Dear Mia,',
    messageBody: 'The sunsets here are unreal. Wish you could see the colors reflecting off the water. Missing home but grateful for this view.',
    signOff: 'With love, J.',
    recipientName: 'Mia Chen',
    recipientAddress: '14 Elm Street, Portland, OR 97201',
    postmarkCity: 'Lisbon',
    bgColor: '#0D0C0A',
    cardColor: '#F4EFE4',
    textColor: '#2C2824',
    accentColor: '#8B7355',
    stampColor: '#B44242',
  },
  configSchema: [
    { key: 'greeting', label: 'Greeting', type: 'text', defaultValue: 'Dear Mia,', group: 'Content' },
    { key: 'messageBody', label: 'Message', type: 'text', defaultValue: 'The sunsets here are unreal. Wish you could see the colors reflecting off the water. Missing home but grateful for this view.', group: 'Content' },
    { key: 'signOff', label: 'Sign Off', type: 'text', defaultValue: 'With love, J.', group: 'Content' },
    { key: 'recipientName', label: 'Recipient Name', type: 'text', defaultValue: 'Mia Chen', group: 'Content' },
    { key: 'recipientAddress', label: 'Recipient Address', type: 'text', defaultValue: '14 Elm Street, Portland, OR 97201', group: 'Content' },
    { key: 'postmarkCity', label: 'Postmark City', type: 'text', defaultValue: 'Lisbon', group: 'Content' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#0D0C0A', group: 'Style' },
    { key: 'cardColor', label: 'Card Color', type: 'color', defaultValue: '#F4EFE4', group: 'Style' },
    { key: 'textColor', label: 'Text Color', type: 'color', defaultValue: '#2C2824', group: 'Style' },
    { key: 'accentColor', label: 'Accent Color', type: 'color', defaultValue: '#8B7355', group: 'Style' },
    { key: 'stampColor', label: 'Stamp Color', type: 'color', defaultValue: '#B44242', group: 'Style' },
  ],
})
