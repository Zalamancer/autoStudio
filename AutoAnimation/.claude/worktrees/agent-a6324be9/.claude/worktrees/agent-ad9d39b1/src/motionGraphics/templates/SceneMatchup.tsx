import React from 'react'
import { registerMotionGraphic } from '../registry'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface SceneMatchupConfig {
  team1Name: string
  team2Name: string
  dateVenue: string
  vsText: string
  bgColor: string
  accentColor: string
  team1Color: string
  team2Color: string
  textColor: string
}

function easeOutCubic(t: number): number { return 1 - Math.pow(1 - t, 3) }
function easeInCubic(t: number): number { return t * t * t }
function elasticOut(t: number): number {
  if (t === 0 || t === 1) return t
  return Math.pow(2, -10 * t) * Math.sin((t - 0.075) * (2 * Math.PI) / 0.3) + 1
}

function SceneMatchupComponent({ config, progress }: MotionGraphicProps<SceneMatchupConfig>) {
  const { team1Name, team2Name, dateVenue, vsText, bgColor, accentColor, team1Color, team2Color, textColor } = config

  const enterProgress = progress < 0.2 ? progress / 0.2 : 1
  const holdProgress = progress >= 0.2 && progress < 0.8 ? (progress - 0.2) / 0.6 : progress >= 0.8 ? 1 : 0
  const exitProgress = progress >= 0.8 ? (progress - 0.8) / 0.2 : 0

  // Teams slam in from sides
  const team1Slam = easeOutCubic(Math.min(1, enterProgress / 0.5))
  const team2Slam = easeOutCubic(Math.max(0, Math.min(1, (enterProgress - 0.1) / 0.5)))

  // VS pops with elastic
  const vsPop = elasticOut(Math.max(0, Math.min(1, (enterProgress - 0.3) / 0.5)))

  // VS energy pulse during hold
  const isHolding = progress >= 0.2 && progress < 0.8
  const energyPulse = isHolding ? 0.5 + Math.sin(holdProgress * Math.PI * 6) * 0.5 : 1
  const energyRotate = isHolding ? holdProgress * 360 : 0

  // Date reveal
  const dateReveal = easeOutCubic(Math.max(0, Math.min(1, (enterProgress - 0.6) / 0.3)))

  // Exit
  const exitEased = easeInCubic(exitProgress)
  const exitOpacity = 1 - exitEased
  const exitScale = 1 - exitEased * 0.15

  return (
    <div style={{ position: 'absolute', inset: 0, overflow: 'hidden' }}>
      <div style={{ position: 'absolute', inset: 0, background: bgColor }} />

      {/* Team 1 background panel */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '50%',
          height: '100%',
          background: `linear-gradient(135deg, ${team1Color}20, transparent)`,
          opacity: team1Slam,
        }}
      />

      {/* Team 2 background panel */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          right: 0,
          width: '50%',
          height: '100%',
          background: `linear-gradient(225deg, ${team2Color}20, transparent)`,
          opacity: team2Slam,
        }}
      />

      {/* Center divider line */}
      <div
        style={{
          position: 'absolute',
          top: '15%',
          bottom: '15%',
          left: '50%',
          width: 2,
          background: `linear-gradient(180deg, transparent, ${accentColor}40, transparent)`,
          transform: 'translateX(-50%)',
          opacity: vsPop,
        }}
      />

      {/* Main content */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          opacity: exitOpacity,
          transform: `scale(${exitScale})`,
        }}
      >
        {/* Team 1 */}
        <div
          style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            opacity: team1Slam,
            transform: `translateX(${(1 - team1Slam) * -120}px)`,
          }}
        >
          <div
            style={{
              width: 'clamp(50px, 10vw, 80px)',
              height: 'clamp(50px, 10vw, 80px)',
              borderRadius: 12,
              background: `linear-gradient(135deg, ${team1Color}, ${team1Color}70)`,
              marginBottom: 'clamp(10px, 2vw, 20px)',
              boxShadow: `0 8px 30px ${team1Color}40`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontFamily: "'Inter', sans-serif",
              fontSize: 'clamp(20px, 4vw, 36px)',
              fontWeight: 900,
              color: '#fff',
            }}
          >
            {team1Name.substring(0, 2).toUpperCase()}
          </div>
          <div
            style={{
              fontFamily: "'Inter', 'Helvetica Neue', sans-serif",
              fontSize: 'clamp(16px, 3.5vw, 30px)',
              fontWeight: 900,
              color: textColor,
              textTransform: 'uppercase',
              letterSpacing: '0.04em',
              textAlign: 'center',
              padding: '0 8%',
            }}
          >
            {team1Name}
          </div>
        </div>

        {/* VS center */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            zIndex: 10,
          }}
        >
          {/* Energy ring */}
          <div
            style={{
              position: 'absolute',
              width: 'clamp(80px, 16vw, 130px)',
              height: 'clamp(80px, 16vw, 130px)',
              borderRadius: '50%',
              border: `2px solid ${accentColor}${Math.round(energyPulse * 40).toString(16).padStart(2, '0')}`,
              transform: `scale(${vsPop}) rotate(${energyRotate}deg)`,
              boxShadow: `0 0 ${20 + energyPulse * 20}px ${accentColor}${Math.round(energyPulse * 30).toString(16).padStart(2, '0')}`,
            }}
          />
          <div
            style={{
              width: 'clamp(60px, 12vw, 100px)',
              height: 'clamp(60px, 12vw, 100px)',
              borderRadius: '50%',
              background: `linear-gradient(135deg, ${team1Color}, ${accentColor}, ${team2Color})`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transform: `scale(${vsPop})`,
              boxShadow: `0 0 40px ${accentColor}50`,
            }}
          >
            <div
              style={{
                fontFamily: "'Inter', 'Helvetica Neue', sans-serif",
                fontSize: 'clamp(20px, 4.5vw, 38px)',
                fontWeight: 900,
                color: '#ffffff',
                textShadow: '0 2px 10px rgba(0,0,0,0.5)',
              }}
            >
              {vsText}
            </div>
          </div>
        </div>

        {/* Team 2 */}
        <div
          style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            opacity: team2Slam,
            transform: `translateX(${(1 - team2Slam) * 120}px)`,
          }}
        >
          <div
            style={{
              width: 'clamp(50px, 10vw, 80px)',
              height: 'clamp(50px, 10vw, 80px)',
              borderRadius: 12,
              background: `linear-gradient(135deg, ${team2Color}, ${team2Color}70)`,
              marginBottom: 'clamp(10px, 2vw, 20px)',
              boxShadow: `0 8px 30px ${team2Color}40`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontFamily: "'Inter', sans-serif",
              fontSize: 'clamp(20px, 4vw, 36px)',
              fontWeight: 900,
              color: '#fff',
            }}
          >
            {team2Name.substring(0, 2).toUpperCase()}
          </div>
          <div
            style={{
              fontFamily: "'Inter', 'Helvetica Neue', sans-serif",
              fontSize: 'clamp(16px, 3.5vw, 30px)',
              fontWeight: 900,
              color: textColor,
              textTransform: 'uppercase',
              letterSpacing: '0.04em',
              textAlign: 'center',
              padding: '0 8%',
            }}
          >
            {team2Name}
          </div>
        </div>
      </div>

      {/* Date / Venue */}
      <div
        style={{
          position: 'absolute',
          bottom: '8%',
          left: '50%',
          transform: 'translateX(-50%)',
          fontFamily: "'Inter', 'Helvetica Neue', sans-serif",
          fontSize: 'clamp(9px, 1.5vw, 13px)',
          fontWeight: 600,
          color: `${textColor}80`,
          textTransform: 'uppercase',
          letterSpacing: '0.15em',
          opacity: dateReveal * exitOpacity,
          textAlign: 'center',
          whiteSpace: 'nowrap',
        }}
      >
        {dateVenue}
      </div>
    </div>
  )
}

