import { registerMotionGraphic } from '../registry'
import {
  KineticBase,
  type KineticBaseConfig,
  type KineticAnimation,
  type WordRenderProps,
  type BackgroundRenderProps,
} from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface RhythmGridSnapConfig extends KineticBaseConfig {
  snapColor: string
}

function easeOutBack(t: number): number {
  const c1 = 1.70158
  const c3 = c1 + 1
  return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2)
}

// 16-step rhythm pattern (classic trap/house)
const PATTERN_16 = [1, 0, 0, 0, 1, 0, 1, 0, 1, 0, 0, 1, 0, 1, 0, 0]

const animation: KineticAnimation = {
  renderBackground: ({ bgColor, width, height, frame, fps }: BackgroundRenderProps) => {
    const time = frame / fps
    const stepsPerSec = 8.0 // 16th notes at 120 BPM = 8 per second
    const currentStep = Math.floor(time * stepsPerSec) % PATTERN_16.length
    const stepPhase = (time * stepsPerSec) % 1
    const isHit = PATTERN_16[currentStep] === 1
    const hitDecay = isHit ? Math.pow(1 - stepPhase, 3) : 0

    const cellW = width / PATTERN_16.length
    const cellH = height * 0.1

    return (
      <div style={{ position: 'absolute', inset: 0, background: bgColor }}>
        {/* 16-step sequencer display at top */}
        {PATTERN_16.map((step, i) => {
          const isActive = i === currentStep
          const isOn = step === 1
          return (
            <div
              key={i}
              style={{
                position: 'absolute',
                left: i * cellW,
                top: '8%',
                width: cellW - 2,
                height: cellH,
                borderRadius: 3,
                background: isOn
                  ? isActive
                    ? `rgba(220,80,255,${0.6 + hitDecay * 0.4})`
                    : `rgba(180,60,220,0.4)`
                  : isActive
                    ? `rgba(80,80,80,0.4)`
                    : `rgba(40,40,40,0.3)`,
                boxShadow: isOn && isActive ? `0 0 8px rgba(220,80,255,${hitDecay * 0.8})` : 'none',
              }}
            />
          )
        })}

        {/* Hit flash */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: `radial-gradient(ellipse at 50% 50%, rgba(200,60,255,${hitDecay * 0.12}) 0%, transparent 60%)`,
          }}
        />

        {/* Beat columns — vertical lines on downbeats */}
        {[0, 4, 8, 12].map((beat) => (
          <div
            key={beat}
            style={{
              position: 'absolute',
              left: (beat / PATTERN_16.length) * 100 + '%',
              top: '18%',
              bottom: '5%',
              width: 1,
              background: `rgba(200,60,255,0.12)`,
            }}
          />
        ))}

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
    const stepsPerSec = 8.0
    const currentStep = Math.floor(time * stepsPerSec) % PATTERN_16.length
    const stepPhase = (time * stepsPerSec) % 1
    const isHit = PATTERN_16[currentStep] === 1
    const hitDecay = isHit ? Math.pow(1 - stepPhase, 3) : 0

    let opacity = 1
    let scale = 1
    let translateY = 0
    let rotate = 0

    if (phase === 'enter') {
      const eased = easeOutBack(enterProgress)
      opacity = Math.min(1, enterProgress * 4)
      scale = 0.5 + 0.5 * eased
    } else if (phase === 'hold') {
      // Snap to rhythm: vertical kick on each pattern hit
      translateY = -hitDecay * 10
      scale = 1 + hitDecay * 0.1
      rotate = hitDecay * 1.5
    } else {
      opacity = 1 - exitProgress
      scale = 1 - exitProgress * 0.2
    }

    return (
      <div
        style={{
          position: 'absolute',
          top: '55%',
          left: '50%',
          transform: `translate(-50%, calc(-50% + ${translateY}px)) scale(${scale}) rotate(${rotate}deg)`,
          opacity,
          fontSize: 'clamp(48px, 12vw, 160px)',
          fontWeight: 900,
          color,
          whiteSpace: 'nowrap',
          fontFamily: "'Impact', 'Arial Black', sans-serif",
          textTransform: 'uppercase',
          letterSpacing: '0.05em',
          textShadow: `
            0 0 ${15 + hitDecay * 35}px ${color}${Math.round(40 + hitDecay * 80)
              .toString(16)
              .padStart(2, '0')},
            0 4px 20px rgba(0,0,0,0.8)
          `,
          zIndex: 10,
        }}
      >
        {word}
      </div>
    )
  },
}

function RhythmGridSnapComponent(props: MotionGraphicProps<RhythmGridSnapConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-rhythm-grid-snap',
  title: 'Kinetic Rhythm Grid Snap',
  description:
    'Text bounces in time with a 16-step sequencer pattern shown at the top. Each hit triggers a spring-kick. Classic trap/house pattern visualization.',
  tags: ['kinetic', 'music', 'rhythm', 'grid', 'sequencer', 'pattern', '16-step', 'trap', 'house'],
  category: 'captions',
  component: RhythmGridSnapComponent as any,
  defaultConfig: {
    words: ['STEP', 'SEQ', 'TRAP', 'LOCK'],
    colors: ['#DC50FF', '#BB30DD', '#EE80FF', '#CC40EE'],
    bgColor: '#060010',
    cycleDuration: 1.0,
    snapColor: '#DC50FF',
  },
  configSchema: [
    {
      key: 'words',
      label: 'Words',
      type: 'text-array',
      defaultValue: ['STEP', 'SEQ', 'TRAP', 'LOCK'],
      group: 'Content',
    },
    {
      key: 'colors',
      label: 'Colors',
      type: 'text-array',
      defaultValue: ['#DC50FF', '#BB30DD', '#EE80FF', '#CC40EE'],
      group: 'Style',
    },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#060010', group: 'Style' },
    {
      key: 'cycleDuration',
      label: 'Cycle Duration (s)',
      type: 'number',
      defaultValue: 1.0,
      min: 0.3,
      max: 5,
      group: 'Timing',
    },
    { key: 'snapColor', label: 'Snap Color', type: 'color', defaultValue: '#DC50FF', group: 'Animation' },
  ],
})
