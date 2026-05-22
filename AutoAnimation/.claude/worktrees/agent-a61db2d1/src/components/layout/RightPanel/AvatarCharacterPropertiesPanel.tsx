/**
 * Right panel properties editor for avatar characters on canvas.
 * Transform controls (position, scale, opacity) + video generation trigger.
 */
import { useState, useCallback, useMemo, useRef } from 'react'
import {
  UserCircle,
  Loader2,
  Video,
  Trash2,
  Mic,
  Upload,
  AlertTriangle,
  Play,
  CheckCircle,
  ExternalLink,
} from 'lucide-react'
import { useAvatarCharacterStore } from '@/stores/useAvatarCharacterStore'
import { useSavedAvatarCharactersStore } from '@/stores/useSavedAvatarCharactersStore'
import { useAIProviderStore } from '@/stores/useAIProviderStore'
import { useVoiceStore } from '@/stores/useVoiceStore'
import { PanelSlider } from '@/components/ui/panel-controls'
import { generateAvatarVideo, generateAvatarLipSync } from '@/services/avatarGenerator'
import { getAvatarBlob, blobToDataUrl } from '@/services/avatarDB'
import { getModelsForCapability, getModel, getProvider } from '@/services/aiProviderRegistry'
import type { AIModelMeta } from '@/types/aiProviders'
import { cn } from '@/lib/utils'
import { PanelSelect } from '@/components/ui/panel-controls'

