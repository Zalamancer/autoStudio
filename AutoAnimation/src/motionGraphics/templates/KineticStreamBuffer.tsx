import { registerMotionGraphic } from '../registry'
import { KineticBase, type KineticBaseConfig, type KineticAnimation, type WordRenderProps, type BackgroundRenderProps } from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface StreamBufferConfig extends KineticBaseConfig {}

/** Deterministic pseudo-random 0..1 */
function rand(s: number): number {
  const x = Math.sin(s * 127.1 + 311.7) * 43758.5453
  return x - Math.floor(x)
}

// Spinner frames — deterministic rotation via frame count
const SPINNER_FRAMES = ['◐', '◓', '◑', '◒']

const animation: KineticAnimation = {
  renderBackground: ({ bgColor, frame, fps }: BackgroundRenderProps) => {
    const time = frame / fps
    // Buffer fill level oscillates — simulating network stall and resume
    const bufferFill = Math.max(0, Math.min(1,
      (Math.sin(time * 0.5) * 0.3 + 0.5) + Math.sin(time * 2.1) * 0.1
    ))
    const isStalling = bufferFill < 0.25

    // Network quality dots
    const qualityDots = Math.min(4, Math.max(0, Math.floor(bufferFill * 5)))

    return (
      <div style={{ position: 'absolute', inset: 0, background: bgColor }}>
        {/* Buffer bar at bottom */}
        <div style={{
          position: 'absolute', bottom: 16, left: '8%', right: '8%',
        }}>
          <div style={{
            display: 'flex', justifyContent: 'space-between',
            marginBottom: 4,
          }}>
            <div style={{
              fontFamily: "'Courier New', monospace",
              fontSize: 8, color: 'rgba(255,255,255,0.15)',
              letterSpacing: 1,
            }}>
              BUFFERING
            </div>
            <div style={{
              fontFamily: "'Courier New', monospace",
              fontSize: 8,
              color: isStalling ? 'rgba(255,80,80,0.4)' : 'rgba(100,200,100,0.3)',
            }}>
              {Math.round(bufferFill * 100)}%
            </div>
          </div>
          {/* Buffer track */}
          <div style={{
            height: 3,
            background: 'rgba(255,255,255,0.06)',
            borderRadius: 2,
            overflow: 'hidden',
          }}>
            <div style={{
              height: '100%',
              width: `${bufferFill * 100}%`,
              background: isStalling
                ? 'rgba(255,80,80,0.5)'
                : 'rgba(100,200,100,0.4)',
              borderRadius: 2,
            }} />
          </div>
        </div>
        {/* Network quality dots */}
        <div style={{
          position: 'absolute', top: 10, right: 12,
          display: 'flex', gap: 3, alignItems: 'center',
        }}>
          {Array.from({ length: 4 }, (_, i) => (
            <div key={i} style={{
              width: 5, height: 5, borderRadius: '50%',
              background: i < qualityDots
                ? 'rgba(100,200,100,0.4)'
                : 'rgba(255,255,255,0.06)',
            }} />
          ))}
        </div>
        {/* Stall indicator */}
        {isStalling && (
          <div style={{
            position: 'absolute', top: 8, left: 12,
            fontFamily: "'Courier New', monospace",
            fontSize: 9,
            color: 'rgba(255,80,80,0.35)',
            letterSpacing: 1,
            opacity: Math.sin(time * 4) > 0 ? 1 : 0.3,
          }}>
            NETWORK STALL
          </div>
        )}
      </div>
    )
  },

  renderWord: ({ word, color, enterProgress, holdProgress, exitProgress, phase, index, frame }: WordRenderProps) => {
    const f = frame ?? 0
    const seed = index * 103 + 71

    if (phase === 'enter') {
      // Text loads in chunks — left to right reveal with brief stalls
      // Divide word into 3 chunks that load sequentially with pauses between them
      const chunks = 3
      const charsPerChunk = Math.ceil(word.length / chunks)
      const totalLoadTime = 0.85

      // Chunk timing with stalls: each chunk takes a portion but has a gap
      const chunkTimings = [
        { start: 0.0, end: 0.28 },   // chunk 0 loads
        { start: 0.35, end: 0.60 },  // stall, then chunk 1 loads
        { start: 0.68, end: 0.95 },  // stall, then chunk 2 loads
      ]

      const spinnerChar = SPINNER_FRAMES[Math.floor(f / 4) % SPINNER_FRAMES.length]

      // Which chunks are loaded?
      const chunkStates = chunkTimings.map(({ start, end }) => {
        if (enterProgress < start) return 'waiting'
        if (enterProgress >= end) return 'loaded'
        return 'loading'
      })

      const chars = word.split('').map((ch, ci) => {
        const chunkIdx = Math.min(chunks - 1, Math.floor(ci / charsPerChunk))
        const state = chunkStates[chunkIdx]

        if (state === 'waiting') {
          return (
            <span key={ci} style={{
              display: 'inline-block',
              color: 'rgba(255,255,255,0.08)',
            }}>
              _
            </span>
          )
        } else if (state === 'loading') {
          const { start, end } = chunkTimings[chunkIdx]
          const chunkP = (enterProgress - start) / (end - start)
          // Characters within chunk load left to right
          const charInChunk = ci - chunkIdx * charsPerChunk
          const charCount = Math.min(charsPerChunk, word.length - chunkIdx * charsPerChunk)
          const charLoadedAt = charInChunk / charCount
          const charLoaded = chunkP > charLoadedAt

          return (
            <span key={ci} style={{
              display: 'inline-block',
              color: charLoaded ? color : 'rgba(255,255,255,0.15)',
              opacity: charLoaded ? 1 : 0.5,
            }}>
              {charLoaded ? ch : '_'}
            </span>
          )
        } else {
          return (
            <span key={ci} style={{ display: 'inline-block', color }}>{ch}</span>
          )
        }
      })

      // Is there a chunk currently loading (show spinner)?
      const isLoading = chunkStates.includes('loading')
      const isStalled = chunkStates.some((s, i) =>
        s === 'waiting' && i > 0 && chunkStates[i - 1] === 'loaded'
      )

      return (
        <>
          <div style={{
            position: 'absolute', top: '50%', left: '50%',
            transform: 'translate(-50%, -50%)',
            fontFamily: "'Courier New', monospace",
            fontSize: 'clamp(44px, 11vw, 150px)',
            fontWeight: 700,
            whiteSpace: 'nowrap',
            letterSpacing: 4,
            textTransform: 'uppercase',
          }}>
            {chars}
          </div>
          {(isLoading || isStalled) && (
            <div style={{
              position: 'absolute',
              top: 'calc(50% + clamp(28px, 7vw, 90px))',
              left: '50%',
              transform: 'translateX(-50%)',
              fontFamily: "'Courier New', monospace",
              fontSize: 18,
              color: isStalled ? 'rgba(255,80,80,0.6)' : 'rgba(100,200,100,0.7)',
            }}>
              {spinnerChar}
            </div>
          )}
        </>
      )
    } else if (phase === 'hold') {
      // Stable — one brief rebuffer at 0.5
      const rebuffer = holdProgress > 0.47 && holdProgress < 0.58
      const spinnerChar = SPINNER_FRAMES[Math.floor(f / 4) % SPINNER_FRAMES.length]

      const chars = word.split('').map((ch, ci) => {
        if (rebuffer && rand(seed + ci * 53 + f) > 0.6) {
          return (
            <span key={ci} style={{
              display: 'inline-block',
              color: 'rgba(255,255,255,0.15)',
            }}>
              _
            </span>
          )
        }
        return <span key={ci} style={{ display: 'inline-block', color }}>{ch}</span>
      })

      return (
        <>
          <div style={{
            position: 'absolute', top: '50%', left: '50%',
            transform: 'translate(-50%, -50%)',
            fontFamily: "'Courier New', monospace",
            fontSize: 'clamp(44px, 11vw, 150px)',
            fontWeight: 700,
            whiteSpace: 'nowrap',
            letterSpacing: 4,
            textTransform: 'uppercase',
            textShadow: rebuffer ? 'none' : `0 0 8px ${color}30`,
          }}>
            {chars}
          </div>
          {rebuffer && (
            <div style={{
              position: 'absolute',
              top: 'calc(50% + clamp(28px, 7vw, 90px))',
              left: '50%',
              transform: 'translateX(-50%)',
              fontFamily: "'Courier New', monospace",
              fontSize: 18,
              color: 'rgba(100,200,100,0.7)',
            }}>
              {spinnerChar}
            </div>
          )}
        </>
      )
    } else {
      // Exit: chunks unload right to left (reverse of load)
      const chunks = 3
      const charsPerChunk = Math.ceil(word.length / chunks)

      const chars = word.split('').map((ch, ci) => {
        const chunkIdx = Math.min(chunks - 1, Math.floor(ci / charsPerChunk))
        // Chunks unload right to left: chunk 2 first, then 1, then 0
        const unloadAt = (chunks - 1 - chunkIdx) / chunks
        const isUnloaded = exitProgress > unloadAt

        return (
          <span key={ci} style={{
            display: 'inline-block',
            color: isUnloaded ? 'rgba(255,255,255,0.08)' : color,
            opacity: isUnloaded ? 0.3 : 1,
          }}>
            {isUnloaded ? '_' : ch}
          </span>
        )
      })

      return (
        <div style={{
          position: 'absolute', top: '50%', left: '50%',
          transform: 'translate(-50%, -50%)',
          fontFamily: "'Courier New', monospace",
          fontSize: 'clamp(44px, 11vw, 150px)',
          fontWeight: 700,
          whiteSpace: 'nowrap',
          letterSpacing: 4,
          textTransform: 'uppercase',
        }}>
          {chars}
        </div>
      )
    }
  },
}

