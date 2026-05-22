import React from 'react'
import { registerMotionGraphic } from '../registry'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface SceneSeasonalClockConfig {
  currentSeason: string
  daysUntilNext: number
  nextSeason: string
  currentDate: string
  temperature: string
  bgColor: string
  textColor: string
}

function easeOutCubic(t: number): number { return 1 - Math.pow(1 - t, 3) }
function easeInCubic(t: number): number { return t * t * t }

const SEASONS: Record<string, { color: string; icon: string; range: string }> = {
  Spring: { color: '#4ade80', icon: '\u{1F338}', range: 'Mar - May' },
  Summer: { color: '#fbbf24', icon: '\u2600', range: 'Jun - Aug' },
  Autumn: { color: '#f97316', icon: '\u{1F342}', range: 'Sep - Nov' },
  Winter: { color: '#60a5fa', icon: '\u2744', range: 'Dec - Feb' },
}

const SEASON_ORDER = ['Spring', 'Summer', 'Autumn', 'Winter']

function SceneSeasonalClockComponent({ config, progress }: MotionGraphicProps<SceneSeasonalClockConfig>) {
  const { currentSeason, daysUntilNext, nextSeason, currentDate, temperature, bgColor, textColor } = config

  const enterProgress = progress < 0.25 ? progress / 0.25 : 1
  const holdProgress = progress >= 0.25 && progress < 0.8 ? (progress - 0.25) / 0.55 : progress >= 0.8 ? 1 : 0
  const exitProgress = progress >= 0.8 ? (progress - 0.8) / 0.2 : 0

  const exitOpacity = exitProgress > 0 ? 1 - easeInCubic(exitProgress) : 1
  const enterEased = easeOutCubic(enterProgress)

  const currentSeasonData = SEASONS[currentSeason] || SEASONS.Spring
  const currentIndex = SEASON_ORDER.indexOf(currentSeason)

  // Clock hand rotation based on current season
  const baseAngle = currentIndex * 90
  const clockRotation = baseAngle * enterEased

  // Animated days counter
  const displayDays = Math.round(daysUntilNext * enterEased)

  // Seasonal particle float
  const seasonFloat = progress >= 0.25 && progress < 0.8
    ? Math.sin(holdProgress * Math.PI * 3) * 3
    : 0

  // Clock dimensions
  const svgSize = 180
  const center = svgSize / 2
  const outerR = 72
  const innerR = 55

  return (
    <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', fontFamily: "'Inter', 'Helvetica Neue', sans-serif" }}>
      <div style={{ position: 'absolute', inset: 0, background: bgColor }} />

      {/* Season-colored ambient glow */}
      <div style={{
        position: 'absolute',
        top: '10%',
        left: '50%',
        transform: 'translateX(-50%)',
        width: '70%',
        height: '40%',
        borderRadius: '50%',
        background: `radial-gradient(circle, ${currentSeasonData.color}10, transparent 70%)`,
        opacity: enterEased,
      }} />

      <div style={{
        position: 'absolute',
        inset: 0,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        padding: '5% 5%',
        opacity: exitOpacity,
      }}>
        {/* Date */}
        <div style={{
          fontSize: 'clamp(10px, 1.8vw, 14px)',
          fontWeight: 600,
          color: `${textColor}77`,
          textTransform: 'uppercase',
          letterSpacing: '0.12em',
          opacity: enterEased,
          marginBottom: 'clamp(6px, 1vh, 12px)',
        }}>
          {currentDate}
        </div>

        {/* Seasonal clock */}
        <div style={{
          position: 'relative',
          opacity: enterEased,
          transform: `scale(${0.8 + enterEased * 0.2})`,
          marginBottom: 'clamp(14px, 2.5vh, 24px)',
        }}>
          <svg viewBox={`0 0 ${svgSize} ${svgSize}`}
            style={{ width: 'clamp(130px, 32vw, 210px)', height: 'clamp(130px, 32vw, 210px)' }}
          >
            {/* Season quadrants */}
            {SEASON_ORDER.map((season, i) => {
              const startAngle = (i * 90 - 90) * (Math.PI / 180)
              const endAngle = ((i + 1) * 90 - 90) * (Math.PI / 180)
              const x1 = center + Math.cos(startAngle) * outerR
              const y1 = center + Math.sin(startAngle) * outerR
              const x2 = center + Math.cos(endAngle) * outerR
              const y2 = center + Math.sin(endAngle) * outerR
              const isCurrent = season === currentSeason
              const sData = SEASONS[season]

              const segmentProg = easeOutCubic(Math.max(0, Math.min(1, (enterProgress - i * 0.05) / 0.8)))

              return (
                <g key={season}>
                  {/* Arc segment */}
                  <path
                    d={`M ${center} ${center} L ${x1} ${y1} A ${outerR} ${outerR} 0 0 1 ${x2} ${y2} Z`}
                    fill={isCurrent ? `${sData.color}25` : `${sData.color}08`}
                    stroke={`${sData.color}${isCurrent ? '50' : '20'}`}
                    strokeWidth={isCurrent ? 2 : 1}
                    opacity={segmentProg}
                  />
                  {/* Season icon */}
                  <text
                    x={center + Math.cos(startAngle + Math.PI / 4) * (outerR * 0.65)}
                    y={center + Math.sin(startAngle + Math.PI / 4) * (outerR * 0.65)}
                    textAnchor="middle"
                    dominantBaseline="central"
                    fontSize={isCurrent ? 18 : 14}
                    opacity={segmentProg * (isCurrent ? 1 : 0.6)}
                  >
                    {sData.icon}
                  </text>
                  {/* Season label */}
                  <text
                    x={center + Math.cos(startAngle + Math.PI / 4) * (outerR + 12)}
                    y={center + Math.sin(startAngle + Math.PI / 4) * (outerR + 12)}
                    textAnchor="middle"
                    dominantBaseline="central"
                    fill={isCurrent ? sData.color : `${textColor}55`}
                    fontSize={7}
                    fontWeight={isCurrent ? 700 : 500}
                    opacity={segmentProg}
                  >
                    {season}
                  </text>
                </g>
              )
            })}

            {/* Clock hand */}
            <g transform={`rotate(${clockRotation + 45} ${center} ${center})`}>
              <line x1={center} y1={center} x2={center} y2={center - innerR + 10}
                stroke={currentSeasonData.color} strokeWidth={2.5} strokeLinecap="round" />
              <circle cx={center} cy={center - innerR + 14} r={3}
                fill={currentSeasonData.color} />
            </g>

            {/* Center dot */}
            <circle cx={center} cy={center} r={5} fill={currentSeasonData.color}
              style={{ filter: `drop-shadow(0 0 4px ${currentSeasonData.color}60)` }} />
          </svg>
        </div>

        {/* Current season */}
        <div style={{
          fontSize: 'clamp(24px, 6vw, 48px)',
          fontWeight: 900,
          color: currentSeasonData.color,
          textShadow: `0 0 20px ${currentSeasonData.color}30`,
          transform: `translateY(${seasonFloat}px)`,
          opacity: easeOutCubic(Math.max(0, (enterProgress - 0.2) / 0.8)),
          marginBottom: 'clamp(2px, 0.5vh, 6px)',
        }}>
          {currentSeason}
        </div>

        {/* Temperature */}
        <div style={{
          fontSize: 'clamp(14px, 3vw, 22px)',
          fontWeight: 700,
          color: textColor,
          opacity: easeOutCubic(Math.max(0, (enterProgress - 0.3) / 0.7)),
          marginBottom: 'clamp(10px, 2vh, 18px)',
        }}>
          {temperature}
        </div>

        {/* Next season countdown */}
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 'clamp(2px, 0.4vh, 5px)',
          padding: 'clamp(6px, 1.2vw, 12px) clamp(12px, 2.5vw, 22px)',
          borderRadius: 10,
          background: `${textColor}08`,
          border: `1px solid ${textColor}12`,
          opacity: easeOutCubic(Math.max(0, (enterProgress - 0.4) / 0.6)),
          transform: `translateY(${(1 - easeOutCubic(Math.max(0, (enterProgress - 0.4) / 0.6))) * 12}px)`,
        }}>
          <span style={{
            fontSize: 'clamp(9px, 1.5vw, 12px)',
            fontWeight: 600,
            color: `${textColor}55`,
            textTransform: 'uppercase',
            letterSpacing: '0.08em',
          }}>
            Days until {nextSeason}
          </span>
          <span style={{
            fontSize: 'clamp(28px, 7vw, 48px)',
            fontWeight: 900,
            color: SEASONS[nextSeason]?.color || textColor,
            fontVariantNumeric: 'tabular-nums',
            lineHeight: 1.1,
          }}>
            {displayDays}
          </span>
        </div>
      </div>
    </div>
  )
}

