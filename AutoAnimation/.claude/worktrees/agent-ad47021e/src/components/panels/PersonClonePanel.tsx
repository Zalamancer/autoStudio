/**
 * AI Person Clone Panel
 *
 * UI for analyzing photos/videos to create character clones that
 * preserve a person's likeness in an animated art style.
 */

import { useCallback, useRef, useState } from 'react'
import {
  User, Camera, Loader2, Trash2, Palette,
  Wand2, AlertTriangle, ChevronDown, ChevronRight,
} from 'lucide-react'
import { PanelSlider } from '@/components/ui/panel-controls'
import { usePersonCloneStore } from '@/stores/usePersonCloneStore'
import { createCloneFromPhoto, generateCharacterFromProfile } from '@/services/personCloneService'
import type { PersonCloneStyle } from '@/types/personClone'

const STYLE_OPTIONS: { value: PersonCloneStyle; label: string }[] = [
  { value: 'cartoon', label: 'Cartoon' },
  { value: 'anime', label: 'Anime' },
  { value: 'semi-realistic', label: 'Semi-Realistic' },
  { value: 'chibi', label: 'Chibi' },
  { value: 'pixel-art', label: 'Pixel Art' },
  { value: 'comic-book', label: 'Comic Book' },
  { value: 'watercolor', label: 'Watercolor' },
]

