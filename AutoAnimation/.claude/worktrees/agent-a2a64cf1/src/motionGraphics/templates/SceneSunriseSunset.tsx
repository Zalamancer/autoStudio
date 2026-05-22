import React from 'react'
import { registerMotionGraphic } from '../registry'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface SceneSunriseSunsetConfig {
  sunriseTime: string
  sunsetTime: string
  dayLength: string
  currentTime: string
  location: string
  bgColor: string
  textColor: string
}

function easeOutCubic(t: number): number { return 1 - Math.pow(1 - t, 3) }
function easeInCubic(t: number): number { return t * t * t }

function SceneSunriseSunsetComponent({ config, progress }: MotionGraphicProps<SceneSunriseSunsetConfig>) {
  const { sunriseTime, sunsetTime, dayLength, currentTime, location, bgColor, textColor } = config

  const enterProgress = progress < 0.25 ? progress / 0.25 : 1
  const holdProgress = progress >= 0.25 && progress < 0.8 ? (progress - 0.25) / 0.55 : progress >= 0.8 ? 1 : 0
  const exitProgress = progress >= 0.8 ? (progress - 0.8) / 0.2 : 0

  const exitOpacity = exitProgress > 0 ? 1 - easeInCubic(exitProgress) : 1
  const enterEased = easeOutCubic(enterProgress)

  // Sun arc animation
  const svgW = 300
  const svgH = 150
  const arcCenterX = svgW / 2
  const arcCenterY = svgH - 20
  const arcRadius = 110

  // Sun position along the arc (0 = sunrise, 1 = sunset)
  const sunPosition = Math.min(1, enterEased * 0.65 + (progress >= 0.25 ? holdProgress * 0.35 : 0))
  const sunAngle = Math.PI + sunPosition * Math.PI
  const sunX = arcCenterX + Math.cos(sunAngle) * arcRadius
  const sunY = arcCenterY + Math.sin(sunAngle) * arcRadius

  // Sun glow pulse
  const sunGlow = progress >= 0.25 && progress < 0.8
    ? 1 + Math.sin(holdProgress * Math.PI * 3) * 0.15
    : 1

  // Sky gradient based on sun position
  const skyHue = 200 + sunPosition * 30
  const skySat = 60 - sunPosition * 20
  const skyLight = 15 + sunPosition * 15

  // Arc path (semicircle above horizon)
  const arcPath = `M ${arcCenterX - arcRadius} ${arcCenterY} A ${arcRadius} ${arcRadius} 0 0 1 ${arcCenterX + arcRadius} ${arcCenterY}`
  const arcLen = Math.PI * arcRadius
  const drawnArc = arcLen * enterEased

  return (
    <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', fontFamily: "'Inter', 'Helvetica Neue', sans-serif" }}>
      {/* Dynamic sky gradient */}
      <div style={{
        position: 'absolute',
        inset: 0,
        background: `linear-gradient(180deg,
          hsl(${skyHue}, ${skySat}%, ${skyLight}%) 0%,
          hsl(${skyHue + 20}, ${skySat + 10}%, ${skyLight + 8}%) 40%,
          hsl(30, 70%, ${25 + sunPosition * 15}%) 70%,
          hsl(15, 60%, ${15 + sunPosition * 10}%) 100%)`,
      }} />

      {/* Horizon glow */}
      <div style={{
        position: 'absolute',
        left: 0,
        right: 0,
        bottom: '20%',
        height: '30%',
        background: `radial-gradient(ellipse at 50% 100%,
          rgba(255,180,80,${0.15 + sunPosition * 0.1}),
          transparent 70%)`,
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
        {/* Location */}
        <div style={{
          fontSize: 'clamp(10px, 1.8vw, 14px)',
          fontWeight: 600,
          color: `${textColor}77`,
          textTransform: 'uppercase',
          letterSpacing: '0.12em',
          opacity: enterEased,
          marginBottom: 'clamp(6px, 1vh, 12px)',
        }}>
          {location}
        </div>

        {/* Sun arc */}
        <div style={{
          opacity: enterEased,
          marginBottom: 'clamp(12px, 2.5vh, 24px)',
        }}>
          <svg viewBox={`0 0 ${svgW} ${svgH}`}
            style={{ width: 'clamp(200px, 55vw, 360px)', height: 'clamp(100px, 28vw, 180px)' }}
          >
            {/* Dashed arc path */}
            <path d={arcPath} fill="none" stroke={`${textColor}20`}
              strokeWidth={1.5} strokeDasharray="6,4" />

            {/* Drawn arc */}
            <path d={arcPath} fill="none" stroke="#FFB84D"
              strokeWidth={2} strokeLinecap="round"
              strokeDasharray={arcLen} strokeDashoffset={arcLen - drawnArc}
              opacity={0.6} />

            {/* Horizon line */}
            <line x1={arcCenterX - arcRadius - 20} y1={arcCenterY}
              x2={arcCenterX + arcRadius + 20} y2={arcCenterY}
              stroke={`${textColor}25`} strokeWidth={1.5} />

            {/* Sun */}
            <circle cx={sunX} cy={sunY} r={14}
              fill="#FFD700" opacity={0.9}
              style={{ filter: `drop-shadow(0 0 ${8 * sunGlow}px rgba(255,200,50,0.6))` }} />
            <circle cx={sunX} cy={sunY} r={20}
              fill="none" stroke="#FFD700" strokeWidth={1} opacity={0.3 * sunGlow} />

            {/* Sunrise marker */}
            <circle cx={arcCenterX - arcRadius} cy={arcCenterY} r={4}
              fill="#FFB84D" opacity={0.7} />
            <text x={arcCenterX - arcRadius} y={arcCenterY + 16}
              textAnchor="middle" fill={textColor} fontSize={10} fontWeight={600}
              opacity={0.7}>{sunriseTime}</text>

            {/* Sunset marker */}
            <circle cx={arcCenterX + arcRadius} cy={arcCenterY} r={4}
              fill="#E06030" opacity={0.7} />
            <text x={arcCenterX + arcRadius} y={arcCenterY + 16}
              textAnchor="middle" fill={textColor} fontSize={10} fontWeight={600}
              opacity={0.7}>{sunsetTime}</text>
          </svg>
        </div>

        {/* Time cards */}
        <div style={{
          display: 'flex',
          gap: 'clamp(12px, 3vw, 28px)',
          opacity: easeOutCubic(Math.max(0, (enterProgress - 0.3) / 0.7)),
          transform: `translateY(${(1 - easeOutCubic(Math.max(0, (enterProgress - 0.3) / 0.7))) * 20}px)`,
        }}>
          {[
            { label: 'Sunrise', value: sunriseTime, icon: '\u{1F305}', color: '#FFB84D' },
            { label: 'Sunset', value: sunsetTime, icon: '\u{1F307}', color: '#E06030' },
          ].map((item, i) => (
            <div key={i} style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 'clamp(2px, 0.4vh, 6px)',
              padding: 'clamp(8px, 1.5vw, 14px)',
              borderRadius: 'clamp(8px, 1.5vw, 12px)',
              background: `${item.color}10`,
              border: `1px solid ${item.color}25`,
              minWidth: 'clamp(70px, 18vw, 110px)',
            }}>
              <span style={{ fontSize: 'clamp(18px, 4vw, 28px)' }}>{item.icon}</span>
              <span style={{
                fontSize: 'clamp(9px, 1.5vw, 12px)',
                fontWeight: 600,
                color: `${textColor}77`,
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
              }}>{item.label}</span>
              <span style={{
                fontSize: 'clamp(16px, 3.5vw, 26px)',
                fontWeight: 800,
                color: item.color,
              }}>{item.value}</span>
            </div>
          ))}
        </div>

        {/* Day length */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 'clamp(6px, 1.2vw, 12px)',
          marginTop: 'clamp(12px, 2vh, 20px)',
          opacity: easeOutCubic(Math.max(0, (enterProgress - 0.5) / 0.5)),
        }}>
          <span style={{
            fontSize: 'clamp(10px, 1.8vw, 14px)',
            fontWeight: 600,
            color: `${textColor}66`,
          }}>
            Day Length:
          </span>
          <span style={{
            fontSize: 'clamp(14px, 2.8vw, 22px)',
            fontWeight: 800,
            color: textColor,
          }}>
            {dayLength}
          </span>
        </div>
      </div>
    </div>
  )
}

