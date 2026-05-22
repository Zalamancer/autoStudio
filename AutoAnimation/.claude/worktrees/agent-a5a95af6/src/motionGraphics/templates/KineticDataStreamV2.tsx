import { registerMotionGraphic } from '../registry'
import { KineticBase, type KineticBaseConfig, type KineticAnimation, type WordRenderProps, type BackgroundRenderProps } from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

// KineticDataStreamV2 — data flow lines converge from edges to form words
// (distinct from KineticDataStream which has horizontal scrolling bars)

interface DataStreamV2Config extends KineticBaseConfig {}

function seededRand(seed: number): number {
  const x = Math.sin(seed * 9301 + 49297) * 49297
  return x - Math.floor(x)
}

// Binary / hex stream characters
const STREAM_CHARS = '01001101010011001010111110100110011101'

const animation: KineticAnimation = {
  renderBackground: ({ bgColor, width, height, frame }: BackgroundRenderProps) => {
    // Vertical data streams: columns of cascading hex/binary digits
    const colCount = Math.floor(width / 18)

    const cols = Array.from({ length: colCount }, (_, i) => {
      const seed = i * 53 + 7
      const speed = 0.6 + seededRand(seed) * 1.4
      const offset = seededRand(seed + 1) * height
      const length = 5 + Math.floor(seededRand(seed + 2) * 10) // number of chars in this stream
      const x = i * 18 + 4
      const opacity = 0.04 + seededRand(seed + 3) * 0.06

      const chars = Array.from({ length }, (_, j) => {
        const charSeed = seed + j * 7 + Math.floor(frame * speed * 0.08)
        const ch = STREAM_CHARS[Math.floor(seededRand(charSeed) * STREAM_CHARS.length)]
        const yPos = ((frame * speed * 0.6 + offset + j * 16) % (height + length * 16)) - length * 16
        const isHead = j === length - 1
        const charOpacity = isHead ? opacity * 4 : opacity * (1 - j / length)

        return (
          <div
            key={j}
            style={{
              position: 'absolute',
              left: x,
              top: yPos,
              fontFamily: "'Courier New', monospace",
              fontSize: 11,
              color: isHead ? `rgba(0,255,255,${Math.min(1, charOpacity * 2)})` : `rgba(0,200,255,${charOpacity})`,
              lineHeight: '16px',
              pointerEvents: 'none',
            }}
          >
            {ch}
          </div>
        )
      })

      return chars
    })

    return (
      <div style={{ position: 'absolute', inset: 0, background: bgColor }}>
        {cols}

        {/* Subtle center radial to darken behind text */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: 'radial-gradient(ellipse 60% 40% at 50% 50%, rgba(10,10,18,0.75) 0%, transparent 100%)',
            pointerEvents: 'none',
          }}
        />

        {/* Top status */}
        <div
          style={{
            position: 'absolute',
            top: 14,
            right: 18,
            fontFamily: "'Courier New', monospace",
            fontSize: 8,
            color: 'rgba(0,255,255,0.2)',
            letterSpacing: 2,
          }}
        >
          STREAM: {String(frame * 137 % 65536).padStart(5, '0')}
        </div>
      </div>
    )
  },

  renderWord: ({ word, color, enterProgress, holdProgress, exitProgress, phase, width, height }: WordRenderProps) => {
    if (phase === 'enter') {
      // Data streams converge from all four edges toward the center forming the word
      // Represented by: shrinking "stream" lines racing inward + text fading in at center
      const convergeFrac = enterProgress  // 0..1
      const opacity = Math.min(1, enterProgress * 2.5)

      // 4 convergence lines from N/S/E/W edges
      const lineLength = (1 - convergeFrac) * 0.45  // fraction of screen they occupy

      return (
        <div style={{ position: 'absolute', inset: 0 }}>
          {/* North stream converging down */}
          <div
            style={{
              position: 'absolute',
              left: '50%',
              top: 0,
              transform: 'translateX(-50%)',
              width: 2,
              height: `${lineLength * 100}%`,
              background: `linear-gradient(180deg, transparent, ${color}80)`,
              boxShadow: `0 0 8px ${color}40`,
            }}
          />
          {/* South stream converging up */}
          <div
            style={{
              position: 'absolute',
              left: '50%',
              bottom: 0,
              transform: 'translateX(-50%)',
              width: 2,
              height: `${lineLength * 100}%`,
              background: `linear-gradient(0deg, transparent, ${color}80)`,
              boxShadow: `0 0 8px ${color}40`,
            }}
          />
          {/* West stream converging right */}
          <div
            style={{
              position: 'absolute',
              top: '50%',
              left: 0,
              transform: 'translateY(-50%)',
              width: `${lineLength * 100}%`,
              height: 2,
              background: `linear-gradient(90deg, transparent, ${color}80)`,
              boxShadow: `0 0 8px ${color}40`,
            }}
          />
          {/* East stream converging left */}
          <div
            style={{
              position: 'absolute',
              top: '50%',
              right: 0,
              transform: 'translateY(-50%)',
              width: `${lineLength * 100}%`,
              height: 2,
              background: `linear-gradient(270deg, transparent, ${color}80)`,
              boxShadow: `0 0 8px ${color}40`,
            }}
          />

          {/* Convergence flash at center when lines arrive */}
          {convergeFrac > 0.8 && (
            <div
              style={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                width: `${(convergeFrac - 0.8) * 5 * 80}px`,
                height: `${(convergeFrac - 0.8) * 5 * 80}px`,
                borderRadius: '50%',
                background: `radial-gradient(circle, ${color}30 0%, transparent 70%)`,
                filter: 'blur(8px)',
              }}
            />
          )}

          {/* Text assembles */}
          <div
            style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              opacity,
            }}
          >
            <span
              style={{
                fontFamily: "'Courier New', monospace",
                fontSize: 'clamp(40px, 10vw, 150px)',
                fontWeight: 700,
                color,
                textShadow: `0 0 10px ${color}, 0 0 25px ${color}50`,
                whiteSpace: 'nowrap',
                letterSpacing: 6,
                textTransform: 'uppercase',
              }}
            >
              {word}
            </span>
          </div>
        </div>
      )
    } else if (phase === 'hold') {
      // Continuous data streams pass through the text — stream lines cross behind
      const pulse = 0.8 + Math.sin(holdProgress * Math.PI * 4) * 0.2

      // Horizontal stream line sweeping across
      const streamX = (holdProgress * 1.4 - 0.2) * 100  // -20% to 120%

      return (
        <div style={{ position: 'absolute', inset: 0 }}>
          {/* Horizontal data pulse crossing the word */}
          <div
            style={{
              position: 'absolute',
              top: '50%',
              left: `${streamX}%`,
              transform: 'translate(-50%, -50%)',
              width: '25%',
              height: 1,
              background: `linear-gradient(90deg, transparent, ${color}50, transparent)`,
              boxShadow: `0 0 12px ${color}30`,
              opacity: Math.min(1, Math.min(streamX / 10, (100 - streamX) / 10) * 0.4 + 0.4),
            }}
          />

          {/* Main text */}
          <div
            style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
            }}
          >
            <span
              style={{
                fontFamily: "'Courier New', monospace",
                fontSize: 'clamp(40px, 10vw, 150px)',
                fontWeight: 700,
                color,
                textShadow: `0 0 ${10 * pulse}px ${color}, 0 0 ${30 * pulse}px ${color}50`,
                whiteSpace: 'nowrap',
                letterSpacing: 6,
                textTransform: 'uppercase',
              }}
            >
              {word}
            </span>
          </div>
        </div>
      )
    } else {
      // Exit: word explodes back out into streams diverging to edges
      const divergeFrac = exitProgress
      const opacity = 1 - exitProgress

      return (
        <div style={{ position: 'absolute', inset: 0 }}>
          {/* Diverging lines */}
          {[0, 1, 2, 3].map(dir => {
            const len = divergeFrac * 0.45
            const style: React.CSSProperties = {
              position: 'absolute',
              background: `${color}60`,
              boxShadow: `0 0 6px ${color}30`,
            }
            if (dir === 0) Object.assign(style, { top: 0, left: '50%', transform: 'translateX(-50%)', width: 2, height: `${len * 100}%` })
            if (dir === 1) Object.assign(style, { bottom: 0, left: '50%', transform: 'translateX(-50%)', width: 2, height: `${len * 100}%` })
            if (dir === 2) Object.assign(style, { left: 0, top: '50%', transform: 'translateY(-50%)', height: 2, width: `${len * 100}%` })
            if (dir === 3) Object.assign(style, { right: 0, top: '50%', transform: 'translateY(-50%)', height: 2, width: `${len * 100}%` })
            return <div key={dir} style={style} />
          })}

          {/* Fading text */}
          <div
            style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              opacity,
            }}
          >
            <span
              style={{
                fontFamily: "'Courier New', monospace",
                fontSize: 'clamp(40px, 10vw, 150px)',
                fontWeight: 700,
                color,
                textShadow: `0 0 8px ${color}`,
                whiteSpace: 'nowrap',
                letterSpacing: 6,
                textTransform: 'uppercase',
              }}
            >
              {word}
            </span>
          </div>
        </div>
      )
    }
  },
}

