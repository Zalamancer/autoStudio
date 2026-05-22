import { useState, useEffect, useMemo } from 'react'

export interface DonutSegment {
  label: string
  value: number
  color: string
}

interface DonutChartProps {
  data: DonutSegment[]
  centerValue?: string
  centerLabel?: string
  size?: number
}

const STROKE_WIDTH = 14
const ANIM_DURATION = 800 // ms

export function DonutChart({
  data,
  centerValue,
  centerLabel,
  size = 120,
}: DonutChartProps) {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    const id = requestAnimationFrame(() => setMounted(true))
    return () => cancelAnimationFrame(id)
  }, [])

  const radius = (size - STROKE_WIDTH) / 2
  const circumference = 2 * Math.PI * radius
  const cx = size / 2
  const cy = size / 2

  const total = useMemo(() => data.reduce((sum, d) => sum + d.value, 0), [data])

  // Calculate dash offsets for each segment
  const segments = useMemo(() => {
    let accumulated = 0
    return data
      .filter((d) => d.value > 0)
      .map((d) => {
        const fraction = total > 0 ? d.value / total : 0
        const dashLen = circumference * fraction
        const offset = circumference - dashLen
        // Rotate so segment starts where the previous one ended
        const rotation = (accumulated / total) * 360
        accumulated += d.value
        return { ...d, fraction, dashLen, offset, rotation }
      })
  }, [data, total, circumference])

  if (total === 0) {
    return (
      <div className="flex flex-col items-center">
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
          <circle
            cx={cx}
            cy={cy}
            r={radius}
            fill="none"
            stroke="#3f3f46"
            strokeWidth={STROKE_WIDTH}
          />
          <text x={cx} y={cy} textAnchor="middle" dy="0.35em" fill="#71717a" fontSize="12">
            No data
          </text>
        </svg>
      </div>
    )
  }

  return (
    <div className="flex flex-col items-center gap-2">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        {/* Background ring */}
        <circle
          cx={cx}
          cy={cy}
          r={radius}
          fill="none"
          stroke="#3f3f46"
          strokeWidth={STROKE_WIDTH}
        />

        {/* Data segments */}
        {segments.map((seg, i) => (
          <circle
            key={seg.label}
            cx={cx}
            cy={cy}
            r={radius}
            fill="none"
            stroke={seg.color}
            strokeWidth={STROKE_WIDTH}
            strokeLinecap="butt"
            strokeDasharray={`${seg.dashLen} ${circumference - seg.dashLen}`}
            strokeDashoffset={mounted ? 0 : circumference}
            transform={`rotate(${seg.rotation - 90} ${cx} ${cy})`}
            style={{
              transition: `stroke-dashoffset ${ANIM_DURATION}ms ease-out ${i * 100}ms`,
            }}
          />
        ))}

        {/* Center text */}
        {centerValue && (
          <text
            x={cx}
            y={centerLabel ? cy - 4 : cy}
            textAnchor="middle"
            dy="0.35em"
            fill="#ffffff"
            fontSize="16"
            fontWeight="600"
          >
            {centerValue}
          </text>
        )}
        {centerLabel && (
          <text
            x={cx}
            y={cy + 12}
            textAnchor="middle"
            dy="0.35em"
            fill="#71717a"
            fontSize="9"
          >
            {centerLabel}
          </text>
        )}
      </svg>

      {/* Legend */}
      <div className="flex flex-wrap justify-center gap-x-3 gap-y-1">
        {segments.map((seg) => (
          <div key={seg.label} className="flex items-center gap-1">
            <span
              className="w-2 h-2 rounded-full shrink-0"
              style={{ backgroundColor: seg.color }}
            />
            <span className="text-[10px] text-zinc-400">{seg.label}</span>
            <span className="text-[10px] text-zinc-500">
              {total > 0 ? Math.round(seg.fraction * 100) : 0}%
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}
