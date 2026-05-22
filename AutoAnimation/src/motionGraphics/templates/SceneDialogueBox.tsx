import React from 'react'
import { registerMotionGraphic } from '../registry'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface DialogueBoxConfig {
  speakerName: string
  dialogueText: string
  portraitIcon: string
  bgColor: string
  boxColor: string
  nameColor: string
  textColor: string
  borderColor: string
}

function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3)
}

function SceneDialogueBoxComponent({ config, frame, fps, progress }: MotionGraphicProps<DialogueBoxConfig>) {
  const { speakerName, dialogueText, portraitIcon, bgColor, boxColor, nameColor, textColor, borderColor } = config
  const time = frame / fps

  // Box slides up from bottom
  const enterProgress = progress < 0.1 ? progress / 0.1 : 1
  const exitProgress = progress > 0.9 ? (progress - 0.9) / 0.1 : 0
  const slideY = (1 - easeOutCubic(enterProgress)) * 80 + easeOutCubic(exitProgress) * 80
  const mainOpacity = (enterProgress > 0.02 ? 1 : enterProgress / 0.02) * (1 - easeOutCubic(exitProgress))

  // Typewriter effect
  const typewriterStart = 0.12
  const typewriterEnd = 0.75
  const typeProgress = progress < typewriterStart ? 0 : progress > typewriterEnd ? 1 : (progress - typewriterStart) / (typewriterEnd - typewriterStart)
  const visibleChars = Math.floor(typeProgress * dialogueText.length)
  const displayText = dialogueText.substring(0, visibleChars)
  const isTyping = typeProgress > 0 && typeProgress < 1

  // Cursor blink
  const cursorVisible = isTyping || Math.floor(time * 3) % 2 === 0

  // Portrait bob
  const portraitBob = Math.sin(time * 2) * 2

  // Text sound indicator (typing tick marks)
  const typingTick = isTyping && Math.floor(time * 15) % 2 === 0

  // Continue arrow bounce
  const continueVisible = typeProgress >= 1
  const arrowBounce = continueVisible ? Math.sin(time * 5) * 4 : 0

  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        background: bgColor,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'flex-end',
        alignItems: 'center',
        overflow: 'hidden',
        fontFamily: "'Courier New', 'Lucida Console', monospace",
        opacity: mainOpacity,
        paddingBottom: '6%',
      }}
    >
      {/* Scene background pattern */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          backgroundImage: [
            'linear-gradient(90deg, rgba(255,255,255,0.015) 1px, transparent 1px)',
            'linear-gradient(0deg, rgba(255,255,255,0.015) 1px, transparent 1px)',
          ].join(', '),
          backgroundSize: '8px 8px',
          pointerEvents: 'none',
        }}
      />

      {/* Dim top area to focus on dialogue */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: '55%',
          background: 'linear-gradient(180deg, transparent, rgba(0,0,0,0.2))',
          pointerEvents: 'none',
        }}
      />

      {/* Dialogue box */}
      <div
        style={{
          width: 'clamp(280px, 80vw, 560px)',
          transform: `translateY(${slideY}px)`,
          position: 'relative',
        }}
      >
        {/* Speaker name tag */}
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 'clamp(4px, 0.8vw, 8px)',
            background: boxColor,
            border: `3px solid ${borderColor}`,
            borderBottom: 'none',
            padding: 'clamp(4px, 0.8vw, 8px) clamp(10px, 2vw, 18px)',
            marginBottom: -3,
            position: 'relative',
            zIndex: 2,
            imageRendering: 'pixelated' as any,
          }}
        >
          <div
            style={{
              fontSize: 'clamp(13px, 2.5vw, 20px)',
              fontWeight: 700,
              color: nameColor,
              textTransform: 'uppercase',
              letterSpacing: 2,
            }}
          >
            {speakerName}
          </div>
          {/* Typing indicator */}
          {isTyping && (
            <div
              style={{
                width: 6,
                height: 6,
                background: nameColor,
                opacity: typingTick ? 0.8 : 0.2,
                imageRendering: 'pixelated' as any,
              }}
            />
          )}
        </div>

        {/* Main dialogue box */}
        <div
          style={{
            background: boxColor,
            border: `3px solid ${borderColor}`,
            padding: 'clamp(12px, 2.5vw, 22px)',
            display: 'flex',
            gap: 'clamp(10px, 2vw, 18px)',
            position: 'relative',
            imageRendering: 'pixelated' as any,
          }}
        >
          {/* Portrait frame */}
          <div
            style={{
              width: 'clamp(48px, 10vw, 80px)',
              height: 'clamp(48px, 10vw, 80px)',
              background: `${borderColor}20`,
              border: `2px solid ${borderColor}`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 'clamp(28px, 6vw, 48px)',
              flexShrink: 0,
              transform: `translateY(${portraitBob}px)`,
              imageRendering: 'pixelated' as any,
            }}
          >
            {portraitIcon}
          </div>

          {/* Text area */}
          <div
            style={{
              flex: 1,
              minHeight: 'clamp(48px, 10vw, 80px)',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
            }}
          >
            {/* Dialogue text with typewriter */}
            <div
              style={{
                fontSize: 'clamp(12px, 2.2vw, 18px)',
                color: textColor,
                lineHeight: 1.5,
                letterSpacing: 0.5,
                minHeight: 'clamp(36px, 7vw, 60px)',
              }}
            >
              {displayText}
              {/* Blinking cursor */}
              <span
                style={{
                  display: 'inline-block',
                  width: 'clamp(6px, 1.2vw, 10px)',
                  height: 'clamp(12px, 2.2vw, 18px)',
                  background: cursorVisible ? textColor : 'transparent',
                  marginLeft: 2,
                  verticalAlign: 'text-bottom',
                  imageRendering: 'pixelated' as any,
                }}
              />
            </div>

            {/* Continue indicator */}
            {continueVisible && (
              <div
                style={{
                  alignSelf: 'flex-end',
                  transform: `translateY(${arrowBounce}px)`,
                }}
              >
                <div
                  style={{
                    width: 0,
                    height: 0,
                    borderLeft: '6px solid transparent',
                    borderRight: '6px solid transparent',
                    borderTop: `8px solid ${nameColor}`,
                    opacity: Math.floor(time * 3) % 2 === 0 ? 0.9 : 0.4,
                  }}
                />
              </div>
            )}
          </div>

          {/* Pixel corner decorations */}
          {[0, 1, 2, 3].map((c) => (
            <div
              key={c}
              style={{
                position: 'absolute',
                [c < 2 ? 'top' : 'bottom']: -3,
                [c % 2 === 0 ? 'left' : 'right']: -3,
                width: 8,
                height: 8,
                background: borderColor,
                imageRendering: 'pixelated' as any,
              }}
            />
          ))}
        </div>
      </div>

      {/* CRT overlay */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.06) 2px, rgba(0,0,0,0.06) 4px)',
          pointerEvents: 'none',
          zIndex: 10,
        }}
      />
    </div>
  )
}

