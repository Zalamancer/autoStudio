import React from 'react'
import { registerMotionGraphic } from '../registry'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface SceneRaceCalendarConfig {
  seasonTitle: string
  race1Name: string
  race1Date: string
  race1Track: string
  race2Name: string
  race2Date: string
  race2Track: string
  race3Name: string
  race3Date: string
  race3Track: string
  race4Name: string
  race4Date: string
  race4Track: string
  nextRaceIndex: number
  bgColor: string
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

function SceneRaceCalendarComponent({ config, progress }: MotionGraphicProps<SceneRaceCalendarConfig>) {
  const { seasonTitle, race1Name, race1Date, race1Track, race2Name, race2Date, race2Track, race3Name, race3Date, race3Track, race4Name, race4Date, race4Track, nextRaceIndex, bgColor, accentColor, textColor } = config

  const enterProgress = progress < 0.2 ? progress / 0.2 : 1
  const holdProgress = progress >= 0.2 && progress < 0.8 ? (progress - 0.2) / 0.6 : progress >= 0.8 ? 1 : 0
  const exitProgress = progress >= 0.8 ? (progress - 0.8) / 0.2 : 0

  const exitEased = easeInCubic(exitProgress)
  const exitOpacity = 1 - exitEased

  const titleEnter = easeOutBack(Math.min(1, enterProgress / 0.5))

  const races = [
    { name: race1Name, date: race1Date, track: race1Track },
    { name: race2Name, date: race2Date, track: race2Track },
    { name: race3Name, date: race3Date, track: race3Track },
    { name: race4Name, date: race4Date, track: race4Track },
  ]

  const isHolding = progress >= 0.2 && progress < 0.8
  const nextPulse = isHolding ? 1 + Math.sin(holdProgress * Math.PI * 5) * 0.03 : 1

  return (
    <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', fontFamily: "'Inter', 'Helvetica Neue', sans-serif" }}>
      <div style={{ position: 'absolute', inset: 0, background: bgColor }} />

      {/* Checkered flag pattern top */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: 'clamp(3px, 0.6vw, 5px)',
          background: `repeating-linear-gradient(90deg, ${accentColor} 0px, ${accentColor} 8px, transparent 8px, transparent 16px)`,
          opacity: 0.6,
        }}
      />

      <div
        style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          padding: 'clamp(16px, 4vw, 40px) clamp(20px, 5vw, 48px)',
          opacity: exitOpacity,
        }}
      >
        {/* Season title */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 'clamp(8px, 1.5vw, 14px)',
            marginBottom: 'clamp(16px, 3.5vw, 30px)',
            opacity: titleEnter,
            transform: `translateY(${(1 - titleEnter) * -15}px)`,
          }}
        >
          {/* Flag icon (abstract) */}
          <div
            style={{
              width: 'clamp(20px, 4vw, 32px)',
              height: 'clamp(16px, 3vw, 26px)',
              background: `repeating-conic-gradient(${accentColor} 0% 25%, ${bgColor} 0% 50%) 0 0 / 8px 8px`,
              borderRadius: 3,
              flexShrink: 0,
            }}
          />
          <div style={{ fontSize: 'clamp(16px, 3.5vw, 28px)', fontWeight: 900, color: textColor, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            {seasonTitle}
          </div>
        </div>

        {/* Race schedule */}
        {races.map((race, i) => {
          const rowEnter = easeOutCubic(Math.max(0, Math.min(1, (enterProgress - 0.25 - i * 0.08) / 0.45)))
          const isNext = i === nextRaceIndex
          const isPast = i < nextRaceIndex
          return (
            <div
              key={i}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 'clamp(10px, 2vw, 18px)',
                padding: 'clamp(10px, 2vw, 18px) clamp(12px, 2.5vw, 22px)',
                marginBottom: 'clamp(4px, 0.8vw, 8px)',
                background: isNext ? `${accentColor}12` : `${textColor}03`,
                borderRadius: 'clamp(8px, 1.5vw, 12px)',
                border: isNext ? `1.5px solid ${accentColor}40` : '1.5px solid transparent',
                opacity: rowEnter * (isPast ? 0.5 : 1),
                transform: `translateX(${(1 - rowEnter) * 35}px) scale(${isNext ? nextPulse : 1})`,
              }}
            >
              {/* Round number */}
              <div
                style={{
                  width: 'clamp(28px, 5.5vw, 44px)',
                  height: 'clamp(28px, 5.5vw, 44px)',
                  borderRadius: '50%',
                  background: isNext ? accentColor : `${textColor}10`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 'clamp(11px, 1.8vw, 16px)',
                  fontWeight: 900,
                  color: isNext ? bgColor : `${textColor}60`,
                  flexShrink: 0,
                }}
              >
                R{i + 1}
              </div>

              {/* Race info */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 'clamp(12px, 2vw, 17px)', fontWeight: 800, color: isNext ? textColor : `${textColor}cc`, textDecoration: isPast ? 'line-through' : 'none', textDecorationColor: `${textColor}30` }}>
                  {race.name}
                </div>
                <div style={{ fontSize: 'clamp(9px, 1.3vw, 11px)', fontWeight: 500, color: `${textColor}50`, marginTop: 'clamp(1px, 0.2vw, 2px)' }}>
                  {race.track}
                </div>
              </div>

              {/* Date */}
              <div style={{ fontSize: 'clamp(9px, 1.4vw, 13px)', fontWeight: 700, color: isNext ? accentColor : `${textColor}50`, textAlign: 'right', flexShrink: 0, fontVariantNumeric: 'tabular-nums' }}>
                {race.date}
              </div>

              {/* Next indicator */}
              {isNext && (
                <div
                  style={{
                    fontSize: 'clamp(7px, 1vw, 9px)',
                    fontWeight: 800,
                    color: accentColor,
                    textTransform: 'uppercase',
                    letterSpacing: '0.1em',
                    writingMode: 'vertical-rl',
                  }}
                >
                  NEXT
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

registerMotionGraphic({
  id: 'tpl-scene-race-calendar',
  title: 'Race Calendar',
  description: 'Racing season calendar with round numbers, track names, dates, checkered flag header, and highlighted next race with pulse.',
  tags: ['scene', 'race', 'calendar', 'schedule', 'season', 'F1', 'motorsport'],
  category: 'scene-layout',
  component: SceneRaceCalendarComponent as any,
  defaultConfig: {
    seasonTitle: '2024 Season',
    race1Name: 'Australian GP',
    race1Date: 'Mar 24',
    race1Track: 'Albert Park Circuit',
    race2Name: 'Japanese GP',
    race2Date: 'Apr 07',
    race2Track: 'Suzuka International',
    race3Name: 'Monaco GP',
    race3Date: 'May 26',
    race3Track: 'Circuit de Monaco',
    race4Name: 'British GP',
    race4Date: 'Jul 07',
    race4Track: 'Silverstone Circuit',
    nextRaceIndex: 2,
    bgColor: '#0c0c14',
    accentColor: '#e10600',
    textColor: '#ffffff',
  },
  configSchema: [
    { key: 'seasonTitle', label: 'Season Title', type: 'text', defaultValue: '2024 Season', group: 'Content' },
    { key: 'race1Name', label: 'Race 1 Name', type: 'text', defaultValue: 'Australian GP', group: 'Race 1' },
    { key: 'race1Date', label: 'Race 1 Date', type: 'text', defaultValue: 'Mar 24', group: 'Race 1' },
    { key: 'race1Track', label: 'Race 1 Track', type: 'text', defaultValue: 'Albert Park Circuit', group: 'Race 1' },
    { key: 'race2Name', label: 'Race 2 Name', type: 'text', defaultValue: 'Japanese GP', group: 'Race 2' },
    { key: 'race2Date', label: 'Race 2 Date', type: 'text', defaultValue: 'Apr 07', group: 'Race 2' },
    { key: 'race2Track', label: 'Race 2 Track', type: 'text', defaultValue: 'Suzuka International', group: 'Race 2' },
    { key: 'race3Name', label: 'Race 3 Name', type: 'text', defaultValue: 'Monaco GP', group: 'Race 3' },
    { key: 'race3Date', label: 'Race 3 Date', type: 'text', defaultValue: 'May 26', group: 'Race 3' },
    { key: 'race3Track', label: 'Race 3 Track', type: 'text', defaultValue: 'Circuit de Monaco', group: 'Race 3' },
    { key: 'race4Name', label: 'Race 4 Name', type: 'text', defaultValue: 'British GP', group: 'Race 4' },
    { key: 'race4Date', label: 'Race 4 Date', type: 'text', defaultValue: 'Jul 07', group: 'Race 4' },
    { key: 'race4Track', label: 'Race 4 Track', type: 'text', defaultValue: 'Silverstone Circuit', group: 'Race 4' },
    { key: 'nextRaceIndex', label: 'Next Race (0-3)', type: 'number', defaultValue: 2, min: 0, max: 3, group: 'Content' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#0c0c14', group: 'Style' },
    { key: 'accentColor', label: 'Accent', type: 'color', defaultValue: '#e10600', group: 'Style' },
    { key: 'textColor', label: 'Text Color', type: 'color', defaultValue: '#ffffff', group: 'Style' },
  ],
})
