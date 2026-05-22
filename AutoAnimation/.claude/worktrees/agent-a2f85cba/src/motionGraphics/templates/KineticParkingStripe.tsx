import { registerMotionGraphic } from '../registry'
import { KineticBase, type KineticBaseConfig, type KineticAnimation, type WordRenderProps, type BackgroundRenderProps } from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface ParkingStripeConfig extends KineticBaseConfig {}

/** Deterministic pseudo-random 0..1 from integer seed */
function rand(s: number): number {
  const x = Math.sin(s * 127.1 + 311.7) * 43758.5453
  return x - Math.floor(x)
}

const animation: KineticAnimation = {
  renderBackground: ({ bgColor, frame, fps }: BackgroundRenderProps) => (
    <div style={{ position: 'absolute', inset: 0, background: bgColor }}>
      {/* Asphalt texture — dark aggregate */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          backgroundImage: [
            'radial-gradient(circle 0.8px, rgba(255,255,255,0.04) 0%, transparent 100%)',
            'radial-gradient(circle 0.4px, rgba(0,0,0,0.1) 0%, transparent 100%)',
          ].join(', '),
          backgroundSize: '5px 5px, 3px 3px',
          backgroundPosition: '0 0, 2px 2px',
        }}
      />

      {/* Parking lines — yellow stripes */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: '15%',
          width: 4,
          height: '100%',
          background: 'rgba(210,180,50,0.25)',
        }}
      />
      <div
        style={{
          position: 'absolute',
          top: 0,
          right: '15%',
          width: 4,
          height: '100%',
          background: 'rgba(210,180,50,0.25)',
        }}
      />

      {/* Oil stain */}
      <div
        style={{
          position: 'absolute',
          top: '60%',
          left: '35%',
          width: 80,
          height: 40,
          borderRadius: '50%',
          background: 'radial-gradient(ellipse, rgba(0,0,0,0.12) 0%, transparent 70%)',
          transform: 'rotate(-15deg)',
        }}
      />

      {/* Tire marks */}
      {Array.from({ length: 2 }, (_, i) => (
        <div
          key={i}
          style={{
            position: 'absolute',
            top: 0,
            left: `${40 + i * 20}%`,
            width: 18,
            height: '100%',
            background: `repeating-linear-gradient(0deg, transparent, transparent 12px, rgba(0,0,0,0.04) 12px, rgba(0,0,0,0.04) 14px)`,
            opacity: 0.5,
          }}
        />
      ))}

      {/* Crack in asphalt */}
      <div
        style={{
          position: 'absolute',
          top: '20%',
          left: '55%',
          width: 60,
          height: 1,
          background: 'rgba(0,0,0,0.15)',
          transform: 'rotate(20deg)',
        }}
      />
    </div>
  ),

  renderWord: ({ word, color, enterProgress, exitProgress, phase, holdProgress, index }: WordRenderProps) => {
    const seed = index * 73 + 37

    // Line-striper machine lays paint from left to right
    let stripeProgress = 0
    let opacity = 1
    let wornAmount = 0

    if (phase === 'enter') {
      stripeProgress = enterProgress
      opacity = 1
      wornAmount = 0
    } else if (phase === 'hold') {
      stripeProgress = 1
      opacity = 1
      // Simulate wear developing over hold
      wornAmount = holdProgress * 0.3
    } else {
      stripeProgress = 1
      opacity = 1 - exitProgress * 0.7
      wornAmount = 0.3 + exitProgress * 0.3
    }

    // Worn patches — areas where paint has been driven over
    const wornPatches = Array.from({ length: 5 }, (_, i) => {
      const ws = seed + i * 29 + 200
      const x = 15 + rand(ws) * 70
      const y = 35 + rand(ws + 1) * 30
      const w = 20 + rand(ws + 2) * 40
      const h = 8 + rand(ws + 3) * 15

      return (
        <div
          key={i}
          style={{
            position: 'absolute',
            left: `${x}%`,
            top: `${y}%`,
            width: w,
            height: h,
            borderRadius: '40%',
            background: 'rgba(40,40,38,0.4)',
            opacity: wornAmount,
            filter: 'blur(2px)',
            pointerEvents: 'none',
          }}
        />
      )
    })

    // Road grit embedded in paint
    const gritCount = 8
    const gritSpots = Array.from({ length: gritCount }, (_, i) => {
      const gs = seed + i * 17 + 500
      return (
        <div
          key={i}
          style={{
            position: 'absolute',
            left: `${10 + rand(gs) * 80}%`,
            top: `${38 + rand(gs + 1) * 24}%`,
            width: 2 + rand(gs + 2) * 3,
            height: 2 + rand(gs + 2) * 3,
            borderRadius: '50%',
            background: 'rgba(60,58,55,0.3)',
            opacity: stripeProgress > 0.5 ? 1 : 0,
          }}
        />
      )
    })

    return (
      <div style={{ position: 'absolute', inset: 0, opacity }}>
        {/* Paint base stripe behind text */}
        <div
          style={{
            position: 'absolute',
            top: '35%',
            left: '8%',
            right: '8%',
            height: '30%',
            background: `${color}30`,
            borderRadius: 2,
            clipPath: `inset(0 ${(1 - stripeProgress) * 100}% 0 0)`,
          }}
        />

        {/* Main road marking text — machine-stenciled */}
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            fontFamily: "'Arial Black', 'Impact', 'Helvetica Neue', sans-serif",
            fontSize: 'clamp(50px, 14vw, 180px)',
            fontWeight: 900,
            textTransform: 'uppercase',
            letterSpacing: 12,
            color,
            whiteSpace: 'nowrap',
            // Road paint is slightly textured/uneven
            textShadow: '0 1px 2px rgba(0,0,0,0.4)',
            clipPath: `inset(0 ${(1 - stripeProgress) * 100}% 0 0)`,
          }}
        >
          {word}
        </div>

        {/* Worn tire track across paint */}
        {wornAmount > 0 && (
          <div
            style={{
              position: 'absolute',
              top: '44%',
              left: '30%',
              width: '40%',
              height: 18,
              background: `repeating-linear-gradient(90deg, transparent, transparent 8px, rgba(40,40,38,${wornAmount * 0.5}) 8px, rgba(40,40,38,${wornAmount * 0.5}) 12px)`,
              transform: 'rotate(-2deg)',
              pointerEvents: 'none',
            }}
          />
        )}

        {wornPatches}
        {gritSpots}

        {/* Machine applicator edge at paint front */}
        {stripeProgress > 0 && stripeProgress < 1 && (
          <div
            style={{
              position: 'absolute',
              top: '34%',
              left: `${8 + stripeProgress * 84}%`,
              width: 6,
              height: '32%',
              background: `${color}50`,
              borderRadius: '0 3px 3px 0',
              filter: 'blur(1px)',
            }}
          />
        )}
      </div>
    )
  },
}

