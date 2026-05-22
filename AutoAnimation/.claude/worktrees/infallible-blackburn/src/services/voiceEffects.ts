/**
 * Voice Effects Service — Web Audio API post-processing for dialogue audio.
 *
 * Applies effects like reverb, echo, pitch shift, radio filter, etc.
 * Uses OfflineAudioContext for non-realtime rendering (export)
 * and live AudioContext for previewing.
 */

import type { VoiceEffectType, VoiceEffectParams, VoiceEffectPreset } from '@/types/voiceEffects'
import { logger } from '@/utils/logger'

// ── Effect Presets ──

export const EFFECT_PRESETS: VoiceEffectPreset[] = [
  {
    id: 'reverb',
    label: 'Reverb',
    description: 'Large room reverb',
    icon: 'Waves',
    params: { reverbMix: 0.4, reverbDecay: 2.5, gain: 1 },
  },
  {
    id: 'echo',
    label: 'Echo',
    description: 'Repeated echo effect',
    icon: 'Repeat',
    params: { echoDelay: 0.3, echoFeedback: 0.4, gain: 0.9 },
  },
  {
    id: 'pitch-up',
    label: 'Pitch Up',
    description: 'Higher pitch (+4 semitones)',
    icon: 'ArrowUp',
    params: { pitchShift: 4, gain: 1 },
  },
  {
    id: 'pitch-down',
    label: 'Pitch Down',
    description: 'Lower pitch (-4 semitones)',
    icon: 'ArrowDown',
    params: { pitchShift: -4, gain: 1 },
  },
  {
    id: 'radio',
    label: 'Radio',
    description: 'AM radio filter',
    icon: 'Radio',
    params: { highPassCutoff: 300, lowPassCutoff: 3000, distortion: 0.1, gain: 1.2 },
  },
  {
    id: 'megaphone',
    label: 'Megaphone',
    description: 'Loud megaphone effect',
    icon: 'Megaphone',
    params: { highPassCutoff: 500, lowPassCutoff: 4000, distortion: 0.3, gain: 1.5 },
  },
  {
    id: 'whisper',
    label: 'Whisper',
    description: 'Soft whisper tone',
    icon: 'Wind',
    params: { highPassCutoff: 1000, lowPassCutoff: 6000, gain: 0.4, reverbMix: 0.15, reverbDecay: 0.8 },
  },
  {
    id: 'deep',
    label: 'Deep',
    description: 'Deep bass voice',
    icon: 'Volume2',
    params: { pitchShift: -6, lowPassCutoff: 3000, gain: 1.1 },
  },
  {
    id: 'robot',
    label: 'Robot',
    description: 'Robotic voice',
    icon: 'Bot',
    params: { distortion: 0.4, highPassCutoff: 200, lowPassCutoff: 4000, reverbMix: 0.1, reverbDecay: 0.3, gain: 1.1 },
  },
  {
    id: 'chipmunk',
    label: 'Chipmunk',
    description: 'High-pitched chipmunk',
    icon: 'Squirrel',
    params: { pitchShift: 8, gain: 0.9 },
  },
  {
    id: 'cave',
    label: 'Cave',
    description: 'Deep cave reverb',
    icon: 'Mountain',
    params: { reverbMix: 0.7, reverbDecay: 4, lowPassCutoff: 5000, gain: 0.8 },
  },
  {
    id: 'telephone',
    label: 'Telephone',
    description: 'Phone call filter',
    icon: 'Phone',
    params: { highPassCutoff: 400, lowPassCutoff: 3400, gain: 1.3 },
  },
]

/**
 * Get preset params for a given effect type.
 */
export function getEffectParams(effect: VoiceEffectType): VoiceEffectParams {
  return EFFECT_PRESETS.find((p) => p.id === effect)?.params ?? {}
}

/**
 * Generate a synthetic impulse response for convolution reverb.
 */
function generateImpulseResponse(
  sampleRate: number,
  duration: number,
  decay: number,
): AudioBuffer {
  const length = Math.floor(sampleRate * duration)
  const buffer = new AudioBuffer({ length, numberOfChannels: 2, sampleRate })

  for (let ch = 0; ch < 2; ch++) {
    const data = buffer.getChannelData(ch)
    for (let i = 0; i < length; i++) {
      // Exponential decay with random noise
      data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / length, decay)
    }
  }

  return buffer
}

