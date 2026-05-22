import React from 'react'
import { registerMotionGraphic } from '../registry'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface LoadingScreenConfig {
  gameName: string
  tipText: string
  versionText: string
  bgColor: string
  barColor: string
  textColor: string
  accentColor: string
}

function easeOutCubic(t: number): number { return 1 - Math.pow(1 - t, 3) }
function easeInCubic(t: number): number { return t * t * t }

const TIPS = [
  'Press SPACE to dodge incoming attacks',
  'Save your progress at any checkpoint',
  'Explore hidden areas for bonus items',
  'Upgrade your gear before boss fights',
  'Talk to every NPC for side quests',
]

function SceneLoadingScreenComponent({ config, progress, frame }: MotionGraphicProps<LoadingScreenConfig>) {
  const { gameName, tipText, versionText, bgColor, barColor, textColor, accentColor } = config
  const f = frame ?? 0

  // Phases: fade-in (0-0.08), loading (0.08-0.85), complete (0.85-0.92), transition (0.92-1)
  const enterProgress = progress < 0.08 ? progress / 0.08 : 1
  const loadProgress = progress >= 0.08 && progress < 0.85 ? (progress - 0.08) / 0.77 : progress >= 0.85 ? 1 : 0
  const completeProgress = progress >= 0.85 && progress < 0.92 ? (progress - 0.85) / 0.07 : progress >= 0.92 ? 1 : 0
  const exitProgress = progress >= 0.92 ? (progress - 0.92) / 0.08 : 0

  // Loading percentage with realistic stutter
  const stutterPoints = [0.23, 0.47, 0.68, 0.82]
  let displayPercent = loadProgress * 100
  for (const sp of stutterPoints) {
    if (loadProgress > sp - 0.03 && loadProgress < sp + 0.02) {
      displayPercent = sp * 100 - 1
    }
  }
  displayPercent = Math.min(100, Math.max(0, Math.floor(displayPercent)))

  // Spinner rotation
  const spinAngle = f * 4

  // Tip text cycling
  const allTips = [tipText, ...TIPS]
  const currentTipIndex = Math.floor(loadProgress * allTips.length) % allTips.length
  const currentTip = allTips[currentTipIndex]

  // Fade between tips
  const tipCyclePos = (loadProgress * allTips.length) % 1
  const tipOpacity = tipCyclePos < 0.1 ? tipCyclePos / 0.1 : tipCyclePos > 0.9 ? (1 - tipCyclePos) / 0.1 : 1

  // Complete state
  const isComplete = loadProgress >= 1
  const completeScale = isComplete ? easeOutCubic(completeProgress) : 0

  // Exit flash
  const exitFlash = exitProgress > 0 && exitProgress < 0.3 ? exitProgress / 0.3 : exitProgress >= 0.3 ? 1 - (exitProgress - 0.3) / 0.7 : 0

  // Background decorative elements - floating particles
  const particles = Array.from({ length: 8 }, (_, i) => {
    const seed = i * 73 + 19
    const x = 10 + (seed * 137 % 80)
    const baseY = 10 + (seed * 97 % 80)
    const speed = 0.3 + (seed % 5) * 0.15
    const y = baseY + Math.sin(f * speed * 0.05 + i) * 8
    const size = 2 + (seed % 4)
    const opacity = 0.03 + (seed % 3) * 0.02
    return { x, y, size, opacity }
  })

  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        background: bgColor,
        overflow: 'hidden',
        fontFamily: "'Inter', '-apple-system', sans-serif",
        opacity: enterProgress * (1 - (exitProgress > 0.5 ? (exitProgress - 0.5) / 0.5 : 0)),
      }}
    >
      {/* Subtle gradient overlay */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: `radial-gradient(ellipse at 50% 30%, ${accentColor}08 0%, transparent 60%)`,
          pointerEvents: 'none',
        }}
      />

      {/* Floating background particles */}
      {particles.map((p, i) => (
        <div
          key={i}
          style={{
            position: 'absolute',
            left: `${p.x}%`,
            top: `${p.y}%`,
            width: p.size,
            height: p.size,
            borderRadius: '50%',
            background: accentColor,
            opacity: p.opacity,
          }}
        />
      ))}

      {/* Exit white flash */}
      {exitProgress > 0 && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: '#FFFFFF',
            opacity: exitFlash,
            zIndex: 10,
            pointerEvents: 'none',
          }}
        />
      )}

      {/* Center content */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '8%',
        }}
      >
        {/* Game title / logo area */}
        <div
          style={{
            fontSize: 'clamp(28px, 7vw, 56px)',
            fontWeight: 900,
            color: textColor,
            letterSpacing: 'clamp(2px, 0.8vw, 6px)',
            textTransform: 'uppercase',
            marginBottom: 'clamp(30px, 6vh, 60px)',
            textAlign: 'center',
            opacity: 0.9,
          }}
        >
          {gameName}
        </div>

        {/* Spinner */}
        {!isComplete && (
          <div
            style={{
              width: 'clamp(32px, 6vw, 48px)',
              height: 'clamp(32px, 6vw, 48px)',
              marginBottom: 'clamp(20px, 3vh, 32px)',
              position: 'relative',
            }}
          >
            <div
              style={{
                position: 'absolute',
                inset: 0,
                border: `3px solid ${textColor}12`,
                borderRadius: '50%',
              }}
            />
            <div
              style={{
                position: 'absolute',
                inset: 0,
                border: '3px solid transparent',
                borderTopColor: barColor,
                borderRightColor: barColor,
                borderRadius: '50%',
                transform: `rotate(${spinAngle}deg)`,
              }}
            />
          </div>
        )}

        {/* Complete checkmark */}
        {isComplete && (
          <div
            style={{
              width: 'clamp(36px, 7vw, 52px)',
              height: 'clamp(36px, 7vw, 52px)',
              marginBottom: 'clamp(20px, 3vh, 32px)',
              borderRadius: '50%',
              background: barColor,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transform: `scale(${completeScale})`,
            }}
          >
            <svg viewBox="0 0 24 24" style={{ width: '55%', height: '55%' }}>
              <path
                d="M5 12l5 5L19 7"
                fill="none"
                stroke="#FFFFFF"
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
        )}

        {/* Progress bar */}
        <div
          style={{
            width: 'clamp(220px, 55vw, 400px)',
            marginBottom: 'clamp(12px, 2vh, 20px)',
          }}
        >
          {/* Bar track */}
          <div
            style={{
              width: '100%',
              height: 'clamp(6px, 1.2vw, 10px)',
              background: `${textColor}10`,
              borderRadius: 'clamp(3px, 0.6vw, 5px)',
              overflow: 'hidden',
              position: 'relative',
            }}
          >
            {/* Fill */}
            <div
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                bottom: 0,
                width: `${displayPercent}%`,
                background: isComplete
                  ? barColor
                  : `linear-gradient(90deg, ${barColor}AA, ${barColor})`,
                borderRadius: 'clamp(3px, 0.6vw, 5px)',
                boxShadow: `0 0 8px ${barColor}30`,
              }}
            />
            {/* Shimmer effect on active bar */}
            {!isComplete && displayPercent > 5 && (
              <div
                style={{
                  position: 'absolute',
                  top: 0,
                  bottom: 0,
                  left: `${(f * 0.8) % (displayPercent + 20) - 20}%`,
                  width: '15%',
                  background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.25), transparent)',
                  borderRadius: 'clamp(3px, 0.6vw, 5px)',
                }}
              />
            )}
          </div>

          {/* Percentage text */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              marginTop: 'clamp(4px, 0.8vw, 8px)',
            }}
          >
            <div
              style={{
                fontSize: 'clamp(10px, 1.6vw, 13px)',
                fontWeight: 500,
                color: `${textColor}55`,
              }}
            >
              {isComplete ? 'Ready' : 'Loading assets...'}
            </div>
            <div
              style={{
                fontSize: 'clamp(10px, 1.6vw, 13px)',
                fontWeight: 700,
                color: isComplete ? barColor : textColor,
                fontVariantNumeric: 'tabular-nums',
              }}
            >
              {displayPercent}%
            </div>
          </div>
        </div>

        {/* Tip text */}
        <div
          style={{
            marginTop: 'clamp(20px, 4vh, 40px)',
            maxWidth: 'clamp(260px, 60vw, 440px)',
            textAlign: 'center',
          }}
        >
          <div
            style={{
              fontSize: 'clamp(9px, 1.4vw, 12px)',
              fontWeight: 700,
              color: accentColor,
              textTransform: 'uppercase',
              letterSpacing: '0.12em',
              marginBottom: 'clamp(4px, 0.6vh, 8px)',
            }}
          >
            Tip
          </div>
          <div
            style={{
              fontSize: 'clamp(11px, 2vw, 16px)',
              fontWeight: 400,
              color: `${textColor}77`,
              lineHeight: 1.5,
              opacity: tipOpacity,
            }}
          >
            {currentTip}
          </div>
        </div>
      </div>

      {/* Bottom version text */}
      <div
        style={{
          position: 'absolute',
          bottom: 'clamp(12px, 2.5vh, 24px)',
          left: '50%',
          transform: 'translateX(-50%)',
          fontSize: 'clamp(8px, 1.2vw, 11px)',
          color: `${textColor}30`,
          letterSpacing: '0.06em',
        }}
      >
        {versionText}
      </div>
    </div>
  )
}

