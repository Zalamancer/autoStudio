import { registerMotionGraphic } from '../registry'
import { KineticBase, type KineticBaseConfig, type KineticAnimation, type WordRenderProps, type BackgroundRenderProps } from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface ComicInkConfig extends KineticBaseConfig {}

// India ink brush stroke reveals text with splatter edges.
// A wide gestural ink stroke sweeps across the frame — the text is the inked area.
// Irregular splatter drops appear around the edges of the stroke as it moves.
// Pure black india ink aesthetic — high contrast, raw, physical.

// Deterministic splatter positions seeded by word index
function splatters(seed: number, count: number): Array<{ x: number; y: number; r: number; angle: number; dist: number }> {
  const result = []
  for (let i = 0; i < count; i++) {
    const s = seed * 7 + i * 31 + 13
    const angle = ((s * 137.5) % 360)
    const dist = 40 + (s * 53 % 120)
    const x = 50 + Math.cos((angle * Math.PI) / 180) * dist
    const y = 50 + Math.sin((angle * Math.PI) / 180) * (dist * 0.5)
    const r = 2 + (s * 17 % 10)
    result.push({ x, y, r, angle, dist })
  }
  return result
}

const animation: KineticAnimation = {
  renderBackground: ({ bgColor, frame, fps }: BackgroundRenderProps) => {
    const time = frame / fps
    // Slow ink bleed spreading through paper fibers
    const bleed = Math.sin(time * 0.8) * 0.3 + 0.5
    return (
      <div style={{ position: 'absolute', inset: 0, background: bgColor, overflow: 'hidden' }}>
        {/* Paper grain texture */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            backgroundImage: `
              repeating-linear-gradient(
                17deg,
                transparent 0px, transparent 8px,
                rgba(0,0,0,0.015) 8px, rgba(0,0,0,0.015) 9px
              ),
              repeating-linear-gradient(
                107deg,
                transparent 0px, transparent 12px,
                rgba(0,0,0,0.01) 12px, rgba(0,0,0,0.01) 13px
              )
            `,
          }}
        />
        {/* Ink bleed halo — very subtle ink seeping into paper */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: `radial-gradient(ellipse 60% 40% at 50% 50%, rgba(0,0,0,${bleed * 0.04}) 0%, transparent 70%)`,
          }}
        />
      </div>
    )
  },

  renderWord: ({ word, color, enterProgress, exitProgress, phase, index, width, height }: WordRenderProps) => {
    const seed = index * 61 + 17
    const drops = splatters(seed, 18)

    // Ink stroke sweeps left-to-right (clip-path reveal)
    // clipX is the x position of the ink stroke leading edge (0..100% of width)
    let clipX = 0
    let textOpacity = 0
    let strokeOpacity = 0
    let splatterProgress = 0

    if (phase === 'enter') {
      // Stroke sweeps in
      const eased = 1 - Math.pow(1 - enterProgress, 2)
      clipX = eased * 110        // 0 → 110 (overshoots to clear frame)
      strokeOpacity = Math.min(1, enterProgress * 3)
      textOpacity = Math.max(0, (enterProgress - 0.1) / 0.9)
      splatterProgress = Math.min(1, (enterProgress - 0.3) / 0.7)
    } else if (phase === 'hold') {
      clipX = 110
      strokeOpacity = 0          // stroke has passed off screen
      textOpacity = 1
      splatterProgress = 1
    } else {
      // Ink dries and cracks — text fades with ink-crackle feel
      clipX = 110
      strokeOpacity = 0
      textOpacity = Math.max(0, 1 - exitProgress * 1.8)
      splatterProgress = Math.max(0, 1 - exitProgress * 2)
    }

    // Brush stroke height — roughly 60% of frame height
    const strokeH = height * 0.65
    const strokeY = (height - strokeH) / 2
    // Leading edge x in pixels
    const strokeLeadX = (clipX / 100) * (width + 60) - 60
    const strokeWidth = 80  // stroke thickness for the animated front

    // Tilt per word
    const tilt = ((seed % 5) - 2) * 1.8

    return (
      <>
        {/* Ink stroke leading edge — the brush bristle front */}
        {strokeOpacity > 0 && (
          <div
            style={{
              position: 'absolute',
              top: strokeY,
              left: strokeLeadX - strokeWidth * 0.5,
              width: strokeWidth,
              height: strokeH,
              background: `linear-gradient(90deg, transparent 0%, rgba(0,0,0,0.85) 30%, rgba(0,0,0,0.95) 60%, transparent 100%)`,
              opacity: strokeOpacity,
              borderRadius: '0 40% 40% 0',
              filter: 'blur(2px)',
            }}
          />
        )}

        {/* Inked area — revealed behind stroke */}
        <div
          style={{
            position: 'absolute',
            top: strokeY,
            left: 0,
            width: `${Math.min(100, clipX)}%`,
            height: strokeH,
            background: 'rgba(0,0,0,0.92)',
            overflow: 'hidden',
          }}
        >
          {/* Ink bleed on top and bottom edges — ragged brush look */}
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              height: '18%',
              background: 'linear-gradient(180deg, transparent 0%, rgba(0,0,0,0.6) 100%)',
              filter: 'blur(3px)',
            }}
          />
          <div
            style={{
              position: 'absolute',
              bottom: 0,
              left: 0,
              right: 0,
              height: '18%',
              background: 'linear-gradient(0deg, transparent 0%, rgba(0,0,0,0.6) 100%)',
              filter: 'blur(3px)',
            }}
          />
        </div>

        {/* Ink splatter drops — appear around stroke path */}
        {drops.map((drop, i) => {
          const dropThreshold = i / drops.length
          const dropOpacity = splatterProgress > dropThreshold
            ? Math.min(1, (splatterProgress - dropThreshold) / 0.15) * 0.8
            : 0
          if (dropOpacity <= 0) return null

          // Position relative to center
          const cx = width * 0.5 + (drop.x - 50) * (width / 100) * 1.1
          const cy = height * 0.5 + (drop.y - 50) * (height / 100) * 0.7

          return (
            <div
              key={i}
              style={{
                position: 'absolute',
                left: cx - drop.r,
                top: cy - drop.r,
                width: drop.r * 2,
                height: drop.r * 2,
                background: '#000000',
                borderRadius: i % 3 === 0 ? '50%' : '40% 60% 55% 45%',  // some round, some teardrop
                opacity: dropOpacity,
                transform: `rotate(${drop.angle}deg)`,
              }}
            />
          )
        })}

        {/* Text — shown in color contrast over black ink */}
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: `translate(-50%, -50%) rotate(${tilt}deg)`,
            opacity: Math.max(0, textOpacity),
          }}
        >
          <div
            style={{
              fontFamily: "Impact, 'Arial Black', sans-serif",
              fontSize: 'clamp(52px, 13vw, 175px)',
              fontWeight: 900,
              textTransform: 'uppercase',
              color: color,
              WebkitTextStroke: '2px rgba(0,0,0,0.4)',
              textShadow: '0 0 20px rgba(0,0,0,0.5)',
              whiteSpace: 'nowrap',
              letterSpacing: 3,
              userSelect: 'none',
              // Slight rough edge via filter
              filter: 'contrast(1.2)',
            }}
          >
            {word}
          </div>
        </div>
      </>
    )
  },
}

