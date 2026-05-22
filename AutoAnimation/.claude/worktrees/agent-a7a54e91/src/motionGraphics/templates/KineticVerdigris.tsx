import { registerMotionGraphic } from '../registry'
import { KineticBase, type KineticBaseConfig, type KineticAnimation, type WordRenderProps, type BackgroundRenderProps } from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface VerdigrisConfig extends KineticBaseConfig {}

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

    // Copper surface with developing patina patches
    const patinaPatches: React.ReactNode[] = []
    const numPatches = 16

    for (let i = 0; i < numPatches; i++) {
      const px = width * rand(i * 31 + 11)
      const py = height * rand(i * 47 + 19)
      const size = 20 + rand(i * 19) * 70
      const alpha = 0.04 + rand(i * 29) * 0.05
      const growPhase = (t * 0.1 + rand(i * 53) * 10) % 10
      const growScale = growPhase < 3 ? easeOutQuart(growPhase / 3) : 1

      // Green-teal patina colors
      const g = 120 + rand(i * 37) * 60
      const b = 100 + rand(i * 41) * 50
      const r = 40 + rand(i * 43) * 40

      patinaPatches.push(
        <div
          key={i}
          style={{
            position: 'absolute',
            left: px - size * growScale * 0.5,
            top: py - size * growScale * 0.5,
            width: size * growScale,
            height: size * growScale * (0.6 + rand(i * 13) * 0.8),
            borderRadius: '40% 60% 45% 55% / 55% 40% 60% 45%',
            background: `radial-gradient(ellipse at ${35 + rand(i * 23) * 30}% ${35 + rand(i * 27) * 30}%, rgba(${r}, ${g}, ${b}, ${alpha}), transparent 65%)`,
          }}
        />,
      )
    }

    return (
      <div style={{ position: 'absolute', inset: 0, background: bgColor }}>
        {/* Copper base sheen */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: `radial-gradient(ellipse at ${50 + Math.sin(t * 0.1) * 8}% ${45 + Math.cos(t * 0.08) * 8}%, rgba(160, 100, 50, 0.06), transparent 60%)`,
          }}
        />
        {/* Hammered texture */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: 'repeating-radial-gradient(circle at 50% 50%, transparent 0px, transparent 8px, rgba(100,70,30,0.015) 8px, rgba(100,70,30,0.015) 9px)',
          }}
        />
        {patinaPatches}
      </div>
    )
  },

  renderWord: ({ word, color, enterProgress, holdProgress, exitProgress, phase, index, frame }: WordRenderProps) => {
    const f = frame ?? 0
    const t = f / 30

    // Patina chemical reaction particles spreading from text
    const reactionParticles: React.ReactNode[] = []
    if (phase === 'hold' || phase === 'exit') {
      const numP = 12
      const progress = phase === 'hold' ? holdProgress : 1
      for (let p = 0; p < numP; p++) {
        const pP = Math.max(0, Math.min(1, progress * 1.2 - rand(p * 31 + index) * 0.4))
        if (pP <= 0) continue
        const angle = (p / numP) * Math.PI * 2 + rand(p * 17) * 0.6
        const radius = 15 + pP * 35 + rand(p * 43) * 20
        const ppx = Math.cos(angle) * radius
        const ppy = Math.sin(angle) * radius
        const size = 4 + rand(p * 29) * 8
        const green = 130 + rand(p * 37) * 70
        const blue = 110 + rand(p * 41) * 50

        reactionParticles.push(
          <div
            key={`rp${p}`}
            style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              width: size * pP,
              height: size * pP * (0.7 + rand(p * 19) * 0.6),
              transform: `translate(calc(-50% + ${ppx}px), calc(-50% + ${ppy}px))`,
              borderRadius: '50%',
              background: `radial-gradient(ellipse, rgba(50, ${green}, ${blue}, ${pP * 0.2}), transparent 70%)`,
            }}
          />,
        )
      }
    }

    const chars = word.split('').map((ch, ci) => {
      let charOpacity = 0
      let patinaAmount = 0 // 0 = polished copper, 1 = full verdigris
      let charScale = 1
      let roughness = 0

      if (phase === 'enter') {
        // Polished copper reveal: gleaming metal appearance
        const delay = ci / (word.length + 1) * 0.35
        const p = Math.max(0, Math.min(1, (enterProgress - delay) / 0.65))
        const ep = easeOutQuart(p)

        charOpacity = ep
        charScale = 0.9 + ep * 0.1
        patinaAmount = 0
      } else if (phase === 'hold') {
        charOpacity = 1
        // Chemical reaction: copper oxidizes to green
        const oxidizeDelay = ci / (word.length + 1) * 0.2
        const oxidizeP = Math.max(0, Math.min(1, (holdProgress - oxidizeDelay) / 0.8))
        patinaAmount = easeOutQuart(oxidizeP) * 0.75
        roughness = patinaAmount * 0.5
      } else {
        // Full verdigris, texture crumbles
        const delay = ci / (word.length + 1) * 0.25
        const p = Math.max(0, Math.min(1, (exitProgress - delay) / 0.75))
        const ep = easeInCubic(p)

        charOpacity = 1 - ep * 0.7
        patinaAmount = 0.75 + ep * 0.25
        roughness = 0.5 + ep * 0.5
        charScale = 1 - ep * 0.05
      }

      // Color interpolation: polished copper (#B87333) -> dark copper -> teal-green verdigris
      const copperR = 184, copperG = 115, copperB = 51
      const midR = 100, midG = 120, midB = 90
      const verdigrisR = 55, verdigrisG = 160, verdigrisB = 140

      let textColor: string
      if (patinaAmount < 0.4) {
        const blend = patinaAmount / 0.4
        textColor = `rgb(${Math.round(copperR + (midR - copperR) * blend)}, ${Math.round(copperG + (midG - copperG) * blend)}, ${Math.round(copperB + (midB - copperB) * blend)})`
      } else {
        const blend = (patinaAmount - 0.4) / 0.6
        textColor = `rgb(${Math.round(midR + (verdigrisR - midR) * blend)}, ${Math.round(midG + (verdigrisG - midG) * blend)}, ${Math.round(midB + (verdigrisB - midB) * blend)})`
      }

      // Patina texture glow
      const patinaGlow = patinaAmount > 0.2
        ? `0 0 ${patinaAmount * 8}px rgba(50, 160, 130, ${patinaAmount * 0.3})`
        : ''

      // Copper metallic sheen for low patina
      const copperSheen = patinaAmount < 0.5
        ? `0 0 ${(1 - patinaAmount * 2) * 10}px rgba(200, 140, 60, ${(1 - patinaAmount * 2) * 0.3})`
        : ''

      // Surface roughness: slight displacement
      const roughY = roughness > 0.1 ? Math.sin(t * 0.6 + ci * 1.3) * roughness * 2 : 0

      return (
        <span
          key={ci}
          style={{
            display: 'inline-block',
            color: textColor,
            opacity: charOpacity,
            transform: `scale(${charScale}) translateY(${roughY}px)`,
            WebkitTextStroke: patinaAmount > 0.3 ? `${patinaAmount * 1.2}px rgba(40, 130, 110, ${patinaAmount * 0.25})` : undefined,
            textShadow: [patinaGlow, copperSheen, `0 1px 2px rgba(0,0,0,0.3)`].filter(Boolean).join(', '),
          }}
        >
          {ch}
        </span>
      )
    })

    return (
      <div style={{ position: 'absolute', inset: 0 }}>
        {reactionParticles}
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            fontFamily: "'Georgia', 'Garamond', serif",
            fontSize: 'clamp(44px, 12vw, 155px)',
            fontWeight: 700,
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

function VerdigrisComponent(props: MotionGraphicProps<VerdigrisConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-verdigris',
  title: 'Kinetic Verdigris',
  description: 'Copper/bronze text that develops green patina like the Statue of Liberty aging. Polished copper enters, teal-green chemical oxidation spreads during hold, verdigris particles bloom outward.',
  tags: ['kinetic', 'typography', 'decay', 'verdigris', 'copper', 'patina', 'oxidation', 'bronze'],
  category: 'captions',
  component: VerdigrisComponent as any,
  defaultConfig: {
    words: ['COPPER', 'PATINA', 'VERDE', 'AGED'],
    colors: ['#B87333', '#CD7F32', '#A0652A', '#D4944C'],
    bgColor: '#12170f',
    cycleDuration: 1.4,
  },
  configSchema: [
    { key: 'words', label: 'Words', type: 'text-array', defaultValue: ['COPPER', 'PATINA', 'VERDE', 'AGED'], group: 'Content' },
    { key: 'colors', label: 'Colors', type: 'text-array', defaultValue: ['#B87333', '#CD7F32', '#A0652A', '#D4944C'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#12170f', group: 'Style' },
    { key: 'cycleDuration', label: 'Cycle Duration (s)', type: 'number', defaultValue: 1.4, min: 0.3, max: 5, group: 'Timing' },
  ],
})
