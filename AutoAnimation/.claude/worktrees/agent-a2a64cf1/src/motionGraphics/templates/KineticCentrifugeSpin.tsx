import { registerMotionGraphic } from '../registry'
import {
  KineticBase,
  type KineticBaseConfig,
  type KineticAnimation,
  type WordRenderProps,
  type BackgroundRenderProps,
} from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface CentrifugeSpinConfig extends KineticBaseConfig {
  spins: number
}

const animation: KineticAnimation = {
  renderBackground: ({ bgColor, width, height, frame, fps }: BackgroundRenderProps) => {
    const time = frame / fps
    // Spinning radial lines suggest centrifugal force
    const numLines = 24
    return (
      <div style={{ position: 'absolute', inset: 0, background: bgColor }}>
        {Array.from({ length: numLines }, (_, i) => {
          const baseAngle = (i / numLines) * 360
          const rotatingAngle = baseAngle + time * 180 // fast spin
          const alpha = 0.04 + (i % 3 === 0 ? 0.06 : 0)
          return (
            <div
              key={i}
              style={{
                position: 'absolute',
                left: '50%',
                top: '50%',
                width: Math.max(width, height),
                height: 1,
                background: `rgba(255,255,255,${alpha})`,
                transformOrigin: '0 50%',
                transform: `rotate(${rotatingAngle}deg)`,
              }}
            />
          )
        })}
        {/* Inner circle */}
        <div
          style={{
            position: 'absolute',
            left: '50%',
            top: '50%',
            transform: `translate(-50%, -50%) rotate(${time * 360}deg)`,
            width: 160,
            height: 160,
            borderRadius: '50%',
            border: '2px solid rgba(255,255,255,0.08)',
            boxShadow: 'inset 0 0 30px rgba(255,255,255,0.04)',
          }}
        />
        <div
          style={{
            position: 'absolute',
            left: '50%',
            top: '50%',
            transform: `translate(-50%, -50%) rotate(${-time * 270}deg)`,
            width: 280,
            height: 280,
            borderRadius: '50%',
            border: '1px solid rgba(255,255,255,0.05)',
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
    frame,
  }: WordRenderProps) => {
    const f = frame ?? 0

    let rotate = 0
    let opacity = 1
    let scale = 1
    let blur = 0
    let shakeX = 0
    let shakeY = 0

    // Total rotation during enter: 3 full spins + deceleration
    const totalSpinDeg = 1080

    if (phase === 'enter') {
      // Starts fast, decelerates: easeOutQuart
      const eased = 1 - Math.pow(1 - enterProgress, 4)
      rotate = totalSpinDeg * (1 - eased) - totalSpinDeg
      // Motion blur proportional to angular velocity (approximated by 1 - eased)
      const angularVelocity = 1 - eased
      blur = angularVelocity * 12
      scale = 0.6 + eased * 0.4 + Math.sin(enterProgress * Math.PI * 3) * 0.05
      opacity = Math.min(1, enterProgress * 3)

      // Screen shake as it decelerates to stop
      if (enterProgress > 0.75) {
        const settleT = (enterProgress - 0.75) / 0.25
        const shakeAmp = (1 - settleT) * 10
        shakeX = Math.sin(f * 4.2) * shakeAmp
        shakeY = Math.cos(f * 3.7) * shakeAmp * 0.6
      }
    } else if (phase === 'hold') {
      // Stopped — resonance wobble dying off
      const wobble = Math.exp(-holdProgress * 12) * Math.sin(holdProgress * 45) * 4
      rotate = wobble
      shakeX = Math.exp(-holdProgress * 8) * Math.sin(holdProgress * 30) * 3
      opacity = 1
      scale = 1
    } else {
      // Exit: spins back up and flies away
      const t = exitProgress * exitProgress
      rotate = t * 720
      scale = 1 - t * 0.4
      blur = t * 8
      opacity = 1 - exitProgress
    }

    return (
      <div
        style={{
          position: 'absolute',
          inset: 0,
          transform: `translate(${shakeX}px, ${shakeY}px)`,
        }}
      >
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: `translate(-50%, -50%) rotate(${rotate}deg) scale(${scale})`,
            transformOrigin: 'center center',
            opacity,
            filter: blur > 0.5 ? `blur(${blur}px)` : undefined,
            fontFamily: "'Impact', 'Arial Black', sans-serif",
            fontSize: 'clamp(48px, 13vw, 180px)',
            fontWeight: 900,
            color,
            textTransform: 'uppercase',
            whiteSpace: 'nowrap',
            letterSpacing: 6,
            textShadow: `0 0 40px ${color}80, 4px 4px 0 rgba(0,0,0,0.6)`,
          }}
        >
          {word}
        </div>
        {/* Motion streak rings */}
        {phase === 'enter' && enterProgress < 0.7 && (
          <>
            {[0.85, 0.7].map((opMult, i) => (
              <div
                key={i}
                style={{
                  position: 'absolute',
                  top: '50%',
                  left: '50%',
                  transform: `translate(-50%, -50%) rotate(${rotate - (i + 1) * 25}deg) scale(${scale})`,
                  opacity: opacity * opMult * (1 - enterProgress),
                  filter: `blur(${blur * 0.6}px)`,
                  fontFamily: "'Impact', 'Arial Black', sans-serif",
                  fontSize: 'clamp(48px, 13vw, 180px)',
                  fontWeight: 900,
                  color,
                  whiteSpace: 'nowrap',
                  letterSpacing: 6,
                }}
              >
                {word}
              </div>
            ))}
          </>
        )}
      </div>
    )
  },
}

function CentrifugeSpinComponent(props: MotionGraphicProps<CentrifugeSpinConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-centrifuge-spin',
  title: 'Kinetic Centrifuge Spin',
  description:
    'Text spins at high RPM with motion blur, decelerates dramatically to a stop with screen shake. Spinning radial lines reinforce centrifugal force.',
  tags: ['kinetic', 'typography', 'spin', 'rotate', 'centrifuge', 'energy', 'blur', 'physics'],
  category: 'captions',
  component: CentrifugeSpinComponent as any,
  defaultConfig: {
    words: ['SPIN!', 'WHIRL', 'TWIST', 'VORTEX'],
    colors: ['#FF4488', '#00FFAA', '#FFCC00', '#44AAFF'],
    bgColor: '#08080f',
    cycleDuration: 1.6,
    spins: 3,
  },
  configSchema: [
    {
      key: 'words',
      label: 'Words',
      type: 'text-array',
      defaultValue: ['SPIN!', 'WHIRL', 'TWIST', 'VORTEX'],
      group: 'Content',
    },
    {
      key: 'colors',
      label: 'Colors',
      type: 'text-array',
      defaultValue: ['#FF4488', '#00FFAA', '#FFCC00', '#44AAFF'],
      group: 'Style',
    },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#08080f', group: 'Style' },
    {
      key: 'cycleDuration',
      label: 'Cycle Duration (s)',
      type: 'number',
      defaultValue: 1.6,
      min: 0.5,
      max: 5,
      group: 'Timing',
    },
    {
      key: 'spins',
      label: 'Spin Count',
      type: 'number',
      defaultValue: 3,
      min: 1,
      max: 8,
      group: 'Animation',
    },
  ],
})
