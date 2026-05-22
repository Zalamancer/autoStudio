import React from 'react'
import { registerMotionGraphic } from '../registry'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface SceneColorWheelConfig {
  colorName: string
  hexValue: string
  funFact: string
  bgColor: string
  textColor: string
}

function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3)
}

function easeOutBack(t: number): number {
  const c1 = 1.70158
  const c3 = c1 + 1
  return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2)
}

function easeInCubic(t: number): number {
  return t * t * t
}

const wheelColors = [
  { color: '#FF0000', name: 'Red' },
  { color: '#FF8800', name: 'Orange' },
  { color: '#FFDD00', name: 'Yellow' },
  { color: '#00CC44', name: 'Green' },
  { color: '#0088FF', name: 'Blue' },
  { color: '#6600CC', name: 'Indigo' },
  { color: '#CC00CC', name: 'Violet' },
  { color: '#FF4488', name: 'Pink' },
]

function SceneColorWheelComponent({ config, progress }: MotionGraphicProps<SceneColorWheelConfig>) {
  const { colorName, hexValue, funFact, bgColor, textColor } = config

  const enterProgress = progress < 0.2 ? progress / 0.2 : 1
  const holdProgress = progress >= 0.2 && progress < 0.8 ? (progress - 0.2) / 0.6 : progress >= 0.8 ? 1 : 0
  const exitProgress = progress >= 0.8 ? (progress - 0.8) / 0.2 : 0

  const wheelScale = enterProgress < 1
    ? easeOutBack(enterProgress)
    : exitProgress > 0
      ? 1 - easeInCubic(exitProgress) * 0.3
      : 1
  const globalOpacity = exitProgress > 0 ? 1 - easeInCubic(exitProgress) : easeOutCubic(Math.min(1, enterProgress * 1.5))

  // Wheel rotation - spins on enter then stops at highlighted color
  const wheelRotation = enterProgress < 1
    ? enterProgress * 720
    : holdProgress * 5 + 720

  // Pointer bounce
  const pointerBounce = Math.sin(holdProgress * Math.PI * 6) * 3

  const segmentAngle = 360 / wheelColors.length

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
        fontFamily: "'Fredoka One', 'Comic Sans MS', cursive, sans-serif",
        opacity: globalOpacity,
      }}
    >
      {/* Subtle color splash background */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: `radial-gradient(circle at 50% 40%, ${hexValue}15, transparent 60%)`,
        }}
      />

      {/* Color wheel */}
      <div
        style={{
          position: 'relative',
          width: 'clamp(160px, 35vw, 280px)',
          height: 'clamp(160px, 35vw, 280px)',
          transform: `scale(${wheelScale}) rotate(${wheelRotation}deg)`,
          marginBottom: 'clamp(16px, 4vw, 32px)',
        }}
      >
        {wheelColors.map((segment, i) => {
          const startAngle = i * segmentAngle
          const midAngle = startAngle + segmentAngle / 2
          const isHighlighted = segment.name.toLowerCase() === colorName.toLowerCase()
          const highlightScale = isHighlighted && holdProgress > 0.2 ? 1.08 + Math.sin(holdProgress * Math.PI * 4) * 0.03 : 1

          // Create pie segment using conic position
          const endAngle = startAngle + segmentAngle

          return (
            <div
              key={i}
              style={{
                position: 'absolute',
                inset: 0,
                borderRadius: '50%',
                background: `conic-gradient(from ${startAngle}deg, ${segment.color} 0deg, ${segment.color} ${segmentAngle}deg, transparent ${segmentAngle}deg)`,
                transform: `scale(${highlightScale})`,
                opacity: isHighlighted ? 1 : 0.7,
                boxShadow: isHighlighted ? `0 0 20px ${segment.color}60` : 'none',
              }}
            />
          )
        })}

        {/* Center circle */}
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            width: '30%',
            height: '30%',
            borderRadius: '50%',
            background: bgColor,
            transform: 'translate(-50%, -50%)',
            border: `3px solid ${textColor}20`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <div
            style={{
              width: '60%',
              height: '60%',
              borderRadius: '50%',
              background: hexValue,
              boxShadow: `0 0 12px ${hexValue}60`,
              transform: `rotate(-${wheelRotation}deg)`,
            }}
          />
        </div>
      </div>

      {/* Pointer arrow */}
      <div
        style={{
          position: 'absolute',
          top: 'calc(50% - clamp(90px, 20vw, 160px))',
          left: '50%',
          transform: `translateX(-50%) translateY(${pointerBounce}px)`,
          width: 0,
          height: 0,
          borderLeft: '10px solid transparent',
          borderRight: '10px solid transparent',
          borderTop: `18px solid ${textColor}`,
          zIndex: 5,
        }}
      />

      {/* Color name */}
      <div
        style={{
          fontSize: 'clamp(32px, 8vw, 64px)',
          fontWeight: 700,
          color: hexValue,
          textShadow: `2px 2px 0 ${hexValue}30`,
          opacity: holdProgress > 0.15 ? easeOutCubic((holdProgress - 0.15) / 0.3) : 0,
          transform: `scale(${holdProgress > 0.15 ? easeOutBack((holdProgress - 0.15) / 0.3) : 0.5})`,
        }}
      >
        {colorName}
      </div>

      {/* Hex value */}
      <div
        style={{
          fontSize: 'clamp(12px, 2.5vw, 20px)',
          fontWeight: 500,
          color: `${textColor}88`,
          fontFamily: "'Courier New', monospace",
          marginTop: 'clamp(4px, 1vw, 8px)',
          opacity: holdProgress > 0.3 ? easeOutCubic((holdProgress - 0.3) / 0.3) : 0,
        }}
      >
        {hexValue}
      </div>

      {/* Fun fact */}
      <div
        style={{
          fontSize: 'clamp(12px, 2.2vw, 18px)',
          fontWeight: 500,
          color: textColor,
          fontFamily: "'Inter', 'Helvetica Neue', sans-serif",
          textAlign: 'center',
          maxWidth: '80%',
          marginTop: 'clamp(8px, 2vw, 16px)',
          lineHeight: 1.4,
          opacity: holdProgress > 0.5 ? easeOutCubic((holdProgress - 0.5) / 0.3) : 0,
          transform: `translateY(${holdProgress > 0.5 ? (1 - easeOutCubic((holdProgress - 0.5) / 0.3)) * 10 : 10}px)`,
        }}
      >
        {funFact}
      </div>
    </div>
  )
}

