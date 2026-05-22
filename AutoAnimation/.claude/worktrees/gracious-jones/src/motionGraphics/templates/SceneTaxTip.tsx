import React from 'react'
import { registerMotionGraphic } from '../registry'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface SceneTaxTipConfig {
  tipText: string
  taxYear: string
  savingsPotential: string
  bgColor: string
  textColor: string
  accentColor: string
}

function easeOutCubic(t: number): number { return 1 - Math.pow(1 - t, 3) }
function easeInCubic(t: number): number { return t * t * t }
function easeOutBack(t: number): number {
  const c1 = 1.70158
  const c3 = c1 + 1
  return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2)
}

function SceneTaxTipComponent({ config, progress }: MotionGraphicProps<SceneTaxTipConfig>) {
  const { tipText, taxYear, savingsPotential, bgColor, textColor, accentColor } = config

  const enterProgress = progress < 0.2 ? progress / 0.2 : 1
  const holdProgress = progress >= 0.2 && progress < 0.8 ? (progress - 0.2) / 0.6 : progress >= 0.8 ? 1 : 0
  const exitProgress = progress >= 0.8 ? (progress - 0.8) / 0.2 : 0

  const exitOpacity = exitProgress > 0 ? 1 - easeInCubic(exitProgress) : 1

  // Header pop animation
  const headerScale = easeOutBack(Math.min(1, enterProgress / 0.6))
  const headerOpacity = easeOutCubic(Math.min(1, enterProgress / 0.4))

  // Tip text slide
  const tipSlideY = (1 - easeOutCubic(Math.max(0, (enterProgress - 0.3) / 0.7))) * 30
  const tipOpacity = easeOutCubic(Math.max(0, (enterProgress - 0.3) / 0.7))

  // Hold: subtle glow pulse on icon
  const isHolding = progress >= 0.2 && progress < 0.8
  const glowIntensity = isHolding ? 0.3 + Math.sin(holdProgress * Math.PI * 4) * 0.15 : 0.3

  return (
    <div style={{ position: 'absolute', inset: 0, overflow: 'hidden' }}>
      <div style={{ position: 'absolute', inset: 0, background: bgColor }} />

      {/* Subtle diagonal accent line */}
      <div style={{
        position: 'absolute', top: 0, right: 0,
        width: '40%', height: '100%',
        background: `linear-gradient(135deg, transparent, ${accentColor}05)`,
        opacity: easeOutCubic(enterProgress),
      }} />

      <div style={{
        position: 'absolute', inset: 0,
        display: 'flex', flexDirection: 'column',
        justifyContent: 'center', alignItems: 'center',
        padding: '8% 10%',
        opacity: exitOpacity,
      }}>
        {/* Card */}
        <div style={{
          background: `${textColor}04`,
          borderRadius: 'clamp(14px, 3.5vw, 24px)',
          padding: 'clamp(24px, 6vw, 48px)',
          border: `1px solid ${accentColor}20`,
          width: 'clamp(280px, 75vw, 500px)',
          boxShadow: `0 0 40px ${accentColor}08`,
        }}>
          {/* Header: TAX TIP */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: 'clamp(8px, 2vw, 14px)',
            marginBottom: 'clamp(16px, 4vw, 28px)',
            opacity: headerOpacity,
            transform: `scale(${headerScale})`,
            transformOrigin: 'left center',
          }}>
            <div style={{
              width: 'clamp(36px, 8vw, 52px)',
              height: 'clamp(36px, 8vw, 52px)',
              borderRadius: 'clamp(8px, 2vw, 14px)',
              background: `linear-gradient(135deg, ${accentColor}25, ${accentColor}10)`,
              display: 'flex', justifyContent: 'center', alignItems: 'center',
              fontSize: 'clamp(18px, 4vw, 26px)',
              boxShadow: `0 0 ${20 * glowIntensity}px ${accentColor}${Math.round(glowIntensity * 60).toString(16).padStart(2, '0')}`,
            }}>
              {'\ud83d\udca1'}
            </div>
            <div style={{
              fontFamily: "'Inter', 'Helvetica Neue', sans-serif",
              fontSize: 'clamp(18px, 4vw, 30px)',
              fontWeight: 800,
              color: accentColor,
              letterSpacing: '0.04em',
              textTransform: 'uppercase',
            }}>
              Tax Tip
            </div>
          </div>

          {/* Tip text */}
          <div style={{
            fontFamily: "'Inter', 'Helvetica Neue', sans-serif",
            fontSize: 'clamp(14px, 3vw, 22px)',
            fontWeight: 500,
            color: textColor,
            lineHeight: 1.6,
            marginBottom: 'clamp(16px, 4vw, 28px)',
            opacity: tipOpacity,
            transform: `translateY(${tipSlideY}px)`,
          }}>
            {tipText}
          </div>

          {/* Footer: tax year + savings */}
          <div style={{
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            borderTop: `1px solid ${textColor}10`,
            paddingTop: 'clamp(10px, 2.5vw, 18px)',
            opacity: easeOutCubic(Math.max(0, (enterProgress - 0.5) / 0.5)),
          }}>
            <div style={{
              fontFamily: "'Inter', sans-serif",
              fontSize: 'clamp(10px, 2vw, 14px)',
              fontWeight: 600,
              color: `${textColor}50`,
              background: `${textColor}06`,
              padding: '3px 10px',
              borderRadius: 6,
            }}>
              {taxYear}
            </div>
            <div style={{
              display: 'flex', alignItems: 'center', gap: 6,
            }}>
              <span style={{
                fontFamily: "'Inter', sans-serif",
                fontSize: 'clamp(10px, 1.8vw, 13px)',
                fontWeight: 500,
                color: `${textColor}50`,
              }}>
                Potential savings:
              </span>
              <span style={{
                fontFamily: "'SF Mono', monospace",
                fontSize: 'clamp(13px, 2.5vw, 18px)',
                fontWeight: 700,
                color: '#00c087',
              }}>
                {savingsPotential}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

registerMotionGraphic({
  id: 'tpl-scene-tax-tip',
  title: 'Tax Tip',
  description: 'Professional tax tip card with header pop animation, tip text slide, and potential savings indicator',
  tags: ['scene', 'finance', 'tax', 'tip', 'advice', 'money', 'savings'],
  category: 'scene-layout',
  component: SceneTaxTipComponent as any,
  defaultConfig: {
    tipText: 'Max out your 401(k) contributions before year-end to reduce taxable income by up to $23,000.',
    taxYear: 'Tax Year 2024',
    savingsPotential: 'Up to $5,520',
    bgColor: '#0f172a',
    textColor: '#e2e8f0',
    accentColor: '#3b82f6',
  },
  configSchema: [
    { key: 'tipText', label: 'Tip Text', type: 'text', defaultValue: 'Max out your 401(k) contributions before year-end to reduce taxable income by up to $23,000.', group: 'Content' },
    { key: 'taxYear', label: 'Tax Year', type: 'text', defaultValue: 'Tax Year 2024', group: 'Content' },
    { key: 'savingsPotential', label: 'Savings Potential', type: 'text', defaultValue: 'Up to $5,520', group: 'Content' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#0f172a', group: 'Style' },
    { key: 'textColor', label: 'Text Color', type: 'color', defaultValue: '#e2e8f0', group: 'Style' },
    { key: 'accentColor', label: 'Accent Color', type: 'color', defaultValue: '#3b82f6', group: 'Style' },
  ],
})
