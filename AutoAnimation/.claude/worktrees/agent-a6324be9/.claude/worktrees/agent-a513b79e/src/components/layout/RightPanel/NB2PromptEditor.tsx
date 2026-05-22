/**
 * NB2PromptEditor — Cinema-standard prompt editor for AI character generation steps.
 *
 * Animated icon tab bar (white active, flex-expand) for prompt sections:
 *   - Instruction, Grid, Cells, Critical, Requirements, Raw
 *
 * Each section's input fills all available vertical space.
 */

import { useMemo } from 'react'
import { FileText, Grid3X3, LayoutGrid, AlertTriangle, ListChecks, Code, Plus, Trash2, RotateCcw } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useNB2Store, useNB2DerivedState } from '@/stores/useNB2Store'
import { isGridStep, type NB2PromptConfig, type NB2CellDesc } from '@/services/nb2Prompts'

type PromptTab = 'instruction' | 'gridNote' | 'cells' | 'critical' | 'requirements' | 'raw'

const TAB_DEFS: { id: PromptTab; label: string; icon: typeof FileText }[] = [
  { id: 'instruction', label: 'Instruction', icon: FileText },
  { id: 'gridNote', label: 'Grid', icon: Grid3X3 },
  { id: 'cells', label: 'Cells', icon: LayoutGrid },
  { id: 'critical', label: 'Critical', icon: AlertTriangle },
  { id: 'requirements', label: 'Reqs', icon: ListChecks },
  { id: 'raw', label: 'Raw', icon: Code },
]

