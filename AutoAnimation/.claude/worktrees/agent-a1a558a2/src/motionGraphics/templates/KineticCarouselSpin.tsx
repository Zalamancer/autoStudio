import { registerMotionGraphic } from '../registry'
import { KineticBase, type KineticBaseConfig, type KineticAnimation, type WordRenderProps, type BackgroundRenderProps } from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

// -- Carousel Spin ------------------------------------------------------------
// Characters are arranged on the surface of a 3D cylinder and rotate into
// front-facing position with stagger. On hold the cylinder breathes with a
// slow rotation oscillation. Exit spins the cylinder away.

interface CarouselSpinConfig extends KineticBaseConfig {
  radius: number
}

function easeOutBack(t: number): number {
  const c1 = 1.70158
  const c3 = c1 + 1
  return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2)
}

function easeInExpo(t: number): number {
  return t === 0 ? 0 : Math.pow(2, 10 * t - 10)
}

const animation: KineticAnimation = {
  renderBackground: ({ bgColor, frame, fps }: BackgroundRenderProps) => {
    const time = frame / fps
    // Rotating radial grid behind the carousel
    const rotation = time * 8
    return (
      <div style={{ position: 'absolute', inset: 0, background: bgColor, overflow: 'hidden' }}>
        {/* Radial spokes that slowly rotate */}
        {Array.from({ length: 12 }, (_, i) => (
          <div key={i} style={{
            position: 'absolute',
            top: '50%', left: '50%',
            width: '200%', height: 1,
            background: `rgba(255,255,255,${0.02 + Math.sin(time * 0.3 + i) * 0.008})`,
            transformOrigin: '0% 50%',
            transform: `rotate(${i * 30 + rotation}deg)`,
          }} />
        ))}
        {/* Central glow */}
        <div style={{
          position: 'absolute', inset: 0,
          background: `radial-gradient(circle at 50% 50%, rgba(100,140,255,0.06), transparent 60%)`,
          mixBlendMode: 'screen',
        }} />
      </div>
    )
  },

  renderWord: ({ word, color, enterProgress, holdProgress, exitProgress, phase, width, height }: WordRenderProps) => {
    const chars = word.split('')
    const totalChars = chars.length
    // Angle each character occupies on the cylinder
    const angleSpan = Math.min(180, totalChars * 28)
    const startAngle = -angleSpan / 2
    const charAngleStep = totalChars > 1 ? angleSpan / (totalChars - 1) : 0

    // Cylinder rotation offset for the whole group
    let cylinderRotY = 0
    let globalOpacity = 1

    if (phase === 'enter') {
      // Spin in from behind (-90deg)
      cylinderRotY = -90 * (1 - easeOutBack(enterProgress))
      globalOpacity = Math.min(1, enterProgress * 2.5)
    } else if (phase === 'hold') {
      // Gentle oscillation
      cylinderRotY = Math.sin(holdProgress * Math.PI * 4) * 3
    } else {
      // Spin out forward
      cylinderRotY = 90 * easeInExpo(exitProgress)
      globalOpacity = 1 - exitProgress * 0.7
    }

    const charElements = chars.map((ch, ci) => {
      const charAngle = startAngle + ci * charAngleStep
      const stagger = ci * 0.08

      let charEnterOffset = 0
      let charScale = 1
      if (phase === 'enter') {
        const p = Math.max(0, Math.min(1, (enterProgress - stagger) / Math.max(0.01, 1 - stagger * totalChars * 0.06)))
        const e = easeOutBack(p)
        charEnterOffset = (1 - e) * 40 // translateZ shift
        charScale = 0.3 + e * 0.7
      }

      let holdShift = 0
      if (phase === 'hold') {
        holdShift = Math.sin(holdProgress * Math.PI * 5 + ci * 0.9) * 2
      }

      // Each char sits on the cylinder surface
      const rotY = charAngle + cylinderRotY + holdShift
      const radius = 280

      return (
        <div key={ci} style={{
          position: 'absolute',
          transform: `rotateY(${rotY}deg) translateZ(${radius + charEnterOffset}px) scale(${charScale})`,
          backfaceVisibility: 'hidden',
          fontFamily: "'Arial Black', 'Impact', sans-serif",
          fontSize: 'clamp(40px, 12vw, 160px)',
          fontWeight: 900,
          color,
          textShadow: `0 0 20px ${color}44`,
          whiteSpace: 'nowrap',
        }}>
          {ch}
        </div>
      )
    })

    return (
      <div style={{ position: 'absolute', inset: 0, overflow: 'hidden' }}>
        <div style={{
          position: 'absolute', top: '50%', left: '50%',
          transform: 'translate(-50%, -50%)',
          perspective: '800px',
          perspectiveOrigin: '50% 50%',
        }}>
          <div style={{
            transformStyle: 'preserve-3d',
            opacity: globalOpacity,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
            {charElements}
          </div>
        </div>
      </div>
    )
  },
}

function CarouselSpinComponent(props: MotionGraphicProps<CarouselSpinConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-carousel-spin',
  title: 'Kinetic Carousel Spin',
  description: 'Characters arranged on a 3D cylinder rotate into front-facing position with staggered timing, oscillate gently on hold, and spin away on exit.',
  tags: ['kinetic', 'typography', '3d', 'carousel', 'cylinder', 'rotation', 'perspective', 'spin'],
  category: 'captions',
  component: CarouselSpinComponent as any,
  defaultConfig: {
    words: ['SPIN', 'ORBIT', 'RING', 'CYCLE'],
    colors: ['#6BAAFF', '#FF6BDB', '#6BFFC8', '#FFD76B'],
    bgColor: '#08081a',
    cycleDuration: 1.3,
    radius: 280,
  },
  configSchema: [
    { key: 'words', label: 'Words', type: 'text-array', defaultValue: ['SPIN', 'ORBIT', 'RING', 'CYCLE'], group: 'Content' },
    { key: 'colors', label: 'Colors', type: 'text-array', defaultValue: ['#6BAAFF', '#FF6BDB', '#6BFFC8', '#FFD76B'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#08081a', group: 'Style' },
    { key: 'cycleDuration', label: 'Cycle Duration (s)', type: 'number', defaultValue: 1.3, min: 0.5, max: 5, group: 'Timing' },
    { key: 'radius', label: 'Cylinder Radius', type: 'number', defaultValue: 280, min: 100, max: 600, group: 'Animation' },
  ],
})
