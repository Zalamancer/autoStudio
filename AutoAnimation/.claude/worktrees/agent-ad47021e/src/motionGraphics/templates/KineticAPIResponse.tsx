import { registerMotionGraphic } from '../registry'
import { KineticBase, type KineticBaseConfig, type KineticAnimation, type WordRenderProps, type BackgroundRenderProps } from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface APIResponseConfig extends KineticBaseConfig {}

// Simulated HTTP response headers
const RESPONSE_HEADERS = [
  'HTTP/1.1 200 OK',
  'Content-Type: application/json; charset=utf-8',
  'X-RateLimit-Remaining: 4999',
  'Cache-Control: no-cache',
  'X-Request-Id: a3f8c2d1',
]

function seeded(n: number) {
  const x = Math.sin(n * 11317 + 3301) * 17393
  return x - Math.floor(x)
}

const animation: KineticAnimation = {
  renderBackground: ({ bgColor, frame, fps }: BackgroundRenderProps) => {
    const time = frame / fps

    return (
      <div style={{ position: 'absolute', inset: 0, background: bgColor }}>
        {/* Postman / Insomnia style response panel header */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: 30,
            background: 'rgba(255,255,255,0.03)',
            borderBottom: '1px solid rgba(255,255,255,0.07)',
            display: 'flex',
            alignItems: 'center',
            paddingLeft: 12,
            gap: 12,
          }}
        >
          <span style={{ fontFamily: "'Fira Code', monospace", fontSize: 10, color: 'rgba(80,200,120,0.5)', fontWeight: 700 }}>
            200
          </span>
          <span style={{ fontFamily: "'Fira Code', monospace", fontSize: 10, color: 'rgba(255,255,255,0.2)' }}>
            OK · {Math.floor(42 + seeded(frame) * 20)}ms · {Math.floor(128 + seeded(frame + 1) * 64)} B
          </span>
          <span style={{ marginLeft: 'auto', paddingRight: 12, fontFamily: "'Fira Code', monospace", fontSize: 10, color: 'rgba(255,255,255,0.1)' }}>
            Body · Headers · Preview
          </span>
        </div>

        {/* Response header lines */}
        {RESPONSE_HEADERS.map((header, i) => (
          <div
            key={i}
            style={{
              position: 'absolute',
              top: 38 + i * 15,
              left: 12,
              fontFamily: "'Fira Code', monospace",
              fontSize: 9,
              whiteSpace: 'nowrap',
            }}
          >
            <span style={{ color: 'rgba(121,192,255,0.1)' }}>
              {header.split(':')[0]}
            </span>
            {header.includes(':') && (
              <>
                <span style={{ color: 'rgba(255,255,255,0.06)' }}>: </span>
                <span style={{ color: 'rgba(206,145,120,0.1)' }}>
                  {header.split(':').slice(1).join(':')}
                </span>
              </>
            )}
          </div>
        ))}
      </div>
    )
  },

  renderWord: ({ word, color, enterProgress, holdProgress, exitProgress, phase, index, frame }: WordRenderProps) => {
    const f = frame ?? 0

    if (phase === 'enter') {
      // JSON response object types in: { "status": 200, "message": word }
      // First the wrapper, then the word value
      const structureProgress = Math.min(1, enterProgress * 2.5)
      const valueProgress = Math.max(0, (enterProgress - 0.6) / 0.4)
      const valueChars = Math.floor(valueProgress * (word.length + 1))
      const displayValue = word.substring(0, valueChars)
      const showCursor = Math.floor(f * 0.15) % 2 === 0 && valueChars < word.length

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
          <div style={{ fontSize: 'clamp(12px, 2.8vw, 34px)', color: 'rgba(255,255,255,0.3)' }}>{'{'}</div>
          <div style={{ paddingLeft: 20 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 'clamp(10px, 2.3vw, 28px)' }}>
              <span style={{ color: '#9cdcfe' }}>&quot;status&quot;</span>
              <span style={{ color: 'rgba(255,255,255,0.35)' }}>:</span>
              <span style={{ color: '#b5cea8' }}>200</span>
              <span style={{ color: 'rgba(255,255,255,0.35)' }}>,</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 2 }}>
              <span style={{ color: '#9cdcfe', fontSize: 'clamp(10px, 2.3vw, 28px)' }}>&quot;data&quot;</span>
              <span style={{ color: 'rgba(255,255,255,0.35)', fontSize: 'clamp(10px, 2.3vw, 28px)' }}>:</span>
              <span style={{ color: '#ce9178', fontSize: 'clamp(10px, 2.3vw, 28px)' }}>&quot;</span>
              <span
                style={{
                  color,
                  fontSize: 'clamp(20px, 6vw, 80px)',
                  fontWeight: 700,
                  textShadow: `0 0 10px ${color}40`,
                }}
              >
                {displayValue}
                {showCursor && <span style={{ opacity: 0.9 }}>|</span>}
              </span>
              {valueChars >= word.length && (
                <span style={{ color: '#ce9178', fontSize: 'clamp(10px, 2.3vw, 28px)' }}>&quot;</span>
              )}
            </div>
          </div>
          <div style={{ fontSize: 'clamp(12px, 2.8vw, 34px)', color: 'rgba(255,255,255,0.3)', marginTop: 2 }}>{'}'}</div>
        </div>
      )
    } else if (phase === 'hold') {
      // Data value zooms forward, JSON frame stays as context
      const zoomProgress = Math.min(1, holdProgress * 2)
      const jsonScale = 1 - zoomProgress * 0.15
      const valueScale = 1 + zoomProgress * 0.25

      return (
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: `translate(-50%, -50%) scale(${jsonScale})`,
            fontFamily: "'Fira Code', 'Courier New', monospace",
            whiteSpace: 'nowrap',
            textAlign: 'center',
          }}
        >
          <div style={{ fontSize: 'clamp(12px, 2.8vw, 34px)', color: 'rgba(255,255,255,0.2)', opacity: 1 - zoomProgress * 0.7 }}>{'{'}</div>
          <div style={{ paddingLeft: 20, opacity: 1 - zoomProgress * 0.7 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 'clamp(10px, 2.3vw, 28px)' }}>
              <span style={{ color: 'rgba(156,220,254,0.5)' }}>&quot;status&quot;</span>
              <span style={{ color: 'rgba(255,255,255,0.25)' }}>: </span>
              <span style={{ color: 'rgba(181,206,168,0.6)' }}>200</span>
              <span style={{ color: 'rgba(255,255,255,0.25)' }}>,</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}>
              <span style={{ color: 'rgba(156,220,254,0.5)', fontSize: 'clamp(10px, 2.3vw, 28px)' }}>&quot;data&quot;</span>
              <span style={{ color: 'rgba(255,255,255,0.25)', fontSize: 'clamp(10px, 2.3vw, 28px)' }}>: &quot;</span>
              <span
                style={{
                  color,
                  fontSize: `clamp(${20 + zoomProgress * 16}px, ${6 + zoomProgress * 3}vw, ${80 + zoomProgress * 30}px)`,
                  fontWeight: 700,
                  textShadow: `0 0 ${14 + zoomProgress * 10}px ${color}60`,
                  transform: `scale(${valueScale})`,
                  display: 'inline-block',
                }}
              >
                {word}
              </span>
              <span style={{ color: 'rgba(255,255,255,0.25)', fontSize: 'clamp(10px, 2.3vw, 28px)' }}>&quot;</span>
            </div>
          </div>
          <div style={{ fontSize: 'clamp(12px, 2.8vw, 34px)', color: 'rgba(255,255,255,0.2)', opacity: 1 - zoomProgress * 0.7 }}>{'}'}</div>
        </div>
      )
    } else {
      const opacity = 1 - exitProgress

      return (
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            opacity,
            fontFamily: "'Fira Code', 'Courier New', monospace",
            fontSize: 'clamp(24px, 7vw, 90px)',
            fontWeight: 700,
            color,
            whiteSpace: 'nowrap',
          }}
        >
          {word}
        </div>
      )
    }
  },
}

