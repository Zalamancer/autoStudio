import { registerMotionGraphic } from '../registry'
import {
  KineticBase,
  type KineticBaseConfig,
  type KineticAnimation,
  type WordRenderProps,
  type BackgroundRenderProps,
} from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface ConcretePourConfig extends KineticBaseConfig {
  concreteColor: string
}

/* ---------- Easing curves matching viscous fluid physics ---------- */

// Concrete is thick — slow at first, then surges when pressure builds
function easeInOutQuart(t: number): number {
  return t < 0.5 ? 8 * t * t * t * t : 1 - Math.pow(-2 * t + 2, 4) / 2
}

// Surface tension droop at top of pour — slight overshoot
function easeOutBack(t: number): number {
  const c1 = 1.70158
  const c3 = c1 + 1
  return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2)
}

// Concrete drain — faster at start due to gravity
function easeInCubic(t: number): number {
  return t * t * t
}

const animation: KineticAnimation = {
  renderBackground: ({ bgColor, width, height }: BackgroundRenderProps) => (
    <div style={{ position: 'absolute', inset: 0, background: bgColor }}>
      {/* Formwork wood-grain texture */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          backgroundImage: `
            repeating-linear-gradient(
              2deg,
              transparent,
              transparent 14px,
              rgba(100, 80, 55, 0.06) 14px,
              rgba(100, 80, 55, 0.06) 15px
            ),
            repeating-linear-gradient(
              -1deg,
              transparent,
              transparent 28px,
              rgba(90, 70, 45, 0.03) 28px,
              rgba(90, 70, 45, 0.03) 29px
            )
          `,
        }}
      />
      {/* Rebar shadow grid behind text */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          backgroundImage: `
            repeating-linear-gradient(
              0deg,
              transparent,
              transparent 39px,
              rgba(80, 60, 40, 0.04) 39px,
              rgba(80, 60, 40, 0.04) 41px
            ),
            repeating-linear-gradient(
              90deg,
              transparent,
              transparent 39px,
              rgba(80, 60, 40, 0.04) 39px,
              rgba(80, 60, 40, 0.04) 41px
            )
          `,
        }}
      />
    </div>
  ),

  renderWord: ({
    word,
    color,
    enterProgress,
    holdProgress,
    exitProgress,
    phase,
    width,
    height,
    frame,
    fps,
  }: WordRenderProps) => {
    const chars = word.split('')
    const totalChars = chars.length
    const fontSize = Math.min(width / (totalChars * 0.65), 130)
    const time = frame / fps

    // Fill level: 0 = empty, 1 = full. Text revealed bottom-to-top as concrete rises.
    let fillLevel = 0
    let surfaceRipple = 0
    let drainLevel = 0

    if (phase === 'enter') {
      fillLevel = easeInOutQuart(enterProgress)
      // Surface tension wobble as it fills
      surfaceRipple = Math.sin(enterProgress * Math.PI * 6) * (1 - enterProgress) * 4
    } else if (phase === 'hold') {
      fillLevel = 1
      // Settled concrete breathes very slightly
      surfaceRipple = Math.sin(holdProgress * Math.PI * 2) * 0.8
    } else {
      // Exit: concrete drains downward — cracks and drains from the bottom
      fillLevel = 1 - easeInCubic(exitProgress)
      drainLevel = easeInCubic(exitProgress)
    }

    // Clip reveal: text visible only where concrete has filled
    // Text sits centered; we clip from bottom up
    const containerH = fontSize * 1.3
    const containerTop = height / 2 - containerH / 2
    const concreteTopY = containerTop + containerH * (1 - fillLevel) + surfaceRipple

    // Clip path: reveal from concreteTopY to bottom
    const clipTop = Math.max(0, concreteTopY - containerTop)

    return (
      <div style={{ position: 'absolute', inset: 0 }}>
        {/* Concrete fill slab — the rising liquid */}
        <div
          style={{
            position: 'absolute',
            left: width * 0.1,
            right: width * 0.1,
            bottom: height * 0.2,
            height: containerH + 20,
            overflow: 'hidden',
          }}
        >
          {/* Formwork walls */}
          <div
            style={{
              position: 'absolute',
              inset: 0,
              border: '2px solid rgba(100, 80, 55, 0.2)',
              borderTop: 'none',
              boxSizing: 'border-box',
            }}
          />

          {/* Rising concrete body */}
          {fillLevel > 0.01 && (
            <div
              style={{
                position: 'absolute',
                bottom: 0,
                left: 0,
                right: 0,
                height: `${fillLevel * 100}%`,
                background: `linear-gradient(180deg,
                  rgba(160, 148, 130, 0.18) 0%,
                  rgba(140, 128, 110, 0.10) 40%,
                  rgba(120, 110, 95, 0.06) 100%
                )`,
                transition: 'none',
              }}
            />
          )}

          {/* Concrete surface — wet sheen line */}
          {fillLevel > 0.01 && fillLevel < 0.99 && (
            <div
              style={{
                position: 'absolute',
                bottom: `${fillLevel * 100}%`,
                left: 0,
                right: 0,
                height: 3,
                background: `linear-gradient(90deg,
                  transparent 0%,
                  rgba(200, 190, 170, 0.5) 20%,
                  rgba(220, 210, 190, 0.7) 50%,
                  rgba(200, 190, 170, 0.5) 80%,
                  transparent 100%
                )`,
                transform: `translateY(${surfaceRipple}px)`,
                filter: 'blur(0.5px)',
              }}
            />
          )}
        </div>

        {/* Text — clipped to reveal from bottom-up as concrete fills */}
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            clipPath: `inset(${clipTop}px 0 0 0)`,
            opacity: fillLevel > 0.01 ? 1 : 0,
          }}
        >
          <div
            style={{
              fontFamily: "'Helvetica Neue', 'Arial Black', sans-serif",
              fontSize: `clamp(32px, 10vw, ${fontSize}px)`,
              fontWeight: 900,
              color,
              letterSpacing: '0.04em',
              whiteSpace: 'nowrap',
              textShadow: `0 2px 0 ${color}30`,
              opacity: 1 - drainLevel * 0.6,
            }}
          >
            {word}
          </div>
        </div>

        {/* Pour spout splash at top — only during enter */}
        {phase === 'enter' && enterProgress > 0.05 && enterProgress < 0.7 && (
          <div
            style={{
              position: 'absolute',
              top: height * 0.15,
              left: '50%',
              transform: 'translateX(-50%)',
              width: 4,
              height: `${(height / 2 - containerTop) * (1 - fillLevel) + 8}px`,
              background: `linear-gradient(180deg,
                transparent,
                rgba(160, 148, 130, 0.4),
                rgba(180, 165, 145, 0.6)
              )`,
              borderRadius: 2,
              filter: 'blur(1px)',
              transformOrigin: 'top center',
            }}
          />
        )}

        {/* Set indicator: "WET CONCRETE" badge */}
        <div
          style={{
            position: 'absolute',
            bottom: height * 0.1,
            left: '50%',
            transform: 'translateX(-50%)',
            fontFamily: "'Helvetica Neue', Arial, sans-serif",
            fontSize: 8,
            fontWeight: 700,
            color: `rgba(180, 160, 120, ${phase === 'hold' ? 0.25 : 0.1})`,
            letterSpacing: 4,
            textTransform: 'uppercase',
            whiteSpace: 'nowrap',
          }}
        >
          WET CONCRETE — DO NOT TOUCH
        </div>
      </div>
    )
  },
}

