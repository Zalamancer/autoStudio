/**
 * Spatial audio processing using Web Audio API.
 */

export async function applyStereoPosition(
  buffer: AudioBuffer,
  pan: number,
): Promise<AudioBuffer> {
  const ctx = new OfflineAudioContext(2, buffer.length, buffer.sampleRate)
  const source = ctx.createBufferSource()
  source.buffer = buffer
  const panner = ctx.createStereoPanner()
  panner.pan.value = Math.max(-1, Math.min(1, pan))
  source.connect(panner)
  panner.connect(ctx.destination)
  source.start(0)
  return ctx.startRendering()
}

export async function applyRoomReverb(
  buffer: AudioBuffer,
  roomSize: number,
  mix: number,
): Promise<AudioBuffer> {
  const ctx = new OfflineAudioContext(buffer.numberOfChannels, buffer.length, buffer.sampleRate)
  const source = ctx.createBufferSource()
  source.buffer = buffer

  // Create impulse response for convolution reverb
  const irLength = Math.floor(buffer.sampleRate * roomSize * 2)
  const impulse = ctx.createBuffer(2, irLength, buffer.sampleRate)
  for (let ch = 0; ch < 2; ch++) {
    const data = impulse.getChannelData(ch)
    for (let i = 0; i < irLength; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (irLength * 0.3))
    }
  }

  const convolver = ctx.createConvolver()
  convolver.buffer = impulse

  const dryGain = ctx.createGain()
  dryGain.gain.value = 1 - mix
  const wetGain = ctx.createGain()
  wetGain.gain.value = mix

  source.connect(dryGain)
  source.connect(convolver)
  convolver.connect(wetGain)
  dryGain.connect(ctx.destination)
  wetGain.connect(ctx.destination)
  source.start(0)
  return ctx.startRendering()
}

export async function applyDistanceAttenuation(
  buffer: AudioBuffer,
  distance: number,
): Promise<AudioBuffer> {
  const ctx = new OfflineAudioContext(buffer.numberOfChannels, buffer.length, buffer.sampleRate)
  const source = ctx.createBufferSource()
  source.buffer = buffer
  const gain = ctx.createGain()
  // Inverse distance attenuation
  gain.gain.value = 1 / Math.max(1, distance)
  source.connect(gain)
  gain.connect(ctx.destination)
  source.start(0)
  return ctx.startRendering()
}

export function create3DPositioner(
  ctx: AudioContext,
  position: { x: number; y: number; z: number },
): PannerNode {
  const panner = ctx.createPanner()
  panner.panningModel = 'HRTF'
  panner.distanceModel = 'inverse'
  panner.refDistance = 1
  panner.maxDistance = 100
  panner.rolloffFactor = 1
  panner.positionX.value = position.x
  panner.positionY.value = position.y
  panner.positionZ.value = position.z
  return panner
}
