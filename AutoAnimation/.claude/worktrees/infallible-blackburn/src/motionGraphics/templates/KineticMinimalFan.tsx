import { registerMotionGraphic } from '../registry'
import {
  KineticBase,
  type KineticBaseConfig,
  type KineticAnimation,
  type WordRenderProps,
  type BackgroundRenderProps,
} from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface MinimalFanConfig extends KineticBaseConfig {}

const animation: KineticAnimation = {
  renderBackground: ({ bgColor }: BackgroundRenderProps) => (
    <div style={{ position: 'absolute', inset: 0, background: bgColor }} />
  ),

  renderWord: ({
    word,
    color,
    enterProgress,
    exitProgress,
    phase,
  }: WordRenderProps) => {
    const chars = word.split('')
    const n = chars.length

    // Fan spread: outermost chars get the most rotation offset
    // Center index for mapping
    const center = (n - 1) / 2

    return (
      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          display: 'flex',
          alignItems: 'center',
        }}
      >
        {chars.map((char, i) => {
          const delay = i / n

          let charP = 0
          if (phase === 'enter') {
            charP = Math.max(0, Math.min(1, (enterProgress - delay * 0.6) / 0.4))
          } else if (phase === 'hold') {
            charP = 1
          } else {
            charP = 1 - Math.max(0, Math.min(1, (exitProgress - delay * 0.6) / 0.4))
          }

          // Ease out back (slight overshoot)
          const c1 = 1.70158
          const c3 = c1 + 1
          const eased =
            charP === 1
              ? 1
              : charP === 0
              ? 0
              : 1 + c3 * Math.pow(charP - 1, 3) + c1 * Math.pow(charP - 1, 2)

          // Distance from center determines fan angle
          const distFromCenter = (i - center) / Math.max(center, 1)
          // At charP=0 all chars overlap at center with fan rotation; at charP=1 they're in final position
          const fanAngle = distFromCenter * 25 * (1 - eased)
          const fanTranslateX = distFromCenter * 60 * (1 - eased) * -1
          const opacity = Math.min(1, eased * 1.5)

          return (
            <span
              key={i}
              style={{
                display: 'inline-block',
                fontFamily: "'Inter', 'Helvetica Neue', Arial, sans-serif",
                fontSize: 'clamp(36px, 8vw, 120px)',
                fontWeight: 700,
                letterSpacing: '0.04em',
                color,
                opacity,
                transform: `translateX(${fanTranslateX}px) rotate(${fanAngle}deg)`,
                transformOrigin: 'center bottom',
              }}
            >
              {char === ' ' ? '\u00A0' : char}
            </span>
          )
        })}
      </div>
    )
  },
}

function MinimalFanComponent(props: MotionGraphicProps<MinimalFanConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-minimal-fan',
  title: 'Minimal Fan',
  description:
    'Letters fan out from center like a hand of cards — outer characters receive progressively more rotation as they spread into position.',
  tags: ['kinetic', 'minimal', 'fan', 'cards', 'spread', 'rotate', 'stagger', 'character'],
  category: 'captions',
  component: MinimalFanComponent as any,
  defaultConfig: {
    words: ['SPREAD', 'CARDS', 'OPEN', 'FAN'],
    colors: ['#111111', '#222222', '#333333', '#111111'],
    bgColor: '#ffffff',
    cycleDuration: 1.5,
  },
  configSchema: [
    {
      key: 'words',
      label: 'Words',
      type: 'text-array',
      defaultValue: ['SPREAD', 'CARDS', 'OPEN', 'FAN'],
      group: 'Content',
    },
    {
      key: 'colors',
      label: 'Colors',
      type: 'text-array',
      defaultValue: ['#111111', '#222222', '#333333', '#111111'],
      group: 'Style',
    },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#ffffff', group: 'Style' },
    {
      key: 'cycleDuration',
      label: 'Cycle Duration (s)',
      type: 'number',
      defaultValue: 1.5,
      min: 0.5,
      max: 5,
      group: 'Timing',
    },
  ],
})