/**
 * Create a waveshaper distortion curve.
 */
function makeDistortionCurve(amount: number): Float32Array {
  const samples = 44100
  const curve = new Float32Array(samples)
  const deg = Math.PI / 180
  const k = amount * 400

  for (let i = 0; i < samples; i++) {
    const x = (i * 2) / samples - 1
    curve[i] = ((3 + k) * x * 20 * deg) / (Math.PI + k * Math.abs(x))
  }

  return curve
}

/**
 * Apply a voice effect to an audio blob using OfflineAudioContext.
 * Returns a new processed audio blob.
 */
export async function applyVoiceEffect(
  audioBlob: Blob,
  effect: VoiceEffectType,
  customParams?: Partial<VoiceEffectParams>,
): Promise<Blob> {
  const params = { ...getEffectParams(effect), ...customParams }

  // Decode the source audio
  const arrayBuffer = await audioBlob.arrayBuffer()
  const tempCtx = new AudioContext()
  const sourceBuffer = await tempCtx.decodeAudioData(arrayBuffer)
  await tempCtx.close()

  const sampleRate = sourceBuffer.sampleRate
  const numberOfChannels = sourceBuffer.numberOfChannels

  // Handle pitch shift by changing playback rate (changes duration)
  const pitchRate = params.pitchShift
    ? Math.pow(2, params.pitchShift / 12)
    : 1

  // Compute output duration (pitch shift changes duration)
  const outputDuration = sourceBuffer.duration / pitchRate
  const outputLength = Math.ceil(outputDuration * sampleRate)

  // Create offline context for rendering
  const offline = new OfflineAudioContext(
    numberOfChannels,
    outputLength,
    sampleRate,
  )

  // Source node
  const source = offline.createBufferSource()
  source.buffer = sourceBuffer
  source.playbackRate.value = pitchRate

  // Build processing chain: source → filters → gain → destination
  let currentNode: AudioNode = source

  // High-pass filter
  if (params.highPassCutoff) {
    const highPass = offline.createBiquadFilter()
    highPass.type = 'highpass'
    highPass.frequency.value = params.highPassCutoff
    currentNode.connect(highPass)
    currentNode = highPass
  }

  // Low-pass filter
  if (params.lowPassCutoff) {
    const lowPass = offline.createBiquadFilter()
    lowPass.type = 'lowpass'
    lowPass.frequency.value = params.lowPassCutoff
    currentNode.connect(lowPass)
    currentNode = lowPass
  }

  // Distortion
  if (params.distortion && params.distortion > 0) {
    const distortion = offline.createWaveShaper()
    distortion.curve = makeDistortionCurve(params.distortion)
    distortion.oversample = '4x'
    currentNode.connect(distortion)
    currentNode = distortion
  }

  // Echo (delay with feedback)
  if (params.echoDelay && params.echoDelay > 0) {
    const delay = offline.createDelay(2)
    delay.delayTime.value = params.echoDelay
    const feedback = offline.createGain()
    feedback.gain.value = params.echoFeedback ?? 0.3

    // Parallel: dry signal continues, wet signal goes through delay→feedback loop
    const dryGain = offline.createGain()
    dryGain.gain.value = 1
    const wetGain = offline.createGain()
    wetGain.gain.value = 0.5

    const merger = offline.createGain()
    merger.gain.value = 1

    currentNode.connect(dryGain)
    dryGain.connect(merger)

    currentNode.connect(delay)
    delay.connect(feedback)
    feedback.connect(delay)
    delay.connect(wetGain)
    wetGain.connect(merger)

    currentNode = merger
  }

  // Reverb (convolution)
  if (params.reverbMix && params.reverbMix > 0) {
    const reverbDuration = params.reverbDecay ?? 2
    const impulse = generateImpulseResponse(sampleRate, reverbDuration, 2)

    const convolver = offline.createConvolver()
    convolver.buffer = impulse

    const dryGain = offline.createGain()
    dryGain.gain.value = 1 - params.reverbMix
    const wetGain = offline.createGain()
    wetGain.gain.value = params.reverbMix

    const merger = offline.createGain()
    merger.gain.value = 1

    currentNode.connect(dryGain)
    dryGain.connect(merger)

    currentNode.connect(convolver)
    convolver.connect(wetGain)
    wetGain.connect(merger)

    currentNode = merger
  }

  // Output gain
  const gainNode = offline.createGain()
  gainNode.gain.value = params.gain ?? 1
  currentNode.connect(gainNode)
  gainNode.connect(offline.destination)

  // Render
  source.start(0)
  const renderedBuffer = await offline.startRendering()

  // Encode to WAV
  const wavBlob = audioBufferToWav(renderedBuffer)
  logger.log(`[VoiceEffects] Applied "${effect}" effect (${(wavBlob.size / 1024).toFixed(0)}KB)`)
  return wavBlob
}

