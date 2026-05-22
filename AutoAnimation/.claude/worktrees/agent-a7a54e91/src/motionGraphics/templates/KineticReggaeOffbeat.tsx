import { registerMotionGraphic } from '../registry'
import {
  KineticBase,
  type KineticBaseConfig,
  type KineticAnimation,
  type WordRenderProps,
  type BackgroundRenderProps,
} from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

// Genre Beats 4/4 — Reggae Offbeat
// Reggae skank: the guitar/keyboard "chop" hits on beats 2 and 4 (the offbeat)
// Laid-back, behind the beat, sun-drenched feel

interface ReggaeOffbeatConfig extends KineticBaseConfig {
  skankAmount: number
}

function easeOutQuad(t: number): number {
  return 1 - (1 - t) * (1 - t)
}

const animation: KineticAnimation = {
  renderBackground: ({ bgColor, frame, fps }: BackgroundRenderProps) => {
    const t = frame / fps
    // Offbeat: hits on beat 2 and 4 of a 4/4 bar
    // At ~1.5 Hz (beats), offbeat hits at 0.5 and 1.0 phase
    const barFreq = 1.5 // bars per second
    const barPhase = (t * barFreq) % 1
    // Offbeat positions: 0.5 (beat 2) and near 0 after wrap (beat 4)
    const beat2 = barPhase >= 0.48 && barPhase < 0.55 ? (barPhase - 0.48) / 0.07 : 0
    const beat4After = barPhase >= 0.98 || barPhase < 0.02
      ? barPhase >= 0.98 ? (barPhase - 0.98) / 0.02 : (0.02 - barPhase) / 0.02
      : 0
    const skankOn = Math.max(beat2, beat4After)

    return (
      <div style={{ position: 'absolute', inset: 0, background: bgColor }}>
        {/* Warm sunset gradient */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: `linear-gradient(160deg, rgba(255,140,0,0.06) 0%, rgba(0,200,100,0.04) 100%)`,
          }}
        />
        {/* Skank flash: quick bright pulse on offbeat */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: `rgba(255,220,100,${skankOn * 0.12})`,
          }}
        />
        {/* Flag stripe accent at bottom */}
        {['#009B3A', '#FED100', '#FF0000'].map((stripeColor, i) => (
          <div
            key={i}
            style={{
              position: 'absolute',
              bottom: 0,
              left: 0,
              right: 0,
              height: 6,
              top: `${100 - (i + 1) * 2}%`,
              background: stripeColor,
              opacity: 0.25,
            }}
          />
        ))}
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
    let rotate = 0

    if (phase === 'enter') {
      opacity = Math.min(1, enterProgress * 1.8)
      translateY = (1 - easeOutQuad(enterProgress)) * 25
    } else if (phase === 'hold') {
      opacity = 1
      // Reggae offbeat skank: jerk on beat 2 and 4
      const barFreq = 1.5
      const barPhase = (holdProgress * barFreq * 2) % 1
      // Two skank hits per bar (at 0.25 and 0.75)
      const skank1 = barPhase >= 0.22 && barPhase < 0.32
        ? Math.sin((barPhase - 0.22) / 0.1 * Math.PI) : 0
      const skank2 = barPhase >= 0.72 && barPhase < 0.82
        ? Math.sin((barPhase - 0.72) / 0.1 * Math.PI) : 0
      const skank = Math.max(skank1, skank2)

      // Laid-back: slight behind-beat lag on movement
      translateX = skank * 14
      translateY = -skank * 8
      rotate = skank * 2

      // Underlying slow sway (the one-drop feel)
      translateY += Math.sin(holdProgress * Math.PI * 2) * 5
    } else {
      opacity = 1 - exitProgress
      translateY = exitProgress * 20
    }

    return (
      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: `translate(-50%, -50%) translateX(${translateX}px) translateY(${translateY}px) rotate(${rotate}deg)`,
          opacity,
          fontSize: 'clamp(46px, 11vw, 150px)',
          fontWeight: 700,
          color,
          whiteSpace: 'nowrap',
          fontFamily: "'Trebuchet MS', 'Verdana', sans-serif",
          textTransform: 'uppercase',
          letterSpacing: '0.08em',
          textShadow: `3px 3px 0 rgba(0,0,0,0.3), 0 0 40px ${color}40`,
        }}
      >
        {word}
      </div>
    )
  },
}

function ReggaeOffbeatComponent(props: MotionGraphicProps<ReggaeOffbeatConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-reggae-offbeat',
  title: 'Kinetic Reggae Offbeat',
  description:
    'Reggae skank pattern: text jerks on beat 2 and 4 with laid-back swing. Warm sunset glow and flag stripe accent. One-drop groove feel.',
  tags: ['kinetic', 'genre', 'reggae', 'offbeat', 'skank', 'jamaican', 'groove', 'music'],
  category: 'captions',
  component: ReggaeOffbeatComponent as any,
  defaultConfig: {
    words: ['SKANK', 'ONE', 'DROP'],
    colors: ['#FFD700', '#00AA55', '#FF4444'],
    bgColor: '#0A1205',
    cycleDuration: 1.6,
    skankAmount: 14,
  },
  configSchema: [
    { key: 'words', label: 'Words', type: 'text-array', defaultValue: ['SKANK', 'ONE', 'DROP'], group: 'Content' },
    { key: 'colors', label: 'Colors', type: 'text-array', defaultValue: ['#FFD700', '#00AA55', '#FF4444'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#0A1205', group: 'Style' },
    { key: 'cycleDuration', label: 'Cycle Duration (s)', type: 'number', defaultValue: 1.6, min: 0.6, max: 5, group: 'Timing' },
    { key: 'skankAmount', label: 'Skank Amount', type: 'number', defaultValue: 14, min: 4, max: 40, group: 'Animation' },
  ],
})
