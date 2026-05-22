import { registerMotionGraphic } from '../registry'
import {
  KineticBase,
  type KineticBaseConfig,
  type KineticAnimation,
  type WordRenderProps,
  type BackgroundRenderProps,
} from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

// Scale Pulse 1/4 — Sub-Bass Throb
// Deep, slow sub-bass throb: large amplitude low-frequency scale pulse

interface SubBassThrob extends KineticBaseConfig {
  throbbingAmount: number
}

function easeInOutSine(t: number): number {
  return -(Math.cos(Math.PI * t) - 1) / 2
}

const animation: KineticAnimation = {
  renderBackground: ({ bgColor, frame, fps }: BackgroundRenderProps) => {
    const t = frame / fps
    // Sub-bass: slow, deep, ~0.5Hz throb
    const freq = 0.5
    const throb = (Math.sin(t * freq * 2 * Math.PI) + 1) / 2
    const glow = throb * 0.25

    return (
      <div style={{ position: 'absolute', inset: 0, background: bgColor }}>
        {/* Deep ground glow */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: `radial-gradient(ellipse 80% 40% at 50% 100%,
              rgba(80,0,180,${glow}) 0%,
              transparent 70%)`,
          }}
        />
        {/* Floor pressure ripple */}
        <div
          style={{
            position: 'absolute',
            bottom: 0,
            left: '50%',
            transform: `translate(-50%, 0) scaleX(${0.4 + throb * 0.6}) scaleY(${throb})`,
            width: '100%',
            height: 80,
            background: `radial-gradient(ellipse at 50% 100%, rgba(120,0,255,${throb * 0.3}) 0%, transparent 70%)`,
            transformOrigin: 'bottom center',
          }}
        />
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
    let scale = 1

    if (phase === 'enter') {
      opacity = Math.min(1, enterProgress * 2)
      scale = 0.6 + easeInOutSine(enterProgress) * 0.4
    } else if (phase === 'hold') {
      opacity = 1
      // Sub-bass: 0.5Hz — very slow, large throb (2s period)
      const freq = 0.5
      const throb = (Math.sin(holdProgress * freq * Math.PI * 4) + 1) / 2
      // Large scale swing: 0.88 to 1.12
      scale = 0.88 + easeInOutSine(throb) * 0.24
    } else {
      opacity = 1 - exitProgress
      scale = 1 - exitProgress * 0.15
    }

    return (
      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: `translate(-50%, -50%) scale(${scale})`,
          opacity,
          fontSize: 'clamp(52px, 14vw, 180px)',
          fontWeight: 900,
          color,
          whiteSpace: 'nowrap',
          fontFamily: "'Impact', 'Arial Black', sans-serif",
          textTransform: 'uppercase',
          letterSpacing: '0.06em',
          textShadow: `
            0 0 30px ${color}80,
            0 0 80px ${color}40,
            0 0 120px ${color}20,
            0 6px 30px rgba(0,0,0,0.7)
          `,
        }}
      >
        {word}
      </div>
    )
  },
}

function SubBassThrob(props: MotionGraphicProps<SubBassThrob>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-sub-bass-throb',
  title: 'Kinetic Sub Bass Throb',
  description:
    'Deep sub-bass scale pulse: slow 0.5Hz throb with large amplitude. Text breathes with the sub-bass frequencies. Massive, room-shaking feel.',
  tags: ['kinetic', 'scale', 'sub-bass', 'pulse', 'throb', 'edm', 'bass', 'rhythm', 'music'],
  category: 'captions',
  component: SubBassThrob as any,
  defaultConfig: {
    words: ['SUB', 'BASS', 'HEAVY'],
    colors: ['#9B5DE5', '#F15BB5', '#00BBF9'],
    bgColor: '#050010',
    cycleDuration: 1.5,
    throbbingAmount: 24,
  },
  configSchema: [
    { key: 'words', label: 'Words', type: 'text-array', defaultValue: ['SUB', 'BASS', 'HEAVY'], group: 'Content' },
    { key: 'colors', label: 'Colors', type: 'text-array', defaultValue: ['#9B5DE5', '#F15BB5', '#00BBF9'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#050010', group: 'Style' },
    { key: 'cycleDuration', label: 'Cycle Duration (s)', type: 'number', defaultValue: 1.5, min: 0.5, max: 6, group: 'Timing' },
    { key: 'throbbingAmount', label: 'Throb Amount', type: 'number', defaultValue: 24, min: 4, max: 60, group: 'Animation' },
  ],
})
