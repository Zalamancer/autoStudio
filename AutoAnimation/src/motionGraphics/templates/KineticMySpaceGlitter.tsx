import { registerMotionGraphic } from '../registry'
import {
  KineticBase,
  type KineticBaseConfig,
  type KineticAnimation,
  type WordRenderProps,
  type BackgroundRenderProps,
} from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface MySpaceGlitterConfig extends KineticBaseConfig {}

// Deterministic pseudo-random helpers
function fract(x: number): number {
  return x - Math.floor(x)
}
function seededRand(seed: number): number {
  return fract(Math.sin(seed * 127.1 + 311.7) * 43758.5453)
}

// Glitter sparkle positions — 30 fixed sparkles on the background
const SPARKLE_COUNT = 30
const SPARKLES = Array.from({ length: SPARKLE_COUNT }, (_, i) => ({
  x: seededRand(i * 17 + 3) * 100,
  y: seededRand(i * 31 + 7) * 100,
  size: 4 + seededRand(i * 53 + 13) * 10,
  speed: 0.8 + seededRand(i * 71 + 19) * 1.4,
  offset: seededRand(i * 43 + 29) * Math.PI * 2,
  color: ['#FF69B4', '#FF1493', '#FFD700', '#00FFFF', '#FF00FF', '#ffffff'][Math.floor(seededRand(i * 97 + 41) * 6)],
}))

// Text sparkles that appear around the word
const TEXT_SPARKLES = Array.from({ length: 12 }, (_, i) => ({
  angle: (i / 12) * Math.PI * 2,
  dist: 0.4 + seededRand(i * 61 + 5) * 0.2,
  size: 6 + seededRand(i * 83 + 11) * 8,
  speed: 1.2 + seededRand(i * 47 + 23) * 1.0,
}))

