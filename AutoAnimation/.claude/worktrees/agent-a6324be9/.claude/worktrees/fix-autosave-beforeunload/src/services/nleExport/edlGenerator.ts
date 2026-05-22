/**
 * EDL (Edit Decision List) Generator — CMX 3600 format.
 *
 * Produces a simple cuts-only EDL from the primary video track.
 * Each edit maps to one clip on the timeline.
 */

import type { Track, Clip } from '@/types/timeline'
import { frameToSMPTE } from './timecodeUtils'

interface EDLOptions {
  title: string
  fps: number
  tracks: Track[]
}

/**
 * Generate a CMX 3600 EDL from the timeline data.
 * Only the first video/sprite track is exported (EDL is single-track).
 */
export function generateEDL(options: EDLOptions): string {
  const { title, fps, tracks } = options

  // Find the primary video track (first non-empty video or sprite track)
  const videoTrack = tracks.find(
    (t) => (t.type === 'video' || t.type === 'sprite') && t.clips.length > 0,
  )

  const lines: string[] = []
  lines.push(`TITLE: ${title}`)
  lines.push(`FCM: NON-DROP FRAME`)
  lines.push('')

  if (!videoTrack) {
    // Empty EDL — still valid
    return lines.join('\n')
  }

  // Sort clips by start frame
  const sortedClips = [...videoTrack.clips].sort((a, b) => a.startFrame - b.startFrame)

  for (let i = 0; i < sortedClips.length; i++) {
    const clip = sortedClips[i]
    const editNumber = String(i + 1).padStart(3, '0')
    const reelName = getReelName(clip, i)

    // Determine edit type
    const hasTransition = clip.transitionIn && clip.transitionIn.type !== 'cut'
    const editType = hasTransition ? 'D' : 'C'
    const transitionDuration = hasTransition
      ? String(Math.round((clip.transitionIn?.duration || 0) * fps)).padStart(3, '0')
      : '   '

    // Source timecodes (in/out on the source reel)
    const sourceIn = frameToSMPTE(clip.sourceInPoint, fps)
    const sourceOut = frameToSMPTE(clip.sourceOutPoint || (clip.endFrame - clip.startFrame), fps)

    // Record timecodes (in/out on the master timeline)
    const recordIn = frameToSMPTE(clip.startFrame, fps)
    const recordOut = frameToSMPTE(clip.endFrame, fps)

    // EDL line: EDIT# REEL TRACK EDIT_TYPE DURATION SRC_IN SRC_OUT REC_IN REC_OUT
    const editLine =
      `${editNumber}  ${reelName.padEnd(8)} V     ${editType}    ${transitionDuration} ` +
      `${sourceIn} ${sourceOut} ${recordIn} ${recordOut}`

    lines.push(editLine)

    // Optional clip name comment
    if (clip.name) {
      lines.push(`* FROM CLIP NAME: ${clip.name}`)
    }

    lines.push('')
  }

  return lines.join('\n')
}

function getReelName(clip: Clip, index: number): string {
  // Try to derive a short reel name from the clip sourceId or name
  if (clip.sourceId && clip.sourceId.length <= 8) {
    return clip.sourceId.toUpperCase()
  }
  if (clip.name && clip.name.length <= 8) {
    return clip.name.toUpperCase().replace(/\s+/g, '_')
  }
  // Fall back to sequential number
  return `REEL${String(index + 1).padStart(4, '0')}`
}
