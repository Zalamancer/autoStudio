import { useState, useEffect } from 'react'
import { describeArc } from './chartUtils'

interface GaugeChartProps {
  /** Current value */
  value: number
  /** Maximum value for the gauge scale */
  max: number
  /** Label below the value */
  label: string
  /** Optional custom color (otherwise auto-colored by threshold) */
  color?: string
  /** Format the displayed value */
  formatValue?: (n: number) => string
  /** Width of the gauge */
  width?: number
}

const STROKE_WIDTH = 12

export function GaugeChart({
  value,
  max,
  label,
  color,
  formatValue,
  width = 140,
}: GaugeChartProps) {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    const id = requestAnimationFrame(() => setMounted(true))
    return () => cancelAnimationFrame(id)
  }, [])

  const height = width * 0.6
  const cx = width / 2
  const cy = height - 8
  const radius = width / 2 - STROKE_WIDTH

  // Clamp value between 0 and max
  const clamped = Math.min(Math.max(value, 0), max)
  const fraction = max > 0 ? clamped / max : 0

  // Auto-color based on engagement thresholds (if no custom color)
  const autoColor = value > 5 ? '#4ade80' : value > 2 ? '#fbbf24' : '#f87171'
  const fillColor = color || autoColor

  // Arc goes from 180° (left) to 360° (right) — a half circle
  const startAngle = 180
  const endAngle = 360
  const valueEndAngle = startAngle + fraction * (endAngle - startAngle)

  const bgPath = describeArc(cx, cy, radius, startAngle, endAngle)
  const valuePath = describeArc(cx, cy, radius, startAngle, mounted ? valueEndAngle : startAngle)

  const displayValue = formatValue ? formatValue(value) : String(value)

  return (
    <div className="flex flex-col items-center">
      <svg
        width={width}
        height={height}
        viewBox={`0 0 ${width} ${height}`}
        overflow="visible"
      >
        {/* Background arc */}
        <path
          d={bgPath}
          fill="none"
          stroke="#3f3f46"
          strokeWidth={STROKE_WIDTH}
          strokeLinecap="round"
        />

        {/* Value arc */}
        <path
          d={valuePath}
          fill="none"
          stroke={fillColor}
          strokeWidth={STROKE_WIDTH}
          strokeLinecap="round"
          style={{
            transition: 'all 800ms ease-out',
          }}
        />

        {/* Value text */}
        <text
          x={cx}
          y={cy - 8}
          textAnchor="middle"
          fill="#ffffff"
          fontSize="18"
          fontWeight="600"
        >
          {displayValue}
        </text>

        {/* Label */}
        <text
          x={cx}
          y={cy + 8}
          textAnchor="middle"
          fill="#71717a"
          fontSize="9"
        >
          {label}
        </text>
      </svg>
    </div>
  )
}
