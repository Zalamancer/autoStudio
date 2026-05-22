import React from 'react'
import { registerMotionGraphic } from '../registry'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface ColorGradingConfig {
  title: string
  shadows: string
  midtones: string
  highlights: string
  temperature: number
  tint: number
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

function SceneColorGradingComponent({ config, progress }: MotionGraphicProps<ColorGradingConfig>) {
  const { title, shadows, midtones, highlights, temperature, tint, bgColor, cardColor, accentColor, textColor } = config

  const enterProgress = progress < 0.2 ? progress / 0.2 : 1
  const holdProgress = progress >= 0.2 && progress < 0.8 ? (progress - 0.2) / 0.6 : progress >= 0.8 ? 1 : 0
  const exitProgress = progress >= 0.8 ? (progress - 0.8) / 0.2 : 0

  const exitEased = easeInCubic(exitProgress)
  const exitOpacity = 1 - exitEased

  // Wheel rotation animation
  const wheelRotation = easeOutCubic(Math.min(1, enterProgress / 0.5)) * 360
  const holdWobble = Math.sin(holdProgress * Math.PI * 4) * 8

  const wheels = [
    { label: 'Shadows', color: shadows, delay: 0.1, angle: 220 + holdWobble },
    { label: 'Midtones', color: midtones, delay: 0.2, angle: 150 + holdWobble * 0.7 },
    { label: 'Highlights', color: highlights, delay: 0.3, angle: 60 + holdWobble * 0.5 },
  ]

  // Temperature/tint sliders
  const tempProgress = easeOutCubic(Math.max(0, Math.min(1, (enterProgress - 0.4) / 0.4)))
  const tempPos = 50 + (temperature / 100) * 40
  const tintPos = 50 + (tint / 100) * 40

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
          borderRadius: 'clamp(12px, 2vw, 20px)',
          padding: 'clamp(18px, 3.5%, 32px)',
          maxWidth: 420,
          width: '100%',
          opacity: exitOpacity,
          transform: `translateY(${exitEased * -50}px)`,
          boxShadow: '0 12px 40px rgba(0,0,0,0.25)',
        }}
      >
        {/* Title */}
        <div
          style={{
            fontSize: 'clamp(14px, 2.5vw, 20px)',
            fontWeight: 800,
            color: textColor,
            marginBottom: 'clamp(14px, 2.5vh, 24px)',
            opacity: easeOutCubic(Math.min(1, enterProgress / 0.3)),
            textAlign: 'center',
          }}
        >
          {title}
        </div>

        {/* Color wheels row */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-around',
            marginBottom: 'clamp(16px, 3vh, 28px)',
          }}
        >
          {wheels.map((wheel, i) => {
            const wheelEnter = easeOutCubic(Math.max(0, Math.min(1, (enterProgress - wheel.delay) / 0.35)))
            const wheelSize = 'clamp(60px, 12vw, 90px)'
            // Indicator dot position on the wheel
            const indicatorAngle = (wheel.angle * Math.PI) / 180
            const dotDist = 0.32

            return (
              <div key={i} style={{ textAlign: 'center', opacity: wheelEnter, transform: `scale(${wheelEnter})` }}>
                <div
                  style={{
                    width: wheelSize,
                    height: wheelSize,
                    borderRadius: '50%',
                    background: `conic-gradient(
                      hsl(0, 60%, 50%),
                      hsl(60, 60%, 50%),
                      hsl(120, 60%, 50%),
                      hsl(180, 60%, 50%),
                      hsl(240, 60%, 50%),
                      hsl(300, 60%, 50%),
                      hsl(360, 60%, 50%)
                    )`,
                    position: 'relative',
                    margin: '0 auto',
                    boxShadow: `inset 0 0 20px rgba(0,0,0,0.5)`,
                    border: `2px solid ${textColor}15`,
                  }}
                >
                  {/* Center dark circle */}
                  <div
                    style={{
                      position: 'absolute',
                      top: '25%',
                      left: '25%',
                      right: '25%',
                      bottom: '25%',
                      borderRadius: '50%',
                      background: cardColor,
                      border: `1px solid ${textColor}10`,
                    }}
                  />
                  {/* Indicator dot */}
                  <div
                    style={{
                      position: 'absolute',
                      top: `${50 - Math.sin(indicatorAngle) * dotDist * 100}%`,
                      left: `${50 + Math.cos(indicatorAngle) * dotDist * 100}%`,
                      width: 8,
                      height: 8,
                      borderRadius: '50%',
                      background: wheel.color,
                      border: '2px solid #FFFFFF',
                      transform: 'translate(-50%, -50%)',
                      boxShadow: `0 0 6px ${wheel.color}80`,
                    }}
                  />
                </div>
                <div
                  style={{
                    fontSize: 'clamp(9px, 1.3vw, 12px)',
                    fontWeight: 600,
                    color: `${textColor}70`,
                    marginTop: 'clamp(4px, 0.8vh, 8px)',
                    letterSpacing: 1,
                  }}
                >
                  {wheel.label}
                </div>
              </div>
            )
          })}
        </div>

        {/* Temperature slider */}
        <div style={{ marginBottom: 'clamp(10px, 1.5vh, 16px)', opacity: tempProgress }}>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              marginBottom: 4,
            }}
          >
            <span style={{ fontSize: 'clamp(9px, 1.3vw, 12px)', fontWeight: 600, color: `${textColor}60`, letterSpacing: 1 }}>TEMPERATURE</span>
            <span style={{ fontSize: 'clamp(9px, 1.3vw, 12px)', fontWeight: 700, color: textColor }}>{temperature > 0 ? `+${temperature}` : temperature}</span>
          </div>
          <div
            style={{
              height: 'clamp(6px, 1vw, 10px)',
              borderRadius: 5,
              background: 'linear-gradient(to right, #4488FF, #FFFFFF, #FF8844)',
              position: 'relative',
            }}
          >
            <div
              style={{
                position: 'absolute',
                top: '50%',
                left: `${tempPos * tempProgress}%`,
                width: 12,
                height: 12,
                borderRadius: '50%',
                background: '#FFFFFF',
                border: '2px solid #333',
                transform: 'translate(-50%, -50%)',
                boxShadow: '0 1px 4px rgba(0,0,0,0.3)',
              }}
            />
          </div>
        </div>

        {/* Tint slider */}
        <div style={{ opacity: tempProgress }}>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              marginBottom: 4,
            }}
          >
            <span style={{ fontSize: 'clamp(9px, 1.3vw, 12px)', fontWeight: 600, color: `${textColor}60`, letterSpacing: 1 }}>TINT</span>
            <span style={{ fontSize: 'clamp(9px, 1.3vw, 12px)', fontWeight: 700, color: textColor }}>{tint > 0 ? `+${tint}` : tint}</span>
          </div>
          <div
            style={{
              height: 'clamp(6px, 1vw, 10px)',
              borderRadius: 5,
              background: 'linear-gradient(to right, #44CC44, #FFFFFF, #CC44CC)',
              position: 'relative',
            }}
          >
            <div
              style={{
                position: 'absolute',
                top: '50%',
                left: `${tintPos * tempProgress}%`,
                width: 12,
                height: 12,
                borderRadius: '50%',
                background: '#FFFFFF',
                border: '2px solid #333',
                transform: 'translate(-50%, -50%)',
                boxShadow: '0 1px 4px rgba(0,0,0,0.3)',
              }}
            />
          </div>
        </div>
      </div>
    </div>
  )
}

