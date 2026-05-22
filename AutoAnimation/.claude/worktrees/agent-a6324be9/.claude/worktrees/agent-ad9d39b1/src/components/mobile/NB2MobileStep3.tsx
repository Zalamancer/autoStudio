/**
 * NB2MobileStep3 — "Review & Save" step for mobile AI character wizard.
 *
 * Full image viewer with grid overlay, post-process, thumbnail strip, save button.
 * Adapted from NB2ImageViewer for inline mobile layout.
 */

import { useRef, useState, useEffect, useMemo } from 'react'
import {
  Loader2, AlertCircle, Save,
  Image as ImageIcon, Palette, LayoutTemplate,
  Minus, Plus, Eraser, PenTool, Crop,
  RefreshCw, ChevronLeft, ChevronRight,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useNB2Store, useNB2DerivedState } from '@/stores/useNB2Store'
import { useEditorStore } from '@/stores/useEditorStore'
import { isRecraftAvailable } from '@/services/recraft'
import { createEmptyGridReference, gridRefDimensionsForAR } from '@/services/gridReferenceGenerator'
import type { NB2PartType } from '@/types/nanoBanana2'

const GRID_STEPS = new Set<NB2PartType>(['hair', 'viseme-sheet', 'eye-strip', 'eyebrow-strip', 'clothing'])
const VISEME_SHEETS = ['Neutral', 'Upward', 'Downward'] as const

