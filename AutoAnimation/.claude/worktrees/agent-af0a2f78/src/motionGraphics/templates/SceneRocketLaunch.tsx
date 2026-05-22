import React from 'react'
import { registerMotionGraphic } from '../registry'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface SceneRocketLaunchConfig {
  missionName: string
  destination: string
  countdown: number
  rocketName: string
  bgColor: string
  textColor: string
  accentColor: string
  flameColor: string
}

function easeOutCubic(t: number): number { return 1 - Math.pow(1 - t, 3) }
function easeInCubic(t: number): number { return t * t * t }

function SceneRocketLaunchComponent({ config, progress }: MotionGraphicProps<SceneRocketLaunchConfig>) {
  const { missionName, destination, countdown, rocketName, bgColor, textColor, accentColor, flameColor } = config

  const enterProgress = progress < 0.15 ? progress / 0.15 : 1
  const holdProgress = progress >= 0.15 && progress < 0.7 ? (progress - 0.15) / 0.55 : progress >= 0.7 ? 1 : 0
  const launchProgress = progress >= 0.7 ? (progress - 0.7) / 0.2 : 0
  const exitProgress = progress >= 0.9 ? (progress - 0.9) / 0.1 : 0
  const exitOpacity = exitProgress > 0 ? 1 - easeInCubic(exitProgress) : 1

  const uiEnter = easeOutCubic(enterProgress)

  // Countdown number (counts down during hold)
  const countdownNum = Math.max(0, Math.ceil(countdown * (1 - holdProgress)))
  const isLaunched = progress >= 0.7

  // Rocket position — sits on pad until launch, then accelerates upward
  const rocketY = isLaunched ? -easeInCubic(launchProgress) * 120 : 0
  const flameHeight = isLaunched ? 20 + launchProgress * 40 : (holdProgress > 0.8 ? 5 + Math.random() * 8 : 0)
  const rocketShake = !isLaunched && holdProgress > 0.85 ? Math.sin(progress * 200) * 2 : 0

  // Stars
  const stars = Array.from({ length: 35 }, (_, i) => ({
    x: ((i * 67 + 19) % 100),
    y: ((i * 43 + 11) % 100),
    size: 0.5 + ((i * 17) % 2),
    opacity: 0.2 + ((i * 23) % 4) / 15,
  }))

  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        background: `linear-gradient(180deg, ${bgColor} 0%, #0A0A2E 70%, #1A1040 100%)`,
        overflow: 'hidden',
        fontFamily: "'Helvetica Neue', Arial, sans-serif",
        opacity: exitOpacity,
      }}
    >
      {/* Stars */}
      {stars.map((s, i) => (
        <div
          key={i}
          style={{
            position: 'absolute',
            left: `${s.x}%`,
            top: `${s.y}%`,
            width: s.size,
            height: s.size,
            borderRadius: '50%',
            background: '#FFFFFF',
            opacity: s.opacity,
          }}
        />
      ))}

      {/* Mission name header */}
      <div
        style={{
          position: 'absolute',
          top: '6%',
          left: '50%',
          transform: 'translateX(-50%)',
          textAlign: 'center',
          opacity: uiEnter,
        }}
      >
        <div
          style={{
            fontSize: 'clamp(9px, 1.8vw, 13px)',
            color: accentColor,
            textTransform: 'uppercase',
            letterSpacing: 'clamp(2px, 0.5vw, 4px)',
            fontWeight: 700,
          }}
        >
          Mission
        </div>
        <div
          style={{
            fontSize: 'clamp(22px, 5.5vw, 40px)',
            fontWeight: 900,
            color: textColor,
            textTransform: 'uppercase',
            letterSpacing: 'clamp(2px, 0.5vw, 6px)',
          }}
        >
          {missionName}
        </div>
      </div>

      {/* Countdown display */}
      <div
        style={{
          position: 'absolute',
          top: '28%',
          left: '50%',
          transform: 'translateX(-50%)',
          textAlign: 'center',
          opacity: uiEnter,
        }}
      >
        <div
          style={{
            fontSize: 'clamp(10px, 2vw, 14px)',
            color: `${textColor}70`,
            textTransform: 'uppercase',
            letterSpacing: 2,
            marginBottom: 4,
          }}
        >
          {isLaunched ? 'LIFTOFF' : 'T-minus'}
        </div>
        <div
          style={{
            fontSize: 'clamp(48px, 14vw, 100px)',
            fontWeight: 900,
            fontFamily: "'Courier New', monospace",
            color: isLaunched ? accentColor : countdownNum <= 3 ? flameColor : textColor,
            fontVariantNumeric: 'tabular-nums',
            textShadow: isLaunched ? `0 0 20px ${accentColor}60` : countdownNum <= 3 ? `0 0 15px ${flameColor}40` : 'none',
          }}
        >
          {isLaunched ? 'GO' : countdownNum}
        </div>
      </div>

      {/* Rocket */}
      <div
        style={{
          position: 'absolute',
          bottom: `${15 - rocketY}%`,
          left: '50%',
          transform: `translateX(calc(-50% + ${rocketShake}px))`,
        }}
      >
        {/* Rocket body */}
        <div
          style={{
            width: 'clamp(16px, 4vw, 28px)',
            height: 'clamp(50px, 12vw, 80px)',
            background: 'linear-gradient(180deg, #E0E0E0 0%, #FFFFFF 30%, #D0D0D0 100%)',
            borderRadius: 'clamp(6px, 1.5vw, 10px) clamp(6px, 1.5vw, 10px) 2px 2px',
            position: 'relative',
            margin: '0 auto',
            boxShadow: '0 0 8px rgba(255,255,255,0.1)',
          }}
        >
          {/* Nose cone */}
          <div
            style={{
              position: 'absolute',
              top: -8,
              left: '50%',
              transform: 'translateX(-50%)',
              width: 0,
              height: 0,
              borderLeft: '8px solid transparent',
              borderRight: '8px solid transparent',
              borderBottom: `12px solid ${accentColor}`,
            }}
          />
          {/* Window */}
          <div
            style={{
              position: 'absolute',
              top: '25%',
              left: '50%',
              transform: 'translateX(-50%)',
              width: 6,
              height: 6,
              borderRadius: '50%',
              background: '#88CCFF',
              border: '1px solid #6699CC',
            }}
          />
          {/* Fins */}
          <div style={{ position: 'absolute', bottom: 0, left: -6, width: 6, height: 14, background: accentColor, borderRadius: '2px 0 0 0' }} />
          <div style={{ position: 'absolute', bottom: 0, right: -6, width: 6, height: 14, background: accentColor, borderRadius: '0 2px 0 0' }} />
        </div>
        {/* Flame */}
        {flameHeight > 0 && (
          <div
            style={{
              width: 'clamp(10px, 2.5vw, 18px)',
              height: flameHeight,
              margin: '0 auto',
              background: `linear-gradient(180deg, ${flameColor} 0%, #FF6B00 40%, rgba(255,200,0,0.6) 70%, transparent 100%)`,
              borderRadius: '0 0 50% 50%',
              filter: 'blur(2px)',
              opacity: 0.9,
            }}
          />
        )}
      </div>

      {/* Ground/launch pad */}
      <div
        style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          height: '12%',
          background: 'linear-gradient(180deg, #1A1030 0%, #0E0820 100%)',
          borderTop: `1px solid ${textColor}10`,
        }}
      />

      {/* Bottom info */}
      <div
        style={{
          position: 'absolute',
          bottom: '2%',
          left: '50%',
          transform: 'translateX(-50%)',
          textAlign: 'center',
          opacity: uiEnter * 0.8,
        }}
      >
        <div style={{ fontSize: 'clamp(9px, 1.8vw, 12px)', color: `${textColor}50` }}>
          {rocketName} / {destination}
        </div>
      </div>
    </div>
  )
}

