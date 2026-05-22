import React from 'react'
import { registerMotionGraphic } from '../registry'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface DIYSuppliesConfig {
  projectName: string
  supplies: string[]
  estimatedCost: string
  bgColor: string
  accentColor: string
  textColor: string
}

function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3)
}

function easeInCubic(t: number): number {
  return t * t * t
}

function SceneDIYSuppliesComponent({ config, progress }: MotionGraphicProps<DIYSuppliesConfig>) {
  const { projectName, supplies, estimatedCost, bgColor, accentColor, textColor } = config

  const parsedSupplies = supplies.map((s) => {
    const parts = s.split('|')
    return { item: parts[0] || 'Item', qty: parts[1] || '1x' }
  })

  // Enter: 0-0.2
  const enterP = progress < 0.2 ? progress / 0.2 : 1
  // Exit: 0.8-1.0
  const exitP = progress > 0.8 ? (progress - 0.8) / 0.2 : 0
  const overallOpacity = exitP > 0 ? 1 - easeInCubic(exitP) : 1

  // Title slides down
  const titleP = easeOutCubic(Math.min(1, enterP / 0.5))

  // Items check off staggered
  const getItemProgress = (index: number): number => {
    const staggerDelay = 0.1
    const itemStart = 0.3 + index * staggerDelay
    const itemDur = 0.15
    if (progress < itemStart) return 0
    return easeOutCubic(Math.min(1, (progress - itemStart) / itemDur))
  }

  // Cost reveal: 0.6-0.75
  const costP = easeOutCubic(Math.max(0, Math.min(1, (progress - 0.6) / 0.15)))

  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        background: bgColor,
        overflow: 'hidden',
        fontFamily: "'Georgia', 'Times New Roman', serif",
        opacity: overallOpacity,
      }}
    >
      {/* Craft paper texture overlay */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: `repeating-linear-gradient(
            0deg,
            transparent,
            transparent 28px,
            ${accentColor}08 28px,
            ${accentColor}08 29px
          )`,
          pointerEvents: 'none',
        }}
      />

      {/* Notebook margin line */}
      <div
        style={{
          position: 'absolute',
          left: '10%',
          top: 0,
          bottom: 0,
          width: 2,
          background: `${accentColor}30`,
        }}
      />

      <div style={{ position: 'relative', padding: '6% 8% 6% 14%' }}>
        {/* Project name header */}
        <div
          style={{
            fontSize: 'clamp(20px, 4.5vw, 38px)',
            fontWeight: 700,
            color: accentColor,
            opacity: titleP,
            transform: `translateY(${(1 - titleP) * -30}px)`,
            marginBottom: '2%',
            fontStyle: 'italic',
          }}
        >
          {projectName}
        </div>

        {/* "SUPPLIES NEEDED" subtitle */}
        <div
          style={{
            fontSize: 'clamp(12px, 2.2vw, 18px)',
            fontWeight: 600,
            color: textColor,
            opacity: titleP * 0.7,
            textTransform: 'uppercase',
            letterSpacing: 3,
            marginBottom: '5%',
            borderBottom: `2px dashed ${accentColor}40`,
            paddingBottom: '2%',
          }}
        >
          Supplies Needed
        </div>

        {/* Supply list */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'clamp(6px, 1.5vh, 14px)' }}>
          {parsedSupplies.map((supply, i) => {
            const ip = getItemProgress(i)
            const checkScale = ip > 0.5 ? easeOutCubic((ip - 0.5) / 0.5) : 0

            return (
              <div
                key={i}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 'clamp(8px, 2vw, 16px)',
                  opacity: ip,
                  transform: `translateX(${(1 - ip) * 40}px)`,
                }}
              >
                {/* Checkbox */}
                <div
                  style={{
                    width: 'clamp(18px, 3vw, 26px)',
                    height: 'clamp(18px, 3vw, 26px)',
                    borderRadius: 4,
                    border: `2px solid ${accentColor}`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                    background: checkScale > 0 ? `${accentColor}20` : 'transparent',
                  }}
                >
                  <span
                    style={{
                      fontSize: 'clamp(12px, 2vw, 18px)',
                      transform: `scale(${checkScale})`,
                      color: accentColor,
                    }}
                  >
                    {checkScale > 0.3 ? '\u2713' : ''}
                  </span>
                </div>

                {/* Item name */}
                <span
                  style={{
                    fontSize: 'clamp(14px, 2.5vw, 22px)',
                    color: textColor,
                    flex: 1,
                  }}
                >
                  {supply.item}
                </span>

                {/* Quantity */}
                <span
                  style={{
                    fontSize: 'clamp(12px, 2vw, 18px)',
                    color: accentColor,
                    fontWeight: 700,
                    opacity: 0.8,
                  }}
                >
                  {supply.qty}
                </span>
              </div>
            )
          })}
        </div>

        {/* Estimated cost footer */}
        <div
          style={{
            marginTop: '6%',
            padding: 'clamp(8px, 2%, 16px) clamp(12px, 3%, 20px)',
            background: `${accentColor}15`,
            borderRadius: 8,
            border: `1px dashed ${accentColor}40`,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            opacity: costP,
            transform: `translateY(${(1 - costP) * 20}px)`,
          }}
        >
          <span
            style={{
              fontSize: 'clamp(12px, 2vw, 16px)',
              color: textColor,
              opacity: 0.7,
              textTransform: 'uppercase',
              letterSpacing: 2,
            }}
          >
            Est. Cost
          </span>
          <span
            style={{
              fontSize: 'clamp(18px, 3.5vw, 30px)',
              fontWeight: 800,
              color: accentColor,
            }}
          >
            {estimatedCost}
          </span>
        </div>
      </div>
    </div>
  )
}

registerMotionGraphic({
  id: 'tpl-scene-diy-supplies',
  title: 'Scene DIY Supplies',
  description: 'Supply list for a DIY project with staggered checkbox animations and craft paper aesthetic',
  tags: ['scene', 'diy', 'supplies', 'craft', 'checklist', 'materials'],
  category: 'scene-layout',
  component: SceneDIYSuppliesComponent as unknown as React.ComponentType<MotionGraphicProps>,
  configSchema: [
    { key: 'projectName', label: 'Project Name', type: 'text', defaultValue: 'Wooden Shelf Build', group: 'Content' },
    {
      key: 'supplies',
      label: 'Supplies (item|qty)',
      type: 'text-array',
      defaultValue: [
        'Pine wood boards|3 pcs',
        'Wood screws|12 pcs',
        'Sandpaper (120 grit)|2 sheets',
        'Wood stain|1 can',
        'L-brackets|4 pcs',
      ],
      group: 'Content',
    },
    { key: 'estimatedCost', label: 'Estimated Cost', type: 'text', defaultValue: '$24.99', group: 'Content' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#FEF3E2', group: 'Style' },
    { key: 'accentColor', label: 'Accent Color', type: 'color', defaultValue: '#8B5E34', group: 'Style' },
    { key: 'textColor', label: 'Text Color', type: 'color', defaultValue: '#3E2723', group: 'Style' },
  ],
  defaultConfig: {
    projectName: 'Wooden Shelf Build',
    supplies: [
      'Pine wood boards|3 pcs',
      'Wood screws|12 pcs',
      'Sandpaper (120 grit)|2 sheets',
      'Wood stain|1 can',
      'L-brackets|4 pcs',
    ],
    estimatedCost: '$24.99',
    bgColor: '#FEF3E2',
    accentColor: '#8B5E34',
    textColor: '#3E2723',
  },
})
