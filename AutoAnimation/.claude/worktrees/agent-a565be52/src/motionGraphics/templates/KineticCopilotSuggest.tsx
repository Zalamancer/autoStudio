import { registerMotionGraphic } from '../registry'
import {
  KineticBase,
  type KineticBaseConfig,
  type KineticAnimation,
  type WordRenderProps,
  type BackgroundRenderProps,
} from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface CopilotSuggestConfig extends KineticBaseConfig {}

function easeOutExpo(t: number): number {
  return t === 1 ? 1 : 1 - Math.pow(2, -10 * t)
}

function easeOutBack(t: number): number {
  const c1 = 1.70158
  const c3 = c1 + 1
  return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2)
}

// Simulated code being typed with ghost suggestion
const CODE_LINES = [
  { code: 'function', typed: true },
  { code: '  const result = ', typed: true },
  { code: '  return result', typed: false },
]

const animation: KineticAnimation = {
  renderBackground: ({ bgColor }: BackgroundRenderProps) => (
    <div style={{ position: 'absolute', inset: 0, background: bgColor }}>
      {/* VS Code tab bar */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: 'clamp(18px, 3.5vw, 28px)',
          background: '#252526',
          borderBottom: '1px solid rgba(255,255,255,0.07)',
          display: 'flex',
          alignItems: 'center',
        }}
      >
        {/* Active tab */}
        <div
          style={{
            height: '100%',
            padding: '0 clamp(8px, 1.5vw, 12px)',
            background: bgColor,
            borderRight: '1px solid rgba(255,255,255,0.07)',
            display: 'flex',
            alignItems: 'center',
            gap: 5,
            borderTop: '1px solid #0078D4',
          }}
        >
          <span style={{ fontSize: 'clamp(5px, 0.9vw, 7px)', color: '#4EC9B0' }}>TS</span>
          <span style={{ fontFamily: '"SF Mono", monospace', fontSize: 'clamp(6px, 1vw, 8px)', color: 'rgba(255,255,255,0.7)' }}>
            main.ts
          </span>
        </div>
        {/* Inactive tab */}
        <div
          style={{
            height: '100%',
            padding: '0 clamp(8px, 1.5vw, 12px)',
            background: '#2D2D2D',
            borderRight: '1px solid rgba(255,255,255,0.07)',
            display: 'flex',
            alignItems: 'center',
            gap: 5,
          }}
        >
          <span style={{ fontFamily: '"SF Mono", monospace', fontSize: 'clamp(6px, 1vw, 8px)', color: 'rgba(255,255,255,0.35)' }}>
            utils.ts
          </span>
        </div>
      </div>

      {/* Gutter line numbers */}
      <div
        style={{
          position: 'absolute',
          top: 'clamp(18px, 3.5vw, 28px)',
          left: 0,
          bottom: 0,
          width: 'clamp(18px, 3.5vw, 28px)',
          background: 'rgba(0,0,0,0.2)',
          display: 'flex',
          flexDirection: 'column',
          paddingTop: 'clamp(10px, 2vw, 16px)',
          gap: 'clamp(6px, 1.2vw, 10px)',
          alignItems: 'center',
        }}
      >
        {[1, 2, 3, 4, 5, 6].map((n) => (
          <span
            key={n}
            style={{
              fontFamily: '"SF Mono", monospace',
              fontSize: 'clamp(5px, 0.9vw, 7px)',
              color: 'rgba(255,255,255,0.2)',
            }}
          >
            {n}
          </span>
        ))}
      </div>

      {/* Copilot status bar */}
      <div
        style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          height: 'clamp(14px, 2.8vw, 22px)',
          background: '#0078D4',
          display: 'flex',
          alignItems: 'center',
          paddingLeft: 'clamp(6px, 1.2vw, 10px)',
          gap: 5,
        }}
      >
        <span style={{ fontSize: 'clamp(5px, 0.9vw, 7px)', color: 'rgba(255,255,255,0.9)' }}>⬡</span>
        <span style={{ fontFamily: 'system-ui, sans-serif', fontSize: 'clamp(5px, 0.9vw, 7px)', color: 'rgba(255,255,255,0.8)', fontWeight: 600 }}>
          GitHub Copilot
        </span>
        <span style={{ fontFamily: 'system-ui, sans-serif', fontSize: 'clamp(5px, 0.8vw, 6px)', color: 'rgba(255,255,255,0.5)', marginLeft: 4 }}>
          TypeScript · UTF-8 · LF
        </span>
      </div>
    </div>
  ),

  renderWord: ({ word, color, enterProgress, exitProgress, phase, frame }: WordRenderProps) => {
    const f = frame ?? 0

    // Code lines type in
    const codeAreaX = 'clamp(24px, 5vw, 40px)'
    const codeAreaY = 'clamp(32px, 7vw, 55px)'

    const codeOpacity = Math.min(1, enterProgress * 4) * (phase === 'exit' ? Math.max(0, 1 - exitProgress * 3) : 1)

    // Ghost suggestion appears at enterProgress 0.4
    const ghostP = easeOutExpo(Math.min(1, Math.max(0, (enterProgress - 0.35) / 0.3)))
    const ghostVisible = phase === 'enter' && enterProgress > 0.35 && enterProgress < 0.65
    const ghostOpacity = ghostVisible
      ? Math.min(1, (enterProgress - 0.35) / 0.1) * Math.max(0, 1 - (enterProgress - 0.55) / 0.1)
      : 0

    // Tab key accepts — word materializes
    const wordP = easeOutBack(Math.min(1, Math.max(0, (enterProgress - 0.6) / 0.4)))
    const wordOpacity = phase === 'exit' ? Math.max(0, 1 - exitProgress * 1.5) : Math.min(1, Math.max(0, (enterProgress - 0.55) * 5))
    const pulse = phase === 'hold' ? 1 + Math.sin(f * 0.08) * 0.01 : 1

    // Cursor blink
    const showCursor = phase === 'enter' && Math.sin(f * 0.3) > 0 && enterProgress < 0.65

    return (
      <div style={{ position: 'absolute', inset: 0 }}>
        {/* Code editor content */}
        <div
          style={{
            position: 'absolute',
            top: 'clamp(30px, 6.5vw, 52px)',
            left: 'clamp(28px, 5.5vw, 44px)',
            right: 'clamp(8px, 2vw, 14px)',
            opacity: codeOpacity,
            display: 'flex',
            flexDirection: 'column',
            gap: 'clamp(4px, 0.8vw, 6px)',
          }}
        >
          {/* function keyword line */}
          <div style={{ fontFamily: '"SF Mono", "Fira Code", monospace', fontSize: 'clamp(7px, 1.3vw, 10px)', lineHeight: 1.5 }}>
            <span style={{ color: '#569CD6' }}>function </span>
            <span style={{ color: '#DCDCAA' }}>{word.toLowerCase()}</span>
            <span style={{ color: 'rgba(255,255,255,0.7)' }}>() {'{'}</span>
          </div>
          {/* const line */}
          <div style={{ fontFamily: '"SF Mono", "Fira Code", monospace', fontSize: 'clamp(7px, 1.3vw, 10px)', lineHeight: 1.5, paddingLeft: 'clamp(8px, 1.5vw, 12px)' }}>
            <span style={{ color: '#569CD6' }}>const </span>
            <span style={{ color: '#9CDCFE' }}>result</span>
            <span style={{ color: 'rgba(255,255,255,0.7)' }}> = </span>
            <span style={{ color: '#CE9178' }}>"{word}"</span>
          </div>
          {/* Ghost suggestion line */}
          <div
            style={{
              fontFamily: '"SF Mono", "Fira Code", monospace',
              fontSize: 'clamp(7px, 1.3vw, 10px)',
              lineHeight: 1.5,
              paddingLeft: 'clamp(8px, 1.5vw, 12px)',
              opacity: ghostOpacity,
            }}
          >
            <span style={{ color: 'rgba(255,255,255,0.28)' }}>return result  </span>
            {ghostOpacity > 0 && (
              <span
                style={{
                  background: 'rgba(255,255,255,0.08)',
                  borderRadius: 3,
                  padding: '1px 4px',
                  fontFamily: 'system-ui, sans-serif',
                  fontSize: 'clamp(5px, 0.8vw, 6px)',
                  color: 'rgba(255,255,255,0.35)',
                  border: '1px solid rgba(255,255,255,0.15)',
                  marginLeft: 4,
                }}
              >
                Tab
              </span>
            )}
          </div>
          {/* Close brace */}
          <div style={{ fontFamily: '"SF Mono", "Fira Code", monospace', fontSize: 'clamp(7px, 1.3vw, 10px)', lineHeight: 1.5 }}>
            <span style={{ color: 'rgba(255,255,255,0.7)' }}>{'}'}</span>
            {showCursor && (
              <span
                style={{
                  display: 'inline-block',
                  width: 'clamp(1.5px, 0.3vw, 2px)',
                  height: 'clamp(10px, 1.8vw, 14px)',
                  background: color,
                  marginLeft: 2,
                  verticalAlign: 'middle',
                }}
              />
            )}
          </div>
        </div>

        {/* Main word — accepted Copilot suggestion */}
        <div
          style={{
            position: 'absolute',
            bottom: '14%',
            left: '50%',
            transform: `translateX(-50%) scale(${wordP * pulse})`,
            opacity: wordOpacity,
            textAlign: 'center',
            whiteSpace: 'nowrap',
          }}
        >
          <div
            style={{
              fontFamily: '"SF Mono", "Fira Code", monospace',
              fontSize: 'clamp(32px, 8vw, 110px)',
              fontWeight: 700,
              color,
              textShadow: `0 0 20px ${color}44`,
              letterSpacing: -1,
            }}
          >
            {word}
          </div>
          <div
            style={{
              fontFamily: 'system-ui, sans-serif',
              fontSize: 'clamp(6px, 1.1vw, 9px)',
              color: 'rgba(255,255,255,0.25)',
              marginTop: 4,
              letterSpacing: 2,
            }}
          >
            Copilot suggestion accepted
          </div>
        </div>
      </div>
    )
  },
}

