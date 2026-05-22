import { registerMotionGraphic } from '../registry'
import {
  KineticBase,
  type KineticBaseConfig,
  type KineticAnimation,
  type WordRenderProps,
  type BackgroundRenderProps,
} from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface ParkingGarageConfig extends KineticBaseConfig {}

/** Deterministic pseudo-random 0..1 */
function rand(s: number): number {
  const x = Math.sin(s * 127.1 + 311.7) * 43758.5453
  return x - Math.floor(x)
}

function easeOutQuad(t: number): number {
  return 1 - (1 - t) * (1 - t)
}

const animation: KineticAnimation = {
  renderBackground: ({ bgColor, width, height, frame, fps }: BackgroundRenderProps) => {
    const time = frame / fps
    // Fluorescent light flicker — subtle periodic dimming
    const flickerCycle = Math.sin(time * 7.3) * 0.5 + Math.sin(time * 13.1) * 0.3
    const flickerIntensity = flickerCycle > 0.6 ? 0.85 : 1

    return (
      <div style={{ position: 'absolute', inset: 0, background: bgColor }}>
        {/* Raw concrete surface */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: 'linear-gradient(180deg, #4a4a48 0%, #3e3e3c 30%, #424240 60%, #3a3a38 100%)',
          }}
        />
        {/* Concrete texture — random spots and aggregate */}
        {Array.from({ length: 20 }, (_, i) => (
          <div
            key={`agg-${i}`}
            style={{
              position: 'absolute',
              left: `${rand(i * 31) * 100}%`,
              top: `${rand(i * 47) * 100}%`,
              width: 3 + rand(i * 67) * 8,
              height: 2 + rand(i * 53) * 6,
              background: `rgba(${80 + rand(i * 11) * 40}, ${80 + rand(i * 23) * 40}, ${78 + rand(i * 37) * 38}, ${0.15 + rand(i * 43) * 0.2})`,
              borderRadius: '50%',
              pointerEvents: 'none',
            }}
          />
        ))}
        {/* Concrete pour lines / form marks */}
        {Array.from({ length: 4 }, (_, i) => (
          <div
            key={`line-${i}`}
            style={{
              position: 'absolute',
              left: 0,
              right: 0,
              top: `${20 + i * 20}%`,
              height: 1,
              background: `rgba(0,0,0,${0.05 + rand(i * 71) * 0.05})`,
              pointerEvents: 'none',
            }}
          />
        ))}
        {/* Concrete pillar — left */}
        <div
          style={{
            position: 'absolute',
            left: '5%',
            top: 0,
            bottom: 0,
            width: '8%',
            background: 'linear-gradient(90deg, #383836 0%, #4a4a48 30%, #444442 70%, #3c3c3a 100%)',
            boxShadow: '4px 0 15px rgba(0,0,0,0.3)',
          }}
        />
        {/* Concrete pillar — right */}
        <div
          style={{
            position: 'absolute',
            right: '5%',
            top: 0,
            bottom: 0,
            width: '8%',
            background: 'linear-gradient(90deg, #3c3c3a 0%, #4a4a48 30%, #444442 70%, #383836 100%)',
            boxShadow: '-4px 0 15px rgba(0,0,0,0.3)',
          }}
        />
        {/* Floor — darker concrete with tire marks */}
        <div
          style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            height: '20%',
            background: 'linear-gradient(180deg, #353533 0%, #2e2e2c 100%)',
          }}
        >
          {/* Tire scuff marks */}
          {Array.from({ length: 3 }, (_, i) => (
            <div
              key={`tire-${i}`}
              style={{
                position: 'absolute',
                left: `${20 + i * 25}%`,
                top: '30%',
                width: 40 + rand(i * 91) * 60,
                height: 3,
                background: `rgba(30,30,28,${0.2 + rand(i * 19) * 0.15})`,
                transform: `rotate(${-2 + rand(i * 77) * 4}deg)`,
                borderRadius: 2,
                filter: 'blur(1px)',
                pointerEvents: 'none',
              }}
            />
          ))}
        </div>
        {/* Fluorescent light fixture at ceiling */}
        <div
          style={{
            position: 'absolute',
            top: '3%',
            left: '25%',
            right: '25%',
            height: 6,
            background: `rgba(255,255,240,${flickerIntensity * 0.7})`,
            boxShadow: `0 0 20px rgba(255,255,240,${flickerIntensity * 0.15}), 0 0 60px rgba(255,255,230,${flickerIntensity * 0.06})`,
            borderRadius: 2,
          }}
        />
        {/* Light cone from fluorescent */}
        <div
          style={{
            position: 'absolute',
            top: '4%',
            left: '20%',
            right: '20%',
            height: '50%',
            background: `linear-gradient(180deg, rgba(255,255,240,${flickerIntensity * 0.04}) 0%, transparent 100%)`,
            clipPath: 'polygon(30% 0%, 70% 0%, 100% 100%, 0% 100%)',
            pointerEvents: 'none',
          }}
        />
        {/* Wayfinding arrows — painted on floor */}
        <div
          style={{
            position: 'absolute',
            bottom: '6%',
            right: '18%',
            width: 0,
            height: 0,
            borderLeft: '12px solid transparent',
            borderRight: '12px solid transparent',
            borderBottom: '20px solid rgba(255,200,0,0.25)',
            transform: 'rotate(-90deg)',
          }}
        />
        <div
          style={{
            position: 'absolute',
            bottom: '6%',
            right: '22%',
            width: 20,
            height: 6,
            background: 'rgba(255,200,0,0.25)',
          }}
        />
      </div>
    )
  },

  renderWord: ({ word, color, enterProgress, exitProgress, phase, index, frame, width, height }: WordRenderProps) => {
    const f = frame ?? 0
    const chars = word.toUpperCase().split('')
    const totalChars = chars.length

    // Fluorescent flicker for the text too
    const time = (f / 30) // approximate
    const textFlicker = Math.sin(time * 11.7) * 0.5 + Math.sin(time * 17.3) * 0.3
    const isFlickering = phase === 'hold' && textFlicker > 0.65

    let stencilOpacity = 0
    let stencilScale = 1

    if (phase === 'enter') {
      // Stencil spray effect — opacity builds up like spray paint
      const eased = easeOutQuad(enterProgress)
      stencilOpacity = eased
      stencilScale = 0.95 + eased * 0.05
    } else if (phase === 'hold') {
      stencilOpacity = isFlickering ? 0.7 : 1
      stencilScale = 1
    } else {
      stencilOpacity = 1 - easeOutQuad(exitProgress)
      stencilScale = 1
    }

    return (
      <div
        style={{
          position: 'absolute',
          top: '48%',
          left: '50%',
          transform: `translate(-50%, -50%) scale(${stencilScale})`,
          opacity: stencilOpacity,
          textAlign: 'center',
        }}
      >
        {/* Large stenciled level number / text */}
        <div
          style={{
            fontFamily: "'Impact', 'Haettenschweiler', 'Arial Narrow', sans-serif",
            fontSize: 'clamp(48px, 16vw, 180px)',
            fontWeight: 900,
            color: color,
            letterSpacing: 8,
            lineHeight: 1,
            textTransform: 'uppercase',
            // Stencil spray paint look — rough edges via text shadow
            textShadow: `
              ${rand(index * 13) * 2 - 1}px ${rand(index * 17) * 2 - 1}px 0 ${color}40,
              0 0 3px ${color}30
            `,
            // Slight paint bleed
            filter: 'blur(0.3px)',
          }}
        >
          {chars.map((ch, ci) => {
            // Each character has slight spray variation
            const sprayOpacity = 0.85 + rand(ci * 31 + index * 7) * 0.15
            return (
              <span
                key={ci}
                style={{
                  display: 'inline-block',
                  opacity: sprayOpacity,
                  // Slight random offset to simulate hand-stenciled imperfection
                  transform: `translate(${(rand(ci * 41) - 0.5) * 2}px, ${(rand(ci * 59) - 0.5) * 2}px)`,
                }}
              >
                {ch}
              </span>
            )
          })}
        </div>
        {/* Directional subtext */}
        <div
          style={{
            marginTop: 4,
            fontFamily: "'Impact', 'Arial Narrow', sans-serif",
            fontSize: 'clamp(12px, 3vw, 24px)',
            fontWeight: 700,
            color: `${color}80`,
            letterSpacing: 6,
            textTransform: 'uppercase',
          }}
        >
          {index % 2 === 0 ? 'PARKING' : 'EXIT'}
        </div>
      </div>
    )
  },
}