registerMotionGraphic({
  id: 'tpl-scene-loading-screen',
  title: 'Scene Loading Screen',
  description: 'Game/app loading screen with animated progress bar, stuttering percentage, spinning loader, cycling tip text, and completion checkmark',
  tags: ['scene', 'loading', 'game', 'app', 'progress', 'internet', 'digital', 'spinner'],
  category: 'scene-layout',
  component: SceneLoadingScreenComponent as unknown as React.ComponentType<MotionGraphicProps>,
  defaultConfig: {
    gameName: 'PROANIMATE',
    tipText: 'Use keyboard shortcuts to speed up your workflow',
    versionText: 'v2.4.1 build 1847',
    bgColor: '#0F1117',
    barColor: '#6C5CE7',
    textColor: '#E2E8F0',
    accentColor: '#A78BFA',
  },
  configSchema: [
    { key: 'gameName', label: 'Title', type: 'text', defaultValue: 'PROANIMATE', group: 'Content' },
    { key: 'tipText', label: 'Tip Text', type: 'text', defaultValue: 'Use keyboard shortcuts to speed up your workflow', group: 'Content' },
    { key: 'versionText', label: 'Version', type: 'text', defaultValue: 'v2.4.1 build 1847', group: 'Content' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#0F1117', group: 'Style' },
    { key: 'barColor', label: 'Bar Color', type: 'color', defaultValue: '#6C5CE7', group: 'Style' },
    { key: 'textColor', label: 'Text Color', type: 'color', defaultValue: '#E2E8F0', group: 'Style' },
    { key: 'accentColor', label: 'Accent Color', type: 'color', defaultValue: '#A78BFA', group: 'Style' },
  ],
})
