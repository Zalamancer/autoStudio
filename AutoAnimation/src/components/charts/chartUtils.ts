/** Shared chart constants and SVG helpers */

export const CHART_COLORS = {
  likes: '#f472b6',       // pink-400
  comments: '#4ade80',    // green-400
  shares: '#60a5fa',      // blue-400
  saves: '#fbbf24',       // amber-400
  views: '#a78bfa',       // violet-400
  reach: '#2dd4bf',       // teal-400
  impressions: '#fb923c', // orange-400
  retweets: '#60a5fa',    // blue-400
  quotes: '#c084fc',      // purple-400
  bookmarks: '#fbbf24',   // amber-400
  urlClicks: '#f97316',   // orange-500
  profileClicks: '#2dd4bf', // teal-400
} as const

export const PLATFORM_COLORS = {
  instagram: '#f472b6',
  facebook: '#60a5fa',
  tiktok: '#22d3ee',
  x: '#a1a1aa',
} as const

/** Convert polar coordinates to cartesian (for SVG arc paths) */
export function polarToCartesian(
  cx: number,
  cy: number,
  radius: number,
  angleDeg: number
): { x: number; y: number } {
  const angleRad = ((angleDeg - 90) * Math.PI) / 180
  return {
    x: cx + radius * Math.cos(angleRad),
    y: cy + radius * Math.sin(angleRad),
  }
}

/** Generate an SVG arc path from startAngle to endAngle (in degrees) */
export function describeArc(
  cx: number,
  cy: number,
  radius: number,
  startAngle: number,
  endAngle: number
): string {
  const start = polarToCartesian(cx, cy, radius, endAngle)
  const end = polarToCartesian(cx, cy, radius, startAngle)
  const largeArcFlag = endAngle - startAngle <= 180 ? '0' : '1'

  return [
    'M', start.x, start.y,
    'A', radius, radius, 0, largeArcFlag, 0, end.x, end.y,
  ].join(' ')
}

/** Format a number compactly (1234 → 1.2K) */
export function formatCompact(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`
  return n.toLocaleString()
}
