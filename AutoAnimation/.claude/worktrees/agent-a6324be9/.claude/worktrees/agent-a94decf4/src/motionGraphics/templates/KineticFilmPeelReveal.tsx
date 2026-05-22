import { registerMotionGraphic } from '../registry'
import {
  KineticBase,
  type KineticBaseConfig,
  type KineticAnimation,
  type WordRenderProps,
  type BackgroundRenderProps,
} from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface FilmPeelRevealConfig extends KineticBaseConfig {
  peelCorner: number
}

function rand(s: number): number {
  const x = Math.sin(s * 127.1 + 311.7) * 43758.5453
  return x - Math.floor(x)
}

function easeOutExpo(t: number): number {
  return t === 1 ? 1 : 1 - Math.pow(2, -10 * t)
}

function easeInQuad(t: number): number {
  return t * t
}

const animation: KineticAnimation = {
  renderBackground: ({ bgColor }: BackgroundRenderProps) => (
    <div style={{ position: 'absolute', inset: 0, background: bgColor }} />
  ),

  renderWord: ({ word, color, enterProgress, holdProgress, exitProgress, phase, index, frame, width, height }: WordRenderProps) => {
    const f = frame ?? 0
    const t = f / 30
    const cfg = (globalThis as any).__filmPeelConfig ?? { peelCorner: 0 }
    const peelCorner = cfg.peelCorner ?? 0

    // Protective film peels diagonally from a corner
    // 0 = top-left, 1 = top-right, 2 = bottom-left, 3 = bottom-right
    const corners = [
      { startX: 0, startY: 0, dirX: 1, dirY: 1 },
      { startX: 1, startY: 0, dirX: -1, dirY: 1 },
      { startX: 0, startY: 1, dirX: 1, dirY: -1 },
      { startX: 1, startY: 1, dirX: -1, dirY: -1 },
    ]
    const corner = corners[peelCorner % 4]

    let peelProgress = 0
    let textOpacity = 0
    let textScale = 0.95

    if (phase === 'enter') {
      peelProgress = easeOutExpo(enterProgress)
      textOpacity = easeOutExpo(Math.max(0, (enterProgress - 0.12) / 0.88))
      textScale = 0.95 + textOpacity * 0.05
    } else if (phase === 'hold') {
      peelProgress = 1
      textOpacity = 1
      textScale = 1
    } else {
      peelProgress = 1 - easeInQuad(exitProgress)
      textOpacity = 1 - easeInQuad(exitProgress)
    }

    // The film peel is represented by:
    // 1. A diagonal clip path that reveals from one corner
    // 2. A curling tab at the peel front
    // 3. A highlight/shadow on the peel curl

    // The peel sweeps diagonally — coverage is via a triangle/quadrilateral clip path
    // Peel front line angle: diagonal from peel corner
    const peelDist = peelProgress * Math.sqrt(width * width + height * height) * 1.1

    // Corner origin in pixels
    const originX = corner.startX * width
    const originY = corner.startY * height

    // The film remaining is a polygon from the corner that shrinks as peel advances
    // We model it as a translucent blue-tinted protective sheet

    // Peel front: a curved curl visible at the peel edge
    const frontX = originX + corner.dirX * peelDist * 0.707 * width / Math.sqrt(width * width + height * height) * Math.sqrt(width * width + height * height) / Math.max(width, height)
    const frontY = originY + corner.dirY * peelDist * 0.707

    const clampedFX = Math.max(0, Math.min(width, originX + corner.dirX * peelDist * 0.71))
    const clampedFY = Math.max(0, Math.min(height, originY + corner.dirY * peelDist * 0.71))

    // Per-character tint (protective film color overlay)
    const filmAlpha = (1 - peelProgress) * 0.5

    // Shimmer on film (refractive tint)
    const filmShimmer = Math.sin(t * 0.8 + (peelProgress * 3)) * 0.05

    // Peel curl shadow/highlight
    const curlProgress = Math.min(1, peelProgress * 1.4)
    const curlSize = 40 + curlProgress * 30
    const curlX = originX + corner.dirX * clampedFX * peelProgress
    const curlY = originY + corner.dirY * clampedFY * peelProgress

    // Adhesive residue dots (visible as film leaves the surface)
    const residueDots: React.ReactNode[] = []
    if (peelProgress > 0.1 && peelProgress < 0.95) {
      for (let d = 0; d < 12; d++) {
        const dx = rand(d * 41 + index) * peelDist * 0.7
        const dy = rand(d * 67 + index) * peelDist * 0.7
        const dotX = originX + corner.dirX * dx
        const dotY = originY + corner.dirY * dy
        const dotAlpha = (1 - peelProgress) * (0.15 + rand(d * 53 + index) * 0.2) * (d / 12 < peelProgress ? 1 : 0)

        if (dotX < 0 || dotX > width || dotY < 0 || dotY > height) continue
        if (dotAlpha < 0.01) continue

        residueDots.push(
          <div
            key={`d${d}`}
            style={{
              position: 'absolute',
              left: dotX,
              top: dotY,
              width: 2 + rand(d * 89 + index) * 3,
              height: 2 + rand(d * 89 + index) * 3,
              borderRadius: '50%',
              background: `rgba(180,210,255,${dotAlpha})`,
            }}
          />,
        )
      }
    }

    // Film overlay with iridescent tint (the protective layer still on)
    const filmCoverage = 1 - peelProgress

    return (
      <div style={{ position: 'absolute', inset: 0, overflow: 'hidden' }}>
        {/* Text revealed underneath */}
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
            textShadow: `0 0 20px ${color}40`,
          }}
        >
          {word}
        </div>

        {/* Film surface: iridescent overlay */}
        {filmCoverage > 0.01 && (
          <div
            style={{
              position: 'absolute',
              inset: 0,
              background: `linear-gradient(
                ${135 + Math.sin(t * 0.5) * 15}deg,
                rgba(180,220,255,${0.35 * filmCoverage + filmShimmer}),
                rgba(200,230,255,${0.25 * filmCoverage}) 30%,
                rgba(160,210,255,${0.3 * filmCoverage}) 60%,
                rgba(190,225,255,${0.35 * filmCoverage + filmShimmer})
              )`,
              clipPath: corner.startX === 0 && corner.startY === 0
                ? `polygon(0 0, ${100 - peelProgress * 110}% 0, 0 ${100 - peelProgress * 110}%)`
                : corner.startX === 1 && corner.startY === 0
                ? `polygon(${peelProgress * 110}% 0, 100% 0, 100% ${100 - peelProgress * 110}%)`
                : corner.startX === 0 && corner.startY === 1
                ? `polygon(0 ${peelProgress * 110}%, ${100 - peelProgress * 110}% 100%, 0 100%)`
                : `polygon(${peelProgress * 110}% 100%, 100% ${peelProgress * 110}%, 100% 100%)`,
            }}
          />
        )}

        {/* Peel curl shadow at the front edge */}
        {peelProgress > 0.02 && peelProgress < 1 && (
          <div
            style={{
              position: 'absolute',
              left: clampedFX - curlSize / 2,
              top: clampedFY - curlSize / 2,
              width: curlSize,
              height: curlSize,
              borderRadius: '50%',
              background: `radial-gradient(circle,
                rgba(255,255,255,${0.15 * curlProgress}),
                rgba(100,140,200,${0.08 * curlProgress}) 40%,
                transparent 70%
              )`,
              boxShadow: `0 4px 12px rgba(0,0,0,${0.3 * curlProgress})`,
            }}
          />
        )}

        {/* Adhesive residue */}
        {residueDots}
      </div>
    )
  },
}

