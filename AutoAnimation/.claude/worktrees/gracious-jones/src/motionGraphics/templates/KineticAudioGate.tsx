import { registerMotionGraphic } from '../registry'
import {
  KineticBase,
  type KineticBaseConfig,
  type KineticAnimation,
  type WordRenderProps,
  type BackgroundRenderProps,
} from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface AudioGateConfig extends KineticBaseConfig {
  gateThreshold: number
}

function easeOutQuart(t: number): number {
  return 1 - Math.pow(1 - t, 4)
}

// Gate signal: binary on/off based on rhythm pattern
function gateSignal(time: number): number {
  const beatFreq = 2.0
  const pattern = [1, 0, 1, 1, 0, 1, 0, 1] // 8-step gate pattern
  const step = Math.floor(time * beatFreq * 2) % pattern.length
  const stepPhase = (time * beatFreq * 2) % 1
  const isOpen = pattern[step] === 1
  if (isOpen) {
    return stepPhase < 0.85 ? 1 : 1 - (stepPhase - 0.85) / 0.15
  }
  return stepPhase < 0.1 ? (stepPhase / 0.1) * 0.05 : 0.05 * (1 - (stepPhase - 0.1) / 0.9)
}

const animation: KineticAnimation = {
  renderBackground: ({ bgColor, frame, fps }: BackgroundRenderProps) => {
    const time = frame / fps
    const gate = gateSignal(time)

    // Visualize gate as vertical bars: open=bright, closed=dark
    const numBars = 16
    return (
      <div style={{ position: 'absolute', inset: 0, background: bgColor }}>
        {/* Gate state indicator bars */}
        <div
          style={{
            position: 'absolute',
            bottom: '8%',
            left: '5%',
            right: '5%',
            height: '8%',
            display: 'flex',
            gap: 3,
          }}
        >
          {Array.from({ length: numBars }).map((_, i) => {
            const beatFreq = 2.0
            const pattern = [1, 0, 1, 1, 0, 1, 0, 1]
            const currentStep = Math.floor(time * beatFreq * 2) % pattern.length
            const barStep = Math.floor(i / (numBars / pattern.length)) % pattern.length
            const isActive = barStep === currentStep
            const isOpen = pattern[barStep] === 1
            return (
              <div
                key={i}
                style={{
                  flex: 1,
                  background: isOpen
                    ? `rgba(0,255,120,${isActive ? gate : 0.35})`
                    : `rgba(255,40,40,${isActive ? 0.5 : 0.15})`,
                  borderRadius: 2,
                }}
              />
            )
          })}
        </div>
        {/* Gate flash when open */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: `radial-gradient(ellipse at 50% 50%, rgba(0,255,120,${gate * 0.08}) 0%, transparent 60%)`,
          }}
        />
        {/* Signal indicator line */}
        <div
          style={{
            position: 'absolute',
            left: '10%',
            right: '10%',
            top: '85%',
            height: 2,
            background: `linear-gradient(to right, transparent, rgba(0,255,120,${gate * 0.8}), transparent)`,
          }}
        />
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: `radial-gradient(ellipse at 50% 50%, transparent 30%, ${bgColor}CC 100%)`,
          }}
        />
      </div>
    )
  },

  renderWord: ({ word, color, enterProgress, exitProgress, phase, frame = 0 }: WordRenderProps) => {
    const time = frame / 30
    const gate = gateSignal(time)

    let opacity = 1
    let scale = 1

    if (phase === 'enter') {
      const eased = easeOutQuart(enterProgress)
      opacity = eased
      scale = 0.9 + 0.1 * eased
    } else if (phase === 'hold') {
      // Gate: text visibility driven by gate signal
      opacity = 0.1 + gate * 0.9
      scale = 0.95 + gate * 0.08
    } else {
      opacity = 1 - exitProgress
    }

    return (
      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: `translate(-50%, -50%) scale(${scale})`,
          opacity,
          fontSize: 'clamp(48px, 12vw, 160px)',
          fontWeight: 900,
          color,
          whiteSpace: 'nowrap',
          fontFamily: "'Impact', 'Arial Black', sans-serif",
          textTransform: 'uppercase',
          letterSpacing: '0.08em',
          textShadow: `
            0 0 ${10 + gate * 30}px ${color}${Math.round(gate * 100)
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

function AudioGateComponent(props: MotionGraphicProps<AudioGateConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-audio-gate',
  title: 'Kinetic Audio Gate',
  description:
    'Text visibility follows an 8-step gate pattern — on/off rhythmic chopping like an audio noise gate. Pattern display shows current gate state.',
  tags: ['kinetic', 'music', 'gate', 'audio', 'staccato', 'pattern', 'chop', 'rhythm', 'producer'],
  category: 'captions',
  component: AudioGateComponent as any,
  defaultConfig: {
    words: ['GATE', 'ON', 'OFF', 'RHYTHM'],
    colors: ['#00FF78', '#00DD66', '#44FF99', '#00CC55'],
    bgColor: '#020806',
    cycleDuration: 1.0,
    gateThreshold: 0.5,
  },
  configSchema: [
    {
      key: 'words',
      label: 'Words',
      type: 'text-array',
      defaultValue: ['GATE', 'ON', 'OFF', 'RHYTHM'],
      group: 'Content',
    },
    {
      key: 'colors',
      label: 'Colors',
      type: 'text-array',
      defaultValue: ['#00FF78', '#00DD66', '#44FF99', '#00CC55'],
      group: 'Style',
    },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#020806', group: 'Style' },
    {
      key: 'cycleDuration',
      label: 'Cycle Duration (s)',
      type: 'number',
      defaultValue: 1.0,
      min: 0.3,
      max: 5,
      group: 'Timing',
    },
    {
      key: 'gateThreshold',
      label: 'Gate Threshold',
      type: 'number',
      defaultValue: 0.5,
      min: 0.1,
      max: 0.9,
      group: 'Animation',
    },
  ],
})
