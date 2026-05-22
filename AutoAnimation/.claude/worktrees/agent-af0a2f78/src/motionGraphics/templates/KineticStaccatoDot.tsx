import { registerMotionGraphic } from '../registry'
import {
  KineticBase,
  type KineticBaseConfig,
  type KineticAnimation,
  type WordRenderProps,
  type BackgroundRenderProps,
} from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface StaccatoDotConfig extends KineticBaseConfig {
  dotColor: string
  bounceIntensity: number
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

    // Bouncing dots pattern in background (like staccato markings on a page)
    const dotGrid = Array.from({ length: 24 }).map((_, i) => {
      const col = i % 6
      const row = Math.floor(i / 6)
      const x = width * (0.12 + col * 0.14)
      const y = height * (0.15 + row * 0.2)
      const bounceDelay = (col + row) * 0.15
      const bounceT = ((time + bounceDelay) * 3) % 1
      const bounceY = -Math.abs(Math.sin(bounceT * Math.PI)) * 12
      const dotOpacity = 0.06 + 0.04 * Math.sin(time * 2 + i * 0.5)

      return { x, y, bounceY, opacity: dotOpacity }
    })

    // Staff lines
    const staffY = height * 0.5
    const staffGap = height * 0.035

    return (
      <div style={{ position: 'absolute', inset: 0, background: bgColor }}>
        {/* Subtle warm gradient */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: 'radial-gradient(ellipse at 50% 50%, rgba(255,120,80,0.03) 0%, transparent 60%)',
          }}
        />

        {/* Staff lines */}
        {Array.from({ length: 5 }).map((_, i) => (
          <div
            key={i}
            style={{
              position: 'absolute',
              left: '8%',
              right: '8%',
              top: staffY - staffGap * 2 + i * staffGap,
              height: 1,
              background: 'rgba(255,255,255,0.06)',
            }}
          />
        ))}

        {/* Bouncing background dots */}
        {dotGrid.map((dot, i) => (
          <div
            key={i}
            style={{
              position: 'absolute',
              left: dot.x - 3,
              top: dot.y + dot.bounceY,
              width: 6,
              height: 6,
              borderRadius: '50%',
              background: `rgba(255,140,100,${dot.opacity})`,
            }}
          />
        ))}

        {/* Staccato notation example in corner */}
        <div
          style={{
            position: 'absolute',
            bottom: '8%',
            right: '8%',
            display: 'flex',
            gap: 14,
            alignItems: 'flex-end',
          }}
        >
          {Array.from({ length: 4 }).map((_, i) => {
            const noteTime = ((time * 4 + i * 0.25) % 1)
            const noteBounce = -Math.abs(Math.sin(noteTime * Math.PI)) * 8
            return (
              <div
                key={i}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: 3,
                  transform: `translateY(${noteBounce}px)`,
                }}
              >
                {/* Staccato dot above */}
                <div
                  style={{
                    width: 4,
                    height: 4,
                    borderRadius: '50%',
                    background: 'rgba(255,180,140,0.2)',
                  }}
                />
                {/* Note head */}
                <div
                  style={{
                    width: 8,
                    height: 6,
                    borderRadius: '50%',
                    background: 'rgba(255,180,140,0.15)',
                  }}
                />
              </div>
            )
          })}
        </div>
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
  }: WordRenderProps) => {
    // Split word into individual letters for per-letter staccato bounce
    const letters = word.split('')

    return (
      <div
        style={{
          position: 'absolute',
          top: '48%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          display: 'flex',
          alignItems: 'center',
          gap: 0,
          zIndex: 10,
        }}
      >
        {letters.map((letter, i) => {
          const letterDelay = i * 0.12
          let opacity = 1
          let translateY = 0
          let scale = 1
          let dotOpacity = 0

          if (phase === 'enter') {
            // Each letter bounces in with staccato-like crisp timing
            const letterProgress = Math.max(0, Math.min(1, (enterProgress - letterDelay) / (1 - letterDelay * letters.length * 0.3)))
            const bounced = easeOutBounce(Math.max(0, Math.min(1, letterProgress)))
            opacity = letterProgress > 0 ? 1 : 0
            translateY = (1 - bounced) * -60
            scale = 0.5 + 0.5 * bounced
            dotOpacity = bounced
          } else if (phase === 'hold') {
            // Crisp staccato bouncing during hold: each letter bounces independently
            const bounceFreq = 6 + i * 0.8
            const bouncePhase = holdProgress * bounceFreq + i * 0.4
            const bounce = Math.abs(Math.sin(bouncePhase * Math.PI))
            translateY = -bounce * 14
            scale = 1 - bounce * 0.05
            dotOpacity = 1
          } else {
            // Sharp exit: letters pop away one by one
            const exitDelay = i * 0.1
            const letterExit = Math.max(0, Math.min(1, (exitProgress - exitDelay) / (1 - exitDelay)))
            opacity = 1 - letterExit
            translateY = -letterExit * 40
            scale = 1 + letterExit * 0.3
            dotOpacity = 1 - letterExit
          }

          return (
            <div
              key={i}
              style={{
                display: 'inline-flex',
                flexDirection: 'column',
                alignItems: 'center',
                transform: `translateY(${translateY}px) scale(${scale})`,
                opacity,
              }}
            >
              {/* Staccato dot above each letter */}
              <div
                style={{
                  width: 'clamp(4px, 1vw, 8px)',
                  height: 'clamp(4px, 1vw, 8px)',
                  borderRadius: '50%',
                  background: color,
                  marginBottom: 'clamp(3px, 0.8vw, 8px)',
                  opacity: dotOpacity * 0.7,
                  boxShadow: `0 0 6px ${color}40`,
                }}
              />

              {/* Letter */}
              <span
                style={{
                  fontSize: 'clamp(36px, 10vw, 130px)',
                  fontWeight: 800,
                  color,
                  fontFamily: "'Georgia', 'Palatino', serif",
                  textShadow: `0 2px 12px rgba(0,0,0,0.4)`,
                  lineHeight: 1,
                }}
              >
                {letter}
              </span>
            </div>
          )
        })}
      </div>
    )
  },
}

function StaccatoDotComponent(props: MotionGraphicProps<StaccatoDotConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-staccato-dot',
  title: 'Kinetic Staccato Dot',
  description:
    'Staccato bounce: each letter bounces in crisp and detached like staccato notes, short sharp spring with a dot above each letter.',
  tags: ['kinetic', 'music', 'staccato', 'bounce', 'dot', 'crisp', 'detached', 'notes'],
  category: 'captions',
  component: StaccatoDotComponent as any,
  defaultConfig: {
    words: ['SNAP', 'CRISP', 'SHARP', 'POP'],
    colors: ['#FF8C66', '#FF6B4A', '#FF9E80', '#FFB399'],
    bgColor: '#120A06',
    cycleDuration: 1.3,
    dotColor: '#FF8C66',
    bounceIntensity: 1.0,
  },
  configSchema: [
    {
      key: 'words',
      label: 'Words',
      type: 'text-array',
      defaultValue: ['SNAP', 'CRISP', 'SHARP', 'POP'],
      group: 'Content',
    },
    {
      key: 'colors',
      label: 'Colors',
      type: 'text-array',
      defaultValue: ['#FF8C66', '#FF6B4A', '#FF9E80', '#FFB399'],
      group: 'Style',
    },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#120A06', group: 'Style' },
    {
      key: 'cycleDuration',
      label: 'Cycle Duration (s)',
      type: 'number',
      defaultValue: 1.3,
      min: 0.3,
      max: 5,
      group: 'Timing',
    },
  ],
})
