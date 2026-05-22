import { registerMotionGraphic } from '../registry'
import { KineticBase, type KineticBaseConfig, type KineticAnimation, type WordRenderProps, type BackgroundRenderProps } from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface UtilityMarkConfig extends KineticBaseConfig {}

/** Deterministic pseudo-random 0..1 from integer seed */
function rand(s: number): number {
  const x = Math.sin(s * 127.1 + 311.7) * 43758.5453
  return x - Math.floor(x)
}

const animation: KineticAnimation = {
  renderBackground: ({ bgColor }: BackgroundRenderProps) => (
    <div style={{ position: 'absolute', inset: 0, background: bgColor }}>
      {/* Ground surface — dirt/pavement mix */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          backgroundImage: [
            'radial-gradient(circle 1px, rgba(0,0,0,0.06) 0%, transparent 100%)',
            'radial-gradient(circle 0.5px, rgba(100,80,50,0.04) 0%, transparent 100%)',
          ].join(', '),
          backgroundSize: '4px 4px, 6px 6px',
        }}
      />

      {/* Curb edge */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: 8,
          background: 'linear-gradient(180deg, rgba(140,135,125,0.4), rgba(100,95,85,0.2))',
        }}
      />

      {/* Pre-existing utility marks — old faded lines */}
      <div
        style={{
          position: 'absolute',
          top: '25%',
          left: '10%',
          width: 60,
          height: 3,
          background: 'rgba(255,165,0,0.08)',
          transform: 'rotate(-5deg)',
        }}
      />
      <div
        style={{
          position: 'absolute',
          top: '70%',
          left: '60%',
          width: 45,
          height: 3,
          background: 'rgba(0,100,255,0.06)',
          transform: 'rotate(8deg)',
        }}
      />

      {/* Arrow marking — utility direction indicator */}
      <div
        style={{
          position: 'absolute',
          bottom: '20%',
          right: '15%',
          width: 0,
          height: 0,
          borderLeft: '8px solid transparent',
          borderRight: '8px solid transparent',
          borderBottom: '14px solid rgba(255,100,50,0.12)',
          transform: 'rotate(-45deg)',
        }}
      />

      {/* Small "811" call number — standard utility marking */}
      <div
        style={{
          position: 'absolute',
          bottom: '10%',
          left: '8%',
          fontFamily: "'Arial', sans-serif",
          fontSize: 11,
          fontWeight: 700,
          color: 'rgba(255,165,0,0.15)',
        }}
      >
        811
      </div>

      {/* Grass/dirt edge */}
      <div
        style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          height: '12%',
          background: 'linear-gradient(0deg, rgba(60,80,40,0.15) 0%, transparent 100%)',
        }}
      />

      {/* Pebbles / small rocks */}
      {Array.from({ length: 6 }, (_, i) => {
        const ps = i * 67 + 11
        return (
          <div
            key={i}
            style={{
              position: 'absolute',
              left: `${15 + rand(ps) * 70}%`,
              top: `${20 + rand(ps + 1) * 60}%`,
              width: 3 + rand(ps + 2) * 4,
              height: 2 + rand(ps + 3) * 3,
              borderRadius: '50%',
              background: `rgba(${100 + rand(ps + 4) * 60}, ${90 + rand(ps + 5) * 50}, ${70 + rand(ps + 6) * 40}, 0.15)`,
            }}
          />
        )
      })}
    </div>
  ),

  renderWord: ({ word, color, enterProgress, exitProgress, phase, holdProgress, index, frame }: WordRenderProps) => {
    const seed = index * 89 + 43
    const f = frame ?? 0

    // Utility marking colors cycle: orange (gas), blue (water), green (sewer), red (electric)
    const utilityColors = ['#ff6600', '#0066ff', '#00cc44', '#ff2222']
    const utilityColor = utilityColors[index % utilityColors.length]

    // Spray appears with overspray scatter
    let sprayProgress = 0
    let opacity = 1
    let oversprayIntensity = 0

    if (phase === 'enter') {
      sprayProgress = enterProgress
      opacity = 1
      oversprayIntensity = Math.min(1, enterProgress * 2)
    } else if (phase === 'hold') {
      sprayProgress = 1
      opacity = 1
      oversprayIntensity = 1
    } else {
      sprayProgress = 1
      opacity = 1 - exitProgress * 0.6
      oversprayIntensity = 1 - exitProgress
    }

    // Overspray scatter dots — fluorescent paint particles
    const scatterCount = 20
    const scatterDots = Array.from({ length: scatterCount }, (_, i) => {
      const ss = seed + i * 19 + 100
      const angle = rand(ss) * Math.PI * 2
      const dist = 30 + rand(ss + 1) * 120
      const size = 1 + rand(ss + 2) * 4
      const dotOpacity = 0.2 + rand(ss + 3) * 0.4
      const dotDelay = rand(ss + 4) * 0.7

      const dotVis = Math.max(0, Math.min(1, (sprayProgress - dotDelay) / (1 - dotDelay)))

      return (
        <div
          key={i}
          style={{
            position: 'absolute',
            left: `calc(50% + ${Math.cos(angle) * dist}px)`,
            top: `calc(50% + ${Math.sin(angle) * dist}px)`,
            width: size,
            height: size,
            borderRadius: '50%',
            background: color,
            opacity: dotOpacity * dotVis * oversprayIntensity,
          }}
        />
      )
    })

    // Direction line — drawn before/after text (utility marking convention)
    const lineProgress = phase === 'enter' ? Math.max(0, enterProgress * 1.5 - 0.3) : 1

    // Abbreviation label — utility code near the text
    const utilityLabels = ['GAS', 'WTR', 'SWR', 'ELEC']
    const label = utilityLabels[index % utilityLabels.length]

    return (
      <div style={{ position: 'absolute', inset: 0, opacity }}>
        {/* Overspray scatter */}
        {scatterDots}

        {/* Direction arrow line */}
        <div
          style={{
            position: 'absolute',
            top: '42%',
            left: '10%',
            width: `${80 * lineProgress}%`,
            height: 4,
            background: `linear-gradient(90deg, ${color}80, ${color}, ${color}80)`,
            borderRadius: 2,
            clipPath: `inset(0 ${(1 - lineProgress) * 100}% 0 0)`,
          }}
        />

        {/* Arrow head at end of line */}
        {lineProgress > 0.8 && (
          <div
            style={{
              position: 'absolute',
              top: '40%',
              right: '8%',
              width: 0,
              height: 0,
              borderTop: '8px solid transparent',
              borderBottom: '8px solid transparent',
              borderLeft: `12px solid ${color}`,
              opacity: (lineProgress - 0.8) * 5,
            }}
          />
        )}

        {/* Main fluorescent text */}
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            fontFamily: "'Impact', 'Arial Black', sans-serif",
            fontSize: 'clamp(46px, 13vw, 170px)',
            fontWeight: 900,
            textTransform: 'uppercase',
            letterSpacing: 6,
            color,
            whiteSpace: 'nowrap',
            // Fluorescent spray paint glow
            textShadow: `0 0 8px ${color}80, 0 0 16px ${color}40, 0 0 2px ${color}`,
            clipPath: sprayProgress < 1
              ? `inset(0 ${(1 - sprayProgress) * 60}% 0 ${(1 - sprayProgress) * 20}%)`
              : 'none',
            opacity: 0.95,
          }}
        >
          {word}
        </div>

        {/* Utility abbreviation label */}
        <div
          style={{
            position: 'absolute',
            bottom: '28%',
            left: '50%',
            transform: 'translateX(-50%)',
            fontFamily: "'Arial', 'Helvetica', sans-serif",
            fontSize: 'clamp(12px, 3vw, 24px)',
            fontWeight: 700,
            color,
            letterSpacing: 4,
            textTransform: 'uppercase',
            opacity: sprayProgress > 0.6 ? (sprayProgress - 0.6) * 2.5 : 0,
            textShadow: `0 0 4px ${color}60`,
          }}
        >
          {label}
        </div>

        {/* Depth measurement annotation */}
        <div
          style={{
            position: 'absolute',
            top: '25%',
            right: '20%',
            fontFamily: "'Arial', sans-serif",
            fontSize: 'clamp(10px, 2vw, 16px)',
            fontWeight: 700,
            color,
            opacity: sprayProgress > 0.7 ? (sprayProgress - 0.7) * 3 : 0,
            textShadow: `0 0 3px ${color}40`,
          }}
        >
          24&quot;
        </div>
      </div>
    )
  },
}

