import { registerMotionGraphic } from '../registry'
import {
  KineticBase,
  type KineticBaseConfig,
  type KineticAnimation,
  type WordRenderProps,
  type BackgroundRenderProps,
} from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface ASCIIArtConfig extends KineticBaseConfig {}

// ASCII art letter map — each letter is 5 rows of 5 chars
const ASCII_FONT: Record<string, string[]> = {
  A: [' ### ', '#   #', '#####', '#   #', '#   #'],
  B: ['#### ', '#   #', '#### ', '#   #', '#### '],
  C: [' ####', '#    ', '#    ', '#    ', ' ####'],
  D: ['#### ', '#   #', '#   #', '#   #', '#### '],
  E: ['#####', '#    ', '#### ', '#    ', '#####'],
  F: ['#####', '#    ', '#### ', '#    ', '#    '],
  G: [' ####', '#    ', '# ###', '#   #', ' ### '],
  H: ['#   #', '#   #', '#####', '#   #', '#   #'],
  I: ['#####', '  #  ', '  #  ', '  #  ', '#####'],
  J: ['#####', '   # ', '   # ', '#  # ', ' ## '],
  K: ['#   #', '#  # ', '###  ', '#  # ', '#   #'],
  L: ['#    ', '#    ', '#    ', '#    ', '#####'],
  M: ['#   #', '## ##', '# # #', '#   #', '#   #'],
  N: ['#   #', '##  #', '# # #', '#  ##', '#   #'],
  O: [' ### ', '#   #', '#   #', '#   #', ' ### '],
  P: ['#### ', '#   #', '#### ', '#    ', '#    '],
  Q: [' ### ', '#   #', '# # #', '#  # ', ' ## #'],
  R: ['#### ', '#   #', '#### ', '#  # ', '#   #'],
  S: [' ####', '#    ', ' ### ', '    #', '#### '],
  T: ['#####', '  #  ', '  #  ', '  #  ', '  #  '],
  U: ['#   #', '#   #', '#   #', '#   #', ' ### '],
  V: ['#   #', '#   #', '#   #', ' # # ', '  #  '],
  W: ['#   #', '#   #', '# # #', '## ##', '#   #'],
  X: ['#   #', ' # # ', '  #  ', ' # # ', '#   #'],
  Y: ['#   #', ' # # ', '  #  ', '  #  ', '  #  '],
  Z: ['#####', '   # ', '  #  ', ' #   ', '#####'],
  ' ': ['     ', '     ', '     ', '     ', '     '],
  '!': ['  #  ', '  #  ', '  #  ', '     ', '  #  '],
  '?': [' ### ', '#   #', '  ## ', '     ', '  #  '],
  '.': ['     ', '     ', '     ', '     ', '  #  '],
}

function getASCIIArt(text: string): string[] {
  const upper = text.toUpperCase()
  const rows: string[] = ['', '', '', '', '']
  for (let i = 0; i < upper.length; i++) {
    const ch = upper[i]
    const art = ASCII_FONT[ch] ?? ASCII_FONT['?']!
    for (let r = 0; r < 5; r++) {
      rows[r] += (i > 0 ? ' ' : '') + art[r]
    }
  }
  return rows
}

