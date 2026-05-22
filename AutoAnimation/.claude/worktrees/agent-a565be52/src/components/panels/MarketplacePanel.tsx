import { useCallback, useEffect, useState } from 'react'
import {
  ShoppingBag,
  Search,
  Star,
  Package,
  Users,
  Sparkles,
  Music,
  Type,
  Layers,
  ShoppingCart,
  Wand2,
  Plus,
  Trash2,
  Globe,
  Upload,
  Coins,
  Loader2,
  Eye,
  Briefcase,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { PanelLayout } from '@/components/ui/PanelHeader'
import { useMarketplaceStore, type MarketplaceCategory, type MarketplaceItem } from '@/stores/useMarketplaceStore'
import { useMarketplaceUsageStore } from '@/stores/useMarketplaceUsageStore'
import { useTimelineStore } from '@/stores'
import { useVideoLayerStore } from '@/stores/useVideoLayerStore'
import { PanelActionButton } from '@/components/ui/panel-controls'
import type { MarketplaceListing } from '@/types/marketplace'
import { useSavedAvatarCharactersStore } from '@/stores/useSavedAvatarCharactersStore'
import { useSavedPixelArtCharactersStore } from '@/stores/useSavedPixelArtCharactersStore'
import { useSavedCharactersStore } from '@/stores/useSavedCharactersStore'
import { useSaved3DCharactersStore } from '@/stores/useSaved3DCharactersStore'
import { downloadAvatarData } from '@/services/avatarCloud'
import { downloadPixelArtData } from '@/services/pixelArtCloud'
import { saveAvatarBlob, blobToUrl as avatarBlobToUrl } from '@/services/avatarDB'
import { savePixelArtBlob, blobToUrl as pixelArtBlobToUrl } from '@/services/pixelArtDB'

import { RequestsTab } from './marketplace/RequestsTab'

type PanelTab = 'local' | 'community' | 'earnings' | 'requests'

// Static "coming soon" items for the marketplace shell
interface StaticItem {
  id: string
  title: string
  description: string
  price: string
  rating: number
  reviews: number
  category: MarketplaceCategory
  icon: React.ComponentType<{ size?: number; className?: string }>
  gradientFrom: string
  gradientTo: string
}

const staticItems: StaticItem[] = [
  { id: 's1', title: 'Character Pack', description: '10 unique characters', price: '$9.99', rating: 4.8, reviews: 124, category: 'characters', icon: Users, gradientFrom: 'from-violet-600', gradientTo: 'to-purple-500' },
  { id: 's2', title: 'Lottie BG Bundle', description: '25 animations', price: '$14.99', rating: 4.9, reviews: 89, category: 'animations', icon: Sparkles, gradientFrom: 'from-indigo-600', gradientTo: 'to-blue-500' },
  { id: 's3', title: 'Sound Effects Pack', description: '50 SFX clips', price: '$4.99', rating: 4.5, reviews: 203, category: 'audio', icon: Music, gradientFrom: 'from-fuchsia-600', gradientTo: 'to-pink-500' },
  { id: 's4', title: 'Text Animation Presets', description: '15 presets', price: '$7.99', rating: 4.7, reviews: 67, category: 'text', icon: Type, gradientFrom: 'from-purple-600', gradientTo: 'to-indigo-500' },
  { id: 's5', title: 'Holiday Character Pack', description: '8 characters', price: '$12.99', rating: 4.6, reviews: 45, category: 'characters', icon: Package, gradientFrom: 'from-rose-600', gradientTo: 'to-orange-500' },
  { id: 's6', title: 'Transition Effects Pack', description: '20 transitions', price: '$6.99', rating: 4.4, reviews: 156, category: 'transitions', icon: Layers, gradientFrom: 'from-cyan-600', gradientTo: 'to-teal-500' },
]

const categories: { id: MarketplaceCategory; label: string; icon: React.ComponentType<{ size?: number; className?: string }> }[] = [
  { id: 'all', label: 'All', icon: ShoppingBag },
  { id: 'ai-animations', label: 'AI Animations', icon: Wand2 },
  { id: 'characters', label: 'Characters', icon: Users },
  { id: 'animations', label: 'Animations', icon: Sparkles },
  { id: 'audio', label: 'Audio', icon: Music },
  { id: 'text', label: 'Text', icon: Type },
  { id: 'transitions', label: 'Transitions', icon: Layers },
]

function StarRating({ rating, reviews }: { rating: number; reviews: number }) {
  return (
    <div className="flex items-center gap-1.5">
      <div className="flex items-center gap-0.5">
        {Array.from({ length: 5 }).map((_, i) => (
          <Star
            key={i}
            size={10}
            className={cn(
              i < Math.floor(rating)
                ? 'text-amber-400 fill-amber-400 drop-shadow-[0_0_2px_rgba(251,191,36,0.5)]'
                : i < rating
                  ? 'text-amber-400 fill-amber-400/50'
                  : 'text-zinc-700'
            )}
          />
        ))}
      </div>
      <span className="text-[9px] font-bold text-zinc-500 tracking-wider">({reviews})</span>
    </div>
  )
}

function StaticItemCard({ item }: { item: StaticItem }) {
  const Icon = item.icon

  return (
    <div className="rounded-2xl border border-white/5 bg-black/20 backdrop-blur-md overflow-hidden transition-all duration-300 hover:border-purple-500/30 hover:shadow-[0_0_20px_rgba(168,85,247,0.1)] group flex flex-col h-full">
      <div className={cn('aspect-[4/3] bg-gradient-to-br flex items-center justify-center relative overflow-hidden', item.gradientFrom, item.gradientTo)}>
        <Icon size={32} className="text-white drop-shadow-md group-hover:scale-110 transition-transform duration-500 ease-out" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_30%,rgba(255,255,255,0.15),transparent_60%)]" />
      </div>
      <div className="p-3.5 space-y-3 flex-1 flex flex-col justify-between">
        <div className="space-y-1">
          <div className="flex items-start justify-between gap-1">
            <div className="min-w-0">
              <h4 className="text-xs font-bold text-white truncate drop-shadow-sm">{item.title}</h4>
              <p className="text-[10px] text-zinc-400 mt-0.5">{item.description}</p>
            </div>
            <span className="text-xs font-black text-purple-400 whitespace-nowrap drop-shadow-sm">{item.price}</span>
          </div>
          <StarRating rating={item.rating} reviews={item.reviews} />
        </div>

        <PanelActionButton
          variant="secondary"
          disabled
          icon={ShoppingCart}
          onClick={() => { }}
          className="w-full text-[10px] py-2 border-purple-500/20 text-purple-300/60 font-bold uppercase tracking-widest bg-purple-500/5"
        >
          Coming Soon
        </PanelActionButton>
      </div>
    </div>
  )
}

