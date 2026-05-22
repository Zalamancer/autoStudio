import { registerMotionGraphic } from '../registry'
import {
  KineticBase,
  type KineticBaseConfig,
  type KineticAnimation,
  type WordRenderProps,
  type BackgroundRenderProps,
} from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface PaintChipRevealConfig extends KineticBaseConfig {
  chipCount: number
}

function rand(s: number): number {
  const x = Math.sin(s * 127.1 + 311.7) * 43758.5453
  return x - Math.floor(x)
}

function easeOutBack(t: number): number {
  const c1 = 1.70158
  const c3 = c1 + 1
  return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2)
}

function easeOutExpo(t: number): number {
  return t === 1 ? 1 : 1 - Math.pow(2, -10 * t)
}

function easeInQuad(t: number): number {
  return t * t
}

// Generate irregular polygonal chip shapes
function genChip(seed: number, cx: number, cy: number, size: number) {
  const points: [number, number][] = []
  const numPoints = 5 + Math.floor(rand(seed) * 3)
  for (let i = 0; i < numPoints; i++) {
    const angle = (i / numPoints) * Math.PI * 2 + rand(seed + i * 31) * 0.6
    const r = size * (0.6 + rand(seed + i * 47) * 0.4)
    points.push([cx + Math.cos(angle) * r, cy + Math.sin(angle) * r])
  }
  return points.map(([x, y]) => `${x}px ${y}px`).join(',')
}

const animation: KineticAnimation = {
  renderBackground: ({ bgColor }: BackgroundRenderProps) => (
    <div style={{ position: 'absolute', inset: 0, background: bgColor }} />
  ),

  renderWord: ({ word, color, enterProgress, exitProgress, phase, index, frame, width, height }: WordRenderProps) => {
    const f = frame ?? 0
    const t = f / 30
    const cfg = (globalThis as any).__paintChipConfig ?? { chipCount: 30 }
    const chipCount = cfg.chipCount ?? 30

    let textOpacity = 0
    let textScale = 0.9

    if (phase === 'enter') {
      textOpacity = easeOutExpo(Math.max(0, (enterProgress - 0.15) / 0.85))
      textScale = 0.9 + textOpacity * 0.1
    } else if (phase === 'hold') {
      textOpacity = 1
      textScale = 1
    } else {
      textOpacity = 1 - easeInQuad(exitProgress)
      textScale = 1
    }

    // Generate paint chips scattered across the canvas
    const chips: React.ReactNode[] = []

    for (let c = 0; c < chipCount; c++) {
      const cx = rand(c * 41 + index) * width
      const cy = rand(c * 67 + index) * height
      const chipSize = 15 + rand(c * 53 + index) * 50
      const chipDelay = rand(c * 37 + index) * 0.6
      const chipSpeed = 0.3 + rand(c * 29 + index) * 0.2

      let chipProgress = 0
      let chipY = 0
      let chipRotate = 0
      let chipOpacity = 1
      let chipScaleY = 1

      if (phase === 'enter') {
        // Chips peel up and fly off downward
        const cp = Math.max(0, Math.min(1, (enterProgress - chipDelay) / chipSpeed))
        chipProgress = easeOutExpo(cp)
        // First curls up (scaleY decreases as if peeling)
        chipScaleY = cp < 0.4 ? 1 - cp * 1.5 : Math.max(0, 1 - cp)
        chipY = chipProgress * height * 0.4
        chipRotate = (rand(c * 83 + index) - 0.5) * 120 * chipProgress
        chipOpacity = 1 - chipProgress
      } else if (phase === 'hold') {
        chipOpacity = 0
      } else {
        // Chips flutter back in from top
        const cp = Math.max(0, Math.min(1, (exitProgress - chipDelay * 0.7) / 0.5))
        const ep = easeOutBack(Math.min(1, cp))
        chipY = -(1 - ep) * height * 0.4
        chipRotate = (rand(c * 83 + index) - 0.5) * 120 * (1 - ep)
        chipOpacity = ep
      }

      if (chipOpacity < 0.01) continue

      // Paint chip color: mix of paint color variations
      const chipHue = rand(c * 71 + index) * 30 - 15
      const paintAlpha = 0.85 + rand(c * 89 + index) * 0.15

      chips.push(
        <div
          key={c}
          style={{
            position: 'absolute',
            left: cx - chipSize / 2,
            top: cy - chipSize / 2 + chipY,
            width: chipSize,
            height: chipSize * (0.4 + rand(c * 61 + index) * 0.4),
            transform: `rotate(${(rand(c * 97 + index) - 0.5) * 30 + chipRotate}deg) scaleY(${chipScaleY})`,
            opacity: chipOpacity,
            borderRadius: `${rand(c * 43 + index) * 40}% ${rand(c * 57 + index) * 40}% ${rand(c * 71 + index) * 40}% ${rand(c * 85 + index) * 40}%`,
            background: `linear-gradient(
              ${rand(c * 99 + index) * 360}deg,
              hsl(${200 + chipHue}, 60%, ${35 + rand(c * 23 + index) * 20}%),
              hsl(${205 + chipHue}, 50%, ${45 + rand(c * 31 + index) * 15}%) 60%,
              hsl(${195 + chipHue}, 55%, ${30 + rand(c * 43 + index) * 20}%)
            )`,
            boxShadow: `0 2px 6px rgba(0,0,0,0.4), inset 0 -1px 3px rgba(0,0,0,0.2)`,
          }}
        />,
      )
    }

    // Exposed wall texture: rough plaster/substrate beneath paint
    const wallTexturePieces: React.ReactNode[] = []
    if (phase === 'enter' && enterProgress > 0.1) {
      for (let w = 0; w < 8; w++) {
        const wx = rand(w * 37 + index) * width
        const wy = rand(w * 53 + index) * height
        const wSize = 20 + rand(w * 71 + index) * 60
        const wAlpha = Math.min(0.5, enterProgress * 0.8) * (0.3 + rand(w * 89 + index) * 0.4)

        wallTexturePieces.push(
          <div
            key={`w${w}`}
            style={{
              position: 'absolute',
              left: wx,
              top: wy,
              width: wSize,
              height: wSize * (0.5 + rand(w * 97 + index) * 0.8),
              borderRadius: `${rand(w * 41) * 50}%`,
              background: `rgba(180,165,145,${wAlpha})`,
              filter: 'blur(1px)',
            }}
          />,
        )
      }
    }

    return (
      <div style={{ position: 'absolute', inset: 0, overflow: 'hidden' }}>
        {/* Wall texture exposed beneath paint */}
        {wallTexturePieces}

        {/* Text revealed as paint peels */}
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: `translate(-50%, -50%) scale(${textScale})`,
            fontFamily: "'Inter', 'Helvetica Neue', sans-serif",
            fontSize: 'clamp(40px, 12vw, 155px)',
            fontWeight: 800,
            color,
            whiteSpace: 'nowrap',
            letterSpacing: '0.04em',
            textTransform: 'uppercase',
            opacity: textOpacity,
            textShadow: `0 0 25px ${color}40, 2px 2px 0 rgba(0,0,0,0.3)`,
          }}
        >
          {word}
        </div>

        {/* Paint chips */}
        {chips}
      </div>
    )
  },
}

