import { registerMotionGraphic } from '../registry'
import {
  KineticBase,
  type KineticBaseConfig,
  type KineticAnimation,
  type WordRenderProps,
  type BackgroundRenderProps,
} from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface AutoCorrectConfig extends KineticBaseConfig {
  typoSuffix: string
}

// Generate a deterministic typo for a word by swapping adjacent chars and inserting a common mistype
function generateTypo(word: string): string {
  if (word.length < 2) return word + 'z'
  // Swap chars 1&2 and duplicate last char — classic fat-finger typo
  const arr = word.toLowerCase().split('')
  // Swap positions 1 and 2 if long enough
  if (arr.length >= 3) {
    const tmp = arr[1]
    arr[1] = arr[2]
    arr[2] = tmp
  }
  // Add a spurious char at end based on last char's neighbor on keyboard
  const keyNeighbors: Record<string, string> = {
    a: 's', b: 'v', c: 'x', d: 'f', e: 'r', f: 'd', g: 'h', h: 'g',
    i: 'u', j: 'k', k: 'j', l: 'k', m: 'n', n: 'm', o: 'p', p: 'o',
    q: 'w', r: 'e', s: 'a', t: 'r', u: 'y', v: 'b', w: 'e', x: 'z',
    y: 'u', z: 'x',
  }
  const lastChar = arr[arr.length - 1]
  const neighbor = keyNeighbors[lastChar] ?? 'e'
  arr.push(neighbor)
  return arr.join('')
}

const animation: KineticAnimation = {
  renderBackground: ({ bgColor }: BackgroundRenderProps) => {
    return (
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: bgColor,
        }}
      >
        {/* iOS iMessage-style keyboard suggestion bar at bottom */}
        <div
          style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            height: 'clamp(30px, 7vw, 55px)',
            background: 'rgba(210, 210, 210, 0.95)',
            borderTop: '1px solid rgba(0,0,0,0.12)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-around',
            paddingLeft: 'clamp(8px, 2vw, 16px)',
            paddingRight: 'clamp(8px, 2vw, 16px)',
          }}
        >
          {['Did you mean...', 'Autocorrect', 'Undo'].map((label, i) => (
            <div
              key={i}
              style={{
                fontFamily: 'system-ui, -apple-system, sans-serif',
                fontSize: 'clamp(7px, 1.4vw, 12px)',
                color: i === 1 ? '#007AFF' : '#888',
                opacity: 0.5,
                padding: '3px 8px',
                borderRight: i < 2 ? '1px solid rgba(0,0,0,0.1)' : 'none',
                flex: 1,
                textAlign: 'center',
              }}
            >
              {label}
            </div>
          ))}
        </div>

        {/* Typing area chrome */}
        <div
          style={{
            position: 'absolute',
            bottom: 'clamp(30px, 7vw, 55px)',
            left: 'clamp(8px, 2vw, 16px)',
            right: 'clamp(8px, 2vw, 16px)',
            height: 'clamp(28px, 6vw, 48px)',
            background: 'rgba(255,255,255,0.08)',
            borderRadius: 20,
            border: '1px solid rgba(255,255,255,0.1)',
            opacity: 0.2,
          }}
        />
      </div>
    )
  },

  renderWord: ({ word, color, enterProgress, exitProgress, phase, frame }: WordRenderProps) => {
    const f = frame ?? 0
    const typo = generateTypo(word)

    let opacity = 1
    let displayText = ''
    let showRedUnderline = false
    let showCorrection = false
    let correctionOpacity = 0
    let correctionScale = 1
    let strikethrough = false

    if (phase === 'enter') {
      if (enterProgress < 0.35) {
        // Type the typo character by character
        const t = enterProgress / 0.35
        const charsToShow = Math.floor(t * typo.length)
        displayText = typo.substring(0, charsToShow)
        opacity = Math.min(1, t * 3)
      } else if (enterProgress < 0.55) {
        // Pause — red underline appears
        displayText = typo
        showRedUnderline = true
        const t = (enterProgress - 0.35) / 0.2
        opacity = 1
        correctionOpacity = 0
      } else if (enterProgress < 0.75) {
        // Autocorrect bubble pops up above
        displayText = typo
        showRedUnderline = true
        const t = (enterProgress - 0.55) / 0.2
        showCorrection = true
        correctionOpacity = Math.min(1, t * 3)
        correctionScale = 0.7 + t * 0.3
      } else {
        // Word swaps in
        const t = (enterProgress - 0.75) / 0.25
        strikethrough = t < 0.5
        if (t > 0.5) {
          // Snap to correct word
          const swapT = (t - 0.5) * 2
          displayText = word
          showRedUnderline = false
          showCorrection = false
          correctionOpacity = Math.max(0, 1 - swapT * 2)
        } else {
          displayText = typo
          showRedUnderline = true
          showCorrection = true
          correctionOpacity = 1
        }
      }
    } else if (phase === 'hold') {
      displayText = word
      showRedUnderline = false
    } else {
      displayText = word
      opacity = 1 - exitProgress * 1.5
    }

    // Cursor blink during typing
    const showCursor = phase === 'enter' && enterProgress < 0.45 && Math.sin(f * 0.25) > 0

    return (
      <div
        style={{
          position: 'absolute',
          top: '45%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          opacity,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 'clamp(6px, 1.5vw, 12px)',
        }}
      >
        {/* Autocorrect suggestion bubble */}
        {showCorrection && (
          <div
            style={{
              background: '#1C1C1E',
              borderRadius: 10,
              padding: 'clamp(4px, 1vw, 8px) clamp(10px, 2vw, 16px)',
              opacity: correctionOpacity,
              transform: `scale(${correctionScale})`,
              border: '1px solid rgba(255,255,255,0.15)',
              boxShadow: '0 4px 16px rgba(0,0,0,0.3)',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              position: 'relative',
            }}
          >
            <span
              style={{
                fontFamily: 'system-ui, -apple-system, sans-serif',
                fontSize: 'clamp(9px, 1.8vw, 14px)',
                color: 'rgba(255,255,255,0.5)',
              }}
            >
              Replace with
            </span>
            <span
              style={{
                fontFamily: 'system-ui, -apple-system, sans-serif',
                fontSize: 'clamp(9px, 1.8vw, 14px)',
                fontWeight: 700,
                color: '#007AFF',
              }}
            >
              "{word}"
            </span>
            {/* Triangle pointer */}
            <div
              style={{
                position: 'absolute',
                bottom: -6,
                left: '50%',
                transform: 'translateX(-50%)',
                width: 0,
                height: 0,
                borderLeft: '6px solid transparent',
                borderRight: '6px solid transparent',
                borderTop: '6px solid #1C1C1E',
              }}
            />
          </div>
        )}

        {/* Main text */}
        <div style={{ position: 'relative', display: 'inline-block' }}>
          <div
            style={{
              fontFamily: 'system-ui, -apple-system, "SF Pro Display", sans-serif',
              fontSize: 'clamp(30px, 7.5vw, 105px)',
              fontWeight: 700,
              color: showRedUnderline ? 'rgba(255,255,255,0.9)' : color,
              whiteSpace: 'nowrap',
              letterSpacing: -0.5,
              textDecoration: strikethrough ? 'line-through' : 'none',
              textDecorationColor: '#FF3B30',
            }}
          >
            {displayText}
            {showCursor && (
              <span
                style={{
                  display: 'inline-block',
                  width: 'clamp(2px, 0.4vw, 3px)',
                  height: 'clamp(28px, 6.5vw, 88px)',
                  background: '#007AFF',
                  marginLeft: 2,
                  verticalAlign: 'middle',
                  borderRadius: 1,
                }}
              />
            )}
          </div>

          {/* Red squiggly underline */}
          {showRedUnderline && displayText.length > 0 && (
            <div
              style={{
                position: 'absolute',
                bottom: 2,
                left: 0,
                right: 0,
                height: 'clamp(2px, 0.5vw, 4px)',
                backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='8' height='4'%3E%3Cpath d='M0 3 Q2 0 4 3 Q6 6 8 3' fill='none' stroke='%23FF3B30' stroke-width='1.5'/%3E%3C/svg%3E")`,
                backgroundRepeat: 'repeat-x',
                backgroundSize: 'clamp(6px, 1.5vw, 10px) auto',
              }}
            />
          )}
        </div>
      </div>
    )
  },
}