function AIAnimationCard({ item, onImport, onDelete }: { item: MarketplaceItem; onImport: () => void; onDelete: () => void }) {
  return (
    <div className="rounded-2xl border border-white/5 bg-black/20 backdrop-blur-md overflow-hidden transition-all duration-300 hover:border-violet-500/40 hover:shadow-[0_0_20px_rgba(139,92,246,0.15)] group flex flex-col h-full">
      {/* Video thumbnail */}
      <div className="aspect-[4/3] bg-black/50 relative overflow-hidden">
        {item.videoUrl ? (
          <video
            src={item.videoUrl}
            muted
            loop
            playsInline
            preload="metadata"
            className="w-full h-full object-contain transition-transform duration-700 group-hover:scale-105"
            onMouseEnter={(e) => (e.target as HTMLVideoElement).play().catch(() => { })}
            onMouseLeave={(e) => { const v = e.target as HTMLVideoElement; v.pause(); v.currentTime = 0 }}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Wand2 size={28} className="text-violet-400/30" />
          </div>
        )}
        <div className="absolute top-2 left-2 px-2 py-1 rounded-md bg-violet-600/90 backdrop-blur-sm text-[9px] font-black text-white flex items-center gap-1 uppercase tracking-widest shadow-lg border border-white/10">
          <Wand2 size={10} />
          AI Generated
        </div>
      </div>

      {/* Content */}
      <div className="p-3.5 space-y-3 flex-1 flex flex-col justify-between">
        <div className="space-y-1">
          <div className="min-w-0">
            <h4 className="text-xs font-bold text-white truncate drop-shadow-sm">{item.title}</h4>
            <p className="text-[10px] text-zinc-400 line-clamp-2 mt-0.5" title={item.description}>{item.description}</p>
          </div>
          <p className="text-[9px] font-bold text-zinc-600 uppercase tracking-widest">
            {new Date(item.createdAt).toLocaleDateString()}
          </p>
        </div>

        {/* Actions */}
        <div className="flex gap-2">
          <PanelActionButton
            variant="primary"
            onClick={onImport}
            icon={Plus}
            className="flex-1 py-2 text-[10px] font-bold uppercase tracking-widest bg-violet-600 hover:bg-violet-500 text-white shadow-[0_0_10px_rgba(139,92,246,0.3)] border-transparent"
          >
            Import
          </PanelActionButton>
          <PanelActionButton
            variant="secondary"
            onClick={onDelete}
            icon={Trash2}
            className="px-3 py-2 text-zinc-500 hover:text-red-400 hover:bg-red-500/10 hover:border-red-500/20 transition-all"
          >
            <></>
          </PanelActionButton>
        </div>
      </div>
    </div>
  )
}

