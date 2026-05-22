/**
 * Audio ducking service: automatically lower music volume during speech.
 */

export interface SpeechRegion {
  startTime: number
  endTime: number
}

/**
 * Analyze an audio buffer to detect speech regions based on RMS energy.
 */
export function analyzeSpeechRegions(
  voiceBuffer: AudioBuffer,
  threshold: number = -30,
  minDurationMs: number = 100,
): SpeechRegion[] {
  const data = voiceBuffer.getChannelData(0)
  const sampleRate = voiceBuffer.sampleRate
  const windowSize = Math.floor(sampleRate * 0.02) // 20ms windows
  const thresholdLinear = Math.pow(10, threshold / 20)
  const regions: SpeechRegion[] = []

  let inSpeech = false
  let regionStart = 0

  for (let i = 0; i < data.length; i += windowSize) {
    let sumSq = 0
    const end = Math.min(i + windowSize, data.length)
    for (let j = i; j < end; j++) {
      sumSq += data[j] * data[j]
    }
    const rms = Math.sqrt(sumSq / (end - i))

    if (rms > thresholdLinear && !inSpeech) {
      inSpeech = true
      regionStart = i / sampleRate
    } else if (rms <= thresholdLinear && inSpeech) {
      inSpeech = false
      const endTime = i / sampleRate
      if ((endTime - regionStart) * 1000 >= minDurationMs) {
        regions.push({ startTime: regionStart, endTime })
      }
    }
  }

  if (inSpeech) {
    const endTime = data.length / sampleRate
    if ((endTime - regionStart) * 1000 >= minDurationMs) {
      regions.push({ startTime: regionStart, endTime })
    }
  }

  return regions
}

/**
 * Apply ducking to a music buffer based on detected speech regions.
 */
export async function applyDucking(
  musicBuffer: AudioBuffer,
  speechRegions: SpeechRegion[],
  config: { duckAmount: number; fadeTime: number },
): Promise<AudioBuffer> {
  const ctx = new OfflineAudioContext(
    musicBuffer.numberOfChannels,
    musicBuffer.length,
    musicBuffer.sampleRate,
  )

  const source = ctx.createBufferSource()
  source.buffer = musicBuffer

  const gain = ctx.createGain()
  gain.gain.value = 1

  const duckLinear = Math.pow(10, config.duckAmount / 20)

  for (const region of speechRegions) {
    const fadeStart = Math.max(0, region.startTime - config.fadeTime)
    const fadeEnd = Math.min(musicBuffer.duration, region.endTime + config.fadeTime)

    gain.gain.linearRampToValueAtTime(1, fadeStart)
    gain.gain.linearRampToValueAtTime(duckLinear, region.startTime)
    gain.gain.linearRampToValueAtTime(duckLinear, region.endTime)
    gain.gain.linearRampToValueAtTime(1, fadeEnd)
  }

  source.connect(gain)
  gain.connect(ctx.destination)
  source.start(0)
  return ctx.startRendering()
}

/**
 * Create ducking automation for real-time use.
 */
export function createDuckingAutomation(
  ctx: AudioContext,
  musicGain: GainNode,
  speechRegions: SpeechRegion[],
  config: { duckAmount: number; fadeTime: number },
): void {
  const duckLinear = Math.pow(10, config.duckAmount / 20)
  const now = ctx.currentTime

  for (const region of speechRegions) {
    const fadeStart = Math.max(0, region.startTime - config.fadeTime)
    const fadeEnd = region.endTime + config.fadeTime

    musicGain.gain.linearRampToValueAtTime(1, now + fadeStart)
    musicGain.gain.linearRampToValueAtTime(duckLinear, now + region.startTime)
    musicGain.gain.linearRampToValueAtTime(duckLinear, now + region.endTime)
    musicGain.gain.linearRampToValueAtTime(1, now + fadeEnd)
  }
}
