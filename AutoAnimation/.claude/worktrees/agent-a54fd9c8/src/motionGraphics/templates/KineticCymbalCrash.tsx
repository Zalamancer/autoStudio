import { registerMotionGraphic } from '../registry'
import {
  KineticBase,
  type KineticBaseConfig,
  type KineticAnimation,
  type WordRenderProps,
  type BackgroundRenderProps,
} from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface CymbalCrashConfig extends KineticBaseConfig {
  ringoutColor: string
}

function easeOutCirc(t: number): number {
  return Math.sqrt(1 - Math.pow(t - 1, 2))
}

const animation: KineticAnimation = {
  renderBackground: ({ bgColor, width, height, frame, fps }: BackgroundRenderProps) => {
    const time = frame / fps
    // Cymbal crash: big hit once per ~2.5s cycle, long ring-out
    const crashFreq = 0.8
    const crashPhase = (time * crashFreq) % 1
    // Instant hit, very long metallic decay
    const crash = crashPhase < 0.02 ? 1.0 : Math.pow(1 - (crashPhase - 0.02) / 0.98, 1.5)

    return (
      <div style={{ position: 'absolute', inset: 0, background: bgColor }}>
        {/* Full-screen flash on crash */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: `rgba(255,240,180,${crash * 0.18})`,
          }}
        />
        {/* Expanding concentric shimmer rings — long ring-out */}
        {[0, 1, 2, 3, 4, 5, 6].map((i) => {
          const delay = i * 0.04
          const rp = Math.max(0, (time * crashFreq - delay) % 1)
          const rScale = 0.05 + rp * 3.0
          const rOpacity = Math.max(0, (1 - rp) * 0.6 * crash)
          const dim = Math.min(width, height)
          return (
            <div
              key={i}
              style={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                width: dim,
                height: dim,
                borderRadius: '50%',
                border: `${2 - i * 0.2}px solid rgba(255,220,80,0.8)`,
                transform: `translate(-50%, -50%) scale(${rScale})`,
                opacity: rOpacity,
              }}
            />
          )
        })}
        {/* Metallic glint streaks */}
        {[0, 1, 2, 3, 4, 5].map((i) => {
          const angle = (i / 6) * 360
          const len = 0.1 + crash * 0.35
          return (
            <div
              key={i}
              style={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                width: len * Math.min(width, height),
                height: 1,
                background: `linear-gradient(to right, transparent, rgba(255,240,180,${crash * 0.7}), transparent)`,
                transform: `translate(-50%, -50%) rotate(${angle}deg)`,
                transformOrigin: 'left center',
              }}
            />
          )
        })}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: `radial-gradient(ellipse at 50% 50%, transparent 25%, ${bgColor}CC 100%)`,
          }}
        />
      </div>
    )
  },

  renderWord: ({ word, color, enterProgress, exitProgress, phase, frame = 0 }: WordRenderProps) => {
    const time = frame / 30
    let opacity = 1
    let scale = 1
    let rotate = 0

    if (phase === 'enter') {
      const eased = easeOutCirc(enterProgress)
      opacity = Math.min(1, enterProgress * 3)
      scale = 1.8 - 0.8 * eased
      rotate = (1 - eased) * 15
    } else if (phase === 'hold') {
      // Long ring-out shimmer: gentle scale breath
      const crashFreq = 0.8
      const crashPhase = (time * crashFreq) % 1
      const ringout = crashPhase < 0.02 ? 1.0 : Math.pow(1 - (crashPhase - 0.02) / 0.98, 1.5)
      scale = 1 + ringout * 0.06
      rotate = Math.sin(time * 3.5) * 0.5 * (ringout * 0.5 + 0.1)
    } else {
      opacity = 1 - exitProgress
      scale = 1 + exitProgress * 0.3
      rotate = exitProgress * 10
    }

    return (
      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: `translate(-50%, -50%) scale(${scale}) rotate(${rotate}deg)`,
          opacity,
          fontSize: 'clamp(46px, 11.5vw, 155px)',
          fontWeight: 900,
          color,
          whiteSpace: 'nowrap',
          fontFamily: "'Impact', 'Arial Black', sans-serif",
          textTransform: 'uppercase',
          letterSpacing: '0.06em',
          textShadow: `
            0 0 40px ${color}80,
            0 0 80px ${color}40,
            0 4px 24px rgba(0,0,0,0.7)
          `,
          zIndex: 10,
        }}
      >
        {word}
      </div>
    )
  },
}

function CymbalCrashComponent(props: MotionGraphicProps<CymbalCrashConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-cymbal-crash',
  title: 'Kinetic Cymbal Crash',
  description:
    'Cymbal crash ring-out: text expands from center with metallic shimmer rings expanding outward. Long decay rings and golden glint streaks on every crash.',
  tags: ['kinetic', 'music', 'cymbal', 'crash', 'ring', 'metallic', 'shimmer', 'drum', 'impact'],
  category: 'captions',
  component: CymbalCrashComponent as any,
  defaultConfig: {
    words: ['CRASH', 'RING', 'OUT', 'LOUD'],
    colors: ['#FFD700', '#FFC300', '#FFE566', '#FFB800'],
    bgColor: '#060400',
    cycleDuration: 1.5,
    ringoutColor: '#FFD700',
  },
  configSchema: [
    {
      key: 'words',
      label: 'Words',
      type: 'text-array',
      defaultValue: ['CRASH', 'RING', 'OUT', 'LOUD'],
      group: 'Content',
    },
    {
      key: 'colors',
      label: 'Colors',
      type: 'text-array',
      defaultValue: ['#FFD700', '#FFC300', '#FFE566', '#FFB800'],
      group: 'Style',
    },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#060400', group: 'Style' },
    {
      key: 'cycleDuration',
      label: 'Cycle Duration (s)',
      type: 'number',
      defaultValue: 1.5,
      min: 0.3,
      max: 5,
      group: 'Timing',
    },
    { key: 'ringoutColor', label: 'Ring-out Color', type: 'color', defaultValue: '#FFD700', group: 'Animation' },
  ],
})
