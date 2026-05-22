import React from 'react'
import { registerMotionGraphic } from '../registry'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface PlantGrowthConfig {
  plantName: string
  currentHeight: number
  targetHeight: number
  unit: string
  dayNumber: number
  waterStatus: string
  sunlightStatus: string
  bgColor: string
  textColor: string
  accentColor: string
}

function easeOutCubic(t: number): number { return 1 - Math.pow(1 - t, 3) }
function easeInCubic(t: number): number { return t * t * t }
function easeOutBack(t: number): number {
  const c1 = 1.70158
  const c3 = c1 + 1
  return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2)
}

function ScenePlantGrowthComponent({ config, progress }: MotionGraphicProps<PlantGrowthConfig>) {
  const { plantName, currentHeight, targetHeight, unit, dayNumber, waterStatus, sunlightStatus, bgColor, textColor, accentColor } = config

  const enterProgress = progress < 0.2 ? progress / 0.2 : 1
  const holdProgress = progress >= 0.2 && progress < 0.8 ? (progress - 0.2) / 0.6 : progress >= 0.8 ? 1 : 0
  const exitProgress = progress >= 0.8 ? (progress - 0.8) / 0.2 : 0

  const exitEased = easeInCubic(exitProgress)
  const exitOpacity = exitProgress > 0 ? 1 - exitEased : 1

  const growthPercent = currentHeight / targetHeight
  const growthBarProg = easeOutCubic(Math.max(0, Math.min(1, (enterProgress - 0.1) / 0.6)))

  // Stem grows up
  const stemHeight = growthBarProg * growthPercent * 100

  // Leaves appear staggered
  const leaf1Enter = easeOutBack(Math.max(0, Math.min(1, (enterProgress - 0.3) / 0.3)))
  const leaf2Enter = easeOutBack(Math.max(0, Math.min(1, (enterProgress - 0.45) / 0.3)))
  const leaf3Enter = easeOutBack(Math.max(0, Math.min(1, (enterProgress - 0.6) / 0.3)))

  // Info cards
  const dayEnter = easeOutCubic(Math.max(0, Math.min(1, (enterProgress - 0.2) / 0.3)))
  const statusEnter = easeOutCubic(Math.max(0, Math.min(1, (enterProgress - 0.5) / 0.3)))
  const statsEnter = easeOutCubic(Math.max(0, Math.min(1, (enterProgress - 0.65) / 0.3)))

  // Gentle sway during hold
  const sway = progress >= 0.2 && progress < 0.8
    ? Math.sin(holdProgress * Math.PI * 6) * 3
    : 0

  return (
    <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', fontFamily: "'Inter', 'Helvetica Neue', sans-serif" }}>
      <div style={{ position: 'absolute', inset: 0, background: bgColor }} />
      {/* Soil gradient at bottom */}
      <div
        style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          height: '15%',
          background: 'linear-gradient(180deg, transparent, #3E2723aa)',
          opacity: easeOutCubic(Math.min(1, enterProgress / 0.4)),
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
          padding: '5%',
          opacity: exitOpacity,
          transform: `scale(${exitProgress > 0 ? 1 - exitEased * 0.1 : 1})`,
        }}
      >
        {/* Plant name & day */}
        <div
          style={{
            textAlign: 'center',
            marginBottom: 'clamp(8px, 1.5vh, 16px)',
            opacity: dayEnter,
            transform: `translateY(${(1 - dayEnter) * 15}px)`,
          }}
        >
          <div style={{ fontSize: 'clamp(20px, 5vw, 36px)', fontWeight: 900, color: textColor }}>
            {plantName}
          </div>
          <div style={{ fontSize: 'clamp(10px, 1.6vw, 13px)', color: `${textColor}88`, fontWeight: 600 }}>
            Day {dayNumber}
          </div>
        </div>

        {/* Plant visualization */}
        <div
          style={{
            position: 'relative',
            width: 'clamp(60px, 14vw, 100px)',
            height: 'clamp(140px, 32vh, 220px)',
            marginBottom: 'clamp(12px, 2vh, 20px)',
          }}
        >
          {/* Stem */}
          <div
            style={{
              position: 'absolute',
              bottom: 0,
              left: '50%',
              width: '4px',
              height: `${stemHeight}%`,
              background: `linear-gradient(180deg, ${accentColor}, #33691E)`,
              transform: `translateX(-50%) rotate(${sway}deg)`,
              transformOrigin: 'bottom center',
              borderRadius: '2px',
            }}
          />
          {/* Leaves */}
          {stemHeight > 30 && (
            <div
              style={{
                position: 'absolute',
                bottom: `${stemHeight * 0.35}%`,
                left: '50%',
                width: 'clamp(20px, 5vw, 32px)',
                height: 'clamp(12px, 3vw, 18px)',
                background: accentColor,
                borderRadius: '50% 0 50% 50%',
                transform: `translateX(-2px) rotate(${sway - 15}deg) scale(${leaf1Enter})`,
                transformOrigin: 'left center',
                opacity: leaf1Enter * 0.9,
              }}
            />
          )}
          {stemHeight > 55 && (
            <div
              style={{
                position: 'absolute',
                bottom: `${stemHeight * 0.6}%`,
                right: '50%',
                width: 'clamp(22px, 5.5vw, 34px)',
                height: 'clamp(13px, 3.2vw, 19px)',
                background: '#66BB6A',
                borderRadius: '0 50% 50% 50%',
                transform: `translateX(2px) rotate(${sway + 15}deg) scale(${leaf2Enter})`,
                transformOrigin: 'right center',
                opacity: leaf2Enter * 0.9,
              }}
            />
          )}
          {stemHeight > 80 && (
            <div
              style={{
                position: 'absolute',
                bottom: `${stemHeight * 0.85}%`,
                left: '50%',
                width: 'clamp(18px, 4.5vw, 28px)',
                height: 'clamp(11px, 2.8vw, 16px)',
                background: '#81C784',
                borderRadius: '50% 0 50% 50%',
                transform: `translateX(-2px) rotate(${sway - 10}deg) scale(${leaf3Enter})`,
                transformOrigin: 'left center',
                opacity: leaf3Enter * 0.9,
              }}
            />
          )}
          {/* Pot */}
          <div
            style={{
              position: 'absolute',
              bottom: '-8px',
              left: '50%',
              transform: 'translateX(-50%)',
              width: 'clamp(40px, 10vw, 60px)',
              height: 'clamp(16px, 3.5vw, 24px)',
              background: '#5D4037',
              borderRadius: '0 0 8px 8px',
              opacity: easeOutCubic(Math.min(1, enterProgress / 0.3)),
            }}
          />
        </div>

        {/* Growth progress bar */}
        <div
          style={{
            width: '100%',
            maxWidth: '300px',
            marginBottom: 'clamp(10px, 1.5vh, 16px)',
            opacity: statsEnter,
            transform: `translateY(${(1 - statsEnter) * 10}px)`,
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
            <span style={{ fontSize: 'clamp(10px, 1.5vw, 12px)', color: `${textColor}88`, fontWeight: 600 }}>
              Growth
            </span>
            <span style={{ fontSize: 'clamp(10px, 1.5vw, 12px)', color: accentColor, fontWeight: 700 }}>
              {Math.round(growthBarProg * currentHeight)}{unit} / {targetHeight}{unit}
            </span>
          </div>
          <div style={{ width: '100%', height: '8px', background: `${textColor}15`, borderRadius: '4px', overflow: 'hidden' }}>
            <div
              style={{
                width: `${growthBarProg * growthPercent * 100}%`,
                height: '100%',
                background: `linear-gradient(90deg, #33691E, ${accentColor})`,
                borderRadius: '4px',
                boxShadow: `0 0 8px ${accentColor}40`,
              }}
            />
          </div>
        </div>

        {/* Status badges */}
        <div
          style={{
            display: 'flex',
            gap: 'clamp(8px, 1.5vw, 14px)',
            opacity: statusEnter,
            transform: `translateY(${(1 - statusEnter) * 10}px)`,
          }}
        >
          <div
            style={{
              background: `${textColor}0a`,
              border: `1px solid ${textColor}20`,
              borderRadius: '100px',
              padding: 'clamp(4px, 0.8vw, 8px) clamp(10px, 2vw, 16px)',
              fontSize: 'clamp(10px, 1.5vw, 13px)',
              color: '#29B6F6',
              fontWeight: 600,
            }}
          >
            \u{1F4A7} {waterStatus}
          </div>
          <div
            style={{
              background: `${textColor}0a`,
              border: `1px solid ${textColor}20`,
              borderRadius: '100px',
              padding: 'clamp(4px, 0.8vw, 8px) clamp(10px, 2vw, 16px)',
              fontSize: 'clamp(10px, 1.5vw, 13px)',
              color: '#FFB74D',
              fontWeight: 600,
            }}
          >
            \u2600\uFE0F {sunlightStatus}
          </div>
        </div>
      </div>
    </div>
  )
}

