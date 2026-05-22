import type { AIProviderMeta, AIModelMeta, AIModelVideoSettings, AICapability, ProviderId } from '@/types/aiProviders'

// ── Helper to reduce boilerplate ──
const img = (id: string, name: string, p: ProviderId, tier: 'fast' | 'standard' | 'premium', cost: number, secs: number, res?: number): AIModelMeta => ({
  id, name, providerId: p, capability: 'text-to-image', tier, creditCost: cost, async: true,
  estimatedSeconds: secs,
  aspectRatios: ['1:1', '16:9', '9:16', '4:3', '21:9'],
  maxResolution: res ? { width: res, height: res } : undefined,
})

const t2v = (id: string, name: string, p: ProviderId, tier: 'fast' | 'standard' | 'premium', cost: number, secs: number): AIModelMeta => ({
  id, name, providerId: p, capability: 'text-to-video', tier, creditCost: cost, async: true,
  estimatedSeconds: secs, aspectRatios: ['16:9', '9:16', '1:1'],
})

const i2v = (id: string, name: string, p: ProviderId, tier: 'fast' | 'standard' | 'premium', cost: number, secs: number, vs?: AIModelVideoSettings): AIModelMeta => ({
  id, name, providerId: p, capability: 'image-to-video', tier, creditCost: cost, async: true,
  estimatedSeconds: secs,
  videoSettings: vs,
})

const ls = (id: string, name: string, p: ProviderId, tier: 'fast' | 'standard' | 'premium', cost: number, secs: number, inputType: 'image' | 'video', vs?: AIModelVideoSettings): AIModelMeta => ({
  id, name, providerId: p, capability: 'lip-sync', tier, creditCost: cost, async: true,
  estimatedSeconds: secs,
  lipSyncInputType: inputType,
  videoSettings: vs,
})

// ── Per-family video settings ──
const VS_LTX: AIModelVideoSettings = {
  durations: [6, 8, 10, 12, 14, 16, 18, 20], defaultDuration: 6,
  resolutions: ['1080p', '1440p', '2160p'], defaultResolution: '1080p',
  aspectRatios: ['auto', '16:9', '9:16'], supportsAudio: true,
}
const VS_KLING: AIModelVideoSettings = {
  durations: [5, 10], defaultDuration: 5,
  aspectRatios: ['16:9', '9:16', '1:1'],
}
const VS_HAILUO: AIModelVideoSettings = {
  durations: [5, 6], defaultDuration: 5,
  aspectRatios: ['16:9', '9:16', '1:1'],
}
const VS_VEO: AIModelVideoSettings = {
  durations: [5, 8], defaultDuration: 5,
  aspectRatios: ['16:9', '9:16'],
}
const VS_WAN: AIModelVideoSettings = {
  durations: [5], defaultDuration: 5,
}

// ── FAL.ai ──

