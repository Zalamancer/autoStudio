import { registerMotionGraphic } from '../registry'
import {
  KineticBase,
  type KineticBaseConfig,
  type KineticAnimation,
  type WordRenderProps,
  type BackgroundRenderProps,
} from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface HiHatStutterConfig extends KineticBaseConfig {
  hatColor: string
}

function easeOutQuart(t: number): number {
  return 1 - Math.pow(1 - t, 4)
}

const animation: KineticAnimation = {
  renderBackground: ({ bgColor, width, height, frame, fps }: BackgroundRenderProps) => {
    const time = frame / fps
    // Hi-hat 16th notes at 120 BPM = 8 Hz
    const hatFreq = 8.0
    const hatPhase = (time * hatFreq) % 1
    const hat = hatPhase < 0.08 ? hatPhase / 0.08 : Math.pow(1 - (hatPhase - 0.08) / 0.92, 8)

    // Open hat every 4th 16th (2 Hz)
    const openHatFreq = 2.0
    const openPhase = (time * openHatFreq) % 1
    const openHat = openPhase < 0.12 ? openPhase / 0.12 : Math.pow(1 - (openPhase - 0.12) / 0.88, 4)

    return (
      <div style={{ position: 'absolute', inset: 0, background: bgColor }}>
        {/* Fine shimmer grid - 16th note dots */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            backgroundImage: `radial-gradient(circle, rgba(255,215,0,${hat * 0.25}) 1px, transparent 1px)`,
            backgroundSize: `${width / 20}px ${height / 20}px`,
          }}
        />
        {/* Open hat ring */}
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            width: Math.min(width, height) * (0.5 + openHat * 0.6),
            height: Math.min(width, height) * (0.5 + openHat * 0.6),
            borderRadius: '50%',
            border: `1px solid rgba(255,215,0,${openHat * 0.4})`,
            transform: 'translate(-50%, -50%)',
          }}
        />
        {/* Closed hat tick flashes - tiny gold sparks at top */}
        {[0, 1, 2, 3].map((i) => {
          const delay = i * 0.025
          const tp = Math.max(0, (time * hatFreq - delay) % 1)
          const tHat = tp < 0.08 ? tp / 0.08 : Math.pow(1 - (tp - 0.08) / 0.92, 10)
          return (
            <div
              key={i}
              style={{
                position: 'absolute',
                top: `${10 + i * 5}%`,
                left: `${20 + i * 20}%`,
                width: 2,
                height: 2 + tHat * 8,
                background: `rgba(255,215,0,${tHat * 0.9})`,
                borderRadius: 1,
              }}
            />
          )
        })}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: `radial-gradient(ellipse at 50% 50%, transparent 40%, ${bgColor}AA 100%)`,
          }}
        />
      </div>
    )
  },

  renderWord: ({ word, color, enterProgress, exitProgress, phase, frame = 0 }: WordRenderProps) => {
    const time = frame / 30
    let opacity = 1
    let scale = 1
    let translateX = 0
    let blur = 0

    if (phase === 'enter') {
      const eased = easeOutQuart(enterProgress)
      opacity = Math.min(1, enterProgress * 3)
      scale = 0.85 + 0.15 * eased
      blur = (1 - eased) * 6
    } else if (phase === 'hold') {
      // 16th-note micro-stutter: tiny horizontal vibration
      const hatFreq = 8.0
      const hatPhase = (time * hatFreq) % 1
      const hat = hatPhase < 0.08 ? hatPhase / 0.08 : Math.pow(1 - (hatPhase - 0.08) / 0.92, 8)
      translateX = (Math.random() > 0.5 ? 1 : -1) * hat * 3
      scale = 1 + hat * 0.04
    } else {
      opacity = 1 - exitProgress
      scale = 1 - exitProgress * 0.15
      blur = exitProgress * 4
    }

    return (
      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: `translate(calc(-50% + ${translateX}px), -50%) scale(${scale})`,
          opacity,
          filter: blur > 0 ? `blur(${blur}px)` : undefined,
          fontSize: 'clamp(44px, 11vw, 150px)',
          fontWeight: 900,
          color,
          whiteSpace: 'nowrap',
          fontFamily: "'Impact', 'Arial Black', sans-serif",
          textTransform: 'uppercase',
          letterSpacing: '0.15em',
          textShadow: `0 0 20px ${color}50, 0 4px 16px rgba(0,0,0,0.7)`,
          zIndex: 10,
        }}
      >
        {word}
      </div>
    )
  },
}

function HiHatStutterComponent(props: MotionGraphicProps<HiHatStutterConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-hi-hat-stutter',
  title: 'Kinetic Hi-Hat Stutter',
  description:
    'Text micro-stutters on 16th-note hi-hat rhythm. Gold shimmer dot-grid pulses on every tick; open hat ring expands on every beat.',
  tags: ['kinetic', 'music', 'hi-hat', 'stutter', 'drums', '16th', 'rhythm', 'gold', 'shimmer'],
  category: 'captions',
  component: HiHatStutterComponent as any,
  defaultConfig: {
    words: ['TSSSS', 'CHICK', 'TICK', 'ROLL'],
    colors: ['#FFD700', '#FFC400', '#FFEB80', '#FFD700'],
    bgColor: '#080808',
    cycleDuration: 0.8,
    hatColor: '#FFD700',
  },
  configSchema: [
    {
      key: 'words',
      label: 'Words',
      type: 'text-array',
      defaultValue: ['TSSSS', 'CHICK', 'TICK', 'ROLL'],
      group: 'Content',
    },
    {
      key: 'colors',
      label: 'Colors',
      type: 'text-array',
      defaultValue: ['#FFD700', '#FFC400', '#FFEB80', '#FFD700'],
      group: 'Style',
    },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#080808', group: 'Style' },
    {
      key: 'cycleDuration',
      label: 'Cycle Duration (s)',
      type: 'number',
      defaultValue: 0.8,
      min: 0.3,
      max: 5,
      group: 'Timing',
    },
    { key: 'hatColor', label: 'Hat Color', type: 'color', defaultValue: '#FFD700', group: 'Animation' },
  ],
})
