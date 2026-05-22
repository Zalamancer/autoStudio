import React from 'react'
import { registerMotionGraphic } from '../registry'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface AffirmationConfig {
  affirmation: string
  bgColor1: string
  bgColor2: string
  textColor: string
  accentColor: string
}

function easeOutCubic(t: number): number { return 1 - Math.pow(1 - t, 3) }
function easeInCubic(t: number): number { return t * t * t }
function easeOutQuad(t: number): number { return 1 - (1 - t) * (1 - t) }

function SceneAffirmationComponent({ config, progress }: MotionGraphicProps<AffirmationConfig>) {
  const { affirmation, bgColor1, bgColor2, textColor, accentColor } = config

  const enterProgress = progress < 0.3 ? progress / 0.3 : 1
  const holdProgress = progress >= 0.3 && progress < 0.8 ? (progress - 0.3) / 0.5 : 0
  const exitProgress = progress >= 0.8 ? (progress - 0.8) / 0.2 : 0

  const exitEased = easeInCubic(exitProgress)
  const exitOpacity = exitProgress > 0 ? 1 - exitEased : 1

  // Gradient angle animates gently
  const gradAngle = 135 + holdProgress * 30 + enterProgress * 15

  // Decorative circles float in
  const circle1Enter = easeOutCubic(Math.min(1, enterProgress / 0.4))
  const circle2Enter = easeOutCubic(Math.max(0, Math.min(1, (enterProgress - 0.1) / 0.4)))
  const circle3Enter = easeOutCubic(Math.max(0, Math.min(1, (enterProgress - 0.2) / 0.4)))

  // Circle drift during hold
  const drift1X = Math.sin(holdProgress * Math.PI * 3) * 8
  const drift1Y = Math.cos(holdProgress * Math.PI * 2) * 6
  const drift2X = Math.cos(holdProgress * Math.PI * 4) * 10
  const drift2Y = Math.sin(holdProgress * Math.PI * 3) * 5
  const drift3X = Math.sin(holdProgress * Math.PI * 2.5) * 6
  const drift3Y = Math.cos(holdProgress * Math.PI * 3.5) * 8

  // Top label
  const labelEnter = easeOutCubic(Math.max(0, Math.min(1, (enterProgress - 0.2) / 0.25)))

  // Word-by-word reveal
  const words = affirmation.split(/\s+/)
  const wordStart = 0.3
  const wordReveal = Math.max(0, Math.min(1, (enterProgress - wordStart) / (1 - wordStart)))
  const visibleWords = Math.ceil(easeOutQuad(wordReveal) * words.length)

  // Decorative line under
  const lineEnter = easeOutCubic(Math.max(0, Math.min(1, (enterProgress - 0.7) / 0.3)))

  // Gentle text scale breathing during hold
  const textBreath = 1 + Math.sin(holdProgress * Math.PI * 4) * 0.012

  return (
    <div style={{ position: 'absolute', inset: 0, overflow: 'hidden' }}>
      {/* Gradient background */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: `linear-gradient(${gradAngle}deg, ${bgColor1}, ${bgColor2})`,
        }}
      />

      {/* Decorative circles */}
      <div
        style={{
          position: 'absolute',
          top: '10%',
          right: '5%',
          width: 'clamp(80px, 20vw, 200px)',
          height: 'clamp(80px, 20vw, 200px)',
          borderRadius: '50%',
          background: `${accentColor}08`,
          border: `1px solid ${accentColor}12`,
          transform: `translate(${drift1X}px, ${drift1Y}px) scale(${circle1Enter})`,
        }}
      />
      <div
        style={{
          position: 'absolute',
          bottom: '15%',
          left: '3%',
          width: 'clamp(60px, 15vw, 150px)',
          height: 'clamp(60px, 15vw, 150px)',
          borderRadius: '50%',
          background: `${accentColor}06`,
          border: `1px solid ${accentColor}10`,
          transform: `translate(${drift2X}px, ${drift2Y}px) scale(${circle2Enter})`,
        }}
      />
      <div
        style={{
          position: 'absolute',
          top: '40%',
          left: '65%',
          width: 'clamp(40px, 10vw, 100px)',
          height: 'clamp(40px, 10vw, 100px)',
          borderRadius: '50%',
          background: `${accentColor}05`,
          border: `1px solid ${accentColor}08`,
          transform: `translate(${drift3X}px, ${drift3Y}px) scale(${circle3Enter})`,
        }}
      />

      {/* Content */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '10% 10%',
          opacity: exitOpacity,
          transform: `scale(${exitProgress > 0 ? 1 - exitEased * 0.1 : 1})`,
        }}
      >
        {/* Label */}
        <div
          style={{
            fontSize: 'clamp(10px, 1.8vw, 15px)',
            fontWeight: 600,
            color: accentColor,
            textTransform: 'uppercase',
            letterSpacing: '0.2em',
            opacity: labelEnter,
            transform: `translateY(${(1 - labelEnter) * -12}px)`,
            marginBottom: 'clamp(16px, 3vh, 32px)',
            fontFamily: "'Inter', 'Helvetica Neue', sans-serif",
          }}
        >
          Daily Affirmation
        </div>

        {/* Affirmation text */}
        <div
          style={{
            fontSize: 'clamp(20px, 5.5vw, 48px)',
            fontWeight: 300,
            color: textColor,
            lineHeight: 1.5,
            textAlign: 'center',
            maxWidth: '85%',
            fontFamily: "'Georgia', 'Times New Roman', serif",
            transform: `scale(${textBreath})`,
          }}
        >
          {words.map((word, i) => (
            <span
              key={i}
              style={{
                display: 'inline-block',
                opacity: i < visibleWords ? 1 : 0,
                transform: i < visibleWords ? 'translateY(0)' : 'translateY(10px)',
                marginRight: '0.3em',
              }}
            >
              {word}
            </span>
          ))}
        </div>

        {/* Decorative line */}
        <div
          style={{
            width: 'clamp(40px, 8vw, 80px)',
            height: 2,
            background: accentColor,
            marginTop: 'clamp(20px, 3vh, 36px)',
            opacity: lineEnter * 0.6,
            transform: `scaleX(${lineEnter})`,
          }}
        />
      </div>
    </div>
  )
}

registerMotionGraphic({
  id: 'tpl-scene-affirmation',
  title: 'Affirmation',
  description: 'Daily affirmation with soft gradient background, gentle word-by-word text reveal, and floating decorative elements',
  tags: ['scene', 'affirmation', 'mindfulness', 'lifestyle', 'personal', 'motivation'],
  category: 'scene-layout',
  component: SceneAffirmationComponent as any,
  defaultConfig: {
    affirmation: 'I am worthy of love, success, and all the beautiful things life has to offer.',
    bgColor1: '#1a1a2e',
    bgColor2: '#16213e',
    textColor: '#f0ead6',
    accentColor: '#c9a96e',
  },
  configSchema: [
    { key: 'affirmation', label: 'Affirmation', type: 'text', defaultValue: 'I am worthy of love, success, and all the beautiful things life has to offer.', group: 'Content' },
    { key: 'bgColor1', label: 'Gradient Start', type: 'color', defaultValue: '#1a1a2e', group: 'Style' },
    { key: 'bgColor2', label: 'Gradient End', type: 'color', defaultValue: '#16213e', group: 'Style' },
    { key: 'textColor', label: 'Text Color', type: 'color', defaultValue: '#f0ead6', group: 'Style' },
    { key: 'accentColor', label: 'Accent Color', type: 'color', defaultValue: '#c9a96e', group: 'Style' },
  ],
})