const FAL_AI: AIProviderMeta = {
  id: 'fal-ai',
  name: 'FAL.ai',
  website: 'https://fal.ai',
  envVar: 'FAL_AI_API_KEY',
  capabilities: ['text-to-image', 'image-to-video', 'text-to-video', 'image-to-image', 'inpainting', 'lip-sync'],
  models: [
    // ── Text-to-Image ──
    // Flux family
    img('fal-ai/flux/schnell',                  'Flux Schnell',         'fal-ai', 'fast',     3,   4,  1024),
    img('fal-ai/flux/dev',                      'Flux Dev',             'fal-ai', 'standard', 6,   10, 1024),
    img('fal-ai/flux-pro/v1.1',                 'Flux Pro v1.1',        'fal-ai', 'premium',  12,  15, 1440),
    img('fal-ai/flux-pro/v1.1-ultra',           'Flux Pro Ultra',       'fal-ai', 'premium',  18,  20, 2048),
    img('fal-ai/flux-2-pro',                    'Flux 2 Pro',           'fal-ai', 'premium',  15,  18, 1440),
    img('fal-ai/flux-2-flex',                   'Flux 2 Flex',          'fal-ai', 'standard', 8,   12, 1024),
    img('fal-ai/flux-pro/kontext',              'Flux Kontext',         'fal-ai', 'premium',  14,  15, 1024),
    // Stable Diffusion
    img('fal-ai/fast-sdxl',                     'SDXL Fast',            'fal-ai', 'fast',     3,   4,  1024),
    img('fal-ai/fast-lightning-sdxl',           'SDXL Lightning',       'fal-ai', 'fast',     2,   2,  1024),
    img('fal-ai/stable-diffusion-v3-medium',    'SD 3 Medium',          'fal-ai', 'standard', 5,   10, 1024),
    // Ideogram
    img('fal-ai/ideogram/v3',                   'Ideogram v3',          'fal-ai', 'premium',  12,  12, 1024),
    img('fal-ai/ideogram/v2/turbo',             'Ideogram v2 Turbo',    'fal-ai', 'fast',     5,   5,  1024),
    // Recraft
    img('fal-ai/recraft/v4/text-to-image',      'Recraft v4',           'fal-ai', 'premium',  12,  15, 1024),
    // Qwen
    img('fal-ai/qwen-image-2/text-to-image',    'Qwen Image 2',        'fal-ai', 'standard', 6,   10, 1024),
    img('fal-ai/qwen-image-2/pro/text-to-image','Qwen Image 2 Pro',    'fal-ai', 'premium',  10,  15, 1024),

    // ── Text-to-Video ──
    // Kling
    t2v('fal-ai/kling-video/v3/pro/text-to-video',         'Kling v3 Pro',       'fal-ai', 'premium',  50,  180),
    t2v('fal-ai/kling-video/v3/standard/text-to-video',     'Kling v3',           'fal-ai', 'standard', 35,  120),
    t2v('fal-ai/kling-video/o3/pro/text-to-video',          'Kling O3 Pro',       'fal-ai', 'premium',  55,  200),
    t2v('fal-ai/kling-video/o3/standard/text-to-video',     'Kling O3',           'fal-ai', 'standard', 40,  150),
    t2v('fal-ai/kling-video/v2.5-turbo/pro/text-to-video',  'Kling 2.5 Turbo',    'fal-ai', 'fast',     25,  60),
    // Veo
    t2v('fal-ai/veo3.1/fast',                               'Veo 3.1 Fast',       'fal-ai', 'fast',     30,  45),
    t2v('fal-ai/veo3.1',                                    'Veo 3.1',            'fal-ai', 'premium',  50,  120),
    t2v('fal-ai/veo3',                                      'Veo 3',              'fal-ai', 'standard', 40,  90),
    // Sora
    t2v('fal-ai/sora-2/text-to-video',                      'Sora 2',             'fal-ai', 'premium',  55,  180),
    // LTX
    t2v('fal-ai/ltx-2.3/text-to-video',                     'LTX 2.3',            'fal-ai', 'standard', 20,  30),

    // ── Image-to-Video ──
    // Kling
    i2v('fal-ai/kling-video/v3/pro/image-to-video',         'Kling v3 Pro',       'fal-ai', 'premium',  50,  180, VS_KLING),
    i2v('fal-ai/kling-video/v3/standard/image-to-video',    'Kling v3',           'fal-ai', 'standard', 35,  120, VS_KLING),
    i2v('fal-ai/kling-video/o3/pro/image-to-video',         'Kling O3 Pro',       'fal-ai', 'premium',  55,  200, VS_KLING),
    i2v('fal-ai/kling-video/o3/standard/image-to-video',    'Kling O3',           'fal-ai', 'standard', 40,  150, VS_KLING),
    i2v('fal-ai/kling-video/v2.6/pro/image-to-video',       'Kling 2.6 Pro',      'fal-ai', 'standard', 35,  120, VS_KLING),
    i2v('fal-ai/kling-video/v2.1/pro/image-to-video',       'Kling 2.1 Pro',      'fal-ai', 'standard', 30,  100, VS_KLING),
    // Hailuo / MiniMax
    i2v('fal-ai/minimax/hailuo-2.3/pro/image-to-video',     'Hailuo 2.3 Pro',     'fal-ai', 'premium',  40,  90,  VS_HAILUO),
    i2v('fal-ai/minimax/hailuo-2.3-fast/pro/image-to-video','Hailuo 2.3 Fast',    'fal-ai', 'fast',     25,  30,  VS_HAILUO),
    i2v('fal-ai/minimax/hailuo-02/pro/image-to-video',      'Hailuo 02 Pro',      'fal-ai', 'standard', 30,  60,  VS_HAILUO),
    i2v('fal-ai/minimax/video-01/image-to-video',           'MiniMax Video-01',   'fal-ai', 'standard', 25,  90,  VS_HAILUO),
    // Veo
    i2v('fal-ai/veo3.1/image-to-video',                     'Veo 3.1',            'fal-ai', 'premium',  50,  120, VS_VEO),
    i2v('fal-ai/veo3/image-to-video',                        'Veo 3',              'fal-ai', 'standard', 40,  90,  VS_VEO),
    // LTX
    i2v('fal-ai/ltx-2.3/image-to-video',                    'LTX 2.3',            'fal-ai', 'standard', 20,  30,  VS_LTX),
    i2v('fal-ai/ltx-2.3/image-to-video/fast',               'LTX 2.3 Fast',       'fal-ai', 'fast',     12,  15,  VS_LTX),

    // ── Lip Sync (Image + Audio) ──
    ls('veed/fabric-1.0',                                    'VEED Fabric 1.0',     'fal-ai', 'standard', 30, 120, 'image', { resolutions: ['720p', '480p'], defaultResolution: '720p' }),
    ls('veed/fabric-1.0/fast',                               'VEED Fabric 1.0 Fast','fal-ai', 'fast',     30,  50, 'image', { resolutions: ['720p', '480p'], defaultResolution: '720p' }),

    // ── Lip Sync (Video + Audio) ──
    ls('fal-ai/kling-video/lipsync/audio-to-video',          'Kling LipSync',       'fal-ai', 'fast',     20,  60, 'video'),
    ls('fal-ai/latentsync',                                  'LatentSync',          'fal-ai', 'standard', 20,  45, 'video'),
    ls('fal-ai/musetalk',                                    'MuseTalk',            'fal-ai', 'fast',     10,  30, 'video'),
  ],
}