function ParkingGarageComponent(props: MotionGraphicProps<ParkingGarageConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-parking-garage',
  title: 'Parking Garage Stencil',
  description:
    'Large stenciled floor level numbers on raw concrete with brutalist pillars, flickering fluorescent lights, tire scuff marks, and wayfinding arrows. Paint spray effect on enter.',
  tags: ['kinetic', 'typography', 'parking', 'garage', 'stencil', 'concrete', 'brutalist', 'signage', 'wayfinding', 'fluorescent'],
  category: 'captions',
  component: ParkingGarageComponent as any,
  defaultConfig: {
    words: ['LEVEL 1', 'LEVEL 2', 'LEVEL 3', 'ROOF'],
    colors: ['#FFD700', '#FFD700', '#FFD700', '#FF4444'],
    bgColor: '#3a3a38',
    cycleDuration: 1.3,
  },
  configSchema: [
    { key: 'words', label: 'Words', type: 'text-array', defaultValue: ['LEVEL 1', 'LEVEL 2', 'LEVEL 3', 'ROOF'], group: 'Content' },
    { key: 'colors', label: 'Colors', type: 'text-array', defaultValue: ['#FFD700', '#FFD700', '#FFD700', '#FF4444'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#3a3a38', group: 'Style' },
    { key: 'cycleDuration', label: 'Cycle Duration (s)', type: 'number', defaultValue: 1.3, min: 0.3, max: 5, group: 'Timing' },
  ],
})