registerMotionGraphic({
  id: 'tpl-scene-seasonal-clock',
  title: 'Seasonal Clock',
  description: 'Seasonal calendar clock with animated quadrants, current season highlight, and next season countdown',
  tags: ['scene', 'weather', 'season', 'clock', 'calendar', 'time', 'nature'],
  category: 'scene-layout',
  component: SceneSeasonalClockComponent as any,
  defaultConfig: {
    currentSeason: 'Spring',
    daysUntilNext: 42,
    nextSeason: 'Summer',
    currentDate: 'March 19, 2026',
    temperature: '62\u00B0F / 17\u00B0C',
    bgColor: '#0a1210',
    textColor: '#e2e8f0',
  },
  configSchema: [
    { key: 'currentSeason', label: 'Current Season (Spring/Summer/Autumn/Winter)', type: 'text', defaultValue: 'Spring', group: 'Content' },
    { key: 'daysUntilNext', label: 'Days Until Next Season', type: 'number', defaultValue: 42, min: 0, max: 365, group: 'Content' },
    { key: 'nextSeason', label: 'Next Season', type: 'text', defaultValue: 'Summer', group: 'Content' },
    { key: 'currentDate', label: 'Current Date', type: 'text', defaultValue: 'March 19, 2026', group: 'Content' },
    { key: 'temperature', label: 'Temperature', type: 'text', defaultValue: '62\u00B0F / 17\u00B0C', group: 'Content' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#0a1210', group: 'Style' },
    { key: 'textColor', label: 'Text Color', type: 'color', defaultValue: '#e2e8f0', group: 'Style' },
  ],
})
