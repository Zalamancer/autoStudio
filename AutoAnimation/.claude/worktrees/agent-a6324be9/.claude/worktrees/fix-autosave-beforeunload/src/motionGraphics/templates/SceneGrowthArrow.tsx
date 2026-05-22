import React from 'react'
import { registerMotionGraphic } from '../registry'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface SceneGrowthArrowConfig {
  growthValue: string
  label: string
  arrowColor: string
  bgColor: string
  textColor: string
}

function easeOutCubic(t: number): number { return 1 - Math.pow(1 - t, 3) }
function easeInCubic(t: number): number { return t * t * t }

function SceneGrowthArrowComponent({ config, progress }: MotionGraphicProps<SceneGrowthArrowConfig>) {
  const { growthValue, label, arrowColor, bgColor, textColor } = config

  const enterProgress = progress < 0.3 ? progress / 0.3 : 1
  const holdProgress = progress >= 0.3 && progress < 0.8 ? (progress - 0.3) / 0.5 : 0
  const exitProgress = progress >= 0.8 ? (progress - 0.8) / 0.2 : 0

  // Arrow draw progress
  const drawEased = easeOutCubic(enterProgress)

  // The growth curve path points (bottom-left to top-right)
  const points = [
    { x: 60, y: 340 },
    { x: 120, y: 320 },
    { x: 180, y: 290 },
    { x: 240, y: 250 },
    { x: 300, y: 200 },
    { x: 360, y: 150 },
    { x: 420, y: 110 },
    { x: 480, y: 80 },
    { x: 540, y: 60 },
  ]

  // Build polyline string
  const polylinePoints = points.map(p => `${p.x},${p.y}`).join(' ')

  // Calculate total path length (approximate)
  let totalLen = 0
  for (let i = 1; i < points.length; i++) {
    const dx = points[i].x - points[i - 1].x
    const dy = points[i].y - points[i - 1].y
    totalLen += Math.sqrt(dx * dx + dy * dy)
  }

  const dashOffset = totalLen * (1 - drawEased)

  // Arrow tip position (last point of revealed portion)
  const tipIdx = Math.min(Math.floor(drawEased * (points.length - 1)), points.length - 1)
  const tipFrac = (drawEased * (points.length - 1)) - tipIdx
  const tipPoint = tipIdx < points.length - 1
    ? {
        x: points[tipIdx].x + (points[tipIdx + 1].x - points[tipIdx].x) * tipFrac,
        y: points[tipIdx].y + (points[tipIdx + 1].y - points[tipIdx].y) * tipFrac,
      }
    : points[points.length - 1]

  // Stat number appears at tip area
  const statEnter = easeOutCubic(Math.max(0, (enterProgress - 0.5) / 0.5))

  // Hold: glow pulse
  const isHolding = progress >= 0.3 && progress < 0.8
  const glowIntensity = isHolding ? 10 + Math.sin(holdProgress * Math.PI * 5) * 8 : 10

  // Exit: arrow retracts
  const exitEased = easeInCubic(exitProgress)
  const exitDashOffset = exitProgress > 0 ? totalLen * exitEased : 0
  const exitOpacity = exitProgress > 0 ? 1 - exitEased : 1

  // Arrowhead
  const lastP = points[points.length - 1]
  const prevP = points[points.length - 2]
  const angle = Math.atan2(lastP.y - prevP.y, lastP.x - prevP.x) * (180 / Math.PI)

  return (
    <div style={{ position: 'absolute', inset: 0, overflow: 'hidden' }}>
      <div style={{ position: 'absolute', inset: 0, background: bgColor }} />
      <div
        style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          opacity: exitOpacity,
        }}
      >
        <svg
          viewBox="0 0 600 400"
          style={{ width: 'clamp(240px, 55vw, 550px)', height: 'auto' }}
        >
          {/* Grid lines for context */}
          {[100, 150, 200, 250, 300].map(y => (
            <line key={y} x1={50} y1={y} x2={560} y2={y} stroke={`${textColor}10`} strokeWidth={1} />
          ))}

          {/* Growth curve */}
          <polyline
            points={polylinePoints}
            fill="none"
            stroke={arrowColor}
            strokeWidth={5}
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeDasharray={totalLen}
            strokeDashoffset={dashOffset + exitDashOffset}
            style={{ filter: `drop-shadow(0 0 ${glowIntensity}px ${arrowColor}80)` }}
          />

          {/* Area fill under curve */}
          <polygon
            points={`60,340 ${points.slice(0, tipIdx + 1).map(p => `${p.x},${p.y}`).join(' ')} ${tipPoint.x},${tipPoint.y} ${tipPoint.x},340`}
            fill={`${arrowColor}15`}
          />

          {/* Arrowhead */}
          {drawEased > 0.8 && (
            <polygon
              points="-12,-6 0,0 -12,6"
              fill={arrowColor}
              transform={`translate(${lastP.x}, ${lastP.y}) rotate(${angle})`}
              opacity={easeOutCubic(Math.max(0, (drawEased - 0.8) / 0.2))}
            />
          )}

          {/* Dot at tip */}
          <circle
            cx={tipPoint.x}
            cy={tipPoint.y}
            r={6}
            fill={arrowColor}
            opacity={drawEased}
            style={{ filter: `drop-shadow(0 0 6px ${arrowColor})` }}
          />
        </svg>

        {/* Growth stat */}
        <div
          style={{
            position: 'absolute',
            top: '15%',
            right: '12%',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'flex-end',
            opacity: statEnter,
            transform: `translateY(${15 * (1 - statEnter)}px)`,
          }}
        >
          <div
            style={{
              fontFamily: "'Inter', 'Helvetica Neue', sans-serif",
              fontSize: 'clamp(32px, 8vw, 72px)',
              fontWeight: 900,
              color: arrowColor,
              lineHeight: 1.1,
              textShadow: `0 0 ${glowIntensity}px ${arrowColor}60`,
            }}
          >
            {growthValue}
          </div>
          <div
            style={{
              fontFamily: "'Inter', 'Helvetica Neue', sans-serif",
              fontSize: 'clamp(11px, 1.8vw, 18px)',
              fontWeight: 500,
              color: textColor,
              opacity: 0.7,
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
              marginTop: 'clamp(4px, 0.5vw, 8px)',
            }}
          >
            {label}
          </div>
        </div>
      </div>
    </div>
  )
}

registerMotionGraphic({
  id: 'tpl-scene-growth-arrow',
  title: 'Growth Arrow',
  description: 'Upward trending growth curve arrow with animated draw, area fill, stat display, and glow pulse',
  tags: ['scene', 'data', 'growth', 'arrow', 'trend', 'chart', 'line'],
  category: 'scene-layout',
  component: SceneGrowthArrowComponent as any,
  defaultConfig: {
    growthValue: '+340%',
    label: 'Growth',
    arrowColor: '#10b981',
    bgColor: '#0f172a',
    textColor: '#94a3b8',
  },
  configSchema: [
    { key: 'growthValue', label: 'Growth Value', type: 'text', defaultValue: '+340%', group: 'Content' },
    { key: 'label', label: 'Label', type: 'text', defaultValue: 'Growth', group: 'Content' },
    { key: 'arrowColor', label: 'Arrow Color', type: 'color', defaultValue: '#10b981', group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#0f172a', group: 'Style' },
    { key: 'textColor', label: 'Text Color', type: 'color', defaultValue: '#94a3b8', group: 'Style' },
  ],
})
