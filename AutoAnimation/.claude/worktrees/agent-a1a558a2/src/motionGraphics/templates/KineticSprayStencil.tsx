import { registerMotionGraphic } from '../registry'
import { KineticBase, type KineticBaseConfig, type KineticAnimation, type WordRenderProps, type BackgroundRenderProps } from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface SprayStencilConfig extends KineticBaseConfig {}

/** Deterministic pseudo-random 0..1 from integer seed */
function rand(s: number): number {
  const x = Math.sin(s * 127.1 + 311.7) * 43758.5453
  return x - Math.floor(x)
}

const animation: KineticAnimation = {
  renderBackground: ({ bgColor }: BackgroundRenderProps) => (
    <div style={{ position: 'absolute', inset: 0, background: bgColor }}>
      {/* Concrete wall texture — horizontal trowel lines */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          backgroundImage: [
            'repeating-linear-gradient(0deg, transparent, transparent 18px, rgba(0,0,0,0.04) 18px, rgba(0,0,0,0.04) 19px)',
            'repeating-linear-gradient(90deg, transparent, transparent 60px, rgba(0,0,0,0.02) 60px, rgba(0,0,0,0.02) 61px)',
          ].join(', '),
        }}
      />
      {/* Weathering stains */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: '20%',
          width: '30%',
          height: '100%',
          background: 'linear-gradient(180deg, rgba(0,0,0,0.06) 0%, transparent 40%)',
        }}
      />
      <div
        style={{
          position: 'absolute',
          top: 0,
          right: '10%',
          width: '15%',
          height: '100%',
          background: 'linear-gradient(180deg, rgba(60,40,20,0.04) 0%, transparent 60%)',
        }}
      />
      {/* Small cracks in wall */}
      {Array.from({ length: 3 }, (_, i) => {
        const s = i * 97 + 13
        return (
          <div
            key={i}
            style={{
              position: 'absolute',
              left: `${20 + rand(s) * 60}%`,
              top: `${10 + rand(s + 1) * 70}%`,
              width: 30 + rand(s + 2) * 50,
              height: 1,
              background: 'rgba(0,0,0,0.08)',
              transform: `rotate(${-20 + rand(s + 3) * 40}deg)`,
            }}
          />
        )
      })}
    </div>
  ),

  renderWord: ({ word, color, enterProgress, holdProgress, exitProgress, phase, index }: WordRenderProps) => {
    const seed = index * 67 + 31

    // Stencil spray animation: paint fills from center outward
    let sprayProgress = 0
    let opacity = 0
    let dripProgress = 0

    if (phase === 'enter') {
      // Spray builds up — overspray halo appears first, then solid text
      const t = enterProgress
      sprayProgress = t < 0.3 ? 0 : Math.min(1, (t - 0.3) / 0.7)
      opacity = Math.min(1, t * 2)
      dripProgress = 0
    } else if (phase === 'hold') {
      sprayProgress = 1
      opacity = 1
      dripProgress = Math.min(1, holdProgress * 1.5)
    } else {
      sprayProgress = 1
      opacity = 1 - exitProgress * 0.8
      dripProgress = 1
    }

    // Paint drips — gravity pulls paint down from text
    const dripCount = 4
    const drips = Array.from({ length: dripCount }, (_, i) => {
      const ds = seed + i * 41
      const x = 25 + rand(ds) * 50
      const dripLen = 20 + rand(ds + 1) * 60
      const dripWidth = 2 + rand(ds + 2) * 3
      const dripDelay = rand(ds + 3) * 0.4

      const currentDrip = Math.max(0, Math.min(1, (dripProgress - dripDelay) / (1 - dripDelay)))

      return (
        <div
          key={i}
          style={{
            position: 'absolute',
            left: `${x}%`,
            top: '60%',
            width: dripWidth,
            height: dripLen * currentDrip,
            background: `linear-gradient(180deg, ${color}, ${color}80, transparent)`,
            borderRadius: '0 0 2px 2px',
            opacity: opacity * 0.7,
          }}
        />
      )
    })

    // Overspray halo particles
    const haloCount = 12
    const haloParticles = Array.from({ length: haloCount }, (_, i) => {
      const hs = seed + i * 29 + 100
      const angle = (i / haloCount) * Math.PI * 2
      const dist = 8 + rand(hs) * 25
      const size = 2 + rand(hs + 1) * 4
      const pOpacity = 0.15 + rand(hs + 2) * 0.2

      const px = Math.cos(angle) * dist
      const py = Math.sin(angle) * dist

      const haloVis = phase === 'enter' ? Math.min(1, enterProgress * 3) : phase === 'exit' ? 1 - exitProgress : 1

      return (
        <div
          key={i}
          style={{
            position: 'absolute',
            left: `calc(50% + ${px}px)`,
            top: `calc(50% + ${py}px)`,
            width: size,
            height: size,
            borderRadius: '50%',
            background: color,
            opacity: pOpacity * haloVis,
            filter: 'blur(2px)',
          }}
        />
      )
    })

    // Stencil cutout edges — slight paint bleeding under stencil
    const edgeBlur = sprayProgress > 0.5 ? 0 : 2 - sprayProgress * 4

    return (
      <div style={{ position: 'absolute', inset: 0, opacity }}>
        {/* Overspray halo behind text */}
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: '80%',
            height: '60%',
          }}
        >
          {haloParticles}
        </div>

        {/* Overspray mist — radial glow */}
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: '110%',
            height: '80%',
            background: `radial-gradient(ellipse at 50% 50%, ${color}12 0%, ${color}08 30%, transparent 70%)`,
            filter: 'blur(8px)',
          }}
        />

        {/* Main stencil text */}
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            fontFamily: "'Impact', 'Arial Black', 'Helvetica Neue', sans-serif",
            fontSize: 'clamp(48px, 14vw, 180px)',
            fontWeight: 900,
            textTransform: 'uppercase',
            letterSpacing: 8,
            color,
            whiteSpace: 'nowrap',
            // Stencil effect: sharp, high-contrast, slight texture
            textShadow: `0 0 ${2 + edgeBlur}px ${color}60`,
            // Clip reveal from center — simulates spray building up
            clipPath: sprayProgress < 1
              ? `inset(${(1 - sprayProgress) * 30}% ${(1 - sprayProgress) * 15}% ${(1 - sprayProgress) * 30}% ${(1 - sprayProgress) * 15}%)`
              : 'none',
          }}
        >
          {word}
        </div>

        {/* Stencil bridge marks — small gaps typical of real stencils */}
        {word.length > 2 && (
          <>
            <div
              style={{
                position: 'absolute',
                top: '47%',
                left: '48%',
                width: 3,
                height: 'clamp(8px, 2vw, 16px)',
                background: 'rgba(120,115,105,0.6)',
                opacity: sprayProgress > 0.8 ? 0.4 : 0,
              }}
            />
            <div
              style={{
                position: 'absolute',
                top: '53%',
                left: '55%',
                width: 3,
                height: 'clamp(6px, 1.5vw, 12px)',
                background: 'rgba(120,115,105,0.6)',
                opacity: sprayProgress > 0.8 ? 0.3 : 0,
              }}
            />
          </>
        )}

        {/* Paint drips */}
        {drips}
      </div>
    )
  },
}

