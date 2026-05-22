import { registerMotionGraphic } from '../registry'
import { KineticBase, type KineticBaseConfig, type KineticAnimation, type WordRenderProps, type BackgroundRenderProps } from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface CinematicRevealConfig extends KineticBaseConfig {}

const animation: KineticAnimation = {
  renderBackground: ({ bgColor, frame, fps, width }: BackgroundRenderProps) => {
    const time = frame / fps
    // Film grain noise — pseudo-random flicker
    const grainOpacity = 0.03 + Math.sin(frame * 73.7) * 0.01
    // Gold sweep line position
    const sweepX = ((time * 40) % (width + 100)) - 50
    return (
      <div style={{ position: 'absolute', inset: 0, background: bgColor }}>
        {/* Letterbox top */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: '12%',
            background: '#000000',
          }}
        />
        {/* Letterbox bottom */}
        <div
          style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            height: '12%',
            background: '#000000',
          }}
        />
        {/* Film grain */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
            opacity: grainOpacity,
            mixBlendMode: 'overlay',
            pointerEvents: 'none',
          }}
        />
        {/* Gold sweep line */}
        <div
          style={{
            position: 'absolute',
            top: '12%',
            bottom: '12%',
            left: sweepX,
            width: 2,
            background: 'linear-gradient(to bottom, transparent, #D4AF37, transparent)',
            opacity: 0.4,
            pointerEvents: 'none',
          }}
        />
      </div>
    )
  },

  renderWord: ({ word, color, enterProgress, holdProgress, exitProgress, phase }: WordRenderProps) => {
    let opacity = 0
    let scale = 1
    let blur = 0

    if (phase === 'enter') {
      opacity = Math.min(1, enterProgress * 2.5)
      scale = 1.5 - enterProgress * 0.5
      blur = (1 - enterProgress) * 4
    } else if (phase === 'hold') {
      opacity = 1
      scale = 1
      // Subtle gold shimmer via pulsing text shadow
    } else {
      opacity = 1 - exitProgress
      scale = 1 - exitProgress * 0.2
    }

    const shimmer = phase === 'hold' ? 0.5 + Math.sin(holdProgress * Math.PI * 4) * 0.3 : 0

    return (
      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: `translate(-50%, -50%) scale(${scale})`,
          opacity,
          filter: blur > 0 ? `blur(${blur}px)` : undefined,
          fontFamily: "'Georgia', 'Times New Roman', serif",
          fontSize: 'clamp(40px, 12vw, 160px)',
          fontWeight: 700,
          textTransform: 'uppercase',
          letterSpacing: 12,
          color,
          textShadow: `0 0 ${20 + shimmer * 30}px rgba(212, 175, 55, ${0.4 + shimmer * 0.3}), 0 2px 4px rgba(0,0,0,0.6)`,
          whiteSpace: 'nowrap',
        }}
      >
        {word}
      </div>
    )
  },
}

function CinematicRevealComponent(props: MotionGraphicProps<CinematicRevealConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-cinematic-reveal',
  title: 'Kinetic Cinematic Reveal',
  description: 'Movie trailer style words zooming in with golden sweep lines and letterbox bars',
  tags: ['kinetic', 'typography', 'cinematic', 'trailer', 'gold'],
  category: 'captions',
  component: CinematicRevealComponent as any,
  defaultConfig: {
    words: ['WITNESS', 'THE', 'LEGEND', 'RISE'],
    colors: ['#D4AF37', '#D4AF37', '#D4AF37', '#D4AF37'],
    bgColor: '#0a0a0a',
    cycleDuration: 1.2,
  },
  configSchema: [
    { key: 'words', label: 'Words', type: 'text-array', defaultValue: ['WITNESS', 'THE', 'LEGEND', 'RISE'], group: 'Content' },
    { key: 'colors', label: 'Colors', type: 'text-array', defaultValue: ['#D4AF37', '#D4AF37', '#D4AF37'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#0a0a0a', group: 'Style' },
    { key: 'cycleDuration', label: 'Cycle Duration (s)', type: 'number', defaultValue: 1.2, min: 0.3, max: 5, group: 'Timing' },
  ],
})
