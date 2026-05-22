import { Package, Trash2, User } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useBundleStore } from '@/stores/useBundleStore'
import { useSavedCharactersStore, type SavedCharacter } from '@/stores/useSavedCharactersStore'
import { useSaved3DCharactersStore } from '@/stores/useSaved3DCharactersStore'
import { useSavedPixelArtCharactersStore } from '@/stores/useSavedPixelArtCharactersStore'
import { useSavedAvatarCharactersStore } from '@/stores/useSavedAvatarCharactersStore'

const TYPE_BADGE: Record<string, { label: string; color: string }> = {
  '2d': { label: '2D', color: 'bg-green-500/20 text-green-400' },
  '3d': { label: '3D', color: 'bg-blue-500/20 text-blue-400' },
  '1d': { label: '1D', color: 'bg-purple-500/20 text-purple-400' },
  avatar: { label: 'AV', color: 'bg-orange-500/20 text-orange-400' },
}

const isValidSrc = (url: string | null | undefined): url is string =>
  !!url &&
  url.length > 300 &&
  (url.startsWith('http') || url.startsWith('blob:') || (url.startsWith('data:image/') && url.includes(';base64,')))

/** Get best quality thumbnail for a 2D character: body sprite > referenceImage > _thumbnail */
function get2DThumb(c: SavedCharacter): string | null {
  // Full-res body part sprite (best quality)
  if (c.bodyParts) {
    const sel = c.selectedSprites
    const bodyIdx = sel?.body ?? 0
    const candidates = [
      c.bodyParts.body?.[bodyIdx],
      c.bodyParts.body?.[0],
      c.bodyParts.eye?.[sel?.eye ?? 0],
      c.bodyParts.eye?.[0],
    ]
    for (const src of candidates) {
      if (isValidSrc(src)) return src
    }
  }
  if (isValidSrc(c.referenceImage)) return c.referenceImage
  if (c._thumbnail && c._thumbnail.startsWith('data:image/')) return c._thumbnail
  return null
}

function resolveCharThumb(
  charId: string,
  type: string,
  chars2D: SavedCharacter[],
  chars3D: { id: string; thumbnailDataUrl?: string }[],
  chars1D: { id: string; thumbnailDataUrl?: string }[],
  charsAV: { id: string; thumbnailDataUrl?: string }[],
): string | null {
  if (type === '2d') {
    const c = chars2D.find((x) => x.id === charId)
    return c ? get2DThumb(c) : null
  }
  if (type === '3d') return chars3D.find((x) => x.id === charId)?.thumbnailDataUrl || null
  if (type === '1d') return chars1D.find((x) => x.id === charId)?.thumbnailDataUrl || null
  if (type === 'avatar') return charsAV.find((x) => x.id === charId)?.thumbnailDataUrl || null
  return null
}

/** Composite 2D character preview — same layer approach as left-panel character grid */
function Char2DComposite({ char }: { char: SavedCharacter }) {
  const bp = char.bodyParts
  if (!bp) return null
  const sel = char.selectedSprites
  const pt = char.partTransforms as
    | Record<string, { x: number; y: number; rotation: number; scaleX: number; scaleY: number; visible: boolean }>
    | undefined
  const thumbLayers: { part: string; src: string | undefined; zBase: number }[] = [
    { part: 'body', src: bp.body?.[sel?.body ?? 0] || bp.body?.[0], zBase: 0 },
    { part: 'shoes', src: bp.shoes?.[sel?.shoes ?? 0] || bp.shoes?.[0], zBase: 1 },
    { part: 'pants', src: bp.pants?.[sel?.pants ?? 0] || bp.pants?.[0], zBase: 2 },
    { part: 'shirt', src: bp.shirt?.[sel?.shirt ?? 0] || bp.shirt?.[0], zBase: 3 },
    {
      part: 'head',
      src: bp.head?.[(sel as Record<string, number | null> | undefined)?.head ?? 0] || bp.head?.[0],
      zBase: 4,
    },
    { part: 'eye', src: bp.eye?.[sel?.eye ?? 0] || bp.eye?.[0], zBase: 5 },
    { part: 'eyebrow', src: bp.eyebrow?.[sel?.eyebrow ?? 0] || bp.eyebrow?.[0], zBase: 6 },
    { part: 'viseme', src: bp.viseme?.[sel?.viseme ?? 0] || bp.viseme?.[0], zBase: 7 },
    { part: 'hair', src: bp.hair?.[sel?.hair ?? 0] || bp.hair?.[0], zBase: 8 },
  ]
  return (
    <>
      {thumbLayers.map(({ part, src, zBase }) => {
        if (!src || !isValidSrc(src)) return null
        const t = pt?.[part]
        if (t && !t.visible) return null
        return (
          <img
            key={part}
            src={src}
            alt={part}
            className="absolute inset-0 w-full h-full object-contain"
            style={{
              zIndex: zBase,
              ...(t
                ? {
                    transform: `translate(${(t.x / 200) * 100}%, ${(t.y / 200) * 100}%) rotate(${t.rotation}deg) scale(${t.scaleX}, ${t.scaleY})`,
                    transformOrigin: 'center center',
                  }
                : {}),
            }}
          />
        )
      })}
    </>
  )
}

