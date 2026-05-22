import { registerMotionGraphic } from '../registry'
import {
  KineticBase,
  type KineticBaseConfig,
  type KineticAnimation,
  type WordRenderProps,
  type BackgroundRenderProps,
} from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface MixerFaderConfig extends KineticBaseConfig {
  faderColor: string
}

function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3)
}

const animation: KineticAnimation = {
  renderBackground: ({ bgColor, width, height, frame, fps }: BackgroundRenderProps) => {
    const time = frame / fps
    const channelCount = 8

    const channels = Array.from({ length: channelCount }).map((_, i) => {
      const channelWidth = width * 0.09
      const x = width * 0.1 + (i / (channelCount - 1)) * width * 0.8
      const faderPosition = 0.3 + 0.35 * Math.sin(time * 1.5 + i * 0.8) + 0.15 * Math.cos(time * 2.3 + i * 1.1)
      const faderY = height * 0.2 + faderPosition * height * 0.5

      // Level meter for this channel
      const level = 0.2 + 0.6 * Math.abs(Math.sin(time * 3 + i * 0.6))
      const meterSegments = 8

      return (
        <div key={i} style={{ position: 'absolute', left: x - channelWidth / 2, top: 0, width: channelWidth, height: '100%' }}>
          {/* Channel strip bg */}
          <div
            style={{
              position: 'absolute',
              top: '15%',
              left: '50%',
              width: 4,
              height: '65%',
              background: '#222',
              borderRadius: 2,
              transform: 'translateX(-50%)',
              boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.5)',
            }}
          />

          {/* Fader track marks */}
          {Array.from({ length: 11 }).map((_, m) => (
            <div
              key={m}
              style={{
                position: 'absolute',
                top: `${15 + m * 5.9}%`,
                left: '50%',
                width: 14,
                height: 1,
                background: 'rgba(255,255,255,0.1)',
                transform: 'translateX(-50%)',
              }}
            />
          ))}

          {/* Fader handle */}
          <div
            style={{
              position: 'absolute',
              left: '50%',
              top: faderY,
              width: 24,
              height: 10,
              background: 'linear-gradient(180deg, #666, #444, #333)',
              borderRadius: 3,
              transform: 'translate(-50%, -50%)',
              boxShadow: '0 2px 6px rgba(0,0,0,0.4), inset 0 1px 1px rgba(255,255,255,0.2)',
            }}
          >
            <div
              style={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                width: 12,
                height: 1,
                background: 'rgba(255,255,255,0.3)',
                transform: 'translate(-50%, -50%)',
              }}
            />
          </div>

          {/* Mini level meter */}
          <div
            style={{
              position: 'absolute',
              bottom: '6%',
              left: '50%',
              transform: 'translateX(-50%)',
              display: 'flex',
              flexDirection: 'column-reverse',
              gap: 2,
            }}
          >
            {Array.from({ length: meterSegments }).map((_, s) => {
              const segLevel = s / meterSegments
              const isLit = segLevel < level
              const segColor = s >= 6 ? '#FF3030' : s >= 4 ? '#FFAA00' : '#00CC44'
              return (
                <div
                  key={s}
                  style={{
                    width: 8,
                    height: 3,
                    borderRadius: 1,
                    background: isLit ? segColor : 'rgba(255,255,255,0.06)',
                    boxShadow: isLit ? `0 0 4px ${segColor}60` : undefined,
                  }}
                />
              )
            })}
          </div>

          {/* Channel label */}
          <div
            style={{
              position: 'absolute',
              top: '8%',
              left: '50%',
              transform: 'translateX(-50%)',
              fontSize: 8,
              color: 'rgba(255,255,255,0.3)',
              fontFamily: "'Courier New', monospace",
              fontWeight: 700,
            }}
          >
            {i + 1}
          </div>
        </div>
      )
    })

    return (
      <div style={{ position: 'absolute', inset: 0, background: bgColor }}>
        {/* Console surface texture */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: `linear-gradient(180deg, #151515 0%, #0d0d0d 100%)`,
          }}
        />
        <div
          style={{
            position: 'absolute',
            inset: 0,
            backgroundImage: `repeating-linear-gradient(90deg, transparent, transparent 1px, rgba(255,255,255,0.008) 1px, rgba(255,255,255,0.008) 2px)`,
          }}
        />
        {channels}
      </div>
    )
  },

  renderWord: ({
    word,
    color,
    enterProgress,
    exitProgress,
    phase,
  }: WordRenderProps) => {
    let opacity = 1
    let translateY = 0

    if (phase === 'enter') {
      // Slide up like a fader
      const eased = easeOutCubic(enterProgress)
      opacity = eased
      translateY = (1 - eased) * 80
    } else if (phase === 'exit') {
      // Slide down like a fader
      opacity = 1 - exitProgress
      translateY = exitProgress * -60
    }

    return (
      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: `translate(-50%, calc(-50% + ${translateY}px))`,
          opacity,
          fontSize: 'clamp(36px, 9vw, 120px)',
          fontWeight: 900,
          color,
          whiteSpace: 'nowrap',
          fontFamily: "'Courier New', 'Fira Code', monospace",
          textTransform: 'uppercase',
          letterSpacing: '0.1em',
          textShadow: `0 0 20px ${color}50, 0 4px 20px rgba(0,0,0,0.8)`,
          zIndex: 10,
        }}
      >
        {word}
      </div>
    )
  },
}

function MixerFaderComponent(props: MotionGraphicProps<MixerFaderConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-mixer-fader',
  title: 'Kinetic Mixer Fader',
  description:
    'Text sliding like mixing console faders over animated channel strips with moving fader handles, level meters, and track marks.',
  tags: ['kinetic', 'music', 'mixer', 'fader', 'console', 'dj', 'studio', 'festival'],
  category: 'captions',
  component: MixerFaderComponent as any,
  defaultConfig: {
    words: ['MIX', 'THE', 'SOUND'],
    colors: ['#00FF88', '#00DDFF', '#FFAA00'],
    bgColor: '#0A0A0A',
    cycleDuration: 1.3,
    faderColor: '#00FF88',
  },
  configSchema: [
    {
      key: 'words',
      label: 'Words',
      type: 'text-array',
      defaultValue: ['MIX', 'THE', 'SOUND'],
      group: 'Content',
    },
    {
      key: 'colors',
      label: 'Colors',
      type: 'text-array',
      defaultValue: ['#00FF88', '#00DDFF', '#FFAA00'],
      group: 'Style',
    },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#0A0A0A', group: 'Style' },
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
