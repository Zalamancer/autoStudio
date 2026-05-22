/**
 * NB2ControlsSection — Left panel controls for AI character generation.
 *
 * Cinema-standard form layout with stacked rows, dropdowns, and thick inputs.
 * Reads/writes useNB2Store.
 */

import { useCallback } from 'react'
import { Wand2, X, AlertCircle, Save, User, RotateCw, Palette, LayoutTemplate } from 'lucide-react'
import { cn } from '@/lib/utils'
import { PanelToggle, PanelSelect } from '@/components/ui/panel-controls'
import { CreditCostTag } from '@/components/credits/CreditCostTag'
import { useNB2Store, useNB2DerivedState, STEP_AR_OVERRIDES } from '@/stores/useNB2Store'
const RESOLUTION_OPTIONS: { label: string; value: '512' | '1024' | '2048' | '4096' }[] = [
  { label: '0.5K', value: '512' },
  { label: '1K', value: '1024' },
  { label: '2K', value: '2048' },
  { label: '4K', value: '4096' },
]

const ASPECT_RATIO_OPTIONS: { label: string; value: '1:1' | '3:2' | '2:3' | '3:4' | '4:3' | '9:16' | '16:9' }[] = [
  { label: '1:1', value: '1:1' },
  { label: '4:3', value: '4:3' },
  { label: '3:4', value: '3:4' },
  { label: '16:9', value: '16:9' },
  { label: '9:16', value: '9:16' },
  { label: '3:2', value: '3:2' },
  { label: '2:3', value: '2:3' },
]

const GENDER_OPTIONS: { label: string; value: string }[] = [
  { label: 'Neutral', value: 'neutral' },
  { label: 'Male', value: 'male' },
  { label: 'Female', value: 'female' },
]

