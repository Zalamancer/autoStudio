import React from 'react'
import { registerMotionGraphic } from '../registry'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface SceneMysteryClueConfig {
  clueNumber: number
  clueTitle: string
  clueDescription: string
  foundAt: string
  significance: string
  bgColor: string
  textColor: string
  accentColor: string
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

function SceneMysteryClueComponent({ config, progress, frame }: MotionGraphicProps<SceneMysteryClueConfig>) {
  const { clueNumber, clueTitle, clueDescription, foundAt, significance, bgColor, textColor, accentColor } = config
  const f = frame ?? 0

  const enterProgress = progress < 0.25 ? progress / 0.25 : 1
  const holdProgress = progress >= 0.25 && progress < 0.8 ? (progress - 0.25) / 0.55 : progress >= 0.8 ? 1 : 0
  const exitProgress = progress >= 0.8 ? (progress - 0.8) / 0.2 : 0

  const exitOpacity = exitProgress > 0 ? 1 - easeInCubic(exitProgress) : 1

  // Magnifying glass scan effect
  const scanX = 30 + Math.sin(f * 0.03) * 20
  const scanY = 40 + Math.cos(f * 0.025) * 15

  // Reveal animation
  const clueReveal = easeOutBack(Math.min(1, enterProgress * 1.2))
  const descReveal = easeOutCubic(Math.max(0, (enterProgress - 0.4) / 0.6))
  const detailReveal = easeOutCubic(Math.max(0, (enterProgress - 0.6) / 0.4))

  // Pulse on clue number
  const numberPulse = 0.8 + Math.sin(f * 0.06) * 0.1

  // Connecting dots animation
  const dotsProgress = easeOutCubic(Math.min(1, holdProgress * 2))
  const cardEnter = easeOutCubic(enterProgress)

  return (
    <div style={{ position: 'absolute', inset: 0, overflow: 'hidden' }}>
      {/* Background */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: `radial-gradient(ellipse at 50% 40%, #0f0d12, ${bgColor})`,
        }}
      />

      {/* Magnifying glass glow */}
      <div
        style={{
          position: 'absolute',
          left: `${scanX}%`,
          top: `${scanY}%`,
          width: 120,
          height: 120,
          borderRadius: '50%',
          background: `radial-gradient(circle, rgba(255, 255, 200, 0.02), transparent 60%)`,
          transform: 'translate(-50%, -50%)',
          opacity: cardEnter,
        }}
      />

      {/* Grid pattern overlay */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          backgroundImage: `linear-gradient(${accentColor}06 1px, transparent 1px), linear-gradient(90deg, ${accentColor}06 1px, transparent 1px)`,
          backgroundSize: '40px 40px',
          opacity: 0.3,
        }}
      />

      <div
        style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '7%',
          opacity: exitOpacity,
        }}
      >
        {/* Clue number badge */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 'clamp(6px, 1.5vw, 12px)',
            marginBottom: 'clamp(12px, 3vw, 20px)',
            opacity: clueReveal,
            transform: `scale(${clueReveal})`,
          }}
        >
          <div
            style={{
              width: 'clamp(36px, 9vw, 56px)',
              height: 'clamp(36px, 9vw, 56px)',
              borderRadius: '50%',
              border: `2px solid ${accentColor}`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontFamily: "'Georgia', serif",
              fontSize: 'clamp(16px, 4vw, 26px)',
              fontWeight: 700,
              color: accentColor,
              opacity: numberPulse,
              boxShadow: `0 0 15px ${accentColor}22`,
            }}
          >
            {clueNumber}
          </div>
          <div
            style={{
              fontFamily: "'Inter', sans-serif",
              fontSize: 'clamp(10px, 2vw, 14px)',
              fontWeight: 700,
              color: accentColor,
              textTransform: 'uppercase',
              letterSpacing: '0.2em',
            }}
          >
            Clue Found
          </div>
        </div>

        {/* Card */}
        <div
          style={{
            width: 'clamp(280px, 75vw, 460px)',
            background: 'rgba(12, 10, 16, 0.85)',
            borderRadius: 'clamp(8px, 2vw, 14px)',
            border: `1px solid ${accentColor}22`,
            padding: 'clamp(20px, 5vw, 36px)',
            opacity: easeOutCubic(enterProgress),
            boxShadow: `0 0 20px rgba(0,0,0,0.4), 0 0 40px ${accentColor}06`,
          }}
        >
          {/* Clue title */}
          <div
            style={{
              fontFamily: "'Georgia', serif",
              fontSize: 'clamp(18px, 4.5vw, 30px)',
              fontWeight: 700,
              color: textColor,
              marginBottom: 'clamp(8px, 2vw, 14px)',
              opacity: clueReveal,
              textShadow: `0 0 10px ${accentColor}11`,
            }}
          >
            {clueTitle}
          </div>

          {/* Description */}
          <div
            style={{
              fontFamily: "'Georgia', serif",
              fontSize: 'clamp(11px, 2.3vw, 17px)',
              color: `${textColor}99`,
              lineHeight: 1.6,
              marginBottom: 'clamp(16px, 4vw, 26px)',
              opacity: descReveal,
              transform: `translateY(${(1 - descReveal) * 10}px)`,
            }}
          >
            {clueDescription}
          </div>

          {/* Connecting dots line */}
          <div
            style={{
              width: `${dotsProgress * 100}%`,
              height: 2,
              background: `linear-gradient(to right, ${accentColor}44, ${accentColor}11)`,
              marginBottom: 'clamp(14px, 3.5vw, 22px)',
              borderRadius: 1,
              position: 'relative',
            }}
          >
            {/* Dot at end */}
            <div
              style={{
                position: 'absolute',
                right: -3,
                top: -2,
                width: 6,
                height: 6,
                borderRadius: '50%',
                background: accentColor,
                opacity: dotsProgress > 0.9 ? 1 : 0,
              }}
            />
          </div>

          {/* Details row */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              gap: 'clamp(8px, 2vw, 16px)',
              opacity: detailReveal,
            }}
          >
            <div>
              <div
                style={{
                  fontFamily: "'Inter', sans-serif",
                  fontSize: 'clamp(7px, 1.2vw, 9px)',
                  color: `${textColor}44`,
                  textTransform: 'uppercase',
                  letterSpacing: '0.1em',
                  marginBottom: 3,
                }}
              >
                Found At
              </div>
              <div
                style={{
                  fontFamily: "'Inter', sans-serif",
                  fontSize: 'clamp(10px, 2vw, 14px)',
                  fontWeight: 600,
                  color: textColor,
                }}
              >
                {foundAt}
              </div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div
                style={{
                  fontFamily: "'Inter', sans-serif",
                  fontSize: 'clamp(7px, 1.2vw, 9px)',
                  color: `${textColor}44`,
                  textTransform: 'uppercase',
                  letterSpacing: '0.1em',
                  marginBottom: 3,
                }}
              >
                Significance
              </div>
              <div
                style={{
                  fontFamily: "'Inter', sans-serif",
                  fontSize: 'clamp(10px, 2vw, 14px)',
                  fontWeight: 700,
                  color: accentColor,
                }}
              >
                {significance}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