export function NB2MobileStep3() {
  const steps = useNB2Store((s) => s.steps)
  const selectedStepId = useNB2Store((s) => s.selectedStepId)
  const styleRef = useNB2Store((s) => s.styleRef)
  const layoutRef = useNB2Store((s) => s.layoutRef)
  const regeneratingStep = useNB2Store((s) => s.regeneratingStep)
  const gridSizes = useNB2Store((s) => s.gridSizes)
  const clothingRowRatios = useNB2Store((s) => s.clothingRowRatios)
  const characterName = useNB2Store((s) => s.characterName)
  const aspectRatio = useNB2Store((s) => s.aspectRatio)
  const visemePhase = useNB2Store((s) => s.visemePhase)
  const isRunning = useNB2Store((s) => s.isRunning)
  const result = useNB2Store((s) => s.result)
  const postProcessPhases = useNB2Store((s) => s.postProcessPhases)
  const visemeMode = useNB2Store((s) => s.visemeMode)
  const visemeSheetIndex = useNB2Store((s) => s.visemeSheetIndex)

  const setSelectedStepId = useNB2Store((s) => s.setSelectedStepId)
  const setStyleRef = useNB2Store((s) => s.setStyleRef)
  const setLayoutRef = useNB2Store((s) => s.setLayoutRef)
  const setGridSize = useNB2Store((s) => s.setGridSize)
  const setClothingRowRatios = useNB2Store((s) => s.setClothingRowRatios)
  const setVisemeMode = useNB2Store((s) => s.setVisemeMode)
  const setVisemeSheetIndex = useNB2Store((s) => s.setVisemeSheetIndex)
  const confirmVisemeNeutral = useNB2Store((s) => s.confirmVisemeNeutral)
  const processAndSave = useNB2Store((s) => s.processAndSave)
  const regenerateStep = useNB2Store((s) => s.regenerateStep)
  const save = useNB2Store((s) => s.save)

  const { selectedStep, selectedImage, selectedIsGenerating, isComplete } = useNB2DerivedState()

  const isClothingStep = selectedStepId === 'clothing'

  // Viseme part-by-part display image
  const displayImage = useMemo(() => {
    if (selectedStepId === 'viseme-sheet' && visemeMode === 'part-by-part' && result && visemePhase === 'done') {
      const sheets = [result.visemeNeutralSheet, result.visemeUpwardSheet, result.visemeDownwardSheet]
      return sheets[visemeSheetIndex] || selectedImage
    }
    return selectedImage
  }, [selectedStepId, visemeMode, result, visemePhase, visemeSheetIndex, selectedImage])

  const [recraftAvailable, setRecraftAvailable] = useState(false)
  useEffect(() => {
    isRecraftAvailable().then(setRecraftAvailable).catch(() => setRecraftAvailable(false))
  }, [])

  const imgRef = useRef<HTMLImageElement>(null)
  const [imgRect, setImgRect] = useState<{ width: number; height: number; left: number; top: number } | null>(null)

  const isGridStep = selectedStepId ? GRID_STEPS.has(selectedStepId) : false
  const currentGrid = selectedStepId ? gridSizes[selectedStepId] : undefined

  const gridRefPreview = useMemo(() => {
    if (!isGridStep || !currentGrid) return null
    const [w, h] = gridRefDimensionsForAR(aspectRatio)
    const ratios = isClothingStep ? clothingRowRatios : undefined
    return createEmptyGridReference(currentGrid.cols, currentGrid.rows, w, h, ratios)
  }, [isGridStep, currentGrid?.cols, currentGrid?.rows, selectedStepId, aspectRatio, isClothingStep, clothingRowRatios])

  useEffect(() => {
    const el = imgRef.current
    if (!el) { setImgRect(null); return }
    const update = () => {
      const parent = el.parentElement
      if (!parent) return
      const parentRect = parent.getBoundingClientRect()
      const elBounds = el.getBoundingClientRect()
      setImgRect({
        width: elBounds.width,
        height: elBounds.height,
        left: elBounds.left - parentRect.left,
        top: elBounds.top - parentRect.top,
      })
    }
    update()
    const observer = new ResizeObserver(update)
    observer.observe(el)
    el.addEventListener('load', update)
    return () => {
      observer.disconnect()
      el.removeEventListener('load', update)
    }
  }, [displayImage, selectedStepId, isGridStep, aspectRatio, gridRefPreview])

  const adjustGrid = (axis: 'cols' | 'rows', delta: number) => {
    if (!selectedStepId || !currentGrid) return
    const val = currentGrid[axis] + delta
    if (val < 1 || val > 24) return
    setGridSize(selectedStepId, { ...currentGrid, [axis]: val })
  }

  const adjustClothingRatio = (index: number, delta: number) => {
    const step = 0.05
    const newRatios = [...clothingRowRatios] as [number, number, number]
    const change = delta * step
    const neighbor = (index + 1) % 3
    const newVal = Math.round((newRatios[index] + change) * 100) / 100
    const neighborVal = Math.round((newRatios[neighbor] - change) * 100) / 100
    if (newVal < 0.05 || newVal > 0.9) return
    if (neighborVal < 0.05 || neighborVal > 0.9) return
    newRatios[index] = newVal
    newRatios[neighbor] = neighborVal
    setClothingRowRatios(newRatios)
  }

  const handleSave = () => {
    save(() => {
      useEditorStore.getState().closeCanvasOverlay()
    })
  }

  return (
    <div className="space-y-3">
      {/* Main image area */}
      <div className="relative rounded-xl overflow-hidden bg-black/30 border border-[#3a3a3a]/50" style={{ minHeight: 200 }}>
        <div className="flex items-center justify-center p-4 relative" style={{ minHeight: 200 }}>
          {displayImage ? (
            <>
              <img
                ref={imgRef}
                src={displayImage}
                alt={selectedStep?.label || 'Generated'}
                className="max-w-full max-h-[40vh] object-contain rounded-lg"
              />
              {isGridStep && currentGrid && imgRect && (
                <GridOverlay
                  cols={currentGrid.cols}
                  rows={currentGrid.rows}
                  width={imgRect.width}
                  height={imgRect.height}
                  left={imgRect.left}
                  top={imgRect.top}
                  rowRatios={isClothingStep ? clothingRowRatios : undefined}
                />
              )}
            </>
          ) : selectedIsGenerating ? (
            <div className="flex flex-col items-center gap-2 text-gray-500">
              <Loader2 size={28} className="animate-spin text-blue-400" />
              <p className="text-xs">Generating {selectedStep?.label}...</p>
            </div>
          ) : isGridStep && currentGrid && gridRefPreview ? (
            <>
              <img
                ref={imgRef}
                src={gridRefPreview}
                alt="Grid reference"
                className="max-w-full max-h-[40vh] object-contain rounded-lg"
              />
              {imgRect && (
                <GridOverlay
                  cols={currentGrid.cols}
                  rows={currentGrid.rows}
                  width={imgRect.width}
                  height={imgRect.height}
                  left={imgRect.left}
                  top={imgRect.top}
                  rowRatios={isClothingStep ? clothingRowRatios : undefined}
                />
              )}
            </>
          ) : (
            <div className="flex flex-col items-center gap-2 text-gray-600">
              <ImageIcon size={36} strokeWidth={1} />
              <p className="text-xs">Select a step below to preview</p>
            </div>
          )}

          {/* Step label badge */}
          {selectedStep && (displayImage || isGridStep) && (
            <div className="absolute top-2 left-2 px-2 py-0.5 rounded-lg bg-black/50 backdrop-blur-sm text-[10px] text-gray-300 font-medium">
              {selectedStep.label}
            </div>
          )}

          {/* Regenerate */}
          {selectedStep?.status === 'complete' && selectedStepId && selectedStepId !== 'concept' && !selectedIsGenerating && !isRunning && !regeneratingStep && (
            <button
              onClick={() => regenerateStep(selectedStepId)}
              className="absolute top-2 right-2 px-2 py-1 rounded-lg bg-black/60 backdrop-blur-sm border border-white/20 text-[10px] text-gray-300 flex items-center gap-1"
            >
              <RefreshCw size={10} />
              Redo
            </button>
          )}
        </div>

        {/* Grid size controls */}
        {isGridStep && currentGrid && (
          <div className="flex items-center justify-center gap-3 px-3 py-2 border-t border-[#3a3a3a]/50 bg-black/20">
            <div className="flex items-center gap-1">
              <span className="text-[10px] text-gray-500">Cols</span>
              <button onClick={() => adjustGrid('cols', -1)} className="w-6 h-6 rounded-lg flex items-center justify-center text-gray-400 hover:text-white hover:bg-white/10">
                <Minus size={12} />
              </button>
              <span className="text-xs text-white font-mono w-4 text-center">{currentGrid.cols}</span>
              <button onClick={() => adjustGrid('cols', 1)} className="w-6 h-6 rounded-lg flex items-center justify-center text-gray-400 hover:text-white hover:bg-white/10">
                <Plus size={12} />
              </button>
            </div>
            <span className="text-[10px] text-gray-500">x</span>
            <div className="flex items-center gap-1">
              <span className="text-[10px] text-gray-500">Rows</span>
              <button onClick={() => adjustGrid('rows', -1)} className="w-6 h-6 rounded-lg flex items-center justify-center text-gray-400 hover:text-white hover:bg-white/10">
                <Minus size={12} />
              </button>
              <span className="text-xs text-white font-mono w-4 text-center">{currentGrid.rows}</span>
              <button onClick={() => adjustGrid('rows', 1)} className="w-6 h-6 rounded-lg flex items-center justify-center text-gray-400 hover:text-white hover:bg-white/10">
                <Plus size={12} />
              </button>
            </div>
          </div>
        )}

        {/* Clothing row ratios */}
        {isClothingStep && (
          <div className="flex items-center justify-center gap-2 px-3 py-2 border-t border-[#3a3a3a]/50 bg-black/20">
            {(['Shirt', 'Pants', 'Shoes'] as const).map((label, i) => (
              <div key={label} className="flex items-center gap-0.5">
                <span className="text-[9px] text-gray-500">{label}</span>
                <button onClick={() => adjustClothingRatio(i, -1)} className="w-5 h-5 rounded flex items-center justify-center text-gray-400 hover:text-white">
                  <Minus size={8} />
                </button>
                <span className="text-[10px] text-white font-mono w-7 text-center">{Math.round(clothingRowRatios[i] * 100)}%</span>
                <button onClick={() => adjustClothingRatio(i, 1)} className="w-5 h-5 rounded flex items-center justify-center text-gray-400 hover:text-white">
                  <Plus size={8} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Viseme mode toggle */}
      {selectedStepId === 'viseme-sheet' && !selectedIsGenerating && (!visemePhase || visemePhase === 'confirming') && (
        <div className="flex rounded-xl overflow-hidden border border-white/20 bg-black/40">
          <button
            onClick={() => setVisemeMode('all-at-once')}
            className={cn(
              'flex-1 px-3 py-2 text-[11px] font-medium transition-colors',
              visemeMode === 'all-at-once' ? 'bg-blue-500/30 text-blue-300' : 'text-gray-400',
            )}
          >
            All 36 at once
          </button>
          <button
            onClick={() => setVisemeMode('part-by-part')}
            className={cn(
              'flex-1 px-3 py-2 text-[11px] font-medium transition-colors border-l border-white/20',
              visemeMode === 'part-by-part' ? 'bg-blue-500/30 text-blue-300' : 'text-gray-400',
            )}
          >
            Part by part
          </button>
        </div>
      )}

      {/* Viseme sheet nav (part-by-part done) */}
      {selectedStepId === 'viseme-sheet' && visemeMode === 'part-by-part' && visemePhase === 'done' && displayImage && (
        <div className="flex items-center justify-center gap-3">
          <button
            onClick={() => setVisemeSheetIndex((visemeSheetIndex + 2) % 3)}
            className="w-8 h-8 rounded-full bg-black/40 border border-white/20 flex items-center justify-center text-gray-300"
          >
            <ChevronLeft size={16} />
          </button>
          <span className="text-xs text-gray-400">{VISEME_SHEETS[visemeSheetIndex]} ({visemeSheetIndex + 1}/3)</span>
          <button
            onClick={() => setVisemeSheetIndex((visemeSheetIndex + 1) % 3)}
            className="w-8 h-8 rounded-full bg-black/40 border border-white/20 flex items-center justify-center text-gray-300"
          >
            <ChevronRight size={16} />
          </button>
        </div>
      )}

      {/* Confirm viseme neutral */}
      {selectedStepId === 'viseme-sheet' && visemeMode === 'part-by-part' && visemePhase === 'confirming' && displayImage && !selectedIsGenerating && (
        <button
          onClick={confirmVisemeNeutral}
          disabled={isRunning}
          className="w-full px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-medium transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {isRunning ? (
            <><Loader2 size={14} className="animate-spin" /> Generating Curvatures...</>
          ) : (
            'Confirm & Generate Curvatures'
          )}
        </button>
      )}

      {/* Use as Reference buttons */}
      {displayImage && (
        <div className="flex gap-2">
          <button
            onClick={() => setStyleRef(displayImage)}
            className={cn(
              'flex-1 py-2 rounded-xl text-[11px] font-medium flex items-center justify-center gap-1.5 transition-colors border',
              styleRef === displayImage
                ? 'bg-violet-500/15 border-violet-500/30 text-violet-400'
                : 'bg-white/[0.03] border-white/[0.06] text-gray-400',
            )}
          >
            <Palette size={12} />
            Style Ref
          </button>
          <button
            onClick={() => setLayoutRef(displayImage)}
            className={cn(
              'flex-1 py-2 rounded-xl text-[11px] font-medium flex items-center justify-center gap-1.5 transition-colors border',
              layoutRef === displayImage
                ? 'bg-violet-500/15 border-violet-500/30 text-violet-400'
                : 'bg-white/[0.03] border-white/[0.06] text-gray-400',
            )}
          >
            <LayoutTemplate size={12} />
            Layout Ref
          </button>
        </div>
      )}

      {/* Post-process buttons */}
      {displayImage && selectedStep?.status === 'complete' && selectedStepId !== 'concept' && !selectedIsGenerating && (() => {
        const currentPhase = selectedStepId ? postProcessPhases[selectedStepId] : undefined
        return (
          <div>
            {currentPhase ? (
              <PostProcessProgressBar phase={currentPhase} />
            ) : (
              <div className="flex gap-2">
                <button
                  onClick={() => processAndSave('remove-bg')}
                  className="flex-1 py-2 rounded-xl text-[11px] font-medium flex items-center justify-center gap-1.5 border bg-white/[0.03] border-white/[0.06] text-gray-400"
                >
                  <Eraser size={12} />
                  Remove BG
                </button>
                <button
                  onClick={() => processAndSave('vectorize')}
                  disabled={!recraftAvailable}
                  className={cn(
                    'flex-1 py-2 rounded-xl text-[11px] font-medium flex items-center justify-center gap-1.5 border',
                    recraftAvailable
                      ? 'bg-white/[0.03] border-white/[0.06] text-gray-400'
                      : 'bg-white/[0.01] border-white/[0.03] text-gray-600 cursor-not-allowed',
                  )}
                >
                  <PenTool size={12} />
                  Vectorize
                </button>
                <button
                  onClick={() => processAndSave('crop')}
                  className="flex-1 py-2 rounded-xl text-[11px] font-medium flex items-center justify-center gap-1.5 border bg-emerald-500/10 border-emerald-500/20 text-emerald-400"
                >
                  {isGridStep ? <Crop size={12} /> : <Save size={12} />}
                  {isGridStep ? 'Crop' : 'Save'}
                </button>
              </div>
            )}
          </div>
        )
      })()}

      {/* Thumbnail strip */}
      {steps.length > 0 && (
        <div className="border-t border-[#3a3a3a]/50 pt-3">
          <div className="flex gap-2 overflow-x-auto pb-1">
            {steps.map((step) => {
              const isActive = selectedStepId === step.id
              const hasImage = step.status === 'complete' && step.result
              const generating = step.status === 'generating' || regeneratingStep === step.id
              const isGrid = GRID_STEPS.has(step.id)
              const canSelect = hasImage || isGrid

              return (
                <button
                  key={step.id}
                  onClick={() => canSelect && setSelectedStepId(step.id)}
                  className={cn(
                    'shrink-0 w-14 h-14 rounded-xl border-2 overflow-hidden transition-all flex items-center justify-center',
                    isActive
                      ? 'border-[#4a7eff] shadow-lg shadow-[#4a7eff]/20'
                      : canSelect
                        ? 'border-[#3a3a3a] cursor-pointer'
                        : 'border-[#2a2a2a] cursor-default',
                    !hasImage && !generating && 'bg-[#1a1a1a]',
                  )}
                >
                  {hasImage && step.result ? (
                    <img src={step.result} alt={step.label} className="w-full h-full object-cover" />
                  ) : generating ? (
                    <Loader2 size={14} className="animate-spin text-blue-400" />
                  ) : step.status === 'error' ? (
                    <AlertCircle size={14} className="text-red-500" />
                  ) : (
                    <span className="text-[8px] text-gray-600 text-center leading-tight px-0.5">{step.label.split(' ')[0]}</span>
                  )}
                </button>
              )
            })}
          </div>
        </div>
      )}

      {/* Save Character */}
      {isComplete && result && (
        <button
          onClick={handleSave}
          disabled={!characterName.trim()}
          className="w-full py-3 px-4 bg-green-500/20 border border-green-500/40 rounded-xl text-sm font-medium text-green-400 hover:bg-green-500/30 transition-colors flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <Save size={14} /> Save Character
        </button>
      )}
    </div>
  )
}

// ── Grid Overlay ──────────────────────────────────────────────────

function GridOverlay({
  cols, rows, width, height, left, top, rowRatios,
}: {
  cols: number; rows: number; width: number; height: number; left: number; top: number; rowRatios?: readonly number[]
}) {
  const cellW = width / cols
  const rowYPositions: number[] = []
  if (rowRatios && rowRatios.length === rows) {
    let y = 0
    for (let i = 0; i < rows - 1; i++) {
      y += height * rowRatios[i]
      rowYPositions.push(y)
    }
  } else {
    const cellH = height / rows
    for (let i = 0; i < rows - 1; i++) {
      rowYPositions.push((i + 1) * cellH)
    }
  }

  return (
    <div className="absolute pointer-events-none" style={{ left, top, width, height }}>
      <svg width={width} height={height} className="absolute inset-0">
        {Array.from({ length: cols - 1 }, (_, i) => (
          <line
            key={`v-${i}`}
            x1={(i + 1) * cellW} y1={0} x2={(i + 1) * cellW} y2={height}
            stroke="#ef4444" strokeWidth={1.5} strokeDasharray="6 4" opacity={0.7}
          />
        ))}
        {rowYPositions.map((y, i) => (
          <line
            key={`h-${i}`}
            x1={0} y1={y} x2={width} y2={y}
            stroke="#ef4444" strokeWidth={1.5} strokeDasharray="6 4" opacity={0.7}
          />
        ))}
      </svg>
    </div>
  )
}

// ── Post-Process Progress Bar ─────────────────────────────────────

const PIPELINE_STEPS = [
  { key: 'removing-bg', label: 'Remove BG' },
  { key: 'vectorizing', label: 'Vectorize' },
  { key: 'cropping', label: 'Crop & Save' },
] as const

function PostProcessProgressBar({ phase }: { phase: 'removing-bg' | 'vectorizing' | 'cropping' }) {
  const activeIdx = PIPELINE_STEPS.findIndex((s) => s.key === phase)
  return (
    <div className="py-2 px-3 rounded-xl bg-white/[0.03] border border-white/[0.06]">
      <div className="flex items-center gap-1 mb-2">
        {PIPELINE_STEPS.map((step, i) => {
          const isDone = i < activeIdx
          const isActive = i === activeIdx
          return (
            <div key={step.key} className="flex items-center gap-1 flex-1">
              {i > 0 && <div className={cn('h-px flex-1', isDone ? 'bg-emerald-500' : 'bg-white/10')} />}
              <div className="flex items-center gap-1">
                {isDone ? (
                  <div className="w-3.5 h-3.5 rounded-full bg-emerald-500 flex items-center justify-center">
                    <span className="text-[8px] text-white">✓</span>
                  </div>
                ) : isActive ? (
                  <Loader2 size={14} className="animate-spin text-blue-400" />
                ) : (
                  <div className="w-3.5 h-3.5 rounded-full border border-white/20" />
                )}
                <span className={cn('text-[10px] font-medium', isDone ? 'text-emerald-400' : isActive ? 'text-blue-400' : 'text-gray-600')}>
                  {step.label}
                </span>
              </div>
              {i < PIPELINE_STEPS.length - 1 && <div className={cn('h-px flex-1', isDone ? 'bg-emerald-500' : 'bg-white/10')} />}
            </div>
          )
        })}
      </div>
      <div className="h-1 rounded-full bg-white/10 overflow-hidden">
        <div className="h-full rounded-full bg-blue-500 transition-all duration-500" style={{ width: `${((activeIdx + 0.5) / PIPELINE_STEPS.length) * 100}%` }} />
      </div>
    </div>
  )
}