registerMotionGraphic({
  id: 'tpl-scene-color-wheel',
  title: 'Color Wheel',
  description: 'Interactive color learning wheel that spins and highlights a color. Shows color name, hex value, and fun fact.',
  tags: ['scene', 'kids', 'education', 'color', 'learning', 'wheel', 'cartoon'],
  category: 'scene-layout',
  component: SceneColorWheelComponent as unknown as React.ComponentType<MotionGraphicProps>,
  defaultConfig: {
    colorName: 'Blue',
    hexValue: '#0088FF',
    funFact: 'Blue is the color of the sky and ocean. It makes people feel calm and peaceful!',
    bgColor: '#F0F8FF',
    textColor: '#2D3436',
  },
  configSchema: [
    { key: 'colorName', label: 'Color Name', type: 'text', defaultValue: 'Blue', group: 'Content' },
    { key: 'hexValue', label: 'Hex Value', type: 'color', defaultValue: '#0088FF', group: 'Content' },
    { key: 'funFact', label: 'Fun Fact', type: 'text', defaultValue: 'Blue is the color of the sky and ocean. It makes people feel calm and peaceful!', group: 'Content' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#F0F8FF', group: 'Style' },
    { key: 'textColor', label: 'Text Color', type: 'color', defaultValue: '#2D3436', group: 'Style' },
  ],
})
