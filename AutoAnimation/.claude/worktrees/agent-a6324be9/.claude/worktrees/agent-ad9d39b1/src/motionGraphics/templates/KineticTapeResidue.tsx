import { registerMotionGraphic } from '../registry'
import { KineticBase, type KineticBaseConfig, type KineticAnimation, type WordRenderProps, type BackgroundRenderProps } from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface TapeResidueConfig extends KineticBaseConfig {}

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

    // Old tape strips on the surface
    const tapeStrips: React.ReactNode[] = []
    const numStrips = 6

    for (let i = 0; i < numStrips; i++) {
      const sx = width * (0.1 + rand(i * 31 + 9) * 0.8)
      const sy = height * rand(i * 47 + 21)
      const stripW = 20 + rand(i * 19) * 40
      const stripH = 4 + rand(i * 23) * 8
      const angle = (rand(i * 37) - 0.5) * 30
      const alpha = 0.03 + rand(i * 29) * 0.04

      // Yellowed adhesive color
      tapeStrips.push(
        <div
          key={i}
          style={{
            position: 'absolute',
            left: sx,
            top: sy,
            width: stripW,
            height: stripH,
            transform: `rotate(${angle}deg)`,
            background: `linear-gradient(90deg, rgba(200, 180, 100, ${alpha * 0.5}), rgba(220, 200, 120, ${alpha}), rgba(200, 180, 100, ${alpha * 0.5}))`,
            borderRadius: 1,
            opacity: 0.7,
          }}
        />,
      )
    }

    // Torn paper fiber marks
    const fiberMarks: React.ReactNode[] = []
    for (let f = 0; f < 10; f++) {
      const fx = width * rand(f * 53 + 33)
      const fy = height * rand(f * 67 + 41)
      const fLen = 4 + rand(f * 41) * 12
      const fAngle = rand(f * 29) * 360
      const fAlpha = 0.04 + rand(f * 23) * 0.04

      fiberMarks.push(
        <div
          key={`fib${f}`}
          style={{
            position: 'absolute',
            left: fx,
            top: fy,
            width: fLen,
            height: 0.5,
            transform: `rotate(${fAngle}deg)`,
            background: `rgba(180, 160, 120, ${fAlpha})`,
          }}
        />,
      )
    }

    return (
      <div style={{ position: 'absolute', inset: 0, background: bgColor }}>
        {/* Paper/cardboard surface */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: `linear-gradient(160deg, rgba(140, 120, 80, 0.04) 0%, rgba(100, 85, 55, 0.06) 100%)`,
          }}
        />
        {tapeStrips}
        {fiberMarks}
      </div>
    )
  },

  renderWord: ({ word, color, enterProgress, holdProgress, exitProgress, phase, index, frame }: WordRenderProps) => {
    const f = frame ?? 0
    const t = f / 30

    const chars = word.split('').map((ch, ci) => {
      let charOpacity = 0
      let tapeAlpha = 0
      let peelProgress = 0
      let residueAlpha = 0
      let fiberTear = 0

      if (phase === 'enter') {
        // Text held in place by tape, appears stuck down
        const delay = ci / (word.length + 1) * 0.35
        const p = Math.max(0, Math.min(1, (enterProgress - delay) / 0.65))
        const ep = easeOutQuart(p)

        charOpacity = ep
        tapeAlpha = ep * 0.5 // Tape is visible holding the letter
      } else if (phase === 'hold') {
        charOpacity = 1
        // Tape starts peeling, edges curl
        const peelDelay = ci / (word.length + 1) * 0.2
        const peelP = Math.max(0, Math.min(1, (holdProgress - peelDelay) / 0.8))
        peelProgress = easeOutQuart(peelP) * 0.6
        tapeAlpha = 0.5 * (1 - peelProgress)
        residueAlpha = peelProgress * 0.4
      } else {
        // Tape fully removed, only sticky residue ghost remains
        const delay = ci / (word.length + 1) * 0.25
        const p = Math.max(0, Math.min(1, (exitProgress - delay) / 0.75))
        const ep = easeInCubic(p)

        charOpacity = 1 - ep * 0.5
        tapeAlpha = 0
        residueAlpha = 0.4 * (1 - ep * 0.5)
        peelProgress = 0.6 + ep * 0.4
        fiberTear = ep
      }

      // Tape strip overlay on each character
      const tapeOverlay = tapeAlpha > 0.01 ? (
        <span
          style={{
            position: 'absolute',
            left: '-10%',
            top: '20%',
            width: '120%',
            height: '30%',
            background: `linear-gradient(180deg, rgba(220, 200, 130, ${tapeAlpha * 0.3}), rgba(200, 180, 110, ${tapeAlpha * 0.5}), rgba(220, 200, 130, ${tapeAlpha * 0.3}))`,
            transform: `rotate(${(rand(ci * 17 + index) - 0.5) * 8}deg) perspective(100px) rotateX(${peelProgress * 15}deg)`,
            transformOrigin: 'center bottom',
            borderRadius: 2,
            pointerEvents: 'none' as const,
            zIndex: 2,
          }}
        />
      ) : null

      // Sticky residue patch (yellow ghost outline)
      const residueOverlay = residueAlpha > 0.01 ? (
        <span
          style={{
            position: 'absolute',
            left: '-5%',
            top: '15%',
            width: '110%',
            height: '35%',
            background: `rgba(200, 180, 100, ${residueAlpha * 0.3})`,
            borderRadius: 2,
            transform: `rotate(${(rand(ci * 17 + index) - 0.5) * 8}deg)`,
            pointerEvents: 'none' as const,
            zIndex: 0,
          }}
        />
      ) : null

      // Torn paper fiber wisps
      const fibers: React.ReactNode[] = []
      if (fiberTear > 0.1) {
        for (let fb = 0; fb < 3; fb++) {
          const fbX = (rand(ci * 31 + fb * 17 + index) - 0.5) * 20
          const fbY = (rand(ci * 37 + fb * 23 + index) - 0.5) * 15
          const fbLen = 3 + rand(ci * 41 + fb * 29) * 8
          const fbAngle = rand(ci * 43 + fb * 31) * 180

          fibers.push(
            <span
              key={`fb${fb}`}
              style={{
                position: 'absolute',
                left: `calc(50% + ${fbX}px)`,
                top: `calc(50% + ${fbY}px)`,
                width: fbLen,
                height: 0.5,
                transform: `rotate(${fbAngle}deg)`,
                background: `rgba(180, 160, 120, ${fiberTear * 0.3})`,
                pointerEvents: 'none' as const,
              }}
            />,
          )
        }
      }

      return (
        <span
          key={ci}
          style={{
            display: 'inline-block',
            position: 'relative',
            color,
            opacity: charOpacity,
            textShadow: residueAlpha > 0.1
              ? `0 0 ${residueAlpha * 8}px rgba(200, 180, 100, ${residueAlpha * 0.4})`
              : undefined,
          }}
        >
          {residueOverlay}
          <span style={{ position: 'relative', zIndex: 1 }}>{ch}</span>
          {tapeOverlay}
          {fibers}
        </span>
      )
    })

    // Peeling tape strips falling during exit
    const fallingTape: React.ReactNode[] = []
    if (phase === 'exit') {
      for (let tp = 0; tp < 4; tp++) {
        const tpP = Math.max(0, Math.min(1, (exitProgress - tp / 4 * 0.2) / 0.8))
        if (tpP <= 0) continue
        const tpx = (rand(tp * 37 + index) - 0.5) * 120
        const tpy = tpP * 50 + rand(tp * 19) * 20
        const tpW = 15 + rand(tp * 23) * 25
        const tpRot = tpP * 60 + rand(tp * 29) * 40

        fallingTape.push(
          <div
            key={`ft${tp}`}
            style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              width: tpW,
              height: 5,
              transform: `translate(calc(-50% + ${tpx}px), calc(-50% + ${tpy}px)) rotate(${tpRot}deg) perspective(80px) rotateX(${tpP * 30}deg)`,
              background: `linear-gradient(90deg, rgba(220, 200, 130, ${(1 - tpP) * 0.3}), rgba(200, 180, 110, ${(1 - tpP) * 0.4}), rgba(220, 200, 130, ${(1 - tpP) * 0.3}))`,
              borderRadius: 1,
            }}
          />,
        )
      }
    }

    return (
      <div style={{ position: 'absolute', inset: 0 }}>
        {fallingTape}
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            fontFamily: "'Courier New', 'Courier', monospace",
            fontSize: 'clamp(40px, 11vw, 145px)',
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

function TapeResidueComponent(props: MotionGraphicProps<TapeResidueConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-tape-residue',
  title: 'Kinetic Tape Residue',
  description: 'Text held by tape that peels away leaving sticky yellow residue outline, torn paper fibers, and adhesive ghost. Tape strips curl during hold, residue and fiber marks remain on exit.',
  tags: ['kinetic', 'typography', 'decay', 'tape', 'residue', 'adhesive', 'peel', 'sticky'],
  category: 'captions',
  component: TapeResidueComponent as any,
  defaultConfig: {
    words: ['STUCK', 'TAPE', 'PEEL', 'GHOST'],
    colors: ['#C8B878', '#D4C888', '#B8A868', '#DCD098'],
    bgColor: '#1a1710',
    cycleDuration: 1.4,
  },
  configSchema: [
    { key: 'words', label: 'Words', type: 'text-array', defaultValue: ['STUCK', 'TAPE', 'PEEL', 'GHOST'], group: 'Content' },
    { key: 'colors', label: 'Colors', type: 'text-array', defaultValue: ['#C8B878', '#D4C888', '#B8A868', '#DCD098'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#1a1710', group: 'Style' },
    { key: 'cycleDuration', label: 'Cycle Duration (s)', type: 'number', defaultValue: 1.4, min: 0.3, max: 5, group: 'Timing' },
  ],
})
