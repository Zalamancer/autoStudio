import React from 'react'
import { registerMotionGraphic } from '../registry'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface ChefProfileConfig {
  chefName: string
  title: string
  restaurant: string
  specialties: string[]
  yearsExperience: number
  bgColor: string
  cardColor: string
  accentColor: string
  textColor: string
}

function easeOutCubic(t: number): number { return 1 - Math.pow(1 - t, 3) }
function easeInCubic(t: number): number { return t * t * t }
function elasticOut(t: number): number {
  if (t === 0 || t === 1) return t
  return Math.pow(2, -10 * t) * Math.sin((t - 0.075) * (2 * Math.PI) / 0.3) + 1
}

function SceneChefProfileComponent({ config, progress }: MotionGraphicProps<ChefProfileConfig>) {
  const { chefName, title, restaurant, specialties, yearsExperience, bgColor, cardColor, accentColor, textColor } = config

  const enterProgress = progress < 0.22 ? progress / 0.22 : 1
  const exitProgress = progress >= 0.8 ? (progress - 0.8) / 0.2 : 0

  const exitEased = easeInCubic(exitProgress)
  const exitOpacity = exitProgress > 0 ? 1 - exitEased : 1

  // Card slides from left
  const cardEnter = easeOutCubic(Math.min(1, enterProgress / 0.35))
  const cardX = (1 - cardEnter) * -60

  // Avatar scales up
  const avatarEnter = elasticOut(Math.max(0, Math.min(1, (enterProgress - 0.1) / 0.3)))

  // Name slides in
  const nameEnter = easeOutCubic(Math.max(0, Math.min(1, (enterProgress - 0.25) / 0.25)))

  // Specialties staggered
  const getSpecialtyProgress = (i: number): number => {
    const start = 0.45 + i * 0.08
    return easeOutCubic(Math.max(0, Math.min(1, (enterProgress - start) / 0.2)))
  }

  // Years counter
  const yearsProgress = easeOutCubic(Math.max(0, Math.min(1, (enterProgress - 0.6) / 0.3)))
  const displayYears = Math.round(yearsProgress * yearsExperience)

  const displaySpecialties = specialties.slice(0, 5)

  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        overflow: 'hidden',
        background: bgColor,
        fontFamily: "'Inter', 'Helvetica Neue', sans-serif",
      }}
    >
      {/* Warm overlay */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: `radial-gradient(ellipse at 30% 40%, ${accentColor}08 0%, transparent 50%)`,
          pointerEvents: 'none',
        }}
      />

      <div
        style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '6%',
          opacity: exitOpacity,
          transform: `translateX(${exitEased * -40}px)`,
        }}
      >
        <div
          style={{
            background: cardColor,
            borderRadius: 'clamp(16px, 2.5vw, 24px)',
            padding: 'clamp(28px, 5%, 44px)',
            maxWidth: 420,
            width: '100%',
            boxShadow: '0 12px 40px rgba(0,0,0,0.1)',
            transform: `translateX(${cardX}px)`,
            opacity: cardEnter,
            position: 'relative',
          }}
        >
          {/* Accent strip */}
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              bottom: 0,
              width: 4,
              background: accentColor,
              borderRadius: '24px 0 0 24px',
            }}
          />

          {/* Avatar */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'center',
              marginBottom: 'clamp(12px, 2vh, 18px)',
            }}
          >
            <div
              style={{
                width: 'clamp(64px, 12vw, 90px)',
                height: 'clamp(64px, 12vw, 90px)',
                borderRadius: '50%',
                background: `linear-gradient(135deg, ${accentColor}20, ${accentColor}40)`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 'clamp(28px, 5vw, 40px)',
                transform: `scale(${avatarEnter})`,
                opacity: avatarEnter,
                boxShadow: `0 4px 16px ${accentColor}20`,
              }}
            >
              {'\uD83D\uDC68\u200D\uD83C\uDF73'}
            </div>
          </div>

          {/* Chef name */}
          <div
            style={{
              fontSize: 'clamp(22px, 5vw, 34px)',
              fontWeight: 900,
              color: textColor,
              textAlign: 'center',
              lineHeight: 1.15,
              opacity: nameEnter,
              transform: `translateY(${(1 - nameEnter) * 10}px)`,
            }}
          >
            {chefName}
          </div>

          {/* Title */}
          <div
            style={{
              fontSize: 'clamp(11px, 1.8vw, 14px)',
              fontWeight: 600,
              color: accentColor,
              textAlign: 'center',
              marginTop: 'clamp(2px, 0.4vh, 4px)',
              marginBottom: 'clamp(2px, 0.4vh, 4px)',
              opacity: nameEnter,
            }}
          >
            {title}
          </div>

          {/* Restaurant */}
          <div
            style={{
              fontSize: 'clamp(10px, 1.5vw, 13px)',
              color: `${textColor}70`,
              textAlign: 'center',
              marginBottom: 'clamp(14px, 2.5vh, 22px)',
              opacity: nameEnter,
            }}
          >
            at {restaurant}
          </div>

          {/* Experience badge */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'center',
              marginBottom: 'clamp(14px, 2.5vh, 20px)',
            }}
          >
            <div
              style={{
                background: `${accentColor}10`,
                borderRadius: 12,
                padding: 'clamp(8px, 1.5vh, 14px) clamp(16px, 3vw, 28px)',
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                transform: `scale(${yearsProgress})`,
                opacity: yearsProgress,
              }}
            >
              <div
                style={{
                  fontSize: 'clamp(22px, 4.5vw, 34px)',
                  fontWeight: 900,
                  color: accentColor,
                  lineHeight: 1,
                }}
              >
                {displayYears}+
              </div>
              <div
                style={{
                  fontSize: 'clamp(9px, 1.4vw, 11px)',
                  fontWeight: 600,
                  color: `${textColor}80`,
                  textTransform: 'uppercase',
                  letterSpacing: '0.06em',
                  lineHeight: 1.3,
                }}
              >
                Years<br />Experience
              </div>
            </div>
          </div>

          {/* Divider */}
          <div
            style={{
              height: 1,
              background: `${textColor}10`,
              marginBottom: 'clamp(12px, 2vh, 16px)',
            }}
          />

          {/* Specialties */}
          <div
            style={{
              fontSize: 'clamp(9px, 1.4vw, 11px)',
              fontWeight: 700,
              color: `${textColor}60`,
              textTransform: 'uppercase',
              letterSpacing: '0.12em',
              marginBottom: 'clamp(8px, 1.2vh, 12px)',
              textAlign: 'center',
              opacity: getSpecialtyProgress(0),
            }}
          >
            Specialties
          </div>
          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: 'clamp(4px, 0.8vw, 8px)',
              justifyContent: 'center',
            }}
          >
            {displaySpecialties.map((s, i) => {
              const sp = getSpecialtyProgress(i)
              return (
                <div
                  key={i}
                  style={{
                    background: `${accentColor}0A`,
                    border: `1px solid ${accentColor}20`,
                    borderRadius: 20,
                    padding: 'clamp(4px, 0.6vh, 7px) clamp(10px, 1.8vw, 16px)',
                    fontSize: 'clamp(10px, 1.6vw, 13px)',
                    fontWeight: 600,
                    color: textColor,
                    transform: `scale(${sp})`,
                    opacity: sp,
                  }}
                >
                  {s}
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}

registerMotionGraphic({
  id: 'tpl-scene-chef-profile',
  title: 'Chef Profile',
  description: 'Chef profile card with avatar, experience counter, specialty tags, and warm restaurant-inspired colors',
  tags: ['scene', 'food', 'chef', 'profile', 'restaurant', 'kitchen', 'cooking'],
  category: 'scene-layout',
  component: SceneChefProfileComponent as any,
  defaultConfig: {
    chefName: 'Marco Rossi',
    title: 'Executive Chef',
    restaurant: 'La Cucina',
    specialties: ['Italian Cuisine', 'Pasta Making', 'Seafood', 'Farm-to-Table'],
    yearsExperience: 18,
    bgColor: '#FFF8F0',
    cardColor: '#FFFFFF',
    accentColor: '#C0392B',
    textColor: '#2C1810',
  },
  configSchema: [
    { key: 'chefName', label: 'Chef Name', type: 'text', defaultValue: 'Marco Rossi', group: 'Content' },
    { key: 'title', label: 'Title', type: 'text', defaultValue: 'Executive Chef', group: 'Content' },
    { key: 'restaurant', label: 'Restaurant', type: 'text', defaultValue: 'La Cucina', group: 'Content' },
    { key: 'specialties', label: 'Specialties', type: 'text-array', defaultValue: ['Italian Cuisine', 'Pasta Making', 'Seafood', 'Farm-to-Table'], group: 'Content' },
    { key: 'yearsExperience', label: 'Years Experience', type: 'number', defaultValue: 18, min: 0, max: 99, group: 'Content' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#FFF8F0', group: 'Style' },
    { key: 'cardColor', label: 'Card Color', type: 'color', defaultValue: '#FFFFFF', group: 'Style' },
    { key: 'accentColor', label: 'Accent Color', type: 'color', defaultValue: '#C0392B', group: 'Style' },
    { key: 'textColor', label: 'Text Color', type: 'color', defaultValue: '#2C1810', group: 'Style' },
  ],
})