registerMotionGraphic({
  id: 'tpl-scene-sunrise-sunset',
  title: 'Sunrise & Sunset',
  description: 'Sunrise and sunset times with animated sun arc, sky gradient, and day length info',
  tags: ['scene', 'weather', 'sunrise', 'sunset', 'sun', 'time', 'sky'],
  category: 'scene-layout',
  component: SceneSunriseSunsetComponent as any,
  defaultConfig: {
    sunriseTime: '6:42 AM',
    sunsetTime: '7:18 PM',
    dayLength: '12h 36m',
    currentTime: '2:30 PM',
    location: 'San Francisco, CA',
    bgColor: '#0a1020',
    textColor: '#e2e8f0',
  },
  configSchema: [
    { key: 'sunriseTime', label: 'Sunrise Time', type: 'text', defaultValue: '6:42 AM', group: 'Content' },
    { key: 'sunsetTime', label: 'Sunset Time', type: 'text', defaultValue: '7:18 PM', group: 'Content' },
    { key: 'dayLength', label: 'Day Length', type: 'text', defaultValue: '12h 36m', group: 'Content' },
    { key: 'currentTime', label: 'Current Time', type: 'text', defaultValue: '2:30 PM', group: 'Content' },
    { key: 'location', label: 'Location', type: 'text', defaultValue: 'San Francisco, CA', group: 'Content' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#0a1020', group: 'Style' },
    { key: 'textColor', label: 'Text Color', type: 'color', defaultValue: '#e2e8f0', group: 'Style' },
  ],
})
