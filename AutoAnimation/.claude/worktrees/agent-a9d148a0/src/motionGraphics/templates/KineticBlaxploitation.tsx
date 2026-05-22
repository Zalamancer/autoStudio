import { registerMotionGraphic } from '../registry'
import { KineticBase, type KineticBaseConfig, type KineticAnimation, type WordRenderProps, type BackgroundRenderProps } from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface BlaxploitationConfig extends KineticBaseConfig {
  perspectiveDepth: number
}

const animation: KineticAnimation = {
  renderBackground: ({ bgColor, frame, fps, width, height }: BackgroundRenderProps) => {
    const time = frame / fps
    // Warm pulsing concentric circles
    const pulsePhase = time * 2.5

    return (
      <div style={{ position: 'absolute', inset: 0, background: bgColor }}>
        {/* Concentric warm rings radiating from center */}
        {Array.from({ length: 6 }, (_, i) => {
          const ringSize = 15 + i * 16 + Math.sin(pulsePhase + i * 0.8) * 3
          return (
            <div
              key={i}
              style={{
                position: 'absolute',
                left: '50%',
                top: '50%',
                width: `${ringSize}%`,
                height: `${ringSize}%`,
                transform: 'translate(-50%, -50%)',
                borderRadius: '50%',
                border: `2px solid rgba(255,${140 + i * 15},${30 + i * 10},${0.15 - i * 0.015})`,
                pointerEvents: 'none',
              }}
            />
          )
        })}
        {/* Warm gradient overlay */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: `radial-gradient(ellipse at 50% 60%, rgba(200,80,20,0.12) 0%, transparent 65%)`,
            pointerEvents: 'none',
          }}
        />
        {/* Diagonal stripe pattern — very 70s */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            backgroundImage: `repeating-linear-gradient(
              45deg,
              transparent,
              transparent 20px,
              rgba(255,180,60,0.03) 20px,
              rgba(255,180,60,0.03) 22px
            )`,
            pointerEvents: 'none',
          }}
        />
        {/* Bottom gradient strip */}
        <div
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            bottom: 0,
            height: '25%',
            background: 'linear-gradient(0deg, rgba(180,60,10,0.15) 0%, transparent 100%)',
            pointerEvents: 'none',
          }}
        />
      </div>
    )
  },

  renderWord: ({ word, color, enterProgress, exitProgress, phase, holdProgress, index, frame, width, height }: WordRenderProps) => {
    const f = frame ?? 0
    let opacity = 0
    let translateY = 0
    let scaleX = 1
    let scaleY = 1
    let perspective = 600
    let rotateX = 0

    if (phase === 'enter') {
      // Extreme zoom from far away with perspective tilt
      const eased = 1 - Math.pow(1 - enterProgress, 3)
      opacity = Math.min(1, enterProgress * 2.5)
      scaleX = 0.2 + eased * 1.1
      scaleY = 0.2 + eased * 0.95
      rotateX = (1 - eased) * 25
      translateY = (1 - eased) * 60
    } else if (phase === 'hold') {
      opacity = 1
      scaleX = 1.3 + Math.sin(f * 0.06) * 0.02
      scaleY = 1.15
      // Subtle funky bounce
      translateY = Math.sin(f * 0.08 + index) * 3
      rotateX = Math.sin(f * 0.04) * 1
    } else {
      // Slam down and flatten
      const eased = Math.pow(exitProgress, 2)
      opacity = 1 - eased
      scaleX = 1.3 + eased * 0.5
      scaleY = 1.15 - eased * 0.6
      translateY = eased * 40
      rotateX = eased * -15
    }

    return (
      <>
        {/* Bold shadow for depth/3D pop */}
        <div
          style={{
            position: 'absolute',
            top: '48%',
            left: '50%',
            transform: `translate(-50%, -50%) perspective(${perspective}px) rotateX(${rotateX}deg) scaleX(${scaleX}) scaleY(${scaleY}) translateY(${translateY + 5}px)`,
            opacity: opacity * 0.4,
            fontFamily: "'Impact', 'Arial Black', sans-serif",
            fontSize: 'clamp(50px, 14vw, 180px)',
            fontWeight: 900,
            textTransform: 'uppercase',
            letterSpacing: 2,
            color: '#000000',
            whiteSpace: 'nowrap',
            filter: 'blur(2px)',
          }}
        >
          {word}
        </div>
        {/* Inline outline stroke */}
        <div
          style={{
            position: 'absolute',
            top: '48%',
            left: '50%',
            transform: `translate(-50%, -50%) perspective(${perspective}px) rotateX(${rotateX}deg) scaleX(${scaleX}) scaleY(${scaleY}) translateY(${translateY}px)`,
            opacity,
            fontFamily: "'Impact', 'Arial Black', sans-serif",
            fontSize: 'clamp(50px, 14vw, 180px)',
            fontWeight: 900,
            textTransform: 'uppercase',
            letterSpacing: 2,
            color: 'transparent',
            WebkitTextStroke: `2px rgba(0,0,0,0.6)`,
            whiteSpace: 'nowrap',
          }}
        >
          {word}
        </div>
        {/* Main text with warm gradient */}
        <div
          style={{
            position: 'absolute',
            top: '48%',
            left: '50%',
            transform: `translate(-50%, -50%) perspective(${perspective}px) rotateX(${rotateX}deg) scaleX(${scaleX}) scaleY(${scaleY}) translateY(${translateY}px)`,
            opacity,
            fontFamily: "'Impact', 'Arial Black', sans-serif",
            fontSize: 'clamp(50px, 14vw, 180px)',
            fontWeight: 900,
            textTransform: 'uppercase',
            letterSpacing: 2,
            color: 'transparent',
            backgroundImage: `linear-gradient(180deg, ${color} 0%, #FFD700 40%, ${color} 70%, #FF4500 100%)`,
            backgroundClip: 'text',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            textShadow: 'none',
            filter: `drop-shadow(2px 2px 0 rgba(0,0,0,0.5))`,
            whiteSpace: 'nowrap',
          }}
        >
          {word}
        </div>
      </>
    )
  },
}

function BlaxploitationComponent(props: MotionGraphicProps<BlaxploitationConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-blaxploitation',
  title: 'Kinetic Blaxploitation',
  description: '1970s blaxploitation bold funky title with extreme perspective zoom, warm gradient fill, concentric rings, and 70s diagonal stripes',
  tags: ['kinetic', 'typography', 'blaxploitation', '1970s', 'funky', 'bold', 'retro', 'cinema', 'warm'],
  category: 'captions',
  component: BlaxploitationComponent as any,
  defaultConfig: {
    words: ['SHAFT', 'HUSTLE', 'GROOVE', 'FUNK'],
    colors: ['#FF6B00', '#E84420', '#FF8C00', '#CC3300'],
    bgColor: '#1a0800',
    cycleDuration: 1.2,
    perspectiveDepth: 600,
  },
  configSchema: [
    { key: 'words', label: 'Words', type: 'text-array', defaultValue: ['SHAFT', 'HUSTLE', 'GROOVE', 'FUNK'], group: 'Content' },
    { key: 'colors', label: 'Colors', type: 'text-array', defaultValue: ['#FF6B00', '#E84420', '#FF8C00', '#CC3300'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#1a0800', group: 'Style' },
    { key: 'cycleDuration', label: 'Cycle Duration (s)', type: 'number', defaultValue: 1.2, min: 0.3, max: 5, group: 'Timing' },
    { key: 'perspectiveDepth', label: 'Perspective Depth', type: 'number', defaultValue: 600, min: 200, max: 1200, group: 'Animation' },
  ],
})
