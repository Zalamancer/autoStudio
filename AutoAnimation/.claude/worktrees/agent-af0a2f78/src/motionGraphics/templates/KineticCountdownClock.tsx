import { registerMotionGraphic } from '../registry'
import { KineticBase, type KineticBaseConfig, type KineticAnimation, type WordRenderProps, type BackgroundRenderProps } from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface CountdownClockConfig extends KineticBaseConfig {}

const animation: KineticAnimation = {
  renderBackground: ({ bgColor, width, height, frame, fps }: BackgroundRenderProps) => {
    const time = frame / fps
    // Countdown from 10 seconds, looping
    const countdown = 10 - (time % 11)
    const isUrgent = countdown <= 3
    const urgentPulse = isUrgent ? 0.15 + Math.sin(time * 12) * 0.08 : 0

    // Clock ring progress
    const ringProgress = (countdown / 10) * 100
    const ringSize = Math.min(width, height) * 0.65

    return (
      <div style={{ position: 'absolute', inset: 0, background: bgColor }}>
        {/* Urgent red pulse overlay */}
        {isUrgent && (
          <div
            style={{
              position: 'absolute',
              inset: 0,
              background: `radial-gradient(ellipse at center, rgba(255, 0, 0, ${urgentPulse}), transparent 70%)`,
            }}
          />
        )}

        {/* Circular ring indicator (SVG-like using border) */}
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: ringSize,
            height: ringSize,
            borderRadius: '50%',
            border: `3px solid rgba(255,255,255,0.06)`,
          }}
        />

        {/* Progress arc (approximated with conic gradient) */}
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%) rotate(-90deg)',
            width: ringSize,
            height: ringSize,
            borderRadius: '50%',
            background: `conic-gradient(${isUrgent ? '#FF2222' : '#3498db'} ${ringProgress}%, transparent ${ringProgress}%)`,
            mask: `radial-gradient(circle, transparent ${ringSize * 0.44}px, black ${ringSize * 0.44}px, black ${ringSize * 0.5}px, transparent ${ringSize * 0.5}px)`,
            WebkitMask: `radial-gradient(circle, transparent ${ringSize * 0.44}px, black ${ringSize * 0.44}px, black ${ringSize * 0.5}px, transparent ${ringSize * 0.5}px)`,
            opacity: 0.7,
          }}
        />

        {/* Digital countdown readout */}
        <div
          style={{
            position: 'absolute',
            bottom: '8%',
            left: '50%',
            transform: 'translateX(-50%)',
            fontFamily: "'Courier New', monospace",
            fontSize: 'clamp(14px, 4vw, 28px)',
            fontWeight: 700,
            color: isUrgent ? '#FF4444' : 'rgba(255,255,255,0.4)',
            letterSpacing: 3,
            textAlign: 'center',
          }}
        >
          00:{String(Math.max(0, Math.floor(countdown))).padStart(2, '0')}.{String(Math.floor((countdown % 1) * 100)).padStart(2, '0')}
        </div>

        {/* ON AIR label */}
        <div
          style={{
            position: 'absolute',
            top: '6%',
            left: '50%',
            transform: 'translateX(-50%)',
            fontFamily: "'Arial Black', sans-serif",
            fontSize: 'clamp(8px, 2vw, 14px)',
            fontWeight: 900,
            color: isUrgent ? '#FF4444' : 'rgba(255,255,255,0.3)',
            letterSpacing: 6,
            opacity: isUrgent ? (Math.floor(time * 3) % 2 === 0 ? 1 : 0.4) : 0.4,
          }}
        >
          ON AIR IN
        </div>

        {/* Tick marks around the ring */}
        {Array.from({ length: 12 }).map((_, i) => {
          const angle = (i / 12) * 360 - 90
          const rad = (angle * Math.PI) / 180
          const outerR = ringSize * 0.55
          const innerR = ringSize * 0.48
          const x1 = width / 2 + Math.cos(rad) * innerR
          const y1 = height / 2 + Math.sin(rad) * innerR
          const x2 = width / 2 + Math.cos(rad) * outerR
          const y2 = height / 2 + Math.sin(rad) * outerR
          const isMajor = i % 3 === 0

          return (
            <div
              key={i}
              style={{
                position: 'absolute',
                left: x1,
                top: y1,
                width: Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2)),
                height: isMajor ? 2 : 1,
                background: `rgba(255,255,255,${isMajor ? 0.2 : 0.08})`,
                transformOrigin: '0 50%',
                transform: `rotate(${angle}deg)`,
              }}
            />
          )
        })}
      </div>
    )
  },

  renderWord: ({ word, color, enterProgress, holdProgress, exitProgress, phase, frame }: WordRenderProps) => {
    const currentFrame = frame ?? 0
    const time = currentFrame / 30
    const countdown = 10 - (time % 11)
    const isUrgent = countdown <= 3

    let opacity = 1
    let scale = 1
    let translateY = 0

    if (phase === 'enter') {
      // Dramatic scale-up with overshoot
      const eased = 1 - Math.pow(1 - enterProgress, 3)
      scale = 0.3 + eased * 0.8
      opacity = Math.min(1, enterProgress * 2)
      // Slight overshoot
      if (enterProgress > 0.7) {
        const overshoot = (enterProgress - 0.7) / 0.3
        scale = 1.1 - overshoot * 0.1
      }
    } else if (phase === 'hold') {
      opacity = 1
      // Urgency shake at low countdown
      if (isUrgent) {
        const shakeIntensity = (3 - Math.max(0, countdown)) * 1.5
        translateY = Math.sin(currentFrame * 0.5) * shakeIntensity
        // Pulse scale
        scale = 1 + Math.sin(currentFrame * 0.3) * 0.03
      }
    } else {
      // Shrink out
      const eased = Math.pow(exitProgress, 3)
      scale = 1 - eased * 0.5
      opacity = 1 - exitProgress
    }

    return (
      <div
        style={{
          position: 'absolute',
          top: '46%',
          left: '50%',
          transform: `translate(-50%, calc(-50% + ${translateY}px)) scale(${scale})`,
          opacity,
          textAlign: 'center',
        }}
      >
        <div
          style={{
            fontFamily: "'Arial Black', 'Impact', sans-serif",
            fontSize: 'clamp(40px, 12vw, 150px)',
            fontWeight: 900,
            color: isUrgent && phase === 'hold' ? '#FF2222' : color,
            textTransform: 'uppercase',
            whiteSpace: 'nowrap',
            letterSpacing: 4,
            textShadow: isUrgent
              ? '0 0 20px rgba(255, 0, 0, 0.4), 0 0 40px rgba(255, 0, 0, 0.2)'
              : `0 0 20px ${color}20`,
            lineHeight: 1,
          }}
        >
          {word}
        </div>
        {/* Urgency bar below */}
        <div
          style={{
            marginTop: 10,
            height: 3,
            background: isUrgent
              ? `linear-gradient(90deg, transparent, #FF2222, transparent)`
              : `linear-gradient(90deg, transparent, ${color}40, transparent)`,
            borderRadius: 1,
            opacity: phase === 'hold' ? 0.8 : 0.4,
          }}
        />
      </div>
    )
  },
}

