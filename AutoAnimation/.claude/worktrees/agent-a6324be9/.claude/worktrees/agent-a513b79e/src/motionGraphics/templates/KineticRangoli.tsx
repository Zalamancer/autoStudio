import { registerMotionGraphic } from '../registry'
import { KineticBase, type KineticBaseConfig, type KineticAnimation, type WordRenderProps, type BackgroundRenderProps } from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface RangoliConfig extends KineticBaseConfig {}

// Indian Rangoli text style:
// vibrant symmetric mandala/geometric petal pattern (rangoli floor art),
// vivid festival colors (saffron/rose/emerald/violet/cobalt),
// petals unfold from center like rangoli being drawn
const animation: KineticAnimation = {
  renderBackground: ({ bgColor, frame, fps }: BackgroundRenderProps) => {
    const time = frame / fps
    const rot = time * 6

    const rangoliColors = ['rgba(255,165,0,0.25)', 'rgba(220,20,60,0.2)', 'rgba(0,128,0,0.2)', 'rgba(138,43,226,0.2)', 'rgba(30,144,255,0.2)']

    return (
      <div style={{ position: 'absolute', inset: 0, background: bgColor, overflow: 'hidden' }}>
        {/* Rotating concentric rangoli petal layers */}
        {[1, 2, 3, 4].map((ring) => (
          <div
            key={ring}
            style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              width: `${ring * 22}%`,
              height: `${ring * 22}%`,
              transform: `translate(-50%, -50%) rotate(${rot * (ring % 2 === 0 ? 1 : -1)}deg)`,
            }}
          >
            <svg viewBox="0 0 100 100" style={{ width: '100%', height: '100%' }}>
              {/* 8 petals per ring */}
              {Array.from({ length: 8 }).map((_, p) => {
                const angle = (p / 8) * Math.PI * 2
                const px = 50 + Math.cos(angle) * 35
                const py = 50 + Math.sin(angle) * 35
                const colorIdx = (ring + p) % rangoliColors.length
                return (
                  <ellipse
                    key={p}
                    cx={px}
                    cy={py}
                    rx="10"
                    ry="5"
                    fill={rangoliColors[colorIdx]}
                    transform={`rotate(${angle * (180 / Math.PI)}, ${px}, ${py})`}
                  />
                )
              })}
              {/* Ring outline */}
              <circle cx="50" cy="50" r="30" fill="none" stroke={rangoliColors[ring % rangoliColors.length]} strokeWidth="0.5" strokeDasharray="3,2" />
            </svg>
          </div>
        ))}
        {/* Center dot */}
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            width: '8px',
            height: '8px',
            borderRadius: '50%',
            background: 'rgba(255,215,0,0.6)',
            transform: 'translate(-50%, -50%)',
          }}
        />
        {/* Corner rangoli dots */}
        {[
          { top: '5%', left: '5%' }, { top: '5%', right: '5%' },
          { bottom: '5%', left: '5%' }, { bottom: '5%', right: '5%' },
        ].map((pos, i) => (
          <div
            key={i}
            style={{
              position: 'absolute',
              width: '12px',
              height: '12px',
              borderRadius: '50%',
              background: rangoliColors[i],
              ...pos,
            }}
          />
        ))}
      </div>
    )
  },

  renderWord: ({ word, color, enterProgress, exitProgress, phase, index }: WordRenderProps) => {
    let opacity = 0
    let scale = 1
    let rotation = 0
    const seed = index * 37 + 11

    if (phase === 'enter') {
      // Unfold from center like petals opening
      opacity = enterProgress
      const ease = 1 - Math.pow(1 - enterProgress, 3)
      scale = ease
      rotation = (1 - enterProgress) * 45 * (seed % 2 === 0 ? 1 : -1)
    } else if (phase === 'hold') {
      opacity = 1
      scale = 1
      // Gentle petal sway
      rotation = Math.sin(Date.now() * 0.002 + seed) * 2
    } else {
      opacity = 1 - exitProgress * 1.5
      scale = 1 - exitProgress * 0.1
      rotation = exitProgress * 20
    }

    const rangoliGlow = `
      0 0 12px rgba(255,165,0,0.5),
      0 0 30px rgba(220,20,60,0.3),
      2px 2px 4px rgba(0,0,0,0.5)
    `

    return (
      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: `translate(-50%, -50%) scale(${scale}) rotate(${rotation}deg)`,
          opacity: Math.max(0, opacity),
        }}
      >
        <div
          style={{
            fontFamily: "'Georgia', 'Palatino Linotype', serif",
            fontSize: 'clamp(42px, 11vw, 160px)',
            fontWeight: 900,
            textTransform: 'uppercase',
            color,
            textShadow: rangoliGlow,
            WebkitTextStroke: '1.5px rgba(0,0,0,0.4)',
            whiteSpace: 'nowrap',
            letterSpacing: 5,
          }}
        >
          {word}
        </div>
      </div>
    )
  },
}

function RangoliComponent(props: MotionGraphicProps<RangoliConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-rangoli',
  title: 'Kinetic Rangoli',
  description: 'Indian Rangoli floor art style with rotating concentric petal mandala, saffron/rose/emerald festival palette, and petal-unfold entrance from center',
  tags: ['kinetic', 'typography', 'rangoli', 'indian', 'diwali', 'mandala', 'petal', 'festival', 'hindu', 'geometric'],
  category: 'captions',
  component: RangoliComponent as any,
  defaultConfig: {
    words: ['DIWALI', 'SHUBH', 'LABH', 'AARTI'],
    colors: ['#FF6600', '#DC143C', '#00A550', '#8B00FF'],
    bgColor: '#0a0510',
    cycleDuration: 1.3,
  },
  configSchema: [
    { key: 'words', label: 'Words', type: 'text-array', defaultValue: ['DIWALI', 'SHUBH', 'LABH', 'AARTI'], group: 'Content' },
    { key: 'colors', label: 'Colors', type: 'text-array', defaultValue: ['#FF6600', '#DC143C', '#00A550', '#8B00FF'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#0a0510', group: 'Style' },
    { key: 'cycleDuration', label: 'Cycle Duration (s)', type: 'number', defaultValue: 1.3, min: 0.3, max: 5, group: 'Timing' },
  ],
})
