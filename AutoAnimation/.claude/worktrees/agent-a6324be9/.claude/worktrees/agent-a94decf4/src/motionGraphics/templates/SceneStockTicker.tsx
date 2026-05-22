import React from 'react'
import { registerMotionGraphic } from '../registry'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface SceneStockTickerConfig {
  ticker: string
  price: number
  changeAmount: number
  changePercent: number
  sparklineData: string
  bgColor: string
  textColor: string
}

function easeOutCubic(t: number): number { return 1 - Math.pow(1 - t, 3) }
function easeInCubic(t: number): number { return t * t * t }

function formatPrice(n: number): string {
  return n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

function SceneStockTickerComponent({ config, progress }: MotionGraphicProps<SceneStockTickerConfig>) {
  const { ticker, price, changeAmount, changePercent, sparklineData, bgColor, textColor } = config

  const enterProgress = progress < 0.2 ? progress / 0.2 : 1
  const holdProgress = progress >= 0.2 && progress < 0.8 ? (progress - 0.2) / 0.6 : progress >= 0.8 ? 1 : 0
  const exitProgress = progress >= 0.8 ? (progress - 0.8) / 0.2 : 0

  const exitOpacity = exitProgress > 0 ? 1 - easeInCubic(exitProgress) : 1
  const isUp = changeAmount >= 0
  const changeColor = isUp ? '#00c087' : '#ef4444'
  const arrow = isUp ? '\u2191' : '\u2193'

  // Parse sparkline data
  const dataPoints = sparklineData.split(',').map(s => parseFloat(s.trim())).filter(n => !isNaN(n))
  const minVal = Math.min(...dataPoints)
  const maxVal = Math.max(...dataPoints)
  const range = maxVal - minVal || 1

  // Build SVG polyline points
  const svgW = 200
  const svgH = 60
  const padding = 4
  const points = dataPoints.map((v, i) => {
    const x = padding + (i / (dataPoints.length - 1)) * (svgW - padding * 2)
    const y = svgH - padding - ((v - minVal) / range) * (svgH - padding * 2)
    return `${x},${y}`
  }).join(' ')

  // Animated sparkline drawing: use dasharray trick
  const pathLen = dataPoints.length * 30
  const drawProgress = easeOutCubic(enterProgress)

  // Price counting animation
  const countedPrice = price * easeOutCubic(enterProgress)
  const displayPrice = enterProgress >= 1 ? formatPrice(price) : formatPrice(countedPrice)

  // Ticker slide-in
  const tickerSlideX = (1 - easeOutCubic(enterProgress)) * -60

  // Hold: subtle price flicker
  const isHolding = progress >= 0.2 && progress < 0.8
  const flickerPrice = isHolding
    ? price + Math.sin(holdProgress * Math.PI * 8) * price * 0.002
    : price
  const holdDisplayPrice = isHolding ? formatPrice(flickerPrice) : displayPrice

  return (
    <div style={{ position: 'absolute', inset: 0, overflow: 'hidden' }}>
      <div style={{ position: 'absolute', inset: 0, background: bgColor }} />

      {/* Subtle grid lines */}
      <div style={{
        position: 'absolute', inset: 0, opacity: 0.04,
        backgroundImage: `linear-gradient(${textColor} 1px, transparent 1px), linear-gradient(90deg, ${textColor} 1px, transparent 1px)`,
        backgroundSize: '40px 40px',
      }} />

      <div style={{
        position: 'absolute', inset: 0,
        display: 'flex', flexDirection: 'column',
        justifyContent: 'center', alignItems: 'center',
        padding: '8%',
        opacity: exitOpacity,
      }}>
        {/* Ticker Symbol */}
        <div style={{
          fontFamily: "'SF Mono', 'Fira Code', 'Courier New', monospace",
          fontSize: 'clamp(32px, 8vw, 72px)',
          fontWeight: 800,
          color: textColor,
          letterSpacing: '0.05em',
          transform: `translateX(${tickerSlideX}px)`,
          opacity: easeOutCubic(enterProgress),
          marginBottom: 'clamp(4px, 1vw, 12px)',
        }}>
          {ticker}
        </div>

        {/* Price */}
        <div style={{
          fontFamily: "'Inter', 'Helvetica Neue', sans-serif",
          fontSize: 'clamp(28px, 7vw, 64px)',
          fontWeight: 700,
          color: textColor,
          lineHeight: 1.1,
          opacity: easeOutCubic(Math.max(0, (enterProgress - 0.2) / 0.8)),
        }}>
          ${enterProgress >= 1 ? holdDisplayPrice : displayPrice}
        </div>

        {/* Change */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 'clamp(6px, 1.5vw, 14px)',
          marginTop: 'clamp(4px, 1vw, 10px)',
          opacity: easeOutCubic(Math.max(0, (enterProgress - 0.4) / 0.6)),
        }}>
          <span style={{
            fontFamily: "'Inter', sans-serif",
            fontSize: 'clamp(16px, 3.5vw, 32px)',
            fontWeight: 700,
            color: changeColor,
          }}>
            {arrow} {isUp ? '+' : ''}{formatPrice(changeAmount)}
          </span>
          <span style={{
            fontFamily: "'Inter', sans-serif",
            fontSize: 'clamp(14px, 3vw, 26px)',
            fontWeight: 600,
            color: changeColor,
            opacity: 0.8,
            background: `${changeColor}18`,
            padding: '2px 8px',
            borderRadius: 6,
          }}>
            {isUp ? '+' : ''}{changePercent.toFixed(2)}%
          </span>
        </div>

        {/* Sparkline */}
        {dataPoints.length > 1 && (
          <svg
            viewBox={`0 0 ${svgW} ${svgH}`}
            style={{
              width: 'clamp(140px, 35vw, 280px)',
              height: 'clamp(40px, 10vw, 80px)',
              marginTop: 'clamp(8px, 2vw, 20px)',
              opacity: easeOutCubic(Math.max(0, (enterProgress - 0.5) / 0.5)),
            }}
          >
            <polyline
              points={points}
              fill="none"
              stroke={changeColor}
              strokeWidth={2.5}
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeDasharray={pathLen}
              strokeDashoffset={pathLen * (1 - drawProgress)}
            />
            {/* Glow under the line */}
            <polyline
              points={points}
              fill="none"
              stroke={changeColor}
              strokeWidth={6}
              strokeLinecap="round"
              strokeLinejoin="round"
              opacity={0.15}
              strokeDasharray={pathLen}
              strokeDashoffset={pathLen * (1 - drawProgress)}
            />
          </svg>
        )}
      </div>
    </div>
  )
}

