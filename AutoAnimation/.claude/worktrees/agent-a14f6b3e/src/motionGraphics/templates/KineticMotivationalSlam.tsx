import { registerMotionGraphic } from '../registry'
import { KineticBase, type KineticBaseConfig, type KineticAnimation, type WordRenderProps, type BackgroundRenderProps } from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface MotivationalSlamConfig extends KineticBaseConfig {}

function easeOutExpo(t: number): number {
  return t === 1 ? 1 : 1 - Math.pow(2, -10 * t)
}

function easeInBack(t: number): number {
  const c1 = 1.70158
  const c3 = c1 + 1
  return c3 * t * t * t - c1 * t * t
}

const animation: KineticAnimation = {
  renderBackground: ({ bgColor, frame, fps }: BackgroundRenderProps) => {
    // Subtle vignette that pulses with each word slam
    const time = frame / fps
    const pulseIntensity = 0.3 + Math.sin(time * 4) * 0.05
    return (
      <div style={{ position: 'absolute', inset: 0, background: bgColor }}>
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: `radial-gradient(ellipse at center, transparent 40%, rgba(0,0,0,${pulseIntensity}) 100%)`,
          }}
        />
      </div>
    )
  },

  renderWord: ({ word, color, enterProgress, holdProgress, exitProgress, phase, index }: WordRenderProps) => {
    let opacity = 1
    let scale = 1
    let translateY = 0
    let rotation = 0
    let shakeX = 0
    let shakeY = 0

    if (phase === 'enter') {
      const eased = easeOutExpo(enterProgress)
      // Word slams in from huge scale with overshoot
      scale = 4 - 3.2 * eased
      if (enterProgress > 0.7) {
        // Overshoot bounce
        const bounceT = (enterProgress - 0.7) / 0.3
        scale = 0.8 + Math.sin(bounceT * Math.PI) * 0.15 + bounceT * 0.2
      }
      opacity = Math.min(1, enterProgress * 5)
      // Screen shake on impact
      if (enterProgress > 0.5 && enterProgress < 0.85) {
        const shakeT = (enterProgress - 0.5) / 0.35
        const shakeAmount = (1 - shakeT) * 8
        const seed = index * 73 + 17
        shakeX = Math.sin(shakeT * Math.PI * 12 + seed) * shakeAmount
        shakeY = Math.cos(shakeT * Math.PI * 10 + seed) * shakeAmount * 0.6
      }
    } else if (phase === 'hold') {
      opacity = 1
      // Subtle breathing scale during hold
      scale = 1 + Math.sin(holdProgress * Math.PI * 2) * 0.015
    } else {
      const eased = easeInBack(exitProgress)
      scale = 1 - eased * 0.8
      rotation = eased * 8
      translateY = eased * 30
      opacity = 1 - exitProgress
    }

    return (
      <>
        {/* Impact shadow */}
        {phase === 'enter' && enterProgress > 0.4 && (
          <div
            style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: `translate(calc(-50% + ${shakeX}px), calc(-50% + ${shakeY + 4}px)) scale(${scale})`,
              fontFamily: "'Impact', 'Arial Black', 'Helvetica Neue', sans-serif",
              fontSize: 'clamp(56px, 18vw, 220px)',
              fontWeight: 900,
              textTransform: 'uppercase',
              letterSpacing: '0.04em',
              whiteSpace: 'nowrap',
              color: 'rgba(0,0,0,0.4)',
              userSelect: 'none',
            }}
          >
            {word}
          </div>
        )}
        {/* Main word */}
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: `translate(calc(-50% + ${shakeX}px), calc(-50% + ${shakeY + translateY}px)) scale(${scale}) rotate(${rotation}deg)`,
            opacity,
            fontFamily: "'Impact', 'Arial Black', 'Helvetica Neue', sans-serif",
            fontSize: 'clamp(56px, 18vw, 220px)',
            fontWeight: 900,
            textTransform: 'uppercase',
            letterSpacing: '0.04em',
            whiteSpace: 'nowrap',
            color,
            textShadow: `0 0 40px ${color}66, 0 2px 0 rgba(0,0,0,0.3)`,
          }}
        >
          {word}
        </div>
      </>
    )
  },
}

function MotivationalSlamComponent(props: MotionGraphicProps<MotivationalSlamConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-motivational-slam',
  title: 'Kinetic Motivational Slam',
  description: 'Motivational words SLAM in one at a time with screen shake and scale overshoot. Bold, impactful.',
  tags: ['kinetic', 'typography', 'motivational', 'slam', 'impact', 'bold', 'shake'],
  category: 'captions',
  component: MotivationalSlamComponent as any,
  defaultConfig: {
    words: ['NEVER', 'GIVE', 'UP'],
    colors: ['#FF4444', '#FF8800', '#FFCC00'],
    bgColor: '#0A0A0A',
    cycleDuration: 1.2,
  },
  configSchema: [
    { key: 'words', label: 'Words', type: 'text-array', defaultValue: ['NEVER', 'GIVE', 'UP'], group: 'Content' },
    { key: 'colors', label: 'Colors', type: 'text-array', defaultValue: ['#FF4444', '#FF8800', '#FFCC00'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#0A0A0A', group: 'Style' },
    { key: 'cycleDuration', label: 'Cycle Duration (s)', type: 'number', defaultValue: 1.2, min: 0.3, max: 5, group: 'Timing' },
  ],
})
