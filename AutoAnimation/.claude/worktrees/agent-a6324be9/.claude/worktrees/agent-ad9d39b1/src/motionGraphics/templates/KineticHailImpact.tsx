import { registerMotionGraphic } from '../registry'
import {
  KineticBase,
  type KineticBaseConfig,
  type KineticAnimation,
  type WordRenderProps,
  type BackgroundRenderProps,
} from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

/**
 * KineticHailImpact — Hailstones hammer each character into place.
 *
 * Metaphor: A severe hailstorm where ice pellets slam from above, each impact
 * stamping a letter into the surface with a dent-crack flash. Characters arrive
 * top-down with ballistic deceleration. Hold phase: residual bounce-vibration
 * like settling ice on metal. Exit: hailstones shatter outward.
 */

interface HailImpactConfig extends KineticBaseConfig {}

function rand(s: number): number {
  const x = Math.sin(s * 127.1 + 311.7) * 43758.5453
  return x - Math.floor(x)
}

// Ballistic drop — fast approach, sharp deceleration on impact
function easeOutBounce(t: number): number {
  if (t < 1 / 2.75) return 7.5625 * t * t
  if (t < 2 / 2.75) { const t2 = t - 1.5 / 2.75; return 7.5625 * t2 * t2 + 0.75 }
  if (t < 2.5 / 2.75) { const t2 = t - 2.25 / 2.75; return 7.5625 * t2 * t2 + 0.9375 }
  const t2 = t - 2.625 / 2.75
  return 7.5625 * t2 * t2 + 0.984375
}

function easeInQuart(t: number): number {
  return t * t * t * t
}

function easeOutQuad(t: number): number {
  return 1 - (1 - t) * (1 - t)
}

