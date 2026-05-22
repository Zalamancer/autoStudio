import React from 'react'
import { registerMotionGraphic } from '../registry'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface PackingListConfig {
  title: string
  items: string[]
  bgColor: string
  textColor: string
  accentColor: string
  checkColor: string
}

function easeOutCubic(t: number): number { return 1 - Math.pow(1 - t, 3) }
function easeInCubic(t: number): number { return t * t * t }
function easeOutBack(t: number): number {
  const c1 = 1.70158
  const c3 = c1 + 1
  return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2)
}

function ScenePackingListComponent({ config, progress }: MotionGraphicProps<PackingListConfig>) {
  const { title, items, bgColor, textColor, accentColor, checkColor } = config

  const enterProgress = progress < 0.25 ? progress / 0.25 : 1
  const holdProgress = progress >= 0.25 && progress < 0.8 ? (progress - 0.25) / 0.55 : progress >= 0.8 ? 1 : 0
  const exitProgress = progress >= 0.8 ? (progress - 0.8) / 0.2 : 0

  const exitEased = easeInCubic(exitProgress)
  const exitOpacity = exitProgress > 0 ? 1 - exitEased : 1

  // Title enters
  const titleEnter = easeOutCubic(Math.max(0, Math.min(1, enterProgress / 0.3)))

  // Items appear staggered
  const getItemProgress = (idx: number): number => {
    const start = 0.2 + idx * 0.1
    return easeOutCubic(Math.max(0, Math.min(1, (enterProgress - start) / 0.3)))
  }

  // Checks animate after items appear
  const getCheckProgress = (idx: number): number => {
    const start = 0.45 + idx * 0.1
    return easeOutBack(Math.max(0, Math.min(1, (enterProgress - start) / 0.25)))
  }

  // During hold, remaining items get checked
  const holdCheckIdx = progress >= 0.25 && progress < 0.8
    ? Math.floor(holdProgress * (items.length + 1))
    : items.length

  return (
    <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', background: bgColor, fontFamily: "'Inter', 'Helvetica Neue', sans-serif" }}>
      {/* Notebook lines */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          backgroundImage: `repeating-linear-gradient(0deg, transparent 0px, transparent 31px, ${textColor}08 31px, ${textColor}08 32px)`,
          backgroundPositionY: 'clamp(60px, 14vh, 100px)',
        }}
      />

      {/* Left margin line */}
      <div
        style={{
          position: 'absolute',
          left: 'clamp(40px, 8vw, 65px)',
          top: 0,
          bottom: 0,
          width: 2,
          background: `${accentColor}20`,
          opacity: enterProgress,
        }}
      />

      <div
        style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          flexDirection: 'column',
          padding: '6% 8% 6% clamp(55px, 11vw, 85px)',
          gap: 'clamp(6px, 1.2vh, 12px)',
          opacity: exitOpacity,
          transform: `translateY(${exitEased * 30}px)`,
        }}
      >
        {/* Header */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 'clamp(6px, 1.2vw, 12px)',
            marginBottom: 'clamp(8px, 2vh, 18px)',
            opacity: titleEnter,
            transform: `translateY(${(1 - titleEnter) * -20}px)`,
          }}
        >
          <span style={{ fontSize: 'clamp(20px, 4vw, 32px)' }}>✈️</span>
          <div
            style={{
              fontSize: 'clamp(18px, 4vw, 30px)',
              fontWeight: 900,
              color: accentColor,
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
            }}
          >
            {title}
          </div>
        </div>

        {/* Items */}
        {items.map((item, i) => {
          const itemProg = getItemProgress(i)
          const checkProg = getCheckProgress(i)
          const isChecked = checkProg > 0.5 || i < holdCheckIdx

          return (
            <div
              key={i}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 'clamp(8px, 1.5vw, 14px)',
                opacity: itemProg,
                transform: `translateX(${(1 - itemProg) * 30}px)`,
              }}
            >
              {/* Checkbox */}
              <div
                style={{
                  width: 'clamp(16px, 3vw, 24px)',
                  height: 'clamp(16px, 3vw, 24px)',
                  borderRadius: 'clamp(3px, 0.5vw, 5px)',
                  border: `2px solid ${isChecked ? checkColor : `${textColor}40`}`,
                  background: isChecked ? `${checkColor}20` : 'transparent',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                  transition: 'border-color 0.2s, background 0.2s',
                }}
              >
                {isChecked && (
                  <svg
                    viewBox="0 0 24 24"
                    style={{
                      width: '70%',
                      height: '70%',
                      transform: `scale(${Math.min(1, checkProg * 1.2)})`,
                    }}
                  >
                    <path
                      d="M5 12l5 5L20 7"
                      fill="none"
                      stroke={checkColor}
                      strokeWidth="3"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                )}
              </div>

              {/* Item text */}
              <div
                style={{
                  fontSize: 'clamp(13px, 2.4vw, 20px)',
                  fontWeight: 500,
                  color: isChecked ? `${textColor}60` : textColor,
                  textDecoration: isChecked ? 'line-through' : 'none',
                  transition: 'color 0.2s',
                }}
              >
                {item}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

registerMotionGraphic({
  id: 'tpl-scene-packing-list',
  title: 'Packing List',
  description: 'Packing checklist with staggered items, animated checkmarks, and notebook aesthetic',
  tags: ['scene', 'travel', 'packing', 'checklist', 'list', 'adventure'],
  category: 'scene-layout',
  component: ScenePackingListComponent as any,
  defaultConfig: {
    title: 'PACKING LIST',
    items: ['Passport & documents', 'Sunscreen & hat', 'Camera & charger', 'Comfortable shoes', 'Travel adapter', 'Snacks for the plane'],
    bgColor: '#faf6f0',
    textColor: '#1a1a1a',
    accentColor: '#2563eb',
    checkColor: '#16a34a',
  },
  configSchema: [
    { key: 'title', label: 'Title', type: 'text', defaultValue: 'PACKING LIST', group: 'Content' },
    { key: 'items', label: 'Items', type: 'text-array', defaultValue: ['Passport & documents', 'Sunscreen & hat', 'Camera & charger', 'Comfortable shoes', 'Travel adapter', 'Snacks for the plane'], group: 'Content' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#faf6f0', group: 'Style' },
    { key: 'textColor', label: 'Text Color', type: 'color', defaultValue: '#1a1a1a', group: 'Style' },
    { key: 'accentColor', label: 'Accent Color', type: 'color', defaultValue: '#2563eb', group: 'Style' },
    { key: 'checkColor', label: 'Check Color', type: 'color', defaultValue: '#16a34a', group: 'Style' },
  ],
})
