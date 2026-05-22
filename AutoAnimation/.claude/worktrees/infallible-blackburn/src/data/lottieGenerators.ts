/**
 * Programmatic Lottie JSON generators using the open-source Lottie format.
 *
 * References:
 *   - Lottie format spec:  https://lottie.github.io/lottie-spec/
 *   - Lottie docs:         https://lottiefiles.github.io/lottie-docs/
 *   - lottie-web (MIT):    https://github.com/airbnb/lottie-web
 *
 * Each generator returns a valid Lottie JSON object (30 fps, looping).
 * Zero external file dependencies.
 */

// ─── Helpers ──────────────────────────────────────────────────

export interface WrapOpts {
  w?: number
  h?: number
  fr?: number
  /** Out-point (total frame count). */
  op?: number
}

/** Wrap layers into a complete Lottie animation document. */
export function wrap(layers: object[], opts: WrapOpts = {}): object {
  const { w = 512, h = 512, fr = 30, op = 90 } = opts
  return { v: '5.7.1', fr, ip: 0, op, w, h, nm: 'gen', ddd: 0, assets: [], layers }
}

// ── Property helpers (static & animated) ──

/** Static (non-animated) property value. */
export function sv(k: number | number[]): object {
  return { a: 0, k }
}

/**
 * Build an animated property from an array of `{t, v}` entries.
 *
 * `t` = frame, `v` = value (number[] for multi-dim, number for scalar).
 * Easing handle dimensions are inferred automatically from the value.
 * Uses ease-in-out cubic bezier by default.
 */
export function anim(
  frames: Array<{ t: number; v: number | number[] }>,
  easeIn = 0.4,
  easeOut = 0.4,
): object {
  if (frames.length < 2) return sv(frames[0]?.v ?? 0)

  const k = frames.map((f, i) => {
    const val = Array.isArray(f.v) ? f.v : [f.v]
    const dims = val.length
    const isLast = i === frames.length - 1

    const entry: Record<string, unknown> = { t: f.t, s: val }

    // All keyframes except the last need easing handles
    if (!isLast) {
      entry.o = { x: new Array(dims).fill(easeOut), y: new Array(dims).fill(0) }
      entry.i = { x: new Array(dims).fill(easeIn),  y: new Array(dims).fill(1) }
    }

    return entry
  })

  return { a: 1, k }
}

// ── Shape primitives ──

export function ellipseShape(cx: number, cy: number, w: number, h: number): object {
  return { ty: 'el', d: 1, p: sv([cx, cy]), s: sv([w, h]) }
}

export function rectShape(cx: number, cy: number, w: number, h: number, r = 0): object {
  return { ty: 'rc', d: 1, p: sv([cx, cy]), s: sv([w, h]), r: sv(r) }
}

export function polystarShape(cx: number, cy: number, outerR: number, innerR: number, pts: number): object {
  return {
    ty: 'sr', sy: 1, d: 1,
    pt: sv(pts), p: sv([cx, cy]), r: sv(0),
    or: sv(outerR), os: sv(0), ir: sv(innerR), is: sv(0),
  }
}

export function pathShape(vertices: number[][], inTangents: number[][], outTangents: number[][], closed = false): object {
  return {
    ty: 'sh', d: 1,
    ks: sv({ v: vertices, i: inTangents, o: outTangents, c: closed } as unknown as number),
  }
}

// ── Style primitives ──

export function fillStyle(r: number, g: number, b: number, opacity = 100): object {
  return { ty: 'fl', c: sv([r / 255, g / 255, b / 255, 1]), o: sv(opacity), r: 1, bm: 0 }
}

export function strokeStyle(r: number, g: number, b: number, width = 2, opacity = 100): object {
  return { ty: 'st', c: sv([r / 255, g / 255, b / 255, 1]), o: sv(opacity), w: sv(width), lc: 2, lj: 2, bm: 0 }
}

// ── Group & Layer builders ──

export function grp(items: object[]): object {
  return {
    ty: 'gr', nm: 'g', bm: 0,
    it: [
      ...items,
      // Group transform — must be last item in the group
      { ty: 'tr', p: sv([0, 0]), a: sv([0, 0]), s: sv([100, 100]), r: sv(0), o: sv(100), sk: sv(0), sa: sv(0) },
    ],
  }
}

