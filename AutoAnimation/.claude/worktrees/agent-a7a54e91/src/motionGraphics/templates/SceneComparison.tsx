import React from 'react'
import { registerMotionGraphic } from '../registry'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface ComparisonConfig {
  leftTitle: string
  rightTitle: string
  leftItems: string[]
  rightItems: string[]
  vsText: string
  bgColor: string
  leftColor: string
  rightColor: string
}

function SceneComparisonComponent({
  config,
  frame,
  durationInFrames,
}: MotionGraphicProps<ComparisonConfig>) {
  const { leftTitle, rightTitle, leftItems, rightItems, vsText, bgColor, leftColor, rightColor } =
    config
  const progress = frame / durationInFrames

  const easeOutCubic = (t: number): number => 1 - Math.pow(1 - t, 3)
  const easeOutBack = (t: number): number => {
    const c1 = 1.70158
    const c3 = c1 + 1
    return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2)
  }

  // VS badge: appears 0-0.2
  const vsProgress = Math.min(1, progress / 0.2)
  const vsScale = easeOutBack(vsProgress)
  const vsOpacity = easeOutCubic(vsProgress)

  // Columns slide in: 0.1-0.35
  const colStart = 0.1
  const colEnd = 0.35
  const colProgress = Math.max(0, Math.min(1, (progress - colStart) / (colEnd - colStart)))
  const colEased = easeOutCubic(colProgress)
  const leftSlide = (1 - colEased) * -100
  const rightSlide = (1 - colEased) * 100

  // Items stagger: 0.25-0.7
  const maxItems = Math.max(leftItems.length, rightItems.length)

  const getItemOpacity = (index: number): number => {
    const itemStart = 0.25 + index * (0.45 / Math.max(maxItems, 1))
    const itemEnd = itemStart + 0.12
    return easeOutCubic(Math.max(0, Math.min(1, (progress - itemStart) / (itemEnd - itemStart))))
  }
  const getItemSlide = (index: number): number => {
    return (1 - getItemOpacity(index)) * 20
  }

  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        background: bgColor,
        display: 'flex',
        alignItems: 'stretch',
        overflow: 'hidden',
        fontFamily: "'Helvetica Neue', Arial, sans-serif",
      }}
    >
      {/* Left column */}
      <div
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          padding: '5%',
          transform: `translateX(${leftSlide}%)`,
          borderRight: `2px solid ${leftColor}30`,
        }}
      >
        <div
          style={{
            fontSize: 'clamp(20px, 4vw, 40px)',
            fontWeight: 800,
            color: leftColor,
            marginBottom: '8%',
            textTransform: 'uppercase',
            letterSpacing: 2,
          }}
        >
          {leftTitle}
        </div>
        {leftItems.map((item, i) => (
          <div
            key={i}
            style={{
              fontSize: 'clamp(14px, 2.5vw, 24px)',
              color: '#FFFFFF',
              opacity: getItemOpacity(i),
              transform: `translateY(${getItemSlide(i)}px)`,
              marginBottom: '4%',
              padding: '3% 4%',
              background: `${leftColor}15`,
              borderRadius: 8,
              borderLeft: `3px solid ${leftColor}`,
            }}
          >
            {item}
          </div>
        ))}
      </div>

      {/* VS badge */}
      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: `translate(-50%, -50%) scale(${vsScale})`,
          opacity: vsOpacity,
          zIndex: 10,
        }}
      >
        <div
          style={{
            width: 'clamp(50px, 10vw, 90px)',
            height: 'clamp(50px, 10vw, 90px)',
            borderRadius: '50%',
            background: `linear-gradient(135deg, ${leftColor}, ${rightColor})`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 'clamp(18px, 3.5vw, 32px)',
            fontWeight: 900,
            color: '#FFFFFF',
            boxShadow: `0 0 30px ${leftColor}60, 0 0 30px ${rightColor}60`,
          }}
        >
          {vsText}
        </div>
      </div>

      {/* Right column */}
      <div
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          padding: '5%',
          transform: `translateX(${rightSlide}%)`,
          borderLeft: `2px solid ${rightColor}30`,
        }}
      >
        <div
          style={{
            fontSize: 'clamp(20px, 4vw, 40px)',
            fontWeight: 800,
            color: rightColor,
            marginBottom: '8%',
            textTransform: 'uppercase',
            letterSpacing: 2,
            textAlign: 'right',
          }}
        >
          {rightTitle}
        </div>
        {rightItems.map((item, i) => (
          <div
            key={i}
            style={{
              fontSize: 'clamp(14px, 2.5vw, 24px)',
              color: '#FFFFFF',
              opacity: getItemOpacity(i),
              transform: `translateY(${getItemSlide(i)}px)`,
              marginBottom: '4%',
              padding: '3% 4%',
              background: `${rightColor}15`,
              borderRadius: 8,
              borderRight: `3px solid ${rightColor}`,
              textAlign: 'right',
            }}
          >
            {item}
          </div>
        ))}
      </div>
    </div>
  )
}

registerMotionGraphic({
  id: 'tpl-scene-comparison',
  title: 'Scene Comparison',
  description:
    'Side-by-side comparison with VS badge, sliding columns, and staggered item reveals',
  tags: ['scene', 'comparison', 'versus', 'split'],
  category: 'scene-layout',
  component: SceneComparisonComponent as unknown as React.ComponentType<MotionGraphicProps>,
  configSchema: [
    { key: 'leftTitle', label: 'Left Title', type: 'text', defaultValue: 'Option A', group: 'Content' },
    { key: 'rightTitle', label: 'Right Title', type: 'text', defaultValue: 'Option B', group: 'Content' },
    { key: 'leftItems', label: 'Left Items', type: 'text-array', defaultValue: ['Feature 1', 'Feature 2', 'Feature 3'], group: 'Content' },
    { key: 'rightItems', label: 'Right Items', type: 'text-array', defaultValue: ['Feature 1', 'Feature 2', 'Feature 3'], group: 'Content' },
    { key: 'vsText', label: 'VS Text', type: 'text', defaultValue: 'VS', group: 'Content' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#1A1A2E', group: 'Style' },
    { key: 'leftColor', label: 'Left Color', type: 'color', defaultValue: '#00BFFF', group: 'Style' },
    { key: 'rightColor', label: 'Right Color', type: 'color', defaultValue: '#FF6B35', group: 'Style' },
  ],
  defaultConfig: {
    leftTitle: 'Option A',
    rightTitle: 'Option B',
    leftItems: ['Feature 1', 'Feature 2', 'Feature 3'],
    rightItems: ['Feature 1', 'Feature 2', 'Feature 3'],
    vsText: 'VS',
    bgColor: '#1A1A2E',
    leftColor: '#00BFFF',
    rightColor: '#FF6B35',
  },
})