const animation: KineticAnimation = {
  renderBackground: ({ bgColor, frame, fps }: BackgroundRenderProps) => {
    const time = frame / fps

    return (
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: bgColor,
          overflow: 'hidden',
        }}
      >
        {/* Deep black MySpace background with subtle purple tinge */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: 'radial-gradient(ellipse at 50% 40%, rgba(80,0,80,0.4) 0%, transparent 70%)',
          }}
        />
        {/* Animated background sparkles */}
        {SPARKLES.map((sp, i) => {
          const pulse = (Math.sin(time * sp.speed * Math.PI * 2 + sp.offset) + 1) / 2
          const opacity = 0.3 + pulse * 0.7
          const scale = 0.5 + pulse * 0.8
          return (
            <div
              key={i}
              style={{
                position: 'absolute',
                left: `${sp.x}%`,
                top: `${sp.y}%`,
                width: sp.size,
                height: sp.size,
                transform: `translate(-50%, -50%) scale(${scale}) rotate(${time * 60 * sp.speed}deg)`,
                opacity,
              }}
            >
              {/* Star shape via overlapping bars */}
              <div
                style={{
                  position: 'absolute',
                  inset: 0,
                  background: sp.color,
                  clipPath:
                    'polygon(50% 0%, 61% 35%, 98% 35%, 68% 57%, 79% 91%, 50% 70%, 21% 91%, 32% 57%, 2% 35%, 39% 35%)',
                  filter: `blur(0.5px) drop-shadow(0 0 ${3 * pulse}px ${sp.color})`,
                }}
              />
            </div>
          )
        })}
        {/* GIF-style tiled sparkle border at edges */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            boxShadow: 'inset 0 0 40px rgba(255, 20, 147, 0.15)',
            pointerEvents: 'none',
          }}
        />
      </div>
    )
  },

  renderWord: ({ word, enterProgress, holdProgress, exitProgress, phase, index }: WordRenderProps) => {
    const seed = index * 97 + 13
    let opacity = 1
    let scale = 1
    let translateY = 0

    // MySpace glitter text builds in: letters pop in one-by-one with sparkle
    if (phase === 'enter') {
      opacity = enterProgress
      scale = 0.7 + enterProgress * 0.3 + Math.sin(enterProgress * Math.PI) * 0.1
      translateY = (1 - enterProgress) * 20
    } else if (phase === 'hold') {
      opacity = 1
      scale = 1 + Math.sin(holdProgress * Math.PI * 3) * 0.02
    } else {
      opacity = 1 - exitProgress
      scale = 1 + exitProgress * 0.15
      translateY = exitProgress * -15
    }

    // Rainbow glitter gradient across text — cycles through colors
    const glitterOffset = phase === 'hold' ? holdProgress * 120 : phase === 'enter' ? enterProgress * 60 : 120
    const glitterGradient = `linear-gradient(90deg,
      #FF69B4 ${glitterOffset - 80}%,
      #FFD700 ${glitterOffset - 40}%,
      #FF1493 ${glitterOffset}%,
      #FF69B4 ${glitterOffset + 40}%,
      #FFD700 ${glitterOffset + 80}%,
      #FF1493 ${glitterOffset + 120}%)`

    // Per-word sparkles floating around during hold
    const holdSeed = phase === 'hold' ? holdProgress : 0
    const textSparkles = phase !== 'enter' || enterProgress > 0.5

    return (
      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: `translate(-50%, -50%) translateY(${translateY}px) scale(${scale})`,
          opacity,
          textAlign: 'center',
        }}
      >
        {/* Floating sparkles around text */}
        {textSparkles &&
          TEXT_SPARKLES.map((sp, i) => {
            const angle = sp.angle + holdSeed * sp.speed * Math.PI * 2
            const r = 80 + sp.dist * 60
            const x = Math.cos(angle) * r
            const y = Math.sin(angle) * r * 0.4
            const sparkOpacity =
              phase === 'hold'
                ? 0.5 + Math.sin(holdProgress * sp.speed * Math.PI * 4 + i) * 0.5
                : phase === 'exit'
                  ? (1 - exitProgress) * 0.8
                  : enterProgress * 0.8
            const sparkColors = ['#FF69B4', '#FFD700', '#FF1493', '#00FFFF', '#FF00FF', '#ffffff']
            const spColor = sparkColors[(i + Math.floor(seed / 13)) % sparkColors.length]
            return (
              <div
                key={i}
                style={{
                  position: 'absolute',
                  left: '50%',
                  top: '50%',
                  width: sp.size,
                  height: sp.size,
                  transform: `translate(calc(-50% + ${x}px), calc(-50% + ${y}px)) rotate(${i * 30 + holdSeed * 180}deg)`,
                  opacity: sparkOpacity,
                }}
              >
                <div
                  style={{
                    position: 'absolute',
                    inset: 0,
                    background: spColor,
                    clipPath:
                      'polygon(50% 0%, 61% 35%, 98% 35%, 68% 57%, 79% 91%, 50% 70%, 21% 91%, 32% 57%, 2% 35%, 39% 35%)',
                    filter: `drop-shadow(0 0 3px ${spColor})`,
                  }}
                />
              </div>
            )
          })}
        {/* Glow layer */}
        <div
          style={{
            position: 'absolute',
            inset: -10,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontFamily: "'Comic Sans MS', 'Chalkboard SE', cursive",
            fontSize: 'clamp(36px, 10vw, 130px)',
            fontWeight: 700,
            fontStyle: 'italic',
            whiteSpace: 'nowrap',
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            background: glitterGradient,
            WebkitBackgroundClip: 'text',
            backgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            filter: 'blur(8px)',
            opacity: 0.7,
          }}
        >
          {word}
        </div>
        {/* Main glitter text */}
        <div
          style={{
            position: 'relative',
            fontFamily: "'Comic Sans MS', 'Chalkboard SE', cursive",
            fontSize: 'clamp(36px, 10vw, 130px)',
            fontWeight: 700,
            fontStyle: 'italic',
            whiteSpace: 'nowrap',
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            background: glitterGradient,
            WebkitBackgroundClip: 'text',
            backgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            WebkitTextStroke: '1px rgba(255,105,180,0.3)',
            filter: 'drop-shadow(0 0 6px rgba(255,20,147,0.8)) drop-shadow(0 0 12px rgba(255,215,0,0.5))',
          }}
        >
          {word}
        </div>
        {/* xoxo sparkle caption — classic MySpace style */}
        <div
          style={{
            position: 'absolute',
            bottom: -28,
            left: '50%',
            transform: 'translateX(-50%)',
            fontFamily: "'Comic Sans MS', cursive",
            fontSize: 'clamp(10px, 2.5vw, 20px)',
            color: '#FF69B4',
            whiteSpace: 'nowrap',
            opacity: phase === 'hold' ? 0.8 : phase === 'enter' ? enterProgress * 0.8 : (1 - exitProgress) * 0.8,
            textShadow: '0 0 6px #FF1493',
          }}
        >
          ★ xoxo ★
        </div>
      </div>
    )
  },
}

function MySpaceGlitterComponent(props: MotionGraphicProps<MySpaceGlitterConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-myspace-glitter',
  title: 'Kinetic MySpace Glitter',
  description:
    'MySpace era glitter text: rainbow gradient Comic Sans with animated star sparkles, pink glow, and xoxo caption on black',
  tags: ['kinetic', 'typography', 'myspace', 'glitter', 'sparkle', 'nostalgia', 'internet', 'y2k', '2000s'],
  category: 'captions',
  component: MySpaceGlitterComponent as any,
  defaultConfig: {
    words: ['OMG', 'BFF', 'LMAO', 'LYLAS'],
    colors: ['#FF69B4', '#FFD700', '#FF1493', '#00FFFF'],
    bgColor: '#000000',
    cycleDuration: 1.5,
  },
  configSchema: [
    {
      key: 'words',
      label: 'Words',
      type: 'text-array',
      defaultValue: ['OMG', 'BFF', 'LMAO', 'LYLAS'],
      group: 'Content',
    },
    {
      key: 'colors',
      label: 'Colors',
      type: 'text-array',
      defaultValue: ['#FF69B4', '#FFD700', '#FF1493', '#00FFFF'],
      group: 'Style',
    },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#000000', group: 'Style' },
    {
      key: 'cycleDuration',
      label: 'Cycle Duration (s)',
      type: 'number',
      defaultValue: 1.5,
      min: 0.5,
      max: 5,
      group: 'Timing',
    },
  ],
})
