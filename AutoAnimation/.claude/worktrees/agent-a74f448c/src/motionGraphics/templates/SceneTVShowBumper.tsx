import React from 'react'
import { registerMotionGraphic } from '../registry'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface TVShowBumperConfig {
  bumperLabel: string
  showTitle: string
  episodeInfo: string
  bgColor: string
  textColor: string
  accentColor: string
  gradientColor: string
}

function easeOutCubic(t: number): number { return 1 - Math.pow(1 - t, 3) }
function easeInCubic(t: number): number { return t * t * t }
function easeOutQuart(t: number): number { return 1 - Math.pow(1 - t, 4) }

function SceneTVShowBumperComponent({
  config,
  progress,
}: MotionGraphicProps<TVShowBumperConfig>) {
  const { bumperLabel, showTitle, episodeInfo, bgColor, textColor, accentColor, gradientColor } = config

  const enterEnd = 0.28
  const holdEnd = 0.78
  const enterProgress = Math.min(1, progress / enterEnd)
  const holdProgress = progress >= enterEnd && progress < holdEnd
    ? (progress - enterEnd) / (holdEnd - enterEnd) : progress >= holdEnd ? 1 : 0
  const exitProgress = progress >= holdEnd ? (progress - holdEnd) / (1 - holdEnd) : 0

  // Wipe reveal mask — text is revealed from left to right
  const wipeEnter = easeOutQuart(Math.min(1, enterProgress / 0.6))
  const wipeWidth = wipeEnter * 110 // slightly over 100 to cover rounding

  // Bumper label wipes in first
  const labelDelay = 0.0
  const labelEnter = Math.max(0, Math.min(1, (enterProgress - labelDelay) / 0.5))
  const labelWipe = easeOutQuart(labelEnter) * 110
  const labelOpacity = easeOutCubic(Math.min(1, labelEnter / 0.5))

  // Show title wipes in next
  const titleDelay = 0.2
  const titleEnter = Math.max(0, Math.min(1, (enterProgress - titleDelay) / 0.6))
  const titleWipe = easeOutQuart(titleEnter) * 110
  const titleOpacity = easeOutCubic(Math.min(1, titleEnter / 0.4))

  // Episode info wipes in last
  const epDelay = 0.45
  const epEnter = Math.max(0, Math.min(1, (enterProgress - epDelay) / 0.5))
  const epWipe = easeOutQuart(epEnter) * 110
  const epOpacity = easeOutCubic(Math.min(1, epEnter / 0.4))

  // Accent line
  const lineDelay = 0.15
  const lineEnter = Math.max(0, Math.min(1, (enterProgress - lineDelay) / 0.5))
  const lineWidth = easeOutQuart(lineEnter) * 100

  // Hold: gradient shift
  const gradientAngle = 135 + holdProgress * 20

  // Exit: wipes out to the right
  const exitEased = easeInCubic(exitProgress)
  const exitWipeX = exitEased * 110

  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        overflow: 'hidden',
        background: `linear-gradient(${gradientAngle}deg, ${bgColor}, ${gradientColor})`,
        fontFamily: "'Inter', 'Helvetica Neue', sans-serif",
      }}
    >
      {/* Decorative gradient overlay */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: `radial-gradient(ellipse at 30% 50%, ${accentColor}15 0%, transparent 60%)`,
        }}
      />

      {/* Content */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'flex-start',
          justifyContent: 'center',
          padding: '10% 8%',
          gap: 'clamp(8px, 1.5vw, 16px)',
          transform: `translateX(${exitWipeX}%)`,
        }}
      >
        {/* Bumper label — "Coming Up Next" / "Previously On" */}
        <div
          style={{
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              fontSize: 'clamp(11px, 1.8vw, 18px)',
              fontWeight: 600,
              color: accentColor,
              letterSpacing: '0.2em',
              textTransform: 'uppercase',
              opacity: labelOpacity,
              clipPath: `inset(0 ${110 - labelWipe}% 0 0)`,
            }}
          >
            {bumperLabel}
          </div>
        </div>

        {/* Accent line */}
        <div
          style={{
            width: `${lineWidth}%`,
            maxWidth: 80,
            height: 3,
            background: accentColor,
            borderRadius: 2,
          }}
        />

        {/* Show title — large and dramatic */}
        <div
          style={{
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              fontSize: 'clamp(28px, 7vw, 64px)',
              fontWeight: 900,
              color: textColor,
              lineHeight: 1.05,
              letterSpacing: '0.02em',
              opacity: titleOpacity,
              clipPath: `inset(0 ${110 - titleWipe}% 0 0)`,
            }}
          >
            {showTitle}
          </div>
        </div>

        {/* Episode info */}
        <div
          style={{
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              fontSize: 'clamp(12px, 2vw, 20px)',
              fontWeight: 400,
              color: `${textColor}bb`,
              letterSpacing: '0.06em',
              opacity: epOpacity,
              clipPath: `inset(0 ${110 - epWipe}% 0 0)`,
            }}
          >
            {episodeInfo}
          </div>
        </div>
      </div>

      {/* Decorative vertical line on left */}
      <div
        style={{
          position: 'absolute',
          left: '5%',
          top: '20%',
          bottom: '20%',
          width: 2,
          background: `linear-gradient(180deg, transparent, ${accentColor}44, transparent)`,
          opacity: easeOutCubic(Math.min(1, enterProgress / 0.5)),
        }}
      />
    </div>
  )
}

registerMotionGraphic({
  id: 'tpl-scene-tv-show-bumper',
  title: 'TV Show Bumper',
  description: 'TV-style "Coming Up Next" or "Previously On" bumper with dramatic wipe-in text reveal, gradient background, and accent decorations',
  tags: ['scene', 'tv', 'bumper', 'show', 'episode', 'broadcast', 'media', 'dramatic'],
  category: 'scene-layout',
  component: SceneTVShowBumperComponent as any,
  defaultConfig: {
    bumperLabel: 'COMING UP NEXT',
    showTitle: 'DARK HORIZONS',
    episodeInfo: 'Season 3 \u2022 Episode 7 \u2022 "The Reckoning"',
    bgColor: '#0a0a1a',
    textColor: '#FFFFFF',
    accentColor: '#E50914',
    gradientColor: '#1a0a2e',
  },
  configSchema: [
    { key: 'bumperLabel', label: 'Bumper Label', type: 'text', defaultValue: 'COMING UP NEXT', group: 'Content' },
    { key: 'showTitle', label: 'Show Title', type: 'text', defaultValue: 'DARK HORIZONS', group: 'Content' },
    { key: 'episodeInfo', label: 'Episode Info', type: 'text', defaultValue: 'Season 3 \u2022 Episode 7 \u2022 "The Reckoning"', group: 'Content' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#0a0a1a', group: 'Style' },
    { key: 'textColor', label: 'Text Color', type: 'color', defaultValue: '#FFFFFF', group: 'Style' },
    { key: 'accentColor', label: 'Accent Color', type: 'color', defaultValue: '#E50914', group: 'Style' },
    { key: 'gradientColor', label: 'Gradient Color', type: 'color', defaultValue: '#1a0a2e', group: 'Style' },
  ],
})
