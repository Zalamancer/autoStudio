/**
 * Particle effect system for canvas animations.
 *
 * Lightweight particle simulation that runs per-frame and returns
 * drawable particle state. Does NOT render directly — instead
 * returns particle positions/colors/sizes for the canvas layer
 * to draw via Canvas2D or WebGL.
 *
 * Supported effects: confetti, sparkles, smoke, fire, snow,
 * rain, bubbles, hearts, stars, dust, explosion, fireworks.
 */

// ── Types ─────────────────────────────────────────────────────────────

export interface Particle {
  x: number
  y: number
  vx: number
  vy: number
  size: number
  rotation: number
  rotationSpeed: number
  opacity: number
  color: string
  life: number      // 0..1 (1 = just born, 0 = dead)
  shape: ParticleShape
}

export type ParticleShape =
  | 'circle'
  | 'square'
  | 'triangle'
  | 'star'
  | 'heart'
  | 'line'
  | 'ring'

export type ParticleEffectType =
  | 'confetti'
  | 'sparkles'
  | 'smoke'
  | 'fire'
  | 'snow'
  | 'rain'
  | 'bubbles'
  | 'hearts'
  | 'stars'
  | 'dust'
  | 'explosion'
  | 'fireworks'

export interface ParticleEmitter {
  /** Emitter position (normalized 0..1 within canvas) */
  x: number
  y: number
  /** Emission spread (0 = point source, 1 = full width/height) */
  spreadX: number
  spreadY: number
  /** Emission direction in radians (0 = up, PI/2 = right) */
  angle: number
  /** Angle spread in radians */
  angleSpread: number
}

export interface ParticleConfig {
  type: ParticleEffectType
  /** Canvas dimensions for absolute positioning */
  canvasWidth: number
  canvasHeight: number
  /** Emitter configuration */
  emitter?: Partial<ParticleEmitter>
  /** Particles per second */
  rate?: number
  /** Particle lifetime in seconds */
  lifetime?: number
  /** Gravity (pixels/s^2, positive = down) */
  gravity?: number
  /** Initial velocity range */
  speed?: { min: number; max: number }
  /** Size range in pixels */
  size?: { min: number; max: number }
  /** Color palette */
  colors?: string[]
  /** Wind force (pixels/s^2) */
  wind?: number
  /** Intensity multiplier */
  intensity?: number
  /** Max simultaneous particles */
  maxParticles?: number
}

export interface ParticleSystem {
  particles: Particle[]
  emitter: ParticleEmitter
  config: ParticleConfig
  accumulator: number
}

// ── Defaults ──────────────────────────────────────────────────────────

const DEFAULT_EMITTER: ParticleEmitter = {
  x: 0.5,
  y: 0.5,
  spreadX: 0,
  spreadY: 0,
  angle: -Math.PI / 2, // up
  angleSpread: Math.PI / 4,
}

// ── Effect Defaults ───────────────────────────────────────────────────

