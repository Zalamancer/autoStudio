import { registerMotionGraphic } from '../registry'
import {
  KineticBase,
  type KineticBaseConfig,
  type KineticAnimation,
  type WordRenderProps,
  type BackgroundRenderProps,
} from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface EmojiReactionConfig extends KineticBaseConfig {}

function bounceEase(t: number): number {
  if (t < 1 / 2.75) return 7.5625 * t * t
  if (t < 2 / 2.75) {
    t -= 1.5 / 2.75
    return 7.5625 * t * t + 0.75
  }
  if (t < 2.5 / 2.75) {
    t -= 2.25 / 2.75
    return 7.5625 * t * t + 0.9375
  }
  t -= 2.625 / 2.75
  return 7.5625 * t * t + 0.984375
}

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
  }: WordRenderProps) => {
    let opacity = 1
    let emojiScale = 1
    let emojiRotate = 0
    let emojiY = 0
    let textY = 0
    let textOpacity = 1
    // Squash/stretch values
    let scaleX = 1
    let scaleY = 1

    if (phase === 'enter') {
      opacity = Math.min(1, enterProgress * 3)
      // Bounce in from top with squash/stretch
      const bounced = bounceEase(enterProgress)
      emojiY = (1 - bounced) * -(height * 0.5)
      emojiScale = 0.3 + bounced * 0.7

      // Stretch while falling
      if (enterProgress < 0.5) {
        scaleX = 0.85
        scaleY = 1.2
      }
      // Squash on landing
      if (enterProgress > 0.7 && enterProgress < 0.85) {
        const squashT = (enterProgress - 0.7) / 0.15
        scaleX = 1 + squashT * 0.3
        scaleY = 1 - squashT * 0.25
      } else if (enterProgress >= 0.85) {
        // Recover from squash
        const recoverT = (enterProgress - 0.85) / 0.15
        scaleX = 1.3 - recoverT * 0.3
        scaleY = 0.75 + recoverT * 0.25
      }

      // Text slides up below
      textY = 30 * (1 - enterProgress)
      textOpacity = enterProgress
    } else if (phase === 'hold') {
      opacity = 1
      // Wiggle rotation during hold
      emojiRotate = Math.sin(holdProgress * Math.PI * 8) * 12
      // Subtle scale pulse
      emojiScale = 1 + Math.sin(holdProgress * Math.PI * 4) * 0.08
    } else {
      // Exit: emoji flies up, text fades
      opacity = 1 - exitProgress
      emojiY = -exitProgress * height * 0.4
      emojiScale = 1 + exitProgress * 0.5
      emojiRotate = exitProgress * 30
      textOpacity = 1 - exitProgress
      textY = exitProgress * 20
    }

    return (
      <div
        style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          opacity,
        }}
      >
        {/* Giant Emoji */}
        <div
          style={{
            fontSize: 'clamp(60px, 20vw, 200px)',
            lineHeight: 1,
            transform: `translateY(${emojiY}px) scale(${emojiScale}) scaleX(${scaleX}) scaleY(${scaleY}) rotate(${emojiRotate}deg)`,
            filter: 'drop-shadow(0 4px 12px rgba(0,0,0,0.3))',
            marginBottom: '16px',
          }}
        >
          {word}
        </div>

        {/* Label text below */}
        <div
          style={{
            fontFamily: "'Fredoka One', 'Comic Sans MS', cursive, sans-serif",
            fontSize: 'clamp(18px, 5vw, 48px)',
            fontWeight: 700,
            color,
            opacity: textOpacity,
            transform: `translateY(${textY}px)`,
            textShadow: '2px 2px 0 rgba(0,0,0,0.2)',
            whiteSpace: 'nowrap',
          }}
        >
          {word}
        </div>
      </div>
    )
  },
}

function EmojiReactionComponent(props: MotionGraphicProps<EmojiReactionConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-emoji-reaction',
  title: 'Emoji Reaction',
  description:
    'Giant emoji bounces in with squash/stretch physics, wiggles on hold. TikTok-native reaction style.',
  tags: ['kinetic', 'emoji', 'reaction', 'bounce', 'tiktok', 'fun', 'playful'],
  category: 'captions',
  component: EmojiReactionComponent as any,
  defaultConfig: {
    words: ['\u{1F525}', '\u{1F602}', '\u{1F480}', '\u{1F451}'],
    colors: ['#FF6B6B', '#FFE66D', '#4ECDC4', '#A78BFA'],
    bgColor: '#1a1a2e',
    cycleDuration: 1,
  },
  configSchema: [
    {
      key: 'words',
      label: 'Emojis',
      type: 'text-array',
      defaultValue: ['\u{1F525}', '\u{1F602}', '\u{1F480}', '\u{1F451}'],
      group: 'Content',
    },
    {
      key: 'colors',
      label: 'Text Colors',
      type: 'text-array',
      defaultValue: ['#FF6B6B', '#FFE66D', '#4ECDC4', '#A78BFA'],
      group: 'Style',
    },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#1a1a2e', group: 'Style' },
    {
      key: 'cycleDuration',
      label: 'Cycle Duration (s)',
      type: 'number',
      defaultValue: 1,
      min: 0.3,
      max: 5,
      group: 'Timing',
    },
  ],
})
