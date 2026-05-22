import { registerMotionGraphic } from '../registry'
import { KineticBase, type KineticBaseConfig, type KineticAnimation, type WordRenderProps, type BackgroundRenderProps } from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface DNASequenceConfig extends KineticBaseConfig {}

function seededRand(seed: number): number {
  const x = Math.sin(seed * 9301 + 49297) * 49297
  return x - Math.floor(x)
}

const BASE_PAIRS = ['A', 'T', 'G', 'C']
const BAND_COLORS = ['rgba(0, 255, 180, 0.7)', 'rgba(0, 200, 255, 0.6)', 'rgba(120, 80, 255, 0.5)', 'rgba(255, 100, 200, 0.4)']

const animation: KineticAnimation = {
  renderBackground: ({ bgColor, width, height, frame }: BackgroundRenderProps) => {
    // Gel electrophoresis lanes
    const laneCount = 8
    const laneWidth = width / laneCount
    const bands: React.ReactNode[] = []

    for (let lane = 0; lane < laneCount; lane++) {
      const laneX = lane * laneWidth + laneWidth * 0.2
      const bw = laneWidth * 0.6
      const bandCount = 6 + Math.floor(seededRand(lane * 7 + 3) * 6)

      for (let b = 0; b < bandCount; b++) {
        const seed = lane * 100 + b
        const baseY = (b + 1) * (height / (bandCount + 2))
        const drift = Math.sin(frame * 0.02 + seed * 0.5) * 1.5
        const bandIntensity = 0.3 + seededRand(seed + 42) * 0.7
        const bandH = 3 + seededRand(seed + 11) * 4
        const colorIdx = Math.floor(seededRand(seed + 77) * BAND_COLORS.length)

        bands.push(
          <rect
            key={`b${lane}-${b}`}
            x={laneX}
            y={baseY + drift}
            width={bw}
            height={bandH}
            rx={1}
            fill={BAND_COLORS[colorIdx]}
            opacity={bandIntensity}
          />
        )
      }
    }

    // Base pair ladder on the right side
    const ladderX = width - 40
    const ladderBands: React.ReactNode[] = []
    for (let i = 0; i < 20; i++) {
      const y = 20 + i * ((height - 40) / 20)
      const bp = BASE_PAIRS[i % 4]
      ladderBands.push(
        <g key={`lad${i}`}>
          <rect x={ladderX} y={y} width={24} height={3} rx={1} fill="rgba(255,255,255,0.15)" />
          <text x={ladderX + 28} y={y + 3} fill="rgba(255,255,255,0.25)" fontSize={7} fontFamily="monospace">{bp}</text>
        </g>
      )
    }

    return (
      <div style={{ position: 'absolute', inset: 0, background: bgColor }}>
        <svg width={width} height={height} style={{ position: 'absolute', inset: 0 }}>
          {/* Lane dividers */}
          {Array.from({ length: laneCount + 1 }).map((_, i) => (
            <line
              key={`ln${i}`}
              x1={i * laneWidth} y1={0}
              x2={i * laneWidth} y2={height}
              stroke="rgba(100, 200, 255, 0.08)"
              strokeWidth={1}
            />
          ))}
          {bands}
          {ladderBands}
        </svg>
        {/* UV illumination glow */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: 'radial-gradient(ellipse at center, rgba(60, 0, 180, 0.12) 0%, transparent 70%)',
            pointerEvents: 'none',
          }}
        />
        {/* Top well openings */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: 12,
            background: 'linear-gradient(180deg, rgba(20,30,60,0.9) 0%, transparent 100%)',
          }}
        />
      </div>
    )
  },

  renderWord: ({ word, color, enterProgress, holdProgress, exitProgress, phase, frame }: WordRenderProps) => {
    const f = frame ?? 0
    // UV flicker effect
    const uvFlicker = 0.92 + Math.sin(f * 0.4) * 0.08

    if (phase === 'enter') {
      // Text revealed as fluorescent bands from top to bottom
      const revealY = enterProgress * 100
      const glow = enterProgress * 15
      return (
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            fontFamily: "'Courier New', monospace",
            fontSize: 'clamp(38px, 10vw, 140px)',
            fontWeight: 700,
            color,
            textShadow: `0 0 ${glow}px ${color}, 0 0 ${glow * 2}px rgba(60, 0, 180, 0.4)`,
            whiteSpace: 'nowrap',
            letterSpacing: 8,
            clipPath: `inset(0 0 ${100 - revealY}% 0)`,
            opacity: Math.min(1, enterProgress * 2),
          }}
        >
          {word}
        </div>
      )
    } else if (phase === 'hold') {
      // Fluorescent glow pulsing under UV
      const pulse = 0.85 + Math.sin(holdProgress * Math.PI * 4) * 0.15
      return (
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            fontFamily: "'Courier New', monospace",
            fontSize: 'clamp(38px, 10vw, 140px)',
            fontWeight: 700,
            color,
            textShadow: `0 0 15px ${color}, 0 0 35px rgba(60, 0, 180, 0.5), 0 0 60px rgba(0, 200, 255, 0.15)`,
            whiteSpace: 'nowrap',
            letterSpacing: 8,
            opacity: pulse * uvFlicker,
          }}
        >
          {word}
        </div>
      )
    } else {
      // Fade out like UV lamp switching off
      const opacity = (1 - exitProgress) * uvFlicker
      return (
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            fontFamily: "'Courier New', monospace",
            fontSize: 'clamp(38px, 10vw, 140px)',
            fontWeight: 700,
            color,
            textShadow: `0 0 ${(1 - exitProgress) * 15}px ${color}`,
            whiteSpace: 'nowrap',
            letterSpacing: 8,
            opacity,
            filter: `blur(${exitProgress * 2}px)`,
          }}
        >
          {word}
        </div>
      )
    }
  },
}

function DNASequenceComponent(props: MotionGraphicProps<DNASequenceConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-dna-sequence',
  title: 'Kinetic DNA Sequence',
  description: 'DNA gel electrophoresis with fluorescent bands on dark gel, UV illumination, base pair ladder, laboratory blue tones',
  tags: ['kinetic', 'typography', 'dna', 'gel', 'electrophoresis', 'science', 'laboratory', 'genetics'],
  category: 'captions',
  component: DNASequenceComponent as any,
  defaultConfig: {
    words: ['GENOME', 'HELIX', 'STRAND', 'CODE'],
    colors: ['#00FFB4', '#00CCFF', '#8855FF', '#FF66CC'],
    bgColor: '#080818',
    cycleDuration: 1.3,
  },
  configSchema: [
    { key: 'words', label: 'Words', type: 'text-array', defaultValue: ['GENOME', 'HELIX', 'STRAND', 'CODE'], group: 'Content' },
    { key: 'colors', label: 'Colors', type: 'text-array', defaultValue: ['#00FFB4', '#00CCFF', '#8855FF', '#FF66CC'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#080818', group: 'Style' },
    { key: 'cycleDuration', label: 'Cycle Duration (s)', type: 'number', defaultValue: 1.3, min: 0.3, max: 5, group: 'Timing' },
  ],
})
