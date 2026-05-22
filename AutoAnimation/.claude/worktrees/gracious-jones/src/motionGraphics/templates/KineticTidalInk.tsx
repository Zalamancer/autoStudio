import { registerMotionGraphic } from '../registry'
import { KineticBase, type KineticBaseConfig, type KineticAnimation, type WordRenderProps, type BackgroundRenderProps } from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

/**
 * KineticTidalInk — Ink dropped into still water.
 * Fractal tendrils bloom outward from a central impact point,
 * swirling into letter shapes. Hold phase shows slow Brownian
 * ink diffusion. Exit: tendrils retract inward and dissolve.
 */

interface TidalInkConfig extends KineticBaseConfig {}

/** Deterministic pseudo-random 0..1 from seed */
function rand(s: number): number {
  const x = Math.sin(s * 127.1 + 311.7) * 43758.5453
  return x - Math.floor(x)
}

/** Ink diffusion easing — fast initial spread, long slow tail */
function easeOutExpo(t: number): number {
  return t >= 1 ? 1 : 1 - Math.pow(2, -10 * t)
}

function easeInCubic(t: number): number {
  return t * t * t
}

/** Slow Brownian drift easing for hold phase */
function brownianDrift(t: number, seed: number): number {
  return Math.sin(t * 0.7 + seed * 2.3) * 0.6
    + Math.sin(t * 1.3 + seed * 4.1) * 0.3
    + Math.sin(t * 2.1 + seed * 1.7) * 0.1
}

