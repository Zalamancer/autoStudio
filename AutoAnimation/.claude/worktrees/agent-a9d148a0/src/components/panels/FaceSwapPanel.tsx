import { useState, useCallback } from 'react'
import { ScanFace, Video, Users, Upload, Loader2, AlertCircle } from 'lucide-react'
import { PanelSlider } from '@/components/ui/panel-controls'
import { useFaceSwapStore } from '@/stores/useFaceSwapStore'

type SwapTab = 'image' | 'video' | 'character'

export function FaceSwapPanel() {
  const [tab, setTab] = useState<SwapTab>('image')

  return (
    <div className="flex flex-col h-full">
      <div className="shrink-0 flex border-b border-white/5">
        {([
          { id: 'image' as const, label: 'Image', icon: ScanFace },
          { id: 'video' as const, label: 'Video', icon: Video },
          { id: 'character' as const, label: 'Character', icon: Users },
        ]).map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`flex-1 flex items-center justify-center gap-1.5 px-2 py-2.5 text-xs font-medium transition-colors ${
              tab === t.id
                ? 'text-white border-b-2 border-green-400'
                : 'text-zinc-500 hover:text-zinc-300'
            }`}
          >
            <t.icon size={14} />
            {t.label}
          </button>
        ))}
      </div>
      <div className="flex-1 overflow-y-auto p-3">
        {tab === 'image' && <ImageFaceSwap />}
        {tab === 'video' && <VideoFaceSwap />}
        {tab === 'character' && <CharacterSwap />}
      </div>
    </div>
  )
}

function ImageUploadArea({
  label,
  imageUrl,
  onUpload,
}: {
  label: string
  imageUrl: string
  onUpload: (url: string) => void
}) {
  const handleFile = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const url = URL.createObjectURL(file)
      onUpload(url)
    }
  }, [onUpload])

  return (
    <div className="space-y-1.5">
      <label className="text-xs text-zinc-400">{label}</label>
      {imageUrl ? (
        <div className="relative rounded-lg overflow-hidden bg-black/30 aspect-square">
          <img src={imageUrl} alt={label} className="w-full h-full object-cover" />
          <button
            onClick={() => onUpload('')}
            className="absolute top-1 right-1 w-5 h-5 rounded-full bg-black/60 text-white flex items-center justify-center text-[10px] hover:bg-black/80"
          >
            x
          </button>
        </div>
      ) : (
        <label className="flex flex-col items-center justify-center gap-2 p-6 border-2 border-dashed border-white/10 rounded-lg cursor-pointer hover:border-white/20 transition-colors">
          <Upload size={20} className="text-zinc-500" />
          <span className="text-xs text-zinc-500">Upload image</span>
          <input type="file" accept="image/*" onChange={handleFile} className="hidden" />
        </label>
      )}
    </div>
  )
}

function ImageFaceSwap() {
  const { setFaceSwapConfig, startFaceSwap, isProcessing, result, error } = useFaceSwapStore()
  const [sourceUrl, setSourceUrl] = useState('')
  const [targetUrl, setTargetUrl] = useState('')
  const [blendStrength, setBlendStrength] = useState(0.8)
  const [preserveLight, setPreserveLight] = useState(true)
  const [enhance, setEnhance] = useState(true)

  const handleSwap = useCallback(async () => {
    if (!sourceUrl || !targetUrl) return
    setFaceSwapConfig({
      sourceImageUrl: sourceUrl,
      targetImageUrl: targetUrl,
      blendStrength,
      preserveExpression: true,
      preserveLighting: preserveLight,
      enhanceResult: enhance,
    })
    await startFaceSwap()
  }, [sourceUrl, targetUrl, blendStrength, preserveLight, enhance, setFaceSwapConfig, startFaceSwap])

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <ImageUploadArea label="Source Face" imageUrl={sourceUrl} onUpload={setSourceUrl} />
        <ImageUploadArea label="Target Image" imageUrl={targetUrl} onUpload={setTargetUrl} />
      </div>

      <PanelSlider
        label="Blend Strength"
        value={blendStrength}
        onChange={setBlendStrength}
        min={0}
        max={1}
        step={0.05}
        formatValue={(v) => `${Math.round(v * 100)}%`}
      />

      <div className="space-y-1.5">
        <label className="flex items-center gap-2 text-xs text-zinc-400 cursor-pointer">
          <input type="checkbox" checked={preserveLight} onChange={(e) => setPreserveLight(e.target.checked)} className="accent-green-500" />
          Preserve lighting
        </label>
        <label className="flex items-center gap-2 text-xs text-zinc-400 cursor-pointer">
          <input type="checkbox" checked={enhance} onChange={(e) => setEnhance(e.target.checked)} className="accent-green-500" />
          Enhance result
        </label>
      </div>

      <button
        onClick={handleSwap}
        disabled={!sourceUrl || !targetUrl || isProcessing}
        className="w-full py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-40 bg-green-600 hover:bg-green-500 text-white"
      >
        {isProcessing ? (
          <span className="flex items-center justify-center gap-2"><Loader2 size={14} className="animate-spin" /> Processing...</span>
        ) : 'Swap Face'}
      </button>

      {error && (
        <div className="flex items-start gap-2 p-2 rounded-lg bg-red-500/10 text-red-400 text-xs">
          <AlertCircle size={14} className="shrink-0 mt-0.5" /> {error}
        </div>
      )}

      {result && (
        <div className="space-y-1.5">
          <label className="text-xs text-zinc-400">Result</label>
          <img src={result} alt="Face swap result" className="w-full rounded-lg" />
        </div>
      )}
    </div>
  )
}