export function PersonClonePanel() {
  const {
    profiles,
    status,
    progress,
    sourcePhoto,
    artStyle,
    likenessStrength,
    error,
    addProfile,
    removeProfile,
    setActiveProfile,
    setProgress,
    setSourcePhoto,
    setArtStyle,
    setLikenessStrength,
    setError,
  } = usePersonCloneStore()

  const fileInputRef = useRef<HTMLInputElement>(null)
  const [cloneName, setCloneName] = useState('')
  const [expandedProfileId, setExpandedProfileId] = useState<string | null>(null)
  const [generatingProfileId, setGeneratingProfileId] = useState<string | null>(null)

  const handlePhotoSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith('image/')) {
      setError('Please select an image file')
      return
    }

    const reader = new FileReader()
    reader.onload = () => {
      setSourcePhoto(reader.result as string)
      setError(null)
    }
    reader.onerror = () => setError('Failed to read image')
    reader.readAsDataURL(file)
  }, [setSourcePhoto, setError])

  const handleCreateClone = useCallback(async () => {
    if (!sourcePhoto) return
    if (!cloneName.trim()) {
      setError('Please enter a name for the clone')
      return
    }

    setError(null)

    try {
      const profile = await createCloneFromPhoto(
        sourcePhoto,
        cloneName.trim(),
        artStyle,
        likenessStrength,
        (p) => setProgress(p),
      )
      addProfile(profile)
      setSourcePhoto(null)
      setCloneName('')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Clone creation failed')
    }
  }, [sourcePhoto, cloneName, artStyle, likenessStrength, addProfile, setProgress, setSourcePhoto, setError])

  const handleGenerateCharacter = useCallback(async (profileId: string) => {
    const profile = profiles.find((p) => p.id === profileId)
    if (!profile) return

    setGeneratingProfileId(profileId)
    setError(null)

    try {
      const characterId = await generateCharacterFromProfile(
        profile,
        (p) => setProgress(p),
      )

      // Update the profile with the generated character ID
      const { updateProfile } = usePersonCloneStore.getState()
      updateProfile(profileId, { generatedCharacterId: characterId })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Character generation failed')
    } finally {
      setGeneratingProfileId(null)
    }
  }, [profiles, setProgress, setError])

  const isProcessing = status === 'analyzing-photo' || status === 'analyzing-video'
    || status === 'building-profile' || status === 'generating-character'

  return (
    <div className="flex flex-col gap-3 p-3">
      {/* Header */}
      <div className="flex items-center gap-2">
        <User className="w-4 h-4 text-purple-400" />
        <h3 className="text-sm font-medium text-white">AI Person Clone</h3>
      </div>

      <p className="text-xs text-zinc-400">
        Upload a photo to create an animated character that preserves the person's
        likeness, facial features, and style in your chosen art style.
      </p>

      {/* Photo Upload */}
      <div className="space-y-2">
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handlePhotoSelect}
          className="hidden"
        />

        {!sourcePhoto ? (
          <button
            onClick={() => fileInputRef.current?.click()}
            className="w-full flex items-center justify-center gap-2 px-4 py-4 border-2 border-dashed border-zinc-700 rounded-lg hover:border-zinc-600 text-zinc-400 hover:text-zinc-300 transition-colors"
          >
            <Camera className="w-5 h-5" />
            <span className="text-xs">Upload Reference Photo</span>
          </button>
        ) : (
          <div className="space-y-2">
            {/* Photo preview */}
            <div className="relative aspect-square bg-zinc-900 rounded-lg overflow-hidden border border-zinc-800 max-h-48">
              <img
                src={sourcePhoto}
                alt="Reference"
                className="w-full h-full object-contain"
              />
              <button
                onClick={() => setSourcePhoto(null)}
                className="absolute top-2 right-2 p-1 bg-zinc-900/80 rounded hover:bg-zinc-800 text-zinc-400 hover:text-zinc-300"
              >
                <Trash2 className="w-3 h-3" />
              </button>
            </div>

            {/* Clone name */}
            <input
              type="text"
              value={cloneName}
              onChange={(e) => setCloneName(e.target.value)}
              placeholder="Clone name (e.g. 'John')"
              className="w-full px-2 py-1.5 bg-zinc-800 border border-zinc-700 rounded text-xs text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:border-purple-500/50"
            />

            {/* Art Style */}
            <div className="space-y-1">
              <span className="text-xs text-zinc-400">Art Style</span>
              <div className="grid grid-cols-2 gap-1">
                {STYLE_OPTIONS.map(({ value, label }) => (
                  <button
                    key={value}
                    onClick={() => setArtStyle(value)}
                    className={`px-2 py-1 rounded text-xs transition-colors ${
                      artStyle === value
                        ? 'bg-purple-600 text-white'
                        : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {/* Likeness Strength */}
            <PanelSlider
              label="Likeness"
              value={likenessStrength}
              onChange={(v) => setLikenessStrength(v)}
              min={0}
              max={100}
              step={1}
              suffix="%"
            />

            {/* Generate button */}
            <button
              onClick={handleCreateClone}
              disabled={isProcessing || !cloneName.trim()}
              className="w-full flex items-center justify-center gap-1.5 px-3 py-2 bg-purple-600 hover:bg-purple-500 text-white text-xs font-medium rounded disabled:opacity-50 transition-colors"
            >
              {isProcessing ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Wand2 className="w-3.5 h-3.5" />
              )}
              {isProcessing ? progress.message : 'Create Clone'}
            </button>

            {/* Progress */}
            {isProcessing && (
              <div className="w-full bg-zinc-800 rounded-full h-1.5">
                <div
                  className="bg-purple-500 h-1.5 rounded-full transition-all"
                  style={{ width: `${progress.percentage}%` }}
                />
              </div>
            )}
          </div>
        )}
      </div>

      {/* Saved Profiles */}
      {profiles.length > 0 && (
        <div className="border-t border-zinc-800 pt-2 space-y-1.5">
          <span className="text-xs text-zinc-400 font-medium">Clone Profiles ({profiles.length})</span>

          {profiles.map((profile) => (
            <div key={profile.id} className="border border-zinc-800 rounded-lg overflow-hidden">
              {/* Profile header */}
              <button
                onClick={() => {
                  setExpandedProfileId(expandedProfileId === profile.id ? null : profile.id)
                  setActiveProfile(profile.id)
                }}
                className="w-full flex items-center gap-2 px-2 py-1.5 hover:bg-zinc-800/50 text-left"
              >
                {profile.sourcePhoto ? (
                  <img
                    src={profile.sourcePhoto}
                    alt={profile.name}
                    className="w-7 h-7 rounded-full object-cover border border-zinc-700"
                  />
                ) : (
                  <div className="w-7 h-7 rounded-full bg-zinc-700 flex items-center justify-center">
                    <User className="w-3.5 h-3.5 text-zinc-500" />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <div className="text-xs text-zinc-300 truncate">{profile.name}</div>
                  <div className="text-[10px] text-zinc-500 capitalize">{profile.artStyle}</div>
                </div>
                {expandedProfileId === profile.id ? (
                  <ChevronDown className="w-3 h-3 text-zinc-500" />
                ) : (
                  <ChevronRight className="w-3 h-3 text-zinc-500" />
                )}
              </button>

              {/* Expanded profile details */}
              {expandedProfileId === profile.id && (
                <div className="px-2 pb-2 space-y-1.5 border-t border-zinc-800/50">
                  <div className="text-[10px] text-zinc-500 pt-1 space-y-0.5">
                    <p>Face: {profile.facialFeatures.faceShape} shape, {profile.facialFeatures.eyeColor} eyes</p>
                    <p>Hair: {profile.hairFeatures.color} {profile.hairFeatures.style}</p>
                    <p>Build: {profile.bodyFeatures.build}, {profile.bodyFeatures.skinTone} skin</p>
                    <p>Likeness: {profile.likenessStrength}%</p>
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex gap-1.5">
                      <button
                        className="flex-1 flex items-center justify-center gap-1 px-2 py-1 bg-purple-600 hover:bg-purple-500 text-white text-[10px] rounded transition-colors disabled:opacity-50"
                        disabled={isProcessing || generatingProfileId === profile.id}
                        onClick={() => handleGenerateCharacter(profile.id)}
                      >
                        {generatingProfileId === profile.id ? (
                          <Loader2 className="w-3 h-3 animate-spin" />
                        ) : (
                          <Palette className="w-3 h-3" />
                        )}
                        {generatingProfileId === profile.id ? progress.message || 'Generating...' : 'Generate Character'}
                      </button>
                      <button
                        onClick={() => removeProfile(profile.id)}
                        disabled={generatingProfileId === profile.id}
                        className="p-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-red-400 rounded disabled:opacity-50"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>

                    {/* Generation progress bar */}
                    {generatingProfileId === profile.id && (
                      <div className="w-full bg-zinc-800 rounded-full h-1">
                        <div
                          className="bg-purple-500 h-1 rounded-full transition-all"
                          style={{ width: `${progress.percentage}%` }}
                        />
                      </div>
                    )}

                    {/* Already generated indicator */}
                    {profile.generatedCharacterId && generatingProfileId !== profile.id && (
                      <p className="text-[10px] text-green-400">Character generated</p>
                    )}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Error display */}
      {error && (
        <div className="flex items-start gap-1.5 text-xs text-red-400 bg-red-950/30 rounded px-2 py-1.5">
          <AlertTriangle className="w-3 h-3 mt-0.5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}
    </div>
  )
}
