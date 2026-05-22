import { registerMotionGraphic } from '../registry'
import {
  KineticBase,
  type KineticBaseConfig,
  type KineticAnimation,
  type WordRenderProps,
  type BackgroundRenderProps,
} from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface PartyModeConfig extends KineticBaseConfig {
  partyEmojis: string[]
}

// Seeded pseudo-random for deterministic rendering
function seededRandom(seed: number): number {
  const x = Math.sin(seed * 127.1 + 311.7) * 43758.5453
  return x - Math.floor(x)
}

function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3)
}

const discoColors = ['#FF0080', '#FF4500', '#FFD700', '#00FF00', '#00BFFF', '#8A2BE2', '#FF1493', '#FF6347']

const animation: KineticAnimation = {
  renderBackground: ({ bgColor, frame, fps }: BackgroundRenderProps) => {
    // Strobe effect: rapid background color alternation
    const time = frame / fps
    const strobeSpeed = 8 // color changes per second
    const colorIndex = Math.floor(time * strobeSpeed) % discoColors.length
    const strobeColor = discoColors[colorIndex]

    // Blend between bgColor and strobe
    const strobeMix = 0.3 + Math.abs(Math.sin(time * 12)) * 0.2

    return (
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: `linear-gradient(135deg, ${bgColor} ${(1 - strobeMix) * 100}%, ${strobeColor} 100%)`,
        }}
      />
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
    frame = 0,
  }: WordRenderProps) => {
    let opacity = 1
    let textScale = 1
    let textRotate = 0

    const time = frame * 0.03

    if (phase === 'enter') {
      opacity = easeOutCubic(enterProgress)
      textScale = 0.2 + easeOutCubic(enterProgress) * 0.8
      textRotate = 720 * (1 - easeOutCubic(enterProgress))
    } else if (phase === 'hold') {
      opacity = 1
      textScale = 1 + Math.sin(time * 3) * 0.08
      textRotate = Math.sin(time * 2) * 5
    } else {
      opacity = 1 - easeOutCubic(exitProgress)
      textScale = 1 + exitProgress * 0.5
      textRotate = exitProgress * 360
    }

    // Disco-ball color cycling for text
    const textColorIndex = Math.floor(time * 4) % discoColors.length
    const partyTextColor = phase === 'hold' ? discoColors[textColorIndex] : color

    // Generate floating party emojis
    const partyEmojis = ['\u{1F389}', '\u{1F38A}', '\u{1F973}', '\u{1F388}', '\u2728', '\u{1F386}']
    const emojiCount = 10
    const floatingEmojis: Array<{
      emoji: string
      x: number
      y: number
      size: number
      speed: number
      phaseOffset: number
    }> = []
    for (let i = 0; i < emojiCount; i++) {
      floatingEmojis.push({
        emoji: partyEmojis[Math.floor(seededRandom(index * 50 + i * 7 + 1) * partyEmojis.length)],
        x: seededRandom(index * 50 + i * 7 + 2) * 100,
        y: seededRandom(index * 50 + i * 7 + 3) * 100,
        size: 16 + seededRandom(index * 50 + i * 7 + 4) * 24,
        speed: 1 + seededRandom(index * 50 + i * 7 + 5) * 3,
        phaseOffset: seededRandom(index * 50 + i * 7 + 6) * Math.PI * 2,
      })
    }

    return (
      <div
        style={{
          position: 'absolute',
          inset: 0,
          opacity,
        }}
      >
        {/* Floating party emojis */}
        {floatingEmojis.map((e, i) => {
          const floatY = Math.sin(time * e.speed + e.phaseOffset) * 20
          const floatX = Math.cos(time * e.speed * 0.7 + e.phaseOffset) * 15
          const emojiOpacity = (Math.sin(time * e.speed * 0.5 + e.phaseOffset) + 1) / 2
          const emojiRotate = time * 30 + e.phaseOffset * 57

          return (
            <div
              key={i}
              style={{
                position: 'absolute',
                left: `${e.x}%`,
                top: `${e.y}%`,
                fontSize: `${e.size}px`,
                transform: `translate(${floatX}px, ${floatY}px) rotate(${emojiRotate}deg)`,
                opacity: emojiOpacity * 0.7,
                pointerEvents: 'none',
              }}
            >
              {e.emoji}
            </div>
          )
        })}

        {/* Main text */}
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: `translate(-50%, -50%) scale(${textScale}) rotate(${textRotate}deg)`,
            fontFamily: "'Fredoka One', 'Comic Sans MS', cursive, sans-serif",
            fontSize: 'clamp(40px, 12vw, 150px)',
            fontWeight: 900,
            color: partyTextColor,
            textShadow: `
              0 0 20px ${partyTextColor},
              0 0 40px ${partyTextColor}80,
              4px 4px 0 rgba(0,0,0,0.3)
            `,
            whiteSpace: 'nowrap',
            zIndex: 5,
            letterSpacing: '0.05em',
          }}
        >
          {word}
        </div>
      </div>
    )
  },
}

function PartyModeComponent(props: MotionGraphicProps<PartyModeConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-party-mode',
  title: 'Party Mode',
  description:
    'PARTY vibes! Disco-ball color cycling text, background strobe, and floating party emojis. Maximum fun energy.',
  tags: ['kinetic', 'party', 'disco', 'celebration', 'fun', 'strobe', 'emoji', 'energy'],
  category: 'captions',
  component: PartyModeComponent as any,
  defaultConfig: {
    words: ['PARTY', 'VIBES', "LET'S GO", 'WOOO'],
    colors: ['#FF0080', '#FFD700', '#00FF00', '#00BFFF'],
    bgColor: '#0a0a1a',
    cycleDuration: 1,
    partyEmojis: ['\u{1F389}', '\u{1F38A}', '\u{1F973}'],
  },
  configSchema: [
    {
      key: 'words',
      label: 'Words',
      type: 'text-array',
      defaultValue: ['PARTY', 'VIBES', "LET'S GO", 'WOOO'],
      group: 'Content',
    },
    {
      key: 'colors',
      label: 'Colors',
      type: 'text-array',
      defaultValue: ['#FF0080', '#FFD700', '#00FF00', '#00BFFF'],
      group: 'Style',
    },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#0a0a1a', group: 'Style' },
    {
      key: 'cycleDuration',
      label: 'Cycle Duration (s)',
      type: 'number',
      defaultValue: 1,
      min: 0.3,
      max: 5,
      group: 'Timing',
    },
    {
      key: 'partyEmojis',
      label: 'Party Emojis',
      type: 'text-array',
      defaultValue: ['\u{1F389}', '\u{1F38A}', '\u{1F973}'],
      group: 'Content',
    },
  ],
})
