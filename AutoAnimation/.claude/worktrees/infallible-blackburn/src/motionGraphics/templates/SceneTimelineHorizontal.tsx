import React from 'react'
import { registerMotionGraphic } from '../registry'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface TimelineHorizontalConfig {
  milestones: string[]
  accentColor: string
  lineColor: string
  bgColor: string
  textColor: string
}

function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3)
}

function easeOutBack(t: number): number {
  const c1 = 1.70158
  const c3 = c1 + 1
  return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2)
}

function SceneTimelineHorizontalComponent({
  config,
  frame,
  durationInFrames,
}: MotionGraphicProps<TimelineHorizontalConfig>) {
  const { milestones, accentColor, lineColor, bgColor, textColor } = config
  const progress = frame / durationInFrames

  const parsed = milestones.map((m) => {
    const parts = m.split(':')
    return { year: parts[0]?.trim() || '', label: parts.slice(1).join(':').trim() || '' }
  })
  const count = parsed.length

  // Enter: line draws left-to-right (0-0.5)
  const lineDrawProgress = easeOutCubic(Math.min(1, progress / 0.5))

  // Each milestone dot appears as the line reaches it
  const getDotProgress = (index: number): number => {
    const dotThreshold = ((index + 1) / count) * 0.5
    const dotStart = dotThreshold - 0.05
    const dotEnd = dotThreshold + 0.08
    return easeOutBack(Math.max(0, Math.min(1, (progress - dotStart) / (dotEnd - dotStart))))
  }

  // Label fade in follows dots
  const getLabelProgress = (index: number): number => {
    const labelStart = ((index + 1) / count) * 0.5 + 0.02
    const labelEnd = labelStart + 0.1
    return easeOutCubic(Math.max(0, Math.min(1, (progress - labelStart) / (labelEnd - labelStart))))
  }

  // Hold: current milestone glows (0.55-0.8)
  const holdProgress = progress >= 0.55 && progress < 0.8 ? (progress - 0.55) / 0.25 : 0
  const glowPulse = holdProgress > 0 ? 0.5 + 0.5 * Math.sin(holdProgress * Math.PI * 4) : 0

  // Exit: line retracts right-to-left (0.8-1.0)
  const exitProgress = progress >= 0.8 ? easeOutCubic((progress - 0.8) / 0.2) : 0
  const lineRetract = exitProgress
  const exitOpacity = 1 - exitProgress

  const lineLeft = 10
  const lineRight = 90
  const lineWidth = lineRight - lineLeft

  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        background: bgColor,
        overflow: 'hidden',
        fontFamily: "'Helvetica Neue', Arial, sans-serif",
        opacity: exitOpacity,
      }}
    >
      {/* Timeline title */}
      <div
        style={{
          position: 'absolute',
          top: '12%',
          width: '100%',
          textAlign: 'center',
          fontSize: 'clamp(14px, 2.5vw, 22px)',
          fontWeight: 700,
          color: `${textColor}80`,
          textTransform: 'uppercase',
          letterSpacing: 4,
          opacity: easeOutCubic(Math.min(1, progress / 0.15)),
        }}
      >
        Timeline
      </div>

      {/* Horizontal line */}
      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: `${lineLeft}%`,
          width: `${lineWidth * lineDrawProgress * (1 - lineRetract)}%`,
          height: 3,
          background: `linear-gradient(90deg, ${lineColor}, ${accentColor})`,
          borderRadius: 2,
          transform: 'translateY(-50%)',
          transformOrigin: 'left center',
        }}
      />

      {/* Milestone dots and labels */}
      {parsed.map((milestone, i) => {
        const x = lineLeft + (lineWidth / (count - 1 || 1)) * i
        const dotProg = getDotProgress(i)
        const labelProg = getLabelProgress(i)
        const isLast = i === count - 1
        const glowAmount = isLast ? glowPulse : 0

        return (
          <React.Fragment key={i}>
            {/* Dot */}
            <div
              style={{
                position: 'absolute',
                top: '50%',
                left: `${x}%`,
                width: 'clamp(12px, 2.5vw, 22px)',
                height: 'clamp(12px, 2.5vw, 22px)',
                borderRadius: '50%',
                background: accentColor,
                transform: `translate(-50%, -50%) scale(${dotProg})`,
                boxShadow: glowAmount > 0
                  ? `0 0 ${8 + glowAmount * 20}px ${accentColor}${Math.round(glowAmount * 200).toString(16).padStart(2, '0')}`
                  : `0 0 8px ${accentColor}40`,
                zIndex: 2,
              }}
            />

            {/* Year above */}
            <div
              style={{
                position: 'absolute',
                top: '36%',
                left: `${x}%`,
                transform: `translate(-50%, -100%)`,
                fontSize: 'clamp(16px, 3vw, 28px)',
                fontWeight: 800,
                color: accentColor,
                opacity: labelProg,
                textAlign: 'center',
                whiteSpace: 'nowrap',
              }}
            >
              {milestone.year}
            </div>

            {/* Label below */}
            <div
              style={{
                position: 'absolute',
                top: '58%',
                left: `${x}%`,
                transform: 'translate(-50%, 0)',
                fontSize: 'clamp(11px, 2vw, 18px)',
                fontWeight: 500,
                color: textColor,
                opacity: labelProg,
                textAlign: 'center',
                maxWidth: `${80 / count}%`,
                lineHeight: 1.4,
              }}
            >
              {milestone.label}
            </div>
          </React.Fragment>
        )
      })}
    </div>
  )
}

registerMotionGraphic({
  id: 'tpl-scene-timeline-horizontal',
  title: 'Horizontal Timeline',
  description:
    'Horizontal timeline with milestones that pop in as the line draws, with glow effect and retract exit',
  tags: ['scene', 'educational', 'timeline', 'milestones', 'history'],
  category: 'scene-layout',
  component: SceneTimelineHorizontalComponent as unknown as React.ComponentType<MotionGraphicProps>,
  configSchema: [
    { key: 'milestones', label: 'Milestones (Year:Label)', type: 'text-array', defaultValue: ['2020:Founded', '2021:First Product', '2023:Series A', '2024:Global Launch'], group: 'Content' },
    { key: 'accentColor', label: 'Accent Color', type: 'color', defaultValue: '#4A90D9', group: 'Style' },
    { key: 'lineColor', label: 'Line Color', type: 'color', defaultValue: '#4A90D940', group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#0F0F1A', group: 'Style' },
    { key: 'textColor', label: 'Text Color', type: 'color', defaultValue: '#E0E0E0', group: 'Style' },
  ],
  defaultConfig: {
    milestones: ['2020:Founded', '2021:First Product', '2023:Series A', '2024:Global Launch'],
    accentColor: '#4A90D9',
    lineColor: '#4A90D940',
    bgColor: '#0F0F1A',
    textColor: '#E0E0E0',
  },
})