// ── Replicate ──

const REPLICATE: AIProviderMeta = {
  id: 'replicate',
  name: 'Replicate',
  website: 'https://replicate.com',
  envVar: 'REPLICATE_API_TOKEN',
  capabilities: ['text-to-image', 'text-to-video', 'image-to-video'],
  models: [
    // ── Text-to-Image ──
    // Flux family
    img('black-forest-labs/flux-schnell',       'Flux Schnell',         'replicate', 'fast',     3,   4,  1024),
    img('black-forest-labs/flux-dev',           'Flux Dev',             'replicate', 'standard', 6,   12, 1024),
    img('black-forest-labs/flux-1.1-pro',       'Flux 1.1 Pro',         'replicate', 'premium',  12,  12, 1440),
    img('black-forest-labs/flux-1.1-pro-ultra', 'Flux 1.1 Pro Ultra',   'replicate', 'premium',  18,  20, 2048),
    img('black-forest-labs/flux-2-pro',         'Flux 2 Pro',           'replicate', 'premium',  15,  18, 1440),
    img('black-forest-labs/flux-kontext-pro',   'Flux Kontext Pro',     'replicate', 'premium',  14,  15, 1024),
    img('black-forest-labs/flux-kontext-max',   'Flux Kontext Max',     'replicate', 'premium',  20,  20, 1440),
    // Stable Diffusion
    img('stability-ai/sdxl',                    'SDXL',                 'replicate', 'standard', 5,   12, 1024),
    img('stability-ai/stable-diffusion-3.5-large','SD 3.5 Large',       'replicate', 'standard', 8,   15, 1024),
    // Seedream (ByteDance)
    img('bytedance/seedream-4.5',               'Seedream 4.5',         'replicate', 'premium',  12,  15, 1024),
    img('bytedance/seedream-4',                 'Seedream 4.0',         'replicate', 'standard', 8,   12, 1024),
    // Ideogram
    img('ideogram-ai/ideogram-v3-balanced',     'Ideogram v3',          'replicate', 'premium',  12,  12, 1024),
    img('ideogram-ai/ideogram-v3-turbo',        'Ideogram v3 Turbo',    'replicate', 'fast',     5,   5,  1024),
    // Google
    img('google/imagen-4-fast',                 'Imagen 4 Fast',        'replicate', 'fast',     5,   5,  1024),
    img('google/imagen-4',                      'Imagen 4',             'replicate', 'premium',  15,  15, 1024),
    // Recraft
    img('recraft-ai/recraft-v4',                'Recraft v4',           'replicate', 'premium',  12,  15, 1024),
    // Luma
    img('luma/photon-flash',                    'Photon Flash',         'replicate', 'fast',     4,   4,  1024),
    img('luma/photon',                          'Photon',               'replicate', 'standard', 8,   10, 1024),

    // ── Text-to-Video ──
    // Kling
    t2v('kwaivgi/kling-v3-video',               'Kling v3',             'replicate', 'premium',  45,  150),
    t2v('kwaivgi/kling-v3-omni-video',          'Kling v3 Omni',        'replicate', 'premium',  50,  180),
    // Veo
    t2v('google/veo-3.1-fast',                  'Veo 3.1 Fast',         'replicate', 'fast',     30,  45),
    t2v('google/veo-3.1',                       'Veo 3.1',              'replicate', 'premium',  50,  120),
    t2v('google/veo-3',                         'Veo 3',                'replicate', 'standard', 40,  90),
    // Sora
    t2v('openai/sora-2',                        'Sora 2',               'replicate', 'premium',  55,  180),
    t2v('openai/sora-2-pro',                    'Sora 2 Pro',           'replicate', 'premium',  65,  240),
    // Hailuo / MiniMax
    t2v('minimax/hailuo-2.3',                   'Hailuo 2.3',           'replicate', 'standard', 30,  90),
    t2v('minimax/hailuo-2.3-fast',              'Hailuo 2.3 Fast',      'replicate', 'fast',     18,  30),
    t2v('minimax/video-01',                     'MiniMax Video-01',     'replicate', 'standard', 25,  90),
    // Hunyuan
    t2v('tencent/hunyuan-video',                'Hunyuan Video',        'replicate', 'standard', 30,  120),
    // Seedance
    t2v('bytedance/seedance-1-pro',             'Seedance 1.0 Pro',     'replicate', 'premium',  40,  120),
    t2v('bytedance/seedance-1-pro-fast',        'Seedance 1.0 Fast',    'replicate', 'fast',     22,  40),
    t2v('bytedance/seedance-1-lite',            'Seedance 1.0 Lite',    'replicate', 'fast',     15,  25),
    // LTX
    t2v('lightricks/ltx-2.3-pro',               'LTX 2.3 Pro',          'replicate', 'standard', 20,  30),
    t2v('lightricks/ltx-2.3-fast',              'LTX 2.3 Fast',         'replicate', 'fast',     10,  12),
    // Luma Ray
    t2v('luma/ray-2-720p',                      'Luma Ray 2',           'replicate', 'standard', 30,  90),
    t2v('luma/ray-flash-2-720p',                'Luma Ray Flash 2',     'replicate', 'fast',     18,  30),
    // Wan
    t2v('wan-video/wan-2.5-t2v',                'Wan 2.5',              'replicate', 'standard', 20,  60),
    // PixVerse
    t2v('pixverse/pixverse-v5.6',               'PixVerse v5.6',        'replicate', 'standard', 25,  60),
    // Runway
    t2v('runwayml/gen-4.5',                     'Runway Gen-4.5',       'replicate', 'premium',  60,  180),

    // ── Image-to-Video ──
    i2v('kwaivgi/kling-v2.5-turbo-pro',         'Kling 2.5 Turbo Pro',  'replicate', 'fast',     25,  45,  VS_KLING),
    i2v('wan-video/wan-2.5-i2v-fast',           'Wan 2.5 I2V Fast',     'replicate', 'fast',     15,  20,  VS_WAN),
  ],
}

