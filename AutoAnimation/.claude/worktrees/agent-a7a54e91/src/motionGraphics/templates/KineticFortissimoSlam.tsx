import { registerMotionGraphic } from '../registry'
import {
  KineticBase,
  type KineticBaseConfig,
  type KineticAnimation,
  type WordRenderProps,
  type BackgroundRenderProps,
} from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

// Visual Music 3/4 — Fortissimo Slam
// ff dynamic: full power, text slams in with maximum impact and stays massive

interface FortissimoSlamConfig extends KineticBaseConfig {
  impactScale: number
}

function easeOutExpo(t: number): number {
  return t === 1 ? 1 : 1 - Math.pow(2, -10 * t)
}

const animation: KineticAnimation = {
  renderBackground: ({ bgColor, frame, fps }: BackgroundRenderProps) => {
    const t = frame / fps
    // Shockwave rings on impact (appears at start)
    const impactTime = 0.3 // seconds after start
    const ringAge = Math.max(0, t - impactTime)

    return (
      <div style={{ position: 'absolute', inset: 0, background: bgColor }}>
        {/* Shockwave rings */}
        {[0, 1, 2, 3].map((i) => {
          const ringStart = i * 0.12
          const ringAge2 = Math.max(0, ringAge - ringStart)
          const ringProgress = Math.min(ringAge2 * 1.2, 1)
          const ringOpacity = Math.max(0, (1 - ringProgress) * 0.5)
          const ringScale = 0.1 + ringProgress * 2.5
          return (
            <div
              key={i}
              style={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                width: 200,
                height: 200,
                borderRadius: '50%',
                border: `${3 - i * 0.5}px solid rgba(255,255,255,${ringOpacity})`,
                transform: `translate(-50%, -50%) scale(${ringScale})`,
              }}
            />
          )
        })}
        {/* Flash on impact */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: `rgba(255,255,255,${Math.max(0, 1 - ringAge * 8) * 0.3})`,
          }}
        />
      </div>
    )
  },

  renderWord: ({ word, color, enterProgress, holdProgress, exitProgress, phase, height }: WordRenderProps) => {
    let opacity = 1
    let scale = 1
    let translateY = 0
    let scaleX = 1
    let scaleY = 1

    if (phase === 'enter') {
      opacity = Math.min(1, enterProgress * 4)
      // Slam from above at massive scale, crash to normal
      const t = easeOutExpo(enterProgress)
      scale = 3.5 - t * 2.5
      translateY = (1 - t) * -height * 0.3
      if (enterProgress > 0.8) {
        // Impact squash
        const impact = (enterProgress - 0.8) / 0.2
        scaleX = 1 + impact * 0.2
        scaleY = 1 - impact * 0.15
      }
    } else if (phase === 'hold') {
      opacity = 1
      // Fortissimo hold: massive scale with micro-tremor from power
      scale = 1.12
      const tremor = Math.sin(holdProgress * Math.PI * 20) * 0.008
      scale += tremor
      scaleX = 1 + Math.abs(tremor)
      scaleY = 1 - Math.abs(tremor) * 0.5
    } else {
      opacity = 1 - exitProgress * exitProgress
      scale = 1.12 + exitProgress * 0.3
      scaleX = 1 + exitProgress * 0.1
      scaleY = 1 - exitProgress * 0.5
    }

    return (
      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: `translate(-50%, -50%) translateY(${translateY}px) scale(${scale}) scaleX(${scaleX}) scaleY(${scaleY})`,
          opacity,
          fontSize: 'clamp(52px, 13vw, 170px)',
          fontWeight: 900,
          color,
          whiteSpace: 'nowrap',
          fontFamily: "'Impact', 'Arial Black', sans-serif",
          textTransform: 'uppercase',
          letterSpacing: '0.02em',
          textShadow: `
            0 0 20px ${color},
            0 0 60px ${color}80,
            4px 4px 0 rgba(0,0,0,0.5)
          `,
        }}
      >
        {word}
      </div>
    )
  },
}

function FortissimoSlamComponent(props: MotionGraphicProps<FortissimoSlamConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-fortissimo-slam',
  title: 'Kinetic Fortissimo Slam',
  description:
    'ff (fortissimo) dynamic: text slams in at maximum power with shockwave rings, massive entry scale, impact squash, and micro-tremor during hold.',
  tags: ['kinetic', 'visual-music', 'fortissimo', 'slam', 'impact', 'loud', 'dynamics', 'music'],
  category: 'captions',
  component: FortissimoSlamComponent as any,
  defaultConfig: {
    words: ['LOUD', 'FULL', 'POWER'],
    colors: ['#FFFFFF', '#FF3333', '#FF8800'],
    bgColor: '#0A0000',
    cycleDuration: 1.3,
    impactScale: 3.5,
  },
  configSchema: [
    { key: 'words', label: 'Words', type: 'text-array', defaultValue: ['LOUD', 'FULL', 'POWER'], group: 'Content' },
    {
      key: 'colors',
      label: 'Colors',
      type: 'text-array',
      defaultValue: ['#FFFFFF', '#FF3333', '#FF8800'],
      group: 'Style',
    },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#0A0000', group: 'Style' },
    {
      key: 'cycleDuration',
      label: 'Cycle Duration (s)',
      type: 'number',
      defaultValue: 1.3,
      min: 0.4,
      max: 4,
      group: 'Timing',
    },
    {
      key: 'impactScale',
      label: 'Impact Scale',
      type: 'number',
      defaultValue: 3.5,
      min: 1.5,
      max: 6,
      group: 'Animation',
    },
  ],
})
