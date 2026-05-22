import { registerMotionGraphic } from '../registry'
import {
  KineticBase,
  type KineticBaseConfig,
  type KineticAnimation,
  type WordRenderProps,
  type BackgroundRenderProps,
} from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface FermataHoldConfig extends KineticBaseConfig {
  fermataColor: string
  glowColor: string
}

function easeOutQuint(t: number): number {
  return 1 - Math.pow(1 - t, 5)
}

const animation: KineticAnimation = {
  renderBackground: ({ bgColor, width, height, frame, fps }: BackgroundRenderProps) => {
    const time = frame / fps

    // Suspended particles that freeze during hold
    const particleCount = 20
    const particles = Array.from({ length: particleCount }).map((_, i) => {
      const baseX = ((i * 173 + 41) % 100) / 100
      const baseY = ((i * 89 + 67) % 100) / 100
      const driftSpeed = 0.15 + (i % 5) * 0.05
      const floatX = baseX + Math.sin(time * driftSpeed + i * 0.7) * 0.03
      const floatY = baseY + Math.cos(time * driftSpeed * 0.8 + i * 1.1) * 0.02
      const size = 2 + (i % 4) * 1.5
      const pulseOpacity = 0.04 + 0.03 * Math.sin(time * 0.6 + i)

      return { x: floatX, y: floatY, size, opacity: pulseOpacity }
    })

    // Fermata symbol breathing
    const fermataScale = 1 + 0.02 * Math.sin(time * 0.8)
    const fermataGlow = 0.15 + 0.05 * Math.sin(time * 0.8)

    // Time suspension ripple
    const rippleRadius = (time * 30) % (Math.min(width, height) * 0.5)
    const rippleOpacity = Math.max(0, 0.08 - (rippleRadius / (Math.min(width, height) * 0.5)) * 0.08)

    return (
      <div style={{ position: 'absolute', inset: 0, background: bgColor }}>
        {/* Deep gradient atmosphere */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: `
              radial-gradient(ellipse at 50% 40%, rgba(80,60,120,0.08) 0%, transparent 50%),
              radial-gradient(ellipse at 50% 70%, rgba(40,30,80,0.06) 0%, transparent 40%)
            `,
          }}
        />

        {/* Time suspension ripple */}
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            width: rippleRadius * 2,
            height: rippleRadius * 2,
            borderRadius: '50%',
            border: `1px solid rgba(180,160,220,${rippleOpacity})`,
            transform: 'translate(-50%, -50%)',
          }}
        />

        {/* Floating suspended particles */}
        {particles.map((p, i) => (
          <div
            key={i}
            style={{
              position: 'absolute',
              left: `${p.x * 100}%`,
              top: `${p.y * 100}%`,
              width: p.size,
              height: p.size,
              borderRadius: '50%',
              background: `rgba(200,180,240,${p.opacity})`,
              boxShadow: `0 0 ${p.size * 2}px rgba(180,160,220,${p.opacity * 0.5})`,
            }}
          />
        ))}

        {/* Large fermata symbol */}
        <svg
          style={{
            position: 'absolute',
            top: '18%',
            left: '50%',
            width: Math.min(width * 0.25, 160),
            height: Math.min(width * 0.15, 100),
            transform: `translateX(-50%) scale(${fermataScale})`,
            opacity: fermataGlow,
          }}
          viewBox="0 0 200 120"
          preserveAspectRatio="xMidYMid meet"
        >
          {/* Fermata arc */}
          <path
            d="M 20 100 Q 100 -10, 180 100"
            fill="none"
            stroke="rgba(200,180,240,0.6)"
            strokeWidth={4}
            strokeLinecap="round"
          />
          {/* Fermata dot */}
          <circle
            cx={100}
            cy={70}
            r={6}
            fill="rgba(200,180,240,0.6)"
          />
        </svg>

        {/* Staff line fragments */}
        {Array.from({ length: 5 }).map((_, i) => (
          <div
            key={i}
            style={{
              position: 'absolute',
              left: '15%',
              right: '15%',
              top: height * 0.42 + i * (height * 0.03),
              height: 1,
              background: 'rgba(180,160,220,0.06)',
            }}
          />
        ))}

        {/* "Breath" indicator - gentle pulsing circle */}
        <div
          style={{
            position: 'absolute',
            bottom: '12%',
            left: '50%',
            transform: 'translateX(-50%)',
            width: 8 + 4 * Math.sin(time * 1.2),
            height: 8 + 4 * Math.sin(time * 1.2),
            borderRadius: '50%',
            border: '1px solid rgba(200,180,240,0.15)',
            background: `rgba(200,180,240,${0.03 + 0.02 * Math.sin(time * 1.2)})`,
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
    width,
  }: WordRenderProps) => {
    let opacity = 1
    let scale = 1
    let blur = 0
    let fermataOpacity = 0

    if (phase === 'enter') {
      const eased = easeOutQuint(enterProgress)
      opacity = eased
      scale = 0.6 + 0.4 * eased
      blur = (1 - eased) * 6
    } else if (phase === 'hold') {
      // Freeze! The fermata hold: text stays perfectly still
      opacity = 1
      scale = 1
      fermataOpacity = 0.7

      // Very subtle breathing to show time is suspended, not stopped
      scale = 1 + 0.008 * Math.sin(holdProgress * Math.PI * 2)
    } else {
      // Release from fermata - gentle dissolve
      const exitEased = easeOutQuint(exitProgress)
      opacity = 1 - exitEased
      scale = 1 + 0.15 * exitEased
      blur = exitEased * 8
      fermataOpacity = 0.7 * (1 - exitEased)
    }

    return (
      <div
        style={{
          position: 'absolute',
          top: '48%',
          left: '50%',
          transform: `translate(-50%, -50%) scale(${scale})`,
          opacity,
          filter: blur > 0 ? `blur(${blur}px)` : undefined,
          zIndex: 10,
          textAlign: 'center',
        }}
      >
        {/* Fermata symbol above text during hold */}
        <svg
          style={{
            display: 'block',
            margin: '0 auto 12px',
            width: 'clamp(40px, 8vw, 80px)',
            height: 'clamp(24px, 5vw, 48px)',
            opacity: fermataOpacity,
          }}
          viewBox="0 0 100 60"
          preserveAspectRatio="xMidYMid meet"
        >
          <path
            d="M 10 55 Q 50 -5, 90 55"
            fill="none"
            stroke={color}
            strokeWidth={3}
            strokeLinecap="round"
          />
          <circle cx={50} cy={38} r={4} fill={color} />
        </svg>

        <div
          style={{
            fontSize: 'clamp(36px, 9vw, 120px)',
            fontWeight: 700,
            color,
            whiteSpace: 'nowrap',
            fontFamily: "'Georgia', 'Palatino', serif",
            letterSpacing: '0.1em',
            textShadow: `0 2px 20px rgba(0,0,0,0.5), 0 0 30px rgba(180,160,220,0.12)`,
          }}
        >
          {word}
        </div>

        {/* "Hold" duration indicator dots */}
        {phase === 'hold' && (
          <div
            style={{
              display: 'flex',
              justifyContent: 'center',
              gap: 6,
              marginTop: 10,
              opacity: 0.4,
            }}
          >
            {Array.from({ length: 3 }).map((_, i) => (
              <div
                key={i}
                style={{
                  width: 4,
                  height: 4,
                  borderRadius: '50%',
                  background: color,
                  opacity: holdProgress > i * 0.33 ? 0.8 : 0.2,
                }}
              />
            ))}
          </div>
        )}
      </div>
    )
  },
}