function ComicInkComponent(props: MotionGraphicProps<ComicInkConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-comic-ink',
  title: 'Kinetic Comic Ink',
  description: 'India ink brush stroke reveals text — a wide gestural brushstroke sweeps across with splatter drops at the edges, text glows through the wet black ink layer',
  tags: ['kinetic', 'typography', 'comic', 'ink', 'brush', 'splatter', 'india-ink', 'reveal', 'gesture'],
  category: 'captions',
  component: ComicInkComponent as any,
  defaultConfig: {
    words: ['INK!', 'BRUSH', 'STROKE', 'BLACK'],
    colors: ['#FFFFFF', '#FFFF00', '#FF2200', '#00FFFF'],
    bgColor: '#F5F0E8',
    cycleDuration: 1.2,
  },
  configSchema: [
    { key: 'words', label: 'Words', type: 'text-array', defaultValue: ['INK!', 'BRUSH', 'STROKE', 'BLACK'], group: 'Content' },
    { key: 'colors', label: 'Text Colors', type: 'text-array', defaultValue: ['#FFFFFF', '#FFFF00', '#FF2200', '#00FFFF'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#F5F0E8', group: 'Style' },
    { key: 'cycleDuration', label: 'Cycle Duration (s)', type: 'number', defaultValue: 1.2, min: 0.5, max: 5, group: 'Timing' },
  ],
})
