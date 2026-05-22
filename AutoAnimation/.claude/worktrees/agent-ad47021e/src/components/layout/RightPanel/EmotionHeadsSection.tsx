import { useState } from 'react'
import { ChevronDown, ChevronRight, Smile, Eye, BringToFront } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useCharacterConfigStore } from '@/stores/useCharacterConfigStore'
import { hasEmotionHeads } from '@/stores'
import {
  EYE_VARIANTS,
  EYEBROW_VARIANTS,
  type EyeVariant,
  EMOTION_TO_EYE_VARIANT,
  EMOTION_CATEGORIES,
  type EmotionCategory,
} from '@/types/emotionHeads'

const VARIANT_LABELS: Record<EyeVariant, string> = {
  neutral: 'Neutral',
  happy: 'Happy',
  sad: 'Sad',
  angry: 'Angry',
  shocked: 'Shocked',
  suspicious: 'Suspicious',
}

const VARIANT_COLORS: Record<EyeVariant, string> = {
  neutral: 'text-zinc-400',
  happy: 'text-yellow-400',
  sad: 'text-blue-400',
  angry: 'text-red-400',
  shocked: 'text-orange-400',
  suspicious: 'text-purple-400',
}

const VARIANT_BORDER_ACTIVE: Record<EyeVariant, string> = {
  neutral: 'ring-zinc-400',
  happy: 'ring-yellow-500',
  sad: 'ring-blue-500',
  angry: 'ring-red-500',
  shocked: 'ring-orange-500',
  suspicious: 'ring-purple-500',
}

/** Reverse map: find which emotion categories map to this eye variant */
function getEmotionsForVariant(variant: EyeVariant): EmotionCategory[] {
  return EMOTION_CATEGORIES.filter((cat) => EMOTION_TO_EYE_VARIANT[cat] === variant)
}

