import React from 'react'
import { registerMotionGraphic } from '../registry'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface VintageReceiptConfig {
  shopName: string
  items: string
  total: string
  date: string
  bgColor: string
  paperColor: string
  textColor: string
  accentColor: string
}

function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3)
}

function easeInCubic(t: number): number {
  return t * t * t
}

function SceneVintageReceiptComponent({
  config,
  frame,
  fps,
  durationInFrames,
}: MotionGraphicProps<VintageReceiptConfig>) {
  const { shopName, items, total, date, bgColor, paperColor, textColor, accentColor } = config
  const progress = frame / durationInFrames
  const time = frame / fps

  const enterEnd = 0.3
  const holdEnd = 0.78
  const enterProgress = Math.min(1, progress / enterEnd)
  const holdProgress = progress >= enterEnd && progress < holdEnd ? (progress - enterEnd) / (holdEnd - enterEnd) : progress >= holdEnd ? 1 : 0
  const exitProgress = progress >= holdEnd ? (progress - holdEnd) / (1 - holdEnd) : 0

  // Receipt slides down from top
  const receiptSlide = easeOutCubic(Math.min(1, enterProgress / 0.5))
  const receiptY = (1 - receiptSlide) * -200
  const receiptOpacity = easeOutCubic(Math.min(1, enterProgress / 0.3))

  // Shop name types in
  const shopProgress = easeOutCubic(Math.max(0, Math.min(1, (enterProgress - 0.2) / 0.3)))
  const shopChars = Math.floor(shopProgress * shopName.length)

  // Items reveal line by line
  const itemLines = items.split(',').map(s => s.trim())
  const getItemProgress = (idx: number) => easeOutCubic(Math.max(0, Math.min(1, (enterProgress - 0.35 - idx * 0.06) / 0.2)))

  // Total appears
  const totalProgress = easeOutCubic(Math.max(0, Math.min(1, (enterProgress - 0.7) / 0.2)))

  // Date stamp
  const dateProgress = easeOutCubic(Math.max(0, Math.min(1, (enterProgress - 0.8) / 0.15)))

  // Exit
  const exitEased = easeInCubic(exitProgress)
  const exitOpacity = 1 - exitEased
  const exitY = exitEased * 120

  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        overflow: 'hidden',
        background: bgColor,
        fontFamily: "'Courier New', monospace",
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      {/* Receipt paper */}
      <div
        style={{
          position: 'relative',
          width: 'clamp(260px, 60vw, 380px)',
          padding: 'clamp(24px, 5vw, 40px) clamp(20px, 4vw, 34px)',
          background: paperColor,
          transform: `translateY(${receiptY + exitY}px)`,
          opacity: receiptOpacity * exitOpacity,
          boxShadow: '0 6px 30px rgba(0,0,0,0.25), inset 0 0 20px rgba(140,110,60,0.08)',
        }}
      >
        {/* Torn top edge */}
        <div
          style={{
            position: 'absolute',
            top: -6,
            left: 0,
            right: 0,
            height: 6,
            background: paperColor,
            clipPath: 'polygon(0% 100%, 3% 30%, 6% 90%, 9% 20%, 12% 80%, 15% 40%, 18% 100%, 21% 30%, 24% 85%, 27% 20%, 30% 100%, 33% 45%, 36% 90%, 39% 25%, 42% 100%, 45% 35%, 48% 80%, 51% 100%, 54% 20%, 57% 90%, 60% 40%, 63% 100%, 66% 30%, 69% 85%, 72% 100%, 75% 20%, 78% 90%, 81% 45%, 84% 100%, 87% 30%, 90% 80%, 93% 100%, 96% 40%, 100% 100%)',
          }}
        />
        {/* Torn bottom edge */}
        <div
          style={{
            position: 'absolute',
            bottom: -6,
            left: 0,
            right: 0,
            height: 6,
            background: paperColor,
            clipPath: 'polygon(0% 0%, 3% 70%, 6% 10%, 9% 80%, 12% 20%, 15% 60%, 18% 0%, 21% 70%, 24% 15%, 27% 80%, 30% 0%, 33% 55%, 36% 10%, 39% 75%, 42% 0%, 45% 65%, 48% 20%, 51% 0%, 54% 80%, 57% 10%, 60% 60%, 63% 0%, 66% 70%, 69% 15%, 72% 0%, 75% 80%, 78% 10%, 81% 55%, 84% 0%, 87% 70%, 90% 20%, 93% 0%, 96% 60%, 100% 0%)',
          }}
        />

        {/* Shop name header */}
        <div
          style={{
            fontSize: 'clamp(18px, 4vw, 28px)',
            fontWeight: 700,
            color: textColor,
            textAlign: 'center',
            letterSpacing: 3,
            marginBottom: 'clamp(4px, 1vw, 8px)',
          }}
        >
          {shopName.substring(0, shopChars)}
          {shopChars < shopName.length && <span style={{ opacity: 0.4 }}>_</span>}
        </div>

        {/* Date */}
        <div
          style={{
            fontSize: 'clamp(9px, 1.6vw, 12px)',
            color: `${textColor}80`,
            textAlign: 'center',
            marginBottom: 'clamp(12px, 2.5vw, 20px)',
            opacity: dateProgress,
          }}
        >
          {date}
        </div>

        {/* Dashed divider */}
        <div
          style={{
            borderTop: `1px dashed ${textColor}40`,
            marginBottom: 'clamp(10px, 2vw, 16px)',
            opacity: shopProgress,
          }}
        />

        {/* Items list */}
        {itemLines.map((item, i) => {
          const itemOpacity = getItemProgress(i)
          return (
            <div
              key={i}
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                fontSize: 'clamp(11px, 2vw, 15px)',
                color: textColor,
                marginBottom: 'clamp(4px, 0.8vw, 8px)',
                opacity: itemOpacity,
              }}
            >
              <span>{item}</span>
              <span style={{ opacity: 0.6 }}>......</span>
            </div>
          )
        })}

        {/* Dashed divider */}
        <div
          style={{
            borderTop: `1px dashed ${textColor}40`,
            margin: 'clamp(10px, 2vw, 16px) 0',
            opacity: totalProgress,
          }}
        />

        {/* Total */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            fontSize: 'clamp(16px, 3.5vw, 24px)',
            fontWeight: 700,
            color: textColor,
            opacity: totalProgress,
          }}
        >
          <span>TOTAL</span>
          <span>{total}</span>
        </div>

        {/* Thank you footer */}
        <div
          style={{
            textAlign: 'center',
            fontSize: 'clamp(9px, 1.5vw, 12px)',
            color: `${textColor}60`,
            marginTop: 'clamp(14px, 3vw, 22px)',
            letterSpacing: 2,
            opacity: totalProgress * 0.8,
          }}
        >
          THANK YOU FOR YOUR PATRONAGE
        </div>

        {/* Age stains */}
        {[
          { left: '15%', top: '40%' },
          { right: '20%', bottom: '25%' },
        ].map((pos, i) => (
          <div
            key={`stain-${i}`}
            style={{
              position: 'absolute',
              ...pos,
              width: 'clamp(20px, 4vw, 35px)',
              height: 'clamp(20px, 4vw, 35px)',
              borderRadius: '50%',
              background: 'radial-gradient(circle, rgba(160,120,60,0.06) 0%, transparent 70%)',
              pointerEvents: 'none',
            } as any}
          />
        ))}
      </div>
    </div>
  )
}

