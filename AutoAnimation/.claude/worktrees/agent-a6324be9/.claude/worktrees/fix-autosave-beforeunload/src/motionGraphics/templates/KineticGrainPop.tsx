import { registerMotionGraphic } from '../registry'
import {
  KineticBase,
  type KineticBaseConfig,
  type KineticAnimation,
  type WordRenderProps,
  type BackgroundRenderProps,
} from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface GrainPopConfig extends KineticBaseConfig {
  grainIntensity: number
}

function easeOutSpring(t: number): number {
  // Springy overshoot — lands hot then settles
  const s = 1 - t
  return 1 - s * s * (2.5 * s - 1.5)
}

function easeOutQuart(t: number): number {
  return 1 - Math.pow(1 - t, 4)
}

function easeInQuart(t: number): number {
  return t * t * t * t
}

const animation: KineticAnimation = {
  renderBackground: ({ bgColor, frame, fps }: BackgroundRenderProps) => {
    const t = frame / fps

    return (
      <div style={{ position: 'absolute', inset: 0, background: bgColor }}>
        {/* Static background grain — slightly animated */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='g'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='3' seed='${Math.floor(t * 12) % 30}' stitchTiles='stitch'/%3E%3CfeColorMatrix type='saturate' values='0'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23g)' opacity='1'/%3E%3C/svg%3E")`,
            backgroundSize: '180px 180px',
            opacity: 0.055,
            mixBlendMode: 'overlay',
            pointerEvents: 'none',
          }}
        />
      </div>
    )
  },

  renderWord: ({ word, color, enterProgress, holdProgress, exitProgress, phase, index, frame }: WordRenderProps) => {
    const f = frame ?? 0
    const t = f / 30

    let translateY = 0
    let scale = 1
    let opacity = 0
    let grainOpacity = 0
    let grainSeed = Math.floor(t * 24) % 60 // animated grain seed
    let skewX = 0

    if (phase === 'enter') {
      // Spring pop from below — bouncy, confident
      const sprung = easeOutSpring(Math.min(1, enterProgress * 1.1))
      translateY = (1 - sprung) * 70 // rises from below
      scale = 0.7 + sprung * 0.3 // pops from small to full
      opacity = easeOutQuart(Math.min(1, enterProgress * 2.5))
      // Grain bursts on entry — heavy texture at first, settles
      grainOpacity = Math.max(0, 1 - enterProgress * 1.6) * 0.7
      skewX = (1 - easeOutQuart(enterProgress)) * (index % 2 === 0 ? -4 : 4)
    } else if (phase === 'hold') {
      scale = 1
      opacity = 1
      translateY = Math.sin(holdProgress * Math.PI * 2) * 1.5 // micro-float
      // Grain churns slowly during hold — texture breathes
      grainOpacity = 0.12 + Math.sin(holdProgress * Math.PI * 3) * 0.04
      grainSeed = Math.floor(t * 8) % 60
    } else {
      // Crumble exit: drops, shrinks, fades
      const ep = easeInQuart(exitProgress)
      translateY = ep * 60
      scale = 1 - ep * 0.35
      opacity = 1 - ep
      grainOpacity = ep * 0.5
    }

    const grainUrl = `url("data:image/svg+xml,%3Csvg viewBox='0 0 120 120' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='gr'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.75' numOctaves='4' seed='${grainSeed}' stitchTiles='stitch'/%3E%3CfeColorMatrix type='saturate' values='0'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23gr)'/%3E%3C/svg%3E")`

    return (
      <div style={{ position: 'absolute', inset: 0, overflow: 'hidden' }}>
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: `translate(-50%, -50%) translateY(${translateY}px) scale(${scale}) skewX(${skewX}deg)`,
            opacity,
          }}
        >
          {/* Text layer */}
          <div
            style={{
              fontFamily: "'Arial Black', 'Helvetica Neue', sans-serif",
              fontSize: 'clamp(38px, 12vw, 152px)',
              fontWeight: 900,
              color,
              whiteSpace: 'nowrap',
              letterSpacing: '0.02em',
              textTransform: 'uppercase',
              textShadow: `1px 2px 0px ${color}40, -1px -1px 0px ${color}20`,
              position: 'relative',
            }}
          >
            {word}

            {/* Grain overlay clipped to text bounding box */}
            {grainOpacity > 0.01 && (
              <div
                style={{
                  position: 'absolute',
                  inset: '-4px',
                  backgroundImage: grainUrl,
                  backgroundSize: '120px 120px',
                  opacity: grainOpacity,
                  mixBlendMode: 'overlay',
                  pointerEvents: 'none',
                  borderRadius: 2,
                }}
              />
            )}
          </div>

          {/* Color grain haze — warm tinted grain for tactile feel */}
          {grainOpacity > 0.01 && (
            <div
              style={{
                position: 'absolute',
                inset: '-8px',
                backgroundImage: grainUrl,
                backgroundSize: '90px 90px',
                backgroundPosition: '20px 10px',
                opacity: grainOpacity * 0.5,
                mixBlendMode: 'color-burn',
                pointerEvents: 'none',
                borderRadius: 4,
              }}
            />
          )}
        </div>
      </div>
    )
  },
}

function GrainPopComponent(props: MotionGraphicProps<GrainPopConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-grain-pop',
  title: 'Grain Pop',
  description:
    'Text springs up from below with a bouncy overshoot, bursting with heavy film grain on entry that settles into a slow-churning texture during hold. Grain crumbles on exit. CSS fractalNoise grain — no canvas.',
  tags: ['kinetic', 'typography', 'grain', 'film', 'texture', 'pop', 'spring', 'tactile', 'noise', 'handcrafted'],
  category: 'captions',
  component: GrainPopComponent as any,
  defaultConfig: {
    words: ['RAW', 'GRAIN', 'FILM', 'REAL'],
    colors: ['#E8C547', '#E05C3A', '#4A90D9', '#E8C547'],
    bgColor: '#1C1510',
    cycleDuration: 1.4,
    grainIntensity: 0.6,
  },
  configSchema: [
    {
      key: 'words',
      label: 'Words',
      type: 'text-array',
      defaultValue: ['RAW', 'GRAIN', 'FILM', 'REAL'],
      group: 'Content',
    },
    {
      key: 'colors',
      label: 'Colors',
      type: 'text-array',
      defaultValue: ['#E8C547', '#E05C3A', '#4A90D9', '#E8C547'],
      group: 'Style',
    },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#1C1510', group: 'Style' },
    {
      key: 'cycleDuration',
      label: 'Cycle Duration (s)',
      type: 'number',
      defaultValue: 1.4,
      min: 0.4,
      max: 5,
      group: 'Timing',
    },
    {
      key: 'grainIntensity',
      label: 'Grain Intensity',
      type: 'number',
      defaultValue: 0.6,
      min: 0.1,
      max: 1.0,
      group: 'Animation',
    },
  ],
})