const animation: KineticAnimation = {
  renderBackground: ({ bgColor, width, height, frame, fps }: BackgroundRenderProps) => {
    const t = frame / fps

    // Ambient ink clouds drifting in water — slow, organic, large
    const clouds: React.ReactNode[] = []
    for (let i = 0; i < 5; i++) {
      const cx = width * (0.15 + 0.7 * rand(i * 31 + 3))
      const cy = height * (0.2 + 0.6 * rand(i * 47 + 9))
      const driftX = Math.sin(t * 0.2 + i * 1.4) * 35
      const driftY = Math.cos(t * 0.15 + i * 0.9) * 25
      const size = 150 + rand(i * 59) * 200
      // Hue slowly shifts — ink dispersing through water changes color concentration
      const hue = (220 + i * 25 + t * 3) % 360
      const alpha = 0.04 + rand(i * 23) * 0.04

      // Organic shape via asymmetric border-radius
      const br1 = 35 + Math.sin(t * 0.5 + i * 1.1) * 15
      const br2 = 45 - Math.sin(t * 0.4 + i * 0.7) * 15
      const br3 = 40 + Math.cos(t * 0.6 + i * 1.5) * 12
      const br4 = 50 - Math.cos(t * 0.35 + i * 0.9) * 12

      clouds.push(
        <div
          key={i}
          style={{
            position: 'absolute',
            left: cx + driftX - size / 2,
            top: cy + driftY - size / 2,
            width: size,
            height: size * 0.8,
            borderRadius: `${br1}% ${br2}% ${br3}% ${br4}%`,
            background: `radial-gradient(ellipse at ${40 + Math.sin(t * 0.3 + i) * 10}% ${40 + Math.cos(t * 0.25 + i) * 10}%, hsla(${hue}, 60%, 30%, ${alpha}), hsla(${(hue + 40) % 360}, 50%, 20%, ${alpha * 0.4}), transparent 70%)`,
            filter: 'blur(30px)',
            mixBlendMode: 'screen',
          }}
        />,
      )
    }

    // Subtle water surface texture — faint horizontal current lines
    const currents: React.ReactNode[] = []
    for (let c = 0; c < 3; c++) {
      const cy = height * (0.3 + c * 0.2)
      const drift = Math.sin(t * 0.3 + c * 2) * 20
      currents.push(
        <div
          key={`c${c}`}
          style={{
            position: 'absolute',
            left: -20 + drift,
            top: cy,
            width: width + 40,
            height: 1,
            background: `linear-gradient(90deg, transparent 10%, rgba(120, 140, 180, 0.04) 30%, rgba(120, 140, 180, 0.06) 50%, rgba(120, 140, 180, 0.04) 70%, transparent 90%)`,
          }}
        />,
      )
    }

    return (
      <div style={{ position: 'absolute', inset: 0, background: bgColor }}>
        {/* Deep water gradient */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: `radial-gradient(ellipse at 50% 60%, rgba(15, 25, 50, 0.0), rgba(5, 10, 25, 0.3) 70%)`,
          }}
        />
        {clouds}
        {currents}
      </div>
    )
  },

  renderWord: ({ word, color, enterProgress, holdProgress, exitProgress, phase, index, frame, width, height }: WordRenderProps) => {
    const f = frame ?? 0
    const t = f / 30

    // Ink tendrils radiating from center — visible during enter
    const tendrils: React.ReactNode[] = []
    if (phase === 'enter' || (phase === 'hold' && holdProgress < 0.2)) {
      const numTendrils = 8
      for (let i = 0; i < numTendrils; i++) {
        const angle = (i / numTendrils) * Math.PI * 2 + rand(i * 17 + index) * 0.5
        const spreadProgress = phase === 'enter' ? easeOutExpo(enterProgress) : 1
        const len = spreadProgress * (40 + rand(i * 29) * 60)
        const tendrilAlpha = phase === 'enter'
          ? Math.min(0.35, enterProgress * 0.8) * (1 - enterProgress * 0.5)
          : 0.35 * (1 - holdProgress * 5)

        if (tendrilAlpha < 0.02) continue

        const tx = Math.cos(angle) * len
        const ty = Math.sin(angle) * len
        // Tendril curves with Brownian motion
        const curl = Math.sin(t * 2 + i * 1.5) * 15

        tendrils.push(
          <div
            key={`t${i}`}
            style={{
              position: 'absolute',
              left: `calc(50% + ${tx * 0.5}px)`,
              top: `calc(50% + ${ty * 0.5}px)`,
              width: Math.abs(tx) + 4,
              height: 2.5,
              transform: `rotate(${(angle * 180) / Math.PI + curl}deg)`,
              transformOrigin: '0 50%',
              background: `linear-gradient(90deg, ${color}${Math.round(tendrilAlpha * 255).toString(16).padStart(2, '0')}, transparent)`,
              borderRadius: '2px',
              filter: 'blur(1.5px)',
            }}
          />,
        )
      }
    }

    // Per-character ink bloom
    const chars = word.split('').map((ch, ci) => {
      let charOpacity = 1
      let yOff = 0
      let xOff = 0
      let blur = 0
      let scale = 1

      if (phase === 'enter') {
        // Ink bloom: characters materialize from the ink cloud center-outward
        // Uses distance-from-center ordering (ink radiates outward)
        const centerDist = Math.abs(ci - (word.length - 1) / 2) / Math.max(1, (word.length - 1) / 2)
        const delay = centerDist * 0.4
        const p = Math.max(0, Math.min(1, (enterProgress - delay) / 0.6))
        const ep = easeOutExpo(p)

        // Start as diffuse ink blob, coalesce into letter
        blur = (1 - ep) * 7
        charOpacity = ep * 0.9 + 0.1 * p
        scale = 0.5 + ep * 0.5

        // Radial spread from center
        const spreadAngle = ((ci - (word.length - 1) / 2) / word.length) * 0.3
        xOff = (1 - ep) * spreadAngle * -40
        yOff = (1 - ep) * (rand(ci * 37 + index) - 0.5) * 30
      } else if (phase === 'hold') {
        // Brownian ink diffusion: slow, organic drift
        xOff = brownianDrift(t, ci * 3.1) * 3
        yOff = brownianDrift(t + 1.5, ci * 2.7) * 3

        // Ink concentration pulsing — as if water currents shift the ink
        charOpacity = 0.85 + Math.sin(t * 1.5 + ci * 0.6) * 0.1
        blur = Math.max(0, Math.sin(t * 0.9 + ci * 0.8) * 0.6)

        // Very subtle scale breathing
        scale = 1 + Math.sin(t * 1.1 + ci * 0.4) * 0.015
      } else {
        // Ink retraction: tendrils pull back inward, letters dissolve
        const centerDist = Math.abs(ci - (word.length - 1) / 2) / Math.max(1, (word.length - 1) / 2)
        // Outer characters dissolve first (ink retreats to center)
        const delay = (1 - centerDist) * 0.35
        const p = Math.max(0, Math.min(1, (exitProgress - delay) / 0.65))
        const ep = easeInCubic(p)

        blur = ep * 8
        charOpacity = 1 - ep
        scale = 1 - ep * 0.4

        // Pull toward center
        const pullDir = ci < (word.length - 1) / 2 ? 1 : -1
        xOff = ep * pullDir * 20
        yOff = ep * (rand(ci * 41 + index) - 0.5) * 25
      }

      // Ink color with depth variation — lighter at edges of diffusion
      const inkDepth = Math.sin(t * 2.5 + ci * 0.9) * 0.5 + 0.5
      const shadowSpread = 8 + inkDepth * 12

      return (
        <span
          key={ci}
          style={{
            display: 'inline-block',
            color,
            opacity: charOpacity,
            transform: `translate(${xOff}px, ${yOff}px) scale(${scale})`,
            filter: blur > 0.1 ? `blur(${blur}px)` : undefined,
            textShadow: `0 0 ${shadowSpread}px ${color}70, 0 0 ${shadowSpread * 2}px ${color}30, 0 2px 4px rgba(0,0,0,0.3)`,
          }}
        >
          {ch}
        </span>
      )
    })

    // Central ink impact bloom — visible during early enter
    let impactBloom: React.ReactNode = null
    if (phase === 'enter' && enterProgress < 0.5) {
      const bloomP = enterProgress / 0.5
      const bloomSize = easeOutExpo(bloomP) * 120
      impactBloom = (
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            width: bloomSize,
            height: bloomSize,
            transform: 'translate(-50%, -50%)',
            borderRadius: '50%',
            background: `radial-gradient(circle, ${color}30, ${color}10 40%, transparent 70%)`,
            opacity: 1 - bloomP * 0.7,
            filter: 'blur(8px)',
            mixBlendMode: 'screen',
            pointerEvents: 'none',
          }}
        />
      )
    }

    return (
      <div style={{ position: 'absolute', inset: 0 }}>
        {impactBloom}
        {tendrils}
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            fontFamily: "'Playfair Display', 'Georgia', serif",
            fontSize: 'clamp(44px, 12vw, 150px)',
            fontWeight: 700,
            fontStyle: 'italic',
            whiteSpace: 'nowrap',
            letterSpacing: 4,
          }}
        >
          {chars}
        </div>
      </div>
    )
  },
}

