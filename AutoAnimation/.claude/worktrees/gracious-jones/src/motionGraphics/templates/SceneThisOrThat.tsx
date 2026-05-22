import { registerMotionGraphic } from '../registry'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface ThisOrThatConfig {
  bgColor: string
  leftColor: string
  rightColor: string
  vsColor: string
  textColor: string
  leftEmoji: string
  rightEmoji: string
  leftLabel: string
  rightLabel: string
  title: string
}

function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3)
}

function easeOutBack(t: number): number {
  const c1 = 1.70158
  const c3 = c1 + 1
  return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2)
}

function easeInCubic(t: number): number {
  return t * t * t
}

function ThisOrThatComponent({
  config,
  progress,
  frame,
  fps,
}: MotionGraphicProps<ThisOrThatConfig>) {
  const { bgColor, leftColor, rightColor, vsColor, textColor, leftEmoji, rightEmoji, leftLabel, rightLabel, title } = config

  // Phase calculations
  const enterProgress = progress < 0.2 ? progress / 0.2 : 1
  const holdProgress = progress >= 0.2 && progress < 0.8 ? (progress - 0.2) / 0.6 : progress >= 0.8 ? 1 : 0
  const exitProgress = progress >= 0.8 ? (progress - 0.8) / 0.2 : 0

  // Sides slam in from left/right
  const leftSlide = enterProgress < 1
    ? -100 + easeOutCubic(enterProgress) * 100
    : exitProgress > 0
      ? -100 * easeInCubic(exitProgress)
      : 0
  const rightSlide = enterProgress < 1
    ? 100 - easeOutCubic(enterProgress) * 100
    : exitProgress > 0
      ? 100 * easeInCubic(exitProgress)
      : 0

  // VS badge appears after sides meet
  const vsDelay = 0.6
  const vsEnter = enterProgress < 1
    ? Math.max(0, (enterProgress - vsDelay) / (1 - vsDelay))
    : 1
  const vsScale = vsEnter < 1
    ? easeOutBack(vsEnter)
    : exitProgress > 0
      ? 1 - easeOutCubic(exitProgress)
      : 1
  const vsRotate = vsEnter < 1 ? 360 * (1 - vsEnter) : 0

  // Hold: sides pulse alternately
  const leftPulse = holdProgress > 0 ? 1 + Math.sin(holdProgress * Math.PI * 3) * 0.03 : 1
  const rightPulse = holdProgress > 0 ? 1 + Math.cos(holdProgress * Math.PI * 3) * 0.03 : 1

  // Title
  const titleOpacity = enterProgress < 1
    ? easeOutCubic(Math.max(0, (enterProgress - 0.3) / 0.7))
    : exitProgress > 0
      ? 1 - easeOutCubic(exitProgress)
      : 1

  // Emoji entrance (staggered after sides)
  const emojiDelay = 0.4
  const emojiEnter = enterProgress < 1
    ? Math.max(0, (enterProgress - emojiDelay) / (1 - emojiDelay))
    : 1
  const emojiScale = easeOutBack(Math.min(1, emojiEnter))

  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        overflow: 'hidden',
        background: bgColor,
      }}
    >
      {/* Title at top */}
      <div
        style={{
          position: 'absolute',
          top: '6%',
          left: '50%',
          transform: 'translateX(-50%)',
          fontFamily: "'Fredoka One', 'Comic Sans MS', cursive, sans-serif",
          fontSize: 'clamp(16px, 4.5vw, 36px)',
          fontWeight: 700,
          color: textColor,
          opacity: titleOpacity,
          textAlign: 'center',
          zIndex: 10,
          textShadow: '0 2px 8px rgba(0,0,0,0.3)',
        }}
      >
        {title}
      </div>

      {/* Left side */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '50%',
          height: '100%',
          background: leftColor,
          transform: `translateX(${leftSlide}%) scale(${leftPulse})`,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 'clamp(8px, 2vw, 20px)',
        }}
      >
        <div
          style={{
            fontSize: 'clamp(40px, 12vw, 100px)',
            lineHeight: 1,
            transform: `scale(${emojiScale})`,
            filter: 'drop-shadow(0 4px 8px rgba(0,0,0,0.2))',
          }}
        >
          {leftEmoji}
        </div>
        <div
          style={{
            fontFamily: "'Fredoka One', 'Comic Sans MS', cursive, sans-serif",
            fontSize: 'clamp(14px, 4vw, 32px)',
            fontWeight: 700,
            color: textColor,
            textShadow: '0 2px 4px rgba(0,0,0,0.2)',
            opacity: emojiEnter,
            textAlign: 'center',
            padding: '0 8%',
          }}
        >
          {leftLabel}
        </div>
      </div>

      {/* Right side */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          right: 0,
          width: '50%',
          height: '100%',
          background: rightColor,
          transform: `translateX(${rightSlide}%) scale(${rightPulse})`,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 'clamp(8px, 2vw, 20px)',
        }}
      >
        <div
          style={{
            fontSize: 'clamp(40px, 12vw, 100px)',
            lineHeight: 1,
            transform: `scale(${emojiScale})`,
            filter: 'drop-shadow(0 4px 8px rgba(0,0,0,0.2))',
          }}
        >
          {rightEmoji}
        </div>
        <div
          style={{
            fontFamily: "'Fredoka One', 'Comic Sans MS', cursive, sans-serif",
            fontSize: 'clamp(14px, 4vw, 32px)',
            fontWeight: 700,
            color: textColor,
            textShadow: '0 2px 4px rgba(0,0,0,0.2)',
            opacity: emojiEnter,
            textAlign: 'center',
            padding: '0 8%',
          }}
        >
          {rightLabel}
        </div>
      </div>

      {/* VS badge */}
      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: `translate(-50%, -50%) scale(${vsScale}) rotate(${vsRotate}deg)`,
          width: 'clamp(48px, 12vw, 90px)',
          height: 'clamp(48px, 12vw, 90px)',
          borderRadius: '50%',
          background: vsColor,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: `0 4px 20px rgba(0,0,0,0.4), 0 0 30px ${vsColor}60`,
          zIndex: 10,
        }}
      >
        <span
          style={{
            fontFamily: "'Fredoka One', 'Comic Sans MS', cursive, sans-serif",
            fontSize: 'clamp(16px, 4vw, 32px)',
            fontWeight: 900,
            color: '#ffffff',
            textShadow: '0 1px 3px rgba(0,0,0,0.3)',
          }}
        >
          VS
        </span>
      </div>
    </div>
  )
}

