/**
 * Singing Analyzer — Audio analysis utilities for singing lip sync.
 *
 * Provides BPM detection, beat tracking, onset detection, amplitude envelope,
 * and pitch tracking using Web Audio API.
 */

export interface SongAnalysis {
  bpm: number
  beats: number[]
  onsets: number[]
  amplitudeEnvelope: number[]
  pitchTrack: number[]
  duration: number
  sampleRate: number
}

/**
 * Detect BPM from an AudioBuffer using autocorrelation.
 */
export function detectBPM(audioBuffer: AudioBuffer): number {
  const data = audioBuffer.getChannelData(0)
  const sampleRate = audioBuffer.sampleRate

  // Downsample for faster processing
  const downsampleFactor = 4
  const downsampled = new Float32Array(Math.floor(data.length / downsampleFactor))
  for (let i = 0; i < downsampled.length; i++) {
    downsampled[i] = data[i * downsampleFactor]
  }

  const effectiveSampleRate = sampleRate / downsampleFactor

  // Compute energy envelope
  const windowSize = Math.floor(effectiveSampleRate * 0.01) // 10ms windows
  const envelope = new Float32Array(Math.floor(downsampled.length / windowSize))
  for (let i = 0; i < envelope.length; i++) {
    let sum = 0
    for (let j = 0; j < windowSize && i * windowSize + j < downsampled.length; j++) {
      sum += downsampled[i * windowSize + j] ** 2
    }
    envelope[i] = Math.sqrt(sum / windowSize)
  }

  // Autocorrelation on envelope for BPM detection (60-200 BPM range)
  const envelopeRate = effectiveSampleRate / windowSize
  const minLag = Math.floor(envelopeRate * 60 / 200) // 200 BPM
  const maxLag = Math.floor(envelopeRate * 60 / 60)  // 60 BPM

  let bestLag = minLag
  let bestCorr = -Infinity

  for (let lag = minLag; lag <= maxLag && lag < envelope.length / 2; lag++) {
    let corr = 0
    const len = Math.min(envelope.length - lag, envelope.length / 2)
    for (let i = 0; i < len; i++) {
      corr += envelope[i] * envelope[i + lag]
    }
    corr /= len
    if (corr > bestCorr) {
      bestCorr = corr
      bestLag = lag
    }
  }

  const bpm = Math.round((envelopeRate * 60) / bestLag)
  return Math.max(60, Math.min(200, bpm))
}

/**
 * Detect beat timestamps based on BPM.
 */
export function detectBeats(audioBuffer: AudioBuffer, bpm: number): number[] {
  const beatInterval = 60 / bpm
  const duration = audioBuffer.duration
  const beats: number[] = []

  for (let t = 0; t < duration; t += beatInterval) {
    beats.push(t)
  }

  return beats
}

/**
 * Detect onset timestamps (consonant/attack points) using spectral flux.
 */
export function detectOnsets(audioBuffer: AudioBuffer): number[] {
  const data = audioBuffer.getChannelData(0)
  const sampleRate = audioBuffer.sampleRate
  const windowSize = Math.floor(sampleRate * 0.023) // ~23ms windows
  const hopSize = Math.floor(windowSize / 2)

  const onsets: number[] = []
  let prevEnergy = 0
  const threshold = 0.02

  for (let i = 0; i < data.length - windowSize; i += hopSize) {
    let energy = 0
    for (let j = 0; j < windowSize; j++) {
      energy += data[i + j] ** 2
    }
    energy /= windowSize

    const flux = energy - prevEnergy
    if (flux > threshold && flux > prevEnergy * 0.5) {
      const timeSec = i / sampleRate
      // Avoid double-detection within 50ms
      if (onsets.length === 0 || timeSec - onsets[onsets.length - 1] > 0.05) {
        onsets.push(timeSec)
      }
    }
    prevEnergy = energy
  }

  return onsets
}

/**
 * Extract amplitude envelope at a given window size (in seconds).
 * Returns an array of amplitude values, one per window.
 */
export function extractAmplitudeEnvelope(
  audioBuffer: AudioBuffer,
  windowSizeSec: number = 1 / 30,
): number[] {
  const data = audioBuffer.getChannelData(0)
  const sampleRate = audioBuffer.sampleRate
  const windowSamples = Math.floor(sampleRate * windowSizeSec)

  const envelope: number[] = []
  for (let i = 0; i < data.length; i += windowSamples) {
    let maxAmp = 0
    for (let j = 0; j < windowSamples && i + j < data.length; j++) {
      maxAmp = Math.max(maxAmp, Math.abs(data[i + j]))
    }
    envelope.push(maxAmp)
  }

  return envelope
}

/**
 * Extract pitch track using zero-crossing rate as a simple pitch estimator.
 * Returns an array of pitch values in Hz, one per window.
 */
export function extractPitchTrack(
  audioBuffer: AudioBuffer,
  windowSizeSec: number = 1 / 30,
): number[] {
  const data = audioBuffer.getChannelData(0)
  const sampleRate = audioBuffer.sampleRate
  const windowSamples = Math.floor(sampleRate * windowSizeSec)

  const pitches: number[] = []
  for (let i = 0; i < data.length; i += windowSamples) {
    let crossings = 0
    for (let j = 1; j < windowSamples && i + j < data.length; j++) {
      if ((data[i + j - 1] >= 0 && data[i + j] < 0) ||
          (data[i + j - 1] < 0 && data[i + j] >= 0)) {
        crossings++
      }
    }
    // Zero-crossing rate to pitch approximation
    const pitch = (crossings * sampleRate) / (2 * windowSamples)
    pitches.push(pitch)
  }

  return pitches
}

/**
 * Full song analysis: combines all detection methods.
 */
export async function analyzeSongAudio(audioBuffer: AudioBuffer): Promise<SongAnalysis> {
  const bpm = detectBPM(audioBuffer)
  const beats = detectBeats(audioBuffer, bpm)
  const onsets = detectOnsets(audioBuffer)
  const amplitudeEnvelope = extractAmplitudeEnvelope(audioBuffer)
  const pitchTrack = extractPitchTrack(audioBuffer)

  return {
    bpm,
    beats,
    onsets,
    amplitudeEnvelope,
    pitchTrack,
    duration: audioBuffer.duration,
    sampleRate: audioBuffer.sampleRate,
  }
}