registerMotionGraphic({
  id: 'tpl-scene-dialogue-box',
  title: 'Scene Dialogue Box',
  description: 'RPG dialogue box with typewriter text reveal, blinking cursor, portrait frame, speaker name tag, and continue arrow',
  tags: ['scene', 'dialogue', 'RPG', 'retro', 'gaming', 'pixel', 'typewriter', 'text-box'],
  category: 'scene-layout',
  component: SceneDialogueBoxComponent as unknown as React.ComponentType<MotionGraphicProps>,
  defaultConfig: {
    speakerName: 'ELDER',
    dialogueText: 'A great darkness approaches from the east. You must find the three sacred crystals before it is too late...',
    portraitIcon: '\u{1F9D9}',
    bgColor: '#0a0a14',
    boxColor: '#0d0d24',
    nameColor: '#FFD700',
    textColor: '#DDDDDD',
    borderColor: '#555577',
  },
  configSchema: [
    { key: 'speakerName', label: 'Speaker', type: 'text', defaultValue: 'ELDER', group: 'Content' },
    { key: 'dialogueText', label: 'Dialogue', type: 'text', defaultValue: 'A great darkness approaches from the east. You must find the three sacred crystals before it is too late...', group: 'Content' },
    { key: 'portraitIcon', label: 'Portrait', type: 'text', defaultValue: '\u{1F9D9}', group: 'Content' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#0a0a14', group: 'Style' },
    { key: 'boxColor', label: 'Box Color', type: 'color', defaultValue: '#0d0d24', group: 'Style' },
    { key: 'nameColor', label: 'Name Color', type: 'color', defaultValue: '#FFD700', group: 'Style' },
    { key: 'textColor', label: 'Text Color', type: 'color', defaultValue: '#DDDDDD', group: 'Style' },
    { key: 'borderColor', label: 'Border', type: 'color', defaultValue: '#555577', group: 'Style' },
  ],
})