export interface LayerKS {
  p?: object   // position
  s?: object   // scale
  r?: object   // rotation
  o?: object   // opacity
  a?: object   // anchor
}

export function shapeLayer(idx: number, shapes: object[], ks: LayerKS = {}, op = 9999): object {
  return {
    ddd: 0, ind: idx, ty: 4, nm: `L${idx}`, sr: 1,
    ks: {
      o: ks.o ?? sv(100),
      r: ks.r ?? sv(0),
      p: ks.p ?? sv([256, 256, 0]),
      a: ks.a ?? sv([0, 0, 0]),
      s: ks.s ?? sv([100, 100, 100]),
    },
    ao: 0, shapes, ip: 0, op, st: 0, bm: 0,
  }
}

// ─── Generators ───────────────────────────────────────────────

/**
 * Wave Loop — 3 large, soft ellipses drifting up & down with staggered timing.
 */
export function generateWaveLoop(): object {
  const OP = 120
  const colors: [number, number, number][] = [
    [70, 130, 230],
    [100, 160, 255],
    [50, 100, 200],
  ]

  const layers = colors.map(([r, g, b], i) => {
    const baseY = 300 + i * 60
    const amp = 40
    // 4 evenly spaced keyframes within [0, OP]
    const step = OP / 4
    const phase = i * (step / 3)

    const posFrames: Array<{ t: number; v: number[] }> = []
    for (let k = 0; k <= 4; k++) {
      const t = Math.round(phase + k * step)
      const y = k % 2 === 0 ? baseY - amp : baseY + amp
      posFrames.push({ t: Math.min(t, OP), v: [256, y, 0] })
    }
    // Clamp and deduplicate: ensure monotonic and within [0, OP]
    const cleaned = clampKeyframes(posFrames, OP)

    return shapeLayer(i, [
      grp([ellipseShape(0, 0, 700, 200), fillStyle(r, g, b, 30)]),
    ], { p: anim(cleaned), o: sv(30) }, OP)
  })

  return wrap(layers, { op: OP })
}

/**
 * Ripple — 4 concentric ring strokes expanding outward with fade-out.
 */
export function generateRipple(): object {
  const OP = 120

  const layers = Array.from({ length: 4 }, (_, i) => {
    const t0 = i * 25
    const t1 = Math.min(t0 + 80, OP)

    return shapeLayer(i, [
      grp([ellipseShape(0, 0, 100, 100), strokeStyle(100, 180, 255, 2)]),
    ], {
      p: sv([256, 256, 0]),
      s: anim([{ t: t0, v: [10, 10, 100] }, { t: t1, v: [600, 600, 100] }]),
      o: anim([{ t: t0, v: 80 }, { t: t1, v: 0 }]),
    }, OP)
  })

  return wrap(layers, { op: OP })
}

/**
 * Starfield — 18 tiny dots pulsing opacity at staggered intervals.
 */
export function generateStarfield(): object {
  const OP = 120

  const layers = Array.from({ length: 18 }, (_, i) => {
    const x = 30 + (i * 97) % 460
    const y = 30 + (i * 73) % 460
    const size = 3 + (i % 4) * 2
    // Each dot fades in and out over ~60 frames, staggered start
    const t0 = Math.round((i / 18) * 60)
    const t1 = t0 + 30
    const t2 = Math.min(t0 + 60, OP)

    return shapeLayer(i, [
      grp([ellipseShape(0, 0, size, size), fillStyle(255, 255, 255)]),
    ], {
      p: sv([x, y, 0]),
      o: anim(clampKeyframes([
        { t: t0, v: 10 }, { t: t1, v: 90 }, { t: t2, v: 10 },
      ], OP)),
    }, OP)
  })

  return wrap(layers, { op: OP })
}

/**
 * Confetti — 12 small colored rectangles falling + rotating.
 */
