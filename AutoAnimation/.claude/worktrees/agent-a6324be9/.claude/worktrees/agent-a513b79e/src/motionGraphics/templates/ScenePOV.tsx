import React from 'react'
import { registerMotionGraphic } from '../registry'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface ScenePOVConfig {
  scenario: string
  bgColor: string
  labelColor: string
  textColor: string
}

function easeOutBack(t: number): number {
  const c1 = 1.70158
  const c3 = c1 + 1
  return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2)
}

function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3)
}

function ScenePOVComponent({ config, progress, frame, fps }: MotionGraphicProps<ScenePOVConfig>) {
  const { scenario, bgColor, labelColor, textColor } = config

  const enterProgress = progress < 0.25 ? progress / 0.25 : 1
  const holdProgress = progress >= 0.25 && progress < 0.8 ? (progress - 0.25) / 0.55 : progress >= 0.8 ? 1 : 0
  const exitProgress = progress >= 0.8 ? (progress - 0.8) / 0.2 : 0

  // POV label slams in from top with overshoot
  const labelEnter = enterProgress < 0.4
    ? easeOutBack(enterProgress / 0.4)
    : 1
  const labelY = (1 - labelEnter) * -100
  const labelScale = 0.5 + labelEnter * 0.5
  const labelOpacity = (enterProgress < 0.4 ? enterProgress / 0.4 : 1)
    * (exitProgress > 0 ? 1 - easeOutCubic(exitProgress) : 1)

  // Scenario text types in character by character
  const typeDelay = 0.35
  const typeProgress = enterProgress < 1
    ? Math.max(0, (enterProgress - typeDelay) / (1 - typeDelay))
    : 1
  const visibleChars = Math.floor(typeProgress * scenario.length)
  const displayText = scenario.slice(0, visibleChars)
  const showCursor = typeProgress < 1 || (holdProgress < 0.1)
  const textOpacity = exitProgress > 0 ? 1 - easeOutCubic(exitProgress) : 1

  // Subtle cursor blink during hold
  const cursorVisible = holdProgress > 0
    ? Math.sin(holdProgress * Math.PI * 10) > 0
    : true

  return (
    <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', background: bgColor }}>
      {/* POV label */}
      <div
        style={{
          position: 'absolute',
          top: '25%',
          left: '50%',
          transform: `translate(-50%, ${labelY}px) scale(${labelScale})`,
          opacity: labelOpacity,
          fontFamily: "'Impact', 'Arial Black', 'Helvetica Neue', sans-serif",
          fontSize: 'clamp(40px, 12vw, 120px)',
          fontWeight: 900,
          color: labelColor,
          letterSpacing: '0.1em',
          textShadow: `0 4px 20px ${labelColor}40`,
          whiteSpace: 'nowrap',
        }}
      >
        POV:
      </div>

      {/* Scenario text */}
      <div
        style={{
          position: 'absolute',
          top: '48%',
          left: '10%',
          right: '10%',
          opacity: textOpacity,
          fontFamily: "'Inter', 'Helvetica Neue', sans-serif",
          fontSize: 'clamp(18px, 4.5vw, 44px)',
          fontWeight: 400,
          color: textColor,
          lineHeight: 1.4,
          textAlign: 'center',
        }}
      >
        {displayText}
        {(showCursor || (holdProgress > 0 && cursorVisible)) && (
          <span
            style={{
              display: 'inline-block',
              width: 'clamp(2px, 0.5vw, 4px)',
              height: '1.1em',
              background: labelColor,
              marginLeft: '2px',
              verticalAlign: 'text-bottom',
              opacity: showCursor ? 1 : (cursorVisible ? 0.8 : 0),
            }}
          />
        )}
      </div>

      {/* Subtle vignette overlay */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: 'radial-gradient(ellipse at center, transparent 50%, rgba(0,0,0,0.4) 100%)',
          pointerEvents: 'none',
        }}
      />
    </div>
  )
}

registerMotionGraphic({
  id: 'tpl-scene-pov',
  title: 'POV',
  description: 'TikTok-native POV format with slamming label, typewriter scenario text, and dark cinematic vignette',
  tags: ['scene', 'meme', 'pov', 'viral', 'tiktok', 'typewriter', 'cinematic'],
  category: 'scene-layout',
  component: ScenePOVComponent as any,
  defaultConfig: {
    scenario: 'You just mass-deleted production database on a Friday at 5pm',
    bgColor: '#0a0a0f',
    labelColor: '#ffffff',
    textColor: '#cccccc',
  },
  configSchema: [
    { key: 'scenario', label: 'Scenario', type: 'text', defaultValue: 'You just mass-deleted production database on a Friday at 5pm', group: 'Content' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#0a0a0f', group: 'Style' },
    { key: 'labelColor', label: 'POV Label Color', type: 'color', defaultValue: '#ffffff', group: 'Style' },
    { key: 'textColor', label: 'Text Color', type: 'color', defaultValue: '#cccccc', group: 'Style' },
  ],
})
