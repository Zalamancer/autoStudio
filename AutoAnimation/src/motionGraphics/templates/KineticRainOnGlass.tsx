import { registerMotionGraphic } from '../registry'
import { KineticBase, type KineticBaseConfig, type KineticAnimation, type WordRenderProps, type BackgroundRenderProps } from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

/**
 * KineticRainOnGlass — Rain streaking down a cold window pane.
 * Letters appear as finger-traces drawn through fogged glass, revealing
 * clarity beneath. Hold phase has gentle condensation drift.
 * Exit smears the letters downward like a palm wiping the glass.
 */

interface RainOnGlassConfig extends KineticBaseConfig {}

/** Deterministic pseudo-random 0..1 from seed */
function rand(s: number): number {
  const x = Math.sin(s * 127.1 + 311.7) * 43758.5453
  return x - Math.floor(x)
}

function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3)
}

function easeInQuart(t: number): number {
  return t * t * t * t
}

/** Viscous drag easing — slow start, fast middle, slow end like a raindrop on glass */
function viscousDrag(t: number): number {
  return t < 0.3
    ? (t / 0.3) * (t / 0.3) * 0.15
    : t < 0.7
      ? 0.15 + ((t - 0.3) / 0.4) * 0.7
      : 0.85 + ((t - 0.7) / 0.3) * 0.15
}

