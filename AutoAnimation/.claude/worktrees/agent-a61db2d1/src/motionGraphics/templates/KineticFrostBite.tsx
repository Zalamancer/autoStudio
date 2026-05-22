import { registerMotionGraphic } from '../registry'
import { KineticBase, type KineticBaseConfig, type KineticAnimation, type WordRenderProps, type BackgroundRenderProps } from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface FrostBiteConfig extends KineticBaseConfig {}

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

    // Frost crystal patterns spreading on glass
    const crystals: React.ReactNode[] = []
    const numCrystals = 20

    for (let i = 0; i < numCrystals; i++) {
      const cx = width * rand(i * 31 + 11)
      const cy = height * rand(i * 47 + 23)
      const size = 8 + rand(i * 19) * 20
      const angle = rand(i * 37) * 360
      const alpha = 0.06 + rand(i * 29) * 0.08
      // Growth pulse
      const growthPhase = (t * 0.3 + rand(i * 53) * 5) % 5
      const growthScale = growthPhase < 2 ? easeOutQuart(growthPhase / 2) : 1

      // Six-pointed crystal shape using rotated lines
      const arms: React.ReactNode[] = []
      for (let a = 0; a < 6; a++) {
        const armAngle = angle + a * 60
        const armLength = size * growthScale
        const armWidth = 1 + rand(i * 13 + a) * 1.5
        arms.push(
          <div
            key={a}
            style={{
              position: 'absolute',
              left: '50%',
              top: '50%',
              width: armLength,
              height: armWidth,
              transform: `translate(-50%, -50%) rotate(${armAngle}deg)`,
              background: `linear-gradient(90deg, transparent, rgba(180, 220, 255, ${alpha}), transparent)`,
              borderRadius: 1,
            }}
          />,
        )
        // Branch on each arm
        if (armLength > 10) {
          arms.push(
            <div
              key={`b${a}`}
              style={{
                position: 'absolute',
                left: '50%',
                top: '50%',
                width: armLength * 0.5,
                height: armWidth * 0.7,
                transform: `translate(${Math.cos((armAngle * Math.PI) / 180) * armLength * 0.3}px, ${Math.sin((armAngle * Math.PI) / 180) * armLength * 0.3}px) rotate(${armAngle + 40}deg)`,
                background: `linear-gradient(90deg, transparent, rgba(180, 220, 255, ${alpha * 0.6}), transparent)`,
                borderRadius: 1,
              }}
            />,
          )
        }
      }

      crystals.push(
        <div
          key={i}
          style={{
            position: 'absolute',
            left: cx,
            top: cy,
            width: size * 2,
            height: size * 2,
          }}
        >
          {arms}
        </div>,
      )
    }

    return (
      <div style={{ position: 'absolute', inset: 0, background: bgColor }}>
        {/* Icy blue ambient gradient */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: `radial-gradient(ellipse at ${50 + Math.sin(t * 0.15) * 10}% ${50 + Math.cos(t * 0.1) * 10}%, rgba(40, 70, 120, 0.15), transparent 60%)`,
          }}
        />
        {crystals}
      </div>
    )
  },

  renderWord: ({ word, color, enterProgress, holdProgress, exitProgress, phase, index, frame, width }: WordRenderProps) => {
    const f = frame ?? 0
    const t = f / 30

    // Frost crystallization particles spreading around text
    const frostParticles: React.ReactNode[] = []
    if (phase === 'enter') {
      const numP = 16
      for (let p = 0; p < numP; p++) {
        const pProgress = Math.max(0, Math.min(1, (enterProgress * 1.3 - rand(p * 31 + index) * 0.4)))
        if (pProgress <= 0) continue
        const ep = easeOutQuart(pProgress)
        const angle = (p / numP) * Math.PI * 2 + rand(p * 17) * 0.5
        const radius = ep * 60 + rand(p * 43) * 30
        const px = Math.cos(angle) * radius
        const py = Math.sin(angle) * radius
        const size = 2 + rand(p * 29) * 4

        frostParticles.push(
          <div
            key={`fp${p}`}
            style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              width: size,
              height: size,
              transform: `translate(calc(-50% + ${px}px), calc(-50% + ${py}px)) rotate(${angle * 60}deg)`,
              background: `rgba(180, 220, 255, ${(1 - ep * 0.7) * 0.4})`,
              borderRadius: size > 3 ? '2px' : '50%',
            }}
          />,
        )
      }
    }

    const chars = word.split('').map((ch, ci) => {
      let charOpacity = 0
      let blur = 0
      let charScale = 1
      let iceThickness = 0 // stroke width for ice edge

      if (phase === 'enter') {
        // Frost crystallization: ice spreads across letter from center outward
        const delay = ci / (word.length + 1) * 0.4
        const p = Math.max(0, Math.min(1, (enterProgress - delay) / 0.6))
        const ep = easeOutQuart(p)

        charOpacity = ep
        // Crystal sharp: no blur, instant formation feel
        charScale = 0.8 + ep * 0.2
        iceThickness = ep * 2

        // Initial sparkle on crystallization
        if (p > 0.3 && p < 0.6) {
          blur = 0 // keep crisp
        }
      } else if (phase === 'hold') {
        charOpacity = 0.95
        iceThickness = 2
        // Subtle ice shimmer
        charScale = 1 + Math.sin(t * 3 + ci * 0.5) * 0.01
        // Frost edge glow pulse
        iceThickness = 2 + Math.sin(t * 2 + ci * 0.4) * 0.5
      } else {
        // Sublimation: frost evaporates, letters get thinner and fade
        const delay = ci / (word.length + 1) * 0.3
        const p = Math.max(0, Math.min(1, (exitProgress - delay) / 0.7))
        const ep = easeInCubic(p)

        charOpacity = 1 - ep
        blur = ep * 4
        charScale = 1 - ep * 0.15
        iceThickness = (1 - ep) * 2
      }

      // Frost crystal color: white core with icy blue edge
      const frostGlow = Math.sin(t * 2.5 + ci * 0.6) * 0.5 + 0.5
      const glowColor = frostGlow > 0.5 ? '#E0F0FF' : color

      return (
        <span
          key={ci}
          style={{
            display: 'inline-block',
            color: glowColor,
            opacity: charOpacity,
            transform: `scale(${charScale})`,
            filter: blur > 0.1 ? `blur(${blur}px)` : undefined,
            WebkitTextStroke: iceThickness > 0 ? `${iceThickness}px rgba(140, 200, 255, 0.3)` : undefined,
            textShadow: [
              `0 0 8px rgba(140, 200, 255, ${0.4 + frostGlow * 0.2})`,
              `0 0 20px rgba(100, 170, 255, 0.2)`,
              `0 0 2px rgba(255, 255, 255, 0.6)`,
            ].join(', '),
          }}
        >
          {ch}
        </span>
      )
    })

    // Sublimation vapor during exit
    const vaporElements: React.ReactNode[] = []
    if (phase === 'exit') {
      for (let v = 0; v < 8; v++) {
        const vP = Math.max(0, Math.min(1, (exitProgress - v / 8 * 0.2) / 0.8))
        if (vP <= 0) continue
        const vx = (rand(v * 37 + index) - 0.5) * 100
        const vy = -vP * 50 - rand(v * 19) * 30
        const vSize = 10 + rand(v * 23) * 15
        vaporElements.push(
          <div
            key={`v${v}`}
            style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              width: vSize,
              height: vSize * 0.6,
              transform: `translate(calc(-50% + ${vx}px), calc(-50% + ${vy}px))`,
              borderRadius: '50%',
              background: `radial-gradient(ellipse, rgba(160, 210, 255, ${(1 - vP) * 0.2}), transparent 70%)`,
              filter: 'blur(5px)',
            }}
          />,
        )
      }
    }

    return (
      <div style={{ position: 'absolute', inset: 0 }}>
        {frostParticles}
        {vaporElements}
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            fontFamily: "'Segoe UI', 'Helvetica Neue', Arial, sans-serif",
            fontSize: 'clamp(44px, 12vw, 155px)',
            fontWeight: 200,
            whiteSpace: 'nowrap',
            letterSpacing: 6,
            textTransform: 'uppercase',
          }}
        >
          {chars}
        </div>
      </div>
    )
  },
}

