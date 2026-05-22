import { useState } from 'react'
import {
  X,
  Plus,
  Calendar,
  Tag,
  Loader2,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { usePromotionStore } from '@/stores/usePromotionStore'
import { useCreditsStore } from '@/stores/useCreditsStore'
import { PanelActionButton, PanelSlider } from '@/components/ui/panel-controls'
import { NICHE_TAG_OPTIONS } from '@/types/promotions'

interface Props {
  onClose: () => void
}

export function CreateRequestModal({ onClose }: Props) {
  const createNewRequest = usePromotionStore((s) => s.createNewRequest)
  const balance = useCreditsStore((s) => s.balance)

  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [budgetCredits, setBudgetCredits] = useState(500)
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const [deadline, setDeadline] = useState('')
  const [maxSubmissions, setMaxSubmissions] = useState(10)
  const [isCreating, setIsCreating] = useState(false)
  const [error, setError] = useState('')

  const creditsAvailable = balance?.credits_remaining ?? 0
  const canAfford = budgetCredits <= creditsAvailable

  const toggleTag = (tag: string) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    )
  }

  const handleCreate = async () => {
    if (!title.trim() || !description.trim()) {
      setError('Title and description are required')
      return
    }
    if (budgetCredits <= 0) {
      setError('Budget must be greater than 0')
      return
    }
    if (!canAfford) {
      setError('Insufficient credits for this budget')
      return
    }
    if (selectedTags.length === 0) {
      setError('Select at least one niche tag')
      return
    }

    setIsCreating(true)
    setError('')

    const result = await createNewRequest({
      title: title.trim(),
      description: description.trim(),
      budget_credits: budgetCredits,
      niche_tags: selectedTags,
      deadline: deadline || undefined,
      max_submissions: maxSubmissions,
    })

    setIsCreating(false)

    if (result) {
      onClose()
    } else {
      setError('Failed to create request. Please try again.')
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div
        className="w-full max-w-lg max-h-[85vh] overflow-y-auto bg-zinc-900 border border-white/10 rounded-2xl shadow-2xl p-6 space-y-5"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-white">Create Promotion Request</h3>
          <button onClick={onClose} className="p-1 rounded-md text-zinc-500 hover:text-white hover:bg-white/10 transition-colors">
            <X size={16} />
          </button>
        </div>

        {/* Form */}
        <div className="space-y-4">
          {/* Title */}
          <div>
            <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-1 block">
              Title *
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., Product launch video for fitness app"
              className="w-full px-3 py-2 rounded-lg bg-black/30 border border-white/10 text-xs text-white placeholder:text-zinc-600 focus:outline-none focus:border-amber-500/40"
            />
          </div>

          {/* Description */}
          <div>
            <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-1 block">
              Description *
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe what you're looking for, style preferences, specific requirements..."
              rows={4}
              className="w-full px-3 py-2 rounded-lg bg-black/30 border border-white/10 text-xs text-white placeholder:text-zinc-600 focus:outline-none focus:border-amber-500/40 resize-none"
            />
          </div>

          {/* Budget */}
          <div>
            <div className="flex items-center gap-2">
              <div className="flex-1">
                <PanelSlider
                  label="Budget"
                  value={budgetCredits}
                  onChange={(v) => setBudgetCredits(Math.max(1, v))}
                  min={1}
                  max={Math.max(creditsAvailable, 1)}
                  step={1}
                  suffix=" credits"
                  compact
                />
              </div>
              <span className={cn(
                'text-[10px] font-bold whitespace-nowrap',
                canAfford ? 'text-emerald-400' : 'text-red-400'
              )}>
                {creditsAvailable.toLocaleString()} available
              </span>
            </div>
            <p className="text-[9px] text-zinc-600 mt-1">Credits will be escrowed from your balance when you create this request.</p>
          </div>

          {/* Niche tags */}
          <div>
            <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-2 flex items-center gap-1">
              <Tag size={10} />
              Niche Tags * <span className="text-zinc-600 font-normal">(select to match creators)</span>
            </label>
            <div className="flex flex-wrap gap-1.5">
              {NICHE_TAG_OPTIONS.map((tag) => (
                <button
                  key={tag}
                  onClick={() => toggleTag(tag)}
                  className={cn(
                    'px-2.5 py-1 rounded-lg text-[9px] font-bold uppercase tracking-wider border transition-all',
                    selectedTags.includes(tag)
                      ? 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                      : 'bg-black/20 text-zinc-600 border-transparent hover:text-zinc-400 hover:bg-white/5'
                  )}
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>

          {/* Deadline */}
          <div>
            <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-1 flex items-center gap-1">
              <Calendar size={10} />
              Deadline <span className="text-zinc-600 font-normal">(optional)</span>
            </label>
            <input
              type="date"
              value={deadline}
              onChange={(e) => setDeadline(e.target.value)}
              min={new Date().toISOString().split('T')[0]}
              className="w-full px-3 py-2 rounded-lg bg-black/30 border border-white/10 text-xs text-white focus:outline-none focus:border-amber-500/40 [color-scheme:dark]"
            />
          </div>

          {/* Max submissions */}
          <div>
            <PanelSlider
              label="Max Submissions"
              value={maxSubmissions}
              onChange={(v) => setMaxSubmissions(Math.max(1, v))}
              min={1}
              max={100}
              step={1}
              compact
            />
          </div>
        </div>

        {/* Error */}
        {error && (
          <p className="text-[10px] text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">{error}</p>
        )}

        {/* Create button */}
        <PanelActionButton
          variant="primary"
          onClick={handleCreate}
          disabled={isCreating || !title.trim() || !description.trim() || !canAfford || selectedTags.length === 0}
          icon={isCreating ? Loader2 : Plus}
          className={`w-full py-3 text-[10px] font-bold uppercase tracking-widest border-transparent ${
            isCreating
              ? 'bg-zinc-700 text-zinc-400'
              : 'bg-amber-600 hover:bg-amber-500 text-white shadow-[0_0_10px_rgba(217,119,6,0.3)]'
          }`}
        >
          {isCreating ? 'Creating...' : `Create Request (${budgetCredits.toLocaleString()} credits)`}
        </PanelActionButton>
      </div>
    </div>
  )
}
