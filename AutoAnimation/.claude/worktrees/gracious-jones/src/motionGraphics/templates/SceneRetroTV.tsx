import React from 'react'
import { registerMotionGraphic } from '../registry'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface RetroTVSceneConfig {
  channel: string
  showName: string
  message: string
  bgColor: string
  cabinetColor: string
  screenColor: string
  textColor: string
  glowColor: string
}

function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3)
}

function easeOutBack(t: number): number {
  const c = 1.70158
  return 1 + (c + 1) * Math.pow(t - 1, 3) + c * Math.pow(t - 1, 2)
}

function easeInCubic(t: number): number {
  return t * t * t
}

function SceneRetroTVComponent({
  config,
  frame,
  fps,
  durationInFrames,
}: MotionGraphicProps<RetroTVSceneConfig>) {
  const { channel, showName, message, bgColor, cabinetColor, screenColor, textColor, glowColor } = config
  const progress = frame / durationInFrames
  const time = frame / fps

  const enterEnd = 0.3
  const holdEnd = 0.78
  const enterProgress = Math.min(1, progress / enterEnd)
  const holdProgress = progress >= enterEnd && progress < holdEnd ? (progress - enterEnd) / (holdEnd - enterEnd) : progress >= holdEnd ? 1 : 0
  const exitProgress = progress >= holdEnd ? (progress - holdEnd) / (1 - holdEnd) : 0

  // TV powers on — white dot expanding
  const powerOn = easeOutCubic(Math.min(1, enterProgress / 0.4))
  const screenBrightness = powerOn
  const dotSize = powerOn < 0.3 ? powerOn / 0.3 : 1

  // Channel text appears
  const channelProgress = easeOutCubic(Math.max(0, Math.min(1, (enterProgress - 0.3) / 0.2)))

  // Show name
  const showProgress = easeOutBack(Math.max(0, Math.min(1, (enterProgress - 0.45) / 0.25)))

  // Message types in
  const msgProgress = Math.max(0, Math.min(1, (enterProgress - 0.6) / 0.3))
  const msgChars = Math.floor(easeOutCubic(msgProgress) * message.length)

  // Scan line movement
  const scanY = (time * 35) % 100

  // Static flicker
  const flickerAlpha = 0.02 + Math.sin(time * 13.7) * 0.01

  // Hold: screen glow pulses
  const glowPulse = 0.03 + Math.sin(holdProgress * Math.PI * 4) * 0.015

  // Exit: TV powers off — collapse to line
  const exitEased = easeInCubic(exitProgress)
  const exitScaleY = exitProgress > 0.5 ? Math.max(0.005, 1 - (exitProgress - 0.5) * 2) : 1
  const exitScaleX = exitProgress > 0.8 ? Math.max(0, 1 - (exitProgress - 0.8) * 5) : 1
  const exitOpacity = exitProgress > 0.9 ? Math.max(0, 1 - (exitProgress - 0.9) * 10) : 1

  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        overflow: 'hidden',
        background: bgColor,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: "'Courier New', monospace",
      }}
    >
      {/* TV Cabinet */}
      <div
        style={{
          position: 'relative',
          width: 'clamp(300px, 75vw, 500px)',
          aspectRatio: '4/3.5',
          background: cabinetColor,
          borderRadius: 'clamp(12px, 2.5vw, 24px)',
          padding: 'clamp(16px, 3vw, 28px)',
          boxShadow: '0 12px 40px rgba(0,0,0,0.4), inset 0 2px 4px rgba(255,255,255,0.05)',
          opacity: easeOutCubic(Math.min(1, enterProgress / 0.2)),
        }}
      >
        {/* Wood grain texture */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            borderRadius: 'clamp(12px, 2.5vw, 24px)',
            backgroundImage: 'repeating-linear-gradient(90deg, rgba(255,255,255,0.02) 0px, transparent 2px, rgba(0,0,0,0.02) 4px)',
            pointerEvents: 'none',
          }}
        />

        {/* Screen area */}
        <div
          style={{
            position: 'relative',
            width: '100%',
            aspectRatio: '4/3',
            background: screenColor,
            borderRadius: 'clamp(8px, 2vw, 18px)',
            overflow: 'hidden',
            boxShadow: `inset 0 0 40px rgba(0,0,0,0.4), 0 0 ${20 * screenBrightness}px ${glowColor}${Math.round(glowPulse * 255).toString(16).padStart(2, '0')}`,
            transform: `scaleY(${exitScaleY}) scaleX(${exitScaleX})`,
            opacity: exitOpacity,
          }}
        >
          {/* Screen content — visible after power on */}
          <div style={{ position: 'absolute', inset: 0, opacity: screenBrightness }}>
            {/* CRT scan lines */}
            <div
              style={{
                position: 'absolute',
                inset: 0,
                backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 1px, rgba(0,0,0,0.12) 1px, rgba(0,0,0,0.12) 3px)',
                pointerEvents: 'none',
                zIndex: 5,
              }}
            />
            {/* Moving scan line */}
            <div
              style={{
                position: 'absolute',
                left: 0,
                right: 0,
                top: `${scanY}%`,
                height: 3,
                background: 'rgba(255,255,255,0.05)',
                filter: 'blur(1px)',
                zIndex: 6,
              }}
            />
            {/* Screen curvature vignette */}
            <div
              style={{
                position: 'absolute',
                inset: 0,
                background: 'radial-gradient(ellipse at center, transparent 55%, rgba(0,0,0,0.45) 100%)',
                zIndex: 4,
              }}
            />

            {/* Channel number — top left */}
            <div
              style={{
                position: 'absolute',
                top: 'clamp(10px, 3%, 18px)',
                left: 'clamp(12px, 4%, 20px)',
                fontSize: 'clamp(18px, 4vw, 32px)',
                fontWeight: 700,
                color: textColor,
                opacity: channelProgress,
                textShadow: `0 0 6px ${glowColor}`,
                zIndex: 3,
              }}
            >
              CH{channel}
            </div>

            {/* Show name — center */}
            <div
              style={{
                position: 'absolute',
                top: '35%',
                left: '50%',
                transform: `translate(-50%, -50%) scale(${showProgress})`,
                fontSize: 'clamp(22px, 5.5vw, 42px)',
                fontWeight: 900,
                color: textColor,
                textTransform: 'uppercase',
                letterSpacing: 4,
                textAlign: 'center',
                whiteSpace: 'nowrap',
                textShadow: `0 0 10px ${glowColor}60`,
                zIndex: 3,
              }}
            >
              {showName}
            </div>

            {/* Message — bottom */}
            <div
              style={{
                position: 'absolute',
                bottom: 'clamp(14px, 5%, 24px)',
                left: '50%',
                transform: 'translateX(-50%)',
                fontSize: 'clamp(10px, 2vw, 15px)',
                color: `${textColor}CC`,
                whiteSpace: 'nowrap',
                zIndex: 3,
              }}
            >
              {message.substring(0, msgChars)}
              {msgChars < message.length && <span style={{ opacity: Math.sin(time * 5) > 0 ? 1 : 0 }}>_</span>}
            </div>
          </div>
        </div>

        {/* Control panel below screen */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'flex-end',
            alignItems: 'center',
            gap: 'clamp(8px, 1.5vw, 14px)',
            marginTop: 'clamp(8px, 1.5vw, 14px)',
            paddingRight: 'clamp(10px, 2vw, 20px)',
          }}
        >
          {/* Volume knob */}
          <div style={{ width: 'clamp(14px, 2.5vw, 22px)', height: 'clamp(14px, 2.5vw, 22px)', borderRadius: '50%', background: 'radial-gradient(circle, #8B7355, #5C4033)', border: '1px solid #3E2723' }} />
          {/* Channel knob */}
          <div style={{ width: 'clamp(14px, 2.5vw, 22px)', height: 'clamp(14px, 2.5vw, 22px)', borderRadius: '50%', background: 'radial-gradient(circle, #8B7355, #5C4033)', border: '1px solid #3E2723' }} />
        </div>
      </div>
    </div>
  )
}

