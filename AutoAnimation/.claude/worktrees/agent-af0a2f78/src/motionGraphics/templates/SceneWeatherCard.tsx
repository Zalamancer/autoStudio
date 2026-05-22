import React from 'react'
import { registerMotionGraphic } from '../registry'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface WeatherCardConfig {
  city: string
  temperature: number
  condition: string
  conditionEmoji: string
  highTemp: number
  lowTemp: number
  bgColor: string
  cardColor: string
  accentColor: string
  textColor: string
}

function easeOutCubic(t: number): number { return 1 - Math.pow(1 - t, 3) }
function easeInCubic(t: number): number { return t * t * t }
function easeOutBack(t: number): number {
  const c1 = 1.70158
  const c3 = c1 + 1
  return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2)
}

function SceneWeatherCardComponent({
  config,
  progress,
}: MotionGraphicProps<WeatherCardConfig>) {
  const { city, temperature, condition, conditionEmoji, highTemp, lowTemp, bgColor, cardColor, accentColor, textColor } = config

  const enterEnd = 0.25
  const holdEnd = 0.8
  const enterProgress = Math.min(1, progress / enterEnd)
  const holdProgress = progress >= enterEnd && progress < holdEnd
    ? (progress - enterEnd) / (holdEnd - enterEnd) : progress >= holdEnd ? 1 : 0
  const exitProgress = progress >= holdEnd ? (progress - holdEnd) / (1 - holdEnd) : 0

  // Card slides in from left
  const cardEnter = easeOutBack(Math.min(1, enterProgress / 0.5))
  const cardX = (1 - cardEnter) * -120
  const cardOpacity = easeOutCubic(Math.min(1, enterProgress / 0.3))

  // Temperature counts up
  const tempDelay = 0.3
  const tempEnter = Math.max(0, Math.min(1, (enterProgress - tempDelay) / (1 - tempDelay)))
  const tempEased = easeOutCubic(tempEnter)
  const displayTemp = Math.round(temperature * tempEased)

  // City name fades in
  const cityDelay = 0.2
  const cityEnter = Math.max(0, Math.min(1, (enterProgress - cityDelay) / 0.5))
  const cityOpacity = easeOutCubic(cityEnter)

  // Condition text fades in
  const condDelay = 0.45
  const condEnter = Math.max(0, Math.min(1, (enterProgress - condDelay) / (1 - condDelay)))
  const condOpacity = easeOutCubic(condEnter)

  // High/Low fades in
  const hlDelay = 0.6
  const hlEnter = Math.max(0, Math.min(1, (enterProgress - hlDelay) / (1 - hlDelay)))
  const hlOpacity = easeOutCubic(hlEnter)
  const hlY = (1 - easeOutCubic(hlEnter)) * 12

  // Emoji float during hold
  const emojiFloat = holdProgress > 0 ? Math.sin(holdProgress * Math.PI * 4) * 6 : 0
  const emojiDelay = 0.5
  const emojiEnter = Math.max(0, Math.min(1, (enterProgress - emojiDelay) / (1 - emojiDelay)))
  const emojiScale = easeOutBack(emojiEnter)

  // Exit: slides down
  const exitEased = easeInCubic(exitProgress)
  const exitY = exitEased * 120
  const exitOpacity = 1 - exitEased

  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        overflow: 'hidden',
        background: bgColor,
        fontFamily: "'Inter', 'SF Pro Display', 'Helvetica Neue', sans-serif",
      }}
    >
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
        {/* Weather card */}
        <div
          style={{
            background: cardColor,
            borderRadius: 'clamp(16px, 3vw, 28px)',
            padding: 'clamp(24px, 5vw, 48px)',
            width: '100%',
            maxWidth: 400,
            transform: `translateX(${cardX}px) translateY(${exitY}px)`,
            opacity: cardOpacity * exitOpacity,
            boxShadow: '0 8px 40px rgba(0,0,0,0.3), 0 2px 8px rgba(0,0,0,0.15)',
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          {/* Subtle gradient overlay */}
          <div
            style={{
              position: 'absolute',
              top: 0,
              right: 0,
              width: '60%',
              height: '60%',
              background: `radial-gradient(circle at top right, ${accentColor}15, transparent)`,
              borderRadius: 'inherit',
            }}
          />

          {/* City name */}
          <div
            style={{
              fontSize: 'clamp(14px, 2.5vw, 22px)',
              fontWeight: 600,
              color: `${textColor}cc`,
              opacity: cityOpacity,
              marginBottom: 'clamp(4px, 0.8vw, 8px)',
              letterSpacing: '0.02em',
              position: 'relative',
            }}
          >
            {city}
          </div>

          {/* Temperature + emoji row */}
          <div
            style={{
              display: 'flex',
              alignItems: 'flex-start',
              justifyContent: 'space-between',
              marginBottom: 'clamp(6px, 1.2vw, 14px)',
              position: 'relative',
            }}
          >
            {/* Large temperature */}
            <div
              style={{
                fontSize: 'clamp(48px, 12vw, 96px)',
                fontWeight: 200,
                color: textColor,
                lineHeight: 1,
                letterSpacing: '-0.03em',
              }}
            >
              {displayTemp}
              <span
                style={{
                  fontSize: '0.4em',
                  fontWeight: 300,
                  verticalAlign: 'super',
                  color: accentColor,
                }}
              >
                °
              </span>
            </div>

            {/* Condition emoji */}
            <div
              style={{
                fontSize: 'clamp(36px, 8vw, 64px)',
                transform: `scale(${emojiScale}) translateY(${emojiFloat}px)`,
                lineHeight: 1,
              }}
            >
              {conditionEmoji}
            </div>
          </div>

          {/* Condition text */}
          <div
            style={{
              fontSize: 'clamp(13px, 2.2vw, 20px)',
              fontWeight: 500,
              color: `${textColor}bb`,
              opacity: condOpacity,
              marginBottom: 'clamp(12px, 2.5vw, 24px)',
              position: 'relative',
            }}
          >
            {condition}
          </div>

          {/* Divider line */}
          <div
            style={{
              height: 1,
              background: `${textColor}18`,
              marginBottom: 'clamp(10px, 2vw, 20px)',
            }}
          />

          {/* High / Low row */}
          <div
            style={{
              display: 'flex',
              gap: 'clamp(16px, 3vw, 32px)',
              opacity: hlOpacity,
              transform: `translateY(${hlY}px)`,
              position: 'relative',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 'clamp(4px, 0.8vw, 8px)' }}>
              <span style={{ fontSize: 'clamp(10px, 1.4vw, 13px)', color: '#ef4444', fontWeight: 700 }}>H</span>
              <span style={{ fontSize: 'clamp(14px, 2.2vw, 20px)', fontWeight: 600, color: textColor }}>
                {Math.round(highTemp * tempEased)}°
              </span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 'clamp(4px, 0.8vw, 8px)' }}>
              <span style={{ fontSize: 'clamp(10px, 1.4vw, 13px)', color: '#3b82f6', fontWeight: 700 }}>L</span>
              <span style={{ fontSize: 'clamp(14px, 2.2vw, 20px)', fontWeight: 600, color: textColor }}>
                {Math.round(lowTemp * tempEased)}°
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

