import { useCrowdStore, type CrowdGroup } from '@/stores/useCrowdStore'
import { DEFAULT_CROWD_PALETTES, type CrowdPattern } from '@/services/crowdGenerator'
import { Plus, Trash2, RefreshCw, Eye, EyeOff, ChevronDown, ChevronUp, Users, Search, Sparkles } from 'lucide-react'
import { PanelSlider, PanelSelect } from '@/components/ui/panel-controls'
import { cn } from '@/lib/utils'
import { useState, useMemo } from 'react'

const PATTERN_OPTIONS: { value: CrowdPattern; label: string }[] = [
  { value: 'row', label: 'Row' },
  { value: 'scattered', label: 'Scattered' },
  { value: 'arc', label: 'Arc' },
  { value: 'bleachers', label: 'Bleachers' },
  { value: 'random', label: 'Random' },
]

const CROWD_TABS = [
  { id: 'groups' as const, label: 'Groups', icon: Users },
  { id: 'presets' as const, label: 'Presets', icon: Sparkles },
]

export function CrowdPanel() {
  const groups = useCrowdStore((s) => s.groups)
  const addGroup = useCrowdStore((s) => s.addGroup)
  const [search, setSearch] = useState('')
  const [activeTab, setActiveTab] = useState<'groups' | 'presets'>('groups')

  const q = search.toLowerCase().trim()

  const filteredGroups = useMemo(() => {
    if (!q) return groups
    return groups.filter((g) => g.name.toLowerCase().includes(q))
  }, [groups, q])

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* ── Pill Tab Bar ── */}
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
          {/* ── Search Bar ── */}
          <div className="shrink-0 px-3 py-2">
            <div className="relative">
              <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-zinc-500" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search crowd groups..."
                className="w-full pl-8 pr-3 py-2 bg-zinc-800 rounded-lg text-sm text-zinc-200 placeholder-zinc-600 border border-white/5 focus:border-[#4a7eff]/30 focus:outline-none"
              />
            </div>
          </div>

          {/* ── Groups list ── */}
          <div className="flex-1 overflow-y-auto px-3 py-2 space-y-2">
            {filteredGroups.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-gray-600">
                <Users size={28} className="mb-3" />
                <span className="text-sm text-gray-400">{q ? 'No groups found' : 'No crowd groups yet'}</span>
                <span className="text-xs text-gray-600 mt-1">
                  {q ? 'Try a different keyword' : 'Click below to add a crowd group'}
                </span>
              </div>
            ) : (
              filteredGroups.map((group) => <CrowdGroupCard key={group.id} group={group} />)
            )}
          </div>

          {/* ── Footer action ── */}
          <div className="shrink-0 px-3 py-2 border-t border-white/5">
            <button
              onClick={addGroup}
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

