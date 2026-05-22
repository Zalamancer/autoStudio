import { useMemo } from 'react'
import { Search, LayoutGrid, Camera, Sparkles, ScanFace, Megaphone, Gamepad2, Scissors, Ear, Flame, Puzzle, GraduationCap, Clock, type LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useOneClickAppStore } from '@/stores/useOneClickAppStore'
import { APP_CATEGORIES } from '@/services/oneClickAppRegistry'
import { getAppById } from '@/services/oneClickAppRegistry'
import type { AppCategory } from '@/types/oneClickApp'
import { AppExecutionModal } from './AppExecutionModal'

const CATEGORY_ICONS: Record<AppCategory | 'all', LucideIcon> = {
  all: LayoutGrid,
  camera: Camera,
  enhance: Sparkles,
  face: ScanFace,
  ads: Megaphone,
  games: Gamepad2,
  editing: Scissors,
  asmr: Ear,
  trending: Flame,
  extras: Puzzle,
  education: GraduationCap,
}

export function AppsPanel() {
  const searchQuery = useOneClickAppStore((s) => s.searchQuery)
  const search = useOneClickAppStore((s) => s.search)
  const activeCategory = useOneClickAppStore((s) => s.activeCategory)
  const setCategory = useOneClickAppStore((s) => s.setCategory)
  const recentApps = useOneClickAppStore((s) => s.recentApps)
  const selectApp = useOneClickAppStore((s) => s.selectApp)
  const selectedApp = useOneClickAppStore((s) => s.selectedApp)
  const filteredApps = useOneClickAppStore((s) => s.filteredApps)

  const apps = filteredApps()

  const recentAppObjects = useMemo(
    () => recentApps.map(getAppById).filter(Boolean),
    [recentApps]
  )

  return (
    <div className="flex flex-col h-full">
      {/* Search */}
      <div className="shrink-0 px-3 pt-3 pb-2">
        <div className="relative">
          <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-zinc-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => search(e.target.value)}
            placeholder="Search apps..."
            className="w-full pl-8 pr-3 py-2 bg-white/[0.06] border border-white/[0.06] rounded-lg text-sm text-zinc-200 placeholder:text-zinc-500 focus:outline-none focus:border-green-500/50"
          />
        </div>
      </div>

      {/* Category pills */}
      <div className="shrink-0 px-3 pb-2">
        <div className="flex flex-wrap gap-1">
          {APP_CATEGORIES.map((cat) => {
            const Icon = CATEGORY_ICONS[cat.id]
            const isActive = activeCategory === cat.id
            return (
              <button
                key={cat.id}
                onClick={() => setCategory(cat.id)}
                className={cn(
                  'flex items-center gap-1 px-2 py-1 rounded-md text-[11px] font-medium transition-colors',
                  isActive
                    ? 'bg-green-500/20 text-green-400'
                    : 'bg-white/[0.04] text-zinc-400 hover:bg-white/[0.08] hover:text-zinc-200'
                )}
              >
                <Icon size={11} />
                {cat.label}
              </button>
            )
          })}
        </div>
      </div>

      {/* Recent apps */}
      {recentAppObjects.length > 0 && !searchQuery && activeCategory === 'all' && (
        <div className="shrink-0 px-3 pb-2">
          <div className="text-[11px] font-medium text-zinc-500 mb-1.5 flex items-center gap-1">
            <Clock size={10} />
            Recent
          </div>
          <div className="flex flex-wrap gap-1.5">
            {recentAppObjects.map((app) => app && (
              <button
                key={app.id}
                onClick={() => selectApp(app)}
                className="flex items-center gap-1.5 px-2 py-1 bg-white/[0.04] rounded-md text-[11px] text-zinc-300 hover:bg-white/[0.08] transition-colors"
              >
                <span className={app.color}>{app.name}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* App grid */}
      <div className="flex-1 overflow-y-auto px-3 pb-3">
        <div className="grid grid-cols-2 gap-2">
          {apps.map((app) => (
            <button
              key={app.id}
              onClick={() => selectApp(app)}
              className="flex flex-col items-start gap-1.5 p-3 bg-white/[0.04] rounded-xl border border-white/[0.04] hover:bg-white/[0.08] hover:border-white/[0.08] transition-colors text-left group"
            >
              <div className={cn('text-lg', app.color)}>
                <LayoutGrid size={20} />
              </div>
              <div>
                <div className="text-[12px] font-medium text-zinc-200 group-hover:text-white leading-tight">
                  {app.name}
                </div>
                <div className="text-[10px] text-zinc-500 mt-0.5 leading-snug line-clamp-2">
                  {app.description}
                </div>
              </div>
            </button>
          ))}
        </div>

        {apps.length === 0 && (
          <div className="flex flex-col items-center justify-center py-12 text-zinc-500">
            <Search size={24} className="mb-2 opacity-50" />
            <p className="text-sm">No apps found</p>
          </div>
        )}
      </div>

      {/* Execution modal */}
      {selectedApp && (
        <AppExecutionModal
          app={selectedApp}
          onClose={() => selectApp(null)}
        />
      )}
    </div>
  )
}