registerMotionGraphic({
  id: 'tpl-scene-matchup',
  title: 'Team Matchup',
  description: 'Pre-game matchup graphic with teams slamming in from sides, VS energy badge in center, date/venue below. Hype-building sports aesthetic.',
  tags: ['scene', 'sports', 'matchup', 'versus', 'vs', 'pre-game', 'athletics'],
  category: 'scene-layout',
  component: SceneMatchupComponent as any,
  defaultConfig: {
    team1Name: 'WARRIORS',
    team2Name: 'THUNDER',
    dateVenue: 'SAT MAR 22 \u2022 7:30 PM \u2022 MADISON SQUARE GARDEN',
    vsText: 'VS',
    bgColor: '#0a0a14',
    accentColor: '#fbbf24',
    team1Color: '#1d4ed8',
    team2Color: '#dc2626',
    textColor: '#ffffff',
  },
  configSchema: [
    { key: 'team1Name', label: 'Team 1 Name', type: 'text', defaultValue: 'WARRIORS', group: 'Content' },
    { key: 'team2Name', label: 'Team 2 Name', type: 'text', defaultValue: 'THUNDER', group: 'Content' },
    { key: 'dateVenue', label: 'Date / Venue', type: 'text', defaultValue: 'SAT MAR 22 \u2022 7:30 PM \u2022 MADISON SQUARE GARDEN', group: 'Content' },
    { key: 'vsText', label: 'VS Text', type: 'text', defaultValue: 'VS', group: 'Content' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#0a0a14', group: 'Style' },
    { key: 'accentColor', label: 'Accent', type: 'color', defaultValue: '#fbbf24', group: 'Style' },
    { key: 'team1Color', label: 'Team 1 Color', type: 'color', defaultValue: '#1d4ed8', group: 'Style' },
    { key: 'team2Color', label: 'Team 2 Color', type: 'color', defaultValue: '#dc2626', group: 'Style' },
    { key: 'textColor', label: 'Text Color', type: 'color', defaultValue: '#ffffff', group: 'Style' },
  ],
})
