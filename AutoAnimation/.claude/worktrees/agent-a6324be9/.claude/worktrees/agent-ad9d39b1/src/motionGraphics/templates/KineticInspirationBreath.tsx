import { registerMotionGraphic } from '../registry'
import { KineticBase, type KineticBaseConfig, type KineticAnimation, type WordRenderProps, type BackgroundRenderProps } from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface InspirationBreathConfig extends KineticBaseConfig {}

function easeInOutSine(t: number): number {
  return -(Math.cos(Math.PI * t) - 1) / 2
}

const animation: KineticAnimation = {
  renderBackground: ({ bgColor, frame, fps }: BackgroundRenderProps) => {
    const time = frame / fps
    // Soft gradient that shifts gently like ambient light
    const hueShift = Math.sin(time * 0.3) * 10
    return (
      <div style={{ position: 'absolute', inset: 0, background: bgColor }}>
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: `radial-gradient(ellipse at 50% 50%, rgba(255,255,255,0.03) 0%, transparent 70%)`,
            opacity: 0.5 + Math.sin(time * 0.8) * 0.2,
          }}
        />
      </div>
    )
  },

  renderWord: ({ word, color, enterProgress, holdProgress, exitProgress, phase }: WordRenderProps) => {
    let opacity = 0
    let scale = 0.95
    let letterSpacing = '0.02em'
    let blur = 0

    if (phase === 'enter') {
      // Slow, gentle inhale — fade in with scale from 0.95 to 1.0
      const eased = easeInOutSine(enterProgress)
      opacity = eased
      scale = 0.95 + eased * 0.05
      blur = (1 - eased) * 4
      letterSpacing = `${0.02 + (1 - eased) * 0.06}em`
    } else if (phase === 'hold') {
      // Gentle breathing pulse during hold
      const breathCycle = Math.sin(holdProgress * Math.PI * 3)
      opacity = 1
      scale = 1 + breathCycle * 0.02
      letterSpacing = `${0.02 + breathCycle * 0.005}em`
    } else {
      // Slow exhale — fade out smoothly
      const eased = easeInOutSine(exitProgress)
      opacity = 1 - eased
      scale = 1 - eased * 0.03
      blur = eased * 6
      letterSpacing = `${0.02 + eased * 0.04}em`
    }

    return (
      <>
        {/* Soft glow behind text */}
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: `translate(-50%, -50%) scale(${scale * 1.5})`,
            width: '60%',
            height: '30%',
            background: `radial-gradient(ellipse, ${color}15 0%, transparent 70%)`,
            opacity,
          }}
        />
        {/* Main word */}
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: `translate(-50%, -50%) scale(${scale})`,
            opacity,
            filter: blur > 0 ? `blur(${blur}px)` : undefined,
            fontFamily: "'Georgia', 'Times New Roman', serif",
            fontSize: 'clamp(36px, 10vw, 120px)',
            fontWeight: 300,
            fontStyle: 'italic',
            letterSpacing,
            whiteSpace: 'nowrap',
            color,
            textShadow: `0 0 30px ${color}33`,
          }}
        >
          {word}
        </div>
      </>
    )
  },
}

function InspirationBreathComponent(props: MotionGraphicProps<InspirationBreathConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-inspiration-breath',
  title: 'Kinetic Inspiration Breath',
  description: 'Gentle breathing text animation with slow fade-in, soft pulse, and smooth exhale. Calm, meditative.',
  tags: ['kinetic', 'typography', 'inspiration', 'breath', 'calm', 'meditative', 'gentle'],
  category: 'captions',
  component: InspirationBreathComponent as any,
  defaultConfig: {
    words: ['breathe', 'believe', 'become'],
    colors: ['#B8C6DB', '#D4B5B0', '#C5D5C5'],
    bgColor: '#1A1A2E',
    cycleDuration: 2.5,
  },
  configSchema: [
    { key: 'words', label: 'Words', type: 'text-array', defaultValue: ['breathe', 'believe', 'become'], group: 'Content' },
    { key: 'colors', label: 'Colors', type: 'text-array', defaultValue: ['#B8C6DB', '#D4B5B0', '#C5D5C5'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#1A1A2E', group: 'Style' },
    { key: 'cycleDuration', label: 'Cycle Duration (s)', type: 'number', defaultValue: 2.5, min: 0.5, max: 8, group: 'Timing' },
  ],
})
