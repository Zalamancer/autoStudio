import { registerMotionGraphic } from '../registry'
import { KineticBase, type KineticBaseConfig, type KineticAnimation, type WordRenderProps, type BackgroundRenderProps } from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface UndoRedoConfig extends KineticBaseConfig {
  historyDepth: number
}

function dsin(seed: number): number {
  return Math.sin(seed * 127.1 + 311.7)
}

// Deterministic previous "versions" of the word
// Each version is a plausible earlier edit state
function getPreviousVersions(word: string, depth: number): string[] {
  const versions: string[] = []
  // Version history: strip characters from the end (simulates typing history)
  for (let i = 0; i < depth; i++) {
    const chopLen = Math.max(1, word.length - 1 - i)
    versions.push(word.slice(0, chopLen))
  }
  return versions.reverse() // oldest first
}

const UNDO_ICON = '↩'
const REDO_ICON = '↪'

const animation: KineticAnimation = {
  renderBackground: ({ bgColor, width, height, frame, fps }: BackgroundRenderProps) => {
    const time = frame / fps

    return (
      <div style={{ position: 'absolute', inset: 0, background: bgColor }}>
        {/* Editor toolbar */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: 44,
            background: 'rgba(255,255,255,0.03)',
            borderBottom: '1px solid rgba(255,255,255,0.08)',
            display: 'flex',
            alignItems: 'center',
            padding: '0 12px',
            gap: 4,
          }}
        >
          {/* Undo/Redo buttons */}
          {[UNDO_ICON, REDO_ICON].map((icon, i) => (
            <div
              key={i}
              style={{
                width: 28,
                height: 28,
                borderRadius: 4,
                background: 'rgba(255,255,255,0.05)',
                border: '1px solid rgba(255,255,255,0.08)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontFamily: "'Arial', sans-serif",
                fontSize: 14,
                color: 'rgba(255,255,255,0.45)',
              }}
            >
              {icon}
            </div>
          ))}
          {/* Separator */}
          <div style={{ width: 1, height: 20, background: 'rgba(255,255,255,0.1)', margin: '0 4px' }} />
          {/* Other toolbar items */}
          {['B', 'I', 'U'].map((t, i) => (
            <div
              key={i}
              style={{
                width: 28,
                height: 28,
                borderRadius: 4,
                background: 'rgba(255,255,255,0.03)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontFamily: "'Georgia', serif",
                fontSize: 13,
                color: 'rgba(255,255,255,0.25)',
                fontWeight: t === 'B' ? 700 : 400,
                fontStyle: t === 'I' ? 'italic' : 'normal',
                textDecoration: t === 'U' ? 'underline' : 'none',
              }}
            >
              {t}
            </div>
          ))}
          {/* Keyboard shortcut hint */}
          <div style={{ marginLeft: 'auto', fontFamily: "'SF Mono', monospace", fontSize: 10, color: 'rgba(255,255,255,0.2)', letterSpacing: 0.5 }}>
            Ctrl+Z · Ctrl+Y
          </div>
        </div>
        {/* Editor lines */}
        <div style={{ position: 'absolute', top: 60, left: '10%', right: '10%' }}>
          {Array.from({ length: 8 }, (_, i) => (
            <div
              key={i}
              style={{
                height: 12,
                marginBottom: 12,
                width: `${45 + Math.abs(dsin(i * 23 + 5)) * 40}%`,
                background: 'rgba(255,255,255,0.05)',
                borderRadius: 2,
              }}
            />
          ))}
        </div>
      </div>
    )
  },

  renderWord: ({ word, color, enterProgress, holdProgress, exitProgress, phase, index }: WordRenderProps) => {
    const seed = index * 89 + 53
    const historyDepth = 3
    const versions = [...getPreviousVersions(word, historyDepth), word]
    // versions = ['W', 'WO', 'WOR', 'WORD'] for example

    let opacity = 1
    if (phase === 'exit') opacity = 1 - exitProgress

    // Phase breakdown:
    // enter: current word types in
    // hold 0..0.15: stable (just typed)
    // hold 0.15..0.55: Ctrl+Z cycles back through history (undo)
    // hold 0.55..0.65: pause at earliest version (e.g. first letter)
    // hold 0.65..0.9: Ctrl+Y cycles forward (redo)
    // hold 0.9..1.0: correct/final version confirmed

    // Determine which version to show
    const undoPhaseStart = 0.15
    const undoPhaseEnd = 0.55
    const redoPhaseStart = 0.65
    const redoPhaseEnd = 0.9

    let versionIdx = versions.length - 1 // default: current word
    let isUndoing = false
    let isRedoing = false
    let actionFlash = 0
    let flashLabel = ''

    if (phase === 'hold') {
      if (holdProgress >= undoPhaseStart && holdProgress < undoPhaseEnd) {
        isUndoing = true
        const undoProgress = (holdProgress - undoPhaseStart) / (undoPhaseEnd - undoPhaseStart)
        // Step through versions backwards (newest to oldest)
        versionIdx = Math.max(0,
          versions.length - 1 - Math.floor(undoProgress * historyDepth)
        )
        // Flash on each step
        const stepFrac = (undoProgress * historyDepth) % 1
        actionFlash = stepFrac < 0.2 ? (1 - stepFrac / 0.2) * 0.4 : 0
        flashLabel = `${UNDO_ICON} Undo`
      } else if (holdProgress >= undoPhaseEnd && holdProgress < redoPhaseStart) {
        isUndoing = false
        versionIdx = 0
      } else if (holdProgress >= redoPhaseStart && holdProgress < redoPhaseEnd) {
        isRedoing = true
        const redoProgress = (holdProgress - redoPhaseStart) / (redoPhaseEnd - redoPhaseStart)
        versionIdx = Math.min(
          versions.length - 1,
          Math.floor(redoProgress * historyDepth) + 1
        )
        const stepFrac = (redoProgress * historyDepth) % 1
        actionFlash = stepFrac < 0.2 ? (1 - stepFrac / 0.2) * 0.4 : 0
        flashLabel = `${REDO_ICON} Redo`
      } else if (holdProgress >= redoPhaseEnd) {
        versionIdx = versions.length - 1
      }
    } else if (phase === 'enter') {
      // Typing in
      const typedLen = Math.ceil(enterProgress * word.length)
      const displayWord = word.slice(0, typedLen)
      return (
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 8,
          }}
        >
          <div
            style={{
              fontFamily: "'SF Mono', 'Courier New', monospace",
              fontSize: 'clamp(40px, 11vw, 140px)',
              fontWeight: 700,
              color,
              whiteSpace: 'nowrap',
              letterSpacing: 3,
            }}
          >
            {displayWord}
            <span
              style={{
                display: 'inline-block',
                width: 3,
                height: '0.85em',
                background: color,
                marginLeft: 3,
                verticalAlign: 'text-bottom',
                opacity: 1,
              }}
            />
          </div>
        </div>
      )
    }

    const displayWord = versions[versionIdx] ?? word
    const isAtFinal = versionIdx === versions.length - 1 && phase === 'hold' && holdProgress >= redoPhaseEnd
    const textColor = isAtFinal
      ? color
      : isUndoing
      ? `rgba(255,150,100,0.9)`
      : isRedoing
      ? `rgba(100,200,255,0.9)`
      : color

    // History stack visualization (ghost versions above/below)
    const showStack = phase === 'hold' && (isUndoing || isRedoing)

    return (
      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          opacity,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 6,
        }}
      >
        {/* Ghost history stack */}
        {showStack && versions.map((v, i) => {
          if (i === versionIdx) return null
          const dist = Math.abs(i - versionIdx)
          const ghostOpacity = Math.max(0, 0.25 - dist * 0.08)
          const yOff = (i - versionIdx) * 50
          return (
            <div
              key={i}
              style={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: `translate(-50%, calc(-50% + ${yOff}px))`,
                fontFamily: "'SF Mono', 'Courier New', monospace",
                fontSize: 'clamp(20px, 5.5vw, 70px)',
                fontWeight: 700,
                color: isUndoing ? 'rgba(255,150,100,' : 'rgba(100,200,255,',
                whiteSpace: 'nowrap',
                letterSpacing: 3,
                opacity: ghostOpacity,
                pointerEvents: 'none',
              }}
            >
              {v}
            </div>
          )
        })}

        {/* Main text */}
        <div
          style={{
            fontFamily: "'SF Mono', 'Courier New', monospace",
            fontSize: 'clamp(40px, 11vw, 140px)',
            fontWeight: 700,
            color: textColor,
            whiteSpace: 'nowrap',
            letterSpacing: 3,
            textShadow: actionFlash > 0
              ? `0 0 20px ${isUndoing ? 'rgba(255,150,100,' : 'rgba(100,200,255,'}${actionFlash})`
              : isAtFinal
              ? `0 0 15px ${color}30`
              : undefined,
          }}
        >
          {displayWord}
          {/* Cursor */}
          <span
            style={{
              display: 'inline-block',
              width: 3,
              height: '0.85em',
              background: textColor,
              marginLeft: 3,
              verticalAlign: 'text-bottom',
              opacity: phase === 'hold' ? (Math.floor(holdProgress * 6) % 2 === 0 ? 0.8 : 0) : 0,
            }}
          />
        </div>

        {/* Undo/Redo action label */}
        {flashLabel && actionFlash > 0.05 && (
          <div
            style={{
              fontFamily: "'SF Mono', 'Courier New', monospace",
              fontSize: 13,
              color: isUndoing ? 'rgba(255,150,100,0.8)' : 'rgba(100,200,255,0.8)',
              letterSpacing: 2,
              opacity: actionFlash * 2,
            }}
          >
            {flashLabel}
          </div>
        )}

        {/* Final confirmed state */}
        {isAtFinal && (
          <div
            style={{
              fontFamily: "'SF Mono', monospace",
              fontSize: 11,
              color: `rgba(100,220,100,${Math.min(1, (holdProgress - redoPhaseEnd) / 0.05)})`,
              letterSpacing: 2,
              marginTop: 4,
            }}
          >
            CONFIRMED
          </div>
        )}
      </div>
    )
  },
}

