/**
 * Damped spring physics function.
 * Replaces Remotion's `spring()`.
 *
 * Uses 4th-order Runge-Kutta ODE integration stepping at 1/fps intervals.
 * Spring ODE: x'' = -stiffness/mass * (x - 1) - damping/mass * x'
 * Start from x=0, v=0; maps result via from + (to - from) * x.
 */

export interface SpringConfig {
  damping?: number          // default 10
  mass?: number             // default 1
  stiffness?: number        // default 100
  overshootClamping?: boolean  // default false
}

// Cache keyed by config signature → array of solved x values per frame
const cache = new Map<string, number[]>()

function configKey(cfg: Required<SpringConfig>, fps: number): string {
  return `${cfg.damping}:${cfg.mass}:${cfg.stiffness}:${cfg.overshootClamping}:${fps}`
}

function resolveConfig(cfg?: SpringConfig): Required<SpringConfig> {
  return {
    damping: cfg?.damping ?? 10,
    mass: cfg?.mass ?? 1,
    stiffness: cfg?.stiffness ?? 100,
    overshootClamping: cfg?.overshootClamping ?? false,
  }
}

/**
 * Solve the spring ODE up to `targetFrame` using RK4,
 * caching intermediate frame results.
 */
function solve(
  resolved: Required<SpringConfig>,
  fps: number,
  targetFrame: number,
): number {
  const key = configKey(resolved, fps)
  let values = cache.get(key)
  if (!values) {
    values = [0] // frame 0 → x = 0
    cache.set(key, values)
  }

  if (targetFrame < values.length) {
    return values[targetFrame]
  }

  const { stiffness: k, damping: c, mass: m, overshootClamping } = resolved
  const dt = 1 / fps

  // Resume from where we left off
  let x = values[values.length - 1]
  // Approximate velocity from last two frames (or 0 if only one frame)
  let v =
    values.length >= 2
      ? (values[values.length - 1] - values[values.length - 2]) * fps
      : 0

  // ODE derivatives: dx/dt = v, dv/dt = -k/m * (x - 1) - c/m * v
  const accel = (pos: number, vel: number) =>
    (-k / m) * (pos - 1) - (c / m) * vel

  for (let f = values.length; f <= targetFrame; f++) {
    // RK4 integration
    const k1v = accel(x, v)
    const k1x = v

    const k2v = accel(x + k1x * dt * 0.5, v + k1v * dt * 0.5)
    const k2x = v + k1v * dt * 0.5

    const k3v = accel(x + k2x * dt * 0.5, v + k2v * dt * 0.5)
    const k3x = v + k2v * dt * 0.5

    const k4v = accel(x + k3x * dt, v + k3v * dt)
    const k4x = v + k3v * dt

    x += (dt / 6) * (k1x + 2 * k2x + 2 * k3x + k4x)
    v += (dt / 6) * (k1v + 2 * k2v + 2 * k3v + k4v)

    if (overshootClamping && x > 1) {
      x = 1
      v = 0
    }

    values.push(x)
  }

  return values[targetFrame]
}

/**
 * Attempt to match the Remotion-style spring API.
 * spring({ frame, fps, config?, from?, to? }) -> number
 */
export function spring(opts: {
  frame: number
  fps: number
  config?: SpringConfig
  from?: number
  to?: number
  durationInFrames?: number
}): number {
  const { frame, fps, config, from = 0, to = 1, durationInFrames } = opts
  const resolved = resolveConfig(config)

  const clampedFrame =
    durationInFrames !== undefined
      ? Math.min(Math.max(frame, 0), durationInFrames - 1)
      : Math.max(frame, 0)

  const x = solve(resolved, fps, Math.round(clampedFrame))
  return from + (to - from) * x
}

/**
 * Measure how many frames it takes for the spring to settle within
 * `threshold` of the target value (1.0).
 */
export function measureSpring(
  config?: SpringConfig,
  options?: { fps?: number; threshold?: number },
): number {
  const fps = options?.fps ?? 30
  const threshold = options?.threshold ?? 0.001
  const resolved = resolveConfig(config)
  const maxFrames = fps * 60 // safety cap: 60 seconds

  for (let f = 0; f < maxFrames; f++) {
    const x = solve(resolved, fps, f)
    if (Math.abs(x - 1) < threshold) {
      // Verify it stays settled for a few more frames
      let settled = true
      for (let check = 1; check <= 3 && f + check < maxFrames; check++) {
        if (Math.abs(solve(resolved, fps, f + check) - 1) >= threshold) {
          settled = false
          break
        }
      }
      if (settled) return f
    }
  }

  return maxFrames
}