registerMotionGraphic({
  id: 'tpl-scene-stock-ticker',
  title: 'Stock Ticker',
  description: 'Bloomberg-style stock ticker with symbol, price, change indicators, and animated sparkline chart',
  tags: ['scene', 'finance', 'stock', 'ticker', 'trading', 'data'],
  category: 'scene-layout',
  component: SceneStockTickerComponent as any,
  defaultConfig: {
    ticker: 'AAPL',
    price: 187.44,
    changeAmount: 3.27,
    changePercent: 1.78,
    sparklineData: '172,175,174,178,176,180,183,181,185,184,187',
    bgColor: '#0a0e17',
    textColor: '#e2e8f0',
  },
  configSchema: [
    { key: 'ticker', label: 'Ticker Symbol', type: 'text', defaultValue: 'AAPL', group: 'Content' },
    { key: 'price', label: 'Price', type: 'number', defaultValue: 187.44, min: 0, max: 999999, group: 'Content' },
    { key: 'changeAmount', label: 'Change Amount', type: 'number', defaultValue: 3.27, min: -99999, max: 99999, group: 'Content' },
    { key: 'changePercent', label: 'Change Percent', type: 'number', defaultValue: 1.78, min: -100, max: 1000, group: 'Content' },
    { key: 'sparklineData', label: 'Sparkline Data (comma-separated)', type: 'text', defaultValue: '172,175,174,178,176,180,183,181,185,184,187', group: 'Content' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#0a0e17', group: 'Style' },
    { key: 'textColor', label: 'Text Color', type: 'color', defaultValue: '#e2e8f0', group: 'Style' },
  ],
})
