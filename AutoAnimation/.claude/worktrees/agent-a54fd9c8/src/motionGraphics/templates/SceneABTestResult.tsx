import React from 'react'
import { registerMotionGraphic } from '../registry'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface SceneABTestResultConfig {
  testName: string
  variantALabel: string
  variantAValue: number
  variantBLabel: string
  variantBValue: number
  metric: string
  bgColor: string
  textColor: string
  colorA: string
  colorB: string
}

function easeOutCubic(t: number): number { return 1 - Math.pow(1 - t, 3) }
function easeInCubic(t: number): number { return t * t * t }
function elasticOut(t: number): number {
  if (t === 0 || t === 1) return t
  return Math.pow(2, -10 * t) * Math.sin((t - 0.075) * (2 * Math.PI) / 0.3) + 1
}

function SceneABTestResultComponent({ config, progress }: MotionGraphicProps<SceneABTestResultConfig>) {
  const { testName, variantALabel, variantAValue, variantBLabel, variantBValue, metric, bgColor, textColor, colorA, colorB } = config

  const enterProgress = progress < 0.25 ? progress / 0.25 : 1
  const holdProgress = progress >= 0.25 && progress < 0.8 ? (progress - 0.25) / 0.55 : progress >= 0.8 ? 1 : 0
  const exitProgress = progress >= 0.8 ? (progress - 0.8) / 0.2 : 0
  const exitOpacity = exitProgress > 0 ? 1 - easeInCubic(exitProgress) : 1

  const maxVal = Math.max(variantAValue, variantBValue) || 1
  const winner = variantAValue >= variantBValue ? 'A' : 'B'
  const winnerColor = winner === 'A' ? colorA : colorB
  const improvement = Math.abs(((variantBValue - variantAValue) / variantAValue) * 100)

  // Animated values
  const barAEnter = easeOutCubic(Math.max(0, Math.min(1, (enterProgress - 0.1) / 0.6)))
  const barBEnter = easeOutCubic(Math.max(0, Math.min(1, (enterProgress - 0.25) / 0.6)))
  const countA = variantAValue * barAEnter
  const countB = variantBValue * barBEnter

  // Winner badge
  const badgeEnter = elasticOut(Math.max(0, Math.min(1, (enterProgress - 0.7) / 0.3)))

  // Hold pulse
  const holdPulse = progress >= 0.25 && progress < 0.8 ? 1 + Math.sin(holdProgress * Math.PI * 4) * 0.01 : 1

  return (
    <div style={{ position: 'absolute', inset: 0, overflow: 'hidden' }}>
      <div style={{ position: 'absolute', inset: 0, background: bgColor }} />
      {/* VS divider line */}
      <div style={{
        position: 'absolute',
        top: '35%',
        bottom: '20%',
        left: '50%',
        width: 1,
        background: `${textColor}10`,
        transform: `scaleY(${easeOutCubic(enterProgress)})`,
        transformOrigin: 'center',
      }} />

      <div style={{
        position: 'absolute', inset: 0,
        display: 'flex', flexDirection: 'column',
        justifyContent: 'center', alignItems: 'center',
        padding: '6% 8%',
        opacity: exitOpacity,
      }}>
        {/* Test name */}
        <div style={{
          fontFamily: "'Inter', 'Helvetica Neue', sans-serif",
          fontSize: 'clamp(12px, 2.5vw, 20px)',
          fontWeight: 700,
          color: textColor,
          opacity: easeOutCubic(enterProgress),
          marginBottom: 'clamp(4px, 1vw, 10px)',
          letterSpacing: '-0.01em',
        }}>
          {testName}
        </div>
        {/* Metric label */}
        <div style={{
          fontFamily: "'Inter', sans-serif",
          fontSize: 'clamp(9px, 1.6vw, 12px)',
          fontWeight: 500,
          color: `${textColor}50`,
          textTransform: 'uppercase',
          letterSpacing: '0.1em',
          marginBottom: 'clamp(16px, 4vw, 36px)',
          opacity: easeOutCubic(enterProgress),
        }}>
          {metric}
        </div>

        {/* A/B comparison */}
        <div style={{
          display: 'flex',
          width: '100%',
          gap: 'clamp(16px, 4vw, 36px)',
          justifyContent: 'center',
          alignItems: 'flex-end',
          transform: `scale(${holdPulse})`,
        }}>
          {/* Variant A */}
          <div style={{
            flex: 1,
            maxWidth: 200,
            textAlign: 'center',
            opacity: barAEnter,
          }}>
            <div style={{
              fontFamily: "'Inter', sans-serif",
              fontSize: 'clamp(10px, 1.8vw, 14px)',
              fontWeight: 600,
              color: colorA,
              marginBottom: 'clamp(6px, 1.5vw, 12px)',
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
            }}>
              {variantALabel}
            </div>
            {/* Bar */}
            <div style={{
              width: '100%',
              background: `${textColor}08`,
              borderRadius: 'clamp(6px, 1vw, 10px)',
              overflow: 'hidden',
              height: 'clamp(100px, 25vw, 180px)',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'flex-end',
            }}>
              <div style={{
                height: `${(variantAValue / maxVal) * 100 * barAEnter}%`,
                background: `linear-gradient(180deg, ${colorA}, ${colorA}CC)`,
                borderRadius: 'clamp(6px, 1vw, 10px) clamp(6px, 1vw, 10px) 0 0',
                boxShadow: `0 -4px 16px ${colorA}20`,
                position: 'relative',
              }}>
                <div style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  height: '30%',
                  background: 'linear-gradient(180deg, rgba(255,255,255,0.12), transparent)',
                  borderRadius: 'inherit',
                }} />
              </div>
            </div>
            {/* Value */}
            <div style={{
              fontFamily: "'SF Mono', monospace",
              fontSize: 'clamp(18px, 4.5vw, 36px)',
              fontWeight: 800,
              color: colorA,
              marginTop: 'clamp(6px, 1.5vw, 12px)',
            }}>
              {countA.toFixed(1)}%
            </div>
          </div>

          {/* VS badge */}
          <div style={{
            fontFamily: "'Inter', sans-serif",
            fontSize: 'clamp(12px, 2.5vw, 20px)',
            fontWeight: 800,
            color: `${textColor}40`,
            alignSelf: 'center',
            opacity: easeOutCubic(Math.max(0, (enterProgress - 0.2) / 0.3)),
          }}>
            VS
          </div>

          {/* Variant B */}
          <div style={{
            flex: 1,
            maxWidth: 200,
            textAlign: 'center',
            opacity: barBEnter,
          }}>
            <div style={{
              fontFamily: "'Inter', sans-serif",
              fontSize: 'clamp(10px, 1.8vw, 14px)',
              fontWeight: 600,
              color: colorB,
              marginBottom: 'clamp(6px, 1.5vw, 12px)',
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
            }}>
              {variantBLabel}
            </div>
            <div style={{
              width: '100%',
              background: `${textColor}08`,
              borderRadius: 'clamp(6px, 1vw, 10px)',
              overflow: 'hidden',
              height: 'clamp(100px, 25vw, 180px)',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'flex-end',
            }}>
              <div style={{
                height: `${(variantBValue / maxVal) * 100 * barBEnter}%`,
                background: `linear-gradient(180deg, ${colorB}, ${colorB}CC)`,
                borderRadius: 'clamp(6px, 1vw, 10px) clamp(6px, 1vw, 10px) 0 0',
                boxShadow: `0 -4px 16px ${colorB}20`,
                position: 'relative',
              }}>
                <div style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  height: '30%',
                  background: 'linear-gradient(180deg, rgba(255,255,255,0.12), transparent)',
                  borderRadius: 'inherit',
                }} />
              </div>
            </div>
            <div style={{
              fontFamily: "'SF Mono', monospace",
              fontSize: 'clamp(18px, 4.5vw, 36px)',
              fontWeight: 800,
              color: colorB,
              marginTop: 'clamp(6px, 1.5vw, 12px)',
            }}>
              {countB.toFixed(1)}%
            </div>
          </div>
        </div>

        {/* Winner badge */}
        <div style={{
          marginTop: 'clamp(16px, 4vw, 32px)',
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          opacity: badgeEnter,
          transform: `scale(${badgeEnter})`,
        }}>
          <div style={{
            background: `${winnerColor}18`,
            border: `1px solid ${winnerColor}30`,
            borderRadius: 'clamp(6px, 1vw, 10px)',
            padding: 'clamp(6px, 1.5vw, 12px) clamp(12px, 3vw, 24px)',
            display: 'flex',
            alignItems: 'center',
            gap: 8,
          }}>
            <span style={{ fontSize: 'clamp(12px, 2.5vw, 18px)' }}>{'\u2713'}</span>
            <span style={{
              fontFamily: "'Inter', sans-serif",
              fontSize: 'clamp(10px, 2vw, 15px)',
              fontWeight: 700,
              color: winnerColor,
            }}>
              {winner === 'A' ? variantALabel : variantBLabel} wins by {improvement.toFixed(1)}%
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}

