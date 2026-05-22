import { cn } from '@/lib/utils'
import type { LucideIcon } from 'lucide-react'

interface Tab {
  id: string
  label: string
  icon?: LucideIcon
}

interface PanelCategoryTabsProps {
  tabs: Tab[]
  activeTab: string
  onChange: (id: string) => void
  className?: string
  /** Use compact sizing */
  compact?: boolean
}

export function PanelCategoryTabs({ tabs, activeTab, onChange, className, compact }: PanelCategoryTabsProps) {
  return (
    <div
      className={cn(
        'flex gap-1 mb-3 overflow-x-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]',
        className,
      )}
    >
      {tabs.map((tab) => {
        const isActive = tab.id === activeTab
        return (
          <button
            key={tab.id}
            onClick={() => onChange(tab.id)}
            className={cn(
              'shrink-0 flex items-center justify-center gap-1.5 rounded-lg font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent',
              compact ? 'px-3 py-1 text-xs' : 'px-4 py-1.5 text-xs',
              isActive
                ? 'bg-accent text-white'
                : 'bg-panel-surface text-gray-400 hover:text-white hover:bg-panel-surface-hover',
            )}
          >
            {tab.icon && <tab.icon size={12} />}
            {tab.label}
          </button>
        )
      })}
    </div>
  )
}
