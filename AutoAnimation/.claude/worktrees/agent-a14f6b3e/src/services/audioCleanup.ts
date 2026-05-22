/**
 * Audio Cleanup Service — voice isolation and noise reduction
 * using ElevenLabs Audio Isolation API.
 */

import { getElevenLabsService } from './elevenlabs'
import { withCreditGate } from './creditGate'

/**
 * Isolate voice from background noise using ElevenLabs Audio Isolation.
 * Returns a cleaned audio Blob.
 */
export async function isolateVoice(audioBlob: Blob): Promise<Blob> {
  return withCreditGate('audio-isolation', async () => {
    const service = getElevenLabsService()

    const formData = new FormData()
    formData.append('audio', audioBlob, 'audio.mp3')

    const response = await service.callElevenLabs('audio-isolation', {
      method: 'POST',
      body: formData,
    })

    if (!response.ok) {
      const text = await response.text().catch(() => '')
      throw new Error(`Audio isolation failed: ${response.status} ${text}`)
    }

    return response.blob()
  })
}

/**
 * Enhance audio quality — applies voice isolation as the primary enhancement.
 * ElevenLabs' audio isolation effectively removes background noise,
 * reverb, and other artifacts.
 */
export async function enhanceAudio(audioBlob: Blob): Promise<Blob> {
  return isolateVoice(audioBlob)
}

/**
 * Local audio cleanup using Web Audio API (no external API needed).
 * Applies: high-pass filter (remove rumble), compressor (normalize levels),
 * and gain adjustment.
 */
export async function localAudioCleanup(
  audioBlob: Blob,
  options: {
    /** High-pass filter cutoff in Hz (default: 80) */
    highPassCutoff?: number
    /** Compressor threshold in dB (default: -24) */
    compressorThreshold?: number
    /** Compressor ratio (default: 4) */
    compressorRatio?: number
    /** Output gain in dB (default: 3) */
    outputGain?: number
  } = {}
): Promise<Blob> {
  const {
    highPassCutoff = 80,
    compressorThreshold = -24,
    compressorRatio = 4,
    outputGain = 3,
  } = options

  const ctx = new OfflineAudioContext(1, 1, 44100) // placeholder, will recreate
  const arrayBuffer = await audioBlob.arrayBuffer()
  const audioBuffer = await ctx.decodeAudioData(arrayBuffer)

  // Create offline context with correct duration and channel count
  const offlineCtx = new OfflineAudioContext(
    audioBuffer.numberOfChannels,
    audioBuffer.length,
    audioBuffer.sampleRate,
  )

  // Source
  const source = offlineCtx.createBufferSource()
  source.buffer = audioBuffer

  // High-pass filter — remove low frequency rumble
  const highPass = offlineCtx.createBiquadFilter()
  highPass.type = 'highpass'
  highPass.frequency.value = highPassCutoff
  highPass.Q.value = 0.7

  // Compressor — normalize dynamic range
  const compressor = offlineCtx.createDynamicsCompressor()
  compressor.threshold.value = compressorThreshold
  compressor.ratio.value = compressorRatio
  compressor.knee.value = 10
  compressor.attack.value = 0.003
  compressor.release.value = 0.25

  // Output gain
  const gain = offlineCtx.createGain()
  gain.gain.value = Math.pow(10, outputGain / 20)

  // Connect chain
  source.connect(highPass)
  highPass.connect(compressor)
  compressor.connect(gain)
  gain.connect(offlineCtx.destination)

  source.start(0)
  const renderedBuffer = await offlineCtx.startRendering()

  // Encode to WAV
  return audioBufferToWavBlob(renderedBuffer)
}

/** Encode an AudioBuffer as a WAV blob */
function audioBufferToWavBlob(buffer: AudioBuffer): Blob {
  const numChannels = buffer.numberOfChannels
  const sampleRate = buffer.sampleRate
  const numSamples = buffer.length
  const bytesPerSample = 2
  const dataSize = numSamples * numChannels * bytesPerSample
  const headerSize = 44
  const totalSize = headerSize + dataSize

  const arrayBuffer = new ArrayBuffer(totalSize)
  const view = new DataView(arrayBuffer)

  // WAV header
  writeString(view, 0, 'RIFF')
  view.setUint32(4, totalSize - 8, true)
  writeString(view, 8, 'WAVE')
  writeString(view, 12, 'fmt ')
  view.setUint32(16, 16, true) // PCM
  view.setUint16(20, 1, true) // PCM format
  view.setUint16(22, numChannels, true)
  view.setUint32(24, sampleRate, true)
  view.setUint32(28, sampleRate * numChannels * bytesPerSample, true)
  view.setUint16(32, numChannels * bytesPerSample, true)
  view.setUint16(34, bytesPerSample * 8, true)
  writeString(view, 36, 'data')
  view.setUint32(40, dataSize, true)

  // Interleave channels
  const channels = Array.from({ length: numChannels }, (_, i) => buffer.getChannelData(i))
  let offset = headerSize
  for (let i = 0; i < numSamples; i++) {
    for (let ch = 0; ch < numChannels; ch++) {
      const sample = Math.max(-1, Math.min(1, channels[ch][i]))
      view.setInt16(offset, sample < 0 ? sample * 0x8000 : sample * 0x7FFF, true)
      offset += bytesPerSample
    }
  }

  return new Blob([arrayBuffer], { type: 'audio/wav' })
}

function writeString(view: DataView, offset: number, str: string) {
  for (let i = 0; i < str.length; i++) {
    view.setUint8(offset + i, str.charCodeAt(i))
  }
}