function resolveCharName(
  charId: string,
  type: string,
  chars2D: { id: string; name: string }[],
  chars3D: { id: string; name: string }[],
  chars1D: { id: string; name: string }[],
  charsAV: { id: string; name: string }[],
): string {
  if (type === '2d') return chars2D.find((x) => x.id === charId)?.name || 'Unknown'
  if (type === '3d') return chars3D.find((x) => x.id === charId)?.name || 'Unknown'
  if (type === '1d') return chars1D.find((x) => x.id === charId)?.name || 'Unknown'
  if (type === 'avatar') return charsAV.find((x) => x.id === charId)?.name || 'Unknown'
  return 'Unknown'
}

export function BundleDetailsPanel() {
  const selectedBundleId = useBundleStore((s) => s.selectedBundleId)
  const bundle = useBundleStore((s) => s.bundles.find((b) => b.id === selectedBundleId))
  const removeCharacterFromBundle = useBundleStore((s) => s.removeCharacterFromBundle)
  const removeBundle = useBundleStore((s) => s.removeBundle)
  const selectBundle = useBundleStore((s) => s.selectBundle)

  const chars2D = useSavedCharactersStore((s) => s.characters)
  const chars3D = useSaved3DCharactersStore((s) => s.characters)
  const chars1D = useSavedPixelArtCharactersStore((s) => s.characters)
  const charsAV = useSavedAvatarCharactersStore((s) => s.characters)

  if (!bundle) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-gray-600">
        <Package size={28} className="mb-3 text-zinc-600" />
        <span className="text-sm text-gray-400">No bundle selected</span>
      </div>
    )
  }

  const thumbSrc =
    bundle.thumbnail ||
    (() => {
      if (bundle.characters.length === 0) return null
      const first = bundle.characters[0]
      return resolveCharThumb(first.id, first.type, chars2D, chars3D, chars1D, charsAV)
    })()

  return (
    <div className="flex flex-col h-full">
      {/* Bundle thumbnail */}
      <div className="w-full aspect-square bg-[#1a1a1a] relative overflow-hidden">
        {thumbSrc ? (
          <img src={thumbSrc} alt={bundle.name} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Package size={48} className="text-zinc-700" />
          </div>
        )}
        <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/70 to-transparent px-3 py-2">
          <p className="text-sm font-medium text-white">{bundle.name}</p>
          <p className="text-[10px] text-gray-400">
            {bundle.characters.length} character{bundle.characters.length !== 1 ? 's' : ''}
          </p>
        </div>
      </div>

      {/* Description */}
      {bundle.description && (
        <div className="px-3 py-2 border-b border-white/5">
          <p className="text-[11px] text-gray-500 leading-relaxed">{bundle.description}</p>
        </div>
      )}

      {/* Characters list */}
      <div className="flex-1 overflow-y-auto px-3 py-2">
        <p className="text-[10px] text-zinc-500 uppercase tracking-wider font-medium mb-2">Characters</p>
        <div className="grid grid-cols-2 gap-2">
          {bundle.characters.map((charRef) => {
            const name = resolveCharName(charRef.id, charRef.type, chars2D, chars3D, chars1D, charsAV)
            const badge = TYPE_BADGE[charRef.type]
            // For 2D: composite body parts. For others: single thumbnail.
            const char2D = charRef.type === '2d' ? chars2D.find((c) => c.id === charRef.id) : null
            const has2DParts = char2D?.bodyParts && Object.values(char2D.bodyParts).some((arr) => arr.length > 0)
            const thumb = !has2DParts
              ? resolveCharThumb(charRef.id, charRef.type, chars2D, chars3D, chars1D, charsAV)
              : null
            return (
              <div
                key={charRef.id}
                className="relative group rounded-lg border border-white/5 overflow-hidden hover:border-panel-border transition-all"
              >
                <div className="aspect-square bg-[#1a1a1a] relative overflow-hidden flex items-center justify-center">
                  {has2DParts && char2D?.bodyParts ? (
                    <Char2DComposite char={char2D} />
                  ) : thumb ? (
                    <img src={thumb} alt={name} className="w-full h-full object-cover" />
                  ) : (
                    <User size={20} className="text-zinc-600" />
                  )}
                </div>
                <div className="p-1.5">
                  <p className="text-[11px] text-gray-300 truncate">{name}</p>
                  {badge && <span className={cn('text-[9px] px-1 rounded', badge.color)}>{badge.label}</span>}
                </div>
                <button
                  onClick={() => removeCharacterFromBundle(bundle.id, charRef.id)}
                  className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 w-5 h-5 rounded bg-black/60 flex items-center justify-center hover:bg-red-500/80 text-white transition-all"
                >
                  <Trash2 size={10} />
                </button>
              </div>
            )
          })}
          {bundle.characters.length === 0 && (
            <p className="text-xs text-gray-600 text-center py-4 col-span-2">No characters in this bundle</p>
          )}
        </div>
      </div>

      {/* Delete bundle */}
      <div className="px-3 py-2 border-t border-white/5">
        <button
          onClick={() => {
            removeBundle(bundle.id)
            selectBundle(null)
          }}
          className="w-full h-8 rounded-lg text-xs font-medium text-red-400 hover:bg-red-500/10 transition-colors"
        >
          Delete Bundle
        </button>
      </div>
    </div>
  )
}
