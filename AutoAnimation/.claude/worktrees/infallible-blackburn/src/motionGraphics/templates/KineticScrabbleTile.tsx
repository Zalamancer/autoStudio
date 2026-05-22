import { registerMotionGraphic } from '../registry'
import { KineticBase, type KineticBaseConfig, type KineticAnimation, type WordRenderProps, type BackgroundRenderProps } from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface ScrabbleTileConfig extends KineticBaseConfig {}

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

// Scrabble letter values
const SCRABBLE_VALUES: Record<string, number> = {
  A:1,B:3,C:3,D:2,E:1,F:4,G:2,H:4,I:1,J:8,K:5,L:1,M:3,
  N:1,O:1,P:3,Q:10,R:1,S:1,T:1,U:1,V:4,W:4,X:8,Y:4,Z:10,
}

// Wooden Scrabble tile colors
const TILE_BG = '#f5deb3'
const TILE_BORDER = '#c8a96e'
const TILE_SHADOW = '#8b6914'
const BOARD_BG = '#b5914c'
const BOARD_LINE = '#9a7a3a'

const animation: KineticAnimation = {
  renderBackground: ({ bgColor, width, height }: BackgroundRenderProps) => {
    return (
      <div style={{ position: 'absolute', inset: 0, background: bgColor }}>
        {/* Scrabble board wood texture */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: `repeating-linear-gradient(
              45deg,
              ${BOARD_BG} 0px,
              ${BOARD_BG} 10px,
              rgba(0,0,0,0.04) 10px,
              rgba(0,0,0,0.04) 20px
            )`,
          }}
        />
        {/* Grid lines */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            backgroundImage: [
              `linear-gradient(${BOARD_LINE}55 1px, transparent 1px)`,
              `linear-gradient(90deg, ${BOARD_LINE}55 1px, transparent 1px)`,
            ].join(', '),
            backgroundSize: '40px 40px',
          }}
        />
      </div>
    )
  },

  renderWord: ({ word, color, enterProgress, holdProgress, exitProgress, phase, index, width, height, frame }: WordRenderProps) => {
    const f = frame ?? 0
    const chars = word.toUpperCase().split('')
    const wordLen = chars.length

    const tileSize = Math.min(
      Math.floor(width * 0.82 / wordLen),
      Math.floor(height * 0.45),
      72,
    )
    const tileGap = Math.max(3, tileSize * 0.06)
    const totalW = wordLen * tileSize + (wordLen - 1) * tileGap
    const startX = (width - totalW) / 2
    const centerY = (height - tileSize) / 2

    // Snap offset: tiles "snap" to grid at the end of enter
    const snapProgress = phase === 'enter' ? easeOutCubic(Math.min(1, enterProgress * 1.15)) : 1

    const nodes: React.ReactNode[] = []

    for (let ci = 0; ci < wordLen; ci++) {
      const ch = chars[ci]
      const value = SCRABBLE_VALUES[ch] ?? 1

      // Stagger: each tile slides in from above with delay
      const delay = (ci / wordLen) * 0.5
      const tileProg = Math.max(0, Math.min(1, (enterProgress - delay) / 0.45))
      const tileEased = easeOutCubic(tileProg)

      const finalX = startX + ci * (tileSize + tileGap)
      const finalY = centerY

      let x = finalX
      let y = finalY
      let opacity = 1
      let rotation = 0
      let scale = 1

      if (phase === 'enter') {
        // Slide in from above, slight rotation, then snap
        y = finalY - (1 - tileEased) * height * 0.55
        rotation = (1 - tileEased) * (pRand(index * 73 + ci * 17) > 0.5 ? 25 : -25)
        opacity = Math.min(1, tileProg * 3)
        scale = 0.85 + tileEased * 0.15
        // Snap "click" at end
        if (tileProg > 0.85) {
          const snapT = (tileProg - 0.85) / 0.15
          scale = 1 + Math.sin(snapT * Math.PI) * 0.08
        }
      } else if (phase === 'hold') {
        // Slight wobble on hold
        const wobble = Math.sin(f * 0.04 + ci * 0.9) * 0.8
        rotation = wobble
        y = finalY + Math.sin(f * 0.03 + ci * 1.2) * 0.5
      } else {
        // Exit: tiles slide off downward in a wave
        const exitDelay = (ci / wordLen) * 0.35
        const ep = Math.max(0, Math.min(1, (exitProgress - exitDelay) / 0.55))
        y = finalY + easeInCubic(ep) * height * 0.6
        rotation = ep * (ci % 2 === 0 ? 30 : -30)
        opacity = 1 - ep * 1.2
        scale = 1 - ep * 0.2
      }

      const ts = tileSize * scale
      const adjustX = x + (tileSize - ts) / 2
      const adjustY = y + (tileSize - ts) / 2

      nodes.push(
        <div
          key={ci}
          style={{
            position: 'absolute',
            left: adjustX,
            top: adjustY,
            width: ts,
            height: ts,
            opacity: Math.max(0, opacity),
            transform: `rotate(${rotation}deg)`,
            transformOrigin: 'center center',
          }}
        >
          {/* Tile shadow */}
          <div
            style={{
              position: 'absolute',
              inset: 0,
              background: TILE_SHADOW,
              borderRadius: ts * 0.08,
              transform: 'translate(3px, 4px)',
              opacity: 0.5,
            }}
          />
          {/* Tile body */}
          <div
            style={{
              position: 'absolute',
              inset: 0,
              background: `linear-gradient(135deg, ${TILE_BG} 0%, #e8c870 100%)`,
              borderRadius: ts * 0.08,
              border: `${ts * 0.04}px solid ${TILE_BORDER}`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexDirection: 'column',
              boxShadow: `inset 0 1px 2px rgba(255,255,255,0.6), inset 0 -1px 2px rgba(0,0,0,0.15)`,
            }}
          >
            {/* Main letter */}
            <span
              style={{
                fontFamily: "'Georgia', 'Times New Roman', serif",
                fontSize: ts * 0.58,
                fontWeight: 700,
                color: '#1a0a00',
                lineHeight: 1,
                letterSpacing: -1,
                marginTop: ts * 0.04,
              }}
            >
              {ch}
            </span>
            {/* Point value in corner */}
            <span
              style={{
                position: 'absolute',
                bottom: ts * 0.06,
                right: ts * 0.08,
                fontFamily: "'Georgia', serif",
                fontSize: ts * 0.2,
                fontWeight: 700,
                color: '#5a3800',
                lineHeight: 1,
              }}
            >
              {value}
            </span>
          </div>
        </div>,
      )
    }

    // Score display during hold
    if (phase === 'hold' && holdProgress > 0.2) {
      const totalScore = chars.reduce((sum, ch) => sum + (SCRABBLE_VALUES[ch] ?? 1), 0)
      const scoreAlpha = Math.min(1, (holdProgress - 0.2) / 0.2)
      nodes.push(
        <div
          key="score"
          style={{
            position: 'absolute',
            left: startX + totalW + 12,
            top: centerY + tileSize * 0.2,
            fontFamily: "'Georgia', serif",
            fontSize: tileSize * 0.45,
            fontWeight: 700,
            color: '#FFD700',
            opacity: scoreAlpha,
            textShadow: '0 2px 4px rgba(0,0,0,0.5)',
            whiteSpace: 'nowrap',
          }}
        >
          +{totalScore}
        </div>,
      )
    }

    return <>{nodes}</>
  },
}