registerMotionGraphic({
  id: 'tpl-scene-vintage-receipt',
  title: 'Scene Vintage Receipt',
  description: 'Old-fashioned receipt with torn edges, typewriter font, line-by-line item reveal, aged paper stains, and monospace typography',
  tags: ['scene', 'vintage', 'receipt', 'retro', 'ticket', 'paper', 'typewriter', 'aged'],
  category: 'scene-layout',
  component: SceneVintageReceiptComponent as unknown as React.ComponentType<MotionGraphicProps>,
  defaultConfig: {
    shopName: 'OLDE SHOPPE',
    items: 'Fine Tea Leaves, Spiced Honey, Fresh Bread, Cream Butter',
    total: '$4.75',
    date: 'OCTOBER 14, 1952',
    bgColor: '#1A1408',
    paperColor: '#F0E4CC',
    textColor: '#3E2723',
    accentColor: '#8B6914',
  },
  configSchema: [
    { key: 'shopName', label: 'Shop Name', type: 'text', defaultValue: 'OLDE SHOPPE', group: 'Content' },
    { key: 'items', label: 'Items (comma sep)', type: 'text', defaultValue: 'Fine Tea Leaves, Spiced Honey, Fresh Bread, Cream Butter', group: 'Content' },
    { key: 'total', label: 'Total', type: 'text', defaultValue: '$4.75', group: 'Content' },
    { key: 'date', label: 'Date', type: 'text', defaultValue: 'OCTOBER 14, 1952', group: 'Content' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#1A1408', group: 'Style' },
    { key: 'paperColor', label: 'Paper Color', type: 'color', defaultValue: '#F0E4CC', group: 'Style' },
    { key: 'textColor', label: 'Text Color', type: 'color', defaultValue: '#3E2723', group: 'Style' },
    { key: 'accentColor', label: 'Accent Color', type: 'color', defaultValue: '#8B6914', group: 'Style' },
  ],
})
