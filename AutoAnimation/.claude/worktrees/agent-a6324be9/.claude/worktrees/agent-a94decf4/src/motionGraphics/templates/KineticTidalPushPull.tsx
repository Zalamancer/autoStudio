import { registerMotionGraphic } from '../registry'
import {
  KineticBase,
  type KineticBaseConfig,
  type KineticAnimation,
  type WordRenderProps,
  type BackgroundRenderProps,
} from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface TidalPushPullConfig extends KineticBaseConfig {
  tidalColor: string
}

function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3)
}

const animation: KineticAnimation = {
  renderBackground: ({ bgColor, width, height, frame, fps }: BackgroundRenderProps) => {
    const time = frame / fps
    // Tidal: slow push (0.4 Hz), secondary chop (1.5 Hz)
    const tidalFreq = 0.35
    const chopFreq = 1.5
    const tidal = (Math.sin(time * tidalFreq * Math.PI * 2) + 1) / 2
    const chop = (Math.sin(time * chopFreq * Math.PI * 2) + 1) / 2

    return (
      <div style={{ position: 'absolute', inset: 0, background: bgColor }}>
        {/* Water body fill */}
        <div
          style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            height: `${30 + tidal * 25}%`,
            background: `linear-gradient(to top,
              rgba(0,100,160,0.35) 0%,
              rgba(0,150,210,${0.15 + chop * 0.08}) 60%,
              transparent 100%)`,
          }}
        />
        {/* Wave crests */}
        {[0, 1, 2].map((wi) => {
          const wPhase = time * (tidalFreq + wi * 0.2) * Math.PI * 2 + wi * 2.1
          const wAmp = height * (0.04 + wi * 0.015)
          const wY = height * (0.68 - wi * 0.08 - tidal * 0.12)
          const points: string[] = []
          const steps = 40
          for (let s = 0; s <= steps; s++) {
            const x = (s / steps) * width
            const y = wY + Math.sin((s / steps) * Math.PI * 4 + wPhase) * wAmp
            points.push(`${x.toFixed(1)},${y.toFixed(1)}`)
          }
          // Close the path to form a filled wave
          points.push(`${width},${height}`, `0,${height}`)
          return (
            <svg
              key={wi}
              style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}
              viewBox={`0 0 ${width} ${height}`}
              preserveAspectRatio="none"
            >
              <polygon points={points.join(' ')} fill={`rgba(0,140,200,${0.12 - wi * 0.03})`} />
            </svg>
          )
        })}
        {/* Foam specks on crest */}
        {Array.from({ length: 6 }).map((_, i) => {
          const px = (i / 6) * width + Math.sin(time * 1.2 + i) * 30
          const py = height * (0.68 - tidal * 0.12) + Math.sin(time * chopFreq * Math.PI * 2 + i * 1.4) * height * 0.035
          return (
            <div
              key={i}
              style={{
                position: 'absolute',
                left: px,
                top: py,
                width: 4 + chop * 4,
                height: 4 + chop * 4,
                borderRadius: '50%',
                background: `rgba(200,240,255,${0.2 + chop * 0.3})`,
                transform: 'translate(-50%, -50%)',
              }}
            />
          )
        })}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: `radial-gradient(ellipse at 50% 30%, transparent 40%, ${bgColor}99 100%)`,
          }}
        />
      </div>
    )
  },

  renderWord: ({ word, color, enterProgress, exitProgress, phase, frame = 0, width = 400 }: WordRenderProps) => {
    const time = frame / 30
    const tidalFreq = 0.35
    const chopFreq = 1.5
    const tidal = (Math.sin(time * tidalFreq * Math.PI * 2) + 1) / 2
    const chop = (Math.sin(time * chopFreq * Math.PI * 2) + 1) / 2

    let opacity = 1
    let scale = 1
    let translateX = 0
    let translateY = 0

    if (phase === 'enter') {
      const eased = easeOutCubic(enterProgress)
      opacity = eased
      scale = 0.85 + 0.15 * eased
      translateX = (1 - eased) * width * 0.08
    } else if (phase === 'hold') {
      // Tidal push-pull: horizontal drift + vertical chop
      translateX = (tidal - 0.5) * 28
      translateY = chop * 8 - 4
      scale = 1 + chop * 0.03
    } else {
      opacity = 1 - exitProgress
      translateX = exitProgress * width * -0.06
    }

    return (
      <div
        style={{
          position: 'absolute',
          top: '40%',
          left: '50%',
          transform: `translate(calc(-50% + ${translateX}px), calc(-50% + ${translateY}px)) scale(${scale})`,
          opacity,
          fontSize: 'clamp(42px, 10.5vw, 142px)',
          fontWeight: 900,
          color,
          whiteSpace: 'nowrap',
          fontFamily: "'Impact', 'Arial Black', sans-serif",
          textTransform: 'uppercase',
          letterSpacing: '0.07em',
          textShadow: `
            0 0 30px ${color}70,
            0 4px 24px rgba(0,0,0,0.7),
            0 0 60px rgba(0,140,200,0.2)
          `,
          zIndex: 10,
        }}
      >
        {word}
      </div>
    )
  },
}

function TidalPushPullComponent(props: MotionGraphicProps<TidalPushPullConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-tidal-push-pull',
  title: 'Kinetic Tidal Push-Pull',
  description:
    'Text drifts horizontally like ocean tides with secondary wave chop. Animated water layers with wave crests and foam specks. Great for lo-fi beach vibes.',
  tags: ['kinetic', 'music', 'tidal', 'wave', 'ocean', 'push', 'pull', 'drift', 'lofi', 'chill'],
  category: 'captions',
  component: TidalPushPullComponent as any,
  defaultConfig: {
    words: ['TIDE', 'PULL', 'DRIFT', 'SURGE'],
    colors: ['#40C8FF', '#20A8E0', '#60D8FF', '#1090C8'],
    bgColor: '#020810',
    cycleDuration: 1.6,
    tidalColor: '#40C8FF',
  },
  configSchema: [
    {
      key: 'words',
      label: 'Words',
      type: 'text-array',
      defaultValue: ['TIDE', 'PULL', 'DRIFT', 'SURGE'],
      group: 'Content',
    },
    {
      key: 'colors',
      label: 'Colors',
      type: 'text-array',
      defaultValue: ['#40C8FF', '#20A8E0', '#60D8FF', '#1090C8'],
      group: 'Style',
    },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#020810', group: 'Style' },
    {
      key: 'cycleDuration',
      label: 'Cycle Duration (s)',
      type: 'number',
      defaultValue: 1.6,
      min: 0.5,
      max: 6,
      group: 'Timing',
    },
    { key: 'tidalColor', label: 'Tidal Color', type: 'color', defaultValue: '#40C8FF', group: 'Animation' },
  ],
})
