import { registerMotionGraphic } from '../registry'
import {
  KineticBase,
  type KineticBaseConfig,
  type KineticAnimation,
  type WordRenderProps,
  type BackgroundRenderProps,
} from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface ShatterGlassConfig extends KineticBaseConfig {}

function pseudoRandom(seed: number): number {
  return ((Math.sin(seed * 127.1 + 311.7) * 43758.5453) % 1 + 1) % 1
}

function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3)
}

const animation: KineticAnimation = {
  renderBackground: ({ bgColor, frame, fps }: BackgroundRenderProps) => {
    const time = frame / fps
    // Subtle crack pattern overlay
    const cracks = Array.from({ length: 6 }, (_, i) => {
      const x1 = 20 + pseudoRandom(i * 31) * 60
      const y1 = 20 + pseudoRandom(i * 47) * 60
      const angle = pseudoRandom(i * 73) * 360
      const len = 8 + pseudoRandom(i * 19) * 15
      const flickerOpacity = 0.02 + Math.sin(time * 2 + i * 1.5) * 0.01
      return (
        <div
          key={i}
          style={{
            position: 'absolute',
            left: `${x1}%`,
            top: `${y1}%`,
            width: len,
            height: 1,
            background: `rgba(255,255,255,${flickerOpacity})`,
            transform: `rotate(${angle}deg)`,
            transformOrigin: 'left center',
            pointerEvents: 'none',
          }}
        />
      )
    })

    return (
      <div style={{ position: 'absolute', inset: 0, background: bgColor }}>
        {cracks}
        {/* Glass surface sheen */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: 'linear-gradient(135deg, rgba(255,255,255,0.02) 0%, transparent 50%, rgba(255,255,255,0.01) 100%)',
            pointerEvents: 'none',
          }}
        />
      </div>
    )
  },

  renderWord: ({ word, color, enterProgress, holdProgress, exitProgress, phase, index, width, height }: WordRenderProps) => {
    const chars = word.split('')
    const shardCount = chars.length

    if (phase === 'enter') {
      // Shards fly in and assemble into text on glass
      return (
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            display: 'flex',
            gap: 0,
          }}
        >
          {chars.map((ch, ci) => {
            const charDelay = ci / (shardCount + 1) * 0.5
            const charT = Math.max(0, Math.min(1, (enterProgress - charDelay) / 0.5))
            const eased = easeOutCubic(charT)

            const angle = pseudoRandom(ci * 41 + index * 7) * 360
            const dist = 200 + pseudoRandom(ci * 73) * 150
            const startX = Math.cos(angle * Math.PI / 180) * dist * (1 - eased)
            const startY = Math.sin(angle * Math.PI / 180) * dist * (1 - eased)
            const rotation = (1 - eased) * (pseudoRandom(ci * 29) * 180 - 90)
            const charOpacity = Math.min(1, charT * 3)

            return (
              <span
                key={ci}
                style={{
                  display: 'inline-block',
                  fontFamily: "'Inter', 'Helvetica Neue', sans-serif",
                  fontSize: 'clamp(40px, 12vw, 150px)',
                  fontWeight: 800,
                  color,
                  transform: `translate(${startX}px, ${startY}px) rotate(${rotation}deg)`,
                  opacity: charOpacity,
                  textShadow: `0 0 10px ${color}44`,
                }}
              >
                {ch}
              </span>
            )
          })}
        </div>
      )
    } else if (phase === 'hold') {
      // Text sits on glass, crack lines radiate from impact point
      const crackIntensity = Math.min(1, holdProgress * 3)
      const numCracks = 8
      const centerX = width / 2
      const centerY = height / 2

      const crackLines = Array.from({ length: numCracks }, (_, i) => {
        const angle = (i / numCracks) * 360 + pseudoRandom(i * 53 + index) * 30
        const len = (40 + pseudoRandom(i * 37) * 80) * crackIntensity
        const rad = (angle * Math.PI) / 180
        return (
          <div
            key={`crack-${i}`}
            style={{
              position: 'absolute',
              left: centerX,
              top: centerY,
              width: len,
              height: 1,
              background: `linear-gradient(90deg, rgba(255,255,255,${0.25 * crackIntensity}), transparent)`,
              transform: `rotate(${angle}deg)`,
              transformOrigin: 'left center',
              pointerEvents: 'none',
            }}
          />
        )
      })

      // Subtle vibration on hold
      const shake = Math.sin(holdProgress * Math.PI * 6) * 0.5

      return (
        <>
          {crackLines}
          <div
            style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: `translate(-50%, -50%) translateX(${shake}px)`,
              fontFamily: "'Inter', 'Helvetica Neue', sans-serif",
              fontSize: 'clamp(40px, 12vw, 150px)',
              fontWeight: 800,
              color,
              textShadow: `0 0 15px ${color}55, 0 0 30px ${color}22`,
              whiteSpace: 'nowrap',
            }}
          >
            {word}
          </div>
        </>
      )
    } else {
      // Shatter exit: letters become shards that fall with gravity and rotation
      return (
        <div style={{ position: 'absolute', inset: 0 }}>
          {chars.map((ch, ci) => {
            const charDelay = ci / (shardCount + 1) * 0.2
            const charT = Math.max(0, Math.min(1, (exitProgress - charDelay) / 0.8))

            // Each shard has unique trajectory
            const horizVel = (pseudoRandom(ci * 61 + index) - 0.5) * 300
            const gravity = 600 * charT * charT // Accelerating fall
            const rotation = charT * (pseudoRandom(ci * 89) * 720 - 360)
            const charOpacity = Math.max(0, 1 - charT * 1.2)

            const baseX = width / 2 - (chars.length * 40) / 2 + ci * 40
            const shardX = baseX + horizVel * charT
            const shardY = height / 2 + gravity

            return (
              <span
                key={ci}
                style={{
                  position: 'absolute',
                  left: shardX,
                  top: shardY,
                  display: 'inline-block',
                  fontFamily: "'Inter', 'Helvetica Neue', sans-serif",
                  fontSize: 'clamp(40px, 12vw, 150px)',
                  fontWeight: 800,
                  color,
                  transform: `translate(-50%, -50%) rotate(${rotation}deg)`,
                  opacity: charOpacity,
                  textShadow: `0 0 8px ${color}33`,
                }}
              >
                {ch}
              </span>
            )
          })}
        </div>
      )
    }
  },
}

