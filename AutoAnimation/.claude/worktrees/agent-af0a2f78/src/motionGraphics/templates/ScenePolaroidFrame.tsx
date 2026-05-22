import React from 'react'
import { registerMotionGraphic } from '../registry'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface ScenePolaroidFrameConfig {
  captionText: string
  frameColor: string
  rotation: number
  shadowColor: string
  bgColor: string
}

function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3)
}

function easeInCubic(t: number): number {
  return t * t * t
}

function bounceOut(t: number): number {
  if (t < 1 / 2.75) return 7.5625 * t * t
  if (t < 2 / 2.75) { const t2 = t - 1.5 / 2.75; return 7.5625 * t2 * t2 + 0.75 }
  if (t < 2.5 / 2.75) { const t2 = t - 2.25 / 2.75; return 7.5625 * t2 * t2 + 0.9375 }
  const t2 = t - 2.625 / 2.75
  return 7.5625 * t2 * t2 + 0.984375
}

function ScenePolaroidFrameComponent({ config, progress, frame, fps }: MotionGraphicProps<ScenePolaroidFrameConfig>) {
  const { captionText, frameColor, rotation, shadowColor, bgColor } = config

  const enterProgress = progress < 0.2 ? progress / 0.2 : 1
  const holdProgress = progress >= 0.2 && progress < 0.8 ? (progress - 0.2) / 0.6 : progress >= 0.8 ? 1 : 0
  const exitProgress = progress >= 0.8 ? (progress - 0.8) / 0.2 : 0

  const bounced = bounceOut(enterProgress)

  // Enter: drops in from top with rotation (starts more tilted, settles to configured tilt)
  const enterY = enterProgress < 1
    ? -600 * (1 - bounced)
    : 0

  const enterRotation = enterProgress < 1
    ? rotation + 25 * (1 - bounced)
    : rotation

  // Exit: flies away with rotation
  const exitY = exitProgress > 0
    ? -700 * easeInCubic(exitProgress)
    : 0

  const exitRotation = exitProgress > 0
    ? rotation - 45 * easeInCubic(exitProgress)
    : 0

  const y = enterY + exitY
  const rot = enterProgress < 1 ? enterRotation : exitProgress > 0 ? rotation + exitRotation - rotation : rotation

  // Hold: subtle float and rock
  const floatY = holdProgress > 0 ? Math.sin(holdProgress * Math.PI * 4) * 4 : 0
  const rockAngle = holdProgress > 0 ? Math.sin(holdProgress * Math.PI * 3) * 1.5 : 0

  const opacity = enterProgress < 1
    ? Math.min(1, enterProgress * 2)
    : exitProgress > 0
      ? 1 - easeInCubic(exitProgress)
      : 1

  // Polaroid dimensions (percentage of container)
  const borderTop = 16
  const borderSide = 16
  const borderBottom = 60 // thick bottom for caption

  return (
    <div style={{ position: 'absolute', inset: 0, overflow: 'hidden' }}>
      {bgColor !== 'transparent' && (
        <div style={{ position: 'absolute', inset: 0, background: bgColor }} />
      )}

      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: `translate(-50%, calc(-50% + ${y + floatY}px)) rotate(${rot + rockAngle}deg)`,
          opacity,
          width: '70%',
          maxWidth: 400,
        }}
      >
        {/* Polaroid frame */}
        <div
          style={{
            background: frameColor,
            padding: `${borderTop}px ${borderSide}px ${borderBottom}px ${borderSide}px`,
            boxShadow: `0 8px 32px ${shadowColor}60, 0 2px 8px ${shadowColor}30`,
            borderRadius: 3,
          }}
        >
          {/* Photo area (transparent cutout) */}
          <div
            style={{
              width: '100%',
              paddingBottom: '100%', // Square aspect ratio
              background: 'transparent',
              borderRadius: 1,
              position: 'relative',
            }}
          >
            {/* Subtle inner shadow to suggest photo area */}
            <div
              style={{
                position: 'absolute',
                inset: 0,
                boxShadow: 'inset 0 0 8px rgba(0,0,0,0.1)',
                borderRadius: 1,
              }}
            />
          </div>

          {/* Caption area */}
          <div
            style={{
              marginTop: 10,
              textAlign: 'center',
              fontFamily: "'Georgia', 'Times New Roman', serif",
              fontSize: 16,
              color: '#444444',
              fontStyle: 'italic',
              letterSpacing: '0.02em',
              overflow: 'hidden',
              whiteSpace: 'nowrap',
              textOverflow: 'ellipsis',
            }}
          >
            {captionText}
          </div>
        </div>
      </div>
    </div>
  )
}

registerMotionGraphic({
  id: 'tpl-scene-polaroid-frame',
  title: 'Scene Polaroid Frame',
  description: 'Polaroid photo frame overlay with drop-in bounce, gentle float/rock, and caption text',
  tags: ['scene', 'polaroid', 'frame', 'photo', 'overlay', 'decoration'],
  category: 'scene-layout',
  component: ScenePolaroidFrameComponent as any,
  defaultConfig: {
    captionText: 'Summer 2024',
    frameColor: '#ffffff',
    rotation: 3,
    shadowColor: '#000000',
    bgColor: 'transparent',
  },
  configSchema: [
    { key: 'captionText', label: 'Caption Text', type: 'text', defaultValue: 'Summer 2024', group: 'Content' },
    { key: 'frameColor', label: 'Frame Color', type: 'color', defaultValue: '#ffffff', group: 'Style' },
    { key: 'rotation', label: 'Rotation (deg)', type: 'number', defaultValue: 3, min: -15, max: 15, group: 'Style' },
    { key: 'shadowColor', label: 'Shadow Color', type: 'color', defaultValue: '#000000', group: 'Style' },
    { key: 'bgColor', label: 'Background Color', type: 'color', defaultValue: 'transparent', group: 'Style' },
  ],
})
