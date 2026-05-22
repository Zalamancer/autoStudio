/**
 * NLE Timecode Utilities — frame/time conversion for NLE interchange formats.
 */

/**
 * Convert a frame number to SMPTE timecode (HH:MM:SS:FF).
 */
export function frameToSMPTE(frame: number, fps: number): string {
  const totalSeconds = Math.floor(frame / fps)
  const ff = frame % fps
  const ss = totalSeconds % 60
  const mm = Math.floor(totalSeconds / 60) % 60
  const hh = Math.floor(totalSeconds / 3600)

  return (
    String(hh).padStart(2, '0') + ':' +
    String(mm).padStart(2, '0') + ':' +
    String(ss).padStart(2, '0') + ':' +
    String(ff).padStart(2, '0')
  )
}

/**
 * Convert a frame number to seconds.
 */
export function frameToSeconds(frame: number, fps: number): number {
  return frame / fps
}

/**
 * Map our FPS to NLE timebase values.
 * NLE timebases are always integers representing frames per second.
 */
export function fpsToTimebase(fps: number): number {
  // Common NLE timebases — map to nearest standard
  const standardTimebases = [24, 25, 30, 48, 50, 60, 120]
  const closest = standardTimebases.reduce((prev, curr) =>
    Math.abs(curr - fps) < Math.abs(prev - fps) ? curr : prev
  )
  // If our FPS is already an integer, use it directly
  if (Number.isInteger(fps)) return fps
  return closest
}
