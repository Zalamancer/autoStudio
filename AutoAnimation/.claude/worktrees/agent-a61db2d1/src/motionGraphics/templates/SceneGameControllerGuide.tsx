import React from 'react'
import { registerMotionGraphic } from '../registry'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface GameControllerGuideConfig {
  title: string
  buttons: string[]
  actions: string[]
  bgColor: string
  textColor: string
  buttonColor: string
  accentColor: string
}

function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3)
}

function SceneGameControllerGuideComponent({ config, frame, fps, progress }: MotionGraphicProps<GameControllerGuideConfig>) {
  const { title, buttons, actions, bgColor, textColor, buttonColor, accentColor } = config
  const time = frame / fps

  const enterProgress = progress < 0.12 ? progress / 0.12 : 1
  const exitProgress = progress > 0.88 ? (progress - 0.88) / 0.12 : 0
  const mainOpacity = easeOutCubic(enterProgress) * (1 - easeOutCubic(exitProgress))

  // Button press animation cycle
  const pressedButton = Math.floor(time * 1.5) % buttons.length

  // D-pad pixel art (7x7 cross shape)
  const dpadGrid = [
    [0, 0, 1, 1, 1, 0, 0],
    [0, 0, 1, 1, 1, 0, 0],
    [1, 1, 1, 1, 1, 1, 1],
    [1, 1, 1, 1, 1, 1, 1],
    [1, 1, 1, 1, 1, 1, 1],
    [0, 0, 1, 1, 1, 0, 0],
    [0, 0, 1, 1, 1, 0, 0],
  ]

  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        background: bgColor,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
        fontFamily: "'Courier New', 'Lucida Console', monospace",
        opacity: mainOpacity,
      }}
    >
      {/* Scan lines */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.1) 2px, rgba(0,0,0,0.1) 4px)',
          pointerEvents: 'none',
          zIndex: 10,
        }}
      />

      {/* Title */}
      <div
        style={{
          fontSize: 'clamp(18px, 4.5vw, 40px)',
          fontWeight: 700,
          color: accentColor,
          textTransform: 'uppercase',
          letterSpacing: 5,
          marginBottom: 'clamp(12px, 2.5vw, 24px)',
          textShadow: `0 0 8px ${accentColor}60`,
          transform: `translateY(${(1 - easeOutCubic(enterProgress)) * -20}px)`,
        }}
      >
        {title}
      </div>

      {/* Controller layout */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 'clamp(20px, 5vw, 50px)',
          marginBottom: 'clamp(16px, 3vw, 32px)',
        }}
      >
        {/* D-Pad */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(7, clamp(4px, 0.8vw, 7px))',
            gridTemplateRows: 'repeat(7, clamp(4px, 0.8vw, 7px))',
            opacity: 0.6,
          }}
        >
          {dpadGrid.flat().map((cell, i) => (
            <div
              key={i}
              style={{
                background: cell ? '#444466' : 'transparent',
                border: cell ? '1px solid #333355' : 'none',
                imageRendering: 'pixelated' as any,
              }}
            />
          ))}
        </div>

        {/* Action buttons (diamond layout) */}
        <div
          style={{
            position: 'relative',
            width: 'clamp(70px, 14vw, 110px)',
            height: 'clamp(70px, 14vw, 110px)',
          }}
        >
          {/* Y/Triangle - top */}
          <div style={{ position: 'absolute', top: 0, left: '50%', transform: 'translateX(-50%)' }}>
            <div
              style={{
                width: 'clamp(20px, 4vw, 30px)',
                height: 'clamp(20px, 4vw, 30px)',
                background: pressedButton === 0 ? buttonColor : `${buttonColor}40`,
                border: `2px solid ${buttonColor}`,
                borderRadius: 2,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 'clamp(8px, 1.5vw, 12px)',
                color: pressedButton === 0 ? '#000' : buttonColor,
                fontWeight: 700,
                imageRendering: 'pixelated' as any,
                boxShadow: pressedButton === 0 ? `0 0 8px ${buttonColor}80` : 'none',
              }}
            >
              Y
            </div>
          </div>
          {/* X - left */}
          <div style={{ position: 'absolute', top: '50%', left: 0, transform: 'translateY(-50%)' }}>
            <div
              style={{
                width: 'clamp(20px, 4vw, 30px)',
                height: 'clamp(20px, 4vw, 30px)',
                background: pressedButton === 1 ? '#3366FF' : 'rgba(51,102,255,0.3)',
                border: '2px solid #3366FF',
                borderRadius: 2,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 'clamp(8px, 1.5vw, 12px)',
                color: pressedButton === 1 ? '#000' : '#3366FF',
                fontWeight: 700,
                imageRendering: 'pixelated' as any,
                boxShadow: pressedButton === 1 ? '0 0 8px rgba(51,102,255,0.8)' : 'none',
              }}
            >
              X
            </div>
          </div>
          {/* B - right */}
          <div style={{ position: 'absolute', top: '50%', right: 0, transform: 'translateY(-50%)' }}>
            <div
              style={{
                width: 'clamp(20px, 4vw, 30px)',
                height: 'clamp(20px, 4vw, 30px)',
                background: pressedButton === 2 ? '#FF3333' : 'rgba(255,51,51,0.3)',
                border: '2px solid #FF3333',
                borderRadius: 2,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 'clamp(8px, 1.5vw, 12px)',
                color: pressedButton === 2 ? '#000' : '#FF3333',
                fontWeight: 700,
                imageRendering: 'pixelated' as any,
                boxShadow: pressedButton === 2 ? '0 0 8px rgba(255,51,51,0.8)' : 'none',
              }}
            >
              B
            </div>
          </div>
          {/* A - bottom */}
          <div style={{ position: 'absolute', bottom: 0, left: '50%', transform: 'translateX(-50%)' }}>
            <div
              style={{
                width: 'clamp(20px, 4vw, 30px)',
                height: 'clamp(20px, 4vw, 30px)',
                background: pressedButton === 3 ? '#00CC00' : 'rgba(0,204,0,0.3)',
                border: '2px solid #00CC00',
                borderRadius: 2,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 'clamp(8px, 1.5vw, 12px)',
                color: pressedButton === 3 ? '#000' : '#00CC00',
                fontWeight: 700,
                imageRendering: 'pixelated' as any,
                boxShadow: pressedButton === 3 ? '0 0 8px rgba(0,204,0,0.8)' : 'none',
              }}
            >
              A
            </div>
          </div>
        </div>
      </div>

      {/* Button mapping list */}
      <div
        style={{
          width: 'clamp(220px, 55vw, 420px)',
          display: 'flex',
          flexDirection: 'column',
          gap: 'clamp(4px, 0.8vw, 8px)',
        }}
      >
        {buttons.map((btn, i) => {
          const itemDelay = 0.15 + i * 0.06
          const itemProgress = progress > itemDelay ? Math.min(1, (progress - itemDelay) / 0.1) : 0
          const isActive = pressedButton === i
          return (
            <div
              key={i}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 'clamp(8px, 1.5vw, 14px)',
                padding: 'clamp(4px, 0.8vw, 8px) clamp(8px, 1.5vw, 14px)',
                background: isActive ? `${accentColor}10` : 'transparent',
                border: `1px solid ${isActive ? accentColor + '40' : 'transparent'}`,
                opacity: easeOutCubic(itemProgress),
                transform: `translateX(${(1 - easeOutCubic(itemProgress)) * 30}px)`,
              }}
            >
              {/* Button indicator */}
              <div
                style={{
                  width: 'clamp(24px, 4vw, 36px)',
                  height: 'clamp(18px, 3vw, 26px)',
                  background: isActive ? buttonColor : `${buttonColor}30`,
                  border: `2px solid ${buttonColor}`,
                  borderRadius: 2,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 'clamp(8px, 1.4vw, 12px)',
                  fontWeight: 700,
                  color: isActive ? '#000' : buttonColor,
                  flexShrink: 0,
                  imageRendering: 'pixelated' as any,
                }}
              >
                {btn}
              </div>
              {/* Arrow */}
              <div style={{ color: `${textColor}40`, fontSize: 'clamp(10px, 1.8vw, 16px)' }}>
                {'\u{25B6}'}
              </div>
              {/* Action text */}
              <div
                style={{
                  fontSize: 'clamp(11px, 2.2vw, 18px)',
                  fontWeight: 700,
                  color: isActive ? accentColor : textColor,
                  textTransform: 'uppercase',
                  letterSpacing: 1,
                }}
              >
                {actions[i] || '---'}
              </div>
            </div>
          )
        })}
      </div>

      {/* Vignette */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: 'radial-gradient(ellipse at center, transparent 55%, rgba(0,0,0,0.4) 100%)',
          pointerEvents: 'none',
        }}
      />
    </div>
  )
}

