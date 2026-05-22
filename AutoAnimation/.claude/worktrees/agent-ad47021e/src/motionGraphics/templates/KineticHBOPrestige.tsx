import { registerMotionGraphic } from '../registry'
import { KineticBase, type KineticBaseConfig, type KineticAnimation, type WordRenderProps, type BackgroundRenderProps } from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

// Film Aesthetic: HBO Prestige Title Sequence — slow cinematic dissolve, elegant serif, depth
// Mechanic: text emerges from dark as if developing in a photographic darkroom, slow and deliberate

interface HBOPrestigeConfig extends KineticBaseConfig {}

const animation: KineticAnimation = {
  renderBackground: ({ frame, fps }: BackgroundRenderProps) => {
    const time = frame / fps

    // Slow ambient movement — prestige TV never rushes
    const gradientAngle = 180 + Math.sin(time * 0.15) * 10

    return (
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: `linear-gradient(${gradientAngle}deg, #0c0c0c 0%, #141414 40%, #1a1612 60%, #0e0e0e 100%)`,
        }}
      >
        {/* Very subtle film grain */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            opacity: 0.025 + Math.sin(time * 60) * 0.005,
            backgroundImage: 'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'200\' height=\'200\'%3E%3Cfilter id=\'n\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.8\' numOctaves=\'4\'/%3E%3C/filter%3E%3Crect width=\'200\' height=\'200\' filter=\'url(%23n)\'/%3E%3C/svg%3E")',
          }}
        />
        {/* Letterbox — prestige aspect ratio 2.39:1 suggestion */}
        <div style={{ position: 'absolute', left: 0, right: 0, top: 0, height: '7%', background: '#000' }} />
        <div style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: '7%', background: '#000' }} />
        {/* Elegant thin rule */}
        <div style={{ position: 'absolute', left: '15%', right: '15%', top: '50%', height: 0.5, background: 'rgba(200,180,140,0.08)', transform: 'translateY(-50px)' }} />
        <div style={{ position: 'absolute', left: '15%', right: '15%', top: '50%', height: 0.5, background: 'rgba(200,180,140,0.08)', transform: 'translateY(50px)' }} />
      </div>
    )
  },

  renderWord: ({ word, color, enterProgress, exitProgress, phase }: WordRenderProps) => {
    // Darkroom development: text resolves from blur and low contrast to sharp and bright
    // Very slow and cinematic — HBO never rushes
    const easeIn = (t: number) => t * t * t   // slow start
    const easeOut = (t: number) => 1 - Math.pow(1 - t, 3)

    let opacity = 0
    let blur = 0
    let translateY = 0
    let brightness = 1

    if (phase === 'enter') {
      const e = easeOut(enterProgress)
      opacity = easeIn(enterProgress) * 0.95
      blur = (1 - e) * 4
      translateY = (1 - e) * 20
      brightness = 0.6 + e * 0.4   // develops from underexposed
    } else if (phase === 'hold') {
      opacity = 0.95
      blur = 0
      translateY = 0
      brightness = 1
    } else {
      const e = easeOut(exitProgress)
      opacity = 0.95 * (1 - e)
      blur = e * 2
      translateY = -e * 12
      brightness = 1 - e * 0.3
    }

    return (
      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: `translate(-50%, -50%) translateY(${translateY}px)`,
          opacity,
          filter: `blur(${blur}px) brightness(${brightness})`,
          fontFamily: "'Georgia', 'Times New Roman', 'Palatino', serif",
          fontSize: 'clamp(22px, 5.5vw, 74px)',
          fontWeight: 400,
          textTransform: 'uppercase',
          letterSpacing: 16,
          color: color || '#d4c9b0',
          whiteSpace: 'nowrap',
        }}
      >
        {word}
      </div>
    )
  },
}

function HBOPrestigeComponent(props: MotionGraphicProps<HBOPrestigeConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-hbo-prestige',
  title: 'Kinetic HBO Prestige',
  description: 'HBO prestige title sequence: elegant serif resolves from darkness with darkroom development effect, cinematic letterbox',
  tags: ['kinetic', 'typography', 'hbo', 'prestige', 'cinematic', 'title sequence', 'elegant', 'film', 'drama'],
  category: 'captions',
  component: HBOPrestigeComponent as any,
  defaultConfig: {
    words: ['SUCCESSION', 'POWER', 'LEGACY', 'THRONE'],
    colors: ['#d4c9b0', '#c8bda0', '#e0d5bc', '#b8ad94'],
    bgColor: '#0c0c0c',
    cycleDuration: 2.0,
  },
  configSchema: [
    { key: 'words', label: 'Words', type: 'text-array', defaultValue: ['SUCCESSION', 'POWER', 'LEGACY', 'THRONE'], group: 'Content' },
    { key: 'colors', label: 'Colors', type: 'text-array', defaultValue: ['#d4c9b0', '#c8bda0', '#e0d5bc', '#b8ad94'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#0c0c0c', group: 'Style' },
    { key: 'cycleDuration', label: 'Cycle Duration (s)', type: 'number', defaultValue: 2.0, min: 0.8, max: 6, group: 'Timing' },
  ],
})
