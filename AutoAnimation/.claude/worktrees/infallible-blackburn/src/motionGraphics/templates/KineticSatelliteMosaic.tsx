import { registerMotionGraphic } from '../registry'
import { KineticBase, type KineticBaseConfig, type KineticAnimation, type WordRenderProps, type BackgroundRenderProps } from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface SatelliteMosaicConfig extends KineticBaseConfig {}

/** Deterministic pseudo-random 0..1 */
function rand(s: number): number {
  const x = Math.sin(s * 127.1 + 311.7) * 43758.5453
  return x - Math.floor(x)
}

// Satellite signal-loss block colors — oversaturated primary/secondary corruption
const BLOCK_COLORS = [
  '#FF0000', '#00FF00', '#0000FF', '#FFFF00',
  '#FF00FF', '#00FFFF', '#FF8800', '#8800FF',
]

const COLS = 10
const ROWS = 8

const animation: KineticAnimation = {
  renderBackground: ({ bgColor, frame, fps }: BackgroundRenderProps) => {
    const time = frame / fps
    // Slowly drifting signal quality indicator top-right
    const signalLevel = Math.max(0, Math.min(5, Math.floor((Math.sin(time * 0.3) * 0.5 + 0.5) * 6)))

    return (
      <div style={{ position: 'absolute', inset: 0, background: bgColor }}>
        {/* Signal strength indicator */}
        <div style={{
          position: 'absolute', top: 10, right: 12,
          display: 'flex', alignItems: 'flex-end', gap: 2,
        }}>
          {Array.from({ length: 5 }, (_, i) => (
            <div key={i} style={{
              width: 4,
              height: 4 + i * 3,
              borderRadius: 1,
              background: i < signalLevel ? 'rgba(0,200,255,0.4)' : 'rgba(255,255,255,0.06)',
            }} />
          ))}
        </div>
        {/* Satellite dish icon hint */}
        <div style={{
          position: 'absolute', top: 10, left: 12,
          fontFamily: "'Courier New', monospace",
          fontSize: 9,
          color: 'rgba(0,200,255,0.15)',
          letterSpacing: 1,
        }}>
          SAT-7 / TRANSPONDER C
        </div>
        {/* Faint scan lines */}
        <div style={{
          position: 'absolute', inset: 0,
          backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.15) 2px, rgba(0,0,0,0.15) 4px)',
          pointerEvents: 'none',
        }} />
      </div>
    )
  },

  renderWord: ({ word, color, enterProgress, holdProgress, exitProgress, phase, index, frame, width, height }: WordRenderProps) => {
    const f = frame ?? 0
    const seed = index * 137 + 29
    const colW = width / COLS
    const rowH = height / ROWS

    if (phase === 'enter') {
      // Mosaic blocks dissolve away to reveal text underneath
      // At enterProgress=0: full mosaic chaos. At 1: text fully revealed.
      const dissolveThreshold = enterProgress

      const blocks = Array.from({ length: COLS * ROWS }, (_, i) => {
        const col = i % COLS
        const row = Math.floor(i / COLS)
        // Each block has a deterministic reveal order based on its position + seed
        const revealOrder = rand(seed + col * 31 + row * 73)
        const isGone = revealOrder < dissolveThreshold

        if (isGone) return null

        const blockColor = BLOCK_COLORS[Math.floor(rand(seed + col * 17 + row * 43 + Math.floor(f / 3)) * BLOCK_COLORS.length)]
        const flicker = rand(seed + col * 97 + row * 53 + f) > 0.85

        return (
          <div
            key={i}
            style={{
              position: 'absolute',
              left: col * colW,
              top: row * rowH,
              width: colW + 1,
              height: rowH + 1,
              background: flicker ? '#111111' : blockColor,
              opacity: 0.9,
            }}
          />
        )
      })

      return (
        <div style={{ position: 'absolute', inset: 0 }}>
          {/* Text is always present underneath */}
          <div style={{
            position: 'absolute', top: '50%', left: '50%',
            transform: 'translate(-50%, -50%)',
            fontFamily: "'Arial Black', 'Impact', sans-serif",
            fontSize: 'clamp(44px, 11vw, 150px)',
            fontWeight: 900,
            color,
            whiteSpace: 'nowrap',
            letterSpacing: 4,
            textTransform: 'uppercase',
            opacity: enterProgress,
          }}>
            {word}
          </div>
          {/* Blocks overlay */}
          {blocks}
        </div>
      )
    } else if (phase === 'hold') {
      // Stable text with brief mosaic burst at 0.4 and 0.75
      const burst1 = holdProgress > 0.38 && holdProgress < 0.45
      const burst2 = holdProgress > 0.72 && holdProgress < 0.78

      const isBursting = burst1 || burst2
      const burstSeed = burst1 ? 1 : 2

      const burstBlocks = isBursting
        ? Array.from({ length: COLS * ROWS }, (_, i) => {
            const col = i % COLS
            const row = Math.floor(i / COLS)
            if (rand(burstSeed + col * 41 + row * 67) > 0.4) return null
            const blockColor = BLOCK_COLORS[Math.floor(rand(seed + col * 19 + row * 37 + f) * BLOCK_COLORS.length)]
            return (
              <div key={i} style={{
                position: 'absolute',
                left: col * colW, top: row * rowH,
                width: colW + 1, height: rowH + 1,
                background: blockColor,
                opacity: 0.85,
              }} />
            )
          })
        : null

      return (
        <div style={{ position: 'absolute', inset: 0 }}>
          <div style={{
            position: 'absolute', top: '50%', left: '50%',
            transform: 'translate(-50%, -50%)',
            fontFamily: "'Arial Black', 'Impact', sans-serif",
            fontSize: 'clamp(44px, 11vw, 150px)',
            fontWeight: 900,
            color,
            whiteSpace: 'nowrap',
            letterSpacing: 4,
            textTransform: 'uppercase',
            textShadow: `0 0 8px ${color}40`,
          }}>
            {word}
          </div>
          {burstBlocks}
        </div>
      )
    } else {
      // Exit: mosaic blocks re-assemble over text (reverse of enter)
      const coverThreshold = exitProgress

      const blocks = Array.from({ length: COLS * ROWS }, (_, i) => {
        const col = i % COLS
        const row = Math.floor(i / COLS)
        const revealOrder = rand(seed + col * 31 + row * 73)
        const isCovered = revealOrder < coverThreshold

        if (!isCovered) return null

        const blockColor = BLOCK_COLORS[Math.floor(rand(seed + col * 17 + row * 43 + Math.floor(f / 3)) * BLOCK_COLORS.length)]

        return (
          <div key={i} style={{
            position: 'absolute',
            left: col * colW, top: row * rowH,
            width: colW + 1, height: rowH + 1,
            background: blockColor,
            opacity: 0.9,
          }} />
        )
      })

      return (
        <div style={{ position: 'absolute', inset: 0 }}>
          <div style={{
            position: 'absolute', top: '50%', left: '50%',
            transform: 'translate(-50%, -50%)',
            fontFamily: "'Arial Black', 'Impact', sans-serif",
            fontSize: 'clamp(44px, 11vw, 150px)',
            fontWeight: 900,
            color,
            whiteSpace: 'nowrap',
            letterSpacing: 4,
            textTransform: 'uppercase',
            opacity: 1 - exitProgress * 0.5,
          }}>
            {word}
          </div>
          {blocks}
        </div>
      )
    }
  },
}

