import { registerMotionGraphic } from '../registry'
import {
  KineticBase,
  type KineticBaseConfig,
  type KineticAnimation,
  type WordRenderProps,
  type BackgroundRenderProps,
} from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface TrendingUpConfig extends KineticBaseConfig {
  arrowColor: string
  showChart: boolean
}

function seededRand(seed: number): number {
  const x = Math.sin(seed * 127.1 + 311.7) * 43758.5453
  return x - Math.floor(x)
}

const animation: KineticAnimation = {
  renderBackground: ({ bgColor, width, height, frame }: BackgroundRenderProps) => {
    // Animated micro chart lines in bg
    const chartLines = Array.from({ length: 5 }).map((_, i) => {
      const baseY = 0.3 + i * 0.12
      const points: string[] = []
      const segments = 12
      for (let s = 0; s <= segments; s++) {
        const x = (s / segments) * 100
        const noise = Math.sin(s * 0.9 + i * 2.1 + frame * 0.02) * 5
        const trend = -s * 0.8 // trending upward
        const y = baseY * 100 + noise + trend
        points.push(`${x}% ${y}%`)
      }
      return (
        <div
          key={i}
          style={{
            position: 'absolute',
            inset: 0,
            clipPath: `polygon(${points.join(', ')}, 100% 100%, 0% 100%)`,
            background: `rgba(16, 185, 129, ${0.02 + i * 0.008})`,
          }}
        />
      )
    })

    return (
      <div style={{ position: 'absolute', inset: 0, background: bgColor, overflow: 'hidden' }}>
        {chartLines}
      </div>
    )
  },

  renderWord: ({
    word,
    color,
    enterProgress,
    holdProgress,
    exitProgress,
    phase,
    index,
    width,
    height,
    config,
  }: WordRenderProps) => {
    const cfg = config as TrendingUpConfig
    const arrowColor = cfg?.arrowColor ?? '#10B981'
    const showChart = cfg?.showChart ?? true

    let opacity = 1
    let translateY = 0
    let scale = 1
    let arrowY = 0
    let arrowOpacity = 0

    if (phase === 'enter') {
      const t = enterProgress
      const eased = 1 - Math.pow(1 - t, 3)
      // Text slides up from below
      translateY = (1 - eased) * 60
      opacity = eased
      scale = 0.85 + eased * 0.15
      // Arrow animates upward
      arrowY = (1 - eased) * 40
      arrowOpacity = Math.min(1, t * 2.5)
    } else if (phase === 'hold') {
      // Arrow bobs upward
      const bob = Math.sin(holdProgress * Math.PI * 3)
      arrowY = bob * -8
      arrowOpacity = 1
      scale = 1 + Math.sin(holdProgress * Math.PI * 5) * 0.015
    } else {
      const t = exitProgress
      translateY = -t * t * 80
      opacity = 1 - t * t
      arrowY = -t * 40
      arrowOpacity = 1 - t
      scale = 1 + t * 0.1
    }

    // Mini trending chart below word
    const chartWidth = 120
    const chartHeight = 40
    const chartPoints = Array.from({ length: 8 }).map((_, i) => {
      const x = (i / 7) * chartWidth
      const noise = seededRand(i * 47 + index * 13) * 10
      const trend = (i / 7) * chartHeight * 0.7
      const y = chartHeight - trend - noise * 0.3
      return `${x},${y}`
    })
    const chartPath = chartPoints.join(' ')

    // Percentage counter during enter
    const percentValue = phase === 'enter'
      ? Math.round(enterProgress * 100)
      : phase === 'hold'
        ? 100
        : Math.round((1 - exitProgress) * 100)

    return (
      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: `translate(-50%, calc(-50% + ${translateY}px)) scale(${scale})`,
          opacity,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 12,
        }}
      >
        {/* Main word row with arrow */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 'clamp(8px, 2vw, 16px)',
          }}
        >
          <div
            style={{
              fontFamily: "'Helvetica Neue', Arial, sans-serif",
              fontSize: 'clamp(36px, 10vw, 120px)',
              fontWeight: 900,
              color,
              whiteSpace: 'nowrap',
              textShadow: `0 0 30px ${color}30`,
            }}
          >
            {word}
          </div>
          {/* Trending arrow */}
          <div
            style={{
              transform: `translateY(${arrowY}px) rotate(-45deg)`,
              opacity: arrowOpacity,
              fontSize: 'clamp(24px, 6vw, 60px)',
              color: arrowColor,
              textShadow: `0 0 20px ${arrowColor}60`,
              lineHeight: 1,
            }}
          >
            {'→'}
          </div>
        </div>

        {/* Percentage badge */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            background: `${arrowColor}20`,
            borderRadius: 20,
            padding: 'clamp(4px, 0.8vh, 8px) clamp(10px, 2vw, 18px)',
            opacity: arrowOpacity,
          }}
        >
          <span
            style={{
              fontSize: 'clamp(10px, 1.8vw, 16px)',
              fontWeight: 800,
              color: arrowColor,
              fontFamily: "'Helvetica Neue', Arial, sans-serif",
            }}
          >
            +{percentValue}%
          </span>
          <span
            style={{
              fontSize: 'clamp(8px, 1.2vw, 11px)',
              color: '#FFFFFF80',
              fontFamily: "'Helvetica Neue', Arial, sans-serif",
              fontWeight: 500,
            }}
          >
            trending
          </span>
        </div>

        {/* Mini chart */}
        {showChart && (
          <svg
            width={chartWidth}
            height={chartHeight}
            viewBox={`0 0 ${chartWidth} ${chartHeight}`}
            style={{
              opacity: arrowOpacity * 0.6,
              overflow: 'visible',
            }}
          >
            <defs>
              <linearGradient id={`trend-grad-${index}`} x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor={arrowColor} stopOpacity="0.1" />
                <stop offset="100%" stopColor={arrowColor} stopOpacity="0.4" />
              </linearGradient>
            </defs>
            {/* Area fill */}
            <polygon
              points={`0,${chartHeight} ${chartPath} ${chartWidth},${chartHeight}`}
              fill={`url(#trend-grad-${index})`}
            />
            {/* Line */}
            <polyline
              points={chartPath}
              fill="none"
              stroke={arrowColor}
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            {/* End dot */}
            {chartPoints.length > 0 && (
              <circle
                cx={chartWidth}
                cy={parseFloat(chartPoints[chartPoints.length - 1].split(',')[1])}
                r="3"
                fill={arrowColor}
              />
            )}
          </svg>
        )}
      </div>
    )
  },
}

