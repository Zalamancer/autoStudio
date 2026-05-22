import React from 'react'
import { registerMotionGraphic } from '../registry'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface ScenePetProfileConfig {
  petName: string
  breed: string
  age: string
  traits: string[]
  icon: string
  bgColor: string
  cardColor: string
  accentColor: string
  textColor: string
  traitColor: string
}

function easeOutCubic(t: number): number { return 1 - Math.pow(1 - t, 3) }
function easeInCubic(t: number): number { return t * t * t }
function easeOutBack(t: number): number {
  const c1 = 1.70158
  const c3 = c1 + 1
  return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2)
}

function ScenePetProfileComponent({ config, progress }: MotionGraphicProps<ScenePetProfileConfig>) {
  const { petName, breed, age, traits, icon, bgColor, cardColor, accentColor, textColor, traitColor } = config

  const enterProgress = progress < 0.2 ? progress / 0.2 : 1
  const exitProgress = progress >= 0.8 ? (progress - 0.8) / 0.2 : 0
  const holdProgress = progress >= 0.2 && progress < 0.8 ? (progress - 0.2) / 0.6 : 0

  const exitEased = easeInCubic(exitProgress)
  const exitOpacity = 1 - exitEased

  // Paw prints stamp in during enter
  const pawPositions = [
    { x: 8, y: 12, delay: 0 },
    { x: 78, y: 8, delay: 0.15 },
    { x: 15, y: 75, delay: 0.3 },
    { x: 85, y: 70, delay: 0.45 },
    { x: 50, y: 88, delay: 0.6 },
  ]

  // Card slides up from bottom
  const cardSlide = easeOutBack(Math.min(1, enterProgress / 0.7))
  const cardY = (1 - cardSlide) * 300

  // Info items stagger in
  const nameReveal = easeOutCubic(Math.max(0, Math.min(1, (enterProgress - 0.3) / 0.4)))
  const breedReveal = easeOutCubic(Math.max(0, Math.min(1, (enterProgress - 0.45) / 0.4)))
  const ageReveal = easeOutCubic(Math.max(0, Math.min(1, (enterProgress - 0.55) / 0.4)))

  // Subtle float during hold
  const floatY = progress >= 0.2 && progress < 0.8 ? Math.sin(holdProgress * Math.PI * 4) * 3 : 0

  return (
    <div style={{ position: 'absolute', inset: 0, overflow: 'hidden' }}>
      <div style={{ position: 'absolute', inset: 0, background: bgColor }} />

      {/* Paw print decorations */}
      {pawPositions.map((paw, i) => {
        const pawProgress = Math.max(0, Math.min(1, (enterProgress - paw.delay) / 0.3))
        const pawScale = easeOutBack(pawProgress)
        return (
          <div
            key={i}
            style={{
              position: 'absolute',
              left: `${paw.x}%`,
              top: `${paw.y}%`,
              transform: `translate(-50%, -50%) scale(${pawScale}) rotate(${(i * 15) - 30}deg)`,
              opacity: pawScale * exitOpacity * 0.2,
              fontSize: 'clamp(24px, 5vw, 48px)',
              pointerEvents: 'none',
            }}
          >
            🐾
          </div>
        )
      })}

      {/* Profile card */}
      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: `translate(-50%, calc(-50% + ${cardY + exitEased * 200 + floatY}px))`,
          opacity: cardSlide * exitOpacity,
          width: '80%',
          maxWidth: 420,
        }}
      >
        <div
          style={{
            background: cardColor,
            borderRadius: 'clamp(14px, 3vw, 24px)',
            padding: 'clamp(20px, 4vw, 36px)',
            boxShadow: `0 12px 40px rgba(0,0,0,0.3), 0 0 0 2px ${accentColor}30`,
            textAlign: 'center',
          }}
        >
          {/* Pet icon */}
          <div
            style={{
              fontSize: 'clamp(36px, 8vw, 64px)',
              marginBottom: 'clamp(8px, 1.5vw, 14px)',
              transform: `scale(${easeOutBack(Math.min(1, enterProgress / 0.4))})`,
            }}
          >
            {icon}
          </div>

          {/* Pet name */}
          <div
            style={{
              fontFamily: "'Inter', 'Helvetica Neue', sans-serif",
              fontSize: 'clamp(22px, 5vw, 38px)',
              fontWeight: 900,
              color: textColor,
              opacity: nameReveal,
              transform: `translateY(${(1 - nameReveal) * 20}px)`,
              marginBottom: 'clamp(4px, 0.8vw, 8px)',
            }}
          >
            {petName}
          </div>

          {/* Breed */}
          <div
            style={{
              fontFamily: "'Inter', sans-serif",
              fontSize: 'clamp(11px, 2vw, 16px)',
              fontWeight: 600,
              color: accentColor,
              textTransform: 'uppercase',
              letterSpacing: '0.12em',
              opacity: breedReveal,
              transform: `translateY(${(1 - breedReveal) * 15}px)`,
              marginBottom: 'clamp(2px, 0.5vw, 6px)',
            }}
          >
            {breed}
          </div>

          {/* Age */}
          <div
            style={{
              fontFamily: "'Inter', sans-serif",
              fontSize: 'clamp(10px, 1.6vw, 14px)',
              fontWeight: 400,
              color: `${textColor}99`,
              opacity: ageReveal,
              transform: `translateY(${(1 - ageReveal) * 12}px)`,
              marginBottom: 'clamp(12px, 2vw, 20px)',
            }}
          >
            {age}
          </div>

          {/* Divider */}
          <div
            style={{
              width: `${easeOutCubic(Math.max(0, Math.min(1, (enterProgress - 0.5) / 0.4))) * 100}%`,
              height: 2,
              background: `${accentColor}40`,
              margin: '0 auto',
              marginBottom: 'clamp(12px, 2vw, 20px)',
              borderRadius: 1,
            }}
          />

          {/* Personality traits */}
          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: 'clamp(4px, 0.8vw, 8px)',
              justifyContent: 'center',
            }}
          >
            {traits.map((trait, i) => {
              const traitDelay = 0.6 + i * 0.08
              const traitProgress = easeOutBack(Math.max(0, Math.min(1, (enterProgress - traitDelay) / 0.3)))
              return (
                <div
                  key={i}
                  style={{
                    fontFamily: "'Inter', sans-serif",
                    fontSize: 'clamp(9px, 1.4vw, 13px)',
                    fontWeight: 600,
                    color: traitColor,
                    background: `${accentColor}20`,
                    padding: 'clamp(3px, 0.5vw, 6px) clamp(8px, 1.2vw, 14px)',
                    borderRadius: 'clamp(8px, 1.5vw, 16px)',
                    transform: `scale(${traitProgress})`,
                    opacity: traitProgress,
                    border: `1px solid ${accentColor}30`,
                  }}
                >
                  {trait}
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
  id: 'tpl-scene-pet-profile',
  title: 'Pet Profile Card',
  description: 'Pet social profile with name, breed, age, personality traits, and paw print decorations. Playful, cute entrance with stamping paw prints.',
  tags: ['scene', 'pet', 'animal', 'profile', 'cute', 'paw', 'social'],
  category: 'scene-layout',
  component: ScenePetProfileComponent as any,
  defaultConfig: {
    petName: 'Luna',
    breed: 'Golden Retriever',
    age: '3 years old',
    traits: ['Playful', 'Loyal', 'Energetic', 'Friendly', 'Cuddly'],
    icon: '\uD83D\uDC36',
    bgColor: '#FFF5E6',
    cardColor: '#FFFFFF',
    accentColor: '#F59E0B',
    textColor: '#1F2937',
    traitColor: '#92400E',
  },
  configSchema: [
    { key: 'petName', label: 'Pet Name', type: 'text', defaultValue: 'Luna', group: 'Content' },
    { key: 'breed', label: 'Breed', type: 'text', defaultValue: 'Golden Retriever', group: 'Content' },
    { key: 'age', label: 'Age', type: 'text', defaultValue: '3 years old', group: 'Content' },
    { key: 'traits', label: 'Traits', type: 'text-array', defaultValue: ['Playful', 'Loyal', 'Energetic', 'Friendly', 'Cuddly'], group: 'Content' },
    { key: 'icon', label: 'Pet Emoji', type: 'text', defaultValue: '\uD83D\uDC36', group: 'Content' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#FFF5E6', group: 'Style' },
    { key: 'cardColor', label: 'Card Color', type: 'color', defaultValue: '#FFFFFF', group: 'Style' },
    { key: 'accentColor', label: 'Accent Color', type: 'color', defaultValue: '#F59E0B', group: 'Style' },
    { key: 'textColor', label: 'Text Color', type: 'color', defaultValue: '#1F2937', group: 'Style' },
    { key: 'traitColor', label: 'Trait Text Color', type: 'color', defaultValue: '#92400E', group: 'Style' },
  ],
})
