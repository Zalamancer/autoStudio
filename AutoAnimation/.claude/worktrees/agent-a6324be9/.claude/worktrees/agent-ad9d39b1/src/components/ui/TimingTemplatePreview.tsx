import React from 'react'
import type { TimingTemplate } from '@/types/timingTemplate'

const PROPERTY_COLORS: Record<string, string> = {
  'opacity': '#22c55e',
  'scale': '#f97316',
  'position.x': '#3b82f6',
  'position.y': '#8b5cf6',
  'rotation': '#ef4444',
  'freeX': '#3b82f6',
  'freeY': '#8b5cf6',
}

interface TimingTemplatePreviewProps {
  template: TimingTemplate
  className?: string
}

export const TimingTemplatePreview: React.FC<TimingTemplatePreviewProps> = ({ template, className = '' }) => {
  const width = 160
  const height = 24
  const padding = 4

  return (
    <svg width={width} height={height} className={`rounded bg-zinc-800/50 ${className}`}>
      {/* Background bar */}
      <rect x={padding} y={height / 2 - 1} width={width - padding * 2} height={2} rx={1} fill="#27272a" />

      {/* Keyframe diamonds per track */}
      {template.tracks.map((track, trackIdx) => {
        const color = PROPERTY_COLORS[track.property] ?? '#6b7280'
        const yOffset = (trackIdx - (template.tracks.length - 1) / 2) * 3

        return track.keyframes.map((kf, kfIdx) => {
          const x = padding + kf.relativePosition * (width - padding * 2)
          const y = height / 2 + yOffset

          return (
            <g key={`${trackIdx}-${kfIdx}`}>
              <rect
                x={x - 2.5}
                y={y - 2.5}
                width={5}
                height={5}
                rx={0.5}
                fill={color}
                opacity={0.9}
                transform={`rotate(45, ${x}, ${y})`}
              />
            </g>
          )
        })
      })}
    </svg>
  )
}
