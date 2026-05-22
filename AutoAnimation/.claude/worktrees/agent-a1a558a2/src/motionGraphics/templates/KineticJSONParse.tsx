import { registerMotionGraphic } from '../registry'
import { KineticBase, type KineticBaseConfig, type KineticAnimation, type WordRenderProps, type BackgroundRenderProps } from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface JSONParseConfig extends KineticBaseConfig {}

// Background: faint JSON object lines
const BG_LINES = [
  '  "id": 42,',
  '  "status": "active",',
  '  "createdAt": "2024-01-15",',
  '  "tags": ["dev", "prod"],',
  '  "meta": {',
  '    "version": "2.1.0",',
  '    "env": "production"',
  '  },',
]

const animation: KineticAnimation = {
  renderBackground: ({ bgColor }: BackgroundRenderProps) => {
    return (
      <div style={{ position: 'absolute', inset: 0, background: bgColor }}>
        {/* VS Code-style editor chrome */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: 28,
            background: 'rgba(255,255,255,0.03)',
            borderBottom: '1px solid rgba(255,255,255,0.06)',
            display: 'flex',
            alignItems: 'center',
            paddingLeft: 12,
            gap: 6,
          }}
        >
          <span style={{ fontFamily: "'Fira Code', 'Courier New', monospace", fontSize: 10, color: 'rgba(255,255,255,0.2)' }}>
            response.json
          </span>
          <span style={{ color: 'rgba(255,204,0,0.25)', fontSize: 10, fontFamily: 'monospace' }}>●</span>
        </div>

        {/* Line numbers + code */}
        {BG_LINES.map((line, i) => (
          <div
            key={i}
            style={{
              position: 'absolute',
              top: 36 + i * 16,
              left: 0,
              right: 0,
              display: 'flex',
              fontFamily: "'Fira Code', 'Courier New', monospace",
              fontSize: 10,
            }}
          >
            <span style={{ width: 30, textAlign: 'right', color: 'rgba(255,255,255,0.08)', paddingRight: 8, flexShrink: 0 }}>
              {i + 1}
            </span>
            <span style={{ color: 'rgba(255,255,255,0.06)', whiteSpace: 'pre' }}>{line}</span>
          </div>
        ))}
      </div>
    )
  },

  renderWord: ({ word, color, enterProgress, holdProgress, exitProgress, phase, frame }: WordRenderProps) => {
    const f = frame ?? 0

    if (phase === 'enter') {
      // JSON structure wraps around the word, then collapses to show just the value
      // First: show full JSON object with word as a value
      // Brackets animate in, then the word types in as the value
      const structureProgress = Math.min(1, enterProgress * 2)
      const wordProgress = Math.max(0, (enterProgress - 0.5) * 2)
      const wordChars = Math.floor(wordProgress * (word.length + 1))
      const displayWord = word.substring(0, wordChars)
      const showCursor = Math.floor(f * 0.15) % 2 === 0 && wordChars < word.length

      return (
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            fontFamily: "'Fira Code', 'Courier New', monospace",
            whiteSpace: 'nowrap',
            opacity: structureProgress,
          }}
        >
          {/* JSON structure */}
          <div style={{ fontSize: 'clamp(12px, 3vw, 36px)', color: 'rgba(255,255,255,0.3)', marginBottom: 4 }}>
            {'{'}
          </div>
          <div style={{ paddingLeft: 20, display: 'flex', alignItems: 'center', gap: 0 }}>
            <span style={{ fontSize: 'clamp(12px, 3vw, 36px)', color: '#9cdcfe' }}>&quot;text&quot;</span>
            <span style={{ fontSize: 'clamp(12px, 3vw, 36px)', color: 'rgba(255,255,255,0.4)' }}>: </span>
            <span style={{ fontSize: 'clamp(12px, 3vw, 36px)', color: '#ce9178' }}>&quot;</span>
            <span
              style={{
                fontSize: 'clamp(18px, 5vw, 64px)',
                fontWeight: 700,
                color,
                textShadow: `0 0 10px ${color}40`,
              }}
            >
              {displayWord}
              {showCursor && <span style={{ opacity: 0.9 }}>|</span>}
            </span>
            {wordChars >= word.length && (
              <span style={{ fontSize: 'clamp(12px, 3vw, 36px)', color: '#ce9178' }}>&quot;</span>
            )}
          </div>
          <div style={{ fontSize: 'clamp(12px, 3vw, 36px)', color: 'rgba(255,255,255,0.3)', marginTop: 4 }}>
            {'}'}
          </div>
        </div>
      )
    } else if (phase === 'hold') {
      // The JSON "unwraps": brackets fade, only the value glows
      const unwrapProgress = Math.min(1, holdProgress * 2)
      const jsonOpacity = 1 - unwrapProgress * 0.85
      const wordScale = 1 + unwrapProgress * 0.3

      return (
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            fontFamily: "'Fira Code', 'Courier New', monospace",
            whiteSpace: 'nowrap',
            textAlign: 'center',
          }}
        >
          {/* Fading JSON chrome */}
          <div style={{ opacity: jsonOpacity, fontSize: 'clamp(12px, 3vw, 36px)', color: 'rgba(255,255,255,0.3)' }}>
            {'{'}
          </div>
          <div
            style={{
              paddingLeft: jsonOpacity > 0.1 ? 20 : 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 0,
              transition: 'padding 0.2s',
            }}
          >
            <span style={{ opacity: jsonOpacity, fontSize: 'clamp(12px, 3vw, 36px)', color: '#9cdcfe' }}>&quot;text&quot;</span>
            <span style={{ opacity: jsonOpacity, fontSize: 'clamp(12px, 3vw, 36px)', color: 'rgba(255,255,255,0.4)' }}>: </span>
            <span style={{ opacity: jsonOpacity, fontSize: 'clamp(12px, 3vw, 36px)', color: '#ce9178' }}>&quot;</span>
            <span
              style={{
                fontSize: `clamp(${18 + unwrapProgress * 10}px, ${5 + unwrapProgress * 3}vw, ${64 + unwrapProgress * 30}px)`,
                fontWeight: 700,
                color,
                textShadow: `0 0 ${14 + unwrapProgress * 10}px ${color}60`,
                transform: `scale(${wordScale})`,
                display: 'inline-block',
              }}
            >
              {word}
            </span>
            <span style={{ opacity: jsonOpacity, fontSize: 'clamp(12px, 3vw, 36px)', color: '#ce9178' }}>&quot;</span>
          </div>
          <div style={{ opacity: jsonOpacity, fontSize: 'clamp(12px, 3vw, 36px)', color: 'rgba(255,255,255,0.3)' }}>
            {'}'}
          </div>
        </div>
      )
    } else {
      // Exit: whole thing fades with a JSON stringify effect (brackets re-appear briefly)
      const opacity = 1 - exitProgress
      const jsonRewrap = exitProgress > 0.6 ? (exitProgress - 0.6) / 0.4 : 0

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
            textAlign: 'center',
          }}
        >
          <span style={{ opacity: jsonRewrap, color: 'rgba(255,255,255,0.4)', fontSize: 'clamp(14px, 3.5vw, 44px)' }}>
            {'{' + ' "text": "'}
          </span>
          <span style={{ fontSize: 'clamp(24px, 6vw, 80px)', fontWeight: 700, color }}>
            {word}
          </span>
          <span style={{ opacity: jsonRewrap, color: 'rgba(255,255,255,0.4)', fontSize: 'clamp(14px, 3.5vw, 44px)' }}>
            {'" }'}
          </span>
        </div>
      )
    }
  },
}

