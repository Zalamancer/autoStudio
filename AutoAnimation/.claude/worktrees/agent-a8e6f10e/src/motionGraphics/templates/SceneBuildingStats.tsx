import React from 'react'
import { registerMotionGraphic } from '../registry'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface BuildingStatsConfig {
  buildingName: string
  architect: string
  year: number
  floors: number
  heightMeters: number
  sqftTotal: number
  bgColor: string
  cardColor: string
  accentColor: string
  textColor: string
}

function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3)
}

function easeInCubic(t: number): number {
  return t * t * t
}

function SceneBuildingStatsComponent({
  config,
  frame,
  durationInFrames,
}: MotionGraphicProps<BuildingStatsConfig>) {
  const { buildingName, architect, year, floors, heightMeters, sqftTotal, bgColor, cardColor, accentColor, textColor } = config
  const progress = frame / durationInFrames

  const enterEnd = 0.28
  const holdEnd = 0.8
  const enterProgress = Math.min(1, progress / enterEnd)
  const holdProgress = progress >= enterEnd && progress < holdEnd ? (progress - enterEnd) / (holdEnd - enterEnd) : progress >= holdEnd ? 1 : 0
  const exitProgress = progress >= holdEnd ? (progress - holdEnd) / (1 - holdEnd) : 0

  // Building silhouette grows up
  const buildRise = easeOutCubic(Math.min(1, enterProgress / 0.5))
  // Title
  const titleProgress = easeOutCubic(Math.max(0, Math.min(1, (enterProgress - 0.2) / 0.3)))
  // Stats cascade
  const getStatProgress = (idx: number) => {
    const delay = 0.4 + idx * 0.1
    return easeOutCubic(Math.max(0, Math.min(1, (enterProgress - delay) / 0.3)))
  }

  // Hold: counting animation
  const countMultiplier = easeOutCubic(Math.min(1, holdProgress / 0.3))

  // Exit
  const exitEased = easeInCubic(exitProgress)
  const exitOpacity = 1 - exitEased

  const stats = [
    { label: 'FLOORS', value: Math.round(floors * getStatProgress(0) * countMultiplier) || (getStatProgress(0) > 0 ? 1 : 0), suffix: '' },
    { label: 'HEIGHT', value: Math.round(heightMeters * getStatProgress(1) * countMultiplier), suffix: 'm' },
    { label: 'AREA', value: Math.round((sqftTotal / 1000) * getStatProgress(2) * countMultiplier), suffix: 'K sqft' },
    { label: 'YEAR', value: getStatProgress(3) > 0.5 ? year : Math.round(1900 + (year - 1900) * getStatProgress(3) * 2), suffix: '' },
  ]

  // Building silhouette proportions
  const buildingFloors = Math.min(floors, 15)
  const floorHeight = 100 / buildingFloors

  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        overflow: 'hidden',
        background: bgColor,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: "'Helvetica Neue', Arial, sans-serif",
        padding: '5%',
      }}
    >
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 'clamp(12px, 2.5vh, 22px)',
          width: '100%',
          maxWidth: 400,
          opacity: exitOpacity,
        }}
      >
        {/* Building icon badge */}
        <div
          style={{
            fontSize: 'clamp(9px, 1.4vw, 11px)',
            fontWeight: 700,
            color: accentColor,
            letterSpacing: 3,
            textTransform: 'uppercase',
            opacity: titleProgress,
          }}
        >
          BUILDING PROFILE
        </div>

        {/* Building name */}
        <div
          style={{
            fontSize: 'clamp(22px, 5vw, 36px)',
            fontWeight: 900,
            color: textColor,
            textAlign: 'center',
            lineHeight: 1.1,
            opacity: titleProgress,
            transform: `translateY(${(1 - titleProgress) * 10}px)`,
          }}
        >
          {buildingName}
        </div>

        {/* Architect */}
        <div
          style={{
            fontSize: 'clamp(10px, 1.6vw, 13px)',
            fontWeight: 500,
            color: `${textColor}60`,
            opacity: titleProgress,
          }}
        >
          Designed by {architect}
        </div>

        {/* Building silhouette */}
        <div
          style={{
            width: 'clamp(60px, 14vw, 100px)',
            height: 'clamp(100px, 22vh, 180px)',
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              position: 'absolute',
              bottom: 0,
              left: '10%',
              right: '10%',
              height: `${buildRise * 100}%`,
              background: `linear-gradient(180deg, ${accentColor} 0%, ${accentColor}CC 100%)`,
              borderRadius: '4px 4px 0 0',
            }}
          >
            {/* Floor lines */}
            {Array.from({ length: buildingFloors }, (_, i) => (
              <div
                key={i}
                style={{
                  position: 'absolute',
                  bottom: `${i * floorHeight}%`,
                  left: 0,
                  right: 0,
                  height: 1,
                  background: 'rgba(255,255,255,0.15)',
                }}
              />
            ))}
            {/* Windows */}
            {Array.from({ length: Math.min(buildingFloors, 8) }, (_, i) => (
              <React.Fragment key={`w-${i}`}>
                <div style={{ position: 'absolute', bottom: `${i * floorHeight + floorHeight * 0.3}%`, left: '20%', width: '20%', height: `${floorHeight * 0.4}%`, background: 'rgba(255,255,255,0.2)', borderRadius: 1 }} />
                <div style={{ position: 'absolute', bottom: `${i * floorHeight + floorHeight * 0.3}%`, right: '20%', width: '20%', height: `${floorHeight * 0.4}%`, background: 'rgba(255,255,255,0.2)', borderRadius: 1 }} />
              </React.Fragment>
            ))}
          </div>
          {/* Ground line */}
          <div style={{ position: 'absolute', bottom: 0, left: -10, right: -10, height: 2, background: `${textColor}20` }} />
        </div>

        {/* Stats grid */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: 'clamp(8px, 1.5vh, 14px)',
            width: '100%',
          }}
        >
          {stats.map((stat, i) => {
            const p = getStatProgress(i)
            return (
              <div
                key={i}
                style={{
                  background: cardColor,
                  borderRadius: 'clamp(10px, 1.5vw, 14px)',
                  padding: 'clamp(10px, 2vh, 18px)',
                  textAlign: 'center',
                  opacity: p,
                  transform: `translateY(${(1 - p) * 15}px)`,
                  boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
                }}
              >
                <div style={{ fontSize: 'clamp(22px, 4.5vw, 36px)', fontWeight: 900, color: accentColor, lineHeight: 1 }}>
                  {stat.value.toLocaleString()}{stat.suffix}
                </div>
                <div style={{ fontSize: 'clamp(8px, 1.2vw, 10px)', fontWeight: 700, color: `${textColor}50`, letterSpacing: 2, marginTop: 4 }}>
                  {stat.label}
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
  id: 'tpl-scene-building-stats',
  title: 'Scene Building Stats',
  description: 'Building statistics card with rising silhouette animation, floor lines, window details, and cascading stat counters',
  tags: ['scene', 'building', 'architecture', 'statistics', 'skyscraper', 'construction', 'real-estate'],
  category: 'scene-layout',
  component: SceneBuildingStatsComponent as unknown as React.ComponentType<MotionGraphicProps>,
  configSchema: [
    { key: 'buildingName', label: 'Building Name', type: 'text', defaultValue: 'One World Trade Center', group: 'Content' },
    { key: 'architect', label: 'Architect', type: 'text', defaultValue: 'David Childs (SOM)', group: 'Content' },
    { key: 'year', label: 'Year', type: 'number', defaultValue: 2014, min: 1800, max: 2030, group: 'Content' },
    { key: 'floors', label: 'Floors', type: 'number', defaultValue: 104, min: 1, max: 200, group: 'Content' },
    { key: 'heightMeters', label: 'Height (m)', type: 'number', defaultValue: 541, min: 1, max: 2000, group: 'Content' },
    { key: 'sqftTotal', label: 'Total Area (sqft)', type: 'number', defaultValue: 3500000, min: 1000, max: 99999999, group: 'Content' },
    { key: 'accentColor', label: 'Accent Color', type: 'color', defaultValue: '#1E3A5F', group: 'Style' },
    { key: 'cardColor', label: 'Card Color', type: 'color', defaultValue: '#FFFFFF', group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#F0F4F8', group: 'Style' },
    { key: 'textColor', label: 'Text Color', type: 'color', defaultValue: '#1E293B', group: 'Style' },
  ],
  defaultConfig: {
    buildingName: 'One World Trade Center',
    architect: 'David Childs (SOM)',
    year: 2014,
    floors: 104,
    heightMeters: 541,
    sqftTotal: 3500000,
    accentColor: '#1E3A5F',
    cardColor: '#FFFFFF',
    bgColor: '#F0F4F8',
    textColor: '#1E293B',
  },
})
