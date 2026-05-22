import { registerMotionGraphic } from '../registry'
import {
  KineticBase,
  type KineticBaseConfig,
  type KineticAnimation,
  type WordRenderProps,
  type BackgroundRenderProps,
} from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface TileFlipConfig extends KineticBaseConfig {
  tileRows: number
  tileCols: number
  flipAxis: number
}

function easeOutBack(t: number): number {
  const c1 = 1.70158
  const c3 = c1 + 1
  return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2)
}

function easeInCubic(t: number): number {
  return t * t * t
}

function pseudo(seed: number): number {
  const x = Math.sin(seed * 127.1 + 311.7) * 43758.5453
  return x - Math.floor(x)
}

const TILE_COLORS = ['#FF6B6B', '#FF8E53', '#FFD93D', '#6BCB77', '#4D96FF', '#845EC2', '#FF6F91']

const animation: KineticAnimation = {
  renderBackground: ({ bgColor }: BackgroundRenderProps) => (
    <div style={{ position: 'absolute', inset: 0, background: bgColor }} />
  ),

  renderWord: ({ word, color, enterProgress, exitProgress, phase, width, height, index }: WordRenderProps) => {
    const cols = 8
    const rows = 5
    const tileW = width / cols
    const tileH = height / rows
    const seed = index * 79

    let flipP = 0
    let unflipP = 0

    if (phase === 'enter') {
      flipP = enterProgress
    } else if (phase === 'hold') {
      flipP = 1
    } else {
      flipP = 1
      unflipP = easeInCubic(exitProgress)
    }

    const tiles = []

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const tileSeed = seed + r * cols + c
        // Ripple stagger: diagonal wave from top-left
        const stagger = ((r + c) / (rows + cols)) * 0.6
        const localP = Math.max(0, Math.min(1, (flipP - stagger) / (1 - stagger + 0.01)))
        const easedFlip = easeOutBack(Math.min(1, localP))

        // Unflip exits by row (rows disappear top to bottom)
        const unflipStagger = (r / rows) * 0.4
        const localUnflip = Math.max(0, Math.min(1, (unflipP - unflipStagger) / (1 - unflipStagger + 0.01)))

        // Flip angle: 0=back face showing, 180=front face showing
        const flipAngle = easedFlip * 180 * (1 - localUnflip)

        const tileColor = TILE_COLORS[Math.floor(pseudo(tileSeed) * TILE_COLORS.length)]
        const tileOpacity = Math.min(1, localP * 5) * (1 - localUnflip * localUnflip)

        tiles.push(
          <div
            key={`tlf-${r}-${c}`}
            style={{
              position: 'absolute',
              left: c * tileW,
              top: r * tileH,
              width: tileW - 1,
              height: tileH - 1,
              perspective: 400,
            }}
          >
            <div
              style={{
                position: 'absolute',
                inset: 0,
                transformStyle: 'preserve-3d',
                transform: `rotateY(${flipAngle}deg)`,
                transition: 'none',
              }}
            >
              {/* Back face: solid color tile */}
              <div
                style={{
                  position: 'absolute',
                  inset: 0,
                  background: tileColor,
                  backfaceVisibility: 'hidden',
                  opacity: tileOpacity,
                  borderRadius: 1,
                }}
              />
              {/* Front face: shows the word text (revealed when flipped) */}
              <div
                style={{
                  position: 'absolute',
                  inset: 0,
                  backfaceVisibility: 'hidden',
                  transform: 'rotateY(180deg)',
                  overflow: 'hidden',
                  opacity: tileOpacity,
                }}
              >
                {/* The word text, clipped to this tile's viewport */}
                <div
                  style={{
                    position: 'absolute',
                    top: -r * tileH,
                    left: -c * tileW,
                    width,
                    height,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <span
                    style={{
                      fontFamily: "'Arial Black', 'Impact', sans-serif",
                      fontSize: 'clamp(52px, 13vw, 168px)',
                      fontWeight: 900,
                      color,
                      whiteSpace: 'nowrap',
                      textTransform: 'uppercase',
                      letterSpacing: '0.04em',
                    }}
                  >
                    {word}
                  </span>
                </div>
                {/* Subtle sheen on revealed tiles */}
                <div
                  style={{
                    position: 'absolute',
                    inset: 0,
                    background: `linear-gradient(135deg, rgba(255,255,255,0.08) 0%, transparent 50%)`,
                  }}
                />
              </div>
            </div>
          </div>,
        )
      }
    }

    return <>{tiles}</>
  },
}

function TileFlipComponent(props: MotionGraphicProps<TileFlipConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-tile-flip',
  title: 'Kinetic Tile Flip',
  description:
    'Colorful square tiles flip over in a diagonal wave — back face is a solid color, front face reveals the text — like an information display board updating.',
  tags: ['kinetic', 'typography', 'tile', 'flip', 'mosaic', 'grid', 'reveal', 'wave', 'cells', 'build'],
  category: 'captions',
  component: TileFlipComponent as any,
  defaultConfig: {
    words: ['FLIP', 'REVEAL', 'TURN', 'SHOW'],
    colors: ['#FFFFFF', '#F0F0F0', '#E8E8E8', '#FFFFFF'],
    bgColor: '#1A1A1A',
    cycleDuration: 2.0,
    tileRows: 5,
    tileCols: 8,
    flipAxis: 1,
  },
  configSchema: [
    {
      key: 'words',
      label: 'Words',
      type: 'text-array',
      defaultValue: ['FLIP', 'REVEAL', 'TURN', 'SHOW'],
      group: 'Content',
    },
    {
      key: 'colors',
      label: 'Colors',
      type: 'text-array',
      defaultValue: ['#FFFFFF', '#F0F0F0', '#E8E8E8', '#FFFFFF'],
      group: 'Style',
    },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#1A1A1A', group: 'Style' },
    {
      key: 'cycleDuration',
      label: 'Cycle Duration (s)',
      type: 'number',
      defaultValue: 2.0,
      min: 0.5,
      max: 5,
      group: 'Timing',
    },
    { key: 'tileRows', label: 'Tile Rows', type: 'number', defaultValue: 5, min: 2, max: 10, group: 'Animation' },
    { key: 'tileCols', label: 'Tile Cols', type: 'number', defaultValue: 8, min: 2, max: 16, group: 'Animation' },
    {
      key: 'flipAxis',
      label: 'Flip Axis (1=Y, 0=X)',
      type: 'number',
      defaultValue: 1,
      min: 0,
      max: 1,
      group: 'Animation',
    },
  ],
})
