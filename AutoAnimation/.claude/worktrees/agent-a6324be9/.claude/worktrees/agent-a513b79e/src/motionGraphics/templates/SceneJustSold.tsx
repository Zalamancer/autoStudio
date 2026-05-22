import React from 'react'
import { registerMotionGraphic } from '../registry'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface JustSoldConfig {
  headerText: string
  askingPrice: number
  soldPrice: number
  address: string
  agentName: string
  bgColor: string
  textColor: string
  stampColor: string
  accentColor: string
}

function easeOutCubic(t: number): number { return 1 - Math.pow(1 - t, 3) }
function easeInCubic(t: number): number { return t * t * t }
function elasticOut(t: number): number {
  if (t === 0 || t === 1) return t
  return Math.pow(2, -10 * t) * Math.sin((t - 0.075) * (2 * Math.PI) / 0.3) + 1
}

function SceneJustSoldComponent({ config, progress, frame, fps }: MotionGraphicProps<JustSoldConfig>) {
  const { headerText, askingPrice, soldPrice, address, agentName, bgColor, textColor, stampColor, accentColor } = config

  const enterProgress = progress < 0.25 ? progress / 0.25 : 1
  const holdProgress = progress >= 0.25 && progress < 0.8 ? (progress - 0.25) / 0.55 : progress >= 0.8 ? 1 : 0
  const exitProgress = progress >= 0.8 ? (progress - 0.8) / 0.2 : 0

  const exitEased = easeInCubic(exitProgress)
  const exitOpacity = 1 - exitEased

  // Stamp slams down with elastic bounce
  const stampProgress = enterProgress < 0.5
    ? elasticOut(Math.min(1, enterProgress / 0.5))
    : 1
  const stampScale = stampProgress * (1 - exitEased * 0.3)
  const stampRotate = -12 // slight rotation like a real stamp

  // Price reveal after stamp
  const priceReveal = enterProgress > 0.4
    ? easeOutCubic(Math.min(1, (enterProgress - 0.4) / 0.35))
    : 0

  // Address and agent
  const infoReveal = enterProgress > 0.6
    ? easeOutCubic(Math.min(1, (enterProgress - 0.6) / 0.3))
    : 0

  const aboveAsking = soldPrice >= askingPrice
  const priceDiff = Math.abs(soldPrice - askingPrice)
  const priceDiffPct = askingPrice > 0 ? Math.round((priceDiff / askingPrice) * 100) : 0

  const formatPrice = (v: number): string => {
    if (v >= 1000000) return `$${(v / 1000000).toFixed(v % 100000 === 0 ? 1 : 2)}M`
    if (v >= 1000) return `$${Math.round(v / 1000)}K`
    return `$${v.toLocaleString()}`
  }

  // Confetti dots
  const confettiColors = [stampColor, accentColor, '#FFD700', '#FF6B6B', '#4ECDC4']
  const confettiDots = Array.from({ length: 20 }, (_, i) => {
    const seed = (i * 137.508) % 360
    const angle = (seed * Math.PI) / 180
    const speed = 0.4 + (i % 5) * 0.15
    const confettiProgress = enterProgress > 0.15
      ? Math.min(1, (enterProgress - 0.15) / 0.5)
      : 0
    const x = Math.cos(angle) * speed * confettiProgress * 200
    const y = Math.sin(angle) * speed * confettiProgress * 200 + confettiProgress * 60
    const size = 4 + (i % 4) * 2
    const opacity = confettiProgress > 0.6 ? 1 - (confettiProgress - 0.6) / 0.4 : confettiProgress > 0 ? 1 : 0
    return { x, y, size, opacity, color: confettiColors[i % confettiColors.length] }
  })

  return (
    <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', background: bgColor, fontFamily: "'Helvetica Neue', Arial, sans-serif" }}>
      <div style={{
        position: 'absolute',
        inset: 0,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '8%',
        opacity: exitOpacity,
        transform: `scale(${1 - exitEased * 0.08})`,
      }}>
        {/* Confetti dots */}
        {confettiDots.map((dot, i) => (
          <div key={i} style={{
            position: 'absolute',
            top: '45%',
            left: '50%',
            width: dot.size,
            height: dot.size,
            borderRadius: i % 3 === 0 ? '50%' : 2,
            background: dot.color,
            transform: `translate(${dot.x}px, ${dot.y}px) rotate(${dot.x * 2}deg)`,
            opacity: dot.opacity * exitOpacity,
            pointerEvents: 'none',
          }} />
        ))}

        {/* SOLD stamp */}
        <div style={{
          fontSize: 'clamp(36px, 8vw, 72px)',
          fontWeight: 900,
          color: stampColor,
          textTransform: 'uppercase',
          letterSpacing: 6,
          transform: `scale(${stampScale}) rotate(${stampRotate}deg)`,
          border: `4px solid ${stampColor}`,
          padding: 'clamp(4px, 1vw, 10px) clamp(16px, 3vw, 32px)',
          borderRadius: 8,
          marginBottom: 'clamp(20px, 4vw, 36px)',
          textShadow: `0 2px 20px ${stampColor}40`,
          boxShadow: `0 0 30px ${stampColor}20`,
        }}>
          {headerText}
        </div>

        {/* Prices */}
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 'clamp(4px, 1vw, 10px)',
          marginBottom: 'clamp(16px, 3vw, 28px)',
          opacity: priceReveal,
          transform: `translateY(${(1 - priceReveal) * 20}px)`,
        }}>
          {/* Asking price with strikethrough */}
          <div style={{
            fontSize: 'clamp(14px, 2.2vw, 20px)',
            color: `${textColor}88`,
            textDecoration: 'line-through',
            fontWeight: 500,
          }}>
            Asking: {formatPrice(askingPrice)}
          </div>

          {/* Sold price */}
          <div style={{
            fontSize: 'clamp(28px, 6vw, 52px)',
            fontWeight: 900,
            color: accentColor,
          }}>
            {formatPrice(Math.round(soldPrice * priceReveal))}
          </div>

          {/* Above/below asking */}
          {priceDiffPct > 0 && (
            <div style={{
              fontSize: 'clamp(12px, 1.8vw, 16px)',
              fontWeight: 700,
              color: aboveAsking ? '#4ECDC4' : stampColor,
              background: aboveAsking ? '#4ECDC415' : `${stampColor}15`,
              padding: 'clamp(2px, 0.5vw, 6px) clamp(8px, 1.5vw, 14px)',
              borderRadius: 20,
            }}>
              {aboveAsking ? '\u2191' : '\u2193'} {priceDiffPct}% {aboveAsking ? 'Above' : 'Below'} Asking
            </div>
          )}
        </div>

        {/* Address */}
        <div style={{
          fontSize: 'clamp(12px, 2vw, 18px)',
          fontWeight: 500,
          color: `${textColor}BB`,
          textAlign: 'center',
          opacity: infoReveal,
          transform: `translateY(${(1 - infoReveal) * 15}px)`,
          marginBottom: 'clamp(8px, 1.5vw, 14px)',
        }}>
          {address}
        </div>

        {/* Agent */}
        <div style={{
          fontSize: 'clamp(11px, 1.6vw, 14px)',
          fontWeight: 600,
          color: `${textColor}77`,
          letterSpacing: 1,
          textTransform: 'uppercase',
          opacity: infoReveal,
        }}>
          {agentName}
        </div>
      </div>
    </div>
  )
}

