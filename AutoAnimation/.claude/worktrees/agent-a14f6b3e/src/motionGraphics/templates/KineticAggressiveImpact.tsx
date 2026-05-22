import { registerMotionGraphic } from '../registry'
import { KineticBase, type KineticBaseConfig, type KineticAnimation, type WordRenderProps, type BackgroundRenderProps } from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface AggressiveImpactConfig extends KineticBaseConfig {
  shakeIntensity: number
}

// Aggressive / impact mood: boxing promo energy — hard cuts, screen shake,
// bold heavyweight type, red/black palette. Text SLAMS in with overshoot,
// shakes violently during hold, exits with a hard lateral smash cut.

function rand(s: number): number {
  const x = Math.sin(s * 127.1 + 311.7) * 43758.5453
  return x - Math.floor(x)
}

const animation: KineticAnimation = {
  renderBackground: ({ bgColor, width, height, frame, fps }: BackgroundRenderProps) => {
    const t = frame / fps
    const flashCycle = t % 1.1
    // Impact flash — brief white strobe on each word slam
    const flashOpacity = flashCycle < 0.06 ? (1 - flashCycle / 0.06) * 0.7 : 0

    // Diagonal danger stripes
    const stripeOffset = t * 30

    return (
      <div style={{ position: 'absolute', inset: 0, background: bgColor, overflow: 'hidden' }}>
        {/* Gritty noise texture via repeating gradient */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            backgroundImage: `repeating-linear-gradient(
              ${45 + Math.sin(t * 0.5) * 2}deg,
              rgba(255,0,0,0.03) 0px,
              transparent 2px,
              transparent 18px,
              rgba(255,0,0,0.03) 20px
            )`,
            backgroundPosition: `${stripeOffset}px 0`,
          }}
        />
        {/* Corner stress marks — bold diagonal lines */}
        {[0, 1, 2, 3].map(corner => {
          const isLeft = corner % 2 === 0
          const isTop = corner < 2
          return (
            <div
              key={corner}
              style={{
                position: 'absolute',
                [isTop ? 'top' : 'bottom']: 0,
                [isLeft ? 'left' : 'right']: 0,
                width: '25%',
                height: '25%',
                borderStyle: 'solid',
                borderWidth: 0,
                [isTop && isLeft ? 'borderTopWidth' : '']: 3,
                [isTop && isLeft ? 'borderLeftWidth' : '']: 3,
                [isTop && !isLeft ? 'borderTopWidth' : '']: 3,
                [isTop && !isLeft ? 'borderRightWidth' : '']: 3,
                [!isTop && isLeft ? 'borderBottomWidth' : '']: 3,
                [!isTop && isLeft ? 'borderLeftWidth' : '']: 3,
                [!isTop && !isLeft ? 'borderBottomWidth' : '']: 3,
                [!isTop && !isLeft ? 'borderRightWidth' : '']: 3,
                borderColor: 'rgba(255,30,30,0.25)',
              }}
            />
          )
        })}
        {/* Red vignette */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: 'radial-gradient(ellipse at 50% 50%, transparent 30%, rgba(80,0,0,0.5) 100%)',
            mixBlendMode: 'multiply',
          }}
        />
        {/* Impact flash */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: '#FFFFFF',
            opacity: flashOpacity,
            mixBlendMode: 'overlay',
          }}
        />
      </div>
    )
  },

  renderWord: ({ word, color, enterProgress, holdProgress, exitProgress, phase, index, width, height }: WordRenderProps) => {
    const chars = word.split('').map((ch, ci) => {
      const total = word.length || 1
      let charOpacity = 1
      let xOff = 0
      let yOff = 0
      let scaleX = 1
      let scaleY = 1
      let rotation = 0

      if (phase === 'enter') {
        // Hard slam from alternating sides — odd chars from left, even from right
        const delay = (ci / (total + 1)) * 0.15
        const p = Math.max(0, Math.min(1, (enterProgress - delay) / 0.5))
        // Overshoot easing
        const overshoot = p < 1 ? p * p * ((2.5 + 1) * p - 2.5) : 1
        const direction = ci % 2 === 0 ? -1 : 1

        charOpacity = Math.min(1, p * 3)
        xOff = (1 - Math.min(1, Math.max(0, overshoot))) * direction * 120
        scaleX = 1 + (1 - Math.min(1, p)) * 0.4
        scaleY = 1 - (1 - Math.min(1, p)) * 0.15
      } else if (phase === 'hold') {
        // Violent micro-shake — deterministic
        const shakeT = holdProgress * 60 + ci * 7 + index * 13
        xOff = Math.sin(shakeT * 2.3) * 3
        yOff = Math.cos(shakeT * 3.1) * 2
        rotation = Math.sin(shakeT * 1.7) * 1.5
        // Occasional glitch offset
        const glitchPulse = Math.sin(holdProgress * Math.PI * 8 + ci) > 0.92
        if (glitchPulse) {
          xOff += (ci % 2 === 0 ? 6 : -6)
        }
      } else {
        // Hard smash cut — all chars slam to one side fast
        const delay = (ci / (total + 1)) * 0.1
        const p = Math.max(0, Math.min(1, (exitProgress - delay) / 0.5))
        const ep = p * p

        charOpacity = 1 - ep
        xOff = ep * (index % 2 === 0 ? -1 : 1) * 200
        rotation = ep * (ci % 2 === 0 ? -15 : 15)
        scaleX = 1 + ep * 0.3
      }

      return (
        <span
          key={ci}
          style={{
            display: 'inline-block',
            color,
            opacity: charOpacity,
            transform: `translate(${xOff}px, ${yOff}px) scaleX(${scaleX}) scaleY(${scaleY}) rotate(${rotation}deg)`,
            textShadow: `4px 4px 0 rgba(0,0,0,0.9), -2px -2px 0 rgba(255,0,0,0.3)`,
          }}
        >
          {ch}
        </span>
      )
    })

    return (
      <div style={{ position: 'absolute', inset: 0, overflow: 'hidden' }}>
        {/* Red afterimage offset layer */}
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: `translate(calc(-50% + 3px), calc(-50% + 2px))`,
            fontFamily: "'Impact', 'Arial Black', sans-serif",
            fontSize: 'clamp(40px, 12vw, 160px)',
            fontWeight: 900,
            letterSpacing: '-0.02em',
            textTransform: 'uppercase',
            whiteSpace: 'nowrap',
            color: 'rgba(255,0,0,0.3)',
            opacity: phase === 'enter' ? enterProgress : phase === 'hold' ? 1 : 1 - exitProgress,
            mixBlendMode: 'screen',
          }}
        >
          {word}
        </div>
        {/* Main text */}
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            fontFamily: "'Impact', 'Arial Black', sans-serif",
            fontSize: 'clamp(40px, 12vw, 160px)',
            fontWeight: 900,
            letterSpacing: '-0.02em',
            textTransform: 'uppercase',
            whiteSpace: 'nowrap',
          }}
        >
          {chars}
        </div>
      </div>
    )
  },
}