function APIResponseComponent(props: MotionGraphicProps<APIResponseConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-api-response',
  title: 'Kinetic API Response',
  description:
    'Postman/Insomnia REST API response: { "status": 200, "data": "word" } types in as JSON, data value zooms forward out of the JSON object',
  tags: ['kinetic', 'typography', 'api', 'json', 'rest', 'postman', 'developer', 'http', 'tech'],
  category: 'captions',
  component: APIResponseComponent as any,
  defaultConfig: {
    words: ['SUCCESS', 'CREATED', 'UPDATED', 'FETCHED'],
    colors: ['#56d364', '#79c0ff', '#f0883e', '#bc8cff'],
    bgColor: '#1c2128',
    cycleDuration: 2.4,
  },
  configSchema: [
    { key: 'words', label: 'Words', type: 'text-array', defaultValue: ['SUCCESS', 'CREATED', 'UPDATED', 'FETCHED'], group: 'Content' },
    { key: 'colors', label: 'Colors', type: 'text-array', defaultValue: ['#56d364', '#79c0ff', '#f0883e', '#bc8cff'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#1c2128', group: 'Style' },
    { key: 'cycleDuration', label: 'Cycle Duration (s)', type: 'number', defaultValue: 2.4, min: 0.8, max: 6, group: 'Timing' },
  ],
})