registerMotionGraphic({
  id: 'tpl-scene-game-controller-guide',
  title: 'Scene Game Controller Guide',
  description: 'Controller button mapping display with pixel D-pad, animated action buttons, sequential reveal, and active highlight',
  tags: ['scene', 'controller', 'guide', 'retro', 'gaming', 'buttons', 'pixel', 'tutorial'],
  category: 'scene-layout',
  component: SceneGameControllerGuideComponent as unknown as React.ComponentType<MotionGraphicProps>,
  defaultConfig: {
    title: 'CONTROLS',
    buttons: ['A', 'B', 'X', 'Y'],
    actions: ['JUMP', 'ATTACK', 'DASH', 'SHIELD'],
    bgColor: '#0a0a1a',
    textColor: '#CCCCCC',
    buttonColor: '#FFD700',
    accentColor: '#00FFFF',
  },
  configSchema: [
    { key: 'title', label: 'Title', type: 'text', defaultValue: 'CONTROLS', group: 'Content' },
    { key: 'buttons', label: 'Buttons', type: 'text-array', defaultValue: ['A', 'B', 'X', 'Y'], group: 'Content' },
    { key: 'actions', label: 'Actions', type: 'text-array', defaultValue: ['JUMP', 'ATTACK', 'DASH', 'SHIELD'], group: 'Content' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#0a0a1a', group: 'Style' },
    { key: 'textColor', label: 'Text Color', type: 'color', defaultValue: '#CCCCCC', group: 'Style' },
    { key: 'buttonColor', label: 'Button Color', type: 'color', defaultValue: '#FFD700', group: 'Style' },
    { key: 'accentColor', label: 'Accent', type: 'color', defaultValue: '#00FFFF', group: 'Style' },
  ],
})
