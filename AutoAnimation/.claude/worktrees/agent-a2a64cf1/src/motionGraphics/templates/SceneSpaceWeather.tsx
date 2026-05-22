import React from 'react'
import { registerMotionGraphic } from '../registry'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface SceneSpaceWeatherConfig {
  solarActivity: string
  kpIndex: number
  solarWindSpeed: number
  geomagneticStorm: string
  auroraForecast: string
  sunspotCount: number
  bgColor: string
  textColor: string
  accentColor: string
  warningColor: string
}

function easeOutCubic(t: number): number { return 1 - Math.pow(1 - t, 3) }
function easeInCubic(t: number): number { return t * t * t }

function SceneSpaceWeatherComponent({ config, progress }: MotionGraphicProps<SceneSpaceWeatherConfig>) {
  const { solarActivity, kpIndex, solarWindSpeed, geomagneticStorm, auroraForecast, sunspotCount, bgColor, textColor, accentColor, warningColor } = config

  const enterProgress = progress < 0.2 ? progress / 0.2 : 1
  const holdProgress = progress >= 0.2 && progress < 0.8 ? (progress - 0.2) / 0.6 : progress >= 0.8 ? 1 : 0
  const exitProgress = progress >= 0.85 ? (progress - 0.85) / 0.15 : 0
  const exitOpacity = exitProgress > 0 ? 1 - easeInCubic(exitProgress) : 1

  const headerEnter = easeOutCubic(Math.min(1, enterProgress / 0.4))
  const sunEnter = easeOutCubic(Math.max(0, (enterProgress - 0.1) / 0.4))
  const statsEnter = easeOutCubic(Math.max(0, (enterProgress - 0.4) / 0.6))
  const forecastEnter = easeOutCubic(Math.max(0, (enterProgress - 0.6) / 0.4))

  // Kp index bar color
  const kpColor = kpIndex >= 7 ? '#EF4444' : kpIndex >= 5 ? warningColor : kpIndex >= 3 ? '#F59E0B' : '#22C55E'

  // Sun pulse
  const isHolding = progress >= 0.2 && progress < 0.85
  const sunPulse = isHolding ? 1 + Math.sin(holdProgress * Math.PI * 6) * 0.04 : 1

  // Solar flare particles
  const flares = Array.from({ length: 8 }, (_, i) => {
    const angle = (i / 8) * Math.PI * 2
    const dist = 35 + (isHolding ? Math.sin(holdProgress * Math.PI * 4 + i * 1.5) * 8 : 0)
    return { angle, dist, i }
  })

  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        background: bgColor,
        overflow: 'hidden',
        fontFamily: "'Helvetica Neue', Arial, sans-serif",
        opacity: exitOpacity,
      }}
    >
      {/* Subtle radial glow */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: '50%',
          width: '60%',
          height: '40%',
          background: `radial-gradient(ellipse at center top, ${accentColor}08, transparent 70%)`,
          transform: 'translateX(-50%)',
        }}
      />

      {/* Header */}
      <div
        style={{
          position: 'absolute',
          top: '5%',
          left: '50%',
          transform: 'translateX(-50%)',
          textAlign: 'center',
          opacity: headerEnter,
        }}
      >
        <div style={{ fontSize: 'clamp(9px, 1.8vw, 12px)', color: accentColor, textTransform: 'uppercase', letterSpacing: 'clamp(2px, 0.5vw, 4px)', fontWeight: 700 }}>
          Space Weather
        </div>
        <div style={{ fontSize: 'clamp(20px, 5vw, 36px)', fontWeight: 900, color: textColor, textTransform: 'uppercase', letterSpacing: 'clamp(1px, 0.3vw, 3px)' }}>
          Solar Activity: <span style={{ color: kpColor }}>{solarActivity}</span>
        </div>
      </div>

      {/* Sun visualization */}
      <div
        style={{
          position: 'absolute',
          top: '28%',
          left: '50%',
          transform: `translate(-50%, -50%) scale(${sunEnter * sunPulse})`,
        }}
      >
        <div
          style={{
            width: 'clamp(50px, 14vw, 90px)',
            height: 'clamp(50px, 14vw, 90px)',
            borderRadius: '50%',
            background: 'radial-gradient(circle at 40% 40%, #FFE066, #FFA500, #FF6B00)',
            boxShadow: `0 0 20px #FFA50060, 0 0 50px #FF6B0030`,
            position: 'relative',
          }}
        >
          {/* Sunspots */}
          {Array.from({ length: Math.min(sunspotCount, 5) }, (_, i) => (
            <div
              key={i}
              style={{
                position: 'absolute',
                left: `${25 + ((i * 37) % 45)}%`,
                top: `${25 + ((i * 53) % 45)}%`,
                width: 4 + ((i * 7) % 4),
                height: 4 + ((i * 7) % 4),
                borderRadius: '50%',
                background: 'rgba(80,30,0,0.5)',
              }}
            />
          ))}
        </div>
        {/* Solar flare lines */}
        {flares.map(({ angle, dist, i }) => (
          <div
            key={i}
            style={{
              position: 'absolute',
              left: '50%',
              top: '50%',
              width: 2,
              height: dist,
              background: `linear-gradient(180deg, rgba(255,165,0,0.4), transparent)`,
              transformOrigin: '50% 0%',
              transform: `rotate(${angle}rad)`,
              opacity: sunEnter,
            }}
          />
        ))}
      </div>

      {/* Stats grid */}
      <div
        style={{
          position: 'absolute',
          top: '44%',
          left: '50%',
          transform: 'translateX(-50%)',
          width: '85%',
          maxWidth: 450,
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: 'clamp(8px, 2vw, 16px)',
          opacity: statsEnter,
        }}
      >
        {/* Kp Index */}
        <div style={{ background: `${textColor}06`, borderRadius: 'clamp(6px, 1.2vw, 10px)', padding: 'clamp(8px, 2vw, 16px)', border: `1px solid ${textColor}10` }}>
          <div style={{ fontSize: 'clamp(8px, 1.5vw, 10px)', color: `${textColor}50`, textTransform: 'uppercase', letterSpacing: 1 }}>Kp Index</div>
          <div style={{ fontSize: 'clamp(24px, 6vw, 40px)', fontWeight: 900, color: kpColor, fontVariantNumeric: 'tabular-nums' }}>{Math.round(kpIndex * statsEnter)}</div>
          {/* Kp bar */}
          <div style={{ width: '100%', height: 3, background: `${textColor}10`, borderRadius: 2, marginTop: 4 }}>
            <div style={{ width: `${(kpIndex / 9) * 100 * statsEnter}%`, height: '100%', background: kpColor, borderRadius: 2 }} />
          </div>
        </div>

        {/* Solar wind */}
        <div style={{ background: `${textColor}06`, borderRadius: 'clamp(6px, 1.2vw, 10px)', padding: 'clamp(8px, 2vw, 16px)', border: `1px solid ${textColor}10` }}>
          <div style={{ fontSize: 'clamp(8px, 1.5vw, 10px)', color: `${textColor}50`, textTransform: 'uppercase', letterSpacing: 1 }}>Solar Wind</div>
          <div style={{ fontSize: 'clamp(20px, 5vw, 34px)', fontWeight: 900, color: accentColor, fontVariantNumeric: 'tabular-nums' }}>
            {Math.round(solarWindSpeed * statsEnter)}
          </div>
          <div style={{ fontSize: 'clamp(8px, 1.5vw, 10px)', color: `${textColor}40` }}>km/s</div>
        </div>

        {/* Sunspot count */}
        <div style={{ background: `${textColor}06`, borderRadius: 'clamp(6px, 1.2vw, 10px)', padding: 'clamp(8px, 2vw, 16px)', border: `1px solid ${textColor}10` }}>
          <div style={{ fontSize: 'clamp(8px, 1.5vw, 10px)', color: `${textColor}50`, textTransform: 'uppercase', letterSpacing: 1 }}>Sunspots</div>
          <div style={{ fontSize: 'clamp(20px, 5vw, 34px)', fontWeight: 900, color: '#FFA500', fontVariantNumeric: 'tabular-nums' }}>{Math.round(sunspotCount * statsEnter)}</div>
        </div>

        {/* Geomagnetic storm */}
        <div style={{ background: `${textColor}06`, borderRadius: 'clamp(6px, 1.2vw, 10px)', padding: 'clamp(8px, 2vw, 16px)', border: `1px solid ${textColor}10` }}>
          <div style={{ fontSize: 'clamp(8px, 1.5vw, 10px)', color: `${textColor}50`, textTransform: 'uppercase', letterSpacing: 1 }}>Geomagnetic</div>
          <div style={{ fontSize: 'clamp(14px, 3.5vw, 24px)', fontWeight: 800, color: textColor, marginTop: 4 }}>{geomagneticStorm}</div>
        </div>
      </div>

      {/* Aurora forecast */}
      <div
        style={{
          position: 'absolute',
          bottom: '6%',
          left: '50%',
          transform: 'translateX(-50%)',
          textAlign: 'center',
          opacity: forecastEnter,
        }}
      >
        <div style={{ fontSize: 'clamp(10px, 2vw, 14px)', color: `${textColor}60` }}>
          Aurora Forecast: <span style={{ color: '#22C55E', fontWeight: 700 }}>{auroraForecast}</span>
        </div>
      </div>
    </div>
  )
}

