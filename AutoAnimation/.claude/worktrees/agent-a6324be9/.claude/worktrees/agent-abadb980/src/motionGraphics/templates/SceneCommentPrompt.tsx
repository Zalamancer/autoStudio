import React from 'react'
import { registerMotionGraphic } from '../registry'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface SceneCommentPromptConfig {
  emoji: string
  promptText: string
  bgColor: string
  textColor: string
  accentColor: string
}

function easeOutCubic(t: number): number { return 1 - Math.pow(1 - t, 3) }
function easeInCubic(t: number): number { return t * t * t }
function bounceEase(t: number): number {
  if (t < 1 / 2.75) return 7.5625 * t * t
  if (t < 2 / 2.75) { t -= 1.5 / 2.75; return 7.5625 * t * t + 0.75 }
  if (t < 2.5 / 2.75) { t -= 2.25 / 2.75; return 7.5625 * t * t + 0.9375 }
  t -= 2.625 / 2.75; return 7.5625 * t * t + 0.984375
}
function easeOutBack(t: number): number {
  const c1 = 1.70158
  const c3 = c1 + 1
  return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2)
}

function SceneCommentPromptComponent({ config, progress, frame, fps }: MotionGraphicProps<SceneCommentPromptConfig>) {
  const { emoji, promptText, bgColor, textColor, accentColor } = config

  const enterProgress = progress < 0.2 ? progress / 0.2 : 1
  const holdProgress = progress >= 0.2 && progress < 0.8 ? (progress - 0.2) / 0.6 : progress >= 0.8 ? 1 : 0
  const exitProgress = progress >= 0.8 ? (progress - 0.8) / 0.2 : 0
  const isHolding = progress >= 0.2 && progress < 0.8

  // Big emoji bounces in
  const emojiEnter = Math.min(1, enterProgress / 0.5)
  const emojiScale = emojiEnter < 1
    ? bounceEase(emojiEnter)
    : exitProgress > 0
      ? 1 - easeInCubic(exitProgress)
      : 1
  const emojiOpacity = emojiEnter < 1
    ? easeOutCubic(emojiEnter)
    : exitProgress > 0
      ? 1 - easeInCubic(exitProgress)
      : 1
  // Floating during hold
  const emojiFloat = isHolding
    ? Math.sin(holdProgress * Math.PI * 6) * 10
    : 0

  // Text slides in below
  const textDelay = 0.35
  const textEnter = enterProgress < 1
    ? Math.max(0, (enterProgress - textDelay) / (1 - textDelay))
    : 1
  const textY = textEnter < 1
    ? 40 * (1 - easeOutCubic(textEnter))
    : exitProgress > 0
      ? 60 * easeInCubic(exitProgress)
      : 0
  const textOpacity = textEnter < 1
    ? easeOutCubic(textEnter)
    : exitProgress > 0
      ? 1 - easeInCubic(exitProgress)
      : 1

  // Comment field slides up from bottom
  const fieldDelay = 0.55
  const fieldEnter = enterProgress < 1
    ? Math.max(0, (enterProgress - fieldDelay) / (1 - fieldDelay))
    : 1
  const fieldY = fieldEnter < 1
    ? 80 * (1 - easeOutCubic(fieldEnter))
    : exitProgress > 0
      ? 80 * easeInCubic(exitProgress)
      : 0
  const fieldOpacity = fieldEnter < 1
    ? easeOutCubic(fieldEnter)
    : exitProgress > 0
      ? 1 - easeInCubic(exitProgress)
      : 1

  // Blinking cursor
  const cursorVisible = isHolding
    ? Math.sin(holdProgress * Math.PI * 16) > 0
    : true

  const bgOpacity = enterProgress < 1
    ? easeOutCubic(enterProgress)
    : exitProgress > 0
      ? 1 - easeInCubic(exitProgress)
      : 1

  return (
    <div style={{ position: 'absolute', inset: 0, overflow: 'hidden' }}>
      <div style={{
        position: 'absolute', inset: 0,
        background: bgColor,
        opacity: bgOpacity,
      }} />

      <div style={{
        position: 'absolute', inset: 0,
        display: 'flex', flexDirection: 'column',
        justifyContent: 'center', alignItems: 'center',
        padding: '8%',
        gap: 'clamp(16px, 4vw, 36px)',
      }}>
        {/* Big emoji */}
        <div style={{
          fontSize: 'clamp(64px, 16vw, 140px)',
          lineHeight: 1,
          transform: `scale(${emojiScale}) translateY(${emojiFloat}px)`,
          opacity: emojiOpacity,
        }}>
          {emoji}
        </div>

        {/* Prompt text */}
        <div style={{
          fontFamily: "'Inter', 'Helvetica Neue', sans-serif",
          fontSize: 'clamp(20px, 5vw, 48px)',
          fontWeight: 800,
          color: textColor,
          textAlign: 'center',
          lineHeight: 1.3,
          maxWidth: '85%',
          transform: `translateY(${textY}px)`,
          opacity: textOpacity,
        }}>
          {promptText}
        </div>

        {/* Fake comment input field */}
        <div style={{
          transform: `translateY(${fieldY}px)`,
          opacity: fieldOpacity,
          width: '80%',
          maxWidth: '500px',
        }}>
          <div style={{
            background: 'rgba(255,255,255,0.08)',
            border: `2px solid ${accentColor}60`,
            borderRadius: '12px',
            padding: 'clamp(12px, 3vw, 24px) clamp(16px, 4vw, 28px)',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}>
            <span style={{
              fontFamily: "'Inter', 'Helvetica Neue', sans-serif",
              fontSize: 'clamp(12px, 3vw, 20px)',
              color: 'rgba(255,255,255,0.35)',
              flex: 1,
            }}>
              Add a comment...
            </span>
            {/* Blinking cursor */}
            <div style={{
              width: '2px',
              height: 'clamp(16px, 3vw, 24px)',
              background: accentColor,
              opacity: cursorVisible ? 1 : 0,
              borderRadius: '1px',
            }} />
          </div>

          {/* Send button */}
          <div style={{
            display: 'flex', justifyContent: 'flex-end',
            marginTop: 'clamp(8px, 2vw, 14px)',
          }}>
            <div style={{
              background: accentColor,
              color: '#ffffff',
              fontFamily: "'Inter', 'Helvetica Neue', sans-serif",
              fontSize: 'clamp(10px, 2.5vw, 16px)',
              fontWeight: 600,
              padding: '0.4em 1.5em',
              borderRadius: '20px',
              opacity: 0.8,
            }}>
              Post
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

registerMotionGraphic({
  id: 'tpl-scene-comment-prompt',
  title: 'Comment Prompt',
  description: 'Engaging comment prompt with bouncing emoji, slide-in text, and fake comment field with blinking cursor',
  tags: ['scene', 'social', 'cta', 'comment', 'engagement', 'emoji'],
  category: 'scene-layout',
  component: SceneCommentPromptComponent as any,
  defaultConfig: {
    emoji: '\uD83D\uDD25',
    promptText: 'Drop this in the comments!',
    bgColor: '#1a0a2e',
    textColor: '#ffffff',
    accentColor: '#9333ea',
  },
  configSchema: [
    { key: 'emoji', label: 'Emoji', type: 'text', defaultValue: '\uD83D\uDD25', group: 'Content' },
    { key: 'promptText', label: 'Prompt Text', type: 'text', defaultValue: 'Drop this in the comments!', group: 'Content' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#1a0a2e', group: 'Style' },
    { key: 'textColor', label: 'Text Color', type: 'color', defaultValue: '#ffffff', group: 'Style' },
    { key: 'accentColor', label: 'Accent Color', type: 'color', defaultValue: '#9333ea', group: 'Style' },
  ],
})
