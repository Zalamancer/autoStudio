import { registerMotionGraphic } from '../registry'
import { KineticBase, type KineticBaseConfig, type KineticAnimation, type WordRenderProps, type BackgroundRenderProps } from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface PaintPeelConfig extends KineticBaseConfig {}

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

    // Weathered wall surface with cracking paint
    const cracks: React.ReactNode[] = []
    const numCracks = 15

    for (let i = 0; i < numCracks; i++) {
      const cx = width * rand(i * 31 + 9)
      const cy = height * rand(i * 47 + 21)
      const length = 15 + rand(i * 19) * 40
      const angle = rand(i * 37) * 180
      const thickness = 0.5 + rand(i * 23) * 1
      const alpha = 0.06 + rand(i * 29) * 0.06

      cracks.push(
        <div
          key={i}
          style={{
            position: 'absolute',
            left: cx,
            top: cy,
            width: length,
            height: thickness,
            transform: `rotate(${angle}deg)`,
            background: `linear-gradient(90deg, transparent, rgba(40, 30, 20, ${alpha}), rgba(40, 30, 20, ${alpha}), transparent)`,
          }}
        />,
      )
    }

    // Paint flake patches on the wall
    const flakePatches: React.ReactNode[] = []
    for (let p = 0; p < 8; p++) {
      const px = width * rand(p * 53 + 33)
      const py = height * rand(p * 67 + 41)
      const size = 25 + rand(p * 41) * 50
      const growPhase = (t * 0.1 + rand(p * 71) * 10) % 10
      const growScale = growPhase < 4 ? easeOutQuart(growPhase / 4) : 1
      const underlayerColor = `rgba(${140 + rand(p * 13) * 40}, ${120 + rand(p * 17) * 30}, ${90 + rand(p * 19) * 20}, ${0.06 + rand(p * 23) * 0.05})`

      flakePatches.push(
        <div
          key={`fp${p}`}
          style={{
            position: 'absolute',
            left: px - size * growScale * 0.5,
            top: py - size * growScale * 0.5,
            width: size * growScale,
            height: size * growScale * (0.6 + rand(p * 29) * 0.8),
            borderRadius: '30% 50% 40% 60% / 50% 35% 55% 45%',
            background: underlayerColor,
          }}
        />,
      )
    }

    return (
      <div style={{ position: 'absolute', inset: 0, background: bgColor }}>
        {/* Plaster wall texture */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: `radial-gradient(ellipse at ${45 + Math.sin(t * 0.1) * 5}% ${50 + Math.cos(t * 0.08) * 5}%, rgba(180, 160, 130, 0.06), transparent 70%)`,
          }}
        />
        {flakePatches}
        {cracks}
      </div>
    )
  },

  renderWord: ({ word, color, enterProgress, holdProgress, exitProgress, phase, index, frame }: WordRenderProps) => {
    const f = frame ?? 0
    const t = f / 30

    const chars = word.split('').map((ch, ci) => {
      let charOpacity = 0
      let crackAmount = 0
      let peelAngle = 0
      let peelOriginY = '100%'
      let charScale = 1
      let showUnderlayer = false

      if (phase === 'enter') {
        // Fresh paint being applied: brush stroke reveal
        const delay = ci / (word.length + 1) * 0.4
        const p = Math.max(0, Math.min(1, (enterProgress - delay) / 0.6))
        const ep = easeOutQuart(p)

        charOpacity = ep
        charScale = 0.95 + ep * 0.05
      } else if (phase === 'hold') {
        charOpacity = 1
        // Cracks develop during hold
        const crackDelay = ci / (word.length + 1) * 0.25
        const crackP = Math.max(0, Math.min(1, (holdProgress - crackDelay) / 0.75))
        crackAmount = easeOutQuart(crackP)

        // Paint starts to curl at edges
        if (holdProgress > 0.6) {
          const curlP = (holdProgress - 0.6) / 0.4
          peelAngle = curlP * 5 * (rand(ci * 31 + index) > 0.5 ? 1 : -1)
        }
      } else {
        // Paint peels away: flakes curl and detach
        const delay = ci / (word.length + 1) * 0.3
        const p = Math.max(0, Math.min(1, (exitProgress - delay) / 0.7))
        const ep = easeInCubic(p)

        charOpacity = 1 - ep * 0.6
        crackAmount = 1
        // Peel: rotate from bottom edge like a flake curling up
        peelAngle = ep * (35 + rand(ci * 37 + index) * 25)
        peelOriginY = rand(ci * 41) > 0.5 ? '100%' : '0%'
        charScale = 1 - ep * 0.15
        showUnderlayer = ep > 0.2
      }

      // Crack lines overlaid on the character
      const crackLines: React.ReactNode[] = []
      if (crackAmount > 0.1) {
        const numCracks = 3
        for (let c = 0; c < numCracks; c++) {
          const cAngle = rand(ci * 19 + c * 31 + index) * 180
          const cLen = crackAmount * (15 + rand(ci * 23 + c * 37) * 20)
          const cAlpha = crackAmount * 0.4

          crackLines.push(
            <span
              key={`cr${c}`}
              style={{
                position: 'absolute',
                left: '50%',
                top: '50%',
                width: cLen,
                height: 1,
                transform: `translate(-50%, -50%) rotate(${cAngle}deg)`,
                background: `linear-gradient(90deg, transparent, rgba(40, 30, 15, ${cAlpha}), transparent)`,
                pointerEvents: 'none',
              }}
            />,
          )
        }
      }

      // Underlayer glimpse (different color showing through)
      const underlayerAlpha = showUnderlayer ? (phase === 'exit' ? easeInCubic(Math.max(0, (exitProgress - 0.2) / 0.8)) * 0.5 : 0) : 0

      return (
        <span
          key={ci}
          style={{
            display: 'inline-block',
            position: 'relative',
            color: showUnderlayer
              ? `rgba(${140 + rand(ci * 11) * 40}, ${110 + rand(ci * 13) * 30}, ${70 + rand(ci * 17) * 20}, ${underlayerAlpha})`
              : color,
            opacity: charOpacity,
            transform: `scale(${charScale}) perspective(200px) rotateX(${peelAngle}deg)`,
            transformOrigin: `center ${peelOriginY}`,
            textShadow: [
              crackAmount > 0.3 ? `0 1px 2px rgba(40, 30, 10, ${crackAmount * 0.3})` : '',
              peelAngle > 5 ? `0 ${peelAngle * 0.3}px ${peelAngle * 0.2}px rgba(0, 0, 0, 0.15)` : '',
            ].filter(Boolean).join(', ') || undefined,
          }}
        >
          {/* Paint layer */}
          <span style={{ position: 'relative', zIndex: 1 }}>
            {ch}
          </span>
          {crackLines}
        </span>
      )
    })

    // Falling paint flakes during exit
    const fallingFlakes: React.ReactNode[] = []
    if (phase === 'exit') {
      for (let fl = 0; fl < 8; fl++) {
        const flP = Math.max(0, Math.min(1, (exitProgress - fl / 8 * 0.25) / 0.75))
        if (flP <= 0) continue
        const flx = (rand(fl * 37 + index) - 0.5) * 140
        const fly = flP * 70 + rand(fl * 19) * 30
        const flSize = 5 + rand(fl * 23) * 10
        const flRot = flP * 120 + rand(fl * 29) * 180

        fallingFlakes.push(
          <div
            key={`ffl${fl}`}
            style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              width: flSize,
              height: flSize * 0.4,
              transform: `translate(calc(-50% + ${flx}px), calc(-50% + ${fly}px)) rotate(${flRot}deg) perspective(100px) rotateX(${flP * 40}deg)`,
              background: `rgba(${180 + rand(fl * 41) * 60}, ${150 + rand(fl * 43) * 40}, ${100 + rand(fl * 47) * 30}, ${(1 - flP) * 0.6})`,
              borderRadius: '15% 25% 20% 30%',
            }}
          />,
        )
      }
    }

    return (
      <div style={{ position: 'absolute', inset: 0 }}>
        {fallingFlakes}
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            fontFamily: "'Georgia', 'Times New Roman', serif",
            fontSize: 'clamp(44px, 12vw, 155px)',
            fontWeight: 700,
            whiteSpace: 'nowrap',
            letterSpacing: 3,
            textTransform: 'uppercase',
          }}
        >
          {chars}
        </div>
      </div>
    )
  },
}

