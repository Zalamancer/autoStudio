import { registerMotionGraphic } from '../registry'
import {
  KineticBase,
  type KineticBaseConfig,
  type KineticAnimation,
  type WordRenderProps,
  type BackgroundRenderProps,
} from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface RailTrackConfig extends KineticBaseConfig {}

function easeOutQuint(t: number): number {
  return 1 - Math.pow(1 - t, 5)
}

function easeInQuint(t: number): number {
  return t * t * t * t * t
}

const ROLLER_COUNT = 6

const animation: KineticAnimation = {
  renderBackground: ({ bgColor, width, height }: BackgroundRenderProps) => {
    const railY = height * 0.5
    const rollerSpacing = width / (ROLLER_COUNT - 1)

    return (
      <div style={{ position: 'absolute', inset: 0, background: bgColor }}>
        {/* Top rail */}
        <div
          style={{
            position: 'absolute',
            top: 'calc(50% - clamp(32px, 8vw, 96px))',
            left: 0,
            right: 0,
            height: 'clamp(4px, 1vw, 12px)',
            background: 'linear-gradient(180deg, #aaa 0%, #ccc 40%, #888 100%)',
            boxShadow: '0 2px 8px rgba(0,0,0,0.4)',
          }}
        />
        {/* Bottom rail */}
        <div
          style={{
            position: 'absolute',
            top: 'calc(50% + clamp(28px, 7vw, 84px))',
            left: 0,
            right: 0,
            height: 'clamp(4px, 1vw, 12px)',
            background: 'linear-gradient(180deg, #aaa 0%, #ccc 40%, #888 100%)',
            boxShadow: '0 2px 8px rgba(0,0,0,0.4)',
          }}
        />
        {/* Rail rollers — evenly spaced across full width */}
        {Array.from({ length: ROLLER_COUNT }, (_, i) => (
          <div
            key={i}
            style={{
              position: 'absolute',
              left: i * rollerSpacing - 10,
              top: 'calc(50% - clamp(38px, 9.5vw, 114px))',
              width: 'clamp(14px, 3.5vw, 42px)',
              height: 'clamp(76px, 19vw, 228px)',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            {/* Top roller wheel */}
            <div
              style={{
                width: 'clamp(14px, 3.5vw, 42px)',
                height: 'clamp(14px, 3.5vw, 42px)',
                borderRadius: '50%',
                background: 'radial-gradient(circle at 35% 35%, #ddd, #888)',
                boxShadow: '0 2px 6px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.3)',
                border: '2px solid #666',
              }}
            />
            {/* Axle */}
            <div
              style={{
                width: 'clamp(4px, 1vw, 10px)',
                flex: 1,
                background: 'linear-gradient(90deg, #666, #999, #666)',
                borderRadius: 2,
              }}
            />
            {/* Bottom roller wheel */}
            <div
              style={{
                width: 'clamp(14px, 3.5vw, 42px)',
                height: 'clamp(14px, 3.5vw, 42px)',
                borderRadius: '50%',
                background: 'radial-gradient(circle at 35% 35%, #ddd, #888)',
                boxShadow: '0 2px 6px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.3)',
                border: '2px solid #666',
              }}
            />
          </div>
        ))}
      </div>
    )
  },

  renderWord: ({ word, color, enterProgress, exitProgress, phase, width }: WordRenderProps) => {
    let slideX = 0
    let opacity = 1

    if (phase === 'enter') {
      const eased = easeOutQuint(enterProgress)
      slideX = -(1 - eased) * width * 0.85
    } else if (phase === 'hold') {
      slideX = 0
    } else {
      const eased = easeInQuint(exitProgress)
      slideX = eased * width * 0.85
      opacity = 1 - Math.pow(exitProgress, 2)
    }

    return (
      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: `translate(-50%, -50%) translateX(${slideX}px)`,
          opacity,
          display: 'flex',
          alignItems: 'center',
          gap: 'clamp(6px, 1.5vw, 18px)',
        }}
      >
        {/* Left clamp bracket */}
        <div
          style={{
            width: 'clamp(6px, 1.5vw, 18px)',
            height: 'clamp(44px, 11vw, 132px)',
            background: 'linear-gradient(90deg, #888, #bbb, #888)',
            borderRadius: '3px 0 0 3px',
            boxShadow: '-2px 0 8px rgba(0,0,0,0.4)',
            flexShrink: 0,
          }}
        />

        {/* Text panel riding on the rails */}
        <span
          style={{
            fontFamily: "'Inter', 'Helvetica Neue', Arial, sans-serif",
            fontSize: 'clamp(36px, 9vw, 120px)',
            fontWeight: 800,
            color,
            textTransform: 'uppercase',
            letterSpacing: 4,
            whiteSpace: 'nowrap',
            textShadow: `0 2px 10px ${color}50`,
          }}
        >
          {word}
        </span>

        {/* Right clamp bracket */}
        <div
          style={{
            width: 'clamp(6px, 1.5vw, 18px)',
            height: 'clamp(44px, 11vw, 132px)',
            background: 'linear-gradient(90deg, #888, #bbb, #888)',
            borderRadius: '0 3px 3px 0',
            boxShadow: '2px 0 8px rgba(0,0,0,0.4)',
            flexShrink: 0,
          }}
        />
      </div>
    )
  },
}

function RailTrackComponent(props: MotionGraphicProps<RailTrackConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-rail-track',
  title: 'Kinetic Rail Track',
  description:
    'Text glides in on a rail system with evenly-spaced roller wheels on top and bottom guide rails. Bracket clamps hold the text panel as it slides smoothly into position.',
  tags: ['kinetic', 'typography', 'rail', 'track', 'roller', 'slide', 'mechanical', 'industrial'],
  category: 'captions',
  component: RailTrackComponent as any,
  defaultConfig: {
    words: ['TRACK', 'GLIDE', 'RAIL', 'SLIDE'],
    colors: ['#F5C518', '#18C5F5', '#F518C5', '#18F5A0'],
    bgColor: '#161616',
    cycleDuration: 1.5,
  },
  configSchema: [
    { key: 'words', label: 'Words', type: 'text-array', defaultValue: ['TRACK', 'GLIDE', 'RAIL', 'SLIDE'], group: 'Content' },
    { key: 'colors', label: 'Colors', type: 'text-array', defaultValue: ['#F5C518', '#18C5F5', '#F518C5', '#18F5A0'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#161616', group: 'Style' },
    { key: 'cycleDuration', label: 'Cycle Duration (s)', type: 'number', defaultValue: 1.5, min: 0.5, max: 5, group: 'Timing' },
  ],
})
