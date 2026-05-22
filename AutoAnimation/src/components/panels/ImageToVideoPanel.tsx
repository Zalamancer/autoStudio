/**
 * ImageToVideoPanel.tsx
 *
 * Workflow panel: upload image -> configure motion -> generate -> use result.
 * Cinema-standardized shell with blue accent colors.
 */

import { useState, useCallback, useRef } from 'react'
import { Upload, Loader2, X, Wand2, Download, Layers, RotateCcw } from 'lucide-react'
import { cn } from '@/lib/utils'
import { PanelButtonGroup, PanelDropZone } from '@/components/ui/panel-controls'
import {
  MOTION_PRESETS,
  imageFileToBase64,
  generateFromImage,
  pollImageToVideoStatus,
  getImageToVideoResult,
  type MotionPreset,
  type ImageToVideoProvider,
} from '@/services/imageToVideo'
import { useVideoLayerStore } from '@/stores/useVideoLayerStore'

const DURATION_OPTIONS = [4, 6, 8, 10]
const PROVIDER_OPTIONS: { value: ImageToVideoProvider; label: string }[] = [
  { value: 'auto', label: 'Auto' },
  { value: 'kling', label: 'Kling' },
  { value: 'runway', label: 'Runway' },
  { value: 'minimax', label: 'Minimax' },
  { value: 'luma', label: 'Luma' },
]

