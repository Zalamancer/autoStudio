import { registerMotionGraphic } from '../registry'
import {
  KineticBase,
  type KineticBaseConfig,
  type KineticAnimation,
  type WordRenderProps,
  type BackgroundRenderProps,
} from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface ViralSpreadConfig extends KineticBaseConfig {
  spreadCount: number
  spreadRadius: number
}

function seededRand(seed: number): number {
  const x = Math.sin(seed * 127.1 + 311.7) * 43758.5453
  return x - Math.floor(x)
}

const animation: KineticAnimation = {
  renderBackground: ({ bgColor, frame }: BackgroundRenderProps) => {
    // Subtle network connection lines
    const nodes = Array.from({ length: 10 }).map((_, i) => {
      const cx = 10 + seededRand(i * 43 + 7) * 80
      const cy = 10 + seededRand(i * 67 + 13) * 80
      const pulse = Math.sin(frame * 0.05 + i * 1.2) * 0.5 + 0.5
      return (
        <div
          key={i}
          style={{
            position: 'absolute',
            left: `${cx}%`,
            top: `${cy}%`,
            width: 4 + pulse * 4,
            height: 4 + pulse * 4,
            borderRadius: '50%',
            background: `rgba(168, 85, 247, ${0.08 + pulse * 0.06})`,
            transform: 'translate(-50%, -50%)',
          }}
        />
      )
    })
    return (
      <div style={{ position: 'absolute', inset: 0, background: bgColor }}>
        {nodes}
      </div>
    )
  },

  renderWord: ({
    word,
    color,
    enterProgress,
    holdProgress,
    exitProgress,
    phase,
    index,
    config,
  }: WordRenderProps) => {
    const cfg = config as unknown as ViralSpreadConfig
    const spreadCount = cfg?.spreadCount ?? 6
    const spreadRadius = cfg?.spreadRadius ?? 180

    let mainOpacity = 1
    let mainScale = 1

    if (phase === 'enter') {
      // Start small in center, pop out
      const t = enterProgress
      const eased = t < 0.4 ? Math.pow(t / 0.4, 0.5) : 1 + Math.sin((t - 0.4) / 0.6 * Math.PI) * 0.08
      mainScale = eased
      mainOpacity = Math.min(1, t * 4)
    } else if (phase === 'hold') {
      mainScale = 1 + Math.sin(holdProgress * Math.PI * 4) * 0.02
    } else {
      const t = exitProgress
      mainScale = 1 + t * 0.5
      mainOpacity = 1 - Math.pow(t, 2)
    }

    // Spread copies that multiply outward
    const copies = Array.from({ length: spreadCount }).map((_, i) => {
      const angle = (i / spreadCount) * Math.PI * 2 + index * 0.5
      let copyOpacity = 0
      let copyScale = 0
      let dist = 0

      if (phase === 'enter') {
        const delay = 0.3 + (i / spreadCount) * 0.4
        const copyProgress = Math.max(0, Math.min(1, (enterProgress - delay) / (1 - delay)))
        dist = copyProgress * spreadRadius * (0.6 + seededRand(i * 31 + index * 17) * 0.4)
        copyOpacity = copyProgress * 0.5
        copyScale = copyProgress * 0.45
      } else if (phase === 'hold') {
        dist = spreadRadius * (0.6 + seededRand(i * 31 + index * 17) * 0.4)
        const pulse = Math.sin(holdProgress * Math.PI * 3 + i * 0.8)
        dist += pulse * 10
        copyOpacity = 0.35 + pulse * 0.1
        copyScale = 0.4 + pulse * 0.05
      } else {
        const t = exitProgress
        dist = spreadRadius * (0.6 + seededRand(i * 31 + index * 17) * 0.4) + t * 100
        copyOpacity = Math.max(0, 0.35 - t * 1.2)
        copyScale = 0.4 * (1 - t)
      }

      const x = Math.cos(angle) * dist
      const y = Math.sin(angle) * dist
      const rot = (seededRand(i * 53 + 11) - 0.5) * 30

      return (
        <div
          key={`copy-${i}`}
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: `translate(calc(-50% + ${x}px), calc(-50% + ${y}px)) scale(${copyScale}) rotate(${rot}deg)`,
            opacity: copyOpacity,
            fontFamily: "'Helvetica Neue', Arial, sans-serif",
            fontSize: 'clamp(36px, 10vw, 120px)',
            fontWeight: 900,
            color,
            whiteSpace: 'nowrap',
            filter: 'blur(1px)',
          }}
        >
          {word}
        </div>
      )
    })

    // Connection lines from center to copies during spread
    const lines = phase !== 'exit' ? Array.from({ length: spreadCount }).map((_, i) => {
      const angle = (i / spreadCount) * Math.PI * 2 + index * 0.5
      let dist = 0
      let lineOpacity = 0

      if (phase === 'enter') {
        const delay = 0.3 + (i / spreadCount) * 0.4
        const cp = Math.max(0, Math.min(1, (enterProgress - delay) / (1 - delay)))
        dist = cp * spreadRadius * 0.5
        lineOpacity = cp * 0.15
      } else {
        dist = spreadRadius * 0.5
        lineOpacity = 0.1
      }

      const len = dist
      const deg = (angle * 180) / Math.PI

      return (
        <div
          key={`line-${i}`}
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            width: len,
            height: 1,
            background: `linear-gradient(90deg, ${color}60, transparent)`,
            transformOrigin: '0 50%',
            transform: `rotate(${deg}deg)`,
            opacity: lineOpacity,
          }}
        />
      )
    }) : null

    return (
      <>
        {lines}
        {copies}
        {/* Main center word */}
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: `translate(-50%, -50%) scale(${mainScale})`,
            opacity: mainOpacity,
            fontFamily: "'Helvetica Neue', Arial, sans-serif",
            fontSize: 'clamp(40px, 11vw, 140px)',
            fontWeight: 900,
            color,
            whiteSpace: 'nowrap',
            textShadow: `0 0 30px ${color}50, 0 0 60px ${color}25`,
          }}
        >
          {word}
        </div>
        {/* Viral ripple ring */}
        {phase === 'enter' && enterProgress > 0.2 && (
          <div
            style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              width: enterProgress * 300,
              height: enterProgress * 300,
              borderRadius: '50%',
              border: `2px solid ${color}`,
              transform: 'translate(-50%, -50%)',
              opacity: Math.max(0, 0.4 - enterProgress * 0.5),
            }}
          />
        )}
      </>
    )
  },
}

