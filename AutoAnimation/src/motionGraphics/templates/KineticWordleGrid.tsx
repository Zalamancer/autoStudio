import { registerMotionGraphic } from '../registry'
import {
  KineticBase,
  type KineticBaseConfig,
  type KineticAnimation,
  type WordRenderProps,
  type BackgroundRenderProps,
} from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface WordleGridConfig extends KineticBaseConfig {}

function easeOutExpo(t: number): number {
  return t === 1 ? 1 : 1 - Math.pow(2, -10 * t)
}

function easeOutBack(t: number): number {
  const c1 = 1.70158
  const c3 = c1 + 1
  return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2)
}

// Pre-defined "game" leading to a 5-letter word
function getWordleRows(word: string): { letter: string; state: 'correct' | 'present' | 'absent' | 'empty' }[][] {
  const target = (word + 'XXXXX').substring(0, 5).toUpperCase()
  const guesses = ['CRANE', 'SLUMP', 'BOOZY', 'FIGHT']
  const rows = guesses.map((guess) => {
    return guess.split('').map((l, i) => ({
      letter: l,
      state: (l === target[i] ? 'correct' : target.includes(l) ? 'present' : 'absent') as
        | 'correct'
        | 'present'
        | 'absent',
    }))
  })
  // Last row = the correct word
  rows.push(target.split('').map((l) => ({ letter: l, state: 'correct' as const })))
  // Empty row
  rows.push(Array.from({ length: 5 }, () => ({ letter: '', state: 'absent' as const })))
  return rows
}

const STATE_COLORS: Record<string, string> = {
  correct: '#538D4E',
  present: '#B59F3B',
  absent: '#3A3A3C',
  empty: 'transparent',
}
const STATE_BORDERS: Record<string, string> = {
  correct: '#538D4E',
  present: '#B59F3B',
  absent: '#818384',
  empty: '#3A3A3C',
}

