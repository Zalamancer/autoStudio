import React from 'react'
import { registerMotionGraphic } from '../registry'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface SceneHealthBarConfig {
  playerName: string
  hpCurrent: number
  hpMax: number
  damageAmount: number
  bgColor: string
  barColor: string
  dangerColor: string
  textColor: string
}

function easeOutCubic(t: number): number { return 1 - Math.pow(1 - t, 3) }
function easeInCubic(t: number): number { return t * t * t }
function easeOutBack(t: number): number {
  const c1 = 1.70158
  const c3 = c1 + 1
  return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2)
}

function SceneHealthBarComponent({ config, progress }: MotionGraphicProps<SceneHealthBarConfig>) {
  const { playerName, hpCurrent, hpMax, damageAmount, bgColor, barColor, dangerColor, textColor } = config

  const enterProgress = progress < 0.2 ? progress / 0.2 : 1
  const holdProgress = progress >= 0.2 && progress < 0.8 ? (progress - 0.2) / 0.6 : progress >= 0.8 ? 1 : 0
  const exitProgress = progress >= 0.8 ? (progress - 0.8) / 0.2 : 0

  // Health percentages
  const startHp = Math.min(hpCurrent + damageAmount, hpMax)
  const endHp = hpCurrent
  const startPercent = (startHp / hpMax) * 100
  const endPercent = (endHp / hpMax) * 100
  const isLowHp = endPercent <= 25

  // Bar depletes during enter phase
  const depleteProgress = easeOutCubic(Math.max(0, Math.min(1, (enterProgress - 0.3) / 0.5)))
  const currentPercent = startPercent - (startPercent - endPercent) * depleteProgress
  const displayHp = Math.round(startHp - (startHp - endHp) * depleteProgress)

  // Bar color transitions to danger at low HP
  const activeBarColor = currentPercent <= 25 ? dangerColor : barColor

  // Red flash on damage
  const damageFlash = enterProgress > 0.3 && enterProgress < 0.5
    ? Math.sin(((enterProgress - 0.3) / 0.2) * Math.PI) * 0.3
    : 0

  // Low HP pulse during hold
  const isHolding = progress >= 0.2 && progress < 0.8
  const lowHpPulse = isLowHp && isHolding
    ? 0.7 + Math.sin(holdProgress * Math.PI * 8) * 0.3
    : 1

  // Damage number pop
  const damagePopProgress = Math.max(0, Math.min(1, (enterProgress - 0.3) / 0.4))
  const damagePopScale = easeOutBack(damagePopProgress)
  const damagePopY = damagePopProgress * -40
  const damagePopOpacity = damagePopProgress < 0.8 ? easeOutCubic(damagePopProgress / 0.8) : 1 - (damagePopProgress - 0.8) / 0.2

  // Slide in from left
  const slideIn = easeOutCubic(Math.min(1, enterProgress / 0.3))
  const slideX = (1 - slideIn) * -100

  // Exit
  const exitEased = easeInCubic(exitProgress)
  const exitOpacity = 1 - exitEased
  const exitSlideX = exitEased * -100

  // Frame container
  const frameSlide = easeOutCubic(Math.min(1, enterProgress / 0.25))
  const nameReveal = easeOutCubic(Math.max(0, Math.min(1, (enterProgress - 0.1) / 0.3)))

  return (
    <div style={{ position: 'absolute', inset: 0, overflow: 'hidden' }}>
      <div style={{ position: 'absolute', inset: 0, background: bgColor }} />

      {/* Red flash overlay */}
      {damageFlash > 0 && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: dangerColor,
            opacity: damageFlash,
            pointerEvents: 'none',
          }}
        />
      )}

      <div
        style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '8%',
          opacity: exitOpacity,
        }}
      >
        {/* Health bar container */}
        <div
          style={{
            width: '100%',
            maxWidth: 480,
            transform: `translateX(${slideX + exitSlideX}px)`,
          }}
        >
          {/* Player name row */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'baseline',
              marginBottom: 'clamp(6px, 1.2vw, 12px)',
              opacity: nameReveal,
            }}
          >
            <div
              style={{
                fontFamily: "'Inter', 'Helvetica Neue', sans-serif",
                fontSize: 'clamp(14px, 2.5vw, 22px)',
                fontWeight: 700,
                color: textColor,
                textTransform: 'uppercase',
                letterSpacing: '0.06em',
              }}
            >
              {playerName}
            </div>
            <div
              style={{
                fontFamily: "'Inter', sans-serif",
                fontSize: 'clamp(12px, 2vw, 18px)',
                fontWeight: 800,
                color: activeBarColor,
                opacity: lowHpPulse,
              }}
            >
              {displayHp} / {hpMax}
            </div>
          </div>

          {/* HP label */}
          <div
            style={{
              fontFamily: "'Inter', sans-serif",
              fontSize: 'clamp(8px, 1.2vw, 11px)',
              fontWeight: 700,
              color: `${textColor}60`,
              textTransform: 'uppercase',
              letterSpacing: '0.15em',
              marginBottom: 'clamp(4px, 0.8vw, 8px)',
              opacity: frameSlide,
            }}
          >
            HP
          </div>

          {/* Bar background */}
          <div
            style={{
              width: '100%',
              height: 'clamp(16px, 3.5vw, 32px)',
              borderRadius: 'clamp(4px, 0.8vw, 8px)',
              background: `${textColor}12`,
              overflow: 'hidden',
              position: 'relative',
              boxShadow: isLowHp && isHolding ? `0 0 ${16 * lowHpPulse}px ${dangerColor}30` : 'none',
            }}
          >
            {/* Ghost bar (shows previous HP) */}
            <div
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                height: '100%',
                width: `${startPercent}%`,
                background: `${activeBarColor}30`,
                borderRadius: 'clamp(4px, 0.8vw, 8px)',
                transition: 'width 0.1s',
              }}
            />

            {/* Current HP bar */}
            <div
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                height: '100%',
                width: `${currentPercent}%`,
                background: `linear-gradient(90deg, ${activeBarColor}CC, ${activeBarColor})`,
                borderRadius: 'clamp(4px, 0.8vw, 8px)',
                boxShadow: `0 0 12px ${activeBarColor}40`,
                opacity: lowHpPulse,
              }}
            >
              {/* Shine */}
              <div
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  height: '40%',
                  background: 'linear-gradient(180deg, rgba(255,255,255,0.25), transparent)',
                  borderRadius: 'clamp(4px, 0.8vw, 8px) clamp(4px, 0.8vw, 8px) 0 0',
                }}
              />
            </div>
          </div>

          {/* Damage number popup */}
          {damageAmount > 0 && damagePopProgress > 0 && damagePopProgress < 1 && (
            <div
              style={{
                position: 'absolute',
                right: '15%',
                top: '35%',
                transform: `translateY(${damagePopY}px) scale(${damagePopScale})`,
                opacity: damagePopOpacity,
                fontFamily: "'Inter', 'Helvetica Neue', sans-serif",
                fontSize: 'clamp(24px, 6vw, 48px)',
                fontWeight: 900,
                color: dangerColor,
                textShadow: `0 0 10px ${dangerColor}80`,
              }}
            >
              -{damageAmount}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

registerMotionGraphic({
  id: 'tpl-scene-health-bar',
  title: 'Health Bar',
  description: 'Game health/HP bar that fills or depletes, player name, damage numbers pop up, red flash at low HP',
  tags: ['scene', 'gaming', 'health', 'hp', 'bar', 'damage', 'rpg'],
  category: 'scene-layout',
  component: SceneHealthBarComponent as any,
  defaultConfig: {
    playerName: 'PLAYER 1',
    hpCurrent: 280,
    hpMax: 1000,
    damageAmount: 350,
    bgColor: '#0a0a14',
    barColor: '#22c55e',
    dangerColor: '#ef4444',
    textColor: '#ffffff',
  },
  configSchema: [
    { key: 'playerName', label: 'Player Name', type: 'text', defaultValue: 'PLAYER 1', group: 'Content' },
    { key: 'hpCurrent', label: 'Current HP', type: 'number', defaultValue: 280, min: 0, max: 99999, group: 'Content' },
    { key: 'hpMax', label: 'Max HP', type: 'number', defaultValue: 1000, min: 1, max: 99999, group: 'Content' },
    { key: 'damageAmount', label: 'Damage Amount', type: 'number', defaultValue: 350, min: 0, max: 99999, group: 'Content' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#0a0a14', group: 'Style' },
    { key: 'barColor', label: 'Health Color', type: 'color', defaultValue: '#22c55e', group: 'Style' },
    { key: 'dangerColor', label: 'Danger Color', type: 'color', defaultValue: '#ef4444', group: 'Style' },
    { key: 'textColor', label: 'Text Color', type: 'color', defaultValue: '#ffffff', group: 'Style' },
  ],
})
