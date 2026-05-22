import { registerMotionGraphic } from '../registry'
import {
  KineticBase,
  type KineticBaseConfig,
  type KineticAnimation,
  type WordRenderProps,
  type BackgroundRenderProps,
} from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface TeletextConfig extends KineticBaseConfig {}

// Teletext color palette (the 8 BBC Teletext colors)
const TELETEXT_COLORS = ['#FF0000', '#00FF00', '#FFFF00', '#0000FF', '#FF00FF', '#00FFFF', '#FFFFFF']

function teletextBlockChar(seed: number): string {
  // Unicode block elements used in teletext
  const blocks = ['\u2580', '\u2584', '\u2588', '\u2591', '\u2592', '\u2593', '\u2596', '\u2597', '\u2598', '\u259D']
  return blocks[Math.abs(seed) % blocks.length]
}

const animation: KineticAnimation = {
  renderBackground: ({ bgColor, width, height, frame, fps }: BackgroundRenderProps) => {
    const time = frame / fps
    const pageNum = 100 + Math.floor((time * 0.3) % 900)

    // Generate decorative block graphics rows
    const blockRows: { y: number; blocks: { char: string; color: string }[] }[] = []
    for (let row = 0; row < 3; row++) {
      const blocks: { char: string; color: string }[] = []
      for (let col = 0; col < 20; col++) {
        const seed = row * 20 + col + Math.floor(time * 2)
        blocks.push({
          char: teletextBlockChar(seed * 137 + 29),
          color: TELETEXT_COLORS[(seed * 7 + row) % TELETEXT_COLORS.length],
        })
      }
      blockRows.push({ y: row === 0 ? 32 : row === 1 ? 48 : height - 40, blocks })
    }

    return (
      <div style={{ position: 'absolute', inset: 0, background: bgColor }}>
        {/* Teletext header bar */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: 28,
            background: '#000000',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            paddingLeft: 12,
            paddingRight: 12,
          }}
        >
          <span
            style={{
              fontFamily: "'Courier New', monospace",
              fontSize: 14,
              fontWeight: 700,
              color: '#FFFF00',
              letterSpacing: 2,
            }}
          >
            CEEFAX
          </span>
          <span
            style={{
              fontFamily: "'Courier New', monospace",
              fontSize: 14,
              fontWeight: 700,
              color: '#FFFFFF',
              letterSpacing: 2,
            }}
          >
            P{pageNum}
          </span>
        </div>

        {/* Decorative block graphics rows */}
        {blockRows.map((row, ri) => (
          <div
            key={ri}
            style={{
              position: 'absolute',
              left: 12,
              top: row.y,
              display: 'flex',
              gap: 0,
            }}
          >
            {row.blocks.map((b, bi) => (
              <span
                key={bi}
                style={{
                  fontFamily: "'Courier New', monospace",
                  fontSize: 12,
                  color: b.color,
                  opacity: 0.2,
                  lineHeight: 1,
                }}
              >
                {b.char}
              </span>
            ))}
          </div>
        ))}

        {/* Teletext footer with page navigation */}
        <div
          style={{
            position: 'absolute',
            bottom: 8,
            left: 12,
            right: 12,
            display: 'flex',
            justifyContent: 'space-between',
          }}
        >
          {['Red', 'Green', 'Yellow', 'Blue'].map((label, i) => {
            const colors = ['#FF0000', '#00FF00', '#FFFF00', '#0000FF']
            return (
              <div
                key={label}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 4,
                }}
              >
                <div
                  style={{
                    width: 24,
                    height: 12,
                    background: colors[i],
                    opacity: 0.3,
                  }}
                />
                <span
                  style={{
                    fontFamily: "'Courier New', monospace",
                    fontSize: 10,
                    color: 'rgba(255,255,255,0.15)',
                  }}
                >
                  {(pageNum + i + 1).toString()}
                </span>
              </div>
            )
          })}
        </div>

        {/* Interlace flicker overlay */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            backgroundImage:
              'repeating-linear-gradient(0deg, transparent, transparent 1px, rgba(0,0,0,0.1) 1px, rgba(0,0,0,0.1) 2px)',
            pointerEvents: 'none',
          }}
        />
      </div>
    )
  },

  renderWord: ({ word, color, enterProgress, holdProgress, exitProgress, phase, frame, index }: WordRenderProps) => {
    const f = frame ?? 0
    let opacity = 1

    if (phase === 'enter') {
      // Teletext page reveal: blocky rows appear top-to-bottom
      // Each character slot fills in sequence with block chars first, then resolves
      const chars = word.split('')
      const elements = chars.map((ch, ci) => {
        const charProgress = Math.max(0, Math.min(1, (enterProgress * (chars.length + 2) - ci) / 2))
        if (charProgress < 0.5) {
          // Show block character placeholder
          const blockIdx = Math.floor(charProgress * 6)
          const blockChars = ['\u2591', '\u2592', '\u2593', '\u2588', '\u2593', ch]
          return (
            <span key={ci} style={{ color: TELETEXT_COLORS[(ci + index) % TELETEXT_COLORS.length] }}>
              {blockChars[blockIdx] ?? '\u2591'}
            </span>
          )
        }
        return (
          <span key={ci} style={{ color }}>
            {ch}
          </span>
        )
      })

      return (
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            fontFamily: "'Courier New', monospace",
            fontSize: 'clamp(40px, 11vw, 150px)',
            fontWeight: 700,
            whiteSpace: 'nowrap',
            letterSpacing: 6,
            textShadow: '2px 2px 0 rgba(0,0,0,0.8)',
          }}
        >
          {elements}
        </div>
      )
    } else if (phase === 'hold') {
      // Subtle teletext color cycling on individual characters
      const chars = word.split('')
      const elements = chars.map((ch, ci) => {
        const colorShift = Math.floor(f * 0.03 + ci) % TELETEXT_COLORS.length
        const charColor = ci % 3 === 0 ? TELETEXT_COLORS[colorShift] : color
        return (
          <span key={ci} style={{ color: charColor }}>
            {ch}
          </span>
        )
      })

      return (
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            fontFamily: "'Courier New', monospace",
            fontSize: 'clamp(40px, 11vw, 150px)',
            fontWeight: 700,
            whiteSpace: 'nowrap',
            letterSpacing: 6,
            textShadow: '2px 2px 0 rgba(0,0,0,0.8)',
          }}
        >
          {elements}
        </div>
      )
    } else {
      // Exit: dissolve into block characters
      const chars = word.split('')
      const elements = chars.map((ch, ci) => {
        const charExit = Math.max(0, Math.min(1, (exitProgress * (chars.length + 2) - ci) / 2))
        if (charExit > 0.5) {
          const blockIdx = Math.min(3, Math.floor((charExit - 0.5) * 8))
          const blockChars = ['\u2593', '\u2592', '\u2591', ' ']
          return (
            <span key={ci} style={{ color: TELETEXT_COLORS[(ci + index) % TELETEXT_COLORS.length], opacity: 1 - charExit }}>
              {blockChars[blockIdx] ?? ' '}
            </span>
          )
        }
        return (
          <span key={ci} style={{ color }}>
            {ch}
          </span>
        )
      })

      return (
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            fontFamily: "'Courier New', monospace",
            fontSize: 'clamp(40px, 11vw, 150px)',
            fontWeight: 700,
            whiteSpace: 'nowrap',
            letterSpacing: 6,
            textShadow: '2px 2px 0 rgba(0,0,0,0.8)',
          }}
        >
          {elements}
        </div>
      )
    }
  },
}

