/**
 * Animation Style Transfer Panel — Matches Cinema panel pattern:
 * animated tab bar, search, thick rows, blue accent.
 *
 * Two tabs: Presets (quick pick) and Custom (targets + learn + sliders).
 */

import { useCallback, useMemo, useState } from 'react'
import { Wand2, Zap, Check, Sparkles, Search, Ban } from 'lucide-react'
import { useShallow } from 'zustand/react/shallow'
import { cn } from '@/lib/utils'
import { PanelSlider } from '@/components/ui/panel-controls'
import { useAnimStyleStore } from '@/stores/useAnimStyleStore'
import { useKeyframeStore } from '@/stores/useKeyframeStore'
import {
  STYLE_PRESETS,
  applyStyle,
  applyPresetStyle,
  buildCustomFeatures,
  extractStyleFeatures,
} from '@/services/animationStyleTransfer'
import type { CanvasObjectRef, ObjectPropertyTrack } from '@/types/keyframes'

// ── Tabs ──────────────────────────────────────────────────────────────────────

const TABS = [
  { id: 'presets', label: 'Presets', icon: Sparkles },
  { id: 'custom', label: 'Custom', icon: Wand2 },
] as const

type TabId = (typeof TABS)[number]['id']

// ── Target Objects (sub-components) ───────────────────────────────────────────

function TargetObjectsList() {
  const affectedObjects = useAnimStyleStore((s) => s.affectedObjects)
  const clearAffectedObjects = useAnimStyleStore((s) => s.clearAffectedObjects)
  const selectAllObjects = useAnimStyleStore((s) => s.selectAllObjects)

  const allObjectsWithKeyframes = useKeyframeStore((s) => s.getAllObjectsWithKeyframes)
  const allObjects = useMemo(() => allObjectsWithKeyframes(), [allObjectsWithKeyframes])

  const handleSelectAll = useCallback(() => {
    selectAllObjects(allObjects)
  }, [allObjects, selectAllObjects])

  if (allObjects.length === 0) {
    return (
      <p className="text-[11px] text-zinc-500 italic">
        No objects with keyframes found. Add keyframes to objects first.
      </p>
    )
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <button
          onClick={handleSelectAll}
          className="text-[11px] text-zinc-400 hover:text-accent transition-colors"
        >
          Select All ({allObjects.length})
        </button>
        {affectedObjects.length > 0 && (
          <button
            onClick={clearAffectedObjects}
            className="text-[11px] text-zinc-500 hover:text-zinc-300 transition-colors"
          >
            Clear
          </button>
        )}
      </div>
      <div className="max-h-[120px] overflow-y-auto space-y-1">
        {allObjects.map((obj) => {
          const isSelected = affectedObjects.some(
            (a) => a.objectType === obj.objectType && a.objectId === obj.objectId,
          )
          return (
            <ObjectRow
              key={`${obj.objectType}:${obj.objectId}`}
              objectRef={obj}
              isSelected={isSelected}
            />
          )
        })}
      </div>
    </div>
  )
}

function ObjectRow({
  objectRef,
  isSelected,
}: {
  objectRef: CanvasObjectRef
  isSelected: boolean
}) {
  const addAffectedObject = useAnimStyleStore((s) => s.addAffectedObject)
  const removeAffectedObject = useAnimStyleStore((s) => s.removeAffectedObject)

  const toggle = useCallback(() => {
    if (isSelected) {
      removeAffectedObject(objectRef)
    } else {
      addAffectedObject(objectRef)
    }
  }, [isSelected, objectRef, addAffectedObject, removeAffectedObject])

  const label = `${objectRef.objectType} - ${objectRef.objectId.slice(0, 8)}`

  return (
    <button
      onClick={toggle}
      className={cn(
        'w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-[11px] transition-colors',
        isSelected
          ? 'bg-accent/10 text-accent border border-accent/20'
          : 'text-zinc-400 hover:bg-white/[0.04] border border-transparent',
      )}
    >
      <div
        className={cn(
          'w-3.5 h-3.5 rounded border flex items-center justify-center transition-colors',
          isSelected ? 'bg-accent border-accent' : 'border-zinc-600',
        )}
      >
        {isSelected && <Check size={9} className="text-white" />}
      </div>
      <span className="truncate">{label}</span>
    </button>
  )
}

