import React from 'react'
import { registerMotionGraphic } from '../registry'
import type { MotionGraphicProps } from '@/types/motionGraphic'

interface SceneCyberProfileConfig {
  alias: string
  realName: string
  faction: string
  level: number
  reputation: number
  cyberCredits: string
  implants: string
  status: string
  bgColor: string
  accentColor: string
  textColor: string
}

function easeOutCubic(t: number): number { return 1 - Math.pow(1 - t, 3) }
function easeInCubic(t: number): number { return t * t * t }

function SceneCyberProfileComponent({ config, progress }: MotionGraphicProps<SceneCyberProfileConfig>) {
  const { alias, realName, faction, level, reputation, cyberCredits, implants, status, bgColor, accentColor, textColor } = config

  const enterProgress = progress < 0.2 ? progress / 0.2 : 1
  const holdProgress = progress >= 0.2 && progress < 0.8 ? (progress - 0.2) / 0.6 : progress >= 0.8 ? 1 : 0
  const exitProgress = progress >= 0.8 ? (progress - 0.8) / 0.2 : 0

  const exitOpacity = exitProgress > 0 ? 1 - easeInCubic(exitProgress) : 1
  const cardSlide = (1 - easeOutCubic(enterProgress)) * 60
  const cardOpacity = easeOutCubic(Math.min(1, enterProgress / 0.4))

  // Scan line animation during hold
  const scanY = holdProgress * 120 - 10

  // Glitch effect
  const frame = Math.floor(progress * 300)
  const isGlitching = Math.sin(frame * 0.15) > 0.92

  return (
    <div style={{ position: 'absolute', inset: 0, overflow: 'hidden' }}>
      <div style={{ position: 'absolute', inset: 0, background: bgColor }} />

      {/* Scan lines overlay */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,255,255,0.015) 2px, rgba(0,255,255,0.015) 3px)',
          pointerEvents: 'none',
        }}
      />

      <div style={{
        position: 'absolute', inset: 0,
        display: 'flex', justifyContent: 'center', alignItems: 'center',
        padding: '6%',
        opacity: exitOpacity,
      }}>
        <div style={{
          width: 'clamp(280px, 75vw, 460px)',
          background: 'linear-gradient(145deg, rgba(10,15,30,0.95), rgba(5,8,20,0.98))',
          border: `1px solid ${accentColor}30`,
          borderRadius: 'clamp(8px, 2vw, 16px)',
          padding: 'clamp(16px, 4vw, 32px)',
          transform: `translateY(${cardSlide}px)`,
          opacity: cardOpacity,
          position: 'relative',
          overflow: 'hidden',
          boxShadow: `0 0 30px ${accentColor}10, inset 0 1px 0 ${accentColor}15`,
        }}>
          {/* Top accent line */}
          <div style={{
            position: 'absolute',
            top: 0, left: 0, right: 0,
            height: 2,
            background: `linear-gradient(90deg, transparent, ${accentColor}, transparent)`,
            boxShadow: `0 0 10px ${accentColor}40`,
          }} />

          {/* Scan line during hold */}
          {progress >= 0.2 && progress < 0.8 && (
            <div style={{
              position: 'absolute',
              left: 0, right: 0,
              top: `${scanY}%`,
              height: 2,
              background: `linear-gradient(90deg, transparent, ${accentColor}30, transparent)`,
              pointerEvents: 'none',
            }} />
          )}

          {/* Header: Avatar + Alias */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: 'clamp(10px, 2vw, 18px)',
            marginBottom: 'clamp(12px, 3vw, 20px)',
            opacity: easeOutCubic(Math.max(0, (enterProgress - 0.1) / 0.9)),
          }}>
            {/* Cyber avatar placeholder */}
            <div style={{
              width: 'clamp(44px, 10vw, 64px)',
              height: 'clamp(44px, 10vw, 64px)',
              borderRadius: 'clamp(6px, 1.5vw, 12px)',
              border: `2px solid ${accentColor}60`,
              background: `linear-gradient(135deg, ${accentColor}15, ${accentColor}05)`,
              display: 'flex', justifyContent: 'center', alignItems: 'center',
              fontSize: 'clamp(20px, 5vw, 30px)',
              color: accentColor,
              fontFamily: "'Courier New', monospace",
              fontWeight: 700,
              flexShrink: 0,
              boxShadow: `0 0 15px ${accentColor}15`,
            }}>
              {alias.charAt(0)}
            </div>
            <div>
              <div style={{
                fontFamily: "'Courier New', monospace",
                fontSize: 'clamp(16px, 4vw, 26px)',
                fontWeight: 700,
                color: accentColor,
                textTransform: 'uppercase',
                letterSpacing: 3,
                textShadow: `0 0 8px ${accentColor}40`,
                transform: isGlitching ? 'translateX(2px)' : 'none',
              }}>
                {alias}
              </div>
              <div style={{
                fontFamily: "'Courier New', monospace",
                fontSize: 'clamp(9px, 1.8vw, 12px)',
                color: `${textColor}50`,
                letterSpacing: 1,
                marginTop: 2,
              }}>
                {realName}
              </div>
            </div>
          </div>

          {/* Faction + Status row */}
          <div style={{
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            marginBottom: 'clamp(10px, 2vw, 16px)',
            opacity: easeOutCubic(Math.max(0, (enterProgress - 0.25) / 0.75)),
          }}>
            <div style={{
              fontFamily: "'Courier New', monospace",
              fontSize: 'clamp(9px, 1.6vw, 11px)',
              color: `${textColor}60`,
              textTransform: 'uppercase',
              letterSpacing: 2,
            }}>
              FACTION: <span style={{ color: '#FF00FF' }}>{faction}</span>
            </div>
            <div style={{
              fontFamily: "'Courier New', monospace",
              fontSize: 'clamp(8px, 1.4vw, 10px)',
              color: status === 'ONLINE' ? '#00FF88' : '#FF4444',
              background: status === 'ONLINE' ? 'rgba(0,255,136,0.1)' : 'rgba(255,68,68,0.1)',
              padding: '2px 8px',
              borderRadius: 4,
              border: `1px solid ${status === 'ONLINE' ? 'rgba(0,255,136,0.3)' : 'rgba(255,68,68,0.3)'}`,
              letterSpacing: 1,
            }}>
              {status}
            </div>
          </div>

          {/* Divider */}
          <div style={{
            height: 1,
            background: `linear-gradient(90deg, transparent, ${accentColor}30, transparent)`,
            marginBottom: 'clamp(10px, 2vw, 16px)',
          }} />

          {/* Stats grid */}
          {[
            { label: 'LEVEL', value: String(Math.round(level * easeOutCubic(Math.max(0, (enterProgress - 0.35) / 0.65)))), accent: true },
            { label: 'REPUTATION', value: `${Math.round(reputation * easeOutCubic(Math.max(0, (enterProgress - 0.4) / 0.6)))}%`, accent: false },
            { label: 'CYBER CREDITS', value: cyberCredits, accent: false },
            { label: 'IMPLANTS', value: implants, accent: false },
          ].map((stat, i) => {
            const stagger = easeOutCubic(Math.max(0, (enterProgress - 0.3 - i * 0.08) / 0.5))
            return (
              <div key={i} style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                marginBottom: 'clamp(6px, 1.2vw, 10px)',
                opacity: stagger,
                transform: `translateX(${(1 - stagger) * 20}px)`,
              }}>
                <div style={{
                  fontFamily: "'Courier New', monospace",
                  fontSize: 'clamp(8px, 1.4vw, 10px)',
                  color: `${textColor}50`,
                  textTransform: 'uppercase',
                  letterSpacing: 2,
                }}>
                  {stat.label}
                </div>
                <div style={{
                  fontFamily: "'Courier New', monospace",
                  fontSize: 'clamp(12px, 2.5vw, 18px)',
                  fontWeight: 700,
                  color: stat.accent ? accentColor : textColor,
                  textShadow: stat.accent ? `0 0 8px ${accentColor}40` : 'none',
                }}>
                  {stat.value}
                </div>
              </div>
            )
          })}

          {/* Bottom accent */}
          <div style={{
            position: 'absolute',
            bottom: 0, left: 0, right: 0,
            height: 1,
            background: `linear-gradient(90deg, transparent, ${accentColor}20, transparent)`,
          }} />
        </div>
      </div>
    </div>
  )
}

