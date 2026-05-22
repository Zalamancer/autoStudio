import { registerMotionGraphic } from '../registry'
import {
  KineticBase,
  type KineticBaseConfig,
  type KineticAnimation,
  type WordRenderProps,
  type BackgroundRenderProps,
} from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface HashtagDropConfig extends KineticBaseConfig {
  hashtagColor: string
  trailCount: number
}

function seededRand(seed: number): number {
  const x = Math.sin(seed * 127.1 + 311.7) * 43758.5453
  return x - Math.floor(x)
}

const animation: KineticAnimation = {
  renderBackground: ({ bgColor, width, height, frame }: BackgroundRenderProps) => {
    const floatingTags = Array.from({ length: 12 }).map((_, i) => {
      const x = seededRand(i * 37 + 5) * 100
      const baseY = ((frame * (0.3 + seededRand(i * 19) * 0.5) + seededRand(i * 53) * height) % (height + 60)) - 30
      const opacity = 0.06 + seededRand(i * 71) * 0.08
      const size = 10 + seededRand(i * 23) * 8
      return (
        <div
          key={i}
          style={{
            position: 'absolute',
            left: `${x}%`,
            top: baseY,
            fontSize: size,
            color: '#FFFFFF',
            opacity,
            fontFamily: "'Helvetica Neue', Arial, sans-serif",
            fontWeight: 700,
          }}
        >
          #
        </div>
      )
    })

    return (
      <div style={{ position: 'absolute', inset: 0, background: bgColor }}>
        {floatingTags}
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
    height,
    config,
  }: WordRenderProps) => {
    const cfg = config as HashtagDropConfig
    const trailCount = cfg?.trailCount ?? 4
    const hashtagColor = cfg?.hashtagColor ?? '#FF6B9D'

    const dropHeight = height * 0.8
    let opacity = 1
    let y = 0
    let scale = 1
    let rotation = 0

    if (phase === 'enter') {
      // Drop from above with gravity curve
      const t = enterProgress
      const eased = t < 0.6
        ? Math.pow(t / 0.6, 2) // accelerate down
        : 1 - Math.pow((t - 0.6) / 0.4, 2) * 0.15 // slight bounce back

      y = -dropHeight + eased * dropHeight
      opacity = Math.min(1, t * 3)
      scale = 0.5 + eased * 0.5
      rotation = (1 - t) * (index % 2 === 0 ? 15 : -15)
    } else if (phase === 'hold') {
      y = 0
      // Gentle floating bob
      const bob = Math.sin(holdProgress * Math.PI * 4) * 6
      y = bob
      scale = 1 + Math.sin(holdProgress * Math.PI * 6) * 0.03
    } else {
      // Exit: drop below with spin
      const t = exitProgress
      y = t * t * dropHeight * 0.6
      opacity = 1 - t
      rotation = t * 30 * (index % 2 === 0 ? 1 : -1)
      scale = 1 - t * 0.3
    }

    // Motion trail for entering
    const trails = phase === 'enter' && enterProgress < 0.7
      ? Array.from({ length: trailCount }).map((_, i) => {
          const trailY = y - (i + 1) * 25
          const trailOpacity = (1 - enterProgress) * (1 - (i / trailCount)) * 0.3
          return (
            <div
              key={`trail-${i}`}
              style={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: `translate(-50%, calc(-50% + ${trailY}px)) scale(${0.9 - i * 0.1})`,
                fontFamily: "'Helvetica Neue', Arial, sans-serif",
                fontSize: 'clamp(36px, 10vw, 120px)',
                fontWeight: 900,
                color,
                opacity: trailOpacity,
                whiteSpace: 'nowrap',
                filter: `blur(${(i + 1) * 2}px)`,
              }}
            >
              #{word}
            </div>
          )
        })
      : null

    return (
      <>
        {trails}
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: `translate(-50%, calc(-50% + ${y}px)) scale(${scale}) rotate(${rotation}deg)`,
            opacity,
          }}
        >
          <div
            style={{
              fontFamily: "'Helvetica Neue', Arial, sans-serif",
              fontSize: 'clamp(36px, 10vw, 120px)',
              fontWeight: 900,
              whiteSpace: 'nowrap',
              display: 'flex',
              alignItems: 'baseline',
            }}
          >
            <span style={{ color: hashtagColor, marginRight: 4 }}>#</span>
            <span
              style={{
                color,
                textShadow: `0 4px 20px ${color}40, 0 0 60px ${color}20`,
              }}
            >
              {word}
            </span>
          </div>
          {/* Impact line on landing */}
          {phase === 'enter' && enterProgress > 0.55 && enterProgress < 0.85 && (
            <div
              style={{
                position: 'absolute',
                bottom: -8,
                left: '10%',
                right: '10%',
                height: 3,
                borderRadius: 2,
                background: `linear-gradient(90deg, transparent, ${hashtagColor}, transparent)`,
                opacity: 1 - (enterProgress - 0.55) / 0.3,
              }}
            />
          )}
        </div>
      </>
    )
  },
}

function HashtagDropComponent(props: MotionGraphicProps<HashtagDropConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-hashtag-drop',
  title: 'Kinetic Hashtag Drop',
  description:
    'Hashtag text drops from above with gravity, motion trails, and impact lines. Social media native with floating # background.',
  tags: ['kinetic', 'typography', 'hashtag', 'social-media', 'drop', 'instagram', 'tiktok'],
  category: 'captions',
  component: HashtagDropComponent as any,
  defaultConfig: {
    words: ['TRENDING', 'VIRAL', 'FYP', 'CREATOR'],
    colors: ['#FF6B9D', '#C084FC', '#60A5FA', '#34D399'],
    bgColor: '#0F0F1A',
    cycleDuration: 1.3,
    hashtagColor: '#FF6B9D',
    trailCount: 4,
  },
  configSchema: [
    { key: 'words', label: 'Words', type: 'text-array', defaultValue: ['TRENDING', 'VIRAL', 'FYP', 'CREATOR'], group: 'Content' },
    { key: 'colors', label: 'Colors', type: 'text-array', defaultValue: ['#FF6B9D', '#C084FC', '#60A5FA', '#34D399'], group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#0F0F1A', group: 'Style' },
    { key: 'hashtagColor', label: 'Hashtag Color', type: 'color', defaultValue: '#FF6B9D', group: 'Style' },
    { key: 'trailCount', label: 'Trail Count', type: 'number', defaultValue: 4, min: 0, max: 8, group: 'Animation' },
    { key: 'cycleDuration', label: 'Cycle Duration (s)', type: 'number', defaultValue: 1.3, min: 0.3, max: 5, group: 'Timing' },
  ],
})
