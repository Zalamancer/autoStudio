import { registerMotionGraphic } from '../registry'
import { KineticBase, type KineticBaseConfig, type KineticAnimation, type WordRenderProps, type BackgroundRenderProps } from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface GrecoRomanConfig extends KineticBaseConfig {}

// Classical Greek/Roman style:
// marble white/gold/terracotta palette, column capital border motifs,
// Greek meander/key pattern, Roman imperial carved letterforms (Trajan/Optima),
// stone-carving reveal (chisel effect scale from center outward)
const animation: KineticAnimation = {
  renderBackground: ({ bgColor }: BackgroundRenderProps) => {
    return (
      <div style={{ position: 'absolute', inset: 0, background: bgColor, overflow: 'hidden' }}>
        {/* Marble veining texture */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 400 400' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='marble'%3E%3CfeTurbulence type='turbulence' baseFrequency='0.02' numOctaves='5' stitchTiles='stitch'/%3E%3CfeColorMatrix type='saturate' values='0'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23marble)'/%3E%3C/svg%3E")`,
            opacity: 0.04,
            mixBlendMode: 'multiply',
          }}
        />
        {/* Greek meander/key border — top */}
        <svg
          style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '22px', opacity: 0.5 }}
          viewBox="0 0 100 8"
          preserveAspectRatio="none"
        >
          {/* Simplified Greek key/meander pattern */}
          <path
            d="M0,4 L2,4 L2,2 L6,2 L6,6 L4,6 L4,4 L8,4 L8,8 L10,8 L10,2 L12,2 L12,4 L14,4 L14,2 L18,2 L18,6 L16,6 L16,4 L20,4 L20,8 L22,8 L22,2 L24,2 L24,4 L26,4 L26,2 L30,2 L30,6 L28,6 L28,4 L32,4 L32,8 L34,8 L34,2 L36,2 L36,4 L38,4 L38,2 L42,2 L42,6 L40,6 L40,4 L44,4 L44,8 L46,8 L46,2 L48,2 L48,4 L50,4"
            fill="none"
            stroke="rgba(184,134,11,0.9)"
            strokeWidth="0.6"
          />
          {/* Mirror for second half */}
          <use href="#" transform="translate(100,0) scale(-1,1)" />
        </svg>
        {/* Greek meander — bottom */}
        <svg
          style={{ position: 'absolute', bottom: 0, left: 0, width: '100%', height: '22px', opacity: 0.5 }}
          viewBox="0 0 100 8"
          preserveAspectRatio="none"
        >
          <path
            d="M0,4 L2,4 L2,2 L6,2 L6,6 L4,6 L4,4 L8,4 L8,8 L10,8 L10,2 L12,2 L12,4 L14,4 L14,2 L18,2 L18,6 L16,6 L16,4 L20,4 L20,8 L22,8 L22,2 L24,2 L24,4 L26,4 L26,2 L30,2 L30,6 L28,6 L28,4 L32,4 L32,8 L34,8 L34,2 L36,2 L36,4 L38,4 L38,2 L42,2 L42,6 L40,6 L40,4 L44,4 L44,8 L46,8 L46,2 L48,2 L48,4 L50,4"
            fill="none"
            stroke="rgba(184,134,11,0.9)"
            strokeWidth="0.6"
            transform="scale(1,-1) translate(0,-8)"
          />
        </svg>
        {/* Column capitals at sides */}
        <div style={{ position: 'absolute', top: '8px', left: 0, bottom: '8px', width: '14px', background: 'rgba(184,134,11,0.1)', borderRight: '1px solid rgba(184,134,11,0.3)' }} />
        <div style={{ position: 'absolute', top: '8px', right: 0, bottom: '8px', width: '14px', background: 'rgba(184,134,11,0.1)', borderLeft: '1px solid rgba(184,134,11,0.3)' }} />
        {/* Acanthus leaf at top center */}
        <svg
          style={{ position: 'absolute', top: '2px', left: '50%', transform: 'translateX(-50%)', width: '50px', height: '16px', opacity: 0.4 }}
          viewBox="0 0 40 12"
        >
          <path d="M20,12 Q10,6 5,2 Q10,8 20,6 Q30,8 35,2 Q30,6 20,12 Z" fill="rgba(184,134,11,0.7)" />
          <circle cx="20" cy="6" r="2" fill="rgba(184,134,11,0.5)" />
        </svg>
      </div>
    )
  },

  renderWord: ({ word, color, enterProgress, exitProgress, phase }: WordRenderProps) => {
    let opacity = 0
    let scaleX = 1
    let scaleY = 1

    if (phase === 'enter') {
      // Stone-carving reveal: letters emerge from solid marble (scale + opacity)
      opacity = enterProgress
      const ease = 1 - Math.pow(1 - enterProgress, 3)
      // Chiseling feel — slight X/Y independent reveal
      scaleX = 0.7 + ease * 0.3
      scaleY = 0.8 + ease * 0.2
    } else if (phase === 'hold') {
      opacity = 1
      // Monumental stillness — no movement (Roman gravitas)
    } else {
      opacity = 1 - exitProgress * 1.5
      scaleX = 1 - exitProgress * 0.05
    }

    const marbleCarve = `
      2px 2px 4px rgba(0,0,0,0.5),
      -1px -1px 2px rgba(255,255,255,0.1),
      0 0 8px rgba(184,134,11,0.2)
    `

    return (
      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: `translate(-50%, -50%) scale(${scaleX}, ${scaleY})`,
          opacity: Math.max(0, opacity),
        }}
      >
        <div
          style={{
            fontFamily: "'Times New Roman', 'Palatino Linotype', serif",
            fontSize: 'clamp(42px, 12vw, 165px)',
            fontWeight: 400, // Trajan-style is medium weight, not ultra-bold
            textTransform: 'uppercase',
            color,
            textShadow: marbleCarve,
            WebkitTextStroke: '1px rgba(0,0,0,0.3)',
            whiteSpace: 'nowrap',
            letterSpacing: 10,
          }}
        >
          {word}
        </div>
      </div>
    )
  },
}

function GrecoRomanComponent(props: MotionGraphicProps<GrecoRomanConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-greco-roman',
  title: 'Kinetic Greco-Roman Classical',
  description: 'Classical Greek and Roman style with marble veining, Greek meander key border, column pilasters, acanthus ornament, and stone-carving chisel reveal',
  tags: ['kinetic', 'typography', 'greek', 'roman', 'classical', 'marble', 'meander', 'trajan', 'column', 'ancient'],
  category: 'captions',
  component: GrecoRomanComponent as any,
  defaultConfig: {
    words: ['SPQR', 'VIRTUE', 'GLORIA', 'ARETE'],
    colors: ['#F5F0E0', '#DAA520', '#C0C0C0', '#F5F0E0'],
    bgColor: '#1a1206',
    cycleDuration: 1.5,
  },
  configSchema: [
    { key: 'words', label: 'Words', type: 'text-array', defaultValue: ['SPQR', 'VIRTUE', 'GLORIA', 'ARETE'], group: 'Content' },
    { key: 'colors', label: 'Colors', type: 'text-array', defaultValue: ['#F5F0E0', '#DAA520', '#C0C0C0', '#F5F0E0'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#1a1206', group: 'Style' },
    { key: 'cycleDuration', label: 'Cycle Duration (s)', type: 'number', defaultValue: 1.5, min: 0.3, max: 5, group: 'Timing' },
  ],
})
