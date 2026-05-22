import { useEffect, useState } from 'react'
import {
  ArrowLeft,
  Coins,
  Calendar,
  Users,
  Tag,
  Image,
  Loader2,
  CheckCircle2,
  XCircle,
  Send,
  AlertCircle,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { usePromotionStore } from '@/stores/usePromotionStore'
import { useCreditsStore } from '@/stores/useCreditsStore'
import { PanelActionButton } from '@/components/ui/panel-controls'
import type { PromotionRequest } from '@/types/promotions'
import { SubmissionForm } from './SubmissionForm'
import { SubmissionReviewCard } from './SubmissionReviewCard'

interface Props {
  request: PromotionRequest
  onBack: () => void
}

export function RequestDetailPanel({ request, onBack }: Props) {
  const {
    activeRequestSubmissions,
    isLoadingSubmissions,
    fetchSubmissionsForRequest,
    cancelMyRequest,
    completeMyRequest,
    selectedRequest,
    fetchRequestDetail,
  } = usePromotionStore()

  const balance = useCreditsStore((s) => s.balance)
  const isEnterprise = balance?.plan === 'enterprise'
  const isOwner = isEnterprise // Simplified — server enforces actual ownership

  const [showSubmitForm, setShowSubmitForm] = useState(false)
  const [loaded, setLoaded] = useState(false)

  const detail = selectedRequest ?? request

  useEffect(() => {
    if (!loaded) {
      fetchRequestDetail(request.id)
      if (isOwner) {
        fetchSubmissionsForRequest(request.id)
      }
      setLoaded(true)
    }
  }, [loaded, request.id, isOwner, fetchRequestDetail, fetchSubmissionsForRequest])

  const remainingBudget = detail.escrowed_credits - detail.spent_credits
  const isOpen = detail.status === 'open'
  const deadlinePassed = detail.deadline && new Date(detail.deadline) < new Date()

  return (
    <div className="px-2 space-y-4">
      {/* Back button */}
      <button
        onClick={onBack}
        className="flex items-center gap-1.5 text-[10px] font-bold text-zinc-500 hover:text-zinc-300 uppercase tracking-widest transition-colors"
      >
        <ArrowLeft size={12} />
        Back to Requests
      </button>

      {/* Header */}
      <div className="rounded-xl border border-white/5 bg-black/20 p-4 space-y-3">
        <div className="flex items-start justify-between gap-2">
          <h3 className="text-sm font-bold text-white">{detail.title}</h3>
          <span className={cn(
            'px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-widest border',
            detail.status === 'open' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
            detail.status === 'reviewing' ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' :
            detail.status === 'completed' ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' :
            detail.status === 'canceled' ? 'bg-red-500/10 text-red-400 border-red-500/20' :
            'bg-zinc-500/10 text-zinc-400 border-zinc-500/20'
          )}>
            {detail.status}
          </span>
        </div>

        <p className="text-[11px] text-zinc-400 leading-relaxed">{detail.description}</p>

        {/* Stats */}
        <div className="flex flex-wrap items-center gap-3 pt-1">
          <span className="flex items-center gap-1 text-[10px] font-bold text-amber-400">
            <Coins size={11} />
            {remainingBudget.toLocaleString()} / {detail.budget_credits.toLocaleString()} credits
          </span>
          {detail.deadline && (
            <span className={cn(
              'flex items-center gap-1 text-[10px] font-bold',
              deadlinePassed ? 'text-red-400' : 'text-zinc-500'
            )}>
              <Calendar size={11} />
              {new Date(detail.deadline).toLocaleDateString()}
            </span>
          )}
          <span className="flex items-center gap-1 text-[10px] font-bold text-zinc-500">
            <Users size={11} />
            {detail.submission_count ?? 0}/{detail.max_submissions} submissions
          </span>
        </div>

        {/* Niche tags */}
        {detail.niche_tags.length > 0 && (
          <div className="flex flex-wrap gap-1 pt-1">
            {detail.niche_tags.map((tag) => (
              <span key={tag} className="flex items-center gap-0.5 px-2 py-0.5 rounded-md bg-purple-500/10 text-[9px] font-bold text-purple-400 border border-purple-500/20">
                <Tag size={9} />
                {tag}
              </span>
            ))}
          </div>
        )}

        {/* Reference media */}
        {detail.reference_media && detail.reference_media.length > 0 && (
          <div className="space-y-1.5 pt-1">
            <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest flex items-center gap-1">
              <Image size={10} />
              Reference Media
            </span>
            <div className="flex gap-2 overflow-x-auto">
              {detail.reference_media.map((media, i) => (
                <div key={i} className="shrink-0 w-20 h-20 rounded-lg overflow-hidden border border-white/5 bg-black/30">
                  {media.type === 'image' ? (
                    <img src={media.url} alt={media.caption || ''} className="w-full h-full object-cover" />
                  ) : (
                    <video src={media.url} className="w-full h-full object-cover" muted />
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Enterprise actions */}
      {isOwner && isOpen && (
        <div className="flex gap-2">
          <PanelActionButton
            variant="secondary"
            onClick={() => completeMyRequest(detail.id)}
            icon={CheckCircle2}
            className="flex-1 text-[10px] font-bold text-blue-400 hover:text-blue-300 hover:bg-blue-500/10 border-blue-500/20"
          >
            Complete
          </PanelActionButton>
          <PanelActionButton
            variant="secondary"
            onClick={() => cancelMyRequest(detail.id)}
            icon={XCircle}
            className="flex-1 text-[10px] font-bold text-red-400 hover:text-red-300 hover:bg-red-500/10 border-red-500/20"
          >
            Cancel
          </PanelActionButton>
        </div>
      )}

      {/* Creator: Submit work button */}
      {!isOwner && isOpen && !deadlinePassed && (
        <PanelActionButton
          variant="primary"
          onClick={() => setShowSubmitForm(true)}
          icon={Send}
          className="w-full py-2.5 text-[10px] font-bold uppercase tracking-widest bg-emerald-600 hover:bg-emerald-500 text-white shadow-[0_0_10px_rgba(52,211,153,0.3)] border-transparent"
        >
          Submit Your Work
        </PanelActionButton>
      )}

      {deadlinePassed && isOpen && (
        <div className="flex items-center gap-2 p-3 rounded-lg bg-red-500/10 border border-red-500/20">
          <AlertCircle size={14} className="text-red-400 shrink-0" />
          <span className="text-[10px] text-red-300">The deadline for this request has passed.</span>
        </div>
      )}

      {/* Submissions list (enterprise view) */}
      {isOwner && (
        <div className="space-y-2">
          <h4 className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest flex items-center gap-1.5 px-1">
            <Users size={12} />
            Submissions ({activeRequestSubmissions.length})
          </h4>
          {isLoadingSubmissions ? (
            <div className="flex justify-center py-8">
              <Loader2 size={20} className="text-zinc-500 animate-spin" />
            </div>
          ) : activeRequestSubmissions.length === 0 ? (
            <p className="text-[10px] text-zinc-600 px-1">No submissions yet.</p>
          ) : (
            <div className="space-y-2">
              {activeRequestSubmissions.map((submission) => (
                <SubmissionReviewCard
                  key={submission.id}
                  submission={submission}
                  maxReward={remainingBudget}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Submit form modal */}
      {showSubmitForm && (
        <SubmissionForm
          requestId={detail.id}
          requestTitle={detail.title}
          onClose={() => setShowSubmitForm(false)}
        />
      )}
    </div>
  )
}
