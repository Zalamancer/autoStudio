import React from 'react'
import { registerMotionGraphic } from '../registry'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface SceneRibbonBannerConfig {
  ribbonText: string
  ribbonColor: string
  textColor: string
  position: 'top-left' | 'top-right'
  ribbonWidth: number
  bgColor: string
}

function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3)
}

function easeInCubic(t: number): number {
  return t * t * t
}

function elasticOut(t: number): number {
  if (t === 0 || t === 1) return t
  return Math.pow(2, -10 * t) * Math.sin((t - 0.075) * (2 * Math.PI) / 0.3) + 1
}

function SceneRibbonBannerComponent({ config, progress }: MotionGraphicProps<SceneRibbonBannerConfig>) {
  const { ribbonText, ribbonColor, textColor, position, ribbonWidth, bgColor } = config

  const enterProgress = progress < 0.2 ? progress / 0.2 : 1
  const holdProgress = progress >= 0.2 && progress < 0.8 ? (progress - 0.2) / 0.6 : progress >= 0.8 ? 1 : 0
  const exitProgress = progress >= 0.8 ? (progress - 0.8) / 0.2 : 0

  const isLeft = position === 'top-left'

  // Ribbon slides in diagonally with elastic easing
  const slideOffset = enterProgress < 1
    ? -200 * (1 - elasticOut(enterProgress))
    : exitProgress > 0
      ? -200 * easeInCubic(exitProgress)
      : 0

  const ribbonOpacity = enterProgress < 1
    ? Math.min(1, enterProgress * 2.5)
    : exitProgress > 0
      ? 1 - easeInCubic(exitProgress)
      : 1

  // Text appears after ribbon lands
  const textOpacity = enterProgress < 1
    ? easeOutCubic(Math.max(0, (enterProgress - 0.6) / 0.4))
    : exitProgress > 0
      ? 1 - easeInCubic(Math.min(1, exitProgress / 0.5))
      : 1

  // Subtle shadow during hold
  const shadowIntensity = holdProgress > 0 ? 8 + Math.sin(holdProgress * Math.PI * 2) * 2 : 6

  const rotation = isLeft ? -45 : 45
  const ribbonLength = 280

  return (
    <div style={{ position: 'absolute', inset: 0, overflow: 'hidden' }}>
      {bgColor !== 'transparent' && (
        <div style={{ position: 'absolute', inset: 0, background: bgColor }} />
      )}

      <div
        style={{
          position: 'absolute',
          top: isLeft ? -10 : -10,
          [isLeft ? 'left' : 'right']: -10,
          width: ribbonLength,
          height: ribbonLength,
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'center',
          transform: `translate(${isLeft ? slideOffset : -slideOffset}px, ${slideOffset}px)`,
          opacity: ribbonOpacity,
        }}
      >
        <div
          style={{
            position: 'absolute',
            top: ribbonLength * 0.22,
            width: ribbonLength * 1.5,
            height: ribbonWidth,
            background: ribbonColor,
            transform: `rotate(${rotation}deg)`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: `0 ${shadowIntensity / 2}px ${shadowIntensity}px rgba(0,0,0,0.3)`,
          }}
        >
          <span
            style={{
              color: textColor,
              fontFamily: "'Arial Black', 'Helvetica Neue', sans-serif",
              fontSize: Math.max(10, ribbonWidth * 0.4),
              fontWeight: 900,
              textTransform: 'uppercase',
              letterSpacing: '0.15em',
              opacity: textOpacity,
              whiteSpace: 'nowrap',
            }}
          >
            {ribbonText}
          </span>
        </div>
      </div>
    </div>
  )
}

registerMotionGraphic({
  id: 'tpl-scene-ribbon-banner',
  title: 'Scene Ribbon Banner',
  description: 'Diagonal ribbon/banner across corner with elastic slide-in and delayed text reveal',
  tags: ['scene', 'ribbon', 'banner', 'overlay', 'decoration'],
  category: 'scene-layout',
  component: SceneRibbonBannerComponent as any,
  defaultConfig: {
    ribbonText: 'FEATURED',
    ribbonColor: '#FF3333',
    textColor: '#ffffff',
    position: 'top-left',
    ribbonWidth: 36,
    bgColor: 'transparent',
  },
  configSchema: [
    { key: 'ribbonText', label: 'Ribbon Text', type: 'text', defaultValue: 'FEATURED', group: 'Content' },
    { key: 'ribbonColor', label: 'Ribbon Color', type: 'color', defaultValue: '#FF3333', group: 'Style' },
    { key: 'textColor', label: 'Text Color', type: 'color', defaultValue: '#ffffff', group: 'Style' },
    { key: 'position', label: 'Position', type: 'select', defaultValue: 'top-left', options: ['top-left', 'top-right'], group: 'Layout' },
    { key: 'ribbonWidth', label: 'Ribbon Width', type: 'number', defaultValue: 36, min: 20, max: 60, group: 'Style' },
    { key: 'bgColor', label: 'Background Color', type: 'color', defaultValue: 'transparent', group: 'Style' },
  ],
})
