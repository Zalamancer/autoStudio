import { registerMotionGraphic } from '../registry'
import {
  KineticBase,
  type KineticBaseConfig,
  type KineticAnimation,
  type WordRenderProps,
  type BackgroundRenderProps,
} from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface AmplifierDriveConfig extends KineticBaseConfig {
  driveColor: string
}

function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3)
}

const animation: KineticAnimation = {
  renderBackground: ({ bgColor, width, height, frame, fps }: BackgroundRenderProps) => {
    const time = frame / fps

    // Amp panel with knobs and switches
    const knobCount = 6
    const knobs = Array.from({ length: knobCount }).map((_, i) => {
      const x = 12 + (i / (knobCount - 1)) * 76
      const knobRotation = 30 + Math.sin(time * 1.2 + i * 0.8) * 120
      const glowPulse = 0.4 + 0.3 * Math.sin(time * 2 + i * 0.5)
      return (
        <div
          key={i}
          style={{
            position: 'absolute',
            left: `${x}%`,
            top: '18%',
            width: 'clamp(28px, 5vw, 44px)',
            height: 'clamp(28px, 5vw, 44px)',
            borderRadius: '50%',
            background: `radial-gradient(circle, #444 0%, #222 60%, #1a1a1a 100%)`,
            transform: 'translate(-50%, -50%)',
            boxShadow: `0 2px 8px rgba(0,0,0,0.5), inset 0 1px 2px rgba(255,255,255,0.1)`,
          }}
        >
          {/* Pointer line on knob */}
          <div
            style={{
              position: 'absolute',
              top: '15%',
              left: '50%',
              width: 2,
              height: '35%',
              background: '#fff',
              borderRadius: 1,
              transform: `translateX(-50%) rotate(${knobRotation}deg)`,
              transformOrigin: 'bottom center',
            }}
          />
          {/* LED indicator */}
          <div
            style={{
              position: 'absolute',
              top: '-40%',
              left: '50%',
              width: 6,
              height: 6,
              borderRadius: '50%',
              background: `rgba(255, 60, 30, ${glowPulse})`,
              transform: 'translateX(-50%)',
              boxShadow: `0 0 8px rgba(255, 60, 30, ${glowPulse * 0.6})`,
            }}
          />
        </div>
      )
    })

    // VU meter bars
    const meterBars = 16
    const meters = Array.from({ length: meterBars }).map((_, i) => {
      const rawLevel = 0.3 + 0.5 * Math.sin(time * 3 + i * 0.4) + 0.2 * Math.cos(time * 5 + i * 0.7)
      const level = Math.max(0.08, Math.min(1, rawLevel))
      const isRed = level > 0.8
      const barColor = isRed ? '#FF3030' : i < meterBars * 0.6 ? '#00CC44' : '#FFAA00'
      return (
        <div
          key={i}
          style={{
            width: `${80 / meterBars}%`,
            height: `${level * 100}%`,
            background: `linear-gradient(to top, ${barColor}CC, ${barColor})`,
            borderRadius: '2px 2px 0 0',
            boxShadow: isRed ? `0 0 6px ${barColor}60` : undefined,
          }}
        />
      )
    })

    return (
      <div style={{ position: 'absolute', inset: 0, background: bgColor }}>
        {/* Metal amp faceplate texture */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: `linear-gradient(180deg, #1a1a1a 0%, #111 50%, #0d0d0d 100%)`,
          }}
        />
        <div
          style={{
            position: 'absolute',
            inset: 0,
            backgroundImage: `repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(255,255,255,0.01) 2px, rgba(255,255,255,0.01) 3px)`,
          }}
        />

        {/* Knobs row */}
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '30%' }}>
          {knobs}
        </div>

        {/* VU meter section */}
        <div
          style={{
            position: 'absolute',
            bottom: '8%',
            left: '10%',
            right: '10%',
            height: '35%',
            display: 'flex',
            alignItems: 'flex-end',
            justifyContent: 'center',
            gap: '2%',
            padding: '0 2%',
            background: 'rgba(0,0,0,0.4)',
            borderRadius: 6,
            border: '1px solid rgba(255,255,255,0.05)',
          }}
        >
          {meters}
        </div>
      </div>
    )
  },

  renderWord: ({
    word,
    color,
    enterProgress,
    exitProgress,
    phase,
    frame,
    fps,
  }: WordRenderProps) => {
    const time = (frame ?? 0) / (fps ?? 30)
    let opacity = 1
    let scale = 1
    let skewX = 0

    if (phase === 'enter') {
      const eased = easeOutCubic(enterProgress)
      opacity = eased
      scale = 1.3 - 0.3 * eased
      skewX = (1 - eased) * 15
    } else if (phase === 'exit') {
      opacity = 1 - exitProgress
      scale = 1 - 0.2 * exitProgress
      skewX = exitProgress * -10
    }

    // Overdrive distortion - subtle jitter when "held"
    const driveJitterX = phase === 'hold' ? Math.sin(time * 40) * 2 : 0
    const driveJitterY = phase === 'hold' ? Math.cos(time * 35) * 1.5 : 0

    return (
      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: `translate(calc(-50% + ${driveJitterX}px), calc(-50% + ${driveJitterY}px)) scale(${scale}) skewX(${skewX}deg)`,
          opacity,
          fontSize: 'clamp(38px, 9vw, 120px)',
          fontWeight: 900,
          color,
          whiteSpace: 'nowrap',
          fontFamily: "'Impact', 'Arial Black', sans-serif",
          textTransform: 'uppercase',
          letterSpacing: '0.06em',
          textShadow: `0 0 10px ${color}80, 0 0 30px ${color}40, 2px 2px 0 rgba(255,50,0,0.3), -2px -2px 0 rgba(0,200,255,0.2)`,
          zIndex: 10,
        }}
      >
        {word}
      </div>
    )
  },
}

function AmplifierDriveComponent(props: MotionGraphicProps<AmplifierDriveConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-amplifier-drive',
  title: 'Kinetic Amplifier Drive',
  description:
    'Words with overdrive distortion effect over amplifier panel with animated knobs and VU meter bars. Heavy rock/metal aesthetic.',
  tags: ['kinetic', 'music', 'amplifier', 'overdrive', 'distortion', 'rock', 'festival', 'guitar'],
  category: 'captions',
  component: AmplifierDriveComponent as any,
  defaultConfig: {
    words: ['CRANK', 'IT', 'UP'],
    colors: ['#FF4400', '#FFAA00', '#FF6600'],
    bgColor: '#0A0A0A',
    cycleDuration: 1.2,
    driveColor: '#FF4400',
  },
  configSchema: [
    {
      key: 'words',
      label: 'Words',
      type: 'text-array',
      defaultValue: ['CRANK', 'IT', 'UP'],
      group: 'Content',
    },
    {
      key: 'colors',
      label: 'Colors',
      type: 'text-array',
      defaultValue: ['#FF4400', '#FFAA00', '#FF6600'],
      group: 'Style',
    },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#0A0A0A', group: 'Style' },
    {
      key: 'cycleDuration',
      label: 'Cycle Duration (s)',
      type: 'number',
      defaultValue: 1.2,
      min: 0.3,
      max: 5,
      group: 'Timing',
    },
  ],
})