export function NB2ControlsSection() {
  const characterName = useNB2Store((s) => s.characterName)
  const gender = useNB2Store((s) => s.gender)
  const prompt = useNB2Store((s) => s.prompt)
  const styleRef = useNB2Store((s) => s.styleRef)
  const layoutRef = useNB2Store((s) => s.layoutRef)
  const resolution = useNB2Store((s) => s.resolution)
  const aspectRatio = useNB2Store((s) => s.aspectRatio)
  const autoMode = useNB2Store((s) => s.autoMode)
  const isRunning = useNB2Store((s) => s.isRunning)
  const error = useNB2Store((s) => s.error)
  const result = useNB2Store((s) => s.result)
  const selectedStepId = useNB2Store((s) => s.selectedStepId)

  const setCharacterName = useNB2Store((s) => s.setCharacterName)
  const setGender = useNB2Store((s) => s.setGender)
  const setPrompt = useNB2Store((s) => s.setPrompt)
  const setStyleRef = useNB2Store((s) => s.setStyleRef)
  const setLayoutRef = useNB2Store((s) => s.setLayoutRef)
  const setResolution = useNB2Store((s) => s.setResolution)
  const setAspectRatio = useNB2Store((s) => s.setAspectRatio)
  const setAutoMode = useNB2Store((s) => s.setAutoMode)
  const generate = useNB2Store((s) => s.generate)
  const cancel = useNB2Store((s) => s.cancel)
  const save = useNB2Store((s) => s.save)

  const visemeMode = useNB2Store((s) => s.visemeMode)

  const { hasError, isComplete, stepByStepInProgress } = useNB2DerivedState()

  // Effective AR for the selected step (accounts for per-step overrides)
  const stepAR = selectedStepId ? STEP_AR_OVERRIDES[selectedStepId] : undefined
  const effectiveAR =
    selectedStepId === 'viseme-sheet' && visemeMode === 'all-at-once' ? '9:16' : (stepAR ?? aspectRatio)

  // ── Image upload handlers ──────────────────────────────────────

  const handleImageUpload = useCallback(
    (setter: (val: string | null) => void) => (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0]
      if (!file) return
      const reader = new FileReader()
      reader.onload = (ev) => setter(ev.target?.result as string)
      reader.readAsDataURL(file)
    },
    [],
  )

  const handleDrop = useCallback(
    (setter: (val: string | null) => void) => (e: React.DragEvent) => {
      e.preventDefault()
      const file = e.dataTransfer.files?.[0]
      if (!file || !file.type.startsWith('image/')) return
      const reader = new FileReader()
      reader.onload = (ev) => setter(ev.target?.result as string)
      reader.readAsDataURL(file)
    },
    [],
  )

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* ── Scrollable body ── */}
      <div className="flex-1 min-h-0 overflow-y-auto">
        <div className="space-y-2 px-3 py-3 [&>*]:!mb-0">
          {/* ── Character Name ── */}
          <div className="relative">
            <User size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
            <input
              type="text"
              value={characterName}
              onChange={(e) => setCharacterName(e.target.value)}
              placeholder="Character name..."
              className="w-full pl-9 pr-3 py-2.5 bg-zinc-800 rounded-lg text-sm text-zinc-200 placeholder-zinc-600 border border-white/5 focus:border-[#4a7eff]/30 focus:outline-none"
              disabled={isRunning}
            />
          </div>

          {/* ── Reference Images ── */}
          <div className="grid grid-cols-2 gap-2">
            {/* Style Ref */}
            <div
              className={cn(
                'aspect-[4/3] rounded-lg border-2 border-dashed flex items-center justify-center cursor-pointer overflow-hidden transition-colors',
                styleRef ? 'border-[#4a7eff]/50 bg-[#2a2a2a]' : 'border-white/5 bg-[#2a2a2a] hover:border-[#4a7eff]/30',
              )}
              onDragOver={(e) => e.preventDefault()}
              onDrop={handleDrop(setStyleRef)}
              onClick={() => document.getElementById('nb2-style-input')?.click()}
            >
              {styleRef ? (
                <div className="relative w-full h-full">
                  <img src={styleRef} alt="Style ref" className="w-full h-full object-cover" />
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      setStyleRef(null)
                    }}
                    className="absolute top-1 right-1 w-5 h-5 bg-black/60 rounded-full flex items-center justify-center hover:bg-red-500/80"
                  >
                    <X size={10} className="text-white" />
                  </button>
                </div>
              ) : (
                <div className="text-center p-2">
                  <Palette size={16} className="mx-auto text-gray-600 mb-1" />
                  <p className="text-[10px] text-gray-500">Style</p>
                </div>
              )}
            </div>
            <input
              id="nb2-style-input"
              type="file"
              accept="image/*"
              onChange={handleImageUpload(setStyleRef)}
              className="hidden"
            />

            {/* Layout Ref */}
            <div
              className={cn(
                'aspect-[4/3] rounded-lg border-2 border-dashed flex items-center justify-center cursor-pointer overflow-hidden transition-colors',
                layoutRef
                  ? 'border-[#4a7eff]/50 bg-[#2a2a2a]'
                  : 'border-white/5 bg-[#2a2a2a] hover:border-[#4a7eff]/30',
              )}
              onDragOver={(e) => e.preventDefault()}
              onDrop={handleDrop(setLayoutRef)}
              onClick={() => document.getElementById('nb2-layout-input')?.click()}
            >
              {layoutRef ? (
                <div className="relative w-full h-full">
                  <img src={layoutRef} alt="Layout ref" className="w-full h-full object-cover" />
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      setLayoutRef(null)
                    }}
                    className="absolute top-1 right-1 w-5 h-5 bg-black/60 rounded-full flex items-center justify-center hover:bg-red-500/80"
                  >
                    <X size={10} className="text-white" />
                  </button>
                </div>
              ) : (
                <div className="text-center p-2">
                  <LayoutTemplate size={16} className="mx-auto text-gray-600 mb-1" />
                  <p className="text-[10px] text-gray-500">Layout</p>
                </div>
              )}
            </div>
            <input
              id="nb2-layout-input"
              type="file"
              accept="image/*"
              onChange={handleImageUpload(setLayoutRef)}
              className="hidden"
            />
          </div>

          {/* ── Character Description ── */}
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Describe your character..."
            rows={3}
            className="w-full px-3 py-2.5 bg-zinc-800 rounded-lg text-sm text-zinc-200 placeholder-zinc-600 border border-white/5 focus:border-[#4a7eff]/30 focus:outline-none resize-none"
            disabled={isRunning}
          />

          {/* ── Gender dropdown ── */}
          <PanelSelect
            label="Gender"
            value={gender}
            options={GENDER_OPTIONS}
            onChange={(v) => setGender(v as 'neutral' | 'male' | 'female')}
          />

          {/* ── Resolution dropdown ── */}
          <PanelSelect
            label="Resolution"
            value={resolution}
            options={RESOLUTION_OPTIONS}
            onChange={(v) => setResolution(v as '512' | '1024' | '2048' | '4096')}
          />

          {/* ── Aspect Ratio dropdown ── */}
          <PanelSelect
            label="Aspect Ratio"
            value={effectiveAR}
            options={ASPECT_RATIO_OPTIONS}
            onChange={(v) => setAspectRatio(v as any)}
          />
          {stepAR && stepAR !== aspectRatio && selectedStepId && (
            <p className="text-[9px] text-amber-400/70 px-3">
              {selectedStepId} uses {stepAR} (override)
            </p>
          )}

          {/* ── Auto / Step-by-step toggle ── */}
          <PanelToggle
            label={autoMode ? 'Auto-generate' : 'Step-by-step'}
            checked={autoMode}
            onChange={(v) => setAutoMode(v)}
          />

          {/* ── Error ── */}
          {error && (
            <div className="flex items-start gap-2 p-2.5 bg-red-500/10 border border-red-500/20 rounded-lg">
              <AlertCircle size={12} className="text-red-400 mt-0.5 flex-shrink-0" />
              <p className="text-[11px] text-red-400">{error}</p>
            </div>
          )}
        </div>
      </div>

      {/* ── Fixed footer (Cinema standard) ── */}
      <div className="shrink-0 px-3 py-2 border-t border-white/5 space-y-2">
        {/* Retry */}
        {!isRunning && hasError && !isComplete && (
          <button
            onClick={generate}
            className="w-full py-2 px-3 bg-amber-500/10 border border-amber-500/30 rounded-lg text-[11px] text-amber-400 hover:bg-amber-500/20 transition-colors flex items-center justify-center gap-2"
          >
            <RotateCw size={12} /> Retry Pipeline
          </button>
        )}

        {/* Save */}
        {isComplete && result && (
          <button
            onClick={() =>
              save(() => {
                import('@/stores/useEditorStore').then(({ useEditorStore }) => {
                  useEditorStore.getState().closeCanvasOverlay()
                })
              })
            }
            disabled={!characterName.trim()}
            className="w-full py-2.5 px-4 bg-green-500/20 border border-green-500/40 rounded-lg text-xs font-medium text-green-400 hover:bg-green-500/30 transition-colors flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <Save size={12} /> Save Character
          </button>
        )}

        {/* Generate / Cancel */}
        {!stepByStepInProgress && (
          <button
            onClick={isRunning ? cancel : generate}
            disabled={!prompt.trim() || (!isRunning && !characterName.trim())}
            className={cn(
              'w-full py-2.5 px-4 rounded-lg text-xs font-medium flex items-center justify-center gap-2 transition-colors',
              isRunning
                ? 'bg-red-500/20 border border-red-500/40 text-red-400 hover:bg-red-500/30'
                : 'bg-[#4a7eff]/20 border border-[#4a7eff]/40 text-[#4a7eff] hover:bg-[#4a7eff]/30 disabled:opacity-40 disabled:cursor-not-allowed',
            )}
          >
            {isRunning ? (
              <>
                <X size={12} /> Cancel
              </>
            ) : autoMode ? (
              <>
                <Wand2 size={12} /> Generate All <CreditCostTag operation="nb2-generate" className="ml-1" />{' '}
                <span className="text-[9px] text-gray-500">x8</span>
              </>
            ) : (
              <>
                <Wand2 size={12} /> Start Generation <CreditCostTag operation="nb2-generate" className="ml-1" />
              </>
            )}
          </button>
        )}
      </div>
    </div>
  )
}