function ShatterGlassComponent(props: MotionGraphicProps<ShatterGlassConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-shatter-glass',
  title: 'Kinetic Shatter Glass',
  description: 'Text on glass that cracks on impact with radiating fracture lines, then shatters into falling shards with gravity and rotation',
  tags: ['kinetic', 'typography', 'shatter', 'glass', 'break', 'crack', 'impact', 'dramatic'],
  category: 'captions',
  component: ShatterGlassComponent as any,
  defaultConfig: {
    words: ['BREAK', 'CRACK', 'SMASH', 'BURST'],
    colors: ['#E0E7FF', '#C7D2FE', '#A5B4FC', '#818CF8'],
    bgColor: '#0c0c14',
    cycleDuration: 1.5,
  },
  configSchema: [
    { key: 'words', label: 'Words', type: 'text-array', defaultValue: ['BREAK', 'CRACK', 'SMASH', 'BURST'], group: 'Content' },
    { key: 'colors', label: 'Colors', type: 'text-array', defaultValue: ['#E0E7FF', '#C7D2FE', '#A5B4FC', '#818CF8'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#0c0c14', group: 'Style' },
    { key: 'cycleDuration', label: 'Cycle Duration (s)', type: 'number', defaultValue: 1.5, min: 0.3, max: 5, group: 'Timing' },
  ],
})
