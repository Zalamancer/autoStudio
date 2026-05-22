import React from 'react'
import { registerMotionGraphic } from '../registry'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface SceneCryptoPriceConfig {
  coinName: string
  coinSymbol: string
  price: number
  change24h: number
  marketCap: string
  bgColor: string
  textColor: string
}

function easeOutCubic(t: number): number { return 1 - Math.pow(1 - t, 3) }
function easeInCubic(t: number): number { return t * t * t }

function formatPrice(n: number): string {
  return n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

const coinIcons: Record<string, string> = {
  BTC: '\u20bf',
  ETH: '\u039e',
  SOL: '\u25c6',
  DOGE: '\u00d0',
}

function SceneCryptoPriceComponent({ config, progress }: MotionGraphicProps<SceneCryptoPriceConfig>) {
  const { coinName, coinSymbol, price, change24h, marketCap, bgColor, textColor } = config

  const enterProgress = progress < 0.2 ? progress / 0.2 : 1
  const holdProgress = progress >= 0.2 && progress < 0.8 ? (progress - 0.2) / 0.6 : progress >= 0.8 ? 1 : 0
  const exitProgress = progress >= 0.8 ? (progress - 0.8) / 0.2 : 0

  const exitOpacity = exitProgress > 0 ? 1 - easeInCubic(exitProgress) : 1
  const isUp = change24h >= 0
  const changeColor = isUp ? '#00c087' : '#ef4444'

  // Price counting
  const countedPrice = price * easeOutCubic(enterProgress)
  const displayPrice = enterProgress >= 1 ? formatPrice(price) : formatPrice(countedPrice)

  // Hold: subtle price pulse
  const isHolding = progress >= 0.2 && progress < 0.8
  const pulsedPrice = isHolding
    ? price + Math.sin(holdProgress * Math.PI * 6) * price * 0.001
    : price
  const holdDisplayPrice = isHolding ? formatPrice(pulsedPrice) : displayPrice

  // Card slide in
  const cardSlideY = (1 - easeOutCubic(enterProgress)) * 40
  const cardScale = 0.92 + easeOutCubic(enterProgress) * 0.08

  const icon = coinIcons[coinSymbol.toUpperCase()] || coinSymbol.charAt(0)

  return (
    <div style={{ position: 'absolute', inset: 0, overflow: 'hidden' }}>
      <div style={{ position: 'absolute', inset: 0, background: bgColor }} />

      <div style={{
        position: 'absolute', inset: 0,
        display: 'flex', justifyContent: 'center', alignItems: 'center',
        padding: '8%',
        opacity: exitOpacity,
      }}>
        {/* Card */}
        <div style={{
          background: 'linear-gradient(145deg, #1a1f2e, #141824)',
          borderRadius: 'clamp(12px, 3vw, 24px)',
          padding: 'clamp(20px, 5vw, 48px)',
          border: '1px solid rgba(255,255,255,0.06)',
          boxShadow: '0 20px 60px rgba(0,0,0,0.5)',
          width: 'clamp(280px, 70vw, 500px)',
          transform: `translateY(${cardSlideY}px) scale(${cardScale})`,
          opacity: easeOutCubic(enterProgress),
        }}>
          {/* Header: icon + name */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: 'clamp(8px, 2vw, 16px)',
            marginBottom: 'clamp(12px, 3vw, 24px)',
            opacity: easeOutCubic(Math.max(0, (enterProgress - 0.1) / 0.9)),
          }}>
            <div style={{
              width: 'clamp(36px, 8vw, 56px)',
              height: 'clamp(36px, 8vw, 56px)',
              borderRadius: '50%',
              background: `linear-gradient(135deg, ${changeColor}30, ${changeColor}10)`,
              border: `2px solid ${changeColor}40`,
              display: 'flex', justifyContent: 'center', alignItems: 'center',
              fontSize: 'clamp(18px, 4vw, 28px)',
              fontWeight: 800,
              color: changeColor,
            }}>
              {icon}
            </div>
            <div>
              <div style={{
                fontFamily: "'Inter', sans-serif",
                fontSize: 'clamp(16px, 3.5vw, 26px)',
                fontWeight: 700,
                color: textColor,
              }}>
                {coinName}
              </div>
              <div style={{
                fontFamily: "'SF Mono', monospace",
                fontSize: 'clamp(10px, 2vw, 14px)',
                fontWeight: 500,
                color: `${textColor}80`,
                letterSpacing: '0.05em',
              }}>
                {coinSymbol.toUpperCase()}
              </div>
            </div>
          </div>

          {/* Price */}
          <div style={{
            fontFamily: "'Inter', 'Helvetica Neue', sans-serif",
            fontSize: 'clamp(28px, 7vw, 56px)',
            fontWeight: 800,
            color: textColor,
            lineHeight: 1.1,
            marginBottom: 'clamp(6px, 1.5vw, 12px)',
            opacity: easeOutCubic(Math.max(0, (enterProgress - 0.2) / 0.8)),
          }}>
            ${enterProgress >= 1 ? holdDisplayPrice : displayPrice}
          </div>

          {/* 24h Change */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: 'clamp(8px, 2vw, 16px)',
            marginBottom: 'clamp(12px, 3vw, 20px)',
            opacity: easeOutCubic(Math.max(0, (enterProgress - 0.35) / 0.65)),
          }}>
            <span style={{
              fontFamily: "'Inter', sans-serif",
              fontSize: 'clamp(14px, 3vw, 22px)',
              fontWeight: 700,
              color: changeColor,
              background: `${changeColor}15`,
              padding: '3px 10px',
              borderRadius: 8,
            }}>
              {isUp ? '\u2191' : '\u2193'} {isUp ? '+' : ''}{change24h.toFixed(2)}%
            </span>
            <span style={{
              fontFamily: "'Inter', sans-serif",
              fontSize: 'clamp(11px, 2vw, 14px)',
              color: `${textColor}60`,
            }}>
              24h
            </span>
          </div>

          {/* Market Cap */}
          <div style={{
            borderTop: `1px solid ${textColor}10`,
            paddingTop: 'clamp(8px, 2vw, 16px)',
            opacity: easeOutCubic(Math.max(0, (enterProgress - 0.5) / 0.5)),
          }}>
            <div style={{
              fontFamily: "'Inter', sans-serif",
              fontSize: 'clamp(10px, 1.8vw, 13px)',
              fontWeight: 500,
              color: `${textColor}50`,
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              marginBottom: 4,
            }}>
              Market Cap
            </div>
            <div style={{
              fontFamily: "'Inter', sans-serif",
              fontSize: 'clamp(14px, 3vw, 22px)',
              fontWeight: 700,
              color: textColor,
            }}>
              {marketCap}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

registerMotionGraphic({
  id: 'tpl-scene-crypto-price',
  title: 'Crypto Price Card',
  description: 'Binance-style crypto price card with coin icon, price, 24h change, and market cap on a dark theme',
  tags: ['scene', 'crypto', 'bitcoin', 'finance', 'trading', 'price'],
  category: 'scene-layout',
  component: SceneCryptoPriceComponent as any,
  defaultConfig: {
    coinName: 'Bitcoin',
    coinSymbol: 'BTC',
    price: 67432.18,
    change24h: 4.52,
    marketCap: '$1.32T',
    bgColor: '#0b0e14',
    textColor: '#eaecef',
  },
  configSchema: [
    { key: 'coinName', label: 'Coin Name', type: 'text', defaultValue: 'Bitcoin', group: 'Content' },
    { key: 'coinSymbol', label: 'Coin Symbol', type: 'text', defaultValue: 'BTC', group: 'Content' },
    { key: 'price', label: 'Price (USD)', type: 'number', defaultValue: 67432.18, min: 0, max: 999999, group: 'Content' },
    { key: 'change24h', label: '24h Change (%)', type: 'number', defaultValue: 4.52, min: -100, max: 1000, group: 'Content' },
    { key: 'marketCap', label: 'Market Cap', type: 'text', defaultValue: '$1.32T', group: 'Content' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#0b0e14', group: 'Style' },
    { key: 'textColor', label: 'Text Color', type: 'color', defaultValue: '#eaecef', group: 'Style' },
  ],
})
