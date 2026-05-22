import React from 'react'
import { registerMotionGraphic } from '../registry'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface PhotoChallengeConfig {
  challengeTitle: string
  prompt: string
  difficulty: string
  timeLimit: string
  tip: string
  bgColor: string
  cardColor: string
  accentColor: string
  textColor: string
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

function ScenePhotoChallengeComponent({ config, progress }: MotionGraphicProps<PhotoChallengeConfig>) {
  const { challengeTitle, prompt, difficulty, timeLimit, tip, bgColor, cardColor, accentColor, textColor } = config

  const enterProgress = progress < 0.25 ? progress / 0.25 : 1
  const holdProgress = progress >= 0.25 && progress < 0.8 ? (progress - 0.25) / 0.55 : progress >= 0.8 ? 1 : 0
  const exitProgress = progress >= 0.8 ? (progress - 0.8) / 0.2 : 0

  const exitEased = easeInCubic(exitProgress)
  const exitOpacity = 1 - exitEased

  // Card bounce in
  const cardEnter = easeOutBack(Math.min(1, enterProgress / 0.5))

  // Difficulty level dots
  const difficultyLevels: Record<string, number> = { Easy: 1, Medium: 2, Hard: 3, Expert: 4 }
  const level = difficultyLevels[difficulty] || 2

  // Timer countdown animation during hold
  const timerPulse = 1 + Math.sin(holdProgress * Math.PI * 6) * 0.05

  // Viewfinder corners animation
  const cornerEnter = easeOutCubic(Math.max(0, Math.min(1, (enterProgress - 0.3) / 0.3)))

  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        overflow: 'hidden',
        background: bgColor,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: "'Helvetica Neue', Arial, sans-serif",
        padding: '5%',
      }}
    >
      <div
        style={{
          maxWidth: 400,
          width: '100%',
          opacity: exitOpacity,
          transform: `scale(${cardEnter}) translateY(${exitEased * -60}px)`,
        }}
      >
        {/* Challenge header badge */}
        <div
          style={{
            textAlign: 'center',
            marginBottom: 'clamp(10px, 1.5vh, 16px)',
            opacity: easeOutCubic(Math.min(1, enterProgress / 0.2)),
          }}
        >
          <span
            style={{
              background: accentColor,
              color: '#FFFFFF',
              fontSize: 'clamp(9px, 1.3vw, 12px)',
              fontWeight: 800,
              padding: '4px 16px',
              borderRadius: 20,
              letterSpacing: 2,
              textTransform: 'uppercase',
            }}
          >
            PHOTO CHALLENGE
          </span>
        </div>

        {/* Main card */}
        <div
          style={{
            background: cardColor,
            borderRadius: 'clamp(14px, 2vw, 22px)',
            padding: 'clamp(22px, 4.5%, 40px)',
            boxShadow: `0 16px 48px rgba(0,0,0,0.25), 0 0 0 1px ${accentColor}15`,
            position: 'relative',
          }}
        >
          {/* Viewfinder corners */}
          <div style={{ position: 'absolute', top: 10, left: 10, width: 16, height: 16, borderTop: `2px solid ${accentColor}40`, borderLeft: `2px solid ${accentColor}40`, opacity: cornerEnter }} />
          <div style={{ position: 'absolute', top: 10, right: 10, width: 16, height: 16, borderTop: `2px solid ${accentColor}40`, borderRight: `2px solid ${accentColor}40`, opacity: cornerEnter }} />
          <div style={{ position: 'absolute', bottom: 10, left: 10, width: 16, height: 16, borderBottom: `2px solid ${accentColor}40`, borderLeft: `2px solid ${accentColor}40`, opacity: cornerEnter }} />
          <div style={{ position: 'absolute', bottom: 10, right: 10, width: 16, height: 16, borderBottom: `2px solid ${accentColor}40`, borderRight: `2px solid ${accentColor}40`, opacity: cornerEnter }} />

          {/* Challenge title */}
          <div
            style={{
              fontSize: 'clamp(18px, 3.5vw, 28px)',
              fontWeight: 900,
              color: textColor,
              textAlign: 'center',
              marginBottom: 'clamp(6px, 1vh, 12px)',
              opacity: easeOutCubic(Math.max(0, Math.min(1, (enterProgress - 0.1) / 0.3))),
            }}
          >
            {challengeTitle}
          </div>

          {/* Difficulty and time */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              gap: 'clamp(12px, 2.5vw, 24px)',
              marginBottom: 'clamp(14px, 2.5vh, 24px)',
              opacity: easeOutCubic(Math.max(0, Math.min(1, (enterProgress - 0.2) / 0.3))),
            }}
          >
            {/* Difficulty dots */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              {Array.from({ length: 4 }).map((_, i) => (
                <div
                  key={i}
                  style={{
                    width: 8,
                    height: 8,
                    borderRadius: '50%',
                    background: i < level ? accentColor : `${textColor}20`,
                  }}
                />
              ))}
              <span style={{ fontSize: 'clamp(10px, 1.4vw, 13px)', color: `${textColor}60`, fontWeight: 600, marginLeft: 4 }}>{difficulty}</span>
            </div>

            <div style={{ width: 1, height: 14, background: `${textColor}15` }} />

            {/* Timer */}
            <div
              style={{
                fontSize: 'clamp(12px, 2vw, 16px)',
                fontWeight: 700,
                color: accentColor,
                fontFamily: "'Courier New', monospace",
                transform: `scale(${timerPulse})`,
              }}
            >
              {timeLimit}
            </div>
          </div>

          {/* Divider */}
          <div
            style={{
              height: 1,
              background: `${textColor}10`,
              marginBottom: 'clamp(14px, 2.5vh, 24px)',
              transform: `scaleX(${easeOutCubic(Math.max(0, Math.min(1, (enterProgress - 0.25) / 0.3)))})`,
              transformOrigin: 'center',
            }}
          />

          {/* Prompt */}
          <div
            style={{
              fontSize: 'clamp(14px, 2.5vw, 20px)',
              fontWeight: 600,
              color: textColor,
              textAlign: 'center',
              lineHeight: 1.5,
              marginBottom: 'clamp(14px, 2.5vh, 24px)',
              opacity: easeOutCubic(Math.max(0, Math.min(1, (enterProgress - 0.35) / 0.3))),
            }}
          >
            "{prompt}"
          </div>

          {/* Tip section */}
          <div
            style={{
              background: `${accentColor}08`,
              borderRadius: 10,
              padding: 'clamp(10px, 1.5%, 16px)',
              borderLeft: `3px solid ${accentColor}40`,
              opacity: easeOutCubic(Math.max(0, Math.min(1, (enterProgress - 0.5) / 0.3))),
            }}
          >
            <div style={{ fontSize: 'clamp(9px, 1.2vw, 11px)', fontWeight: 700, color: accentColor, letterSpacing: 1, marginBottom: 4 }}>TIP</div>
            <div style={{ fontSize: 'clamp(11px, 1.6vw, 14px)', fontWeight: 500, color: `${textColor}80`, lineHeight: 1.4 }}>{tip}</div>
          </div>
        </div>
      </div>
    </div>
  )
}

