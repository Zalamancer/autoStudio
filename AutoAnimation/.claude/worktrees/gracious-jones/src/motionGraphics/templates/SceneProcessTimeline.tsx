import React from 'react'
import { registerMotionGraphic } from '../registry'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface ProcessTimelineConfig {
  steps: string[]
  title: string
  bgColor: string
  accentColor: string
  textColor: string
  layout: 'horizontal' | 'vertical'
}

function SceneProcessTimelineComponent({
  config,
  frame,
  durationInFrames,
}: MotionGraphicProps<ProcessTimelineConfig>) {
  const { steps, title, bgColor, accentColor, textColor, layout } = config
  const progress = frame / durationInFrames
  const stepCount = steps.length

  const easeOutCubic = (t: number): number => 1 - Math.pow(1 - t, 3)
  const easeOutBack = (t: number): number => {
    const c1 = 1.70158
    const c3 = c1 + 1
    return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2)
  }

  // Title: 0-0.15
  const titleProgress = easeOutCubic(Math.min(1, progress / 0.15))

  // Line draws: 0.1-0.8
  const lineStart = 0.1
  const lineEnd = 0.8
  const lineProgress = easeOutCubic(
    Math.max(0, Math.min(1, (progress - lineStart) / (lineEnd - lineStart)))
  )

  // Each step appears as line reaches it
  const getStepProgress = (index: number): number => {
    const threshold = lineStart + ((index + 0.5) / stepCount) * (lineEnd - lineStart)
    const stepDur = 0.12
    return easeOutBack(Math.max(0, Math.min(1, (progress - threshold) / stepDur)))
  }

  // Label appears after step node
  const getLabelProgress = (index: number): number => {
    const threshold = lineStart + ((index + 0.7) / stepCount) * (lineEnd - lineStart)
    const labelDur = 0.1
    return easeOutCubic(Math.max(0, Math.min(1, (progress - threshold) / labelDur)))
  }

  const isHorizontal = layout === 'horizontal'

  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        background: bgColor,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
        fontFamily: "'Helvetica Neue', Arial, sans-serif",
        padding: '5%',
      }}
    >
      {/* Title */}
      <div
        style={{
          fontSize: 'clamp(20px, 4vw, 40px)',
          fontWeight: 800,
          color: textColor,
          opacity: titleProgress,
          transform: `translateY(${(1 - titleProgress) * -30}px)`,
          marginBottom: isHorizontal ? '8%' : '5%',
          textTransform: 'uppercase',
          letterSpacing: 2,
        }}
      >
        {title}
      </div>

      {/* Steps container */}
      <div
        style={{
          position: 'relative',
          display: 'flex',
          flexDirection: isHorizontal ? 'row' : 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: isHorizontal ? 'clamp(30px, 6vw, 80px)' : 'clamp(20px, 4vh, 50px)',
          width: isHorizontal ? '85%' : 'auto',
        }}
      >
        {/* Connecting line (background) */}
        <div
          style={{
            position: 'absolute',
            ...(isHorizontal
              ? {
                  top: '20px',
                  left: '10%',
                  right: '10%',
                  height: 3,
                  background: `${accentColor}20`,
                }
              : {
                  left: '20px',
                  top: '5%',
                  bottom: '5%',
                  width: 3,
                  background: `${accentColor}20`,
                }),
          }}
        />

        {/* Connecting line (animated fill) */}
        <div
          style={{
            position: 'absolute',
            ...(isHorizontal
              ? {
                  top: '20px',
                  left: '10%',
                  height: 3,
                  width: `${lineProgress * 80}%`,
                  background: accentColor,
                }
              : {
                  left: '20px',
                  top: '5%',
                  width: 3,
                  height: `${lineProgress * 90}%`,
                  background: accentColor,
                }),
            boxShadow: `0 0 10px ${accentColor}60`,
          }}
        />

        {steps.map((step, i) => {
          const stepProg = getStepProgress(i)
          const labelProg = getLabelProgress(i)
          return (
            <div
              key={i}
              style={{
                display: 'flex',
                flexDirection: isHorizontal ? 'column' : 'row',
                alignItems: 'center',
                gap: isHorizontal ? 12 : 16,
                zIndex: 2,
              }}
            >
              {/* Step node */}
              <div
                style={{
                  width: 40,
                  height: 40,
                  minWidth: 40,
                  borderRadius: '50%',
                  background: stepProg > 0 ? accentColor : `${accentColor}30`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transform: `scale(${stepProg})`,
                  boxShadow: stepProg > 0.5 ? `0 0 15px ${accentColor}50` : 'none',
                  fontSize: 16,
                  fontWeight: 700,
                  color: '#FFFFFF',
                }}
              >
                {i + 1}
              </div>

              {/* Step label */}
              <div
                style={{
                  fontSize: 'clamp(12px, 2vw, 18px)',
                  fontWeight: 600,
                  color: textColor,
                  opacity: labelProg,
                  transform: isHorizontal
                    ? `translateY(${(1 - labelProg) * 15}px)`
                    : `translateX(${(1 - labelProg) * 15}px)`,
                  textAlign: isHorizontal ? 'center' : 'left',
                  maxWidth: isHorizontal ? 120 : 200,
                }}
              >
                {step}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

registerMotionGraphic({
  id: 'tpl-scene-process-timeline',
  title: 'Scene Process Timeline',
  description:
    'Step-by-step process visualization with an animated connecting line and pop-in nodes',
  tags: ['scene', 'process', 'timeline', 'steps', 'workflow'],
  category: 'scene-layout',
  component: SceneProcessTimelineComponent as unknown as React.ComponentType<MotionGraphicProps>,
  configSchema: [
    { key: 'steps', label: 'Steps', type: 'text-array', defaultValue: ['Research', 'Design', 'Build', 'Launch'], group: 'Content' },
    { key: 'title', label: 'Title', type: 'text', defaultValue: 'OUR PROCESS', group: 'Content' },
    { key: 'layout', label: 'Layout', type: 'select', defaultValue: 'horizontal', options: ['horizontal', 'vertical'], group: 'Layout' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#0F0F1A', group: 'Style' },
    { key: 'accentColor', label: 'Accent Color', type: 'color', defaultValue: '#7C3AED', group: 'Style' },
    { key: 'textColor', label: 'Text Color', type: 'color', defaultValue: '#FFFFFF', group: 'Style' },
  ],
  defaultConfig: {
    steps: ['Research', 'Design', 'Build', 'Launch'],
    title: 'OUR PROCESS',
    bgColor: '#0F0F1A',
    accentColor: '#7C3AED',
    textColor: '#FFFFFF',
    layout: 'horizontal' as const,
  },
})
