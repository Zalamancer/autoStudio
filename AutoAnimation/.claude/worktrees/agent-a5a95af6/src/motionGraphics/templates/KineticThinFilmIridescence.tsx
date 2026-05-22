import { registerMotionGraphic } from '../registry'
import {
  KineticBase,
  type KineticBaseConfig,
  type KineticAnimation,
  type WordRenderProps,
  type BackgroundRenderProps,
} from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface ThinFilmIridescenceConfig extends KineticBaseConfig {}

function easeOutExpo(t: number): number {
  return t === 1 ? 1 : 1 - Math.pow(2, -10 * t)
}

function easeOutBack(t: number): number {
  const c1 = 1.70158
  const c3 = c1 + 1
  return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2)
}

// Thin film iridescence: wavelength-dependent interference creates shifting rainbow hues
// as viewing angle changes (like soap bubbles, oil slicks, beetle shells)
const animation: KineticAnimation = {
  renderBackground: ({ bgColor, frame, fps }: BackgroundRenderProps) => {
    const time = frame / fps
    // Background iridescent shimmer — subtle color wash
    const hue = (time * 40) % 360
    return (
      <div style={{ position: 'absolute', inset: 0, background: bgColor }}>
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: `radial-gradient(ellipse at ${50 + Math.sin(time * 0.7) * 20}% ${50 + Math.cos(time * 0.5) * 20}%, hsla(${hue}, 80%, 60%, 0.06) 0%, transparent 70%)`,
          }}
        />
      </div>
    )
  },

  renderWord: ({ word, color, enterProgress, exitProgress, phase, frame }: WordRenderProps) => {
    const time = (frame ?? 0) / 30
    const eased = easeOutExpo(Math.min(enterProgress, 1))
    const backEased = easeOutBack(Math.min(enterProgress, 1))

    // Scale in with back-easing
    const scale = phase === 'enter' ? 0.6 + backEased * 0.4 : phase === 'exit' ? 1 - exitProgress * 0.15 : 1

    // Iridescence: shift through spectrum as "viewing angle" changes
    // Each color layer offset slightly to create interference fringes
    const iridAngle =
      phase === 'hold'
        ? time * 60 // slowly sweeps through spectrum on hold
        : phase === 'enter'
          ? (1 - eased) * 180 + time * 40
          : time * 80 + exitProgress * 120

    const iridOpacity = phase === 'enter' ? eased : phase === 'exit' ? 1 - exitProgress : 1

    // Three interference color layers — thin film produces additive colors
    const layers = [
      { hueOffset: 0, blendX: 0, blendY: 0, opacity: 1.0 },
      { hueOffset: 120, blendX: 2, blendY: -1, opacity: 0.6 },
      { hueOffset: 240, blendX: -2, blendY: 1, opacity: 0.5 },
    ]

    return (
      <div
        style={{
          position: 'absolute',
          inset: 0,
          opacity: iridOpacity,
        }}
      >
        {layers.map((layer, i) => {
          const hue = (iridAngle + layer.hueOffset) % 360
          const layerColor = i === 0 ? color : `hsl(${hue}, 100%, 70%)`

          const blur = i === 0 ? 0 : 1

          return (
            <div
              key={i}
              style={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: `translate(calc(-50% + ${layer.blendX}px), calc(-50% + ${layer.blendY}px)) scale(${scale})`,
                fontFamily: "'Inter', 'Helvetica Neue', sans-serif",
                fontSize: 'clamp(44px, 13vw, 170px)',
                fontWeight: 800,
                color: layerColor,
                whiteSpace: 'nowrap',
                letterSpacing: '0.04em',
                textTransform: 'uppercase',
                opacity: i === 0 ? 1 : layer.opacity * 0.5,
                mixBlendMode: i === 0 ? 'normal' : 'screen',
                filter: blur > 0 ? `blur(${blur}px)` : undefined,
              }}
            >
              {word}
            </div>
          )
        })}

        {/* Iridescent sheen overlay — sweeping highlight */}
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: `translate(-50%, -50%) scale(${scale})`,
            fontFamily: "'Inter', 'Helvetica Neue', sans-serif",
            fontSize: 'clamp(44px, 13vw, 170px)',
            fontWeight: 800,
            color: 'transparent',
            whiteSpace: 'nowrap',
            letterSpacing: '0.04em',
            textTransform: 'uppercase',
            backgroundClip: 'text',
            WebkitBackgroundClip: 'text',
            backgroundImage: `linear-gradient(${iridAngle * 2}deg,
              hsl(${iridAngle % 360}, 100%, 70%) 0%,
              hsl(${(iridAngle + 60) % 360}, 100%, 70%) 25%,
              hsl(${(iridAngle + 120) % 360}, 100%, 70%) 50%,
              hsl(${(iridAngle + 180) % 360}, 100%, 70%) 75%,
              hsl(${(iridAngle + 240) % 360}, 100%, 70%) 100%
            )`,
            opacity: 0.45,
          }}
        >
          {word}
        </div>
      </div>
    )
  },
}

function ThinFilmIridescenceComponent(props: MotionGraphicProps<ThinFilmIridescenceConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-thin-film-iridescence',
  title: 'Kinetic Thin Film Iridescence',
  description:
    'Soap bubble / oil slick interference — text shimmers through a continuously shifting rainbow spectrum as the thin film interference angle rotates',
  tags: ['kinetic', 'typography', 'iridescence', 'thin-film', 'interference', 'rainbow', 'optical', 'soap'],
  category: 'captions',
  component: ThinFilmIridescenceComponent as any,
  defaultConfig: {
    words: ['SHIMMER', 'OPAL', 'IRIDESCENT', 'BUBBLE'],
    colors: ['#FFFFFF', '#F8F4FF', '#FFF8F0', '#F0FFF8'],
    bgColor: '#030308',
    cycleDuration: 1.8,
  },
  configSchema: [
    {
      key: 'words',
      label: 'Words',
      type: 'text-array',
      defaultValue: ['SHIMMER', 'OPAL', 'IRIDESCENT', 'BUBBLE'],
      group: 'Content',
    },
    { key: 'colors', label: 'Colors', type: 'text-array', defaultValue: ['#FFFFFF', '#F8F4FF'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#030308', group: 'Style' },
    {
      key: 'cycleDuration',
      label: 'Cycle Duration (s)',
      type: 'number',
      defaultValue: 1.8,
      min: 0.5,
      max: 5,
      group: 'Timing',
    },
  ],
})
