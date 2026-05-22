import React from 'react'
import { registerMotionGraphic } from '../registry'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface SceneMusicChartRankConfig {
  chartName: string
  rank: number
  previousRank: number
  songTitle: string
  artistName: string
  weeksOnChart: number
  peakPosition: number
  bgColor: string
  cardColor: string
  accentColor: string
  textColor: string
}

function easeOutCubic(t: number): number { return 1 - Math.pow(1 - t, 3) }
function easeInCubic(t: number): number { return t * t * t }
function easeOutBack(t: number): number {
  const c1 = 1.70158
  const c3 = c1 + 1
  return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2)
}

function SceneMusicChartRankComponent({ config, progress }: MotionGraphicProps<SceneMusicChartRankConfig>) {
  const { chartName, rank, previousRank, songTitle, artistName, weeksOnChart, peakPosition, bgColor, cardColor, accentColor, textColor } = config

  const enterProgress = progress < 0.25 ? progress / 0.25 : 1
  const holdProgress = progress >= 0.25 && progress < 0.8 ? (progress - 0.25) / 0.55 : progress >= 0.8 ? 1 : 0
  const exitProgress = progress >= 0.8 ? (progress - 0.8) / 0.2 : 0

  const cardScale = easeOutBack(Math.min(1, enterProgress / 0.5))
  const cardOpacity = easeOutCubic(Math.min(1, enterProgress / 0.3))

  // Rank number counts down from larger
  const rankReveal = easeOutCubic(Math.max(0, Math.min(1, (enterProgress - 0.1) / 0.5)))
  const rankScale = 1.8 - 0.8 * rankReveal

  // Change indicator
  const changeValue = previousRank - rank
  const changeColor = changeValue > 0 ? '#22C55E' : changeValue < 0 ? '#EF4444' : '#888'
  const changeSymbol = changeValue > 0 ? '\u25B2' : changeValue < 0 ? '\u25BC' : '\u2014'

  // Song info stagger
  const titleOp = easeOutCubic(Math.max(0, Math.min(1, (enterProgress - 0.3) / 0.3)))
  const statsOp = easeOutCubic(Math.max(0, Math.min(1, (enterProgress - 0.5) / 0.3)))

  // Shimmer during hold
  const shimmerX = holdProgress * 200 - 50

  // Exit
  const exitEased = easeInCubic(exitProgress)
  const exitOpacity = 1 - exitEased
  const exitScale = 1 - exitEased * 0.15

  return (
    <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', background: bgColor, fontFamily: "'Inter', 'Helvetica Neue', sans-serif", display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ position: 'absolute', inset: 0, background: `radial-gradient(circle at 30% 40%, ${accentColor}08 0%, transparent 50%)` }} />

      <div style={{
        width: 'clamp(280px, 68vw, 440px)',
        background: cardColor,
        borderRadius: 'clamp(14px, 3vw, 22px)',
        overflow: 'hidden', position: 'relative',
        transform: `scale(${cardScale * exitScale})`,
        opacity: cardOpacity * exitOpacity,
        boxShadow: `0 16px 50px rgba(0,0,0,0.4)`,
      }}>
        {/* Shimmer */}
        <div style={{ position: 'absolute', inset: 0, background: `linear-gradient(105deg, transparent 40%, ${accentColor}08 50%, transparent 60%)`, transform: `translateX(${shimmerX}%)`, pointerEvents: 'none' }} />

        {/* Top accent bar */}
        <div style={{ height: 'clamp(3px, 0.6vw, 5px)', background: `linear-gradient(90deg, ${accentColor}, ${accentColor}80)` }} />

        <div style={{ padding: 'clamp(20px, 4vw, 36px)' }}>
          {/* Chart name */}
          <div style={{ fontSize: 'clamp(10px, 1.6vw, 13px)', fontWeight: 700, color: accentColor, textTransform: 'uppercase', letterSpacing: '0.2em', marginBottom: 'clamp(14px, 3vw, 24px)', opacity: cardOpacity }}>
            {chartName}
          </div>

          {/* Rank + song info row */}
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 'clamp(14px, 3vw, 24px)', marginBottom: 'clamp(16px, 3vw, 26px)' }}>
            {/* Big rank number */}
            <div style={{ textAlign: 'center', flexShrink: 0 }}>
              <div style={{
                fontSize: 'clamp(44px, 10vw, 72px)', fontWeight: 900, color: accentColor,
                lineHeight: 0.9, transform: `scale(${rankScale})`, opacity: rankReveal,
                fontFamily: "'Inter', sans-serif",
              }}>
                #{rank}
              </div>
              {/* Change indicator */}
              <div style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 3,
                fontSize: 'clamp(10px, 1.8vw, 14px)', fontWeight: 700, color: changeColor,
                marginTop: 4, opacity: titleOp,
              }}>
                <span>{changeSymbol}</span>
                <span>{Math.abs(changeValue)}</span>
              </div>
            </div>

            {/* Song details */}
            <div style={{ flex: 1, paddingTop: 'clamp(4px, 0.8vw, 8px)' }}>
              <div style={{
                fontSize: 'clamp(18px, 3.5vw, 26px)', fontWeight: 800, color: textColor,
                lineHeight: 1.2, opacity: titleOp, marginBottom: 4,
              }}>
                {songTitle}
              </div>
              <div style={{ fontSize: 'clamp(12px, 2.2vw, 16px)', fontWeight: 500, color: `${textColor}80`, opacity: titleOp }}>
                {artistName}
              </div>
            </div>
          </div>

          {/* Stats row */}
          <div style={{
            display: 'flex', gap: 'clamp(8px, 1.5vw, 14px)', opacity: statsOp,
          }}>
            <div style={{
              flex: 1, background: `${textColor}06`, borderRadius: 10,
              padding: 'clamp(8px, 1.5vw, 14px)', textAlign: 'center',
            }}>
              <div style={{ fontSize: 'clamp(16px, 3vw, 22px)', fontWeight: 800, color: textColor }}>
                {weeksOnChart}
              </div>
              <div style={{ fontSize: 'clamp(9px, 1.4vw, 11px)', fontWeight: 500, color: `${textColor}60`, textTransform: 'uppercase', letterSpacing: '0.06em', marginTop: 2 }}>
                Weeks
              </div>
            </div>
            <div style={{
              flex: 1, background: `${textColor}06`, borderRadius: 10,
              padding: 'clamp(8px, 1.5vw, 14px)', textAlign: 'center',
            }}>
              <div style={{ fontSize: 'clamp(16px, 3vw, 22px)', fontWeight: 800, color: textColor }}>
                #{peakPosition}
              </div>
              <div style={{ fontSize: 'clamp(9px, 1.4vw, 11px)', fontWeight: 500, color: `${textColor}60`, textTransform: 'uppercase', letterSpacing: '0.06em', marginTop: 2 }}>
                Peak
              </div>
            </div>
            <div style={{
              flex: 1, background: `${accentColor}15`, borderRadius: 10,
              padding: 'clamp(8px, 1.5vw, 14px)', textAlign: 'center',
            }}>
              <div style={{ fontSize: 'clamp(16px, 3vw, 22px)', fontWeight: 800, color: accentColor }}>
                {changeValue > 0 ? '\u2191' : '\u2193'}
              </div>
              <div style={{ fontSize: 'clamp(9px, 1.4vw, 11px)', fontWeight: 500, color: `${textColor}60`, textTransform: 'uppercase', letterSpacing: '0.06em', marginTop: 2 }}>
                Trend
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