registerMotionGraphic({
  id: 'tpl-scene-color-grading',
  title: 'Scene Color Grading',
  description: 'Color grading wheels for shadows, midtones, and highlights with temperature and tint sliders',
  tags: ['scene', 'photography', 'color', 'grading', 'editing', 'wheels', 'post-production'],
  category: 'scenes',
  component: SceneColorGradingComponent as unknown as React.ComponentType<MotionGraphicProps>,
  defaultConfig: {
    title: 'Color Grade: Cinematic Teal',
    shadows: '#2266AA',
    midtones: '#55AA88',
    highlights: '#FFCC66',
    temperature: 15,
    tint: -8,
    bgColor: '#0F1419',
    cardColor: '#1C2128',
    accentColor: '#58A6FF',
    textColor: '#E6EDF3',
  },
  configSchema: [
    { key: 'title', label: 'Title', type: 'text', defaultValue: 'Color Grade: Cinematic Teal', group: 'Content' },
    { key: 'shadows', label: 'Shadows Color', type: 'color', defaultValue: '#2266AA', group: 'Content' },
    { key: 'midtones', label: 'Midtones Color', type: 'color', defaultValue: '#55AA88', group: 'Content' },
    { key: 'highlights', label: 'Highlights Color', type: 'color', defaultValue: '#FFCC66', group: 'Content' },
    { key: 'temperature', label: 'Temperature (-100 to 100)', type: 'number', defaultValue: 15, min: -100, max: 100, group: 'Content' },
    { key: 'tint', label: 'Tint (-100 to 100)', type: 'number', defaultValue: -8, min: -100, max: 100, group: 'Content' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#0F1419', group: 'Style' },
    { key: 'cardColor', label: 'Card Color', type: 'color', defaultValue: '#1C2128', group: 'Style' },
    { key: 'accentColor', label: 'Accent Color', type: 'color', defaultValue: '#58A6FF', group: 'Style' },
    { key: 'textColor', label: 'Text Color', type: 'color', defaultValue: '#E6EDF3', group: 'Style' },
  ],
})
