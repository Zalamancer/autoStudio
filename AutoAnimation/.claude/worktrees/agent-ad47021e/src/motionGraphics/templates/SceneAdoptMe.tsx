import React from 'react'
import { registerMotionGraphic } from '../registry'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface SceneAdoptMeConfig {
  petName: string
  breed: string
  age: string
  personality: string
  adoptionCenter: string
  bgColor: string
  cardColor: string
  heartColor: string
  accentColor: string
  textColor: string
}

function easeOutCubic(t: number): number { return 1 - Math.pow(1 - t, 3) }
function easeInCubic(t: number): number { return t * t * t }
function easeOutBack(t: number): number {
  const c1 = 1.70158
  const c3 = c1 + 1
  return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2)
}

function SceneAdoptMeComponent({ config, progress }: MotionGraphicProps<SceneAdoptMeConfig>) {
  const { petName, breed, age, personality, adoptionCenter, bgColor, cardColor, heartColor, accentColor, textColor } = config

  const enterProgress = progress < 0.2 ? progress / 0.2 : 1
  const exitProgress = progress >= 0.8 ? (progress - 0.8) / 0.2 : 0
  const holdProgress = progress >= 0.2 && progress < 0.8 ? (progress - 0.2) / 0.6 : 0

  const exitEased = easeInCubic(exitProgress)
  const exitOpacity = 1 - exitEased

  // Floating hearts
  const hearts = [
    { x: 10, y: 20, size: 20, delay: 0, speed: 1.2 },
    { x: 85, y: 15, size: 16, delay: 0.1, speed: 0.9 },
    { x: 20, y: 70, size: 22, delay: 0.2, speed: 1.1 },
    { x: 90, y: 65, size: 14, delay: 0.3, speed: 1.3 },
    { x: 50, y: 10, size: 18, delay: 0.05, speed: 1.0 },
    { x: 70, y: 80, size: 24, delay: 0.15, speed: 0.8 },
    { x: 5, y: 45, size: 12, delay: 0.25, speed: 1.4 },
    { x: 95, y: 40, size: 16, delay: 0.35, speed: 1.0 },
  ]

  // Banner slides down
  const bannerSlide = easeOutBack(Math.min(1, enterProgress / 0.5))
  const bannerY = (1 - bannerSlide) * -120

  // Card fades and scales in
  const cardScale = easeOutBack(Math.max(0, Math.min(1, (enterProgress - 0.2) / 0.5)))

  // Info items stagger
  const nameReveal = easeOutCubic(Math.max(0, Math.min(1, (enterProgress - 0.35) / 0.35)))
  const breedReveal = easeOutCubic(Math.max(0, Math.min(1, (enterProgress - 0.45) / 0.35)))
  const ageReveal = easeOutCubic(Math.max(0, Math.min(1, (enterProgress - 0.55) / 0.35)))
  const personalityReveal = easeOutCubic(Math.max(0, Math.min(1, (enterProgress - 0.65) / 0.35)))
  const centerReveal = easeOutCubic(Math.max(0, Math.min(1, (enterProgress - 0.75) / 0.25)))

  // Heartbeat pulse during hold
  const heartbeat = progress >= 0.2 && progress < 0.8
    ? 1 + Math.sin(holdProgress * Math.PI * 8) * 0.04
    : 1

  return (
    <div style={{ position: 'absolute', inset: 0, overflow: 'hidden' }}>
      <div style={{ position: 'absolute', inset: 0, background: bgColor }} />

      {/* Floating hearts */}
      {hearts.map((h, i) => {
        const hProg = Math.max(0, Math.min(1, (enterProgress - h.delay) / 0.4))
        const hScale = easeOutBack(hProg)
        const floatOffset = progress >= 0.2 && progress < 0.8
          ? Math.sin(holdProgress * Math.PI * h.speed * 4 + i) * 8
          : 0
        return (
          <div
            key={i}
            style={{
              position: 'absolute',
              left: `${h.x}%`,
              top: `${h.y}%`,
              transform: `translate(-50%, -50%) scale(${hScale}) translateY(${floatOffset - exitEased * 60}px)`,
              opacity: hScale * exitOpacity * 0.35,
              fontSize: h.size,
              pointerEvents: 'none',
              color: heartColor,
            }}
          >
            &#10084;
          </div>
        )
      })}

      {/* ADOPT ME banner */}
      <div
        style={{
          position: 'absolute',
          top: '8%',
          left: '50%',
          transform: `translate(-50%, ${bannerY + exitEased * -100}px)`,
          opacity: bannerSlide * exitOpacity,
          textAlign: 'center',
        }}
      >
        <div
          style={{
            fontFamily: "'Inter', 'Helvetica Neue', sans-serif",
            fontSize: 'clamp(28px, 7vw, 52px)',
            fontWeight: 900,
            color: heartColor,
            textShadow: `0 2px 12px ${heartColor}40`,
            letterSpacing: '0.05em',
          }}
        >
          ADOPT ME!
        </div>
        <div
          style={{
            fontFamily: "'Inter', sans-serif",
            fontSize: 'clamp(9px, 1.5vw, 13px)',
            fontWeight: 500,
            color: `${textColor}80`,
            marginTop: 'clamp(2px, 0.3vw, 4px)',
          }}
        >
          &#10084; Give me a forever home &#10084;
        </div>
      </div>

      {/* Pet info card */}
      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: `translate(-50%, calc(-40% + ${exitEased * 150}px)) scale(${cardScale * heartbeat})`,
          opacity: cardScale * exitOpacity,
          width: '82%',
          maxWidth: 400,
        }}
      >
        <div
          style={{
            background: cardColor,
            borderRadius: 'clamp(14px, 3vw, 22px)',
            padding: 'clamp(18px, 3.5vw, 30px)',
            boxShadow: `0 10px 40px rgba(0,0,0,0.15), 0 0 0 2px ${heartColor}20`,
          }}
        >
          {/* Pet name */}
          <div
            style={{
              fontFamily: "'Inter', 'Helvetica Neue', sans-serif",
              fontSize: 'clamp(20px, 4.5vw, 34px)',
              fontWeight: 800,
              color: textColor,
              textAlign: 'center',
              opacity: nameReveal,
              transform: `translateY(${(1 - nameReveal) * 15}px)`,
              marginBottom: 'clamp(10px, 2vw, 18px)',
            }}
          >
            {petName}
          </div>

          {/* Info rows */}
          {[
            { label: 'Breed', value: breed, reveal: breedReveal },
            { label: 'Age', value: age, reveal: ageReveal },
            { label: 'Personality', value: personality, reveal: personalityReveal },
          ].map((item, i) => (
            <div
              key={i}
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: 'clamp(6px, 1vw, 10px) 0',
                borderBottom: i < 2 ? `1px solid ${textColor}12` : 'none',
                opacity: item.reveal,
                transform: `translateX(${(1 - item.reveal) * 30}px)`,
              }}
            >
              <span
                style={{
                  fontFamily: "'Inter', sans-serif",
                  fontSize: 'clamp(10px, 1.6vw, 13px)',
                  fontWeight: 600,
                  color: `${textColor}70`,
                  textTransform: 'uppercase',
                  letterSpacing: '0.08em',
                }}
              >
                {item.label}
              </span>
              <span
                style={{
                  fontFamily: "'Inter', sans-serif",
                  fontSize: 'clamp(11px, 1.8vw, 15px)',
                  fontWeight: 700,
                  color: textColor,
                }}
              >
                {item.value}
              </span>
            </div>
          ))}

          {/* Adoption center */}
          <div
            style={{
              marginTop: 'clamp(12px, 2vw, 18px)',
              textAlign: 'center',
              opacity: centerReveal,
              transform: `translateY(${(1 - centerReveal) * 12}px)`,
            }}
          >
            <div
              style={{
                fontFamily: "'Inter', sans-serif",
                fontSize: 'clamp(9px, 1.3vw, 11px)',
                fontWeight: 500,
                color: `${textColor}60`,
                textTransform: 'uppercase',
                letterSpacing: '0.1em',
                marginBottom: 'clamp(2px, 0.4vw, 4px)',
              }}
            >
              Available at
            </div>
            <div
              style={{
                fontFamily: "'Inter', sans-serif",
                fontSize: 'clamp(12px, 2vw, 16px)',
                fontWeight: 700,
                color: accentColor,
              }}
            >
              {adoptionCenter}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

