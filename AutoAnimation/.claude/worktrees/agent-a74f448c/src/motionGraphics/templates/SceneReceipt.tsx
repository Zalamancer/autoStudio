import React from 'react'
import { registerMotionGraphic } from '../registry'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface SceneReceiptConfig {
  storeName: string
  storeAddress: string
  item1: string
  price1: string
  item2: string
  price2: string
  item3: string
  price3: string
  totalAmount: string
  footerText: string
  bgColor: string
  textColor: string
  accentColor: string
}

function easeOutCubic(t: number): number { return 1 - Math.pow(1 - t, 3) }
function easeInCubic(t: number): number { return t * t * t }
function easeOutQuart(t: number): number { return 1 - Math.pow(1 - t, 4) }

function SceneReceiptComponent({ config, progress }: MotionGraphicProps<SceneReceiptConfig>) {
  const {
    storeName, storeAddress, item1, price1, item2, price2, item3, price3,
    totalAmount, footerText, bgColor, textColor, accentColor,
  } = config

  // Phases: enter 0-0.35, hold 0.35-0.8, exit 0.8-1
  const enterProgress = progress < 0.35 ? progress / 0.35 : 1
  const exitProgress = progress >= 0.8 ? (progress - 0.8) / 0.2 : 0

  // Receipt "prints" from top to bottom
  const receiptReveal = easeOutQuart(enterProgress)
  const receiptClip = `inset(0 0 ${(1 - receiptReveal) * 100}% 0)`

  // Store name
  const storeOpacity = easeOutCubic(Math.min(1, enterProgress / 0.2))

  // Address
  const addrOpacity = easeOutCubic(Math.max(0, Math.min(1, (enterProgress - 0.1) / 0.15)))

  // Items appear staggered
  const itemOpacity = (idx: number) => easeOutCubic(Math.max(0, Math.min(1, (enterProgress - 0.2 - idx * 0.12) / 0.15)))

  // Divider line
  const dividerOpacity = easeOutCubic(Math.max(0, Math.min(1, (enterProgress - 0.6) / 0.15)))

  // Total
  const totalOpacity = easeOutCubic(Math.max(0, Math.min(1, (enterProgress - 0.7) / 0.15)))

  // Footer
  const footerOpacity = easeOutCubic(Math.max(0, Math.min(1, (enterProgress - 0.85) / 0.15)))

  // Exit
  const exitEased = easeInCubic(exitProgress)
  const exitOpacity = 1 - exitEased
  const exitScale = 1 - exitEased * 0.06

  const monoFont = "'Courier New', 'Courier', monospace"

  const items = [
    { name: item1, price: price1 },
    { name: item2, price: price2 },
    { name: item3, price: price3 },
  ]

  // Dotted line between item name and price
  const renderDots = (name: string, maxLen: number) => {
    const dotsNeeded = Math.max(2, maxLen - name.length)
    return '.'.repeat(dotsNeeded)
  }

  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        overflow: 'hidden',
        background: bgColor,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      {/* Receipt paper */}
      <div
        style={{
          background: '#F5F0E8',
          width: 'clamp(200px, 50vw, 340px)',
          padding: 'clamp(16px, 4vw, 32px) clamp(12px, 3vw, 24px)',
          borderRadius: 'clamp(2px, 0.4vw, 4px)',
          boxShadow: `0 clamp(4px, 1vw, 10px) clamp(20px, 5vw, 40px) ${bgColor}88`,
          clipPath: receiptClip,
          display: 'flex',
          flexDirection: 'column',
          fontFamily: monoFont,
          opacity: exitOpacity,
          transform: `scale(${exitScale})`,
          position: 'relative',
        }}
      >
        {/* Torn edge at top */}
        <div
          style={{
            position: 'absolute',
            top: -4,
            left: 0,
            right: 0,
            height: 8,
            background: `repeating-linear-gradient(90deg, #F5F0E8 0px, #F5F0E8 4px, transparent 4px, transparent 8px)`,
          }}
        />

        {/* Store name */}
        <div
          style={{
            fontSize: 'clamp(14px, 3vw, 22px)',
            fontWeight: 700,
            color: '#1A1A1A',
            textAlign: 'center',
            textTransform: 'uppercase',
            letterSpacing: '0.08em',
            opacity: storeOpacity,
            marginBottom: 'clamp(2px, 0.4vw, 4px)',
          }}
        >
          {storeName}
        </div>

        {/* Address */}
        <div
          style={{
            fontSize: 'clamp(8px, 1.5vw, 11px)',
            fontWeight: 400,
            color: '#666',
            textAlign: 'center',
            opacity: addrOpacity,
            marginBottom: 'clamp(10px, 2vw, 16px)',
          }}
        >
          {storeAddress}
        </div>

        {/* Dashed separator */}
        <div
          style={{
            borderTop: '1px dashed #999',
            margin: 'clamp(4px, 1vw, 8px) 0',
            opacity: addrOpacity,
          }}
        />

        {/* Items */}
        {items.map((item, i) => (
          <div
            key={i}
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'baseline',
              fontSize: 'clamp(10px, 2vw, 15px)',
              fontWeight: 400,
              color: '#1A1A1A',
              lineHeight: 1.8,
              opacity: itemOpacity(i),
            }}
          >
            <span style={{ whiteSpace: 'nowrap', overflow: 'hidden' }}>{item.name}</span>
            <span
              style={{
                flex: 1,
                color: '#AAA',
                fontSize: 'clamp(8px, 1.4vw, 11px)',
                margin: '0 clamp(2px, 0.5vw, 4px)',
                overflow: 'hidden',
                letterSpacing: '0.1em',
              }}
            >
              {renderDots(item.name, 24)}
            </span>
            <span style={{ fontWeight: 600, whiteSpace: 'nowrap' }}>{item.price}</span>
          </div>
        ))}

        {/* Separator before total */}
        <div
          style={{
            borderTop: '2px dashed #666',
            margin: 'clamp(8px, 1.5vw, 14px) 0 clamp(6px, 1.2vw, 10px)',
            opacity: dividerOpacity,
          }}
        />

        {/* Total */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            fontSize: 'clamp(13px, 2.6vw, 20px)',
            fontWeight: 700,
            color: '#1A1A1A',
            opacity: totalOpacity,
          }}
        >
          <span>TOTAL</span>
          <span>{totalAmount}</span>
        </div>

        {/* Footer text */}
        <div
          style={{
            fontSize: 'clamp(8px, 1.4vw, 11px)',
            fontWeight: 400,
            color: '#888',
            textAlign: 'center',
            marginTop: 'clamp(12px, 2.5vw, 20px)',
            opacity: footerOpacity,
            lineHeight: 1.4,
          }}
        >
          {footerText}
        </div>

        {/* Barcode-style decoration */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'center',
            gap: 'clamp(1px, 0.2vw, 2px)',
            marginTop: 'clamp(8px, 1.5vw, 14px)',
            opacity: footerOpacity * 0.5,
          }}
        >
          {Array.from({ length: 30 }).map((_, i) => (
            <div
              key={i}
              style={{
                width: i % 3 === 0 ? 'clamp(2px, 0.4vw, 3px)' : 'clamp(1px, 0.2vw, 1.5px)',
                height: 'clamp(16px, 3vw, 28px)',
                background: '#1A1A1A',
                opacity: i % 5 === 0 ? 0.9 : 0.5,
              }}
            />
          ))}
        </div>

        {/* Torn edge at bottom */}
        <div
          style={{
            position: 'absolute',
            bottom: -4,
            left: 0,
            right: 0,
            height: 8,
            background: `repeating-linear-gradient(90deg, #F5F0E8 0px, #F5F0E8 5px, transparent 5px, transparent 10px)`,
          }}
        />
      </div>
    </div>
  )
}