function FermataHoldComponent(props: MotionGraphicProps<FermataHoldConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-fermata-hold',
  title: 'Kinetic Fermata Hold',
  description:
    "Fermata hold: text arrives then freezes under fermata symbol (dot + arc), time suspends with a conductor's breath pause effect.",
  tags: ['kinetic', 'music', 'fermata', 'hold', 'pause', 'suspend', 'classical', 'breath'],
  category: 'captions',
  component: FermataHoldComponent as any,
  defaultConfig: {
    words: ['HOLD', 'STILL', 'WAIT', 'BREATHE'],
    colors: ['#D4C0F0', '#C0A8E0', '#B090D0', '#E0D0FF'],
    bgColor: '#0A0812',
    cycleDuration: 1.5,
    fermataColor: '#D4C0F0',
    glowColor: '#B090D0',
  },
  configSchema: [
    {
      key: 'words',
      label: 'Words',
      type: 'text-array',
      defaultValue: ['HOLD', 'STILL', 'WAIT', 'BREATHE'],
      group: 'Content',
    },
    {
      key: 'colors',
      label: 'Colors',
      type: 'text-array',
      defaultValue: ['#D4C0F0', '#C0A8E0', '#B090D0', '#E0D0FF'],
      group: 'Style',
    },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#0A0812', group: 'Style' },
    {
      key: 'cycleDuration',
      label: 'Cycle Duration (s)',
      type: 'number',
      defaultValue: 1.5,
      min: 0.3,
      max: 5,
      group: 'Timing',
    },
  ],
})
