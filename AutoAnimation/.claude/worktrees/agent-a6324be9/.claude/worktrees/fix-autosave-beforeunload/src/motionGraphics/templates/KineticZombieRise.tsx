import { registerMotionGraphic } from '../registry'
import { KineticBase, type KineticBaseConfig, type KineticAnimation, type WordRenderProps, type BackgroundRenderProps } from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface ZombieRiseConfig extends KineticBaseConfig {}

function rand(s: number): number {
  const x = Math.sin(s * 127.1 + 311.7) * 43758.5453
  return x - Math.floor(x)
}

const animation: KineticAnimation = {
  renderBackground: ({ bgColor, width, height, frame }: BackgroundRenderProps) => {
    const f = frame ?? 0

    // Ground level at ~65%
    const groundY = 65

    // Fog drifting over the ground
    const fogOffset = (f * 0.3) % 200

    // Reaching hands from below ground
    const hands = Array.from({ length: 4 }, (_, i) => {
      const handX = 15 + i * 22 + rand(i * 37) * 8
      const handRise = Math.sin(f * 0.04 + i * 1.5) * 3
      const handOpacity = 0.08 + rand(i * 11) * 0.06

      return (
        <div
          key={`hand-${i}`}
          style={{
            position: 'absolute',
            left: `${handX}%`,
            top: `${groundY - 2 + handRise}%`,
            width: 8,
            height: 25,
            background: 'linear-gradient(to top, transparent, rgba(80, 90, 60, 0.5), rgba(60, 70, 45, 0.2))',
            borderRadius: '40% 40% 0 0',
            opacity: handOpacity,
            transform: `rotate(${-10 + rand(i * 19) * 20}deg)`,
          }}
        />
      )
    })

    return (
      <div style={{ position: 'absolute', inset: 0 }}>
        {/* Sky */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: `linear-gradient(to bottom, #0a0810 0%, #1a1020 40%, ${bgColor} 60%, #1a1510 100%)`,
          }}
        />
        {/* Moon */}
        <div
          style={{
            position: 'absolute',
            top: '8%',
            right: '15%',
            width: 40,
            height: 40,
            borderRadius: '50%',
            background: 'radial-gradient(circle, #eeeedd, #ccccaa 60%, transparent)',
            boxShadow: '0 0 30px rgba(200, 200, 150, 0.15)',
            opacity: 0.5,
          }}
        />
        {/* Ground */}
        <div
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            top: `${groundY}%`,
            bottom: 0,
            background: 'linear-gradient(to bottom, #1a1a10, #0d0d08)',
          }}
        />
        {hands}
        {/* Fog */}
        <div
          style={{
            position: 'absolute',
            left: `${-50 + fogOffset}%`,
            top: `${groundY - 8}%`,
            width: '200%',
            height: '20%',
            background: 'radial-gradient(ellipse, rgba(60, 70, 60, 0.2), transparent 60%)',
          }}
        />
        <div
          style={{
            position: 'absolute',
            left: `${50 - fogOffset * 0.5}%`,
            top: `${groundY - 5}%`,
            width: '150%',
            height: '15%',
            background: 'radial-gradient(ellipse, rgba(50, 60, 50, 0.15), transparent 50%)',
          }}
        />
      </div>
    )
  },

  renderWord: ({ word, color, enterProgress, exitProgress, phase, holdProgress, index, frame }: WordRenderProps) => {
    const f = frame ?? 0
    const seed = index * 103 + 41

    let mainOpacity = 0
    let riseOffset = 0
    let rotateZ = 0
    let clipPercent = 100 // clip from bottom

    if (phase === 'enter') {
      // Rise from below like a zombie emerging from the ground
      const eased = 1 - Math.pow(1 - enterProgress, 3)
      riseOffset = (1 - eased) * 120
      mainOpacity = enterProgress
      rotateZ = (1 - eased) * (rand(seed) > 0.5 ? 5 : -5)
      clipPercent = 100 - eased * 100
    } else if (phase === 'hold') {
      mainOpacity = 1
      // Shambling wobble
      riseOffset = Math.sin(holdProgress * Math.PI * 3) * 3
      rotateZ = Math.sin(holdProgress * Math.PI * 2) * 1.5
    } else {
      // Sink back down
      mainOpacity = 1 - exitProgress
      riseOffset = exitProgress * 80
      rotateZ = exitProgress * 3
      clipPercent = exitProgress * 60
    }

    // Dirt particles during rise
    const particles = phase === 'enter'
      ? Array.from({ length: 8 }, (_, i) => {
          const pSeed = seed + i * 53
          const pProgress = Math.max(0, (enterProgress - rand(pSeed) * 0.5) / 0.5)
          const px = (rand(pSeed + 1) - 0.5) * 80
          const py = -pProgress * 40 * (0.5 + rand(pSeed + 2) * 0.5)
          const size = 2 + rand(pSeed + 3) * 4

          return (
            <div
              key={`p-${i}`}
              style={{
                position: 'absolute',
                left: `calc(50% + ${px}px)`,
                top: `calc(65% + ${py}px)`,
                width: size,
                height: size,
                borderRadius: '50%',
                background: '#4a4a30',
                opacity: pProgress > 0 ? (1 - pProgress) * 0.5 : 0,
              }}
            />
          )
        })
      : null

    return (
      <>
        {particles}
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: `translate(-50%, calc(-50% + ${riseOffset}px)) rotate(${rotateZ}deg)`,
            opacity: mainOpacity,
            fontFamily: "Impact, 'Arial Black', sans-serif",
            fontSize: 'clamp(40px, 12vw, 160px)',
            fontWeight: 900,
            textTransform: 'uppercase',
            color,
            textShadow: '0 0 15px rgba(80, 120, 40, 0.4), 0 4px 8px rgba(0, 0, 0, 0.9)',
            whiteSpace: 'nowrap',
            zIndex: 1,
            clipPath: clipPercent > 0 ? `inset(0 0 ${clipPercent}% 0)` : undefined,
          }}
        >
          {word}
        </div>
      </>
    )
  },
}

function ZombieRiseComponent(props: MotionGraphicProps<ZombieRiseConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-zombie-rise',
  title: 'Kinetic Zombie Rise',
  description: 'Text rises from the ground like the undead, with graveyard background, fog, reaching hands, and dirt particles',
  tags: ['kinetic', 'typography', 'horror', 'zombie', 'undead', 'graveyard', 'creepy', 'dark'],
  category: 'captions',
  component: ZombieRiseComponent as any,
  defaultConfig: {
    words: ['RISE', 'UNDEAD', 'HUNGER', 'BRAINS'],
    colors: ['#6B8E23', '#556B2F', '#8FBC8F', '#4F6228'],
    bgColor: '#0a0a06',
    cycleDuration: 1.4,
  },
  configSchema: [
    { key: 'words', label: 'Words', type: 'text-array', defaultValue: ['RISE', 'UNDEAD', 'HUNGER', 'BRAINS'], group: 'Content' },
    { key: 'colors', label: 'Colors', type: 'text-array', defaultValue: ['#6B8E23', '#556B2F', '#8FBC8F', '#4F6228'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#0a0a06', group: 'Style' },
    { key: 'cycleDuration', label: 'Cycle Duration (s)', type: 'number', defaultValue: 1.4, min: 0.3, max: 5, group: 'Timing' },
  ],
})