registerMotionGraphic({
  id: 'tpl-scene-rocket-launch',
  title: 'Rocket Launch',
  description: 'Rocket launch countdown with animated rocket, flame effects, countdown timer, mission name, and liftoff sequence',
  tags: ['scene', 'space', 'rocket', 'launch', 'countdown', 'astronomy', 'mission'],
  category: 'scene-layout',
  component: SceneRocketLaunchComponent as unknown as React.ComponentType<MotionGraphicProps>,
  configSchema: [
    { key: 'missionName', label: 'Mission Name', type: 'text', defaultValue: 'Artemis IV', group: 'Content' },
    { key: 'destination', label: 'Destination', type: 'text', defaultValue: 'Lunar Orbit', group: 'Content' },
    { key: 'countdown', label: 'Countdown From', type: 'number', defaultValue: 10, min: 3, max: 30, group: 'Content' },
    { key: 'rocketName', label: 'Rocket Name', type: 'text', defaultValue: 'SLS Block 2', group: 'Content' },
    { key: 'flameColor', label: 'Flame Color', type: 'color', defaultValue: '#FF4500', group: 'Style' },
    { key: 'accentColor', label: 'Accent Color', type: 'color', defaultValue: '#60A5FA', group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#050515', group: 'Style' },
    { key: 'textColor', label: 'Text Color', type: 'color', defaultValue: '#E2E8F0', group: 'Style' },
  ],
  defaultConfig: {
    missionName: 'Artemis IV',
    destination: 'Lunar Orbit',
    countdown: 10,
    rocketName: 'SLS Block 2',
    flameColor: '#FF4500',
    accentColor: '#60A5FA',
    bgColor: '#050515',
    textColor: '#E2E8F0',
  },
})