export function EmotionHeadsSection() {
  const [isExpanded, setIsExpanded] = useState(true)
  const [previewSrc, setPreviewSrc] = useState<string | null>(null)

  const eyeVariantSprites = useCharacterConfigStore((s) => s.eyeVariantSprites)
  const eyebrowVariantSprites = useCharacterConfigStore((s) => s.eyebrowVariantSprites)
  const emotionHeadsAvailable = hasEmotionHeads()

  const hasEyes = Object.values(eyeVariantSprites).some((v) => v !== null)
  const hasEyebrows = Object.values(eyebrowVariantSprites).some((v) => v !== null)
  const totalCount =
    Object.values(eyeVariantSprites).filter((v) => v !== null).length +
    Object.values(eyebrowVariantSprites).filter((v) => v !== null).length

  const handleThumbnailClick = (sprite: string | null) => {
    if (!sprite) return
    setPreviewSrc((prev) => (prev === sprite ? null : sprite))
  }

  return (
    <div className="border border-white/5 rounded-lg overflow-hidden">
      {/* Collapsible Header */}
      <div
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center gap-2 px-3 py-2 bg-[#2a2a2a] hover:bg-[#3a3a3a] transition-colors cursor-pointer select-none"
      >
        {isExpanded ? (
          <ChevronDown size={14} className="text-zinc-500" />
        ) : (
          <ChevronRight size={14} className="text-zinc-500" />
        )}
        <Smile size={14} className="text-zinc-400" />
        <span className="flex-1 text-sm text-zinc-300 text-left">Expressions</span>
        {emotionHeadsAvailable && <span className="text-[10px] text-[#4a7eff]">{totalCount} sprites</span>}
      </div>

      {/* Content */}
      {isExpanded && (
        <div className="p-3 space-y-3">
          {!emotionHeadsAvailable ? (
            <div className="text-center py-4">
              <Smile size={24} className="mx-auto mb-2 text-zinc-600" />
              <p className="text-xs text-zinc-500">Generate emotion sprites in the Character panel</p>
            </div>
          ) : (
            <>
              {/* Preview */}
              {previewSrc && (
                <div className="flex items-center justify-between px-2 py-1.5 bg-[#4a7eff]/10 border border-[#4a7eff]/30 rounded-lg">
                  <div className="flex items-center gap-2">
                    <img src={previewSrc} alt="Preview" className="w-8 h-8 object-contain bg-white rounded" />
                    <span className="text-[10px] text-[#4a7eff]">Previewing sprite</span>
                  </div>
                  <button
                    onClick={() => setPreviewSrc(null)}
                    className="text-[10px] text-zinc-400 hover:text-zinc-200 transition-colors"
                  >
                    Clear
                  </button>
                </div>
              )}

              {/* Eye Variants (6 slots) */}
              {hasEyes && (
                <div className="space-y-1.5">
                  <div className="flex items-center gap-1.5">
                    <Eye size={11} className="text-zinc-500" />
                    <span className="text-[10px] text-zinc-500 uppercase tracking-wider font-medium">Eyes</span>
                    <div className="flex-1 h-px bg-white/5" />
                  </div>
                  <div className="grid grid-cols-6 gap-1">
                    {EYE_VARIANTS.map((variant) => {
                      const sprite = eyeVariantSprites[variant]
                      const isActive = previewSrc === sprite && sprite !== null
                      const emotions = getEmotionsForVariant(variant)
                      const emotionHint = emotions.length > 0 ? emotions.join(', ') : ''
                      return (
                        <button
                          key={variant}
                          onClick={() => handleThumbnailClick(sprite)}
                          disabled={!sprite}
                          title={`${VARIANT_LABELS[variant]}${emotionHint ? ` (${emotionHint})` : ''}`}
                          className={cn(
                            'aspect-square rounded-lg border overflow-hidden transition-all',
                            sprite
                              ? cn(
                                  'bg-white hover:scale-105 cursor-pointer',
                                  isActive
                                    ? cn('ring-2', VARIANT_BORDER_ACTIVE[variant])
                                    : 'border-white/5 hover:border-zinc-500',
                                )
                              : 'bg-[#2a2a2a] border-white/5 cursor-not-allowed opacity-40',
                          )}
                        >
                          {sprite ? (
                            <img
                              src={sprite}
                              alt={VARIANT_LABELS[variant]}
                              className="w-full h-full object-contain"
                              draggable={false}
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <span className="text-[6px] text-zinc-600">{variant.slice(0, 3)}</span>
                            </div>
                          )}
                        </button>
                      )
                    })}
                  </div>
                  <div className="grid grid-cols-6 gap-1">
                    {EYE_VARIANTS.map((variant) => (
                      <div key={variant} className="text-center">
                        <span className={cn('text-[7px] leading-none', VARIANT_COLORS[variant])}>
                          {VARIANT_LABELS[variant]}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Eyebrow Variants (6 slots) */}
              {hasEyebrows && (
                <div className="space-y-1.5">
                  <div className="flex items-center gap-1.5">
                    <BringToFront size={11} className="text-zinc-500" />
                    <span className="text-[10px] text-zinc-500 uppercase tracking-wider font-medium">Eyebrows</span>
                    <div className="flex-1 h-px bg-white/5" />
                  </div>
                  <div className="grid grid-cols-6 gap-1">
                    {EYEBROW_VARIANTS.map((variant) => {
                      const sprite = eyebrowVariantSprites[variant]
                      const isActive = previewSrc === sprite && sprite !== null
                      return (
                        <button
                          key={variant}
                          onClick={() => handleThumbnailClick(sprite)}
                          disabled={!sprite}
                          title={VARIANT_LABELS[variant as EyeVariant]}
                          className={cn(
                            'aspect-square rounded-lg border overflow-hidden transition-all',
                            sprite
                              ? cn(
                                  'bg-white hover:scale-105 cursor-pointer',
                                  isActive
                                    ? cn('ring-2', VARIANT_BORDER_ACTIVE[variant as EyeVariant])
                                    : 'border-white/5 hover:border-zinc-500',
                                )
                              : 'bg-[#2a2a2a] border-white/5 cursor-not-allowed opacity-40',
                          )}
                        >
                          {sprite ? (
                            <img
                              src={sprite}
                              alt={VARIANT_LABELS[variant as EyeVariant]}
                              className="w-full h-full object-contain"
                              draggable={false}
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <span className="text-[6px] text-zinc-600">{variant.slice(0, 3)}</span>
                            </div>
                          )}
                        </button>
                      )
                    })}
                  </div>
                  <div className="grid grid-cols-6 gap-1">
                    {EYEBROW_VARIANTS.map((variant) => (
                      <div key={variant} className="text-center">
                        <span className={cn('text-[7px] leading-none', VARIANT_COLORS[variant as EyeVariant])}>
                          {VARIANT_LABELS[variant as EyeVariant]}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Footer note */}
              <div className="pt-2 border-t border-white/5">
                <p className="text-[10px] text-zinc-600">
                  Expression sprites are applied automatically during dialogue playback based on [emotion] cues. Click
                  to preview.
                </p>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  )
}
