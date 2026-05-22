import { registerMotionGraphic } from '../registry'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface SceneStatCounterConfig {
  stats: string[]
  bgColor: string
  textColor: string
  accentColor: string
  columns: number
}

function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3)
}

function easeInCubic(t: number): number {
  return t * t * t
}

function easeOutQuart(t: number): number {
  return 1 - Math.pow(1 - t, 4)
}

/** Parse a stat string like "10K|Subscribers" into value and label */
function parseStat(s: string): { rawValue: string; numericValue: number; suffix: string; label: string } {
  const parts = s.split('|')
  const rawValue = (parts[0] || '0').trim()
  const label = (parts[1] || '').trim()

  // Extract numeric portion and suffix (e.g., "10K" -> 10, "K")
  const match = rawValue.match(/^([\d,.]+)\s*(.*)$/)
  if (match) {
    const num = parseFloat(match[1].replace(/,/g, ''))
    const suffix = match[2] || ''
    return { rawValue, numericValue: isNaN(num) ? 0 : num, suffix, label }
  }
  return { rawValue, numericValue: 0, suffix: '', label }
}

/** Format a number with commas */
function formatNumber(n: number): string {
  if (Number.isInteger(n)) {
    return n.toLocaleString('en-US')
  }
  return n.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 1 })
}

function SceneStatCounterComponent({ config, progress }: MotionGraphicProps<SceneStatCounterConfig>) {
  const { stats, bgColor, textColor, accentColor, columns } = config

  const parsedStats = stats.map(parseStat)
  const cols = Math.max(1, Math.min(columns, parsedStats.length))

  // Phase calculations: 0-25% enter, 25-80% hold, 80-100% exit
  const enterProgress = progress < 0.25 ? progress / 0.25 : 1
  const holdProgress = progress >= 0.25 && progress < 0.8 ? (progress - 0.25) / 0.55 : 0
  const exitProgress = progress >= 0.8 ? (progress - 0.8) / 0.2 : 0

  // Overall opacity
  const overallOpacity = exitProgress > 0 ? 1 - easeInCubic(exitProgress) : 1

  return (
    <div style={{ position: 'absolute', inset: 0, overflow: 'hidden' }}>
      {/* Background */}
      <div style={{ position: 'absolute', inset: 0, background: bgColor }} />

      {/* Stats grid */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          padding: '8%',
          opacity: overallOpacity,
        }}
      >
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: `repeat(${cols}, 1fr)`,
            gap: 'clamp(16px, 4vw, 40px)',
            width: '100%',
            maxWidth: '900px',
          }}
        >
          {parsedStats.map((stat, i) => {
            // Stagger delay for each stat
            const stagger = i * 0.12
            const statEnter = enterProgress < 1
              ? Math.max(0, (enterProgress - stagger) / (1 - stagger))
              : 1

            // Number counting animation
            const countProgress = easeOutQuart(statEnter)
            const currentNumber = stat.numericValue * countProgress
            const displayNumber = statEnter >= 1
              ? formatNumber(stat.numericValue)
              : formatNumber(Math.floor(currentNumber))

            // Label fade in with additional delay
            const labelDelay = 0.3
            const labelEnter = statEnter < 1
              ? Math.max(0, (statEnter - labelDelay) / (1 - labelDelay))
              : 1
            const labelOpacity = easeOutCubic(labelEnter)

            // Scale pulse during hold
            const isHolding = progress >= 0.25 && progress < 0.8
            const pulsePeriod = 3 + i * 0.7
            const pulse = isHolding
              ? 1 + Math.sin(holdProgress * Math.PI * pulsePeriod) * 0.04
              : 1

            const statOpacity = statEnter < 1
              ? easeOutCubic(statEnter)
              : 1
            const statY = statEnter < 1
              ? 30 * (1 - easeOutCubic(statEnter))
              : 0

            return (
              <div
                key={i}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  textAlign: 'center',
                  opacity: statOpacity,
                  transform: `translateY(${statY}px) scale(${pulse})`,
                }}
              >
                {/* Number value */}
                <div
                  style={{
                    fontFamily: "'Inter', 'Helvetica Neue', sans-serif",
                    fontSize: 'clamp(24px, 7vw, 64px)',
                    fontWeight: 800,
                    color: accentColor,
                    lineHeight: 1.1,
                    letterSpacing: '-0.02em',
                  }}
                >
                  {displayNumber}
                  <span style={{ fontSize: '0.7em' }}>{stat.suffix}</span>
                </div>

                {/* Divider line */}
                <div
                  style={{
                    width: `${easeOutCubic(statEnter) * 60}%`,
                    height: '2px',
                    background: `${accentColor}40`,
                    margin: '0.5em 0',
                    borderRadius: '1px',
                  }}
                />

                {/* Label */}
                <div
                  style={{
                    fontFamily: "'Inter', 'Helvetica Neue', sans-serif",
                    fontSize: 'clamp(10px, 2vw, 18px)',
                    fontWeight: 500,
                    color: textColor,
                    opacity: labelOpacity * 0.8,
                    letterSpacing: '0.08em',
                    textTransform: 'uppercase',
                  }}
                >
                  {stat.label}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

registerMotionGraphic({
  id: 'tpl-scene-stat-counter',
  title: 'Scene Stat Counter',
  description: 'Animated stat counters that count up from zero with staggered reveals and scale pulse',
  tags: ['scene', 'stats', 'counter', 'numbers', 'data', 'layout'],
  category: 'scene-layout',
  component: SceneStatCounterComponent as any,
  defaultConfig: {
    stats: ['10K|Subscribers', '500|Videos', '2M|Views'],
    bgColor: '#111827',
    textColor: '#e5e7eb',
    accentColor: '#6366f1',
    columns: 3,
  },
  configSchema: [
    { key: 'stats', label: 'Stats (value|label)', type: 'text-array', defaultValue: ['10K|Subscribers', '500|Videos', '2M|Views'], group: 'Content' },
    { key: 'bgColor', label: 'Background Color', type: 'color', defaultValue: '#111827', group: 'Style' },
    { key: 'textColor', label: 'Text Color', type: 'color', defaultValue: '#e5e7eb', group: 'Style' },
    { key: 'accentColor', label: 'Accent Color', type: 'color', defaultValue: '#6366f1', group: 'Style' },
    { key: 'columns', label: 'Columns', type: 'number', defaultValue: 3, min: 1, max: 6, group: 'Layout' },
  ],
})
