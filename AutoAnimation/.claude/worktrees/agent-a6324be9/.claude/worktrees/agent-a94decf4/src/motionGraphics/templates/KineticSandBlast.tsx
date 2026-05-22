import { registerMotionGraphic } from '../registry'
import {
  KineticBase,
  type KineticBaseConfig,
  type KineticAnimation,
  type WordRenderProps,
  type BackgroundRenderProps,
} from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface SandBlastConfig extends KineticBaseConfig {}

/** Deterministic pseudo-random 0..1 from integer seed */
function rand(s: number): number {
  const x = Math.sin(s * 127.1 + 311.7) * 43758.5453
  return x - Math.floor(x)
}

const animation: KineticAnimation = {
  renderBackground: ({ bgColor, width, height, frame }: BackgroundRenderProps) => {
    // Textured surface being sandblasted -- subtle paint fleck particles
    const flecks: { x: number; y: number; size: number; opacity: number }[] = []
    for (let i = 0; i < 15; i++) {
      const life = ((frame * 0.03 + i * 0.07) % 1)
      flecks.push({
        x: rand(i * 43 + 17) * width,
        y: rand(i * 71 + 31) * height,
        size: 1 + rand(i * 19) * 2,
        opacity: (1 - life) * 0.15,
      })
    }

    return (
      <div style={{ position: 'absolute', inset: 0, background: bgColor }}>
        {/* Paint/surface texture overlay */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: `radial-gradient(circle at 30% 40%, rgba(80,70,50,0.1) 0%, transparent 50%),
                         radial-gradient(circle at 70% 60%, rgba(60,55,40,0.08) 0%, transparent 40%)`,
          }}
        />
        {flecks.map((fl, i) => (
          <div
            key={i}
            style={{
              position: 'absolute',
              left: fl.x,
              top: fl.y,
              width: fl.size,
              height: fl.size,
              borderRadius: '50%',
              background: '#8B7355',
              opacity: fl.opacity,
            }}
          />
        ))}
      </div>
    )
  },

  renderWord: ({ word, color, enterProgress, holdProgress, exitProgress, phase, index, frame, width }: WordRenderProps) => {
    const f = frame ?? 0
    const seed = index * 157 + 91
    const chars = word.split('')

    // Sand particles blasting across
    const sandParticles: { x: number; y: number; size: number; opacity: number; speed: number }[] = []

    const charElements = chars.map((ch, ci) => {
      // Sandblast reveals left to right
      const charNorm = ci / Math.max(chars.length - 1, 1)
      let charOpacity = 1
      let revealMask = 1 // 1 = fully revealed, 0 = still under paint
      let paintColor = '#6B5B3E' // paint surface color
      let paintOpacity = 0
      let blur = 0

      if (phase === 'enter') {
        // Sandblast sweeps left to right, revealing text underneath
        const blastFront = enterProgress * 1.4 // overscan so it finishes
        const charBlastProgress = Math.max(0, Math.min(1, (blastFront - charNorm * 0.8) / 0.6))

        if (charBlastProgress < 1) {
          // Paint layer still covering
          paintOpacity = 1 - charBlastProgress
          revealMask = charBlastProgress
          charOpacity = charBlastProgress
        }

        // Blast zone: active area where sand is hitting
        if (charBlastProgress > 0 && charBlastProgress < 0.8) {
          blur = (1 - charBlastProgress / 0.8) * 1.5
          // Generate sand particles near blast zone
          for (let p = 0; p < 3; p++) {
            const pSeed = ci * 37 + p * 53 + seed
            sandParticles.push({
              x: ci * 48 + rand(pSeed) * 30 - 15,
              y: (rand(pSeed + 10) - 0.5) * 60,
              size: 1 + rand(pSeed + 20) * 2.5,
              opacity: (1 - charBlastProgress) * 0.5,
              speed: 2 + rand(pSeed + 30) * 3,
            })
          }
        }
      } else if (phase === 'hold') {
        // Clean revealed text with occasional sand grain drifting
        charOpacity = 1
        const shimmer = Math.sin(holdProgress * Math.PI * 6 + ci * 1.5) * 0.03
        charOpacity = 0.97 + shimmer
      } else {
        // Exit: sand covers text back up right to left
        const coverFront = exitProgress * 1.4
        const coverProgress = Math.max(0, Math.min(1, (coverFront - (1 - charNorm) * 0.8) / 0.6))

        if (coverProgress > 0) {
          paintOpacity = coverProgress
          charOpacity = 1 - coverProgress
          if (coverProgress < 0.6) {
            blur = coverProgress * 2
          }

          // Sand particles during covering
          for (let p = 0; p < 2; p++) {
            const pSeed = ci * 41 + p * 61 + seed + 500
            sandParticles.push({
              x: ci * 48 + rand(pSeed) * 20,
              y: (rand(pSeed + 10) - 0.5) * 50,
              size: 1 + rand(pSeed + 20) * 2,
              opacity: coverProgress * 0.4,
              speed: -2 - rand(pSeed + 30) * 3,
            })
          }
        }
      }

      return (
        <span
          key={ci}
          style={{
            display: 'inline-block',
            position: 'relative',
          }}
        >
          {/* Paint overlay layer */}
          {paintOpacity > 0 && (
            <span
              style={{
                position: 'absolute',
                inset: 0,
                color: paintColor,
                opacity: paintOpacity,
                filter: `blur(${blur}px)`,
                pointerEvents: 'none',
              }}
            >
              {ch}
            </span>
          )}
          {/* Revealed text underneath */}
          <span
            style={{
              color,
              opacity: charOpacity,
              filter: blur > 0 ? `blur(${blur * 0.5}px)` : 'none',
              transition: 'none',
            }}
          >
            {ch}
          </span>
        </span>
      )
    })

    return (
      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          fontFamily: "'Impact', 'Arial Black', sans-serif",
          fontSize: 'clamp(40px, 12vw, 160px)',
          fontWeight: 900,
          whiteSpace: 'nowrap',
          letterSpacing: 3,
          textShadow: `1px 1px 0 rgba(0,0,0,0.3)`,
        }}
      >
        {charElements}
        {/* Sand particles */}
        {sandParticles.map((sp, i) => (
          <div
            key={`sp-${i}`}
            style={{
              position: 'absolute',
              top: '50%',
              left: '10%',
              width: sp.size,
              height: sp.size,
              borderRadius: '50%',
              background: rand(i * 13 + seed) > 0.5 ? '#D4C5A0' : '#B8A88A',
              opacity: sp.opacity,
              transform: `translate(${sp.x + sp.speed * f * 0.3}px, ${sp.y}px)`,
            }}
          />
        ))}
      </div>
    )
  },
}