function ViralSpreadComponent(props: MotionGraphicProps<ViralSpreadConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-viral-spread',
  title: 'Kinetic Viral Spread',
  description:
    'Text multiplies and spreads outward virally with connection lines, ripple rings, and multiplying copies radiating from center.',
  tags: ['kinetic', 'typography', 'viral', 'social-media', 'spread', 'multiply', 'network'],
  category: 'captions',
  component: ViralSpreadComponent as any,
  defaultConfig: {
    words: ['VIRAL', 'SHARE', 'REPOST', 'TRENDING'],
    colors: ['#A855F7', '#EC4899', '#F97316', '#10B981'],
    bgColor: '#0A0A14',
    cycleDuration: 1.5,
    spreadCount: 6,
    spreadRadius: 180,
  },
  configSchema: [
    { key: 'words', label: 'Words', type: 'text-array', defaultValue: ['VIRAL', 'SHARE', 'REPOST', 'TRENDING'], group: 'Content' },
    { key: 'colors', label: 'Colors', type: 'text-array', defaultValue: ['#A855F7', '#EC4899', '#F97316', '#10B981'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#0A0A14', group: 'Style' },
    { key: 'spreadCount', label: 'Spread Count', type: 'number', defaultValue: 6, min: 3, max: 12, group: 'Animation' },
    { key: 'spreadRadius', label: 'Spread Radius', type: 'number', defaultValue: 180, min: 80, max: 400, group: 'Animation' },
    { key: 'cycleDuration', label: 'Cycle Duration (s)', type: 'number', defaultValue: 1.5, min: 0.3, max: 5, group: 'Timing' },
  ],
})
