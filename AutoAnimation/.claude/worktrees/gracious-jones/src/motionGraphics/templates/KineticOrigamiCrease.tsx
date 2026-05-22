import { registerMotionGraphic } from '../registry'
import {
  KineticBase,
  type KineticBaseConfig,
  type KineticAnimation,
  type WordRenderProps,
  type BackgroundRenderProps,
} from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface OrigamiCreaseConfig extends KineticBaseConfig {}

function rand(s: number): number {
  const x = Math.sin(s * 127.1 + 311.7) * 43758.5453
  return x - Math.floor(x)
}

function easeOutBack(t: number): number {
  const c1 = 1.70158
  const c3 = c1 + 1
  return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2)
}

// Origami: folding paper along precise crease lines.
// The animation shows paper panels folding open to REVEAL text.
// Key artifacts: crease line shadows, perspective change during fold,
// paper face/reverse difference, precise geometric folding
const animation: KineticAnimation = {
  renderBackground: ({ bgColor, width, height }: BackgroundRenderProps) => {
    return (
      <div style={{ position: 'absolute', inset: 0, background: bgColor }}>
        {/* Fine paper grain */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            backgroundImage: `repeating-linear-gradient(30deg, rgba(0,0,0,0.012) 0px, rgba(0,0,0,0.012) 1px, transparent 1px, transparent 6px)`,
            pointerEvents: 'none',
          }}
        />
        {/* Paper center sheen */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: 'radial-gradient(ellipse 90% 70% at 50% 50%, rgba(255,255,255,0.05) 0%, transparent 60%)',
            pointerEvents: 'none',
          }}
        />
      </div>
    )
  },

  renderWord: ({
    word,
    color,
    enterProgress,
    holdProgress,
    exitProgress,
    phase,
    index,
    width,
    height,
    frame,
  }: WordRenderProps) => {
    const f = frame ?? 0
    const chars = word.split('')

    // Origami paper colors (traditional Japanese patterns)
    const paperColors = [
      { front: '#E8C5D5', back: '#C4A0B5' },  // Pink
      { front: '#C5D5E8', back: '#A0B5C4' },  // Blue
      { front: '#D5E8C5', back: '#B5C4A0' },  // Green
      { front: '#E8E0C5', back: '#C4BCA0' },  // Cream
      { front: '#E8D5C5', back: '#C4B0A0' },  // Peach
    ]

    return (
      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          display: 'flex',
          gap: 4,
          alignItems: 'center',
        }}
      >
        {chars.map((ch, ci) => {
          const charDelay = ci * 0.09
          let foldAngle = -90  // Start folded flat
          let opacity = 0
          let scaleX = 0

          if (phase === 'enter') {
            const p = Math.max(0, Math.min(1, (enterProgress - charDelay) / (0.7 - charDelay * 0.3)))
            const eased = easeOutBack(p)
            foldAngle = -90 + eased * 90  // Unfolds from -90 to 0
            scaleX = Math.abs(Math.cos(((90 - eased * 90) * Math.PI) / 180))
            opacity = Math.min(1, p * 3)
          } else if (phase === 'hold') {
            foldAngle = 0
            scaleX = 1
            opacity = 1
            // Subtle paper breathe
          } else {
            const p = Math.max(0, Math.min(1, exitProgress + ci * 0.06))
            foldAngle = -p * 90
            scaleX = Math.abs(Math.cos((p * 90 * Math.PI) / 180))
            opacity = Math.max(0, 1 - p * 1.5)
          }

          const paper = paperColors[(ci + index) % paperColors.length]
          const isFacingFront = foldAngle > -45

          return (
            <div
              key={ci}
              style={{
                position: 'relative',
                transform: `perspective(400px) rotateY(${foldAngle}deg)`,
                transformOrigin: 'left center',
                opacity,
              }}
            >
              {/* Paper backing */}
              <div
                style={{
                  position: 'absolute',
                  inset: '-10% -6%',
                  background: isFacingFront ? paper.front : paper.back,
                  borderRadius: 2,
                  boxShadow: `${foldAngle < -20 ? '4px' : '1px'} 3px 8px rgba(0,0,0,0.2), inset 0 1px 2px rgba(255,255,255,0.3)`,
                }}
              />
              {/* Crease shadow line */}
              <div
                style={{
                  position: 'absolute',
                  top: 0,
                  bottom: 0,
                  left: '-6%',
                  width: 2,
                  background: `linear-gradient(180deg, transparent, rgba(0,0,0,${0.1 + Math.abs(foldAngle) / 300}) 30%, rgba(0,0,0,${0.2 + Math.abs(foldAngle) / 200}) 50%, rgba(0,0,0,${0.1 + Math.abs(foldAngle) / 300}) 70%, transparent)`,
                  borderRadius: 1,
                }}
              />
              {/* Letter */}
              <span
                style={{
                  fontFamily: "'Noto Serif JP', 'Georgia', serif",
                  fontSize: 'clamp(40px, 10vw, 140px)',
                  fontWeight: 700,
                  color,
                  display: 'inline-block',
                  lineHeight: 1.1,
                  letterSpacing: 2,
                  position: 'relative',
                  zIndex: 1,
                  opacity: isFacingFront ? 1 : 0.3,
                  transform: isFacingFront ? 'none' : 'scaleX(-1)',
                }}
              >
                {ch}
              </span>
            </div>
          )
        })}
      </div>
    )
  },
}

function OrigamiCreaseComponent(props: MotionGraphicProps<OrigamiCreaseConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-origami-crease',
  title: 'Kinetic Origami Crease',
  description: 'Paper panels fold open along crease lines to reveal each letter — front/back paper color difference, crease shadow deepens during fold, precise geometric paper-folding aesthetic with depth perspective',
  tags: ['kinetic', 'typography', 'origami', 'paper', 'fold', 'crease', 'craft', 'Japanese', 'geometric', 'reveal'],
  category: 'captions',
  component: OrigamiCreaseComponent as any,
  defaultConfig: {
    words: ['FOLD', 'CREASE', 'PAPER', 'ART'],
    colors: ['#2C1810', '#1A2C10', '#10182C', '#2C2410'],
    bgColor: '#FAF6F0',
    cycleDuration: 1.4,
  },
  configSchema: [
    { key: 'words', label: 'Words', type: 'text-array', defaultValue: ['FOLD', 'CREASE', 'PAPER', 'ART'], group: 'Content' },
    { key: 'colors', label: 'Ink Colors', type: 'text-array', defaultValue: ['#2C1810', '#1A2C10', '#10182C', '#2C2410'], group: 'Style' },
    { key: 'bgColor', label: 'Paper Color', type: 'color', defaultValue: '#FAF6F0', group: 'Style' },
    { key: 'cycleDuration', label: 'Cycle Duration (s)', type: 'number', defaultValue: 1.4, min: 0.4, max: 5, group: 'Timing' },
  ],
})
