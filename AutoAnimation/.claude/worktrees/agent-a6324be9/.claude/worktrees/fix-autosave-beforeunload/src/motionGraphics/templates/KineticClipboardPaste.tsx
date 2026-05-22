import { registerMotionGraphic } from '../registry'
import {
  KineticBase,
  type KineticBaseConfig,
  type KineticAnimation,
  type WordRenderProps,
  type BackgroundRenderProps,
} from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface ClipboardPasteConfig extends KineticBaseConfig {}

const animation: KineticAnimation = {
  renderBackground: ({ bgColor, frame, fps }: BackgroundRenderProps) => {
    const time = frame / fps

    return (
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: bgColor,
        }}
      >
        {/* Faint text editor lines — like a text document */}
        {Array.from({ length: 12 }, (_, i) => {
          const lineWidths = [0.7, 0.45, 0.6, 0.3, 0.55, 0.72, 0.4, 0.62, 0.5, 0.35, 0.68, 0.42]
          return (
            <div
              key={i}
              style={{
                position: 'absolute',
                left: 'clamp(12px, 3vw, 24px)',
                top: `${8 + i * 7}%`,
                width: `${(lineWidths[i] ?? 0.5) * 70}%`,
                height: 'clamp(3px, 0.7vw, 6px)',
                background: 'rgba(255,255,255,0.06)',
                borderRadius: 2,
              }}
            />
          )
        })}

        {/* Ctrl+V keyboard shortcut hint top right */}
        <div
          style={{
            position: 'absolute',
            top: '5%',
            right: '5%',
            display: 'flex',
            gap: 4,
            opacity: 0.15,
            alignItems: 'center',
          }}
        >
          {['Ctrl', '+', 'V'].map((key, i) => (
            key === '+' ? (
              <span
                key={i}
                style={{
                  fontFamily: 'system-ui, -apple-system, sans-serif',
                  fontSize: 'clamp(7px, 1.4vw, 12px)',
                  color: 'rgba(255,255,255,0.6)',
                }}
              >
                +
              </span>
            ) : (
              <div
                key={i}
                style={{
                  background: 'rgba(255,255,255,0.1)',
                  border: '1px solid rgba(255,255,255,0.2)',
                  borderRadius: 4,
                  padding: 'clamp(2px, 0.5vw, 4px) clamp(4px, 1vw, 8px)',
                  fontFamily: 'system-ui, -apple-system, monospace',
                  fontSize: 'clamp(7px, 1.4vw, 12px)',
                  color: 'rgba(255,255,255,0.7)',
                  fontWeight: 600,
                }}
              >
                {key}
              </div>
            )
          ))}
        </div>
      </div>
    )
  },

  renderWord: ({ word, color, enterProgress, exitProgress, phase, frame }: WordRenderProps) => {
    const f = frame ?? 0

    let opacity = 1
    let clipboardIconOpacity = 0
    let clipboardIconScale = 0
    let clipboardIconY = 0
    let flashOpacity = 0
    let wordRevealProgress = 0
    let wordScale = 1
    let selectionOpacity = 0

    if (phase === 'enter') {
      if (enterProgress < 0.2) {
        // Clipboard icon flies in from above
        const t = enterProgress / 0.2
        clipboardIconOpacity = Math.min(1, t * 3)
        clipboardIconScale = 0.4 + t * 0.6
        clipboardIconY = -(1 - t) * 40
        wordRevealProgress = 0
        opacity = 0
      } else if (enterProgress < 0.4) {
        // Flash — Ctrl+V moment
        const t = (enterProgress - 0.2) / 0.2
        clipboardIconOpacity = 1 - t * 0.5
        clipboardIconScale = 1 + t * 0.3
        clipboardIconY = 0
        flashOpacity = Math.sin(t * Math.PI) * 0.6
        wordRevealProgress = 0
        opacity = 0
      } else if (enterProgress < 0.55) {
        // Icon gone, selection highlight sweeps left to right
        const t = (enterProgress - 0.4) / 0.15
        clipboardIconOpacity = 0
        flashOpacity = 0
        selectionOpacity = Math.min(1, t * 2)
        wordRevealProgress = t
        opacity = 0.01
      } else {
        // Word fully pastes in — scale punch
        const t = (enterProgress - 0.55) / 0.45
        clipboardIconOpacity = 0
        selectionOpacity = Math.max(0, 1 - t * 2)
        wordRevealProgress = 1
        const bounce = t < 0.5 ? t / 0.5 : 1 + Math.sin(((t - 0.5) / 0.5) * Math.PI) * 0.08
        wordScale = 0.85 + bounce * 0.15
        opacity = Math.min(1, t * 3)
      }
    } else if (phase === 'hold') {
      wordRevealProgress = 1
      selectionOpacity = 0
      // Subtle blink suggesting text selection
      const selectPulse = Math.sin(f * 0.05) * 0.5 + 0.5
      selectionOpacity = selectPulse * 0.08
    } else {
      wordRevealProgress = 1
      opacity = 1 - exitProgress * 1.5
      wordScale = 1 - exitProgress * 0.1
    }

    // Character reveal for paste effect
    const totalChars = word.length
    const charsVisible = Math.ceil(wordRevealProgress * totalChars)
    const displayWord = word.substring(0, charsVisible)

    // Clipboard icon SVG-like using divs
    const clipSize = 'clamp(32px, 7vw, 60px)'

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
          gap: 'clamp(6px, 1.5vw, 12px)',
        }}
      >
        {/* Clipboard icon */}
        {clipboardIconOpacity > 0.01 && (
          <div
            style={{
              opacity: clipboardIconOpacity,
              transform: `translateY(${clipboardIconY}px) scale(${clipboardIconScale})`,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
            }}
          >
            {/* Clipboard body */}
            <div
              style={{
                width: clipSize,
                height: `calc(${clipSize} * 1.2)`,
                background: 'rgba(255,255,255,0.15)',
                border: `2px solid ${color}`,
                borderRadius: 'clamp(3px, 0.6vw, 6px)',
                position: 'relative',
                display: 'flex',
                alignItems: 'flex-start',
                justifyContent: 'center',
                paddingTop: 'clamp(8px, 2vw, 14px)',
              }}
            >
              {/* Clip at top */}
              <div
                style={{
                  position: 'absolute',
                  top: 'clamp(-8px, -1.5vw, -12px)',
                  width: '55%',
                  height: 'clamp(8px, 1.8vw, 14px)',
                  background: color,
                  borderRadius: '4px 4px 0 0',
                }}
              />
              {/* Lines on clipboard */}
              {[0, 1, 2].map((i) => (
                <div
                  key={i}
                  style={{
                    position: 'absolute',
                    left: '15%',
                    right: '15%',
                    top: `${35 + i * 18}%`,
                    height: 'clamp(1px, 0.3vw, 2px)',
                    background: `${color}60`,
                    borderRadius: 1,
                  }}
                />
              ))}
            </div>
          </div>
        )}

        {/* Flash overlay */}
        {flashOpacity > 0 && (
          <div
            style={{
              position: 'absolute',
              inset: '-40px',
              background: color,
              opacity: flashOpacity,
              borderRadius: 8,
              pointerEvents: 'none',
            }}
          />
        )}

        {/* Main word with paste reveal */}
        <div style={{ position: 'relative' }}>
          {/* Selection highlight */}
          {selectionOpacity > 0 && (
            <div
              style={{
                position: 'absolute',
                inset: 0,
                background: color,
                opacity: selectionOpacity * 0.3,
                borderRadius: 4,
              }}
            />
          )}
          <div
            style={{
              opacity,
              transform: `scale(${wordScale})`,
              fontFamily: 'system-ui, -apple-system, "SF Pro Display", sans-serif',
              fontSize: 'clamp(30px, 7.5vw, 105px)',
              fontWeight: 800,
              color,
              whiteSpace: 'nowrap',
              letterSpacing: -1,
            }}
          >
            {displayWord}
            {/* Blinking text cursor during paste */}
            {wordRevealProgress > 0 && wordRevealProgress < 1 && (
              <span
                style={{
                  display: 'inline-block',
                  width: 'clamp(2px, 0.4vw, 3px)',
                  height: 'clamp(28px, 6.5vw, 88px)',
                  background: color,
                  marginLeft: 1,
                  verticalAlign: 'middle',
                  borderRadius: 1,
                }}
              />
            )}
          </div>
        </div>

        {/* "Pasted" toast label */}
        {phase !== 'enter' && (
          <div
            style={{
              fontFamily: 'system-ui, -apple-system, sans-serif',
              fontSize: 'clamp(8px, 1.6vw, 13px)',
              color: `${color}80`,
              letterSpacing: 2,
              textTransform: 'uppercase',
              opacity: phase === 'hold' ? 0.7 : Math.max(0, 1 - exitProgress * 2),
            }}
          >
            Pasted
          </div>
        )}
      </div>
    )
  },
}

