import { registerMotionGraphic } from '../registry'
import { KineticBase, type KineticBaseConfig, type KineticAnimation, type WordRenderProps, type BackgroundRenderProps } from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface ArtDecoConfig extends KineticBaseConfig {}

// Art Deco (Gatsby/1920s) style:
// gold/black/ivory palette, sunburst fan radial, geometric chevron patterns,
// tall elongated letterforms, crisp precision entrance (no bounce — dignity)
const animation: KineticAnimation = {
  renderBackground: ({ bgColor }: BackgroundRenderProps) => {
    const numRays = 18

    return (
      <div style={{ position: 'absolute', inset: 0, background: bgColor, overflow: 'hidden' }}>
        {/* Art Deco sunburst / fan */}
        <svg
          style={{ position: 'absolute', top: '-30%', left: '50%', transform: 'translateX(-50%)', width: '80%', height: '60%', opacity: 0.12 }}
          viewBox="0 0 100 60"
          preserveAspectRatio="none"
        >
          {Array.from({ length: numRays }).map((_, i) => {
            const angle = ((i / numRays) * 180 - 90) * (Math.PI / 180)
            const x2 = 50 + Math.cos(angle) * 80
            const y2 = 0 + Math.sin(angle) * 80
            const thick = i % 3 === 0 ? 1.5 : 0.5
            return (
              <line key={i} x1="50" y1="0" x2={x2} y2={y2} stroke="rgba(218,165,32,0.9)" strokeWidth={thick} />
            )
          })}
        </svg>
        {/* Chevron decorative bands (top and bottom) */}
        <svg
          style={{ position: 'absolute', bottom: 0, left: 0, width: '100%', height: '20px', opacity: 0.5 }}
          viewBox="0 0 100 8"
          preserveAspectRatio="none"
        >
          <polyline points="0,8 8,0 16,8 24,0 32,8 40,0 48,8 56,0 64,8 72,0 80,8 88,0 96,8 100,4" fill="none" stroke="rgba(218,165,32,0.9)" strokeWidth="0.8" />
          <polyline points="0,6 8,2 16,6 24,2 32,6 40,2 48,6 56,2 64,6 72,2 80,6 88,2 96,6 100,4" fill="none" stroke="rgba(218,165,32,0.5)" strokeWidth="0.4" />
        </svg>
        {/* Corner geometric ornaments */}
        {[
          { top: 0, left: 0, transform: 'none' },
          { top: 0, right: 0, transform: 'scaleX(-1)' },
          { bottom: 0, left: 0, transform: 'scaleY(-1)' },
          { bottom: 0, right: 0, transform: 'scale(-1,-1)' },
        ].map((corner, i) => (
          <div
            key={i}
            style={{
              position: 'absolute',
              width: '40px',
              height: '40px',
              ...{ top: corner.top, left: (corner as any).left, right: (corner as any).right, bottom: corner.bottom },
              opacity: 0.4,
              transform: corner.transform,
            }}
          >
            <svg viewBox="0 0 20 20" style={{ width: '100%', height: '100%' }}>
              <polyline points="0,0 20,0 20,20" fill="none" stroke="rgba(218,165,32,0.9)" strokeWidth="1" />
              <polyline points="4,0 20,0 20,16" fill="none" stroke="rgba(218,165,32,0.5)" strokeWidth="0.5" />
            </svg>
          </div>
        ))}
        {/* Central thin horizontal dividers */}
        <div style={{ position: 'absolute', top: '15%', left: '8%', right: '8%', height: '1px', background: 'rgba(218,165,32,0.25)' }} />
        <div style={{ position: 'absolute', bottom: '15%', left: '8%', right: '8%', height: '1px', background: 'rgba(218,165,32,0.25)' }} />
      </div>
    )
  },

  renderWord: ({ word, color, enterProgress, exitProgress, phase }: WordRenderProps) => {
    let opacity = 0
    let scaleY = 1
    let letterSpacing = 20

    if (phase === 'enter') {
      // Elegant, precise upward reveal — Art Deco dignity, no bounce
      opacity = enterProgress
      const ease = 1 - Math.pow(1 - enterProgress, 3)
      scaleY = ease
      // Letter-spacing expands in (type spreading outward)
      letterSpacing = 5 + ease * 15
    } else if (phase === 'hold') {
      opacity = 1
      scaleY = 1
      letterSpacing = 20
    } else {
      opacity = 1 - exitProgress * 1.5
      letterSpacing = 20 + exitProgress * 20
      scaleY = 1 - exitProgress * 0.1
    }

    const decoShadow = `
      0 0 10px rgba(218,165,32,0.5),
      0 0 25px rgba(218,165,32,0.25),
      3px 3px 0 rgba(0,0,0,0.6)
    `

    return (
      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: `translate(-50%, -50%) scaleY(${scaleY})`,
          opacity: Math.max(0, opacity),
        }}
      >
        <div
          style={{
            fontFamily: "'Palatino Linotype', 'Times New Roman', serif",
            fontSize: 'clamp(36px, 10vw, 145px)',
            fontWeight: 900,
            textTransform: 'uppercase',
            color,
            textShadow: decoShadow,
            whiteSpace: 'nowrap',
            letterSpacing: `${letterSpacing}px`,
            // Tall, elongated Art Deco proportion
            lineHeight: 0.85,
          }}
        >
          {word}
        </div>
      </div>
    )
  },
}

function ArtDecoComponent(props: MotionGraphicProps<ArtDecoConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-art-deco',
  title: 'Kinetic Art Deco',
  description: 'Art Deco 1920s Gatsby style with gold sunburst fan, chevron bands, geometric corner ornaments, tall elongated letterforms, and letter-spacing expand reveal',
  tags: ['kinetic', 'typography', 'art-deco', 'gatsby', '1920s', 'gold', 'geometric', 'chevron', 'sunburst', 'luxury', 'elegant'],
  category: 'captions',
  component: ArtDecoComponent as any,
  defaultConfig: {
    words: ['GATSBY', 'ROARING', 'OPULENCE', 'JAZZ'],
    colors: ['#DAA520', '#F5DEB3', '#B8860B', '#DAA520'],
    bgColor: '#0a0806',
    cycleDuration: 1.4,
  },
  configSchema: [
    { key: 'words', label: 'Words', type: 'text-array', defaultValue: ['GATSBY', 'ROARING', 'OPULENCE', 'JAZZ'], group: 'Content' },
    { key: 'colors', label: 'Colors', type: 'text-array', defaultValue: ['#DAA520', '#F5DEB3', '#B8860B', '#DAA520'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#0a0806', group: 'Style' },
    { key: 'cycleDuration', label: 'Cycle Duration (s)', type: 'number', defaultValue: 1.4, min: 0.3, max: 5, group: 'Timing' },
  ],
})
