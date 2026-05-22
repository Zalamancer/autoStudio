import { registerMotionGraphic } from '../registry'
import {
  KineticBase,
  type KineticBaseConfig,
  type KineticAnimation,
  type WordRenderProps,
  type BackgroundRenderProps,
} from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface SphericalAberrationConfig extends KineticBaseConfig {}

function easeOutExpo(t: number): number {
  return t === 1 ? 1 : 1 - Math.pow(2, -10 * t)
}

// Spherical aberration: rays at the edge of a lens focus differently than rays at center
// Result: soft outer halo ring around a sharp center
const ABERRATION_RINGS = [
  { scale: 1.0, opacity: 1.0, blur: 0, offset: 0 }, // center — sharp
  { scale: 1.04, opacity: 0.35, blur: 1.5, offset: 0 }, // inner ring
  { scale: 1.1, opacity: 0.2, blur: 3, offset: 0 }, // mid ring
  { scale: 1.18, opacity: 0.12, blur: 6, offset: 0 }, // outer ring — most aberrated
  { scale: 1.28, opacity: 0.06, blur: 10, offset: 0 }, // far halo
]

const animation: KineticAnimation = {
  renderBackground: ({ bgColor, frame, fps }: BackgroundRenderProps) => {
    const time = frame / fps
    return (
      <div style={{ position: 'absolute', inset: 0, background: bgColor }}>
        {/* Lens center glow */}
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: `${60 + Math.sin(time * 1.1) * 5}%`,
            height: `${60 + Math.sin(time * 0.9) * 5}%`,
            background: 'radial-gradient(ellipse, rgba(255,255,255,0.025) 0%, transparent 70%)',
            borderRadius: '50%',
          }}
        />
      </div>
    )
  },

  renderWord: ({ word, color, enterProgress, exitProgress, phase, frame }: WordRenderProps) => {
    const time = (frame ?? 0) / 30
    const eased = easeOutExpo(Math.min(enterProgress, 1))

    // Aberration amount — large at entry (out-of-focus), corrects to sharp on hold
    const aberrationStrength =
      phase === 'enter'
        ? 1 - eased
        : phase === 'hold'
          ? 0.08 + Math.sin(time * 1.4) * 0.04 // slight breathing residual
          : exitProgress

    // Scale pulsing on hold (lens breathing)
    const holdScale = phase === 'hold' ? 1 + Math.sin(time * 1.8) * 0.015 : 1

    const overallOpacity = phase === 'enter' ? Math.min(1, enterProgress * 2) : 1

    return (
      <div style={{ position: 'absolute', inset: 0, opacity: overallOpacity }}>
        {ABERRATION_RINGS.map((ring, i) => {
          const ringScale = 1 + (ring.scale - 1) * aberrationStrength * holdScale
          const ringOpacity = i === 0 ? 1 - aberrationStrength * 0.1 : ring.opacity * aberrationStrength
          const ringBlur = ring.blur * aberrationStrength

          // Color fringing on outer rings
          const ringColor =
            i === 0
              ? color
              : i <= 2
                ? `rgba(${parseInt(color.slice(1, 3) || 'FF', 16)}, ${parseInt(color.slice(3, 5) || 'FF', 16) - 30 * i}, ${parseInt(color.slice(5, 7) || 'FF', 16) + 20 * i}, 1)`
                : color

          return (
            <div
              key={i}
              style={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: `translate(-50%, -50%) scale(${ringScale})`,
                fontFamily: "'Inter', 'Helvetica Neue', sans-serif",
                fontSize: 'clamp(44px, 13vw, 170px)',
                fontWeight: 800,
                color: i === 0 ? color : `rgba(255,255,255,${ring.opacity})`,
                whiteSpace: 'nowrap',
                letterSpacing: '0.03em',
                textTransform: 'uppercase',
                opacity: ringOpacity,
                filter: ringBlur > 0 ? `blur(${ringBlur}px)` : undefined,
                mixBlendMode: i > 0 ? 'screen' : 'normal',
              }}
            >
              {word}
            </div>
          )
        })}
      </div>
    )
  },
}

function SphericalAberrationComponent(props: MotionGraphicProps<SphericalAberrationConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-spherical-aberration',
  title: 'Kinetic Spherical Aberration',
  description:
    'Text focuses in from a dreamy spherical aberration halo — concentric out-of-focus rings collapse inward as the lens corrects, leaving a razor-sharp center',
  tags: ['kinetic', 'typography', 'aberration', 'spherical', 'lens', 'optical', 'focus', 'halo'],
  category: 'captions',
  component: SphericalAberrationComponent as any,
  defaultConfig: {
    words: ['FOCUS', 'SHARP', 'CLEAR', 'OPTIC'],
    colors: ['#FFFFFF', '#F0F8FF', '#E8F4FF', '#D8EEFF'],
    bgColor: '#050508',
    cycleDuration: 1.5,
  },
  configSchema: [
    {
      key: 'words',
      label: 'Words',
      type: 'text-array',
      defaultValue: ['FOCUS', 'SHARP', 'CLEAR', 'OPTIC'],
      group: 'Content',
    },
    { key: 'colors', label: 'Colors', type: 'text-array', defaultValue: ['#FFFFFF', '#F0F8FF'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#050508', group: 'Style' },
    {
      key: 'cycleDuration',
      label: 'Cycle Duration (s)',
      type: 'number',
      defaultValue: 1.5,
      min: 0.5,
      max: 5,
      group: 'Timing',
    },
  ],
})
