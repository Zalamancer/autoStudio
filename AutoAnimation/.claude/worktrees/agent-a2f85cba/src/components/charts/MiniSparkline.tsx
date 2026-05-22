/**
 * Tiny trend line for stat cards (skeleton for future historical data).
 * Renders an SVG polyline with no axes — purely visual.
 * If no data provided, renders nothing.
 */

interface MiniSparklineProps {
  data?: number[]
  color?: string
  width?: number
  height?: number
}

export function MiniSparkline({
  data,
  color = '#4ade80',
  width = 60,
  height = 20,
}: MiniSparklineProps) {
  if (!data || data.length < 2) return null

  const min = Math.min(...data)
  const max = Math.max(...data)
  const range = max - min || 1

  const points = data
    .map((val, i) => {
      const x = (i / (data.length - 1)) * width
      const y = height - ((val - min) / range) * (height - 2) - 1
      return `${x},${y}`
    })
    .join(' ')

  // Build area path for gradient fill
  const areaPath = [
    `M 0,${height}`,
    ...data.map((val, i) => {
      const x = (i / (data.length - 1)) * width
      const y = height - ((val - min) / range) * (height - 2) - 1
      return `L ${x},${y}`
    }),
    `L ${width},${height}`,
    'Z',
  ].join(' ')

  const gradientId = `spark-${Math.random().toString(36).slice(2, 8)}`

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      className="shrink-0"
    >
      <defs>
        <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.3" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={areaPath} fill={`url(#${gradientId})`} />
      <polyline
        points={points}
        fill="none"
        stroke={color}
        strokeWidth="1.5"
        strokeLinejoin="round"
        strokeLinecap="round"
      />
    </svg>
  )
}
