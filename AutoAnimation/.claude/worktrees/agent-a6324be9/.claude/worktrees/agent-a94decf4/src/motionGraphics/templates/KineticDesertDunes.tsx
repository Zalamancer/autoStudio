import { registerMotionGraphic } from '../registry'
import { KineticBase, type KineticBaseConfig, type KineticAnimation, type WordRenderProps, type BackgroundRenderProps } from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface DesertDunesConfig extends KineticBaseConfig {}

// Deterministic sand particles
function seededSand(count: number) {
  const particles: { x: number; y: number; size: number; speed: number; phase: number }[] = []
  for (let i = 0; i < count; i++) {
    const h = (i * 2654435761) >>> 0
    particles.push({
      x: (h % 1000) / 10,
      y: 30 + (h % 500) / 10,
      size: 1 + (h % 2),
      speed: 5 + (h % 15),
      phase: ((h >> 10) % 628) / 100,
    })
  }
  return particles
}

const SAND_PARTICLES = seededSand(30)

const animation: KineticAnimation = {
  renderBackground: ({ bgColor, frame, fps, width, height }: BackgroundRenderProps) => {
    const time = frame / fps

    // Dune wave shapes using clip-path polygons
    const duneWave = (baseY: number, amplitude: number, frequency: number, phase: number, segments: number): string => {
      const points: string[] = []
      for (let s = 0; s <= segments; s++) {
        const xPct = (s / segments) * 100
        const xRad = (s / segments) * Math.PI * 2 * frequency + phase
        const yPct = baseY + Math.sin(xRad) * amplitude + Math.sin(xRad * 2.3 + 1) * amplitude * 0.3
        points.push(`${xPct}% ${yPct}%`)
      }
      points.push('100% 100%', '0% 100%')
      return `polygon(${points.join(', ')})`
    }

    const windDrift = Math.sin(time * 0.15) * 0.2

    return (
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: `linear-gradient(180deg, #FF6B35 0%, #FF8C42 20%, #FFB347 40%, ${bgColor} 70%, #C68B3E 100%)`,
        }}
      >
        {/* Sun in desert sky */}
        <div
          style={{
            position: 'absolute',
            top: '15%',
            left: '65%',
            width: 40,
            height: 40,
            borderRadius: '50%',
            background: 'radial-gradient(circle, #FFF8DC, #FFD700, #FF8C00)',
            boxShadow: '0 0 60px 30px rgba(255,200,50,0.2), 0 0 120px 60px rgba(255,150,0,0.08)',
          }}
        />

        {/* Heat haze shimmer */}
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: 0,
            right: 0,
            height: '10%',
            background: 'linear-gradient(180deg, transparent, rgba(255,200,100,0.04), transparent)',
            opacity: 0.5 + Math.sin(time * 2) * 0.3,
          }}
        />

        {/* Back dune */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: '#C68B3E',
            clipPath: duneWave(68, 5, 1.2, windDrift, 24),
            opacity: 0.6,
            zIndex: 1,
          }}
        />

        {/* Mid dune */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: '#B37A2E',
            clipPath: duneWave(75, 6, 0.8, windDrift + 1.5, 24),
            opacity: 0.75,
            zIndex: 2,
          }}
        />

        {/* Front dune */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: 'linear-gradient(90deg, #A0692E, #C68B3E)',
            clipPath: duneWave(82, 4, 1.5, windDrift + 3, 24),
            opacity: 0.9,
            zIndex: 3,
          }}
        />

        {/* Dune ridge highlights */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: 'rgba(255,220,150,0.15)',
            clipPath: duneWave(81, 4, 1.5, windDrift + 3, 24),
            zIndex: 4,
          }}
        />

        {/* Drifting sand particles */}
        {SAND_PARTICLES.map((p, i) => {
          const xOffset = (time * p.speed + p.phase * 100) % 120 - 10
          const yJitter = Math.sin(time * 1.5 + p.phase) * 3
          return (
            <div
              key={i}
              style={{
                position: 'absolute',
                left: `${xOffset}%`,
                top: `${p.y + yJitter}%`,
                width: p.size,
                height: p.size,
                borderRadius: '50%',
                background: 'rgba(210,180,120,0.4)',
                zIndex: 5,
              }}
            />
          )
        })}
      </div>
    )
  },

  renderWord: ({ word, color, enterProgress, exitProgress, phase, holdProgress }: WordRenderProps) => {
    let opacity = 0
    let translateY = 0
    let blur = 0

    if (phase === 'enter') {
      opacity = enterProgress
      translateY = (1 - enterProgress) * 15
      blur = (1 - enterProgress) * 2
    } else if (phase === 'hold') {
      opacity = 1
      // Slight heat-shimmer wobble
      translateY = Math.sin(holdProgress * Math.PI * 4) * 2
    } else {
      opacity = 1 - exitProgress
      blur = exitProgress * 3
    }

    return (
      <div
        style={{
          position: 'absolute',
          top: '40%',
          left: '50%',
          transform: `translate(-50%, calc(-50% + ${translateY}px))`,
          opacity,
          filter: blur > 0 ? `blur(${blur}px)` : undefined,
          fontSize: 'clamp(44px, 12vw, 160px)',
          fontWeight: 700,
          color,
          textShadow: `0 2px 8px rgba(0,0,0,0.3), 0 0 20px ${color}33`,
          whiteSpace: 'nowrap',
          letterSpacing: 6,
          zIndex: 10,
        }}
      >
        {word}
      </div>
    )
  },
}

function DesertDunesComponent(props: MotionGraphicProps<DesertDunesConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-desert-dunes',
  title: 'Kinetic Desert Dunes',
  description: 'Desert sunset with layered sand dune silhouettes, drifting sand particles, and warm golden text',
  tags: ['kinetic', 'typography', 'desert', 'dunes', 'sand', 'sunset', 'nature', 'warm', 'zen'],
  category: 'captions',
  component: DesertDunesComponent as any,
  defaultConfig: {
    words: ['VAST', 'SAND', 'DUNE', 'GOLD'],
    colors: ['#FFF8DC', '#FFE4B5', '#FFDAB9', '#FFD700'],
    bgColor: '#D4903C',
    cycleDuration: 1.5,
  },
  configSchema: [
    { key: 'words', label: 'Words', type: 'text-array', defaultValue: ['VAST', 'SAND', 'DUNE', 'GOLD'], group: 'Content' },
    { key: 'colors', label: 'Colors', type: 'text-array', defaultValue: ['#FFF8DC', '#FFE4B5', '#FFDAB9', '#FFD700'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#D4903C', group: 'Style' },
    { key: 'cycleDuration', label: 'Cycle Duration (s)', type: 'number', defaultValue: 1.5, min: 0.3, max: 5, group: 'Timing' },
  ],
})