function DataStreamV2Component(props: MotionGraphicProps<DataStreamV2Config>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-data-stream-v2',
  title: 'Kinetic Data Stream V2',
  description: 'Data flow lines converge from all four screen edges to form words at center, with cascading binary/hex column background and pulse stream during hold',
  tags: ['kinetic', 'typography', 'data', 'stream', 'converge', 'matrix', 'binary', 'futuristic', 'sci-fi', 'cyberpunk'],
  category: 'captions',
  component: DataStreamV2Component as any,
  defaultConfig: {
    words: ['RECEIVE', 'PROCESS', 'OUTPUT', 'TRANSMIT'],
    colors: ['#00FFFF', '#0066FF', '#FF00FF', '#00FFFF'],
    bgColor: '#0a0a12',
    cycleDuration: 1.6,
  },
  configSchema: [
    { key: 'words', label: 'Words', type: 'text-array', defaultValue: ['RECEIVE', 'PROCESS', 'OUTPUT', 'TRANSMIT'], group: 'Content' },
    { key: 'colors', label: 'Colors', type: 'text-array', defaultValue: ['#00FFFF', '#0066FF', '#FF00FF', '#00FFFF'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#0a0a12', group: 'Style' },
    { key: 'cycleDuration', label: 'Cycle Duration (s)', type: 'number', defaultValue: 1.6, min: 0.3, max: 5, group: 'Timing' },
  ],
})
