import { useRef, useEffect } from 'react'
import { Search, X, Loader2 } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { useEditorStore } from '@/stores'
import { TAB_GROUPS, CARD_GRID_THRESHOLD } from '@/constants/tabGroups'

interface PanelHeaderProps {
  icon: LucideIcon
  title: string
  /** Optional accent color for the icon (e.g. "text-green-400") */
  iconClassName?: string
  /** Optional content rendered on the right side */
  trailing?: React.ReactNode
  /** Expandable search bar config */
  searchBar?: {
    isOpen: boolean
    onToggle: () => void
    query: string
    onQueryChange: (value: string) => void
    placeholder?: string
    isLoading?: boolean
  }
}

export function PanelHeader({ icon: Icon, title, iconClassName, trailing, searchBar }: PanelHeaderProps) {
  const searchInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (searchBar?.isOpen) {
      // Small delay to let the DOM render
      requestAnimationFrame(() => searchInputRef.current?.focus())
    }
  }, [searchBar?.isOpen])

  if (searchBar?.isOpen) {
    return (
      <div className="flex items-center gap-2">
        <Search size={14} className="text-gray-500 flex-shrink-0" />
        <input
          ref={searchInputRef}
          type="text"
          value={searchBar.query}
          onChange={(e) => searchBar.onQueryChange(e.target.value)}
          placeholder={searchBar.placeholder || 'Search...'}
          className="flex-1 min-w-0 bg-transparent text-sm text-white placeholder-gray-500 focus:outline-none"
        />
        {searchBar.isLoading && (
          <Loader2 size={14} className="animate-spin text-gray-500 flex-shrink-0" />
        )}
        <button
          onClick={searchBar.onToggle}
          className="p-1 rounded-md text-gray-400 hover:text-white hover:bg-panel-surface transition-colors flex-shrink-0"
        >
          <X size={14} />
        </button>
      </div>
    )
  }

  return (
    <div className="flex items-center gap-2">
      <Icon size={16} className={iconClassName} />
      <h3 className="text-sm font-semibold text-white">{title}</h3>
      {trailing && <div className="ml-auto">{trailing}</div>}
    </div>
  )
}

interface PanelLayoutProps {
  icon: LucideIcon
  title: string
  iconClassName?: string
  trailing?: React.ReactNode
  searchBar?: PanelHeaderProps['searchBar']
  /** Sticky footer rendered below the scrollable body (for primary action buttons) */
  footer?: React.ReactNode
  children: React.ReactNode
}

/** Returns true when the panel header is handled by the full-width nav header above */
function useHeaderHandledByNav() {
  const activeGroup = useEditorStore((s) => s.leftPanelActiveGroup)
  const showGroupHome = useEditorStore((s) => s.showGroupHome)
  const groupDef = TAB_GROUPS.find((g) => g.id === activeGroup)
  if (!groupDef) return false
  // Large groups: header hidden when drilled in (not on card grid)
  if (groupDef.subTabs.length > CARD_GRID_THRESHOLD) return !showGroupHome
  // All other groups: header always handled by nav
  return true
}

export function PanelLayout({ icon, title, iconClassName, trailing, searchBar, footer, children }: PanelLayoutProps) {
  const hideHeader = useHeaderHandledByNav()
  const showSearchOnly = hideHeader && searchBar?.isOpen

  return (
    <div className="flex flex-col h-full">
      {/* Header — hidden when nav header handles it, except when searchBar is active */}
      {!hideHeader ? (
        <div className="flex-none flex items-center min-h-[49px] px-3 py-2 border-b border-white/5">
          <div className="flex-1 min-w-0">
            <PanelHeader icon={icon} title={title} iconClassName={iconClassName} trailing={trailing} searchBar={searchBar} />
          </div>
        </div>
      ) : showSearchOnly ? (
        <div className="flex-none flex items-center min-h-[42px] px-3 py-1.5 border-b border-white/5">
          <div className="flex-1 min-w-0">
            <PanelHeader icon={icon} title={title} iconClassName={iconClassName} searchBar={searchBar} />
          </div>
        </div>
      ) : null}
      {/* Scrollable body */}
      <div className="flex-1 min-h-0 overflow-y-auto p-4 space-y-4">
        {children}
      </div>
      {/* Sticky footer for primary action */}
      {footer && (
        <div className="shrink-0 border-t border-white/5 px-4 py-3 bg-zinc-900/50 backdrop-blur-sm">
          {footer}
        </div>
      )}
    </div>
  )
}
