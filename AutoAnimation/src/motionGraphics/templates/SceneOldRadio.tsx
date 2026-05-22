import React from 'react'
import { registerMotionGraphic } from '../registry'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface OldRadioConfig {
  stationName: string
  frequency: string
  nowPlaying: string
  artist: string
  bgColor: string
  radioColor: string
  textColor: string
  dialColor: string
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

function SceneOldRadioComponent({
  config,
  frame,
  fps,
  durationInFrames,
}: MotionGraphicProps<OldRadioConfig>) {
  const { stationName, frequency, nowPlaying, artist, bgColor, radioColor, textColor, dialColor, glowColor } = config
  const progress = frame / durationInFrames
  const time = frame / fps

  const enterEnd = 0.3
  const holdEnd = 0.78
  const enterProgress = Math.min(1, progress / enterEnd)
  const holdProgress = progress >= enterEnd && progress < holdEnd ? (progress - enterEnd) / (holdEnd - enterEnd) : progress >= holdEnd ? 1 : 0
  const exitProgress = progress >= holdEnd ? (progress - holdEnd) / (1 - holdEnd) : 0

  // Radio fades in from darkness
  const radioOpacity = easeOutCubic(Math.min(1, enterProgress / 0.3))
  const radioScale = easeOutBack(Math.min(1, enterProgress / 0.4))

  // Dial lights up
  const dialGlow = easeOutCubic(Math.max(0, Math.min(1, (enterProgress - 0.2) / 0.2)))

  // Station name
  const stationProgress = easeOutCubic(Math.max(0, Math.min(1, (enterProgress - 0.3) / 0.2)))

  // Frequency dial sweeps
  const freqProgress = easeOutCubic(Math.max(0, Math.min(1, (enterProgress - 0.4) / 0.25)))
  const dialNeedleX = freqProgress * 80 + 10 // percent position

  // Now playing info
  const nowProgress = easeOutCubic(Math.max(0, Math.min(1, (enterProgress - 0.55) / 0.25)))

  // Artist
  const artistProgress = easeOutCubic(Math.max(0, Math.min(1, (enterProgress - 0.7) / 0.2)))

  // Sound wave animation during hold
  const waveActive = holdProgress > 0

  // Dial glow pulse during hold
  const glowPulse = 1 + Math.sin(time * 2) * 0.15

  // Exit
  const exitEased = easeInCubic(exitProgress)
  const exitOpacity = 1 - exitEased
  const exitScale = 1 - exitEased * 0.1

  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        overflow: 'hidden',
        background: bgColor,
        fontFamily: "'Georgia', 'Times New Roman', serif",
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      {/* Warm ambient light */}
      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: '80%',
          height: '80%',
          background: `radial-gradient(circle, ${glowColor}${Math.round(dialGlow * 8).toString(16).padStart(2, '0')} 0%, transparent 50%)`,
          pointerEvents: 'none',
        }}
      />

      {/* Radio body */}
      <div
        style={{
          position: 'relative',
          width: 'clamp(290px, 72vw, 480px)',
          padding: 'clamp(22px, 4.5vw, 38px)',
          background: radioColor,
          borderRadius: 'clamp(14px, 2.5vw, 24px)',
          transform: `scale(${radioScale * exitScale})`,
          opacity: radioOpacity * exitOpacity,
          boxShadow: '0 12px 40px rgba(0,0,0,0.4), inset 0 2px 4px rgba(255,255,255,0.05)',
        }}
      >
        {/* Wood grain */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            borderRadius: 'clamp(14px, 2.5vw, 24px)',
            backgroundImage: 'repeating-linear-gradient(90deg, rgba(255,255,255,0.01) 0px, transparent 1px, rgba(0,0,0,0.01) 3px)',
            pointerEvents: 'none',
          }}
        />

        {/* Speaker grille */}
        <div
          style={{
            width: '100%',
            height: 'clamp(60px, 14vw, 100px)',
            background: `linear-gradient(180deg, ${radioColor} 0%, rgba(0,0,0,0.15) 50%, ${radioColor} 100%)`,
            borderRadius: 'clamp(8px, 1.5vw, 14px)',
            marginBottom: 'clamp(14px, 3vw, 22px)',
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          {/* Grille slats */}
          {Array.from({ length: 12 }, (_, i) => (
            <div
              key={`slat-${i}`}
              style={{
                position: 'absolute',
                left: '5%',
                right: '5%',
                top: `${8 + i * 8}%`,
                height: 2,
                background: `rgba(0,0,0,0.15)`,
                borderRadius: 1,
              }}
            />
          ))}
          {/* Sound waves during hold */}
          {waveActive && Array.from({ length: 5 }, (_, i) => {
            const waveScale = 0.3 + Math.sin(time * 4 + i * 0.8) * 0.3
            return (
              <div
                key={`wave-${i}`}
                style={{
                  position: 'absolute',
                  left: '50%',
                  top: '50%',
                  transform: `translate(-50%, -50%) scale(${waveScale + i * 0.15})`,
                  width: 'clamp(20px, 4vw, 35px)',
                  height: 'clamp(20px, 4vw, 35px)',
                  borderRadius: '50%',
                  border: `1px solid ${glowColor}${Math.round((0.15 - i * 0.025) * 255).toString(16).padStart(2, '0')}`,
                  pointerEvents: 'none',
                }}
              />
            )
          })}
        </div>

        {/* Frequency dial area */}
        <div
          style={{
            position: 'relative',
            width: '100%',
            height: 'clamp(50px, 12vw, 80px)',
            background: 'rgba(0,0,0,0.2)',
            borderRadius: 'clamp(6px, 1.2vw, 10px)',
            marginBottom: 'clamp(12px, 2.5vw, 20px)',
            overflow: 'hidden',
            boxShadow: `inset 0 0 ${20 * dialGlow * glowPulse}px ${glowColor}15`,
          }}
        >
          {/* Dial warm backlight */}
          <div
            style={{
              position: 'absolute',
              inset: 0,
              background: `linear-gradient(90deg, transparent 10%, ${glowColor}${Math.round(dialGlow * 6).toString(16).padStart(2, '0')} 50%, transparent 90%)`,
              pointerEvents: 'none',
            }}
          />
          {/* Frequency markings */}
          {Array.from({ length: 9 }, (_, i) => {
            const x = 10 + i * 10
            return (
              <div
                key={`mark-${i}`}
                style={{
                  position: 'absolute',
                  left: `${x}%`,
                  bottom: '15%',
                  fontSize: 'clamp(7px, 1.2vw, 10px)',
                  color: `${textColor}60`,
                  transform: 'translateX(-50%)',
                  fontFamily: "'Courier New', monospace",
                }}
              >
                {(530 + i * 20) * 2}
              </div>
            )
          })}
          {/* Station name center */}
          <div
            style={{
              position: 'absolute',
              top: '20%',
              left: '50%',
              transform: 'translateX(-50%)',
              fontSize: 'clamp(10px, 1.8vw, 14px)',
              fontWeight: 700,
              color: textColor,
              letterSpacing: '0.2em',
              opacity: stationProgress,
              textShadow: `0 0 4px ${glowColor}40`,
            }}
          >
            {stationName}
          </div>
          {/* Needle indicator */}
          <div
            style={{
              position: 'absolute',
              left: `${dialNeedleX}%`,
              top: '10%',
              bottom: '10%',
              width: 2,
              background: dialColor,
              boxShadow: `0 0 4px ${dialColor}`,
              transform: 'translateX(-50%)',
            }}
          />
        </div>

        {/* Frequency display */}
        <div
          style={{
            textAlign: 'center',
            fontSize: 'clamp(22px, 5vw, 38px)',
            fontWeight: 900,
            color: textColor,
            letterSpacing: 4,
            opacity: freqProgress,
            marginBottom: 'clamp(6px, 1.2vw, 10px)',
            fontFamily: "'Courier New', monospace",
            textShadow: `0 0 8px ${glowColor}30`,
          }}
        >
          {frequency} MHz
        </div>

        {/* Now playing info */}
        <div style={{ textAlign: 'center' }}>
          <div
            style={{
              fontSize: 'clamp(14px, 3vw, 22px)',
              fontWeight: 700,
              fontStyle: 'italic',
              color: textColor,
              opacity: nowProgress,
              marginBottom: 'clamp(2px, 0.5vw, 4px)',
            }}
          >
            {nowPlaying}
          </div>
          <div
            style={{
              fontSize: 'clamp(11px, 2vw, 15px)',
              color: `${textColor}AA`,
              opacity: artistProgress,
            }}
          >
            {artist}
          </div>
        </div>

        {/* Control knobs row */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'center',
            gap: 'clamp(16px, 3.5vw, 30px)',
            marginTop: 'clamp(14px, 3vw, 22px)',
          }}
        >
          {['VOL', 'TONE', 'TUNE'].map((knobLabel, i) => (
            <div key={knobLabel} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
              <div
                style={{
                  width: 'clamp(22px, 4vw, 34px)',
                  height: 'clamp(22px, 4vw, 34px)',
                  borderRadius: '50%',
                  background: `radial-gradient(circle at 35% 35%, #8B7355, #4E342E)`,
                  border: '2px solid #3E2723',
                  boxShadow: '0 2px 6px rgba(0,0,0,0.3), inset 0 1px 2px rgba(255,255,255,0.1)',
                }}
              />
              <div
                style={{
                  fontSize: 'clamp(7px, 1.2vw, 9px)',
                  color: `${textColor}60`,
                  letterSpacing: 1,
                  fontFamily: "'Courier New', monospace",
                }}
              >
                {knobLabel}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

registerMotionGraphic({
  id: 'tpl-scene-old-radio',
  title: 'Scene Old Radio',
  description: 'Vintage radio tuner with wood cabinet, speaker grille, frequency dial sweep, warm backlight glow, control knobs, and sound wave animation',
  tags: ['scene', 'vintage', 'radio', 'retro', 'tuner', 'analog', 'frequency', 'music'],
  category: 'scene-layout',
  component: SceneOldRadioComponent as unknown as React.ComponentType<MotionGraphicProps>,
  defaultConfig: {
    stationName: 'GOLDEN HOUR FM',
    frequency: '98.7',
    nowPlaying: 'Dream a Little Dream',
    artist: 'Ella Fitzgerald',
    bgColor: '#1A0F05',
    radioColor: '#4E342E',
    textColor: '#E8D5B7',
    dialColor: '#FF6B35',
    glowColor: '#D4A574',
  },
  configSchema: [
    { key: 'stationName', label: 'Station Name', type: 'text', defaultValue: 'GOLDEN HOUR FM', group: 'Content' },
    { key: 'frequency', label: 'Frequency', type: 'text', defaultValue: '98.7', group: 'Content' },
    { key: 'nowPlaying', label: 'Now Playing', type: 'text', defaultValue: 'Dream a Little Dream', group: 'Content' },
    { key: 'artist', label: 'Artist', type: 'text', defaultValue: 'Ella Fitzgerald', group: 'Content' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#1A0F05', group: 'Style' },
    { key: 'radioColor', label: 'Radio Color', type: 'color', defaultValue: '#4E342E', group: 'Style' },
    { key: 'textColor', label: 'Text Color', type: 'color', defaultValue: '#E8D5B7', group: 'Style' },
    { key: 'dialColor', label: 'Dial Color', type: 'color', defaultValue: '#FF6B35', group: 'Style' },
    { key: 'glowColor', label: 'Glow Color', type: 'color', defaultValue: '#D4A574', group: 'Style' },
  ],
})
