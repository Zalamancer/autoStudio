import React from 'react'
import { registerMotionGraphic } from '../registry'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface SpaceExplorerConfig {
  missionName: string
  destination: string
  distanceKm: string
  launchDate: string
  crewSize: string
  missionDuration: string
  status: string
  bgColor: string
  textColor: string
  accentColor: string
}

function easeOutCubic(t: number): number { return 1 - Math.pow(1 - t, 3) }
function easeOutBack(t: number): number {
  const c1 = 1.70158
  const c3 = c1 + 1
  return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2)
}
function easeInCubic(t: number): number { return t * t * t }

function SceneSpaceExplorerComponent({ config, frame, durationInFrames }: MotionGraphicProps<SpaceExplorerConfig>) {
  const { missionName, destination, distanceKm, launchDate, crewSize, missionDuration, status, bgColor, textColor, accentColor } = config
  const progress = frame / durationInFrames

  // Stars
  const stars = Array.from({ length: 50 }, (_, i) => ({
    x: ((i * 73 + 17) % 100),
    y: ((i * 47 + 31) % 100),
    size: 1 + ((i * 13) % 2),
    opacity: 0.2 + ((i * 29) % 6) / 10,
  }))
  const twinkle = Math.sin(progress * Math.PI * 10)

  // HUD border draws (0-0.15)
  const hudDraw = easeOutCubic(Math.min(1, progress / 0.15))

  // Mission name (0.08-0.2)
  const nameFade = easeOutCubic(Math.max(0, Math.min(1, (progress - 0.08) / 0.12)))

  // Destination (0.15-0.25)
  const destFade = easeOutCubic(Math.max(0, Math.min(1, (progress - 0.15) / 0.1)))

  // Data grid (0.22-0.5)
  const distFade = easeOutCubic(Math.max(0, Math.min(1, (progress - 0.22) / 0.1)))
  const launchFade = easeOutCubic(Math.max(0, Math.min(1, (progress - 0.28) / 0.1)))
  const crewFade = easeOutCubic(Math.max(0, Math.min(1, (progress - 0.34) / 0.1)))
  const durFade = easeOutCubic(Math.max(0, Math.min(1, (progress - 0.4) / 0.1)))

  // Status badge (0.48-0.58)
  const statusPop = easeOutBack(Math.max(0, Math.min(1, (progress - 0.48) / 0.1)))

  // Trajectory line (0.2-0.5)
  const trajectoryProg = easeOutCubic(Math.max(0, Math.min(1, (progress - 0.2) / 0.3)))

  // Radar sweep (0.5-0.8)
  const sweepAngle = progress >= 0.5 && progress < 0.8 ? ((progress - 0.5) / 0.3) * 360 : 0

  // Exit
  const exitProg = progress >= 0.85 ? easeInCubic((progress - 0.85) / 0.15) : 0

  const dataItems = [
    { label: 'DISTANCE', value: distanceKm, fade: distFade },
    { label: 'LAUNCH', value: launchDate, fade: launchFade },
    { label: 'CREW', value: crewSize, fade: crewFade },
    { label: 'DURATION', value: missionDuration, fade: durFade },
  ]

  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        background: bgColor,
        overflow: 'hidden',
        fontFamily: "'Helvetica Neue', Arial, sans-serif",
        opacity: 1 - exitProg,
      }}
    >
      {/* Starfield */}
      {stars.map((star, i) => (
        <div
          key={i}
          style={{
            position: 'absolute',
            left: `${star.x}%`,
            top: `${star.y}%`,
            width: star.size,
            height: star.size,
            borderRadius: '50%',
            background: '#FFFFFF',
            opacity: star.opacity + (i % 4 === 0 ? twinkle * 0.15 : 0),
          }}
        />
      ))}

      {/* HUD container */}
      <div
        style={{
          position: 'absolute',
          inset: '6%',
          border: `1px solid ${accentColor}20`,
          borderRadius: 'clamp(8px, 1.5vw, 14px)',
          clipPath: hudDraw < 1
            ? `polygon(0 0, ${hudDraw * 100}% 0, ${hudDraw * 100}% ${hudDraw * 100}%, 0 ${hudDraw * 100}%)`
            : 'none',
        }}
      >
        {/* Corner decorations */}
        {['top-left', 'top-right', 'bottom-left', 'bottom-right'].map((corner, i) => {
          const isTop = corner.includes('top')
          const isLeft = corner.includes('left')
          return (
            <div
              key={corner}
              style={{
                position: 'absolute',
                [isTop ? 'top' : 'bottom']: -1,
                [isLeft ? 'left' : 'right']: -1,
                width: 16,
                height: 16,
                borderTop: isTop ? `2px solid ${accentColor}60` : 'none',
                borderBottom: !isTop ? `2px solid ${accentColor}60` : 'none',
                borderLeft: isLeft ? `2px solid ${accentColor}60` : 'none',
                borderRight: !isLeft ? `2px solid ${accentColor}60` : 'none',
                opacity: hudDraw,
              }}
            />
          )
        })}

        {/* Mini radar in top-right */}
        <div
          style={{
            position: 'absolute',
            top: 'clamp(12px, 3vw, 24px)',
            right: 'clamp(12px, 3vw, 24px)',
            width: 'clamp(40px, 10vw, 70px)',
            height: 'clamp(40px, 10vw, 70px)',
            borderRadius: '50%',
            border: `1px solid ${accentColor}20`,
            overflow: 'hidden',
            opacity: distFade,
          }}
        >
          {/* Radar rings */}
          {[1, 2].map(r => (
            <div
              key={r}
              style={{
                position: 'absolute',
                inset: `${r * 25}%`,
                border: `1px solid ${accentColor}10`,
                borderRadius: '50%',
              }}
            />
          ))}
          {/* Sweep line */}
          <div
            style={{
              position: 'absolute',
              left: '50%',
              top: '50%',
              width: '50%',
              height: 1,
              background: `linear-gradient(90deg, ${accentColor}60, transparent)`,
              transformOrigin: '0 50%',
              transform: `rotate(${sweepAngle}deg)`,
            }}
          />
          {/* Center dot */}
          <div
            style={{
              position: 'absolute',
              left: '50%',
              top: '50%',
              width: 4,
              height: 4,
              borderRadius: '50%',
              background: accentColor,
              transform: 'translate(-50%, -50%)',
            }}
          />
        </div>

        {/* Content */}
        <div
          style={{
            padding: 'clamp(16px, 4vw, 32px)',
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
          }}
        >
          {/* Mission name */}
          <div
            style={{
              fontSize: 'clamp(10px, 2vw, 16px)',
              color: accentColor,
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.15em',
              marginBottom: 'clamp(4px, 1vw, 8px)',
              opacity: nameFade,
            }}
          >
            {missionName}
          </div>

          {/* Destination */}
          <div
            style={{
              fontSize: 'clamp(28px, 7vw, 56px)',
              fontWeight: 900,
              color: textColor,
              marginBottom: 'clamp(8px, 2vw, 16px)',
              opacity: destFade,
              transform: `translateY(${(1 - destFade) * 20}px)`,
            }}
          >
            {destination}
          </div>

          {/* Trajectory line */}
          <div
            style={{
              width: `${trajectoryProg * 60}%`,
              height: 2,
              background: `linear-gradient(90deg, ${accentColor}, ${accentColor}30)`,
              marginBottom: 'clamp(16px, 4vw, 32px)',
              borderRadius: 2,
              position: 'relative',
            }}
          >
            {trajectoryProg > 0.5 && (
              <div
                style={{
                  position: 'absolute',
                  right: -3,
                  top: -3,
                  width: 8,
                  height: 8,
                  borderRadius: '50%',
                  background: accentColor,
                  boxShadow: `0 0 8px ${accentColor}80`,
                }}
              />
            )}
          </div>

          {/* Data grid */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: 'clamp(10px, 2.5vw, 20px)',
              marginBottom: 'clamp(16px, 4vw, 32px)',
            }}
          >
            {dataItems.map((item, i) => (
              <div
                key={i}
                style={{
                  opacity: item.fade,
                  transform: `translateY(${(1 - item.fade) * 10}px)`,
                }}
              >
                <div
                  style={{
                    fontSize: 'clamp(9px, 1.6vw, 12px)',
                    color: `${textColor}40`,
                    fontWeight: 600,
                    textTransform: 'uppercase',
                    letterSpacing: '0.1em',
                    marginBottom: 2,
                  }}
                >
                  {item.label}
                </div>
                <div
                  style={{
                    fontSize: 'clamp(14px, 3vw, 24px)',
                    color: textColor,
                    fontWeight: 700,
                  }}
                >
                  {item.value}
                </div>
              </div>
            ))}
          </div>

          {/* Status */}
          <div
            style={{
              display: 'inline-block',
              alignSelf: 'flex-start',
              fontSize: 'clamp(10px, 2vw, 16px)',
              fontWeight: 800,
              color: '#22C55E',
              background: '#22C55E18',
              padding: '4px 14px',
              borderRadius: 8,
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              opacity: statusPop,
              transform: `scale(${statusPop})`,
            }}
          >
            {status}
          </div>
        </div>
      </div>
    </div>
  )
}

