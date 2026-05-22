import React from 'react'
import { registerMotionGraphic } from '../registry'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface SceneLeaderboardConfig {
  title: string
  items: string[]
  bgColor: string
  accentColor: string
  textColor: string
  cardColor: string
}

function easeOutCubic(t: number): number { return 1 - Math.pow(1 - t, 3) }
function easeInCubic(t: number): number { return t * t * t }
function easeOutBack(t: number): number {
  const c1 = 1.70158
  const c3 = c1 + 1
  return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2)
}

function parseItem(s: string): { name: string; score: number } {
  const parts = s.split(':')
  return { name: (parts[0] || '').trim(), score: parseFloat(parts[1] || '0') }
}

function formatScore(n: number): string {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1).replace(/\.0$/, '') + 'M'
  if (n >= 1_000) return (n / 1_000).toFixed(1).replace(/\.0$/, '') + 'K'
  if (Number.isInteger(n)) return n.toLocaleString('en-US')
  return n.toFixed(1)
}

function SceneLeaderboardComponent({ config, progress }: MotionGraphicProps<SceneLeaderboardConfig>) {
  const { title, items, bgColor, accentColor, textColor, cardColor } = config

  const parsed = items.slice(0, 5).map(parseItem)

  const enterProgress = progress < 0.3 ? progress / 0.3 : 1
  const holdProgress = progress >= 0.3 && progress < 0.8 ? (progress - 0.3) / 0.5 : progress >= 0.8 ? 1 : 0
  const exitProgress = progress >= 0.8 ? (progress - 0.8) / 0.2 : 0

  // Title reveal
  const titleReveal = easeOutCubic(Math.min(1, enterProgress / 0.3))

  // Exit
  const exitEased = easeInCubic(exitProgress)
  const exitOpacity = 1 - exitEased

  // Medal emojis for top 3
  const medals = ['\u{1F947}', '\u{1F948}', '\u{1F949}']

  // Gold glow for #1
  const isHolding = progress >= 0.3 && progress < 0.8
  const goldGlow = isHolding ? 0.5 + Math.sin(holdProgress * Math.PI * 5) * 0.5 : 1

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
          padding: '5% 8%',
          opacity: exitOpacity,
        }}
      >
        {/* Title */}
        <div
          style={{
            fontFamily: "'Inter', 'Helvetica Neue', sans-serif",
            fontSize: 'clamp(16px, 3.5vw, 28px)',
            fontWeight: 900,
            color: textColor,
            textTransform: 'uppercase',
            letterSpacing: '0.1em',
            marginBottom: 'clamp(12px, 2.5vw, 24px)',
            opacity: titleReveal,
            transform: `translateY(${(1 - titleReveal) * 15}px)`,
          }}
        >
          {title}
        </div>

        {/* Leaderboard rows */}
        <div
          style={{
            width: '100%',
            maxWidth: 480,
            display: 'flex',
            flexDirection: 'column',
            gap: 'clamp(6px, 1.2vw, 10px)',
          }}
        >
          {parsed.map((item, i) => {
            const stagger = i * 0.1
            const itemEnter = easeOutBack(Math.max(0, Math.min(1, (enterProgress - 0.15 - stagger) / 0.4)))
            const slideX = (1 - itemEnter) * 100
            const itemOpacity = itemEnter

            // Exit stagger
            const itemExit = exitProgress > 0
              ? easeInCubic(Math.max(0, Math.min(1, (exitProgress - i * 0.04) / (1 - i * 0.04))))
              : 0
            const exitSlideX = itemExit * 80

            // Score count-up
            const scoreEased = easeOutCubic(Math.max(0, Math.min(1, (enterProgress - 0.25 - stagger) / 0.5)))
            const displayScore = formatScore(Math.round(item.score * scoreEased))

            const isFirst = i === 0
            const hasMedal = i < 3

            // Float during hold
            const floatX = isHolding ? Math.sin(holdProgress * Math.PI * 4 + i * 1.5) * 2 : 0

            return (
              <div
                key={i}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 'clamp(8px, 1.5vw, 14px)',
                  padding: 'clamp(8px, 1.5vw, 14px) clamp(12px, 2vw, 18px)',
                  borderRadius: 'clamp(6px, 1vw, 10px)',
                  background: isFirst ? `${cardColor}` : `${cardColor}80`,
                  border: isFirst ? `1px solid ${accentColor}40` : '1px solid transparent',
                  boxShadow: isFirst ? `0 0 ${16 * goldGlow}px ${accentColor}20, 0 4px 16px rgba(0,0,0,0.2)` : '0 2px 8px rgba(0,0,0,0.15)',
                  opacity: itemOpacity * (1 - itemExit),
                  transform: `translateX(${slideX + exitSlideX + floatX}px)`,
                }}
              >
                {/* Rank / Medal */}
                <div
                  style={{
                    width: 'clamp(28px, 5vw, 40px)',
                    height: 'clamp(28px, 5vw, 40px)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                    fontSize: hasMedal ? 'clamp(18px, 3.5vw, 28px)' : 'clamp(14px, 2.5vw, 20px)',
                    fontWeight: 900,
                    color: hasMedal ? undefined : `${textColor}60`,
                    fontFamily: "'Inter', sans-serif",
                  }}
                >
                  {hasMedal ? medals[i] : `${i + 1}`}
                </div>

                {/* Name */}
                <div
                  style={{
                    flex: 1,
                    fontFamily: "'Inter', 'Helvetica Neue', sans-serif",
                    fontSize: 'clamp(13px, 2.2vw, 20px)',
                    fontWeight: isFirst ? 800 : 600,
                    color: isFirst ? textColor : `${textColor}CC`,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {item.name}
                </div>

                {/* Score */}
                <div
                  style={{
                    fontFamily: "'Inter', 'Helvetica Neue', sans-serif",
                    fontSize: 'clamp(14px, 2.5vw, 22px)',
                    fontWeight: 900,
                    color: isFirst ? accentColor : `${accentColor}CC`,
                    flexShrink: 0,
                    textShadow: isFirst ? `0 0 8px ${accentColor}40` : 'none',
                  }}
                >
                  {displayScore}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

registerMotionGraphic({
  id: 'tpl-scene-leaderboard',
  title: 'Leaderboard',
  description: 'Top 5 leaderboard with rank medals, names, scores, staggered slide-in, #1 has gold glow',
  tags: ['scene', 'gaming', 'leaderboard', 'ranking', 'top5', 'medals', 'competition'],
  category: 'scene-layout',
  component: SceneLeaderboardComponent as any,
  defaultConfig: {
    title: 'TOP PLAYERS',
    items: ['xDragonSlayer:28500', 'NinjaKing99:24100', 'ShadowBlade:19800', 'PhoenixRise:15200', 'IceStorm77:12600'],
    bgColor: '#0a0a14',
    accentColor: '#fbbf24',
    textColor: '#e2e8f0',
    cardColor: '#1e293b',
  },
  configSchema: [
    { key: 'title', label: 'Title', type: 'text', defaultValue: 'TOP PLAYERS', group: 'Content' },
    { key: 'items', label: 'Players (Name:Score)', type: 'text-array', defaultValue: ['xDragonSlayer:28500', 'NinjaKing99:24100', 'ShadowBlade:19800', 'PhoenixRise:15200', 'IceStorm77:12600'], group: 'Content' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#0a0a14', group: 'Style' },
    { key: 'accentColor', label: 'Accent / Gold', type: 'color', defaultValue: '#fbbf24', group: 'Style' },
    { key: 'textColor', label: 'Text Color', type: 'color', defaultValue: '#e2e8f0', group: 'Style' },
    { key: 'cardColor', label: 'Row Color', type: 'color', defaultValue: '#1e293b', group: 'Style' },
  ],
})
