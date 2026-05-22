/**
 * Deterministic particle simulation engine.
 *
 * Generates particle state for a given frame based on emitter parameters.
 * Uses seeded pseudo-random numbers so frames are reproducible (important
 * for scrubbing and export).
 */

import type { ParticleEmitter } from '@/stores/useParticleStore'

// ── Types ─────────────────────────────────────────────────────────────

export interface Particle {
  x: number
  y: number
  vx: number
  vy: number
  size: number
  rotation: number
  rotationSpeed: number
  color: string
  opacity: number
  age: number       // current age in frames
  lifetime: number  // total lifetime in frames
  /** For rain: aspect ratio stretch (width multiplier) */
  aspect: number
}

export interface ParticleFrameState {
  particles: Particle[]
}

// ── Seeded PRNG (mulberry32) ──────────────────────────────────────────

function mulberry32(seed: number) {
  return () => {
    seed |= 0
    seed = (seed + 0x6d2b79f5) | 0
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

// ── Core engine ───────────────────────────────────────────────────────

/**
 * Compute the particles visible at a specific frame for a given emitter.
 * Deterministic: the same emitter + frame always produces the same output.
 *
 * @param emitter  Particle emitter configuration
 * @param frame    Current frame number (absolute timeline frame)
 * @param canvasWidth  Canvas width in pixels
 * @param canvasHeight Canvas height in pixels
 */
export function computeParticlesAtFrame(
  emitter: ParticleEmitter,
  frame: number,
  canvasWidth: number,
  canvasHeight: number,
): ParticleFrameState {
  // Frame relative to emitter start
  const relFrame = frame - emitter.startFrame
  if (relFrame < 0) return { particles: [] }

  const emitX = (emitter.emitterX / 100) * canvasWidth
  const emitY = (emitter.emitterY / 100) * canvasHeight
  const emitW = (emitter.emitterWidth / 100) * canvasWidth
  const emitH = (emitter.emitterHeight / 100) * canvasHeight

  // Calculate emission interval: spread particles evenly across lifetime
  // so that `particleCount` particles are alive at any given steady-state moment
  const emitInterval = Math.max(1, Math.round(emitter.lifetime / emitter.particleCount))

  const particles: Particle[] = []

  // We only need to look back `lifetime` frames to find alive particles
  const lookback = emitter.lifetime
  const startCheck = Math.max(0, relFrame - lookback)

  for (let spawnFrame = startCheck; spawnFrame <= relFrame; spawnFrame++) {
    // How many particles spawn on this frame?
    if (spawnFrame % emitInterval !== 0) continue

    // Seed from emitter id hash + spawn frame for determinism
    const seed = hashString(emitter.id) * 31 + spawnFrame * 7919
    const rand = mulberry32(seed)

    // Batch: emit 1 particle per interval tick
    const age = relFrame - spawnFrame
    const lifetime = emitter.lifetime + Math.round((rand() - 0.5) * emitter.lifetime * 0.2)
    if (age >= lifetime) continue

    // Spawn position: random within emitter rectangle
    const spawnX = emitX - emitW / 2 + rand() * emitW
    const spawnY = emitY - emitH / 2 + rand() * emitH

    // Direction: convert degrees to radians (0=up)
    const dirRad = ((emitter.direction - 90) * Math.PI) / 180
    const spreadRad = (emitter.spread * Math.PI) / 180
    const angle = dirRad + (rand() - 0.5) * spreadRad

    const speed = emitter.speed * (0.5 + rand() * 1.0)
    const vx0 = Math.cos(angle) * speed
    const vy0 = Math.sin(angle) * speed

    // Size with variance
    const size = emitter.size * (1 + (rand() - 0.5) * emitter.sizeVariance * 2)

    // Rotation
    const rotationSpeed = emitter.rotation * (1 + (rand() - 0.5) * emitter.rotationVariance * 2)
    const initialRotation = rand() * 360

    // Color
    const color = emitter.colors[Math.floor(rand() * emitter.colors.length)]

    // Simulate position at current age
    let px = spawnX
    let py = spawnY
    let cvx = vx0
    let cvy = vy0
    for (let t = 0; t < age; t++) {
      cvx += emitter.wind * 0.01
      cvy += emitter.gravity
      px += cvx
      py += cvy
    }

    // Opacity with fade-in/fade-out
    let opacity = emitter.opacity
    if (age < emitter.fadeIn && emitter.fadeIn > 0) {
      opacity *= age / emitter.fadeIn
    }
    if (age > lifetime - emitter.fadeOut && emitter.fadeOut > 0) {
      opacity *= (lifetime - age) / emitter.fadeOut
    }

    // Rain particles are elongated
    const aspect = emitter.preset === 'rain' ? 0.2 : 1

    particles.push({
      x: px,
      y: py,
      vx: cvx,
      vy: cvy,
      size: Math.max(1, size),
      rotation: initialRotation + rotationSpeed * age,
      rotationSpeed,
      color,
      opacity: Math.max(0, Math.min(1, opacity)),
      age,
      lifetime,
      aspect,
    })
  }

  return { particles }
}

// ── Draw particles on a Canvas2D context ──────────────────────────────

export function drawParticlesOnCanvas(
  ctx: CanvasRenderingContext2D,
  particles: Particle[],
  preset: string,
) {
  for (const p of particles) {
    if (p.opacity <= 0) continue

    ctx.save()
    ctx.globalAlpha = p.opacity
    ctx.translate(p.x, p.y)
    ctx.rotate((p.rotation * Math.PI) / 180)

    ctx.fillStyle = p.color

    switch (preset) {
      case 'confetti': {
        // Rectangles with slight 3D tumble effect
        const w = p.size * 1.5
        const h = p.size * 0.8
        const scaleX = Math.cos((p.rotation * Math.PI) / 90) * 0.5 + 0.5
        ctx.scale(scaleX, 1)
        ctx.fillRect(-w / 2, -h / 2, w, h)
        break
      }

      case 'sparkles': {
        // 4-point star
        const s = p.size
        // Pulsing size based on age
        const pulse = 0.5 + 0.5 * Math.sin((p.age / 10) * Math.PI)
        const r = s * (0.6 + 0.4 * pulse)
        ctx.beginPath()
        for (let i = 0; i < 8; i++) {
          const angle = (Math.PI * 2 * i) / 8
          const dist = i % 2 === 0 ? r : r * 0.3
          const px = Math.cos(angle) * dist
          const py = Math.sin(angle) * dist
          if (i === 0) ctx.moveTo(px, py)
          else ctx.lineTo(px, py)
        }
        ctx.closePath()
        ctx.fill()
        break
      }

      case 'snow': {
        // Circle with slight glow
        ctx.beginPath()
        ctx.arc(0, 0, p.size / 2, 0, Math.PI * 2)
        ctx.fill()
        break
      }

      case 'fire': {
        // Soft circle that shrinks with age
        const ageRatio = p.age / p.lifetime
        const fireSize = p.size * (1 - ageRatio * 0.6)
        ctx.beginPath()
        ctx.arc(0, 0, fireSize / 2, 0, Math.PI * 2)
        ctx.fill()
        break
      }

      case 'smoke': {
        // Large soft circle that grows
        const smokeAgeRatio = p.age / p.lifetime
        const smokeSize = p.size * (0.5 + smokeAgeRatio * 1.5)
        ctx.beginPath()
        ctx.arc(0, 0, smokeSize / 2, 0, Math.PI * 2)
        ctx.fill()
        break
      }

      case 'rain': {
        // Thin elongated line
        const len = p.size * 3
        ctx.strokeStyle = p.color
        ctx.lineWidth = Math.max(1, p.size * 0.3)
        ctx.lineCap = 'round'
        ctx.beginPath()
        ctx.moveTo(0, -len / 2)
        ctx.lineTo(0, len / 2)
        ctx.stroke()
        break
      }

      default: {
        // Fallback: simple circle
        ctx.beginPath()
        ctx.arc(0, 0, p.size / 2, 0, Math.PI * 2)
        ctx.fill()
      }
    }

    ctx.restore()
  }
}

// ── Helpers ───────────────────────────────────────────────────────────

function hashString(str: string): number {
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i)
    hash = ((hash << 5) - hash + char) | 0
  }
  return Math.abs(hash)
}
