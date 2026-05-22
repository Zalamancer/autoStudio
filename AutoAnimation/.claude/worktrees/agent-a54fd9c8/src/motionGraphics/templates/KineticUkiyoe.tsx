import { registerMotionGraphic } from '../registry'
import { KineticBase, type KineticBaseConfig, type KineticAnimation, type WordRenderProps, type BackgroundRenderProps } from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface UkiyoeConfig extends KineticBaseConfig {}

// Ukiyo-e (Hokusai/Hiroshige) woodblock print style:
// The Great Wave stylized water pattern, ukiyo-e color palette (indigo/cream/vermilion),
// bold flat outlines characteristic of woodblock carving,
// wave-wipe reveal from left (like a rolling wave)
const animation: KineticAnimation = {
  renderBackground: ({ bgColor, frame, fps }: BackgroundRenderProps) => {
    void frame; void fps

    return (
      <div style={{ position: 'absolute', inset: 0, background: bgColor, overflow: 'hidden' }}>
        {/* Woodblock grain texture */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            backgroundImage: `repeating-linear-gradient(
              0deg,
              transparent 0px,
              transparent 3px,
              rgba(0,0,0,0.015) 3px,
              rgba(0,0,0,0.015) 4px
            )`,
          }}
        />
        {/* Wave pattern — Hokusai Great Wave silhouette */}
        <svg
          style={{ position: 'absolute', bottom: 0, left: 0, width: '100%', height: '35%', opacity: 0.25 }}
          viewBox="0 0 100 40"
          preserveAspectRatio="none"
        >
          {/* First wave */}
          <path
            d={`M0,30 C10,15 20,5 30,20 C40,35 50,10 60,20 C70,30 80,12 90,22 C95,27 98,28 100,28 L100,40 L0,40 Z`}
            fill="rgba(15,35,100,0.4)"
          />
          {/* Second wave (lighter) */}
          <path
            d={`M0,38 C15,30 25,20 35,30 C45,40 55,22 65,32 C75,42 85,25 100,35 L100,40 L0,40 Z`}
            fill="rgba(30,60,150,0.3)"
          />
          {/* Wave crest foam lines */}
          {[25, 55, 80].map((x, i) => (
            <path
              key={i}
              d={`M${x - 5},${20 - i * 3} Q${x},${14 - i * 3} ${x + 5},${20 - i * 3}`}
              fill="none"
              stroke="rgba(255,255,255,0.6)"
              strokeWidth="0.8"
            />
          ))}
        </svg>
        {/* Vertical ruled border lines (woodblock framing) */}
        <div style={{ position: 'absolute', top: 0, left: '4px', bottom: 0, width: '2px', background: 'rgba(15,35,100,0.3)' }} />
        <div style={{ position: 'absolute', top: 0, right: '4px', bottom: 0, width: '2px', background: 'rgba(15,35,100,0.3)' }} />
        <div style={{ position: 'absolute', top: '4px', left: 0, right: 0, height: '2px', background: 'rgba(15,35,100,0.3)' }} />
        <div style={{ position: 'absolute', bottom: '4px', left: 0, right: 0, height: '2px', background: 'rgba(15,35,100,0.3)' }} />
      </div>
    )
  },

  renderWord: ({ word, color, enterProgress, exitProgress, phase }: WordRenderProps) => {
    let opacity = 0
    let clipProgress = 0 // wave wipe reveal

    if (phase === 'enter') {
      // Wave wipe: reveal progressively from left, like a wave washing in
      opacity = enterProgress
      clipProgress = enterProgress
    } else if (phase === 'hold') {
      opacity = 1
      clipProgress = 1
    } else {
      opacity = 1 - exitProgress
      clipProgress = 1 - exitProgress * 0.3
    }

    // Flat Ukiyo-e style — no 3D, bold outlines, flat color
    const woodblockOutline = `
      2px 2px 0 rgba(15,35,100,0.9),
      -1px -1px 0 rgba(15,35,100,0.6),
      1px -1px 0 rgba(15,35,100,0.6),
      -1px 1px 0 rgba(15,35,100,0.6)
    `

    return (
      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: `translate(-50%, -50%)`,
          opacity: Math.max(0, opacity),
          // Clip-path wave wipe from left
          clipPath: `inset(0 ${(1 - clipProgress) * 100}% 0 0)`,
        }}
      >
        <div
          style={{
            fontFamily: "'Georgia', 'Palatino Linotype', serif",
            fontSize: 'clamp(44px, 12vw, 170px)',
            fontWeight: 900,
            textTransform: 'uppercase',
            fontStyle: 'italic',
            color,
            textShadow: woodblockOutline,
            WebkitTextStroke: '2px rgba(15,35,100,0.7)',
            whiteSpace: 'nowrap',
            letterSpacing: 4,
          }}
        >
          {word}
        </div>
      </div>
    )
  },
}

function UkiyoeComponent(props: MotionGraphicProps<UkiyoeConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-ukiyo-e',
  title: 'Kinetic Ukiyo-e',
  description: 'Japanese Ukiyo-e woodblock print style (Hokusai/Hiroshige) with Great Wave silhouette, indigo/vermilion palette, woodblock grain texture, and wave-wipe reveal',
  tags: ['kinetic', 'typography', 'ukiyo-e', 'japanese', 'hokusai', 'woodblock', 'wave', 'print', 'edo', 'hiroshige'],
  category: 'captions',
  component: UkiyoeComponent as any,
  defaultConfig: {
    words: ['KANAGAWA', 'FUJI', 'EDO', 'UKIYO'],
    colors: ['#F5E6D0', '#CC2200', '#F5E6D0', '#E8C060'],
    bgColor: '#0F2364',
    cycleDuration: 1.3,
  },
  configSchema: [
    { key: 'words', label: 'Words', type: 'text-array', defaultValue: ['KANAGAWA', 'FUJI', 'EDO', 'UKIYO'], group: 'Content' },
    { key: 'colors', label: 'Colors', type: 'text-array', defaultValue: ['#F5E6D0', '#CC2200', '#F5E6D0', '#E8C060'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#0F2364', group: 'Style' },
    { key: 'cycleDuration', label: 'Cycle Duration (s)', type: 'number', defaultValue: 1.3, min: 0.3, max: 5, group: 'Timing' },
  ],
})