// ── Registry ──

const ALL_PROVIDERS: AIProviderMeta[] = [FAL_AI, REPLICATE]

const providerMap = new Map<ProviderId, AIProviderMeta>(
  ALL_PROVIDERS.map((p) => [p.id, p])
)

const modelMap = new Map<string, AIModelMeta>(
  ALL_PROVIDERS.flatMap((p) => p.models).map((m) => [m.id, m])
)

export function getProviders(): AIProviderMeta[] {
  return ALL_PROVIDERS
}

export function getProvider(id: ProviderId): AIProviderMeta | undefined {
  return providerMap.get(id)
}

export function getModel(modelId: string): AIModelMeta | undefined {
  return modelMap.get(modelId)
}

export function getModelsForCapability(capability: AICapability): AIModelMeta[] {
  return ALL_PROVIDERS
    .flatMap((p) => p.models)
    .filter((m) => m.capability === capability)
    .sort((a, b) => {
      const tierOrder = { fast: 0, standard: 1, premium: 2 }
      return tierOrder[a.tier] - tierOrder[b.tier]
    })
}

export function getConfiguredModels(
  capability: AICapability,
  configuredProviderIds: ProviderId[]
): AIModelMeta[] {
  const configured = new Set(configuredProviderIds)
  return getModelsForCapability(capability).filter((m) => configured.has(m.providerId))
}

export function getModelOptions(
  capability: AICapability,
  configuredProviderIds: ProviderId[]
): { value: string; label: string; group: string; disabled: boolean }[] {
  const configured = new Set(configuredProviderIds)
  return getModelsForCapability(capability).map((m) => ({
    value: m.id,
    label: m.name,
    group: getProvider(m.providerId)?.name ?? m.providerId,
    disabled: !configured.has(m.providerId),
  }))
}
