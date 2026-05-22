import { registerMotionGraphic } from '../registry'
import { KineticBase, type KineticBaseConfig, type KineticAnimation, type WordRenderProps, type BackgroundRenderProps } from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface MosaicAssembleConfig extends KineticBaseConfig {
  gridCols: number
  gridRows: number
}

function easeOutBack(t: number): number {
  const c1 = 1.70158
  const c3 = c1 + 1
  return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2)
}

function easeInCubic(t: number): number {
  return t * t * t
}

/** Deterministic pseudo-random from seed */
function pseudoRandom(seed: number): number {
  const x = Math.sin(seed * 127.1 + 311.7) * 43758.5453
  return x - Math.floor(x)
}

const animation: KineticAnimation = {
  renderBackground: ({ bgColor }: BackgroundRenderProps) => (
    <div style={{ position: 'absolute', inset: 0, background: bgColor }} />
  ),

  renderWord: ({ word, color, enterProgress, exitProgress, phase, width, height, index }: WordRenderProps) => {
    const config = (globalThis as any).__mosaicConfig ?? { gridCols: 6, gridRows: 4 }
    const cols = config.gridCols ?? 6
    const rows = config.gridRows ?? 4
    const tileW = width / cols
    const tileH = height / rows
    const seed = index * 137

    const tiles = []
    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        const tileIndex = row * cols + col
        const tileSeed = seed + tileIndex * 73

        // Each tile has a shuffled order for staggered assembly
        const order = pseudoRandom(tileSeed + 0.5)
        const stagger = order * 0.6 // 60% of animation time is stagger spread

        let flipProgress = 0 // 0 = face-down (scrambled), 1 = face-up (correct)
        let tileOpacity = 0

        if (phase === 'enter') {
          const delayed = Math.max(0, Math.min(1, (enterProgress - stagger) / 0.4))
          flipProgress = easeOutBack(delayed)
          tileOpacity = Math.min(1, (enterProgress - stagger * 0.8) * 4)
        } else if (phase === 'hold') {
          flipProgress = 1
          tileOpacity = 1
        } else {
          const reverseOrder = 1 - order
          const delayed = Math.max(0, Math.min(1, (exitProgress - reverseOrder * 0.5) / 0.5))
          flipProgress = 1 - easeInCubic(delayed)
          tileOpacity = 1 - delayed
        }

        // When not fully assembled, the tile shows at a scrambled position
        const scrambleX = (pseudoRandom(tileSeed + 1) - 0.5) * width * 0.4
        const scrambleY = (pseudoRandom(tileSeed + 2) - 0.5) * height * 0.4
        const scrambleRotate = (pseudoRandom(tileSeed + 3) - 0.5) * 180

        const currentX = scrambleX * (1 - flipProgress)
        const currentY = scrambleY * (1 - flipProgress)
        const currentRotate = scrambleRotate * (1 - flipProgress)
        const flipAngle = (1 - flipProgress) * 180

        tiles.push(
          <div
            key={tileIndex}
            style={{
              position: 'absolute',
              left: col * tileW,
              top: row * tileH,
              width: tileW,
              height: tileH,
              overflow: 'hidden',
              perspective: 600,
            }}
          >
            <div
              style={{
                position: 'absolute',
                inset: 0,
                transform: `translate(${currentX}px, ${currentY}px) rotate(${currentRotate}deg) rotateY(${flipAngle}deg)`,
                transformStyle: 'preserve-3d',
                backfaceVisibility: 'hidden',
                opacity: Math.max(0, tileOpacity),
              }}
            >
              {/* Front face: correct text tile */}
              <div
                style={{
                  position: 'absolute',
                  inset: 0,
                  overflow: 'hidden',
                }}
              >
                <div
                  style={{
                    position: 'absolute',
                    top: -row * tileH,
                    left: -col * tileW,
                    width,
                    height,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <div
                    style={{
                      fontFamily: "'Inter', 'Helvetica Neue', sans-serif",
                      fontSize: 'clamp(40px, 12vw, 160px)',
                      fontWeight: 800,
                      color,
                      whiteSpace: 'nowrap',
                      letterSpacing: '0.04em',
                      textTransform: 'uppercase',
                    }}
                  >
                    {word}
                  </div>
                </div>
                {/* Tile border */}
                <div
                  style={{
                    position: 'absolute',
                    inset: 0,
                    border: `1px solid rgba(255,255,255,${0.06 * (1 - flipProgress)})`,
                    pointerEvents: 'none',
                  }}
                />
              </div>
            </div>
            {/* Back face: solid color tile (visible when flipped) */}
            {flipProgress < 0.95 && (
              <div
                style={{
                  position: 'absolute',
                  inset: 0,
                  transform: `translate(${currentX}px, ${currentY}px) rotate(${currentRotate}deg) rotateY(${flipAngle + 180}deg)`,
                  transformStyle: 'preserve-3d',
                  backfaceVisibility: 'hidden',
                  background: `hsl(${(tileIndex * 37) % 360}, 20%, 18%)`,
                  border: '1px solid rgba(255,255,255,0.05)',
                  opacity: Math.max(0, tileOpacity),
                }}
              />
            )}
          </div>,
        )
      }
    }

    return <>{tiles}</>
  },
}

function MosaicAssembleComponent(props: MotionGraphicProps<MosaicAssembleConfig>) {
  ;(globalThis as any).__mosaicConfig = props.config
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-mosaic-assemble',
  title: 'Kinetic Mosaic Assemble',
  description: 'Text assembles from shuffled mosaic tiles that flip and slide into correct positions',
  tags: ['kinetic', 'typography', 'mosaic', 'tiles', 'puzzle', 'assemble', 'geometric', 'mechanical'],
  category: 'captions',
  component: MosaicAssembleComponent as any,
  defaultConfig: {
    words: ['PIECE', 'BUILD', 'FORM', 'WHOLE'],
    colors: ['#FF6B6B', '#4ECDC4', '#FFE66D', '#C084FC'],
    bgColor: '#111118',
    cycleDuration: 1.6,
    gridCols: 6,
    gridRows: 4,
  },
  configSchema: [
    { key: 'words', label: 'Words', type: 'text-array', defaultValue: ['PIECE', 'BUILD', 'FORM', 'WHOLE'], group: 'Content' },
    { key: 'colors', label: 'Colors', type: 'text-array', defaultValue: ['#FF6B6B', '#4ECDC4', '#FFE66D'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#111118', group: 'Style' },
    { key: 'cycleDuration', label: 'Cycle Duration (s)', type: 'number', defaultValue: 1.6, min: 0.3, max: 5, group: 'Timing' },
    { key: 'gridCols', label: 'Grid Columns', type: 'number', defaultValue: 6, min: 2, max: 12, group: 'Animation' },
    { key: 'gridRows', label: 'Grid Rows', type: 'number', defaultValue: 4, min: 2, max: 8, group: 'Animation' },
  ],
})
