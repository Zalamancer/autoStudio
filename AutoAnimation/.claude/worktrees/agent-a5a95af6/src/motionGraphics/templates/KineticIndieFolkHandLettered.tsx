import { registerMotionGraphic } from '../registry'
import { KineticBase, type KineticBaseConfig, type KineticAnimation, type WordRenderProps, type BackgroundRenderProps } from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

// Music Genre: Indie Folk — hand-lettered aesthetic, warm analog, botanical accents, slow reveal
// Mechanic: text writes on stroke-by-stroke with organic wobble, like a brush on paper

interface IndieFolkConfig extends KineticBaseConfig {}

const animation: KineticAnimation = {
  renderBackground: ({ frame, fps }: BackgroundRenderProps) => {
    const time = frame / fps
    // Warm parchment with organic botanical line accents
    const vines = Array.from({ length: 5 }, (_, i) => {
      const x = i * 22 + 5
      const baseY = 15 + i * 4
      const sway = Math.sin(time * 0.6 + i * 1.1) * 3
      return (
        <g key={i}>
          <path
            d={`M ${x} ${baseY + sway} Q ${x + 6} ${baseY + 20 + sway} ${x + 2} ${baseY + 40 + sway}`}
            stroke="rgba(100,75,50,0.15)"
            strokeWidth="1"
            fill="none"
            strokeLinecap="round"
          />
          {/* Small leaf */}
          <ellipse
            cx={x + 6}
            cy={baseY + 20 + sway}
            rx={5}
            ry={3}
            fill="rgba(80,110,60,0.12)"
            transform={`rotate(30, ${x + 6}, ${baseY + 20 + sway})`}
          />
        </g>
      )
    })

    return (
      <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, #f8f0e0 0%, #f2e8d0 60%, #ebe0c4 100%)' }}>
        {/* Paper grain texture */}
        <div style={{ position: 'absolute', inset: 0, backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 200 200\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'n\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.9\' numOctaves=\'4\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23n)\' opacity=\'0.03\'/%3E%3C/svg%3E")', opacity: 0.4 }} />
        <svg width="100%" height="40%" style={{ position: 'absolute', top: '5%', left: 0, opacity: 0.8 }}>
          {vines}
        </svg>
        <svg width="100%" height="40%" style={{ position: 'absolute', bottom: '5%', left: 0, opacity: 0.8, transform: 'scaleY(-1)' }}>
          {vines}
        </svg>
        {/* Single wavy underline rule */}
        <svg width="80%" height="3" style={{ position: 'absolute', top: '52%', left: '10%', opacity: 0.15 }}>
          <path d="M 0 1.5 Q 50 0 100 1.5 Q 150 3 200 1.5 Q 250 0 300 1.5 Q 350 3 400 1.5" stroke="rgba(100,75,50,1)" strokeWidth="1" fill="none" />
        </svg>
      </div>
    )
  },

  renderWord: ({ word, color, enterProgress, exitProgress, phase }: WordRenderProps) => {
    // Organic write-on: clip-path reveals from left with slight vertical wobble
    const easeInOut = (t: number) => t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2

    let opacity = 0
    let clipWidth = 0
    let translateY = 0
    let rotate = 0

    if (phase === 'enter') {
      const e = easeInOut(enterProgress)
      opacity = Math.min(enterProgress * 5, 1)
      clipWidth = e * 100
      translateY = Math.sin(enterProgress * Math.PI * 3) * 2   // organic wobble during write-on
      rotate = (1 - e) * -1
    } else if (phase === 'hold') {
      opacity = 1
      clipWidth = 100
      translateY = Math.sin(Date.now() * 0.0008) * 1.5
      rotate = 0
    } else {
      opacity = 1 - exitProgress
      clipWidth = 100
      translateY = exitProgress * 8
    }

    return (
      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: `translate(-50%, -50%) translateY(${translateY}px) rotate(${rotate}deg)`,
          opacity,
          clipPath: `inset(0 ${100 - clipWidth}% 0 0)`,
        }}
      >
        <div
          style={{
            fontFamily: "'Georgia', 'Palatino', 'Book Antiqua', serif",
            fontSize: 'clamp(30px, 8vw, 110px)',
            fontWeight: 400,
            fontStyle: 'italic',
            textTransform: 'lowercase',
            letterSpacing: 4,
            color,
            whiteSpace: 'nowrap',
            // Hand-lettered feel: slight baseline irregularity via text-shadow
            textShadow: `1px 2px 0 rgba(0,0,0,0.08), -1px 0 0 rgba(0,0,0,0.04)`,
          }}
        >
          {word}
        </div>
      </div>
    )
  },
}

function IndieFolkComponent(props: MotionGraphicProps<IndieFolkConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-indie-folk-hand-lettered',
  title: 'Kinetic Indie Folk Hand-Lettered',
  description: 'Indie folk aesthetic: italic serif writes on left-to-right with organic wobble, warm parchment, botanical vine accents',
  tags: ['kinetic', 'typography', 'indie folk', 'hand-lettered', 'organic', 'warm', 'music', 'botanical'],
  category: 'captions',
  component: IndieFolkComponent as any,
  defaultConfig: {
    words: ['wander', 'bloom', 'roots', 'folk'],
    colors: ['#5a3e28', '#7a5c3c', '#4a5a30', '#6b4a2a'],
    bgColor: '#f8f0e0',
    cycleDuration: 1.5,
  },
  configSchema: [
    { key: 'words', label: 'Words', type: 'text-array', defaultValue: ['wander', 'bloom', 'roots', 'folk'], group: 'Content' },
    { key: 'colors', label: 'Colors', type: 'text-array', defaultValue: ['#5a3e28', '#7a5c3c', '#4a5a30', '#6b4a2a'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#f8f0e0', group: 'Style' },
    { key: 'cycleDuration', label: 'Cycle Duration (s)', type: 'number', defaultValue: 1.5, min: 0.5, max: 5, group: 'Timing' },
  ],
})