export function ImageToVideoPanel() {
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [selectedPreset, setSelectedPreset] = useState<MotionPreset>(MOTION_PRESETS[0])
  const [customPrompt, setCustomPrompt] = useState('')
  const [duration, setDuration] = useState(6)
  const [provider, setProvider] = useState<ImageToVideoProvider>('auto')
  const [isGenerating, setIsGenerating] = useState(false)
  const [progress, setProgress] = useState<string>('')
  const [resultUrl, setResultUrl] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = useCallback(async (file: File) => {
    if (!file.type.startsWith('image/')) return
    setImageFile(file)
    setResultUrl(null)
    setError(null)

    const reader = new FileReader()
    reader.onload = () => setImagePreview(reader.result as string)
    reader.readAsDataURL(file)
  }, [])

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      const file = e.dataTransfer.files[0]
      if (file) handleFileSelect(file)
    },
    [handleFileSelect],
  )

  const handleGenerate = useCallback(async () => {
    if (!imageFile) return
    setIsGenerating(true)
    setError(null)
    setProgress('Uploading image...')

    try {
      const base64 = await imageFileToBase64(imageFile)
      const prompt = customPrompt.trim() || selectedPreset.prompt

      setProgress('Starting generation...')
      const jobId = await generateFromImage(base64, prompt, {
        provider,
        motionType: selectedPreset.motionType,
        duration,
        intensity: selectedPreset.intensity,
      })

      setProgress('Generating video...')

      for await (const status of pollImageToVideoStatus(jobId)) {
        if (status.status === 'processing') {
          setProgress('Processing...')
        } else if (status.status === 'completed') {
          const videoUrl = await getImageToVideoResult(jobId)
          setResultUrl(videoUrl)
          setProgress('')
          break
        } else if (status.status === 'failed') {
          throw new Error(status.error || 'Generation failed')
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Generation failed')
    } finally {
      setIsGenerating(false)
      setProgress('')
    }
  }, [imageFile, customPrompt, selectedPreset, duration, provider])

  const handleUseAsBackground = useCallback(() => {
    if (!resultUrl) return
    const addVideo = useVideoLayerStore.getState().addVideo
    addVideo({
      id: `i2v-${Date.now()}`,
      sourceUrl: resultUrl,
      name: 'AI Generated Video',
      prompt: customPrompt || selectedPreset.prompt,
      position: { x: 0, y: 0 },
      scale: 1,
      opacity: 1,
      zIndex: 0,
      visible: true,
      loop: true,
      durationSeconds: duration,
      fps: 30,
      width: 1920,
      height: 1080,
    })
  }, [resultUrl, customPrompt, selectedPreset, duration])

  const handleUseAsOverlay = useCallback(() => {
    if (!resultUrl) return
    const addVideo = useVideoLayerStore.getState().addVideo
    addVideo({
      id: `i2v-${Date.now()}`,
      sourceUrl: resultUrl,
      name: 'AI Generated Video',
      prompt: customPrompt || selectedPreset.prompt,
      position: { x: 200, y: 200 },
      scale: 0.5,
      opacity: 1,
      zIndex: 5,
      visible: true,
      loop: false,
      durationSeconds: duration,
      fps: 30,
      width: 1920,
      height: 1080,
    })
  }, [resultUrl, customPrompt, selectedPreset, duration])

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* ── Scrollable content ── */}
      <div className="flex-1 overflow-y-auto px-3 py-2">
        <div className="space-y-3">
          {/* Image Upload */}
          {!imagePreview ? (
            <>
              <PanelDropZone
                icon={Upload}
                label="Drop an image, paste, or click to upload"
                sublabel="PNG, JPG, WebP"
                isDragging={isDragging}
                onDragOver={(e) => {
                  e.preventDefault()
                  setIsDragging(true)
                }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={(e) => {
                  setIsDragging(false)
                  handleDrop(e)
                }}
                onClick={() => fileInputRef.current?.click()}
              />
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={(e) => {
                  const file = e.target.files?.[0]
                  if (file) handleFileSelect(file)
                }}
                className="hidden"
              />
            </>
          ) : (
            <div className="relative">
              <img src={imagePreview} alt="Preview" className="w-full rounded-lg object-cover max-h-40" />
              <button
                onClick={() => {
                  setImageFile(null)
                  setImagePreview(null)
                  setResultUrl(null)
                }}
                className="absolute top-1 right-1 p-1 bg-black/60 rounded-full hover:bg-black/80"
              >
                <X size={12} className="text-white" />
              </button>
            </div>
          )}

          {/* Motion Presets */}
          {imagePreview && (
            <>
              <div>
                <p className="text-[10px] text-gray-500 mb-1.5">Motion Preset</p>
                <div className="grid grid-cols-2 gap-1">
                  {MOTION_PRESETS.map((preset) => (
                    <button
                      key={preset.id}
                      onClick={() => setSelectedPreset(preset)}
                      className={cn(
                        'text-left px-3 py-2.5 rounded-lg border text-[10px] transition-colors',
                        selectedPreset.id === preset.id
                          ? 'bg-accent/10 border-accent/30 text-white'
                          : 'bg-panel-surface border-white/5 text-gray-400 hover:bg-panel-surface-hover',
                      )}
                    >
                      <p className="font-medium">{preset.label}</p>
                      <p className="text-[9px] text-gray-500 mt-0.5">{preset.description}</p>
                    </button>
                  ))}
                </div>
              </div>

              {/* Custom Prompt */}
              <div>
                <p className="text-[10px] text-gray-500 mb-1">Custom Motion Prompt (optional)</p>
                <textarea
                  value={customPrompt}
                  onChange={(e) => setCustomPrompt(e.target.value)}
                  placeholder="Describe the desired motion..."
                  className="w-full bg-zinc-800 border border-white/5 rounded-lg px-3 py-2 text-xs text-zinc-200 placeholder-zinc-600 resize-none h-16 focus:outline-none focus:border-accent/30"
                />
              </div>

              {/* Duration */}
              <PanelButtonGroup
                label="Duration"
                options={DURATION_OPTIONS.map((d) => ({ value: String(d), label: `${d}s` }))}
                value={String(duration)}
                onChange={(v) => setDuration(Number(v))}
              />

              {/* Provider */}
              <PanelButtonGroup
                label="Provider"
                options={PROVIDER_OPTIONS}
                value={provider}
                onChange={(v) => setProvider(v as ImageToVideoProvider)}
              />
            </>
          )}

          {/* Error */}
          {error && <p className="text-[11px] text-red-400">{error}</p>}

          {/* Result */}
          {resultUrl && (
            <div className="space-y-2">
              <video src={resultUrl} autoPlay loop muted playsInline className="w-full rounded-lg" />
              <div className="flex gap-1.5">
                <button
                  onClick={handleUseAsBackground}
                  className="flex-1 py-2 rounded-lg bg-accent hover:bg-[#5a8aff] text-white text-[10px] font-medium flex items-center justify-center gap-1 transition-colors"
                >
                  <Layers size={12} />
                  Use as Background
                </button>
                <button
                  onClick={handleUseAsOverlay}
                  className="flex-1 py-2 rounded-lg bg-accent/20 hover:bg-accent/30 text-accent text-[10px] font-medium flex items-center justify-center gap-1 border border-accent/30 transition-colors"
                >
                  <Layers size={12} />
                  Use as Overlay
                </button>
              </div>
              <div className="flex gap-1.5">
                <a
                  href={resultUrl}
                  download="generated-video.mp4"
                  className="flex-1 py-2 rounded-lg bg-panel-surface hover:bg-panel-surface-hover text-gray-300 text-[10px] font-medium flex items-center justify-center gap-1 border border-white/5 transition-colors"
                >
                  <Download size={12} />
                  Download
                </a>
                <button
                  onClick={handleGenerate}
                  className="flex-1 py-2 rounded-lg bg-panel-surface hover:bg-panel-surface-hover text-gray-300 text-[10px] font-medium flex items-center justify-center gap-1 border border-white/5 transition-colors"
                >
                  <RotateCcw size={12} />
                  Re-generate
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── Footer: Generate button ── */}
      {imagePreview && !resultUrl && (
        <div className="shrink-0 px-3 py-2 border-t border-white/5">
          <button
            onClick={handleGenerate}
            disabled={isGenerating || !imageFile}
            className={cn(
              'w-full py-2 rounded-lg text-xs font-medium transition-colors flex items-center justify-center gap-1.5',
              isGenerating || !imageFile
                ? 'bg-panel-surface text-gray-500 cursor-not-allowed border border-white/5'
                : 'bg-accent hover:bg-[#5a8aff] text-white',
            )}
          >
            {isGenerating ? (
              <>
                <Loader2 size={14} className="animate-spin" />
                {progress || 'Generating...'}
              </>
            ) : (
              <>
                <Wand2 size={14} />
                Generate Video
              </>
            )}
          </button>
        </div>
      )}
    </div>
  )
}
