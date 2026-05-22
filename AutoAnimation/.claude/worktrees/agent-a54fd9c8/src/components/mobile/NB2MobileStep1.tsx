/**
 * NB2MobileStep1 — "Describe" step for mobile AI character wizard.
 *
 * Contains: character name, gender, description, optional style/layout references.
 */

import { useCallback } from 'react'
import { User, Palette, LayoutTemplate, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useNB2Store } from '@/stores/useNB2Store'

export function NB2MobileStep1() {
  const characterName = useNB2Store((s) => s.characterName)
  const gender = useNB2Store((s) => s.gender)
  const prompt = useNB2Store((s) => s.prompt)
  const styleRef = useNB2Store((s) => s.styleRef)
  const layoutRef = useNB2Store((s) => s.layoutRef)
  const isRunning = useNB2Store((s) => s.isRunning)

  const setCharacterName = useNB2Store((s) => s.setCharacterName)
  const setGender = useNB2Store((s) => s.setGender)
  const setPrompt = useNB2Store((s) => s.setPrompt)
  const setStyleRef = useNB2Store((s) => s.setStyleRef)
  const setLayoutRef = useNB2Store((s) => s.setLayoutRef)

  const handleImageUpload = useCallback(
    (setter: (val: string | null) => void) => (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0]
      if (!file) return
      const reader = new FileReader()
      reader.onload = (ev) => setter(ev.target?.result as string)
      reader.readAsDataURL(file)
    },
    [],
  )

  const handleDrop = useCallback(
    (setter: (val: string | null) => void) => (e: React.DragEvent) => {
      e.preventDefault()
      const file = e.dataTransfer.files?.[0]
      if (!file || !file.type.startsWith('image/')) return
      const reader = new FileReader()
      reader.onload = (ev) => setter(ev.target?.result as string)
      reader.readAsDataURL(file)
    },
    [],
  )

  return (
    <div className="space-y-4">
      {/* Character Name */}
      <div className="space-y-1.5">
        <label className="text-xs text-gray-400 font-medium">Character Name *</label>
        <div className="relative">
          <User size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
          <input
            type="text"
            value={characterName}
            onChange={(e) => setCharacterName(e.target.value)}
            placeholder="Enter character name..."
            className="w-full pl-9 pr-3 py-2.5 bg-[#1e1e1e] border border-[#3a3a3a] rounded-xl text-sm text-white placeholder-gray-600 focus:border-[#4a7eff] focus:outline-none"
            disabled={isRunning}
          />
        </div>
      </div>

      {/* Gender */}
      <div className="space-y-1.5">
        <label className="text-xs text-gray-400 font-medium">Gender <span className="text-gray-600">(affects hair styles)</span></label>
        <div className="flex gap-2">
          {(['neutral', 'male', 'female'] as const).map((g) => (
            <button
              key={g}
              onClick={() => setGender(g)}
              disabled={isRunning}
              className={cn(
                'flex-1 py-2 rounded-xl text-xs font-medium transition-colors',
                gender === g
                  ? 'bg-[#4a7eff]/20 text-[#4a7eff] border border-[#4a7eff]/40'
                  : 'bg-[#1e1e1e] text-gray-500 border border-[#3a3a3a] hover:text-gray-300',
              )}
            >
              {g.charAt(0).toUpperCase() + g.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Character Description */}
      <div className="space-y-1.5">
        <label className="text-xs text-gray-400 font-medium">Character Description *</label>
        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="Describe your character's appearance..."
          rows={4}
          className="w-full px-3 py-2.5 bg-[#1e1e1e] border border-[#3a3a3a] rounded-xl text-sm text-white placeholder-gray-600 focus:border-[#4a7eff] focus:outline-none resize-none"
          disabled={isRunning}
        />
      </div>

      {/* Reference Images */}
      <div className="space-y-1.5">
        <label className="text-xs text-gray-400 font-medium">Reference Images <span className="text-gray-600">(optional)</span></label>
        <div className="grid grid-cols-2 gap-3">
          {/* Style Ref */}
          <div
            className={cn(
              'aspect-[4/3] rounded-xl border-2 border-dashed flex items-center justify-center cursor-pointer overflow-hidden transition-colors',
              styleRef ? 'border-[#4a7eff]/50 bg-[#2a2a2a]' : 'border-[#3a3a3a] bg-[#1e1e1e]',
            )}
            onDragOver={(e) => e.preventDefault()}
            onDrop={handleDrop(setStyleRef)}
            onClick={() => document.getElementById('nb2m-style-input')?.click()}
          >
            {styleRef ? (
              <div className="relative w-full h-full">
                <img src={styleRef} alt="Style ref" className="w-full h-full object-cover" />
                <button
                  onClick={(e) => { e.stopPropagation(); setStyleRef(null) }}
                  className="absolute top-1.5 right-1.5 w-5 h-5 bg-black/60 rounded-full flex items-center justify-center hover:bg-red-500/80"
                >
                  <X size={10} className="text-white" />
                </button>
              </div>
            ) : (
              <div className="text-center p-3">
                <Palette size={20} className="mx-auto text-gray-600 mb-1" />
                <p className="text-[11px] text-gray-600">Style</p>
              </div>
            )}
          </div>
          <input id="nb2m-style-input" type="file" accept="image/*" onChange={handleImageUpload(setStyleRef)} className="hidden" />

          {/* Layout Ref */}
          <div
            className={cn(
              'aspect-[4/3] rounded-xl border-2 border-dashed flex items-center justify-center cursor-pointer overflow-hidden transition-colors',
              layoutRef ? 'border-[#4a7eff]/50 bg-[#2a2a2a]' : 'border-[#3a3a3a] bg-[#1e1e1e]',
            )}
            onDragOver={(e) => e.preventDefault()}
            onDrop={handleDrop(setLayoutRef)}
            onClick={() => document.getElementById('nb2m-layout-input')?.click()}
          >
            {layoutRef ? (
              <div className="relative w-full h-full">
                <img src={layoutRef} alt="Layout ref" className="w-full h-full object-cover" />
                <button
                  onClick={(e) => { e.stopPropagation(); setLayoutRef(null) }}
                  className="absolute top-1.5 right-1.5 w-5 h-5 bg-black/60 rounded-full flex items-center justify-center hover:bg-red-500/80"
                >
                  <X size={10} className="text-white" />
                </button>
              </div>
            ) : (
              <div className="text-center p-3">
                <LayoutTemplate size={20} className="mx-auto text-gray-600 mb-1" />
                <p className="text-[11px] text-gray-600">Layout</p>
              </div>
            )}
          </div>
          <input id="nb2m-layout-input" type="file" accept="image/*" onChange={handleImageUpload(setLayoutRef)} className="hidden" />
        </div>
      </div>
    </div>
  )
}
