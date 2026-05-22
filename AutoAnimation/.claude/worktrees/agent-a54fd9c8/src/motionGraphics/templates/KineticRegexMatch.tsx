import { registerMotionGraphic } from '../registry'
import { KineticBase, type KineticBaseConfig, type KineticAnimation, type WordRenderProps, type BackgroundRenderProps } from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface RegexMatchConfig extends KineticBaseConfig {}

// A few regex patterns to cycle as background decoration
const REGEX_PATTERNS = [
  '/^[a-zA-Z]+$/',
  '/\\d{4}-\\d{2}-\\d{2}/',
  '/https?:\\/\\/[^\\s]+/',
  '/[A-Z][a-z]+/',
  '/^\\w+@\\w+\\.\\w+$/',
]

function seeded(n: number) {
  const x = Math.sin(n * 7919 + 2053) * 13441
  return x - Math.floor(x)
}

const animation: KineticAnimation = {
  renderBackground: ({ bgColor, frame, fps }: BackgroundRenderProps) => {
    const time = frame / fps

    return (
      <div style={{ position: 'absolute', inset: 0, background: bgColor }}>
        {/* Regex tester header */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: 32,
            background: 'rgba(255,204,0,0.05)',
            borderBottom: '1px solid rgba(255,204,0,0.12)',
            display: 'flex',
            alignItems: 'center',
            paddingLeft: 12,
            gap: 8,
          }}
        >
          <span style={{ fontFamily: "'Fira Code', monospace", fontSize: 11, color: 'rgba(255,204,0,0.35)' }}>
            regex101 · Pattern Test
          </span>
          <span style={{ fontFamily: "'Fira Code', monospace", fontSize: 10, color: 'rgba(80,200,255,0.3)', marginLeft: 'auto', paddingRight: 12 }}>
            {Math.floor(seeded(frame) * 9 + 1)} match{Math.floor(seeded(frame) * 9 + 1) !== 1 ? 'es' : ''}
          </span>
        </div>

        {/* Floating regex patterns in background */}
        {REGEX_PATTERNS.map((pat, i) => {
          const y = 42 + i * 30
          const xShift = Math.sin(time * 0.4 + i * 1.3) * 5
          return (
            <div
              key={i}
              style={{
                position: 'absolute',
                left: 12 + xShift,
                top: y,
                fontFamily: "'Fira Code', 'Courier New', monospace",
                fontSize: 11,
                color: 'rgba(255,204,0,0.08)',
                whiteSpace: 'nowrap',
              }}
            >
              {pat}
            </div>
          )
        })}

        {/* Match result panel bottom */}
        <div
          style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            height: 24,
            background: 'rgba(0,0,0,0.3)',
            display: 'flex',
            alignItems: 'center',
            paddingLeft: 12,
            gap: 16,
          }}
        >
          <span style={{ fontFamily: 'monospace', fontSize: 10, color: 'rgba(80,200,255,0.3)' }}>
            MATCH FOUND
          </span>
          <span style={{ fontFamily: 'monospace', fontSize: 10, color: 'rgba(255,255,255,0.15)' }}>
            index: 0
          </span>
          <span style={{ fontFamily: 'monospace', fontSize: 10, color: 'rgba(255,255,255,0.15)' }}>
            length: --
          </span>
        </div>
      </div>
    )
  },

  renderWord: ({ word, color, enterProgress, holdProgress, exitProgress, phase, index, frame }: WordRenderProps) => {
    const f = frame ?? 0
    const patternIdx = index % REGEX_PATTERNS.length
    const pattern = REGEX_PATTERNS[patternIdx]

    if (phase === 'enter') {
      // The regex pattern appears first, then a yellow highlight sweeps left to right across the word
      const patternOpacity = Math.min(1, enterProgress * 3)
      const sweepProgress = Math.max(0, (enterProgress - 0.3) / 0.7)
      const highlightWidth = sweepProgress * 100

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
            gap: 12,
            fontFamily: "'Fira Code', 'Courier New', monospace",
            whiteSpace: 'nowrap',
          }}
        >
          {/* Regex pattern above */}
          <div
            style={{
              opacity: patternOpacity,
              fontSize: 'clamp(12px, 3vw, 34px)',
              color: 'rgba(255,204,0,0.7)',
              letterSpacing: 1,
            }}
          >
            {pattern}
          </div>

          {/* Word with sweeping highlight */}
          <div style={{ position: 'relative', display: 'inline-block' }}>
            {/* Yellow highlight sweeping left to right */}
            <div
              style={{
                position: 'absolute',
                inset: 0,
                background: 'rgba(255,204,0,0.25)',
                clipPath: `inset(0 ${100 - highlightWidth}% 0 0)`,
                borderRadius: 2,
              }}
            />
            <span
              style={{
                position: 'relative',
                fontSize: 'clamp(28px, 8vw, 110px)',
                fontWeight: 700,
                color: sweepProgress > 0.5 ? color : 'rgba(255,255,255,0.5)',
                letterSpacing: 3,
                padding: '0 8px',
              }}
            >
              {word}
            </span>
          </div>
        </div>
      )
    } else if (phase === 'hold') {
      // Highlighted match — word glows yellow, pattern shown above
      const pulse = 0.85 + Math.sin(f * 0.12) * 0.15

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
            gap: 10,
            fontFamily: "'Fira Code', 'Courier New', monospace",
            whiteSpace: 'nowrap',
          }}
        >
          {/* Pattern */}
          <div style={{ fontSize: 'clamp(12px, 3vw, 34px)', color: 'rgba(255,204,0,0.6)', letterSpacing: 1 }}>
            {pattern}
          </div>

          {/* Matched word with highlight box */}
          <div
            style={{
              position: 'relative',
              background: 'rgba(255,204,0,0.2)',
              border: `1px solid rgba(255,204,0,${0.4 * pulse})`,
              borderRadius: 3,
              padding: '2px 12px',
              boxShadow: `0 0 ${12 * pulse}px rgba(255,204,0,0.3)`,
            }}
          >
            <span
              style={{
                fontSize: 'clamp(28px, 8vw, 110px)',
                fontWeight: 700,
                color,
                textShadow: `0 0 12px ${color}60`,
                letterSpacing: 3,
              }}
            >
              {word}
            </span>
            {/* Match count badge */}
            <span
              style={{
                position: 'absolute',
                top: -8,
                right: -8,
                background: '#ffcc00',
                color: '#000',
                fontSize: 'clamp(8px, 1.5vw, 14px)',
                fontWeight: 700,
                borderRadius: '50%',
                width: 'clamp(16px, 3vw, 24px)',
                height: 'clamp(16px, 3vw, 24px)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              1
            </span>
          </div>
        </div>
      )
    } else {
      // Exit: highlight de-selects, fades
      const opacity = 1 - exitProgress
      const highlightOpacity = Math.max(0, 1 - exitProgress * 3)

      return (
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            opacity,
            fontFamily: "'Fira Code', 'Courier New', monospace",
            whiteSpace: 'nowrap',
          }}
        >
          <div
            style={{
              position: 'relative',
              background: `rgba(255,204,0,${0.2 * highlightOpacity})`,
              borderRadius: 3,
              padding: '2px 12px',
              display: 'inline-block',
            }}
          >
            <span style={{ fontSize: 'clamp(28px, 8vw, 110px)', fontWeight: 700, color, letterSpacing: 3 }}>
              {word}
            </span>
          </div>
        </div>
      )
    }
  },
}