function CopilotSuggestComponent(props: MotionGraphicProps<CopilotSuggestConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-copilot-suggest',
  title: 'Kinetic Copilot Suggest',
  description:
    'GitHub Copilot ghost text suggestion in VS Code — code types in with syntax highlighting, a ghost autocomplete suggestion fades in with a Tab pill, then word snaps in as accepted',
  tags: ['kinetic', 'typography', 'copilot', 'github', 'ai', 'vscode', 'code', 'digital-native', 'tech-culture'],
  category: 'captions',
  component: CopilotSuggestComponent as any,
  defaultConfig: {
    words: ['CODE', 'BUILD', 'DEPLOY', 'SHIP'],
    colors: ['#0078D4', '#4EC9B0', '#569CD6', '#DCDCAA'],
    bgColor: '#1E1E1E',
    cycleDuration: 2.5,
  },
  configSchema: [
    { key: 'words', label: 'Words', type: 'text-array', defaultValue: ['CODE', 'BUILD', 'DEPLOY', 'SHIP'], group: 'Content' },
    { key: 'colors', label: 'Colors', type: 'text-array', defaultValue: ['#0078D4', '#4EC9B0', '#569CD6', '#DCDCAA'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#1E1E1E', group: 'Style' },
    { key: 'cycleDuration', label: 'Cycle Duration (s)', type: 'number', defaultValue: 2.5, min: 0.5, max: 5, group: 'Timing' },
  ],
})
