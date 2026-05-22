import { registerMotionGraphic } from '../registry'
import { KineticBase, type KineticBaseConfig, type KineticAnimation, type WordRenderProps, type BackgroundRenderProps } from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

// Trending Aesthetic 2025: Mob Wife — bold condensed serif, fur texture, animal print energy
// The animation mechanic: words SLAM in with heavy weight, scale punch, then strut out

interface MobWifeConfig extends KineticBaseConfig {}

const animation: KineticAnimation = {
  renderBackground: ({ frame, fps }: BackgroundRenderProps) => {
    const time = frame / fps
    // Leopard-print inspired background spots
    const spots = Array.from({ length: 20 }, (_, i) => {
      const seed = i * 137.5
      const x = ((seed * 13) % 100)
      const y = ((seed * 7 + 33) % 100)
      const size = 3 + (seed % 8)
      const opacity = 0.05 + (seed % 3) * 0.02
      return (
        <div
          key={i}
          style={{
            position: 'absolute',
            left: `${x}%`,
            top: `${y}%`,
            width: size * 2,
            height: size,
            borderRadius: '50%',
            background: `rgba(180,120,0,${opacity})`,
            transform: `rotate(${seed % 60 - 30}deg)`,
          }}
        />
      )
    })

    // Subtle fur texture via repeating stripes
    const _ = time
    return (
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: 'linear-gradient(180deg, #1a0a0a 0%, #2d0d0d 50%, #1a0a0a 100%)',
        }}
      >
        {spots}
        {/* Gold bar accent at top and bottom */}
        <div style={{ position: 'absolute', left: 0, right: 0, top: 0, height: 4, background: 'linear-gradient(90deg, transparent, #c9a84c, #f0d060, #c9a84c, transparent)' }} />
        <div style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: 4, background: 'linear-gradient(90deg, transparent, #c9a84c, #f0d060, #c9a84c, transparent)' }} />
      </div>
    )
  },

  renderWord: ({ word, color, enterProgress, exitProgress, phase, index }: WordRenderProps) => {
    // Heavy impact SLAM: compress in from above, overshoot, settle
    const easeOutBack = (t: number) => {
      const c1 = 1.70158
      const c3 = c1 + 1
      return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2)
    }

    let opacity = 0
    let translateY = 0
    let scaleX = 1
    let scaleY = 1
    let skewX = 0

    if (phase === 'enter') {
      const e = easeOutBack(Math.min(enterProgress, 1))
      opacity = Math.min(enterProgress * 3, 1)
      translateY = (1 - e) * -80
      scaleY = 0.6 + e * 0.4
      scaleX = 1.2 - e * 0.2
      skewX = (1 - e) * -4
    } else if (phase === 'hold') {
      opacity = 1
      translateY = 0
      scaleX = 1
      scaleY = 1
      skewX = Math.sin(index * 1.3) * 0.5  // slight tilt, very mob wife
    } else {
      opacity = 1 - Math.pow(exitProgress, 2)
      translateY = exitProgress * 20
      scaleX = 1 + exitProgress * 0.05
    }

    // Multi-stroke bold condensed — the mob wife signature
    return (
      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: `translate(-50%, -50%) translateY(${translateY}px) scaleX(${scaleX}) scaleY(${scaleY}) skewX(${skewX}deg)`,
          opacity,
          fontFamily: "'Impact', 'Arial Narrow', 'Helvetica Neue Condensed', sans-serif",
          fontSize: 'clamp(50px, 14vw, 180px)',
          fontWeight: 900,
          fontStyle: 'italic',
          textTransform: 'uppercase',
          letterSpacing: -2,
          color,
          textShadow: `
            3px 3px 0 #c9a84c,
            6px 6px 0 rgba(0,0,0,0.5),
            0 0 40px rgba(201,168,76,0.3)
          `,
          whiteSpace: 'nowrap',
        }}
      >
        {word}
      </div>
    )
  },
}

function MobWifeComponent(props: MotionGraphicProps<MobWifeConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-mob-wife',
  title: 'Kinetic Mob Wife',
  description: 'Mob wife aesthetic: bold italic condensed serif slams in from above with gold drop shadow and leopard-print background',
  tags: ['kinetic', 'typography', 'mob wife', 'bold', 'serif', 'dramatic', 'aesthetic', '2025'],
  category: 'captions',
  component: MobWifeComponent as any,
  defaultConfig: {
    words: ['RICH', 'BOLD', 'LOUD', 'ICONIC'],
    colors: ['#f0d060', '#ffffff', '#c9a84c', '#ff4444'],
    bgColor: '#1a0a0a',
    cycleDuration: 1.1,
  },
  configSchema: [
    { key: 'words', label: 'Words', type: 'text-array', defaultValue: ['RICH', 'BOLD', 'LOUD', 'ICONIC'], group: 'Content' },
    { key: 'colors', label: 'Colors', type: 'text-array', defaultValue: ['#f0d060', '#ffffff', '#c9a84c', '#ff4444'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#1a0a0a', group: 'Style' },
    { key: 'cycleDuration', label: 'Cycle Duration (s)', type: 'number', defaultValue: 1.1, min: 0.3, max: 5, group: 'Timing' },
  ],
})
