import { registerMotionGraphic } from '../registry'
import {
  KineticBase,
  type KineticBaseConfig,
  type KineticAnimation,
  type WordRenderProps,
  type BackgroundRenderProps,
} from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface PastelSmearConfig extends KineticBaseConfig {}

function rand(s: number): number {
  const x = Math.sin(s * 127.1 + 311.7) * 43758.5453
  return x - Math.floor(x)
}

function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3)
}

function easeInOutSine(t: number): number {
  return -(Math.cos(Math.PI * t) - 1) / 2
}

// Finger-blend smear layers — soft horizontal smears from finger blending the pastel
const SMEAR_LAYERS = Array.from({ length: 8 }, (_, i) => ({
  yPercent: 20 + i * 8,
  xStart: rand(i * 31) * 15,
  xEnd: 80 + rand(i * 23) * 20,
  blur: 4 + rand(i * 37) * 8,
  opacity: 0.12 + rand(i * 19) * 0.18,
  thickness: 6 + rand(i * 13) * 10,
}))

// Pastel chalk dust flecks scattered around text
const CHALK_FLECKS = Array.from({ length: 20 }, (_, i) => ({
  xPercent: rand(i * 43) * 130 - 15,
  yOffset: (rand(i * 29) - 0.5) * 90,
  size: 2 + rand(i * 17) * 6,
  opacity: 0.1 + rand(i * 11) * 0.2,
}))

const animation: KineticAnimation = {
  renderBackground: ({ bgColor }: BackgroundRenderProps) => (
    <div style={{ position: 'absolute', inset: 0, background: bgColor }}>
      {/* Toned paper texture — slight grain */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          backgroundImage: `
            repeating-linear-gradient(
              45deg,
              transparent,
              transparent 6px,
              rgba(0,0,0,0.012) 6px,
              rgba(0,0,0,0.012) 7px
            ),
            repeating-linear-gradient(
              -45deg,
              transparent,
              transparent 6px,
              rgba(0,0,0,0.008) 6px,
              rgba(0,0,0,0.008) 7px
            )
          `,
        }}
      />
      {/* Pastel-dusted corners */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: `
            radial-gradient(ellipse at 5% 95%, rgba(255,200,200,0.06) 0%, transparent 35%),
            radial-gradient(ellipse at 95% 5%, rgba(200,200,255,0.05) 0%, transparent 30%),
            radial-gradient(ellipse at 50% 50%, rgba(255,255,200,0.03) 0%, transparent 60%)
          `,
        }}
      />
    </div>
  ),

  renderWord: ({ word, color, enterProgress, holdProgress, exitProgress, phase, index }: WordRenderProps) => {
    const seed = index * 79

    let textOpacity = 0
    let smearOpacity = 0
    let blendBlur = 10 // finger-blend softness
    let scale = 1.05
    let smearWidth = 0 // how wide the smear extends beyond text

    if (phase === 'enter') {
      // Soft pastel: text starts as a wide smear, finger blend sharpens it into form
      const ep = easeOutCubic(enterProgress)
      textOpacity = ep
      smearOpacity = (1 - ep * 0.6) * 0.8
      blendBlur = (1 - ep) * 10 + 1
      scale = 1.05 - ep * 0.05
      smearWidth = (1 - ep) * 40
    } else if (phase === 'hold') {
      textOpacity = 1
      // Slight saturation pulse — pastel color breathing
      smearOpacity = 0.3 + Math.sin(holdProgress * Math.PI * 3 + seed) * 0.06
      blendBlur = 1.5
      scale = 1
      smearWidth = 8
    } else {
      // Exit: finger swipes across and smears text away
      const ep = easeInOutSine(exitProgress)
      textOpacity = 1 - ep
      smearOpacity = ep * 0.7
      blendBlur = ep * 12 + 1.5
      scale = 1 + ep * 0.08
      smearWidth = ep * 50
    }

    // Lighten color for pastel quality
    const pastelColor = color

    return (
      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: `translate(-50%, -50%) scale(${scale})`,
        }}
      >
        {/* Finger-blend smear layers */}
        {SMEAR_LAYERS.map((smear, i) => (
          <div
            key={i}
            style={{
              position: 'absolute',
              top: `${smear.yPercent - 10}%`,
              left: `calc(${smear.xStart - smearWidth * 0.3}% - ${smearWidth}px)`,
              right: `calc(${100 - smear.xEnd - smearWidth * 0.3}% - ${smearWidth}px)`,
              height: smear.thickness,
              background: pastelColor,
              opacity: smear.opacity * smearOpacity,
              filter: `blur(${smear.blur + blendBlur * 0.5}px)`,
              borderRadius: smear.thickness / 2,
            }}
          />
        ))}

        {/* Chalk dust flecks floating around the text */}
        {CHALK_FLECKS.map((fleck, i) => (
          <div
            key={i}
            style={{
              position: 'absolute',
              top: `calc(50% + ${fleck.yOffset}px)`,
              left: `${fleck.xPercent}%`,
              width: fleck.size,
              height: fleck.size * (0.5 + rand(i * 23) * 0.5),
              borderRadius: '50%',
              background: pastelColor,
              opacity: fleck.opacity * smearOpacity,
              filter: `blur(${rand(i * 11) * 2}px)`,
              transform: 'translate(-50%, -50%)',
            }}
          />
        ))}

        {/* Soft glow bloom behind text — the pastel pigment diffusing */}
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: `calc(100% + ${smearWidth * 2}px)`,
            height: '160%',
            borderRadius: '50%',
            background: `radial-gradient(ellipse, ${pastelColor}${Math.round(smearOpacity * 0.6 * 255).toString(16).padStart(2, '0')} 0%, transparent 65%)`,
            filter: `blur(${blendBlur + 5}px)`,
            pointerEvents: 'none',
          }}
        />

        {/* Main text */}
        <div
          style={{
            position: 'relative',
            fontFamily: "'Georgia', 'Palatino Linotype', serif",
            fontSize: 'clamp(50px, 14vw, 172px)',
            fontWeight: 700,
            letterSpacing: 5,
            color: pastelColor,
            opacity: textOpacity,
            whiteSpace: 'nowrap',
            filter: blendBlur > 0.5 ? `blur(${blendBlur * 0.4}px)` : undefined,
            // Pastel: chalky, slightly powdery look — soft diffuse shadow
            textShadow: `
              0 0 ${8 + blendBlur}px ${pastelColor}90,
              0 0 ${20 + blendBlur * 2}px ${pastelColor}50,
              1px 1px 0 rgba(255,255,255,0.3),
              -1px -1px 0 rgba(255,255,255,0.15)
            `,
          }}
        >
          {word}
        </div>
      </div>
    )
  },
}

