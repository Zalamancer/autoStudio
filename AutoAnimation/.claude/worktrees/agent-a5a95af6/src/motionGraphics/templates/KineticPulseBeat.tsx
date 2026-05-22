import { registerMotionGraphic } from '../registry'
import {
  KineticBase,
  type KineticBaseConfig,
  type KineticAnimation,
  type WordRenderProps,
  type BackgroundRenderProps,
} from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface PulseBeatConfig extends KineticBaseConfig {}

function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3)
}

const animation: KineticAnimation = {
  renderBackground: ({ bgColor, width, height, frame, fps }: BackgroundRenderProps) => {
    const time = frame / fps
    // Heartbeat: two quick beats then pause (lub-dub pattern)
    const beatCycle = time % 1.0
    let beatIntensity = 0
    if (beatCycle < 0.08) {
      beatIntensity = beatCycle / 0.08
    } else if (beatCycle < 0.15) {
      beatIntensity = 1 - (beatCycle - 0.08) / 0.07
    } else if (beatCycle > 0.22 && beatCycle < 0.30) {
      beatIntensity = (beatCycle - 0.22) / 0.08 * 0.7
    } else if (beatCycle >= 0.30 && beatCycle < 0.38) {
      beatIntensity = 0.7 * (1 - (beatCycle - 0.30) / 0.08)
    }

    const glowRadius = 25 + beatIntensity * 30

    return (
      <div style={{ position: 'absolute', inset: 0, background: bgColor }}>
        {/* Heart glow */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: `radial-gradient(circle at 50% 50%, rgba(220,30,30,${beatIntensity * 0.15}), transparent ${glowRadius}%)`,
          }}
        />
        {/* ECG line */}
        <svg
          viewBox="0 0 1000 100"
          style={{
            position: 'absolute',
            bottom: '15%',
            left: 0,
            width: '100%',
            height: '12%',
            opacity: 0.12 + beatIntensity * 0.1,
          }}
        >
          <polyline
            points={(() => {
              const offset = (time * 200) % 1000
              const pts: string[] = []
              for (let x = 0; x < 1000; x += 4) {
                const localX = (x + offset) % 400
                let y = 50
                // QRS complex pattern
                if (localX > 140 && localX < 150) y = 50 - 15
                else if (localX > 150 && localX < 160) y = 50 + 40
                else if (localX > 160 && localX < 170) y = 50 - 25
                else if (localX > 170 && localX < 185) y = 50 + 5
                else if (localX > 220 && localX < 250) y = 50 - 8
                pts.push(`${x},${y}`)
              }
              return pts.join(' ')
            })()}
            fill="none"
            stroke="#FF3030"
            strokeWidth="2"
          />
        </svg>
        {/* Pulse rings */}
        {[0, 1].map((i) => {
          const ringDelay = i * 0.12
          const ringCycle = ((time - ringDelay) % 1.0)
          const ringScale = 0.5 + ringCycle * 1.5
          const ringOpacity = Math.max(0, (1 - ringCycle) * 0.12 * beatIntensity)

          return (
            <div
              key={i}
              style={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                width: Math.min(width, height) * 0.4,
                height: Math.min(width, height) * 0.4,
                borderRadius: '50%',
                border: '2px solid rgba(255,50,50,0.4)',
                transform: `translate(-50%, -50%) scale(${ringScale})`,
                opacity: ringOpacity,
              }}
            />
          )
        })}
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
    frame,
    fps,
  }: WordRenderProps) => {
    const time = (frame ?? 0) / (fps ?? 30)
    let opacity = 1
    let scale = 1

    if (phase === 'enter') {
      const eased = easeOutCubic(enterProgress)
      opacity = eased
      scale = 0.7 + eased * 0.3
    } else if (phase === 'hold') {
      // Heartbeat scaling: lub-dub
      const beatCycle = (holdProgress * 5) % 1
      let beatPulse = 0
      if (beatCycle < 0.08) {
        beatPulse = beatCycle / 0.08
      } else if (beatCycle < 0.15) {
        beatPulse = 1 - (beatCycle - 0.08) / 0.07
      } else if (beatCycle > 0.22 && beatCycle < 0.30) {
        beatPulse = (beatCycle - 0.22) / 0.08 * 0.6
      } else if (beatCycle >= 0.30 && beatCycle < 0.38) {
        beatPulse = 0.6 * (1 - (beatCycle - 0.30) / 0.08)
      }

      scale = 1 + beatPulse * 0.12
      opacity = 1
    } else {
      // Flatline exit
      opacity = 1 - exitProgress
      scale = 1 - exitProgress * 0.15
    }

    const glowSize = (scale - 1) * 200 + 8

    return (
      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: `translate(-50%, -50%) scale(${scale})`,
          opacity,
        }}
      >
        <div
          style={{
            fontFamily: "'Impact', 'Arial Black', sans-serif",
            fontSize: 'clamp(48px, 13vw, 170px)',
            fontWeight: 900,
            color,
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            textShadow: `
              0 0 ${glowSize}px ${color}50,
              0 0 ${glowSize * 2}px rgba(255,30,30,0.2),
              0 3px 10px rgba(0,0,0,0.6)
            `,
            whiteSpace: 'nowrap',
          }}
        >
          {word}
        </div>
      </div>
    )
  },
}

function PulseBeatComponent(props: MotionGraphicProps<PulseBeatConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-pulse-beat',
  title: 'Pulse Beat',
  description:
    'Text pulsing to a heartbeat rhythm with lub-dub pattern. ECG line traces across background with pulsing red glow and concentric rings.',
  tags: ['kinetic', 'pulse', 'heartbeat', 'fitness', 'cardio', 'health', 'rhythm', 'gym'],
  category: 'captions',
  component: PulseBeatComponent as any,
  defaultConfig: {
    words: ['PUSH', 'HEART', 'BEAT', 'ALIVE'],
    colors: ['#FF2222', '#FF4444', '#CC0000', '#FF3333'],
    bgColor: '#080008',
    cycleDuration: 1.3,
  },
  configSchema: [
    { key: 'words', label: 'Words', type: 'text-array', defaultValue: ['PUSH', 'HEART', 'BEAT', 'ALIVE'], group: 'Content' },
    { key: 'colors', label: 'Colors', type: 'text-array', defaultValue: ['#FF2222', '#FF4444', '#CC0000', '#FF3333'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#080008', group: 'Style' },
    { key: 'cycleDuration', label: 'Cycle Duration (s)', type: 'number', defaultValue: 1.3, min: 0.5, max: 5, group: 'Timing' },
  ],
})