function UtilityMarkComponent(props: MotionGraphicProps<UtilityMarkConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-utility-mark',
  title: 'Kinetic Utility Mark',
  description: 'Underground utility marking in fluorescent spray paint — orange/blue/green/red markings on ground surface with direction arrows, depth annotations, and overspray scatter',
  tags: ['kinetic', 'typography', 'utility', 'marking', 'fluorescent', 'spray', 'urban', 'underground', 'survey'],
  category: 'captions',
  component: UtilityMarkComponent as any,
  defaultConfig: {
    words: ['GAS', 'PIPE', 'LINE', 'DIG'],
    colors: ['#ff6600', '#0088ff', '#00dd44', '#ff3333'],
    bgColor: '#5a5550',
    cycleDuration: 1.3,
  },
  configSchema: [
    { key: 'words', label: 'Words', type: 'text-array', defaultValue: ['GAS', 'PIPE', 'LINE', 'DIG'], group: 'Content' },
    { key: 'colors', label: 'Colors', type: 'text-array', defaultValue: ['#ff6600', '#0088ff', '#00dd44', '#ff3333'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#5a5550', group: 'Style' },
    { key: 'cycleDuration', label: 'Cycle Duration (s)', type: 'number', defaultValue: 1.3, min: 0.3, max: 5, group: 'Timing' },
  ],
})
