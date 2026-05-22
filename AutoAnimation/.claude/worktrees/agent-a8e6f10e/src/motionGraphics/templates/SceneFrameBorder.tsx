import React from 'react'
import { registerMotionGraphic } from '../registry'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface SceneFrameBorderConfig {
  borderColor: string
  borderWidth: number
  cornerStyle: 'square' | 'diamond' | 'circle'
  bgColor: string
}

function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3)
}

function easeInCubic(t: number): number {
  return t * t * t
}

function SceneFrameBorderComponent({ config, progress, frame, fps }: MotionGraphicProps<SceneFrameBorderConfig>) {
  const { borderColor, borderWidth, cornerStyle, bgColor } = config

  const enterProgress = progress < 0.2 ? progress / 0.2 : 1
  const holdProgress = progress >= 0.2 && progress < 0.8 ? (progress - 0.2) / 0.6 : progress >= 0.8 ? 1 : 0
  const exitProgress = progress >= 0.8 ? (progress - 0.8) / 0.2 : 0

  // Sequential draw-in: top(0-25%) -> right(25-50%) -> bottom(50-75%) -> left(75-100%)
  const topDraw = enterProgress < 1
    ? easeOutCubic(Math.min(1, enterProgress / 0.25))
    : exitProgress > 0
      ? 1 - easeInCubic(Math.min(1, Math.max(0, (exitProgress - 0.75) / 0.25)))
      : 1

  const rightDraw = enterProgress < 1
    ? easeOutCubic(Math.min(1, Math.max(0, (enterProgress - 0.25) / 0.25)))
    : exitProgress > 0
      ? 1 - easeInCubic(Math.min(1, Math.max(0, (exitProgress - 0.5) / 0.25)))
      : 1

  const bottomDraw = enterProgress < 1
    ? easeOutCubic(Math.min(1, Math.max(0, (enterProgress - 0.5) / 0.25)))
    : exitProgress > 0
      ? 1 - easeInCubic(Math.min(1, Math.max(0, (exitProgress - 0.25) / 0.25)))
      : 1

  const leftDraw = enterProgress < 1
    ? easeOutCubic(Math.min(1, Math.max(0, (enterProgress - 0.75) / 0.25)))
    : exitProgress > 0
      ? 1 - easeInCubic(Math.min(1, exitProgress / 0.25))
      : 1

  // Corner pieces pop in after all borders are drawn
  const cornerScale = enterProgress < 1
    ? easeOutCubic(Math.min(1, Math.max(0, (enterProgress - 0.85) / 0.15)))
    : exitProgress > 0
      ? 1 - easeInCubic(Math.min(1, exitProgress / 0.15))
      : 1

  // Hold glow pulse
  const glowAmount = holdProgress > 0 ? 4 + Math.sin(holdProgress * Math.PI * 6) * 3 : 0

  const margin = 24
  const cornerSize = borderWidth * 4

  const cornerBorderRadius = cornerStyle === 'circle' ? '50%' : '0'
  const cornerRotation = cornerStyle === 'diamond' ? 'rotate(45deg)' : 'none'

  const cornerPositions = [
    { top: margin - cornerSize / 2, left: margin - cornerSize / 2 },
    { top: margin - cornerSize / 2, right: margin - cornerSize / 2 },
    { bottom: margin - cornerSize / 2, left: margin - cornerSize / 2 },
    { bottom: margin - cornerSize / 2, right: margin - cornerSize / 2 },
  ]

  return (
    <div style={{ position: 'absolute', inset: 0, overflow: 'hidden' }}>
      {bgColor !== 'transparent' && (
        <div style={{ position: 'absolute', inset: 0, background: bgColor }} />
      )}

      {/* Top border */}
      <div
        style={{
          position: 'absolute',
          top: margin,
          left: margin,
          width: `calc((100% - ${margin * 2}px) * ${topDraw})`,
          height: borderWidth,
          background: borderColor,
          boxShadow: glowAmount > 0 ? `0 0 ${glowAmount}px ${borderColor}` : 'none',
        }}
      />

      {/* Right border */}
      <div
        style={{
          position: 'absolute',
          top: margin,
          right: margin,
          width: borderWidth,
          height: `calc((100% - ${margin * 2}px) * ${rightDraw})`,
          background: borderColor,
          boxShadow: glowAmount > 0 ? `0 0 ${glowAmount}px ${borderColor}` : 'none',
        }}
      />

      {/* Bottom border */}
      <div
        style={{
          position: 'absolute',
          bottom: margin,
          right: margin,
          width: `calc((100% - ${margin * 2}px) * ${bottomDraw})`,
          height: borderWidth,
          background: borderColor,
          boxShadow: glowAmount > 0 ? `0 0 ${glowAmount}px ${borderColor}` : 'none',
        }}
      />

      {/* Left border */}
      <div
        style={{
          position: 'absolute',
          bottom: margin,
          left: margin,
          width: borderWidth,
          height: `calc((100% - ${margin * 2}px) * ${leftDraw})`,
          background: borderColor,
          boxShadow: glowAmount > 0 ? `0 0 ${glowAmount}px ${borderColor}` : 'none',
        }}
      />

      {/* Corner pieces */}
      {cornerPositions.map((pos, i) => (
        <div
          key={i}
          style={{
            position: 'absolute',
            ...pos,
            width: cornerSize,
            height: cornerSize,
            background: borderColor,
            borderRadius: cornerBorderRadius,
            transform: `${cornerRotation} scale(${cornerScale})`,
            boxShadow: glowAmount > 0 ? `0 0 ${glowAmount + 2}px ${borderColor}` : 'none',
          }}
        />
      ))}
    </div>
  )
}

registerMotionGraphic({
  id: 'tpl-scene-frame-border',
  title: 'Scene Frame Border',
  description: 'Animated decorative frame border with sequential draw-in, ornate corner pieces, and glow pulse',
  tags: ['scene', 'frame', 'border', 'overlay', 'decoration'],
  category: 'scene-layout',
  component: SceneFrameBorderComponent as any,
  defaultConfig: {
    borderColor: '#FFD700',
    borderWidth: 4,
    cornerStyle: 'square',
    bgColor: 'transparent',
  },
  configSchema: [
    { key: 'borderColor', label: 'Border Color', type: 'color', defaultValue: '#FFD700', group: 'Style' },
    { key: 'borderWidth', label: 'Border Width', type: 'number', defaultValue: 4, min: 1, max: 12, group: 'Style' },
    { key: 'cornerStyle', label: 'Corner Style', type: 'select', defaultValue: 'square', options: ['square', 'diamond', 'circle'], group: 'Style' },
    { key: 'bgColor', label: 'Background Color', type: 'color', defaultValue: 'transparent', group: 'Style' },
  ],
})
