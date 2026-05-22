import React from 'react'
import { registerMotionGraphic } from '../registry'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface SceneBusinessCardConfig {
  fullName: string
  jobTitle: string
  companyName: string
  email: string
  phone: string
  website: string
  bgColor: string
  cardColor: string
  textColor: string
  accentColor: string
  subtextColor: string
}

function easeOutCubic(t: number): number { return 1 - Math.pow(1 - t, 3) }
function easeInCubic(t: number): number { return t * t * t }
function easeOutQuart(t: number): number { return 1 - Math.pow(1 - t, 4) }

function SceneBusinessCardComponent({ config, progress }: MotionGraphicProps<SceneBusinessCardConfig>) {
  const { fullName, jobTitle, companyName, email, phone, website, bgColor, cardColor, textColor, accentColor, subtextColor } = config

  // Phases: enter 0-0.35, hold 0.35-0.75, flip 0.75-0.85 (transition), back side 0.85-1
  const enterProgress = progress < 0.35 ? progress / 0.35 : 1
  const holdProgress = progress >= 0.35 && progress < 0.45 ? (progress - 0.35) / 0.1 : progress >= 0.45 ? 1 : 0
  const flipStart = 0.45
  const flipEnd = 0.6
  const flipProgress = progress >= flipStart && progress < flipEnd ? (progress - flipStart) / (flipEnd - flipStart) : progress >= flipEnd ? 1 : 0
  const backEnter = progress >= flipEnd ? Math.min(1, (progress - flipEnd) / 0.15) : 0
  const exitProgress = progress >= 0.88 ? (progress - 0.88) / 0.12 : 0

  // Card enters with slide + slight rotation
  const cardEnterOpacity = easeOutCubic(Math.min(1, enterProgress / 0.3))
  const cardEnterY = (1 - easeOutQuart(Math.min(1, enterProgress / 0.4))) * 50
  const cardEnterRotation = (1 - easeOutCubic(Math.min(1, enterProgress / 0.3))) * -3

  // Front side: name appears
  const nameOpacity = easeOutCubic(Math.max(0, Math.min(1, (enterProgress - 0.2) / 0.3)))
  const nameY = (1 - nameOpacity) * 10

  // Title
  const titleOpacity = easeOutCubic(Math.max(0, Math.min(1, (enterProgress - 0.35) / 0.25)))

  // Company name
  const companyOpacity = easeOutCubic(Math.max(0, Math.min(1, (enterProgress - 0.5) / 0.25)))

  // Accent line expands
  const lineScale = easeOutQuart(Math.max(0, Math.min(1, (enterProgress - 0.45) / 0.3)))

  // Flip animation (rotateY)
  const flipAngle = easeOutCubic(flipProgress) * 180
  const isFrontVisible = flipAngle < 90

  // Back side contact info
  const emailOpacity = easeOutCubic(Math.max(0, Math.min(1, backEnter / 0.4)))
  const phoneOpacity = easeOutCubic(Math.max(0, Math.min(1, (backEnter - 0.2) / 0.4)))
  const webOpacity = easeOutCubic(Math.max(0, Math.min(1, (backEnter - 0.4) / 0.4)))

  // Exit
  const exitEased = easeInCubic(exitProgress)
  const exitOpacity = 1 - exitEased
  const exitScale = 1 - exitEased * 0.1

  const sansFont = "'Inter', 'Helvetica Neue', -apple-system, sans-serif"

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
        perspective: 1000,
      }}
    >
      {/* Subtle ambient light */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: `radial-gradient(ellipse at 50% 40%, ${accentColor}08 0%, transparent 50%)`,
          pointerEvents: 'none',
        }}
      />

      {/* Card container */}
      <div
        style={{
          width: 'clamp(240px, 60vw, 420px)',
          height: 'clamp(140px, 35vw, 240px)',
          position: 'relative',
          transformStyle: 'preserve-3d',
          transform: `translateY(${cardEnterY}px) rotate(${cardEnterRotation}deg) rotateY(${flipAngle}deg) scale(${exitScale})`,
          opacity: cardEnterOpacity * exitOpacity,
        }}
      >
        {/* Front face */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            backfaceVisibility: 'hidden',
            background: cardColor,
            borderRadius: 'clamp(4px, 0.8vw, 8px)',
            boxShadow: `0 clamp(4px, 1vw, 10px) clamp(20px, 5vw, 40px) ${bgColor}66`,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            padding: 'clamp(20px, 5vw, 40px)',
          }}
        >
          {/* Company name (top, small) */}
          <div
            style={{
              position: 'absolute',
              top: 'clamp(14px, 3vw, 24px)',
              left: 'clamp(20px, 5vw, 40px)',
              fontSize: 'clamp(8px, 1.4vw, 11px)',
              fontWeight: 600,
              fontFamily: sansFont,
              color: accentColor,
              letterSpacing: '0.2em',
              textTransform: 'uppercase',
              opacity: companyOpacity,
            }}
          >
            {companyName}
          </div>

          {/* Name */}
          <div
            style={{
              fontSize: 'clamp(20px, 5vw, 38px)',
              fontWeight: 300,
              fontFamily: sansFont,
              color: textColor,
              letterSpacing: '-0.01em',
              opacity: nameOpacity,
              transform: `translateY(${nameY}px)`,
              lineHeight: 1.2,
            }}
          >
            {fullName}
          </div>

          {/* Accent line */}
          <div
            style={{
              width: 'clamp(25px, 6vw, 40px)',
              height: 2,
              background: accentColor,
              margin: 'clamp(8px, 1.5vw, 14px) 0',
              transform: `scaleX(${lineScale})`,
              transformOrigin: 'left center',
            }}
          />

          {/* Job title */}
          <div
            style={{
              fontSize: 'clamp(10px, 2vw, 16px)',
              fontWeight: 400,
              fontFamily: sansFont,
              color: subtextColor,
              letterSpacing: '0.04em',
              opacity: titleOpacity,
            }}
          >
            {jobTitle}
          </div>

          {/* Corner accent */}
          <div
            style={{
              position: 'absolute',
              bottom: 'clamp(12px, 2.5vw, 20px)',
              right: 'clamp(16px, 3.5vw, 28px)',
              width: 'clamp(16px, 3vw, 24px)',
              height: 'clamp(16px, 3vw, 24px)',
              borderRight: `2px solid ${accentColor}33`,
              borderBottom: `2px solid ${accentColor}33`,
              opacity: lineScale,
            }}
          />
        </div>

        {/* Back face */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            backfaceVisibility: 'hidden',
            transform: 'rotateY(180deg)',
            background: cardColor,
            borderRadius: 'clamp(4px, 0.8vw, 8px)',
            boxShadow: `0 clamp(4px, 1vw, 10px) clamp(20px, 5vw, 40px) ${bgColor}66`,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            padding: 'clamp(20px, 5vw, 40px)',
            gap: 'clamp(10px, 2.2vw, 18px)',
          }}
        >
          {/* Accent bar on left */}
          <div
            style={{
              position: 'absolute',
              left: 0,
              top: '20%',
              bottom: '20%',
              width: 'clamp(3px, 0.6vw, 5px)',
              background: accentColor,
              borderRadius: '0 2px 2px 0',
            }}
          />

          {/* Email */}
          <div style={{ opacity: emailOpacity }}>
            <div
              style={{
                fontSize: 'clamp(7px, 1.2vw, 9px)',
                fontWeight: 600,
                fontFamily: sansFont,
                color: accentColor,
                letterSpacing: '0.15em',
                textTransform: 'uppercase',
                marginBottom: 'clamp(2px, 0.4vw, 4px)',
              }}
            >
              Email
            </div>
            <div
              style={{
                fontSize: 'clamp(11px, 2.2vw, 17px)',
                fontWeight: 300,
                fontFamily: sansFont,
                color: textColor,
              }}
            >
              {email}
            </div>
          </div>

          {/* Phone */}
          <div style={{ opacity: phoneOpacity }}>
            <div
              style={{
                fontSize: 'clamp(7px, 1.2vw, 9px)',
                fontWeight: 600,
                fontFamily: sansFont,
                color: accentColor,
                letterSpacing: '0.15em',
                textTransform: 'uppercase',
                marginBottom: 'clamp(2px, 0.4vw, 4px)',
              }}
            >
              Phone
            </div>
            <div
              style={{
                fontSize: 'clamp(11px, 2.2vw, 17px)',
                fontWeight: 300,
                fontFamily: sansFont,
                color: textColor,
                letterSpacing: '0.03em',
              }}
            >
              {phone}
            </div>
          </div>

          {/* Website */}
          <div style={{ opacity: webOpacity }}>
            <div
              style={{
                fontSize: 'clamp(7px, 1.2vw, 9px)',
                fontWeight: 600,
                fontFamily: sansFont,
                color: accentColor,
                letterSpacing: '0.15em',
                textTransform: 'uppercase',
                marginBottom: 'clamp(2px, 0.4vw, 4px)',
              }}
            >
              Web
            </div>
            <div
              style={{
                fontSize: 'clamp(11px, 2.2vw, 17px)',
                fontWeight: 300,
                fontFamily: sansFont,
                color: textColor,
                textDecoration: 'underline',
                textDecorationColor: `${accentColor}44`,
                textUnderlineOffset: 'clamp(2px, 0.4vw, 4px)',
              }}
            >
              {website}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

