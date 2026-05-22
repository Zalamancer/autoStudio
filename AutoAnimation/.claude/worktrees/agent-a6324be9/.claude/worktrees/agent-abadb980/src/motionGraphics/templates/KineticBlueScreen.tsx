import { registerMotionGraphic } from '../registry'
import {
  KineticBase,
  type KineticBaseConfig,
  type KineticAnimation,
  type WordRenderProps,
  type BackgroundRenderProps,
} from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface BlueScreenConfig extends KineticBaseConfig {}

const BSOD_LINES = [
  'A problem has been detected and Windows has been shut down',
  'to prevent damage to your computer.',
  '',
  'IRQL_NOT_LESS_OR_EQUAL',
  '',
  'If this is the first time you have seen this Stop error screen,',
  'restart your computer. If this screen appears again, follow',
  'these steps:',
  '',
  'Check to make sure any new hardware or software is properly',
  'installed. If this is a new installation, ask your hardware',
  'or software manufacturer for any Windows updates you might need.',
  '',
  'Technical information:',
  '',
  '*** STOP: 0x0000000A (0x00000000, 0x00000002, 0x00000000, 0x804E5EE4)',
]

const animation: KineticAnimation = {
  renderBackground: ({ frame, fps, width, height }: BackgroundRenderProps) => {
    const time = frame / fps
    // Flicker on first appearance
    const flickerPhase = time < 0.3 ? Math.floor(time * 30) % 2 : 0
    const bgOpacity = flickerPhase ? 0.85 : 1

    return (
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: '#0000AA',
          opacity: bgOpacity,
        }}
      >
        {/* BSOD header bar */}
        <div
          style={{
            position: 'absolute',
            top: '8%',
            left: '5%',
            right: '5%',
            background: '#AAAAAA',
            padding: '2px 8px',
            fontFamily: "'Courier New', 'Lucida Console', monospace",
            fontSize: 'clamp(8px, 1.4vw, 14px)',
            color: '#0000AA',
            fontWeight: 700,
          }}
        >
          Windows
        </div>

        {/* BSOD body text lines */}
        <div
          style={{
            position: 'absolute',
            top: '17%',
            left: '5%',
            right: '5%',
          }}
        >
          {BSOD_LINES.map((line, i) => (
            <div
              key={i}
              style={{
                fontFamily: "'Courier New', 'Lucida Console', monospace",
                fontSize: 'clamp(6px, 1.1vw, 11px)',
                color: 'rgba(255,255,255,0.18)',
                whiteSpace: 'pre',
                lineHeight: 1.5,
              }}
            >
              {line || '\u00A0'}
            </div>
          ))}
        </div>

        {/* Scanline overlay for CRT feel */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            backgroundImage:
              'repeating-linear-gradient(0deg, transparent, transparent 1px, rgba(0,0,0,0.08) 1px, rgba(0,0,0,0.08) 2px)',
            pointerEvents: 'none',
          }}
        />
      </div>
    )
  },

  renderWord: ({ word, color, enterProgress, exitProgress, phase, frame }: WordRenderProps) => {
    const f = frame ?? 0

    // Enter: characters scan in left-to-right like BSOD text printing
    const totalChars = word.length
    let displayText = word
    let opacity = 1
    let scaleX = 1

    if (phase === 'enter') {
      const charsVisible = Math.floor(enterProgress * totalChars)
      displayText = word.substring(0, charsVisible)
      opacity = enterProgress > 0.05 ? 1 : 0
    } else if (phase === 'exit') {
      // Screen flash then disappear
      const flashProgress = exitProgress * 2
      if (flashProgress < 1) {
        scaleX = 1 + flashProgress * 0.02
        opacity = 1
      } else {
        opacity = Math.max(0, 1 - (flashProgress - 1) * 3)
      }
    }

    // Blinking underscore cursor in hold phase
    const showCursor = phase === 'hold' && Math.sin(f * 0.18) > 0

    return (
      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: `translate(-50%, -50%) scaleX(${scaleX})`,
          opacity,
          textAlign: 'center',
        }}
      >
        {/* "*** STOP:" prefix */}
        <div
          style={{
            fontFamily: "'Courier New', 'Lucida Console', monospace",
            fontSize: 'clamp(10px, 2vw, 18px)',
            color: 'rgba(255,255,255,0.6)',
            letterSpacing: 2,
            marginBottom: 4,
          }}
        >
          *** STOP: 0x0000000A
        </div>
        {/* Main word */}
        <div
          style={{
            fontFamily: "'Courier New', 'Lucida Console', monospace",
            fontSize: 'clamp(32px, 8vw, 110px)',
            fontWeight: 700,
            color: color,
            whiteSpace: 'nowrap',
            letterSpacing: 3,
          }}
        >
          {displayText}
          {showCursor && (
            <span
              style={{
                display: 'inline-block',
                width: 'clamp(12px, 3vw, 30px)',
                height: 'clamp(28px, 6.5vw, 88px)',
                background: color,
                marginLeft: 2,
                verticalAlign: 'middle',
              }}
            />
          )}
        </div>
      </div>
    )
  },
}

function BlueScreenComponent(props: MotionGraphicProps<BlueScreenConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-blue-screen',
  title: 'Kinetic Blue Screen',
  description:
    'Windows BSOD blue screen of death aesthetic — monospace text scans onto a classic blue background with STOP code header, scanlines, and blinking cursor',
  tags: ['kinetic', 'typography', 'bsod', 'windows', 'error', 'glitch', 'ui', 'digital'],
  category: 'captions',
  component: BlueScreenComponent as any,
  defaultConfig: {
    words: ['CRASHED', 'CORRUPTED', 'RESTARTING', 'PANIC'],
    colors: ['#FFFFFF', '#FFFFFF', '#FFFFFF', '#FFFFFF'],
    bgColor: '#0000AA',
    cycleDuration: 2,
  },
  configSchema: [
    {
      key: 'words',
      label: 'Words',
      type: 'text-array',
      defaultValue: ['CRASHED', 'CORRUPTED', 'RESTARTING', 'PANIC'],
      group: 'Content',
    },
    {
      key: 'colors',
      label: 'Colors',
      type: 'text-array',
      defaultValue: ['#FFFFFF', '#FFFFFF', '#FFFFFF', '#FFFFFF'],
      group: 'Style',
    },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#0000AA', group: 'Style' },
    {
      key: 'cycleDuration',
      label: 'Cycle Duration (s)',
      type: 'number',
      defaultValue: 2,
      min: 0.5,
      max: 5,
      group: 'Timing',
    },
  ],
})
