import { useState } from 'react'
import { X, Send, Loader2, Upload } from 'lucide-react'
import { usePromotionStore } from '@/stores/usePromotionStore'
import { PanelActionButton } from '@/components/ui/panel-controls'

interface Props {
  requestId: string
  requestTitle: string
  onClose: () => void
}

export function SubmissionForm({ requestId, requestTitle, onClose }: Props) {
  const submitWorkAction = usePromotionStore((s) => s.submitWorkAction)

  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [assetUrl, setAssetUrl] = useState('')
  const [thumbnailUrl, setThumbnailUrl] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async () => {
    if (!title.trim() || !assetUrl.trim()) {
      setError('Title and asset URL are required')
      return
    }

    setIsSubmitting(true)
    setError('')

    const result = await submitWorkAction(requestId, {
      title: title.trim(),
      description: description.trim() || undefined,
      asset_url: assetUrl.trim(),
      thumbnail_url: thumbnailUrl.trim() || undefined,
    })

    setIsSubmitting(false)

    if (result) {
      onClose()
    } else {
      setError('Failed to submit. You may have already submitted to this request.')
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div
        className="w-full max-w-md bg-zinc-900 border border-white/10 rounded-2xl shadow-2xl p-6 space-y-4"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-white">Submit Work</h3>
          <button onClick={onClose} className="p-1 rounded-md text-zinc-500 hover:text-white hover:bg-white/10 transition-colors">
            <X size={16} />
          </button>
        </div>

        <p className="text-[10px] text-zinc-500">
          Submitting to: <span className="text-zinc-300 font-medium">{requestTitle}</span>
        </p>

        {/* Form fields */}
        <div className="space-y-3">
          <div>
            <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-1 block">
              Title *
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Name your submission"
              className="w-full px-3 py-2 rounded-lg bg-black/30 border border-white/10 text-xs text-white placeholder:text-zinc-600 focus:outline-none focus:border-purple-500/40"
            />
          </div>

          <div>
            <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-1 block">
              Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe your submission..."
              rows={3}
              className="w-full px-3 py-2 rounded-lg bg-black/30 border border-white/10 text-xs text-white placeholder:text-zinc-600 focus:outline-none focus:border-purple-500/40 resize-none"
            />
          </div>

          <div>
            <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-1 flex items-center gap-1">
              <Upload size={10} />
              Asset URL *
            </label>
            <input
              type="url"
              value={assetUrl}
              onChange={(e) => setAssetUrl(e.target.value)}
              placeholder="https://..."
              className="w-full px-3 py-2 rounded-lg bg-black/30 border border-white/10 text-xs text-white placeholder:text-zinc-600 focus:outline-none focus:border-purple-500/40"
            />
            <p className="text-[9px] text-zinc-600 mt-1">Direct link to your video, image, or project file</p>
          </div>

          <div>
            <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-1 block">
              Thumbnail URL
            </label>
            <input
              type="url"
              value={thumbnailUrl}
              onChange={(e) => setThumbnailUrl(e.target.value)}
              placeholder="https://... (optional)"
              className="w-full px-3 py-2 rounded-lg bg-black/30 border border-white/10 text-xs text-white placeholder:text-zinc-600 focus:outline-none focus:border-purple-500/40"
            />
          </div>
        </div>

        {/* Error */}
        {error && (
          <p className="text-[10px] text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">{error}</p>
        )}

        {/* Submit button */}
        <PanelActionButton
          variant="primary"
          onClick={handleSubmit}
          disabled={isSubmitting || !title.trim() || !assetUrl.trim()}
          icon={isSubmitting ? Loader2 : Send}
          className={`w-full py-2.5 text-[10px] font-bold uppercase tracking-widest border-transparent ${
            isSubmitting
              ? 'bg-zinc-700 text-zinc-400'
              : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-[0_0_10px_rgba(52,211,153,0.3)]'
          }`}
        >
          {isSubmitting ? 'Submitting...' : 'Submit Work'}
        </PanelActionButton>
      </div>
    </div>
  )
}
