import React from 'react'
import { registerMotionGraphic } from '../registry'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface SceneSeasonalGreetingConfig {
  greeting: string
  message: string
  fromName: string
  season: 'spring' | 'summer' | 'autumn' | 'winter'
  bgColor: string
  cardColor: string
  accentColor: string
  textColor: string
}

function easeOutCubic(t: number): number { return 1 - Math.pow(1 - t, 3) }
function easeInCubic(t: number): number { return t * t * t }
function easeOutBack(t: number): number {
  const c1 = 1.70158; const c3 = c1 + 1
  return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2)
}

function seededRandom(seed: number): number {
  return ((Math.sin(seed * 127.1 + 311.7) * 43758.5453) % 1 + 1) % 1
}

const seasonData = {
  spring: { icon: '🌸', particles: '🌷', gradient: 'linear-gradient(180deg, #FFE4F0, #FFF0F5, #FFF8FC)' },
  summer: { icon: '☀️', particles: '🌻', gradient: 'linear-gradient(180deg, #FFF7E0, #FFFBF0, #FFFFF5)' },
  autumn: { icon: '🍂', particles: '🍁', gradient: 'linear-gradient(180deg, #FFF0E0, #FFF5EA, #FFFAF5)' },
  winter: { icon: '❄️', particles: '✨', gradient: 'linear-gradient(180deg, #E8F0FF, #F0F5FF, #F8FAFF)' },
}

function SceneSeasonalGreetingComponent({ config, frame, durationInFrames }: MotionGraphicProps<SceneSeasonalGreetingConfig>) {
  const { greeting, message, fromName, season, bgColor, cardColor, accentColor, textColor } = config
  const progress = frame / durationInFrames
  const fps = 30
  const timeS = frame / fps

  const enterProgress = Math.min(1, progress / 0.22)
  const holdProgress = progress >= 0.22 && progress < 0.8 ? (progress - 0.22) / 0.58 : 0
  const exitProgress = progress >= 0.8 ? (progress - 0.8) / 0.2 : 0

  const exitEased = easeInCubic(exitProgress)
  const exitOpacity = 1 - exitEased

  const sData = seasonData[season] || seasonData.spring

  // Falling particles
  const particles = Array.from({ length: 12 }, (_, i) => {
    const x = seededRandom(i * 73 + 11) * 100
    const speed = 0.5 + seededRandom(i * 47) * 0.8
    const y = ((timeS * speed * 25 + seededRandom(i * 31) * 200) % 130) - 15
    const wobble = Math.sin(timeS * 1.5 + i * 1.3) * 8
    const rotation = timeS * (30 + i * 10) * ((i % 2) * 2 - 1)
    const alpha = 0.3 + seededRandom(i * 59) * 0.3
    const size = 10 + seededRandom(i * 41) * 8
    return { x: x + wobble, y, rotation, alpha, size }
  })

  // Card entrance — envelope opening
  const cardEnter = easeOutBack(Math.min(1, enterProgress / 0.5))
  const cardY = (1 - cardEnter) * 150
  const cardRotate = (1 - cardEnter) * -5

  // Content reveals
  const iconReveal = easeOutBack(Math.max(0, Math.min(1, (enterProgress - 0.2) / 0.3)))
  const greetingReveal = easeOutCubic(Math.max(0, Math.min(1, (enterProgress - 0.3) / 0.3)))
  const messageReveal = easeOutCubic(Math.max(0, Math.min(1, (enterProgress - 0.45) / 0.3)))
  const fromReveal = easeOutCubic(Math.max(0, Math.min(1, (enterProgress - 0.6) / 0.3)))

  // Decorative border animation
  const borderProgress = easeOutCubic(Math.max(0, Math.min(1, (enterProgress - 0.1) / 0.5)))

  // Gentle float during hold
  const floatY = holdProgress > 0 ? Math.sin(holdProgress * Math.PI * 5) * 4 : 0

  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        overflow: 'hidden',
        background: bgColor,
        fontFamily: "'Georgia', 'Palatino', serif",
      }}
    >
      {/* Season gradient overlay */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: sData.gradient,
          opacity: 0.3,
        }}
      />

      {/* Falling particles */}
      {particles.map((p, i) => (
        <div
          key={i}
          style={{
            position: 'absolute',
            left: `${p.x}%`,
            top: `${p.y}%`,
            fontSize: p.size,
            transform: `rotate(${p.rotation}deg)`,
            opacity: p.alpha * exitOpacity,
            pointerEvents: 'none',
          }}
        >
          {sData.particles}
        </div>
      ))}

      <div
        style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '8%',
        }}
      >
        {/* Greeting card */}
        <div
          style={{
            width: '100%',
            maxWidth: 400,
            background: cardColor,
            borderRadius: 'clamp(16px, 3vw, 28px)',
            padding: 'clamp(24px, 5.5vw, 48px)',
            boxShadow: '0 12px 40px rgba(0,0,0,0.08)',
            textAlign: 'center',
            transform: `translateY(${cardY + exitEased * -80 + floatY}px) rotate(${cardRotate}deg)`,
            opacity: cardEnter * exitOpacity,
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          {/* Decorative border */}
          <div
            style={{
              position: 'absolute',
              inset: 'clamp(6px, 1.2vw, 10px)',
              border: `2px solid ${accentColor}25`,
              borderRadius: 'clamp(10px, 2vw, 18px)',
              opacity: borderProgress,
            }}
          />

          {/* Corner flourishes */}
          {[
            { top: 'clamp(10px, 2vw, 16px)', left: 'clamp(10px, 2vw, 16px)' },
            { top: 'clamp(10px, 2vw, 16px)', right: 'clamp(10px, 2vw, 16px)' },
            { bottom: 'clamp(10px, 2vw, 16px)', left: 'clamp(10px, 2vw, 16px)' },
            { bottom: 'clamp(10px, 2vw, 16px)', right: 'clamp(10px, 2vw, 16px)' },
          ].map((pos, i) => (
            <div
              key={`corner-${i}`}
              style={{
                position: 'absolute',
                ...pos,
                width: 'clamp(6px, 1.2vw, 10px)',
                height: 'clamp(6px, 1.2vw, 10px)',
                borderRadius: '50%',
                background: accentColor,
                opacity: borderProgress * 0.3,
              }}
            />
          ))}

          {/* Season icon */}
          <div
            style={{
              fontSize: 'clamp(36px, 8vw, 64px)',
              marginBottom: 'clamp(10px, 2vw, 18px)',
              transform: `scale(${iconReveal})`,
            }}
          >
            {sData.icon}
          </div>

          {/* Greeting */}
          <div
            style={{
              fontSize: 'clamp(24px, 6vw, 44px)',
              fontWeight: 700,
              color: textColor,
              lineHeight: 1.2,
              opacity: greetingReveal,
              transform: `translateY(${(1 - greetingReveal) * 20}px)`,
              marginBottom: 'clamp(8px, 1.5vw, 14px)',
            }}
          >
            {greeting}
          </div>

          {/* Decorative line */}
          <div
            style={{
              width: 'clamp(30px, 8vw, 60px)',
              height: 2,
              background: accentColor,
              margin: '0 auto',
              marginBottom: 'clamp(10px, 2vw, 18px)',
              opacity: greetingReveal,
              borderRadius: 1,
            }}
          />

          {/* Message */}
          <div
            style={{
              fontFamily: "'Georgia', 'Palatino', serif",
              fontSize: 'clamp(12px, 2.2vw, 18px)',
              fontWeight: 400,
              fontStyle: 'italic',
              color: `${textColor}bb`,
              lineHeight: 1.6,
              opacity: messageReveal,
              transform: `translateY(${(1 - messageReveal) * 12}px)`,
              marginBottom: 'clamp(14px, 3vw, 24px)',
              padding: '0 5%',
            }}
          >
            {message}
          </div>

          {/* From */}
          <div
            style={{
              fontSize: 'clamp(11px, 1.8vw, 15px)',
              fontWeight: 600,
              color: accentColor,
              opacity: fromReveal,
              transform: `translateY(${(1 - fromReveal) * 10}px)`,
            }}
          >
            — {fromName}
          </div>
        </div>
      </div>
    </div>
  )
}

