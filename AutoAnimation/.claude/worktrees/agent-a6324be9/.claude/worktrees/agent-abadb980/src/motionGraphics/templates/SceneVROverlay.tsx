import React from 'react'
import { registerMotionGraphic } from '../registry'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface SceneVROverlayConfig {
  appName: string
  fov: number
  fps: number
  resolution: string
  trackingMode: string
  handTracking: string
  environment: string
  bgColor: string
  accentColor: string
  textColor: string
}

function easeOutCubic(t: number): number { return 1 - Math.pow(1 - t, 3) }
function easeInCubic(t: number): number { return t * t * t }

function SceneVROverlayComponent({ config, progress }: MotionGraphicProps<SceneVROverlayConfig>) {
  const { appName, fov, fps: fpsVal, resolution, trackingMode, handTracking, environment, bgColor, accentColor, textColor } = config

  const enterProgress = progress < 0.2 ? progress / 0.2 : 1
  const holdProgress = progress >= 0.2 && progress < 0.8 ? (progress - 0.2) / 0.6 : progress >= 0.8 ? 1 : 0
  const exitProgress = progress >= 0.8 ? (progress - 0.8) / 0.2 : 0

  const exitOpacity = exitProgress > 0 ? 1 - easeInCubic(exitProgress) : 1
  const frame = Math.floor(progress * 300)

  // HUD elements fade in from edges
  const topReveal = easeOutCubic(Math.min(1, enterProgress / 0.5))
  const bottomReveal = easeOutCubic(Math.max(0, (enterProgress - 0.1) / 0.5))
  const sideReveal = easeOutCubic(Math.max(0, (enterProgress - 0.2) / 0.5))

  // Crosshair subtle drift
  const crossX = Math.sin(frame * 0.03) * 2
  const crossY = Math.cos(frame * 0.025) * 1.5

  return (
    <div style={{ position: 'absolute', inset: 0, overflow: 'hidden' }}>
      <div style={{ position: 'absolute', inset: 0, background: bgColor }} />

      {/* Vignette */}
      <div style={{
        position: 'absolute', inset: 0,
        background: 'radial-gradient(ellipse at center, transparent 50%, rgba(0,0,0,0.5) 100%)',
        pointerEvents: 'none',
      }} />

      <div style={{ position: 'absolute', inset: 0, opacity: exitOpacity }}>
        {/* Top-left: App name + Environment */}
        <div style={{
          position: 'absolute',
          top: 'clamp(12px, 3vw, 24px)',
          left: 'clamp(12px, 3vw, 24px)',
          opacity: topReveal,
          transform: `translateY(${(1 - topReveal) * -20}px)`,
        }}>
          <div style={{
            fontFamily: "'Courier New', monospace",
            fontSize: 'clamp(14px, 3vw, 22px)',
            fontWeight: 700,
            color: accentColor,
            letterSpacing: 3,
            textShadow: `0 0 8px ${accentColor}40`,
          }}>
            {appName}
          </div>
          <div style={{
            fontFamily: "'Courier New', monospace",
            fontSize: 'clamp(8px, 1.4vw, 10px)',
            color: `${textColor}40`,
            letterSpacing: 1,
            marginTop: 2,
          }}>
            ENV: {environment}
          </div>
        </div>

        {/* Top-right: FPS + Resolution */}
        <div style={{
          position: 'absolute',
          top: 'clamp(12px, 3vw, 24px)',
          right: 'clamp(12px, 3vw, 24px)',
          textAlign: 'right',
          opacity: topReveal,
          transform: `translateY(${(1 - topReveal) * -20}px)`,
        }}>
          <div style={{
            fontFamily: "'Courier New', monospace",
            fontSize: 'clamp(18px, 4vw, 30px)',
            fontWeight: 900,
            color: fpsVal >= 90 ? '#00FF88' : '#FFAA00',
            lineHeight: 1,
          }}>
            {Math.round(fpsVal * easeOutCubic(Math.max(0, (enterProgress - 0.15) / 0.85)))}
            <span style={{ fontSize: 'clamp(8px, 1.4vw, 11px)', color: `${textColor}40`, marginLeft: 3 }}>FPS</span>
          </div>
          <div style={{
            fontFamily: "'Courier New', monospace",
            fontSize: 'clamp(8px, 1.4vw, 10px)',
            color: `${textColor}35`,
            marginTop: 2,
          }}>
            {resolution}
          </div>
        </div>

        {/* Center crosshair */}
        <div style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: `translate(calc(-50% + ${crossX}px), calc(-50% + ${crossY}px))`,
          opacity: sideReveal * 0.4,
        }}>
          <div style={{ width: 20, height: 1, background: accentColor, position: 'absolute', top: 0, left: -10, opacity: 0.5 }} />
          <div style={{ width: 1, height: 20, background: accentColor, position: 'absolute', top: -10, left: 0, opacity: 0.5 }} />
          <div style={{ width: 6, height: 6, border: `1px solid ${accentColor}60`, borderRadius: '50%', position: 'absolute', top: -3, left: -3 }} />
        </div>

        {/* Left side: Tracking info */}
        <div style={{
          position: 'absolute',
          left: 'clamp(12px, 3vw, 24px)',
          top: '50%',
          transform: `translateY(-50%) translateX(${(1 - sideReveal) * -30}px)`,
          opacity: sideReveal,
        }}>
          {[
            { label: 'TRACK', value: trackingMode },
            { label: 'HANDS', value: handTracking },
            { label: 'FOV', value: `${fov}\u00b0` },
          ].map((item, i) => (
            <div key={i} style={{ marginBottom: 'clamp(6px, 1.2vw, 10px)' }}>
              <div style={{ fontFamily: "'Courier New', monospace", fontSize: 'clamp(6px, 1vw, 8px)', color: `${textColor}30`, letterSpacing: 2 }}>
                {item.label}
              </div>
              <div style={{ fontFamily: "'Courier New', monospace", fontSize: 'clamp(10px, 1.8vw, 14px)', fontWeight: 700, color: textColor }}>
                {item.value}
              </div>
            </div>
          ))}
        </div>

        {/* Bottom center: Status bar */}
        <div style={{
          position: 'absolute',
          bottom: 'clamp(12px, 3vw, 24px)',
          left: '50%',
          transform: `translateX(-50%) translateY(${(1 - bottomReveal) * 20}px)`,
          opacity: bottomReveal,
          display: 'flex',
          gap: 'clamp(12px, 3vw, 24px)',
        }}>
          {['SPATIAL', 'AUDIO', 'HAPTIC'].map((label, i) => {
            const isActive = i < 2
            return (
              <div key={i} style={{
                display: 'flex', alignItems: 'center', gap: 4,
              }}>
                <div style={{
                  width: 6, height: 6, borderRadius: '50%',
                  background: isActive ? '#00FF88' : '#FF4444',
                  boxShadow: isActive ? '0 0 6px rgba(0,255,136,0.4)' : '0 0 6px rgba(255,68,68,0.4)',
                }} />
                <span style={{
                  fontFamily: "'Courier New', monospace",
                  fontSize: 'clamp(7px, 1.2vw, 9px)',
                  color: `${textColor}40`,
                  letterSpacing: 1,
                }}>
                  {label}
                </span>
              </div>
            )
          })}
        </div>

        {/* Corner brackets (HUD frame) */}
        {[
          { top: 'clamp(8px, 2vw, 16px)', left: 'clamp(8px, 2vw, 16px)' },
          { top: 'clamp(8px, 2vw, 16px)', right: 'clamp(8px, 2vw, 16px)' },
          { bottom: 'clamp(8px, 2vw, 16px)', left: 'clamp(8px, 2vw, 16px)' },
          { bottom: 'clamp(8px, 2vw, 16px)', right: 'clamp(8px, 2vw, 16px)' },
        ].map((pos, i) => {
          const rotations = [0, 90, 270, 180]
          return (
            <div
              key={i}
              style={{
                position: 'absolute',
                ...pos,
                width: 'clamp(16px, 3vw, 28px)',
                height: 'clamp(16px, 3vw, 28px)',
                borderTop: `1px solid ${accentColor}30`,
                borderLeft: `1px solid ${accentColor}30`,
                transform: `rotate(${rotations[i]}deg)`,
                opacity: sideReveal,
                pointerEvents: 'none',
              }}
            />
          )
        })}
      </div>
    </div>
  )
}