registerMotionGraphic({
  id: 'tpl-scene-retro-tv',
  title: 'Scene Retro TV',
  description: 'Old CRT television with wood cabinet, power-on white dot expansion, scan lines, screen curvature, channel display, and power-off collapse',
  tags: ['scene', 'retro', 'tv', 'vintage', 'crt', 'television', 'analog', 'cabinet'],
  category: 'scene-layout',
  component: SceneRetroTVComponent as unknown as React.ComponentType<MotionGraphicProps>,
  defaultConfig: {
    channel: '7',
    showName: 'TONIGHT',
    message: 'Stay tuned for more...',
    bgColor: '#1A1408',
    cabinetColor: '#4E342E',
    screenColor: '#0A0A08',
    textColor: '#E8DCC8',
    glowColor: '#C8B896',
  },
  configSchema: [
    { key: 'channel', label: 'Channel', type: 'text', defaultValue: '7', group: 'Content' },
    { key: 'showName', label: 'Show Name', type: 'text', defaultValue: 'TONIGHT', group: 'Content' },
    { key: 'message', label: 'Message', type: 'text', defaultValue: 'Stay tuned for more...', group: 'Content' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#1A1408', group: 'Style' },
    { key: 'cabinetColor', label: 'Cabinet Color', type: 'color', defaultValue: '#4E342E', group: 'Style' },
    { key: 'screenColor', label: 'Screen Color', type: 'color', defaultValue: '#0A0A08', group: 'Style' },
    { key: 'textColor', label: 'Text Color', type: 'color', defaultValue: '#E8DCC8', group: 'Style' },
    { key: 'glowColor', label: 'Glow Color', type: 'color', defaultValue: '#C8B896', group: 'Style' },
  ],
})
