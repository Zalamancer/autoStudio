import { registerMotionGraphic } from '../registry'
import {
  KineticBase,
  type KineticBaseConfig,
  type KineticAnimation,
  type WordRenderProps,
  type BackgroundRenderProps,
} from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface PaletteKnifeConfig extends KineticBaseConfig {}

function rand(s: number): number {
  const x = Math.sin(s * 127.1 + 311.7) * 43758.5453
  return x - Math.floor(x)
}

function easeOutBack(t: number): number {
  const c1 = 1.70158
  const c3 = c1 + 1
  return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2)
}

function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3)
}

// Impasto ridges — thick paint knife strokes across the text area
const KNIFE_STROKES = Array.from({ length: 7 }, (_, i) => ({
  yPercent: 15 + i * 11,
  xStart: rand(i * 31) * 15,
  xEnd: 85 + rand(i * 17) * 15,
  thickness: 4 + rand(i * 23) * 8,
  angle: (rand(i * 41) - 0.5) * 8,
  opacity: 0.12 + rand(i * 13) * 0.15,
}))

const animation: KineticAnimation = {
  renderBackground: ({ bgColor }: BackgroundRenderProps) => (
    <div style={{ position: 'absolute', inset: 0, background: bgColor }}>
      {/* Canvas weave texture */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          backgroundImage: `
            repeating-linear-gradient(0deg, transparent, transparent 3px, rgba(0,0,0,0.03) 3px, rgba(0,0,0,0.03) 4px),
            repeating-linear-gradient(90deg, transparent, transparent 3px, rgba(0,0,0,0.03) 3px, rgba(0,0,0,0.03) 4px)
          `,
        }}
      />
      {/* Existing paint smears on canvas (background art) */}
      {Array.from({ length: 5 }, (_, i) => (
        <div
          key={i}
          style={{
            position: 'absolute',
            top: `${10 + rand(i * 37) * 80}%`,
            left: `${rand(i * 29) * 60}%`,
            width: `${15 + rand(i * 53) * 30}%`,
            height: `${4 + rand(i * 19) * 8}%`,
            background: `hsla(${rand(i * 71) * 360}, 40%, 60%, ${0.06 + rand(i * 43) * 0.08})`,
            borderRadius: '40%',
            transform: `rotate(${(rand(i * 61) - 0.5) * 20}deg)`,
            filter: 'blur(6px)',
          }}
        />
      ))}
    </div>
  ),

  renderWord: ({ word, color, enterProgress, holdProgress, exitProgress, phase, index }: WordRenderProps) => {
    const seed = index * 67

    let scale = 0.7
    let opacity = 0
    let knifeTwist = 0 // slight rotation as knife applies
    let impastoBlur = 0
    let ridgeOpacity = 0

    if (phase === 'enter') {
      const ep = easeOutBack(Math.min(1, enterProgress * 1.1))
      scale = 0.7 + ep * 0.35
      opacity = Math.min(1, enterProgress * 2.5)
      // Knife twists as it applies — slight rotation that settles
      knifeTwist = (1 - easeOutCubic(enterProgress)) * -4
      impastoBlur = (1 - easeOutCubic(enterProgress)) * 3
      ridgeOpacity = easeOutCubic(enterProgress)
    } else if (phase === 'hold') {
      scale = 1
      opacity = 1
      // Palette knife gives a slightly uneven 3D impasto look — subtle shimmer
      knifeTwist = Math.sin(holdProgress * Math.PI * 3 + seed) * 0.5
      ridgeOpacity = 1
    } else {
      scale = 1
      opacity = 1 - exitProgress * exitProgress
      knifeTwist = exitProgress * 3
      ridgeOpacity = 1 - exitProgress
    }

    return (
      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: `translate(-50%, -50%) scale(${scale}) rotate(${knifeTwist}deg)`,
          opacity,
        }}
      >
        {/* Impasto ridges across the text — thick paint texture */}
        {KNIFE_STROKES.map((stroke, i) => (
          <div
            key={i}
            style={{
              position: 'absolute',
              top: `${stroke.yPercent - 40}%`,
              left: `${stroke.xStart - 10}%`,
              width: `${stroke.xEnd - stroke.xStart + 20}%`,
              height: stroke.thickness,
              background: `linear-gradient(90deg,
                transparent,
                ${color}${Math.round(stroke.opacity * ridgeOpacity * 255).toString(16).padStart(2, '0')},
                ${color}${Math.round(stroke.opacity * ridgeOpacity * 0.7 * 255).toString(16).padStart(2, '0')},
                transparent
              )`,
              transform: `rotate(${stroke.angle}deg)`,
              borderRadius: 2,
              // Ridge highlight
              boxShadow: `0 -1px 2px rgba(255,255,255,${stroke.opacity * ridgeOpacity * 0.8}), 0 2px 3px rgba(0,0,0,${stroke.opacity * ridgeOpacity * 0.5})`,
            }}
          />
        ))}

        {/* Main text — heavy impasto style */}
        <div
          style={{
            position: 'relative',
            fontFamily: "'Georgia', 'Palatino', serif",
            fontSize: 'clamp(52px, 15vw, 178px)',
            fontWeight: 900,
            letterSpacing: 3,
            color,
            whiteSpace: 'nowrap',
            filter: impastoBlur > 0.1 ? `blur(${impastoBlur}px)` : undefined,
            // Thick impasto: multiple shadows create 3D raised paint look
            textShadow: `
              3px 3px 0 ${color}99,
              -1px -1px 0 ${color}60,
              5px 5px 8px rgba(0,0,0,0.35),
              0 -2px 0 rgba(255,255,255,0.25),
              2px -1px 0 rgba(255,255,255,0.15)
            `,
            WebkitTextStroke: `1px ${color}80`,
          }}
        >
          {word}
        </div>

        {/* Knife edge highlight — bright edge where knife lifted */}
        <div
          style={{
            position: 'absolute',
            bottom: '8%',
            left: '0%',
            right: '0%',
            height: 2,
            background: `linear-gradient(90deg, transparent, rgba(255,255,255,${ridgeOpacity * 0.5}), transparent)`,
            borderRadius: 1,
          }}
        />
      </div>
    )
  },
}

function PaletteKnifeComponent(props: MotionGraphicProps<PaletteKnifeConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-palette-knife',
  title: 'Kinetic Palette Knife',
  description:
    'Thick impasto oil paint applied with a palette knife — text emerges with 3D raised ridges, canvas texture, and a knife-twist entrance on a canvas background.',
  tags: ['kinetic', 'typography', 'palette', 'knife', 'impasto', 'oil', 'paint', 'canvas', 'art', 'thick'],
  category: 'captions',
  component: PaletteKnifeComponent as any,
  defaultConfig: {
    words: ['THICK', 'BOLD', 'IMPASTO', 'OIL'],
    colors: ['#C0392B', '#2980B9', '#27AE60', '#F39C12'],
    bgColor: '#D4C5A9',
    cycleDuration: 1.5,
  },
  configSchema: [
    { key: 'words', label: 'Words', type: 'text-array', defaultValue: ['THICK', 'BOLD', 'IMPASTO', 'OIL'], group: 'Content' },
    { key: 'colors', label: 'Colors', type: 'text-array', defaultValue: ['#C0392B', '#2980B9', '#27AE60', '#F39C12'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#D4C5A9', group: 'Style' },
    { key: 'cycleDuration', label: 'Cycle Duration (s)', type: 'number', defaultValue: 1.5, min: 0.4, max: 6, group: 'Timing' },
  ],
})
