import React from 'react'
import { registerMotionGraphic } from '../registry'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface ScientistProfileConfig {
  name: string
  field: string
  years: string
  discovery1: string
  discovery2: string
  discovery3: string
  quote: string
  bgColor: string
  textColor: string
  accentColor: string
}

function easeOutCubic(t: number): number { return 1 - Math.pow(1 - t, 3) }
function easeOutBack(t: number): number {
  const c1 = 1.70158
  const c3 = c1 + 1
  return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2)
}
function easeInCubic(t: number): number { return t * t * t }

function SceneScientistProfileComponent({ config, frame, durationInFrames }: MotionGraphicProps<ScientistProfileConfig>) {
  const { name, field, years, discovery1, discovery2, discovery3, quote, bgColor, textColor, accentColor } = config
  const progress = frame / durationInFrames

  // Avatar circle reveals (0.02-0.18)
  const avatarScale = easeOutBack(Math.max(0, Math.min(1, (progress - 0.02) / 0.16)))

  // Name slides in (0.12-0.25)
  const nameFade = easeOutCubic(Math.max(0, Math.min(1, (progress - 0.12) / 0.13)))

  // Field + years (0.2-0.32)
  const fieldFade = easeOutCubic(Math.max(0, Math.min(1, (progress - 0.2) / 0.12)))

  // Discoveries stagger (0.3-0.55)
  const disc1Fade = easeOutCubic(Math.max(0, Math.min(1, (progress - 0.3) / 0.1)))
  const disc2Fade = easeOutCubic(Math.max(0, Math.min(1, (progress - 0.38) / 0.1)))
  const disc3Fade = easeOutCubic(Math.max(0, Math.min(1, (progress - 0.46) / 0.1)))

  // Quote (0.55-0.7)
  const quoteFade = easeOutCubic(Math.max(0, Math.min(1, (progress - 0.55) / 0.15)))

  // Hold: DNA helix animation next to avatar
  const helixAngle = progress * Math.PI * 6

  // Exit
  const exitProg = progress >= 0.85 ? easeInCubic((progress - 0.85) / 0.15) : 0

  // Generate initials from name
  const initials = name.split(' ').map(w => w[0]).join('').slice(0, 2)

  const discoveries = [
    { text: discovery1, fade: disc1Fade },
    { text: discovery2, fade: disc2Fade },
    { text: discovery3, fade: disc3Fade },
  ]

  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        background: bgColor,
        overflow: 'hidden',
        fontFamily: "'Helvetica Neue', Arial, sans-serif",
        opacity: 1 - exitProg,
        transform: `scale(${1 - exitProg * 0.15})`,
      }}
    >
      {/* Background atom orbits */}
      {[1, 2, 3].map(ring => (
        <div
          key={ring}
          style={{
            position: 'absolute',
            left: '20%',
            top: '20%',
            width: ring * 120,
            height: ring * 50,
            border: `1px solid ${accentColor}06`,
            borderRadius: '50%',
            transform: `translate(-50%, -50%) rotate(${ring * 60 + progress * 20}deg)`,
          }}
        />
      ))}

      {/* Main content */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '8%',
        }}
      >
        {/* Avatar circle with initials */}
        <div
          style={{
            width: 'clamp(70px, 18vw, 120px)',
            height: 'clamp(70px, 18vw, 120px)',
            borderRadius: '50%',
            background: `linear-gradient(135deg, ${accentColor}CC, ${accentColor}66)`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 'clamp(28px, 7vw, 48px)',
            fontWeight: 900,
            color: bgColor,
            transform: `scale(${avatarScale})`,
            boxShadow: `0 0 30px ${accentColor}30`,
            marginBottom: 'clamp(14px, 3.5vw, 28px)',
          }}
        >
          {initials}
        </div>

        {/* Name */}
        <div
          style={{
            fontSize: 'clamp(24px, 6vw, 48px)',
            fontWeight: 900,
            color: textColor,
            textAlign: 'center',
            marginBottom: 'clamp(4px, 1vw, 8px)',
            opacity: nameFade,
            transform: `translateY(${(1 - nameFade) * 15}px)`,
          }}
        >
          {name}
        </div>

        {/* Field + years */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 'clamp(8px, 2vw, 16px)',
            marginBottom: 'clamp(16px, 4vw, 32px)',
            opacity: fieldFade,
          }}
        >
          <span
            style={{
              fontSize: 'clamp(11px, 2.2vw, 18px)',
              color: accentColor,
              fontWeight: 600,
            }}
          >
            {field}
          </span>
          <span style={{ width: 4, height: 4, borderRadius: '50%', background: `${textColor}30` }} />
          <span
            style={{
              fontSize: 'clamp(11px, 2.2vw, 18px)',
              color: `${textColor}60`,
            }}
          >
            {years}
          </span>
        </div>

        {/* Discoveries */}
        <div
          style={{
            width: '100%',
            maxWidth: 420,
            marginBottom: 'clamp(16px, 4vw, 32px)',
          }}
        >
          <div
            style={{
              fontSize: 'clamp(9px, 1.6vw, 13px)',
              color: accentColor,
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.12em',
              marginBottom: 'clamp(8px, 2vw, 14px)',
              opacity: disc1Fade,
            }}
          >
            Key Discoveries
          </div>

          {discoveries.map((d, i) => (
            <div
              key={i}
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: 'clamp(6px, 1.5vw, 12px)',
                marginBottom: 'clamp(6px, 1.5vw, 12px)',
                opacity: d.fade,
                transform: `translateX(${(1 - d.fade) * 25}px)`,
              }}
            >
              <div
                style={{
                  width: 6,
                  height: 6,
                  borderRadius: '50%',
                  background: accentColor,
                  marginTop: 'clamp(5px, 1vw, 8px)',
                  flexShrink: 0,
                }}
              />
              <div
                style={{
                  fontSize: 'clamp(12px, 2.5vw, 20px)',
                  color: `${textColor}BB`,
                  lineHeight: 1.4,
                }}
              >
                {d.text}
              </div>
            </div>
          ))}
        </div>

        {/* Quote */}
        <div
          style={{
            width: '100%',
            maxWidth: 420,
            fontSize: 'clamp(12px, 2.5vw, 20px)',
            color: `${textColor}90`,
            fontStyle: 'italic',
            lineHeight: 1.5,
            borderLeft: `3px solid ${accentColor}50`,
            paddingLeft: 'clamp(10px, 2.5vw, 20px)',
            opacity: quoteFade,
            transform: `translateY(${(1 - quoteFade) * 12}px)`,
          }}
        >
          &ldquo;{quote}&rdquo;
        </div>
      </div>
    </div>
  )
}

