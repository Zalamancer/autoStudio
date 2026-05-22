import React from 'react'
import { registerMotionGraphic } from '../registry'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface SceneRankingListConfig {
  items: string[]
  accentColor: string
  bgColor: string
  textColor: string
}

function easeOutCubic(t: number): number { return 1 - Math.pow(1 - t, 3) }
function easeInCubic(t: number): number { return t * t * t }

function parseItem(s: string): { name: string; score: number } {
  const parts = s.split(':')
  return { name: (parts[0] || '').trim(), score: parseFloat(parts[1] || '0') }
}

function SceneRankingListComponent({ config, progress }: MotionGraphicProps<SceneRankingListConfig>) {
  const { items, accentColor, bgColor, textColor } = config

  const parsed = items.map(parseItem)

  const enterProgress = progress < 0.25 ? progress / 0.25 : 1
  const holdProgress = progress >= 0.25 && progress < 0.8 ? (progress - 0.25) / 0.55 : 0
  const exitProgress = progress >= 0.8 ? (progress - 0.8) / 0.2 : 0

  const exitOpacity = exitProgress > 0 ? 1 - easeInCubic(exitProgress) : 1

  // Gold palette for ranks
  const rankColors = ['#fbbf24', '#d1d5db', '#cd7f32', accentColor, accentColor]

  return (
    <div style={{ position: 'absolute', inset: 0, overflow: 'hidden' }}>
      <div style={{ position: 'absolute', inset: 0, background: bgColor }} />
      <div
        style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '6% 8%',
          opacity: exitOpacity,
          gap: 'clamp(6px, 1.5vw, 14px)',
        }}
      >
        {parsed.map((item, i) => {
          const stagger = i * 0.12
          const itemEnter = easeOutCubic(Math.max(0, Math.min(1, (enterProgress - stagger) / (1 - stagger * parsed.length / Math.max(parsed.length - 1, 1)))))

          // Exit: staggered slide out
          const itemExit = exitProgress > 0
            ? easeInCubic(Math.max(0, Math.min(1, (exitProgress - i * 0.06) / (1 - i * 0.06))))
            : 0

          // Hold: subtle float
          const isHolding = progress >= 0.25 && progress < 0.8
          const floatX = isHolding ? Math.sin(holdProgress * Math.PI * 4 + i * 1.2) * 3 : 0

          const isFirst = i === 0
          const rankColor = rankColors[i] || accentColor
          const slideX = (1 - itemEnter) * 80 + itemExit * 100

          return (
            <div
              key={i}
              style={{
                display: 'flex',
                alignItems: 'center',
                width: '100%',
                maxWidth: 550,
                gap: 'clamp(8px, 1.5vw, 16px)',
                opacity: itemEnter * (1 - itemExit),
                transform: `translateX(${slideX + floatX}px)`,
                padding: 'clamp(8px, 1.5vw, 14px) clamp(10px, 2vw, 18px)',
                borderRadius: 10,
                background: isFirst ? `${rankColor}15` : 'transparent',
                border: isFirst ? `1px solid ${rankColor}30` : '1px solid transparent',
              }}
            >
              {/* Rank number */}
              <div
                style={{
                  fontFamily: "'Inter', 'Helvetica Neue', sans-serif",
                  fontSize: 'clamp(18px, 3.5vw, 32px)',
                  fontWeight: 900,
                  color: rankColor,
                  width: 'clamp(30px, 6vw, 50px)',
                  textAlign: 'center',
                  flexShrink: 0,
                  lineHeight: 1,
                }}
              >
                {i + 1}
              </div>

              {/* Divider */}
              <div
                style={{
                  width: 2,
                  height: 'clamp(20px, 3vw, 30px)',
                  background: `${textColor}20`,
                  borderRadius: 1,
                  flexShrink: 0,
                }}
              />

              {/* Name */}
              <div
                style={{
                  flex: 1,
                  fontFamily: "'Inter', 'Helvetica Neue', sans-serif",
                  fontSize: 'clamp(13px, 2.2vw, 22px)',
                  fontWeight: isFirst ? 700 : 500,
                  color: textColor,
                }}
              >
                {item.name}
              </div>

              {/* Score */}
              <div
                style={{
                  fontFamily: "'Inter', 'Helvetica Neue', sans-serif",
                  fontSize: 'clamp(14px, 2.5vw, 24px)',
                  fontWeight: 800,
                  color: rankColor,
                  flexShrink: 0,
                }}
              >
                {Math.round(item.score * itemEnter * (1 - itemExit))}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

registerMotionGraphic({
  id: 'tpl-scene-ranking-list',
  title: 'Ranking List',
  description: 'Animated top-5 ranking list with staggered slide-in, gold #1 styling, and floating hold animation',
  tags: ['scene', 'data', 'ranking', 'list', 'top', 'leaderboard'],
  category: 'scene-layout',
  component: SceneRankingListComponent as any,
  defaultConfig: {
    items: ['Python:95', 'JavaScript:89', 'TypeScript:82', 'Rust:76', 'Go:71'],
    accentColor: '#6366f1',
    bgColor: '#0f172a',
    textColor: '#e2e8f0',
  },
  configSchema: [
    { key: 'items', label: 'Items (Name:Score)', type: 'text-array', defaultValue: ['Python:95', 'JavaScript:89', 'TypeScript:82', 'Rust:76', 'Go:71'], group: 'Content' },
    { key: 'accentColor', label: 'Accent Color', type: 'color', defaultValue: '#6366f1', group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#0f172a', group: 'Style' },
    { key: 'textColor', label: 'Text Color', type: 'color', defaultValue: '#e2e8f0', group: 'Style' },
  ],
})