registerMotionGraphic({
  id: 'tpl-scene-this-or-that',
  title: 'This or That',
  description:
    '"This or That?" split-screen game with two emoji options and a VS badge. Sides slam in and pulse alternately.',
  tags: ['scene', 'versus', 'this-or-that', 'poll', 'game', 'interactive', 'fun', 'emoji'],
  category: 'scene-layout',
  component: ThisOrThatComponent as any,
  defaultConfig: {
    bgColor: '#0f0f23',
    leftColor: '#FF6B6B',
    rightColor: '#4ECDC4',
    vsColor: '#FFE66D',
    textColor: '#ffffff',
    leftEmoji: '\u{1F355}',
    rightEmoji: '\u{1F354}',
    leftLabel: 'Pizza',
    rightLabel: 'Burger',
    title: 'This or That?',
  },
  configSchema: [
    { key: 'title', label: 'Title', type: 'text', defaultValue: 'This or That?', group: 'Content' },
    { key: 'leftEmoji', label: 'Left Emoji', type: 'text', defaultValue: '\u{1F355}', group: 'Content' },
    { key: 'rightEmoji', label: 'Right Emoji', type: 'text', defaultValue: '\u{1F354}', group: 'Content' },
    { key: 'leftLabel', label: 'Left Label', type: 'text', defaultValue: 'Pizza', group: 'Content' },
    { key: 'rightLabel', label: 'Right Label', type: 'text', defaultValue: 'Burger', group: 'Content' },
    { key: 'leftColor', label: 'Left Color', type: 'color', defaultValue: '#FF6B6B', group: 'Style' },
    { key: 'rightColor', label: 'Right Color', type: 'color', defaultValue: '#4ECDC4', group: 'Style' },
    { key: 'vsColor', label: 'VS Badge Color', type: 'color', defaultValue: '#FFE66D', group: 'Style' },
    { key: 'textColor', label: 'Text Color', type: 'color', defaultValue: '#ffffff', group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#0f0f23', group: 'Style' },
  ],
})
