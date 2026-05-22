import { registerMotionGraphic } from '../registry'
import { KineticBase, type KineticBaseConfig, type KineticAnimation, type WordRenderProps, type BackgroundRenderProps } from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface RustCorrosionConfig extends KineticBaseConfig {}

function rand(s: number): number {
  const x = Math.sin(s * 127.1 + 311.7) * 43758.5453
  return x - Math.floor(x)
}

function easeOutQuart(t: number): number {
  return 1 - Math.pow(1 - t, 4)
}

function easeInCubic(t: number): number {
  return t * t * t
}

const animation: KineticAnimation = {
  renderBackground: ({ bgColor, width, height, frame, fps }: BackgroundRenderProps) => {
    const t = frame / fps

    // Pitted metal surface with rust bloom patches
    const rustPatches: React.ReactNode[] = []
    const numPatches = 18

    for (let i = 0; i < numPatches; i++) {
      const px = width * rand(i * 31 + 5)
      const py = height * rand(i * 47 + 17)
      const size = 20 + rand(i * 19) * 60
      const alpha = 0.04 + rand(i * 29) * 0.06
      // Slow rust spread over time
      const growPhase = (t * 0.15 + rand(i * 53) * 8) % 8
      const growScale = growPhase < 3 ? easeOutQuart(growPhase / 3) : 1
      const r = 120 + rand(i * 37) * 80
      const g = 50 + rand(i * 41) * 40
      const b = 10 + rand(i * 43) * 20

      rustPatches.push(
        <div
          key={i}
          style={{
            position: 'absolute',
            left: px - size * growScale * 0.5,
            top: py - size * growScale * 0.5,
            width: size * growScale,
            height: size * growScale * (0.7 + rand(i * 13) * 0.6),
            borderRadius: '45% 55% 50% 50% / 55% 45% 55% 45%',
            background: `radial-gradient(ellipse at ${40 + rand(i * 23) * 20}% ${40 + rand(i * 27) * 20}%, rgba(${r}, ${g}, ${b}, ${alpha}), transparent 70%)`,
          }}
        />,
      )
    }

    // Fine metal pitting texture
    const pits: React.ReactNode[] = []
    for (let p = 0; p < 12; p++) {
      const pitX = width * rand(p * 61 + 33)
      const pitY = height * rand(p * 73 + 41)
      const pitSize = 2 + rand(p * 17) * 4
      pits.push(
        <div
          key={`pit${p}`}
          style={{
            position: 'absolute',
            left: pitX,
            top: pitY,
            width: pitSize,
            height: pitSize,
            borderRadius: '50%',
            background: `rgba(60, 30, 10, ${0.15 + rand(p * 29) * 0.1})`,
            boxShadow: `0 0 ${pitSize}px rgba(80, 40, 15, 0.1)`,
          }}
        />,
      )
    }

    return (
      <div style={{ position: 'absolute', inset: 0, background: bgColor }}>
        {/* Brushed metal base gradient */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: `linear-gradient(170deg, rgba(80, 70, 60, 0.08) 0%, rgba(50, 40, 30, 0.12) 100%)`,
          }}
        />
        {rustPatches}
        {pits}
        {/* Subtle horizontal brush lines */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: 'repeating-linear-gradient(0deg, transparent, transparent 3px, rgba(100,80,60,0.015) 3px, rgba(100,80,60,0.015) 4px)',
          }}
        />
      </div>
    )
  },

  renderWord: ({ word, color, enterProgress, holdProgress, exitProgress, phase, index, frame, width }: WordRenderProps) => {
    const f = frame ?? 0
    const t = f / 30

    // Rust spread particles that bloom around the text during hold/exit
    const rustParticles: React.ReactNode[] = []
    if (phase === 'hold' || phase === 'exit') {
      const numRust = 14
      const progress = phase === 'hold' ? holdProgress : 1
      for (let r = 0; r < numRust; r++) {
        const rp = Math.max(0, Math.min(1, progress * 1.2 - rand(r * 31 + index) * 0.4))
        if (rp <= 0) continue
        const angle = (r / numRust) * Math.PI * 2 + rand(r * 17) * 0.8
        const radius = 20 + rp * 40 + rand(r * 43) * 25
        const rpx = Math.cos(angle) * radius
        const rpy = Math.sin(angle) * radius
        const size = 4 + rand(r * 29) * 10
        const rustR = 150 + rand(r * 37) * 80
        const rustG = 60 + rand(r * 41) * 30
        const rustB = 10 + rand(r * 47) * 15

        rustParticles.push(
          <div
            key={`rp${r}`}
            style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              width: size,
              height: size * (0.6 + rand(r * 19) * 0.8),
              transform: `translate(calc(-50% + ${rpx}px), calc(-50% + ${rpy}px)) rotate(${rand(r * 53) * 360}deg)`,
              borderRadius: '40% 60% 50% 50% / 50% 40% 60% 50%',
              background: `rgba(${rustR}, ${rustG}, ${rustB}, ${(1 - rp * 0.3) * 0.3})`,
              filter: 'blur(1px)',
            }}
          />,
        )
      }
    }

    const chars = word.split('').map((ch, ci) => {
      let charOpacity = 0
      let rustAmount = 0 // 0 = pristine metal, 1 = fully corroded
      let flakeOffset = 0
      let charScale = 1

      if (phase === 'enter') {
        // Metal forging: text appears as clean, shiny metal
        const delay = ci / (word.length + 1) * 0.35
        const p = Math.max(0, Math.min(1, (enterProgress - delay) / 0.65))
        const ep = easeOutQuart(p)

        charOpacity = ep
        charScale = 0.85 + ep * 0.15
        rustAmount = 0
      } else if (phase === 'hold') {
        charOpacity = 1
        // Rust gradually spreads across the text during hold
        const rustDelay = ci / (word.length + 1) * 0.3
        const rustP = Math.max(0, Math.min(1, (holdProgress - rustDelay) / 0.7))
        rustAmount = easeOutQuart(rustP) * 0.7
        charScale = 1 - rustAmount * 0.02
      } else {
        // Corrosion accelerates, oxide flakes off
        const delay = ci / (word.length + 1) * 0.25
        const p = Math.max(0, Math.min(1, (exitProgress - delay) / 0.75))
        const ep = easeInCubic(p)

        charOpacity = 1 - ep * 0.8
        rustAmount = 0.7 + ep * 0.3
        // Flaking: random chars shift as oxide peels
        flakeOffset = ep * (rand(ci * 31 + index) - 0.5) * 12
        charScale = 1 - ep * 0.1
      }

      // Color interpolation: clean metal -> orange rust -> dark brown decay
      const metalColor = color
      const rustMidR = 180 + rand(ci * 17) * 40
      const rustMidG = 80 + rand(ci * 23) * 30
      const rustMidB = 20 + rand(ci * 29) * 15
      const rustDarkR = 80 + rand(ci * 37) * 30
      const rustDarkG = 35 + rand(ci * 41) * 15
      const rustDarkB = 10

      let textColor: string
      let strokeColor: string
      if (rustAmount < 0.4) {
        // Metal to orange rust
        const blend = rustAmount / 0.4
        textColor = metalColor
        strokeColor = `rgba(${Math.round(rustMidR * blend)}, ${Math.round(rustMidG * blend)}, ${Math.round(rustMidB * blend)}, ${blend * 0.6})`
      } else {
        // Orange rust to dark brown
        const blend = (rustAmount - 0.4) / 0.6
        textColor = `rgb(${Math.round(rustMidR * (1 - blend) + rustDarkR * blend)}, ${Math.round(rustMidG * (1 - blend) + rustDarkG * blend)}, ${Math.round(rustMidB * (1 - blend) + rustDarkB * blend)})`
        strokeColor = `rgba(${rustDarkR}, ${rustDarkG}, ${rustDarkB}, ${0.4 + blend * 0.3})`
      }

      // Rough pitting texture via shadow
      const pitShadow = rustAmount > 0.2
        ? `inset 0 0 ${rustAmount * 3}px rgba(40, 20, 5, ${rustAmount * 0.4})`
        : 'none'

      return (
        <span
          key={ci}
          style={{
            display: 'inline-block',
            color: textColor,
            opacity: charOpacity,
            transform: `scale(${charScale}) translateY(${flakeOffset}px)`,
            WebkitTextStroke: rustAmount > 0.1 ? `${rustAmount * 1.5}px ${strokeColor}` : undefined,
            textShadow: [
              `0 0 ${4 + rustAmount * 6}px rgba(160, 70, 15, ${rustAmount * 0.4})`,
              `0 1px ${2 + rustAmount * 3}px rgba(80, 30, 5, ${rustAmount * 0.3})`,
              rustAmount > 0.5 ? `${(rand(ci * 53) - 0.5) * 3}px ${rand(ci * 59) * 2}px 4px rgba(40, 15, 0, 0.25)` : '',
            ].filter(Boolean).join(', '),
          }}
        >
          {ch}
        </span>
      )
    })

    // Falling oxide flakes during exit
    const flakes: React.ReactNode[] = []
    if (phase === 'exit') {
      for (let fl = 0; fl < 10; fl++) {
        const flP = Math.max(0, Math.min(1, (exitProgress - fl / 10 * 0.3) / 0.7))
        if (flP <= 0) continue
        const flx = (rand(fl * 37 + index) - 0.5) * 120
        const fly = flP * 60 + rand(fl * 19) * 20
        const flSize = 3 + rand(fl * 23) * 6
        const flR = 130 + rand(fl * 41) * 70
        const flG = 50 + rand(fl * 43) * 30

        flakes.push(
          <div
            key={`fl${fl}`}
            style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              width: flSize,
              height: flSize * 0.6,
              transform: `translate(calc(-50% + ${flx}px), calc(-50% + ${fly}px)) rotate(${flP * 180 + rand(fl * 29) * 90}deg)`,
              background: `rgba(${flR}, ${flG}, 15, ${(1 - flP) * 0.5})`,
              borderRadius: '20% 40% 30% 50%',
            }}
          />,
        )
      }
    }

    return (
      <div style={{ position: 'absolute', inset: 0 }}>
        {rustParticles}
        {flakes}
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            fontFamily: "Impact, 'Arial Black', sans-serif",
            fontSize: 'clamp(44px, 12vw, 155px)',
            fontWeight: 900,
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

function RustCorrosionComponent(props: MotionGraphicProps<RustCorrosionConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-rust-corrosion',
  title: 'Kinetic Rust Corrosion',
  description: 'Text appears as clean metal then corrodes with spreading orange-brown rust, metal pitting, flaking oxide, and iron decay. Rust bloom particles spread during hold, oxide flakes fall on exit.',
  tags: ['kinetic', 'typography', 'decay', 'rust', 'corrosion', 'metal', 'oxidation', 'aging'],
  category: 'captions',
  component: RustCorrosionComponent as any,
  defaultConfig: {
    words: ['RUST', 'IRON', 'DECAY', 'OXIDE'],
    colors: ['#D4A574', '#C87533', '#B8860B', '#A0522D'],
    bgColor: '#1a1510',
    cycleDuration: 1.4,
  },
  configSchema: [
    { key: 'words', label: 'Words', type: 'text-array', defaultValue: ['RUST', 'IRON', 'DECAY', 'OXIDE'], group: 'Content' },
    { key: 'colors', label: 'Colors', type: 'text-array', defaultValue: ['#D4A574', '#C87533', '#B8860B', '#A0522D'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#1a1510', group: 'Style' },
    { key: 'cycleDuration', label: 'Cycle Duration (s)', type: 'number', defaultValue: 1.4, min: 0.3, max: 5, group: 'Timing' },
  ],
})
