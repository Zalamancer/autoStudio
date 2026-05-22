import { registerMotionGraphic } from '../registry'
import {
  KineticBase,
  type KineticBaseConfig,
  type KineticAnimation,
  type WordRenderProps,
  type BackgroundRenderProps,
} from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface GlassBlockConfig extends KineticBaseConfig {}

function easeOutExpo(t: number): number {
  return t === 1 ? 1 : 1 - Math.pow(2, -10 * t)
}

function easeOutBack(t: number): number {
  const c1 = 1.70158
  const c3 = c1 + 1
  return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2)
}

const animation: KineticAnimation = {
  renderBackground: ({ bgColor }: BackgroundRenderProps) => (
    <div style={{ position: 'absolute', inset: 0, background: bgColor }}>
      {/* Subtle frosted glass texture */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          backgroundImage:
            'repeating-linear-gradient(0deg, transparent, transparent 40px, rgba(255,255,255,0.015) 40px, rgba(255,255,255,0.015) 41px)',
        }}
      />
    </div>
  ),

  renderWord: ({ word, color, enterProgress, exitProgress, phase, frame }: WordRenderProps) => {
    const time = (frame ?? 0) / 30
    const eased = easeOutExpo(Math.min(enterProgress, 1))
    const backEased = easeOutBack(Math.min(enterProgress, 1))

    // Glass block slides in — text seen through thick glass is offset/distorted
    const slideIn = phase === 'enter' ? backEased : 1
    const slideOut = phase === 'exit' ? easeOutExpo(exitProgress) : 0

    // Glass thickness refractive offset — text appears horizontally shifted and split
    const glassOffset =
      phase === 'hold' ? 4 + Math.sin(time * 1.8) * 1.5 : phase === 'enter' ? (1 - eased) * 28 + 4 : 4 + slideOut * 24

    // Opacity
    const opacity =
      phase === 'enter' ? Math.min(1, enterProgress * 3) : phase === 'exit' ? Math.max(0, 1 - exitProgress * 2) : 1
    const translateY = phase === 'exit' ? slideOut * -30 : 0

    // Glass panel scale
    const panelScale = phase === 'enter' ? 0.7 + slideIn * 0.3 : 1

    return (
      <div
        style={{
          position: 'absolute',
          inset: 0,
          opacity,
        }}
      >
        {/* Glass panel — semi-transparent block */}
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: `translate(-50%, calc(-50% + ${translateY}px)) scale(${panelScale})`,
            padding: '16px 32px',
            background: 'rgba(200,230,255,0.06)',
            border: '1px solid rgba(200,230,255,0.2)',
            borderRadius: 4,
            backdropFilter: 'blur(2px)',
          }}
        >
          {/* Primary text — slightly offset due to refraction */}
          <div
            style={{
              fontFamily: "'Inter', 'Helvetica Neue', sans-serif",
              fontSize: 'clamp(44px, 13vw, 170px)',
              fontWeight: 800,
              color,
              whiteSpace: 'nowrap',
              letterSpacing: '0.04em',
              textTransform: 'uppercase',
              transform: `translateX(${glassOffset * 0.5}px)`,
              position: 'relative',
              zIndex: 2,
            }}
          >
            {word}
          </div>

          {/* Secondary ghost — refracted "copy" offset in opposite direction */}
          <div
            style={{
              fontFamily: "'Inter', 'Helvetica Neue', sans-serif",
              fontSize: 'clamp(44px, 13vw, 170px)',
              fontWeight: 800,
              color,
              whiteSpace: 'nowrap',
              letterSpacing: '0.04em',
              textTransform: 'uppercase',
              transform: `translateX(${-glassOffset * 0.5}px)`,
              position: 'absolute',
              top: '16px',
              left: '32px',
              zIndex: 1,
              opacity: 0.18,
              filter: 'blur(1px)',
            }}
          >
            {word}
          </div>
        </div>

        {/* Glass edge highlight — top edge */}
        <div
          style={{
            position: 'absolute',
            top: 'calc(50% - 2px)',
            left: '15%',
            right: '15%',
            height: 2,
            background: `linear-gradient(90deg, transparent, rgba(200,240,255,${0.35 + Math.sin(time * 2) * 0.1}), transparent)`,
            transform: `translateY(calc(-50% - clamp(28px, 8vw, 100px)))`,
            opacity: panelScale,
          }}
        />
      </div>
    )
  },
}

function GlassBlockComponent(props: MotionGraphicProps<GlassBlockConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-glass-block',
  title: 'Kinetic Glass Block',
  description:
    'Text appears through a thick glass block — refractive offset splits the text into primary and ghost copies that converge as glass clarity increases',
  tags: ['kinetic', 'typography', 'glass', 'refraction', 'optical', 'block', 'lens', 'frosted'],
  category: 'captions',
  component: GlassBlockComponent as any,
  defaultConfig: {
    words: ['CLEAR', 'GLASS', 'LENS', 'VIEW'],
    colors: ['#C0E8FF', '#A0D4F4', '#E0F4FF', '#80C8EE'],
    bgColor: '#060C14',
    cycleDuration: 1.5,
  },
  configSchema: [
    {
      key: 'words',
      label: 'Words',
      type: 'text-array',
      defaultValue: ['CLEAR', 'GLASS', 'LENS', 'VIEW'],
      group: 'Content',
    },
    { key: 'colors', label: 'Colors', type: 'text-array', defaultValue: ['#C0E8FF', '#A0D4F4'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#060C14', group: 'Style' },
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