registerMotionGraphic({
  id: 'tpl-scene-business-card',
  title: 'Business Card Flip',
  description: 'Minimal business card with 3D flip reveal showing name, title, company on front and contact details on back',
  tags: ['scene', 'business-card', 'card', 'contact', 'minimal', 'text', 'flip', 'professional'],
  category: 'scene-layout',
  component: SceneBusinessCardComponent as any,
  defaultConfig: {
    fullName: 'Alexandra Chen',
    jobTitle: 'Creative Director',
    companyName: 'Northlight Studio',
    email: 'alex@northlight.co',
    phone: '+1 (415) 555-0192',
    website: 'northlight.co',
    bgColor: '#0A0A0C',
    cardColor: '#FAFAF8',
    textColor: '#1A1A1E',
    accentColor: '#2D5A7B',
    subtextColor: '#666670',
  },
  configSchema: [
    { key: 'fullName', label: 'Full Name', type: 'text', defaultValue: 'Alexandra Chen', group: 'Content' },
    { key: 'jobTitle', label: 'Job Title', type: 'text', defaultValue: 'Creative Director', group: 'Content' },
    { key: 'companyName', label: 'Company', type: 'text', defaultValue: 'Northlight Studio', group: 'Content' },
    { key: 'email', label: 'Email', type: 'text', defaultValue: 'alex@northlight.co', group: 'Content' },
    { key: 'phone', label: 'Phone', type: 'text', defaultValue: '+1 (415) 555-0192', group: 'Content' },
    { key: 'website', label: 'Website', type: 'text', defaultValue: 'northlight.co', group: 'Content' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#0A0A0C', group: 'Style' },
    { key: 'cardColor', label: 'Card Color', type: 'color', defaultValue: '#FAFAF8', group: 'Style' },
    { key: 'textColor', label: 'Text Color', type: 'color', defaultValue: '#1A1A1E', group: 'Style' },
    { key: 'accentColor', label: 'Accent Color', type: 'color', defaultValue: '#2D5A7B', group: 'Style' },
    { key: 'subtextColor', label: 'Subtext Color', type: 'color', defaultValue: '#666670', group: 'Style' },
  ],
})
