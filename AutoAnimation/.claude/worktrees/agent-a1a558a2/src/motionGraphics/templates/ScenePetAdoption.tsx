import React from 'react'
import { registerMotionGraphic } from '../registry'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface ScenePetAdoptionConfig {
  petName: string
  species: string
  age: string
  personality: string[]
  shelterName: string
  bgColor: string
  cardColor: string
  accentColor: string
  textColor: string
}

function easeOutCubic(t: number): number { return 1 - Math.pow(1 - t, 3) }
function easeInCubic(t: number): number { return t * t * t }
function easeOutBack(t: number): number {
  const c1 = 1.70158; const c3 = c1 + 1
  return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2)
}

function ScenePetAdoptionComponent({ config, frame, durationInFrames }: MotionGraphicProps<ScenePetAdoptionConfig>) {
  const { petName, species, age, personality, shelterName, bgColor, cardColor, accentColor, textColor } = config
  const progress = frame / durationInFrames

  const enterProgress = Math.min(1, progress / 0.22)
  const holdProgress = progress >= 0.22 && progress < 0.8 ? (progress - 0.22) / 0.58 : 0
  const exitProgress = progress >= 0.8 ? (progress - 0.8) / 0.2 : 0

  const exitEased = easeInCubic(exitProgress)
  const exitOpacity = 1 - exitEased

  // Card bounces in from bottom
  const cardBounce = easeOutBack(Math.min(1, enterProgress / 0.6))
  const cardY = (1 - cardBounce) * 200

  // Icon scale with bounce
  const iconScale = easeOutBack(Math.max(0, Math.min(1, (enterProgress - 0.1) / 0.4)))

  // Name reveal
  const nameReveal = easeOutCubic(Math.max(0, Math.min(1, (enterProgress - 0.2) / 0.4)))

  // Info items
  const speciesReveal = easeOutCubic(Math.max(0, Math.min(1, (enterProgress - 0.35) / 0.35)))
  const ageReveal = easeOutCubic(Math.max(0, Math.min(1, (enterProgress - 0.45) / 0.35)))

  // Personality chips
  const getChipProgress = (idx: number) =>
    easeOutBack(Math.max(0, Math.min(1, (enterProgress - 0.55 - idx * 0.06) / 0.3)))

  // Adopt button
  const buttonReveal = easeOutBack(Math.max(0, Math.min(1, (enterProgress - 0.75) / 0.2)))
  const buttonPulse = holdProgress > 0 ? 1 + Math.sin(holdProgress * Math.PI * 8) * 0.03 : 1

  // Heart float during hold
  const hearts = Array.from({ length: 5 }, (_, i) => {
    const floatProgress = ((holdProgress * 3 + i * 0.2) % 1)
    const x = 50 + Math.sin(i * 2.3) * 25
    const y = 100 - floatProgress * 120
    const alpha = floatProgress < 0.8 ? Math.min(1, floatProgress * 3) : (1 - floatProgress) * 5
    return { x, y, alpha, size: 10 + (i % 3) * 4 }
  })

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
        fontFamily: "'Inter', 'Helvetica Neue', sans-serif",
      }}
    >
      {/* Floating hearts during hold */}
      {holdProgress > 0 && hearts.map((h, i) => (
        <div
          key={i}
          style={{
            position: 'absolute',
            left: `${h.x}%`,
            top: `${h.y}%`,
            fontSize: h.size,
            opacity: h.alpha * exitOpacity * 0.5,
            color: accentColor,
            pointerEvents: 'none',
          }}
        >
          {'♥'}
        </div>
      ))}

      <div
        style={{
          width: '82%',
          maxWidth: 400,
          background: cardColor,
          borderRadius: 'clamp(16px, 3vw, 28px)',
          padding: 'clamp(20px, 4.5vw, 40px)',
          boxShadow: `0 16px 48px rgba(0,0,0,0.2), 0 0 0 1px ${accentColor}20`,
          transform: `translateY(${cardY + exitEased * -100}px)`,
          opacity: cardBounce * exitOpacity,
          textAlign: 'center',
        }}
      >
        {/* Adopt Me banner */}
        <div
          style={{
            position: 'absolute',
            top: -12,
            left: '50%',
            transform: `translateX(-50%) scale(${easeOutBack(Math.max(0, Math.min(1, enterProgress / 0.3)))})`,
            background: accentColor,
            color: '#FFFFFF',
            fontSize: 'clamp(8px, 1.4vw, 12px)',
            fontWeight: 900,
            textTransform: 'uppercase',
            letterSpacing: '0.15em',
            padding: 'clamp(3px, 0.6vw, 6px) clamp(12px, 2vw, 20px)',
            borderRadius: 100,
            boxShadow: `0 4px 12px ${accentColor}40`,
          }}
        >
          ADOPT ME
        </div>

        {/* Pet icon */}
        <div
          style={{
            fontSize: 'clamp(40px, 10vw, 72px)',
            marginBottom: 'clamp(8px, 1.5vw, 14px)',
            transform: `scale(${iconScale})`,
          }}
        >
          {species.toLowerCase().includes('cat') ? '🐱' : species.toLowerCase().includes('bird') ? '🐦' : '🐶'}
        </div>

        {/* Pet name */}
        <div
          style={{
            fontSize: 'clamp(24px, 6vw, 42px)',
            fontWeight: 900,
            color: textColor,
            opacity: nameReveal,
            transform: `translateY(${(1 - nameReveal) * 15}px)`,
            marginBottom: 'clamp(2px, 0.5vw, 4px)',
          }}
        >
          {petName}
        </div>

        {/* Species & Age */}
        <div
          style={{
            fontSize: 'clamp(11px, 1.8vw, 15px)',
            fontWeight: 600,
            color: accentColor,
            textTransform: 'uppercase',
            letterSpacing: '0.1em',
            opacity: speciesReveal,
            marginBottom: 'clamp(1px, 0.3vw, 3px)',
          }}
        >
          {species}
        </div>
        <div
          style={{
            fontSize: 'clamp(10px, 1.5vw, 13px)',
            fontWeight: 400,
            color: `${textColor}77`,
            opacity: ageReveal,
            marginBottom: 'clamp(12px, 2.5vw, 22px)',
          }}
        >
          {age}
        </div>

        {/* Divider */}
        <div
          style={{
            width: `${easeOutCubic(Math.max(0, Math.min(1, (enterProgress - 0.5) / 0.3))) * 60}%`,
            height: 2,
            background: `${accentColor}30`,
            margin: '0 auto',
            marginBottom: 'clamp(12px, 2.5vw, 22px)',
            borderRadius: 1,
          }}
        />

        {/* Personality chips */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'clamp(4px, 0.7vw, 6px)', justifyContent: 'center', marginBottom: 'clamp(14px, 3vw, 24px)' }}>
          {personality.map((trait, i) => {
            const cp = getChipProgress(i)
            return (
              <div
                key={i}
                style={{
                  fontSize: 'clamp(9px, 1.3vw, 12px)',
                  fontWeight: 600,
                  color: textColor,
                  background: `${accentColor}18`,
                  border: `1px solid ${accentColor}30`,
                  padding: 'clamp(2px, 0.4vw, 5px) clamp(6px, 1vw, 12px)',
                  borderRadius: 100,
                  transform: `scale(${cp})`,
                  opacity: cp,
                }}
              >
                {trait}
              </div>
            )
          })}
        </div>

        {/* Adopt button */}
        <div
          style={{
            background: accentColor,
            color: '#FFFFFF',
            fontSize: 'clamp(12px, 2vw, 16px)',
            fontWeight: 800,
            padding: 'clamp(8px, 1.5vw, 14px)',
            borderRadius: 'clamp(8px, 1.5vw, 12px)',
            textTransform: 'uppercase',
            letterSpacing: '0.1em',
            transform: `scale(${buttonReveal * buttonPulse})`,
            boxShadow: `0 4px 16px ${accentColor}30`,
          }}
        >
          Meet {petName}
        </div>

        {/* Shelter name */}
        <div
          style={{
            fontSize: 'clamp(8px, 1.2vw, 11px)',
            fontWeight: 400,
            color: `${textColor}55`,
            marginTop: 'clamp(8px, 1.5vw, 14px)',
            opacity: easeOutCubic(Math.max(0, Math.min(1, (enterProgress - 0.85) / 0.15))),
          }}
        >
          {shelterName}
        </div>
      </div>
    </div>
  )
}

