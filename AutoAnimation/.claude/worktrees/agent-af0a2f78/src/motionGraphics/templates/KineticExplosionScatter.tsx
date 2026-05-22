import { registerMotionGraphic } from '../registry'
import {
  KineticBase,
  type KineticBaseConfig,
  type KineticAnimation,
  type WordRenderProps,
  type BackgroundRenderProps,
} from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface ExplosionScatterConfig extends KineticBaseConfig {}

function pseudoRandom(seed: number): number {
  return Math.abs(Math.sin(seed * 127.1 + 311.7) * 43758.5453) % 1
}

function easeOutExpo(t: number): number {
  return t === 1 ? 1 : 1 - Math.pow(2, -10 * t)
}

const animation: KineticAnimation = {
  renderBackground: ({ bgColor, width, height, frame, fps }: BackgroundRenderProps) => {
    const time = frame / fps
    return (
      <div style={{ position: 'absolute', inset: 0, background: bgColor }}>
        {/* Radial flash burst — simulates the explosion flash */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: `radial-gradient(ellipse at 50% 50%, rgba(255,200,50,${Math.max(0, 0.08 - time % 2 * 0.04)}) 0%, transparent 60%)`,
          }}
        />
        {/* Particle debris */}
        {Array.from({ length: 20 }, (_, i) => {
          const angle = pseudoRandom(i * 37) * Math.PI * 2
          const speed = 40 + pseudoRandom(i * 59) * 80
          const lifespan = 1.2 + pseudoRandom(i * 83) * 0.8
          const phase = (time * 0.8 + pseudoRandom(i * 23)) % lifespan
          const dist = easeOutExpo(phase / lifespan) * speed * lifespan
          const x = width / 2 + Math.cos(angle) * dist
          const y = height / 2 + Math.sin(angle) * dist + phase * 20 // gravity
          const alpha = Math.max(0, 1 - phase / lifespan)
          const size = 2 + pseudoRandom(i * 71) * 3
          return (
            <div
              key={i}
              style={{
                position: 'absolute',
                left: x,
                top: y,
                width: size,
                height: size,
                borderRadius: '50%',
                background: `rgba(255,180,30,${alpha * 0.7})`,
                boxShadow: `0 0 ${size * 2}px rgba(255,150,0,${alpha * 0.4})`,
              }}
            />
          )
        })}
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
    width,
    height,
  }: WordRenderProps) => {
    const chars = word.split('')
    const numChars = chars.length

    // Per-character explosion angles — each char flies to a unique direction
    const charData = chars.map((ch, ci) => {
      const angle = (ci / numChars) * Math.PI * 2 + pseudoRandom(index * 53 + ci * 31) * 0.8
      const distance = width * (0.45 + pseudoRandom(index * 71 + ci * 47) * 0.35)
      const yDrift = height * (0.3 + pseudoRandom(index * 97 + ci * 13) * 0.3)
      const spinAmount = (pseudoRandom(ci * 43 + index * 17) - 0.5) * 720
      return { ch, angle, distance, yDrift, spinAmount }
    })

    const charElements = charData.map(({ ch, angle, distance, yDrift, spinAmount }, ci) => {
      let charX = 0
      let charY = 0
      let charRotate = 0
      let charOpacity = 1
      let charScale = 1

      if (phase === 'enter') {
        // Flash from center: start gathered, then burst outward fast,
        // then snap back inward to final positions
        if (enterProgress < 0.15) {
          // Flash: text assembles from nothing, huge scale pop
          const flash = enterProgress / 0.15
          charScale = flash * 3.5
          charOpacity = flash
          charX = 0
          charY = 0
        } else if (enterProgress < 0.5) {
          // Explosion: chars fly outward
          const t = easeOutExpo((enterProgress - 0.15) / 0.35)
          charX = Math.cos(angle) * distance * t
          charY = Math.sin(angle) * distance * t + yDrift * t
          charRotate = spinAmount * t
          charScale = 1 + (1 - t) * 1.5
          charOpacity = 1
        } else {
          // Gravity: letters freeze, then slowly fall (still scattered)
          const t = (enterProgress - 0.5) / 0.5
          charX = Math.cos(angle) * distance
          charY = Math.sin(angle) * distance + yDrift + t * 30
          charRotate = spinAmount
          charOpacity = 1 - t * 0.3
          charScale = 0.85
        }
      } else if (phase === 'hold') {
        // Scattered letters remain out, slowly drifting with gravity
        charX = Math.cos(angle) * distance
        charY = Math.sin(angle) * distance + yDrift + holdProgress * 40
        charRotate = spinAmount + holdProgress * 15
        charOpacity = 1 - holdProgress * 0.4
        charScale = 0.85
      } else {
        // Exit: letters fall away off-screen with acceleration
        const t = exitProgress * exitProgress
        charX = Math.cos(angle) * distance * (1 + t)
        charY = Math.sin(angle) * distance + yDrift + t * height
        charRotate = spinAmount + exitProgress * 180
        charOpacity = 1 - exitProgress
        charScale = 0.85 - exitProgress * 0.3
      }

      return (
        <div
          key={ci}
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: `translate(calc(-50% + ${charX}px), calc(-50% + ${charY}px)) rotate(${charRotate}deg) scale(${charScale})`,
            opacity: charOpacity,
            fontFamily: "'Impact', 'Arial Black', sans-serif",
            fontSize: 'clamp(48px, 13vw, 180px)',
            fontWeight: 900,
            color,
            textShadow: `2px 2px 0 rgba(0,0,0,0.7), 0 0 20px ${color}60`,
            userSelect: 'none',
          }}
        >
          {ch}
        </div>
      )
    })

    // Central flash on explosion moment
    const flashOpacity = phase === 'enter' && enterProgress < 0.2
      ? (1 - enterProgress / 0.2) * 0.8
      : 0

    return (
      <div style={{ position: 'absolute', inset: 0 }}>
        {/* Explosion flash */}
        {flashOpacity > 0 && (
          <div
            style={{
              position: 'absolute',
              inset: 0,
              background: `radial-gradient(ellipse at 50% 50%, rgba(255,220,100,${flashOpacity}) 0%, transparent 50%)`,
            }}
          />
        )}
        {charElements}
      </div>
    )
  },
}