function FrostBiteComponent(props: MotionGraphicProps<FrostBiteConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-frost-bite',
  title: 'Kinetic Frost Bite',
  description: 'Frost crystallization spreading to form letter shapes, then sublimating away. Ice crystal particles emanate during formation, vapor rises during exit.',
  tags: ['kinetic', 'typography', 'liquid', 'frost', 'ice', 'crystal', 'cold', 'winter'],
  category: 'captions',
  component: FrostBiteComponent as any,
  defaultConfig: {
    words: ['FROST', 'ICE', 'COLD', 'ZERO'],
    colors: ['#93C5FD', '#BAE6FD', '#A5B4FC', '#E0F2FE'],
    bgColor: '#0a1020',
    cycleDuration: 1.5,
  },
  configSchema: [
    { key: 'words', label: 'Words', type: 'text-array', defaultValue: ['FROST', 'ICE', 'COLD', 'ZERO'], group: 'Content' },
    { key: 'colors', label: 'Colors', type: 'text-array', defaultValue: ['#93C5FD', '#BAE6FD', '#A5B4FC', '#E0F2FE'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#0a1020', group: 'Style' },
    { key: 'cycleDuration', label: 'Cycle Duration (s)', type: 'number', defaultValue: 1.5, min: 0.3, max: 5, group: 'Timing' },
  ],
})