const animation: KineticAnimation = {
  renderBackground: ({ bgColor, frame, fps }: BackgroundRenderProps) => {
    const time = frame / fps
    // Subtle background with scrolling ASCII decoration
    const decorChars = '/-\\|'
    const spinnerIdx = Math.floor(time * 8) % 4

    return (
      <div style={{ position: 'absolute', inset: 0, background: bgColor }}>
        {/* Corner ASCII spinner */}
        <div
          style={{
            position: 'absolute',
            top: 12,
            right: 16,
            fontFamily: "'Courier New', monospace",
            fontSize: 16,
            color: 'rgba(0, 255, 0, 0.15)',
          }}
        >
          [{decorChars[spinnerIdx]}]
        </div>
        {/* Top border decoration */}
        <div
          style={{
            position: 'absolute',
            top: 8,
            left: 12,
            fontFamily: "'Courier New', monospace",
            fontSize: 10,
            color: 'rgba(0, 255, 0, 0.1)',
            whiteSpace: 'pre',
            letterSpacing: 0,
          }}
        >
          {'+='.repeat(20) + '+'}
        </div>
        {/* Bottom border decoration */}
        <div
          style={{
            position: 'absolute',
            bottom: 8,
            left: 12,
            fontFamily: "'Courier New', monospace",
            fontSize: 10,
            color: 'rgba(0, 255, 0, 0.1)',
            whiteSpace: 'pre',
            letterSpacing: 0,
          }}
        >
          {'+='.repeat(20) + '+'}
        </div>
        {/* Scan lines */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            backgroundImage:
              'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.08) 2px, rgba(0,0,0,0.08) 4px)',
            pointerEvents: 'none',
          }}
        />
      </div>
    )
  },

  renderWord: ({ word, color, enterProgress, holdProgress, exitProgress, phase, frame }: WordRenderProps) => {
    const f = frame ?? 0
    const asciiRows = getASCIIArt(word)
    const totalRows = asciiRows.length // 5 rows

    if (phase === 'enter') {
      // Rows animate in one by one from top to bottom
      const rowElements = asciiRows.map((row, ri) => {
        const rowProgress = Math.max(0, Math.min(1, (enterProgress * (totalRows + 1) - ri) / 1.5))
        // Each row slides in from the right while fading in
        const translateX = (1 - rowProgress) * 40
        const rowOpacity = rowProgress

        return (
          <div
            key={ri}
            style={{
              transform: `translateX(${translateX}px)`,
              opacity: rowOpacity,
              whiteSpace: 'pre',
              lineHeight: 1.1,
            }}
          >
            {row}
          </div>
        )
      })

      return (
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            fontFamily: "'Courier New', 'Lucida Console', monospace",
            fontSize: 'clamp(8px, 2.5vw, 24px)',
            fontWeight: 700,
            color,
            textShadow: `0 0 4px ${color}60`,
            letterSpacing: 2,
          }}
        >
          {rowElements}
        </div>
      )
    } else if (phase === 'hold') {
      // Gentle pulse glow and occasional character shimmer
      const glowIntensity = 4 + Math.sin(f * 0.08) * 3

      const rowElements = asciiRows.map((row, ri) => {
        // Shimmer effect: randomly brighten some # characters
        const chars = row.split('').map((ch, ci) => {
          if (ch === '#' && Math.sin(f * 0.1 + ri * 3 + ci * 7) > 0.7) {
            return (
              <span key={ci} style={{ color: '#FFFFFF', textShadow: `0 0 6px ${color}` }}>
                {ch}
              </span>
            )
          }
          return <span key={ci}>{ch}</span>
        })

        return (
          <div key={ri} style={{ whiteSpace: 'pre', lineHeight: 1.1 }}>
            {chars}
          </div>
        )
      })

      return (
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            fontFamily: "'Courier New', 'Lucida Console', monospace",
            fontSize: 'clamp(8px, 2.5vw, 24px)',
            fontWeight: 700,
            color,
            textShadow: `0 0 ${glowIntensity}px ${color}60`,
            letterSpacing: 2,
          }}
        >
          {rowElements}
        </div>
      )
    } else {
      // Exit: rows dissolve from bottom to top
      const rowElements = asciiRows.map((row, ri) => {
        const reverseIdx = totalRows - 1 - ri
        const rowProgress = Math.max(0, Math.min(1, (exitProgress * (totalRows + 1) - reverseIdx) / 1.5))
        const translateX = rowProgress * -40
        const rowOpacity = 1 - rowProgress

        return (
          <div
            key={ri}
            style={{
              transform: `translateX(${translateX}px)`,
              opacity: rowOpacity,
              whiteSpace: 'pre',
              lineHeight: 1.1,
            }}
          >
            {row}
          </div>
        )
      })

      return (
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            fontFamily: "'Courier New', 'Lucida Console', monospace",
            fontSize: 'clamp(8px, 2.5vw, 24px)',
            fontWeight: 700,
            color,
            textShadow: `0 0 4px ${color}60`,
            letterSpacing: 2,
          }}
        >
          {rowElements}
        </div>
      )
    }
  },
}

function ASCIIArtComponent(props: MotionGraphicProps<ASCIIArtConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-ascii-art',
  title: 'Kinetic ASCII Art',
  description:
    'Text rendered as ASCII art block characters that animate in row by row with shimmer effects, glow pulse, and terminal aesthetic',
  tags: ['kinetic', 'typography', 'ascii', 'art', 'retro', 'terminal', 'text-art', 'computing'],
  category: 'captions',
  component: ASCIIArtComponent as any,
  defaultConfig: {
    words: ['HACK', 'CODE', 'UNIX', 'ROOT'],
    colors: ['#00FF41', '#00FF41', '#00FF41', '#00FF41'],
    bgColor: '#0a0a0a',
    cycleDuration: 1.8,
  },
  configSchema: [
    {
      key: 'words',
      label: 'Words',
      type: 'text-array',
      defaultValue: ['HACK', 'CODE', 'UNIX', 'ROOT'],
      group: 'Content',
    },
    {
      key: 'colors',
      label: 'Colors',
      type: 'text-array',
      defaultValue: ['#00FF41', '#00FF41', '#00FF41', '#00FF41'],
      group: 'Style',
    },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#0a0a0a', group: 'Style' },
    {
      key: 'cycleDuration',
      label: 'Cycle Duration (s)',
      type: 'number',
      defaultValue: 1.8,
      min: 0.5,
      max: 5,
      group: 'Timing',
    },
  ],
})
