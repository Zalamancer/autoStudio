import React from 'react'
import { registerMotionGraphic } from '../registry'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface SceneScreenplayConfig {
  sceneHeading: string
  actionLine: string
  characterName: string
  dialogueLine: string
  parenthetical: string
  bgColor: string
  textColor: string
  accentColor: string
}

function easeOutCubic(t: number): number { return 1 - Math.pow(1 - t, 3) }
function easeInCubic(t: number): number { return t * t * t }

function SceneScreenplayComponent({ config, progress }: MotionGraphicProps<SceneScreenplayConfig>) {
  const { sceneHeading, actionLine, characterName, dialogueLine, parenthetical, bgColor, textColor, accentColor } = config

  // Phases: enter 0-0.35, hold 0.35-0.8, exit 0.8-1
  const enterProgress = progress < 0.35 ? progress / 0.35 : 1
  const holdProgress = progress >= 0.35 && progress < 0.8 ? (progress - 0.35) / 0.45 : progress >= 0.8 ? 1 : 0
  const exitProgress = progress >= 0.8 ? (progress - 0.8) / 0.2 : 0

  // "FADE IN:" types on
  const fadeInReveal = easeOutCubic(Math.min(1, enterProgress / 0.2))
  const fadeInText = 'FADE IN:'
  const fadeInChars = Math.round(fadeInReveal * fadeInText.length)

  // Scene heading appears
  const headingOpacity = easeOutCubic(Math.max(0, Math.min(1, (enterProgress - 0.15) / 0.25)))
  const headingY = (1 - headingOpacity) * 10

  // Action line types in
  const actionReveal = easeOutCubic(Math.max(0, Math.min(1, (enterProgress - 0.3) / 0.3)))

  // Character name appears (centered)
  const nameOpacity = easeOutCubic(Math.max(0, Math.min(1, (enterProgress - 0.55) / 0.2)))

  // Parenthetical fades
  const parenOpacity = easeOutCubic(Math.max(0, Math.min(1, (enterProgress - 0.65) / 0.15)))

  // Dialogue line types in
  const dialogueReveal = easeOutCubic(Math.max(0, Math.min(1, (enterProgress - 0.72) / 0.28)))

  // Hold: cursor blink at end of dialogue
  const cursorVisible = holdProgress > 0 ? Math.sin(holdProgress * Math.PI * 8) > 0 : false

  // Exit: fade out upward
  const exitEased = easeInCubic(exitProgress)
  const exitOpacity = 1 - exitEased
  const exitY = exitEased * -25

  // Monospace styling for screenplay format
  const monoFont = "'Courier New', 'Courier', monospace"

  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        overflow: 'hidden',
        background: bgColor,
        fontFamily: monoFont,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      {/* Subtle paper texture */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: `linear-gradient(180deg, ${bgColor} 0%, ${accentColor}04 50%, ${bgColor} 100%)`,
          pointerEvents: 'none',
        }}
      />

      {/* Left margin line (screenplay convention) */}
      <div
        style={{
          position: 'absolute',
          left: 'clamp(30px, 8vw, 70px)',
          top: '10%',
          bottom: '10%',
          width: 1,
          background: `${accentColor}18`,
          opacity: exitOpacity,
        }}
      />

      {/* Page content */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'flex-start',
          width: '75%',
          maxWidth: '75%',
          marginLeft: 'clamp(20px, 4vw, 40px)',
          gap: 'clamp(12px, 2.5vw, 22px)',
          opacity: exitOpacity,
          transform: `translateY(${exitY}px)`,
        }}
      >
        {/* FADE IN: */}
        <div
          style={{
            fontSize: 'clamp(11px, 2vw, 16px)',
            fontWeight: 400,
            color: `${textColor}88`,
            letterSpacing: '0.02em',
          }}
        >
          {fadeInText.substring(0, fadeInChars)}
          {fadeInChars < fadeInText.length && (
            <span style={{ opacity: 0.4, color: accentColor }}>|</span>
          )}
        </div>

        {/* Scene heading (INT./EXT.) */}
        <div
          style={{
            fontSize: 'clamp(12px, 2.4vw, 19px)',
            fontWeight: 700,
            color: textColor,
            textTransform: 'uppercase',
            letterSpacing: '0.01em',
            opacity: headingOpacity,
            transform: `translateY(${headingY}px)`,
            textDecoration: 'underline',
            textDecorationColor: `${accentColor}44`,
            textUnderlineOffset: 'clamp(3px, 0.6vw, 6px)',
          }}
        >
          {sceneHeading}
        </div>

        {/* Action line */}
        <div
          style={{
            fontSize: 'clamp(11px, 2.2vw, 17px)',
            fontWeight: 400,
            color: `${textColor}CC`,
            lineHeight: 1.6,
            opacity: actionReveal,
            clipPath: `inset(0 ${(1 - actionReveal) * 100}% 0 0)`,
            maxWidth: '90%',
          }}
        >
          {actionLine}
        </div>

        {/* Dialogue block - indented */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            width: '100%',
            gap: 'clamp(2px, 0.5vw, 6px)',
          }}
        >
          {/* Character name (centered, uppercase) */}
          <div
            style={{
              fontSize: 'clamp(11px, 2.2vw, 17px)',
              fontWeight: 700,
              color: textColor,
              textTransform: 'uppercase',
              letterSpacing: '0.04em',
              opacity: nameOpacity,
              textAlign: 'center',
            }}
          >
            {characterName}
          </div>

          {/* Parenthetical */}
          <div
            style={{
              fontSize: 'clamp(10px, 2vw, 15px)',
              fontWeight: 400,
              fontStyle: 'italic',
              color: `${textColor}88`,
              opacity: parenOpacity,
              textAlign: 'center',
            }}
          >
            ({parenthetical})
          </div>

          {/* Dialogue */}
          <div
            style={{
              fontSize: 'clamp(11px, 2.2vw, 17px)',
              fontWeight: 400,
              color: `${textColor}DD`,
              lineHeight: 1.5,
              textAlign: 'center',
              maxWidth: 'clamp(160px, 50%, 340px)',
              opacity: dialogueReveal,
              clipPath: `inset(0 ${(1 - dialogueReveal) * 100}% 0 0)`,
            }}
          >
            {dialogueLine}
            {cursorVisible && (
              <span style={{ color: accentColor, opacity: 0.7 }}>|</span>
            )}
          </div>
        </div>
      </div>

      {/* Page number bottom right */}
      <div
        style={{
          position: 'absolute',
          bottom: 'clamp(12px, 3vw, 24px)',
          right: 'clamp(16px, 4vw, 32px)',
          fontSize: 'clamp(9px, 1.5vw, 12px)',
          color: `${textColor}33`,
          fontFamily: monoFont,
          opacity: exitOpacity,
        }}
      >
        1.
      </div>
    </div>
  )
}

