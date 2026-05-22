/**
 * Motion library panel for browsing, previewing, and applying animations.
 * Shows saved animations from use3DAnimationStore, HunyuanMotion-generated clips,
 * and supports import from file (GLB/FBX with animation).
 */
import { useState, useMemo, useRef, useCallback } from 'react'
import { Search, Play, Upload, Sparkles } from 'lucide-react'
import { use3DAnimationStore } from '@/stores/use3DAnimationStore'
import { use3DRigStore } from '@/stores/use3DRigStore'
import { use3DCharacterStore } from '@/stores/use3DCharacterStore'
import { get3DBlob, save3DBlob, blobToUrl, isGlbBlob } from '@/services/character3dDB'
import { loadGLTF } from '@/services/gltfUtils'
import { convertFbxBlobToGlb } from '@/services/fbxConverter'
import type { Animation3D } from '@/types/character3d'

type FilterCategory = 'all' | 'generated' | 'imported' | 'retargeted'

export function MotionLibraryPanel() {
  const animations = use3DAnimationStore((s) => s.animations)
  const addAnimation = use3DAnimationStore((s) => s.addAnimation)
  const selectAnimation = use3DAnimationStore((s) => s.selectAnimation)
  const selectedAnimationId = use3DAnimationStore((s) => s.selectedAnimationId)
  const activeRig = use3DRigStore((s) => s.getActiveRig())
  const activeCharacterId = activeRig?.characterId ?? null

  const [searchQuery, setSearchQuery] = useState('')
  const [category, setCategory] = useState<FilterCategory>('all')
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleImportFile = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const lower = file.name.toLowerCase()
    const isFbx = lower.endsWith('.fbx')
    const isGlb = lower.endsWith('.glb') || lower.endsWith('.gltf')
    if (!isGlb && !isFbx) return

    try {
      let glbBlob: Blob
      if (isFbx) {
        glbBlob = await convertFbxBlobToGlb(file)
      } else {
        glbBlob = file
      }

      const blobUrl = blobToUrl(glbBlob)
      const gltf = await loadGLTF(blobUrl)

      // Extract animation duration from the first clip
      const clip = gltf.animations?.[0]
      const durationSeconds = clip ? clip.duration : 0

      const blobId = `anim_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`
      await save3DBlob(blobId, glbBlob)
      use3DAnimationStore.getState().setBlobUrl(blobId, blobUrl)

      const anim: Animation3D = {
        id: `anim3d_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
        name: file.name.replace(/\.(glb|gltf|fbx)$/i, ''),
        glbBlobId: blobId,
        durationSeconds,
        fps: 30,
        source: 'imported',
        tags: ['imported'],
        createdAt: Date.now(),
      }
      addAnimation(anim)
    } catch (err) {
      console.error('[MotionLibrary] Failed to import animation:', err)
    }

    // Reset input so the same file can be re-selected
    e.target.value = ''
  }, [addAnimation])

  const filteredAnimations = useMemo(() => {
    let filtered = animations

    // Category filter
    if (category !== 'all') {
      filtered = filtered.filter((a) => {
        if (category === 'generated') return a.source === 'hunyuan-motion'
        if (category === 'imported') return a.source === 'imported' || a.source === 'model-embedded'
        if (category === 'retargeted') return a.source === 'retargeted'
        return true
      })
    }

    // Search filter
    if (searchQuery) {
      const q = searchQuery.toLowerCase()
      filtered = filtered.filter(
        (a) =>
          a.name.toLowerCase().includes(q) ||
          (a.tags && a.tags.some((t: string) => t.toLowerCase().includes(q)))
      )
    }

    return filtered
  }, [animations, searchQuery, category])

  return (
    <div className="flex flex-col gap-3 p-3">
      {/* Header */}
      <div className="flex items-center gap-1.5">
        <Sparkles size={14} className="text-green-400" />
        <span className="text-xs text-zinc-300 font-medium">Motion Library</span>
        <span className="text-xs text-zinc-600 ml-auto">{animations.length} clips</span>
      </div>

      {/* Search */}
      <div className="relative">
        <Search size={12} className="absolute left-2 top-1/2 -translate-y-1/2 text-zinc-600" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search animations..."
          className="w-full pl-7 pr-2 py-1.5 text-xs bg-zinc-800 border border-zinc-700 rounded-lg text-zinc-300 placeholder:text-zinc-600 focus:outline-none focus:border-green-500"
        />
      </div>

      {/* Category filter */}
      <div className="flex gap-1">
        {(['all', 'generated', 'imported', 'retargeted'] as FilterCategory[]).map((cat) => (
          <button
            key={cat}
            onClick={() => setCategory(cat)}
            className={`px-2 py-1 text-xs rounded-full transition-colors ${
              category === cat
                ? 'bg-white text-black'
                : 'text-zinc-400 hover:text-zinc-300 hover:bg-zinc-800'
            }`}
          >
            {cat === 'all' ? 'All' : cat.charAt(0).toUpperCase() + cat.slice(1)}
          </button>
        ))}
      </div>

      {/* Animation list */}
      <div className="flex flex-col gap-1 max-h-[400px] overflow-y-auto">
        {filteredAnimations.length === 0 ? (
          <div className="text-center py-6 text-xs text-zinc-600">
            {searchQuery ? 'No animations match your search.' : 'No animations in library.'}
          </div>
        ) : (
          filteredAnimations.map((anim) => (
            <AnimationCard
              key={anim.id}
              animation={anim}
              isSelected={anim.id === selectedAnimationId}
              onSelect={() => selectAnimation(anim.id)}
              hasActiveRig={!!activeRig}
              activeCharacterId={activeCharacterId}
            />
          ))
        )}
      </div>

      {/* Import button */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".glb,.gltf,.fbx"
        onChange={handleImportFile}
        className="hidden"
      />
      <button
        onClick={() => fileInputRef.current?.click()}
        className="flex items-center justify-center gap-1.5 w-full px-3 py-2 text-xs bg-zinc-800 hover:bg-zinc-700 text-zinc-400 rounded-lg transition-colors border border-dashed border-zinc-700"
      >
        <Upload size={12} />
        Import Animation (GLB/FBX)
      </button>
    </div>
  )
}

// ─── Animation Card ─────────────────────────────────────────────────────────

function AnimationCard({
  animation,
  isSelected,
  onSelect,
  hasActiveRig,
  activeCharacterId,
}: {
  animation: any
  isSelected: boolean
  onSelect: () => void
  hasActiveRig: boolean
  activeCharacterId: string | null
}) {
  const sourceLabel = {
    'hunyuan-motion': 'HunyuanMotion',
    'imported': 'Imported',
    'model-embedded': 'Model',
    'retargeted': 'Retargeted',
  }[animation.source as string] || animation.source

  const sourceColor = {
    'hunyuan-motion': 'text-purple-400',
    'imported': 'text-blue-400',
    'model-embedded': 'text-zinc-400',
    'retargeted': 'text-green-400',
  }[animation.source as string] || 'text-zinc-400'

  return (
    <div
      onClick={onSelect}
      className={`flex items-center gap-2 px-2 py-2 rounded-lg cursor-pointer transition-colors ${
        isSelected
          ? 'bg-green-500/10 border border-green-500/30'
          : 'hover:bg-zinc-800 border border-transparent'
      }`}
    >
      {/* Thumbnail placeholder */}
      <div className="w-10 h-10 rounded-lg bg-zinc-800 flex items-center justify-center shrink-0">
        <Play size={14} className="text-zinc-600" />
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="text-xs text-zinc-300 truncate">{animation.name}</div>
        <div className="flex items-center gap-2 mt-0.5">
          <span className={`text-xs ${sourceColor}`}>{sourceLabel}</span>
          {animation.durationSeconds && (
            <span className="text-xs text-zinc-600">
              {animation.durationSeconds.toFixed(1)}s
            </span>
          )}
        </div>
        {/* Tags */}
        {animation.tags && animation.tags.length > 0 && (
          <div className="flex gap-1 mt-0.5 flex-wrap">
            {animation.tags.slice(0, 3).map((tag: string) => (
              <span
                key={tag}
                className="text-xs px-1 py-0 rounded-lg bg-zinc-800 text-zinc-500"
              >
                {tag}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Apply button */}
      {hasActiveRig && (
        <button
          onClick={(e) => {
            e.stopPropagation()
            if (!activeCharacterId) return

            // Ensure blob URL is hydrated and valid GLB
            const existingUrl = use3DAnimationStore.getState().getBlobUrl(animation.glbBlobId)
            if (!existingUrl) {
              get3DBlob(animation.glbBlobId).then(async (blob) => {
                if (blob) {
                  if (!(await isGlbBlob(blob))) {
                    console.warn('[MotionLibrary] Skipping non-GLB blob for', animation.glbBlobId)
                    return
                  }
                  const url = blobToUrl(blob)
                  use3DAnimationStore.getState().setBlobUrl(animation.glbBlobId, url)
                }
              })
            }

            use3DCharacterStore.getState().playAnimation(activeCharacterId, animation.id)
          }}
          className="px-2 py-1 text-xs bg-green-600 hover:bg-green-500 text-white rounded-lg transition-colors shrink-0"
          title="Apply to character"
        >
          Apply
        </button>
      )}
    </div>
  )
}
