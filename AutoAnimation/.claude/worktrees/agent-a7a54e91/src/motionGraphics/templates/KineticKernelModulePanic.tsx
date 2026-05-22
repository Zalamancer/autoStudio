import { registerMotionGraphic } from '../registry'
import {
  KineticBase,
  type KineticBaseConfig,
  type KineticAnimation,
  type WordRenderProps,
  type BackgroundRenderProps,
} from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface KernelModulePanicConfig extends KineticBaseConfig {}

function rand(s: number): number {
  const x = Math.sin(s * 127.1 + 311.7) * 43758.5453
  return x - Math.floor(x)
}

// Linux/macOS kernel module panic — dmesg output style
// Module fails to load, oops trace, stack unwind
// Not just code content — any text shown in kernel panic context

const DMESG_LINES = [
  '[  12.441] BUG: unable to handle kernel paging request',
  '[  12.442] IP: module_init+0x0/0x28',
  '[  12.443] Call Trace:',
  '[  12.443]  <IRQ>',
  '[  12.444]  do_softirq+0x82/0x110',
  '[  12.444] Kernel panic - not syncing',
  '[  12.445] ---[ end Kernel panic ]---',
]

const animation: KineticAnimation = {
  renderBackground: ({ bgColor, frame, fps }: BackgroundRenderProps) => {
    const time = frame / fps
    // dmesg scrolling in background
    const scrollOffset = (time * 0.8) % (DMESG_LINES.length * 12)

    return (
      <div style={{ position: 'absolute', inset: 0, background: bgColor }}>
        {/* dmesg output */}
        {DMESG_LINES.map((line, i) => {
          const y = 8 + i * 11 - (scrollOffset % (DMESG_LINES.length * 11))
          const isBug = line.includes('BUG') || line.includes('panic')
          if (y < -12 || y > 100) return null
          return (
            <div
              key={i}
              style={{
                position: 'absolute',
                left: 8,
                top: y,
                fontFamily: "'Courier New', monospace",
                fontSize: 7,
                color: isBug ? 'rgba(255,80,40,0.25)' : 'rgba(100,200,100,0.1)',
                whiteSpace: 'nowrap',
                letterSpacing: 0.3,
              }}
            >
              {line}
            </div>
          )
        })}
        {/* Oops counter */}
        <div
          style={{
            position: 'absolute',
            bottom: 8,
            right: 10,
            fontFamily: "'Courier New', monospace",
            fontSize: 8,
            color: 'rgba(255,80,40,0.25)',
            letterSpacing: 1,
          }}
        >
          Oops: {Math.floor(1 + Math.abs(Math.sin(time * 0.5)) * 7)} general protection
        </div>
        {/* Module load progress */}
        <div
          style={{
            position: 'absolute',
            bottom: 18,
            right: 10,
            fontFamily: "'Courier New', monospace",
            fontSize: 8,
            color: 'rgba(100,200,100,0.15)',
          }}
        >
          modprobe: loading {Math.floor(rand(Math.floor(time)) * 8) + 1}/8 modules
        </div>
      </div>
    )
  },

  renderWord: ({ word, color, enterProgress, holdProgress, exitProgress, phase, index, frame }: WordRenderProps) => {
    const f = frame ?? 0
    const seed = index * 191 + 57
    const chars = word.split('')

    // Kernel module approach: text loads like a kernel module initializing
    // Characters initialize in segments (like module subsystems)
    // On panic: partial init state frozen, then stack unwind

    if (phase === 'enter') {
      // Module init sequence: chars load in 4 subsystem groups
      const groups = 4
      const groupSize = Math.ceil(chars.length / groups)

      return (
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            fontFamily: "'Courier New', monospace",
            fontSize: 'clamp(36px, 10vw, 150px)',
            fontWeight: 700,
            whiteSpace: 'nowrap',
            letterSpacing: 3,
            display: 'flex',
          }}
        >
          {chars.map((ch, ci) => {
            const group = Math.floor(ci / groupSize)
            const groupStart = (group / groups) * 0.8
            const charProgress = Math.max(0, Math.min(1, (enterProgress - groupStart) / 0.2))
            // Init flash: brief bright flash as module subsystem loads
            const initFlash = charProgress > 0.1 && charProgress < 0.3

            return (
              <span
                key={ci}
                style={{
                  display: 'inline-block',
                  color: initFlash ? '#AAFFAA' : color,
                  opacity: charProgress,
                  textShadow: initFlash ? '0 0 12px #AAFFAA' : 'none',
                }}
              >
                {charProgress > 0 && charProgress < 0.15
                  ? '_' // cursor during init
                  : ch}
              </span>
            )
          })}
        </div>
      )
    }

    if (phase === 'hold') {
      // Random oops: one subsystem panics momentarily
      const oopsMoment = holdProgress > 0.5 && holdProgress < 0.56
      const oopsGroup = Math.floor(rand(seed + Math.floor(holdProgress * 10)) * 4)
      const groupSize = Math.ceil(chars.length / 4)

      return (
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            fontFamily: "'Courier New', monospace",
            fontSize: 'clamp(36px, 10vw, 150px)',
            fontWeight: 700,
            whiteSpace: 'nowrap',
            letterSpacing: 3,
            display: 'flex',
          }}
        >
          {chars.map((ch, ci) => {
            const group = Math.floor(ci / groupSize)
            const oopsing = oopsMoment && group === oopsGroup
            return (
              <span
                key={ci}
                style={{
                  display: 'inline-block',
                  color: oopsing ? '#FF5533' : color,
                  textShadow: oopsing
                    ? '0 0 10px #FF5533'
                    : `0 0 6px ${color}40`,
                  opacity: oopsing ? 0.6 + Math.sin(f * 0.8) * 0.4 : 1,
                }}
              >
                {ch}
              </span>
            )
          })}
        </div>
      )
    }

    // Exit: stack unwind — chars unload in reverse order (LIFO)
    return (
      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          fontFamily: "'Courier New', monospace",
          fontSize: 'clamp(36px, 10vw, 150px)',
          fontWeight: 700,
          whiteSpace: 'nowrap',
          letterSpacing: 3,
          display: 'flex',
        }}
      >
        {chars.map((ch, ci) => {
          // Unwind from right to left (stack order)
          const unwindAt = ((chars.length - 1 - ci) / chars.length) * 0.8
          const unwound = exitProgress > unwindAt
          return (
            <span
              key={ci}
              style={{
                display: 'inline-block',
                color,
                opacity: unwound ? 0 : 1,
                transform: unwound ? 'translateY(-8px)' : 'none',
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

function KernelModulePanicComponent(props: MotionGraphicProps<KernelModulePanicConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-kernel-module-panic',
  title: 'Kinetic Kernel Module Panic',
  description: 'Linux kernel module panic — text initializes in subsystem groups with dmesg output, oops flash, and stack-unwind exit sequence',
  tags: ['kinetic', 'typography', 'glitch', 'os', 'linux', 'kernel', 'panic', 'dmesg', 'digital'],
  category: 'captions',
  component: KernelModulePanicComponent as any,
  defaultConfig: {
    words: ['KERNEL', 'OOPS', 'PANIC', 'UNLOAD'],
    colors: ['#88FF44', '#66EE22', '#AAFF66', '#77FF33'],
    bgColor: '#000a00',
    cycleDuration: 1.5,
  },
  configSchema: [
    { key: 'words', label: 'Words', type: 'text-array', defaultValue: ['KERNEL', 'OOPS', 'PANIC', 'UNLOAD'], group: 'Content' },
    { key: 'colors', label: 'Colors', type: 'text-array', defaultValue: ['#88FF44', '#66EE22', '#AAFF66', '#77FF33'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#000a00', group: 'Style' },
    { key: 'cycleDuration', label: 'Cycle Duration (s)', type: 'number', defaultValue: 1.5, min: 0.3, max: 5, group: 'Timing' },
  ],
})
