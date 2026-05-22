import { registerMotionGraphic } from '../registry'
import {
  KineticBase,
  type KineticBaseConfig,
  type KineticAnimation,
  type WordRenderProps,
  type BackgroundRenderProps,
} from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface TumblrFadeConfig extends KineticBaseConfig {}

const animation: KineticAnimation = {
  renderBackground: ({ bgColor, frame, fps }: BackgroundRenderProps) => {
    const time = frame / fps

    // Soft vignette pulsing — Tumblr aesthetic breathes
    const vignetteStrength = 0.5 + Math.sin(time * 0.3) * 0.05

    // Grain overlay — we simulate with radial gradients since we can't use canvas
    const grainPoints = Array.from({ length: 40 }, (_, i) => {
      const gx = (Math.sin(i * 127.1 + frame * 0.07) * 0.5 + 0.5) * 100
      const gy = (Math.sin(i * 311.7 + frame * 0.05) * 0.5 + 0.5) * 100
      const ga = 0.02 + (Math.sin(i * 53.3 + frame * 0.11) * 0.5 + 0.5) * 0.04
      return { x: gx, y: gy, a: ga }
    })

    return (
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: bgColor,
          overflow: 'hidden',
        }}
      >
        {/* Pastel gradient wash — horizontal dreamy gradient */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: `linear-gradient(135deg,
              rgba(255,182,193,0.15) 0%,
              rgba(221,160,221,0.1) 25%,
              rgba(176,196,222,0.12) 50%,
              rgba(152,251,152,0.08) 75%,
              rgba(255,218,185,0.12) 100%)`,
          }}
        />
        {/* Film grain simulation — scattered opacity dots */}
        {grainPoints.map((gp, i) => (
          <div
            key={i}
            style={{
              position: 'absolute',
              left: `${gp.x}%`,
              top: `${gp.y}%`,
              width: 2,
              height: 2,
              background: `rgba(0,0,0,${gp.a})`,
              borderRadius: '50%',
            }}
          />
        ))}
        {/* Vignette — signature Tumblr soft grunge look */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: `radial-gradient(ellipse at 50% 50%, transparent 30%, rgba(0,0,0,${vignetteStrength}) 100%)`,
            pointerEvents: 'none',
          }}
        />
        {/* Subtle horizontal light leak */}
        <div
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            top: '15%',
            height: '30%',
            background: `linear-gradient(90deg,
              rgba(255,200,200,0.04) 0%,
              rgba(255,230,220,0.08) 20%,
              rgba(255,220,210,0.04) 40%,
              transparent 60%)`,
            filter: 'blur(8px)',
            transform: `rotate(${Math.sin(time * 0.2) * 2}deg)`,
          }}
        />
      </div>
    )
  },

  renderWord: ({ word, color, enterProgress, holdProgress, exitProgress, phase }: WordRenderProps) => {
    // Tumblr: text fades in slowly, sits ethereally, drifts out
    let opacity = 0
    let translateY = 0
    let blur = 0
    let scale = 1

    if (phase === 'enter') {
      // Dreamy slow fade up from below
      const eased = 1 - Math.pow(1 - enterProgress, 2)
      opacity = eased * 0.9
      translateY = (1 - eased) * 30
      blur = (1 - enterProgress) * 4
    } else if (phase === 'hold') {
      opacity = 0.88 + Math.sin(holdProgress * Math.PI * 1.5) * 0.05
      translateY = Math.sin(holdProgress * Math.PI) * 4
      blur = 0
    } else {
      // Fade out upward, washed out
      opacity = (1 - exitProgress) * 0.9
      translateY = exitProgress * -20
      blur = exitProgress * 3
      scale = 1 + exitProgress * 0.03
    }

    // Tumblr soft grunge palette — desaturated, washed
    const washedColor = color

    return (
      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: `translate(-50%, -50%) translateY(${translateY}px) scale(${scale})`,
          opacity,
          filter: blur > 0 ? `blur(${blur}px)` : undefined,
          textAlign: 'center',
        }}
      >
        {/* Ghost/echo layer — typical Tumblr aesthetic double exposure */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontFamily: "'Georgia', 'Times New Roman', serif",
            fontSize: 'clamp(32px, 9vw, 120px)',
            fontWeight: 300,
            fontStyle: 'italic',
            letterSpacing: '0.12em',
            color: washedColor,
            whiteSpace: 'nowrap',
            opacity: 0.15,
            transform: 'translate(3px, 3px)',
            filter: 'blur(2px)',
          }}
        >
          {word}
        </div>
        {/* Main text — thin, italic, lowercase Tumblr typography */}
        <div
          style={{
            position: 'relative',
            fontFamily: "'Georgia', 'Times New Roman', serif",
            fontSize: 'clamp(32px, 9vw, 120px)',
            fontWeight: 300,
            fontStyle: 'italic',
            letterSpacing: '0.12em',
            color: washedColor,
            whiteSpace: 'nowrap',
            textShadow: `0 1px 8px rgba(0,0,0,0.2)`,
          }}
        >
          {word.toLowerCase()}
        </div>
        {/* Tumblr-style em-dash decorations */}
        <div
          style={{
            position: 'absolute',
            bottom: -22,
            left: '50%',
            transform: 'translateX(-50%)',
            fontFamily: "'Georgia', serif",
            fontSize: 'clamp(10px, 2vw, 16px)',
            color: washedColor,
            opacity: 0.5,
            letterSpacing: '0.3em',
            whiteSpace: 'nowrap',
          }}
        >
          — — —
        </div>
      </div>
    )
  },
}

function TumblrFadeComponent(props: MotionGraphicProps<TumblrFadeConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-tumblr-fade',
  title: 'Kinetic Tumblr Fade',
  description:
    'Tumblr soft grunge aesthetic: faded pastel lowercase italic serif text with film grain, vignette, and dreamy fade animation',
  tags: ['kinetic', 'typography', 'tumblr', 'soft-grunge', 'pastel', 'aesthetic', 'nostalgia', 'indie', '2010s'],
  category: 'captions',
  component: TumblrFadeComponent as any,
  defaultConfig: {
    words: ['ethereal', 'lost', 'dreaming', 'soft'],
    colors: ['#c9a0a0', '#a0a0c9', '#a0c9a0', '#c9c0a0'],
    bgColor: '#f5f0eb',
    cycleDuration: 1.8,
  },
  configSchema: [
    {
      key: 'words',
      label: 'Words',
      type: 'text-array',
      defaultValue: ['ethereal', 'lost', 'dreaming', 'soft'],
      group: 'Content',
    },
    {
      key: 'colors',
      label: 'Colors',
      type: 'text-array',
      defaultValue: ['#c9a0a0', '#a0a0c9', '#a0c9a0', '#c9c0a0'],
      group: 'Style',
    },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#f5f0eb', group: 'Style' },
    {
      key: 'cycleDuration',
      label: 'Cycle Duration (s)',
      type: 'number',
      defaultValue: 1.8,
      min: 0.5,
      max: 6,
      group: 'Timing',
    },
  ],
})