function TidalInkComponent(props: MotionGraphicProps<TidalInkConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-tidal-ink',
  title: 'Kinetic Tidal Ink',
  description: 'Ink dropped into still water — fractal tendrils bloom outward from a central impact point, swirling into letter shapes. Hold phase shows slow Brownian diffusion drift. Exit retracts tendrils inward as ink dissolves.',
  tags: ['kinetic', 'typography', 'liquid', 'ink', 'water', 'diffusion', 'bloom', 'tendril', 'organic'],
  category: 'captions',
  component: TidalInkComponent as any,
  defaultConfig: {
    words: ['INK', 'BLOOM', 'DRIFT', 'DEEP'],
    colors: ['#6366F1', '#818CF8', '#7C3AED', '#A78BFA'],
    bgColor: '#08090f',
    cycleDuration: 1.5,
  },
  configSchema: [
    { key: 'words', label: 'Words', type: 'text-array', defaultValue: ['INK', 'BLOOM', 'DRIFT', 'DEEP'], group: 'Content' },
    { key: 'colors', label: 'Colors', type: 'text-array', defaultValue: ['#6366F1', '#818CF8', '#7C3AED', '#A78BFA'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#08090f', group: 'Style' },
    { key: 'cycleDuration', label: 'Cycle Duration (s)', type: 'number', defaultValue: 1.5, min: 0.3, max: 5, group: 'Timing' },
  ],
})