function UndoRedoComponent(props: MotionGraphicProps<UndoRedoConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-undo-redo',
  title: 'Kinetic Undo Redo',
  description: 'Ctrl+Z / Ctrl+Y effect: text cycles backward through edit history (orange), pauses, then redos forward (blue) to land on final version',
  tags: ['kinetic', 'typography', 'glitch', 'undo', 'redo', 'ctrl-z', 'editor', 'document', 'cultural'],
  category: 'captions',
  component: UndoRedoComponent as any,
  defaultConfig: {
    words: ['DONE', 'MADE', 'BUILT', 'WROTE'],
    colors: ['#e8eaed', '#e8eaed', '#e8eaed', '#e8eaed'],
    bgColor: '#141416',
    cycleDuration: 3.0,
    historyDepth: 3,
  },
  configSchema: [
    { key: 'words', label: 'Words', type: 'text-array', defaultValue: ['DONE', 'MADE', 'BUILT', 'WROTE'], group: 'Content' },
    { key: 'colors', label: 'Colors', type: 'text-array', defaultValue: ['#e8eaed', '#e8eaed', '#e8eaed', '#e8eaed'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#141416', group: 'Style' },
    { key: 'cycleDuration', label: 'Cycle Duration (s)', type: 'number', defaultValue: 3.0, min: 1.5, max: 8, group: 'Timing' },
    { key: 'historyDepth', label: 'History Depth', type: 'number', defaultValue: 3, min: 2, max: 5, group: 'Animation' },
  ],
})
