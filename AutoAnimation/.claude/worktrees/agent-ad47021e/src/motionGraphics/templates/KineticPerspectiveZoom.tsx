import { registerMotionGraphic } from '../registry'
import { KineticBase, type KineticBaseConfig, type KineticAnimation, type WordRenderProps, type BackgroundRenderProps } from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface PerspectiveZoomConfig extends KineticBaseConfig {}

function easeOutExpo(t: number): number {
  return t === 1 ? 1 : 1 - Math.pow(2, -10 * t)
}

function easeInExpo(t: number): number {
  return t === 0 ? 0 : Math.pow(2, 10 * t - 10)
}

const animation: KineticAnimation = {
  renderBackground: ({ bgColor, frame, fps }: BackgroundRenderProps) => {
    // Subtle grid to enhance 3D depth perception
    const time = frame / fps
    const gridOpacity = 0.06 + Math.sin(time * 0.5) * 0.02
    return (
      <div style={{ position: 'absolute', inset: 0, background: bgColor }}>
        <div
          style={{
            position: 'absolute',
            inset: 0,
            opacity: gridOpacity,
            backgroundImage:
              'linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)',
            backgroundSize: '60px 60px',
            perspective: 800,
            transform: 'rotateX(60deg)',
            transformOrigin: 'center bottom',
          }}
        />
      </div>
    )
  },

  renderWord: ({ word, color, enterProgress, holdProgress, exitProgress, phase }: WordRenderProps) => {
    let translateZ = 0
    let opacity = 1
    let scale = 1
    let blur = 0

    if (phase === 'enter') {
      // Flying towards camera from far away
      const eased = easeOutExpo(enterProgress)
      translateZ = -1000 + 1000 * eased
      scale = 0.1 + 0.9 * eased
      opacity = Math.min(1, enterProgress * 3)
      blur = (1 - eased) * 8
    } else if (phase === 'hold') {
      // Subtle float in Z space
      translateZ = Math.sin(holdProgress * Math.PI * 2) * 30
      scale = 1 + Math.sin(holdProgress * Math.PI * 2) * 0.02
    } else {
      // Flies past camera
      const eased = easeInExpo(exitProgress)
      translateZ = 500 * eased
      scale = 1 + 2 * eased
      opacity = 1 - eased
      blur = eased * 6
    }

    return (
      <div
        style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          perspective: 1200,
          perspectiveOrigin: '50% 50%',
        }}
      >
        <div
          style={{
            transform: `translateZ(${translateZ}px) scale(${scale})`,
            opacity,
            filter: blur > 0 ? `blur(${blur}px)` : undefined,
            fontSize: 'clamp(48px, 12vw, 160px)',
            fontWeight: 900,
            color,
            whiteSpace: 'nowrap',
            textShadow: `0 0 40px ${color}66, 0 0 80px ${color}33`,
            fontFamily: "'Inter', 'Helvetica Neue', sans-serif",
            letterSpacing: '0.06em',
            textTransform: 'uppercase',
          }}
        >
          {word}
        </div>
      </div>
    )
  },
}

function PerspectiveZoomComponent(props: MotionGraphicProps<PerspectiveZoomConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-perspective-zoom',
  title: 'Kinetic Perspective Zoom',
  description: 'Text flies at camera from deep 3D space with perspective zoom and motion blur',
  tags: ['kinetic', 'typography', '3d', 'zoom', 'perspective', 'fly'],
  category: 'captions',
  component: PerspectiveZoomComponent as any,
  defaultConfig: {
    words: ['ZOOM', 'INTO', 'THE', 'FUTURE'],
    colors: ['#818CF8', '#34D399', '#F472B6', '#FBBF24'],
    bgColor: '#050510',
    cycleDuration: 1.5,
  },
  configSchema: [
    { key: 'words', label: 'Words', type: 'text-array', defaultValue: ['ZOOM', 'INTO', 'THE', 'FUTURE'], group: 'Content' },
    { key: 'colors', label: 'Colors', type: 'text-array', defaultValue: ['#818CF8', '#34D399', '#F472B6', '#FBBF24'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#050510', group: 'Style' },
    { key: 'cycleDuration', label: 'Cycle Duration (s)', type: 'number', defaultValue: 1.5, min: 0.3, max: 5, group: 'Timing' },
  ],
})
