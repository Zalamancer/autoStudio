/**
 * Loop and ping-pong frame utilities for repeating animations.
 */

/**
 * Loop a frame within a range.
 * Maps any frame number into [0, durationInFrames) using modular arithmetic.
 *
 * @param frame - Current frame (can exceed durationInFrames)
 * @param durationInFrames - Length of one loop cycle in frames
 * @returns Frame number wrapped to [0, durationInFrames)
 */
export function loop(frame: number, durationInFrames: number): number {
  if (durationInFrames <= 0) return 0
  const f = frame % durationInFrames
  return f < 0 ? f + durationInFrames : f
}

/**
 * Ping-pong (forward then reverse) a frame within a range.
 * Frame plays forward for durationInFrames, then reverses.
 * Full cycle is 2 * durationInFrames frames.
 *
 * @param frame - Current frame (can exceed cycle length)
 * @param durationInFrames - Length of one direction in frames
 * @returns Frame number within [0, durationInFrames)
 */
export function pingPong(frame: number, durationInFrames: number): number {
  if (durationInFrames <= 0) return 0
  const cycleLength = durationInFrames * 2
  const pos = loop(frame, cycleLength)
  return pos < durationInFrames ? pos : cycleLength - pos - 1
}
