import { registerMotionGraphic } from '../registry'
import {
  KineticBase,
  type KineticBaseConfig,
  type KineticAnimation,
  type WordRenderProps,
  type BackgroundRenderProps,
} from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface ProjectionMapConfig extends KineticBaseConfig {}

const animation: KineticAnimation = {
  renderBackground: ({ bgColor, frame, fps }: BackgroundRenderProps) => {
    const time = frame / fps

    return (
      <div style={{ position: 'absolute', inset: 0, background: bgColor, overflow: 'hidden' }}>
        {/* Uneven surface texture - faux brickwork / rough wall */}
        {Array.from({ length: 8 }, (_, i) => (
          <div
            key={`row-${i}`}
            style={{
              position: 'absolute',
              left: 0,
              right: 0,
              top: `${i * 12.5}%`,
              height: '12.5%',
              backgroundImage:
                i % 2 === 0
                  ? 'repeating-linear-gradient(90deg, rgba(80,75,65,0.12) 0px, rgba(80,75,65,0.12) 60px, rgba(60,55,50,0.06) 60px, rgba(60,55,50,0.06) 62px)'
                  : 'repeating-linear-gradient(90deg, rgba(60,55,50,0.06) 0px, rgba(60,55,50,0.06) 28px, rgba(80,75,65,0.12) 28px, rgba(80,75,65,0.12) 88px, rgba(60,55,50,0.06) 88px, rgba(60,55,50,0.06) 90px)',
              borderBottom: '1px solid rgba(60,55,50,0.08)',
            }}
          />
        ))}
        {/* Ambient light wash - warm yellow from room */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: 'radial-gradient(ellipse at 30% 20%, rgba(255,240,180,0.04) 0%, transparent 50%)',
            pointerEvents: 'none',
          }}
        />
        {/* Projector light cone - bright center falloff */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: 'radial-gradient(ellipse at 50% 50%, rgba(200,200,220,0.06) 0%, transparent 55%)',
            pointerEvents: 'none',
          }}
        />
        {/* Surface roughness shadow */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: 'radial-gradient(ellipse at center, transparent 30%, rgba(0,0,0,0.25) 100%)',
            pointerEvents: 'none',
          }}
        />
        {/* Faint dust particles in projector beam */}
        {Array.from({ length: 5 }, (_, i) => {
          const x = 20 + ((time * (8 + i * 3) + i * 40) % 60)
          const y = 15 + ((time * (5 + i * 2) + i * 25) % 70)
          const size = 1 + (i % 3)
          return (
            <div
              key={`dust-${i}`}
              style={{
                position: 'absolute',
                left: `${x}%`,
                top: `${y}%`,
                width: size,
                height: size,
                borderRadius: '50%',
                background: 'rgba(255,255,255,0.08)',
                pointerEvents: 'none',
              }}
            />
          )
        })}
      </div>
    )
  },

  renderWord: ({ word, color, enterProgress, exitProgress, phase, frame }: WordRenderProps) => {
    const f = frame ?? 0

    // Projection warp: slight keystone + perspective distortion
    const keystoneSkew = -2 // degrees - projector is slightly below
    const surfaceWarp = Math.sin(f * 0.03) * 0.5 // slight shift from surface unevenness

    // Light bleed at edges - text has soft, washed-out edges
    const bleedRadius = 3

    if (phase === 'enter') {
      // Projector powers on: beam brightens, text fades in with light wash
      const beamIntensity = Math.min(1, enterProgress * 2)
      const textClarity = Math.max(0, (enterProgress - 0.3) / 0.7)
      const scaleX = 0.95 + enterProgress * 0.05

      return (
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: `translate(-50%, -50%) perspective(800px) rotateX(${keystoneSkew}deg) scaleX(${scaleX})`,
          }}
        >
          {/* Projector light wash (before text is sharp) */}
          <div
            style={{
              position: 'absolute',
              inset: -40,
              background: `radial-gradient(ellipse at center, rgba(200,200,220,${0.08 * beamIntensity}) 0%, transparent 70%)`,
              pointerEvents: 'none',
            }}
          />
          {/* Light bleed layer */}
          <div
            style={{
              position: 'absolute',
              inset: 0,
              fontFamily: "'Impact', 'Arial Black', sans-serif",
              fontSize: 'clamp(40px, 11vw, 150px)',
              fontWeight: 900,
              color: `rgba(200,200,220,${0.15 * beamIntensity})`,
              whiteSpace: 'nowrap',
              letterSpacing: 6,
              filter: `blur(${bleedRadius + (1 - textClarity) * 6}px)`,
              textTransform: 'uppercase',
            }}
          >
            {word}
          </div>
          {/* Main projected text */}
          <div
            style={{
              fontFamily: "'Impact', 'Arial Black', sans-serif",
              fontSize: 'clamp(40px, 11vw, 150px)',
              fontWeight: 900,
              color,
              whiteSpace: 'nowrap',
              letterSpacing: 6,
              opacity: textClarity,
              textShadow: `0 0 ${bleedRadius * 2}px rgba(200,200,220,0.3), 0 0 ${bleedRadius * 5}px rgba(200,200,220,0.1)`,
              textTransform: 'uppercase',
              filter: `blur(${(1 - textClarity) * 2}px)`,
            }}
          >
            {word}
          </div>
        </div>
      )
    } else if (phase === 'hold') {
      // Steady projection with subtle surface interaction
      const drift = Math.sin(f * 0.02) * 0.8 + surfaceWarp

      return (
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: `translate(calc(-50% + ${drift}px), -50%) perspective(800px) rotateX(${keystoneSkew}deg)`,
          }}
        >
          {/* Projector ambient light spill */}
          <div
            style={{
              position: 'absolute',
              inset: -30,
              background: 'radial-gradient(ellipse at center, rgba(200,200,220,0.06) 0%, transparent 65%)',
              pointerEvents: 'none',
            }}
          />
          {/* Light bleed edge */}
          <div
            style={{
              position: 'absolute',
              inset: 0,
              fontFamily: "'Impact', 'Arial Black', sans-serif",
              fontSize: 'clamp(40px, 11vw, 150px)',
              fontWeight: 900,
              color: 'rgba(200,200,220,0.12)',
              whiteSpace: 'nowrap',
              letterSpacing: 6,
              filter: `blur(${bleedRadius}px)`,
              textTransform: 'uppercase',
            }}
          >
            {word}
          </div>
          {/* Main text */}
          <div
            style={{
              fontFamily: "'Impact', 'Arial Black', sans-serif",
              fontSize: 'clamp(40px, 11vw, 150px)',
              fontWeight: 900,
              color,
              whiteSpace: 'nowrap',
              letterSpacing: 6,
              textShadow: `0 0 ${bleedRadius * 2}px rgba(200,200,220,0.25), 0 0 ${bleedRadius * 4}px rgba(200,200,220,0.08)`,
              textTransform: 'uppercase',
            }}
          >
            {word}
          </div>
        </div>
      )
    } else {
      // Exit: projector dims, text washes out into light
      const dimFactor = 1 - exitProgress
      const blurOut = exitProgress * 6

      return (
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: `translate(-50%, -50%) perspective(800px) rotateX(${keystoneSkew}deg)`,
            opacity: dimFactor,
          }}
        >
          <div
            style={{
              fontFamily: "'Impact', 'Arial Black', sans-serif",
              fontSize: 'clamp(40px, 11vw, 150px)',
              fontWeight: 900,
              color,
              whiteSpace: 'nowrap',
              letterSpacing: 6,
              textShadow: `0 0 ${bleedRadius * 3 + blurOut * 2}px rgba(200,200,220,0.4)`,
              textTransform: 'uppercase',
              filter: `blur(${blurOut * 0.5}px) brightness(${1 + exitProgress * 0.5})`,
            }}
          >
            {word}
          </div>
        </div>
      )
    }
  },
}

