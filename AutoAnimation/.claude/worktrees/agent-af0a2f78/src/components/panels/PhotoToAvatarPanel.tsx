/**
 * PhotoToAvatarPanel — Upload a photo → AI analyzes → generates character sprite.
 */

import { useState, useCallback, useRef } from 'react'
import { Camera, Upload, Loader2, Sparkles, Edit3, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import {
  analyzePhotoForAvatar,
  type AvatarDescription,
  type AvatarStyle,
} from '@/services/photoToAvatar'
import { CreditCostTag } from '@/components/credits/CreditCostTag'

const STYLES: { id: AvatarStyle; label: string }[] = [
  { id: 'cartoon', label: 'Cartoon' },
  { id: 'anime', label: 'Anime' },
  { id: 'semi-realistic', label: 'Realistic' },
  { id: 'chibi', label: 'Chibi' },
  { id: 'pixel-art', label: 'Pixel' },
]

interface PhotoToAvatarPanelProps {
  onPromptReady?: (prompt: string) => void
}

export function PhotoToAvatarPanel({ onPromptReady }: PhotoToAvatarPanelProps) {
  const [photoUrl, setPhotoUrl] = useState<string | null>(null)
  const [style, setStyle] = useState<AvatarStyle>('cartoon')
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [description, setDescription] = useState<AvatarDescription | null>(null)
  const [editablePrompt, setEditablePrompt] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFile = useCallback(
    (file: File) => {
      if (!file.type.startsWith('image/')) return
      const reader = new FileReader()
      reader.onload = () => {
        const dataUrl = reader.result as string
        setPhotoUrl(dataUrl)
        setDescription(null)
        setError(null)
      }
      reader.readAsDataURL(file)
    },
    [],
  )

  const handleAnalyze = useCallback(async () => {
    if (!photoUrl) return
    setIsAnalyzing(true)
    setError(null)

    try {
      const desc = await analyzePhotoForAvatar(photoUrl, style)
      setDescription(desc)
      setEditablePrompt(desc.generationPrompt)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Analysis failed')
    } finally {
      setIsAnalyzing(false)
    }
  }, [photoUrl, style])

  const handleGenerate = useCallback(() => {
    if (!editablePrompt.trim()) return
    onPromptReady?.(editablePrompt.trim())
  }, [editablePrompt, onPromptReady])

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Camera size={14} className="text-violet-400" />
        <span className="text-[11px] font-medium text-zinc-300">Photo to Avatar</span>
      </div>

      {/* Photo Upload */}
      {!photoUrl ? (
        <div
          onClick={() => fileInputRef.current?.click()}
          className="border-2 border-dashed border-zinc-700 hover:border-zinc-600 rounded-lg p-6 text-center cursor-pointer transition-colors"
        >
          <Upload size={24} className="mx-auto mb-2 text-zinc-500" />
          <p className="text-xs text-zinc-400">Upload a photo of a person</p>
          <p className="text-[10px] text-zinc-600 mt-1">JPG, PNG — clear face visible</p>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={(e) => {
              const file = e.target.files?.[0]
              if (file) handleFile(file)
            }}
            className="hidden"
          />
        </div>
      ) : (
        <div className="relative">
          <img
            src={photoUrl}
            alt="Uploaded photo"
            className="w-full h-32 object-cover rounded-lg"
          />
          <button
            onClick={() => { setPhotoUrl(null); setDescription(null) }}
            className="absolute top-1.5 right-1.5 p-1 bg-black/60 rounded-full text-white hover:bg-black/80"
          >
            <X size={12} />
          </button>
        </div>
      )}

      {/* Style Selector */}
      {photoUrl && (
        <div className="flex gap-1">
          {STYLES.map((s) => (
            <button
              key={s.id}
              onClick={() => setStyle(s.id)}
              className={cn(
                'flex-1 py-1.5 rounded-md text-[10px] font-medium transition-colors',
                style === s.id
                  ? 'bg-violet-500/20 text-violet-300 border border-violet-500/30'
                  : 'bg-zinc-800/50 text-zinc-500 border border-zinc-700/50',
              )}
            >
              {s.label}
            </button>
          ))}
        </div>
      )}

      {/* Analyze Button */}
      {photoUrl && !description && (
        <button
          onClick={handleAnalyze}
          disabled={isAnalyzing}
          className={cn(
            'w-full py-2 rounded-lg text-xs font-medium flex items-center justify-center gap-2 transition-colors',
            isAnalyzing
              ? 'bg-zinc-800 text-zinc-500 cursor-not-allowed'
              : 'bg-violet-600 hover:bg-violet-500 text-white',
          )}
        >
          {isAnalyzing ? (
            <>
              <Loader2 size={14} className="animate-spin" />
              Analyzing Photo...
            </>
          ) : (
            <>
              <Sparkles size={14} />
              Analyze Photo
              <CreditCostTag operation="photo-to-avatar" />
            </>
          )}
        </button>
      )}

      {error && <p className="text-[10px] text-red-400">{error}</p>}

      {/* Description Result */}
      {description && (
        <div className="space-y-2 animate-in fade-in duration-200">
          <div className="grid grid-cols-2 gap-1 text-[10px]">
            <div className="bg-zinc-800/50 rounded px-2 py-1">
              <span className="text-zinc-500">Hair: </span>
              <span className="text-zinc-300">{description.hairColor} {description.hairStyle}</span>
            </div>
            <div className="bg-zinc-800/50 rounded px-2 py-1">
              <span className="text-zinc-500">Skin: </span>
              <span className="text-zinc-300">{description.skinTone}</span>
            </div>
            <div className="bg-zinc-800/50 rounded px-2 py-1">
              <span className="text-zinc-500">Eyes: </span>
              <span className="text-zinc-300">{description.eyeColor}</span>
            </div>
            <div className="bg-zinc-800/50 rounded px-2 py-1">
              <span className="text-zinc-500">Build: </span>
              <span className="text-zinc-300">{description.bodyType}</span>
            </div>
          </div>

          {/* Editable Prompt */}
          <div className="space-y-1">
            <div className="flex items-center gap-1 text-[10px] text-zinc-500">
              <Edit3 size={10} />
              Edit generation prompt:
            </div>
            <textarea
              value={editablePrompt}
              onChange={(e) => setEditablePrompt(e.target.value)}
              rows={3}
              className="w-full bg-zinc-800/50 border border-zinc-700 rounded-lg px-2.5 py-2 text-[11px] text-zinc-200 resize-none focus:outline-none focus:ring-1 focus:ring-violet-500/50"
            />
          </div>

          <button
            onClick={handleGenerate}
            disabled={!editablePrompt.trim()}
            className="w-full py-2 rounded-lg text-xs font-medium bg-violet-600 hover:bg-violet-500 text-white flex items-center justify-center gap-2 transition-colors disabled:opacity-40"
          >
            <Sparkles size={14} />
            Generate Avatar Sprite Sheet
          </button>
        </div>
      )}
    </div>
  )
}
