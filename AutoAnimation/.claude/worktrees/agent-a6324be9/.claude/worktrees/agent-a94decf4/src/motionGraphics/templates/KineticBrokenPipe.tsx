import { registerMotionGraphic } from '../registry'
import {
  KineticBase,
  type KineticBaseConfig,
  type KineticAnimation,
  type WordRenderProps,
  type BackgroundRenderProps,
} from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface BrokenPipeConfig extends KineticBaseConfig {}

/** Deterministic pseudo-random 0..1 */
function rand(s: number): number {
  const x = Math.sin(s * 127.1 + 311.7) * 43758.5453
  return x - Math.floor(x)
}

/** Ease-out quad */
function easeOut(t: number): number {
  return 1 - (1 - Math.max(0, Math.min(1, t))) * (1 - Math.max(0, Math.min(1, t)))
}

const animation: KineticAnimation = {
  renderBackground: ({ bgColor, width, height, frame, fps }: BackgroundRenderProps) => {
    const time = frame / fps
    // Streaming data pipe visualization — left to right flow
    const streamRows = 8
    const streamLines: { y: number; text: string; opacity: number; speed: number }[] = []

    for (let r = 0; r < streamRows; r++) {
      const speed = 30 + rand(r * 71) * 60
      const offset = rand(r * 113) * width
      void (((time * speed + offset) % (width + 200)) - 100) // x position unused (full-width text)
      const text = Array.from({ length: 6 }, (_, i) =>
        Math.floor(rand(r * 200 + i + Math.floor((time * speed) / 8)) * 256)
          .toString(16)
          .toUpperCase()
          .padStart(2, '0'),
      ).join(' ')

      // Pipe break: some streams get "cut" at a certain x position
      const breakAt = width * (0.3 + rand(r * 53 + 7) * 0.4)
      const isBroken = rand(r * 89 + Math.floor(time * 0.5) * 13) < 0.35

      streamLines.push({
        y: Math.floor((height * (r + 0.5)) / streamRows),
        text: isBroken ? text.substring(0, Math.floor(breakAt / 6)) + '...' : text,
        opacity: 0.06 + rand(r * 37) * 0.06,
        speed,
      })
    }

    return (
      <div style={{ position: 'absolute', inset: 0, background: bgColor }}>
        {streamLines.map((stream, i) => (
          <div
            key={i}
            style={{
              position: 'absolute',
              top: stream.y,
              left: 0,
              right: 0,
              fontFamily: "'Courier New', monospace",
              fontSize: 8,
              color: `rgba(255, 140, 60, ${stream.opacity})`,
              letterSpacing: 1,
              whiteSpace: 'nowrap',
              overflow: 'hidden',
            }}
          >
            {stream.text}
          </div>
        ))}
        {/* Pipe status indicators */}
        <div
          style={{
            position: 'absolute',
            top: 8,
            left: 10,
            fontFamily: "'Courier New', monospace",
            fontSize: 8,
            color: 'rgba(255, 100, 30, 0.12)',
          }}
        >
          PIPE STATUS: BROKEN — SIGPIPE
        </div>
        <div
          style={{
            position: 'absolute',
            top: 8,
            right: 10,
            fontFamily: "'Courier New', monospace",
            fontSize: 8,
            color: 'rgba(255, 100, 30, 0.10)',
          }}
        >
          ERRNO 32
        </div>
      </div>
    )
  },

  renderWord: ({
    word,
    color,
    enterProgress,
    holdProgress,
    exitProgress,
    phase,
    index,
    frame,
    width,
  }: WordRenderProps) => {
    const f = frame ?? 0
    const seed = index * 137 + 53
    const chars = word.split('')
    const totalChars = chars.length

    if (phase === 'enter') {
      // Text streams in from left like a pipe — then CUTS at the mid-word break point, then resumes
      // Break happens at ~40% enter progress, resumes at ~65%
      const breakStart = 0.38
      const breakEnd = 0.62
      const isBroken = enterProgress >= breakStart && enterProgress <= breakEnd

      // Before break: characters stream in left to right
      const streamProgress = isBroken
        ? breakStart
        : enterProgress > breakEnd
          ? easeOut((enterProgress - breakEnd) / (1 - breakEnd))
          : easeOut(enterProgress / breakStart)

      const charsVisible = isBroken
        ? Math.floor(breakStart * totalChars * 2.5) // cut at ~half the chars
        : Math.floor(streamProgress * totalChars * 1.1)

      const rendered = chars.map((ch, ci) => {
        if (ci >= charsVisible) {
          // Not yet received — show as a faint cursor or nothing
          return (
            <span key={ci} style={{ display: 'inline-block', color: `${color}00` }}>
              {ch}
            </span>
          )
        }

        const charFresh = ci === charsVisible - 1
        // Stream arrival jitter
        const jitterX = charFresh ? Math.sin(f * 2.1 + ci) * 2 : 0
        const displayColor = charFresh && isBroken ? '#FF4000' : color

        return (
          <span
            key={ci}
            style={{
              display: 'inline-block',
              color: displayColor,
              transform: `translateX(${jitterX}px)`,
            }}
          >
            {ch}
          </span>
        )
      })

      // Show broken pipe ellipsis or cursor
      const cursor = isBroken ? (
        <span
          style={{
            display: 'inline-block',
            color: '#FF4000',
            opacity: Math.floor(f / 4) % 2 === 0 ? 1 : 0,
            marginLeft: 2,
          }}
        >
          |
        </span>
      ) : null

      return (
        <div style={{ position: 'absolute', inset: 0 }}>
          <div
            style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              fontFamily: "'Courier New', monospace",
              fontSize: 'clamp(38px, 11vw, 150px)',
              fontWeight: 700,
              whiteSpace: 'nowrap',
              letterSpacing: 3,
            }}
          >
            {rendered}
            {cursor}
          </div>
          {isBroken && (
            <div
              style={{
                position: 'absolute',
                bottom: '28%',
                left: '50%',
                transform: 'translateX(-50%)',
                fontFamily: "'Courier New', monospace",
                fontSize: 9,
                color: '#FF400060',
                whiteSpace: 'nowrap',
              }}
            >
              write: broken pipe
            </div>
          )}
        </div>
      )
    } else if (phase === 'hold') {
      // Stable display — pipe flowing normally with a brief stutter
      const stutter = holdProgress > 0.4 && holdProgress < 0.44
      const shiftX = stutter ? (rand(seed + Math.floor(holdProgress * 40)) - 0.5) * 8 : 0

      return (
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: `translate(calc(-50% + ${shiftX}px), -50%)`,
            fontFamily: "'Courier New', monospace",
            fontSize: 'clamp(38px, 11vw, 150px)',
            fontWeight: 700,
            whiteSpace: 'nowrap',
            letterSpacing: 3,
            color,
            textShadow: stutter ? `3px 0 #FF4000, -3px 0 ${color}, 0 0 12px #FF4000` : `0 0 8px ${color}20`,
          }}
        >
          {word}
        </div>
      )
    } else {
      // Exit: pipe closes, text slides out to the right and cuts off
      const slideX = easeOut(exitProgress) * (width * 0.4)

      return (
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: `translate(calc(-50% + ${slideX}px), -50%)`,
            fontFamily: "'Courier New', monospace",
            fontSize: 'clamp(38px, 11vw, 150px)',
            fontWeight: 700,
            whiteSpace: 'nowrap',
            letterSpacing: 3,
            color,
            opacity: Math.max(0, 1 - exitProgress * 2),
          }}
        >
          {word}
        </div>
      )
    }
  },
}

