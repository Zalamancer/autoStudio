import React from 'react'
import { registerMotionGraphic } from '../registry'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface SceneRobotStatusConfig {
  modelName: string
  serialNumber: string
  batteryLevel: number
  cpuLoad: number
  motorStatus: string
  sensorCount: number
  uptime: string
  firmware: string
  bgColor: string
  accentColor: string
  textColor: string
}

function easeOutCubic(t: number): number { return 1 - Math.pow(1 - t, 3) }
function easeInCubic(t: number): number { return t * t * t }

function SceneRobotStatusComponent({ config, progress }: MotionGraphicProps<SceneRobotStatusConfig>) {
  const { modelName, serialNumber, batteryLevel, cpuLoad, motorStatus, sensorCount, uptime, firmware, bgColor, accentColor, textColor } = config

  const enterProgress = progress < 0.2 ? progress / 0.2 : 1
  const holdProgress = progress >= 0.2 && progress < 0.8 ? (progress - 0.2) / 0.6 : progress >= 0.8 ? 1 : 0
  const exitProgress = progress >= 0.8 ? (progress - 0.8) / 0.2 : 0

  const exitOpacity = exitProgress > 0 ? 1 - easeInCubic(exitProgress) : 1
  const cardSlide = (1 - easeOutCubic(enterProgress)) * 50
  const cardOpacity = easeOutCubic(Math.min(1, enterProgress / 0.35))

  const frame = Math.floor(progress * 300)

  // Robot eye indicator
  const eyePulse = 0.6 + Math.sin(frame * 0.08) * 0.4
  const isMotorGood = motorStatus === 'NOMINAL'

  const displayBattery = Math.round(batteryLevel * easeOutCubic(Math.max(0, (enterProgress - 0.3) / 0.7)))
  const displayCpu = Math.round(cpuLoad * easeOutCubic(Math.max(0, (enterProgress - 0.35) / 0.65)))
  const displaySensors = Math.round(sensorCount * easeOutCubic(Math.max(0, (enterProgress - 0.4) / 0.6)))

  const batteryColor = batteryLevel > 50 ? '#00FF88' : batteryLevel > 20 ? '#FFAA00' : '#FF4444'
  const cpuColor = cpuLoad < 70 ? '#00FFFF' : cpuLoad < 90 ? '#FFAA00' : '#FF4444'

  return (
    <div style={{ position: 'absolute', inset: 0, overflow: 'hidden' }}>
      <div style={{ position: 'absolute', inset: 0, background: bgColor }} />

      {/* Circuit-like grid background */}
      <div style={{
        position: 'absolute', inset: 0,
        backgroundImage: `
          repeating-linear-gradient(0deg, transparent, transparent 30px, ${accentColor}04 30px, ${accentColor}04 31px),
          repeating-linear-gradient(90deg, transparent, transparent 30px, ${accentColor}04 30px, ${accentColor}04 31px)
        `,
        pointerEvents: 'none',
      }} />

      <div style={{
        position: 'absolute', inset: 0,
        display: 'flex', justifyContent: 'center', alignItems: 'center',
        padding: '6%',
        opacity: exitOpacity,
      }}>
        <div style={{
          width: 'clamp(280px, 75vw, 460px)',
          background: 'linear-gradient(145deg, rgba(10,14,22,0.96), rgba(5,8,14,0.98))',
          border: `1px solid ${accentColor}20`,
          borderRadius: 'clamp(8px, 2vw, 16px)',
          padding: 'clamp(16px, 4vw, 32px)',
          transform: `translateY(${cardSlide}px)`,
          opacity: cardOpacity,
          position: 'relative',
          overflow: 'hidden',
          boxShadow: `0 0 30px ${accentColor}08`,
        }}>
          {/* Robot identity header */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: 'clamp(10px, 2vw, 18px)',
            marginBottom: 'clamp(14px, 3vw, 22px)',
            opacity: easeOutCubic(Math.max(0, (enterProgress - 0.05) / 0.95)),
          }}>
            {/* Robot eye indicator */}
            <div style={{
              width: 'clamp(40px, 9vw, 56px)',
              height: 'clamp(40px, 9vw, 56px)',
              borderRadius: '50%',
              border: `2px solid ${accentColor}50`,
              display: 'flex', justifyContent: 'center', alignItems: 'center',
              background: `radial-gradient(circle, ${accentColor}15, transparent 70%)`,
              flexShrink: 0,
            }}>
              <div style={{
                width: 'clamp(14px, 3vw, 20px)',
                height: 'clamp(14px, 3vw, 20px)',
                borderRadius: '50%',
                background: accentColor,
                opacity: eyePulse,
                boxShadow: `0 0 12px ${accentColor}60, 0 0 24px ${accentColor}30`,
              }} />
            </div>
            <div>
              <div style={{
                fontFamily: "'Courier New', monospace",
                fontSize: 'clamp(16px, 4vw, 26px)',
                fontWeight: 700,
                color: accentColor,
                letterSpacing: 3,
                textShadow: `0 0 8px ${accentColor}40`,
              }}>
                {modelName}
              </div>
              <div style={{
                fontFamily: "'Courier New', monospace",
                fontSize: 'clamp(8px, 1.4vw, 10px)',
                color: `${textColor}40`,
                letterSpacing: 1,
              }}>
                S/N: {serialNumber}
              </div>
            </div>
          </div>

          {/* Battery + CPU bars */}
          {[
            { label: 'BATTERY', value: displayBattery, max: 100, color: batteryColor },
            { label: 'CPU LOAD', value: displayCpu, max: 100, color: cpuColor },
          ].map((bar, i) => {
            const stagger = easeOutCubic(Math.max(0, (enterProgress - 0.25 - i * 0.08) / 0.5))
            return (
              <div key={i} style={{ marginBottom: 'clamp(8px, 1.5vw, 12px)', opacity: stagger }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
                  <span style={{ fontFamily: "'Courier New', monospace", fontSize: 'clamp(8px, 1.3vw, 10px)', color: `${textColor}45`, letterSpacing: 2 }}>
                    {bar.label}
                  </span>
                  <span style={{ fontFamily: "'Courier New', monospace", fontSize: 'clamp(10px, 1.8vw, 14px)', fontWeight: 700, color: bar.color }}>
                    {bar.value}%
                  </span>
                </div>
                <div style={{ height: 'clamp(4px, 0.7vw, 6px)', background: `${textColor}08`, borderRadius: 4, overflow: 'hidden' }}>
                  <div style={{
                    height: '100%',
                    width: `${bar.value}%`,
                    background: `linear-gradient(90deg, ${bar.color}60, ${bar.color})`,
                    borderRadius: 4,
                    boxShadow: `0 0 6px ${bar.color}30`,
                  }} />
                </div>
              </div>
            )
          })}

          {/* Divider */}
          <div style={{ height: 1, background: `linear-gradient(90deg, transparent, ${accentColor}20, transparent)`, margin: 'clamp(8px, 1.5vw, 12px) 0' }} />

          {/* Status grid */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'clamp(6px, 1.2vw, 10px)' }}>
            {[
              { label: 'MOTOR', value: motorStatus, color: isMotorGood ? '#00FF88' : '#FF4444' },
              { label: 'SENSORS', value: `${displaySensors} ACTIVE`, color: '#00FFFF' },
              { label: 'UPTIME', value: uptime, color: textColor },
              { label: 'FIRMWARE', value: firmware, color: textColor },
            ].map((item, i) => {
              const stagger = easeOutCubic(Math.max(0, (enterProgress - 0.45 - i * 0.06) / 0.4))
              return (
                <div key={i} style={{
                  background: `${accentColor}06`,
                  borderRadius: 6,
                  padding: 'clamp(6px, 1.2vw, 10px)',
                  border: `1px solid ${accentColor}10`,
                  opacity: stagger,
                  transform: `translateY(${(1 - stagger) * 8}px)`,
                }}>
                  <div style={{ fontFamily: "'Courier New', monospace", fontSize: 'clamp(7px, 1vw, 8px)', color: `${textColor}35`, letterSpacing: 1, marginBottom: 2 }}>
                    {item.label}
                  </div>
                  <div style={{ fontFamily: "'Courier New', monospace", fontSize: 'clamp(10px, 1.8vw, 14px)', fontWeight: 700, color: item.color }}>
                    {item.value}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}

registerMotionGraphic({
  id: 'tpl-scene-robot-status',
  title: 'Robot Status Card',
  description: 'Robot/android status card with battery, CPU, motor status, eye indicator, and circuit board background',
  tags: ['scene', 'robot', 'android', 'status', 'cyberpunk', 'futuristic', 'tech'],
  category: 'scene-layout',
  component: SceneRobotStatusComponent as any,
  defaultConfig: {
    modelName: 'UNIT-7K',
    serialNumber: 'RBT-2049-X7K',
    batteryLevel: 82,
    cpuLoad: 45,
    motorStatus: 'NOMINAL',
    sensorCount: 24,
    uptime: '847:12:03',
    firmware: 'v4.2.1',
    bgColor: '#060a12',
    accentColor: '#00FFFF',
    textColor: '#e0e4ea',
  },
  configSchema: [
    { key: 'modelName', label: 'Model Name', type: 'text', defaultValue: 'UNIT-7K', group: 'Content' },
    { key: 'serialNumber', label: 'Serial Number', type: 'text', defaultValue: 'RBT-2049-X7K', group: 'Content' },
    { key: 'batteryLevel', label: 'Battery %', type: 'number', defaultValue: 82, min: 0, max: 100, group: 'Stats' },
    { key: 'cpuLoad', label: 'CPU Load %', type: 'number', defaultValue: 45, min: 0, max: 100, group: 'Stats' },
    { key: 'motorStatus', label: 'Motor Status', type: 'text', defaultValue: 'NOMINAL', group: 'Content' },
    { key: 'sensorCount', label: 'Sensor Count', type: 'number', defaultValue: 24, min: 0, max: 100, group: 'Stats' },
    { key: 'uptime', label: 'Uptime', type: 'text', defaultValue: '847:12:03', group: 'Content' },
    { key: 'firmware', label: 'Firmware', type: 'text', defaultValue: 'v4.2.1', group: 'Content' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#060a12', group: 'Style' },
    { key: 'accentColor', label: 'Accent', type: 'color', defaultValue: '#00FFFF', group: 'Style' },
    { key: 'textColor', label: 'Text Color', type: 'color', defaultValue: '#e0e4ea', group: 'Style' },
  ],
})