registerMotionGraphic({
  id: 'tpl-scene-mystery-clue',
  title: 'Mystery Clue Reveal',
  description:
    'Mystery clue reveal card with numbered badge, connecting dots animation, magnifying glass scan, and detail reveal',
  tags: ['scene', 'horror', 'mystery', 'clue', 'detective', 'investigation', 'reveal', 'dark'],
  category: 'scene-layout',
  component: SceneMysteryClueComponent as any,
  defaultConfig: {
    clueNumber: 3,
    clueTitle: 'The Missing Photograph',
    clueDescription:
      'A torn photograph was found tucked behind the wallpaper. It shows a group of people standing in front of this very house, but all their faces have been scratched out.',
    foundAt: 'Behind wallpaper, Room 204',
    significance: 'CRITICAL',
    bgColor: '#080610',
    textColor: '#d0cce0',
    accentColor: '#cc8833',
  },
  configSchema: [
    { key: 'clueNumber', label: 'Clue Number', type: 'number', defaultValue: 3, min: 1, max: 99, group: 'Content' },
    { key: 'clueTitle', label: 'Clue Title', type: 'text', defaultValue: 'The Missing Photograph', group: 'Content' },
    {
      key: 'clueDescription',
      label: 'Description',
      type: 'text',
      defaultValue: 'A torn photograph was found tucked behind the wallpaper...',
      group: 'Content',
    },
    { key: 'foundAt', label: 'Found At', type: 'text', defaultValue: 'Behind wallpaper, Room 204', group: 'Content' },
    { key: 'significance', label: 'Significance', type: 'text', defaultValue: 'CRITICAL', group: 'Content' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#080610', group: 'Style' },
    { key: 'textColor', label: 'Text Color', type: 'color', defaultValue: '#d0cce0', group: 'Style' },
    { key: 'accentColor', label: 'Accent Color', type: 'color', defaultValue: '#cc8833', group: 'Style' },
  ],
})