function getCharacterTypeBadge(listing: MarketplaceListing): string | null {
  const meta = listing.metadata as Record<string, unknown> | undefined
  if (!meta?.characterType) return null
  const labels: Record<string, string> = { '2d': '2D', '3d': '3D', '1d': 'Pixel', avatar: 'Avatar' }
  return labels[meta.characterType as string] || null
}

function CommunityListingCard({ listing, onImport }: { listing: MarketplaceListing; onImport: () => void }) {
  const charBadge = getCharacterTypeBadge(listing)
  const isCharacter = listing.category === 'characters' || listing.category === '3d-characters'

  return (
    <div className="rounded-2xl border border-white/5 bg-black/20 backdrop-blur-md overflow-hidden transition-all duration-300 hover:border-emerald-500/30 hover:shadow-[0_0_20px_rgba(52,211,153,0.1)] group flex flex-col h-full">
      <div className="aspect-[4/3] bg-gradient-to-br from-emerald-900/40 to-teal-900/40 relative overflow-hidden flex items-center justify-center">
        {listing.thumbnail_url ? (
          <img src={listing.thumbnail_url} alt={listing.title} className="w-full h-full object-cover" />
        ) : isCharacter ? (
          <Users size={28} className="text-emerald-400/30" />
        ) : (
          <Globe size={28} className="text-emerald-400/30" />
        )}
        <div className="absolute top-2 left-2 px-2 py-1 rounded-md bg-emerald-600/90 backdrop-blur-sm text-[9px] font-black text-white flex items-center gap-1 uppercase tracking-widest shadow-lg border border-white/10">
          {isCharacter ? <Users size={10} /> : <Globe size={10} />}
          {isCharacter ? 'Character' : 'Community'}
        </div>
        {charBadge && (
          <div className="absolute bottom-2 left-2 px-1.5 py-0.5 rounded-md bg-violet-600/90 backdrop-blur-sm text-[9px] font-bold text-white">
            {charBadge}
          </div>
        )}
        {listing.use_count > 0 && (
          <div className="absolute top-2 right-2 px-1.5 py-0.5 rounded-md bg-black/60 backdrop-blur-sm text-[9px] font-bold text-zinc-300 flex items-center gap-1">
            <Eye size={9} />
            {listing.use_count}
          </div>
        )}
      </div>
      <div className="p-3.5 space-y-3 flex-1 flex flex-col justify-between">
        <div className="space-y-1">
          <h4 className="text-xs font-bold text-white truncate drop-shadow-sm">{listing.title}</h4>
          <p className="text-[10px] text-zinc-400 line-clamp-2" title={listing.description}>{listing.description}</p>
          <p className="text-[9px] font-bold text-emerald-500/60 uppercase tracking-widest">
            by {listing.creator_email?.split('@')[0] || 'Creator'}
          </p>
        </div>
        <PanelActionButton
          variant="primary"
          onClick={onImport}
          icon={Plus}
          className="w-full py-2 text-[10px] font-bold uppercase tracking-widest bg-emerald-600 hover:bg-emerald-500 text-white shadow-[0_0_10px_rgba(52,211,153,0.3)] border-transparent"
        >
          {isCharacter ? 'Import Character' : 'Import'}
        </PanelActionButton>
      </div>
    </div>
  )
}

