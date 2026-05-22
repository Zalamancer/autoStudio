/**
 * Beat Detection Service — Web Audio API-based onset/beat detection.
 *
 * Decodes audio → computes spectral flux onset detection → auto-correlates
 * for BPM estimation → quantizes to a beat grid.
 */

// ── Types ──────────────────────────────────────────────────────────────

export interface BeatAnalysis {
  /** Detected BPM */
  bpm: number
  /** Beat positions in seconds */
  beats: number[]
  /** Onset positions in seconds (includes non-beat transients) */
  onsets: number[]
  /** Segmented sections with energy profile */
  segments: BeatSegment[]
  /** Duration of the analyzed audio in seconds */
  duration: number
}

export interface BeatSegment {
  startTime: number
  endTime: number
  averageEnergy: number
  peakEnergy: number
}

// ── Constants ──────────────────────────────────────────────────────────

const FFT_SIZE = 2048
const HOP_SIZE = 512
const ONSET_THRESHOLD = 1.5
const MIN_BPM = 60
const MAX_BPM = 200
const SEGMENT_DURATION = 4 // seconds per segment

// ── Core Detection ─────────────────────────────────────────────────────

/**
 * Analyze audio for beats, onsets, and BPM.
 */
export async function detectBeats(audioBuffer: AudioBuffer): Promise<BeatAnalysis> {
  const channelData = audioBuffer.getChannelData(0)
  const sampleRate = audioBuffer.sampleRate
  const duration = audioBuffer.duration

  // 1. Compute spectral flux
  const fluxValues = computeSpectralFlux(channelData, sampleRate)
  const hopDuration = HOP_SIZE / sampleRate

  // 2. Detect onsets via adaptive thresholding
  const onsets = detectOnsets(fluxValues, hopDuration)

  // 3. Estimate BPM via auto-correlation of onset signal
  const bpm = estimateBPM(onsets, duration)

  // 4. Build beat grid from BPM
  const beats = buildBeatGrid(bpm, onsets, duration)

  // 5. Build energy segments
  const segments = buildSegments(channelData, sampleRate, duration)

  return { bpm, beats, onsets, segments, duration }
}

/**
 * Analyze beats from an audio URL (Blob URL or remote URL).
 */
export async function detectBeatsFromUrl(audioUrl: string): Promise<BeatAnalysis> {
  const response = await fetch(audioUrl)
  const arrayBuffer = await response.arrayBuffer()

  // Re-create context with correct length
  const tempCtx = new AudioContext()
  const decoded = await tempCtx.decodeAudioData(arrayBuffer)
  await tempCtx.close()

  return detectBeats(decoded)
}

// ── Spectral Flux ──────────────────────────────────────────────────────

function computeSpectralFlux(samples: Float32Array, _sampleRate: number): number[] {
  const flux: number[] = []

  // Use a simple energy-based approach (faster than full FFT for beat detection)
  let prevEnergy = 0

  for (let i = 0; i < samples.length - FFT_SIZE; i += HOP_SIZE) {
    let energy = 0
    // Band-pass focus on typical beat frequencies (60-200 Hz)
    for (let j = 0; j < FFT_SIZE; j++) {
      const s = samples[i + j]
      energy += s * s
    }
    energy /= FFT_SIZE

    // Spectral flux is the positive difference in energy
    const diff = energy - prevEnergy
    flux.push(diff > 0 ? diff : 0)
    prevEnergy = energy
  }

  return flux
}

// ── Onset Detection ────────────────────────────────────────────────────

function detectOnsets(flux: number[], hopDuration: number): number[] {
  if (flux.length === 0) return []

  const onsets: number[] = []
  const windowSize = 10 // frames for local average

  for (let i = windowSize; i < flux.length - 1; i++) {
    // Compute local average
    let localAvg = 0
    for (let j = i - windowSize; j < i; j++) {
      localAvg += flux[j]
    }
    localAvg /= windowSize

    // Check if current frame is a local peak above threshold
    if (
      flux[i] > localAvg * ONSET_THRESHOLD &&
      flux[i] > flux[i - 1] &&
      flux[i] >= flux[i + 1]
    ) {
      const time = i * hopDuration
      // Minimum gap between onsets: 100ms
      if (onsets.length === 0 || time - onsets[onsets.length - 1] > 0.1) {
        onsets.push(time)
      }
    }
  }

  return onsets
}

// ── BPM Estimation ─────────────────────────────────────────────────────