function ConcretePourComponent(props: MotionGraphicProps<ConcretePourConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-concrete-pour',
  title: 'Concrete Pour',
  description:
    'Text is revealed bottom-to-top as liquid concrete fills the formwork from below — viscous fill with a wet surface sheen, pour spout stream, and gravity-drain exit.',
  tags: [
    'kinetic',
    'typography',
    'concrete',
    'pour',
    'construction',
    'fill',
    'reveal',
    'building',
    'formwork',
    'industrial',
  ],
  category: 'captions',
  component: ConcretePourComponent as any,
  defaultConfig: {
    words: ['POUR', 'SET', 'CURE', 'SOLID'],
    colors: ['#E8E0D0', '#D4C8B0', '#E0D6C4', '#F0E8D8'],
    bgColor: '#1C1A16',
    cycleDuration: 1.6,
    concreteColor: '#A09080',
  },
  configSchema: [
    {
      key: 'words',
      label: 'Words',
      type: 'text-array',
      defaultValue: ['POUR', 'SET', 'CURE', 'SOLID'],
      group: 'Content',
    },
    {
      key: 'colors',
      label: 'Colors',
      type: 'text-array',
      defaultValue: ['#E8E0D0', '#D4C8B0', '#E0D6C4', '#F0E8D8'],
      group: 'Style',
    },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#1C1A16', group: 'Style' },
    {
      key: 'cycleDuration',
      label: 'Cycle Duration (s)',
      type: 'number',
      defaultValue: 1.6,
      min: 0.5,
      max: 5,
      group: 'Timing',
    },
    {
      key: 'concreteColor',
      label: 'Concrete Color',
      type: 'color',
      defaultValue: '#A09080',
      group: 'Style',
    },
  ],
})