function ClipboardPasteComponent(props: MotionGraphicProps<ClipboardPasteConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-clipboard-paste',
  title: 'Kinetic Clipboard Paste',
  description:
    'Ctrl+V paste animation — clipboard icon flies in, a flash triggers, text sweeps in character by character with selection highlight, then settles with a "Pasted" label',
  tags: ['kinetic', 'typography', 'clipboard', 'paste', 'ctrl-v', 'copy-paste', 'ui', 'digital'],
  category: 'captions',
  component: ClipboardPasteComponent as any,
  defaultConfig: {
    words: ['COPIED', 'PASTED', 'SHARED', 'SAVED'],
    colors: ['#007AFF', '#34C759', '#FF9500', '#AF52DE'],
    bgColor: '#141414',
    cycleDuration: 2.5,
  },
  configSchema: [
    {
      key: 'words',
      label: 'Words',
      type: 'text-array',
      defaultValue: ['COPIED', 'PASTED', 'SHARED', 'SAVED'],
      group: 'Content',
    },
    {
      key: 'colors',
      label: 'Colors',
      type: 'text-array',
      defaultValue: ['#007AFF', '#34C759', '#FF9500', '#AF52DE'],
      group: 'Style',
    },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#141414', group: 'Style' },
    {
      key: 'cycleDuration',
      label: 'Cycle Duration (s)',
      type: 'number',
      defaultValue: 2.5,
      min: 0.5,
      max: 5,
      group: 'Timing',
    },
  ],
})
