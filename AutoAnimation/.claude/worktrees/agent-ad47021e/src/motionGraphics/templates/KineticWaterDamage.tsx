import { registerMotionGraphic } from '../registry'
import { KineticBase, type KineticBaseConfig, type KineticAnimation, type WordRenderProps, type BackgroundRenderProps } from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface WaterDamageConfig extends KineticBaseConfig {}

function rand(s: number): number {
  const x = Math.sin(s * 127.1 + 311.7) * 43758.5453
  return x - Math.floor(x)
}

function easeOutQuart(t: number): number {
  return 1 - Math.pow(1 - t, 4)
}

function easeInQuad(t: number): number {
  return t * t
}

const animation: KineticAnimation = {
  renderBackground: ({ bgColor, width, height, frame, fps }: BackgroundRenderProps) => {
    const t = frame / fps

    // Water stain rings on paper/drywall
    const stainRings: React.ReactNode[] = []
    const numRings = 8

    for (let i = 0; i < numRings; i++) {
      const rx = width * rand(i * 31 + 7)
      const ry = height * rand(i * 47 + 13)
      const size = 30 + rand(i * 19) * 80
      const ringWidth = 2 + rand(i * 23) * 4
      const alpha = 0.04 + rand(i * 29) * 0.05
      const growPhase = (t * 0.08 + rand(i * 53) * 15) % 15
      const growScale = growPhase < 5 ? easeOutQuart(growPhase / 5) : 1

      stainRings.push(
        <div
          key={i}
          style={{
            position: 'absolute',
            left: rx - size * growScale * 0.5,
            top: ry - size * growScale * 0.5,
            width: size * growScale,
            height: size * growScale * (0.8 + rand(i * 13) * 0.4),
            borderRadius: '50%',
            border: `${ringWidth}px solid rgba(160, 130, 80, ${alpha})`,
            background: `radial-gradient(ellipse, rgba(180, 150, 90, ${alpha * 0.3}), transparent 70%)`,
          }}
        />,
      )
    }

    // Mold growth at edges
    const moldPatches: React.ReactNode[] = []
    for (let m = 0; m < 6; m++) {
      const mx = rand(m * 61 + 33) > 0.5 ? width * rand(m * 37 + 11) : (rand(m * 43) > 0.5 ? 0 : width - 20)
      const my = rand(m * 71 + 41) > 0.5 ? height * rand(m * 53 + 17) : (rand(m * 59) > 0.5 ? 0 : height - 20)
      const size = 15 + rand(m * 41) * 35
      const moldAlpha = 0.04 + rand(m * 29) * 0.04

      moldPatches.push(
        <div
          key={`mold${m}`}
          style={{
            position: 'absolute',
            left: mx,
            top: my,
            width: size,
            height: size,
            borderRadius: '50%',
            background: `radial-gradient(ellipse, rgba(40, 60, 30, ${moldAlpha}), transparent 70%)`,
          }}
        />,
      )
    }

    return (
      <div style={{ position: 'absolute', inset: 0, background: bgColor }}>
        {/* Damp surface base */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: `linear-gradient(180deg, rgba(140, 120, 80, 0.04) 0%, rgba(100, 80, 50, 0.06) 100%)`,
          }}
        />
        {stainRings}
        {moldPatches}
        {/* Paper/plaster texture */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: 'repeating-linear-gradient(90deg, transparent, transparent 4px, rgba(120,100,60,0.01) 4px, rgba(120,100,60,0.01) 5px)',
          }}
        />
      </div>
    )
  },

  renderWord: ({ word, color, enterProgress, holdProgress, exitProgress, phase, index, frame }: WordRenderProps) => {
    const f = frame ?? 0
    const t = f / 30

    // Spreading water stain around text
    const waterStains: React.ReactNode[] = []
    if (phase === 'hold' || phase === 'exit') {
      const progress = phase === 'hold' ? holdProgress : 1
      const numStains = 6
      for (let s = 0; s < numStains; s++) {
        const sP = Math.max(0, Math.min(1, progress * 1.3 - rand(s * 31 + index) * 0.5))
        if (sP <= 0) continue
        const sx = (rand(s * 37 + index) - 0.5) * 160
        const sy = (rand(s * 41 + index) - 0.5) * 80
        const size = 15 + rand(s * 43) * 30

        // Tide mark ring
        waterStains.push(
          <div
            key={`ws${s}`}
            style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              width: size * sP,
              height: size * sP * (0.7 + rand(s * 29) * 0.6),
              transform: `translate(calc(-50% + ${sx}px), calc(-50% + ${sy}px))`,
              borderRadius: '50%',
              border: `${1 + rand(s * 23) * 2}px solid rgba(170, 140, 80, ${sP * 0.15})`,
              background: `radial-gradient(ellipse, rgba(180, 150, 90, ${sP * 0.08}), transparent 60%)`,
            }}
          />,
        )
      }
    }

    const chars = word.split('').map((ch, ci) => {
      let charOpacity = 0
      let waterAmount = 0
      let buckle = 0
      let blur = 0
      let inkBleed = 0

      if (phase === 'enter') {
        // Text appears crisp and dry
        const delay = ci / (word.length + 1) * 0.4
        const p = Math.max(0, Math.min(1, (enterProgress - delay) / 0.6))
        const ep = easeOutQuart(p)

        charOpacity = ep
      } else if (phase === 'hold') {
        charOpacity = 1
        // Water damage spreads: ink bleeds, paper buckles
        const damageDelay = ci / (word.length + 1) * 0.2
        const damageP = Math.max(0, Math.min(1, (holdProgress - damageDelay) / 0.8))
        waterAmount = easeOutQuart(damageP) * 0.7
        buckle = waterAmount * 0.6
        inkBleed = waterAmount * 0.5
      } else {
        // Severe water damage: paper disintegrates
        const delay = ci / (word.length + 1) * 0.25
        const p = Math.max(0, Math.min(1, (exitProgress - delay) / 0.75))
        const ep = easeInQuad(p)

        charOpacity = 1 - ep * 0.6
        waterAmount = 0.7 + ep * 0.3
        buckle = 0.6 + ep * 0.4
        inkBleed = 0.5 + ep * 0.5
        blur = ep * 2
      }

      // Paper buckle: wavy distortion from moisture
      const buckleY = buckle > 0 ? Math.sin(t * 0.7 + ci * 1.4) * buckle * 6 : 0
      const buckleRot = buckle > 0 ? Math.sin(t * 0.5 + ci * 0.8) * buckle * 3 : 0
      const buckleScaleX = 1 + buckle * Math.sin(t * 0.4 + ci * 1.1) * 0.03

      // Ink bleed: text gets fuzzier and color seeps
      const bleedBlur = inkBleed * 2.5

      // Color shift: crisp -> sepia-stained from water
      const stainR = 160, stainG = 130, stainB = 80

      return (
        <span
          key={ci}
          style={{
            display: 'inline-block',
            color,
            opacity: charOpacity,
            transform: `translateY(${buckleY}px) rotate(${buckleRot}deg) scaleX(${buckleScaleX})`,
            filter: (blur > 0.1 || bleedBlur > 0.1) ? `blur(${Math.max(blur, bleedBlur)}px)` : undefined,
            textShadow: [
              inkBleed > 0.1 ? `0 0 ${inkBleed * 6}px rgba(${stainR}, ${stainG}, ${stainB}, ${inkBleed * 0.3})` : '',
              waterAmount > 0.3 ? `${(rand(ci * 31) - 0.5) * waterAmount * 4}px ${rand(ci * 37) * waterAmount * 3}px ${waterAmount * 4}px rgba(140, 110, 60, ${waterAmount * 0.2})` : '',
            ].filter(Boolean).join(', ') || undefined,
          }}
        >
          {ch}
        </span>
      )
    })

    // Mold growth edges during exit
    const moldEdges: React.ReactNode[] = []
    if (phase === 'exit' && exitProgress > 0.3) {
      for (let m = 0; m < 5; m++) {
        const mP = Math.max(0, (exitProgress - 0.3 - m / 5 * 0.2) / 0.5)
        if (mP <= 0) continue
        const mx = (rand(m * 37 + index) - 0.5) * 100
        const my = (rand(m * 41 + index) - 0.5) * 50
        const size = 6 + rand(m * 43) * 12

        moldEdges.push(
          <div
            key={`me${m}`}
            style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              width: size * mP,
              height: size * mP,
              transform: `translate(calc(-50% + ${mx}px), calc(-50% + ${my}px))`,
              borderRadius: '50%',
              background: `radial-gradient(ellipse, rgba(30, 50, 20, ${mP * 0.2}), transparent 70%)`,
            }}
          />,
        )
      }
    }

    return (
      <div style={{ position: 'absolute', inset: 0 }}>
        {waterStains}
        {moldEdges}
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            fontFamily: "'Georgia', 'Times New Roman', serif",
            fontSize: 'clamp(42px, 11vw, 150px)',
            fontWeight: 600,
            whiteSpace: 'nowrap',
            letterSpacing: 4,
            textTransform: 'uppercase',
          }}
        >
          {chars}
        </div>
      </div>
    )
  },
}

