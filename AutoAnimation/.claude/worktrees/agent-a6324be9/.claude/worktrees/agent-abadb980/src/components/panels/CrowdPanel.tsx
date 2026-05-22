import { useCrowdStore, type CrowdGroup } from '@/stores/useCrowdStore'
import { Plus, Trash2, Eye, EyeOff, Users, Search, Sparkles, SlidersHorizontal } from 'lucide-react'
import { PanelCategoryTabs } from '@/components/ui/panel-controls'
import { useEditorStore } from '@/stores'
import { useSavedCharactersStore } from '@/stores/useSavedCharactersStore'
import { cn } from '@/lib/utils'
import { useState, useMemo } from 'react'

const CROWD_TABS = [
  { id: 'groups' as const, label: 'Groups', icon: Users },
  { id: 'presets' as const, label: 'Presets', icon: Sparkles },
]

const PATTERN_CATEGORIES = [
  { id: 'all', label: 'All' },
  { id: 'row', label: 'Row' },
  { id: 'scattered', label: 'Scattered' },
  { id: 'arc', label: 'Arc' },
  { id: 'bleachers', label: 'Bleachers' },
  { id: 'random', label: 'Random' },
]

export function CrowdPanel() {
  const groups = useCrowdStore((s) => s.groups)
  const selectedGroupId = useCrowdStore((s) => s.selectedGroupId)
  const addGroup = useCrowdStore((s) => s.addGroup)
  const setSelectedGroupId = useCrowdStore((s) => s.setSelectedGroupId)
  const setRightPanelTab = useEditorStore((s) => s.setRightPanelTab)
  const [search, setSearch] = useState('')
  const [activeTab, setActiveTab] = useState<'groups' | 'presets'>('groups')
  const [filtersOpen, setFiltersOpen] = useState(false)
  const [categoryFilter, setCategoryFilter] = useState('all')

  const q = search.toLowerCase().trim()

  const filteredGroups = useMemo(() => {
    let result = groups
    if (categoryFilter !== 'all') {
      result = result.filter((g) => g.pattern === categoryFilter)
    }
    if (q) {
      result = result.filter((g) => g.name.toLowerCase().includes(q))
    }
    return result
  }, [groups, q, categoryFilter])

  const handleSelectGroup = (group: CrowdGroup) => {
    setSelectedGroupId(group.id)
    setRightPanelTab('crowd-properties')
  }

  const handleAddGroup = () => {
    addGroup()
    // Select the newly added group
    const state = useCrowdStore.getState()
    const newest = state.groups[state.groups.length - 1]
    if (newest) {
      setSelectedGroupId(newest.id)
      setRightPanelTab('crowd-properties')
    }
  }

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* ── Animated Icon Tab Bar ── */}
      <div className="shrink-0 flex items-center gap-1 px-3 py-2 border-b border-white/5">
        {CROWD_TABS.map((tab) => {
          const isActive = activeTab === tab.id
          const Icon = tab.icon
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              title={tab.label}
              style={{
                flex: isActive ? 2 : 1,
                transition:
                  'flex 300ms cubic-bezier(0.25, 1, 0.5, 1), background-color 200ms, color 200ms, padding 200ms',
              }}
              className={cn(
                'relative h-8 rounded-lg flex items-center justify-center gap-1.5 overflow-hidden',
                isActive ? 'bg-white text-black px-2' : 'text-gray-400 hover:text-white hover:bg-[#2a2a2a]',
              )}
            >
              <Icon size={16} className="shrink-0" />
              <span
                style={{ transition: 'max-width 300ms cubic-bezier(0.25, 1, 0.5, 1) 50ms, opacity 200ms ease 60ms' }}
                className={cn(
                  'text-[11px] font-medium truncate',
                  isActive ? 'max-w-[80px] opacity-100' : 'max-w-0 opacity-0',
                )}
              >
                {tab.label}
              </span>
            </button>
          )
        })}
      </div>

      {activeTab === 'presets' ? (
        /* ── Presets empty state ── */
        <div className="flex-1 flex flex-col items-center justify-center text-gray-600">
          <Sparkles size={28} className="mb-3" />
          <span className="text-sm text-gray-400">Presets coming soon</span>
          <span className="text-xs text-gray-600 mt-1">Pre-built crowd configurations will appear here</span>
        </div>
      ) : (
        <>
          {/* ── Search + Filter Toggle ── */}
          <div className="shrink-0 px-3 py-2">
            <div className="flex items-center gap-1.5">
              <div className="relative flex-1">
                <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-zinc-500" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search crowd groups..."
                  className="w-full pl-8 pr-3 py-2 bg-zinc-800 rounded-lg text-sm text-zinc-200 placeholder-zinc-600 border border-white/5 focus:border-[#4a7eff]/30 focus:outline-none"
                />
              </div>
              <button
                onClick={() => setFiltersOpen(!filtersOpen)}
                className={cn(
                  'shrink-0 w-8 h-8 rounded-lg flex items-center justify-center transition-colors relative',
                  filtersOpen
                    ? 'bg-[#4a7eff]/20 text-[#4a7eff]'
                    : 'text-zinc-500 hover:text-zinc-200 hover:bg-[#2a2a2a]',
                )}
              >
                <SlidersHorizontal size={14} />
                {categoryFilter !== 'all' && (
                  <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-[#4a7eff]" />
                )}
              </button>
            </div>
          </div>

          {/* ── Filter panel (hidden by default) ── */}
          {filtersOpen && (
            <div className="shrink-0 px-3 pb-2">
              <PanelCategoryTabs
                tabs={PATTERN_CATEGORIES}
                activeTab={categoryFilter}
                onChange={(id) => setCategoryFilter(id)}
                compact
              />
            </div>
          )}

          {/* ── Groups list ── */}
          <div className="flex-1 overflow-y-auto px-3 py-2">
            {filteredGroups.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-gray-600">
                <Users size={28} className="mb-3" />
                <span className="text-sm text-gray-400">{q ? 'No groups found' : 'No crowd groups yet'}</span>
                <span className="text-xs text-gray-600 mt-1">
                  {q ? 'Try a different keyword' : 'Click below to add a crowd group'}
                </span>
              </div>
            ) : (
              <div className="space-y-1">
                {filteredGroups.map((group) => (
                  <CrowdGroupRow
                    key={group.id}
                    group={group}
                    isSelected={group.id === selectedGroupId}
                    onSelect={() => handleSelectGroup(group)}
                  />
                ))}
              </div>
            )}
          </div>

          {/* ── Footer action ── */}
          <div className="shrink-0 px-3 py-2 border-t border-white/5">
            <button
              onClick={handleAddGroup}
              className="w-full flex items-center justify-center gap-2 py-2 rounded-lg text-[11px] font-medium bg-[#4a7eff] text-white hover:bg-[#5a8aff] transition-colors"
            >
              <Plus size={13} />
              Add Crowd Group
            </button>
          </div>
        </>
      )}
    </div>
  )
}

