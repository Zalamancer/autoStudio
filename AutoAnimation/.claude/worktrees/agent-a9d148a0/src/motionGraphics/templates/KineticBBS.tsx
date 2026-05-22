import { registerMotionGraphic } from '../registry'
import {
  KineticBase,
  type KineticBaseConfig,
  type KineticAnimation,
  type WordRenderProps,
  type BackgroundRenderProps,
} from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface BBSConfig extends KineticBaseConfig {}

// ANSI color palette used by BBS terminals
const ANSI_COLORS = [
  '#FF5555', // bright red
  '#55FF55', // bright green
  '#FFFF55', // bright yellow
  '#5555FF', // bright blue
  '#FF55FF', // bright magenta
  '#55FFFF', // bright cyan
  '#FFFFFF', // bright white
]

const BBS_HEADER = [
  '  ______  ______  ______',
  ' |  ___ \\|  ___ \\|  ____|',
  ' | |___) | |___) | (____',
  ' |  ___ <|  ___ < \\____ \\',
  ' | |___) | |___) |____) |',
  ' |______/|______/|______/',
]

const animation: KineticAnimation = {
  renderBackground: ({ bgColor, width, height, frame, fps }: BackgroundRenderProps) => {
    const time = frame / fps

    // Connection status line
    const baud = [300, 1200, 2400, 9600, 14400, 28800]
    const baudIdx = Math.floor(time * 0.5) % baud.length
    const connectionStr = `CONNECT ${baud[baudIdx]} - NO CARRIER DETECT`

    return (
      <div style={{ position: 'absolute', inset: 0, background: bgColor }}>
        {/* BBS ASCII art header */}
        {BBS_HEADER.map((line, i) => (
          <div
            key={i}
            style={{
              position: 'absolute',
              left: 12,
              top: 8 + i * 13,
              fontFamily: "'Courier New', monospace",
              fontSize: 9,
              color: ANSI_COLORS[i % ANSI_COLORS.length],
              opacity: 0.12,
              whiteSpace: 'pre',
              letterSpacing: 0,
            }}
          >
            {line}
          </div>
        ))}

        {/* Connection status bar */}
        <div
          style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            height: 22,
            background: '#333333',
            display: 'flex',
            alignItems: 'center',
            paddingLeft: 10,
            paddingRight: 10,
            justifyContent: 'space-between',
          }}
        >
          <span
            style={{
              fontFamily: "'Courier New', monospace",
              fontSize: 10,
              color: '#55FF55',
              letterSpacing: 1,
            }}
          >
            {connectionStr}
          </span>
          <span
            style={{
              fontFamily: "'Courier New', monospace",
              fontSize: 10,
              color: '#FFFF55',
            }}
          >
            ALT-H Help
          </span>
        </div>

        {/* ANSI decorative side borders */}
        {Array.from({ length: 10 }, (_, i) => {
          const y = 100 + i * 24
          const colorIdx = (i + Math.floor(time * 3)) % ANSI_COLORS.length
          return (
            <div key={`border-${i}`}>
              <div
                style={{
                  position: 'absolute',
                  left: 6,
                  top: y,
                  fontFamily: "'Courier New', monospace",
                  fontSize: 14,
                  color: ANSI_COLORS[colorIdx],
                  opacity: 0.15,
                }}
              >
                {'\u2551'}
              </div>
              <div
                style={{
                  position: 'absolute',
                  right: 6,
                  top: y,
                  fontFamily: "'Courier New', monospace",
                  fontSize: 14,
                  color: ANSI_COLORS[colorIdx],
                  opacity: 0.15,
                }}
              >
                {'\u2551'}
              </div>
            </div>
          )
        })}

        {/* Phosphor glow */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: 'radial-gradient(ellipse at center, transparent 50%, rgba(0,0,0,0.5) 100%)',
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

  renderWord: ({ word, color, enterProgress, holdProgress, exitProgress, phase, frame, index }: WordRenderProps) => {
    const f = frame ?? 0

    if (phase === 'enter') {
      // Modem transfer effect: characters appear with ANSI color cycling
      const totalChars = word.length
      const charsToShow = Math.floor(enterProgress * (totalChars + 1))

      const chars = word.split('').map((ch, ci) => {
        if (ci >= charsToShow) return null
        // New chars flash through ANSI colors before settling
        const isSettled = ci < charsToShow - 1
        const charColor = isSettled ? color : ANSI_COLORS[(f + ci) % ANSI_COLORS.length]
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
            fontFamily: "'Courier New', 'Lucida Console', monospace",
            fontSize: 'clamp(36px, 10vw, 140px)',
            fontWeight: 700,
            whiteSpace: 'nowrap',
            letterSpacing: 4,
            textShadow: `0 0 8px ${color}40`,
          }}
        >
          <span style={{ color: '#FFFF55', opacity: 0.6, marginRight: 8 }}>{'>'}</span>
          {chars}
          {/* Blinking download cursor */}
          <span
            style={{
              display: 'inline-block',
              width: 'clamp(10px, 2vw, 22px)',
              height: 'clamp(26px, 6vw, 80px)',
              background: Math.sin(f * 0.2) > 0 ? color : 'transparent',
              marginLeft: 4,
              verticalAlign: 'middle',
            }}
          />
        </div>
      )
    } else if (phase === 'hold') {
      // ANSI rainbow effect: each character cycles colors at different offsets
      const chars = word.split('').map((ch, ci) => {
        const colorIdx = (Math.floor(f * 0.06) + ci) % ANSI_COLORS.length
        return (
          <span key={ci} style={{ color: ANSI_COLORS[colorIdx] }}>
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
            fontFamily: "'Courier New', 'Lucida Console', monospace",
            fontSize: 'clamp(36px, 10vw, 140px)',
            fontWeight: 700,
            whiteSpace: 'nowrap',
            letterSpacing: 4,
            textShadow: `0 0 10px ${color}30`,
          }}
        >
          <span style={{ color: '#FFFF55', opacity: 0.6, marginRight: 8 }}>{'>'}</span>
          {chars}
        </div>
      )
    } else {
      // Exit: characters dissolve with "NO CARRIER" disconnect effect
      const totalChars = word.length
      const charsRemaining = Math.max(0, totalChars - Math.floor(exitProgress * (totalChars + 1)))

      const chars = word.split('').map((ch, ci) => {
        if (ci >= charsRemaining) {
          // Replace with random garble characters
          const garble = ['@', '#', '%', '&', '?', '!', '~']
          const garbleChar = garble[(f + ci) % garble.length]
          return (
            <span key={ci} style={{ color: '#FF5555', opacity: 0.4 }}>
              {garbleChar}
            </span>
          )
        }
        return (
          <span key={ci} style={{ color, opacity: 1 - exitProgress * 0.3 }}>
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
            opacity: 1 - exitProgress * 0.5,
            fontFamily: "'Courier New', 'Lucida Console', monospace",
            fontSize: 'clamp(36px, 10vw, 140px)',
            fontWeight: 700,
            whiteSpace: 'nowrap',
            letterSpacing: 4,
          }}
        >
          <span style={{ color: '#FFFF55', opacity: 0.6, marginRight: 8 }}>{'>'}</span>
          {chars}
        </div>
      )
    }
  },
}

function BBSComponent(props: MotionGraphicProps<BBSConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-bbs',
  title: 'Kinetic BBS',
  description:
    'BBS/ANSI art terminal with modem transfer typing, rainbow ANSI color cycling, connection status bar, and NO CARRIER disconnect exit',
  tags: ['kinetic', 'typography', 'bbs', 'ansi', 'modem', 'retro', 'terminal', 'computing'],
  category: 'captions',
  component: BBSComponent as any,
  defaultConfig: {
    words: ['SYSOP', 'LOGIN', 'FILES', 'DOORS'],
    colors: ['#55FFFF', '#55FF55', '#FF55FF', '#FFFF55'],
    bgColor: '#000000',
    cycleDuration: 1.5,
  },
  configSchema: [
    {
      key: 'words',
      label: 'Words',
      type: 'text-array',
      defaultValue: ['SYSOP', 'LOGIN', 'FILES', 'DOORS'],
      group: 'Content',
    },
    {
      key: 'colors',
      label: 'Colors',
      type: 'text-array',
      defaultValue: ['#55FFFF', '#55FF55', '#FF55FF', '#FFFF55'],
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
