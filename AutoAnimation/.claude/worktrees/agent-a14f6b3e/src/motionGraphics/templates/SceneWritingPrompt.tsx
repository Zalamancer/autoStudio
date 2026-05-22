import React from 'react'
import { registerMotionGraphic } from '../registry'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface SceneWritingPromptConfig {
  promptText: string
  genre: string
  difficulty: string
  wordGoal: number
  tipText: string
  bgColor: string
  textColor: string
  accentColor: string
  promptBgColor: string
}

function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3)
}
function easeInCubic(t: number): number {
  return t * t * t
}
function easeOutBack(t: number): number {
  const c1 = 1.70158
  const c3 = c1 + 1
  return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2)
}

function SceneWritingPromptComponent({ config, progress }: MotionGraphicProps<SceneWritingPromptConfig>) {
  const { promptText, genre, difficulty, wordGoal, tipText, bgColor, textColor, accentColor, promptBgColor } = config

  const enterProgress = progress < 0.25 ? progress / 0.25 : 1
  const holdProgress = progress >= 0.25 && progress < 0.8 ? (progress - 0.25) / 0.55 : progress >= 0.8 ? 1 : 0
  const exitProgress = progress >= 0.8 ? (progress - 0.8) / 0.2 : 0

  const headerReveal = easeOutCubic(Math.min(1, enterProgress / 0.3))
  const promptReveal = easeOutCubic(Math.max(0, Math.min(1, (enterProgress - 0.15) / 0.5)))
  const tagsReveal = easeOutCubic(Math.max(0, Math.min(1, (enterProgress - 0.45) / 0.35)))
  const tipReveal = easeOutCubic(Math.max(0, Math.min(1, (enterProgress - 0.65) / 0.3)))
  const buttonReveal = easeOutBack(Math.max(0, Math.min(1, (enterProgress - 0.75) / 0.2)))

  // Hold: cursor blink effect
  const cursorVisible = holdProgress > 0 ? Math.sin(holdProgress * Math.PI * 8) > 0 : false

  const exitEased = easeInCubic(exitProgress)
  const exitOpacity = 1 - exitEased

  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        overflow: 'hidden',
        background: bgColor,
        fontFamily: "'Georgia', 'Palatino Linotype', serif",
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '6%',
      }}
    >
      {/* Paper lines texture */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background:
            'repeating-linear-gradient(0deg, transparent, transparent 26px, rgba(139,109,76,0.04) 26px, rgba(139,109,76,0.04) 27px)',
        }}
      />

      <div
        style={{
          width: '100%',
          maxWidth: 460,
          display: 'flex',
          flexDirection: 'column',
          gap: 'clamp(12px, 2.5vw, 22px)',
          opacity: exitOpacity,
          transform: `scale(${1 - exitEased * 0.12})`,
        }}
      >
        {/* Header */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 'clamp(8px, 1.5vw, 14px)',
            opacity: headerReveal,
            transform: `translateY(${(1 - headerReveal) * 15}px)`,
          }}
        >
          <div style={{ fontSize: 'clamp(20px, 4vw, 32px)' }}>{'\u270F\uFE0F'}</div>
          <div>
            <div
              style={{
                fontSize: 'clamp(8px, 1.3vw, 10px)',
                fontFamily: "'Inter', sans-serif",
                textTransform: 'uppercase',
                letterSpacing: '0.12em',
                color: accentColor,
              }}
            >
              Creative Challenge
            </div>
            <div
              style={{
                fontSize: 'clamp(18px, 4vw, 30px)',
                fontWeight: 700,
                color: textColor,
                lineHeight: 1.1,
              }}
            >
              Writing Prompt
            </div>
          </div>
        </div>

        {/* Prompt card */}
        <div
          style={{
            background: promptBgColor,
            borderRadius: 'clamp(8px, 1.5vw, 14px)',
            padding: 'clamp(16px, 3vw, 28px)',
            border: `1px solid ${accentColor}20`,
            boxShadow: `0 4px 16px rgba(0,0,0,0.15)`,
            opacity: promptReveal,
            transform: `translateY(${(1 - promptReveal) * 15}px)`,
            position: 'relative',
          }}
        >
          {/* Red margin line */}
          <div
            style={{
              position: 'absolute',
              left: 'clamp(30px, 6vw, 50px)',
              top: 0,
              bottom: 0,
              width: 1,
              background: 'rgba(200,60,60,0.15)',
            }}
          />
          <div
            style={{
              fontSize: 'clamp(14px, 2.8vw, 22px)',
              fontStyle: 'italic',
              color: textColor,
              lineHeight: 1.6,
              paddingLeft: 'clamp(20px, 4vw, 36px)',
            }}
          >
            {promptText}
            {/* Typing cursor */}
            {cursorVisible && (
              <span
                style={{
                  display: 'inline-block',
                  width: 2,
                  height: '1em',
                  background: accentColor,
                  marginLeft: 2,
                  verticalAlign: 'text-bottom',
                }}
              />
            )}
          </div>
        </div>

        {/* Tags */}
        <div
          style={{
            display: 'flex',
            gap: 'clamp(6px, 1vw, 10px)',
            flexWrap: 'wrap',
            opacity: tagsReveal,
            transform: `translateY(${(1 - tagsReveal) * 8}px)`,
          }}
        >
          <div
            style={{
              background: `${accentColor}15`,
              color: accentColor,
              fontSize: 'clamp(9px, 1.4vw, 12px)',
              fontFamily: "'Inter', sans-serif",
              fontWeight: 600,
              padding: 'clamp(3px, 0.5vw, 5px) clamp(10px, 1.5vw, 14px)',
              borderRadius: 100,
              border: `1px solid ${accentColor}25`,
            }}
          >
            {genre}
          </div>
          <div
            style={{
              background: `${textColor}08`,
              color: `${textColor}70`,
              fontSize: 'clamp(9px, 1.4vw, 12px)',
              fontFamily: "'Inter', sans-serif",
              fontWeight: 600,
              padding: 'clamp(3px, 0.5vw, 5px) clamp(10px, 1.5vw, 14px)',
              borderRadius: 100,
              border: `1px solid ${textColor}12`,
            }}
          >
            {difficulty}
          </div>
          <div
            style={{
              background: `${textColor}08`,
              color: `${textColor}70`,
              fontSize: 'clamp(9px, 1.4vw, 12px)',
              fontFamily: "'Inter', sans-serif",
              fontWeight: 600,
              padding: 'clamp(3px, 0.5vw, 5px) clamp(10px, 1.5vw, 14px)',
              borderRadius: 100,
              border: `1px solid ${textColor}12`,
            }}
          >
            {wordGoal} words
          </div>
        </div>

        {/* Writing tip */}
        <div
          style={{
            display: 'flex',
            alignItems: 'flex-start',
            gap: 'clamp(6px, 1vw, 10px)',
            background: `${accentColor}08`,
            borderRadius: 'clamp(6px, 1vw, 10px)',
            padding: 'clamp(10px, 2vw, 16px)',
            border: `1px solid ${accentColor}15`,
            opacity: tipReveal,
            transform: `translateY(${(1 - tipReveal) * 8}px)`,
          }}
        >
          <div style={{ fontSize: 'clamp(12px, 2vw, 18px)', flexShrink: 0 }}>{'\uD83D\uDCA1'}</div>
          <div
            style={{
              fontSize: 'clamp(10px, 1.6vw, 13px)',
              color: `${textColor}70`,
              lineHeight: 1.5,
              fontFamily: "'Inter', sans-serif",
            }}
          >
            <span style={{ fontWeight: 700, color: accentColor }}>Tip: </span>
            {tipText}
          </div>
        </div>

        {/* Start writing button */}
        <div
          style={{
            background: accentColor,
            color: bgColor,
            fontSize: 'clamp(11px, 1.8vw, 15px)',
            fontWeight: 800,
            fontFamily: "'Inter', sans-serif",
            textTransform: 'uppercase',
            letterSpacing: '0.1em',
            padding: 'clamp(10px, 1.8vw, 16px)',
            borderRadius: 'clamp(6px, 1vw, 10px)',
            textAlign: 'center',
            opacity: buttonReveal,
            transform: `scale(${buttonReveal})`,
            boxShadow: `0 4px 12px ${accentColor}30`,
          }}
        >
          Start Writing
        </div>
      </div>
    </div>
  )
}

