import { registerMotionGraphic } from '../registry'
import {
  KineticBase,
  type KineticBaseConfig,
  type KineticAnimation,
  type WordRenderProps,
  type BackgroundRenderProps,
} from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface PaintRollerConfig extends KineticBaseConfig {}

function rand(s: number): number {
  const x = Math.sin(s * 127.1 + 311.7) * 43758.5453
  return x - Math.floor(x)
}

function easeInOutCubic(t: number): number {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2
}

// Paint roller texture — vertical stipple strips simulating roller nap
const ROLLER_STRIPS = Array.from({ length: 18 }, (_, i) => ({
  xPercent: (i / 18) * 100,
  opacity: 0.06 + rand(i * 13) * 0.08,
  width: 2 + rand(i * 7) * 3,
}))

const animation: KineticAnimation = {
  renderBackground: ({ bgColor, width, height }: BackgroundRenderProps) => {
    // Bare wall before paint — shows through to bg, with slight texture
    return (
      <div style={{ position: 'absolute', inset: 0, background: bgColor }}>
        {/* Unpainted wall texture: slight horizontal streaks */}
        {Array.from({ length: 20 }, (_, i) => (
          <div
            key={i}
            style={{
              position: 'absolute',
              left: 0,
              right: 0,
              top: `${i * 5}%`,
              height: 1 + rand(i * 11) * 2,
              background: `rgba(0,0,0,${0.015 + rand(i * 17) * 0.02})`,
            }}
          />
        ))}
      </div>
    )
  },

  renderWord: ({ word, color, enterProgress, holdProgress, exitProgress, phase, index }: WordRenderProps) => {
    const seed = index * 83

    // Roller sweeps left to right — revealed by a moving paint band
    // The roller head is a tall vertical rectangle travelling across
    let rollerX = -10 // percent from left (roller leading edge)
    let textRevealPercent = 0
    let rollerOpacity = 0
    let globalOpacity = 1
    let rollerWidth = 14 // percent width of the roller head

    if (phase === 'enter') {
      const ep = easeInOutCubic(enterProgress)
      // Roller travels from -rollerWidth% to 100%
      rollerX = ep * (100 + rollerWidth) - rollerWidth
      textRevealPercent = Math.max(0, rollerX)
      rollerOpacity = enterProgress < 0.05 ? enterProgress / 0.05 : enterProgress > 0.95 ? (1 - enterProgress) / 0.05 : 1
    } else if (phase === 'hold') {
      rollerX = 110
      textRevealPercent = 100
      rollerOpacity = 0
      globalOpacity = 1
    } else {
      // Exit: roller rolls back right to left, unpainting (reveal % decreases)
      rollerX = 110
      textRevealPercent = 100
      globalOpacity = 1 - exitProgress * exitProgress
    }

    return (
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          opacity: globalOpacity,
        }}
      >
        {/* Painted area — clip reveals text as roller passes */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            bottom: 0,
            width: `${textRevealPercent}%`,
            overflow: 'hidden',
          }}
        >
          {/* Roller texture stripes within the painted band */}
          {ROLLER_STRIPS.map((strip, i) => (
            <div
              key={i}
              style={{
                position: 'absolute',
                top: 0,
                bottom: 0,
                left: `${strip.xPercent}%`,
                width: strip.width,
                background: `rgba(255,255,255,${strip.opacity})`,
              }}
            />
          ))}

          {/* The actual text — visible only in painted region */}
          <div
            style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              fontFamily: "'Arial Black', 'Impact', sans-serif",
              fontSize: 'clamp(52px, 15vw, 175px)',
              fontWeight: 900,
              letterSpacing: 6,
              textTransform: 'uppercase',
              color: bgColor,
              whiteSpace: 'nowrap',
              // Text shows as negative space through the paint
              mixBlendMode: 'multiply' as const,
              opacity: 0,
            }}
          >
            {word}
          </div>

          {/* Painted text — same position, shows as color against the paint band */}
          <div
            style={{
              position: 'absolute',
              top: '50%',
              /* extend width so text is always "inside" the clipped div */
              left: 0,
              right: 0,
              display: 'flex',
              justifyContent: 'center',
              transform: 'translateY(-50%)',
              fontFamily: "'Arial Black', 'Impact', sans-serif",
              fontSize: 'clamp(52px, 15vw, 175px)',
              fontWeight: 900,
              letterSpacing: 6,
              textTransform: 'uppercase',
              color,
              whiteSpace: 'nowrap',
              textShadow: `0 2px 4px rgba(0,0,0,0.2)`,
            }}
          >
            {word}
          </div>
        </div>

        {/* Roller head — cylindrical paint applicator bar */}
        {rollerOpacity > 0.01 && (
          <div
            style={{
              position: 'absolute',
              top: '20%',
              bottom: '20%',
              left: `${rollerX}%`,
              width: `${rollerWidth}%`,
              background: `linear-gradient(90deg,
                ${color}aa 0%,
                ${color} 20%,
                ${color}ee 50%,
                ${color} 80%,
                ${color}bb 100%
              )`,
              opacity: rollerOpacity,
              borderRadius: 4,
              // Roller nap texture
              backgroundImage: `
                linear-gradient(90deg, ${color}aa 0%, ${color} 20%, ${color}ee 50%, ${color} 80%, ${color}bb 100%),
                repeating-linear-gradient(0deg, transparent, transparent 3px, rgba(255,255,255,0.06) 3px, rgba(255,255,255,0.06) 4px)
              `,
              boxShadow: `4px 0 12px ${color}60, -2px 0 8px rgba(0,0,0,0.3)`,
            }}
          />
        )}

        {/* Paint drip at leading edge of roller */}
        {rollerOpacity > 0.3 && (
          <div
            style={{
              position: 'absolute',
              top: '78%',
              left: `calc(${rollerX}% + ${rollerWidth - 1}%)`,
              width: 4,
              height: 18 * rollerOpacity,
              background: `linear-gradient(180deg, ${color}, ${color}30)`,
              borderRadius: '0 0 3px 3px',
              opacity: rollerOpacity * 0.8,
            }}
          />
        )}
      </div>
    )
  },
}

function PaintRollerComponent(props: MotionGraphicProps<PaintRollerConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-paint-roller',
  title: 'Kinetic Paint Roller',
  description:
    'A paint roller sweeps left to right across the canvas, revealing text in fresh paint with visible roller-nap texture and a leading drip.',
  tags: ['kinetic', 'typography', 'paint', 'roller', 'sweep', 'reveal', 'wall', 'coat', 'house'],
  category: 'captions',
  component: PaintRollerComponent as any,
  defaultConfig: {
    words: ['ROLL', 'COAT', 'COVER', 'PAINT'],
    colors: ['#3B82F6', '#10B981', '#F59E0B', '#EF4444'],
    bgColor: '#E8E4DC',
    cycleDuration: 1.6,
  },
  configSchema: [
    { key: 'words', label: 'Words', type: 'text-array', defaultValue: ['ROLL', 'COAT', 'COVER', 'PAINT'], group: 'Content' },
    { key: 'colors', label: 'Colors', type: 'text-array', defaultValue: ['#3B82F6', '#10B981', '#F59E0B', '#EF4444'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#E8E4DC', group: 'Style' },
    { key: 'cycleDuration', label: 'Cycle Duration (s)', type: 'number', defaultValue: 1.6, min: 0.5, max: 6, group: 'Timing' },
  ],
})
