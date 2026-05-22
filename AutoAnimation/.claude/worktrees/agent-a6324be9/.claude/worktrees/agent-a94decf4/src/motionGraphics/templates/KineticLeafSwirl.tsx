import { registerMotionGraphic } from '../registry'
import {
  KineticBase,
  type KineticBaseConfig,
  type KineticAnimation,
  type WordRenderProps,
  type BackgroundRenderProps,
} from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface LeafSwirlConfig extends KineticBaseConfig {
  leafCount: number
}

function seededRandom(seed: number): number {
  const x = Math.sin(seed * 127.1 + 311.7) * 43758.5453
  return x - Math.floor(x)
}

function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3)
}

const leafShapes = ['\u{1F343}', '\u{1F33F}', '\u{1F342}', '\u{2618}']
const leafColors = ['#4CAF50', '#66BB6A', '#81C784', '#388E3C', '#2E7D32']

const animation: KineticAnimation = {
  renderBackground: ({ bgColor }: BackgroundRenderProps) => (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        background: `radial-gradient(ellipse at 50% 120%, ${bgColor}, #0a1f0a)`,
      }}
    />
  ),

  renderWord: ({
    word,
    color,
    enterProgress,
    holdProgress,
    exitProgress,
    phase,
    index,
    frame = 0,
  }: WordRenderProps) => {
    let opacity = 1
    let textScale = 1

    if (phase === 'enter') {
      opacity = easeOutCubic(enterProgress)
      textScale = 0.6 + easeOutCubic(enterProgress) * 0.4
    } else if (phase === 'hold') {
      textScale = 1 + Math.sin(holdProgress * Math.PI * 3) * 0.03
    } else {
      opacity = 1 - easeOutCubic(exitProgress)
      textScale = 1 - exitProgress * 0.3
    }

    const leafCount = 16
    const time = frame * 0.04
    const leaves: Array<{
      angle: number
      radius: number
      size: number
      char: string
      rotSpeed: number
      phaseOffset: number
      leafColor: string
    }> = []

    for (let i = 0; i < leafCount; i++) {
      const seed = index * 200 + i * 13
      leaves.push({
        angle: (i / leafCount) * Math.PI * 2,
        radius: 80 + seededRandom(seed + 1) * 100,
        size: 14 + seededRandom(seed + 2) * 18,
        char: leafShapes[Math.floor(seededRandom(seed + 3) * leafShapes.length)],
        rotSpeed: 0.5 + seededRandom(seed + 4) * 1.5,
        phaseOffset: seededRandom(seed + 5) * Math.PI * 2,
        leafColor: leafColors[Math.floor(seededRandom(seed + 6) * leafColors.length)],
      })
    }

    const swirlActive = phase === 'hold' || (phase === 'enter' && enterProgress > 0.3)
    const swirlOpacity =
      phase === 'enter'
        ? Math.max(0, (enterProgress - 0.3) / 0.7)
        : phase === 'exit'
          ? 1 - exitProgress
          : 1

    return (
      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          opacity,
        }}
      >
        {/* Swirling leaves */}
        {swirlActive &&
          leaves.map((leaf, i) => {
            const currentAngle = leaf.angle + time * leaf.rotSpeed + leaf.phaseOffset
            const radiusPulse = leaf.radius + Math.sin(time * 2 + leaf.phaseOffset) * 15
            const x = Math.cos(currentAngle) * radiusPulse
            const y = Math.sin(currentAngle) * radiusPulse * 0.6
            const selfRotate = time * 60 + leaf.phaseOffset * 57
            const leafScale = 0.7 + Math.sin(time * 1.5 + leaf.phaseOffset) * 0.3

            return (
              <div
                key={i}
                style={{
                  position: 'absolute',
                  left: `calc(50% + ${x}px)`,
                  top: `calc(50% + ${y}px)`,
                  fontSize: `${leaf.size}px`,
                  opacity: swirlOpacity * (0.6 + Math.sin(time * leaf.rotSpeed + leaf.phaseOffset) * 0.4),
                  transform: `translate(-50%, -50%) rotate(${selfRotate}deg) scale(${leafScale})`,
                  pointerEvents: 'none',
                  filter: `drop-shadow(0 2px 4px rgba(0,0,0,0.3))`,
                }}
              >
                {leaf.char}
              </div>
            )
          })}

        {/* Soft green glow behind text */}
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            width: '300px',
            height: '120px',
            transform: 'translate(-50%, -50%)',
            background: 'radial-gradient(ellipse, rgba(76,175,80,0.25) 0%, transparent 70%)',
            filter: 'blur(20px)',
            pointerEvents: 'none',
          }}
        />

        {/* Main text */}
        <div
          style={{
            fontFamily: "'Georgia', 'Palatino', serif",
            fontSize: 'clamp(36px, 10vw, 130px)',
            fontWeight: 700,
            color,
            transform: `scale(${textScale})`,
            textShadow: `0 2px 12px rgba(76,175,80,0.4), 0 0 30px rgba(76,175,80,0.15)`,
            whiteSpace: 'nowrap',
            position: 'relative',
            zIndex: 1,
          }}
        >
          {word}
        </div>
      </div>
    )
  },
}

function LeafSwirlComponent(props: MotionGraphicProps<LeafSwirlConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-leaf-swirl',
  title: 'Leaf Swirl',
  description:
    'Text surrounded by swirling leaves orbiting in a natural elliptical pattern. Leaves rotate, pulse, and drift organically around the words.',
  tags: ['kinetic', 'leaf', 'nature', 'eco', 'green', 'organic', 'sustainability', 'swirl'],
  category: 'captions',
  component: LeafSwirlComponent as any,
  defaultConfig: {
    words: ['NATURE', 'GREEN', 'EARTH', 'GROW'],
    colors: ['#A5D6A7', '#81C784', '#C8E6C9', '#66BB6A'],
    bgColor: '#0D1F0D',
    cycleDuration: 1.5,
    leafCount: 16,
  },
  configSchema: [
    {
      key: 'words',
      label: 'Words',
      type: 'text-array',
      defaultValue: ['NATURE', 'GREEN', 'EARTH', 'GROW'],
      group: 'Content',
    },
    {
      key: 'colors',
      label: 'Colors',
      type: 'text-array',
      defaultValue: ['#A5D6A7', '#81C784', '#C8E6C9', '#66BB6A'],
      group: 'Style',
    },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#0D1F0D', group: 'Style' },
    {
      key: 'cycleDuration',
      label: 'Cycle Duration (s)',
      type: 'number',
      defaultValue: 1.5,
      min: 0.5,
      max: 5,
      group: 'Timing',
    },
    {
      key: 'leafCount',
      label: 'Leaf Count',
      type: 'number',
      defaultValue: 16,
      min: 6,
      max: 30,
      group: 'Animation',
    },
  ],
})
