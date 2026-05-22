import { registerMotionGraphic } from '../registry'
import {
  KineticBase,
  type KineticBaseConfig,
  type KineticAnimation,
  type WordRenderProps,
  type BackgroundRenderProps,
} from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface DiamondTileRevealConfig extends KineticBaseConfig {
  diamondSize: number
}

function easeOutBack(t: number): number {
  const c1 = 1.70158
  const c3 = c1 + 1
  return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2)
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
    const cfg = (globalThis as any).__diamondTileRevealConfig ?? { diamondSize: 56 }
    const ds = cfg.diamondSize ?? 56  // half-diagonal of diamond
    // Diamond grid: offset rows by half
    const colStep = ds
    const rowStep = ds
    const cols = Math.ceil(width / colStep) + 2
    const rows = Math.ceil(height / rowStep) + 2
    const seed = index * 107

    const diamonds: React.ReactNode[] = []

    for (let row = -1; row < rows; row++) {
      for (let col = -1; col < cols; col++) {
        const tileIndex = (row + 1) * (cols + 1) + (col + 1)
        const tileSeed = seed + tileIndex * 79

        const cx = col * colStep + (row % 2 === 1 ? colStep * 0.5 : 0)
        const cy = row * rowStep

        // Each diamond splits into two triangles that slide apart
        // Stagger based on diagonal wave from centre
        const dx = (cx - width / 2) / width
        const dy = (cy - height / 2) / height
        const diagDist = Math.abs(dx) + Math.abs(dy)
        const stagger = diagDist * 0.55 + pseudoRandom(tileSeed) * 0.1

        let splitAmount = 0  // 0 = closed, 1 = fully split
        let opacity = 1

        if (phase === 'enter') {
          const delayed = Math.max(0, Math.min(1, (enterProgress - stagger * 0.6) / 0.4))
          splitAmount = easeOutBack(Math.min(1, delayed))
          opacity = 1 - Math.min(1, delayed * 1.5)
        } else if (phase === 'hold') {
          splitAmount = 1
          opacity = 0
        } else {
          const revStagger = 1 - stagger
          const delayed = Math.max(0, Math.min(1, (exitProgress - revStagger * 0.5) / 0.5))
          splitAmount = 1 - easeInCubic(1 - delayed)
          opacity = easeInCubic(delayed)
        }

        if (opacity <= 0.01) { continue }

        const r = ds * 0.5  // half-size of each triangle pair
        const hue = 290 + pseudoRandom(tileSeed + 3) * 60
        const sat = 15 + pseudoRandom(tileSeed + 4) * 10
        const lit = 14 + pseudoRandom(tileSeed + 5) * 10

        // The diamond is split into top-half and bottom-half triangles
        const splitY = splitAmount * r

        diamonds.push(
          <div
            key={tileIndex}
            style={{ position: 'absolute', left: cx - r, top: cy - r, width: r * 2, height: r * 2, opacity }}
          >
            {/* Top triangle — slides up */}
            <div
              style={{
                position: 'absolute',
                inset: 0,
                clipPath: 'polygon(50% 0%, 100% 50%, 50% 50%, 0% 50%)',
                background: `hsl(${hue},${sat}%,${lit + 4}%)`,
                transform: `translateY(${-splitY}px)`,
                border: '1px solid rgba(255,255,255,0.08)',
              }}
            />
            {/* Bottom triangle — slides down */}
            <div
              style={{
                position: 'absolute',
                inset: 0,
                clipPath: 'polygon(50% 50%, 100% 50%, 50% 100%, 0% 50%)',
                background: `hsl(${hue},${sat}%,${lit}%)`,
                transform: `translateY(${splitY}px)`,
                border: '1px solid rgba(255,255,255,0.05)',
              }}
            />
          </div>,
        )
      }
    }

    let textOpacity = 0
    if (phase === 'enter') textOpacity = Math.min(1, enterProgress * 2.5)
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
            fontFamily: "'Inter', 'Helvetica Neue', sans-serif",
            fontSize: 'clamp(40px, 10vw, 140px)',
            fontWeight: 800,
            color,
            whiteSpace: 'nowrap',
            letterSpacing: '0.04em',
            textTransform: 'uppercase',
            opacity: textOpacity,
          }}
        >
          {word}
        </div>
        {diamonds}
      </>
    )
  },
}

function DiamondTileRevealComponent(props: MotionGraphicProps<DiamondTileRevealConfig>) {
  ;(globalThis as any).__diamondTileRevealConfig = props.config
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-diamond-tile-reveal',
  title: 'Kinetic Diamond Tile Reveal',
  description: 'Diamond/argyle tiles split apart top and bottom in a radial wave to uncover text',
  tags: ['kinetic', 'typography', 'diamond', 'argyle', 'tile', 'reveal', 'pattern', 'geometric', 'split'],
  category: 'captions',
  component: DiamondTileRevealComponent as any,
  defaultConfig: {
    words: ['SPLIT', 'CRACK', 'SHARP', 'FACET'],
    colors: ['#C084FC', '#A855F7', '#E879F9', '#C084FC'],
    bgColor: '#090610',
    cycleDuration: 1.5,
    diamondSize: 56,
  },
  configSchema: [
    { key: 'words', label: 'Words', type: 'text-array', defaultValue: ['SPLIT', 'CRACK', 'SHARP', 'FACET'], group: 'Content' },
    { key: 'colors', label: 'Colors', type: 'text-array', defaultValue: ['#C084FC', '#A855F7', '#E879F9'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#090610', group: 'Style' },
    { key: 'cycleDuration', label: 'Cycle Duration (s)', type: 'number', defaultValue: 1.5, min: 0.5, max: 5, group: 'Timing' },
    { key: 'diamondSize', label: 'Diamond Size (px)', type: 'number', defaultValue: 56, min: 24, max: 120, group: 'Animation' },
  ],
})
