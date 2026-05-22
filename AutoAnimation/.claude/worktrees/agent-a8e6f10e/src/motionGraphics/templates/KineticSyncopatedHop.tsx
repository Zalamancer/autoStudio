import { registerMotionGraphic } from '../registry'
import {
  KineticBase,
  type KineticBaseConfig,
  type KineticAnimation,
  type WordRenderProps,
  type BackgroundRenderProps,
} from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

// Bounce Patterns 4/4 — Syncopated Hop
// Hits on the OFF-beat (the "and"s), creating a funky, unexpected rhythm

interface SyncopatedHopConfig extends KineticBaseConfig {
  hopHeight: number
}

function springElastic(t: number): number {
  if (t <= 0) return 0
  if (t >= 1) return 1
  const p = 0.3
  return Math.pow(2, -10 * t) * Math.sin(((t - p / 4) * 2 * Math.PI) / p) + 1
}

const animation: KineticAnimation = {
  renderBackground: ({ bgColor, frame, fps }: BackgroundRenderProps) => {
    const t = frame / fps
    // Off-beat accent lines — appear on the &
    return (
      <div style={{ position: 'absolute', inset: 0, background: bgColor }}>
        {[0, 1].map((i) => {
          // Syncopated: phase shifted by 0.5 (the "and")
          const phase = ((t * 2 + i * 0.5 + 0.5) % 1)
          const active = phase < 0.12
          return (
            <div
              key={i}
              style={{
                position: 'absolute',
                top: 0,
                bottom: 0,
                left: `${30 + i * 40}%`,
                width: active ? 2 : 1,
                background: active
                  ? 'rgba(255,255,255,0.35)'
                  : 'rgba(255,255,255,0.06)',
                transition: 'all 0.05s',
              }}
            />
          )
        })}
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
    height,
    width,
  }: WordRenderProps) => {
    let opacity = 1
    let translateY = 0
    let translateX = 0
    let rotate = 0

    if (phase === 'enter') {
      opacity = Math.min(1, enterProgress * 2.5)
      translateX = (1 - springElastic(enterProgress)) * -width * 0.2
    } else if (phase === 'hold') {
      opacity = 1
      // Syncopated: 2 hops but offset by half a beat
      // Result: hop on beat 1.5 and 2.5 (the "ands")
      const t = holdProgress * Math.PI * 4 + Math.PI / 2 // phase-shifted by 0.5 beat
      const rawSin = Math.sin(t)
      // Only go UP on the positive phase (syncopated accent)
      const hop = rawSin > 0 ? rawSin : rawSin * 0.15 // small dip on downbeat
      translateY = -hop * 20
      rotate = hop * 1.5 // slight tilt on accent
    } else {
      opacity = 1 - exitProgress
      translateY = exitProgress * height * 0.2
    }

    return (
      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: `translate(-50%, -50%) translateY(${translateY}px) translateX(${translateX}px) rotate(${rotate}deg)`,
          opacity,
          fontSize: 'clamp(48px, 12vw, 160px)',
          fontWeight: 900,
          color,
          whiteSpace: 'nowrap',
          fontFamily: "'Trebuchet MS', 'Verdana', sans-serif",
          textTransform: 'uppercase',
          letterSpacing: '0.07em',
          textShadow: `3px 0 0 ${color}40, -3px 0 0 ${color}40, 0 4px 20px rgba(0,0,0,0.4)`,
        }}
      >
        {word}
      </div>
    )
  },
}

function SyncopatedHopComponent(props: MotionGraphicProps<SyncopatedHopConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-syncopated-hop',
  title: 'Kinetic Syncopated Hop',
  description:
    'Text hops on the off-beat (the "and" of each bar) creating a funky, syncopated groove. Unexpected rhythm that catches the ear.',
  tags: ['kinetic', 'bounce', 'syncopated', 'offbeat', 'funk', 'groove', 'rhythm', 'music'],
  category: 'captions',
  component: SyncopatedHopComponent as any,
  defaultConfig: {
    words: ['FUNK', 'OFF', 'BEAT', 'GROOVE'],
    colors: ['#FF9F1C', '#FFBF69', '#CBF3F0', '#2EC4B6'],
    bgColor: '#1A1A2E',
    cycleDuration: 1.0,
    hopHeight: 20,
  },
  configSchema: [
    { key: 'words', label: 'Words', type: 'text-array', defaultValue: ['FUNK', 'OFF', 'BEAT', 'GROOVE'], group: 'Content' },
    { key: 'colors', label: 'Colors', type: 'text-array', defaultValue: ['#FF9F1C', '#FFBF69', '#CBF3F0', '#2EC4B6'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#1A1A2E', group: 'Style' },
    { key: 'cycleDuration', label: 'Cycle Duration (s)', type: 'number', defaultValue: 1.0, min: 0.3, max: 4, group: 'Timing' },
    { key: 'hopHeight', label: 'Hop Height', type: 'number', defaultValue: 20, min: 4, max: 60, group: 'Animation' },
  ],
})
