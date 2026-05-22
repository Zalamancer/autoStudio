import { registerMotionGraphic } from '../registry'
import {
  KineticBase,
  type KineticBaseConfig,
  type KineticAnimation,
  type WordRenderProps,
  type BackgroundRenderProps,
} from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface FileRecoveryConfig extends KineticBaseConfig {}

/** Deterministic pseudo-random 0..1 */
function rand(s: number): number {
  const x = Math.sin(s * 127.1 + 311.7) * 43758.5453
  return x - Math.floor(x)
}

/** Ease-in-out cubic */
function easeInOut(t: number): number {
  t = Math.max(0, Math.min(1, t))
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2
}

// Fragment placeholder characters — represent disk sector fragments
const FRAGMENT_CHARS = '▓▒░█▄▀■□▪▫◆◇●○►◄▲▼'

function fragmentChar(seed: number): string {
  return FRAGMENT_CHARS[Math.abs(Math.floor(rand(seed) * FRAGMENT_CHARS.length)) % FRAGMENT_CHARS.length]
}

const animation: KineticAnimation = {
  renderBackground: ({ bgColor, width, height, frame, fps }: BackgroundRenderProps) => {
    const time = frame / fps

    // Recovery progress indicator scrolling
    const recoveredSectors = Math.floor(40 + Math.sin(time * 0.6) * 20 + time * 3) % 100
    const barWidth = (recoveredSectors / 100) * (width - 30)

    // Disk cluster map — grid of small cells, some "recovered" some "lost"
    const cellSize = 7
    const cols = Math.floor(width / cellSize)
    const clusterRows = 3
    const cells: { x: number; y: number; state: 'recovered' | 'lost' | 'bad' }[] = []

    for (let r = 0; r < clusterRows; r++) {
      for (let c = 0; c < cols; c++) {
        const s = r * 300 + c + Math.floor(time * 1.5) * 17
        const v = rand(s)
        const state: 'recovered' | 'lost' | 'bad' = v < 0.55 ? 'recovered' : v < 0.75 ? 'lost' : 'bad'
        cells.push({ x: c * cellSize, y: height - 28 + r * (cellSize + 1), state })
      }
    }

    return (
      <div style={{ position: 'absolute', inset: 0, background: bgColor }}>
        {/* Cluster map */}
        {cells.map((cell, i) => (
          <div
            key={i}
            style={{
              position: 'absolute',
              left: cell.x,
              top: cell.y,
              width: cellSize - 1,
              height: cellSize - 1,
              background:
                cell.state === 'recovered'
                  ? 'rgba(80, 200, 120, 0.12)'
                  : cell.state === 'bad'
                  ? 'rgba(255, 60, 40, 0.12)'
                  : 'rgba(80, 80, 80, 0.08)',
            }}
          />
        ))}
        {/* Recovery status bar */}
        <div
          style={{
            position: 'absolute',
            top: 8,
            left: 10,
            right: 10,
            height: 2,
            background: 'rgba(80, 200, 120, 0.08)',
          }}
        >
          <div
            style={{
              position: 'absolute',
              left: 0,
              top: 0,
              height: '100%',
              width: barWidth,
              background: 'rgba(80, 200, 120, 0.20)',
            }}
          />
        </div>
        {/* Status text */}
        <div
          style={{
            position: 'absolute',
            top: 14,
            left: 10,
            fontFamily: "'Courier New', monospace",
            fontSize: 8,
            color: 'rgba(80, 200, 120, 0.12)',
          }}
        >
          RECOVERING DELETED FILE... {recoveredSectors}% COMPLETE
        </div>
      </div>
    )
  },

  renderWord: ({ word, color, enterProgress, holdProgress, exitProgress, phase, index, frame, width, height }: WordRenderProps) => {
    const f = frame ?? 0
    const seed = index * 163 + 89
    const chars = word.split('')
    const totalChars = chars.length

    if (phase === 'enter') {
      // Characters arrive one by one from "found fragments" — each has a drift position it snaps from
      const rendered = chars.map((realCh, ci) => {
        // Each character becomes available at a slightly different time
        const arriveAt = (ci / totalChars) * 0.7
        const charProgress = easeInOut(Math.max(0, Math.min(1, (enterProgress - arriveAt) / 0.3)))
        const arrived = charProgress >= 1

        if (!arrived && charProgress <= 0) {
          // Show fragment placeholder at a random offset
          const fx = (rand(seed + ci * 3) - 0.5) * 80
          const fy = (rand(seed + ci * 5 + 1) - 0.5) * 60
          return (
            <span
              key={ci}
              style={{
                display: 'inline-block',
                color: `${color}40`,
                transform: `translate(${fx}px, ${fy}px)`,
                opacity: 0.3,
              }}
            >
              {fragmentChar(ci * 31 + seed + Math.floor(f / 3))}
            </span>
          )
        }

        if (!arrived) {
          // Snapping into position from fragment offset
          const fx = (rand(seed + ci * 3) - 0.5) * 80 * (1 - charProgress)
          const fy = (rand(seed + ci * 5 + 1) - 0.5) * 60 * (1 - charProgress)
          const isStillFragment = charProgress < 0.7
          const displayChar = isStillFragment
            ? fragmentChar(ci * 31 + seed + Math.floor(f / 2))
            : realCh
          const displayColor = isStillFragment ? `${color}80` : color

          return (
            <span
              key={ci}
              style={{
                display: 'inline-block',
                color: displayColor,
                transform: `translate(${fx}px, ${fy}px)`,
                opacity: 0.3 + charProgress * 0.7,
              }}
            >
              {displayChar}
            </span>
          )
        }

        return (
          <span key={ci} style={{ display: 'inline-block', color }}>
            {realCh}
          </span>
        )
      })

      return (
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            fontFamily: "'Courier New', monospace",
            fontSize: 'clamp(38px, 11vw, 150px)',
            fontWeight: 700,
            whiteSpace: 'nowrap',
            letterSpacing: 3,
          }}
        >
          {rendered}
        </div>
      )
    } else if (phase === 'hold') {
      // Assembled, with a brief re-fragment shimmer mid-hold
      const shimmer = holdProgress > 0.45 && holdProgress < 0.5
      const rendered = chars.map((ch, ci) => {
        const isShimmering = shimmer && rand(seed + ci * 37) < 0.25
        return (
          <span
            key={ci}
            style={{
              display: 'inline-block',
              color: isShimmering ? `${color}70` : color,
              transform: isShimmering
                ? `translate(${(rand(seed + ci) - 0.5) * 3}px, ${(rand(seed + ci + 1) - 0.5) * 3}px)`
                : 'none',
            }}
          >
            {isShimmering ? fragmentChar(ci * 41 + f) : ch}
          </span>
        )
      })

      return (
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            fontFamily: "'Courier New', monospace",
            fontSize: 'clamp(38px, 11vw, 150px)',
            fontWeight: 700,
            whiteSpace: 'nowrap',
            letterSpacing: 3,
            color,
            textShadow: `0 0 8px ${color}20`,
          }}
        >
          {rendered}
        </div>
      )
    } else {
      // Exit: fragments disperse back outward
      const rendered = chars.map((realCh, ci) => {
        const disperseAt = (ci / totalChars) * 0.4
        const disperseProgress = easeInOut(Math.max(0, Math.min(1, (exitProgress - disperseAt) / 0.6)))
        const fx = (rand(seed + ci * 3) - 0.5) * 80 * disperseProgress
        const fy = (rand(seed + ci * 5 + 1) - 0.5) * 60 * disperseProgress
        const alpha = Math.max(0, 1 - disperseProgress * 1.2)

        return (
          <span
            key={ci}
            style={{
              display: 'inline-block',
              color,
              transform: `translate(${fx}px, ${fy}px)`,
              opacity: alpha,
            }}
          >
            {disperseProgress > 0.4 ? fragmentChar(ci * 53 + f) : realCh}
          </span>
        )
      })

      return (
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            fontFamily: "'Courier New', monospace",
            fontSize: 'clamp(38px, 11vw, 150px)',
            fontWeight: 700,
            whiteSpace: 'nowrap',
            letterSpacing: 3,
          }}
        >
          {rendered}
        </div>
      )
    }
  },
}

function FileRecoveryComponent(props: MotionGraphicProps<FileRecoveryConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-file-recovery',
  title: 'Kinetic File Recovery',
  description:
    'Recovering deleted file: character fragments drift in from scattered positions and snap together to form readable text, disk cluster map background.',
  tags: ['kinetic', 'typography', 'glitch', 'recovery', 'deleted', 'fragments', 'disk', 'digital'],
  category: 'captions',
  component: FileRecoveryComponent as any,
  defaultConfig: {
    words: ['RECOVER', 'DELETED', 'FOUND', 'RESTORED'],
    colors: ['#50C878', '#40B060', '#70E090', '#30A050'],
    bgColor: '#020804',
    cycleDuration: 1.8,
  },
  configSchema: [
    { key: 'words', label: 'Words', type: 'text-array', defaultValue: ['RECOVER', 'DELETED', 'FOUND', 'RESTORED'], group: 'Content' },
    { key: 'colors', label: 'Colors', type: 'text-array', defaultValue: ['#50C878', '#40B060', '#70E090', '#30A050'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#020804', group: 'Style' },
    { key: 'cycleDuration', label: 'Cycle Duration (s)', type: 'number', defaultValue: 1.8, min: 0.3, max: 5, group: 'Timing' },
  ],
})
