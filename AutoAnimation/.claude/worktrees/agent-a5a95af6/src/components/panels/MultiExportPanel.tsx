/**
 * Multi-Export Panel — Bulk export to multiple aspect ratios.
 */

import { Download, Monitor, Smartphone, Square, Tv2, Clapperboard, Check, Loader2, AlertTriangle } from 'lucide-react'
import { useShallow } from 'zustand/react/shallow'
import { useMultiExportStore, type ExportJob } from '@/stores/useMultiExportStore'
import { buildCompositionPropsFromStores } from '@/services/compositionBuilder'
import { extractContentAnchors, computeReframedLayout } from '@/services/autoReframe'
import { exportVideo } from '@/services/videoExport'
import { PanelLayout } from '@/components/ui/PanelHeader'
import { cn } from '@/lib/utils'

const ASPECT_OPTIONS = [
  { value: '16:9', label: '16:9', description: 'YouTube / Landscape', icon: Monitor },
  { value: '9:16', label: '9:16', description: 'TikTok / Reels', icon: Smartphone },
  { value: '1:1', label: '1:1', description: 'Instagram Square', icon: Square },
  { value: '4:3', label: '4:3', description: 'Standard / Presentation', icon: Tv2 },
  { value: '21:9', label: '21:9', description: 'Ultrawide / Cinematic', icon: Clapperboard },
]

const ASPECT_DIMS: Record<string, { width: number; height: number }> = {
  '16:9': { width: 1920, height: 1080 },
  '9:16': { width: 1080, height: 1920 },
  '1:1': { width: 1080, height: 1080 },
  '4:3': { width: 1440, height: 1080 },
  '21:9': { width: 2560, height: 1080 },
}