export function generateConfetti(): object {
  const OP = 90
  const palette: [number, number, number][] = [
    [255, 80, 80], [80, 200, 120], [80, 140, 255],
    [255, 200, 50], [200, 80, 255], [255, 140, 60],
  ]

  const layers = Array.from({ length: 12 }, (_, i) => {
    const x = 40 + (i * 41) % 440
    const startY = -20 - (i * 30) % 60
    const endY = 540 + (i * 20) % 60
    const t0 = (i * 5) % 30
    const [r, g, b] = palette[i % palette.length]
    const drift = (i % 2 === 0) ? 30 : -30
    const rotEnd = 180 + (i % 3) * 120

    return shapeLayer(i, [
      grp([rectShape(0, 0, 10, 14), fillStyle(r, g, b)]),
    ], {
      p: anim([{ t: t0, v: [x, startY, 0] }, { t: OP, v: [x + drift, endY, 0] }]),
      r: anim([{ t: t0, v: 0 }, { t: OP, v: rotEnd }]),
    }, OP)
  })

  return wrap(layers, { op: OP })
}

/**
 * Sparkles — 8 polystars pulsing scale + slow rotation.
 */
export function generateSparkles(): object {
  const OP = 90

  const layers = Array.from({ length: 8 }, (_, i) => {
    const x = 60 + (i * 67) % 400
    const y = 60 + (i * 53) % 400
    const t0 = Math.round((i / 8) * 50)
    const tMid = t0 + 20
    const tEnd = Math.min(t0 + 40, OP)

    return shapeLayer(i, [
      grp([polystarShape(0, 0, 12, 5, 4), fillStyle(255, 230, 100)]),
    ], {
      p: sv([x, y, 0]),
      s: anim(clampKeyframes([
        { t: t0, v: [40, 40, 100] }, { t: tMid, v: [130, 130, 100] }, { t: tEnd, v: [40, 40, 100] },
      ], OP)),
      r: anim([{ t: 0, v: 0 }, { t: OP, v: 45 }]),
    }, OP)
  })

  return wrap(layers, { op: OP })
}

/**
 * Floating Hearts — 6 heart shapes (3-ellipse composite) rising with sway + fade.
 */
export function generateFloatingHearts(): object {
  const OP = 120

  const layers = Array.from({ length: 6 }, (_, i) => {
    const baseX = 80 + (i * 73) % 360
    const sway = (i % 2 === 0) ? 30 : -30
    // Evenly stagger each heart's lifecycle within OP
    const t0 = Math.round((i / 6) * 40)
    const dur = OP - t0
    const q1 = t0 + Math.round(dur * 0.25)
    const q2 = t0 + Math.round(dur * 0.5)
    const q3 = t0 + Math.round(dur * 0.75)

    return shapeLayer(i, [
      grp([
        ellipseShape(-5, -3, 14, 12),
        ellipseShape(5, -3, 14, 12),
        ellipseShape(0, 6, 8, 10),
        fillStyle(230, 60, 80),
      ]),
    ], {
      p: anim([
        { t: t0, v: [baseX, 520, 0] },
        { t: q1, v: [baseX + sway, 400, 0] },
        { t: q2, v: [baseX, 280, 0] },
        { t: q3, v: [baseX + sway, 140, 0] },
        { t: OP, v: [baseX, -20, 0] },
      ]),
      o: anim(clampKeyframes([
        { t: t0, v: 0 },
        { t: t0 + 10, v: 80 },
        { t: Math.max(OP - 20, t0 + 15), v: 80 },
        { t: OP, v: 0 },
      ], OP)),
    }, OP)
  })

  return wrap(layers, { op: OP })
}

/**
 * Fire Effect — 5 overlapping ellipses (yellow→red gradient) flickering.
 */
