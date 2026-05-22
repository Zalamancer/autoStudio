import React from 'react'
import { registerMotionGraphic } from '../registry'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface SceneVintageBorderConfig {
  vignetteColor: string
  grainIntensity: number
  borderRadius: number
  sepiaTint: number
  bgColor: string
}

function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3)
}

function easeInCubic(t: number): number {
  return t * t * t
}

function SceneVintageBorderComponent({ config, progress, frame, fps }: MotionGraphicProps<SceneVintageBorderConfig>) {
  const { vignetteColor, grainIntensity, borderRadius, sepiaTint, bgColor } = config

  const enterProgress = progress < 0.2 ? progress / 0.2 : 1
  const holdProgress = progress >= 0.2 && progress < 0.8 ? (progress - 0.2) / 0.6 : progress >= 0.8 ? 1 : 0
  const exitProgress = progress >= 0.8 ? (progress - 0.8) / 0.2 : 0

  // Vignette fades in on enter, intensifies to black on exit
  const vignetteOpacity = enterProgress < 1
    ? easeOutCubic(enterProgress)
    : exitProgress > 0
      ? 1
      : 1

  const vignetteSize = enterProgress < 1
    ? 60 + (1 - enterProgress) * 20
    : exitProgress > 0
      ? 60 - exitProgress * 40
      : 60

  // Grain animation during hold (position shift)
  const timeSeconds = frame / fps
  const grainOffsetX = holdProgress > 0 ? Math.sin(timeSeconds * 17) * 50 : 0
  const grainOffsetY = holdProgress > 0 ? Math.cos(timeSeconds * 23) * 50 : 0

  // Grain opacity
  const grainOpacity = enterProgress < 1
    ? grainIntensity * easeOutCubic(enterProgress)
    : exitProgress > 0
      ? grainIntensity * (1 - exitProgress * 0.5)
      : grainIntensity

  // Sepia overlay
  const sepiaOpacity = enterProgress < 1
    ? sepiaTint * easeOutCubic(enterProgress) * 0.01
    : exitProgress > 0
      ? sepiaTint * 0.01 + exitProgress * 0.1
      : sepiaTint * 0.01

  // CSS noise pattern using repeating gradients (approximation of film grain)
  const noiseGradient = `
    repeating-conic-gradient(
      rgba(0,0,0,0.03) 0%,
      rgba(255,255,255,0.03) 0.5%,
      rgba(0,0,0,0.06) 1%,
      transparent 1.5%,
      rgba(0,0,0,0.02) 2%
    )
  `

  return (
    <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', borderRadius }}>
      {bgColor !== 'transparent' && (
        <div style={{ position: 'absolute', inset: 0, background: bgColor }} />
      )}

      {/* Sepia tint overlay */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: '#704214',
          opacity: sepiaOpacity,
          mixBlendMode: 'multiply',
          borderRadius,
          pointerEvents: 'none',
        }}
      />

      {/* Film grain overlay */}
      <div
        style={{
          position: 'absolute',
          inset: -100,
          background: noiseGradient,
          backgroundSize: '200px 200px',
          backgroundPosition: `${grainOffsetX}px ${grainOffsetY}px`,
          opacity: grainOpacity,
          pointerEvents: 'none',
          mixBlendMode: 'overlay',
        }}
      />

      {/* Secondary grain layer for density */}
      <div
        style={{
          position: 'absolute',
          inset: -100,
          background: noiseGradient,
          backgroundSize: '150px 150px',
          backgroundPosition: `${-grainOffsetX * 0.7}px ${-grainOffsetY * 1.3}px`,
          opacity: grainOpacity * 0.5,
          pointerEvents: 'none',
          mixBlendMode: 'overlay',
        }}
      />

      {/* Vignette overlay */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: `radial-gradient(ellipse at center, transparent ${vignetteSize}%, ${vignetteColor} 100%)`,
          opacity: vignetteOpacity,
          borderRadius,
          pointerEvents: 'none',
        }}
      />

      {/* Aged edge darkening */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          boxShadow: `inset 0 0 60px 20px ${vignetteColor}40`,
          borderRadius,
          opacity: vignetteOpacity,
          pointerEvents: 'none',
        }}
      />

      {/* Edge scratches / border wear */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          border: `2px solid ${vignetteColor}20`,
          borderRadius,
          boxShadow: `inset 0 0 30px 5px ${vignetteColor}15`,
          pointerEvents: 'none',
        }}
      />
    </div>
  )
}

registerMotionGraphic({
  id: 'tpl-scene-vintage-border',
  title: 'Scene Vintage Border',
  description: 'Vintage retro film border with animated vignette, film grain noise, sepia tint, and aged edges',
  tags: ['scene', 'vintage', 'retro', 'film', 'border', 'overlay', 'vignette'],
  category: 'scene-layout',
  component: SceneVintageBorderComponent as any,
  defaultConfig: {
    vignetteColor: '#000000',
    grainIntensity: 0.4,
    borderRadius: 8,
    sepiaTint: 20,
    bgColor: 'transparent',
  },
  configSchema: [
    { key: 'vignetteColor', label: 'Vignette Color', type: 'color', defaultValue: '#000000', group: 'Style' },
    { key: 'grainIntensity', label: 'Grain Intensity', type: 'number', defaultValue: 0.4, min: 0, max: 1, group: 'Style' },
    { key: 'borderRadius', label: 'Border Radius', type: 'number', defaultValue: 8, min: 0, max: 40, group: 'Style' },
    { key: 'sepiaTint', label: 'Sepia Tint (%)', type: 'number', defaultValue: 20, min: 0, max: 100, group: 'Style' },
    { key: 'bgColor', label: 'Background Color', type: 'color', defaultValue: 'transparent', group: 'Style' },
  ],
})
