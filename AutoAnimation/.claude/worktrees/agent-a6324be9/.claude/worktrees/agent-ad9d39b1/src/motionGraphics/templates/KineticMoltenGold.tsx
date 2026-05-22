import { registerMotionGraphic } from '../registry'
import { KineticBase, type KineticBaseConfig, type KineticAnimation, type WordRenderProps, type BackgroundRenderProps } from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

/**
 * KineticMoltenGold — Liquid gold pouring into letter molds.
 * Enter: molten metal flows down from above, filling each letter shape.
 * Hold: surface cools with oxidation shimmer and heat glow breathing.
 * Exit: letters crack apart like cooling metal breaking its mold.
 */

interface MoltenGoldConfig extends KineticBaseConfig {}

/** Deterministic pseudo-random 0..1 from seed */
function rand(s: number): number {
  const x = Math.sin(s * 127.1 + 311.7) * 43758.5453
  return x - Math.floor(x)
}

/** Molten pour easing — fast initial pour, decelerating as mold fills */
function easeOutQuint(t: number): number {
  return 1 - Math.pow(1 - t, 5)
}

/** Crack propagation easing — slow start, sudden snap */
function easeInExpo(t: number): number {
  return t <= 0 ? 0 : Math.pow(2, 10 * t - 10)
}

/** Heat shimmer oscillation */
function heatWave(t: number, seed: number): number {
  return Math.sin(t * 3.5 + seed * 1.7) * 0.4
    + Math.sin(t * 5.1 + seed * 2.9) * 0.2
    + Math.sin(t * 7.3 + seed * 0.8) * 0.1
}