function PastelSmearComponent(props: MotionGraphicProps<PastelSmearConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-pastel-smear',
  title: 'Kinetic Pastel Smear',
  description:
    'Soft pastel chalk is smeared onto toned paper — text forms from a wide smear as if a finger blends it into shape, with floating chalk dust flecks and soft color bloom.',
  tags: ['kinetic', 'typography', 'pastel', 'chalk', 'smear', 'blend', 'soft', 'art', 'dreamy', 'texture'],
  category: 'captions',
  component: PastelSmearComponent as any,
  defaultConfig: {
    words: ['SOFT', 'BLEND', 'PASTEL', 'SMEAR'],
    colors: ['#E8A0BF', '#A0C4E8', '#A0E8B8', '#E8D8A0'],
    bgColor: '#3D3530',
    cycleDuration: 1.6,
  },
  configSchema: [
    { key: 'words', label: 'Words', type: 'text-array', defaultValue: ['SOFT', 'BLEND', 'PASTEL', 'SMEAR'], group: 'Content' },
    { key: 'colors', label: 'Colors', type: 'text-array', defaultValue: ['#E8A0BF', '#A0C4E8', '#A0E8B8', '#E8D8A0'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#3D3530', group: 'Style' },
    { key: 'cycleDuration', label: 'Cycle Duration (s)', type: 'number', defaultValue: 1.6, min: 0.5, max: 6, group: 'Timing' },
  ],
})
