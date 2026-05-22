import { registerMotionGraphic } from '../registry'
import { KineticBase, type KineticBaseConfig, type KineticAnimation, type WordRenderProps, type BackgroundRenderProps } from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface RollerTagConfig extends KineticBaseConfig {}

/** Deterministic pseudo-random 0..1 from integer seed */
function rand(s: number): number {
  const x = Math.sin(s * 127.1 + 311.7) * 43758.5453
  return x - Math.floor(x)
}

const animation: KineticAnimation = {
  renderBackground: ({ bgColor }: BackgroundRenderProps) => (
    <div style={{ position: 'absolute', inset: 0, background: bgColor }}>
      {/* Brick wall pattern */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          backgroundImage: [
            'repeating-linear-gradient(0deg, transparent, transparent 24px, rgba(0,0,0,0.12) 24px, rgba(0,0,0,0.12) 25px)',
            'repeating-linear-gradient(90deg, transparent, transparent 50px, rgba(0,0,0,0.06) 50px, rgba(0,0,0,0.06) 51px)',
          ].join(', '),
        }}
      />
      {/* Offset alternate rows to simulate brick stagger */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          backgroundImage: 'repeating-linear-gradient(90deg, transparent, transparent 25px, rgba(0,0,0,0.05) 25px, rgba(0,0,0,0.05) 26px)',
          backgroundSize: '51px 50px',
          backgroundPosition: '25px 25px',
        }}
      />
      {/* Grime and aging */}
      <div
        style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          height: '30%',
          background: 'linear-gradient(0deg, rgba(0,0,0,0.1) 0%, transparent 100%)',
        }}
      />
      {/* Water stain */}
      <div
        style={{
          position: 'absolute',
          top: '5%',
          left: '60%',
          width: '20%',
          height: '50%',
          background: 'linear-gradient(180deg, rgba(0,0,0,0.05), transparent)',
          borderRadius: '0 0 50% 50%',
        }}
      />
    </div>
  ),

  renderWord: ({ word, color, enterProgress, exitProgress, phase, holdProgress, index, width }: WordRenderProps) => {
    const seed = index * 83 + 19

    // Paint roller wipes left to right
    let rollProgress = 0
    let opacity = 1
    let dripProgress = 0

    if (phase === 'enter') {
      rollProgress = enterProgress
      opacity = 1
      dripProgress = 0
    } else if (phase === 'hold') {
      rollProgress = 1
      opacity = 1
      dripProgress = holdProgress
    } else {
      rollProgress = 1
      opacity = 1 - exitProgress
      dripProgress = 1
    }

    // Roller texture: uneven coverage stripes (vertical roller marks)
    const rollerMarks = Array.from({ length: 14 }, (_, i) => {
      const ms = seed + i * 23
      const xPos = (i / 14) * 100
      const markOpacity = 0.03 + rand(ms) * 0.08
      const markWidth = 2 + rand(ms + 1) * 4

      return (
        <div
          key={i}
          style={{
            position: 'absolute',
            left: `${xPos}%`,
            top: 0,
            bottom: 0,
            width: markWidth,
            background: `rgba(255,255,255,${markOpacity})`,
            pointerEvents: 'none',
          }}
        />
      )
    })

    // Paint drips running down from thick paint
    const dripCount = 5
    const drips = Array.from({ length: dripCount }, (_, i) => {
      const ds = seed + i * 37
      const x = 15 + rand(ds) * 70
      const dripLen = 30 + rand(ds + 1) * 80
      const dripWidth = 3 + rand(ds + 2) * 5
      const dripDelay = rand(ds + 3) * 0.5
      const currentDrip = Math.max(0, Math.min(1, (dripProgress - dripDelay) / (1 - dripDelay)))

      return (
        <div
          key={i}
          style={{
            position: 'absolute',
            left: `${x}%`,
            top: '68%',
            width: dripWidth,
            height: dripLen * currentDrip,
            background: `linear-gradient(180deg, ${color}cc, ${color}60, transparent)`,
            borderRadius: '0 0 3px 3px',
          }}
        />
      )
    })

    // Roller edge splatter
    const splatCount = 6
    const splatters = Array.from({ length: splatCount }, (_, i) => {
      const ss = seed + i * 53 + 200
      const sx = 10 + rand(ss) * 80
      const sy = 30 + rand(ss + 1) * 40
      const sSize = 3 + rand(ss + 2) * 6
      const splatVis = phase === 'enter' ? (enterProgress > 0.5 ? 1 : 0) : phase === 'exit' ? 1 - exitProgress : 1

      return (
        <div
          key={i}
          style={{
            position: 'absolute',
            left: `${sx}%`,
            top: `${sy}%`,
            width: sSize,
            height: sSize,
            borderRadius: '50%',
            background: color,
            opacity: 0.3 * splatVis,
          }}
        />
      )
    })

    return (
      <div style={{ position: 'absolute', inset: 0, opacity }}>
        {/* Thick roller paint background fill — reveals left to right */}
        <div
          style={{
            position: 'absolute',
            top: '30%',
            left: '5%',
            right: '5%',
            height: '40%',
            background: `${color}25`,
            borderRadius: 4,
            clipPath: `inset(0 ${(1 - rollProgress) * 100}% 0 0)`,
          }}
        >
          {rollerMarks}
        </div>

        {/* Main text — revealed by roller wipe left to right */}
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            fontFamily: "'Impact', 'Arial Black', 'Helvetica Neue', sans-serif",
            fontSize: 'clamp(52px, 16vw, 200px)',
            fontWeight: 900,
            textTransform: 'uppercase',
            letterSpacing: 4,
            color,
            whiteSpace: 'nowrap',
            clipPath: `inset(0 ${(1 - rollProgress) * 100}% 0 0)`,
            // Thick paint texture
            textShadow: `1px 1px 0 ${color}80, -1px 0 0 ${color}40, 0 2px 0 ${color}30`,
          }}
        >
          {word}
        </div>

        {/* Roller edge line at the paint front */}
        {rollProgress > 0 && rollProgress < 1 && (
          <div
            style={{
              position: 'absolute',
              top: '28%',
              left: `${5 + rollProgress * 90}%`,
              width: 4,
              height: '44%',
              background: `${color}60`,
              borderRadius: 2,
              filter: 'blur(1px)',
            }}
          />
        )}

        {/* Splatters and drips */}
        {splatters}
        {drips}
      </div>
    )
  },
}