function ScrabbleTileComponent(props: MotionGraphicProps<ScrabbleTileConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-scrabble-tile',
  title: 'Kinetic Scrabble Tile',
  description: 'Scrabble tiles slide onto a wooden board one by one, snapping to grid positions with letter values displayed — score tallied during hold',
  tags: ['kinetic', 'typography', 'scrabble', 'tiles', 'board', 'game', 'wooden', 'letters', 'score'],
  category: 'captions',
  component: ScrabbleTileComponent as any,
  defaultConfig: {
    words: ['SCORE', 'WORD', 'PLAY', 'WIN'],
    colors: ['#1a0a00', '#1a0a00', '#1a0a00', '#1a0a00'],
    bgColor: '#7a5c2a',
    cycleDuration: 2.0,
  },
  configSchema: [
    { key: 'words', label: 'Words', type: 'text-array', defaultValue: ['SCORE', 'WORD', 'PLAY', 'WIN'], group: 'Content' },
    { key: 'colors', label: 'Colors', type: 'text-array', defaultValue: ['#1a0a00', '#1a0a00', '#1a0a00', '#1a0a00'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#7a5c2a', group: 'Style' },
    { key: 'cycleDuration', label: 'Cycle Duration (s)', type: 'number', defaultValue: 2.0, min: 0.5, max: 6, group: 'Timing' },
  ],
})