function AutoCorrectComponent(props: MotionGraphicProps<AutoCorrectConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-autocorrect',
  title: 'Kinetic AutoCorrect',
  description:
    'iOS autocorrect moment — text types in with a fat-finger typo, red squiggly underline appears, autocorrect bubble pops up, then the word snaps to the correct spelling',
  tags: ['kinetic', 'typography', 'autocorrect', 'ios', 'typing', 'spell-check', 'ui', 'digital', 'phone'],
  category: 'captions',
  component: AutoCorrectComponent as any,
  defaultConfig: {
    words: ['PERFECT', 'AMAZING', 'BLESSED', 'WINNING'],
    colors: ['#007AFF', '#34C759', '#FF9500', '#FF3B30'],
    bgColor: '#1C1C1E',
    cycleDuration: 3,
    typoSuffix: '',
  },
  configSchema: [
    {
      key: 'words',
      label: 'Words',
      type: 'text-array',
      defaultValue: ['PERFECT', 'AMAZING', 'BLESSED', 'WINNING'],
      group: 'Content',
    },
    {
      key: 'colors',
      label: 'Colors',
      type: 'text-array',
      defaultValue: ['#007AFF', '#34C759', '#FF9500', '#FF3B30'],
      group: 'Style',
    },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#1C1C1E', group: 'Style' },
    {
      key: 'cycleDuration',
      label: 'Cycle Duration (s)',
      type: 'number',
      defaultValue: 3,
      min: 1,
      max: 6,
      group: 'Timing',
    },
  ],
})
