import { registerMotionGraphic } from '../registry'
import {
  KineticBase,
  type KineticBaseConfig,
  type KineticAnimation,
  type WordRenderProps,
  type BackgroundRenderProps,
} from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface SparkleTextConfig extends KineticBaseConfig {
  sparkleCount: number
}

// Seeded pseudo-random for deterministic sparkle positions
function seededRandom(seed: number): number {
  const x = Math.sin(seed * 127.1 + 311.7) * 43758.5453
  return x - Math.floor(x)
}

function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3)
}

const sparkleChars = ['\u2726', '\u2728', '\u2605', '\u00B7']

const animation: KineticAnimation = {
  renderBackground: ({ bgColor }: BackgroundRenderProps) => (
    <div style={{ position: 'absolute', inset: 0, background: bgColor }} />
  ),

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
    frame = 0,
  }: WordRenderProps) => {
    let opacity = 1
    let textScale = 1
    let textGlow = 0

    if (phase === 'enter') {
      opacity = easeOutCubic(enterProgress)
      textScale = 0.5 + easeOutCubic(enterProgress) * 0.5
      textGlow = enterProgress * 20
    } else if (phase === 'hold') {
      opacity = 1
      textScale = 1
      textGlow = 10 + Math.sin(holdProgress * Math.PI * 4) * 8
    } else {
      opacity = 1 - easeOutCubic(exitProgress)
      textScale = 1 + exitProgress * 0.3
      textGlow = 10 * (1 - exitProgress)
    }

    // Generate sparkle particles around text
    const sparkleCount = 12
    const sparkles: Array<{
      x: number
      y: number
      size: number
      char: string
      phaseOffset: number
      speed: number
    }> = []
    for (let i = 0; i < sparkleCount; i++) {
      sparkles.push({
        x: (seededRandom(index * 100 + i * 7 + 1) - 0.5) * 280,
        y: (seededRandom(index * 100 + i * 7 + 2) - 0.5) * 160,
        size: 10 + seededRandom(index * 100 + i * 7 + 3) * 20,
        char: sparkleChars[Math.floor(seededRandom(index * 100 + i * 7 + 4) * sparkleChars.length)],
        phaseOffset: seededRandom(index * 100 + i * 7 + 5) * Math.PI * 2,
        speed: 2 + seededRandom(index * 100 + i * 7 + 6) * 4,
      })
    }

    // Sparkle visibility based on frame for twinkling
    const time = frame * 0.05

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
        {/* Sparkle particles */}
        {(phase === 'hold' || (phase === 'enter' && enterProgress > 0.5)) &&
          sparkles.map((s, i) => {
            const sparkleOpacity = (Math.sin(time * s.speed + s.phaseOffset) + 1) / 2
            // Scale sparkle: appears and disappears
            const sparkleScale = sparkleOpacity > 0.3 ? (sparkleOpacity - 0.3) / 0.7 : 0

            return (
              <div
                key={i}
                style={{
                  position: 'absolute',
                  left: `calc(50% + ${s.x}px)`,
                  top: `calc(50% + ${s.y}px)`,
                  fontSize: `${s.size}px`,
                  color: '#FFD700',
                  opacity:
                    sparkleScale * (phase === 'enter' ? enterProgress : 1) * (phase === 'exit' ? 1 - exitProgress : 1),
                  transform: `scale(${sparkleScale}) rotate(${time * 30 + s.phaseOffset * 57}deg)`,
                  textShadow: `0 0 ${s.size * 0.5}px #FFD700`,
                  pointerEvents: 'none',
                }}
              >
                {s.char}
              </div>
            )
          })}

        {/* Main text */}
        <div
          style={{
            fontFamily: "'Georgia', 'Times New Roman', serif",
            fontSize: 'clamp(36px, 10vw, 130px)',
            fontWeight: 700,
            color,
            transform: `scale(${textScale})`,
            textShadow: `0 0 ${textGlow}px ${color}, 0 0 ${textGlow * 2}px ${color}40`,
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

function SparkleTextComponent(props: MotionGraphicProps<SparkleTextConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-sparkle-text',
  title: 'Sparkle Text',
  description:
    'Text with animated sparkle/twinkle effects. Star shapes appear and disappear around the text. Magical, Disney-esque.',
  tags: ['kinetic', 'sparkle', 'twinkle', 'magic', 'disney', 'stars', 'glamour'],
  category: 'captions',
  component: SparkleTextComponent as any,
  defaultConfig: {
    words: ['MAGIC', 'DREAM', 'SHINE', 'GLOW'],
    colors: ['#FFD700', '#FF69B4', '#87CEEB', '#DDA0DD'],
    bgColor: '#0d0d2b',
    cycleDuration: 1.5,
    sparkleCount: 12,
  },
  configSchema: [
    {
      key: 'words',
      label: 'Words',
      type: 'text-array',
      defaultValue: ['MAGIC', 'DREAM', 'SHINE', 'GLOW'],
      group: 'Content',
    },
    {
      key: 'colors',
      label: 'Colors',
      type: 'text-array',
      defaultValue: ['#FFD700', '#FF69B4', '#87CEEB', '#DDA0DD'],
      group: 'Style',
    },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#0d0d2b', group: 'Style' },
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
      key: 'sparkleCount',
      label: 'Sparkle Count',
      type: 'number',
      defaultValue: 12,
      min: 4,
      max: 30,
      group: 'Animation',
    },
  ],
})
