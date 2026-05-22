import { useState, useEffect } from 'react'
import { formatCompact } from './chartUtils'

interface BarValue {
  name: string
  value: number
  color: string
}

interface ComparisonPair {
  label: string
  values: BarValue[]
}

interface ComparisonBarProps {
  pairs: ComparisonPair[]
}

export function ComparisonBar({ pairs }: ComparisonBarProps) {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    const id = requestAnimationFrame(() => setMounted(true))
    return () => cancelAnimationFrame(id)
  }, [])

  // Find max across all values for consistent scale
  const maxValue = Math.max(
    ...pairs.flatMap((p) => p.values.map((v) => v.value)),
    1
  )

  return (
    <div className="space-y-4">
      {pairs.map((pair) => (
        <div key={pair.label} className="space-y-2">
          <span className="text-[10px] text-zinc-500 uppercase tracking-wide">
            {pair.label}
          </span>

          <div className="space-y-1.5">
            {pair.values.map((bar, i) => {
              const pct = (bar.value / maxValue) * 100
              return (
                <div key={bar.name} className="space-y-0.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <span
                        className="w-2 h-2 rounded-full shrink-0"
                        style={{ backgroundColor: bar.color }}
                      />
                      <span className="text-[10px] text-zinc-400">{bar.name}</span>
                    </div>
                    <span className="text-[10px] font-medium text-white">
                      {formatCompact(bar.value)}
                    </span>
                  </div>
                  <div className="h-3 bg-zinc-800 rounded-sm overflow-hidden">
                    <div
                      className="h-full rounded-sm transition-all duration-700 ease-out"
                      style={{
                        width: mounted ? `${pct}%` : '0%',
                        backgroundColor: bar.color,
                        opacity: 0.7,
                        transitionDelay: `${i * 100}ms`,
                      }}
                    />
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      ))}
    </div>
  )
}
