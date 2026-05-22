import { useState } from 'react'
import { Wand2, Info } from 'lucide-react'
import { PanelSelect } from '@/components/ui/panel-controls'
import { cn } from '@/lib/utils'
import { useCharacterConfigStore } from '@/stores'
import { VISEME_LIST, VISEME_DESCRIPTIONS, type Viseme } from '@/types/voice'

export function VisemeMappingPanel() {
  const {
    savedImages,
    spriteLabels,
    visemeMapping,
    useDefaultVisemeSet,
    setVisemeMapping,
    setUseDefaultVisemeSet,
    autoMapVisemesFromLabels,
  } = useCharacterConfigStore()

  const [showInfo, setShowInfo] = useState<Viseme | null>(null)

  const visemeSprites = savedImages.viseme
  const visemeLabels = spriteLabels.viseme

  if (visemeSprites.length === 0) {
    return (
      <div className="p-4 text-center text-zinc-500 text-sm">
        <p>No viseme sprites uploaded yet.</p>
        <p className="mt-2 text-xs">
          Go to the Character tab and upload mouth/viseme sprites first.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Mode Toggle */}
      <div className="flex items-center justify-between">
        <label className="text-xs text-zinc-500 uppercase tracking-wide">Viseme Mapping</label>
        <button
          onClick={() => setUseDefaultVisemeSet(!useDefaultVisemeSet)}
          className={cn(
            'text-xs px-2 py-1 rounded transition-colors',
            useDefaultVisemeSet
              ? 'bg-green-600/20 text-green-400'
              : 'bg-zinc-700 text-zinc-400 hover:text-zinc-200'
          )}
        >
          {useDefaultVisemeSet ? 'Default Order' : 'Custom Mapping'}
        </button>
      </div>

      {/* Default Mode Info */}
      {useDefaultVisemeSet && (
        <div className="p-3 bg-zinc-800/50 rounded-lg text-xs text-zinc-400">
          <p>
            <strong className="text-zinc-300">Default mode:</strong> First 8 sprites are mapped in
            order:
          </p>
          <p className="mt-1 font-mono text-green-400 text-[10px]">
            1.Aa → 2.D → 3.Ee → 4.F → 5.L → 6.M → 7.O → 8.R → 9.S → 10.U → 11.W → 12.Rest
          </p>
          <p className="mt-2 text-zinc-500">
            Upload sprites in this order, or switch to Custom Mapping.
          </p>
        </div>
      )}

      {/* Custom Mapping */}
      {!useDefaultVisemeSet && (
        <>
          {/* Auto-map button */}
          <button
            onClick={autoMapVisemesFromLabels}
            className="w-full flex items-center justify-center gap-2 py-2 bg-zinc-700 hover:bg-zinc-600 rounded-lg text-sm text-zinc-300 transition-colors"
          >
            <Wand2 size={14} />
            Auto-map from Labels
          </button>

          {/* Mapping Grid */}
          <div className="space-y-2">
            {VISEME_LIST.map((viseme) => (
              <div key={viseme} className="flex items-center gap-2">
                {/* Viseme Label */}
                <div className="w-16 flex items-center gap-1">
                  <span className="text-sm font-medium text-zinc-300">{viseme}</span>
                  <button
                    onClick={() => setShowInfo(showInfo === viseme ? null : viseme)}
                    className="text-zinc-600 hover:text-zinc-400"
                  >
                    <Info size={12} />
                  </button>
                </div>

                {/* Sprite Selector */}
                <div className="flex-1">
                  <PanelSelect
                    value={String(visemeMapping[viseme] ?? '')}
                    onChange={(v) => setVisemeMapping(viseme, v === '' ? null : parseInt(v))}
                    options={[
                      { value: '', label: 'Not mapped' },
                      ...visemeSprites.map((_: string, index: number) => ({
                        value: String(index),
                        label: visemeLabels[index] || `Sprite #${index + 1}`,
                      })),
                    ]}
                    fullWidth
                  />
                </div>

                {/* Preview */}
                {visemeMapping[viseme] !== null && visemeSprites[visemeMapping[viseme]!] && (
                  <div className="w-10 h-10 bg-zinc-800 rounded border border-zinc-700 overflow-hidden flex-shrink-0">
                    <img
                      src={visemeSprites[visemeMapping[viseme]!]}
                      alt={viseme}
                      className="w-full h-full object-contain"
                    />
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Info Tooltip */}
          {showInfo && (
            <div className="p-2 bg-zinc-700 rounded text-xs text-zinc-300">
              <strong>{showInfo}:</strong> {VISEME_DESCRIPTIONS[showInfo]}
            </div>
          )}
        </>
      )}

      {/* Sprite Preview Grid */}
      <div className="pt-3 border-t border-zinc-700">
        <label className="text-xs text-zinc-500 uppercase tracking-wide mb-2 block">
          Available Sprites ({visemeSprites.length})
        </label>
        <div className="grid grid-cols-4 gap-2">
          {visemeSprites.map((src: string, index: number) => {
            // Find which viseme this sprite is mapped to
            let mappedTo: Viseme | null = null
            if (useDefaultVisemeSet && index < 12) {
              mappedTo = VISEME_LIST[index]
            } else {
              for (const [v, idx] of Object.entries(visemeMapping)) {
                if (idx === index) {
                  mappedTo = v as Viseme
                  break
                }
              }
            }

            return (
              <div
                key={index}
                className={cn(
                  'relative aspect-square bg-zinc-800 rounded border overflow-hidden',
                  mappedTo ? 'border-green-500/50' : 'border-zinc-700'
                )}
              >
                <img src={src} alt={`Sprite ${index + 1}`} className="w-full h-full object-contain" />
                {/* Index badge */}
                <span className="absolute top-0.5 left-0.5 text-[9px] bg-black/60 px-1 rounded text-zinc-400">
                  {index + 1}
                </span>
                {/* Mapped viseme badge */}
                {mappedTo && (
                  <span className="absolute bottom-0 left-0 right-0 text-[9px] bg-green-600/80 text-center text-white py-0.5">
                    {mappedTo}
                  </span>
                )}
                {/* Label */}
                {visemeLabels[index] && !mappedTo && (
                  <span className="absolute bottom-0 left-0 right-0 text-[9px] bg-black/60 text-center text-zinc-400 py-0.5 truncate px-1">
                    {visemeLabels[index]}
                  </span>
                )}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
