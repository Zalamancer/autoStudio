import React from 'react'
import { registerMotionGraphic } from '../registry'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface SceneNeuralInterfaceConfig {
  userName: string
  connectionStatus: string
  bandwidth: string
  latency: string
  brainwaveType: string
  signalStrength: number
  memoryUsage: number
  bgColor: string
  accentColor: string
  textColor: string
}

function easeOutCubic(t: number): number { return 1 - Math.pow(1 - t, 3) }
function easeInCubic(t: number): number { return t * t * t }

function SceneNeuralInterfaceComponent({ config, progress }: MotionGraphicProps<SceneNeuralInterfaceConfig>) {
  const { userName, connectionStatus, bandwidth, latency, brainwaveType, signalStrength, memoryUsage, bgColor, accentColor, textColor } = config

  const enterProgress = progress < 0.2 ? progress / 0.2 : 1
  const holdProgress = progress >= 0.2 && progress < 0.8 ? (progress - 0.2) / 0.6 : progress >= 0.8 ? 1 : 0
  const exitProgress = progress >= 0.8 ? (progress - 0.8) / 0.2 : 0

  const exitOpacity = exitProgress > 0 ? 1 - easeInCubic(exitProgress) : 1
  const cardScale = 0.92 + easeOutCubic(enterProgress) * 0.08
  const cardOpacity = easeOutCubic(Math.min(1, enterProgress / 0.3))

  const frame = Math.floor(progress * 300)
  const pulse = Math.sin(frame * 0.06) * 0.5 + 0.5

  // Brainwave visualization
  const wavePoints = Array.from({ length: 30 }, (_, i) => {
    const x = (i / 29) * 100
    const baseY = 50
    const amplitude = 8 + Math.sin(i * 0.3 + holdProgress * Math.PI * 6) * 4
    const y = baseY + Math.sin(i * 0.6 + holdProgress * Math.PI * 8) * amplitude
    return `${x},${y}`
  }).join(' ')

  const isConnected = connectionStatus === 'LINKED'

  return (
    <div style={{ position: 'absolute', inset: 0, overflow: 'hidden' }}>
      <div style={{ position: 'absolute', inset: 0, background: bgColor }} />

      {/* Neural pathway lines */}
      <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none' }}>
        {Array.from({ length: 5 }, (_, i) => {
          const startX = 10 + i * 20
          const endX = startX + (Math.sin(i * 1.5) * 30)
          const cy = 50 + Math.sin(holdProgress * Math.PI * 2 + i) * 20
          const opacity = easeOutCubic(Math.max(0, (enterProgress - i * 0.08) / 0.6)) * 0.06
          return (
            <path
              key={i}
              d={`M ${startX} 0 Q ${endX} ${cy} ${startX + 10} 100`}
              fill="none"
              stroke={i % 2 === 0 ? `rgba(0,255,255,${opacity})` : `rgba(180,0,255,${opacity})`}
              strokeWidth={1}
            />
          )
        })}
      </svg>

      {/* Central brain glow */}
      <div style={{
        position: 'absolute',
        top: '15%', left: '50%',
        transform: 'translateX(-50%)',
        width: 'clamp(60px, 15vw, 100px)',
        height: 'clamp(60px, 15vw, 100px)',
        borderRadius: '50%',
        background: `radial-gradient(circle, ${accentColor}10, transparent 70%)`,
        boxShadow: `0 0 ${40 + pulse * 20}px ${accentColor}10`,
        opacity: easeOutCubic(Math.max(0, (enterProgress - 0.1) / 0.9)),
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
          background: 'linear-gradient(145deg, rgba(10,8,25,0.95), rgba(5,4,18,0.98))',
          border: `1px solid ${accentColor}20`,
          borderRadius: 'clamp(8px, 2vw, 16px)',
          padding: 'clamp(16px, 4vw, 32px)',
          transform: `scale(${cardScale})`,
          opacity: cardOpacity,
          position: 'relative',
          overflow: 'hidden',
          boxShadow: `0 0 30px ${accentColor}08`,
        }}>
          {/* Header */}
          <div style={{
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            marginBottom: 'clamp(8px, 2vw, 14px)',
            opacity: easeOutCubic(Math.max(0, (enterProgress - 0.1) / 0.9)),
          }}>
            <div>
              <div style={{ fontFamily: "'Courier New', monospace", fontSize: 'clamp(7px, 1.2vw, 9px)', color: `${textColor}40`, letterSpacing: 2 }}>
                NEURAL INTERFACE
              </div>
              <div style={{
                fontFamily: "'Courier New', monospace",
                fontSize: 'clamp(16px, 4vw, 26px)',
                fontWeight: 700,
                color: accentColor,
                letterSpacing: 3,
                textShadow: `0 0 10px ${accentColor}40`,
              }}>
                {userName}
              </div>
            </div>
            <div style={{
              width: 'clamp(8px, 2vw, 12px)',
              height: 'clamp(8px, 2vw, 12px)',
              borderRadius: '50%',
              background: isConnected ? '#00FF88' : '#FF4444',
              boxShadow: isConnected ? '0 0 8px rgba(0,255,136,0.5)' : '0 0 8px rgba(255,68,68,0.5)',
            }} />
          </div>

          {/* Connection status */}
          <div style={{
            fontFamily: "'Courier New', monospace",
            fontSize: 'clamp(8px, 1.4vw, 10px)',
            color: isConnected ? '#00FF88' : '#FF4444',
            marginBottom: 'clamp(10px, 2vw, 16px)',
            letterSpacing: 2,
            opacity: easeOutCubic(Math.max(0, (enterProgress - 0.2) / 0.8)),
          }}>
            STATUS: {connectionStatus}
          </div>

          {/* Brainwave visualization */}
          <div style={{
            height: 'clamp(30px, 6vw, 50px)',
            marginBottom: 'clamp(10px, 2vw, 16px)',
            position: 'relative',
            overflow: 'hidden',
            background: `${accentColor}05`,
            borderRadius: 6,
            border: `1px solid ${accentColor}10`,
            opacity: easeOutCubic(Math.max(0, (enterProgress - 0.25) / 0.75)),
          }}>
            <svg style={{ width: '100%', height: '100%' }}>
              <polyline
                points={wavePoints}
                fill="none"
                stroke={accentColor}
                strokeWidth={1.5}
                opacity={0.6}
              />
            </svg>
            <div style={{
              position: 'absolute', top: 4, left: 6,
              fontFamily: "'Courier New', monospace",
              fontSize: 'clamp(6px, 1vw, 8px)',
              color: `${textColor}30`,
              letterSpacing: 1,
            }}>
              {brainwaveType}
            </div>
          </div>

          {/* Stats */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'clamp(6px, 1.2vw, 10px)', marginBottom: 'clamp(10px, 2vw, 14px)' }}>
            {[
              { label: 'BANDWIDTH', value: bandwidth },
              { label: 'LATENCY', value: latency },
            ].map((s, i) => {
              const stagger = easeOutCubic(Math.max(0, (enterProgress - 0.4 - i * 0.08) / 0.5))
              return (
                <div key={i} style={{
                  background: `${accentColor}06`,
                  borderRadius: 6,
                  padding: 'clamp(6px, 1.2vw, 10px)',
                  border: `1px solid ${accentColor}10`,
                  opacity: stagger,
                }}>
                  <div style={{ fontFamily: "'Courier New', monospace", fontSize: 'clamp(7px, 1.1vw, 8px)', color: `${textColor}35`, letterSpacing: 1, marginBottom: 2 }}>
                    {s.label}
                  </div>
                  <div style={{ fontFamily: "'Courier New', monospace", fontSize: 'clamp(12px, 2.2vw, 18px)', fontWeight: 700, color: textColor }}>
                    {s.value}
                  </div>
                </div>
              )
            })}
          </div>

          {/* Signal + Memory bars */}
          {[
            { label: 'SIGNAL', value: signalStrength, color: signalStrength > 70 ? '#00FF88' : '#FFAA00' },
            { label: 'MEMORY', value: memoryUsage, color: memoryUsage < 80 ? '#00FFFF' : '#FF4466' },
          ].map((bar, i) => {
            const stagger = easeOutCubic(Math.max(0, (enterProgress - 0.55 - i * 0.08) / 0.4))
            return (
              <div key={i} style={{ marginBottom: 'clamp(6px, 1.2vw, 10px)', opacity: stagger }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
                  <span style={{ fontFamily: "'Courier New', monospace", fontSize: 'clamp(7px, 1.2vw, 9px)', color: `${textColor}40`, letterSpacing: 2 }}>{bar.label}</span>
                  <span style={{ fontFamily: "'Courier New', monospace", fontSize: 'clamp(9px, 1.6vw, 12px)', fontWeight: 700, color: bar.color }}>
                    {Math.round(bar.value * stagger)}%
                  </span>
                </div>
                <div style={{ height: 'clamp(3px, 0.5vw, 4px)', background: `${textColor}08`, borderRadius: 3, overflow: 'hidden' }}>
                  <div style={{
                    height: '100%',
                    width: `${bar.value * stagger}%`,
                    background: `linear-gradient(90deg, ${bar.color}80, ${bar.color})`,
                    borderRadius: 3,
                    boxShadow: `0 0 6px ${bar.color}30`,
                  }} />
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
  id: 'tpl-scene-neural-interface',
  title: 'Neural Interface Display',
  description: 'Brain-computer interface display with brainwave visualization, signal bars, connection status, and neural pathway background',
  tags: ['scene', 'neural', 'brain', 'interface', 'cyberpunk', 'futuristic', 'sci-fi'],
  category: 'scene-layout',
  component: SceneNeuralInterfaceComponent as any,
  defaultConfig: {
    userName: 'CORTEX-9',
    connectionStatus: 'LINKED',
    bandwidth: '12.4 TB/s',
    latency: '0.3 ms',
    brainwaveType: 'BETA WAVE',
    signalStrength: 94,
    memoryUsage: 67,
    bgColor: '#080520',
    accentColor: '#B400FF',
    textColor: '#e0e4ea',
  },
  configSchema: [
    { key: 'userName', label: 'User Name', type: 'text', defaultValue: 'CORTEX-9', group: 'Content' },
    { key: 'connectionStatus', label: 'Connection', type: 'text', defaultValue: 'LINKED', group: 'Content' },
    { key: 'bandwidth', label: 'Bandwidth', type: 'text', defaultValue: '12.4 TB/s', group: 'Stats' },
    { key: 'latency', label: 'Latency', type: 'text', defaultValue: '0.3 ms', group: 'Stats' },
    { key: 'brainwaveType', label: 'Wave Type', type: 'text', defaultValue: 'BETA WAVE', group: 'Content' },
    { key: 'signalStrength', label: 'Signal %', type: 'number', defaultValue: 94, min: 0, max: 100, group: 'Stats' },
    { key: 'memoryUsage', label: 'Memory %', type: 'number', defaultValue: 67, min: 0, max: 100, group: 'Stats' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#080520', group: 'Style' },
    { key: 'accentColor', label: 'Accent', type: 'color', defaultValue: '#B400FF', group: 'Style' },
    { key: 'textColor', label: 'Text Color', type: 'color', defaultValue: '#e0e4ea', group: 'Style' },
  ],
})
