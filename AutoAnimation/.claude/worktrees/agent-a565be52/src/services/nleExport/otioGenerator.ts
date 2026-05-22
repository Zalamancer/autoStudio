/**
 * OpenTimelineIO (OTIO) Generator — produces OTIO JSON for timeline interchange.
 *
 * OTIO is a JSON-based format developed by Pixar, supported by DaVinci Resolve 18+,
 * Adobe Premiere (via plugins), and other professional NLEs.
 */

import type { Track, ClipTransition } from '@/types/timeline'

interface OTIOOptions {
  name: string
  fps: number
  totalFrames: number
  tracks: Track[]
  mediaAssets: Array<{ id: string; url: string; name: string }>
  useRelativePaths: boolean
}

interface RationalTime {
  OTIO_SCHEMA: 'RationalTime.1'
  value: number
  rate: number
}

interface TimeRange {
  OTIO_SCHEMA: 'TimeRange.1'
  start_time: RationalTime
  duration: RationalTime
}

/**
 * Generate an OpenTimelineIO JSON document from timeline data.
 */
export function generateOTIO(options: OTIOOptions): string {
  const { name, fps, totalFrames, tracks, mediaAssets, useRelativePaths } = options

  // Build media reference lookup
  const assetMap = new Map(mediaAssets.map((a) => [a.id, a]))

  const otioTracks: unknown[] = []

  for (const track of tracks) {
    if (track.clips.length === 0) continue

    const kind = track.type === 'audio' ? 'Audio' : 'Video'
    const children: unknown[] = []

    const sortedClips = [...track.clips].sort((a, b) => a.startFrame - b.startFrame)

    // Add gaps between clips
    let lastEnd = 0
    for (const clip of sortedClips) {
      // Insert a gap if there is space between clips
      if (clip.startFrame > lastEnd) {
        const gapDuration = clip.startFrame - lastEnd
        children.push({
          OTIO_SCHEMA: 'Gap.1',
          name: '',
          source_range: makeTimeRange(0, gapDuration, fps),
        })
      }

      // Add transition if present
      if (clip.transitionIn && clip.transitionIn.type !== 'cut') {
        children.push(makeTransition(clip.transitionIn, fps))
      }

      // Add the clip
      const asset = assetMap.get(clip.sourceId)
      const mediaRef = asset
        ? {
            OTIO_SCHEMA: 'ExternalReference.1',
            target_url: useRelativePaths ? `media/${asset.name}` : asset.url,
            available_range: makeTimeRange(0, clip.sourceOutPoint - clip.sourceInPoint, fps),
          }
        : {
            OTIO_SCHEMA: 'MissingReference.1',
          }

      children.push({
        OTIO_SCHEMA: 'Clip.1',
        name: clip.name || `Clip_${clip.id.slice(0, 8)}`,
        source_range: makeTimeRange(clip.sourceInPoint, clip.endFrame - clip.startFrame, fps),
        media_reference: mediaRef,
      })

      lastEnd = clip.endFrame
    }

    // Trailing gap if needed
    if (lastEnd < totalFrames) {
      children.push({
        OTIO_SCHEMA: 'Gap.1',
        name: '',
        source_range: makeTimeRange(0, totalFrames - lastEnd, fps),
      })
    }

    otioTracks.push({
      OTIO_SCHEMA: 'Track.1',
      name: track.name || `${kind} ${track.id}`,
      kind,
      children,
    })
  }

  const timeline = {
    OTIO_SCHEMA: 'Timeline.1',
    name,
    global_start_time: makeRationalTime(0, fps),
    tracks: {
      OTIO_SCHEMA: 'Stack.1',
      name: 'tracks',
      children: otioTracks,
    },
  }

  return JSON.stringify(timeline, null, 2)
}

function makeRationalTime(frames: number, fps: number): RationalTime {
  return {
    OTIO_SCHEMA: 'RationalTime.1',
    value: frames,
    rate: fps,
  }
}

function makeTimeRange(startFrames: number, durationFrames: number, fps: number): TimeRange {
  return {
    OTIO_SCHEMA: 'TimeRange.1',
    start_time: makeRationalTime(startFrames, fps),
    duration: makeRationalTime(durationFrames, fps),
  }
}

function makeTransition(transition: ClipTransition, fps: number): unknown {
  const durationFrames = Math.round(transition.duration * fps)
  return {
    OTIO_SCHEMA: 'Transition.1',
    name: transition.type || 'dissolve',
    transition_type: 'SMPTE_Dissolve',
    in_offset: makeRationalTime(Math.floor(durationFrames / 2), fps),
    out_offset: makeRationalTime(Math.ceil(durationFrames / 2), fps),
  }
}
