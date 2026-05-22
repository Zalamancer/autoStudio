import { registerMotionGraphic } from '../registry'
import { KineticBase, type KineticBaseConfig, type KineticAnimation, type WordRenderProps, type BackgroundRenderProps } from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface SparklerWriteConfig extends KineticBaseConfig {
  sparkIntensity: number
}

function easeOutExpo(t: number): number {
  return t === 1 ? 1 : 1 - Math.pow(2, -10 * t)
}

function rand(s: number): number {
  const x = Math.sin(s * 127.1 + 311.7) * 43758.5453
  return x - Math.floor(x)
}

const animation: KineticAnimation = {
  renderBackground: ({ bgColor, frame, fps }: BackgroundRenderProps) => {
    const time = frame / fps
    return (
      <div style={{ position: 'absolute', inset: 0, background: bgColor }}>
        {/* Night sky atmosphere — faint stars */}
        {Array.from({ length: 20 }, (_, i) => {
          const rx = rand(i * 53) * 100
          const ry = rand(i * 71) * 100
          const rs = rand(i * 43) * 1.5 + 0.5
          const twinkle = Math.sin(time * (1 + rand(i * 29) * 3) + i * 2.3) * 0.5 + 0.5
          return (
            <div
              key={i}
              style={{
                position: 'absolute',
                left: `${rx}%`,
                top: `${ry}%`,
                width: rs,
                height: rs,
                borderRadius: '50%',
                background: `rgba(255,255,255,${twinkle * 0.4})`,
              }}
            />
          )
        })}
      </div>
    )
  },

  renderWord: ({ word, color, enterProgress, holdProgress, exitProgress, phase, index, frame }: WordRenderProps) => {
    const f = frame ?? 0
    const time = f / 30

    let opacity = 0
    let revealClip = 0
    let sparkActivity = 0
    let trailFade = 0

    if (phase === 'enter') {
      const p = easeOutExpo(enterProgress)
      opacity = 1
      revealClip = enterProgress // draw at constant speed
      sparkActivity = 1
      trailFade = p
    } else if (phase === 'hold') {
      opacity = 1
      revealClip = 1
      sparkActivity = 0.3 + Math.sin(holdProgress * Math.PI * 6) * 0.1
      trailFade = 1
    } else {
      opacity = 1 - exitProgress
      revealClip = 1
      sparkActivity = 0.2 * (1 - exitProgress)
      trailFade = 1 - exitProgress
    }

    const tipX = revealClip * 100
    const sparkCount = 16
    // Tip position estimate in the word (left-to-right across ~80% of frame width)
    const tipPx = (tipX / 100 - 0.5) * 70

    // Sparks emanating from tip
    const sparks = (revealClip > 0.02 && revealClip < 0.98)
      ? Array.from({ length: sparkCount }, (_, i) => {
          const seed = i * 59 + f + index * 37
          const angle = rand(seed) * 360
          const dist = rand(seed + 1) * 35 + 5
          const rad = (angle * Math.PI) / 180
          const sx = Math.cos(rad) * dist
          const sy = Math.sin(rad) * dist
          const size = rand(seed + 2) * 4 + 1.5
          const age = rand(seed + 3)
          const sparkOpacity = (1 - age) * sparkActivity
          const sparkColor = rand(seed + 4) > 0.5 ? '#FFDD88' : '#FFAA33'

          return (
            <div
              key={i}
              style={{
                position: 'absolute',
                top: `calc(50% + ${sy}px)`,
                left: `calc(50% + ${tipPx + sx}vw)`,
                width: size,
                height: size * (1 + rand(seed + 5) * 3), // sparks are elongated
                borderRadius: size,
                background: sparkColor,
                opacity: sparkOpacity,
                filter: 'blur(0.5px)',
                transform: `translate(-50%, -50%) rotate(${angle}deg)`,
              }}
            />
          )
        })
      : null

    return (
      <>
        {/* Persisted glow trail (the after-burn of the sparkler) */}
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            fontFamily: "'Georgia', serif",
            fontSize: 'clamp(40px, 12vw, 160px)',
            fontWeight: 900,
            textTransform: 'uppercase',
            letterSpacing: 8,
            color: `rgba(255,180,60,${trailFade * 0.25})`,
            opacity,
            whiteSpace: 'nowrap',
            clipPath: `inset(0 ${100 - tipX}% 0 0)`,
            filter: 'blur(3px)',
          }}
        >
          {word}
        </div>
        {/* Main bright sparkler-drawn text */}
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            fontFamily: "'Georgia', serif",
            fontSize: 'clamp(40px, 12vw, 160px)',
            fontWeight: 900,
            textTransform: 'uppercase',
            letterSpacing: 8,
            color,
            opacity,
            whiteSpace: 'nowrap',
            clipPath: `inset(0 ${100 - tipX}% 0 0)`,
            textShadow: `0 0 12px ${color}, 0 0 25px rgba(255,200,80,0.6), 0 0 50px rgba(255,140,40,0.3)`,
          }}
        >
          {word}
        </div>
        {/* Sparkler tip flare */}
        {revealClip > 0.01 && revealClip < 0.99 && (
          <div
            style={{
              position: 'absolute',
              top: '50%',
              left: `calc(50% + ${tipPx}vw)`,
              transform: 'translate(-50%, -50%)',
              width: 20,
              height: 20,
              borderRadius: '50%',
              background: 'radial-gradient(circle, rgba(255,255,255,0.95) 0%, rgba(255,220,100,0.8) 30%, rgba(255,150,40,0.4) 60%, transparent 80%)',
              filter: 'blur(3px)',
              opacity,
            }}
          />
        )}
        {/* Sparks */}
        <div style={{ position: 'absolute', inset: 0, overflow: 'hidden' }}>
          {sparks}
        </div>
      </>
    )
  },
}

function SparklerWriteComponent(props: MotionGraphicProps<SparklerWriteConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-sparkler-write',
  title: 'Kinetic Sparkler Write',
  description: 'A sparkler writes text in the dark — fiery particles burst from the writing tip as glowing letterforms are drawn one by one against a night sky',
  tags: ['kinetic', 'typography', 'sparkler', 'write', 'fire', 'light-painting', 'dark', 'night', 'particles'],
  category: 'captions',
  component: SparklerWriteComponent as any,
  defaultConfig: {
    words: ['SPARK', 'WRITE', 'FIRE', 'NIGHT'],
    colors: ['#FFD060', '#FF9020', '#FFBE40', '#FFC050'],
    bgColor: '#030408',
    cycleDuration: 2.0,
    sparkIntensity: 80,
  },
  configSchema: [
    { key: 'words', label: 'Words', type: 'text-array', defaultValue: ['SPARK', 'WRITE', 'FIRE', 'NIGHT'], group: 'Content' },
    { key: 'colors', label: 'Colors', type: 'text-array', defaultValue: ['#FFD060', '#FF9020', '#FFBE40', '#FFC050'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#030408', group: 'Style' },
    { key: 'cycleDuration', label: 'Cycle Duration (s)', type: 'number', defaultValue: 2.0, min: 0.5, max: 5, group: 'Timing' },
    { key: 'sparkIntensity', label: 'Spark Intensity', type: 'number', defaultValue: 80, min: 20, max: 100, group: 'Animation' },
  ],
})
