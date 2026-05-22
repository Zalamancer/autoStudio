import React from 'react'
import { registerMotionGraphic } from '../registry'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface SceneWeatherForecastConfig {
  city: string
  days: string
  temps: string
  conditions: string
  bgColor: string
  textColor: string
  accentColor: string
}

function easeOutCubic(t: number): number { return 1 - Math.pow(1 - t, 3) }
function easeInCubic(t: number): number { return t * t * t }

const WEATHER_ICONS: Record<string, string> = {
  sunny: '\u2600',
  cloudy: '\u2601',
  rain: '\u{1F327}',
  snow: '\u2744',
  storm: '\u26C8',
  partlycloudy: '\u26C5',
  wind: '\u{1F32C}',
  fog: '\u{1F32B}',
}

function SceneWeatherForecastComponent({ config, progress }: MotionGraphicProps<SceneWeatherForecastConfig>) {
  const { city, days, temps, conditions, bgColor, textColor, accentColor } = config

  const dayList = days.split(',').map(s => s.trim())
  const tempList = temps.split(',').map(s => s.trim())
  const condList = conditions.split(',').map(s => s.trim().toLowerCase())

  const enterProgress = progress < 0.2 ? progress / 0.2 : 1
  const holdProgress = progress >= 0.2 && progress < 0.8 ? (progress - 0.2) / 0.6 : progress >= 0.8 ? 1 : 0
  const exitProgress = progress >= 0.8 ? (progress - 0.8) / 0.2 : 0

  const exitOpacity = exitProgress > 0 ? 1 - easeInCubic(exitProgress) : 1
  const titleEnter = easeOutCubic(Math.min(1, enterProgress / 0.4))

  const getDayProgress = (index: number): number => {
    const start = 0.2 + index * 0.12
    return easeOutCubic(Math.max(0, Math.min(1, (enterProgress - start) / 0.5)))
  }

  return (
    <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', fontFamily: "'Inter', 'Helvetica Neue', sans-serif" }}>
      <div style={{ position: 'absolute', inset: 0, background: bgColor }} />

      {/* Animated gradient overlay */}
      <div style={{
        position: 'absolute',
        inset: 0,
        background: `linear-gradient(135deg, ${accentColor}15 0%, transparent 50%, ${accentColor}10 100%)`,
      }} />

      <div style={{
        position: 'absolute',
        inset: 0,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        padding: '6% 5%',
        opacity: exitOpacity,
      }}>
        {/* City name */}
        <div style={{
          fontSize: 'clamp(12px, 2.2vw, 18px)',
          fontWeight: 600,
          color: accentColor,
          textTransform: 'uppercase',
          letterSpacing: '0.15em',
          opacity: titleEnter,
          transform: `translateY(${(1 - titleEnter) * -15}px)`,
          marginBottom: 'clamp(2px, 0.5vh, 6px)',
        }}>
          {city}
        </div>

        {/* Title */}
        <div style={{
          fontSize: 'clamp(20px, 5vw, 40px)',
          fontWeight: 800,
          color: textColor,
          opacity: titleEnter,
          transform: `translateY(${(1 - titleEnter) * -10}px)`,
          marginBottom: 'clamp(16px, 3vh, 32px)',
          letterSpacing: '-0.02em',
        }}>
          5-Day Forecast
        </div>

        {/* Forecast cards */}
        <div style={{
          display: 'flex',
          gap: 'clamp(6px, 1.5vw, 14px)',
          justifyContent: 'center',
          flexWrap: 'wrap',
          width: '100%',
          maxWidth: '90%',
        }}>
          {dayList.slice(0, 5).map((day, i) => {
            const dayProg = getDayProgress(i)
            const icon = WEATHER_ICONS[condList[i]] || WEATHER_ICONS.sunny
            const temp = tempList[i] || '72'
            const condLabel = condList[i] || 'sunny'

            // Pulse the current day highlight
            const isToday = i === 0
            const todayGlow = isToday && progress >= 0.2 && progress < 0.8
              ? 0.08 + Math.sin(holdProgress * Math.PI * 4) * 0.04
              : 0

            return (
              <div
                key={i}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: 'clamp(4px, 0.8vh, 10px)',
                  padding: 'clamp(8px, 1.5vw, 16px)',
                  borderRadius: 'clamp(8px, 1.5vw, 14px)',
                  background: `${accentColor}${isToday ? '20' : '0D'}`,
                  border: `1px solid ${accentColor}${isToday ? '40' : '15'}`,
                  boxShadow: todayGlow > 0 ? `0 0 20px ${accentColor}${Math.round(todayGlow * 255).toString(16).padStart(2, '0')}` : undefined,
                  opacity: dayProg,
                  transform: `translateY(${(1 - dayProg) * 20}px) scale(${0.9 + dayProg * 0.1})`,
                  minWidth: 'clamp(50px, 12vw, 80px)',
                  flex: '1 1 0',
                  maxWidth: 'clamp(60px, 16vw, 100px)',
                }}
              >
                <div style={{
                  fontSize: 'clamp(10px, 1.8vw, 14px)',
                  fontWeight: 700,
                  color: isToday ? accentColor : `${textColor}88`,
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                }}>
                  {day}
                </div>
                <div style={{ fontSize: 'clamp(22px, 5vw, 38px)' }}>
                  {icon}
                </div>
                <div style={{
                  fontSize: 'clamp(16px, 3.5vw, 28px)',
                  fontWeight: 800,
                  color: textColor,
                  fontVariantNumeric: 'tabular-nums',
                }}>
                  {temp}°
                </div>
                <div style={{
                  fontSize: 'clamp(8px, 1.4vw, 11px)',
                  fontWeight: 500,
                  color: `${textColor}66`,
                  textTransform: 'capitalize',
                }}>
                  {condLabel}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

registerMotionGraphic({
  id: 'tpl-scene-weather-forecast',
  title: 'Weather Forecast',
  description: '5-day weather forecast display with animated cards, condition icons, and temperature readings',
  tags: ['scene', 'weather', 'forecast', 'temperature', 'climate', 'data'],
  category: 'scene-layout',
  component: SceneWeatherForecastComponent as any,
  defaultConfig: {
    city: 'New York',
    days: 'Mon,Tue,Wed,Thu,Fri',
    temps: '72,68,65,70,74',
    conditions: 'sunny,partlycloudy,rain,cloudy,sunny',
    bgColor: '#0c1220',
    textColor: '#e2e8f0',
    accentColor: '#4a9eff',
  },
  configSchema: [
    { key: 'city', label: 'City', type: 'text', defaultValue: 'New York', group: 'Content' },
    { key: 'days', label: 'Days (comma-separated)', type: 'text', defaultValue: 'Mon,Tue,Wed,Thu,Fri', group: 'Content' },
    { key: 'temps', label: 'Temperatures (comma-separated)', type: 'text', defaultValue: '72,68,65,70,74', group: 'Content' },
    { key: 'conditions', label: 'Conditions (sunny/cloudy/rain/snow/storm/partlycloudy/wind/fog)', type: 'text', defaultValue: 'sunny,partlycloudy,rain,cloudy,sunny', group: 'Content' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#0c1220', group: 'Style' },
    { key: 'textColor', label: 'Text Color', type: 'color', defaultValue: '#e2e8f0', group: 'Style' },
    { key: 'accentColor', label: 'Accent Color', type: 'color', defaultValue: '#4a9eff', group: 'Style' },
  ],
})
