import { registerMotionGraphic } from '../registry'
import {
  KineticBase,
  type KineticBaseConfig,
  type KineticAnimation,
  type WordRenderProps,
  type BackgroundRenderProps,
} from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface HerringboneRevealConfig extends KineticBaseConfig {
  tileSize: number
}

function easeOutQuart(t: number): number {
  return 1 - Math.pow(1 - t, 4)
}

function easeInCubic(t: number): number {
  return t * t * t
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
    const cfg = (globalThis as any).__herringboneRevealConfig ?? { tileSize: 32 }
    const ts = cfg.tileSize ?? 32
    // Herringbone: rectangular bricks arranged in alternating 45° rotated groups
    // We simulate with diagonal distance-based stagger
    const tW = ts * 2   // 2:1 ratio brick
    const tH = ts
    const cols = Math.ceil(width / tW) + 2
    const rows = Math.ceil(height / tH) + 2
    const seed = index * 89

    const tiles: React.ReactNode[] = []

    for (let row = -1; row < rows; row++) {
      for (let col = -1; col < cols; col++) {
        const tileIndex = (row + 1) * (cols + 1) + (col + 1)
        const tileSeed = seed + tileIndex * 67

        // Herringbone alternates H/V bricks in a diagonal wave
        const isVertical = (row + col) % 2 === 0

        const left = col * tW
        const top = row * tH
        const bW = isVertical ? tH : tW
        const bH = isVertical ? tW : tH

        // Diagonal distance determines stagger (wave emanates from top-left)
        const diagDist = (col + row) / (cols + rows)
        const stagger = Math.max(0, Math.min(0.7, diagDist * 0.7))

        let opacity = 1
        let slideX = 0
        let slideY = 0

        const slideAmt = isVertical ? tH * 1.5 : tW * 1.5
        const slideVert = isVertical

        if (phase === 'enter') {
          const delayed = Math.max(0, Math.min(1, (enterProgress - stagger) / (1 - stagger * 0.8)))
          const eased = easeOutQuart(delayed)
          opacity = 1 - eased
          slideX = slideVert ? 0 : slideAmt * (1 - eased) * (col % 2 === 0 ? 1 : -1)
          slideY = slideVert ? -slideAmt * (1 - eased) : 0
        } else if (phase === 'hold') {
          opacity = 0
        } else {
          const reverseStagger = 1 - stagger
          const delayed = Math.max(0, Math.min(1, (exitProgress - reverseStagger * 0.5) / 0.5))
          const eased = easeInCubic(delayed)
          opacity = eased
          slideX = slideVert ? 0 : slideAmt * eased * (col % 2 === 0 ? 1 : -1)
          slideY = slideVert ? -slideAmt * eased : 0
        }

        if (opacity <= 0.01) { continue }

        const hue = 20 + pseudoRandom(tileSeed + 4) * 20
        const lightness = 12 + pseudoRandom(tileSeed + 5) * 8

        tiles.push(
          <div
            key={tileIndex}
            style={{
              position: 'absolute',
              left,
              top,
              width: bW - 1,
              height: bH - 1,
              background: `hsl(${hue},15%,${lightness}%)`,
              border: '1px solid rgba(255,255,255,0.06)',
              transform: `translate(${slideX}px, ${slideY}px)`,
              opacity,
            }}
          />,
        )
      }
    }

    let textOpacity = 0
    if (phase === 'enter') textOpacity = Math.min(1, enterProgress * 2)
    else if (phase === 'hold') textOpacity = 1
    else textOpacity = Math.max(0, 1 - exitProgress * 2)

    return (
      <>
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            fontFamily: "'Georgia', 'Times New Roman', serif",
            fontSize: 'clamp(40px, 10vw, 140px)',
            fontWeight: 700,
            color,
            whiteSpace: 'nowrap',
            letterSpacing: '0.03em',
            textTransform: 'uppercase',
            opacity: textOpacity,
          }}
        >
          {word}
        </div>
        {tiles}
      </>
    )
  },
}

function HerringboneRevealComponent(props: MotionGraphicProps<HerringboneRevealConfig>) {
  ;(globalThis as any).__herringboneRevealConfig = props.config
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-herringbone-reveal',
  title: 'Kinetic Herringbone Reveal',
  description: 'Alternating herringbone bricks dissolve in a diagonal wave to uncover text',
  tags: ['kinetic', 'typography', 'herringbone', 'zigzag', 'tile', 'reveal', 'pattern', 'geometric'],
  category: 'captions',
  component: HerringboneRevealComponent as any,
  defaultConfig: {
    words: ['WEAVE', 'PATTERN', 'ZIGZAG', 'FLOW'],
    colors: ['#C9B99A', '#A0856B', '#E8D5B5', '#C9B99A'],
    bgColor: '#111108',
    cycleDuration: 1.6,
    tileSize: 32,
  },
  configSchema: [
    { key: 'words', label: 'Words', type: 'text-array', defaultValue: ['WEAVE', 'PATTERN', 'ZIGZAG', 'FLOW'], group: 'Content' },
    { key: 'colors', label: 'Colors', type: 'text-array', defaultValue: ['#C9B99A', '#A0856B', '#E8D5B5'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#111108', group: 'Style' },
    { key: 'cycleDuration', label: 'Cycle Duration (s)', type: 'number', defaultValue: 1.6, min: 0.5, max: 5, group: 'Timing' },
    { key: 'tileSize', label: 'Tile Size (px)', type: 'number', defaultValue: 32, min: 16, max: 80, group: 'Animation' },
  ],
})
