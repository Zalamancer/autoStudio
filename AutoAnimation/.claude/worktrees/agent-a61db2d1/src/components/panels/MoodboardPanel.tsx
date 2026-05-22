import { useState, useCallback } from 'react'
import { ImagePlus, Upload, Palette, Wand2, Loader2, X, Trash2 } from 'lucide-react'
import { createMoodboard, addImageToMoodboard, extractThemeFromMoodboard, applyMoodboardTheme } from '@/services/moodboardService'
import type { MoodboardConfig } from '@/types/faceSwap'

export function MoodboardPanel() {
  const [moodboard, setMoodboard] = useState<MoodboardConfig>(createMoodboard)
  const [isExtracting, setIsExtracting] = useState(false)
  const [isDragging, setIsDragging] = useState(false)

  const handleAddImage = useCallback(async (file: File) => {
    const url = URL.createObjectURL(file)
    const updated = await addImageToMoodboard(moodboard, url)
    setMoodboard(updated)
  }, [moodboard])

  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (files) {
      Array.from(files).forEach(handleAddImage)
    }
  }, [handleAddImage])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    const files = e.dataTransfer.files
    if (files) {
      Array.from(files).filter((f) => f.type.startsWith('image/')).forEach(handleAddImage)
    }
  }, [handleAddImage])

  const handleRemoveItem = useCallback((id: string) => {
    setMoodboard((prev) => ({
      ...prev,
      items: prev.items.filter((i) => i.id !== id),
    }))
  }, [])

  const handleExtractTheme = useCallback(async () => {
    setIsExtracting(true)
    try {
      const updated = await extractThemeFromMoodboard(moodboard)
      setMoodboard(updated)
    } finally {
      setIsExtracting(false)
    }
  }, [moodboard])

  const handleApplyTheme = useCallback(() => {
    applyMoodboardTheme(moodboard.extractedTheme)
  }, [moodboard.extractedTheme])

  const theme = moodboard.extractedTheme
  const hasTheme = theme.colorPalette.length > 0

  return (
    <div className="flex flex-col h-full">
      <div className="shrink-0 flex items-center gap-2 px-3 py-2 border-b border-white/5">
        <ImagePlus size={14} className="text-green-400" />
        <span className="text-sm font-medium text-zinc-200">Moodboard</span>
        <span className="ml-auto text-[11px] text-zinc-600">{moodboard.items.length} images</span>
      </div>

      <div className="flex-1 overflow-y-auto p-3 space-y-4">
        {/* Drop zone */}
        <label
          onDragOver={(e) => { e.preventDefault(); setIsDragging(true) }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
          className={`flex flex-col items-center justify-center gap-2 p-5 border-2 border-dashed rounded-lg cursor-pointer transition-colors ${
            isDragging
              ? 'border-green-500/50 bg-green-500/5'
              : 'border-white/10 hover:border-white/20'
          }`}
        >
          <Upload size={20} className="text-zinc-500" />
          <span className="text-xs text-zinc-500">Drop images or click to upload</span>
          <input type="file" accept="image/*" multiple onChange={handleFileInput} className="hidden" />
        </label>

        {/* Image grid */}
        {moodboard.items.length > 0 && (
          <div className="grid grid-cols-3 gap-1.5">
            {moodboard.items.map((item) => (
              <div key={item.id} className="relative group aspect-square rounded-lg overflow-hidden bg-black/30">
                <img src={item.imageUrl} alt="" className="w-full h-full object-cover" />
                <button
                  onClick={() => handleRemoveItem(item.id)}
                  className="absolute top-1 right-1 w-5 h-5 rounded-full bg-black/60 text-white items-center justify-center text-[10px] hidden group-hover:flex hover:bg-red-600 transition-colors"
                >
                  <X size={10} />
                </button>
                {/* Color dots */}
                <div className="absolute bottom-1 left-1 flex gap-0.5">
                  {item.dominantColors.slice(0, 3).map((c, i) => (
                    <div key={i} className="w-2.5 h-2.5 rounded-full border border-black/30" style={{ backgroundColor: c }} />
                  ))}
                </div>
                {/* Mood badge */}
                <div className="absolute bottom-1 right-1 px-1 py-0.5 rounded text-[8px] bg-black/50 text-zinc-300">
                  {item.mood}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Extract theme button */}
        {moodboard.items.length > 0 && (
          <button
            onClick={handleExtractTheme}
            disabled={isExtracting}
            className="w-full py-2 rounded-lg text-xs font-medium transition-colors bg-purple-600 hover:bg-purple-500 text-white disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {isExtracting ? (
              <><Loader2 size={12} className="animate-spin" /> Extracting Theme...</>
            ) : (
              <><Wand2 size={12} /> Extract Theme</>
            )}
          </button>
        )}

        {/* Extracted theme display */}
        {hasTheme && (
          <div className="space-y-3 p-3 rounded-lg bg-white/[0.03] border border-white/5">
            <div className="text-xs font-medium text-zinc-300">Extracted Theme</div>

            {/* Color palette */}
            <div className="space-y-1.5">
              <div className="text-[11px] text-zinc-500">Color Palette</div>
              <div className="flex gap-1.5">
                {theme.colorPalette.map((c, i) => (
                  <div key={i} className="flex-1 aspect-square rounded-lg border border-white/10" style={{ backgroundColor: c }} title={c} />
                ))}
              </div>
            </div>

            {/* Mood & Style */}
            <div className="grid grid-cols-2 gap-2">
              <div>
                <div className="text-[11px] text-zinc-500">Mood</div>
                <div className="text-xs text-zinc-300 capitalize">{theme.mood}</div>
              </div>
              <div>
                <div className="text-[11px] text-zinc-500">Style</div>
                <div className="text-xs text-zinc-300 capitalize">{theme.style}</div>
              </div>
              <div>
                <div className="text-[11px] text-zinc-500">Typography</div>
                <div className="text-xs text-zinc-300 capitalize">{theme.typography}</div>
              </div>
              <div>
                <div className="text-[11px] text-zinc-500">Keywords</div>
                <div className="text-xs text-zinc-300">{theme.keywords.slice(0, 3).join(', ')}</div>
              </div>
            </div>

            {/* Apply button */}
            <button
              onClick={handleApplyTheme}
              className="w-full py-2 rounded-lg text-xs font-medium transition-colors bg-green-600 hover:bg-green-500 text-white flex items-center justify-center gap-2"
            >
              <Palette size={12} /> Apply Theme
            </button>
          </div>
        )}

        {/* Clear all */}
        {moodboard.items.length > 0 && (
          <button
            onClick={() => setMoodboard(createMoodboard())}
            className="w-full py-1.5 rounded-lg text-[11px] text-zinc-600 hover:text-zinc-400 hover:bg-white/5 transition-colors flex items-center justify-center gap-1.5"
          >
            <Trash2 size={11} /> Clear Moodboard
          </button>
        )}
      </div>
    </div>
  )
}