function PaintPeelComponent(props: MotionGraphicProps<PaintPeelConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-paint-peel',
  title: 'Kinetic Paint Peel',
  description: 'Text as old wall paint that cracks, curls, and peels away in flakes revealing the underlayer. Weathered surface with crack networks developing during hold, paint chips falling on exit.',
  tags: ['kinetic', 'typography', 'decay', 'paint', 'peel', 'crack', 'weathered', 'aging'],
  category: 'captions',
  component: PaintPeelComponent as any,
  defaultConfig: {
    words: ['PEEL', 'CRACK', 'FADE', 'WALL'],
    colors: ['#C8B89A', '#B8A080', '#D4C4A8', '#A89070'],
    bgColor: '#1c1810',
    cycleDuration: 1.4,
  },
  configSchema: [
    { key: 'words', label: 'Words', type: 'text-array', defaultValue: ['PEEL', 'CRACK', 'FADE', 'WALL'], group: 'Content' },
    { key: 'colors', label: 'Colors', type: 'text-array', defaultValue: ['#C8B89A', '#B8A080', '#D4C4A8', '#A89070'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#1c1810', group: 'Style' },
    { key: 'cycleDuration', label: 'Cycle Duration (s)', type: 'number', defaultValue: 1.4, min: 0.3, max: 5, group: 'Timing' },
  ],
})
