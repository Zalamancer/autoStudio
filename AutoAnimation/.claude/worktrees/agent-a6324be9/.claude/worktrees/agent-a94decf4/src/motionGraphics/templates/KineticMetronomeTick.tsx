import { registerMotionGraphic } from '../registry'
import {
  KineticBase,
  type KineticBaseConfig,
  type KineticAnimation,
  type WordRenderProps,
  type BackgroundRenderProps,
} from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface MetronomeTickConfig extends KineticBaseConfig {
  casingColor: string
  pendulumColor: string
}

function easeOutBack(t: number): number {
  const c1 = 1.70158
  const c3 = c1 + 1
  return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2)
}

const animation: KineticAnimation = {
  renderBackground: ({ bgColor, width, height, frame, fps }: BackgroundRenderProps) => {
    const time = frame / fps
    const casingW = Math.min(width * 0.28, 200)
    const casingH = Math.min(height * 0.65, 450)
    const casingX = width / 2
    const casingY = height * 0.52

    // Pendulum swing: smooth sinusoidal motion at ~100 BPM
    const swingAngle = 30 * Math.sin(time * Math.PI * 1.67)
    const armLength = casingH * 0.52

    // Tick mark flash
    const tickSide = Math.sin(time * Math.PI * 1.67) > 0 ? 'right' : 'left'
    const tickIntensity = Math.abs(Math.cos(time * Math.PI * 1.67))

    return (
      <div style={{ position: 'absolute', inset: 0, background: bgColor }}>
        {/* Subtle gradient ambiance */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: 'radial-gradient(ellipse at 50% 60%, rgba(180,140,80,0.06) 0%, transparent 60%)',
          }}
        />

        {/* Metronome casing - tapered trapezoid */}
        <div
          style={{
            position: 'absolute',
            left: casingX - casingW / 2,
            top: casingY - casingH / 2,
            width: casingW,
            height: casingH,
            background: 'linear-gradient(170deg, #5C3D2E 0%, #3E2518 50%, #2C1810 100%)',
            clipPath: 'polygon(20% 0%, 80% 0%, 100% 100%, 0% 100%)',
            borderRadius: '4px 4px 2px 2px',
            boxShadow: '4px 6px 24px rgba(0,0,0,0.5), inset 1px 1px 0 rgba(255,255,255,0.05)',
          }}
        >
          {/* Wood grain lines */}
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              style={{
                position: 'absolute',
                left: `${15 + i * 12}%`,
                top: 0,
                bottom: 0,
                width: 1,
                background: `rgba(255,220,160,${0.03 + (i % 2) * 0.02})`,
              }}
            />
          ))}

          {/* Scale plate */}
          <div
            style={{
              position: 'absolute',
              top: '8%',
              left: '25%',
              right: '25%',
              height: '25%',
              background: 'linear-gradient(to bottom, #C8A96E, #B8954A)',
              borderRadius: 3,
              boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.3)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {/* Tempo markings */}
            {['Presto', 'Allegro', 'Andante', 'Adagio'].map((mark, i) => (
              <div
                key={mark}
                style={{
                  fontSize: Math.max(casingW * 0.06, 6),
                  color: '#3E2518',
                  fontFamily: "'Georgia', serif",
                  fontStyle: 'italic',
                  lineHeight: 1.6,
                  opacity: 0.7,
                }}
              >
                {mark}
              </div>
            ))}
          </div>

          {/* Pivot point */}
          <div
            style={{
              position: 'absolute',
              top: '36%',
              left: '50%',
              width: 10,
              height: 10,
              borderRadius: '50%',
              background: '#C8A96E',
              transform: 'translate(-50%, -50%)',
              boxShadow: '0 1px 3px rgba(0,0,0,0.4)',
              zIndex: 5,
            }}
          />

          {/* Pendulum arm */}
          <div
            style={{
              position: 'absolute',
              top: '36%',
              left: '50%',
              width: 4,
              height: armLength,
              background: 'linear-gradient(to bottom, #C8A96E, #A07838)',
              transformOrigin: 'top center',
              transform: `translateX(-50%) rotate(${swingAngle}deg)`,
              borderRadius: 2,
              zIndex: 4,
            }}
          >
            {/* Weight slider */}
            <div
              style={{
                position: 'absolute',
                top: '35%',
                left: '50%',
                transform: 'translateX(-50%)',
                width: 18,
                height: 12,
                background: 'linear-gradient(to bottom, #D4A843, #B8912E)',
                borderRadius: 2,
                boxShadow: '0 1px 2px rgba(0,0,0,0.3)',
              }}
            />

            {/* Bob at bottom */}
            <div
              style={{
                position: 'absolute',
                bottom: -6,
                left: '50%',
                transform: 'translateX(-50%)',
                width: 14,
                height: 14,
                borderRadius: '50%',
                background: 'radial-gradient(circle at 40% 35%, #D4A843, #8B6914)',
                boxShadow: '0 2px 6px rgba(0,0,0,0.3)',
              }}
            />
          </div>
        </div>

        {/* Tick flash indicators */}
        <div
          style={{
            position: 'absolute',
            left: tickSide === 'left' ? casingX - casingW * 0.7 : casingX + casingW * 0.4,
            top: casingY - casingH * 0.12,
            width: casingW * 0.25,
            height: 2,
            background: `rgba(200,169,110,${tickIntensity * 0.4})`,
            borderRadius: 1,
          }}
        />
      </div>
    )
  },

  renderWord: ({
    word,
    color,
    enterProgress,
    exitProgress,
    phase,
    width,
    height,
    frame = 0,
  }: WordRenderProps) => {
    const time = frame / 30
    const swingAngle = 8 * Math.sin(time * Math.PI * 1.67)

    let opacity = 1
    let scale = 1
    let translateX = 0

    if (phase === 'enter') {
      const eased = easeOutBack(enterProgress)
      opacity = Math.min(1, enterProgress * 3)
      scale = 0.5 + 0.5 * eased
      // Text swings in from side matching pendulum
      translateX = (1 - eased) * width * 0.15 * (Math.sin(time * Math.PI) > 0 ? 1 : -1)
    } else if (phase === 'hold') {
      // Gentle sway matching pendulum
      translateX = swingAngle * 0.8
    } else {
      opacity = 1 - exitProgress
      scale = 1 - 0.3 * exitProgress
      translateX = exitProgress * width * 0.12 * (Math.sin(time * Math.PI) > 0 ? -1 : 1)
    }

    return (
      <div
        style={{
          position: 'absolute',
          top: '48%',
          left: '50%',
          transform: `translate(calc(-50% + ${translateX}px), -50%) scale(${scale})`,
          opacity,
          fontSize: 'clamp(36px, 9vw, 120px)',
          fontWeight: 700,
          color,
          whiteSpace: 'nowrap',
          fontFamily: "'Georgia', 'Palatino', 'Times New Roman', serif",
          letterSpacing: '0.08em',
          textShadow: '0 3px 16px rgba(0,0,0,0.5)',
          zIndex: 10,
        }}
      >
        {word}
      </div>
    )
  },
}