registerMotionGraphic({
  id: 'tpl-scene-photo-challenge',
  title: 'Scene Photo Challenge',
  description: 'Photography challenge prompt card with difficulty level, timer, creative prompt, and pro tip',
  tags: ['scene', 'photography', 'challenge', 'prompt', 'creative', 'education'],
  category: 'scenes',
  component: ScenePhotoChallengeComponent as unknown as React.ComponentType<MotionGraphicProps>,
  defaultConfig: {
    challengeTitle: 'Reflection Hunt',
    prompt: 'Capture a natural reflection in water, glass, or metal',
    difficulty: 'Medium',
    timeLimit: '30:00',
    tip: 'Get low to the reflecting surface for a more dramatic effect. Try puddles after rain!',
    bgColor: '#0F1419',
    cardColor: '#1C2128',
    accentColor: '#DA7756',
    textColor: '#E6EDF3',
  },
  configSchema: [
    { key: 'challengeTitle', label: 'Challenge Title', type: 'text', defaultValue: 'Reflection Hunt', group: 'Content' },
    { key: 'prompt', label: 'Prompt', type: 'text', defaultValue: 'Capture a natural reflection in water, glass, or metal', group: 'Content' },
    { key: 'difficulty', label: 'Difficulty (Easy/Medium/Hard/Expert)', type: 'text', defaultValue: 'Medium', group: 'Content' },
    { key: 'timeLimit', label: 'Time Limit', type: 'text', defaultValue: '30:00', group: 'Content' },
    { key: 'tip', label: 'Tip', type: 'text', defaultValue: 'Get low to the reflecting surface for a more dramatic effect.', group: 'Content' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#0F1419', group: 'Style' },
    { key: 'cardColor', label: 'Card Color', type: 'color', defaultValue: '#1C2128', group: 'Style' },
    { key: 'accentColor', label: 'Accent Color', type: 'color', defaultValue: '#DA7756', group: 'Style' },
    { key: 'textColor', label: 'Text Color', type: 'color', defaultValue: '#E6EDF3', group: 'Style' },
  ],
})