const animation: KineticAnimation = {
  renderBackground: ({ bgColor, width, height, frame, fps }: BackgroundRenderProps) => {
    const t = frame / fps

    // Layer 1: Dark storm sky base with moving cloud gradient
    const cloudShift = Math.sin(t * 0.2) * 8

    // Layer 2: Diagonal hail streaks raining across the background
    const streaks: React.ReactNode[] = []
    for (let i = 0; i < 18; i++) {
      const sx = width * rand(i * 37 + 7)
      // Falling animation looped
      const fallSpeed = 280 + rand(i * 19) * 200
      const sy = ((t * fallSpeed + rand(i * 53) * height * 3) % (height * 1.4)) - height * 0.2
      const streakLen = 12 + rand(i * 29) * 20
      const alpha = 0.12 + rand(i * 41) * 0.15

      streaks.push(
        <div
          key={i}
          style={{
            position: 'absolute',
            left: sx,
            top: sy,
            width: 2,
            height: streakLen,
            borderRadius: 1,
            background: `linear-gradient(180deg, rgba(200, 220, 240, ${alpha}), rgba(180, 200, 230, ${alpha * 0.3}))`,
            transform: `rotate(${8 + rand(i * 11) * 6}deg)`,
          }}
        />,
      )
    }

    // Layer 3: Ground-level impact ripple pulses
    const ripples: React.ReactNode[] = []
    for (let r = 0; r < 6; r++) {
      const rPhase = (t * 2.5 + rand(r * 67) * 4) % 2
      if (rPhase > 1.2) continue
      const rp = rPhase / 1.2
      const rx = width * (0.1 + 0.8 * rand(r * 43 + 3))
      const ry = height * (0.75 + 0.2 * rand(r * 31 + 11))
      const rSize = 10 + rp * 40
      ripples.push(
        <div
          key={`rp${r}`}
          style={{
            position: 'absolute',
            left: rx - rSize / 2,
            top: ry - rSize / 4,
            width: rSize,
            height: rSize * 0.4,
            borderRadius: '50%',
            border: `1px solid rgba(180, 210, 240, ${(1 - rp) * 0.25})`,
          }}
        />,
      )
    }

    return (
      <div style={{ position: 'absolute', inset: 0, background: bgColor }}>
        {/* Storm cloud layer */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: `linear-gradient(180deg,
              rgba(30, 35, 50, 0.9) 0%,
              rgba(40, 50, 70, 0.6) ${35 + cloudShift}%,
              rgba(25, 30, 45, 0.4) 70%,
              rgba(15, 18, 30, 0.2) 100%)`,
          }}
        />
        {/* Hail streak overlay with screen blend */}
        <div style={{ position: 'absolute', inset: 0, mixBlendMode: 'screen' }}>
          {streaks}
        </div>
        {ripples}
      </div>
    )
  },

  renderWord: ({ word, color, enterProgress, holdProgress, exitProgress, phase, index, frame }: WordRenderProps) => {
    const f = frame ?? 0
    const t = f / 30

    // Impact flash layer — bright white flash on each character landing
    const impactFlashes: React.ReactNode[] = []

    const chars = word.split('').map((ch, ci) => {
      let charOpacity = 0
      let yOff = 0
      let scaleX = 1
      let scaleY = 1
      let rotation = 0

      if (phase === 'enter') {
        // Staggered ballistic drop — each character is a hailstone
        const delay = ci / (word.length + 1) * 0.5
        const p = Math.max(0, Math.min(1, (enterProgress - delay) / 0.5))

        if (p <= 0) {
          charOpacity = 0
          yOff = -120
        } else {
          const drop = easeOutBounce(p)
          charOpacity = Math.min(1, p * 4)
          // Fall from above, bounce on impact
          yOff = (1 - drop) * -100
          // Squash on impact — wide and flat at moment of contact
          const impactMoment = p > 0.3 && p < 0.5
          if (impactMoment) {
            const squash = Math.sin((p - 0.3) / 0.2 * Math.PI)
            scaleX = 1 + squash * 0.2
            scaleY = 1 - squash * 0.15
          }
          // Slight random rotation on approach
          if (p < 0.35) {
            rotation = (rand(ci * 23 + index) - 0.5) * 20 * (1 - p / 0.35)
          }

          // Flash on impact
          if (p > 0.28 && p < 0.45) {
            const flashP = (p - 0.28) / 0.17
            const flashAlpha = Math.sin(flashP * Math.PI) * 0.7
            impactFlashes.push(
              <div
                key={`fl${ci}`}
                style={{
                  position: 'absolute',
                  top: '50%',
                  left: '50%',
                  width: 50 + flashP * 30,
                  height: 50 + flashP * 30,
                  transform: `translate(calc(-50% + ${(ci - word.length / 2) * 55}px), -50%)`,
                  borderRadius: '50%',
                  background: `radial-gradient(circle, rgba(220, 240, 255, ${flashAlpha}), transparent 70%)`,
                  mixBlendMode: 'screen',
                }}
              />,
            )
          }
        }
      } else if (phase === 'hold') {
        charOpacity = 1
        // Residual vibration — hailstone settling on cold surface
        const vibFreq = 6 + ci * 0.8
        const vibDecay = Math.exp(-holdProgress * 3)
        yOff = Math.sin(t * vibFreq + ci * 1.2) * 2 * vibDecay
        // Subtle crackle shimmer
        const shimmer = Math.sin(t * 4 + ci * 0.9) * 0.5 + 0.5
        scaleX = 1 + shimmer * 0.008
        scaleY = 1 - shimmer * 0.005
      } else {
        // Shatter exit — hailstones crack and fly outward
        const delay = ci / (word.length + 1) * 0.3
        const p = Math.max(0, Math.min(1, (exitProgress - delay) / 0.7))
        const ep = easeInQuart(p)

        charOpacity = 1 - ep
        // Each shard flies in a different direction
        const angle = rand(ci * 47 + index) * Math.PI * 2
        const dist = ep * 80
        yOff = Math.sin(angle) * dist
        const xComponent = Math.cos(angle) * dist
        rotation = (rand(ci * 31 + index) - 0.5) * 360 * ep
        scaleX = 1 - ep * 0.3

        return (
          <span
            key={ci}
            style={{
              display: 'inline-block',
              color,
              opacity: charOpacity,
              transform: `translate(${xComponent}px, ${yOff}px) rotate(${rotation}deg) scale(${scaleX})`,
              textShadow: `0 0 ${4 + ep * 8}px rgba(180, 210, 240, ${0.3 * (1 - ep)})`,
              filter: ep > 0.5 ? `blur(${(ep - 0.5) * 6}px)` : undefined,
            }}
          >
            {ch}
          </span>
        )
      }

      return (
        <span
          key={ci}
          style={{
            display: 'inline-block',
            color,
            opacity: charOpacity,
            transform: `translateY(${yOff}px) rotate(${rotation}deg) scaleX(${scaleX}) scaleY(${scaleY})`,
            textShadow: `
              0 2px 4px rgba(0, 0, 0, 0.5),
              0 0 8px rgba(180, 210, 240, 0.25),
              0 -1px 2px rgba(200, 230, 255, 0.15)
            `,
          }}
        >
          {ch}
        </span>
      )
    })

    // Shatter debris particles on exit
    const debris: React.ReactNode[] = []
    if (phase === 'exit') {
      for (let d = 0; d < 14; d++) {
        const dp = Math.max(0, Math.min(1, (exitProgress - d / 14 * 0.15) / 0.85))
        if (dp <= 0) continue
        const ep = easeOutQuad(dp)
        const angle = rand(d * 61 + index) * Math.PI * 2
        const dist = ep * 100 + rand(d * 29) * 40
        const dx = Math.cos(angle) * dist
        const dy = Math.sin(angle) * dist + ep * 20 // gravity pull
        const size = 3 + rand(d * 17) * 5
        debris.push(
          <div
            key={`db${d}`}
            style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              width: size,
              height: size,
              transform: `translate(calc(-50% + ${dx}px), calc(-50% + ${dy}px)) rotate(${ep * 180}deg)`,
              background: `rgba(200, 220, 240, ${(1 - dp) * 0.5})`,
              borderRadius: rand(d * 7) > 0.5 ? '50%' : '1px',
            }}
          />,
        )
      }
    }

    return (
      <div style={{ position: 'absolute', inset: 0 }}>
        {impactFlashes}
        {debris}
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            fontFamily: "'Impact', 'Arial Black', sans-serif",
            fontSize: 'clamp(44px, 12vw, 155px)',
            fontWeight: 900,
            whiteSpace: 'nowrap',
            letterSpacing: 3,
            textTransform: 'uppercase',
          }}
        >
          {chars}
        </div>
      </div>
    )
  },
}

