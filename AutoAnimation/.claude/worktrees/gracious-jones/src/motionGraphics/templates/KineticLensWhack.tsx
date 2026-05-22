import { registerMotionGraphic } from '../registry'
import { KineticBase, type KineticBaseConfig, type KineticAnimation, type WordRenderProps, type BackgroundRenderProps } from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface LensWhackConfig extends KineticBaseConfig {
  leakIntensity: number
}

// Lens whack / free-lensing:
// The photographer/cinematographer physically detaches the lens from the body
// (or tilts it away) while shooting. This breaks the light seal, flooding the
// sensor with ambient light leaks, while focus becomes wild and unpredictable —
// only a tiny sliver of the frame stays sharp.
// Effect: heavy directional light leak (orange/red/purple) floods from one corner,
// aggressive blur everywhere except a shifting focal sliver, and a characteristic
// flicker as the lens angle changes.

function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3)
}

function easeInCubic(t: number): number {
  return t * t * t
}

// Deterministic light leak geometry
const LEAK_STRIPS = [
  { x: 0, y: 0, w: 60, h: 40, hue: 20, sat: 90, lit: 60, opacity: 0.18 },
  { x: 0, y: 0, w: 35, h: 70, hue: 350, sat: 80, lit: 55, opacity: 0.12 },
  { x: 5, y: 0, w: 20, h: 50, hue: 280, sat: 70, lit: 50, opacity: 0.08 },
  { x: 0, y: 60, w: 45, h: 40, hue: 30, sat: 95, lit: 65, opacity: 0.10 },
]

const animation: KineticAnimation = {
  renderBackground: ({ bgColor, frame, fps, enterProgress, holdProgress, exitProgress }: BackgroundRenderProps) => {
    const time = frame / fps
    const ep = (enterProgress as number) ?? 0
    const xp = (exitProgress as number) ?? 0
    const hp = (holdProgress as number) ?? 0

    // Leak intensity: strong at start (lens pulled away), fades as text sharpens,
    // flares back on exit
    const leakBase = hp > 0
      ? 0.3 + xp * 0.7   // rises on exit
      : Math.max(0.3, 1 - ep * 0.7)  // fades during enter focus pull

    // Organic flicker — deterministic frame-based
    const flicker = 0.85 + (Math.sin(frame * 2.3) * 0.5 + 0.5) * 0.15

    return (
      <div style={{ position: 'absolute', inset: 0, background: bgColor, overflow: 'hidden' }}>
        {/* Base exposure — slight warm cast from ambient light flooding in */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: `radial-gradient(ellipse at 10% 10%, rgba(255,120,40,${0.08 * leakBase}) 0%, transparent 60%)`,
            pointerEvents: 'none',
          }}
        />

        {/* Light leak strips from top-left corner */}
        {LEAK_STRIPS.map((s, i) => {
          const alpha = s.opacity * leakBase * flicker
          return (
            <div
              key={i}
              style={{
                position: 'absolute',
                left: `${s.x}%`,
                top: `${s.y}%`,
                width: `${s.w}%`,
                height: `${s.h}%`,
                background: `linear-gradient(135deg, hsla(${s.hue},${s.sat}%,${s.lit}%,${alpha}) 0%, transparent 70%)`,
                pointerEvents: 'none',
                mixBlendMode: 'screen',
              }}
            />
          )
        })}

        {/* Sensor flare bloom at leak origin */}
        <div
          style={{
            position: 'absolute',
            left: '-5%',
            top: '-5%',
            width: '50%',
            height: '50%',
            background: `radial-gradient(ellipse at 10% 10%, rgba(255,180,60,${0.25 * leakBase * flicker}) 0%, rgba(255,60,80,${0.1 * leakBase}) 40%, transparent 70%)`,
            filter: `blur(${8 + leakBase * 12}px)`,
            pointerEvents: 'none',
          }}
        />

        {/* Heavy defocus vignette — almost entire frame is blurred out */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: `radial-gradient(ellipse at 50% 50%, transparent 15%, rgba(0,0,0,0.55) 50%, rgba(0,0,0,0.88) 100%)`,
            pointerEvents: 'none',
          }}
        />
      </div>
    )
  },

  renderWord: ({ word, color, enterProgress, exitProgress, phase, frame, index }: WordRenderProps) => {
    const f = frame ?? 0

    // Free-lensing focus is wild — we simulate a narrow focus sliver moving
    // Deterministic oscillation of the "in-focus zone" within the word
    const focalWander = Math.sin(f * 0.08 + index * 1.4) * 0.5 + 0.5  // 0..1

    let globalBlur: number   // overall blur
    let opacity: number
    let leakTint: number     // orange-red light leak overlaid on text

    if (phase === 'enter') {
      const ep = easeOutCubic(enterProgress)
      globalBlur = 18 - ep * 15  // from very blurry to nearly sharp
      opacity = 0.4 + ep * 0.6
      leakTint = 1 - ep           // leak fades as focus lands
    } else if (phase === 'hold') {
      globalBlur = 1.5 + focalWander * 2  // slight wandering blur, never fully still
      opacity = 1
      leakTint = 0.15 + focalWander * 0.1
    } else {
      const ep = easeInCubic(exitProgress)
      globalBlur = 3 + ep * 18
      opacity = 1 - ep * 0.9
      leakTint = ep * 0.8
    }

    return (
      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          whiteSpace: 'nowrap',
          opacity,
        }}
      >
        {/* Light leak color cast on text */}
        {leakTint > 0.05 && (
          <div
            style={{
              position: 'absolute',
              inset: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontFamily: "'Helvetica Neue', Arial, sans-serif",
              fontSize: 'clamp(40px, 10vw, 140px)',
              fontWeight: 700,
              color: `rgba(255,100,40,${leakTint * 0.65})`,
              letterSpacing: '0.04em',
              textTransform: 'uppercase',
              whiteSpace: 'nowrap',
              filter: `blur(${globalBlur * 0.7 + 6}px)`,
              mixBlendMode: 'screen',
            }}
          >
            {word}
          </div>
        )}
        {/* Main text — blurred with free-lens defocus */}
        <div
          style={{
            position: 'relative',
            fontFamily: "'Helvetica Neue', Arial, sans-serif",
            fontSize: 'clamp(40px, 10vw, 140px)',
            fontWeight: 700,
            color,
            letterSpacing: '0.04em',
            textTransform: 'uppercase',
            filter: globalBlur > 0.2 ? `blur(${globalBlur}px)` : 'none',
            textShadow: globalBlur < 2 ? `0 0 20px rgba(255,180,80,0.3)` : 'none',
          }}
        >
          {word}
        </div>
      </div>
    )
  },
}

