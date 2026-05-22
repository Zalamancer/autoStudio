import { registerMotionGraphic } from '../registry'
import { KineticBase, type KineticBaseConfig, type KineticAnimation, type WordRenderProps, type BackgroundRenderProps } from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface CondensationConfig extends KineticBaseConfig {}

function rand(s: number): number {
  const x = Math.sin(s * 127.1 + 311.7) * 43758.5453
  return x - Math.floor(x)
}

function easeOutQuart(t: number): number {
  return 1 - Math.pow(1 - t, 4)
}

function easeInQuad(t: number): number {
  return t * t
}

const animation: KineticAnimation = {
  renderBackground: ({ bgColor, width, height, frame, fps }: BackgroundRenderProps) => {
    const t = frame / fps

    // Cold glass surface with condensation droplets
    const droplets: React.ReactNode[] = []
    const numDroplets = 35

    for (let i = 0; i < numDroplets; i++) {
      const dx = width * rand(i * 31 + 7)
      const baseY = height * rand(i * 47 + 13)
      // Slow gravity drip
      const dripSpeed = 0.3 + rand(i * 23) * 0.5
      const dy = baseY + (t * dripSpeed * 15) % (height * 0.3)
      const size = 2 + rand(i * 19) * 5
      const alpha = 0.15 + rand(i * 37) * 0.2

      // Droplet with light refraction highlight
      droplets.push(
        <div
          key={i}
          style={{
            position: 'absolute',
            left: dx,
            top: dy,
            width: size,
            height: size * (1 + rand(i * 11) * 0.3),
            borderRadius: '50%',
            background: `radial-gradient(circle at 35% 30%, rgba(200, 220, 240, ${alpha + 0.15}), rgba(150, 180, 210, ${alpha}) 60%, rgba(100, 140, 180, ${alpha * 0.5}))`,
            boxShadow: `0 0 ${size * 0.5}px rgba(150, 180, 210, ${alpha * 0.3})`,
          }}
        />,
      )
    }

    // Occasional streak from a droplet running down
    const streaks: React.ReactNode[] = []
    for (let s = 0; s < 4; s++) {
      const sx = width * (0.15 + 0.7 * rand(s * 53 + 29))
      const sy = height * 0.1 + (t * 8 + s * 60) % (height * 0.6)
      const sLen = 20 + rand(s * 41) * 40
      streaks.push(
        <div
          key={`st${s}`}
          style={{
            position: 'absolute',
            left: sx,
            top: sy,
            width: 2,
            height: sLen,
            borderRadius: '0 0 2px 2px',
            background: `linear-gradient(180deg, rgba(180, 200, 220, 0.15), rgba(180, 200, 220, 0.05), transparent)`,
          }}
        />,
      )
    }

    return (
      <div style={{ position: 'absolute', inset: 0, background: bgColor }}>
        {/* Frosted glass effect */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: 'linear-gradient(180deg, rgba(60, 80, 100, 0.1) 0%, rgba(40, 60, 80, 0.15) 100%)',
          }}
        />
        {droplets}
        {streaks}
      </div>
    )
  },

  renderWord: ({ word, color, enterProgress, holdProgress, exitProgress, phase, index, frame }: WordRenderProps) => {
    const f = frame ?? 0
    const t = f / 30

    const chars = word.split('').map((ch, ci) => {
      let charOpacity = 0
      let blur = 0
      let yOff = 0

      if (phase === 'enter') {
        // Condensation forming: tiny droplets coalesce to form each letter
        // Letters appear in sequence, building up like fog on glass
        const delay = ci / (word.length + 1) * 0.5
        const p = Math.max(0, Math.min(1, (enterProgress - delay) / 0.5))
        const ep = easeOutQuart(p)

        // Start very blurry (foggy), sharpen as condensation forms
        blur = (1 - ep) * 6
        charOpacity = ep * 0.9

        // Slight downward settling as water weight builds
        yOff = (1 - ep) * -8
      } else if (phase === 'hold') {
        charOpacity = 0.85 + Math.sin(t * 1.5 + ci * 0.4) * 0.1

        // Subtle drip: occasional characters sag slightly
        const dripPhase = (t * 0.8 + ci * 0.3) % 3
        if (dripPhase > 2.5) {
          yOff = (dripPhase - 2.5) * 10
          charOpacity *= 1 - (dripPhase - 2.5) * 0.3
        }

        // Very slight shimmer like light through water
        blur = Math.sin(t * 2 + ci * 0.6) * 0.3
      } else {
        // Evaporation/wiping: letters fade and blur away
        const delay = ci / (word.length + 1) * 0.3
        const p = Math.max(0, Math.min(1, (exitProgress - delay) / 0.7))
        const ep = easeInQuad(p)

        charOpacity = (1 - ep) * 0.9
        blur = ep * 8
        // Slight upward drift as water evaporates
        yOff = -ep * 12
      }

      // Water droplet cluster around each character (condensation dots)
      const dropDots: React.ReactNode[] = []
      if (phase === 'enter' && enterProgress > 0.1) {
        const numDots = 4
        for (let d = 0; d < numDots; d++) {
          const dotX = (rand(ci * 31 + d * 17 + index) - 0.5) * 30
          const dotY = (rand(ci * 43 + d * 23 + index) - 0.5) * 40
          const dotSize = 2 + rand(ci * 19 + d * 7) * 3
          const dotAlpha = Math.max(0, (1 - enterProgress * 1.5) * 0.5)
          if (dotAlpha > 0.01) {
            dropDots.push(
              <span
                key={`d${d}`}
                style={{
                  position: 'absolute',
                  left: `calc(50% + ${dotX}px)`,
                  top: `calc(50% + ${dotY}px)`,
                  width: dotSize,
                  height: dotSize,
                  borderRadius: '50%',
                  background: `rgba(180, 210, 240, ${dotAlpha})`,
                }}
              />,
            )
          }
        }
      }

      return (
        <span
          key={ci}
          style={{
            display: 'inline-block',
            position: 'relative',
            color: 'transparent',
            opacity: charOpacity,
            transform: `translateY(${yOff}px)`,
            filter: blur > 0.1 ? `blur(${blur}px)` : undefined,
            // Condensation text: translucent with visible edge and slight refraction
            WebkitTextStroke: `1.5px ${color}`,
            textShadow: `0 0 6px ${color}40, 0 1px 3px rgba(0,0,0,0.3)`,
            // Paint fill with translucent water look
            backgroundImage: `linear-gradient(180deg, ${color}CC, ${color}88)`,
            WebkitBackgroundClip: 'text',
            backgroundClip: 'text',
          }}
        >
          {ch}
          {dropDots}
        </span>
      )
    })

    return (
      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          fontFamily: "'Helvetica Neue', Arial, sans-serif",
          fontSize: 'clamp(44px, 12vw, 150px)',
          fontWeight: 300,
          whiteSpace: 'nowrap',
          letterSpacing: 4,
          textTransform: 'uppercase',
        }}
      >
        {chars}
      </div>
    )
  },
}

