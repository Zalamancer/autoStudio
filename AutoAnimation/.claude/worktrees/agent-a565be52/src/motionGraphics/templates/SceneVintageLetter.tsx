import React from 'react'
import { registerMotionGraphic } from '../registry'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface VintageLetterConfig {
  greeting: string
  body: string
  closing: string
  sender: string
  date: string
  bgColor: string
  paperColor: string
  textColor: string
  inkColor: string
}

function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3)
}

function easeInCubic(t: number): number {
  return t * t * t
}

function SceneVintageLetterComponent({
  config,
  frame,
  fps,
  durationInFrames,
}: MotionGraphicProps<VintageLetterConfig>) {
  const { greeting, body, closing, sender, date, bgColor, paperColor, textColor, inkColor } = config
  const progress = frame / durationInFrames
  const time = frame / fps

  const enterEnd = 0.32
  const holdEnd = 0.78
  const enterProgress = Math.min(1, progress / enterEnd)
  const holdProgress = progress >= enterEnd && progress < holdEnd ? (progress - enterEnd) / (holdEnd - enterEnd) : progress >= holdEnd ? 1 : 0
  const exitProgress = progress >= holdEnd ? (progress - holdEnd) / (1 - holdEnd) : 0

  // Letter unfolds — rotates from folded state
  const unfoldProgress = easeOutCubic(Math.min(1, enterProgress / 0.4))
  const paperRotate = (1 - unfoldProgress) * 5
  const paperScale = 0.85 + unfoldProgress * 0.15
  const paperOpacity = easeOutCubic(Math.min(1, enterProgress / 0.25))

  // Date appears
  const dateProgress = easeOutCubic(Math.max(0, Math.min(1, (enterProgress - 0.2) / 0.2)))

  // Greeting written
  const greetProgress = Math.max(0, Math.min(1, (enterProgress - 0.3) / 0.2))
  const greetChars = Math.floor(easeOutCubic(greetProgress) * greeting.length)

  // Body text reveals line by line
  const bodyProgress = easeOutCubic(Math.max(0, Math.min(1, (enterProgress - 0.45) / 0.3)))

  // Closing and signature
  const closingProgress = easeOutCubic(Math.max(0, Math.min(1, (enterProgress - 0.7) / 0.2)))

  // Signature appears with a slight slant
  const sigProgress = easeOutCubic(Math.max(0, Math.min(1, (enterProgress - 0.8) / 0.15)))
  const sigScale = sigProgress

  // Ink blot subtle animation
  const inkBlotOpacity = sigProgress * (0.06 + Math.sin(time * 2) * 0.02)

  // Exit: letter folds back
  const exitEased = easeInCubic(exitProgress)
  const exitOpacity = 1 - exitEased
  const exitRotate = exitEased * -8
  const exitScale = 1 - exitEased * 0.15

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
      {/* Desk surface texture */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          backgroundImage: 'repeating-linear-gradient(85deg, rgba(120,80,40,0.03) 0px, transparent 1px, transparent 8px)',
          pointerEvents: 'none',
        }}
      />

      {/* Letter paper */}
      <div
        style={{
          position: 'relative',
          width: 'clamp(280px, 66vw, 430px)',
          padding: 'clamp(26px, 5vw, 44px) clamp(28px, 5.5vw, 46px)',
          background: paperColor,
          transform: `rotate(${paperRotate + exitRotate}deg) scale(${paperScale * exitScale})`,
          opacity: paperOpacity * exitOpacity,
          boxShadow: '0 6px 25px rgba(0,0,0,0.2), inset 0 0 20px rgba(140,110,50,0.06)',
        }}
      >
        {/* Aged paper edge shadows */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            boxShadow: 'inset 2px 2px 8px rgba(120,80,30,0.08), inset -2px -2px 8px rgba(120,80,30,0.06)',
            pointerEvents: 'none',
          }}
        />

        {/* Fold crease lines */}
        <div
          style={{
            position: 'absolute',
            top: '33%',
            left: 0,
            right: 0,
            height: 1,
            background: `rgba(140,110,60,${0.06 + Math.sin(time) * 0.01})`,
            pointerEvents: 'none',
          }}
        />
        <div
          style={{
            position: 'absolute',
            top: '66%',
            left: 0,
            right: 0,
            height: 1,
            background: `rgba(140,110,60,${0.05 + Math.sin(time * 0.8) * 0.01})`,
            pointerEvents: 'none',
          }}
        />

        {/* Lined paper effect */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            backgroundImage: `repeating-linear-gradient(0deg, transparent, transparent 23px, rgba(180,160,120,0.08) 23px, rgba(180,160,120,0.08) 24px)`,
            pointerEvents: 'none',
          }}
        />

        {/* Date — top right */}
        <div
          style={{
            textAlign: 'right',
            fontSize: 'clamp(10px, 1.8vw, 13px)',
            color: `${inkColor}AA`,
            fontStyle: 'italic',
            marginBottom: 'clamp(16px, 3vw, 26px)',
            opacity: dateProgress,
          }}
        >
          {date}
        </div>

        {/* Greeting */}
        <div
          style={{
            fontSize: 'clamp(14px, 2.8vw, 20px)',
            fontStyle: 'italic',
            color: inkColor,
            marginBottom: 'clamp(14px, 2.8vw, 22px)',
          }}
        >
          {greeting.substring(0, greetChars)}
          {greetChars < greeting.length && (
            <span style={{ opacity: Math.sin(time * 4) > 0 ? 0.6 : 0 }}>|</span>
          )}
        </div>

        {/* Body text */}
        <div
          style={{
            fontSize: 'clamp(11px, 2vw, 15px)',
            color: `${inkColor}DD`,
            lineHeight: 1.7,
            opacity: bodyProgress,
            marginBottom: 'clamp(18px, 3.5vw, 30px)',
          }}
        >
          {body}
        </div>

        {/* Closing */}
        <div
          style={{
            fontSize: 'clamp(12px, 2.2vw, 16px)',
            fontStyle: 'italic',
            color: inkColor,
            opacity: closingProgress,
            marginBottom: 'clamp(6px, 1.2vw, 10px)',
          }}
        >
          {closing}
        </div>

        {/* Signature */}
        <div
          style={{
            fontSize: 'clamp(20px, 4.5vw, 34px)',
            fontStyle: 'italic',
            fontWeight: 700,
            color: inkColor,
            transform: `scale(${sigScale}) rotate(-3deg)`,
            transformOrigin: 'left center',
            marginLeft: 'clamp(20px, 4vw, 40px)',
          }}
        >
          {sender}
        </div>

        {/* Ink blot near signature */}
        <div
          style={{
            position: 'absolute',
            bottom: 'clamp(30px, 7%, 50px)',
            left: 'clamp(60px, 15%, 100px)',
            width: 8,
            height: 8,
            borderRadius: '50%',
            background: `radial-gradient(circle, ${inkColor}${Math.round(inkBlotOpacity * 255).toString(16).padStart(2, '0')}, transparent)`,
            pointerEvents: 'none',
          }}
        />

        {/* Corner age spots */}
        <div
          style={{
            position: 'absolute',
            top: '12%',
            right: '8%',
            width: 25,
            height: 25,
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(160,120,60,0.05) 0%, transparent 70%)',
            pointerEvents: 'none',
          }}
        />
      </div>
    </div>
  )
}