function CountdownClockComponent(props: MotionGraphicProps<CountdownClockConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-countdown-clock',
  title: 'Countdown Clock',
  description: 'Live broadcast countdown timer with circular progress ring, digital readout, urgency pulse at final seconds, and dramatic scale-in text',
  tags: ['kinetic', 'typography', 'broadcast', 'countdown', 'timer', 'clock', 'live', 'television', 'urgency'],
  category: 'captions',
  component: CountdownClockComponent as any,
  defaultConfig: {
    words: ['GOING', 'LIVE', 'IN', 'NOW'],
    colors: ['#FFFFFF', '#3498db', '#FFFFFF', '#FF4444'],
    bgColor: '#0a0a14',
    cycleDuration: 2.0,
  },
  configSchema: [
    { key: 'words', label: 'Words', type: 'text-array', defaultValue: ['GOING', 'LIVE', 'IN', 'NOW'], group: 'Content' },
    { key: 'colors', label: 'Colors', type: 'text-array', defaultValue: ['#FFFFFF', '#3498db', '#FFFFFF', '#FF4444'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#0a0a14', group: 'Style' },
    { key: 'cycleDuration', label: 'Cycle Duration (s)', type: 'number', defaultValue: 2.0, min: 0.5, max: 5, group: 'Timing' },
  ],
})