registerMotionGraphic({
  id: 'tpl-scene-receipt',
  title: 'Receipt Text',
  description: 'Receipt-style monospace text with store name, line items with dot leaders, total, barcode decoration, and torn-edge paper effect',
  tags: ['scene', 'receipt', 'monospace', 'list', 'total', 'text', 'paper', 'retro'],
  category: 'scene-layout',
  component: SceneReceiptComponent as any,
  defaultConfig: {
    storeName: 'THE DAILY GRIND',
    storeAddress: '42 Maple St, Brooklyn NY',
    item1: 'Oat Milk Latte',
    price1: '$5.50',
    item2: 'Avocado Toast',
    price2: '$12.00',
    item3: 'Sparkling Water',
    price3: '$3.00',
    totalAmount: '$20.50',
    footerText: 'THANK YOU FOR YOUR VISIT',
    bgColor: '#0E0D0B',
    textColor: '#1A1A1A',
    accentColor: '#8B7355',
  },
  configSchema: [
    { key: 'storeName', label: 'Store Name', type: 'text', defaultValue: 'THE DAILY GRIND', group: 'Content' },
    { key: 'storeAddress', label: 'Address', type: 'text', defaultValue: '42 Maple St, Brooklyn NY', group: 'Content' },
    { key: 'item1', label: 'Item 1', type: 'text', defaultValue: 'Oat Milk Latte', group: 'Content' },
    { key: 'price1', label: 'Price 1', type: 'text', defaultValue: '$5.50', group: 'Content' },
    { key: 'item2', label: 'Item 2', type: 'text', defaultValue: 'Avocado Toast', group: 'Content' },
    { key: 'price2', label: 'Price 2', type: 'text', defaultValue: '$12.00', group: 'Content' },
    { key: 'item3', label: 'Item 3', type: 'text', defaultValue: 'Sparkling Water', group: 'Content' },
    { key: 'price3', label: 'Price 3', type: 'text', defaultValue: '$3.00', group: 'Content' },
    { key: 'totalAmount', label: 'Total', type: 'text', defaultValue: '$20.50', group: 'Content' },
    { key: 'footerText', label: 'Footer Text', type: 'text', defaultValue: 'THANK YOU FOR YOUR VISIT', group: 'Content' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#0E0D0B', group: 'Style' },
    { key: 'textColor', label: 'Text Color', type: 'color', defaultValue: '#1A1A1A', group: 'Style' },
    { key: 'accentColor', label: 'Accent Color', type: 'color', defaultValue: '#8B7355', group: 'Style' },
  ],
})