function ProjectionMapComponent(props: MotionGraphicProps<ProjectionMapConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-projection-map',
  title: 'Kinetic Projection Map',
  description:
    'Projection mapping onto rough surface with keystone warp, light bleed edges, ambient wash, dust particles, and brick wall texture',
  tags: ['kinetic', 'typography', 'projection', 'mapping', 'light', 'surface', 'urban', 'art'],
  category: 'captions',
  component: ProjectionMapComponent as any,
  defaultConfig: {
    words: ['BEAM', 'WALL', 'CAST', 'GLOW'],
    colors: ['#e0e0f0', '#d0d0ff', '#e8e8ff', '#c8c8ee'],
    bgColor: '#1a1815',
    cycleDuration: 1.4,
  },
  configSchema: [
    {
      key: 'words',
      label: 'Words',
      type: 'text-array',
      defaultValue: ['BEAM', 'WALL', 'CAST', 'GLOW'],
      group: 'Content',
    },
    {
      key: 'colors',
      label: 'Colors',
      type: 'text-array',
      defaultValue: ['#e0e0f0', '#d0d0ff', '#e8e8ff', '#c8c8ee'],
      group: 'Style',
    },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#1a1815', group: 'Style' },
    {
      key: 'cycleDuration',
      label: 'Cycle Duration (s)',
      type: 'number',
      defaultValue: 1.4,
      min: 0.3,
      max: 5,
      group: 'Timing',
    },
  ],
})