function RegexMatchComponent(props: MotionGraphicProps<RegexMatchConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-regex-match',
  title: 'Kinetic Regex Match',
  description:
    'Regex101 aesthetic: pattern appears above, yellow highlight sweeps across the word as a regex match, with match badge and glow',
  tags: ['kinetic', 'typography', 'regex', 'code', 'developer', 'match', 'highlight', 'tech'],
  category: 'captions',
  component: RegexMatchComponent as any,
  defaultConfig: {
    words: ['MATCH', 'FOUND', 'VALID', 'PASSED'],
    colors: ['#ffcc00', '#79c0ff', '#56d364', '#f0883e'],
    bgColor: '#1e1f22',
    cycleDuration: 2.2,
  },
  configSchema: [
    { key: 'words', label: 'Words', type: 'text-array', defaultValue: ['MATCH', 'FOUND', 'VALID', 'PASSED'], group: 'Content' },
    { key: 'colors', label: 'Colors', type: 'text-array', defaultValue: ['#ffcc00', '#79c0ff', '#56d364', '#f0883e'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#1e1f22', group: 'Style' },
    { key: 'cycleDuration', label: 'Cycle Duration (s)', type: 'number', defaultValue: 2.2, min: 0.8, max: 6, group: 'Timing' },
  ],
})
