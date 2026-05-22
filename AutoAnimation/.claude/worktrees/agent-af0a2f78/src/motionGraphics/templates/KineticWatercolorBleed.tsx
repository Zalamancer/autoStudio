import { registerMotionGraphic } from '../registry'
import { KineticBase, type KineticBaseConfig, type KineticAnimation, type WordRenderProps, type BackgroundRenderProps } from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface WatercolorBleedConfig extends KineticBaseConfig {}

const animation: KineticAnimation = {
  renderBackground: ({ bgColor }: BackgroundRenderProps) => (
    <div style={{ position: 'absolute', inset: 0, background: bgColor }}>
      {/* Subtle paper fiber texture */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='1.2' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
          opacity: 0.04,
          mixBlendMode: 'multiply',
          pointerEvents: 'none',
        }}
      />
    </div>
  ),

  renderWord: ({ word, color, enterProgress, exitProgress, phase }: WordRenderProps) => {
    let opacity = 0
    let blur = 0

    if (phase === 'enter') {
      // Bloom from center: high blur fading to sharp
      opacity = enterProgress
      blur = (1 - enterProgress) * 20
    } else if (phase === 'hold') {
      opacity = 1
      blur = 0
    } else {
      // Blur out to dissipate
      opacity = 1 - exitProgress
      blur = exitProgress * 20
    }

    // Subtle color bleed: expanding soft textShadow during hold
    const bleedRadius = phase === 'hold'
      ? 6 + Math.sin(Date.now() * 0.002) * 3
      : 4

    return (
      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          opacity,
          filter: blur > 0 ? `blur(${blur}px)` : undefined,
          fontFamily: "'Georgia', 'Times New Roman', serif",
          fontSize: 'clamp(40px, 12vw, 160px)',
          fontWeight: 400,
          fontStyle: 'italic',
          color,
          textShadow: `0 0 ${bleedRadius}px ${color}, 0 0 ${bleedRadius * 3}px ${color}40`,
          whiteSpace: 'nowrap',
        }}
      >
        {word}
      </div>
    )
  },
}

function WatercolorBleedComponent(props: MotionGraphicProps<WatercolorBleedConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-watercolor-bleed',
  title: 'Kinetic Watercolor Bleed',
  description: 'Watercolor paint bleed effect with words blooming from blur on textured paper',
  tags: ['kinetic', 'typography', 'watercolor', 'paint', 'artistic', 'soft'],
  category: 'captions',
  component: WatercolorBleedComponent as any,
  defaultConfig: {
    words: ['BLOOM', 'PAINT', 'DREAM', 'FLOW'],
    colors: ['#3498DB', '#E74C3C', '#27AE60', '#8E44AD'],
    bgColor: '#FAF5EF',
    cycleDuration: 1,
  },
  configSchema: [
    { key: 'words', label: 'Words', type: 'text-array', defaultValue: ['BLOOM', 'PAINT', 'DREAM', 'FLOW'], group: 'Content' },
    { key: 'colors', label: 'Colors', type: 'text-array', defaultValue: ['#3498DB', '#E74C3C', '#27AE60', '#8E44AD'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#FAF5EF', group: 'Style' },
    { key: 'cycleDuration', label: 'Cycle Duration (s)', type: 'number', defaultValue: 1, min: 0.3, max: 5, group: 'Timing' },
  ],
})