function SprayStencilComponent(props: MotionGraphicProps<SprayStencilConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-spray-stencil',
  title: 'Kinetic Spray Stencil',
  description: 'Spray paint stencil on concrete wall — text sprayed through cardboard cutout with overspray halo, paint drips, and Banksy-style street art aesthetic',
  tags: ['kinetic', 'typography', 'spray', 'stencil', 'graffiti', 'banksy', 'street-art', 'urban', 'concrete'],
  category: 'captions',
  component: SprayStencilComponent as any,
  defaultConfig: {
    words: ['REBEL', 'PAINT', 'WALLS', 'FREE'],
    colors: ['#e01020', '#e01020', '#1a1a1a', '#e01020'],
    bgColor: '#8a8378',
    cycleDuration: 1.4,
  },
  configSchema: [
    { key: 'words', label: 'Words', type: 'text-array', defaultValue: ['REBEL', 'PAINT', 'WALLS', 'FREE'], group: 'Content' },
    { key: 'colors', label: 'Colors', type: 'text-array', defaultValue: ['#e01020', '#e01020', '#1a1a1a', '#e01020'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#8a8378', group: 'Style' },
    { key: 'cycleDuration', label: 'Cycle Duration (s)', type: 'number', defaultValue: 1.4, min: 0.3, max: 5, group: 'Timing' },
  ],
})
