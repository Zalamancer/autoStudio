import { registerMotionGraphic } from '../registry'
import {
  KineticBase,
  type KineticBaseConfig,
  type KineticAnimation,
  type WordRenderProps,
  type BackgroundRenderProps,
} from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface ErosionConfig extends KineticBaseConfig {}

/** Deterministic pseudo-random 0..1 from integer seed */
function rand(s: number): number {
  const x = Math.sin(s * 127.1 + 311.7) * 43758.5453
  return x - Math.floor(x)
}

const animation: KineticAnimation = {
  renderBackground: ({ bgColor, width, height, frame }: BackgroundRenderProps) => {
    // Wind-swept dust environment
    const dustLines: { x: number; y: number; len: number; opacity: number }[] = []
    for (let i = 0; i < 8; i++) {
      const speed = 1.5 + rand(i * 23) * 2
      const xPos = ((frame * speed + i * width / 8) % (width * 1.5)) - width * 0.25
      dustLines.push({
        x: xPos,
        y: rand(i * 67 + 11) * height,
        len: 30 + rand(i * 41) * 60,
        opacity: 0.04 + rand(i * 13) * 0.06,
      })
    }

    return (
      <div style={{ position: 'absolute', inset: 0, background: bgColor }}>
        {/* Wind streak lines */}
        <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}>
          {dustLines.map((dl, i) => (
            <line
              key={i}
              x1={dl.x}
              y1={dl.y}
              x2={dl.x + dl.len}
              y2={dl.y + (rand(i * 31) - 0.5) * 5}
              stroke="#8B7D6B"
              strokeWidth={1}
              opacity={dl.opacity}
              strokeLinecap="round"
            />
          ))}
        </svg>
      </div>
    )
  },

  renderWord: ({ word, color, enterProgress, holdProgress, exitProgress, phase, index, frame }: WordRenderProps) => {
    const f = frame ?? 0
    const seed = index * 139 + 79
    const chars = word.split('')

    // Wind-carried stone dust particles
    const dustParticles: { x: number; y: number; size: number; opacity: number }[] = []

    const charElements = chars.map((ch, ci) => {
      const charSeed = ci * 71 + seed
      // Each character has unique erosion characteristics
      const erosionVulnerability = rand(charSeed) * 0.3 // some chars erode faster
      let charOpacity = 1
      let tx = 0
      let ty = 0
      let scaleX = 1
      let scaleY = 1
      let skewX = 0
      let clipPath = 'none'
      let filter = 'none'

      if (phase === 'enter') {
        // Stone materializes: rough edges sharpen
        const charDelay = rand(charSeed + 50) * 0.3
        const charProgress = Math.max(0, Math.min(1, (enterProgress - charDelay) / 0.7))
        const eased = 1 - Math.pow(1 - charProgress, 2)

        charOpacity = eased
        scaleX = 0.8 + eased * 0.2
        scaleY = 0.8 + eased * 0.2

        // Rough/grainy appearance during formation
        if (charProgress < 0.7) {
          const grain = (1 - charProgress / 0.7)
          filter = `contrast(${1 + grain * 0.3}) brightness(${0.9 + grain * 0.2})`
        }
      } else if (phase === 'hold') {
        // Slow weathering: micro-vibrations from wind
        const windPush = Math.sin(holdProgress * Math.PI * 5 + ci * 1.3) * 1
        const settle = Math.cos(holdProgress * Math.PI * 3 + ci * 0.8) * 0.5
        tx = windPush
        ty = settle
        charOpacity = 0.95 + Math.sin(holdProgress * Math.PI * 2 + ci) * 0.05

        // Slight erosion even during hold for exposed chars
        if (erosionVulnerability > 0.2) {
          const erode = holdProgress * erosionVulnerability * 0.1
          scaleX = 1 - erode
          scaleY = 1 - erode * 0.5
        }
      } else {
        // Erosion: characters wear away with wind, edges crumble first
        const erodeDelay = erosionVulnerability * 0.2
        const erodeProgress = Math.max(0, Math.min(1, (exitProgress - erodeDelay) / (0.8 - erodeDelay)))

        if (erodeProgress > 0) {
          const eased = Math.pow(erodeProgress, 1.2)

          // Wind-pushed lean
          skewX = eased * 8
          tx = eased * 15

          // Progressive shrinking as material erodes
          scaleX = Math.max(0.3, 1 - eased * 0.5)
          scaleY = Math.max(0.4, 1 - eased * 0.4)

          // Top erodes faster than bottom (wind-worn)
          const clipTop = Math.min(50, eased * 60)
          // Irregular erosion edge using polygon
          const edge1 = clipTop + Math.sin(eased * 5 + ci * 2) * 5
          const edge2 = clipTop + Math.sin(eased * 7 + ci * 3.5) * 8
          const edge3 = clipTop + Math.sin(eased * 3 + ci * 1.5) * 4
          clipPath = `polygon(0% ${edge1}%, 25% ${edge2}%, 50% ${edge3}%, 75% ${edge1}%, 100% ${edge2}%, 100% 100%, 0% 100%)`

          charOpacity = Math.max(0, 1 - eased * 0.8)

          // Grainy texture as it erodes
          filter = `contrast(${1 + eased * 0.5}) brightness(${1 - eased * 0.3})`

          // Generate dust being blown off
          if (erodeProgress < 0.9) {
            for (let p = 0; p < 2; p++) {
              const pSeed = ci * 47 + p * 61 + seed
              dustParticles.push({
                x: ci * 48 + rand(pSeed) * 20 + erodeProgress * 40,
                y: -20 + rand(pSeed + 10) * 30 + Math.sin(erodeProgress * Math.PI + p) * 15,
                size: 1 + rand(pSeed + 20) * 2 * (1 - erodeProgress),
                opacity: (1 - erodeProgress) * 0.4,
              })
            }
          }
        }
      }

      return (
        <span
          key={ci}
          style={{
            display: 'inline-block',
            color,
            opacity: charOpacity,
            transform: `translate(${tx}px, ${ty}px) scaleX(${scaleX}) scaleY(${scaleY}) skewX(${skewX}deg)`,
            transformOrigin: 'center bottom',
            clipPath: clipPath !== 'none' ? clipPath : undefined,
            filter: filter !== 'none' ? filter : undefined,
            transition: 'none',
            textShadow: `1px 1px 0 rgba(0,0,0,0.2), -1px -1px 0 rgba(255,255,255,0.05)`,
          }}
        >
          {ch}
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
          fontFamily: "'Georgia', 'Times New Roman', serif",
          fontSize: 'clamp(40px, 12vw, 160px)',
          fontWeight: 700,
          whiteSpace: 'nowrap',
          letterSpacing: 4,
        }}
      >
        {charElements}
        {/* Wind-blown dust particles */}
        {dustParticles.map((dp, i) => (
          <div
            key={`dp-${i}`}
            style={{
              position: 'absolute',
              top: '50%',
              left: '10%',
              width: dp.size,
              height: dp.size,
              borderRadius: '50%',
              background: '#A09080',
              opacity: dp.opacity,
              transform: `translate(${dp.x}px, ${dp.y}px)`,
            }}
          />
        ))}
      </div>
    )
  },
}