registerMotionGraphic({
  id: 'tpl-scene-space-weather',
  title: 'Space Weather',
  description: 'Space weather dashboard with solar activity, Kp index bar, solar wind speed, sunspot count, geomagnetic storm level, and aurora forecast',
  tags: ['scene', 'space', 'weather', 'solar', 'aurora', 'astronomy', 'dashboard'],
  category: 'scene-layout',
  component: SceneSpaceWeatherComponent as unknown as React.ComponentType<MotionGraphicProps>,
  configSchema: [
    { key: 'solarActivity', label: 'Solar Activity Level', type: 'text', defaultValue: 'Moderate', group: 'Content' },
    { key: 'kpIndex', label: 'Kp Index', type: 'number', defaultValue: 4, min: 0, max: 9, group: 'Content' },
    { key: 'solarWindSpeed', label: 'Solar Wind (km/s)', type: 'number', defaultValue: 450, min: 200, max: 2000, group: 'Content' },
    { key: 'sunspotCount', label: 'Sunspot Count', type: 'number', defaultValue: 82, min: 0, max: 500, group: 'Content' },
    { key: 'geomagneticStorm', label: 'Geomagnetic Storm', type: 'text', defaultValue: 'G1 Minor', group: 'Content' },
    { key: 'auroraForecast', label: 'Aurora Forecast', type: 'text', defaultValue: 'Visible above 60° N latitude', group: 'Content' },
    { key: 'accentColor', label: 'Accent Color', type: 'color', defaultValue: '#60A5FA', group: 'Style' },
    { key: 'warningColor', label: 'Warning Color', type: 'color', defaultValue: '#F97316', group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#080814', group: 'Style' },
    { key: 'textColor', label: 'Text Color', type: 'color', defaultValue: '#E2E8F0', group: 'Style' },
  ],
  defaultConfig: {
    solarActivity: 'Moderate',
    kpIndex: 4,
    solarWindSpeed: 450,
    sunspotCount: 82,
    geomagneticStorm: 'G1 Minor',
    auroraForecast: 'Visible above 60° N latitude',
    accentColor: '#60A5FA',
    warningColor: '#F97316',
    bgColor: '#080814',
    textColor: '#E2E8F0',
  },
})