registerMotionGraphic({
  id: 'tpl-scene-cyber-profile',
  title: 'Cyber Profile Card',
  description: 'Cyberpunk character profile card with alias, faction, level, reputation stats, and neon accents on dark background',
  tags: ['scene', 'cyberpunk', 'profile', 'character', 'hacker', 'neon', 'futuristic'],
  category: 'scene-layout',
  component: SceneCyberProfileComponent as any,
  defaultConfig: {
    alias: 'GHOST_7X',
    realName: 'Unknown Identity',
    faction: 'NETRUNNERS',
    level: 47,
    reputation: 89,
    cyberCredits: '\u00a5284,500',
    implants: 'TIER-3',
    status: 'ONLINE',
    bgColor: '#06090e',
    accentColor: '#00FFFF',
    textColor: '#e0e4ea',
  },
  configSchema: [
    { key: 'alias', label: 'Alias', type: 'text', defaultValue: 'GHOST_7X', group: 'Content' },
    { key: 'realName', label: 'Real Name', type: 'text', defaultValue: 'Unknown Identity', group: 'Content' },
    { key: 'faction', label: 'Faction', type: 'text', defaultValue: 'NETRUNNERS', group: 'Content' },
    { key: 'level', label: 'Level', type: 'number', defaultValue: 47, min: 1, max: 100, group: 'Stats' },
    { key: 'reputation', label: 'Reputation %', type: 'number', defaultValue: 89, min: 0, max: 100, group: 'Stats' },
    { key: 'cyberCredits', label: 'Credits', type: 'text', defaultValue: '\u00a5284,500', group: 'Stats' },
    { key: 'implants', label: 'Implants', type: 'text', defaultValue: 'TIER-3', group: 'Stats' },
    { key: 'status', label: 'Status', type: 'text', defaultValue: 'ONLINE', group: 'Content' },
    { key: 'bgColor', label: 'Background', type: 'color', defaultValue: '#06090e', group: 'Style' },
    { key: 'accentColor', label: 'Accent', type: 'color', defaultValue: '#00FFFF', group: 'Style' },
    { key: 'textColor', label: 'Text Color', type: 'color', defaultValue: '#e0e4ea', group: 'Style' },
  ],
})
