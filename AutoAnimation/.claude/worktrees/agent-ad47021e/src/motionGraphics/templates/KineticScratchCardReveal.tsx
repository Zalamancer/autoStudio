import { registerMotionGraphic } from '../registry'
import {
  KineticBase,
  type KineticBaseConfig,
  type KineticAnimation,
  type WordRenderProps,
  type BackgroundRenderProps,
} from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface ScratchCardRevealConfig extends KineticBaseConfig {
  scratchStrokes: number
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

const animation: KineticAnimation = {
  renderBackground: ({ bgColor }: BackgroundRenderProps) => (
    <div style={{ position: 'absolute', inset: 0, background: bgColor }} />
  ),

  renderWord: ({ word, color, enterProgress, holdProgress, exitProgress, phase, index, frame, width, height }: WordRenderProps) => {
    const f = frame ?? 0
    const t = f / 30
    const cfg = (globalThis as any).__scratchCardConfig ?? { scratchStrokes: 12 }
    const scratchStrokes = cfg.scratchStrokes ?? 12

    // Scratch card: a metallic silver card is scratched away stroke by stroke
    let scratchProgress = 0  // how much has been scratched
    let textOpacity = 0
    let textScale = 1

    if (phase === 'enter') {
      scratchProgress = easeOutExpo(enterProgress)
      textOpacity = easeOutExpo(Math.max(0, (enterProgress - 0.1) / 0.9))
      textScale = 0.95 + textOpacity * 0.05
    } else if (phase === 'hold') {
      scratchProgress = 1
      textOpacity = 1
      textScale = 1
    } else {
      // Metallic card slams back over
      scratchProgress = Math.max(0, 1 - easeInQuad(exitProgress) * 1.2)
      textOpacity = Math.max(0, 1 - exitProgress * 2.5)
      textScale = 1 + easeInQuad(exitProgress) * 0.02
    }

    // Build scratch strokes — each stroke is a diagonal reveal patch
    const scratchElements: React.ReactNode[] = []

    for (let s = 0; s < scratchStrokes; s++) {
      const strokeDelay = s / scratchStrokes * 0.8
      const strokeProgress = Math.max(0, Math.min(1, (scratchProgress - strokeDelay) / 0.3))

      if (strokeProgress <= 0) continue

      // Each stroke is a diagonal smear across different parts of the card
      const row = Math.floor(s / 4)
      const col = s % 4
      const sx = (col / 4) * width + rand(s * 31 + index) * (width * 0.18)
      const sy = (row / Math.ceil(scratchStrokes / 4)) * height + rand(s * 47 + index) * (height * 0.2)
      const strokeW = width * (0.22 + rand(s * 59 + index) * 0.18) * strokeProgress
      const strokeH = height * (0.12 + rand(s * 71 + index) * 0.1)
      const strokeAngle = (rand(s * 83 + index) - 0.5) * 25

      // Scratch mark: a transparent gap in the metallic surface
      scratchElements.push(
        <div
          key={`scratch${s}`}
          style={{
            position: 'absolute',
            left: sx,
            top: sy,
            width: strokeW,
            height: strokeH,
            transformOrigin: '0 50%',
            transform: `rotate(${strokeAngle}deg)`,
            borderRadius: strokeH * 0.4,
            // The scratch removes the silver layer — shown as dark transparent gap
            background: 'transparent',
            boxShadow: `0 0 0 1px rgba(0,0,0,0.15)`,
            mixBlendMode: 'normal',
          }}
        />,
      )
    }

    // Metallic silver overlay segments (the unscratched parts)
    // Rendered as a series of strips with gaps where scratched
    const metalSegments: React.ReactNode[] = []
    const strips = 20
    for (let s = 0; s < strips; s++) {
      const stripY = (s / strips) * height
      const stripH = height / strips + 1

      // How much of this strip has been scratched based on overall scratch progress
      const stripNorm = s / strips
      const stripScratchAmount = Math.max(0, Math.min(1, (scratchProgress - stripNorm * 0.3) / 0.7 * (1 + rand(s * 37 + index) * 0.4)))

      if (stripScratchAmount >= 1) continue

      const metalAlpha = 0.88 - stripScratchAmount * 0.88

      // Metallic gradient varies per strip for realism
      const lightPos = 30 + (s * 4 + rand(s * 53 + index) * 20)
      metalSegments.push(
        <div
          key={`metal${s}`}
          style={{
            position: 'absolute',
            left: 0,
            top: stripY,
            width: '100%',
            height: stripH,
            background: `linear-gradient(90deg,
              rgba(170,170,180,${metalAlpha}),
              rgba(215,215,225,${metalAlpha}) ${lightPos - 10}%,
              rgba(240,240,250,${metalAlpha}) ${lightPos}%,
              rgba(200,200,215,${metalAlpha}) ${lightPos + 10}%,
              rgba(160,160,175,${metalAlpha})
            )`,
          }}
        />,
      )
    }

    // Scratch residue glitter
    const glitterElements: React.ReactNode[] = []
    if (scratchProgress > 0.1 && scratchProgress < 0.95) {
      for (let g = 0; g < 15; g++) {
        const gx = rand(g * 41 + index + Math.floor(t * 5)) * width
        const gy = rand(g * 67 + index + Math.floor(t * 5)) * height
        const gSize = 1 + rand(g * 53 + index) * 2
        const gAlpha = (0.4 + rand(g * 89 + index) * 0.6) * (1 - Math.abs(scratchProgress - 0.5) * 2)

        glitterElements.push(
          <div
            key={`g${g}`}
            style={{
              position: 'absolute',
              left: gx,
              top: gy,
              width: gSize,
              height: gSize,
              borderRadius: '50%',
              background: `rgba(220,220,240,${gAlpha})`,
            }}
          />,
        )
      }
    }

    // Prize text glow (hold phase celebration)
    const prizeGlow = phase === 'hold' ? Math.sin(t * 3) * 0.5 + 0.5 : 0

    return (
      <div style={{ position: 'absolute', inset: 0, overflow: 'hidden' }}>
        {/* Prize background pattern */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            backgroundImage: `repeating-linear-gradient(
              45deg,
              rgba(255,200,0,0.04) 0px,
              rgba(255,200,0,0.04) 4px,
              transparent 4px,
              transparent 12px
            )`,
          }}
        />

        {/* Text — the prize */}
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: `translate(-50%, -50%) scale(${textScale})`,
            fontFamily: "'Impact', 'Arial Black', sans-serif",
            fontSize: 'clamp(40px, 12vw, 155px)',
            fontWeight: 900,
            color,
            whiteSpace: 'nowrap',
            letterSpacing: '0.04em',
            textTransform: 'uppercase',
            opacity: textOpacity,
            textShadow: `
              0 0 ${10 + prizeGlow * 15}px ${color}80,
              2px 2px 0 rgba(0,0,0,0.4),
              0 0 40px ${color}${Math.round(prizeGlow * 60).toString(16).padStart(2, '0')}
            `,
          }}
        >
          {word}
        </div>

        {/* Metallic scratch card surface */}
        {metalSegments}

        {/* Scratch marks */}
        {scratchElements}

        {/* Glitter residue */}
        {glitterElements}

        {/* Card border */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            border: '3px solid rgba(180,180,195,0.5)',
            borderRadius: 4,
            pointerEvents: 'none',
            opacity: scratchProgress < 0.5 ? 1 : Math.max(0, 1 - (scratchProgress - 0.5) * 2),
          }}
        />
      </div>
    )
  },
}

