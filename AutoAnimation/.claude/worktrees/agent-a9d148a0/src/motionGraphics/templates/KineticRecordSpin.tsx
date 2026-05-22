import { registerMotionGraphic } from '../registry'
import {
  KineticBase,
  type KineticBaseConfig,
  type KineticAnimation,
  type WordRenderProps,
  type BackgroundRenderProps,
} from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface RecordSpinConfig extends KineticBaseConfig {
  vinylColor: string
  labelColor: string
}

function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3)
}

const animation: KineticAnimation = {
  renderBackground: ({ bgColor, width, height, frame, fps }: BackgroundRenderProps) => {
    const time = frame / fps
    const size = Math.min(width, height) * 0.75
    const rotation = time * 33.3 // 33 RPM

    const grooves = 20
    const grooveElements = Array.from({ length: grooves }).map((_, i) => {
      const radius = size * 0.22 + (size * 0.4) * (i / grooves)
      const grooveOpacity = 0.06 + (i % 4) * 0.02
      return (
        <div
          key={i}
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            width: radius * 2,
            height: radius * 2,
            borderRadius: '50%',
            border: `1px solid rgba(255,255,255,${grooveOpacity})`,
            transform: 'translate(-50%, -50%)',
          }}
        />
      )
    })

    // Light reflection that moves as record spins
    const reflectAngle = (time * 15) % 360

    return (
      <div style={{ position: 'absolute', inset: 0, background: bgColor }}>
        {/* Ambient light */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: `radial-gradient(circle at 35% 30%, rgba(255,200,100,0.04) 0%, transparent 50%)`,
          }}
        />

        {/* Vinyl record */}
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            width: size,
            height: size,
            borderRadius: '50%',
            background: `radial-gradient(circle, #1a1a1a 17%, #0d0d0d 18%, #1a1a1a 19%, #111 80%, #0a0a0a 100%)`,
            transform: `translate(-50%, -50%) rotate(${rotation}deg)`,
            boxShadow: '0 10px 50px rgba(0,0,0,0.7), inset 0 0 30px rgba(0,0,0,0.4)',
          }}
        >
          {grooveElements}

          {/* Moving light reflection */}
          <div
            style={{
              position: 'absolute',
              inset: 0,
              borderRadius: '50%',
              background: `linear-gradient(${reflectAngle}deg, transparent 30%, rgba(255,255,255,0.06) 50%, transparent 70%)`,
            }}
          />

          {/* Center label - this is where text sits */}
          <div
            style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              width: size * 0.35,
              height: size * 0.35,
              borderRadius: '50%',
              background: `radial-gradient(circle, #D4451A 0%, #B8371A 50%, #9C2E18 100%)`,
              transform: 'translate(-50%, -50%)',
              boxShadow: 'inset 0 2px 8px rgba(0,0,0,0.3)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {/* Ring on label */}
            <div
              style={{
                position: 'absolute',
                width: '85%',
                height: '85%',
                borderRadius: '50%',
                border: '1px solid rgba(255,255,255,0.15)',
              }}
            />
            {/* Spindle hole */}
            <div
              style={{
                width: size * 0.035,
                height: size * 0.035,
                borderRadius: '50%',
                background: '#222',
                boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.6)',
              }}
            />
          </div>
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
    let blur = 0

    if (phase === 'enter') {
      const eased = easeOutCubic(enterProgress)
      opacity = eased
      scale = 0.5 + 0.5 * eased
      blur = (1 - eased) * 6
    } else if (phase === 'exit') {
      opacity = 1 - exitProgress
      scale = 1 + 0.2 * exitProgress
      blur = exitProgress * 6
    }

    // Subtle rotation tied to vinyl spin
    const textRotate = Math.sin(time * 0.5) * 2

    return (
      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: `translate(-50%, -50%) scale(${scale}) rotate(${textRotate}deg)`,
          opacity,
          fontSize: 'clamp(32px, 8vw, 100px)',
          fontWeight: 900,
          color,
          whiteSpace: 'nowrap',
          fontFamily: "'Georgia', 'Playfair Display', serif",
          textShadow: `0 3px 16px rgba(0,0,0,0.7), 0 0 30px ${color}30`,
          filter: blur > 0 ? `blur(${blur}px)` : undefined,
          letterSpacing: '0.04em',
          textTransform: 'uppercase',
          zIndex: 10,
        }}
      >
        {word}
      </div>
    )
  },
}

function RecordSpinComponent(props: MotionGraphicProps<RecordSpinConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-record-spin',
  title: 'Kinetic Record Spin',
  description:
    'Text displayed on a spinning vinyl record label with grooves, light reflections, and 33 RPM rotation. Classic turntable aesthetic.',
  tags: ['kinetic', 'music', 'vinyl', 'record', 'spin', 'turntable', 'retro', 'festival'],
  category: 'captions',
  component: RecordSpinComponent as any,
  defaultConfig: {
    words: ['SPIN', 'THE', 'RECORD'],
    colors: ['#F5E6CA', '#FFD700', '#F5E6CA'],
    bgColor: '#0D0806',
    cycleDuration: 1.4,
    vinylColor: '#111111',
    labelColor: '#D4451A',
  },
  configSchema: [
    {
      key: 'words',
      label: 'Words',
      type: 'text-array',
      defaultValue: ['SPIN', 'THE', 'RECORD'],
      group: 'Content',
    },
    {
      key: 'colors',
      label: 'Colors',
      type: 'text-array',
      defaultValue: ['#F5E6CA', '#FFD700', '#F5E6CA'],
      group: 'Style',
    },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#0D0806', group: 'Style' },
    {
      key: 'cycleDuration',
      label: 'Cycle Duration (s)',
      type: 'number',
      defaultValue: 1.4,
      min: 0.3,
      max: 5,
      group: 'Timing',
    },
  ],
})
