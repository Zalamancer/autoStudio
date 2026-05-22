import { registerMotionGraphic } from '../registry'
import { KineticBase, type KineticBaseConfig, type KineticAnimation, type WordRenderProps, type BackgroundRenderProps } from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface TiltRevealConfig extends KineticBaseConfig {}

function easeOutBack(t: number): number {
  const c1 = 1.70158
  const c3 = c1 + 1
  return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2)
}

function easeInCubic(t: number): number {
  return t * t * t
}

const animation: KineticAnimation = {
  renderBackground: ({ bgColor }: BackgroundRenderProps) => (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        background: `radial-gradient(ellipse at center, ${bgColor}ee, ${bgColor})`,
      }}
    />
  ),

  renderWord: ({ word, color, enterProgress, holdProgress, exitProgress, phase }: WordRenderProps) => {
    let rotateX = 0
    let rotateY = 0
    let opacity = 1
    let shadowIntensity = 0

    if (phase === 'enter') {
      // Tilts in from angle
      const eased = easeOutBack(enterProgress)
      rotateX = 45 * (1 - eased)
      rotateY = -30 * (1 - eased)
      opacity = Math.min(1, enterProgress * 2.5)
      shadowIntensity = eased
    } else if (phase === 'hold') {
      // Subtle tilt sway
      const t = holdProgress * Math.PI * 2
      rotateX = Math.sin(t) * 3
      rotateY = Math.cos(t * 0.7) * 2
      shadowIntensity = 1
    } else {
      // Tilts away opposite direction
      const eased = easeInCubic(exitProgress)
      rotateX = -40 * eased
      rotateY = 25 * eased
      opacity = 1 - exitProgress
      shadowIntensity = 1 - eased
    }

    const shadowOffset = shadowIntensity * 20

    return (
      <div
        style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          perspective: 900,
          perspectiveOrigin: '50% 40%',
        }}
      >
        <div
          style={{
            transform: `rotateX(${rotateX}deg) rotateY(${rotateY}deg)`,
            opacity,
            fontSize: 'clamp(44px, 11vw, 150px)',
            fontWeight: 800,
            color,
            whiteSpace: 'nowrap',
            fontFamily: "'Inter', 'Helvetica Neue', sans-serif",
            letterSpacing: '0.03em',
            textTransform: 'uppercase',
            textShadow: `
              ${shadowOffset * 0.3}px ${shadowOffset}px ${shadowOffset * 2}px rgba(0,0,0,0.4),
              0 0 20px ${color}44
            `,
            padding: '16px 32px',
            borderBottom: `3px solid ${color}66`,
          }}
        >
          {word}
        </div>
      </div>
    )
  },
}

function TiltRevealComponent(props: MotionGraphicProps<TiltRevealConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-tilt-reveal',
  title: 'Kinetic Tilt Reveal',
  description: 'Sign board tilt reveal using rotateX/Y perspective with sway hold animation',
  tags: ['kinetic', 'typography', '3d', 'tilt', 'reveal', 'perspective', 'signboard'],
  category: 'captions',
  component: TiltRevealComponent as any,
  defaultConfig: {
    words: ['TILT', 'SHIFT', 'YOUR', 'VIEW'],
    colors: ['#E879F9', '#67E8F9', '#FDE68A', '#86EFAC'],
    bgColor: '#1a0a2e',
    cycleDuration: 1.5,
  },
  configSchema: [
    { key: 'words', label: 'Words', type: 'text-array', defaultValue: ['TILT', 'SHIFT', 'YOUR', 'VIEW'], group: 'Content' },
    { key: 'colors', label: 'Colors', type: 'text-array', defaultValue: ['#E879F9', '#67E8F9', '#FDE68A', '#86EFAC'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#1a0a2e', group: 'Style' },
    { key: 'cycleDuration', label: 'Cycle Duration (s)', type: 'number', defaultValue: 1.5, min: 0.3, max: 5, group: 'Timing' },
  ],
})
