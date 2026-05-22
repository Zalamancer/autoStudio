import { useState, useEffect } from 'react'
import { Loader2, Sparkles } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { CharacterPartTab } from '@/stores/useCharacterConfigStore'
import { useCharacterConfigStore } from '@/stores/useCharacterConfigStore'
import { useSavedCharactersStore } from '@/stores/useSavedCharactersStore'
import { vectorizeImage, isRecraftAvailable } from '@/services/recraft'

export function SpriteVectorizeButton({
  tab,
  count,
}: {
  tab: CharacterPartTab
  count: number
}) {
  const [available, setAvailable] = useState<boolean | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [progress, setProgress] = useState(0)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    isRecraftAvailable().then(setAvailable)
  }, [])

  // Hide entirely if recraft not configured or still checking
  if (available !== true) return null

  const handleVectorize = async () => {
    const { savedImages, setSavedImages } = useCharacterConfigStore.getState()
    const sprites = savedImages[tab]
    if (!sprites || sprites.length === 0) return

    setIsProcessing(true)
    setError(null)
    setProgress(0)

    try {
      const results: string[] = []
      for (let i = 0; i < sprites.length; i++) {
        const svgDataUrl = await vectorizeImage(sprites[i])
        results.push(svgDataUrl)
        setProgress(i + 1)
      }

      setSavedImages(tab, results)

      // Sync to saved character store
      const { selectedCharacterId, characters, updateCharacter, persistImages } = useSavedCharactersStore.getState()
      if (selectedCharacterId) {
        const savedChar = characters.find((c) => c.id === selectedCharacterId)
        if (savedChar) {
          updateCharacter(selectedCharacterId, {
            bodyParts: {
              ...savedChar.bodyParts,
              [tab]: results,
            } as Record<CharacterPartTab, string[]>,
          })
          persistImages(selectedCharacterId).catch(() => {})
        }
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Vectorization failed'
      console.error('[SpriteVectorizeButton]', message)
      setError(message)
    } finally {
      setIsProcessing(false)
    }
  }

  return (
    <div className="space-y-1.5">
      <button
        onClick={handleVectorize}
        disabled={isProcessing}
        className={cn(
          'w-full flex items-center justify-center gap-1.5 py-2 px-2.5 rounded-lg text-sm transition-colors',
          isProcessing
            ? 'bg-[#2a2a2a] text-zinc-500 cursor-wait'
            : 'bg-[#4a7eff]/10 text-[#4a7eff] hover:bg-[#4a7eff]/20 border border-[#4a7eff]/30'
        )}
      >
        {isProcessing ? (
          <>
            <Loader2 size={14} className="animate-spin" />
            <span>Vectorizing {progress}/{count}</span>
          </>
        ) : (
          <>
            <Sparkles size={14} />
            <span>Vectorize to SVG ({count})</span>
            <span className="text-[10px] text-[#4a7eff]/70">5cr/ea</span>
          </>
        )}
      </button>

      {isProcessing && count > 0 && (
        <div className="w-full h-1 bg-[#2a2a2a] rounded-full overflow-hidden">
          <div
            className="h-full bg-[#4a7eff] transition-all duration-300"
            style={{ width: `${(progress / count) * 100}%` }}
          />
        </div>
      )}

      {error && !isProcessing && (
        <p className="text-[10px] text-red-400">{error}</p>
      )}
    </div>
  )
}
