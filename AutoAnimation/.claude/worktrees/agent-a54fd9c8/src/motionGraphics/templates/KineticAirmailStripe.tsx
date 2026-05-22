import { registerMotionGraphic } from '../registry'
import {
  KineticBase,
  type KineticBaseConfig,
  type KineticAnimation,
  type WordRenderProps,
  type BackgroundRenderProps,
} from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface AirmailStripeConfig extends KineticBaseConfig {}

const animation: KineticAnimation = {
  renderBackground: ({ bgColor, width, height, frame, fps }: BackgroundRenderProps) => {
    const time = frame / fps
    const chevronSize = 18

    // Build red-blue chevron stripe pattern for airmail border
    const stripeColors = ['#cc2233', '#2244aa']
    const chevronCount = Math.ceil(Math.max(width, height) / chevronSize) * 2 + 4

    return (
      <div style={{ position: 'absolute', inset: 0, background: bgColor }}>
        {/* Airmail envelope body — lightweight paper */}
        <div
          style={{
            position: 'absolute',
            inset: '6%',
            background: 'linear-gradient(180deg, #f8f6f0 0%, #f2efe8 100%)',
            borderRadius: 3,
            boxShadow: '2px 3px 10px rgba(0,0,0,0.1)',
          }}
        >
          {/* Paper texture — tissue-thin letterhead */}
          <div
            style={{
              position: 'absolute',
              inset: 0,
              backgroundImage:
                'repeating-linear-gradient(0deg, transparent, transparent 3px, rgba(0,0,0,0.005) 3px, rgba(0,0,0,0.005) 4px)',
              borderRadius: 3,
            }}
          />
        </div>

        {/* Top chevron border */}
        <div
          style={{
            position: 'absolute',
            top: '6%',
            left: '6%',
            right: '6%',
            height: chevronSize * 1.5,
            overflow: 'hidden',
            borderRadius: '3px 3px 0 0',
            display: 'flex',
          }}
        >
          {Array.from({ length: chevronCount }, (_, i) => (
            <div
              key={`top-${i}`}
              style={{
                width: chevronSize,
                height: '100%',
                background: stripeColors[i % 2],
                flexShrink: 0,
                transform: 'skewX(-20deg)',
                marginLeft: i === 0 ? -chevronSize : -2,
              }}
            />
          ))}
        </div>

        {/* Bottom chevron border */}
        <div
          style={{
            position: 'absolute',
            bottom: '6%',
            left: '6%',
            right: '6%',
            height: chevronSize * 1.5,
            overflow: 'hidden',
            borderRadius: '0 0 3px 3px',
            display: 'flex',
          }}
        >
          {Array.from({ length: chevronCount }, (_, i) => (
            <div
              key={`bot-${i}`}
              style={{
                width: chevronSize,
                height: '100%',
                background: stripeColors[i % 2],
                flexShrink: 0,
                transform: 'skewX(-20deg)',
                marginLeft: i === 0 ? -chevronSize : -2,
              }}
            />
          ))}
        </div>

        {/* Left chevron border */}
        <div
          style={{
            position: 'absolute',
            top: '6%',
            bottom: '6%',
            left: '6%',
            width: chevronSize * 1.5,
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          {Array.from({ length: chevronCount }, (_, i) => (
            <div
              key={`left-${i}`}
              style={{
                height: chevronSize,
                width: '100%',
                background: stripeColors[i % 2],
                flexShrink: 0,
                transform: 'skewY(-20deg)',
                marginTop: i === 0 ? -chevronSize : -2,
              }}
            />
          ))}
        </div>

        {/* Right chevron border */}
        <div
          style={{
            position: 'absolute',
            top: '6%',
            bottom: '6%',
            right: '6%',
            width: chevronSize * 1.5,
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          {Array.from({ length: chevronCount }, (_, i) => (
            <div
              key={`right-${i}`}
              style={{
                height: chevronSize,
                width: '100%',
                background: stripeColors[i % 2],
                flexShrink: 0,
                transform: 'skewY(-20deg)',
                marginTop: i === 0 ? -chevronSize : -2,
              }}
            />
          ))}
        </div>

        {/* PAR AVION label */}
        <div
          style={{
            position: 'absolute',
            top: `calc(6% + ${chevronSize * 1.5 + 10}px)`,
            left: '50%',
            transform: 'translateX(-50%)',
            fontFamily: "'Georgia', 'Times New Roman', serif",
            fontSize: 10,
            fontWeight: 700,
            color: '#2244aa',
            letterSpacing: 6,
            textTransform: 'uppercase',
            opacity: 0.5,
          }}
        >
          PAR AVION
        </div>

        {/* Aviation stamp — top right */}
        <div
          style={{
            position: 'absolute',
            top: `calc(6% + ${chevronSize * 1.5 + 6}px)`,
            right: `calc(6% + ${chevronSize * 1.5 + 12}px)`,
            width: 44,
            height: 52,
            border: '2px solid rgba(34,68,170,0.2)',
            borderRadius: 2,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'rgba(220,230,250,0.3)',
          }}
        >
          <div style={{ fontSize: 18, lineHeight: 1 }}>&#9992;</div>
          <div
            style={{
              fontFamily: "'Courier New', monospace",
              fontSize: 5,
              color: 'rgba(34,68,170,0.4)',
              marginTop: 2,
              letterSpacing: 1,
            }}
          >
            AIRMAIL
          </div>
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
    width,
    height,
    frame,
  }: WordRenderProps) => {
    const f = frame ?? 0

    let opacity = 0
    let scale = 1
    let letterSpacing = 5

    if (phase === 'enter') {
      // Letter arrives — slides in from the right like being pulled from envelope
      const slideX = (1 - enterProgress) * 80
      opacity = Math.min(1, enterProgress * 2)
      scale = 0.9 + enterProgress * 0.1

      return (
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: `translate(calc(-50% + ${slideX}px), -50%) scale(${scale})`,
            opacity,
            zIndex: 10,
          }}
        >
          <div
            style={{
              fontFamily: "'Georgia', 'Times New Roman', serif",
              fontSize: 'clamp(26px, 7vw, 76px)',
              fontWeight: 700,
              color,
              whiteSpace: 'nowrap',
              letterSpacing,
              textTransform: 'uppercase',
              fontStyle: 'italic',
            }}
          >
            {word}
          </div>
        </div>
      )
    } else if (phase === 'hold') {
      // Gentle paper float
      const floatY = Math.sin(f * 0.04) * 2
      return (
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: `translate(-50%, calc(-50% + ${floatY}px))`,
            opacity: 1,
            zIndex: 10,
          }}
        >
          <div
            style={{
              fontFamily: "'Georgia', 'Times New Roman', serif",
              fontSize: 'clamp(26px, 7vw, 76px)',
              fontWeight: 700,
              color,
              whiteSpace: 'nowrap',
              letterSpacing,
              textTransform: 'uppercase',
              fontStyle: 'italic',
            }}
          >
            {word}
          </div>
        </div>
      )
    } else {
      // Letter departs — scales down like being sealed back in
      opacity = 1 - exitProgress
      scale = 1 - exitProgress * 0.15

      return (
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: `translate(-50%, -50%) scale(${scale})`,
            opacity,
            zIndex: 10,
          }}
        >
          <div
            style={{
              fontFamily: "'Georgia', 'Times New Roman', serif",
              fontSize: 'clamp(26px, 7vw, 76px)',
              fontWeight: 700,
              color,
              whiteSpace: 'nowrap',
              letterSpacing,
              textTransform: 'uppercase',
              fontStyle: 'italic',
            }}
          >
            {word}
          </div>
        </div>
      )
    }
  },
}