const animation: KineticAnimation = {
  renderBackground: ({ bgColor, width, height, frame, fps }: BackgroundRenderProps) => {
    const t = frame / fps

    // Rain streaks falling down the glass surface
    const streaks: React.ReactNode[] = []
    const numStreaks = 18
    for (let i = 0; i < numStreaks; i++) {
      const sx = width * rand(i * 31 + 5)
      // Each streak has its own speed and start offset
      const speed = 12 + rand(i * 17) * 25
      const startY = -20 + ((t * speed + rand(i * 43) * 200) % (height + 80))
      const streakLen = 15 + rand(i * 29) * 50
      const thickness = 1.2 + rand(i * 37) * 1.5
      const alpha = 0.08 + rand(i * 53) * 0.12

      // Slight horizontal wobble — rain doesn't fall perfectly straight on glass
      const wobble = Math.sin(t * 1.5 + i * 2.1) * 2

      streaks.push(
        <div
          key={`r${i}`}
          style={{
            position: 'absolute',
            left: sx + wobble,
            top: startY,
            width: thickness,
            height: streakLen,
            borderRadius: `${thickness}px`,
            background: `linear-gradient(180deg, transparent, rgba(180, 200, 220, ${alpha * 0.3}), rgba(200, 220, 240, ${alpha}), rgba(180, 200, 220, ${alpha * 0.5}), transparent)`,
          }}
        />,
      )
    }

    // Larger drops that sit on the glass surface, distorting light
    const drops: React.ReactNode[] = []
    const numDrops = 12
    for (let i = 0; i < numDrops; i++) {
      const dx = width * rand(i * 47 + 11)
      const dy = height * rand(i * 59 + 23)
      const size = 3 + rand(i * 67) * 6
      const alpha = 0.1 + rand(i * 41) * 0.15
      // Drops slowly grow with condensation then release
      const growPhase = (t * 0.15 + rand(i * 73) * 10) % 1
      const growScale = growPhase < 0.8 ? 1 + growPhase * 0.3 : 1 + (1 - growPhase) * 1.2

      drops.push(
        <div
          key={`d${i}`}
          style={{
            position: 'absolute',
            left: dx - (size * growScale) / 2,
            top: dy - (size * growScale) / 2,
            width: size * growScale,
            height: size * growScale * (1 + rand(i * 19) * 0.2),
            borderRadius: '50%',
            background: `radial-gradient(circle at 35% 30%, rgba(220, 235, 250, ${alpha + 0.1}), rgba(160, 190, 220, ${alpha}) 60%, rgba(120, 150, 180, ${alpha * 0.4}))`,
            boxShadow: `0 0 ${size * 0.4}px rgba(160, 190, 220, ${alpha * 0.2})`,
          }}
        />,
      )
    }

    // Fog overlay — the glass is fogged, creating the surface letters are traced into
    const fogDrift = Math.sin(t * 0.15) * 3

    return (
      <div style={{ position: 'absolute', inset: 0, background: bgColor }}>
        {/* Blurred city lights behind glass */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: `radial-gradient(ellipse at ${40 + Math.sin(t * 0.1) * 8}% ${55 + Math.cos(t * 0.08) * 5}%, rgba(70, 90, 120, 0.12), transparent 55%), radial-gradient(ellipse at ${65 + Math.cos(t * 0.12) * 6}% ${35 + Math.sin(t * 0.09) * 5}%, rgba(100, 80, 60, 0.08), transparent 45%)`,
          }}
        />
        {streaks}
        {drops}
        {/* Fog layer */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: `linear-gradient(${175 + fogDrift}deg, rgba(140, 160, 180, 0.06) 0%, rgba(100, 120, 140, 0.1) 50%, rgba(80, 100, 120, 0.06) 100%)`,
            mixBlendMode: 'screen',
          }}
        />
      </div>
    )
  },

  renderWord: ({ word, color, enterProgress, holdProgress, exitProgress, phase, index, frame, width, height }: WordRenderProps) => {
    const f = frame ?? 0
    const t = f / 30

    const chars = word.split('').map((ch, ci) => {
      let charOpacity = 1
      let yOff = 0
      let xOff = 0
      let blur = 0
      let scaleX = 1
      let scaleY = 1

      if (phase === 'enter') {
        // Finger-trace on fogged glass: each letter is "drawn" left-to-right
        // with a clearing effect — starts blurry/foggy, sharpens as finger passes
        const delay = ci / (word.length + 1) * 0.5
        const p = Math.max(0, Math.min(1, (enterProgress - delay) / 0.5))
        const ep = viscousDrag(p)

        // Fog clearing: starts very blurry, then crisp
        blur = (1 - ep) * 8
        charOpacity = 0.15 + ep * 0.85

        // Slight downward pressure from finger trace
        yOff = (1 - ep) * 5
        // Horizontal reveal: character slides slightly into position
        xOff = (1 - ep) * 12
      } else if (phase === 'hold') {
        // Condensation slowly re-fogging the trace — gentle blur breathing
        const fogReturn = Math.sin(t * 1.2 + ci * 0.5) * 0.5 + 0.5
        blur = fogReturn * 0.8

        // Rain-on-glass drift: gravity pulls condensation droplets down
        yOff = Math.sin(t * 0.8 + ci * 0.6) * 2 + holdProgress * 1.5

        // Slight opacity fluctuation — light changes behind the glass
        charOpacity = 0.85 + Math.sin(t * 2 + ci * 0.7) * 0.1
      } else {
        // Palm smear: letters smear downward like a hand wiping the glass
        const delay = ci / (word.length + 1) * 0.25
        const p = Math.max(0, Math.min(1, (exitProgress - delay) / 0.75))
        const ep = easeInQuart(p)

        yOff = ep * 60
        // Horizontal smear stretch
        scaleX = 1 + ep * 0.4
        scaleY = 1 - ep * 0.3
        blur = ep * 10
        charOpacity = 1 - ep
      }

      // Water-trace effect: semi-transparent with a bright edge where finger cleared the fog
      const traceGlow = phase === 'enter'
        ? Math.max(0, 1 - ((enterProgress - ci / (word.length + 1) * 0.5) / 0.15))
        : 0
      const edgeBright = traceGlow > 0 ? traceGlow * 0.5 : 0

      return (
        <span
          key={ci}
          style={{
            display: 'inline-block',
            color: 'transparent',
            opacity: charOpacity,
            transform: `translate(${xOff}px, ${yOff}px) scaleX(${scaleX}) scaleY(${scaleY})`,
            filter: blur > 0.1 ? `blur(${blur}px)` : undefined,
            // Cleared glass look: see-through text with bright condensation edge
            WebkitTextStroke: `1.5px rgba(200, 220, 240, ${0.6 + edgeBright})`,
            backgroundImage: `linear-gradient(180deg, ${color}DD, ${color}99)`,
            WebkitBackgroundClip: 'text',
            backgroundClip: 'text',
            textShadow: `0 0 ${4 + edgeBright * 8}px rgba(180, 210, 240, ${0.3 + edgeBright * 0.4}), 0 1px 3px rgba(0,0,0,0.25)`,
          }}
        >
          {ch}
        </span>
      )
    })

    // Finger-trail moisture beads: small droplets left behind the trace
    const trailBeads: React.ReactNode[] = []
    if (phase === 'enter' || (phase === 'hold' && holdProgress < 0.3)) {
      for (let b = 0; b < 6; b++) {
        const bx = (rand(b * 31 + index * 7) - 0.5) * word.length * 35
        const by = 8 + rand(b * 43 + index * 11) * 15
        const bSize = 2 + rand(b * 19) * 2.5
        const bAlpha = phase === 'enter'
          ? Math.min(0.35, enterProgress * 0.6)
          : 0.35 * (1 - holdProgress * 3.3)

        if (bAlpha > 0.02) {
          trailBeads.push(
            <div
              key={`b${b}`}
              style={{
                position: 'absolute',
                left: `calc(50% + ${bx}px)`,
                top: `calc(50% + ${by}px)`,
                width: bSize,
                height: bSize * 1.3,
                borderRadius: '50%',
                background: `radial-gradient(circle at 40% 30%, rgba(210, 230, 250, ${bAlpha + 0.1}), rgba(160, 190, 220, ${bAlpha}))`,
              }}
            />,
          )
        }
      }
    }

    return (
      <div style={{ position: 'absolute', inset: 0 }}>
        {trailBeads}
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            fontFamily: "'Segoe UI', 'Helvetica Neue', Arial, sans-serif",
            fontSize: 'clamp(44px, 12vw, 150px)',
            fontWeight: 300,
            whiteSpace: 'nowrap',
            letterSpacing: 6,
            textTransform: 'uppercase',
          }}
        >
          {chars}
        </div>
      </div>
    )
  },
}

