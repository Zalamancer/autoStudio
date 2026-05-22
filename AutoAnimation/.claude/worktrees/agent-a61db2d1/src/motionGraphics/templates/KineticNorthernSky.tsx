import { registerMotionGraphic } from '../registry'
import { KineticBase, type KineticBaseConfig, type KineticAnimation, type WordRenderProps, type BackgroundRenderProps } from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface NorthernSkyConfig extends KineticBaseConfig {}

// Deterministic stars for the night sky
function seededStars(count: number) {
  const stars: { x: number; y: number; size: number; brightness: number }[] = []
  for (let i = 0; i < count; i++) {
    const h = (i * 2654435761) >>> 0
    stars.push({
      x: (h % 1000) / 10,
      y: ((h >> 10) % 500) / 10,  // only top half
      size: 1 + (h % 2),
      brightness: 0.4 + ((h >> 5) % 60) / 100,
    })
  }
  return stars
}

const STARS = seededStars(50)

const animation: KineticAnimation = {
  renderBackground: ({ bgColor, frame, fps, width, height }: BackgroundRenderProps) => {
    const time = frame / fps

    // Aurora band parameters
    const auroraBands = [
      { baseY: 25, color1: [0, 255, 100] as [number, number, number], color2: [0, 200, 255] as [number, number, number], amplitude: 8, speed: 0.3, width: 25 },
      { baseY: 35, color1: [100, 0, 255] as [number, number, number], color2: [0, 255, 150] as [number, number, number], amplitude: 10, speed: 0.25, width: 20 },
      { baseY: 30, color1: [0, 180, 255] as [number, number, number], color2: [150, 50, 255] as [number, number, number], amplitude: 6, speed: 0.35, width: 18 },
    ]

    return (
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: `linear-gradient(180deg, #050a15 0%, #0a1525 30%, ${bgColor} 70%, #0a0f20 100%)`,
        }}
      >
        {/* Stars */}
        {STARS.map((star, i) => {
          const twinkle = star.brightness * (0.7 + 0.3 * Math.sin(time * (1 + i * 0.1) + i))
          return (
            <div
              key={`star-${i}`}
              style={{
                position: 'absolute',
                left: `${star.x}%`,
                top: `${star.y}%`,
                width: star.size,
                height: star.size,
                borderRadius: '50%',
                background: '#fff',
                opacity: twinkle,
              }}
            />
          )
        })}

        {/* Aurora bands */}
        {auroraBands.map((band, bandIdx) => {
          // Create aurora using multiple gradient strips that wave
          const segments = 16
          const points: string[] = []
          const bottomPoints: string[] = []

          for (let s = 0; s <= segments; s++) {
            const xPct = (s / segments) * 100
            const xRad = (s / segments) * Math.PI * 3
            const wave = Math.sin(xRad + time * band.speed * Math.PI * 2) * band.amplitude
            const wave2 = Math.sin(xRad * 1.7 + time * band.speed * Math.PI * 1.5 + bandIdx) * band.amplitude * 0.5
            const yTop = band.baseY + wave + wave2
            const yBottom = yTop + band.width + Math.sin(xRad * 0.5 + time * 0.2) * 3
            points.push(`${xPct}% ${yTop}%`)
            bottomPoints.unshift(`${xPct}% ${yBottom}%`)
          }

          const clipPath = `polygon(${[...points, ...bottomPoints].join(', ')})`

          const r1 = band.color1[0] + (band.color2[0] - band.color1[0]) * ((Math.sin(time * 0.4 + bandIdx) + 1) / 2)
          const g1 = band.color1[1] + (band.color2[1] - band.color1[1]) * ((Math.sin(time * 0.4 + bandIdx) + 1) / 2)
          const b1 = band.color1[2] + (band.color2[2] - band.color1[2]) * ((Math.sin(time * 0.4 + bandIdx) + 1) / 2)

          const bandOpacity = 0.15 + Math.sin(time * 0.5 + bandIdx * 2) * 0.08

          return (
            <div
              key={`aurora-${bandIdx}`}
              style={{
                position: 'absolute',
                inset: 0,
                background: `linear-gradient(180deg, rgba(${Math.round(r1)},${Math.round(g1)},${Math.round(b1)},${bandOpacity}) 0%, rgba(${Math.round(r1)},${Math.round(g1)},${Math.round(b1)},${bandOpacity * 0.3}) 100%)`,
                clipPath,
                zIndex: bandIdx + 1,
              }}
            />
          )
        })}

        {/* Soft aurora glow reflection */}
        <div
          style={{
            position: 'absolute',
            bottom: 0,
            left: '20%',
            right: '20%',
            height: '20%',
            background: `radial-gradient(ellipse at 50% 0%, rgba(0,200,100,${0.04 + Math.sin(time * 0.3) * 0.02}), transparent 80%)`,
            zIndex: 4,
          }}
        />

        {/* Mountain/horizon silhouette */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: '#060c18',
            clipPath: 'polygon(0% 100%, 0% 88%, 5% 82%, 12% 85%, 18% 78%, 25% 83%, 30% 75%, 38% 80%, 45% 72%, 50% 77%, 55% 73%, 62% 78%, 68% 70%, 75% 76%, 80% 72%, 85% 78%, 92% 74%, 97% 80%, 100% 76%, 100% 100%)',
            zIndex: 5,
          }}
        />
      </div>
    )
  },

  renderWord: ({ word, color, enterProgress, exitProgress, phase, holdProgress }: WordRenderProps) => {
    let opacity = 0
    let translateY = 0
    let glowSize = 10

    if (phase === 'enter') {
      opacity = enterProgress
      translateY = (1 - enterProgress) * 15
      glowSize = enterProgress * 10
    } else if (phase === 'hold') {
      opacity = 1
      translateY = Math.sin(holdProgress * Math.PI * 2) * 3
      // Aurora-colored glow that shifts
      glowSize = 10 + Math.sin(holdProgress * Math.PI * 4) * 5
    } else {
      opacity = 1 - exitProgress
      translateY = -exitProgress * 10
    }

    const auroraGlowColor = `hsl(${140 + Math.sin((holdProgress || 0) * Math.PI * 2) * 40}, 80%, 60%)`

    return (
      <div
        style={{
          position: 'absolute',
          top: '45%',
          left: '50%',
          transform: `translate(-50%, calc(-50% + ${translateY}px))`,
          opacity,
          fontSize: 'clamp(44px, 12vw, 160px)',
          fontWeight: 600,
          textTransform: 'uppercase',
          letterSpacing: 8,
          color,
          textShadow: `0 0 ${glowSize}px ${auroraGlowColor}, 0 0 ${glowSize * 2.5}px ${auroraGlowColor}44, 0 2px 8px rgba(0,0,0,0.5)`,
          whiteSpace: 'nowrap',
          zIndex: 10,
        }}
      >
        {word}
      </div>
    )
  },
}

