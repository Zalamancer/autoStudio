import React from 'react'
import { registerMotionGraphic } from '../registry'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface SmartHomeControlConfig {
  homeName: string
  temperature: number
  humidity: number
  devices: string[]
  deviceIcons: string[]
  deviceStates: boolean[]
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

function easeOutBack(t: number): number {
  const c1 = 1.70158
  const c3 = c1 + 1
  return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2)
}

function SceneSmartHomeControlComponent({
  config,
  frame,
  durationInFrames,
}: MotionGraphicProps<SmartHomeControlConfig>) {
  const { homeName, temperature, humidity, devices, deviceIcons, deviceStates, bgColor, cardColor, accentColor, textColor } = config
  const progress = frame / durationInFrames

  const enterEnd = 0.28
  const holdEnd = 0.8
  const enterProgress = Math.min(1, progress / enterEnd)
  const holdProgress = progress >= enterEnd && progress < holdEnd ? (progress - enterEnd) / (holdEnd - enterEnd) : progress >= holdEnd ? 1 : 0
  const exitProgress = progress >= holdEnd ? (progress - holdEnd) / (1 - holdEnd) : 0

  // Header
  const headerProgress = easeOutCubic(Math.min(1, enterProgress / 0.3))
  // Temperature gauge
  const tempProgress = easeOutCubic(Math.max(0, Math.min(1, (enterProgress - 0.15) / 0.35)))
  // Device cards
  const getDeviceProgress = (idx: number) => {
    const delay = 0.4 + idx * 0.1
    return easeOutBack(Math.max(0, Math.min(1, (enterProgress - delay) / 0.3)))
  }

  // Hold: temperature subtle variation, device toggle
  const tempDisplay = temperature + Math.sin(holdProgress * Math.PI * 6) * 0.3
  const activeDeviceToggle = Math.floor(holdProgress * devices.length * 2) % devices.length

  // Exit
  const exitEased = easeInCubic(exitProgress)
  const exitOpacity = 1 - exitEased

  // Temperature arc
  const tempMin = 15
  const tempMax = 35
  const tempPercent = Math.max(0, Math.min(1, (temperature - tempMin) / (tempMax - tempMin)))
  const arcAngle = -120 + tempPercent * 240 // -120 to 120 degrees
  const arcRadius = 50
  const centerX = 60
  const centerY = 55

  // Convert angle to SVG arc coordinates
  const startAngle = -120 * (Math.PI / 180)
  const endAngle = arcAngle * (Math.PI / 180) * tempProgress
  const startX = centerX + Math.cos(startAngle) * arcRadius
  const startY = centerY + Math.sin(startAngle) * arcRadius
  const endX = centerX + Math.cos(endAngle) * arcRadius
  const endY = centerY + Math.sin(endAngle) * arcRadius
  const largeArcFlag = Math.abs(endAngle - startAngle) > Math.PI ? 1 : 0

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
          display: 'flex',
          flexDirection: 'column',
          gap: 'clamp(12px, 2.5vh, 22px)',
          width: '100%',
          maxWidth: 400,
          opacity: exitOpacity,
        }}
      >
        {/* Header */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            opacity: headerProgress,
          }}
        >
          <div>
            <div style={{ fontSize: 'clamp(9px, 1.3vw, 11px)', fontWeight: 700, color: accentColor, letterSpacing: 3, textTransform: 'uppercase' }}>
              SMART HOME
            </div>
            <div style={{ fontSize: 'clamp(18px, 3.5vw, 28px)', fontWeight: 800, color: textColor, marginTop: 2 }}>
              {homeName}
            </div>
          </div>
          {/* Status indicator */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              padding: 'clamp(4px, 0.8vh, 8px) clamp(10px, 1.8vw, 16px)',
              borderRadius: 20,
              background: '#10B98120',
            }}
          >
            <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#10B981' }} />
            <span style={{ fontSize: 'clamp(9px, 1.3vw, 11px)', fontWeight: 700, color: '#10B981' }}>
              Online
            </span>
          </div>
        </div>

        {/* Temperature & Humidity cards */}
        <div style={{ display: 'flex', gap: 'clamp(8px, 1.5vw, 14px)' }}>
          {/* Temperature */}
          <div
            style={{
              flex: 1,
              background: cardColor,
              borderRadius: 'clamp(14px, 2vw, 20px)',
              padding: 'clamp(14px, 2.5vh, 22px)',
              textAlign: 'center',
              opacity: tempProgress,
              transform: `translateY(${(1 - tempProgress) * 15}px)`,
              boxShadow: '0 2px 12px rgba(0,0,0,0.04)',
            }}
          >
            <svg viewBox="0 0 120 70" style={{ width: '100%', height: 'auto', maxHeight: 80 }}>
              {/* Background arc */}
              <path
                d={`M ${centerX + Math.cos(startAngle) * arcRadius} ${centerY + Math.sin(startAngle) * arcRadius} A ${arcRadius} ${arcRadius} 0 1 1 ${centerX + Math.cos(120 * Math.PI / 180) * arcRadius} ${centerY + Math.sin(120 * Math.PI / 180) * arcRadius}`}
                fill="none"
                stroke={`${textColor}10`}
                strokeWidth={6}
                strokeLinecap="round"
              />
              {/* Active arc */}
              {tempProgress > 0 && (
                <path
                  d={`M ${startX} ${startY} A ${arcRadius} ${arcRadius} 0 ${largeArcFlag} 1 ${endX} ${endY}`}
                  fill="none"
                  stroke={accentColor}
                  strokeWidth={6}
                  strokeLinecap="round"
                />
              )}
              {/* Temperature text */}
              <text x={centerX} y={centerY + 2} textAnchor="middle" fontSize={20} fontWeight={900} fill={textColor} fontFamily="Helvetica, Arial, sans-serif">
                {tempDisplay.toFixed(1)}
              </text>
              <text x={centerX} y={centerY + 14} textAnchor="middle" fontSize={8} fontWeight={600} fill={`${textColor}50`} fontFamily="Helvetica, Arial, sans-serif">
                CELSIUS
              </text>
            </svg>
          </div>

          {/* Humidity */}
          <div
            style={{
              flex: 1,
              background: cardColor,
              borderRadius: 'clamp(14px, 2vw, 20px)',
              padding: 'clamp(14px, 2.5vh, 22px)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 'clamp(4px, 0.8vh, 8px)',
              opacity: tempProgress,
              transform: `translateY(${(1 - tempProgress) * 15}px)`,
              boxShadow: '0 2px 12px rgba(0,0,0,0.04)',
            }}
          >
            <div style={{ fontSize: 'clamp(24px, 5vw, 38px)' }}>{'💧'}</div>
            <div style={{ fontSize: 'clamp(24px, 5vw, 38px)', fontWeight: 900, color: '#3B82F6', lineHeight: 1 }}>
              {Math.round(humidity * tempProgress)}%
            </div>
            <div style={{ fontSize: 'clamp(8px, 1.2vw, 10px)', fontWeight: 700, color: `${textColor}40`, letterSpacing: 1.5 }}>
              HUMIDITY
            </div>
          </div>
        </div>

        {/* Device grid */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(clamp(80px, 18vw, 120px), 1fr))',
            gap: 'clamp(6px, 1.2vw, 12px)',
          }}
        >
          {devices.map((device, i) => {
            const p = getDeviceProgress(i)
            const isOn = holdProgress > 0
              ? (i === activeDeviceToggle ? !deviceStates[i] : deviceStates[i])
              : deviceStates[i]
            const icon = deviceIcons[i] || '📱'

            return (
              <div
                key={i}
                style={{
                  background: isOn ? `${accentColor}12` : cardColor,
                  borderRadius: 'clamp(12px, 1.8vw, 16px)',
                  padding: 'clamp(10px, 2vh, 16px)',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: 'clamp(4px, 0.8vh, 8px)',
                  opacity: p,
                  transform: `scale(${p})`,
                  border: isOn ? `1px solid ${accentColor}25` : `1px solid ${textColor}08`,
                  boxShadow: '0 1px 6px rgba(0,0,0,0.03)',
                }}
              >
                <span style={{ fontSize: 'clamp(18px, 3.5vw, 28px)' }}>{icon}</span>
                <span style={{ fontSize: 'clamp(8px, 1.3vw, 11px)', fontWeight: 600, color: textColor, textAlign: 'center' }}>
                  {device}
                </span>
                {/* Toggle indicator */}
                <div
                  style={{
                    width: 'clamp(28px, 5vw, 36px)',
                    height: 'clamp(14px, 2.5vw, 18px)',
                    borderRadius: 20,
                    background: isOn ? accentColor : `${textColor}20`,
                    position: 'relative',
                  }}
                >
                  <div
                    style={{
                      position: 'absolute',
                      top: 2,
                      left: isOn ? 'calc(100% - clamp(12px, 2vw, 14px))' : 2,
                      width: 'clamp(10px, 1.8vw, 14px)',
                      height: 'clamp(10px, 1.8vw, 14px)',
                      borderRadius: '50%',
                      background: '#FFFFFF',
                      boxShadow: '0 1px 3px rgba(0,0,0,0.15)',
                    }}
                  />
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
  id: 'tpl-scene-smart-home-control',
  title: 'Scene Smart Home Control',
  description: 'Smart home control panel with temperature arc gauge, humidity display, device grid with toggle switches, and status indicators',
  tags: ['scene', 'smart-home', 'IoT', 'control', 'dashboard', 'architecture', 'technology', 'home'],
  category: 'scene-layout',
  component: SceneSmartHomeControlComponent as unknown as React.ComponentType<MotionGraphicProps>,
  configSchema: [
    { key: 'homeName', label: 'Home Name', type: 'text', defaultValue: 'My Smart Home', group: 'Content' },
    { key: 'temperature', label: 'Temperature', type: 'number', defaultValue: 22.5, min: 10, max: 40, group: 'Content' },
    { key: 'humidity', label: 'Humidity %', type: 'number', defaultValue: 45, min: 0, max: 100, group: 'Content' },
    { key: 'devices', label: 'Devices', type: 'text-array', defaultValue: ['Lights', 'Thermostat', 'Blinds', 'Lock', 'Camera', 'Speaker'], group: 'Content' },
    { key: 'deviceIcons', label: 'Device Icons', type: 'text-array', defaultValue: ['💡', '🌡️', '🪟', '🔒', '📷', '🔊'], group: 'Content' },
    { key: 'deviceStates', label: 'Device States', type: 'text-array', defaultValue: [true, true, false, true, true, false] as any, group: 'Content' },
    { key: 'accentColor', label: 'Accent Color', type: 'color', defaultValue: '#6366F1', group: 'Style' },
    { key: 'cardColor', label: 'Card Color', type: 'color', defaultValue: '#FFFFFF', group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#F0F0F8', group: 'Style' },
    { key: 'textColor', label: 'Text Color', type: 'color', defaultValue: '#1E293B', group: 'Style' },
  ],
  defaultConfig: {
    homeName: 'My Smart Home',
    temperature: 22.5,
    humidity: 45,
    devices: ['Lights', 'Thermostat', 'Blinds', 'Lock', 'Camera', 'Speaker'],
    deviceIcons: ['💡', '🌡️', '🪟', '🔒', '📷', '🔊'],
    deviceStates: [true, true, false, true, true, false],
    accentColor: '#6366F1',
    cardColor: '#FFFFFF',
    bgColor: '#F0F0F8',
    textColor: '#1E293B',
  },
})