function ExplosionScatterComponent(props: MotionGraphicProps<ExplosionScatterConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-explosion-scatter',
  title: 'Kinetic Explosion Scatter',
  description:
    'Text explodes from center — letters fly outward with unique angles, spins, and distances. Central flash on detonation, debris particles in background.',
  tags: ['kinetic', 'typography', 'explosion', 'scatter', 'letters', 'burst', 'energy', 'physics'],
  category: 'captions',
  component: ExplosionScatterComponent as any,
  defaultConfig: {
    words: ['BOOM!', 'BANG', 'BLAST', 'POW'],
    colors: ['#FF6600', '#FFCC00', '#FF3300', '#FF9900'],
    bgColor: '#0a0505',
    cycleDuration: 1.8,
  },
  configSchema: [
    {
      key: 'words',
      label: 'Words',
      type: 'text-array',
      defaultValue: ['BOOM!', 'BANG', 'BLAST', 'POW'],
      group: 'Content',
    },
    {
      key: 'colors',
      label: 'Colors',
      type: 'text-array',
      defaultValue: ['#FF6600', '#FFCC00', '#FF3300', '#FF9900'],
      group: 'Style',
    },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#0a0505', group: 'Style' },
    {
      key: 'cycleDuration',
      label: 'Cycle Duration (s)',
      type: 'number',
      defaultValue: 1.8,
      min: 0.8,
      max: 5,
      group: 'Timing',
    },
  ],
})
