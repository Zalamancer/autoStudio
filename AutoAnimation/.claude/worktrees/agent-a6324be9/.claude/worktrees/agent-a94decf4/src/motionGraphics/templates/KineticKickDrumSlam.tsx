import { registerMotionGraphic } from '../registry'
import {
  KineticBase,
  type KineticBaseConfig,
  type KineticAnimation,
  type WordRenderProps,
  type BackgroundRenderProps,
} from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface KickDrumSlamConfig extends KineticBaseConfig {
  impactColor: string
}

function easeOutExpo(t: number): number {
  return t === 1 ? 1 : 1 - Math.pow(2, -10 * t)
}

function easeOutBounce(t: number): number {
  const n1 = 7.5625
  const d1 = 2.75
  if (t < 1 / d1) return n1 * t * t
  if (t < 2 / d1) return n1 * (t -= 1.5 / d1) * t + 0.75
  if (t < 2.5 / d1) return n1 * (t -= 2.25 / d1) * t + 0.9375
  return n1 * (t -= 2.625 / d1) * t + 0.984375
}

const animation: KineticAnimation = {
  renderBackground: ({ bgColor, width, height, frame, fps }: BackgroundRenderProps) => {
    const time = frame / fps
    // Kick drum: heavy 4/4 pattern — hits at ~120 BPM (2 Hz)
    const beatFreq = 2.0
    const beatPhase = (time * beatFreq) % 1
    // Extremely sharp attack, exponential decay
    const impact = beatPhase < 0.05 ? beatPhase / 0.05 : Math.pow(1 - (beatPhase - 0.05) / 0.95, 4)

    const flashRadius = 20 + impact * 50

    return (
      <div style={{ position: 'absolute', inset: 0, background: bgColor }}>
        {/* Ground flash radial burst */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: `radial-gradient(ellipse at 50% 100%,
              rgba(255,80,0,${0.35 * impact}) 0%,
              rgba(255,40,0,${0.18 * impact}) ${flashRadius}%,
              transparent ${flashRadius + 25}%)`,
          }}
        />
        {/* Shockwave ring */}
        {[0, 1, 2].map((i) => {
          const delay = i * 0.08
          const rp = Math.max(0, (time * beatFreq - delay) % 1)
          const rScale = 0.1 + rp * 2.0
          const rOpacity = Math.max(0, (1 - rp) * 0.5 * impact)
          return (
            <div
              key={i}
              style={{
                position: 'absolute',
                bottom: 0,
                left: '50%',
                width: Math.min(width, height) * 0.8,
                height: Math.min(width, height) * 0.4,
                borderRadius: '50%',
                border: '3px solid rgba(255,100,20,0.7)',
                transform: `translateX(-50%) scaleX(${rScale}) scaleY(${rScale * 0.5})`,
                opacity: rOpacity,
              }}
            />
          )
        })}
        {/* Vignette */}
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

  renderWord: ({ word, color, enterProgress, exitProgress, phase, height, frame = 0 }: WordRenderProps) => {
    const time = frame / 30
    let opacity = 1
    let scale = 1
    let translateY = 0
    let skewX = 0

    if (phase === 'enter') {
      // Slams in from above with bounce
      const bounced = easeOutBounce(enterProgress)
      opacity = Math.min(1, enterProgress * 4)
      scale = 0.3 + 0.7 * bounced
      translateY = -(1 - bounced) * height * 0.35
      skewX = (1 - enterProgress) * -8
    } else if (phase === 'hold') {
      // Rhythmic kick compression: squash on beat
      const beatFreq = 2.0
      const beatPhase = (time * beatFreq) % 1
      const kick = beatPhase < 0.05 ? beatPhase / 0.05 : Math.pow(1 - (beatPhase - 0.05) / 0.95, 3)
      scale = 1 + kick * 0.12
      translateY = kick * 6
    } else {
      const eased = easeOutExpo(exitProgress)
      opacity = 1 - exitProgress
      scale = 1 + eased * 0.4
    }

    return (
      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: `translate(-50%, calc(-50% + ${translateY}px)) scale(${scale}) skewX(${skewX}deg)`,
          opacity,
          fontSize: 'clamp(52px, 13vw, 175px)',
          fontWeight: 900,
          color,
          whiteSpace: 'nowrap',
          fontFamily: "'Impact', 'Arial Black', sans-serif",
          textTransform: 'uppercase',
          letterSpacing: '0.04em',
          textShadow: `
            0 0 0 rgba(255,80,0,0.8),
            0 6px 30px rgba(0,0,0,0.8),
            0 2px 0 rgba(255,60,0,0.5)
          `,
          zIndex: 10,
        }}
      >
        {word}
      </div>
    )
  },
}

function KickDrumSlamComponent(props: MotionGraphicProps<KickDrumSlamConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-kick-drum-slam',
  title: 'Kinetic Kick Drum Slam',
  description:
    'Text slams in with bounce physics synced to a kick drum pattern. Ground shockwave rings and radial flash on every beat hit.',
  tags: ['kinetic', 'music', 'kick', 'drum', 'slam', 'beat', 'impact', 'rhythm', 'bounce'],
  category: 'captions',
  component: KickDrumSlamComponent as any,
  defaultConfig: {
    words: ['KICK', 'DRUM', 'SLAM', 'HARD'],
    colors: ['#FF5500', '#FF2200', '#FF7700', '#FF3300'],
    bgColor: '#0D0500',
    cycleDuration: 1.0,
    impactColor: '#FF5500',
  },
  configSchema: [
    {
      key: 'words',
      label: 'Words',
      type: 'text-array',
      defaultValue: ['KICK', 'DRUM', 'SLAM', 'HARD'],
      group: 'Content',
    },
    {
      key: 'colors',
      label: 'Colors',
      type: 'text-array',
      defaultValue: ['#FF5500', '#FF2200', '#FF7700', '#FF3300'],
      group: 'Style',
    },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#0D0500', group: 'Style' },
    {
      key: 'cycleDuration',
      label: 'Cycle Duration (s)',
      type: 'number',
      defaultValue: 1.0,
      min: 0.3,
      max: 5,
      group: 'Timing',
    },
    { key: 'impactColor', label: 'Impact Color', type: 'color', defaultValue: '#FF5500', group: 'Animation' },
  ],
})
