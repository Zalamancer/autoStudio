import { registerMotionGraphic } from '../registry'
import {
  KineticBase,
  type KineticBaseConfig,
  type KineticAnimation,
  type WordRenderProps,
  type BackgroundRenderProps,
} from '../KineticBase'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface AchievementPopConfig extends KineticBaseConfig {
  gamerscore: number
}

const animation: KineticAnimation = {
  renderBackground: ({ bgColor }: BackgroundRenderProps) => (
    <div style={{ position: 'absolute', inset: 0, background: bgColor }} />
  ),

  renderWord: ({ word, color, enterProgress, holdProgress, exitProgress, phase, index, width, height, frame }: WordRenderProps) => {
    const f = frame ?? 0

    // Achievement popup banner dimensions
    const bannerWidth = width * 0.7
    const bannerHeight = 90
    const bannerX = (width - bannerWidth) / 2

    // Slide animation — slides in from top, holds, slides out
    let bannerY = -bannerHeight - 20
    let opacity = 0
    let progressBarWidth = 0

    if (phase === 'enter') {
      // Elastic slide down from top
      const t = enterProgress
      const eased = t < 0.6
        ? (t / 0.6) * (t / 0.6) * (3 - 2 * (t / 0.6))
        : 1 + Math.sin((t - 0.6) * Math.PI * 2.5) * 0.04 * (1 - t)
      bannerY = -bannerHeight - 20 + eased * (40 + bannerHeight)
      opacity = Math.min(1, t * 3)
      progressBarWidth = Math.min(1, t * 1.5)
    } else if (phase === 'hold') {
      bannerY = 20
      opacity = 1
      progressBarWidth = 1
    } else {
      // Slide back up
      const t = exitProgress
      bannerY = 20 - t * (bannerHeight + 40)
      opacity = 1 - t
      progressBarWidth = 1
    }

    // Achievement title from word
    const achievementTitle = word

    // "Achievement Unlocked" flash
    const showFlash = phase === 'enter' && enterProgress > 0.5 && enterProgress < 0.7

    return (
      <div style={{ position: 'absolute', inset: 0, opacity }}>
        {/* Sound-implied flash overlay */}
        {showFlash && (
          <div
            style={{
              position: 'absolute',
              inset: 0,
              background: 'radial-gradient(ellipse at 50% 10%, rgba(255,255,255,0.08) 0%, transparent 50%)',
            }}
          />
        )}

        {/* Achievement banner */}
        <div
          style={{
            position: 'absolute',
            left: bannerX,
            top: bannerY,
            width: bannerWidth,
            height: bannerHeight,
            background: 'linear-gradient(180deg, #1a1a1a 0%, #2a2a2a 50%, #1a1a1a 100%)',
            borderRadius: 8,
            border: '2px solid #4a4a4a',
            boxShadow: '0 4px 20px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.08)',
            display: 'flex',
            alignItems: 'center',
            overflow: 'hidden',
          }}
        >
          {/* Left icon area — trophy/achievement emblem */}
          <div
            style={{
              width: 70,
              height: '100%',
              background: 'linear-gradient(180deg, #3a3a3a 0%, #2a2a2a 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              borderRight: '1px solid #4a4a4a',
              flexShrink: 0,
            }}
          >
            {/* Trophy icon made of shapes */}
            <div style={{ position: 'relative', width: 36, height: 36 }}>
              <div
                style={{
                  position: 'absolute',
                  top: 2,
                  left: 6,
                  width: 24,
                  height: 20,
                  borderRadius: '0 0 12px 12px',
                  background: 'linear-gradient(180deg, #FFD700 0%, #DAA520 100%)',
                  boxShadow: '0 0 10px rgba(255,215,0,0.4)',
                }}
              />
              <div
                style={{
                  position: 'absolute',
                  top: 6,
                  left: 1,
                  width: 8,
                  height: 12,
                  borderRadius: '8px 0 0 8px',
                  border: '2px solid #DAA520',
                  borderRight: 'none',
                }}
              />
              <div
                style={{
                  position: 'absolute',
                  top: 6,
                  right: 1,
                  width: 8,
                  height: 12,
                  borderRadius: '0 8px 8px 0',
                  border: '2px solid #DAA520',
                  borderLeft: 'none',
                }}
              />
              <div
                style={{
                  position: 'absolute',
                  bottom: 2,
                  left: '50%',
                  transform: 'translateX(-50%)',
                  width: 16,
                  height: 4,
                  background: '#DAA520',
                  borderRadius: 2,
                }}
              />
            </div>
          </div>

          {/* Text content area */}
          <div
            style={{
              flex: 1,
              padding: '8px 14px',
              overflow: 'hidden',
            }}
          >
            {/* Achievement Unlocked header */}
            <div
              style={{
                fontFamily: "'Segoe UI', 'Helvetica Neue', sans-serif",
                fontSize: 'clamp(9px, 2vw, 13px)',
                fontWeight: 400,
                color: '#888888',
                textTransform: 'uppercase',
                letterSpacing: 2,
                marginBottom: 4,
              }}
            >
              Achievement Unlocked
            </div>

            {/* Achievement title */}
            <div
              style={{
                fontFamily: "'Segoe UI', 'Helvetica Neue', sans-serif",
                fontSize: 'clamp(14px, 4vw, 24px)',
                fontWeight: 600,
                color,
                letterSpacing: 0.5,
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}
            >
              {achievementTitle}
            </div>

            {/* Gamerscore / points */}
            <div
              style={{
                fontFamily: "'Segoe UI', sans-serif",
                fontSize: 'clamp(9px, 2vw, 12px)',
                color: '#aaaaaa',
                marginTop: 2,
              }}
            >
              +50G
            </div>
          </div>

          {/* Right shimmer sweep */}
          {phase === 'enter' && enterProgress > 0.4 && (
            <div
              style={{
                position: 'absolute',
                top: 0,
                bottom: 0,
                width: 40,
                left: `${(enterProgress - 0.4) * 200}%`,
                background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.1), transparent)',
                transform: 'skewX(-15deg)',
              }}
            />
          )}

          {/* Bottom progress bar */}
          <div
            style={{
              position: 'absolute',
              bottom: 0,
              left: 0,
              right: 0,
              height: 3,
              background: 'rgba(0,0,0,0.3)',
            }}
          >
            <div
              style={{
                width: `${progressBarWidth * 100}%`,
                height: '100%',
                background: 'linear-gradient(90deg, #4a9eff, #00d4ff)',
                transition: 'none',
              }}
            />
          </div>
        </div>

        {/* Notification sound implied — small radial pulse */}
        {showFlash && (
          <div
            style={{
              position: 'absolute',
              left: bannerX + bannerWidth / 2,
              top: bannerY + bannerHeight / 2,
              width: 200,
              height: 200,
              transform: 'translate(-50%, -50%)',
              borderRadius: '50%',
              border: '1px solid rgba(74,158,255,0.2)',
              opacity: 0.5,
            }}
          />
        )}
      </div>
    )
  },
}

