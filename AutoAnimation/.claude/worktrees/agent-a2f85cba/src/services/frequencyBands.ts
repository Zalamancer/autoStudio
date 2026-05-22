/**
 * Frequency band definitions and utilities for audio-reactive visuals.
 */

// ── Frequency Band Types ──────────────────────────────────────────

export type FrequencyBand =
  | 'sub-bass'
  | 'bass'
  | 'low-mid'
  | 'mid'
  | 'high-mid'
  | 'treble'
  | 'amplitude'

export const FREQUENCY_BANDS: FrequencyBand[] = [
  'sub-bass',
  'bass',
  'low-mid',
  'mid',
  'high-mid',
  'treble',
  'amplitude',
]

export const FREQUENCY_BAND_LABELS: Record<FrequencyBand, string> = {
  'sub-bass': 'Sub-Bass (20-60Hz)',
  'bass': 'Bass (60-250Hz)',
  'low-mid': 'Low-Mid (250-500Hz)',
  'mid': 'Mid (500Hz-2kHz)',
  'high-mid': 'High-Mid (2k-4kHz)',
  'treble': 'Treble (4k-20kHz)',
  'amplitude': 'Overall Amplitude',
}

// ── Band Frequency Ranges ──────────────────────────────────────────

const BAND_RANGES: Record<Exclude<FrequencyBand, 'amplitude'>, [number, number]> = {
  'sub-bass': [20, 60],
  'bass': [60, 250],
  'low-mid': [250, 500],
  'mid': [500, 2000],
  'high-mid': [2000, 4000],
  'treble': [4000, 20000],
}

/**
 * Get the frequency range (Hz) for a band.
 * Returns [0, 0] for 'amplitude' (not frequency-based).
 */
export function getBandRange(band: FrequencyBand): [number, number] {
  if (band === 'amplitude') return [0, 0]
  return BAND_RANGES[band]
}

/**
 * Extract energy for a specific frequency band from raw frequency data.
 * Returns a normalized value between 0 and 1.
 *
 * @param frequencyData - Uint8Array from AnalyserNode.getByteFrequencyData()
 * @param band - The frequency band to extract
 * @param sampleRate - Audio sample rate (e.g., 48000)
 * @param fftSize - FFT size used by the AnalyserNode (e.g., 2048)
 */
export function extractBandEnergy(
  frequencyData: Uint8Array,
  band: FrequencyBand,
  sampleRate: number,
  _fftSize: number,
): number {
  if (band === 'amplitude') {
    // Overall RMS of all frequency bins
    let sum = 0
    for (let i = 0; i < frequencyData.length; i++) {
      const normalized = frequencyData[i] / 255
      sum += normalized * normalized
    }
    return Math.sqrt(sum / frequencyData.length)
  }

  const [lowHz, highHz] = BAND_RANGES[band]
  const nyquist = sampleRate / 2
  const binWidth = nyquist / frequencyData.length

  const lowBin = Math.floor(lowHz / binWidth)
  const highBin = Math.min(frequencyData.length - 1, Math.ceil(highHz / binWidth))

  if (lowBin >= highBin) return 0

  let sum = 0
  let count = 0
  for (let i = lowBin; i <= highBin; i++) {
    sum += frequencyData[i] / 255
    count++
  }

  return count > 0 ? sum / count : 0
}