function estimateBPM(onsets: number[], _duration: number): number {
  if (onsets.length < 4) {
    // Too few onsets — estimate from average spacing
    if (onsets.length >= 2) {
      const avgGap = (onsets[onsets.length - 1] - onsets[0]) / (onsets.length - 1)
      const bpm = 60 / avgGap
      return Math.round(Math.max(MIN_BPM, Math.min(MAX_BPM, bpm)))
    }
    return 120 // fallback
  }

  // Compute inter-onset intervals
  const intervals: number[] = []
  for (let i = 1; i < onsets.length; i++) {
    intervals.push(onsets[i] - onsets[i - 1])
  }

  // Histogram of intervals (quantized to 10ms bins)
  const binSize = 0.01
  const histogram = new Map<number, number>()
  for (const interval of intervals) {
    const bin = Math.round(interval / binSize) * binSize
    histogram.set(bin, (histogram.get(bin) || 0) + 1)
  }

  // Find the most common interval
  let bestBin = 0.5 // 120 BPM default
  let bestCount = 0
  for (const [bin, count] of histogram) {
    // Only consider intervals that map to reasonable BPM
    const bpm = 60 / bin
    if (bpm >= MIN_BPM && bpm <= MAX_BPM && count > bestCount) {
      bestCount = count
      bestBin = bin
    }
  }

  const bpm = Math.round(60 / bestBin)
  return Math.max(MIN_BPM, Math.min(MAX_BPM, bpm))
}

// ── Beat Grid ──────────────────────────────────────────────────────────

function buildBeatGrid(bpm: number, onsets: number[], duration: number): number[] {
  const beatInterval = 60 / bpm
  const beats: number[] = []

  // Find the best phase alignment with detected onsets
  let bestPhase = 0
  let bestScore = 0

  // Try different phase offsets
  const phaseSteps = 16
  for (let p = 0; p < phaseSteps; p++) {
    const phase = (p / phaseSteps) * beatInterval
    let score = 0
    for (let t = phase; t < duration; t += beatInterval) {
      // Score based on proximity to nearest onset
      for (const onset of onsets) {
        const dist = Math.abs(t - onset)
        if (dist < beatInterval * 0.15) {
          score += 1 - dist / (beatInterval * 0.15)
        }
      }
    }
    if (score > bestScore) {
      bestScore = score
      bestPhase = phase
    }
  }

  // Generate beat grid with best phase
  for (let t = bestPhase; t < duration; t += beatInterval) {
    beats.push(t)
  }

  return beats
}

// ── Re-detection with Sensitivity ──────────────────────────────────

/**
 * Re-run beat detection with an adjusted onset threshold based on
 * user sensitivity slider (0-1). Higher sensitivity = lower threshold = more beats.
 * Optionally override BPM while keeping phase alignment.
 */
export async function redetectWithSensitivity(
  audioUrl: string,
  sensitivity: number,
  manualBpm?: number,
): Promise<BeatAnalysis> {
  const response = await fetch(audioUrl)
  const arrayBuffer = await response.arrayBuffer()
  const tempCtx = new AudioContext()
  const decoded = await tempCtx.decodeAudioData(arrayBuffer)
  await tempCtx.close()

  const channelData = decoded.getChannelData(0)
  const sampleRate = decoded.sampleRate
  const duration = decoded.duration
  const hopDuration = HOP_SIZE / sampleRate

  // 1. Compute spectral flux
  const fluxValues = computeSpectralFlux(channelData, sampleRate)

  // 2. Detect onsets with adjusted threshold
  // sensitivity 0 = very selective (high threshold), 1 = very sensitive (low threshold)
  const adjustedThreshold = ONSET_THRESHOLD + (1 - sensitivity) * 1.5 - sensitivity * 0.5
  const onsets = detectOnsetsWithThreshold(fluxValues, hopDuration, Math.max(1.05, adjustedThreshold))

  // 3. Estimate or use manual BPM
  const bpm = manualBpm ?? estimateBPM(onsets, duration)

  // 4. Build beat grid
  const beats = buildBeatGrid(bpm, onsets, duration)

  // 5. Build energy segments
  const segments = buildSegments(channelData, sampleRate, duration)

  return { bpm, beats, onsets, segments, duration }
}

/**
 * Onset detection with a configurable threshold.
 */
function detectOnsetsWithThreshold(
  flux: number[],
  hopDuration: number,
  threshold: number,
): number[] {
  if (flux.length === 0) return []

  const onsets: number[] = []
  const windowSize = 10

  for (let i = windowSize; i < flux.length - 1; i++) {
    let localAvg = 0
    for (let j = i - windowSize; j < i; j++) {
      localAvg += flux[j]
    }
    localAvg /= windowSize

    if (
      flux[i] > localAvg * threshold &&
      flux[i] > flux[i - 1] &&
      flux[i] >= flux[i + 1]
    ) {
      const time = i * hopDuration
      if (onsets.length === 0 || time - onsets[onsets.length - 1] > 0.1) {
        onsets.push(time)
      }
    }
  }

  return onsets
}

