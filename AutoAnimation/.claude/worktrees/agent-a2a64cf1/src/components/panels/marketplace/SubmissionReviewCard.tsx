import { useState } from 'react'
import {
  CheckCircle2,
  XCircle,
  Coins,
  User,
  Clock,
  ExternalLink,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { usePromotionStore } from '@/stores/usePromotionStore'
import { PanelActionButton, PanelSlider } from '@/components/ui/panel-controls'
import type { PromotionSubmission } from '@/types/promotions'

interface Props {
  submission: PromotionSubmission
  maxReward: number
}

export function SubmissionReviewCard({ submission, maxReward }: Props) {
  const { approveSubmissionAction, rejectSubmissionAction } = usePromotionStore()

  const [rewardAmount, setRewardAmount] = useState(Math.min(100, maxReward))
  const [feedback, setFeedback] = useState('')
  const [showRejectForm, setShowRejectForm] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)

  const isPending = submission.status === 'pending' || submission.status === 'under_review'

  const handleApprove = async () => {
    if (rewardAmount <= 0 || rewardAmount > maxReward) return
    setIsProcessing(true)
    await approveSubmissionAction(submission.id, rewardAmount)
    setIsProcessing(false)
  }

  const handleReject = async () => {
    if (!feedback.trim()) return
    setIsProcessing(true)
    await rejectSubmissionAction(submission.id, feedback.trim())
    setIsProcessing(false)
    setShowRejectForm(false)
  }

  return (
    <div className={cn(
      'rounded-xl border bg-black/20 p-3.5 space-y-3 transition-all',
      submission.status === 'approved' ? 'border-emerald-500/20' :
      submission.status === 'rejected' ? 'border-red-500/20' :
      'border-white/5 hover:border-white/10'
    )}>
      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <h4 className="text-xs font-bold text-white truncate">{submission.title}</h4>
          {submission.description && (
            <p className="text-[10px] text-zinc-400 line-clamp-2 mt-0.5">{submission.description}</p>
          )}
        </div>
        <span className={cn(
          'px-2 py-0.5 rounded-md text-[8px] font-black uppercase tracking-widest border shrink-0',
          submission.status === 'approved' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
          submission.status === 'rejected' ? 'bg-red-500/10 text-red-400 border-red-500/20' :
          submission.status === 'withdrawn' ? 'bg-zinc-500/10 text-zinc-400 border-zinc-500/20' :
          'bg-amber-500/10 text-amber-400 border-amber-500/20'
        )}>
          {submission.status}
        </span>
      </div>

      {/* Creator info */}
      <div className="flex items-center gap-3 text-[9px] text-zinc-500">
        <span className="flex items-center gap-1">
          <User size={9} />
          {submission.creator_display_name || 'Creator'}
        </span>
        {submission.creator_total_approvals !== undefined && (
          <span className="flex items-center gap-1">
            <CheckCircle2 size={9} />
            {submission.creator_total_approvals} approvals
          </span>
        )}
        <span className="flex items-center gap-1">
          <Clock size={9} />
          {new Date(submission.created_at).toLocaleDateString()}
        </span>
      </div>

      {/* Asset preview */}
      <div className="flex items-center gap-2">
        {submission.thumbnail_url && (
          <div className="w-16 h-16 rounded-lg overflow-hidden border border-white/5 bg-black/30 shrink-0">
            <img src={submission.thumbnail_url} alt="" className="w-full h-full object-cover" />
          </div>
        )}
        <a
          href={submission.asset_url}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1 text-[10px] text-purple-400 hover:text-purple-300 transition-colors"
        >
          <ExternalLink size={10} />
          View Asset
        </a>
      </div>

      {/* Approved: show reward */}
      {submission.status === 'approved' && submission.reward_credits && (
        <div className="flex items-center gap-1 text-[10px] font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 rounded-lg px-3 py-1.5">
          <Coins size={11} />
          Awarded {submission.reward_credits.toLocaleString()} credits
        </div>
      )}

      {/* Rejected: show feedback */}
      {submission.status === 'rejected' && submission.feedback && (
        <div className="text-[10px] text-red-300 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-1.5">
          <span className="font-bold">Feedback:</span> {submission.feedback}
        </div>
      )}

      {/* Review actions */}
      {isPending && (
        <div className="space-y-2 pt-1">
          {!showRejectForm ? (
            <>
              {/* Approve with credit input */}
              <PanelSlider
                label="Reward"
                value={rewardAmount}
                onChange={(v) => setRewardAmount(Math.min(maxReward, Math.max(1, v)))}
                min={1}
                max={maxReward}
                step={1}
                suffix=" credits"
                compact
              />

              <div className="flex gap-2">
                <PanelActionButton
                  variant="primary"
                  onClick={handleApprove}
                  disabled={isProcessing || rewardAmount <= 0 || rewardAmount > maxReward}
                  icon={CheckCircle2}
                  className="flex-1 py-2 text-[10px] font-bold bg-emerald-600 hover:bg-emerald-500 text-white border-transparent"
                >
                  Approve
                </PanelActionButton>
                <PanelActionButton
                  variant="secondary"
                  onClick={() => setShowRejectForm(true)}
                  icon={XCircle}
                  className="flex-1 py-2 text-[10px] font-bold text-red-400 hover:text-red-300 hover:bg-red-500/10 border-red-500/20"
                >
                  Reject
                </PanelActionButton>
              </div>
            </>
          ) : (
            <>
              {/* Reject with feedback */}
              <textarea
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
                placeholder="Provide feedback for the creator..."
                rows={2}
                className="w-full px-3 py-2 rounded-lg bg-black/30 border border-white/10 text-xs text-white placeholder:text-zinc-600 focus:outline-none focus:border-red-500/40 resize-none"
              />
              <div className="flex gap-2">
                <PanelActionButton
                  variant="secondary"
                  onClick={handleReject}
                  disabled={isProcessing || !feedback.trim()}
                  icon={XCircle}
                  className="flex-1 py-2 text-[10px] font-bold text-red-400 hover:text-red-300 hover:bg-red-500/10 border-red-500/20"
                >
                  Confirm Reject
                </PanelActionButton>
                <PanelActionButton
                  variant="secondary"
                  onClick={() => setShowRejectForm(false)}
                  className="py-2 text-[10px] text-zinc-500"
                >
                  Cancel
                </PanelActionButton>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  )
}
