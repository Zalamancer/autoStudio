import { registerMotionGraphic } from '../registry'
import { KineticBase, type KineticBaseConfig, type KineticAnimation, type WordRenderProps, type BackgroundRenderProps } from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface SlidePuzzleConfig extends KineticBaseConfig {}

function pRand(seed: number): number {
  const x = Math.sin(seed * 127.1 + 311.7) * 43758.5453
  return x - Math.floor(x)
}

function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3)
}

function easeInCubic(t: number): number {
  return t * t * t
}

// Build a deterministically scrambled slot order for numTiles tiles.
// Returns: scrambled[tileIdx] = startingSlot (where each tile begins)
function getScrambledStartSlots(numTiles: number, seed: number): number[] {
  // slot assignment: each tile gets a unique starting slot
  const slots = Array.from({ length: numTiles }, (_, i) => i)
  // Shuffle slots array deterministically
  for (let i = numTiles - 1; i > 0; i--) {
    const j = Math.floor(pRand(seed + i * 73) * (i + 1))
    ;[slots[i], slots[j]] = [slots[j], slots[i]]
  }
  // slots[tileIdx] = starting slot for that tile
  return slots
}

const animation: KineticAnimation = {
  renderBackground: ({ bgColor }: BackgroundRenderProps) => {
    return (
      <div style={{ position: 'absolute', inset: 0, background: bgColor }}>
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: `repeating-linear-gradient(
              90deg,
              transparent 0px,
              transparent 8px,
              rgba(255,255,255,0.015) 8px,
              rgba(255,255,255,0.015) 9px
            )`,
          }}
        />
      </div>
    )
  },

  renderWord: ({ word, color, enterProgress, holdProgress, exitProgress, phase, index, width, height, frame }: WordRenderProps) => {
    const f = frame ?? 0
    // Use up to 4 characters
    const displayWord = word.toUpperCase().slice(0, 4)
    const chars = displayWord.split('')
    const numLetters = chars.length
    // Total tiles = numLetters + 1 blank
    const numTiles = numLetters + 1
    const BLANK_IDX = numLetters // last index is blank

    const tileSize = Math.min(
      Math.floor((width * 0.68) / numTiles),
      Math.floor(height * 0.5),
      96,
    )
    const tileGap = 6
    const boardPad = 14
    const boardW = numTiles * tileSize + (numTiles - 1) * tileGap + boardPad * 2
    const boardH = tileSize + boardPad * 2
    const boardX = (width - boardW) / 2
    const boardY = (height - boardH) / 2

    // Solved positions: tile i is at slot i
    const solvedSlotX = (slot: number) => boardX + boardPad + slot * (tileSize + tileGap)
    const solvedSlotY = boardY + boardPad

    // Scrambled: each tile starts at a different slot
    const tileStartSlot = getScrambledStartSlots(numTiles, index * 1337)
    // tileStartSlot[tileIdx] = startingSlot

    // Per-tile slide animation: each tile independently lerps from its start slot to its solved slot
    // Tiles slide in a cascade: tile 0 starts moving first, then tile 1, etc.
    // Blank tile (BLANK_IDX) slides off to its slot last
    const eased = easeOutCubic(Math.min(1, enterProgress * 1.15))

    const nodes: React.ReactNode[] = []

    // Board background
    const boardOpacity =
      phase === 'enter' ? Math.min(1, enterProgress * 5) :
      phase === 'exit' ? Math.max(0, 1 - exitProgress * 1.5) : 1

    nodes.push(
      <div
        key="board"
        style={{
          position: 'absolute',
          left: boardX,
          top: boardY,
          width: boardW,
          height: boardH,
          background: '#5a4020',
          borderRadius: 10,
          border: '4px solid #3a2010',
          boxShadow: '0 6px 20px rgba(0,0,0,0.5), inset 0 1px 3px rgba(255,255,255,0.1)',
          opacity: boardOpacity,
        }}
      />,
    )

    // Slot dividers (show the empty slots on the board)
    for (let slot = 0; slot < numTiles; slot++) {
      nodes.push(
        <div
          key={`slot-${slot}`}
          style={{
            position: 'absolute',
            left: solvedSlotX(slot),
            top: solvedSlotY,
            width: tileSize,
            height: tileSize,
            border: '2px dashed rgba(255,255,255,0.1)',
            borderRadius: 6,
            opacity: boardOpacity,
          }}
        />,
      )
    }

    // Render each letter tile
    for (let tileIdx = 0; tileIdx < numTiles; tileIdx++) {
      const isBlank = tileIdx === BLANK_IDX
      if (isBlank) continue // blank tile is invisible — it's just the empty space

      const ch = chars[tileIdx]
      const startSlot = tileStartSlot[tileIdx]
      const endSlot = tileIdx // solved slot

      const startX = solvedSlotX(startSlot)
      const endX = solvedSlotX(endSlot)

      // Stagger each tile's movement: tile 0 moves first, last tile moves last
      const tileDelay = (tileIdx / numLetters) * 0.4
      const tileDur = 0.5
      const tileProgress = phase === 'enter'
        ? Math.max(0, Math.min(1, (enterProgress - tileDelay) / tileDur))
        : 1
      const tileEased = easeOutCubic(tileProgress)

      let tileX: number, tileY: number, tileOpacity: number, tileRotation: number

      if (phase === 'enter') {
        tileX = startX + (endX - startX) * tileEased
        tileY = solvedSlotY
        tileOpacity = Math.min(1, tileProgress * 4)
        tileRotation = (1 - tileEased) * (startSlot > endSlot ? 8 : -8)
      } else if (phase === 'hold') {
        tileX = endX
        tileY = solvedSlotY
        tileOpacity = 1
        tileRotation = Math.sin(f * 0.04 + tileIdx * 0.9) * 0.6
      } else {
        // Exit: tiles drop down in cascade right-to-left
        const exitDelay = ((numLetters - 1 - tileIdx) / numLetters) * 0.35
        const ep = Math.max(0, Math.min(1, (exitProgress - exitDelay) / 0.55))
        tileX = endX
        tileY = solvedSlotY + easeInCubic(ep) * height * 0.55
        tileOpacity = Math.max(0, 1 - ep * 1.2)
        tileRotation = ep * (tileIdx % 2 === 0 ? 25 : -25)
      }

      // Snap pop effect at end of slide
      let snapScale = 1
      if (phase === 'enter' && tileProgress > 0.9) {
        const snapT = (tileProgress - 0.9) / 0.1
        snapScale = 1 + Math.sin(snapT * Math.PI) * 0.07
      }

      const tileNum = startSlot + 1 // original slot number shown on tile

      nodes.push(
        <div
          key={`tile-${tileIdx}`}
          style={{
            position: 'absolute',
            left: tileX,
            top: tileY,
            width: tileSize,
            height: tileSize,
            opacity: Math.max(0, tileOpacity),
            transform: `rotate(${tileRotation}deg) scale(${snapScale})`,
            transformOrigin: 'center center',
          }}
        >
          {/* Drop shadow */}
          <div
            style={{
              position: 'absolute',
              inset: 2,
              background: 'rgba(0,0,0,0.4)',
              borderRadius: 6,
              transform: 'translate(3px, 4px)',
            }}
          />
          {/* Tile face */}
          <div
            style={{
              position: 'absolute',
              inset: 2,
              background: 'linear-gradient(135deg, #f0e8d0 0%, #d4c090 100%)',
              borderRadius: 6,
              border: '2px solid #a0843a',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: 'inset 0 2px 4px rgba(255,255,255,0.5), inset 0 -2px 4px rgba(0,0,0,0.15)',
            }}
          >
            {/* Slot number (small, top-left) */}
            <span
              style={{
                position: 'absolute',
                top: tileSize * 0.06,
                left: tileSize * 0.1,
                fontFamily: "'Arial', sans-serif",
                fontSize: tileSize * 0.2,
                fontWeight: 700,
                color: '#8a6020',
                lineHeight: 1,
              }}
            >
              {tileNum}
            </span>
            {/* Main letter */}
            <span
              style={{
                fontFamily: "'Georgia', 'Times New Roman', serif",
                fontSize: tileSize * 0.55,
                fontWeight: 900,
                color,
                lineHeight: 1,
                textShadow: '1px 1px 0 rgba(0,0,0,0.15)',
              }}
            >
              {ch}
            </span>
          </div>
        </div>,
      )
    }

    // Golden solved-flash at end of enter
    const solvedFlash =
      phase === 'enter' && enterProgress > 0.87
        ? Math.sin(((enterProgress - 0.87) / 0.13) * Math.PI) * 0.6
        : 0
    if (solvedFlash > 0) {
      nodes.push(
        <div
          key="solved-flash"
          style={{
            position: 'absolute',
            inset: 0,
            background: `rgba(255,220,100,${solvedFlash * 0.35})`,
            pointerEvents: 'none',
          }}
        />,
      )
    }

    return <>{nodes}</>
  },
}