function NorthernSkyComponent(props: MotionGraphicProps<NorthernSkyConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-northern-sky',
  title: 'Kinetic Northern Sky',
  description: 'Northern lights aurora bands waving across a dark starry sky with mountain silhouette and majestic text',
  tags: ['kinetic', 'typography', 'aurora', 'northern-lights', 'sky', 'stars', 'nature', 'majestic', 'arctic'],
  category: 'captions',
  component: NorthernSkyComponent as any,
  defaultConfig: {
    words: ['AURORA', 'NORTH', 'SKY', 'LIGHT'],
    colors: ['#00FF88', '#00CCFF', '#BB77FF', '#66FFAA'],
    bgColor: '#0a1525',
    cycleDuration: 1.5,
  },
  configSchema: [
    { key: 'words', label: 'Words', type: 'text-array', defaultValue: ['AURORA', 'NORTH', 'SKY', 'LIGHT'], group: 'Content' },
    { key: 'colors', label: 'Colors', type: 'text-array', defaultValue: ['#00FF88', '#00CCFF', '#BB77FF', '#66FFAA'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#0a1525', group: 'Style' },
    { key: 'cycleDuration', label: 'Cycle Duration (s)', type: 'number', defaultValue: 1.5, min: 0.3, max: 5, group: 'Timing' },
  ],
})
