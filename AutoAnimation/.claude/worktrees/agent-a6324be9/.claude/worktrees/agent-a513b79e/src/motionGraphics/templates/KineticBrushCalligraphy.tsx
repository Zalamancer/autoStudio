import { registerMotionGraphic } from '../registry'
import {
  KineticBase,
  type KineticBaseConfig,
  type KineticAnimation,
  type WordRenderProps,
  type BackgroundRenderProps,
} from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface BrushCalligraphyConfig extends KineticBaseConfig {}

function rand(s: number): number {
  const x = Math.sin(s * 127.1 + 311.7) * 43758.5453
  return x - Math.floor(x)
}

function easeOutExpo(t: number): number {
  return t === 1 ? 1 : 1 - Math.pow(2, -10 * t)
}

function easeInQuad(t: number): number {
  return t * t
}

// Brush stroke: bristle spread positions for the leading edge shimmer
const BRISTLE_TRAILS = Array.from({ length: 6 }, (_, i) => ({
  yOffset: (rand(i * 37) - 0.5) * 28,
  xLag: rand(i * 23) * 8,
  opacity: 0.3 + rand(i * 41) * 0.4,
  width: 2 + rand(i * 13) * 3,
}))

const animation: KineticAnimation = {
  renderBackground: ({ bgColor }: BackgroundRenderProps) => (
    <div style={{ position: 'absolute', inset: 0, background: bgColor }}>
      {/* Rice paper / washi texture: soft horizontal fibres */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          backgroundImage: `
            repeating-linear-gradient(
              178deg,
              transparent,
              transparent 12px,
              rgba(180,160,130,0.04) 12px,
              rgba(180,160,130,0.04) 13px
            )
          `,
        }}
      />
      {/* Ink wash background bleed */}
      <div
        style={{
          position: 'absolute',
          top: '25%',
          left: '20%',
          width: '60%',
          height: '50%',
          background: 'radial-gradient(ellipse, rgba(0,0,0,0.04) 0%, transparent 70%)',
          filter: 'blur(30px)',
        }}
      />
    </div>
  ),

  renderWord: ({ word, color, enterProgress, holdProgress, exitProgress, phase, index }: WordRenderProps) => {
    const seed = index * 61

    let clipRight = 100
    let opacity = 0
    let brushX = 0 // 0..100 — position of leading brush tip
    let brushAlpha = 0
    let scaleY = 0.85
    let wobble = 0

    if (phase === 'enter') {
      const ep = easeOutExpo(enterProgress)
      clipRight = (1 - ep) * 100
      opacity = Math.min(1, enterProgress * 4)
      brushX = ep * 105
      brushAlpha = enterProgress < 0.9 ? 1 : (1 - enterProgress) / 0.1
      scaleY = 0.85 + ep * 0.15
      // Brush loading wobble at start
      wobble = (1 - ep) * Math.sin(enterProgress * Math.PI * 8 + seed) * 3
    } else if (phase === 'hold') {
      clipRight = 0
      opacity = 1
      brushX = 105
      brushAlpha = 0
      scaleY = 1
      // Slight ink settling movement
      wobble = Math.sin(holdProgress * Math.PI * 3 + seed) * 0.8
    } else {
      // Exit: brush lifts and ink dries — fade with slight vertical compress
      clipRight = 0
      opacity = 1 - easeInQuad(exitProgress)
      brushX = 105
      brushAlpha = 0
      scaleY = 1 - exitProgress * 0.05
      wobble = exitProgress * 2
    }

    return (
      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: `translate(-50%, -50%) scaleY(${scaleY}) rotate(${wobble * 0.3}deg)`,
          opacity,
        }}
      >
        {/* Bristle spread trails at brush tip */}
        {BRISTLE_TRAILS.map((bristle, i) => (
          <div
            key={i}
            style={{
              position: 'absolute',
              top: `calc(50% + ${bristle.yOffset}px)`,
              left: `calc(${brushX - bristle.xLag}% - 2px)`,
              width: bristle.width,
              height: 6,
              background: color,
              borderRadius: 2,
              opacity: brushAlpha * bristle.opacity,
              transform: 'translateY(-50%)',
            }}
          />
        ))}

        {/* Main text — broad brush calligraphy style */}
        <div
          style={{
            position: 'relative',
            fontFamily: "'Georgia', 'Palatino Linotype', serif",
            fontSize: 'clamp(50px, 14vw, 172px)',
            fontWeight: 900,
            fontStyle: 'italic',
            letterSpacing: 2,
            color,
            whiteSpace: 'nowrap',
            clipPath: `inset(0 ${clipRight}% 0 0)`,
            // Brush calligraphy: thick downstrokes, thin upstrokes simulated via multiple shadows
            textShadow: `
              2px 0 0 ${color},
              3px 0 0 ${color}cc,
              -1px 0 0 ${color}88,
              0 2px 2px rgba(0,0,0,0.25),
              4px 4px 8px rgba(0,0,0,0.15)
            `,
            // Brush bristle spread: slight horizontal blur on horizontal strokes
            filter: phase === 'enter' && enterProgress < 0.8 ? `blur(${(1 - enterProgress / 0.8) * 1.2}px)` : undefined,
          }}
        >
          {word}
        </div>

        {/* Ink line at text baseline — pooled ink under the brush stroke */}
        <div
          style={{
            position: 'absolute',
            bottom: '5%',
            left: 0,
            width: `${100 - clipRight}%`,
            height: 3,
            background: `linear-gradient(90deg, ${color}80, ${color}20)`,
            borderRadius: 2,
          }}
        />
      </div>
    )
  },
}

function BrushCalligraphyComponent(props: MotionGraphicProps<BrushCalligraphyConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-brush-calligraphy',
  title: 'Kinetic Brush Calligraphy',
  description:
    'Broad calligraphy brush sweeps across drawing text with thick-thin stroke variation, bristle spread at the tip, and ink pooling at the baseline on rice paper.',
  tags: ['kinetic', 'typography', 'brush', 'calligraphy', 'ink', 'stroke', 'asian', 'art', 'lettering', 'elegant'],
  category: 'captions',
  component: BrushCalligraphyComponent as any,
  defaultConfig: {
    words: ['BRUSH', 'STROKE', 'FLOW', 'INK'],
    colors: ['#1A1008', '#2D1B00', '#0D0D1A', '#1A0A0A'],
    bgColor: '#F2ECD8',
    cycleDuration: 1.5,
  },
  configSchema: [
    { key: 'words', label: 'Words', type: 'text-array', defaultValue: ['BRUSH', 'STROKE', 'FLOW', 'INK'], group: 'Content' },
    { key: 'colors', label: 'Colors', type: 'text-array', defaultValue: ['#1A1008', '#2D1B00', '#0D0D1A', '#1A0A0A'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#F2ECD8', group: 'Style' },
    { key: 'cycleDuration', label: 'Cycle Duration (s)', type: 'number', defaultValue: 1.5, min: 0.4, max: 6, group: 'Timing' },
  ],
})
