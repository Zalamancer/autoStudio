import { registerMotionGraphic } from '../registry'
import { KineticBase, type KineticBaseConfig, type KineticAnimation, type WordRenderProps, type BackgroundRenderProps } from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface ChocolateTemperConfig extends KineticBaseConfig {}

/* --- physics-matched easings --- */

/** Molten pour: heavy viscous flow */
function easeInQuad(t: number): number {
  return t * t
}

/** Snap set: fast crystallization stop */
function easeOutExpo(t: number): number {
  return t === 1 ? 1 : 1 - Math.pow(2, -10 * t)
}

/** Gloss shimmer sweep */
function easeInOutCubic(t: number): number {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2
}

/** Deterministic pseudo-random */
function rand(s: number): number {
  const x = Math.sin(s * 127.1 + 311.7) * 43758.5453
  return x - Math.floor(x)
}

const animation: KineticAnimation = {
  renderBackground: ({ bgColor, width, height, frame, fps }: BackgroundRenderProps) => {
    const t = frame / fps

    // Layer 1: Marble slab surface — cool grey with subtle veining
    const veins: React.ReactNode[] = []
    for (let i = 0; i < 5; i++) {
      const x1 = width * rand(i * 31 + 3)
      const y1 = height * rand(i * 47 + 11)
      const angle = rand(i * 19 + 7) * 180
      const veinLen = 100 + rand(i * 37) * 200
      const alpha = 0.03 + rand(i * 23) * 0.03

      veins.push(
        <div
          key={`v${i}`}
          style={{
            position: 'absolute',
            left: x1,
            top: y1,
            width: veinLen,
            height: 1,
            background: `linear-gradient(90deg, transparent, rgba(180, 170, 160, ${alpha}) 30%, rgba(180, 170, 160, ${alpha}) 70%, transparent)`,
            transform: `rotate(${angle}deg)`,
            filter: 'blur(2px)',
          }}
        />,
      )
    }

    // Layer 2: Molten chocolate ripples — slow concentric waves
    const ripples = Array.from({ length: 4 }, (_, i) => {
      const cx = width * (0.3 + 0.4 * rand(i * 41 + 5))
      const cy = height * (0.4 + 0.3 * rand(i * 53 + 9))
      const rippleSize = 80 + (t * 20 + i * 40) % 200
      const alpha = Math.max(0, 0.08 - (rippleSize / 200) * 0.06)

      return (
        <div
          key={`r${i}`}
          style={{
            position: 'absolute',
            left: cx - rippleSize / 2,
            top: cy - rippleSize / 2,
            width: rippleSize,
            height: rippleSize * 0.4,
            borderRadius: '50%',
            border: `1px solid rgba(120, 70, 30, ${alpha})`,
            background: 'transparent',
          }}
        />
      )
    })

    // Layer 3: Warm cocoa-butter glow pulsing like a heated surface
    const glowPulse = 0.1 + Math.sin(t * 0.8) * 0.03

    return (
      <div style={{ position: 'absolute', inset: 0, background: bgColor }}>
        {veins}
        {ripples}
        {/* Warm glow from below (tempering surface heat) */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: `radial-gradient(ellipse at 50% 70%, rgba(140, 80, 30, ${glowPulse}), transparent 55%)`,
          }}
        />
        {/* Glossy surface reflection sweep */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: `linear-gradient(${110 + Math.sin(t * 0.4) * 20}deg, transparent 40%, rgba(255, 255, 255, 0.015) 50%, transparent 60%)`,
          }}
        />
      </div>
    )
  },

  renderWord: ({ word, color, enterProgress, holdProgress, exitProgress, phase, index, frame, width, height }: WordRenderProps) => {
    const f = frame ?? 0
    const t = f / 30

    const chars = word.split('').map((ch, ci) => {
      let charOpacity = 1
      let yOff = 0
      let scaleX = 1
      let scaleY = 1
      let glossAngle = 0

      if (phase === 'enter') {
        // Molten pour: thick chocolate flowing into letter molds
        const delay = ci / (word.length + 1) * 0.35
        const p = Math.max(0, Math.min(1, (enterProgress - delay) / 0.65))
        // Two-stage: slow viscous pour (0-0.6), then fast snap set (0.6-1.0)
        let ep: number
        if (p < 0.6) {
          ep = easeInQuad(p / 0.6) * 0.6 // slow, heavy pour
        } else {
          ep = 0.6 + easeOutExpo((p - 0.6) / 0.4) * 0.4 // snap crystallization
        }

        charOpacity = Math.min(1, ep * 1.5)
        // Pour from above, stretching vertically like flowing chocolate
        yOff = -(1 - ep) * 70
        scaleX = 0.7 + ep * 0.3
        scaleY = 1.3 - ep * 0.3
      } else if (phase === 'hold') {
        // Tempered hold: glossy surface with traveling specular highlight
        const glossSweep = easeInOutCubic(((t * 0.8 + ci * 0.15) % 2) / 2)
        glossAngle = glossSweep * 180

        // Subtle thermal contraction: micro-shrink as chocolate sets
        const setProgress = Math.min(1, holdProgress * 2)
        scaleX = 1 - setProgress * 0.01
        scaleY = 1 - setProgress * 0.01

        // Crystallization shimmer: glossy surface catch
        const shimmerPhase = (t * 3 + ci * 0.8) % 4
        const shimmer = shimmerPhase < 0.5 ? shimmerPhase * 2 : shimmerPhase < 1 ? 2 - shimmerPhase * 2 : 0

        return (
          <span
            key={ci}
            style={{
              display: 'inline-block',
              color,
              opacity: charOpacity,
              transform: `scaleX(${scaleX}) scaleY(${scaleY})`,
              // Rich chocolate look: deep shadow + glossy highlight bar
              textShadow: `0 3px 8px rgba(30, 15, 5, 0.6), 0 -1px 0 rgba(255, 255, 255, ${0.05 + shimmer * 0.1}), 0 0 12px rgba(140, 80, 30, 0.2)`,
              // Specular highlight via background-clip trick
              backgroundImage: `linear-gradient(${glossAngle}deg, ${color} 0%, ${color} 40%, #F5E6D0 50%, ${color} 60%, ${color} 100%)`,
              WebkitBackgroundClip: 'text',
              backgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}
          >
            {ch}
          </span>
        )
      } else {
        // Exit: chocolate cracks and splits — brittle snap break
        const delay = (word.length - 1 - ci) / (word.length + 1) * 0.3
        const p = Math.max(0, Math.min(1, (exitProgress - delay) / 0.7))
        const ep = easeOutExpo(p) // fast snap, like breaking a bar

        charOpacity = 1 - ep
        // Crack apart: even chars go left, odd go right (snap break)
        const direction = ci % 2 === 0 ? -1 : 1
        const xOff = direction * ep * 30
        yOff = ep * 15 + Math.abs(direction) * ep * 10
        // Slight rotation like a broken piece tumbling
        const rot = direction * ep * 8

        return (
          <span
            key={ci}
            style={{
              display: 'inline-block',
              color,
              opacity: charOpacity,
              transform: `translate(${xOff}px, ${yOff}px) rotate(${rot}deg)`,
              textShadow: `0 3px 8px rgba(30, 15, 5, 0.6), 0 0 12px rgba(140, 80, 30, 0.2)`,
            }}
          >
            {ch}
          </span>
        )
      }

      return (
        <span
          key={ci}
          style={{
            display: 'inline-block',
            color,
            opacity: charOpacity,
            transform: `translateY(${yOff}px) scaleX(${scaleX}) scaleY(${scaleY})`,
            transformOrigin: 'center top',
            textShadow: `0 3px 8px rgba(30, 15, 5, 0.6), 0 0 12px rgba(140, 80, 30, 0.2)`,
          }}
        >
          {ch}
        </span>
      )
    })

    // Cocoa powder particles during enter (dusting over mold)
    const cocoaDust: React.ReactNode[] = []
    if (phase === 'enter' && enterProgress > 0.3) {
      for (let d = 0; d < 10; d++) {
        const dx = width * (0.2 + 0.6 * rand(d * 31 + index))
        const dy = height * (0.3 + 0.3 * rand(d * 43 + index))
        const dSize = 2 + rand(d * 17) * 3
        const dAlpha = Math.max(0, (1 - enterProgress) * 0.3 * rand(d * 29 + index))
        const driftX = Math.sin(t * 2 + d) * 8
        const driftY = Math.cos(t * 1.5 + d * 0.7) * 5

        cocoaDust.push(
          <div
            key={`cd${d}`}
            style={{
              position: 'absolute',
              left: dx + driftX,
              top: dy + driftY,
              width: dSize,
              height: dSize,
              borderRadius: '50%',
              background: `rgba(90, 50, 20, ${dAlpha})`,
              filter: 'blur(1px)',
            }}
          />,
        )
      }
    }

    // Glossy sheen bar sweeping across text during hold
    let sheenBar: React.ReactNode = null
    if (phase === 'hold') {
      const sweepPos = ((t * 0.6) % 3) / 3 // 0..1 sweep cycle
      if (sweepPos < 0.8) {
        const barX = width * (-0.2 + sweepPos * 1.4)
        sheenBar = (
          <div
            style={{
              position: 'absolute',
              top: '30%',
              left: barX,
              width: 60,
              height: '40%',
              background: `linear-gradient(90deg, transparent, rgba(255, 240, 220, 0.06) 40%, rgba(255, 240, 220, 0.1) 50%, rgba(255, 240, 220, 0.06) 60%, transparent)`,
              filter: 'blur(8px)',
              transform: 'skewX(-15deg)',
            }}
          />
        )
      }
    }

    return (
      <div style={{ position: 'absolute', inset: 0 }}>
        {cocoaDust}
        {sheenBar}
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            fontFamily: "'Didot', 'Bodoni MT', 'Playfair Display', serif",
            fontSize: 'clamp(44px, 12vw, 155px)',
            fontWeight: 700,
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

function ChocolateTemperComponent(props: MotionGraphicProps<ChocolateTemperConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-chocolate-temper',
  title: 'Kinetic Chocolate Temper',
  description: 'Chocolate tempering process. Molten chocolate pours viscously into letter molds, snaps to a glossy crystalline set with a traveling specular highlight, and cracks apart like a broken chocolate bar on exit.',
  tags: ['kinetic', 'typography', 'food', 'chocolate', 'temper', 'mold', 'glossy', 'organic'],
  category: 'captions',
  component: ChocolateTemperComponent as any,
  defaultConfig: {
    words: ['TEMPER', 'CACAO', 'SNAP', 'GLOSS'],
    colors: ['#5C3317', '#7B4B2A', '#4A2510', '#8B5E3C'],
    bgColor: '#120B06',
    cycleDuration: 1.5,
  },
  configSchema: [
    { key: 'words', label: 'Words', type: 'text-array', defaultValue: ['TEMPER', 'CACAO', 'SNAP', 'GLOSS'], group: 'Content' },
    { key: 'colors', label: 'Colors', type: 'text-array', defaultValue: ['#5C3317', '#7B4B2A', '#4A2510', '#8B5E3C'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#120B06', group: 'Style' },
    { key: 'cycleDuration', label: 'Cycle Duration (s)', type: 'number', defaultValue: 1.5, min: 0.3, max: 5, group: 'Timing' },
  ],
})