function SandBlastComponent(props: MotionGraphicProps<SandBlastConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-sand-blast',
  title: 'Kinetic Sand Blast',
  description:
    'Sandblasting reveals hidden text underneath a painted surface. Sand particles fly as the blast front sweeps left to right, stripping paint to reveal clean text.',
  tags: ['kinetic', 'typography', 'sandblast', 'reveal', 'industrial', 'particles', 'destruction'],
  category: 'captions',
  component: SandBlastComponent as any,
  defaultConfig: {
    words: ['BLAST', 'STRIP', 'REVEAL', 'CLEAN'],
    colors: ['#F5F0E8', '#E8E0D0', '#FFF8F0', '#F0E8D8'],
    bgColor: '#2C2416',
    cycleDuration: 1.6,
  },
  configSchema: [
    { key: 'words', label: 'Words', type: 'text-array', defaultValue: ['BLAST', 'STRIP', 'REVEAL', 'CLEAN'], group: 'Content' },
    { key: 'colors', label: 'Colors', type: 'text-array', defaultValue: ['#F5F0E8', '#E8E0D0', '#FFF8F0', '#F0E8D8'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#2C2416', group: 'Style' },
    { key: 'cycleDuration', label: 'Cycle Duration (s)', type: 'number', defaultValue: 1.6, min: 0.5, max: 5, group: 'Timing' },
  ],
})