export function generateFireEffect(): object {
  const OP = 60
  const fireColors: [number, number, number][] = [
    [255, 220, 50], [255, 180, 30], [255, 130, 20], [230, 80, 10], [200, 40, 10],
  ]

  const layers = fireColors.map(([r, g, b], i) => {
    const baseY = 380 - i * 20
    const sz = 160 - i * 20
    // Staggered flicker: each layer oscillates at a slight offset
    const off = i * 5
    const t1 = off
    const t2 = Math.min(off + 15, OP)
    const t3 = Math.min(off + 30, OP)
    const opBase = 60 - i * 5
    const jitterX = (i % 2 === 0) ? 8 : -8

    return shapeLayer(i, [
      grp([ellipseShape(0, 0, sz, sz + 40), fillStyle(r, g, b)]),
    ], {
      p: anim(clampKeyframes([
        { t: t1, v: [256, baseY, 0] },
        { t: t2, v: [256 + jitterX, baseY - 15, 0] },
        { t: t3, v: [256, baseY, 0] },
      ], OP)),
      s: anim(clampKeyframes([
        { t: t1, v: [90, 80, 100] },
        { t: t2, v: [110, 120, 100] },
        { t: t3, v: [90, 80, 100] },
      ], OP)),
      o: anim(clampKeyframes([
        { t: t1, v: opBase },
        { t: t2, v: opBase + 20 },
        { t: t3, v: opBase },
      ], OP)),
    }, OP)
  })

  return wrap(layers, { op: OP })
}

/**
 * Snowfall — 15 small circles drifting down with gentle x-sway.
 */
export function generateSnowfall(): object {
  const OP = 120

  const layers = Array.from({ length: 15 }, (_, i) => {
    const x = 20 + (i * 37) % 480
    const startY = -10 - (i * 25) % 80
    const endY = 530 + (i * 15) % 40
    const drift = ((i % 3) - 1) * 25
    const t0 = Math.round((i / 15) * 30)
    const tMid = t0 + Math.round((OP - t0) / 2)
    const size = 4 + (i % 3) * 3

    return shapeLayer(i, [
      grp([ellipseShape(0, 0, size, size), fillStyle(230, 240, 255, 80)]),
    ], {
      p: anim([
        { t: t0, v: [x, startY, 0] },
        { t: tMid, v: [x + drift, (startY + endY) / 2, 0] },
        { t: OP, v: [x + drift * 2, endY, 0] },
      ]),
      o: anim(clampKeyframes([
        { t: t0, v: 0 },
        { t: t0 + 10, v: 70 },
        { t: Math.max(OP - 15, t0 + 15), v: 70 },
        { t: OP, v: 0 },
      ], OP)),
    }, OP)
  })

  return wrap(layers, { op: OP })
}

/**
 * Flowing Wave — 3 sine-wave strokes sliding horizontally.
 */
export function generateFlowingWave(): object {
  const OP = 120
  const waveColors: [number, number, number][] = [
    [100, 200, 255], [60, 160, 230], [40, 120, 200],
  ]

  const layers = waveColors.map(([r, g, b], i) => {
    const baseY = 300 + i * 50
    const off = i * 15
    const tMid = Math.min(off + 60, OP)

    // Sine-wave bezier path: 5 control points
    const verts = [[-300, 0], [-150, 0], [0, 0], [150, 0], [300, 0]]
    const inT  = [[0, 0], [30, -40], [30, 40], [30, -40], [0, 0]]
    const outT = [[30, 40], [30, -40], [30, 40], [30, -40], [0, 0]]

    return shapeLayer(i, [
      grp([pathShape(verts, inT, outT), strokeStyle(r, g, b, 3)]),
    ], {
      p: anim(clampKeyframes([
        { t: off, v: [256, baseY, 0] },
        { t: tMid, v: [356, baseY, 0] },
        { t: OP, v: [256, baseY, 0] },
      ], OP)),
      o: sv(50),
    }, OP)
  })

  return wrap(layers, { op: OP })
}

// ─── Utility ──────────────────────────────────────────────────

/**
 * Ensure keyframe list is monotonically increasing in `t` and within [0, op].
 * Deduplicates timestamps and clamps any that exceed `op`.
 */
export function clampKeyframes(
  frames: Array<{ t: number; v: number | number[] }>,
  op: number,
): Array<{ t: number; v: number | number[] }> {
  const result: Array<{ t: number; v: number | number[] }> = []
  let prevT = -1

  for (const f of frames) {
    const t = Math.min(Math.max(Math.round(f.t), 0), op)
    if (t <= prevT) continue // skip non-monotonic or duplicate
    result.push({ t, v: f.v })
    prevT = t
  }

  // Need at least 2 keyframes for animation
  if (result.length < 2) {
    const first = frames[0]
    const last = frames[frames.length - 1]
    return [
      { t: 0, v: first.v },
      { t: op, v: last.v },
    ]
  }

  return result
}