registerMotionGraphic({
  id: 'tpl-scene-vintage-letter',
  title: 'Scene Vintage Letter',
  description: 'Old letter/correspondence with unfold entrance, handwritten feel, fold creases, lined paper, ink signature, and aged paper texture',
  tags: ['scene', 'vintage', 'letter', 'retro', 'correspondence', 'handwritten', 'paper', 'ink'],
  category: 'scene-layout',
  component: SceneVintageLetterComponent as unknown as React.ComponentType<MotionGraphicProps>,
  defaultConfig: {
    greeting: 'My Dearest Friend,',
    body: 'I write to you from across the distance, hoping this letter finds you in good spirits. The world turns on, yet our memories remain steadfast.',
    closing: 'With warmest regards,',
    sender: 'Eleanor',
    date: 'March 19, 1948',
    bgColor: '#2C1A0E',
    paperColor: '#F5ECD7',
    textColor: '#3E2723',
    inkColor: '#2C1810',
  },
  configSchema: [
    { key: 'greeting', label: 'Greeting', type: 'text', defaultValue: 'My Dearest Friend,', group: 'Content' },
    { key: 'body', label: 'Body Text', type: 'text', defaultValue: 'I write to you from across the distance, hoping this letter finds you in good spirits. The world turns on, yet our memories remain steadfast.', group: 'Content' },
    { key: 'closing', label: 'Closing', type: 'text', defaultValue: 'With warmest regards,', group: 'Content' },
    { key: 'sender', label: 'Sender Name', type: 'text', defaultValue: 'Eleanor', group: 'Content' },
    { key: 'date', label: 'Date', type: 'text', defaultValue: 'March 19, 1948', group: 'Content' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#2C1A0E', group: 'Style' },
    { key: 'paperColor', label: 'Paper Color', type: 'color', defaultValue: '#F5ECD7', group: 'Style' },
    { key: 'textColor', label: 'Text Color', type: 'color', defaultValue: '#3E2723', group: 'Style' },
    { key: 'inkColor', label: 'Ink Color', type: 'color', defaultValue: '#2C1810', group: 'Style' },
  ],
})