function AirmailStripeComponent(props: MotionGraphicProps<AirmailStripeConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-airmail-stripe',
  title: 'Kinetic Airmail Stripe',
  description:
    'Airmail envelope with red-blue chevron border stripes, PAR AVION label, aviation stamp, and text sliding in like a letter pulled from the envelope.',
  tags: ['kinetic', 'typography', 'airmail', 'postal', 'envelope', 'travel', 'international', 'paper'],
  category: 'captions',
  component: AirmailStripeComponent as any,
  defaultConfig: {
    words: ['POST', 'AVION', 'MAIL', 'SENT'],
    colors: ['#1a2a5a', '#1a2a5a', '#1a2a5a', '#1a2a5a'],
    bgColor: '#8a8478',
    cycleDuration: 1.3,
  },
  configSchema: [
    { key: 'words', label: 'Words', type: 'text-array', defaultValue: ['POST', 'AVION', 'MAIL', 'SENT'], group: 'Content' },
    { key: 'colors', label: 'Colors', type: 'text-array', defaultValue: ['#1a2a5a', '#1a2a5a', '#1a2a5a', '#1a2a5a'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#8a8478', group: 'Style' },
    { key: 'cycleDuration', label: 'Cycle Duration (s)', type: 'number', defaultValue: 1.3, min: 0.5, max: 5, group: 'Timing' },
  ],
})
