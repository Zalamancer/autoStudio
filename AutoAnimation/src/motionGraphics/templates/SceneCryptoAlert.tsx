import React from 'react'
import { registerMotionGraphic } from '../registry'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface SceneCryptoAlertConfig {
  coinName: string
  alertCondition: string
  currentPrice: number
  recommendation: string
  bgColor: string
  textColor: string
  alertColor: string
}

function easeOutCubic(t: number): number { return 1 - Math.pow(1 - t, 3) }
function easeInCubic(t: number): number { return t * t * t }
function easeOutBack(t: number): number {
  const c1 = 1.70158
  const c3 = c1 + 1
  return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2)
}

function formatPrice(n: number): string {
  return '$' + n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

function SceneCryptoAlertComponent({ config, progress }: MotionGraphicProps<SceneCryptoAlertConfig>) {
  const { coinName, alertCondition, currentPrice, recommendation, bgColor, textColor, alertColor } = config

  const enterProgress = progress < 0.2 ? progress / 0.2 : 1
  const holdProgress = progress >= 0.2 && progress < 0.8 ? (progress - 0.2) / 0.6 : progress >= 0.8 ? 1 : 0
  const exitProgress = progress >= 0.8 ? (progress - 0.8) / 0.2 : 0

  const exitOpacity = exitProgress > 0 ? 1 - easeInCubic(exitProgress) : 1

  // Alert banner flash
  const bannerFlash = enterProgress < 0.5
    ? Math.sin(enterProgress * Math.PI * 6) * 0.3 + 0.7
    : 1
  const bannerScale = easeOutBack(Math.min(1, enterProgress / 0.4))

  // Info reveal staggered
  const infoReveal1 = easeOutCubic(Math.max(0, (enterProgress - 0.3) / 0.7))
  const infoReveal2 = easeOutCubic(Math.max(0, (enterProgress - 0.45) / 0.55))
  const infoReveal3 = easeOutCubic(Math.max(0, (enterProgress - 0.6) / 0.4))

  // Hold: alert border pulse
  const isHolding = progress >= 0.2 && progress < 0.8
  const borderPulse = isHolding
    ? 0.15 + Math.sin(holdProgress * Math.PI * 6) * 0.1
    : 0.15

  return (
    <div style={{ position: 'absolute', inset: 0, overflow: 'hidden' }}>
      <div style={{ position: 'absolute', inset: 0, background: bgColor }} />

      {/* Radial glow behind card */}
      <div style={{
        position: 'absolute', top: '50%', left: '50%',
        width: '80%', height: '80%',
        transform: 'translate(-50%, -50%)',
        background: `radial-gradient(circle, ${alertColor}08, transparent 70%)`,
        opacity: easeOutCubic(enterProgress),
      }} />

      <div style={{
        position: 'absolute', inset: 0,
        display: 'flex', flexDirection: 'column',
        justifyContent: 'center', alignItems: 'center',
        padding: '8%',
        opacity: exitOpacity,
      }}>
        {/* Card */}
        <div style={{
          background: `linear-gradient(145deg, #1a1e2e, #12151f)`,
          borderRadius: 'clamp(14px, 3.5vw, 24px)',
          padding: 'clamp(22px, 5.5vw, 44px)',
          border: `2px solid ${alertColor}${Math.round(borderPulse * 255).toString(16).padStart(2, '0')}`,
          width: 'clamp(280px, 72vw, 480px)',
          boxShadow: `0 0 30px ${alertColor}10, inset 0 1px 0 rgba(255,255,255,0.03)`,
          opacity: easeOutCubic(enterProgress),
        }}>
          {/* Alert banner */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: 'clamp(6px, 1.5vw, 12px)',
            marginBottom: 'clamp(16px, 4vw, 28px)',
            opacity: bannerFlash,
            transform: `scale(${bannerScale})`,
            transformOrigin: 'left center',
          }}>
            <span style={{ fontSize: 'clamp(18px, 4vw, 28px)' }}>{'\ud83d\udea8'}</span>
            <div style={{
              fontFamily: "'Inter', 'Helvetica Neue', sans-serif",
              fontSize: 'clamp(16px, 3.5vw, 26px)',
              fontWeight: 800,
              color: alertColor,
              letterSpacing: '0.06em',
              textTransform: 'uppercase',
            }}>
              Price Alert
            </div>
          </div>

          {/* Coin name */}
          <div style={{
            fontFamily: "'Inter', sans-serif",
            fontSize: 'clamp(18px, 4vw, 30px)',
            fontWeight: 700,
            color: textColor,
            marginBottom: 'clamp(4px, 1vw, 8px)',
            opacity: infoReveal1,
            transform: `translateX(${(1 - infoReveal1) * 20}px)`,
          }}>
            {coinName}
          </div>

          {/* Alert condition */}
          <div style={{
            fontFamily: "'Inter', sans-serif",
            fontSize: 'clamp(12px, 2.5vw, 18px)',
            fontWeight: 500,
            color: `${textColor}70`,
            marginBottom: 'clamp(14px, 3.5vw, 22px)',
            opacity: infoReveal1,
            transform: `translateX(${(1 - infoReveal1) * 20}px)`,
          }}>
            {alertCondition}
          </div>

          {/* Current price */}
          <div style={{
            background: `${alertColor}08`,
            borderRadius: 'clamp(8px, 2vw, 14px)',
            padding: 'clamp(12px, 3vw, 20px)',
            marginBottom: 'clamp(14px, 3.5vw, 22px)',
            opacity: infoReveal2,
            transform: `translateY(${(1 - infoReveal2) * 15}px)`,
          }}>
            <div style={{
              fontFamily: "'Inter', sans-serif",
              fontSize: 'clamp(9px, 1.6vw, 12px)',
              fontWeight: 500,
              color: `${textColor}50`,
              textTransform: 'uppercase',
              letterSpacing: '0.1em',
              marginBottom: 4,
            }}>
              Current Price
            </div>
            <div style={{
              fontFamily: "'SF Mono', 'Fira Code', monospace",
              fontSize: 'clamp(24px, 6vw, 44px)',
              fontWeight: 800,
              color: alertColor,
              textShadow: `0 0 20px ${alertColor}20`,
            }}>
              {formatPrice(currentPrice * easeOutCubic(enterProgress))}
            </div>
          </div>

          {/* Recommendation */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: 'clamp(6px, 1.5vw, 10px)',
            opacity: infoReveal3,
            transform: `translateY(${(1 - infoReveal3) * 10}px)`,
          }}>
            <div style={{
              width: 4,
              height: 'clamp(20px, 4vw, 32px)',
              borderRadius: 2,
              background: alertColor,
              flexShrink: 0,
            }} />
            <div style={{
              fontFamily: "'Inter', sans-serif",
              fontSize: 'clamp(12px, 2.5vw, 18px)',
              fontWeight: 600,
              color: textColor,
              lineHeight: 1.5,
            }}>
              {recommendation}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

registerMotionGraphic({
  id: 'tpl-scene-crypto-alert',
  title: 'Crypto Price Alert',
  description: 'Urgent crypto price alert card with flashing banner, coin info, current price, and action recommendation',
  tags: ['scene', 'crypto', 'alert', 'price', 'trading', 'notification', 'urgent'],
  category: 'scene-layout',
  component: SceneCryptoAlertComponent as any,
  defaultConfig: {
    coinName: 'Bitcoin (BTC)',
    alertCondition: 'Crossed $70,000 resistance level',
    currentPrice: 71250.00,
    recommendation: 'Consider taking partial profits or setting a trailing stop-loss at $68,500.',
    bgColor: '#0b0e14',
    textColor: '#eaecef',
    alertColor: '#f59e0b',
  },
  configSchema: [
    { key: 'coinName', label: 'Coin Name', type: 'text', defaultValue: 'Bitcoin (BTC)', group: 'Content' },
    { key: 'alertCondition', label: 'Alert Condition', type: 'text', defaultValue: 'Crossed $70,000 resistance level', group: 'Content' },
    { key: 'currentPrice', label: 'Current Price', type: 'number', defaultValue: 71250.00, min: 0, max: 999999, group: 'Content' },
    { key: 'recommendation', label: 'Recommendation', type: 'text', defaultValue: 'Consider taking partial profits or setting a trailing stop-loss at $68,500.', group: 'Content' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#0b0e14', group: 'Style' },
    { key: 'textColor', label: 'Text Color', type: 'color', defaultValue: '#eaecef', group: 'Style' },
    { key: 'alertColor', label: 'Alert Color', type: 'color', defaultValue: '#f59e0b', group: 'Style' },
  ],
})