function ErosionComponent(props: MotionGraphicProps<ErosionConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-erosion',
  title: 'Kinetic Erosion',
  description:
    'Text slowly erodes like ancient weathered stone. Wind-worn edges crumble with irregular clip paths, characters lean under wind force, and stone dust blows away.',
  tags: ['kinetic', 'typography', 'erosion', 'stone', 'weathered', 'wind', 'ancient', 'destruction'],
  category: 'captions',
  component: ErosionComponent as any,
  defaultConfig: {
    words: ['STONE', 'ERODE', 'ANCIENT', 'RUIN'],
    colors: ['#A09080', '#B8A896', '#C4B8A8', '#8E8070'],
    bgColor: '#1a1814',
    cycleDuration: 2.0,
  },
  configSchema: [
    { key: 'words', label: 'Words', type: 'text-array', defaultValue: ['STONE', 'ERODE', 'ANCIENT', 'RUIN'], group: 'Content' },
    { key: 'colors', label: 'Colors', type: 'text-array', defaultValue: ['#A09080', '#B8A896', '#C4B8A8', '#8E8070'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#1a1814', group: 'Style' },
    { key: 'cycleDuration', label: 'Cycle Duration (s)', type: 'number', defaultValue: 2.0, min: 0.5, max: 5, group: 'Timing' },
  ],
})
