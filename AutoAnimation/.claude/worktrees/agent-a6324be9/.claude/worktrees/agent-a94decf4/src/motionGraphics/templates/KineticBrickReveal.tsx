import { registerMotionGraphic } from '../registry'
import {
  KineticBase,
  type KineticBaseConfig,
  type KineticAnimation,
  type WordRenderProps,
  type BackgroundRenderProps,
} from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface BrickRevealConfig extends KineticBaseConfig {
  brickCols: number
  brickRows: number
}

function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3)
}

function easeInQuad(t: number): number {
  return t * t
}

function pseudoRandom(seed: number): number {
  const x = Math.sin(seed * 127.1 + 311.7) * 43758.5453
  return x - Math.floor(x)
}

const animation: KineticAnimation = {
  renderBackground: ({ bgColor }: BackgroundRenderProps) => (
    <div style={{ position: 'absolute', inset: 0, background: bgColor }} />
  ),

  renderWord: ({ word, color, enterProgress, exitProgress, phase, index, width, height }: WordRenderProps) => {
    const cfg = (globalThis as any).__brickRevealConfig ?? { brickCols: 8, brickRows: 5 }
    const cols = cfg.brickCols ?? 8
    const rows = cfg.brickRows ?? 5
    const bW = width / cols
    const bH = height / rows
    const seed = index * 113

    const bricks: React.ReactNode[] = []

    for (let row = 0; row < rows; row++) {
      // Each row is offset by half a brick (running-bond pattern)
      const offsetX = row % 2 === 1 ? bW * 0.5 : 0
      const effectiveCols = cols + 1

      for (let col = 0; col < effectiveCols; col++) {
        const tileIndex = row * effectiveCols + col
        const tileSeed = seed + tileIndex * 71

        // Bricks slide out either left or right depending on column parity
        const slideDir = pseudoRandom(tileSeed + 2) > 0.5 ? 1 : -1
        // Row-based stagger: lower rows reveal first
        const rowStagger = (row / rows) * 0.5
        const colStagger = pseudoRandom(tileSeed) * 0.25

        let translateX = 0
        let opacity = 1

        if (phase === 'enter') {
          const totalStagger = rowStagger + colStagger
          const delayed = Math.max(0, Math.min(1, (enterProgress - totalStagger * 0.6) / 0.4))
          const eased = easeOutCubic(delayed)
          // Brick starts off-screen, slides in
          translateX = slideDir * bW * 2 * (1 - eased)
          opacity = Math.min(1, delayed * 2)
        } else if (phase === 'hold') {
          translateX = 0
          opacity = 1
        } else {
          // Exit: bricks slide out upward
          const delayed = Math.max(0, Math.min(1, (exitProgress - (1 - row / rows) * 0.4) / 0.6))
          const eased = easeInQuad(delayed)
          translateX = 0
          opacity = 1 - eased
        }

        const left = col * bW - offsetX
        const top = row * bH

        bricks.push(
          <div
            key={tileIndex}
            style={{
              position: 'absolute',
              left,
              top,
              width: bW - 2,
              height: bH - 2,
              background: `hsl(${20 + row * 8 + col * 3},30%,${15 + pseudoRandom(tileSeed + 5) * 8}%)`,
              border: '1px solid rgba(0,0,0,0.4)',
              transform: `translateX(${translateX}px)`,
              opacity,
              boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.06)',
            }}
          />,
        )
      }
    }

    let textOpacity = 0
    if (phase === 'enter') textOpacity = Math.min(1, enterProgress * 2.5)
    else if (phase === 'hold') textOpacity = 1
    else textOpacity = 1 - exitProgress * 1.5

    return (
      <>
        {/* Text sits behind the bricks */}
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            fontFamily: "'Impact', 'Arial Black', sans-serif",
            fontSize: 'clamp(40px, 10vw, 140px)',
            fontWeight: 900,
            color,
            whiteSpace: 'nowrap',
            letterSpacing: '0.05em',
            textTransform: 'uppercase',
            opacity: textOpacity,
          }}
        >
          {word}
        </div>
        {bricks}
        {/* Mortar background grid lines */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            backgroundImage: `
              repeating-linear-gradient(0deg, rgba(0,0,0,0.3) 0px, rgba(0,0,0,0.3) 2px, transparent 2px, transparent ${bH}px),
              repeating-linear-gradient(90deg, rgba(0,0,0,0.15) 0px, rgba(0,0,0,0.15) 1px, transparent 1px, transparent ${bW}px)
            `,
            pointerEvents: 'none',
            opacity: phase === 'hold' ? 0 : 1 - (phase === 'enter' ? enterProgress : 1 - exitProgress),
          }}
        />
      </>
    )
  },
}

function BrickRevealComponent(props: MotionGraphicProps<BrickRevealConfig>) {
  ;(globalThis as any).__brickRevealConfig = props.config
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-brick-reveal',
  title: 'Kinetic Brick Reveal',
  description: 'Running-bond brick pattern slides away row by row in a staggered reveal to uncover text',
  tags: ['kinetic', 'typography', 'brick', 'tile', 'reveal', 'pattern', 'geometric', 'masonry'],
  category: 'captions',
  component: BrickRevealComponent as any,
  defaultConfig: {
    words: ['BUILD', 'WALL', 'SOLID', 'BREAK'],
    colors: ['#FF6B35', '#F7931E', '#FFCD3C', '#FF6B35'],
    bgColor: '#1a0f0a',
    cycleDuration: 1.5,
    brickCols: 8,
    brickRows: 5,
  },
  configSchema: [
    { key: 'words', label: 'Words', type: 'text-array', defaultValue: ['BUILD', 'WALL', 'SOLID', 'BREAK'], group: 'Content' },
    { key: 'colors', label: 'Colors', type: 'text-array', defaultValue: ['#FF6B35', '#F7931E', '#FFCD3C'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#1a0f0a', group: 'Style' },
    { key: 'cycleDuration', label: 'Cycle Duration (s)', type: 'number', defaultValue: 1.5, min: 0.5, max: 5, group: 'Timing' },
    { key: 'brickCols', label: 'Brick Columns', type: 'number', defaultValue: 8, min: 4, max: 16, group: 'Animation' },
    { key: 'brickRows', label: 'Brick Rows', type: 'number', defaultValue: 5, min: 2, max: 10, group: 'Animation' },
  ],
})
