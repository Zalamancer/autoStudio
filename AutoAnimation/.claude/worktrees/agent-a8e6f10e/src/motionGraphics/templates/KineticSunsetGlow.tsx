import { registerMotionGraphic } from '../registry'
import { KineticBase, type KineticBaseConfig, type KineticAnimation, type WordRenderProps, type BackgroundRenderProps } from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface SunsetGlowConfig extends KineticBaseConfig {}

const animation: KineticAnimation = {
  renderBackground: ({ bgColor, frame, fps, height }: BackgroundRenderProps) => {
    const time = frame / fps
    // Animate gradient position to create slow sunset motion
    const gradientShift = Math.sin(time * 0.4) * 10
    const topStop = 20 + gradientShift
    const midStop = 50 + gradientShift * 0.5

    return (
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: `linear-gradient(180deg,
            #FF6B35 ${topStop}%,
            #E8447A ${midStop}%,
            #7B2D8E 80%,
            #1a0533 100%)`,
        }}
      />
    )
  },

  renderWord: ({ word, color, enterProgress, holdProgress, exitProgress, phase }: WordRenderProps) => {
    let opacity = 1
    let translateY = 0
    let glowIntensity = 1

    if (phase === 'enter') {
      // Sunrise from bottom
      opacity = enterProgress
      translateY = (1 - enterProgress) * 60
      glowIntensity = enterProgress
    } else if (phase === 'hold') {
      opacity = 1
      translateY = 0
      // Pulsing warm glow
      glowIntensity = 0.8 + Math.sin(holdProgress * Math.PI * 3) * 0.2
    } else {
      // Darken to night
      opacity = 1 - exitProgress
      glowIntensity = 1 - exitProgress
    }

    const glowColor = `rgba(255, 140, 50, ${0.6 * glowIntensity})`
    const glowColor2 = `rgba(255, 80, 120, ${0.3 * glowIntensity})`

    return (
      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: `translate(-50%, calc(-50% + ${translateY}px))`,
          opacity,
          fontSize: 'clamp(44px, 12vw, 160px)',
          fontWeight: 800,
          fontFamily: "'Georgia', 'Times New Roman', serif",
          color: '#FFF5E6',
          textShadow: `
            0 0 20px ${glowColor},
            0 0 40px ${glowColor},
            0 0 80px ${glowColor2},
            0 2px 10px rgba(0,0,0,0.3)
          `,
          whiteSpace: 'nowrap',
        }}
      >
        {word}
      </div>
    )
  },
}

function SunsetGlowComponent(props: MotionGraphicProps<SunsetGlowConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-sunset-glow',
  title: 'Kinetic Sunset Glow',
  description: 'Warm sunset gradient background with glowing text that rises like a sunrise and fades into night',
  tags: ['kinetic', 'typography', 'sunset', 'warm', 'gradient', 'glow'],
  category: 'captions',
  component: SunsetGlowComponent as any,
  defaultConfig: {
    words: ['SUNSET', 'GOLDEN', 'HOUR', 'GLOW'],
    colors: ['#FFD700', '#FF8C00', '#FF6347', '#FF69B4'],
    bgColor: '#FF6B35',
    cycleDuration: 1,
  },
  configSchema: [
    { key: 'words', label: 'Words', type: 'text-array', defaultValue: ['SUNSET', 'GOLDEN', 'HOUR', 'GLOW'], group: 'Content' },
    { key: 'colors', label: 'Colors', type: 'text-array', defaultValue: ['#FFD700', '#FF8C00', '#FF6347', '#FF69B4'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#FF6B35', group: 'Style' },
    { key: 'cycleDuration', label: 'Cycle Duration (s)', type: 'number', defaultValue: 1, min: 0.3, max: 5, group: 'Timing' },
  ],
})