export function NB2PromptEditor() {
  const promptOverrides = useNB2Store((s) => s.promptOverrides)
  const gridSizes = useNB2Store((s) => s.gridSizes)
  const setPromptOverride = useNB2Store((s) => s.setPromptOverride)
  const clearPromptOverride = useNB2Store((s) => s.clearPromptOverride)
  const setPromptConfig = useNB2Store((s) => s.setPromptConfig)
  const clearPromptConfig = useNB2Store((s) => s.clearPromptConfig)
  const getPromptConfig = useNB2Store((s) => s.getPromptConfig)
  const activeTab = useNB2Store((s) => s.promptActiveTab ?? 'instruction') as PromptTab
  const setActiveTab = useNB2Store((s) => s.setPromptActiveTab)

  const { activePromptStep, activePromptText, activePromptConfig } = useNB2DerivedState()

  const hasRawOverride = activePromptStep ? !!promptOverrides[activePromptStep] : false
  const grid = activePromptStep ? gridSizes[activePromptStep] : undefined
  const isGrid = activePromptStep ? isGridStep(activePromptStep) : false
  const config = activePromptStep
    ? (activePromptConfig ?? getPromptConfig(activePromptStep))
    : ({ instruction: '', requirements: [] as string[] } as NB2PromptConfig)

  // Build available tabs for this step — must be before early return (hooks rule)
  const availableTabs = useMemo(() => {
    const ids = new Set<PromptTab>(['instruction', 'requirements', 'raw'])
    if (isGrid && config.gridNote !== undefined) ids.add('gridNote')
    if (config.cells && config.cells.length > 0) ids.add('cells')
    if (config.criticalNote !== undefined) ids.add('critical')
    return TAB_DEFS.filter((t) => ids.has(t.id))
  }, [isGrid, config.gridNote, config.cells, config.criticalNote])

  if (!activePromptStep || activePromptText === null) return null

  const updateConfig = (partial: Partial<NB2PromptConfig>) => {
    setPromptConfig(activePromptStep, { ...config, ...partial })
    if (hasRawOverride) clearPromptOverride(activePromptStep)
  }

  const resetToDefault = () => {
    clearPromptConfig(activePromptStep)
    clearPromptOverride(activePromptStep)
  }

  // Fall back if current tab isn't available for this step
  const currentTab = availableTabs.find((t) => t.id === activeTab) ? activeTab : 'instruction'

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* ── Cinema animated icon tab bar ── */}
      <div className="shrink-0 flex items-center gap-1 px-3 py-2 border-b border-white/5">
        {availableTabs.map((tab) => {
          const isActive = currentTab === tab.id
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
              <Icon size={14} className="shrink-0" />
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

        {/* Reset button */}
        <button
          onClick={resetToDefault}
          className="shrink-0 w-8 h-8 rounded-lg flex items-center justify-center text-zinc-500 hover:text-zinc-200 hover:bg-[#2a2a2a] transition-colors"
          title="Reset to default"
        >
          <RotateCcw size={12} />
        </button>
      </div>

      {/* Grid badge */}
      {isGrid && grid && (
        <div className="shrink-0 mx-3 mt-2 flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-[#4a7eff]/10 border border-[#4a7eff]/20">
          <Grid3X3 size={11} className="text-[#4a7eff]" />
          <span className="text-[11px] text-[#4a7eff] font-medium">
            {grid.cols} x {grid.rows} = {grid.cols * grid.rows} cells
          </span>
        </div>
      )}

      {/* ── Tab content — fills remaining height ── */}
      <div className="flex-1 flex flex-col min-h-0 p-3">
        {currentTab === 'instruction' && (
          <textarea
            value={config.instruction}
            onChange={(e) => updateConfig({ instruction: e.target.value })}
            className="flex-1 w-full bg-[#2a2a2a] text-white text-sm px-3 py-2 rounded-lg leading-relaxed focus:outline-none focus:ring-1 focus:ring-[#4a7eff] resize-none"
            placeholder="Instruction for this step..."
          />
        )}

        {currentTab === 'gridNote' && (
          <textarea
            value={config.gridNote || ''}
            onChange={(e) => updateConfig({ gridNote: e.target.value })}
            className="flex-1 w-full bg-[#2a2a2a] text-white text-sm px-3 py-2 rounded-lg leading-relaxed focus:outline-none focus:ring-1 focus:ring-[#4a7eff] resize-none"
            placeholder="What should each cell contain..."
          />
        )}

        {currentTab === 'cells' && config.cells && (
          <div className="flex-1 overflow-y-auto">
            <CellList cells={config.cells} onChange={(cells) => updateConfig({ cells })} />
          </div>
        )}

        {currentTab === 'critical' && (
          <textarea
            value={config.criticalNote || ''}
            onChange={(e) => updateConfig({ criticalNote: e.target.value })}
            className="flex-1 w-full bg-[#2a2a2a] text-white text-sm px-3 py-2 rounded-lg leading-relaxed focus:outline-none focus:ring-1 focus:ring-[#4a7eff] resize-none"
            placeholder="Critical requirements..."
          />
        )}

        {currentTab === 'requirements' && (
          <div className="flex-1 overflow-y-auto">
            <RequirementsList items={config.requirements} onChange={(requirements) => updateConfig({ requirements })} />
          </div>
        )}

        {currentTab === 'raw' && (
          <textarea
            value={activePromptText}
            onChange={(e) => setPromptOverride(activePromptStep, e.target.value)}
            className="flex-1 w-full bg-[#2a2a2a] text-white text-sm px-3 py-2 rounded-lg font-mono leading-relaxed focus:outline-none focus:ring-1 focus:ring-[#4a7eff] resize-none"
            placeholder="Raw prompt text — sent directly to the AI."
          />
        )}
      </div>
    </div>
  )
}

// ── Cell Description List ────────────────────────────────────────────

function CellList({ cells, onChange }: { cells: NB2CellDesc[]; onChange: (cells: NB2CellDesc[]) => void }) {
  const update = (idx: number, field: 'label' | 'description', value: string) => {
    const next = cells.map((c, i) => (i === idx ? { ...c, [field]: value } : c))
    onChange(next)
  }

  const remove = (idx: number) => {
    onChange(cells.filter((_, i) => i !== idx))
  }

  const add = () => {
    onChange([...cells, { label: `Cell ${cells.length + 1}`, description: '' }])
  }

  return (
    <div className="space-y-1.5">
      {cells.map((cell, i) => (
        <div key={i} className="flex gap-1.5 items-start group">
          <span className="text-[10px] text-zinc-600 mt-2 w-3 shrink-0 text-right">{i + 1}</span>
          <div className="flex-1 space-y-0.5">
            <input
              value={cell.label}
              onChange={(e) => update(i, 'label', e.target.value)}
              className="w-full bg-[#2a2a2a] text-white text-sm px-3 py-2 rounded-lg border border-white/5 font-medium focus:outline-none focus:ring-1 focus:ring-[#4a7eff]"
            />
            <input
              value={cell.description}
              onChange={(e) => update(i, 'description', e.target.value)}
              className="w-full bg-[#2a2a2a] text-gray-400 text-sm px-3 py-2 rounded-lg border border-white/5 focus:outline-none focus:ring-1 focus:ring-[#4a7eff]"
              placeholder="Description..."
            />
          </div>
          <button
            onClick={() => remove(i)}
            className="p-1 mt-1.5 rounded-lg opacity-0 group-hover:opacity-100 hover:bg-red-600/10 text-zinc-600 hover:text-red-400 transition-all"
          >
            <Trash2 size={12} />
          </button>
        </div>
      ))}
      <button
        onClick={add}
        className="flex items-center gap-1 px-3 py-2 rounded-lg text-sm text-zinc-500 hover:text-[#4a7eff] hover:bg-[#4a7eff]/10 transition-colors"
      >
        <Plus size={12} /> Add cell
      </button>
    </div>
  )
}

// ── Requirements List ────────────────────────────────────────────────

function RequirementsList({ items, onChange }: { items: string[]; onChange: (items: string[]) => void }) {
  const update = (idx: number, value: string) => {
    onChange(items.map((it, i) => (i === idx ? value : it)))
  }

  const remove = (idx: number) => {
    onChange(items.filter((_, i) => i !== idx))
  }

  const add = () => {
    onChange([...items, ''])
  }

  return (
    <div className="space-y-1">
      {items.map((item, i) => (
        <div key={i} className="flex gap-1 items-center group">
          <span className="text-[10px] text-zinc-600 shrink-0">-</span>
          <input
            value={item}
            onChange={(e) => update(i, e.target.value)}
            className="flex-1 bg-[#2a2a2a] text-white text-sm px-3 py-2 rounded-lg border border-white/5 focus:outline-none focus:ring-1 focus:ring-[#4a7eff]"
          />
          <button
            onClick={() => remove(i)}
            className="p-1 rounded-lg opacity-0 group-hover:opacity-100 hover:bg-red-600/10 text-zinc-600 hover:text-red-400 transition-all"
          >
            <Trash2 size={12} />
          </button>
        </div>
      ))}
      <button
        onClick={add}
        className="flex items-center gap-1 px-3 py-2 rounded-lg text-sm text-zinc-500 hover:text-[#4a7eff] hover:bg-[#4a7eff]/10 transition-colors"
      >
        <Plus size={12} /> Add requirement
      </button>
    </div>
  )
}