registerMotionGraphic({
  id: 'tpl-scene-just-sold',
  title: 'Just Sold',
  description: 'Celebratory SOLD stamp with elastic slam animation, confetti dots, price comparison, and above/below asking indicator.',
  tags: ['scene', 'real-estate', 'sold', 'celebration', 'property', 'price'],
  category: 'scene-layout',
  component: SceneJustSoldComponent as any,
  defaultConfig: {
    headerText: 'JUST SOLD!',
    askingPrice: 1200000,
    soldPrice: 1275000,
    address: '789 Maple Drive, Santa Monica, CA 90401',
    agentName: 'Listed by James Carter',
    bgColor: '#0F0F14',
    textColor: '#E8E8F0',
    stampColor: '#E53E3E',
    accentColor: '#48BB78',
  },
  configSchema: [
    { key: 'headerText', label: 'Header Text', type: 'text', defaultValue: 'JUST SOLD!', group: 'Content' },
    { key: 'askingPrice', label: 'Asking Price ($)', type: 'number', defaultValue: 1200000, min: 0, max: 100000000, group: 'Content' },
    { key: 'soldPrice', label: 'Sold Price ($)', type: 'number', defaultValue: 1275000, min: 0, max: 100000000, group: 'Content' },
    { key: 'address', label: 'Address', type: 'text', defaultValue: '789 Maple Drive, Santa Monica, CA 90401', group: 'Content' },
    { key: 'agentName', label: 'Agent Name', type: 'text', defaultValue: 'Listed by James Carter', group: 'Content' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#0F0F14', group: 'Style' },
    { key: 'textColor', label: 'Text Color', type: 'color', defaultValue: '#E8E8F0', group: 'Style' },
    { key: 'stampColor', label: 'Stamp Color', type: 'color', defaultValue: '#E53E3E', group: 'Style' },
    { key: 'accentColor', label: 'Accent/Price Color', type: 'color', defaultValue: '#48BB78', group: 'Style' },
  ],
})
