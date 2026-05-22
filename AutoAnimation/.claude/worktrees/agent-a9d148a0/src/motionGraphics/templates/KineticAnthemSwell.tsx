import { registerMotionGraphic } from '../registry'
import {
  KineticBase,
  type KineticBaseConfig,
  type KineticAnimation,
  type WordRenderProps,
  type BackgroundRenderProps,
} from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface AnthemSwellConfig extends KineticBaseConfig {
  swellColor: string
}

function easeOutElastic(t: number): number {
  const c4 = (2 * Math.PI) / 3
  return t === 0 ? 0 : t === 1 ? 1 : Math.pow(2, -10 * t) * Math.sin((t * 10 - 0.75) * c4) + 1
}

function easeInOutSine(t: number): number {
  return -(Math.cos(Math.PI * t) - 1) / 2
}

function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3)
}

const animation: KineticAnimation = {
  renderBackground: ({ bgColor, width, height, frame, fps }: BackgroundRenderProps) => {
    const time = frame / fps
    // Anthem swell: 2.5s grand rising cycle
    const swellFreq = 0.4
    const swellPhase = (time * swellFreq) % 1
    const swell = easeInOutSine(swellPhase)

    // Chorus beat: 2 Hz pulse during swell
    const beatFreq = 2.0
    const beatPhase = (time * beatFreq) % 1
    const beat = beatPhase < 0.08 ? beatPhase / 0.08 : Math.pow(1 - (beatPhase - 0.08) / 0.92, 3)

    const numRays = 16

    return (
      <div style={{ position: 'absolute', inset: 0, background: bgColor }}>
        {/* Grand radial glow — swells with chorus */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: `radial-gradient(ellipse at 50% 60%,
              rgba(255,200,80,${swell * 0.2 + beat * 0.08}) 0%,
              rgba(255,140,40,${swell * 0.15}) 30%,
              rgba(200,80,200,${swell * 0.1}) 60%,
              transparent 85%)`,
          }}
        />
        {/* Radiating light rays */}
        {Array.from({ length: numRays }).map((_, i) => {
          const angle = (i / numRays) * 360
          const len = 0.2 + swell * 0.45 + beat * 0.05
          return (
            <div
              key={i}
              style={{
                position: 'absolute',
                top: '60%',
                left: '50%',
                width: len * Math.min(width, height),
                height: 1 + swell * 2,
                background: `linear-gradient(to right, transparent, rgba(255,200,80,${swell * 0.25 + beat * 0.1}), transparent)`,
                transform: `translate(0, -50%) rotate(${angle}deg)`,
                transformOrigin: 'left center',
              }}
            />
          )
        })}
        {/* Beat pulse rings during chorus */}
        {[0, 1].map((i) => {
          const dim = Math.min(width, height)
          const rSize = dim * (0.3 + i * 0.2 + swell * 0.3 + beat * 0.1)
          return (
            <div
              key={i}
              style={{
                position: 'absolute',
                top: '60%',
                left: '50%',
                width: rSize,
                height: rSize,
                borderRadius: '50%',
                border: `${1 + swell}px solid rgba(255,200,80,${swell * 0.2 + beat * 0.1 - i * 0.05})`,
                transform: 'translate(-50%, -50%)',
              }}
            />
          )
        })}
        {/* Confetti-like small glints at peak */}
        {swell > 0.7 &&
          Array.from({ length: 8 }).map((_, i) => {
            const angle = (i / 8) * Math.PI * 2
            const dist = swell * 0.4 * Math.min(width, height)
            const px = width * 0.5 + Math.cos(angle + time * 0.5) * dist
            const py = height * 0.6 + Math.sin(angle + time * 0.5) * dist * 0.6
            return (
              <div
                key={i}
                style={{
                  position: 'absolute',
                  left: px,
                  top: py,
                  width: 4,
                  height: 4,
                  borderRadius: '50%',
                  background: `rgba(255,220,100,${((swell - 0.7) / 0.3) * 0.8})`,
                  transform: 'translate(-50%, -50%)',
                }}
              />
            )
          })}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: `radial-gradient(ellipse at 50% 50%, transparent 25%, ${bgColor}99 100%)`,
          }}
        />
      </div>
    )
  },

  renderWord: ({ word, color, enterProgress, exitProgress, phase, frame = 0 }: WordRenderProps) => {
    const time = frame / 30
    const swellFreq = 0.4
    const swellPhase = (time * swellFreq) % 1
    const swell = easeInOutSine(swellPhase)
    const beatFreq = 2.0
    const beatPhase = (time * beatFreq) % 1
    const beat = beatPhase < 0.08 ? beatPhase / 0.08 : Math.pow(1 - (beatPhase - 0.08) / 0.92, 3)

    let opacity = 1
    let scale = 1
    let translateY = 0

    if (phase === 'enter') {
      const eased = easeOutElastic(enterProgress)
      opacity = Math.min(1, enterProgress * 2)
      scale = 0.5 + 0.5 * eased
      translateY = (1 - easeOutCubic(enterProgress)) * 40
    } else if (phase === 'hold') {
      // Anthem swell: scale rises with chorus, pulses on beat
      scale = 0.85 + swell * 0.25 + beat * 0.08
      translateY = -(swell * 12)
      opacity = 0.6 + swell * 0.4
    } else {
      opacity = 1 - exitProgress
      scale = 1 + exitProgress * 0.15
    }

    return (
      <div
        style={{
          position: 'absolute',
          top: '45%',
          left: '50%',
          transform: `translate(-50%, calc(-50% + ${translateY}px)) scale(${scale})`,
          opacity,
          fontSize: 'clamp(48px, 12vw, 162px)',
          fontWeight: 900,
          color,
          whiteSpace: 'nowrap',
          fontFamily: "'Impact', 'Arial Black', sans-serif",
          textTransform: 'uppercase',
          letterSpacing: `${0.04 + swell * 0.1}em`,
          textShadow: `
            0 0 ${20 + swell * 60}px ${color}${Math.round(40 + swell * 100)
              .toString(16)
              .padStart(2, '0')},
            0 0 100px rgba(255,180,60,${swell * 0.3}),
            0 4px 24px rgba(0,0,0,0.8)
          `,
          zIndex: 10,
        }}
      >
        {word}
      </div>
    )
  },
}

