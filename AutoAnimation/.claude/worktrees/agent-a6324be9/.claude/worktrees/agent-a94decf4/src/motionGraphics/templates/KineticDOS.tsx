import { registerMotionGraphic } from '../registry'
import {
  KineticBase,
  type KineticBaseConfig,
  type KineticAnimation,
  type WordRenderProps,
  type BackgroundRenderProps,
} from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface DOSConfig extends KineticBaseConfig {}

function seededHash(seed: number): number {
  const x = Math.sin(seed * 12.9898 + 78.233) * 43758.5453
  return x - Math.floor(x)
}

const DOS_LINES = [
  'Microsoft(R) MS-DOS(R) Version 6.22',
  '(C)Copyright Microsoft Corp 1981-1994.',
  '',
  'C:\\>DIR /W',
  ' Volume in drive C is MSDOS622',
  ' Directory of C:\\',
  '',
  'AUTOEXEC BAT    COMMAND  COM    CONFIG   SYS',
  'DOS          <DIR>      WINDOWS  <DIR>',
  '     5 file(s)     142,038 bytes',
  '     2 dir(s)   52,428,800 bytes free',
  '',
]

const animation: KineticAnimation = {
  renderBackground: ({ bgColor, frame, fps, width, height }: BackgroundRenderProps) => {
    const time = frame / fps
    const lineHeight = 16
    const startY = 12
    // Scrolling scan line
    const scanY = (time * 60) % (height + 20)

    return (
      <div style={{ position: 'absolute', inset: 0, background: bgColor }}>
        {/* DOS directory listing in background */}
        {DOS_LINES.map((line, i) => (
          <div
            key={i}
            style={{
              position: 'absolute',
              left: 14,
              top: startY + i * lineHeight,
              fontFamily: "'Courier New', 'Lucida Console', monospace",
              fontSize: 11,
              color: 'rgba(170, 170, 170, 0.12)',
              whiteSpace: 'pre',
              letterSpacing: 0.5,
            }}
          >
            {line}
          </div>
        ))}
        {/* Phosphor scan line */}
        <div
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            top: scanY,
            height: 2,
            background: 'rgba(170, 170, 170, 0.04)',
            pointerEvents: 'none',
          }}
        />
        {/* CRT curvature vignette */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: 'radial-gradient(ellipse at center, transparent 60%, rgba(0,0,0,0.6) 100%)',
            pointerEvents: 'none',
          }}
        />
        {/* Subtle scan lines overlay */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            backgroundImage:
              'repeating-linear-gradient(0deg, transparent, transparent 1px, rgba(0,0,0,0.15) 1px, rgba(0,0,0,0.15) 2px)',
            pointerEvents: 'none',
          }}
        />
      </div>
    )
  },

  renderWord: ({ word, color, enterProgress, holdProgress, exitProgress, phase, frame }: WordRenderProps) => {
    const f = frame ?? 0
    const prompt = 'C:\\> '
    const fullText = prompt + word
    const totalChars = fullText.length
    let displayText = ''
    let showCursor = true
    let opacity = 1

    if (phase === 'enter') {
      // Character-by-character echo like DOS typing
      const charsToShow = Math.floor(enterProgress * (totalChars + 1))
      displayText = fullText.substring(0, Math.min(charsToShow, totalChars))
      showCursor = true
    } else if (phase === 'hold') {
      displayText = fullText
      // Blinking block cursor after text
      showCursor = Math.sin(f * 0.12) > 0
    } else {
      // Exit: text clears line by line (DOS cls effect)
      const clearProgress = exitProgress * 1.5
      opacity = clearProgress < 1 ? 1 : Math.max(0, 1 - (clearProgress - 1) * 2)
      displayText = fullText
      showCursor = false
    }

    // Separate prompt from typed text for color differentiation
    const promptLen = prompt.length
    const promptPart = displayText.substring(0, Math.min(promptLen, displayText.length))
    const textPart = displayText.substring(promptLen)

    return (
      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          opacity,
          fontFamily: "'Courier New', 'Lucida Console', monospace",
          fontSize: 'clamp(32px, 8vw, 120px)',
          fontWeight: 700,
          whiteSpace: 'nowrap',
          letterSpacing: 2,
        }}
      >
        {/* Prompt part in dimmer color */}
        <span style={{ color: 'rgba(170, 170, 170, 0.6)' }}>{promptPart}</span>
        {/* Typed text in bright color */}
        <span
          style={{
            color,
            textShadow: `0 0 6px ${color}40, 0 0 12px ${color}20`,
          }}
        >
          {textPart}
        </span>
        {/* Block cursor */}
        {showCursor && (
          <span
            style={{
              display: 'inline-block',
              width: 'clamp(14px, 3vw, 28px)',
              height: 'clamp(28px, 6vw, 90px)',
              background: color,
              marginLeft: 2,
              verticalAlign: 'middle',
              opacity: 0.9,
            }}
          />
        )}
      </div>
    )
  },
}

function DOSComponent(props: MotionGraphicProps<DOSConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-dos',
  title: 'Kinetic DOS',
  description:
    'MS-DOS command prompt with C:\\> prefix, character-by-character echo typing, block cursor, scan lines, and green-on-black CRT phosphor aesthetic',
  tags: ['kinetic', 'typography', 'dos', 'msdos', 'retro', 'command-line', 'terminal', 'computing'],
  category: 'captions',
  component: DOSComponent as any,
  defaultConfig: {
    words: ['FORMAT', 'COPY', 'DELETE', 'EDIT'],
    colors: ['#AAAAAA', '#AAAAAA', '#AAAAAA', '#AAAAAA'],
    bgColor: '#000000',
    cycleDuration: 1.5,
  },
  configSchema: [
    {
      key: 'words',
      label: 'Words',
      type: 'text-array',
      defaultValue: ['FORMAT', 'COPY', 'DELETE', 'EDIT'],
      group: 'Content',
    },
    {
      key: 'colors',
      label: 'Colors',
      type: 'text-array',
      defaultValue: ['#AAAAAA', '#AAAAAA', '#AAAAAA', '#AAAAAA'],
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