function VideoFaceSwap() {
  const { setVideoFaceSwapConfig, startVideoFaceSwap, isProcessing, progress, error } = useFaceSwapStore()
  const [sourceUrl, setSourceUrl] = useState('')
  const [videoUrl, setVideoUrl] = useState('')
  const [smoothing, setSmoothing] = useState(0.7)

  const handleVideoFile = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) setVideoUrl(URL.createObjectURL(file))
  }, [])

  const handleSwap = useCallback(async () => {
    if (!sourceUrl || !videoUrl) return
    setVideoFaceSwapConfig({
      sourceFaceUrl: sourceUrl,
      targetVideoUrl: videoUrl,
      trackingSmoothing: smoothing,
      faceIndex: 0,
      preserveAudio: true,
      frameSkip: 2,
    })
    await startVideoFaceSwap()
  }, [sourceUrl, videoUrl, smoothing, setVideoFaceSwapConfig, startVideoFaceSwap])

  return (
    <div className="space-y-4">
      <ImageUploadArea label="Source Face" imageUrl={sourceUrl} onUpload={setSourceUrl} />

      <div className="space-y-1.5">
        <label className="text-xs text-zinc-400">Target Video</label>
        <label className="flex flex-col items-center justify-center gap-2 p-4 border-2 border-dashed border-white/10 rounded-lg cursor-pointer hover:border-white/20 transition-colors">
          <Video size={20} className="text-zinc-500" />
          <span className="text-xs text-zinc-500">{videoUrl ? 'Video selected' : 'Upload video'}</span>
          <input type="file" accept="video/*" onChange={handleVideoFile} className="hidden" />
        </label>
      </div>

      <PanelSlider
        label="Tracking Smoothing"
        value={smoothing}
        onChange={setSmoothing}
        min={0}
        max={1}
        step={0.05}
        formatValue={(v) => `${Math.round(v * 100)}%`}
      />

      <button
        onClick={handleSwap}
        disabled={!sourceUrl || !videoUrl || isProcessing}
        className="w-full py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-40 bg-green-600 hover:bg-green-500 text-white"
      >
        {isProcessing ? (
          <span className="flex items-center justify-center gap-2">
            <Loader2 size={14} className="animate-spin" />
            {Math.round(progress * 100)}%
          </span>
        ) : 'Process Video'}
      </button>

      {error && (
        <div className="flex items-start gap-2 p-2 rounded-lg bg-red-500/10 text-red-400 text-xs">
          <AlertCircle size={14} className="shrink-0 mt-0.5" /> {error}
        </div>
      )}
    </div>
  )
}

function CharacterSwap() {
  const { setCharacterSwapConfig, startCharacterSwap, isProcessing, error } = useFaceSwapStore()
  const [sourceId, setSourceId] = useState('')
  const [targetId, setTargetId] = useState('')
  const [blendMode, setBlendMode] = useState<'replace' | 'blend' | 'morph'>('replace')
  const [preserveMotion, setPreserveMotion] = useState(true)

  const handleSwap = useCallback(async () => {
    if (!sourceId || !targetId) return
    setCharacterSwapConfig({
      sourceCharacterId: sourceId,
      targetCharacterId: targetId,
      preserveMotion,
      preserveStyle: true,
      blendMode,
    })
    await startCharacterSwap()
  }, [sourceId, targetId, blendMode, preserveMotion, setCharacterSwapConfig, startCharacterSwap])

  return (
    <div className="space-y-4">
      <div className="space-y-1.5">
        <label className="text-xs text-zinc-400">Source Character ID</label>
        <input
          type="text" value={sourceId} onChange={(e) => setSourceId(e.target.value)}
          placeholder="Enter character ID"
          className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-sm text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:border-green-500/50"
        />
      </div>

      <div className="space-y-1.5">
        <label className="text-xs text-zinc-400">Target Character ID</label>
        <input
          type="text" value={targetId} onChange={(e) => setTargetId(e.target.value)}
          placeholder="Enter character ID"
          className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-sm text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:border-green-500/50"
        />
      </div>

      <div className="space-y-1.5">
        <label className="text-xs text-zinc-400">Blend Mode</label>
        <div className="flex gap-1.5">
          {(['replace', 'blend', 'morph'] as const).map((m) => (
            <button
              key={m}
              onClick={() => setBlendMode(m)}
              className={`flex-1 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                blendMode === m
                  ? 'bg-green-600 text-white'
                  : 'bg-white/5 text-zinc-400 hover:bg-white/10'
              }`}
            >
              {m.charAt(0).toUpperCase() + m.slice(1)}
            </button>
          ))}
        </div>
      </div>

      <label className="flex items-center gap-2 text-xs text-zinc-400 cursor-pointer">
        <input type="checkbox" checked={preserveMotion} onChange={(e) => setPreserveMotion(e.target.checked)} className="accent-green-500" />
        Preserve motion keyframes
      </label>

      <button
        onClick={handleSwap}
        disabled={!sourceId || !targetId || isProcessing}
        className="w-full py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-40 bg-green-600 hover:bg-green-500 text-white"
      >
        {isProcessing ? (
          <span className="flex items-center justify-center gap-2"><Loader2 size={14} className="animate-spin" /> Swapping...</span>
        ) : 'Swap Character'}
      </button>

      {error && (
        <div className="flex items-start gap-2 p-2 rounded-lg bg-red-500/10 text-red-400 text-xs">
          <AlertCircle size={14} className="shrink-0 mt-0.5" /> {error}
        </div>
      )}
    </div>
  )
}
