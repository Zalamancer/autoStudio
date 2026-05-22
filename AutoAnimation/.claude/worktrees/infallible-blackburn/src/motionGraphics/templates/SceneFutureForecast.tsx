import React from 'react'
import { registerMotionGraphic } from '../registry'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface SceneFutureForecastConfig {
  title: string
  prediction1Year: string
  prediction1Text: string
  prediction1Confidence: number
  prediction2Year: string
  prediction2Text: string
  prediction2Confidence: number
  prediction3Year: string
  prediction3Text: string
  prediction3Confidence: number
  bgColor: string
  accentColor: string
  textColor: string
}

function easeOutCubic(t: number): number { return 1 - Math.pow(1 - t, 3) }
function easeInCubic(t: number): number { return t * t * t }

function SceneFutureForecastComponent({ config, progress }: MotionGraphicProps<SceneFutureForecastConfig>) {
  const {
    title, prediction1Year, prediction1Text, prediction1Confidence,
    prediction2Year, prediction2Text, prediction2Confidence,
    prediction3Year, prediction3Text, prediction3Confidence,
    bgColor, accentColor, textColor,
  } = config

  const enterProgress = progress < 0.2 ? progress / 0.2 : 1
  const holdProgress = progress >= 0.2 && progress < 0.8 ? (progress - 0.2) / 0.6 : progress >= 0.8 ? 1 : 0
  const exitProgress = progress >= 0.8 ? (progress - 0.8) / 0.2 : 0

  const exitOpacity = exitProgress > 0 ? 1 - easeInCubic(exitProgress) : 1
  const cardSlide = (1 - easeOutCubic(enterProgress)) * 50
  const cardOpacity = easeOutCubic(Math.min(1, enterProgress / 0.3))

  const frame = Math.floor(progress * 300)

  const predictions = [
    { year: prediction1Year, text: prediction1Text, confidence: prediction1Confidence },
    { year: prediction2Year, text: prediction2Text, confidence: prediction2Confidence },
    { year: prediction3Year, text: prediction3Text, confidence: prediction3Confidence },
  ]

  // Timeline pulse
  const timelinePulse = holdProgress * 100

  return (
    <div style={{ position: 'absolute', inset: 0, overflow: 'hidden' }}>
      <div style={{ position: 'absolute', inset: 0, background: bgColor }} />

      {/* Faint time grid */}
      <div style={{
        position: 'absolute', inset: 0,
        backgroundImage: `
          repeating-linear-gradient(90deg, transparent, transparent 60px, ${accentColor}03 60px, ${accentColor}03 61px)
        `,
        pointerEvents: 'none',
      }} />

      {/* Horizontal time beam */}
      <div style={{
        position: 'absolute',
        left: 0,
        top: '50%',
        width: `${easeOutCubic(enterProgress) * 100}%`,
        height: 1,
        background: `linear-gradient(90deg, transparent, ${accentColor}15)`,
        pointerEvents: 'none',
      }} />

      <div style={{
        position: 'absolute', inset: 0,
        display: 'flex', justifyContent: 'center', alignItems: 'center',
        padding: '6%',
        opacity: exitOpacity,
      }}>
        <div style={{
          width: 'clamp(280px, 78vw, 480px)',
          background: 'linear-gradient(145deg, rgba(8,10,25,0.96), rgba(4,5,16,0.98))',
          border: `1px solid ${accentColor}20`,
          borderRadius: 'clamp(8px, 2vw, 16px)',
          padding: 'clamp(16px, 4vw, 32px)',
          transform: `translateY(${cardSlide}px)`,
          opacity: cardOpacity,
          position: 'relative',
          overflow: 'hidden',
          boxShadow: `0 0 40px ${accentColor}08`,
        }}>
          {/* Title */}
          <div style={{
            textAlign: 'center',
            marginBottom: 'clamp(6px, 1.5vw, 12px)',
            opacity: easeOutCubic(Math.max(0, (enterProgress - 0.05) / 0.95)),
          }}>
            <div style={{
              fontFamily: "'Courier New', monospace",
              fontSize: 'clamp(7px, 1.2vw, 9px)',
              color: `${textColor}35`,
              letterSpacing: 3,
              marginBottom: 4,
            }}>
              PREDICTIVE ANALYSIS
            </div>
            <div style={{
              fontFamily: "'Courier New', monospace",
              fontSize: 'clamp(16px, 4vw, 28px)',
              fontWeight: 700,
              color: accentColor,
              letterSpacing: 4,
              textShadow: `0 0 10px ${accentColor}40`,
            }}>
              {title}
            </div>
          </div>

          {/* Timeline bar */}
          <div style={{
            height: 2,
            background: `${textColor}08`,
            margin: 'clamp(10px, 2vw, 18px) 0',
            position: 'relative',
            borderRadius: 1,
          }}>
            <div style={{
              position: 'absolute',
              left: 0, top: 0, bottom: 0,
              width: `${easeOutCubic(Math.max(0, (enterProgress - 0.15) / 0.85)) * 100}%`,
              background: `linear-gradient(90deg, ${accentColor}, #FF00FF)`,
              borderRadius: 1,
              boxShadow: `0 0 8px ${accentColor}30`,
            }} />
            {/* Timeline dots */}
            {predictions.map((_, i) => {
              const dotX = 15 + i * 35
              const dotOpacity = easeOutCubic(Math.max(0, (enterProgress - 0.2 - i * 0.1) / 0.5))
              return (
                <div key={i} style={{
                  position: 'absolute',
                  left: `${dotX}%`,
                  top: '50%',
                  transform: 'translate(-50%, -50%)',
                  width: 8,
                  height: 8,
                  borderRadius: '50%',
                  background: i === 0 ? accentColor : i === 1 ? '#B400FF' : '#FF00FF',
                  border: '2px solid rgba(0,0,0,0.5)',
                  boxShadow: `0 0 6px ${accentColor}40`,
                  opacity: dotOpacity,
                }} />
              )
            })}
          </div>

          {/* Prediction cards */}
          {predictions.map((pred, i) => {
            const stagger = easeOutCubic(Math.max(0, (enterProgress - 0.3 - i * 0.12) / 0.5))
            const displayConf = Math.round(pred.confidence * stagger)
            const confColor = pred.confidence > 80 ? '#00FF88' : pred.confidence > 50 ? '#FFAA00' : '#FF4466'

            return (
              <div key={i} style={{
                display: 'flex', alignItems: 'flex-start', gap: 'clamp(8px, 2vw, 14px)',
                marginBottom: 'clamp(10px, 2vw, 16px)',
                opacity: stagger,
                transform: `translateX(${(1 - stagger) * 30}px)`,
                padding: 'clamp(8px, 1.5vw, 12px)',
                background: `${accentColor}04`,
                borderRadius: 8,
                borderLeft: `2px solid ${i === 0 ? accentColor : i === 1 ? '#B400FF' : '#FF00FF'}40`,
              }}>
                <div style={{
                  fontFamily: "'Courier New', monospace",
                  fontSize: 'clamp(14px, 3vw, 22px)',
                  fontWeight: 900,
                  color: i === 0 ? accentColor : i === 1 ? '#B400FF' : '#FF00FF',
                  lineHeight: 1,
                  flexShrink: 0,
                  textShadow: `0 0 8px ${accentColor}20`,
                }}>
                  {pred.year}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{
                    fontFamily: "'Courier New', monospace",
                    fontSize: 'clamp(10px, 1.8vw, 14px)',
                    fontWeight: 600,
                    color: textColor,
                    lineHeight: 1.3,
                    marginBottom: 4,
                  }}>
                    {pred.text}
                  </div>
                  <div style={{
                    fontFamily: "'Courier New', monospace",
                    fontSize: 'clamp(8px, 1.3vw, 10px)',
                    color: confColor,
                    letterSpacing: 1,
                  }}>
                    CONFIDENCE: {displayConf}%
                  </div>
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
  id: 'tpl-scene-future-forecast',
  title: 'Future Prediction Timeline',
  description: 'Future prediction timeline with confidence scores, gradient timeline bar, and staggered prediction cards',
  tags: ['scene', 'future', 'prediction', 'timeline', 'forecast', 'cyberpunk', 'futuristic', 'sci-fi'],
  category: 'scene-layout',
  component: SceneFutureForecastComponent as any,
  defaultConfig: {
    title: 'TECH FORECAST',
    prediction1Year: '2030',
    prediction1Text: 'Neural interfaces reach consumer market',
    prediction1Confidence: 87,
    prediction2Year: '2035',
    prediction2Text: 'Quantum supremacy in daily computing',
    prediction2Confidence: 64,
    prediction3Year: '2040',
    prediction3Text: 'Full brain-cloud synchronization',
    prediction3Confidence: 41,
    bgColor: '#060a14',
    accentColor: '#00FFFF',
    textColor: '#e0e4ea',
  },
  configSchema: [
    { key: 'title', label: 'Title', type: 'text', defaultValue: 'TECH FORECAST', group: 'Content' },
    { key: 'prediction1Year', label: 'Year 1', type: 'text', defaultValue: '2030', group: 'Prediction 1' },
    { key: 'prediction1Text', label: 'Prediction 1', type: 'text', defaultValue: 'Neural interfaces reach consumer market', group: 'Prediction 1' },
    { key: 'prediction1Confidence', label: 'Confidence 1', type: 'number', defaultValue: 87, min: 0, max: 100, group: 'Prediction 1' },
    { key: 'prediction2Year', label: 'Year 2', type: 'text', defaultValue: '2035', group: 'Prediction 2' },
    { key: 'prediction2Text', label: 'Prediction 2', type: 'text', defaultValue: 'Quantum supremacy in daily computing', group: 'Prediction 2' },
    { key: 'prediction2Confidence', label: 'Confidence 2', type: 'number', defaultValue: 64, min: 0, max: 100, group: 'Prediction 2' },
    { key: 'prediction3Year', label: 'Year 3', type: 'text', defaultValue: '2040', group: 'Prediction 3' },
    { key: 'prediction3Text', label: 'Prediction 3', type: 'text', defaultValue: 'Full brain-cloud synchronization', group: 'Prediction 3' },
    { key: 'prediction3Confidence', label: 'Confidence 3', type: 'number', defaultValue: 41, min: 0, max: 100, group: 'Prediction 3' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#060a14', group: 'Style' },
    { key: 'accentColor', label: 'Accent', type: 'color', defaultValue: '#00FFFF', group: 'Style' },
    { key: 'textColor', label: 'Text Color', type: 'color', defaultValue: '#e0e4ea', group: 'Style' },
  ],
})