function RainOnGlassComponent(props: MotionGraphicProps<RainOnGlassConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-rain-on-glass',
  title: 'Kinetic Rain On Glass',
  description: 'Letters appear as finger-traces drawn through fogged glass on a rainy window. Rain streaks and condensation droplets drift across the surface while text sharpens from fog, breathes with re-condensation, and smears away like a palm wipe.',
  tags: ['kinetic', 'typography', 'liquid', 'rain', 'glass', 'fog', 'condensation', 'window', 'trace'],
  category: 'captions',
  component: RainOnGlassComponent as any,
  defaultConfig: {
    words: ['RAIN', 'GLASS', 'TRACE', 'MIST'],
    colors: ['#94A3B8', '#CBD5E1', '#A5B4C8', '#B0BEC5'],
    bgColor: '#0d1117',
    cycleDuration: 1.4,
  },
  configSchema: [
    { key: 'words', label: 'Words', type: 'text-array', defaultValue: ['RAIN', 'GLASS', 'TRACE', 'MIST'], group: 'Content' },
    { key: 'colors', label: 'Colors', type: 'text-array', defaultValue: ['#94A3B8', '#CBD5E1', '#A5B4C8', '#B0BEC5'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#0d1117', group: 'Style' },
    { key: 'cycleDuration', label: 'Cycle Duration (s)', type: 'number', defaultValue: 1.4, min: 0.3, max: 5, group: 'Timing' },
  ],
})
