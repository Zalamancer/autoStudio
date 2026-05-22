import React from 'react'
import { registerMotionGraphic } from '../registry'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface SceneCornerAccentConfig {
  cornerColor: string
  cornerSize: number
  cornerStyle: 'geometric' | 'rounded' | 'angular'
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

function SceneCornerAccentComponent({ config, progress, frame, fps }: MotionGraphicProps<SceneCornerAccentConfig>) {
  const { cornerColor, cornerSize, cornerStyle, bgColor } = config

  const enterProgress = progress < 0.2 ? progress / 0.2 : 1
  const holdProgress = progress >= 0.2 && progress < 0.8 ? (progress - 0.2) / 0.6 : progress >= 0.8 ? 1 : 0
  const exitProgress = progress >= 0.8 ? (progress - 0.8) / 0.2 : 0

  const bounced = bounceOut(enterProgress)
  const exitEased = easeInCubic(exitProgress)

  // Glow pulse during hold
  const glowPulse = holdProgress > 0 ? 3 + Math.sin(holdProgress * Math.PI * 4) * 3 : 0

  const borderRadius = cornerStyle === 'rounded' ? cornerSize * 0.2 : 0
  const skew = cornerStyle === 'angular' ? 'skew(-5deg, -5deg)' : ''

  const thickness = Math.max(3, cornerSize * 0.1)
  const armLength = cornerSize

  const corners = [
    { id: 'tl', x: enterProgress < 1 ? -cornerSize * (1 - bounced) : exitProgress > 0 ? -cornerSize * exitEased : 0, y: enterProgress < 1 ? -cornerSize * (1 - bounced) : exitProgress > 0 ? -cornerSize * exitEased : 0, top: 16, left: 16, hDir: 'right', vDir: 'down' },
    { id: 'tr', x: enterProgress < 1 ? cornerSize * (1 - bounced) : exitProgress > 0 ? cornerSize * exitEased : 0, y: enterProgress < 1 ? -cornerSize * (1 - bounced) : exitProgress > 0 ? -cornerSize * exitEased : 0, top: 16, right: 16, hDir: 'left', vDir: 'down' },
    { id: 'bl', x: enterProgress < 1 ? -cornerSize * (1 - bounced) : exitProgress > 0 ? -cornerSize * exitEased : 0, y: enterProgress < 1 ? cornerSize * (1 - bounced) : exitProgress > 0 ? cornerSize * exitEased : 0, bottom: 16, left: 16, hDir: 'right', vDir: 'up' },
    { id: 'br', x: enterProgress < 1 ? cornerSize * (1 - bounced) : exitProgress > 0 ? cornerSize * exitEased : 0, y: enterProgress < 1 ? cornerSize * (1 - bounced) : exitProgress > 0 ? cornerSize * exitEased : 0, bottom: 16, right: 16, hDir: 'left', vDir: 'up' },
  ]

  const opacity = enterProgress < 1
    ? Math.min(1, enterProgress * 3)
    : exitProgress > 0
      ? 1 - exitEased
      : 1

  return (
    <div style={{ position: 'absolute', inset: 0, overflow: 'hidden' }}>
      {bgColor !== 'transparent' && (
        <div style={{ position: 'absolute', inset: 0, background: bgColor }} />
      )}

      {corners.map((corner) => {
        const posStyle: React.CSSProperties = { position: 'absolute' }
        if ('top' in corner && corner.top !== undefined) posStyle.top = corner.top
        if ('bottom' in corner && corner.bottom !== undefined) posStyle.bottom = corner.bottom
        if ('left' in corner && corner.left !== undefined) posStyle.left = corner.left
        if ('right' in corner && corner.right !== undefined) posStyle.right = corner.right

        return (
          <div
            key={corner.id}
            style={{
              ...posStyle,
              width: armLength,
              height: armLength,
              transform: `translate(${corner.x}px, ${corner.y}px) ${skew}`,
              opacity,
            }}
          >
            {/* Horizontal arm */}
            <div
              style={{
                position: 'absolute',
                [corner.vDir === 'down' ? 'top' : 'bottom']: 0,
                [corner.hDir === 'right' ? 'left' : 'right']: 0,
                width: armLength,
                height: thickness,
                background: cornerColor,
                borderRadius,
                boxShadow: glowPulse > 0 ? `0 0 ${glowPulse}px ${cornerColor}` : 'none',
              }}
            />
            {/* Vertical arm */}
            <div
              style={{
                position: 'absolute',
                [corner.vDir === 'down' ? 'top' : 'bottom']: 0,
                [corner.hDir === 'right' ? 'left' : 'right']: 0,
                width: thickness,
                height: armLength,
                background: cornerColor,
                borderRadius,
                boxShadow: glowPulse > 0 ? `0 0 ${glowPulse}px ${cornerColor}` : 'none',
              }}
            />
          </div>
        )
      })}
    </div>
  )
}

registerMotionGraphic({
  id: 'tpl-scene-corner-accent',
  title: 'Scene Corner Accent',
  description: 'Animated L-shaped corner accents with bounce-in, glow pulse, and fly-out exit',
  tags: ['scene', 'corner', 'accent', 'overlay', 'decoration'],
  category: 'scene-layout',
  component: SceneCornerAccentComponent as any,
  defaultConfig: {
    cornerColor: '#ffffff',
    cornerSize: 60,
    cornerStyle: 'geometric',
    bgColor: 'transparent',
  },
  configSchema: [
    { key: 'cornerColor', label: 'Corner Color', type: 'color', defaultValue: '#ffffff', group: 'Style' },
    { key: 'cornerSize', label: 'Corner Size', type: 'number', defaultValue: 60, min: 20, max: 150, group: 'Style' },
    { key: 'cornerStyle', label: 'Corner Style', type: 'select', defaultValue: 'geometric', options: ['geometric', 'rounded', 'angular'], group: 'Style' },
    { key: 'bgColor', label: 'Background Color', type: 'color', defaultValue: 'transparent', group: 'Style' },
  ],
})