export function MultiExportPanel() {
  const {
    selectedAspects,
    smartReframe,
    jobs,
    overallProgress,
    isExporting,
    toggleAspect,
    setSmartReframe,
    setJobs,
    updateJob,
    setIsExporting,
    setOverallProgress,
    clearJobs,
  } = useMultiExportStore(
    useShallow((s) => ({
      selectedAspects: s.selectedAspects,
      smartReframe: s.smartReframe,
      jobs: s.jobs,
      overallProgress: s.overallProgress,
      isExporting: s.isExporting,
      toggleAspect: s.toggleAspect,
      setSmartReframe: s.setSmartReframe,
      setJobs: s.setJobs,
      updateJob: s.updateJob,
      setIsExporting: s.setIsExporting,
      setOverallProgress: s.setOverallProgress,
      clearJobs: s.clearJobs,
    }))
  )

  const handleExportAll = async () => {
    if (selectedAspects.length === 0) return

    setIsExporting(true)
    clearJobs()

    const baseProps = buildCompositionPropsFromStores()
    const anchors = smartReframe ? extractContentAnchors(baseProps) : []

    // Initialize jobs
    const initialJobs: ExportJob[] = selectedAspects.map((aspect) => ({
      aspectRatio: aspect,
      status: 'pending',
      progress: 0,
      outputUrl: null,
      outputSize: null,
      error: null,
    }))
    setJobs(initialJobs)

    // Export sequentially (Canvas2D is single-threaded)
    for (let i = 0; i < selectedAspects.length; i++) {
      const aspect = selectedAspects[i]
      const dims = ASPECT_DIMS[aspect] || ASPECT_DIMS['16:9']

      updateJob(i, { status: 'rendering' })

      try {
        // Compute reframe layout for content-aware crop/scale
        const reframe = smartReframe
          ? computeReframedLayout(baseProps.width, baseProps.height, aspect, anchors)
          : null

        // Build modified props for this aspect ratio
        const exportProps = {
          ...baseProps,
          width: dims.width,
          height: dims.height,
          ...(reframe && {
            reframeScale: reframe.scale,
            reframeOffsetX: reframe.offsetX,
            reframeOffsetY: reframe.offsetY,
          }),
        }

        const result = await exportVideo(
          exportProps,
          {
            width: dims.width,
            height: dims.height,
            fps: baseProps.fps,
            durationInFrames: baseProps.durationInFrames,
            format: 'mp4',
            quality: 0.8,
          },
          (progress) => {
            updateJob(i, { progress: progress.percentage / 100 })
            setOverallProgress((i + progress.percentage / 100) / selectedAspects.length)
          },
        )

        updateJob(i, {
          status: 'complete',
          progress: 1,
          outputUrl: result.url,
        })
      } catch (err) {
        updateJob(i, {
          status: 'error',
          error: err instanceof Error ? err.message : 'Export failed',
        })
      }

      setOverallProgress((i + 1) / selectedAspects.length)
    }

    setIsExporting(false)
  }

  const handleDownloadAll = () => {
    for (const job of jobs) {
      if (job.outputUrl) {
        const link = document.createElement('a')
        link.href = job.outputUrl
        link.download = `export-${job.aspectRatio.replace(':', 'x')}.mp4`
        link.click()
      }
    }
  }

  return (
    <PanelLayout icon={Download} title="Multi-Format Export" iconClassName="text-violet-400">
      {/* Aspect Ratio Selection */}
      <div className="space-y-4">
        <h4 className="text-xs font-medium text-zinc-400 tracking-wider uppercase">Select Formats</h4>
        <div className="space-y-1.5">
          {ASPECT_OPTIONS.map((opt) => {
            const selected = selectedAspects.includes(opt.value)
            const Icon = opt.icon
            return (
              <button
                key={opt.value}
                onClick={() => toggleAspect(opt.value)}
                disabled={isExporting}
                className={cn(
                  'w-full flex items-center gap-3 p-2.5 rounded-xl border transition-all text-left',
                  selected
                    ? 'bg-violet-500/15 border-violet-500/30 text-zinc-200'
                    : 'bg-black/20 border-white/5 text-zinc-400 hover:border-violet-500/20',
                  isExporting && 'opacity-50 cursor-not-allowed'
                )}
              >
                <div
                  className={cn(
                    'w-5 h-5 rounded-md border-2 flex items-center justify-center transition-colors',
                    selected ? 'border-violet-400 bg-violet-500/30' : 'border-zinc-600'
                  )}
                >
                  {selected && <Check size={12} className="text-violet-300" />}
                </div>
                <Icon size={16} className={selected ? 'text-violet-400' : 'text-zinc-500'} />
                <div className="flex-1">
                  <div className="text-[11px] font-semibold">{opt.label}</div>
                  <div className="text-[9px] text-zinc-500">{opt.description}</div>
                </div>
              </button>
            )
          })}
        </div>
      </div>

      {/* Smart Reframe Toggle */}
      <div className="flex items-center justify-between p-3 bg-zinc-800/20 rounded-2xl border border-white/5">
        <div>
          <div className="text-xs font-medium text-zinc-300">Smart Reframe</div>
          <div className="text-[9px] text-zinc-500">Keep characters & text visible</div>
        </div>
        <button
          onClick={() => setSmartReframe(!smartReframe)}
          className={cn(
            'relative w-10 h-5 rounded-full transition-colors duration-200',
            smartReframe ? 'bg-violet-500' : 'bg-zinc-700'
          )}
        >
          <div
            className={cn(
              'absolute top-0.5 w-4 h-4 rounded-full bg-white shadow-md transition-transform duration-200',
              smartReframe ? 'translate-x-5' : 'translate-x-0.5'
            )}
          />
        </button>
      </div>

      {/* Export Button */}
      <button
        onClick={handleExportAll}
        disabled={isExporting || selectedAspects.length === 0}
        className={cn(
          'w-full py-3 rounded-2xl font-semibold flex items-center justify-center gap-2 transition-all duration-300 shadow-lg',
          isExporting || selectedAspects.length === 0
            ? 'bg-zinc-800/50 text-zinc-500 cursor-not-allowed border border-white/5'
            : 'bg-gradient-to-r from-violet-500 to-purple-500 text-white hover:from-violet-400 hover:to-purple-400'
        )}
      >
        {isExporting ? (
          <>
            <Loader2 size={18} className="animate-spin" />
            Exporting {Math.round(overallProgress * 100)}%
          </>
        ) : (
          <>
            <Download size={18} />
            Export {selectedAspects.length} Format{selectedAspects.length !== 1 ? 's' : ''}
          </>
        )}
      </button>

      {/* Progress / Results */}
      {jobs.length > 0 && (
        <div className="space-y-4">
          <h4 className="text-xs font-medium text-zinc-400 tracking-wider uppercase">Export Jobs</h4>
          <div className="space-y-1.5">
            {jobs.map((job, i) => (
              <div
                key={i}
                className="flex items-center justify-between p-2.5 rounded-xl bg-black/20 border border-white/5"
              >
                <div className="flex items-center gap-2 min-w-0">
                  {job.status === 'complete' ? (
                    <Check size={14} className="text-green-400 shrink-0" />
                  ) : job.status === 'error' ? (
                    <AlertTriangle size={14} className="text-red-400 shrink-0" />
                  ) : job.status === 'rendering' ? (
                    <Loader2 size={14} className="text-violet-400 animate-spin shrink-0" />
                  ) : (
                    <div className="w-3.5 h-3.5 rounded-full border-2 border-zinc-600 shrink-0" />
                  )}
                  <div>
                    <span className="text-[11px] font-medium text-zinc-300">{job.aspectRatio}</span>
                    {job.error && (
                      <p className="text-[9px] text-red-400 truncate">{job.error}</p>
                    )}
                    {job.status === 'rendering' && (
                      <div className="w-20 h-1 bg-zinc-800 rounded-full mt-1 overflow-hidden">
                        <div
                          className="h-full bg-violet-500 rounded-full transition-all"
                          style={{ width: `${job.progress * 100}%` }}
                        />
                      </div>
                    )}
                  </div>
                </div>
                {job.outputUrl && (
                  <a
                    href={job.outputUrl}
                    download={`export-${job.aspectRatio.replace(':', 'x')}.mp4`}
                    className="p-1.5 rounded-lg bg-white/5 text-zinc-400 hover:text-white transition-colors"
                  >
                    <Download size={12} />
                  </a>
                )}
              </div>
            ))}
          </div>

          {jobs.some((j) => j.status === 'complete') && (
            <button
              onClick={handleDownloadAll}
              className="w-full py-2 rounded-xl text-[11px] font-medium bg-violet-500/20 text-violet-400 hover:bg-violet-500/30 border border-violet-500/30 transition-colors"
            >
              <Download size={12} className="inline mr-1" />
              Download All
            </button>
          )}
        </div>
      )}

      <div className="h-6 shrink-0" />
    </PanelLayout>
  )
}
