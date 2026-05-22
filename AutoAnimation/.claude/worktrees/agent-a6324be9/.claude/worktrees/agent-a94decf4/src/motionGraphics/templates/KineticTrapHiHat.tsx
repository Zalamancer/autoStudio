import { registerMotionGraphic } from '../registry'
import {
  KineticBase,
  type KineticBaseConfig,
  type KineticAnimation,
  type WordRenderProps,
  type BackgroundRenderProps,
} from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

// Genre Beats 3/4 — Trap Hi-Hat Roll
// Trap music: rapid hi-hat rolls with 16th note stuttering, pitched-up feel

interface TrapHiHatConfig extends KineticBaseConfig {
  rollSpeed: number
}

const animation: KineticAnimation = {
  renderBackground: ({ bgColor, frame, fps }: BackgroundRenderProps) => {
    const t = frame / fps

    // Trap hi-hat: rapid 16th notes at high frequency (~8 per second)
    const hatFreq = 8.0
    const hatPhase = (t * hatFreq) % 1
    const hatOn = hatPhase < 0.06 ? (1 - hatPhase / 0.06) : 0

    // Accent on every 4th (quarter note)
    const accentFreq = 2.0
    const accentPhase = (t * accentFreq) % 1
    const accentOn = accentPhase < 0.1 ? (1 - accentPhase / 0.1) : 0

    return (
      <div style={{ position: 'absolute', inset: 0, background: bgColor }}>
        {/* Hi-hat flash */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: `rgba(200,230,255,${hatOn * 0.08 + accentOn * 0.12})`,
          }}
        />
        {/* Rolling hi-hat dots across top */}
        <div
          style={{
            position: 'absolute',
            top: 20,
            left: 0,
            right: 0,
            display: 'flex',
            justifyContent: 'center',
            gap: 6,
          }}
        >
          {Array.from({ length: 16 }, (_, i) => {
            // Each dot represents a 16th note slot
            const activeNote = Math.floor((t * hatFreq) % 16)
            const isActive = i === activeNote || i === (activeNote - 1 + 16) % 16
            const isAccent = i % 4 === 0
            return (
              <div
                key={i}
                style={{
                  width: isAccent ? 10 : 6,
                  height: isAccent ? 10 : 6,
                  borderRadius: '50%',
                  background: isActive
                    ? (isAccent ? '#FFFFFF' : 'rgba(200,230,255,0.8)')
                    : (isAccent ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.08)'),
                  transition: 'all 0.03s',
                }}
              />
            )
          })}
        </div>
      </div>
    )
  },

  renderWord: ({
    word,
    color,
    enterProgress,
    holdProgress,
    exitProgress,
    phase,
  }: WordRenderProps) => {
    let opacity = 1
    let translateX = 0
    let translateY = 0
    let scale = 1

    if (phase === 'enter') {
      opacity = Math.min(1, enterProgress * 3)
      translateY = (1 - enterProgress) * -20
    } else if (phase === 'hold') {
      opacity = 1
      // Trap hi-hat stutter: rapid micro-jitter on 16th note grid
      const hatFreq = 8.0
      const hatPhase = (holdProgress * hatFreq * 2) % 1
      const hatHit = hatPhase < 0.06 ? 1 : 0

      // Accent (quarter note)
      const accentFreq = 2.0
      const accentPhase = (holdProgress * accentFreq * 2) % 1
      const accent = accentPhase < 0.1 ? (1 - accentPhase / 0.1) : 0

      // Stutter: tiny random position shifts on each hat hit
      translateX = hatHit * (Math.sin(holdProgress * 999) > 0 ? 3 : -3)
      translateY = hatHit * -4 + accent * -6
      scale = 1 + accent * 0.04 + hatHit * 0.02
    } else {
      opacity = 1 - exitProgress
      translateY = exitProgress * 15
    }

    return (
      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: `translate(-50%, -50%) translateX(${translateX}px) translateY(${translateY}px) scale(${scale})`,
          opacity,
          fontSize: 'clamp(50px, 13vw, 170px)',
          fontWeight: 900,
          color,
          whiteSpace: 'nowrap',
          fontFamily: "'Arial Black', 'Helvetica Neue', sans-serif",
          textTransform: 'uppercase',
          letterSpacing: '0.03em',
          textShadow: `
            0 0 20px ${color}80,
            2px 2px 0 rgba(0,0,0,0.5)
          `,
        }}
      >
        {word}
      </div>
    )
  },
}

function TrapHiHatComponent(props: MotionGraphicProps<TrapHiHatConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-trap-hi-hat',
  title: 'Kinetic Trap Hi-Hat',
  description:
    'Trap music hi-hat roll: rapid 16th note grid with visual dot sequencer at top, micro-stutter jitter on each hat hit, quarter note accents.',
  tags: ['kinetic', 'genre', 'trap', 'hi-hat', 'hiphop', 'stutter', '16th', 'beat', 'music'],
  category: 'captions',
  component: TrapHiHatComponent as any,
  defaultConfig: {
    words: ['TRAP', 'ROLL', 'DRILL'],
    colors: ['#E8E8FF', '#C8C8FF', '#A8A8EE'],
    bgColor: '#060608',
    cycleDuration: 1.0,
    rollSpeed: 8,
  },
  configSchema: [
    { key: 'words', label: 'Words', type: 'text-array', defaultValue: ['TRAP', 'ROLL', 'DRILL'], group: 'Content' },
    { key: 'colors', label: 'Colors', type: 'text-array', defaultValue: ['#E8E8FF', '#C8C8FF', '#A8A8EE'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#060608', group: 'Style' },
    { key: 'cycleDuration', label: 'Cycle Duration (s)', type: 'number', defaultValue: 1.0, min: 0.4, max: 3, group: 'Timing' },
    { key: 'rollSpeed', label: 'Roll Speed', type: 'number', defaultValue: 8, min: 4, max: 16, group: 'Animation' },
  ],
})