/**
 * Preview an effect in real-time using a live AudioContext.
 * Returns the AudioContext (call .close() to stop preview).
 */
export async function previewEffect(
  audioUrl: string,
  effect: VoiceEffectType,
): Promise<AudioContext> {
  const params = getEffectParams(effect)
  const ctx = new AudioContext()

  const response = await fetch(audioUrl)
  const arrayBuffer = await response.arrayBuffer()
  const buffer = await ctx.decodeAudioData(arrayBuffer)

  const source = ctx.createBufferSource()
  source.buffer = buffer

  const pitchRate = params.pitchShift ? Math.pow(2, params.pitchShift / 12) : 1
  source.playbackRate.value = pitchRate

  let currentNode: AudioNode = source

  if (params.highPassCutoff) {
    const hp = ctx.createBiquadFilter()
    hp.type = 'highpass'
    hp.frequency.value = params.highPassCutoff
    currentNode.connect(hp)
    currentNode = hp
  }

  if (params.lowPassCutoff) {
    const lp = ctx.createBiquadFilter()
    lp.type = 'lowpass'
    lp.frequency.value = params.lowPassCutoff
    currentNode.connect(lp)
    currentNode = lp
  }

  if (params.distortion && params.distortion > 0) {
    const ws = ctx.createWaveShaper()
    ws.curve = makeDistortionCurve(params.distortion)
    ws.oversample = '4x'
    currentNode.connect(ws)
    currentNode = ws
  }

  const gainNode = ctx.createGain()
  gainNode.gain.value = params.gain ?? 1
  currentNode.connect(gainNode)
  gainNode.connect(ctx.destination)

  source.start(0)

  // Auto-close when playback ends
  source.onended = () => ctx.close().catch(() => {})

  return ctx
}

/**
 * Encode an AudioBuffer to WAV format.
 */
function audioBufferToWav(buffer: AudioBuffer): Blob {
  const numChannels = buffer.numberOfChannels
  const sampleRate = buffer.sampleRate
  const length = buffer.length
  const bytesPerSample = 2 // 16-bit
  const blockAlign = numChannels * bytesPerSample
  const dataSize = length * blockAlign
  const headerSize = 44
  const totalSize = headerSize + dataSize

  const arrayBuffer = new ArrayBuffer(totalSize)
  const view = new DataView(arrayBuffer)

  // WAV header
  const writeString = (offset: number, str: string) => {
    for (let i = 0; i < str.length; i++) {
      view.setUint8(offset + i, str.charCodeAt(i))
    }
  }

  writeString(0, 'RIFF')
  view.setUint32(4, totalSize - 8, true)
  writeString(8, 'WAVE')
  writeString(12, 'fmt ')
  view.setUint32(16, 16, true) // subchunk size
  view.setUint16(20, 1, true) // PCM
  view.setUint16(22, numChannels, true)
  view.setUint32(24, sampleRate, true)
  view.setUint32(28, sampleRate * blockAlign, true)
  view.setUint16(32, blockAlign, true)
  view.setUint16(34, 16, true) // bits per sample
  writeString(36, 'data')
  view.setUint32(40, dataSize, true)

  // Interleave channel data
  const channels: Float32Array[] = []
  for (let ch = 0; ch < numChannels; ch++) {
    channels.push(buffer.getChannelData(ch))
  }

  let offset = 44
  for (let i = 0; i < length; i++) {
    for (let ch = 0; ch < numChannels; ch++) {
      const sample = Math.max(-1, Math.min(1, channels[ch][i]))
      view.setInt16(offset, sample < 0 ? sample * 0x8000 : sample * 0x7FFF, true)
      offset += 2
    }
  }

  return new Blob([arrayBuffer], { type: 'audio/wav' })
}
