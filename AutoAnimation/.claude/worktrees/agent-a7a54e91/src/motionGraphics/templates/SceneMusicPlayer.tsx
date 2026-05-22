import React from 'react'
import { registerMotionGraphic } from '../registry'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface MusicPlayerConfig {
  songTitle: string
  artistName: string
  bgColor: string
  playerColor: string
  accentColor: string
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

function SceneMusicPlayerComponent({
  config,
  frame,
  durationInFrames,
}: MotionGraphicProps<MusicPlayerConfig>) {
  const { songTitle, artistName, bgColor, playerColor, accentColor, textColor } = config
  const progress = frame / durationInFrames

  const enterEnd = 0.25
  const holdEnd = 0.8
  const enterProgress = Math.min(1, progress / enterEnd)
  const holdProgress =
    progress >= enterEnd && progress < holdEnd
      ? (progress - enterEnd) / (holdEnd - enterEnd)
      : progress >= holdEnd
        ? 1
        : 0
  const exitProgress = progress >= holdEnd ? (progress - holdEnd) / (1 - holdEnd) : 0

  // Phone slides up from bottom
  const phoneEased = easeOutBack(Math.min(1, enterProgress / 0.6))
  const phoneY = (1 - phoneEased) * 300
  const phoneOpacity = easeOutCubic(Math.min(1, enterProgress / 0.3))

  // Album art fades in
  const artOpacity = easeOutCubic(Math.max(0, Math.min(1, (enterProgress - 0.2) / 0.3)))
  const artScale = 0.8 + 0.2 * artOpacity

  // Song info staggers
  const titleOp = easeOutCubic(Math.max(0, Math.min(1, (enterProgress - 0.35) / 0.25)))
  const artistOp = easeOutCubic(Math.max(0, Math.min(1, (enterProgress - 0.45) / 0.25)))

  // Controls fade
  const controlsOp = easeOutCubic(Math.max(0, Math.min(1, (enterProgress - 0.55) / 0.25)))

  // Progress bar during hold
  const timelineProgress = holdProgress * 100

  // Album art subtle rotation during hold
  const artRotation = Math.sin(holdProgress * Math.PI * 3) * 2

  // Exit: phone slides down
  const exitEased = easeInCubic(exitProgress)
  const exitY = exitEased * 300
  const exitOpacity = 1 - exitEased

  // Phone dimensions
  const phoneW = 'clamp(240px, 50vw, 340px)'
  const phoneH = 'clamp(440px, 85vw, 620px)'

  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        overflow: 'hidden',
        background: bgColor,
        fontFamily: "'-apple-system', 'SF Pro Display', 'Helvetica Neue', sans-serif",
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      {/* Background blur effect from album */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: `radial-gradient(circle at 50% 40%, ${accentColor}12 0%, transparent 60%)`,
        }}
      />

      {/* Phone frame */}
      <div
        style={{
          position: 'relative',
          width: phoneW,
          height: phoneH,
          background: '#000',
          borderRadius: 'clamp(32px, 6vw, 48px)',
          transform: `translateY(${phoneY + exitY}px)`,
          opacity: phoneOpacity * exitOpacity,
          boxShadow: '0 20px 60px rgba(0,0,0,0.5), inset 0 0 0 2px #333',
          overflow: 'hidden',
        }}
      >
        {/* Screen content */}
        <div
          style={{
            position: 'absolute',
            inset: 'clamp(4px, 0.8vw, 6px)',
            borderRadius: 'clamp(28px, 5.5vw, 44px)',
            background: playerColor,
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            padding: 'clamp(24px, 5vw, 40px) clamp(16px, 3vw, 28px)',
          }}
        >
          {/* Status bar */}
          <div
            style={{
              width: '100%',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: 'clamp(12px, 2.5vw, 20px)',
              opacity: controlsOp * 0.5,
            }}
          >
            <div
              style={{
                fontSize: 'clamp(10px, 1.8vw, 13px)',
                color: textColor,
                fontWeight: 600,
              }}
            >
              9:41
            </div>
            <div style={{ display: 'flex', gap: 4 }}>
              <div
                style={{
                  width: 'clamp(14px, 2.5vw, 18px)',
                  height: 'clamp(8px, 1.5vw, 10px)',
                  borderRadius: 2,
                  border: `1px solid ${textColor}50`,
                }}
              />
            </div>
          </div>

          {/* Chevron down */}
          <div
            style={{
              fontSize: 'clamp(16px, 3vw, 22px)',
              color: `${textColor}60`,
              marginBottom: 'clamp(8px, 1.5vw, 14px)',
              opacity: controlsOp,
            }}
          >
            {'\u2304'}
          </div>

          {/* Album art */}
          <div
            style={{
              width: '78%',
              paddingBottom: '78%',
              position: 'relative',
              borderRadius: 'clamp(10px, 2vw, 16px)',
              overflow: 'hidden',
              marginBottom: 'clamp(20px, 4vw, 32px)',
              opacity: artOpacity,
              transform: `scale(${artScale}) rotate(${artRotation}deg)`,
              boxShadow: `0 8px 30px rgba(0,0,0,0.3)`,
            }}
          >
            <div
              style={{
                position: 'absolute',
                inset: 0,
                background: `linear-gradient(135deg, ${accentColor} 0%, ${accentColor}66 50%, ${accentColor}33 100%)`,
              }}
            />
            <div
              style={{
                position: 'absolute',
                inset: 0,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 'clamp(40px, 8vw, 64px)',
                opacity: 0.25,
                color: '#fff',
              }}
            >
              {'\u266B'}
            </div>
          </div>

          {/* Song info */}
          <div style={{ width: '100%', marginBottom: 'clamp(14px, 3vw, 24px)' }}>
            <div
              style={{
                fontSize: 'clamp(16px, 3.2vw, 22px)',
                fontWeight: 700,
                color: textColor,
                opacity: titleOp,
                marginBottom: 4,
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}
            >
              {songTitle}
            </div>
            <div
              style={{
                fontSize: 'clamp(12px, 2.2vw, 16px)',
                fontWeight: 400,
                color: `${textColor}80`,
                opacity: artistOp,
              }}
            >
              {artistName}
            </div>
          </div>

          {/* Timeline slider */}
          <div
            style={{
              width: '100%',
              marginBottom: 'clamp(6px, 1.2vw, 10px)',
              opacity: controlsOp,
            }}
          >
            <div
              style={{
                width: '100%',
                height: 'clamp(3px, 0.5vw, 4px)',
                background: `${textColor}20`,
                borderRadius: 2,
                overflow: 'hidden',
              }}
            >
              <div
                style={{
                  width: `${timelineProgress}%`,
                  height: '100%',
                  background: textColor,
                  borderRadius: 2,
                  position: 'relative',
                }}
              >
                {/* Scrubber knob */}
                <div
                  style={{
                    position: 'absolute',
                    right: -5,
                    top: -3,
                    width: 10,
                    height: 10,
                    borderRadius: '50%',
                    background: textColor,
                  }}
                />
              </div>
            </div>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                marginTop: 4,
                fontSize: 'clamp(9px, 1.5vw, 11px)',
                color: `${textColor}50`,
              }}
            >
              <span>
                {Math.floor(holdProgress * 3)}:
                {String(Math.floor((holdProgress * 180) % 60)).padStart(2, '0')}
              </span>
              <span>-{Math.floor((1 - holdProgress) * 3)}:
                {String(Math.floor(((1 - holdProgress) * 180) % 60)).padStart(2, '0')}
              </span>
            </div>
          </div>

          {/* Playback controls */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 'clamp(24px, 6vw, 44px)',
              opacity: controlsOp,
              marginTop: 'clamp(8px, 1.5vw, 14px)',
            }}
          >
            {/* Shuffle */}
            <div style={{ fontSize: 'clamp(14px, 2.5vw, 18px)', color: `${textColor}60` }}>
              {'\u21C6'}
            </div>
            {/* Previous */}
            <div style={{ fontSize: 'clamp(20px, 4vw, 28px)', color: textColor }}>
              {'\u23EE'}
            </div>
            {/* Play/Pause */}
            <div
              style={{
                width: 'clamp(52px, 10vw, 64px)',
                height: 'clamp(52px, 10vw, 64px)',
                borderRadius: '50%',
                background: textColor,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <div style={{ display: 'flex', gap: 'clamp(3px, 0.6vw, 5px)' }}>
                <div
                  style={{
                    width: 'clamp(4px, 0.8vw, 6px)',
                    height: 'clamp(18px, 3.5vw, 24px)',
                    background: playerColor,
                    borderRadius: 2,
                  }}
                />
                <div
                  style={{
                    width: 'clamp(4px, 0.8vw, 6px)',
                    height: 'clamp(18px, 3.5vw, 24px)',
                    background: playerColor,
                    borderRadius: 2,
                  }}
                />
              </div>
            </div>
            {/* Next */}
            <div style={{ fontSize: 'clamp(20px, 4vw, 28px)', color: textColor }}>
              {'\u23ED'}
            </div>
            {/* Repeat */}
            <div style={{ fontSize: 'clamp(14px, 2.5vw, 18px)', color: `${textColor}60` }}>
              {'\u21BB'}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

registerMotionGraphic({
  id: 'tpl-scene-music-player',
  title: 'Scene Music Player',
  description:
    'Phone music player UI with album art, song info, playback controls, and timeline slider. Modern minimal player design.',
  tags: ['scene', 'music', 'player', 'phone', 'ui', 'album', 'modern', 'minimal'],
  category: 'scene-layout',
  component: SceneMusicPlayerComponent as unknown as React.ComponentType<MotionGraphicProps>,
  defaultConfig: {
    songTitle: 'Electric Dreams',
    artistName: 'Synthwave Collective',
    bgColor: '#0A0A0A',
    playerColor: '#1C1C2E',
    accentColor: '#FF6B6B',
    textColor: '#FFFFFF',
  },
  configSchema: [
    { key: 'songTitle', label: 'Song Title', type: 'text', defaultValue: 'Electric Dreams', group: 'Content' },
    { key: 'artistName', label: 'Artist Name', type: 'text', defaultValue: 'Synthwave Collective', group: 'Content' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#0A0A0A', group: 'Style' },
    { key: 'playerColor', label: 'Player Color', type: 'color', defaultValue: '#1C1C2E', group: 'Style' },
    { key: 'accentColor', label: 'Accent Color', type: 'color', defaultValue: '#FF6B6B', group: 'Style' },
    { key: 'textColor', label: 'Text Color', type: 'color', defaultValue: '#FFFFFF', group: 'Style' },
  ],
})
