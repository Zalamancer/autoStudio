import { useMemo } from 'react'
import { registerMotionGraphic } from '../registry'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface EmojiRainConfig {
  bgColor: string
  emojis: string[]
  count: number
  speed: number
}

function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3)
}

// Seeded pseudo-random for deterministic rendering
function seededRandom(seed: number): number {
  const x = Math.sin(seed * 127.1 + 311.7) * 43758.5453
  return x - Math.floor(x)
}

function EmojiRainComponent({ config, progress, frame, fps, width, height }: MotionGraphicProps<EmojiRainConfig>) {
  const { bgColor, emojis, count, speed } = config

  // Phase calculations
  const enterProgress = progress < 0.15 ? progress / 0.15 : 1
  const exitProgress = progress >= 0.85 ? (progress - 0.85) / 0.15 : 0

  // Generate deterministic emoji positions
  const particles = useMemo(() => {
    const items: Array<{
      emoji: string
      x: number
      startDelay: number
      fallSpeed: number
      size: number
      rotation: number
      wobbleSpeed: number
      wobbleAmount: number
    }> = []
    for (let i = 0; i < count; i++) {
      items.push({
        emoji: emojis[Math.floor(seededRandom(i * 3 + 1) * emojis.length)],
        x: seededRandom(i * 7 + 2) * 100,
        startDelay: seededRandom(i * 11 + 3) * 0.8,
        fallSpeed: 0.6 + seededRandom(i * 13 + 4) * 0.8,
        size: 20 + seededRandom(i * 17 + 5) * 30,
        rotation: seededRandom(i * 19 + 6) * 360,
        wobbleSpeed: 2 + seededRandom(i * 23 + 7) * 4,
        wobbleAmount: 10 + seededRandom(i * 29 + 8) * 20,
      })
    }
    return items
  }, [count, emojis])

  const timeSeconds = frame / fps

  // Overall opacity for enter/exit
  const globalOpacity =
    enterProgress < 1 ? easeOutCubic(enterProgress) : exitProgress > 0 ? 1 - easeOutCubic(exitProgress) : 1

  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        overflow: 'hidden',
        background: bgColor === 'transparent' ? 'transparent' : bgColor,
        opacity: globalOpacity,
      }}
    >
      {particles.map((p, i) => {
        // Calculate fall position based on time
        const adjustedTime = Math.max(0, timeSeconds * speed - p.startDelay)
        const fallCycle = (adjustedTime * p.fallSpeed) % 1.5
        const yPos = -10 + fallCycle * 110 // -10% to 100%+
        const wobble = Math.sin(adjustedTime * p.wobbleSpeed) * p.wobbleAmount
        const rotate = p.rotation + adjustedTime * 60

        // Don't render if not yet started
        if (adjustedTime <= 0) return null

        return (
          <div
            key={i}
            style={{
              position: 'absolute',
              left: `${p.x}%`,
              top: `${yPos}%`,
              fontSize: `${p.size}px`,
              transform: `translateX(${wobble}px) rotate(${rotate}deg)`,
              opacity: yPos > 90 ? Math.max(0, 1 - (yPos - 90) / 10) : 1,
              pointerEvents: 'none',
            }}
          >
            {p.emoji}
          </div>
        )
      })}
    </div>
  )
}

registerMotionGraphic({
  id: 'tpl-scene-emoji-rain',
  title: 'Emoji Rain',
  description: 'Emoji rain overlay with multiple emoji falling from the top. Configurable emojis, count, and speed.',
  tags: ['scene', 'emoji', 'rain', 'overlay', 'fun', 'celebration', 'particles'],
  category: 'scene-layout',
  component: EmojiRainComponent as any,
  defaultConfig: {
    bgColor: 'transparent',
    emojis: ['\u{1F389}', '\u2728', '\u{1F525}', '\u2764\uFE0F', '\u{1F602}'],
    count: 25,
    speed: 1,
  },
  configSchema: [
    {
      key: 'emojis',
      label: 'Emojis',
      type: 'text-array',
      defaultValue: ['\u{1F389}', '\u2728', '\u{1F525}', '\u2764\uFE0F', '\u{1F602}'],
      group: 'Content',
    },
    { key: 'count', label: 'Emoji Count', type: 'number', defaultValue: 25, min: 5, max: 80, group: 'Animation' },
    { key: 'speed', label: 'Fall Speed', type: 'number', defaultValue: 1, min: 0.3, max: 3, group: 'Animation' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: 'transparent', group: 'Style' },
  ],
})