function AchievementPopComponent(props: MotionGraphicProps<AchievementPopConfig>) {
  return <KineticBase {...props} animation={animation} />
}

registerMotionGraphic({
  id: 'tpl-kinetic-achievement-pop',
  title: 'Kinetic Achievement Pop',
  description:
    'Xbox/PlayStation-style achievement popup sliding in from top with trophy icon, unlock text, gamerscore, and shimmer sweep',
  tags: ['kinetic', 'typography', 'achievement', 'xbox', 'playstation', 'game', 'unlock', 'trophy', 'notification'],
  category: 'captions',
  component: AchievementPopComponent as any,
  defaultConfig: {
    words: ['First Blood', 'Legendary Loot', 'Speed Demon', 'No Deaths'],
    colors: ['#FFFFFF', '#FFD700', '#00FF88', '#FF6B6B'],
    bgColor: '#0a0a0a',
    cycleDuration: 2.0,
    gamerscore: 50,
  },
  configSchema: [
    {
      key: 'words',
      label: 'Achievement Names',
      type: 'text-array',
      defaultValue: ['First Blood', 'Legendary Loot', 'Speed Demon', 'No Deaths'],
      group: 'Content',
    },
    {
      key: 'colors',
      label: 'Title Colors',
      type: 'text-array',
      defaultValue: ['#FFFFFF', '#FFD700', '#00FF88', '#FF6B6B'],
      group: 'Style',
    },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#0a0a0a', group: 'Style' },
    {
      key: 'cycleDuration',
      label: 'Cycle Duration (s)',
      type: 'number',
      defaultValue: 2.0,
      min: 1,
      max: 6,
      group: 'Timing',
    },
    {
      key: 'gamerscore',
      label: 'Gamerscore',
      type: 'number',
      defaultValue: 50,
      min: 5,
      max: 200,
      group: 'Content',
    },
  ],
})