function LensWhackComponent(props: MotionGraphicProps<LensWhackConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-lens-whack',
  title: 'Kinetic Lens Whack',
  description: 'Free-lensing / lens whack: detached lens floods the frame with orange-red light leaks and wild defocus blur — text gradually emerges as the tilted lens finds a focal sliver',
  tags: ['kinetic', 'typography', 'film', 'camera', 'lens whack', 'free-lensing', 'light leak', 'defocus', 'cinematic', 'lens'],
  category: 'captions',
  component: LensWhackComponent as any,
  defaultConfig: {
    words: ['WILD', 'LEAK', 'LOOSE', 'FREE'],
    colors: ['#FFE0C0', '#FFFFFF', '#FFD0A0', '#FFF0E0'],
    bgColor: '#05030A',
    cycleDuration: 1.6,
    leakIntensity: 70,
  },
  configSchema: [
    { key: 'words', label: 'Words', type: 'text-array', defaultValue: ['WILD', 'LEAK', 'LOOSE', 'FREE'], group: 'Content' },
    { key: 'colors', label: 'Colors', type: 'text-array', defaultValue: ['#FFE0C0', '#FFFFFF', '#FFD0A0', '#FFF0E0'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#05030A', group: 'Style' },
    { key: 'cycleDuration', label: 'Cycle Duration (s)', type: 'number', defaultValue: 1.6, min: 0.5, max: 5, group: 'Timing' },
    { key: 'leakIntensity', label: 'Light Leak Intensity', type: 'number', defaultValue: 70, min: 20, max: 100, group: 'Animation' },
  ],
})
