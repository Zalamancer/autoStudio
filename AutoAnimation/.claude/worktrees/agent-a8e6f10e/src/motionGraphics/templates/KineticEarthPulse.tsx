import { registerMotionGraphic } from '../registry'
import {
  KineticBase,
  type KineticBaseConfig,
  type KineticAnimation,
  type WordRenderProps,
  type BackgroundRenderProps,
} from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface EarthPulseConfig extends KineticBaseConfig {}

function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3)
}

function easeOutBack(t: number): number {
  const c1 = 1.70158
  const c3 = c1 + 1
  return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2)
}

const animation: KineticAnimation = {
  renderBackground: ({ bgColor }: BackgroundRenderProps) => (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        background: `radial-gradient(circle at 50% 50%, #0a2a3a, ${bgColor})`,
      }}
    />
  ),

  renderWord: ({
    word,
    color,
    enterProgress,
    holdProgress,
    exitProgress,
    phase,
    frame = 0,
  }: WordRenderProps) => {
    let opacity = 1
    let textScale = 1

    if (phase === 'enter') {
      opacity = easeOutCubic(enterProgress)
      textScale = easeOutBack(Math.min(1, enterProgress / 0.8))
    } else if (phase === 'hold') {
      textScale = 1
    } else {
      opacity = 1 - easeOutCubic(exitProgress)
      textScale = 1 + exitProgress * 0.2
    }

    const time = frame * 0.03

    // Pulsing earth/globe rings
    const ringCount = 4
    const rings = Array.from({ length: ringCount }, (_, i) => {
      const basePulse = Math.sin(time * 1.5 + i * 0.8) * 0.5 + 0.5
      const ringScale = phase === 'hold'
        ? 0.7 + i * 0.25 + basePulse * 0.15
        : phase === 'enter'
          ? (0.7 + i * 0.25) * easeOutCubic(Math.max(0, (enterProgress - i * 0.1) / 0.6))
          : (0.7 + i * 0.25) * (1 - exitProgress)
      const ringOpacity = phase === 'hold'
        ? 0.15 + basePulse * 0.1
        : phase === 'enter'
          ? easeOutCubic(Math.max(0, (enterProgress - i * 0.15) / 0.5)) * 0.2
          : 0.2 * (1 - exitProgress)
      return { scale: ringScale, opacity: ringOpacity }
    })

    // Globe rotation effect
    const globeRotation = phase === 'hold'
      ? holdProgress * 360
      : phase === 'enter'
        ? enterProgress * 180
        : 180 + exitProgress * 90

    const pulseGlow = phase === 'hold'
      ? 15 + Math.sin(time * 2) * 10
      : phase === 'enter'
        ? enterProgress * 15
        : 15 * (1 - exitProgress)

    return (
      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          opacity,
        }}
      >
        {/* Pulsing concentric rings */}
        {rings.map((ring, i) => (
          <div
            key={i}
            style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              width: '320px',
              height: '320px',
              transform: `translate(-50%, -50%) scale(${ring.scale})`,
              border: `2px solid rgba(56,142,60,${ring.opacity})`,
              borderRadius: '50%',
              pointerEvents: 'none',
            }}
          />
        ))}

        {/* Globe background circle */}
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            width: '220px',
            height: '220px',
            transform: 'translate(-50%, -50%)',
            borderRadius: '50%',
            background: `conic-gradient(
              from ${globeRotation}deg,
              rgba(33,150,243,0.15),
              rgba(76,175,80,0.2),
              rgba(33,150,243,0.15),
              rgba(76,175,80,0.2),
              rgba(33,150,243,0.15)
            )`,
            boxShadow: `0 0 ${pulseGlow * 2}px rgba(76,175,80,0.3), inset 0 0 40px rgba(33,150,243,0.1)`,
            pointerEvents: 'none',
          }}
        />

        {/* Latitude lines on globe */}
        {[0.3, 0.5, 0.7].map((pos, i) => (
          <div
            key={`lat-${i}`}
            style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              width: `${220 * Math.sin(pos * Math.PI)}px`,
              height: '1px',
              transform: `translate(-50%, ${(pos - 0.5) * 220}px)`,
              background: `rgba(76,175,80,${phase === 'hold' ? 0.15 + Math.sin(time + i) * 0.05 : 0.1})`,
              pointerEvents: 'none',
            }}
          />
        ))}

        {/* Main text */}
        <div
          style={{
            fontFamily: "'Trebuchet MS', 'Helvetica Neue', sans-serif",
            fontSize: 'clamp(36px, 10vw, 120px)',
            fontWeight: 900,
            color,
            transform: `scale(${textScale})`,
            textShadow: `0 0 ${pulseGlow}px rgba(76,175,80,0.6), 0 2px 8px rgba(0,0,0,0.4)`,
            whiteSpace: 'nowrap',
            position: 'relative',
            zIndex: 1,
            letterSpacing: '-0.02em',
          }}
        >
          {word}
        </div>
      </div>
    )
  },
}

function EarthPulseComponent(props: MotionGraphicProps<EarthPulseConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-earth-pulse',
  title: 'Earth Pulse',
  description:
    'Text with pulsing earth/globe effect. Concentric rings pulse outward while a rotating globe gradient glows behind the text.',
  tags: ['kinetic', 'earth', 'globe', 'pulse', 'eco', 'planet', 'sustainability', 'nature'],
  category: 'captions',
  component: EarthPulseComponent as any,
  defaultConfig: {
    words: ['EARTH', 'PLANET', 'HOME', 'PROTECT'],
    colors: ['#A5D6A7', '#81C784', '#4FC3F7', '#66BB6A'],
    bgColor: '#0a1520',
    cycleDuration: 1.8,
  },
  configSchema: [
    {
      key: 'words',
      label: 'Words',
      type: 'text-array',
      defaultValue: ['EARTH', 'PLANET', 'HOME', 'PROTECT'],
      group: 'Content',
    },
    {
      key: 'colors',
      label: 'Colors',
      type: 'text-array',
      defaultValue: ['#A5D6A7', '#81C784', '#4FC3F7', '#66BB6A'],
      group: 'Style',
    },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#0a1520', group: 'Style' },
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