function HailImpactComponent(props: MotionGraphicProps<HailImpactConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-hail-impact',
  title: 'Kinetic Hail Impact',
  description:
    'Hailstones slam from above to hammer each character into place with bounce-squash impact physics. Streaking ice pellets rain across a storm-dark sky, each letter landing with a white flash and settling vibration. Exit shatters letters like cracking ice.',
  tags: ['kinetic', 'typography', 'weather', 'hail', 'storm', 'impact', 'ice', 'atmospheric'],
  category: 'captions',
  component: HailImpactComponent as any,
  defaultConfig: {
    words: ['HAIL', 'STORM', 'STRIKE', 'CRACK'],
    colors: ['#C8E0F0', '#A0C4E0', '#D8ECF8', '#90B8D8'],
    bgColor: '#0c1018',
    cycleDuration: 1.3,
  },
  configSchema: [
    { key: 'words', label: 'Words', type: 'text-array', defaultValue: ['HAIL', 'STORM', 'STRIKE', 'CRACK'], group: 'Content' },
    { key: 'colors', label: 'Colors', type: 'text-array', defaultValue: ['#C8E0F0', '#A0C4E0', '#D8ECF8', '#90B8D8'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#0c1018', group: 'Style' },
    { key: 'cycleDuration', label: 'Cycle Duration (s)', type: 'number', defaultValue: 1.3, min: 0.3, max: 5, group: 'Timing' },
  ],
})
