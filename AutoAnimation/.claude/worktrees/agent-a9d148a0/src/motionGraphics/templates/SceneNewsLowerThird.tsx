import React from 'react'
import { registerMotionGraphic } from '../registry'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface NewsLowerThirdConfig {
  name: string
  title: string
  networkBug: string
  primaryColor: string
  secondaryColor: string
  textColor: string
}

function easeOutQuart(t: number): number { return 1 - Math.pow(1 - t, 4) }
function easeOutCubic(t: number): number { return 1 - Math.pow(1 - t, 3) }
function easeInCubic(t: number): number { return t * t * t }

function SceneNewsLowerThirdComponent({
  config,
  progress,
}: MotionGraphicProps<NewsLowerThirdConfig>) {
  const { name, title, networkBug, primaryColor, secondaryColor, textColor } = config

  const enterEnd = 0.18
  const holdEnd = 0.82
  const enterProgress = Math.min(1, progress / enterEnd)
  const exitProgress = progress >= holdEnd ? (progress - holdEnd) / (1 - holdEnd) : 0

  // Primary bar slides in from left (stagger 1)
  const primaryBarEnter = easeOutQuart(Math.min(1, enterProgress / 0.7))
  const primaryBarX = (1 - primaryBarEnter) * -110
  const primaryBarExitX = exitProgress > 0 ? easeInCubic(exitProgress) * 110 : 0

  // Secondary bar slides in from left (stagger 2 — delayed)
  const secondaryDelay = 0.3
  const secondaryEnter = easeOutQuart(Math.max(0, Math.min(1, (enterProgress - secondaryDelay) / (1 - secondaryDelay))))
  const secondaryBarX = (1 - secondaryEnter) * -110
  const secondaryBarExitX = exitProgress > 0 ? easeInCubic(Math.min(1, exitProgress * 1.3)) * 110 : 0

  // Network bug slides in (stagger 3)
  const bugDelay = 0.5
  const bugEnter = easeOutCubic(Math.max(0, Math.min(1, (enterProgress - bugDelay) / (1 - bugDelay))))
  const bugX = (1 - bugEnter) * -60
  const bugOpacity = bugEnter
  const bugExitOpacity = exitProgress > 0 ? 1 - easeInCubic(Math.min(1, exitProgress * 1.5)) : 1

  // Name text fade in (inside primary bar)
  const nameDelay = 0.4
  const nameEnter = Math.max(0, Math.min(1, (enterProgress - nameDelay) / (1 - nameDelay)))
  const nameOpacity = easeOutCubic(nameEnter)
  const nameExitOpacity = exitProgress > 0 ? 1 - easeInCubic(exitProgress) : 1

  // Title text fade in (inside secondary bar)
  const titleDelay = 0.6
  const titleEnter = Math.max(0, Math.min(1, (enterProgress - titleDelay) / (1 - titleDelay)))
  const titleOpacity = easeOutCubic(titleEnter)
  const titleExitOpacity = exitProgress > 0 ? 1 - easeInCubic(Math.min(1, exitProgress * 1.2)) : 1

  // Accent line wipes in
  const lineEnter = easeOutQuart(Math.max(0, Math.min(1, (enterProgress - 0.15) / 0.6)))
  const lineWidth = lineEnter * 100
  const lineExitWidth = exitProgress > 0 ? lineWidth * (1 - easeInCubic(exitProgress)) : lineWidth

  return (
    <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none' }}>
      {/* Lower third container */}
      <div
        style={{
          position: 'absolute',
          bottom: '8%',
          left: '4%',
          maxWidth: '65%',
        }}
      >
        {/* Network bug — small label above */}
        <div
          style={{
            marginBottom: 'clamp(4px, 0.6vw, 8px)',
            transform: `translateX(${bugX}px)`,
            opacity: bugOpacity * bugExitOpacity,
          }}
        >
          <span
            style={{
              fontSize: 'clamp(8px, 1.2vw, 13px)',
              fontWeight: 700,
              color: textColor,
              background: primaryColor,
              padding: 'clamp(2px, 0.4vw, 5px) clamp(6px, 1vw, 12px)',
              borderRadius: 2,
              letterSpacing: '0.12em',
              textTransform: 'uppercase',
              fontFamily: "'Inter', 'Helvetica Neue', sans-serif",
            }}
          >
            {networkBug}
          </span>
        </div>

        {/* Accent line */}
        <div
          style={{
            width: `${lineExitWidth}%`,
            height: 3,
            background: primaryColor,
            marginBottom: 0,
            borderRadius: '2px 2px 0 0',
          }}
        />

        {/* Primary bar — Name */}
        <div
          style={{
            background: primaryColor,
            padding: 'clamp(8px, 1.4vw, 16px) clamp(14px, 2.5vw, 28px)',
            transform: `translateX(${primaryBarX + primaryBarExitX}%)`,
          }}
        >
          <div
            style={{
              fontSize: 'clamp(16px, 3.2vw, 30px)',
              fontWeight: 800,
              color: textColor,
              fontFamily: "'Inter', 'Helvetica Neue', sans-serif",
              opacity: nameOpacity * nameExitOpacity,
              letterSpacing: '0.02em',
            }}
          >
            {name}
          </div>
        </div>

        {/* Secondary bar — Title */}
        <div
          style={{
            background: secondaryColor,
            padding: 'clamp(5px, 0.9vw, 10px) clamp(14px, 2.5vw, 28px)',
            transform: `translateX(${secondaryBarX + secondaryBarExitX}%)`,
          }}
        >
          <div
            style={{
              fontSize: 'clamp(10px, 1.8vw, 17px)',
              fontWeight: 500,
              color: textColor,
              fontFamily: "'Inter', 'Helvetica Neue', sans-serif",
              opacity: titleOpacity * titleExitOpacity,
              letterSpacing: '0.04em',
              textTransform: 'uppercase',
            }}
          >
            {title}
          </div>
        </div>
      </div>
    </div>
  )
}

registerMotionGraphic({
  id: 'tpl-scene-news-lower-third',
  title: 'News Lower Third',
  description: 'Professional broadcast-style lower third with two-tone bars, network bug, staggered slide-in from left, and slide-out right',
  tags: ['scene', 'news', 'lower-third', 'broadcast', 'name', 'title', 'media'],
  category: 'scene-layout',
  component: SceneNewsLowerThirdComponent as any,
  defaultConfig: {
    name: 'Jane Smith',
    title: 'Senior Correspondent',
    networkBug: 'GNN LIVE',
    primaryColor: '#1a237e',
    secondaryColor: '#283593',
    textColor: '#FFFFFF',
  },
  configSchema: [
    { key: 'name', label: 'Name', type: 'text', defaultValue: 'Jane Smith', group: 'Content' },
    { key: 'title', label: 'Title', type: 'text', defaultValue: 'Senior Correspondent', group: 'Content' },
    { key: 'networkBug', label: 'Network Bug', type: 'text', defaultValue: 'GNN LIVE', group: 'Content' },
    { key: 'primaryColor', label: 'Primary Bar', type: 'color', defaultValue: '#1a237e', group: 'Style' },
    { key: 'secondaryColor', label: 'Secondary Bar', type: 'color', defaultValue: '#283593', group: 'Style' },
    { key: 'textColor', label: 'Text Color', type: 'color', defaultValue: '#FFFFFF', group: 'Style' },
  ],
})