registerMotionGraphic({
  id: 'tpl-scene-vr-overlay',
  title: 'VR Heads-Up Display',
  description: 'VR/AR heads-up display overlay with FPS counter, crosshair, tracking status, corner brackets, and spatial indicators',
  tags: ['scene', 'vr', 'ar', 'hud', 'overlay', 'futuristic', 'gaming', 'cyberpunk'],
  category: 'scene-layout',
  component: SceneVROverlayComponent as any,
  defaultConfig: {
    appName: 'NEXUS VR',
    fov: 120,
    fps: 90,
    resolution: '4K PER EYE',
    trackingMode: '6DOF',
    handTracking: 'ACTIVE',
    environment: 'CYBERSPACE',
    bgColor: '#06080e',
    accentColor: '#00FFFF',
    textColor: '#e0e4ea',
  },
  configSchema: [
    { key: 'appName', label: 'App Name', type: 'text', defaultValue: 'NEXUS VR', group: 'Content' },
    { key: 'fov', label: 'FOV', type: 'number', defaultValue: 120, min: 60, max: 220, group: 'Stats' },
    { key: 'fps', label: 'FPS', type: 'number', defaultValue: 90, min: 1, max: 240, group: 'Stats' },
    { key: 'resolution', label: 'Resolution', type: 'text', defaultValue: '4K PER EYE', group: 'Content' },
    { key: 'trackingMode', label: 'Tracking', type: 'text', defaultValue: '6DOF', group: 'Content' },
    { key: 'handTracking', label: 'Hand Tracking', type: 'text', defaultValue: 'ACTIVE', group: 'Content' },
    { key: 'environment', label: 'Environment', type: 'text', defaultValue: 'CYBERSPACE', group: 'Content' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#06080e', group: 'Style' },
    { key: 'accentColor', label: 'Accent', type: 'color', defaultValue: '#00FFFF', group: 'Style' },
    { key: 'textColor', label: 'Text Color', type: 'color', defaultValue: '#e0e4ea', group: 'Style' },
  ],
})
