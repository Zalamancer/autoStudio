import React from 'react'
import { registerMotionGraphic } from '../registry'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface SceneAIStatusConfig {
  modelName: string
  modelVersion: string
  trainingEpoch: number
  accuracy: number
  lossValue: string
  parameters: string
  inferenceSpeed: string
  status: string
  bgColor: string
  accentColor: string
  textColor: string
}

function easeOutCubic(t: number): number { return 1 - Math.pow(1 - t, 3) }
function easeInCubic(t: number): number { return t * t * t }

function SceneAIStatusComponent({ config, progress }: MotionGraphicProps<SceneAIStatusConfig>) {
  const { modelName, modelVersion, trainingEpoch, accuracy, lossValue, parameters, inferenceSpeed, status, bgColor, accentColor, textColor } = config

  const enterProgress = progress < 0.2 ? progress / 0.2 : 1
  const holdProgress = progress >= 0.2 && progress < 0.8 ? (progress - 0.2) / 0.6 : progress >= 0.8 ? 1 : 0
  const exitProgress = progress >= 0.8 ? (progress - 0.8) / 0.2 : 0

  const exitOpacity = exitProgress > 0 ? 1 - easeInCubic(exitProgress) : 1
  const cardSlide = (1 - easeOutCubic(enterProgress)) * 50
  const cardOpacity = easeOutCubic(Math.min(1, enterProgress / 0.3))

  const frame = Math.floor(progress * 300)

  const displayEpoch = Math.round(trainingEpoch * easeOutCubic(Math.max(0, (enterProgress - 0.2) / 0.8)))
  const displayAccuracy = (accuracy * easeOutCubic(Math.max(0, (enterProgress - 0.3) / 0.7)))

  // Training progress indicator (circular)
  const circumference = 2 * Math.PI * 28
  const accuracyDash = (displayAccuracy / 100) * circumference
  const pulse = Math.sin(frame * 0.06) * 0.3 + 0.7

  // Neural activity dots
  const activityDots = Array.from({ length: 12 }, (_, i) => {
    const x = 10 + (i % 4) * 28
    const y = 6 + Math.floor(i / 4) * 10
    const active = Math.sin(holdProgress * Math.PI * 8 + i * 1.3) > 0
    const dotOpacity = easeOutCubic(Math.max(0, (enterProgress - 0.5 - i * 0.02) / 0.3)) * (active ? 0.4 : 0.08)

    return (
      <div
        key={i}
        style={{
          position: 'absolute',
          left: `${x}%`,
          top: `${y}%`,
          width: 3,
          height: 3,
          borderRadius: '50%',
          background: active ? accentColor : `${textColor}20`,
          opacity: dotOpacity,
          boxShadow: active ? `0 0 4px ${accentColor}40` : 'none',
          pointerEvents: 'none',
        }}
      />
    )
  })

  const isTraining = status === 'TRAINING'

  return (
    <div style={{ position: 'absolute', inset: 0, overflow: 'hidden' }}>
      <div style={{ position: 'absolute', inset: 0, background: bgColor }} />

      {/* Neural activity background */}
      {activityDots}

      <div style={{
        position: 'absolute', inset: 0,
        display: 'flex', justifyContent: 'center', alignItems: 'center',
        padding: '6%',
        opacity: exitOpacity,
      }}>
        <div style={{
          width: 'clamp(280px, 75vw, 460px)',
          background: 'linear-gradient(145deg, rgba(10,8,28,0.96), rgba(5,3,18,0.98))',
          border: `1px solid ${accentColor}20`,
          borderRadius: 'clamp(8px, 2vw, 16px)',
          padding: 'clamp(16px, 4vw, 32px)',
          transform: `translateY(${cardSlide}px)`,
          opacity: cardOpacity,
          position: 'relative',
          overflow: 'hidden',
          boxShadow: `0 0 40px ${accentColor}08`,
        }}>
          {/* Header: Model name + Status */}
          <div style={{
            display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
            marginBottom: 'clamp(12px, 3vw, 20px)',
            opacity: easeOutCubic(Math.max(0, (enterProgress - 0.05) / 0.95)),
          }}>
            <div>
              <div style={{
                fontFamily: "'Courier New', monospace",
                fontSize: 'clamp(16px, 4vw, 28px)',
                fontWeight: 700,
                color: accentColor,
                letterSpacing: 3,
                textShadow: `0 0 10px ${accentColor}40`,
              }}>
                {modelName}
              </div>
              <div style={{
                fontFamily: "'Courier New', monospace",
                fontSize: 'clamp(8px, 1.4vw, 10px)',
                color: `${textColor}40`,
                letterSpacing: 1,
                marginTop: 2,
              }}>
                {modelVersion}
              </div>
            </div>
            <div style={{
              fontFamily: "'Courier New', monospace",
              fontSize: 'clamp(7px, 1.2vw, 9px)',
              color: isTraining ? '#FFAA00' : '#00FF88',
              background: isTraining ? 'rgba(255,170,0,0.08)' : 'rgba(0,255,136,0.08)',
              padding: '3px 8px',
              borderRadius: 4,
              border: `1px solid ${isTraining ? 'rgba(255,170,0,0.2)' : 'rgba(0,255,136,0.2)'}`,
              letterSpacing: 1,
            }}>
              {status}
            </div>
          </div>

          {/* Accuracy ring + Epoch */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: 'clamp(14px, 3vw, 24px)',
            marginBottom: 'clamp(14px, 3vw, 22px)',
            opacity: easeOutCubic(Math.max(0, (enterProgress - 0.15) / 0.85)),
          }}>
            {/* Circular accuracy gauge */}
            <div style={{ position: 'relative', width: 'clamp(56px, 14vw, 80px)', height: 'clamp(56px, 14vw, 80px)', flexShrink: 0 }}>
              <svg style={{ width: '100%', height: '100%', transform: 'rotate(-90deg)' }}>
                <circle cx="50%" cy="50%" r="28" fill="none" stroke={`${textColor}08`} strokeWidth={3} />
                <circle
                  cx="50%" cy="50%" r="28"
                  fill="none"
                  stroke={accentColor}
                  strokeWidth={3}
                  strokeDasharray={`${accuracyDash} ${circumference}`}
                  strokeLinecap="round"
                  opacity={pulse}
                />
              </svg>
              <div style={{
                position: 'absolute', inset: 0,
                display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center',
              }}>
                <div style={{ fontFamily: "'Courier New', monospace", fontSize: 'clamp(14px, 3vw, 22px)', fontWeight: 900, color: textColor, lineHeight: 1 }}>
                  {displayAccuracy.toFixed(1)}
                </div>
                <div style={{ fontFamily: "'Courier New', monospace", fontSize: 'clamp(6px, 1vw, 8px)', color: `${textColor}40` }}>
                  ACC %
                </div>
              </div>
            </div>

            {/* Epoch + Loss */}
            <div style={{ flex: 1 }}>
              <div style={{ marginBottom: 'clamp(6px, 1.2vw, 10px)' }}>
                <div style={{ fontFamily: "'Courier New', monospace", fontSize: 'clamp(7px, 1.1vw, 8px)', color: `${textColor}35`, letterSpacing: 2 }}>
                  EPOCH
                </div>
                <div style={{ fontFamily: "'Courier New', monospace", fontSize: 'clamp(18px, 4vw, 30px)', fontWeight: 900, color: textColor }}>
                  {displayEpoch.toLocaleString()}
                </div>
              </div>
              <div>
                <div style={{ fontFamily: "'Courier New', monospace", fontSize: 'clamp(7px, 1.1vw, 8px)', color: `${textColor}35`, letterSpacing: 2 }}>
                  LOSS
                </div>
                <div style={{ fontFamily: "'Courier New', monospace", fontSize: 'clamp(14px, 3vw, 22px)', fontWeight: 700, color: '#FF6B8A' }}>
                  {lossValue}
                </div>
              </div>
            </div>
          </div>

          {/* Divider */}
          <div style={{ height: 1, background: `linear-gradient(90deg, transparent, ${accentColor}20, #FF00FF20, transparent)`, marginBottom: 'clamp(10px, 2vw, 16px)' }} />

          {/* Specs grid */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'clamp(6px, 1.2vw, 10px)' }}>
            {[
              { label: 'PARAMETERS', value: parameters },
              { label: 'INFERENCE', value: inferenceSpeed },
            ].map((spec, i) => {
              const stagger = easeOutCubic(Math.max(0, (enterProgress - 0.5 - i * 0.08) / 0.4))
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
                    {spec.label}
                  </div>
                  <div style={{ fontFamily: "'Courier New', monospace", fontSize: 'clamp(12px, 2.2vw, 18px)', fontWeight: 700, color: textColor }}>
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
  id: 'tpl-scene-ai-status',
  title: 'AI System Status',
  description: 'AI system status display with accuracy ring gauge, training epoch, loss, parameter count, and neural activity dots',
  tags: ['scene', 'ai', 'machine-learning', 'training', 'neural', 'tech', 'cyberpunk', 'futuristic'],
  category: 'scene-layout',
  component: SceneAIStatusComponent as any,
  defaultConfig: {
    modelName: 'ATLAS-7B',
    modelVersion: 'v3.2.0-beta',
    trainingEpoch: 4200,
    accuracy: 97.3,
    lossValue: '0.0042',
    parameters: '7B',
    inferenceSpeed: '24 tok/s',
    status: 'TRAINING',
    bgColor: '#080520',
    accentColor: '#FF00FF',
    textColor: '#e0e4ea',
  },
  configSchema: [
    { key: 'modelName', label: 'Model Name', type: 'text', defaultValue: 'ATLAS-7B', group: 'Content' },
    { key: 'modelVersion', label: 'Version', type: 'text', defaultValue: 'v3.2.0-beta', group: 'Content' },
    { key: 'trainingEpoch', label: 'Epoch', type: 'number', defaultValue: 4200, min: 0, max: 999999, group: 'Stats' },
    { key: 'accuracy', label: 'Accuracy %', type: 'number', defaultValue: 97.3, min: 0, max: 100, group: 'Stats' },
    { key: 'lossValue', label: 'Loss', type: 'text', defaultValue: '0.0042', group: 'Stats' },
    { key: 'parameters', label: 'Parameters', type: 'text', defaultValue: '7B', group: 'Content' },
    { key: 'inferenceSpeed', label: 'Inference Speed', type: 'text', defaultValue: '24 tok/s', group: 'Content' },
    { key: 'status', label: 'Status', type: 'text', defaultValue: 'TRAINING', group: 'Content' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#080520', group: 'Style' },
    { key: 'accentColor', label: 'Accent', type: 'color', defaultValue: '#FF00FF', group: 'Style' },
    { key: 'textColor', label: 'Text Color', type: 'color', defaultValue: '#e0e4ea', group: 'Style' },
  ],
})