const animation: KineticAnimation = {
  renderBackground: ({ bgColor, width, height, frame, fps }: BackgroundRenderProps) => {
    const t = frame / fps

    // Forge glow: pulsing heat from below
    const forgeGlowY = 75 + Math.sin(t * 0.8) * 5
    const forgeIntensity = 0.08 + Math.sin(t * 1.2) * 0.03

    // Floating ember particles
    const embers: React.ReactNode[] = []
    for (let i = 0; i < 10; i++) {
      const ex = width * rand(i * 31 + 7)
      // Embers rise slowly
      const speed = 15 + rand(i * 17) * 20
      const ey = height - ((t * speed + rand(i * 43) * 300) % (height * 1.2))
      const drift = Math.sin(t * 0.8 + i * 1.5) * 15
      const size = 2 + rand(i * 29) * 3
      const alpha = 0.15 + rand(i * 37) * 0.2
      // Embers flicker
      const flicker = Math.sin(t * 8 + i * 3.1) > 0 ? 1 : 0.5

      embers.push(
        <div
          key={`e${i}`}
          style={{
            position: 'absolute',
            left: ex + drift,
            top: ey,
            width: size,
            height: size,
            borderRadius: '50%',
            background: `radial-gradient(circle, rgba(255, 200, 60, ${alpha * flicker}), rgba(255, 140, 30, ${alpha * 0.4 * flicker}), transparent 70%)`,
            boxShadow: `0 0 ${size * 2}px rgba(255, 160, 40, ${alpha * 0.3 * flicker})`,
          }}
        />,
      )
    }

    // Heat distortion waves — horizontal shimmering bands
    const heatBands: React.ReactNode[] = []
    for (let h = 0; h < 4; h++) {
      const hy = height * (0.25 + h * 0.15)
      const wave = Math.sin(t * 2 + h * 1.3) * 8
      heatBands.push(
        <div
          key={`h${h}`}
          style={{
            position: 'absolute',
            left: wave - 10,
            top: hy,
            width: width + 20,
            height: 2,
            background: `linear-gradient(90deg, transparent 5%, rgba(255, 180, 60, 0.03) 25%, rgba(255, 150, 40, 0.05) 50%, rgba(255, 180, 60, 0.03) 75%, transparent 95%)`,
            filter: 'blur(1px)',
          }}
        />,
      )
    }

    return (
      <div style={{ position: 'absolute', inset: 0, background: bgColor }}>
        {/* Forge underglow */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: `radial-gradient(ellipse at 50% ${forgeGlowY}%, rgba(180, 100, 20, ${forgeIntensity}), rgba(120, 60, 10, ${forgeIntensity * 0.4}) 40%, transparent 65%)`,
          }}
        />
        {/* Crucible rim highlight */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: `linear-gradient(180deg, rgba(255, 200, 80, 0.02) 0%, transparent 20%, transparent 80%, rgba(200, 120, 30, 0.04) 100%)`,
          }}
        />
        {heatBands}
        {embers}
      </div>
    )
  },

  renderWord: ({ word, color, enterProgress, holdProgress, exitProgress, phase, index, frame, width, height }: WordRenderProps) => {
    const f = frame ?? 0
    const t = f / 30

    const chars = word.split('').map((ch, ci) => {
      let charOpacity = 1
      let yOff = 0
      let xOff = 0
      let scaleX = 1
      let scaleY = 1
      let clipPercent = 100
      let rotation = 0

      if (phase === 'enter') {
        // Molten gold pours from top into letter molds: top-down clip reveal
        const delay = ci / (word.length + 1) * 0.35
        const p = Math.max(0, Math.min(1, (enterProgress - delay) / 0.65))
        const ep = easeOutQuint(p)

        // Pour fill from top
        clipPercent = ep * 100
        charOpacity = Math.min(1, ep * 1.3)

        // Slight overflow bulge as mold fills
        scaleX = 1 + (1 - ep) * 0.08
        scaleY = 1 + Math.sin(ep * Math.PI) * 0.06

        // Heat shimmer displacement during pour
        xOff = heatWave(t, ci) * (1 - ep) * 4
        yOff = -((1 - ep) * 3)
      } else if (phase === 'hold') {
        // Cooling phase: surface oxidation shimmer + heat glow breathing
        // Subtle heat distortion
        xOff = heatWave(t, ci * 2.1) * 1.5
        yOff = heatWave(t + 0.5, ci * 1.7) * 1.5

        // Cooling contraction: very slight scale pulse
        const coolPulse = Math.sin(t * 1.8 + ci * 0.5) * 0.5 + 0.5
        scaleX = 1 + coolPulse * 0.01
        scaleY = 1 - coolPulse * 0.008

        // Brightness pulse — metal glowing then cooling
        charOpacity = 0.9 + Math.sin(t * 2.5 + ci * 0.6) * 0.08
      } else {
        // Mold crack: letters break apart at seams, fragments separate
        const delay = ci / (word.length + 1) * 0.2
        const p = Math.max(0, Math.min(1, (exitProgress - delay) / 0.8))
        const ep = easeInExpo(p)

        charOpacity = 1 - ep * 0.9
        // Each character cracks in a pseudo-random direction
        const crackAngle = (rand(ci * 41 + index * 7) - 0.5) * 2
        xOff = crackAngle * ep * 40
        yOff = ep * 30 + ep * ep * 20
        rotation = crackAngle * ep * 15
        scaleX = 1 + ep * 0.1
        scaleY = 1 - ep * 0.15
      }

      // Gold color stages: white-hot during pour -> bright gold -> warm oxidized gold
      const pourHeat = phase === 'enter' ? Math.max(0, 1 - enterProgress * 2) : 0
      const coolPhase = phase === 'hold' ? holdProgress : phase === 'exit' ? 1 : 0
      // Interpolate between hot-white, molten-gold, and cooled-gold
      let charColor = color
      if (pourHeat > 0.3) {
        // White-hot: blending toward white
        charColor = '#FFF5E0'
      } else if (coolPhase > 0.5) {
        // Cooled oxidation: darker, more amber
        charColor = color
      }

      // Oxidation shimmer — per-character color shift during hold
      const shimmerHue = phase === 'hold'
        ? Math.sin(t * 3 + ci * 0.8) * 10
        : 0

      // Pour glow: intense during enter, fading during hold
      const glowIntensity = phase === 'enter'
        ? 20 + (1 - enterProgress) * 15
        : phase === 'hold'
          ? 15 - holdProgress * 5
          : 10 * (1 - exitProgress)

      return (
        <span
          key={ci}
          style={{
            display: 'inline-block',
            color: charColor,
            opacity: charOpacity,
            transform: `translate(${xOff}px, ${yOff}px) scaleX(${scaleX}) scaleY(${scaleY}) rotate(${rotation}deg)`,
            transformOrigin: 'center bottom',
            clipPath: phase === 'enter' ? `inset(${100 - clipPercent}% 0 0 0)` : undefined,
            filter: shimmerHue !== 0 ? `hue-rotate(${shimmerHue}deg)` : undefined,
            textShadow: `0 0 ${glowIntensity}px rgba(255, 180, 60, 0.6), 0 0 ${glowIntensity * 2}px rgba(255, 140, 30, 0.3), 0 2px 4px rgba(0,0,0,0.4)`,
          }}
        >
          {ch}
        </span>
      )
    })

    // Pour stream from above during enter — the molten gold source
    let pourStream: React.ReactNode = null
    if (phase === 'enter' && enterProgress < 0.7) {
      const streamAlpha = Math.min(0.6, enterProgress * 2) * (1 - enterProgress * 1.2)
      if (streamAlpha > 0.02) {
        const streamWidth = 6 + Math.sin(t * 6) * 2
        pourStream = (
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: '50%',
              width: streamWidth,
              height: '45%',
              transform: 'translateX(-50%)',
              background: `linear-gradient(180deg, rgba(255, 220, 100, ${streamAlpha * 0.3}), rgba(255, 180, 60, ${streamAlpha}), rgba(255, 160, 40, ${streamAlpha * 0.6}))`,
              borderRadius: `${streamWidth}px`,
              filter: 'blur(2px)',
              pointerEvents: 'none',
            }}
          />
        )
      }
    }

    // Crack lines during exit — surface fracture pattern
    const cracks: React.ReactNode[] = []
    if (phase === 'exit' && exitProgress > 0.15) {
      for (let c = 0; c < 5; c++) {
        const cx = (rand(c * 31 + index * 13) - 0.5) * word.length * 30
        const cy = (rand(c * 47 + index * 19) - 0.5) * 20
        const cLen = 10 + rand(c * 23) * 25
        const cAngle = rand(c * 59 + index * 7) * 180
        const cAlpha = Math.min(0.4, (exitProgress - 0.15) * 0.8)

        cracks.push(
          <div
            key={`cr${c}`}
            style={{
              position: 'absolute',
              left: `calc(50% + ${cx}px)`,
              top: `calc(50% + ${cy}px)`,
              width: cLen,
              height: 1.5,
              transform: `rotate(${cAngle}deg)`,
              background: `linear-gradient(90deg, transparent, rgba(255, 200, 80, ${cAlpha}), rgba(255, 100, 20, ${cAlpha * 0.6}), transparent)`,
              filter: 'blur(0.5px)',
              pointerEvents: 'none',
            }}
          />,
        )
      }
    }

    return (
      <div style={{ position: 'absolute', inset: 0 }}>
        {pourStream}
        {cracks}
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            fontFamily: "'Cinzel', 'Trajan Pro', 'Times New Roman', serif",
            fontSize: 'clamp(44px, 12vw, 150px)',
            fontWeight: 900,
            whiteSpace: 'nowrap',
            letterSpacing: 5,
            textTransform: 'uppercase',
          }}
        >
          {chars}
        </div>
      </div>
    )
  },
}

