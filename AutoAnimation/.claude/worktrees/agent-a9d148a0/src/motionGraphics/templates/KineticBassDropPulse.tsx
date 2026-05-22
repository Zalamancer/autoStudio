import { registerMotionGraphic } from '../registry'
import {
  KineticBase,
  type KineticBaseConfig,
  type KineticAnimation,
  type WordRenderProps,
  type BackgroundRenderProps,
} from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface BassDropPulseConfig extends KineticBaseConfig {
  pulseColor: string
}

function easeOutExpo(t: number): number {
  return t === 1 ? 1 : 1 - Math.pow(2, -10 * t)
}

const animation: KineticAnimation = {
  renderBackground: ({ bgColor, width, height, frame, fps }: BackgroundRenderProps) => {
    const time = frame / fps
    // Pulse rhythm: ~2 beats per second
    const beatFreq = 2.0
    const beatPhase = (time * beatFreq) % 1
    // Sharp attack, slow decay
    const pulseIntensity = beatPhase < 0.1 ? beatPhase / 0.1 : Math.pow(1 - (beatPhase - 0.1) / 0.9, 2)

    const gradientRadius = 30 + pulseIntensity * 40

    return (
      <div style={{ position: 'absolute', inset: 0, background: bgColor }}>
        {/* Pulsing radial gradient */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: `radial-gradient(circle at 50% 50%,
              rgba(120,0,255,${0.15 * pulseIntensity}) 0%,
              rgba(80,0,200,${0.08 * pulseIntensity}) ${gradientRadius}%,
              transparent ${gradientRadius + 30}%)`,
          }}
        />

        {/* Concentric pulse rings */}
        {[0, 1, 2].map((ringIdx) => {
          const ringDelay = ringIdx * 0.15
          const ringPhase = ((time * beatFreq) - ringDelay) % 1
          const ringProgress = ringPhase < 0 ? 0 : ringPhase
          const ringScale = 0.3 + ringProgress * 1.2
          const ringOpacity = Math.max(0, (1 - ringProgress) * 0.25)

          return (
            <div
              key={ringIdx}
              style={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                width: Math.min(width, height) * 0.6,
                height: Math.min(width, height) * 0.6,
                borderRadius: '50%',
                border: '2px solid rgba(140,80,255,0.5)',
                transform: `translate(-50%, -50%) scale(${ringScale})`,
                opacity: ringOpacity,
              }}
            />
          )
        })}

        {/* Corner vignette */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: `radial-gradient(ellipse at 50% 50%, transparent 40%, ${bgColor} 100%)`,
            opacity: 0.6,
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
    width,
    height,
  }: WordRenderProps) => {
    let opacity = 1
    let scale = 1

    if (phase === 'enter') {
      const eased = easeOutExpo(enterProgress)
      opacity = eased
      scale = 2.5 - 1.5 * eased
    } else if (phase === 'hold') {
      // Bass drop pulse: rhythmic scaling
      const beatFreq = 2.0
      const beatPhase = (holdProgress * 3) % 1
      const pulseAmount =
        beatPhase < 0.1 ? beatPhase / 0.1 : Math.pow(1 - (beatPhase - 0.1) / 0.9, 3)
      scale = 1 + pulseAmount * 0.15
      opacity = 1
    } else {
      opacity = 1 - exitProgress
      scale = 1 - exitProgress * 0.3
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
            0 0 20px ${color}60,
            0 0 40px ${color}30,
            0 0 80px ${color}15,
            0 4px 20px rgba(0,0,0,0.6)
          `,
          zIndex: 10,
        }}
      >
        {word}
      </div>
    )
  },
}

function BassDropPulseComponent(props: MotionGraphicProps<BassDropPulseConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-bass-drop-pulse',
  title: 'Kinetic Bass Drop Pulse',
  description:
    'Bass drop effect with rhythmic text scaling and pulsing radial background gradient. Creates visual bass-drop rhythm with concentric pulse rings.',
  tags: ['kinetic', 'music', 'bass', 'drop', 'pulse', 'beat', 'edm', 'rhythm'],
  category: 'captions',
  component: BassDropPulseComponent as any,
  defaultConfig: {
    words: ['BASS', 'DROP', 'NOW'],
    colors: ['#B366FF', '#9933FF', '#CC99FF'],
    bgColor: '#08001A',
    cycleDuration: 1.2,
    pulseColor: '#8C50FF',
  },
  configSchema: [
    {
      key: 'words',
      label: 'Words',
      type: 'text-array',
      defaultValue: ['BASS', 'DROP', 'NOW'],
      group: 'Content',
    },
    {
      key: 'colors',
      label: 'Colors',
      type: 'text-array',
      defaultValue: ['#B366FF', '#9933FF', '#CC99FF'],
      group: 'Style',
    },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#08001A', group: 'Style' },
    {
      key: 'cycleDuration',
      label: 'Cycle Duration (s)',
      type: 'number',
      defaultValue: 1.2,
      min: 0.3,
      max: 5,
      group: 'Timing',
    },
  ],
})
