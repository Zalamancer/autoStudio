import { registerMotionGraphic } from '../registry'
import { KineticBase, type KineticBaseConfig, type KineticAnimation, type WordRenderProps, type BackgroundRenderProps } from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface SaulBassGeometricConfig extends KineticBaseConfig {
  shapeCount: number
}

const animation: KineticAnimation = {
  renderBackground: ({ bgColor, frame, fps }: BackgroundRenderProps) => {
    const time = frame / fps

    // Saul Bass: bold geometric shapes, primary colors, dramatic movement
    // Think: Vertigo, Psycho, Anatomy of a Murder, The Man with the Golden Arm
    // Shapes slide independently — autonomous graphic elements
    const slide1 = (Math.sin(time * 0.6) * 0.5 + 0.5) * 20
    const slide2 = (Math.cos(time * 0.45) * 0.5 + 0.5) * 15
    const slide3 = Math.sin(time * 0.35 + 1.2) * 10

    return (
      <div style={{ position: 'absolute', inset: 0, background: bgColor, overflow: 'hidden' }}>
        {/* Bass shape 1 — bold horizontal bar */}
        <div
          style={{
            position: 'absolute',
            left: `${-5 + slide1}px`,
            top: '15%',
            right: 0,
            height: '12%',
            background: '#E8241A', // Bass red
            pointerEvents: 'none',
          }}
        />
        {/* Bass shape 2 — diagonal strip */}
        <div
          style={{
            position: 'absolute',
            left: '20%',
            top: `${60 + slide2}%`,
            width: '60%',
            height: '8%',
            background: '#F5C800', // Bass yellow
            transform: `skewX(-8deg) translateY(${slide3}px)`,
            pointerEvents: 'none',
          }}
        />
        {/* Bass shape 3 — vertical rectangle */}
        <div
          style={{
            position: 'absolute',
            right: '18%',
            top: '25%',
            width: '6%',
            bottom: '20%',
            background: '#1A1A1A',
            transform: `translateX(${slide2 * 0.5}px)`,
            pointerEvents: 'none',
          }}
        />
        {/* Bass shape 4 — circle, Psycho-style */}
        <div
          style={{
            position: 'absolute',
            left: '12%',
            top: '55%',
            width: 50,
            height: 50,
            borderRadius: '50%',
            background: '#E8241A',
            transform: `translate(${slide1 * 0.4}px, ${-slide3}px)`,
            pointerEvents: 'none',
          }}
        />
        {/* Bass lower horizontal rule */}
        <div
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            bottom: '22%',
            height: 3,
            background: '#1A1A1A',
            pointerEvents: 'none',
          }}
        />
      </div>
    )
  },

  renderWord: ({ word, color, enterProgress, exitProgress, phase, index, frame }: WordRenderProps) => {
    const f = frame ?? 0
    const t = f / 30

    let opacity = 1
    let translateX = 0
    let translateY = 0

    if (phase === 'enter') {
      // Bass entry: hard cut with shape sliding in from left
      const ease = Math.min(1, enterProgress * 2.5)
      translateX = (1 - ease) * -40
      opacity = ease > 0.3 ? 1 : 0 // snap
    } else if (phase === 'hold') {
      // Subtle Bass compositional stillness with micro tension
      translateX = Math.sin(t * 0.3 + index) * 1
      translateY = Math.cos(t * 0.4 + index * 0.7) * 0.8
    } else {
      // Slide out right — Bass graphic resolves
      const ease = Math.pow(exitProgress, 2)
      translateX = ease * 30
      opacity = 1 - ease
    }

    return (
      <div
        style={{
          position: 'absolute',
          top: '45%',
          left: '50%',
          transform: `translate(calc(-50% + ${translateX}px), calc(-50% + ${translateY}px))`,
          opacity,
          fontFamily: "'Arial Black', 'Helvetica Neue', sans-serif",
          fontSize: 'clamp(52px, 14vw, 190px)',
          fontWeight: 900,
          color,
          whiteSpace: 'nowrap',
          textTransform: 'uppercase',
          letterSpacing: -3,
          // Saul Bass: no drop shadow, pure graphic
        }}
      >
        {word}
      </div>
    )
  },
}

function SaulBassGeometricComponent(props: MotionGraphicProps<SaulBassGeometricConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-saul-bass-geometric',
  title: 'Kinetic Saul Bass Geometric',
  description: 'Saul Bass title sequence style — bold primary-color geometric shapes sliding autonomously (Vertigo, Psycho aesthetic), stark typography with no shadow, pure graphic composition',
  tags: ['kinetic', 'typography', 'saul bass', 'geometric', 'title design', 'graphic', 'bold', 'classic'],
  category: 'captions',
  component: SaulBassGeometricComponent as any,
  defaultConfig: {
    words: ['VERTIGO', 'PSYCHO', 'ANATOMY', 'SHOCK'],
    colors: ['#FFFFFF', '#F5C800', '#FFFFFF', '#E8241A'],
    bgColor: '#F5F0E8',
    cycleDuration: 1.4,
    shapeCount: 4,
  },
  configSchema: [
    { key: 'words', label: 'Words', type: 'text-array', defaultValue: ['VERTIGO', 'PSYCHO', 'ANATOMY', 'SHOCK'], group: 'Content' },
    { key: 'colors', label: 'Colors', type: 'text-array', defaultValue: ['#FFFFFF', '#F5C800', '#FFFFFF', '#E8241A'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#F5F0E8', group: 'Style' },
    { key: 'cycleDuration', label: 'Cycle Duration (s)', type: 'number', defaultValue: 1.4, min: 0.5, max: 5, group: 'Timing' },
    { key: 'shapeCount', label: 'Shape Count', type: 'number', defaultValue: 4, min: 2, max: 8, group: 'Animation' },
  ],
})