registerMotionGraphic({
  id: 'tpl-scene-scientist-profile',
  title: 'Scientist Profile',
  description: 'Scientist profile card with avatar initials, field, key discoveries list, and famous quote with staggered reveals',
  tags: ['scene', 'science', 'scientist', 'profile', 'biography', 'educational'],
  category: 'scene-layout',
  component: SceneScientistProfileComponent as unknown as React.ComponentType<MotionGraphicProps>,
  configSchema: [
    { key: 'name', label: 'Name', type: 'text', defaultValue: 'Marie Curie', group: 'Content' },
    { key: 'field', label: 'Field', type: 'text', defaultValue: 'Physics & Chemistry', group: 'Content' },
    { key: 'years', label: 'Years', type: 'text', defaultValue: '1867-1934', group: 'Content' },
    { key: 'discovery1', label: 'Discovery 1', type: 'text', defaultValue: 'Discovered polonium and radium', group: 'Content' },
    { key: 'discovery2', label: 'Discovery 2', type: 'text', defaultValue: 'First woman to win a Nobel Prize', group: 'Content' },
    { key: 'discovery3', label: 'Discovery 3', type: 'text', defaultValue: 'Pioneered research on radioactivity', group: 'Content' },
    { key: 'quote', label: 'Quote', type: 'text', defaultValue: 'Nothing in life is to be feared, it is only to be understood.', group: 'Content' },
    { key: 'accentColor', label: 'Accent Color', type: 'color', defaultValue: '#00D4AA', group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#0a0e17', group: 'Style' },
    { key: 'textColor', label: 'Text Color', type: 'color', defaultValue: '#E8E8E8', group: 'Style' },
  ],
  defaultConfig: {
    name: 'Marie Curie',
    field: 'Physics & Chemistry',
    years: '1867-1934',
    discovery1: 'Discovered polonium and radium',
    discovery2: 'First woman to win a Nobel Prize',
    discovery3: 'Pioneered research on radioactivity',
    quote: 'Nothing in life is to be feared, it is only to be understood.',
    accentColor: '#00D4AA',
    bgColor: '#0a0e17',
    textColor: '#E8E8E8',
  },
})