registerMotionGraphic({
  id: 'tpl-scene-music-chart-rank',
  title: 'Scene Music Chart Rank',
  description: 'Music chart ranking display with large rank number, change indicator, song info, weeks on chart, and peak position. Billboard-style aesthetic.',
  tags: ['scene', 'music', 'chart', 'ranking', 'billboard', 'top', 'hit', 'festival'],
  category: 'scene-layout',
  component: SceneMusicChartRankComponent as unknown as React.ComponentType<MotionGraphicProps>,
  defaultConfig: {
    chartName: 'TOP 100 CHARTS',
    rank: 3,
    previousRank: 7,
    songTitle: 'Stellar Frequencies',
    artistName: 'Nova Collective',
    weeksOnChart: 14,
    peakPosition: 1,
    bgColor: '#080810',
    cardColor: '#14142A',
    accentColor: '#FFD700',
    textColor: '#FFFFFF',
  },
  configSchema: [
    { key: 'chartName', label: 'Chart Name', type: 'text', defaultValue: 'TOP 100 CHARTS', group: 'Content' },
    { key: 'rank', label: 'Current Rank', type: 'number', defaultValue: 3, min: 1, max: 200, group: 'Content' },
    { key: 'previousRank', label: 'Previous Rank', type: 'number', defaultValue: 7, min: 1, max: 200, group: 'Content' },
    { key: 'songTitle', label: 'Song Title', type: 'text', defaultValue: 'Stellar Frequencies', group: 'Content' },
    { key: 'artistName', label: 'Artist', type: 'text', defaultValue: 'Nova Collective', group: 'Content' },
    { key: 'weeksOnChart', label: 'Weeks on Chart', type: 'number', defaultValue: 14, min: 1, max: 200, group: 'Stats' },
    { key: 'peakPosition', label: 'Peak Position', type: 'number', defaultValue: 1, min: 1, max: 200, group: 'Stats' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#080810', group: 'Style' },
    { key: 'cardColor', label: 'Card Color', type: 'color', defaultValue: '#14142A', group: 'Style' },
    { key: 'accentColor', label: 'Accent', type: 'color', defaultValue: '#FFD700', group: 'Style' },
    { key: 'textColor', label: 'Text Color', type: 'color', defaultValue: '#FFFFFF', group: 'Style' },
  ],
})
