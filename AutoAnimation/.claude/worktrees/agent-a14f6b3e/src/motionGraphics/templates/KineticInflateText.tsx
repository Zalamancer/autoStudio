import { registerMotionGraphic } from '../registry'
import {
  KineticBase,
  type KineticBaseConfig,
  type KineticAnimation,
  type WordRenderProps,
  type BackgroundRenderProps,
} from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface InflateTextConfig extends KineticBaseConfig {}

function seededRandom(seed: number): number {
  const x = Math.sin(seed * 127.1 + 311.7) * 43758.5453
  return x - Math.floor(x)
}

function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3)
}

function easeInCubic(t: number): number {
  return t * t * t
}

const animation: KineticAnimation = {
  renderBackground: ({ bgColor }: BackgroundRenderProps) => (
    <div style={{ position: 'absolute', inset: 0, background: bgColor }} />
  ),

  renderWord: ({
    word,
    color,
    enterProgress,
    holdProgress,
    exitProgress,
    phase,
    index,
  }: WordRenderProps) => {
    const letters = word.split('')

    return (
      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {letters.map((letter, i) => {
          const seed = index * 100 + i
          // Stagger inflation: each letter inflates slightly after the previous
          const stagger = (i / Math.max(letters.length - 1, 1)) * 0.35
          let scale = 1
          let opacity = 1
          let borderRadius = '4px'
          let scaleX = 1
          let scaleY = 1
          let letterSpacing = 0

          if (phase === 'enter') {
            const t = Math.max(0, Math.min(1, (enterProgress - stagger) / (1 - stagger)))
            const eased = easeOutCubic(t)
            // Start deflated (scale 0), overshoot like a balloon inflating
            const overshoot = t < 0.8
              ? eased * 1.25
              : 1.25 - (eased - easeOutCubic(0.8)) * 0.25 / (1 - easeOutCubic(0.8))

            scale = Math.max(0.01, overshoot)
            // Balloon inflation: wider than tall at full inflation
            scaleX = scale * (1 + eased * 0.15)
            scaleY = scale * (1 - eased * 0.08)
            opacity = Math.min(1, t * 3)
            // Rounded like a balloon when inflated
            borderRadius = `${eased * 30}%`
          } else if (phase === 'hold') {
            // Gentle pulsing — balloon breathes slowly
            const breathe = Math.sin(holdProgress * Math.PI * 3 + seededRandom(seed) * Math.PI * 2) * 0.03
            scaleX = 1.15 + breathe
            scaleY = 0.92 - breathe * 0.5
            borderRadius = '20%'
            opacity = 1
          } else {
            // Exit: balloon deflates and flies upward like released
            const t = easeInCubic(exitProgress)
            const deflate = 1 - t * 0.7
            // Jitter as air escapes
            const jitterX = (seededRandom(seed + 20) - 0.5) * t * 20
            const jitterY = -t * 60 * (seededRandom(seed + 21) * 0.5 + 0.5) // flies up
            scaleX = deflate * (1 + t * 0.3) // stretches thin as deflates
            scaleY = deflate * (1 - t * 0.3)
            opacity = 1 - t
            borderRadius = `${(1 - t) * 20}%`
            return (
              <span
                key={i}
                style={{
                  display: 'inline-block',
                  fontFamily: "'Arial Black', 'Impact', sans-serif",
                  fontSize: 'clamp(48px, 12vw, 160px)',
                  fontWeight: 900,
                  color,
                  transform: `translate(${jitterX}px, ${jitterY}px) scaleX(${scaleX}) scaleY(${scaleY})`,
                  opacity,
                  borderRadius,
                  whiteSpace: 'pre',
                  textShadow: '0 4px 12px rgba(0,0,0,0.3)',
                  letterSpacing: `${letterSpacing}px`,
                }}
              >
                {letter}
              </span>
            )
          }

          return (
            <span
              key={i}
              style={{
                display: 'inline-block',
                fontFamily: "'Arial Black', 'Impact', sans-serif",
                fontSize: 'clamp(48px, 12vw, 160px)',
                fontWeight: 900,
                color,
                transform: `scaleX(${scaleX}) scaleY(${scaleY})`,
                opacity,
                borderRadius,
                whiteSpace: 'pre',
                textShadow: '0 4px 12px rgba(0,0,0,0.3)',
                letterSpacing: `${letterSpacing}px`,
              }}
            >
              {letter}
            </span>
          )
        })}
      </div>
    )
  },
}

function InflateTextComponent(props: MotionGraphicProps<InflateTextConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-inflate-text',
  title: 'Inflate Text',
  description:
    'Text inflates letter by letter like balloons filling with air. Each character puffs outward with rounded balloon-like distortion, gently pulses while held, then deflates and floats away.',
  tags: ['kinetic', 'inflate', 'balloon', 'physics', 'material', 'puff', 'scale'],
  category: 'captions',
  component: InflateTextComponent as any,
  defaultConfig: {
    words: ['PUFF', 'FLOAT', 'RISE', 'SOAR'],
    colors: ['#FF6B9D', '#C084FC', '#60A5FA', '#34D399'],
    bgColor: '#0f172a',
    cycleDuration: 1.8,
  },
  configSchema: [
    {
      key: 'words',
      label: 'Words',
      type: 'text-array',
      defaultValue: ['PUFF', 'FLOAT', 'RISE', 'SOAR'],
      group: 'Content',
    },
    {
      key: 'colors',
      label: 'Colors',
      type: 'text-array',
      defaultValue: ['#FF6B9D', '#C084FC', '#60A5FA', '#34D399'],
      group: 'Style',
    },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#0f172a', group: 'Style' },
    {
      key: 'cycleDuration',
      label: 'Cycle Duration (s)',
      type: 'number',
      defaultValue: 1.8,
      min: 0.5,
      max: 5,
      group: 'Timing',
    },
  ],
})