function PaintChipRevealComponent(props: MotionGraphicProps<PaintChipRevealConfig>) {
  ;(globalThis as any).__paintChipConfig = props.config
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-paint-chip-reveal',
  title: 'Kinetic Paint Chip Reveal',
  description: 'Irregular paint chips peel, curl and fly off the surface staggered across the frame, exposing text on the wall underneath',
  tags: ['kinetic', 'typography', 'paint', 'chip', 'peel', 'overlay', 'reveal', 'wall', 'flake'],
  category: 'captions',
  component: PaintChipRevealComponent as any,
  defaultConfig: {
    words: ['PEEL', 'CHIP', 'FLAKE', 'BARE'],
    colors: ['#F0E8D0', '#E8DABC', '#F8F0E0', '#DCCFAA'],
    bgColor: '#181210',
    cycleDuration: 1.6,
    chipCount: 30,
  },
  configSchema: [
    { key: 'words', label: 'Words', type: 'text-array', defaultValue: ['PEEL', 'CHIP', 'FLAKE', 'BARE'], group: 'Content' },
    { key: 'colors', label: 'Colors', type: 'text-array', defaultValue: ['#F0E8D0', '#E8DABC'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#181210', group: 'Style' },
    { key: 'cycleDuration', label: 'Cycle Duration (s)', type: 'number', defaultValue: 1.6, min: 0.5, max: 5, group: 'Timing' },
    { key: 'chipCount', label: 'Chip Count', type: 'number', defaultValue: 30, min: 10, max: 60, group: 'Animation' },
  ],
})
