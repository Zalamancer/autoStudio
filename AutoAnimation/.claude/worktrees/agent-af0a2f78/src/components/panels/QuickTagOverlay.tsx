import { useState } from 'react'
import { ChevronLeft } from 'lucide-react'
import { cn } from '@/lib/utils'
import { VISEMES, CURVATURES } from '@/types/nanoBanana'
import type { MouthCurvature } from '@/types/nanoBanana'
import type { Viseme } from '@/types/voice'
import type { CharacterPartTab } from '@/stores/useCharacterConfigStore'

interface QuickTagOverlayProps {
  tab: CharacterPartTab
  spriteIndex: number
  currentLabel: string
  onTagAssign: (label: string) => void
  visible: boolean
  customTags?: string[]
}

const CURVATURE_META: Record<MouthCurvature, { icon: string; label: string; bg: string; bgActive: string }> = {
  upward: { icon: '😊', label: 'Happy', bg: 'hover:bg-emerald-500/20', bgActive: 'bg-emerald-500/30 ring-1 ring-emerald-400' },
  neutral: { icon: '😐', label: 'Neutral', bg: 'hover:bg-zinc-400/20', bgActive: 'bg-zinc-400/30 ring-1 ring-zinc-300' },
  downward: { icon: '😢', label: 'Sad', bg: 'hover:bg-sky-500/20', bgActive: 'bg-sky-500/30 ring-1 ring-sky-400' },
}

export function QuickTagOverlay({
  tab,
  currentLabel,
  onTagAssign,
  visible,
  customTags = [],
}: QuickTagOverlayProps) {
  const [curvaturePickerFor, setCurvaturePickerFor] = useState<Viseme | null>(null)

  if (!visible) return null

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation()
  }

  if (tab === 'viseme') {
    const handleVisemeClick = (e: React.MouseEvent, viseme: Viseme) => {
      e.stopPropagation()
      setCurvaturePickerFor(viseme)
    }

    const handleCurvatureSelect = (e: React.MouseEvent, curvature: MouthCurvature) => {
      e.stopPropagation()
      if (curvaturePickerFor) {
        onTagAssign(`${curvature}_${curvaturePickerFor}`)
        setCurvaturePickerFor(null)
      }
    }

    const isActiveViseme = (viseme: Viseme): boolean => {
      if (!currentLabel) return false
      const lower = currentLabel.toLowerCase()
      return (
        lower === viseme.toLowerCase() ||
        CURVATURES.some((c) => lower === `${c}_${viseme}`.toLowerCase())
      )
    }

    return (
      <div
        className="absolute inset-0 z-10 bg-black/60 backdrop-blur-md flex flex-col rounded-lg overflow-hidden"
        onClick={handleClick}
      >
        {curvaturePickerFor ? (
          <div className="flex-1 flex flex-col p-2 gap-1.5">
            <button
              onClick={(e) => { e.stopPropagation(); setCurvaturePickerFor(null) }}
              className="flex items-center gap-0.5 text-[10px] text-zinc-400 hover:text-white transition-colors self-start"
            >
              <ChevronLeft size={12} />
              <span className="font-medium">{curvaturePickerFor}</span>
            </button>
            <div className="flex-1 flex flex-col gap-1">
              {CURVATURES.map((curvature) => {
                const meta = CURVATURE_META[curvature]
                const isActive = currentLabel.toLowerCase() === `${curvature}_${curvaturePickerFor}`.toLowerCase()
                return (
                  <button
                    key={curvature}
                    onClick={(e) => handleCurvatureSelect(e, curvature)}
                    className={cn(
                      'flex-1 flex items-center justify-center gap-1.5 rounded-md text-[11px] font-medium transition-all',
                      isActive
                        ? cn('text-white', meta.bgActive)
                        : cn('text-zinc-300', meta.bg)
                    )}
                    title={`${curvature} ${curvaturePickerFor}`}
                  >
                    <span>{meta.icon}</span>
                    <span>{meta.label}</span>
                  </button>
                )
              })}
            </div>
          </div>
        ) : (
          <div className="flex-1 grid grid-cols-4 grid-rows-3 gap-px p-1.5">
            {VISEMES.map((viseme) => {
              const active = isActiveViseme(viseme)
              return (
                <button
                  key={viseme}
                  onClick={(e) => handleVisemeClick(e, viseme)}
                  className={cn(
                    'flex items-center justify-center rounded-md text-[10px] font-semibold tracking-wide transition-all',
                    active
                      ? 'bg-emerald-500/30 text-emerald-300 ring-1 ring-emerald-400/60'
                      : 'text-zinc-300 hover:bg-white/10 hover:text-white'
                  )}
                  title={viseme}
                >
                  {viseme === 'Rest' ? 'Re' : viseme}
                </button>
              )
            })}
          </div>
        )}
      </div>
    )
  }

  // Non-viseme tabs
  if (customTags.length === 0) return null

  const useGrid = customTags.length > 3
  const gridCols = customTags.length <= 6 ? Math.min(customTags.length, 3) : 4

  return (
    <div
      className="absolute inset-0 z-10 bg-black/60 backdrop-blur-md flex flex-col rounded-lg overflow-hidden"
      onClick={handleClick}
    >
      {useGrid ? (
        <div
          className="flex-1 grid gap-px p-1.5"
          style={{ gridTemplateColumns: `repeat(${gridCols}, 1fr)` }}
        >
          {customTags.map((tag) => {
            const active = currentLabel === tag
            return (
              <button
                key={tag}
                onClick={(e) => {
                  e.stopPropagation()
                  onTagAssign(tag)
                }}
                className={cn(
                  'flex items-center justify-center rounded-md text-[10px] font-medium transition-all truncate',
                  active
                    ? 'bg-emerald-500/30 text-emerald-300 ring-1 ring-emerald-400/60'
                    : 'text-zinc-300 hover:bg-white/10 hover:text-white'
                )}
                title={tag}
              >
                {tag}
              </button>
            )
          })}
        </div>
      ) : (
        <div className="flex-1 flex flex-col gap-1 p-1.5">
          {customTags.map((tag) => {
            const active = currentLabel === tag
            return (
              <button
                key={tag}
                onClick={(e) => {
                  e.stopPropagation()
                  onTagAssign(tag)
                }}
                className={cn(
                  'flex-1 flex items-center justify-center rounded-md text-[11px] font-medium transition-all truncate',
                  active
                    ? 'bg-emerald-500/30 text-emerald-300 ring-1 ring-emerald-400/60'
                    : 'text-zinc-300 hover:bg-white/10 hover:text-white'
                )}
                title={tag}
              >
                {tag}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
