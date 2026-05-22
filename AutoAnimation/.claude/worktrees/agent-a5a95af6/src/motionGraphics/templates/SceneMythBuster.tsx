import React from 'react'
import { registerMotionGraphic } from '../registry'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface MythBusterConfig {
  mythText: string
  realityText: string
  stampColor: string
  bgColor: string
  textColor: string
}

function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3)
}

function easeOutBack(t: number): number {
  const c1 = 1.70158
  const c3 = c1 + 1
  return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2)
}

function elasticOut(t: number): number {
  if (t === 0 || t === 1) return t
  return Math.pow(2, -10 * t) * Math.sin((t - 0.075) * (2 * Math.PI) / 0.3) + 1
}

function SceneMythBusterComponent({
  config,
  frame,
  durationInFrames,
}: MotionGraphicProps<MythBusterConfig>) {
  const { mythText, realityText, stampColor, bgColor, textColor } = config
  const progress = frame / durationInFrames

  // Myth text fades in (0-0.15)
  const mythProgress = easeOutCubic(Math.min(1, progress / 0.15))

  // X stamp slams down (0.2-0.35)
  const stampStart = 0.2
  const stampEnd = 0.35
  const stampRaw = Math.max(0, Math.min(1, (progress - stampStart) / (stampEnd - stampStart)))
  const stampProgress = elasticOut(stampRaw)
  const stampScale = stampProgress > 0 ? 0.5 + stampProgress * 0.5 : 0
  const stampRotation = stampProgress > 0 ? -15 + stampProgress * 15 : -15
  const stampOpacity = stampRaw > 0 ? Math.min(1, stampRaw * 3) : 0

  // "MYTH:" label
  const mythLabelProgress = easeOutCubic(Math.max(0, Math.min(1, (progress - 0.05) / 0.1)))

  // Reality text slides up (0.4-0.55)
  const realityStart = 0.4
  const realityEnd = 0.55
  const realityProgress = easeOutCubic(Math.max(0, Math.min(1, (progress - realityStart) / (realityEnd - realityStart))))
  const realitySlideY = (1 - realityProgress) * 50

  // "REALITY:" label
  const realityLabelProgress = easeOutCubic(Math.max(0, Math.min(1, (progress - 0.38) / 0.1)))

  // Hold: stamp shakes subtly (0.55-0.8)
  const holdProgress = progress >= 0.55 && progress < 0.8 ? (progress - 0.55) / 0.25 : 0
  const stampShake = holdProgress > 0 ? Math.sin(holdProgress * Math.PI * 12) * 2 : 0

  // Reality text glow
  const realityGlow = holdProgress > 0 ? 0.5 + 0.5 * Math.sin(holdProgress * Math.PI * 4) : 0

  // Exit: slides down (0.83-1.0)
  const exitProgress = progress >= 0.83 ? easeOutCubic((progress - 0.83) / 0.17) : 0
  const exitSlideY = exitProgress * 80
  const exitOpacity = 1 - exitProgress

  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        background: bgColor,
        overflow: 'hidden',
        fontFamily: "'Helvetica Neue', Arial, sans-serif",
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        padding: '6% 8%',
        transform: `translateY(${exitSlideY}px)`,
        opacity: exitOpacity,
      }}
    >
      {/* MYTH section */}
      <div style={{ position: 'relative', marginBottom: '8%' }}>
        {/* MYTH label */}
        <div
          style={{
            fontSize: 'clamp(12px, 2vw, 18px)',
            fontWeight: 700,
            color: stampColor,
            textTransform: 'uppercase',
            letterSpacing: 4,
            marginBottom: '2%',
            opacity: mythLabelProgress,
          }}
        >
          Myth
        </div>

        {/* Myth text */}
        <div
          style={{
            fontSize: 'clamp(20px, 4.5vw, 40px)',
            fontWeight: 600,
            color: `${textColor}${stampProgress > 0.5 ? '60' : 'FF'}`,
            lineHeight: 1.4,
            opacity: mythProgress,
            textDecoration: stampProgress > 0.5 ? 'line-through' : 'none',
            textDecorationColor: stampColor,
          }}
        >
          {mythText}
        </div>

        {/* X Stamp overlay */}
        <div
          style={{
            position: 'absolute',
            top: '50%',
            right: '5%',
            transform: `translate(0, -50%) scale(${stampScale}) rotate(${stampRotation + stampShake}deg)`,
            opacity: stampOpacity,
            zIndex: 10,
          }}
        >
          <div
            style={{
              width: 'clamp(60px, 12vw, 110px)',
              height: 'clamp(60px, 12vw, 110px)',
              borderRadius: '50%',
              border: `4px solid ${stampColor}`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 'clamp(30px, 7vw, 60px)',
              fontWeight: 900,
              color: stampColor,
              background: `${stampColor}15`,
              boxShadow: `0 0 20px ${stampColor}40`,
            }}
          >
            {'\u2717'}
          </div>
        </div>
      </div>

      {/* Divider */}
      <div
        style={{
          width: `${realityProgress * 100}%`,
          height: 2,
          background: `linear-gradient(90deg, ${stampColor}40, #27AE6040)`,
          marginBottom: '6%',
          borderRadius: 1,
        }}
      />

      {/* REALITY section */}
      <div>
        {/* REALITY label */}
        <div
          style={{
            fontSize: 'clamp(12px, 2vw, 18px)',
            fontWeight: 700,
            color: '#27AE60',
            textTransform: 'uppercase',
            letterSpacing: 4,
            marginBottom: '2%',
            opacity: realityLabelProgress,
            display: 'flex',
            alignItems: 'center',
            gap: 'clamp(6px, 1vw, 10px)',
          }}
        >
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 'clamp(18px, 3vw, 26px)',
              height: 'clamp(18px, 3vw, 26px)',
              borderRadius: '50%',
              background: '#27AE6025',
              fontSize: 'clamp(10px, 1.8vw, 16px)',
            }}
          >
            {'\u2713'}
          </span>
          Reality
        </div>

        {/* Reality text */}
        <div
          style={{
            fontSize: 'clamp(20px, 4.5vw, 40px)',
            fontWeight: 600,
            color: textColor,
            lineHeight: 1.4,
            opacity: realityProgress,
            transform: `translateY(${realitySlideY}px)`,
            textShadow: realityGlow > 0 ? `0 0 ${realityGlow * 15}px #27AE6040` : 'none',
          }}
        >
          {realityText}
        </div>
      </div>
    </div>
  )
}

