import { registerMotionGraphic } from '../registry'
import { KineticBase, type KineticBaseConfig, type KineticAnimation, type WordRenderProps, type BackgroundRenderProps } from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

// R8 rewrite: text slides through a film-frame container with overflow:hidden as core mechanic.
// Quality gates: overflow:hidden core, mixBlendMode, clamp(), custom easing,
// alive hold (film jitter), concept-driven exit (film advances to next frame), per-char, animated bg.
interface FilmStripConfig extends KineticBaseConfig {}

function easeOutBack(t: number): number {
  const c1 = 1.70158
  const c3 = c1 + 1
  return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2)
}

function easeInCubic(t: number): number {
  return t * t * t
}

const animation: KineticAnimation = {
  renderBackground: ({ bgColor, frame, fps, width, height }: BackgroundRenderProps) => {
    const t = frame / fps
    // Sprocket holes that continuously scroll
    const holeSize = Math.max(10, width * 0.022)
    const holeSpacing = holeSize * 2.8
    const scrollOffset = (t * 40) % holeSpacing
    const holeCount = Math.ceil(height / holeSpacing) + 2
    const stripWidth = width * 0.1

    const holes = Array.from({ length: holeCount }, (_, i) => i * holeSpacing - scrollOffset)

    return (
      <div style={{ position: 'absolute', inset: 0, background: bgColor }}>
        {/* Film grain shimmer */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: `radial-gradient(ellipse at ${50 + Math.sin(t * 2) * 5}% ${50 + Math.cos(t * 1.5) * 5}%, rgba(255,240,200,0.03) 0%, transparent 60%)`,
            mixBlendMode: 'screen' as const,
          }}
        />
        {/* Left sprocket strip */}
        <div style={{ position: 'absolute', left: 0, top: 0, width: stripWidth, height: '100%', background: '#0a0a08', borderRight: '2px solid #2a2820' }}>
          {holes.map((y, i) => (
            <div key={`l${i}`} style={{ position: 'absolute', left: '50%', top: y, width: holeSize, height: holeSize * 0.6, borderRadius: 2, background: bgColor, transform: 'translateX(-50%)' }} />
          ))}
        </div>
        {/* Right sprocket strip */}
        <div style={{ position: 'absolute', right: 0, top: 0, width: stripWidth, height: '100%', background: '#0a0a08', borderLeft: '2px solid #2a2820' }}>
          {holes.map((y, i) => (
            <div key={`r${i}`} style={{ position: 'absolute', left: '50%', top: y, width: holeSize, height: holeSize * 0.6, borderRadius: 2, background: bgColor, transform: 'translateX(-50%)' }} />
          ))}
        </div>
        {/* Frame number */}
        <div style={{ position: 'absolute', bottom: '3%', right: stripWidth + 8, fontFamily: "'Courier New', monospace", fontSize: 'clamp(8px, 1vw, 12px)', color: '#555040', letterSpacing: 2 }}>
          FR {String(frame).padStart(4, '0')}
        </div>
      </div>
    )
  },

  renderWord: ({ word, color, enterProgress, holdProgress, exitProgress, phase, index, width }: WordRenderProps) => {
    const letters = word.split('')
    const totalLetters = letters.length
    const stripW = width * 0.1

    // The film frame viewport: overflow:hidden container between the sprocket strips
    // Text slides vertically into this viewport
    let yPercent = 0 // 0 = centered, positive = below, negative = above

    if (phase === 'enter') {
      // Slide up from below into frame, with overshoot (easeOutBack)
      const eased = easeOutBack(enterProgress)
      yPercent = (1 - eased) * 110
    } else if (phase === 'hold') {
      // Film gate jitter — subtle vertical wobble like a projector
      yPercent = Math.sin(holdProgress * Math.PI * 8) * 1.5
    } else {
      // Concept-driven exit: film advances — text slides UP and out of frame
      const eased = easeInCubic(exitProgress)
      yPercent = -eased * 120
    }

    return (
      <div
        style={{
          position: 'absolute',
          top: '10%',
          bottom: '10%',
          left: stripW + 4,
          right: stripW + 4,
          overflow: 'hidden',
          borderRadius: 2,
          // Subtle inner shadow like film gate
          boxShadow: 'inset 0 8px 20px rgba(0,0,0,0.4), inset 0 -8px 20px rgba(0,0,0,0.4)',
        }}
      >
        {/* Frame border lines */}
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: 'rgba(80,75,60,0.4)' }} />
        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 2, background: 'rgba(80,75,60,0.4)' }} />

        {/* Per-character text that slides within the overflow:hidden frame */}
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: `translate(-50%, calc(-50% + ${yPercent}%))`,
            display: 'flex',
            gap: 'clamp(2px, 0.5vw, 8px)',
            whiteSpace: 'nowrap',
          }}
        >
          {letters.map((letter, i) => {
            const stagger = (i / totalLetters) * Math.PI * 2
            // Hold: per-character film gate vibration
            const jitterX = phase === 'hold' ? Math.sin(holdProgress * Math.PI * 12 + stagger) * 0.8 : 0
            const warmth = phase === 'hold' ? 4 + Math.sin(holdProgress * Math.PI * 3 + stagger) * 3 : 3

            return (
              <span
                key={i}
                style={{
                  fontFamily: "'Georgia', 'Palatino Linotype', serif",
                  fontSize: 'clamp(40px, 12vw, 160px)',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  color,
                  letterSpacing: 3,
                  textShadow: `0 0 ${warmth}px rgba(255,230,180,0.3), 2px 2px 4px rgba(0,0,0,0.6)`,
                  transform: `translateX(${jitterX}px)`,
                  display: 'inline-block',
                  mixBlendMode: 'screen' as const,
                }}
              >
                {letter}
              </span>
            )
          })}
        </div>

        {/* Projector light hotspot overlay */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: 'radial-gradient(ellipse at 50% 50%, rgba(255,240,200,0.04) 0%, transparent 70%)',
            mixBlendMode: 'overlay' as const,
            pointerEvents: 'none',
          }}
        />
      </div>
    )
  },
}

function FilmStripComponent(props: MotionGraphicProps<FilmStripConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-film-strip',
  title: 'Kinetic Film Strip',
  description: 'Per-character text slides through an overflow:hidden film gate between animated sprocket strips, with projector jitter during hold and film-advance exit',
  tags: ['kinetic', 'typography', 'film', 'cinema', 'strip', 'vintage', 'contained', 'masked'],
  category: 'captions',
  component: FilmStripComponent as any,
  defaultConfig: {
    words: ['FILM', 'ROLL', 'FRAME', 'CUT'],
    colors: ['#E8D8C0', '#D4C4A8', '#F0E0C8', '#C8B898'],
    bgColor: '#1C1810',
    cycleDuration: 1.2,
  },
  configSchema: [
    { key: 'words', label: 'Words', type: 'text-array', defaultValue: ['FILM', 'ROLL', 'FRAME', 'CUT'], group: 'Content' },
    { key: 'colors', label: 'Colors', type: 'text-array', defaultValue: ['#E8D8C0', '#D4C4A8', '#F0E0C8', '#C8B898'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#1C1810', group: 'Style' },
    { key: 'cycleDuration', label: 'Cycle Duration (s)', type: 'number', defaultValue: 1.2, min: 0.3, max: 5, group: 'Timing' },
  ],
})
