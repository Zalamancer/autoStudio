import type { AudioEnhancementConfig, EQBand } from '@/types/audioExpanded'

/**
 * Analyze audio loudness (integrated LUFS approximation via RMS).
 */
export function analyzeAudioLoudness(buffer: AudioBuffer): { rms: number; peak: number; estimatedLUFS: number } {
  const data = buffer.getChannelData(0)
  let sumSq = 0
  let peak = 0
  for (let i = 0; i < data.length; i++) {
    const abs = Math.abs(data[i])
    sumSq += data[i] * data[i]
    if (abs > peak) peak = abs
  }
  const rms = Math.sqrt(sumSq / data.length)
  // Approximate LUFS from RMS (simplified, not ITU-R BS.1770 compliant)
  const estimatedLUFS = 20 * Math.log10(rms + 1e-10) - 0.691
  return { rms, peak, estimatedLUFS }
}

/**
 * Apply auto-leveling to normalize audio to target LUFS.
 */
export async function applyAutoLeveling(
  ctx: OfflineAudioContext,
  buffer: AudioBuffer,
  targetLUFS: number,
): Promise<AudioBuffer> {
  const { estimatedLUFS } = analyzeAudioLoudness(buffer)
  const gainDb = targetLUFS - estimatedLUFS
  const gainLinear = Math.pow(10, gainDb / 20)

  const source = ctx.createBufferSource()
  source.buffer = buffer
  const gain = ctx.createGain()
  gain.gain.value = Math.min(gainLinear, 6) // Cap at +15.6 dB
  source.connect(gain)
  gain.connect(ctx.destination)
  source.start(0)
  return ctx.startRendering()
}

/**
 * Apply noise gate processing.
 */
export async function applyNoiseGate(
  ctx: OfflineAudioContext,
  buffer: AudioBuffer,
  config: AudioEnhancementConfig['noiseGate'],
): Promise<AudioBuffer> {
  if (!config.enabled) return buffer

  const source = ctx.createBufferSource()
  source.buffer = buffer
  // Use a dynamics compressor with extreme ratio to simulate gate
  const compressor = ctx.createDynamicsCompressor()
  compressor.threshold.value = config.threshold
  compressor.ratio.value = 20
  compressor.attack.value = config.attack
  compressor.release.value = config.release
  compressor.knee.value = 0

  source.connect(compressor)
  compressor.connect(ctx.destination)
  source.start(0)
  return ctx.startRendering()
}

/**
 * Apply dynamic range compression.
 */
export async function applyCompression(
  ctx: OfflineAudioContext,
  buffer: AudioBuffer,
  config: AudioEnhancementConfig['compression'],
): Promise<AudioBuffer> {
  if (!config.enabled) return buffer

  const source = ctx.createBufferSource()
  source.buffer = buffer
  const compressor = ctx.createDynamicsCompressor()
  compressor.threshold.value = config.threshold
  compressor.ratio.value = config.ratio
  compressor.attack.value = config.attack
  compressor.release.value = config.release
  compressor.knee.value = 6

  const makeupGain = ctx.createGain()
  makeupGain.gain.value = Math.pow(10, config.makeupGain / 20)

  source.connect(compressor)
  compressor.connect(makeupGain)
  makeupGain.connect(ctx.destination)
  source.start(0)
  return ctx.startRendering()
}

/**
 * Apply parametric EQ using biquad filters.
 */
export async function applyEQ(
  ctx: OfflineAudioContext,
  buffer: AudioBuffer,
  bands: EQBand[],
): Promise<AudioBuffer> {
  if (bands.length === 0) return buffer

  const source = ctx.createBufferSource()
  source.buffer = buffer

  let lastNode: AudioNode = source
  for (const band of bands) {
    const filter = ctx.createBiquadFilter()
    filter.type = band.type
    filter.frequency.value = band.frequency
    filter.gain.value = band.gain
    filter.Q.value = band.q
    lastNode.connect(filter)
    lastNode = filter
  }

  lastNode.connect(ctx.destination)
  source.start(0)
  return ctx.startRendering()
}

/**
 * Create a complete audio processing chain from config.
 */
export async function processAudio(
  buffer: AudioBuffer,
  config: AudioEnhancementConfig,
): Promise<AudioBuffer> {
  let result = buffer

  if (config.autoLeveling) {
    const ctx = new OfflineAudioContext(result.numberOfChannels, result.length, result.sampleRate)
    result = await applyAutoLeveling(ctx, result, config.targetLUFS)
  }

  if (config.noiseGate.enabled) {
    const ctx = new OfflineAudioContext(result.numberOfChannels, result.length, result.sampleRate)
    result = await applyNoiseGate(ctx, result, config.noiseGate)
  }

  if (config.compression.enabled) {
    const ctx = new OfflineAudioContext(result.numberOfChannels, result.length, result.sampleRate)
    result = await applyCompression(ctx, result, config.compression)
  }

  if (config.eq.enabled && config.eq.bands.length > 0) {
    const ctx = new OfflineAudioContext(result.numberOfChannels, result.length, result.sampleRate)
    result = await applyEQ(ctx, result, config.eq.bands)
  }

  return result
}

/** Default audio enhancement config */
export function getDefaultEnhancementConfig(): AudioEnhancementConfig {
  return {
    autoLeveling: false,
    targetLUFS: -14,
    noiseGate: { enabled: false, threshold: -50, attack: 0.001, release: 0.05 },
    compression: { enabled: false, threshold: -24, ratio: 4, attack: 0.003, release: 0.25, makeupGain: 0 },
    eq: { enabled: false, bands: [] },
    spatialAudio: { enabled: false, panPosition: 0, roomSize: 0.5, reverbMix: 0.2, distanceAttenuation: 1 },
    ducking: { enabled: false, duckAmount: -12, fadeTime: 0.3, threshold: -30 },
  }
}
