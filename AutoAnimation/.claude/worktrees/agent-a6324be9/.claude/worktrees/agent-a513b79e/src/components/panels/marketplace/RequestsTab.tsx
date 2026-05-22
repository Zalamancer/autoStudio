import { useEffect, useState } from 'react'
import {
  Briefcase,
  Search,
  Loader2,
  Plus,
  Calendar,
  Coins,
  Tag,
  Users,
  ChevronRight,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { usePromotionStore } from '@/stores/usePromotionStore'
import { useCreditsStore } from '@/stores/useCreditsStore'
import { NICHE_TAG_OPTIONS } from '@/types/promotions'
import type { PromotionRequest } from '@/types/promotions'
import { PanelActionButton } from '@/components/ui/panel-controls'
import { RequestDetailPanel } from './RequestDetailPanel'
import { CreateRequestModal } from './CreateRequestModal'

export function RequestsTab() {
  const {
    openRequests,
    isLoadingOpen,
    fetchOpenRequests,
    searchQuery,
    nicheFilter,
    setSearchQuery,
    setNicheFilter,
  } = usePromotionStore()

  const balance = useCreditsStore((s) => s.balance)
  const isEnterprise = balance?.plan === 'enterprise'

  const [selectedRequest, setSelectedRequest] = useState<PromotionRequest | null>(null)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    if (!loaded) {
      fetchOpenRequests({ search: searchQuery, niche_tags: nicheFilter })
      setLoaded(true)
    }
  }, [loaded, fetchOpenRequests, searchQuery, nicheFilter])

  // Refetch when filters change
  useEffect(() => {
    if (loaded) {
      fetchOpenRequests({ search: searchQuery, niche_tags: nicheFilter })
    }
  }, [searchQuery, nicheFilter]) // eslint-disable-line react-hooks/exhaustive-deps

  if (selectedRequest) {
    return (
      <RequestDetailPanel
        request={selectedRequest}
        onBack={() => setSelectedRequest(null)}
      />
    )
  }

  return (
    <div className="px-2 space-y-4">
      {/* Enterprise: Create request button */}
      {isEnterprise && (
        <PanelActionButton
          variant="primary"
          onClick={() => setShowCreateModal(true)}
          icon={Plus}
          className="w-full py-2.5 text-[10px] font-bold uppercase tracking-widest bg-amber-600 hover:bg-amber-500 text-white shadow-[0_0_10px_rgba(217,119,6,0.3)] border-transparent"
        >
          Create Promotion Request
        </PanelActionButton>
      )}

      {/* Search */}
      <div className="relative">
        <Search size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search requests..."
          className="w-full pl-8 pr-3 py-2 rounded-lg bg-black/20 border border-white/5 text-xs text-zinc-300 placeholder:text-zinc-600 focus:outline-none focus:border-purple-500/30"
        />
      </div>

      {/* Niche tag filter */}
      <div className="flex flex-wrap gap-1.5">
        {NICHE_TAG_OPTIONS.slice(0, 10).map((tag) => (
          <button
            key={tag}
            onClick={() => {
              setNicheFilter(
                nicheFilter.includes(tag)
                  ? nicheFilter.filter((t) => t !== tag)
                  : [...nicheFilter, tag]
              )
            }}
            className={cn(
              'px-2 py-1 rounded-md text-[9px] font-bold uppercase tracking-wider border transition-all',
              nicheFilter.includes(tag)
                ? 'bg-purple-500/20 text-purple-300 border-purple-500/30'
                : 'bg-black/10 text-zinc-600 border-transparent hover:text-zinc-400 hover:bg-white/5'
            )}
          >
            {tag}
          </button>
        ))}
      </div>

      {/* Request cards */}
      {isLoadingOpen ? (
        <div className="flex flex-col items-center justify-center py-16 text-center space-y-3 opacity-50">
          <Loader2 size={24} className="text-amber-400 animate-spin" />
          <div className="text-xs font-bold text-zinc-400 uppercase tracking-widest">Loading requests...</div>
        </div>
      ) : openRequests.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center space-y-3 opacity-50">
          <Briefcase size={32} className="text-zinc-500" />
          <div className="text-xs font-bold text-zinc-400 uppercase tracking-widest">No Open Requests</div>
          <p className="text-[10px] text-zinc-600 max-w-[200px]">
            {isEnterprise
              ? 'Create your first promotion request to find creators.'
              : 'Check back later for new promotion requests from enterprises.'}
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {openRequests.map((request) => (
            <RequestCard
              key={request.id}
              request={request}
              onClick={() => setSelectedRequest(request)}
            />
          ))}
        </div>
      )}

      {/* Create request modal */}
      {showCreateModal && (
        <CreateRequestModal onClose={() => setShowCreateModal(false)} />
      )}
    </div>
  )
}

function RequestCard({ request, onClick }: { request: PromotionRequest; onClick: () => void }) {
  const remainingBudget = request.escrowed_credits - request.spent_credits
  const deadlinePassed = request.deadline && new Date(request.deadline) < new Date()

  return (
    <button
      onClick={onClick}
      className="w-full text-left rounded-xl border border-white/5 bg-black/20 p-3.5 transition-all hover:border-amber-500/20 hover:bg-black/30 group"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <h4 className="text-xs font-bold text-white truncate group-hover:text-amber-300 transition-colors">
            {request.title}
          </h4>
          <p className="text-[10px] text-zinc-400 line-clamp-2 mt-1">{request.description}</p>
        </div>
        <ChevronRight size={14} className="text-zinc-600 shrink-0 mt-0.5 group-hover:text-amber-400 transition-colors" />
      </div>

      <div className="flex items-center gap-3 mt-2.5">
        <span className="flex items-center gap-1 text-[9px] font-bold text-amber-400">
          <Coins size={10} />
          {remainingBudget.toLocaleString()} credits
        </span>
        {request.deadline && (
          <span className={cn(
            'flex items-center gap-1 text-[9px] font-bold',
            deadlinePassed ? 'text-red-400' : 'text-zinc-500'
          )}>
            <Calendar size={10} />
            {new Date(request.deadline).toLocaleDateString()}
          </span>
        )}
        {request.submission_count !== undefined && (
          <span className="flex items-center gap-1 text-[9px] font-bold text-zinc-500">
            <Users size={10} />
            {request.submission_count}/{request.max_submissions}
          </span>
        )}
      </div>

      {request.niche_tags.length > 0 && (
        <div className="flex flex-wrap gap-1 mt-2">
          {request.niche_tags.slice(0, 4).map((tag) => (
            <span key={tag} className="flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-purple-500/10 text-[8px] font-bold text-purple-400 border border-purple-500/20">
              <Tag size={8} />
              {tag}
            </span>
          ))}
          {request.niche_tags.length > 4 && (
            <span className="text-[8px] text-zinc-500">+{request.niche_tags.length - 4}</span>
          )}
        </div>
      )}
    </button>
  )
}
