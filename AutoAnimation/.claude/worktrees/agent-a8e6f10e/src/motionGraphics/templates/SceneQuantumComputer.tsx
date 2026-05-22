import React from 'react'
import { registerMotionGraphic } from '../registry'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface SceneQuantumComputerConfig {
  systemName: string
  qubits: number
  coherenceTime: string
  gateError: string
  algorithm: string
  temperature: string
  status: string
  bgColor: string
  accentColor: string
  textColor: string
}

function easeOutCubic(t: number): number { return 1 - Math.pow(1 - t, 3) }
function easeInCubic(t: number): number { return t * t * t }

function SceneQuantumComputerComponent({ config, progress }: MotionGraphicProps<SceneQuantumComputerConfig>) {
  const { systemName, qubits, coherenceTime, gateError, algorithm, temperature, status, bgColor, accentColor, textColor } = config

  const enterProgress = progress < 0.2 ? progress / 0.2 : 1
  const holdProgress = progress >= 0.2 && progress < 0.8 ? (progress - 0.2) / 0.6 : progress >= 0.8 ? 1 : 0
  const exitProgress = progress >= 0.8 ? (progress - 0.8) / 0.2 : 0

  const exitOpacity = exitProgress > 0 ? 1 - easeInCubic(exitProgress) : 1
  const cardSlide = (1 - easeOutCubic(enterProgress)) * 50
  const cardOpacity = easeOutCubic(Math.min(1, enterProgress / 0.3))

  const frame = Math.floor(progress * 300)

  // Quantum particle orbits
  const particles = Array.from({ length: 6 }, (_, i) => {
    const speed = 1 + i * 0.3
    const angle = (holdProgress * speed * Math.PI * 2) + (i / 6) * Math.PI * 2
    const radiusX = 15 + i * 4
    const radiusY = 8 + i * 2
    const x = 50 + Math.cos(angle) * radiusX
    const y = 20 + Math.sin(angle) * radiusY
    const particleOpacity = easeOutCubic(Math.max(0, (enterProgress - 0.2 - i * 0.05) / 0.5)) * (0.2 + Math.sin(frame * 0.1 + i) * 0.1)
    const isCyan = i % 2 === 0

    return (
      <div
        key={i}
        style={{
          position: 'absolute',
          left: `${x}%`,
          top: `${y}%`,
          width: 4,
          height: 4,
          borderRadius: '50%',
          background: isCyan ? '#00FFFF' : '#B400FF',
          opacity: particleOpacity,
          boxShadow: `0 0 8px ${isCyan ? 'rgba(0,255,255,0.5)' : 'rgba(180,0,255,0.5)'}`,
          transform: 'translate(-50%, -50%)',
          pointerEvents: 'none',
        }}
      />
    )
  })

  const displayQubits = Math.round(qubits * easeOutCubic(Math.max(0, (enterProgress - 0.3) / 0.7)))

  const specs = [
    { label: 'COHERENCE TIME', value: coherenceTime },
    { label: 'GATE ERROR', value: gateError },
    { label: 'ALGORITHM', value: algorithm },
    { label: 'TEMPERATURE', value: temperature },
  ]

  return (
    <div style={{ position: 'absolute', inset: 0, overflow: 'hidden' }}>
      <div style={{ position: 'absolute', inset: 0, background: bgColor }} />

      {/* Background quantum wave pattern */}
      <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none' }}>
        {Array.from({ length: 3 }, (_, i) => {
          const waveY = 30 + i * 15
          const points = Array.from({ length: 20 }, (_, j) => {
            const x = (j / 19) * 100
            const y = waveY + Math.sin(j * 0.5 + holdProgress * Math.PI * 4 + i * 2) * 3
            return `${x},${y}`
          }).join(' ')
          return (
            <polyline
              key={i}
              points={points}
              fill="none"
              stroke={`rgba(0,255,255,${0.03 + i * 0.01})`}
              strokeWidth={0.5}
            />
          )
        })}
      </svg>

      {/* Quantum particles */}
      {particles}

      <div style={{
        position: 'absolute', inset: 0,
        display: 'flex', justifyContent: 'center', alignItems: 'center',
        padding: '6%',
        opacity: exitOpacity,
      }}>
        <div style={{
          width: 'clamp(280px, 75vw, 460px)',
          background: 'linear-gradient(145deg, rgba(8,10,25,0.96), rgba(4,5,18,0.98))',
          border: `1px solid ${accentColor}20`,
          borderRadius: 'clamp(8px, 2vw, 16px)',
          padding: 'clamp(16px, 4vw, 32px)',
          transform: `translateY(${cardSlide}px)`,
          opacity: cardOpacity,
          position: 'relative',
          overflow: 'hidden',
          boxShadow: `0 0 40px ${accentColor}08`,
        }}>
          {/* Top accent */}
          <div style={{
            position: 'absolute', top: 0, left: 0, right: 0, height: 2,
            background: `linear-gradient(90deg, ${accentColor}00, ${accentColor}60, #B400FF60, ${accentColor}00)`,
          }} />

          {/* System name + Status */}
          <div style={{
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            marginBottom: 'clamp(8px, 2vw, 14px)',
            opacity: easeOutCubic(Math.max(0, (enterProgress - 0.1) / 0.9)),
          }}>
            <div style={{
              fontFamily: "'Courier New', monospace",
              fontSize: 'clamp(14px, 3.5vw, 24px)',
              fontWeight: 700,
              color: accentColor,
              textTransform: 'uppercase',
              letterSpacing: 3,
              textShadow: `0 0 10px ${accentColor}40`,
            }}>
              {systemName}
            </div>
            <div style={{
              fontFamily: "'Courier New', monospace",
              fontSize: 'clamp(7px, 1.2vw, 9px)',
              color: status === 'COMPUTING' ? '#00FF88' : '#FFAA00',
              background: status === 'COMPUTING' ? 'rgba(0,255,136,0.08)' : 'rgba(255,170,0,0.08)',
              padding: '2px 8px',
              borderRadius: 4,
              border: `1px solid ${status === 'COMPUTING' ? 'rgba(0,255,136,0.2)' : 'rgba(255,170,0,0.2)'}`,
              letterSpacing: 1,
            }}>
              {status}
            </div>
          </div>

          {/* Qubit count - large display */}
          <div style={{
            textAlign: 'center',
            marginBottom: 'clamp(12px, 3vw, 20px)',
            opacity: easeOutCubic(Math.max(0, (enterProgress - 0.2) / 0.8)),
          }}>
            <div style={{
              fontFamily: "'Courier New', monospace",
              fontSize: 'clamp(36px, 9vw, 72px)',
              fontWeight: 900,
              color: textColor,
              lineHeight: 1,
              textShadow: `0 0 20px ${accentColor}20`,
            }}>
              {displayQubits}
            </div>
            <div style={{
              fontFamily: "'Courier New', monospace",
              fontSize: 'clamp(8px, 1.5vw, 11px)',
              color: `${textColor}40`,
              textTransform: 'uppercase',
              letterSpacing: 4,
              marginTop: 4,
            }}>
              LOGICAL QUBITS
            </div>
          </div>

          {/* Divider */}
          <div style={{ height: 1, background: `linear-gradient(90deg, transparent, ${accentColor}20, #B400FF20, transparent)`, marginBottom: 'clamp(10px, 2vw, 16px)' }} />

          {/* Specs grid */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'clamp(6px, 1.2vw, 10px)' }}>
            {specs.map((spec, i) => {
              const stagger = easeOutCubic(Math.max(0, (enterProgress - 0.4 - i * 0.06) / 0.5))
              return (
                <div key={i} style={{
                  background: `${accentColor}06`,
                  borderRadius: 6,
                  padding: 'clamp(6px, 1.2vw, 10px)',
                  border: `1px solid ${accentColor}10`,
                  opacity: stagger,
                  transform: `translateY(${(1 - stagger) * 10}px)`,
                }}>
                  <div style={{ fontFamily: "'Courier New', monospace", fontSize: 'clamp(7px, 1.1vw, 8px)', color: `${textColor}40`, letterSpacing: 1, marginBottom: 2 }}>
                    {spec.label}
                  </div>
                  <div style={{ fontFamily: "'Courier New', monospace", fontSize: 'clamp(11px, 2vw, 16px)', fontWeight: 700, color: textColor }}>
                    {spec.value}
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
  id: 'tpl-scene-quantum-computer',
  title: 'Quantum Computer Status',
  description: 'Quantum computing status display with qubit count, coherence time, orbital particles, and wave patterns',
  tags: ['scene', 'quantum', 'computer', 'futuristic', 'sci-fi', 'tech', 'cyberpunk'],
  category: 'scene-layout',
  component: SceneQuantumComputerComponent as any,
  defaultConfig: {
    systemName: 'QBIT-X9',
    qubits: 1024,
    coherenceTime: '148 \u03bcs',
    gateError: '0.001%',
    algorithm: 'SHOR-2048',
    temperature: '15 mK',
    status: 'COMPUTING',
    bgColor: '#060818',
    accentColor: '#00FFFF',
    textColor: '#e0e4ea',
  },
  configSchema: [
    { key: 'systemName', label: 'System Name', type: 'text', defaultValue: 'QBIT-X9', group: 'Content' },
    { key: 'qubits', label: 'Qubits', type: 'number', defaultValue: 1024, min: 1, max: 100000, group: 'Stats' },
    { key: 'coherenceTime', label: 'Coherence Time', type: 'text', defaultValue: '148 \u03bcs', group: 'Stats' },
    { key: 'gateError', label: 'Gate Error', type: 'text', defaultValue: '0.001%', group: 'Stats' },
    { key: 'algorithm', label: 'Algorithm', type: 'text', defaultValue: 'SHOR-2048', group: 'Content' },
    { key: 'temperature', label: 'Temperature', type: 'text', defaultValue: '15 mK', group: 'Stats' },
    { key: 'status', label: 'Status', type: 'text', defaultValue: 'COMPUTING', group: 'Content' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#060818', group: 'Style' },
    { key: 'accentColor', label: 'Accent', type: 'color', defaultValue: '#00FFFF', group: 'Style' },
    { key: 'textColor', label: 'Text Color', type: 'color', defaultValue: '#e0e4ea', group: 'Style' },
  ],
})
