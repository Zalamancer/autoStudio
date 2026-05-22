import { registerMotionGraphic } from '../registry'
import {
  KineticBase,
  type KineticBaseConfig,
  type KineticAnimation,
  type WordRenderProps,
  type BackgroundRenderProps,
} from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

/**
 * KineticDustDevil — A localized spinning dust vortex assembles characters.
 *
 * Metaphor: A dust devil (whirlwind) on arid desert ground. Characters orbit in
 * from the spinning vortex, spiralling inward to their final positions on enter.
 * Hold phase: characters vibrate/oscillate in the turbulent wind, with dust
 * particles swirling around them. Exit: the vortex expels characters outward
 * in a centrifugal spiral, the dust devil dissipating.
 */

interface DustDevilConfig extends KineticBaseConfig {}

function rand(s: number): number {
  const x = Math.sin(s * 127.1 + 311.7) * 43758.5453
  return x - Math.floor(x)
}

// Spiral easing — fast spin that decelerates into landing
function easeOutBack(t: number): number {
  const c1 = 1.70158
  const c3 = c1 + 1
  return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2)
}

function easeInQuad(t: number): number {
  return t * t
}

function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3)
}

const animation: KineticAnimation = {
  renderBackground: ({ bgColor, width, height, frame, fps }: BackgroundRenderProps) => {
    const t = frame / fps

    // Layer 1: Desert ground gradient
    const heatWave = Math.sin(t * 0.4) * 3

    // Layer 2: Ambient dust particles drifting in wind
    const ambientDust: React.ReactNode[] = []
    for (let i = 0; i < 20; i++) {
      const dSpeed = 30 + rand(i * 29) * 60
      const dx = ((t * dSpeed + rand(i * 43) * width * 2) % (width * 1.4)) - width * 0.2
      const dy = height * (0.3 + 0.5 * rand(i * 37))
      const driftY = Math.sin(t * 0.8 + i * 1.2) * 15
      const size = 2 + rand(i * 17) * 4
      const alpha = 0.06 + rand(i * 53) * 0.1

      ambientDust.push(
        <div
          key={i}
          style={{
            position: 'absolute',
            left: dx,
            top: dy + driftY,
            width: size,
            height: size,
            borderRadius: '50%',
            background: `rgba(180, 150, 100, ${alpha})`,
            filter: 'blur(1px)',
          }}
        />,
      )
    }

    // Layer 3: Vortex funnel silhouette at center — spinning dust column
    const vortexAngle = t * 120 // degrees rotation
    const vortexAlpha = 0.06 + Math.sin(t * 0.5) * 0.02
    const vortexLines: React.ReactNode[] = []
    for (let v = 0; v < 8; v++) {
      const angleOffset = (v / 8) * 360 + vortexAngle
      const radians = (angleOffset * Math.PI) / 180
      const innerR = 30
      const outerR = 80 + Math.sin(t * 0.6 + v) * 15
      const x1 = width / 2 + Math.cos(radians) * innerR
      const y1 = height / 2 + Math.sin(radians) * innerR * 0.4 // squished vertically
      const x2 = width / 2 + Math.cos(radians + 0.3) * outerR
      const y2 = height / 2 + Math.sin(radians + 0.3) * outerR * 0.4
      const lineAlpha = vortexAlpha * (0.5 + rand(v * 31) * 0.5)

      vortexLines.push(
        <line
          key={v}
          x1={x1}
          y1={y1}
          x2={x2}
          y2={y2}
          stroke={`rgba(170, 140, 90, ${lineAlpha})`}
          strokeWidth={2 + rand(v * 13) * 2}
          strokeLinecap="round"
        />,
      )
    }

    return (
      <div style={{ position: 'absolute', inset: 0, background: bgColor }}>
        {/* Arid desert sky-to-ground gradient */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: `linear-gradient(180deg,
              rgba(60, 45, 25, 0.15) 0%,
              rgba(80, 60, 35, 0.1) ${40 + heatWave}%,
              rgba(100, 75, 40, 0.12) 70%,
              rgba(50, 35, 18, 0.2) 100%)`,
          }}
        />
        {/* Heat shimmer band */}
        <div
          style={{
            position: 'absolute',
            left: '-5%',
            right: '-5%',
            top: '45%',
            height: '10%',
            background: `linear-gradient(180deg, transparent, rgba(140, 110, 60, 0.04), transparent)`,
            transform: `scaleX(${1 + Math.sin(t * 1.5) * 0.02})`,
            mixBlendMode: 'screen',
          }}
        />
        <div style={{ position: 'absolute', inset: 0, mixBlendMode: 'screen' }}>{ambientDust}</div>
        {/* Vortex funnel */}
        <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none' }}>
          {vortexLines}
        </svg>
      </div>
    )
  },

  renderWord: ({
    word,
    color,
    enterProgress,
    holdProgress,
    exitProgress,
    phase,
    index,
    frame,
    width,
    height,
  }: WordRenderProps) => {
    const f = frame ?? 0
    const t = f / 30

    // Swirling dust particles around the text
    const dustParticles: React.ReactNode[] = []
    const numDust = 16

    for (let d = 0; d < numDust; d++) {
      let particleAlpha = 0
      const baseAngle = (d / numDust) * Math.PI * 2 + rand(d * 41 + index) * 0.5
      let radius = 0
      let spinSpeed = 0

      if (phase === 'enter') {
        particleAlpha = Math.min(0.4, enterProgress * 0.6) * (1 - enterProgress * 0.5)
        radius = 120 * (1 - enterProgress) + 40
        spinSpeed = 8 * (1 - enterProgress * 0.6)
      } else if (phase === 'hold') {
        particleAlpha = 0.15 + Math.sin(t * 2 + d * 0.5) * 0.08
        radius = 55 + Math.sin(t * 1.5 + d * 0.7) * 15
        spinSpeed = 3
      } else {
        particleAlpha = 0.2 * (1 - exitProgress)
        radius = 50 + exitProgress * 100
        spinSpeed = 4 + exitProgress * 10
      }

      const spinAngle = baseAngle + t * spinSpeed
      const px = Math.cos(spinAngle) * radius
      const py = Math.sin(spinAngle) * radius * 0.5 // flattened orbit
      const size = 3 + rand(d * 23) * 5

      if (particleAlpha > 0.01) {
        dustParticles.push(
          <div
            key={`dp${d}`}
            style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              width: size,
              height: size,
              borderRadius: rand(d * 7) > 0.3 ? '50%' : '1px',
              transform: `translate(calc(-50% + ${px}px), calc(-50% + ${py}px))`,
              background: `rgba(180, 150, 100, ${particleAlpha})`,
              filter: `blur(${1 + rand(d * 17)}px)`,
            }}
          />,
        )
      }
    }

    const chars = word.split('').map((ch, ci) => {
      let charOpacity = 0
      let xOff = 0
      let yOff = 0
      let rotation = 0
      let charScale = 1
      let blur = 0

      // Each character's angular position in the vortex
      const charAngle = (ci / word.length) * Math.PI * 2 + rand(ci * 29 + index) * 0.8

      if (phase === 'enter') {
        // Spiral inward — characters orbit in from wide radius to final position
        const delay = (ci / (word.length + 1)) * 0.35
        const p = Math.max(0, Math.min(1, (enterProgress - delay) / 0.65))
        const ep = easeOutBack(p)

        charOpacity = Math.min(1, p * 3)

        // Spiral path: from distant orbit to center
        const orbitRadius = (1 - ep) * 120
        const spinAngle = charAngle + (1 - ep) * Math.PI * 3 // 1.5 full rotations
        xOff = Math.cos(spinAngle) * orbitRadius
        yOff = Math.sin(spinAngle) * orbitRadius * 0.5

        // Spinning character
        rotation = (1 - ep) * 360 * (ci % 2 === 0 ? 1 : -1)
        charScale = 0.5 + ep * 0.5
        blur = (1 - ep) * 4
      } else if (phase === 'hold') {
        charOpacity = 1
        // Turbulent vibration — each character jitters in the wind
        const turbFreq = 3 + ci * 0.5
        const turbAmp = 2.5 * Math.exp(-holdProgress * 2) + 0.8
        xOff = Math.sin(t * turbFreq + ci * 1.3) * turbAmp
        yOff = Math.cos(t * turbFreq * 0.8 + ci * 0.9) * turbAmp * 0.7
        rotation = Math.sin(t * 2.5 + ci * 0.6) * (1.5 + Math.exp(-holdProgress * 2) * 2)
        // Grit shimmer
        charScale = 1 + Math.sin(t * 4 + ci * 0.8) * 0.01
      } else {
        // Centrifugal expulsion — vortex flings characters outward
        const delay = (ci / (word.length + 1)) * 0.3
        const p = Math.max(0, Math.min(1, (exitProgress - delay) / 0.7))
        const ep = easeInQuad(p)

        charOpacity = 1 - easeOutCubic(p)

        // Fly outward in spiral
        const expelRadius = ep * 150
        const spinAngle = charAngle + ep * Math.PI * 2.5
        xOff = Math.cos(spinAngle) * expelRadius
        yOff = Math.sin(spinAngle) * expelRadius * 0.5

        rotation = ep * 360 * (ci % 2 === 0 ? -1 : 1)
        charScale = 1 - ep * 0.4
        blur = ep * 5
      }

      return (
        <span
          key={ci}
          style={{
            display: 'inline-block',
            color,
            opacity: charOpacity,
            transform: `translate(${xOff}px, ${yOff}px) rotate(${rotation}deg) scale(${charScale})`,
            filter: blur > 0.1 ? `blur(${blur}px)` : undefined,
            textShadow: `
              0 0 6px rgba(160, 130, 80, 0.3),
              2px 2px 4px rgba(0, 0, 0, 0.4),
              0 0 15px rgba(140, 110, 60, 0.15)
            `,
          }}
        >
          {ch}
        </span>
      )
    })

    // Vortex trail arcs during enter/exit
    const vortexArcs: React.ReactNode[] = []
    if (phase === 'enter' || phase === 'exit') {
      const progress = phase === 'enter' ? enterProgress : exitProgress
      const arcCount = 5
      for (let a = 0; a < arcCount; a++) {
        const arcP = Math.max(0, Math.min(1, (progress - (a / arcCount) * 0.2) / 0.8))
        if (arcP <= 0.01 || arcP >= 0.99) continue
        const radius = phase === 'enter' ? 120 * (1 - arcP) + 30 : 30 + arcP * 120
        const startAngle = t * 5 + a * 1.2
        const arcLen = 0.8 + rand(a * 31) * 0.5

        const x1 = Math.cos(startAngle) * radius
        const y1 = Math.sin(startAngle) * radius * 0.5
        const x2 = Math.cos(startAngle + arcLen) * radius
        const y2 = Math.sin(startAngle + arcLen) * radius * 0.5
        const mx = Math.cos(startAngle + arcLen / 2) * radius * 1.1
        const my = Math.sin(startAngle + arcLen / 2) * radius * 0.55

        const trailAlpha = (phase === 'enter' ? 1 - arcP : 1 - arcP) * 0.2
        vortexArcs.push(
          <svg
            key={`va${a}`}
            style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              width: 0,
              height: 0,
              overflow: 'visible',
              pointerEvents: 'none',
            }}
          >
            <path
              d={`M ${x1} ${y1} Q ${mx} ${my} ${x2} ${y2}`}
              fill="none"
              stroke={`rgba(170, 140, 90, ${trailAlpha})`}
              strokeWidth={2}
              strokeLinecap="round"
            />
          </svg>,
        )
      }
    }

    return (
      <div style={{ position: 'absolute', inset: 0 }}>
        {vortexArcs}
        {dustParticles}
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            fontFamily: "'Trebuchet MS', 'Arial Narrow', sans-serif",
            fontSize: 'clamp(44px, 12vw, 155px)',
            fontWeight: 800,
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

function DustDevilComponent(props: MotionGraphicProps<DustDevilConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-dust-devil',
  title: 'Kinetic Dust Devil',
  description:
    'A spinning desert dust devil vortex assembles characters from a centripetal spiral. Each letter orbits inward through 1.5 rotations to land in place, vibrates in turbulent wind during hold, then gets flung outward by centrifugal force on exit. Swirling dust particles and vortex arc trails surround the text.',
  tags: ['kinetic', 'typography', 'weather', 'dust-devil', 'vortex', 'desert', 'wind', 'atmospheric', 'spiral'],
  category: 'captions',
  component: DustDevilComponent as any,
  defaultConfig: {
    words: ['DUST', 'DEVIL', 'VORTEX', 'WHIRL'],
    colors: ['#C8A060', '#A88040', '#D8B878', '#907030'],
    bgColor: '#12100a',
    cycleDuration: 1.4,
  },
  configSchema: [
    {
      key: 'words',
      label: 'Words',
      type: 'text-array',
      defaultValue: ['DUST', 'DEVIL', 'VORTEX', 'WHIRL'],
      group: 'Content',
    },
    {
      key: 'colors',
      label: 'Colors',
      type: 'text-array',
      defaultValue: ['#C8A060', '#A88040', '#D8B878', '#907030'],
      group: 'Style',
    },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#12100a', group: 'Style' },
    {
      key: 'cycleDuration',
      label: 'Cycle Duration (s)',
      type: 'number',
      defaultValue: 1.4,
      min: 0.3,
      max: 5,
      group: 'Timing',
    },
  ],
})