function AggressiveImpactComponent(props: MotionGraphicProps<AggressiveImpactConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-aggressive-impact',
  title: 'Kinetic Aggressive Impact',
  description: 'Boxing promo energy with hard-slamming letters, screen shake, white impact flash, red afterimage chromatic offset, and violent micro-shake during hold.',
  tags: ['kinetic', 'typography', 'aggressive', 'impact', 'shake', 'bold', 'promo', 'mood', 'atmosphere'],
  category: 'captions',
  component: AggressiveImpactComponent as any,
  defaultConfig: {
    words: ['FIGHT', 'POWER', 'RAGE', 'FURY'],
    colors: ['#FFFFFF', '#FF1A1A', '#FFFFFF', '#FFD700'],
    bgColor: '#0A0A0A',
    cycleDuration: 1.0,
    shakeIntensity: 3,
  },
  configSchema: [
    { key: 'words', label: 'Words', type: 'text-array', defaultValue: ['FIGHT', 'POWER', 'RAGE', 'FURY'], group: 'Content' },
    { key: 'colors', label: 'Colors', type: 'text-array', defaultValue: ['#FFFFFF', '#FF1A1A', '#FFFFFF', '#FFD700'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#0A0A0A', group: 'Style' },
    { key: 'cycleDuration', label: 'Cycle Duration (s)', type: 'number', defaultValue: 1.0, min: 0.3, max: 5, group: 'Timing' },
    { key: 'shakeIntensity', label: 'Shake Intensity', type: 'number', defaultValue: 3, min: 1, max: 10, group: 'Animation' },
  ],
})
