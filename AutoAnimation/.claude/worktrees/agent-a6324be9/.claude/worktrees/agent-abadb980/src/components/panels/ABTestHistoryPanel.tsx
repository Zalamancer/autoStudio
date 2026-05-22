/**
 * ABTestHistoryPanel — Shows past A/B test results and trends.
 */

import { History, Trophy } from 'lucide-react'
import { useABTestStore } from '@/stores/useABTestStore'

export function ABTestHistoryPanel() {
  const testResults = useABTestStore((s) => s.testResults)

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  return (
    <div className="flex flex-col gap-3 p-3">
      <div className="flex items-center gap-2">
        <History size={16} className="text-indigo-400" />
        <h3 className="text-sm font-semibold text-white">Test History</h3>
        <span className="text-[10px] text-zinc-500 ml-auto">{testResults.length} tests</span>
      </div>

      {testResults.length === 0 ? (
        <div className="text-center py-8">
          <History size={24} className="text-zinc-600 mx-auto mb-2" />
          <p className="text-xs text-zinc-500">No tests run yet</p>
          <p className="text-[10px] text-zinc-600 mt-1">
            Configure and run an A/B test to see results here
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {testResults.slice().reverse().map((result) => (
            <div
              key={result.id}
              className="border border-white/5 rounded-lg p-3 bg-zinc-900/50"
            >
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-zinc-500">{formatDate(result.timestamp)}</span>
                {result.winnerId !== null && (
                  <span className="flex items-center gap-1 text-[10px] text-amber-400">
                    <Trophy size={10} />
                    Winner: Variant {result.winnerId}
                  </span>
                )}
              </div>

              <div className="mt-2 flex gap-2 flex-wrap">
                {result.config.variables.map((v) => (
                  <span
                    key={v.field}
                    className="text-[9px] px-1.5 py-0.5 rounded bg-indigo-500/10 text-indigo-400"
                  >
                    {v.field}
                  </span>
                ))}
                <span className="text-[9px] px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-500">
                  {result.config.strategy}
                </span>
              </div>

              {result.variants.length > 0 && (
                <div className="mt-2 flex gap-3">
                  {result.variants.map((v) => (
                    <div key={v.variantIndex} className="text-[10px]">
                      <span className="text-zinc-400">{v.label}:</span>
                      <span className="text-zinc-300 ml-1">{v.viralScore}/100</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