registerMotionGraphic({
  id: 'tpl-scene-writing-prompt',
  title: 'Writing Prompt',
  description:
    'Creative writing prompt card with notebook-style prompt area, blinking cursor, genre/difficulty tags, writing tip, and CTA button',
  tags: ['scene', 'writing', 'prompt', 'creative', 'book', 'author', 'literary', 'literature'],
  category: 'scene-layout',
  component: SceneWritingPromptComponent as any,
  defaultConfig: {
    promptText: 'A librarian discovers that every book returned to the library has had its ending changed overnight...',
    genre: 'Mystery',
    difficulty: 'Intermediate',
    wordGoal: 1500,
    tipText: 'Start in the middle of the action. Let the backstory unfold naturally through dialogue.',
    bgColor: '#1a150e',
    textColor: '#f5edd6',
    accentColor: '#C9A96E',
    promptBgColor: '#221c14',
  },
  configSchema: [
    { key: 'promptText', label: 'Prompt', type: 'text', defaultValue: 'A librarian discovers that every book returned to the library has had its ending changed overnight...', group: 'Content' },
    { key: 'genre', label: 'Genre', type: 'text', defaultValue: 'Mystery', group: 'Content' },
    { key: 'difficulty', label: 'Difficulty', type: 'text', defaultValue: 'Intermediate', group: 'Content' },
    { key: 'wordGoal', label: 'Word Goal', type: 'number', defaultValue: 1500, min: 100, max: 50000, group: 'Content' },
    { key: 'tipText', label: 'Writing Tip', type: 'text', defaultValue: 'Start in the middle of the action. Let the backstory unfold naturally through dialogue.', group: 'Content' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#1a150e', group: 'Style' },
    { key: 'textColor', label: 'Text Color', type: 'color', defaultValue: '#f5edd6', group: 'Style' },
    { key: 'accentColor', label: 'Accent Color', type: 'color', defaultValue: '#C9A96E', group: 'Style' },
    { key: 'promptBgColor', label: 'Prompt Card Color', type: 'color', defaultValue: '#221c14', group: 'Style' },
  ],
})
