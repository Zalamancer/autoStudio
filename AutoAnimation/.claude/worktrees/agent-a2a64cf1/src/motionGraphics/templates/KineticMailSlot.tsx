import { registerMotionGraphic } from '../registry'
import {
  KineticBase,
  type KineticBaseConfig,
  type KineticAnimation,
  type WordRenderProps,
  type BackgroundRenderProps,
} from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface MailSlotConfig extends KineticBaseConfig {}

const animation: KineticAnimation = {
  renderBackground: ({ bgColor, width, height, frame, fps }: BackgroundRenderProps) => {
    const time = frame / fps
    const doorW = Math.min(width * 0.7, height * 0.85)
    const doorH = doorW * 1.4

    return (
      <div style={{ position: 'absolute', inset: 0, background: bgColor }}>
        {/* Front door — rich wood panel */}
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            width: doorW,
            height: doorH,
            transform: 'translate(-50%, -50%)',
            background: 'linear-gradient(180deg, #5c3a1e 0%, #4a2e16 30%, #3e2510 100%)',
            borderRadius: 4,
            boxShadow: 'inset 0 0 40px rgba(0,0,0,0.2), 0 0 30px rgba(0,0,0,0.4)',
          }}
        >
          {/* Wood grain texture */}
          {Array.from({ length: 20 }, (_, i) => (
            <div
              key={i}
              style={{
                position: 'absolute',
                top: `${i * 5}%`,
                left: 0,
                right: 0,
                height: 1,
                background: `rgba(0,0,0,${0.02 + (i % 4) * 0.01})`,
                transform: `translateY(${Math.sin(i * 0.8) * 2}px)`,
              }}
            />
          ))}
          {/* Door panel inset */}
          <div
            style={{
              position: 'absolute',
              top: '8%',
              left: '10%',
              right: '10%',
              bottom: '45%',
              border: '2px solid rgba(0,0,0,0.08)',
              borderRadius: 2,
              boxShadow: 'inset 0 2px 6px rgba(0,0,0,0.1)',
            }}
          />
          <div
            style={{
              position: 'absolute',
              top: '60%',
              left: '10%',
              right: '10%',
              bottom: '8%',
              border: '2px solid rgba(0,0,0,0.08)',
              borderRadius: 2,
              boxShadow: 'inset 0 2px 6px rgba(0,0,0,0.1)',
            }}
          />
          {/* Brass mail slot — horizontal opening */}
          <div
            style={{
              position: 'absolute',
              top: '48%',
              left: '50%',
              width: doorW * 0.45,
              height: doorW * 0.06,
              transform: 'translate(-50%, -50%)',
              background: 'linear-gradient(180deg, #c9a84c, #d4b55a, #c9a84c)',
              borderRadius: 3,
              boxShadow: '0 2px 8px rgba(0,0,0,0.3), inset 0 1px 2px rgba(255,255,255,0.3)',
            }}
          >
            {/* Slot opening — dark slit */}
            <div
              style={{
                position: 'absolute',
                top: '30%',
                left: '8%',
                right: '8%',
                bottom: '30%',
                background: 'linear-gradient(180deg, #0a0a0a, #1a1a1a)',
                borderRadius: 2,
              }}
            />
            {/* Brass flap hinge at top */}
            <div
              style={{
                position: 'absolute',
                top: -3,
                left: '50%',
                transform: 'translateX(-50%)',
                width: doorW * 0.1,
                height: 4,
                background: 'linear-gradient(90deg, #b8952e, #d4b55a, #b8952e)',
                borderRadius: 2,
              }}
            />
          </div>
          {/* Door knob */}
          <div
            style={{
              position: 'absolute',
              top: '52%',
              right: '12%',
              width: doorW * 0.06,
              height: doorW * 0.06,
              borderRadius: '50%',
              background: 'radial-gradient(circle at 35% 35%, #d4b55a, #b8952e, #8a6e1a)',
              boxShadow: '0 2px 6px rgba(0,0,0,0.3)',
            }}
          />
        </div>
        {/* Hall shadow below door — dark interior hint */}
        <div
          style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            height: '15%',
            background: 'linear-gradient(0deg, rgba(0,0,0,0.4), transparent)',
            pointerEvents: 'none',
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
    width,
    height,
  }: WordRenderProps) => {
    const slotY = height * 0.48
    const envW = Math.min(width * 0.3, height * 0.15)
    let opacity = 0
    let translateY = 0
    let rotation = 0
    let clipTop = 0 // how much of the envelope is visible
    let envelopeVisible = true

    if (phase === 'enter') {
      if (enterProgress < 0.2) {
        // Envelope approaches slot from outside (slight tilt)
        const t = enterProgress / 0.2
        opacity = t
        translateY = -envW * 1.2 * (1 - t)
        rotation = -3
        clipTop = 0
      } else if (enterProgress < 0.5) {
        // Pushes through slot — progressive reveal
        const t = (enterProgress - 0.2) / 0.3
        opacity = 1
        translateY = 0
        rotation = -3 + t * 3
        clipTop = t * 0.7
      } else if (enterProgress < 0.75) {
        // Tips over and gravity takes it
        const t = (enterProgress - 0.5) / 0.25
        opacity = 1
        rotation = t * 12
        translateY = t * envW * 0.5
        clipTop = 0.7 + t * 0.3
      } else {
        // Lands in pile — settles
        const t = (enterProgress - 0.75) / 0.25
        opacity = 1
        rotation = 12 - t * 10
        translateY = envW * 0.5 + t * envW * 0.3
        clipTop = 1
      }
    } else if (phase === 'hold') {
      opacity = 1
      translateY = envW * 0.8
      rotation = 2 + Math.sin(holdProgress * Math.PI * 2) * 0.5
      clipTop = 1
    } else {
      // Fades from the landed pile
      const t = exitProgress
      opacity = 1 - t
      translateY = envW * 0.8 + t * 20
      rotation = 2 + t * 5
      clipTop = 1
    }

    return (
      <div
        style={{
          position: 'absolute',
          top: slotY,
          left: '50%',
          transform: `translate(-50%, ${translateY}px) rotate(${rotation}deg)`,
          opacity,
        }}
      >
        {/* Envelope with text */}
        <div
          style={{
            position: 'relative',
            padding: '10px 24px',
            background: 'linear-gradient(145deg, #f8f3e8 0%, #f0e8d6 100%)',
            borderRadius: 2,
            boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
          }}
        >
          {/* Main word on envelope */}
          <div
            style={{
              fontFamily: "'Georgia', 'Palatino Linotype', serif",
              fontSize: 'clamp(24px, 7vw, 72px)',
              fontWeight: 700,
              color,
              textTransform: 'uppercase',
              whiteSpace: 'nowrap',
              letterSpacing: 2,
              textAlign: 'center',
            }}
          >
            {word}
          </div>
          {/* Small stamp in corner */}
          <div
            style={{
              position: 'absolute',
              top: 4,
              right: 4,
              width: 18,
              height: 22,
              background: 'linear-gradient(135deg, #c44040, #a03030)',
              borderRadius: 1,
              opacity: 0.6,
            }}
          />
        </div>
      </div>
    )
  },
}

