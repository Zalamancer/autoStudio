import { lazy, Suspense, useState } from 'react'
import { Languages, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { ScriptsPanel } from './ScriptsPanel'
import { DialoguePanel } from './DialoguePanel'

const TranslationPanel = lazy(() => import('./TranslationPanel').then(m => ({ default: m.TranslationPanel })))

type Mode = 'script' | 'dialogue'

const MODES: { id: Mode; label: string }[] = [
  { id: 'script', label: 'Script' },
  { id: 'dialogue', label: 'Dialogue' },
]

const lazyFallback = (
  <div className="flex items-center justify-center py-12 text-gray-500">
    <Loader2 size={20} className="animate-spin" />
  </div>
)

export function ScriptDialoguePanel() {
  const [mode, setMode] = useState<Mode>('script')
  const [showTranslation, setShowTranslation] = useState(false)

  return (
    <div className="flex flex-col h-full">
      {/* Mode pill bar */}
      <div className="shrink-0 flex items-center gap-1 px-3 py-1.5 border-b border-white/5">
        {MODES.map((m) => (
          <button
            key={m.id}
            onClick={() => setMode(m.id)}
            className={cn(
              'px-3 py-1 rounded-full text-[11px] font-medium transition-colors',
              mode === m.id
                ? 'bg-green-500/20 text-green-400'
                : 'text-zinc-500 hover:text-zinc-300 hover:bg-white/5'
            )}
          >
            {m.label}
          </button>
        ))}

        {/* Languages toggle — only in Dialogue mode */}
        {mode === 'dialogue' && (
          <button
            onClick={() => setShowTranslation(!showTranslation)}
            title="Toggle Translation"
            className={cn(
              'ml-auto p-1 rounded transition-colors',
              showTranslation
                ? 'text-green-400 bg-green-500/20'
                : 'text-zinc-500 hover:text-zinc-300 hover:bg-white/5'
            )}
          >
            <Languages size={14} />
          </button>
        )}
      </div>

      {/* Panel content */}
      <div className="flex-1 min-h-0 overflow-hidden">
        {mode === 'script' && <ScriptsPanel />}
        {mode === 'dialogue' && (
          showTranslation
            ? <Suspense fallback={lazyFallback}><TranslationPanel /></Suspense>
            : <DialoguePanel />
        )}
      </div>
    </div>
  )
}