function MoltenGoldComponent(props: MotionGraphicProps<MoltenGoldConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-molten-gold',
  title: 'Kinetic Molten Gold',
  description: 'Liquid gold pours from above into letter molds. Characters fill top-down with white-hot metal that cools to oxidized gold with heat shimmer. Exit cracks the mold apart with fracture lines and falling fragments.',
  tags: ['kinetic', 'typography', 'liquid', 'gold', 'molten', 'metal', 'pour', 'forge', 'luxury'],
  category: 'captions',
  component: MoltenGoldComponent as any,
  defaultConfig: {
    words: ['GOLD', 'FORGE', 'MELT', 'POUR'],
    colors: ['#F59E0B', '#FBBF24', '#D97706', '#FCD34D'],
    bgColor: '#0f0a05',
    cycleDuration: 1.5,
  },
  configSchema: [
    { key: 'words', label: 'Words', type: 'text-array', defaultValue: ['GOLD', 'FORGE', 'MELT', 'POUR'], group: 'Content' },
    { key: 'colors', label: 'Colors', type: 'text-array', defaultValue: ['#F59E0B', '#FBBF24', '#D97706', '#FCD34D'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#0f0a05', group: 'Style' },
    { key: 'cycleDuration', label: 'Cycle Duration (s)', type: 'number', defaultValue: 1.5, min: 0.3, max: 5, group: 'Timing' },
  ],
})
