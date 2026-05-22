import { registerMotionGraphic } from '../registry'
import { KineticBase, type KineticBaseConfig, type KineticAnimation, type WordRenderProps, type BackgroundRenderProps } from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface GitDiffConfig extends KineticBaseConfig {}

// Deterministic fake file paths and line snippets for background
const DIFF_LINES = [
  { prefix: '@@', text: ' -12,7 +12,9 @@ function render() {', color: 'rgba(100, 150, 255, 0.18)' },
  { prefix: ' ', text: '  const prev = state.value', color: 'rgba(200, 200, 200, 0.07)' },
  { prefix: '-', text: '  return <div>{prev}</div>', color: 'rgba(255, 80, 80, 0.13)' },
  { prefix: '+', text: '  return <span>{prev}</span>', color: 'rgba(80, 255, 130, 0.13)' },
  { prefix: '+', text: '  // updated markup', color: 'rgba(80, 255, 130, 0.10)' },
  { prefix: ' ', text: '}', color: 'rgba(200, 200, 200, 0.07)' },
  { prefix: '@@', text: ' -28,3 +30,4 @@ export default App', color: 'rgba(100, 150, 255, 0.18)' },
  { prefix: '-', text: '  background: "#ff0000"', color: 'rgba(255, 80, 80, 0.13)' },
  { prefix: '+', text: '  background: "#1e90ff"', color: 'rgba(80, 255, 130, 0.13)' },
  { prefix: ' ', text: '  margin: 0,', color: 'rgba(200, 200, 200, 0.07)' },
]