function getEffectDefaults(type: ParticleEffectType): Partial<ParticleConfig> {
  switch (type) {
    case 'confetti':
      return {
        rate: 30,
        lifetime: 3,
        gravity: 120,
        speed: { min: 100, max: 250 },
        size: { min: 4, max: 8 },
        colors: ['#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A', '#98D8C8', '#F7DC6F', '#BB8FCE'],
        maxParticles: 200,
        emitter: { y: 0.2, spreadX: 0.8, angleSpread: Math.PI },
      }
    case 'sparkles':
      return {
        rate: 15,
        lifetime: 1.5,
        gravity: -10,
        speed: { min: 10, max: 40 },
        size: { min: 2, max: 5 },
        colors: ['#FFD700', '#FFF8DC', '#FFFACD', '#FFFFFF'],
        maxParticles: 80,
        emitter: { spreadX: 0.6, spreadY: 0.4 },
      }
    case 'smoke':
      return {
        rate: 8,
        lifetime: 4,
        gravity: -30,
        speed: { min: 10, max: 30 },
        size: { min: 10, max: 25 },
        colors: ['#888888', '#999999', '#AAAAAA', '#BBBBBB'],
        maxParticles: 60,
        emitter: { y: 0.8, spreadX: 0.1 },
      }
    case 'fire':
      return {
        rate: 25,
        lifetime: 1.5,
        gravity: -80,
        speed: { min: 40, max: 80 },
        size: { min: 4, max: 12 },
        colors: ['#FF4500', '#FF6347', '#FF8C00', '#FFD700', '#FFA500'],
        maxParticles: 120,
        emitter: { y: 0.85, spreadX: 0.15, angle: -Math.PI / 2, angleSpread: Math.PI / 6 },
      }
    case 'snow':
      return {
        rate: 10,
        lifetime: 8,
        gravity: 20,
        speed: { min: 5, max: 15 },
        size: { min: 2, max: 6 },
        colors: ['#FFFFFF', '#F0F8FF', '#E8E8E8'],
        wind: 15,
        maxParticles: 150,
        emitter: { y: -0.05, spreadX: 1, angle: Math.PI / 2, angleSpread: Math.PI / 8 },
      }
    case 'rain':
      return {
        rate: 40,
        lifetime: 2,
        gravity: 400,
        speed: { min: 200, max: 350 },
        size: { min: 1, max: 3 },
        colors: ['#87CEEB', '#ADD8E6', '#B0C4DE'],
        maxParticles: 300,
        emitter: { y: -0.05, spreadX: 1, angle: Math.PI / 2 + 0.1, angleSpread: 0.05 },
      }
    case 'bubbles':
      return {
        rate: 5,
        lifetime: 5,
        gravity: -40,
        speed: { min: 10, max: 30 },
        size: { min: 4, max: 12 },
        colors: ['#87CEEB44', '#ADD8E644', '#B0E0E644'],
        maxParticles: 40,
        emitter: { y: 0.9, spreadX: 0.6 },
      }
    case 'hearts':
      return {
        rate: 8,
        lifetime: 3,
        gravity: -30,
        speed: { min: 20, max: 60 },
        size: { min: 6, max: 14 },
        colors: ['#FF69B4', '#FF1493', '#DC143C', '#FF6B6B'],
        maxParticles: 50,
        emitter: { spreadX: 0.5, spreadY: 0.3 },
      }
    case 'stars':
      return {
        rate: 6,
        lifetime: 2.5,
        gravity: -20,
        speed: { min: 15, max: 50 },
        size: { min: 3, max: 8 },
        colors: ['#FFD700', '#FFA500', '#FFFFFF', '#FFFACD'],
        maxParticles: 60,
        emitter: { spreadX: 0.6, spreadY: 0.4 },
      }
    case 'dust':
      return {
        rate: 4,
        lifetime: 6,
        gravity: 5,
        speed: { min: 3, max: 10 },
        size: { min: 1, max: 3 },
        colors: ['#D2B48C44', '#C4A88244', '#DEB88744'],
        wind: 8,
        maxParticles: 60,
        emitter: { spreadX: 1, spreadY: 1 },
      }
    case 'explosion':
      return {
        rate: 500, // burst
        lifetime: 1.5,
        gravity: 100,
        speed: { min: 100, max: 300 },
        size: { min: 3, max: 8 },
        colors: ['#FF4500', '#FF6347', '#FFD700', '#FF8C00', '#FFFFFF'],
        maxParticles: 150,
        emitter: { angleSpread: Math.PI * 2 },
      }
    case 'fireworks':
      return {
        rate: 200,
        lifetime: 2,
        gravity: 60,
        speed: { min: 60, max: 180 },
        size: { min: 2, max: 4 },
        colors: ['#FF6B6B', '#4ECDC4', '#45B7D1', '#FFD700', '#FF69B4', '#98D8C8'],
        maxParticles: 200,
        emitter: { angleSpread: Math.PI * 2 },
      }
  }
}

// ── System Management ─────────────────────────────────────────────────

/**
 * Create a new particle system.
 */
export function createParticleSystem(config: ParticleConfig): ParticleSystem {
  const defaults = getEffectDefaults(config.type)
  const mergedConfig = { ...defaults, ...config }
  const emitter: ParticleEmitter = {
    ...DEFAULT_EMITTER,
    ...defaults.emitter,
    ...config.emitter,
  }

  return {
    particles: [],
    emitter,
    config: mergedConfig,
    accumulator: 0,
  }
}

/**
 * Update particle system by one time step.
 * Call once per frame with dt = 1/fps.
 */
export function updateParticleSystem(
  system: ParticleSystem,
  dt: number,
): ParticleSystem {
  const { config, emitter } = system
  const rate = config.rate ?? 20
  const lifetime = config.lifetime ?? 2
  const gravity = config.gravity ?? 0
  const wind = config.wind ?? 0
  const maxParticles = config.maxParticles ?? 200
  const intensity = config.intensity ?? 1

  // Update existing particles
  const alive: Particle[] = []
  for (const p of system.particles) {
    p.life -= dt / lifetime
    if (p.life <= 0) continue

    p.vy += gravity * dt
    p.vx += wind * dt
    p.x += p.vx * dt
    p.y += p.vy * dt
    p.rotation += p.rotationSpeed * dt

    // Fade out in last 30% of life
    if (p.life < 0.3) {
      p.opacity = p.life / 0.3
    }

    // Smoke/fire grow over time
    if (config.type === 'smoke' || config.type === 'fire') {
      p.size += dt * 3
    }

    alive.push(p)
  }

  // Emit new particles
  const effectiveRate = rate * intensity
  let accumulator = system.accumulator + effectiveRate * dt
  const toEmit = Math.floor(accumulator)
  accumulator -= toEmit

  const speedMin = config.speed?.min ?? 20
  const speedMax = config.speed?.max ?? 100
  const sizeMin = config.size?.min ?? 2
  const sizeMax = config.size?.max ?? 8
  const colors = config.colors ?? ['#FFFFFF']

  for (let i = 0; i < toEmit && alive.length < maxParticles; i++) {
    const angle = emitter.angle + (Math.random() - 0.5) * emitter.angleSpread * 2
    const speed = speedMin + Math.random() * (speedMax - speedMin)

    const shape = getShapeForEffect(config.type)
    const particle: Particle = {
      x: (emitter.x + (Math.random() - 0.5) * emitter.spreadX) * config.canvasWidth,
      y: (emitter.y + (Math.random() - 0.5) * emitter.spreadY) * config.canvasHeight,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      size: sizeMin + Math.random() * (sizeMax - sizeMin),
      rotation: Math.random() * Math.PI * 2,
      rotationSpeed: (Math.random() - 0.5) * 4,
      opacity: 1,
      color: colors[Math.floor(Math.random() * colors.length)],
      life: 1,
      shape,
    }

    alive.push(particle)
  }

  return {
    ...system,
    particles: alive,
    accumulator,
  }
}

