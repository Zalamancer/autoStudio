/**
 * Audio Mixer — per-track volume, auto-ducking, and multi-track mixing
 * using Web Audio API OfflineAudioContext.
 */

// ── Types ────────────────────────────────────────────────────────────

export type AudioTrackType = 'dialogue' | 'music' | 'sfx'

export interface AudioTrackSource {
  url: string
  /** Start time in seconds within the composition */
  startTimeSec: number
  /** Track type for auto-ducking decisions */
  type: AudioTrackType
  /** Per-track volume 0-1 (default 1) */
  volume?: number
  /** Mute this track (default false) */
  muted?: boolean
  /** Stereo pan position: -1 (full left) to 1 (full right), 0 = center */
  panPosition?: number
}

export interface MixerOptions {
  /** Target sample rate (default 48000) */
  sampleRate?: number
  /** Enable auto-ducking of music under dialogue (default true) */
  autoDuck?: boolean
  /** Ducking reduction in dB when dialogue is present (default -12) */
  duckAmountDb?: number
  /** Ducking fade-in time in seconds (default 0.3) */
  duckAttackSec?: number
  /** Ducking fade-out time in seconds after dialogue ends (default 0.5) */
  duckReleaseSec?: number
}

// ── Auto-ducking helpers ─────────────────────────────────────────────

interface DialogueRegion {
  startSec: number
  endSec: number
}

/**
 * Extract dialogue time regions from the track list.
 * Merges overlapping regions into contiguous blocks.
 */
function extractDialogueRegions(
  tracks: Array<{ startTimeSec: number; durationSec: number; type: AudioTrackType }>,
): DialogueRegion[] {
  const raw = tracks
    .filter((t) => t.type === 'dialogue')
    .map((t) => ({ startSec: t.startTimeSec, endSec: t.startTimeSec + t.durationSec }))
    .sort((a, b) => a.startSec - b.startSec)

  if (raw.length === 0) return []

  // Merge overlapping regions
  const merged: DialogueRegion[] = [raw[0]]
  for (let i = 1; i < raw.length; i++) {
    const last = merged[merged.length - 1]
    if (raw[i].startSec <= last.endSec) {
      last.endSec = Math.max(last.endSec, raw[i].endSec)
    } else {
      merged.push(raw[i])
    }
  }
  return merged
}

/**
 * Schedule gain automation on a GainNode to duck during dialogue regions.
 */
function scheduleDucking(
  gainNode: GainNode,
  regions: DialogueRegion[],
  totalDurationSec: number,
  duckAmountDb: number,
  attackSec: number,
  releaseSec: number,
): void {
  const duckGain = Math.pow(10, duckAmountDb / 20) // e.g. -12 dB → ~0.25

  // Start at full volume
  gainNode.gain.setValueAtTime(1, 0)

  for (const region of regions) {
    const fadeDownStart = Math.max(0, region.startSec - attackSec)
    const fadeUpEnd = Math.min(totalDurationSec, region.endSec + releaseSec)

    // Ramp down before dialogue starts
    gainNode.gain.setValueAtTime(1, fadeDownStart)
    gainNode.gain.linearRampToValueAtTime(duckGain, region.startSec)

    // Hold ducked level during dialogue
    gainNode.gain.setValueAtTime(duckGain, region.endSec)

    // Ramp back up after dialogue ends
    gainNode.gain.linearRampToValueAtTime(1, fadeUpEnd)
  }
}

// ── Main mixer ───────────────────────────────────────────────────────

/**
 * Mix multiple audio tracks into a single AudioBuffer with per-track
 * volume, mute, and auto-ducking of music under dialogue.
 */
export async function mixTracks(
  tracks: AudioTrackSource[],
  totalDurationSec: number,
  options: MixerOptions = {},
): Promise<AudioBuffer | null> {
  const {
    sampleRate = 48000,
    autoDuck = true,
    duckAmountDb = -12,
    duckAttackSec = 0.3,
    duckReleaseSec = 0.5,
  } = options

  // Filter out muted tracks
  const activeTracks = tracks.filter((t) => !t.muted)
  if (activeTracks.length === 0) return null

  const totalSamples = Math.ceil(totalDurationSec * sampleRate)
  const offlineCtx = new OfflineAudioContext(2, totalSamples, sampleRate)

  // Fetch and decode all audio files in parallel
  const decoded = await Promise.all(
    activeTracks.map(async (track) => {
      try {
        const resp = await fetch(track.url)
        const arrayBuffer = await resp.arrayBuffer()
        const audioBuffer = await offlineCtx.decodeAudioData(arrayBuffer)
        return {
          buffer: audioBuffer,
          track,
          durationSec: audioBuffer.duration,
        }
      } catch (err) {
        console.warn('[audioMixer] Failed to decode audio:', track.url, err)
        return null
      }
    }),
  )

  const validTracks = decoded.filter(Boolean) as Array<{
    buffer: AudioBuffer
    track: AudioTrackSource
    durationSec: number
  }>

  if (validTracks.length === 0) return null

  // Build dialogue regions for ducking
  const dialogueRegions = autoDuck
    ? extractDialogueRegions(
        validTracks.map((d) => ({
          startTimeSec: d.track.startTimeSec,
          durationSec: d.durationSec,
          type: d.track.type,
        })),
      )
    : []

  const hasDialogue = dialogueRegions.length > 0

  // Schedule each track
  for (const { buffer, track } of validTracks) {
    const source = offlineCtx.createBufferSource()
    source.buffer = buffer

    // Per-track volume gain
    const volumeGain = offlineCtx.createGain()
    volumeGain.gain.value = track.volume ?? 1

    // Auto-ducking gain (only for music/sfx when dialogue is present)
    const duckGain = offlineCtx.createGain()
    if (hasDialogue && autoDuck && track.type !== 'dialogue') {
      scheduleDucking(
        duckGain,
        dialogueRegions,
        totalDurationSec,
        duckAmountDb,
        duckAttackSec,
        duckReleaseSec,
      )
    }

    // Connect chain: source → volume → duck → destination
    source.connect(volumeGain)
    volumeGain.connect(duckGain)
    duckGain.connect(offlineCtx.destination)

    source.start(track.startTimeSec)
  }

  return offlineCtx.startRendering()
}
