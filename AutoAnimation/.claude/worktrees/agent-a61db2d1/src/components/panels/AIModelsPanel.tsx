import { useState, useEffect, useCallback, useRef } from 'react'
import { Sparkles, Image, Film, Loader2, X, Check, Download, Zap, Star, CircleDot, Mic } from 'lucide-react'
import { PanelSelect } from '@/components/ui/panel-controls'
import { cn } from '@/lib/utils'
import { useAIProviderStore } from '@/stores/useAIProviderStore'
import { getProviders, getModelsForCapability, getModel } from '@/services/aiProviderRegistry'
import { generateImage, generateVideo, imageToVideo, pollJob } from '@/services/aiProviderClient'
import type { AICapability, AIModelMeta, ProviderId, AIJobStatus } from '@/types/aiProviders'

const CAPABILITY_TABS: { id: AICapability; label: string; icon: typeof Image }[] = [
  { id: 'text-to-image', label: 'Image', icon: Image },
  { id: 'text-to-video', label: 'Video', icon: Film },
  { id: 'image-to-video', label: 'Img2Vid', icon: Film },
  { id: 'lip-sync', label: 'Lip Sync', icon: Mic },
]

const TIER_ICON: Record<string, typeof Zap> = {
  fast: Zap,
  standard: CircleDot,
  premium: Star,
}

const TIER_COLOR: Record<string, string> = {
  fast: 'text-yellow-400',
  standard: 'text-zinc-400',
  premium: 'text-purple-400',
}

const ASPECT_RATIOS = ['1:1', '16:9', '9:16', '4:3', '21:9']

