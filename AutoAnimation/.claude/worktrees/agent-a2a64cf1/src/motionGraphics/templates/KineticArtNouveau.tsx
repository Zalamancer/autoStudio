import { registerMotionGraphic } from '../registry'
import { KineticBase, type KineticBaseConfig, type KineticAnimation, type WordRenderProps, type BackgroundRenderProps } from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface ArtNouveauConfig extends KineticBaseConfig {}

// Art Nouveau (Mucha/Klimt/Tiffany) style:
// organic flowing vine/floral borders, peacock/sage/gold palette,
// sinuous line motifs, graceful upward reveal like a vine growing
const animation: KineticAnimation = {
  renderBackground: ({ bgColor, frame, fps }: BackgroundRenderProps) => {
    const time = frame / fps
    // Vine growth phase — organic waving
    const wave = Math.sin(time * 1.5) * 5

    return (
      <div style={{ position: 'absolute', inset: 0, background: bgColor, overflow: 'hidden' }}>
        {/* Flowing vine border left side */}
        <svg
          style={{ position: 'absolute', top: 0, left: 0, width: '12%', height: '100%', opacity: 0.4 }}
          viewBox="0 0 20 100"
          preserveAspectRatio="none"
        >
          {/* Main stem */}
          <path
            d={`M10,100 C${8 + wave},80 ${12 - wave},60 10,40 C${8 + wave},20 ${12 - wave},10 10,0`}
            fill="none"
            stroke="rgba(107,142,35,0.9)"
            strokeWidth="1.5"
          />
          {/* Leaf blossoms along stem */}
          {[80, 60, 40, 20].map((y, i) => (
            <ellipse
              key={i}
              cx={i % 2 === 0 ? 5 : 15}
              cy={y}
              rx="4"
              ry="2"
              fill="rgba(107,142,35,0.5)"
              transform={`rotate(${i % 2 === 0 ? -30 : 30}, ${i % 2 === 0 ? 5 : 15}, ${y})`}
            />
          ))}
        </svg>
        {/* Flowing vine border right side */}
        <svg
          style={{ position: 'absolute', top: 0, right: 0, width: '12%', height: '100%', opacity: 0.4 }}
          viewBox="0 0 20 100"
          preserveAspectRatio="none"
        >
          <path
            d={`M10,0 C${8 - wave},20 ${12 + wave},40 10,60 C${8 - wave},80 ${12 + wave},90 10,100`}
            fill="none"
            stroke="rgba(107,142,35,0.9)"
            strokeWidth="1.5"
          />
          {[20, 40, 60, 80].map((y, i) => (
            <ellipse
              key={i}
              cx={i % 2 === 0 ? 15 : 5}
              cy={y}
              rx="4"
              ry="2"
              fill="rgba(107,142,35,0.5)"
              transform={`rotate(${i % 2 === 0 ? 30 : -30}, ${i % 2 === 0 ? 15 : 5}, ${y})`}
            />
          ))}
        </svg>
        {/* Ornate top arch */}
        <svg
          style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '18%', opacity: 0.4 }}
          viewBox="0 0 100 20"
          preserveAspectRatio="none"
        >
          <path
            d="M0,20 Q25,0 50,4 Q75,0 100,20"
            fill="none"
            stroke="rgba(184,134,11,0.8)"
            strokeWidth="1"
          />
          <circle cx="50" cy="4" r="3" fill="rgba(184,134,11,0.6)" />
        </svg>
        {/* Radial peacock-feather gradient */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: 'radial-gradient(ellipse at 50% 120%, rgba(0,100,100,0.08) 0%, transparent 70%)',
          }}
        />
      </div>
    )
  },

  renderWord: ({ word, color, enterProgress, exitProgress, phase, index }: WordRenderProps) => {
    let opacity = 0
    let translateY = 0
    let scaleX = 1
    const seed = index * 47 + 19

    if (phase === 'enter') {
      // Vine-like growth: graceful upward reveal
      opacity = enterProgress
      const ease = 1 - Math.pow(1 - enterProgress, 2.5)
      translateY = (1 - ease) * 20
      // Slight horizontal undulation
      scaleX = 0.9 + ease * 0.1
    } else if (phase === 'hold') {
      opacity = 1
      // Organic sway — sinuous Art Nouveau motion
      translateY = Math.sin(Date.now() * 0.0025 + seed) * 4
    } else {
      opacity = 1 - exitProgress * 1.2
      translateY = -exitProgress * 15
    }

    const artNouveauShadow = `
      0 0 12px rgba(184,134,11,0.4),
      0 0 30px rgba(0,100,80,0.2),
      2px 3px 5px rgba(0,0,0,0.4)
    `

    return (
      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: `translate(-50%, calc(-50% + ${translateY}px)) scaleX(${scaleX})`,
          opacity: Math.max(0, opacity),
        }}
      >
        <div
          style={{
            fontFamily: "'Palatino Linotype', 'Georgia', serif",
            fontSize: 'clamp(38px, 10vw, 150px)',
            fontWeight: 400,
            fontStyle: 'italic',
            color,
            textShadow: artNouveauShadow,
            whiteSpace: 'nowrap',
            letterSpacing: 8,
            lineHeight: 1.2,
          }}
        >
          {word}
        </div>
      </div>
    )
  },
}

function ArtNouveauComponent(props: MotionGraphicProps<ArtNouveauConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-art-nouveau',
  title: 'Kinetic Art Nouveau',
  description: 'Art Nouveau (Mucha/Klimt) style with organic vine borders, peacock-sage-gold palette, ornate arch, and graceful vine-growth upward reveal',
  tags: ['kinetic', 'typography', 'art-nouveau', 'mucha', 'klimt', 'organic', 'floral', 'vine', 'gold', 'peacock', 'elegant'],
  category: 'captions',
  component: ArtNouveauComponent as any,
  defaultConfig: {
    words: ['BELLE', 'EPOQUE', 'GRACE', 'FLORA'],
    colors: ['#B8860B', '#4a7c59', '#8B6914', '#2d5a3d'],
    bgColor: '#0d0e0a',
    cycleDuration: 1.5,
  },
  configSchema: [
    { key: 'words', label: 'Words', type: 'text-array', defaultValue: ['BELLE', 'EPOQUE', 'GRACE', 'FLORA'], group: 'Content' },
    { key: 'colors', label: 'Colors', type: 'text-array', defaultValue: ['#B8860B', '#4a7c59', '#8B6914', '#2d5a3d'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#0d0e0a', group: 'Style' },
    { key: 'cycleDuration', label: 'Cycle Duration (s)', type: 'number', defaultValue: 1.5, min: 0.3, max: 5, group: 'Timing' },
  ],
})