export function AvatarCharacterPropertiesPanel() {
  const activeCharacterId = useAvatarCharacterStore((s) => s.activeCharacterId)
  const characters = useAvatarCharacterStore((s) => s.characters)
  const updateCharacter = useAvatarCharacterStore((s) => s.updateAvatarCharacter)
  const removeCharacter = useAvatarCharacterStore((s) => s.removeAvatarCharacter)
  const savedCharacters = useSavedAvatarCharactersStore((s) => s.characters)

  // ── Model selector state ──
  const storeDefault = useAIProviderStore((s) => s.defaults['image-to-video'])
  const i2vModels = useMemo(() => getModelsForCapability('image-to-video'), [])
  const i2vByProvider = useMemo(() => {
    const groups = new Map<string, AIModelMeta[]>()
    for (const m of i2vModels) {
      const provName = getProvider(m.providerId)?.name ?? m.providerId
      if (!groups.has(provName)) groups.set(provName, [])
      groups.get(provName)!.push(m)
    }
    return groups
  }, [i2vModels])

  const defaultModelId = storeDefault || 'fal-ai/kling-video/v3/standard/image-to-video'
  const [selectedModelId, setSelectedModelId] = useState(defaultModelId)
  const selectedModel = useMemo(() => getModel(selectedModelId), [selectedModelId])
  const vs = selectedModel?.videoSettings

  const [videoPrompt, setVideoPrompt] = useState(
    'talking head, character speaking, subtle mouth movement, natural blinking',
  )
  const [videoDuration, setVideoDuration] = useState(vs?.defaultDuration ?? 5)
  const [videoResolution, setVideoResolution] = useState(vs?.defaultResolution ?? '')
  const [videoAspectRatio, setVideoAspectRatio] = useState('')
  const [videoAudio, setVideoAudio] = useState(false)

  // ── Lip Sync state ──
  const generatedVoices = useVoiceStore((s) => s.generatedVoices)
  const lsModels = useMemo(() => getModelsForCapability('lip-sync'), [])
  const lsImageModels = useMemo(() => lsModels.filter((m) => m.lipSyncInputType === 'image'), [lsModels])
  const lsVideoModels = useMemo(() => lsModels.filter((m) => m.lipSyncInputType === 'video'), [lsModels])
  const lsStoreDefault = useAIProviderStore((s) => s.defaults['lip-sync'])
  const [lsModelId, setLsModelId] = useState(lsStoreDefault || 'veed/fabric-1.0')
  const lsSelectedModel = useMemo(() => getModel(lsModelId), [lsModelId])
  const lsVs = lsSelectedModel?.videoSettings
  const [lsAudioSource, setLsAudioSource] = useState<'voice' | 'upload'>('voice')
  const [lsSelectedVoiceId, setLsSelectedVoiceId] = useState('')
  const [lsUploadedFile, setLsUploadedFile] = useState<File | null>(null)
  const [lsResolution, setLsResolution] = useState(lsVs?.defaultResolution ?? '')
  const fileInputRef = useRef<HTMLInputElement>(null)

  const character = characters.find((c) => c.id === activeCharacterId)
  const savedChar = character ? savedCharacters.find((sc) => sc.id === character.savedAvatarCharacterId) : null

  const handleModelChange = useCallback((modelId: string) => {
    setSelectedModelId(modelId)
    const meta = getModel(modelId)
    const s = meta?.videoSettings
    if (s) {
      setVideoDuration(s.defaultDuration ?? s.durations?.[0] ?? 5)
      setVideoResolution(s.defaultResolution ?? s.resolutions?.[0] ?? '')
      setVideoAspectRatio(s.aspectRatios?.[0] ?? '')
      setVideoAudio(false)
    }
  }, [])

  const handleGenerateVideo = useCallback(async () => {
    if (!character || !savedChar) return

    // Resolve image as a proper data URL (not a blob:// Object URL)
    let imageDataUrl: string | undefined
    const blob = await getAvatarBlob(savedChar.baseBlobId)
    if (blob) {
      imageDataUrl = await blobToDataUrl(blob)
    }
    if (!imageDataUrl) {
      imageDataUrl = savedChar.thumbnailDataUrl
    }
    if (!imageDataUrl) return

    updateCharacter(character.id, { videoStatus: 'generating', videoError: undefined })

    try {
      const videoUrl = await generateAvatarVideo({
        imageBase64: imageDataUrl,
        prompt: videoPrompt,
        durationSeconds: videoDuration,
        modelId: selectedModelId,
        resolution: videoResolution || undefined,
        aspectRatio: videoAspectRatio || undefined,
        generateAudio: vs?.supportsAudio ? videoAudio : undefined,
        onProgress: (_step) => {
          // Could update status message here
        },
      })

      updateCharacter(character.id, {
        videoUrl,
        videoStatus: 'ready',
      })
    } catch (err: any) {
      updateCharacter(character.id, {
        videoStatus: 'error',
        videoError: err.message || 'Video generation failed',
      })
    }
  }, [
    character,
    savedChar,
    videoPrompt,
    videoDuration,
    selectedModelId,
    videoResolution,
    videoAspectRatio,
    videoAudio,
    vs,
    updateCharacter,
  ])

  const handleGenerateLipSync = useCallback(async () => {
    if (!character || !savedChar) return

    // Resolve audio blob
    let audioBlob: Blob | null = null

    if (lsAudioSource === 'voice') {
      const voice = generatedVoices.find((v) => v.id === lsSelectedVoiceId)
      if (!voice) return
      // voice.audioUrl is a blob:// URL — fetch it to get a Blob
      const resp = await fetch(voice.audioUrl)
      audioBlob = await resp.blob()
    } else {
      if (!lsUploadedFile) return
      audioBlob = lsUploadedFile
    }

    const needsVideo = lsSelectedModel?.lipSyncInputType === 'video'

    // Resolve image or video input
    let imageDataUrl: string | undefined
    let videoUrl: string | undefined

    if (needsVideo) {
      videoUrl = character.videoUrl
      if (!videoUrl) return
    } else {
      const blob = await getAvatarBlob(savedChar.baseBlobId)
      if (blob) imageDataUrl = await blobToDataUrl(blob)
      if (!imageDataUrl) imageDataUrl = savedChar.thumbnailDataUrl
      if (!imageDataUrl) return
    }

    updateCharacter(character.id, { lipSyncStatus: 'generating', lipSyncError: undefined })

    try {
      const lipSyncVideoUrl = await generateAvatarLipSync({
        imageBase64: imageDataUrl,
        videoUrl,
        audioBlob,
        modelId: lsModelId,
        resolution: lsResolution || undefined,
      })

      updateCharacter(character.id, {
        lipSyncVideoUrl,
        lipSyncStatus: 'ready',
      })
    } catch (err: any) {
      updateCharacter(character.id, {
        lipSyncStatus: 'error',
        lipSyncError: err.message || 'Lip sync generation failed',
      })
    }
  }, [
    character,
    savedChar,
    lsAudioSource,
    lsSelectedVoiceId,
    lsUploadedFile,
    lsSelectedModel,
    lsModelId,
    lsResolution,
    generatedVoices,
    updateCharacter,
  ])

  const lsNeedsVideo = lsSelectedModel?.lipSyncInputType === 'video'
  const lsHasAudio = lsAudioSource === 'voice' ? !!lsSelectedVoiceId : !!lsUploadedFile
  const lsCanGenerate =
    lsHasAudio && (!lsNeedsVideo || !!character?.videoUrl) && character?.lipSyncStatus !== 'generating'

  if (!character) {
    return (
      <div className="p-4 text-center text-zinc-500 text-sm">
        <UserCircle className="w-8 h-8 mx-auto mb-2 opacity-50" />
        <p>No avatar selected</p>
        <p className="text-xs mt-1">Click an avatar on the canvas to edit its properties</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full overflow-y-auto">
      {/* ── Header ── */}
      <div className="p-4 border-b border-white/5">
        <div className="flex items-center gap-2 mb-1">
          <UserCircle size={16} className="text-[#4a7eff] shrink-0" />
          <h2 className="text-white text-base font-semibold truncate">{character.name}</h2>
        </div>
        {savedChar && (
          <p className="text-xs text-gray-400">
            {savedChar.style} · {savedChar.source}
          </p>
        )}
      </div>

      {/* ── Transform ── */}
      <div className="p-4 border-b border-white/5">
        <h2 className="text-white text-base font-semibold mb-4">Transform</h2>

        <PanelSlider
          label="X"
          value={character.position.x}
          onChange={(v) => updateCharacter(character.id, { position: { ...character.position, x: v } })}
          min={-2000}
          max={2000}
          step={1}
          precision={0}
          compact
        />
        <PanelSlider
          label="Y"
          value={character.position.y}
          onChange={(v) => updateCharacter(character.id, { position: { ...character.position, y: v } })}
          min={-2000}
          max={2000}
          step={1}
          precision={0}
          compact
        />
        <PanelSlider
          label="Scale"
          value={character.scale}
          onChange={(v) => updateCharacter(character.id, { scale: Math.max(0.1, v) })}
          min={0.1}
          max={5}
          step={0.05}
          precision={2}
          suffix="x"
        />
        <PanelSlider
          label="Opacity"
          value={Math.round(character.opacity * 100)}
          onChange={(v) => updateCharacter(character.id, { opacity: Math.max(0, Math.min(100, v)) / 100 })}
          min={0}
          max={100}
          step={1}
          precision={0}
          suffix="%"
        />

        <div className="flex items-center gap-2">
          <span className="text-gray-400 text-sm w-20 shrink-0">Visible</span>
          <button
            onClick={() => updateCharacter(character.id, { visible: !character.visible })}
            className={cn(
              'text-xs px-3 py-1 rounded-md transition-colors',
              character.visible ? 'bg-[#4a7eff]/10 text-[#4a7eff]' : 'bg-[#2a2a2a] text-gray-500',
            )}
          >
            {character.visible ? 'Visible' : 'Hidden'}
          </button>
        </div>
      </div>

      {/* ── Video Generation ── */}
      <div className="p-4 border-b border-white/5">
        <h2 className="text-white text-base font-semibold mb-4">Video Generation</h2>

        <div className="space-y-3">
          <div>
            <label className="text-[11px] text-gray-500 mb-1 block">Prompt</label>
            <textarea
              value={videoPrompt}
              onChange={(e) => setVideoPrompt(e.target.value)}
              rows={2}
              className="w-full px-3 py-2 rounded-lg bg-[#2a2a2a] border border-white/5 text-xs text-gray-200 placeholder:text-gray-600 focus:outline-none focus:ring-1 focus:ring-[#4a7eff] resize-none"
            />
          </div>

          {/* Model selector */}
          <PanelSelect
            label="Model"
            value={selectedModelId}
            onChange={handleModelChange}
            options={Array.from(i2vByProvider.entries()).flatMap(([provName, models]) =>
              models.map((m) => ({ value: m.id, label: `${provName} · ${m.name} · ${m.tier} · ${m.creditCost} cr` })),
            )}
            fullWidth
          />

          {/* Duration — use model's valid durations if available */}
          {vs?.durations && vs.durations.length > 1 ? (
            <PanelSelect
              label="Duration"
              value={String(videoDuration)}
              onChange={(v) => setVideoDuration(Number(v))}
              options={vs.durations.map((d) => ({ value: String(d), label: `${d}s` }))}
            />
          ) : (
            <PanelSlider
              label="Duration"
              value={videoDuration}
              onChange={(v) => setVideoDuration(Math.max(2, Math.min(20, v)))}
              min={2}
              max={20}
              step={1}
              precision={0}
              suffix="s"
            />
          )}

          {/* Resolution */}
          {vs?.resolutions && vs.resolutions.length > 0 && (
            <PanelSelect
              label="Resolution"
              value={videoResolution}
              onChange={setVideoResolution}
              options={vs.resolutions.map((r) => ({ value: r, label: r }))}
            />
          )}

          {/* Aspect Ratio */}
          {vs?.aspectRatios && vs.aspectRatios.length > 0 && (
            <div className="flex items-center gap-2">
              <span className="text-gray-400 text-xs w-20 shrink-0">Aspect</span>
              <div className="flex-1 flex gap-1">
                {vs.aspectRatios.map((ar) => (
                  <button
                    key={ar}
                    onClick={() => setVideoAspectRatio(ar)}
                    className={cn(
                      'flex-1 py-1 rounded-md text-[10px] font-medium transition-colors',
                      videoAspectRatio === ar
                        ? 'bg-[#4a7eff]/10 text-[#4a7eff] border border-[#4a7eff]/30'
                        : 'bg-[#2a2a2a] text-gray-400 border border-white/5 hover:bg-[#3a3a3a]',
                    )}
                  >
                    {ar}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Audio toggle */}
          {vs?.supportsAudio && (
            <div className="flex items-center gap-2">
              <span className="text-gray-400 text-xs w-20 shrink-0">Audio</span>
              <button
                onClick={() => setVideoAudio(!videoAudio)}
                className={cn(
                  'text-xs px-3 py-1 rounded-md transition-colors',
                  videoAudio ? 'bg-[#4a7eff]/10 text-[#4a7eff]' : 'bg-[#2a2a2a] text-gray-500',
                )}
              >
                {videoAudio ? 'Enabled' : 'Disabled'}
              </button>
            </div>
          )}

          {/* Estimated time */}
          {selectedModel?.estimatedSeconds && (
            <div className="text-[10px] text-gray-600">
              ~{Math.round(selectedModel.estimatedSeconds / 60)}min estimated
            </div>
          )}

          {/* Status */}
          {character.videoStatus === 'generating' && (
            <div className="flex items-center gap-2 text-xs text-[#4a7eff]">
              <Loader2 size={12} className="animate-spin" />
              Generating video...
            </div>
          )}
          {character.videoStatus === 'ready' && <div className="text-xs text-[#4a7eff]">Video ready</div>}
          {character.videoStatus === 'error' && (
            <div className="text-xs text-red-400">{character.videoError || 'Generation failed'}</div>
          )}

          <button
            onClick={handleGenerateVideo}
            disabled={character.videoStatus === 'generating'}
            className={cn(
              'w-full py-2 rounded-lg text-xs font-medium transition-colors flex items-center justify-center gap-2',
              character.videoStatus === 'generating'
                ? 'bg-[#3a3a3a] text-gray-500 cursor-not-allowed'
                : 'bg-[#4a7eff] hover:bg-[#3a6eef] text-white',
            )}
          >
            {character.videoStatus === 'generating' ? (
              <>
                <Loader2 size={12} className="animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Video size={12} />
                {character.videoUrl ? 'Regenerate Video' : 'Generate Video'}
              </>
            )}
          </button>
        </div>
      </div>

      {/* ── Lip Sync ── */}
      <div className="p-4 border-b border-white/5">
        <h2 className="text-white text-base font-semibold mb-4 flex items-center gap-2">
          <Mic size={16} className="text-[#4a7eff]" />
          Lip Sync
        </h2>

        <div className="space-y-3">
          {/* Audio source toggle */}
          <div>
            <label className="text-[11px] text-gray-500 mb-1 block">Audio Source</label>
            <div className="flex gap-1">
              <button
                onClick={() => setLsAudioSource('voice')}
                className={cn(
                  'flex-1 py-1.5 rounded-md text-xs font-medium transition-colors',
                  lsAudioSource === 'voice'
                    ? 'bg-[#4a7eff]/10 text-[#4a7eff] border border-[#4a7eff]/30'
                    : 'bg-[#2a2a2a] text-gray-400 border border-white/5 hover:bg-[#3a3a3a]',
                )}
              >
                Generated Voice
              </button>
              <button
                onClick={() => setLsAudioSource('upload')}
                className={cn(
                  'flex-1 py-1.5 rounded-md text-xs font-medium transition-colors flex items-center justify-center gap-1',
                  lsAudioSource === 'upload'
                    ? 'bg-[#4a7eff]/10 text-[#4a7eff] border border-[#4a7eff]/30'
                    : 'bg-[#2a2a2a] text-gray-400 border border-white/5 hover:bg-[#3a3a3a]',
                )}
              >
                <Upload size={10} />
                Upload File
              </button>
            </div>
          </div>

          {/* Voice selector or file upload */}
          {lsAudioSource === 'voice' ? (
            <div>
              <label className="text-[11px] text-gray-500 mb-1 block">Voice</label>
              {generatedVoices.length === 0 ? (
                <p className="text-[11px] text-gray-600">
                  No generated voices yet. Use the Voices panel to generate TTS audio first.
                </p>
              ) : (
                <PanelSelect
                  value={lsSelectedVoiceId}
                  onChange={setLsSelectedVoiceId}
                  options={[
                    { value: '', label: 'Select voice...' },
                    ...generatedVoices.map((v) => ({
                      value: v.id,
                      label: `${v.voiceName} — ${v.script.slice(0, 40)}${v.script.length > 40 ? '...' : ''}`,
                    })),
                  ]}
                  fullWidth
                />
              )}
            </div>
          ) : (
            <div>
              <label className="text-[11px] text-gray-500 mb-1 block">Audio File</label>
              <input
                ref={fileInputRef}
                type="file"
                accept="audio/*"
                onChange={(e) => setLsUploadedFile(e.target.files?.[0] ?? null)}
                className="w-full text-xs text-gray-400 file:mr-2 file:py-1 file:px-3 file:rounded-md file:border-0 file:text-xs file:bg-[#2a2a2a] file:text-gray-300 hover:file:bg-[#3a3a3a]"
              />
              {lsUploadedFile && <p className="text-[10px] text-gray-500 mt-1">{lsUploadedFile.name}</p>}
            </div>
          )}

          {/* Model selector */}
          <PanelSelect
            label="Model"
            value={lsModelId}
            onChange={(v) => {
              setLsModelId(v)
              const meta = getModel(v)
              if (meta?.videoSettings?.defaultResolution) setLsResolution(meta.videoSettings.defaultResolution)
            }}
            options={[
              ...lsImageModels.map((m) => ({
                value: m.id,
                label: `Image+Audio · ${m.name} · ${m.tier} · ${m.creditCost} cr`,
              })),
              ...lsVideoModels.map((m) => ({
                value: m.id,
                label: `Video+Audio · ${m.name} · ${m.tier} · ${m.creditCost} cr`,
              })),
            ]}
            fullWidth
          />

          {/* Warning for video-input model without existing video */}
          {lsNeedsVideo && !character.videoUrl && (
            <div className="flex items-start gap-2 px-3 py-2 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
              <AlertTriangle size={14} className="text-yellow-400 shrink-0 mt-0.5" />
              <p className="text-[11px] text-yellow-400">
                This model requires an existing video. Generate a video first using the section above.
              </p>
            </div>
          )}

          {/* Resolution */}
          {lsVs?.resolutions && lsVs.resolutions.length > 0 && (
            <PanelSelect
              label="Resolution"
              value={lsResolution}
              onChange={setLsResolution}
              options={lsVs.resolutions.map((r) => ({ value: r, label: r }))}
            />
          )}

          {/* Estimated time */}
          {lsSelectedModel?.estimatedSeconds && (
            <div className="text-[10px] text-gray-600">
              ~{Math.round(lsSelectedModel.estimatedSeconds / 60)}min estimated
            </div>
          )}

          {/* Status */}
          {character.lipSyncStatus === 'generating' && (
            <div className="flex items-center gap-2 text-xs text-[#4a7eff]">
              <Loader2 size={12} className="animate-spin" />
              Generating lip sync video...
            </div>
          )}
          {character.lipSyncStatus === 'ready' && <div className="text-xs text-[#4a7eff]">Lip sync video ready</div>}
          {character.lipSyncStatus === 'error' && (
            <div className="text-xs text-red-400">{character.lipSyncError || 'Lip sync failed'}</div>
          )}

          <button
            onClick={handleGenerateLipSync}
            disabled={!lsCanGenerate}
            className={cn(
              'w-full py-2 rounded-lg text-xs font-medium transition-colors flex items-center justify-center gap-2',
              !lsCanGenerate
                ? 'bg-[#3a3a3a] text-gray-500 cursor-not-allowed'
                : 'bg-[#4a7eff] hover:bg-[#3a6eef] text-white',
            )}
          >
            {character.lipSyncStatus === 'generating' ? (
              <>
                <Loader2 size={12} className="animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Mic size={12} />
                {character.lipSyncVideoUrl ? 'Regenerate Lip Sync' : 'Generate Lip Sync'}
              </>
            )}
          </button>
        </div>
      </div>

      {/* ── Actions ── */}
      <div className="p-4">
        <button
          onClick={() => {
            if (window.confirm('Remove this avatar from the canvas?')) {
              removeCharacter(character.id)
            }
          }}
          className="w-full py-2 rounded-lg text-xs font-medium bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-colors flex items-center justify-center gap-2"
        >
          <Trash2 size={12} />
          Remove from Canvas
        </button>
      </div>
    </div>
  )
}

/**
 * Avatar Videos panel — shows generated videos (image-to-video + lip sync)
 * with preview, status, and the ability to set which video is active on canvas.
 */
export function AvatarVideosPanel() {
  const activeCharacterId = useAvatarCharacterStore((s) => s.activeCharacterId)
  const characters = useAvatarCharacterStore((s) => s.characters)
  const updateCharacter = useAvatarCharacterStore((s) => s.updateAvatarCharacter)
  const savedCharacters = useSavedAvatarCharactersStore((s) => s.characters)
  const blobUrls = useSavedAvatarCharactersStore((s) => s.blobUrls)

  const character = characters.find((c) => c.id === activeCharacterId)
  const savedChar = character ? savedCharacters.find((sc) => sc.id === character.savedAvatarCharacterId) : null

  if (!character) {
    return (
      <div className="p-4 text-center text-zinc-500 text-sm">
        <Video className="w-8 h-8 mx-auto mb-2 opacity-50" />
        <p>No avatar selected</p>
        <p className="text-xs mt-1">Click an avatar on the canvas to see its videos</p>
      </div>
    )
  }

  const baseImageUrl = savedChar ? blobUrls[savedChar.baseBlobId] || savedChar.thumbnailDataUrl : null

  // Determine which video is currently displayed on canvas
  const activeOnCanvas =
    character.lipSyncVideoUrl && character.lipSyncStatus === 'ready'
      ? 'lipsync'
      : character.videoUrl && character.videoStatus === 'ready'
        ? 'video'
        : 'image'

  return (
    <div className="flex flex-col h-full overflow-y-auto">
      {/* Header */}
      <div className="p-4 border-b border-white/5">
        <div className="flex items-center gap-2 mb-1">
          <Video size={16} className="text-[#4a7eff] shrink-0" />
          <h2 className="text-white text-base font-semibold truncate">{character.name}</h2>
        </div>
        <p className="text-xs text-zinc-500">Generated videos for this avatar</p>
      </div>

      {/* Base Image */}
      <div className="p-4 border-b border-white/5">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-xs font-medium text-zinc-300">Base Image</span>
          {activeOnCanvas === 'image' && (
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#4a7eff]/10 text-[#4a7eff] font-medium">Active</span>
          )}
        </div>
        {baseImageUrl ? (
          <div className="relative group rounded-lg overflow-hidden border border-white/5">
            <img src={baseImageUrl} alt={character.name} className="w-full h-auto max-h-48 object-cover" />
            {activeOnCanvas !== 'image' && (
              <button
                onClick={() => {
                  updateCharacter(character.id, {
                    videoStatus: 'idle',
                    lipSyncStatus: 'idle',
                  })
                }}
                className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-xs text-white font-medium gap-1"
              >
                <CheckCircle size={12} />
                Use on Canvas
              </button>
            )}
          </div>
        ) : (
          <div className="w-full h-32 bg-[#2a2a2a] rounded-lg flex items-center justify-center text-zinc-600 text-xs">
            No image
          </div>
        )}
      </div>

      {/* Generated Video (Image-to-Video) */}
      <div className="p-4 border-b border-white/5">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-xs font-medium text-zinc-300">Generated Video</span>
          {activeOnCanvas === 'video' && (
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#4a7eff]/10 text-[#4a7eff] font-medium">Active</span>
          )}
          {character.videoStatus === 'generating' && (
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#4a7eff]/10 text-[#4a7eff] font-medium flex items-center gap-1">
              <Loader2 size={8} className="animate-spin" />
              Generating
            </span>
          )}
        </div>

        {character.videoUrl && character.videoStatus === 'ready' ? (
          <div className="relative group rounded-lg overflow-hidden border border-white/5">
            <video
              src={character.videoUrl}
              className="w-full h-auto max-h-48 object-cover"
              loop
              muted
              playsInline
              onMouseEnter={(e) => e.currentTarget.play()}
              onMouseLeave={(e) => {
                e.currentTarget.pause()
                e.currentTarget.currentTime = 0
              }}
            />
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
              {activeOnCanvas !== 'video' && (
                <button
                  onClick={() => {
                    updateCharacter(character.id, {
                      videoStatus: 'ready',
                      lipSyncStatus: 'idle',
                    })
                  }}
                  className="px-2.5 py-1.5 rounded-md bg-white/20 text-white text-xs font-medium flex items-center gap-1 hover:bg-white/30 transition-colors"
                >
                  <CheckCircle size={10} />
                  Use on Canvas
                </button>
              )}
              <a
                href={character.videoUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="px-2.5 py-1.5 rounded-md bg-white/20 text-white text-xs font-medium flex items-center gap-1 hover:bg-white/30 transition-colors"
              >
                <ExternalLink size={10} />
                Open
              </a>
            </div>
            <div className="absolute bottom-1 left-1">
              <Play size={14} className="text-white/70" />
            </div>
          </div>
        ) : character.videoStatus === 'error' ? (
          <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-xs text-red-400">
            <AlertTriangle size={12} className="inline mr-1" />
            {character.videoError || 'Video generation failed'}
          </div>
        ) : character.videoStatus === 'generating' ? (
          <div className="w-full h-32 bg-[#2a2a2a] rounded-lg flex flex-col items-center justify-center gap-2">
            <Loader2 size={20} className="text-[#4a7eff] animate-spin" />
            <span className="text-xs text-zinc-400">Generating video...</span>
          </div>
        ) : (
          <div className="w-full h-20 bg-[#2a2a2a] rounded-lg flex items-center justify-center text-zinc-600 text-xs">
            No video generated yet. Use the Avatar tab to generate one.
          </div>
        )}
      </div>

      {/* Lip Sync Video */}
      <div className="p-4 border-b border-white/5">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-xs font-medium text-zinc-300">Lip Sync Video</span>
          {activeOnCanvas === 'lipsync' && (
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#4a7eff]/10 text-[#4a7eff] font-medium">Active</span>
          )}
          {character.lipSyncStatus === 'generating' && (
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#4a7eff]/10 text-[#4a7eff] font-medium flex items-center gap-1">
              <Loader2 size={8} className="animate-spin" />
              Generating
            </span>
          )}
        </div>

        {character.lipSyncVideoUrl && character.lipSyncStatus === 'ready' ? (
          <div className="relative group rounded-lg overflow-hidden border border-white/5">
            <video
              src={character.lipSyncVideoUrl}
              className="w-full h-auto max-h-48 object-cover"
              loop
              muted
              playsInline
              onMouseEnter={(e) => e.currentTarget.play()}
              onMouseLeave={(e) => {
                e.currentTarget.pause()
                e.currentTarget.currentTime = 0
              }}
            />
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
              {activeOnCanvas !== 'lipsync' && (
                <button
                  onClick={() => {
                    updateCharacter(character.id, {
                      lipSyncStatus: 'ready',
                    })
                  }}
                  className="px-2.5 py-1.5 rounded-md bg-white/20 text-white text-xs font-medium flex items-center gap-1 hover:bg-white/30 transition-colors"
                >
                  <CheckCircle size={10} />
                  Use on Canvas
                </button>
              )}
              <a
                href={character.lipSyncVideoUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="px-2.5 py-1.5 rounded-md bg-white/20 text-white text-xs font-medium flex items-center gap-1 hover:bg-white/30 transition-colors"
              >
                <ExternalLink size={10} />
                Open
              </a>
            </div>
            <div className="absolute bottom-1 left-1">
              <Mic size={14} className="text-[#4a7eff]/70" />
            </div>
          </div>
        ) : character.lipSyncStatus === 'error' ? (
          <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-xs text-red-400">
            <AlertTriangle size={12} className="inline mr-1" />
            {character.lipSyncError || 'Lip sync generation failed'}
          </div>
        ) : character.lipSyncStatus === 'generating' ? (
          <div className="w-full h-32 bg-[#2a2a2a] rounded-lg flex flex-col items-center justify-center gap-2">
            <Loader2 size={20} className="text-[#4a7eff] animate-spin" />
            <span className="text-xs text-zinc-400">Generating lip sync...</span>
          </div>
        ) : (
          <div className="w-full h-20 bg-[#2a2a2a] rounded-lg flex items-center justify-center text-zinc-600 text-xs">
            No lip sync generated yet. Use the Avatar tab to generate one.
          </div>
        )}
      </div>

      {/* Info */}
      <div className="p-4 text-[10px] text-zinc-600 leading-relaxed">
        The video marked "Active" is displayed on the canvas. Hover over any video and click "Use on Canvas" to switch.
      </div>
    </div>
  )
}