function WaterDamageComponent(props: MotionGraphicProps<WaterDamageConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-water-damage',
  title: 'Kinetic Water Damage',
  description: 'Text with spreading water stain rings, warped paper buckle, tide marks, and mold growth edges. Ink bleeds and paper distorts from moisture during hold, disintegrates on exit.',
  tags: ['kinetic', 'typography', 'decay', 'water', 'damage', 'stain', 'mold', 'moisture'],
  category: 'captions',
  component: WaterDamageComponent as any,
  defaultConfig: {
    words: ['WATER', 'STAIN', 'MOLD', 'DAMP'],
    colors: ['#8B7355', '#A0885A', '#7A6440', '#96804E'],
    bgColor: '#181510',
    cycleDuration: 1.5,
  },
  configSchema: [
    { key: 'words', label: 'Words', type: 'text-array', defaultValue: ['WATER', 'STAIN', 'MOLD', 'DAMP'], group: 'Content' },
    { key: 'colors', label: 'Colors', type: 'text-array', defaultValue: ['#8B7355', '#A0885A', '#7A6440', '#96804E'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#181510', group: 'Style' },
    { key: 'cycleDuration', label: 'Cycle Duration (s)', type: 'number', defaultValue: 1.5, min: 0.3, max: 5, group: 'Timing' },
  ],
})
