/**
 * NB2ImageViewer — Center overlay image viewer for AI character generation.
 *
 * Extracted from NanoBanana2Panel right side (image area only).
 * Reads useNB2Store. Contains:
 *   - Large image preview (selected step's result)
 *   - Red dashed grid overlay with scissor icons (for grid-based steps)
 *   - Grid size controls (cols × rows)
 *   - Loading spinner when generating
 *   - Step label badge overlay
 *   - "Use as Style Ref" / "Use as Layout Ref" action buttons
 *   - Thumbnail strip at bottom
 */

import { useRef, useState, useEffect, useMemo, memo } from 'react'
import {
  Loader2,
  AlertCircle,
  Scissors,
  Image as ImageIcon,
  Palette,
  LayoutTemplate,
  Minus,
  Plus,
  Eraser,
  PenTool,
  Save,
  Crop,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  X,
  Trash2,
  ArrowRight,
  SkipForward,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useNB2Store, useNB2DerivedState, STEP_AR_OVERRIDES } from '@/stores/useNB2Store'
import { isRecraftAvailable } from '@/services/recraft'
import { createEmptyGridReference, gridRefDimensionsForAR } from '@/services/gridReferenceGenerator'
import type { NB2PartType } from '@/types/nanoBanana2'
import { getVisemeCurvatureAxis } from '@/services/nb2Prompts'

// Steps that have grid-based output
const GRID_STEPS = new Set<NB2PartType>(['hair', 'viseme-sheet', 'eye-strip', 'eyebrow-strip', 'clothing'])

const VISEME_NAMES = ['Rest', 'Aa', 'Ee', 'Oh', 'Oo', 'FV', 'MBP', 'DTL', 'ChR']
const CURVATURE_NAMES = ['Neutral', 'Upward', 'Downward']

