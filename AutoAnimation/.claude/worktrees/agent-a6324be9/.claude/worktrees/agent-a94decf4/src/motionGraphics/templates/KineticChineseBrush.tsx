import { registerMotionGraphic } from '../registry'
import { KineticBase, type KineticBaseConfig, type KineticAnimation, type WordRenderProps, type BackgroundRenderProps } from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface ChineseBrushConfig extends KineticBaseConfig {}

// Chinese brush painting (Guohua/Sumi) style:
// rice paper background, ink wash splatter, vertical drop reveal,
// variable stroke weight suggesting xuan paper ink absorption
const animation: KineticAnimation = {
  renderBackground: ({ bgColor }: BackgroundRenderProps) => {
    return (
      <div style={{ position: 'absolute', inset: 0, background: bgColor, overflow: 'hidden' }}>
        {/* Rice paper / xuan paper texture via fractal noise SVG */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 300 300' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='paper'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3CfeColorMatrix type='saturate' values='0'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23paper)'/%3E%3C/svg%3E")`,
            opacity: 0.06,
            mixBlendMode: 'multiply',
          }}
        />
        {/* Ink wash splatter blobs — asymmetric, organic */}
        <div
          style={{
            position: 'absolute',
            bottom: '10%',
            right: '8%',
            width: '18%',
            height: '30%',
            background: 'radial-gradient(ellipse at 40% 60%, rgba(0,0,0,0.12) 0%, transparent 70%)',
            borderRadius: '60% 40% 70% 30% / 50% 40% 60% 50%',
          }}
        />
        <div
          style={{
            position: 'absolute',
            top: '15%',
            left: '5%',
            width: '12%',
            height: '20%',
            background: 'radial-gradient(ellipse, rgba(0,0,0,0.08) 0%, transparent 70%)',
            borderRadius: '50% 60% 40% 70% / 60% 50% 70% 40%',
          }}
        />
        {/* Red seal stamp (chop) in corner */}
        <div
          style={{
            position: 'absolute',
            bottom: '12px',
            right: '16px',
            width: '36px',
            height: '36px',
            background: 'rgba(180,20,20,0.7)',
            borderRadius: '3px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            opacity: 0.75,
          }}
        >
          <div style={{ width: '20px', height: '20px', background: 'rgba(255,200,200,0.5)', borderRadius: '2px' }} />
        </div>
      </div>
    )
  },

  renderWord: ({ word, color, enterProgress, exitProgress, phase, index }: WordRenderProps) => {
    let opacity = 0
    let translateY = 0
    let scaleX = 1
    let blur = 0
    const seed = index * 61 + 23

    if (phase === 'enter') {
      // Vertical drop — brush stroke falling down (like writing top-to-bottom)
      opacity = enterProgress
      const ease = 1 - Math.pow(1 - enterProgress, 2.5)
      translateY = -(1 - ease) * 30
      // Stroke width variation: starts thick/bloated, sharpens
      scaleX = 1.4 - ease * 0.4
      blur = (1 - enterProgress) * 3
    } else if (phase === 'hold') {
      opacity = 1
      // Ink settling — very subtle pulse
      scaleX = 1 + Math.sin(Date.now() * 0.002 + seed) * 0.005
    } else {
      opacity = 1 - exitProgress * 1.5
      blur = exitProgress * 4
    }

    const inkTexture = `
      1px 1px 2px rgba(0,0,0,0.4),
      -1px -1px 1px rgba(0,0,0,0.2),
      0 0 1px rgba(0,0,0,0.6)
    `

    return (
      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: `translate(-50%, calc(-50% + ${translateY}px)) scaleX(${scaleX})`,
          opacity: Math.max(0, opacity),
          filter: blur > 0 ? `blur(${blur}px)` : undefined,
        }}
      >
        <div
          style={{
            fontFamily: "'Georgia', 'Palatino Linotype', serif",
            fontSize: 'clamp(44px, 13vw, 180px)',
            fontWeight: 900,
            fontStyle: 'italic',
            color,
            textShadow: inkTexture,
            whiteSpace: 'nowrap',
            letterSpacing: 10,
            // Slightly uneven baseline mimics hand-written brush stroke
            lineHeight: 1.1,
          }}
        >
          {word}
        </div>
      </div>
    )
  },
}

function ChineseBrushComponent(props: MotionGraphicProps<ChineseBrushConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-chinese-brush',
  title: 'Kinetic Chinese Brush Painting',
  description: 'Chinese Guohua/Sumi ink brush painting style with xuan rice paper texture, ink wash splatter, red seal chop, and vertical stroke drop-in reveal',
  tags: ['kinetic', 'typography', 'chinese', 'brush', 'ink', 'sumi', 'calligraphy', 'guohua', 'asian'],
  category: 'captions',
  component: ChineseBrushComponent as any,
  defaultConfig: {
    words: ['HARMONY', 'FLOW', 'STRENGTH', 'WISDOM'],
    colors: ['#1a1a1a', '#3d1515', '#1a3d1a', '#1a1a1a'],
    bgColor: '#F5EDD8',
    cycleDuration: 1.3,
  },
  configSchema: [
    { key: 'words', label: 'Words', type: 'text-array', defaultValue: ['HARMONY', 'FLOW', 'STRENGTH', 'WISDOM'], group: 'Content' },
    { key: 'colors', label: 'Colors', type: 'text-array', defaultValue: ['#1a1a1a', '#3d1515', '#1a3d1a', '#1a1a1a'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#F5EDD8', group: 'Style' },
    { key: 'cycleDuration', label: 'Cycle Duration (s)', type: 'number', defaultValue: 1.3, min: 0.3, max: 5, group: 'Timing' },
  ],
})
