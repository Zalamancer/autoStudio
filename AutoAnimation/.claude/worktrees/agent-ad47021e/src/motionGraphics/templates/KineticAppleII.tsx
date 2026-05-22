import { registerMotionGraphic } from '../registry'
import {
  KineticBase,
  type KineticBaseConfig,
  type KineticAnimation,
  type WordRenderProps,
  type BackgroundRenderProps,
} from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface AppleIIConfig extends KineticBaseConfig {}

// Apple II lo-res color palette (16 colors)
const LORES_COLORS = [
  '#000000', '#DD0033', '#000099', '#DD22DD',
  '#007722', '#555555', '#2222FF', '#6666FF',
  '#885500', '#FF6600', '#AAAAAA', '#FF9988',
  '#11DD00', '#FFFF00', '#44FF99', '#FFFFFF',
]

const APPLE_HEADER = [
  ']',
  'APPLE ][',
  '',
  '*SYSTEM MASTER',
  '',
]

const animation: KineticAnimation = {
  renderBackground: ({ bgColor, width, height, frame, fps }: BackgroundRenderProps) => {
    const time = frame / fps

    // Generate lo-res color blocks at bottom (Apple II lo-res mode aesthetic)
    const blockSize = 16
    const cols = Math.ceil(width / blockSize)
    const rows = 3
    const loResBlocks: { x: number; y: number; color: string }[] = []
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const seed = r * cols + c + Math.floor(time * 2)
        const colorIdx = Math.abs(seed * 137 + r * 31 + c * 17) % LORES_COLORS.length
        loResBlocks.push({
          x: c * blockSize,
          y: height - (rows - r) * blockSize - 8,
          color: LORES_COLORS[colorIdx],
        })
      }
    }

    return (
      <div style={{ position: 'absolute', inset: 0, background: bgColor }}>
        {/* Apple II header text */}
        {APPLE_HEADER.map((line, i) => (
          <div
            key={i}
            style={{
              position: 'absolute',
              left: 16,
              top: 10 + i * 16,
              fontFamily: "'Courier New', 'Lucida Console', monospace",
              fontSize: 12,
              color: '#33FF33',
              opacity: 0.12,
              whiteSpace: 'pre',
              letterSpacing: 1,
            }}
          >
            {line}
          </div>
        ))}

        {/* 40-column grid lines (subtle) */}
        {Array.from({ length: 41 }, (_, i) => (
          <div
            key={`col-${i}`}
            style={{
              position: 'absolute',
              left: 16 + i * ((width - 32) / 40),
              top: 0,
              bottom: 0,
              width: 1,
              background: 'rgba(51, 255, 51, 0.02)',
              pointerEvents: 'none',
            }}
          />
        ))}

        {/* Lo-res color blocks at bottom */}
        {loResBlocks.map((block, i) => (
          <div
            key={`lores-${i}`}
            style={{
              position: 'absolute',
              left: block.x,
              top: block.y,
              width: blockSize,
              height: blockSize,
              background: block.color,
              opacity: 0.15,
            }}
          />
        ))}

        {/* Prompt at bottom-left */}
        <div
          style={{
            position: 'absolute',
            bottom: rows * blockSize + 14,
            left: 16,
            fontFamily: "'Courier New', monospace",
            fontSize: 12,
            color: '#33FF33',
            opacity: 0.18,
          }}
        >
          ]
          <span
            style={{
              display: 'inline-block',
              width: 8,
              height: 12,
              background: '#33FF33',
              marginLeft: 2,
              verticalAlign: 'middle',
              opacity: Math.sin(time * 4) > 0 ? 1 : 0,
            }}
          />
        </div>

        {/* Green phosphor vignette */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: 'radial-gradient(ellipse at center, transparent 50%, rgba(0,0,0,0.6) 100%)',
            pointerEvents: 'none',
          }}
        />

        {/* Scan lines */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            backgroundImage:
              'repeating-linear-gradient(0deg, transparent, transparent 1px, rgba(0,0,0,0.12) 1px, rgba(0,0,0,0.12) 2px)',
            pointerEvents: 'none',
          }}
        />
      </div>
    )
  },

  renderWord: ({ word, color, enterProgress, holdProgress, exitProgress, phase, frame, width: w }: WordRenderProps) => {
    const f = frame ?? 0

    // Apple II pixel-text effect: each character rendered as if composed of chunky pixels
    const renderPixelChar = (ch: string, ci: number, charColor: string, charOpacity: number) => {
      // Simulate hi-res mode pixel text with a chunky, blocky look
      const pixelGlow = Math.sin(f * 0.03 + ci * 0.5) * 0.1
      return (
        <span
          key={ci}
          style={{
            color: charColor,
            opacity: charOpacity,
            textShadow: `0 0 ${2 + pixelGlow * 4}px ${charColor}`,
            imageRendering: 'pixelated' as any,
          }}
        >
          {ch}
        </span>
      )
    }

    if (phase === 'enter') {
      // Apple II boot: text appears character by character with ] prompt
      const totalChars = word.length
      const charsToShow = Math.floor(enterProgress * (totalChars + 1))
      const prompt = '] '

      const chars = word.split('').map((ch, ci) => {
        if (ci >= charsToShow) return null
        // Newly typed character has bright flash
        const isCurrent = ci === charsToShow - 1
        const brightness = isCurrent ? 1.3 : 1
        return renderPixelChar(ch, ci, color, Math.min(1, brightness))
      })

      return (
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            fontFamily: "'Courier New', 'Lucida Console', monospace",
            fontSize: 'clamp(36px, 9vw, 130px)',
            fontWeight: 700,
            whiteSpace: 'nowrap',
            letterSpacing: 3,
          }}
        >
          <span style={{ color: 'rgba(51,255,51,0.5)' }}>{prompt}</span>
          {chars}
          {/* Block cursor */}
          <span
            style={{
              display: 'inline-block',
              width: 'clamp(12px, 3vw, 28px)',
              height: 'clamp(28px, 7vw, 100px)',
              background: color,
              marginLeft: 2,
              verticalAlign: 'middle',
              opacity: Math.sin(f * 0.16) > 0 ? 1 : 0,
            }}
          />
        </div>
      )
    } else if (phase === 'hold') {
      // Steady display with characteristic Apple II flicker
      const flicker = 0.95 + Math.sin(f * 0.08) * 0.05

      const chars = word.split('').map((ch, ci) => renderPixelChar(ch, ci, color, flicker))

      return (
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            fontFamily: "'Courier New', 'Lucida Console', monospace",
            fontSize: 'clamp(36px, 9vw, 130px)',
            fontWeight: 700,
            whiteSpace: 'nowrap',
            letterSpacing: 3,
          }}
        >
          <span style={{ color: 'rgba(51,255,51,0.5)' }}>{'] '}</span>
          {chars}
        </div>
      )
    } else {
      // Exit: inverse video flash then clear (Apple II CTRL behavior)
      const inversePhase = exitProgress < 0.4
      const fadeOut = Math.max(0, (exitProgress - 0.4) / 0.6)

      const chars = word.split('').map((ch, ci) => {
        if (inversePhase) {
          // Inverse video: swap bg/fg
          return (
            <span
              key={ci}
              style={{
                background: color,
                color: '#000000',
                padding: '0 2px',
              }}
            >
              {ch}
            </span>
          )
        }
        return renderPixelChar(ch, ci, color, 1 - fadeOut)
      })

      return (
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            opacity: 1 - fadeOut * 0.6,
            fontFamily: "'Courier New', 'Lucida Console', monospace",
            fontSize: 'clamp(36px, 9vw, 130px)',
            fontWeight: 700,
            whiteSpace: 'nowrap',
            letterSpacing: 3,
          }}
        >
          <span style={{ color: 'rgba(51,255,51,0.5)', opacity: 1 - fadeOut }}>{'] '}</span>
          {chars}
        </div>
      )
    }
  },
}

