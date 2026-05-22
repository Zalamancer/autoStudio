import { registerMotionGraphic } from '../registry'
import {
  KineticBase,
  type KineticBaseConfig,
  type KineticAnimation,
  type WordRenderProps,
  type BackgroundRenderProps,
} from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface ForceQuitSpinConfig extends KineticBaseConfig {}

function rand(s: number): number {
  const x = Math.sin(s * 127.1 + 311.7) * 43758.5453
  return x - Math.floor(x)
}

// Force Quit dialog + kill signal aesthetic
// SIGKILL sent: process terminates mid-render
// Text "killed" mid-display with a force-quit dialog overlay

const PROCESSES = [
  'Safari (Not Responding)',
  'Slack — unresponsive',
  'Finder (spinning)',
  'Chrome Helper',
  'App — hung',
]

const animation: KineticAnimation = {
  renderBackground: ({ bgColor, frame, fps, width }: BackgroundRenderProps) => {
    const time = frame / fps
    const w = width ?? 400

    // Force Quit Applications dialog
    const dialogW = Math.min(w * 0.9, 320)

    // Process list: each line flickers depending on hang state
    return (
      <div style={{ position: 'absolute', inset: 0, background: bgColor }}>
        {/* Dialog chrome */}
        <div
          style={{
            position: 'absolute',
            top: '60%',
            left: '50%',
            transform: 'translate(-50%, -10%)',
            width: dialogW,
            background: 'rgba(30,32,40,0.6)',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: 10,
            padding: '10px 0 8px',
            opacity: 0.5,
          }}
        >
          <div
            style={{
              textAlign: 'center',
              fontFamily: '-apple-system, "Helvetica", sans-serif',
              fontSize: 10,
              color: 'rgba(255,255,255,0.5)',
              marginBottom: 8,
              letterSpacing: 0.3,
            }}
          >
            Force Quit Applications
          </div>
          {PROCESSES.map((proc, i) => {
            const isHung =
              proc.includes('Not Responding') ||
              proc.includes('unresponsive') ||
              proc.includes('spinning') ||
              proc.includes('hung')
            return (
              <div
                key={i}
                style={{
                  padding: '3px 12px',
                  fontFamily: '-apple-system, "Helvetica", sans-serif',
                  fontSize: 9,
                  color: isHung ? 'rgba(255,80,80,0.5)' : 'rgba(220,220,220,0.3)',
                  display: 'flex',
                  justifyContent: 'space-between',
                }}
              >
                <span>{proc}</span>
                {isHung && <span style={{ color: 'rgba(255,60,60,0.6)' }}>●</span>}
              </div>
            )
          })}
          <div
            style={{
              margin: '6px 12px 0',
              height: 22,
              background: 'rgba(255,60,60,0.2)',
              borderRadius: 5,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontFamily: '-apple-system, sans-serif',
              fontSize: 9,
              color: 'rgba(255,100,100,0.6)',
            }}
          >
            Force Quit
          </div>
        </div>
        {/* Kill signal indicator */}
        <div
          style={{
            position: 'absolute',
            top: 10,
            right: 12,
            fontFamily: "'Courier New', monospace",
            fontSize: 8,
            color: 'rgba(255,80,80,0.25)',
            letterSpacing: 1,
          }}
        >
          SIGKILL → PID {Math.floor(1000 + rand(Math.floor(time * 0.5)) * 8000)}
        </div>
      </div>
    )
  },

  renderWord: ({ word, color, enterProgress, holdProgress, exitProgress, phase, index }: WordRenderProps) => {
    const seed = index * 157 + 43
    const chars = word.split('')

    // Force quit: process killed mid-render — each character gets "SIGKILL"ed at a random point
    // Chars that are killed: sharp cut off, no fade

    if (phase === 'enter') {
      // Characters boot up one by one (process starting up)
      return (
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            fontFamily: "'Arial Black', 'Impact', sans-serif",
            fontSize: 'clamp(40px, 11vw, 160px)',
            fontWeight: 900,
            whiteSpace: 'nowrap',
            letterSpacing: 2,
            display: 'flex',
          }}
        >
          {chars.map((ch, ci) => {
            const startAt = (ci / chars.length) * 0.7
            const charProgress = Math.max(0, Math.min(1, (enterProgress - startAt) / 0.3))
            return (
              <span
                key={ci}
                style={{
                  display: 'inline-block',
                  color,
                  opacity: charProgress,
                  transform: `translateY(${(1 - charProgress) * -10}px)`,
                }}
              >
                {ch}
              </span>
            )
          })}
        </div>
      )
    }

    if (phase === 'hold') {
      // Spin: one char randomly chosen and "force-quitting" (spinning)
      const spinChar = Math.floor(rand(seed + Math.floor(holdProgress * 5)) * chars.length)
      const spinAngle = (holdProgress * 720) % 360

      return (
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            fontFamily: "'Arial Black', 'Impact', sans-serif",
            fontSize: 'clamp(40px, 11vw, 160px)',
            fontWeight: 900,
            whiteSpace: 'nowrap',
            letterSpacing: 2,
            display: 'flex',
          }}
        >
          {chars.map((ch, ci) => (
            <span
              key={ci}
              style={{
                display: 'inline-block',
                color: ci === spinChar ? '#FF4444' : color,
                transform: ci === spinChar ? `rotate(${spinAngle}deg)` : 'none',
                opacity: ci === spinChar ? 0.7 + Math.sin(holdProgress * Math.PI * 6) * 0.3 : 1,
                textShadow: `0 0 8px ${color}50`,
              }}
            >
              {ch}
            </span>
          ))}
        </div>
      )
    }

    // Exit: SIGKILL — chars disappear instantly at their kill point
    const killProgress = exitProgress
    return (
      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          fontFamily: "'Arial Black', 'Impact', sans-serif",
          fontSize: 'clamp(40px, 11vw, 160px)',
          fontWeight: 900,
          whiteSpace: 'nowrap',
          letterSpacing: 2,
          display: 'flex',
        }}
      >
        {chars.map((ch, ci) => {
          const killAt = rand(seed + ci * 29) * 0.8
          const killed = killProgress > killAt
          return (
            <span
              key={ci}
              style={{
                display: 'inline-block',
                color,
                opacity: killed ? 0 : 1, // SIGKILL = no graceful fade
                transform: killed ? 'scaleX(0)' : 'none',
                transition: 'none',
              }}
            >
              {ch}
            </span>
          )
        })}
      </div>
    )
  },
}

