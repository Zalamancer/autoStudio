import { memo, useCallback } from 'react'
import { useConfirmDialog } from '@/stores/useConfirmDialogStore'
import { useNavigate } from 'react-router-dom'
import {
  ChevronDown,
  ChevronUp,
  Trash2,
  ExternalLink,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Clock,
  Sparkles,
  Clapperboard,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { type DashboardClip } from '@/stores/useDashboardStore'
import { DashboardOrchestratorPanel } from './DashboardOrchestratorPanel'
import type { VideoCompositionProps } from '@/remotion/types'

interface ClipCardProps {
  clip: DashboardClip
  isExpanded: boolean
  isExecuting: boolean
  onToggleExpand: () => void
  onRemove: () => void
  onPlay: (recordingId: string, compositionSnapshot?: VideoCompositionProps | null) => void
  onShare: (recordingId: string) => void
  onInsights: (recordingId: string) => void
}

const PHASE_CONFIG: Record<string, { label: string; color: string; icon: typeof Clock }> = {
  idle: { label: 'Draft', color: 'text-gray-500 bg-gray-500/10', icon: Clock },
  planning: { label: 'Planning...', color: 'text-blue-400 bg-blue-500/10', icon: Loader2 },
  reviewing: { label: 'Ready', color: 'text-amber-400 bg-amber-500/10', icon: Sparkles },
  executing: { label: 'Executing', color: 'text-blue-400 bg-blue-500/10', icon: Clapperboard },
  done: { label: 'Complete', color: 'text-emerald-400 bg-emerald-500/10', icon: CheckCircle2 },
  error: { label: 'Error', color: 'text-red-400 bg-red-500/10', icon: AlertCircle },
}

export const ClipCard = memo(function ClipCard({
  clip,
  isExpanded,
  isExecuting,
  onToggleExpand,
  onRemove,
  onPlay,
  onShare,
  onInsights,
}: ClipCardProps) {
  const navigate = useNavigate()
  const confirm = useConfirmDialog()
  const phaseInfo = PHASE_CONFIG[clip.phase] || PHASE_CONFIG.idle
  const PhaseIcon = phaseInfo.icon

  const handleOpenInEditor = useCallback(() => {
    if (!clip.plan) return
    navigate('/editor', {
      state: {
        clipPlan: clip.plan,
        clipPrompt: clip.prompt,
        clipSettings: clip.settings,
      },
    })
  }, [clip, navigate])

  const completedSteps = clip.steps.filter((s) => s.status === 'done').length
  const totalSteps = clip.steps.length
  const progressPercent = totalSteps > 0 ? Math.round((completedSteps / totalSteps) * 100) : 0

  return (
    <div
      className={cn(
        'rounded-xl border transition-all duration-200',
        isExpanded ? 'border-amber-500/30 bg-[#1a1a1a]' : 'border-[#2a2a2a] bg-[#1e1e1e] hover:border-[#3a3a3a]',
      )}
    >
      {/* Compact Header (always visible) */}
      <div className="flex items-center gap-3 p-4 cursor-pointer" onClick={onToggleExpand}>
        {/* Expand/Collapse Icon */}
        <button className="text-gray-500 hover:text-gray-300 transition-colors flex-shrink-0">
          {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
        </button>

        {/* Clip Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <p className="text-sm text-white truncate">{clip.prompt || 'Untitled clip'}</p>
          </div>

          {/* Progress bar during execution */}
          {clip.phase === 'executing' && totalSteps > 0 && (
            <div className="mt-1.5 flex items-center gap-2">
              <div className="flex-1 h-1 rounded-full bg-[#2a2a2a] overflow-hidden">
                <div
                  className="h-full bg-blue-500 transition-all duration-300 rounded-full"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
              <span className="text-[10px] text-gray-500 flex-shrink-0">
                {completedSteps}/{totalSteps}
              </span>
            </div>
          )}
        </div>

        {/* Phase Badge */}
        <span
          className={cn(
            'flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium flex-shrink-0',
            phaseInfo.color,
          )}
        >
          <PhaseIcon
            size={12}
            className={cn(clip.phase === 'planning' && 'animate-spin', clip.phase === 'executing' && 'animate-pulse')}
          />
          {phaseInfo.label}
        </span>

        {/* Cost */}
        {clip.cost.totalCost > 0 && (
          <span className="text-[10px] text-gray-500 flex-shrink-0">${clip.cost.totalCost.toFixed(4)}</span>
        )}

        {/* Actions */}
        <div className="flex items-center gap-1 flex-shrink-0" onClick={(e) => e.stopPropagation()}>
          {/* Open in Editor (when plan is available) */}
          {clip.plan && (
            <button
              onClick={handleOpenInEditor}
              className="p-1.5 rounded-md text-gray-500 hover:text-amber-400 hover:bg-amber-500/10 transition-colors"
              title="Open in Editor"
            >
              <ExternalLink size={14} />
            </button>
          )}

          {/* Delete */}
          {!isExecuting && (
            <button
              onClick={async () => {
                if (await confirm({ title: 'Remove clip', description: 'Remove this clip?' })) onRemove()
              }}
              className="p-1.5 rounded-md text-gray-600 hover:text-red-400 hover:bg-red-500/10 transition-colors"
              title="Remove clip"
            >
              <Trash2 size={14} />
            </button>
          )}
        </div>
      </div>

      {/* Expanded Content (inline) */}
      {isExpanded && (
        <div className="px-4 pb-4 border-t border-[#2a2a2a]">
          <div className="pt-3">
            <DashboardOrchestratorPanel clipId={clip.id} onPlay={onPlay} onShare={onShare} onInsights={onInsights} />
          </div>
        </div>
      )}
    </div>
  )
})