function getShapeForEffect(type: ParticleEffectType): ParticleShape {
  switch (type) {
    case 'confetti': return ['square', 'line'][Math.floor(Math.random() * 2)] as ParticleShape
    case 'sparkles': return 'star'
    case 'smoke': return 'circle'
    case 'fire': return 'circle'
    case 'snow': return 'circle'
    case 'rain': return 'line'
    case 'bubbles': return 'ring'
    case 'hearts': return 'heart'
    case 'stars': return 'star'
    case 'dust': return 'circle'
    case 'explosion': return 'circle'
    case 'fireworks': return 'circle'
    default: return 'circle'
  }
}

/**
 * Render particles to a Canvas2D context.
 */
export function renderParticles(
  ctx: CanvasRenderingContext2D,
  system: ParticleSystem,
): void {
  for (const p of system.particles) {
    if (p.opacity <= 0) continue

    ctx.save()
    ctx.translate(p.x, p.y)
    ctx.rotate(p.rotation)
    ctx.globalAlpha = p.opacity

    switch (p.shape) {
      case 'circle':
        ctx.beginPath()
        ctx.fillStyle = p.color
        ctx.arc(0, 0, p.size, 0, Math.PI * 2)
        ctx.fill()
        break

      case 'square':
        ctx.fillStyle = p.color
        ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size)
        break

      case 'triangle':
        ctx.beginPath()
        ctx.fillStyle = p.color
        ctx.moveTo(0, -p.size)
        ctx.lineTo(p.size * 0.87, p.size * 0.5)
        ctx.lineTo(-p.size * 0.87, p.size * 0.5)
        ctx.closePath()
        ctx.fill()
        break

      case 'star':
        drawStar(ctx, p.size, p.color)
        break

      case 'heart':
        drawHeart(ctx, p.size, p.color)
        break

      case 'line':
        ctx.strokeStyle = p.color
        ctx.lineWidth = Math.max(1, p.size * 0.3)
        ctx.beginPath()
        ctx.moveTo(0, -p.size)
        ctx.lineTo(0, p.size)
        ctx.stroke()
        break

      case 'ring':
        ctx.strokeStyle = p.color
        ctx.lineWidth = 1
        ctx.beginPath()
        ctx.arc(0, 0, p.size, 0, Math.PI * 2)
        ctx.stroke()
        break
    }

    ctx.restore()
  }
}

function drawStar(ctx: CanvasRenderingContext2D, size: number, color: string): void {
  ctx.fillStyle = color
  ctx.beginPath()
  for (let i = 0; i < 5; i++) {
    const angle = (i * 4 * Math.PI) / 5 - Math.PI / 2
    const r = i === 0 ? size : size
    const method = i === 0 ? 'moveTo' : 'lineTo'
    ctx[method](Math.cos(angle) * r, Math.sin(angle) * r)

    const innerAngle = angle + (2 * Math.PI) / 10
    ctx.lineTo(Math.cos(innerAngle) * size * 0.4, Math.sin(innerAngle) * size * 0.4)
  }
  ctx.closePath()
  ctx.fill()
}

function drawHeart(ctx: CanvasRenderingContext2D, size: number, color: string): void {
  ctx.fillStyle = color
  ctx.beginPath()
  const s = size * 0.6
  ctx.moveTo(0, s * 0.3)
  ctx.bezierCurveTo(-s, -s * 0.5, -s * 2, s * 0.3, 0, s * 1.5)
  ctx.bezierCurveTo(s * 2, s * 0.3, s, -s * 0.5, 0, s * 0.3)
  ctx.fill()
}

/**
 * Trigger a one-shot burst effect (explosion, fireworks).
 * Returns a pre-filled system that just needs to be updated each frame.
 */
export function burstEffect(
  type: 'explosion' | 'fireworks',
  x: number,
  y: number,
  canvasWidth: number,
  canvasHeight: number,
): ParticleSystem {
  const system = createParticleSystem({
    type,
    canvasWidth,
    canvasHeight,
    emitter: { x: x / canvasWidth, y: y / canvasHeight },
  })

  // Emit all particles at once for burst
  return updateParticleSystem(system, 1 / 30)
}