registerMotionGraphic({
  id: 'tpl-scene-weather-card',
  title: 'Weather Forecast Card',
  description: 'Clean modern weather forecast card with animated temperature counter, condition emoji, high/low temps, and smooth slide-in animation',
  tags: ['scene', 'weather', 'forecast', 'temperature', 'media', 'card', 'broadcast'],
  category: 'scene-layout',
  component: SceneWeatherCardComponent as any,
  defaultConfig: {
    city: 'San Francisco',
    temperature: 72,
    condition: 'Mostly Sunny',
    conditionEmoji: '\u2600\uFE0F',
    highTemp: 78,
    lowTemp: 58,
    bgColor: '#0c1220',
    cardColor: '#1a2236',
    accentColor: '#f59e0b',
    textColor: '#FFFFFF',
  },
  configSchema: [
    { key: 'city', label: 'City', type: 'text', defaultValue: 'San Francisco', group: 'Content' },
    { key: 'temperature', label: 'Temperature', type: 'number', defaultValue: 72, min: -50, max: 150, group: 'Content' },
    { key: 'condition', label: 'Condition', type: 'text', defaultValue: 'Mostly Sunny', group: 'Content' },
    { key: 'conditionEmoji', label: 'Emoji', type: 'text', defaultValue: '\u2600\uFE0F', group: 'Content' },
    { key: 'highTemp', label: 'High Temp', type: 'number', defaultValue: 78, min: -50, max: 150, group: 'Content' },
    { key: 'lowTemp', label: 'Low Temp', type: 'number', defaultValue: 58, min: -50, max: 150, group: 'Content' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#0c1220', group: 'Style' },
    { key: 'cardColor', label: 'Card Color', type: 'color', defaultValue: '#1a2236', group: 'Style' },
    { key: 'accentColor', label: 'Accent Color', type: 'color', defaultValue: '#f59e0b', group: 'Style' },
    { key: 'textColor', label: 'Text Color', type: 'color', defaultValue: '#FFFFFF', group: 'Style' },
  ],
})
