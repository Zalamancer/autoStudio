/**
 * Professional easing library for animation.
 *
 * Covers every major easing family used in motion design:
 * - Standard (quad, cubic, quart, quint, sine, expo, circ)
 * - Elastic (configurable amplitude/period)
 * - Bounce (configurable bounces)
 * - Back (configurable overshoot)
 * - Custom cubic bezier
 * - Steps (frame-by-frame / hold)
 * - Spring approximations
 * - Named bezier presets from popular design systems
 *
 * All functions: (t: number) => number where t in [0, 1]
 */

// ── Cubic Bezier Solver ──────────────────────────────────────────────

/**
 * Build a cubic bezier easing function from control points.
 * Uses Newton-Raphson with bisection fallback for robust solving.
 */
function cubicBezier(
  x1: number,
  y1: number,
  x2: number,
  y2: number,
): (t: number) => number {
  const cx = 3 * x1
  const bx = 3 * (x2 - x1) - cx
  const ax = 1 - cx - bx

  const cy = 3 * y1
  const by = 3 * (y2 - y1) - cy
  const ay = 1 - cy - by

  const sampleCurveX = (t: number) => ((ax * t + bx) * t + cx) * t
  const sampleCurveY = (t: number) => ((ay * t + by) * t + cy) * t
  const sampleCurveDerivativeX = (t: number) => (3 * ax * t + 2 * bx) * t + cx

  function solveCurveX(x: number): number {
    let t = x
    for (let i = 0; i < 8; i++) {
      const currentX = sampleCurveX(t) - x
      const derivative = sampleCurveDerivativeX(t)
      if (Math.abs(currentX) < 1e-7) return t
      if (Math.abs(derivative) < 1e-7) break
      t -= currentX / derivative
    }

    let lo = 0
    let hi = 1
    t = x
    for (let i = 0; i < 20; i++) {
      const currentX = sampleCurveX(t)
      if (Math.abs(currentX - x) < 1e-7) return t
      if (x > currentX) lo = t
      else hi = t
      t = (lo + hi) / 2
    }
    return t
  }

  return (x: number) => {
    if (x <= 0) return 0
    if (x >= 1) return 1
    return sampleCurveY(solveCurveX(x))
  }
}

// ── Constants ─────────────────────────────────────────────────────────

const c1 = 1.70158
const c2 = c1 * 1.525
const c3 = c1 + 1
const PI = Math.PI
const TAU = 2 * PI
const HALF_PI = PI / 2

// ── Bounce ────────────────────────────────────────────────────────────

function bounceOutImpl(t: number): number {
  const n1 = 7.5625
  const d1 = 2.75
  if (t < 1 / d1) return n1 * t * t
  if (t < 2 / d1) return n1 * (t -= 1.5 / d1) * t + 0.75
  if (t < 2.5 / d1) return n1 * (t -= 2.25 / d1) * t + 0.9375
  return n1 * (t -= 2.625 / d1) * t + 0.984375
}

// ── Steps ─────────────────────────────────────────────────────────────

/**
 * Steps easing — quantizes t into discrete steps.
 * Matches CSS steps() function.
 */
function steps(count: number, position: 'start' | 'end' = 'end'): (t: number) => number {
  return (t: number) => {
    if (t <= 0) return 0
    if (t >= 1) return 1
    return position === 'start'
      ? Math.ceil(t * count) / count
      : Math.floor(t * count) / count
  }
}

// ── Main export ───────────────────────────────────────────────────────