function FilmPeelRevealComponent(props: MotionGraphicProps<FilmPeelRevealConfig>) {
  ;(globalThis as any).__filmPeelConfig = props.config
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-film-peel-reveal',
  title: 'Kinetic Film Peel Reveal',
  description: 'Iridescent protective film peels diagonally from a corner, leaving adhesive residue dots and a curl highlight at the peel front',
  tags: ['kinetic', 'typography', 'film', 'peel', 'overlay', 'reveal', 'iridescent', 'protective', 'diagonal'],
  category: 'captions',
  component: FilmPeelRevealComponent as any,
  defaultConfig: {
    words: ['PEEL', 'REVEAL', 'FRESH', 'NEW'],
    colors: ['#F0F8FF', '#D8EDFF', '#E8F5FF', '#C8E4FF'],
    bgColor: '#0a0e18',
    cycleDuration: 1.5,
    peelCorner: 0,
  },
  configSchema: [
    { key: 'words', label: 'Words', type: 'text-array', defaultValue: ['PEEL', 'REVEAL', 'FRESH', 'NEW'], group: 'Content' },
    { key: 'colors', label: 'Colors', type: 'text-array', defaultValue: ['#F0F8FF', '#D8EDFF'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#0a0e18', group: 'Style' },
    { key: 'cycleDuration', label: 'Cycle Duration (s)', type: 'number', defaultValue: 1.5, min: 0.5, max: 5, group: 'Timing' },
    { key: 'peelCorner', label: 'Peel Corner (0-3)', type: 'number', defaultValue: 0, min: 0, max: 3, group: 'Animation' },
  ],
})
