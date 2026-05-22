import { registerMotionGraphic } from '../registry'
import {
  KineticBase,
  type KineticBaseConfig,
  type KineticAnimation,
  type WordRenderProps,
  type BackgroundRenderProps,
} from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface TimeLapseConfig extends KineticBaseConfig {
  cycleSpeed: number
}

// Deterministic character cycling — simulates rapid time-lapse frame advance
const CYCLE_CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789+-=><#@!?*'

function cycleChar(seed: number, frame: number, speed: number): string {
  const idx = Math.abs(Math.floor(seed * 7.3 + frame * speed)) % CYCLE_CHARS.length
  return CYCLE_CHARS[idx]
}

function easeOutQuart(t: number): number {
  return 1 - Math.pow(1 - t, 4)
}

const animation: KineticAnimation = {
  renderBackground: ({ bgColor, frame, fps }: BackgroundRenderProps) => {
    const time = frame / fps
    // Time-lapse sky gradient that slowly cycles through day progression
    // Daylight band that sweeps across
    const dayProgress = (time * 0.08) % 1
    const sunX = dayProgress * 100

    return (
      <div style={{ position: 'absolute', inset: 0, background: bgColor }}>
        {/* Subtle sweeping gradient simulating time-lapse sky */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: `radial-gradient(ellipse 60% 40% at ${sunX}% 20%, rgba(255,180,50,0.06) 0%, transparent 70%)`,
            pointerEvents: 'none',
          }}
        />
        {/* Horizontal progress bar — time counter aesthetic */}
        <div
          style={{
            position: 'absolute',
            bottom: 16,
            left: '10%',
            right: '10%',
            height: 2,
            background: 'rgba(255,255,255,0.1)',
            borderRadius: 1,
            pointerEvents: 'none',
          }}
        />
        <div
          style={{
            position: 'absolute',
            bottom: 16,
            left: '10%',
            width: `${dayProgress * 80}%`,
            height: 2,
            background: 'rgba(255,180,50,0.5)',
            borderRadius: 1,
            pointerEvents: 'none',
          }}
        />
      </div>
    )
  },

  renderWord: ({ word, color, enterProgress, holdProgress, exitProgress, phase, index, frame }: WordRenderProps) => {
    const f = frame ?? 0
    const seed = index * 137 + 29
    const speed = 3.5

    // Time-lapse: characters cycle through frames rapidly, then "land" on the real character
    // Each character settles at a different time (left to right)
    if (phase === 'enter') {
      const chars = word.split('').map((realChar, ci) => {
        // Each character settles based on its position — left chars settle first
        const settleStart = (ci / word.length) * 0.6
        const charProgress = Math.max(0, Math.min(1, (enterProgress - settleStart) / (1 - settleStart)))
        const eased = easeOutQuart(charProgress)

        if (eased >= 0.98) {
          return (
            <span key={ci} style={{ color, opacity: 1 }}>
              {realChar}
            </span>
          )
        }

        // Rapid character cycling — slows as it approaches final char
        const cycleRate = Math.max(0.5, (1 - eased) * speed)
        const current = charProgress < 0.05
          ? cycleChar(ci * 41 + seed, f, cycleRate)
          : cycleChar(ci * 41 + seed, Math.floor(f * cycleRate), 1)

        const charColor = eased > 0.7 ? color : `rgba(255,200,80,${0.5 + eased * 0.5})`

        return (
          <span
            key={ci}
            style={{
              color: charColor,
              opacity: 0.6 + eased * 0.4,
              display: 'inline-block',
              width: '0.65em',
              textAlign: 'center',
            }}
          >
            {current}
          </span>
        )
      })

      const overallOpacity = Math.min(1, enterProgress * 4)

      return (
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            opacity: overallOpacity,
            fontFamily: "'Courier New', 'Roboto Mono', monospace",
            fontSize: 'clamp(36px, 11vw, 144px)',
            fontWeight: 700,
            whiteSpace: 'nowrap',
            letterSpacing: 3,
          }}
        >
          {chars}
        </div>
      )
    } else if (phase === 'hold') {
      // Stable, with brief re-scramble burst at 70% hold (like a time-jump)
      const reShuffle = holdProgress > 0.65 && holdProgress < 0.72
      const chars = word.split('').map((ch, ci) => {
        if (reShuffle && (ci + Math.floor(holdProgress * 30)) % 3 === 0) {
          return (
            <span key={ci} style={{ color: 'rgba(255,200,80,0.8)' }}>
              {cycleChar(ci * 17 + seed, f, 2)}
            </span>
          )
        }
        return <span key={ci} style={{ color }}>{ch}</span>
      })

      return (
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            opacity: 1,
            fontFamily: "'Courier New', 'Roboto Mono', monospace",
            fontSize: 'clamp(36px, 11vw, 144px)',
            fontWeight: 700,
            whiteSpace: 'nowrap',
            letterSpacing: 3,
          }}
        >
          {chars}
        </div>
      )
    } else {
      // Exit: rapidly scramble all characters then fade
      const chars = word.split('').map((realChar, ci) => {
        const scrambleStart = (ci / word.length) * 0.4
        const charProgress = Math.max(0, (exitProgress - scrambleStart) / (1 - scrambleStart * 0.5))
        if (charProgress > 0.1) {
          return (
            <span key={ci} style={{ color: 'rgba(255,200,80,0.6)', opacity: Math.max(0, 1 - charProgress) }}>
              {cycleChar(ci * 83 + seed, f, speed)}
            </span>
          )
        }
        return <span key={ci} style={{ color }}>{realChar}</span>
      })

      return (
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            opacity: Math.max(0, 1 - exitProgress * 1.5),
            fontFamily: "'Courier New', 'Roboto Mono', monospace",
            fontSize: 'clamp(36px, 11vw, 144px)',
            fontWeight: 700,
            whiteSpace: 'nowrap',
            letterSpacing: 3,
          }}
        >
          {chars}
        </div>
      )
    }
  },
}

function TimeLapseComponent(props: MotionGraphicProps<TimeLapseConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-time-lapse',
  title: 'Kinetic Time Lapse',
  description: 'Characters cycle rapidly through frames before settling — mimics the compressed-time scramble of a time-lapse sequence',
  tags: ['kinetic', 'typography', 'time-lapse', 'film', 'scramble', 'reveal', 'cinematic'],
  category: 'captions',
  component: TimeLapseComponent as any,
  defaultConfig: {
    words: ['TIME', 'LAPSE', 'FLUX', 'RAPID'],
    colors: ['#FFB830', '#FFFFFF', '#FFB830', '#FFFFFF'],
    bgColor: '#080810',
    cycleDuration: 1.5,
    cycleSpeed: 3.5,
  },
  configSchema: [
    { key: 'words', label: 'Words', type: 'text-array', defaultValue: ['TIME', 'LAPSE', 'FLUX', 'RAPID'], group: 'Content' },
    { key: 'colors', label: 'Colors', type: 'text-array', defaultValue: ['#FFB830', '#FFFFFF', '#FFB830', '#FFFFFF'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#080810', group: 'Style' },
    { key: 'cycleDuration', label: 'Cycle Duration (s)', type: 'number', defaultValue: 1.5, min: 0.5, max: 5, group: 'Timing' },
    { key: 'cycleSpeed', label: 'Cycle Speed', type: 'number', defaultValue: 3.5, min: 1, max: 8, group: 'Animation' },
  ],
})
