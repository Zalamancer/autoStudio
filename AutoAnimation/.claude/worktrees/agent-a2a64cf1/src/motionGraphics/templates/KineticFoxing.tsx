import { registerMotionGraphic } from '../registry'
import { KineticBase, type KineticBaseConfig, type KineticAnimation, type WordRenderProps, type BackgroundRenderProps } from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface FoxingConfig extends KineticBaseConfig {}

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

    // Paper texture with foxing spots
    const foxingSpots: React.ReactNode[] = []
    const numSpots = 25

    for (let i = 0; i < numSpots; i++) {
      const fx = width * rand(i * 31 + 7)
      const fy = height * rand(i * 47 + 13)
      const size = 5 + rand(i * 19) * 25
      const alpha = 0.03 + rand(i * 29) * 0.06
      // Spots slowly appear over time
      const spotPhase = (t * 0.12 + rand(i * 53) * 12) % 12
      const spotScale = spotPhase < 4 ? easeOutQuart(spotPhase / 4) : 1
      const brownR = 160 + rand(i * 37) * 50
      const brownG = 110 + rand(i * 41) * 30
      const brownB = 50 + rand(i * 43) * 30

      foxingSpots.push(
        <div
          key={i}
          style={{
            position: 'absolute',
            left: fx - size * spotScale * 0.5,
            top: fy - size * spotScale * 0.5,
            width: size * spotScale,
            height: size * spotScale * (0.7 + rand(i * 13) * 0.6),
            borderRadius: '50%',
            background: `radial-gradient(ellipse, rgba(${brownR}, ${brownG}, ${brownB}, ${alpha}), transparent 70%)`,
          }}
        />,
      )
    }

    // Yellowing gradient spreading from edges
    const yellowProgress = Math.min(1, (t * 0.05) % 1.5)

    return (
      <div style={{ position: 'absolute', inset: 0, background: bgColor }}>
        {/* Paper base with cream tint */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: `linear-gradient(135deg, rgba(210, 190, 150, 0.06) 0%, rgba(180, 160, 120, 0.04) 50%, rgba(200, 180, 140, 0.07) 100%)`,
          }}
        />
        {/* Edge yellowing */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: `radial-gradient(ellipse at center, transparent ${60 - yellowProgress * 15}%, rgba(180, 150, 80, 0.06) 100%)`,
          }}
        />
        {foxingSpots}
        {/* Subtle paper fiber texture */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: 'repeating-linear-gradient(45deg, transparent, transparent 2px, rgba(160,140,100,0.01) 2px, rgba(160,140,100,0.01) 3px)',
          }}
        />
      </div>
    )
  },

  renderWord: ({ word, color, enterProgress, holdProgress, exitProgress, phase, index, frame }: WordRenderProps) => {
    const f = frame ?? 0
    const t = f / 30

    // Age spots (foxing) developing on and around the text
    const textFoxing: React.ReactNode[] = []
    if (phase === 'hold' || phase === 'exit') {
      const numFox = 10
      const progress = phase === 'hold' ? holdProgress : 1
      for (let fx = 0; fx < numFox; fx++) {
        const fxP = Math.max(0, Math.min(1, progress * 1.3 - rand(fx * 31 + index) * 0.5))
        if (fxP <= 0) continue
        const foxX = (rand(fx * 37 + index) - 0.5) * 140
        const foxY = (rand(fx * 41 + index) - 0.5) * 60
        const size = 6 + rand(fx * 43) * 14
        const brownR = 150 + rand(fx * 17) * 50
        const brownG = 100 + rand(fx * 19) * 30
        const brownB = 40 + rand(fx * 23) * 25

        textFoxing.push(
          <div
            key={`fox${fx}`}
            style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              width: size * fxP,
              height: size * fxP * (0.7 + rand(fx * 29) * 0.6),
              transform: `translate(calc(-50% + ${foxX}px), calc(-50% + ${foxY}px))`,
              borderRadius: '50%',
              background: `radial-gradient(ellipse, rgba(${brownR}, ${brownG}, ${brownB}, ${fxP * 0.25}), transparent 70%)`,
            }}
          />,
        )
      }
    }

    const chars = word.split('').map((ch, ci) => {
      let charOpacity = 0
      let yellowing = 0 // 0 = crisp ink, 1 = faded/yellowed
      let moistureDamage = 0
      let blur = 0

      if (phase === 'enter') {
        // Ink being written on fresh paper
        const delay = ci / (word.length + 1) * 0.45
        const p = Math.max(0, Math.min(1, (enterProgress - delay) / 0.55))
        const ep = easeOutQuart(p)

        charOpacity = ep
        // Ink bleed on fresh paper
        blur = (1 - ep) * 1.5
      } else if (phase === 'hold') {
        charOpacity = 0.95
        // Time-lapse yellowing: ink color shifts from dark to brown
        const yellowDelay = ci / (word.length + 1) * 0.2
        const yellowP = Math.max(0, Math.min(1, (holdProgress - yellowDelay) / 0.8))
        yellowing = easeOutQuart(yellowP) * 0.6

        // Subtle moisture warping
        moistureDamage = holdProgress > 0.5 ? (holdProgress - 0.5) * 2 * 0.3 : 0
      } else {
        // Accelerated decay: paper crumbles, text dissolves
        const delay = ci / (word.length + 1) * 0.3
        const p = Math.max(0, Math.min(1, (exitProgress - delay) / 0.7))
        const ep = easeInQuad(p)

        charOpacity = 1 - ep * 0.7
        yellowing = 0.6 + ep * 0.4
        moistureDamage = 0.3 + ep * 0.7
        blur = ep * 2
      }

      // Color shift: dark ink -> brown -> faded sepia
      const inkDark = 40
      const sepiaR = 160
      const sepiaG = 120
      const sepiaB = 70
      const fadedR = 200
      const fadedG = 175
      const fadedB = 130

      let textColor: string
      if (yellowing < 0.5) {
        const blend = yellowing / 0.5
        textColor = `rgb(${Math.round(inkDark + (sepiaR - inkDark) * blend)}, ${Math.round(inkDark + (sepiaG - inkDark) * blend)}, ${Math.round(inkDark + (sepiaB - inkDark) * blend)})`
      } else {
        const blend = (yellowing - 0.5) / 0.5
        textColor = `rgb(${Math.round(sepiaR + (fadedR - sepiaR) * blend)}, ${Math.round(sepiaG + (fadedG - sepiaG) * blend)}, ${Math.round(sepiaB + (fadedB - sepiaB) * blend)})`
      }

      // Moisture buckle effect
      const buckleY = moistureDamage > 0 ? Math.sin(t * 0.8 + ci * 1.2) * moistureDamage * 4 : 0
      const buckleRotate = moistureDamage > 0 ? Math.sin(t * 0.5 + ci * 0.9) * moistureDamage * 2 : 0

      return (
        <span
          key={ci}
          style={{
            display: 'inline-block',
            color: yellowing > 0.1 ? textColor : color,
            opacity: charOpacity,
            transform: `translateY(${buckleY}px) rotate(${buckleRotate}deg)`,
            filter: blur > 0.1 ? `blur(${blur}px)` : undefined,
            textShadow: [
              yellowing > 0.2 ? `0 0 ${yellowing * 3}px rgba(160, 120, 60, ${yellowing * 0.2})` : '',
              moistureDamage > 0.2 ? `0 1px ${moistureDamage * 2}px rgba(140, 110, 50, ${moistureDamage * 0.15})` : '',
            ].filter(Boolean).join(', ') || undefined,
          }}
        >
          {ch}
        </span>
      )
    })

    return (
      <div style={{ position: 'absolute', inset: 0 }}>
        {textFoxing}
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            fontFamily: "'Georgia', 'Garamond', 'Times New Roman', serif",
            fontSize: 'clamp(42px, 11vw, 150px)',
            fontWeight: 400,
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

function FoxingComponent(props: MotionGraphicProps<FoxingConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-foxing',
  title: 'Kinetic Foxing',
  description: 'Paper foxing and aging: text on paper that develops brown age spots, yellowing ink, moisture damage, and time-lapse decay. Ink shifts from dark to sepia as foxing spots bloom around letters.',
  tags: ['kinetic', 'typography', 'decay', 'paper', 'foxing', 'aging', 'vintage', 'sepia'],
  category: 'captions',
  component: FoxingComponent as any,
  defaultConfig: {
    words: ['AGED', 'FOXED', 'FADED', 'TIME'],
    colors: ['#3D2B1F', '#4A3728', '#2E1F14', '#5C4033'],
    bgColor: '#1e1a14',
    cycleDuration: 1.5,
  },
  configSchema: [
    { key: 'words', label: 'Words', type: 'text-array', defaultValue: ['AGED', 'FOXED', 'FADED', 'TIME'], group: 'Content' },
    { key: 'colors', label: 'Colors', type: 'text-array', defaultValue: ['#3D2B1F', '#4A3728', '#2E1F14', '#5C4033'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#1e1a14', group: 'Style' },
    { key: 'cycleDuration', label: 'Cycle Duration (s)', type: 'number', defaultValue: 1.5, min: 0.3, max: 5, group: 'Timing' },
  ],
})