function AppleIIComponent(props: MotionGraphicProps<AppleIIConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-apple-ii',
  title: 'Kinetic Apple II',
  description:
    'Apple II green phosphor display with 40-column text, lo-res color blocks, hi-res pixel text rendering, bracket prompt, and 1977 vintage aesthetic',
  tags: ['kinetic', 'typography', 'apple', 'apple2', 'retro', 'green', '8bit', 'computing', '1977'],
  category: 'captions',
  component: AppleIIComponent as any,
  defaultConfig: {
    words: ['HELLO', 'GOTO', 'PRINT', 'PEEK'],
    colors: ['#33FF33', '#33FF33', '#33FF33', '#33FF33'],
    bgColor: '#000000',
    cycleDuration: 1.3,
  },
  configSchema: [
    {
      key: 'words',
      label: 'Words',
      type: 'text-array',
      defaultValue: ['HELLO', 'GOTO', 'PRINT', 'PEEK'],
      group: 'Content',
    },
    {
      key: 'colors',
      label: 'Colors',
      type: 'text-array',
      defaultValue: ['#33FF33', '#33FF33', '#33FF33', '#33FF33'],
      group: 'Style',
    },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#000000', group: 'Style' },
    {
      key: 'cycleDuration',
      label: 'Cycle Duration (s)',
      type: 'number',
      defaultValue: 1.3,
      min: 0.5,
      max: 5,
      group: 'Timing',
    },
  ],
})
