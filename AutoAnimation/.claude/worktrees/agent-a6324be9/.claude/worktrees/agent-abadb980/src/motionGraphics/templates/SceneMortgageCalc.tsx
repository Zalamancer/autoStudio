import React from 'react'
import { registerMotionGraphic } from '../registry'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface MortgageCalcConfig {
  monthlyPayment: number
  principalAmount: number
  interestAmount: number
  taxAmount: number
  insuranceAmount: number
  bgColor: string
  textColor: string
  principalColor: string
  interestColor: string
  taxColor: string
  insuranceColor: string
}

function easeOutCubic(t: number): number { return 1 - Math.pow(1 - t, 3) }
function easeInCubic(t: number): number { return t * t * t }

function SceneMortgageCalcComponent({ config, progress }: MotionGraphicProps<MortgageCalcConfig>) {
  const {
    monthlyPayment, principalAmount, interestAmount, taxAmount, insuranceAmount,
    bgColor, textColor, principalColor, interestColor, taxColor, insuranceColor,
  } = config

  const enterProgress = progress < 0.25 ? progress / 0.25 : 1
  const holdProgress = progress >= 0.25 && progress < 0.8 ? (progress - 0.25) / 0.55 : progress >= 0.8 ? 1 : 0
  const exitProgress = progress >= 0.8 ? (progress - 0.8) / 0.2 : 0

  const exitEased = easeInCubic(exitProgress)
  const exitOpacity = 1 - exitEased

  // Header fades in
  const headerOpacity = easeOutCubic(Math.min(1, enterProgress / 0.3))

  // Monthly payment counts up
  const paymentReveal = enterProgress > 0.15
    ? easeOutCubic(Math.min(1, (enterProgress - 0.15) / 0.4))
    : 0
  const displayPayment = Math.round(monthlyPayment * paymentReveal)

  // Bar fills with segments
  const barProgress = enterProgress > 0.35
    ? easeOutCubic(Math.min(1, (enterProgress - 0.35) / 0.4))
    : 0

  const total = principalAmount + interestAmount + taxAmount + insuranceAmount
  const segments = [
    { label: 'Principal', amount: principalAmount, color: principalColor },
    { label: 'Interest', amount: interestAmount, color: interestColor },
    { label: 'Tax', amount: taxAmount, color: taxColor },
    { label: 'Insurance', amount: insuranceAmount, color: insuranceColor },
  ]

  // Legend items stagger
  const getLegendProgress = (idx: number): number => {
    const start = 0.5 + idx * 0.1
    return enterProgress > start ? easeOutCubic(Math.min(1, (enterProgress - start) / 0.25)) : 0
  }

  // Shimmer on bar during hold
  const shimmerX = holdProgress > 0 ? (holdProgress * 250 - 50) : -50

  return (
    <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', background: bgColor, fontFamily: "'Helvetica Neue', Arial, sans-serif" }}>
      {/* Subtle diagonal lines */}
      <div style={{
        position: 'absolute',
        inset: 0,
        backgroundImage: `repeating-linear-gradient(45deg, ${textColor}03 0, ${textColor}03 1px, transparent 1px, transparent 20px)`,
      }} />

      <div style={{
        position: 'absolute',
        inset: 0,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '8% 10%',
        opacity: exitOpacity,
        transform: `translateY(${exitEased * -30}px)`,
      }}>
        {/* Header */}
        <div style={{
          fontSize: 'clamp(11px, 1.6vw, 14px)',
          fontWeight: 700,
          color: `${textColor}88`,
          textTransform: 'uppercase',
          letterSpacing: 2,
          opacity: headerOpacity,
          marginBottom: 'clamp(6px, 1vw, 10px)',
        }}>
          Monthly Payment
        </div>

        {/* Monthly payment total */}
        <div style={{
          fontSize: 'clamp(36px, 8vw, 64px)',
          fontWeight: 900,
          color: textColor,
          lineHeight: 1,
          marginBottom: 'clamp(24px, 5vw, 40px)',
          opacity: paymentReveal,
        }}>
          ${displayPayment.toLocaleString()}
        </div>

        {/* Segmented bar */}
        <div style={{
          width: '100%',
          maxWidth: 'clamp(280px, 65vw, 480px)',
          height: 'clamp(24px, 4.5vw, 40px)',
          borderRadius: 'clamp(12px, 2.5vw, 20px)',
          overflow: 'hidden',
          display: 'flex',
          marginBottom: 'clamp(20px, 4vw, 36px)',
          position: 'relative',
          background: `${textColor}10`,
        }}>
          {segments.map((seg, i) => {
            const pct = total > 0 ? (seg.amount / total) * 100 : 25
            return (
              <div key={i} style={{
                width: `${pct * barProgress}%`,
                height: '100%',
                background: seg.color,
                transition: 'none',
                position: 'relative',
                overflow: 'hidden',
              }}>
                {/* Shimmer overlay */}
                {holdProgress > 0 && (
                  <div style={{
                    position: 'absolute',
                    top: 0,
                    left: `${shimmerX - i * 20}%`,
                    width: '30%',
                    height: '100%',
                    background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.15), transparent)',
                  }} />
                )}
              </div>
            )
          })}
        </div>

        {/* Legend */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: 'clamp(8px, 1.5vw, 14px) clamp(16px, 3vw, 28px)',
          width: '100%',
          maxWidth: 'clamp(280px, 65vw, 480px)',
        }}>
          {segments.map((seg, i) => {
            const lp = getLegendProgress(i)
            const pct = total > 0 ? Math.round((seg.amount / total) * 100) : 25
            return (
              <div key={i} style={{
                display: 'flex',
                alignItems: 'center',
                gap: 'clamp(6px, 1.2vw, 10px)',
                opacity: lp,
                transform: `translateY(${(1 - lp) * 12}px)`,
              }}>
                {/* Color dot */}
                <div style={{
                  width: 'clamp(8px, 1.5vw, 12px)',
                  height: 'clamp(8px, 1.5vw, 12px)',
                  borderRadius: '50%',
                  background: seg.color,
                  flexShrink: 0,
                }} />
                <div>
                  <div style={{
                    fontSize: 'clamp(10px, 1.5vw, 13px)',
                    fontWeight: 600,
                    color: `${textColor}BB`,
                  }}>
                    {seg.label}
                  </div>
                  <div style={{
                    fontSize: 'clamp(12px, 2vw, 16px)',
                    fontWeight: 800,
                    color: textColor,
                  }}>
                    ${Math.round(seg.amount * lp).toLocaleString()} <span style={{ fontSize: '0.7em', color: `${textColor}66`, fontWeight: 500 }}>({pct}%)</span>
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
  id: 'tpl-scene-mortgage-calc',
  title: 'Mortgage Calculator',
  description: 'Mortgage breakdown with animated total payment counter, colored segmented bar for principal/interest/tax/insurance, and legend.',
  tags: ['scene', 'real-estate', 'mortgage', 'calculator', 'finance', 'payment'],
  category: 'scene-layout',
  component: SceneMortgageCalcComponent as any,
  defaultConfig: {
    monthlyPayment: 3247,
    principalAmount: 1850,
    interestAmount: 920,
    taxAmount: 310,
    insuranceAmount: 167,
    bgColor: '#0B1422',
    textColor: '#E2ECF5',
    principalColor: '#3B82F6',
    interestColor: '#F59E0B',
    taxColor: '#EF4444',
    insuranceColor: '#8B5CF6',
  },
  configSchema: [
    { key: 'monthlyPayment', label: 'Monthly Payment ($)', type: 'number', defaultValue: 3247, min: 0, max: 100000, group: 'Content' },
    { key: 'principalAmount', label: 'Principal ($)', type: 'number', defaultValue: 1850, min: 0, max: 100000, group: 'Content' },
    { key: 'interestAmount', label: 'Interest ($)', type: 'number', defaultValue: 920, min: 0, max: 100000, group: 'Content' },
    { key: 'taxAmount', label: 'Tax ($)', type: 'number', defaultValue: 310, min: 0, max: 100000, group: 'Content' },
    { key: 'insuranceAmount', label: 'Insurance ($)', type: 'number', defaultValue: 167, min: 0, max: 100000, group: 'Content' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#0B1422', group: 'Style' },
    { key: 'textColor', label: 'Text Color', type: 'color', defaultValue: '#E2ECF5', group: 'Style' },
    { key: 'principalColor', label: 'Principal Color', type: 'color', defaultValue: '#3B82F6', group: 'Style' },
    { key: 'interestColor', label: 'Interest Color', type: 'color', defaultValue: '#F59E0B', group: 'Style' },
    { key: 'taxColor', label: 'Tax Color', type: 'color', defaultValue: '#EF4444', group: 'Style' },
    { key: 'insuranceColor', label: 'Insurance Color', type: 'color', defaultValue: '#8B5CF6', group: 'Style' },
  ],
})
