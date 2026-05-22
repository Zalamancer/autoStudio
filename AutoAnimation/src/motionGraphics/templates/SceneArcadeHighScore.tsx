import React from 'react'
import { registerMotionGraphic } from '../registry'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface ArcadeHighScoreConfig {
  title: string
  entries: string[]
  scores: string[]
  bgColor: string
  textColor: string
  highlightColor: string
  accentColor: string
}

function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3)
}

function SceneArcadeHighScoreComponent({ config, frame, fps, durationInFrames, progress }: MotionGraphicProps<ArcadeHighScoreConfig>) {
  const { title, entries, scores, bgColor, textColor, highlightColor, accentColor } = config
  const time = frame / fps

  const enterProgress = progress < 0.15 ? progress / 0.15 : 1
  const exitProgress = progress > 0.85 ? (progress - 0.85) / 0.15 : 0
  const mainOpacity = enterProgress * (1 - exitProgress)

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
      {/* CRT scan lines */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.15) 2px, rgba(0,0,0,0.15) 4px)',
          pointerEvents: 'none',
          zIndex: 10,
        }}
      />
      {/* Pixel border */}
      <div
        style={{
          position: 'absolute',
          inset: 8,
          border: `3px solid ${accentColor}40`,
          pointerEvents: 'none',
        }}
      />
      {/* Corner decorations */}
      {[0, 1, 2, 3].map((c) => (
        <div
          key={c}
          style={{
            position: 'absolute',
            [c < 2 ? 'top' : 'bottom']: 12,
            [c % 2 === 0 ? 'left' : 'right']: 12,
            width: 8,
            height: 8,
            background: accentColor,
            opacity: Math.floor(time * 4 + c) % 2 === 0 ? 0.6 : 0.2,
            imageRendering: 'pixelated' as any,
          }}
        />
      ))}

      {/* Title */}
      <div
        style={{
          fontSize: 'clamp(20px, 5vw, 48px)',
          fontWeight: 700,
          color: highlightColor,
          textTransform: 'uppercase',
          letterSpacing: 6,
          marginBottom: 'clamp(8px, 2vw, 24px)',
          textShadow: `0 0 10px ${highlightColor}80`,
          transform: `translateY(${(1 - easeOutCubic(enterProgress)) * -30}px)`,
          WebkitFontSmoothing: 'none' as any,
        }}
      >
        {title}
      </div>

      {/* Divider line */}
      <div
        style={{
          width: 'clamp(200px, 60vw, 500px)',
          height: 2,
          background: `${accentColor}60`,
          marginBottom: 'clamp(6px, 1.5vw, 16px)',
        }}
      />

      {/* Score entries */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'clamp(4px, 1vw, 10px)', width: 'clamp(200px, 60vw, 500px)' }}>
        {entries.map((name, i) => {
          const entryDelay = 0.15 + i * 0.08
          const entryVisible = progress > entryDelay
          const entryProgress = entryVisible ? Math.min(1, (progress - entryDelay) / 0.1) : 0
          const isHighlight = i === 0
          const blink = isHighlight && Math.floor(time * 3) % 2 === 0

          return (
            <div
              key={i}
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: 'clamp(4px, 0.8vw, 10px) clamp(6px, 1.2vw, 14px)',
                background: isHighlight ? `${highlightColor}15` : 'transparent',
                border: isHighlight ? `1px solid ${highlightColor}40` : '1px solid transparent',
                opacity: easeOutCubic(entryProgress),
                transform: `translateX(${(1 - easeOutCubic(entryProgress)) * 40}px)`,
              }}
            >
              {/* Rank */}
              <div
                style={{
                  fontSize: 'clamp(12px, 2.5vw, 24px)',
                  fontWeight: 700,
                  color: isHighlight ? highlightColor : accentColor,
                  minWidth: 'clamp(24px, 4vw, 40px)',
                  opacity: blink ? 1 : isHighlight ? 0.7 : 1,
                }}
              >
                {`${i + 1}.`}
              </div>
              {/* Name */}
              <div
                style={{
                  fontSize: 'clamp(14px, 3vw, 28px)',
                  fontWeight: 700,
                  color: isHighlight && blink ? highlightColor : textColor,
                  textTransform: 'uppercase',
                  letterSpacing: 3,
                  flex: 1,
                  textShadow: isHighlight ? `0 0 8px ${highlightColor}60` : 'none',
                }}
              >
                {name}
              </div>
              {/* Score with counting animation */}
              <div
                style={{
                  fontSize: 'clamp(14px, 3vw, 28px)',
                  fontWeight: 700,
                  color: isHighlight && blink ? highlightColor : accentColor,
                  letterSpacing: 2,
                  textShadow: isHighlight ? `0 0 8px ${accentColor}60` : 'none',
                }}
              >
                {entryProgress < 1
                  ? String(Math.floor(parseInt(scores[i] || '0') * entryProgress)).padStart(6, '0')
                  : (scores[i] || '000000').padStart(6, '0')}
              </div>
            </div>
          )
        })}
      </div>

      {/* Bottom credit text */}
      <div
        style={{
          position: 'absolute',
          bottom: '6%',
          fontSize: 'clamp(10px, 1.8vw, 16px)',
          color: textColor,
          opacity: Math.floor(time * 2) % 3 === 0 ? 0.3 : 0.6,
          letterSpacing: 4,
          textTransform: 'uppercase',
        }}
      >
        {'CREDIT 00'}
      </div>

      {/* Vignette */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: 'radial-gradient(ellipse at center, transparent 50%, rgba(0,0,0,0.5) 100%)',
          pointerEvents: 'none',
          zIndex: 5,
        }}
      />
    </div>
  )
}

registerMotionGraphic({
  id: 'tpl-scene-arcade-high-score',
  title: 'Scene Arcade High Score',
  description: 'Retro arcade high score table with blinking top entry, score counting animation, CRT scan lines, and pixel border',
  tags: ['scene', 'arcade', 'high-score', 'retro', 'gaming', 'leaderboard', 'pixel'],
  category: 'scene-layout',
  component: SceneArcadeHighScoreComponent as unknown as React.ComponentType<MotionGraphicProps>,
  defaultConfig: {
    title: 'HIGH SCORES',
    entries: ['ACE', 'BOB', 'CAT', 'DAN', 'EVE'],
    scores: ['999900', '875000', '742500', '618200', '505000'],
    bgColor: '#0a0a1a',
    textColor: '#CCCCCC',
    highlightColor: '#FFD700',
    accentColor: '#00FF00',
  },
  configSchema: [
    { key: 'title', label: 'Title', type: 'text', defaultValue: 'HIGH SCORES', group: 'Content' },
    { key: 'entries', label: 'Names', type: 'text-array', defaultValue: ['ACE', 'BOB', 'CAT', 'DAN', 'EVE'], group: 'Content' },
    { key: 'scores', label: 'Scores', type: 'text-array', defaultValue: ['999900', '875000', '742500', '618200', '505000'], group: 'Content' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#0a0a1a', group: 'Style' },
    { key: 'textColor', label: 'Text Color', type: 'color', defaultValue: '#CCCCCC', group: 'Style' },
    { key: 'highlightColor', label: 'Highlight', type: 'color', defaultValue: '#FFD700', group: 'Style' },
    { key: 'accentColor', label: 'Accent', type: 'color', defaultValue: '#00FF00', group: 'Style' },
  ],
})
