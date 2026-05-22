import React from 'react'
import { registerMotionGraphic } from '../registry'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface PropertyStatsConfig {
  stat1Label: string
  stat1Value: number
  stat1Suffix: string
  stat2Label: string
  stat2Value: number
  stat2Suffix: string
  stat3Label: string
  stat3Value: number
  stat3Suffix: string
  stat4Label: string
  stat4Value: number
  stat4Suffix: string
  bgColor: string
  textColor: string
  accentColor: string
  cardColor: string
}

function easeOutCubic(t: number): number { return 1 - Math.pow(1 - t, 3) }
function easeInCubic(t: number): number { return t * t * t }

function ScenePropertyStatsComponent({ config, progress }: MotionGraphicProps<PropertyStatsConfig>) {
  const {
    stat1Label, stat1Value, stat1Suffix,
    stat2Label, stat2Value, stat2Suffix,
    stat3Label, stat3Value, stat3Suffix,
    stat4Label, stat4Value, stat4Suffix,
    bgColor, textColor, accentColor, cardColor,
  } = config

  const enterProgress = progress < 0.25 ? progress / 0.25 : 1
  const holdProgress = progress >= 0.25 && progress < 0.8 ? (progress - 0.25) / 0.55 : progress >= 0.8 ? 1 : 0
  const exitProgress = progress >= 0.8 ? (progress - 0.8) / 0.2 : 0

  const exitEased = easeInCubic(exitProgress)
  const exitOpacity = 1 - exitEased

  const stats = [
    { label: stat1Label, value: stat1Value, suffix: stat1Suffix, icon: '\uD83D\uDCD0' },
    { label: stat2Label, value: stat2Value, suffix: stat2Suffix, icon: '\uD83D\uDECF\uFE0F' },
    { label: stat3Label, value: stat3Value, suffix: stat3Suffix, icon: '\uD83D\uDCC5' },
    { label: stat4Label, value: stat4Value, suffix: stat4Suffix, icon: '\uD83C\uDFE1' },
  ]

  const getCardProgress = (idx: number): number => {
    const row = Math.floor(idx / 2)
    const col = idx % 2
    const start = 0.1 + row * 0.15 + col * 0.08
    return enterProgress > start ? easeOutCubic(Math.min(1, (enterProgress - start) / 0.35)) : 0
  }

  // Shimmer effect during hold
  const shimmerX = holdProgress > 0 ? (holdProgress * 300 - 100) : -100

  return (
    <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', background: bgColor, fontFamily: "'Helvetica Neue', Arial, sans-serif" }}>
      {/* Subtle grid pattern */}
      <div style={{
        position: 'absolute',
        inset: 0,
        backgroundImage: `linear-gradient(${textColor}06 1px, transparent 1px), linear-gradient(90deg, ${textColor}06 1px, transparent 1px)`,
        backgroundSize: 'clamp(30px, 6vw, 50px) clamp(30px, 6vw, 50px)',
        opacity: 0.5,
      }} />

      <div style={{
        position: 'absolute',
        inset: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '8%',
        opacity: exitOpacity,
        transform: `scale(${1 - exitEased * 0.05})`,
      }}>
        {/* 2x2 grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: 'clamp(10px, 2vw, 20px)',
          width: '100%',
          maxWidth: 'clamp(300px, 70vw, 550px)',
        }}>
          {stats.map((stat, i) => {
            const cp = getCardProgress(i)
            const counterValue = Math.round(stat.value * cp)
            return (
              <div key={i} style={{
                background: cardColor,
                borderRadius: 'clamp(8px, 1.5vw, 16px)',
                padding: 'clamp(14px, 3vw, 28px)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 'clamp(6px, 1.2vw, 12px)',
                opacity: cp,
                transform: `translateY(${(1 - cp) * 25}px) scale(${0.9 + cp * 0.1})`,
                border: `1px solid ${accentColor}20`,
                position: 'relative',
                overflow: 'hidden',
              }}>
                {/* Shimmer */}
                {holdProgress > 0 && (
                  <div style={{
                    position: 'absolute',
                    top: 0,
                    left: `${shimmerX - i * 30}%`,
                    width: '40%',
                    height: '100%',
                    background: `linear-gradient(90deg, transparent, ${accentColor}08, transparent)`,
                    pointerEvents: 'none',
                  }} />
                )}

                {/* Icon */}
                <div style={{
                  fontSize: 'clamp(20px, 4vw, 36px)',
                }}>
                  {stat.icon}
                </div>

                {/* Value */}
                <div style={{
                  fontSize: 'clamp(22px, 5vw, 40px)',
                  fontWeight: 900,
                  color: accentColor,
                  lineHeight: 1,
                }}>
                  {counterValue.toLocaleString()}{stat.suffix}
                </div>

                {/* Label */}
                <div style={{
                  fontSize: 'clamp(10px, 1.5vw, 13px)',
                  fontWeight: 600,
                  color: `${textColor}99`,
                  textTransform: 'uppercase',
                  letterSpacing: 1,
                  textAlign: 'center',
                }}>
                  {stat.label}
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
  id: 'tpl-scene-property-stats',
  title: 'Property Stats',
  description: 'Property stats in a 2x2 grid with icons and animated counters. Clean modern layout with staggered card reveals.',
  tags: ['scene', 'real-estate', 'stats', 'property', 'data', 'features'],
  category: 'scene-layout',
  component: ScenePropertyStatsComponent as any,
  defaultConfig: {
    stat1Label: 'Square Feet',
    stat1Value: 3200,
    stat1Suffix: '',
    stat2Label: 'Bedrooms',
    stat2Value: 4,
    stat2Suffix: '',
    stat3Label: 'Year Built',
    stat3Value: 2019,
    stat3Suffix: '',
    stat4Label: 'Lot Size',
    stat4Value: 8500,
    stat4Suffix: ' sqft',
    bgColor: '#0C1117',
    textColor: '#C8D6E5',
    accentColor: '#38B2AC',
    cardColor: '#151E29',
  },
  configSchema: [
    { key: 'stat1Label', label: 'Stat 1 Label', type: 'text', defaultValue: 'Square Feet', group: 'Content' },
    { key: 'stat1Value', label: 'Stat 1 Value', type: 'number', defaultValue: 3200, min: 0, max: 10000000, group: 'Content' },
    { key: 'stat1Suffix', label: 'Stat 1 Suffix', type: 'text', defaultValue: '', group: 'Content' },
    { key: 'stat2Label', label: 'Stat 2 Label', type: 'text', defaultValue: 'Bedrooms', group: 'Content' },
    { key: 'stat2Value', label: 'Stat 2 Value', type: 'number', defaultValue: 4, min: 0, max: 10000000, group: 'Content' },
    { key: 'stat2Suffix', label: 'Stat 2 Suffix', type: 'text', defaultValue: '', group: 'Content' },
    { key: 'stat3Label', label: 'Stat 3 Label', type: 'text', defaultValue: 'Year Built', group: 'Content' },
    { key: 'stat3Value', label: 'Stat 3 Value', type: 'number', defaultValue: 2019, min: 0, max: 10000000, group: 'Content' },
    { key: 'stat3Suffix', label: 'Stat 3 Suffix', type: 'text', defaultValue: '', group: 'Content' },
    { key: 'stat4Label', label: 'Stat 4 Label', type: 'text', defaultValue: 'Lot Size', group: 'Content' },
    { key: 'stat4Value', label: 'Stat 4 Value', type: 'number', defaultValue: 8500, min: 0, max: 10000000, group: 'Content' },
    { key: 'stat4Suffix', label: 'Stat 4 Suffix', type: 'text', defaultValue: ' sqft', group: 'Content' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#0C1117', group: 'Style' },
    { key: 'textColor', label: 'Text Color', type: 'color', defaultValue: '#C8D6E5', group: 'Style' },
    { key: 'accentColor', label: 'Accent Color', type: 'color', defaultValue: '#38B2AC', group: 'Style' },
    { key: 'cardColor', label: 'Card Background', type: 'color', defaultValue: '#151E29', group: 'Style' },
  ],
})