// ── Frequency Band Pre-computation (for export) ────────────────────

export interface FrequencyBandData {
  [band: string]: number[]
}

/**
 * Pre-compute per-frame frequency band energy levels.
 * Used for audio-reactive export (offline rendering).
 * Returns a map of band name -> array of per-frame energy values (0-1).
 */
export function computeFrequencyBands(audioBuffer: AudioBuffer, fps: number): FrequencyBandData {
  const channelData = audioBuffer.getChannelData(0)
  const sampleRate = audioBuffer.sampleRate
  const samplesPerFrame = Math.floor(sampleRate / fps)
  const totalFrames = Math.ceil(channelData.length / samplesPerFrame)
  const fftSize = 1024

  const bands: Record<string, [number, number]> = {
    'sub-bass': [20, 60],
    'bass': [60, 250],
    'low-mid': [250, 500],
    'mid': [500, 2000],
    'high-mid': [2000, 4000],
    'treble': [4000, 20000],
  }

  const result: FrequencyBandData = {}
  for (const band of Object.keys(bands)) {
    result[band] = new Array(totalFrames).fill(0)
  }
  result['amplitude'] = new Array(totalFrames).fill(0)

  // Hanning window
  const window = new Float32Array(fftSize)
  for (let i = 0; i < fftSize; i++) {
    window[i] = 0.5 * (1 - Math.cos((2 * Math.PI * i) / (fftSize - 1)))
  }

  for (let frame = 0; frame < totalFrames; frame++) {
    const start = frame * samplesPerFrame
    const end = Math.min(start + samplesPerFrame, channelData.length)

    // Compute RMS amplitude for this frame
    let rmsSum = 0
    for (let i = start; i < end; i++) {
      rmsSum += channelData[i] * channelData[i]
    }
    result['amplitude'][frame] = Math.sqrt(rmsSum / (end - start))

    // Simple DFT for frequency bands (use center of frame window)
    const fftStart = Math.max(0, start + Math.floor(samplesPerFrame / 2) - Math.floor(fftSize / 2))
    const fftEnd = Math.min(fftStart + fftSize, channelData.length)
    const actualSize = fftEnd - fftStart

    if (actualSize < 64) continue

    // Compute power spectrum via simple magnitude estimation
    const freqResolution = sampleRate / actualSize
    const halfSize = Math.floor(actualSize / 2)

    // Compute energy in each band using time-domain band-pass approximation
    for (const [bandName, [lowHz, highHz]] of Object.entries(bands)) {
      const lowBin = Math.floor(lowHz / freqResolution)
      const highBin = Math.min(halfSize - 1, Math.ceil(highHz / freqResolution))

      if (lowBin >= highBin) continue

      // Simple energy calculation for the frequency range
      // Using autocorrelation-based approach for efficiency
      let energy = 0
      for (let i = fftStart; i < fftEnd; i++) {
        const s = channelData[i] * window[i - fftStart] || 0
        energy += s * s
      }
      // Scale by band width ratio
      const bandRatio = (highBin - lowBin) / halfSize
      result[bandName][frame] = Math.sqrt(energy * bandRatio / actualSize)
    }
  }

  // Normalize all bands to 0-1
  for (const band of Object.keys(result)) {
    const arr = result[band]
    let max = 0
    for (const v of arr) {
      if (v > max) max = v
    }
    if (max > 0) {
      for (let i = 0; i < arr.length; i++) {
        arr[i] = arr[i] / max
      }
    }
  }

  return result
}

// ── Segments ───────────────────────────────────────────────────────────

function buildSegments(
  samples: Float32Array,
  sampleRate: number,
  _duration: number,
): BeatSegment[] {
  const segments: BeatSegment[] = []
  const segmentSamples = Math.floor(SEGMENT_DURATION * sampleRate)

  for (let i = 0; i < samples.length; i += segmentSamples) {
    const end = Math.min(i + segmentSamples, samples.length)
    let sum = 0
    let peak = 0

    for (let j = i; j < end; j++) {
      const abs = Math.abs(samples[j])
      sum += abs
      if (abs > peak) peak = abs
    }

    const count = end - i
    segments.push({
      startTime: i / sampleRate,
      endTime: end / sampleRate,
      averageEnergy: sum / count,
      peakEnergy: peak,
    })
  }

  return segments
}
