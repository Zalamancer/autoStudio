import React from 'react'
import { registerMotionGraphic } from '../registry'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface RetroLoadScreenConfig {
  title: string
  tipText: string
  bgColor: string
  barColor: string
  textColor: string
  accentColor: string
}

function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3)
}

function SceneRetroLoadScreenComponent({ config, frame, fps, progress }: MotionGraphicProps<RetroLoadScreenConfig>) {
  const { title, tipText, bgColor, barColor, textColor, accentColor } = config
  const time = frame / fps

  const enterProgress = progress < 0.1 ? progress / 0.1 : 1
  const exitProgress = progress > 0.9 ? (progress - 0.9) / 0.1 : 0
  const mainOpacity = easeOutCubic(enterProgress) * (1 - easeOutCubic(exitProgress))

  // Loading bar fills from 0% to 100% over the animation
  const loadProgress = Math.min(1, Math.max(0, (progress - 0.1) / 0.75))
  const loadPercent = Math.floor(loadProgress * 100)

  // Stepped progress for pixel feel
  const steppedProgress = Math.floor(loadProgress * 20) / 20

  // Spinner rotation
  const spinnerChars = ['|', '/', '-', '\\']
  const spinnerIdx = Math.floor(time * 6) % spinnerChars.length

  // Loading dots animation
  const dotCount = Math.floor(time * 2) % 4

  // File name cycling
  const files = ['SPRITES.DAT', 'TILEMAP.BIN', 'MUSIC.MOD', 'LEVEL01.MAP', 'PALETTE.COL', 'FONT8X8.CHR']
  const fileIdx = Math.floor(loadProgress * files.length) % files.length

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
          backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.12) 2px, rgba(0,0,0,0.12) 4px)',
          pointerEvents: 'none',
          zIndex: 10,
        }}
      />

      {/* Pixel border frame */}
      <div
        style={{
          position: 'absolute',
          inset: 10,
          border: `2px solid ${accentColor}30`,
          pointerEvents: 'none',
        }}
      />

      {/* Title */}
      <div
        style={{
          fontSize: 'clamp(22px, 5.5vw, 48px)',
          fontWeight: 700,
          color: textColor,
          textTransform: 'uppercase',
          letterSpacing: 6,
          marginBottom: 'clamp(16px, 3vw, 32px)',
          textShadow: `0 0 10px ${accentColor}40`,
          WebkitFontSmoothing: 'none' as any,
        }}
      >
        {title}
      </div>

      {/* Progress bar container */}
      <div
        style={{
          width: 'clamp(240px, 60vw, 460px)',
          marginBottom: 'clamp(8px, 1.5vw, 14px)',
        }}
      >
        {/* Bar border */}
        <div
          style={{
            width: '100%',
            height: 'clamp(18px, 3vw, 28px)',
            border: `3px solid ${accentColor}`,
            background: '#0a0a0a',
            position: 'relative',
            overflow: 'hidden',
            imageRendering: 'pixelated' as any,
          }}
        >
          {/* Filled blocks */}
          <div style={{ display: 'flex', height: '100%', padding: 2, gap: 2 }}>
            {Array.from({ length: 20 }, (_, i) => {
              const filled = i / 20 < steppedProgress
              return (
                <div
                  key={i}
                  style={{
                    flex: 1,
                    height: '100%',
                    background: filled ? barColor : 'transparent',
                    opacity: filled ? (i === Math.floor(steppedProgress * 20) - 1 && Math.floor(time * 6) % 2 === 0 ? 0.7 : 1) : 0,
                    imageRendering: 'pixelated' as any,
                  }}
                />
              )
            })}
          </div>
          {/* Highlight line */}
          <div
            style={{
              position: 'absolute',
              top: 3,
              left: 3,
              width: `${steppedProgress * 97}%`,
              height: 2,
              background: 'rgba(255,255,255,0.2)',
            }}
          />
        </div>
      </div>

      {/* Percentage */}
      <div
        style={{
          fontSize: 'clamp(14px, 3vw, 26px)',
          fontWeight: 700,
          color: accentColor,
          letterSpacing: 2,
          marginBottom: 'clamp(6px, 1.2vw, 12px)',
        }}
      >
        {`${loadPercent}%`}
      </div>

      {/* Loading file info */}
      <div
        style={{
          fontSize: 'clamp(9px, 1.6vw, 13px)',
          color: `${textColor}80`,
          letterSpacing: 1,
          marginBottom: 'clamp(4px, 0.8vw, 8px)',
          display: 'flex',
          alignItems: 'center',
          gap: 8,
        }}
      >
        <span>{spinnerChars[spinnerIdx]}</span>
        <span>{`LOADING ${files[fileIdx]}${'.'.repeat(dotCount)}`}</span>
      </div>

      {/* Memory counter */}
      <div
        style={{
          fontSize: 'clamp(8px, 1.4vw, 11px)',
          color: `${textColor}50`,
          letterSpacing: 2,
          marginBottom: 'clamp(16px, 3vw, 32px)',
        }}
      >
        {`MEM: ${Math.floor(loadProgress * 640)}K / 640K`}
      </div>

      {/* Tip text */}
      <div
        style={{
          position: 'absolute',
          bottom: '10%',
          width: 'clamp(220px, 55vw, 420px)',
          textAlign: 'center',
        }}
      >
        <div
          style={{
            fontSize: 'clamp(9px, 1.6vw, 13px)',
            color: accentColor,
            fontWeight: 700,
            letterSpacing: 2,
            marginBottom: 4,
            textTransform: 'uppercase',
          }}
        >
          {'TIP:'}
        </div>
        <div
          style={{
            fontSize: 'clamp(9px, 1.6vw, 12px)',
            color: `${textColor}90`,
            lineHeight: 1.4,
          }}
        >
          {tipText}
        </div>
      </div>

      {/* Animated dots at bottom corners */}
      {Array.from({ length: 6 }, (_, i) => {
        const dotVisible = Math.floor(time * 3 + i * 0.5) % 3 === 0
        return (
          <div
            key={`dot-${i}`}
            style={{
              position: 'absolute',
              bottom: 16,
              left: 16 + i * 12,
              width: 4,
              height: 4,
              background: accentColor,
              opacity: dotVisible ? 0.4 : 0.1,
              imageRendering: 'pixelated' as any,
            }}
          />
        )
      })}

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
  id: 'tpl-scene-retro-load-screen',
  title: 'Scene Retro Load Screen',
  description: 'Retro loading screen with segmented pixel progress bar, file name cycling, memory counter, spinner, and tip text',
  tags: ['scene', 'loading', 'retro', 'progress-bar', 'gaming', 'pixel', 'DOS', 'nostalgic'],
  category: 'scene-layout',
  component: SceneRetroLoadScreenComponent as unknown as React.ComponentType<MotionGraphicProps>,
  defaultConfig: {
    title: 'LOADING',
    tipText: 'Press START to skip cutscenes. Collect all coins for a secret ending!',
    bgColor: '#0a0a0a',
    barColor: '#00CC00',
    textColor: '#CCCCCC',
    accentColor: '#00FF00',
  },
  configSchema: [
    { key: 'title', label: 'Title', type: 'text', defaultValue: 'LOADING', group: 'Content' },
    { key: 'tipText', label: 'Tip Text', type: 'text', defaultValue: 'Press START to skip cutscenes. Collect all coins for a secret ending!', group: 'Content' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#0a0a0a', group: 'Style' },
    { key: 'barColor', label: 'Bar Color', type: 'color', defaultValue: '#00CC00', group: 'Style' },
    { key: 'textColor', label: 'Text Color', type: 'color', defaultValue: '#CCCCCC', group: 'Style' },
    { key: 'accentColor', label: 'Accent', type: 'color', defaultValue: '#00FF00', group: 'Style' },
  ],
})