export const Easing = {
  // ─── Linear ───────────────────────────────────────────────────
  linear: (t: number) => t,

  // ─── Quadratic ────────────────────────────────────────────────
  in: (t: number) => t * t,
  out: (t: number) => 1 - (1 - t) * (1 - t),
  inOut: (t: number) =>
    t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2,

  // ─── Cubic ────────────────────────────────────────────────────
  cubicIn: (t: number) => t * t * t,
  cubicOut: (t: number) => 1 - Math.pow(1 - t, 3),
  cubicInOut: (t: number) =>
    t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2,

  // ─── Quartic ──────────────────────────────────────────────────
  quartIn: (t: number) => t * t * t * t,
  quartOut: (t: number) => 1 - Math.pow(1 - t, 4),
  quartInOut: (t: number) =>
    t < 0.5 ? 8 * t * t * t * t : 1 - Math.pow(-2 * t + 2, 4) / 2,

  // ─── Quintic ──────────────────────────────────────────────────
  quintIn: (t: number) => t * t * t * t * t,
  quintOut: (t: number) => 1 - Math.pow(1 - t, 5),
  quintInOut: (t: number) =>
    t < 0.5 ? 16 * t * t * t * t * t : 1 - Math.pow(-2 * t + 2, 5) / 2,

  // ─── Sinusoidal ───────────────────────────────────────────────
  sineIn: (t: number) => 1 - Math.cos(t * HALF_PI),
  sineOut: (t: number) => Math.sin(t * HALF_PI),
  sineInOut: (t: number) => -(Math.cos(PI * t) - 1) / 2,

  // ─── Exponential ──────────────────────────────────────────────
  expoIn: (t: number) => (t === 0 ? 0 : Math.pow(2, 10 * t - 10)),
  expoOut: (t: number) => (t === 1 ? 1 : 1 - Math.pow(2, -10 * t)),
  expoInOut: (t: number) =>
    t === 0
      ? 0
      : t === 1
        ? 1
        : t < 0.5
          ? Math.pow(2, 20 * t - 10) / 2
          : (2 - Math.pow(2, -20 * t + 10)) / 2,

  // ─── Circular ─────────────────────────────────────────────────
  circIn: (t: number) => 1 - Math.sqrt(1 - t * t),
  circOut: (t: number) => Math.sqrt(1 - Math.pow(t - 1, 2)),
  circInOut: (t: number) =>
    t < 0.5
      ? (1 - Math.sqrt(1 - Math.pow(2 * t, 2))) / 2
      : (Math.sqrt(1 - Math.pow(-2 * t + 2, 2)) + 1) / 2,

  // ─── Elastic ──────────────────────────────────────────────────
  elasticIn: (t: number) =>
    t === 0
      ? 0
      : t === 1
        ? 1
        : -Math.pow(2, 10 * t - 10) *
          Math.sin(((t * 10 - 10.75) * TAU) / 3),
  elasticOut: (t: number) =>
    t === 0
      ? 0
      : t === 1
        ? 1
        : Math.pow(2, -10 * t) *
            Math.sin(((t * 10 - 0.75) * TAU) / 3) +
          1,
  elasticInOut: (t: number) => {
    if (t === 0) return 0
    if (t === 1) return 1
    const c5 = TAU / 4.5
    return t < 0.5
      ? -(Math.pow(2, 20 * t - 10) * Math.sin((20 * t - 11.125) * c5)) / 2
      : (Math.pow(2, -20 * t + 10) * Math.sin((20 * t - 11.125) * c5)) / 2 + 1
  },

  /** Elastic with configurable amplitude and period */
  elastic: (amplitude = 1, period = 0.3): ((t: number) => number) => {
    const a = Math.max(1, amplitude)
    const p = period
    const s = (p / TAU) * Math.asin(1 / a)
    return (t: number) => {
      if (t === 0) return 0
      if (t === 1) return 1
      return a * Math.pow(2, -10 * t) * Math.sin((t - s) * TAU / p) + 1
    }
  },

  // ─── Bounce ───────────────────────────────────────────────────
  bounceOut: bounceOutImpl,
  bounceIn: (t: number) => 1 - bounceOutImpl(1 - t),
  bounceInOut: (t: number) =>
    t < 0.5
      ? (1 - bounceOutImpl(1 - 2 * t)) / 2
      : (1 + bounceOutImpl(2 * t - 1)) / 2,

  // ─── Back (overshoot) ─────────────────────────────────────────
  backIn: (t: number) => c3 * t * t * t - c1 * t * t,
  backOut: (t: number) => 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2),
  backInOut: (t: number) =>
    t < 0.5
      ? (Math.pow(2 * t, 2) * ((c2 + 1) * 2 * t - c2)) / 2
      : (Math.pow(2 * t - 2, 2) * ((c2 + 1) * (t * 2 - 2) + c2) + 2) / 2,

  /** Back with configurable overshoot amount */
  back: (overshoot = 1.70158): ((t: number) => number) => {
    const s = overshoot
    return (t: number) => 1 + (s + 1) * Math.pow(t - 1, 3) + s * Math.pow(t - 1, 2)
  },

  // ─── Steps ────────────────────────────────────────────────────
  steps,

  // ─── Spring approximations ────────────────────────────────────
  /** Light spring - subtle bounce at end */
  springLight: (t: number) => {
    return 1 - Math.exp(-6 * t) * Math.cos(4.5 * PI * t)
  },
  /** Medium spring - noticeable bounce */
  springMedium: (t: number) => {
    return 1 - Math.exp(-5 * t) * Math.cos(3.5 * PI * t)
  },
  /** Heavy spring - strong, slow bounce */
  springHeavy: (t: number) => {
    return 1 - Math.exp(-4 * t) * Math.cos(2.5 * PI * t)
  },

  // ─── Smooth Step ──────────────────────────────────────────────
  /** Hermite interpolation */
  smoothStep: (t: number) => t * t * (3 - 2 * t),
  /** Ken Perlin's smoother step */
  smootherStep: (t: number) => t * t * t * (t * (t * 6 - 15) + 10),

  // ─── Power (generic) ──────────────────────────────────────────
  powerIn: (power: number): ((t: number) => number) =>
    (t: number) => Math.pow(t, power),
  powerOut: (power: number): ((t: number) => number) =>
    (t: number) => 1 - Math.pow(1 - t, power),
  powerInOut: (power: number): ((t: number) => number) =>
    (t: number) =>
      t < 0.5
        ? Math.pow(2 * t, power) / 2
        : 1 - Math.pow(-2 * t + 2, power) / 2,

  // ─── Bezier Factory ───────────────────────────────────────────
  bezier: cubicBezier,

  // ─── Named Bezier Presets ─────────────────────────────────────
  /** Material Design standard curve */
  material: cubicBezier(0.4, 0.0, 0.2, 1.0),
  /** Material deceleration */
  materialDecel: cubicBezier(0.0, 0.0, 0.2, 1.0),
  /** Material acceleration */
  materialAccel: cubicBezier(0.4, 0.0, 1.0, 1.0),
  /** Apple's default spring-like curve */
  appleSpring: cubicBezier(0.25, 0.1, 0.25, 1.0),
  /** Quick snap then settle */
  snappy: cubicBezier(0.55, 0.085, 0.0, 0.99),
  /** Overshoot like a rubber band */
  rubberBand: cubicBezier(0.175, 0.885, 0.32, 1.275),
  /** Cinematic slow-in */
  cinematic: cubicBezier(0.77, 0.0, 0.175, 1.0),
  /** Gentle float */
  gentle: cubicBezier(0.4, 0.0, 0.0, 1.0),
  /** Sharp entrance */
  sharpIn: cubicBezier(0.0, 0.0, 0.0, 1.0),
  /** Sharp exit */
  sharpOut: cubicBezier(1.0, 0.0, 1.0, 1.0),
} as const

/**
 * Lookup easing function by name string.
 * Returns Easing.linear for unknown names.
 */
export function getEasingByName(name: string): (t: number) => number {
  const fn = (Easing as Record<string, unknown>)[name]
  if (typeof fn === 'function') {
    try {
      const result = fn(0.5)
      if (typeof result === 'number') return fn as (t: number) => number
    } catch {
      // Parameterized factory, not a direct easing
    }
  }
  return Easing.linear
}