registerMotionGraphic({
  id: 'tpl-scene-ab-test-result',
  title: 'A/B Test Result',
  description: 'A/B test comparison with side-by-side animated bar charts, VS divider, counting values, and winner badge with elastic entrance.',
  tags: ['scene', 'ab-test', 'comparison', 'analytics', 'marketing', 'conversion', 'testing'],
  category: 'scene-layout',
  component: SceneABTestResultComponent as any,
  defaultConfig: {
    testName: 'Homepage CTA Button Test',
    variantALabel: 'Control (A)',
    variantAValue: 3.2,
    variantBLabel: 'Variant (B)',
    variantBValue: 4.7,
    metric: 'Click-Through Rate',
    colorA: '#6366F1',
    colorB: '#10B981',
    bgColor: '#0f172a',
    textColor: '#e2e8f0',
  },
  configSchema: [
    { key: 'testName', label: 'Test Name', type: 'text', defaultValue: 'Homepage CTA Button Test', group: 'Content' },
    { key: 'variantALabel', label: 'Variant A Label', type: 'text', defaultValue: 'Control (A)', group: 'Content' },
    { key: 'variantAValue', label: 'Variant A Value', type: 'number', defaultValue: 3.2, min: 0, max: 100, group: 'Content' },
    { key: 'variantBLabel', label: 'Variant B Label', type: 'text', defaultValue: 'Variant (B)', group: 'Content' },
    { key: 'variantBValue', label: 'Variant B Value', type: 'number', defaultValue: 4.7, min: 0, max: 100, group: 'Content' },
    { key: 'metric', label: 'Metric Name', type: 'text', defaultValue: 'Click-Through Rate', group: 'Content' },
    { key: 'colorA', label: 'Variant A Color', type: 'color', defaultValue: '#6366F1', group: 'Style' },
    { key: 'colorB', label: 'Variant B Color', type: 'color', defaultValue: '#10B981', group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#0f172a', group: 'Style' },
    { key: 'textColor', label: 'Text Color', type: 'color', defaultValue: '#e2e8f0', group: 'Style' },
  ],
})