function SatelliteMosaicComponent(props: MotionGraphicProps<SatelliteMosaicConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-satellite-mosaic',
  title: 'Kinetic Satellite Mosaic',
  description: 'Satellite TV mosaic corruption — text breaks into colored digital blocks that reassemble, with signal strength indicator and transponder label',
  tags: ['kinetic', 'typography', 'glitch', 'satellite', 'mosaic', 'digital', 'corruption', 'tv', 'transmission'],
  category: 'captions',
  component: SatelliteMosaicComponent as any,
  defaultConfig: {
    words: ['SIGNAL', 'LOST', 'MOSAIC', 'ERROR'],
    colors: ['#FFFFFF', '#00CCFF', '#FFFFFF', '#FF4400'],
    bgColor: '#060608',
    cycleDuration: 1.6,
  },
  configSchema: [
    { key: 'words', label: 'Words', type: 'text-array', defaultValue: ['SIGNAL', 'LOST', 'MOSAIC', 'ERROR'], group: 'Content' },
    { key: 'colors', label: 'Colors', type: 'text-array', defaultValue: ['#FFFFFF', '#00CCFF', '#FFFFFF', '#FF4400'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#060608', group: 'Style' },
    { key: 'cycleDuration', label: 'Cycle Duration (s)', type: 'number', defaultValue: 1.6, min: 0.5, max: 5, group: 'Timing' },
  ],
})
