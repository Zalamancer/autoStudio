import { registerMotionGraphic } from '../registry'
import { KineticBase, type KineticBaseConfig, type KineticAnimation, type WordRenderProps, type BackgroundRenderProps } from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface TerminalPromptConfig extends KineticBaseConfig {
  username: string
  hostname: string
}

// Deterministic output lines shown after command executes
const OUTPUT_LINES = [
  'node v20.11.0',
  'npm v10.2.4',
  'git version 2.43.0',
  'TypeScript 5.4.2',
  'vite v5.1.0',
]

function seeded(n: number) {
  const x = Math.sin(n * 9301 + 49297) * 49297
  return x - Math.floor(x)
}

const animation: KineticAnimation = {
  renderBackground: ({ bgColor, frame, fps }: BackgroundRenderProps) => {
    const time = frame / fps
    // Previous command history lines scrolled up
    const historyLines = [
      { prompt: '$ ', cmd: 'git pull origin main', out: 'Already up to date.' },
      { prompt: '$ ', cmd: 'npm install', out: 'added 847 packages in 12s' },
      { prompt: '$ ', cmd: 'npm run build', out: '✓ built in 1.43s' },
    ]

    return (
      <div style={{ position: 'absolute', inset: 0, background: bgColor }}>
        {/* macOS terminal title bar */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: 30,
            background: 'rgba(255,255,255,0.05)',
            borderBottom: '1px solid rgba(255,255,255,0.08)',
            display: 'flex',
            alignItems: 'center',
            paddingLeft: 12,
            gap: 7,
          }}
        >
          <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#FF5F56' }} />
          <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#FFBD2E' }} />
          <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#27C93F' }} />
          <span
            style={{
              marginLeft: 16,
              fontFamily: "'Courier New', monospace",
              fontSize: 11,
              color: 'rgba(255,255,255,0.3)',
            }}
          >
            zsh — 80x24
          </span>
        </div>

        {/* Command history */}
        {historyLines.map((line, i) => (
          <div key={i} style={{ position: 'absolute', left: 12, top: 40 + i * 32 }}>
            <div
              style={{
                fontFamily: "'Fira Code', 'Courier New', monospace",
                fontSize: 10,
                color: 'rgba(255,255,255,0.12)',
                whiteSpace: 'pre',
              }}
            >
              <span style={{ color: 'rgba(80,220,120,0.2)' }}>~</span>{' '}
              <span style={{ color: 'rgba(200,200,200,0.15)' }}>{line.prompt}{line.cmd}</span>
            </div>
            <div
              style={{
                fontFamily: "'Fira Code', 'Courier New', monospace",
                fontSize: 10,
                color: 'rgba(255,255,255,0.09)',
                paddingLeft: 14,
                whiteSpace: 'pre',
              }}
            >
              {line.out}
            </div>
          </div>
        ))}

        {/* Scanlines */}
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

  renderWord: ({ word, color, enterProgress, holdProgress, exitProgress, phase, index, frame }: WordRenderProps) => {
    const f = frame ?? 0
    const showCursor = Math.floor(f * 0.14) % 2 === 0

    if (phase === 'enter') {
      // Type the command char by char after prompt
      const cmd = `echo "${word}"`
      const charsVisible = Math.floor(enterProgress * (cmd.length + 1))
      const displayCmd = cmd.substring(0, charsVisible)

      return (
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'flex-start',
            gap: 8,
            fontFamily: "'Fira Code', 'Courier New', monospace",
            whiteSpace: 'nowrap',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ color: '#5dfc8d', fontSize: 'clamp(14px, 3.5vw, 42px)', fontWeight: 700 }}>
              user@host
            </span>
            <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: 'clamp(14px, 3.5vw, 42px)' }}>:</span>
            <span style={{ color: '#6ab0f5', fontSize: 'clamp(14px, 3.5vw, 42px)' }}>~</span>
            <span style={{ color: 'rgba(255,255,255,0.6)', fontSize: 'clamp(14px, 3.5vw, 42px)' }}> $</span>
            <span style={{ color: '#f8f8f2', fontSize: 'clamp(14px, 3.5vw, 42px)', fontWeight: 500 }}>
              {' '}{displayCmd}
            </span>
            {charsVisible <= cmd.length && showCursor && (
              <span
                style={{
                  display: 'inline-block',
                  width: 'clamp(8px, 2vw, 22px)',
                  height: 'clamp(16px, 4vw, 44px)',
                  background: color,
                  verticalAlign: 'middle',
                }}
              />
            )}
          </div>
        </div>
      )
    } else if (phase === 'hold') {
      // Command output: the word appears as the output value
      const outputOpacity = Math.min(1, holdProgress * 4)

      return (
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'flex-start',
            gap: 8,
            fontFamily: "'Fira Code', 'Courier New', monospace",
            whiteSpace: 'nowrap',
          }}
        >
          {/* The command line */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ color: '#5dfc8d', fontSize: 'clamp(14px, 3.5vw, 42px)', fontWeight: 700, opacity: 0.6 }}>
              user@host
            </span>
            <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: 'clamp(14px, 3.5vw, 42px)' }}>:</span>
            <span style={{ color: '#6ab0f5', fontSize: 'clamp(14px, 3.5vw, 42px)', opacity: 0.6 }}>~</span>
            <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: 'clamp(14px, 3.5vw, 42px)' }}> $</span>
            <span style={{ color: 'rgba(248,248,242,0.5)', fontSize: 'clamp(14px, 3.5vw, 42px)' }}>
              {' '}echo &quot;{word}&quot;
            </span>
          </div>
          {/* Output line — the word itself */}
          <div
            style={{
              opacity: outputOpacity,
              fontSize: 'clamp(24px, 7vw, 90px)',
              fontWeight: 700,
              color,
              textShadow: `0 0 14px ${color}50`,
              letterSpacing: 2,
            }}
          >
            {word}
          </div>
          {/* New prompt blinking */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, opacity: 0.4 }}>
            <span style={{ color: '#5dfc8d', fontSize: 'clamp(14px, 3.5vw, 42px)', fontWeight: 700 }}>user@host</span>
            <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: 'clamp(14px, 3.5vw, 42px)' }}>:~</span>
            <span style={{ color: 'rgba(255,255,255,0.6)', fontSize: 'clamp(14px, 3.5vw, 42px)' }}> $</span>
            {showCursor && (
              <span
                style={{
                  display: 'inline-block',
                  width: 'clamp(8px, 2vw, 22px)',
                  height: 'clamp(16px, 4vw, 44px)',
                  background: 'rgba(255,255,255,0.5)',
                  verticalAlign: 'middle',
                }}
              />
            )}
          </div>
        </div>
      )
    } else {
      // Exit: scroll up / slide out
      const translateY = -exitProgress * 30
      const opacity = 1 - exitProgress

      return (
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: `translate(-50%, calc(-50% + ${translateY}px))`,
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

function TerminalPromptComponent(props: MotionGraphicProps<TerminalPromptConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-terminal-prompt',
  title: 'Kinetic Terminal Prompt',
  description:
    'macOS/Linux terminal with blinking $ prompt: types echo command, text appears as command output with new prompt ready',
  tags: ['kinetic', 'typography', 'terminal', 'shell', 'bash', 'zsh', 'command', 'developer', 'tech'],
  category: 'captions',
  component: TerminalPromptComponent as any,
  defaultConfig: {
    words: ['SHIPPED', 'DEPLOYED', 'LIVE', 'DONE'],
    colors: ['#5dfc8d', '#6ab0f5', '#ffcc00', '#ff79c6'],
    bgColor: '#1e1e1e',
    cycleDuration: 2.2,
    username: 'user',
    hostname: 'host',
  },
  configSchema: [
    { key: 'words', label: 'Words', type: 'text-array', defaultValue: ['SHIPPED', 'DEPLOYED', 'LIVE', 'DONE'], group: 'Content' },
    { key: 'colors', label: 'Colors', type: 'text-array', defaultValue: ['#5dfc8d', '#6ab0f5', '#ffcc00', '#ff79c6'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#1e1e1e', group: 'Style' },
    { key: 'cycleDuration', label: 'Cycle Duration (s)', type: 'number', defaultValue: 2.2, min: 0.8, max: 6, group: 'Timing' },
    { key: 'username', label: 'Username', type: 'text', defaultValue: 'user', group: 'Content' },
    { key: 'hostname', label: 'Hostname', type: 'text', defaultValue: 'host', group: 'Content' },
  ],
})