function StreamBufferComponent(props: MotionGraphicProps<StreamBufferConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-stream-buffer',
  title: 'Kinetic Stream Buffer',
  description: 'Streaming buffer loading — text loads in chunks with spinner, network stall indicators, buffer progress bar, and rebuffering pauses',
  tags: ['kinetic', 'typography', 'glitch', 'streaming', 'buffer', 'loading', 'network', 'digital', 'transmission'],
  category: 'captions',
  component: StreamBufferComponent as any,
  defaultConfig: {
    words: ['LOADING', 'BUFFER', 'STREAM', 'STALL'],
    colors: ['#64C864', '#FFFFFF', '#64C864', '#FF5050'],
    bgColor: '#060606',
    cycleDuration: 2.0,
  },
  configSchema: [
    { key: 'words', label: 'Words', type: 'text-array', defaultValue: ['LOADING', 'BUFFER', 'STREAM', 'STALL'], group: 'Content' },
    { key: 'colors', label: 'Colors', type: 'text-array', defaultValue: ['#64C864', '#FFFFFF', '#64C864', '#FF5050'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#060606', group: 'Style' },
    { key: 'cycleDuration', label: 'Cycle Duration (s)', type: 'number', defaultValue: 2.0, min: 0.8, max: 6, group: 'Timing' },
  ],
})
