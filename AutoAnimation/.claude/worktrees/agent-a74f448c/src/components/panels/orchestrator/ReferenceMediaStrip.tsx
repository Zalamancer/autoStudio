/**
 * ReferenceMediaStrip — Compact image upload strip for multimodal orchestrator input.
 *
 * Users drop or paste reference images alongside their text prompt.
 * Each image has a role selector (style / character / scene) and a remove button.
 */

import { useState, useCallback, useRef } from 'react'
import { ImagePlus, X, Palette, User, Mountain, AlertCircle } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useOrchestratorStore } from '@/stores/useOrchestratorStore'
import type { OrchestratorReferenceMedia } from '@/types/orchestrator'

const ROLE_CONFIG = {
  style: { icon: Palette, label: 'Style', color: 'text-violet-400' },
  character: { icon: User, label: 'Char', color: 'text-amber-400' },
  scene: { icon: Mountain, label: 'Scene', color: 'text-emerald-400' },
} as const

const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5 MB

export function ReferenceMediaStrip() {
  const referenceMedia = useOrchestratorStore((s) => s.settings.referenceMedia || [])
  const addReferenceImage = useOrchestratorStore((s) => s.addReferenceImage)
  const removeReferenceMedia = useOrchestratorStore((s) => s.removeReferenceMedia)
  const setReferenceRole = useOrchestratorStore((s) => s.setReferenceRole)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [sizeError, setSizeError] = useState<string | null>(null)

  const handleFiles = useCallback(
    (files: FileList | null) => {
      if (!files) return
      setSizeError(null)
      for (const file of Array.from(files)) {
        if (!file.type.startsWith('image/')) continue
        if (file.size > MAX_FILE_SIZE) {
          setSizeError(`"${file.name}" exceeds 5 MB limit (${(file.size / 1024 / 1024).toFixed(1)} MB)`)
          continue
        }
        const reader = new FileReader()
        reader.onload = () => {
          const dataUrl = reader.result as string
          addReferenceImage(dataUrl, file.type, 'style')
        }
        reader.readAsDataURL(file)
      }
    },
    [addReferenceImage],
  )

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      handleFiles(e.dataTransfer.files)
    },
    [handleFiles],
  )

  const handlePaste = useCallback(
    (e: React.ClipboardEvent) => {
      const items = e.clipboardData?.items
      if (!items) return
      setSizeError(null)
      for (const item of Array.from(items)) {
        if (item.type.startsWith('image/')) {
          const file = item.getAsFile()
          if (file) {
            if (file.size > MAX_FILE_SIZE) {
              setSizeError(`Pasted image exceeds 5 MB limit (${(file.size / 1024 / 1024).toFixed(1)} MB)`)
              continue
            }
            const reader = new FileReader()
            reader.onload = () => {
              addReferenceImage(reader.result as string, file.type, 'style')
            }
            reader.readAsDataURL(file)
          }
        }
      }
    },
    [addReferenceImage],
  )

  const cycleRole = useCallback(
    (media: OrchestratorReferenceMedia) => {
      const roles: Array<'style' | 'character' | 'scene'> = ['style', 'character', 'scene']
      const idx = roles.indexOf(media.role)
      const nextRole = roles[(idx + 1) % roles.length]
      setReferenceRole(media.id, nextRole)
    },
    [setReferenceRole],
  )

  return (
    <div
      onDrop={handleDrop}
      onDragOver={(e) => e.preventDefault()}
      onPaste={handlePaste}
    >
      <div className="flex items-center gap-2 flex-wrap">
        {/* Thumbnails */}
        {referenceMedia.map((media) => {
          const role = ROLE_CONFIG[media.role]
          const RoleIcon = role.icon
          return (
            <div
              key={media.id}
              className="relative group w-14 h-14 rounded-md overflow-hidden border border-[#3a3a3a] bg-black/40"
            >
              <img
                src={media.dataUrl}
                alt={`Reference (${media.role})`}
                className="w-full h-full object-cover"
              />
              {/* Role badge — click to cycle */}
              <button
                onClick={() => cycleRole(media)}
                className={cn(
                  'absolute bottom-0 left-0 right-0 flex items-center justify-center gap-0.5 py-0.5 text-[8px] font-medium bg-black/70 backdrop-blur-sm transition-colors',
                  role.color,
                )}
                title={`Role: ${role.label} (click to change)`}
              >
                <RoleIcon size={8} />
                {role.label}
              </button>
              {/* Remove button */}
              <button
                onClick={() => removeReferenceMedia(media.id)}
                className="absolute top-0 right-0 p-0.5 bg-black/70 text-gray-400 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity rounded-bl-md"
              >
                <X size={10} />
              </button>
            </div>
          )
        })}

        {/* Add button */}
        <button
          onClick={() => fileInputRef.current?.click()}
          className="w-14 h-14 rounded-md border border-dashed border-[#3a3a3a] hover:border-amber-500/50 bg-black/20 hover:bg-amber-500/5 flex flex-col items-center justify-center gap-0.5 transition-colors group"
          title="Add reference image"
        >
          <ImagePlus size={14} className="text-gray-500 group-hover:text-amber-400 transition-colors" />
          <span className="text-[8px] text-gray-600 group-hover:text-gray-400">Ref</span>
        </button>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={(e) => handleFiles(e.target.files)}
        />
      </div>

      {sizeError && (
        <div className="flex items-center gap-1 mt-1.5 text-[10px] text-red-400">
          <AlertCircle size={10} className="shrink-0" />
          <span>{sizeError}</span>
          <button onClick={() => setSizeError(null)} className="ml-auto text-gray-500 hover:text-gray-300">
            <X size={8} />
          </button>
        </div>
      )}

      {referenceMedia.length > 0 && (
        <p className="text-[9px] text-gray-600 mt-1">
          {referenceMedia.length} reference{referenceMedia.length > 1 ? 's' : ''} — click badge to change role
        </p>
      )}
    </div>
  )
}