function ScratchCardRevealComponent(props: MotionGraphicProps<ScratchCardRevealConfig>) {
  ;(globalThis as any).__scratchCardConfig = props.config
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-scratch-card-reveal',
  title: 'Kinetic Scratch Card Reveal',
  description: 'A metallic silver scratch card is scratched away stroke by stroke, revealing prize text underneath with glitter residue',
  tags: ['kinetic', 'typography', 'scratch', 'card', 'metallic', 'reveal', 'peel', 'lottery', 'prize'],
  category: 'captions',
  component: ScratchCardRevealComponent as any,
  defaultConfig: {
    words: ['WINNER', 'PRIZE', 'BONUS', 'WIN'],
    colors: ['#FFD700', '#FFC020', '#FFE840', '#FFAA00'],
    bgColor: '#120d00',
    cycleDuration: 1.6,
    scratchStrokes: 12,
  },
  configSchema: [
    { key: 'words', label: 'Words', type: 'text-array', defaultValue: ['WINNER', 'PRIZE', 'BONUS', 'WIN'], group: 'Content' },
    { key: 'colors', label: 'Colors', type: 'text-array', defaultValue: ['#FFD700', '#FFC020'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#120d00', group: 'Style' },
    { key: 'cycleDuration', label: 'Cycle Duration (s)', type: 'number', defaultValue: 1.6, min: 0.5, max: 5, group: 'Timing' },
    { key: 'scratchStrokes', label: 'Scratch Strokes', type: 'number', defaultValue: 12, min: 4, max: 24, group: 'Animation' },
  ],
})