const animation: KineticAnimation = {
  renderBackground: ({ bgColor, frame, fps }: BackgroundRenderProps) => {
    return (
      <div style={{ position: 'absolute', inset: 0, background: bgColor }}>
        {/* File header */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: 30,
            background: 'rgba(255,255,255,0.04)',
            borderBottom: '1px solid rgba(255,255,255,0.08)',
            display: 'flex',
            alignItems: 'center',
            paddingLeft: 12,
            gap: 8,
          }}
        >
          <span style={{ fontFamily: "'Courier New', monospace", fontSize: 10, color: 'rgba(200,200,200,0.35)' }}>
            diff --git a/src/App.tsx b/src/App.tsx
          </span>
        </div>

        {/* Background diff lines */}
        {DIFF_LINES.map((line, i) => (
          <div
            key={i}
            style={{
              position: 'absolute',
              left: 0,
              right: 0,
              top: 38 + i * 17,
              display: 'flex',
              alignItems: 'center',
              background:
                line.prefix === '+'
                  ? 'rgba(80,255,130,0.04)'
                  : line.prefix === '-'
                  ? 'rgba(255,80,80,0.04)'
                  : 'transparent',
              paddingLeft: 8,
            }}
          >
            <span
              style={{
                fontFamily: "'Courier New', monospace",
                fontSize: 10,
                color: line.color,
                whiteSpace: 'pre',
              }}
            >
              {line.prefix} {line.text}
            </span>
          </div>
        ))}

        {/* Scan line overlay */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            backgroundImage:
              'repeating-linear-gradient(0deg, transparent, transparent 1px, rgba(0,0,0,0.06) 1px, rgba(0,0,0,0.06) 2px)',
            pointerEvents: 'none',
          }}
        />
      </div>
    )
  },

  renderWord: ({ word, color, enterProgress, holdProgress, exitProgress, phase, frame }: WordRenderProps) => {
    const f = frame ?? 0

    if (phase === 'enter') {
      // Lines arrive: first shows "-removed" (red), then "+" added (green) sweeps in
      const removedOpacity = Math.min(1, enterProgress * 3)
      const addedProgress = Math.max(0, (enterProgress - 0.4) / 0.6)
      const addedChars = Math.floor(addedProgress * (word.length + 1))
      const addedText = word.substring(0, addedChars)
      const showCursor = Math.floor(f * 0.15) % 2 === 0 && addedChars < word.length

      return (
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'flex-start',
            gap: 4,
            fontFamily: "'Fira Code', 'Courier New', monospace",
            fontWeight: 700,
            whiteSpace: 'nowrap',
          }}
        >
          {/* Removed line */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              opacity: removedOpacity,
              background: 'rgba(255,80,80,0.12)',
              padding: '2px 12px 2px 8px',
              borderRadius: 2,
            }}
          >
            <span style={{ color: '#ff7b7b', fontSize: 'clamp(20px, 5vw, 60px)', minWidth: 20 }}>-</span>
            <span
              style={{
                color: '#ff7b7b',
                fontSize: 'clamp(22px, 6vw, 70px)',
                textDecoration: 'line-through',
                opacity: 0.7,
              }}
            >
              {word}
            </span>
          </div>
          {/* Added line */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              background: 'rgba(80,255,130,0.12)',
              padding: '2px 12px 2px 8px',
              borderRadius: 2,
            }}
          >
            <span style={{ color: '#5dfc8d', fontSize: 'clamp(20px, 5vw, 60px)', minWidth: 20 }}>+</span>
            <span style={{ color, fontSize: 'clamp(22px, 6vw, 70px)' }}>
              {addedText}
              {showCursor && <span style={{ color, opacity: 0.9 }}>|</span>}
            </span>
          </div>
        </div>
      )
    } else if (phase === 'hold') {
      // Only the green + line remains: fully resolved
      return (
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            background: 'rgba(80,255,130,0.12)',
            padding: '4px 16px 4px 10px',
            borderRadius: 3,
            border: '1px solid rgba(80,255,130,0.2)',
            fontFamily: "'Fira Code', 'Courier New', monospace",
            fontWeight: 700,
            whiteSpace: 'nowrap',
          }}
        >
          <span style={{ color: '#5dfc8d', fontSize: 'clamp(20px, 5vw, 60px)', minWidth: 20 }}>+</span>
          <span
            style={{
              color,
              fontSize: 'clamp(22px, 6vw, 70px)',
              textShadow: `0 0 12px ${color}40`,
            }}
          >
            {word}
          </span>
        </div>
      )
    } else {
      // Exit: fade and shrink
      const opacity = 1 - exitProgress
      const scale = 1 - exitProgress * 0.08

      return (
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: `translate(-50%, -50%) scale(${scale})`,
            opacity,
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            background: 'rgba(80,255,130,0.08)',
            padding: '4px 16px 4px 10px',
            borderRadius: 3,
            fontFamily: "'Fira Code', 'Courier New', monospace",
            fontWeight: 700,
            whiteSpace: 'nowrap',
          }}
        >
          <span style={{ color: '#5dfc8d', fontSize: 'clamp(20px, 5vw, 60px)', minWidth: 20 }}>+</span>
          <span style={{ color, fontSize: 'clamp(22px, 6vw, 70px)' }}>{word}</span>
        </div>
      )
    }
  },
}

function GitDiffComponent(props: MotionGraphicProps<GitDiffConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-git-diff',
  title: 'Kinetic Git Diff',
  description:
    'Git diff aesthetic: text appears as a red -removed line then resolves to green +added, mimicking GitHub/VS Code diff view',
  tags: ['kinetic', 'typography', 'git', 'diff', 'code', 'developer', 'github', 'tech'],
  category: 'captions',
  component: GitDiffComponent as any,
  defaultConfig: {
    words: ['SHIPPED', 'MERGED', 'FIXED', 'REFACTORED'],
    colors: ['#5dfc8d', '#5dfc8d', '#5dfc8d', '#5dfc8d'],
    bgColor: '#0d1117',
    cycleDuration: 2,
  },
  configSchema: [
    { key: 'words', label: 'Words', type: 'text-array', defaultValue: ['SHIPPED', 'MERGED', 'FIXED', 'REFACTORED'], group: 'Content' },
    { key: 'colors', label: 'Added Color', type: 'text-array', defaultValue: ['#5dfc8d'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#0d1117', group: 'Style' },
    { key: 'cycleDuration', label: 'Cycle Duration (s)', type: 'number', defaultValue: 2, min: 0.8, max: 6, group: 'Timing' },
  ],
})