function TrendingUpComponent(props: MotionGraphicProps<TrendingUpConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-trending-up',
  title: 'Kinetic Trending Up',
  description:
    'Text with animated trending arrow, percentage counter badge, and mini chart visualization. Perfect for social media metrics and growth content.',
  tags: ['kinetic', 'typography', 'trending', 'social-media', 'analytics', 'growth', 'chart', 'arrow'],
  category: 'captions',
  component: TrendingUpComponent as any,
  defaultConfig: {
    words: ['TRENDING', 'VIRAL', 'GROWING', 'HOT'],
    colors: ['#10B981', '#3B82F6', '#F59E0B', '#EF4444'],
    bgColor: '#0A0F1A',
    cycleDuration: 1.4,
    arrowColor: '#10B981',
    showChart: true,
  },
  configSchema: [
    { key: 'words', label: 'Words', type: 'text-array', defaultValue: ['TRENDING', 'VIRAL', 'GROWING', 'HOT'], group: 'Content' },
    { key: 'colors', label: 'Colors', type: 'text-array', defaultValue: ['#10B981', '#3B82F6', '#F59E0B', '#EF4444'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#0A0F1A', group: 'Style' },
    { key: 'arrowColor', label: 'Arrow Color', type: 'color', defaultValue: '#10B981', group: 'Style' },
    { key: 'showChart', label: 'Show Chart', type: 'boolean', defaultValue: true, group: 'Animation' },
    { key: 'cycleDuration', label: 'Cycle Duration (s)', type: 'number', defaultValue: 1.4, min: 0.3, max: 5, group: 'Timing' },
  ],
})