registerMotionGraphic({
  id: 'tpl-scene-screenplay',
  title: 'Screenplay Format',
  description: 'Authentic screenplay layout with FADE IN, scene heading, action line, character name, parenthetical, and dialogue in Courier monospace',
  tags: ['scene', 'screenplay', 'script', 'film', 'cinema', 'dialogue', 'text', 'monospace'],
  category: 'scene-layout',
  component: SceneScreenplayComponent as any,
  defaultConfig: {
    sceneHeading: 'INT. COFFEE SHOP - MORNING',
    actionLine: 'Rain streaks the windows. A half-empty cup sits on the table, steam still rising.',
    characterName: 'ELENA',
    dialogueLine: 'I never said goodbye. I just stopped showing up.',
    parenthetical: 'quietly, to herself',
    bgColor: '#0C0C0C',
    textColor: '#E0DDD6',
    accentColor: '#7A9E7E',
  },
  configSchema: [
    { key: 'sceneHeading', label: 'Scene Heading', type: 'text', defaultValue: 'INT. COFFEE SHOP - MORNING', group: 'Content' },
    { key: 'actionLine', label: 'Action Line', type: 'text', defaultValue: 'Rain streaks the windows. A half-empty cup sits on the table, steam still rising.', group: 'Content' },
    { key: 'characterName', label: 'Character Name', type: 'text', defaultValue: 'ELENA', group: 'Content' },
    { key: 'dialogueLine', label: 'Dialogue', type: 'text', defaultValue: 'I never said goodbye. I just stopped showing up.', group: 'Content' },
    { key: 'parenthetical', label: 'Parenthetical', type: 'text', defaultValue: 'quietly, to herself', group: 'Content' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#0C0C0C', group: 'Style' },
    { key: 'textColor', label: 'Text Color', type: 'color', defaultValue: '#E0DDD6', group: 'Style' },
    { key: 'accentColor', label: 'Accent Color', type: 'color', defaultValue: '#7A9E7E', group: 'Style' },
  ],
})