function SlidePuzzleComponent(props: MotionGraphicProps<SlidePuzzleConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-slide-puzzle',
  title: 'Kinetic Slide Puzzle',
  description: '15-puzzle style: letter tiles start in scrambled slots and each slides to its correct position in a cascade, revealing the word with a golden flash',
  tags: ['kinetic', 'typography', 'slide', 'puzzle', '15-puzzle', 'tiles', 'game', 'solve', 'mechanical'],
  category: 'captions',
  component: SlidePuzzleComponent as any,
  defaultConfig: {
    words: ['MOVE', 'SOLVE', 'PUSH', 'DONE'],
    colors: ['#cc4400', '#8844cc', '#0088cc', '#008844'],
    bgColor: '#1a1208',
    cycleDuration: 2.2,
  },
  configSchema: [
    { key: 'words', label: 'Words', type: 'text-array', defaultValue: ['MOVE', 'SOLVE', 'PUSH', 'DONE'], group: 'Content' },
    { key: 'colors', label: 'Colors', type: 'text-array', defaultValue: ['#cc4400', '#8844cc', '#0088cc', '#008844'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#1a1208', group: 'Style' },
    { key: 'cycleDuration', label: 'Cycle Duration (s)', type: 'number', defaultValue: 2.2, min: 0.5, max: 6, group: 'Timing' },
  ],
})
