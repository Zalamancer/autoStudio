import React from 'react'
import { registerMotionGraphic } from '../registry'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface ScenePlantCareConfig {
  plantName: string
  waterFrequency: string
  sunlight: string
  difficulty: string
  tips: string[]
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

function ScenePlantCareComponent({ config, frame, durationInFrames }: MotionGraphicProps<ScenePlantCareConfig>) {
  const { plantName, waterFrequency, sunlight, difficulty, tips, bgColor, cardColor, accentColor, textColor } = config
  const progress = frame / durationInFrames

  const enterProgress = Math.min(1, progress / 0.22)
  const holdProgress = progress >= 0.22 && progress < 0.8 ? (progress - 0.22) / 0.58 : 0
  const exitProgress = progress >= 0.8 ? (progress - 0.8) / 0.2 : 0

  const exitEased = easeInCubic(exitProgress)
  const exitOpacity = 1 - exitEased

  // Card grows from center like a plant
  const cardGrow = easeOutBack(Math.min(1, enterProgress / 0.5))
  const cardScale = cardGrow

  // Plant icon sprouts
  const sproutScale = easeOutBack(Math.max(0, Math.min(1, (enterProgress - 0.1) / 0.4)))

  // Info items reveal
  const nameReveal = easeOutCubic(Math.max(0, Math.min(1, (enterProgress - 0.25) / 0.35)))
  const waterReveal = easeOutCubic(Math.max(0, Math.min(1, (enterProgress - 0.4) / 0.3)))
  const sunReveal = easeOutCubic(Math.max(0, Math.min(1, (enterProgress - 0.5) / 0.3)))
  const diffReveal = easeOutCubic(Math.max(0, Math.min(1, (enterProgress - 0.6) / 0.3)))

  // Tips stagger
  const getTipProgress = (idx: number) =>
    easeOutCubic(Math.max(0, Math.min(1, (enterProgress - 0.65 - idx * 0.06) / 0.25)))

  // Water droplet animation during hold
  const dropletY = holdProgress > 0 ? ((holdProgress * 5) % 1) * 60 : 0
  const dropletAlpha = holdProgress > 0 ? Math.max(0, 1 - ((holdProgress * 5) % 1)) : 0

  // Gentle sway
  const sway = holdProgress > 0 ? Math.sin(holdProgress * Math.PI * 6) * 1.5 : 0

  // Difficulty dots
  const diffLevel = difficulty.toLowerCase() === 'easy' ? 1 : difficulty.toLowerCase() === 'medium' ? 2 : 3

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
      <div
        style={{
          width: '85%',
          maxWidth: 420,
          background: cardColor,
          borderRadius: 'clamp(16px, 3vw, 28px)',
          padding: 'clamp(20px, 4.5vw, 40px)',
          boxShadow: '0 12px 40px rgba(0,0,0,0.12)',
          border: `1px solid ${accentColor}20`,
          transform: `scale(${cardScale * (1 - exitEased * 0.15)}) rotate(${sway}deg)`,
          opacity: cardGrow * exitOpacity,
        }}
      >
        {/* Plant icon */}
        <div
          style={{
            fontSize: 'clamp(36px, 8vw, 60px)',
            textAlign: 'center',
            marginBottom: 'clamp(8px, 1.5vw, 14px)',
            transform: `scale(${sproutScale})`,
            transformOrigin: 'bottom center',
          }}
        >
          {'🌿'}
        </div>

        {/* Plant name */}
        <div
          style={{
            fontSize: 'clamp(22px, 5vw, 36px)',
            fontWeight: 900,
            color: textColor,
            textAlign: 'center',
            opacity: nameReveal,
            transform: `translateY(${(1 - nameReveal) * 15}px)`,
            marginBottom: 'clamp(12px, 2.5vw, 20px)',
          }}
        >
          {plantName}
        </div>

        {/* Info grid */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr 1fr',
            gap: 'clamp(6px, 1.2vw, 12px)',
            marginBottom: 'clamp(14px, 3vw, 24px)',
          }}
        >
          {/* Water */}
          <div
            style={{
              textAlign: 'center',
              opacity: waterReveal,
              transform: `translateY(${(1 - waterReveal) * 10}px)`,
              position: 'relative',
            }}
          >
            <div style={{ fontSize: 'clamp(16px, 3vw, 24px)', marginBottom: 2 }}>{'💧'}</div>
            {/* Water droplet animation */}
            {holdProgress > 0 && (
              <div
                style={{
                  position: 'absolute',
                  top: `${dropletY}%`,
                  left: '50%',
                  transform: 'translate(-50%, 0)',
                  width: 4,
                  height: 6,
                  borderRadius: '50%',
                  background: '#60A5FA',
                  opacity: dropletAlpha * 0.4,
                }}
              />
            )}
            <div style={{ fontSize: 'clamp(8px, 1.3vw, 11px)', fontWeight: 700, color: `${textColor}aa`, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Water</div>
            <div style={{ fontSize: 'clamp(9px, 1.5vw, 13px)', fontWeight: 600, color: textColor }}>{waterFrequency}</div>
          </div>

          {/* Sunlight */}
          <div style={{ textAlign: 'center', opacity: sunReveal, transform: `translateY(${(1 - sunReveal) * 10}px)` }}>
            <div style={{ fontSize: 'clamp(16px, 3vw, 24px)', marginBottom: 2 }}>{'☀️'}</div>
            <div style={{ fontSize: 'clamp(8px, 1.3vw, 11px)', fontWeight: 700, color: `${textColor}aa`, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Light</div>
            <div style={{ fontSize: 'clamp(9px, 1.5vw, 13px)', fontWeight: 600, color: textColor }}>{sunlight}</div>
          </div>

          {/* Difficulty */}
          <div style={{ textAlign: 'center', opacity: diffReveal, transform: `translateY(${(1 - diffReveal) * 10}px)` }}>
            <div style={{ fontSize: 'clamp(16px, 3vw, 24px)', marginBottom: 2 }}>{'🌱'}</div>
            <div style={{ fontSize: 'clamp(8px, 1.3vw, 11px)', fontWeight: 700, color: `${textColor}aa`, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Level</div>
            <div style={{ display: 'flex', justifyContent: 'center', gap: 3, marginTop: 2 }}>
              {[1, 2, 3].map(l => (
                <div
                  key={l}
                  style={{
                    width: 'clamp(6px, 1vw, 8px)',
                    height: 'clamp(6px, 1vw, 8px)',
                    borderRadius: '50%',
                    background: l <= diffLevel ? accentColor : `${textColor}20`,
                  }}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Divider */}
        <div
          style={{
            height: 1,
            background: `${accentColor}25`,
            marginBottom: 'clamp(10px, 2vw, 18px)',
            width: `${easeOutCubic(Math.max(0, Math.min(1, (enterProgress - 0.6) / 0.2))) * 100}%`,
          }}
        />

        {/* Tips */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'clamp(4px, 0.8vw, 8px)' }}>
          <div style={{ fontSize: 'clamp(9px, 1.4vw, 12px)', fontWeight: 800, color: accentColor, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 2 }}>
            Care Tips
          </div>
          {tips.map((tip, i) => {
            const tp = getTipProgress(i)
            return (
              <div
                key={i}
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: 'clamp(4px, 0.8vw, 8px)',
                  opacity: tp,
                  transform: `translateX(${(1 - tp) * 15}px)`,
                }}
              >
                <div style={{ color: accentColor, fontSize: 'clamp(8px, 1.2vw, 11px)', fontWeight: 700, flexShrink: 0, marginTop: 1 }}>{'●'}</div>
                <div style={{ fontSize: 'clamp(10px, 1.5vw, 13px)', fontWeight: 500, color: `${textColor}bb`, lineHeight: 1.3 }}>{tip}</div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

registerMotionGraphic({
  id: 'tpl-scene-plant-care',
  title: 'Plant Care Guide',
  description: 'Plant care card with watering schedule, sunlight needs, difficulty level, and care tips. Grows in with sway animation.',
  tags: ['scene', 'plant', 'garden', 'care', 'nature', 'guide', 'botanical'],
  category: 'scene-layout',
  component: ScenePlantCareComponent as unknown as React.ComponentType<MotionGraphicProps>,
  defaultConfig: {
    plantName: 'Monstera Deliciosa',
    waterFrequency: 'Weekly',
    sunlight: 'Indirect',
    difficulty: 'Easy',
    tips: ['Let soil dry between waterings', 'Rotate for even growth', 'Wipe leaves monthly'],
    bgColor: '#F0F7F0',
    cardColor: '#FFFFFF',
    accentColor: '#16A34A',
    textColor: '#1A2E1A',
  },
  configSchema: [
    { key: 'plantName', label: 'Plant Name', type: 'text', defaultValue: 'Monstera Deliciosa', group: 'Content' },
    { key: 'waterFrequency', label: 'Water Frequency', type: 'text', defaultValue: 'Weekly', group: 'Content' },
    { key: 'sunlight', label: 'Sunlight', type: 'text', defaultValue: 'Indirect', group: 'Content' },
    { key: 'difficulty', label: 'Difficulty', type: 'text', defaultValue: 'Easy', group: 'Content' },
    { key: 'tips', label: 'Care Tips', type: 'text-array', defaultValue: ['Let soil dry between waterings', 'Rotate for even growth', 'Wipe leaves monthly'], group: 'Content' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#F0F7F0', group: 'Style' },
    { key: 'cardColor', label: 'Card Color', type: 'color', defaultValue: '#FFFFFF', group: 'Style' },
    { key: 'accentColor', label: 'Accent Color', type: 'color', defaultValue: '#16A34A', group: 'Style' },
    { key: 'textColor', label: 'Text Color', type: 'color', defaultValue: '#1A2E1A', group: 'Style' },
  ],
})