registerMotionGraphic({
  id: 'tpl-scene-adopt-me',
  title: 'Adopt Me Card',
  description: 'Warm adoption card with pet info, floating hearts, and inviting design. Hearts pop in, info reveals with staggered animation.',
  tags: ['scene', 'pet', 'adoption', 'animal', 'heart', 'cute', 'rescue'],
  category: 'scene-layout',
  component: SceneAdoptMeComponent as any,
  defaultConfig: {
    petName: 'Buddy',
    breed: 'Labrador Mix',
    age: '2 years',
    personality: 'Gentle & Playful',
    adoptionCenter: 'Happy Paws Shelter',
    bgColor: '#FFF0F3',
    cardColor: '#FFFFFF',
    heartColor: '#E11D48',
    accentColor: '#BE123C',
    textColor: '#1F2937',
  },
  configSchema: [
    { key: 'petName', label: 'Pet Name', type: 'text', defaultValue: 'Buddy', group: 'Content' },
    { key: 'breed', label: 'Breed', type: 'text', defaultValue: 'Labrador Mix', group: 'Content' },
    { key: 'age', label: 'Age', type: 'text', defaultValue: '2 years', group: 'Content' },
    { key: 'personality', label: 'Personality', type: 'text', defaultValue: 'Gentle & Playful', group: 'Content' },
    { key: 'adoptionCenter', label: 'Adoption Center', type: 'text', defaultValue: 'Happy Paws Shelter', group: 'Content' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#FFF0F3', group: 'Style' },
    { key: 'cardColor', label: 'Card Color', type: 'color', defaultValue: '#FFFFFF', group: 'Style' },
    { key: 'heartColor', label: 'Heart Color', type: 'color', defaultValue: '#E11D48', group: 'Style' },
    { key: 'accentColor', label: 'Accent Color', type: 'color', defaultValue: '#BE123C', group: 'Style' },
    { key: 'textColor', label: 'Text Color', type: 'color', defaultValue: '#1F2937', group: 'Style' },
  ],
})
