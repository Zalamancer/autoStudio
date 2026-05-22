import React from 'react'
import { registerMotionGraphic } from '../registry'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface CameraSettingConfig {
  mode: string
  aperture: string
  iso: number
  shutterSpeed: string
  whiteBalance: string
  bgColor: string
  cardColor: string
  accentColor: string
  textColor: string
}

function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3)
}

function easeInCubic(t: number): number {
  return t * t * t
}

function SceneCameraSettingComponent({ config, progress }: MotionGraphicProps<CameraSettingConfig>) {
  const { mode, aperture, iso, shutterSpeed, whiteBalance, bgColor, cardColor, accentColor, textColor } = config

  const enterProgress = progress < 0.2 ? progress / 0.2 : 1
  const holdProgress = progress >= 0.2 && progress < 0.8 ? (progress - 0.2) / 0.6 : progress >= 0.8 ? 1 : 0
  const exitProgress = progress >= 0.8 ? (progress - 0.8) / 0.2 : 0

  const exitEased = easeInCubic(exitProgress)
  const exitOpacity = 1 - exitEased

  // Dial rotation animation
  const dialRotate = easeOutCubic(Math.min(1, enterProgress / 0.5)) * 270
  const dialHoldWobble = holdProgress > 0 ? Math.sin(holdProgress * Math.PI * 4) * 3 : 0

  // Settings values count-in
  const isoProgress = easeOutCubic(Math.max(0, Math.min(1, (enterProgress - 0.25) / 0.4)))
  const displayIso = Math.round(isoProgress * iso)

  // Aperture blade visualization
  const apertureEnter = easeOutCubic(Math.max(0, Math.min(1, (enterProgress - 0.15) / 0.4)))
  const apertureVal = parseFloat(aperture.replace('f/', '')) || 2.8
  const apertureRadius = Math.max(8, 35 - apertureVal * 3)

  const settings = [
    { label: 'MODE', value: mode, delay: 0.1 },
    { label: 'APERTURE', value: aperture, delay: 0.2 },
    { label: 'ISO', value: String(displayIso), delay: 0.3 },
    { label: 'SHUTTER', value: shutterSpeed, delay: 0.4 },
    { label: 'WB', value: whiteBalance, delay: 0.5 },
  ]

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
        fontFamily: "'Helvetica Neue', Arial, sans-serif",
        padding: '5%',
      }}
    >
      <div
        style={{
          background: cardColor,
          borderRadius: 'clamp(14px, 2vw, 22px)',
          padding: 'clamp(20px, 4%, 36px)',
          maxWidth: 400,
          width: '100%',
          opacity: exitOpacity,
          transform: `translateY(${exitEased * -50}px)`,
          boxShadow: '0 12px 40px rgba(0,0,0,0.25)',
        }}
      >
        {/* Mode dial visualization */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: 'clamp(16px, 3vh, 28px)',
          }}
        >
          <div
            style={{
              width: 'clamp(70px, 14vw, 110px)',
              height: 'clamp(70px, 14vw, 110px)',
              borderRadius: '50%',
              background: `conic-gradient(from ${dialRotate + dialHoldWobble}deg, ${accentColor} 0deg, ${accentColor}80 60deg, ${cardColor} 61deg, ${cardColor} 360deg)`,
              border: `3px solid ${textColor}20`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: `inset 0 2px 8px rgba(0,0,0,0.3), 0 4px 16px ${accentColor}20`,
            }}
          >
            {/* Center aperture visualization */}
            <div
              style={{
                width: 'clamp(40px, 8vw, 60px)',
                height: 'clamp(40px, 8vw, 60px)',
                borderRadius: '50%',
                background: '#111',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <div
                style={{
                  width: apertureRadius * apertureEnter,
                  height: apertureRadius * apertureEnter,
                  borderRadius: '50%',
                  background: accentColor,
                  opacity: 0.8,
                }}
              />
            </div>
          </div>
        </div>

        {/* Settings rows */}
        {settings.map((setting, i) => {
          const rowEnter = easeOutCubic(Math.max(0, Math.min(1, (enterProgress - setting.delay) / 0.3)))
          return (
            <div
              key={i}
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: 'clamp(8px, 1.2vh, 14px) 0',
                borderBottom: i < settings.length - 1 ? `1px solid ${textColor}10` : 'none',
                opacity: rowEnter,
                transform: `translateX(${(1 - rowEnter) * 30}px)`,
              }}
            >
              <span
                style={{
                  fontSize: 'clamp(10px, 1.5vw, 13px)',
                  fontWeight: 600,
                  color: `${textColor}60`,
                  letterSpacing: 2,
                  fontFamily: "'Courier New', monospace",
                }}
              >
                {setting.label}
              </span>
              <span
                style={{
                  fontSize: 'clamp(16px, 3vw, 24px)',
                  fontWeight: 800,
                  color: i === 0 ? accentColor : textColor,
                  fontFamily: "'Courier New', monospace",
                }}
              >
                {setting.value}
              </span>
            </div>
          )
        })}

        {/* Active indicator dot */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'center',
            gap: 6,
            marginTop: 'clamp(12px, 2vh, 20px)',
          }}
        >
          {settings.map((_, i) => (
            <div
              key={i}
              style={{
                width: 6,
                height: 6,
                borderRadius: '50%',
                background: i === Math.floor(holdProgress * settings.length) % settings.length ? accentColor : `${textColor}20`,
              }}
            />
          ))}
        </div>
      </div>
    </div>
  )
}

registerMotionGraphic({
  id: 'tpl-scene-camera-setting',
  title: 'Scene Camera Setting',
  description: 'Camera settings display with rotating mode dial, aperture visualization, and animated settings list',
  tags: ['scene', 'photography', 'camera', 'settings', 'aperture', 'iso', 'technical'],
  category: 'scenes',
  component: SceneCameraSettingComponent as unknown as React.ComponentType<MotionGraphicProps>,
  defaultConfig: {
    mode: 'MANUAL',
    aperture: 'f/2.8',
    iso: 800,
    shutterSpeed: '1/125s',
    whiteBalance: '5600K',
    bgColor: '#111318',
    cardColor: '#1A1D24',
    accentColor: '#3B82F6',
    textColor: '#E0E4EB',
  },
  configSchema: [
    { key: 'mode', label: 'Shooting Mode', type: 'text', defaultValue: 'MANUAL', group: 'Content' },
    { key: 'aperture', label: 'Aperture', type: 'text', defaultValue: 'f/2.8', group: 'Content' },
    { key: 'iso', label: 'ISO', type: 'number', defaultValue: 800, min: 50, max: 102400, group: 'Content' },
    { key: 'shutterSpeed', label: 'Shutter Speed', type: 'text', defaultValue: '1/125s', group: 'Content' },
    { key: 'whiteBalance', label: 'White Balance', type: 'text', defaultValue: '5600K', group: 'Content' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#111318', group: 'Style' },
    { key: 'cardColor', label: 'Card Color', type: 'color', defaultValue: '#1A1D24', group: 'Style' },
    { key: 'accentColor', label: 'Accent Color', type: 'color', defaultValue: '#3B82F6', group: 'Style' },
    { key: 'textColor', label: 'Text Color', type: 'color', defaultValue: '#E0E4EB', group: 'Style' },
  ],
})