function MetronomeTickComponent(props: MotionGraphicProps<MetronomeTickConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-metronome-tick',
  title: 'Kinetic Metronome Tick',
  description:
    'Metronome swing: text appears in sync with a swinging pendulum arm, left-right tick motion with tempo marking and wood casing.',
  tags: ['kinetic', 'music', 'metronome', 'tempo', 'pendulum', 'classical', 'rhythm', 'tick'],
  category: 'captions',
  component: MetronomeTickComponent as any,
  defaultConfig: {
    words: ['TICK', 'TOCK', 'BEAT', 'TIME'],
    colors: ['#F5ECD7', '#E8D9B8', '#D4C49A', '#C8B080'],
    bgColor: '#1A1008',
    cycleDuration: 1.3,
    casingColor: '#3E2518',
    pendulumColor: '#C8A96E',
  },
  configSchema: [
    {
      key: 'words',
      label: 'Words',
      type: 'text-array',
      defaultValue: ['TICK', 'TOCK', 'BEAT', 'TIME'],
      group: 'Content',
    },
    {
      key: 'colors',
      label: 'Colors',
      type: 'text-array',
      defaultValue: ['#F5ECD7', '#E8D9B8', '#D4C49A', '#C8B080'],
      group: 'Style',
    },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#1A1008', group: 'Style' },
    {
      key: 'cycleDuration',
      label: 'Cycle Duration (s)',
      type: 'number',
      defaultValue: 1.3,
      min: 0.3,
      max: 5,
      group: 'Timing',
    },
  ],
})