function CondensationComponent(props: MotionGraphicProps<CondensationConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-condensation',
  title: 'Kinetic Condensation',
  description: 'Text appearing as condensation on cold glass with water droplets forming letter shapes. Letters coalesce from foggy blur with surrounding droplet clusters, then evaporate away.',
  tags: ['kinetic', 'typography', 'liquid', 'water', 'condensation', 'glass', 'cold', 'droplet'],
  category: 'captions',
  component: CondensationComponent as any,
  defaultConfig: {
    words: ['COLD', 'MIST', 'DEW', 'GLASS'],
    colors: ['#93C5FD', '#A5B4FC', '#7DD3FC', '#BAE6FD'],
    bgColor: '#0f1520',
    cycleDuration: 1.5,
  },
  configSchema: [
    { key: 'words', label: 'Words', type: 'text-array', defaultValue: ['COLD', 'MIST', 'DEW', 'GLASS'], group: 'Content' },
    { key: 'colors', label: 'Colors', type: 'text-array', defaultValue: ['#93C5FD', '#A5B4FC', '#7DD3FC', '#BAE6FD'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#0f1520', group: 'Style' },
    { key: 'cycleDuration', label: 'Cycle Duration (s)', type: 'number', defaultValue: 1.5, min: 0.3, max: 5, group: 'Timing' },
  ],
})