function CrowdGroupCard({ group }: { group: CrowdGroup }) {
  const updateGroup = useCrowdStore((s) => s.updateGroup)
  const removeGroup = useCrowdStore((s) => s.removeGroup)
  const regenerate = useCrowdStore((s) => s.regenerate)
  const [expanded, setExpanded] = useState(true)

  return (
    <div className="bg-[#2a2a2a] border border-white/5 rounded-lg overflow-hidden">
      {/* Group header */}
      <div className="flex items-center gap-2 px-3 py-2">
        <button
          onClick={() => setExpanded(!expanded)}
          className="p-0.5 text-zinc-400 hover:text-zinc-200 transition-colors"
        >
          {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        </button>

        <input
          type="text"
          value={group.name}
          onChange={(e) => updateGroup(group.id, { name: e.target.value })}
          className="flex-1 bg-transparent text-sm text-zinc-200 border-none outline-none"
        />

        <span className="text-[11px] text-zinc-500 tabular-nums">{group.count} members</span>

        <button
          onClick={() => updateGroup(group.id, { visible: !group.visible })}
          className="p-1 rounded text-zinc-400 hover:text-zinc-200 transition-colors"
          title={group.visible ? 'Hide' : 'Show'}
        >
          {group.visible ? <Eye size={14} /> : <EyeOff size={14} />}
        </button>

        <button
          onClick={() => regenerate(group.id)}
          className="p-1 rounded text-zinc-400 hover:text-[#4a7eff] transition-colors"
          title="Regenerate with new seed"
        >
          <RefreshCw size={14} />
        </button>

        <button
          onClick={() => removeGroup(group.id)}
          className="p-1 rounded text-zinc-400 hover:text-red-400 transition-colors"
          title="Remove"
        >
          <Trash2 size={14} />
        </button>
      </div>

      {expanded && (
        <div className="px-3 pb-3 space-y-3 border-t border-white/5 pt-3">
          {/* Count slider */}
          <PanelSlider
            label="Count"
            value={group.count}
            min={5}
            max={200}
            step={1}
            onChange={(v) => updateGroup(group.id, { count: v })}
          />

          {/* Pattern selector */}
          <PanelSelect
            label="Pattern"
            value={group.pattern}
            onChange={(v) => updateGroup(group.id, { pattern: v as CrowdPattern })}
            options={PATTERN_OPTIONS}
          />

          {/* Animation speed */}
          <PanelSlider
            label="Anim Speed"
            value={group.animSpeed}
            min={0}
            max={3}
            step={0.1}
            precision={1}
            onChange={(v) => updateGroup(group.id, { animSpeed: v })}
          />

          {/* Seed */}
          <PanelSlider
            label="Seed"
            value={group.seed}
            min={0}
            max={999999}
            step={1}
            onChange={(v) => useCrowdStore.getState().setSeed(group.id, v)}
          />

          {/* Area bounds */}
          <div className="space-y-1.5">
            <label className="text-[11px] text-zinc-500 font-medium">Area Bounds (normalized 0-1)</label>
            <div className="grid grid-cols-2 gap-2">
              <PanelSlider
                label="X"
                value={group.area.x}
                min={0}
                max={1}
                step={0.01}
                precision={2}
                onChange={(v) => updateGroup(group.id, { area: { ...group.area, x: v } })}
                inline
              />
              <PanelSlider
                label="Y"
                value={group.area.y}
                min={0}
                max={1}
                step={0.01}
                precision={2}
                onChange={(v) => updateGroup(group.id, { area: { ...group.area, y: v } })}
                inline
              />
              <PanelSlider
                label="W"
                value={group.area.w}
                min={0.05}
                max={1}
                step={0.01}
                precision={2}
                onChange={(v) => updateGroup(group.id, { area: { ...group.area, w: v } })}
                inline
              />
              <PanelSlider
                label="H"
                value={group.area.h}
                min={0.05}
                max={1}
                step={0.01}
                precision={2}
                onChange={(v) => updateGroup(group.id, { area: { ...group.area, h: v } })}
                inline
              />
            </div>
          </div>

          {/* Color palette preview */}
          <div className="space-y-1.5">
            <label className="text-[11px] text-zinc-500 font-medium">Color Palette</label>
            <div className="flex flex-wrap gap-1.5">
              {(group.colors.length > 0 ? group.colors : DEFAULT_CROWD_PALETTES).map((pair, i) => (
                <div
                  key={i}
                  className="flex rounded-md overflow-hidden border border-white/10"
                  title={`Skin: ${pair[0]}, Outfit: ${pair[1]}`}
                >
                  <div className="w-4 h-4" style={{ backgroundColor: pair[0] }} />
                  <div className="w-4 h-4" style={{ backgroundColor: pair[1] }} />
                </div>
              ))}
            </div>
          </div>

          {/* Frame range */}
          <div className="grid grid-cols-2 gap-2">
            <PanelSlider
              label="Start"
              value={group.startFrame}
              min={0}
              max={9999}
              step={1}
              onChange={(v) => updateGroup(group.id, { startFrame: v })}
              inline
            />
            <PanelSlider
              label="End"
              value={group.endFrame}
              min={0}
              max={9999}
              step={1}
              onChange={(v) => updateGroup(group.id, { endFrame: v })}
              inline
            />
          </div>
        </div>
      )}
    </div>
  )
}