function AnthemSwellComponent(props: MotionGraphicProps<AnthemSwellConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-anthem-swell',
  title: 'Kinetic Anthem Swell',
  description:
    'Chorus anthem swell: text rises and expands with grandeur as radiating light rays fan out. Warm golden glow surges on the beat. Perfect for emotional drops and anthems.',
  tags: ['kinetic', 'music', 'anthem', 'swell', 'chorus', 'rise', 'grand', 'rays', 'festival', 'epic'],
  category: 'captions',
  component: AnthemSwellComponent as any,
  defaultConfig: {
    words: ['RISE', 'ANTHEM', 'GLORY', 'CHORUS'],
    colors: ['#FFC840', '#FFB020', '#FFD860', '#FFA800'],
    bgColor: '#060300',
    cycleDuration: 1.6,
    swellColor: '#FFC840',
  },
  configSchema: [
    {
      key: 'words',
      label: 'Words',
      type: 'text-array',
      defaultValue: ['RISE', 'ANTHEM', 'GLORY', 'CHORUS'],
      group: 'Content',
    },
    {
      key: 'colors',
      label: 'Colors',
      type: 'text-array',
      defaultValue: ['#FFC840', '#FFB020', '#FFD860', '#FFA800'],
      group: 'Style',
    },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#060300', group: 'Style' },
    {
      key: 'cycleDuration',
      label: 'Cycle Duration (s)',
      type: 'number',
      defaultValue: 1.6,
      min: 0.5,
      max: 6,
      group: 'Timing',
    },
    { key: 'swellColor', label: 'Swell Color', type: 'color', defaultValue: '#FFC840', group: 'Animation' },
  ],
})
