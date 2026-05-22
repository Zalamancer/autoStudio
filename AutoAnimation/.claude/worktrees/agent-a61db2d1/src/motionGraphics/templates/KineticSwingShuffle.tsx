import { registerMotionGraphic } from '../registry'
import {
  KineticBase,
  type KineticBaseConfig,
  type KineticAnimation,
  type WordRenderProps,
  type BackgroundRenderProps,
} from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

// Bounce Patterns 2/4 — Swing Shuffle
// Text sways with a swing/shuffle groove: long-short dotted feel

interface SwingShuffleConfig extends KineticBaseConfig {
  swingAmount: number
}

function easeOutBack(t: number): number {
  const c1 = 1.70158
  const c3 = c1 + 1
  return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2)
}

const animation: KineticAnimation = {
  renderBackground: ({ bgColor, frame, fps }: BackgroundRenderProps) => {
    const t = frame / fps
    // Subtle swing tick marks on bottom
    return (
      <div style={{ position: 'absolute', inset: 0, background: bgColor }}>
        {[0, 1, 2, 3].map((i) => {
          const tickPhase = ((t * 2 + i * 0.25) % 1)
          const active = tickPhase < 0.15
          return (
            <div
              key={i}
              style={{
                position: 'absolute',
                bottom: 24,
                left: `${20 + i * 20}%`,
                width: 4,
                height: active ? 20 : 10,
                borderRadius: 2,
                background: active ? 'rgba(255,255,255,0.6)' : 'rgba(255,255,255,0.15)',
                transition: 'height 0.05s',
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
    width,
  }: WordRenderProps) => {
    let opacity = 1
    let translateX = 0
    let rotate = 0

    if (phase === 'enter') {
      opacity = Math.min(1, enterProgress * 2)
      translateX = (1 - easeOutBack(Math.min(enterProgress, 1))) * -width * 0.3
    } else if (phase === 'hold') {
      opacity = 1
      // Swing shuffle: long beat on 1, short on &
      // Pattern: slow-FAST-slow cycle giving dotted rhythm feel
      const swingCycle = holdProgress * Math.PI * 4
      // Two beats per visual cycle, long-short swing
      const longBeat = Math.sin(swingCycle) // dominant
      const shortBeat = Math.sin(swingCycle * 2) * 0.35 // subdivision
      translateX = (longBeat + shortBeat) * 16
      rotate = (longBeat * 0.6 + shortBeat * 0.3) * 2
    } else {
      opacity = 1 - exitProgress
      translateX = exitProgress * width * 0.25
    }

    return (
      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: `translate(-50%, -50%) translateX(${translateX}px) rotate(${rotate}deg)`,
          opacity,
          fontSize: 'clamp(48px, 12vw, 160px)',
          fontWeight: 900,
          color,
          whiteSpace: 'nowrap',
          fontFamily: "'Georgia', 'Times New Roman', serif",
          fontStyle: 'italic',
          textTransform: 'uppercase',
          letterSpacing: '0.06em',
          textShadow: `2px 2px 0 rgba(0,0,0,0.3), 0 0 30px ${color}50`,
        }}
      >
        {word}
      </div>
    )
  },
}

function SwingShuffleComponent(props: MotionGraphicProps<SwingShuffleConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-swing-shuffle',
  title: 'Kinetic Swing Shuffle',
  description:
    'Text sways with a swing/shuffle groove — long-short dotted rhythm pattern with lateral sway and slight rotation. Jazz and big-band feel.',
  tags: ['kinetic', 'bounce', 'swing', 'shuffle', 'jazz', 'groove', 'rhythm', 'music'],
  category: 'captions',
  component: SwingShuffleComponent as any,
  defaultConfig: {
    words: ['SWING', 'JAZZ', 'GROOVE'],
    colors: ['#F4A261', '#E76F51', '#264653'],
    bgColor: '#0D1B2A',
    cycleDuration: 1.4,
    swingAmount: 16,
  },
  configSchema: [
    { key: 'words', label: 'Words', type: 'text-array', defaultValue: ['SWING', 'JAZZ', 'GROOVE'], group: 'Content' },
    { key: 'colors', label: 'Colors', type: 'text-array', defaultValue: ['#F4A261', '#E76F51', '#264653'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#0D1B2A', group: 'Style' },
    { key: 'cycleDuration', label: 'Cycle Duration (s)', type: 'number', defaultValue: 1.4, min: 0.5, max: 5, group: 'Timing' },
    { key: 'swingAmount', label: 'Swing Amount', type: 'number', defaultValue: 16, min: 4, max: 60, group: 'Animation' },
  ],
})
