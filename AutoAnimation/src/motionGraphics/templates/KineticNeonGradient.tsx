import { registerMotionGraphic } from '../registry'
import { KineticBase, type KineticBaseConfig, type KineticAnimation, type WordRenderProps, type BackgroundRenderProps } from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface NeonGradientConfig extends KineticBaseConfig {}

const animation: KineticAnimation = {
  renderBackground: ({ bgColor }: BackgroundRenderProps) => (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        background: bgColor,
      }}
    >
      {/* Subtle radial ambient glow */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: 'radial-gradient(ellipse at 50% 50%, rgba(100, 0, 150, 0.08) 0%, transparent 70%)',
        }}
      />
    </div>
  ),

  renderWord: ({ word, color, enterProgress, holdProgress, exitProgress, phase }: WordRenderProps) => {
    let opacity = 1
    let scale = 1
    // Animate gradient position during hold
    const gradientOffset = phase === 'hold' ? holdProgress * 200 : phase === 'enter' ? enterProgress * 100 : (1 - exitProgress) * 200

    if (phase === 'enter') {
      opacity = enterProgress
      scale = 0.8 + enterProgress * 0.2
    } else if (phase === 'hold') {
      opacity = 1
      scale = 1
    } else {
      opacity = 1 - exitProgress
      scale = 1 - exitProgress * 0.1
    }

    // Neon gradient colors: electric blue -> neon pink -> lime
    const gradientCSS = `linear-gradient(90deg,
      #00D4FF ${gradientOffset - 50}%,
      #FF00FF ${gradientOffset}%,
      #39FF14 ${gradientOffset + 50}%,
      #00D4FF ${gradientOffset + 100}%)`

    const glowPulse = phase === 'hold' ? 0.7 + Math.sin(holdProgress * Math.PI * 4) * 0.3 : 1

    return (
      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: `translate(-50%, -50%) scale(${scale})`,
          opacity,
          whiteSpace: 'nowrap',
        }}
      >
        {/* Glow layer behind (blurred duplicate) */}
        <div
          style={{
            position: 'absolute',
            inset: -20,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 'clamp(48px, 14vw, 180px)',
            fontWeight: 900,
            fontFamily: "'Impact', 'Arial Black', sans-serif",
            textTransform: 'uppercase',
            letterSpacing: '0.02em',
            background: gradientCSS,
            WebkitBackgroundClip: 'text',
            backgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            filter: `blur(15px)`,
            opacity: 0.6 * glowPulse,
          }}
        >
          {word}
        </div>
        {/* Second glow layer */}
        <div
          style={{
            position: 'absolute',
            inset: -10,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 'clamp(48px, 14vw, 180px)',
            fontWeight: 900,
            fontFamily: "'Impact', 'Arial Black', sans-serif",
            textTransform: 'uppercase',
            letterSpacing: '0.02em',
            background: gradientCSS,
            WebkitBackgroundClip: 'text',
            backgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            filter: `blur(6px)`,
            opacity: 0.4 * glowPulse,
          }}
        >
          {word}
        </div>
        {/* Main text with gradient */}
        <div
          style={{
            position: 'relative',
            fontSize: 'clamp(48px, 14vw, 180px)',
            fontWeight: 900,
            fontFamily: "'Impact', 'Arial Black', sans-serif",
            textTransform: 'uppercase',
            letterSpacing: '0.02em',
            background: gradientCSS,
            WebkitBackgroundClip: 'text',
            backgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            textShadow: `
              0 0 10px rgba(0, 212, 255, ${0.3 * glowPulse}),
              0 0 30px rgba(255, 0, 255, ${0.2 * glowPulse}),
              0 0 50px rgba(57, 255, 20, ${0.15 * glowPulse})
            `,
          }}
        >
          {word}
        </div>
      </div>
    )
  },
}

function NeonGradientComponent(props: MotionGraphicProps<NeonGradientConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-neon-gradient',
  title: 'Kinetic Neon Gradient',
  description: 'Intense neon gradient text (blue/pink/lime) with animated position, multiple glow layers on a dark background',
  tags: ['kinetic', 'typography', 'neon', 'gradient', 'glow', 'vibrant'],
  category: 'captions',
  component: NeonGradientComponent as any,
  defaultConfig: {
    words: ['NEON', 'GLOW', 'VIVID', 'PULSE'],
    colors: ['#00D4FF', '#FF00FF', '#39FF14', '#FF6600'],
    bgColor: '#0A0A12',
    cycleDuration: 1,
  },
  configSchema: [
    { key: 'words', label: 'Words', type: 'text-array', defaultValue: ['NEON', 'GLOW', 'VIVID', 'PULSE'], group: 'Content' },
    { key: 'colors', label: 'Colors', type: 'text-array', defaultValue: ['#00D4FF', '#FF00FF', '#39FF14', '#FF6600'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#0A0A12', group: 'Style' },
    { key: 'cycleDuration', label: 'Cycle Duration (s)', type: 'number', defaultValue: 1, min: 0.3, max: 5, group: 'Timing' },
  ],
})