const animation: KineticAnimation = {
  renderBackground: ({ bgColor }: BackgroundRenderProps) => (
    <div style={{ position: 'absolute', inset: 0, background: bgColor }}>
      {/* Wordle header */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: 'clamp(24px, 4.8vw, 38px)',
          borderBottom: '1px solid rgba(255,255,255,0.12)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <span
          style={{
            fontFamily: '"Helvetica Neue", system-ui, sans-serif',
            fontSize: 'clamp(11px, 2.2vw, 17px)',
            fontWeight: 800,
            color: '#fff',
            letterSpacing: 4,
            textTransform: 'uppercase',
          }}
        >
          Wordle
        </span>
      </div>

      {/* Keyboard hint at bottom */}
      <div
        style={{
          position: 'absolute',
          bottom: 'clamp(6px, 1.5vw, 12px)',
          left: '50%',
          transform: 'translateX(-50%)',
          display: 'flex',
          flexDirection: 'column',
          gap: 4,
          alignItems: 'center',
        }}
      >
        {['QWERTYUIOP', 'ASDFGHJKL', 'ZXCVBNM'].map((row, ri) => (
          <div key={ri} style={{ display: 'flex', gap: 3 }}>
            {row.split('').map((k, ki) => (
              <div
                key={ki}
                style={{
                  width: 'clamp(10px, 2vw, 16px)',
                  height: 'clamp(12px, 2.4vw, 19px)',
                  background: '#818384',
                  borderRadius: 3,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontFamily: 'system-ui, sans-serif',
                  fontSize: 'clamp(5px, 0.8vw, 6px)',
                  fontWeight: 700,
                  color: '#fff',
                  opacity: 0.5,
                }}
              >
                {k}
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  ),

  renderWord: ({ word, color, enterProgress, exitProgress, phase, index, width, height, frame }: WordRenderProps) => {
    const f = frame ?? 0
    const rows = getWordleRows(word)
    const cols = 5
    const cellSize = Math.min((width * 0.55) / cols, (height * 0.52) / rows.length, 46)
    const gap = 4
    const gridW = cols * cellSize + (cols - 1) * gap
    const gridH = rows.length * cellSize + (rows.length - 1) * gap
    const gridX = (width - gridW) / 2
    const gridY = height * 0.1

    const nodes: React.ReactNode[] = []

    rows.forEach((row, ri) => {
      row.forEach((cell, ci) => {
        // Rows reveal one by one
        const rowDelay = ri * 0.12
        const cellDelay = rowDelay + ci * 0.04
        const cellP = easeOutExpo(Math.min(1, Math.max(0, (enterProgress - cellDelay) / 0.15)))

        // Flip animation for each cell revealing
        const flipDelay = rowDelay + ci * 0.06 + 0.05
        const flipP = Math.min(1, Math.max(0, (enterProgress - flipDelay) / 0.12))
        const isFlipping = flipP > 0 && flipP < 1
        const scaleY = isFlipping ? Math.abs(Math.cos(flipP * Math.PI)) : 1
        const showBack = flipP > 0.5
        const bg = showBack ? STATE_COLORS[cell.state] : 'transparent'
        const border = showBack ? STATE_BORDERS[cell.state] : STATE_BORDERS[cell.state]

        const cx = gridX + ci * (cellSize + gap)
        const cy = gridY + ri * (cellSize + gap)

        const isLastRow = ri === rows.length - 2 // The winning row
        const shake = isLastRow && phase === 'hold' ? Math.sin(f * 0.25) * 2 : 0

        const cellOpacity = phase === 'exit' ? Math.max(0, 1 - exitProgress * 2) : cellP

        nodes.push(
          <div
            key={`cell-${ri}-${ci}`}
            style={{
              position: 'absolute',
              left: cx,
              top: cy + shake,
              width: cellSize,
              height: cellSize,
              background: bg,
              border: `2px solid ${border}`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transform: `scaleY(${scaleY})`,
              opacity: cellOpacity,
              borderRadius: 2,
            }}
          >
            {cell.letter && (
              <span
                style={{
                  fontFamily: '"Helvetica Neue", system-ui, sans-serif',
                  fontSize: `${cellSize * 0.55}px`,
                  fontWeight: 800,
                  color: showBack ? '#fff' : 'rgba(255,255,255,0.9)',
                  transform: `scaleY(${1 / Math.max(0.01, scaleY)})`,
                  display: 'block',
                  lineHeight: 1,
                }}
              >
                {cell.letter}
              </span>
            )}
          </div>,
        )
      })
    })

    // WIN banner + word
    const winReveal = easeOutBack(Math.min(1, Math.max(0, (enterProgress - 0.7) / 0.3)))
    const winOpacity =
      phase === 'exit' ? Math.max(0, 1 - exitProgress * 1.5) : Math.min(1, Math.max(0, (enterProgress - 0.65) * 5))
    const bounce = phase === 'hold' ? 1 + Math.sin(f * 0.1) * 0.018 : 1

    if (winOpacity > 0) {
      nodes.push(
        <div
          key="win"
          style={{
            position: 'absolute',
            top: gridY + gridH + 8,
            left: '50%',
            transform: `translateX(-50%) scale(${winReveal * bounce})`,
            opacity: winOpacity,
            textAlign: 'center',
            whiteSpace: 'nowrap',
          }}
        >
          <div
            style={{
              fontFamily: '"Helvetica Neue", system-ui, sans-serif',
              fontSize: 'clamp(22px, 5.5vw, 76px)',
              fontWeight: 900,
              color,
              textShadow: `0 0 20px ${color}55`,
              letterSpacing: -1,
            }}
          >
            {word}
          </div>
          <div
            style={{
              fontFamily: 'system-ui, sans-serif',
              fontSize: 'clamp(6px, 1.1vw, 9px)',
              color: '#538D4E',
              fontWeight: 700,
              marginTop: 3,
              letterSpacing: 2,
            }}
          >
            SOLVED IN 5/6
          </div>
        </div>,
      )
    }

    return <>{nodes}</>
  },
}

function WordleGridComponent(props: MotionGraphicProps<WordleGridConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-wordle-grid',
  title: 'Kinetic Wordle Grid',
  description:
    'Wordle 6×5 grid fills in with flip animations — green/yellow/gray tile reveals solve toward the word, which bursts out below the grid as a victory reveal',
  tags: ['kinetic', 'typography', 'wordle', 'nyt', 'game', 'word', 'grid', 'internet-moment', 'digital-native'],
  category: 'captions',
  component: WordleGridComponent as any,
  defaultConfig: {
    words: ['BLAZE', 'GRIND', 'VIBE', 'GOAT'],
    colors: ['#538D4E', '#B59F3B', '#007AFF', '#FF3B30'],
    bgColor: '#121213',
    cycleDuration: 2.8,
  },
  configSchema: [
    {
      key: 'words',
      label: 'Words',
      type: 'text-array',
      defaultValue: ['BLAZE', 'GRIND', 'VIBE', 'GOAT'],
      group: 'Content',
    },
    {
      key: 'colors',
      label: 'Colors',
      type: 'text-array',
      defaultValue: ['#538D4E', '#B59F3B', '#007AFF', '#FF3B30'],
      group: 'Style',
    },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#121213', group: 'Style' },
    {
      key: 'cycleDuration',
      label: 'Cycle Duration (s)',
      type: 'number',
      defaultValue: 2.8,
      min: 0.5,
      max: 6,
      group: 'Timing',
    },
  ],
})
