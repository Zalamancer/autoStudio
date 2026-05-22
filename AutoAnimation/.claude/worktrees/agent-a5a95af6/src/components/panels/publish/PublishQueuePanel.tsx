/**
 * Publish Queue Panel — shows pending, in-progress, and completed publish jobs
 * with status badges, retry buttons, and links to published posts.
 */

import { useEffect } from 'react'
import {
  Clock,
  CheckCircle2,
  AlertCircle,
  Loader2,
  ExternalLink,
  Trash2,
  RefreshCw,
} from 'lucide-react'
import { useShallow } from 'zustand/react/shallow'
import { usePublishStore } from '@/stores/usePublishStore'
import type { ScheduledPost, PublishJob } from '@/types/social'

const STATUS_CONFIG: Record<string, { icon: typeof Clock; color: string; label: string }> = {
  pending: { icon: Clock, color: 'text-yellow-400', label: 'Pending' },
  publishing: { icon: Loader2, color: 'text-blue-400', label: 'Publishing' },
  published: { icon: CheckCircle2, color: 'text-green-400', label: 'Published' },
  failed: { icon: AlertCircle, color: 'text-red-400', label: 'Failed' },
  uploading: { icon: Loader2, color: 'text-blue-400', label: 'Uploading' },
  processing: { icon: Loader2, color: 'text-blue-400', label: 'Processing' },
}

function StatusBadge({ status }: { status: string }) {
  const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.pending
  const Icon = cfg.icon
  const isSpinning = status === 'publishing' || status === 'uploading' || status === 'processing'

  return (
    <span className={`flex items-center gap-1 text-[10px] font-medium ${cfg.color}`}>
      <Icon size={12} className={isSpinning ? 'animate-spin' : ''} />
      {cfg.label}
    </span>
  )
}

function ScheduledPostRow({ post }: { post: ScheduledPost }) {
  const cancelPost = usePublishStore((s) => s.cancelPost)

  const formattedDate = new Date(post.scheduledAt).toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })

  return (
    <div className="flex items-center justify-between p-2.5 rounded-xl bg-black/20 border border-white/5">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-zinc-300 capitalize">{post.platform}</span>
          <StatusBadge status={post.status} />
        </div>
        <p className="text-[10px] text-zinc-500 mt-0.5">{formattedDate}</p>
      </div>
      <div className="flex items-center gap-1">
        {post.status === 'published' && post.result?.postUrl && (
          <a
            href={post.result.postUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="p-1 rounded-lg hover:bg-white/5"
          >
            <ExternalLink size={12} className="text-blue-400" />
          </a>
        )}
        {post.status === 'pending' && (
          <button
            onClick={() => cancelPost(post.id)}
            className="p-1 rounded-lg hover:bg-red-500/10"
          >
            <Trash2 size={12} className="text-red-400" />
          </button>
        )}
      </div>
    </div>
  )
}

function PublishJobRow({ job }: { job: PublishJob }) {
  const pollPublishStatus = usePublishStore((s) => s.pollPublishStatus)

  return (
    <div className="flex items-center justify-between p-2.5 rounded-xl bg-black/20 border border-white/5">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-zinc-300 capitalize">{job.platform}</span>
          <StatusBadge status={job.status} />
        </div>
        {job.error && (
          <p className="text-[10px] text-red-400 mt-0.5 truncate">{job.error}</p>
        )}
      </div>
      <div className="flex items-center gap-1">
        {job.postUrl && (
          <a
            href={job.postUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="p-1 rounded-lg hover:bg-white/5"
          >
            <ExternalLink size={12} className="text-blue-400" />
          </a>
        )}
        {job.status === 'failed' && (
          <button
            onClick={() => pollPublishStatus(job.jobId)}
            className="p-1 rounded-lg hover:bg-white/5"
          >
            <RefreshCw size={12} className="text-zinc-400" />
          </button>
        )}
      </div>
    </div>
  )
}

export function PublishQueuePanel() {
  const { scheduledPosts, publishJobs, isLoadingScheduled, fetchScheduledPosts } = usePublishStore(
    useShallow((s) => ({
      scheduledPosts: s.scheduledPosts,
      publishJobs: s.publishJobs,
      isLoadingScheduled: s.isLoadingScheduled,
      fetchScheduledPosts: s.fetchScheduledPosts,
    })),
  )

  useEffect(() => {
    fetchScheduledPosts()
  }, [fetchScheduledPosts])

  const activeJobs = Object.values(publishJobs)
  const hasContent = scheduledPosts.length > 0 || activeJobs.length > 0

  if (!hasContent && !isLoadingScheduled) {
    return null
  }

  return (
    <div className="space-y-2">
      <h4 className="text-[10px] text-zinc-500 uppercase tracking-wider font-medium">
        Publish Queue
      </h4>

      {isLoadingScheduled && (
        <div className="flex items-center justify-center py-3">
          <Loader2 size={14} className="animate-spin text-zinc-500" />
        </div>
      )}

      {/* Active publish jobs */}
      {activeJobs.length > 0 && (
        <div className="space-y-1.5">
          {activeJobs.map((job) => (
            <PublishJobRow key={job.jobId} job={job} />
          ))}
        </div>
      )}

      {/* Scheduled posts */}
      {scheduledPosts.length > 0 && (
        <div className="space-y-1.5">
          {scheduledPosts.map((post) => (
            <ScheduledPostRow key={post.id} post={post} />
          ))}
        </div>
      )}
    </div>
  )
}