registerMotionGraphic({
  id: 'tpl-scene-seasonal-greeting',
  title: 'Seasonal Greeting',
  description: 'Adaptable seasonal greeting card with falling particles, decorative border, corner flourishes, and season-specific theming',
  tags: ['scene', 'seasonal', 'greeting', 'holiday', 'card', 'spring', 'summer', 'autumn', 'winter'],
  category: 'scene-layout',
  component: SceneSeasonalGreetingComponent as unknown as React.ComponentType<MotionGraphicProps>,
  defaultConfig: {
    greeting: 'Happy Holidays',
    message: 'Wishing you warmth, joy, and all the best this season has to offer.',
    fromName: 'The Smith Family',
    season: 'winter' as const,
    bgColor: '#F0F4FF',
    cardColor: '#FFFFFF',
    accentColor: '#6366F1',
    textColor: '#1E293B',
  },
  configSchema: [
    { key: 'greeting', label: 'Greeting', type: 'text', defaultValue: 'Happy Holidays', group: 'Content' },
    { key: 'message', label: 'Message', type: 'text', defaultValue: 'Wishing you warmth, joy, and all the best this season has to offer.', group: 'Content' },
    { key: 'fromName', label: 'From', type: 'text', defaultValue: 'The Smith Family', group: 'Content' },
    { key: 'season', label: 'Season', type: 'text', defaultValue: 'winter', group: 'Content' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#F0F4FF', group: 'Style' },
    { key: 'cardColor', label: 'Card Color', type: 'color', defaultValue: '#FFFFFF', group: 'Style' },
    { key: 'accentColor', label: 'Accent Color', type: 'color', defaultValue: '#6366F1', group: 'Style' },
    { key: 'textColor', label: 'Text Color', type: 'color', defaultValue: '#1E293B', group: 'Style' },
  ],
})
