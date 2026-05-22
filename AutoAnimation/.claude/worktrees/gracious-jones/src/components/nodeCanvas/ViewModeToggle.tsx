import { LayoutPanelLeft, Workflow } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useNodeCanvasStore } from '@/stores/useNodeCanvasStore'

const MODES = [
  { id: 'classic' as const, icon: LayoutPanelLeft, label: 'Classic' },
  { id: 'nodes' as const, icon: Workflow, label: 'Nodes' },
] as const

export function ViewModeToggle() {
  const viewMode = useNodeCanvasStore((s) => s.viewMode)
  const setViewMode = useNodeCanvasStore((s) => s.setViewMode)

  return (
    <div className="hidden md:flex items-center bg-zinc-800/60 rounded-lg p-0.5 gap-0.5">
      {MODES.map((mode) => {
        const active = viewMode === mode.id
        return (
          <button
            key={mode.id}
            onClick={() => setViewMode(mode.id)}
            title={mode.label}
            className={cn(
              'flex items-center gap-1 px-2 py-1 rounded-md text-[11px] font-medium transition-all duration-200',
              active
                ? 'bg-zinc-700 text-zinc-100 shadow-sm'
                : 'text-zinc-500 hover:text-zinc-300'
            )}
          >
            <mode.icon size={12} />
            {mode.label}
          </button>
        )
      })}
    </div>
  )
}