function EarningsTab() {
  const { earnings, myListings, fetchEarnings, fetchMyListings, deleteServerListing } = useMarketplaceStore()
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    if (!loaded) {
      fetchEarnings()
      fetchMyListings()
      setLoaded(true)
    }
  }, [loaded, fetchEarnings, fetchMyListings])

  return (
    <div className="px-2 space-y-4">
      {/* Earnings summary */}
      <div className="rounded-xl border border-emerald-500/20 bg-emerald-900/10 p-4 space-y-2">
        <div className="flex items-center gap-2">
          <Coins size={16} className="text-emerald-400" />
          <span className="text-xs font-bold text-emerald-300 uppercase tracking-widest">Creator Earnings</span>
        </div>
        <div className="text-2xl font-black text-emerald-400">
          {earnings?.total_credits_earned ?? 0}
          <span className="text-xs font-bold text-emerald-500/60 ml-1">credits earned</span>
        </div>
        <p className="text-[10px] text-zinc-500">
          {earnings?.royalty_count ?? 0} royalty payment{(earnings?.royalty_count ?? 0) !== 1 ? 's' : ''} received
        </p>
      </div>

      {/* My listings */}
      <div className="space-y-2">
        <h3 className="text-[10px] font-bold text-purple-400 uppercase tracking-widest flex items-center gap-1.5 px-1">
          <Upload size={12} />
          My Published Assets ({myListings.length})
        </h3>
        {myListings.length === 0 ? (
          <p className="text-[10px] text-zinc-500 px-1">
            No assets published yet. Import items to your library and publish them to the community.
          </p>
        ) : (
          <div className="space-y-2">
            {myListings.map((listing) => (
              <div key={listing.id} className="flex items-center justify-between gap-2 p-2.5 rounded-lg border border-white/5 bg-black/20">
                <div className="min-w-0 flex-1">
                  <h4 className="text-[11px] font-bold text-white truncate">{listing.title}</h4>
                  <div className="flex items-center gap-3 mt-0.5">
                    <span className="text-[9px] text-zinc-500 uppercase tracking-widest">{listing.category}</span>
                    <span className="text-[9px] text-emerald-500 flex items-center gap-0.5">
                      <Eye size={9} /> {listing.use_count} uses
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => deleteServerListing(listing.id)}
                  className="p-1.5 rounded-md text-zinc-600 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                  title="Delete listing"
                >
                  <Trash2 size={12} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Recent royalty payments */}
      {earnings && earnings.recent_royalties.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest flex items-center gap-1.5 px-1">
            <Coins size={12} />
            Recent Payments
          </h3>
          <div className="space-y-1">
            {earnings.recent_royalties.slice(0, 10).map((r, i) => (
              <div key={i} className="flex items-center justify-between px-2 py-1.5 rounded-md bg-black/10">
                <span className="text-[10px] text-zinc-400">
                  {new Date(r.created_at).toLocaleDateString()}
                </span>
                <span className="text-[10px] font-bold text-emerald-400">+{r.credits_granted} credits</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export function MarketplacePanel() {
  const { items, activeCategory, searchQuery, setActiveCategory, setSearchQuery, removeItem, serverListings, isLoadingServer, fetchServerListings } = useMarketplaceStore()
  const recordMarketplaceUsage = useMarketplaceUsageStore((s) => s.recordUsage)
  const addClip = useTimelineStore((s) => s.addClip)
  const timelineFps = useTimelineStore((s) => s.fps)
  const addVideo = useVideoLayerStore((s) => s.addVideo)
  const [searchOpen, setSearchOpen] = useState(false)
  const [activeTab, setActiveTab] = useState<PanelTab>('local')

  // Fetch community listings when switching to that tab
  useEffect(() => {
    if (activeTab === 'community') {
      fetchServerListings(activeCategory === 'all' ? undefined : activeCategory as any, searchQuery || undefined)
    }
  }, [activeTab, activeCategory, searchQuery, fetchServerListings])

  const handleImportFromMarketplace = useCallback((item: MarketplaceItem) => {
    if (!item.videoUrl) return

    // Track marketplace usage if this is a server-backed item
    if (item.listingId) {
      recordMarketplaceUsage(item.listingId)
    }

    const totalFrames = Math.round((item.durationSeconds || 10) * timelineFps)
    const clipId = `mp-${item.id}-${Date.now()}`

    addClip('video-1', {
      id: clipId,
      trackId: 'video-1',
      startFrame: 0,
      endFrame: totalFrames,
      sourceId: item.videoUrl,
      sourceInPoint: 0,
      sourceOutPoint: totalFrames,
      name: item.title,
      color: '#8b5cf6',
    })

    addVideo({
      id: `canvas-${clipId}`,
      sourceUrl: item.videoUrl,
      name: item.title,
      prompt: item.prompt || '',
      position: { x: 0, y: 0 },
      scale: 1,
      opacity: 1,
      zIndex: 3,
      visible: true,
      loop: false,
      durationSeconds: item.durationSeconds || 10,
      fps: item.fps || 30,
      width: item.width || 1920,
      height: item.height || 1080,
    })
  }, [addClip, addVideo, timelineFps, recordMarketplaceUsage])

  const handleImportCommunityListing = useCallback(async (listing: MarketplaceListing) => {
    // Record usage for royalty tracking
    recordMarketplaceUsage(listing.id)

    const meta = listing.metadata as Record<string, unknown> | undefined
    const charType = meta?.characterType as string | undefined
    const isCharacterListing = listing.category === 'characters' || listing.category === '3d-characters'

    // Handle character imports — add to the appropriate saved characters store
    if (isCharacterListing && charType) {
      try {
        const charId = meta?.characterId as string
        if (!charId) throw new Error('No characterId in listing metadata')

        if (charType === 'avatar') {
          const data = await downloadAvatarData(charId)
          if (data) {
            const { character, blob: blobDataUrl } = data
            if (blobDataUrl && character.baseBlobId) {
              const [header, base64] = blobDataUrl.split(',')
              const mime = header.match(/:(.*?);/)?.[1] || 'image/png'
              const binary = atob(base64)
              const array = new Uint8Array(binary.length)
              for (let i = 0; i < binary.length; i++) array[i] = binary.charCodeAt(i)
              const blob = new Blob([array], { type: mime })
              await saveAvatarBlob(character.baseBlobId, blob)
              const url = avatarBlobToUrl(blob)
              useSavedAvatarCharactersStore.getState().setBlobUrl(character.baseBlobId, url)
            }
            useSavedAvatarCharactersStore.setState((s) => ({
              characters: [...s.characters, character],
            }))
          }
        } else if (charType === '1d') {
          const data = await downloadPixelArtData(charId)
          if (data) {
            const { character, blobs } = data
            // Save blobs to IndexedDB
            for (const [direction, dataUrl] of Object.entries(blobs.directionBlobs || {})) {
              const blobId = character.directionBlobIds[direction as keyof typeof character.directionBlobIds]
              if (blobId && dataUrl) {
                const [header, base64] = dataUrl.split(',')
                const mime = header.match(/:(.*?);/)?.[1] || 'image/png'
                const binary = atob(base64)
                const array = new Uint8Array(binary.length)
                for (let i = 0; i < binary.length; i++) array[i] = binary.charCodeAt(i)
                const blob = new Blob([array], { type: mime })
                await savePixelArtBlob(blobId, blob)
                const url = pixelArtBlobToUrl(blob)
                useSavedPixelArtCharactersStore.getState().setBlobUrl(blobId, url)
              }
            }
            useSavedPixelArtCharactersStore.setState((s) => ({
              characters: [...s.characters, character],
            }))
          }
        } else if (charType === '2d') {
          // 2D characters use charactersCloud — download via the cloud service
          const { downloadCharacterImages } = await import('@/services/charactersCloud')
          const { saveCharacterImages } = await import('@/services/characterDB')
          const imageData = await downloadCharacterImages(charId)
          if (imageData) {
            await saveCharacterImages(charId, imageData)
            const character = {
              id: charId,
              name: listing.title,
              stylePrompt: (meta?.stylePrompt as string) || '',
              createdAt: new Date(listing.created_at).getTime(),
              referenceImage: imageData.referenceImage || '',
              curvedVisemes: imageData.curvedVisemes || {},
              _hydrated: true,
              _cloudSynced: false,
            }
            useSavedCharactersStore.setState((s) => ({
              characters: [...s.characters, character as any],
            }))
          }
        } else if (charType === '3d') {
          // 3D characters use characters3dCloud
          const { download3DCharacterMeta, download3DCharacterGlb } = await import('@/services/characters3dCloud')
          const { save3DBlob, blobToUrl } = await import('@/services/character3dDB')
          const [charMeta, glbBlob] = await Promise.all([
            download3DCharacterMeta(charId),
            download3DCharacterGlb(charId),
          ])
          if (charMeta && glbBlob) {
            await save3DBlob(charMeta.glbBlobId, glbBlob)
            const url = blobToUrl(glbBlob)
            useSaved3DCharactersStore.getState().setBlobUrl(charMeta.glbBlobId, url)
            useSaved3DCharactersStore.setState((s) => ({
              characters: [...s.characters, charMeta],
            }))
          }
        }
        return
      } catch (err) {
        console.warn('[Marketplace] Character import failed, falling back to generic import:', err)
      }
    }

    // Default: add to local store as a marketplace item
    const item: MarketplaceItem = {
      id: `community-${listing.id}`,
      title: listing.title,
      description: listing.description,
      category: listing.category as MarketplaceCategory,
      thumbnailUrl: listing.thumbnail_url || undefined,
      listingId: listing.id,
      creatorId: listing.creator_id,
      creatorName: listing.creator_email?.split('@')[0],
      useCount: listing.use_count,
      createdAt: new Date(listing.created_at).getTime(),
      ...(listing.metadata as Record<string, unknown>),
    }
    useMarketplaceStore.getState().addItem(item)
  }, [recordMarketplaceUsage])

  // Filter AI animation items from the store
  const aiAnimationItems = items.filter((item) => {
    const matchesCategory = activeCategory === 'all' || activeCategory === 'ai-animations'
    const matchesSearch = searchQuery === '' ||
      item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.prompt || '').toLowerCase().includes(searchQuery.toLowerCase())
    return item.category === 'ai-animations' && matchesSearch && matchesCategory
  })

  // Filter static items
  const filteredStaticItems = staticItems.filter((item) => {
    if (activeCategory === 'ai-animations') return false
    const matchesCategory = activeCategory === 'all' || item.category === activeCategory
    const matchesSearch = searchQuery === '' ||
      item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.description.toLowerCase().includes(searchQuery.toLowerCase())
    return matchesCategory && matchesSearch
  })

  const hasUserContent = items.length > 0

  return (
    <PanelLayout
      icon={ShoppingBag}
      title="Library"
      iconClassName="text-purple-400 drop-shadow-[0_0_8px_rgba(168,85,247,0.5)]"
      trailing={
        <div className="flex items-center gap-2">
          {hasUserContent && (
            <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest bg-black/20 px-2 py-1 rounded-md border border-white/5">{items.length} Saved</span>
          )}
          <button
            onClick={() => setSearchOpen(true)}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-white/10 transition-colors"
            title="Search"
          >
            <Search size={16} />
          </button>
        </div>
      }
      searchBar={{
        isOpen: searchOpen,
        onToggle: () => { setSearchOpen(false); setSearchQuery('') },
        query: searchQuery,
        onQueryChange: setSearchQuery,
        placeholder: 'Search library...',
      }}
    >

      {/* ── Tab switcher ── */}
      <div className="flex items-center gap-1 px-2 mb-3">
        {([
          { id: 'local' as PanelTab, label: 'My Library', icon: ShoppingBag },
          { id: 'community' as PanelTab, label: 'Community', icon: Globe },
          { id: 'requests' as PanelTab, label: 'Requests', icon: Briefcase },
          { id: 'earnings' as PanelTab, label: 'Earnings', icon: Coins },
        ]).map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all duration-200 border',
              activeTab === tab.id
                ? 'bg-purple-500/20 text-purple-300 border-purple-500/30'
                : 'bg-black/10 text-zinc-500 border-transparent hover:text-zinc-300 hover:bg-white/5'
            )}
          >
            <tab.icon size={11} />
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'requests' ? (
        <RequestsTab />
      ) : activeTab === 'earnings' ? (
        <EarningsTab />
      ) : (
        <>
          {/* ── Filter pills ── */}
          <div className="flex items-center gap-1.5 flex-wrap px-2">
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                className={cn(
                  'flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[10px] font-bold uppercase tracking-wider transition-all duration-200 border',
                  activeCategory === cat.id
                    ? 'bg-purple-500 text-white border-purple-400 shadow-[0_0_12px_rgba(168,85,247,0.4)]'
                    : 'bg-black/20 text-zinc-400 border-white/5 hover:text-white hover:bg-white/10 hover:border-white/10'
                )}
              >
                <cat.icon size={12} className={activeCategory === cat.id ? 'text-white' : 'text-zinc-500'} />
                {cat.label}
                {cat.id === 'ai-animations' && items.length > 0 && activeTab === 'local' && (
                  <span className={cn(
                    "px-1.5 py-0.5 rounded-md text-[9px]",
                    activeCategory === cat.id ? "bg-black/20 text-white" : "bg-white/10 text-zinc-300"
                  )}>
                    {items.length}
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* ── Community tab content ── */}
          {activeTab === 'community' && (
            <div className="px-2 mt-4 space-y-4">
              {isLoadingServer ? (
                <div className="flex flex-col items-center justify-center py-16 text-center space-y-3 opacity-50">
                  <Loader2 size={24} className="text-emerald-400 animate-spin" />
                  <div className="text-xs font-bold text-zinc-400 uppercase tracking-widest">Loading community assets...</div>
                </div>
              ) : serverListings.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-center space-y-3 opacity-50">
                  <Globe size={32} className="text-zinc-500" />
                  <div className="text-xs font-bold text-zinc-400 uppercase tracking-widest">No Community Assets Yet</div>
                  <p className="text-[10px] text-zinc-600 max-w-[200px]">Publish your creations to share with the community and earn royalties.</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-3">
                  {serverListings.map((listing) => (
                    <CommunityListingCard
                      key={listing.id}
                      listing={listing}
                      onImport={() => handleImportCommunityListing(listing)}
                    />
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ── Local tab content ── */}
          {activeTab === 'local' && (
            <div className="px-2 mt-4 space-y-6">
              {aiAnimationItems.length === 0 && filteredStaticItems.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-center space-y-3 opacity-50">
                  <Search size={32} className="text-zinc-500" />
                  <div className="text-xs font-bold text-zinc-400 uppercase tracking-widest">
                    {activeCategory === 'ai-animations'
                      ? 'No AI Animations Saved'
                      : 'No Items Found'}
                  </div>
                </div>
              ) : (
                <>
                  {/* AI Animation items */}
                  {aiAnimationItems.length > 0 && (
                    <div className="space-y-3">
                      {activeCategory === 'all' && (
                        <h3 className="text-[10px] font-bold text-violet-400 uppercase tracking-widest flex items-center gap-1.5 px-1 bg-violet-500/10 w-fit py-1 pr-3 rounded-md border border-violet-500/20">
                          <Wand2 size={12} />
                          Generated By You
                        </h3>
                      )}
                      <div className="grid grid-cols-2 gap-3">
                        {aiAnimationItems.map((item) => (
                          <AIAnimationCard
                            key={item.id}
                            item={item}
                            onImport={() => handleImportFromMarketplace(item)}
                            onDelete={() => removeItem(item.id)}
                          />
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Static marketplace items */}
                  {filteredStaticItems.length > 0 && (
                    <div className="space-y-3">
                      {activeCategory === 'all' && aiAnimationItems.length > 0 && (
                        <h3 className="text-[10px] font-bold text-purple-400 uppercase tracking-widest flex items-center gap-1.5 px-1 bg-purple-500/10 w-fit py-1 pr-3 rounded-md border border-purple-500/20 mt-6">
                          <ShoppingBag size={12} />
                          Store
                        </h3>
                      )}
                      <div className="grid grid-cols-2 gap-3">
                        {filteredStaticItems.map((item) => (
                          <StaticItemCard key={item.id} item={item} />
                        ))}
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          )}
        </>
      )}

      {/* Footer */}
      {activeTab === 'local' && filteredStaticItems.length > 0 && (
        <div className="mt-8 pt-6 pb-2 border-t border-white/5 flex flex-col items-center justify-center gap-2">
          <Sparkles size={16} className="text-zinc-600" />
          <p className="text-[9px] font-bold text-zinc-600 uppercase tracking-widest text-center">
            More content arriving soon
          </p>
        </div>
      )}
    </PanelLayout>
  )
}
