import { useState, useMemo, useCallback } from 'react'
import {
  AudioLines,
  Sliders,
  Search,
  SlidersHorizontal,
  Ban,
  Volume2,
  Radio,
  Gauge,
  Headphones,
  ChevronDown,
  ChevronRight,
} from 'lucide-react'
import { PanelCategoryTabs, PanelSlider, PanelToggle } from '@/components/ui/panel-controls'
import { useAudioEnhancementStore } from '@/stores/useAudioEnhancementStore'
import type { AudioEnhancementConfig } from '@/types/audioExpanded'
import { cn } from '@/lib/utils'

const TABS = [
  { id: 'presets', label: 'Presets', icon: AudioLines },
  { id: 'configure', label: 'Configure', icon: Sliders },
] as const

type TabId = (typeof TABS)[number]['id']

const PRESET_CATEGORIES = [
  { id: 'all', label: 'All' },
  { id: 'voice', label: 'Voice' },
  { id: 'music', label: 'Music' },
]

/** Map presets to categories for filtering */
function presetCategory(id: string): string {
  if (id === 'podcast' || id === 'voiceover' || id === 'asmr') return 'voice'
  if (id === 'music-video') return 'music'
  return 'all'
}

export function AudioEnhancementPanel() {
  const { config, activePreset, presets, isProcessing, analysisResults, setConfig, applyPreset } =
    useAudioEnhancementStore()

  const [activeTab, setActiveTab] = useState<TabId>('presets')
  const [search, setSearch] = useState('')
  const [filtersOpen, setFiltersOpen] = useState(false)
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [expandedSection, setExpandedSection] = useState<string | null>('leveling')

  const toggleSection = useCallback((id: string) => setExpandedSection((prev) => (prev === id ? null : id)), [])

  const q = search.toLowerCase().trim()

  const filteredPresets = useMemo(() => {
    let result = presets
    if (categoryFilter !== 'all') result = result.filter((p) => presetCategory(p.id) === categoryFilter)
    if (q) result = result.filter((p) => p.name.toLowerCase().includes(q))
    return result
  }, [presets, categoryFilter, q])

  const handleClearPreset = useCallback(() => {
    useAudioEnhancementStore.getState().reset()
  }, [])

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* ── Animated Icon Tab Bar ── */}
      <div className="shrink-0 flex items-center gap-1 px-3 py-2 border-b border-white/5">
        {TABS.map((tab) => {
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
                style={{
                  transition: 'max-width 300ms cubic-bezier(0.25, 1, 0.5, 1) 50ms, opacity 200ms ease 60ms',
                }}
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

      {/* ── Search + Filter Toggle ── */}
      <div className="shrink-0 px-3 py-2">
        <div className="flex items-center gap-1.5">
          <div className="relative flex-1">
            <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-zinc-500" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={activeTab === 'presets' ? 'Search presets...' : 'Search settings...'}
              className="w-full pl-8 pr-3 py-2 bg-zinc-800 rounded-lg text-sm text-zinc-200 placeholder-zinc-600 border border-white/5 focus:border-[#4a7eff]/30 focus:outline-none"
            />
          </div>
          {activeTab === 'presets' && (
            <button
              onClick={() => setFiltersOpen(!filtersOpen)}
              className={cn(
                'shrink-0 w-8 h-8 rounded-lg flex items-center justify-center transition-colors relative',
                filtersOpen ? 'bg-[#4a7eff]/20 text-[#4a7eff]' : 'text-zinc-500 hover:text-zinc-200 hover:bg-[#2a2a2a]',
              )}
            >
              <SlidersHorizontal size={14} />
              {categoryFilter !== 'all' && (
                <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-[#4a7eff]" />
              )}
            </button>
          )}
        </div>
      </div>

      {/* ── Filter panel (hidden by default, presets tab only) ── */}
      {filtersOpen && activeTab === 'presets' && (
        <div className="shrink-0 px-3 pb-2">
          <PanelCategoryTabs
            tabs={PRESET_CATEGORIES}
            activeTab={categoryFilter}
            onChange={(id) => setCategoryFilter(id)}
            compact
          />
        </div>
      )}

      {/* ── Scrollable Content ── */}
      <div className="flex-1 overflow-y-auto px-3 py-2">
        {/* ── Presets Tab ── */}
        {activeTab === 'presets' && (
          <>
            {filteredPresets.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-gray-600">
                <AudioLines size={28} className="mb-3" />
                <span className="text-sm text-gray-400">No presets found</span>
                <span className="text-xs text-gray-600 mt-1">Try a different keyword</span>
              </div>
            ) : (
              <div className="space-y-1">
                {/* None row */}
                <button
                  onClick={handleClearPreset}
                  className={cn(
                    'w-full px-3 py-2.5 rounded-lg text-left transition-colors border flex items-center gap-2',
                    activePreset === null
                      ? 'bg-[#4a7eff]/10 border-[#4a7eff]/30'
                      : 'bg-[#2a2a2a] border-white/5 hover:bg-[#3a3a3a]',
                  )}
                >
                  <Ban size={14} className="shrink-0 text-gray-500" />
                  <div>
                    <div className="text-xs font-medium text-gray-200">None</div>
                    <div className="text-[9px] text-gray-500 mt-0.5">No enhancement preset</div>
                  </div>
                </button>

                {/* Preset rows */}
                {filteredPresets.map((preset) => (
                  <button
                    key={preset.id}
                    onClick={() => applyPreset(preset.id)}
                    className={cn(
                      'w-full px-3 py-2.5 rounded-lg text-left transition-colors border',
                      activePreset === preset.id
                        ? 'bg-[#4a7eff]/10 border-[#4a7eff]/30'
                        : 'bg-[#2a2a2a] border-white/5 hover:bg-[#3a3a3a]',
                    )}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-medium text-gray-200">{preset.name}</span>
                      <span className="text-[9px] uppercase tracking-wide text-gray-500">
                        {presetCategory(preset.id)}
                      </span>
                    </div>
                    <div className="text-[9px] text-gray-500 mt-0.5">{describePreset(preset.config)}</div>
                  </button>
                ))}
              </div>
            )}
          </>
        )}

        {/* ── Configure Tab ── */}
        {activeTab === 'configure' && (
          <div className="space-y-1">
            {/* Auto Leveling */}
            {matchesSearch('auto leveling target lufs', q) && (
              <ConfigSection
                title="Auto Leveling"
                icon={<Volume2 size={14} />}
                expanded={expandedSection === 'leveling'}
                onToggle={() => toggleSection('leveling')}
              >
                <PanelToggle
                  label="Auto Level"
                  checked={config.autoLeveling}
                  onChange={(v) => setConfig({ autoLeveling: v })}
                />
                {config.autoLeveling && (
                  <PanelSlider
                    label="Target LUFS"
                    value={config.targetLUFS}
                    min={-30}
                    max={-5}
                    step={1}
                    onChange={(v) => setConfig({ targetLUFS: v })}
                    suffix=" LUFS"
                    compact
                  />
                )}
              </ConfigSection>
            )}

            {/* Noise Gate */}
            {matchesSearch('noise gate threshold attack release', q) && (
              <ConfigSection
                title="Noise Gate"
                icon={<Radio size={14} />}
                expanded={expandedSection === 'gate'}
                onToggle={() => toggleSection('gate')}
              >
                <PanelToggle
                  label="Enable"
                  checked={config.noiseGate.enabled}
                  onChange={(v) => setConfig({ noiseGate: { ...config.noiseGate, enabled: v } })}
                />
                {config.noiseGate.enabled && (
                  <>
                    <PanelSlider
                      label="Threshold"
                      value={config.noiseGate.threshold}
                      min={-80}
                      max={0}
                      step={1}
                      onChange={(v) => setConfig({ noiseGate: { ...config.noiseGate, threshold: v } })}
                      suffix=" dB"
                      compact
                    />
                    <PanelSlider
                      label="Attack"
                      value={config.noiseGate.attack}
                      min={0.001}
                      max={0.1}
                      step={0.001}
                      onChange={(v) => setConfig({ noiseGate: { ...config.noiseGate, attack: v } })}
                      suffix=" s"
                      precision={3}
                      compact
                    />
                    <PanelSlider
                      label="Release"
                      value={config.noiseGate.release}
                      min={0.01}
                      max={0.5}
                      step={0.01}
                      onChange={(v) => setConfig({ noiseGate: { ...config.noiseGate, release: v } })}
                      suffix=" s"
                      precision={2}
                      compact
                    />
                  </>
                )}
              </ConfigSection>
            )}

            {/* Compressor */}
            {matchesSearch('compressor threshold ratio makeup gain', q) && (
              <ConfigSection
                title="Compressor"
                icon={<Gauge size={14} />}
                expanded={expandedSection === 'compressor'}
                onToggle={() => toggleSection('compressor')}
              >
                <PanelToggle
                  label="Enable"
                  checked={config.compression.enabled}
                  onChange={(v) => setConfig({ compression: { ...config.compression, enabled: v } })}
                />
                {config.compression.enabled && (
                  <>
                    <PanelSlider
                      label="Threshold"
                      value={config.compression.threshold}
                      min={-60}
                      max={0}
                      step={1}
                      onChange={(v) => setConfig({ compression: { ...config.compression, threshold: v } })}
                      suffix=" dB"
                      compact
                    />
                    <PanelSlider
                      label="Ratio"
                      value={config.compression.ratio}
                      min={1}
                      max={20}
                      step={0.5}
                      onChange={(v) => setConfig({ compression: { ...config.compression, ratio: v } })}
                      suffix=":1"
                      compact
                    />
                    <PanelSlider
                      label="Makeup Gain"
                      value={config.compression.makeupGain}
                      min={0}
                      max={24}
                      step={0.5}
                      onChange={(v) => setConfig({ compression: { ...config.compression, makeupGain: v } })}
                      suffix=" dB"
                      compact
                    />
                  </>
                )}
              </ConfigSection>
            )}

            {/* Spatial Audio */}
            {matchesSearch('spatial audio pan room reverb', q) && (
              <ConfigSection
                title="Spatial Audio"
                icon={<Headphones size={14} />}
                expanded={expandedSection === 'spatial'}
                onToggle={() => toggleSection('spatial')}
              >
                <PanelToggle
                  label="Enable"
                  checked={config.spatialAudio.enabled}
                  onChange={(v) => setConfig({ spatialAudio: { ...config.spatialAudio, enabled: v } })}
                />
                {config.spatialAudio.enabled && (
                  <>
                    <PanelSlider
                      label="Pan"
                      value={config.spatialAudio.panPosition}
                      min={-1}
                      max={1}
                      step={0.05}
                      onChange={(v) => setConfig({ spatialAudio: { ...config.spatialAudio, panPosition: v } })}
                      precision={2}
                      compact
                    />
                    <PanelSlider
                      label="Room Size"
                      value={config.spatialAudio.roomSize}
                      min={0}
                      max={1}
                      step={0.05}
                      onChange={(v) => setConfig({ spatialAudio: { ...config.spatialAudio, roomSize: v } })}
                      precision={2}
                      compact
                    />
                    <PanelSlider
                      label="Reverb Mix"
                      value={config.spatialAudio.reverbMix}
                      min={0}
                      max={1}
                      step={0.05}
                      onChange={(v) => setConfig({ spatialAudio: { ...config.spatialAudio, reverbMix: v } })}
                      precision={2}
                      compact
                    />
                  </>
                )}
              </ConfigSection>
            )}

            {/* Ducking */}
            {matchesSearch('ducking duck amount fade', q) && (
              <ConfigSection
                title="Ducking"
                icon={<Volume2 size={14} />}
                expanded={expandedSection === 'ducking'}
                onToggle={() => toggleSection('ducking')}
              >
                <PanelToggle
                  label="Enable"
                  checked={config.ducking.enabled}
                  onChange={(v) => setConfig({ ducking: { ...config.ducking, enabled: v } })}
                />
                {config.ducking.enabled && (
                  <>
                    <PanelSlider
                      label="Duck Amount"
                      value={config.ducking.duckAmount}
                      min={-24}
                      max={0}
                      step={1}
                      onChange={(v) => setConfig({ ducking: { ...config.ducking, duckAmount: v } })}
                      suffix=" dB"
                      compact
                    />
                    <PanelSlider
                      label="Fade Time"
                      value={config.ducking.fadeTime}
                      min={0.05}
                      max={1}
                      step={0.05}
                      onChange={(v) => setConfig({ ducking: { ...config.ducking, fadeTime: v } })}
                      suffix=" s"
                      precision={2}
                      compact
                    />
                  </>
                )}
              </ConfigSection>
            )}

            {/* Loudness Meter */}
            {analysisResults && matchesSearch('loudness analysis lufs peak rms', q) && (
              <div className="p-3 rounded-lg bg-[#2a2a2a] border border-white/5">
                <div className="text-[11px] font-medium text-zinc-400 mb-2">Loudness Analysis</div>
                <div className="space-y-1 text-[11px]">
                  <div className="flex justify-between">
                    <span className="text-zinc-500">LUFS</span>
                    <span className="text-zinc-300">{analysisResults.estimatedLUFS.toFixed(1)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-zinc-500">Peak</span>
                    <span className="text-zinc-300">
                      {(20 * Math.log10(analysisResults.peak + 1e-10)).toFixed(1)} dB
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-zinc-500">RMS</span>
                    <span className="text-zinc-300">
                      {(20 * Math.log10(analysisResults.rms + 1e-10)).toFixed(1)} dB
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── Footer: processing indicator ── */}
      {isProcessing && (
        <div className="shrink-0 px-3 py-2 border-t border-white/5">
          <div className="flex items-center justify-center gap-2 py-2 rounded-lg text-[11px] font-medium bg-[#4a7eff]/10 text-[#4a7eff] border border-[#4a7eff]/20">
            Processing audio...
          </div>
        </div>
      )}
    </div>
  )
}

/* ── Helpers ── */

/** Quick search match for configure tab section visibility */
function matchesSearch(keywords: string, q: string): boolean {
  if (!q) return true
  return keywords.toLowerCase().includes(q)
}

/** Generate a short description for a preset based on its config */
function describePreset(config: AudioEnhancementConfig): string {
  const parts: string[] = []
  if (config.autoLeveling) parts.push(`${config.targetLUFS} LUFS`)
  if (config.noiseGate.enabled) parts.push('Gate')
  if (config.compression.enabled) parts.push(`${config.compression.ratio}:1 comp`)
  if (config.spatialAudio.enabled) parts.push('Spatial')
  if (config.ducking.enabled) parts.push('Ducking')
  return parts.join(' · ') || 'Default settings'
}

/** Collapsible config section — styled to match Cinema thick rows */
function ConfigSection({
  title,
  icon,
  expanded,
  onToggle,
  children,
}: {
  title: string
  icon: React.ReactNode
  expanded: boolean
  onToggle: () => void
  children: React.ReactNode
}) {
  return (
    <div
      className={cn(
        'rounded-lg border transition-colors',
        expanded ? 'bg-[#4a7eff]/5 border-[#4a7eff]/20' : 'bg-[#2a2a2a] border-white/5 hover:bg-[#3a3a3a]',
      )}
    >
      <button
        onClick={onToggle}
        className="w-full flex items-center gap-2 px-3 py-2.5 text-xs font-medium text-zinc-300 hover:text-white transition-colors"
      >
        <span className={cn('shrink-0', expanded ? 'text-[#4a7eff]' : 'text-zinc-500')}>{icon}</span>
        <span>{title}</span>
        <span className="ml-auto text-zinc-600">
          {expanded ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
        </span>
      </button>
      {expanded && <div className="px-3 pb-3">{children}</div>}
    </div>
  )
}