registerMotionGraphic({
  id: 'tpl-scene-plant-growth',
  title: 'Plant Growth',
  description: 'Plant growth progress tracker with animated stem, sprouting leaves with sway, growth bar, and water/sunlight status badges.',
  tags: ['scene', 'plant', 'growth', 'garden', 'eco', 'sustainability', 'green', 'tracker'],
  category: 'scene-layout',
  component: ScenePlantGrowthComponent as any,
  defaultConfig: {
    plantName: 'Tomato Plant',
    currentHeight: 28,
    targetHeight: 40,
    unit: 'cm',
    dayNumber: 42,
    waterStatus: 'Well watered',
    sunlightStatus: '6h sunlight',
    bgColor: '#0D1F0D',
    textColor: '#E8F5E9',
    accentColor: '#4CAF50',
  },
  configSchema: [
    { key: 'plantName', label: 'Plant Name', type: 'text', defaultValue: 'Tomato Plant', group: 'Content' },
    { key: 'currentHeight', label: 'Current Height', type: 'number', defaultValue: 28, min: 0, max: 999, group: 'Content' },
    { key: 'targetHeight', label: 'Target Height', type: 'number', defaultValue: 40, min: 1, max: 999, group: 'Content' },
    { key: 'unit', label: 'Unit', type: 'text', defaultValue: 'cm', group: 'Content' },
    { key: 'dayNumber', label: 'Day Number', type: 'number', defaultValue: 42, min: 1, max: 999, group: 'Content' },
    { key: 'waterStatus', label: 'Water Status', type: 'text', defaultValue: 'Well watered', group: 'Content' },
    { key: 'sunlightStatus', label: 'Sunlight Status', type: 'text', defaultValue: '6h sunlight', group: 'Content' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#0D1F0D', group: 'Style' },
    { key: 'textColor', label: 'Text Color', type: 'color', defaultValue: '#E8F5E9', group: 'Style' },
    { key: 'accentColor', label: 'Accent Color', type: 'color', defaultValue: '#4CAF50', group: 'Style' },
  ],
})