function ForceQuitSpinComponent(props: MotionGraphicProps<ForceQuitSpinConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-force-quit-spin',
  title: 'Kinetic Force Quit Spin',
  description:
    'macOS Force Quit dialog — chars killed by SIGKILL mid-display with spinning beach ball character, process list, and abrupt termination exit',
  tags: ['kinetic', 'typography', 'glitch', 'os', 'macos', 'force-quit', 'sigkill', 'digital', 'software'],
  category: 'captions',
  component: ForceQuitSpinComponent as any,
  defaultConfig: {
    words: ['KILLED', 'SIGKILL', 'HUNG', 'CRASH'],
    colors: ['#FF4444', '#FF6666', '#FF4444', '#FF7777'],
    bgColor: '#0e0000',
    cycleDuration: 1.5,
  },
  configSchema: [
    {
      key: 'words',
      label: 'Words',
      type: 'text-array',
      defaultValue: ['KILLED', 'SIGKILL', 'HUNG', 'CRASH'],
      group: 'Content',
    },
    {
      key: 'colors',
      label: 'Colors',
      type: 'text-array',
      defaultValue: ['#FF4444', '#FF6666', '#FF4444', '#FF7777'],
      group: 'Style',
    },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#0e0000', group: 'Style' },
    {
      key: 'cycleDuration',
      label: 'Cycle Duration (s)',
      type: 'number',
      defaultValue: 1.5,
      min: 0.3,
      max: 5,
      group: 'Timing',
    },
  ],
})