function BrokenPipeComponent(props: MotionGraphicProps<BrokenPipeConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-broken-pipe',
  title: 'Kinetic Broken Pipe',
  description:
    'Broken Unix pipe data stream: text flows in character by character, gets cut mid-word with SIGPIPE error, then resumes. Streaming hex data background.',
  tags: ['kinetic', 'typography', 'glitch', 'pipe', 'unix', 'stream', 'broken', 'sigpipe'],
  category: 'captions',
  component: BrokenPipeComponent as any,
  defaultConfig: {
    words: ['STREAM', 'BROKEN', 'PIPE', 'RESUME'],
    colors: ['#FF8C30', '#FF6010', '#FFAA50', '#FF7020'],
    bgColor: '#060300',
    cycleDuration: 1.8,
  },
  configSchema: [
    {
      key: 'words',
      label: 'Words',
      type: 'text-array',
      defaultValue: ['STREAM', 'BROKEN', 'PIPE', 'RESUME'],
      group: 'Content',
    },
    {
      key: 'colors',
      label: 'Colors',
      type: 'text-array',
      defaultValue: ['#FF8C30', '#FF6010', '#FFAA50', '#FF7020'],
      group: 'Style',
    },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#060300', group: 'Style' },
    {
      key: 'cycleDuration',
      label: 'Cycle Duration (s)',
      type: 'number',
      defaultValue: 1.8,
      min: 0.3,
      max: 5,
      group: 'Timing',
    },
  ],
})
