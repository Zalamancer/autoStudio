import { registerMotionGraphic } from '../registry'
import {
  KineticBase,
  type KineticBaseConfig,
  type KineticAnimation,
  type WordRenderProps,
  type BackgroundRenderProps,
} from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface FireRepConfig extends KineticBaseConfig {}

function rand(s: number): number {
  const x = Math.sin(s * 127.1 + 311.7) * 43758.5453
  return x - Math.floor(x)
}

function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3)
}

const animation: KineticAnimation = {
  renderBackground: ({ bgColor, frame, fps }: BackgroundRenderProps) => {
    const time = frame / fps

    return (
      <div style={{ position: 'absolute', inset: 0, background: bgColor }}>
        {/* Fire glow from bottom */}
        <div
          style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            height: '50%',
            background: `linear-gradient(180deg, transparent 0%, rgba(255,80,0,0.06) 60%, rgba(255,40,0,0.12) 100%)`,
          }}
        />
        {/* Ember particles */}
        {Array.from({ length: 12 }).map((_, i) => {
          const x = rand(i * 23) * 100
          const speed = 0.8 + rand(i * 47) * 1.5
          const size = 2 + rand(i * 61) * 4
          const yBase = ((time * speed * 25 + rand(i * 83) * 200) % 130) - 10
          const y = 100 - yBase // Rise from bottom
          const wobble = Math.sin(time * 3 + i * 1.5) * 8
          const emberOpacity = y > 10 && y < 90 ? 0.4 + rand(i * 91 + Math.floor(time * 10)) * 0.3 : 0

          return (
            <div
              key={i}
              style={{
                position: 'absolute',
                left: `calc(${x}% + ${wobble}px)`,
                top: `${y}%`,
                width: `${size}px`,
                height: `${size}px`,
                borderRadius: '50%',
                background: `radial-gradient(circle, rgba(255,200,50,${emberOpacity}), rgba(255,80,0,${emberOpacity * 0.5}))`,
                filter: `blur(${size > 4 ? 1 : 0}px)`,
              }}
            />
          )
        })}
        {/* Corner vignette */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: 'radial-gradient(ellipse at 50% 50%, transparent 35%, rgba(0,0,0,0.6) 100%)',
          }}
        />
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
    index,
    frame,
    fps,
  }: WordRenderProps) => {
    const time = (frame ?? 0) / (fps ?? 30)
    let opacity = 1
    let scale = 1
    let translateY = 0

    if (phase === 'enter') {
      // Ignite from center
      const eased = easeOutCubic(enterProgress)
      opacity = eased
      scale = 0.5 + eased * 0.5
    } else if (phase === 'hold') {
      // Rep counter effect: builds intensity over hold
      const repCycle = (holdProgress * 4) % 1
      const repPhase = repCycle < 0.3 ? repCycle / 0.3 : 1 - (repCycle - 0.3) / 0.7
      scale = 1 + repPhase * 0.08
      translateY = -repPhase * 4
      opacity = 1
    } else {
      // Burn out
      opacity = 1 - exitProgress * exitProgress
      scale = 1 + exitProgress * 0.3
    }

    // Fire tongues above text
    const numFlames = 7
    const flames = phase !== 'enter' || enterProgress > 0.5
      ? Array.from({ length: numFlames }).map((_, i) => {
          const flameX = 5 + (i / (numFlames - 1)) * 90
          const flameSeed = index * 50 + i * 31
          const flameSpeed = 2 + rand(flameSeed) * 3
          const flameT = ((time * flameSpeed + rand(flameSeed + 1) * 10) % 1)
          const flameHeight = 15 + rand(flameSeed + 2) * 25
          const flameH = flameHeight * (1 - flameT * 0.6)
          const flameOpacity = phase === 'exit'
            ? (1 - exitProgress) * (1 - flameT * 0.5)
            : (1 - flameT * 0.5) * 0.7

          const hue = 20 + rand(flameSeed + 3 + Math.floor(time * 5)) * 30

          return (
            <div
              key={i}
              style={{
                position: 'absolute',
                left: `${flameX}%`,
                top: `${-flameT * 30 - 5}%`,
                width: 'clamp(6px, 1.2vw, 12px)',
                height: `${flameH}px`,
                borderRadius: '50% 50% 20% 20%',
                background: `linear-gradient(180deg, rgba(255,220,50,${flameOpacity * 0.8}), rgba(255,80,0,${flameOpacity}), transparent)`,
                filter: 'blur(1px)',
                transform: `translateX(-50%) scaleX(${0.6 + rand(flameSeed + Math.floor(time * 8)) * 0.8})`,
              }}
            />
          )
        })
      : []

    // Rep counter
    const repCount = phase === 'hold' ? Math.floor(holdProgress * 4) + 1 : phase === 'exit' ? 4 : 0

    return (
      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: `translate(-50%, -50%) scale(${scale}) translateY(${translateY}px)`,
          opacity,
        }}
      >
        <div style={{ position: 'relative' }}>
          {/* Flame layer */}
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              overflow: 'visible',
            }}
          >
            {flames}
          </div>
          {/* Main text */}
          <div
            style={{
              fontFamily: "'Impact', 'Arial Black', sans-serif",
              fontSize: 'clamp(48px, 14vw, 180px)',
              fontWeight: 900,
              color,
              textTransform: 'uppercase',
              letterSpacing: '0.04em',
              textShadow: `
                0 0 15px ${color}60,
                0 0 40px rgba(255,100,0,0.3),
                0 -4px 20px rgba(255,200,50,0.15),
                0 4px 12px rgba(0,0,0,0.7)
              `,
              whiteSpace: 'nowrap',
              position: 'relative',
              zIndex: 1,
            }}
          >
            {word}
          </div>
          {/* Rep counter badge */}
          {repCount > 0 && (
            <div
              style={{
                position: 'absolute',
                top: '-15%',
                right: '-8%',
                background: 'linear-gradient(135deg, #FF6600, #FF2200)',
                color: '#fff',
                fontSize: 'clamp(14px, 3vw, 28px)',
                fontWeight: 900,
                width: 'clamp(28px, 6vw, 52px)',
                height: 'clamp(28px, 6vw, 52px)',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 2px 12px rgba(255,60,0,0.5)',
                zIndex: 2,
              }}
            >
              {repCount}
            </div>
          )}
        </div>
      </div>
    )
  },
}

function FireRepComponent(props: MotionGraphicProps<FireRepConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-fire-rep',
  title: 'Fire Rep',
  description:
    'Text engulfed in animated fire with a rep counter badge. Flames lick upward from letters, embers rise in background, intensity builds per rep.',
  tags: ['kinetic', 'fire', 'flame', 'rep', 'gym', 'fitness', 'hot', 'intense', 'workout'],
  category: 'captions',
  component: FireRepComponent as any,
  defaultConfig: {
    words: ['BURN', 'FIRE', 'REP', 'MORE'],
    colors: ['#FF4400', '#FF6600', '#FF2200', '#FF5500'],
    bgColor: '#0a0500',
    cycleDuration: 1.4,
  },
  configSchema: [
    { key: 'words', label: 'Words', type: 'text-array', defaultValue: ['BURN', 'FIRE', 'REP', 'MORE'], group: 'Content' },
    { key: 'colors', label: 'Colors', type: 'text-array', defaultValue: ['#FF4400', '#FF6600', '#FF2200', '#FF5500'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#0a0500', group: 'Style' },
    { key: 'cycleDuration', label: 'Cycle Duration (s)', type: 'number', defaultValue: 1.4, min: 0.5, max: 5, group: 'Timing' },
  ],
})