function JSONParseComponent(props: MotionGraphicProps<JSONParseConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-json-parse',
  title: 'Kinetic JSON Parse',
  description:
    'Text wrapped in JSON syntax { "text": "..." } that types in as a value then unwraps/parses to reveal the word in full, VS Code editor aesthetic',
  tags: ['kinetic', 'typography', 'json', 'api', 'code', 'developer', 'parse', 'tech'],
  category: 'captions',
  component: JSONParseComponent as any,
  defaultConfig: {
    words: ['AWESOME', 'VALID', 'PARSED', 'SUCCESS'],
    colors: ['#79c0ff', '#56d364', '#f0883e', '#bc8cff'],
    bgColor: '#1e1e1e',
    cycleDuration: 2.4,
  },
  configSchema: [
    { key: 'words', label: 'Words', type: 'text-array', defaultValue: ['AWESOME', 'VALID', 'PARSED', 'SUCCESS'], group: 'Content' },
    { key: 'colors', label: 'Colors', type: 'text-array', defaultValue: ['#79c0ff', '#56d364', '#f0883e', '#bc8cff'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#1e1e1e', group: 'Style' },
    { key: 'cycleDuration', label: 'Cycle Duration (s)', type: 'number', defaultValue: 2.4, min: 0.8, max: 6, group: 'Timing' },
  ],
})
