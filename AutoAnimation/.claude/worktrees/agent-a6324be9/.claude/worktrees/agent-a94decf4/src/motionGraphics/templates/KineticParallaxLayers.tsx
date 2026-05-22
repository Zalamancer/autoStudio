import { registerMotionGraphic } from '../registry'
import { KineticBase, type KineticBaseConfig, type KineticAnimation, type WordRenderProps, type BackgroundRenderProps } from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface ParallaxLayersConfig extends KineticBaseConfig {}

function easeOutQuart(t: number): number {
  return 1 - Math.pow(1 - t, 4)
}

function easeInQuart(t: number): number {
  return t * t * t * t
}

const animation: KineticAnimation = {
  renderBackground: ({ bgColor }: BackgroundRenderProps) => (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        background: `radial-gradient(ellipse at 50% 50%, ${bgColor}cc, ${bgColor})`,
      }}
    />
  ),

  renderWord: ({ word, color, enterProgress, holdProgress, exitProgress, phase }: WordRenderProps) => {
    // Three layers at different Z depths: shadow (back), main (mid), highlight (front)
    let layerSeparation = 0 // How far apart the layers are in Z
    let mainOpacity = 1
    let offsetX = 0

    if (phase === 'enter') {
      const eased = easeOutQuart(enterProgress)
      // Layers start separated and converge
      layerSeparation = 80 * (1 - eased)
      mainOpacity = Math.min(1, enterProgress * 2.5)
      offsetX = (1 - eased) * 40
    } else if (phase === 'hold') {
      // Subtle breathing separation
      layerSeparation = Math.sin(holdProgress * Math.PI * 2) * 8
      offsetX = Math.cos(holdProgress * Math.PI * 1.5) * 3
    } else {
      const eased = easeInQuart(exitProgress)
      // Layers separate and fade
      layerSeparation = 80 * eased
      mainOpacity = 1 - exitProgress
      offsetX = eased * -40
    }

    const baseFontStyle: React.CSSProperties = {
      position: 'absolute',
      fontSize: 'clamp(44px, 11vw, 150px)',
      fontWeight: 900,
      whiteSpace: 'nowrap',
      fontFamily: "'Inter', 'Helvetica Neue', sans-serif",
      letterSpacing: '0.05em',
      textTransform: 'uppercase',
    }

    return (
      <div
        style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          perspective: 800,
          perspectiveOrigin: '50% 50%',
          opacity: mainOpacity,
        }}
      >
        <div
          style={{
            position: 'relative',
            transformStyle: 'preserve-3d',
          }}
        >
          {/* Shadow layer (furthest back) */}
          <div
            style={{
              ...baseFontStyle,
              color: 'transparent',
              WebkitTextStroke: `2px ${color}22`,
              transform: `translateZ(${-layerSeparation * 2}px) translateX(${offsetX * -1.5}px)`,
              filter: 'blur(3px)',
            }}
          >
            {word}
          </div>

          {/* Back shadow layer */}
          <div
            style={{
              ...baseFontStyle,
              color: `${color}33`,
              transform: `translateZ(${-layerSeparation}px) translateX(${offsetX * -0.8}px)`,
              filter: 'blur(1px)',
              textShadow: `0 0 40px ${color}44`,
            }}
          >
            {word}
          </div>

          {/* Main layer (center) */}
          <div
            style={{
              ...baseFontStyle,
              position: 'relative',
              color,
              transform: `translateZ(0px) translateX(${offsetX * 0}px)`,
              textShadow: `0 2px 10px rgba(0,0,0,0.3)`,
            }}
          >
            {word}
          </div>

          {/* Highlight layer (closest to camera) */}
          <div
            style={{
              ...baseFontStyle,
              color: 'transparent',
              WebkitTextStroke: `1px ${color}66`,
              transform: `translateZ(${layerSeparation}px) translateX(${offsetX * 1.2}px)`,
              textShadow: `0 0 20px ${color}33`,
            }}
          >
            {word}
          </div>

          {/* Glint / specular layer (front-most) */}
          <div
            style={{
              ...baseFontStyle,
              color: 'transparent',
              WebkitTextStroke: `0.5px rgba(255,255,255,0.15)`,
              transform: `translateZ(${layerSeparation * 1.8}px) translateX(${offsetX * 1.8}px)`,
            }}
          >
            {word}
          </div>
        </div>
      </div>
    )
  },
}

function ParallaxLayersComponent(props: MotionGraphicProps<ParallaxLayersConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-parallax-layers',
  title: 'Kinetic Parallax Layers',
  description: 'Multi-layer parallax depth effect with shadow, main, and highlight at different Z depths',
  tags: ['kinetic', 'typography', '3d', 'parallax', 'layers', 'depth', 'perspective'],
  category: 'captions',
  component: ParallaxLayersComponent as any,
  defaultConfig: {
    words: ['DEPTH', 'FIELD', 'LAYERS', 'DEEP'],
    colors: ['#60A5FA', '#F87171', '#A78BFA', '#34D399'],
    bgColor: '#08080f',
    cycleDuration: 1.5,
  },
  configSchema: [
    { key: 'words', label: 'Words', type: 'text-array', defaultValue: ['DEPTH', 'FIELD', 'LAYERS', 'DEEP'], group: 'Content' },
    { key: 'colors', label: 'Colors', type: 'text-array', defaultValue: ['#60A5FA', '#F87171', '#A78BFA', '#34D399'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#08080f', group: 'Style' },
    { key: 'cycleDuration', label: 'Cycle Duration (s)', type: 'number', defaultValue: 1.5, min: 0.3, max: 5, group: 'Timing' },
  ],
})