registerMotionGraphic({
  id: 'tpl-scene-space-explorer',
  title: 'Space Explorer',
  description: 'Space mission data dashboard with starfield, HUD frame, radar sweep, trajectory line, and data grid',
  tags: ['scene', 'science', 'space', 'mission', 'nasa', 'dashboard', 'hud'],
  category: 'scene-layout',
  component: SceneSpaceExplorerComponent as unknown as React.ComponentType<MotionGraphicProps>,
  configSchema: [
    { key: 'missionName', label: 'Mission Name', type: 'text', defaultValue: 'Artemis III', group: 'Content' },
    { key: 'destination', label: 'Destination', type: 'text', defaultValue: 'Mars', group: 'Content' },
    { key: 'distanceKm', label: 'Distance', type: 'text', defaultValue: '225M km', group: 'Content' },
    { key: 'launchDate', label: 'Launch Date', type: 'text', defaultValue: 'Oct 2028', group: 'Content' },
    { key: 'crewSize', label: 'Crew Size', type: 'text', defaultValue: '6 astronauts', group: 'Content' },
    { key: 'missionDuration', label: 'Duration', type: 'text', defaultValue: '687 days', group: 'Content' },
    { key: 'status', label: 'Status', type: 'text', defaultValue: 'Active', group: 'Content' },
    { key: 'accentColor', label: 'Accent Color', type: 'color', defaultValue: '#64D8FF', group: 'Style' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#060a14', group: 'Style' },
    { key: 'textColor', label: 'Text Color', type: 'color', defaultValue: '#E8E8E8', group: 'Style' },
  ],
  defaultConfig: {
    missionName: 'Artemis III',
    destination: 'Mars',
    distanceKm: '225M km',
    launchDate: 'Oct 2028',
    crewSize: '6 astronauts',
    missionDuration: '687 days',
    status: 'Active',
    accentColor: '#64D8FF',
    bgColor: '#060a14',
    textColor: '#E8E8E8',
  },
})