function RollerTagComponent(props: MotionGraphicProps<RollerTagConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-roller-tag',
  title: 'Kinetic Roller Tag',
  description: 'Paint roller tag on brick wall — large text rolled with thick paint, uneven coverage marks, downward drips, and edge splatter',
  tags: ['kinetic', 'typography', 'roller', 'paint', 'graffiti', 'urban', 'bold', 'street', 'tag'],
  category: 'captions',
  component: RollerTagComponent as any,
  defaultConfig: {
    words: ['BOLD', 'ROLL', 'CITY', 'TAGS'],
    colors: ['#1a1a1a', '#d42020', '#1a1a1a', '#d42020'],
    bgColor: '#9b7b5e',
    cycleDuration: 1.3,
  },
  configSchema: [
    { key: 'words', label: 'Words', type: 'text-array', defaultValue: ['BOLD', 'ROLL', 'CITY', 'TAGS'], group: 'Content' },
    { key: 'colors', label: 'Colors', type: 'text-array', defaultValue: ['#1a1a1a', '#d42020', '#1a1a1a', '#d42020'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#9b7b5e', group: 'Style' },
    { key: 'cycleDuration', label: 'Cycle Duration (s)', type: 'number', defaultValue: 1.3, min: 0.3, max: 5, group: 'Timing' },
  ],
})