function MailSlotComponent(props: MotionGraphicProps<MailSlotConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-mail-slot',
  title: 'Kinetic Mail Slot',
  description:
    'Text on envelope pushes through a brass mail slot in a wooden door, tips over with gravity, and lands in a pile. Hall shadow and door panel detail.',
  tags: ['kinetic', 'typography', 'mail-slot', 'envelope', 'door', 'brass', 'postal', 'delivery', 'gravity'],
  category: 'captions',
  component: MailSlotComponent as any,
  defaultConfig: {
    words: ['HELLO', 'LETTER', 'WRITE', 'REPLY'],
    colors: ['#2a2a3a', '#2a2a3a', '#2a2a3a', '#2a2a3a'],
    bgColor: '#7a6a55',
    cycleDuration: 1.5,
  },
  configSchema: [
    { key: 'words', label: 'Words', type: 'text-array', defaultValue: ['HELLO', 'LETTER', 'WRITE', 'REPLY'], group: 'Content' },
    { key: 'colors', label: 'Colors', type: 'text-array', defaultValue: ['#2a2a3a', '#2a2a3a', '#2a2a3a', '#2a2a3a'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#7a6a55', group: 'Style' },
    { key: 'cycleDuration', label: 'Cycle Duration (s)', type: 'number', defaultValue: 1.5, min: 0.5, max: 5, group: 'Timing' },
  ],
})