// ── Main Panel ────────────────────────────────────────────────────────────────

export function AnimStylePanel() {
  const {
    activePresetId,
    affectedObjects,
    learnedFeatures,
    customIntensity,
    customElasticity,
    customSpeedMultiplier,
    customRhythmVariation,
    setActivePreset,
    setLearnedFeatures,
    setCustomIntensity,
    setCustomElasticity,
    setCustomSpeedMultiplier,
    setCustomRhythmVariation,
  } = useAnimStyleStore(
    useShallow((s) => ({
      activePresetId: s.activePresetId,
      affectedObjects: s.affectedObjects,
      learnedFeatures: s.learnedFeatures,
      customIntensity: s.customIntensity,
      customElasticity: s.customElasticity,
      customSpeedMultiplier: s.customSpeedMultiplier,
      customRhythmVariation: s.customRhythmVariation,
      setActivePreset: s.setActivePreset,
      setLearnedFeatures: s.setLearnedFeatures,
      setCustomIntensity: s.setCustomIntensity,
      setCustomElasticity: s.setCustomElasticity,
      setCustomSpeedMultiplier: s.setCustomSpeedMultiplier,
      setCustomRhythmVariation: s.setCustomRhythmVariation,
    })),
  )

  const getTracksForObject = useKeyframeStore((s) => s.getTracksForObject)

  const [activeTab, setActiveTab] = useState<TabId>('presets')
  const [search, setSearch] = useState('')

  const q = search.toLowerCase().trim()

  // ── Filtered presets ──────────────────────────────────────────────────────

  const filteredPresets = useMemo(() => {
    if (!q) return STYLE_PRESETS
    return STYLE_PRESETS.filter(
      (p) =>
        p.label.toLowerCase().includes(q) ||
        p.description.toLowerCase().includes(q),
    )
  }, [q])

  // ── Callbacks ─────────────────────────────────────────────────────────────

  const getAffectedTracks = useCallback((): ObjectPropertyTrack[] => {
    const result: ObjectPropertyTrack[] = []
    for (const obj of affectedObjects) {
      result.push(...getTracksForObject(obj))
    }
    return result
  }, [affectedObjects, getTracksForObject])

  const handleLearnFromSelection = useCallback(() => {
    const targetTracks = getAffectedTracks()
    if (targetTracks.length === 0) return
    const features = extractStyleFeatures(targetTracks)
    setLearnedFeatures(features)
    setCustomIntensity(Math.round(features.amplitudeMultiplier * 100) / 100)
    setCustomElasticity(Math.round(features.overshoot * 100) / 100)
    setCustomSpeedMultiplier(Math.round(features.speedMultiplier * 100) / 100)
    setCustomRhythmVariation(Math.round(features.rhythmVariation * 100) / 100)
  }, [
    getAffectedTracks,
    setLearnedFeatures,
    setCustomIntensity,
    setCustomElasticity,
    setCustomSpeedMultiplier,
    setCustomRhythmVariation,
  ])

  const handleApplyStyle = useCallback(() => {
    const targetTracks = getAffectedTracks()
    if (targetTracks.length === 0) return

    let styledTracks: ObjectPropertyTrack[]

    if (learnedFeatures) {
      styledTracks = applyStyle(targetTracks, learnedFeatures)
    } else if (activePresetId) {
      const result = applyPresetStyle(targetTracks, activePresetId)
      if (!result) return
      styledTracks = result
    } else {
      const features = buildCustomFeatures({
        intensity: customIntensity,
        elasticity: customElasticity,
        speedMultiplier: customSpeedMultiplier,
        rhythmVariation: customRhythmVariation,
      })
      styledTracks = applyStyle(targetTracks, features)
    }

    const kfStore = useKeyframeStore.getState()
    for (const styledTrack of styledTracks) {
      const existingTrack = kfStore.tracks.find((t) => t.id === styledTrack.id)
      if (!existingTrack) continue

      for (const kf of styledTrack.keyframes) {
        kfStore.updateKeyframeEasing(kf.id, kf.easing, kf.bezierParams)
      }

      const objRef = styledTrack.objectRef
      const property = styledTrack.property

      kfStore.removeAllKeyframes(objRef)

      for (const kf of styledTrack.keyframes) {
        kfStore.setKeyframe(objRef, property, kf.frame, kf.value)
        const updatedTracks = useKeyframeStore.getState().tracks
        const updatedTrack = updatedTracks.find(
          (t) =>
            t.objectRef.objectType === objRef.objectType &&
            t.objectRef.objectId === objRef.objectId &&
            t.property === property,
        )
        if (updatedTrack) {
          const addedKf = updatedTrack.keyframes.find((k) => k.frame === kf.frame)
          if (addedKf) {
            kfStore.updateKeyframeEasing(addedKf.id, kf.easing, kf.bezierParams)
          }
        }
      }
    }
  }, [
    getAffectedTracks,
    learnedFeatures,
    activePresetId,
    customIntensity,
    customElasticity,
    customSpeedMultiplier,
    customRhythmVariation,
  ])

  const hasTargets = affectedObjects.length > 0
  const hasStyle =
    activePresetId !== null ||
    learnedFeatures !== null ||
    customIntensity !== 1 ||
    customElasticity !== 0 ||
    customSpeedMultiplier !== 1 ||
    customRhythmVariation !== 0

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
                isActive
                  ? 'bg-white text-black px-2'
                  : 'text-gray-400 hover:text-white hover:bg-panel-surface',
              )}
            >
              <Icon size={16} className="shrink-0" />
              <span
                style={{
                  transition:
                    'max-width 300ms cubic-bezier(0.25, 1, 0.5, 1) 50ms, opacity 200ms ease 60ms',
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

      {/* ── Search (Presets tab only) ── */}
      {activeTab === 'presets' && (
        <div className="shrink-0 px-3 py-2">
          <div className="relative">
            <Search
              size={14}
              className="absolute left-2.5 top-1/2 -translate-y-1/2 text-zinc-500"
            />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search presets..."
              className="w-full pl-8 pr-3 py-2 bg-zinc-800 rounded-lg text-sm text-zinc-200 placeholder-zinc-600 border border-white/5 focus:border-accent/30 focus:outline-none"
            />
          </div>
        </div>
      )}

      {/* ── Scrollable content ── */}
      <div className="flex-1 overflow-y-auto px-3 py-2">
        {/* ── Presets tab ── */}
        {activeTab === 'presets' && (
          <div className="space-y-1">
            {filteredPresets.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-gray-600">
                <Sparkles size={28} className="mb-3" />
                <span className="text-sm text-gray-400">No presets found</span>
                <span className="text-xs text-gray-600 mt-1">Try a different keyword</span>
              </div>
            ) : (
              <>
                <button
                  onClick={() => setActivePreset(null)}
                  className={cn(
                    'w-full px-3 py-2.5 rounded-lg text-left transition-colors border flex items-center gap-2',
                    activePresetId === null
                      ? 'bg-accent/10 border-accent/30'
                      : 'bg-panel-surface border-white/5 hover:bg-panel-surface-hover',
                  )}
                >
                  <Ban size={14} className="shrink-0 text-gray-500" />
                  <div>
                    <div className="text-xs font-medium text-gray-200">None</div>
                    <div className="text-[9px] text-gray-500 mt-0.5">No style preset</div>
                  </div>
                </button>
                {filteredPresets.map((preset) => {
                  const isActive = activePresetId === preset.id
                  return (
                    <button
                      key={preset.id}
                      onClick={() => setActivePreset(preset.id)}
                      className={cn(
                        'w-full px-3 py-2.5 rounded-lg text-left transition-colors border',
                        isActive
                          ? 'bg-accent/10 border-accent/30'
                          : 'bg-panel-surface border-white/5 hover:bg-panel-surface-hover',
                      )}
                    >
                      <div className="text-xs font-medium text-gray-200">
                        {preset.label}
                      </div>
                      <div className="text-[9px] text-gray-500 mt-0.5">
                        {preset.description}
                      </div>
                    </button>
                  )
                })}
              </>
            )}
          </div>
        )}

        {/* ── Custom tab: targets → learn → sliders ── */}
        {activeTab === 'custom' && (
          <div className="space-y-4">
            {/* Target Objects */}
            <div>
              <h4 className="text-[11px] font-medium text-zinc-500 uppercase tracking-wider mb-2">
                Target Objects
              </h4>
              <TargetObjectsList />
            </div>

            {/* Learn from Selection */}
            <div>
              <h4 className="text-[11px] font-medium text-zinc-500 uppercase tracking-wider mb-2">
                Learn
              </h4>
              <p className="text-[10px] text-zinc-500 leading-relaxed mb-2">
                Extract animation style from selected objects' keyframes.
              </p>
              <button
                onClick={handleLearnFromSelection}
                disabled={!hasTargets}
                className={cn(
                  'w-full py-2 rounded-lg text-xs font-medium transition-colors flex items-center justify-center gap-1.5',
                  hasTargets
                    ? 'bg-panel-surface border border-white/5 text-zinc-200 hover:bg-panel-surface-hover'
                    : 'bg-panel-bg text-zinc-600 cursor-not-allowed border border-white/5',
                )}
              >
                <Zap size={12} />
                Learn from Selection
              </button>
              {learnedFeatures && (
                <div className="mt-2 p-2 rounded-lg bg-accent/5 border border-accent/10">
                  <p className="text-[10px] text-accent">
                    Learned: {learnedFeatures.easingType} easing,{' '}
                    {learnedFeatures.speedMultiplier.toFixed(1)}x speed,{' '}
                    {(learnedFeatures.overshoot * 100).toFixed(0)}% overshoot
                  </p>
                </div>
              )}
            </div>

            {/* Parameters */}
            <div>
              <h4 className="text-[11px] font-medium text-zinc-500 uppercase tracking-wider mb-2">
                Parameters
              </h4>
              <div className="space-y-3">
                <PanelSlider
                  label="Intensity"
                  value={customIntensity}
                  onChange={setCustomIntensity}
                  min={0.1}
                  max={3}
                  step={0.05}
                  precision={2}
                />
                <PanelSlider
                  label="Elasticity"
                  value={customElasticity}
                  onChange={setCustomElasticity}
                  min={0}
                  max={1}
                  step={0.05}
                  precision={2}
                />
                <PanelSlider
                  label="Speed"
                  value={customSpeedMultiplier}
                  onChange={setCustomSpeedMultiplier}
                  min={0.25}
                  max={4}
                  step={0.05}
                  precision={2}
                />
                <PanelSlider
                  label="Rhythm"
                  value={customRhythmVariation}
                  onChange={setCustomRhythmVariation}
                  min={0}
                  max={1}
                  step={0.05}
                  precision={2}
                />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ── Footer: Apply button ── */}
      <div className="shrink-0 px-3 py-2 border-t border-white/5">
        <button
          onClick={handleApplyStyle}
          disabled={!hasTargets || !hasStyle}
          className={cn(
            'w-full flex items-center justify-center gap-2 py-2 rounded-lg text-[11px] font-medium transition-colors',
            hasTargets && hasStyle
              ? 'bg-accent text-white hover:bg-[#5a8eff]'
              : 'bg-panel-surface text-zinc-600 cursor-not-allowed border border-white/5',
          )}
        >
          <Wand2 size={13} />
          Apply Style
        </button>
      </div>
    </div>
  )
}