export const NB2ImageViewer = memo(function NB2ImageViewer() {
  const steps = useNB2Store((s) => s.steps)
  const selectedStepId = useNB2Store((s) => s.selectedStepId)
  const styleRef = useNB2Store((s) => s.styleRef)
  const layoutRef = useNB2Store((s) => s.layoutRef)
  const regeneratingStep = useNB2Store((s) => s.regeneratingStep)
  const gridSizes = useNB2Store((s) => s.gridSizes)
  const clothingRowRatios = useNB2Store((s) => s.clothingRowRatios)
  const setSelectedStepId = useNB2Store((s) => s.setSelectedStepId)
  const setEditingPromptStep = useNB2Store((s) => s.setEditingPromptStep)
  const setStyleRef = useNB2Store((s) => s.setStyleRef)
  const setLayoutRef = useNB2Store((s) => s.setLayoutRef)
  const setGridSize = useNB2Store((s) => s.setGridSize)
  const setClothingRowRatios = useNB2Store((s) => s.setClothingRowRatios)

  const globalAspectRatio = useNB2Store((s) => s.aspectRatio)
  const visemePhase = useNB2Store((s) => s.visemePhase)
  const isRunning = useNB2Store((s) => s.isRunning)
  const confirmVisemeNeutral = useNB2Store((s) => s.confirmVisemeNeutral)
  const isClothingStep = selectedStepId === 'clothing'

  const postProcessPhases = useNB2Store((s) => s.postProcessPhases)
  const processAndSave = useNB2Store((s) => s.processAndSave)
  const visemeMode = useNB2Store((s) => s.visemeMode)
  const setVisemeMode = useNB2Store((s) => s.setVisemeMode)
  const regenerateStep = useNB2Store((s) => s.regenerateStep)
  const cancel = useNB2Store((s) => s.cancel)
  const clearStepResult = useNB2Store((s) => s.clearStepResult)
  const result = useNB2Store((s) => s.result)
  const visemeSheetIndex = useNB2Store((s) => s.visemeSheetIndex)
  const setVisemeSheetIndex = useNB2Store((s) => s.setVisemeSheetIndex)
  const continueStep = useNB2Store((s) => s.continueStep)
  const skipStep = useNB2Store((s) => s.skipStep)

  const { selectedStep, selectedImage, selectedIsGenerating, nextPendingStepId, completedCount, hasError } =
    useNB2DerivedState()

  // For part-by-part viseme: show the correct curvature sheet
  const VISEME_SHEETS = ['Neutral', 'Upward', 'Downward'] as const
  const displayImage = useMemo(() => {
    if (selectedStepId === 'viseme-sheet' && visemeMode === 'part-by-part' && result && visemePhase === 'done') {
      const sheets = [result.visemeNeutralSheet, result.visemeUpwardSheet, result.visemeDownwardSheet]
      return sheets[visemeSheetIndex] || selectedImage
    }
    return selectedImage
  }, [selectedStepId, visemeMode, result, visemePhase, visemeSheetIndex, selectedImage])

  // Check if Recraft (vectorize) is available
  const [recraftAvailable, setRecraftAvailable] = useState(false)
  useEffect(() => {
    isRecraftAvailable()
      .then(setRecraftAvailable)
      .catch(() => setRecraftAvailable(false))
  }, [])

  const imgRef = useRef<HTMLImageElement>(null)
  const [imgRect, setImgRect] = useState<{ width: number; height: number; left: number; top: number } | null>(null)

  const isGridStep = selectedStepId ? GRID_STEPS.has(selectedStepId) : false
  const currentGrid = selectedStepId ? gridSizes[selectedStepId] : undefined

  // Compute grid labels based on step type
  const { colLabels, rowLabels } = useMemo(() => {
    if (!selectedStepId || !currentGrid) return { colLabels: undefined, rowLabels: undefined }

    if (selectedStepId === 'viseme-sheet') {
      if (visemeMode === 'all-at-once') {
        const axis = getVisemeCurvatureAxis(currentGrid)
        if (axis === 'rows') {
          // rows = curvatures, cols = visemes
          return { colLabels: VISEME_NAMES, rowLabels: CURVATURE_NAMES }
        } else {
          // cols = curvatures, rows = visemes
          return { colLabels: CURVATURE_NAMES, rowLabels: VISEME_NAMES }
        }
      } else {
        // Part-by-part: single curvature, cols × rows of visemes
        // Viseme names flow left-to-right, top-to-bottom
        const total = currentGrid.cols * currentGrid.rows
        const labels = VISEME_NAMES.slice(0, total)
        // Show as column labels (one per column per row)
        return { colLabels: labels.slice(0, currentGrid.cols), rowLabels: undefined }
      }
    }

    return { colLabels: undefined, rowLabels: undefined }
  }, [selectedStepId, currentGrid, visemeMode])

  // Effective AR for the selected step (accounts for per-step overrides like clothing=3:2, eye/eyebrow=16:9)
  const effectiveAR = useMemo(() => {
    if (selectedStepId === 'viseme-sheet' && visemeMode === 'all-at-once') return '9:16'
    const stepOverride = selectedStepId ? STEP_AR_OVERRIDES[selectedStepId] : undefined
    return stepOverride ?? globalAspectRatio
  }, [selectedStepId, visemeMode, globalAspectRatio])

  // Generate the actual grid reference image that will be sent to Gemini
  // The whole grid matches the aspect ratio we request from Gemini
  const gridRefPreview = useMemo(() => {
    if (!isGridStep || !currentGrid) return null
    const [w, h] = gridRefDimensionsForAR(effectiveAR)
    const ratios = isClothingStep ? clothingRowRatios : undefined
    // No labels baked into the grid image — labels are shown via the GridOverlay component only
    return createEmptyGridReference(currentGrid.cols, currentGrid.rows, w, h, ratios)
  }, [isGridStep, currentGrid?.cols, currentGrid?.rows, selectedStepId, effectiveAR, isClothingStep, clothingRowRatios])

  // Compute preview box dimensions from effective aspect ratio (fit within 320px max)
  const MAX_PREVIEW = 320
  const [arW, arH] = (effectiveAR || '1:1').split(':').map(Number)
  const arRatio = arW / arH
  const previewW = arRatio >= 1 ? MAX_PREVIEW : Math.round(MAX_PREVIEW * arRatio)
  const previewH = arRatio >= 1 ? Math.round(MAX_PREVIEW / arRatio) : MAX_PREVIEW

  // Track rendered image dimensions for overlay positioning
  useEffect(() => {
    const el = imgRef.current
    if (!el) {
      setImgRect(null)
      return
    }

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
    if (el instanceof HTMLImageElement) {
      el.addEventListener('load', update)
    }
    return () => {
      observer.disconnect()
      if (el instanceof HTMLImageElement) {
        el.removeEventListener('load', update)
      }
    }
  }, [displayImage, selectedStepId, isGridStep, effectiveAR, gridRefPreview])

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
    // Steal from the next neighbor only (wraps: 0→1, 1→2, 2→0)
    const neighbor = (index + 1) % 3
    const newVal = Math.round((newRatios[index] + change) * 100) / 100
    const neighborVal = Math.round((newRatios[neighbor] - change) * 100) / 100
    if (newVal < 0.05 || newVal > 0.9) return
    if (neighborVal < 0.05 || neighborVal > 0.9) return
    newRatios[index] = newVal
    newRatios[neighbor] = neighborVal
    setClothingRowRatios(newRatios)
  }

  const totalSteps = steps.length
  const pct = totalSteps > 0 ? (completedCount / totalSteps) * 100 : 0

  return (
    <div className="flex-1 flex flex-col min-w-0 bg-black/20 h-full">
      {/* Pipeline progress bar */}
      {totalSteps > 0 && (
        <div className="shrink-0 h-1 bg-[#1a1a1a]">
          <div
            className={cn(
              'h-full transition-all duration-500 ease-out',
              hasError ? 'bg-red-500' : pct >= 100 ? 'bg-green-500' : 'bg-accent',
            )}
            style={{ width: `${pct}%` }}
          />
        </div>
      )}

      {/* Main image area */}
      <div className="flex-1 flex items-center justify-center p-6 overflow-hidden relative">
        {displayImage ? (
          <>
            <img
              ref={imgRef}
              src={displayImage}
              alt={selectedStep?.label || 'Generated'}
              className="max-w-full max-h-full object-contain rounded-xl shadow-lg"
            />

            {/* Grid overlay on image */}
            {isGridStep && currentGrid && imgRect && (
              <GridOverlay
                cols={currentGrid.cols}
                rows={currentGrid.rows}
                width={imgRect.width}
                height={imgRect.height}
                left={imgRect.left}
                top={imgRect.top}
                rowRatios={isClothingStep ? clothingRowRatios : undefined}
                colLabels={colLabels}
                rowLabels={rowLabels}
              />
            )}
          </>
        ) : selectedIsGenerating ? (
          <div className="flex flex-col items-center gap-3 text-gray-500">
            <Loader2 size={32} className="animate-spin text-blue-400" />
            <p className="text-sm">Generating {selectedStep?.label}...</p>
            <button
              onClick={cancel}
              className="px-3 py-1.5 rounded-lg bg-red-500/20 border border-red-500/30 text-red-400 hover:bg-red-500/30 text-[11px] font-medium flex items-center gap-1.5 transition-colors"
            >
              <X size={12} />
              Cancel
            </button>
          </div>
        ) : isGridStep && currentGrid && gridRefPreview ? (
          /* Grid reference preview — shows the actual image sent to Gemini */
          <>
            <img
              ref={imgRef}
              src={gridRefPreview}
              alt="Grid reference (sent to AI)"
              className="max-w-full max-h-full object-contain rounded-xl shadow-lg"
              style={{ maxWidth: previewW, maxHeight: previewH }}
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
                colLabels={colLabels}
                rowLabels={rowLabels}
              />
            )}
            <p className="absolute bottom-8 text-[11px] text-gray-600">
              {currentGrid.cols} × {currentGrid.rows} = {currentGrid.cols * currentGrid.rows} cells — this grid is sent
              to AI as layout reference
            </p>
          </>
        ) : (
          <div className="flex flex-col items-center gap-3 text-gray-600">
            <ImageIcon size={48} strokeWidth={1} />
            <p className="text-sm">Generated images will appear here</p>
            <p className="text-[11px] text-gray-700">Fill in the form and click Generate</p>
          </div>
        )}

        {/* Step label badge */}
        {selectedStep && (displayImage || isGridStep) && (
          <div className="absolute top-4 left-4 px-2.5 py-1 rounded-lg bg-black/50 backdrop-blur-sm text-[11px] text-gray-300 font-medium">
            {selectedStep.label}
          </div>
        )}

        {/* Grid size controls — visible for grid steps regardless of image */}
        {isGridStep && currentGrid && (
          <div className="absolute top-4 right-4 flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-black/60 backdrop-blur-sm">
            {/* Cols */}
            <div className="flex items-center gap-1">
              <span className="text-[10px] text-gray-400 mr-0.5">C</span>
              <button
                onClick={() => adjustGrid('cols', -1)}
                className="w-5 h-5 rounded flex items-center justify-center text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
              >
                <Minus size={10} />
              </button>
              <span className="text-[11px] text-white font-mono w-4 text-center">{currentGrid.cols}</span>
              <button
                onClick={() => adjustGrid('cols', 1)}
                className="w-5 h-5 rounded flex items-center justify-center text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
              >
                <Plus size={10} />
              </button>
            </div>
            <span className="text-[10px] text-gray-500">×</span>
            {/* Rows */}
            <div className="flex items-center gap-1">
              <span className="text-[10px] text-gray-400 mr-0.5">R</span>
              <button
                onClick={() => adjustGrid('rows', -1)}
                className="w-5 h-5 rounded flex items-center justify-center text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
              >
                <Minus size={10} />
              </button>
              <span className="text-[11px] text-white font-mono w-4 text-center">{currentGrid.rows}</span>
              <button
                onClick={() => adjustGrid('rows', 1)}
                className="w-5 h-5 rounded flex items-center justify-center text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
              >
                <Plus size={10} />
              </button>
            </div>
          </div>
        )}

        {/* Clothing row ratio controls */}
        {isClothingStep && (
          <div className="absolute bottom-4 right-4 flex flex-col gap-1 px-2.5 py-1.5 rounded-lg bg-black/60 backdrop-blur-sm">
            {(['Shirt', 'Pants', 'Shoes'] as const).map((label, i) => (
              <div key={label} className="flex items-center gap-1">
                <span className="text-[9px] text-gray-400 w-8">{label}</span>
                <button
                  onClick={() => adjustClothingRatio(i, -1)}
                  className="w-4 h-4 rounded flex items-center justify-center text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
                >
                  <Minus size={8} />
                </button>
                <span className="text-[10px] text-white font-mono w-7 text-center">
                  {Math.round(clothingRowRatios[i] * 100)}%
                </span>
                <button
                  onClick={() => adjustClothingRatio(i, 1)}
                  className="w-4 h-4 rounded flex items-center justify-center text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
                >
                  <Plus size={8} />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Viseme mode toggle — shown on main frame when viseme step is active */}
        {selectedStepId === 'viseme-sheet' &&
          !selectedIsGenerating &&
          (!visemePhase || visemePhase === 'confirming') && (
            <div className="absolute bottom-16 left-1/2 -translate-x-1/2">
              <div className="flex rounded-lg overflow-hidden border border-white/20 bg-black/60 backdrop-blur-sm">
                <button
                  onClick={() => setVisemeMode('all-at-once')}
                  className={cn(
                    'px-4 py-2 text-[11px] font-medium transition-colors',
                    visemeMode === 'all-at-once'
                      ? 'bg-blue-500/30 text-blue-300'
                      : 'text-gray-400 hover:text-white hover:bg-white/10',
                  )}
                >
                  All 27 at once
                </button>
                <button
                  onClick={() => setVisemeMode('part-by-part')}
                  className={cn(
                    'px-4 py-2 text-[11px] font-medium transition-colors border-l border-white/20',
                    visemeMode === 'part-by-part'
                      ? 'bg-blue-500/30 text-blue-300'
                      : 'text-gray-400 hover:text-white hover:bg-white/10',
                  )}
                >
                  Part by part
                </button>
              </div>
            </div>
          )}

        {/* Viseme phase indicator */}
        {selectedStepId === 'viseme-sheet' &&
          visemePhase &&
          visemePhase !== 'neutral' &&
          visemePhase !== 'confirming' && (
            <div className="absolute bottom-4 left-4 px-2.5 py-1 rounded-lg bg-black/50 backdrop-blur-sm text-[10px] text-gray-400">
              {visemePhase === 'curvatures' && 'Generating upward & downward curvatures...'}
              {visemePhase === 'done' && visemeMode === 'all-at-once' && 'All 27 visemes generated in one sheet'}
              {visemePhase === 'done' &&
                visemeMode === 'part-by-part' &&
                `${VISEME_SHEETS[visemeSheetIndex]} curvature (${visemeSheetIndex + 1}/3)`}
            </div>
          )}

        {/* Viseme sheet navigation arrows (part-by-part mode, all 3 curvatures done) */}
        {selectedStepId === 'viseme-sheet' &&
          visemeMode === 'part-by-part' &&
          visemePhase === 'done' &&
          displayImage && (
            <>
              <button
                onClick={() => setVisemeSheetIndex((visemeSheetIndex + 2) % 3)}
                className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/60 backdrop-blur-sm border border-white/20 flex items-center justify-center text-gray-300 hover:text-white hover:bg-black/80 transition-colors"
              >
                <ChevronLeft size={16} />
              </button>
              <button
                onClick={() => setVisemeSheetIndex((visemeSheetIndex + 1) % 3)}
                className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/60 backdrop-blur-sm border border-white/20 flex items-center justify-center text-gray-300 hover:text-white hover:bg-black/80 transition-colors"
              >
                <ChevronRight size={16} />
              </button>
            </>
          )}

        {/* Regenerate + Delete buttons */}
        {selectedStep?.status === 'complete' &&
          selectedStepId &&
          selectedStepId !== 'concept' &&
          !selectedIsGenerating &&
          !isRunning &&
          !regeneratingStep && (
            <div
              className="absolute right-4 flex items-center gap-1.5"
              style={{ top: isGridStep && currentGrid ? '3rem' : '1rem' }}
            >
              <button
                onClick={() => regenerateStep(selectedStepId)}
                className="px-2.5 py-1.5 rounded-lg bg-black/60 backdrop-blur-sm border border-white/20 text-[11px] text-gray-300 hover:text-white hover:bg-black/80 transition-colors flex items-center gap-1.5"
              >
                <RefreshCw size={12} />
                Regenerate
              </button>
              <button
                onClick={() => clearStepResult(selectedStepId)}
                className="px-2 py-1.5 rounded-lg bg-black/60 backdrop-blur-sm border border-red-500/30 text-[11px] text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-colors flex items-center gap-1.5"
                title="Delete result and show grid"
              >
                <Trash2 size={12} />
              </button>
            </div>
          )}
      </div>

      {/* Action bar — Use as Reference */}
      {displayImage && (
        <div className="shrink-0 px-6 pb-3 flex gap-2">
          <button
            onClick={() => setStyleRef(displayImage)}
            className={cn(
              'flex-1 py-1.5 rounded-lg text-[11px] font-medium flex items-center justify-center gap-1.5 transition-colors border',
              styleRef === displayImage
                ? 'bg-violet-500/15 border-violet-500/30 text-violet-400'
                : 'bg-white/[0.03] border-white/[0.06] text-gray-400 hover:text-white hover:border-white/10',
            )}
          >
            <Palette size={12} />
            Use as Style Ref
          </button>
          <button
            onClick={() => setLayoutRef(displayImage)}
            className={cn(
              'flex-1 py-1.5 rounded-lg text-[11px] font-medium flex items-center justify-center gap-1.5 transition-colors border',
              layoutRef === displayImage
                ? 'bg-violet-500/15 border-violet-500/30 text-violet-400'
                : 'bg-white/[0.03] border-white/[0.06] text-gray-400 hover:text-white hover:border-white/10',
            )}
          >
            <LayoutTemplate size={12} />
            Use as Layout Ref
          </button>
        </div>
      )}

      {/* Confirm & Generate Curvatures — only for part-by-part after neutral is done */}
      {selectedStepId === 'viseme-sheet' &&
        visemeMode === 'part-by-part' &&
        visemePhase === 'confirming' &&
        displayImage &&
        !selectedIsGenerating && (
          <div className="shrink-0 px-6 pb-3">
            <button
              onClick={confirmVisemeNeutral}
              disabled={isRunning}
              className="w-full px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] font-medium transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {isRunning ? (
                <>
                  <Loader2 size={14} className="animate-spin" />
                  Generating Curvatures...
                </>
              ) : (
                'Confirm & Generate Curvatures'
              )}
            </button>
          </div>
        )}

      {/* Post-processing buttons + progress bar */}
      {displayImage &&
        selectedStep?.status === 'complete' &&
        selectedStepId !== 'concept' &&
        !selectedIsGenerating &&
        (() => {
          const currentPhase = selectedStepId ? postProcessPhases[selectedStepId] : undefined
          return (
            <div className="shrink-0 px-6 pb-3">
              {currentPhase ? (
                <div className="space-y-2">
                  <PostProcessProgressBar phase={currentPhase} />
                </div>
              ) : (
                <div className="flex gap-2">
                  <button
                    onClick={() => processAndSave('remove-bg')}
                    className="flex-1 py-1.5 rounded-lg text-[11px] font-medium flex items-center justify-center gap-1.5 transition-colors border bg-white/[0.03] border-white/[0.06] text-gray-400 hover:text-white hover:border-white/10"
                  >
                    <Eraser size={12} />
                    Remove BG
                  </button>
                  <button
                    onClick={() => processAndSave('vectorize')}
                    disabled={!recraftAvailable}
                    className={cn(
                      'flex-1 py-1.5 rounded-lg text-[11px] font-medium flex items-center justify-center gap-1.5 transition-colors border',
                      recraftAvailable
                        ? 'bg-white/[0.03] border-white/[0.06] text-gray-400 hover:text-white hover:border-white/10'
                        : 'bg-white/[0.01] border-white/[0.03] text-gray-600 cursor-not-allowed',
                    )}
                  >
                    <PenTool size={12} />
                    Vectorize
                  </button>
                  <button
                    onClick={() => processAndSave('crop')}
                    className="flex-1 py-1.5 rounded-lg text-[11px] font-medium flex items-center justify-center gap-1.5 transition-colors border bg-emerald-500/10 border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/20 hover:border-emerald-500/30"
                  >
                    {isGridStep ? <Crop size={12} /> : <Save size={12} />}
                    {isGridStep ? 'Crop & Save' : 'Save'}
                  </button>
                </div>
              )}
            </div>
          )
        })()}

      {/* Thumbnail strip + NEXT button */}
      {steps.length > 0 && (
        <div className="shrink-0 border-t border-white/[0.06] px-4 py-3">
          <div className="flex gap-2 items-center">
            <div className="flex gap-2 overflow-x-auto flex-1">
              {steps.map((step) => {
                const isActive = selectedStepId === step.id
                const hasImage = step.status === 'complete' && step.result
                const generating = step.status === 'generating' || regeneratingStep === step.id

                return (
                  <button
                    key={step.id}
                    onClick={() => {
                      setSelectedStepId(step.id)
                      setEditingPromptStep(step.id)
                    }}
                    className={cn(
                      'shrink-0 w-14 h-14 rounded-lg border-2 overflow-hidden transition-all flex items-center justify-center cursor-pointer',
                      isActive
                        ? 'border-accent shadow-lg shadow-accent/20'
                        : 'border-panel-border hover:border-accent/50',
                      !hasImage && !generating && 'bg-[#1a1a1a]',
                    )}
                  >
                    {hasImage && step.result ? (
                      <img src={step.result} alt={step.label} className="w-full h-full object-cover" />
                    ) : generating ? (
                      <Loader2 size={14} className="animate-spin text-blue-400" />
                    ) : step.status === 'error' ? (
                      <AlertCircle size={14} className="text-red-500" />
                    ) : step.status === 'skipped' ? (
                      <SkipForward size={14} className="text-zinc-500" />
                    ) : (
                      <span className="text-[9px] text-gray-600 text-center leading-tight px-0.5">
                        {step.label.split(' ')[0]}
                      </span>
                    )}
                  </button>
                )
              })}
            </div>

            {/* SKIP + NEXT buttons — skip or generate the next pending step */}
            {nextPendingStepId && !isRunning && (
              <div className="shrink-0 flex items-center gap-1.5">
                <button
                  onClick={() => skipStep(nextPendingStepId)}
                  className="flex items-center gap-1.5 px-3 py-2.5 rounded-lg bg-zinc-500/10 border border-zinc-500/20 text-zinc-400 text-[11px] font-semibold hover:bg-zinc-500/20 hover:text-zinc-300 transition-colors"
                >
                  SKIP
                  <SkipForward size={13} />
                </button>
                <button
                  onClick={() => continueStep(nextPendingStepId)}
                  className="flex items-center gap-1.5 px-4 py-2.5 rounded-lg bg-green-500/15 border border-green-500/30 text-green-400 text-[11px] font-semibold hover:bg-green-500/25 transition-colors"
                >
                  NEXT
                  <ArrowRight size={14} />
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
})

// ── Grid Overlay Component ───────────────────────────────────────

// ── Post-Process Progress Bar ─────────────────────────────────────

const PIPELINE_STEPS = [
  { key: 'removing-bg', label: 'Remove BG' },
  { key: 'vectorizing', label: 'Vectorize' },
  { key: 'cropping', label: 'Crop & Save' },
] as const

function PostProcessProgressBar({ phase }: { phase: 'removing-bg' | 'vectorizing' | 'cropping' }) {
  const activeIdx = PIPELINE_STEPS.findIndex((s) => s.key === phase)

  return (
    <div className="py-2 px-3 rounded-lg bg-white/[0.03] border border-white/[0.06]">
      {/* Step labels */}
      <div className="flex items-center gap-1 mb-2">
        {PIPELINE_STEPS.map((step, i) => {
          const isDone = i < activeIdx
          const isActive = i === activeIdx
          return (
            <div key={step.key} className="flex items-center gap-1 flex-1">
              {i > 0 && (
                <div className={cn('h-px flex-1 transition-colors', isDone ? 'bg-emerald-500' : 'bg-white/10')} />
              )}
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
                <span
                  className={cn(
                    'text-[10px] font-medium',
                    isDone ? 'text-emerald-400' : isActive ? 'text-blue-400' : 'text-gray-600',
                  )}
                >
                  {step.label}
                </span>
              </div>
              {i < PIPELINE_STEPS.length - 1 && (
                <div className={cn('h-px flex-1 transition-colors', isDone ? 'bg-emerald-500' : 'bg-white/10')} />
              )}
            </div>
          )
        })}
      </div>
      {/* Overall progress bar */}
      <div className="h-1 rounded-full bg-white/10 overflow-hidden">
        <div
          className="h-full rounded-full bg-blue-500 transition-all duration-500"
          style={{ width: `${((activeIdx + 0.5) / PIPELINE_STEPS.length) * 100}%` }}
        />
      </div>
    </div>
  )
}

// ── Grid Overlay Component ───────────────────────────────────────

function GridOverlay({
  cols,
  rows,
  width,
  height,
  left,
  top,
  rowRatios,
  colLabels,
  rowLabels,
}: {
  cols: number
  rows: number
  width: number
  height: number
  left: number
  top: number
  rowRatios?: readonly number[]
  colLabels?: readonly string[]
  rowLabels?: readonly string[]
}) {
  const cellW = width / cols
  const scissorSize = 12

  // Compute row Y positions: proportional if ratios provided, else equal
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
        {/* Vertical cut lines */}
        {Array.from({ length: cols - 1 }, (_, i) => {
          const x = (i + 1) * cellW
          return (
            <line
              key={`v-${i}`}
              x1={x}
              y1={0}
              x2={x}
              y2={height}
              stroke="#ef4444"
              strokeWidth={1.5}
              strokeDasharray="6 4"
              opacity={0.7}
            />
          )
        })}

        {/* Horizontal cut lines */}
        {rowYPositions.map((y, i) => (
          <line
            key={`h-${i}`}
            x1={0}
            y1={y}
            x2={width}
            y2={y}
            stroke="#ef4444"
            strokeWidth={1.5}
            strokeDasharray="6 4"
            opacity={0.7}
          />
        ))}
      </svg>

      {/* Scissor icons at end of vertical lines */}
      {Array.from({ length: cols - 1 }, (_, i) => {
        const x = (i + 1) * cellW
        return (
          <div
            key={`sv-${i}`}
            className="absolute"
            style={{
              left: x - scissorSize / 2,
              bottom: -scissorSize / 2 - 1,
              width: scissorSize,
              height: scissorSize,
            }}
          >
            <Scissors size={scissorSize} className="text-red-400" strokeWidth={2} />
          </div>
        )
      })}

      {/* Scissor icons at end of horizontal lines */}
      {rowYPositions.map((y, i) => (
        <div
          key={`sh-${i}`}
          className="absolute"
          style={{
            right: -scissorSize / 2 - 1,
            top: y - scissorSize / 2,
            width: scissorSize,
            height: scissorSize,
            transform: 'rotate(90deg)',
          }}
        >
          <Scissors size={scissorSize} className="text-red-400" strokeWidth={2} />
        </div>
      ))}

      {/* Column labels — above grid */}
      {colLabels &&
        colLabels.map((label, i) => {
          if (i >= cols) return null
          return (
            <div
              key={`cl-${i}`}
              className="absolute text-center pointer-events-none"
              style={{
                left: i * cellW,
                top: -18,
                width: cellW,
              }}
            >
              <span className="text-[10px] font-medium text-gray-300 bg-black/50 px-1 rounded">{label}</span>
            </div>
          )
        })}

      {/* Row labels — left of grid */}
      {rowLabels &&
        rowLabels.map((label, i) => {
          if (i >= rows) return null
          const rowTop = i === 0 ? 0 : rowYPositions[i - 1]
          const rowBottom = i < rowYPositions.length ? rowYPositions[i] : height
          const rowH = rowBottom - rowTop
          return (
            <div
              key={`rl-${i}`}
              className="absolute flex items-center pointer-events-none"
              style={{
                left: -60,
                top: rowTop,
                width: 56,
                height: rowH,
                justifyContent: 'flex-end',
              }}
            >
              <span className="text-[10px] font-medium text-gray-300 bg-black/50 px-1 rounded whitespace-nowrap">
                {label}
              </span>
            </div>
          )
        })}
    </div>
  )
}
