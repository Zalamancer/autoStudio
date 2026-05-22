import React from 'react'
import { registerMotionGraphic } from '../registry'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface FloorPlanConfig {
  roomName: string
  dimensions: string
  sqft: number
  roomCount: number
  bgColor: string
  lineColor: string
  accentColor: string
  textColor: string
}

function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3)
}

function easeInCubic(t: number): number {
  return t * t * t
}

function SceneFloorPlanComponent({
  config,
  frame,
  durationInFrames,
}: MotionGraphicProps<FloorPlanConfig>) {
  const { roomName, dimensions, sqft, roomCount, bgColor, lineColor, accentColor, textColor } = config
  const progress = frame / durationInFrames

  const enterEnd = 0.25
  const holdEnd = 0.8
  const enterProgress = Math.min(1, progress / enterEnd)
  const holdProgress = progress >= enterEnd && progress < holdEnd ? (progress - enterEnd) / (holdEnd - enterEnd) : progress >= holdEnd ? 1 : 0
  const exitProgress = progress >= holdEnd ? (progress - holdEnd) / (1 - holdEnd) : 0

  // Plan draws in
  const drawProgress = easeOutCubic(Math.min(1, enterProgress / 0.6))
  // Labels fade in
  const labelProgress = easeOutCubic(Math.max(0, Math.min(1, (enterProgress - 0.4) / 0.4)))
  // Stats slide up
  const statsProgress = easeOutCubic(Math.max(0, Math.min(1, (enterProgress - 0.6) / 0.35)))

  // Exit
  const exitEased = easeInCubic(exitProgress)
  const exitOpacity = 1 - exitEased
  const exitScale = 1 - exitEased * 0.1

  // Measurement scan line
  const scanX = holdProgress * 100

  const svgW = 280
  const svgH = 200

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
        fontFamily: "'Helvetica Neue', Arial, sans-serif",
        padding: '5%',
      }}
    >
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 'clamp(14px, 3vh, 28px)',
          transform: `scale(${exitScale})`,
          opacity: exitOpacity,
        }}
      >
        {/* Title */}
        <div
          style={{
            fontSize: 'clamp(10px, 1.8vw, 14px)',
            fontWeight: 700,
            color: accentColor,
            letterSpacing: 4,
            textTransform: 'uppercase',
            opacity: labelProgress,
          }}
        >
          FLOOR PLAN
        </div>

        {/* Floor plan SVG */}
        <div style={{ position: 'relative', width: '100%', maxWidth: svgW }}>
          <svg
            viewBox={`0 0 ${svgW} ${svgH}`}
            style={{ width: '100%', height: 'auto' }}
          >
            {/* Main room outline - draws in */}
            <rect
              x={10} y={10} width={260} height={140}
              fill="none"
              stroke={lineColor}
              strokeWidth={2}
              strokeDasharray={800}
              strokeDashoffset={800 * (1 - drawProgress)}
            />
            {/* Interior walls */}
            <line
              x1={120} y1={10} x2={120} y2={100}
              stroke={lineColor}
              strokeWidth={1.5}
              strokeDasharray={90}
              strokeDashoffset={90 * (1 - drawProgress)}
            />
            <line
              x1={120} y1={100} x2={200} y2={100}
              stroke={lineColor}
              strokeWidth={1.5}
              strokeDasharray={80}
              strokeDashoffset={80 * (1 - drawProgress)}
            />
            {/* Door arcs */}
            <path
              d="M 120 100 A 25 25 0 0 0 145 75"
              fill="none"
              stroke={accentColor}
              strokeWidth={0.8}
              strokeDasharray="3 3"
              opacity={drawProgress}
            />
            <path
              d="M 50 150 A 20 20 0 0 1 70 130"
              fill="none"
              stroke={accentColor}
              strokeWidth={0.8}
              strokeDasharray="3 3"
              opacity={drawProgress}
            />
            {/* Window markers */}
            <line x1={160} y1={10} x2={200} y2={10} stroke={accentColor} strokeWidth={3} opacity={drawProgress * 0.6} />
            <line x1={270} y1={50} x2={270} y2={90} stroke={accentColor} strokeWidth={3} opacity={drawProgress * 0.6} />
            {/* Room labels */}
            <text x={55} y={85} fontSize={9} fill={textColor} opacity={labelProgress} textAnchor="middle" fontFamily="Helvetica, Arial, sans-serif">
              Living
            </text>
            <text x={55} y={97} fontSize={7} fill={`${textColor}80`} opacity={labelProgress} textAnchor="middle" fontFamily="Helvetica, Arial, sans-serif">
              4.5 x 3.8m
            </text>
            <text x={190} y={55} fontSize={9} fill={textColor} opacity={labelProgress} textAnchor="middle" fontFamily="Helvetica, Arial, sans-serif">
              Bedroom
            </text>
            <text x={190} y={67} fontSize={7} fill={`${textColor}80`} opacity={labelProgress} textAnchor="middle" fontFamily="Helvetica, Arial, sans-serif">
              3.2 x 3.0m
            </text>
            <text x={160} y={130} fontSize={9} fill={textColor} opacity={labelProgress} textAnchor="middle" fontFamily="Helvetica, Arial, sans-serif">
              Kitchen
            </text>
            {/* Dimension lines */}
            <line x1={10} y1={165} x2={270} y2={165} stroke={`${textColor}30`} strokeWidth={0.5} opacity={labelProgress} />
            <text x={140} y={178} fontSize={8} fill={`${textColor}60`} opacity={labelProgress} textAnchor="middle" fontFamily="Courier New, monospace">
              {dimensions}
            </text>
          </svg>
          {/* Scanning measurement line */}
          {holdProgress > 0 && holdProgress < 1 && (
            <div
              style={{
                position: 'absolute',
                top: 0,
                left: `${scanX}%`,
                width: 1,
                height: '100%',
                background: `${accentColor}30`,
                pointerEvents: 'none',
              }}
            />
          )}
        </div>

        {/* Room name */}
        <div
          style={{
            fontSize: 'clamp(18px, 4vw, 32px)',
            fontWeight: 800,
            color: textColor,
            opacity: labelProgress,
            transform: `translateY(${(1 - labelProgress) * 10}px)`,
            textAlign: 'center',
          }}
        >
          {roomName}
        </div>

        {/* Stats row */}
        <div
          style={{
            display: 'flex',
            gap: 'clamp(16px, 4vw, 36px)',
            opacity: statsProgress,
            transform: `translateY(${(1 - statsProgress) * 15}px)`,
          }}
        >
          {[
            { label: 'SQ FT', value: `${Math.round(statsProgress * sqft).toLocaleString()}` },
            { label: 'ROOMS', value: `${Math.round(statsProgress * roomCount)}` },
            { label: 'SIZE', value: dimensions },
          ].map((stat, i) => (
            <div key={i} style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 'clamp(18px, 3.5vw, 28px)', fontWeight: 800, color: accentColor, lineHeight: 1.1 }}>
                {stat.value}
              </div>
              <div style={{ fontSize: 'clamp(8px, 1.3vw, 11px)', fontWeight: 600, color: `${textColor}60`, letterSpacing: 2, marginTop: 4 }}>
                {stat.label}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

registerMotionGraphic({
  id: 'tpl-scene-floor-plan',
  title: 'Scene Floor Plan',
  description: 'Architectural floor plan layout with animated room walls, door arcs, dimension lines, room labels, and animated stats',
  tags: ['scene', 'architecture', 'floor-plan', 'blueprint', 'room', 'layout', 'interior', 'real-estate'],
  category: 'scene-layout',
  component: SceneFloorPlanComponent as unknown as React.ComponentType<MotionGraphicProps>,
  configSchema: [
    { key: 'roomName', label: 'Property Name', type: 'text', defaultValue: 'Modern Studio Apartment', group: 'Content' },
    { key: 'dimensions', label: 'Dimensions', type: 'text', defaultValue: '12.5 x 8.2m', group: 'Content' },
    { key: 'sqft', label: 'Square Feet', type: 'number', defaultValue: 850, min: 100, max: 50000, group: 'Content' },
    { key: 'roomCount', label: 'Room Count', type: 'number', defaultValue: 3, min: 1, max: 20, group: 'Content' },
    { key: 'accentColor', label: 'Accent Color', type: 'color', defaultValue: '#2563EB', group: 'Style' },
    { key: 'lineColor', label: 'Line Color', type: 'color', defaultValue: '#64748B', group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#F8FAFC', group: 'Style' },
    { key: 'textColor', label: 'Text Color', type: 'color', defaultValue: '#1E293B', group: 'Style' },
  ],
  defaultConfig: {
    roomName: 'Modern Studio Apartment',
    dimensions: '12.5 x 8.2m',
    sqft: 850,
    roomCount: 3,
    accentColor: '#2563EB',
    lineColor: '#64748B',
    bgColor: '#F8FAFC',
    textColor: '#1E293B',
  },
})