export function AIModelsPanel() {
  const {
    activeCapability,
    setActiveCapability,
    configuredProviders,
    selectedModel,
    setSelectedModel,
    activeJobs,
    addJob,
    updateJob,
    removeJob,
    fetchStatus,
    statusFetchedAt,
  } = useAIProviderStore()

  const [prompt, setPrompt] = useState('')
  const [negativePrompt, setNegativePrompt] = useState('')
  const [aspectRatio, setAspectRatio] = useState('1:1')
  const [count, setCount] = useState(1)
  const [generating, setGenerating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [results, setResults] = useState<Array<{ url: string; capability: string }>>([])
  const pollingRef = useRef<Map<string, NodeJS.Timeout>>(new Map())

  // Fetch provider status on mount
  useEffect(() => {
    if (!statusFetchedAt || Date.now() - statusFetchedAt > 60_000) {
      fetchStatus()
    }
  }, [fetchStatus, statusFetchedAt])

  // Cleanup polling on unmount
  useEffect(() => {
    return () => {
      for (const timer of pollingRef.current.values()) {
        clearInterval(timer)
      }
    }
  }, [])

  const models = getModelsForCapability(activeCapability)
  const configuredSet = new Set(configuredProviders)
  const currentModelId = selectedModel[activeCapability]
  const currentModel = currentModelId ? getModel(currentModelId) : undefined

  // Group models by provider
  const providers = getProviders()
  const modelsByProvider = new Map<string, AIModelMeta[]>()
  for (const m of models) {
    const list = modelsByProvider.get(m.providerId) ?? []
    list.push(m)
    modelsByProvider.set(m.providerId, list)
  }

  const startPolling = useCallback((jobId: string, providerId: ProviderId) => {
    if (pollingRef.current.has(jobId)) return

    const timer = setInterval(async () => {
      try {
        const status = await pollJob(jobId, providerId)
        updateJob(jobId, status)

        if (status.status === 'completed') {
          clearInterval(pollingRef.current.get(jobId))
          pollingRef.current.delete(jobId)

          // Add results
          if (status.result?.urls) {
            setResults((prev) => [
              ...status.result!.urls!.map((url) => ({ url, capability: activeCapability })),
              ...prev,
            ])
          } else if (status.result?.url) {
            setResults((prev) => [
              { url: status.result!.url!, capability: activeCapability },
              ...prev,
            ])
          }
        }

        if (status.status === 'failed') {
          clearInterval(pollingRef.current.get(jobId))
          pollingRef.current.delete(jobId)
        }
      } catch {
        // Keep polling on transient errors
      }
    }, 3000)

    pollingRef.current.set(jobId, timer)
  }, [activeCapability, updateJob])

  const handleGenerate = useCallback(async () => {
    if (!prompt.trim() || !currentModelId || !currentModel) return

    setGenerating(true)
    setError(null)

    try {
      let result: any

      if (activeCapability === 'text-to-image') {
        result = await generateImage({
          prompt: prompt.trim(),
          negativePrompt: negativePrompt.trim() || undefined,
          aspectRatio,
          count,
        }, currentModelId)

        // If synchronous result with images
        if (result.images) {
          setResults((prev) => [
            ...result.images
              .filter((img: any) => img.url)
              .map((img: any) => ({ url: img.url, capability: activeCapability })),
            ...prev,
          ])
        }
      } else if (activeCapability === 'text-to-video') {
        result = await generateVideo({
          prompt: prompt.trim(),
          aspectRatio,
        }, currentModelId)
      } else if (activeCapability === 'image-to-video') {
        result = await imageToVideo({
          prompt: prompt.trim() || undefined,
        }, currentModelId)
      }

      // If async job, start polling
      if (result?.jobId) {
        const job: AIJobStatus = {
          id: result.jobId,
          status: result.status ?? 'queued',
          estimatedSeconds: result.estimatedSeconds,
        }
        addJob(job)
        startPolling(result.jobId, currentModel.providerId)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Generation failed')
    } finally {
      setGenerating(false)
    }
  }, [prompt, negativePrompt, aspectRatio, count, currentModelId, currentModel, activeCapability, addJob, startPolling])

  return (
    <div className="flex flex-col h-full">
      {/* Capability tabs */}
      <div className="shrink-0 flex items-center gap-1 px-3 py-2 border-b border-white/5">
        {CAPABILITY_TABS.map((tab) => {
          const isActive = activeCapability === tab.id
          return (
            <button
              key={tab.id}
              onClick={() => setActiveCapability(tab.id)}
              className={cn(
                'flex-1 h-8 rounded-lg flex items-center justify-center gap-1.5 transition-colors text-xs font-medium',
                isActive
                  ? 'bg-white text-black'
                  : 'text-gray-400 hover:text-white hover:bg-[#2a2a2a]'
              )}
            >
              <tab.icon size={14} />
              {tab.label}
            </button>
          )
        })}
      </div>

      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto px-3 py-3 space-y-4">
        {/* Prompt */}
        <div className="space-y-2">
          <label className="text-xs text-zinc-400 font-medium">Prompt</label>
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Describe what you want to generate..."
            className="w-full h-20 px-3 py-2 bg-zinc-800 border border-white/10 rounded-lg text-sm text-zinc-200 placeholder-zinc-600 resize-none focus:outline-none focus:border-green-500/50"
          />
        </div>

        {activeCapability === 'text-to-image' && (
          <>
            <div className="space-y-2">
              <label className="text-xs text-zinc-400 font-medium">Negative Prompt</label>
              <input
                type="text"
                value={negativePrompt}
                onChange={(e) => setNegativePrompt(e.target.value)}
                placeholder="What to avoid..."
                className="w-full h-8 px-3 bg-zinc-800 border border-white/10 rounded-lg text-sm text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-green-500/50"
              />
            </div>

            <div className="flex gap-3">
              <div className="flex-1">
                <PanelSelect
                  label="Aspect"
                  value={aspectRatio}
                  onChange={setAspectRatio}
                  options={ASPECT_RATIOS.map((r) => ({ value: r, label: r }))}
                  fullWidth
                />
              </div>
              <div className="w-16">
                <PanelSelect
                  label="Count"
                  value={String(count)}
                  onChange={(v) => setCount(Number(v))}
                  options={[1, 2, 4].map((n) => ({ value: String(n), label: String(n) }))}
                  fullWidth
                />
              </div>
            </div>
          </>
        )}

        {(activeCapability === 'text-to-video' || activeCapability === 'image-to-video') && (
          <PanelSelect
            label="Aspect Ratio"
            value={aspectRatio}
            onChange={setAspectRatio}
            options={['16:9', '9:16', '1:1'].map((r) => ({ value: r, label: r }))}
            fullWidth
          />
        )}

        {/* Model cards grouped by provider */}
        {providers.map((provider) => {
          const providerModels = modelsByProvider.get(provider.id)
          if (!providerModels || providerModels.length === 0) return null
          const isConfigured = configuredSet.has(provider.id)

          return (
            <div key={provider.id} className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">{provider.name}</span>
                {!isConfigured && (
                  <span className="text-[10px] text-zinc-600 bg-zinc-800 px-1.5 py-0.5 rounded">No API key</span>
                )}
              </div>

              <div className="grid grid-cols-2 gap-2">
                {providerModels.map((model) => {
                  const isSelected = currentModelId === model.id
                  const TierIcon = TIER_ICON[model.tier]
                  const tierColor = TIER_COLOR[model.tier]

                  return (
                    <button
                      key={model.id}
                      onClick={() => isConfigured && setSelectedModel(activeCapability, model.id)}
                      disabled={!isConfigured}
                      title={!isConfigured ? `Configure ${provider.envVar} in server/.env` : model.id}
                      className={cn(
                        'relative flex flex-col items-start gap-1 p-2.5 rounded-lg border transition-all text-left',
                        isSelected
                          ? 'border-green-500/60 bg-green-500/10'
                          : isConfigured
                            ? 'border-white/10 bg-zinc-800/50 hover:border-white/20 hover:bg-zinc-800'
                            : 'border-white/5 bg-zinc-900/50 opacity-50 cursor-not-allowed'
                      )}
                    >
                      <span className="text-xs font-medium text-zinc-200 leading-tight">{model.name}</span>
                      <div className="flex items-center gap-1.5">
                        <TierIcon size={11} className={tierColor} />
                        <span className="text-[10px] text-zinc-500">{model.creditCost} cr</span>
                        {model.estimatedSeconds && (
                          <span className="text-[10px] text-zinc-600">~{model.estimatedSeconds}s</span>
                        )}
                      </div>
                      {isSelected && (
                        <div className="absolute top-1.5 right-1.5">
                          <Check size={12} className="text-green-400" />
                        </div>
                      )}
                    </button>
                  )
                })}
              </div>
            </div>
          )
        })}

        {/* Generate button */}
        <button
          onClick={handleGenerate}
          disabled={generating || !prompt.trim() || !currentModelId}
          className={cn(
            'w-full h-10 rounded-lg flex items-center justify-center gap-2 text-sm font-medium transition-all',
            generating || !prompt.trim() || !currentModelId
              ? 'bg-zinc-700 text-zinc-500 cursor-not-allowed'
              : 'bg-green-600 hover:bg-green-500 text-white'
          )}
        >
          {generating ? (
            <>
              <Loader2 size={16} className="animate-spin" />
              Generating...
            </>
          ) : (
            <>
              <Sparkles size={16} />
              Generate{currentModel ? ` with ${currentModel.name}` : ''}
              {currentModel && <span className="text-green-200/70 text-xs ml-1">{currentModel.creditCost} cr</span>}
            </>
          )}
        </button>

        {error && (
          <div className="px-3 py-2 bg-red-500/10 border border-red-500/20 rounded-lg text-xs text-red-400">
            {error}
          </div>
        )}

        {/* Active Jobs */}
        {activeJobs.length > 0 && (
          <div className="space-y-2">
            <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Active Jobs</span>
            {activeJobs.map((job) => (
              <div key={job.id} className="flex items-center gap-2 px-3 py-2 bg-zinc-800/50 border border-white/5 rounded-lg">
                <Loader2 size={14} className={cn(
                  job.status === 'failed' ? 'text-red-400' : 'text-green-400 animate-spin'
                )} />
                <div className="flex-1 min-w-0">
                  <div className="text-xs text-zinc-300 truncate">
                    {job.status === 'failed' ? job.error : `${job.status}${job.progress != null ? ` ${job.progress}%` : ''}`}
                  </div>
                  {job.progress != null && job.status !== 'failed' && (
                    <div className="mt-1 h-1 bg-zinc-700 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-green-500 rounded-full transition-all"
                        style={{ width: `${job.progress}%` }}
                      />
                    </div>
                  )}
                </div>
                <button
                  onClick={() => removeJob(job.id)}
                  className="shrink-0 p-1 text-zinc-500 hover:text-zinc-300 transition-colors"
                >
                  <X size={12} />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Recent Results */}
        {results.length > 0 && (
          <div className="space-y-2">
            <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Results</span>
            <div className="grid grid-cols-2 gap-2">
              {results.map((r, i) => (
                <a
                  key={i}
                  href={r.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="relative group aspect-square bg-zinc-800 rounded-lg overflow-hidden border border-white/5 hover:border-white/20 transition-colors"
                >
                  {r.capability.includes('video') ? (
                    <video src={r.url} className="w-full h-full object-cover" muted />
                  ) : (
                    <img src={r.url} alt="" className="w-full h-full object-cover" loading="lazy" />
                  )}
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <Download size={16} className="text-white" />
                  </div>
                </a>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