registerMotionGraphic({
  id: 'tpl-scene-pet-adoption',
  title: 'Pet Adoption Card',
  description: 'Pet adoption profile card with species icon, personality traits, adopt button, shelter info, and floating hearts',
  tags: ['scene', 'pet', 'adoption', 'animal', 'shelter', 'rescue', 'cute'],
  category: 'scene-layout',
  component: ScenePetAdoptionComponent as unknown as React.ComponentType<MotionGraphicProps>,
  defaultConfig: {
    petName: 'Buddy',
    species: 'Dog - Labrador Mix',
    age: '2 years old',
    personality: ['Friendly', 'Energetic', 'Good with kids', 'House trained'],
    shelterName: 'Happy Tails Rescue',
    bgColor: '#FFF8F0',
    cardColor: '#FFFFFF',
    accentColor: '#EF4444',
    textColor: '#1F2937',
  },
  configSchema: [
    { key: 'petName', label: 'Pet Name', type: 'text', defaultValue: 'Buddy', group: 'Content' },
    { key: 'species', label: 'Species/Breed', type: 'text', defaultValue: 'Dog - Labrador Mix', group: 'Content' },
    { key: 'age', label: 'Age', type: 'text', defaultValue: '2 years old', group: 'Content' },
    { key: 'personality', label: 'Personality', type: 'text-array', defaultValue: ['Friendly', 'Energetic', 'Good with kids', 'House trained'], group: 'Content' },
    { key: 'shelterName', label: 'Shelter Name', type: 'text', defaultValue: 'Happy Tails Rescue', group: 'Content' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#FFF8F0', group: 'Style' },
    { key: 'cardColor', label: 'Card Color', type: 'color', defaultValue: '#FFFFFF', group: 'Style' },
    { key: 'accentColor', label: 'Accent Color', type: 'color', defaultValue: '#EF4444', group: 'Style' },
    { key: 'textColor', label: 'Text Color', type: 'color', defaultValue: '#1F2937', group: 'Style' },
  ],
})