function ParkingStripeComponent(props: MotionGraphicProps<ParkingStripeConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-parking-stripe',
  title: 'Kinetic Parking Stripe',
  description: 'Road marking paint on asphalt — text applied by line-striper machine, yellow on dark pavement, tire track wear, oil stains, and embedded grit',
  tags: ['kinetic', 'typography', 'parking', 'road', 'asphalt', 'urban', 'street', 'marking', 'paint'],
  category: 'captions',
  component: ParkingStripeComponent as any,
  defaultConfig: {
    words: ['STOP', 'SLOW', 'ZONE', 'PARK'],
    colors: ['#d4b832', '#d4b832', '#d4b832', '#d4b832'],
    bgColor: '#2a2a28',
    cycleDuration: 1.3,
  },
  configSchema: [
    { key: 'words', label: 'Words', type: 'text-array', defaultValue: ['STOP', 'SLOW', 'ZONE', 'PARK'], group: 'Content' },
    { key: 'colors', label: 'Colors', type: 'text-array', defaultValue: ['#d4b832', '#d4b832', '#d4b832', '#d4b832'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#2a2a28', group: 'Style' },
    { key: 'cycleDuration', label: 'Cycle Duration (s)', type: 'number', defaultValue: 1.3, min: 0.3, max: 5, group: 'Timing' },
  ],
})