registerMotionGraphic({
  id: 'tpl-scene-myth-buster',
  title: 'Myth Buster',
  description:
    'Myth busting format with X stamp slam effect, reality reveal, stamp shake, and slide-down exit',
  tags: ['scene', 'educational', 'myth', 'fact-check', 'debunk'],
  category: 'scene-layout',
  component: SceneMythBusterComponent as unknown as React.ComponentType<MotionGraphicProps>,
  configSchema: [
    { key: 'mythText', label: 'Myth Text', type: 'text', defaultValue: 'You need to drink 8 glasses of water per day.', group: 'Content' },
    { key: 'realityText', label: 'Reality Text', type: 'text', defaultValue: 'Water needs vary by individual. Listen to your body and drink when thirsty.', group: 'Content' },
    { key: 'stampColor', label: 'Stamp Color', type: 'color', defaultValue: '#E74C3C', group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#0F0F1A', group: 'Style' },
    { key: 'textColor', label: 'Text Color', type: 'color', defaultValue: '#E8E8E8', group: 'Style' },
  ],
  defaultConfig: {
    mythText: 'You need to drink 8 glasses of water per day.',
    realityText: 'Water needs vary by individual. Listen to your body and drink when thirsty.',
    stampColor: '#E74C3C',
    bgColor: '#0F0F1A',
    textColor: '#E8E8E8',
  },
})