function CrowdGroupRow({
  group,
  isSelected,
  onSelect,
}: {
  group: CrowdGroup
  isSelected: boolean
  onSelect: () => void
}) {
  const updateGroup = useCrowdStore((s) => s.updateGroup)
  const removeGroup = useCrowdStore((s) => s.removeGroup)
  const characters = useSavedCharactersStore((s) => s.characters)
  const charName = group.characterId ? characters.find((c) => c.id === group.characterId)?.name : null

  return (
    <button
      onClick={onSelect}
      className={cn(
        'w-full px-3 py-2.5 rounded-lg text-left transition-colors border flex items-center gap-2',
        isSelected ? 'bg-[#4a7eff]/10 border-[#4a7eff]/30' : 'bg-[#2a2a2a] border-white/5 hover:bg-[#3a3a3a]',
      )}
    >
      <Users size={14} className="shrink-0 text-zinc-500" />
      <div className="flex-1 min-w-0">
        <div className="text-xs font-medium text-gray-200 truncate">{group.name}</div>
        <div className="text-[9px] text-gray-500 mt-0.5">
          {group.count} members &middot; {group.pattern}
          {charName && <> &middot; {charName}</>}
        </div>
      </div>

      {/* Visibility toggle */}
      <button
        onClick={(e) => {
          e.stopPropagation()
          updateGroup(group.id, { visible: !group.visible })
        }}
        className="p-1 rounded text-zinc-500 hover:text-zinc-200 transition-colors"
        title={group.visible ? 'Hide' : 'Show'}
      >
        {group.visible ? <Eye size={12} /> : <EyeOff size={12} />}
      </button>

      {/* Delete */}
      <button
        onClick={(e) => {
          e.stopPropagation()
          removeGroup(group.id)
        }}
        className="p-1 rounded text-zinc-500 hover:text-red-400 transition-colors"
        title="Remove"
      >
        <Trash2 size={12} />
      </button>
    </button>
  )
}
