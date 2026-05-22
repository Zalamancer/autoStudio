import { registerMotionGraphic } from '../registry'
import { KineticBase, type KineticBaseConfig, type KineticAnimation, type WordRenderProps, type BackgroundRenderProps } from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface SpiralInConfig extends KineticBaseConfig {}

function easeOutExpo(t: number): number {
  return t === 1 ? 1 : 1 - Math.pow(2, -10 * t)
}

function easeInExpo(t: number): number {
  return t === 0 ? 0 : Math.pow(2, 10 * t - 10)
}

const animation: KineticAnimation = {
  renderBackground: ({ bgColor, frame, fps }: BackgroundRenderProps) => {
    const time = frame / fps
    // Subtle vortex background pattern
    const spiralOpacity = 0.04 + Math.sin(time * 0.3) * 0.01
    return (
      <div style={{ position: 'absolute', inset: 0, background: bgColor }}>
        {/* Radial rings for depth cue */}
        {[1, 2, 3].map((ring) => (
          <div
            key={ring}
            style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              width: ring * 250,
              height: ring * 250,
              borderRadius: '50%',
              border: `1px solid rgba(255,255,255,${spiralOpacity / ring})`,
              transform: `translate(-50%, -50%) rotate(${time * 10 * ring}deg)`,
            }}
          />
        ))}
      </div>
    )
  },

  renderWord: ({ word, color, enterProgress, holdProgress, exitProgress, phase }: WordRenderProps) => {
    let rotation = 0
    let scale = 0
    let translateZ = 0
    let opacity = 0
    let blur = 0

    if (phase === 'enter') {
      // Spiral in: far away, small, rotated -> near, full size, straight
      const eased = easeOutExpo(enterProgress)
      rotation = 720 * (1 - eased) // Two full rotations
      scale = 0.05 + 0.95 * eased
      translateZ = -800 * (1 - eased)
      opacity = Math.min(1, enterProgress * 2)
      blur = (1 - eased) * 10
    } else if (phase === 'hold') {
      // Gentle floating
      const t = holdProgress * Math.PI * 2
      rotation = Math.sin(t) * 3
      scale = 1 + Math.sin(t * 1.3) * 0.02
      translateZ = Math.sin(t * 0.8) * 15
      opacity = 1
    } else {
      // Spiral out in opposite direction
      const eased = easeInExpo(exitProgress)
      rotation = -540 * eased
      scale = 1 - 0.9 * eased
      translateZ = -600 * eased
      opacity = 1 - eased
      blur = eased * 8
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
            transform: `translateZ(${translateZ}px) rotate(${rotation}deg) scale(${scale})`,
            opacity,
            filter: blur > 0 ? `blur(${blur}px)` : undefined,
            fontSize: 'clamp(48px, 12vw, 160px)',
            fontWeight: 900,
            color,
            whiteSpace: 'nowrap',
            fontFamily: "'Inter', 'Helvetica Neue', sans-serif",
            letterSpacing: '0.06em',
            textTransform: 'uppercase',
            textShadow: `
              0 0 20px ${color}44,
              0 0 60px ${color}22,
              0 4px 15px rgba(0,0,0,0.4)
            `,
          }}
        >
          {word}
        </div>

        {/* Motion trail */}
        {phase === 'enter' && enterProgress < 0.7 && (
          <>
            {[0.15, 0.3, 0.45].map((trailOffset) => {
              const trailProgress = Math.max(0, enterProgress - trailOffset)
              const trailEased = easeOutExpo(trailProgress)
              const trailRot = 720 * (1 - trailEased)
              const trailScale = 0.05 + 0.95 * trailEased
              const trailZ = -800 * (1 - trailEased)
              const trailOpacity = Math.max(0, (0.3 - trailOffset) * 0.8)

              return (
                <div
                  key={trailOffset}
                  style={{
                    position: 'absolute',
                    transform: `translateZ(${trailZ}px) rotate(${trailRot}deg) scale(${trailScale})`,
                    opacity: trailOpacity,
                    filter: `blur(${4 + trailOffset * 10}px)`,
                    fontSize: 'clamp(48px, 12vw, 160px)',
                    fontWeight: 900,
                    color: `${color}44`,
                    whiteSpace: 'nowrap',
                    fontFamily: "'Inter', 'Helvetica Neue', sans-serif",
                    letterSpacing: '0.06em',
                    textTransform: 'uppercase',
                  }}
                >
                  {word}
                </div>
              )
            })}
          </>
        )}
      </div>
    )
  },
}

function SpiralInComponent(props: MotionGraphicProps<SpiralInConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-spiral-in',
  title: 'Kinetic Spiral In',
  description: 'Dramatic 3D spiral entrance combining rotation, scale, and translateZ with motion trails',
  tags: ['kinetic', 'typography', '3d', 'spiral', 'vortex', 'dramatic', 'perspective'],
  category: 'captions',
  component: SpiralInComponent as any,
  defaultConfig: {
    words: ['SPIRAL', 'INTO', 'THE', 'VOID'],
    colors: ['#C084FC', '#F472B6', '#22D3EE', '#A3E635'],
    bgColor: '#0a0510',
    cycleDuration: 1.8,
  },
  configSchema: [
    { key: 'words', label: 'Words', type: 'text-array', defaultValue: ['SPIRAL', 'INTO', 'THE', 'VOID'], group: 'Content' },
    { key: 'colors', label: 'Colors', type: 'text-array', defaultValue: ['#C084FC', '#F472B6', '#22D3EE', '#A3E635'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#0a0510', group: 'Style' },
    { key: 'cycleDuration', label: 'Cycle Duration (s)', type: 'number', defaultValue: 1.8, min: 0.3, max: 5, group: 'Timing' },
  ],
})