function TeletextComponent(props: MotionGraphicProps<TeletextConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-teletext',
  title: 'Kinetic Teletext',
  description:
    'BBC Ceefax/Teletext style with blocky color graphics, page numbers, character-by-character block reveal, and interlace flicker',
  tags: ['kinetic', 'typography', 'teletext', 'ceefax', 'bbc', 'retro', 'block', 'computing'],
  category: 'captions',
  component: TeletextComponent as any,
  defaultConfig: {
    words: ['NEWS', 'SPORT', 'WEATHER', 'INDEX'],
    colors: ['#FFFFFF', '#00FFFF', '#FFFF00', '#00FF00'],
    bgColor: '#000000',
    cycleDuration: 1.5,
  },
  configSchema: [
    {
      key: 'words',
      label: 'Words',
      type: 'text-array',
      defaultValue: ['NEWS', 'SPORT', 'WEATHER', 'INDEX'],
      group: 'Content',
    },
    {
      key: 'colors',
      label: 'Colors',
      type: 'text-array',
      defaultValue: ['#FFFFFF', '#00FFFF', '#FFFF00', '#00FF00'],
      group: 'Style',
    },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#000000', group: 'Style' },
    {
      key: 'cycleDuration',
      label: 'Cycle Duration (s)',
      type: 'number',
      defaultValue: 1.5,
      min: 0.5,
      max: 5,
      group: 'Timing',
    },
  ],
})
